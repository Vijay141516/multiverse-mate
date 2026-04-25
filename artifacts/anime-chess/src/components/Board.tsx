import React, { useState, useCallback, useRef } from 'react';
import { Board as BoardType, Position, Move, Color, PieceType } from '../lib/chess';
import ChessPiece, { PieceStyle } from './ChessPiece';

export type BoardTheme = 'anime' | 'classic';

const THEMES: Record<BoardTheme, { light: string; dark: string; lightLabel: string; darkLabel: string }> = {
  anime:   { light: 'rgba(215,200,165,0.18)', dark: 'rgba(38,33,58,0.92)',  lightLabel: 'rgba(38,33,58,0.5)',    darkLabel: 'rgba(215,200,165,0.4)' },
  classic: { light: 'rgba(238,238,210,0.92)', dark: 'rgba(118,150,86,0.92)', lightLabel: 'rgba(118,150,86,0.7)',  darkLabel: 'rgba(238,238,210,0.6)' },
};

interface BoardProps {
  board: BoardType;
  selectedPos: Position | null;
  legalMoves: Position[];
  lastMove: Move | null;
  onSquareClick: (pos: Position) => void;
  flipped?: boolean;
  isCheck: boolean;
  currentTurn: Color;
  boardTheme?: BoardTheme;
  pieceStyle?: PieceStyle;
  premove?: Move | null;
  playerColor?: Color;
  classicGlowEnabled?: boolean;
}

function getKingPos(board: BoardType, color: Color): Position | null {
  for (let r = 0; r < 8; r++)
    for (let c = 0; c < 8; c++) {
      const p = board[r][c];
      if (p?.type === 'king' && p.color === color) return { row: r, col: c };
    }
  return null;
}

export default function Board({
  board, selectedPos, legalMoves, lastMove, onSquareClick, flipped = false,
  isCheck, currentTurn, boardTheme = 'anime', pieceStyle = 'anime', premove, playerColor,
  classicGlowEnabled, suggestion,
}: BoardProps & { suggestion?: { from: Position; to: Position } | null }) {
  const theme = THEMES[boardTheme];

  // ── Drag state ──
  const [dragFrom, setDragFrom] = useState<Position | null>(null);
  const [dragOver, setDragOver] = useState<Position | null>(null);
  // Ghost piece for drag visual
  const [ghostPos, setGhostPos] = useState<{ x: number; y: number } | null>(null);
  const boardRef = useRef<HTMLDivElement>(null);

  const handlePointerDown = useCallback((e: React.PointerEvent, pos: Position) => {
    const piece = board[pos.row][pos.col];
    if (!piece || (piece.color !== currentTurn && piece.color !== playerColor)) return;
    
    // Start dragging
    setDragFrom(pos);
    setGhostPos({ x: e.clientX, y: e.clientY });
    onSquareClick(pos); // Select the piece to show legal moves
    
    // Capture pointer to track movement outside the element
    (e.target as HTMLElement).setPointerCapture(e.pointerId);
  }, [board, currentTurn, playerColor, onSquareClick]);

  const handlePointerMove = useCallback((e: React.PointerEvent) => {
    if (!dragFrom) return;
    setGhostPos({ x: e.clientX, y: e.clientY });

    // Find what square we are over
    if (boardRef.current) {
      const rect = boardRef.current.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;
      
      const col = Math.floor((x / rect.width) * 8);
      const row = Math.floor((y / rect.height) * 8);
      
      if (col >= 0 && col < 8 && row >= 0 && row < 8) {
        const boardRow = flipped ? 7 - row : row;
        const boardCol = flipped ? 7 - col : col;
        setDragOver({ row: boardRow, col: boardCol });
      } else {
        setDragOver(null);
      }
    }
  }, [dragFrom, flipped]);

  const handlePointerUp = useCallback((e: React.PointerEvent) => {
    if (!dragFrom) return;

    if (dragOver) {
      // If we dropped on a different square, attempt a move
      if (dragOver.row !== dragFrom.row || dragOver.col !== dragFrom.col) {
        onSquareClick(dragOver);
      }
    }

    setDragFrom(null);
    setDragOver(null);
    setGhostPos(null);
  }, [dragFrom, dragOver, onSquareClick]);

  const checkKingPos = isCheck ? getKingPos(board, currentTurn) : null;
  const cells: React.ReactNode[] = [];

  for (let displayRow = 0; displayRow < 8; displayRow++) {
    const boardRow = flipped ? 7 - displayRow : displayRow;
    for (let displayCol = 0; displayCol < 8; displayCol++) {
      const boardCol = flipped ? 7 - displayCol : displayCol;
      const isLight = (boardRow + boardCol) % 2 === 0;
      const piece = board[boardRow][boardCol];
      const pos: Position = { row: boardRow, col: boardCol };

      const isSelected  = selectedPos?.row === boardRow && selectedPos?.col === boardCol;
      const isLegal     = legalMoves.some(m => m.row === boardRow && m.col === boardCol);
      const isDragOver  = dragOver?.row === boardRow && dragOver?.col === boardCol;
      const isDragSrc   = dragFrom?.row === boardRow && dragFrom?.col === boardCol;
      const isPremove   = (premove?.from.row === boardRow && premove?.from.col === boardCol) ||
                          (premove?.to.row   === boardRow && premove?.to.col   === boardCol);
      
      const isLastMove  = (lastMove?.from.row === boardRow && lastMove?.from.col === boardCol) ||
                          (lastMove?.to.row   === boardRow && lastMove?.to.col   === boardCol);
      const isCheckSq = isCheck && checkKingPos?.row === boardRow && checkKingPos?.col === boardCol;
      const isLanding = lastMove?.to.row === boardRow && lastMove?.to.col === boardCol;
      const isSuggestedFrom = suggestion?.from.row === boardRow && suggestion?.from.col === boardCol;
      const isSuggestedTo = suggestion?.to.row === boardRow && suggestion?.to.col === boardCol;

      let bg = isLight ? theme.light : theme.dark;
      if (isSelected)    bg = 'rgba(72,200,110,0.45)';
      else if (isPremove) bg = 'rgba(239,68,68,0.35)';
      else if (isLastMove) bg = isLight ? 'rgba(210,210,75,0.38)' : 'rgba(180,180,55,0.28)';
      if (isCheckSq)     bg = 'rgba(215,35,35,0.65)';
      if (isDragOver && isLegal) bg = 'rgba(72,200,110,0.6)';

      const canDrag = !!piece && (piece.color === currentTurn || piece.color === playerColor);

      cells.push(
        <div
          key={`${boardRow}-${boardCol}`}
          onClick={() => { if (!dragFrom) onSquareClick(pos); }}
          style={{
            position: 'relative',
            background: bg,
            cursor: canDrag ? 'grab' : isLegal ? 'pointer' : 'default',
            transition: 'background 0.1s ease',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            overflow: 'visible',
            minWidth: 0,
            minHeight: 0,
            outline: isDragOver && isLegal ? '2px solid rgba(90,220,110,0.9)' : 'none',
            touchAction: 'none', // Prevent scrolling while dragging
          }}
        >
          {isSuggestedTo && (
            <div className="absolute inset-0 border-[3px] border-blue-400/60 rounded-sm shadow-[inset_0_0_15px_rgba(96,165,250,0.5)] z-10 animate-pulse" />
          )}
          {isSuggestedFrom && (
            <div className="absolute inset-0 border-[2px] border-blue-400/30 rounded-sm z-10" />
          )}

          {/* Landing Glow Effect */}
          {isLanding && (pieceStyle === 'anime' || classicGlowEnabled) && (
            <div 
              key={`${lastMove.from.row}-${lastMove.from.col}-${lastMove.to.row}-${lastMove.to.col}`}
              className="absolute inset-0 z-0 pointer-events-none"
              style={{
                background: lastMove.captured 
                  ? 'radial-gradient(circle, rgba(239,68,68,0.7) 0%, transparent 75%)' 
                  : 'radial-gradient(circle, rgba(59,130,246,0.6) 0%, transparent 75%)',
                animation: 'landingGlow 0.8s cubic-bezier(0.2, 0, 0.2, 1) forwards',
              }}
            />
          )}
          {/* Rank / file labels */}
          {displayCol === 0 && (
            <span style={{
              position:'absolute', top:2, left:3, fontSize:'9px', fontWeight:700,
              lineHeight:1, fontFamily:'monospace', pointerEvents:'none', zIndex:3,
              color: isLight ? theme.lightLabel : theme.darkLabel,
            }}>
              {8 - boardRow}
            </span>
          )}
          {displayRow === 7 && (
            <span style={{
              position:'absolute', bottom:1, right:3, fontSize:'9px', fontWeight:700,
              lineHeight:1, fontFamily:'monospace', pointerEvents:'none', zIndex:3,
              color: isLight ? theme.lightLabel : theme.darkLabel,
            }}>
              {String.fromCharCode(97 + boardCol)}
            </span>
          )}

          {/* Legal move dot / capture ring */}
          {isLegal && (
            <div style={{
              position:'absolute', inset:0, display:'flex',
              alignItems:'center', justifyContent:'center',
              pointerEvents:'none', zIndex:10,
            }}>
              {piece ? (
                <div style={{ position:'absolute', inset:0, border:'3px solid rgba(90,220,110,0.85)', borderRadius:'2px' }} />
              ) : (
                <div style={{
                  width:'32%', height:'32%', borderRadius:'50%',
                  background:'rgba(90,220,110,0.55)',
                  boxShadow:'0 0 12px rgba(90,220,110,0.5)',
                }} />
              )}
            </div>
          )}

          {/* Chess piece — draggable */}
          {piece && (
            <div
              onPointerDown={e => handlePointerDown(e, pos)}
              onPointerMove={handlePointerMove}
              onPointerUp={handlePointerUp}
              style={{
                width:'100%', height:'100%', zIndex: 5,
                cursor: canDrag ? 'grab' : 'default',
                transform: isDragSrc ? 'scale(0.8)' : 'scale(1)',
                opacity: isDragSrc ? 0.5 : 1,
                transition: 'transform 0.15s ease',
                userSelect:'none',
                touchAction: 'none',
              }}
            >
              <ChessPiece
                type={piece.type}
                color={piece.color}
                isSelected={isSelected}
                isDragging={isDragSrc}
                style={pieceStyle}
                glowEnabled={classicGlowEnabled}
              />
            </div>
          )}
        </div>
      );
    }
  }

  return (
    <div
      ref={boardRef}
      style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(8, 1fr)',
        gridTemplateRows: 'repeat(8, 1fr)',
        width: '100%', aspectRatio: '1',
        borderRadius: '8px',
        overflow: 'visible',
        boxShadow: '0 0 60px rgba(0,0,0,0.95), 0 0 0 1px rgba(255,255,255,0.06), inset 0 0 30px rgba(255,255,255,0.05)',
      }}
    >
      {cells}

      {/* Drag Ghost */}
      {dragFrom && ghostPos && (
        <div style={{
          position: 'fixed',
          left: ghostPos.x,
          top: ghostPos.y,
          width: '60px',
          height: '60px',
          pointerEvents: 'none',
          zIndex: 1000,
          transform: 'translate(-50%, -50%)',
          animation: 'dragPulse 1.5s infinite ease-in-out',
        }}>
          {(() => {
            const piece = board[dragFrom.row][dragFrom.col];
            if (!piece) return null;
            return (
              <ChessPiece
                type={piece.type}
                color={piece.color}
                isSelected={false}
                style={pieceStyle}
                glowEnabled={classicGlowEnabled}
              />
            );
          })()}
        </div>
      )}
    </div>

  );
}
