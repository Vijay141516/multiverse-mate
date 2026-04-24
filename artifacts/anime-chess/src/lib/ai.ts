import { GameState, Color, Position, PieceType, executeMove, getAllLegalMoves, applyMoveToBoard, getLegalMoves, isSquareAttacked } from './chess';

const PIECE_VALUES: Record<PieceType, number> = {
  pawn: 100,
  knight: 320,
  bishop: 330,
  rook: 500,
  queen: 900,
  king: 20000,
};

const PAWN_TABLE = [
  [0,  0,  0,  0,  0,  0,  0,  0],
  [50, 50, 50, 50, 50, 50, 50, 50],
  [10, 10, 20, 30, 30, 20, 10, 10],
  [5,  5, 10, 25, 25, 10,  5,  5],
  [0,  0,  0, 20, 20,  0,  0,  0],
  [5, -5,-10,  0,  0,-10, -5,  5],
  [5, 10, 10,-20,-20, 10, 10,  5],
  [0,  0,  0,  0,  0,  0,  0,  0],
];

const KNIGHT_TABLE = [
  [-50,-40,-30,-30,-30,-30,-40,-50],
  [-40,-20,  0,  0,  0,  0,-20,-40],
  [-30,  0, 10, 15, 15, 10,  0,-30],
  [-30,  5, 15, 20, 20, 15,  5,-30],
  [-30,  0, 15, 20, 20, 15,  0,-30],
  [-30,  5, 10, 15, 15, 10,  5,-30],
  [-40,-20,  0,  5,  5,  0,-20,-40],
  [-50,-40,-30,-30,-30,-30,-40,-50],
];

const BISHOP_TABLE = [
  [-20,-10,-10,-10,-10,-10,-10,-20],
  [-10,  0,  0,  0,  0,  0,  0,-10],
  [-10,  0,  5, 10, 10,  5,  0,-10],
  [-10,  5,  5, 10, 10,  5,  5,-10],
  [-10,  0, 10, 10, 10, 10,  0,-10],
  [-10, 10, 10, 10, 10, 10, 10,-10],
  [-10,  5,  0,  0,  0,  0,  5,-10],
  [-20,-10,-10,-10,-10,-10,-10,-20],
];

const ROOK_TABLE = [
  [0,  0,  0,  0,  0,  0,  0,  0],
  [5, 10, 10, 10, 10, 10, 10,  5],
  [-5,  0,  0,  0,  0,  0,  0, -5],
  [-5,  0,  0,  0,  0,  0,  0, -5],
  [-5,  0,  0,  0,  0,  0,  0, -5],
  [-5,  0,  0,  0,  0,  0,  0, -5],
  [-5,  0,  0,  0,  0,  0,  0, -5],
  [0,  0,  0,  5,  5,  0,  0,  0],
];

const QUEEN_TABLE = [
  [-20,-10,-10, -5, -5,-10,-10,-20],
  [-10,  0,  0,  0,  0,  0,  0,-10],
  [-10,  0,  5,  5,  5,  5,  0,-10],
  [-5,  0,  5,  5,  5,  5,  0, -5],
  [0,  0,  5,  5,  5,  5,  0, -5],
  [-10,  5,  5,  5,  5,  5,  0,-10],
  [-10,  0,  5,  0,  0,  0,  0,-10],
  [-20,-10,-10, -5, -5,-10,-10,-20],
];

const KING_TABLE = [
  [-30,-40,-40,-50,-50,-40,-40,-30],
  [-30,-40,-40,-50,-50,-40,-40,-30],
  [-30,-40,-40,-50,-50,-40,-40,-30],
  [-30,-40,-40,-50,-50,-40,-40,-30],
  [-20,-30,-30,-40,-40,-30,-30,-20],
  [-10,-20,-20,-20,-20,-20,-20,-10],
  [20, 20,  0,  0,  0,  0, 20, 20],
  [20, 30, 10,  0,  0, 10, 30, 20],
];

function getPosBonus(type: PieceType, row: number, col: number, color: Color): number {
  const r = color === 'white' ? row : 7 - row;
  switch (type) {
    case 'pawn': return PAWN_TABLE[r][col];
    case 'knight': return KNIGHT_TABLE[r][col];
    case 'bishop': return BISHOP_TABLE[r][col];
    case 'rook': return ROOK_TABLE[r][col];
    case 'queen': return QUEEN_TABLE[r][col];
    case 'king': return KING_TABLE[r][col];
  }
}

function evaluateBoard(state: GameState): number {
  let score = 0;
  for (let r = 0; r < 8; r++) {
    for (let c = 0; c < 8; c++) {
      const piece = state.board[r][c];
      if (!piece) continue;
      const value = PIECE_VALUES[piece.type] + getPosBonus(piece.type, r, c, piece.color);
      if (piece.color === 'white') score += value;
      else score -= value;
    }
  }
  return score;
}

function minimax(
  state: GameState,
  depth: number,
  alpha: number,
  beta: number,
  isMaximizing: boolean
): number {
  if (depth === 0 || state.isCheckmate || state.isStalemate || state.isDraw) {
    if (state.isCheckmate) {
      return isMaximizing ? -100000 : 100000;
    }
    return evaluateBoard(state);
  }

  const color: Color = isMaximizing ? 'white' : 'black';
  const moves = getAllLegalMoves(state, color);

  if (moves.length === 0) return evaluateBoard(state);

  if (isMaximizing) {
    let best = -Infinity;
    for (const { from, to } of moves) {
      const newState = executeMove(state, { from, to });
      const score = minimax(newState, depth - 1, alpha, beta, false);
      best = Math.max(best, score);
      alpha = Math.max(alpha, best);
      if (beta <= alpha) break;
    }
    return best;
  } else {
    let best = Infinity;
    for (const { from, to } of moves) {
      const newState = executeMove(state, { from, to });
      const score = minimax(newState, depth - 1, alpha, beta, true);
      best = Math.min(best, score);
      beta = Math.min(beta, best);
      if (beta <= alpha) break;
    }
    return best;
  }
}

export function getBestMove(state: GameState, color: Color, depth = 3): { from: Position; to: Position } | null {
  const moves = getAllLegalMoves(state, color);
  if (moves.length === 0) return null;

  const isMaximizing = color === 'white';
  let bestScore = isMaximizing ? -Infinity : Infinity;
  let bestMove = moves[0];

  const shuffled = [...moves].sort(() => Math.random() - 0.5);

  for (const move of shuffled) {
    const newState = executeMove(state, { from: move.from, to: move.to });
    const score = minimax(newState, depth - 1, -Infinity, Infinity, !isMaximizing);
    if (isMaximizing ? score > bestScore : score < bestScore) {
      bestScore = score;
      bestMove = move;
    }
  }

  return bestMove;
}
