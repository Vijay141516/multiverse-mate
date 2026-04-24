import { useState, useCallback, useEffect, useRef } from 'react';
import {
  GameState, Position, Move, Color, PieceType,
  createInitialGameState, getLegalMoves, executeMove,
  getMaterialScore, getDominanceRank,
} from '../lib/chess';
import { CaptureEffect } from './useChessGame';

/* ── The API server is proxied at /api on the same Replit domain ── */
const API = '/api/chess';

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

export function useOnlineGame() {
  const [status, setStatus]         = useState<OnlineStatus>('idle');
  const [roomCode, setRoomCode]     = useState<string>('');
  const [playerColor, setPlayerColor] = useState<Color>('white');
  const [playerId]                  = useState(() => Math.random().toString(36).slice(2));
  const [error, setError]           = useState<string>('');

  const [gameState, setGameState]   = useState<GameState>(createInitialGameState());
  const [selectedPos, setSelectedPos] = useState<Position | null>(null);
  const [legalMoves, setLegalMoves] = useState<Position[]>([]);
  const [lastMove, setLastMove]     = useState<Move | null>(null);
  const [captureEffect, setCaptureEffect] = useState<CaptureEffect | null>(null);
  const [premove, setPremove]       = useState<Move | null>(null);
  const [premovesEnabled, setPremovesEnabled] = useState(() => localStorage.getItem('anime_chess_premoves') === 'true');
  const [resignedColor, setResignedColor] = useState<Color | null>(null);
  const [rematchRequestedBy, setRematchRequestedBy] = useState<Color | null>(null);

  const togglePremoves = useCallback(() => {
    setPremovesEnabled(p => {
      const next = !p;
      localStorage.setItem('anime_chess_premoves', String(next));
      return next;
    });
  }, []);

  // How many moves we've applied locally
  const appliedMovesRef = useRef(0);
  // Local game state ref for applying moves without stale closure
  const gameStateRef    = useRef<GameState>(gameState);
  gameStateRef.current  = gameState;

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

  /* Apply a server move to local game state */
  const applyServerMove = useCallback((rm: RoomMove, gs: GameState): GameState => {
    const from: Position = { row: rm.from.row, col: rm.from.col };
    const to:   Position = { row: rm.to.row,   col: rm.to.col   };
    const attacker = gs.board[from.row][from.col];
    const victim   = gs.board[to.row][to.col];
    const newState = executeMove(gs, { from, to });
    if (attacker && victim) {
      triggerCapture(to, attacker, victim);
    }
    return newState;
  }, [triggerCapture]);

  /* Poll the server for new moves */
  const poll = useCallback(async () => {
    if (!roomCode) return;
    try {
      const res = await fetch(`${API}/rooms/${roomCode}`);
      if (!res.ok) return;
      const data = await res.json() as { 
        hasOpponent: boolean; 
        moves: RoomMove[]; 
        moveCount: number;
        resignedColor: Color | null;
        rematchRequestedBy: Color | null;
        rematchAccepted: boolean;
      };

      if (status === 'waiting' && data.hasOpponent) {
        setStatus('playing');
      }

      setResignedColor(data.resignedColor);
      setRematchRequestedBy(data.rematchRequestedBy);

      if (data.rematchAccepted) {
         setGameState(createInitialGameState());
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

      // Apply any new moves
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
        setGameState(gs);
        setSelectedPos(null);
        setLegalMoves([]);
      }

      // Retry any pending move we failed to submit
      if (pendingMoveRef.current) {
        const { from, to, index } = pendingMoveRef.current;
        if (index < serverMoves.length) {
          pendingMoveRef.current = null; // already applied
        } else {
          submitMoveToServer(from, to, index);
        }
      }
    } catch { /* network hiccup — ignore */ }
  }, [roomCode, status, applyServerMove]);

  const submitMoveToServer = useCallback(async (from: Position, to: Position, index: number) => {
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
      // Store for retry in next poll
      pendingMoveRef.current = { from, to, index };
    }
  }, [roomCode, playerId]);

  /* Handle the local player clicking a square */
  const handleSquareClick = useCallback((pos: Position) => {
    if (status !== 'playing') return;
    if (gameState.isCheckmate || gameState.isStalemate || gameState.isDraw) return;
    
    const piece = gameState.board[pos.row][pos.col];

    if (gameState.currentTurn !== playerColor) {
      if (!premovesEnabled) return;
      
      // Premove logic
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
        // Optimistic local update
        const attacker = gameState.board[from.row][from.col];
        const victim   = gameState.board[to.row][to.col];
        const newState = executeMove(gameState, { from, to });
        if (attacker && victim && attacker.color !== victim.color) triggerCapture(to, attacker, victim);
        setGameState(newState);
        setLastMove({ from, to });
        setSelectedPos(null);
        setLegalMoves([]);
        appliedMovesRef.current += 1;
        // Submit to server
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
  }, [status, gameState, playerColor, selectedPos, legalMoves, triggerCapture, submitMoveToServer, premovesEnabled]);

  // Execute Premove
  useEffect(() => {
    const isMyTurn = gameState.currentTurn === playerColor;
    if (isMyTurn && premove && status === 'playing' && !captureEffect) {
      const legal = getLegalMoves(gameState.board, premove.from, gameState.enPassantTarget, gameState.castlingRights);
      const isLegal = legal.some(m => m.row === premove.to.row && m.col === premove.to.col);

      if (isLegal) {
        const from = premove.from;
        const to = premove.to;
        const moveIndex = appliedMovesRef.current;
        const captured = gameState.board[to.row][to.col];
        const attacker = gameState.board[from.row][from.col];
        const newState = executeMove(gameState, { from, to });

        if (captured && attacker && captured.color !== attacker.color) {
          triggerCapture(to, attacker, captured);
        }

        setGameState(newState);
        setLastMove({ from, to });
        appliedMovesRef.current += 1;
        submitMoveToServer(from, to, moveIndex);
      }
      setPremove(null);
    }
  }, [gameState, playerColor, premove, status, captureEffect, triggerCapture, submitMoveToServer]);

  /* Start polling when room code is set */
  useEffect(() => {
    if (!roomCode) return;
    clearPoll();
    pollRef.current = setInterval(poll, 600);
    return clearPoll;
  }, [roomCode, poll]);

  /* Create a new room */
  const createRoom = useCallback(async () => {
    setStatus('creating');
    setError('');
    try {
      const res = await fetch(`${API}/rooms`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ playerId }),
      });
      if (!res.ok) throw new Error('Failed to create room');
      const data = await res.json() as { code: string; color: Color; playerId: string };
      setRoomCode(data.code);
      setPlayerColor(data.color);
      setStatus('waiting');
    } catch (e) {
      setStatus('error');
      setError((e as Error).message);
    }
  }, [playerId]);

  /* Join an existing room */
  const joinRoom = useCallback(async (code: string) => {
    setStatus('joining');
    setError('');
    try {
      const res = await fetch(`${API}/rooms/${code}/join`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ playerId }),
      });
      if (!res.ok) {
        const err = await res.json() as { error: string };
        throw new Error(err.error ?? 'Failed to join');
      }
      const data = await res.json() as { code: string; color: Color };
      setRoomCode(data.code);
      setPlayerColor(data.color);
      setStatus('playing');
    } catch (e) {
      setStatus('error');
      setError((e as Error).message);
    }
  }, [playerId]);

  const resetOnline = useCallback(() => {
    clearPoll();
    setStatus('idle');
    setRoomCode('');
    setError('');
    setGameState(createInitialGameState());
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

  const requestRematch = useCallback(async () => {
    if (!roomCode) return;
    try {
      await fetch(`${API}/rooms/${roomCode}/rematch`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ playerId }),
      });
    } catch {}
  }, [roomCode, playerId]);

  const materialScore = getMaterialScore(gameState);
  const whiteRank = getDominanceRank(materialScore.advantage, 'white');
  const blackRank = getDominanceRank(materialScore.advantage, 'black');

  return {
    status, roomCode, playerColor, error,
    gameState, selectedPos, legalMoves, lastMove, captureEffect, clearCaptureEffect,
    materialScore, whiteRank, blackRank,
    handleSquareClick,
    createRoom, joinRoom, resetOnline,
    premove, premovesEnabled, togglePremoves,
    resignedColor, rematchRequestedBy, resign, requestRematch
  };
}
