# ♟️ Multiverse Mate

<div align="center">

![Anime Chess Banner](https://img.shields.io/badge/Anime-Chess-purple?style=for-the-badge&logo=data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHZpZXdCb3g9IjAgMCAyNCAyNCI+PHBhdGggZmlsbD0id2hpdGUiIGQ9Ik0xOSAyMlY4bC02LTYtNiA2djE0SDV2LTJIN3YtMmgxMHYyaDJ2MmgtMnpNMTMgMTVoLTJ2LTJoMnYyem0wLTRoLTJWOWgydjJ6Ii8+PC9zdmc+)
![TypeScript](https://img.shields.io/badge/TypeScript-007ACC?style=for-the-badge&logo=typescript&logoColor=white)
![React](https://img.shields.io/badge/React-20232A?style=for-the-badge&logo=react&logoColor=61DAFB)
![Node.js](https://img.shields.io/badge/Node.js-43853D?style=for-the-badge&logo=node.js&logoColor=white)
![Render](https://img.shields.io/badge/Render-46E3B7?style=for-the-badge&logo=render&logoColor=white)

**Chess, but make it anime. ⚡**

[🎮 Play Now](https://multiverse-mate-chess.onrender.com) • [🐛 Report Bug](https://github.com/Vijay141516/multiverse-mate/issues) • [✨ Request Feature](https://github.com/Vijay141516/multiverse-mate/issues)

</div>

---

## 🌌 What is Multiverse Mate?

**Multiverse Mate** is a full-stack anime-themed chess game where your favorite characters from **Jujutsu Kaisen, My Hero Academia, Naruto**, and more become your chess pieces. Play against an AI bot or challenge a friend in real-time multiplayer — all wrapped in a slick dark UI with pixel-art anime sprites.

> *"What if Gojo Satoru was your king and All Might was your rook?"*

---

## ✨ Features

- 🎭 **Anime Pixel Art Pieces** — Mixed characters from JJK, MHA, Naruto and more
- 🤖 **AI Bot** — Play against an AI with selectable difficulty (Balanced, and more)
- 🌐 **Online Multiplayer** — Challenge friends in real-time
- ⏱️ **Chess Clock** — Timed matches with per-player countdown
- 🎮 **Classic Mode** — Standard chess rules with anime aesthetics
- 📱 **Mobile Friendly** — Playable on phone browsers
- 🌑 **Dark Theme** — Easy on the eyes, hard on your opponents

---

## 🛠️ Tech Stack

| Layer | Technology |
|---|---|
| Frontend | React + TypeScript |
| Backend | Node.js + TypeScript |
| Validation | Zod |
| Package Manager | pnpm (monorepo) |
| Database | PostgreSQL |
| Deployment | Render.com |
| Dev Environment | Replit + Google Antigravity |

---

## 🏗️ Project Structure

```
multiverse-mate/
├── lib/
│   ├── api-client-react/   # React hooks for API calls
│   ├── api-spec/           # Shared API contract (types & routes)
│   ├── api-zod/            # Zod validation schemas
│   └── db/                 # Database layer
├── artifacts/              # Build output
├── attached_assets/        # Anime sprite assets
├── scripts/                # Build & utility scripts
├── render.yaml             # Render deployment config
├── pnpm-workspace.yaml     # Monorepo workspace config
└── tsconfig.json           # TypeScript config
```

---

## 🚀 Getting Started

### Prerequisites

- Node.js 18+
- pnpm

```bash
npm install -g pnpm
```

### Installation

```bash
# Clone the repo
git clone https://github.com/Vijay141516/multiverse-mate.git
cd multiverse-mate

# Install dependencies
pnpm install

# Start development server
pnpm dev
```

### Windows

```powershell
# Run with PowerShell script
./run.ps1
```

---

## 🎮 How to Play

1. Open [multiverse-mate-chess.onrender.com](https://multiverse-mate-chess.onrender.com)
2. Choose **vs AI Bot** or **Multiplayer**
3. Select difficulty (Balanced recommended for beginners)
4. Your pieces are at the bottom — White starts first
5. Tap a piece to select, then tap a square to move
6. Checkmate the opponent's King to win ♟️

---

## 🤖 Built With AI Agents

This project was built using a multi-agent AI workflow:

- **[Google Antigravity](https://developers.googleblog.com/build-with-google-antigravity-our-new-agentic-development-platform/)** — VS Code-based agentic IDE with Gemini 3.1 Pro + Claude — used for parallel agent development
- **[Replit AI](https://replit.com)** — Used for running, testing, and iterating

Multiple AI agents worked simultaneously on different parts of the codebase — frontend, backend, API layer, and database — orchestrated via Antigravity's Manager view.

---

## 🙏 Acknowledgements

- Anime sprite art for the chess pieces
- [chess.js](https://github.com/jhlywa/chess.js) for chess logic
- Google Antigravity & Replit AI for agentic development
- Render.com for free hosting

---

## 📄 License

MIT License — feel free to fork and build your own anime chess variant!

---

<div align="center">

Made with ♟️ + ⚡ by [Vijay141516](https://github.com/Vijay141516)

⭐ Star this repo if you like it!

</div>
