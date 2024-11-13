type AdminGameManagementProps = {
  totalPlayers: number;
  room: string;
  handleSendNextQuote: () => void;
  handleResetGame: () => void;
};

export const AdminGameManagement: React.FC<AdminGameManagementProps> = ({
  totalPlayers,
  room,
  handleSendNextQuote,
  handleResetGame,
}) => {
  return (
    <>
      <h1 className="md:text-6xl text-4xl font-bold">Game Management</h1>
      <fieldset className="border flex flex-col md:flex-row items-center gap-2 justify-between rounded p-4 border-neutral-800">
        <div className="text-lg">{totalPlayers} players connected.</div>
        <div className="flex items-center gap-2">
          <a
            href={`/${room}/leaderboard`}
            className="md:text-base text-sm border border-white text-white font-bold py-2 px-4 rounded mr-2"
            target="_blank"
          >
            Open Leaderboard
          </a>
          <button
            onClick={handleSendNextQuote}
            className="md:text-base text-sm border border-white text-white font-bold py-2 px-4 rounded mr-2"
          >
            Send Next Quote
          </button>
          <button
            onClick={handleResetGame}
            className="md:text-base text-sm border-red-500 border text-red-400 font-bold py-2 px-4 rounded"
          >
            Reset Game
          </button>
        </div>
      </fieldset>
    </>
  );
};
