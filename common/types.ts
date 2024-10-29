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
    phonePosition: "faceUp" | "faceDown";
    choices: Record<string, Option>;
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
  timeRemaining: number;
  isGameStarted: boolean;
  gameEndedAt: number | null;
  teamAnswers: Record<string, number>[];
};
