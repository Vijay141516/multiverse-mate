import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Color } from '../lib/chess';
import type { BoardTheme } from '../components/Board';
import { GameMode, PlayerMode } from '../hooks/useChessGame';

interface MenuPageProps {
  onStart: (config: { mode: GameMode; playerMode: PlayerMode; playerColor: Color; playerName: string }) => void;
  initialName?: string;
  boardTheme: BoardTheme;
  onThemeChange: (t: BoardTheme) => void;
}

const ACCENT_COLORS = [
  { name: 'Purple', value: '#a855f7', glow: 'rgba(168,85,247,0.4)' },
  { name: 'Blue', value: '#3b82f6', glow: 'rgba(59,130,246,0.4)' },
  { name: 'Cyan', value: '#06b6d4', glow: 'rgba(6,182,212,0.4)' },
  { name: 'Red', value: '#ef4444', glow: 'rgba(239,68,68,0.4)' },
  { name: 'Gold', value: '#eab308', glow: 'rgba(234,179,8,0.4)' },
  { name: 'Green', value: '#22c55e', glow: 'rgba(34,197,94,0.4)' },
];

const CHARACTERS = [
  { piece: 'PAWN', name: 'Zetsu', file: 'pawn', color: '#22c55e', ability: 'Spore Release' },
  { piece: 'KNIGHT', name: 'Minato', file: 'knight', color: '#eab308', ability: 'Flying Thunder God' },
  { piece: 'BISHOP', name: 'Aizen', file: 'bishop', color: '#8b5cf6', ability: 'Kyoka Suigetsu' },
  { piece: 'ROOK', name: 'All Might', file: 'rook', color: '#3b82f6', ability: 'Detroit Smash' },
  { piece: 'QUEEN', name: 'Gojo', file: 'queen', color: '#a855f7', ability: 'Hollow Purple' },
  { piece: 'KING', name: 'Lelouch', file: 'king', color: '#ef4444', ability: 'Geass Command' },
];

export default function MenuPage({ onStart, initialName = 'Player', boardTheme, onThemeChange }: MenuPageProps) {
  const [accent, setAccent] = useState(ACCENT_COLORS[0]);
  const [mode, setMode] = useState<GameMode>('classic');
  const [playerColor, setPlayerColor] = useState<Color>('white');
  const [selectedIndex, setSelectedIndex] = useState(4); // Default to Gojo
  const [playerName, setPlayerName] = useState(initialName);
  const [showSettings, setShowSettings] = useState(false);
  const [premovesEnabled, setPremovesEnabled] = useState(() => localStorage.getItem('anime_chess_premoves') === 'true');

  const handleTogglePremoves = () => {
    setPremovesEnabled(p => {
      const next = !p;
      localStorage.setItem('anime_chess_premoves', String(next));
      return next;
    });
  };



  const activeChar = CHARACTERS[selectedIndex];

  return (
    <div className="min-h-[100dvh] w-full flex items-stretch" style={{ background: '#080A12' }}>

      {/* ── Left panel: character showcase ── */}
      <div
        className="hidden lg:flex flex-col items-stretch justify-between flex-1 relative overflow-hidden"
        style={{ background: 'radial-gradient(circle at 30% 50%, #111827 0%, #080A12 100%)' }}
      >
        {/* Animated Background Elements */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute -top-[20%] -left-[10%] w-[60%] h-[60%] opacity-20 blur-[120px] rounded-full"
            style={{ background: activeChar.color }} />
          <div className="absolute -bottom-[20%] right-0 w-[40%] h-[40%] opacity-10 blur-[100px] rounded-full"
            style={{ background: accent.value }} />

          {/* Scanning lines */}
          <div className="absolute inset-0 opacity-[0.03]"
            style={{ backgroundImage: 'linear-gradient(rgba(255,255,255,0.1) 1px, transparent 1px)', backgroundSize: '100% 4px' }} />
        </div>

        {/* Top Label */}
        <div className="relative z-10 px-12 pt-12">
          <div className="flex items-center gap-4">
            <div className="h-px w-12 bg-white/10" />
            <h2 className="text-white/30 text-xs font-black tracking-[0.3em] uppercase">
              Roster Showcase
            </h2>
          </div>
        </div>

        {/* Hero Section */}
        <div className="relative z-10 flex-1 flex flex-col items-center justify-center px-12">
          <div className="relative w-full max-w-2xl h-[500px] flex items-center justify-center">
            {/* Big character image with glow */}
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="w-[80%] h-[80%] rounded-full blur-[100px] opacity-20 animate-pulse"
                style={{ background: activeChar.color }} />
            </div>

            <img
              key={activeChar.file}
              src={`/pieces/${playerColor}_${activeChar.file}.png`}
              alt={activeChar.name}
              className="relative z-10 h-[100%] object-contain drop-shadow-[0_0_50px_rgba(255,255,255,0.2)]"

              style={{
                filter: `saturate(1.2) contrast(1.1) brightness(1.1) drop-shadow(0 20px 60px ${activeChar.color}60)`,
                animation: 'heroPieceIn 0.8s cubic-bezier(0.16, 1, 0.3, 1) forwards'
              }}
            />

            {/* Character Info Overlay */}
            <div className="absolute bottom-4 left-0 text-left">
              <h3 className="text-6xl font-black text-white italic tracking-tighter opacity-90 mb-0">
                {activeChar.name.toUpperCase()}
              </h3>
              <div className="flex items-center gap-3">
                <span className="px-2 py-0.5 rounded bg-white/10 text-[10px] font-bold text-white/60 tracking-widest uppercase border border-white/5">
                  {activeChar.piece}
                </span>
                <span className="text-xs font-bold tracking-widest text-white/40 uppercase">
                  Skill: <span style={{ color: activeChar.color }}>{activeChar.ability}</span>
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Character Navigation */}
        <div className="relative z-10 px-12 pb-12">
          <div className="flex gap-4">
            {CHARACTERS.map((char, idx) => (
              <button
                key={char.file}
                onClick={() => setSelectedIndex(idx)}
                className="group relative flex-1 aspect-[4/5] rounded-xl overflow-hidden border transition-all duration-300"
                style={{
                  background: selectedIndex === idx ? `${char.color}15` : 'rgba(255,255,255,0.02)',
                  borderColor: selectedIndex === idx ? char.color : 'rgba(255,255,255,0.05)',
                  boxShadow: selectedIndex === idx ? `0 0 30px ${char.color}30` : 'none',
                  transform: selectedIndex === idx ? 'scale(1.05) translateY(-5px)' : 'scale(1)',
                }}
              >
                <img
                  src={`/pieces/${playerColor}_${char.file}.png`}
                  alt={char.name}
                  className="w-full h-full object-contain p-2 transition-transform duration-500 group-hover:scale-110"
                  style={{ filter: selectedIndex === idx ? 'none' : 'grayscale(1) opacity(0.3)' }}
                />
                <div className="absolute bottom-0 inset-x-0 h-1"
                  style={{ background: selectedIndex === idx ? char.color : 'transparent' }} />
              </button>
            ))}
          </div>
        </div>
      </div>


      {/* ── Right panel: controls ── */}
      <div
        className="w-full lg:w-[420px] flex flex-col justify-center px-6 py-10 lg:px-8 lg:py-12 relative"
        style={{
          background: 'rgba(15,20,35,0.95)',
          backdropFilter: 'blur(20px)',
          borderLeft: '1px solid rgba(255,255,255,0.05)',
        }}
      >
        {/* Title & Settings */}
        <div className="mb-8 flex items-start justify-between">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <div className="w-2 h-2 rounded-full"
                style={{ background: accent.value, boxShadow: `0 0 8px ${accent.glow}` }} />
              <span className="text-xs font-semibold text-white/30 tracking-widest uppercase">
                Strategy · Anime
              </span>
            </div>
            <h1 className="text-4xl font-black tracking-tight text-white"
              style={{ textShadow: `0 0 40px ${accent.glow}` }}>
              Multiverse Mate
            </h1>
            <p className="text-sm text-white/40 mt-2">Iconic characters. Classic strategy.</p>
          </div>
          <button
            onClick={() => setShowSettings(true)}
            className="p-2 rounded-full hover:bg-white/10 transition-colors mt-2"
            title="Settings"
          >
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-white/50 hover:text-white">
              <circle cx="12" cy="12" r="3"></circle>
              <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"></path>
            </svg>
          </button>
        </div>


        {/* Mobile character strip */}
        <div className="lg:hidden flex gap-3 mb-8 overflow-x-auto pb-2 -mx-2 px-2 scrollbar-hide">
          {CHARACTERS.map(({ file, name, color }, idx) => (
            <div
              key={file}
              onClick={() => setSelectedIndex(idx)}
              className="flex-shrink-0 flex flex-col items-center gap-1.5 cursor-pointer"
            >
              <div
                className="w-16 h-16 rounded-xl overflow-hidden transition-all duration-200"
                style={{
                  background: selectedIndex === idx ? `${color}20` : 'rgba(255,255,255,0.03)',
                  border: `1px solid ${selectedIndex === idx ? color : 'rgba(255,255,255,0.08)'}`,
                  boxShadow: selectedIndex === idx ? `0 0 15px ${color}30` : 'none',
                  transform: selectedIndex === idx ? 'scale(1.05)' : 'scale(1)',
                }}
              >
                <img
                  src={`/pieces/${playerColor}_${file}.png`}
                  alt={name}
                  style={{
                    width: '100%', height: '100%', objectFit: 'contain', padding: '10%',
                    filter: selectedIndex === idx ? 'none' : 'grayscale(1) opacity(0.4)'
                  }}
                />
              </div>
              <span className="text-[10px] font-bold transition-colors"
                style={{ color: selectedIndex === idx ? color : 'rgba(255,255,255,0.3)' }}>
                {name}
              </span>
            </div>
          ))}
        </div>


        {/* Game mode */}
        <div className="space-y-3 mb-6">
          <div className="rounded-xl p-4 border"
            style={{ background: 'rgba(255,255,255,0.02)', borderColor: 'rgba(255,255,255,0.06)' }}>
            <p className="text-[10px] font-bold text-white/30 uppercase tracking-wider mb-3">Game Mode</p>
            <div className="grid grid-cols-2 gap-2">
              {(['classic', 'battle'] as GameMode[]).map(m => (
                <button key={m} onClick={() => setMode(m)}
                  className="relative px-3 py-2.5 rounded-lg text-sm font-semibold transition-all duration-150 capitalize"
                  style={{
                    background: mode === m ? `${accent.value}20` : 'rgba(255,255,255,0.03)',
                    border: `1px solid ${mode === m ? accent.value + '60' : 'rgba(255,255,255,0.06)'}`,
                    color: mode === m ? accent.value : 'rgba(255,255,255,0.5)',
                    boxShadow: mode === m ? `0 0 12px ${accent.glow}` : 'none',
                  }}>
                  {m === 'classic' ? '⚔ Classic' : '✨ Battle'}
                </button>
              ))}
            </div>
            {mode === 'battle' && (
              <p className="text-[10px] text-white/30 mt-2 pl-1">
                Capture animations with signature abilities
              </p>
            )}
          </div>

          {/* Play as */}
          <div className="rounded-xl p-4 border"
            style={{ background: 'rgba(255,255,255,0.02)', borderColor: 'rgba(255,255,255,0.06)' }}>
            <p className="text-[10px] font-bold text-white/30 uppercase tracking-wider mb-3">Play As</p>
            <div className="grid grid-cols-2 gap-2">
              {(['white', 'black'] as Color[]).map(c => (
                <button key={c} onClick={() => setPlayerColor(c)}
                  className="px-3 py-2.5 rounded-lg text-sm font-semibold transition-all duration-150 capitalize"
                  style={{
                    background: playerColor === c ? `${accent.value}20` : 'rgba(255,255,255,0.03)',
                    border: `1px solid ${playerColor === c ? accent.value + '60' : 'rgba(255,255,255,0.06)'}`,
                    color: playerColor === c ? accent.value : 'rgba(255,255,255,0.5)',
                    boxShadow: playerColor === c ? `0 0 12px ${accent.glow}` : 'none',
                  }}>
                  {c === 'white' ? '○ White' : '● Black'}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Play buttons */}
        <div className="space-y-2.5 mb-6">
          <button
            onClick={() => onStart({ mode, playerMode: 'ai', playerColor, playerName })}

            className="w-full py-3.5 rounded-xl text-sm font-bold tracking-wide transition-all duration-200 hover:scale-[1.01] active:scale-[0.99]"
            style={{
              background: `linear-gradient(135deg, ${accent.value}, ${accent.value}cc)`,
              color: 'white',
              boxShadow: `0 4px 20px ${accent.glow}, inset 0 1px 0 rgba(255,255,255,0.15)`,
            }}>
            ▶ Play vs AI
          </button>
          <button
            onClick={() => onStart({ mode, playerMode: 'local', playerColor, playerName })}

            className="w-full py-3 rounded-xl text-sm font-semibold transition-all duration-200 hover:scale-[1.01] active:scale-[0.99]"
            style={{
              background: 'rgba(255,255,255,0.04)',
              border: '1px solid rgba(255,255,255,0.1)',
              color: 'rgba(255,255,255,0.7)',
            }}>
            👥 Local 2 Player
          </button>
          <button
            onClick={() => onStart({ mode, playerMode: 'online', playerColor, playerName })}

            className="w-full py-3 rounded-xl text-sm font-semibold transition-all duration-200 hover:scale-[1.01] active:scale-[0.99]"
            style={{
              background: 'rgba(59,130,246,0.1)',
              border: '1px solid rgba(59,130,246,0.3)',
              color: 'rgba(96,165,250,0.9)',
            }}>
            🌐 Play Online
            <span className="ml-2 text-[10px] opacity-60">Room code</span>
          </button>
        </div>

      </div>

      {/* ── Settings Modal ── */}
      <AnimatePresence>
        {showSettings && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6"
            style={{ background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(12px)' }}
            onClick={() => setShowSettings(false)}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.95, opacity: 0, y: 20 }}
              className="w-full max-w-md rounded-2xl border p-6 shadow-2xl relative"
              style={{
                background: 'rgba(15,20,35,0.95)',
                borderColor: 'rgba(255,255,255,0.1)',
                boxShadow: `0 0 50px ${accent.glow}`,
              }}
              onClick={e => e.stopPropagation()}
            >
              <button
                onClick={() => setShowSettings(false)}
                className="absolute top-4 right-4 text-white/40 hover:text-white transition-colors"
              >
                ✕
              </button>

              <h2 className="text-xl font-black text-white mb-6 border-b border-white/5 pb-4">Game Settings</h2>

              {/* Premoves Toggle */}
              <div className="mb-6 flex items-center justify-between bg-white/5 border border-white/10 rounded-lg p-3">
                <div>
                  <p className="text-[11px] font-bold text-white uppercase tracking-wider mb-0.5">Premoves</p>
                  <p className="text-[9px] text-white/40">Queue moves during opponent's turn</p>
                </div>
                <button 
                  onClick={handleTogglePremoves} 
                  className={`w-10 h-5 rounded-full relative transition-colors ${premovesEnabled ? 'bg-green-500' : 'bg-white/10'}`}
                >
                  <div className={`absolute top-[2px] w-4 h-4 rounded-full bg-white transition-all ${premovesEnabled ? 'left-[22px]' : 'left-[2px]'}`} />
                </button>
              </div>

              {/* Name input */}
              <div className="mb-6">
                <p className="text-[10px] font-bold text-white/40 uppercase tracking-wider mb-2">Player Identity</p>
                <input
                  type="text"
                  maxLength={14}
                  value={playerName}
                  onChange={(e) => setPlayerName(e.target.value)}
                  className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-3 text-white text-sm font-semibold focus:outline-none focus:border-white/30 transition-colors"
                  placeholder="Enter name..."
                  style={{ boxShadow: `inset 0 2px 4px rgba(0,0,0,0.2)` }}
                />
              </div>

              {/* Board Theme */}
              <div className="mb-6">
                <p className="text-[10px] font-bold text-white/40 uppercase tracking-wider mb-3">Board Theme</p>
                <div className="grid grid-cols-2 gap-3">
                  {([
                    { id: 'anime', label: 'Anime', light: '#2d2040', dark: '#1a1228', desc: 'Dark mystic' },
                    { id: 'classic', label: 'Classic', light: '#eeeed2', dark: '#769656', desc: 'OG green' },
                  ] as const).map(t => (
                    <button
                      key={t.id}
                      onClick={() => onThemeChange(t.id)}
                      style={{
                        position: 'relative',
                        padding: '12px 8px',
                        borderRadius: '12px',
                        border: boardTheme === t.id
                          ? `1px solid ${accent.value}80`
                          : '1px solid rgba(255,255,255,0.07)',
                        background: boardTheme === t.id
                          ? `linear-gradient(135deg, ${accent.value}18, ${accent.value}08)`
                          : 'rgba(255,255,255,0.03)',
                        boxShadow: boardTheme === t.id
                          ? `0 0 16px ${accent.glow}, inset 0 1px 0 rgba(255,255,255,0.08)`
                          : 'none',
                        cursor: 'pointer',
                        transition: 'all 0.2s ease',
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        gap: '8px',
                      }}
                    >
                      <div style={{
                        display: 'grid',
                        gridTemplateColumns: 'repeat(4,1fr)',
                        width: '48px',
                        height: '48px',
                        borderRadius: '6px',
                        overflow: 'hidden',
                        border: `1px solid rgba(255,255,255,0.1)`,
                        boxShadow: boardTheme === t.id ? `0 0 8px ${accent.glow}` : 'none',
                      }}>
                        {Array.from({ length: 16 }, (_, i) => (
                          <div key={i} style={{ background: (Math.floor(i / 4) + i) % 2 === 0 ? t.light : t.dark }} />
                        ))}
                      </div>
                      <div className="text-center">
                        <div style={{
                          fontSize: '11px',
                          fontWeight: 700,
                          color: boardTheme === t.id ? accent.value : 'rgba(255,255,255,0.5)',
                          letterSpacing: '0.05em',
                          textTransform: 'uppercase',
                        }}>{t.label}</div>
                        <div style={{ fontSize: '9px', color: 'rgba(255,255,255,0.3)', marginTop: '2px' }}>{t.desc}</div>
                      </div>
                      {boardTheme === t.id && (
                        <div style={{
                          position: 'absolute', top: '8px', right: '8px',
                          width: '6px', height: '6px', borderRadius: '50%',
                          background: accent.value,
                          boxShadow: `0 0 6px ${accent.value}`,
                        }} />
                      )}
                    </button>
                  ))}
                </div>
              </div>

              {/* Accent Color */}
              <div>
                <p className="text-[10px] font-bold text-white/40 uppercase tracking-wider mb-3">Accent Color</p>
                <div className="flex flex-wrap gap-3">
                  {ACCENT_COLORS.map(c => (
                    <button key={c.name} onClick={() => setAccent(c)}
                      className="w-8 h-8 rounded-full transition-all duration-200"
                      style={{
                        background: c.value,
                        boxShadow: accent.name === c.name ? `0 0 15px ${c.glow}, 0 0 0 2px rgba(15,20,35,0.95), 0 0 0 4px ${c.value}` : 'none',
                        transform: accent.name === c.name ? 'scale(1.15)' : 'scale(1)',
                      }}
                      title={c.name}
                    />
                  ))}
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
