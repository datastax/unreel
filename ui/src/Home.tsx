import { useNavigate } from "react-router-dom";
import { DataStax } from "./DataStax";
import { useState } from "react";
import { BodiBackground } from "./BodiBackground";
import { generateRoom } from "./util/generateRoom";

type State = {
  isCreatingRoom: boolean;
  roomCode: string;
};

export function Home() {
  const navigate = useNavigate();
  const [state, setState] = useState<State>({
    isCreatingRoom: false,
    roomCode: "",
  });

  const createRoom = async () => {
    setState((s) => ({ ...s, isCreatingRoom: true }));
    const roomId = await generateRoom();
    navigate(`/${roomId}`);
  };

  return (
    <main className="grid gap-4 relative">
      <div className="p-4 relative z-10 grid md:py-20 max-w-screen-md mx-auto min-h-svh gap-4 content-start w-svw">
        <DataStax />
        <div className="grid gap-8 content-start">
          <p>
            Welcome to <strong>Unreel</strong>: a team-based trivia game where
            players work together to identify quotes from popular movies, or
            identify quotes that were never said but generated with AI.
          </p>
          <div className="grid gap-4">
            <button
              disabled={state.isCreatingRoom}
              className="bg-white disabled:cursor-not-allowed disabled:opacity-50 text-black px-4 py-2 text-center rounded font-bold"
              onClick={createRoom}
              type="button"
            >
              {state.isCreatingRoom ? "Creating Room..." : "Host a Game"}
            </button>
            <div className="text-center text-gray-500 font-medium">— or —</div>
            <form
              onSubmit={(e) => {
                e.preventDefault();
                navigate(`/${state.roomCode}`);
              }}
              className="grid gap-2"
            >
              <label htmlFor="roomCode" className="grid gap-1">
                Room Code
              </label>
              <div className="flex items-center gap-2">
                <input
                  onChange={(e) =>
                    setState((s) => ({ ...s, roomCode: e.target.value }))
                  }
                  id="roomCode"
                  className="rounded grow bg-neutral-900 border border-neutral-700 px-4 py-2"
                  type="text"
                  name="room"
                />
                <button
                  disabled={!state.roomCode}
                  className="bg-white disabled:opacity-90 disabled:cursor-not-allowed grow-0 text-black px-2 md:px-4 py-2 text-center rounded font-bold"
                  type="submit"
                >
                  Join Game
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
      <BodiBackground />
    </main>
  );
}
