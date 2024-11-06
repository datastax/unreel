import { type Team, type GameState } from "../../common/types";
import { initialState } from "../../common/util";
import { type WebSocketResponse } from "../../common/events";
import { teamBgColors } from "./util/teamBgColors";

import { useParams } from "react-router-dom";
import { QRCodeSVG } from "qrcode.react";
import { useParty } from "./PartyContext";
import { useState, useEffect } from "react";
import { DataStax } from "./DataStax";
import Confetti from "react-confetti";

function visibleScore(
  team: Team,
  currentQuoteIndex: number,
  isRoundDecided: boolean
) {
  if (currentQuoteIndex < 0) {
    return 0;
  }
  if (isRoundDecided) {
    return team.score;
  }
  return team.previousRoundScore;
}

export function Leaderboard() {
  const [state, setState] = useState<GameState>(initialState);

  const teams = state.teams;
  const currentQuoteIndex = state.currentQuoteIndex;
  const currentQuote = state.quotes[currentQuoteIndex];
  const gameStarted = state.isGameStarted;
  const isRoundDecided = state.isRoundDecided;
  const timeRemaining = state.timeRemaining;
  const gameEndedAt = state.gameEndedAt;
  const { room } = useParams();
  const { ws } = useParty();

  useEffect(() => {
    if (!ws) return;

    ws.dispatch({ type: "getState" });

    ws.onmessage = (event) => {
      const data = JSON.parse(event.data) as WebSocketResponse;
      setState(data.state);
    };
  }, [ws, setState]);

  const activeTeams = Object.values(teams)
    .filter((team) => team.players.length > 1)
    .sort(
      (teamA: Team, teamB: Team) =>
        visibleScore(teamB, currentQuoteIndex, isRoundDecided) -
        visibleScore(teamA, currentQuoteIndex, isRoundDecided)
    );

  const winningScore = activeTeams[0]?.score;
  let winningTeams: Team[] = [];
  let otherTeams: Team[] = [];
  if (activeTeams.length > 0) {
    winningTeams = activeTeams.filter((team) => team.score === winningScore);
    otherTeams = activeTeams.filter((team) => team.score !== winningScore);
  }

  return (
    <>
      <main className="p-4 grid grid-rows-[auto_1fr_1fr] gap-4 h-svh w-svw">
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
                  <p className="flex-grow text-left">Team {team.id}</p>
                  <p>{team.score} pts</p>
                </li>
              ))}

              {otherTeams.map((team) => (
                <li
                  key={team.id}
                  className={`rounded text-center text-xl font-bold bg-${
                    teamBgColors[team.id]
                  } mb-2 h-18 flex items-center p-4`}
                >
                  <p className="flex-grow text-left">Team {team.id}</p>
                  <p>{team.score} pts</p>
                </li>
              ))}
            </ol>
          </>
        )}

        {!gameEndedAt && (
          <>
            {!gameStarted && (
              <div className="self-center">
                <div>
                  <p className="text-center text-2xl mb-8">
                    Join the game at{" "}
                    <span className="text-3xl text-ds-quaternary font-bold">
                      {`${window.location.protocol}//${window.location.host}/${room}`}
                    </span>
                  </p>
                </div>
                <div className="flex justify-center items-center">
                  <QRCodeSVG
                    value={`${window.location.protocol}//${window.location.host}/${room}`}
                    size={256}
                    className="bg-white p-2"
                  />
                </div>
              </div>
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

            {activeTeams.length > 0 && (
              <div className="flex flex-col justify-end">
                <h2 className="text-center">Leaderboard</h2>

                <ol className="w-5/6 mx-auto">
                  {activeTeams.map((team) => (
                    <li
                      key={team.id}
                      className={`rounded text-center text-3xl font-bold bg-${
                        teamBgColors[team.id]
                      } mb-2 h-24 flex items-center p-4`}
                    >
                      <p className="flex-grow text-left">Team {team.id}</p>
                      <p>
                        {visibleScore(team, currentQuoteIndex, isRoundDecided)}{" "}
                        pts
                      </p>
                    </li>
                  ))}
                </ol>
              </div>
            )}
          </>
        )}
      </main>
      <pre>{JSON.stringify(state, null, 2)}</pre>
    </>
  );
}
