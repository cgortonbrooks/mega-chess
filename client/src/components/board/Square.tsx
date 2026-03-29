import React from "react";
import { useDroppable } from "@dnd-kit/core";
import { Piece as PieceType, GAME_EVENTS, getLegalMoves } from "@mega-chess/shared";
import { Piece } from "../pieces/Piece";
import { useGameStore } from "../../store/gameStore";
import { useSocket } from "../../hooks/useSocket";
import { clsx } from "clsx";

interface SquareProps {
  id: string;
  piece: PieceType | null;
  isLight: boolean;
  canDrag?: boolean;
}

export function Square({ id, piece, isLight, canDrag }: SquareProps): React.JSX.Element {
  const { isOver, setNodeRef } = useDroppable({ id });
  const { selectedPiece, setSelectedPiece, legalMoves, setLegalMoves, playerColor, gameState } = useGameStore();
  const { socket } = useSocket();

  const [row, col] = id.split("-").map(Number);

  const isSelected =
    selectedPiece &&
    piece &&
    selectedPiece.position.row === piece.position.row &&
    selectedPiece.position.col === piece.position.col;

  const isLegalTarget = legalMoves.some((m) => m.row === row && m.col === col);

  function handleClick(): void {
    // Click-to-move: if a piece is selected and this square is a legal target, make the move
    if (selectedPiece && isLegalTarget && selectedPiece.color === playerColor) {
      socket.emit(GAME_EVENTS.MAKE_MOVE, {
        fromRow: selectedPiece.position.row,
        fromCol: selectedPiece.position.col,
        toRow: row,
        toCol: col,
      });
      setSelectedPiece(null);
      setLegalMoves([]);
      return;
    }

    if (isSelected) {
      setSelectedPiece(null);
      setLegalMoves([]);
    } else if (piece) {
      setSelectedPiece(piece);
      if (gameState) {
        setLegalMoves(getLegalMoves(piece, gameState));
      } else {
        setLegalMoves([]);
      }
    } else {
      // Clicked empty non-target square: deselect
      setSelectedPiece(null);
      setLegalMoves([]);
    }
  }

  return (
    <div
      ref={setNodeRef}
      onClick={handleClick}
      className={clsx(
        "relative w-12 h-12 flex items-center justify-center",
        isLight ? "bg-amber-100" : "bg-amber-800",
        isOver && "ring-2 ring-inset ring-blue-400",
        isSelected && "ring-2 ring-inset ring-sky-400"
      )}
      role="gridcell"
      aria-label={id}
    >
      {piece && <Piece piece={piece} squareId={id} disabled={!canDrag} />}
      {isLegalTarget && !piece && (
        <span className="absolute w-3 h-3 rounded-full bg-gray-400/50 pointer-events-none" />
      )}
      {isLegalTarget && piece && (
        <span className="absolute inset-0 rounded-full border-[3px] border-gray-400/50 pointer-events-none" />
      )}
    </div>
  );
}
