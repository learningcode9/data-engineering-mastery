import { memo, useMemo, useState } from 'react';
import { computeWeightedOverall } from '../../data/skillGraph.js';
import { Badge, MetricCard, SectionHeader } from '../ui/design-system.jsx';
import { useLocalStorage } from '../../hooks/useLocalStorage.js';
import useLearningStore, { levelFromXP, XP_PER_LEVEL } from '../../store/learningStore.js';

// ─── ReadinessScore ───────────────────────────────────────────────────────────

function ReadinessScore({ topics, practiceProgress, learnedCount, streak }) {
  const score = useMemo(() => {
    const done = Object.values(practiceProgress ?? {}).filter(Boolean).length;
    const comp = topics.filter(t => t.completed).length;
    const total = topics.length || 1;
    return Math.round(
      Math.min((comp / total) * 30, 30) +
      Math.min((done / 40) * 30, 30) +
      Math.min((learnedCount / 20) * 25, 25) +
      Math.min(streak * 1.5, 15)
    );
  }, [topics, practiceProgress, learnedCount, streak]);

  const label = score >= 80 ? 'Interview Ready' : score >= 60 ? 'Strong Progress' : score >= 40 ? 'Building Skills' : 'Early Stage';
  const color = score >= 80 ? '#2f756e' : score >= 60 ? '#4caf50' : score >= 40 ? '#f59e0b' : '#9ca3af';
  const r = 38;
  const circ = 2 * Math.PI * r;
  const offset = circ - (score / 100) * circ;

  const breakdown = [
    { label: 'Topics',    val: Math.round(Math.min((topics.filter(t => t.completed).length / (topics.length || 1)) * 30, 30)), max: 30, color: '#2f756e' },
    { label: 'Practice',  val: Math.round(Math.min((Object.values(practiceProgress ?? {}).filter(Boolean).length / 40) * 30, 30)), max: 30, color: '#95a85f' },
    { label: 'Interview', val: Math.round(Math.min((learnedCount / 20) * 25, 25)), max: 25, color: '#6b7cdb' },
    { label: 'Streak',    val: Math.round(Math.min(streak * 1.5, 15)), max: 15, color: '#f59e0b' },
  ];

  return (
    <div className="analytics-chart-block">
      <p className="analytics-chart-label">Interview Readiness</p>
      <div className="analytics-readiness-inner">
        <div className="analytics-ring-wrap">
          <svg width="96" height="96" viewBox="0 0 100 100" aria-label={`${score} out of 100 interview readiness`}>
            <circle cx="50" cy="50" r={r} fill="none" stroke="var(--card-border)" strokeWidth="8" />
            <circle
              cx="50" cy="50" r={r}
              fill="none"
              stroke={color}
              strokeWidth="8"
              strokeDasharray={circ}
              strokeDashoffset={offset}
              strokeLinecap="round"
              transform="rotate(-90 50 50)"
            />
            <text x="50" y="44" textAnchor="middle" dominantBaseline="middle" fontSize="19" fontWeight="900" fill="var(--heading)">{score}</text>
            <text x="50" y="60" textAnchor="middle" dominantBaseline="middle" fontSize="8.5" fill="var(--muted)">/ 100</text>
          </svg>
          <span className="analytics-readiness-label" style={{ color }}>{label}</span>
        </div>
        <div className="analytics-breakdown-list">
          {breakdown.map(b => (
            <div key={b.label} className="analytics-breakdown-row">
              <span className="analytics-breakdown-name">{b.label}</span>
              <div className="analytics-breakdown-track">
                <div className="analytics-breakdown-fill" style={{ width: `${(b.val / b.max) * 100}%`, background: b.color }} />
              </div>
              <span className="analytics-breakdown-score">{b.val}/{b.max}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// ─── RoleReadiness ────────────────────────────────────────────────────────────

const ROLES = [
  {
    id: 'junior',
    label: 'Junior Data Engineer',
    target: { sql: 60, python: 50, pyspark: 30 },
    color: '#2f756e',
    desc: 'Pipeline basics, SQL proficiency, Python scripting',
  },
  {
    id: 'mid',
    label: 'Mid-Level DE',
    target: { sql: 80, python: 70, pyspark: 60, 'azure-databricks': 40 },
    color: '#6b7cdb',
    desc: 'Spark, cloud platforms, orchestration, Delta Lake',
  },
  {
    id: 'senior',
    label: 'Senior Data Engineer',
    target: { sql: 90, python: 85, pyspark: 80, 'azure-databricks': 70, 'azure-data-factory': 60 },
    color: '#d4a800',
    desc: 'Architecture, optimization, system design, mentoring',
  },
];

function RoleReadiness({ progress }) {
  const weightedOverall = useMemo(() => computeWeightedOverall(progress), [progress]);

  const roleScores = useMemo(() => ROLES.map(role => {
    const entries = Object.entries(role.target);
    const pct = Math.round(
      entries.reduce((sum, [id, req]) => sum + Math.min((progress[id] ?? 0) / req, 1), 0) / entries.length * 100
    );
    return { ...role, pct };
  }), [progress]);

  return (
    <div className="analytics-chart-block role-readiness-panel">
      <p className="analytics-chart-label">Role Readiness</p>
      <div className="role-readiness-list">
        {roleScores.map(role => (
          <div key={role.id} className="role-readiness-row">
            <div className="role-readiness-info">
              <span className="role-readiness-name">{role.label}</span>
              <span className="role-readiness-desc">{role.desc}</span>
            </div>
            <div className="role-readiness-meter">
              <div className="role-readiness-track">
                <div className="role-readiness-fill" style={{ width: `${role.pct}%`, background: role.color }} />
              </div>
              <span className="role-readiness-pct" style={{ color: role.pct >= 80 ? role.color : 'var(--muted)' }}>
                {role.pct}%
              </span>
            </div>
          </div>
        ))}
      </div>
      <div className="role-readiness-footer">
        <span className="role-readiness-overall">Weighted skill score: <strong>{weightedOverall}%</strong></span>
        <span className={`role-readiness-verdict ${weightedOverall >= 70 ? 'verdict--ready' : weightedOverall >= 40 ? 'verdict--progressing' : 'verdict--early'}`}>
          {weightedOverall >= 70 ? 'Interview ready' : weightedOverall >= 40 ? 'On track' : 'Building foundation'}
        </span>
      </div>
    </div>
  );
}

// ─── TopicMastery ─────────────────────────────────────────────────────────────

function TopicMastery({ topics, progress }) {
  const sorted = useMemo(() =>
    [...topics]
      .map(t => ({ title: t.title, pct: progress[t.id] ?? 0, done: t.completed }))
      .sort((a, b) => b.pct - a.pct),
    [topics, progress]
  );

  return (
    <div className="analytics-chart-block analytics-mastery-block">
      <p className="analytics-chart-label">Topic Mastery</p>
      <div className="analytics-mastery-list">
        {sorted.map(t => (
          <div key={t.title} className="analytics-mastery-row">
            <span className="analytics-mastery-name">{t.title}</span>
            <div className="analytics-mastery-bar">
              <div
                className="analytics-mastery-fill"
                style={{
                  width: `${t.pct}%`,
                  background: t.done ? 'var(--strong-green)' : 'linear-gradient(90deg, #2f756e, #95a85f)',
                }}
              />
            </div>
            <span className="analytics-mastery-pct" style={{ color: t.pct >= 80 ? 'var(--strong-green)' : t.pct > 0 ? 'var(--text)' : 'var(--muted)' }}>
              {t.pct}%
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── XP Level Display ─────────────────────────────────────────────────────────

function XPLevelDisplay({ xp }) {
  const level = levelFromXP(xp ?? 0);
  const xpIntoLevel = (xp ?? 0) % XP_PER_LEVEL;
  const pct = Math.round((xpIntoLevel / XP_PER_LEVEL) * 100);

  return (
    <div className="analytics-xp-level">
      <div className="analytics-xp-level-header">
        <span className="analytics-xp-level-badge">Level {level}</span>
        <span className="analytics-xp-level-total">{(xp ?? 0).toLocaleString()} XP total</span>
      </div>
      <div className="analytics-xp-progress-wrap">
        <div className="analytics-xp-progress-track">
          <div
            className="analytics-xp-progress-fill"
            style={{ width: `${pct}%` }}
            role="progressbar"
            aria-valuenow={pct}
            aria-valuemin={0}
            aria-valuemax={100}
          />
        </div>
        <span className="analytics-xp-progress-label">
          {xpIntoLevel.toLocaleString()} / {XP_PER_LEVEL.toLocaleString()} XP to Level {level + 1}
        </span>
      </div>
    </div>
  );
}

// ─── Activity Heatmap ─────────────────────────────────────────────────────────

// Returns an array of 84 day-objects going back 83 days from today (inclusive).
function buildHeatmapDays(activityLog) {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  // Build a count map keyed by YYYY-MM-DD
  const countMap = {};
  (activityLog ?? []).forEach(entry => {
    if (!entry.date) return;
    const day = entry.date.slice(0, 10);
    countMap[day] = (countMap[day] ?? 0) + 1;
  });

  const days = [];
  for (let i = 83; i >= 0; i--) {
    const d = new Date(today);
    d.setDate(today.getDate() - i);
    const iso = d.toISOString().slice(0, 10);
    days.push({
      iso,
      count: countMap[iso] ?? 0,
      dayOfWeek: d.getDay(), // 0=Sun … 6=Sat
      month: d.toLocaleString('default', { month: 'short' }),
      label: d.toLocaleDateString('default', { weekday: 'short', month: 'short', day: 'numeric' }),
    });
  }
  return days;
}

// Re-order days so Mon is row 0, Sun is row 6 (ISO week layout)
function isoWeekDay(jsDay) {
  // JS: 0=Sun, 1=Mon … 6=Sat  →  ISO: 0=Mon … 6=Sun
  return jsDay === 0 ? 6 : jsDay - 1;
}

function cellColor(count) {
  if (count === 0) return 'var(--surface-soft)';
  if (count <= 2)  return '#bbf7d0';   // light green
  if (count <= 5)  return '#4ade80';   // medium green
  return 'var(--strong-green)';
}

const DAY_LABELS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

function ActivityHeatmap({ activityLog }) {
  const [tooltip, setTooltip] = useState(null);

  const days = useMemo(() => buildHeatmapDays(activityLog), [activityLog]);

  // Group into 12 columns (weeks). Each column = 7 slots (Mon-Sun).
  // days is already in chronological order; split into chunks of 7.
  const weeks = useMemo(() => {
    const result = [];
    for (let w = 0; w < 12; w++) {
      result.push(days.slice(w * 7, w * 7 + 7));
    }
    return result;
  }, [days]);

  // Month label per column: use the month of the first day in the week
  const monthLabels = useMemo(() =>
    weeks.map(week => week[0]?.month ?? ''),
    [weeks]
  );

  // Deduplicate consecutive identical month labels so we only print each month once
  const deduped = useMemo(() =>
    monthLabels.map((m, i) => (i === 0 || m !== monthLabels[i - 1] ? m : '')),
    [monthLabels]
  );

  return (
    <div className="analytics-heatmap-block">
      <p className="analytics-chart-label">Learning Activity</p>
      <div className="analytics-heatmap-inner">
        {/* Day-of-week labels on the left */}
        <div className="heatmap-dow-labels">
          {DAY_LABELS.map(d => (
            <span key={d} className="heatmap-dow-label">{d}</span>
          ))}
        </div>

        <div className="heatmap-cols-wrap">
          {/* Month labels row */}
          <div className="heatmap-month-labels">
            {deduped.map((m, i) => (
              <span key={i} className="heatmap-month-label">{m}</span>
            ))}
          </div>

          {/* Grid: 12 columns × 7 rows */}
          <div className="analytics-heatmap-grid">
            {weeks.map((week, wi) => (
              <div key={wi} className="heatmap-week-col">
                {week.map((day, di) => (
                  <div
                    key={di}
                    className="heatmap-cell"
                    style={{ background: cellColor(day.count) }}
                    onMouseEnter={e => {
                      const rect = e.currentTarget.getBoundingClientRect();
                      setTooltip({ day, x: rect.left + rect.width / 2, y: rect.top - 8 });
                    }}
                    onMouseLeave={() => setTooltip(null)}
                    aria-label={`${day.label}: ${day.count} activit${day.count === 1 ? 'y' : 'ies'}`}
                    role="img"
                  />
                ))}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Legend */}
      <div className="heatmap-legend">
        <span className="heatmap-legend-label">Less</span>
        {[0, 1, 3, 6].map(n => (
          <span
            key={n}
            className="heatmap-cell heatmap-cell--legend"
            style={{ background: cellColor(n) }}
          />
        ))}
        <span className="heatmap-legend-label">More</span>
      </div>

      {/* Floating tooltip rendered via fixed positioning */}
      {tooltip && (
        <div
          className="heatmap-tooltip"
          style={{ left: tooltip.x, top: tooltip.y }}
          aria-hidden="true"
        >
          <strong>{tooltip.day.label}</strong>
          <span>{tooltip.day.count} activit{tooltip.day.count === 1 ? 'y' : 'ies'}</span>
        </div>
      )}

      <style>{`
        .analytics-heatmap-block {
          background: var(--surface);
          border: 1px solid var(--card-border);
          border-radius: var(--radius-md);
          padding: 1.25rem 1.5rem 1rem;
          position: relative;
          overflow: visible;
        }
        .analytics-heatmap-inner {
          display: flex;
          gap: 0.5rem;
          align-items: flex-start;
          margin-top: 0.75rem;
          overflow-x: auto;
        }
        .heatmap-dow-labels {
          display: flex;
          flex-direction: column;
          gap: 3px;
          padding-top: 20px; /* align with grid rows, offset by month label row */
          flex-shrink: 0;
        }
        .heatmap-dow-label {
          font-size: 10px;
          color: var(--muted);
          height: 12px;
          line-height: 12px;
          text-align: right;
          min-width: 24px;
        }
        .heatmap-cols-wrap {
          display: flex;
          flex-direction: column;
          gap: 3px;
          min-width: 0;
        }
        .heatmap-month-labels {
          display: flex;
          gap: 3px;
        }
        .heatmap-month-label {
          font-size: 10px;
          color: var(--muted);
          width: 12px;
          text-align: left;
          overflow: visible;
          white-space: nowrap;
        }
        .analytics-heatmap-grid {
          display: flex;
          gap: 3px;
        }
        .heatmap-week-col {
          display: flex;
          flex-direction: column;
          gap: 3px;
        }
        .heatmap-cell {
          width: 12px;
          height: 12px;
          border-radius: var(--radius-sm, 2px);
          cursor: default;
          transition: opacity 0.15s;
          flex-shrink: 0;
        }
        .heatmap-cell:hover {
          opacity: 0.8;
          outline: 1px solid var(--border);
        }
        .heatmap-cell--legend {
          cursor: default;
        }
        .heatmap-legend {
          display: flex;
          align-items: center;
          gap: 3px;
          margin-top: 0.75rem;
          justify-content: flex-end;
        }
        .heatmap-legend-label {
          font-size: 10px;
          color: var(--muted);
          margin: 0 2px;
        }
        .heatmap-tooltip {
          position: fixed;
          transform: translate(-50%, -100%);
          background: var(--surface);
          border: 1px solid var(--card-border);
          border-radius: var(--radius-sm, 4px);
          padding: 4px 8px;
          font-size: 11px;
          color: var(--text);
          box-shadow: var(--shadow-sm);
          pointer-events: none;
          z-index: 9999;
          display: flex;
          flex-direction: column;
          gap: 2px;
          white-space: nowrap;
        }

        /* XP Level Display */
        .analytics-xp-level {
          background: var(--surface);
          border: 1px solid var(--card-border);
          border-radius: var(--radius-md);
          padding: 1rem 1.25rem;
          margin-bottom: 0.75rem;
        }
        .analytics-xp-level-header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          margin-bottom: 0.5rem;
        }
        .analytics-xp-level-badge {
          font-size: 1.1rem;
          font-weight: 800;
          color: var(--heading);
          letter-spacing: -0.02em;
        }
        .analytics-xp-level-total {
          font-size: 0.8rem;
          color: var(--muted);
        }
        .analytics-xp-progress-wrap {
          display: flex;
          flex-direction: column;
          gap: 4px;
        }
        .analytics-xp-progress-track {
          height: 8px;
          background: var(--surface-soft);
          border-radius: 99px;
          overflow: hidden;
        }
        .analytics-xp-progress-fill {
          height: 100%;
          background: var(--strong-green);
          border-radius: 99px;
          transition: width 0.4s ease;
        }
        .analytics-xp-progress-label {
          font-size: 0.75rem;
          color: var(--muted);
        }

        /* Mark-as-reviewed styles for InterviewPrep cards */
        .iqc-card--reviewed {
          border-color: var(--strong-green) !important;
        }
        .iqc-reviewed-badge {
          position: absolute;
          top: 0.5rem;
          right: 0.5rem;
          background: var(--strong-green);
          color: #fff;
          border-radius: 99px;
          width: 20px;
          height: 20px;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 11px;
          font-weight: 700;
          pointer-events: none;
          z-index: 1;
        }
        .iqc-actions {
          display: flex;
          align-items: center;
          gap: 0.75rem;
          flex-wrap: wrap;
          margin-top: 0.5rem;
        }
        .iqc-reviewed-btn {
          font-size: 0.75rem;
          padding: 3px 10px;
          border-radius: var(--radius-sm);
          border: 1px solid var(--border);
          background: transparent;
          color: var(--muted);
          cursor: pointer;
          transition: background 0.15s, color 0.15s, border-color 0.15s;
          white-space: nowrap;
        }
        .iqc-reviewed-btn:hover {
          border-color: var(--strong-green);
          color: var(--strong-green);
        }
        .iqc-reviewed-btn--done {
          background: var(--strong-green);
          border-color: var(--strong-green);
          color: #fff;
        }
        .iqc-reviewed-btn--done:hover {
          opacity: 0.85;
        }
        .iqc-tags {
          display: flex;
          flex-wrap: wrap;
          gap: 4px;
          margin-bottom: 4px;
        }
        .iqc-tag {
          font-size: 0.68rem;
          padding: 2px 7px;
          border-radius: 99px;
          background: var(--surface-soft);
          color: var(--muted);
          border: 1px solid var(--border);
          letter-spacing: 0.02em;
        }
        .iqc-deep-dive {
          margin-top: 0.75rem;
          border-top: 1px solid var(--card-border);
          padding-top: 0.75rem;
        }
        .iqc-deep-dive-toggle {
          background: none;
          border: none;
          color: var(--muted);
          font-size: 0.78rem;
          cursor: pointer;
          padding: 0;
          text-decoration: underline;
          text-underline-offset: 2px;
        }
        .iqc-deep-dive-toggle:hover {
          color: var(--text);
        }
        .iqc-deep-dive-body {
          margin-top: 0.5rem;
          display: flex;
          flex-direction: column;
          gap: 0.25rem;
        }
        .iqc-deep-dive-label {
          font-size: 0.7rem;
          font-weight: 700;
          text-transform: uppercase;
          letter-spacing: 0.07em;
          color: var(--muted);
        }
        .iqc-deep-dive-text {
          font-size: 0.85rem;
          color: var(--text);
          line-height: 1.6;
          margin: 0;
        }
        .iqc-followups {
          margin-top: 0.75rem;
          border-top: 1px solid var(--card-border);
          padding-top: 0.75rem;
        }
        .iqc-followups-label {
          font-size: 0.7rem;
          font-weight: 700;
          text-transform: uppercase;
          letter-spacing: 0.07em;
          color: var(--muted);
          display: block;
          margin-bottom: 0.4rem;
        }
        .iqc-followups-list {
          margin: 0;
          padding-left: 1.1rem;
          display: flex;
          flex-direction: column;
          gap: 0.25rem;
        }
        .iqc-followup-item {
          font-size: 0.82rem;
          color: var(--text);
          line-height: 1.5;
        }

        /* Progress summary bar on InterviewPrep */
        .ipv2-progress-summary {
          display: flex;
          align-items: center;
          gap: 1rem;
          padding: 0.6rem 1rem;
          background: var(--surface);
          border: 1px solid var(--card-border);
          border-radius: var(--radius-md);
          margin-bottom: 1rem;
          flex-wrap: wrap;
        }
        .ipv2-progress-text {
          font-size: 0.85rem;
          color: var(--text);
          white-space: nowrap;
        }
        .ipv2-progress-bar-track {
          flex: 1;
          min-width: 80px;
          height: 6px;
          background: var(--surface-soft);
          border-radius: 99px;
          overflow: hidden;
        }
        .ipv2-progress-bar-fill {
          height: 100%;
          background: var(--strong-green);
          border-radius: 99px;
          transition: width 0.4s ease;
        }

        /* Mock interview deep dive / follow-ups */
        .mock-answer-note--deep {
          margin-top: 0.75rem;
        }
        .mock-followups {
          margin-top: 0.75rem;
          padding-top: 0.75rem;
          border-top: 1px solid var(--card-border);
        }
        .mock-followups-label {
          font-size: 0.7rem;
          font-weight: 700;
          text-transform: uppercase;
          letter-spacing: 0.07em;
          color: var(--muted);
          display: block;
          margin-bottom: 0.4rem;
        }
        .mock-followups-list {
          margin: 0;
          padding-left: 1.1rem;
          display: flex;
          flex-direction: column;
          gap: 0.25rem;
        }
        .mock-followup-item {
          font-size: 0.82rem;
          color: var(--text);
          line-height: 1.5;
        }
      `}</style>
    </div>
  );
}

// ─── Main Analytics Component ─────────────────────────────────────────────────

const Analytics = memo(function Analytics({
  topics,
  progress,
  practiceProgress,
  activityLog = [],
  xp,
  streak,
  learnedCount = 0,
}) {
  const storeXP = useLearningStore(s => s.xp);
  // Prefer prop xp when provided (for server/test compatibility), fall back to store
  const resolvedXP = xp ?? storeXP;

  const [activityLogLS] = useLocalStorage('dem-activity-log', []);
  // Merge prop-passed log with localStorage log (deduplicate by identity is fine — heatmap just counts)
  const mergedLog = useMemo(() => {
    const base = activityLog ?? [];
    const ls   = activityLogLS ?? [];
    return base.length > 0 ? base : ls;
  }, [activityLog, activityLogLS]);

  const today = new Date().toISOString().slice(0, 10);
  const totalTasks = Object.values(practiceProgress ?? {}).filter(Boolean).length;
  const todayTasks = mergedLog.filter(e => e.date?.startsWith(today) && e.type === 'practice').length;

  const stats = [
    { label: 'Total XP',   value: (resolvedXP ?? 0).toLocaleString(), variant: 'success' },
    { label: 'Tasks Done', value: totalTasks,           variant: 'info' },
    { label: 'Today',      value: todayTasks,           variant: 'warning' },
    { label: 'Streak',     value: `${streak}d`,         variant: 'accent' },
  ];

  return (
    <section className="section analytics-section" id="analytics">
      <SectionHeader
        eyebrow="Performance"
        title="Learning Analytics"
        badge={<Badge variant="success" size="lg">Live</Badge>}
      />

      <div className="analytics-stats-row">
        {stats.map(s => (
          <MetricCard key={s.label} label={s.label} value={s.value} variant={s.variant} className="analytics-stat-card" />
        ))}
      </div>

      {/* XP Level progress */}
      <XPLevelDisplay xp={resolvedXP} />

      <div className="analytics-grid analytics-grid--focused">
        <ReadinessScore topics={topics} practiceProgress={practiceProgress} learnedCount={learnedCount} streak={streak} />
        <RoleReadiness progress={progress} />
        <TopicMastery topics={topics} progress={progress} />
      </div>

      {/* Activity Heatmap */}
      <ActivityHeatmap activityLog={mergedLog} />
    </section>
  );
});

export default Analytics;
