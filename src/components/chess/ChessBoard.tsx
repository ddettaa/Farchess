/**
 * ChessBoard Component
 * Renders the 8x8 chess board with interactive squares
 */

"use client";

import { Position, GameState } from "../../lib/chess";
import { ChessPiece } from "./ChessPiece";

interface ChessBoardProps {
  gameState: GameState;
  selectedSquare: Position | null;
  legalMoves: Position[];
  lastMove: { from: Position; to: Position } | null;
  onSquareClick: (pos: Position) => void;
  disabled?: boolean;
  playerColor: 'white' | 'black';
}

export function ChessBoard({
  gameState,
  selectedSquare,
  legalMoves,
  lastMove,
  onSquareClick,
  disabled = false,
  playerColor,
}: ChessBoardProps) {
  const { board, isCheck, currentTurn } = gameState;

  // Find king position for check highlight
  let kingInCheckPos: Position | null = null;
  if (isCheck) {
    for (let row = 0; row < 8; row++) {
      for (let col = 0; col < 8; col++) {
        const piece = board[row][col];
        if (piece && piece.type === 'king' && piece.color === currentTurn) {
          kingInCheckPos = { row, col };
          break;
        }
      }
    }
  }

  const isLegalMove = (row: number, col: number): boolean => {
    return legalMoves.some(m => m.row === row && m.col === col);
  };

  const isLastMoveSquare = (row: number, col: number): boolean => {
    if (!lastMove) return false;
    return (
      (lastMove.from.row === row && lastMove.from.col === col) ||
      (lastMove.to.row === row && lastMove.to.col === col)
    );
  };

  const isKingInCheck = (row: number, col: number): boolean => {
    return kingInCheckPos?.row === row && kingInCheckPos?.col === col;
  };

  const isSelected = (row: number, col: number): boolean => {
    return selectedSquare?.row === row && selectedSquare?.col === col;
  };

  // Render rows - flip if player is black
  const rows = playerColor === 'black' 
    ? Array.from({ length: 8 }, (_, i) => i)
    : Array.from({ length: 8 }, (_, i) => i);
  
  const cols = playerColor === 'black'
    ? Array.from({ length: 8 }, (_, i) => 7 - i)
    : Array.from({ length: 8 }, (_, i) => i);

  return (
    <div className="chess-board-container">
      <div className={`chess-board ${disabled ? 'disabled' : ''}`}>
        {rows.map(row => (
          <div key={row} className="chess-row">
            {cols.map(col => {
              const piece = board[row][col];
              const isLight = (row + col) % 2 === 0;
              const squareClasses = [
                'chess-square',
                isLight ? 'light' : 'dark',
                isSelected(row, col) ? 'selected' : '',
                isLegalMove(row, col) ? 'legal-move' : '',
                isLastMoveSquare(row, col) ? 'last-move' : '',
                isKingInCheck(row, col) ? 'in-check' : '',
                piece && isLegalMove(row, col) ? 'can-capture' : '',
              ].filter(Boolean).join(' ');

              return (
                <div
                  key={`${row}-${col}`}
                  className={squareClasses}
                  onClick={() => !disabled && onSquareClick({ row, col })}
                >
                  {/* Coordinate labels */}
                  {col === (playerColor === 'black' ? 7 : 0) && (
                    <span className="coord-label rank">{8 - row}</span>
                  )}
                  {row === (playerColor === 'black' ? 0 : 7) && (
                    <span className="coord-label file">{String.fromCharCode(97 + col)}</span>
                  )}
                  
                  {/* Move indicator dot */}
                  {isLegalMove(row, col) && !piece && (
                    <div className="move-indicator" />
                  )}
                  
                  {/* Chess piece */}
                  <ChessPiece 
                    piece={piece} 
                    isSelected={isSelected(row, col)}
                  />
                </div>
              );
            })}
          </div>
        ))}
      </div>
    </div>
  );
}
