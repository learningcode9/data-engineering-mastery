import { memo } from 'react';
import { SummaryCard } from '../ui/Card.jsx';
import { summaryCards } from '../../data/appData.js';

export const SummaryGrid = memo(function SummaryGrid({ completedCount, totalTopics }) {
  const cards = summaryCards.map(c =>
    c.label === 'Topics' ? { ...c, value: `${completedCount}/${totalTopics}` } : c
  );
  return (
    <div className="summary-grid">
      {cards.map(c => (
        <SummaryCard key={c.label} {...c} />
      ))}
    </div>
  );
});

export const ContinueCard = memo(function ContinueCard({ sqlProgress, onResume }) {
  const { percent, nextSection, nextSectionIndex, total } = sqlProgress;
  const allDone = nextSection === null;
  const sectionTitle = allDone ? 'All sections complete' : nextSection.title;
  const sectionNum   = allDone ? total : nextSectionIndex + 1;

  return (
    <section className="card continue-card">
      <div>
        <p className="eyebrow">Continue Learning</p>
        <h2>SQL — {sectionTitle}</h2>
        <div className="lesson-progress">
          <span>Section {sectionNum} of {total}</span>
          <div className="progress-track">
            <div style={{ width: `${percent}%` }} />
          </div>
        </div>
      </div>
      <button type="button" onClick={onResume}>{allDone ? 'Review' : 'Resume'}</button>
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
            'sql-review': 'Read one topic detail',
            'practice-task': 'Finish one practice task',
            'notes': 'Write one learning note',
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
