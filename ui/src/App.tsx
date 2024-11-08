import { useEffect } from "react";
import { Route, Routes } from "react-router-dom";
import { PostHogProvider } from "posthog-js/react";
import * as Sentry from "@sentry/react";

import { preventSleep } from "./util/preventSleep";
import Room from "./Room";
import { Home } from "./Home";
import { Admin } from "./Admin";

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
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/admin/" element={<Admin />} />
        <Route path="/:room/*" element={<Room />} />
      </Routes>
    </PostHogProvider>
  );
}

export default App;
