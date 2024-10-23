import { useEffect, useState } from "react";
import { PlayerCount } from "./PlayerCount";
import { teamBgColors } from "./util/teamBgColors";
import { useParty } from "./PartyContext";
import { Link } from "react-router-dom";

export function ChooseTeam() {
  const [playersByTeam, setPlayersByTeam] = useState<Record<string, string[]>>(
    {}
  );

  const { ws } = useParty();

  useEffect(() => {
    if (!ws) return;
    ws.send(JSON.stringify({ type: "getTeams" }));
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
    <div className="grid p-4 gap-4 h-svh w-svw items-center justify-center content-center text-center grid-rows-2 grid-cols-2">
      {Object.entries(playersByTeam).map(([name, players]) => (
        <Link
          key={name}
          className={`rounded grid gap-2 h-full content-center items-center justify-center text-white text-xl font-bold bg-${teamBgColors[name]}`}
          to={`/registration/${name}`}
        >
          Team {name}
          <PlayerCount count={players.length} />
        </Link>
      ))}
    </div>
  );
}
