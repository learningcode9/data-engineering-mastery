# Data Engineering Mastery

> An interactive learning platform for data engineers — covering SQL, Python, PySpark, Azure, AWS, and AI, with hands-on practice, interview prep, and portfolio projects.

[![React](https://img.shields.io/badge/React-19-61DAFB?logo=react&logoColor=white)](https://react.dev)
[![Vite](https://img.shields.io/badge/Vite-8-646CFF?logo=vite&logoColor=white)](https://vitejs.dev)
[![License: MIT](https://img.shields.io/badge/License-MIT-green.svg)](LICENSE)
[![Deploy on Vercel](https://img.shields.io/badge/Deploy-Vercel-black?logo=vercel)](https://vercel.com)

**[Live Demo](#)** · **[Screenshots](#screenshots)** · **[Quick Start](#quick-start)**

---

## What It Is

Data Engineering Mastery is a self-contained, portfolio-ready learning app that runs entirely in the browser. No account required — all progress saves to localStorage, with optional Supabase sync.

It covers the full data engineering interview and project lifecycle: from SQL fundamentals and PySpark internals to real-world incident response and resume-ready portfolio projects.

---

## Screenshots

| Section | Preview |
|---|---|
| Dashboard | ![Dashboard](docs/screenshots/dashboard.png) |
| SQL Practice | ![SQL Lab](docs/screenshots/sql-lab.png) |
| Interview Prep | ![Interview Prep](docs/screenshots/interview-prep.png) |
| Projects | ![Projects](docs/screenshots/projects.png) |
| Roadmap | ![Roadmap](docs/screenshots/roadmap.png) |
| AI Coach | ![AI Coach](docs/screenshots/ai-coach.png) |

> Screenshots live in `docs/screenshots/`. See [docs/screenshots/README.md](docs/screenshots/README.md) for instructions on adding your own.

---

## Core Features

### Learning Topics
Seven deep-dive modules with accordion sections, syntax examples, real-world code, interview Q&A, and hands-on practice exercises:

- **SQL** — window functions, CTEs, joins, performance tuning
- **Python** — data pipelines, pandas, testing patterns
- **PySpark** — distributed processing, partitioning, optimization
- **Azure Data Factory** — pipelines, triggers, linked services
- **Azure Databricks** — clusters, Delta Lake, Unity Catalog
- **AWS Glue** — ETL jobs, crawlers, data catalog
- **AI for Data Engineers** — LLM pipelines, embeddings, vector stores

### SQL Lab
Full in-browser SQLite engine (sql.js / WebAssembly) with a realistic 8-table dataset. Write and run real queries, validate against expected output, and track completion per challenge.

### Interview Prep
Curated question bank with learned/revision tracking. Browse by level (Junior → Staff) or filter by topic. Mastery percentage tracked across all questions.

### Portfolio Projects
Six end-to-end project breakdowns with architecture diagrams, step-by-step implementation guides, code snippets, tools used, and pre-written resume bullet points.

### Learning Roadmap
Four curated tracks (Data Engineering Foundations, Cloud Specialist, Analytics Engineer, ML Platform Engineer) with phase-by-phase skill milestones.

### AI Coach
Personalized study path based on your progress, spaced-repetition revision queue, and a prompt library for AI-assisted practice sessions.

### Labs (Advanced)
Available via the collapsible Labs section in the sidebar:
- **Incident Simulator** — diagnose production pipeline failures under time pressure
- **Architecture Diagrams** — visual reference for common DE patterns
- **Skill Graph** — competency radar across all topic domains
- **Enterprise Scenarios** — role-based challenges at simulated companies
- **Interview War Room** — rapid-fire timed Q&A mode
- **Daily Standup** — team workflow practice
- **Databricks Notebook** — interactive walkthrough in notebook style
- **Analytics** — XP, readiness score, topic mastery heatmap

---

## Tech Stack

| Area | Technology |
|---|---|
| Framework | React 19 |
| Build | Vite 8 (Rolldown bundler, Lightning CSS) |
| Language | JavaScript / JSX + TypeScript (services layer) |
| Styling | Vanilla CSS with custom design tokens — no Tailwind |
| State | React hooks + Zustand v5 + localStorage |
| SQL Engine | sql.js 1.14 (SQLite compiled to WebAssembly) |
| Backend (optional) | Supabase (Auth + Postgres + Realtime) |
| AI (optional) | OpenAI via Supabase Edge Function |
| Deployment | Vercel |

---

## Quick Start

### Prerequisites
- Node.js 18+
- npm 9+

### Install and run

```bash
git clone https://github.com/your-username/data-engineering-mastery.git
cd data-engineering-mastery
npm install
npm run dev
```

Opens at `http://localhost:5173`. No environment variables needed — the app works fully offline using localStorage.

### Production build

```bash
npm run build    # outputs to dist/
npm run preview  # serve the built output locally
```

---

## Environment Variables

The app runs without any environment variables. For optional cloud features, copy `.env.example`:

```bash
cp .env.example .env.local
```

| Variable | Required | Description |
|---|---|---|
| `VITE_SUPABASE_URL` | No | Supabase project URL |
| `VITE_SUPABASE_ANON_KEY` | No | Supabase anon key |
| `VITE_ENABLE_BACKEND` | No | Set `true` to use Supabase instead of localStorage |
| `VITE_ENABLE_AI` | No | Set `true` to enable AI copilot |
| `VITE_AI_PROVIDER` | No | `mock` (default) or `openai` |
| `VITE_OPENAI_API_KEY` | No | OpenAI key (route through Edge Function in production) |

See [docs/deployment.md](docs/deployment.md) for full Vercel + Supabase setup.

---

## Project Structure

```
data-engineering-mastery/
├── public/                        # Static assets (favicon, sql.js WASM)
├── src/
│   ├── App.jsx                    # Root layout + all state
│   ├── main.jsx                   # Entry point
│   ├── index.css                  # Global styles + design tokens
│   │
│   ├── components/
│   │   ├── layout/                # Sidebar, TopHeader, RightRail
│   │   ├── sections/              # All page sections (lazy-loaded)
│   │   │   ├── Dashboard.jsx      # Home: XP, streak, continue card
│   │   │   ├── Topics.jsx         # Topic grid + detail panel
│   │   │   ├── TopicDetails.jsx   # Accordion deep-dive content
│   │   │   ├── SQLLab.jsx         # In-browser SQL workspace
│   │   │   ├── InterviewPrep.jsx  # Question bank + tracking
│   │   │   ├── Projects.jsx       # Portfolio project cards
│   │   │   ├── ProjectDetail.jsx  # Full project modal
│   │   │   ├── RoadmapTracks.jsx  # Learning path viewer
│   │   │   ├── AILearning.jsx     # AI coach + study path
│   │   │   └── ...                # Labs: Analytics, SkillGraph, Incidents, etc.
│   │   ├── ui/                    # Shared components: cards, accordions, toasts
│   │   └── workspace/             # SQL workspace sub-components
│   │
│   ├── data/
│   │   ├── modules/               # Topic content (one file per topic)
│   │   ├── topics.js              # Topic list + module references
│   │   ├── projectDetails.js      # Portfolio project definitions
│   │   ├── interviewQuestions.js  # Interview question bank
│   │   ├── roadmaps.js            # Learning track definitions
│   │   ├── sqlDataset.js          # 8-table realistic SQL dataset
│   │   └── incidents.js           # 6 production incident scenarios
│   │
│   ├── hooks/                     # useXP, useStreak, useSqlEngine, etc.
│   ├── store/                     # Zustand: learningStore, simulationStore
│   ├── services/supabase/         # Optional Supabase service layer
│   ├── providers/                 # AppProvider, UserProvider (auth context)
│   ├── utils/                     # SQL engine, search, toast, cn()
│   └── config/                    # env.ts — feature flag helpers
│
├── docs/
│   ├── screenshots/               # App screenshots for README
│   ├── deployment.md              # Vercel + Supabase setup guide
│   ├── sql-engine.md              # SQL execution architecture
│   ├── auth-flow.md               # Supabase auth flow
│   └── release-v1.md              # v1.0 release notes
│
└── supabase/                      # Supabase local dev config
```

---

## How the SQL Engine Works

The SQL Lab uses [sql.js](https://sql.js.org/) — SQLite compiled to WebAssembly — to execute real SQL in the browser with zero server-side infrastructure. The WASM binary is copied from `node_modules` at build time and served as a static asset.

An 8-table dataset (customers, products, orders, employees, transactions, events, shipments, inventory — 20–40 rows each) gives learners a realistic schema to practice joins, window functions, CTEs, and aggregations.

Answer validation compares query result sets row-by-row against a reference solution.

---

## Deployment

See **[docs/deployment.md](docs/deployment.md)** for the full guide. Short version:

**Vercel (one command):**
```bash
npx vercel --prod
```

No build configuration needed — Vercel auto-detects Vite. The sql.js WASM files are copied during the build step automatically.

**GitHub Pages:**
```bash
npm run build
# deploy dist/ to gh-pages branch
```

---

## Roadmap

- [ ] Live demo deployment on Vercel with public URL
- [ ] Add screenshots and demo GIF to README
- [ ] Python and PySpark interactive runners (Pyodide)
- [ ] Optional cloud-synced progress (Supabase integration)
- [ ] Accessibility audit (axe-core)
- [ ] Unit tests for SQL engine, search, and progress calculations
- [ ] Mobile app wrapper (Capacitor)

---

## License

MIT © 2025
