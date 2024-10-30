import type * as Party from "partykit/server";
import { type GameState, type Option, type Team } from "../../common/types";
import {
  type WebSocketAction,
  type WebSocketResponse,
} from "../../common/events";

const initialState = {
  timeRemaining: 60000,
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
  state: GameState = { ...initialState };

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
      case "undoOption":
        const playerIndex = this.state.teams[data.teamId].players.findIndex(
          (player: Team["players"][number]) => {
            return player.email === data.playerId;
          }
        );

        if (playerIndex === -1) {
          return;
        }

        this.state.teams[data.teamId].players[playerIndex].choices[
          this.state.currentQuoteIndex
        ] = data.option;

        const previousPhonePosition =
          this.state.teams[data.teamId].players[playerIndex].phonePosition;

        let phonePosition: Team["players"][number]["phonePosition"];

        switch (data.type) {
          case "rejectOption":
            phonePosition = "faceDown";
            break;
          default:
            phonePosition = "faceUp";
            break;
        }

        if (previousPhonePosition !== phonePosition) {
          this.state.teams[data.teamId].players[playerIndex].phonePosition =
            phonePosition;
          this.broadcastToAllClients({
            type: "state",
            state: this.state,
          });
        }

        const team = this.state.teams[data.teamId];
        const allDecided = team.players.every(
          (player: Team["players"][number]) =>
            player.choices[this.state.currentQuoteIndex] &&
            player.choices[this.state.currentQuoteIndex].status !== "undecided"
        );

        if (!allDecided) return;

        const choices = team.players.map(
          (player: Team["players"][number]) =>
            player.choices[this.state.currentQuoteIndex]
        );

        const acceptedCount = choices.filter(
          (choice: Option) => choice.status === "accepted"
        ).length;

        const rejectedCount = choices.filter(
          (choice: Option) => choice.status === "rejected"
        ).length;

        if (acceptedCount !== 1 || rejectedCount !== choices.length - 1) {
          return;
        }

        const correctOption =
          this.state.quotes[this.state.currentQuoteIndex].options[
            this.state.quotes[this.state.currentQuoteIndex].correctOptionIndex
          ];

        const acceptedChoice = choices.find(
          (choice: Option) => choice.status === "accepted"
        );

        this.state.teamAnswers[this.state.currentQuoteIndex] = {
          [data.teamId]: this.state.quotes[
            this.state.currentQuoteIndex
          ].options.indexOf(acceptedChoice?.value ?? ""),
        };

        if (acceptedChoice && acceptedChoice.value === correctOption) {
          team.score += this.state.timeRemaining / 1000;
          this.broadcastToAllClients({
            type: "state",
            state: this.state,
          });
        }

        if (this.state.currentQuoteIndex === this.state.quotes.length - 1) {
          this.state.gameEndedAt = Date.now();
          clearInterval(this.timeRemainingInterval!);
          this.broadcastToAllClients({ type: "state", state: this.state });
          return;
        }

        this.broadcastToAllClients({
          type: "state",
          state: this.state,
        });
        return;
      case "nextQuote":
        this.startTimer();
        this.state.currentQuoteIndex++;
        this.broadcastToAllClients({ type: "state", state: this.state });
        return;
      case "resetGame":
        this.state = { ...initialState };
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

  broadcastToSingleClient = (message: WebSocketResponse, clientId: string) => {
    this.room.broadcast(
      JSON.stringify(message),
      Array.from(this.room.getConnections())
        .filter((c) => c.id !== clientId)
        .map((c) => c.id)
    );
  };

  startTimer = () => {
    if (this.timeRemainingInterval) {
      clearInterval(this.timeRemainingInterval);
    }
    this.state.timeRemaining = 60000;
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
