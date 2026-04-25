import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Board, { BoardTheme } from '../components/Board';
import PlayerInfo from '../components/PlayerInfo';
import MoveHistory from '../components/MoveHistory';
import { useChessGame, GameMode, PlayerMode } from '../hooks/useChessGame';
import { Color, Position } from '../lib/chess';
import { ABILITY_DESCRIPTIONS, CHARACTER_NAMES } from '../lib/sprites';
import AbilityEffect from '../components/AbilityEffect';
import GameOverOverlay from '../components/GameOverOverlay';
import { PieceStyle } from '../components/ChessPiece';

interface GamePageProps {
  mode: GameMode;
  playerMode: PlayerMode;
  playerColor: Color;
  playerName: string;
  boardTheme: BoardTheme;
  animationsEnabled: boolean;
  pieceStyle: PieceStyle;
  classicGlowEnabled: boolean;
  onBack: () => void;
  aiDepth?: number;
}

const RANK_AURA: Record<string, string> = {
  S: 'rgba(234,179,8,0.15)',
  A: 'rgba(168,85,247,0.12)',
  B: 'rgba(59,130,246,0.10)',
  C: 'rgba(6,182,212,0.08)',
  D: 'transparent',
};

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

export default function GamePage(props: GamePageProps) {
  const { mode, playerMode, playerColor, playerName, boardTheme, animationsEnabled, pieceStyle, classicGlowEnabled, onBack } = props;
  const {
    gameState, selectedPos, legalMoves, lastMove, isAiThinking, captureEffect,
    materialScore, whiteRank, blackRank, handleSquareClick, resetGame,
    resignGame, whiteTime, blackTime, isResigned, resignedColor, clearCaptureEffect,
    premove, premovesEnabled, togglePremoves, viewIndex, goToMove,
    analysis, runAnalysis, isAnalyzing, analysisProgress,
  } = useChessGame({ mode, playerMode, playerColor, aiDepth: props.aiDepth });

  const [showSidebar, setShowSidebar] = useState(false);

  const aiColor: Color = playerColor === 'white' ? 'black' : 'white';
  const isFlipped = playerColor === 'black';

  const dominantColor = materialScore.advantage > 0 ? 'white' : materialScore.advantage < 0 ? 'black' : null;
  const dominantRank = dominantColor === 'white' ? whiteRank : blackRank;
  const auraColor = dominantColor ? RANK_AURA[dominantRank] : 'transparent';

  const localAvatarId = parseInt(localStorage.getItem('anime_chess_avatar_id') || '1');
  const localAvatarUrl = localStorage.getItem('anime_chess_avatar_custom_url') || '';
  const botAvatarId = 99; // A mechanical or generic bot-like waifu for the AI

  const topColor: Color = isFlipped ? playerColor : aiColor;
  const bottomColor: Color = isFlipped ? aiColor : playerColor;

  const topName = playerMode === 'local' ? 'Player 2' : (playerMode === 'online' ? 'Opponent' : 'AI Bot');
  const bottomName = playerMode === 'local' ? 'Player 1' : playerName;

  const topAvatarId = playerMode === 'local' ? undefined : (playerMode === 'ai' ? (isFlipped ? localAvatarId : botAvatarId) : undefined);
  const bottomAvatarId = playerMode === 'local' ? undefined : (playerMode === 'ai' ? (isFlipped ? botAvatarId : localAvatarId) : undefined);
  const topAvatarUrl = playerMode === 'ai' ? (isFlipped ? localAvatarUrl : '') : '';
  const bottomAvatarUrl = playerMode === 'ai' ? (isFlipped ? '' : localAvatarUrl) : '';

  const getRank = (c: Color) => c === 'white' ? whiteRank : blackRank;
  const getScore = (c: Color) => c === 'white' ? materialScore.white : materialScore.black;
  const getCaptured = (c: Color) => c === 'white' ? gameState.capturedByWhite : gameState.capturedByBlack;
  const getTime = (c: Color) => c === 'white' ? whiteTime : blackTime;

  const [gameOverDismissed, setGameOverDismissed] = useState(false);

  const gameOver = (gameState.isCheckmate || gameState.isStalemate || gameState.isDraw || isResigned) && !gameOverDismissed;
  const winner = gameState.isCheckmate
    ? (gameState.currentTurn === 'white' ? 'Black' : 'White')
    : isResigned ? (resignedColor === 'white' ? 'Black' : 'White')
      : null;

  const didIWin = winner?.toLowerCase() === playerColor.toLowerCase();

  const handleAnalyze = () => {
    runAnalysis();
    setGameOverDismissed(true);
    setShowSidebar(true);
  };

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
        <div className="px-4 py-4 border-b border-white/5">
          <button
            onClick={() => resignGame(playerColor)}
            className="w-full py-3 rounded-xl text-[10px] font-black uppercase tracking-[0.3em] text-red-400/80 bg-white/[0.03] backdrop-blur-xl border border-white/10 hover:bg-red-500/10 hover:border-red-500/30 hover:text-red-400 transition-all duration-300 shadow-[0_8px_32px_rgba(0,0,0,0.3)] flex items-center justify-center gap-3 group"
          >
            <span className="text-base group-hover:rotate-12 transition-transform duration-300">🏳</span>
            RESIGN GAME
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
                      {pieceStyle === 'classic' ? type.toUpperCase() : CHARACTER_NAMES[type]}
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
            transform: 'translate3d(0,0,0)',
            background: dominantColor
              ? `radial-gradient(ellipse at ${dominantColor === 'white' ? 'bottom' : 'top'} center, ${auraColor} 0%, transparent 65%)`
              : 'transparent',
          }}
        />

        {/* Opponent info */}
        <div className="relative z-10 flex-shrink-0 px-3 pt-2 md:pt-3">
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
            avatarId={topAvatarId}
            avatarUrl={topAvatarUrl}
          />
        </div>

        {/* Board Area */}
        <div className="relative z-10 flex-1 flex items-center justify-center p-2 md:p-6" style={{ minHeight: 0 }}>
          <div className="w-full max-w-[min(92vw,75dvh)] aspect-square transition-transform duration-300">
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
              pieceStyle={pieceStyle}
              classicGlowEnabled={classicGlowEnabled}
              suggestion={viewIndex !== null ? algebraicToMove(analysis?.moves[viewIndex]?.bestMove) : null}
            />
          </div>
        </div>

        {/* Player info */}
        <div className="relative z-10 flex-shrink-0 px-2 pt-1 pb-2 md:px-3 md:pb-3">
          <PlayerInfo
            color={bottomColor}
            name={bottomColor === 'white' ? 'White' : 'Black'}
            rank={getRank(bottomColor)}
            score={getScore(bottomColor)}
            captured={getCaptured(bottomColor)}
            timeLeft={getTime(bottomColor)}
            isCurrentTurn={gameState.currentTurn === bottomColor}
            isCheck={gameState.isCheck && gameState.currentTurn === bottomColor}
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

      {/* GAME OVER OVERLAY */}
      <GameOverOverlay
        isOpen={gameOver}
        winner={winner}
        didIWin={didIWin}
        isCheckmate={gameState.isCheckmate}
        isResigned={isResigned}
        isStalemate={gameState.isStalemate}
        isDraw={gameState.isDraw}
        animationsEnabled={animationsEnabled}
        onRematch={() => { setGameOverDismissed(false); resetGame(); }}
        onReview={() => setGameOverDismissed(true)}
        onExit={onBack}
        isAnalyzing={isAnalyzing}
        analysisProgress={analysisProgress}
        hasAnalysis={!!analysis}
        onAnalyze={handleAnalyze}
        modeLabel="Multiverse Mate"
      />
    </div>
  );
}
