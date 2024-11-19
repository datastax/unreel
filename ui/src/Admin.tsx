import { useNavigate } from "react-router-dom";
import { useState } from "react";
import { generateRoom } from "./util/generateRoom";
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
    const roomId = await generateRoom({
      backend: state.backend,
      numberOfQuestions: state.numberOfQuestions,
      roundDurationMs: state.roundDurationMs,
    });
    navigate(`/${roomId}/admin`);
  };

  return (
    <main className="p-4 grid md:py-20 max-w-screen-md mx-auto gap-4 min-h-svh content-start w-svw">
      <h1 className="md:text-6xl text-4xl font-bold">Create a Room</h1>
      <div className="grid gap-8 content-start">
        <p className="text-xl">
          You can use this interface to create custom rooms with specific
          settings to fully tailor a game's experience.
        </p>
        <div className="grid gap-8">
          <form
            className="grid gap-4"
            onSubmit={async (e) => {
              e.preventDefault();
              await createRoom();
            }}
          >
            <div className="flex flex-col gap-2">
              <p>Choose Your Backend</p>
              <div className="flex flex-col items-start gap-2">
                {backends.map((backend) => (
                  <div key={backend}>
                    <label className="flex items-center gap-2">
                      <input
                        checked={state.backend === backend}
                        onChange={() => setState((s) => ({ ...s, backend }))}
                        type="radio"
                        name="backend"
                        value={backend}
                        className="w-8 h-8"
                      />
                      {backend}
                    </label>
                  </div>
                ))}
              </div>
            </div>
            <div className="flex gap-4">
              <label className="flex flex-col gap-2">
                Number of Questions
                <input
                  onChange={(e) =>
                    setState((s) => ({
                      ...s,
                      numberOfQuestions: parseInt(e.target.value, 10),
                    }))
                  }
                  className="rounded grow bg-neutral-900 border border-neutral-700 px-4 py-2"
                  type="number"
                  name="numberOfQuestions"
                  value={state.numberOfQuestions}
                />
              </label>
              <label htmlFor="roundDurationMs" className="flex flex-col gap-2">
                Round Duration (seconds)
                <input
                  onChange={(e) =>
                    setState((s) => ({
                      ...s,
                      roundDurationMs: parseFloat(e.target.value) * 1000,
                    }))
                  }
                  id="roundDurationMs"
                  className="rounded grow bg-neutral-900 border border-neutral-700 px-4 py-2"
                  type="number"
                  name="roundDurationMs"
                  value={state.roundDurationMs / 1000}
                />
              </label>
            </div>
            <div className="flex">
              <button
                disabled={state.isCreatingRoom}
                className="w-full bg-white disabled:cursor-not-allowed disabled:opacity-50 text-black px-4 py-2 text-center rounded font-bold"
                type="submit"
              >
                {state.isCreatingRoom ? "Creating Room..." : "Create Room"}
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
              Join Admin Area for Room
            </label>
            <div className="flex items-center gap-2">
              <input
                onChange={(e) =>
                  setState((s) => ({
                    ...s,
                    roomCode: e.target.value.toUpperCase(),
                  }))
                }
                id="roomCode"
                className="rounded grow bg-neutral-900 border border-neutral-700 px-4 py-2"
                type="text"
                name="room"
                value={state.roomCode}
              />
              <button
                disabled={!state.roomCode}
                className="bg-white disabled:opacity-50 disabled:cursor-not-allowed grow-0 text-black px-2 md:px-4 py-2 text-center rounded font-bold"
                type="submit"
              >
                Join
              </button>
            </div>
          </form>
        </div>
      </div>
    </main>
  );
}
