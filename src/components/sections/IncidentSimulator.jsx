import { memo, useState, useCallback, useEffect, useRef } from 'react';
import { INCIDENTS } from '../../data/incidents.js';
import { useLocalStorage } from '../../hooks/useLocalStorage.js';
import useSimulationStore from '../../store/simulationStore.js';

// ── helpers ──────────────────────────────────────────────────────────────────

const SLA_MINUTES = { P1: 30, P2: 60, P3: 120 };

const SEVERITY_COLOR = {
  P1: { bg: '#fee2e2', text: '#b91c1c', border: '#fca5a5' },
  P2: { bg: '#fef3c7', text: '#b45309', border: '#fcd34d' },
  P3: { bg: '#dbeafe', text: '#1d4ed8', border: '#93c5fd' },
};

function formatMs(ms) {
  const totalSec = Math.floor(ms / 1000);
  const m = Math.floor(totalSec / 60);
  const s = totalSec % 60;
  return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
}

function SeverityBadge({ severity }) {
  const c = SEVERITY_COLOR[severity] || SEVERITY_COLOR.P3;
  return (
    <span
      className="inc-severity-badge"
      style={{ background: c.bg, color: c.text, border: `1px solid ${c.border}` }}
    >
      {severity}
    </span>
  );
}

function LevelBadge({ level }) {
  if (level === 'ERROR') {
    return <span className="inc-log-level inc-log-level-error">ERROR</span>;
  }
  if (level === 'WARN') {
    return <span className="inc-log-level inc-log-level-warn">WARN</span>;
  }
  return <span className="inc-log-level inc-log-level-info">INFO</span>;
}

function StatusDot({ status }) {
  const color = status === 'critical' ? '#dc2626' : status === 'warning' ? '#d97706' : '#2f756e';
  return (
    <span
      className="inc-metric-dot"
      style={{ background: color }}
      aria-label={status}
    />
  );
}

// ── CodeBlock ─────────────────────────────────────────────────────────────────

function CodeBlock({ code }) {
  const [copied, setCopied] = useState(false);
  function handleCopy() {
    navigator.clipboard.writeText(code).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2200);
    });
  }
  return (
    <div className="inc-code-block">
      <div className="inc-code-header">
        <span className="inc-code-lang">Fix code</span>
        <button type="button" className="inc-code-copy" onClick={handleCopy}>
          {copied ? '✓ Copied' : '⎘ Copy'}
        </button>
      </div>
      <pre className="inc-code-pre"><code>{code}</code></pre>
    </div>
  );
}

// ── Detail view ───────────────────────────────────────────────────────────────

function IncidentDetail({ incident, resolvedIncidents, onResolve, onBack }) {
  const [activeTab, setActiveTab] = useState('logs');
  const [checkedSteps, setCheckedSteps] = useState({});
  const [rcaText, setRcaText] = useState('');
  const [submitted, setSubmitted] = useState(false);

  // Timer — counts upward from 0
  const [elapsedMs, setElapsedMs] = useState(0);
  const startTimeRef = useRef(null);
  const timerRef = useRef(null);

  const slaMs = SLA_MINUTES[incident.severity] * 60 * 1000;
  const slaBreached = elapsedMs >= slaMs;

  const alreadyResolved = !!resolvedIncidents[incident.id];
  const resolution = resolvedIncidents[incident.id];

  useEffect(() => {
    startTimeRef.current = Date.now();
    timerRef.current = setInterval(() => {
      setElapsedMs(Date.now() - startTimeRef.current);
    }, 1000);
    return () => clearInterval(timerRef.current);
  }, []);

  const allChecked = incident.steps.length > 0 &&
    incident.steps.every((_, i) => checkedSteps[i]);

  function toggleStep(i) {
    setCheckedSteps(prev => ({ ...prev, [i]: !prev[i] }));
  }

  function handleSubmit() {
    if (!rcaText.trim()) return;
    clearInterval(timerRef.current);
    const timeMs = elapsedMs;
    onResolve({
      incidentId: incident.id,
      resolvedAt: Date.now(),
      timeMs,
      stepsChecked: Object.keys(checkedSteps).filter(k => checkedSteps[k]).map(Number),
    });
    setSubmitted(true);
  }

  const checkedCount = Object.values(checkedSteps).filter(Boolean).length;
  const stepTotal = incident.steps.length;
  const progressPct = stepTotal > 0 ? Math.round((checkedCount / stepTotal) * 100) : 0;

  const tabs = ['logs', 'metrics', 'investigate'];

  return (
    <div className="inc-detail">
      {/* Back button */}
      <button type="button" className="inc-back-btn" onClick={onBack}>
        ← Incidents
      </button>

      {/* Header */}
      <div className="inc-detail-header">
        <div className="inc-detail-title-row">
          <SeverityBadge severity={incident.severity} />
          <span className="inc-detail-icon" aria-hidden="true">{incident.icon}</span>
          <h2 className="inc-detail-title">{incident.title}</h2>
        </div>
        <div className="inc-detail-meta-row">
          <span className="inc-detail-tool">{incident.tool}</span>
          <span className="inc-detail-category">{incident.category}</span>
          <div className="inc-timer-pill" style={{
            background: slaBreached ? '#fee2e2' : 'var(--surface-soft)',
            color: slaBreached ? '#b91c1c' : 'var(--text)',
            border: `1px solid ${slaBreached ? '#fca5a5' : 'var(--border)'}`,
          }}>
            <span className="inc-timer-label">Time</span>
            <span className="inc-timer-value">{formatMs(elapsedMs)}</span>
            <span className="inc-timer-sla">
              {slaBreached ? 'SLA BREACHED' : `SLA ${SLA_MINUTES[incident.severity]}m`}
            </span>
          </div>
        </div>
        <p className="inc-detail-briefing">{incident.briefing}</p>
      </div>

      {/* Tabs */}
      <div className="inc-tabs" role="tablist">
        {tabs.map(t => (
          <button
            key={t}
            type="button"
            role="tab"
            aria-selected={activeTab === t}
            className={activeTab === t ? 'inc-tab inc-tab-active' : 'inc-tab'}
            onClick={() => setActiveTab(t)}
          >
            {t === 'logs' ? 'Logs' : t === 'metrics' ? 'Metrics' : 'Investigate'}
          </button>
        ))}
      </div>

      {/* Tab panels */}
      {activeTab === 'logs' && (
        <div className="inc-logs-panel">
          {incident.logs.map((entry, i) => (
            <div key={i} className="inc-log-row">
              <span className="inc-log-time">{entry.time.slice(11, 19)}</span>
              <LevelBadge level={entry.level} />
              <span className="inc-log-source">{entry.source}</span>
              <span className="inc-log-msg">{entry.msg}</span>
            </div>
          ))}
        </div>
      )}

      {activeTab === 'metrics' && (
        <div className="inc-metrics-grid">
          {incident.metrics.map((m, i) => (
            <div key={i} className="inc-metric-card">
              <div className="inc-metric-top">
                <span className="inc-metric-label">{m.label}</span>
                <StatusDot status={m.status} />
              </div>
              <span className="inc-metric-value">{m.value}</span>
              <span className="inc-metric-status-text">{m.status}</span>
            </div>
          ))}
        </div>
      )}

      {activeTab === 'investigate' && (
        <div className="inc-investigate-panel">
          {/* Already resolved banner */}
          {alreadyResolved && (
            <div className="inc-resolved-banner">
              <span className="inc-resolved-icon">✓</span>
              <div>
                <strong>Incident Resolved!</strong>
                <span className="inc-resolved-time">
                  Resolved in {formatMs(resolution.timeMs)}
                </span>
              </div>
            </div>
          )}

          {/* Steps checklist */}
          <div className="inc-steps-header">
            <h3 className="inc-steps-title">Investigation Steps</h3>
            <span className="inc-steps-count">{checkedCount} / {stepTotal} complete</span>
          </div>
          <div className="inc-progress-track">
            <div className="inc-progress-fill" style={{ width: `${progressPct}%` }} />
          </div>

          <ol className="inc-steps-list">
            {incident.steps.map((step, i) => (
              <li key={i} className="inc-step-item">
                <label className="inc-step-label">
                  <input
                    type="checkbox"
                    className="inc-step-checkbox"
                    checked={!!checkedSteps[i]}
                    onChange={() => toggleStep(i)}
                  />
                  <span className={checkedSteps[i] ? 'inc-step-text inc-step-text-done' : 'inc-step-text'}>
                    {step}
                  </span>
                </label>
              </li>
            ))}
          </ol>

          {/* RCA form — only when all steps checked and not yet submitted */}
          {allChecked && !submitted && !alreadyResolved && (
            <div className="inc-rca-form">
              <h3 className="inc-rca-title">Root Cause Analysis</h3>
              <p className="inc-rca-hint">All steps complete. What is your diagnosis — what is the root cause?</p>
              <textarea
                className="inc-rca-textarea"
                rows={5}
                placeholder="Your diagnosis — what is the root cause?"
                value={rcaText}
                onChange={e => setRcaText(e.target.value)}
              />
              <button
                type="button"
                className="inc-submit-btn"
                onClick={handleSubmit}
                disabled={!rcaText.trim()}
              >
                Submit Diagnosis
              </button>
            </div>
          )}

          {/* RCA reveal — after submission or already resolved */}
          {(submitted || alreadyResolved) && (
            <div className="inc-rca-reveal">
              {submitted && (
                <div className="inc-resolved-banner">
                  <span className="inc-resolved-icon">✓</span>
                  <div>
                    <strong>Incident Resolved!</strong>
                    <span className="inc-resolved-time">
                      Resolved in {formatMs(resolution ? resolution.timeMs : elapsedMs)}
                    </span>
                  </div>
                </div>
              )}

              <div className="inc-rca-section">
                <h4 className="inc-rca-section-title">Correct Root Cause</h4>
                <p className="inc-rca-body">{incident.correctRCA}</p>
              </div>

              <div className="inc-rca-section">
                <h4 className="inc-rca-section-title">Fix Summary</h4>
                <p className="inc-rca-body">{incident.fix}</p>
              </div>

              <CodeBlock code={incident.fixCode} />
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// ── List view ─────────────────────────────────────────────────────────────────

function IncidentCard({ incident, isResolved, resolution, onInvestigate, isLive, onLaunchLive }) {
  const sla = SLA_MINUTES[incident.severity];
  return (
    <div className={`inc-card${isLive ? ' inc-card--live' : ''}`}>
      <div className="inc-card-header">
        <SeverityBadge severity={incident.severity} />
        {isLive && <span className="inc-card-live-badge">LIVE</span>}
        {isResolved && !isLive && (
          <span className="inc-card-resolved-check" aria-label="Resolved">✓</span>
        )}
        <span className="inc-card-sla">SLA {sla}m</span>
      </div>
      <div className="inc-card-body">
        <span className="inc-card-icon" aria-hidden="true">{incident.icon}</span>
        <div className="inc-card-info">
          <h3 className="inc-card-title">{incident.title}</h3>
          <div className="inc-card-tags">
            <span className="inc-card-tag">{incident.tool}</span>
            <span className="inc-card-tag">{incident.category}</span>
          </div>
          <p className="inc-card-briefing">{incident.briefing}</p>
          {isResolved && resolution && !isLive && (
            <p className="inc-card-resolved-time">
              Resolved in {formatMs(resolution.timeMs)}
            </p>
          )}
        </div>
      </div>
      <div className="inc-card-footer">
        <button
          type="button"
          className="inc-investigate-btn"
          onClick={() => onInvestigate(incident)}
        >
          {isResolved ? 'Review' : 'Investigate'}
        </button>
        <button
          type="button"
          className={`inc-live-btn${isLive ? ' inc-live-btn--active' : ''}`}
          onClick={() => onLaunchLive(incident)}
          title={isLive ? 'Open live investigation' : 'Launch live incident simulation'}
        >
          {isLive ? '⚡ Live' : '🔴 Go Live'}
        </button>
      </div>
    </div>
  );
}

// ── Root export ───────────────────────────────────────────────────────────────

export const IncidentSimulator = memo(function IncidentSimulator() {
  const [resolvedIncidents, setResolvedIncidents] = useLocalStorage('dem-incidents-resolved', {});
  const [selectedIncident, setSelectedIncident] = useState(null);
  const [severityFilter, setSeverityFilter] = useState('All');

  // Global simulation store
  const startIncident     = useSimulationStore(s => s.startIncident);
  const openInvestigation = useSimulationStore(s => s.openInvestigation);
  const activeIncidents   = useSimulationStore(s => s.activeIncidents);

  const handleResolve = useCallback((data) => {
    setResolvedIncidents(prev => ({ ...prev, [data.incidentId]: data }));
  }, [setResolvedIncidents]);

  const handleBack = useCallback(() => {
    setSelectedIncident(null);
  }, []);

  const handleLaunchLive = useCallback((incident) => {
    // Find existing live incident for this id
    const existing = activeIncidents.find(i => i.incidentId === incident.id);
    if (existing) {
      openInvestigation(existing.uid);
    } else {
      const uid = startIncident(incident.id, incident.severity);
      openInvestigation(uid);
    }
  }, [activeIncidents, startIncident, openInvestigation]);

  const filtered = severityFilter === 'All'
    ? INCIDENTS
    : INCIDENTS.filter(inc => inc.severity === severityFilter);

  const resolvedCount   = Object.keys(resolvedIncidents).length;
  const liveCount       = activeIncidents.length;
  const activeCount     = INCIDENTS.length - resolvedCount;

  if (selectedIncident) {
    return (
      <section className="section" id="incidents">
        <IncidentDetail
          incident={selectedIncident}
          resolvedIncidents={resolvedIncidents}
          onResolve={handleResolve}
          onBack={handleBack}
        />
      </section>
    );
  }

  return (
    <section className="section" id="incidents">
      {/* Section header */}
      <div className="inc-section-header">
        <div>
          <p className="eyebrow">On-Call Training</p>
          <h2>Production Incident Lab</h2>
          <p className="inc-subtitle">Train real on-call skills through simulated production failures.</p>
        </div>
      </div>

      {/* Purpose card */}
      <div className="lab-purpose-card">
        <div className="lab-purpose-header">
          <span className="lab-purpose-icon">🚨</span>
          <div>
            <div className="lab-purpose-title">Production Incident Lab</div>
            <div style={{ fontSize: '0.85rem', color: 'var(--muted)', marginTop: 2 }}>
              Estimated time: 30–45 min per scenario
            </div>
          </div>
        </div>
        <strong style={{ fontSize: '0.85rem', color: 'var(--heading)' }}>What you will practice:</strong>
        <ul style={{ margin: '8px 0 12px', paddingLeft: 18, fontSize: '0.875rem', color: 'var(--text)' }}>
          <li>Diagnosing pipeline failures using real logs and metrics</li>
          <li>Debugging data quality issues with investigation checklists</li>
          <li>Writing root cause analysis (RCA) and postmortem reports</li>
        </ul>
        <div className="lab-skills-row">
          {['Incident Response', 'Root Cause Analysis', 'Pipeline Debugging', 'Monitoring'].map(s => (
            <span key={s} className="lab-skill-badge">{s}</span>
          ))}
        </div>
      </div>

      {/* Stats bar */}
      <div className="inc-stats-bar">
        <div className="inc-stat-chip inc-stat-resolved">
          <span className="inc-stat-num">{resolvedCount}</span>
          <span className="inc-stat-label">resolved</span>
        </div>
        <div className="inc-stat-chip inc-stat-active">
          <span className="inc-stat-num">{activeCount}</span>
          <span className="inc-stat-label">unresolved</span>
        </div>
        {liveCount > 0 && (
          <div className="inc-stat-chip inc-stat-live">
            <span className="inc-stat-num">{liveCount}</span>
            <span className="inc-stat-label">live</span>
          </div>
        )}
        <div className="inc-stat-chip">
          <span className="inc-stat-num">{INCIDENTS.length}</span>
          <span className="inc-stat-label">total</span>
        </div>
      </div>

      {/* Filter bar */}
      <div className="inc-filter-bar">
        {['All', 'P1', 'P2', 'P3'].map(f => (
          <button
            key={f}
            type="button"
            className={severityFilter === f ? 'inc-filter-btn inc-filter-btn-active' : 'inc-filter-btn'}
            onClick={() => setSeverityFilter(f)}
          >
            {f}
          </button>
        ))}
      </div>

      {/* Cards grid */}
      <div className="inc-cards-grid">
        {filtered.map(inc => (
          <IncidentCard
            key={inc.id}
            incident={inc}
            isResolved={!!resolvedIncidents[inc.id]}
            resolution={resolvedIncidents[inc.id]}
            onInvestigate={setSelectedIncident}
            isLive={activeIncidents.some(a => a.incidentId === inc.id)}
            onLaunchLive={handleLaunchLive}
          />
        ))}
      </div>
    </section>
  );
});

export default IncidentSimulator;
