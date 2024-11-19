import { GameOptions } from "../../common/types";

type AdminOptionsProps = {
  options: Readonly<GameOptions>;
};

export const AdminOptions: React.FC<AdminOptionsProps> = ({ options }) => {
  return (
    <div className="flex items-center gap-4">
      <div>
        Round duration:&nbsp;
        <span className="font-bold text-ds-quaternary">
          {options.roundDurationMs / 1000}s
        </span>
      </div>{" "}
      ●
      <div>
        Number of Questions:{" "}
        <span className="font-bold text-ds-quaternary">
          {options.numberOfQuestions}
        </span>
      </div>{" "}
      ●
      <div>
        Backend:{" "}
        <span className="font-bold text-ds-quaternary">{options.backend}</span>
      </div>
    </div>
  );
};
