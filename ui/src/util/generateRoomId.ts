export async function generateRoomId() {
  const timestamp = Date.now().toString(36);
  const array = new Uint8Array(2);
  crypto.getRandomValues(array);
  const randomPart = Array.from(array, (x) => (x % 36).toString(36)).join("");
  const roomId = (timestamp.slice(-2) + randomPart).toUpperCase();
  const connections = await fetch(
    `${import.meta.env.VITE_PARTYKIT_HOST}/parties/main/reinvent/${roomId}`
  ).then((r) => r.json());

  if (connections.length > 0) {
    return await generateRoomId();
  }

  return roomId;
}
