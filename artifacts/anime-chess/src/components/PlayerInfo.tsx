import React from 'react';
import { Color, Piece, PieceType } from '../lib/chess';
import RankBadge from './RankBadge';

interface PlayerInfoProps {
  color: Color;
  name: string;
  rank: string;
  score: number;
  captured: Piece[];
  isCurrentTurn: boolean;
  isCheck: boolean;
  isAiThinking?: boolean;
  timeLeft?: number;
  avatarId?: number;
}

const PIECE_SYMBOLS: Record<PieceType, string> = {
  pawn: '♟', knight: '♞', bishop: '♝', rook: '♜', queen: '♛', king: '♚',
};

const PIECE_VALUES: Record<PieceType, number> = {
  pawn: 1, knight: 3, bishop: 3, rook: 5, queen: 9, king: 0,
};

const PIECE_ORDER: PieceType[] = ['pawn', 'knight', 'bishop', 'rook', 'queen'];

function groupCaptured(pieces: Piece[]): Partial<Record<PieceType, number>> {
  const groups: Partial<Record<PieceType, number>> = {};
  for (const p of pieces) groups[p.type] = (groups[p.type] || 0) + 1;
  return groups;
}

export default function PlayerInfo({
  color, name, rank, score, captured, isCurrentTurn, isCheck, isAiThinking, timeLeft, avatarId
}: PlayerInfoProps) {
  const groups = groupCaptured(captured);
  const capturedColor: Color = color === 'white' ? 'black' : 'white';

  const formatTime = (seconds: number) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m}:${s.toString().padStart(2, '0')}`;
  };

  const symbolStyle = capturedColor === 'white'
    ? { color: '#d4d4d8', textShadow: '0 0 4px rgba(255,255,255,0.3)' }
    : { color: '#9b59b6', textShadow: '0 0 4px rgba(168,85,247,0.4)' };

  return (
    <div className={`flex items-center gap-2 md:gap-3 px-2 md:px-3 py-1 md:py-2 rounded-lg transition-all duration-300 ${
      isCurrentTurn ? 'bg-white/10 border border-white/20' : 'bg-transparent border border-transparent'
    }`} style={{
      boxShadow: isCurrentTurn ? `0 0 20px ${color === 'white' ? 'rgba(255,255,255,0.05)' : 'rgba(168,85,247,0.05)'}` : 'none'
    }}>
      {/* Timer Display */}
      {timeLeft !== undefined && (
        <div className={`text-center min-w-[40px] md:min-w-[50px] font-mono font-bold py-0.5 md:py-1 px-1 md:px-2 rounded border transition-all ${
          isCurrentTurn ? 'border-white/20 bg-white/5 text-white' : 'border-white/5 text-white/20'
        }`} style={{
          boxShadow: isCurrentTurn ? '0 0 10px rgba(255,255,255,0.1)' : 'none',
          animation: isCurrentTurn && timeLeft < 30 ? 'pulse 1s infinite' : 'none'
        }}>
          <div className="text-[7px] md:text-[8px] uppercase opacity-40 leading-none mb-0.5">Time</div>
          <div className="text-[10px] md:text-xs">{formatTime(timeLeft)}</div>
        </div>
      )}

      <div className={`w-7 h-7 md:w-8 md:h-8 rounded-full flex-shrink-0 overflow-hidden flex items-center justify-center text-[10px] md:text-xs font-black transition-all ${
        color === 'white'
          ? 'bg-slate-100 text-slate-800'
          : 'bg-slate-800 text-white border border-purple-500/40'
      } ${isCurrentTurn ? 'ring-2 ring-green-400/70 ring-offset-1 ring-offset-transparent' : ''}`}>
        {avatarId ? (
          <img src={`https://placewaifu.com/image/${avatarId}`} alt={name} className="w-full h-full object-cover" />
        ) : (
          name.charAt(0).toUpperCase()
        )}
      </div>

      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 flex-wrap">
          <span className={`text-sm font-bold leading-none ${
            rank === 'S' 
              ? 'text-transparent bg-clip-text bg-gradient-to-r from-amber-200 via-white to-amber-200 drop-shadow-[0_0_10px_rgba(234,179,8,0.8)]' 
              : 'text-white'
          }`}>
            {name}
          </span>

          {isCheck && (
            <span className="text-[9px] font-black text-red-400 bg-red-400/15 px-1.5 py-0.5 rounded uppercase tracking-wider border border-red-500/30">
              CHECK
            </span>
          )}
          {isAiThinking && (
            <span className="text-[10px] text-purple-400/80 animate-pulse font-medium">thinking…</span>
          )}
        </div>
        <div className="flex items-center gap-1 mt-1 flex-wrap">
          {PIECE_ORDER.flatMap(type => {
            const count = groups[type];
            if (!count) return [];
            return Array.from({ length: Math.min(count, 8) }).map((_, i) => (
              <span key={`${type}-${i}`} style={{ ...symbolStyle, fontSize: '13px', lineHeight: 1 }}>
                {PIECE_SYMBOLS[type]}
              </span>
            ));
          })}
          {captured.length === 0 && (
            <span className="text-[10px] text-white/15 hidden md:inline">no captures yet</span>
          )}
        </div>
      </div>

      <RankBadge rank={rank} score={score} />

      {isCurrentTurn && (
        <div className="w-2 h-2 rounded-full bg-green-400 flex-shrink-0"
          style={{ boxShadow: '0 0 6px rgba(74,222,128,0.9)', animation: 'pulse 2s infinite' }} />
      )}
    </div>
  );
}
