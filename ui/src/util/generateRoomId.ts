import { defaultGameOptions } from "../../../common/util";
import type { GameOptions } from "../../../common/types";

export async function generateRoomId(roomOptions: Partial<GameOptions> = {}) {
  const options = { ...defaultGameOptions, ...roomOptions };
  const id = roomId();
  const url = new URL(
    `${import.meta.env.VITE_PARTYKIT_HOST}/parties/main/${id}`
  );

  let key: keyof GameOptions;
  for (key in options) {
    url.searchParams.append(key, String(options[key]));
  }
  const connections = await fetch(url).then((r) => r.json());

  if (connections.length > 0) {
    return await generateRoomId(options);
  }

  return id;
}

function roomId() {
  const timestamp = Date.now().toString(36);
  const array = new Uint8Array(2);
  crypto.getRandomValues(array);
  const randomPart = Array.from(array, (x) => (x % 36).toString(36)).join("");
  return (timestamp.slice(-2) + randomPart).toUpperCase();
}
