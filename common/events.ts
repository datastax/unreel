import type { GameState } from "./types";

export type WebSocketAction =
  | { type: "getState" }
  | { type: "joinTeam"; teamId: string; email: string }
  | { type: "leaveTeam"; playerId: string }
  | { type: "startGame" }
  | { type: "rejectOption"; teamId: string; playerId: string }
  | { type: "acceptOption"; teamId: string; playerId: string }
  | { type: "forfeit"; teamId: string }
  | { type: "nextQuote" }
  | { type: "resetGame" };

export type WebSocketResponse = { type: "state"; state: GameState };
