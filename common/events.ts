import type { Option, Team, Quote, GameState } from "./types";

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

export type WebSocketResponse = { type: "state"; state: GameState };
