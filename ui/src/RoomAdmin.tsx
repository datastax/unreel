import { useNavigate, useParams } from "react-router-dom";
import { useState, useEffect, useRef } from "react";
import { useParty } from "./PartyContext";
import { Team, Quote } from "../../common/types";

import { AdminQuotes } from "./AdminQuotes";
import { AdminGameManagement } from "./AdminGameManagement";
import { AdminTeams } from "./AdminTeams";
import { AdminPlayers } from "./AdminPlayers";
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
      <AdminGameManagement
        totalPlayers={totalPlayers}
        room={room!}
        handleSendNextQuote={handleSendNextQuote}
        handleResetGame={handleResetGame}
      />

      <AdminQuotes
        currentQuote={currentQuote}
        allQuotes={allQuotes}
        handleStartGame={handleStartGame}
        isStarting={isStarting}
      />

      <AdminTeams
        teams={teams}
        allQuotes={allQuotes}
        teamAnswers={teamAnswers}
      />

      <AdminPlayers
        allQuotes={allQuotes}
        totalPlayers={totalPlayers}
        teams={teams}
      />
    </div>
  );
}
