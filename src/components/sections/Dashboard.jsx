import { memo, useEffect, useMemo, useRef, useState, useCallback } from 'react';
import { phases } from '../../data/phases.js';
import { SummaryCard } from '../ui/Card.jsx';
import { ProgressBar } from '../ui/ProgressBar.jsx';
import { Badge, StatPill } from '../ui/design-system.jsx';
import { summaryCards } from '../../data/appData.js';
import { beginnerJourney, getInterviewReadinessEstimate, getPhaseMentorship } from '../../data/careerGuidance.js';
import { useLocalStorage } from '../../hooks/useLocalStorage.js';
import { getStrengths, getWeakAreas } from '../../utils/learningState.js';
import {
  estimateRemainingLearningTime,
} from '../../utils/learningAnalytics.js';
import { getDashboardNextLessonAction } from '../../utils/dashboardInsights.js';
import { workplaceSimulators } from '../../data/workplaceSimulators.js';

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

export const SmartBanner = memo(function SmartBanner({
  allCompletedTopics,
  topicStates,
  topics,
  streak,
  onNavigate,
  personalizedRec,
}) {
  const [dismissed, setDismissed] = useLocalStorage('dem-smart-banner-dismissed', null);

  const msg = useMemo(() => {
    const h = new Date().getHours();
    const greet = h < 12 ? 'Good morning' : h < 17 ? 'Good afternoon' : 'Good evening';
    const startedTopics = Math.max(
      Object.values(allCompletedTopics ?? {}).filter(Boolean).length,
      (topics ?? []).filter(t =>
        ['in-progress', 'completed', 'mastered'].includes(topicStates?.[t.id]?.state)
      ).length
    );

    // Streak milestones always take priority
    if (streak === 3 || streak === 7 || streak === 14 || streak === 30) {
      const milestoneText = {
        3:  `3-day streak! Consistency beats intensity — keep the chain going.`,
        7:  `7-day streak 🔥 You're building a real habit. This is how mastery happens.`,
        14: `14-day streak! Seriously impressive. You're in the top tier of learners.`,
        30: `30 days straight. That's rare discipline — you're going to crush your interviews.`,
      }[streak];
      return { icon: '🔥', color: '#f59e0b', text: milestoneText, action: 'Keep going', section: 'topics', id: `streak-milestone-${streak}` };
    }

    // Personalised start — user has preferences and hasn't started anything yet
    if (startedTopics === 0 && personalizedRec) return {
      icon: '◎',
      color: '#2c6cf7',
      text: `${greet}! ${personalizedRec.reason} — start here to build your foundation.`,
      action: `Start ${personalizedRec.topicLabel} →`,
      section: 'topics',
      id: `personalized-start-${personalizedRec.topicId}`,
    };

    // Generic start
    if (startedTopics === 0) return {
      icon: '◎',
      color: '#2c6cf7',
      text: `${greet}! SQL is the foundation every data engineer builds on — start here and everything else clicks faster.`,
      action: 'Start SQL →',
      section: 'topics',
      id: 'start',
    };

    if (streak === 0) return {
      icon: '🔥',
      color: '#f59e0b',
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

    const nextLesson = getDashboardNextLessonAction({ topics, topicStates });
    if (nextLesson?.topicId && nextLesson?.title) return {
      icon: '→',
      color: '#2c6cf7',
      text: `${nextLesson.detail} — ${nextLesson.title} is your recommended next step.`,
      action: nextLesson.action.startsWith('Continue') ? nextLesson.action : `Open ${nextLesson.title}`,
      section: 'topics',
      id: `next-${nextLesson.topicId}`,
    };

    return {
      icon: '→',
      color: '#2c6cf7',
      text: 'Start SQL — SQL is your recommended next step.',
      action: 'Start SQL →',
      section: 'topics',
      id: 'fallback-sql',
    };
  }, [allCompletedTopics, topicStates, topics, streak, personalizedRec]);

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

export const AchievementShelf = memo(function AchievementShelf({
  achievements = [],
  totalCount = 0,
  compact = false,
}) {
  const visible = (achievements ?? []).slice(0, 4);
  const lockedCount = Math.max(0, (totalCount ?? 0) - (achievements ?? []).length);

  return (
    <section className={`card achievement-shelf-card${compact ? ' achievement-shelf-card--compact' : ''}`}>
      <div className="achievement-shelf-header">
        <div>
          <p className="eyebrow">Achievements</p>
          <h2>Badges unlocked</h2>
        </div>
        <Badge variant="muted" size="lg">{(achievements ?? []).length}/{totalCount}</Badge>
      </div>
      <div className="achievement-shelf-row">
        {visible.length > 0 ? visible.map(a => (
          <span key={a.id} className={`achievement-chip achievement-chip--${a.rarity}`}>
            <span className="achievement-chip-icon" aria-hidden="true">{a.icon}</span>
            <span className="achievement-chip-text">
              <strong>{a.name}</strong>
              {!compact && <span>{a.desc}</span>}
            </span>
          </span>
        )) : (
          <span className="achievement-chip achievement-chip--empty">
            <span className="achievement-chip-icon" aria-hidden="true">◎</span>
            <span className="achievement-chip-text">
              <strong>First badge</strong>
              {!compact && <span>Keep learning to unlock your first milestone.</span>}
            </span>
          </span>
        )}
      </div>
      {!compact && (
        <p className="achievement-shelf-note">
          {lockedCount > 0
            ? `${lockedCount} more badge${lockedCount === 1 ? '' : 's'} still locked behind your next milestones.`
            : 'Keep going to unlock the next milestone badge.'}
        </p>
      )}
    </section>
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
    { icon: '⭐', value: animXP.toLocaleString(), label: 'XP', color: '#2c6cf7', gaining: animXP < xp },
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

export const StartHereCard = memo(function StartHereCard({ onStart, onOpenGoals, completedCount = 0 }) {
  const isStarted = completedCount > 0;
  return (
    <section className="start-here-card ds-card">
      <div className="start-here-body">
        <div className="start-here-top">
          <span className="start-here-badge">{isStarted ? 'Career guide' : 'Start here'}</span>
          <h2>{isStarted ? 'Your guided path to job readiness' : 'Become a Data Engineer'}</h2>
          <p>{beginnerJourney.roleSummary}</p>
        </div>

        <div className="start-here-guide-grid">
          <div className="start-here-guide-card">
            <span>What companies use</span>
            <p>{beginnerJourney.companyTools.slice(0, 5).join(', ')}</p>
          </div>
          <div className="start-here-guide-card">
            <span>How interviews work</span>
            <p>{beginnerJourney.interviewFocus.slice(0, 4).join(', ')}</p>
          </div>
          <div className="start-here-guide-card">
            <span>Recommended first topic</span>
            <p>Start with SQL. It is the foundation of interviews, dashboards, pipelines, and debugging.</p>
          </div>
        </div>

        <div className="start-here-time">
          <span className="start-here-time-icon" aria-hidden="true">◎</span>
          <p>
            <strong>Estimated path: 4-6 months for most beginners.</strong>{' '}
            {beginnerJourney.reassurance}
          </p>
        </div>
      </div>

      <div className="start-here-actions">
        <button
          type="button"
          className="start-here-cta"
          onClick={onStart}
        >
          Start Your Journey →
        </button>
        <button
          type="button"
          className="start-here-skip"
          onClick={onOpenGoals}
        >
          Personalise path
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
  topicStates, allTopicsProgress, completedTopics, learnedCount, totalTopics, phases, topics, onStepClick,
}) {
  const comp = completedTopics ?? {};
  const prog = allTopicsProgress ?? {};
  const ts   = topicStates ?? {};
  const completedCount = Object.values(comp).filter(Boolean).length;
  const pathSteps = (phases?.length ? phases : []).map((phase, idx) => ({
    id: phase.id,
    label: phase.title,
    step: idx + 1,
    section: 'topics',
    topicIds: phase.topicIds ?? [],
  }));
  const steps = pathSteps.length ? pathSteps : PATH_STEPS;

  function getStatus(s) {
    if (s.topicIds?.length) {
      const states = s.topicIds.map(id => ts[id]?.state);
      if (states.length && states.every(state => state === 'mastered' || state === 'completed')) return 'done';
      if (states.some(state => state === 'in-progress')) return 'active';
      if (states.some(state => state === 'available')) return 'available';
      return 'todo';
    }
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

  function getTargetTopicId(step) {
    if (step.topicId) return step.topicId;
    if (!step.topicIds?.length) return null;
    return step.topicIds.find(id => ['in-progress', 'available'].includes(ts[id]?.state))
      ?? step.topicIds.find(id => !comp[id])
      ?? step.topicIds[0];
  }

  const firstActiveIdx = steps.findIndex(s => getStatus(s) === 'active');
  const firstTodoIdx   = steps.findIndex(s => ['available', 'todo'].includes(getStatus(s)));
  const currentIdx     = firstActiveIdx >= 0 ? firstActiveIdx : firstTodoIdx;
  const currentStep    = currentIdx >= 0 ? steps[currentIdx] : steps[steps.length - 1];
  const currentPhase   = phases?.find(p => p.id === currentStep?.id);
  const currentMentor  = currentPhase ? getPhaseMentorship(currentPhase.id) : null;

  const items = steps.flatMap((s, i) => {
    const status = getStatus(s);
    const isCurrent = i === currentIdx;
    const prevDone = i > 0 && getStatus(steps[i - 1]) === 'done';
    const connClass = `career-path-conn${prevDone ? ' career-path-conn--done' : ''}`;
    const elems = [];
    if (i > 0) elems.push(<div key={`conn-${i}`} className={connClass} aria-hidden="true" />);
    const phaseMastery = s.topicIds?.length
      ? Math.round(s.topicIds.reduce((sum, id) => sum + (ts[id]?.masteryPct ?? 0), 0) / s.topicIds.length)
      : 0;
    const masteryPct = s.topicId ? (ts[s.topicId]?.masteryPct ?? 0) : phaseMastery;
    const targetTopicId = getTargetTopicId(s);
    elems.push(
      <button
        key={s.id}
        type="button"
        className={[
          'career-path-step',
          `career-path-step--${status}`,
          isCurrent ? 'career-path-step--current' : '',
        ].filter(Boolean).join(' ')}
        onClick={() => onStepClick?.(targetTopicId, s.section)}
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
          <p className="eyebrow">Guided Roadmap</p>
          <h2>Your Data Engineering Journey</h2>
        </div>
        <span className="career-path-progress-label">
          {completedCount}/{totalTopics ?? topics?.length ?? PATH_STEPS.filter(s => s.topicId).length} topics done
        </span>
      </div>
      {currentMentor && (
        <div className="career-phase-mentor">
          <span className="career-phase-label">Current phase</span>
          <strong>{currentPhase.title}</strong>
          <p>{currentMentor.why}</p>
          <div className="career-phase-meta">
            <span>{currentMentor.timeline}</span>
            <span>{currentMentor.difficulty}</span>
            <span>{currentMentor.jobs}</span>
          </div>
        </div>
      )}
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
  topicStates, completedTopics, learnedCount, overallReadiness, topics,
}) {
  const ts   = topicStates ?? {};
  const comp = completedTopics ?? {};
  const completedCount = Object.values(comp).filter(Boolean).length;
  const readyCount = READINESS_ITEMS.filter(item =>
    readinessPct(item, ts, comp, completedCount, learnedCount) >= 80
  ).length;
  const strengths = getStrengths(topics ?? [], ts);
  const weakAreas = getWeakAreas(topics ?? [], ts);
  const estimate = getInterviewReadinessEstimate(overallReadiness ?? 0);

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
      <div className="readiness-mentor-row">
        <div className="readiness-mentor-card">
          <span>Interview readiness estimate</span>
          <p>{estimate}</p>
        </div>
        <div className="readiness-mentor-card">
          <span>Strongest skills</span>
          <p>{strengths.length ? strengths.map(t => t.title).join(', ') : 'No strong skill yet. SQL will become your first confidence anchor.'}</p>
        </div>
        <div className="readiness-mentor-card">
          <span>Weak areas to focus</span>
          <p>{weakAreas.length ? weakAreas.map(t => t.title).join(', ') : 'Move into interview practice and project storytelling.'}</p>
        </div>
      </div>
    </section>
  );
});

export const BecomeJobReadyPanel = memo(function BecomeJobReadyPanel({ onNavigate }) {
  const stages = [
    { title: '1. Learn foundations', body: 'SQL, Python, Linux, Git, and modeling make the rest easier.', section: 'topics' },
    { title: '2. Build pipelines', body: 'Practice batch, incremental loads, CDC, quality checks, and cloud orchestration.', section: 'topics' },
    { title: '3. Prove with projects', body: 'Use portfolio projects to show real-world architecture and trade-offs.', section: 'projects' },
    { title: '4. Prepare interviews', body: 'Review SQL, Spark, system design, incidents, and your project stories.', section: 'interview-prep' },
  ];
  return (
    <section className="become-ready-panel ds-card">
      <div className="become-ready-header">
        <div>
          <p className="eyebrow">Career accelerator</p>
          <h2>How to Become a Data Engineer</h2>
          <p>Follow this sequence to turn learning into job-ready proof: skills, projects, resume stories, and mock interviews.</p>
        </div>
      </div>
      <div className="become-ready-grid">
        {stages.map(stage => (
          <button key={stage.title} type="button" className="become-ready-step" onClick={() => onNavigate?.(stage.section)}>
            <strong>{stage.title}</strong>
            <span>{stage.body}</span>
          </button>
        ))}
      </div>
    </section>
  );
});

// ─── Section Preview Grid — lightweight cards linking to dedicated pages ───────
const SECTION_PREVIEWS = [
  {
    id: 'topics',
    page: 'topics',
    icon: '▦',
    title: 'Learning Path',
    body: 'Continue the guided roadmap from SQL basics to senior Azure topics.',
    cta: 'Open Learning Path',
    color: '#3b82f6',
  },
  {
    id: 'sql-lab',
    page: 'sql-lab',
    icon: '▤',
    title: 'SQL Lab',
    body: 'Practice joins, CTEs, windows, and optimization in the SQL editor.',
    cta: 'Open SQL Lab',
    color: '#6b7cdb',
  },
  {
    id: 'projects',
    page: 'projects',
    icon: '▣',
    title: 'Real-World Projects',
    body: 'Work through portfolio projects that mirror real Azure delivery work.',
    cta: 'View Projects',
    color: '#14b8a6',
  },
  {
    id: 'interview-prep',
    page: 'interview-prep',
    icon: '◌',
    title: 'Mock Interview Simulator',
    body: 'Practice realistic SQL, ADF, Spark, CDC, Synapse, and design questions.',
    cta: 'Open Interview Prep',
    color: '#f59e0b',
  },
  {
    id: 'resume-story-builder',
    page: 'interview-prep',
    icon: '✎',
    title: 'Resume & Story Builder',
    body: 'Turn projects and labs into resume bullets, STAR stories, and interview-ready explanations.',
    cta: 'Open Story Builder',
    color: '#2c6cf7',
  },
  {
    id: 'ai-learning',
    page: 'ai-learning',
    icon: '✦',
    title: 'AI Coach',
    body: 'Use AI to accelerate your data engineering work and interview prep.',
    cta: 'Open AI Coach',
    color: '#38bdf8',
  },
];

export const SectionPreviewGrid = memo(function SectionPreviewGrid({ onNavigate }) {
  return (
    <section className="section-preview-section">
      <div className="section-title-row" style={{ marginBottom: 16 }}>
        <div>
          <p className="eyebrow">Quick Access</p>
          <h2>Open the workspaces</h2>
        </div>
      </div>
      <div className="section-preview-grid">
        {SECTION_PREVIEWS.map(item => (
          <button
            key={item.id}
            type="button"
            className="section-preview-card ds-card ds-card--interactive"
            style={{ '--preview-color': item.color }}
            onClick={() => onNavigate?.(item.page ?? item.id)}
          >
            <span className="section-preview-icon" aria-hidden="true">{item.icon}</span>
            <div className="section-preview-copy">
              <strong>{item.title}</strong>
              <p>{item.body}</p>
            </div>
            <span className="section-preview-cta">{item.cta} →</span>
          </button>
        ))}
      </div>
    </section>
  );
});

// ─── New Dashboard: Hero Current Focus ────────────────────────────────────────

export const DashboardHero = memo(function DashboardHero({ sqlProgress, onResume, onNavigate }) {
  const { percent, nextSection, nextSectionIndex, total } = sqlProgress;
  const allDone = nextSection === null;
  const sectionTitle = allDone ? 'All sections complete!' : nextSection?.title ?? '';
  const sectionNum = allDone ? total : (nextSectionIndex ?? 0) + 1;
  const remaining = allDone ? 0 : total - (nextSectionIndex ?? 0);
  const minsLeft = remaining * 18;
  const timeLabel = minsLeft >= 60
    ? `~${Math.round(minsLeft / 60)}h left in this section`
    : `~${minsLeft} min left in this section`;
  const hour = new Date().getHours();
  const greeting = hour < 12 ? 'Good morning' : hour < 17 ? 'Good afternoon' : 'Good evening';

  return (
    <section className="dash-hero">
      <div className="dash-hero-focus">
        <p className="eyebrow" style={{ marginBottom: 10 }}>Welcome back</p>
        <div className="dash-hero-body">

          <div className="dash-hero-icon-wrap" aria-hidden="true">📊</div>
          <div className="dash-hero-content">
            <h2 className="dash-hero-title">{greeting}, Data Engineer!</h2>
            <p className="dash-hero-meta">SQL Mastery · Section {sectionNum}/{total}</p>
            {!allDone && <p className="dash-hero-current-label">{sectionTitle}</p>}
            <div className="dash-hero-bar-row">
              <div className="dash-hero-track">
                <div className="dash-hero-fill" style={{ width: `${percent}%` }} />
              </div>
              <span className="dash-hero-pct">{percent}%</span>
            </div>
            <p className="dash-hero-time">
              <span aria-hidden="true">⏱</span> {allDone ? 'All complete!' : timeLabel}
            </p>
          </div>
        </div>
        <div className="dash-hero-actions">
          <button type="button" className="btn-primary" onClick={onResume}>
            Continue Learning →
          </button>
          <button type="button" className="btn-secondary" onClick={() => onNavigate?.('topics')}>
            Open Learning Path
          </button>
        </div>
      </div>
    </section>
  );
});

// ─── Progress Overview card ───────────────────────────────────────────────────

const CORE_PHASES = phases.filter(p =>
  ['foundation', 'pipeline', 'big-data', 'cloud', 'streaming', 'production', 'career'].includes(p.id)
);

const COMPACT_SKILL_LABELS = {
  'SQL Mastery': 'SQL',
  'SQL Fundamentals': 'SQL',
  'Advanced SQL': 'SQL',
  'Python for Data Engineering': 'Python',
  'Data Warehousing & Data Modeling': 'Modeling',
  'Azure Data Factory': 'ADF',
  'Azure Databricks': 'Databricks',
  'AWS Glue': 'Glue',
  'SCD Type 2': 'SCD2',
  'CDC & SCD2': 'CDC',
  'CI/CD for Azure Data Engineering': 'CI/CD',
  'Streaming & Kafka Engineering': 'Streaming',
  'Synapse / Fabric': 'Synapse',
  'Synapse Analytics': 'Synapse',
};

function compactSkillLabel(title) {
  if (!title) return 'Next';
  return COMPACT_SKILL_LABELS[title]
    || (title.length > 18 ? title.split(' ').slice(0, 2).join(' ') : title);
}

export const ProgressOverviewCard = memo(function ProgressOverviewCard({
  completedCount, totalTopics, inProgressCount, learnedCount,
  practiceProgress, topicStates, topics = [], activityLog = [], streak = 0, overallReadiness = 0, onSelectTopic,
}) {
  const ts = topicStates ?? {};
  const strongest = getStrengths(topics ?? [], ts)[0] ?? null;
  const weakAreas = getWeakAreas(topics ?? [], ts);
  const weakest = weakAreas[0] ?? null;
  const nextAction = useMemo(
    () => getDashboardNextLessonAction({ topics, topicStates: ts }),
    [topics, ts]
  );
  const remainingEstimate = useMemo(
    () => estimateRemainingLearningTime({ topics, topicStates: ts, activityLog }),
    [topics, ts, activityLog]
  );
  const interviewEstimate = getInterviewReadinessEstimate(overallReadiness ?? 0);

  // Determine current core phase (1-indexed)
  const currentPhaseIdx = useMemo(() => {
    const firstIncomplete = CORE_PHASES.findIndex(phase =>
      !phase.topicIds.every(id => ts[id]?.state === 'mastered' || ts[id]?.state === 'completed')
    );
    return firstIncomplete >= 0 ? firstIncomplete + 1 : CORE_PHASES.length;
  }, [ts]);

  const overallPct = totalTopics > 0 ? Math.round((completedCount / totalTopics) * 100) : 0;

  const summaryItems = [
    { label: 'Phase', value: `${currentPhaseIdx}/${CORE_PHASES.length}`, title: 'Current stage' },
    { label: 'Topics', value: `${completedCount}/${totalTopics}`, title: inProgressCount > 0 ? `${inProgressCount} in progress` : 'Completed' },
    { label: 'Streak', value: `${streak}d`, title: 'Keep the chain going' },
    { label: 'ETA', value: `~${remainingEstimate.hours}h`, title: 'Remaining focus' },
    { label: 'Strongest Skill', value: compactSkillLabel(strongest?.title), title: 'Most consistent area' },
    { label: 'Weakest Skill', value: compactSkillLabel(weakest?.title), title: 'Best next focus' },
  ];

  return (
    <section className="card dash-progress-card">
      <div className="dash-progress-head">
        <div>
          <p className="eyebrow">Progress Snapshot</p>
          <h2>Keep momentum in view</h2>
        </div>
        <StatPill label="Readiness" value={`${overallReadiness ?? 0}%`} icon="◆" variant="info" />
      </div>

      <div className="dash-progress-summary-grid">
        {summaryItems.map(item => (
          <div key={item.label} className="dash-progress-summary-item" title={item.title}>
            <span className="dash-progress-summary-label">{item.label}</span>
            <strong className="dash-progress-summary-value">{item.value}</strong>
          </div>
        ))}
      </div>
      <div className="dash-progress-focus">
        <span className="dash-progress-focus-label">Recommended next lesson</span>
        <div className="dash-progress-focus-row">
          <div className="dash-progress-focus-copy">
            <strong>{nextAction.title}</strong>
            <span>{nextAction.detail}</span>
          </div>
          {nextAction.topicId && (
            <button
              type="button"
              className="ps-open-btn"
              onClick={() => onSelectTopic?.(nextAction.topicId)}
            >
              Open →
            </button>
          )}
        </div>
      </div>
      <div className="dash-progress-overall-row">
        <div className="dash-overall-track">
          <div className="dash-overall-fill" style={{ width: `${overallPct}%` }} />
        </div>
        <span className="dash-overall-label">Overall Progress</span>
        <span className="dash-overall-pct">{overallPct}%</span>
      </div>
    </section>
  );
});

// ─── Today's Focus (simple checklist) ────────────────────────────────────────

export const TodaysFocusSimple = memo(function TodaysFocusSimple({ enrichedTopics, onNavigate }) {
  const today = new Date().toISOString().slice(0, 10);
  const [state, setState] = useLocalStorage('dem-focus-simple', {});
  const todayState = (state ?? {})[today] ?? {};

  const inProg = enrichedTopics?.filter(t => t.inProgress)?.[0];
  const todo   = enrichedTopics?.filter(t => !t.completed && !t.inProgress)?.[0];
  const current = inProg ?? todo;

  const items = [
    {
      id: `sql-${today}`,
      label: current ? `Continue ${current.title}` : 'Continue SQL Basics',
      sub: 'Section 1/10',
    },
    {
      id: `practice-${today}`,
      label: 'Complete a practice task',
      sub: 'From SQL Lab',
    },
    {
      id: `review-${today}`,
      label: 'Review one concept',
      sub: 'From Learning Path',
    },
  ];

  const doneCount = items.filter(i => !!todayState[i.id]).length;

  const toggleItem = useCallback(id => {
    setState(prev => {
      const s = prev ?? {};
      return { ...s, [today]: { ...(s[today] ?? {}), [id]: !s[today]?.[id] } };
    });
  }, [setState, today]);

  return (
    <section className="card dash-focus-card">
      <div className="dash-focus-header">
        <p className="eyebrow" style={{ margin: 0 }}>Today's Focus</p>
        <span className="dash-focus-badge">{doneCount}/{items.length}</span>
      </div>
      <ul className="dash-focus-list" role="list">
        {items.map(item => {
          const done = !!todayState[item.id];
          return (
            <li key={item.id} className={`dash-focus-item${done ? ' dash-focus-item--done' : ''}`}>
              <button
                type="button"
                className={`dash-focus-check${done ? ' dash-focus-check--done' : ''}`}
                onClick={() => toggleItem(item.id)}
                aria-label={done ? `Unmark: ${item.label}` : `Mark done: ${item.label}`}
              />
              <div className="dash-focus-text">
                <span className="dash-focus-label">{item.label}</span>
                <span className="dash-focus-sub">{item.sub}</span>
              </div>
            </li>
          );
        })}
      </ul>
      <button type="button" className="dash-focus-all-btn" onClick={() => onNavigate?.('topics')}>
        Open Learning Path →
      </button>
    </section>
  );
});

// ─── Upcoming Milestone (sidebar) ─────────────────────────────────────────────

export const UpcomingMilestoneCard = memo(function UpcomingMilestoneCard({ sqlProgress, onNavigate }) {
  const { nextSectionIndex, total } = sqlProgress;
  const coreSections = 10;
  const done = Math.min(nextSectionIndex ?? 0, coreSections);
  const pct = Math.round((done / coreSections) * 100);

  return (
    <section className="card dash-milestone-sidebar">
      <p className="eyebrow">Upcoming Milestone</p>
      <div className="dash-milestone-icon" aria-hidden="true">🏆</div>
      <strong className="dash-milestone-name">Finish SQL Basics</strong>
      <p className="dash-milestone-sub">Complete all {coreSections} sections</p>
      <div className="dash-milestone-sidebar-bar">
        <div className="dash-milestone-sidebar-fill" style={{ width: `${pct}%` }} />
      </div>
      <span className="dash-milestone-sidebar-count">{done} / {coreSections} sections</span>
      <button type="button" className="dash-milestone-cta" onClick={() => onNavigate?.('topics')}>
        Open Learning Path →
      </button>
    </section>
  );
});

// ─── Motivation Quote (sidebar) ───────────────────────────────────────────────

const QUOTES = [
  { text: 'The best way to predict the future is to build it.', author: 'Data Engineer Mindset' },
  { text: 'Every query you write is a step toward mastery.', author: 'Data Engineering Mastery' },
  { text: "Pipelines don't build themselves. But you do.", author: 'Data Engineer Mindset' },
  { text: 'Small daily progress compounds into mastery.', author: 'Learning Philosophy' },
  { text: 'Consistency beats intensity every single day.', author: 'Data Engineer Mindset' },
  { text: 'The data engineer who reads documentation wins.', author: 'Engineering Wisdom' },
  { text: 'Every schema change you survive makes you stronger.', author: 'Data Engineer Mindset' },
];

export const MotivationCard = memo(function MotivationCard() {
  const idx = new Date().getDay() % QUOTES.length;
  const quote = QUOTES[idx];
  return (
    <section className="card dash-quote-card">
      <span className="dash-quote-mark" aria-hidden="true">"</span>
      <p className="dash-quote-text">{quote.text}</p>
      <p className="dash-quote-author">— {quote.author}</p>
    </section>
  );
});

// ─── Learning Consistency (sidebar) ──────────────────────────────────────────

const WEEK_LABELS = ['M', 'T', 'W', 'T', 'F', 'S', 'S'];

export const LearningConsistencyCard = memo(function LearningConsistencyCard({ activityLog }) {
  const today = new Date();
  const days = Array.from({ length: 7 }, (_, i) => {
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

  const activeCount = days.filter(d => actByDay[d] > 0).length;

  return (
    <section className="card dash-consistency-card">
      <div className="dash-consistency-header">
        <p className="eyebrow" style={{ margin: 0 }}>Learning Consistency</p>
        <span className="dash-consistency-period">This Week</span>
      </div>
      <p className="dash-consistency-count">{activeCount} / 7 days active</p>
      <div className="dash-consistency-dots">
        {days.map((day, i) => {
          const active = (actByDay[day] ?? 0) > 0;
          return (
            <div key={day} className="dash-consistency-day">
              <div className={`dash-consistency-dot${active ? ' dash-consistency-dot--active' : ''}`}>
                {active && <span className="dash-consistency-check" aria-hidden="true">✓</span>}
              </div>
              <span className="dash-consistency-label" aria-hidden="true">{WEEK_LABELS[i]}</span>
            </div>
          );
        })}
      </div>
      <p className="dash-consistency-msg">Small daily progress compounds into mastery.</p>
    </section>
  );
});

// ─── Career Readiness Card (compact) ─────────────────────────────────────────

const CAREER_SKILLS = [
  { id: 'sql',           label: 'SQL',          topicIds: ['sql']                                        },
  { id: 'python',        label: 'Python',        topicIds: ['python']                                    },
  { id: 'data-modeling', label: 'Data Modeling', topicIds: ['pyspark']                                   },
  { id: 'cloud',         label: 'Cloud',         topicIds: ['azure-data-factory', 'azure-databricks', 'aws-glue'] },
  { id: 'streaming',     label: 'Streaming',     topicIds: []                                            },
];

export const CareerReadinessCard = memo(function CareerReadinessCard({
  topicStates, completedTopics, learnedCount, overallReadiness,
}) {
  const ts = topicStates ?? {};

  const skills = CAREER_SKILLS.map(skill => {
    if (!skill.topicIds.length) return { ...skill, pct: 0 };
    const vals = skill.topicIds.map(id => ts[id]?.masteryPct ?? 0);
    return { ...skill, pct: Math.max(...vals) };
  });

  const strongest = skills.reduce((best, s) => s.pct > best.pct ? s : best, skills[0]);
  const focusAreas = skills.filter(s => s.id !== strongest.id && s.pct < 10).slice(0, 4);

  const readinessPct = overallReadiness ?? 0;
  const radius = 44;
  const circ = 2 * Math.PI * radius;
  const strokeDash = (readinessPct / 100) * circ;

  return (
    <section className="card dash-career-card">
      <p className="eyebrow">Career Readiness</p>
      <div className="dash-career-inner">
        <div className="dash-career-donut-wrap">
          <svg viewBox="0 0 100 100" className="dash-donut-svg" aria-hidden="true">
            <circle cx="50" cy="50" r={radius} fill="none" stroke="var(--border)" strokeWidth="9" />
            <circle
              cx="50" cy="50" r={radius}
              fill="none"
              stroke="#2c6cf7"
              strokeWidth="9"
              strokeDasharray={`${strokeDash} ${circ}`}
              strokeLinecap="round"
              transform="rotate(-90 50 50)"
            />
          </svg>
          <div className="dash-donut-center">
            <span className="dash-donut-pct">{readinessPct}%</span>
            <span className="dash-donut-sub">Job Ready</span>
          </div>
        </div>

        <div className="dash-career-skills">
          <p className="dash-career-skills-title">Skills Breakdown</p>
          {skills.map(s => (
            <div key={s.id} className="dash-career-skill-row">
              <span className="dash-career-skill-label">{s.label}</span>
              <div className="dash-career-skill-track">
                <div className="dash-career-skill-fill" style={{ width: `${Math.max(s.pct, s.pct > 0 ? 8 : 0)}%` }} />
              </div>
              <span className="dash-career-skill-pct">{s.pct}%</span>
            </div>
          ))}
        </div>

        <div className="dash-career-summary">
          <div className="dash-career-summary-block">
            <p className="dash-career-summary-label">Strongest Skill</p>
            <span className="dash-career-tag">
              {strongest.pct > 0 ? strongest.label : 'SQL Basics'}
            </span>
          </div>
          <div className="dash-career-summary-block">
            <p className="dash-career-summary-label">Focus Areas</p>
            <div className="dash-career-tags-row">
              {(focusAreas.length > 0 ? focusAreas : skills.filter(s => s.id !== 'sql').slice(0, 4)).map(a => (
                <span key={a.id} className="dash-career-tag dash-career-tag--muted">{a.label}</span>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
});

// ─── Quick Links (sidebar) ────────────────────────────────────────────────────

const QUICK_LINKS_DATA = [
  { icon: '▶', label: 'Continue Learning', section: 'topics'         },
  { icon: '▤', label: 'Practice SQL',       section: 'sql-lab'       },
  { icon: '▣', label: 'View Projects',       section: 'projects'      },
  { icon: '◌', label: 'Interview Prep',      section: 'interview-prep' },
  { icon: '✦', label: 'Ask AI Coach',        section: 'ai-learning'   },
  { icon: '◇', label: 'Explore Roadmaps',    section: 'roadmap'       },
];

export const QuickLinksCard = memo(function QuickLinksCard({ onNavigate }) {
  return (
    <section className="card dash-quicklinks-card">
      <p className="eyebrow">Quick Links</p>
      <div className="dash-quicklinks-list">
        {QUICK_LINKS_DATA.map(link => (
          <button
            key={link.label}
            type="button"
            className="dash-quicklink-item"
            onClick={() => onNavigate?.(link.section)}
          >
            <span className="dash-quicklink-icon" aria-hidden="true">{link.icon}</span>
            <span className="dash-quicklink-label">{link.label}</span>
            <span className="dash-quicklink-arrow" aria-hidden="true">→</span>
          </button>
        ))}
      </div>
    </section>
  );
});

// ─── Workplace Simulator (advanced stage — compact, below workspaces) ─────────

export const WorkplaceSimulatorsGrid = memo(function WorkplaceSimulatorsGrid({ onNavigate }) {
  const sims = workplaceSimulators.slice(0, 3);
  return (
    <section className="dash-sims-section">
      <div className="section-title-row" style={{ marginBottom: 16 }}>
        <div>
          <p className="eyebrow">Stage 4 · Workplace simulation</p>
          <h2>Workplace Simulator</h2>
          <p className="dash-sims-sub">Practice real Azure Data Engineering work — unlocked after learning, labs, and projects.</p>
        </div>
      </div>
      <div className="dash-sims-grid dash-sims-grid--three">
        {sims.map(sim => {
          const isAvailable = sim.status === 'available';
          const variant = isAvailable ? 'success' : sim.status === 'next' ? 'info' : 'muted';
          return (
            <button
              key={sim.id}
              type="button"
              className={`dash-sim-card ds-card${isAvailable ? ' ds-card--interactive' : ' dash-sim-card--locked'}`}
              onClick={() => isAvailable && onNavigate?.('workplace')}
              aria-disabled={!isAvailable}
            >
              <div className="dash-sim-card-top">
                <span className="dash-sim-card-icon" aria-hidden="true">{sim.icon}</span>
                <Badge variant={variant} size="sm">{sim.statusLabel}</Badge>
              </div>
              <strong>{sim.title}</strong>
              <p>{sim.summary}</p>
              <span className="dash-sim-card-cta">
                {isAvailable ? 'Open simulator →' : 'Coming soon'}
              </span>
            </button>
          );
        })}
      </div>
    </section>
  );
});
