# Data Engineering Mastery Platform

An interactive, self-paced learning platform for data engineering skills — built as a single-page React application.

---

## Features

### Learning Content
- **SQL deep dive** — 10+ accordion sections covering SELECT, JOINs, window functions, CTEs, performance, and more
- **7 topic modules** — SQL, Python, PySpark, Azure Data Factory, Azure Databricks, AWS Glue, AI for Data Engineers
- **Structured subtopics** — each unit includes explanation, syntax, a real-world example, expected output, and interview Q&A

### Interactive Practice
- **SQL playground** — write queries against a mock in-browser database (customers, orders, products tables)
- **Run & validate** — instant feedback comparing your query against the expected solution
- **Mock SQL runner** — supports SELECT, WHERE, GROUP BY, ORDER BY, LIMIT, aggregates, DISTINCT
- **Difficulty badges** — Beginner / Intermediate / Advanced labels on every practice task

### Progress & Persistence
- **Practice tracking** — completed tasks persist across sessions via localStorage
- **Topic notes** — per-topic textarea with auto-save, timestamps, and copy-to-clipboard
- **Dynamic progress bars** — SQL topic progress updates live as you complete practice tasks
- **Topic toggle** — click any topic card to expand/collapse details; only one open at a time
- **Resume learning** — Resume button reopens the last active topic or the next incomplete SQL section

### Navigation & Search
- **Global search** — instant dropdown filtering topics, SQL sections, interview questions, and projects
- **Sticky SQL nav bar** — jump between sections within the SQL module without scrolling
- **Roadmap cards** — clickable cards that scroll to the relevant learning section
- **Back to top** — floating button appears after scrolling 400px

### Interview Prep
- **Categorised questions** — Beginner / Intermediate / Advanced / Real-world SQL interview questions
- **Mark learned / revisit** — tag questions for spaced repetition review
- **Collapse all** — reset all question groups with one click
- **Filter** — live search across all interview questions

### UI & Polish
- **Dark mode** — full dark theme toggle, persisted preference
- **Responsive** — adapts from mobile (320px) to wide desktop (1500px+)
- **Smooth animations** — topic expand/collapse, toast notifications, accordion transitions
- **Toast notifications** — success/error/info feedback for completed practice tasks

---

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Framework | [React 19](https://react.dev/) |
| Build tool | [Vite 8](https://vitejs.dev/) |
| Language | JavaScript (JSX) |
| Styling | Vanilla CSS with custom properties |
| State | React hooks + localStorage |
| No external UI library | All components hand-built |

---

## Getting Started

### Prerequisites
- Node.js 18+
- npm 9+

### Install & run

```bash
git clone https://github.com/your-username/data-engineering-mastery.git
cd data-engineering-mastery
npm install
npm run dev
```

Open [http://localhost:5173](http://localhost:5173) in your browser.

### Build for production

```bash
npm run build     # outputs to dist/
npm run preview   # preview the production build locally
```

---

## Project Structure

```
src/
├── App.jsx                      # Root component, global state
├── index.css                    # All styles (CSS custom properties, responsive)
├── main.jsx                     # React entry point
│
├── components/
│   ├── layout/
│   │   ├── RightRail.jsx        # Collapsible resource sidebar
│   │   ├── Sidebar.jsx          # Main navigation sidebar
│   │   └── TopHeader.jsx        # Header with search, theme toggle
│   ├── sections/
│   │   ├── AILearning.jsx       # AI coach section
│   │   ├── Dashboard.jsx        # Continue Learning + Daily Plan cards
│   │   ├── InterviewPrep.jsx    # Interview Q&A with filter and mark learned
│   │   ├── Projects.jsx         # Portfolio projects list
│   │   ├── Roadmap.jsx          # Clickable roadmap overview cards
│   │   ├── TopicDetails.jsx     # Expanded topic view with practice, notes
│   │   └── Topics.jsx           # Topic card grid with toggle/open logic
│   └── ui/
│       ├── Accordion.jsx        # Animated accordion with forceOpen support
│       ├── Card.jsx             # SummaryCard, RoadmapCard, TopicCard, ProjectCard
│       ├── CodeBlock.jsx        # Syntax block with copy button
│       ├── DifficultyBadge.jsx  # Beginner/Intermediate/Advanced badge
│       ├── InterviewQuestionCard.jsx  # Expandable Q&A with mark buttons
│       ├── PracticeCard.jsx     # SQL practice area with run/validate
│       ├── ProgressBar.jsx      # Animated progress bar
│       ├── QueryResultTable.jsx # Mock SQL result table
│       ├── ScrollToTop.jsx      # Floating back-to-top button
│       └── Toast.jsx            # Toast notification system
│
├── data/
│   ├── appData.js               # Roadmap cards, nav items, projects, daily plan
│   ├── interviewQuestions.js    # All SQL interview Q&A by level
│   ├── mockDatabase.js          # Mock DB tables for SQL playground
│   ├── topics.js                # All 7 topic definitions
│   └── modules/                 # Per-topic learning content
│       ├── sql.js               # Full SQL module (10+ sections, 44 subtopics)
│       ├── python.js
│       ├── pyspark.js
│       ├── azure-data-factory.js
│       ├── azure-databricks.js
│       ├── aws-glue.js
│       └── ai-for-data-engineers.js
│
├── hooks/
│   ├── useLocalStorage.js       # Persistent state with localStorage
│   ├── useSqlProgress.js        # Derives SQL section progress from practice data
│   └── useToast.js              # Toast queue manager
│
└── utils/
    ├── mockSqlRunner.js         # In-browser SQL interpreter
    ├── searchUtils.js           # Global search result computation
    ├── sqlValidation.js         # Keyword-based SQL answer validator
    └── toast.js                 # Singleton toast dispatcher
```

---

## localStorage Keys

| Key | Purpose |
|-----|---------|
| `dem-selected-topic` | Currently open topic ID |
| `dem-last-topic` | Last non-null open topic (for Resume) |
| `dem-completed-topics` | Topics marked complete |
| `dem-practice-progress` | Completed practice task IDs |
| `dem-topic-notes` | Per-topic note text |
| `dem-note-timestamps` | Last saved timestamp per topic |
| `dem-daily-plan` | Daily checklist state |
| `dem-interview-learned` | Interview questions marked learned |
| `dem-interview-revision` | Interview questions flagged for review |
| `dem-rightrail-collapsed` | Right rail collapsed state |
| `dem-practice-answer-{id}` | Saved answer per practice task |

---

## Roadmap / Planned Improvements

- [ ] Full Python, PySpark, and cloud topic practice tasks
- [ ] Spaced repetition review queue for interview questions
- [ ] User accounts and cloud-synced progress
- [ ] AI coach integration (Claude API)
- [ ] More SQL modules: advanced window functions, query optimisation lab

---

## License

MIT
