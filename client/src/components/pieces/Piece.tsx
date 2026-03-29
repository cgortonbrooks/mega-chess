import React from "react";
import { useDraggable } from "@dnd-kit/core";
import { CSS } from "@dnd-kit/utilities";
import { Piece as PieceData, PieceType, PlayerColor } from "@mega-chess/shared";
import { clsx } from "clsx";

interface PieceProps {
  piece: PieceData;
  squareId: string;
  disabled?: boolean;
}

/** Map standard piece types to lichess alpha SVG filenames (w/b prefix + letter). */
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

/** Fallback Unicode symbols for bonus piece types without SVGs. */
const BONUS_SYMBOLS: Partial<Record<PieceType, string>> = {
  [PieceType.BONUS_1]: "★",
  [PieceType.BONUS_2]: "▲",
  [PieceType.BONUS_3]: "◆",
};

export function Piece({ piece, squareId, disabled }: PieceProps): React.JSX.Element {
  const { attributes, listeners, setNodeRef, transform, isDragging } =
    useDraggable({ id: squareId, data: { piece }, disabled });

  const style: React.CSSProperties = {
    transform: CSS.Translate.toString(transform),
    zIndex: isDragging ? 50 : undefined,
    cursor: disabled ? "default" : isDragging ? "grabbing" : "grab",
  };

  const imageEntry = PIECE_IMAGES[piece.type];
  const imageSrc = imageEntry
    ? piece.color === PlayerColor.WHITE ? imageEntry.white : imageEntry.black
    : undefined;

  return (
    <span
      ref={setNodeRef}
      style={style}
      {...listeners}
      {...attributes}
      className={clsx(
        "select-none leading-none flex items-center justify-center",
        isDragging && "opacity-80"
      )}
      aria-label={`${piece.color} ${piece.type}`}
    >
      {imageSrc ? (
        <span className="relative w-[85%] h-[85%]">
          <img
            src={imageSrc}
            alt={`${piece.color} ${piece.type}`}
            className="w-full h-full pointer-events-none"
            draggable={false}
          />
          {piece.type === PieceType.SUPER_QUEEN && (
            <span className="absolute -top-0.5 -right-0.5 w-3.5 h-3.5 rounded-full bg-amber-400 border border-amber-600 text-[9px] font-bold leading-none flex items-center justify-center text-amber-900 pointer-events-none">
              +
            </span>
          )}

        </span>
      ) : (
        <span
          className={clsx(
            "text-2xl",
            piece.color === PlayerColor.WHITE
              ? "text-white drop-shadow-[0_1px_1px_rgba(0,0,0,0.8)]"
              : "text-gray-900"
          )}
        >
          {BONUS_SYMBOLS[piece.type] ?? "?"}
        </span>
      )}
    </span>
  );
}
