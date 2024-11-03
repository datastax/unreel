import { useNavigate } from "react-router-dom";
import { DataStax } from "./DataStax";
import { useState } from "react";
import { generateRoomId } from "./util/generateRoomId";

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
    const roomId = await generateRoomId();
    navigate(`/${roomId}`);
  };

  return (
    <main className="p-4 grid md:py-20 max-w-screen-md mx-auto grid-rows-[auto_1fr] gap-4 h-svh w-svw">
      <DataStax />
      <div className="grid gap-8 content-start">
        Unreel is a team-based trivia game where players work together to
        identify quotes from popular movies, or identify quotes that were never
        said but generated with AI.
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
                className="bg-white disabled:opacity-50 disabled:cursor-not-allowed grow-0 text-black px-2 md:px-4 py-2 text-center rounded font-bold"
                type="submit"
              >
                Join Game
              </button>
            </div>
          </form>
        </div>
      </div>
    </main>
  );
}
