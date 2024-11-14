import { useParams } from "react-router-dom";
import { teamBgColors } from "./util/teamBgColors";

export function TeamRoomWrapper({ children }: { children: React.ReactNode }) {
  const { teamId } = useParams();
  return (
    <div
      className={`flex relative flex-col p-8 gap-8 items-center min-h-svh ${
        teamId ? `bg-${teamBgColors[teamId!]}` : "bg-black"
      }`}
    >
      {children}
    </div>
  );
}
