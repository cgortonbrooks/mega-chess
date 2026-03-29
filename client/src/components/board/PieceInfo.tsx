import React from "react";
import { PieceType, PlayerColor } from "@mega-chess/shared";
import { useGameStore } from "../../store/gameStore";

const PIECE_NAMES: Record<PieceType, string> = {
  [PieceType.KING]: "King",
  [PieceType.QUEEN]: "Queen",
  [PieceType.ROOK]: "Rook",
  [PieceType.BISHOP]: "Bishop",
  [PieceType.KNIGHT]: "Knight",
  [PieceType.PAWN]: "Pawn",
  [PieceType.SUPER_QUEEN]: "Super Queen",
  [PieceType.ELEPHANT]: "Elephant",
  [PieceType.BONUS_1]: "Bonus ★",
  [PieceType.BONUS_2]: "Bonus ▲",
  [PieceType.BONUS_3]: "Bonus ◆",
};

const PIECE_IMAGES: Partial<Record<PieceType, { white: string; black: string }>> = {
  [PieceType.KING]:   { white: "/pieces/wK.svg", black: "/pieces/bK.svg" },
  [PieceType.QUEEN]:  { white: "/pieces/wQ.svg", black: "/pieces/bQ.svg" },
  [PieceType.ROOK]:   { white: "/pieces/wR.svg", black: "/pieces/bR.svg" },
  [PieceType.BISHOP]: { white: "/pieces/wB.svg", black: "/pieces/bB.svg" },
  [PieceType.KNIGHT]: { white: "/pieces/wN.svg", black: "/pieces/bN.svg" },
  [PieceType.PAWN]:   { white: "/pieces/wP.svg", black: "/pieces/bP.svg" },
  [PieceType.SUPER_QUEEN]: { white: "/pieces/wQ.svg", black: "/pieces/bQ.svg" },
  [PieceType.ELEPHANT]: { white: "/pieces/wE.svg", black: "/pieces/bE.svg" },
};

const PIECE_RULES: Record<PieceType, string> = {
  [PieceType.KING]:
    "Moves one square in any direction (horizontally, vertically, or diagonally). Must be kept safe — if checkmated, you lose.",
  [PieceType.QUEEN]:
    "Moves any number of squares in a straight line — horizontally, vertically, or diagonally. Cannot jump over other pieces.",
  [PieceType.ROOK]:
    "Moves any number of squares horizontally or vertically. Cannot jump over other pieces.",
  [PieceType.BISHOP]:
    "Moves any number of squares diagonally. Cannot jump over other pieces. Stays on the same color square.",
  [PieceType.KNIGHT]:
    "Moves in an L-shape: two squares in one direction and one square perpendicular. The only piece that can jump over others.",
  [PieceType.PAWN]:
    "Moves one square forward (toward the opponent's side). Captures diagonally one square forward. Promotes to a Queen upon reaching the last rank.",
  [PieceType.SUPER_QUEEN]:
    "Slides any number of squares in any direction and can jump over pieces in its path. Cannot capture after jumping — only captures the first piece it reaches in a line.",
  [PieceType.ELEPHANT]:
    "Moves one or two squares diagonally. Cannot jump over pieces.",
  [PieceType.BONUS_1]:
    "Moves one square horizontally or vertically (not diagonally).",
  [PieceType.BONUS_2]:
    "Moves one square horizontally or vertically (not diagonally).",
  [PieceType.BONUS_3]:
    "Moves one square horizontally or vertically (not diagonally).",
};

export function PieceInfo(): React.JSX.Element {
  const { selectedPiece, gameState } = useGameStore();

  if (!selectedPiece || !gameState) {
    return (
      <div className="rounded-lg border border-border bg-card p-4 text-card-foreground">
        <p className="text-sm text-muted-foreground italic">
          Click any piece to see its info.
        </p>
      </div>
    );
  }

  const { type, color } = selectedPiece;
  const name = PIECE_NAMES[type] ?? type;
  const cost = gameState.config.budgetConfig.pieceCosts[type] ?? 0;
  const rules = PIECE_RULES[type] ?? "Unknown movement.";
  const imgEntry = PIECE_IMAGES[type];
  const imgSrc = imgEntry
    ? color === PlayerColor.WHITE ? imgEntry.white : imgEntry.black
    : undefined;

  return (
    <div className="rounded-lg border border-border bg-card p-4 text-card-foreground flex flex-col gap-3">
      <div className="flex items-center gap-3">
        {imgSrc ? (
          <img src={imgSrc} alt={name} className="w-10 h-10 rounded bg-gray-500 p-0.5" draggable={false} />
        ) : (
          <span className="text-3xl">{name.slice(-1)}</span>
        )}
        <div>
          <div className="font-semibold text-sm">{name}</div>
          <div className="text-xs text-muted-foreground">
            {color === PlayerColor.WHITE ? "White" : "Black"} · Cost: {cost}
          </div>
        </div>
      </div>
      <p className="text-xs leading-relaxed text-muted-foreground">{rules}</p>
    </div>
  );
}
