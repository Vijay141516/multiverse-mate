import { Router, type IRouter } from 'express';

interface RoomMove {
  from: { row: number; col: number };
  to:   { row: number; col: number };
  index: number;
}

interface Room {
  code:        string;
  whiteId:     string;
  blackId:     string | null;
  moves:       RoomMove[];
  resignedColor: 'white' | 'black' | null;
  rematchRequestedBy: 'white' | 'black' | null;
  rematchAccepted: boolean;
  createdAt:   number;
  lastActivity:number;
}

const rooms = new Map<string, Room>();

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
  const code = generateCode();
  rooms.set(code, {
    code,
    whiteId:      playerId,
    blackId:      null,
    moves:        [],
    resignedColor: null,
    rematchRequestedBy: null,
    rematchAccepted: false,
    createdAt:    Date.now(),
    lastActivity: Date.now(),
  });
  res.json({ code, color: 'white', playerId });
});

/* POST /api/chess/rooms/:code/join — join as black */
chessRouter.post('/rooms/:code/join', (req, res) => {
  const room = rooms.get(req.params['code'] ?? '');
  if (!room) { res.status(404).json({ error: 'Room not found' }); return; }
  if (room.blackId) { res.status(409).json({ error: 'Room is full' }); return; }
  const playerId: string = req.body?.playerId ?? Math.random().toString(36).slice(2);
  room.blackId      = playerId;
  room.lastActivity = Date.now();
  res.json({ code: room.code, color: 'black', playerId });
});

/* GET /api/chess/rooms/:code — poll room state */
chessRouter.get('/rooms/:code', (req, res) => {
  const room = rooms.get(req.params['code'] ?? '');
  if (!room) { res.status(404).json({ error: 'Room not found' }); return; }
  room.lastActivity = Date.now();
  res.json({
    code:        room.code,
    hasOpponent: !!room.blackId,
    moves:       room.moves,
    moveCount:   room.moves.length,
    resignedColor: room.resignedColor,
    rematchRequestedBy: room.rematchRequestedBy,
    rematchAccepted: room.rematchAccepted,
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
    room.whiteId = room.blackId!;
    room.blackId = tempId;
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

export default chessRouter;
