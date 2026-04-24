import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Board, { BoardTheme } from '../components/Board';
import PlayerInfo from '../components/PlayerInfo';
import MoveHistory from '../components/MoveHistory';
import { useChessGame, GameMode, PlayerMode } from '../hooks/useChessGame';
import { Color } from '../lib/chess';
import { ABILITY_DESCRIPTIONS, CHARACTER_NAMES } from '../lib/sprites';
import AbilityEffect from '../components/AbilityEffect';

interface GamePageProps {
  mode: GameMode;
  playerMode: PlayerMode;
  playerColor: Color;
  playerName: string;
  boardTheme: BoardTheme;
  onBack: () => void;
}

const RANK_AURA: Record<string, string> = {
  S: 'rgba(234,179,8,0.15)',
  A: 'rgba(168,85,247,0.12)',
  B: 'rgba(59,130,246,0.10)',
  C: 'rgba(6,182,212,0.08)',
  D: 'transparent',
};

export default function GamePage({ mode, playerMode, playerColor, playerName, boardTheme, onBack }: GamePageProps) {
  const {
    gameState, selectedPos, legalMoves, lastMove, isAiThinking, captureEffect,
    materialScore, whiteRank, blackRank, handleSquareClick, resetGame,
    resignGame, whiteTime, blackTime, isResigned, resignedColor, clearCaptureEffect,
    premove, premovesEnabled, togglePremoves
  } = useChessGame({ mode, playerMode, playerColor });

  const [showSidebar, setShowSidebar] = useState(false);

  const aiColor: Color = playerColor === 'white' ? 'black' : 'white';
  const isFlipped = playerColor === 'black';

  const dominantColor = materialScore.advantage > 0 ? 'white' : materialScore.advantage < 0 ? 'black' : null;
  const dominantRank  = dominantColor === 'white' ? whiteRank : blackRank;
  const auraColor     = dominantColor ? RANK_AURA[dominantRank] : 'transparent';

  const topColor: Color    = isFlipped ? playerColor : aiColor;
  const bottomColor: Color = isFlipped ? aiColor : playerColor;

  const topName = playerMode === 'local' ? 'Player 2' : (playerMode === 'online' ? 'Opponent' : 'AI Bot');
  const bottomName = playerMode === 'local' ? 'Player 1' : playerName;

  const getRank     = (c: Color) => c === 'white' ? whiteRank : blackRank;
  const getScore    = (c: Color) => c === 'white' ? materialScore.white : materialScore.black;
  const getCaptured = (c: Color) => c === 'white' ? gameState.capturedByWhite : gameState.capturedByBlack;
  const getTime     = (c: Color) => c === 'white' ? whiteTime : blackTime;

  const gameOver = gameState.isCheckmate || gameState.isStalemate || gameState.isDraw || isResigned;
  const winner   = gameState.isCheckmate
    ? (gameState.currentTurn === 'white' ? 'Black' : 'White')
    : isResigned ? (resignedColor === 'white' ? 'Black' : 'White')
    : null;
    
  const didIWin = winner?.toLowerCase() === playerColor.toLowerCase();

  const SidebarContent = () => (
    <>
      {gameOver && (
        <div className="mx-3 mt-3 rounded-xl p-3 text-center border flex-shrink-0"
          style={{ background: 'rgba(255,255,255,0.03)', borderColor: 'rgba(255,255,255,0.08)' }}>
          {winner ? (
            <>
              <div className="text-2xl mb-1">👑</div>
              <p className="text-white font-bold text-sm">{winner} wins!</p>
              <p className="text-white/40 text-[10px] mt-0.5">
                {isResigned ? 'Resignation' : 'Checkmate'}
              </p>
            </>
          ) : (
            <>
              <div className="text-2xl mb-1">🤝</div>
              <p className="text-white font-bold text-sm">Draw</p>
              <p className="text-white/40 text-[10px] mt-0.5">
                {gameState.isStalemate ? 'Stalemate' : '50-move rule'}
              </p>
            </>
          )}
          <div className="flex flex-col gap-2 mt-3">
            <button
              onClick={resetGame}
              className="w-full py-2 rounded-lg text-xs font-bold text-white transition-transform hover:scale-[1.02]"
              style={{ background: 'rgba(168,85,247,0.5)' }}
            >
              Play Again
            </button>
            <button
              onClick={onBack}
              className="w-full py-2 rounded-lg text-xs font-bold text-white/60 border border-white/10 hover:bg-white/5 transition-colors"
            >
              Back to Lobby
            </button>
          </div>
        </div>
      )}

      {!gameOver && (
        <div className="px-3 py-3 border-b border-white/5 flex flex-col gap-2">
           <button 
             onClick={() => resignGame(playerColor)}
             className="w-full py-2 rounded-lg text-[11px] font-black uppercase tracking-wider text-red-400/80 border border-red-500/20 hover:bg-red-500/10 transition-colors"
           >
             🏳 Resign
           </button>
           <button 
             onClick={togglePremoves}
             className={`w-full py-2 rounded-lg text-[11px] font-black uppercase tracking-wider transition-colors border ${
               premovesEnabled 
                 ? 'text-green-400/80 border-green-500/20 hover:bg-green-500/10' 
                 : 'text-white/40 border-white/10 hover:bg-white/5'
             }`}
           >
             {premovesEnabled ? '⚡ Premoves: ON' : '⚡ Premoves: OFF'}
           </button>
        </div>
      )}

      {mode === 'battle' && (
        <div className="px-3 py-2 border-b border-white/5 flex-shrink-0">
          <p className="text-[9px] font-bold text-white/25 uppercase tracking-widest mb-2">Abilities</p>
          <div className="space-y-1">
            {(['pawn', 'knight', 'bishop', 'rook', 'queen', 'king'] as const).map(type => {
              const a = ABILITY_DESCRIPTIONS[type];
              return (
                <div key={type} className="px-2 py-1.5 rounded-lg"
                  style={{ background: 'rgba(255,255,255,0.02)', border: `1px solid ${a.color}20` }}>
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] font-semibold" style={{ color: a.color }}>
                      {CHARACTER_NAMES[type]}
                    </span>
                    <span className="text-[9px] text-white/25 uppercase">{type}</span>
                  </div>
                  <p className="text-[10px] text-white/35 mt-0.5 leading-relaxed">
                    {a.name}
                  </p>
                </div>
              );
            })}
          </div>
        </div>
      )}

      <div className="flex-1 overflow-hidden" style={{ minHeight: 0 }}>
        <MoveHistory moves={gameState.moveHistory} />
      </div>

      <div className="px-4 py-3 border-t border-white/5 flex-shrink-0">
        <div className="grid grid-cols-2 gap-2 text-center mb-2">
          <div>
            <p className="text-[9px] text-white/20 uppercase tracking-wider">White</p>
            <p className="text-sm font-bold text-white/60">+{materialScore.white}</p>
          </div>
          <div>
            <p className="text-[9px] text-white/20 uppercase tracking-wider">Black</p>
            <p className="text-sm font-bold text-white/60">+{materialScore.black}</p>
          </div>
        </div>
        <div className="flex justify-center">
          <span className="text-[10px] text-white/20">
            Move {Math.ceil(gameState.moveHistory.length / 2)} ·{' '}
            <span className={gameState.currentTurn === 'white' ? 'text-white/40' : 'text-purple-400/60'}>
              {gameState.currentTurn === 'white' ? 'White' : 'Black'} to move
            </span>
          </span>
        </div>
      </div>
    </>
  );

  return (
    <div className="h-[100dvh] w-full flex flex-col md:flex-row overflow-hidden"
      style={{ background: '#0B0F1A' }}>

      {/* ── MOBILE: top action bar ── */}
      <div className="flex md:hidden items-center justify-between px-3 py-2 border-b flex-shrink-0"
        style={{ borderColor: 'rgba(255,255,255,0.06)' }}>
        <button onClick={onBack}
          className="flex items-center gap-1.5 text-white/50 hover:text-white text-sm font-semibold transition-colors">
          ← Back
        </button>
        <div className="flex items-center gap-2">
          <span className="text-[10px] font-bold uppercase tracking-widest px-2 py-0.5 rounded"
            style={{
              background: mode === 'battle' ? 'rgba(168,85,247,0.2)' : 'rgba(255,255,255,0.05)',
              color: mode === 'battle' ? '#a855f7' : 'rgba(255,255,255,0.35)',
            }}>
            {mode}
          </span>
          {!gameOver && (
            <button onClick={() => resignGame(playerColor)}
              className="text-red-400/60 hover:text-red-400 text-xs font-bold transition-colors px-2">
              Resign
            </button>
          )}
          <button onClick={resetGame}
            className="text-white/40 hover:text-white text-base font-semibold transition-colors px-1">
            ↺
          </button>
          <button
            onClick={() => setShowSidebar(s => !s)}
            className="text-white/40 hover:text-white text-sm font-semibold transition-colors px-1"
          >
            {showSidebar ? '✕' : '☰'}
          </button>
        </div>
      </div>

      {/* ── MAIN BOARD COLUMN ── */}
      <div className="flex-1 flex flex-col overflow-hidden relative" style={{ minWidth: 0 }}>
        {/* Rank aura bg */}
        <div className="absolute inset-0 pointer-events-none transition-all duration-700"
          style={{
            background: dominantColor
              ? `radial-gradient(ellipse at ${dominantColor === 'white' ? 'bottom' : 'top'} center, ${auraColor} 0%, transparent 65%)`
              : 'transparent',
          }}
        />

        {/* Opponent info */}
        <div className="relative z-10 flex-shrink-0 px-2 pt-2 pb-1 md:px-3 md:pt-3">
          <PlayerInfo
            color={topColor}
            name={topName}
            rank={getRank(topColor)}
            score={getScore(topColor)}
            captured={getCaptured(topColor)}
            timeLeft={getTime(topColor)}
            isCurrentTurn={gameState.currentTurn === topColor}
            isCheck={gameState.isCheck && gameState.currentTurn === topColor}
            isAiThinking={isAiThinking && playerMode === 'ai' && topColor === aiColor}
          />
        </div>

        {/* Board — on mobile fills width (no flex-1), on desktop centers in remaining space */}
        <div className="relative z-10 md:flex-1 flex justify-center px-2 py-1 md:px-3 md:items-center" style={{ minHeight: 0 }}>
          <div style={{
            width: '100%',
            maxWidth: 'min(calc(100dvh - 185px), calc(100dvw - 16px))',
            aspectRatio: '1',
            pointerEvents: captureEffect ? 'none' : 'auto',
          }}>
            <Board
              board={gameState.board}
              selectedPos={selectedPos}
              legalMoves={legalMoves}
              lastMove={lastMove}
              premove={premove}
              onSquareClick={handleSquareClick}
              flipped={isFlipped}
              isCheck={gameState.isCheck}
              currentTurn={gameState.currentTurn}
              boardTheme={boardTheme}
              playerColor={playerColor}
            />
          </div>
        </div>

        {/* Player info */}
        <div className="relative z-10 flex-shrink-0 px-2 pt-1 pb-2 md:px-3 md:pb-3">
          <PlayerInfo
            color={bottomColor}
            name={bottomName}
            rank={getRank(bottomColor)}
            score={getScore(bottomColor)}
            captured={getCaptured(bottomColor)}
            timeLeft={getTime(bottomColor)}
            isCurrentTurn={gameState.currentTurn === bottomColor}
            isCheck={gameState.isCheck && gameState.currentTurn === bottomColor}
          />
        </div>
      </div>

      {/* ── DESKTOP SIDEBAR ── */}
      <div className="hidden md:flex w-64 xl:w-72 flex-col border-l flex-shrink-0"
        style={{
          borderColor: 'rgba(255,255,255,0.05)',
          background: 'rgba(12,16,28,0.97)',
          backdropFilter: 'blur(20px)',
        }}>
        <div className="flex items-center justify-between px-4 py-3 border-b border-white/5 flex-shrink-0">
          <button onClick={onBack}
            className="text-white/40 hover:text-white/80 text-xs font-semibold transition-colors flex items-center gap-1.5">
            ← Back
          </button>
          <div className="flex items-center gap-2">
            <span className="text-[10px] font-bold uppercase tracking-widest px-2 py-0.5 rounded"
              style={{
                background: mode === 'battle' ? 'rgba(168,85,247,0.2)' : 'rgba(255,255,255,0.05)',
                color: mode === 'battle' ? '#a855f7' : 'rgba(255,255,255,0.3)',
              }}>
              {mode}
            </span>
            <button onClick={resetGame}
              className="text-white/40 hover:text-white/80 text-xs font-semibold transition-colors">
              ↺
            </button>
          </div>
        </div>
        <SidebarContent />
      </div>

      {/* ── MOBILE SIDEBAR DRAWER ── */}
      {showSidebar && (
        <div className="md:hidden fixed inset-0 z-50 flex flex-col"
          style={{ background: 'rgba(0,0,0,0.75)', backdropFilter: 'blur(4px)' }}
          onClick={() => setShowSidebar(false)}>
          <div
            className="absolute right-0 top-0 bottom-0 w-72 flex flex-col overflow-auto"
            style={{ background: 'rgba(12,16,28,0.98)', borderLeft: '1px solid rgba(255,255,255,0.06)' }}
            onClick={e => e.stopPropagation()}
          >
            <div className="flex items-center justify-between px-4 py-3 border-b border-white/5 flex-shrink-0">
              <span className="text-xs font-bold text-white/40 uppercase tracking-widest">Menu</span>
              <button onClick={() => setShowSidebar(false)} className="text-white/40 hover:text-white text-sm">✕</button>
            </div>
            <SidebarContent />
          </div>
        </div>
      )}

      {/* ── KILL ANIMATION ── */}
      {captureEffect && (
        <AbilityEffect
          attackerType={captureEffect.attackerType}
          attackerColor={captureEffect.attackerColor}
          capturedType={captureEffect.capturedType}
          capturedColor={captureEffect.capturedColor}
          onDone={clearCaptureEffect}
        />
      )}

      {/* GAME OVER ANIMATIONS */}
      <AnimatePresence>
        {gameOver && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] flex items-center justify-center overflow-hidden"
            style={{ 
              background: didIWin 
                ? 'radial-gradient(circle, rgba(0,0,0,0.9) 0%, rgba(10,10,30,0.98) 100%)'
                : 'radial-gradient(circle, rgba(0,0,0,0.85) 0%, rgba(20,0,0,0.98) 100%)', 
              backdropFilter: 'blur(12px)' 
            }}
          >
            {/* Dramatic Slash Effect */}
            <motion.div 
              initial={{ scale: 0, opacity: 0, rotate: -15, x: '-100%' }}
              animate={{ scale: 2, opacity: 0.15, rotate: -15, x: '0%' }}
              transition={{ duration: 0.3, ease: "easeOut" }}
              className={`absolute inset-0 ${didIWin ? 'bg-blue-500' : 'bg-red-500'} pointer-events-none`}
              style={{ clipPath: 'polygon(0 48%, 100% 40%, 100% 60%, 0 52%)' }}
            />
            
            <div className="text-center relative z-10 w-full">
              {/* Background Japanese Text */}
              <motion.div
                initial={{ scale: 1.5, opacity: 0 }}
                animate={{ scale: 1, opacity: 0.08 }}
                transition={{ duration: 0.4 }}
                className={`absolute inset-0 flex items-center justify-center text-[10rem] md:text-[16rem] font-black ${didIWin ? 'text-blue-500' : 'text-red-500'} tracking-tighter pointer-events-none`}
                style={{ top: '50%', left: '50%', transform: 'translate(-50%, -50%)', whiteSpace: 'nowrap', zIndex: -1 }}
              >
                {isResigned ? '降参' : 'チェックメイト'}
              </motion.div>
              
              <motion.h1 
                initial={{ x: -100, opacity: 0, skewX: -20 }}
                animate={{ x: 0, opacity: 1, skewX: -10 }}
                transition={{ type: 'spring', damping: 12, stiffness: 120 }}
                className={`text-7xl md:text-9xl font-black text-transparent bg-clip-text bg-gradient-to-r ${didIWin ? 'from-blue-600 via-white to-blue-600 drop-shadow-[0_0_35px_rgba(0,100,255,0.8)]' : 'from-red-600 via-white to-red-600 drop-shadow-[0_0_35px_rgba(255,0,0,0.8)]'} uppercase italic`}
              >
                {isResigned ? 'RESIGNED' : 'CHECKMATE'}
              </motion.h1>
              
              <motion.p
                initial={{ opacity: 0, y: 50 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.4, type: 'spring' }}
                className="text-white text-3xl md:text-5xl mt-4 font-bold tracking-[0.3em] drop-shadow-[0_0_15px_rgba(255,255,255,0.9)] uppercase"
              >
                {didIWin ? 'YOU WIN' : `${winner} WINS`}
              </motion.p>

              <motion.div 
                initial={{ opacity: 0, y: 20 }} 
                animate={{ opacity: 1, y: 0 }} 
                transition={{ delay: 1.2 }}
                className="mt-12 flex flex-col md:flex-row justify-center items-center gap-4 pointer-events-auto"
              >
                <button
                  onClick={resetGame}
                  className={`px-8 py-3 rounded-none ${didIWin ? 'bg-blue-600 border-blue-500 shadow-[0_0_20px_rgba(0,100,255,0.5)]' : 'bg-red-600 border-red-500 shadow-[0_0_20px_rgba(255,0,0,0.5)]'} text-white font-black uppercase tracking-widest text-lg border-2 hover:opacity-90 hover:scale-105 transition-all`}
                  style={{ transform: 'skewX(-10deg)' }}
                >
                  <span className="block" style={{ transform: 'skewX(10deg)' }}>Play Again</span>
                </button>
                <button
                  onClick={onBack}
                  className="px-8 py-3 rounded-none bg-transparent text-white/70 font-bold uppercase tracking-widest text-sm border-2 border-white/20 hover:text-white hover:border-white/50 transition-all"
                  style={{ transform: 'skewX(-10deg)' }}
                >
                  <span className="block" style={{ transform: 'skewX(10deg)' }}>Main Menu</span>
                </button>
              </motion.div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
