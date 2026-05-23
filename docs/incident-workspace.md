# Incident Investigation Workspace

## Overview

The Production Incident Lab gives learners hands-on on-call practice through realistic
simulated failures. There are two modes for each incident:

| Mode | Entry point | Component |
|---|---|---|
| **Practice** | "Investigate" button | `IncidentDetail` (in-page, in `IncidentSimulator.jsx`) |
| **Live sim** | "🔴 Go Live" button | `InvestigationWorkspace` (full-screen overlay) |

Practice mode is a self-paced walkthrough. Live sim mode runs a real-time countdown,
team-message stream, escalations, and a scored fix-application flow.

---

## Incident catalogue

Six incidents covering the core data engineering stack.

| ID | Severity | Tool | Category |
|---|---|---|---|
| `adf-schema-drift` | P1 | Azure Data Factory | Pipeline |
| `spark-oom-wide-join` | P1 | Databricks | Spark |
| `kafka-consumer-lag` | P2 | Kafka | Streaming |
| `snowflake-credit-explosion` | P2 | Snowflake | Database |
| `airflow-dag-stuck` | P2 | Apache Airflow | Orchestration |
| `delta-small-file-problem` | P3 | Delta Lake | Storage |

Each incident in `src/data/incidents.js` contains:

```js
{
  id, title, severity, category, tool, icon, briefing,
  logs[],          // 6–7 realistic log lines with time, level, source, msg
  metrics[],       // 6 metrics cards with label, value, status
  steps[],         // 5 investigation steps (ordered)
  correctRCA,      // Reference root-cause string
  fix,             // One-sentence fix summary
  fixCode,         // Language-annotated code block (SQL / PySpark / YAML / CLI)
}
```

---

## SLA timers

| Severity | SLA |
|---|---|
| P1 | 30 minutes |
| P2 | 60 minutes |
| P3 | 120 minutes |

Defined in both `IncidentSimulator.jsx` and `simulationStore.js`.

---

## Practice mode (IncidentDetail)

Opened by clicking "Investigate" on any incident card. Lives entirely within
`IncidentSimulator.jsx`.

### Tabs

1. **Logs** — static display of all log lines; time, level badge, source, message.
2. **Metrics** — card grid; each card has a label, value, and status dot (critical / warning / ok).
3. **Investigate** — checklist of investigation steps + RCA form.

### Investigation flow

1. User works through the five steps, ticking each checkbox.
2. Progress bar fills as steps complete.
3. Once all steps are checked, a free-text RCA textarea unlocks.
4. User writes their diagnosis and clicks **Submit Diagnosis**.
5. The correct root cause and fix code are revealed. Resolution time is recorded to
   `localStorage` (`dem-incidents-resolved`) and displayed on the incident card.

---

## Live simulation mode (InvestigationWorkspace)

Opened by clicking "🔴 Go Live". Renders a full-screen overlay at the top of the
React tree (`App.jsx:335`):

```jsx
{investigatingId && <InvestigationWorkspace />}
```

### Layout

```
┌─────────────────────────────────────────────────────────┐
│  Left panel (sidebar)   │  Centre panel (tabs)          │
│                         │                               │
│  • Severity + status    │  [Logs][DAG][Metrics][Steps]  │
│  • Briefing             │  [RCA ★][Fix][Spark]          │
│  • Business impact      │                               │
│  • SLA countdown        │                               │
│  • Affected pipelines   │  Right panel (sidebar)        │
│  • Escalation level     │                               │
│                         │  • AI hints                   │
│                         │  • Team chat                  │
│                         │  • Fix options                │
├─────────────────────────────────────────────────────────┤
│  Bottom timeline (last 5 team messages)                 │
└─────────────────────────────────────────────────────────┘
```

### Centre-panel tabs

| Tab | Content |
|---|---|
| **Logs** | Streaming simulation — log lines appear with randomised 220–600 ms delays. Pause/resume, level filter (ALL / ERROR / WARN / INFO), text filter. |
| **DAG** | Pipeline graph for the three incidents that have a `INCIDENT_DAGS` entry. Click a node to see its status note. Falls back to a "no DAG available" message for other incidents. |
| **Metrics** | Live metric cards with status dots that pulse for critical values. |
| **Steps** | Checklist with progress bar; badge shows N/5 completion. |
| **RCA** | Locked (🔒) until all steps are checked. Text area + submit reveals the correct root cause. |
| **Fix** | Copy-able code block from `incident.fixCode`. |
| **Spark** | Mock Spark job/stage table for Spark-category incidents. |

### Right panel — Fix Options

Each incident has 2–3 fix options in `FIX_OPTIONS` (in `simulationStore.js`), each with:

```js
{
  id, label, detail, isCorrect,
  xp,          // XP awarded
  trustDelta,  // stakeholder trust change (–10 to +15)
  costDelta,   // cloud cost change ($)
  runtime,     // simulated apply time ("2 min", "45s", ...)
}
```

Applying a fix starts an animated progress bar. On completion, `completeFix` fires, awarding
XP and updating trust/cost deltas stored in the Zustand simulation store.

### Team messages + escalations

`tickIncidents` runs on a 30-second `setInterval` in `App.jsx`. Each tick can:
- Add a team chat message from `ESCALATION_TEMPLATES[incidentType]`
- Record a cascade failure from `CASCADE_MAP`
- Trigger a priority escalation if the SLA is breached

### Business impact panel

Live-updating dollar and user counts based on elapsed time and severity:

| Severity | $/hour | users/hour |
|---|---|---|
| P1 | $28 | 55 |
| P2 | $7.50 | 14 |
| P3 | $0.90 | 1.8 |

---

## State management

All live-simulation state lives in `src/store/simulationStore.js` (Zustand v5 with `persist`).

Key fields:

| Field | Type | Purpose |
|---|---|---|
| `activeIncidents` | array | Running live incidents (uid, incidentId, severity, startedAt, …) |
| `resolvedIncidents` | array | Completed live incidents |
| `investigatingIncidentId` | string \| null | uid of the incident currently open in the workspace |
| `applyingFix` | object \| null | In-progress fix (uid, fixId, startedAt, runtimeMs) |
| `stakeholderTrust` | number | 0–100; decreases on bad fixes or SLA breaches |
| `cloudCostDelta` | number | Running cloud cost change ($) |
| `simXP` | number | XP earned in live simulations |
| `teamMessages` | array | Chat log for the bottom timeline |

Key actions: `startIncident`, `acknowledgeIncident`, `openInvestigation`,
`closeInvestigation`, `applyFix`, `completeFix`, `tickIncidents`.

---

## File map

| File | Role |
|---|---|
| `src/data/incidents.js` | All 6 incident definitions (logs, metrics, steps, RCA, fixCode) |
| `src/store/simulationStore.js` | Zustand store — live state, FIX_OPTIONS, ESCALATION_TEMPLATES, CASCADE_MAP |
| `src/components/sections/IncidentSimulator.jsx` | Incident card list + IncidentDetail (practice mode) |
| `src/components/sections/InvestigationWorkspace.jsx` | Full-screen live simulation overlay |

---

## Keyboard / UX

- **Escape** — close the InvestigationWorkspace overlay
- Incident cards show a ✓ badge once resolved (stored in `localStorage` key `dem-incidents-resolved`)
- "LIVE" badge appears on the card when a live simulation is running for that incident
- Severity filter bar (All / P1 / P2 / P3) on the incident list
- Stats bar: resolved count, unresolved count, live count, total

---

## Adding a new incident

1. Add an entry to `INCIDENTS` in `src/data/incidents.js` following the existing shape.
2. Add fix options to `FIX_OPTIONS` in `simulationStore.js` keyed by the new `id`.
3. Add escalation messages to `ESCALATION_TEMPLATES[id]` in `simulationStore.js`.
4. Optionally add a DAG to `INCIDENT_DAGS` in `InvestigationWorkspace.jsx`.
5. Add cascade failures to `CASCADE_MAP[id]` in `simulationStore.js` if appropriate.
