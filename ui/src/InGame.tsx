import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useParty } from "./PartyContext";
import PartySocket from "partysocket";
import { Quote, Option } from "../../common/types";
import { TeamRoomWrapper } from "./TeamRoomWrapper";
import { CountdownCircle } from "./CountdownCircle";

const forfeitTimeout = 10000;

export function InGame() {
  const [currentQuote, setCurrentQuote] = useState<Quote | null>(null);
  const [meIndex, setMeIndex] = useState<number>(0);
  const { teamId } = useParams();
  const navigate = useNavigate();
  const [isRoundDecided, setIsRoundDecided] = useState(false);

  const { ws } = useParty();

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
    let lastBeta = 0;

    const handleOrientation = (event: DeviceOrientationEvent) => {
      if (event.beta !== null && currentQuote) {
        const currentBeta = event.beta;

        if (lastBeta < 70 && currentBeta >= 70) {
          rejectOption({
            ws,
            teamId: teamId!,
            option: {
              value: currentQuote.options[meIndex],
              status: "rejected",
            },
            playerId: ws!.id,
          });
        } else if (lastBeta > 110 && currentBeta <= 110) {
          acceptOption({
            ws,
            teamId: teamId!,
            option: {
              value: currentQuote.options[meIndex],
              status: "accepted",
            },
            playerId: ws!.id,
          });
        } else if (
          (lastBeta >= 70 && currentBeta < 70) ||
          (lastBeta <= 110 && currentBeta > 110)
        ) {
          undoOption({
            ws,
            teamId: teamId!,
            option: {
              value: currentQuote.options[meIndex],
              status: "undecided",
            },
            playerId: ws!.id,
          });
        }

        lastBeta = currentBeta;
      }
    };

    window.addEventListener("deviceorientation", handleOrientation);

    return () => {
      window.removeEventListener("deviceorientation", handleOrientation);
    };
  }, [ws, currentQuote]);

  useEffect(() => {
    if (isRoundDecided) return;

    const timeout = setTimeout(() => {
      ws?.send(
        JSON.stringify({ type: "forfeit", teamId, quote: currentQuote?.quote })
      );
    }, forfeitTimeout);
    return () => clearTimeout(timeout);
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
            <button
              onClick={() =>
                rejectOption({
                  ws,
                  teamId,
                  option: {
                    value: currentQuote.options[meIndex],
                    status: "rejected",
                  },
                  playerId: ws!.id,
                })
              }
            >
              Reject
            </button>
            <button
              onClick={() =>
                acceptOption({
                  ws,
                  teamId,
                  option: {
                    value: currentQuote.options[meIndex],
                    status: "accepted",
                  },
                  playerId: ws!.id,
                })
              }
            >
              Accept
            </button>
            <button
              onClick={() =>
                undoOption({
                  ws,
                  teamId,
                  option: {
                    value: currentQuote.options[meIndex],
                    status: "undecided",
                  },
                  playerId: ws!.id,
                })
              }
            >
              Undo
            </button>
          </>
        )}
      </div>
    </TeamRoomWrapper>
  );
}

const rejectOption = ({
  ws,
  teamId,
  option,
  playerId,
}: {
  ws: PartySocket | null;
  teamId: string;
  option: Option;
  playerId: string;
}) => {
  if (!ws) return;
  ws.send(JSON.stringify({ type: "rejectOption", teamId, option, playerId }));
};

const acceptOption = ({
  ws,
  teamId,
  option,
  playerId,
}: {
  ws: PartySocket | null;
  teamId: string;
  option: Option;
  playerId: string;
}) => {
  if (!ws) return;
  ws.send(JSON.stringify({ type: "acceptOption", teamId, option, playerId }));
};

const undoOption = ({
  ws,
  teamId,
  playerId,
  option,
}: {
  ws: PartySocket | null;
  teamId: string;
  playerId: string;
  option: Option;
}) => {
  if (!ws) return;
  ws.send(JSON.stringify({ type: "undoOption", teamId, playerId, option }));
};
