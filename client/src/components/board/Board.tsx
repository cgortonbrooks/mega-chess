import React, { useRef } from "react";
import { DndContext, DragEndEvent, DragOverEvent, PointerSensor, useSensor, useSensors, closestCenter } from "@dnd-kit/core";
import { useGameStore } from "../../store/gameStore";
import { useSocket } from "../../hooks/useSocket";
import { GAME_EVENTS, PlayerColor } from "@mega-chess/shared";
import { Square } from "./Square";
import { PieceInfo } from "./PieceInfo";
import { Chat } from "./Chat";

export function Board(): React.JSX.Element {
  const { gameState, playerColor, setSelectedPiece, setLegalMoves } = useGameStore();
  const { socket } = useSocket();
  const lastOverId = useRef<string | null>(null);

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 5,
      },
    })
  );

  if (!gameState) {
    return (
      <div className="flex items-center justify-center py-16">
        <p className="text-muted-foreground">No active game.</p>
      </div>
    );
  }

  const { rows, cols } = gameState.config.boardConfig;

  function handleDragOver(event: DragOverEvent): void {
    lastOverId.current = event.over ? String(event.over.id) : null;
  }

  function handleDragEnd(event: DragEndEvent): void {
    const { active, over } = event;
    const targetId = over ? String(over.id) : lastOverId.current;
    lastOverId.current = null;

    if (!targetId || String(active.id) === targetId) return;

    setSelectedPiece(null);
    setLegalMoves([]);

    // Parse encoded square IDs: "row-col"
    const [fromRow, fromCol] = (active.id as string).split("-").map(Number);
    const [toRow, toCol] = targetId.split("-").map(Number);

    socket.emit(GAME_EVENTS.MAKE_MOVE, { fromRow, fromCol, toRow, toCol });
  }

  const isMyTurn = gameState.currentTurn === playerColor;

  // Flip board so the player's pieces are always at the bottom
  const flipBoard = playerColor === PlayerColor.BLACK;
  const rowOrder = flipBoard
    ? Array.from({ length: rows }, (_, i) => rows - 1 - i)
    : Array.from({ length: rows }, (_, i) => i);
  const colOrder = flipBoard
    ? Array.from({ length: cols }, (_, i) => cols - 1 - i)
    : Array.from({ length: cols }, (_, i) => i);

  return (
    <div className="flex flex-col items-center gap-4">
      <div className="flex items-center gap-3">
        <span
          className={`inline-block w-4 h-4 rounded-full border-2 ${
            gameState.currentTurn === PlayerColor.WHITE
              ? "bg-white border-gray-400"
              : "bg-gray-800 border-gray-400"
          }`}
        />
        <span className={`text-lg font-semibold ${isMyTurn ? "text-green-400" : "text-muted-foreground"}`}>
          {isMyTurn ? "Your turn" : "Opponent's turn"}
        </span>
      </div>

      <div className="flex items-start gap-4 w-full max-w-screen-xl mx-auto">
        <div className="flex-1 min-w-0">
          <Chat />
        </div>

        <div className="shrink-0">
          <DndContext sensors={sensors} collisionDetection={closestCenter} onDragOver={handleDragOver} onDragEnd={handleDragEnd}>
            <div
              className="inline-grid border border-border"
              style={{ gridTemplateColumns: `repeat(${cols}, 3rem)` }}
              role="grid"
              aria-label="Chess board"
            >
              {rowOrder.flatMap((rowIdx) =>
                colOrder.map((colIdx) => {
                  const piece = gameState.board[rowIdx]?.[colIdx] ?? null;
                  const isLight = (rowIdx + colIdx) % 2 === 0;
                  const canDrag = isMyTurn && piece?.color === playerColor;
                  return (
                    <Square
                      key={`${rowIdx}-${colIdx}`}
                      id={`${rowIdx}-${colIdx}`}
                      piece={piece}
                      isLight={isLight}
                      canDrag={canDrag}
                    />
                  );
                })
              )}
            </div>
          </DndContext>
        </div>

        <div className="flex-1 min-w-0">
          <PieceInfo />
        </div>
      </div>
    </div>
  );
}
