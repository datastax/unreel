import { defaultGameOptions } from "../../../common/util";
import type { GameOptions } from "../../../common/types";

export async function generateRoom(roomOptions: Partial<GameOptions> = {}) {
  const options = { ...defaultGameOptions, ...roomOptions };
  const id = generateRoomId();
  const url = new URL(
    `${import.meta.env.VITE_PARTYKIT_HOST}/parties/main/${id}`
  );

  let option: keyof GameOptions;
  for (option in options) {
    url.searchParams.append(option, String(options[option]));
  }
  const connections = await fetch(url).then((r) => r.json());

  if (connections.length > 0) {
    return await generateRoom(options);
  }

  return id;
}

function generateRoomId() {
  const timestamp = Date.now().toString(36);
  const array = new Uint8Array(2);
  crypto.getRandomValues(array);
  const randomPart = Array.from(array, (x) => (x % 36).toString(36)).join("");
  return (timestamp.slice(-2) + randomPart).toUpperCase();
}
