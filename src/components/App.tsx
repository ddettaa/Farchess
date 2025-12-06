"use client";

import { useMiniApp } from "@neynar/react";
import { ChessGame } from "~/components/chess";

/**
 * App component - Simplified to show only FarChess game
 * Removed tabs, header, and footer for clean chess-only experience
 */
export default function App() {
  const { isSDKLoaded, context } = useMiniApp();

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
      {/* Chess Game Only - No header, no tabs, no footer */}
      <div className="chess-container py-4">
        <ChessGame enableBlockchain={true} />
      </div>
    </div>
  );
}
