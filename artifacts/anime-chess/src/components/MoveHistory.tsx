import React, { useEffect, useRef } from 'react';
import { Move, posToAlgebraic, FullAnalysis, MoveAnalysis, MoveQuality } from '../lib/chess';

function formatMove(move: Move): string {
  const from = posToAlgebraic(move.from);
  const to = posToAlgebraic(move.to);
  const capture = move.captured ? 'x' : '-';
  const promo = move.promotion ? `=${move.promotion[0].toUpperCase()}` : '';
  return `${from}${capture}${to}${promo}`;
}

interface MoveHistoryProps {
  moves: Move[];
  viewIndex: number | null;
  onMoveClick: (index: number | null) => void;
  analysis?: FullAnalysis | null;
  isAnalyzing?: boolean;
  analysisProgress?: number;
}

const QUALITY_COLORS: Record<MoveQuality, string> = {
  best: '#00eb7a',      // Vibrant Green
  great: '#00bfff',     // Blue
  book: '#d1b000',      // Yellow/Gold
  good: '#96af8b',      // Sage Green
  inaccuracy: '#f0c15c', // Tan/Orange
  mistake: '#ffa459',    // Orange
  blunder: '#fa412d'     // Red
};

const QUALITY_ICONS: Record<MoveQuality, string> = {
  best: '!!',
  great: '!',
  book: '📖',
  good: '',
  inaccuracy: '?!',
  mistake: '?',
  blunder: '??'
};

const SummaryCard = ({ analysis, onQualityClick }: { analysis: FullAnalysis, onQualityClick: (color: 'white' | 'black', q: MoveQuality) => void }) => (
  <div className="mx-3 mt-2 p-4 rounded-xl bg-white/[0.03] border border-white/10 space-y-4 overflow-hidden shadow-lg">
    <div className="flex justify-between items-center gap-3">
      <div className="text-center flex-1 min-w-0">
        <p className="text-[10px] font-bold text-white/20 uppercase tracking-widest mb-1 truncate">White</p>
        <div className="text-2xl sm:text-3xl font-black text-white tabular-nums">{analysis.accuracy.white}%</div>
      </div>
      <div className="px-2 py-1 rounded bg-white/5 border border-white/10 text-white/20 font-mono text-[9px] uppercase tracking-tighter flex-shrink-0">
        Accuracy
      </div>
      <div className="text-center flex-1 min-w-0">
        <p className="text-[10px] font-bold text-white/20 uppercase tracking-widest mb-1 truncate">Black</p>
        <div className="text-2xl sm:text-3xl font-black text-white tabular-nums">{analysis.accuracy.black}%</div>
      </div>
    </div>

    <div className="grid grid-cols-2 gap-x-4 gap-y-2 pt-3 border-t border-white/5">
      {(['best', 'great', 'blunder'] as MoveQuality[]).map(q => (
        <React.Fragment key={q}>
          <button 
            onClick={() => onQualityClick('white', q)}
            className="flex items-center justify-between text-[10px] font-bold hover:bg-white/5 active:bg-white/10 p-1.5 rounded-lg transition-all min-w-0 border border-transparent hover:border-white/5"
          >
            <span style={{ color: QUALITY_COLORS[q] }} className="uppercase tracking-tighter truncate mr-2">
              {QUALITY_ICONS[q]} {q}
            </span>
            <span className="text-white/40 tabular-nums flex-shrink-0 font-mono">{analysis.counts.white[q]}</span>
          </button>
          <button 
            onClick={() => onQualityClick('black', q)}
            className="flex items-center justify-between text-[10px] font-bold hover:bg-white/5 active:bg-white/10 p-1.5 rounded-lg transition-all min-w-0 border border-transparent hover:border-white/5"
          >
            <span className="text-white/40 tabular-nums flex-shrink-0 font-mono">{analysis.counts.black[q]}</span>
            <span style={{ color: QUALITY_COLORS[q] }} className="uppercase tracking-tighter ml-2 truncate text-right">
              {q} {QUALITY_ICONS[q]}
            </span>
          </button>
        </React.Fragment>
      ))}
    </div>
  </div>
);

export default function MoveHistory({ 
  moves, viewIndex, onMoveClick, analysis, isAnalyzing, analysisProgress = 0 
}: MoveHistoryProps) {
  const endRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (viewIndex === null) {
      endRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [moves.length, viewIndex]);

  const pairs: [Move, Move | undefined][] = [];
  for (let i = 0; i < moves.length; i += 2) {
    pairs.push([moves[i], moves[i + 1]]);
  }

  // currentIndex: null means live, -1 means start, 0..N-1 are moves
  const handleBack = () => {
    if (moves.length === 0) return;
    
    if (viewIndex === null) {
      // If we are at LIVE, first back click goes to the last move (N-1)
      onMoveClick(moves.length - 1);
    } else if (viewIndex > -1) {
      // Otherwise, go back one move
      onMoveClick(viewIndex - 1);
    }
  };

  const handleFront = () => {
    if (viewIndex === null) return; // Already at LIVE
    
    if (viewIndex >= moves.length - 1) {
      // If we are at the last move, next front click goes to LIVE
      onMoveClick(null);
    } else {
      // Otherwise, go forward one move
      onMoveClick(viewIndex + 1);
    }
  };

  // For highlighting the list
  const highlightIndex = viewIndex === null ? moves.length - 1 : viewIndex;

  const handleQualityClick = (color: 'white' | 'black', q: MoveQuality) => {
    if (!analysis) return;
    const isWhite = color === 'white';
    const idx = analysis.moves.findIndex((m, i) => (i % 2 === 0) === isWhite && m.quality === q);
    if (idx !== -1) onMoveClick(idx);
  };

  return (
    <div className="flex flex-col h-full bg-[#0B0E14] border-t border-white/5">
      <div className="px-4 py-3 border-b border-white/5 bg-white/[0.01] flex justify-between items-center">
        <h3 className="text-[10px] font-black text-white/30 uppercase tracking-[0.3em]">Game History</h3>
        {viewIndex === null && moves.length > 0 && !isAnalyzing && (
          <div className="flex items-center gap-1.5">
            <div className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse" />
            <span className="text-[9px] font-black text-green-500/80 uppercase">Live</span>
          </div>
        )}
      </div>

      {isAnalyzing && (
        <div className="mx-3 mt-3 px-4 py-3 bg-white/[0.03] border border-white/10 rounded-xl relative overflow-hidden flex-shrink-0 shadow-lg">
          <div className="flex justify-between items-center mb-2">
            <div className="flex items-center gap-2">
              <div className="w-1.5 h-1.5 rounded-full bg-purple-500 animate-pulse" />
              <span className="text-[10px] font-black text-white/40 uppercase tracking-widest">Evaluating</span>
            </div>
            <span className="text-[10px] font-mono text-purple-400 font-bold tabular-nums">{analysisProgress}%</span>
          </div>
          <div className="h-1 w-full bg-white/5 rounded-full overflow-hidden">
            <div 
              className="h-full bg-gradient-to-r from-purple-600 to-purple-400 transition-all duration-300 ease-out"
              style={{ 
                width: `${analysisProgress}%`,
                transform: 'translate3d(0,0,0)',
                willChange: 'width'
              }}
            />
          </div>
        </div>
      )}

      {analysis && <SummaryCard analysis={analysis} onQualityClick={handleQualityClick} />}

      <div className="flex-1 overflow-y-auto px-4 py-4 space-y-1 custom-scrollbar">
        {/* Start Position Shortcut */}
        <button 
          onClick={() => onMoveClick(-1)}
          className={`w-full text-center py-1.5 rounded-md text-[9px] font-black uppercase tracking-[0.2em] border transition-all ${
            viewIndex === -1 
              ? 'bg-white/10 text-white border-white/20' 
              : 'text-white/10 border-transparent hover:text-white/20'
          }`}
        >
          Begin
        </button>

        {pairs.map(([white, black], i) => {
          const whiteIdx = i * 2;
          const blackIdx = i * 2 + 1;
          const whiteAnalysis = analysis?.[whiteIdx];
          const blackAnalysis = analysis?.[blackIdx];
          
          return (
            <div key={i} className="flex items-center gap-2 py-0.5">
              <span className="text-white/10 w-6 text-right font-mono text-[10px]">{i + 1}.</span>
              <button 
                onClick={() => onMoveClick(whiteIdx)}
                className={`flex-1 text-center py-2 rounded-md font-mono text-[11px] transition-all border relative overflow-hidden ${
                  viewIndex === whiteIdx
                    ? 'bg-blue-600 border-blue-400 text-white font-bold' 
                    : 'bg-white/[0.03] border-transparent text-white/50 hover:bg-white/10 hover:text-white'
                }`}
              >
                {formatMove(white)}
                {whiteAnalysis && (
                  <span className="absolute top-0 right-1 text-[8px] font-black" style={{ color: QUALITY_COLORS[whiteAnalysis.quality] }}>
                    {QUALITY_ICONS[whiteAnalysis.quality]}
                  </span>
                )}
              </button>
              {black && (
                <button 
                  onClick={() => onMoveClick(blackIdx)}
                  className={`flex-1 text-center py-2 rounded-md font-mono text-[11px] transition-all border relative overflow-hidden ${
                    viewIndex === blackIdx
                      ? 'bg-blue-600 border-blue-400 text-white font-bold' 
                      : 'bg-white/[0.03] border-transparent text-white/40 hover:bg-white/10 hover:text-white'
                  }`}
                >
                  {formatMove(black)}
                  {blackAnalysis && (
                    <span className="absolute top-0 right-1 text-[8px] font-black" style={{ color: QUALITY_COLORS[blackAnalysis.quality] }}>
                      {QUALITY_ICONS[blackAnalysis.quality]}
                    </span>
                  )}
                </button>
              )}
            </div>
          );
        })}
        <div ref={endRef} />
      </div>

      <div className="p-4 bg-white/[0.03] border-t border-white/10 flex gap-4">
        <button 
          onClick={handleBack}
          disabled={moves.length === 0 || viewIndex === -1}
          className="flex-1 h-16 flex items-center justify-center rounded-xl bg-white/5 border border-white/10 text-white/70 hover:bg-white/10 hover:text-white transition-all disabled:opacity-5 disabled:cursor-not-allowed text-2xl font-light active:scale-95"
          style={{ transform: 'translate3d(0,0,0)', backfaceVisibility: 'hidden' }}
        >
          ←
        </button>

        <button 
          onClick={handleFront}
          disabled={viewIndex === null}
          className="flex-1 h-16 flex items-center justify-center rounded-xl bg-blue-600/90 border border-blue-400/50 text-white hover:bg-blue-600 transition-all disabled:opacity-5 disabled:cursor-not-allowed text-2xl font-light shadow-lg shadow-blue-900/20 active:scale-95"
          style={{ transform: 'translate3d(0,0,0)', backfaceVisibility: 'hidden' }}
        >
          →
        </button>
      </div>
    </div>
  );
}
