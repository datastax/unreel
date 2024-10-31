import { useCallback, useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useParty } from "./PartyContext";
import { Quote } from "../../common/types";
import { TeamRoomWrapper } from "./TeamRoomWrapper";
import { CountdownCircle } from "./CountdownCircle";
import { WebSocketResponse } from "../../common/events";

export function InGame() {
  const [currentQuote, setCurrentQuote] = useState<Quote | null>(null);
  const [meIndex, setMeIndex] = useState<number>(0);
  const { teamId } = useParams();
  const navigate = useNavigate();
  const [isRoundDecided, setIsRoundDecided] = useState(false);
  const [timeRemaining, setTimeRemaining] = useState(60000);
  const hasMotion = "requestPermission" in DeviceMotionEvent;
  const [lastRound, setLastRound] = useState<{
    lastAnswer: string;
    correctAnswer: string;
    score?: number;
  } | null>(null);

  const { ws } = useParty();

  const vote = useCallback(
    (vote: "up" | "down") => {
      if (!ws) return;
      ws.dispatch({
        type: vote === "up" ? "acceptOption" : "rejectOption",
        teamId: teamId!,
        playerId: ws.id,
      });
    },
    [ws, teamId]
  );

  useEffect(() => {
    if (!ws) return;
    if (!teamId) return;
    ws.dispatch({ type: "getState" });
    ws.onmessage = (event) => {
      const data = JSON.parse(event.data) as WebSocketResponse;

      if (!data.state.isGameStarted) {
        navigate("/");
        return;
      }

      setCurrentQuote(data.state.quotes[data.state.currentQuoteIndex]);
      setMeIndex(
        data.state.teams[teamId].players.findIndex(
          (p: { email: string }) => p.email === ws.id
        )
      );
      setTimeRemaining(data.state.timeRemaining);

      const isRoundDecided =
        data.state.timeRemaining === 0 ||
        data.state.teamAnswers?.[data.state.currentQuoteIndex]?.[teamId] !==
          undefined;

      if (!isRoundDecided && data.state.timeRemaining === 0) {
        ws.dispatch({ type: "forfeit", teamId });
      }

      setIsRoundDecided(isRoundDecided);

      if (isRoundDecided) {
        setLastRound({
          score: data.state.teams[teamId].score,
          lastAnswer:
            data.state.quotes[data.state.currentQuoteIndex].options[
              data.state.teamAnswers[data.state.currentQuoteIndex][teamId]
            ],
          correctAnswer:
            data.state.quotes[data.state.currentQuoteIndex].options[
              data.state.quotes[data.state.currentQuoteIndex].correctOptionIndex
            ],
        });
      }

      if (data.state.gameEndedAt) {
        navigate(`/game-over/${teamId}`);
      }
    };
  }, [ws, teamId]);

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
  }, [currentQuote?.correctOptionIndex]);

  // Little hack to reset non-phone devices during local testing on multiple browsers
  useEffect(() => {
    if (!ws) return;
    vote("up");
  }, [currentQuote?.correctOptionIndex]);

  if (!teamId) {
    navigate("/");
    return null;
  }

  if (isRoundDecided || timeRemaining === 0) {
    return (
      <TeamRoomWrapper>
        <div className="grid min-h-[calc(100svh-8rem)] gap-4 items-start justify-center">
          {lastRound && (
            <div className="grid gap-8">
              <h1 className="text-5xl font-bold">
                {lastRound.lastAnswer === lastRound.correctAnswer
                  ? "Correct!"
                  : "Wrong!"}
              </h1>
              <div className="grid gap-1">
                <p className="text-xl">You chose</p>
                <p className="text-2xl font-bold">{lastRound.lastAnswer}</p>
              </div>
              <div className="grid gap-1">
                <p className="text-xl">The correct answer was</p>
                <p className="text-2xl font-bold">{lastRound.correctAnswer}</p>
              </div>
              <div className="grid gap-1">
                <p className="text-xl">Your Score</p>
                <p className="text-2xl font-bold">{lastRound.score ?? "-"}</p>
              </div>
            </div>
          )}
          <div className="mt-auto text-center">
            <div className="block mx-auto animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-white mb-4" />
            <p className="text-xl mb-2">Waiting for the next quote</p>
            <p className="text-sm text-opacity-50">
              (waiting for all teams to finish)
            </p>
          </div>
        </div>
      </TeamRoomWrapper>
    );
  }

  return (
    <TeamRoomWrapper>
      <CountdownCircle timeout={60000} remainingTime={timeRemaining} />
      <div className="flex flex-col items-center justify-center">
        {currentQuote && (
          <div className="grid gap-8">
            <div className="grid gap-4">
              <p className="text-xl">This quote:</p>
              <p className="text-2xl font-bold">"{currentQuote.quote}"</p>
            </div>
            {currentQuote.options[meIndex]?.toLowerCase() === "ai generated" ? (
              <h1 className="text-xl">
                Was never said in a movie (AI Generated).
              </h1>
            ) : (
              <div className="grid gap-4">
                <p className="text-xl">Was said in this movie:</p>
                <h1 className="text-4xl font-bold">
                  {currentQuote.options[meIndex]}
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
