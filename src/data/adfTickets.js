// Office / career layer for the ADF simulator: ticket backlog, career levels,
// and a persistent "resume experience" tracker. Only the Customer Events API
// ticket is fully playable today; the rest of the backlog is listed to set the
// real-job context (and as the roadmap for future playable tickets/incidents).

export const ACTIVE_TICKET_ID = 'customer-events-api';

export const TICKET_BACKLOG = [
  {
    level: 'Beginner',
    tickets: [
      { id: 'crm-csv', title: 'CRM Export CSV → ADLS', priority: 'P2', team: 'Sales Ops', due: 'Tomorrow', status: 'soon' },
      { id: 'sales-sql', title: 'Sales Data → Azure SQL', priority: 'P2', team: 'Finance', due: 'Tomorrow', status: 'soon' },
    ],
  },
  {
    level: 'Intermediate',
    tickets: [
      { id: 'incremental-rest', title: 'Incremental REST API ingestion', priority: 'P2', team: 'Marketing', due: 'This week', status: 'soon' },
      { id: 'cdc-sql', title: 'CDC from SQL Server', priority: 'P1', team: 'Data Platform', due: 'This week', status: 'soon' },
      { id: 'multi-file', title: 'Multi-file ingestion', priority: 'P3', team: 'Operations', due: 'This week', status: 'soon' },
    ],
  },
  {
    level: 'Advanced',
    tickets: [
      { id: 'metadata-framework', title: 'Metadata-driven ingestion framework', priority: 'P2', team: 'Architecture', due: 'Sprint', status: 'soon' },
      { id: 'dynamic-pipelines', title: 'Dynamic ADF pipelines', priority: 'P2', team: 'Architecture', due: 'Sprint', status: 'soon' },
      { id: 'scd2', title: 'SCD Type 2 pipeline', priority: 'P2', team: 'Analytics', due: 'Sprint', status: 'soon' },
      { id: 'audit-replay', title: 'Audit & replay framework', priority: 'P2', team: 'Data Platform', due: 'Sprint', status: 'soon' },
    ],
  },
  {
    level: 'Expert',
    tickets: [
      { id: 'prod-failure', title: 'Production failure recovery', priority: 'P1', team: 'On-call', due: 'NOW', status: 'incident' },
      { id: 'sla-breach', title: 'SLA breach investigation', priority: 'P1', team: 'On-call', due: 'NOW', status: 'incident' },
      { id: 'cost-opt', title: 'Cost optimization challenge', priority: 'P3', team: 'FinOps', due: 'Sprint', status: 'soon' },
    ],
  },
];

export const CAREER_LEVELS = [
  { id: 'trainee', label: 'Trainee Data Engineer', min: 0 },
  { id: 'junior', label: 'Junior Data Engineer', min: 1 },
  { id: 'de', label: 'Data Engineer', min: 3 },
  { id: 'senior', label: 'Senior Data Engineer', min: 6 },
  { id: 'lead', label: 'Lead Data Engineer', min: 10 },
];

export const EXPERIENCE_KEYS = [
  { key: 'ticketsCompleted', label: 'ADF tickets completed' },
  { key: 'projectsDelivered', label: 'End-to-end projects' },
  { key: 'incidentsResolved', label: 'Incidents resolved' },
  { key: 'restApis', label: 'REST API pipelines' },
  { key: 'sqlPipelines', label: 'SQL pipelines' },
  { key: 'cdc', label: 'CDC implementations' },
  { key: 'monitoring', label: 'Monitoring configurations' },
];

// On-call incidents (Phase 6) — diagnosis tickets, separate from the build sprint.
export const INCIDENTS = [
  { id: 'INC-1001', title: 'Customer Events Pipeline Failed Overnight', priority: 'P1', team: 'Marketing', sla: 'Fix before 10 AM dashboard refresh', status: 'open' },
];

export const CAREER_KEY = 'dem-adf-career';

const EMPTY_CAREER = { ticketsCompleted: 0, projectsDelivered: 0, incidentsResolved: 0, restApis: 0, sqlPipelines: 0, cdc: 0, monitoring: 0 };

export function readCareer() {
  try {
    const raw = localStorage.getItem(CAREER_KEY);
    return { ...EMPTY_CAREER, ...(raw ? JSON.parse(raw) : {}) };
  } catch {
    return { ...EMPTY_CAREER };
  }
}

// Log a completed Customer Events (REST + monitoring) ticket. Returns updated stats.
export function logActiveTicket() {
  const current = readCareer();
  const next = {
    ...current,
    ticketsCompleted: current.ticketsCompleted + 1,
    restApis: current.restApis + 1,
    monitoring: current.monitoring + 1,
  };
  try { localStorage.setItem(CAREER_KEY, JSON.stringify(next)); } catch { /* ignore */ }
  return next;
}

export function careerLevel(ticketsCompleted) {
  const reached = [...CAREER_LEVELS].reverse().find(l => ticketsCompleted >= l.min) ?? CAREER_LEVELS[0];
  const idx = CAREER_LEVELS.findIndex(l => l.id === reached.id);
  const next = CAREER_LEVELS[idx + 1] ?? null;
  return { level: reached, next, idx };
}

export function logDeliveredTicket() {
  const current = readCareer();
  const next = { ...current, ticketsCompleted: current.ticketsCompleted + 1 };
  try { localStorage.setItem(CAREER_KEY, JSON.stringify(next)); } catch { /* ignore */ }
  return next;
}

export function awardProject() {
  const current = readCareer();
  const next = { ...current, projectsDelivered: current.projectsDelivered + 1 };
  try { localStorage.setItem(CAREER_KEY, JSON.stringify(next)); } catch { /* ignore */ }
  return next;
}

// Log a resolved incident — updates career only (incidents are not sprint tickets).
export function logIncident(delta = {}) {
  const current = readCareer();
  const next = { ...current, ticketsCompleted: current.ticketsCompleted + 1 };
  for (const [k, v] of Object.entries(delta)) next[k] = (next[k] ?? 0) + v;
  try { localStorage.setItem(CAREER_KEY, JSON.stringify(next)); } catch { /* ignore */ }
  return next;
}

// ── Sprint Delivery Mode ──────────────────────────────────────────────────
// The active sprint is a connected medallion chain. ADF-1024 is fully playable
// (the hands-on simulator); downstream tickets unlock as predecessors finish.
export const SPRINT = {
  id: 'marketing-analytics-mvp',
  name: 'Marketing Analytics MVP',
  businessGoal: 'Provide hourly campaign reporting.',
  tickets: [
    { id: 'ADF-1024', title: 'Customer Events API → ADLS Bronze', layer: 'Bronze', team: 'Marketing', dependsOn: [], feedsInto: 'ADF-1025', impact: 'Campaign data becomes available.', playable: true },
    { id: 'ADF-1025', title: 'Bronze → Silver Transformation', layer: 'Silver', team: 'Data Platform', dependsOn: ['ADF-1024'], feedsInto: 'ADF-1026', impact: 'Data quality improves.', playable: true },
    { id: 'ADF-1026', title: 'Silver → Gold Aggregation', layer: 'Gold', team: 'Analytics', dependsOn: ['ADF-1025'], feedsInto: 'ADF-1027', impact: 'Metrics become report-ready.', playable: true },
    { id: 'ADF-1027', title: 'Marketing Dashboard Dataset', layer: 'Serving', team: 'BI', dependsOn: ['ADF-1026'], feedsInto: null, impact: 'Business users can make decisions.', playable: true },
  ],
  completion: {
    outcome: ['Hourly reporting available', 'SLA met', 'Data quality validated', 'Business dashboards refreshed'],
    dataFreshness: '60 minutes',
    sla: 'Met',
    managerFeedback: 'Excellent delivery',
  },
  projectArtifact: {
    summary: 'Delivered the Marketing Analytics MVP end to end: a medallion pipeline ingesting customer events from a REST API into ADLS Bronze, transforming to a clean Silver Delta table, aggregating into a Gold star schema, and serving a governed Power BI dataset for hourly campaign reporting.',
    resume: 'Delivered an end-to-end Azure medallion data pipeline (REST API → ADLS Bronze → Silver Delta → Gold star schema → Power BI) providing hourly campaign reporting within a 90-minute freshness SLA, with watermark-based incremental loads, deduplication, schema enforcement, SCD2 dimensions, and row-level-secured serving.',
    talkingPoints: [
      'Tell me about this project — the Marketing Analytics MVP medallion pipeline.',
      'Biggest challenge — keeping the pipeline restart-safe and idempotent across layers.',
      'How did you implement watermarking for incremental ingestion?',
      'How did you handle duplicate events in the Silver layer?',
      'How was the Gold layer designed (star schema, surrogate keys, SCD2)?',
      'How did reporting consume the data within the freshness SLA?',
    ],
  },
};

// Architecture supports future sprint packs without rewrites — just add entries.
export const UPCOMING_SPRINTS = [
  { id: 'crm-analytics', name: 'CRM Analytics' },
  { id: 'sales-reporting', name: 'Sales Reporting' },
  { id: 'finance-platform', name: 'Finance Platform' },
  { id: 'customer-360', name: 'Customer 360' },
  { id: 'iot-analytics', name: 'IoT Analytics' },
];

export const SPRINT_KEY = 'dem-adf-sprint';

export function readSprint() {
  try {
    const raw = localStorage.getItem(SPRINT_KEY);
    return { done: [], projectAwarded: false, ...(raw ? JSON.parse(raw) : {}) };
  } catch {
    return { done: [], projectAwarded: false };
  }
}

function writeSprint(s) {
  try { localStorage.setItem(SPRINT_KEY, JSON.stringify(s)); } catch { /* ignore */ }
  return s;
}

export function ticketStatus(ticket, done) {
  if (done.includes(ticket.id)) return 'done';
  if (ticket.dependsOn.every(d => done.includes(d))) return 'unlocked';
  return 'blocked';
}

export function blockedBy(ticket, done) {
  return ticket.dependsOn.filter(d => !done.includes(d));
}

export function sprintProgress(done) {
  const ids = SPRINT.tickets.map(t => t.id);
  const completed = ids.filter(id => done.includes(id)).length;
  const total = ids.length;
  return { completed, total, pct: Math.round((completed / total) * 100), complete: completed === total };
}

// Mark a sprint ticket done, update career, and return { sprint, career, notice }.
// careerDelta: per-sim experience increments (e.g. { restApis: 1, monitoring: 1 }).
export function completeSprintTicket(ticketId, careerDelta = {}) {
  let career = readCareer();
  career = { ...career, ticketsCompleted: career.ticketsCompleted + 1 };
  for (const [k, v] of Object.entries(careerDelta)) career[k] = (career[k] ?? 0) + v;
  try { localStorage.setItem(CAREER_KEY, JSON.stringify(career)); } catch { /* ignore */ }

  const s = readSprint();
  if (!s.done.includes(ticketId)) s.done = [...s.done, ticketId];
  writeSprint(s);

  const progress = sprintProgress(s.done);
  let notice = null;

  const t = SPRINT.tickets.find(x => x.id === ticketId);
  if (t?.feedsInto) {
    const nextT = SPRINT.tickets.find(x => x.id === t.feedsInto);
    if (nextT && ticketStatus(nextT, s.done) === 'unlocked') {
      notice = { type: 'unlock', id: nextT.id, title: nextT.title };
    }
  }

  if (progress.complete && !s.projectAwarded) {
    career = awardProject();
    s.projectAwarded = true;
    writeSprint(s);
    notice = { type: 'sprint-complete' };
  }

  return { sprint: s, career, notice, progress };
}

export function resetSprint() {
  return writeSprint({ done: [], projectAwarded: false });
}
