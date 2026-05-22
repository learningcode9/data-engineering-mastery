import { memo, useMemo } from 'react';
import { computeWeightedOverall } from '../../data/skillGraph.js';
import { Badge, MetricCard, SectionHeader } from '../ui/design-system.jsx';

// ─── ReadinessScore ───────────────────────────────────────────────────────────

function ReadinessScore({ topics, practiceProgress, learnedCount, streak }) {
  const score = useMemo(() => {
    const done = Object.values(practiceProgress ?? {}).filter(Boolean).length;
    const comp = topics.filter(t => t.completed).length;
    return Math.round(
      Math.min((comp / topics.length) * 30, 30) +
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
    { label: 'Topics',    val: Math.round(Math.min((topics.filter(t => t.completed).length / topics.length) * 30, 30)), max: 30, color: '#2f756e' },
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
  const today = new Date().toISOString().slice(0, 10);
  const totalTasks = Object.values(practiceProgress ?? {}).filter(Boolean).length;
  const todayTasks = activityLog.filter(e => e.date?.startsWith(today) && e.type === 'practice').length;

  const stats = [
    { label: 'Total XP',   value: xp.toLocaleString(), variant: 'success' },
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

      <div className="analytics-grid analytics-grid--focused">
        <ReadinessScore topics={topics} practiceProgress={practiceProgress} learnedCount={learnedCount} streak={streak} />
        <RoleReadiness progress={progress} />
        <TopicMastery topics={topics} progress={progress} />
      </div>
    </section>
  );
});

export default Analytics;
