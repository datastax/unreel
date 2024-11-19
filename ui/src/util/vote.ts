import { GameState } from "../../../common/types";
import { TypeSafePartySocket } from "../PartyContext";

type VoteProps = {
  choice: "up" | "down";
  gameState: GameState;
  meIndex: number;
  teamId: string;
  ws: TypeSafePartySocket;
};

export const vote = ({ choice, gameState, meIndex, teamId, ws }: VoteProps) => {
  if (!ws) return;
  if (!gameState) return;
  if (!teamId) return;

  const queryParams = ws.partySocketOptions.query as Record<string, string>;
  const me = gameState.teams[teamId].players.find(
    (p: { email: string }) => p.email === queryParams.playerId
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
    playerId: queryParams.playerId ?? "",
  });
};
