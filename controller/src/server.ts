import type * as Party from "partykit/server";
import {
  backends,
  type GameOptions,
  type GameState,
  type Team,
} from "../../common/types";
import {
  type WebSocketAction,
  type WebSocketResponse,
} from "../../common/events";
import { roundDurationMs } from "../../common/util";
import { getQuotes } from "./util/getQuotes";
import { ensureCorrectAnswerInClampedOptionset } from "./util/ensureCorrectAnswerInClampedOptionset";

const initialState: GameState = {
  timeRemaining: roundDurationMs,
  quotes: [],
  teams: {
    1: { id: "1", score: 0, players: [] },
    2: { id: "2", score: 0, players: [] },
    3: { id: "3", score: 0, players: [] },
    4: { id: "4", score: 0, players: [] },
  },
  isRoundDecided: false,
  currentQuoteIndex: 0,
  isGameStarted: false,
  gameEndedAt: null,
  teamAnswers: [],
};

const initialOptions: GameOptions = {
  backend: backends[0],
};

export default class Server implements Party.Server {
  timeRemainingInterval: NodeJS.Timeout | null = null;
  roundCheckerInterval: NodeJS.Timeout | null = null;
  isNextRoundQueued: boolean = false;
  isGameStartedQueued: boolean = false;
  state: GameState = Object.assign({}, initialState);
  gameOptions: GameOptions = Object.assign({}, initialOptions);

  constructor(readonly room: Party.Room) {
    this.roundCheckerInterval = setInterval(() => {
      this.checkRound();
    }, 1000);
  }

  async onRequest(request: Party.Request) {
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
      this.gameOptions.backend = backend;
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
    const data = JSON.parse(message) as WebSocketAction;
    switch (data.type) {
      case "getState":
        this.broadcastToSingleClient(
          {
            type: "state",
            state: this.state,
          },
          sender.id
        );
        return;
      case "joinTeam":
        const existingPlayerIndex = this.state.teams[
          data.teamId
        ].players.findIndex((player) => player.email === data.email);
        if (existingPlayerIndex !== -1) {
          // Update existing player's id if they reconnect
          this.state.teams[data.teamId].players[existingPlayerIndex].id =
            sender.id;
        } else {
          // Add new player if they don't exist
          this.state.teams[data.teamId].players.push({
            id: sender.id,
            email: data.email,
            phonePosition: null,
            choices: {},
            hasMotion: data.hasMotion,
          });
        }
        this.broadcastToAllClients({ type: "state", state: this.state });
        return;
      case "leaveTeam":
        Object.values(this.state.teams).forEach((team) => {
          team.players = team.players.filter(
            (player: Team["players"][number]) => player.id !== data.playerId
          );
        });
        this.broadcastToAllClients({ type: "state", state: this.state });
        return;
      case "startGame":
        if (this.isGameStartedQueued) {
          return;
        }
        this.isGameStartedQueued = true;
        this.state.quotes = ensureCorrectAnswerInClampedOptionset(
          await getQuotes(this.gameOptions.backend),
          Math.max(
            ...Object.values(this.state.teams).map(
              (team) => team.players.length
            )
          )
        );
        this.state.currentQuoteIndex = -1;
        this.state.isGameStarted = true;
        this.isGameStartedQueued = false;
        this.sendNextQuote();
        return;
      case "updatePhonePosition":
        this.state.teams[data.teamId].players[data.playerIndex].phonePosition =
          data.phonePosition;
        return;
      case "rejectOption":
      case "acceptOption":
        // Identify the player
        const playerIndex = this.state.teams[data.teamId].players.findIndex(
          (player) => player.id === data.playerId
        );

        const player = this.state.teams[data.teamId].players[playerIndex];

        if (!player) {
          return;
        }

        // Update the player's choice
        player.choices[this.state.currentQuoteIndex] = {
          value:
            this.state.quotes[this.state.currentQuoteIndex].options[
              playerIndex
            ],
          status: data.type === "acceptOption" ? "accepted" : "rejected",
        };

        // Broadcast the updated state (just for the admin UI)
        this.broadcastToAllClients({
          type: "state",
          state: this.state,
        });

        // Check if all players have made a choice
        const allPlayersHaveMadeChoice = this.state.teams[
          data.teamId
        ].players.every(
          (player) => player.choices[this.state.currentQuoteIndex]
        );

        if (!allPlayersHaveMadeChoice) {
          return;
        }

        // Check each team for exactly one accepted choice and update answers
        Object.values(this.state.teams).forEach((team) => {
          const playersWithAcceptedChoice = team.players.filter(
            (player) =>
              player.choices[this.state.currentQuoteIndex]?.status ===
              "accepted"
          );

          if (playersWithAcceptedChoice.length === 1) {
            // Found team with exactly one accepted choice
            if (!this.state.teamAnswers[this.state.currentQuoteIndex]) {
              this.state.teamAnswers[this.state.currentQuoteIndex] = {};
            }

            // Update that team's answer
            this.state.teamAnswers[this.state.currentQuoteIndex][team.id] =
              this.state.quotes[this.state.currentQuoteIndex].options.findIndex(
                (option) =>
                  option ===
                  playersWithAcceptedChoice[0].choices[
                    this.state.currentQuoteIndex
                  ].value
              );
          }
        });

        // Check if the answer is correct
        const isAnswerCorrect =
          this.state.teamAnswers[this.state.currentQuoteIndex][data.teamId] ===
          this.state.quotes[this.state.currentQuoteIndex].correctOptionIndex;

        if (isAnswerCorrect) {
          // Add base points for correct answer plus first team bonus
          const isFirstTeamToAnswer =
            Object.keys(this.state.teamAnswers[this.state.currentQuoteIndex])
              .length === 1;
          const firstTeamBonus = isFirstTeamToAnswer ? 10 : 0;
          this.state.teams[data.teamId].score +=
            this.state.timeRemaining / 1000 + firstTeamBonus;
        }

        // Send the updated state to the clients
        this.broadcastToAllClients({
          type: "state",
          state: this.state,
        });

        return;
      case "nextQuote":
        this.isNextRoundQueued = false;
        this.sendNextQuote();
        return;
      case "resetGame":
        clearInterval(this.timeRemainingInterval!);
        this.state = Object.assign({}, initialState);
        this.state.teamAnswers = [];
        this.state.quotes = [];
        this.state.currentQuoteIndex = 0;
        this.state.teams = {
          1: { id: "1", score: 0, players: [] },
          2: { id: "2", score: 0, players: [] },
          3: { id: "3", score: 0, players: [] },
          4: { id: "4", score: 0, players: [] },
        };
        this.broadcastToAllClients({ type: "state", state: this.state });
        return;
      case "forfeit": {
        this.state.teams[data.teamId].players.forEach(
          (player: Team["players"][number]) => {
            player.choices[this.state.currentQuoteIndex] = {
              value: "Forfeited",
              status: "undecided",
            };
          }
        );
        this.state.teamAnswers[this.state.currentQuoteIndex] = {
          [data.teamId]: -1,
        };
        this.broadcastToAllClients({
          type: "state",
          state: this.state,
        });
        return;
      }
      default:
        console.log("Unknown message type", data);
    }
  };

  sendNextQuote = () => {
    this.isNextRoundQueued = false;
    const nextQuoteIndex = this.state.currentQuoteIndex + 1;

    if (nextQuoteIndex >= this.state.quotes.length) {
      this.state.gameEndedAt = Date.now();
      this.broadcastToAllClients({ type: "state", state: this.state });
      return;
    }

    // Set all players to accept the next quote
    Object.values(this.state.teams).forEach((team) => {
      team.players.forEach((player, index) => {
        player.choices[nextQuoteIndex] = {
          value: this.state.quotes[nextQuoteIndex].options[index],
          status: "accepted",
        };
      });
    });

    this.startTimer();
    this.state.currentQuoteIndex = nextQuoteIndex;
    this.broadcastToAllClients({ type: "state", state: this.state });
  };

  startTimer = () => {
    if (this.timeRemainingInterval) {
      clearInterval(this.timeRemainingInterval);
    }
    this.state.timeRemaining = roundDurationMs;
    this.timeRemainingInterval = setInterval(() => {
      if (this.state.timeRemaining <= 0) {
        clearInterval(this.timeRemainingInterval!);
        return;
      }
      this.state.timeRemaining -= 1000;
      this.broadcastToAllClients({
        type: "state",
        state: this.state,
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
    if (!this.state.isGameStarted) {
      return;
    }

    if (this.isNextRoundQueued) {
      return;
    }

    const allPhonesAreFaceUp = Object.values(this.state.teams)
      .flatMap((team) => team.players)
      .every((player) => player.phonePosition === "faceUp");

    if (this.state.isRoundDecided && !allPhonesAreFaceUp) {
      return;
    }

    if (this.state.isRoundDecided && allPhonesAreFaceUp) {
      this.isNextRoundQueued = true;
      // await new Promise((resolve) => setTimeout(resolve, 5000));
      this.state.isRoundDecided = false;
      this.sendNextQuote();
      return;
    }

    if (this.state.isRoundDecided) {
      return;
    }

    const teamsThatHavePlayers = Object.values(this.state.teams).filter(
      (team) => team.players.length > 0
    );

    if (
      teamsThatHavePlayers.every(
        (team) =>
          this.state.teamAnswers[this.state.currentQuoteIndex][team.id] !==
          undefined
      )
    ) {
      this.state.isRoundDecided = true;
      this.broadcastToAllClients({ type: "state", state: this.state });
    }
  };
}

Server satisfies Party.Worker;
