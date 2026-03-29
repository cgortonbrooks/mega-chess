import React from "react";
import { Link } from "react-router-dom";
import { GamePhase } from "@mega-chess/shared";
import { useGameStore } from "./store/gameStore";
import { Lobby } from "./components/lobby/Lobby";
import { GameSetup } from "./components/setup/GameSetup";
import { Board } from "./components/board/Board";

function App(): React.JSX.Element {
  const phase = useGameStore((state) => state.gameState?.phase);
  const winner = useGameStore((state) => state.gameState?.winner);
  const playerColor = useGameStore((state) => state.playerColor);

  let resultText = "";
  if (winner === playerColor) {
    resultText = "You win — King captured!";
  } else if (winner) {
    resultText = "You lose — King captured";
  }

  return (
    <div className="min-h-screen bg-background text-foreground">
      <header className="border-b border-border px-6 py-4 flex items-center gap-6">
        <Link to="/" className="text-2xl font-bold tracking-tight hover:opacity-80">
          Mega Chess
        </Link>
        {phase && (
          <span className="text-sm text-muted-foreground uppercase tracking-widest">
            {phase}
          </span>
        )}
        <Link
          to="/rules"
          className="ml-auto text-sm text-muted-foreground hover:text-foreground"
        >
          Rules
        </Link>
      </header>

      <main className="container mx-auto px-4 py-8">
        {(!phase || phase === GamePhase.LOBBY) && <Lobby />}
        {phase === GamePhase.SETUP && <GameSetup />}
        {(phase === GamePhase.PLAYING || phase === GamePhase.FINISHED) && (
          <div className="flex flex-col items-center gap-4">
            {phase === GamePhase.FINISHED && (
              <div className="flex flex-col items-center gap-3 py-4">
                <h2 className="text-3xl font-semibold">{resultText}</h2>
                <button
                  className="px-4 py-2 rounded bg-primary text-primary-foreground hover:opacity-90"
                  onClick={() => useGameStore.getState().resetGame()}
                >
                  Return to Lobby
                </button>
              </div>
            )}
            <Board />
          </div>
        )}
      </main>
    </div>
  );
}

export default App;
