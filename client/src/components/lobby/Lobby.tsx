import React, { useEffect, useState } from "react";
import { GAME_EVENTS } from "@mega-chess/shared";
import { useSocket } from "../../hooks/useSocket";
import { useGameStore } from "../../store/gameStore";
import { NewGameConfig } from "./NewGameConfig";

export function Lobby(): React.JSX.Element {
  const { socket, connectionStatus, connect } = useSocket();
  const { errorMessage, setErrorMessage, roomId } = useGameStore();
  const [joinId, setJoinId] = useState("");
  const [showConfig, setShowConfig] = useState(false);

  useEffect(() => {
    if (connectionStatus === "disconnected" || connectionStatus === "error") {
      connect();
    }
  }, [connectionStatus, connect]);

  useEffect(() => {
    if (connectionStatus !== "connected") return;
    socket.emit(GAME_EVENTS.JOIN_LOBBY);
  }, [socket, connectionStatus]);

  function handleJoinGame(): void {
    if (!joinId.trim()) return;
    setErrorMessage(null);
    socket.emit(GAME_EVENTS.JOIN_GAME, joinId.trim().toUpperCase());
  }

  const isConnected = connectionStatus === "connected";

  if (roomId) {
    return (
      <div className="flex flex-col items-center gap-6 py-16">
        <h2 className="text-2xl font-semibold">Waiting for opponent...</h2>
        <p className="text-sm text-muted-foreground">Share this room code:</p>
        <div className="text-4xl font-mono font-bold tracking-widest border border-border rounded-lg px-8 py-4 bg-muted">
          {roomId}
        </div>
        <p className="text-xs text-muted-foreground">
          The game will start automatically when your opponent joins.
        </p>
      </div>
    );
  }

  if (showConfig) {
    return <NewGameConfig onBack={() => setShowConfig(false)} />;
  }

  return (
    <div className="flex flex-col items-center gap-12 max-w-lg mx-auto py-8">
      {connectionStatus === "error" && (
        <div className="w-full px-4 py-3 rounded border border-destructive text-destructive text-sm">
          Could not connect to server. Is it running?
        </div>
      )}

      {errorMessage && (
        <div className="w-full px-4 py-3 rounded border border-destructive text-destructive text-sm">
          {errorMessage}
        </div>
      )}

      {/* Create game */}
      <section className="flex flex-col items-center gap-3">
        <button
          onClick={() => setShowConfig(true)}
          disabled={!isConnected}
          className="px-8 py-3 rounded-lg bg-primary text-primary-foreground hover:opacity-90 font-semibold text-lg disabled:opacity-40"
        >
          Create Game
        </button>
        <p className="text-sm text-muted-foreground">
          Configure a new game and invite an opponent.
        </p>
      </section>

      <div className="w-full flex items-center gap-4">
        <div className="flex-1 h-px bg-border" />
        <span className="text-xs text-muted-foreground uppercase tracking-widest">or</span>
        <div className="flex-1 h-px bg-border" />
      </div>

      {/* Join game */}
      <section className="flex flex-col items-center gap-3 w-full">
        <h3 className="text-lg font-semibold">Join Game</h3>
        <p className="text-sm text-muted-foreground mb-1">
          Enter a room code to join an existing game.
        </p>
        <div className="flex gap-2 w-full max-w-xs">
          <input
            type="text"
            value={joinId}
            onChange={(e) => setJoinId(e.target.value)}
            placeholder="Room code"
            className="flex-1 px-3 py-2 rounded border border-input bg-background text-sm focus:outline-none focus:ring-2 focus:ring-ring uppercase"
            maxLength={6}
          />
          <button
            onClick={handleJoinGame}
            disabled={!joinId.trim() || !isConnected}
            className="px-4 py-2 rounded bg-secondary text-secondary-foreground hover:opacity-90 font-medium text-sm disabled:opacity-40"
          >
            Join
          </button>
        </div>
      </section>
    </div>
  );
}
