import { memo, useEffect, useMemo, useRef, useState, useCallback } from 'react';
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

export const SmartBanner = memo(function SmartBanner({ allTopicsProgress, streak, onNavigate, personalizedRec }) {
  const [dismissed, setDismissed] = useLocalStorage('dem-smart-banner-dismissed', null);

  const msg = useMemo(() => {
    const h = new Date().getHours();
    const greet = h < 12 ? 'Good morning' : h < 17 ? 'Good afternoon' : 'Good evening';
    const totalDone = Object.values(allTopicsProgress ?? {}).filter(p => p > 0).length;
    const recommended = getRecommendedNext(allTopicsProgress ?? {});
    const rec = Array.isArray(recommended) ? recommended[0] : recommended;

    // Streak milestones always take priority
    if (streak === 3 || streak === 7 || streak === 14 || streak === 30) {
      const milestoneText = {
        3:  `3-day streak! Consistency beats intensity — keep the chain going.`,
        7:  `7-day streak 🔥 You're building a real habit. This is how mastery happens.`,
        14: `14-day streak! Seriously impressive. You're in the top tier of learners.`,
        30: `30 days straight. That's rare discipline — you're going to crush your interviews.`,
      }[streak];
      return { icon: '🔥', color: '#e25a1c', text: milestoneText, action: 'Keep going', section: 'topics', id: `streak-milestone-${streak}` };
    }

    // Personalised start — user has preferences and hasn't started anything yet
    if (totalDone === 0 && personalizedRec) return {
      icon: '◎',
      color: '#2f756e',
      text: `${greet}! ${personalizedRec.reason} — start here to build your foundation.`,
      action: `Start ${personalizedRec.topicLabel} →`,
      section: 'topics',
      id: `personalized-start-${personalizedRec.topicId}`,
    };

    // Generic start
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

    // Personalised next step — user has progress and we know their target role
    if (personalizedRec) return {
      icon: '→',
      color: '#6b7cdb',
      text: `${personalizedRec.reason} — ${personalizedRec.topicLabel} is your next step.`,
      action: `Open ${personalizedRec.topicLabel}`,
      section: 'topics',
      id: `personalized-${personalizedRec.topicId}`,
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
  }, [allTopicsProgress, streak, personalizedRec]);

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
        {Object.entries(checkedItems ?? {}).map(([id, done]) => {
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
  const todayTasks = (activityLog ?? []).filter(
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
    { label: 'XP',       value: (xp ?? 0).toLocaleString(), detail: 'XP earned' },
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

// Small CTA card shown when user hasn't set learning preferences yet
export const OnboardingCTA = memo(function OnboardingCTA({ onOpen }) {
  return (
    <div className="onboarding-cta">
      <div className="onboarding-cta-content">
        <span className="onboarding-cta-icon" aria-hidden="true">◎</span>
        <div>
          <p className="onboarding-cta-title">Personalise your learning path</p>
          <p className="onboarding-cta-sub">
            Tell us your target role and we'll tailor your roadmap.
          </p>
        </div>
      </div>
      <button type="button" className="onboarding-cta-btn" onClick={onOpen}>
        Set goals →
      </button>
    </div>
  );
});

// ─── Next Action Card — single recommended next step ─────────────────────────

const ACTION_CONFIG = {
  continue: { icon: '▶', eyebrow: 'Keep going',   cls: 'nac--continue' },
  start:    { icon: '◎', eyebrow: 'Start here',   cls: 'nac--start'    },
  master:   { icon: '⭐', eyebrow: 'Level up',     cls: 'nac--master'   },
  complete: { icon: '✓', eyebrow: 'Path complete', cls: 'nac--complete' },
};

export const NextActionCard = memo(function NextActionCard({ nextAction, onNavigate }) {
  if (!nextAction) return null;
  const cfg = ACTION_CONFIG[nextAction.type] ?? ACTION_CONFIG.start;
  return (
    <div className={`next-action-card ${cfg.cls}`}>
      <span className="nac-icon" aria-hidden="true">{cfg.icon}</span>
      <div className="nac-body">
        <p className="eyebrow">{cfg.eyebrow}</p>
        <strong className="nac-action">{nextAction.action}</strong>
        <p className="nac-detail">{nextAction.detail}</p>
      </div>
      {nextAction.topicId && (
        <button
          type="button"
          className="nac-btn"
          onClick={() => onNavigate?.(nextAction.topicId)}
        >
          Go →
        </button>
      )}
    </div>
  );
});

// ─── Start Here card — shown to first-time users ────────────────────────────

export const StartHereCard = memo(function StartHereCard({ onStart }) {
  const [dismissed, setDismissed] = useLocalStorage('dem-start-here-dismissed', false);
  if (dismissed) return null;

  const skills = ['SQL', 'Python', 'PySpark', 'Azure / AWS', 'AI Tools'];
  return (
    <section className="start-here-card ds-card">
      <div className="start-here-body">
        <div className="start-here-top">
          <span className="start-here-badge">Welcome</span>
          <h2>Become a Data Engineer</h2>
          <p>
            Data Engineers build the pipelines that move, clean, and transform data so analysts
            and data scientists can use it. Every major tech company hires them — and demand is
            growing fast.
          </p>
        </div>

        <div className="start-here-what">
          <p className="eyebrow">Skills you'll learn</p>
          <div className="start-here-skills">
            {skills.map((s, i) => (
              <span key={s} className="start-here-skill">
                <span className="start-here-skill-num">{i + 1}</span>
                {s}
              </span>
            ))}
          </div>
        </div>

        <div className="start-here-time">
          <span className="start-here-time-icon" aria-hidden="true">◎</span>
          <p>
            <strong>Estimated path: 3–6 months</strong> of consistent daily practice.
            Follow the numbered steps — each skill builds on the last.
          </p>
        </div>
      </div>

      <div className="start-here-actions">
        <button
          type="button"
          className="start-here-cta"
          onClick={() => { setDismissed(true); onStart?.(); }}
        >
          Start with SQL — Step 1 →
        </button>
        <button
          type="button"
          className="start-here-skip"
          onClick={() => setDismissed(true)}
        >
          I already know the basics
        </button>
      </div>
    </section>
  );
});

// ─── Dynamic daily goal card ──────────────────────────────────────────────────

function generateDailyGoals(enrichedTopics) {
  const today    = new Date().toISOString().slice(0, 10);
  const inProg   = enrichedTopics.filter(t => t.inProgress);
  const completed = enrichedTopics.filter(t => t.completed);
  const todo     = enrichedTopics.filter(t => !t.completed && !t.inProgress);

  const current  = inProg[0] || todo[0];
  const goals    = [];

  if (current && !current.completed) {
    goals.push({
      id: `study-${today}-${current.id}`,
      label: `Study ${current.title}`,
      detail: 'Open one section and work through it',
    });
    goals.push({
      id: `practice-${today}-${current.id}`,
      label: 'Complete a practice task',
      detail: `From ${current.title}`,
    });
  }

  if (completed.length > 0) {
    const rev = completed[completed.length - 1];
    goals.push({
      id: `review-${today}-${rev.id}`,
      label: `Review ${rev.title} Q&A`,
      detail: 'Reinforce what you already know',
    });
  }

  if (todo.length > 0 && goals.length < 3) {
    const next = todo[0];
    goals.push({
      id: `preview-${today}-${next.id}`,
      label: `Preview ${next.title}`,
      detail: "See what's coming up next",
    });
  }

  if (goals.length === 0) {
    goals.push(
      { id: `start-${today}`, label: 'Open SQL — your first step',     detail: 'Read the overview and Q&A' },
      { id: `read-${today}`,  label: 'Explore the career path',         detail: 'Understand the full journey' },
      { id: `goal-${today}`,  label: 'Mark your first practice task',   detail: 'Small wins build momentum' },
    );
  }

  return goals.slice(0, 4);
}

export const DailyGoalCard = memo(function DailyGoalCard({ enrichedTopics }) {
  const today    = new Date().toISOString().slice(0, 10);
  const goals    = useMemo(() => generateDailyGoals(enrichedTopics ?? []), [enrichedTopics]);
  const [state, setState] = useLocalStorage('dem-daily-goal-state', {});
  const todayState = (state ?? {})[today] ?? {};

  const toggleGoal = useCallback(id => {
    setState(prev => {
      const s = prev ?? {};
      return { ...s, [today]: { ...(s[today] ?? {}), [id]: !s[today]?.[id] } };
    });
  }, [setState, today]);

  const doneCount = goals.filter(g => todayState[g.id]).length;
  const allDone   = doneCount === goals.length;

  return (
    <section className="card daily-goal-card">
      <div className="daily-goal-header">
        <div>
          <p className="eyebrow">Today's Focus</p>
          <h2>{allDone ? 'Day complete!' : 'Daily Goals'}</h2>
        </div>
        <span className="daily-goal-count">{doneCount}/{goals.length}</span>
      </div>
      {allDone && (
        <p className="daily-goal-celebrate">Great work — consistency is how skills are built. See you tomorrow.</p>
      )}
      <ul className="daily-goal-list" role="list">
        {goals.map(g => {
          const done = !!todayState[g.id];
          return (
            <li key={g.id} className={`daily-goal-item${done ? ' daily-goal-item--done' : ''}`}>
              <button
                type="button"
                className={`daily-goal-check${done ? ' daily-goal-check--done' : ''}`}
                onClick={() => toggleGoal(g.id)}
                aria-label={done ? `Unmark: ${g.label}` : `Mark done: ${g.label}`}
              >
                {done ? '✓' : ''}
              </button>
              <div className="daily-goal-text">
                <span className="daily-goal-label">{g.label}</span>
                <span className="daily-goal-detail">{g.detail}</span>
              </div>
            </li>
          );
        })}
      </ul>
    </section>
  );
});

// ─── Weekly progress bar chart ────────────────────────────────────────────────

const DAY_LABELS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

export const WeeklyProgress = memo(function WeeklyProgress({ activityLog }) {
  const today = new Date();
  const days  = Array.from({ length: 7 }, (_, i) => {
    const d = new Date(today);
    d.setDate(today.getDate() - (6 - i));
    return d.toISOString().slice(0, 10);
  });

  const actByDay = useMemo(() => {
    const map = {};
    (activityLog ?? []).forEach(e => {
      const day = e.date?.slice(0, 10);
      if (day) map[day] = (map[day] || 0) + 1;
    });
    return map;
  }, [activityLog]);

  const maxAct    = Math.max(...days.map(d => actByDay[d] || 0), 1);
  const activeCount = days.filter(d => actByDay[d] > 0).length;
  const todayKey  = today.toISOString().slice(0, 10);

  const encouragement = activeCount === 0
    ? 'Start today — even one task builds the habit.'
    : activeCount < 3
      ? `${activeCount} active day${activeCount > 1 ? 's' : ''} this week. A little every day adds up fast.`
      : activeCount < 6
        ? `${activeCount} days active — solid consistency. Keep pushing.`
        : 'Perfect week! Consistency at this level builds real expertise.';

  return (
    <section className="card weekly-progress-card">
      <div className="weekly-progress-header">
        <div>
          <p className="eyebrow">This Week</p>
          <h2>{activeCount}/7 active days</h2>
        </div>
      </div>
      <div className="weekly-bars" aria-label="Activity last 7 days" role="img">
        {days.map((day, i) => {
          const count = actByDay[day] || 0;
          const heightPct = count > 0 ? Math.max(18, Math.round((count / maxAct) * 64)) : 4;
          const isToday = day === todayKey;
          return (
            <div key={day} className={`weekly-bar-col${isToday ? ' weekly-bar-col--today' : ''}`} title={`${DAY_LABELS[i]}: ${count} task${count !== 1 ? 's' : ''}`}>
              <div className="weekly-bar-track">
                <div
                  className={`weekly-bar-fill${count > 0 ? ' weekly-bar-fill--active' : ''}`}
                  style={{ height: `${heightPct}px` }}
                />
              </div>
              <span className="weekly-bar-label">{DAY_LABELS[i].slice(0, 1)}</span>
            </div>
          );
        })}
      </div>
      <p className="weekly-encourage">{encouragement}</p>
    </section>
  );
});

// ─── Career path track — 9-step visual journey ───────────────────────────────

const PATH_STEPS = [
  { id: 'sql',                   label: 'SQL',        step: 1, topicId: 'sql'                   },
  { id: 'python',                label: 'Python',     step: 2, topicId: 'python'                },
  { id: 'pyspark',               label: 'PySpark',    step: 3, topicId: 'pyspark'               },
  { id: 'azure-data-factory',    label: 'ADF',        step: 4, topicId: 'azure-data-factory'    },
  { id: 'azure-databricks',      label: 'Databricks', step: 5, topicId: 'azure-databricks'      },
  { id: 'aws-glue',              label: 'AWS Glue',   step: 6, topicId: 'aws-glue'              },
  { id: 'ai-for-data-engineers', label: 'AI / DE',    step: 7, topicId: 'ai-for-data-engineers' },
  { id: 'projects',              label: 'Projects',   step: 8, topicId: null, section: 'projects'      },
  { id: 'interview-prep',        label: 'Interview',  step: 9, topicId: null, section: 'interview-prep' },
];

export const CareerPathTrack = memo(function CareerPathTrack({
  topicStates, allTopicsProgress, completedTopics, learnedCount, onStepClick,
}) {
  const comp = completedTopics ?? {};
  const prog = allTopicsProgress ?? {};
  const ts   = topicStates ?? {};
  const completedCount = Object.values(comp).filter(Boolean).length;

  function getStatus(s) {
    if (s.topicId) {
      const state = ts[s.topicId]?.state;
      if (state === 'mastered' || state === 'completed') return 'done';
      if (state === 'in-progress') return 'active';
      if (state === 'available') return 'available';
      // Fallback to old logic if topicStates not yet populated
      if (comp[s.topicId]) return 'done';
      if ((prog[s.topicId] ?? 0) > 0) return 'active';
      return 'todo';
    }
    if (s.id === 'projects') {
      if (completedCount >= 3) return 'done';
      if (completedCount > 0) return 'active';
      return 'todo';
    }
    if (s.id === 'interview-prep') {
      if (learnedCount >= 20) return 'done';
      if (learnedCount > 0) return 'active';
      return 'todo';
    }
    return 'todo';
  }

  const firstActiveIdx = PATH_STEPS.findIndex(s => getStatus(s) === 'active');
  const firstTodoIdx   = PATH_STEPS.findIndex(s => getStatus(s) === 'todo');
  const currentIdx     = firstActiveIdx >= 0 ? firstActiveIdx : firstTodoIdx;

  const items = PATH_STEPS.flatMap((s, i) => {
    const status = getStatus(s);
    const isCurrent = i === currentIdx;
    const prevDone = i > 0 && getStatus(PATH_STEPS[i - 1]) === 'done';
    const connClass = `career-path-conn${prevDone ? ' career-path-conn--done' : ''}`;
    const elems = [];
    if (i > 0) elems.push(<div key={`conn-${i}`} className={connClass} aria-hidden="true" />);
    const masteryPct = s.topicId ? (ts[s.topicId]?.masteryPct ?? 0) : 0;
    elems.push(
      <button
        key={s.id}
        type="button"
        className={[
          'career-path-step',
          `career-path-step--${status}`,
          isCurrent ? 'career-path-step--current' : '',
        ].filter(Boolean).join(' ')}
        onClick={() => onStepClick?.(s.topicId, s.section)}
        aria-label={`Step ${s.step}: ${s.label} — ${status}`}
        title={`${s.label}${masteryPct > 0 ? ` (${masteryPct}% mastered)` : ''}`}
      >
        <span className="career-path-num">
          {status === 'done' ? '✓' : s.step}
        </span>
        <span className="career-path-label">{s.label}</span>
        {masteryPct > 0 && status !== 'done' && (
          <span className="career-path-mastery">{masteryPct}%</span>
        )}
      </button>
    );
    return elems;
  });

  return (
    <section className="career-path-track ds-card">
      <div className="career-path-header">
        <div>
          <p className="eyebrow">Start Here</p>
          <h2>Your Data Engineering Path</h2>
        </div>
        <span className="career-path-progress-label">
          {completedCount}/{PATH_STEPS.filter(s => s.topicId).length} topics done
        </span>
      </div>
      <div className="career-path-steps" role="list" aria-label="Career path steps">
        {items}
      </div>
    </section>
  );
});

// ─── Job readiness checklist ──────────────────────────────────────────────────

const READINESS_ITEMS = [
  { id: 'sql',      label: 'SQL',     icon: '▣', topicIds: ['sql'],                          desc: 'Query, join, window functions' },
  { id: 'python',   label: 'Python',  icon: '⌥', topicIds: ['python'],                       desc: 'ETL scripts, APIs, automation' },
  { id: 'spark',    label: 'Spark',   icon: '◈', topicIds: ['pyspark'],                      desc: 'Large-scale data processing' },
  { id: 'cloud',    label: 'Cloud',   icon: '☁', topicIds: ['azure-data-factory', 'azure-databricks', 'aws-glue'], desc: 'ADF, Databricks, AWS Glue' },
  { id: 'projects', label: 'Projects',icon: '▤', topicIds: null,                             desc: 'Portfolio-ready work' },
  { id: 'interview',label: 'Interview',icon: '◉', topicIds: null,                            desc: 'Q&A, scenarios, answers' },
];

function readinessPct(item, ts, comp, completedCount, learnedCount) {
  // Use mastery % from topic states (more granular than section-level progress)
  if (item.topicIds && item.topicIds.length === 1) {
    const id = item.topicIds[0];
    const state = ts[id]?.state;
    if (state === 'mastered')   return 100;
    if (state === 'completed')  return Math.max(70, ts[id]?.masteryPct ?? 0);
    return ts[id]?.masteryPct ?? 0;
  }
  if (item.topicIds && item.topicIds.length > 1) {
    const vals = item.topicIds.map(id => {
      const state = ts[id]?.state;
      if (state === 'mastered')  return 100;
      if (state === 'completed') return Math.max(70, ts[id]?.masteryPct ?? 0);
      return ts[id]?.masteryPct ?? 0;
    });
    return Math.max(...vals);
  }
  if (item.id === 'projects') return Math.min(100, Math.round((completedCount / 3) * 100));
  if (item.id === 'interview') return Math.min(100, Math.round((learnedCount / 20) * 100));
  return 0;
}

function readinessLabel(pct) {
  if (pct >= 80) return { text: 'Ready',    cls: 'readiness--ready'    };
  if (pct >= 30) return { text: 'Building', cls: 'readiness--building' };
  if (pct > 0)   return { text: 'Started',  cls: 'readiness--started'  };
  return           { text: 'Not started', cls: 'readiness--todo'      };
}

export const JobReadinessChecklist = memo(function JobReadinessChecklist({
  topicStates, completedTopics, learnedCount, overallReadiness,
}) {
  const ts   = topicStates ?? {};
  const comp = completedTopics ?? {};
  const completedCount = Object.values(comp).filter(Boolean).length;
  const readyCount = READINESS_ITEMS.filter(item =>
    readinessPct(item, ts, comp, completedCount, learnedCount) >= 80
  ).length;

  return (
    <section className="job-readiness ds-card">
      <div className="job-readiness-header">
        <div>
          <p className="eyebrow">Job Readiness</p>
          <h2>Are You Ready to Apply?</h2>
        </div>
        <div className="readiness-overall">
          <span className="readiness-overall-pct">{overallReadiness ?? 0}%</span>
          <span className="career-path-progress-label">{readyCount}/{READINESS_ITEMS.length} ready</span>
        </div>
      </div>
      <div className="readiness-grid">
        {READINESS_ITEMS.map(item => {
          const pct = readinessPct(item, ts, comp, completedCount, learnedCount);
          const { text, cls } = readinessLabel(pct);
          return (
            <div key={item.id} className={`readiness-item ${cls}`}>
              <div className="readiness-item-head">
                <span className="readiness-icon" aria-hidden="true">{item.icon}</span>
                <div>
                  <span className="readiness-name">{item.label}</span>
                  <span className="readiness-desc">{item.desc}</span>
                </div>
                <span className={`readiness-badge readiness-badge--${cls.replace('readiness--', '')}`}>{text}</span>
              </div>
              <div className="readiness-bar">
                <div className="readiness-fill" style={{ width: `${pct}%` }} />
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
});
