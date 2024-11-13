import { teamBgColors } from "./util/teamBgColors";
import { PlayerCount } from "./PlayerCount";
import { Quote, Team } from "../../common/types";

type AdminTeamsProps = {
  teams: Record<string, Team>;
  teamAnswers: Record<string, number>[];
  allQuotes: Quote[];
};

export const AdminTeams: React.FC<AdminTeamsProps> = ({
  teams,
  allQuotes,
  teamAnswers,
}) => {
  return (
    <div className="grid gap-4">
      <h2 className="text-4xl font-semibold">Teams</h2>
      <div className="grid gap-4 md:grid-cols-2">
        {Object.entries(teams).map(([teamId, teamData]) => (
          <div
            key={teamId}
            className={`bg-${teamBgColors[teamId]} grid gap-4 rounded p-4`}
          >
            <h3 className="flex items-center justify-between">
              <span>Team {teamId}</span>
              <div className="flex items-center gap-2">
                <PlayerCount count={teamData.players.length} />
                <span>•</span>
                <span>Score: {teamData.score}</span>
              </div>
            </h3>
            {allQuotes.length > 0 && (
              <ul className="list-disc list-inside">
                {Array.from({ length: allQuotes.length }, (_, roundIndex) => (
                  <li key={roundIndex}>
                    <span className="font-bold">Round {roundIndex + 1}:</span>{" "}
                    {teamAnswers[roundIndex]?.[teamId] !== undefined
                      ? `${
                          allQuotes[roundIndex].options[
                            teamAnswers[roundIndex][teamId]
                          ]
                        } (${
                          teamData.players.find(
                            (player) =>
                              player.choices[roundIndex]?.status === "accepted"
                          )?.email
                        })`
                      : "No accepted answer"}
                  </li>
                ))}
              </ul>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};
