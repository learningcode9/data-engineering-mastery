# Data Engineering Mastery

> An immersive, enterprise-grade learning platform for data engineers — built with React, featuring live SQL execution, incident simulation, war-room interview prep, architecture diagrams, and XP-based progression.

**v1.0.0 — Major Milestone Release**

---

## Features

### Learning Platform
- **7 deep-dive topic modules**: SQL, Python, PySpark, Azure Data Factory, Azure Databricks, AWS Glue, AI for Data Engineers
- One-section-at-a-time accordion UX to eliminate scroll fatigue
- Topic notes with autosave timestamps and copy support
- Global search across topics, sections, interview questions, and projects
- Visual roadmap tracks with curated learning paths

### SQL Lab
- Full in-browser SQL engine with real dataset tables
- Query execution plan visualization and result tables
- Query history, saved queries, and performance hints
- Interview-style SQL challenges with expected output validation

### Enterprise Simulation
- **Enterprise Simulator**: work through realistic data engineering scenarios at Fortune-500-style companies
- **Incident Simulator**: diagnose and resolve production pipeline failures under time pressure
- **Investigation Workspace**: root-cause analysis with guided clues and resolution tracking
- **Scenario Engine**: role-based challenges (Junior → Staff Engineer)
- **Simulation HUD**: live timer, score, and feedback overlay

### Interview War Room
- Curated interview question bank across SQL, system design, and behavioral categories
- Timed mock interview mode with answer tracking
- War room mode: rapid-fire Q&A under pressure with mastery indicators
- Learned / needs-revision tracking per question

### Architecture & Diagrams
- Visual architecture diagrams for common data engineering patterns
- Databricks notebook-style interactive walkthroughs
- Daily standup simulator for team workflow practice

### Portfolio Projects
- 7 realistic end-to-end project breakdowns
- Each project includes: goals, architecture, implementation steps, code snippets, tools used, and resume bullets
- Project detail modal with full context

### Analytics & Progress
- Skill graph with competency radar across all topic domains
- XP system with level progression and streak tracking
- Achievement badges and toast notifications
- Interview readiness score and role readiness percentage
- Topic mastery heatmap

### UX & Accessibility
- Responsive layout: sidebar nav on desktop, bottom nav on mobile
- Command palette (⌘K) for keyboard-first navigation
- Floating AI coach for contextual guidance
- Dark mode with design token system
- Notification center and scroll progress indicator
- Persistent state via localStorage (no backend required)

---

## Tech Stack

| Area | Technology |
|---|---|
| Framework | React 18 |
| Build Tool | Vite |
| Language | JavaScript / JSX |
| Styling | Vanilla CSS with custom design tokens |
| State | React hooks + Zustand stores + localStorage |
| SQL Engine | Custom in-browser SQL interpreter |
| Tooling | ESLint, Vite production build |

---

## Architecture Overview

```
src/
├── App.jsx                          # Root router and layout shell
├── index.css                        # Global styles and design tokens
│
├── components/
│   ├── layout/
│   │   ├── Sidebar.jsx              # Desktop navigation
│   │   └── TopHeader.jsx            # Search, command palette, notifications
│   ├── sections/                    # Feature pages (lazy-loaded)
│   │   ├── Dashboard.jsx            # Home with continue-learning card
│   │   ├── Topics.jsx               # Topic module grid
│   │   ├── TopicDetails.jsx         # Deep-dive accordion sections
│   │   ├── SQLLab.jsx               # In-browser SQL workspace
│   │   ├── Projects.jsx             # Portfolio project cards
│   │   ├── ProjectDetail.jsx        # Full project breakdown modal
│   │   ├── Analytics.jsx            # Progress and readiness dashboard
│   │   ├── SkillGraph.jsx           # Competency radar chart
│   │   ├── RoadmapTracks.jsx        # Curated learning paths
│   │   ├── EnterpriseSimulator.jsx  # Company scenario engine
│   │   ├── IncidentSimulator.jsx    # Pipeline incident response
│   │   ├── InvestigationWorkspace.jsx # Root-cause analysis
│   │   ├── InterviewPrep.jsx        # Question bank and practice
│   │   ├── InterviewWarRoom.jsx     # Timed war-room mode
│   │   ├── ArchDiagrams.jsx         # Architecture diagram viewer
│   │   ├── DatabricksNB.jsx         # Notebook-style walkthroughs
│   │   ├── DailyStandup.jsx         # Standup workflow simulator
│   │   ├── AILearning.jsx           # AI for data engineers module
│   │   └── Scenarios.jsx            # Role-based scenario engine
│   ├── ui/                          # Shared UI components
│   │   ├── SqlEditor.jsx            # Syntax-highlighted SQL editor
│   │   ├── CommandPalette.jsx       # ⌘K global command palette
│   │   ├── FloatingCoach.jsx        # Contextual AI coach overlay
│   │   ├── SimulationHUD.jsx        # Live timer and score HUD
│   │   ├── AchievementToast.jsx     # XP and badge notifications
│   │   ├── NotificationCenter.jsx   # Notification inbox
│   │   ├── ExecutionPlan.jsx        # SQL query plan visualizer
│   │   └── ...                      # Cards, accordions, progress bars
│   └── workspace/
│       └── SQLWorkspace.jsx         # SQL Lab workspace container
│
├── data/
│   ├── modules/                     # Topic learning content (per module)
│   ├── appData.js                   # Navigation and platform config
│   ├── scenarios.js                 # Enterprise scenario definitions
│   ├── incidents.js                 # Incident simulation data
│   ├── warRoomQuestions.js          # Interview war room question bank
│   ├── skillGraph.js                # Competency node graph data
│   ├── roadmaps.js                  # Learning track definitions
│   ├── sqlDataset.js                # In-browser SQL tables and rows
│   └── enterpriseCompanies.js       # Company profiles for simulation
│
├── hooks/
│   ├── useXP.js                     # XP and level progression
│   ├── useStreak.js                 # Daily learning streak
│   ├── useAchievements.js           # Badge and achievement engine
│   ├── useSqlEngine.js              # SQL execution hook
│   └── useLearningMemory.js         # Cross-session learning state
│
├── store/
│   ├── learningStore.js             # Global learning state (Zustand)
│   └── simulationStore.js           # Simulation session state (Zustand)
│
├── utils/
│   ├── sqlEngine.js                 # Custom SQL interpreter
│   ├── queryAnalyzer.js             # Query plan and hint generator
│   ├── searchUtils.js               # Global fuzzy search
│   └── sqlValidation.js             # Answer validation logic
│
└── design/
    └── tokens.js                    # Design system tokens
```

---

## Screenshots

| View | Description |
|---|---|
| `docs/screenshots/dashboard.png` | Dashboard with XP, streak, and continue-learning |
| `docs/screenshots/sql-lab.png` | SQL Lab with editor, results, and execution plan |
| `docs/screenshots/enterprise-sim.png` | Enterprise simulator scenario in progress |
| `docs/screenshots/incident-sim.png` | Incident response with countdown HUD |
| `docs/screenshots/war-room.png` | Interview war room timed mode |
| `docs/screenshots/skill-graph.png` | Competency radar and skill graph |
| `docs/screenshots/analytics.png` | Progress analytics and readiness scores |
| `docs/screenshots/roadmap.png` | Learning roadmap tracks |

---

## Getting Started

### Prerequisites

- Node.js 18+
- npm 9+

### Install

```bash
git clone https://github.com/learningcode9/data-engineering-mastery.git
cd data-engineering-mastery
npm install
```

### Run Locally

```bash
npm run dev
```

Opens at `http://localhost:5173`

### Production Build

```bash
npm run build
npm run preview
```

### Lint

```bash
npm run lint
```

---

## Design Principles

- **No backend required** — all state persists via localStorage, making this a zero-infrastructure portfolio demo
- **Performance-first** — heavy sections are lazy-loaded; initial bundle is minimal
- **Dependency-light** — no UI framework, no CSS library; custom design token system
- **Portfolio-ready** — every feature is built to demonstrate production-level thinking

---

## Roadmap

- [ ] Deploy to Vercel / GitHub Pages with live demo link
- [ ] Add screenshots and demo GIF to README
- [ ] Add optional cloud-synced progress (Supabase or Firebase)
- [ ] Add Python and PySpark interactive runners
- [ ] Add automated accessibility audit (axe-core)
- [ ] Add unit tests for SQL engine, search, and progress calculations

---

## License

MIT
