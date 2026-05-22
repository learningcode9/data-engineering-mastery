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

export function TopicCard({ topic, selected, onClick }) {
  const pct = parseInt(topic.progress) || 0;
  const statusLabel = topic.completed
    ? 'Completed'
    : pct > 0
      ? 'In Progress'
      : 'Not started';
  const statusClass = topic.completed
    ? 'topic-status--done'
    : pct > 0
      ? 'topic-status--progress'
      : 'topic-status--new';

  return (
    <button
      type="button"
      className={cn('topic-card ds-card ds-card--interactive', selected && 'selected')}
      onClick={onClick}
      aria-pressed={selected}
    >
      <span className="topic-icon" aria-hidden="true">
        {topic.label.slice(0, 2).toUpperCase()}
      </span>
      <div>
        <div className="topic-title">
          <h3>{topic.title}</h3>
          <span className={`topic-status ${statusClass}`}>{statusLabel}</span>
        </div>
        <p>{topic.body}</p>
        <div className="topic-progress">
          <span>{topic.progress} complete</span>
          <ProgressBar percent={topic.progress} label={`${topic.title} progress`} />
        </div>
      </div>
    </button>
  );
}
