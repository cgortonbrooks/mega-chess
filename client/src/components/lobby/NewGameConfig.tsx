import React, { useState } from "react";
import {
  ColorPreference,
  DEFAULT_BUDGET_CONFIG,
  DEFAULT_PIECE_COSTS,
  GameConfig,
  GAME_EVENTS,
} from "@mega-chess/shared";
import { useSocket } from "../../hooks/useSocket";
import { clsx } from "clsx";

interface Props {
  onBack: () => void;
}

export function NewGameConfig({ onBack }: Props): React.JSX.Element {
  const { socket } = useSocket();
  const [rows, setRows] = useState(8);
  const [cols, setCols] = useState(8);
  const [colorPref, setColorPref] = useState<ColorPreference>(
    ColorPreference.RANDOM
  );
  const [budget, setBudget] = useState(DEFAULT_BUDGET_CONFIG.total);

  function handleCreate(): void {
    const config: GameConfig = {
      boardConfig: { rows, cols, name: `${rows}×${cols}` },
      budgetConfig: { total: budget, pieceCosts: DEFAULT_PIECE_COSTS },
      useClocks: false,
      clockSeconds: 600,
    };
    socket.emit(GAME_EVENTS.CREATE_GAME, {
      config,
      colorPreference: colorPref,
    });
  }

  const COLOR_OPTIONS: { value: ColorPreference; label: string; symbol: string }[] = [
    { value: ColorPreference.WHITE, label: "White", symbol: "♔" },
    { value: ColorPreference.BLACK, label: "Black", symbol: "♚" },
    { value: ColorPreference.RANDOM, label: "Random", symbol: "🎲" },
  ];

  return (
    <div className="flex flex-col gap-8 max-w-md mx-auto">
      <div>
        <button
          onClick={onBack}
          className="text-sm text-muted-foreground hover:text-foreground mb-4 flex items-center gap-1"
        >
          ← Back
        </button>
        <h2 className="text-2xl font-semibold">New Game</h2>
        <p className="text-sm text-muted-foreground mt-1">
          Configure your board before inviting an opponent.
        </p>
      </div>

      {/* Board size */}
      <section className="flex flex-col gap-5">
        <h3 className="text-sm font-medium uppercase tracking-wider text-muted-foreground">
          Board Size
        </h3>

        <div className="flex flex-col gap-1">
          <div className="flex justify-between text-sm">
            <label htmlFor="rows-slider">Rows</label>
            <span className="font-mono font-semibold w-6 text-right">{rows}</span>
          </div>
          <input
            id="rows-slider"
            type="range"
            min={4}
            max={10}
            value={rows}
            onChange={(e) => setRows(Number(e.target.value))}
            className="w-full accent-primary"
          />
          <div className="flex justify-between text-xs text-muted-foreground">
            <span>4</span><span>10</span>
          </div>
        </div>

        <div className="flex flex-col gap-1">
          <div className="flex justify-between text-sm">
            <label htmlFor="cols-slider">Columns</label>
            <span className="font-mono font-semibold w-6 text-right">{cols}</span>
          </div>
          <input
            id="cols-slider"
            type="range"
            min={4}
            max={10}
            value={cols}
            onChange={(e) => setCols(Number(e.target.value))}
            className="w-full accent-primary"
          />
          <div className="flex justify-between text-xs text-muted-foreground">
            <span>4</span><span>10</span>
          </div>
        </div>

        {/* Board preview */}
        <div className="flex flex-col items-start gap-1">
          <span className="text-xs text-muted-foreground">Preview</span>
          <div
            className="border border-border rounded overflow-hidden"
            style={{ width: `${Math.min(cols * 14, 224)}px` }}
          >
            <div
              className="grid"
              style={{ gridTemplateColumns: `repeat(${cols}, 1fr)` }}
            >
              {Array.from({ length: rows * cols }, (_, i) => {
                const r = Math.floor(i / cols);
                const c = i % cols;
                return (
                  <div
                    key={i}
                    className={clsx(
                      "aspect-square",
                      (r + c) % 2 === 0 ? "bg-amber-100" : "bg-amber-700"
                    )}
                  />
                );
              })}
            </div>
          </div>
          <span className="text-xs text-muted-foreground">
            {rows} × {cols} = {rows * cols} squares
          </span>
        </div>
      </section>

      {/* Color preference */}
      <section className="flex flex-col gap-3">
        <h3 className="text-sm font-medium uppercase tracking-wider text-muted-foreground">
          Budget
        </h3>
        <div className="flex flex-col gap-1">
          <div className="flex justify-between text-sm">
            <label htmlFor="budget-slider">Points per player</label>
            <span className="font-mono font-semibold w-8 text-right">{budget}</span>
          </div>
          <input
            id="budget-slider"
            type="range"
            min={1}
            max={100}
            step={1}
            value={budget}
            onChange={(e) => setBudget(Number(e.target.value))}
            className="w-full accent-primary"
          />
          <div className="flex justify-between text-xs text-muted-foreground">
            <span>1</span><span>100</span>
          </div>
        </div>
      </section>

      {/* Color preference */}
      <section className="flex flex-col gap-3">
        <h3 className="text-sm font-medium uppercase tracking-wider text-muted-foreground">
          Play As
        </h3>
        <div className="flex gap-3">
          {COLOR_OPTIONS.map(({ value, label, symbol }) => (
            <button
              key={value}
              onClick={() => setColorPref(value)}
              className={clsx(
                "flex-1 flex flex-col items-center gap-1 py-3 rounded-lg border-2 text-sm font-medium transition-colors",
                colorPref === value
                  ? "border-primary bg-primary/10"
                  : "border-border hover:border-primary/40"
              )}
            >
              <span className="text-2xl">{symbol}</span>
              <span>{label}</span>
            </button>
          ))}
        </div>
      </section>

      <button
        onClick={handleCreate}
        className="w-full py-3 rounded-lg bg-primary text-primary-foreground font-semibold hover:opacity-90 transition-opacity"
      >
        Create Game
      </button>
    </div>
  );
}
