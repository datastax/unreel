import ReactConfetti from "react-confetti";
import { Team } from "../../common/types";
import { teamBgColors } from "./util/teamBgColors";

export function LeaderboardEndgame({
  winningTeams,
  otherTeams,
}: {
  winningTeams: Team[];
  otherTeams: Team[];
}) {
  return (
    <>
      <ReactConfetti colors={["#7f3aa4", "#ac115f", "#de2337", "#ffca0b"]} />
      <h2 className="text-3xl font-bold pb-4 pt-4 text-center">
        {winningTeams.length > 1 ? "The winners are:" : "The winner is:"}
      </h2>

      <ol>
        {winningTeams.map((team) => (
          <li
            key={team.id}
            className={`rounded text-center text-3xl font-bold bg-${
              teamBgColors[team.id]
            } mb-2 h-24 flex items-center p-4`}
          >
            <p className="flex-grow text-left">Team {team.id}</p>
            <p>{team.score} pts</p>
          </li>
        ))}

        {otherTeams.map((team) => (
          <li
            key={team.id}
            className={`rounded text-center text-xl font-bold bg-${
              teamBgColors[team.id]
            } mb-2 h-18 flex items-center p-4`}
          >
            <p className="flex-grow text-left">Team {team.id}</p>
            <p>{team.score} pts</p>
          </li>
        ))}
      </ol>
    </>
  );
}
