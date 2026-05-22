import { memo, useEffect, useMemo, useRef, useState } from 'react';
import { SummaryCard } from '../ui/Card.jsx';
import { ProgressBar } from '../ui/ProgressBar.jsx';
import { summaryCards } from '../../data/appData.js';
import { getRecommendedNext } from '../../data/skillGraph.js';
import { useLocalStorage } from '../../hooks/useLocalStorage.js';

function useCountUp(target, duration = 900) {
  const [display, setDisplay] = useState(0);
  const prev = useRef(0);
  useEffect(() => {
    const from = prev.current;
    const to   = typeof target === 'number' ? target : 0;
    if (from === to) return;
    prev.current = to;
    const start = performance.now();
    function tick(now) {
      const t = Math.min((now - start) / duration, 1);
      const ease = 1 - Math.pow(1 - t, 3);
      setDisplay(Math.round(from + (to - from) * ease));
      if (t < 1) requestAnimationFrame(tick);
    }
    requestAnimationFrame(tick);
  }, [target, duration]);
  return display;
}

// ─── Smart contextual banner at top of dashboard ─────────────────────────────

export const SmartBanner = memo(function SmartBanner({ allTopicsProgress, streak, onNavigate }) {
  const [dismissed, setDismissed] = useLocalStorage('dem-smart-banner-dismissed', null);

  const msg = useMemo(() => {
    const h = new Date().getHours();
    const greet = h < 12 ? 'Good morning' : h < 17 ? 'Good afternoon' : 'Good evening';
    const totalDone = Object.values(allTopicsProgress ?? {}).filter(p => p > 0).length;
    const recommended = getRecommendedNext(allTopicsProgress ?? {});
    const rec = Array.isArray(recommended) ? recommended[0] : recommended;

    // Streak milestones — each has a unique id so it re-shows at the next milestone
    if (streak === 3 || streak === 7 || streak === 14 || streak === 30) {
      const milestoneText = {
        3:  `3-day streak! Consistency beats intensity — keep the chain going.`,
        7:  `7-day streak 🔥 You're building a real habit. This is how mastery happens.`,
        14: `14-day streak! Seriously impressive. You're in the top tier of learners.`,
        30: `30 days straight. That's rare discipline — you're going to crush your interviews.`,
      }[streak];
      return { icon: '🔥', color: '#e25a1c', text: milestoneText, action: 'Keep going', section: 'topics', id: `streak-milestone-${streak}` };
    }

    if (totalDone === 0) return {
      icon: '◎',
      color: '#2f756e',
      text: `${greet}! SQL is the foundation every data engineer builds on — start here and everything else clicks faster.`,
      action: 'Start SQL →',
      section: 'topics',
      id: 'start',
    };

    if (streak === 0) return {
      icon: '🔥',
      color: '#e25a1c',
      text: 'Your streak is at zero — even one practice task today restarts the chain. Small wins compound.',
      action: 'Practice now',
      section: 'topics',
      id: 'streak-zero',
    };

    if (rec?.id && rec?.label) return {
      icon: '→',
      color: '#6b7cdb',
      text: `${rec.description ?? 'Based on your progress'} — ${rec.label} is your recommended next step.`,
      action: `Open ${rec.label}`,
      section: 'topics',
      id: `next-${rec.id}`,
    };

    return {
      icon: '→',
      color: '#2f756e',
      text: 'Start SQL — SQL is your recommended next step.',
      action: 'Start SQL →',
      section: 'topics',
      id: 'fallback-sql',
    };
  }, [allTopicsProgress, streak]);

  if (!msg || dismissed === msg.id) return null;

  return (
    <div className="smart-banner" style={{ '--banner-color': msg.color }}>
      <span className="smart-banner-icon" aria-hidden="true">{msg.icon}</span>
      <p className="smart-banner-text">{msg.text}</p>
      <div className="smart-banner-actions">
        {msg.action && (
          <button type="button" className="smart-banner-cta" onClick={() => onNavigate?.(msg.section)}>
            {msg.action}
          </button>
        )}
        <button
          type="button"
          className="smart-banner-dismiss"
          aria-label="Dismiss"
          onClick={() => setDismissed(msg.id)}
        >
          ×
        </button>
      </div>
    </div>
  );
});

export const SummaryGrid = memo(function SummaryGrid({ completedCount, totalTopics, inProgressCount = 0 }) {
  const topicsSub = completedCount === totalTopics && totalTopics > 0
    ? 'All complete!'
    : inProgressCount > 0
      ? `${inProgressCount} in progress`
      : completedCount > 0
        ? `${completedCount} complete`
        : 'Start learning';
  const cards = summaryCards.map(c =>
    c.label === 'Topics' ? { ...c, value: `${completedCount}/${totalTopics}`, sub: topicsSub } : c
  );
  return (
    <div className="summary-grid">
      {cards.map(c => (
        <SummaryCard key={c.label} {...c} />
      ))}
    </div>
  );
});

export const GamificationStats = memo(function GamificationStats({ xp, level, streak, practiceProgress }) {
  const totalTasks  = Object.values(practiceProgress ?? {}).filter(Boolean).length;
  const animXP      = useCountUp(xp);
  const animStreak  = useCountUp(streak);
  const animTasks   = useCountUp(totalTasks);
  const animLevel   = useCountUp(level);

  const pills = [
    { icon: '🔥', value: `${animStreak}d`, label: 'Streak',  color: '#e25a1c', gaining: animStreak < streak, hot: streak > 0 },
    { icon: '⭐', value: animXP.toLocaleString(), label: 'XP', color: '#2f756e', gaining: animXP < xp },
    { icon: '🏆', value: `Lv ${animLevel}`,     label: 'Level', color: '#d4a800', gaining: animLevel < level },
    { icon: '🎯', value: animTasks,              label: 'Tasks', color: '#6b7cdb', gaining: animTasks < totalTasks },
  ];

  return (
    <div className="gamification-row">
      {pills.map(p => (
        <div key={p.label}
          className={[
            'gamification-pill',
            p.gaining ? 'gamification-pill--gaining' : '',
            p.hot     ? 'gamification-pill--streak'  : '',
          ].filter(Boolean).join(' ')}
          style={{ '--pill-color': p.color }}>
          <span className="gamification-icon" aria-hidden="true">{p.icon}</span>
          <div className="gamification-text">
            <span className="gamification-value">{p.value}</span>
            <span className="gamification-label">{p.label}</span>
          </div>
        </div>
      ))}
    </div>
  );
});

export const RecentTopics = memo(function RecentTopics({ recentIds, topics, onSelectTopic }) {
  const recent = (recentIds ?? [])
    .map(id => topics.find(t => t.id === id))
    .filter(Boolean)
    .slice(0, 4);

  if (recent.length === 0) return null;

  return (
    <section className="card recent-topics-card">
      <p className="eyebrow">Recently Viewed</p>
      <div className="recent-topics-row">
        {recent.map(t => {
          const pct = parseInt(t.progress) || 0;
          return (
            <button
              key={t.id}
              type="button"
              className="recent-topic-chip"
              onClick={() => onSelectTopic(t.id)}
            >
              <span className="recent-topic-icon" aria-hidden="true">{t.label.slice(0, 2).toUpperCase()}</span>
              <div className="recent-topic-info">
                <span className="recent-topic-name">{t.title}</span>
                <ProgressBar percent={`${pct}%`} label={`${t.title} progress`} />
              </div>
              <span className="recent-topic-pct">{pct}%</span>
            </button>
          );
        })}
      </div>
    </section>
  );
});

// Netflix-style continue card
export const ContinueCard = memo(function ContinueCard({ sqlProgress, onResume }) {
  const { percent, nextSection, nextSectionIndex, total } = sqlProgress;
  const allDone = nextSection === null;
  const sectionTitle = allDone ? 'All sections complete!' : nextSection.title;
  const sectionNum   = allDone ? total : nextSectionIndex + 1;
  const remaining    = allDone ? 0 : total - nextSectionIndex;
  const minsLeft     = remaining * 15;
  const timeLabel    = minsLeft >= 60
    ? `~${Math.round(minsLeft / 60)}h left`
    : `~${minsLeft} min left`;

  const encouragement = allDone
    ? 'SQL complete — revisit before your next interview.'
    : percent >= 75
      ? `${remaining} section${remaining !== 1 ? 's' : ''} left — the finish line is close.`
      : percent >= 40
        ? 'Halfway there. Consistency is the real skill.'
        : 'Building your foundation — every section counts.';

  return (
    <section className="card continue-card">
      <div className="continue-inner">
        <div className="continue-icon" aria-hidden="true">📊</div>
        <div className="continue-body">
          <p className="eyebrow">Continue Learning</p>
          <h2 className="continue-title">SQL Mastery</h2>
          <p className="continue-subtitle">{sectionTitle}</p>
          <div className="continue-bar-row">
            <div className="continue-track">
              <div className="continue-fill" style={{ width: `${percent}%` }} />
            </div>
            <span className="continue-pct">{percent}%</span>
          </div>
          <div className="continue-meta">
            <span>Section {sectionNum}/{total}</span>
            {!allDone && <span className="continue-time">{timeLabel}</span>}
          </div>
          <p className="continue-encouragement">{encouragement}</p>
        </div>
      </div>
      <button type="button" className="continue-resume-btn" onClick={onResume}>
        {allDone ? '⟳ Review' : '▶ Resume'}
      </button>
    </section>
  );
});

export const PlanCard = memo(function PlanCard({ checkedItems, onTogglePlan }) {
  return (
    <section className="card plan-card">
      <p className="eyebrow">Daily Plan</p>
      <h2>Today's tasks</h2>
      <ul className="checklist" role="list">
        {Object.entries(checkedItems).map(([id, done]) => {
          const labels = {
            'sql-review':    'Read one topic detail',
            'practice-task': 'Finish one practice task',
            'notes':         'Write one learning note',
          };
          const label = labels[id] ?? id;
          return (
            <li key={id} className="check-item">
              <input
                type="checkbox"
                id={`plan-${id}`}
                checked={!!done}
                onChange={() => onTogglePlan(id)}
                aria-label={label}
              />
              <label htmlFor={`plan-${id}`}>{label}</label>
            </li>
          );
        })}
      </ul>
    </section>
  );
});

function formatTimeAgo(dateStr) {
  if (!dateStr) return '';
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'just now';
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  return `${Math.floor(hrs / 24)}d ago`;
}

export const ActivityFeed = memo(function ActivityFeed({ entries }) {
  if (!entries?.length) return null;

  return (
    <section className="card activity-feed-card">
      <p className="eyebrow">Recent Activity</p>
      <ul className="activity-list" role="list">
        {entries.slice(0, 6).map((e, i) => (
          <li key={i} className={`activity-item activity-item--${e.type ?? 'default'}`}>
            <span className="activity-dot" aria-hidden="true" />
            <span className="activity-text">{e.text}</span>
            {e.xp > 0 && <span className="activity-xp">+{e.xp} XP</span>}
            <span className="activity-time">{formatTimeAgo(e.date)}</span>
          </li>
        ))}
      </ul>
    </section>
  );
});

export const ProgressSummary = memo(function ProgressSummary({
  topics, progress, practiceProgress, xp, onSelectTopic, activityLog = [],
}) {
  const totalTopics = topics.length;
  const overallPct  = totalTopics > 0
    ? Math.round(Object.values(progress).reduce((a, b) => a + b, 0) / totalTopics)
    : 0;

  const completedTasks = Object.values(practiceProgress ?? {}).filter(Boolean).length;

  const today      = new Date().toISOString().slice(0, 10);
  const todayTasks = activityLog.filter(
    e => e.date?.startsWith(today) && e.type === 'practice'
  ).length;

  const strongest = topics.reduce((best, t) => {
    const pct = progress[t.id] ?? 0;
    return pct > (progress[best?.id] ?? 0) ? t : best;
  }, topics[0]);

  const nextUp = topics.find(t => {
    const pct = progress[t.id] ?? 0;
    return pct > 0 && pct < 100 && !t.completed;
  }) ?? topics.find(t => (progress[t.id] ?? 0) === 0);

  const STATS = [
    { label: 'Overall',  value: `${overallPct}%`,       detail: 'avg across topics' },
    { label: 'Tasks',    value: completedTasks,           detail: 'practice done' },
    { label: 'Today',    value: todayTasks,               detail: 'tasks today' },
    { label: 'XP',       value: xp.toLocaleString(),      detail: 'XP earned' },
  ];

  const strongestPct = progress[strongest?.id] ?? 0;

  return (
    <section className="card progress-summary-card">
      <p className="eyebrow">Your Progress</p>
      <h2>Overview</h2>

      <div className="ps-stats-row">
        {STATS.map(s => (
          <div key={s.label} className="ps-stat">
            <span className="ps-stat-value">{s.value}</span>
            <span className="ps-stat-label">{s.label}</span>
          </div>
        ))}
      </div>

      <div className="ps-highlights">
        {strongest && strongestPct > 0 && (
          <div className="ps-highlight">
            <span className="ps-hl-label">Strongest skill</span>
            <div className="ps-hl-content">
              <span className="ps-hl-name">{strongest.title}</span>
              <div className="ps-mini-bar">
                <div className="ps-mini-fill" style={{ width: `${strongestPct}%` }} />
              </div>
              <span className="ps-hl-pct">{strongestPct}%</span>
            </div>
          </div>
        )}

        {nextUp && (
          <div className="ps-highlight">
            <span className="ps-hl-label">
              {(progress[nextUp.id] ?? 0) > 0 ? 'Continue learning' : 'Start next'}
            </span>
            <div className="ps-hl-content">
              <span className="ps-hl-name">{nextUp.title}</span>
              <span className="ps-hl-sub">{nextUp.label}</span>
              <button
                type="button"
                className="ps-open-btn"
                onClick={() => onSelectTopic(nextUp.id)}
              >
                Open →
              </button>
            </div>
          </div>
        )}
      </div>
    </section>
  );
});
