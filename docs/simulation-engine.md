# Simulation Engine Design

## Overview

The simulation engine powers both the **Incident Simulator** and **Enterprise Simulator**.
It uses a typed event bus to decouple game state from UI components.

## Architecture

```
┌─────────────────────────────────────────────────────┐
│                  SimulationStore (Zustand)            │
│  session, timer, score, status, stepsTaken           │
└──────────────┬──────────────────────────────────────┘
               │ reads / writes
               ▼
┌─────────────────────────────────────────────────────┐
│                  simulationBus (EventBus)             │
│  emit / on / once / getHistory                       │
└──────┬────────────────────────────────┬─────────────┘
       │ emits                          │ listens
       ▼                                ▼
┌──────────────┐              ┌─────────────────────┐
│  Simulation  │              │  UI Components       │
│  Engine      │              │  (SimulationHUD,     │
│  (game logic)│              │   IncidentSimulator, │
│              │              │   EnterpriseSimulator│
└──────────────┘              └─────────────────────┘
       │
       ▼
┌──────────────┐
│  Supabase DB │
│  (persist    │
│   session,   │
│   events)    │
└──────────────┘
```

## Event Types

All simulation events flow through `simulationBus`:

| Event | Payload | Description |
|---|---|---|
| `simulation:started` | `{ sessionId, incidentId, severity }` | New simulation begins |
| `simulation:action_taken` | `{ actionId, label, correct, points }` | User takes an action |
| `simulation:clue_revealed` | `{ clueId, description }` | New clue unlocked |
| `simulation:escalated` | `{ from, to, reason }` | Severity escalated |
| `simulation:sla_warning` | `{ remainingSec, severity }` | SLA threshold hit |
| `simulation:sla_breached` | `{ severity }` | SLA exceeded |
| `simulation:resolved` | `{ score, slaMet, duration }` | User resolves incident |
| `simulation:failed` | `{ reason }` | Timer ran out or wrong resolution |
| `simulation:xp_awarded` | `{ amount, source, total }` | XP awarded |
| `simulation:timer_tick` | `{ elapsed, remaining }` | Every second |
| `simulation:log_entry` | `{ level, message, source }` | Simulated log line |

## Simulation State Machine

```
IDLE → STARTING → ACTIVE → RESOLVING → RESOLVED
                          ↘           ↗
                           ESCALATED
                          ↘
                           FAILED (timer breach or wrong answer)
```

## Adding a New Scenario

1. Add scenario definition to `src/data/incidents.js` or `src/data/scenarios.js`
2. Define: `id`, `title`, `severity`, `sla_minutes`, `clues[]`, `actions[]`, `correct_resolution`
3. Each `action` has: `id`, `label`, `isCorrect`, `points`, `description`
4. The engine scores based on: correct actions taken × speed bonus × SLA compliance

## Scoring Formula

```
base_score = correct_actions / total_actions × 100
speed_bonus = remaining_time / sla_time × 20   (max +20 pts)
sla_penalty = sla_breached ? -30 : 0

final_score = clamp(base_score + speed_bonus + sla_penalty, 0, 100)
```

## Persistence

On session start → `createIncidentSession()` in Supabase
On each action → `appendIncidentEvent()` (append-only timeline)
On resolve → `resolveIncident()` with score, RCA, SLA result, XP
