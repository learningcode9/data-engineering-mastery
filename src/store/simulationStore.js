/**
 * Global Simulation Store — Zustand v5
 *
 * Single source of truth for the entire production simulation:
 * incidents, pipeline health, stakeholder trust, cloud cost, team messages,
 * career XP, escalations. Actions in any module write here; components read here.
 */

import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import useLearningStore from './learningStore.js';

// ─── constants ───────────────────────────────────────────────────────────────

export const SIM_XP_RESOLVE_P1   = 500;
export const SIM_XP_RESOLVE_P2   = 200;
export const SIM_XP_RESOLVE_P3   = 100;
export const SIM_XP_PER_LEVEL    = 1000;

export const SLA_MINUTES = { P1: 30, P2: 60, P3: 120 };

// Dollar impact per hour of unresolved incident
const HOURLY_IMPACT = {
  P1: { dollar: 28000, users: 55000, reports: 6 },
  P2: { dollar: 7500,  users: 14000, reports: 3 },
  P3: { dollar: 900,   users: 1800,  reports: 1 },
};

// Pipelines that cascade-fail when an incident goes unresolved
export const CASCADE_MAP = {
  'adf-schema-drift':          ['orders-silver', 'revenue-daily', 'bi-refresh'],
  'spark-oom-wide-join':       ['cohort-query', 'ml-features', 'population-health'],
  'kafka-consumer-lag':        ['realtime-orders', 'fraud-scoring', 'clickstream-hourly'],
  'snowflake-credit-explosion':['analytics-mart', 'cost-reporting', 'exec-dashboard'],
  'airflow-dag-stuck':         ['daily-etl', 'reporting-mart', 'data-quality-checks'],
  'delta-small-file-problem':  ['delta-merge-perf', 'optimize-job', 'compaction-pipeline'],
};

// Trust delta per event
const TRUST_DELTA = {
  resolve_p1:         +15,
  resolve_p2:         +8,
  resolve_p3:         +4,
  escalate_level1:    -6,
  escalate_level2:    -12,
  escalate_level3:    -20,
  cascade_pipeline:   -5,
  bad_fix_choice:     -8,
  good_fix_choice:    +6,
};

// ─── teammate messages that appear as incidents age ───────────────────────────

const ESCALATION_TEMPLATES = {
  'adf-schema-drift': [
    { level: 1, author: 'Priya (Lead DE)',    avatar: '👩‍💻', role: 'manager',     text: 'Orders pipeline has been down for 30 min — still seeing the schema error. Finance dashboard goes stale in 10 min. What\'s the status?' },
    { level: 2, author: 'Marco (VP Revenue)', avatar: '👔', role: 'stakeholder', text: 'Revenue numbers are stale on the exec dashboard. We have a board meeting in 45 minutes. I need an ETA.' },
    { level: 3, author: 'Elena (CTO)',        avatar: '🏛️', role: 'executive',    text: '@here This is a P1 production incident. Board meeting is in 20 minutes. Someone needs to own this and give me a status in 5 minutes.' },
  ],
  'spark-oom-wide-join': [
    { level: 1, author: 'Valentina (Anl Eng)', avatar: '👩‍💻', role: 'peer',        text: 'Patient cohort query is still OOMing. I checked the EXPLAIN — there\'s a 500M×2.4M cross join without a broadcast hint. Can you add `broadcast()` on the lookup side?' },
    { level: 2, author: 'Dr. Aisha (Dir DE)',  avatar: '👩‍⚕️', role: 'manager',     text: '15 hospital clients are waiting on risk scores due at 08:00 UTC. It\'s now 05:30. Should we switch to the Snowflake fallback?' },
    { level: 3, author: 'Dr. Webb (CMO)',      avatar: '🩺', role: 'stakeholder', text: 'Clinical teams cannot access patient risk stratification for morning rounds. This is now a patient care issue. What is the recovery plan?' },
  ],
  'kafka-consumer-lag': [
    { level: 1, author: 'Lars (Sr DE)',        avatar: '👨‍🔬', role: 'peer',        text: 'Kafka consumer lag is at 4.2M messages and growing. The clickstream pipeline is 47 min behind SLA. Fraud scoring is starting to see timeouts.' },
    { level: 2, author: 'Amara (DQ Eng)',      avatar: '👩‍🔬', role: 'peer',        text: 'GE validation is now failing for the fraud scoring output — row counts are 23% below baseline. Compliance will flag this if it hits the regulatory mart.' },
    { level: 3, author: 'Sophie (Compliance)', avatar: '⚖️', role: 'stakeholder', text: 'Fraud detection gap has been open for 90+ minutes. Any transactions processed during this window need a manual review. This is a regulatory compliance issue.' },
  ],
  'snowflake-credit-explosion': [
    { level: 1, author: 'Sanjay (Architect)',  avatar: '☁️', role: 'architect',   text: 'Snowflake credits are burning at 4× normal rate. I traced it to the RISK_COMPUTE_XL warehouse — it\'s being kept alive by Airflow sensor queries. Quick fix: move sensors to a dedicated XS warehouse.' },
    { level: 2, author: 'Elena (Head DE)',     avatar: '👩‍💼', role: 'manager',     text: 'FinOps alert: we\'re on track to exceed the monthly Snowflake budget by $14K. Finance has flagged it. Can we apply the warehouse fix today?' },
    { level: 3, author: 'CFO Office',          avatar: '💼', role: 'stakeholder', text: 'Monthly cloud spend is projected at $59K vs $45K budget. This needs a written root cause and prevention plan by EOD.' },
  ],
  'airflow-dag-stuck': [
    { level: 1, author: 'Chloe (Anl Eng)',     avatar: '👩‍📊', role: 'peer',        text: 'The reporting_mart DAG has been "running" for 3 hours with no progress. I see zombie tasks in the Airflow UI — tasks showing running but no heartbeat. Probably needs a manual clear.' },
    { level: 2, author: 'Priya (Lead DE)',     avatar: '👩‍💻', role: 'manager',     text: 'All downstream dashboards that depend on reporting_mart are stale — that\'s 12 reports. Marketing is asking why their campaign attribution is from yesterday. Need this fixed in the next hour.' },
    { level: 3, author: 'Marco (VP Revenue)',  avatar: '👔', role: 'stakeholder', text: 'Campaign spend decisions are being made on day-old data right now. Every hour of delay = budget inefficiency. This is critical for the Q2 campaign launch tomorrow.' },
  ],
  'delta-small-file-problem': [
    { level: 1, author: 'Yusuf (Architect)',   avatar: '🏗️', role: 'architect',   text: 'Delta table has 840K small files (< 1MB avg). MERGE operations are doing a full table scan and timing out. This started after we switched to 5-minute micro-batch writes 2 weeks ago. Need to run OPTIMIZE + ZORDER.' },
    { level: 2, author: 'Lars (Sr DE)',        avatar: '👨‍🔬', role: 'peer',        text: 'Query times on orders_silver are now 8-12× slower than baseline. The BI team is reporting Power BI timeouts. We need the OPTIMIZE job to run NOW, not wait for the nightly window.' },
    { level: 3, author: 'Priya (Lead DE)',     avatar: '👩‍💻', role: 'manager',     text: 'The entire BI team is blocked. We\'re in an SLA breach on 4 reports. Run the optimization manually and then we need a permanent automated OPTIMIZE schedule in place before EOD.' },
  ],
};

// ─── fix resolution options (per incident) ───────────────────────────────────

export const FIX_OPTIONS = {
  'adf-schema-drift': [
    { id: 'alter-sink',      label: 'ALTER TABLE + update mapping',  xp: SIM_XP_RESOLVE_P1, trustDelta: TRUST_DELTA.resolve_p1, costDelta: 0,    isCorrect: true,  runtime: '12 min',  detail: 'Add discount_percent column to sink, update ADF mapping, re-run pipeline.' },
    { id: 'ignore-column',   label: 'Ignore new column (skip drift)', xp: 0,                 trustDelta: TRUST_DELTA.bad_fix_choice, costDelta: 800, isCorrect: false, runtime: '3 min',   detail: 'Silently drops the new column. Data loss. Finance will notice.' },
    { id: 'schema-registry', label: 'Enable schema auto-evolution',   xp: SIM_XP_RESOLVE_P1 + 50, trustDelta: TRUST_DELTA.good_fix_choice + TRUST_DELTA.resolve_p1, costDelta: -200, isCorrect: true, runtime: '35 min', detail: 'Long-term fix: enable schema evolution + data contracts. Prevents recurrence.' },
  ],
  'spark-oom-wide-join': [
    { id: 'broadcast-hint',  label: 'Add broadcast() hint',          xp: SIM_XP_RESOLVE_P1, trustDelta: TRUST_DELTA.resolve_p1, costDelta: -1200, isCorrect: true,  runtime: '18 min', detail: 'Broadcast the 87MB lookup table. Eliminates shuffle. 70% memory reduction.' },
    { id: 'increase-memory', label: 'Increase executor memory only',  xp: 80,                trustDelta: -5, costDelta: 2400, isCorrect: false, runtime: '5 min',  detail: 'Treats symptoms not cause. Will OOM again next month at larger scale.' },
    { id: 'snowflake-fallback', label: 'Switch to Snowflake fallback',  xp: SIM_XP_RESOLVE_P2, trustDelta: TRUST_DELTA.resolve_p2, costDelta: 300, isCorrect: true,  runtime: '26 min', detail: 'Run SQL aggregation in Snowflake instead. Works today. Plan migration permanently.' },
  ],
  'kafka-consumer-lag': [
    { id: 'scale-consumers', label: 'Scale consumer group (6→12)',    xp: SIM_XP_RESOLVE_P2, trustDelta: TRUST_DELTA.resolve_p2, costDelta: 800, isCorrect: true,  runtime: '8 min',  detail: 'Double consumer parallelism. Lag clears in ~25 min.' },
    { id: 'reset-offsets',   label: 'Reset consumer offsets (skip)', xp: 0,                 trustDelta: -15, costDelta: 0,   isCorrect: false, runtime: '2 min',  detail: 'Skips messages. Data loss in fraud scoring. Compliance violation risk.' },
    { id: 'increase-batch',  label: 'Increase max.poll.records',      xp: SIM_XP_RESOLVE_P2 + 30, trustDelta: TRUST_DELTA.resolve_p2 + 3, costDelta: 0, isCorrect: true, runtime: '4 min', detail: 'Each consumer processes more records per poll cycle. Faster catchup.' },
  ],
  'snowflake-credit-explosion': [
    { id: 'sensor-warehouse', label: 'Create SENSOR_XSMALL warehouse', xp: SIM_XP_RESOLVE_P2, trustDelta: TRUST_DELTA.resolve_p2, costDelta: -9000, isCorrect: true, runtime: '15 min', detail: 'Dedicated XS warehouse for Airflow sensors. Saves $380/day.' },
    { id: 'suspend-queries',  label: 'Force-suspend the warehouse',    xp: 0,                 trustDelta: -10, costDelta: 0,     isCorrect: false, runtime: '1 min',  detail: 'Breaks all running queries. Cascade failure. Worse outcome.' },
    { id: 'auto-suspend',     label: 'Lower AUTO_SUSPEND to 60s',      xp: SIM_XP_RESOLVE_P3, trustDelta: TRUST_DELTA.good_fix_choice, costDelta: -2000, isCorrect: true, runtime: '5 min', detail: 'Partial fix — will re-trigger unless sensors are moved to separate warehouse.' },
  ],
  'airflow-dag-stuck': [
    { id: 'clear-tasks',     label: 'Clear zombie tasks + restart',   xp: SIM_XP_RESOLVE_P2, trustDelta: TRUST_DELTA.resolve_p2, costDelta: 0,   isCorrect: true,  runtime: '6 min',  detail: 'CLI: airflow tasks clear reporting_mart -d 2026-05-21. Restart scheduler.' },
    { id: 'restart-worker',  label: 'Restart Celery workers',          xp: SIM_XP_RESOLVE_P3, trustDelta: 4, costDelta: 0,   isCorrect: true,  runtime: '10 min', detail: 'Forces all tasks to re-queue. Slower but clears any stuck worker processes.' },
    { id: 'kill-dag',        label: 'Mark DAG as failed, skip today',  xp: 0,                 trustDelta: -12, costDelta: 0, isCorrect: false, runtime: '1 min',  detail: 'Skips the reporting run. 12 stale dashboards for the entire day.' },
  ],
  'delta-small-file-problem': [
    { id: 'optimize-zorder', label: 'Run OPTIMIZE + ZORDER NOW',       xp: SIM_XP_RESOLVE_P2, trustDelta: TRUST_DELTA.resolve_p2, costDelta: 150, isCorrect: true,  runtime: '22 min', detail: 'Compacts 840K files → ~8K. Colocates by order_date. Queries 8× faster.' },
    { id: 'vacuum-only',     label: 'Run VACUUM only (72h retention)', xp: 0,                 trustDelta: -5, costDelta: 0,  isCorrect: false, runtime: '45 min', detail: 'VACUUM removes old versions, not live small files. Query performance unchanged.' },
    { id: 'scheduled-opt',   label: 'Enable auto-compaction + schedule', xp: SIM_XP_RESOLVE_P2 + 80, trustDelta: TRUST_DELTA.resolve_p2 + 5, costDelta: -400, isCorrect: true, runtime: '30 min', detail: 'Best long-term fix: Databricks auto-optimize + nightly OPTIMIZE cron.' },
  ],
};

// ─── store ────────────────────────────────────────────────────────────────────

const useSimulationStore = create(
  persist(
    (set, get) => ({
      // ── world state ─────────────────────────────────────────────────────────
      activeIncidents: [],       // { uid, incidentId, severity, startedAt, escalationLevel, cascadedPipelines, acknowledgedAt }
      resolvedIncidents: [],     // { uid, incidentId, severity, resolvedAt, method, xpEarned, trustDelta }
      pipelineHealth: {},        // { [pipelineId]: 'ok' | 'degraded' | 'failed' }
      stakeholderTrust: 85,      // 0–100
      cloudCostDelta: 0,         // cumulative extra cost in $
      teamMessages: [],          // { id, author, avatar, role, text, timestamp, incidentId, urgency }
      escalations: [],           // { id, incidentId, level, message, timestamp, acknowledged }

      // ── simulation XP / career ───────────────────────────────────────────────
      simXP: 0,
      simLevel: 1,
      resolvedCount: 0,
      p1ResolvedCount: 0,
      totalDollarSaved: 0,

      // ── investigation workspace ──────────────────────────────────────────────
      investigatingIncidentId: null, // uid of the incident being investigated

      // ── active fix in-flight ─────────────────────────────────────────────────
      applyingFix: null,   // { uid, optionId, startedAt, resolveAt }

      // ═══════════════════════════════════════════════════════════════════════
      // ACTIONS
      // ═══════════════════════════════════════════════════════════════════════

      startIncident(incidentId, severity) {
        const uid = `${incidentId}-${Date.now()}`;
        const newIncident = {
          uid,
          incidentId,
          severity: severity || 'P2',
          startedAt: Date.now(),
          escalationLevel: 0,
          cascadedPipelines: [],
          acknowledgedAt: null,
        };
        set(s => ({ activeIncidents: [...s.activeIncidents, newIncident] }));
        return uid;
      },

      acknowledgeIncident(uid) {
        set(s => ({
          activeIncidents: s.activeIncidents.map(i =>
            i.uid === uid ? { ...i, acknowledgedAt: Date.now() } : i
          ),
        }));
      },

      openInvestigation(uid) {
        set({ investigatingIncidentId: uid });
      },

      closeInvestigation() {
        set({ investigatingIncidentId: null, applyingFix: null });
      },

      applyFix(uid, optionId, durationMs) {
        set({
          applyingFix: {
            uid,
            optionId,
            startedAt: Date.now(),
            resolveAt: Date.now() + (durationMs || 5000),
          },
        });
      },

      completeFix(uid, option) {
        const state = get();
        const incident = state.activeIncidents.find(i => i.uid === uid);
        if (!incident) return;

        const xpEarned      = option.isCorrect ? option.xp : 0;
        const trustChange   = option.trustDelta || 0;
        const costChange    = option.costDelta  || 0;
        const newTrust      = Math.max(0, Math.min(100, state.stakeholderTrust + trustChange));
        const newXP         = state.simXP + xpEarned;
        const newLevel      = Math.floor(newXP / SIM_XP_PER_LEVEL) + 1;
        const dollarSaved   = option.isCorrect ? (HOURLY_IMPACT[incident.severity]?.dollar || 0) : 0;

        // Remove cascaded pipelines from health map
        const newPipelineHealth = { ...state.pipelineHealth };
        for (const pid of incident.cascadedPipelines) {
          newPipelineHealth[pid] = 'ok';
        }

        // Remove from active, add to resolved
        const resolved = {
          uid,
          incidentId: incident.incidentId,
          severity: incident.severity,
          resolvedAt: Date.now(),
          method: option.id,
          xpEarned,
          trustDelta: trustChange,
          isCorrect: option.isCorrect,
        };

        set(s => ({
          activeIncidents: s.activeIncidents.filter(i => i.uid !== uid),
          resolvedIncidents: [resolved, ...s.resolvedIncidents].slice(0, 50),
          stakeholderTrust: newTrust,
          cloudCostDelta: s.cloudCostDelta + costChange,
          simXP: newXP,
          simLevel: newLevel,
          resolvedCount: s.resolvedCount + 1,
          p1ResolvedCount: incident.severity === 'P1' ? s.p1ResolvedCount + 1 : s.p1ResolvedCount,
          totalDollarSaved: s.totalDollarSaved + dollarSaved,
          pipelineHealth: newPipelineHealth,
          applyingFix: null,
          investigatingIncidentId: null,
        }));

        if (option.isCorrect) {
          useLearningStore.getState().recordIncidentResolved();
        }

        // Add resolution team message
        const msg = {
          id: `resolve-${uid}`,
          author: 'System',
          avatar: '✅',
          role: 'system',
          text: option.isCorrect
            ? `✅ Incident resolved using "${option.label}". +${xpEarned} XP earned. Trust: ${trustChange >= 0 ? '+' : ''}${trustChange}%.`
            : `⚠️ Fix applied but "${option.label}" was not the correct approach. Data quality impact possible.`,
          timestamp: Date.now(),
          incidentId: incident.incidentId,
          urgency: option.isCorrect ? 'success' : 'warning',
        };
        set(s => ({ teamMessages: [msg, ...s.teamMessages].slice(0, 100) }));
      },

      // Called on a timer — escalates unresolved incidents
      tickIncidents() {
        const state = get();
        const now   = Date.now();
        let trustDrop      = 0;
        const newEscalations   = [];
        const newTeamMessages  = [];
        const newPipelineHealth = { ...state.pipelineHealth };

        for (const inc of state.activeIncidents) {
          const ageMin       = (now - inc.startedAt) / 60000;
          const slaMin       = SLA_MINUTES[inc.severity] || 60;
          const breachFactor = ageMin / slaMin;

          let newLevel = inc.escalationLevel;

          // Escalation levels
          if (breachFactor >= 3 && inc.escalationLevel < 3) newLevel = 3;
          else if (breachFactor >= 2 && inc.escalationLevel < 2) newLevel = 2;
          else if (breachFactor >= 1 && inc.escalationLevel < 1) newLevel = 1;

          if (newLevel > inc.escalationLevel) {
            // Generate escalation message
            const templates = ESCALATION_TEMPLATES[inc.incidentId] || [];
            const tmpl      = templates.find(t => t.level === newLevel);
            if (tmpl) {
              const escId = `esc-${inc.uid}-${newLevel}`;
              if (!state.escalations.find(e => e.id === escId)) {
                newEscalations.push({
                  id:     escId,
                  incidentId: inc.incidentId,
                  level:  newLevel,
                  message: tmpl.text,
                  author:  tmpl.author,
                  avatar:  tmpl.avatar,
                  role:    tmpl.role,
                  timestamp: now,
                  acknowledged: false,
                });
                newTeamMessages.push({
                  id:        escId,
                  author:    tmpl.author,
                  avatar:    tmpl.avatar,
                  role:      tmpl.role,
                  text:      tmpl.text,
                  timestamp: now,
                  incidentId: inc.incidentId,
                  urgency:   newLevel === 3 ? 'critical' : 'high',
                });
                const delta = TRUST_DELTA[`escalate_level${newLevel}`] || -8;
                trustDrop  += Math.abs(delta);
              }
            }

            // Cascade pipeline failures at level 2+
            if (newLevel >= 2) {
              const cascades = CASCADE_MAP[inc.incidentId] || [];
              for (const pid of cascades) {
                if (!inc.cascadedPipelines.includes(pid)) {
                  newPipelineHealth[pid] = newLevel >= 3 ? 'failed' : 'degraded';
                  trustDrop += 3;
                }
              }
            }
          }

          // Update incident escalation level in place
          if (newLevel !== inc.escalationLevel) {
            const cascades = CASCADE_MAP[inc.incidentId] || [];
            set(s => ({
              activeIncidents: s.activeIncidents.map(i =>
                i.uid === inc.uid
                  ? { ...i, escalationLevel: newLevel, cascadedPipelines: newLevel >= 2 ? cascades : i.cascadedPipelines }
                  : i
              ),
            }));
          }
        }

        if (trustDrop > 0 || newEscalations.length > 0 || newTeamMessages.length > 0) {
          set(s => ({
            stakeholderTrust: Math.max(0, s.stakeholderTrust - trustDrop),
            escalations: [...newEscalations, ...s.escalations].slice(0, 50),
            teamMessages: [...newTeamMessages, ...s.teamMessages].slice(0, 100),
            pipelineHealth: newPipelineHealth,
          }));
        }
      },

      acknowledgeEscalation(id) {
        set(s => ({
          escalations: s.escalations.map(e =>
            e.id === id ? { ...e, acknowledged: true } : e
          ),
        }));
      },

      addTeamMessage(msg) {
        set(s => ({ teamMessages: [{ ...msg, id: `msg-${Date.now()}`, timestamp: Date.now() }, ...s.teamMessages].slice(0, 100) }));
      },

      updatePipelineHealth(pipelineId, status) {
        set(s => ({ pipelineHealth: { ...s.pipelineHealth, [pipelineId]: status } }));
      },

      adjustTrust(delta, reason) {
        set(s => ({
          stakeholderTrust: Math.max(0, Math.min(100, s.stakeholderTrust + delta)),
        }));
        if (reason) {
          get().addTeamMessage({
            author: 'System',
            avatar: delta >= 0 ? '📈' : '📉',
            role: 'system',
            text: `Trust ${delta >= 0 ? 'improved' : 'dropped'} by ${Math.abs(delta)} points. ${reason}`,
            urgency: delta < 0 ? 'warning' : 'info',
          });
        }
      },

      addSimXP(amount) {
        set(s => {
          const newXP    = s.simXP + amount;
          const newLevel = Math.floor(newXP / SIM_XP_PER_LEVEL) + 1;
          return { simXP: newXP, simLevel: newLevel };
        });
      },

      resetSimulation() {
        set({
          activeIncidents: [],
          resolvedIncidents: [],
          pipelineHealth: {},
          stakeholderTrust: 85,
          cloudCostDelta: 0,
          teamMessages: [],
          escalations: [],
          simXP: 0,
          simLevel: 1,
          resolvedCount: 0,
          p1ResolvedCount: 0,
          totalDollarSaved: 0,
          investigatingIncidentId: null,
          applyingFix: null,
        });
      },
    }),
    {
      name: 'dem-simulation-v1',
      version: 1,
      // Don't persist in-flight fix or investigation state
      partialize: s => {
        const rest = { ...s };
        delete rest.applyingFix;
        delete rest.investigatingIncidentId;
        return rest;
      },
    }
  )
);

export default useSimulationStore;

// ─── derived selectors ────────────────────────────────────────────────────────

export function selectActiveP1Count(state) {
  return state.activeIncidents.filter(i => i.severity === 'P1').length;
}

export function selectUnacknowledgedEscalations(state) {
  return state.escalations.filter(e => !e.acknowledged);
}

export function selectPipelineHealthSummary(state) {
  const all    = Object.values(state.pipelineHealth);
  const failed = all.filter(v => v === 'failed').length;
  const degraded = all.filter(v => v === 'degraded').length;
  const total  = all.length;
  if (total === 0) return { status: 'ok', label: 'All clear', pct: 100 };
  const healthyPct = Math.round(((total - failed - degraded) / total) * 100);
  if (failed > 0)   return { status: 'critical', label: `${failed} failed`,   pct: healthyPct };
  if (degraded > 0) return { status: 'warning',  label: `${degraded} degraded`, pct: healthyPct };
  return { status: 'ok', label: 'All clear', pct: 100 };
}

export function selectBusinessImpact(state) {
  let totalPerHour = 0;
  let affectedUsers = 0;
  for (const inc of state.activeIncidents) {
    const imp = HOURLY_IMPACT[inc.severity];
    if (imp) { totalPerHour += imp.dollar; affectedUsers += imp.users; }
  }
  return { dollarPerHour: totalPerHour, affectedUsers };
}

export function selectCareerRole(state) {
  if (state.p1ResolvedCount >= 10 || state.simLevel >= 5) return 'Principal Engineer';
  if (state.resolvedCount >= 15  || state.simLevel >= 3) return 'Senior Engineer';
  if (state.resolvedCount >= 5   || state.simLevel >= 2) return 'Mid-Level Engineer';
  return 'Junior Engineer';
}
