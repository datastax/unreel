import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useParty } from "./PartyContext";
import { TeamRoomWrapper } from "./TeamRoomWrapper";
import { Team } from "../../common/types";
import { suffixify } from "./util/suffixify";

export function GameOver() {
  const [teams, setTeams] = useState<Record<string, Team>>({});
  const { ws } = useParty();
  const navigate = useNavigate();
  const { teamId } = useParams();
  const [position, setPosition] = useState<number | null>(null);

  useEffect(() => {
    if (!teams || !teamId) return;
    const sortedTeams = Object.values(teams).sort((a, b) => b.score - a.score);
    const index = sortedTeams.findIndex((teams) => teams.id === teamId);
    setPosition(index !== -1 ? index + 1 : null);
  }, [teams, teamId]);

  useEffect(() => {
    if (!ws) return;

    ws.dispatch({ type: "getTeams" });

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
      ws.dispatch({ type: "resetGame" });
    }
  };

  return (
    <TeamRoomWrapper>
      <div className="px-4 grid gap-8">
        <h1 className="text-6xl font-bold">
          You came {suffixify(position || 0)}!
        </h1>
        <p className="text-2xl">
          You scored a total of {teams[teamId!]?.score} points. Check out the
          leaderboard to see how the other teams did.
        </p>
        <button
          onClick={handlePlayAgain}
          className="bg-black text-white font-bold p-4 rounded"
        >
          Play Again
        </button>
      </div>
    </TeamRoomWrapper>
  );
}
