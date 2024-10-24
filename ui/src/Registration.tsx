import { useState } from "react";
import { teamBgColors } from "./util/teamBgColors";
import { useNavigate, useParams } from "react-router-dom";
import { useParty } from "./PartyContext";

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

  const handleEmailChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newEmail = e.target.value;
    setEmail(newEmail);
    setIsValid(validateEmail(newEmail));
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (isValid) {
      await requestPermission();
      if (!ws) return;
      ws.updateProperties({ id: email });
      ws.send(JSON.stringify({ type: "joinTeam", teamId, email }));
      navigate(`/team/${teamId}`);
    }
  };

  if (!teamId) {
    navigate("/");
    return null;
  }

  return (
    <div
      className={`flex flex-col items-center justify-center h-screen bg-${teamBgColors[teamId]} text-white`}
    >
      <h1 className="text-3xl font-bold mb-8">Join Team {teamId}</h1>
      <form onSubmit={handleSubmit} className="w-full max-w-sm">
        <div className="mb-4">
          <label htmlFor="email" className="block text-sm font-bold mb-2">
            Email:
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
        <div className="flex gap-2">
          <button
            type="submit"
            disabled={!isValid}
            className={`bg-white hover:bg-gray-100 text-gray-800 font-semibold py-2 px-4 border border-gray-400 rounded shadow
                disabled:opacity-50 disabled:cursor-not-allowed`}
          >
            Join Team
          </button>
        </div>
      </form>
    </div>
  );
}
