# Release Notes — v1.0.0

**Released:** May 2025  
**Status:** MVP complete, production-ready

---

## What's In v1.0

This is the first public release. It ships a complete, self-contained learning platform for data engineering — fully functional without any backend configuration.

### Core Learning Platform

- **7 topic modules** with accordion deep-dives, syntax examples, real-world code, and practice exercises
  - SQL, Python, PySpark, Azure Data Factory, Azure Databricks, AWS Glue, AI for Data Engineers
- **Topic notes** with autosave, copy, and per-session timestamps
- **Global search** across topics, sections, interview questions, and projects (⌘K command palette)
- **Progress tracking** per subtopic with localStorage persistence

### SQL Lab

- Full in-browser SQLite execution via sql.js (WebAssembly) — no server required
- 8-table realistic dataset: customers, products, orders, employees, transactions, events, shipments, inventory
- Query answer validation — compares user results row-by-row against reference solution
- SQL syntax highlighting (Monaco Editor) with query history

### Interview Prep

- Curated question bank across all 7 topics, organized by difficulty level
- Learned / needs-revision tracking per question
- Mastery percentage with visual progress indicator
- Search and filter by topic

### Portfolio Projects

- 6 end-to-end project breakdowns: batch pipelines, streaming, ML feature stores, data lakehouse, real-time CDC, cost optimization
- Each project includes architecture layers, implementation steps, tools, and resume bullet points
- Full detail modal with copyable bullet points

### Learning Roadmap

- 4 career tracks: Foundations, Cloud Specialist, Analytics Engineer, ML Platform Engineer
- Phase-by-phase milestones with skill tags and time estimates

### AI Coach

- Personalized study path based on progress state
- Spaced-repetition revision queue (topics marked complete but not revisited recently)
- Prompt library for self-directed AI-assisted practice
- Smart insights: next recommended topic, interview readiness percentage

### Dashboard

- XP system: 50 XP per practice task, 200 XP per completed topic
- Daily streak tracking
- Continue-learning card (resumes last opened topic)
- Weekly plan checklist with localStorage persistence
- Smart banner with personalized recommendation

### Labs (Advanced Features)

Available in the collapsible sidebar Labs section:

- **Incident Simulator** — 6 production incidents (ADF schema drift, Spark OOM, Kafka lag, Snowflake credits, Airflow DAG stuck, Delta small files)
- **Investigation Workspace** — full-screen overlay with streaming logs, DAG view, fix options, RCA tracking
- **Architecture Diagrams** — visual reference for Lambda, Kappa, Medallion, streaming patterns
- **Skill Graph** — competency radar across domain nodes
- **Enterprise Simulator** — role-based scenarios at simulated companies
- **Interview War Room** — rapid-fire timed Q&A
- **Daily Standup** — team workflow and communication practice
- **Databricks Notebook** — interactive notebook-style walkthroughs
- **Analytics** — interview readiness score, topic mastery bars, XP breakdown

### UX & Infrastructure

- Responsive layout: sidebar on desktop, bottom nav on mobile
- Dark/light mode toggle
- Achievement badges and toast notifications
- Notification center
- Scroll progress indicator
- Command palette (⌘K) with fuzzy search
- Error boundary with graceful fallback
- Optional Supabase backend (auth, progress sync, notes) — fully gated, off by default

---

## Architecture Decisions

### No build-time data fetching
All content (topics, questions, projects, incidents) lives in JS data files. This keeps the app deployable as a pure static site with zero API dependencies.

### localStorage-first with optional Supabase sync
Progress, notes, and settings persist in localStorage by default. Supabase sync is an additive layer, not a dependency. This means the app works identically in demo mode and with a real backend.

### sql.js over a mock interpreter
Real SQLite compiled to WebAssembly gives learners authentic SQL behavior — window functions, CTEs, FULL OUTER JOIN, type coercion — not a simplified subset. The WASM binary is copied from `node_modules` at build time via a custom Vite plugin.

### Lazy loading all sections
Every section beyond the dashboard is a separate chunk loaded on demand. Initial JS bundle stays under 900 KB gzipped (~262 KB). Heavy Labs sections (Enterprise Simulator, War Room questions) only load when accessed.

### Plain CSS over a framework
No Tailwind, no CSS-in-JS. One `index.css` file with CSS custom properties for theming. This keeps the build lean, avoids purge complexity, and makes the design system inspectable without tooling.

---

## Known Limitations

- Screenshots not yet added to README (placeholder table present)
- Live demo URL not yet configured
- Supabase migrations exist but optional backend is not wired to all features
- No automated test suite (SQL engine and search utils are candidates for unit tests)
- `FloatingCoach.jsx` remains in `src/components/ui/` as an archived component (not rendered)

---

## Upgrade Path

### v1.1 (planned)
- Add Pyodide-based Python runner to the Python topic
- Screenshot pass and demo GIF
- Vercel deployment with public URL

### v1.2 (planned)
- Supabase progress sync enabled by default when configured
- Shared progress URLs (read-only public link to your profile)
- Achievement system expansion

### v2.0 (future)
- AI-generated quiz questions per topic
- Peer comparison leaderboard
- Cohort / team mode for bootcamp groups
