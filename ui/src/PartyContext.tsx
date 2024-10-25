import { createContext, useContext, useState } from "react";
import { usePartySocket } from "partysocket/react";
import PartySocket from "partysocket";

const PartyContext = createContext<{ ws: PartySocket | null }>({ ws: null });

export const useParty = () => useContext(PartyContext);

export const PartyProvider = ({ children }: { children: React.ReactNode }) => {
  const [error, setError] = useState<boolean | null>(false);
  let email = "";

  try {
    email = localStorage.getItem("email") || "";
  } catch {
    // eslint-disable-next-line no-empty
  }

  const ws = usePartySocket({
    host: import.meta.env.VITE_PARTYKIT_HOST,
    room: "lobby",
    ...(email && { id: email }),
    onError: () => {
      setError(true);
    },
  });

  if (error) {
    return (
      <div className="p-8 h-svh">
        <div className="rounded text-2xl grid gap-4 content-center text-center bg-ds-primary h-full text-white p-8">
          <h1 className="text-6xl font-bold">Oh no!</h1>
          <p>Cannot connect to the game server! Please ask a host about it.</p>
        </div>
      </div>
    );
  }

  return (
    <PartyContext.Provider value={{ ws }}>{children}</PartyContext.Provider>
  );
};
