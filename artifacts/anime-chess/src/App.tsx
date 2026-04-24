import React, { useState } from 'react';
import MenuPage from './pages/MenuPage';
import GamePage from './pages/GamePage';
import OnlineLobbyPage from './pages/OnlineLobbyPage';
import { GameMode, PlayerMode } from './hooks/useChessGame';
import { Color } from './lib/chess';
import { BoardTheme } from './components/Board';

type Screen = 'menu' | 'game' | 'online';

interface GameConfig {
  mode: GameMode;
  playerMode: PlayerMode;
  playerColor: Color;
  playerName: string;
}

export default function App() {
  const [screen, setScreen] = useState<Screen>('menu');
  const [config, setConfig] = useState<GameConfig>({
    mode: 'classic',
    playerMode: 'ai',
    playerColor: 'white',
    playerName: localStorage.getItem('anime_chess_name') || 'Player',
  });
  const [boardTheme, setBoardTheme] = useState<BoardTheme>(
    (localStorage.getItem('anime_chess_theme') as BoardTheme) || 'anime'
  );

  const handleThemeChange = (t: BoardTheme) => {
    setBoardTheme(t);
    localStorage.setItem('anime_chess_theme', t);
  };

  const handleStart = (cfg: GameConfig) => {
    localStorage.setItem('anime_chess_name', cfg.playerName);
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
      onBack={() => setScreen('menu')}
    />
  );

  if (screen === 'online') return (
    <OnlineLobbyPage
      onBack={() => setScreen('menu')}
      playerName={config.playerName}
    />
  );

  return (
    <MenuPage
      onStart={handleStart}
      initialName={config.playerName}
      boardTheme={boardTheme}
      onThemeChange={handleThemeChange}
    />
  );
}
