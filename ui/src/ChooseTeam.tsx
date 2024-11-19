import { useEffect, useState } from "react";
import { Link, useParams, useNavigate } from "react-router-dom";

import { PlayerCount } from "./PlayerCount";
import { teamBgColors } from "./util/teamBgColors";
import { useParty } from "./PartyContext";
import { type Team } from "../../common/types";
import { maxPlayersPerTeam } from "../../common/util";
import { DataStax } from "./DataStax";
import { WebSocketResponse } from "../../common/events";

export function ChooseTeam() {
  const [playersByTeam, setPlayersByTeam] = useState<Record<string, Team>>({});
  const { room } = useParams();
  const navigate = useNavigate();
  const { ws } = useParty();

  useEffect(() => {
    if (!ws) return;
    const queryParams = ws.partySocketOptions.query as Record<string, string>;
    ws.dispatch({
      type: "leaveTeam",
      playerId: queryParams.playerId ?? "",
    });
  }, [ws]);

  useEffect(() => {
    if (!ws) return;
    ws.dispatch({ type: "getState" });
    ws.onmessage = (event) => {
      const data = JSON.parse(event.data) as WebSocketResponse;
      if (data.type === "reset") {
        return navigate("/");
      }
      setPlayersByTeam(data.state.teams);
    };
  }, [ws]);

  return (
    <main className="p-4 grid grid-rows-[auto_auto_1fr] gap-4 h-svh w-svw">
      <div>
        <DataStax />
      </div>
      <div className="flex justify-end gap-2 items-center">
        Your room code is
        <span className="text-xl text-ds-quaternary font-bold">{room}</span>
      </div>
      <div className="grid gap-4 w-full h-full items-center justify-center content-center text-center grid-rows-2 grid-cols-2">
        {Object.entries(playersByTeam).map(([name, team]) => (
          <Link
            key={name}
            className={`${
              team.players.length >= maxPlayersPerTeam
                ? "pointer-events-none opacity-50"
                : ""
            } rounded grid gap-2 h-full relative content-center items-center justify-center text-3xl font-bold bg-${
              teamBgColors[name]
            } bg-cover bg-center bg-blend-overlay`}
            style={{
              backgroundImage: `url(/bodi/team-chooser.avif)`,
            }}
            to={`/${room}/registration/${name}`}
          >
            Team {name}
            <PlayerCount count={team.players.length} />
          </Link>
        ))}
      </div>
    </main>
  );
}
