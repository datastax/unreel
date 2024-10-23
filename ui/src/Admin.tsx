import { useState, useEffect } from "react";
import { useParty } from "./PartyContext";
import { Team, Quote } from "../../common/types";

export function Admin() {
  const [teams, setTeams] = useState<Record<string, Team>>({});
  const [currentQuote, setCurrentQuote] = useState<Quote | null>(null);
  const [allQuotes, setAllQuotes] = useState<Quote[]>([]);
  const { ws } = useParty();

  useEffect(() => {
    if (!ws) return;

    ws.send(JSON.stringify({ type: "getTeams" }));
    ws.send(JSON.stringify({ type: "getQuotes" }));

    ws.onmessage = (event) => {
      const data = JSON.parse(event.data);
      switch (data.type) {
        case "teams":
        case "playerJoined":
        case "playerLeft":
          setTeams(() => data.teams);
          break;
        case "quotes":
        case "gameStarted":
          setAllQuotes(() => data.quotes);
          setCurrentQuote(() => data.quotes[data.currentQuoteIndex]);
          break;
        case "nextQuote":
          setCurrentQuote(() => data.quote);
          break;
        case "resetGame":
          window.location.reload();
          break;
        case "updateTeamScore":
          setTeams(() => data.teams);
          break;
        case "options":
          setTeams(() => data.teams);
          break;
        case "roundDecided":
          {
            const updatedTeams = { ...teams };
            updatedTeams[data.teamId].score = data.score;
            setTeams(updatedTeams);
          }
          break;
      }
    };
  }, [ws]);

  const handleStartGame = () => {
    if (ws) {
      ws.send(JSON.stringify({ type: "startGame" }));
    }
  };

  const handleSendNextQuote = () => {
    if (ws) {
      ws.send(JSON.stringify({ type: "nextQuote" }));
    }
  };

  const handleResetGame = () => {
    if (ws) {
      ws.send(JSON.stringify({ type: "resetGame" }));
    }
  };

  return (
    <div className="p-4">
      <h1 className="text-2xl font-bold mb-4">Admin Panel</h1>
      <button
        onClick={handleStartGame}
        className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded mr-2"
      >
        Start Game
      </button>
      <button
        onClick={handleSendNextQuote}
        className="bg-green-500 hover:bg-green-700 text-white font-bold py-2 px-4 rounded mr-2"
      >
        Send Next Quote
      </button>
      <button
        onClick={handleResetGame}
        className="bg-red-500 hover:bg-red-700 text-white font-bold py-2 px-4 rounded"
      >
        Reset Game
      </button>
      <div className="mb-4">
        <h2 className="text-xl font-semibold mb-2">Quotes:</h2>
        {allQuotes.map((quote, index) => (
          <div
            key={index}
            className={`bg-gray-100 p-4 rounded mb-2 ${
              currentQuote && currentQuote.quote === quote.quote
                ? "border-2 border-blue-500"
                : ""
            }`}
          >
            <p className="font-bold">{quote.quote}</p>
            <ul className="list-disc list-inside">
              {quote.options.map((option, optionIndex) => (
                <li
                  key={optionIndex}
                  className={
                    optionIndex === quote.correctOptionIndex
                      ? "text-green-600 font-bold"
                      : ""
                  }
                >
                  {option}
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>
      <div className="mb-4">
        <h2 className="text-xl font-semibold mb-2">Teams:</h2>
        {Object.entries(teams).map(([teamId, teamData]) => (
          <div key={teamId} className="mb-4">
            <h3 className="font-medium mb-2">
              Team {teamId} - Score: {teamData.score}
            </h3>
            <div className="overflow-x-auto">
              <table className="w-full border-collapse border border-gray-300">
                <thead>
                  <tr className="bg-gray-100">
                    <th className="border border-gray-300 px-4 py-2">Player</th>
                    {allQuotes.map((_, index) => (
                      <th
                        key={index}
                        className="border border-gray-300 px-4 py-2"
                      >
                        Round {index + 1}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {teamData.players.map((player) => (
                    <tr key={player.id}>
                      <td className="border border-gray-300 px-4 py-2">
                        {player.email}
                      </td>
                      {allQuotes.map((_, quoteIndex) => {
                        const choice = player.choices[quoteIndex];
                        return (
                          <td
                            key={`${teamId}-${player.id}-${quoteIndex}`}
                            className="border border-gray-300 px-4 py-2"
                          >
                            {choice
                              ? `${choice.value} (${choice.status})`
                              : `N/A (undecided)`}
                          </td>
                        );
                      })}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
