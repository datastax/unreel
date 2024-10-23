import { Route, Routes } from "react-router-dom";
import { ChooseTeam } from "./ChooseTeam";
import { Registration } from "./Registration";
import { TeamRoom } from "./TeamRoom";
import { PartyProvider } from "./PartyContext";

function App() {
  return (
    <PartyProvider>
      <Routes>
        <Route path="/" element={<ChooseTeam />} />
        <Route path="/registration/:teamId" element={<Registration />} />
        <Route path="/team/:teamId" element={<TeamRoom />} />
      </Routes>
    </PartyProvider>
  );
}

export default App;
