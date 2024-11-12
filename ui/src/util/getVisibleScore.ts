import { Team } from "../../../common/types";

export function getVisibleScore(team: Team, currentQuoteIndex: number) {
  if (currentQuoteIndex < 0) {
    return 0;
  }

  return team.score;
}
