import { useParams } from "react-router-dom";
import { teamBgColors } from "./util/teamBgColors";

export function TeamRoomWrapper({ children }: { children: React.ReactNode }) {
  const { teamId } = useParams();
  return (
    <div
      className={`flex flex-col items-center justify-center h-screen ${
        teamId ? `bg-${teamBgColors[teamId!]}` : "bg-black"
      } text-white`}
    >
      {children}
    </div>
  );
}
