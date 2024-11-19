import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";

import { PlayerCount } from "./PlayerCount";
import { useParty } from "./PartyContext";
import { maxPlayersPerTeam } from "../../common/util";
import { TeamRoomWrapper } from "./TeamRoomWrapper";
import { WebSocketResponse } from "../../common/events";
import { Spinner } from "./Spinner";
import { GameState } from "../../common/types";
import { BodiInterspersed } from "./BodiInterspersed";

export function TeamRoom() {
  const [isGameStarting, setIsGameStarting] = useState(false);
  const [gameState, setGameState] = useState<GameState | null>(null);
  const { teamId, room } = useParams();
  const { ws } = useParty();
  const navigate = useNavigate();

  useEffect(() => {
    if (!ws) return;
    if (!teamId) return;
    ws.dispatch({ type: "getState" });
    ws.onmessage = (event) => {
      const data = JSON.parse(event.data) as WebSocketResponse;
      if (data.type === "reset") {
        return navigate(`/${room}`);
      }
      if (data.state.teams[teamId].players.length > maxPlayersPerTeam) {
        alert("Sorry, your team just got too big! Try again!");
        return navigate(`/${room}`);
      }
      if (data.state.isGameStarted) {
        return navigate(`/${room}/game/${teamId}`);
      }
      setGameState(data.state);
    };
  }, [ws, teamId, room]);

  useEffect(() => {
    if (!ws) return;
    if (!teamId) {
      navigate(`/${room}`);
      return;
    }

    if (!gameState) return;

    const queryParams = ws.partySocketOptions.query as Record<string, string>;
    const isPlayerInTeam = gameState.teams[teamId].players.find((p) => {
      return p.email === queryParams.playerId;
    });

    if (!isPlayerInTeam) {
      navigate(`/${room}`);
    }
  }, [ws, teamId, room, gameState]);

  const queryParams = ws?.partySocketOptions.query as Record<string, string>;
  const currentPlayerCount = gameState?.teams[teamId!].players.length;
  const isFirstPlayer =
    gameState?.teams[teamId!].players?.[0]?.email ===
    decodeURIComponent(queryParams.playerId);
  const gameHasOnlyOneTeamWithPlayers =
    Object.values(gameState?.teams ?? {}).filter(
      (team) => team.players.length > 0
    ).length === 1;
  const shouldShowStartGameButton =
    isFirstPlayer && gameHasOnlyOneTeamWithPlayers;

  return (
    <TeamRoomWrapper>
      <h1 className="relative z-10 text-5xl font-bold">How to Play</h1>
      <ul className="relative z-10 text-xl grid gap-2 list-disc list-outside mx-4">
        <li>Your entire team will receive the same movie quote.</li>
        <li>You will see one possible answer per player.</li>
        <li>Talk to your team to decide on the best answer.</li>
        <li>The only phone on your team facing up is your submitted answer.</li>
        <li>The faster you answer correctly, the higher your score.</li>
      </ul>
      {currentPlayerCount && (
        <div className="text-center grid gap-4 mt-auto">
          <Spinner>
            <p className="text-xl">
              Waiting for{" "}
              {currentPlayerCount < maxPlayersPerTeam ? "players" : "host"}...
            </p>
            <PlayerCount count={currentPlayerCount} />
          </Spinner>
          {shouldShowStartGameButton && (
            <div className="grid gap-4">
              <button
                disabled={isGameStarting}
                onClick={() => {
                  setIsGameStarting(true);
                  ws?.dispatch({ type: "startGame" });
                }}
                className="bg-white disabled:opacity-50 text-black p-4 rounded-md font-bold"
              >
                {isGameStarting ? "Starting..." : "Start Game"}
              </button>
            </div>
          )}
        </div>
      )}
      <BodiInterspersed />
    </TeamRoomWrapper>
  );
}
