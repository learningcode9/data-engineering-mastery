# MVP Scope — Data Engineering Mastery Platform

## Vision

A focused, polished interactive learning platform for aspiring Data Engineers.
Learners study core skills, practice SQL, prepare for interviews, and track progress
through a clean and professional interface.

**Target user**: someone preparing for a Data Engineering role (junior to mid-level),
needing structured learning and real hands-on practice.

---

## Core MVP Features

### 1. Dashboard

The landing page shows what matters at a glance:

- **Continue Learning** — resume the last open topic with one click
- **Daily Goal checklist** — three simple daily habits (study, practice, capture a note)
- **Progress summary** — topics complete, projects available, interview banks
- **Smart banner** — contextual recommendation based on streak, progress, and role preference
- **Onboarding CTA** — prompts new users to set their role and target skills

Removed from dashboard: duplicate analytics charts, oversized empty cards, noisy metrics.

---

### 2. Learning Topics

Seven topics covering the core data engineering stack:

| Topic | Why included |
|---|---|
| SQL | Foundation skill; every data role needs it |
| Python | Primary scripting language for pipelines |
| PySpark | Distributed processing with Databricks / EMR |
| Azure Data Factory | Most common enterprise ETL orchestrator |
| Azure Databricks | Unified analytics; Spark + Delta Lake |
| AWS Glue | Serverless ETL; essential for AWS-track learners |
| AI for Data Engineers | LLM integration, vector stores, prompt design |

Each topic contains:
- What is this? / Why do we use it?
- Real-world example
- Practice tasks with progress tracking
- Interview questions
- Personal notes field

---

### 3. SQL Practice (primary feature)

Real in-browser SQL execution using sql.js (SQLite compiled to WebAssembly).

Capabilities:
- SQL editor with syntax highlighting
- Run query, show/hide result table
- Progressive hints (4 levels)
- Reveal solution
- Real result-based validation (not keyword matching)
- Schema explorer panel (click to insert column names)
- Beginner-friendly error messages with column/table suggestions

Database: 8 tables, realistic data — customers, products, orders, employees,
transactions, events, shipments, inventory.

---

### 4. Interview Prep

Three difficulty tiers: Beginner / Intermediate / Advanced.

Features:
- Expand answer in-place
- Mark as learned
- Flag for revision
- Search and filter by keyword
- Progress tracking (% learned)

---

### 5. Projects

Portfolio-ready project cards showing:
- Project overview
- Architecture summary
- Skills demonstrated
- Resume bullet point
- How to explain it in an interview

Simple, scannable cards — no excessive text blocks.

---

### 6. Roadmap

A visual learning path showing:
- Recommended topic order
- Skill dependencies
- Clear progression from beginner to job-ready

---

### 7. AI Coach

A lightweight in-browser AI assistant (mocked responses, no API key required).

Capabilities:
- Explain a topic or SQL concept
- Suggest next topic based on progress
- Generate a sample interview answer
- Answer data engineering questions

Floating panel accessible from any section.

---

## Labs (Advanced Features)

These features exist and are fully functional but are hidden from the main navigation
to keep the MVP focused. Users can access them via the "Labs" section in the sidebar
or via the Command Palette (⌘K).

| Lab Feature | Description |
|---|---|
| **Architecture Diagrams** | Visual system design patterns for data pipelines |
| **Skill Graph** | Dependency graph showing which skills unlock others |
| **Incident Lab** | Simulated on-call incidents (ADF, Spark, Kafka, Snowflake, Airflow, Delta) |
| **Enterprise Simulator** | Multi-tenant company scenarios (ShopSphere, FinVerse, MediFlow) |
| **Interview War Room** | Timed mock interview sessions with answer scoring |
| **Daily Standup** | Engineering standup simulator |
| **Databricks Notebook** | Interactive Databricks notebook experience |
| **Analytics** | Detailed progress charts and activity heatmap |

These features will be promoted to core navigation once the MVP is validated.

---

## Why Features Were Simplified

### Navigation overload
Having 15+ top-level navigation items makes the app feel overwhelming to new users.
A learner starting out should see 7 clear options, not 15 — the extra cognitive load
discourages exploration.

### Incident Simulator in Labs
The incident simulation is impressive but introduces complexity (live timers, escalation
levels, team messages, multi-panel layout) that distracts a learner who just wants to
understand SQL or prepare for an interview. It belongs in Labs where it enhances the
experience for advanced users without cluttering the core path.

### Enterprise Simulator in Labs
Rich simulation environment, but the scope (3 virtual companies, real-time pipelines,
telemetry) is well beyond MVP scope for learning fundamentals. Best discovered after
the user has built confidence with core topics.

### Analytics in Labs
Detailed charts and heatmaps are valuable but not essential on day 1. Basic progress
is visible in the sidebar and summary grid. Deep analytics is a power feature for
returning users.

---

## Future Roadmap (Post-MVP)

1. **Supabase backend** — persist progress, notes, and streaks across devices
2. **More SQL challenges** — joins, window functions, CTEs at 5 difficulty levels
3. **Python practice mode** — in-browser Python execution (Pyodide)
4. **Lab promotion** — graduate Incident Lab and Skill Graph to core navigation
5. **DuckDB upgrade** — replace sql.js with DuckDB-WASM for analytical queries and Parquet ingestion
6. **Certification track** — guided learning path with a shareable completion badge
7. **Community features** — share solutions, compare approaches

---

## Technical Boundaries

- No backend required — runs entirely in the browser
- No Supabase env variables required — mock guest fallback for all features
- No React Router — internal state navigation
- No Tailwind — plain CSS custom properties
- Build must pass with `npm run build` and 0 errors

---

## File Map (Core MVP)

| File | Role |
|---|---|
| `src/components/sections/Dashboard.jsx` | Summary grid, continue card, daily plan, smart banner |
| `src/components/sections/Topics.jsx` | Learning topic accordions with practice tasks |
| `src/components/sections/SQLLab.jsx` | SQL editor, schema explorer, result table |
| `src/components/sections/InterviewPrep.jsx` | Q&A banks, learned/revision tracking |
| `src/components/sections/Projects.jsx` | Portfolio project cards |
| `src/components/sections/RoadmapTracks.jsx` | Visual learning path |
| `src/components/sections/AILearning.jsx` | AI coach interface |
| `src/components/ai/AICopilotPanel.tsx` | Floating AI assistant panel |
| `src/data/appData.js` | `coreNavItems` (MVP nav) + `labsNavItems` (Labs nav) |
