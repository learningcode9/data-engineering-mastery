# Data Engineering Mastery

An interactive portfolio-grade learning platform for data engineering concepts, projects, interview preparation, and applied practice. The app is built as a polished React single-page experience with persistent progress, guided topics, SQL practice, role readiness analytics, and production-style project breakdowns.

## Portfolio Highlights

- Product-focused learning UX with dashboard, topic roadmap, projects, analytics, and interview prep.
- Hands-on SQL practice with an in-browser mock runner and validation feedback.
- End-to-end project cards with architecture, implementation steps, tools, and resume-ready context.
- Progress persistence with localStorage for topics, notes, practice tasks, XP, streaks, and achievements.
- Responsive app shell with sidebar navigation, mobile bottom navigation, search, dark mode, and progressive disclosure.
- Performance-ready structure with lazy-loaded showcase sections.

## Screenshots

Add screenshots after deployment or local capture:

```text
docs/screenshots/dashboard.png
docs/screenshots/topics.png
docs/screenshots/projects.png
docs/screenshots/analytics.png
```

Suggested views:

- Dashboard and continue-learning flow
- Topic deep-dive accordion and SQL practice
- Portfolio projects grid and project detail modal
- Learning analytics and readiness dashboard
- Mobile/tablet responsive layout

## Features

### Learning Platform

- Guided topic modules for SQL, Python, PySpark, Azure Data Factory, Azure Databricks, AWS Glue, and AI for Data Engineers.
- One-section-at-a-time deep-dive accordions to reduce long-scroll fatigue.
- Topic notes with autosave timestamps and copy support.
- Global search across topics, sections, interview questions, and projects.

### Practice And Progress

- SQL playground using mock database tables.
- Query validation, expected output display, and result tables.
- Persistent practice completion, topic progress, daily plan, XP, streaks, and achievements.
- Smart continue-learning card and contextual recommendations.

### Portfolio Projects

- Seven realistic data engineering project scenarios.
- Project details with goals, architecture, steps, code snippets, tools, and resume bullets.
- Responsive, equal-height project cards with clean metadata and hover states.

### Interview And Analytics

- SQL interview question bank with learned/revision tracking.
- Timed interview mode and mastery indicators.
- Learning analytics with interview readiness, role readiness, and topic mastery visualizations.

## Tech Stack

| Area | Technology |
| --- | --- |
| Framework | React |
| Build Tool | Vite |
| Language | JavaScript / JSX |
| Styling | Vanilla CSS with custom properties |
| State | React hooks + localStorage |
| Tooling | ESLint, Vite production build |

## Folder Structure

```text
src/
  App.jsx
  main.jsx
  index.css
  components/
    layout/        # Sidebar, header, right rail
    sections/      # Dashboard, topics, projects, analytics, roadmap, etc.
    ui/            # Reusable cards, accordions, toasts, buttons, practice UI
  data/
    modules/       # Topic learning content
    appData.js
    interviewQuestions.js
    projectDetails.js
    roadmaps.js
    scenarios.js
    skillGraph.js
  hooks/           # Persistent learning, XP, streaks, achievements
  utils/           # Search, SQL runner, validation, toast dispatcher
public/
  favicon.svg
```

## Getting Started

### Prerequisites

- Node.js 18 or newer
- npm 9 or newer

### Install

```bash
npm install
```

### Run Locally

```bash
npm run dev
```

Open the local Vite URL shown in the terminal, usually:

```text
http://localhost:5173
```

### Lint

```bash
npm run lint
```

### Production Build

```bash
npm run build
```

### Preview Build

```bash
npm run preview
```

## Production Readiness Notes

- Heavy sections are lazy-loaded to reduce initial rendering cost.
- Build output is ignored by Git and generated only when needed.
- localStorage is used for a no-backend portfolio demo experience.
- The project is intentionally dependency-light and does not use a UI framework.

## Future Improvements

- Add deployed screenshots and a live demo link.
- Add optional user accounts and cloud-synced progress.
- Add more practice engines for Python, PySpark, and cloud scenarios.
- Add deeper accessibility testing with automated audits.
- Add unit/component tests for SQL validation, search, and progress calculations.
- Add route-level navigation if the app grows beyond a portfolio SPA.

## License

MIT
