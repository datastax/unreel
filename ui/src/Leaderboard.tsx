import { type Team, type GameState, type Quote } from "../../common/types";
import { initialState, maxPlayersPerTeam } from "../../common/util";
import { type WebSocketResponse } from "../../common/events";
import { teamBgColors } from "./util/teamBgColors";

import { useParams } from "react-router-dom";
import { useParty } from "./PartyContext";
import { useState, useEffect } from "react";
import { DataStax } from "./DataStax";
import Confetti from "react-confetti";

export function Leaderboard() {
  const [state, setState] = useState<GameState>(initialState);
  const [teams, setTeams] = useState<Record<number, Team>>([]);
  const [currentQuote, setCurrentQuote] = useState<Quote | null>(null);
  const [gameStarted, setGameStarted] = useState(false);
  const [isRoundDecided, setIsRoundDecided] = useState(false);
  const [timeRemaining, setTimeRemaining] = useState(0);
  const [gameEndedAt, setGameEndedAt] = useState<number | null>(null);
  const { room } = useParams();
  const { ws } = useParty();

  useEffect(() => {
    if (!ws) return;

    ws.dispatch({ type: "getState" });

    ws.onmessage = (event) => {
      const data = JSON.parse(event.data) as WebSocketResponse;
      setState(data.state);
      setTeams(data.state.teams);
      setCurrentQuote(data.state.quotes[data.state.currentQuoteIndex]);
      setGameStarted(data.state.isGameStarted);
      setIsRoundDecided(data.state.isRoundDecided);
      setTimeRemaining(data.state.timeRemaining);
      setGameEndedAt(data.state.gameEndedAt);
    };
  }, [ws, setState]);

  const activeTeams = Object.values(teams)
    .filter((team) => team.players.length > 1)
    .sort((teamA: Team, teamB: Team) => teamB.score - teamA.score);

  const winningScore = activeTeams[0]?.score;
  let winningTeams: Team[] = [];
  if (activeTeams.length > 0) {
    winningTeams = activeTeams.filter((team) => team.score === winningScore);
  }

  return (
    <>
      <main className="p-4 grid grid-rows-[auto_auto_1fr] gap-4 h-svh w-svw">
        <div>
          <DataStax />
        </div>

        {gameEndedAt && winningTeams.length > 0 && (
          <>
            <Confetti colors={["#7f3aa4", "#ac115f", "#de2337", "#ffca0b"]} />
            <h2 className="text-3xl font-bold pb-4 pt-4 text-center">
              {winningTeams.length > 1 ? "The winners are:" : "The winner is:"}
            </h2>

            <ol>
              {winningTeams.map((team) => (
                <li
                  key={team.id}
                  className={`rounded text-center text-3xl font-bold bg-${
                    teamBgColors[team.id]
                  } mb-2 h-24 flex items-center p-4`}
                >
                  <p className="w-full text-center">Team {team.id}</p>
                </li>
              ))}
            </ol>
          </>
        )}

        {!gameEndedAt && (
          <>
            {!gameStarted && (
              <p className="text-center">
                Join the game at{" "}
                <span className="text-xl text-ds-quaternary font-bold">
                  {`${window.location.protocol}//${window.location.host}/${room}`}
                </span>
              </p>
            )}

            {gameStarted && currentQuote && (
              <>
                <p className="pt-16 pb-4 text-center text-4xl font-bold">
                  &ldquo;{currentQuote.quote}&rdquo;
                </p>
                {isRoundDecided && (
                  <div>
                    <p className="text-center">The answer:</p>
                    <p className="pb-4 text-center text-4xl font-bold">
                      {currentQuote.options[currentQuote?.correctOptionIndex]}
                    </p>
                  </div>
                )}
                {!isRoundDecided && (
                  <p className="text-center text-6xl font-bold">
                    {timeRemaining / 1000}
                  </p>
                )}
              </>
            )}

            <div className="flex flex-col justify-end">
              {activeTeams.length > 0 && <h2 className="text-center">Leaderboard</h2>}
              <ol className="w-5/6 mx-auto">
                {activeTeams.map((team) => (
                  <li
                    key={team.id}
                    className={`rounded text-center text-3xl font-bold bg-${
                      teamBgColors[team.id]
                    } mb-2 h-24 flex items-center p-4`}
                  >
                    <p className="flex-grow text-left">Team {team.id}</p>
                    <p>{team.score} pts</p>
                  </li>
                ))}
              </ol>
            </div>
          </>
        )}
      </main>
      <pre>{JSON.stringify(state, null, 2)}</pre>
    </>
  );
}
