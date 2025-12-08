"use client";

import { useState, useEffect } from "react";
import { useMiniApp } from "@neynar/react";
import { ChessGame } from "~/components/chess";
import { Plus, X } from "lucide-react";

const STORAGE_KEY = "farchess_mini_app_added";

/**
 * App component - Simplified to show only FarChess game
 * Removed tabs, header, and footer for clean chess-only experience
 */
export default function App() {
  const { isSDKLoaded, context, actions, added } = useMiniApp();
  const [showAddPrompt, setShowAddPrompt] = useState(false);

  // Check if user has seen the add mini app prompt
  useEffect(() => {
    if (isSDKLoaded && !added) {
      const hasSeenPrompt = localStorage.getItem(STORAGE_KEY);
      if (!hasSeenPrompt) {
        // Small delay to let the app load
        setTimeout(() => setShowAddPrompt(true), 1000);
      }
    }
  }, [isSDKLoaded, added]);

  // Handle add mini app
  const handleAddMiniApp = () => {
    actions.addMiniApp();
    localStorage.setItem(STORAGE_KEY, "true");
    setShowAddPrompt(false);
  };

  // Handle dismiss
  const handleDismiss = () => {
    localStorage.setItem(STORAGE_KEY, "true");
    setShowAddPrompt(false);
  };

  // Wait for SDK to load
  if (!isSDKLoaded) {
    return (
      <div className="flex items-center justify-center h-screen bg-white">
        <div className="text-center">
          <div className="spinner h-8 w-8 mx-auto mb-4"></div>
          <p className="font-bold text-black">Loading FarChess...</p>
        </div>
      </div>
    );
  }

  return (
    <div
      className="min-h-screen bg-white"
      style={{
        paddingTop: context?.client.safeAreaInsets?.top ?? 0,
        paddingBottom: context?.client.safeAreaInsets?.bottom ?? 0,
        paddingLeft: context?.client.safeAreaInsets?.left ?? 0,
        paddingRight: context?.client.safeAreaInsets?.right ?? 0,
      }}
    >
      {/* Add Mini App Prompt Modal */}
      {showAddPrompt && (
        <div className="add-app-overlay" onClick={handleDismiss}>
          <div className="add-app-modal animate-fadeIn" onClick={(e) => e.stopPropagation()}>
            <button className="add-app-close" onClick={handleDismiss}>
              <X size={18} />
            </button>
            <div className="add-app-icon">♟️</div>
            <h2 className="add-app-title">Add FarChess</h2>
            <p className="add-app-desc">Add FarChess to your Farcaster client for quick access!</p>
            <button className="add-app-button" onClick={handleAddMiniApp}>
              <Plus size={18} className="mr-2" />
              Add to Farcaster
            </button>
            <button className="add-app-skip" onClick={handleDismiss}>
              Maybe later
            </button>
          </div>
        </div>
      )}

      {/* Chess Game Only - No header, no tabs, no footer */}
      <div className="chess-container py-4">
        <ChessGame enableBlockchain={true} />
      </div>
    </div>
  );
}
