import { useNavigate, useParams } from "react-router-dom";
import { useState, useEffect, useRef } from "react";
import { useParty } from "./PartyContext";
import { Team, Quote } from "../../common/types";
import { teamBgColors } from "./util/teamBgColors";
import { PlayerCount } from "./PlayerCount";
import { WebSocketResponse } from "../../common/events";

export function RoomAdmin() {
  const { room } = useParams();
  const navigate = useNavigate();

  useEffect(() => {
    if (!room) {
      navigate("/admin");
    }
  }, [room]);

  const [isStarting, setIsStarting] = useState(false);
  const [teams, setTeams] = useState<Record<string, Team>>({});
  const [teamAnswers, setTeamAnswers] = useState<Record<string, number>[]>([]);
  const [currentQuote, setCurrentQuote] = useState<Quote | null>(null);
  const [allQuotes, setAllQuotes] = useState<Quote[]>([]);
  const { ws } = useParty();
  const quotesContainerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!ws) return;

    ws.dispatch({ type: "getState" });

    ws.onmessage = (event) => {
      const data = JSON.parse(event.data) as WebSocketResponse;
      setTeams(() => data.state.teams);
      setAllQuotes(() => data.state.quotes);
      setCurrentQuote(data.state.quotes[data.state.currentQuoteIndex]);
      setTeamAnswers(() => data.state.teamAnswers);
      if (data.state.isGameStarted) {
        setIsStarting(false);
      }
    };
  }, [ws]);

  useEffect(() => {
    if (currentQuote && quotesContainerRef.current) {
      const currentQuoteElement =
        quotesContainerRef.current.querySelector(".border-ds-primary");
      if (currentQuoteElement) {
        currentQuoteElement.scrollTo({
          left: (currentQuoteElement as HTMLDivElement).offsetLeft,
          behavior: "smooth",
        });
      }
    }
  }, [currentQuote]);

  const handleStartGame = () => {
    setIsStarting(true);
    if (ws) {
      ws.dispatch({ type: "startGame" });
    }
  };

  const handleSendNextQuote = () => {
    if (ws) {
      ws.dispatch({ type: "nextQuote" });
    }
  };

  const handleResetGame = () => {
    if (ws) {
      ws.dispatch({ type: "resetGame" });
    }
  };

  const totalPlayers = Object.values(teams).reduce(
    (acc, team) => acc + team.players.length,
    0
  );
  return (
    <div className="md:p-8 p-4 grid gap-8">
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
      <div className="grid gap-4">
        <h2 className="text-4xl font-semibold">Quotes</h2>
        {allQuotes.length === 0 ? (
          <div className="border border-neutral-800 p-4 rounded grid gap-2 items-center justify-center">
            <span>No quotes yet.</span>
            <button
              onClick={handleStartGame}
              disabled={isStarting}
              className="bg-white disabled:bg-neutral-800 text-black font-bold py-2 px-4 rounded"
            >
              {isStarting ? "Starting..." : "Start Game"}
            </button>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <div ref={quotesContainerRef} className="flex space-x-4">
              {allQuotes.map((quote, index) => (
                <div
                  key={index}
                  className={`border grid gap-4 p-4 content-start rounded w-64 ${
                    currentQuote && currentQuote.quote === quote.quote
                      ? "border-2 border-ds-primary"
                      : "border-neutral-800"
                  }`}
                >
                  <p className="font-bold">&ldquo;{quote.quote}&rdquo;</p>
                  <ul className="list-disc list-outside px-4">
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
        <div className="grid gap-4 md:grid-cols-2">
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
                      {teamAnswers[roundIndex]?.[teamId] !== undefined
                        ? `${
                            allQuotes[roundIndex].options[
                              teamAnswers[roundIndex][teamId]
                            ]
                          } (${
                            teamData.players.find(
                              (player) =>
                                player.choices[roundIndex]?.status ===
                                "accepted"
                            )?.email
                          })`
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
        <div className="overflow-x-auto">
          <table className="w-full border-collapse border rounded">
            <thead>
              <tr className="bg-neutral-800">
                <th className="border border-neutral-800 p-2">Team</th>
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
                  <td
                    colSpan={allQuotes.length + 2}
                    className="p-4 border-neutral-800 border text-center"
                  >
                    No players yet.
                  </td>
                </tr>
              ) : (
                Object.entries(teams).flatMap(([teamId, team]) =>
                  team.players.map((player) => (
                    <tr key={player.email} className="border-b">
                      <td className="border border-neutral-800 p-2">
                        Team {teamId}
                      </td>
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
    </div>
  );
}
