export type Option = {
  value: string;
  status: "accepted" | "rejected";
};

export type Team = {
  score: number;
  currentOptions: Option[];
  players: { id: string; email: string }[];
};

export type Quote = {
  quote: string;
  options: string[];
  correctOptionIndex: number;
};

export const maxPlayersPerTeam = 2;
