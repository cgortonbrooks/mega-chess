import { useEffect } from "react";
import { io, Socket } from "socket.io-client";
import { GAME_EVENTS, GameState, PlayerColor } from "@mega-chess/shared";
import { useGameStore } from "../store/gameStore";

const SERVER_URL = import.meta.env.VITE_SERVER_URL ?? "";

let socketSingleton: Socket | null = null;
let listenersRegistered = false;

function getSocket(): Socket {
  if (!socketSingleton) {
    socketSingleton = io(SERVER_URL, {
      autoConnect: false,
    });
  }
  return socketSingleton;
}

function ensureListeners(socket: Socket): void {
  if (listenersRegistered) return;
  listenersRegistered = true;

  const store = useGameStore;

  socket.on("connect", () => {
    store.getState().setConnectionStatus("connected");
  });

  socket.on("disconnect", () => {
    store.getState().setConnectionStatus("disconnected");
  });

  socket.on("connect_error", () => {
    store.getState().setConnectionStatus("error");
  });

  socket.on(
    GAME_EVENTS.GAME_CREATED,
    (data: { roomId: string; color: PlayerColor; state: GameState }) => {
      const s = store.getState();
      s.setRoomId(data.roomId);
      s.setPlayerColor(data.color);
      s.setGameState(data.state);
    }
  );

  socket.on(
    GAME_EVENTS.GAME_JOINED,
    (data: { roomId: string; color: PlayerColor; state: GameState }) => {
      const s = store.getState();
      s.setRoomId(data.roomId);
      s.setPlayerColor(data.color);
      s.setGameState(data.state);
    }
  );

  socket.on(GAME_EVENTS.SETUP_PHASE, (data: { state: GameState }) => {
    store.getState().setGameState(data.state);
  });

  socket.on(GAME_EVENTS.GAME_STATE_UPDATE, (data: { state: GameState }) => {
    const s = store.getState();
    s.setGameState(data.state);
    s.setLegalMoves([]);
    s.setSelectedPiece(null);
  });

  socket.on(GAME_EVENTS.ERROR, (data: { message: string }) => {
    store.getState().setErrorMessage(data.message);
  });

  socket.on(GAME_EVENTS.CHAT_MESSAGE, (data: { color: PlayerColor; text: string }) => {
    store.getState().addChatMessage(data);
  });
}

export interface UseSocketReturn {
  socket: Socket;
  connectionStatus: "disconnected" | "connecting" | "connected" | "error";
  connect: () => void;
  disconnect: () => void;
}

export function useSocket(): UseSocketReturn {
  const socket = getSocket();
  const { connectionStatus } = useGameStore();

  useEffect(() => {
    ensureListeners(socket);
  }, [socket]);

  const connect = (): void => {
    if (socket.connected) {
      useGameStore.getState().setConnectionStatus("connected");
      return;
    }
    useGameStore.getState().setConnectionStatus("connecting");
    socket.connect();
  };

  const disconnect = (): void => {
    socket.disconnect();
  };

  return { socket, connectionStatus, connect, disconnect };
}
