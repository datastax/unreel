import { Route, Routes, useNavigate, useParams } from "react-router-dom";

import { ChooseTeam } from "./ChooseTeam";
import { Registration } from "./Registration";
import { TeamRoom } from "./TeamRoom";
import { PartyProvider } from "./PartyContext";
import { InGame } from "./InGame";
import { GameOver } from "./GameOver";
import { useEffect } from "react";
import { RoomAdmin } from "./RoomAdmin";

function Room() {
  const { room } = useParams();
  const navigate = useNavigate();

  useEffect(() => {
    if (!room) {
      navigate("/");
    }
  }, [room]);

  if (!room) {
    return null;
  }

  return (
    <PartyProvider room={room}>
      <Routes>
        <Route path="/" element={<ChooseTeam />} />
        <Route path="/registration/:teamId" element={<Registration />} />
        <Route path="/team/:teamId" element={<TeamRoom />} />
        <Route path="/game/:teamId" element={<InGame />} />
        <Route path="/game-over/:teamId" element={<GameOver />} />
        <Route path="/admin" element={<RoomAdmin />} />
      </Routes>
    </PartyProvider>
  );
}

export default Room;
