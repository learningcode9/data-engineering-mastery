import { Fragment, useState } from 'react';
import {
  AppCard,
  Badge,
  PrimaryButton,
  SecondaryButton,
} from '../ui/design-system.jsx';
import { getSim } from '../../data/adfSims.js';
import useLearningStore from '../../store/learningStore.js';
import { SIM_PREREQS, simReadiness } from '../../data/adfLearning.js';
import {
  TICKET_BACKLOG,
  EXPERIENCE_KEYS,
  INCIDENTS,
  STANDALONE_TICKETS,
  readCareer,
  careerLevel,
  SPRINT,
  UPCOMING_SPRINTS,
  readSprint,
  ticketStatus,
  blockedBy,
  sprintProgress,
  completeSprintTicket,
  logIncident,
} from '../../data/adfTickets.js';

function getRisk(completed, total) {
  if (completed >= total) return { level: 'Low', tone: 'low' };
  if (completed >= Math.ceil(total / 2)) return { level: 'Medium', tone: 'medium' };
  return { level: 'High', tone: 'high' };
}

function collectWarnings(sim, stepStates, currentStep) {
  const warnings = [];
  (sim.warnings ?? []).forEach((w, i) => {
    if (!stepStates[i]?.correct) warnings.push(w);
  });
  if (currentStep?.commonMistake) warnings.unshift(currentStep.commonMistake);
  return warnings.slice(0, 4);
}

function RiskPill({ completed, total }) {
  const risk = getRisk(completed, total);
  return (
    <span className={`ds-stat-pill adf-sim-risk adf-sim-risk--${risk.tone}`}>
      <span aria-hidden="true">⚠</span>
      <strong>{risk.level}</strong>
      <span>Production risk</span>
    </span>
  );
}

function validateStep(step, values) {
  const wrong = step.fields.filter(f => f.correct !== undefined && values[f.id] !== f.correct);
  return { correct: wrong.length === 0, wrong };
}

function FieldRow({ field, value, onChange, disabled, invalid }) {
  const id = `adf-cfg-${field.id}`;
  const fieldClass = `adf-cfg-field${invalid ? ' adf-cfg-field--invalid' : ''}`;

  if (field.type === 'toggle') {
    return (
      <div className={`${fieldClass} adf-cfg-field--toggle`}>
        <span className="adf-cfg-label" id={`${id}-label`}>{field.label}</span>
        <button
          type="button"
          role="switch"
          aria-checked={!!value}
          aria-labelledby={`${id}-label`}
          className={`adf-cfg-toggle${value ? ' adf-cfg-toggle--on' : ''}`}
          onClick={() => !disabled && onChange(!value)}
          disabled={disabled}
        >
          <span className="adf-cfg-toggle-track" aria-hidden="true"><span className="adf-cfg-toggle-dot" /></span>
          <span className="adf-cfg-toggle-text">{value ? 'Enabled' : 'Disabled'}</span>
        </button>
      </div>
    );
  }

  if (field.type === 'select') {
    return (
      <div className={fieldClass}>
        <label className="adf-cfg-label" htmlFor={id}>{field.label}</label>
        <select
          id={id}
          className="adf-cfg-input adf-cfg-select"
          value={value}
          onChange={e => onChange(e.target.value)}
          disabled={disabled}
        >
          <option value="" disabled>Select…</option>
          {field.options.map(o => <option key={o} value={o}>{o}</option>)}
        </select>
      </div>
    );
  }

  if (field.type === 'radio') {
    return (
      <div className={fieldClass} role="radiogroup" aria-label={field.label}>
        <span className="adf-cfg-label">{field.label}</span>
        <div className="adf-cfg-radio-row">
          {field.options.map(o => (
            <button
              key={o}
              type="button"
              className={`adf-cfg-radio${value === o ? ' adf-cfg-radio--on' : ''}`}
              onClick={() => !disabled && onChange(o)}
              aria-pressed={value === o}
              disabled={disabled}
            >
              {o}
            </button>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className={fieldClass}>
      <label className="adf-cfg-label" htmlFor={id}>{field.label}</label>
      <input
        id={id}
        type="text"
        className="adf-cfg-input"
        value={value}
        placeholder={field.placeholder}
        onChange={e => onChange(e.target.value)}
        disabled={disabled}
      />
    </div>
  );
}

function criteriaChecked(c, stepStates) {
  if (!stepStates) return false;
  if (c.step === 'all') return stepStates.length > 0 && stepStates.every(s => s.correct);
  return !!stepStates[c.step]?.correct;
}

function AcceptanceCriteria({ sim, stepStates, className = '' }) {
  const list = sim.ticket?.acceptanceCriteria ?? [];
  if (!list.length) return null;
  const done = list.filter(c => criteriaChecked(c, stepStates)).length;
  return (
    <div className={`adf-tk-ac ${className}`}>
      <div className="adf-tk-ac-head">
        <span className="adf-sim-label">Acceptance criteria</span>
        <span className="adf-tk-ac-count">{done}/{list.length}</span>
      </div>
      <ul className="adf-tk-ac-list" role="list">
        {list.map((c, i) => {
          const checked = criteriaChecked(c, stepStates);
          return (
            <li key={`${c.label}-${i}`} className={checked ? 'adf-tk-ac-li--done' : ''}>
              <span className="adf-tk-ac-box" aria-hidden="true">{checked ? '✓' : '□'}</span>
              <span>{c.label}</span>
            </li>
          );
        })}
      </ul>
    </div>
  );
}

function LearningReadiness({ simId, completedTopics }) {
  const prereqs = SIM_PREREQS[simId]?.prereqs ?? [];
  if (!prereqs.length) return null;
  const { pct } = simReadiness(simId, completedTopics);
  return (
    <div className="adf-tk-ac adf-tk-readiness">
      <div className="adf-tk-ac-head">
        <span className="adf-sim-label">Learning readiness</span>
        <span className="adf-tk-ac-count">{pct}%</span>
      </div>
      <ul className="adf-tk-ac-list" role="list">
        {prereqs.map((p, i) => {
          const done = !!completedTopics?.[p.topicId];
          return (
            <li key={`${p.label}-${i}`} className={done ? 'adf-tk-ac-li--done' : ''}>
              <span className="adf-tk-ac-box" aria-hidden="true">{done ? '✓' : '⚠'}</span>
              <span>{p.label}</span>
            </li>
          );
        })}
      </ul>
      <p className="adf-tk-readiness-note">Recommended, not required — you can start anytime.</p>
    </div>
  );
}

function TicketCard({ sim, simId, completedTopics, onStart, onBack }) {
  const t = sim.ticket ?? {};
  const impact = sim.businessImpact;
  const meta = [
    ['Ticket ID', t.id],
    ['Owner', t.owner],
    ['Created', t.created],
    ['Due', t.due],
    ['Priority', t.priority],
    ['Environment', t.environment],
    ['Business team', t.businessTeam],
    ['Status', t.status],
  ].filter(([, v]) => v);

  return (
    <AppCard className="adf-sim-ticket">
      <div className="adf-sim-ticket-header">
        <div className="adf-sim-ticket-copy">
          <p className="eyebrow">{t.id ? `${t.id} · Ticket` : 'Ticket'}</p>
          <h3>{sim.ticketTitle}</h3>
          <p>{sim.subtitle}</p>
        </div>
        <div className="adf-tk-badges">
          {t.priority ? <Badge variant="warning">{t.priority}</Badge> : null}
          {t.status ? <Badge variant="info">{t.status}</Badge> : null}
        </div>
      </div>

      <div className="adf-sim-ticket-grid">
        {meta.map(([k, v]) => (
          <div key={k}>
            <span className="adf-sim-label">{k}</span>
            <strong>{v}</strong>
          </div>
        ))}
      </div>

      <div className="adf-tk-effort">
        {t.estimatedEffort ? <span className="adf-tk-effort-pill">⏱ Estimated effort: {t.estimatedEffort}</span> : null}
        {t.difficulty ? <span className="adf-tk-effort-pill">Difficulty: {t.difficulty}</span> : null}
      </div>
      {t.skills?.length ? (
        <div className="adf-tk-skills">
          <span className="adf-sim-label">Skills</span>
          <div className="adf-sim-chip-row">
            {t.skills.map(s => <span key={s} className="adf-sim-chip">{s}</span>)}
          </div>
        </div>
      ) : null}

      {impact ? (
        <div className="adf-sim-impact">
          <span className="adf-sim-label">Why the business needs this</span>
          <p>{impact.need}</p>
          <span className="adf-sim-impact-sub">Without this pipeline:</span>
          <ul className="adf-sim-list" role="list">
            {impact.without.map((item, idx) => (
              <li key={`${item}-${idx}`}>{item}</li>
            ))}
          </ul>
        </div>
      ) : null}

      <div className="adf-sim-ticket-columns">
        <AcceptanceCriteria sim={sim} stepStates={null} className="adf-sim-ticket-block" />
        <LearningReadiness simId={simId} completedTopics={completedTopics} />
        {t.definitionOfDone?.length ? (
          <div className="adf-sim-ticket-block adf-tk-dod">
            <span className="adf-sim-label">Definition of done</span>
            <ul className="adf-tk-dod-list" role="list">
              {t.definitionOfDone.map((d, i) => (
                <li key={`${d}-${i}`}><span className="adf-tk-dod-mark" aria-hidden="true">○</span><span>{d}</span></li>
              ))}
            </ul>
          </div>
        ) : null}
      </div>

      {t.comments?.length ? (
        <details className="adf-tk-section" open>
          <summary className="adf-tk-summary"><span>Comments ({t.comments.length})</span><span className="adf-ws-caret" aria-hidden="true">⌄</span></summary>
          <div className="adf-tk-thread">
            {t.comments.map((c, i) => (
              <div key={`${c.author}-${i}`} className="adf-tk-comment">
                <div className="adf-tk-comment-head">
                  <strong>{c.author}</strong>
                  <span>{c.role}</span>
                </div>
                <p>{c.text}</p>
              </div>
            ))}
          </div>
        </details>
      ) : null}

      {t.attachments?.length ? (
        <details className="adf-tk-section">
          <summary className="adf-tk-summary"><span>Attachments ({t.attachments.length})</span><span className="adf-ws-caret" aria-hidden="true">⌄</span></summary>
          <div className="adf-tk-attach-grid">
            {t.attachments.map((a, i) => (
              <span key={`${a.name}-${i}`} className="adf-tk-attach">
                <span className="adf-tk-attach-type">{a.type}</span>
                <span className="adf-tk-attach-name">{a.name}</span>
              </span>
            ))}
          </div>
        </details>
      ) : null}

      {t.activity?.length ? (
        <details className="adf-tk-section">
          <summary className="adf-tk-summary"><span>Activity</span><span className="adf-ws-caret" aria-hidden="true">⌄</span></summary>
          <ul className="adf-tk-activity" role="list">
            {t.activity.map((a, i) => (
              <li key={`${a.text}-${i}`}>
                <span className="adf-tk-activity-time">{a.time}</span>
                <span>{a.text}</span>
              </li>
            ))}
          </ul>
        </details>
      ) : null}

      {onStart ? (
        <div className="adf-sim-ticket-start">
          <p>Accept this ticket to open your office laptop and work through it one step at a time — you'll be guided through all {sim.steps?.length ?? ''} steps.</p>
          <div className="adf-sim-ticket-start-actions">
            {onBack ? <SecondaryButton onClick={onBack}>← Back to inbox</SecondaryButton> : null}
            <PrimaryButton onClick={onStart}>Accept ticket →</PrimaryButton>
          </div>
        </div>
      ) : null}
    </AppCard>
  );
}

function SprintProgressCard({ progress }) {
  const sprint = SPRINT;
  if (progress.complete) {
    const c = sprint.completion;
    const outcomes = Array.isArray(c.outcome) ? c.outcome : [c.outcome];
    const art = sprint.projectArtifact;
    return (
      <>
        <AppCard className="adf-office-sprint adf-office-sprint--done">
          <div className="adf-sim-header-row">
            <div>
              <p className="eyebrow">Sprint completed</p>
              <h3>{sprint.name} delivered ✅</h3>
            </div>
            <Badge variant="success">Done</Badge>
          </div>
          <div className="adf-office-sprint-outcome">
            <div className="adf-office-outcome-list">
              <span className="adf-sim-label">Business outcome</span>
              <ul className="adf-sim-list" role="list">
                {outcomes.map((o, i) => <li key={`${o}-${i}`}>{o}</li>)}
              </ul>
            </div>
            <div><span className="adf-sim-label">Data freshness</span><strong>{c.dataFreshness}</strong></div>
            <div><span className="adf-sim-label">SLA</span><strong>{c.sla}</strong></div>
            <div><span className="adf-sim-label">Manager feedback</span><strong>{c.managerFeedback}</strong></div>
          </div>
        </AppCard>

        {art ? (
          <AppCard className="adf-office-artifact">
            <div className="adf-sim-header-row">
              <div>
                <p className="eyebrow">Resume project artifact generated</p>
                <h3>{sprint.name}</h3>
              </div>
              <Badge variant="info">Portfolio-ready</Badge>
            </div>
            <div className="adf-office-artifact-block">
              <span className="adf-sim-label">Project summary</span>
              <p>{art.summary}</p>
            </div>
            <div className="adf-office-artifact-block">
              <span className="adf-sim-label">Resume bullet</span>
              <p>{art.resume}</p>
            </div>
            <div className="adf-office-artifact-block">
              <span className="adf-sim-label">Interview talking points</span>
              <ul className="adf-sim-list" role="list">
                {art.talkingPoints.map((q, i) => <li key={`${q}-${i}`}>{q}</li>)}
              </ul>
            </div>
          </AppCard>
        ) : null}
      </>
    );
  }
  return (
    <AppCard className="adf-office-sprint">
      <div className="adf-sim-header-row">
        <div>
          <p className="eyebrow">Sprint · {sprint.name}</p>
          <h3>{sprint.businessGoal}</h3>
        </div>
        <Badge variant="info">{progress.completed}/{progress.total} tickets</Badge>
      </div>
      <div className="adf-office-sprint-bar-row">
        <div className="adf-office-sprint-bar"><div className="adf-office-sprint-fill" style={{ width: `${progress.pct}%` }} /></div>
        <span className="adf-office-sprint-pct">{progress.pct}%</span>
      </div>
    </AppCard>
  );
}

function ReadinessChip({ simId, completedTopics }) {
  if (!SIM_PREREQS[simId]) return null;
  const { pct } = simReadiness(simId, completedTopics);
  const tone = pct >= 70 ? 'high' : pct >= 30 ? 'med' : 'low';
  return <span className={`adf-tk-ready-chip adf-tk-ready-chip--${tone}`}>Ready {pct}%</span>;
}

function OfficeInbox({ career, sprint, notice, completedTopics, onOpenTicket, onDeliver }) {
  const { level, next } = careerLevel(career.ticketsCompleted);
  const toNext = next ? Math.max(0, next.min - career.ticketsCompleted) : 0;
  const done = sprint.done;
  const progress = sprintProgress(done);

  const backlogBadge = status => {
    if (status === 'incident') return { variant: 'warning', label: 'Incident · soon' };
    return { variant: 'muted', label: 'Coming soon' };
  };

  return (
    <div className="adf-sim-workspace adf-office">
      <AppCard className="adf-office-banner">
        <div className="adf-office-banner-main">
          <p className="eyebrow">Your role</p>
          <h3>{level.label}</h3>
          <p className="adf-office-banner-sub">
            {next
              ? `${toNext} more ticket${toNext === 1 ? '' : 's'} to reach ${next.label}.`
              : 'Top level reached — you are running the team.'}
          </p>
        </div>
        <div className="adf-office-exp">
          <span className="adf-sim-label">Resume experience generated</span>
          <div className="adf-office-exp-grid">
            {EXPERIENCE_KEYS.map(k => (
              <div key={k.key} className="adf-office-exp-item">
                <strong>{career[k.key] ?? 0}</strong>
                <span>{k.label}</span>
              </div>
            ))}
          </div>
        </div>
      </AppCard>

      {notice ? (
        <div className={`adf-office-notice adf-office-notice--${notice.type === 'sprint-complete' ? 'done' : 'unlock'}`}>
          <span className="adf-office-notice-icon" aria-hidden="true">{notice.type === 'sprint-complete' ? '🎉' : '🔓'}</span>
          <div className="adf-office-notice-copy">
            {notice.type === 'sprint-complete' ? (
              <>
                <strong>Sprint completed — {SPRINT.name} delivered.</strong>
                <span>End-to-end Azure project added to your resume experience.</span>
              </>
            ) : (
              <>
                <strong>{notice.id} unlocked</strong>
                <span>{notice.title} can now begin.</span>
              </>
            )}
          </div>
        </div>
      ) : null}

      <SprintProgressCard progress={progress} />

      <AppCard className="adf-office-inbox">
        <div className="adf-sim-header-row">
          <div>
            <p className="eyebrow">Sprint board · {SPRINT.name}</p>
            <h3>Deliver the pipeline end to end</h3>
          </div>
          <Badge variant="info">Medallion chain</Badge>
        </div>

        <ol className="adf-office-chain" role="list">
          {SPRINT.tickets.map((t, i) => {
            const status = ticketStatus(t, done);
            const blockers = blockedBy(t, done);
            return (
              <Fragment key={t.id}>
                {i > 0 ? <li className="adf-office-chain-arrow" aria-hidden="true">↓</li> : null}
                <li className={`adf-office-chain-item adf-office-chain-item--${status}`}>
                  <div className="adf-office-chain-top">
                    <span className="adf-office-chain-id">{t.id}</span>
                    <span className={`adf-office-layer adf-office-layer--${t.layer.toLowerCase()}`}>{t.layer}</span>
                    {status === 'done' ? <Badge variant="success" size="sm">Done</Badge> : null}
                    {status === 'blocked' ? <Badge variant="muted" size="sm">Blocked by {blockers.join(', ')}</Badge> : null}
                    {status === 'unlocked' ? <Badge variant="info" size="sm">Ready</Badge> : null}
                    <ReadinessChip simId={t.id} completedTopics={completedTopics} />
                  </div>
                  <strong className="adf-office-chain-title">{t.title}</strong>
                  <div className="adf-office-chain-deps">
                    <span>Depends on: <b>{t.dependsOn.length ? t.dependsOn.join(', ') : 'None'}</b></span>
                    <span>Feeds into: <b>{t.feedsInto ?? 'Business dashboard'}</b></span>
                  </div>
                  <p className="adf-office-chain-impact"><span className="adf-sim-label">Impact</span> {t.impact}</p>
                  {status === 'unlocked' ? (
                    <PrimaryButton onClick={() => onOpenTicket(t.id)}>Open ticket →</PrimaryButton>
                  ) : null}
                </li>
              </Fragment>
            );
          })}
        </ol>
      </AppCard>

      <AppCard className="adf-office-inbox">
        <div className="adf-sim-header-row">
          <div>
            <p className="eyebrow">Data engineering tickets</p>
            <h3>Standalone build tickets</h3>
          </div>
          <Badge variant="info">{STANDALONE_TICKETS.length} ready</Badge>
        </div>
        <ul className="adf-office-ticket-list" role="list">
          {STANDALONE_TICKETS.map(tk => (
            <li key={tk.id} className="adf-office-ticket adf-office-ticket--open">
              <span className={`adf-office-prio adf-office-prio--${tk.priority.toLowerCase()}`}>{tk.priority}</span>
              <div className="adf-office-ticket-copy">
                <strong>{tk.id} · {tk.title}</strong>
                <span className="adf-office-ticket-meta">{tk.team} · {tk.topic} <ReadinessChip simId={tk.id} completedTopics={completedTopics} /></span>
              </div>
              <PrimaryButton onClick={() => onOpenTicket(tk.id)}>Open ticket →</PrimaryButton>
            </li>
          ))}
        </ul>
      </AppCard>

      <AppCard className="adf-office-inbox adf-office-incidents">
        <div className="adf-sim-header-row">
          <div>
            <p className="eyebrow">On-call · incidents</p>
            <h3>Production incidents (diagnose & recover)</h3>
          </div>
          <Badge variant="warning">{INCIDENTS.length} open</Badge>
        </div>
        <ul className="adf-office-ticket-list" role="list">
          {INCIDENTS.map(inc => (
            <li key={inc.id} className="adf-office-ticket adf-office-ticket--open adf-office-ticket--incident">
              <span className={`adf-office-prio adf-office-prio--${inc.priority.toLowerCase()}`}>{inc.priority}</span>
              <div className="adf-office-ticket-copy">
                <strong>{inc.id} · {inc.title}</strong>
                <span className="adf-office-ticket-meta">{inc.team} · SLA: {inc.sla} <ReadinessChip simId={inc.id} completedTopics={completedTopics} /></span>
              </div>
              <PrimaryButton onClick={() => onOpenTicket(inc.id)}>Open incident →</PrimaryButton>
            </li>
          ))}
        </ul>
      </AppCard>

      <AppCard className="adf-office-upcoming">
        <span className="adf-sim-label">Upcoming sprint packs</span>
        <div className="adf-office-upcoming-row">
          {UPCOMING_SPRINTS.map(s => (
            <span key={s.id} className="adf-office-upcoming-chip">{s.name}</span>
          ))}
        </div>
      </AppCard>

      <details className="adf-tk-section adf-office-backlog">
        <summary className="adf-tk-summary"><span>Full backlog ({TICKET_BACKLOG.reduce((n, g) => n + g.tickets.length, 0)})</span><span className="adf-ws-caret" aria-hidden="true">⌄</span></summary>
        <div className="adf-office-backlog-body">
          {TICKET_BACKLOG.map(group => (
            <div key={group.level} className="adf-office-group">
              <span className="adf-office-group-label">{group.level}</span>
              <ul className="adf-office-ticket-list" role="list">
                {group.tickets.map(t => {
                  const sb = backlogBadge(t.status);
                  return (
                    <li key={t.id} className="adf-office-ticket">
                      <span className={`adf-office-prio adf-office-prio--${t.priority.toLowerCase()}`}>{t.priority}</span>
                      <div className="adf-office-ticket-copy">
                        <strong>{t.title}</strong>
                        <span className="adf-office-ticket-meta">{t.team} · Due {t.due}</span>
                      </div>
                      <Badge variant={sb.variant} size="sm">{sb.label}</Badge>
                    </li>
                  );
                })}
              </ul>
            </div>
          ))}
        </div>
      </details>
    </div>
  );
}

function buildSummary(sim, stepStates) {
  return (sim.summary ?? []).map(item => {
    const st = stepStates[item.step];
    let value = null;
    if (st?.correct) {
      const raw = st.values?.[item.field];
      value = item.kind === 'toggle' ? (raw ? 'Enabled' : 'Disabled') : raw;
    }
    return { label: item.label, value: value ?? null };
  });
}

function CompactPipeline({ sim, stepStates, stepIndex, onJump, completed, total, readiness }) {
  const nodes = sim.pipelineNodes ?? [];
  const nodeStatus = node => {
    if (node.build == null) return 'complete';
    if (stepStates[node.build]?.correct) return 'complete';
    if (node.build === stepIndex) return 'current';
    return 'pending';
  };
  const statuses = nodes.map(nodeStatus);
  const summary = buildSummary(sim, stepStates);

  return (
    <AppCard className="adf-ws-pipeline">
      <div className="adf-ws-pipeline-head">
        <p className="eyebrow">{sim.pipelineLabel ?? 'Pipeline'}</p>
        <span className="adf-ws-pipeline-meta">
          Step {Math.min(stepIndex + 1, total)}/{total} · {readiness}% ready · {completed}/{total} built
        </span>
      </div>
      <ol className="adf-ws-pipeline-flow" role="list" aria-label="Pipeline status">
        {nodes.map((node, i) => {
          const status = statuses[i];
          const clickable = node.build != null;
          return (
            <Fragment key={node.label}>
              {i > 0 ? (
                <span
                  className={`adf-ws-connector${status === 'complete' ? ' adf-ws-connector--filled' : ''}`}
                  aria-hidden="true"
                />
              ) : null}
              <li className="adf-ws-pipeline-item">
                <button
                  type="button"
                  className={`adf-ws-node adf-ws-node--${status}`}
                  disabled={!clickable}
                  onClick={() => clickable && onJump(node.build)}
                  aria-current={status === 'current' ? 'step' : undefined}
                  title={node.label}
                >
                  <span className="adf-ws-node-dot" aria-hidden="true">{status === 'complete' ? '✓' : ''}</span>
                  <span className="adf-ws-node-label">{node.label}</span>
                </button>
              </li>
            </Fragment>
          );
        })}
      </ol>

      <div className="adf-ws-build" aria-label="Current build">
        <span className="adf-ws-build-label">{sim.buildLabel ?? 'Current build'}</span>
        <div className="adf-ws-build-items">
          {summary.map(item => (
            <span
              key={item.label}
              className={`adf-ws-build-item${item.value ? ' adf-ws-build-item--set' : ''}`}
            >
              <span className="adf-ws-build-key">{item.label}</span>
              <span className="adf-ws-build-val">{item.value ?? 'Not configured'}</span>
            </span>
          ))}
        </div>
      </div>
    </AppCard>
  );
}

function ProjectBriefPanel({ sim, stepStates }) {
  const t = sim.ticket ?? {};
  const fields = [
    ['Ticket', t.id ?? sim.ticketTitle],
    ['Owner', t.owner ?? sim.businessTeam],
    ['Priority', t.priority ?? sim.priority],
    ['Due', t.due ?? sim.due],
  ];
  return (
    <details className="adf-ws-panel adf-ws-brief" open>
      <summary className="adf-ws-panel-summary">
        <div className="adf-ws-panel-title">
          <p className="eyebrow">{t.id ? `${t.id} · Project brief` : 'Project brief'}</p>
          <strong>{sim.ticketTitle}</strong>
        </div>
        <span className="adf-ws-caret" aria-hidden="true">⌄</span>
      </summary>
      <div className="adf-ws-panel-body">
        <dl className="adf-ws-brief-grid">
          {fields.map(([k, v]) => (
            <div key={k}>
              <dt>{k}</dt>
              <dd>{v}</dd>
            </div>
          ))}
        </dl>
        <AcceptanceCriteria sim={sim} stepStates={stepStates} />
      </div>
    </details>
  );
}

function AssistantPanel({ sim, step, stepStates }) {
  const ruleChecks = (sim.validationRules ?? []).map(rule => ({
    key: rule.key,
    label: rule.label,
    passed: !!stepStates[rule.stepIndex]?.correct,
  }));
  // Live checklist: weave in "Connection tested" if this sim's first step has a test.
  const checks = sim.steps[0]?.testConnection
    ? [
        ruleChecks[0],
        { key: 'tested', label: 'Connection tested', passed: stepStates[0]?.tested === 'success' || !!stepStates[0]?.correct },
        ...ruleChecks.slice(1),
      ]
    : ruleChecks;
  const completed = stepStates.filter(s => s.correct).length;
  const total = sim.steps.length;
  const warnings = collectWarnings(
    sim,
    stepStates,
    sim.steps.find((s, idx) => !stepStates[idx]?.correct)
  ).slice(0, 2);

  return (
    <AppCard className="adf-ws-assistant">
      <div className="adf-ws-assistant-head">
        <p className="eyebrow">Assistant</p>
        <RiskPill completed={completed} total={total} />
      </div>

      <div className="adf-ws-assist-block">
        <span className="adf-sim-label">Hint</span>
        <p>{step.mentor}</p>
      </div>

      {step.avoid ? (
        <div className="adf-ws-assist-block adf-ws-assist-block--avoid">
          <span className="adf-sim-label">Avoid · {step.avoid.option}</span>
          <p>{step.avoid.reason}</p>
        </div>
      ) : null}

      <div className="adf-ws-assist-block">
        <span className="adf-sim-label">Validation · {completed}/{total}</span>
        <ul className="adf-ws-check-list" role="list">
          {checks.map(check => (
            <li key={check.key} className={check.passed ? 'adf-ws-check--pass' : 'adf-ws-check--todo'}>
              <span aria-hidden="true">{check.passed ? '✓' : '⚠'}</span>
              <span>{check.label}{check.passed ? '' : ' — missing'}</span>
            </li>
          ))}
        </ul>
      </div>

      <div className="adf-ws-assist-block">
        <span className="adf-sim-label">Risk warnings</span>
        {warnings.length ? (
          <ul className="adf-ws-warn-list" role="list">
            {warnings.map((w, i) => (
              <li key={`${w}-${i}`}>
                <span aria-hidden="true">⚠</span>
                <span>{w}</span>
              </li>
            ))}
          </ul>
        ) : (
          <p className="adf-ws-ok">No critical risks right now.</p>
        )}
      </div>
    </AppCard>
  );
}

function computeReadiness(sim, stepStates) {
  const dimScore = dim => {
    const vals = dim.steps.map(i => {
      const st = stepStates[i];
      if (!st?.correct) return 0;
      return Math.max(60, 100 - 8 * (st.mistakes ?? 0));
    });
    return Math.round(vals.reduce((a, b) => a + b, 0) / vals.length);
  };
  const dims = (sim.readinessDims ?? []).map(d => ({ key: d.key, value: dimScore(d) }));
  const overall = dims.length ? Math.round(dims.reduce((a, d) => a + d.value, 0) / dims.length) : 0;
  return { dims, overall };
}

function computeManagerReview(sim, stepStates) {
  const steps = sim.steps;
  const totalMistakes = stepStates.reduce((n, s) => n + (s.mistakes ?? 0), 0);
  const score = Math.max(70, 100 - 5 * totalMistakes);
  const strengths = sim.review?.strengths
    ?? steps.filter((s, i) => stepStates[i]?.correct).map(s => s.successTitle).filter(Boolean).slice(0, 4);
  const improve = [];
  stepStates.forEach((s, i) => {
    if ((s.mistakes ?? 0) > 0) {
      improve.push(`${steps[i].title}: took ${s.mistakes + 1} attempts — review the config before applying.`);
    }
  });
  if (!improve.length) {
    improve.push('Clean first-pass build — production-ready.');
  }
  return { score, strengths, improve };
}

function CompletionCard({ sim, simId, completedTopics, stepStates, onReset, onLogExperience, logged }) {
  const completed = stepStates.filter(step => step.correct).length;
  const allComplete = completed === sim.steps.length;

  if (!allComplete) return null;

  const c = sim.completion;
  const review = computeManagerReview(sim, stepStates);
  const readiness = computeReadiness(sim, stepStates);
  const interviewQuestions = sim.interviewQuestions ?? [];
  const struggled = sim.steps.filter((s, i) => (stepStates[i]?.mistakes ?? 0) > 0).map(s => s.title);
  const learnPrereqs = SIM_PREREQS[simId]?.prereqs ?? [];

  return (
    <div className="adf-sim-completion">
      <AppCard className="adf-sim-completion-banner">
        <div className="adf-sim-header-row">
          <div>
            <p className="eyebrow">Implementation complete</p>
            <h3>{c.headline}</h3>
          </div>
          <Badge variant="success">All checks passed</Badge>
        </div>
        <p className="adf-sim-completion-copy">{c.architectureSummary}</p>

        {c.architectureFlow ? (
          <div className="adf-sim-arch">
            <span className="adf-sim-label">Generated architecture</span>
            <div className="adf-sim-arch-flow" role="list" aria-label="Generated architecture">
              {c.architectureFlow.map((node, idx) => (
                <Fragment key={node}>
                  {idx > 0 ? <span className="adf-sim-arch-arrow" aria-hidden="true">→</span> : null}
                  <span className="adf-sim-arch-chip" role="listitem">{node}</span>
                </Fragment>
              ))}
            </div>
          </div>
        ) : null}

        <div className="adf-sim-completion-actions">
          <SecondaryButton onClick={onReset}>Rebuild this ticket</SecondaryButton>
          {onLogExperience ? (
            <PrimaryButton onClick={onLogExperience}>
              {logged ? 'Return to inbox →' : 'Log experience & return to inbox →'}
            </PrimaryButton>
          ) : null}
        </div>
      </AppCard>

      {sim.ticket?.closed ? (
        <AppCard className="adf-sim-completion-card adf-tk-closed">
          <div className="adf-tk-closed-head">
            <span className="adf-sim-label">{sim.ticket.id} · Ticket status</span>
            <Badge variant="success">Done</Badge>
          </div>
          <div className="adf-tk-closed-grid">
            <div>
              <span className="adf-sim-label">Completed</span>
              <strong>{sim.ticket.closed.completedTime}</strong>
            </div>
            <div>
              <span className="adf-sim-label">Owner approved</span>
              <strong>{sim.ticket.closed.ownerApproved}</strong>
            </div>
            <div>
              <span className="adf-sim-label">Business impact</span>
              <strong>{sim.ticket.closed.businessImpact}</strong>
            </div>
          </div>
        </AppCard>
      ) : null}

      {c.results ? (
        <AppCard className="adf-sim-completion-card adf-tk-closed">
          <div className="adf-tk-closed-head">
            <span className="adf-sim-label">Release results</span>
            <Badge variant="success">{c.headline?.replace(/[✅\s]+$/, '') || 'Complete'}</Badge>
          </div>
          <div className="adf-tk-closed-grid">
            {c.results.map((r, i) => (
              <div key={`${r.label}-${i}`}>
                <span className="adf-sim-label">{r.label}</span>
                <strong>{r.value}</strong>
              </div>
            ))}
          </div>
        </AppCard>
      ) : null}

      {c.metrics ? (
        <AppCard className="adf-sim-completion-card adf-perf-metrics">
          <p className="adf-sim-label">Optimization results</p>
          <div className="adf-perf-grid">
            {c.metrics.map((m, i) => (
              <div key={`${m.label}-${i}`} className="adf-perf-metric">
                <span className="adf-perf-metric-key">{m.label}</span>
                <div className="adf-perf-metric-row">
                  <span className="adf-perf-before">{m.before}</span>
                  <span className="adf-perf-arrow" aria-hidden="true">→</span>
                  <strong className="adf-perf-after">{m.after}</strong>
                </div>
              </div>
            ))}
          </div>
        </AppCard>
      ) : null}

      <div className="adf-sim-completion-grid adf-sim-review-grid">
        <AppCard className="adf-sim-completion-card adf-sim-review-card">
          <div className="adf-sim-review-head">
            <span className="adf-sim-label">Manager review</span>
            <span className="adf-sim-review-score">{review.score}%</span>
          </div>
          <div className="adf-sim-review-col">
            <span className="adf-sim-review-sub adf-sim-review-sub--ok">Strengths</span>
            <ul className="adf-sim-review-list" role="list">
              {review.strengths.map((s, i) => (
                <li key={`${s}-${i}`} className="adf-sim-review-li--ok"><span aria-hidden="true">✓</span><span>{s}</span></li>
              ))}
            </ul>
          </div>
          <div className="adf-sim-review-col">
            <span className="adf-sim-review-sub adf-sim-review-sub--warn">Improve</span>
            <ul className="adf-sim-review-list" role="list">
              {review.improve.map((s, i) => (
                <li key={`${s}-${i}`} className="adf-sim-review-li--warn"><span aria-hidden="true">⚠</span><span>{s}</span></li>
              ))}
            </ul>
          </div>
        </AppCard>

        <AppCard className="adf-sim-completion-card adf-sim-readiness-card">
          <div className="adf-sim-review-head">
            <span className="adf-sim-label">{sim.readinessLabel ?? 'Production readiness'}</span>
            <span className="adf-sim-review-score">{readiness.overall}%</span>
          </div>
          <div className="adf-sim-readiness-dims">
            {readiness.dims.map(d => (
              <div key={d.key} className="adf-sim-readiness-dim">
                <span className="adf-sim-readiness-key">{d.key}</span>
                <div className="adf-sim-readiness-bar"><div className="adf-sim-readiness-fill" style={{ width: `${d.value}%` }} /></div>
                <span className="adf-sim-readiness-val">{d.value}%</span>
              </div>
            ))}
          </div>
        </AppCard>
      </div>

      {c.finalArchitecture ? (
        <AppCard className="adf-sim-completion-card adf-sim-final-card">
          <p className="adf-sim-label">Final solution · architecture</p>
          <ol className="adf-sim-final-arch" role="list" aria-label="Final solution architecture">
            {c.finalArchitecture.map((node, idx) => (
              <li key={node} className="adf-sim-final-node">
                <span className="adf-sim-final-node-box">{node}</span>
                {idx < c.finalArchitecture.length - 1 ? (
                  <span className="adf-sim-final-arrow" aria-hidden="true">↓</span>
                ) : null}
              </li>
            ))}
          </ol>
        </AppCard>
      ) : null}

      {c.postIncident ? (
        <AppCard className="adf-sim-completion-card adf-pir">
          <p className="adf-sim-label">Post-incident review</p>
          <div className="adf-pir-block">
            <span className="adf-sim-label">Root cause analysis</span>
            <p>{c.postIncident.rootCause}</p>
          </div>
          <div className="adf-pir-block">
            <span className="adf-sim-label">Timeline</span>
            <ul className="adf-pir-timeline" role="list">
              {c.postIncident.timeline.map((t, i) => (
                <li key={`${t.time}-${i}`}><span className="adf-pir-time">{t.time}</span><span>{t.text}</span></li>
              ))}
            </ul>
          </div>
          <div className="adf-pir-block">
            <span className="adf-sim-label">Business impact</span>
            <p>{c.postIncident.businessImpact}</p>
          </div>
          <div className="adf-pir-block">
            <span className="adf-sim-label">Fix applied</span>
            <p>{c.postIncident.fixApplied}</p>
          </div>
          <div className="adf-pir-block">
            <span className="adf-sim-label">Prevention plan</span>
            <ul className="adf-sim-completion-notes" role="list">
              {c.postIncident.preventionPlan.map((p, i) => (
                <li key={`${p}-${i}`}>{p}</li>
              ))}
            </ul>
          </div>
        </AppCard>
      ) : null}

      <div className="adf-sim-completion-grid">
        {c.productionNotes ? (
          <AppCard className="adf-sim-completion-card">
            <p className="adf-sim-label">Production notes</p>
            <ul className="adf-sim-completion-notes" role="list">
              {c.productionNotes.map((note, idx) => (
                <li key={`${note}-${idx}`}>{note}</li>
              ))}
            </ul>
          </AppCard>
        ) : null}
        <AppCard className="adf-sim-completion-card">
          <p className="adf-sim-label">{c.interviewLabel ?? 'Interview answer'}</p>
          <p>{c.interviewAnswer}</p>
        </AppCard>
        <AppCard className="adf-sim-completion-card">
          <p className="adf-sim-label">Resume bullet</p>
          <p>{c.resumeBullet}</p>
        </AppCard>
      </div>

      {learnPrereqs.length ? (
        <AppCard className="adf-sim-completion-card adf-learn-gap">
          <p className="adf-sim-label">Recommended learning</p>
          {struggled.length ? (
            <div className="adf-learn-gap-block">
              <span className="adf-sim-label">You took extra tries on</span>
              <ul className="adf-sim-completion-notes" role="list">
                {struggled.map((s, i) => <li key={`${s}-${i}`}>{s}</li>)}
              </ul>
            </div>
          ) : (
            <p className="adf-learn-gap-clean">Clean run — no retries. Revise these modules to stay sharp for interviews:</p>
          )}
          <div className="adf-learn-gap-block">
            <span className="adf-sim-label">Suggested learning modules</span>
            <div className="adf-sim-chip-row">
              {learnPrereqs.map(p => <span key={p.label} className="adf-sim-chip">{p.label}</span>)}
            </div>
          </div>
        </AppCard>
      ) : null}

      {interviewQuestions.length ? (
        <AppCard className="adf-sim-completion-card">
          <p className="adf-sim-label">Related interview topics · revise in Interview Prep</p>
          <ol className="adf-sim-interview-list" role="list">
            {interviewQuestions.map((q, i) => (
              <li key={`${q}-${i}`}>{q}</li>
            ))}
          </ol>
        </AppCard>
      ) : null}

      {c.incidentChallenge ? (
        <AppCard className="adf-sim-completion-card">
          <p className="adf-sim-label">Production incident challenge</p>
          <p>{c.incidentChallenge}</p>
        </AppCard>
      ) : null}
    </div>
  );
}

function BeforeYouStartCard({ sim }) {
  const b = sim.briefing;
  if (!b) return null;
  return (
    <details className="adf-ws-panel adf-ws-briefing">
      <summary className="adf-ws-panel-summary">
        <div className="adf-ws-panel-title">
          <p className="eyebrow">Before you start</p>
          <strong>New to ADF? Open this orientation</strong>
        </div>
        <span className="adf-ws-caret" aria-hidden="true">⌄</span>
      </summary>
      <div className="adf-ws-panel-body">
        <div className="adf-ws-brief-field">
          <span className="adf-sim-label">Project goal</span>
          <p>{b.projectGoal}</p>
        </div>
        <div className="adf-ws-brief-field">
          <span className="adf-sim-label">Architecture</span>
          <div className="adf-sim-briefing-arch" role="list">
            {b.architecture.map((node, i) => (
              <Fragment key={node}>
                {i > 0 ? <span className="adf-sim-briefing-arrow" aria-hidden="true">↓</span> : null}
                <span className="adf-sim-briefing-arch-node" role="listitem">{node}</span>
              </Fragment>
            ))}
          </div>
        </div>
        <div className="adf-sim-briefing-meta">
          <span className="adf-sim-briefing-meta-pill">⏱ {b.estimatedTime}</span>
          <span className="adf-sim-briefing-meta-pill">Difficulty: {b.difficulty}</span>
        </div>
      </div>
    </details>
  );
}

function TheoryBlock({ theory }) {
  if (!theory) return null;
  const rows = [
    ['What is it?', theory.what],
    ['Why do we use it?', theory.why],
    ['Real-world example', theory.example],
    ['Interview insight', theory.interview],
  ].filter(([, v]) => v);
  return (
    <div className="adf-ws-theory">
      {rows.map(([label, text]) => (
        <div key={label} className="adf-sim-step-field">
          <p className="adf-sim-label">{label}</p>
          <p>{text}</p>
        </div>
      ))}
    </div>
  );
}

function EvidencePanel({ evidence }) {
  if (!evidence) return null;
  return (
    <div className="adf-ev">
      {evidence.title ? <span className="adf-sim-label">{evidence.title}</span> : null}

      {evidence.type === 'runHistory' ? (
        <ul className="adf-ev-runs" role="list">
          {evidence.rows.map((r, i) => (
            <li key={`${r.time}-${i}`} className={`adf-ev-run adf-ev-run--${r.status.toLowerCase()}`}>
              <span className="adf-ev-run-time">{r.time}</span>
              <span className="adf-ev-run-status">{r.status}</span>
            </li>
          ))}
        </ul>
      ) : null}

      {evidence.type === 'log' ? (
        <pre className="adf-ev-log" aria-label="Error log">
          {evidence.lines.map((l, i) => (
            <span key={`${l}-${i}`} className="adf-ev-log-line">{l}</span>
          ))}
        </pre>
      ) : null}

      {evidence.type === 'facts' ? (
        <div className="adf-ev-facts">
          {evidence.items.map((it, i) => (
            <div key={`${it.label}-${i}`} className={`adf-ev-fact${it.alert ? ' adf-ev-fact--alert' : ''}`}>
              <span className="adf-ev-fact-key">{it.label}</span>
              <strong>{it.value}</strong>
            </div>
          ))}
        </div>
      ) : null}

      {evidence.type === 'records' ? (
        <div className="adf-ev-table-wrap">
          <table className="adf-ev-table">
            <thead>
              <tr>{evidence.columns.map(col => <th key={col}>{col}</th>)}</tr>
            </thead>
            <tbody>
              {evidence.rows.map((row, ri) => (
                <tr key={ri}>{row.map((cell, ci) => <td key={ci}>{cell}</td>)}</tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : null}

      {evidence.type === 'metrics' ? (
        <div className="adf-ev-metrics">
          {evidence.items.map((it, i) => (
            <div key={`${it.label}-${i}`} className="adf-ev-metric">
              <span className="adf-ev-metric-key">{it.label}</span>
              <span className="adf-ev-metric-before">{it.before}</span>
              <span className="adf-ev-metric-arrow" aria-hidden="true">→</span>
              <strong className="adf-ev-metric-after">{it.after}</strong>
            </div>
          ))}
        </div>
      ) : null}

      {evidence.type === 'note' ? <p className="adf-ev-note">{evidence.text}</p> : null}

      {evidence.type === 'validation' ? (
        <ul className="adf-ev-validation" role="list">
          {evidence.items.map((it, i) => (
            <li key={`${it.label}-${i}`} className={it.ok ? 'adf-ev-val--ok' : ''}>
              <span aria-hidden="true">{it.ok ? '✓' : '○'}</span>
              <span className="adf-ev-val-label">{it.label}</span>
              <strong>{it.value}</strong>
            </li>
          ))}
        </ul>
      ) : null}
    </div>
  );
}

function AzureBreadcrumb({ path, bare = false }) {
  if (!path?.length) return null;
  const crumb = (
    <div className="adf-cfg-breadcrumb">
      {path.map((seg, i) => (
        <Fragment key={`${seg}-${i}`}>
          {i > 0 ? <span className="adf-cfg-bc-arrow" aria-hidden="true">›</span> : null}
          <span className="adf-cfg-bc-seg">{seg}</span>
        </Fragment>
      ))}
    </div>
  );
  if (bare) return crumb;
  return (
    <div className="adf-sim-azure">
      <span className="adf-sim-label">Where this is done in Azure</span>
      {crumb}
    </div>
  );
}

function StepSuccessCard({ step }) {
  return (
    <div className="adf-cfg-result adf-cfg-result--ok">
      <div className="adf-cfg-result-head">
        <span className="adf-cfg-result-icon" aria-hidden="true">✓</span>
        <strong>{step.successTitle ?? 'Configuration applied'}</strong>
      </div>
      <div className="adf-cfg-result-row">
        <span className="adf-sim-label">What happened</span>
        <p>{step.expectedResult}</p>
      </div>
      {step.takeaway ? (
        <div className="adf-cfg-result-row">
          <span className="adf-sim-label">Interview takeaway</span>
          <p>{step.takeaway}</p>
        </div>
      ) : null}
      <div className="adf-cfg-result-row">
        <span className="adf-sim-label">ADF mapping</span>
        <AzureBreadcrumb path={step.azurePath} bare />
      </div>
    </div>
  );
}

function StepFailureCard({ step, wrong }) {
  const w = wrong?.[0];
  const recommendation = !w
    ? 'Review the configuration and re-apply.'
    : w.type === 'toggle'
      ? `Enable ${w.label}.`
      : `Set ${w.label} to "${w.correct}".`;
  const impact = w ? step.impacts?.[w.id] : null;
  return (
    <div className="adf-cfg-result adf-cfg-result--fail">
      <div className="adf-cfg-result-head">
        <span className="adf-cfg-result-icon" aria-hidden="true">✕</span>
        <strong>Validation failed</strong>
      </div>
      <div className="adf-cfg-result-row">
        <span className="adf-sim-label">Reason</span>
        <p>{w?.hint ?? 'A required field is not set correctly.'}</p>
      </div>
      <div className="adf-cfg-result-row">
        <span className="adf-sim-label">Recommendation</span>
        <p>{recommendation}</p>
      </div>
      {impact ? (
        <div className="adf-cfg-result-row adf-cfg-result-row--impact">
          <span className="adf-sim-label">Business impact</span>
          <p>{impact}</p>
        </div>
      ) : null}
    </div>
  );
}

const makeStatesFor = sim => sim.steps.map(step => ({
  values: Object.fromEntries(step.fields.map(f => [f.id, f.default ?? (f.type === 'toggle' ? false : '')])),
  applied: false,
  correct: false,
  feedback: null,
  invalid: [],
  tested: null,
  mistakes: 0,
}));

export function AdfPipelineSimulator({ item, onResetRequest }) {
  const completedTopics = useLearningStore(s => s.completedTopics) ?? {};
  const [stage, setStage] = useState('inbox'); // 'inbox' | 'brief' | 'sim'
  const [activeTicketId, setActiveTicketId] = useState('ADF-1024');
  const [career, setCareer] = useState(readCareer);
  const [sprint, setSprint] = useState(readSprint);
  const [sprintNotice, setSprintNotice] = useState(null);
  const [logged, setLogged] = useState(false);
  const [stepIndex, setStepIndex] = useState(0);

  const sim = getSim(activeTicketId);
  const steps = sim.steps;
  const makeStates = () => makeStatesFor(sim);

  const [stepStates, setStepStates] = useState(() => makeStatesFor(getSim('ADF-1024')));

  const currentStep = steps[stepIndex];
  const fallbackState = { values: {}, applied: false, correct: false, feedback: null, invalid: [], tested: null };
  const currentState = stepStates[stepIndex] ?? fallbackState;
  const currentValues = currentState.values ?? {};
  const completedCount = stepStates.filter(step => step.correct).length;
  const currentProgress = Math.round((completedCount / steps.length) * 100);
  const currentStepNumber = stepIndex + 1;
  const stepDone = currentState.applied && currentState.correct;

  const handleChange = (fieldId, value) => {
    setStepStates(prev =>
      prev.map((entry, idx) => (
        idx === stepIndex
          ? { ...entry, values: { ...entry.values, [fieldId]: value }, applied: false, correct: false, feedback: null, invalid: [], tested: null }
          : entry
      ))
    );
  };

  const handleApply = () => {
    const { correct, wrong } = validateStep(currentStep, currentValues);
    const feedback = correct
      ? currentStep.expectedResult
      : `${wrong[0].label}: ${wrong[0].hint ?? 'Adjust this field.'}`;
    setStepStates(prev =>
      prev.map((entry, idx) => (
        idx === stepIndex
          ? { ...entry, applied: true, correct, feedback, invalid: wrong.map(w => w.id), mistakes: entry.mistakes + (correct ? 0 : 1) }
          : entry
      ))
    );
  };

  const handleTest = () => {
    const { correct } = validateStep(currentStep, currentValues);
    setStepStates(prev =>
      prev.map((entry, idx) => (idx === stepIndex ? { ...entry, tested: correct ? 'success' : 'fail' } : entry))
    );
  };

  const handleContinue = () => {
    if (!stepDone) return;
    if (stepIndex < steps.length - 1) {
      setStepIndex(index => Math.min(index + 1, steps.length - 1));
      return;
    }
    const completionTarget = document.getElementById('adf-simulator-completion');
    completionTarget?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  const handleReset = () => {
    setStepIndex(0);
    setStepStates(makeStates());
    setLogged(false);
    onResetRequest?.();
  };

  const handleOpenTicket = ticketId => {
    setActiveTicketId(ticketId);
    setStepStates(makeStatesFor(getSim(ticketId)));
    setStepIndex(0);
    setLogged(false);
    setSprintNotice(null);
    setStage('brief');
  };

  const handleLogExperience = () => {
    if (!logged) {
      const isSprintTicket = SPRINT.tickets.some(t => t.id === activeTicketId);
      if (isSprintTicket) {
        const result = completeSprintTicket(activeTicketId, sim.experienceDelta ?? {});
        setCareer(result.career);
        setSprint(result.sprint);
        setSprintNotice(result.notice);
      } else {
        // Incident or standalone build ticket — career only, no sprint involvement.
        // Pass the ticket id so replays don't inflate career stats or level.
        setCareer(logIncident(activeTicketId, sim.experienceDelta ?? {}));
        setSprintNotice(null);
      }
      setLogged(true);
    }
    setStage('inbox');
    setActiveTicketId('ADF-1024');
    setStepIndex(0);
    setStepStates(makeStatesFor(getSim('ADF-1024')));
    setLogged(false);
    onResetRequest?.();
  };

  if (stage === 'inbox') {
    return (
      <OfficeInbox
        career={career}
        sprint={sprint}
        notice={sprintNotice}
        completedTopics={completedTopics}
        onOpenTicket={handleOpenTicket}
      />
    );
  }

  if (stage === 'brief') {
    return (
      <div className="adf-sim-workspace adf-sim-intro">
        <TicketCard sim={sim} simId={activeTicketId} completedTopics={completedTopics} onStart={() => setStage('sim')} onBack={() => setStage('inbox')} />
      </div>
    );
  }

  const validation = currentState.applied ? validateStep(currentStep, currentValues) : null;

  const statusBadge = stepDone
    ? { variant: 'success', label: 'Applied' }
    : currentState.applied
      ? { variant: 'warning', label: 'Fix config' }
      : { variant: 'muted', label: 'Configuring' };

  return (
    <div className="adf-sim-workspace adf-ws">
      <CompactPipeline
        sim={sim}
        stepStates={stepStates}
        stepIndex={stepIndex}
        onJump={setStepIndex}
        completed={completedCount}
        total={steps.length}
        readiness={currentProgress}
      />

      <div className="adf-ws-grid">
        {/* LEFT — project brief + orientation */}
        <aside className="adf-ws-col adf-ws-left">
          <ProjectBriefPanel sim={sim} stepStates={stepStates} />
          <BeforeYouStartCard sim={sim} />
        </aside>

        {/* CENTER — primary work area */}
        <main className="adf-ws-col adf-ws-center">
          <AppCard className="adf-ws-step">
            <div className="adf-ws-step-head">
              <div>
                <p className="eyebrow">Step {currentStepNumber} of {steps.length}</p>
                <h3>{currentStep.title}</h3>
              </div>
              <Badge variant={statusBadge.variant}>{statusBadge.label}</Badge>
            </div>

            <TheoryBlock theory={currentStep.theory} />
            <EvidencePanel evidence={currentStep.evidence} />

            <div className="adf-cfg-panel">
              <div className="adf-cfg-panel-head">
                <span className="adf-cfg-panel-title">{currentStep.configPanelTitle}</span>
                <span className="adf-cfg-panel-tag">ADF configuration</span>
              </div>
              <div className="adf-cfg-fields">
                {currentStep.fields.map(field => (
                  <FieldRow
                    key={field.id}
                    field={field}
                    value={currentValues[field.id]}
                    onChange={value => handleChange(field.id, value)}
                    disabled={stepDone}
                    invalid={currentState.invalid?.includes(field.id)}
                  />
                ))}
              </div>
              {currentStep.testConnection ? (
                <div className="adf-cfg-test">
                  <SecondaryButton onClick={handleTest}>Test Connection</SecondaryButton>
                  {currentState.tested ? (
                    <span className={`adf-cfg-test-msg adf-cfg-test-msg--${currentState.tested}`}>
                      {currentState.tested === 'success'
                        ? currentStep.testConnection.successMsg
                        : currentStep.testConnection.failMsg}
                    </span>
                  ) : null}
                </div>
              ) : null}
            </div>

            {!currentState.applied ? (
              <div className="adf-sim-expected">
                <span className="adf-sim-label">Expected result</span>
                <p>{currentStep.expectedResult}</p>
              </div>
            ) : stepDone ? (
              <StepSuccessCard step={currentStep} />
            ) : (
              <StepFailureCard step={currentStep} wrong={validation?.wrong} />
            )}

            <div className="adf-sim-step-actions">
              <SecondaryButton onClick={handleReset}>Reset</SecondaryButton>
              {stepDone ? (
                <PrimaryButton onClick={handleContinue}>
                  {stepIndex < steps.length - 1 ? 'Continue →' : 'Finish pipeline'}
                </PrimaryButton>
              ) : (
                <PrimaryButton onClick={handleApply}>
                  Apply Configuration
                </PrimaryButton>
              )}
            </div>
          </AppCard>
        </main>

        {/* RIGHT — sticky assistant */}
        <aside className="adf-ws-col adf-ws-right">
          <AssistantPanel sim={sim} step={currentStep} stepStates={stepStates} />
        </aside>
      </div>

      <div id="adf-simulator-completion">
        <CompletionCard sim={sim} simId={activeTicketId} completedTopics={completedTopics} stepStates={stepStates} onReset={handleReset} onLogExperience={handleLogExperience} logged={logged} />
      </div>
    </div>
  );
}

export default AdfPipelineSimulator;
