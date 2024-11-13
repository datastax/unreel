import { useNavigate } from "react-router-dom";
import { useState } from "react";
import { generateRoomId } from "./util/generateRoomId";
import { defaultGameOptions, backends } from "../../common/util";
import { GameOptions } from "../../common/types";

type State = { isCreatingRoom: boolean; roomCode: string } & GameOptions;

export function Admin() {
  const navigate = useNavigate();
  const [state, setState] = useState<State>({
    isCreatingRoom: false,
    roomCode: "",
    ...defaultGameOptions,
  });

  const createRoom = async () => {
    setState((s) => ({ ...s, isCreatingRoom: true }));
    const roomId = await generateRoomId({
      backend: state.backend,
      numberOfQuestions: state.numberOfQuestions,
      roundDurationMs: state.roundDurationMs,
    });
    navigate(`/${roomId}/admin`);
  };

  return (
    <main className="p-4 grid md:py-20 max-w-screen-md mx-auto gap-4 min-h-svh content-start w-svw">
      <h1 className="md:text-6xl text-4xl font-bold">Game Management</h1>
      <div className="grid gap-8 content-start">
        <p>
          Welcome to the <strong>Unreel</strong> admin. Get ready to have fun.
        </p>
        <div className="grid gap-4">
          <form
            onSubmit={async (e) => {
              e.preventDefault();
              await createRoom();
            }}
          >
            <p className="grid mb-2">Choose backend:</p>
            <div className="flex items-center gap-2 mb-4">
              {backends.map((backend) => (
                <div
                  className="flex gap-4 items-center flex-grow"
                  key={backend}
                >
                  <label htmlFor={backend} className="gap-1">
                    {backend}
                  </label>
                  <input
                    checked={state.backend === backend}
                    onChange={() => setState((s) => ({ ...s, backend }))}
                    type="radio"
                    name="backend"
                    value={backend}
                    id={backend}
                    className="w-8 h-8"
                  />
                </div>
              ))}
            </div>
            <div className="flex items-center gap-2 mb-4">
              <label htmlFor="numberOfQuestions" className="gap-1">
                Number of questions:
              </label>
              <input
                onChange={(e) =>
                  setState((s) => ({
                    ...s,
                    numberOfQuestions: parseInt(e.target.value, 10),
                  }))
                }
                id="numberOfQuestions"
                className="rounded grow bg-neutral-900 border border-neutral-700 px-4 py-2"
                type="number"
                name="numberOfQuestions"
                value={state.numberOfQuestions}
              />
            </div>

            <div className="flex items-center gap-2 mb-4">
              <label htmlFor="roundDurationMs" className="gap-1">
                Round duration in ms:
              </label>
              <input
                onChange={(e) =>
                  setState((s) => ({
                    ...s,
                    roundDurationMs: parseInt(e.target.value, 10),
                  }))
                }
                id="roundDurationMs"
                className="rounded grow bg-neutral-900 border border-neutral-700 px-4 py-2"
                type="number"
                name="roundDurationMs"
                value={state.roundDurationMs}
              />
            </div>

            <div className="flex">
              <button
                disabled={state.isCreatingRoom}
                className="w-full bg-white disabled:cursor-not-allowed disabled:opacity-50 text-black px-4 py-2 text-center rounded font-bold"
                type="submit"
              >
                {state.isCreatingRoom ? "Creating Room..." : "Create a Room"}
              </button>
            </div>
          </form>
          <div className="text-center text-gray-500 font-medium">— or —</div>
          <form
            onSubmit={(e) => {
              e.preventDefault();
              navigate(`/${state.roomCode}/admin`);
            }}
            className="grid gap-2"
          >
            <label htmlFor="roomCode" className="grid gap-1">
              Join admin for room:
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
