import ReactConfetti from "react-confetti";
import { Team } from "../../common/types";
import { teamBgColors } from "./util/teamBgColors";
import { LeaderboardLayout } from "./LeaderboardLayout";

export function LeaderboardEndgame({
  winningTeams,
  otherTeams,
}: {
  winningTeams: Team[];
  otherTeams: Team[];
}) {
  return (
    <LeaderboardLayout>
      <ReactConfetti colors={["#7f3aa4", "#ac115f", "#de2337", "#ffca0b"]} />
      <h1 className="text-6xl font-bold">Game over!</h1>
      <h2 className="text-3xl">Here are the results.</h2>
      <ul className="grid gap-4">
        {winningTeams.map((team) => (
          <li
            key={team.id}
            className={`winning-team rounded text-center text-3xl font-bold bg-${
              teamBgColors[team.id]
            } flex items-center p-8 relative`}
          >
            <svg
              className="absolute -top-8 -left-6 w-16 h-16 -rotate-[30deg]"
              viewBox="0 0 24 24"
              fill="currentColor"
            >
              <path d="M5 16L3 5L8.5 10L12 4L15.5 10L21 5L19 16H5ZM19 19C19 19.6 18.6 20 18 20H6C5.4 20 5 19.6 5 19V18H19V19Z" />
            </svg>
            <p className="flex-grow text-left">Team {team.id}</p>
            <p>{team.score} points</p>
          </li>
        ))}

        {otherTeams.map((team) => (
          <li
            key={team.id}
            className={`rounded text-center text-xl font-bold bg-${
              teamBgColors[team.id]
            } flex items-center p-4`}
          >
            <p className="flex-grow text-left">Team {team.id}</p>
            <p>{team.score} points</p>
          </li>
        ))}
      </ul>
    </LeaderboardLayout>
  );
}
