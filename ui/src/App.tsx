import { useEffect } from "react";
import { Route, Routes } from "react-router-dom";
import { PostHogProvider } from "posthog-js/react";

import { ChooseTeam } from "./ChooseTeam";
import { Registration } from "./Registration";
import { TeamRoom } from "./TeamRoom";
import { PartyProvider } from "./PartyContext";
import { InGame } from "./InGame";
import { Admin } from "./Admin";
import { GameOver } from "./GameOver";
import { preventSleep } from "./util/preventSleep";

const options = {
  api_host: import.meta.env.VITE_POSTHOG_HOST,
};

function App() {
  useEffect(() => {
    preventSleep();
  }, []);

  return (
    <PostHogProvider
      apiKey={import.meta.env.VITE_POSTHOG_KEY}
      options={options}
    >
      <PartyProvider>
        <Routes>
          <Route path="/" element={<ChooseTeam />} />
          <Route path="/registration/:teamId" element={<Registration />} />
          <Route path="/team/:teamId" element={<TeamRoom />} />
          <Route path="/game/:teamId" element={<InGame />} />
          <Route path="/admin" element={<Admin />} />
          <Route path="/game-over/:teamId" element={<GameOver />} />
        </Routes>
      </PartyProvider>
    </PostHogProvider>
  );
}

export default App;
