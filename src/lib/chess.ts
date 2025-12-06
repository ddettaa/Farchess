/**
 * Chess Game Engine
 * Complete chess logic with board state, move validation, and game rules
 */

// --- Types ---
export type PieceType = 'pawn' | 'rook' | 'knight' | 'bishop' | 'queen' | 'king';
export type PieceColor = 'white' | 'black';

export interface Piece {
  type: PieceType;
  color: PieceColor;
  hasMoved?: boolean;
}

export interface Position {
  row: number;
  col: number;
}

export interface Move {
  from: Position;
  to: Position;
  piece: Piece;
  captured?: Piece;
  isPromotion?: boolean;
  promoteTo?: PieceType;
  isCastling?: boolean;
  isEnPassant?: boolean;
}

export interface GameState {
  board: (Piece | null)[][];
  currentTurn: PieceColor;
  moveHistory: Move[];
  capturedPieces: { white: Piece[]; black: Piece[] };
  isCheck: boolean;
  isCheckmate: boolean;
  isStalemate: boolean;
  isDraw: boolean;
  winner: PieceColor | null;
  enPassantTarget: Position | null;
}

// --- Constants ---
const PIECE_SYMBOLS: Record<PieceColor, Record<PieceType, string>> = {
  white: {
    king: '♔',
    queen: '♕',
    rook: '♖',
    bishop: '♗',
    knight: '♘',
    pawn: '♙',
  },
  black: {
    king: '♚',
    queen: '♛',
    rook: '♜',
    bishop: '♝',
    knight: '♞',
    pawn: '♟',
  },
};

// --- Helper Functions ---
export function getPieceSymbol(piece: Piece): string {
  return PIECE_SYMBOLS[piece.color][piece.type];
}

export function positionToNotation(pos: Position): string {
  const file = String.fromCharCode(97 + pos.col); // a-h
  const rank = 8 - pos.row; // 1-8
  return `${file}${rank}`;
}

export function notationToPosition(notation: string): Position {
  const col = notation.charCodeAt(0) - 97;
  const row = 8 - parseInt(notation[1]);
  return { row, col };
}

// --- Initial Board Setup ---
export function createInitialBoard(): (Piece | null)[][] {
  const board: (Piece | null)[][] = Array(8).fill(null).map(() => Array(8).fill(null));
  
  // Back row pieces
  const backRow: PieceType[] = ['rook', 'knight', 'bishop', 'queen', 'king', 'bishop', 'knight', 'rook'];
  
  // Black pieces (top)
  for (let col = 0; col < 8; col++) {
    board[0][col] = { type: backRow[col], color: 'black' };
    board[1][col] = { type: 'pawn', color: 'black' };
  }
  
  // White pieces (bottom)
  for (let col = 0; col < 8; col++) {
    board[7][col] = { type: backRow[col], color: 'white' };
    board[6][col] = { type: 'pawn', color: 'white' };
  }
  
  return board;
}

export function createInitialGameState(): GameState {
  return {
    board: createInitialBoard(),
    currentTurn: 'white',
    moveHistory: [],
    capturedPieces: { white: [], black: [] },
    isCheck: false,
    isCheckmate: false,
    isStalemate: false,
    isDraw: false,
    winner: null,
    enPassantTarget: null,
  };
}

// --- Move Validation ---
function isInBounds(pos: Position): boolean {
  return pos.row >= 0 && pos.row < 8 && pos.col >= 0 && pos.col < 8;
}

function getPieceAt(board: (Piece | null)[][], pos: Position): Piece | null {
  if (!isInBounds(pos)) return null;
  return board[pos.row][pos.col];
}

function isEmptySquare(board: (Piece | null)[][], pos: Position): boolean {
  return isInBounds(pos) && board[pos.row][pos.col] === null;
}

function isEnemyPiece(board: (Piece | null)[][], pos: Position, color: PieceColor): boolean {
  const piece = getPieceAt(board, pos);
  return piece !== null && piece.color !== color;
}

function isFriendlyPiece(board: (Piece | null)[][], pos: Position, color: PieceColor): boolean {
  const piece = getPieceAt(board, pos);
  return piece !== null && piece.color === color;
}

// Get all raw moves for a piece (without check validation)
function getRawMoves(board: (Piece | null)[][], pos: Position, piece: Piece, enPassantTarget: Position | null): Position[] {
  const moves: Position[] = [];
  const { row, col } = pos;
  const direction = piece.color === 'white' ? -1 : 1;

  switch (piece.type) {
    case 'pawn': {
      // Forward move
      const oneForward = { row: row + direction, col };
      if (isEmptySquare(board, oneForward)) {
        moves.push(oneForward);
        // Two squares from starting position
        const startRow = piece.color === 'white' ? 6 : 1;
        if (row === startRow) {
          const twoForward = { row: row + 2 * direction, col };
          if (isEmptySquare(board, twoForward)) {
            moves.push(twoForward);
          }
        }
      }
      // Diagonal captures
      const leftCapture = { row: row + direction, col: col - 1 };
      const rightCapture = { row: row + direction, col: col + 1 };
      if (isEnemyPiece(board, leftCapture, piece.color)) moves.push(leftCapture);
      if (isEnemyPiece(board, rightCapture, piece.color)) moves.push(rightCapture);
      // En passant
      if (enPassantTarget) {
        if (leftCapture.row === enPassantTarget.row && leftCapture.col === enPassantTarget.col) {
          moves.push(leftCapture);
        }
        if (rightCapture.row === enPassantTarget.row && rightCapture.col === enPassantTarget.col) {
          moves.push(rightCapture);
        }
      }
      break;
    }

    case 'rook': {
      // Horizontal and vertical lines
      const directions = [[-1, 0], [1, 0], [0, -1], [0, 1]];
      for (const [dr, dc] of directions) {
        for (let i = 1; i < 8; i++) {
          const newPos = { row: row + dr * i, col: col + dc * i };
          if (!isInBounds(newPos)) break;
          if (isEmptySquare(board, newPos)) {
            moves.push(newPos);
          } else if (isEnemyPiece(board, newPos, piece.color)) {
            moves.push(newPos);
            break;
          } else {
            break;
          }
        }
      }
      break;
    }

    case 'knight': {
      const knightMoves = [
        [-2, -1], [-2, 1], [-1, -2], [-1, 2],
        [1, -2], [1, 2], [2, -1], [2, 1]
      ];
      for (const [dr, dc] of knightMoves) {
        const newPos = { row: row + dr, col: col + dc };
        if (isInBounds(newPos) && !isFriendlyPiece(board, newPos, piece.color)) {
          moves.push(newPos);
        }
      }
      break;
    }

    case 'bishop': {
      // Diagonal lines
      const directions = [[-1, -1], [-1, 1], [1, -1], [1, 1]];
      for (const [dr, dc] of directions) {
        for (let i = 1; i < 8; i++) {
          const newPos = { row: row + dr * i, col: col + dc * i };
          if (!isInBounds(newPos)) break;
          if (isEmptySquare(board, newPos)) {
            moves.push(newPos);
          } else if (isEnemyPiece(board, newPos, piece.color)) {
            moves.push(newPos);
            break;
          } else {
            break;
          }
        }
      }
      break;
    }

    case 'queen': {
      // Combination of rook and bishop
      const directions = [
        [-1, 0], [1, 0], [0, -1], [0, 1],
        [-1, -1], [-1, 1], [1, -1], [1, 1]
      ];
      for (const [dr, dc] of directions) {
        for (let i = 1; i < 8; i++) {
          const newPos = { row: row + dr * i, col: col + dc * i };
          if (!isInBounds(newPos)) break;
          if (isEmptySquare(board, newPos)) {
            moves.push(newPos);
          } else if (isEnemyPiece(board, newPos, piece.color)) {
            moves.push(newPos);
            break;
          } else {
            break;
          }
        }
      }
      break;
    }

    case 'king': {
      const kingMoves = [
        [-1, -1], [-1, 0], [-1, 1],
        [0, -1], [0, 1],
        [1, -1], [1, 0], [1, 1]
      ];
      for (const [dr, dc] of kingMoves) {
        const newPos = { row: row + dr, col: col + dc };
        if (isInBounds(newPos) && !isFriendlyPiece(board, newPos, piece.color)) {
          moves.push(newPos);
        }
      }
      break;
    }
  }

  return moves;
}

// Find king position
function findKing(board: (Piece | null)[][], color: PieceColor): Position | null {
  for (let row = 0; row < 8; row++) {
    for (let col = 0; col < 8; col++) {
      const piece = board[row][col];
      if (piece && piece.type === 'king' && piece.color === color) {
        return { row, col };
      }
    }
  }
  return null;
}

// Check if a position is under attack
function isSquareUnderAttack(board: (Piece | null)[][], pos: Position, byColor: PieceColor): boolean {
  for (let row = 0; row < 8; row++) {
    for (let col = 0; col < 8; col++) {
      const piece = board[row][col];
      if (piece && piece.color === byColor) {
        const moves = getRawMoves(board, { row, col }, piece, null);
        if (moves.some(m => m.row === pos.row && m.col === pos.col)) {
          return true;
        }
      }
    }
  }
  return false;
}

// Check if king is in check
export function isInCheck(board: (Piece | null)[][], color: PieceColor): boolean {
  const kingPos = findKing(board, color);
  if (!kingPos) return false;
  const enemyColor = color === 'white' ? 'black' : 'white';
  return isSquareUnderAttack(board, kingPos, enemyColor);
}

// Apply a move and return new board
function applyMove(board: (Piece | null)[][], move: Move): (Piece | null)[][] {
  const newBoard = board.map(row => [...row]);
  const piece = { ...move.piece, hasMoved: true };
  
  newBoard[move.from.row][move.from.col] = null;
  newBoard[move.to.row][move.to.col] = piece;
  
  // Handle en passant capture
  if (move.isEnPassant) {
    const capturedPawnRow = move.from.row;
    newBoard[capturedPawnRow][move.to.col] = null;
  }
  
  // Handle castling
  if (move.isCastling) {
    const isKingside = move.to.col > move.from.col;
    const rookFromCol = isKingside ? 7 : 0;
    const rookToCol = isKingside ? 5 : 3;
    const rook = newBoard[move.from.row][rookFromCol];
    if (rook) {
      newBoard[move.from.row][rookFromCol] = null;
      newBoard[move.from.row][rookToCol] = { ...rook, hasMoved: true };
    }
  }
  
  // Handle pawn promotion
  if (move.isPromotion && move.promoteTo) {
    newBoard[move.to.row][move.to.col] = { type: move.promoteTo, color: piece.color, hasMoved: true };
  }
  
  return newBoard;
}

// Get all legal moves for a piece (with check validation)
export function getLegalMoves(state: GameState, pos: Position): Position[] {
  const piece = getPieceAt(state.board, pos);
  if (!piece || piece.color !== state.currentTurn) return [];
  
  const rawMoves = getRawMoves(state.board, pos, piece, state.enPassantTarget);
  const legalMoves: Position[] = [];
  
  for (const moveTo of rawMoves) {
    const move: Move = {
      from: pos,
      to: moveTo,
      piece,
      captured: getPieceAt(state.board, moveTo) || undefined,
    };
    
    const newBoard = applyMove(state.board, move);
    if (!isInCheck(newBoard, piece.color)) {
      legalMoves.push(moveTo);
    }
  }
  
  // Add castling moves
  if (piece.type === 'king' && !piece.hasMoved && !state.isCheck) {
    const row = piece.color === 'white' ? 7 : 0;
    
    // Kingside castling
    const kingsideRook = getPieceAt(state.board, { row, col: 7 });
    if (kingsideRook && !kingsideRook.hasMoved) {
      const path = [{ row, col: 5 }, { row, col: 6 }];
      const enemyColor = piece.color === 'white' ? 'black' : 'white';
      const pathClear = path.every(p => isEmptySquare(state.board, p));
      const pathSafe = path.every(p => !isSquareUnderAttack(state.board, p, enemyColor));
      if (pathClear && pathSafe) {
        legalMoves.push({ row, col: 6 });
      }
    }
    
    // Queenside castling
    const queensideRook = getPieceAt(state.board, { row, col: 0 });
    if (queensideRook && !queensideRook.hasMoved) {
      const pathCheck = [{ row, col: 2 }, { row, col: 3 }];
      const pathClearSquares = [{ row, col: 1 }, { row, col: 2 }, { row, col: 3 }];
      const enemyColor = piece.color === 'white' ? 'black' : 'white';
      const pathClear = pathClearSquares.every(p => isEmptySquare(state.board, p));
      const pathSafe = pathCheck.every(p => !isSquareUnderAttack(state.board, p, enemyColor));
      if (pathClear && pathSafe) {
        legalMoves.push({ row, col: 2 });
      }
    }
  }
  
  return legalMoves;
}

// Check if player has any legal moves
function hasLegalMoves(state: GameState, color: PieceColor): boolean {
  for (let row = 0; row < 8; row++) {
    for (let col = 0; col < 8; col++) {
      const piece = state.board[row][col];
      if (piece && piece.color === color) {
        const tempState = { ...state, currentTurn: color };
        const moves = getLegalMoves(tempState, { row, col });
        if (moves.length > 0) return true;
      }
    }
  }
  return false;
}

// Make a move and return new game state
export function makeMove(state: GameState, from: Position, to: Position, promoteTo?: PieceType): GameState {
  const piece = getPieceAt(state.board, from);
  if (!piece) return state;
  
  const captured = getPieceAt(state.board, to);
  const isPawnPromotion = piece.type === 'pawn' && (to.row === 0 || to.row === 7);
  const isCastling = piece.type === 'king' && Math.abs(to.col - from.col) === 2;
  const isEnPassant = Boolean(piece.type === 'pawn' && 
    state.enPassantTarget && 
    to.row === state.enPassantTarget.row && 
    to.col === state.enPassantTarget.col);
  
  // Get actual captured piece for en passant
  let capturedPiece = captured;
  if (isEnPassant) {
    capturedPiece = getPieceAt(state.board, { row: from.row, col: to.col });
  }
  
  const move: Move = {
    from,
    to,
    piece,
    captured: capturedPiece || undefined,
    isPromotion: isPawnPromotion,
    promoteTo: isPawnPromotion ? (promoteTo || 'queen') : undefined,
    isCastling,
    isEnPassant,
  };
  
  const newBoard = applyMove(state.board, move);
  const nextTurn = state.currentTurn === 'white' ? 'black' : 'white';
  
  // Update captured pieces
  const newCapturedPieces = { ...state.capturedPieces };
  if (capturedPiece) {
    newCapturedPieces[capturedPiece.color] = [...newCapturedPieces[capturedPiece.color], capturedPiece];
  }
  
  // Set en passant target
  let enPassantTarget: Position | null = null;
  if (piece.type === 'pawn' && Math.abs(to.row - from.row) === 2) {
    enPassantTarget = { row: (from.row + to.row) / 2, col: from.col };
  }
  
  // Create new state
  const newState: GameState = {
    board: newBoard,
    currentTurn: nextTurn,
    moveHistory: [...state.moveHistory, move],
    capturedPieces: newCapturedPieces,
    isCheck: isInCheck(newBoard, nextTurn),
    isCheckmate: false,
    isStalemate: false,
    isDraw: false,
    winner: null,
    enPassantTarget,
  };
  
  // Check for checkmate or stalemate
  const canMove = hasLegalMoves(newState, nextTurn);
  if (!canMove) {
    if (newState.isCheck) {
      newState.isCheckmate = true;
      newState.winner = state.currentTurn;
    } else {
      newState.isStalemate = true;
      newState.isDraw = true;
    }
  }
  
  return newState;
}

// Get all pieces of a color
export function getPiecesOfColor(board: (Piece | null)[][], color: PieceColor): { piece: Piece; position: Position }[] {
  const pieces: { piece: Piece; position: Position }[] = [];
  for (let row = 0; row < 8; row++) {
    for (let col = 0; col < 8; col++) {
      const piece = board[row][col];
      if (piece && piece.color === color) {
        pieces.push({ piece, position: { row, col } });
      }
    }
  }
  return pieces;
}

// Encode move for blockchain
export function encodeMoveForChain(move: Move): string {
  const from = positionToNotation(move.from);
  const to = positionToNotation(move.to);
  const piece = move.piece.type.charAt(0).toUpperCase();
  const capture = move.captured ? 'x' : '-';
  const promo = move.promoteTo ? `=${move.promoteTo.charAt(0).toUpperCase()}` : '';
  return `${piece}${from}${capture}${to}${promo}`;
}
