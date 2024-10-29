import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";

import { useParty } from "./PartyContext";
import { TeamRoomWrapper } from "./TeamRoomWrapper";
import { maxPlayersPerTeam } from "../../common/types";
import { WebSocketResponse } from "../../common/events";

export function Registration() {
  const [email, setEmail] = useState("");
  const [isValid, setIsValid] = useState(false);
  const { teamId } = useParams();
  const { ws } = useParty();
  const navigate = useNavigate();

  const requestPermission = async () => {
    // @ts-expect-error for some reason, TypeScript thinks requestPermission doesn't exist
    if (typeof DeviceMotionEvent.requestPermission !== "function") {
      return;
    }

    // @ts-expect-error for some reason, TypeScript thinks requestPermission doesn't exist
    return DeviceMotionEvent.requestPermission()
      .then((permissionState: PermissionState) => {
        if (permissionState !== "granted") {
          alert(
            "Failed to get permission. You need to allow motion tracking to play the game."
          );
        }
      })
      .catch((e: Error) => {
        alert("Failed to get permission: " + e.message);
      });
  };

  const validateEmail = (email: string) => {
    const re = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
    return re.test(String(email).toLowerCase());
  };

  useEffect(() => {
    if (!teamId) {
      navigate("/");
    }
  }, [teamId, navigate]);

  useEffect(() => {
    if (!ws) return;
    if (!teamId) return;
    ws.dispatch({ type: "getState" });
    ws.onmessage = (event) => {
      const data = JSON.parse(event.data) as WebSocketResponse;
      if (
        data.type === "state" &&
        data.state.teams[teamId].players.length > maxPlayersPerTeam
      ) {
        alert("This team is full. Please choose another team.");
        navigate("/");
        return;
      }
    };
    ws.dispatch({ type: "joinTeam", teamId, email: ws.id });
  }, [ws, teamId, email]);

  useEffect(() => {
    setIsValid(validateEmail(email));
  }, [email]);

  const handleEmailChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newEmail = e.target.value;
    setEmail(newEmail);
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!teamId) return;
    if (isValid) {
      await requestPermission();
      if (!ws) return;
      try {
        localStorage.setItem("email", email);
        // eslint-disable-next-line no-empty
      } catch {}
      ws.updateProperties({ id: email });
      ws.reconnect();
      navigate(`/team/${teamId}`);
    }
  };

  useEffect(() => {
    try {
      const email = localStorage.getItem("email");
      if (email) {
        setEmail(email);
      }
      // eslint-disable-next-line no-empty
    } catch {}
  }, []);

  return (
    <TeamRoomWrapper>
      <h1 className="text-5xl font-bold mb-8">Join Team {teamId}</h1>
      <p className="text-xl mb-8">
        We need to know where to send your prize if you win, so please enter
        your email below.
      </p>
      <form onSubmit={handleSubmit} className="w-full max-w-sm">
        <div className="mb-4">
          <label htmlFor="email" className="block font-bold mb-2">
            Email Address
          </label>
          <input
            type="email"
            id="email"
            value={email}
            onChange={handleEmailChange}
            className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
            required
          />
        </div>
        <p className="text-sm mb-4">
          This game requires a bit of motion tracking, so please allow it when
          asked.
        </p>
        <div className="flex gap-2 items-center">
          <button
            type="submit"
            disabled={!isValid}
            className={`bg-white w-full hover:bg-gray-100 text-gray-800 font-semibold py-2 px-4 border border-gray-400 rounded shadow
                disabled:opacity-50 disabled:cursor-not-allowed`}
          >
            Join Team
          </button>
        </div>
      </form>
    </TeamRoomWrapper>
  );
}
