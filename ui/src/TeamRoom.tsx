import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";

import { PlayerCount } from "./PlayerCount";
import { useParty } from "./PartyContext";
import { maxPlayersPerTeam } from "../../common/types";
import { TeamRoomWrapper } from "./TeamRoomWrapper";

export function TeamRoom() {
  const [currentPlayerCount, setCurrentPlayerCount] = useState(0);
  const { teamId } = useParams();
  const { ws } = useParty();
  const navigate = useNavigate();

  useEffect(() => {
    if (!ws) return;
    ws.send(JSON.stringify({ type: "getTeams" }));

    const handleBeforeUnload = () => {
      ws.send(JSON.stringify({ type: "leaveTeam", teamId }));
    };

    window.addEventListener("beforeunload", handleBeforeUnload);

    return () => {
      window.removeEventListener("beforeunload", handleBeforeUnload);
    };
  }, [ws, teamId]);

  useEffect(() => {
    if (!ws) return;
    if (!teamId) return;
    ws.onmessage = (event) => {
      const data = JSON.parse(event.data);
      switch (data.type) {
        case "playerJoined":
        case "teams":
        case "playerLeft":
          setCurrentPlayerCount(data.teams[teamId].players.length);
          break;
        case "gameStarted":
          if (data.currentPlayerCounts[teamId] === maxPlayersPerTeam) {
            navigate(`/game/${teamId}`);
          }
          break;
      }
    };
  }, [ws, teamId]);

  if (!teamId) {
    navigate("/");
    return null;
  }

  return (
    <TeamRoomWrapper>
      <h1 className="text-3xl font-bold mb-8">Team {teamId}</h1>
      <div className="text-center">
        <div className="inline-block animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-white mb-4"></div>
        <p className="text-xl">Waiting for players...</p>
        <PlayerCount count={currentPlayerCount} />
      </div>
    </TeamRoomWrapper>
  );
}
