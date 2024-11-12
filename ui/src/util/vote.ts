import { WebSocketResponse } from "../../../common/events";
import { GameState } from "../../../common/types";
import { TypeSafePartySocket } from "../PartyContext";

type VoteProps = {
  choice: "up" | "down";
  gameState: GameState;
  meIndex: number;
  teamId: string;
  ws: TypeSafePartySocket;
};

export const vote = ({ choice, gameState, meIndex, teamId, ws }: VoteProps) =>
  new Promise((resolve) => {
    if (!ws) return;
    if (!gameState) return;
    if (!teamId) return;

    const me = gameState.teams[teamId].players.find(
      (p: { email: string }) => p.email === ws.id
    );

    if (!me) return;

    const lastOrientation = me.phonePosition;

    if (choice === "up" && lastOrientation === "faceUp") return;
    if (choice === "down" && lastOrientation === "faceDown") return;

    ws.dispatch({
      type: "updatePhonePosition",
      teamId,
      playerIndex: meIndex,
      phonePosition: choice === "up" ? "faceUp" : "faceDown",
    });

    if (gameState.gameEndedAt) return;
    if (gameState.isRoundDecided) return;

    ws.dispatch({
      type: choice === "up" ? "acceptOption" : "rejectOption",
      teamId: teamId,
      playerId: ws.id,
    });

    const handleEvent = (event: MessageEvent) => {
      const data = JSON.parse(event.data) as WebSocketResponse;
      if (confirmNewPosition(lastOrientation, data.state, teamId, ws)) {
        resolve(true);
        ws.removeEventListener("message", handleEvent);
      }
    };

    ws.addEventListener("message", handleEvent);
  });

const confirmNewPosition = (
  lastOrientation: string | null,
  state: GameState,
  teamId: string,
  ws: TypeSafePartySocket
) => {
  const me = state.teams[teamId].players.find(
    (p: { email: string }) => p.email === ws.id
  );
  if (!me) return;

  return me.phonePosition !== lastOrientation;
};
