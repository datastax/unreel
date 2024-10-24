import { createContext, useContext } from "react";
import { usePartySocket } from "partysocket/react";
import PartySocket from "partysocket";

const PartyContext = createContext<{ ws: PartySocket | null }>({ ws: null });

export const useParty = () => useContext(PartyContext);

export const PartyProvider = ({ children }: { children: React.ReactNode }) => {
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
  });

  return (
    <PartyContext.Provider value={{ ws }}>{children}</PartyContext.Provider>
  );
};
