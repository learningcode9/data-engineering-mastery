import { memo, useState, useEffect } from 'react';
import { CodeBlock } from '../ui/CodeBlock.jsx';
import useLearningStore from '../../store/learningStore.js';

const TABS = ['Overview', 'Architecture', 'Implementation', 'Dataset', 'Interview Q', 'Resume'];

function DifficultyBadge({ level }) {
  const map = {
    Beginner:     { bg: '#d1fae540', color: '#2f756e', border: '#2f756e40' },
    Intermediate: { bg: '#fef9c340', color: '#a07800', border: '#ca9a0040' },
    Advanced:     { bg: '#fee2e240', color: '#dc2626', border: '#dc262640' },
  };
  const s = map[level] ?? map.Intermediate;
  return (
    <span className="proj-difficulty" style={{ background: s.bg, color: s.color, borderColor: s.border }}>
      {level}
    </span>
  );
}

function OverviewTab({ project }) {
  return (
    <div className="proj-tab-content">
      <div className="proj-overview-grid">
        <div className="proj-overview-main">
          <h3>Project Overview</h3>
          <p className="proj-overview-text">{project.overview}</p>
          <h3>Business Problem</h3>
          <p className="proj-overview-text">{project.businessProblem}</p>
        </div>
        <div className="proj-overview-meta">
          <div className="proj-meta-card">
            <span className="proj-meta-label">Difficulty</span>
            <DifficultyBadge level={project.difficulty} />
          </div>
          <div className="proj-meta-card">
            <span className="proj-meta-label">Duration</span>
            <span className="proj-meta-value">{project.duration}</span>
          </div>
          <div className="proj-meta-card">
            <span className="proj-meta-label">Tools</span>
            <div className="proj-tools-list">
              {project.tools.map(t => (
                <span key={t} className="proj-tool-chip">{t}</span>
              ))}
            </div>
          </div>
          <div className="proj-meta-card">
            <span className="proj-meta-label">Challenges</span>
            <ul className="proj-challenges-list">
              {project.challenges.map((c, i) => <li key={i}>{c}</li>)}
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}

function ArchitectureTab({ project }) {
  const arch = project.architecture;
  return (
    <div className="proj-tab-content">
      <p className="proj-arch-desc">{arch.description}</p>
      {arch.layers && (
        <>
          <h3>Architecture Layers</h3>
          <div className="proj-arch-layers">
            {arch.layers.map((l, i) => (
              <div key={l.name} className="proj-arch-layer" style={{ borderLeftColor: l.color }}>
                <strong className="proj-arch-layer-name" style={{ color: l.color }}>{l.name}</strong>
                <p>{l.description}</p>
                {i < arch.layers.length - 1 && <span className="proj-arch-arrow">↓</span>}
              </div>
            ))}
          </div>
        </>
      )}
      {arch.components && (
        <>
          <h3>Components</h3>
          <div className="proj-components">
            {arch.components.map(c => (
              <span key={c} className="proj-component-chip">{c}</span>
            ))}
          </div>
        </>
      )}
      {project.productionConsiderations?.length > 0 && (
        <>
          <h3>Production Considerations</h3>
          <ul className="proj-prod-list">
            {project.productionConsiderations.map((c, i) => <li key={i}>{c}</li>)}
          </ul>
        </>
      )}
    </div>
  );
}

function ImplementationTab({ project }) {
  const [activeStep, setActiveStep] = useState(0);
  const step = project.steps[activeStep];

  return (
    <div className="proj-tab-content">
      <div className="proj-impl-layout">
        <nav className="proj-steps-nav">
          <p className="proj-steps-label">Steps</p>
          {project.steps.map((s, i) => (
            <button
              key={i}
              type="button"
              className={`proj-step-btn${i === activeStep ? ' proj-step-btn--active' : ''}`}
              onClick={() => setActiveStep(i)}
            >
              <span className="proj-step-num">{s.step}</span>
              <span className="proj-step-title">{s.title}</span>
            </button>
          ))}
        </nav>
        <div className="proj-step-detail">
          <div className="proj-step-header">
            <span className="proj-step-badge">Step {step.step}</span>
            <h3>{step.title}</h3>
          </div>
          <p className="proj-step-desc">{step.description}</p>
          <CodeBlock code={step.code} />
          <div className="proj-step-nav">
            {activeStep > 0 && (
              <button type="button" className="secondary-button" onClick={() => setActiveStep(i => i - 1)}>
                ← Previous
              </button>
            )}
            {activeStep < project.steps.length - 1 && (
              <button type="button" onClick={() => setActiveStep(i => i + 1)}>
                Next →
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

function DatasetTab({ project }) {
  const { sampleData } = project;
  return (
    <div className="proj-tab-content">
      <p className="proj-dataset-desc">{sampleData.description}</p>
      <div className="proj-dataset-tables">
        {sampleData.tables.map(t => (
          <div key={t.name} className="proj-table-card">
            <div className="proj-table-header">
              <span className="proj-table-name">{t.name}</span>
              <span className="proj-table-count">{t.columns.length} columns</span>
            </div>
            <div className="proj-table-cols">
              {t.columns.map(c => (
                <span key={c} className="proj-col-chip">{c}</span>
              ))}
            </div>
          </div>
        ))}
      </div>
      {sampleData.sampleRows?.length > 0 && (
        <>
          <h3>Sample Rows</h3>
          <div className="proj-sample-table">
            <div className="proj-sample-header">
              {Object.keys(sampleData.sampleRows[0]).map(k => (
                <span key={k} className="proj-sample-th">{k}</span>
              ))}
            </div>
            {sampleData.sampleRows.map((row, i) => (
              <div key={i} className="proj-sample-row">
                {Object.values(row).map((v, j) => (
                  <span key={j} className="proj-sample-td">{String(v)}</span>
                ))}
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
}

function InterviewTab({ project }) {
  const [revealed, setRevealed] = useState({});
  return (
    <div className="proj-tab-content">
      <p className="proj-interview-intro">Practice these project-specific interview questions. Click to reveal discussion points.</p>
      <div className="proj-iq-list">
        {project.interviewQuestions.map((q, i) => (
          <div
            key={i}
            className={`proj-iq-item${revealed[i] ? ' proj-iq-item--open' : ''}`}
            role="button"
            tabIndex={0}
            onClick={() => setRevealed(r => ({ ...r, [i]: !r[i] }))}
            onKeyDown={e => { if (e.key === 'Enter' || e.key === ' ') setRevealed(r => ({ ...r, [i]: !r[i] })); }}
          >
            <div className="proj-iq-question">
              <span className="proj-iq-num">Q{i + 1}</span>
              <span>{q}</span>
              <span className="proj-iq-toggle">{revealed[i] ? '▲' : '▼'}</span>
            </div>
            {revealed[i] && (
              <div className="proj-iq-hint">
                <p>💡 Discuss: your specific implementation decision, the trade-off you made, and what you learned. Reference actual code or architecture choices from this project.</p>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

function ResumeTab({ project }) {
  const [copiedIndex, setCopiedIndex] = useState(null);

  function copyPoint(text, i) {
    navigator.clipboard.writeText(text).then(() => {
      setCopiedIndex(i);
      setTimeout(() => setCopiedIndex(null), 2000);
    });
  }

  return (
    <div className="proj-tab-content">
      <p className="proj-resume-intro">
        Copy these achievement-style bullet points for your CV or LinkedIn. Customise numbers to match your actual project.
      </p>
      <div className="proj-resume-points">
        {project.resumePoints.map((pt, i) => (
          <div key={i} className="proj-resume-point">
            <span className="proj-resume-bullet">▸</span>
            <span className="proj-resume-text">{pt}</span>
            <button
              type="button"
              className={`proj-copy-btn${copiedIndex === i ? ' proj-copy-btn--done' : ''}`}
              onClick={() => copyPoint(pt, i)}
              title="Copy to clipboard"
            >
              {copiedIndex === i ? '✓' : '⎘'}
            </button>
          </div>
        ))}
      </div>
      <div className="proj-resume-tip">
        <strong>Tip:</strong> Quantify every bullet. Replace placeholders like "50+" with your actual numbers.
        Lead with action verbs: Built, Designed, Implemented, Reduced, Optimised.
      </div>
    </div>
  );
}

export const ProjectDetail = memo(function ProjectDetail({ project, onClose }) {
  const [activeTab, setActiveTab] = useState(0);
  const completedProjects = useLearningStore(s => s.completedProjects);
  const completeProject = useLearningStore(s => s.completeProject);
  const isComplete = !!completedProjects[project.id];

  useEffect(() => {
    function onKeyDown(e) {
      if (e.key === 'Escape') onClose();
    }
    window.addEventListener('keydown', onKeyDown);
    document.body.style.overflow = 'hidden';
    return () => {
      window.removeEventListener('keydown', onKeyDown);
      document.body.style.overflow = '';
    };
  }, [onClose]);

  return (
    <div className="proj-overlay" role="dialog" aria-modal="true" aria-label={project.title}>
      <div className="proj-overlay-backdrop" onClick={onClose} />
      <div className="proj-modal">
        <div className="proj-modal-header">
          <div className="proj-modal-title-row">
            <span className="proj-modal-icon" aria-hidden="true">{project.icon}</span>
            <div>
              <h2 className="proj-modal-title">{project.title}</h2>
              <div className="proj-modal-meta">
                <DifficultyBadge level={project.difficulty} />
                <span className="proj-modal-duration">⏱ {project.duration}</span>
                {project.tags.map(t => (
                  <span key={t} className="proj-tag">{t}</span>
                ))}
              </div>
            </div>
          </div>
          <button
            type="button"
            className="proj-close-btn"
            onClick={onClose}
            aria-label="Close project detail"
          >
            ✕
          </button>
        </div>

        <div className="proj-completion-bar">
          <div>
            <span className="proj-completion-kicker">Portfolio Progress</span>
            <strong>{isComplete ? 'Project completed' : 'Mark this project when your implementation is done'}</strong>
          </div>
          <button
            type="button"
            className={`proj-complete-btn${isComplete ? ' proj-complete-btn--done' : ''}`}
            onClick={() => completeProject(project.id)}
            disabled={isComplete}
          >
            {isComplete ? '✓ Completed' : 'Complete Project +250 XP'}
          </button>
        </div>

        <div className="proj-tabs" role="tablist">
          {TABS.map((tab, i) => (
            <button
              key={tab}
              type="button"
              role="tab"
              aria-selected={i === activeTab}
              className={`proj-tab${i === activeTab ? ' proj-tab--active' : ''}`}
              onClick={() => setActiveTab(i)}
            >
              {tab}
            </button>
          ))}
        </div>

        <div className="proj-modal-body">
          {activeTab === 0 && <OverviewTab project={project} />}
          {activeTab === 1 && <ArchitectureTab project={project} />}
          {activeTab === 2 && <ImplementationTab project={project} />}
          {activeTab === 3 && <DatasetTab project={project} />}
          {activeTab === 4 && <InterviewTab project={project} />}
          {activeTab === 5 && <ResumeTab project={project} />}
        </div>
      </div>
    </div>
  );
});
