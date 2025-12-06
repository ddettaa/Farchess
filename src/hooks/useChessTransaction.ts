/**
 * useChessTransaction Hook
 * Simple transaction hook - user only pays gas fee
 * Uses useSendTransaction with zero value
 */

"use client";

import { useCallback, useMemo, useState } from "react";
import { useAccount, useSendTransaction, useWaitForTransactionReceipt } from "wagmi";
import { base } from "wagmi/chains";
import { Move } from "../lib/chess";

// Receiver address for chess moves
const CHESS_RECEIVER_ADDRESS = "0xa9b27127216144159D9747C438598E85a9d26482" as `0x${string}`;

export interface TransactionState {
  isPending: boolean;
  isConfirming: boolean;
  isConfirmed: boolean;
  isError: boolean;
  error: Error | null;
  hash: `0x${string}` | null;
}

export function useChessTransaction() {
  const { isConnected, chainId } = useAccount();
  const [lastMove, setLastMove] = useState<string | null>(null);
  
  const {
    sendTransaction,
    data: hash,
    error,
    isError,
    isPending,
    reset,
  } = useSendTransaction();

  const { 
    isLoading: isConfirming, 
    isSuccess: isConfirmed 
  } = useWaitForTransactionReceipt({
    hash,
  });

  const isOnBase = useMemo(() => chainId === base.id, [chainId]);

  /**
   * Send a chess move transaction
   * Simple transfer with minimal value (1 wei) - user pays gas
   */
  const sendMoveTransaction = useCallback((move: Move) => {
    if (!isConnected) {
      console.warn("Wallet not connected");
      return;
    }

    // Reset any previous transaction state
    reset();

    // Create move notation for tracking
    const fromCol = String.fromCharCode(97 + move.from.col);
    const fromRow = 8 - move.from.row;
    const toCol = String.fromCharCode(97 + move.to.col);
    const toRow = 8 - move.to.row;
    const notation = `${fromCol}${fromRow}${toCol}${toRow}`;
    setLastMove(notation);
    
    // Send transaction with 1 wei value (minimal)
    // This ensures the transaction is valid on all networks
    sendTransaction({
      to: CHESS_RECEIVER_ADDRESS,
      value: 1n,
    });
  }, [isConnected, sendTransaction, reset]);

  /**
   * Send game completion transaction
   */
  const sendGameCompleteTransaction = useCallback((
    _winner: 'white' | 'black' | 'draw',
    _totalMoves: number
  ) => {
    if (!isConnected) {
      console.warn("Wallet not connected");
      return;
    }
    
    reset();
    
    sendTransaction({
      to: CHESS_RECEIVER_ADDRESS,
      value: 1n,
    });
  }, [isConnected, sendTransaction, reset]);

  return {
    isConnected,
    chainId,
    isOnBase,
    sendMoveTransaction,
    sendGameCompleteTransaction,
    lastMove,
    hash,
    error,
    isError,
    isPending,
    isConfirming,
    isConfirmed,
    reset,
    state: {
      isPending,
      isConfirming,
      isConfirmed,
      isError,
      error,
      hash: hash || null,
    } as TransactionState,
  };
}
