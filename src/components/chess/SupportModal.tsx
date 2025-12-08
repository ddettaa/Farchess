/**
 * SupportModal Component
 * DEX-style modal for support donations with token selection
 * Supports ETH, USDC, and DEGEN tokens on Base network
 */

"use client";

import { useState, useCallback } from "react";
import { useSendTransaction, useWaitForTransactionReceipt } from "wagmi";
import { parseUnits } from "viem";
import { 
  X, 
  Heart, 
  ChevronDown,
  Check,
  RefreshCw,
  AlertCircle
} from "lucide-react";

// Support address for donations
const SUPPORT_ADDRESS = "0xa9b27127216144159D9747C438598E85a9d26482" as `0x${string}`;

// Token configurations for Base network
interface Token {
  symbol: string;
  name: string;
  icon: string;
  decimals: number;
  isNative?: boolean;
  address?: `0x${string}`;
}

const TOKENS: Token[] = [
  { symbol: 'ETH', name: 'Ethereum', icon: '⟠', decimals: 18, isNative: true },
  { symbol: 'USDC', name: 'USD Coin', icon: '💵', decimals: 6, address: '0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913' },
  { symbol: 'DEGEN', name: 'Degen', icon: '🎩', decimals: 18, address: '0x4ed4E862860beD51a9570b96d89aF5E1B0Efefed' },
];

// Amount presets for each token
const AMOUNT_PRESETS: Record<string, string[]> = {
  'ETH': ['0.001', '0.005', '0.01', '0.05'],
  'USDC': ['1', '5', '10', '25'],
  'DEGEN': ['100', '500', '1000', '5000'],
};

interface SupportModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function SupportModal({ isOpen, onClose }: SupportModalProps) {
  const [selectedToken, setSelectedToken] = useState<Token>(TOKENS[0]);
  const [amount, setAmount] = useState<string>("0.001");
  const [showTokenList, setShowTokenList] = useState(false);
  
  const { 
    sendTransaction, 
    data: txHash,
    error: txError,
    isPending: isSending,
    reset 
  } = useSendTransaction();
  
  const { isLoading: isConfirming, isSuccess: isConfirmed } = useWaitForTransactionReceipt({
    hash: txHash,
  });

  // Handle amount change with validation
  const handleAmountChange = useCallback((value: string) => {
    // Only allow valid number input
    if (value === '' || /^\d*\.?\d*$/.test(value)) {
      setAmount(value);
    }
  }, []);

  // Handle token selection
  const handleSelectToken = useCallback((token: Token) => {
    setSelectedToken(token);
    setAmount(AMOUNT_PRESETS[token.symbol][0]); // Set default amount for token
    setShowTokenList(false);
  }, []);

  // Handle support transaction
  const handleSupport = useCallback(() => {
    const numAmount = parseFloat(amount);
    
    if (isNaN(numAmount) || numAmount <= 0) {
      alert('Please enter a valid positive amount');
      return;
    }

    if (selectedToken.isNative) {
      // Send native ETH
      const valueInWei = parseUnits(amount, selectedToken.decimals);
      sendTransaction({
        to: SUPPORT_ADDRESS,
        value: valueInWei,
      });
    } else {
      // For ERC20 tokens, we need to use transfer function
      // This requires encoding the transfer call
      const valueInTokenUnits = parseUnits(amount, selectedToken.decimals);
      
      // ERC20 transfer function signature: transfer(address,uint256)
      const transferSelector = '0xa9059cbb';
      const paddedAddress = SUPPORT_ADDRESS.slice(2).padStart(64, '0');
      const paddedAmount = valueInTokenUnits.toString(16).padStart(64, '0');
      const data = `${transferSelector}${paddedAddress}${paddedAmount}` as `0x${string}`;
      
      sendTransaction({
        to: selectedToken.address!,
        data: data,
      });
    }
  }, [amount, selectedToken, sendTransaction]);

  // Close and reset
  const handleClose = useCallback(() => {
    reset();
    onClose();
  }, [reset, onClose]);

  if (!isOpen) return null;

  const currentPresets = AMOUNT_PRESETS[selectedToken.symbol] || AMOUNT_PRESETS['ETH'];

  return (
    <div className="support-modal-overlay" onClick={handleClose}>
      <div className="support-modal animate-fadeIn" onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div className="support-modal-header">
          <h2 className="support-modal-title">
            <Heart size={20} className="inline mr-2" fill="#FF69B4" color="#FF69B4" />
            Support FarChess
          </h2>
          <button className="support-close-btn" onClick={handleClose}>
            <X size={20} />
          </button>
        </div>

        {/* Token Selector */}
        <div className="support-section">
          <label className="support-label">Select Token</label>
          <div className="token-selector-wrapper">
            <button 
              className="token-selector-btn"
              onClick={() => setShowTokenList(!showTokenList)}
            >
              <span className="token-icon">{selectedToken.icon}</span>
              <span className="token-symbol">{selectedToken.symbol}</span>
              <ChevronDown size={16} className={`token-chevron ${showTokenList ? 'rotate' : ''}`} />
            </button>
            
            {showTokenList && (
              <div className="token-list">
                {TOKENS.map((token) => (
                  <button
                    key={token.symbol}
                    className={`token-item ${selectedToken.symbol === token.symbol ? 'selected' : ''}`}
                    onClick={() => handleSelectToken(token)}
                  >
                    <span className="token-icon">{token.icon}</span>
                    <div className="token-info">
                      <span className="token-symbol">{token.symbol}</span>
                      <span className="token-name">{token.name}</span>
                    </div>
                    {selectedToken.symbol === token.symbol && (
                      <Check size={16} className="token-check" />
                    )}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Amount Input */}
        <div className="support-section">
          <label className="support-label">Amount</label>
          <div className="amount-input-wrapper">
            <input
              type="text"
              className="amount-input"
              value={amount}
              onChange={(e) => handleAmountChange(e.target.value)}
              placeholder="0.00"
            />
            <span className="amount-token">{selectedToken.symbol}</span>
          </div>
          
          {/* Preset Amounts */}
          <div className="amount-presets">
            {currentPresets.map((preset) => (
              <button
                key={preset}
                className={`preset-btn ${amount === preset ? 'active' : ''}`}
                onClick={() => setAmount(preset)}
              >
                {preset}
              </button>
            ))}
          </div>
        </div>

        {/* Transaction Status */}
        {txError && (
          <div className="support-error">
            <AlertCircle size={16} />
            <span>Transaction failed. Please try again.</span>
          </div>
        )}
        
        {txHash && (
          <div className={`support-status ${isConfirmed ? 'success' : 'pending'}`}>
            {isConfirming ? (
              <>
                <RefreshCw size={16} className="animate-spin" />
                <span>Confirming...</span>
              </>
            ) : isConfirmed ? (
              <>
                <Check size={16} />
                <span>Thank you for your support! 💖</span>
              </>
            ) : (
              <>
                <RefreshCw size={16} className="animate-spin" />
                <span>Processing...</span>
              </>
            )}
          </div>
        )}

        {/* Support Button */}
        <button
          className="confirm-support-btn"
          onClick={handleSupport}
          disabled={isSending || isConfirming}
        >
          {isSending ? (
            <>
              <RefreshCw size={18} className="animate-spin mr-2" />
              Sending...
            </>
          ) : (
            <>
              <Heart size={18} className="mr-2" />
              Send {amount} {selectedToken.symbol}
            </>
          )}
        </button>

        {/* Info Text */}
        <p className="support-info">
          Your support helps keep FarChess running! 🙏
        </p>
      </div>
    </div>
  );
}
