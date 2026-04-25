
import { Move, createInitialGameState, executeMove, generateFEN, FullAnalysis, MoveQuality } from './chess';
import { evaluateFEN, getMoveQuality } from './stockfish-analysis';

const QUALITY_WEIGHTS: Record<MoveQuality, number> = {
  best: 100,
  great: 95,
  book: 100,
  good: 80,
  inaccuracy: 50,
  mistake: 20,
  blunder: 0
};

export async function runFullAnalysis(moves: Move[], onProgress?: (p: number) => void): Promise<FullAnalysis> {
  const analysis: any[] = [];
  const counts = {
    white: { best: 0, great: 0, good: 0, book: 0, inaccuracy: 0, mistake: 0, blunder: 0 },
    black: { best: 0, great: 0, good: 0, book: 0, inaccuracy: 0, mistake: 0, blunder: 0 }
  };
  
  let currentState = createInitialGameState();
  let prevEval = 20; // Slight white advantage for start pos in Stockfish units

  // 1. Initial Evaluation
  // prevEval = await evaluateFEN(generateFEN(currentState));

  for (let i = 0; i < moves.length; i++) {
    const move = moves[i];
    const turn = currentState.currentTurn;
    
    // 1. Find BEST MOVE for the current state (before player moves)
    const beforeFen = generateFEN(currentState);
    const { bestMove } = await evaluateFEN(beforeFen);

    // 2. Execute player's move and evaluate the result
    const nextState = executeMove(currentState, move);
    const afterFen = generateFEN(nextState);
    const { score: currentEval } = await evaluateFEN(afterFen);

    const quality = getMoveQuality(prevEval, currentEval, turn) as MoveQuality;
    
    analysis.push({ 
      quality, 
      evalChange: turn === 'white' ? (currentEval - prevEval) : (prevEval - currentEval),
      message: `${quality.charAt(0).toUpperCase() + quality.slice(1)} move`,
      bestMove // This is the move they SHOULD have played
    });

    counts[turn][quality]++;
    prevEval = currentEval;
    currentState = nextState;

    if (onProgress) onProgress(Math.round(((i + 1) / moves.length) * 100));
    await new Promise(r => setTimeout(r, 10)); // Heartbeat for UI thread
  }

  const calcAcc = (color: 'white' | 'black') => {
    const playerMoves = analysis.filter((_, idx) => (idx % 2 === 0) === (color === 'white'));
    if (playerMoves.length === 0) return 100;
    const sum = playerMoves.reduce((acc, m) => acc + QUALITY_WEIGHTS[m.quality as MoveQuality], 0);
    return Math.min(100, Math.round(sum / playerMoves.length));
  };

  return {
    moves: analysis,
    accuracy: { white: calcAcc('white'), black: calcAcc('black') },
    counts
  };
}
