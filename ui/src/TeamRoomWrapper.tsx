import { useParams } from "react-router-dom";
import { teamBgColors } from "./util/teamBgColors";

export function TeamRoomWrapper({ children }: { children: React.ReactNode }) {
  const { teamId } = useParams();
  return (
    <div
      className={`flex flex-col p-8 gap-4 items-center py-16 min-h-svh ${
        teamId ? `bg-${teamBgColors[teamId!]}` : "bg-black"
      }`}
    >
      {children}
    </div>
  );
}
