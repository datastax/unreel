import type * as Party from "partykit/server";
import { type Option, type Quote, type Team } from "../../common/types";
import {
  type WebSocketAction,
  type WebSocketResponse,
} from "../../common/events";

export default class Server implements Party.Server {
  constructor(readonly room: Party.Room) {}

  timeRemaining: number = 60000;
  quotes: Quote[] = [];
  teams: Record<string, Team> = {
    1: { id: "1", score: 0, players: [] },
    2: { id: "2", score: 0, players: [] },
    3: { id: "3", score: 0, players: [] },
    4: { id: "4", score: 0, players: [] },
  };
  currentQuoteIndex: number = 0;
  timeRemainingInterval: NodeJS.Timeout | null = null;

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
      case "getTeams":
        this.broadcastToSingleClient(
          { type: "teams", teams: this.teams },
          sender.id
        );
        return;
      case "joinTeam":
        this.teams[data.teamId].players.push({
          id: sender.id,
          email: data.email,
          choices: {},
        });
        this.broadcastToAllClients({ type: "playerJoined", teams: this.teams });
        return;
      case "leaveTeam":
        this.teams[data.teamId].players = this.teams[
          data.teamId
        ].players.filter(
          (player: Team["players"][number]) => player.id !== sender.id
        );
        this.broadcastToAllClients({ type: "playerLeft", teams: this.teams });
        return;
      case "startGame":
        this.quotes = await getQuotes();
        this.currentQuoteIndex = 0;
        this.startTimer();
        this.broadcastToAllClients({
          type: "gameStarted",
          currentPlayerCounts: Object.fromEntries(
            Object.entries(this.teams).map(([teamId, team]) => [
              teamId,
              team.players.length,
            ])
          ),
          quotes: this.quotes,
          currentQuoteIndex: this.currentQuoteIndex,
        });
        return;
      case "getQuotes":
        this.broadcastToSingleClient(
          {
            type: "quotes",
            quotes: this.quotes,
            currentQuoteIndex: this.currentQuoteIndex,
          },
          sender.id
        );
        return;
      case "rejectOption":
      case "acceptOption":
      case "undoOption":
        const playerIndex = this.teams[data.teamId].players.findIndex(
          (player: Team["players"][number]) => {
            return player.email === data.playerId;
          }
        );

        if (playerIndex === -1) {
          return;
        }

        this.teams[data.teamId].players[playerIndex].choices[
          this.currentQuoteIndex
        ] = data.option;

        this.broadcastToAllClients({
          type: "options",
          teams: this.teams,
        });

        const team = this.teams[data.teamId];
        const allDecided = team.players.every(
          (player: Team["players"][number]) =>
            player.choices[this.currentQuoteIndex] &&
            player.choices[this.currentQuoteIndex].status !== "undecided"
        );

        if (!allDecided) return;

        const choices = team.players.map(
          (player: Team["players"][number]) =>
            player.choices[this.currentQuoteIndex]
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
          this.quotes[this.currentQuoteIndex].options[
            this.quotes[this.currentQuoteIndex].correctOptionIndex
          ];
        const acceptedChoice = choices.find(
          (choice: Option) => choice.status === "accepted"
        );

        if (acceptedChoice && acceptedChoice.value === correctOption) {
          console.log({ timeRemaining: data });
          team.score += this.timeRemaining / 1000;
          this.broadcastToAllClients({
            type: "updateTeamScore",
            teams: this.teams,
          });
        }

        if (this.currentQuoteIndex === this.quotes.length - 1) {
          this.broadcastToAllClients({ type: "gameOver" });
          return;
        }

        if (this.timeRemainingInterval) {
          clearInterval(this.timeRemainingInterval);
        }

        this.broadcastToAllClients({
          type: "roundDecided",
          teamId: data.teamId,
          score: team.score,
        });
        return;
      case "forfeit": {
        this.teams[data.teamId].players.forEach(
          (player: Team["players"][number]) => {
            player.choices[this.currentQuoteIndex] = {
              value: "Forfeited",
              status: "undecided",
            };
          }
        );
        this.broadcastToAllClients({
          type: "options",
          teams: this.teams,
        });
        if (this.timeRemainingInterval) {
          clearInterval(this.timeRemainingInterval);
        }
        this.broadcastToAllClients({
          type: "roundDecided",
          teamId: data.teamId,
          score: this.teams[data.teamId].score,
        });
        return;
      }
      case "getQuote":
        this.broadcastToSingleClient(
          {
            type: "getQuote",
            quote: this.quotes[this.currentQuoteIndex],
          },
          sender.id
        );
        return;
      case "nextQuote":
        this.sendNextQuote();
        return;
      case "resetGame":
        this.resetGame();
        return;
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

  sendNextQuote = () => {
    if (this.currentQuoteIndex === this.quotes.length - 1) {
      this.broadcastToAllClients({ type: "gameOver" });
      return;
    }

    this.startTimer();
    this.currentQuoteIndex++;
    const nextQuote = this.quotes[this.currentQuoteIndex];
    this.broadcastToAllClients({ type: "nextQuote", quote: nextQuote });
  };

  resetGame = () => {
    this.teams = {
      1: { id: "1", score: 0, players: [] },
      2: { id: "2", score: 0, players: [] },
      3: { id: "3", score: 0, players: [] },
      4: { id: "4", score: 0, players: [] },
    };
    this.currentQuoteIndex = 0;
    this.quotes = [];
    this.broadcastToAllClients({ type: "resetGame" });
  };

  startTimer = () => {
    if (this.timeRemainingInterval) {
      clearInterval(this.timeRemainingInterval);
    }
    this.timeRemaining = 60000;
    this.timeRemainingInterval = setInterval(() => {
      this.timeRemaining -= 1000;
      this.broadcastToAllClients({
        type: "timeRemaining",
        timeRemaining: this.timeRemaining,
      });

      if (this.timeRemaining <= 0) {
        this.broadcastToAllClients({
          type: "roundDecided",
        });
      }
    }, 1000);
  };

  broadcastToAllClients = (message: WebSocketResponse) => {
    this.room.broadcast(JSON.stringify(message));
  };
}

const getQuotes = async () => {
  return [
    {
      quote: "Don't call me Shirley",
      options: ["Airplane", "AI Generated", "Blazing Saddles", "Shirley"],
      correctOptionIndex: 0,
    },
    {
      quote: "I'm going to make him an offer he can't refuse",
      options: ["Goodfellas", "The Godfather", "Casino", "Scarface"],
      correctOptionIndex: 1,
    },
    {
      quote: "Here's looking at you, kid",
      options: [
        "Gone with the Wind",
        "Citizen Kane",
        "The Maltese Falcon",
        "Casablanca",
      ],
      correctOptionIndex: 3,
    },
    {
      quote: "May the Force be with you",
      options: [
        "Star Trek",
        "Battlestar Galactica",
        "Star Wars",
        "The Last Starfighter",
      ],
      correctOptionIndex: 2,
    },
    {
      quote: "You can't handle the truth!",
      options: [
        "The Verdict",
        "Judgment at Nuremberg",
        "12 Angry Men",
        "A Few Good Men",
      ],
      correctOptionIndex: 3,
    },
    {
      quote: "E.T. phone home",
      options: [
        "Close Encounters of the Third Kind",
        "E.T. the Extra-Terrestrial",
        "The Day the Earth Stood Still",
        "Alien",
      ],
      correctOptionIndex: 1,
    },
    {
      quote: "You talkin' to me?",
      options: [
        "Goodfellas",
        "On the Waterfront",
        "Taxi Driver",
        "The Godfather",
      ],
      correctOptionIndex: 2,
    },
    {
      quote: "I'll be back",
      options: ["Predator", "Total Recall", "Commando", "The Terminator"],
      correctOptionIndex: 3,
    },
    {
      quote: "Here's Johnny!",
      options: [
        "Psycho",
        "The Shining",
        "Halloween",
        "A Nightmare on Elm Street",
      ],
      correctOptionIndex: 1,
    },
  ];

  const quotes = await Promise.all(
    Array.from({ length: 10 }, () =>
      fetch(process.env.LANGFLOW_API_URL!, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${process.env.LANGFLOW_API_KEY}`,
          "Content-Type": "application/json",
        },
      })
        .then((res) => res.json())
        .then((data) => {
          return JSON.parse(data.outputs[0].outputs[0].results.text.text);
        })
    )
  );
  return quotes;
};

Server satisfies Party.Worker;
