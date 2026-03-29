import { Piece, PieceType, PlayerColor, Position, GameState } from "./types/game";

// ─── Helpers ──────────────────────────────────────────────────────────────────

export function isInBounds(
  position: Position,
  rows: number,
  cols: number
): boolean {
  return (
    position.row >= 0 &&
    position.row < rows &&
    position.col >= 0 &&
    position.col < cols
  );
}

function occupant(board: (Piece | null)[][], row: number, col: number): Piece | null {
  return board[row]?.[col] ?? null;
}

// ─── Pseudo-legal move generation (ignores check) ─────────────────────────────

function addIfValid(
  moves: Position[],
  board: (Piece | null)[][],
  rows: number,
  cols: number,
  row: number,
  col: number,
  color: PlayerColor
): boolean {
  const pos = { row, col };
  if (!isInBounds(pos, rows, cols)) return false;
  const occ = occupant(board, row, col);
  if (!occ) {
    moves.push(pos);
    return true; // square empty, can continue sliding
  }
  if (occ.color !== color) {
    moves.push(pos); // capture
  }
  return false; // blocked (by own piece or after capture)
}

function addSliding(
  moves: Position[],
  board: (Piece | null)[][],
  rows: number,
  cols: number,
  piece: Piece,
  directions: { dr: number; dc: number }[]
): void {
  for (const { dr, dc } of directions) {
    let r = piece.position.row + dr;
    let c = piece.position.col + dc;
    while (isInBounds({ row: r, col: c }, rows, cols)) {
      const occ = occupant(board, r, c);
      if (!occ) {
        moves.push({ row: r, col: c });
      } else {
        if (occ.color !== piece.color) moves.push({ row: r, col: c });
        break;
      }
      r += dr;
      c += dc;
    }
  }
}

/** Slides in given directions, jumping over any pieces, but can only land on empty squares. */
function addSlidingJump(
  moves: Position[],
  board: (Piece | null)[][],
  rows: number,
  cols: number,
  piece: Piece,
  directions: { dr: number; dc: number }[]
): void {
  for (const { dr, dc } of directions) {
    let r = piece.position.row + dr;
    let c = piece.position.col + dc;
    let jumped = false;
    while (isInBounds({ row: r, col: c }, rows, cols)) {
      const occ = occupant(board, r, c);
      if (!occ) {
        moves.push({ row: r, col: c });
      } else {
        if (!jumped && occ.color !== piece.color) {
          // Can capture the first piece encountered (before jumping)
          moves.push({ row: r, col: c });
        }
        jumped = true;
        // Continue past this piece (jumping over it)
      }
      r += dr;
      c += dc;
    }
  }
}

function getPseudoLegalMoves(piece: Piece, board: (Piece | null)[][], rows: number, cols: number): Position[] {
  const moves: Position[] = [];
  const { row, col } = piece.position;

  switch (piece.type) {
    case PieceType.PAWN: {
      const dir = piece.color === PlayerColor.WHITE ? -1 : 1;
      const fRow = row + dir;
      if (isInBounds({ row: fRow, col }, rows, cols) && !occupant(board, fRow, col)) {
        moves.push({ row: fRow, col });
      }
      for (const dc of [-1, 1]) {
        const cCol = col + dc;
        if (isInBounds({ row: fRow, col: cCol }, rows, cols)) {
          const occ = occupant(board, fRow, cCol);
          if (occ && occ.color !== piece.color) {
            moves.push({ row: fRow, col: cCol });
          }
        }
      }
      break;
    }

    case PieceType.KNIGHT: {
      const offsets = [
        [-2, -1], [-2, 1], [-1, -2], [-1, 2],
        [1, -2], [1, 2], [2, -1], [2, 1],
      ];
      for (const [dr, dc] of offsets) {
        addIfValid(moves, board, rows, cols, row + dr, col + dc, piece.color);
      }
      break;
    }

    case PieceType.BISHOP: {
      addSliding(moves, board, rows, cols, piece, [
        { dr: -1, dc: -1 }, { dr: -1, dc: 1 },
        { dr: 1, dc: -1 }, { dr: 1, dc: 1 },
      ]);
      break;
    }

    case PieceType.ROOK: {
      addSliding(moves, board, rows, cols, piece, [
        { dr: -1, dc: 0 }, { dr: 1, dc: 0 },
        { dr: 0, dc: -1 }, { dr: 0, dc: 1 },
      ]);
      break;
    }

    case PieceType.QUEEN: {
      addSliding(moves, board, rows, cols, piece, [
        { dr: -1, dc: 0 }, { dr: 1, dc: 0 },
        { dr: 0, dc: -1 }, { dr: 0, dc: 1 },
        { dr: -1, dc: -1 }, { dr: -1, dc: 1 },
        { dr: 1, dc: -1 }, { dr: 1, dc: 1 },
      ]);
      break;
    }

    case PieceType.SUPER_QUEEN: {
      addSlidingJump(moves, board, rows, cols, piece, [
        { dr: -1, dc: 0 }, { dr: 1, dc: 0 },
        { dr: 0, dc: -1 }, { dr: 0, dc: 1 },
        { dr: -1, dc: -1 }, { dr: -1, dc: 1 },
        { dr: 1, dc: -1 }, { dr: 1, dc: 1 },
      ]);
      break;
    }

    case PieceType.KING: {
      const offsets = [
        [-1, -1], [-1, 0], [-1, 1],
        [0, -1],           [0, 1],
        [1, -1],  [1, 0],  [1, 1],
      ];
      for (const [dr, dc] of offsets) {
        addIfValid(moves, board, rows, cols, row + dr, col + dc, piece.color);
      }
      break;
    }

    case PieceType.ELEPHANT: {
      const dirs = [
        { dr: -1, dc: -1 }, { dr: -1, dc: 1 },
        { dr: 1, dc: -1 }, { dr: 1, dc: 1 },
      ];
      for (const { dr, dc } of dirs) {
        // 1 square diagonal
        const r1 = row + dr;
        const c1 = col + dc;
        const canContinue = addIfValid(moves, board, rows, cols, r1, c1, piece.color);
        // 2 squares diagonal (only if first square was empty)
        if (canContinue) {
          addIfValid(moves, board, rows, cols, r1 + dr, c1 + dc, piece.color);
        }
      }
      break;
    }

    default: {
      const offsets = [
        [-1, 0], [1, 0], [0, -1], [0, 1],
      ];
      for (const [dr, dc] of offsets) {
        addIfValid(moves, board, rows, cols, row + dr, col + dc, piece.color);
      }
      break;
    }
  }

  return moves;
}

// ─── Legal move generation (no-check variant: all pseudo-legal moves are legal)

export function getLegalMoves(
  piece: Piece,
  gameState: GameState
): Position[] {
  const { rows, cols } = gameState.config.boardConfig;
  return getPseudoLegalMoves(piece, gameState.board, rows, cols);
}

export function isMoveLegal(
  piece: Piece,
  toRow: number,
  toCol: number,
  gameState: GameState
): boolean {
  const legal = getLegalMoves(piece, gameState);
  return legal.some((m) => m.row === toRow && m.col === toCol);
}



export function calculateBudgetCost(
  pieces: Piece[],
  pieceCosts: Record<PieceType, number>
): number {
  return pieces.reduce((total, piece) => total + (pieceCosts[piece.type] ?? 0), 0);
}
