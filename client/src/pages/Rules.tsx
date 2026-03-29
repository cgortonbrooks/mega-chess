import React from "react";
import { Link } from "react-router-dom";

export function Rules(): React.JSX.Element {
  return (
    <div className="min-h-screen bg-background text-foreground">
      <header className="border-b border-border px-6 py-4 flex items-center gap-6">
        <Link to="/" className="text-2xl font-bold tracking-tight hover:opacity-80">
          Mega Chess
        </Link>
        <Link
          to="/rules"
          className="ml-auto text-sm text-muted-foreground hover:text-foreground"
        >
          Rules
        </Link>
      </header>

      <main className="container mx-auto px-4 py-8 max-w-2xl">
        <Link
          to="/"
          className="text-sm text-muted-foreground hover:text-foreground mb-6 inline-flex items-center gap-1"
        >
          ← Back to Lobby
        </Link>

        <h1 className="text-3xl font-bold mb-8">Rules</h1>

        {/* Overview */}
        <section className="mb-8">
          <h2 className="text-xl font-semibold mb-3">Overview</h2>
          <p className="text-muted-foreground leading-relaxed">
            Mega Chess is played on a configurable board (default 10×10). Each
            player receives a budget of <strong>40 points</strong> to spend on
            pieces during setup. The King is free and mandatory. Capture your
            opponent's King to win.
          </p>
        </section>

        {/* No-check rules */}
        <section className="mb-8">
          <h2 className="text-xl font-semibold mb-3">No-Check Rules</h2>
          <ul className="list-disc list-inside space-y-2 text-muted-foreground">
            <li>There is no check, checkmate, or stalemate.</li>
            <li>A player may freely move into or remain in what would normally be check.</li>
            <li>The game ends immediately when a King is captured.</li>
            <li>The player who captures the opponent's King wins.</li>
          </ul>
        </section>

        {/* Piece costs */}
        <section className="mb-8">
          <h2 className="text-xl font-semibold mb-3">Piece Costs</h2>
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border text-left">
                <th className="py-2 font-medium">Piece</th>
                <th className="py-2 font-medium text-right">Cost</th>
              </tr>
            </thead>
            <tbody className="text-muted-foreground">
              {[
                ["King", "0 (required)"],
                ["Queen", "9"],
                ["Rook", "5"],
                ["Bishop", "3"],
                ["Knight", "3"],
                ["Pawn", "1"],
                ["Super Queen", "12"],
                ["Elephant", "2"],
              ].map(([piece, cost]) => (
                <tr key={piece} className="border-b border-border/50">
                  <td className="py-2">{piece}</td>
                  <td className="py-2 text-right font-mono">{cost}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </section>

        {/* Movement */}
        <section className="mb-8">
          <h2 className="text-xl font-semibold mb-3">Movement</h2>
          <ul className="list-disc list-inside space-y-2 text-muted-foreground">
            <li><strong>King</strong> — moves one square in any direction.</li>
            <li><strong>Queen</strong> — slides any number of squares in any direction.</li>
            <li><strong>Rook</strong> — slides any number of squares horizontally or vertically.</li>
            <li><strong>Bishop</strong> — slides any number of squares diagonally.</li>
            <li><strong>Knight</strong> — jumps in an L-shape (2+1). Can leap over pieces.</li>
            <li><strong>Pawn</strong> — moves one square forward; captures one square diagonally forward. Promotes to Queen on the last rank.</li>
            <li><strong>Super Queen</strong> — slides any number of squares in any direction and can jump over pieces. Cannot capture after jumping — only captures the first piece it reaches in a line.</li>
            <li><strong>Elephant</strong> — moves one or two squares diagonally. Cannot jump over pieces.</li>
          </ul>
        </section>

        {/* Setup */}
        <section className="mb-8">
          <h2 className="text-xl font-semibold mb-3">Setup Phase</h2>
          <p className="text-muted-foreground leading-relaxed">
            Both players place pieces simultaneously on their own half of the
            board. You must place exactly one King. Spend your remaining budget
            on any combination of pieces. Once both players submit, the game
            begins with White moving first.
          </p>
        </section>
      </main>
    </div>
  );
}
