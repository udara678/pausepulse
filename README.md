<h1 align="center">
  <img src="https://img.shields.io/badge/PausePulse-Wellness%20Desktop%20App-6366f1?style=for-the-badge&logo=electron&logoColor=white" alt="PausePulse" />
</h1>

<p align="center">
  <strong>AI-powered ergonomic break manager & workplace wellness platform — built as a production-grade SaaS desktop app</strong>
</p>

<p align="center">
  <img src="https://img.shields.io/badge/Electron-32.x-47848F?style=flat-square&logo=electron&logoColor=white" />
  <img src="https://img.shields.io/badge/React-19.x-61DAFB?style=flat-square&logo=react&logoColor=black" />
  <img src="https://img.shields.io/badge/TypeScript-5.x-3178C6?style=flat-square&logo=typescript&logoColor=white" />
  <img src="https://img.shields.io/badge/Tailwind%20CSS-4.x-06B6D4?style=flat-square&logo=tailwindcss&logoColor=white" />
  <img src="https://img.shields.io/badge/Express-5.x-000000?style=flat-square&logo=express&logoColor=white" />
  <img src="https://img.shields.io/badge/Prisma-SQLite-2D3748?style=flat-square&logo=prisma&logoColor=white" />
</p>

---

## 🎯 What is PausePulse?

**PausePulse** is a cross-platform desktop productivity tool that intelligently manages ergonomic work/break cycles. It prevents burnout, eye strain, and repetitive stress by nudging users to take evidence-based micro-breaks — with guided activities during each break.

It's built as a **full-stack SaaS** with a team HR dashboard, cloud sync API, and subscription billing support.

---

## ✨ Key Features

| Feature | Description |
|---|---|
| ⏱️ **Smart Focus Timer** | Pomodoro-style focus/break cycle with anti-cheat lock |
| 🍱 **Dedicated Lunch Break** | Separate lunch mode (30m/45m/60m) with its own countdown |
| 💧 **Hydration Tracker** | Daily water intake goal with animated progress bar |
| 🧠 **Mood Coach** | Detects how you feel (anxious, tired, blocked…) and recommends targeted micro-activities |
| 🫁 **Guided Breathing** | 3-phase box breathing (Inhale → Hold → Exhale) with animated visual |
| 🎮 **Stress Buster Game** | Bubble pop mini-game to reset mental fatigue |
| 🏆 **Gamification** | Points, streaks, and 4-tier level system (Health Novice → Wellness Legend) |
| 📝 **Focus Checkpoint** | Pre-break note capture to remember where you left off |
| 🔔 **Smart Alerts** | Web Audio API synthesizer — 4 tones + custom audio upload |
| 🌙 **Dark / Light Mode** | Full theme toggle across all components |
| 🖥️ **System Tray** | Lives in your system tray with OS-level idle monitoring |
| 📊 **HR Admin Dashboard** | Company-wide wellness metrics, seat management, rewards |
| ☁️ **Cloud Sync API** | REST API backend with auth, sync, leaderboard, billing |

---

## 🏗️ Architecture

```
pausepulse/
├── src/                          # React 19 frontend
│   ├── App.tsx                   # Root state machine
│   ├── types.ts                  # Shared TypeScript types
│   ├── utils/audio.ts            # Web Audio API sound engine
│   └── components/
│       ├── Header.tsx            # Nav bar, theme toggle
│       ├── BreakTimerCard.tsx    # Focus/Break/Lunch timer
│       ├── HydrationCard.tsx     # Water tracker
│       ├── GamificationPoints.tsx
│       ├── BreakActivitiesModal.tsx  # Mood Coach + Breathing + Game
│       ├── FocusCheckpointModal.tsx  # Pre-break note modal
│       ├── SettingsModal.tsx     # All app settings
│       └── AdminDashboard.tsx    # HR portal view
├── electron/
│   ├── main.ts                   # Electron main process + system tray
│   └── preload.ts                # contextBridge (electronAPI)
├── server/
│   └── src/
│       ├── index.ts              # Express server + admin web UI
│       └── routes/               # auth, sync, leaderboard, hr, billing
├── prisma/schema.prisma          # SQLite DB schema (Company, User, WellnessLog…)
└── package.json
```

---

## 🚀 Getting Started

### Prerequisites
- Node.js 20+
- npm 10+

### Install dependencies
```bash
npm install
```

### Run in development (Electron desktop app)
```bash
npm run electron:dev
```

### Run backend API server
```bash
npx tsx server/src/index.ts
```
API will be available at `http://localhost:5000`
Admin dashboard at `http://localhost:5000/admin`

### Production build
```bash
npm run build
```

---

## 🎨 Tech Stack

| Layer | Technology |
|---|---|
| Desktop Shell | Electron 32 |
| UI Framework | React 19 + TypeScript |
| Styling | Tailwind CSS v4 |
| Icons | Lucide React |
| Build Tool | Vite 6 |
| Backend API | Express 5 + Node.js |
| ORM / DB | Prisma ORM + SQLite |
| Audio Engine | Web Audio API (custom synthesizer) |
| State | React hooks (no external store) |

---

## 📸 Screenshots

> _Add screenshots here once app is running_

---

## 🗺️ Roadmap

- [ ] Electron auto-updater (Squirrel)
- [ ] Multi-user cloud sync (JWT auth)
- [ ] Stripe billing integration
- [ ] macOS notarization
- [ ] AI mood detection via webcam
- [ ] Slack / Teams bot integration
- [ ] Windows/macOS app store listing

---

## 👤 Author

Built by **[Your Name]** — [Portfolio](https://yourwebsite.com) · [LinkedIn](https://linkedin.com/in/yourprofile)

---

## 📄 License

MIT License — see [LICENSE](LICENSE) for details.
