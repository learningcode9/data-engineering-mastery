import { ProgressBar } from './ProgressBar.jsx';

export function SummaryCard({ variant, icon, label, value, sub }) {
  return (
    <article className={`summary-card ${variant}`}>
      <span className="summary-icon" aria-hidden="true">{icon}</span>
      <div className="summary-copy">
        <span>{label}</span>
        <strong>{value}</strong>
        <p>{sub}</p>
      </div>
    </article>
  );
}

export function RoadmapCard({ title, icon, percent, body, onClick }) {
  return (
    <article
      className={`roadmap-card${onClick ? ' roadmap-card--clickable' : ''}`}
      onClick={onClick}
      role={onClick ? 'button' : undefined}
      tabIndex={onClick ? 0 : undefined}
      onKeyDown={onClick ? e => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); onClick(); } } : undefined}
    >
      <div className="roadmap-topline">
        <h3>
          <span className="roadmap-icon" aria-hidden="true">{icon}</span>
          {title}
        </h3>
        <span>{percent}</span>
      </div>
      <p>{body}</p>
      <ProgressBar percent={percent} label={`${title} progress`} />
    </article>
  );
}

export function ProjectCard({ title, meta, icon }) {
  return (
    <article>
      <span className="project-icon" aria-hidden="true">{icon}</span>
      <div>
        <span>{meta}</span>
        <strong>{title}</strong>
      </div>
    </article>
  );
}

export function TopicCard({ topic, selected, onClick }) {
  return (
    <button
      type="button"
      className={`topic-card ${selected ? 'selected' : ''}`}
      onClick={onClick}
      aria-pressed={selected}
    >
      <span className="topic-icon" aria-hidden="true">
        {topic.label.slice(0, 2).toUpperCase()}
      </span>
      <div>
        <div className="topic-title">
          <h3>{topic.title}</h3>
          <span>{topic.label}</span>
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
