import { ProgressBar } from './ProgressBar.jsx';
import { cn } from '../../utils/cn.js';
export { AppCard, MetricCard, StatPill, Badge, PrimaryButton, SecondaryButton, SectionHeader, SearchInput, PageContainer, SidebarItem } from './design-system.jsx';

export function SummaryCard({ variant, icon, label, value, sub }) {
  return (
    <article className={cn('summary-card ds-card ds-card--compact', variant)}>
      <span className="summary-icon" aria-hidden="true">{icon}</span>
      <div className="summary-copy">
        <span>{label}</span>
        <strong>{value}</strong>
        <p>{sub}</p>
      </div>
    </article>
  );
}

const IMPORTANCE_MAP = {
  critical: { label: 'Critical',  cls: 'importance--critical' },
  high:     { label: 'High',      cls: 'importance--high'     },
  medium:   { label: 'Common',    cls: 'importance--medium'   },
  growing:  { label: 'Growing',   cls: 'importance--growing'  },
};

const PREREQ_LABELS = {
  sql: 'SQL', python: 'Python', pyspark: 'PySpark',
  'azure-data-factory': 'ADF', 'azure-databricks': 'Databricks',
  'aws-glue': 'AWS Glue', 'ai-for-data-engineers': 'AI/DE',
};

const STATE_BADGE = {
  'locked':      { text: 'Locked',       cls: 'ts-locked'      },
  'available':   { text: 'Ready',         cls: 'ts-available'   },
  'in-progress': { text: 'In Progress',   cls: 'ts-in-progress' },
  'completed':   { text: 'Completed',     cls: 'ts-completed'   },
  'mastered':    { text: 'Mastered ⭐',   cls: 'ts-mastered'    },
};

export function TopicCard({ topic, selected, onClick }) {
  const state     = topic.topicState ?? 'available';
  const masteryPct = topic.masteryPct ?? 0;
  const isLocked  = state === 'locked';
  const isMastered = state === 'mastered';
  const badge     = STATE_BADGE[state] ?? STATE_BADGE.available;
  const imp       = topic.interviewImportance ? IMPORTANCE_MAP[topic.interviewImportance] : null;

  const unlockHint = isLocked && topic.prerequisites?.length > 0
    ? `Complete ${topic.prerequisites.map(id => PREREQ_LABELS[id] ?? id).join(' & ')} to unlock`
    : null;

  const masteryLabel = isLocked ? null : (
    state === 'mastered'     ? 'Mastery'   :
    state === 'completed'    ? 'Mastery'   :
    state === 'in-progress'  ? 'Mastery'   : null
  );

  return (
    <button
      type="button"
      className={cn(
        'topic-card ds-card ds-card--interactive',
        selected && 'selected',
        isLocked && 'topic-card--locked',
        isMastered && 'topic-card--mastered',
      )}
      onClick={onClick}
      aria-pressed={selected}
    >
      <span className="topic-icon" aria-hidden="true">
        {isLocked
          ? <span className="topic-lock-icon" aria-label="Locked">🔒</span>
          : topic.step && <span className="topic-step-badge">{topic.step}</span>
        }
        {topic.label.slice(0, 2).toUpperCase()}
      </span>

      <div className="topic-card-content">
        <div className="topic-title">
          <h3>{topic.title}</h3>
          <span className={`topic-state-badge ${badge.cls}`}>{badge.text}</span>
        </div>

        <p className="topic-card-body">{topic.body}</p>

        {unlockHint ? (
          <p className="topic-unlock-hint">{unlockHint}</p>
        ) : (
          <div className="topic-card-meta">
            {topic.timeEstimate && (
              <span className="topic-meta-chip">⏱ {topic.timeEstimate}</span>
            )}
            {imp && (
              <span className={`topic-meta-chip topic-meta-chip--imp ${imp.cls}`}>
                ◉ {imp.label}
              </span>
            )}
          </div>
        )}

        {masteryLabel !== null && (
          <div className="topic-mastery-row">
            <span className="topic-mastery-label">{masteryLabel}</span>
            <span className={`topic-mastery-pct${isMastered ? ' topic-mastery-pct--gold' : ''}`}>
              {masteryPct}%
            </span>
          </div>
        )}
        <div className={cn(
          'topic-mastery-track',
          isLocked && 'topic-mastery-track--locked',
          isMastered && 'topic-mastery-track--mastered',
        )}>
          <div
            className="topic-mastery-fill"
            style={{ width: isLocked ? '0%' : `${masteryPct}%` }}
          />
        </div>
      </div>
    </button>
  );
}
