import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";

import { useParty } from "./PartyContext";
import { TeamRoomWrapper } from "./TeamRoomWrapper";
import { maxPlayersPerTeam } from "../../common/util";
import { WebSocketResponse } from "../../common/events";
import { checkMotionAvailability } from "./util/checkMotionAvailability";
import { BodiBackground } from "./BodiBackground";

type State = {
  email: string;
  understandsMotion: boolean;
};

export function Registration() {
  const [state, setState] = useState<State>({
    email: "",
    understandsMotion: false,
  });
  const { teamId, room } = useParams();
  const { ws } = useParty();
  const navigate = useNavigate();

  const requestPermission = async () => {
    let hasMotion = await checkMotionAvailability();

    // @ts-expect-error for some reason, TypeScript thinks requestPermission doesn't exist
    if (typeof DeviceMotionEvent.requestPermission !== "function") {
      return hasMotion;
    }

    // @ts-expect-error for some reason, TypeScript thinks requestPermission doesn't exist
    const permission = await DeviceMotionEvent.requestPermission();
    if (permission !== "granted") {
      hasMotion = false;
      alert(
        "Failed to get permission. You need to allow motion tracking to play the game."
      );
      return hasMotion;
    }
    hasMotion = true;
    return hasMotion;
  };

  const validateEmail = (email: string) => {
    const re = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
    return re.test(String(email).toLowerCase());
  };

  useEffect(() => {
    if (!teamId) {
      navigate(`/${room}`);
    }
  }, [teamId, navigate, room]);

  useEffect(() => {
    if (!ws) return;
    if (!teamId) return;
    ws.dispatch({ type: "getState" });
    ws.onmessage = (event) => {
      const data = JSON.parse(event.data) as WebSocketResponse;
      if (data.type === "reset") {
        return navigate("/");
      }
      if (data.state.teams[teamId].players.length > maxPlayersPerTeam) {
        alert("This team is full. Please choose another team.");
        return navigate(`/${room}`);
      }

      if (data.state.isGameStarted) {
        navigate(`/${room}/game/${teamId}`);
      }
    };
  }, [ws, teamId, room, state.email]);

  const handleEmailChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newEmail = e.target.value;
    setState((state) => ({ ...state, email: newEmail }));
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!teamId) return;
    if (!validateEmail(state.email)) return;
    if (!ws) return;
    const hasMotion = await requestPermission();
    try {
      sessionStorage.setItem("email", state.email);
      localStorage.setItem("email", state.email);
      // eslint-disable-next-line no-empty
    } catch {}
    ws.updateProperties({ query: { playerId: state.email } });
    ws.reconnect();
    ws.dispatch({ type: "joinTeam", teamId, email: state.email, hasMotion });
    await new Promise((resolve) => setTimeout(resolve, 300));
    navigate(`/${room}/team/${teamId}`);
  };

  useEffect(() => {
    try {
      const email =
        sessionStorage.getItem("email") || localStorage.getItem("email");
      if (email) {
        setState((state) => ({ ...state, email }));
      }
      // eslint-disable-next-line no-empty
    } catch {}
  }, []);

  return (
    <TeamRoomWrapper>
      <div className="w-full relative z-10 grid gap-4">
        <h1 className="text-5xl font-bold">Join Team {teamId}</h1>
        <p className="text-xl">
          We need to know where to send your prize if you win, so please enter
          your email below.
        </p>
      </div>
      <form onSubmit={handleSubmit} className="w-full relative z-10 grid gap-4">
        <div className="grid gap-2">
          <label htmlFor="email" className="block font-bold">
            Email Address
          </label>
          <input
            type="email"
            id="email"
            value={state.email}
            onChange={handleEmailChange}
            className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
            required
          />
        </div>
        <label className="flex gap-2 items-center">
          <input
            type="checkbox"
            className="w-8 h-8"
            checked={state.understandsMotion}
            onChange={(e) => {
              requestPermission();
              setState((state) => ({
                ...state,
                understandsMotion: e.target.checked,
              }));
            }}
          />
          I understand that this game requires motion tracking and I will allow
          it if asked.
        </label>
        <div className="flex gap-2 items-center">
          <button
            type="submit"
            disabled={!validateEmail(state.email) || !state.understandsMotion}
            className={`bg-white w-full hover:bg-gray-100 text-gray-800 font-semibold py-2 px-4 border border-gray-400 rounded shadow
                disabled:opacity-90 disabled:bg-gray-200 disabled:text-gray-400 disabled:cursor-not-allowed`}
          >
            Join Team
          </button>
        </div>
      </form>
      <BodiBackground />
    </TeamRoomWrapper>
  );
}
