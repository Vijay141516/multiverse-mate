import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';

interface GameOverOverlayProps {
  isOpen: boolean;
  winner: string | null; // "White", "Black", or null
  didIWin: boolean;
  isCheckmate: boolean;
  isResigned: boolean;
  isStalemate: boolean;
  isDraw: boolean;
  animationsEnabled: boolean;
  onRematch: () => void;
  onReview: () => void;
  onExit: () => void;
  rematchText?: string;
  isAnalyzing: boolean;
  analysisProgress: number;
  hasAnalysis: boolean;
  onAnalyze: () => void;
  modeLabel?: string;
}

export default function GameOverOverlay({
  isOpen,
  winner,
  didIWin,
  isCheckmate,
  isResigned,
  isStalemate,
  isDraw,
  animationsEnabled,
  onRematch,
  onReview,
  onExit,
  rematchText = "Rematch",
  isAnalyzing,
  analysisProgress,
  hasAnalysis,
  onAnalyze,
  modeLabel = "Multiverse Mate"
}: GameOverOverlayProps) {
  if (!isOpen) return null;

  const isWin = !!winner && didIWin;
  const isLoss = !!winner && !didIWin;
  const isNeutral = !winner;

  const getJapaneseTitle = () => {
    if (isResigned) return '降参';
    if (isCheckmate) return 'チェックメイト';
    if (isStalemate || isDraw) return '引き分け';
    return '試合終了';
  };

  const getMainTitle = () => {
    if (isWin) return 'VICTORY';
    if (isLoss) return 'DEFEAT';
    if (isStalemate) return 'STALEMATE';
    if (isDraw) return 'DRAW';
    return 'GAME OVER';
  };

  const getSubTitle = () => {
    if (winner) {
      const reason = isResigned ? 'Resignation' : 'Checkmate';
      return isWin ? `YOU WON BY ${reason.toUpperCase()}` : `${winner.toUpperCase()} WON BY ${reason.toUpperCase()}`;
    }
    if (isStalemate) return 'STALEMATE DRAW';
    return 'BATTLE DRAWN';
  };

  const themeColor = isWin ? 'blue' : isLoss ? 'red' : 'white';
  const accentGradient = isWin 
    ? 'from-blue-600 via-white to-blue-600 drop-shadow-[0_0_40px_rgba(37,99,235,0.8)]'
    : isLoss 
      ? 'from-red-600 via-white to-red-600 drop-shadow-[0_0_40px_rgba(220,38,38,0.8)]'
      : 'from-white/40 via-white to-white/40 drop-shadow-[0_0_40px_rgba(255,255,255,0.3)]';

  const bgGradient = isWin
    ? 'radial-gradient(circle, rgba(0,0,0,0.9) 0%, rgba(10,10,30,0.98) 100%)'
    : isLoss
      ? 'radial-gradient(circle, rgba(0,0,0,0.85) 0%, rgba(20,0,0,0.98) 100%)'
      : 'radial-gradient(circle, rgba(0,0,0,0.9) 0%, rgba(15,15,15,0.98) 100%)';

  return (
    <AnimatePresence>
      <motion.div
        initial={animationsEnabled ? { opacity: 0 } : { opacity: 1 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-[100] flex items-center justify-center overflow-hidden"
        style={{
          background: bgGradient,
          backdropFilter: 'blur(12px)'
        }}
      >
        {/* Dramatic Slash Effect */}
        {animationsEnabled && !isNeutral && (
          <motion.div
            initial={{ scale: 0, opacity: 0, rotate: -15, x: '-100%' }}
            animate={{ scale: 2, opacity: 0.15, rotate: -15, x: '0%' }}
            transition={{ duration: 0.3, ease: "easeOut" }}
            className={`absolute inset-0 ${isWin ? 'bg-blue-500' : 'bg-red-500'} pointer-events-none`}
            style={{ clipPath: 'polygon(0 48%, 100% 40%, 100% 60%, 0 52%)' }}
          />
        )}

        <div className="text-center relative z-10 w-full">
          {/* Background Japanese Text */}
          {animationsEnabled && (
            <motion.div
              initial={{ scale: 1.5, opacity: 0 }}
              animate={{ scale: 1, opacity: 0.08 }}
              transition={{ duration: 0.4 }}
              className={`absolute inset-0 flex items-center justify-center text-[10rem] md:text-[16rem] font-black ${isWin ? 'text-blue-500' : isLoss ? 'text-red-500' : 'text-white'} tracking-tighter pointer-events-none`}
              style={{ top: '50%', left: '50%', transform: 'translate(-50%, -50%)', whiteSpace: 'nowrap', zIndex: -1 }}
            >
              {getJapaneseTitle()}
            </motion.div>
          )}

          <motion.h1
            initial={animationsEnabled ? { x: -100, opacity: 0 } : { opacity: 1 }}
            animate={{ x: 0, opacity: 1 }}
            transition={{ type: 'spring', damping: 15, stiffness: 100 }}
            className={`text-7xl md:text-9xl font-black text-transparent bg-clip-text bg-gradient-to-r ${accentGradient} uppercase tracking-tight`}
          >
            {getMainTitle()}
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4, type: 'spring' }}
            className="text-white text-3xl md:text-5xl mt-6 font-black tracking-[0.2em] drop-shadow-[0_0_20px_rgba(255,255,255,0.5)] uppercase"
          >
            {getSubTitle()}
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 50 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.8, type: 'spring', damping: 25 }}
            className="mt-20 flex flex-col items-center gap-10 pointer-events-auto"
          >
            {/* Status Bar */}
            <div className="flex items-center gap-4 text-white/20">
              <div className="h-[1px] w-12 bg-current" />
              <span className="text-[10px] font-black uppercase tracking-[0.5em]">Game Concluded</span>
              <div className="h-[1px] w-12 bg-current" />
            </div>

            {/* Main Action Group */}
            <div className="flex flex-col items-center gap-6">
              {!hasAnalysis && (
                <button
                  onClick={onAnalyze}
                  disabled={isAnalyzing}
                  className="group relative px-12 py-4 rounded-full bg-white text-black font-black uppercase tracking-[0.2em] text-xs hover:scale-110 active:scale-95 transition-all shadow-[0_0_40px_rgba(255,255,255,0.3)] disabled:opacity-50"
                >
                  <span className="relative z-10 flex items-center gap-2">
                    {isAnalyzing ? (
                      <span className="animate-spin text-lg">◌</span>
                    ) : (
                      <span className="text-lg">⚡</span>
                    )}
                    {isAnalyzing ? `Analyzing ${analysisProgress}%` : 'Deep Analysis'}
                  </span>
                </button>
              )}

              {/* Navigation Dock */}
              <div className="flex flex-wrap justify-center items-center gap-3 p-2 rounded-full bg-black/40 backdrop-blur-md border border-white/5 shadow-2xl">
                <button
                  onClick={onRematch}
                  className={`px-8 py-3 rounded-full ${isWin ? 'bg-blue-600' : isLoss ? 'bg-red-600' : 'bg-purple-600'} text-white font-black uppercase tracking-[0.1em] text-[10px] shadow-lg hover:brightness-110 active:scale-95 transition-all`}
                >
                  {rematchText}
                </button>
                <button
                  onClick={onReview}
                  className="px-6 py-3 rounded-full bg-white/5 hover:bg-white/10 text-white font-bold uppercase tracking-[0.1em] text-[10px] transition-all"
                >
                  Review
                </button>
                <button
                  onClick={onExit}
                  className="px-6 py-3 rounded-full bg-white/5 hover:bg-white/10 text-white/40 font-bold uppercase tracking-[0.1em] text-[10px] transition-all"
                >
                  Exit
                </button>
              </div>
            </div>

            {/* Bottom Accent */}
            <div className="flex flex-col items-center gap-2 opacity-20">
              <span className="text-[8px] font-bold uppercase tracking-[0.8em] text-white">{modeLabel}</span>
              <div className="w-1 h-1 rounded-full bg-white animate-bounce" />
            </div>
          </motion.div>
        </div>
      </motion.div>
    </AnimatePresence>
  );
}
