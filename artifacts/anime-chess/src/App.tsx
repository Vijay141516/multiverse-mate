import React, { useState } from 'react';
import MenuPage from './pages/MenuPage';
import GamePage from './pages/GamePage';
import OnlineLobbyPage from './pages/OnlineLobbyPage';
import { GameMode, PlayerMode } from './hooks/useChessGame';
import { Color } from './lib/chess';
import { BoardTheme } from './components/Board';
import { PieceStyle } from './components/ChessPiece';
import { sounds } from './lib/sounds';

type Screen = 'menu' | 'game' | 'online';

interface GameConfig {
  mode: GameMode;
  playerMode: PlayerMode;
  playerColor: Color;
  playerName: string;
  autoMatchmaking?: boolean;
  aiDepth?: number;
}

export default function App() {
  const [screen, setScreen] = useState<Screen>('menu');
  const [config, setConfig] = useState<GameConfig>({
    mode: 'classic',
    playerMode: 'ai',
    playerColor: 'white',
    playerName: localStorage.getItem('anime_chess_player_name') || 'Player',
    aiDepth: Number(localStorage.getItem('anime_chess_ai_depth') || '3'),
  });
  const [boardTheme, setBoardTheme] = useState<BoardTheme>(
    (localStorage.getItem('anime_chess_theme') as BoardTheme) || 'anime'
  );
  const [animationsEnabled, setAnimationsEnabled] = useState(
    localStorage.getItem('anime_chess_animations') !== 'false'
  );
  const [pieceStyle, setPieceStyle] = useState<PieceStyle>(
    (localStorage.getItem('anime_chess_piece_style') as PieceStyle) || 'anime'
  );
  const [volume, setVolume] = useState(
    Number(localStorage.getItem('anime_chess_volume') || '0.5')
  );
  const [classicGlowEnabled, setClassicGlowEnabled] = useState(
    localStorage.getItem('anime_chess_classic_glow') === 'true'
  );

  const handleThemeChange = (t: BoardTheme) => {
    setBoardTheme(t);
    localStorage.setItem('anime_chess_theme', t);
  };

  const handleToggleAnimations = () => {
    setAnimationsEnabled(prev => {
      const next = !prev;
      localStorage.setItem('anime_chess_animations', String(next));
      return next;
    });
  };

  const handleTogglePieceStyle = () => {
    setPieceStyle(prev => {
      const next = prev === 'anime' ? 'classic' : 'anime';
      localStorage.setItem('anime_chess_piece_style', next);
      
      // If switching to classic, disable animations automatically
      if (next === 'classic') {
        setAnimationsEnabled(false);
        localStorage.setItem('anime_chess_animations', 'false');
      } else {
        // If switching to anime, disable classic glow automatically
        setClassicGlowEnabled(false);
        localStorage.setItem('anime_chess_classic_glow', 'false');
      }
      
      return next;
    });
  };

  const handleVolumeChange = (v: number) => {
    setVolume(v);
    sounds.setVolume(v);
  };

  const handleToggleClassicGlow = () => {
    setClassicGlowEnabled(prev => {
      const next = !prev;
      localStorage.setItem('anime_chess_classic_glow', String(next));
      return next;
    });
  };

  const handleStart = (cfg: GameConfig) => {
    localStorage.setItem('anime_chess_player_name', cfg.playerName);
    if (cfg.aiDepth) localStorage.setItem('anime_chess_ai_depth', String(cfg.aiDepth));
    setConfig(cfg);
    if (cfg.playerMode === 'online') {
      setScreen('online');
      return;
    }
    setScreen('game');
  };

  if (screen === 'game') return (
    <GamePage
      mode={config.mode}
      playerMode={config.playerMode}
      playerColor={config.playerColor}
      playerName={config.playerName}
      boardTheme={boardTheme}
      animationsEnabled={animationsEnabled}
      pieceStyle={pieceStyle}
      classicGlowEnabled={classicGlowEnabled}
      onBack={() => setScreen('menu')}
    />
  );

  if (screen === 'online') return (
    <OnlineLobbyPage
      onBack={() => setScreen('menu')}
      playerName={config.playerName}
      animationsEnabled={animationsEnabled}
      pieceStyle={pieceStyle}
      classicGlowEnabled={classicGlowEnabled}
      autoMatchmaking={config.autoMatchmaking}
    />
  );

  return (
    <MenuPage
      onStart={handleStart}
      initialName={config.playerName}
      boardTheme={boardTheme}
      onThemeChange={handleThemeChange}
      animationsEnabled={animationsEnabled}
      onToggleAnimations={handleToggleAnimations}
      pieceStyle={pieceStyle}
      onTogglePieceStyle={handleTogglePieceStyle}
      volume={volume}
      onVolumeChange={handleVolumeChange}
      classicGlowEnabled={classicGlowEnabled}
      onToggleClassicGlow={handleToggleClassicGlow}
    />
  );
}
