import type * as Party from "partykit/server";
import { type GameState, type Option, type Team } from "../../common/types";
import {
  type WebSocketAction,
  type WebSocketResponse,
} from "../../common/events";
import { fallbackQuotes, roundDurationMs } from "../../common/util";
const initialState = {
  timeRemaining: roundDurationMs,
  quotes: [],
  teams: {
    1: { id: "1", score: 0, players: [] },
    2: { id: "2", score: 0, players: [] },
    3: { id: "3", score: 0, players: [] },
    4: { id: "4", score: 0, players: [] },
  },
  currentQuoteIndex: 0,
  isGameStarted: false,
  gameEndedAt: null,
  teamAnswers: [],
};

export default class Server implements Party.Server {
  constructor(readonly room: Party.Room) {}
  timeRemainingInterval: NodeJS.Timeout | null = null;
  state: GameState = Object.assign({}, initialState);

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
            phonePosition: "faceUp",
            choices: {},
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
        this.state.quotes = await getQuotes();
        this.state.currentQuoteIndex = 0;
        this.startTimer();
        this.state.isGameStarted = true;
        this.broadcastToAllClients({
          type: "state",
          state: this.state,
        });
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

        // Update the player's phone face
        player.phonePosition =
          data.type === "acceptOption" ? "faceUp" : "faceDown";

        // Broadcast the updated state (just for the admin UI)
        this.broadcastToAllClients({
          type: "state",
          state: this.state,
        });

        // Check if all players have made a choice
        const allPlayersHaveMadeChoice = Object.values(
          this.state.teams[data.teamId].players
        ).every((player) => player.choices[this.state.currentQuoteIndex]);

        if (!allPlayersHaveMadeChoice) {
          return;
        }

        // Check for only one accepted choice
        const playerWithAcceptedChoice = Object.values(
          this.state.teams[data.teamId].players
        ).filter(
          (player) =>
            player.choices[this.state.currentQuoteIndex].status === "accepted"
        );

        if (playerWithAcceptedChoice.length !== 1) {
          return;
        }

        // Update the team's answer
        this.state.teamAnswers[this.state.currentQuoteIndex] = {
          [data.teamId]: this.state.quotes[
            this.state.currentQuoteIndex
          ].options.findIndex(
            (o) =>
              o ===
              playerWithAcceptedChoice[0].choices[this.state.currentQuoteIndex]
                .value
          ),
        };

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

        if (this.state.currentQuoteIndex === this.state.quotes.length - 1) {
          this.state.gameEndedAt = Date.now();
          this.broadcastToAllClients({
            type: "state",
            state: this.state,
          });
          return;
        }

        // Check if all teams with players have answered
        const allTeamsHaveAnswered = Object.values(this.state.teams)
          .filter((team) => team.players.length > 0)
          .every(
            (team) =>
              this.state.teamAnswers[this.state.currentQuoteIndex][team.id] !==
              undefined
          );

        const allPhonesAreFaceUp = Object.values(this.state.teams).every(
          (team) =>
            team.players.every((player) => player.phonePosition === "faceUp")
        );

        if (allTeamsHaveAnswered && allPhonesAreFaceUp) {
          this.sendNextQuote();
          return;
        }

        return;
      case "nextQuote":
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
      case "resetPhonePosition":
        Object.values(this.state.teams).forEach((team) => {
          team.players.forEach((player) => {
            player.phonePosition = null;
          });
        });
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
    if (this.state.currentQuoteIndex >= this.state.quotes.length - 1) {
      this.state.gameEndedAt = Date.now();
      this.broadcastToAllClients({ type: "state", state: this.state });
      return;
    }
    this.startTimer();
    this.state.currentQuoteIndex++;
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
}

function shuffle(array: Array<any>) {
  for (let i = array.length - 1; i > 0; i--) {
    let j = Math.floor(Math.random() * (i + 1)); // random index from 0 to i

    // swap elements array[i] and array[j]
    // we use "destructuring assignment" syntax to achieve that
    // you'll find more details about that syntax in later chapters
    // same can be written as:
    // let t = array[i]; array[i] = array[j]; array[j] = t
    [array[i], array[j]] = [array[j], array[i]];
  }
  return array;
}

const getQuotes = async () => {
  return fallbackQuotes;
  const quotes = await fetch(process.env.LANGFLOW_API_URL!, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${process.env.LANGFLOW_API_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      input_value: "10",
      output_type: "chat",
      input_type: "chat",
      tweaks: {},
    }),
  })
    .then((res) => {
      return res.json();
    })
    .then((data) => {
      console.dir(data, { depth: Infinity });
      const real = JSON.parse(data.outputs[0].outputs[0].results.text.text);
      const fake = JSON.parse(data.outputs[0].outputs[1].results.text.text);
      return shuffle([...real.quotes, ...fake.quotes]);
    });
  return quotes;
};

Server satisfies Party.Worker;
