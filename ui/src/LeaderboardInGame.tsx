import { Team } from "../../common/types";

import { Quote } from "../../common/types";
import { Crown } from "./Crown";
import { LeaderboardCountdown } from "./LeaderboardCountdown";
import { LeaderboardLayout } from "./LeaderboardLayout";
import { PhoneIcon } from "./PhoneIcon";
import { getVisibleScore } from "./util/getVisibleScore";
import { teamBgColors } from "./util/teamBgColors";

export function LeaderboardInGame({
  currentQuote,
  currentQuoteIndex,
  isRoundDecided,
  activeTeams,
  timeRemaining,
}: {
  currentQuote: Quote;
  currentQuoteIndex: number;
  isRoundDecided: boolean;
  activeTeams: Team[];
  timeRemaining: number;
}) {
  const correctAnswer = currentQuote.options[currentQuote?.correctOptionIndex];
  const teamWithBiggestNewScore = activeTeams
    .map((team) => ({
      ...team,
      scoreDelta: team.score - team.previousRoundScore,
    }))
    .sort((a, b) => b.scoreDelta - a.scoreDelta)[0];

  const teamWithBiggestScore = activeTeams].toSorted(
    (a, b) => b.score - a.score
  )[0];

  return (
    <LeaderboardLayout>
      <div className={`flex gap-8 items-start w-full`}>
        <div className="w-full grid gap-8">
          {isRoundDecided && teamWithBiggestNewScore.scoreDelta > 0 ? (
            <h2 className="text-6xl flex items-center gap-4 font-bold">
              <div className="w-16 text-ds-quaternary h-16">
                <Crown color="currentColor" />
              </div>
              Team {teamWithBiggestNewScore.id} won!
            </h2>
          ) : (
            <h2 className="text-6xl font-bold">😢 Nobody won!</h2>
          )}
          <div className="grid gap-4 content-start text-left">
            <p className="text-2xl">This quote:</p>
            <p className="text-4xl font-bold">
              &ldquo;{currentQuote.quote}&rdquo;
            </p>
          </div>
          {isRoundDecided && (
            <div className="grid gap-4 content-start text-left">
              {correctAnswer.toLowerCase() !== "ai generated" ? (
                <>
                  <p className="text-2xl">Was said in this movie:</p>
                  <p className="text-4xl font-bold">{correctAnswer}</p>
                </>
              ) : (
                <p className="text-2xl">Was generated by AI.</p>
              )}
            </div>
          )}
          {!isRoundDecided && (
            <div className="grid gap-4 text-left">
              <p className="text-2xl">Could have been said in:</p>
              <ul className="list-disc list-inside grid gap-2">
                {currentQuote.options.map((option) => (
                  <li className="text-4xl font-bold" key={option}>
                    {option}
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
        <div className="w-full grid gap-4 content-start">
          <h2 className="text-2xl">Leaderboard</h2>
          <ul className="w-full grid gap-4 mx-auto">
            {activeTeams.map((team) => (
              <li
                key={team.id}
                style={{ viewTransitionName: `team-${team.id}` }}
                className={`rounded text-center overflow-hidden bg-${
                  teamBgColors[team.id]
                } bg-opacity-35 grid gap-2 text-3xl font-bold relative ${
                  team.id === teamWithBiggestScore.id ? "h-32" : "h-16"
                } p-4`}
              >
                <div
                  className={`absolute -z-1 h-full top-0 left-0 bg-${
                    teamBgColors[team.id]
                  }`}
                  style={{
                    width: `calc(1rem + ${
                      100 -
                      (team.players.filter((p) => p.phonePosition === "faceUp")
                        .length /
                        team.players.length) *
                        100
                    }% * 2)`,
                  }}
                ></div>
                <div className="flex relative justify-between z-10 items-center gap-4">
                  <p>Team {team.id}</p>
                  <div className="flex gap-2">
                    {team.players.map((player) => (
                      <div
                        style={{
                          opacity: player.phonePosition === "faceUp" ? 1 : 0.3,
                        }}
                        key={player.id}
                      >
                        <PhoneIcon />
                      </div>
                    ))}
                  </div>
                  <p>
                    {getVisibleScore(team, currentQuoteIndex, isRoundDecided)}
                    &nbsp; points
                  </p>
                </div>
              </li>
            ))}
          </ul>
        </div>
      </div>
      {!isRoundDecided && (
        <div className="grid gap-4 mt-auto">
          <h2 className="text-2xl text-center">Seconds Remaining</h2>
          <LeaderboardCountdown timeRemaining={timeRemaining} />
        </div>
      )}
    </LeaderboardLayout>
  );
}
