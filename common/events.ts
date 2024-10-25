import type { Option, Team, Quote } from "./types";

export type WebSocketAction =
  | { type: "getTeams" }
  | { type: "joinTeam"; teamId: string; email: string }
  | { type: "leaveTeam"; teamId: string }
  | { type: "startGame" }
  | { type: "getQuotes" }
  | { type: "rejectOption"; teamId: string; option: Option; playerId: string }
  | { type: "acceptOption"; teamId: string; option: Option; playerId: string }
  | { type: "undoOption"; teamId: string; option: Option; playerId: string }
  | { type: "forfeit"; teamId: string }
  | { type: "getQuote" }
  | { type: "nextQuote" }
  | { type: "resetGame" };

export type WebSocketResponse =
  | { type: "teams"; teams: Record<string, Team> }
  | { type: "playerJoined"; teams: Record<string, Team> }
  | { type: "playerLeft"; teams: Record<string, Team> }
  | {
      type: "gameStarted";
      currentPlayerCounts: Record<string, number>;
      quotes: Quote[];
      currentQuoteIndex: number;
    }
  | { type: "quotes"; quotes: Quote[]; currentQuoteIndex: number }
  | { type: "options"; teams: Record<string, Team> }
  | { type: "updateTeamScore"; teams: Record<string, Team> }
  | { type: "gameOver" }
  | { type: "roundDecided"; teamId?: string; score?: number }
  | { type: "getQuote"; quote: Quote }
  | { type: "nextQuote"; quote: Quote }
  | { type: "resetGame" }
  | { type: "timeRemaining"; timeRemaining: number };
