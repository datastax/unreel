import { type GameState, GameOptions } from "./types";

export const maxPlayersPerTeam = 4;
export const backends = ["Langflow", "Astra"] as const;

export const defaultGameOptions: GameOptions = {
  backend: backends[0],
  numberOfQuestions: 10,
  roundDurationMs: 60000,
};

export const initialState: GameState = {
  timeRemaining: defaultGameOptions.roundDurationMs,
  quotes: [],
  teams: {
    1: { id: "1", score: 0, previousRoundScore: 0, players: [] },
    2: { id: "2", score: 0, previousRoundScore: 0, players: [] },
    3: { id: "3", score: 0, previousRoundScore: 0, players: [] },
    4: { id: "4", score: 0, previousRoundScore: 0, players: [] },
  },
  isRoundDecided: false,
  currentQuoteIndex: 0,
  isGameStarted: false,
  gameEndedAt: null,
  teamAnswers: [],
};

export const fallbackQuotes = [
  {
    quote: "I'll be back",
    options: ["Batman", "Star Wars", "Terminator", "AI Generated"],
    correctOptionIndex: 2,
  },
  {
    quote: "To be or not to be",
    options: ["Romeo", "Hamlet", "AI Generated", "Shakespeare"],
    correctOptionIndex: 1,
  },
  {
    quote: "I'm going to make him an offer he can't refuse",
    options: [
      "The Godfather",
      "AI Generated",
      "The Godfather: Part II",
      "The Wolf of Wall Street",
    ],
    correctOptionIndex: 0,
  },
  {
    quote: "Here's looking at you, kid",
    options: [
      "The Wizard of Oz",
      "Casablanca",
      "Gone with the Wind",
      "AI Generated",
    ],
    correctOptionIndex: 1,
  },
  {
    quote: "May the Force be with you",
    options: ["AI Generated", "Avatar", "Star Trek", "Star Wars"],
    correctOptionIndex: 3,
  },
  {
    quote: "You're gonna need a bigger boat",
    options: ["Finding Nemo", "Jaws", "AI Generated", "Titanic"],
    correctOptionIndex: 1,
  },
  {
    quote: "Elementary, my dear Watson",
    options: [
      "Mission Impossible",
      "AI Generated",
      "Sherlock Holmes",
      "Agatha Christie",
    ],
    correctOptionIndex: 2,
  },
  {
    quote: "Life is like a box of chocolates",
    options: [
      "The Notebook",
      "Charlie and the Chocolate Factory",
      "Forrest Gump",
      "AI Generated",
    ],
    correctOptionIndex: 2,
  },
  {
    quote: "I see dead people",
    options: ["Ghost", "The Sixth Sense", "AI Generated", "Poltergeist"],
    correctOptionIndex: 1,
  },
  {
    quote: "Say hello to my little friend",
    options: ["AI Generated", "Goodfellas", "Casino", "Scarface"],
    correctOptionIndex: 3,
  },
];
