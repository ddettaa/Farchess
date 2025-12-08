/**
 * ChessGame Component
 * Main game container with state management and game flow
 * Transaction must be confirmed BEFORE piece moves
 */

"use client";

import { useState, useCallback, useEffect, useMemo, useRef } from "react";
import { 
  GameState, 
  Position, 
  Move,
  createInitialGameState, 
  getLegalMoves, 
  makeMove 
} from "../../lib/chess";
import { Difficulty, getAIMove, getAIThinkingDelay } from "../../lib/chessAI";
import { useChessTransaction } from "../../hooks/useChessTransaction";
import { ChessBoard } from "./ChessBoard";
import { DifficultySelector } from "./DifficultySelector";
import { Volume2, VolumeX } from "lucide-react";

type GamePhase = 'menu' | 'playing' | 'gameOver';

interface PendingMove {
  from: Position;
  to: Position;
  newState: GameState;
  move: Move;
}

interface ChessGameProps {
  enableBlockchain?: boolean;
}

export function ChessGame({ enableBlockchain = true }: ChessGameProps) {
  // Game state
  const [gamePhase, setGamePhase] = useState<GamePhase>('menu');
  const [difficulty, setDifficulty] = useState<Difficulty>('medium');
  const [gameState, setGameState] = useState<GameState>(createInitialGameState());
  const [selectedSquare, setSelectedSquare] = useState<Position | null>(null);
  const [legalMoves, setLegalMoves] = useState<Position[]>([]);
  const [lastMove, setLastMove] = useState<{ from: Position; to: Position } | null>(null);
  const [isAIThinking, setIsAIThinking] = useState(false);
  const [message, setMessage] = useState<string>('');
  
  // Pending move - waiting for transaction confirmation
  const [pendingMove, setPendingMove] = useState<PendingMove | null>(null);
  const [isWaitingTx, setIsWaitingTx] = useState(false);
  
  // Blockchain (following SendEth.tsx pattern)
  const { 
    isConnected, 
    sendMoveTransaction, 
    sendGameCompleteTransaction,
    isPending,
    isConfirming,
    isConfirmed,
    isError,
    reset: resetTransaction,
  } = useChessTransaction();

  const playerColor = 'white'; // Player always plays white
  const isPlayerTurn = gameState.currentTurn === playerColor;

  // Track previous txState to detect confirmation
  const prevTxConfirmed = useRef(false);
  
  // Audio ref for background music
  const audioRef = useRef<HTMLAudioElement | null>(null);
  
  // Mute state
  const [isMuted, setIsMuted] = useState(false);

  // Initialize and control background music
  useEffect(() => {
    // Create audio element if not exists
    if (!audioRef.current) {
      audioRef.current = new Audio('/Gymnopédie No. 1 [TubeRipper.cc].m4a');
      audioRef.current.loop = true;
      audioRef.current.volume = 0.3;
    }

    // Play music when game starts, pause when back to menu
    if (gamePhase === 'playing' || gamePhase === 'gameOver') {
      audioRef.current.play().catch((e) => {
        // Browser may block autoplay, that's okay
        console.log('Audio autoplay blocked:', e);
      });
    } else {
      audioRef.current.pause();
    }

    // Cleanup on unmount
    return () => {
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current = null;
      }
    };
  }, [gamePhase]);

  // Handle mute toggle
  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.muted = isMuted;
    }
  }, [isMuted]);

  // Toggle mute function
  const toggleMute = useCallback(() => {
    setIsMuted(prev => !prev);
  }, []);

  // When transaction is confirmed, apply the pending move
  useEffect(() => {
    if (isConfirmed && !prevTxConfirmed.current && pendingMove) {
      // Transaction confirmed! Apply the move
      setGameState(pendingMove.newState);
      setLastMove({ from: pendingMove.from, to: pendingMove.to });
      setPendingMove(null);
      setIsWaitingTx(false);
      setMessage('Move recorded on-chain ✅');
      
      // Clear message after 2 seconds
      setTimeout(() => {
        setMessage('');
      }, 2000);
    }
    prevTxConfirmed.current = isConfirmed;
  }, [isConfirmed, pendingMove]);

  // Handle transaction error
  useEffect(() => {
    if (isError && pendingMove) {
      setMessage('❌ Transaction failed. Move cancelled.');
      setPendingMove(null);
      setIsWaitingTx(false);
    }
  }, [isError, pendingMove]);

  // Reset selection when turn changes
  useEffect(() => {
    setSelectedSquare(null);
    setLegalMoves([]);
  }, [gameState.currentTurn]);

  // AI move handler - NO transaction for AI moves
  useEffect(() => {
    if (
      gamePhase === 'playing' &&
      !isPlayerTurn &&
      !gameState.isCheckmate &&
      !gameState.isDraw &&
      !isAIThinking &&
      !isWaitingTx
    ) {
      setIsAIThinking(true);
      setMessage('AI is thinking...');
      
      const delay = getAIThinkingDelay(difficulty);
      
      setTimeout(() => {
        const aiMove = getAIMove(gameState, difficulty);
        if (aiMove) {
          const newState = makeMove(gameState, aiMove.from, aiMove.to);
          setLastMove(aiMove);
          setGameState(newState);
          // AI moves don't require transaction - only player moves do
          setMessage('');
        }
        setIsAIThinking(false);
      }, delay);
    }
  }, [gameState, gamePhase, isPlayerTurn, isAIThinking, isWaitingTx, difficulty]);

  // Game over detection
  useEffect(() => {
    if (gameState.isCheckmate || gameState.isDraw) {
      setGamePhase('gameOver');
      
      // Send game complete transaction
      if (enableBlockchain && isConnected) {
        const winner = gameState.winner || 'draw';
        sendGameCompleteTransaction(winner, gameState.moveHistory.length);
      }
    }
  }, [gameState.isCheckmate, gameState.isDraw, gameState.winner, gameState.moveHistory.length, enableBlockchain, isConnected, sendGameCompleteTransaction]);

  // Update message for check
  useEffect(() => {
    if (gameState.isCheck && isPlayerTurn && !isAIThinking && !isWaitingTx) {
      setMessage('You are in check!');
    } else if (!isAIThinking && !isWaitingTx && gamePhase === 'playing' && !pendingMove) {
      setMessage(isPlayerTurn ? 'Your turn' : '');
    }
  }, [gameState.isCheck, isPlayerTurn, isAIThinking, isWaitingTx, gamePhase, pendingMove]);

  // Handle difficulty selection
  const handleDifficultySelect = useCallback((diff: Difficulty) => {
    setDifficulty(diff);
    setGameState(createInitialGameState());
    setGamePhase('playing');
    setMessage('Your turn - you play as White');
    setLastMove(null);
    setPendingMove(null);
    setIsWaitingTx(false);
  }, []);

  // Handle square click - NOW WAITS FOR TRANSACTION
  const handleSquareClick = useCallback((pos: Position) => {
    if (!isPlayerTurn || isAIThinking || gamePhase !== 'playing' || isWaitingTx) return;

    const clickedPiece = gameState.board[pos.row][pos.col];

    // If a piece is selected and clicking on a legal move, initiate the move
    if (selectedSquare && legalMoves.some(m => m.row === pos.row && m.col === pos.col)) {
      // Calculate new state but don't apply yet
      const newState = makeMove(gameState, selectedSquare, pos);
      const move = newState.moveHistory[newState.moveHistory.length - 1];
      
      setSelectedSquare(null);
      setLegalMoves([]);
      
      if (enableBlockchain && isConnected) {
        // Set pending move and wait for transaction
        setPendingMove({
          from: selectedSquare,
          to: pos,
          newState,
          move
        });
        setIsWaitingTx(true);
        setMessage('⏳ Confirm transaction in wallet...');
        
        // Send transaction, move will be applied when confirmed
        sendMoveTransaction(move);
      } else {
        // No blockchain, apply move immediately
        setLastMove({ from: selectedSquare, to: pos });
        setGameState(newState);
      }
      
      return;
    }

    // If clicking on own piece, select it
    if (clickedPiece && clickedPiece.color === playerColor) {
      setSelectedSquare(pos);
      setLegalMoves(getLegalMoves(gameState, pos));
      return;
    }

    // Otherwise, deselect
    setSelectedSquare(null);
    setLegalMoves([]);
  }, [gameState, selectedSquare, legalMoves, isPlayerTurn, isAIThinking, gamePhase, playerColor, enableBlockchain, isConnected, sendMoveTransaction, isWaitingTx]);

  // Cancel pending move
  const handleCancelMove = useCallback(() => {
    setPendingMove(null);
    setIsWaitingTx(false);
    setMessage('Move cancelled');
    resetTransaction();
  }, [resetTransaction]);

  // Handle new game
  const handleNewGame = useCallback(() => {
    setGamePhase('menu');
    setGameState(createInitialGameState());
    setSelectedSquare(null);
    setLegalMoves([]);
    setLastMove(null);
    setMessage('');
    setPendingMove(null);
    setIsWaitingTx(false);
  }, []);

  // Captured pieces display
  const capturedByPlayer = gameState.capturedPieces.black;
  const capturedByAI = gameState.capturedPieces.white;

  // Game result message
  const gameResultMessage = useMemo(() => {
    if (gameState.isCheckmate) {
      return gameState.winner === playerColor 
        ? '🎉 Checkmate! You Win!' 
        : '😔 Checkmate! AI Wins!';
    }
    if (gameState.isStalemate) return '🤝 Stalemate! Draw!';
    if (gameState.isDraw) return '🤝 Draw!';
    return '';
  }, [gameState.isCheckmate, gameState.isStalemate, gameState.isDraw, gameState.winner, playerColor]);

  // Render menu
  if (gamePhase === 'menu') {
    return <DifficultySelector onSelect={handleDifficultySelect} />;
  }

  return (
    <div className="chess-game">
      {/* Game info header */}
      <div className="game-header">
        <div className="difficulty-badge">{difficulty.toUpperCase()}</div>
        <div className="move-count">Move {Math.ceil(gameState.moveHistory.length / 2)}</div>
        <button 
          className="mute-button"
          onClick={toggleMute}
          title={isMuted ? 'Unmute' : 'Mute'}
        >
          {isMuted ? <VolumeX size={20} /> : <Volume2 size={20} />}
        </button>
        {!isConnected && enableBlockchain && (
          <div className="wallet-warning">⚠️ Connect wallet to record moves</div>
        )}
      </div>

      {/* Message bar */}
      {message && <div className="game-message">{message}</div>}

      {/* Transaction status */}
      {isPending && (
        <div className="tx-status pending">📝 Waiting for wallet approval...</div>
      )}
      {isConfirming && (
        <div className="tx-status confirming">⏳ Confirming transaction...</div>
      )}
      
      {/* Cancel button when waiting for transaction */}
      {isWaitingTx && (
        <button className="cancel-tx-button" onClick={handleCancelMove}>
          ✕ Cancel Move
        </button>
      )}

      {/* Captured pieces - AI's captures (top) */}
      <div className="captured-pieces ai">
        {capturedByAI.map((p, i) => (
          <span key={i} className="captured-piece">{p.type === 'pawn' ? '♙' : p.type === 'knight' ? '♘' : p.type === 'bishop' ? '♗' : p.type === 'rook' ? '♖' : p.type === 'queen' ? '♕' : ''}</span>
        ))}
      </div>

      {/* Chess board */}
      <ChessBoard
        gameState={gameState}
        selectedSquare={selectedSquare}
        legalMoves={legalMoves}
        lastMove={lastMove}
        onSquareClick={handleSquareClick}
        disabled={!isPlayerTurn || isAIThinking || gamePhase === 'gameOver' || isWaitingTx}
        playerColor={playerColor}
      />

      {/* Captured pieces - Player's captures (bottom) */}
      <div className="captured-pieces player">
        {capturedByPlayer.map((p, i) => (
          <span key={i} className="captured-piece">{p.type === 'pawn' ? '♟' : p.type === 'knight' ? '♞' : p.type === 'bishop' ? '♝' : p.type === 'rook' ? '♜' : p.type === 'queen' ? '♛' : ''}</span>
        ))}
      </div>

      {/* Game over overlay */}
      {gamePhase === 'gameOver' && (
        <div className="game-over-overlay">
          <div className="game-over-modal">
            <h2 className="game-over-title">{gameResultMessage}</h2>
            <p className="game-over-stats">
              Total moves: {gameState.moveHistory.length}
            </p>
            {isConfirmed && (
              <p className="game-over-chain">✅ Game recorded on Base blockchain</p>
            )}
            <button className="new-game-button" onClick={handleNewGame}>
              Play Again
            </button>
          </div>
        </div>
      )}

      {/* New game button (during play) */}
      {gamePhase === 'playing' && !isWaitingTx && (
        <button className="resign-button" onClick={handleNewGame}>
          ← New Game
        </button>
      )}
    </div>
  );
}
