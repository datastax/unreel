import type * as Party from "partykit/server";
import { type Quote, type Team } from "../../common/types";

export default class Server implements Party.Server {
  constructor(readonly room: Party.Room) {}

  quotes: Quote[] = [];
  teams: Record<number, Team> = {
    1: { score: 0, players: [] },
    2: { score: 0, players: [] },
    3: { score: 0, players: [] },
    4: { score: 0, players: [] },
  };
  currentQuoteIndex: number = 0;

  onConnect(conn: Party.Connection, ctx: Party.ConnectionContext) {
    console.log(
      `Connected:
  id: ${conn.id}
  room: ${this.room.id}
  url: ${new URL(ctx.request.url).pathname}`
    );
  }

  onMessage = async (message: string, sender: Party.Connection) => {
    const data = JSON.parse(message);
    console.log("Got event", data);
    switch (data.type) {
      case "getTeams":
        this.broadcastToSingleClient(
          JSON.stringify({ type: "teams", teams: this.teams }),
          sender.id
        );
        return;
      case "joinTeam":
        this.teams[data.teamId].players.push({
          id: sender.id,
          email: data.email,
          choices: {},
        });
        this.room.broadcast(
          JSON.stringify({ type: "playerJoined", teams: this.teams })
        );
        return;
      case "leaveTeam":
        this.teams[data.teamId].players = this.teams[
          data.teamId
        ].players.filter((player) => player.id !== sender.id);
        this.room.broadcast(
          JSON.stringify({ type: "playerLeft", teams: this.teams })
        );
        return;
      case "startGame":
        this.quotes = await getQuotes();
        this.currentQuoteIndex = 0;
        this.room.broadcast(
          JSON.stringify({
            type: "gameStarted",
            currentPlayerCounts: Object.fromEntries(
              Object.entries(this.teams).map(([teamId, team]) => [
                teamId,
                team.players.length,
              ])
            ),
            quotes: this.quotes,
            currentQuoteIndex: this.currentQuoteIndex,
          })
        );
        return;
      case "getQuotes":
        this.broadcastToSingleClient(
          JSON.stringify({
            type: "quotes",
            quotes: this.quotes,
            currentQuoteIndex: this.currentQuoteIndex,
          }),
          sender.id
        );
        return;
      case "rejectOption":
      case "acceptOption":
      case "undoOption":
        console.log(`Processing ${data.type} for team ${data.teamId}`);
        const playerIndex = this.teams[data.teamId].players.findIndex(
          (player) => {
            return player.email === data.playerId;
          }
        );

        console.log(`Player index: ${playerIndex}`);
        if (playerIndex === -1) {
          console.log(`Player not found in team ${data.teamId}`);
          return;
        }

        this.teams[data.teamId].players[playerIndex].choices[
          this.currentQuoteIndex
        ] = data.option;
        console.log(`Updated player choice: ${JSON.stringify(data.option)}`);

        this.room.broadcast(
          JSON.stringify({
            type: "options",
            teams: this.teams,
          })
        );
        console.log(`Broadcasted updated options for team ${data.teamId}`);

        const team = this.teams[data.teamId];
        const allDecided = team.players.every(
          (player) =>
            player.choices[this.currentQuoteIndex] &&
            player.choices[this.currentQuoteIndex].status !== "undecided"
        );
        console.log(`All players decided: ${allDecided}`);

        if (!allDecided) return;

        const choices = team.players.map(
          (player) => player.choices[this.currentQuoteIndex]
        );
        const acceptedCount = choices.filter(
          (choice) => choice.status === "accepted"
        ).length;
        const rejectedCount = choices.filter(
          (choice) => choice.status === "rejected"
        ).length;
        console.log(`Accepted: ${acceptedCount}, Rejected: ${rejectedCount}`);

        if (acceptedCount !== 1 || rejectedCount !== choices.length - 1) {
          console.log("Invalid choice distribution, returning");
          return;
        }

        const correctOption =
          this.quotes[this.currentQuoteIndex].options[
            this.quotes[this.currentQuoteIndex].correctOptionIndex
          ];
        const acceptedChoice = choices.find(
          (choice) => choice.status === "accepted"
        );
        console.log(
          `Correct option: ${correctOption}, Accepted choice: ${acceptedChoice?.value}`
        );

        if (acceptedChoice && acceptedChoice.value === correctOption) {
          team.score += 1;
          console.log(`Team ${data.teamId} score increased to ${team.score}`);
          this.room.broadcast(
            JSON.stringify({
              type: "updateTeamScore",
              teams: this.teams,
            })
          );
        }

        if (this.currentQuoteIndex === this.quotes.length - 1) {
          console.log("Game over, broadcasting gameOver event");
          this.room.broadcast(JSON.stringify({ type: "gameOver" }));
          return;
        }

        console.log(`Broadcasting roundDecided for team ${data.teamId}`);
        this.room.broadcast(
          JSON.stringify({
            type: "roundDecided",
            teamId: data.teamId,
            score: team.score,
          })
        );
        return;
      case "forfeit": {
        this.teams[data.teamId].players.forEach((player) => {
          player.choices[this.currentQuoteIndex] = {
            value: "Forfeited",
            status: "undecided",
          };
        });
        this.room.broadcast(
          JSON.stringify({
            type: "options",
            teams: this.teams,
          })
        );
        this.room.broadcast(
          JSON.stringify({
            type: "roundDecided",
            teamId: data.teamId,
            score: this.teams[data.teamId].score,
          })
        );
        return;
      }
      case "getQuote":
        this.broadcastToSingleClient(
          JSON.stringify({
            type: "getQuote",
            quote: this.quotes[this.currentQuoteIndex],
          }),
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
        console.log("Unknown message type", data.type);
    }
  };

  broadcastToSingleClient = (message: string, clientId: string) => {
    this.room.broadcast(
      message,
      Array.from(this.room.getConnections())
        .filter((c) => c.id !== clientId)
        .map((c) => c.id)
    );
  };

  sendNextQuote = () => {
    if (this.currentQuoteIndex === this.quotes.length - 1) {
      this.room.broadcast(JSON.stringify({ type: "gameOver" }));
      return;
    }

    this.currentQuoteIndex++;
    const nextQuote = this.quotes[this.currentQuoteIndex];
    this.room.broadcast(
      JSON.stringify({ type: "nextQuote", quote: nextQuote })
    );
  };

  resetGame = () => {
    this.teams = {
      1: { score: 0, players: [] },
      2: { score: 0, players: [] },
      3: { score: 0, players: [] },
      4: { score: 0, players: [] },
    };
    this.currentQuoteIndex = 0;
    this.quotes = [];
    this.room.broadcast(JSON.stringify({ type: "resetGame" }));
  };
}

const getQuotes = async () => [
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

Server satisfies Party.Worker;
