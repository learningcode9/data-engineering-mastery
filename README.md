# Data Engineering Mastery Platform

An interactive SaaS-style learning platform for aspiring data engineers. The app combines a structured 39-topic curriculum, hands-on SQL practice, interview preparation, portfolio project guidance, and production-style learning surfaces in a polished browser-based experience.

## Problem This Solves

Data engineering learners often jump between disconnected tutorials, interview lists, cloud notes, and project ideas. This platform brings the learning path into one focused product experience:

- A clear progression from foundations to production and AI data engineering.
- Practice-oriented topic pages instead of passive notes.
- Portfolio-ready project guidance and interview preparation in the same workspace.
- Local progress tracking so learners can resume without account setup.
- Optional Supabase integration for cloud-backed persistence.

## Key MVP Features

- **39-topic curriculum** across Foundation, Pipeline, Big Data, Cloud, Streaming, Production, Career, and AI phases.
- **Topic detail pages** with explanations, real-world use cases, common mistakes, practice tasks, interview questions, mini projects, and next-step guidance.
- **Dashboard recommendations** for the next learning action, progress summary, daily goals, and readiness cues.
- **SQL Lab** powered by in-browser SQLite via `sql.js`.
- **Interview Prep** with categorized questions and progress tracking.
- **Portfolio Projects** with practical project cards and implementation guidance.
- **Roadmap view** for structured phase and career-track navigation.
- **Progress persistence** with Zustand/localStorage, with optional Supabase-backed sync.
- **Responsive SaaS UI** with reusable card, badge, metric, progress, search, sidebar, and layout primitives.

## 39-Topic Curriculum Summary

| Phase | Topics |
|---|---|
| Foundation | SQL, Python, Linux & Command Line, Git & Version Control, Data Modeling |
| Pipeline | ETL vs ELT, Batch Processing, Incremental Loading, CDC, Data Quality |
| Big Data | PySpark, Spark Optimization, Partitioning, File Formats, Delta Lake |
| Cloud & Storage | ADLS / S3, Azure Data Factory, Databricks, AWS Glue, Medallion Architecture |
| Streaming | Kafka, Structured Streaming, Event Hubs, Checkpointing & Watermarking |
| Production | Orchestration, Monitoring & Logging, Retry & Failure Recovery, CI/CD for Data Engineering, Security & Governance, Unity Catalog / RBAC |
| Career | Real-world Projects, Resume Builder, Interview Preparation, Mock Interviews, Production Scenarios |
| AI | AI for Data Engineers, LLM-assisted Pipelines, Vector Databases, AI-powered Analytics |

See [docs/CURRICULUM.md](docs/CURRICULUM.md) for the detailed curriculum map.

## Tech Stack

| Area | Technology |
|---|---|
| Frontend | React 19 |
| Build Tool | Vite 8 |
| Styling | CSS design system with reusable tokens and primitives |
| State | Zustand, React hooks, localStorage |
| SQL Runtime | sql.js / SQLite WebAssembly |
| Optional Backend | Supabase |
| Editor | Monaco Editor |
| Deployment | Vercel or any static host |

## Screenshots

Add screenshots to `docs/screenshots/` before publishing the portfolio page.

| Screen | Placeholder |
|---|---|
| Dashboard | `docs/screenshots/dashboard.png` |
| Topics | `docs/screenshots/topics.png` |
| SQL Lab | `docs/screenshots/sql-lab.png` |
| Roadmap | `docs/screenshots/roadmap.png` |
| Projects | `docs/screenshots/projects.png` |
| Mobile | `docs/screenshots/mobile.png` |

## Setup

```bash
git clone https://github.com/your-username/data-engineering-mastery.git
cd data-engineering-mastery
npm install
npm run dev
```

The app runs at `http://localhost:5173` by default. If the port is busy, Vite will choose the next available port.

## Environment Variables

The MVP works locally without cloud configuration. For optional Supabase support, create `.env.local`:

```bash
cp .env.example .env.local
```

```env
VITE_SUPABASE_URL=
VITE_SUPABASE_ANON_KEY=
```

## Build

```bash
npm run build
npm run preview
```

The production output is generated in `dist/`.

## Deployment

### Vercel

1. Push the repository to GitHub.
2. Import the repository in Vercel.
3. Use the default Vite settings:
   - Build command: `npm run build`
   - Output directory: `dist`
4. Add Supabase environment variables only if cloud sync is enabled.
5. Deploy.

### Static Hosting

Any static host that can serve the `dist/` folder works:

```bash
npm run build
```

Upload the generated `dist/` directory to your hosting provider.

See [docs/DEPLOYMENT.md](docs/DEPLOYMENT.md) for a deployment checklist.

## Documentation

- [MVP Scope](docs/MVP_SCOPE.md)
- [Curriculum](docs/CURRICULUM.md)
- [Deployment](docs/DEPLOYMENT.md)

## Future Roadmap

- Add production screenshots and short demo video.
- Add test coverage for curriculum normalization, search, recommendations, and SQL validation.
- Add optional authenticated progress sync as a deployment toggle.
- Add accessibility audit notes and keyboard navigation QA.
- Improve bundle splitting after portfolio MVP stabilizes.
- Add more real-world datasets for SQL and pipeline practice.

## Portfolio Highlights

- Full 39-topic curriculum integrated into a single learning product.
- Real SQL execution in the browser with no backend requirement.
- Production-inspired data engineering modules: incidents, roadmaps, projects, interview prep, and analytics.
- Reusable design-system primitives for scalable UI maintenance.
- Deployment-ready Vite build with optional Supabase configuration.

## License

MIT
