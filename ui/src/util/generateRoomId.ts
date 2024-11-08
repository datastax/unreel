import { backends, GameOptions } from "../../../common/types";

export async function generateRoomId(roomOptions?: GameOptions) {
  const backend = roomOptions?.backend ?? backends[0];
  const timestamp = Date.now().toString(36);
  const array = new Uint8Array(2);
  crypto.getRandomValues(array);
  const randomPart = Array.from(array, (x) => (x % 36).toString(36)).join("");
  const roomId = (timestamp.slice(-2) + randomPart).toUpperCase();
  const url = new URL(
    `${import.meta.env.VITE_PARTYKIT_HOST}/parties/main/${roomId}`
  );
  url.searchParams.append("backend", backend);
  const connections = await fetch(url).then((r) => r.json());

  if (connections.length > 0) {
    return await generateRoomId({ backend });
  }

  return roomId;
}
