# Workspace

## Overview

pnpm workspace monorepo using TypeScript. Each package manages its own dependencies.

## Stack

- **Monorepo tool**: pnpm workspaces
- **Node.js version**: 24
- **Package manager**: pnpm
- **TypeScript version**: 5.9
- **API framework**: Express 5
- **Database**: PostgreSQL + Drizzle ORM
- **Validation**: Zod (`zod/v4`), `drizzle-zod`
- **API codegen**: Orval (from OpenAPI spec)
- **Build**: esbuild (CJS bundle)

## Key Commands

- `pnpm run typecheck` — full typecheck across all packages
- `pnpm run build` — typecheck + build all packages
- `pnpm --filter @workspace/api-spec run codegen` — regenerate API hooks and Zod schemas from OpenAPI spec
- `pnpm --filter @workspace/db run push` — push DB schema changes (dev only)
- `pnpm --filter @workspace/api-server run dev` — run API server locally

See the `pnpm-workspace` skill for workspace structure, TypeScript setup, and package details.

## Artifacts

### Anime Chess (`artifacts/anime-chess`)
- **Preview path**: `/`
- **Type**: React + Vite web app
- **Description**: A modern 2D strategy chess game with anime characters replacing traditional pieces

#### Character Roster
| Piece  | Character   |
|--------|-------------|
| Pawn   | Zetsu       |
| Knight | Minato Namikaze |
| Bishop | Aizen Sosuke |
| Rook   | All Might   |
| Queen  | Satoru Gojo |
| King   | Lelouch Lamperouge |

#### Features
- Full chess rules engine (pawns, castling, en passant, promotion, check/checkmate/stalemate)
- AI opponent using minimax with alpha-beta pruning (depth 3)
- Classic Mode + Battle Mode (ability animations on captures)
- **Among Us-style kill animation**: attacker flies in, delivers signature move, victim dissolves
- Accurate ability animations per character (Hollow Purple, Flying Thunder God, Kyoka Suigetsu, Detroit Smash, Geass Command, Spore Release)
- **Drag-and-drop pieces** (HTML5 drag API for desktop)
- **Online multiplayer** via 4-digit room codes (REST polling, 30-min expiry)
- Dominance Rank System (S/A/B/C/D based on material advantage)
- Glassmorphism dark UI (#0B0F1A background)
- AI-generated PNG sprites in `public/pieces/` (6 characters, both colors via CSS filter)
  - White pieces: vibrant original colors
  - Black pieces: dark shadow silhouette (brightness 28%, indigo-violet tint = clearly sinister)
- Accent color theming (6 colors)
- Mobile responsive with hamburger drawer
- Move history panel + player info with captured pieces

#### Online Multiplayer API (`artifacts/api-server`)
- `POST /api/chess/rooms` — create room (returns 4-digit code, color)
- `POST /api/chess/rooms/:code/join` — join as black
- `GET /api/chess/rooms/:code` — poll state (moves array)
- `POST /api/chess/rooms/:code/move` — submit move
- Rooms stored in-memory, expire after 30 min of inactivity

#### Key Files
- `src/lib/chess.ts` — Complete chess engine
- `src/lib/ai.ts` — Minimax AI with position tables
- `src/components/ChessPiece.tsx` — PNG sprites with color-separation CSS filters
- `src/components/Board.tsx` — Interactive board with drag-and-drop + kill animation trigger
- `src/components/AbilityEffect.tsx` — Among Us kill scene + accurate ability CSS animations
- `src/hooks/useChessGame.ts` — Game state with extended CaptureEffect (attacker+captured info)
- `src/hooks/useOnlineGame.ts` — Online game hook with REST polling
- `src/pages/MenuPage.tsx` — Main menu with character showcase grid
- `src/pages/GamePage.tsx` — Game screen (AI + local 2P)
- `src/pages/OnlineLobbyPage.tsx` — Online room create/join lobby
- `public/pieces/{pawn,knight,bishop,rook,queen,king}.png` — AI-generated character sprites
- `public/abilities/` — Ability effect PNG images
