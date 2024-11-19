import { useState, useEffect } from "react";

import { type Team, type GameState } from "../../common/types";
import { initialState } from "../../common/util";
import { type WebSocketResponse } from "../../common/events";
import { useParty } from "./PartyContext";
import { LeaderboardPregame } from "./LeaderboardPregame";
import { LeaderboardInGame } from "./LeaderboardInGame";
import { getVisibleScore } from "./util/getVisibleScore";
import { LeaderboardEndgame } from "./LeaderboardEndgame";

const transitionViewIfSupported = (updateCb: () => void) => {
  if (document.startViewTransition) {
    document.startViewTransition(updateCb);
  } else {
    updateCb();
  }
};

export function Leaderboard() {
  const [state, setState] = useState<GameState>(initialState);

  const teams = state.teams;
  const currentQuoteIndex = state.currentQuoteIndex;
  const currentQuote = state.quotes[currentQuoteIndex];
  const gameStarted = state.isGameStarted;
  const isRoundDecided = state.isRoundDecided;
  const timeRemaining = state.timeRemaining;
  const gameEndedAt = state.gameEndedAt;
  const { ws } = useParty();

  useEffect(() => {
    if (!ws) return;

    ws.dispatch({ type: "getState" });

    ws.onmessage = (event) => {
      const data = JSON.parse(event.data) as WebSocketResponse;
      if (data.type === "state") {
        transitionViewIfSupported(() => setState(data.state));
        return;
      }
      if (data.type === "reset") {
        window.location.reload();
      }
    };
  }, [ws, setState]);

  const activeTeams = Object.values(teams)
    .filter((team) => team.players.length > 1)
    .sort(
      (teamA: Team, teamB: Team) =>
        getVisibleScore(teamB, currentQuoteIndex, isRoundDecided) -
        getVisibleScore(teamA, currentQuoteIndex, isRoundDecided)
    );

  const winningScore = activeTeams[0]?.score;
  let winningTeams: Team[] = [];
  let otherTeams: Team[] = [];
  if (activeTeams.length > 0) {
    winningTeams = activeTeams.filter((team) => team.score === winningScore);
    otherTeams = activeTeams.filter((team) => team.score !== winningScore);
  }

  if (gameEndedAt) {
    return (
      <LeaderboardEndgame winningTeams={winningTeams} otherTeams={otherTeams} />
    );
  }

  if (!gameStarted) {
    return <LeaderboardPregame />;
  }

  if (gameStarted && currentQuote) {
    return (
      <LeaderboardInGame
        currentQuote={currentQuote}
        currentQuoteIndex={currentQuoteIndex}
        isRoundDecided={isRoundDecided}
        activeTeams={activeTeams}
        timeRemaining={timeRemaining}
      />
    );
  }
}
