import React, { useState } from 'react';
import { PieceType, Color } from '../lib/chess';

interface ChessPieceProps {
  type: PieceType;
  color: Color;
  isSelected?: boolean;
  isDragging?: boolean;
}

const PIECE_GLOW: Record<PieceType, string> = {
  pawn: '#22c55e',
  knight: '#eab308',
  bishop: '#8b5cf6',
  rook: '#3b82f6',
  queen: '#a855f7',
  king: '#ef4444',
};

// White pieces: vibrant originals — full saturation and brightness
const WHITE_FILTER = 'saturate(1.55) brightness(1.12) contrast(1.08)';

// Black pieces: now same as white pieces as requested
const BLACK_FILTER =
  'saturate(1.55) brightness(1.12) contrast(1.08)';

const PIECE_SIZE_ADJUST: Record<PieceType, number> = {
  pawn: 0.92,
  knight: 0.92,
  bishop: 0.92,
  rook: 0.92,
  queen: 0.92,
  king: 0.95,
};




export default function ChessPiece({ type, color, isSelected, isDragging }: ChessPieceProps) {
  const [loaded, setLoaded] = useState(false);
  const glow = PIECE_GLOW[type];
  const src = `/pieces/${color}_${type}.png`;

  const shadowGlow = `drop-shadow(0 2px 5px rgba(0,0,0,0.4))`;

  const filter = color === 'white'
    ? `${WHITE_FILTER} ${shadowGlow}`
    : `${BLACK_FILTER} ${shadowGlow}`;


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
        onLoad={() => setLoaded(true)}
        style={{
          width: '100%',
          height: `${PIECE_SIZE_ADJUST[type] * 100}%`,
          objectFit: 'contain',
          objectPosition: 'bottom center',
          imageRendering: 'crisp-edges',
          filter,
          opacity: loaded ? 1 : 0,
          transition: 'opacity 0.2s ease, transform 0.12s ease',
          transform: isSelected ? `scale(1.1) translateY(-4px)` : `scale(1)`,
          animation: loaded ? 'pieceAppear 0.25s ease-out' : 'none',
        }}
      />

      {/* Colour-band indicator: slim bar at the bottom */}
      {loaded && (
        <div style={{
          position: 'absolute',
          bottom: '8%',
          left: '25%',
          right: '25%',
          height: '2px',
          borderRadius: '2px',
          background: color === 'white'
            ? `linear-gradient(90deg, transparent, ${glow}, transparent)`
            : `linear-gradient(90deg, transparent, #8b5cf6, transparent)`,
          filter: 'blur(1px)',
          opacity: 0.7,
        }} />
      )}
    </div>
  );
}
