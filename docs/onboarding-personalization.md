# Onboarding & Personalisation

## Overview

Phase 6 adds a lightweight onboarding flow that captures learner preferences and
uses them to personalise the dashboard banner, roadmap recommendation, and daily task.
No login required. All data persists in `localStorage` and is synced to Supabase when configured.

---

## Onboarding Fields

| Field | Options |
|---|---|
| **Target role** | Azure Data Engineer, Databricks Engineer, PySpark Engineer, Analytics Engineer, AI Data Engineer |
| **Skill level** | Beginner, Intermediate, Advanced |
| **Preferred cloud** | Azure, AWS, Both |
| **Daily study time** | 30 min, 1 hour, 2 hours |
| **Interview timeline** | 2 weeks, 1 month, 3 months, No rush |

Stored as `OnboardingProfile` in `src/types/database.ts`.
localStorage key: `dem-onboarding-profile`.

---

## Recommendation Logic

`src/services/recommendations/recommendationEngine.ts` maps target role + progress
to a deterministic recommendation.

### Learning Paths

| Target Role | Ordered Path |
|---|---|
| Azure Data Engineer | SQL → Python → Azure Data Factory → Azure Databricks |
| Databricks Engineer | SQL → Python → PySpark → Azure Databricks |
| PySpark Engineer | SQL → Python → PySpark → AWS Glue |
| Analytics Engineer | SQL → Python → Azure Data Factory |
| AI Data Engineer | SQL → Python → PySpark → AI for Data Engineers |

### `getRecommendation(profile, progress)`

1. Takes the path for `profile.targetRole`
2. Finds the first topic where `progress[id] < 100` — that is the `nextTopicId`
3. Returns `{ topicId, topicLabel, reason, path, roadmapTrackId, projectId, dailyTask }`

`reason` is a human-readable sentence explaining why this topic matters for the target role.
`dailyTask` incorporates `profile.studyTime` (e.g. "Spend 1 hour on PySpark today").

### Roadmap + Project mappings

| Target Role | Roadmap Track | Starter Project |
|---|---|---|
| Azure Data Engineer | `azure-de` | `medallion-project` |
| Databricks Engineer | `pyspark-engineer` | `databricks-optimization` |
| PySpark Engineer | `pyspark-engineer` | `incremental-etl` |
| Analytics Engineer | `etl-developer` | `sales-lakehouse` |
| AI Data Engineer | `lakehouse-engineer` | `api-ingestion` |

---

## Fallback Behaviour

When onboarding has not been completed:
- `DEFAULT_RECOMMENDATION` is used: SQL Mastery, reason: "SQL is the foundation every data engineer builds on"
- `SmartBanner` renders a generic "Start SQL" message
- An `OnboardingCTA` card is shown below the SmartBanner prompting "Personalise your learning path"
- The app never renders `undefined` — all text has a defined fallback

---

## Where Personalization Flows

```
useOnboarding()
    └─ onboardingProfile (null if not set)

App.jsx
    └─ personalizedRec = getRecommendation(onboardingProfile, allTopicsProgress)
                       | DEFAULT_RECOMMENDATION when null
    └─ SmartBanner     ← receives personalizedRec prop
    └─ OnboardingCTA   ← shown when !onboardingCompleted

TopHeader UserMenu
    └─ "Learning Preferences" → openOnboardingPage()

OnboardingPage (overlay)
    └─ saveProfile() → localStorage + optional Supabase sync
```

---

## Entry Points

| Entry | Trigger |
|---|---|
| Profile menu | Click avatar → "Learning Preferences" |
| Onboarding CTA | Visible on dashboard until preferences are set |
| Direct | `openOnboardingPage()` from `useUser()` |

---

## Data Persistence

**localStorage** (always)
- Key: `dem-onboarding-profile`
- Written on every save. Immediate, works with zero config.

**Supabase** (when configured, Phase 7+)
- Synced to `profiles.onboarding_profile` (JSONB column, added in Phase 7 migration)
- Best-effort: localStorage is the source of truth; Supabase errors are swallowed

---

## Future AI Personalization Plan

Phase 7+ will add AI-assisted personalisation on top of this foundation:

1. **Adaptive path reordering** — if a user consistently skips PySpark practice tasks, the AI coach surfaces SQL reinforcement before moving forward
2. **Weak signal detection** — `useLearningMemory` already tracks `weakSignals`; Phase 7 will feed these into topic sequencing
3. **Interview urgency weighting** — when `interviewTimeline = '2weeks'`, the recommendation engine fast-tracks interview prep and pauses deep-dives
4. **Role-specific question filter** — InterviewPrep question bank is filtered by `targetRole` when set
5. **Synapse/Fabric track** — Azure Data Engineer path extended with Synapse Analytics and Microsoft Fabric once those topic modules are built
