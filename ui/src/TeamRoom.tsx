import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";

import { PlayerCount } from "./PlayerCount";
import { useParty } from "./PartyContext";
import { maxPlayersPerTeam } from "../../common/util";
import { TeamRoomWrapper } from "./TeamRoomWrapper";
import { WebSocketResponse } from "../../common/events";
import { Spinner } from "./Spinner";
import { GameState } from "../../common/types";

export function TeamRoom() {
  const [gameState, setGameState] = useState<GameState | null>(null);
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
      if (data.state.teams[teamId].players.length > maxPlayersPerTeam) {
        alert("Sorry, your team just got too big! Try again!");
        navigate("/");
        return;
      }
      if (data.state.isGameStarted) {
        navigate(`/game/${teamId}`);
        return;
      }
      setGameState(data.state);
    };
  }, [ws, teamId]);

  useEffect(() => {
    if (!ws) return;
    if (!teamId) {
      navigate("/");
      return;
    }

    if (!gameState) return;

    const isPlayerInTeam = gameState.teams[teamId].players.find(
      (p) => p.email === ws.id
    );

    if (!isPlayerInTeam) {
      navigate("/");
    }
  }, [ws, teamId, gameState]);

  if (!gameState) {
    return (
      <TeamRoomWrapper>
        <Spinner>Loading...</Spinner>
      </TeamRoomWrapper>
    );
  }

  const currentPlayerCount = gameState.teams[teamId!].players.length;
  const isFirstPlayer = gameState.teams[teamId!].players?.[0]?.email === ws?.id;
  const gameHasOnlyOneTeamWithPlayers =
    Object.values(gameState.teams).filter((team) => team.players.length > 0)
      .length === 1;
  const shouldShowStartGameButton =
    isFirstPlayer && gameHasOnlyOneTeamWithPlayers;

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
              onClick={() => ws?.dispatch({ type: "startGame" })}
              className="bg-white text-black p-4 rounded-md font-bold"
            >
              Start Game
            </button>
          </div>
        )}
      </div>
    </TeamRoomWrapper>
  );
}
