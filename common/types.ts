import type { backends } from "./util";

export type Option = {
  value: string;
  status: "accepted" | "rejected" | "undecided";
};

export type Team = {
  id: string;
  score: number;
  players: {
    id: string;
    email: string;
    phonePosition: "faceUp" | "faceDown" | null;
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

export type GameOptions = {
  backend: (typeof backends)[number];
};
