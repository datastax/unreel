import { QRCodeSVG } from "qrcode.react";
import { LeaderboardLayout } from "./LeaderboardLayout";
import { useParams } from "react-router-dom";

export function LeaderboardPregame() {
  const { room } = useParams();
  return (
    <LeaderboardLayout>
      <h1 className="text-6xl font-bold">
        Welcome to Unreel: The AI Movie Quiz
      </h1>
      <p className="text-2xl">
        On this screen, you can follow the game and watch teams compete.
        <br />
        You can also <strong>join the game</strong> by scanning the QR code
        below.
      </p>
      <QRCodeSVG
        value={`${window.location.protocol}//${window.location.host}/${room}`}
        size={256}
        className="bg-white p-2"
      />
    </LeaderboardLayout>
  );
}
