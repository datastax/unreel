import { useEffect, useState, useRef } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useParty } from "./PartyContext";

import { TeamRoomWrapper } from "./TeamRoomWrapper";
import { CountdownCircle } from "./CountdownCircle";
import { WebSocketResponse } from "../../common/events";
import { GameOptions, GameState } from "../../common/types";
import { Spinner } from "./Spinner";
import { checkMotionAvailability } from "./util/checkMotionAvailability";
import { vote } from "./util/vote";
import { BodiInterspersed } from "./BodiInterspersed";
import { defaultGameOptions } from "../../common/util";

export function InGame() {
  const { teamId, room } = useParams();
  const navigate = useNavigate();
  const [gameState, setGameState] = useState<GameState | null>(null);
  const gameOptions = useRef<GameOptions>(defaultGameOptions);
  const [orientation, setOrientation] = useState<"up" | "down" | null>("up");
  const { ws } = useParty();

  const queryParams = ws?.partySocketOptions.query as Record<string, string>;

  // Sync game state
  useEffect(() => {
    if (!ws) return () => {};
    ws.dispatch({ type: "getState" });
    const sync = (event: MessageEvent) => {
      const data = JSON.parse(event.data) as WebSocketResponse;
      if (data.type === "reset") {
        return navigate("/");
      }
      setGameState(data.state);
      gameOptions.current = data.options;
    };
    ws.addEventListener("message", sync);
    return () => ws.removeEventListener("message", sync);
  }, [ws]);

  // Handle motion
  useEffect(() => {
    if (!window.DeviceOrientationEvent) return;
    checkMotionAvailability().then((hasMotion) => {
      if (!hasMotion) return;

      const handleOrientation = async function (e: DeviceOrientationEvent) {
        if (!e.beta) return;
        const beta = Math.floor(e.beta);

        // Face up is around 0 degrees (allow ±20° variance)
        if (Math.abs(beta) < 20) {
          setOrientation("up");
        }

        // Face down is around 180 degrees (allow ±20° variance)
        else if (Math.abs(beta) > 160) {
          setOrientation("down");
        }
      };

      window.addEventListener("deviceorientation", handleOrientation);

      return () => {
        window.removeEventListener("deviceorientation", handleOrientation);
      };
    });
  }, []);

  const hasMotion =
    gameState?.teams[teamId!]?.players.find(
      (p) => p.email === queryParams.playerId
    )?.hasMotion ?? false;

  useEffect(() => {
    if (!orientation) return;
    if (!gameState) return;
    if (!teamId) return;
    if (!ws) return;

    vote({ choice: orientation, gameState, meIndex, teamId, ws });
  }, [orientation, gameState, teamId, ws]);

  useEffect(() => {
    if (!teamId) {
      navigate(`/${room}`);
      return;
    }

    if (!gameState) return;

    if (!gameState.isGameStarted) {
      navigate(`/${room}`);
    }

    if (gameState.gameEndedAt) {
      navigate(`/${room}/game-over/${teamId}`);
    }
  }, [gameState, navigate, teamId]);

  if (!gameState) {
    return (
      <TeamRoomWrapper>
        <Spinner>Loading...</Spinner>
      </TeamRoomWrapper>
    );
  }

  if (!teamId || !ws) {
    return (
      <TeamRoomWrapper>
        <Spinner>Loading...</Spinner>
      </TeamRoomWrapper>
    );
  }

  const meIndex =
    ws && gameState.teams[teamId]
      ? gameState.teams[teamId!].players.findIndex(
          (p: { email: string }) => p.email === queryParams.playerId
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
        {yourAnswer === correctAnswer ? (
          <audio src="/sounds/correct.mp3" autoPlay loop={false} />
        ) : (
          <audio src="/sounds/wrong.mp3" autoPlay loop={false} />
        )}
        <div className="flex flex-col min-h-[calc(100svh-4rem)] gap-4 items-start justify-center">
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
          <div className="mt-auto mx-auto grid gap-4">
            <Spinner>
              <p className="text-xl">Waiting for the next quote</p>
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
            {!hasMotion &&
              gameState.teams[teamId].players[meIndex].phonePosition !==
                "faceUp" && (
                <div className="grid gap-4">
                  <button
                    onClick={() => setOrientation("up")}
                    className="bg-white text-black p-2 rounded-md"
                  >
                    Ready Up
                  </button>
                </div>
              )}
            <BodiInterspersed />
          </div>
        </div>
      </TeamRoomWrapper>
    );
  }

  const ourAnswer =
    gameState.teamAnswers[gameState.currentQuoteIndex]?.[teamId];
  const isWaitingForOtherTeamsToAnswer = ourAnswer !== undefined;

  return (
    <TeamRoomWrapper>
      <CountdownCircle
        timeout={gameOptions.current.roundDurationMs}
        remainingTime={gameState.timeRemaining}
      />
      {gameState.quotes[gameState.currentQuoteIndex] && (
        <>
          <div className="flex relative z-10 flex-col gap-8 h-full">
            <div className="grid gap-4">
              <p className="text-xl">This quote:</p>
              <p className="text-2xl font-bold">
                "{gameState.quotes[gameState.currentQuoteIndex].quote}"
              </p>
            </div>
            {gameState.quotes[gameState.currentQuoteIndex].options[
              meIndex
            ]?.toLowerCase() === "ai generated" ? (
              <h1 className="text-4xl font-bold">
                Was never said in a movie and is generated by AI.
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
            {hasMotion ? (
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
            ) : (
              <div className="grid gap-4">
                <button
                  onClick={() => setOrientation("up")}
                  disabled={orientation === "up"}
                  className={`bg-white disabled:opacity-50 text-black p-2 rounded-md`}
                >
                  True
                </button>
                <button
                  onClick={() => setOrientation("down")}
                  disabled={orientation === "down"}
                  className={`bg-white disabled:opacity-50 text-black p-2 rounded-md`}
                >
                  False
                </button>
              </div>
            )}
          </div>
          {isWaitingForOtherTeamsToAnswer && (
            <div className="mt-auto relative z-10 grid gap-4">
              <Spinner>
                <p className="text-xl">
                  Answer submitted:{" "}
                  {
                    gameState.quotes[gameState.currentQuoteIndex].options[
                      ourAnswer
                    ]
                  }
                </p>
                <p className="text-sm text-opacity-50">
                  (waiting for all teams to finish)
                </p>
              </Spinner>
            </div>
          )}
        </>
      )}
    </TeamRoomWrapper>
  );
}
