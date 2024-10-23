import { Route, Routes } from "react-router-dom";
import { ChooseTeam } from "./ChooseTeam";
import { Registration } from "./Registration";
import { TeamRoom } from "./TeamRoom";
import { PartyProvider } from "./PartyContext";
import { InGame } from "./InGame";
import { Admin } from "./Admin";
import { GameOver } from "./GameOver";

function App() {
  return (
    <PartyProvider>
      <Routes>
        <Route path="/" element={<ChooseTeam />} />
        <Route path="/registration/:teamId" element={<Registration />} />
        <Route path="/team/:teamId" element={<TeamRoom />} />
        <Route path="/game/:teamId" element={<InGame />} />
        <Route path="/admin" element={<Admin />} />
        <Route path="/game-over" element={<GameOver />} />
      </Routes>
    </PartyProvider>
  );
}

export default App;
