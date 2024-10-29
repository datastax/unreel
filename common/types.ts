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

export const maxPlayersPerTeam = 4;
