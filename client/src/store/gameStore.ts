import { create } from "zustand";
import {
  GameState,
  GameConfig,
  PlayerColor,
  Piece,
  Position,
  DEFAULT_GAME_CONFIG,
} from "@mega-chess/shared";

export type ConnectionStatus = "disconnected" | "connecting" | "connected" | "error";

export interface ChatMessage {
  color: PlayerColor;
  text: string;
}

export interface GameStore {
  // State
  gameState: GameState | null;
  gameConfig: GameConfig;
  playerColor: PlayerColor | null;
  roomId: string | null;
  connectionStatus: ConnectionStatus;
  errorMessage: string | null;
  selectedPiece: Piece | null;
  legalMoves: Position[];
  chatMessages: ChatMessage[];

  // Actions
  setGameState: (state: GameState) => void;
  setGameConfig: (config: GameConfig) => void;
  setPlayerColor: (color: PlayerColor) => void;
  setRoomId: (id: string) => void;
  setConnectionStatus: (status: ConnectionStatus) => void;
  setErrorMessage: (message: string | null) => void;
  setSelectedPiece: (piece: Piece | null) => void;
  setLegalMoves: (moves: Position[]) => void;
  addChatMessage: (msg: ChatMessage) => void;
  resetGame: () => void;
}

const initialState: Pick<
  GameStore,
  | "gameState"
  | "gameConfig"
  | "playerColor"
  | "roomId"
  | "connectionStatus"
  | "errorMessage"
  | "selectedPiece"
  | "legalMoves"
  | "chatMessages"
> = {
  gameState: null,
  gameConfig: DEFAULT_GAME_CONFIG,
  playerColor: null,
  roomId: null,
  connectionStatus: "disconnected",
  errorMessage: null,
  selectedPiece: null,
  legalMoves: [],
  chatMessages: [],
};

export const useGameStore = create<GameStore>((set) => ({
  ...initialState,

  setGameState: (gameState) => set({ gameState }),

  setGameConfig: (gameConfig) => set({ gameConfig }),

  setPlayerColor: (playerColor) => set({ playerColor }),

  setRoomId: (roomId) => set({ roomId }),

  setConnectionStatus: (connectionStatus) => set({ connectionStatus }),

  setErrorMessage: (errorMessage) => set({ errorMessage }),

  setSelectedPiece: (selectedPiece) => set({ selectedPiece }),

  setLegalMoves: (legalMoves) => set({ legalMoves }),

  addChatMessage: (msg) => set((s) => ({ chatMessages: [...s.chatMessages, msg] })),

  resetGame: () => set({ ...initialState }),
}));
