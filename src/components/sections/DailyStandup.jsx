import { memo, useMemo } from 'react';
import { useLocalStorage } from '../../hooks/useLocalStorage.js';
import { topics } from '../../data/topics.js';
import { INCIDENTS } from '../../data/incidents.js';
import { WAR_ROOM_CATEGORIES } from '../../data/warRoomQuestions.js';

// ── Date helpers ───────────────────────────────────────────────────────────────

function dateKey(date) {
  return date.toISOString().slice(0, 10);
}

function dateKeyOffset(offsetDays) {
  const d = new Date();
  d.setDate(d.getDate() + offsetDays);
  return dateKey(d);
}

function hashString(str) {
  return str.split('').reduce((a, c) => a * 31 + c.charCodeAt(0), 0);
}

function seededPick(arr, seed) {
  if (!arr || arr.length === 0) return null;
  const idx = Math.abs(seed) % arr.length;
  return arr[idx];
}

// ── Architect challenge pool ───────────────────────────────────────────────────

const ARCHITECT_CHALLENGES = [
  {
    title: 'Real-Time Order Ingestion',
    description: 'Design a real-time order ingestion pipeline for 10k events/sec using Kafka + Databricks. Consider partitioning strategy, checkpointing, and exactly-once semantics.',
  },
  {
    title: 'Cost-Optimised Data Lake',
    description: 'Architect a cost-optimised data lake for 5TB/day with 30-day retention on Azure. Balance storage tiers, compute costs, and query performance.',
  },
  {
    title: 'CDC Pipeline to Snowflake',
    description: 'Design a CDC pipeline from PostgreSQL to Snowflake with exactly-once semantics. Address WAL retention, schema evolution, and failure recovery.',
  },
  {
    title: 'Self-Healing Data Quality Framework',
    description: 'Build a self-healing data quality framework that auto-quarantines bad rows. Define thresholds, alerting, and automated remediation steps.',
  },
  {
    title: 'Multi-Cloud Data Mesh',
    description: 'Design a multi-cloud data mesh with shared governance and team-owned domains. Cover discoverability, access control, and cross-domain data contracts.',
  },
  {
    title: 'Streaming IoT Analytics Dashboard',
    description: 'Architect a streaming analytics dashboard with <1s latency for IoT sensor data. Choose the right aggregation window, serving store, and push mechanism.',
  },
  {
    title: 'Auto-Scaling Spark Scheduler',
    description: 'Design a Spark job scheduler that auto-scales clusters based on queue depth. Define the scaling policy, cool-down periods, and cost guardrails.',
  },
];

// ── Task type metadata ─────────────────────────────────────────────────────────

const TASK_TYPE_META = {
  review:    { label: 'Review',    color: '#2f756e', bg: '#e8f5f3' },
  practice:  { label: 'Practice',  color: '#7c3aed', bg: '#f3f0ff' },
  incident:  { label: 'Incident',  color: '#dc2626', bg: '#fef2f2' },
  interview: { label: 'Interview', color: '#d97706', bg: '#fffbeb' },
  architect: { label: 'Architect', color: '#0369a1', bg: '#eff6ff' },
};

// ── Generate today's tasks ─────────────────────────────────────────────────────

function generateTasks(seed) {
  const s0 = seed;
  const s1 = seed * 37 + 1;
  const s2 = seed * 53 + 2;
  const s3 = seed * 71 + 3;
  const s4 = seed * 89 + 4;

  // 1. Review — pick a topic
  const reviewTopic = seededPick(topics, s0);

  // 2. Practice — find a topic that has practice tasks in its module
  const practiceTopics = topics.filter(t => t.module?.practice?.length > 0);
  const practiceTopic = seededPick(practiceTopics.length > 0 ? practiceTopics : topics, s1);
  const practiceTask = practiceTopic?.module?.practice
    ? seededPick(practiceTopic.module.practice, s1 + 7)
    : null;

  // 3. Incident
  const incident = seededPick(INCIDENTS, s2);

  // 4. Interview — pick category then question
  const category = seededPick(WAR_ROOM_CATEGORIES, s3);
  const question = category ? seededPick(category.questions, s3 + 13) : null;

  // 5. Architect
  const architect = seededPick(ARCHITECT_CHALLENGES, s4);

  return [
    {
      type: 'review',
      id: 'task-review',
      title: reviewTopic ? `Review: ${reviewTopic.title}` : 'Review a Topic',
      description: reviewTopic
        ? reviewTopic.overview?.[0]?.body ?? reviewTopic.body ?? `Read through the ${reviewTopic.title} topic content.`
        : 'Pick any topic from the syllabus and read its overview.',
    },
    {
      type: 'practice',
      id: 'task-practice',
      title: practiceTask
        ? `Practice: ${practiceTopic?.title} — ${practiceTask.title ?? practiceTask.id ?? 'Challenge'}`
        : `Practice: ${practiceTopic?.title ?? 'SQL'} Challenge`,
      description: practiceTask
        ? practiceTask.prompt ?? practiceTask.description ?? 'Complete the practice challenge in the Topics section.'
        : 'Open the Topics section and complete one practice challenge.',
    },
    {
      type: 'incident',
      id: 'task-incident',
      title: incident ? `Incident: ${incident.title}` : 'Investigate a Production Incident',
      description: incident
        ? incident.briefing
        : 'Open the Scenarios section and work through an on-call incident.',
    },
    {
      type: 'interview',
      id: 'task-interview',
      title: question
        ? `Interview: ${category?.label ?? 'Question'}`
        : 'Answer an Interview Question',
      description: question
        ? question.question
        : 'Open the Interview Prep section and answer one question out loud.',
    },
    {
      type: 'architect',
      id: 'task-architect',
      title: `Architect: ${architect?.title ?? 'System Design'}`,
      description: architect?.description ?? 'Design a scalable data engineering system from scratch.',
    },
  ];
}

// ── Task card ──────────────────────────────────────────────────────────────────

function TaskCard({ task, done, onToggle }) {
  const meta = TASK_TYPE_META[task.type] ?? TASK_TYPE_META.review;
  return (
    <div className={['ds-task-card', done ? 'ds-task-card--done' : ''].filter(Boolean).join(' ')}>
      <div className="ds-task-top">
        <span
          className="ds-task-badge"
          style={{ background: meta.bg, color: meta.color }}
        >
          {meta.label}
        </span>
        <button
          type="button"
          className={['ds-task-check', done ? 'ds-task-check--done' : ''].filter(Boolean).join(' ')}
          onClick={onToggle}
          aria-label={done ? `Unmark ${task.title} as done` : `Mark ${task.title} as done`}
          aria-pressed={done}
        >
          {done ? '✓' : ''}
        </button>
      </div>
      <h3 className={['ds-task-title', done ? 'ds-task-title--done' : ''].filter(Boolean).join(' ')}>
        {task.title}
      </h3>
      <p className={['ds-task-desc', done ? 'ds-task-desc--done' : ''].filter(Boolean).join(' ')}>
        {task.description}
      </p>
    </div>
  );
}

// ── Heatmap square ─────────────────────────────────────────────────────────────

function HeatmapSquare({ dateStr, completion, total }) {
  const label = dateStr === dateKey(new Date()) ? 'Today' : dateStr;
  let bg = '#e5e7eb';
  if (completion >= total && total > 0) bg = '#2f756e';
  else if (completion > 0) bg = '#d97706';

  const title = `${label}: ${completion}/${total} tasks`;
  return (
    <span
      className="ds-heat-square"
      style={{ background: bg }}
      title={title}
      aria-label={title}
    />
  );
}

// ── Main component ─────────────────────────────────────────────────────────────

export const DailyStandup = memo(function DailyStandup() {
  const today = useMemo(() => new Date(), []);
  const todayKey = dateKey(today);
  const yesterdayKey = dateKeyOffset(-1);

  // Stable daily seed from date string
  const dailySeed = useMemo(() => hashString(today.toDateString()), [today]);

  // Generate tasks (memoised — stable for the day)
  const tasks = useMemo(() => generateTasks(dailySeed), [dailySeed]);

  // Completion stored per day
  const [completion, setCompletion] = useLocalStorage(`dem-standup-${todayKey}`, {});
  // Yesterday's completion
  const [yesterdayCompletion] = useLocalStorage(`dem-standup-${yesterdayKey}`, {});

  const doneCount = tasks.filter(t => !!completion[t.id]).length;
  const allDone   = doneCount === tasks.length;

  function toggleTask(taskId) {
    setCompletion(prev => ({ ...prev, [taskId]: !prev[taskId] }));
  }

  // Heatmap for past 7 days (today + 6 days back)
  const heatmapDays = useMemo(() => {
    return Array.from({ length: 7 }, (_, i) => {
      const key = i === 6 ? todayKey : dateKeyOffset(i - 6);
      const stored = (() => {
        try {
          const raw = localStorage.getItem(`dem-standup-${key}`);
          return raw ? JSON.parse(raw) : {};
        } catch {
          return {};
        }
      })();
      const count = Object.values(stored).filter(Boolean).length;
      return { dateStr: key, completion: count, total: 5 };
    });
  }, [todayKey]);

  const yesterdayDoneCount = Object.values(yesterdayCompletion ?? {}).filter(Boolean).length;

  const formattedDate = today.toLocaleDateString(undefined, {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
  });

  const progressPct = Math.round((doneCount / tasks.length) * 100);

  return (
    <section id="standup" className="section">
      <div className="ds-header">
        <h2 className="ds-heading">Daily Engineering Standup</h2>
        <p className="ds-subtitle">5 focused tasks generated fresh each day.</p>
      </div>

      <div className="ds-date-row">
        <span className="ds-date">{formattedDate}</span>
        <span className="ds-yesterday-stat">
          Yesterday: {yesterdayDoneCount}/5 tasks
        </span>
      </div>

      <div className="ds-heatmap-row">
        <span className="ds-heatmap-label">7-day streak</span>
        <div className="ds-heatmap">
          {heatmapDays.map(day => (
            <HeatmapSquare
              key={day.dateStr}
              dateStr={day.dateStr}
              completion={day.completion}
              total={day.total}
            />
          ))}
        </div>
      </div>

      <div className="ds-progress-row">
        <div className="ds-progress-track">
          <div
            className="ds-progress-fill"
            style={{ width: `${progressPct}%` }}
          />
        </div>
        <span className="ds-progress-label">{doneCount}/5 tasks complete</span>
      </div>

      {allDone && (
        <div className="ds-complete-banner" role="status">
          <span className="ds-complete-icon" aria-hidden="true">🎉</span>
          <div>
            <strong>Day Complete!</strong>
            <p>You finished all 5 tasks today. Outstanding work — see you tomorrow.</p>
          </div>
        </div>
      )}

      <div className="ds-task-list">
        {tasks.map(task => (
          <TaskCard
            key={task.id}
            task={task}
            done={!!completion[task.id]}
            onToggle={() => toggleTask(task.id)}
          />
        ))}
      </div>

      <style>{`
        .ds-header { margin-bottom: 20px; }
        .ds-heading { font-size: 1.5rem; font-weight: 700; color: var(--heading); margin-bottom: 6px; }
        .ds-subtitle { color: var(--muted); font-size: 0.875rem; margin: 0; }

        .ds-date-row {
          display: flex;
          align-items: center;
          justify-content: space-between;
          flex-wrap: wrap;
          gap: 8px;
          margin-bottom: 14px;
        }
        .ds-date {
          font-size: 1rem;
          font-weight: 600;
          color: var(--heading);
        }
        .ds-yesterday-stat {
          font-size: 0.8125rem;
          color: var(--muted);
          background: var(--surface-soft);
          border: 1px solid var(--border);
          border-radius: var(--radius-sm);
          padding: 3px 10px;
        }

        .ds-heatmap-row {
          display: flex;
          align-items: center;
          gap: 10px;
          margin-bottom: 18px;
        }
        .ds-heatmap-label {
          font-size: 0.75rem;
          color: var(--muted);
          white-space: nowrap;
        }
        .ds-heatmap {
          display: flex;
          gap: 5px;
        }
        .ds-heat-square {
          display: inline-block;
          width: 22px;
          height: 22px;
          border-radius: 4px;
          cursor: default;
          transition: opacity 0.15s;
        }
        .ds-heat-square:hover { opacity: 0.8; }

        .ds-progress-row {
          display: flex;
          align-items: center;
          gap: 12px;
          margin-bottom: 20px;
        }
        .ds-progress-track {
          flex: 1;
          height: 8px;
          background: var(--border);
          border-radius: 4px;
          overflow: hidden;
        }
        .ds-progress-fill {
          height: 100%;
          background: #2f756e;
          border-radius: 4px;
          transition: width 0.4s cubic-bezier(0.16, 1, 0.3, 1);
        }
        .ds-progress-label {
          font-size: 0.8125rem;
          font-weight: 600;
          color: var(--heading);
          white-space: nowrap;
        }

        .ds-complete-banner {
          display: flex;
          align-items: flex-start;
          gap: 14px;
          padding: 16px 18px;
          background: #e8f5f3;
          border: 1px solid #2f756e;
          border-radius: var(--radius-md);
          margin-bottom: 20px;
        }
        .dark-mode .ds-complete-banner { background: #0e2e2a; border-color: #2f756e; }
        .ds-complete-icon { font-size: 1.5rem; flex-shrink: 0; }
        .ds-complete-banner strong {
          display: block;
          color: #2f756e;
          font-size: 1rem;
          font-weight: 700;
          margin-bottom: 4px;
        }
        .dark-mode .ds-complete-banner strong { color: #5bb8ac; }
        .ds-complete-banner p {
          margin: 0;
          font-size: 0.875rem;
          color: var(--text);
        }

        .ds-task-list {
          display: flex;
          flex-direction: column;
          gap: 12px;
        }

        .ds-task-card {
          background: var(--surface);
          border: 1px solid var(--border);
          border-radius: var(--radius-md);
          padding: 16px;
          box-shadow: var(--shadow-md);
          transition: opacity 0.2s, border-color 0.2s;
        }
        .ds-task-card--done {
          opacity: 0.7;
          border-color: #2f756e;
          background: var(--surface-soft);
        }

        .ds-task-top {
          display: flex;
          align-items: center;
          justify-content: space-between;
          margin-bottom: 8px;
        }

        .ds-task-badge {
          display: inline-block;
          padding: 2px 9px;
          border-radius: var(--radius-sm);
          font-size: 0.6875rem;
          font-weight: 700;
          text-transform: uppercase;
          letter-spacing: 0.05em;
        }

        .ds-task-check {
          width: 24px;
          height: 24px;
          border-radius: 50%;
          border: 2px solid var(--border);
          background: none;
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 0.8125rem;
          font-weight: 700;
          color: #fff;
          transition: background 0.15s, border-color 0.15s;
          flex-shrink: 0;
        }
        .ds-task-check:hover { border-color: #2f756e; }
        .ds-task-check--done {
          background: #2f756e;
          border-color: #2f756e;
        }

        .ds-task-title {
          font-size: 0.9375rem;
          font-weight: 600;
          color: var(--heading);
          margin: 0 0 6px;
          line-height: 1.35;
        }
        .ds-task-title--done {
          text-decoration: line-through;
          color: var(--muted);
        }

        .ds-task-desc {
          font-size: 0.8125rem;
          color: var(--text);
          margin: 0;
          line-height: 1.5;
          display: -webkit-box;
          -webkit-line-clamp: 3;
          -webkit-box-orient: vertical;
          overflow: hidden;
        }
        .ds-task-desc--done {
          color: var(--muted);
        }

        @media (max-width: 480px) {
          .ds-heat-square { width: 18px; height: 18px; }
        }
      `}</style>
    </section>
  );
});
