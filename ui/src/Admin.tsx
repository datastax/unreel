import { useState, useEffect, useRef } from "react";
import { useParty } from "./PartyContext";
import { Team, Quote } from "../../common/types";
import { teamBgColors } from "./util/teamBgColors";
import { PlayerCount } from "./PlayerCount";

export function Admin() {
  const [teams, setTeams] = useState<Record<string, Team>>({});
  const [currentQuote, setCurrentQuote] = useState<Quote | null>(null);
  const [allQuotes, setAllQuotes] = useState<Quote[]>([]);
  const { ws } = useParty();
  const quotesContainerRef = useRef<HTMLDivElement>(null);

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

  useEffect(() => {
    if (currentQuote && quotesContainerRef.current) {
      const currentQuoteElement =
        quotesContainerRef.current.querySelector(".border-ds-primary");
      if (currentQuoteElement) {
        currentQuoteElement.scrollIntoView({
          behavior: "smooth",
          inline: "center",
        });
      }
    }
  }, [currentQuote]);

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

  const totalPlayers = Object.values(teams).reduce(
    (acc, team) => acc + team.players.length,
    0
  );
  return (
    <div className="p-8 grid gap-8">
      <h1 className="text-6xl font-bold">Game Management</h1>
      <fieldset className="border flex items-center gap-2 justify-between rounded p-4 border-neutral-800">
        <div className="text-lg">{totalPlayers} players connected.</div>
        <div className="flex items-center gap-2">
          <button
            onClick={handleSendNextQuote}
            className="border border-white text-white font-bold py-2 px-4 rounded mr-2"
          >
            Send Next Quote
          </button>
          <button
            onClick={handleResetGame}
            className="border-red-500 border text-red-400 font-bold py-2 px-4 rounded"
          >
            Reset Game
          </button>
        </div>
      </fieldset>
      <div className="grid gap-4">
        <h2 className="text-4xl font-semibold">Quotes</h2>
        {allQuotes.length === 0 ? (
          <div className="border border-neutral-800 p-4 rounded grid gap-2 items-center justify-center">
            <span>No quotes yet.</span>
            <button
              onClick={handleStartGame}
              className="bg-white text-black font-bold py-2 px-4 rounded"
            >
              Start Game
            </button>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <div ref={quotesContainerRef} className="flex space-x-4">
              {allQuotes.map((quote, index) => (
                <div
                  key={index}
                  className={`border grid gap-1 p-4 rounded flex-shrink-0 w-64 ${
                    currentQuote && currentQuote.quote === quote.quote
                      ? "border-2 border-ds-primary"
                      : "border-neutral-800"
                  }`}
                >
                  <p className="font-bold">&ldquo;{quote.quote}&rdquo;</p>
                  <ul className="list-disc list-inside">
                    {quote.options.map((option, optionIndex) => (
                      <li
                        key={optionIndex}
                        className={
                          optionIndex === quote.correctOptionIndex
                            ? "text-ds-quaternary font-bold"
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
          </div>
        )}
      </div>
      <div className="grid gap-4">
        <h2 className="text-4xl font-semibold">Teams</h2>
        <div className="grid gap-4 grid-cols-2">
          {Object.entries(teams).map(([teamId, teamData]) => (
            <div
              key={teamId}
              className={`bg-${teamBgColors[teamId]} grid gap-4 rounded p-4`}
            >
              <h3 className="flex items-center justify-between">
                <span>Team {teamId}</span>
                <div className="flex items-center gap-2">
                  <PlayerCount count={teamData.players.length} />
                  <span>•</span>
                  <span>Score: {teamData.score}</span>
                </div>
              </h3>
              {allQuotes.length > 0 && (
                <ul className="list-disc list-inside">
                  {Array.from({ length: allQuotes.length }, (_, roundIndex) => (
                    <li key={roundIndex}>
                      <span className="font-bold">Round {roundIndex + 1}:</span>{" "}
                      {teamData.players.some(
                        (player) =>
                          player.choices[roundIndex]?.status === "accepted"
                      )
                        ? (() => {
                            const acceptedPlayer = teamData.players.find(
                              (player) =>
                                player.choices[roundIndex]?.status ===
                                "accepted"
                            );
                            return `${acceptedPlayer?.choices[roundIndex]?.value} (${acceptedPlayer?.email})`;
                          })()
                        : "No accepted answer"}
                    </li>
                  ))}
                </ul>
              )}
            </div>
          ))}
        </div>
      </div>
      <div className="grid gap-4">
        <h2 className="text-4xl font-semibold">Players</h2>
        <table className="w-full border-collapse border rounded">
          <thead>
            <tr className="bg-neutral-800">
              <th className="border border-neutral-800 p-2">Email</th>
              {Array.from({ length: allQuotes.length }, (_, index) => (
                <th key={index} className="border border-neutral-800 p-2">
                  Round {index + 1}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {totalPlayers === 0 ? (
              <tr>
                <td className="p-4 border-neutral-800 border text-center">
                  No players yet.
                </td>
              </tr>
            ) : (
              Object.values(teams).flatMap((team) =>
                team.players.map((player) => (
                  <tr key={player.email} className="border-b">
                    <td className="border border-neutral-800 p-2">
                      {player.email}
                    </td>
                    {Array.from(
                      { length: allQuotes.length },
                      (_, roundIndex) => (
                        <td
                          key={roundIndex}
                          className="border border-neutral-800 p-2"
                        >
                          {player.choices[roundIndex]
                            ? `${player.choices[roundIndex].value} (${player.choices[roundIndex].status})`
                            : "No choice"}
                        </td>
                      )
                    )}
                  </tr>
                ))
              )
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
