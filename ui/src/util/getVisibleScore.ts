import { Team } from "../../../common/types";

export function getVisibleScore(
  team: Team,
  currentQuoteIndex: number,
  isRoundDecided: boolean
) {
  if (currentQuoteIndex < 0) {
    return 0;
  }
  if (!isRoundDecided) {
    return team.previousRoundScore;
  }

  return team.score;
}
