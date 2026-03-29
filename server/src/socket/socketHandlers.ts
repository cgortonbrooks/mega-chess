import { Server, Socket } from "socket.io";
import {
  GAME_EVENTS,
  GameConfig,
  PlayerColor,
  ColorPreference,
  Piece,
} from "@mega-chess/shared";
import { GameRoom } from "../game/GameRoom";

// In-memory game room store
const rooms = new Map<string, GameRoom>();

function generateRoomId(): string {
  return Math.random().toString(36).slice(2, 8).toUpperCase();
}

export function registerSocketHandlers(io: Server, socket: Socket): void {
  console.log(`Client connected: ${socket.id}`);

  // JOIN_LOBBY: client requests list of open games
  socket.on(GAME_EVENTS.JOIN_LOBBY, () => {
    const openGames = Array.from(rooms.values())
      .filter((room) => !room.isFull())
      .map((room) => ({ id: room.getId(), state: room.getState() }));
    socket.emit(GAME_EVENTS.LOBBY_UPDATE, openGames);
  });

  // CREATE_GAME: client creates a new game room
  socket.on(
    GAME_EVENTS.CREATE_GAME,
    (payload: { config?: GameConfig; colorPreference?: ColorPreference }) => {
      const { config, colorPreference = ColorPreference.RANDOM } = payload ?? {};
      const roomId = generateRoomId();
      const room = new GameRoom(roomId, config, colorPreference);
      rooms.set(roomId, room);

      const color = room.addCreator();

      void socket.join(roomId);
      socket.data.roomId = roomId;
      socket.data.color = color;

      socket.emit(GAME_EVENTS.GAME_CREATED, {
        roomId,
        color,
        state: room.getState(),
      });
    }
  );

  // JOIN_GAME: client joins an existing game room
  socket.on(GAME_EVENTS.JOIN_GAME, (roomId: string) => {
    const room = rooms.get(roomId);
    if (!room) {
      socket.emit(GAME_EVENTS.ERROR, { message: "Game not found." });
      return;
    }
    if (room.isFull()) {
      socket.emit(GAME_EVENTS.ERROR, { message: "Game is full." });
      return;
    }

    const color = room.addJoiner();

    void socket.join(roomId);
    socket.data.roomId = roomId;
    socket.data.color = color;

    socket.emit(GAME_EVENTS.GAME_JOINED, {
      roomId,
      color,
      state: room.getState(),
    });

    // Notify both players that setup phase has started
    io.to(roomId).emit(GAME_EVENTS.SETUP_PHASE, { state: room.getState() });
    io.to(roomId).emit(GAME_EVENTS.OPPONENT_CONNECTED, { color });
  });

  // SUBMIT_SETUP: client submits their piece placement
  socket.on(GAME_EVENTS.SUBMIT_SETUP, (pieces: Piece[]) => {
    const roomId: string | undefined = socket.data.roomId;
    const color: PlayerColor | undefined = socket.data.color;
    if (!roomId || !color) return;
    const room = rooms.get(roomId);
    if (!room) return;

    const bothReady = room.submitSetup(color, pieces);

    if (bothReady) {
      io.to(roomId).emit(GAME_EVENTS.GAME_STATE_UPDATE, {
        state: room.getState(),
      });
    } else {
      // Just update the submitting player that we received their setup
      socket.emit(GAME_EVENTS.GAME_STATE_UPDATE, { state: room.getState() });
    }
  });

  // MAKE_MOVE: client makes a move
  socket.on(
    GAME_EVENTS.MAKE_MOVE,
    (move: {
      fromRow: number;
      fromCol: number;
      toRow: number;
      toCol: number;
    }) => {
      const roomId: string | undefined = socket.data.roomId;
      if (!roomId) return;
      const room = rooms.get(roomId);
      if (!room) return;

      const success = room.makeMove(
        move.fromRow,
        move.fromCol,
        move.toRow,
        move.toCol
      );

      if (!success) {
        socket.emit(GAME_EVENTS.ERROR, { message: "Invalid move." });
        return;
      }

      io.to(roomId).emit(GAME_EVENTS.GAME_STATE_UPDATE, {
        state: room.getState(),
      });
    }
  );

  // RESIGN: client resigns
  socket.on(GAME_EVENTS.RESIGN, () => {
    const roomId: string | undefined = socket.data.roomId;
    if (!roomId) return;
    const room = rooms.get(roomId);
    if (!room) return;

    const winner =
      socket.data.color === PlayerColor.WHITE
        ? PlayerColor.BLACK
        : PlayerColor.WHITE;

    io.to(roomId).emit(GAME_EVENTS.GAME_OVER, { winner, reason: "resign" });
    rooms.delete(roomId);
  });

  // Handle disconnection
  socket.on("disconnect", () => {
    console.log(`Client disconnected: ${socket.id}`);
    const roomId: string | undefined = socket.data.roomId;
    if (!roomId) return;
    io.to(roomId).emit(GAME_EVENTS.OPPONENT_DISCONNECTED, {
      color: socket.data.color,
    });
  });

  // SEND_CHAT: client sends a chat message
  socket.on(GAME_EVENTS.SEND_CHAT, (text: string) => {
    const roomId: string | undefined = socket.data.roomId;
    const color: PlayerColor | undefined = socket.data.color;
    if (!roomId || !color || typeof text !== "string") return;
    const sanitized = text.slice(0, 500).trim();
    if (!sanitized) return;
    io.to(roomId).emit(GAME_EVENTS.CHAT_MESSAGE, { color, text: sanitized });
  });
}
