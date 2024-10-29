import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";

import { PlayerCount } from "./PlayerCount";
import { useParty } from "./PartyContext";
import { maxPlayersPerTeam } from "../../common/util";
import { TeamRoomWrapper } from "./TeamRoomWrapper";
import { WebSocketResponse } from "../../common/events";

export function TeamRoom() {
  const [currentPlayerCount, setCurrentPlayerCount] = useState(0);
  const { teamId } = useParams();
  const { ws } = useParty();
  const navigate = useNavigate();

  useEffect(() => {
    if (!ws) return;
    if (!teamId) return;

    ws.dispatch({ type: "getState" });
  }, [ws, teamId]);

  useEffect(() => {
    if (!ws) return;
    if (!teamId) return;
    ws.onmessage = (event) => {
      const data = JSON.parse(event.data) as WebSocketResponse;
      switch (data.type) {
        case "state":
          if (data.state.teams[teamId].players.length > maxPlayersPerTeam) {
            alert("Sorry, your team just got too big! Try again!");
            navigate("/");
            return;
          }
          if (data.state.isGameStarted) {
            navigate(`/game/${teamId}`);
            return;
          }
          setCurrentPlayerCount(data.state.teams[teamId].players.length);
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
      <h1 className="text-5xl font-bold mb-8">How to Play</h1>
      <ul className="text-xl mb-8 grid gap-2 list-disc list-outside mx-4">
        <li>Your entire team will receive the same movie quote.</li>
        <li>You will see one possible answer per player.</li>
        <li>Talk to your team to decide on the best answer.</li>
        <li>The only phone on your team facing up is your submitted answer.</li>
        <li>The faster you answer correctly, the higher your score.</li>
      </ul>
      <div className="text-center mt-auto">
        <div className="inline-block animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-white mb-4"></div>
        <p className="text-xl">
          Waiting for{" "}
          {currentPlayerCount < maxPlayersPerTeam ? "players" : "host"}...
        </p>
        <PlayerCount count={currentPlayerCount} />
      </div>
    </TeamRoomWrapper>
  );
}
