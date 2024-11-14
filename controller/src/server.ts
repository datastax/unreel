import type * as Party from "partykit/server";
import {
  type GameOptions,
  type GameState,
  type Team,
} from "../../common/types";
import {
  type WebSocketAction,
  type WebSocketResponse,
} from "../../common/events";
import { roundDurationMs, initialState, backends } from "../../common/util";
import { getQuotes } from "./util/getQuotes";
import { ensureCorrectAnswerInClampedOptionset } from "./util/ensureCorrectAnswerInClampedOptionset";
import { storePlayersInDb } from "./util/storePlayersInDb";

type RoomState = {
  timeRemainingInterval: NodeJS.Timeout | null;
  roundCheckerInterval: NodeJS.Timeout | null;
  isNextRoundQueued: boolean;
  isGameStartedQueued: boolean;
  state: GameState;
  gameOptions: GameOptions;
};

type RoomStates = Record<string, RoomState>;

const initialOptions: GameOptions = {
  backend: backends[0],
};

export default class Server implements Party.Server {
  roomStates: RoomStates = {};

  constructor(readonly room: Party.Room) {
    this.roomStates[room.id] = {
      timeRemainingInterval: null,
      roundCheckerInterval: setInterval(() => {
        this.checkRound();
      }, 1000),
      isNextRoundQueued: false,
      isGameStartedQueued: false,
      state: structuredClone(initialState),
      gameOptions: structuredClone(initialOptions),
    };
  }

  async onRequest(request: Party.Request) {
    // get all messages
    if (request.method === "OPTIONS") {
      return new Response("", {
        headers: {
          "Access-Control-Allow-Origin": "*",
          "Access-Control-Allow-Methods": "GET, OPTIONS",
          "Access-Control-Allow-Headers": "*",
        },
      });
    }
    if (request.method === "GET") {
      const url = new URL(request.url);
      const backend =
        (url.searchParams.get("backend") as (typeof backends)[number]) ??
        backends[0];
      this.roomStates[this.room.id].gameOptions.backend = backend;
      return new Response(
        JSON.stringify(Array.from(this.room.getConnections()).map((e) => e.id)),
        {
          headers: {
            "Content-Type": "application/json",
            "Access-Control-Allow-Origin": "*",
          },
        }
      );
    }

    return new Response("Method not allowed", { status: 405 });
  }

  onConnect(conn: Party.Connection, ctx: Party.ConnectionContext) {
    console.log(
      `Connected:
  id: ${conn.id}
  room: ${this.room.id}
  url: ${new URL(ctx.request.url).pathname}`
    );
  }

  onMessage = async (message: string, sender: Party.Connection) => {
    const roomState = this.roomStates[this.room.id];
    const data = JSON.parse(message) as WebSocketAction;
    switch (data.type) {
      case "getState":
        this.broadcastToSingleClient(
          {
            type: "state",
            state: roomState.state,
          },
          sender.id
        );
        return;
      case "joinTeam":
        const existingPlayerIndex = roomState.state.teams[
          data.teamId
        ].players.findIndex((player) => player.email === data.email);
        if (existingPlayerIndex !== -1) {
          // Update existing player's id if they reconnect
          roomState.state.teams[data.teamId].players[existingPlayerIndex].id =
            sender.id;
        } else {
          // Add new player if they don't exist
          roomState.state.teams[data.teamId].players.push({
            id: sender.id,
            email: data.email,
            phonePosition: null,
            choices: {},
            hasMotion: data.hasMotion,
          });
        }
        this.broadcastToAllClients({ type: "state", state: roomState.state });
        return;
      case "leaveTeam":
        Object.values(roomState.state.teams).forEach((team) => {
          team.players = team.players.filter(
            (player: Team["players"][number]) => player.id !== data.playerId
          );
        });
        this.broadcastToAllClients({ type: "state", state: roomState.state });
        return;
      case "startGame":
        if (roomState.isGameStartedQueued) {
          return;
        }
        roomState.isGameStartedQueued = true;
        roomState.state.quotes = ensureCorrectAnswerInClampedOptionset(
          await getQuotes(roomState.gameOptions.backend),
          Math.max(
            ...Object.values(roomState.state.teams).map(
              (team) => team.players.length
            )
          )
        );
        roomState.state.currentQuoteIndex = -1;
        roomState.state.isGameStarted = true;
        roomState.isGameStartedQueued = false;
        // Add players to database
        // Don't need to wait, this can be fire and forget
        storePlayersInDb(Object.values(roomState.state.teams));
        this.sendNextQuote();
        return;
      case "updatePhonePosition":
        roomState.state.teams[data.teamId].players[
          data.playerIndex
        ].phonePosition = data.phonePosition;
        return;
      case "rejectOption":
      case "acceptOption":
        // Identify the player
        const playerIndex = roomState.state.teams[
          data.teamId
        ].players.findIndex((player) => player.id === data.playerId);

        const player = roomState.state.teams[data.teamId].players[playerIndex];

        if (!player) {
          return;
        }

        // Update the player's choice
        player.choices[roomState.state.currentQuoteIndex] = {
          value:
            roomState.state.quotes[roomState.state.currentQuoteIndex].options[
              playerIndex
            ],
          status: data.type === "acceptOption" ? "accepted" : "rejected",
        };

        // Broadcast the updated state (just for the admin UI)
        this.broadcastToAllClients({
          type: "state",
          state: roomState.state,
        });

        // Check if all players have made a choice
        const allPlayersHaveMadeChoice = roomState.state.teams[
          data.teamId
        ].players.every(
          (player) => player.choices[roomState.state.currentQuoteIndex]
        );

        if (!allPlayersHaveMadeChoice) {
          return;
        }

        // Check each team for exactly one accepted choice and update answers
        Object.values(roomState.state.teams).forEach((team) => {
          const playersWithAcceptedChoice = team.players.filter(
            (player) =>
              player.choices[roomState.state.currentQuoteIndex]?.status ===
              "accepted"
          );

          if (playersWithAcceptedChoice.length === 1) {
            // Found team with exactly one accepted choice
            if (
              !roomState.state.teamAnswers[roomState.state.currentQuoteIndex]
            ) {
              roomState.state.teamAnswers[roomState.state.currentQuoteIndex] =
                {};
            }

            // Update that team's answer
            roomState.state.teamAnswers[roomState.state.currentQuoteIndex][
              team.id
            ] = roomState.state.quotes[
              roomState.state.currentQuoteIndex
            ].options.findIndex(
              (option) =>
                option ===
                playersWithAcceptedChoice[0].choices[
                  roomState.state.currentQuoteIndex
                ].value
            );
          }
        });

        // Check if the answer is correct
        const isAnswerCorrect =
          roomState.state.teamAnswers[roomState.state.currentQuoteIndex][
            data.teamId
          ] ===
          roomState.state.quotes[roomState.state.currentQuoteIndex]
            .correctOptionIndex;

        if (isAnswerCorrect) {
          // Add base points for correct answer plus first team bonus
          const isFirstTeamToAnswer =
            Object.keys(
              roomState.state.teamAnswers[roomState.state.currentQuoteIndex]
            ).length === 1;
          const firstTeamBonus = isFirstTeamToAnswer ? 10 : 0;
          const score = roomState.state.teams[data.teamId].score;
          const roundScore =
            roomState.state.timeRemaining / 1000 + firstTeamBonus;
          const newScore = score + roundScore;
          roomState.state.teams[data.teamId].previousRoundScore = score;
          roomState.state.teams[data.teamId].score = newScore;
        }

        // Send the updated state to the clients
        this.broadcastToAllClients({
          type: "state",
          state: roomState.state,
        });

        return;
      case "nextQuote":
        roomState.isNextRoundQueued = false;
        this.sendNextQuote();
        return;
      case "resetGame":
        clearInterval(roomState.timeRemainingInterval!);
        clearInterval(roomState.roundCheckerInterval!);
        delete this.roomStates[this.room.id];
        this.broadcastToAllClients({ type: "reset" });
        return;
      default:
        console.log("Unknown message type", data);
    }
  };

  sendNextQuote = () => {
    const roomState = this.roomStates[this.room.id];
    roomState.isNextRoundQueued = false;
    const nextQuoteIndex = roomState.state.currentQuoteIndex + 1;

    if (nextQuoteIndex >= roomState.state.quotes.length) {
      roomState.state.gameEndedAt = Date.now();
      roomState.state.isRoundDecided = true;
      this.broadcastToAllClients({ type: "state", state: roomState.state });
      return;
    }

    // Set all players to accept the next quote
    Object.values(roomState.state.teams).forEach((team) => {
      team.players.forEach((player, index) => {
        player.choices[nextQuoteIndex] = {
          value: roomState.state.quotes[nextQuoteIndex].options[index],
          status: "accepted",
        };
      });
      team.previousRoundScore = team.score;
    });

    this.startTimer();
    roomState.state.isRoundDecided = false;
    roomState.state.currentQuoteIndex = nextQuoteIndex;
    this.broadcastToAllClients({ type: "state", state: roomState.state });
  };

  startTimer = () => {
    const roomState = this.roomStates[this.room.id];
    if (roomState.timeRemainingInterval) {
      clearInterval(roomState.timeRemainingInterval);
    }
    roomState.state.timeRemaining = roundDurationMs;
    if (roomState.state.gameEndedAt) {
      return;
    }
    roomState.timeRemainingInterval = setInterval(() => {
      if (roomState.state.timeRemaining <= 0) {
        clearInterval(roomState.timeRemainingInterval!);

        // Time is up, forfeit all teams that haven't answered
        Object.values(roomState.state.teams).forEach((team) => {
          const currentQuoteIndex = roomState.state.currentQuoteIndex;
          const teamAnswers =
            roomState.state.teamAnswers[currentQuoteIndex] || {};

          if (teamAnswers[team.id] || team.players.length === 0) {
            return;
          }
          team.players.forEach((player: Team["players"][number]) => {
            player.choices[currentQuoteIndex] = {
              value: "Forfeited",
              status: "undecided",
            };
          });
          teamAnswers[team.id] = -1;
          roomState.state.teamAnswers[roomState.state.currentQuoteIndex] =
            teamAnswers;
        });

        this.broadcastToAllClients({
          type: "state",
          state: roomState.state,
        });
        return;
      }
      roomState.state.timeRemaining -= 1000;
      this.broadcastToAllClients({
        type: "state",
        state: roomState.state,
      });
    }, 1000);
  };

  broadcastToSingleClient = (message: WebSocketResponse, clientId: string) => {
    this.room.broadcast(
      JSON.stringify(message),
      Array.from(this.room.getConnections())
        .filter((c) => c.id !== clientId)
        .map((c) => c.id)
    );
  };

  broadcastToAllClients = (message: WebSocketResponse) => {
    this.room.broadcast(JSON.stringify(message));
  };

  checkRound = async () => {
    const roomState = this.roomStates[this.room.id];
    if (
      roomState.state.gameEndedAt ||
      roomState.isNextRoundQueued ||
      !roomState.state.isGameStarted
    ) {
      return;
    }

    const allPhonesAreFaceUp = Object.values(roomState.state.teams)
      .flatMap((team) => team.players)
      .every((player) => player.phonePosition === "faceUp");

    if (roomState.state.isRoundDecided && !allPhonesAreFaceUp) {
      return;
    }

    if (roomState.state.isRoundDecided && allPhonesAreFaceUp) {
      roomState.isNextRoundQueued = true;
      // await new Promise((resolve) => setTimeout(resolve, 5000));
      this.sendNextQuote();
      return;
    }

    if (roomState.state.isRoundDecided) {
      return;
    }

    const teamsThatHavePlayers = Object.values(roomState.state.teams).filter(
      (team) => team.players.length > 0
    );

    if (
      teamsThatHavePlayers.every(
        (team) =>
          roomState.state.teamAnswers[roomState.state.currentQuoteIndex][
            team.id
          ] !== undefined
      )
    ) {
      roomState.state.isRoundDecided = true;
      this.broadcastToAllClients({ type: "state", state: roomState.state });
    }
  };
}

Server satisfies Party.Worker;
