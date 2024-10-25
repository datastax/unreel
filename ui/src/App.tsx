import { useEffect } from "react";
import { Route, Routes } from "react-router-dom";
import { PostHogProvider } from "posthog-js/react";
import * as Sentry from "@sentry/react";

import { ChooseTeam } from "./ChooseTeam";
import { Registration } from "./Registration";
import { TeamRoom } from "./TeamRoom";
import { PartyProvider } from "./PartyContext";
import { InGame } from "./InGame";
import { Admin } from "./Admin";
import { GameOver } from "./GameOver";
import { preventSleep } from "./util/preventSleep";

Sentry.init({
  dsn: "https://b49a717d19bf879220ef6dd8bf66d421@o4508182996910080.ingest.us.sentry.io/4508182998089728",
  integrations: [
    Sentry.browserTracingIntegration(),
    Sentry.replayIntegration(),
  ],
  // Tracing
  tracesSampleRate: 1.0, //  Capture 100% of the transactions
  // Set 'tracePropagationTargets' to control for which URLs distributed tracing should be enabled
  tracePropagationTargets: ["localhost", /^https:\/\/yourserver\.io\/api/],
  // Session Replay
  replaysSessionSampleRate: 0.1, // This sets the sample rate at 10%. You may want to change it to 100% while in development and then sample at a lower rate in production.
  replaysOnErrorSampleRate: 1.0, // If you're not already sampling the entire session, change the sample rate to 100% when sampling sessions where errors occur.
});

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
