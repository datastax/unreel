import { useCallback, useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useParty } from "./PartyContext";

import { TeamRoomWrapper } from "./TeamRoomWrapper";
import { CountdownCircle } from "./CountdownCircle";
import { WebSocketResponse } from "../../common/events";
import { GameState } from "../../common/types";
import { Spinner } from "./Spinner";
import { roundDurationMs } from "../../common/util";

export function InGame() {
  const hasMotion = "requestPermission" in DeviceMotionEvent;
  const { teamId } = useParams();
  const navigate = useNavigate();
  const [gameState, setGameState] = useState<GameState | null>(null);
  const { ws } = useParty();

  // Sync game state
  useEffect(() => {
    if (!ws) return () => {};
    ws.dispatch({ type: "getState" });
    const sync = (event: MessageEvent) => {
      const data = JSON.parse(event.data) as WebSocketResponse;
      setGameState(data.state);
    };
    ws.addEventListener("message", sync);
    return () => ws.removeEventListener("message", sync);
  }, [ws]);

  const vote = useCallback(
    (choice: "up" | "down") => {
      if (!ws) return;
      if (!gameState) return;
      if (!teamId) return;

      ws.dispatch({
        type: "updatePhonePosition",
        teamId,
        playerIndex: meIndex,
        phonePosition: choice === "up" ? "faceUp" : "faceDown",
      });

      if (gameState.gameEndedAt) return;
      if (gameState.isRoundDecided) return;

      const me = gameState.teams[teamId].players.find(
        (p: { email: string }) => p.email === ws.id
      );

      if (!me) return;

      if (choice === "up" && me.phonePosition === "faceUp") return;
      if (choice === "down" && me.phonePosition === "faceDown") return;

      ws.dispatch({
        type: choice === "up" ? "acceptOption" : "rejectOption",
        teamId: teamId,
        playerId: ws.id,
      });
    },
    [ws, teamId, gameState]
  );

  // Handle motion
  useEffect(() => {
    if (!("requestPermission" in DeviceMotionEvent)) {
      return;
    }

    const handleMotion = function (e: DeviceMotionEvent) {
      const acceleration = e.accelerationIncludingGravity;

      if (acceleration?.z && acceleration.z > 5) {
        vote("down");
      } else if (acceleration?.z && acceleration.z < -5) {
        vote("up");
      }
    };

    // @ts-expect-error for some reason, TypeScript thinks requestPermission doesn't exist
    DeviceMotionEvent.requestPermission().then(() => {
      window.addEventListener("devicemotion", handleMotion);
    });

    return () => {
      window.removeEventListener("devicemotion", handleMotion);
    };
  }, [vote]);

  useEffect(() => {
    if (!teamId) {
      navigate("/");
      return;
    }

    if (!gameState) return;

    if (!gameState.isGameStarted) {
      navigate("/");
    }

    if (gameState.gameEndedAt) {
      navigate(`/game-over/${teamId}`);
    }
  }, [gameState, navigate, teamId]);

  if (!gameState) {
    return (
      <TeamRoomWrapper>
        <Spinner>Loading...</Spinner>
      </TeamRoomWrapper>
    );
  }

  if (!teamId) {
    return (
      <TeamRoomWrapper>
        <Spinner>Loading...</Spinner>
      </TeamRoomWrapper>
    );
  }

  const meIndex =
    ws && gameState.teams[teamId]
      ? gameState.teams[teamId!].players.findIndex(
          (p: { email: string }) => p.email === ws.id
        )
      : -1;

  if (gameState.isRoundDecided || gameState.timeRemaining === 0) {
    const yourAnswer =
      gameState.quotes[gameState.currentQuoteIndex].options[
        gameState.teamAnswers[gameState.currentQuoteIndex]?.[teamId]
      ];
    const correctAnswer =
      gameState.quotes[gameState.currentQuoteIndex].options[
        gameState.quotes[gameState.currentQuoteIndex].correctOptionIndex
      ];
    const hasOnlyOneTeamWithPlayers =
      Object.values(gameState.teams).filter((team) => team.players.length > 0)
        .length === 1;
    const shouldShowContinueButton =
      gameState.timeRemaining === 0 && hasOnlyOneTeamWithPlayers;

    return (
      <TeamRoomWrapper>
        <div className="grid min-h-[calc(100svh-8rem)] gap-4 items-start justify-center">
          {yourAnswer ? (
            <div className="grid gap-8">
              <h1 className="text-5xl font-bold">
                {yourAnswer === correctAnswer ? "Correct!" : "Wrong!"}
              </h1>
              <div className="grid gap-1">
                <p className="text-xl">You chose</p>
                <p className="text-2xl font-bold">{yourAnswer}</p>
              </div>
              <div className="grid gap-1">
                <p className="text-xl">The correct answer was</p>
                <p className="text-2xl font-bold">{correctAnswer}</p>
              </div>
              <div className="grid gap-1">
                <p className="text-xl">Your Score</p>
                <p className="text-2xl font-bold">
                  {gameState.teams[teamId]?.score ?? "-"}
                </p>
              </div>
            </div>
          ) : (
            <div className="grid gap-8">
              <h1 className="text-5xl font-bold">Time's up!</h1>
              <div className="grid gap-1">
                <p className="text-xl">The correct answer was</p>
                <p className="text-2xl font-bold">{correctAnswer}</p>
              </div>
              <div className="grid gap-1">
                <p className="text-xl">Your Score</p>
                <p className="text-2xl font-bold">
                  {gameState.teams[teamId]?.score ?? "-"}
                </p>
              </div>
            </div>
          )}
          <div className="mt-auto grid gap-4">
            <Spinner>
              <p className="text-xl mb-2">Waiting for the next quote</p>
              <p className="text-sm text-opacity-50">
                (waiting for all teams to finish)
              </p>
            </Spinner>
            {shouldShowContinueButton && (
              <button
                onClick={() => ws?.dispatch({ type: "nextQuote" })}
                className="bg-white text-black p-4 rounded-md font-bold"
              >
                Continue
              </button>
            )}
            {!hasMotion && (
              <div className="grid gap-4">
                <button
                  onClick={() =>
                    ws?.dispatch({
                      type: "updatePhonePosition",
                      phonePosition: "faceUp",
                      playerIndex: meIndex,
                      teamId,
                    })
                  }
                  className="bg-white text-black p-2 rounded-md"
                >
                  Face Up
                </button>
              </div>
            )}
          </div>
        </div>
      </TeamRoomWrapper>
    );
  }

  return (
    <TeamRoomWrapper>
      <CountdownCircle
        timeout={roundDurationMs}
        remainingTime={gameState.timeRemaining}
      />
      <div className="flex flex-col items-center justify-center">
        {gameState.quotes[gameState.currentQuoteIndex] && (
          <div className="grid gap-8">
            <div className="grid gap-4">
              <p className="text-xl">This quote:</p>
              <p className="text-2xl font-bold">
                "{gameState.quotes[gameState.currentQuoteIndex].quote}"
              </p>
            </div>
            {gameState.quotes[gameState.currentQuoteIndex].options[
              meIndex
            ]?.toLowerCase() === "ai generated" ? (
              <h1 className="text-xl">
                Was never said in a movie (AI Generated).
              </h1>
            ) : (
              <div className="grid gap-4">
                <p className="text-xl">Was said in this movie:</p>
                <h1 className="text-4xl font-bold">
                  {
                    gameState.quotes[gameState.currentQuoteIndex].options[
                      meIndex
                    ]
                  }
                </h1>
              </div>
            )}
            {!hasMotion && (
              <div className="grid gap-4">
                <button
                  onClick={() => vote("up")}
                  className="bg-white text-black p-2 rounded-md"
                >
                  Accept
                </button>
                <button
                  onClick={() => vote("down")}
                  className="bg-white text-black p-2 rounded-md"
                >
                  Reject
                </button>
              </div>
            )}
            <div className="grid gap-4">
              <p className="text-xl font-bold">How to Play</p>
              <ul className="grid list-disc mx-4 gap-1">
                <li>Discuss with your team if this is correct.</li>
                <li>
                  If <strong>incorrect</strong>, turn your phone face down.
                </li>
                <li>
                  If <strong>correct</strong>, leave your phone face up.
                </li>
              </ul>
            </div>
          </div>
        )}
      </div>
    </TeamRoomWrapper>
  );
}
