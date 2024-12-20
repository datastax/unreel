import type { backends } from "./util";

export type Option = {
  value: string;
  status: "accepted" | "rejected" | "undecided";
};

export type Team = {
  id: string;
  score: number;
  previousRoundScore: number;
  players: {
    id: string;
    email: string;
    phonePosition: "faceUp" | "faceDown";
    choices: Record<string, Option>;
    hasMotion: boolean;
  }[];
};

export type Quote = {
  quote: string;
  options: string[];
  correctOptionIndex: number;
};

export type GameState = {
  teams: Record<string, Team>;
  quotes: Quote[];
  currentQuoteIndex: number;
  isRoundDecided: boolean;
  timeRemaining: number;
  isGameStarted: boolean;
  gameEndedAt: number | null;
  teamAnswers: Record<string, number>[];
};

export type BackendOptions = (typeof backends)[number];

export type GameOptions = {
  backend: BackendOptions;
  numberOfQuestions: number;
  roundDurationMs: number;
};
