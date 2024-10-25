import { useEffect, useState } from "react";
import { Link } from "react-router-dom";

import { PlayerCount } from "./PlayerCount";
import { teamBgColors } from "./util/teamBgColors";
import { useParty } from "./PartyContext";
import { maxPlayersPerTeam, type Team } from "../../common/types";
import { DataStax } from "./DataStax";

export function ChooseTeam() {
  const [playersByTeam, setPlayersByTeam] = useState<Record<string, Team>>({});

  const { ws } = useParty();

  useEffect(() => {
    if (!ws) return;
    ws.dispatch({ type: "getTeams" });
    ws.onmessage = (event) => {
      const data = JSON.parse(event.data);
      switch (data.type) {
        case "teams":
        case "playerJoined":
        case "playerLeft":
          setPlayersByTeam(data.teams);
          break;
      }
    };
  }, [ws]);

  return (
    <main className="p-4 grid grid-rows-[auto_1fr] gap-4 h-svh w-svw">
      <div>
        <DataStax />
      </div>
      <div className="grid gap-4 w-full h-full items-center justify-center content-center text-center grid-rows-2 grid-cols-2">
        {Object.entries(playersByTeam).map(([name, team]) => (
          <Link
            key={name}
            className={`${
              team.players.length >= maxPlayersPerTeam
                ? "pointer-events-none opacity-50"
                : ""
            } rounded grid gap-2 h-full content-center items-center justify-center text-white text-3xl font-bold bg-${
              teamBgColors[name]
            }`}
            to={`/registration/${name}`}
          >
            Team {name}
            <PlayerCount count={team.players.length} />
          </Link>
        ))}
      </div>
    </main>
  );
}
