# MVP Scope

## Product Goal

Data Engineering Mastery is a portfolio-ready learning platform that helps aspiring data engineers move from fundamentals to interview and project readiness through one structured browser app.

## In Scope

- Dashboard with progress, recommendations, daily goals, and learning summary.
- 39-topic data engineering curriculum.
- Topic cards and topic detail pages.
- Practice tasks, interview questions, mini projects, and next-step guidance.
- SQL Lab with in-browser SQL execution.
- Interview prep question bank.
- Portfolio project cards.
- Roadmap and phase navigation.
- Local progress persistence.
- Optional Supabase integration via environment variables.
- Responsive desktop and mobile layouts.

## Out of Scope For MVP

- Paid user accounts.
- Real AI API calls by default.
- Server-side curriculum authoring.
- Multi-user classrooms.
- Production analytics backend.
- Automated grading beyond current local SQL/practice checks.

## MVP Quality Bar

- The app should build cleanly with `npm run build`.
- It should run without Supabase credentials.
- No curriculum topic should render missing or undefined values.
- Topic and roadmap navigation should remain readable with all 39 topics.
- Documentation should be clear enough for a portfolio reviewer to install and run the project.

## Current Stability Notes

- Supabase support is optional and should not block local use.
- Advanced lab surfaces are portfolio differentiators, but the MVP is still usable through the core dashboard, topics, SQL lab, projects, roadmap, and interview prep.
- Large bundle warnings are known Vite warnings and do not currently block deployment.
