
const STOCKFISH_URL = 'https://cdnjs.cloudflare.com/ajax/libs/stockfish.js/10.0.2/stockfish.js';

let worker: Worker | null = null;
let resolveEval: ((val: { score: number; bestMove?: string }) => void) | null = null;

async function getWorker(): Promise<Worker> {
  if (worker) return worker;

  const response = await fetch(STOCKFISH_URL);
  const script = await response.text();
  const blob = new Blob([script], { type: 'application/javascript' });
  worker = new Worker(URL.createObjectURL(blob));

  let currentScore = 0;

  worker.onmessage = (e) => {
    const msg = e.data;
    // console.log('SF:', msg); // Debug log

    if (msg.includes('score cp')) {
      const match = msg.match(/score cp (-?\d+)/);
      if (match) currentScore = parseInt(match[1]);
    } else if (msg.includes('score mate')) {
      const match = msg.match(/score mate (-?\d+)/);
      if (match) {
        const mateIn = parseInt(match[1]);
        currentScore = mateIn > 0 ? 15000 - mateIn : -15000 - mateIn;
      }
    } else if (msg.includes('bestmove')) {
      const match = msg.match(/bestmove ([a-h][1-8][a-h][1-8][qrbn]?)/);
      if (resolveEval) {
        resolveEval({ 
          score: currentScore, 
          bestMove: match ? match[1] : undefined 
        });
        resolveEval = null;
      }
    }
  };

  worker.postMessage('uci');
  worker.postMessage('setoption name Hash value 128');
  worker.postMessage('setoption name Threads value 4');
  return worker;
}

export async function evaluateFEN(fen: string, depth = 15): Promise<{ score: number; bestMove?: string }> {
  const sf = await getWorker();
  
  return new Promise((resolve, reject) => {
    const timeout = setTimeout(() => {
      resolveEval = null;
      resolve({ score: 0 }); // Fallback on timeout
    }, 10000);

    resolveEval = (val) => {
      clearTimeout(timeout);
      resolve(val);
    };

    sf.postMessage(`position fen ${fen}`);
    sf.postMessage(`go depth ${depth}`);
  });
}

export function getMoveQuality(prevScore: number, currentScore: number, turn: 'white' | 'black'): string {
  const before = turn === 'white' ? prevScore : -prevScore;
  const after = turn === 'white' ? currentScore : -currentScore;
  const loss = before - after; 

  if (loss <= 0) return 'best';       // No loss or improvement
  if (loss <= 20) return 'great';     // Very minor loss
  if (loss <= 50) return 'good';      // Acceptable loss
  if (loss <= 120) return 'inaccuracy'; // Notable loss
  if (loss <= 250) return 'mistake';   // Significant error
  return 'blunder';                   // Critical failure
}
