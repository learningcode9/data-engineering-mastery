import { memo, useState, useEffect } from 'react';
import { CodeBlock } from '../ui/CodeBlock.jsx';
import { DocLinksPanel } from '../ui/DocLinksPanel.jsx';
import useLearningStore from '../../store/learningStore.js';

const TABS = ['Overview', 'Architecture', 'Steps', 'Interview', 'Resume', 'Senior Notes'];

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
          <h3>Business Problem</h3>
          <p className="proj-overview-text">{project.businessProblem}</p>

          {project.ingestionStrategy && (
            <>
              <h3>Ingestion Strategy</h3>
              <p className="proj-overview-text">{project.ingestionStrategy}</p>
            </>
          )}

          {project.patterns?.length > 0 && (
            <>
              <h3>Engineering Patterns</h3>
              <div className="proj-tools-list proj-patterns-list">
                {project.patterns.map(p => (
                  <span key={p} className="proj-tool-chip proj-pattern-chip">{p}</span>
                ))}
              </div>
            </>
          )}

          {project.dataModelingPatterns?.length > 0 && (
            <>
              <h3>Data Modeling Patterns</h3>
              <ul className="proj-challenges-list proj-challenges-list--main">
                {project.dataModelingPatterns.map((pattern, i) => <li key={i}>{pattern}</li>)}
              </ul>
            </>
          )}

          {project.challenges?.length > 0 && (
            <>
              <h3>Key Engineering Challenges</h3>
              <ul className="proj-challenges-list proj-challenges-list--main">
                {project.challenges.map((c, i) => <li key={i}>{c}</li>)}
              </ul>
            </>
          )}
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
          {project.tags?.length > 0 && (
            <div className="proj-meta-card">
              <span className="proj-meta-label">Tags</span>
              <div className="proj-tools-list">
                {project.tags.map(t => (
                  <span key={t} className="proj-tag proj-tag--meta">{t}</span>
                ))}
              </div>
            </div>
          )}
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

      {project.cicdStrategy && (
        <>
          <h3>CI/CD Strategy</h3>
          <p className="proj-overview-text">{project.cicdStrategy}</p>
        </>
      )}

      <div className="proj-arch-two-col">
        {project.costOptimization?.length > 0 && (
          <div>
            <h3>Cost Optimisation</h3>
            <ul className="proj-prod-list">
              {project.costOptimization.map((c, i) => <li key={i}>{c}</li>)}
            </ul>
          </div>
        )}
        {project.securityConsiderations?.length > 0 && (
          <div>
            <h3>Security Considerations</h3>
            <ul className="proj-prod-list">
              {project.securityConsiderations.map((c, i) => <li key={i}>{c}</li>)}
            </ul>
          </div>
        )}
      </div>

      {project.sampleData && (
        <>
          <h3>Schema</h3>
          <p className="proj-dataset-desc">{project.sampleData.description}</p>
          <div className="proj-dataset-tables">
            {project.sampleData.tables.map(t => (
              <div key={t.name} className="proj-table-card">
                <div className="proj-table-header">
                  <span className="proj-table-name">{t.name}</span>
                  <span className="proj-table-count">{t.columns.length} cols</span>
                </div>
                <div className="proj-table-cols">
                  {t.columns.map(c => (
                    <span key={c} className="proj-col-chip">{c}</span>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </>
      )}

      {project.officialDocs?.length > 0 && (
        <DocLinksPanel docIds={project.officialDocs} />
      )}
    </div>
  );
}

function StepsTab({ project }) {
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

function InterviewTab({ project }) {
  const [openIdx, setOpenIdx] = useState(null);
  const toggle = i => setOpenIdx(prev => prev === i ? null : i);

  // Use rich talking points if available, fall back to plain questions
  const items = project.interviewTalkingPoints ?? project.interviewQuestions.map(q => ({ question: q }));

  return (
    <div className="proj-tab-content">
      <p className="proj-interview-intro">
        Click each question to see a model answer and the follow-up questions interviewers typically ask next.
      </p>
      <div className="proj-iq-list">
        {items.map((item, i) => {
          const q    = typeof item === 'string' ? item : item.question;
          const ans  = typeof item === 'object' ? item.answer : null;
          const fups = typeof item === 'object' ? item.followUps : null;
          const isOpen = openIdx === i;
          return (
            <div
              key={i}
              className={`proj-iq-item${isOpen ? ' proj-iq-item--open' : ''}`}
              role="button"
              tabIndex={0}
              onClick={() => toggle(i)}
              onKeyDown={e => { if (e.key === 'Enter' || e.key === ' ') toggle(i); }}
            >
              <div className="proj-iq-question">
                <span className="proj-iq-num">Q{i + 1}</span>
                <span>{q}</span>
                <span className="proj-iq-toggle">{isOpen ? '▲' : '▼'}</span>
              </div>
              {isOpen && (
                <div className="proj-iq-answer">
                  {ans ? (
                    <>
                      <p className="proj-iq-answer-text">{ans}</p>
                      {fups?.length > 0 && (
                        <div className="proj-iq-followups">
                          <span className="proj-iq-followups-label">Likely follow-ups:</span>
                          <ul>
                            {fups.map((f, fi) => <li key={fi}>{f}</li>)}
                          </ul>
                        </div>
                      )}
                    </>
                  ) : (
                    <p>💡 Discuss: your specific implementation decision, the trade-off you made, and what you learned. Reference actual code or architecture choices from this project.</p>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

function ResumeBullet({ pt, uid, copiedKey, onCopy }) {
  return (
    <div className="proj-resume-point">
      <span className="proj-resume-bullet">▸</span>
      <span className="proj-resume-text">{pt}</span>
      <button
        type="button"
        className={`proj-copy-btn${copiedKey === uid ? ' proj-copy-btn--done' : ''}`}
        onClick={() => onCopy(pt, uid)}
        title="Copy to clipboard"
      >
        {copiedKey === uid ? '✓' : '⎘'}
      </button>
    </div>
  );
}

function ResumeTab({ project }) {
  const [copiedKey, setCopiedKey] = useState(null);

  function copyPoint(text, key) {
    navigator.clipboard.writeText(text).then(() => {
      setCopiedKey(key);
      setTimeout(() => setCopiedKey(null), 2000);
    });
  }

  const tiers = project.resumeTiers;

  return (
    <div className="proj-tab-content">
      <p className="proj-resume-intro">
        Copy these achievement-style bullet points for your CV or LinkedIn. Customise numbers to match your actual project.
      </p>

      {tiers ? (
        <>
          <div className="proj-resume-tier-header proj-resume-tier-header--beginner">
            <span className="proj-resume-tier-label">For junior &amp; mid-level CVs</span>
            <span className="proj-resume-tier-hint">Focus on tools used and outcomes achieved</span>
          </div>
          <div className="proj-resume-points">
            {tiers.beginner.map((pt, i) => (
              <ResumeBullet key={i} pt={pt} uid={`b-${i}`} copiedKey={copiedKey} onCopy={copyPoint} />
            ))}
          </div>
          <div className="proj-resume-tier-header proj-resume-tier-header--senior">
            <span className="proj-resume-tier-label">For senior &amp; staff-level CVs</span>
            <span className="proj-resume-tier-hint">Lead with scale, trade-offs, and measurable impact</span>
          </div>
          <div className="proj-resume-points">
            {tiers.senior.map((pt, i) => (
              <ResumeBullet key={i} pt={pt} uid={`s-${i}`} copiedKey={copiedKey} onCopy={copyPoint} />
            ))}
          </div>
        </>
      ) : (
        <div className="proj-resume-points">
          {project.resumePoints.map((pt, i) => (
            <ResumeBullet key={i} pt={pt} uid={`flat-${i}`} copiedKey={copiedKey} onCopy={copyPoint} />
          ))}
        </div>
      )}

      <div className="proj-resume-tip">
        <strong>Tip:</strong> Quantify every bullet. Replace placeholders like "50+" with your actual numbers.
        Lead with action verbs: Built, Designed, Implemented, Reduced, Optimised.
      </div>
    </div>
  );
}

function SeniorNotesTab({ project }) {
  const notes = project.seniorNotes;
  if (!notes) {
    return (
      <div className="proj-tab-content">
        <p className="proj-overview-text">Senior engineering notes not yet available for this project.</p>
      </div>
    );
  }
  return (
    <div className="proj-tab-content">
      <div className="proj-senior-grid">
        {notes.juniorsMiss?.length > 0 && (
          <div className="proj-senior-card proj-senior-card--miss">
            <div className="proj-senior-card-header">
              <span className="proj-senior-icon">⚠</span>
              <h3>What Juniors Often Miss</h3>
            </div>
            <ul>
              {notes.juniorsMiss.map((n, i) => <li key={i}>{n}</li>)}
            </ul>
          </div>
        )}
        {notes.productionRealities?.length > 0 && (
          <div className="proj-senior-card proj-senior-card--prod">
            <div className="proj-senior-card-header">
              <span className="proj-senior-icon">⚙</span>
              <h3>What Breaks in Production</h3>
            </div>
            <ul>
              {notes.productionRealities.map((n, i) => <li key={i}>{n}</li>)}
            </ul>
          </div>
        )}
      </div>
      {notes.interviewersFocus && (
        <div className="proj-senior-focus">
          <div className="proj-senior-card-header">
            <span className="proj-senior-icon">◎</span>
            <h3>What Interviewers Actually Care About</h3>
          </div>
          <p>{notes.interviewersFocus}</p>
        </div>
      )}
    </div>
  );
}

export const ProjectDetail = memo(function ProjectDetail({ project, onClose }) {
  const [activeTab, setActiveTab] = useState(0);
  const completedProjects = useLearningStore(s => s.completedProjects);
  const completeProject   = useLearningStore(s => s.completeProject);
  const isComplete        = !!completedProjects[project.id];

  useEffect(() => {
    function onKeyDown(e) { if (e.key === 'Escape') onClose(); }
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [onClose]);

  const hasSeniorNotes = !!project.seniorNotes;

  return (
    <section className="section project-detail-page" id="project-detail" aria-labelledby={`project-detail-title-${project.id}`}>
      <div className="project-detail-toolbar">
        <button type="button" className="secondary-button project-detail-back-btn" onClick={onClose}>
          ← Back to Projects
        </button>
        <button type="button" className="project-detail-close-btn" onClick={onClose} aria-label="Close project detail">
          ✕
        </button>
      </div>

      <div className="project-detail-shell">
        <div className="project-detail-header">
          <div className="project-detail-title-row">
            <span className="project-detail-icon" aria-hidden="true">{project.icon}</span>
            <div>
              <h2 className="project-detail-title" id={`project-detail-title-${project.id}`}>{project.title}</h2>
              <div className="project-detail-meta">
                <DifficultyBadge level={project.difficulty} />
                <span className="project-detail-duration">⏱ {project.duration}</span>
                {project.tags?.map(t => (
                  <span key={t} className="proj-tag">{t}</span>
                ))}
              </div>
            </div>
          </div>
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
          {TABS.map((tab, i) => {
            if (tab === 'Senior Notes' && !hasSeniorNotes) return null;
            return (
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
            );
          })}
        </div>

        <div className="project-detail-content">
          {activeTab === 0 && <OverviewTab project={project} />}
          {activeTab === 1 && <ArchitectureTab project={project} />}
          {activeTab === 2 && <StepsTab project={project} />}
          {activeTab === 3 && <InterviewTab project={project} />}
          {activeTab === 4 && <ResumeTab project={project} />}
          {activeTab === 5 && <SeniorNotesTab project={project} />}
        </div>
      </div>
    </section>
  );
});
