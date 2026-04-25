import React, { useState } from 'react';
import { PieceType, Color } from '../lib/chess';

export type PieceStyle = 'anime' | 'classic';

interface ChessPieceProps {
  type: PieceType;
  color: Color;
  isSelected?: boolean;
  isDragging?: boolean;
  style?: PieceStyle;
  glowEnabled?: boolean;
}

const PIECE_GLOW: Record<PieceType, string> = {
  pawn: '#22c55e',
  knight: '#eab308',
  bishop: '#8b5cf6',
  rook: '#3b82f6',
  queen: '#a855f7',
  king: '#ef4444',
};

const PIECE_SIZE_ADJUST: Record<PieceType, number> = {
  pawn: 0.92,
  knight: 0.92,
  bishop: 0.92,
  rook: 0.92,
  queen: 0.92,
  king: 0.95,
};

/* ── Standard Chess.com "Default" Style SVGs (Cburnett/Wikipedia style) ── */
function ClassicSVG({ type, color }: { type: PieceType; color: Color }) {
  const isWhite = color === 'white';
  const fill = isWhite ? "#ffffff" : "#000000";
  const stroke = isWhite ? "#000000" : "#ffffff";
  const strokeWidth = "1.5";

  if (type === 'pawn') {
    return (
      <svg viewBox="0 0 45 45" width="100%" height="100%">
        <path d="M22 9c-2.21 0-4 1.79-4 4 0 .89.29 1.71.78 2.38C17.33 16.5 16 18.59 16 21c0 2.03.94 3.84 2.41 5.03-3 1.06-7.41 5.55-7.41 13.47h23c0-7.92-4.41-12.41-7.41-13.47 1.47-1.19 2.41-3 2.41-5.03 0-2.41-1.33-4.5-3.28-5.62.49-.67.78-1.49.78-2.38 0-2.21-1.79-4-4-4z" 
          fill={fill} stroke={stroke} strokeWidth={strokeWidth} strokeLinejoin="round" />
      </svg>
    );
  }

  if (type === 'rook') {
    return (
      <svg viewBox="0 0 45 45" width="100%" height="100%">
        <g fill={fill} stroke={stroke} strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round">
          <path d="M9 39h27v-3H9v3zM12 36v-4h21v4H12zM11 14V9h4v2h5V9h5v2h5V9h4v5" />
          <path d="M34 14l-3 3H14l-3-3" />
          <path d="M31 17v12.5H14V17" strokeLinecap="butt" />
          <path d="M31 29.5l1.5 2.5h-20l1.5-2.5" />
          <path d="M11 14h23" />
        </g>
      </svg>
    );
  }

  if (type === 'knight') {
    return (
      <svg viewBox="0 0 45 45" width="100%" height="100%">
        <g fill={fill} stroke={stroke} strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round">
          <path d="M22 10c10.5 1 16.5 8 16 29H15c0-9 10-6.5 8-21" />
          <path d="M24 18c.38 2.43-1.39 4.34-4.14 4.58-2.75.24-5-2.31-5.38-4.74.38-2.43 3.66-4.5 6.41-4.74 2.75-.24 2.73 2.47 3.11 4.9z" />
          <path d="M9.5 25.5A.5.5 0 1 1 9 25a.5.5 0 0 1 .5.5" fill={isWhite ? "#000" : "#fff"} stroke="none" />
          <path d="M15 15.5c4.5 2 7 8 7 8" fill="none" />
        </g>
      </svg>
    );
  }

  if (type === 'bishop') {
    return (
      <svg viewBox="0 0 45 45" width="100%" height="100%">
        <g fill={fill} stroke={stroke} strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round">
          <path d="M9 36c3.39 7 21.61 7 25 0h-25zM15 32c2.5 2.5 12.5 2.5 15 0 .5-1.5 0-2 0-2 0-2.5-2.5-4-2.5-4 5.5-1.5 6-11.5-5-15.5-11 4-10.5 14-5 15.5 0 0-2.5 1.5-2.5 4 0 0-.5.5 0 2z" />
          <path d="M25 8a2.5 2.5 0 1 1-5 0 2.5 2.5 0 0 1 5 0" />
          <path d="M17.5 26h10M15 30h15m-7.5-14.5v5M20 18h5" fill="none" />
        </g>
      </svg>
    );
  }

  if (type === 'queen') {
    return (
      <svg viewBox="0 0 45 45" width="100%" height="100%">
        <g fill={fill} stroke={stroke} strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round">
          <path d="M8 12a2 2 0 1 1-4 0 2 2 0 0 1 4 0m10-4a2 2 0 1 1-4 0 2 2 0 0 1 4 0m10 0a2 2 0 1 1-4 0 2 2 0 0 1 4 0m10 4a2 2 0 1 1-4 0 2 2 0 0 1 4 0m-15 10a2 2 0 1 1-4 0 2 2 0 0 1 4 0" />
          <path d="M9 26c8.5-1.5 21-1.5 27 0l2-12-7 11V11l-5.5 13.5-3-15-3 15-5.5-13.5V25l-7-11 2 12z" />
          <path d="M9 26c0 2 1.5 2 2.5 4 2.5 5 21.5 5 24 0 1-2 2.5-2 2.5-4-8.5-1.5-18.5-1.5-26.5 0" />
          <path d="M11.5 30c3.5-1 18.5-1 22 0m-22 3.5c3.5-1 18.5-1 22 0m-22 3.5c3.5-1 18.5-1 22 0" fill="none" />
        </g>
      </svg>
    );
  }

  if (type === 'king') {
    return (
      <svg viewBox="0 0 45 45" width="100%" height="100%">
        <g fill={fill} stroke={stroke} strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round">
          <path d="M22.5 11.63V6M20 8h5" fill="none" />
          <path d="M22.5 25s4.5-7.5 4.5-11a4.5 4.5 0 1 0-9 0c0 3.5 4.5 11 4.5 11" />
          <path d="M11.5 37c5.5 3.5 15.5 3.5 21 0v-7s9-4.5 9-10.5c0-6-9-10.5-9-10.5V11h-21v5s-9 4.5-9 10.5c0 6 9 10.5 9 10.5v7" />
          <path d="M11.5 30c5.5-3 15.5-3 21 0m-21 3.5c5.5-3 15.5-3 21 0m-21 3.5c5.5-3 15.5-3 21 0" fill="none" />
        </g>
      </svg>
    );
  }

  return null;
}

const ChessPiece = React.memo(({ type, color, isSelected, isDragging, style = 'anime', glowEnabled }: ChessPieceProps) => {
  const [loaded, setLoaded] = useState(true); // Default to true to avoid flash
  const glowColor = PIECE_GLOW[type];

  if (style === 'classic') {
    return (
      <div style={{
        width: '100%',
        height: '100%',
        position: 'relative',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '10%',
        opacity: isDragging ? 0.35 : 1,
        transform: isSelected ? 'scale(1.1) translateY(-4px)' : 'scale(1)',
        transition: 'transform 0.12s ease, opacity 0.1s ease',
      }}>
        <ClassicSVG type={type} color={color} />
      </div>
    );
  }

  const src = `/pieces/${color}_${type}.png`;
  const shadowGlow = `drop-shadow(0 2px 5px rgba(0,0,0,0.4))`;
  const filter = `saturate(1.55) brightness(1.12) contrast(1.08) ${shadowGlow}`;

  return (
    <div style={{
      width: '100%',
      height: '100%',
      position: 'relative',
      display: 'flex',
      alignItems: 'flex-end',
      justifyContent: 'center',
      pointerEvents: 'none',
      padding: '8%',
      opacity: isDragging ? 0.35 : 1,
      transition: 'opacity 0.1s ease',
    }}>
      <img
        src={src}
        alt={`${color} ${type}`}
        style={{
          width: '100%',
          height: `${PIECE_SIZE_ADJUST[type] * 100}%`,
          objectFit: 'contain',
          objectPosition: 'bottom center',
          imageRendering: 'crisp-edges',
          filter,
          opacity: 1,
          transition: 'opacity 0.2s ease, transform 0.12s ease',
          transform: isSelected ? `scale(1.1) translateY(-4px)` : `scale(1)`,
        }}
      />
      <div style={{
        position: 'absolute',
        bottom: '8%',
        left: '25%',
        right: '25%',
        height: '2px',
        borderRadius: '2px',
        background: color === 'white'
          ? `linear-gradient(90deg, transparent, ${glowColor}, transparent)`
          : `linear-gradient(90deg, transparent, #8b5cf6, transparent)`,
        filter: 'blur(1px)',
        opacity: 0.7,
      }} />
    </div>
  );
});

export default ChessPiece;
