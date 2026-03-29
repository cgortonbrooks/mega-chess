// Shared game types for mega-chess

export enum PieceType {
  KING = "KING",
  QUEEN = "QUEEN",
  ROOK = "ROOK",
  BISHOP = "BISHOP",
  KNIGHT = "KNIGHT",
  PAWN = "PAWN",
  SUPER_QUEEN = "SUPER_QUEEN",
  ELEPHANT = "ELEPHANT",
  BONUS_1 = "BONUS_1",
  BONUS_2 = "BONUS_2",
  BONUS_3 = "BONUS_3",
}

export enum PlayerColor {
  WHITE = "WHITE",
  BLACK = "BLACK",
}

export enum ColorPreference {
  WHITE = "WHITE",
  BLACK = "BLACK",
  RANDOM = "RANDOM",
}

export interface Position {
  row: number;
  col: number;
}

export interface Piece {
  id: string;
  type: PieceType;
  color: PlayerColor;
  position: Position;
}

export interface BoardConfig {
  rows: number;
  cols: number;
  name: string;
}

export interface BudgetConfig {
  total: number;
  pieceCosts: Record<PieceType, number>;
}

export interface GameConfig {
  boardConfig: BoardConfig;
  budgetConfig: BudgetConfig;
  useClocks: boolean;
  clockSeconds: number;
}

export enum GamePhase {
  LOBBY = "LOBBY",
  SETUP = "SETUP",
  PLAYING = "PLAYING",
  FINISHED = "FINISHED",
}

export interface GameState {
  id: string;
  phase: GamePhase;
  config: GameConfig;
  board: (Piece | null)[][];
  players: PlayerColor[];
  currentTurn: PlayerColor;
  clocks: Record<PlayerColor, number>;
  winner?: PlayerColor | "draw";
}

export const GAME_EVENTS = {
  // Client -> Server
  JOIN_LOBBY: "join_lobby",
  CREATE_GAME: "create_game",
  JOIN_GAME: "join_game",
  SUBMIT_SETUP: "submit_setup",
  MAKE_MOVE: "make_move",
  RESIGN: "resign",
  SEND_CHAT: "send_chat",

  // Server -> Client
  LOBBY_UPDATE: "lobby_update",
  GAME_CREATED: "game_created",
  GAME_JOINED: "game_joined",
  SETUP_PHASE: "setup_phase",
  GAME_STATE_UPDATE: "game_state_update",
  OPPONENT_CONNECTED: "opponent_connected",
  OPPONENT_DISCONNECTED: "opponent_disconnected",
  GAME_OVER: "game_over",
  CHAT_MESSAGE: "chat_message",
  ERROR: "error",
} as const;

export type GameEventKey = keyof typeof GAME_EVENTS;
export type GameEventValue = (typeof GAME_EVENTS)[GameEventKey];

export const DEFAULT_BOARD_CONFIG: BoardConfig = {
  rows: 10,
  cols: 10,
  name: "Mega Board",
};

export const DEFAULT_PIECE_COSTS: Record<PieceType, number> = {
  [PieceType.KING]: 0,
  [PieceType.QUEEN]: 9,
  [PieceType.ROOK]: 5,
  [PieceType.BISHOP]: 3,
  [PieceType.KNIGHT]: 3,
  [PieceType.PAWN]: 1,
  [PieceType.SUPER_QUEEN]: 12,
  [PieceType.ELEPHANT]: 2,
  [PieceType.BONUS_1]: 4,
  [PieceType.BONUS_2]: 6,
  [PieceType.BONUS_3]: 8,
};

export const DEFAULT_BUDGET_CONFIG: BudgetConfig = {
  total: 40,
  pieceCosts: DEFAULT_PIECE_COSTS,
};

export const DEFAULT_GAME_CONFIG: GameConfig = {
  boardConfig: DEFAULT_BOARD_CONFIG,
  budgetConfig: DEFAULT_BUDGET_CONFIG,
  useClocks: true,
  clockSeconds: 600,
};
