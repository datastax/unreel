import { Quote, Team } from "../../common/types";

type AdminPlayersProps = {
  allQuotes: Quote[];
  totalPlayers: number;
  teams: Record<string, Team>;
};

export const AdminPlayers: React.FC<AdminPlayersProps> = ({
  allQuotes,
  totalPlayers,
  teams,
}) => {
  return (
    <div className="grid gap-4">
      <h2 className="text-4xl font-semibold">Players</h2>
      <div className="overflow-x-auto">
        <table className="w-full border-collapse border rounded">
          <thead>
            <tr className="bg-neutral-800">
              <th className="border border-neutral-800 p-2">Team</th>
              <th className="border border-neutral-800 p-2">Email</th>
              {Array.from({ length: allQuotes.length }, (_, index) => (
                <th key={index} className="border border-neutral-800 p-2">
                  Round {index + 1}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {totalPlayers === 0 ? (
              <tr>
                <td
                  colSpan={allQuotes.length + 2}
                  className="p-4 border-neutral-800 border text-center"
                >
                  No players yet.
                </td>
              </tr>
            ) : (
              Object.entries(teams).flatMap(([teamId, team]) =>
                team.players.map((player) => (
                  <tr key={player.email} className="border-b">
                    <td className="border border-neutral-800 p-2">
                      Team {teamId}
                    </td>
                    <td className="border border-neutral-800 p-2">
                      {player.email}
                    </td>
                    {Array.from(
                      { length: allQuotes.length },
                      (_, roundIndex) => (
                        <td
                          key={roundIndex}
                          className="border border-neutral-800 p-2"
                        >
                          {player.choices[roundIndex]
                            ? `${player.choices[roundIndex].value} (${player.choices[roundIndex].status})`
                            : "No choice"}
                        </td>
                      )
                    )}
                  </tr>
                ))
              )
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};
