import { PieceType, Color } from './chess';

const PIECE_ORDER: PieceType[] = ['pawn', 'knight', 'bishop', 'rook', 'queen', 'king'];

export function getSpriteStyle(type: PieceType, color: Color): Record<string, string | number> {
  const colIndex = PIECE_ORDER.indexOf(type);
  const rowIndex = color === 'white' ? 0 : 1;

  const xPercent = colIndex === 0 ? 0 : (colIndex / (PIECE_ORDER.length - 1)) * 100;
  const yPercent = rowIndex === 0 ? 0 : 100;

  return {
    backgroundImage: `url('/pieces-sprite-sheet.png')`,
    backgroundSize: '600% 200%',
    backgroundPosition: `${xPercent}% ${yPercent}%`,
    imageRendering: 'pixelated',
    width: '100%',
    height: '100%',
  };
}

export const CHARACTER_NAMES: Record<PieceType, string> = {
  pawn: 'Zetsu',
  knight: 'Minato',
  bishop: 'Aizen',
  rook: 'All Might',
  queen: 'Gojo',
  king: 'Lelouch',
};

export const PIECE_LABELS: Record<PieceType, string> = {
  pawn: 'PAWN',
  knight: 'KNIGHT',
  bishop: 'BISHOP',
  rook: 'ROOK',
  queen: 'QUEEN',
  king: 'KING',
};

export const ABILITY_DESCRIPTIONS: Record<PieceType, { name: string; desc: string; color: string }> = {
  pawn: {
    name: 'Spore Release',
    desc: 'Zetsu fuses with terrain — moves unleash a subtle growth aura',
    color: '#22c55e',
  },
  knight: {
    name: 'Flying Thunder God',
    desc: 'Minato teleports across the field with yellow flash afterimages',
    color: '#eab308',
  },
  bishop: {
    name: 'Kyoka Suigetsu',
    desc: 'Aizen bends light — captures show illusion shatter effect',
    color: '#8b5cf6',
  },
  rook: {
    name: 'Detroit Smash',
    desc: 'All Might stands unbreakable — captures radiate shockwave rings',
    color: '#3b82f6',
  },
  queen: {
    name: 'Infinity',
    desc: 'Gojo controls space itself — moves pulse with hollow purple energy',
    color: '#a855f7',
  },
  king: {
    name: 'Geass Command',
    desc: 'Lelouch commands absolute loyalty — his presence inspires an aura of authority',
    color: '#ef4444',
  },
};
