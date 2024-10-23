import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useParty } from "./PartyContext";

const mockQuote = {
  quote: "Don't call me Shirley",
  options: ["Airplane", "AI Generated", "Blazing Saddles", "Shirley"],
  correctOptionIndex: 0,
};

export function InGame() {
  const [quote, setQuote] = useState(mockQuote);
  const [meIndex, setMeIndex] = useState<number>(0);
  const { teamId } = useParams();
  const navigate = useNavigate();

  const { ws } = useParty();

  useEffect(() => {
    if (!ws) return;
    if (!teamId) return;
    ws.send(JSON.stringify({ type: "getTeams" }));
    ws.onmessage = (event) => {
      const data = JSON.parse(event.data);
      switch (data.type) {
        case "teams":
          {
            const meIndex = data.teams[teamId].findIndex(
              (p: { email: string }) => p.email === ws.id
            );
            setMeIndex(meIndex);
          }
          return;
      }
    };
  }, [ws, teamId]);

  useEffect(() => {
    let lastBeta = 0;

    const handleOrientation = (event: DeviceOrientationEvent) => {
      if (event.beta !== null) {
        const currentBeta = event.beta;

        if (lastBeta < 70 && currentBeta >= 70) {
          if (!ws) return;
          ws.send(JSON.stringify({ type: "rejectOption" }));
        } else if (lastBeta > 110 && currentBeta <= 110) {
          if (!ws) return;
          ws.send(JSON.stringify({ type: "acceptOption" }));
        }

        lastBeta = currentBeta;
      }
    };

    window.addEventListener("deviceorientation", handleOrientation);

    return () => {
      window.removeEventListener("deviceorientation", handleOrientation);
    };
  }, [ws]);

  if (!teamId) {
    navigate("/");
    return null;
  }

  return (
    <div className="flex flex-col items-center justify-center">
      <p className="text mb-4 italic">"{quote.quote}"</p>
      <h1 className="text-4xl font-bold">{quote.options[meIndex]}</h1>
    </div>
  );
}
