import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useParty } from "./PartyContext";
import { TeamRoomWrapper } from "./TeamRoomWrapper";
import { Team } from "../../common/types";

export function GameOver() {
  const [teams, setTeams] = useState<Record<string, Team>>({});
  const { ws } = useParty();
  const navigate = useNavigate();

  useEffect(() => {
    if (!ws) return;

    ws.send(JSON.stringify({ type: "getTeams" }));

    ws.onmessage = (event) => {
      const data = JSON.parse(event.data);
      switch (data.type) {
        case "teams":
          setTeams(data.teams);
          break;
        case "resetGame":
          navigate("/");
          break;
      }
    };
  }, [ws, navigate]);

  const handlePlayAgain = () => {
    if (ws) {
      ws.send(JSON.stringify({ type: "resetGame" }));
    }
  };

  return (
    <TeamRoomWrapper>
      <div className="p-4">
        <h1 className="text-3xl font-bold mb-6">Game Over</h1>
        <div className="mb-6">
          <h2 className="text-2xl font-semibold mb-4">Final Scores:</h2>
          {Object.entries(teams).map(([teamId, team]) => (
            <div key={teamId} className="mb-2">
              <span className="font-medium">Team {teamId}:</span> {team.score}{" "}
              points
            </div>
          ))}
        </div>
        <button
          onClick={handlePlayAgain}
          className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded"
        >
          Play Again
        </button>
      </div>
    </TeamRoomWrapper>
  );
}
