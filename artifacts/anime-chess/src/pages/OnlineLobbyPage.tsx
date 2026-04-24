import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Board from '../components/Board';
import PlayerInfo from '../components/PlayerInfo';
import MoveHistory from '../components/MoveHistory';
import AbilityEffect from '../components/AbilityEffect';
import { useOnlineGame } from '../hooks/useOnlineGame';

interface Props { 
  onBack: () => void;
  playerName: string;
}

export default function OnlineLobbyPage({ onBack, playerName }: Props) {
  const {
    status, roomCode, playerColor, error,
    gameState, selectedPos, legalMoves, lastMove, captureEffect, clearCaptureEffect,
    materialScore, whiteRank, blackRank,
    handleSquareClick, createRoom, joinRoom, resetOnline,
    premove,
    resignedColor, rematchRequestedBy, resign, requestRematch
  } = useOnlineGame();

  const [codeInput, setCodeInput] = useState('');
  const [showResignConfirm, setShowResignConfirm] = useState(false);
  const boardTheme = (localStorage.getItem('anime_chess_theme') as any) || 'anime';

  const handleBack = () => { resetOnline(); onBack(); };

  const whiteScore = materialScore.white;
  const blackScore = materialScore.black;
  const getCaptured = (c: 'white' | 'black') =>
    c === 'white' ? gameState.capturedByWhite : gameState.capturedByBlack;

  const isFlipped = playerColor === 'black';
  const topColor    = isFlipped ? 'white' : 'black';
  const bottomColor = isFlipped ? 'black' : 'white';
  const opponentName = 'Opponent';
  const myName       = playerName || 'You';


  /* ── Game screen (when playing) ── */
  if (status === 'playing') {
    let winner = gameState.isCheckmate ? (gameState.currentTurn === 'white' ? 'Black' : 'White') : null;
    if (resignedColor) winner = resignedColor === 'white' ? 'Black' : 'White';
    const gameOver  = gameState.isCheckmate || gameState.isStalemate || gameState.isDraw || !!resignedColor;
    const didIWin = winner?.toLowerCase() === playerColor;

    return (
      <div className="h-[100dvh] w-full flex flex-col md:flex-row overflow-hidden" style={{ background: '#0B0F1A' }}>
        {/* ── Mobile top bar ── */}
        <div className="flex md:hidden items-center justify-between px-3 py-2 border-b flex-shrink-0"
          style={{ borderColor: 'rgba(255,255,255,0.06)' }}>
          <button onClick={handleBack} className="text-white/50 hover:text-white text-sm font-semibold transition-colors">← Back</button>
          <div className="flex items-center gap-2">
            <span className="text-[10px] font-bold uppercase tracking-widest px-2 py-0.5 rounded"
              style={{ background:'rgba(59,130,246,0.2)', color:'#60a5fa' }}>
              ONLINE · {roomCode}
            </span>
          </div>
        </div>

        {/* ── Board column ── */}
        <div className="flex-1 flex flex-col overflow-hidden relative" style={{ minWidth:0 }}>
          {/* Opponent info */}
          <div className="relative z-10 flex-shrink-0 px-2 pt-2 pb-1 md:px-3 md:pt-3">
            <PlayerInfo
              color={topColor} name={opponentName}
              rank={topColor === 'white' ? whiteRank : blackRank}
              score={topColor === 'white' ? whiteScore : blackScore}
              captured={getCaptured(topColor)}
              isCurrentTurn={gameState.currentTurn === topColor}
              isCheck={gameState.isCheck && gameState.currentTurn === topColor}
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
              />
            </div>
          </div>

          {/* Player info */}
          <div className="relative z-10 flex-shrink-0 px-2 pt-1 pb-2 md:px-3 md:pb-3">
            <PlayerInfo
              color={bottomColor} name={myName}
              rank={bottomColor === 'white' ? whiteRank : blackRank}
              score={bottomColor === 'white' ? whiteScore : blackScore}
              captured={getCaptured(bottomColor)}
              isCurrentTurn={gameState.currentTurn === bottomColor}
              isCheck={gameState.isCheck && gameState.currentTurn === bottomColor}
            />
          </div>
        </div>

        {/* ── Desktop sidebar ── */}
        <div className="hidden md:flex w-64 xl:w-72 flex-col border-l flex-shrink-0"
          style={{ borderColor:'rgba(255,255,255,0.05)', background:'rgba(12,16,28,0.97)' }}>
          <div className="flex items-center justify-between px-4 py-3 border-b border-white/5 flex-shrink-0">
            <button onClick={handleBack} className="text-white/40 hover:text-white/80 text-xs font-semibold transition-colors flex items-center gap-1.5">← Back</button>
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-bold uppercase tracking-widest px-2 py-0.5 rounded"
                style={{ background:'rgba(59,130,246,0.2)', color:'#60a5fa' }}>
                {roomCode}
              </span>
              {status === 'playing' && !gameOver && (
                <button onClick={() => setShowResignConfirm(true)} 
                        className="text-red-400/60 hover:text-red-400 text-xs font-bold transition-colors px-2">
                  Resign
                </button>
              )}
            </div>
          </div>

          {gameOver && (
            <div className="mx-3 mt-3 rounded-xl p-3 text-center border flex-shrink-0"
              style={{ background:'rgba(255,255,255,0.03)', borderColor:'rgba(255,255,255,0.08)' }}>
              {winner ? (
                <>
                  <div className="text-2xl mb-1">👑</div>
                  <p className="text-white font-bold text-sm">{winner} wins!</p>
                  <p className="text-white/40 text-[10px] mt-0.5">Checkmate</p>
                </>
              ) : (
                <>
                  <div className="text-2xl mb-1">🤝</div>
                  <p className="text-white font-bold text-sm">Draw</p>
                </>
              )}
              <button onClick={handleBack} className="mt-2 w-full py-2 rounded-lg text-xs font-bold text-white"
                style={{ background:'rgba(59,130,246,0.5)' }}>
                Back to Menu
              </button>
            </div>
          )}

          <div className="flex-1 overflow-hidden" style={{ minHeight:0 }}>
            <MoveHistory moves={gameState.moveHistory} />
          </div>

          <div className="px-4 py-3 border-t border-white/5 text-center text-[10px] text-white/25">
            Playing as {playerColor} · Move {Math.ceil(gameState.moveHistory.length / 2)}
          </div>
        </div>

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

        {/* ── CHECKMATE ANIMATION ── */}
        <AnimatePresence>
          {gameOver && winner && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-[100] flex items-center justify-center overflow-hidden"
              style={{ 
                background: didIWin 
                  ? 'radial-gradient(circle, rgba(0,0,0,0.9) 0%, rgba(10,10,30,0.98) 100%)'
                  : 'radial-gradient(circle, rgba(0,0,0,0.85) 0%, rgba(20,0,0,0.98) 100%)', 
                backdropFilter: 'blur(8px)' 
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
                  {gameState.isCheckmate ? 'チェックメイト' : '降参'}
                </motion.div>
                
                <motion.h1 
                  initial={{ x: -100, opacity: 0, skewX: -20 }}
                  animate={{ x: 0, opacity: 1, skewX: -10 }}
                  transition={{ type: 'spring', damping: 12, stiffness: 120 }}
                  className={`text-7xl md:text-9xl font-black text-transparent bg-clip-text bg-gradient-to-r ${didIWin ? 'from-blue-600 via-white to-blue-600 drop-shadow-[0_0_35px_rgba(59,130,246,0.8)]' : 'from-red-600 via-white to-red-600 drop-shadow-[0_0_35px_rgba(239,68,68,0.8)]'} uppercase italic`}
                >
                  {gameState.isCheckmate ? 'CHECKMATE' : 'OPPONENT RESIGNED'}
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
                    onClick={requestRematch}
                    className={`px-8 py-3 rounded-none text-white font-black uppercase tracking-widest text-lg border-2 transition-all ${rematchRequestedBy === playerColor ? 'bg-green-600 border-green-500 shadow-[0_0_20px_rgba(34,197,94,0.5)]' : (didIWin ? 'bg-blue-600 border-blue-500 hover:bg-blue-500 hover:scale-105 shadow-[0_0_20px_rgba(59,130,246,0.5)]' : 'bg-red-600 border-red-500 hover:bg-red-500 hover:scale-105 shadow-[0_0_20px_rgba(239,68,68,0.5)]')}`}
                    style={{ transform: 'skewX(-10deg)' }}
                  >
                    <span className="block" style={{ transform: 'skewX(10deg)' }}>
                      {rematchRequestedBy === playerColor ? 'Waiting...' : rematchRequestedBy ? 'Accept Rematch' : 'Rematch'}
                    </span>
                  </button>
                  <button
                    onClick={handleBack}
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
          <div className="flex gap-3">
            {roomCode.split('').map((digit, i) => (
              <div key={i}
                className="w-14 h-16 rounded-xl flex items-center justify-center text-3xl font-black text-white"
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

        {error && (
          <div className="mb-4 px-4 py-3 rounded-xl text-sm text-red-400 font-semibold text-center"
            style={{ background:'rgba(239,68,68,0.1)', border:'1px solid rgba(239,68,68,0.25)' }}>
            {error}
          </div>
        )}

        {/* Create room */}
        <button
          onClick={createRoom}
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
