/**
 * ChessPiece Component
 * Renders individual chess pieces with SVG
 */

"use client";

import { Piece, getPieceSymbol } from "../../lib/chess";

interface ChessPieceProps {
  piece: Piece | null;
  isSelected?: boolean;
  onClick?: () => void;
}

export function ChessPiece({ piece, isSelected, onClick }: ChessPieceProps) {
  if (!piece) return null;

  return (
    <div
      className={`chess-piece ${piece.color} ${isSelected ? 'selected' : ''}`}
      onClick={onClick}
      role="button"
      aria-label={`${piece.color} ${piece.type}`}
    >
      <span className="piece-symbol">{getPieceSymbol(piece)}</span>
    </div>
  );
}
