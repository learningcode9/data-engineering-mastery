import { memo, useState, useMemo } from 'react';
import { SKILL_GRAPH } from '../../data/skillGraph.js';
import { useLocalStorage } from '../../hooks/useLocalStorage.js';

const NODE_ICONS = {
  'sql':                   '🔷',
  'python':                '🐍',
  'pyspark':               '⚡',
  'azure-data-factory':    '🏭',
  'aws-glue':              '🔗',
  'azure-databricks':      '🧱',
  'ai-for-data-engineers': '🤖',
};

const TIER_ROWS = [
  { tier: 'foundation', label: 'Foundation', ids: ['sql', 'python'] },
  { tier: 'core',       label: 'Core',       ids: ['pyspark', 'azure-data-factory', 'aws-glue'] },
  { tier: 'platform',   label: 'Platform',   ids: ['azure-databricks'] },
  { tier: 'advanced',   label: 'Advanced',   ids: ['ai-for-data-engineers'] },
];

const TOPIC_SECTION_MAP = {
  'sql':                   'topics',
  'python':                'topics',
  'pyspark':               'topics',
  'azure-data-factory':    'topics',
  'aws-glue':              'topics',
  'azure-databricks':      'topics',
  'ai-for-data-engineers': 'topics',
};

function getMasteryState(nodeId, completedTopics, practiceProgress) {
  if (completedTopics[nodeId]) return 'mastered';
  const hasProgress = Object.keys(practiceProgress).some(
    key => key.startsWith(nodeId + '-') && practiceProgress[key]
  );
  if (hasProgress) return 'in-progress';
  return 'locked';
}

function MasteryDot({ state }) {
  const colorMap = { mastered: '#2f756e', 'in-progress': '#d97706', locked: '#9ca3af' };
  return (
    <span
      className="sg-mastery-dot"
      style={{ background: colorMap[state] }}
      aria-label={state}
    />
  );
}

function WeightBar({ weight }) {
  const width = Math.round(Math.min(weight, 1) * 100);
  return (
    <div className="sg-weight-track" title={`Weight: ${weight}`}>
      <div className="sg-weight-fill" style={{ width: `${width}%`, background: '#2f756e' }} />
    </div>
  );
}

function TierBadge({ tier }) {
  const colors = {
    foundation: '#1d4ed8',
    core:       '#7c3aed',
    platform:   '#0369a1',
    advanced:   '#b45309',
  };
  return (
    <span className="sg-tier-badge" style={{ background: colors[tier] ?? '#6b7280' }}>
      {tier}
    </span>
  );
}

function NodeCard({ nodeId, node, masteryState, isSelected, onClick }) {
  const stateLabel = { mastered: '✓', 'in-progress': '◑', locked: '○' };
  return (
    <button
      type="button"
      className={[
        'sg-node',
        'sg-node--' + masteryState,
        isSelected ? 'sg-node--selected' : '',
      ].filter(Boolean).join(' ')}
      onClick={() => onClick(nodeId)}
      aria-pressed={isSelected}
      aria-label={`${node.label}, ${masteryState}`}
    >
      <span className="sg-node-icon" aria-hidden="true">{NODE_ICONS[nodeId] ?? '◉'}</span>
      <span className="sg-node-label">{node.label}</span>
      <div className="sg-node-meta">
        <TierBadge tier={node.tier} />
        <MasteryDot state={masteryState} />
        <span className="sg-node-state-label">{stateLabel[masteryState]}</span>
      </div>
      <WeightBar weight={node.weight} />
    </button>
  );
}

function TierArrow() {
  return (
    <div className="sg-tier-arrow" aria-hidden="true">
      <div className="sg-arrow-connector">
        <span className="sg-arrow-vline" />
        <span className="sg-arrow-chevron">▾</span>
      </div>
    </div>
  );
}

function DetailPanel({ nodeId, node, masteryState, onNavigate, onClose }) {
  const stateExplanation = {
    mastered:    'You have completed this topic. Well done!',
    'in-progress': 'You have started practice tasks for this topic but have not fully completed it yet.',
    locked:      'No practice or completion recorded yet.',
  };

  const prereqLabels = (node.prereqs ?? []).map(id => SKILL_GRAPH[id]?.label ?? id);
  const boostLabels  = (node.boosts  ?? []).map(id => SKILL_GRAPH[id]?.label ?? id);
  const showPrereqWarning = masteryState === 'locked' && node.prereqs.length > 0 && node.prereqWarning;

  return (
    <div className="sg-detail-panel">
      <div className="sg-detail-header">
        <span className="sg-detail-icon" aria-hidden="true">{NODE_ICONS[nodeId] ?? '◉'}</span>
        <div className="sg-detail-titles">
          <h3 className="sg-detail-name">{node.label}</h3>
          <TierBadge tier={node.tier} />
        </div>
        <button
          type="button"
          className="sg-detail-close"
          onClick={onClose}
          aria-label="Close detail panel"
        >
          ×
        </button>
      </div>

      <p className="sg-detail-desc">{node.description}</p>

      <div className="sg-detail-status">
        <MasteryDot state={masteryState} />
        <span className="sg-detail-status-text">
          {masteryState === 'mastered' ? 'Mastered' : masteryState === 'in-progress' ? 'In Progress' : 'Not Started'}
        </span>
        <span className="sg-detail-explanation">{stateExplanation[masteryState]}</span>
      </div>

      {showPrereqWarning && (
        <div className="sg-prereq-warning">
          <span className="sg-prereq-warning-icon" aria-hidden="true">⚠</span>
          <p>{node.prereqWarning}</p>
        </div>
      )}

      {prereqLabels.length > 0 && (
        <div className="sg-detail-section">
          <h4 className="sg-detail-section-title">Requires</h4>
          <ul className="sg-detail-list">
            {prereqLabels.map(label => (
              <li key={label} className="sg-detail-list-item sg-detail-list-item--prereq">
                <span aria-hidden="true">→</span> {label}
              </li>
            ))}
          </ul>
        </div>
      )}

      {boostLabels.length > 0 && (
        <div className="sg-detail-section">
          <h4 className="sg-detail-section-title">Unlocks</h4>
          <ul className="sg-detail-list">
            {boostLabels.map(label => (
              <li key={label} className="sg-detail-list-item sg-detail-list-item--boost">
                <span aria-hidden="true">↗</span> {label}
              </li>
            ))}
          </ul>
        </div>
      )}

      {node.unlocks && node.unlocks.length > 0 && (
        <div className="sg-detail-section">
          <h4 className="sg-detail-section-title">What this enables</h4>
          <ul className="sg-detail-list">
            {node.unlocks.map((item, i) => (
              <li key={i} className="sg-detail-list-item">
                <span aria-hidden="true">✦</span> {item}
              </li>
            ))}
          </ul>
        </div>
      )}

      <button
        type="button"
        className="sg-detail-nav-btn"
        onClick={() => onNavigate?.(TOPIC_SECTION_MAP[nodeId] ?? 'topics')}
      >
        Go to {node.label} topic →
      </button>
    </div>
  );
}

export const SkillGraph = memo(function SkillGraph({ onNavigate }) {
  const [practiceProgress]  = useLocalStorage('dem-practice-progress', {});
  const [completedTopics]   = useLocalStorage('dem-completed-topics', {});
  const [selectedId, setSelectedId] = useState(null);

  const masteryMap = useMemo(() => {
    const map = {};
    for (const nodeId of Object.keys(SKILL_GRAPH)) {
      map[nodeId] = getMasteryState(nodeId, completedTopics, practiceProgress);
    }
    return map;
  }, [completedTopics, practiceProgress]);

  const stats = useMemo(() => {
    const total       = Object.keys(SKILL_GRAPH).length;
    const mastered    = Object.values(masteryMap).filter(s => s === 'mastered').length;
    const onTrack     = Object.values(masteryMap).filter(s => s === 'mastered' || s === 'in-progress').length;
    const totalWeight = Object.values(SKILL_GRAPH).reduce((a, n) => a + n.weight, 0);
    const earned      = Object.entries(SKILL_GRAPH).reduce((a, [id, n]) => {
      return a + (masteryMap[id] === 'mastered' ? n.weight : masteryMap[id] === 'in-progress' ? n.weight * 0.5 : 0);
    }, 0);
    const readiness = Math.round((earned / totalWeight) * 100);
    return { mastered, onTrack, total, readiness };
  }, [masteryMap]);

  function handleNodeClick(id) {
    setSelectedId(prev => (prev === id ? null : id));
  }

  const selectedNode = selectedId ? SKILL_GRAPH[selectedId] : null;

  return (
    <section id="skill-graph" className="section">
      <div className="sg-section-header">
        <h2 className="sg-heading">Skill Dependency Map</h2>
        <p className="sg-subtitle">
          Follow the core path from foundations to platform skills, with prerequisites and unlocks shown in the detail panel.
        </p>
      </div>

      {/* Purpose card */}
      <div className="lab-purpose-card">
        <div className="lab-purpose-header">
          <span className="lab-purpose-icon">🗺</span>
          <div>
            <div className="lab-purpose-title">Skill Dependency Map</div>
            <div style={{ fontSize: '0.85rem', color: 'var(--muted)', marginTop: 2 }}>
              Estimated time: 5–10 min review
            </div>
          </div>
        </div>
        <strong style={{ fontSize: '0.85rem', color: 'var(--heading)' }}>What you will practice:</strong>
        <ul style={{ margin: '8px 0 12px', paddingLeft: 18, fontSize: '0.875rem', color: 'var(--text)' }}>
          <li>Visualising your learning progress across the full skill tree</li>
          <li>Identifying prerequisite gaps before advancing to new topics</li>
          <li>Tracking mastery and readiness across Foundation, Core, and Platform tiers</li>
        </ul>
        <div className="lab-skills-row">
          {['Self-assessment', 'Learning Strategy', 'Progress Tracking'].map(s => (
            <span key={s} className="lab-skill-badge">{s}</span>
          ))}
        </div>
      </div>

      <div className="sg-stats-strip">
        <div className="sg-stat-item">
          <span className="sg-stat-value sg-stat-value--green">{stats.mastered}</span>
          <span className="sg-stat-label">mastered</span>
        </div>
        <div className="sg-stat-divider" aria-hidden="true" />
        <div className="sg-stat-item">
          <span className="sg-stat-value">{stats.onTrack} of {stats.total}</span>
          <span className="sg-stat-label">on track</span>
        </div>
        <div className="sg-stat-divider" aria-hidden="true" />
        <div className="sg-stat-item">
          <span className="sg-stat-value sg-stat-value--green">{stats.readiness}%</span>
          <span className="sg-stat-label">overall readiness</span>
        </div>
      </div>

      <div className="sg-legend">
        <span className="sg-legend-item">
          <span className="sg-legend-dot" style={{ background: '#2f756e' }} aria-hidden="true" />
          Mastered ✓
        </span>
        <span className="sg-legend-item">
          <span className="sg-legend-dot" style={{ background: '#d97706' }} aria-hidden="true" />
          In Progress ◑
        </span>
        <span className="sg-legend-item">
          <span className="sg-legend-dot" style={{ background: '#9ca3af' }} aria-hidden="true" />
          Not Started ○
        </span>
      </div>

      <div className={`sg-body${selectedId ? ' sg-body--with-detail' : ''}`}>
        <div className="sg-graph">
          {TIER_ROWS.map((row, rowIdx) => (
            <div key={row.tier} className="sg-tier-block">
              <div className="sg-tier-row">
                <span className="sg-tier-label">{row.label}</span>
                <div className="sg-tier-nodes">
                  {row.ids.map(nodeId => (
                    <NodeCard
                      key={nodeId}
                      nodeId={nodeId}
                      node={SKILL_GRAPH[nodeId]}
                      masteryState={masteryMap[nodeId]}
                      isSelected={selectedId === nodeId}
                      onClick={handleNodeClick}
                    />
                  ))}
                </div>
              </div>
              {rowIdx < TIER_ROWS.length - 1 && <TierArrow />}
            </div>
          ))}
        </div>

        {selectedId && selectedNode && (
          <DetailPanel
            nodeId={selectedId}
            node={selectedNode}
            masteryState={masteryMap[selectedId]}
            onNavigate={onNavigate}
            onClose={() => setSelectedId(null)}
          />
        )}
      </div>

      <style>{`
        .sg-section-header { margin-bottom: 20px; }
        .sg-heading { font-size: 1.5rem; font-weight: 700; color: var(--heading); margin-bottom: 6px; }
        .sg-subtitle { color: var(--muted); font-size: 0.875rem; margin: 0; }

        .sg-stats-strip {
          display: flex;
          align-items: center;
          gap: 0;
          background: var(--surface);
          border: 1px solid var(--border);
          border-radius: var(--radius-md);
          padding: 14px 20px;
          margin-bottom: 16px;
          width: 100%;
          flex-wrap: wrap;
          justify-content: space-between;
        }
        .sg-stat-item { text-align: center; padding: 0 20px; min-width: 130px; }
        .sg-stat-value { display: block; font-size: 1.375rem; font-weight: 700; color: var(--heading); }
        .sg-stat-value--green { color: #2f756e; }
        .sg-stat-label { font-size: 0.75rem; color: var(--muted); }
        .sg-stat-divider { width: 1px; height: 32px; background: var(--border); flex-shrink: 0; }

        .sg-legend {
          display: flex;
          gap: 20px;
          flex-wrap: wrap;
          margin-bottom: 24px;
        }
        .sg-legend-item {
          display: flex;
          align-items: center;
          gap: 6px;
          font-size: 0.8125rem;
          color: var(--muted);
        }
        .sg-legend-dot {
          display: inline-block;
          width: 10px;
          height: 10px;
          border-radius: 50%;
          flex-shrink: 0;
        }

        .sg-body {
          display: grid;
          grid-template-columns: 1fr;
          gap: 18px;
        }
        @media (min-width: 900px) {
          .sg-body--with-detail {
            grid-template-columns: minmax(0, 2fr) minmax(280px, 1fr);
          }
        }

        .sg-graph {
          display: flex;
          flex-direction: column;
          gap: 0;
          min-width: 0;
          background: var(--surface);
          border: 1px solid var(--border);
          border-radius: var(--radius-lg);
          padding: 16px;
          box-shadow: var(--shadow-sm);
        }

        .sg-tier-block { display: flex; flex-direction: column; gap: 0; }

        .sg-tier-row {
          display: grid;
          grid-template-columns: 96px minmax(0, 1fr);
          align-items: flex-start;
          gap: 16px;
          padding: 8px 0;
        }
        .sg-tier-label {
          font-size: 0.75rem;
          font-weight: 600;
          text-transform: uppercase;
          letter-spacing: 0.06em;
          color: var(--muted);
          padding-top: 14px;
          text-align: right;
        }
        .sg-tier-nodes {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(148px, 1fr));
          gap: 12px;
          min-width: 0;
        }

        .sg-node {
          display: flex;
          flex-direction: column;
          align-items: flex-start;
          gap: 6px;
          padding: 12px 14px;
          background: var(--surface);
          border: 2px solid var(--border);
          border-radius: var(--radius-md);
          cursor: pointer;
          width: 100%;
          min-width: 0;
          text-align: left;
          transition: border-color 180ms var(--ease-out), box-shadow 180ms var(--ease-out), transform 180ms var(--ease-out);
          box-shadow: var(--shadow-sm);
        }
        .sg-node:hover {
          border-color: #2f756e;
          box-shadow: 0 4px 16px rgba(47,117,110,0.18);
          transform: translateY(-1px);
        }
        .sg-node--mastered { border-color: #2f756e; background: #f0faf8; }
        .dark-mode .sg-node--mastered { background: #132e2a; }
        .sg-node--in-progress { border-color: #d97706; background: #fffbf0; }
        .dark-mode .sg-node--in-progress { background: #2a2010; }
        .sg-node--selected {
          border-color: #2f756e;
          box-shadow: 0 0 0 3px rgba(47,117,110,0.25), var(--shadow-md);
        }

        .sg-node-icon { font-size: 1.375rem; line-height: 1; }
        .sg-node-label {
          font-size: 0.8125rem;
          font-weight: 600;
          color: var(--heading);
          line-height: 1.3;
          min-height: 2.1em;
          display: -webkit-box;
          -webkit-box-orient: vertical;
          -webkit-line-clamp: 2;
          overflow: hidden;
        }
        .sg-node-meta {
          display: flex;
          align-items: center;
          gap: 6px;
          flex-wrap: wrap;
        }
        .sg-node-state-label {
          font-size: 0.75rem;
          color: var(--muted);
        }

        .sg-mastery-dot {
          display: inline-block;
          width: 8px;
          height: 8px;
          border-radius: 50%;
          flex-shrink: 0;
        }

        .sg-tier-badge {
          display: inline-block;
          padding: 1px 6px;
          border-radius: var(--radius-sm);
          font-size: 0.625rem;
          font-weight: 700;
          text-transform: uppercase;
          letter-spacing: 0.05em;
          color: #fff;
        }

        .sg-weight-track {
          height: 3px;
          background: var(--border);
          border-radius: 2px;
          width: 100%;
          min-width: 0;
          overflow: hidden;
        }
        .sg-weight-fill {
          height: 3px;
          border-radius: 2px;
          transition: width 0.3s;
        }

        .sg-tier-arrow {
          display: flex;
          padding: 0 0 0 112px;
          margin: 0;
        }
        .sg-arrow-connector {
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 0;
        }
        .sg-arrow-vline {
          width: 2px;
          height: 18px;
          background: var(--border);
          border-radius: 1px;
        }
        .sg-arrow-chevron {
          font-size: 13px;
          color: var(--muted);
          line-height: 1;
          margin-top: -2px;
        }

        /* ── Detail panel ── */
        .sg-detail-panel {
          background: var(--surface);
          border: 1px solid var(--border);
          border-radius: var(--radius-lg);
          padding: 20px;
          box-shadow: var(--shadow-md);
          position: sticky;
          top: 80px;
          max-height: calc(100vh - 120px);
          overflow-y: auto;
        }
        .sg-detail-header {
          display: flex;
          align-items: flex-start;
          gap: 12px;
          margin-bottom: 14px;
        }
        .sg-detail-icon { font-size: 1.75rem; flex-shrink: 0; }
        .sg-detail-titles { flex: 1; min-width: 0; }
        .sg-detail-name {
          font-size: 1.0625rem;
          font-weight: 700;
          color: var(--heading);
          margin: 0 0 6px;
        }
        .sg-detail-close {
          background: none;
          border: none;
          font-size: 1.25rem;
          color: var(--muted);
          cursor: pointer;
          padding: 0;
          line-height: 1;
          flex-shrink: 0;
        }
        .sg-detail-close:hover { color: var(--heading); }

        .sg-detail-desc {
          font-size: 0.875rem;
          color: var(--text);
          margin-bottom: 14px;
          line-height: 1.5;
        }

        .sg-detail-status {
          display: flex;
          align-items: flex-start;
          gap: 8px;
          padding: 10px 12px;
          background: var(--surface-soft);
          border-radius: var(--radius-sm);
          margin-bottom: 14px;
          flex-wrap: wrap;
        }
        .sg-detail-status-text {
          font-size: 0.8125rem;
          font-weight: 600;
          color: var(--heading);
        }
        .sg-detail-explanation {
          font-size: 0.75rem;
          color: var(--muted);
          width: 100%;
          margin-top: 2px;
        }

        .sg-prereq-warning {
          display: flex;
          gap: 8px;
          padding: 10px 12px;
          background: #fef3c7;
          border: 1px solid #fbbf24;
          border-radius: var(--radius-sm);
          margin-bottom: 14px;
        }
        .dark-mode .sg-prereq-warning { background: #2a1f00; border-color: #92400e; }
        .sg-prereq-warning-icon { font-size: 0.875rem; flex-shrink: 0; margin-top: 1px; }
        .sg-prereq-warning p { margin: 0; font-size: 0.8125rem; color: #92400e; line-height: 1.45; }
        .dark-mode .sg-prereq-warning p { color: #fbbf24; }

        .sg-detail-section { margin-bottom: 14px; }
        .sg-detail-section-title {
          font-size: 0.75rem;
          font-weight: 700;
          text-transform: uppercase;
          letter-spacing: 0.06em;
          color: var(--muted);
          margin: 0 0 8px;
        }
        .sg-detail-list {
          list-style: none;
          margin: 0;
          padding: 0;
          display: flex;
          flex-direction: column;
          gap: 5px;
        }
        .sg-detail-list-item {
          display: flex;
          align-items: center;
          gap: 8px;
          font-size: 0.8125rem;
          color: var(--text);
          padding: 5px 8px;
          background: var(--surface-soft);
          border-radius: var(--radius-sm);
        }
        .sg-detail-list-item--boost { border-left: 2px solid #2f756e; }
        .sg-detail-list-item--prereq { border-left: 2px solid #6b7cdb; }

        .sg-detail-nav-btn {
          display: block;
          width: 100%;
          padding: 10px 16px;
          background: #2f756e;
          color: #fff;
          border: none;
          border-radius: var(--radius-md);
          font-size: 0.875rem;
          font-weight: 600;
          cursor: pointer;
          text-align: center;
          margin-top: 8px;
          transition: background 0.15s;
        }
        .sg-detail-nav-btn:hover { background: #245a55; }

        @media (max-width: 640px) {
          .sg-stats-strip { display: grid; grid-template-columns: repeat(3, 1fr); padding: 12px; }
          .sg-stat-item { min-width: 0; padding: 0 6px; }
          .sg-stat-divider { display: none; }
          .sg-graph { padding: 12px; }
          .sg-tier-row { grid-template-columns: 1fr; gap: 8px; }
          .sg-tier-label { text-align: left; padding-top: 0; }
          .sg-tier-arrow { padding-left: 0; justify-content: center; }
          .sg-tier-nodes { grid-template-columns: 1fr; }
        }
      `}</style>
    </section>
  );
});
