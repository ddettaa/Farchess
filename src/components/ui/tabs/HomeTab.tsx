"use client";

import { ChessGame } from "~/components/chess";

/**
 * HomeTab component displays the chess game.
 * 
 * This is the main tab that users see when they open the mini app.
 * It renders the complete chess game with difficulty selection and gameplay.
 * 
 * @example
 * ```tsx
 * <HomeTab />
 * ```
 */
export function HomeTab() {
  return (
    <div className="chess-container">
      <ChessGame enableBlockchain={true} />
    </div>
  );
}
 