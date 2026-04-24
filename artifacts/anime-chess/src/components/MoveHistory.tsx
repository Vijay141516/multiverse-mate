import React, { useEffect, useRef } from 'react';
import { Move, Piece, Color } from '../lib/chess';
import { posToAlgebraic } from '../lib/chess';

interface MoveHistoryProps {
  moves: Move[];
  board?: any;
}

function formatMove(move: Move, index: number): string {
  const from = posToAlgebraic(move.from);
  const to = posToAlgebraic(move.to);
  const capture = move.captured ? 'x' : '-';
  const promo = move.promotion ? `=${move.promotion[0].toUpperCase()}` : '';
  return `${from}${capture}${to}${promo}`;
}

export default function MoveHistory({ moves }: MoveHistoryProps) {
  const endRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [moves.length]);

  const pairs: [Move, Move | undefined][] = [];
  for (let i = 0; i < moves.length; i += 2) {
    pairs.push([moves[i], moves[i + 1]]);
  }

  return (
    <div className="flex flex-col h-full">
      <div className="text-[10px] font-semibold text-white/30 uppercase tracking-widest px-3 py-2 border-b border-white/5">
        Move History
      </div>
      <div className="flex-1 overflow-y-auto px-3 py-2 space-y-0.5">
        {pairs.length === 0 && (
          <p className="text-[11px] text-white/20 text-center py-4">No moves yet</p>
        )}
        {pairs.map(([white, black], i) => (
          <div key={i} className="flex items-center gap-2 text-[11px] font-mono">
            <span className="text-white/25 w-6 text-right shrink-0">{i + 1}.</span>
            <span className="text-white/70 w-16">{formatMove(white, i * 2)}</span>
            {black && (
              <span className="text-white/50 w-16">{formatMove(black, i * 2 + 1)}</span>
            )}
          </div>
        ))}
        <div ref={endRef} />
      </div>
    </div>
  );
}
