import { useState, useCallback, useEffect, useRef } from 'react';
import {
  GameState,
  Position,
  Move,
  Color,
  PieceType,
  createInitialGameState,
  getLegalMoves,
  executeMove,
  getAllLegalMoves,
  getMaterialScore,
  getDominanceRank,
  getGameStateAtMove,
  analyzeGame,
  FullAnalysis,
} from '../lib/chess';
import { getBestMove } from '../lib/ai';
import { sounds } from '../lib/sounds';
import { runFullAnalysis } from '../lib/analysis';

export type GameMode = 'classic' | 'battle';
export type PlayerMode = 'ai' | 'local' | 'online';

export interface GameConfig {
  mode: GameMode;
  playerMode: PlayerMode;
  playerColor: Color;
  aiDepth: number;
}

export interface CaptureEffect {
  pos: Position;
  attackerType: PieceType;
  attackerColor: Color;
  capturedType: PieceType;
  capturedColor: Color;
}

export interface GameHookState {
  gameState: GameState;
  selectedPos: Position | null;
  legalMoves: Position[];
  lastMove: Move | null;
  isAiThinking: boolean;
  captureEffect: CaptureEffect | null;
  clearCaptureEffect: () => void;
  config: GameConfig;
  premove: Move | null;
  premovesEnabled: boolean;
  togglePremoves: () => void;
  viewIndex: number | null;
  goToMove: (idx: number | null) => void;
  analysis: FullAnalysis | null;
  isAnalyzing: boolean;
  analysisProgress: number;
  runAnalysis: () => void;
}

const DEFAULT_CONFIG: GameConfig = {
  mode: 'classic',
  playerMode: 'ai',
  playerColor: 'white',
  aiDepth: 3,
};

export function useChessGame(initialConfig: Partial<GameConfig> = {}) {
  const config = { ...DEFAULT_CONFIG, ...initialConfig };
  const [realGameState, setRealGameState] = useState<GameState>(createInitialGameState());
  const [viewIndex, setViewIndex] = useState<number | null>(null);
  const [analysis, setAnalysis] = useState<FullAnalysis | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysisProgress, setAnalysisProgress] = useState(0);

  const runAnalysis = useCallback(async () => {
    if (isAnalyzing) return;
    setIsAnalyzing(true);
    setAnalysisProgress(0);
    try {
      const result = await runFullAnalysis(realGameState.moveHistory, (p) => setAnalysisProgress(p));
      setAnalysis(result);
      setViewIndex(0);
    } catch (e) {
      console.error('Analysis failed', e);
    } finally {
      setIsAnalyzing(false);
    }
  }, [realGameState.moveHistory, isAnalyzing]);
  const [selectedPos, setSelectedPos] = useState<Position | null>(null);
  const [legalMoves, setLegalMoves] = useState<Position[]>([]);
  const [lastMove, setLastMove] = useState<Move | null>(null);
  const [isAiThinking, setIsAiThinking] = useState(false);
  const [captureEffect, setCaptureEffect] = useState<CaptureEffect | null>(null);
  const [whiteTime, setWhiteTime] = useState(720); // 12 mins
  const [blackTime, setBlackTime] = useState(720);
  const [isResigned, setIsResigned] = useState(false);
  const [resignedColor, setResignedColor] = useState<Color | null>(null);
  const [premove, setPremove] = useState<Move | null>(null);
  const [premovesEnabled, setPremovesEnabled] = useState(() => localStorage.getItem('anime_chess_premoves') === 'true');
  const aiTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const gameState = viewIndex !== null 
    ? getGameStateAtMove(realGameState.moveHistory, viewIndex + 1)
    : realGameState;

  const goToMove = useCallback((idx: number | null) => {
    // Only go to live (null) if explicitly requested or if index is out of bounds
    if (idx !== null && idx >= realGameState.moveHistory.length) {
      setViewIndex(null);
    } else {
      setViewIndex(idx);
    }
    setSelectedPos(null);
    setLegalMoves([]);
  }, [realGameState.moveHistory.length]);

  const setGameState = useCallback((next: GameState | ((prev: GameState) => GameState)) => {
    setRealGameState(prev => {
      const nextState = typeof next === 'function' ? next(prev) : next;
      return nextState;
    });
    setViewIndex(null);
  }, []);

  const togglePremoves = useCallback(() => {
    setPremovesEnabled(p => {
      const next = !p;
      localStorage.setItem('anime_chess_premoves', String(next));
      return next;
    });
  }, []);

  const aiColor: Color = config.playerColor === 'white' ? 'black' : 'white';

  // Timer Effect
  useEffect(() => {
    if (gameState.isCheckmate || gameState.isStalemate || gameState.isDraw || isResigned || captureEffect || viewIndex !== null) return;
    
    const interval = setInterval(() => {
      if (gameState.currentTurn === 'white') {
        setWhiteTime(t => Math.max(0, t - 1));
      } else {
        setBlackTime(t => Math.max(0, t - 1));
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [gameState.currentTurn, gameState.isCheckmate, gameState.isStalemate, gameState.isDraw, isResigned, captureEffect]);

  // Timeout logic
  useEffect(() => {
    if (whiteTime === 0 || blackTime === 0) {
      // Handle timeout as a loss (simplified for now)
      setIsResigned(true);
      setResignedColor(whiteTime === 0 ? 'white' : 'black');
    }
  }, [whiteTime, blackTime]);

  const resignGame = useCallback((color: Color) => {
    setIsResigned(true);
    setResignedColor(color);
  }, []);

  const triggerCaptureEffect = useCallback((

    pos: Position,
    attackerType: PieceType,
    attackerColor: Color,
    capturedType: PieceType,
    capturedColor: Color,
  ) => {
    const effect: CaptureEffect = { pos, attackerType, attackerColor, capturedType, capturedColor };
    setCaptureEffect(effect);
  }, []);

  const handleSquareClick = useCallback((pos: Position) => {
    if (gameState.isCheckmate || gameState.isStalemate || gameState.isDraw || isResigned || captureEffect || viewIndex !== null) return;

    const piece = gameState.board[pos.row][pos.col];
    const isMyTurn = gameState.currentTurn === config.playerColor || config.playerMode === 'local';

    if (!isMyTurn) {
      if (!premovesEnabled) return;
      
      // Premove logic
      if (selectedPos) {
        const pPiece = gameState.board[selectedPos.row][selectedPos.col];
        // If clicking own piece again, just select it
        if (piece && piece.color === config.playerColor) {
           setSelectedPos(pos);
           setLegalMoves(getLegalMoves(gameState.board, pos, gameState.enPassantTarget, gameState.castlingRights));
           return;
        }

        if (pPiece && pPiece.color === config.playerColor) {
          let finalTo = pos;
          if (pPiece.type === 'king' && piece?.type === 'rook' && pPiece.color === piece.color) {
            if (pos.col === 7) finalTo = { row: pos.row, col: 6 };
            if (pos.col === 0) finalTo = { row: pos.row, col: 2 };
          }
          // Just queue the premove without strict legality check
          setPremove({ from: selectedPos, to: finalTo });
          setSelectedPos(null);
          setLegalMoves([]);
          return;
        }
      }

      if (piece && piece.color === config.playerColor) {
        setSelectedPos(pos);
        setLegalMoves(getLegalMoves(gameState.board, pos, gameState.enPassantTarget, gameState.castlingRights));
      }
      return;
    }

    if (isAiThinking) return;

    if (selectedPos) {
      let finalTo = pos;
      const pPiece = gameState.board[selectedPos.row][selectedPos.col];
      if (pPiece?.type === 'king' && piece?.type === 'rook' && pPiece.color === piece.color) {
        if (pos.col === 7) finalTo = { row: pos.row, col: 6 };
        if (pos.col === 0) finalTo = { row: pos.row, col: 2 };
      }

      const isLegal = legalMoves.some(m => m.row === finalTo.row && m.col === finalTo.col);

      if (isLegal) {
        // Cancel any pending premove when making a real move
        setPremove(null);
        
        const move: Move = { from: selectedPos, to: finalTo };
        const captured = gameState.board[finalTo.row][finalTo.col];
        const attacker = gameState.board[selectedPos.row][selectedPos.col];
        const newState = executeMove(gameState, move);

        if (captured && attacker && captured.color !== attacker.color) {
          sounds.playCapture();
          triggerCaptureEffect(finalTo, attacker.type, attacker.color, captured.type, captured.color);
        } else {
          sounds.playMove();
        }

        if (newState.isCheckmate) sounds.playGameOver();
        else if (newState.isCheck) sounds.playCheck();

        setGameState(newState);
        setLastMove(move);
        setSelectedPos(null);
        setLegalMoves([]);
        return;
      }

      if (piece && piece.color === gameState.currentTurn) {
        setSelectedPos(pos);
        const moves = getLegalMoves(gameState.board, pos, gameState.enPassantTarget, gameState.castlingRights);
        setLegalMoves(moves);
        return;
      }

      setSelectedPos(null);
      setLegalMoves([]);
      return;
    }

    if (piece && piece.color === gameState.currentTurn) {
      setSelectedPos(pos);
      const moves = getLegalMoves(gameState.board, pos, gameState.enPassantTarget, gameState.castlingRights);
      setLegalMoves(moves);
    }
  }, [gameState, selectedPos, legalMoves, config, isAiThinking, triggerCaptureEffect, captureEffect, premovesEnabled]);

  // External move trigger (used by online/drag)
  const executeExternalMove = useCallback((from: Position, to: Position) => {
    if (captureEffect) return;
    
    let finalTo = to;
    const piece = gameState.board[from.row][from.col];
    const targetPiece = gameState.board[to.row][to.col];
    
    if (piece?.type === 'king' && targetPiece?.type === 'rook' && piece.color === targetPiece.color) {
      if (to.col === 7) finalTo = { row: to.row, col: 6 };
      if (to.col === 0) finalTo = { row: to.row, col: 2 };
    }

    const move: Move = { from, to: finalTo };
    const captured = gameState.board[finalTo.row][finalTo.col];
    const attacker = gameState.board[from.row][from.col];
    const newState = executeMove(gameState, move);
    if (captured && attacker && captured.color !== attacker.color) {
      sounds.playCapture();
      triggerCaptureEffect(finalTo, attacker.type, attacker.color, captured.type, captured.color);
    } else {
      sounds.playMove();
    }
    if (newState.isCheckmate) sounds.playGameOver();
    else if (newState.isCheck) sounds.playCheck();

    setGameState(newState);
    setLastMove(move);
    setSelectedPos(null);
    setLegalMoves([]);
  }, [gameState, triggerCaptureEffect, captureEffect]);

  useEffect(() => {
    if (
      config.playerMode !== 'ai' ||
      gameState.currentTurn !== aiColor ||
      gameState.isCheckmate ||
      gameState.isStalemate ||
      gameState.isDraw ||
      captureEffect ||
      viewIndex !== null // Disable AI while browsing history
    ) return;

    setIsAiThinking(true);

    aiTimerRef.current = setTimeout(() => {
      const best = getBestMove(gameState, aiColor, config.aiDepth);
      if (best) {
        const move: Move = { from: best.from, to: best.to };
        const captured = gameState.board[best.to.row][best.to.col];
        const attacker = gameState.board[best.from.row][best.from.col];
        const newState = executeMove(gameState, move);
        if (captured && attacker) {
          if (captured.color !== attacker.color) sounds.playCapture();
          else sounds.playMove();
          triggerCaptureEffect(best.to, attacker.type, attacker.color, captured.type, captured.color);
        } else {
          sounds.playMove();
        }

        if (newState.isCheckmate) sounds.playGameOver();
        else if (newState.isCheck) sounds.playCheck();

        setGameState(newState);
        setLastMove(move);
      }
      setIsAiThinking(false);
    }, 400 + Math.random() * 300);

    return () => {
      if (aiTimerRef.current) clearTimeout(aiTimerRef.current);
    };
  }, [gameState, config.playerMode, aiColor, config.aiDepth, triggerCaptureEffect, captureEffect]);

  // Execute Premove
  useEffect(() => {
    const isMyTurn = gameState.currentTurn === config.playerColor;
    if (isMyTurn && premove && !captureEffect) {
      const legal = getLegalMoves(gameState.board, premove.from, gameState.enPassantTarget, gameState.castlingRights);
      const isLegal = legal.some(m => m.row === premove.to.row && m.col === premove.to.col);

      if (isLegal) {
        const captured = gameState.board[premove.to.row][premove.to.col];
        const attacker = gameState.board[premove.from.row][premove.from.col];
        const newState = executeMove(gameState, premove);

        if (captured && attacker && captured.color !== attacker.color) {
          triggerCaptureEffect(premove.to, attacker.type, attacker.color, captured.type, captured.color);
        }

        setGameState(newState);
        setLastMove(premove);
      }
      setPremove(null);
    }
  }, [gameState, config.playerColor, premove, captureEffect, triggerCaptureEffect]);

  const resetGame = useCallback(() => {
    setGameState(createInitialGameState());
    setSelectedPos(null);
    setLegalMoves([]);
    setLastMove(null);
    setIsAiThinking(false);
    setCaptureEffect(null);
    setPremove(null);
    setWhiteTime(720);
    setBlackTime(720);
    setIsResigned(false);
    setResignedColor(null);
    if (aiTimerRef.current) clearTimeout(aiTimerRef.current);

  }, []);

  const materialScore = getMaterialScore(gameState);
  const whiteRank = getDominanceRank(materialScore.advantage, 'white');
  const blackRank = getDominanceRank(materialScore.advantage, 'black');

  // Stable reference so AbilityEffect's timer never gets reset by clock ticks
  const clearCaptureEffect = useCallback(() => setCaptureEffect(null), []);

  return {
    gameState,
    selectedPos,
    legalMoves,
    lastMove,
    isAiThinking,
    captureEffect,
    clearCaptureEffect,
    config,
    materialScore,
    whiteRank,
    blackRank,
    handleSquareClick,
    executeExternalMove,
    resetGame,
    resignGame,
    whiteTime,
    blackTime,
    isResigned,
    resignedColor,
    premove,
    premovesEnabled,
    togglePremoves,
    viewIndex,
    goToMove,
    analysis,
    runAnalysis,
    isAnalyzing,
    analysisProgress
  };
}
