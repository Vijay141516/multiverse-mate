import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Board from '../components/Board';
import PlayerInfo from '../components/PlayerInfo';
import MoveHistory from '../components/MoveHistory';
import AbilityEffect from '../components/AbilityEffect';
import GameOverOverlay from '../components/GameOverOverlay';
import { useOnlineGame } from '../hooks/useOnlineGame';
import { PieceStyle } from '../components/ChessPiece';
import { Position } from '../lib/chess';

function algebraicToMove(alg?: string): { from: Position; to: Position } | null {
  if (!alg || alg.length < 4) return null;
  const fromFile = alg.charCodeAt(0) - 97;
  const fromRank = 8 - parseInt(alg[1]);
  const toFile = alg.charCodeAt(2) - 97;
  const toRank = 8 - parseInt(alg[3]);
  return {
    from: { row: fromRank, col: fromFile },
    to: { row: toRank, col: toFile }
  };
}

const RANK_AURA: Record<string, string> = {
  S: 'rgba(234,179,8,0.15)',
  A: 'rgba(168,85,247,0.12)',
  B: 'rgba(59,130,246,0.10)',
  C: 'rgba(6,182,212,0.08)',
  D: 'transparent',
};

interface Props { 
  onBack: () => void;
  playerName: string;
  animationsEnabled: boolean;
  pieceStyle: PieceStyle;
  classicGlowEnabled: boolean;
  autoMatchmaking?: boolean;
}

export default function OnlineLobbyPage({ onBack, playerName, animationsEnabled, pieceStyle, classicGlowEnabled, autoMatchmaking }: Props) {
  const {
    status, roomCode, playerColor, error,
    gameState, selectedPos, legalMoves, lastMove, captureEffect, clearCaptureEffect,
    materialScore, whiteRank, blackRank,
    handleSquareClick, createRoom, joinRoom, resetOnline,
    premove,
    resignedColor, rematchRequestedBy, resign, requestRematch,
    timeLimit, whiteTime, blackTime,
    whiteName, blackName,
    whiteAvatarId, whiteAvatarUrl, blackAvatarId, blackAvatarUrl,
    isMatchmaking, startMatchmaking,
    viewIndex, goToMove,
    analysis, runAnalysis, isAnalyzing, analysisProgress
  } = useOnlineGame(
    playerName, 
    parseInt(localStorage.getItem('anime_chess_avatar_id') || '1'),
    localStorage.getItem('anime_chess_avatar_custom_url') || ''
  );

  useEffect(() => {
    if (autoMatchmaking && status === 'idle') {
      startMatchmaking();
    }
  }, [autoMatchmaking, status]);

  const [codeInput, setCodeInput] = useState('');
  const [showResignConfirm, setShowResignConfirm] = useState(false);
  const [showSidebar, setShowSidebar] = useState(false);
  const [selectedTime, setSelectedTime] = useState<number | null>(300); // Default 5 min
  const boardTheme = (localStorage.getItem('anime_chess_theme') as any) || 'anime';

  const timeOptions = [
    { label: 'No Timer', value: null },
    { label: '1 min', value: 60 },
    { label: '3 min', value: 180 },
    { label: '5 min', value: 300 },
    { label: '10 min', value: 600 },
    { label: '15 min', value: 900 },
    { label: '30 min', value: 1800 },
  ];

  const handleBack = () => { 
    // If game is in progress, resign automatically
    if (status === 'playing' && !resignedColor && !gameState.isCheckmate && !gameState.isStalemate && !gameState.isDraw) {
      resign();
    }
    resetOnline(); 
    onBack(); 
  };

  const whiteScore = materialScore.white;
  const blackScore = materialScore.black;
  const getCaptured = (c: 'white' | 'black') =>
    c === 'white' ? gameState.capturedByWhite : gameState.capturedByBlack;

  const isFlipped = playerColor === 'black';
  const topColor    = isFlipped ? 'white' : 'black';
  const bottomColor = isFlipped ? 'black' : 'white';
  
  const whiteDisplayName = whiteName || (playerColor === 'white' ? playerName || 'You' : 'Opponent');
  const blackDisplayName = blackName || (playerColor === 'black' ? playerName || 'You' : 'Opponent');

  const topName = topColor === 'white' ? whiteDisplayName : blackDisplayName;
  const bottomName = bottomColor === 'white' ? whiteDisplayName : blackDisplayName;

  const topAvatarId = topColor === 'white' ? whiteAvatarId : (blackAvatarId || undefined);
  const bottomAvatarId = bottomColor === 'white' ? whiteAvatarId : (blackAvatarId || undefined);
  const topAvatarUrl = topColor === 'white' ? whiteAvatarUrl : blackAvatarUrl;
  const bottomAvatarUrl = bottomColor === 'white' ? whiteAvatarUrl : blackAvatarUrl;


  const [gameOverDismissed, setGameOverDismissed] = useState(false);

  /* ── Matchmaking Overlay (High Priority for Battle Mode) ── */
  if (isMatchmaking || (autoMatchmaking && status !== 'playing' && status !== 'error')) {
    return (
      <div className="h-[100dvh] w-full flex flex-col items-center justify-center p-6 overflow-hidden" style={{ background: '#0B0F1A' }}>
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="flex flex-col items-center justify-center"
        >
          <div className="relative mb-12">
            <div className="w-24 h-24 rounded-full border-2 border-white/5 flex items-center justify-center">
              <motion.div
                animate={{ rotate: 360 }}
                transition={{ duration: 3, repeat: Infinity, ease: "linear" }}
                className="w-20 h-20 rounded-full border-t-2 border-blue-500 shadow-[0_0_20px_rgba(59,130,246,0.3)]"
              />
            </div>
            <div className="absolute inset-0 flex items-center justify-center">
              <span className="text-2xl">⚔️</span>
            </div>
          </div>
          
          <h2 className="text-3xl font-black text-white mb-2 uppercase tracking-tighter">Finding Opponent</h2>
          <p className="text-blue-400 font-bold text-xs uppercase tracking-[0.4em] animate-pulse">Battle Matchmaking</p>
          
          {error && (
            <motion.div 
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="mt-6 p-4 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-xs font-bold text-center max-w-xs"
            >
              Matchmaking Error: {error}
            </motion.div>
          )}

          <div className="mt-12 flex flex-col items-center gap-6 w-full max-w-xs">
            <div className="w-full h-1 bg-white/5 rounded-full overflow-hidden">
              <motion.div 
                initial={{ x: '-100%' }}
                animate={{ x: '100%' }}
                transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
                className="w-1/2 h-full bg-gradient-to-r from-transparent via-blue-500 to-transparent"
              />
            </div>
            
            <button 
              onClick={handleBack}
              className="px-8 py-3 rounded-xl border border-white/10 text-white/40 text-[10px] font-black uppercase tracking-[0.3em] hover:bg-white/5 transition-all"
            >
              Cancel Matchmaking
            </button>
          </div>
        </motion.div>
      </div>
    );
  }

  /* ── Game screen (when playing) ── */
  if (status === 'playing') {
    let winner = gameState.isCheckmate ? (gameState.currentTurn === 'white' ? 'Black' : 'White') : null;
    if (resignedColor) winner = resignedColor === 'white' ? 'Black' : 'White';
    const gameOver  = (gameState.isCheckmate || gameState.isStalemate || gameState.isDraw || !!resignedColor) && !gameOverDismissed;
    const didIWin = winner?.toLowerCase() === playerColor;

    const handleAnalyze = () => {
      runAnalysis();
      setGameOverDismissed(true);
      setShowSidebar(true);
    };

    const dominantColor = materialScore.advantage > 0 ? 'white' : materialScore.advantage < 0 ? 'black' : null;
    const dominantRank = dominantColor === 'white' ? whiteRank : blackRank;
    const auraColor = dominantColor ? RANK_AURA[dominantRank] : 'transparent';

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
                  {resignedColor ? 'Resignation' : 'Checkmate'}
                </p>
              </>
            ) : (
              <>
                <div className="text-2xl mb-1">🤝</div>
                <p className="text-white font-bold text-sm">Draw</p>
                <p className="text-white/40 text-[10px] mt-0.5">
                  {gameState.isStalemate ? 'Stalemate' : 'Draw'}
                </p>
              </>
            )}
            <div className="flex flex-col gap-2 mt-3">
              <button
                onClick={() => { setGameOverDismissed(false); requestRematch(); }}
                className={`w-full py-2 rounded-lg text-xs font-bold text-white transition-transform hover:scale-[1.02] ${rematchRequestedBy === playerColor ? 'bg-green-500/50' : (didIWin ? 'bg-blue-500/50' : 'bg-red-500/50')}`}
              >
                {rematchRequestedBy === playerColor ? 'Waiting...' : rematchRequestedBy ? 'Accept Rematch' : 'Request Rematch'}
              </button>
              <button
                onClick={handleBack}
                className="w-full py-2 rounded-lg text-xs font-bold text-white/60 border border-white/10 hover:bg-white/5 transition-colors"
              >
                Back to Lobby
              </button>
            </div>
          </div>
        )}

        {!gameOver && (
          <div className="px-4 py-4 border-b border-white/5">
            <button
              onClick={() => setShowResignConfirm(true)}
              className="w-full py-3 rounded-xl text-[10px] font-black uppercase tracking-[0.3em] text-red-400/80 bg-white/[0.03] backdrop-blur-xl border border-white/10 hover:bg-red-500/10 hover:border-red-500/30 hover:text-red-400 transition-all duration-300 shadow-[0_8px_32px_rgba(0,0,0,0.3)] flex items-center justify-center gap-3 group"
            >
              <span className="text-base group-hover:rotate-12 transition-transform duration-300">🏳</span>
              RESIGN GAME
            </button>
          </div>
        )}

        <div className="flex-1 overflow-hidden" style={{ minHeight: 0 }}>
          <MoveHistory
            moves={gameState.moveHistory}
            viewIndex={viewIndex}
            onMoveClick={goToMove}
            analysis={analysis}
            isAnalyzing={isAnalyzing}
            analysisProgress={analysisProgress}
          />
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
              <span className={gameState.currentTurn === 'white' ? 'text-white/40' : 'text-blue-400/60'}>
                {gameState.currentTurn === 'white' ? 'White' : 'Black'} to move
              </span>
            </span>
          </div>
        </div>
      </>
    );

    return (
      <div className="h-[100dvh] w-full flex flex-col md:flex-row overflow-hidden" style={{ background: '#0B0F1A' }}>
        <div className="flex md:hidden items-center justify-between px-3 py-2 border-b flex-shrink-0"
          style={{ borderColor: 'rgba(255,255,255,0.06)' }}>
          <button onClick={handleBack}
            className="flex items-center gap-1.5 text-white/50 hover:text-white text-sm font-semibold transition-colors">
            ← Back
          </button>
          <div className="flex items-center gap-2">
            <span className="text-[10px] font-bold uppercase tracking-widest px-2 py-0.5 rounded"
              style={{
                background: autoMatchmaking ? 'rgba(59,130,246,0.2)' : 'rgba(255,255,255,0.05)',
                color: autoMatchmaking ? '#60a5fa' : 'rgba(255,255,255,0.3)',
              }}>
              {autoMatchmaking ? 'BATTLE MATCH' : `ONLINE · ${roomCode}`}
            </span>
            {!gameOver && (
              <button onClick={() => setShowResignConfirm(true)}
                className="text-red-400/60 hover:text-red-400 text-xs font-bold transition-colors px-2">
                Resign
              </button>
            )}
            <button
              onClick={() => setShowSidebar(s => !s)}
              className="text-white/40 hover:text-white text-sm font-semibold transition-colors px-1"
            >
              {showSidebar ? '✕' : '☰'}
            </button>
          </div>
        </div>


        {/* ── Board column ── */}
        <div className="flex-1 flex flex-col overflow-hidden relative" style={{ minWidth: 0 }}>
          {/* Rank aura bg */}
          <div className="absolute inset-0 pointer-events-none transition-all duration-700"
            style={{
              transform: 'translate3d(0,0,0)',
              background: dominantColor
                ? `radial-gradient(ellipse at ${dominantColor === 'white' ? 'bottom' : 'top'} center, ${auraColor} 0%, transparent 65%)`
                : 'transparent',
            }}
          />
          {/* Opponent info */}
          <div className="relative z-10 flex-shrink-0 px-2 pt-2 pb-1 md:px-3 md:pt-3">
            <PlayerInfo
              color={topColor} name={topName}
              rank={topColor === 'white' ? whiteRank : blackRank}
              score={topColor === 'white' ? whiteScore : blackScore}
              captured={getCaptured(topColor)}
              isCurrentTurn={gameState.currentTurn === topColor}
              isCheck={gameState.isCheck && gameState.currentTurn === topColor}
              timeLeft={topColor === 'white' ? whiteTime ?? undefined : blackTime ?? undefined}
              avatarId={topAvatarId}
              avatarUrl={topAvatarUrl}
            />
          </div>

          {/* Board */}
          <div className="relative z-10 md:flex-1 flex justify-center px-2 py-1 md:px-3 md:items-center" style={{ minHeight:0 }}>
            <div style={{ 
              width:'100%', 
              maxWidth:'min(calc(100dvh - 185px), calc(100dvw - 16px))', 
              aspectRatio:'1',
              pointerEvents: captureEffect ? 'none' : 'auto',
            }}>
              <Board
                board={gameState.board}
                selectedPos={selectedPos}
                legalMoves={legalMoves}
                lastMove={lastMove}
                premove={premove}
                playerColor={playerColor}
                onSquareClick={handleSquareClick}
                flipped={isFlipped}
                isCheck={gameState.isCheck}
                currentTurn={gameState.currentTurn}
                boardTheme={boardTheme}
                pieceStyle={pieceStyle}
                classicGlowEnabled={classicGlowEnabled}
                suggestion={viewIndex !== null ? algebraicToMove(analysis?.moves[viewIndex]?.bestMove) : null}
              />
            </div>
          </div>

          {/* Player info */}
          <div className="relative z-10 flex-shrink-0 px-2 pt-1 pb-2 md:px-3 md:pb-3">
            <PlayerInfo
              color={bottomColor} name={bottomName}
              rank={bottomColor === 'white' ? whiteRank : blackRank}
              score={bottomColor === 'white' ? whiteScore : blackScore}
              captured={getCaptured(bottomColor)}
              isCurrentTurn={gameState.currentTurn === bottomColor}
              isCheck={gameState.isCheck && gameState.currentTurn === bottomColor}
              timeLeft={bottomColor === 'white' ? whiteTime ?? undefined : blackTime ?? undefined}
              avatarId={bottomAvatarId}
              avatarUrl={bottomAvatarUrl}
            />
          </div>

          {/* ── Mobile Navigation Controls ── */}
          {gameState.moveHistory.length > 0 && (
            <div className="md:hidden flex justify-center gap-1 pb-4 px-4 z-10">
              <button 
                onClick={() => goToMove(0)}
                disabled={viewIndex === 0}
                className="flex-1 py-2 rounded-lg bg-white/5 border border-white/10 text-white/40 disabled:opacity-20 transition-all active:scale-95"
              >
                «
              </button>
              <button 
                onClick={() => goToMove((viewIndex ?? gameState.moveHistory.length) - 1)}
                disabled={(viewIndex ?? gameState.moveHistory.length) === 0}
                className="flex-1 py-2 rounded-lg bg-white/5 border border-white/10 text-white/40 disabled:opacity-20 transition-all active:scale-95"
              >
                ‹
              </button>
              <button 
                onClick={() => goToMove((viewIndex ?? -1) + 1)}
                disabled={viewIndex === null || viewIndex >= gameState.moveHistory.length - 1}
                className="flex-1 py-2 rounded-lg bg-white/5 border border-white/10 text-white/40 disabled:opacity-20 transition-all active:scale-95"
              >
                ›
              </button>
              <button 
                onClick={() => goToMove(null)}
                disabled={viewIndex === null}
                className="flex-1 py-2 rounded-lg bg-white/5 border border-white/10 text-white/40 disabled:opacity-20 transition-all active:scale-95"
              >
                »
              </button>
            </div>
          )}
        </div>

        {/* ── Desktop sidebar ── */}
        <div className="hidden md:flex w-64 xl:w-72 flex-col border-l flex-shrink-0"
          style={{
            borderColor: 'rgba(255,255,255,0.05)',
            background: 'rgba(12,16,28,0.97)',
            backdropFilter: 'blur(20px)',
          }}>
          <div className="flex items-center justify-between px-4 py-3 border-b border-white/5 flex-shrink-0">
            <button onClick={handleBack}
              className="text-white/40 hover:text-white/80 text-xs font-semibold transition-colors flex items-center gap-1.5">
              ← Back
            </button>
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-bold uppercase tracking-widest px-2 py-0.5 rounded"
                style={{
                  background: autoMatchmaking ? 'rgba(59,130,246,0.2)' : 'rgba(255,255,255,0.05)',
                  color: autoMatchmaking ? '#60a5fa' : 'rgba(255,255,255,0.3)',
                }}>
                {autoMatchmaking ? 'BATTLE MATCH' : roomCode}
              </span>
            </div>
          </div>
          <SidebarContent />
        </div>

        {/* ── KILL ANIMATION ── */}
        {animationsEnabled && captureEffect && (
          <AbilityEffect
            attackerType={captureEffect.attackerType}
            attackerColor={captureEffect.attackerColor}
            capturedType={captureEffect.capturedType}
            capturedColor={captureEffect.capturedColor}
            onDone={clearCaptureEffect}
          />
        )}
        {!animationsEnabled && captureEffect && (() => { clearCaptureEffect(); return null; })()}

        {/* ── MOBILE SIDEBAR DRAWER ── */}
        <AnimatePresence>
          {showSidebar && (
            <div className="md:hidden fixed inset-0 z-50 flex flex-col"
              style={{ background: 'rgba(0,0,0,0.75)', backdropFilter: 'blur(4px)' }}
              onClick={() => setShowSidebar(false)}>
              <motion.div
                initial={{ x: '100%' }}
                animate={{ x: 0 }}
                exit={{ x: '100%' }}
                transition={{ type: 'spring', damping: 25, stiffness: 200 }}
                className="absolute right-0 top-0 bottom-0 w-72 flex flex-col overflow-auto"
                style={{ background: 'rgba(12,16,28,0.98)', borderLeft: '1px solid rgba(255,255,255,0.06)' }}
                onClick={e => e.stopPropagation()}
              >
                <div className="flex items-center justify-between px-4 py-3 border-b border-white/5 flex-shrink-0">
                  <span className="text-xs font-bold text-white/40 uppercase tracking-widest">Menu</span>
                  <button onClick={() => setShowSidebar(false)} className="text-white/40 hover:text-white text-sm">✕</button>
                </div>
                <SidebarContent />
              </motion.div>
            </div>
          )}
        </AnimatePresence>

        {/* ── GAME OVER OVERLAY ── */}
        <GameOverOverlay
          isOpen={gameOver}
          winner={winner}
          didIWin={didIWin}
          isCheckmate={gameState.isCheckmate}
          isResigned={!!resignedColor}
          isStalemate={gameState.isStalemate}
          isDraw={gameState.isDraw}
          animationsEnabled={animationsEnabled}
          onRematch={() => { setGameOverDismissed(false); requestRematch(); }}
          onReview={() => setGameOverDismissed(true)}
          onExit={handleBack}
          rematchText={rematchRequestedBy === playerColor ? 'Waiting...' : rematchRequestedBy ? 'Accept' : 'Rematch'}
          isAnalyzing={isAnalyzing}
          analysisProgress={analysisProgress}
          hasAnalysis={!!analysis}
          onAnalyze={handleAnalyze}
          modeLabel="Multiverse Mate Online"
        />

        {/* ── RESIGN CONFIRMATION MODAL ── */}
        <AnimatePresence>
          {showResignConfirm && (
            <div className="fixed inset-0 z-[200] flex items-center justify-center p-4">
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="absolute inset-0 bg-black/60 backdrop-blur-sm"
                onClick={() => setShowResignConfirm(false)}
              />
              <motion.div
                initial={{ scale: 0.95, opacity: 0, y: 20 }}
                animate={{ scale: 1, opacity: 1, y: 0 }}
                exit={{ scale: 0.95, opacity: 0, y: 20 }}
                className="relative bg-[#1a1228] border border-white/10 p-6 rounded-2xl shadow-2xl max-w-sm w-full text-center"
              >
                <div className="text-4xl mb-4">⚠️</div>
                <h3 className="text-xl font-black text-white mb-2">Surrender Match?</h3>
                <p className="text-sm text-white/50 mb-8">This action cannot be undone. You will forfeit the game immediately.</p>
                
                <div className="flex gap-3">
                  <button
                    onClick={() => setShowResignConfirm(false)}
                    className="flex-1 py-3 rounded-xl bg-white/5 hover:bg-white/10 text-white text-sm font-bold transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={() => {
                      setShowResignConfirm(false);
                      resign();
                    }}
                    className="flex-1 py-3 rounded-xl bg-red-600 hover:bg-red-500 text-white text-sm font-bold transition-colors shadow-[0_0_15px_rgba(239,68,68,0.4)]"
                  >
                    Resign
                  </button>
                </div>
              </motion.div>
            </div>
          )}
        </AnimatePresence>
      </div>
    );
  }

  /* ── Waiting screen ── */
  if (status === 'waiting') {
    return (
      <div className="h-[100dvh] flex flex-col items-center justify-center gap-8" style={{ background:'#0B0F1A' }}>
        <button onClick={handleBack} className="absolute top-4 left-4 text-white/40 hover:text-white text-sm font-semibold transition-colors">← Back</button>

        <div className="text-center">
          <div className="w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-5"
            style={{ background:'rgba(59,130,246,0.15)', border:'1px solid rgba(59,130,246,0.3)' }}>
            <span className="text-3xl">🌐</span>
          </div>
          <h2 className="text-2xl font-black text-white mb-2">Waiting for Opponent</h2>
          <p className="text-white/40 text-sm">Share this room code with your friend</p>
        </div>

        {/* Big code display */}
        <div className="flex flex-col items-center gap-3">
          <p className="text-[11px] font-bold text-white/30 uppercase tracking-widest">Room Code</p>
          <div className="flex gap-2 sm:gap-3">
            {roomCode.split('').map((digit, i) => (
              <div key={i}
                className="w-10 h-12 sm:w-14 sm:h-16 rounded-lg sm:rounded-xl flex items-center justify-center text-xl sm:text-3xl font-black text-white"
                style={{
                  background:'rgba(59,130,246,0.15)',
                  border:'2px solid rgba(59,130,246,0.4)',
                  boxShadow:'0 0 20px rgba(59,130,246,0.2)',
                }}>
                {digit}
              </div>
            ))}
          </div>
          <button
            onClick={() => navigator.clipboard.writeText(roomCode)}
            className="text-xs text-blue-400/70 hover:text-blue-400 transition-colors mt-1">
            Copy code
          </button>
        </div>

        {/* Spinner */}
        <div className="flex items-center gap-3 text-white/30 text-sm">
          <div className="w-4 h-4 border-2 border-blue-500/40 border-t-blue-500 rounded-full"
            style={{ animation:'spin 1s linear infinite' }} />
          Waiting for player 2 to join...
        </div>

        <style>{`@keyframes spin { to { transform:rotate(360deg); } }`}</style>
      </div>
    );
  }

  /* ── Lobby screen (idle / join / error) ── */
  return (
    <div className="h-[100dvh] flex flex-col items-center justify-center px-6" style={{ background:'#0B0F1A' }}>
      <button onClick={handleBack} className="absolute top-4 left-4 text-white/40 hover:text-white text-sm font-semibold transition-colors">← Back</button>

      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          <div className="w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-5"
            style={{ background:'rgba(59,130,246,0.12)', border:'1px solid rgba(59,130,246,0.25)' }}>
            <span className="text-3xl">🌐</span>
          </div>
          <h1 className="text-3xl font-black text-white mb-2">Play Online</h1>
          <p className="text-white/40 text-sm">Challenge a friend with a room code</p>
        </div>

        {/* Timer Selection */}
        <div className="mb-6">
          <p className="text-[11px] font-bold text-white/30 uppercase tracking-widest mb-3 text-center">Match Timer</p>
          <div className="grid grid-cols-4 gap-2">
            {timeOptions.map(opt => (
              <button
                key={opt.label}
                onClick={() => setSelectedTime(opt.value)}
                className={`py-2 rounded-lg text-[10px] font-bold border transition-all ${
                  selectedTime === opt.value 
                    ? 'bg-blue-500/20 border-blue-500 text-blue-400' 
                    : 'bg-white/5 border-white/10 text-white/40 hover:border-white/20'
                }`}
              >
                {opt.label}
              </button>
            ))}
          </div>
        </div>

        {error && (
          <div className="mb-4 px-4 py-3 rounded-xl text-sm text-red-400 font-semibold text-center"
            style={{ background:'rgba(239,68,68,0.1)', border:'1px solid rgba(239,68,68,0.25)' }}>
            {error}
          </div>
        )}

        {/* Create room */}
        <button
          onClick={() => createRoom(selectedTime)}
          disabled={status === 'creating'}
          className="w-full py-4 rounded-xl text-sm font-bold mb-3 transition-all duration-200 hover:scale-[1.01]"
          style={{
            background:'linear-gradient(135deg, #3b82f6, #2563eb)',
            color:'white',
            boxShadow:'0 4px 20px rgba(59,130,246,0.4)',
            opacity: status === 'creating' ? 0.7 : 1,
          }}>
          {status === 'creating' ? '⏳ Creating...' : '➕ Create New Room'}
        </button>

        <div className="flex items-center gap-3 my-5">
          <div className="flex-1 h-px" style={{ background:'rgba(255,255,255,0.08)' }} />
          <span className="text-white/25 text-xs font-semibold uppercase tracking-wider">or join</span>
          <div className="flex-1 h-px" style={{ background:'rgba(255,255,255,0.08)' }} />
        </div>

        {/* Join room */}
        <div className="flex gap-2">
          <input
            type="text"
            maxLength={4}
            placeholder="Enter 4-digit code"
            value={codeInput}
            onChange={e => setCodeInput(e.target.value.replace(/\D/g, '').slice(0, 4))}
            onKeyDown={e => e.key === 'Enter' && codeInput.length === 4 && joinRoom(codeInput)}
            className="flex-1 px-4 py-3 rounded-xl text-sm font-bold text-white text-center tracking-widest outline-none"
            style={{
              background:'rgba(255,255,255,0.04)',
              border:'1px solid rgba(255,255,255,0.1)',
              fontSize:'18px',
            }}
          />
          <button
            onClick={() => codeInput.length === 4 && joinRoom(codeInput)}
            disabled={codeInput.length !== 4 || status === 'joining'}
            className="px-5 py-3 rounded-xl text-sm font-bold transition-all duration-150"
            style={{
              background: codeInput.length === 4 ? 'rgba(59,130,246,0.3)' : 'rgba(255,255,255,0.04)',
              border:`1px solid ${codeInput.length === 4 ? 'rgba(59,130,246,0.5)' : 'rgba(255,255,255,0.08)'}`,
              color: codeInput.length === 4 ? '#93c5fd' : 'rgba(255,255,255,0.2)',
            }}>
            {status === 'joining' ? '...' : 'Join →'}
          </button>
        </div>

        <p className="text-center text-[11px] text-white/20 mt-5">
          Games are real-time and expire after 30 minutes of inactivity
        </p>
      </div>
    </div>
  );
}
