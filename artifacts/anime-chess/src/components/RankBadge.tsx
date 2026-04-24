import React from 'react';

interface RankBadgeProps {
  rank: string;
  score: number;
  label?: string;
}

const RANK_COLORS: Record<string, { bg: string; text: string; glow: string; label: string }> = {
  S: { bg: 'bg-yellow-500/20', text: 'text-yellow-300', glow: '0 0 12px rgba(234,179,8,0.6)', label: 'DOMINANT' },
  A: { bg: 'bg-purple-500/20', text: 'text-purple-300', glow: '0 0 10px rgba(168,85,247,0.5)', label: 'AHEAD' },
  B: { bg: 'bg-blue-500/20', text: 'text-blue-300', glow: '0 0 8px rgba(59,130,246,0.5)', label: 'LEADING' },
  C: { bg: 'bg-cyan-500/20', text: 'text-cyan-300', glow: '0 0 6px rgba(6,182,212,0.4)', label: 'SLIGHT EDGE' },
  D: { bg: 'bg-slate-500/20', text: 'text-slate-400', glow: 'none', label: 'BALANCED' },
};

export default function RankBadge({ rank, score, label }: RankBadgeProps) {
  const style = RANK_COLORS[rank] || RANK_COLORS.D;

  return (
    <div className="flex items-center gap-2">
      <div
        className={`w-8 h-8 rounded flex items-center justify-center font-black text-sm ${style.bg} ${style.text} border border-current/20`}
        style={{ boxShadow: style.glow, fontFamily: 'monospace' }}
      >
        {rank}
      </div>
      <div className="flex flex-col">
        <span className={`text-xs font-semibold ${style.text}`}>{style.label}</span>
        {score !== 0 && (
          <span className="text-[10px] text-white/40">{score > 0 ? '+' : ''}{score} pts</span>
        )}
      </div>
    </div>
  );
}
