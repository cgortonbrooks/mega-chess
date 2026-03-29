import React, { useState } from "react";
import {
  DndContext,
  DragEndEvent,
  DragStartEvent,
  DragOverlay,
  useDroppable,
  useDraggable,
} from "@dnd-kit/core";
import { CSS } from "@dnd-kit/utilities";
import { clsx } from "clsx";
import {
  Piece,
  PieceType,
  PlayerColor,
  GAME_EVENTS,
} from "@mega-chess/shared";
import { useGameStore } from "../../store/gameStore";
import { useSocket } from "../../hooks/useSocket";

// ─── Piece rendering helpers ─────────────────────────────────────────────────

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

/** Badge overlays for special pieces */
const PIECE_BADGE: Partial<Record<PieceType, { label: string; bg: string; border: string; text: string }>> = {
  [PieceType.SUPER_QUEEN]: { label: "+", bg: "bg-amber-400", border: "border-amber-600", text: "text-amber-900" },

};

const BONUS_SYMBOLS: Partial<Record<PieceType, string>> = {
  [PieceType.BONUS_1]: "★",
  [PieceType.BONUS_2]: "▲",
  [PieceType.BONUS_3]: "◆",
};

function PieceImage({ type, color, className }: { type: PieceType; color: PlayerColor; className?: string }): React.JSX.Element {
  const entry = PIECE_IMAGES[type];
  const src = entry ? (color === PlayerColor.WHITE ? entry.white : entry.black) : undefined;
  const badge = PIECE_BADGE[type];

  if (src) {
    return (
      <span className={clsx("relative inline-flex items-center justify-center", className)}>
        <img src={src} alt={`${color} ${type}`} className="w-full h-full rounded bg-gray-500 p-0.5" draggable={false} />
        {badge && (
          <span className={clsx("absolute -top-0.5 -right-0.5 w-3 h-3 rounded-full border text-[8px] font-bold leading-none flex items-center justify-center pointer-events-none", badge.bg, badge.border, badge.text)}>
            {badge.label}
          </span>
        )}
      </span>
    );
  }

  return (
    <span className={clsx("inline-flex items-center justify-center", className)}>
      <span className={clsx(
        "text-xl leading-none",
        color === PlayerColor.WHITE
          ? "text-white drop-shadow-[0_1px_2px_rgba(0,0,0,0.9)]"
          : "text-gray-900"
      )}>
        {BONUS_SYMBOLS[type] ?? "?"}
      </span>
    </span>
  );
}

const PIECE_NAMES: Record<string, string> = {
  [PieceType.KING]: "King",
  [PieceType.QUEEN]: "Queen",
  [PieceType.ROOK]: "Rook",
  [PieceType.BISHOP]: "Bishop",
  [PieceType.KNIGHT]: "Knight",
  [PieceType.PAWN]: "Pawn",
  [PieceType.SUPER_QUEEN]: "S.Queen",
  [PieceType.ELEPHANT]: "Elephant",
};

// ─── SetupSquare ─────────────────────────────────────────────────────────────

interface SetupSquareProps {
  row: number;
  col: number;
  piece: Piece | null;
  inZone: boolean;
  isLight: boolean;
  playerColor: PlayerColor;
  onRemove: (row: number, col: number) => void;
}

function SetupSquare({
  row, col, piece, inZone, isLight, playerColor, onRemove,
}: SetupSquareProps): React.JSX.Element {
  const { isOver, setNodeRef: dropRef } = useDroppable({
    id: `sq:${row}:${col}`,
    disabled: !inZone,
  });

  const isOwnPiece = piece?.color === playerColor;

  const {
    attributes,
    listeners,
    setNodeRef: dragRef,
    transform,
    isDragging,
  } = useDraggable({
    id: `board:${row}:${col}`,
    disabled: !isOwnPiece,
    data: { source: "board", piece },
  });

  return (
    <div
      ref={dropRef}
      className={clsx(
        "relative w-10 h-10 flex items-center justify-center",
        isLight ? "bg-amber-100" : "bg-amber-800",
        !inZone && "brightness-75",
        inZone && !isOver && "ring-1 ring-inset ring-green-500/40",
        isOver && inZone && "ring-2 ring-inset ring-green-400 bg-green-500/20"
      )}
    >
      {piece && (
        <span
          ref={isOwnPiece ? dragRef : undefined}
          style={
            isOwnPiece
              ? { transform: CSS.Translate.toString(transform), zIndex: isDragging ? 50 : undefined }
              : undefined
          }
          {...(isOwnPiece ? listeners : {})}
          {...(isOwnPiece ? attributes : {})}
          className={clsx(
            "select-none leading-none flex items-center justify-center",
            isDragging && "opacity-0"
          )}
          aria-label={`${piece.color} ${piece.type}`}
        >
          <PieceImage type={piece.type} color={piece.color} className="w-8 h-8" />
        </span>
      )}

      {/* Remove button — only show for own pieces */}
      {isOwnPiece && !isDragging && (
        <button
          onClick={() => onRemove(row, col)}
          className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-destructive text-white text-xs leading-none flex items-center justify-center opacity-0 group-hover:opacity-100 hover:opacity-100 focus:opacity-100 z-10"
          aria-label="Remove piece"
          tabIndex={-1}
        >
          ×
        </button>
      )}
    </div>
  );
}

// ─── StorePieceCard ───────────────────────────────────────────────────────────

interface StorePieceCardProps {
  pieceType: PieceType;
  playerColor: PlayerColor;
  cost: number;
  canAfford: boolean;
  disabled: boolean;
}

function StorePieceCard({
  pieceType,
  playerColor,
  cost,
  canAfford,
  disabled,
}: StorePieceCardProps): React.JSX.Element {
  const isDisabled = disabled || !canAfford;

  const { attributes, listeners, setNodeRef, transform, isDragging } =
    useDraggable({
      id: `store:${pieceType}`,
      disabled: isDisabled,
      data: { source: "store", pieceType },
    });

  return (
    <div
      ref={setNodeRef}
      style={{
        transform: CSS.Translate.toString(transform),
        opacity: isDragging ? 0.4 : 1,
      }}
      {...listeners}
      {...attributes}
      className={clsx(
        "flex flex-col items-center gap-0.5 px-3 py-2 rounded-lg border-2 w-16 select-none",
        isDisabled
          ? "border-dashed border-border opacity-40 cursor-not-allowed"
          : "border-border cursor-grab hover:border-primary hover:bg-accent active:cursor-grabbing"
      )}
      aria-label={`${pieceType} — ${cost === 0 ? "free" : `${cost} pts`}`}
    >
      <PieceImage type={pieceType} color={playerColor} className="w-7 h-7" />
      <span className="text-xs text-muted-foreground capitalize leading-tight">
        {PIECE_NAMES[pieceType] ?? pieceType.toLowerCase()}
      </span>
      <span className="text-xs font-semibold leading-tight">
        {cost === 0 ? "free" : `${cost}pt`}
      </span>
    </div>
  );
}

// ─── Drag overlay piece ───────────────────────────────────────────────────────

function OverlayPiece({
  pieceType,
  playerColor,
}: {
  pieceType: PieceType;
  playerColor: PlayerColor;
}): React.JSX.Element {
  return (
    <div className="flex items-center justify-center w-10 h-10 rounded bg-primary/20 shadow-lg">
      <PieceImage type={pieceType} color={playerColor} className="w-8 h-8" />
    </div>
  );
}

// ─── GameSetup ────────────────────────────────────────────────────────────────

export function GameSetup(): React.JSX.Element {
  const { gameState, playerColor, gameConfig } = useGameStore();
  const { socket } = useSocket();

  const [localBoard, setLocalBoard] = useState<(Piece | null)[][]>(() => {
    if (!gameState) return [];
    return gameState.board.map((row) => [...row]);
  });

  const [activeDrag, setActiveDrag] = useState<{
    source: "store" | "board";
    pieceType: PieceType;
    color: PlayerColor;
  } | null>(null);

  const [submitted, setSubmitted] = useState(false);

  if (!gameState || !playerColor) {
    return (
      <div className="flex items-center justify-center py-16">
        <p className="text-muted-foreground">Waiting for game state...</p>
      </div>
    );
  }

  // Non-null after guard — used in closures where TS can't narrow
  const color: PlayerColor = playerColor;

  const { rows, cols } = gameState.config.boardConfig;
  const { pieceCosts, total } = gameConfig.budgetConfig;

  const spentBudget = localBoard.flat().reduce((sum, p) => {
    if (!p || p.color !== playerColor) return sum;
    return sum + (pieceCosts[p.type] ?? 0);
  }, 0);
  const remainingBudget = total - spentBudget;

  const isKingPlaced = localBoard
    .flat()
    .some((p) => p?.color === playerColor && p.type === PieceType.KING);

  // Valid placement row indices (absolute, not display-order)
  const validRowSet =
    playerColor === PlayerColor.WHITE
      ? new Set([rows - 2, rows - 1])
      : new Set([0, 1]);

  // Row render order — flip board for black so their zone is at the bottom
  const displayRowOrder =
    playerColor === PlayerColor.BLACK
      ? Array.from({ length: rows }, (_, i) => rows - 1 - i)
      : Array.from({ length: rows }, (_, i) => i);

  const STORE_TYPES: PieceType[] = [
    PieceType.KING,
    PieceType.QUEEN,
    PieceType.ROOK,
    PieceType.BISHOP,
    PieceType.KNIGHT,
    PieceType.PAWN,
    PieceType.SUPER_QUEEN,
    PieceType.ELEPHANT,
  ];

  // ── Drag handlers ──

  function handleDragStart(event: DragStartEvent): void {
    const data = event.active.data.current as {
      source: "store" | "board";
      pieceType?: PieceType;
      piece?: Piece;
    };
    if (data.source === "store" && data.pieceType) {
      setActiveDrag({ source: "store", pieceType: data.pieceType, color });
    } else if (data.source === "board" && data.piece) {
      setActiveDrag({ source: "board", pieceType: data.piece.type, color });
    }
  }

  function handleDragEnd(event: DragEndEvent): void {
    setActiveDrag(null);
    const { active, over } = event;
    if (!over) return;

    const activeId = active.id as string;
    const overId = over.id as string;
    if (!overId.startsWith("sq:")) return;

    const [, rowStr, colStr] = overId.split(":");
    const toRow = Number(rowStr);
    const toCol = Number(colStr);

    if (!validRowSet.has(toRow)) return;

    const newBoard = localBoard.map((r) => [...r]);

    if (activeId.startsWith("store:")) {
      // ── Place new piece from store
      const pieceType = activeId.slice(6) as PieceType;
      if (newBoard[toRow][toCol] !== null) return;
      if (pieceType === PieceType.KING && isKingPlaced) return;
      const cost = pieceCosts[pieceType] ?? 0;
      if (cost > remainingBudget) return;

      newBoard[toRow][toCol] = {
        id: `p-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
        type: pieceType,
        color,
        position: { row: toRow, col: toCol },
      };
      setLocalBoard(newBoard);
    } else if (activeId.startsWith("board:")) {
      // ── Move existing piece to new square
      const [, fromRowStr, fromColStr] = activeId.split(":");
      const fromRow = Number(fromRowStr);
      const fromCol = Number(fromColStr);
      if (fromRow === toRow && fromCol === toCol) return;
      if (newBoard[toRow][toCol] !== null) return;

      const piece = newBoard[fromRow][fromCol];
      if (!piece) return;

      newBoard[toRow][toCol] = { ...piece, position: { row: toRow, col: toCol } };
      newBoard[fromRow][fromCol] = null;
      setLocalBoard(newBoard);
    }
  }

  function handleRemovePiece(row: number, col: number): void {
    setLocalBoard((prev) => {
      const next = prev.map((r) => [...r]);
      next[row][col] = null;
      return next;
    });
  }

  function handleSubmit(): void {
    const pieces = localBoard
      .flat()
      .filter((p): p is Piece => p !== null && p.color === playerColor);
    socket.emit(GAME_EVENTS.SUBMIT_SETUP, pieces);
    setSubmitted(true);
  }

  if (submitted) {
    return (
      <div className="flex flex-col items-center gap-4 py-16">
        <h2 className="text-xl font-semibold">Setup submitted!</h2>
        <p className="text-muted-foreground text-sm">
          Waiting for your opponent to finish placing their pieces...
        </p>
      </div>
    );
  }

  return (
    <DndContext onDragStart={handleDragStart} onDragEnd={handleDragEnd}>
      <div className="flex flex-col gap-6 px-4 pb-8">
        {/* Header */}
        <div className="flex items-center justify-between gap-8">
          <div>
            <h2 className="text-xl font-semibold">Place Your Pieces</h2>
            <p className="text-sm text-muted-foreground">
              You are{" "}
              <strong>
                {playerColor === PlayerColor.WHITE ? "♔ White" : "♚ Black"}
              </strong>
              . Drag pieces onto the{" "}
              <span className="text-green-500 font-medium">highlighted</span>{" "}
              squares.
            </p>
          </div>
          <div className="text-right">
            <div className="text-2xl font-bold font-mono">{remainingBudget}</div>
            <div className="text-xs text-muted-foreground">pts remaining</div>
            <div className="text-xs text-muted-foreground">
              of {total} total
            </div>
          </div>
        </div>

        {/* Board (left) + Piece store (right) */}
        <div className="flex gap-8 items-start">
          {/* Board */}
          <div
            className="inline-grid border border-border shadow-sm shrink-0"
            style={{ gridTemplateColumns: `repeat(${cols}, 2.5rem)` }}
            role="grid"
            aria-label="Chess board setup"
          >
            {displayRowOrder.flatMap((rowIdx) =>
              Array.from({ length: cols }, (_, colIdx) => {
                const piece = localBoard[rowIdx]?.[colIdx] ?? null;
                const inZone = validRowSet.has(rowIdx);
                const isLight = (rowIdx + colIdx) % 2 === 0;
                return (
                  <div key={`${rowIdx}-${colIdx}`} className="group">
                    <SetupSquare
                      row={rowIdx}
                      col={colIdx}
                      piece={piece}
                      inZone={inZone}
                      isLight={isLight}
                      playerColor={playerColor}
                      onRemove={handleRemovePiece}
                    />
                  </div>
                );
              })
            )}
          </div>

          {/* Piece store */}
          <div className="flex flex-col gap-4">
            <div className="text-sm font-medium text-muted-foreground">
              Your pieces — drag onto green squares
            </div>
            <div className="grid grid-cols-3 gap-2">
              {STORE_TYPES.map((type) => (
                <StorePieceCard
                  key={type}
                  pieceType={type}
                  playerColor={playerColor}
                  cost={pieceCosts[type] ?? 0}
                  canAfford={(pieceCosts[type] ?? 0) <= remainingBudget}
                  disabled={type === PieceType.KING && isKingPlaced}
                />
              ))}
            </div>
            {!isKingPlaced && (
              <p className="text-xs text-amber-500 font-medium">
                ⚠ You must place a King before submitting.
              </p>
            )}

            {/* Submit */}
            <button
              onClick={handleSubmit}
              disabled={!isKingPlaced}
              className="px-8 py-3 rounded-lg bg-primary text-primary-foreground font-semibold hover:opacity-90 disabled:opacity-40 disabled:cursor-not-allowed transition-opacity mt-2"
            >
              Submit Setup
            </button>
          </div>
        </div>
      </div>

      {/* Drag overlay */}
      <DragOverlay>
        {activeDrag && (
          <OverlayPiece
            pieceType={activeDrag.pieceType}
            playerColor={activeDrag.color}
          />
        )}
      </DragOverlay>
    </DndContext>
  );
}
