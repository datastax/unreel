import type { Team } from "../../../common/types";
import { miniAstra } from "./miniAstra";

export async function storePlayersInDb(teams: Team[]) {
  teams
    .flatMap((team) => team.players)
    .forEach((player) => {
      miniAstra.updateOne("players", {
        filter: { email: player.email },
        update: { $set: { email: player.email }, $inc: { plays: 1 } },
        options: { upsert: true },
      });
    });
}
