import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";

import { PlayerCount } from "./PlayerCount";
import { teamBgColors } from "./util/teamBgColors";
import { InGame } from "./InGame";
import { useParty } from "./PartyContext";

export function TeamRoom() {
  const [currentPlayerCount, setCurrentPlayerCount] = useState(0);
  const { teamId } = useParams();
  const { ws } = useParty();
  const navigate = useNavigate();

  useEffect(() => {
    if (!ws) return;
    ws.send(JSON.stringify({ type: "getTeams" }));
    ws.send(JSON.stringify({ type: "joinTeam", teamId, email: ws.id }));

    const handleBeforeUnload = () => {
      ws.send(JSON.stringify({ type: "leaveTeam", teamId }));
    };

    window.addEventListener("beforeunload", handleBeforeUnload);

    return () => {
      ws.send(JSON.stringify({ type: "leaveTeam", teamId }));
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
          setCurrentPlayerCount(data.teams[teamId].length);
          break;
      }
    };
  }, [ws, teamId]);

  const isWaiting = currentPlayerCount < 2;

  if (!teamId) {
    navigate("/");
    return null;
  }

  return (
    <div
      className={`flex flex-col items-center justify-center h-screen bg-${teamBgColors[teamId]} text-white`}
    >
      <h1 className="text-3xl font-bold mb-8">Team {teamId}</h1>
      {isWaiting ? (
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-white mb-4"></div>
          <p className="text-xl">Waiting for players...</p>
          <PlayerCount count={currentPlayerCount} />
        </div>
      ) : (
        <InGame />
      )}
    </div>
  );
}
