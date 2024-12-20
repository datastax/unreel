import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useParty } from "./PartyContext";
import { TeamRoomWrapper } from "./TeamRoomWrapper";
import { Team } from "../../common/types";
import { suffixify } from "./util/suffixify";
import { WebSocketResponse } from "../../common/events";
import { Spinner } from "./Spinner";
import { BodiBackground } from "./BodiBackground";

export function GameOver() {
  const [teams, setTeams] = useState<Record<string, Team>>({});
  const { ws } = useParty();
  const navigate = useNavigate();
  const { teamId, room } = useParams();
  const [position, setPosition] = useState<number | null>(null);

  useEffect(() => {
    if (!teams || !teamId) return;
    const sortedTeams = Object.values(teams).sort((a, b) => b.score - a.score);
    const index = sortedTeams.findIndex((teams) => teams.id === teamId);
    setPosition(index !== -1 ? index + 1 : null);
  }, [teams, teamId]);

  useEffect(() => {
    if (!ws) return;

    ws.dispatch({ type: "getState" });
    ws.onmessage = (event) => {
      const data = JSON.parse(event.data) as WebSocketResponse;
      if (data.type === "reset") {
        return navigate("/");
      }
      if (!data.state.isGameStarted) {
        return navigate(`/${room}`);
      }
      setTeams(data.state.teams);
    };
  }, [ws, navigate, room]);

  const handlePlayAgain = () => {
    if (ws) {
      ws.dispatch({ type: "resetGame" });
      navigate(`/${room}`);
    }
  };

  const onlyOneTeamHasPlayers =
    Object.values(teams).filter((team) => team.players.length > 0).length === 1;

  if (!position) {
    return (
      <TeamRoomWrapper>
        <div className="px-4 grid gap-8">
          <Spinner>
            <span className="text-xl">Calculating scores...</span>
          </Spinner>
        </div>
      </TeamRoomWrapper>
    );
  }

  return (
    <TeamRoomWrapper>
      <div className="px-4 grid relative z-10 gap-8">
        <h1 className="text-6xl font-bold">You came {suffixify(position)}!</h1>
        <p className="text-2xl">
          You scored a total of {teams[teamId!]?.score} points. Check out the
          leaderboard to see how the other teams did.
        </p>
        {onlyOneTeamHasPlayers && (
          <button
            onClick={handlePlayAgain}
            className="bg-black text-white font-bold p-4 rounded"
          >
            Play Again
          </button>
        )}
      </div>
      <BodiBackground />
    </TeamRoomWrapper>
  );
}
