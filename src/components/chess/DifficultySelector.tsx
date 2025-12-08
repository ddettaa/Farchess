/**
 * DifficultySelector Component
 * Allows player to select AI difficulty level
 * Uses Lucide icons with CSS animations
 */

"use client";

import { useState } from "react";
import { useAccount, useConnect, useSwitchChain } from "wagmi";
import { base } from "wagmi/chains";
import { useMiniApp } from "@neynar/react";
import { Difficulty } from "../../lib/chessAI";
import { SupportModal } from "./SupportModal";
import { 
  Sprout, 
  Zap, 
  Flame, 
  BookOpen, 
  Heart, 
  Link, 
  AlertTriangle, 
  RefreshCw,
  ArrowLeft,
  Trophy,
  Share2,
  type LucideIcon
} from "lucide-react";

// Support address moved to SupportModal component

interface DifficultySelectorProps {
  onSelect: (difficulty: Difficulty) => void;
}

const difficulties: { level: Difficulty; title: string; Icon: LucideIcon; color: string }[] = [
  { level: 'easy', title: 'Easy', Icon: Sprout, color: '#10B981' },
  { level: 'medium', title: 'Medium', Icon: Zap, color: '#F59E0B' },
  { level: 'hard', title: 'Hard', Icon: Flame, color: '#EF4444' },
];

export function DifficultySelector({ onSelect }: DifficultySelectorProps) {
  const { isConnected, chainId } = useAccount();
  const { connect, connectors, isPending: isConnecting } = useConnect();
  const { switchChain, isPending: isSwitching } = useSwitchChain();
  const { context, actions } = useMiniApp();
  
  const [showTutorial, setShowTutorial] = useState(false);
  const [showSupportModal, setShowSupportModal] = useState(false);

  const isOnBase = chainId === base.id;

  // Handle wallet connection
  const handleConnect = () => {
    const connectorIndex = context ? 0 : 1;
    connect({ connector: connectors[connectorIndex] });
  };

  // Handle network switch
  const handleSwitchToBase = () => {
    switchChain({ chainId: base.id });
  };

  // Support modal is now handled by SupportModal component

  // Tutorial Modal
  if (showTutorial) {
    return (
      <div className="difficulty-selector">
        <div className="tutorial-modal animate-fadeIn">
          <h2 className="tutorial-title">
            <BookOpen size={24} className="inline mr-2 animate-bounce-subtle" />
            How to Play FarChess
          </h2>
          
          <div className="tutorial-content">
            {[
              "Connect your wallet and switch to Base network",
              "Select difficulty: Easy, Medium, or Hard",
              "You play as White (bottom). Click a piece to see valid moves",
              "Click a highlighted square to move. Confirm the transaction",
              "Your piece moves after transaction is confirmed on-chain",
            ].map((step, i) => (
              <div key={i} className="tutorial-step" style={{ animationDelay: `${i * 0.1}s` }}>
                <span className="step-num">{i + 1}</span>
                <p>{step}</p>
              </div>
            ))}
            <div className="tutorial-step">
              <span className="step-num">6</span>
              <p>Checkmate the AI to win! <Trophy size={16} className="inline text-yellow-500" /></p>
            </div>
          </div>
          
          <button className="back-button animate-hover-lift" onClick={() => setShowTutorial(false)}>
            <ArrowLeft size={16} className="inline mr-1" /> Back to Menu
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="difficulty-selector">
      <div className="selector-header animate-fadeIn">
        <h2 className="selector-title">♟️ FarChess</h2>
        <p className="selector-subtitle">On-chain chess on Base</p>
      </div>
      
      {!isConnected ? (
        <div className="wallet-connect-section animate-fadeIn">
          <div className="connect-prompt">
            <span className="connect-icon animate-pulse-slow">
              <Link size={32} className="text-blue-500" />
            </span>
            <p className="connect-text">Connect Wallet</p>
            <p className="connect-subtext">Required to play on-chain</p>
          </div>
          <button 
            className="connect-wallet-button animate-hover-lift"
            onClick={handleConnect}
            disabled={isConnecting}
          >
            {isConnecting ? (
              <RefreshCw size={16} className="inline mr-1 animate-spin" />
            ) : (
              <Link size={16} className="inline mr-1" />
            )}
            {isConnecting ? 'Connecting...' : 'Connect'}
          </button>
        </div>
      ) : !isOnBase ? (
        <div className="wallet-connect-section animate-fadeIn">
          <div className="connect-prompt">
            <span className="connect-icon animate-pulse-slow">
              <AlertTriangle size={32} className="text-yellow-500" />
            </span>
            <p className="connect-text">Switch to Base</p>
            <p className="connect-subtext">Chain ID: 8453</p>
          </div>
          <button 
            className="connect-wallet-button switch-network animate-hover-lift"
            onClick={handleSwitchToBase}
            disabled={isSwitching}
          >
            {isSwitching ? (
              <RefreshCw size={16} className="inline mr-1 animate-spin" />
            ) : (
              <RefreshCw size={16} className="inline mr-1" />
            )}
            {isSwitching ? 'Switching...' : 'Switch'}
          </button>
        </div>
      ) : (
        <>
          {/* Difficulty buttons - compact row */}
          <div className="difficulty-row">
            {difficulties.map(({ level, title, Icon, color }, index) => (
              <button
                key={level}
                className={`difficulty-btn ${level} animate-fadeIn animate-hover-lift`}
                style={{ animationDelay: `${index * 0.1}s` }}
                onClick={() => onSelect(level)}
              >
                <span className="btn-emoji animate-icon-hover">
                  <Icon size={28} color={color} strokeWidth={2.5} />
                </span>
                <span className="btn-title">{title}</span>
              </button>
            ))}
          </div>
          
          {/* Action buttons row */}
          <div className="action-buttons">
            <button 
              className="action-btn tutorial animate-hover-lift"
              onClick={() => setShowTutorial(true)}
            >
              <BookOpen size={16} className="inline mr-1" /> Tutorial
            </button>
            
            <button 
              className="action-btn share animate-hover-lift"
              onClick={() => {
                if (actions) {
                  actions.composeCast({
                    text: "♟️ Play on-chain chess with me on FarChess!\n\nEvery move is recorded on Base. Challenge the AI and prove your skills! 🏆",
                    embeds: ["https://farchess.vercel.app"],
                  });
                }
              }}
            >
              <Share2 size={16} className="inline mr-1" /> Share
            </button>
            
            <button 
              className="action-btn support animate-hover-lift"
              onClick={() => setShowSupportModal(true)}
            >
              <Heart size={16} className="inline mr-1" /> Support
            </button>
          </div>
          
          <div className="selector-footer animate-fadeIn">
            <p>✅ Base • Moves on-chain</p>
          </div>
          
          {/* Support Modal */}
          <SupportModal 
            isOpen={showSupportModal} 
            onClose={() => setShowSupportModal(false)} 
          />
        </>
      )}
    </div>
  );
}
