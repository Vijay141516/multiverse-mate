import { useState, useCallback, useEffect, useRef } from 'react';
import {
  GameState, Position, Move, Color, PieceType,
  createInitialGameState, getLegalMoves, executeMove,
  getMaterialScore, getDominanceRank,
  getGameStateAtMove,
  FullAnalysis,
} from '../lib/chess';
import { CaptureEffect } from './useChessGame';
import { sounds } from '../lib/sounds';
import { runFullAnalysis } from '../lib/analysis';

/* ── The API server URL ── */
const API = (import.meta.env.VITE_API_URL || '/api') + '/chess';

export type OnlineStatus =
  | 'idle'
  | 'creating'
  | 'waiting'
  | 'joining'
  | 'playing'
  | 'error';

interface RoomMove {
  from: { row: number; col: number };
  to:   { row: number; col: number };
  index: number;
}

export function useOnlineGame(playerName: string = 'Player', avatarId: number = 1, avatarUrl: string = '') {
  const [status, setStatus]         = useState<OnlineStatus>('idle');
  const [roomCode, setRoomCode]     = useState<string>('');
  const [playerColor, setPlayerColor] = useState<Color>('white');
  const [playerId]                  = useState(() => Math.random().toString(36).slice(2));
  const [error, setError]           = useState<string>('');
  const [whiteName, setWhiteName]   = useState<string>('');
  const [blackName, setBlackName]   = useState<string>('');
  const [whiteAvatarId, setWhiteAvatarId] = useState<number>(1);
  const [whiteAvatarUrl, setWhiteAvatarUrl] = useState<string>('');
  const [blackAvatarId, setBlackAvatarId] = useState<number | null>(null);
  const [blackAvatarUrl, setBlackAvatarUrl] = useState<string>('');
  const [isMatchmaking, setIsMatchmaking] = useState<boolean>(false);
  const [timeLimit, setTimeLimit] = useState<number | null>(null);
  const [whiteTime, setWhiteTime] = useState<number | null>(null);
  const [blackTime, setBlackTime] = useState<number | null>(null);

  const [realGameState, setRealGameState]   = useState<GameState>(createInitialGameState());
  const [viewIndex, setViewIndex] = useState<number | null>(null);
  const [analysis, setAnalysis] = useState<FullAnalysis | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysisProgress, setAnalysisProgress] = useState(0);

  // Calculated game state must be defined early so hooks below can use it
  const gameState = viewIndex !== null 
    ? getGameStateAtMove(realGameState.moveHistory, viewIndex + 1)
    : realGameState;

  const [selectedPos, setSelectedPos] = useState<Position | null>(null);
  const [legalMoves, setLegalMoves] = useState<Position[]>([]);
  const [lastMove, setLastMove]     = useState<Move | null>(null);
  const [captureEffect, setCaptureEffect] = useState<CaptureEffect | null>(null);
  const [premove, setPremove]       = useState<Move | null>(null);
  const [premovesEnabled, setPremovesEnabled] = useState(() => localStorage.getItem('anime_chess_premoves') === 'true');
  const [resignedColor, setResignedColor] = useState<Color | null>(null);
  const [rematchRequestedBy, setRematchRequestedBy] = useState<Color | null>(null);

  const appliedMovesRef = useRef(0);
  // Important: Ref must point to realGameState for server sync logic
  const gameStateRef    = useRef<GameState>(realGameState);
  gameStateRef.current  = realGameState;
  
  const pendingMoveRef  = useRef<{ from: Position; to: Position; index: number } | null>(null);
  const pollRef         = useRef<ReturnType<typeof setInterval> | null>(null);

  const clearPoll = () => {
    if (pollRef.current) { clearInterval(pollRef.current); pollRef.current = null; }
  };

  const triggerCapture = useCallback((pos: Position, attacker: { type: PieceType; color: Color }, victim: { type: PieceType; color: Color }) => {
    const eff: CaptureEffect = {
      pos,
      attackerType: attacker.type, attackerColor: attacker.color,
      capturedType: victim.type, capturedColor: victim.color,
    };
    setCaptureEffect(eff);
  }, []);

  const clearCaptureEffect = useCallback(() => setCaptureEffect(null), []);

  const applyServerMove = useCallback((rm: RoomMove, gs: GameState): GameState => {
    const from: Position = { row: rm.from.row, col: rm.from.col };
    const to:   Position = { row: rm.to.row,   col: rm.to.col   };
    const attacker = gs.board[from.row][from.col];
    const victim   = gs.board[to.row][to.col];
    const newState = executeMove(gs, { from, to });
    if (attacker && victim && attacker.color !== victim.color) {
      sounds.playCapture();
      triggerCapture(to, attacker, victim);
    } else {
      sounds.playMove();
    }
    if (newState.isCheckmate) sounds.playGameOver();
    else if (newState.isCheck) sounds.playCheck();
    return newState;
  }, [triggerCapture]);

  const submitMoveToServer = useCallback(async (from: Position, to: Position, index: number) => {
    if (!roomCode) return;
    try {
      const res = await fetch(`${API}/rooms/${roomCode}/move`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ playerId, from, to, moveIndex: index }),
      });
      if (res.ok) {
        pendingMoveRef.current = null;
      }
    } catch {
      pendingMoveRef.current = { from, to, index };
    }
  }, [roomCode, playerId]);

  const poll = useCallback(async () => {
    if (!roomCode) return;
    try {
      const res = await fetch(`${API}/rooms/${roomCode}`);
      if (!res.ok) return;
      const data = await res.json();

      if (status === 'waiting' && data.hasOpponent) {
        setStatus('playing');
        setIsMatchmaking(false);
      }

      setResignedColor(data.resignedColor);
      setRematchRequestedBy(data.rematchRequestedBy);
      setWhiteTime(data.whiteTime);
      setBlackTime(data.blackTime);
      if (data.whiteName) setWhiteName(data.whiteName);
      if (data.blackName) setBlackName(data.blackName);
      if (typeof data.whiteAvatarId === 'number') setWhiteAvatarId(data.whiteAvatarId);
      if (data.whiteAvatarUrl !== undefined) setWhiteAvatarUrl(data.whiteAvatarUrl || '');
      if (typeof data.blackAvatarId === 'number') setBlackAvatarId(data.blackAvatarId);
      if (data.blackAvatarUrl !== undefined) setBlackAvatarUrl(data.blackAvatarUrl || '');

      if (data.rematchAccepted) {
         setRealGameState(createInitialGameState());
         setSelectedPos(null);
         setLegalMoves([]);
         setLastMove(null);
         setCaptureEffect(null);
         setPremove(null);
         appliedMovesRef.current = 0;
         pendingMoveRef.current = null;
         fetch(`${API}/rooms/${roomCode}/clear-rematch-flag`, { method: 'POST' }).catch(() => {});
         return;
      }

      const serverMoves = data.moves;
      if (serverMoves.length > appliedMovesRef.current) {
        let gs = gameStateRef.current;
        for (let i = appliedMovesRef.current; i < serverMoves.length; i++) {
          const rm = serverMoves[i];
          if (!rm) continue;
          const from = { row: rm.from.row, col: rm.from.col };
          const to   = { row: rm.to.row,   col: rm.to.col   };
          setLastMove({ from, to });
          gs = applyServerMove(rm, gs);
        }
        appliedMovesRef.current = serverMoves.length;
        setRealGameState(gs);
        setSelectedPos(null);
        setLegalMoves([]);
      }

      if (pendingMoveRef.current) {
        const { from, to, index } = pendingMoveRef.current;
        if (index < serverMoves.length) {
          pendingMoveRef.current = null;
        } else {
          submitMoveToServer(from, to, index);
        }
      }
    } catch { /* ignore */ }
  }, [roomCode, status, applyServerMove, submitMoveToServer]);

  useEffect(() => {
    if (!roomCode) return;
    clearPoll();
    pollRef.current = setInterval(poll, 600);
    return clearPoll;
  }, [roomCode, poll]);

  const handleSquareClick = useCallback((pos: Position) => {
    if (status !== 'playing' || viewIndex !== null) return;
    // Note: We use current gameState for clicks
    if (gameState.isCheckmate || gameState.isStalemate || gameState.isDraw) return;
    
    const piece = gameState.board[pos.row][pos.col];

    if (gameState.currentTurn !== playerColor) {
      if (!premovesEnabled) return;
      if (selectedPos) {
        const pPiece = gameState.board[selectedPos.row][selectedPos.col];
        if (piece && piece.color === playerColor) {
           setSelectedPos(pos);
           setLegalMoves(getLegalMoves(gameState.board, pos, gameState.enPassantTarget, gameState.castlingRights));
           return;
        }
        if (pPiece && pPiece.color === playerColor) {
          let finalTo = pos;
          if (pPiece.type === 'king' && piece?.type === 'rook' && pPiece.color === piece.color) {
            if (pos.col === 7) finalTo = { row: pos.row, col: 6 };
            if (pos.col === 0) finalTo = { row: pos.row, col: 2 };
          }
          setPremove({ from: selectedPos, to: finalTo });
          setSelectedPos(null);
          setLegalMoves([]);
          return;
        }
      }
      if (piece && piece.color === playerColor) {
        setSelectedPos(pos);
        setLegalMoves(getLegalMoves(gameState.board, pos, gameState.enPassantTarget, gameState.castlingRights));
      }
      return;
    }

    if (selectedPos) {
      let finalTo = pos;
      const pPiece = gameState.board[selectedPos.row][selectedPos.col];
      const tPiece = gameState.board[pos.row][pos.col];
      if (pPiece?.type === 'king' && tPiece?.type === 'rook' && pPiece.color === tPiece.color) {
        if (pos.col === 7) finalTo = { row: pos.row, col: 6 };
        if (pos.col === 0) finalTo = { row: pos.row, col: 2 };
      }

      const isLegal = legalMoves.some(m => m.row === finalTo.row && m.col === finalTo.col);
      if (isLegal) {
        setPremove(null);
        const from = selectedPos;
        const to   = finalTo;
        const moveIndex = appliedMovesRef.current;
        const attacker = gameState.board[from.row][from.col];
        const victim   = gameState.board[to.row][to.col];
        const newState = executeMove(gameState, { from, to });

        if (attacker && victim && attacker.color !== victim.color) {
          sounds.playCapture();
          triggerCapture(to, attacker, victim);
        } else {
          sounds.playMove();
        }
        if (newState.isCheckmate) sounds.playGameOver();
        else if (newState.isCheck) sounds.playCheck();
        
        setRealGameState(newState);
        setLastMove({ from, to });
        setSelectedPos(null);
        setLegalMoves([]);
        appliedMovesRef.current += 1;
        submitMoveToServer(from, to, moveIndex);
        return;
      }
      if (piece && piece.color === playerColor) {
        setSelectedPos(pos);
        setLegalMoves(getLegalMoves(gameState.board, pos, gameState.enPassantTarget, gameState.castlingRights));
        return;
      }
      setSelectedPos(null);
      setLegalMoves([]);
      return;
    }

    if (piece && piece.color === playerColor) {
      setSelectedPos(pos);
      setLegalMoves(getLegalMoves(gameState.board, pos, gameState.enPassantTarget, gameState.castlingRights));
    }
  }, [status, playerColor, selectedPos, legalMoves, triggerCapture, submitMoveToServer, premovesEnabled, viewIndex, gameState]);

  const makeMove = useCallback((from: Position, to: Position) => {
    if (status !== 'playing' || viewIndex !== null) return;
    const moveIndex = appliedMovesRef.current;
    const gs = gameStateRef.current;
    const attacker = gs.board[from.row][from.col];
    const victim = gs.board[to.row][to.col];
    const newState = executeMove(gs, { from, to });
    
    if (attacker && victim && attacker.color !== victim.color) {
      sounds.playCapture();
      triggerCapture(to, attacker, victim);
    } else {
      sounds.playMove();
    }
    
    setRealGameState(newState);
    setLastMove({ from, to });
    appliedMovesRef.current += 1;
    submitMoveToServer(from, to, moveIndex);
  }, [status, viewIndex, triggerCapture, submitMoveToServer]);

  const createRoom = useCallback(async (selectedTime: number | null) => {
    setStatus('creating');
    setError('');
    try {
      const res = await fetch(`${API}/rooms`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ playerId, playerName, avatarId, timeLimit: selectedTime, avatarUrl }),
      });
      if (!res.ok) throw new Error('Failed to create room');
      const data = await res.json();
      setRoomCode(data.code);
      setPlayerColor(data.color);
      setTimeLimit(data.timeLimit);
      setWhiteTime(data.timeLimit);
      setBlackTime(data.timeLimit);
      setStatus('waiting');
    } catch (e) {
      setStatus('error');
      setError((e as Error).message);
    }
  }, [playerId, playerName, avatarId, avatarUrl]);

  const joinRoom = useCallback(async (code: string) => {
    setStatus('joining');
    setError('');
    try {
      const res = await fetch(`${API}/rooms/${code}/join`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ playerId, playerName, avatarId, avatarUrl }),
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error ?? 'Failed to join');
      }
      const data = await res.json();
      setRoomCode(data.code);
      setPlayerColor(data.color);
      setTimeLimit(data.timeLimit);
      setWhiteTime(data.timeLimit);
      setBlackTime(data.timeLimit);
      setStatus('playing');
    } catch (e) {
      setStatus('error');
      setError((e as Error).message);
    }
  }, [playerId, playerName, avatarId, avatarUrl]);

  const startMatchmaking = async () => {
    setStatus('waiting');
    setIsMatchmaking(true);
    setError('');
    try {
      const res = await fetch(`${API}/matchmaking`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ playerId, playerName, avatarId, avatarUrl }),
      });
      if (!res.ok) throw new Error('Matchmaking failed');
      const data = await res.json();
      setRoomCode(data.code);
      setPlayerColor(data.color);
      if (data.status === 'found') {
        setStatus('playing');
        setIsMatchmaking(false);
      }
    } catch (err: any) {
      setError(err.message);
      setStatus('idle');
      setIsMatchmaking(false);
    }
  };

  const cancelMatchmaking = useCallback(() => {
    setIsMatchmaking(false);
    setStatus('idle');
  }, []);

  const resetOnline = useCallback(() => {
    clearPoll();
    setStatus('idle');
    setRoomCode('');
    setError('');
    setTimeLimit(null);
    setWhiteTime(null);
    setBlackTime(null);
    setWhiteName('');
    setBlackName('');
    setRealGameState(createInitialGameState());
    setSelectedPos(null);
    setLegalMoves([]);
    setLastMove(null);
    setCaptureEffect(null);
    setPremove(null);
    setResignedColor(null);
    setRematchRequestedBy(null);
    appliedMovesRef.current = 0;
    pendingMoveRef.current  = null;
  }, []);

  const resign = useCallback(async () => {
    if (!roomCode || status !== 'playing') return;
    try {
      await fetch(`${API}/rooms/${roomCode}/resign`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ playerId }),
      });
    } catch {}
  }, [roomCode, status, playerId]);

  const requestRematch = async () => {
    if (!roomCode) return;
    try {
      await fetch(`${API}/rooms/${roomCode}/rematch`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ playerId }),
      });
    } catch {}
  };

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

  useEffect(() => {
    if (status !== 'playing' || timeLimit === null || resignedColor) return;
    const interval = setInterval(() => {
      const turnColor = realGameState.currentTurn;
      if (turnColor === 'white') setWhiteTime(t => t !== null ? Math.max(0, t - 1) : null);
      else setBlackTime(t => t !== null ? Math.max(0, t - 1) : null);
    }, 1000);
    return () => clearInterval(interval);
  }, [status, timeLimit, realGameState.currentTurn, resignedColor]);

  const goToMove = useCallback((idx: number | null) => {
    if (idx !== null && idx >= realGameState.moveHistory.length) {
      setViewIndex(null);
    } else {
      setViewIndex(idx);
    }
    setSelectedPos(null);
    setLegalMoves([]);
  }, [realGameState.moveHistory.length]);

  return {
    status, roomCode, playerColor, error,
    gameState, selectedPos, legalMoves, lastMove, captureEffect, clearCaptureEffect,
    materialScore: getMaterialScore(gameState),
    whiteRank: getDominanceRank(getMaterialScore(gameState).advantage, 'white'),
    blackRank: getDominanceRank(getMaterialScore(gameState).advantage, 'black'),
    whiteName, blackName, timeLimit,
    handleSquareClick,
    createRoom, joinRoom, resetOnline,
    whiteAvatarId, whiteAvatarUrl,
    blackAvatarId, blackAvatarUrl,
    isMatchmaking, startMatchmaking, cancelMatchmaking,
    executeMove: makeMove,
    resetGame: resetOnline,
    resign,
    whiteTime, blackTime,
    isResigned: !!resignedColor,
    resignedColor,
    rematchRequestedBy,
    requestRematch,
    premove,
    premovesEnabled,
    togglePremoves: () => {
      setPremovesEnabled(p => {
        const next = !p;
        localStorage.setItem('anime_chess_premoves', String(next));
        return next;
      });
    },
    viewIndex, goToMove,
    analysis, runAnalysis, isAnalyzing, analysisProgress
  };
}
