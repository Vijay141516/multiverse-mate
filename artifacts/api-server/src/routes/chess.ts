import { Router, type IRouter } from 'express';

interface RoomMove {
  from: { row: number; col: number };
  to:   { row: number; col: number };
  index: number;
}

interface Room {
  code:        string;
  whiteId:     string;
  whiteName:   string;
  blackId:     string | null;
  blackName:   string | null;
  whiteAvatarId: number;
  whiteAvatarUrl: string | null;
  blackAvatarId: number | null;
  blackAvatarUrl: string | null;
  moves:       RoomMove[];
  resignedColor: 'white' | 'black' | null;
  rematchRequestedBy: 'white' | 'black' | null;
  rematchAccepted: boolean;
  createdAt:   number;
  lastActivity:number;
  timeLimit:   number | null; // in seconds
  whiteTime:   number | null;
  blackTime:   number | null;
  turnStartTime: number | null;
}

const rooms = new Map<string, Room>();
let waitingRoomCode: string | null = null;

function generateCode(): string {
  let code: string;
  do { code = String(Math.floor(1000 + Math.random() * 9000)); }
  while (rooms.has(code));
  return code;
}

// Expire rooms after 30 minutes of inactivity
setInterval(() => {
  const cutoff = Date.now() - 30 * 60 * 1000;
  for (const [code, room] of rooms.entries()) {
    if (room.lastActivity < cutoff) rooms.delete(code);
  }
}, 5 * 60 * 1000);

const chessRouter: IRouter = Router();

/* POST /api/chess/rooms — create a new room */
chessRouter.post('/rooms', (req, res) => {
  const playerId: string = req.body?.playerId ?? Math.random().toString(36).slice(2);
  const timeLimit: number | null = typeof req.body?.timeLimit === 'number' ? req.body.timeLimit : null;
  
  const code = generateCode();
  rooms.set(code, {
    code,
    whiteId:      playerId,
    whiteName:    req.body?.playerName ?? 'Player 1',
    blackId:      null,
    blackName:    null,
    whiteAvatarId: typeof req.body?.avatarId === 'number' ? req.body.avatarId : 1,
    whiteAvatarUrl: req.body?.avatarUrl ?? null,
    blackAvatarId: null,
    blackAvatarUrl: null,
    moves:        [],
    resignedColor: null,
    rematchRequestedBy: null,
    rematchAccepted: false,
    createdAt:    Date.now(),
    lastActivity: Date.now(),
    timeLimit,
    whiteTime:    timeLimit,
    blackTime:    timeLimit,
    turnStartTime: null,
  });
  res.json({ code, color: 'white', playerId, timeLimit, playerName: req.body?.playerName });
});

/* POST /api/chess/rooms/:code/join — join as black */
chessRouter.post('/rooms/:code/join', (req, res) => {
  const room = rooms.get(req.params['code'] ?? '');
  if (!room) { res.status(404).json({ error: 'Room not found' }); return; }
  if (room.blackId) { res.status(409).json({ error: 'Room is full' }); return; }
  const playerId: string = req.body?.playerId ?? Math.random().toString(36).slice(2);
  const playerName: string = req.body?.playerName ?? 'Player 2';
  const avatarId: number = typeof req.body?.avatarId === 'number' ? req.body.avatarId : 2;
  const avatarUrl: string | null = req.body?.avatarUrl ?? null;
  room.blackId      = playerId;
  room.blackName    = playerName;
  room.blackAvatarId = avatarId;
  room.blackAvatarUrl = avatarUrl;
  room.lastActivity = Date.now();

  // If there's a timer, start it when player 2 joins
  if (room.timeLimit !== null) {
    room.turnStartTime = Date.now();
  }

  res.json({ code: room.code, color: 'black', playerId, timeLimit: room.timeLimit });
});

/* GET /api/chess/rooms/:code — poll room state */
chessRouter.get('/rooms/:code', (req, res) => {
  const room = rooms.get(req.params['code'] ?? '');
  if (!room) { res.status(404).json({ error: 'Room not found' }); return; }
  room.lastActivity = Date.now();

  // Calculate current time remaining if game is active
  let currentWhiteTime = room.whiteTime;
  let currentBlackTime = room.blackTime;
  
  if (room.timeLimit !== null && room.turnStartTime !== null && !room.resignedColor) {
    const elapsed = Math.floor((Date.now() - room.turnStartTime) / 1000);
    const turnColor = room.moves.length % 2 === 0 ? 'white' : 'black';
    
    if (turnColor === 'white') {
      currentWhiteTime = Math.max(0, (room.whiteTime ?? 0) - elapsed);
    } else {
      currentBlackTime = Math.max(0, (room.blackTime ?? 0) - elapsed);
    }
  }

  res.json({
    code:        room.code,
    hasOpponent: !!room.blackId,
    moves:       room.moves,
    moveCount:   room.moves.length,
    resignedColor: room.resignedColor,
    rematchRequestedBy: room.rematchRequestedBy,
    rematchAccepted: room.rematchAccepted,
    timeLimit:   room.timeLimit,
    whiteTime:   currentWhiteTime,
    blackTime:   currentBlackTime,
    whiteName:   room.whiteName,
    blackName:   room.blackName,
    whiteAvatarId: room.whiteAvatarId,
    whiteAvatarUrl: room.whiteAvatarUrl,
    blackAvatarId: room.blackAvatarId,
    blackAvatarUrl: room.blackAvatarUrl,
  });
});

/* POST /api/chess/rooms/:code/move — submit a move */
chessRouter.post('/rooms/:code/move', (req, res) => {
  const room = rooms.get(req.params['code'] ?? '');
  if (!room) { res.status(404).json({ error: 'Room not found' }); return; }

  const { playerId, from, to, moveIndex } = req.body ?? {};
  const isWhite = room.whiteId === playerId;
  const isBlack = room.blackId === playerId;

  if (!isWhite && !isBlack) { res.status(403).json({ error: 'Not a player in this room' }); return; }

  // Verify it is their turn (white on even indices, black on odd)
  const expectedColor = room.moves.length % 2 === 0 ? 'white' : 'black';
  const playerColor   = isWhite ? 'white' : 'black';
  if (playerColor !== expectedColor) { res.status(400).json({ error: 'Not your turn' }); return; }

  // Idempotency: if they already submitted this index, ignore
  if (typeof moveIndex === 'number' && moveIndex !== room.moves.length) {
    res.status(409).json({ error: 'Move index mismatch', expected: room.moves.length });
    return;
  }

  // Update time
  if (room.timeLimit !== null && room.turnStartTime !== null) {
    const elapsed = Math.floor((Date.now() - room.turnStartTime) / 1000);
    if (playerColor === 'white') {
      room.whiteTime = Math.max(0, (room.whiteTime ?? 0) - elapsed);
    } else {
      room.blackTime = Math.max(0, (room.blackTime ?? 0) - elapsed);
    }
    room.turnStartTime = Date.now();
  }

  room.moves.push({ from, to, index: room.moves.length });
  room.lastActivity = Date.now();
  res.json({ success: true, moveCount: room.moves.length });
});

/* POST /api/chess/rooms/:code/resign */
chessRouter.post('/rooms/:code/resign', (req, res) => {
  const room = rooms.get(req.params['code'] ?? '');
  if (!room) { res.status(404).json({ error: 'Room not found' }); return; }

  const { playerId } = req.body ?? {};
  const isWhite = room.whiteId === playerId;
  const isBlack = room.blackId === playerId;

  if (!isWhite && !isBlack) { res.status(403).json({ error: 'Not a player' }); return; }

  room.resignedColor = isWhite ? 'white' : 'black';
  room.lastActivity = Date.now();
  res.json({ success: true });
});

/* POST /api/chess/rooms/:code/rematch */
chessRouter.post('/rooms/:code/rematch', (req, res) => {
  const room = rooms.get(req.params['code'] ?? '');
  if (!room) { res.status(404).json({ error: 'Room not found' }); return; }

  const { playerId } = req.body ?? {};
  const isWhite = room.whiteId === playerId;
  const isBlack = room.blackId === playerId;
  const playerColor = isWhite ? 'white' : 'black';

  if (!isWhite && !isBlack) { res.status(403).json({ error: 'Not a player' }); return; }

  if (!room.rematchRequestedBy) {
    room.rematchRequestedBy = playerColor;
  } else if (room.rematchRequestedBy !== playerColor) {
    // Both agreed! Reset the room state
    room.moves = [];
    room.resignedColor = null;
    room.rematchRequestedBy = null;
    room.rematchAccepted = true; // Signal client to reset their local board
    // We swap colors? Let's just keep same colors or swap them?
    // Actually, chess usually swaps colors. But let's keep it simple and just clear the board for now, 
    // or swap:
    const tempId = room.whiteId;
    const tempName = room.whiteName;
    const tempAvatar = room.whiteAvatarId;
    const tempAvatarUrl = room.whiteAvatarUrl;
    room.whiteId = room.blackId!;
    room.whiteName = room.blackName!;
    room.whiteAvatarId = room.blackAvatarId!;
    room.whiteAvatarUrl = room.blackAvatarUrl!;
    room.blackId = tempId;
    room.blackName = tempName;
    room.blackAvatarId = tempAvatar;
    room.blackAvatarUrl = tempAvatarUrl;
  }
  
  room.lastActivity = Date.now();
  res.json({ success: true });
});

/* POST /api/chess/rooms/:code/clear-rematch-flag */
// Used by client to acknowledge the rematch so the flag is cleared
chessRouter.post('/rooms/:code/clear-rematch-flag', (req, res) => {
  const room = rooms.get(req.params['code'] ?? '');
  if (room) {
    room.rematchAccepted = false;
  }
  res.json({ success: true });
});

/* POST /api/chess/matchmaking — random matchmaking */
chessRouter.post('/matchmaking', (req, res) => {
  const { playerId, playerName, avatarId, avatarUrl } = req.body ?? {};
  
  if (waitingRoomCode) {
    const code = waitingRoomCode;
    const room = rooms.get(code);
    
    // If room disappeared or is full, clear and retry
    if (!room || room.blackId) {
      waitingRoomCode = null;
    } else if (room.whiteId === playerId) {
      // Same player polling - return waiting
      res.json({ status: 'waiting', code });
      return;
    } else {
      // Found a match!
      room.blackId = playerId;
      room.blackName = playerName ?? 'Player 2';
      room.blackAvatarId = avatarId ?? 2;
      room.blackAvatarUrl = avatarUrl ?? null;
      room.lastActivity = Date.now();
      if (room.timeLimit !== null) room.turnStartTime = Date.now();
      
      waitingRoomCode = null;
      res.json({ status: 'found', code, color: 'black', timeLimit: room.timeLimit });
      return;
    }
  }

  // No waiting room, create one (10 min matchmaking)
  const code = generateCode();
  const timeLimit = 600; // 10 minutes
  rooms.set(code, {
    code,
    whiteId:      playerId,
    whiteName:    playerName ?? 'Player 1',
    blackId:      null,
    blackName:    null,
    whiteAvatarId: avatarId ?? 1,
    whiteAvatarUrl: avatarUrl ?? null,
    blackAvatarId: null,
    blackAvatarUrl: null,
    moves:        [],
    resignedColor: null,
    rematchRequestedBy: null,
    rematchAccepted: false,
    createdAt:    Date.now(),
    lastActivity: Date.now(),
    timeLimit,
    whiteTime:    timeLimit,
    blackTime:    timeLimit,
    turnStartTime: null,
  });
  
  waitingRoomCode = code;
  res.json({ status: 'waiting', code, color: 'white', timeLimit });
});

export default chessRouter;
