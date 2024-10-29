import type { Option, Team, Quote } from "./types";

export type WebSocketAction =
  | { type: "getState" }
  | { type: "joinTeam"; teamId: string; email: string }
  | { type: "leaveTeam"; playerId: string }
  | { type: "startGame" }
  | { type: "rejectOption"; teamId: string; option: Option; playerId: string }
  | { type: "acceptOption"; teamId: string; option: Option; playerId: string }
  | { type: "undoOption"; teamId: string; option: Option; playerId: string }
  | { type: "forfeit"; teamId: string }
  | { type: "nextQuote" }
  | { type: "resetGame" };

export type GameState = {
  teams: Record<string, Team>;
  quotes: Quote[];
  currentQuoteIndex: number;
  timeRemaining: number;
  isGameStarted: boolean;
  gameEndedAt: number | null;
  teamAnswers: Record<string, number>[];
};

export type WebSocketResponse = { type: "state"; state: GameState };
