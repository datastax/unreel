import PartySocket from "partysocket";

export const connect = (teamName: string) => {
  // A PartySocket is like a WebSocket, except it's a bit more magical.
  // It handles reconnection logic, buffering messages while it's offline, and more.
  const conn = new PartySocket({
    host: "http://localhost:1999",
    room: teamName,
  });

  return conn;
};
