import { useMemo } from 'react';

function getPhaseProgress(phase, topics, topicStates) {
  const phaseTopics = topics.filter(t => phase.topicIds.includes(t.id));
  if (!phaseTopics.length) return { pct: 0, done: 0, total: 0, status: 'locked' };

  const done = phaseTopics.filter(t => {
    const s = topicStates[t.id]?.state;
    return s === 'completed' || s === 'mastered';
  }).length;

  const inProg = phaseTopics.some(t => {
    const s = topicStates[t.id]?.state;
    return s === 'in-progress' || s === 'available';
  });

  const pct = Math.round((done / phaseTopics.length) * 100);

  const anyUnlocked = phaseTopics.some(t => topicStates[t.id]?.state !== 'locked');
  const status =
    done === phaseTopics.length ? 'complete' :
    done > 0 || inProg || anyUnlocked ? 'active' :
    'locked';

  return { pct, done, total: phaseTopics.length, status };
}

export default function PhaseStrip({ phases, topics, topicStates, activePhaseId, onPhaseSelect }) {
  const phaseStats = useMemo(
    () => phases.map(p => ({ ...p, ...getPhaseProgress(p, topics, topicStates ?? {}) })),
    [phases, topics, topicStates]
  );

  return (
    <div className="phase-strip" role="tablist" aria-label="Learning phases">
      <button
        type="button"
        role="tab"
        aria-selected={activePhaseId === null}
        className={`phase-tab phase-tab--all${activePhaseId === null ? ' phase-tab--active' : ''}`}
        onClick={() => onPhaseSelect(null)}
      >
        <span className="phase-tab-icon">◎</span>
        <span className="phase-tab-label">All</span>
      </button>

      {phaseStats.map(phase => (
        <button
          key={phase.id}
          type="button"
          role="tab"
          aria-selected={activePhaseId === phase.id}
          className={[
            'phase-tab',
            `phase-tab--${phase.status}`,
            activePhaseId === phase.id && 'phase-tab--active',
          ].filter(Boolean).join(' ')}
          style={{ '--phase-color': phase.color }}
          onClick={() => onPhaseSelect(phase.id)}
        >
          <span className="phase-tab-icon" aria-hidden="true">{phase.icon}</span>
          <span className="phase-tab-label">{phase.title}</span>
          {phase.status !== 'locked' && (
            <span className="phase-tab-progress">
              <span
                className="phase-tab-progress-fill"
                style={{ width: `${phase.pct}%` }}
              />
            </span>
          )}
          {phase.status === 'complete' && (
            <span className="phase-tab-check" aria-hidden="true">✓</span>
          )}
        </button>
      ))}
    </div>
  );
}
