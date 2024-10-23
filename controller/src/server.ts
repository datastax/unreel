import type * as Party from "partykit/server";
import type { Quote, Team } from "../../common/types";

export default class Server implements Party.Server {
  constructor(readonly room: Party.Room) {}

  quotes: Quote[] = [];
  teams: Record<number, Team> = {
    1: { score: 0, currentOptions: [], players: [] },
    2: { score: 0, currentOptions: [], players: [] },
    3: { score: 0, currentOptions: [], players: [] },
    4: { score: 0, currentOptions: [], players: [] },
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
    switch (data.type) {
      case "getTeams":
        this.broadcastToSingleClient(
          JSON.stringify({ type: "teams", teams: this.teams }),
          sender.id
        );
        break;
      case "joinTeam":
        this.teams[data.teamId].players.push({
          id: sender.id,
          email: data.email,
        });
        this.room.broadcast(
          JSON.stringify({ type: "playerJoined", teams: this.teams })
        );
        break;
      case "leaveTeam":
        this.teams[data.teamId].players = this.teams[
          data.teamId
        ].players.filter((player) => player.id !== sender.id);
        this.room.broadcast(
          JSON.stringify({ type: "playerLeft", teams: this.teams })
        );
        break;
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
        break;
      case "getQuotes":
        this.broadcastToSingleClient(
          JSON.stringify({
            type: "quotes",
            quotes: this.quotes,
            currentQuoteIndex: this.currentQuoteIndex,
          }),
          sender.id
        );
        break;
      case "rejectOption":
      case "acceptOption":
        this.teams[data.teamId].currentOptions.push(data.option);

        if (this.teams[data.teamId].currentOptions.length === 4) {
          const acceptedOptions = this.teams[data.teamId].currentOptions.filter(
            (option) => option.status === "accepted"
          );
          const rejectedOptions = this.teams[data.teamId].currentOptions.filter(
            (option) => option.status === "rejected"
          );

          if (acceptedOptions.length === 1 && rejectedOptions.length === 3) {
            this.room.broadcast(
              JSON.stringify({ type: "roundDecided", team: data.teamId })
            );
          }
        }
        break;
      case "getQuote":
        this.broadcastToSingleClient(
          JSON.stringify({
            type: "getQuote",
            quote: this.quotes[this.currentQuoteIndex],
          }),
          sender.id
        );
        break;
      case "nextQuote":
        this.sendNextQuote();
        break;
      case "resetGame":
        this.resetGame();
        break;
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
      1: { score: 0, currentOptions: [], players: [] },
      2: { score: 0, currentOptions: [], players: [] },
      3: { score: 0, currentOptions: [], players: [] },
      4: { score: 0, currentOptions: [], players: [] },
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
