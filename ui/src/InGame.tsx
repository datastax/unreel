import { useEffect, useRef, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useParty } from "./PartyContext";
import PartySocket from "partysocket";
import { Quote, Option } from "../../common/types";
import { TeamRoomWrapper } from "./TeamRoomWrapper";
import { CountdownCircle } from "./CountdownCircle";

const forfeitTimeout = 15000;

export function InGame() {
  const [currentQuote, setCurrentQuote] = useState<Quote | null>(null);
  const [meIndex, setMeIndex] = useState<number>(0);
  const { teamId } = useParams();
  const navigate = useNavigate();
  const [isRoundDecided, setIsRoundDecided] = useState(false);
  const timeRemaining = useRef(forfeitTimeout);

  const { ws } = useParty();
  const vote = createVoter({
    ws,
    teamId,
    option: {
      value: currentQuote?.options[meIndex] ?? "",
      status: "undecided",
    },
    playerId: ws!.id,
    timeRemaining: timeRemaining.current,
  });

  useEffect(() => {
    if (!ws) return;
    if (!teamId) return;
    ws.send(JSON.stringify({ type: "getTeams" }));
    ws.send(JSON.stringify({ type: "getQuote" }));
    ws.onmessage = (event) => {
      const data = JSON.parse(event.data);
      switch (data.type) {
        case "teams":
          {
            const meIndex = data.teams[teamId].players.findIndex(
              (p: { email: string }) => p.email === ws.id
            );
            setMeIndex(meIndex);
          }
          return;
        case "getQuote":
        case "nextQuote":
          setIsRoundDecided(false);
          setCurrentQuote(data.quote);
          return;
        case "gameOver":
          navigate(`/game-over/`);
          return;
        case "resetGame":
          navigate(`/`);
          return;
        case "roundDecided":
          setIsRoundDecided(true);
          return;
      }
    };
  }, [ws, teamId]);

  useEffect(() => {
    if (!("requestPermission" in DeviceMotionEvent)) {
      return;
    }
    const handleMotion = function (e: DeviceMotionEvent) {
      if (isRoundDecided) {
        return;
      }
      const acceleration = e.accelerationIncludingGravity;

      if (acceleration?.z && acceleration.z > 5) {
        vote?.("rejectOption");
      } else if (acceleration?.z && acceleration.z < -5) {
        vote?.("acceptOption");
      }
    };

    // @ts-expect-error for some reason, TypeScript thinks requestPermission doesn't exist
    DeviceMotionEvent.requestPermission().then(() => {
      window.addEventListener("devicemotion", handleMotion);
    });

    return () => {
      window.removeEventListener("devicemotion", handleMotion);
    };
  }, [isRoundDecided]);

  useEffect(() => {
    if (isRoundDecided) return;
    timeRemaining.current = forfeitTimeout;

    const interval = setInterval(() => {
      timeRemaining.current -= 1000;
    }, 1000);

    const timeout = setTimeout(() => {
      ws?.send(
        JSON.stringify({ type: "forfeit", teamId, quote: currentQuote?.quote })
      );
    }, forfeitTimeout);
    return () => {
      clearInterval(interval);
      clearTimeout(timeout);
    };
  }, [isRoundDecided, currentQuote]);

  if (!teamId) {
    navigate("/");
    return null;
  }

  if (isRoundDecided) {
    return (
      <TeamRoomWrapper>
        <div className="flex flex-col items-center justify-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-white mb-4"></div>
          <p className="text-xl mb-2">Waiting for the next quote</p>
          <p className="text-sm text-opacity-50">
            (waiting for all teams to finish)
          </p>
        </div>
      </TeamRoomWrapper>
    );
  }

  return (
    <TeamRoomWrapper>
      <CountdownCircle key={currentQuote?.quote} timeout={forfeitTimeout} />
      <div className="flex flex-col items-center justify-center">
        {currentQuote && (
          <>
            <p className="text mb-4 italic">"{currentQuote.quote}"</p>
            <h1 className="text-4xl font-bold">
              {currentQuote.options[meIndex]}
            </h1>
            <button onClick={() => vote?.("rejectOption")}>Reject</button>
            <button onClick={() => vote?.("acceptOption")}>Accept</button>
            <button onClick={() => vote?.("undoOption")}>Undo</button>
          </>
        )}
      </div>
    </TeamRoomWrapper>
  );
}

const createVoter = ({
  ws,
  teamId,
  option,
  playerId,
  timeRemaining,
}: {
  ws: PartySocket | null;
  teamId: string | undefined;
  option: Option;
  playerId: string;
  timeRemaining: number;
}) => {
  if (!ws) return;
  return (type: "rejectOption" | "acceptOption" | "undoOption") =>
    ws.send(
      JSON.stringify({
        type,
        teamId,
        option: {
          ...option,
          status:
            type === "undoOption"
              ? "undecided"
              : type === "acceptOption"
              ? "accepted"
              : "rejected",
        },
        playerId,
        timeRemaining,
      })
    );
};
