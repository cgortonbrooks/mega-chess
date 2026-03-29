import {
  GameState,
  GameConfig,
  GamePhase,
  PlayerColor,
  ColorPreference,
  Piece,
  PieceType,
  DEFAULT_GAME_CONFIG,
} from "@mega-chess/shared";
import { isMoveLegal } from "./gameLogic";

export class GameRoom {
  private state: GameState;
  private colorPreference: ColorPreference;
  private creatorColor: PlayerColor | null = null;
  private setupSubmitted: Set<PlayerColor> = new Set();

  constructor(
    id: string,
    config: GameConfig = DEFAULT_GAME_CONFIG,
    colorPreference: ColorPreference = ColorPreference.RANDOM
  ) {
    const { boardConfig } = config;
    const board: (Piece | null)[][] = Array.from(
      { length: boardConfig.rows },
      () => Array(boardConfig.cols).fill(null)
    );

    this.state = {
      id,
      phase: GamePhase.LOBBY,
      config,
      board,
      players: [],
      currentTurn: PlayerColor.WHITE,
      clocks: {
        [PlayerColor.WHITE]: config.clockSeconds,
        [PlayerColor.BLACK]: config.clockSeconds,
      },
    };

    this.colorPreference = colorPreference;
  }

  getId(): string {
    return this.state.id;
  }

  getState(): GameState {
    return { ...this.state, board: this.state.board.map((r) => [...r]) };
  }

  /** Called when the game creator joins. Returns their assigned color. */
  addCreator(): PlayerColor {
    let color: PlayerColor;
    if (this.colorPreference === ColorPreference.WHITE) {
      color = PlayerColor.WHITE;
    } else if (this.colorPreference === ColorPreference.BLACK) {
      color = PlayerColor.BLACK;
    } else {
      color = Math.random() < 0.5 ? PlayerColor.WHITE : PlayerColor.BLACK;
    }
    this.creatorColor = color;
    this.state.players = [color];
    return color;
  }

  /** Called when the second player joins. Returns their assigned color. */
  addJoiner(): PlayerColor {
    const color =
      this.creatorColor === PlayerColor.WHITE
        ? PlayerColor.BLACK
        : PlayerColor.WHITE;
    this.state.players = [...this.state.players, color];
    this.state.phase = GamePhase.SETUP;
    return color;
  }

  /**
   * Submit a player's piece setup.
   * Returns true when both players have submitted and the game advances to PLAYING.
   */
  submitSetup(color: PlayerColor, pieces: Piece[]): boolean {
    // Clear any previous pieces for this color
    this.state.board = this.state.board.map((row) =>
      row.map((square) => (square?.color === color ? null : square))
    );

    // Place the new pieces
    for (const piece of pieces) {
      const { row, col } = piece.position;
      const { rows, cols } = this.state.config.boardConfig;
      if (row >= 0 && row < rows && col >= 0 && col < cols) {
        this.state.board[row][col] = piece;
      }
    }

    this.setupSubmitted.add(color);

    if (this.setupSubmitted.size >= 2) {
      this.state.phase = GamePhase.PLAYING;
      return true;
    }
    return false;
  }

  makeMove(
    fromRow: number,
    fromCol: number,
    toRow: number,
    toCol: number
  ): boolean {
    if (this.state.phase !== GamePhase.PLAYING) return false;

    const piece = this.state.board[fromRow]?.[fromCol];
    if (!piece) return false;
    if (piece.color !== this.state.currentTurn) return false;

    // Validate the move using chess rules
    if (!isMoveLegal(piece, toRow, toCol, this.state)) return false;

    // Check if this move captures a king
    const capturedPiece = this.state.board[toRow]?.[toCol];
    const kingCaptured = capturedPiece?.type === PieceType.KING;

    // Apply the move
    const newBoard = this.state.board.map((r) => [...r]);
    newBoard[toRow][toCol] = { ...piece, position: { row: toRow, col: toCol } };
    newBoard[fromRow][fromCol] = null;

    // Pawn promotion: auto-promote to queen when reaching the last rank
    const promotedPiece = newBoard[toRow][toCol];
    if (promotedPiece && promotedPiece.type === PieceType.PAWN) {
      const { rows } = this.state.config.boardConfig;
      const isPromotion =
        (promotedPiece.color === PlayerColor.WHITE && toRow === 0) ||
        (promotedPiece.color === PlayerColor.BLACK && toRow === rows - 1);
      if (isPromotion) {
        newBoard[toRow][toCol] = { ...promotedPiece, type: PieceType.QUEEN };
      }
    }

    this.state.board = newBoard;

    // King captured — game ends
    if (kingCaptured) {
      this.state.phase = GamePhase.FINISHED;
      this.state.winner = this.state.currentTurn; // the player who just moved wins
      return true;
    }

    // Switch turn
    this.state.currentTurn =
      this.state.currentTurn === PlayerColor.WHITE
        ? PlayerColor.BLACK
        : PlayerColor.WHITE;

    return true;
  }

  isFull(): boolean {
    return this.state.players.length >= 2;
  }
}
