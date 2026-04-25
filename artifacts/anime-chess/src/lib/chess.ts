export type PieceType = 'pawn' | 'knight' | 'bishop' | 'rook' | 'queen' | 'king';
export type Color = 'white' | 'black';

export interface Piece {
  type: PieceType;
  color: Color;
  hasMoved?: boolean;
}

export type Square = Piece | null;
export type Board = Square[][];

export interface Position {
  row: number;
  col: number;
}

export interface Move {
  from: Position;
  to: Position;
  promotion?: PieceType;
  isCastle?: boolean;
  isEnPassant?: boolean;
  captured?: Piece;
}

export interface CastlingRights {
  whiteKingSide: boolean;
  whiteQueenSide: boolean;
  blackKingSide: boolean;
  blackQueenSide: boolean;
}

export interface GameState {
  board: Board;
  currentTurn: Color;
  enPassantTarget: Position | null;
  castlingRights: CastlingRights;
  isCheck: boolean;
  isCheckmate: boolean;
  isStalemate: boolean;
  isDraw: boolean;
  moveHistory: Move[];
  capturedByWhite: Piece[];
  capturedByBlack: Piece[];
  halfMoveClock: number;
  fullMoveNumber: number;
}

const PIECE_VALUES: Record<PieceType, number> = {
  pawn: 1,
  knight: 3,
  bishop: 3,
  rook: 5,
  queen: 9,
  king: 0,
};

export function getPieceValue(type: PieceType): number {
  return PIECE_VALUES[type];
}

export function createInitialBoard(): Board {
  const board: Board = Array(8).fill(null).map(() => Array(8).fill(null));

  const backRank: PieceType[] = ['rook', 'knight', 'bishop', 'queen', 'king', 'bishop', 'knight', 'rook'];

  for (let col = 0; col < 8; col++) {
    board[0][col] = { type: backRank[col], color: 'black' };
    board[1][col] = { type: 'pawn', color: 'black' };
    board[6][col] = { type: 'pawn', color: 'white' };
    board[7][col] = { type: backRank[col], color: 'white' };
  }

  return board;
}

export function generateFEN(state: GameState): string {
  let fen = '';
  
  // 1. Board
  for (let r = 0; r < 8; r++) {
    let empty = 0;
    for (let c = 0; c < 8; c++) {
      const p = state.board[r][c];
      if (p) {
        if (empty > 0) { fen += empty; empty = 0; }
        const char = p.type === 'knight' ? 'n' : p.type[0];
        fen += p.color === 'white' ? char.toUpperCase() : char;
      } else {
        empty++;
      }
    }
    if (empty > 0) fen += empty;
    if (r < 7) fen += '/';
  }

  // 2. Turn
  fen += ` ${state.currentTurn === 'white' ? 'w' : 'b'}`;

  // 3. Castling
  let castling = '';
  if (state.castlingRights.whiteKingSide) castling += 'K';
  if (state.castlingRights.whiteQueenSide) castling += 'Q';
  if (state.castlingRights.blackKingSide) castling += 'k';
  if (state.castlingRights.blackQueenSide) castling += 'q';
  fen += ` ${castling || '-'}`;

  // 4. En Passant
  if (state.enPassantTarget) {
    fen += ` ${posToAlgebraic(state.enPassantTarget)}`;
  } else {
    fen += ' -';
  }

  // 5. Clocks
  fen += ` ${state.halfMoveClock} ${state.fullMoveNumber}`;

  return fen;
}

export function createInitialGameState(): GameState {
  const board = createInitialBoard();
  return {
    board,
    currentTurn: 'white',
    enPassantTarget: null,
    castlingRights: {
      whiteKingSide: true,
      whiteQueenSide: true,
      blackKingSide: true,
      blackQueenSide: true,
    },
    isCheck: false,
    isCheckmate: false,
    isStalemate: false,
    isDraw: false,
    moveHistory: [],
    capturedByWhite: [],
    capturedByBlack: [],
    halfMoveClock: 0,
    fullMoveNumber: 1,
  };
}

function isInBounds(row: number, col: number): boolean {
  return row >= 0 && row < 8 && col >= 0 && col < 8;
}

function getOpponent(color: Color): Color {
  return color === 'white' ? 'black' : 'white';
}

function cloneBoard(board: Board): Board {
  return board.map(row => row.map(sq => sq ? { ...sq } : null));
}

export function getRawMoves(board: Board, pos: Position, enPassantTarget: Position | null, castlingRights: CastlingRights): Position[] {
  const piece = board[pos.row][pos.col];
  if (!piece) return [];

  const moves: Position[] = [];
  const { type, color } = piece;

  const addIfValid = (r: number, c: number, mustCapture = false, canCapture = true) => {
    if (!isInBounds(r, c)) return false;
    const target = board[r][c];
    if (mustCapture && !target) return false;
    if (mustCapture && target && target.color === color) return false;
    if (!mustCapture && target && target.color === color) return false;
    if (!canCapture && target) return false;
    moves.push({ row: r, col: c });
    return !target;
  };

  const addLine = (dr: number, dc: number) => {
    let r = pos.row + dr;
    let c = pos.col + dc;
    while (isInBounds(r, c)) {
      const target = board[r][c];
      if (target) {
        if (target.color !== color) moves.push({ row: r, col: c });
        break;
      }
      moves.push({ row: r, col: c });
      r += dr;
      c += dc;
    }
  };

  switch (type) {
    case 'pawn': {
      const dir = color === 'white' ? -1 : 1;
      const startRow = color === 'white' ? 6 : 1;

      addIfValid(pos.row + dir, pos.col, false, false);

      if (pos.row === startRow && !board[pos.row + dir][pos.col]) {
        addIfValid(pos.row + dir * 2, pos.col, false, false);
      }

      for (const dc of [-1, 1]) {
        addIfValid(pos.row + dir, pos.col + dc, true, true);
      }

      if (enPassantTarget) {
        for (const dc of [-1, 1]) {
          if (pos.row + dir === enPassantTarget.row && pos.col + dc === enPassantTarget.col) {
            moves.push(enPassantTarget);
          }
        }
      }
      break;
    }

    case 'knight': {
      const knightMoves = [[-2,-1],[-2,1],[-1,-2],[-1,2],[1,-2],[1,2],[2,-1],[2,1]];
      for (const [dr, dc] of knightMoves) {
        addIfValid(pos.row + dr, pos.col + dc);
      }
      break;
    }

    case 'bishop': {
      addLine(-1,-1); addLine(-1,1); addLine(1,-1); addLine(1,1);
      break;
    }

    case 'rook': {
      addLine(-1,0); addLine(1,0); addLine(0,-1); addLine(0,1);
      break;
    }

    case 'queen': {
      addLine(-1,-1); addLine(-1,1); addLine(1,-1); addLine(1,1);
      addLine(-1,0); addLine(1,0); addLine(0,-1); addLine(0,1);
      break;
    }

    case 'king': {
      const kingMoves = [[-1,-1],[-1,0],[-1,1],[0,-1],[0,1],[1,-1],[1,0],[1,1]];
      for (const [dr, dc] of kingMoves) {
        addIfValid(pos.row + dr, pos.col + dc);
      }

      const row = color === 'white' ? 7 : 0;
      if (!piece.hasMoved && pos.row === row && pos.col === 4) {
        if (
          (color === 'white' ? castlingRights.whiteKingSide : castlingRights.blackKingSide) &&
          !board[row][5] && !board[row][6] &&
          board[row][7]?.type === 'rook' && board[row][7]?.color === color
        ) {
          moves.push({ row, col: 6 });
        }
        if (
          (color === 'white' ? castlingRights.whiteQueenSide : castlingRights.blackQueenSide) &&
          !board[row][3] && !board[row][2] && !board[row][1] &&
          board[row][0]?.type === 'rook' && board[row][0]?.color === color
        ) {
          moves.push({ row, col: 2 });
        }
      }
      break;
    }
  }

  return moves;
}

function findKing(board: Board, color: Color): Position | null {
  for (let r = 0; r < 8; r++) {
    for (let c = 0; c < 8; c++) {
      const p = board[r][c];
      if (p && p.type === 'king' && p.color === color) {
        return { row: r, col: c };
      }
    }
  }
  return null;
}

export function isSquareAttacked(board: Board, pos: Position, byColor: Color): boolean {
  for (let r = 0; r < 8; r++) {
    for (let c = 0; c < 8; c++) {
      const piece = board[r][c];
      if (!piece || piece.color !== byColor) continue;

      if (piece.type === 'pawn') {
        const dir = piece.color === 'white' ? -1 : 1;
        if (pos.row === r + dir && (pos.col === c - 1 || pos.col === c + 1)) {
          return true;
        }
        continue;
      }

      const rawMoves = getRawMoves(board, { row: r, col: c }, null, {
        whiteKingSide: false, whiteQueenSide: false,
        blackKingSide: false, blackQueenSide: false,
      });
      if (rawMoves.some(m => m.row === pos.row && m.col === pos.col)) {
        return true;
      }
    }
  }
  return false;
}

function isInCheck(board: Board, color: Color): boolean {
  const kingPos = findKing(board, color);
  if (!kingPos) return false;
  return isSquareAttacked(board, kingPos, getOpponent(color));
}

export function applyMoveToBoard(
  board: Board,
  move: Move,
  castlingRights: CastlingRights,
  enPassantTarget: Position | null
): { board: Board; enPassant: Position | null; rights: CastlingRights; captured: Piece | null } {
  const newBoard = cloneBoard(board);
  const piece = newBoard[move.from.row][move.from.col];
  if (!piece) return { board: newBoard, enPassant: null, rights: { ...castlingRights }, captured: null };

  let captured: Piece | null = newBoard[move.to.row][move.to.col];
  let newEnPassant: Position | null = null;
  const newRights = { ...castlingRights };

  if (piece.type === 'king') {
    if (piece.color === 'white') { newRights.whiteKingSide = false; newRights.whiteQueenSide = false; }
    else { newRights.blackKingSide = false; newRights.blackQueenSide = false; }

    const dc = move.to.col - move.from.col;
    if (Math.abs(dc) === 2) {
      const rookFromCol = dc > 0 ? 7 : 0;
      const rookToCol = dc > 0 ? 5 : 3;
      newBoard[move.from.row][rookToCol] = { ...newBoard[move.from.row][rookFromCol]!, hasMoved: true };
      newBoard[move.from.row][rookFromCol] = null;
    }
  }

  if (piece.type === 'rook') {
    if (move.from.row === 7 && move.from.col === 0) newRights.whiteQueenSide = false;
    if (move.from.row === 7 && move.from.col === 7) newRights.whiteKingSide = false;
    if (move.from.row === 0 && move.from.col === 0) newRights.blackQueenSide = false;
    if (move.from.row === 0 && move.from.col === 7) newRights.blackKingSide = false;
  }

  if (piece.type === 'pawn') {
    const dr = Math.abs(move.to.row - move.from.row);
    if (dr === 2) {
      newEnPassant = { row: (move.from.row + move.to.row) / 2, col: move.from.col };
    }

    if (enPassantTarget && move.to.row === enPassantTarget.row && move.to.col === enPassantTarget.col) {
      const capturedPawnRow = piece.color === 'white' ? move.to.row + 1 : move.to.row - 1;
      captured = newBoard[capturedPawnRow][move.to.col];
      newBoard[capturedPawnRow][move.to.col] = null;
    }

    if (move.promotion) {
      newBoard[move.to.row][move.to.col] = { type: move.promotion, color: piece.color, hasMoved: true };
    } else {
      newBoard[move.to.row][move.to.col] = { ...piece, hasMoved: true };
    }
  } else {
    newBoard[move.to.row][move.to.col] = { ...piece, hasMoved: true };
  }

  newBoard[move.from.row][move.from.col] = null;

  return { board: newBoard, enPassant: newEnPassant, rights: newRights, captured };
}

export function getLegalMoves(
  board: Board,
  pos: Position,
  enPassantTarget: Position | null,
  castlingRights: CastlingRights
): Position[] {
  const piece = board[pos.row][pos.col];
  if (!piece) return [];

  const rawMoves = getRawMoves(board, pos, enPassantTarget, castlingRights);
  const legal: Position[] = [];

  for (const to of rawMoves) {
    const move: Move = { from: pos, to };
    const { board: newBoard } = applyMoveToBoard(board, move, castlingRights, enPassantTarget);

    if (isInCheck(newBoard, piece.color)) continue;

    if (piece.type === 'king' && Math.abs(to.col - pos.col) === 2) {
      const dc = to.col > pos.col ? 1 : -1;
      const passThroughCol = pos.col + dc;
      if (isSquareAttacked(board, pos, getOpponent(piece.color))) continue;
      if (isSquareAttacked(board, { row: pos.row, col: passThroughCol }, getOpponent(piece.color))) continue;
      if (isSquareAttacked(newBoard, to, getOpponent(piece.color))) continue;
    }

    legal.push(to);
  }

  return legal;
}

export function getAllLegalMoves(state: GameState, color: Color): { from: Position; to: Position }[] {
  const all: { from: Position; to: Position }[] = [];
  for (let r = 0; r < 8; r++) {
    for (let c = 0; c < 8; c++) {
      const piece = state.board[r][c];
      if (!piece || piece.color !== color) continue;
      const pos = { row: r, col: c };
      const legal = getLegalMoves(state.board, pos, state.enPassantTarget, state.castlingRights);
      for (const to of legal) {
        all.push({ from: pos, to });
      }
    }
  }
  return all;
}

export function executeMove(state: GameState, move: Move): GameState {
  const piece = state.board[move.from.row][move.from.col];
  if (!piece) return state;

  const isPromotion = piece.type === 'pawn' && (move.to.row === 0 || move.to.row === 7);
  const finalMove: Move = isPromotion && !move.promotion
    ? { ...move, promotion: 'queen' }
    : move;

  const { board: newBoard, enPassant, rights, captured } = applyMoveToBoard(
    state.board, finalMove, state.castlingRights, state.enPassantTarget
  );

  const capturedByWhite = [...state.capturedByWhite];
  const capturedByBlack = [...state.capturedByBlack];

  if (captured) {
    if (piece.color === 'white') capturedByWhite.push(captured);
    else capturedByBlack.push(captured);
  }

  const opponent = getOpponent(state.currentTurn);
  const opponentInCheck = isInCheck(newBoard, opponent);

  const newState: GameState = {
    board: newBoard,
    currentTurn: opponent,
    enPassantTarget: enPassant,
    castlingRights: rights,
    isCheck: opponentInCheck,
    isCheckmate: false,
    isStalemate: false,
    isDraw: false,
    moveHistory: [...state.moveHistory, { ...finalMove, captured: captured || undefined }],
    capturedByWhite,
    capturedByBlack,
    halfMoveClock: (captured || piece.type === 'pawn') ? 0 : state.halfMoveClock + 1,
    fullMoveNumber: state.currentTurn === 'black' ? state.fullMoveNumber + 1 : state.fullMoveNumber,
  };

  const opponentMoves = getAllLegalMoves(newState, opponent);

  if (opponentMoves.length === 0) {
    if (opponentInCheck) {
      newState.isCheckmate = true;
    } else {
      newState.isStalemate = true;
      newState.isDraw = true;
    }
  }

  if (newState.halfMoveClock >= 100) {
    newState.isDraw = true;
  }

  return newState;
}

export function getMaterialScore(state: GameState): { white: number; black: number; advantage: number } {
  let white = 0;
  let black = 0;

  for (const p of state.capturedByWhite) white += PIECE_VALUES[p.type];
  for (const p of state.capturedByBlack) black += PIECE_VALUES[p.type];

  return { white, black, advantage: white - black };
}

export function getDominanceRank(advantage: number, perspective: Color): string {
  const score = perspective === 'white' ? advantage : -advantage;
  if (score >= 7) return 'S';
  if (score >= 4) return 'A';
  if (score >= 2) return 'B';
  if (score >= 1) return 'C';
  return 'D';
}

export function posToAlgebraic(pos: Position): string {
  return String.fromCharCode(97 + pos.col) + (8 - pos.row);
}

export function getGameStateAtMove(moves: Move[], limit: number): GameState {
  let state = createInitialGameState();
  const actualLimit = Math.min(limit, moves.length);
  for (let i = 0; i < actualLimit; i++) {
    state = executeMove(state, moves[i]);
  }
  return state;
}

export function evaluatePosition(state: GameState): number {
  if (state.isCheckmate) return state.currentTurn === 'white' ? -1000 : 1000;
  if (state.isDraw || state.isStalemate) return 0;

  let score = 0;
  const board = state.board;

  // 1. Material & Position
  for (let r = 0; r < 8; r++) {
    for (let c = 0; c < 8; c++) {
      const piece = board[r][c];
      if (!piece) continue;

      const val = PIECE_VALUES[piece.type];
      const colorMult = piece.color === 'white' ? 1 : -1;
      
      score += val * colorMult;

      // Center Control (d4, e4, d5, e5 bonus)
      if ((r >= 3 && r <= 4) && (c >= 3 && c <= 4)) {
        score += 0.25 * colorMult;
      }
    }
  }

  // 2. Mobility (Number of legal moves)
  const whiteMoves = getAllLegalMoves(state, 'white').length;
  const blackMoves = getAllLegalMoves(state, 'black').length;
  score += (whiteMoves - blackMoves) * 0.05;

  // 3. King Safety (Simple: check penalty)
  if (state.isCheck) {
    score += state.currentTurn === 'white' ? -0.5 : 0.5;
  }

  return score;
}

export function moveToNotation(move: Move, piece: Piece, captured: boolean, isCheck: boolean, isCheckmate: boolean): string {
  const file = String.fromCharCode(97 + move.to.col);
  const rank = 8 - move.to.row;
  
  if (move.isCastle) {
    return move.to.col > move.from.col ? 'O-O' : 'O-O-O';
  }

  let notation = '';
  if (piece.type !== 'pawn') {
    notation += piece.type.charAt(0).toUpperCase();
  } else if (captured) {
    notation += String.fromCharCode(97 + move.from.col);
  }

  if (captured || move.isEnPassant) notation += 'x';
  notation += `${file}${rank}`;
  if (move.promotion) notation += `=${move.promotion.charAt(0).toUpperCase()}`;
  if (isCheckmate) notation += '#';
  else if (isCheck) notation += '+';

  return notation;
}

export type MoveQuality = 'best' | 'great' | 'good' | 'inaccuracy' | 'mistake' | 'blunder' | 'book';

export interface MoveAnalysis {
  quality: MoveQuality;
  evalChange: number;
  message: string;
  bestMove?: string;
}

export interface FullAnalysis {
  moves: MoveAnalysis[];
  accuracy: { white: number; black: number };
  counts: {
    white: Record<MoveQuality, number>;
    black: Record<MoveQuality, number>;
  };
}

const QUALITY_WEIGHTS: Record<MoveQuality, number> = {
  best: 100,
  great: 90,
  book: 100,
  good: 75,
  inaccuracy: 40,
  mistake: 15,
  blunder: 0
};

export function analyzeGame(moves: Move[]): FullAnalysis {
  const analysis: MoveAnalysis[] = [];
  const counts = {
    white: { best: 0, great: 0, good: 0, book: 0, inaccuracy: 0, mistake: 0, blunder: 0 },
    black: { best: 0, great: 0, good: 0, book: 0, inaccuracy: 0, mistake: 0, blunder: 0 }
  };
  
  let currentState = createInitialGameState();
  let prevEval = 0; // Starting eval is 0

  for (let i = 0; i < moves.length; i++) {
    const move = moves[i];
    const turn = currentState.currentTurn;
    const nextState = executeMove(currentState, move);
    
    // Get sophisticated evaluation
    const currentEval = evaluatePosition(nextState);

    // Change in evaluation from the perspective of the player who just moved
    // If White moves, gain = currentEval - prevEval
    // If Black moves, gain = prevEval - currentEval
    let diff = turn === 'white' ? (currentEval - prevEval) : (prevEval - currentEval);
    
    let quality: MoveQuality = 'good';
    let message = 'Solid move';

    // Logic for classifying moves (Tuned thresholds)
    if (i < 8) { // Openings
      quality = 'book';
      message = 'Opening phase';
    } else if (nextState.isCheckmate) { 
      quality = 'best'; 
      message = 'Checkmate delivered!'; 
    } else if (diff >= 1.5) { 
      quality = 'best'; 
      message = 'Powerful move!'; 
    } else if (diff >= 0.4) { 
      quality = 'great'; 
      message = 'Strong decision'; 
    } else if (diff <= -2.0) { 
      quality = 'blunder'; 
      message = 'Major blunder'; 
    } else if (diff <= -0.8) { 
      quality = 'mistake'; 
      message = 'Tough mistake'; 
    } else if (diff <= -0.3) { 
      quality = 'inaccuracy'; 
      message = 'Inaccurate move'; 
    }

    analysis.push({ quality, evalChange: diff, message });
    counts[turn][quality]++;

    prevEval = currentEval;
    currentState = nextState;
  }

  const calcAcc = (color: 'white' | 'black') => {
    const playerMoves = analysis.filter((_, idx) => (idx % 2 === 0) === (color === 'white'));
    if (playerMoves.length === 0) return 100;
    const sum = playerMoves.reduce((acc, m) => acc + QUALITY_WEIGHTS[m.quality], 0);
    return Math.min(100, Math.round(sum / playerMoves.length));
  };

  return {
    moves: analysis,
    accuracy: { white: calcAcc('white'), black: calcAcc('black') },
    counts
  };
}
