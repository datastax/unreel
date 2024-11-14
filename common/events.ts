import type { GameState } from "./types";

export type WebSocketAction =
  | { type: "getState" }
  | { type: "joinTeam"; teamId: string; email: string; hasMotion: boolean }
  | { type: "leaveTeam"; playerId: string }
  | { type: "startGame" }
  | { type: "rejectOption"; teamId: string; playerId: string }
  | { type: "acceptOption"; teamId: string; playerId: string }
  | { type: "forfeit"; teamId: string }
  | { type: "nextQuote" }
  | {
      type: "updatePhonePosition";
      teamId: string;
      playerIndex: number;
      phonePosition: "faceUp" | "faceDown";
    }
  | { type: "resetGame" };

export type WebSocketResponse =
  | { type: "state"; state: GameState }
  | { type: "reset" };
