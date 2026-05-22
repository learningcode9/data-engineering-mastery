import { memo, useState, useCallback } from 'react';
import { SCENARIOS } from '../../data/scenarios.js';

function CodeBlock({ code }) {
  const [copied, setCopied] = useState(false);

  function handleCopy() {
    navigator.clipboard.writeText(code).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2200);
    });
  }

  return (
    <div className="scenario-code-block">
      <div className="scenario-code-header">
        <span className="scenario-code-lang">SQL / PySpark</span>
        <button type="button" className={`scenario-code-copy${copied ? ' done' : ''}`} onClick={handleCopy}>
          {copied ? '✓ Copied' : '⎘ Copy'}
        </button>
      </div>
      <pre className="scenario-code-pre"><code>{code}</code></pre>
    </div>
  );
}

function ScenarioCard({ scenario }) {
  const [expanded, setExpanded] = useState(false);
  const [activeStep, setActiveStep] = useState(0);
  const [copiedPrompt, setCopiedPrompt] = useState(false);

  const copyPrompt = useCallback(() => {
    navigator.clipboard.writeText(scenario.prompt).then(() => {
      setCopiedPrompt(true);
      setTimeout(() => setCopiedPrompt(false), 2200);
    });
  }, [scenario.prompt]);

  const step = scenario.steps[activeStep];

  return (
    <div className={`scenario-card${expanded ? ' scenario-card--open' : ''}`}>
      {/* Card header — always visible */}
      <button
        type="button"
        className="scenario-card-trigger"
        onClick={() => setExpanded(e => !e)}
        aria-expanded={expanded}
      >
        <div className="scenario-card-left">
          <span className="scenario-icon" aria-hidden="true">{scenario.icon}</span>
          <div className="scenario-meta">
            <div className="scenario-title-row">
              <span className="scenario-badge" style={{ '--badge-color': scenario.badgeColor }}>
                {scenario.badge}
              </span>
              <span className="scenario-time">{scenario.time}</span>
            </div>
            <h3 className="scenario-title">{scenario.title}</h3>
            <p className="scenario-impact">{scenario.impact}</p>
          </div>
        </div>
        <div className="scenario-card-right">
          <div className="scenario-skills">
            {scenario.skills.map(s => (
              <span key={s} className="scenario-skill-tag">{s}</span>
            ))}
          </div>
          <span className="scenario-chevron" aria-hidden="true">
            {expanded ? '▲' : '▼'}
          </span>
        </div>
      </button>

      {/* Expanded investigation walkthrough */}
      {expanded && (
        <div className="scenario-body">
          <div className="scenario-context">
            <p className="scenario-context-label">Situation</p>
            <p className="scenario-context-text">{scenario.context}</p>
          </div>

          {/* Step navigator */}
          <div className="scenario-steps-nav">
            {scenario.steps.map((s, i) => (
              <button
                key={i}
                type="button"
                className={`scenario-step-btn${i === activeStep ? ' active' : ''}`}
                onClick={() => setActiveStep(i)}
              >
                <span className="scenario-step-num">{i + 1}</span>
                <span className="scenario-step-name">{s.title}</span>
              </button>
            ))}
          </div>

          {/* Active step content */}
          <div className="scenario-step-panel">
            <div className="scenario-step-header">
              <span className="scenario-step-badge">Step {activeStep + 1} of {scenario.steps.length}</span>
              <h4 className="scenario-step-title">{step.title}</h4>
            </div>
            <p className="scenario-step-content">{step.content}</p>
            <CodeBlock code={step.code} />
            <div className="scenario-finding">
              <span className="scenario-finding-label">◉ Finding</span>
              <p className="scenario-finding-text">{step.finding}</p>
            </div>

            <div className="scenario-step-nav-row">
              <button
                type="button"
                className="secondary-button scenario-prev-btn"
                onClick={() => setActiveStep(s => Math.max(0, s - 1))}
                disabled={activeStep === 0}
              >
                ← Previous
              </button>
              {activeStep < scenario.steps.length - 1 ? (
                <button
                  type="button"
                  className="scenario-next-btn"
                  onClick={() => setActiveStep(s => s + 1)}
                >
                  Next step →
                </button>
              ) : (
                <span className="scenario-complete-badge">✓ Scenario complete</span>
              )}
            </div>
          </div>

          {/* Practice with AI */}
          <div className="scenario-ai-bar">
            <div className="scenario-ai-bar-text">
              <span className="scenario-ai-bar-label">Practice this scenario with an AI tutor</span>
              <span className="scenario-ai-bar-sub">Paste prompt into Claude or ChatGPT for an interactive deep-dive</span>
            </div>
            <button
              type="button"
              className={`scenario-ai-copy${copiedPrompt ? ' done' : ''}`}
              onClick={copyPrompt}
            >
              {copiedPrompt ? '✓ Copied' : '⎘ Copy full prompt'}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

const Scenarios = memo(function Scenarios() {
  const [activeFilter, setActiveFilter] = useState('All');

  const badges = ['All', ...new Set(SCENARIOS.map(s => s.badge))];
  const filtered = activeFilter === 'All'
    ? SCENARIOS
    : SCENARIOS.filter(s => s.badge === activeFilter);

  return (
    <section className="section scenarios-section" id="scenarios">
      <div className="section-title-row">
        <div>
          <p className="eyebrow">Real-World Engineering</p>
          <h2>Day in the Life</h2>
        </div>
        <span className="section-badge">Production Incidents</span>
      </div>

      <p className="scenarios-intro">
        Each scenario is a real production incident with guided investigation, root-cause analysis,
        and copy-to-AI prompts. Work through them like a real data engineer on call.
      </p>

      <div className="scenarios-filters">
        {badges.map(b => (
          <button
            key={b}
            type="button"
            className={`scenario-filter-btn${b === activeFilter ? ' active' : ''}`}
            onClick={() => setActiveFilter(b)}
          >
            {b}
          </button>
        ))}
      </div>

      <div className="scenarios-list">
        {filtered.map(s => (
          <ScenarioCard key={s.id} scenario={s} />
        ))}
      </div>
    </section>
  );
});

export default Scenarios;
