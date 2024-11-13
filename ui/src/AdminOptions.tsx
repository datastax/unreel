import { GameOptions } from "../../common/types";

type AdminOptionsProps = {
  options: Readonly<GameOptions>;
};

export const AdminOptions: React.FC<AdminOptionsProps> = ({ options }) => {
  return (
    <div className="grid gap-4">
      <h2 className="text-4xl font-semibold">Game options</h2>
      <dl className="border border-neutral-800 p-4 rounded grid grid-cols-[max-content_auto] gap-y-2 gap-x-4">
        <dt className="text-right">Round duration:</dt>
        <dd>
          <strong>{options.roundDurationMs}ms</strong>
        </dd>
        <dt className="text-right">Number of Questions:</dt>{" "}
        <dd>
          <strong>{options.numberOfQuestions}</strong>
        </dd>
        <dt className="text-right">Backend:</dt>{" "}
        <dd>
          <strong>{options.backend}</strong>
        </dd>
      </dl>
    </div>
  );
};
