/**
 * Chess AI Engine
 * Provides AI opponents with 3 difficulty levels: Easy, Medium, Hard
 */

import {
  GameState,
  Position,
  Piece,
  PieceColor,
  PieceType,
  getLegalMoves,
  makeMove,
  getPiecesOfColor,
} from './chess';

export type Difficulty = 'easy' | 'medium' | 'hard';

interface MoveScore {
  from: Position;
  to: Position;
  score: number;
}

// --- Piece Values for Evaluation ---
const PIECE_VALUES: Record<PieceType, number> = {
  pawn: 100,
  knight: 320,
  bishop: 330,
  rook: 500,
  queen: 900,
  king: 20000,
};

// --- Position Bonus Tables ---
// Encourage pieces to be in strategically good positions
const PAWN_TABLE: number[][] = [
  [0, 0, 0, 0, 0, 0, 0, 0],
  [50, 50, 50, 50, 50, 50, 50, 50],
  [10, 10, 20, 30, 30, 20, 10, 10],
  [5, 5, 10, 25, 25, 10, 5, 5],
  [0, 0, 0, 20, 20, 0, 0, 0],
  [5, -5, -10, 0, 0, -10, -5, 5],
  [5, 10, 10, -20, -20, 10, 10, 5],
  [0, 0, 0, 0, 0, 0, 0, 0],
];

const KNIGHT_TABLE: number[][] = [
  [-50, -40, -30, -30, -30, -30, -40, -50],
  [-40, -20, 0, 0, 0, 0, -20, -40],
  [-30, 0, 10, 15, 15, 10, 0, -30],
  [-30, 5, 15, 20, 20, 15, 5, -30],
  [-30, 0, 15, 20, 20, 15, 0, -30],
  [-30, 5, 10, 15, 15, 10, 5, -30],
  [-40, -20, 0, 5, 5, 0, -20, -40],
  [-50, -40, -30, -30, -30, -30, -40, -50],
];

const BISHOP_TABLE: number[][] = [
  [-20, -10, -10, -10, -10, -10, -10, -20],
  [-10, 0, 0, 0, 0, 0, 0, -10],
  [-10, 0, 5, 10, 10, 5, 0, -10],
  [-10, 5, 5, 10, 10, 5, 5, -10],
  [-10, 0, 10, 10, 10, 10, 0, -10],
  [-10, 10, 10, 10, 10, 10, 10, -10],
  [-10, 5, 0, 0, 0, 0, 5, -10],
  [-20, -10, -10, -10, -10, -10, -10, -20],
];

const ROOK_TABLE: number[][] = [
  [0, 0, 0, 0, 0, 0, 0, 0],
  [5, 10, 10, 10, 10, 10, 10, 5],
  [-5, 0, 0, 0, 0, 0, 0, -5],
  [-5, 0, 0, 0, 0, 0, 0, -5],
  [-5, 0, 0, 0, 0, 0, 0, -5],
  [-5, 0, 0, 0, 0, 0, 0, -5],
  [-5, 0, 0, 0, 0, 0, 0, -5],
  [0, 0, 0, 5, 5, 0, 0, 0],
];

const QUEEN_TABLE: number[][] = [
  [-20, -10, -10, -5, -5, -10, -10, -20],
  [-10, 0, 0, 0, 0, 0, 0, -10],
  [-10, 0, 5, 5, 5, 5, 0, -10],
  [-5, 0, 5, 5, 5, 5, 0, -5],
  [0, 0, 5, 5, 5, 5, 0, -5],
  [-10, 5, 5, 5, 5, 5, 0, -10],
  [-10, 0, 5, 0, 0, 0, 0, -10],
  [-20, -10, -10, -5, -5, -10, -10, -20],
];

const KING_TABLE_MIDGAME: number[][] = [
  [-30, -40, -40, -50, -50, -40, -40, -30],
  [-30, -40, -40, -50, -50, -40, -40, -30],
  [-30, -40, -40, -50, -50, -40, -40, -30],
  [-30, -40, -40, -50, -50, -40, -40, -30],
  [-20, -30, -30, -40, -40, -30, -30, -20],
  [-10, -20, -20, -20, -20, -20, -20, -10],
  [20, 20, 0, 0, 0, 0, 20, 20],
  [20, 30, 10, 0, 0, 10, 30, 20],
];

function getPositionBonus(piece: Piece, row: number, col: number): number {
  // Flip table for black pieces
  const actualRow = piece.color === 'white' ? row : 7 - row;
  
  switch (piece.type) {
    case 'pawn': return PAWN_TABLE[actualRow][col];
    case 'knight': return KNIGHT_TABLE[actualRow][col];
    case 'bishop': return BISHOP_TABLE[actualRow][col];
    case 'rook': return ROOK_TABLE[actualRow][col];
    case 'queen': return QUEEN_TABLE[actualRow][col];
    case 'king': return KING_TABLE_MIDGAME[actualRow][col];
    default: return 0;
  }
}

// --- Board Evaluation ---
function evaluateBoard(state: GameState, forColor: PieceColor): number {
  if (state.isCheckmate) {
    return state.winner === forColor ? 100000 : -100000;
  }
  if (state.isDraw) {
    return 0;
  }

  let score = 0;
  
  for (let row = 0; row < 8; row++) {
    for (let col = 0; col < 8; col++) {
      const piece = state.board[row][col];
      if (piece) {
        const pieceValue = PIECE_VALUES[piece.type] + getPositionBonus(piece, row, col);
        if (piece.color === forColor) {
          score += pieceValue;
        } else {
          score -= pieceValue;
        }
      }
    }
  }
  
  // Bonus for check
  if (state.isCheck && state.currentTurn !== forColor) {
    score += 50;
  }
  
  return score;
}

// --- Easy AI: Random Move ---
function getRandomMove(state: GameState): MoveScore | null {
  const pieces = getPiecesOfColor(state.board, state.currentTurn);
  const allMoves: MoveScore[] = [];
  
  for (const { position } of pieces) {
    const moves = getLegalMoves(state, position);
    for (const moveTo of moves) {
      allMoves.push({ from: position, to: moveTo, score: 0 });
    }
  }
  
  if (allMoves.length === 0) return null;
  return allMoves[Math.floor(Math.random() * allMoves.length)];
}

// --- Medium AI: One-ply evaluation ---
function getMediumMove(state: GameState): MoveScore | null {
  const pieces = getPiecesOfColor(state.board, state.currentTurn);
  const moves: MoveScore[] = [];
  
  for (const { position } of pieces) {
    const legalMoves = getLegalMoves(state, position);
    for (const moveTo of legalMoves) {
      const newState = makeMove(state, position, moveTo);
      const score = evaluateBoard(newState, state.currentTurn);
      moves.push({ from: position, to: moveTo, score });
    }
  }
  
  if (moves.length === 0) return null;
  
  // Sort by score descending
  moves.sort((a, b) => b.score - a.score);
  
  // Add some randomness among top moves
  const topMoves = moves.filter(m => m.score >= moves[0].score - 50);
  return topMoves[Math.floor(Math.random() * topMoves.length)];
}

// --- Hard AI: Minimax with Alpha-Beta Pruning ---
function minimax(
  state: GameState,
  depth: number,
  alpha: number,
  beta: number,
  maximizing: boolean,
  forColor: PieceColor
): number {
  if (depth === 0 || state.isCheckmate || state.isDraw) {
    return evaluateBoard(state, forColor);
  }
  
  const pieces = getPiecesOfColor(state.board, state.currentTurn);
  
  if (maximizing) {
    let maxEval = -Infinity;
    for (const { position } of pieces) {
      const moves = getLegalMoves(state, position);
      for (const moveTo of moves) {
        const newState = makeMove(state, position, moveTo);
        const evalScore = minimax(newState, depth - 1, alpha, beta, false, forColor);
        maxEval = Math.max(maxEval, evalScore);
        alpha = Math.max(alpha, evalScore);
        if (beta <= alpha) break;
      }
      if (beta <= alpha) break;
    }
    return maxEval;
  } else {
    let minEval = Infinity;
    for (const { position } of pieces) {
      const moves = getLegalMoves(state, position);
      for (const moveTo of moves) {
        const newState = makeMove(state, position, moveTo);
        const evalScore = minimax(newState, depth - 1, alpha, beta, true, forColor);
        minEval = Math.min(minEval, evalScore);
        beta = Math.min(beta, evalScore);
        if (beta <= alpha) break;
      }
      if (beta <= alpha) break;
    }
    return minEval;
  }
}

function getHardMove(state: GameState): MoveScore | null {
  const pieces = getPiecesOfColor(state.board, state.currentTurn);
  const moves: MoveScore[] = [];
  const depth = 3; // Depth 3 for reasonable performance
  
  for (const { position } of pieces) {
    const legalMoves = getLegalMoves(state, position);
    for (const moveTo of legalMoves) {
      const newState = makeMove(state, position, moveTo);
      const score = minimax(newState, depth - 1, -Infinity, Infinity, false, state.currentTurn);
      moves.push({ from: position, to: moveTo, score });
    }
  }
  
  if (moves.length === 0) return null;
  
  // Sort by score descending and pick best
  moves.sort((a, b) => b.score - a.score);
  return moves[0];
}

// --- Main AI Function ---
export function getAIMove(state: GameState, difficulty: Difficulty): { from: Position; to: Position } | null {
  let move: MoveScore | null = null;
  
  switch (difficulty) {
    case 'easy':
      move = getRandomMove(state);
      break;
    case 'medium':
      move = getMediumMove(state);
      break;
    case 'hard':
      move = getHardMove(state);
      break;
  }
  
  if (!move) return null;
  return { from: move.from, to: move.to };
}

// Delay for AI thinking effect
export function getAIThinkingDelay(difficulty: Difficulty): number {
  switch (difficulty) {
    case 'easy': return 300;
    case 'medium': return 600;
    case 'hard': return 1000;
  }
}
