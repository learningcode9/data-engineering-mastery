import { memo, useState, useCallback } from 'react';
import { COMPANIES } from '../../data/enterpriseCompanies.js';
import { useLocalStorage } from '../../hooks/useLocalStorage.js';

// ── helpers ───────────────────────────────────────────────────────────────────

const DIFFICULTY_STYLE = {
  Beginner:     { bg: '#dcfce7', text: '#166534', border: '#86efac' },
  Intermediate: { bg: '#dbeafe', text: '#1d4ed8', border: '#93c5fd' },
  Advanced:     { bg: '#ede9fe', text: '#6d28d9', border: '#c4b5fd' },
};

const PRIORITY_STYLE = {
  P1: { bg: '#fee2e2', text: '#b91c1c', border: '#fca5a5' },
  P2: { bg: '#fef3c7', text: '#b45309', border: '#fcd34d' },
  P3: { bg: '#dbeafe', text: '#1d4ed8', border: '#93c5fd' },
  P4: { bg: '#f3f4f6', text: '#6b7280', border: '#d1d5db' },
};

const STATUS_STYLE = {
  success: { bg: '#dcfce7', text: '#166534', border: '#86efac', symbol: '✓' },
  failed:  { bg: '#fee2e2', text: '#b91c1c', border: '#fca5a5', symbol: '✕' },
  running: { bg: '#dbeafe', text: '#1d4ed8', border: '#93c5fd', symbol: '↻' },
  warning: { bg: '#fef3c7', text: '#b45309', border: '#fcd34d', symbol: '!' },
};

const SLA_STYLE = {
  ok:        { bg: '#dcfce7', text: '#166534', border: '#86efac' },
  'at-risk': { bg: '#fef3c7', text: '#b45309', border: '#fcd34d' },
  breached:  { bg: '#fee2e2', text: '#b91c1c', border: '#fca5a5' },
};

const TICKET_TYPE_ICON = {
  bug:        '🐛',
  feature:    '⭐',
  hotfix:     '🔥',
  'tech-debt':'🔧',
  spike:      '🔍',
};

function Badge({ label, style }) {
  return (
    <span
      className="es-badge"
      style={{
        background: style.bg,
        color: style.text,
        border: `1px solid ${style.border}`,
      }}
    >
      {label}
    </span>
  );
}

function HealthDot({ color, title }) {
  return (
    <span
      className="es-health-dot"
      title={title}
      style={{ background: color }}
    />
  );
}

function ImpactBar({ value }) {
  const pct = Math.max(0, Math.min(100, value || 0));
  const color = pct > 66 ? '#b91c1c' : pct > 33 ? '#d97706' : '#2f756e';
  return (
    <div className="es-impact-track">
      <div
        className="es-impact-fill"
        style={{ width: `${pct}%`, background: color }}
      />
    </div>
  );
}

// ── CompanyCard ───────────────────────────────────────────────────────────────

function CompanyCard({ company, onJoin }) {
  const diffStyle = DIFFICULTY_STYLE[company.difficulty] || DIFFICULTY_STYLE.Beginner;
  const stackToShow = (company.stack || []).slice(0, 4);

  return (
    <div
      className="es-company-card"
      style={{ '--company-color': company.color }}
    >
      <div className="es-company-card-top">
        <span className="es-company-icon" aria-hidden="true">{company.icon}</span>
        <div className="es-company-name-row">
          <h3 className="es-company-name">{company.name}</h3>
          <span className="es-company-industry">{company.industry}</span>
        </div>
        <Badge label={company.difficulty} style={diffStyle} />
      </div>

      <p className="es-company-tagline">{company.tagline}</p>
      <p className="es-company-desc">{company.description}</p>

      <div className="es-company-meta">
        <span className="es-company-team">👥 {company.teamSize} engineers</span>
      </div>

      <div className="es-stack-pills">
        {stackToShow.map(tech => (
          <span key={tech} className="es-stack-pill">{tech}</span>
        ))}
        {(company.stack || []).length > 4 && (
          <span className="es-stack-pill es-stack-more">+{company.stack.length - 4}</span>
        )}
      </div>

      <button
        type="button"
        className="es-join-btn"
        style={{ '--company-color': company.color }}
        onClick={() => onJoin(company.id)}
      >
        Join as Junior DE →
      </button>
    </div>
  );
}

// ── CompanyLobby ──────────────────────────────────────────────────────────────

function CompanyLobby({ onJoin }) {
  return (
    <div className="es-lobby">
      <div className="es-lobby-hero">
        <h3 className="es-lobby-heading">Choose Your Company</h3>
        <p className="es-lobby-sub">
          Your engineering career starts here. Each company is a complete data platform
          simulation with real incidents, real tickets, and real architecture decisions.
        </p>
      </div>
      <div className="es-company-grid">
        {COMPANIES.map(company => (
          <CompanyCard key={company.id} company={company} onJoin={onJoin} />
        ))}
      </div>
    </div>
  );
}

// ── Tab: Standup ──────────────────────────────────────────────────────────────

function StandupTab({ company }) {
  const objectives = [
    ...((company.jiraTickets || []).slice(0, 3).map(t => `Work on: ${t.title}`)),
    'Check pipeline health in monitoring',
  ];

  return (
    <div className="es-standup">
      <h3 className="es-standup-greeting">Good morning, Engineer! Here's your day.</h3>

      <div className="es-standup-section">
        <h4 className="es-standup-section-title">Team Status</h4>
        <div className="es-team-grid">
          {(company.orgChart || []).map((member, i) => (
            <div key={i} className="es-team-card">
              <span className="es-team-avatar" aria-hidden="true">{member.avatar}</span>
              <div className="es-team-info">
                <span className="es-team-name">{member.name}</span>
                <span className="es-team-role">{member.role}</span>
                <span className="es-team-relation">{member.relation}</span>
              </div>
              <span className="es-status-dot" style={{ background: '#2f756e' }} />
            </div>
          ))}
        </div>
      </div>

      <div className="es-standup-section">
        <h4 className="es-standup-section-title">Your Objectives Today</h4>
        <ul className="es-objectives-list">
          {objectives.map((obj, i) => (
            <li key={i} className="es-objective-item">
              <span className="es-objective-bullet" style={{ color: '#2f756e' }}>▸</span>
              {obj}
            </li>
          ))}
        </ul>
      </div>

      <div className="es-standup-section">
        <h4 className="es-standup-section-title">KPI Status</h4>
        <div className="es-kpi-grid">
          {(company.kpis || []).map((kpi, i) => {
            const statusColor = kpi.status === 'good' ? '#2f756e' : kpi.status === 'warning' ? '#d97706' : '#dc2626';
            return (
              <div key={i} className="es-kpi-card">
                <div className="es-kpi-header">
                  <span className="es-kpi-name">{kpi.name}</span>
                  <span className="es-kpi-dot" style={{ background: statusColor }} />
                </div>
                <div className="es-kpi-values">
                  <span className="es-kpi-current">{kpi.current}</span>
                  <span className="es-kpi-target">/ {kpi.target}</span>
                </div>
                <span className="es-kpi-status" style={{ color: statusColor }}>{kpi.status}</span>
              </div>
            );
          })}
        </div>
      </div>

      <div className="es-standup-section">
        <h4 className="es-standup-section-title">SLA Overview</h4>
        <div className="es-sla-table-wrap">
          <table className="es-sla-table">
            <thead>
              <tr>
                <th>Pipeline</th>
                <th>SLA Target</th>
                <th>Current</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {(company.slas || []).map((sla, i) => {
                const s = SLA_STYLE[sla.status] || SLA_STYLE.ok;
                return (
                  <tr key={i} className={i % 2 === 1 ? 'es-tr-alt' : ''}>
                    <td>{sla.pipeline}</td>
                    <td>{sla.sla}</td>
                    <td>{sla.current}</td>
                    <td>
                      <span
                        className="es-badge"
                        style={{ background: s.bg, color: s.text, border: `1px solid ${s.border}` }}
                      >
                        {sla.status}
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

// ── Tab: Tickets ──────────────────────────────────────────────────────────────

function TicketsTab({ company, completedTickets, onCompleteTicket }) {
  const [selectedId, setSelectedId] = useState(
    company.jiraTickets && company.jiraTickets.length > 0
      ? company.jiraTickets[0].id
      : null
  );
  const [ticketChecks, setTicketChecks] = useState({});
  const [justCompleted, setJustCompleted] = useState(null);

  const tickets = company.jiraTickets || [];
  const done = completedTickets[company.id] || [];
  const selectedTicket = tickets.find(t => t.id === selectedId) || tickets[0];

  const checks = ticketChecks[selectedId] || [];
  const criteria = selectedTicket ? (selectedTicket.acceptanceCriteria || []) : [];
  const allChecked = criteria.length > 0 && criteria.every((_, i) => checks[i]);
  const isDone = done.includes(selectedId);

  function toggleCheck(i) {
    setTicketChecks(prev => {
      const arr = prev[selectedId] ? [...prev[selectedId]] : [];
      arr[i] = !arr[i];
      return { ...prev, [selectedId]: arr };
    });
  }

  function handleComplete() {
    onCompleteTicket(company.id, selectedId);
    setJustCompleted(selectedId);
    setTimeout(() => setJustCompleted(null), 3000);
  }

  return (
    <div className="es-tickets-layout">
      {/* Sidebar */}
      <div className="es-ticket-sidebar">
        {tickets.map(ticket => {
          const isSelected = ticket.id === selectedId;
          const isTicketDone = done.includes(ticket.id);
          const pStyle = PRIORITY_STYLE[ticket.priority] || PRIORITY_STYLE.P4;
          const typeIcon = TICKET_TYPE_ICON[ticket.type] || '📋';

          return (
            <button
              key={ticket.id}
              type="button"
              className={[
                'es-ticket-row',
                isSelected ? 'es-ticket-row-active' : '',
                isTicketDone ? 'es-ticket-row-done' : '',
              ].filter(Boolean).join(' ')}
              onClick={() => setSelectedId(ticket.id)}
            >
              <div className="es-ticket-row-top">
                <span className="es-ticket-id">{ticket.id}</span>
                <span
                  className="es-badge"
                  style={{ background: pStyle.bg, color: pStyle.text, border: `1px solid ${pStyle.border}` }}
                >
                  {ticket.priority}
                </span>
                {isTicketDone && <span className="es-ticket-done-check">✓</span>}
              </div>
              <div className="es-ticket-row-title">
                <span className="es-ticket-type-icon">{typeIcon}</span>
                <span className={isTicketDone ? 'es-ticket-title-done' : 'es-ticket-title'}>
                  {ticket.title}
                </span>
              </div>
              {ticket.effort && (
                <span className="es-effort-pill">{ticket.effort}</span>
              )}
            </button>
          );
        })}
      </div>

      {/* Detail panel */}
      {selectedTicket && (
        <div className="es-ticket-detail">
          <div className="es-ticket-detail-header">
            <span className="es-ticket-detail-id">{selectedTicket.id}</span>
            <span className="es-ticket-type-badge">
              {TICKET_TYPE_ICON[selectedTicket.type] || '📋'} {selectedTicket.type}
            </span>
            {(() => {
              const ps = PRIORITY_STYLE[selectedTicket.priority] || PRIORITY_STYLE.P4;
              return (
                <span
                  className="es-badge"
                  style={{ background: ps.bg, color: ps.text, border: `1px solid ${ps.border}` }}
                >
                  {selectedTicket.priority}
                </span>
              );
            })()}
          </div>

          <h3 className="es-ticket-detail-title">{selectedTicket.title}</h3>
          <p className="es-ticket-detail-desc">{selectedTicket.description}</p>

          {criteria.length > 0 && (
            <div className="es-acceptance-section">
              <h4 className="es-acceptance-title">Acceptance Criteria</h4>
              <ul className="es-acceptance-list">
                {criteria.map((crit, i) => (
                  <li key={i} className="es-acceptance-item">
                    <label className="es-acceptance-label">
                      <input
                        type="checkbox"
                        className="es-acceptance-check"
                        checked={!!checks[i]}
                        onChange={() => toggleCheck(i)}
                        disabled={isDone}
                      />
                      <span className={checks[i] ? 'es-acceptance-text es-acceptance-text-done' : 'es-acceptance-text'}>
                        {crit}
                      </span>
                    </label>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {selectedTicket.businessImpact && (
            <div className="es-business-impact">
              <span className="es-impact-label">Business Impact</span>
              <p className="es-impact-text">{selectedTicket.businessImpact}</p>
            </div>
          )}

          {selectedTicket.tags && selectedTicket.tags.length > 0 && (
            <div className="es-ticket-tags">
              {selectedTicket.tags.map(tag => (
                <span key={tag} className="es-tag-pill">{tag}</span>
              ))}
            </div>
          )}

          {selectedTicket.effort && (
            <p className="es-ticket-effort">
              <span className="es-effort-label">Effort:</span> {selectedTicket.effort}
            </p>
          )}

          {/* Complete / Done states */}
          {isDone || justCompleted === selectedId ? (
            <div className="es-ticket-resolved">
              <span className="es-resolved-icon">✓</span>
              <span className="es-resolved-text">Ticket Resolved!</span>
            </div>
          ) : (
            <button
              type="button"
              className="es-complete-btn"
              disabled={!allChecked}
              onClick={handleComplete}
            >
              Mark Complete
            </button>
          )}
        </div>
      )}
    </div>
  );
}

// ── Tab: Slack ────────────────────────────────────────────────────────────────

function SlackTab({ company }) {
  const messages = company.slackMessages || [];
  const channels = [...new Set(messages.map(m => m.channel))];
  const [activeChannel, setActiveChannel] = useState(channels[0] || 'general');
  const [repliedIds, setRepliedIds] = useState({});

  const filtered = messages.filter(m => m.channel === activeChannel);

  function handleReply(id) {
    setRepliedIds(prev => ({ ...prev, [id]: true }));
    setTimeout(() => setRepliedIds(prev => ({ ...prev, [id]: false })), 1500);
  }

  return (
    <div className="es-slack">
      {/* Channel tabs */}
      <div className="es-slack-channels">
        {channels.map(ch => (
          <button
            key={ch}
            type="button"
            className={activeChannel === ch ? 'es-channel-tab es-channel-tab-active' : 'es-channel-tab'}
            onClick={() => setActiveChannel(ch)}
          >
            #{ch}
          </button>
        ))}
      </div>

      {/* Messages area */}
      <div className="es-slack-messages">
        {/* Pinned join message */}
        <div className="es-slack-system-msg">
          You joined #{activeChannel}
        </div>

        {filtered.map(msg => (
          <div
            key={msg.id}
            className={[
              'es-slack-msg',
              msg.isUrgent ? 'es-slack-msg-urgent' : '',
              msg.isAlert ? 'es-slack-msg-alert' : '',
            ].filter(Boolean).join(' ')}
          >
            <span className="es-msg-avatar" aria-hidden="true">{msg.avatar}</span>
            <div className="es-msg-body">
              <div className="es-msg-meta">
                <strong className="es-msg-author">{msg.author}</strong>
                <span className="es-msg-role">{msg.authorRole}</span>
                <span className="es-msg-time">{msg.time}</span>
              </div>
              {msg.isAlert ? (
                <pre className="es-msg-alert-text">{msg.text}</pre>
              ) : (
                <p className="es-msg-text">{msg.text}</p>
              )}
              <button
                type="button"
                className="es-reply-btn"
                onClick={() => handleReply(msg.id)}
              >
                {repliedIds[msg.id] ? '✓ Replied' : '↩ Reply'}
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ── Tab: Pipeline ─────────────────────────────────────────────────────────────

function PipelineTab({ company }) {
  const [logPipelineId, setLogPipelineId] = useState(null);
  const pipelines = company.pipelines || [];
  const sources = company.dataSources || [];

  const running = pipelines.filter(p => p.status === 'running').length;
  const failed  = pipelines.filter(p => p.status === 'failed' || p.status === 'warning').length;
  const healthy = pipelines.filter(p => p.status === 'success').length;

  const logPipeline = pipelines.find(p => p.id === logPipelineId);

  const fakeLogs = logPipeline
    ? [
        `[ERROR] ${logPipeline.name}: Connection timeout after 30s — retrying (1/3)`,
        `[WARN]  ${logPipeline.name}: Retry failed — upstream source returned 503`,
        `[ERROR] ${logPipeline.name}: Max retries exceeded — pipeline marked as failed`,
      ]
    : [];

  return (
    <div className="es-pipeline">
      {/* Health summary */}
      <div className="es-pipeline-health">
        <div className="es-health-stat es-health-running">
          <span className="es-health-num">{running}</span>
          <span className="es-health-label">Running</span>
        </div>
        <div className="es-health-stat es-health-failed">
          <span className="es-health-num">{failed}</span>
          <span className="es-health-label">Failed / Warning</span>
        </div>
        <div className="es-health-stat es-health-ok">
          <span className="es-health-num">{healthy}</span>
          <span className="es-health-label">Healthy</span>
        </div>
      </div>

      {/* Log view */}
      {logPipelineId && (
        <div className="es-log-view">
          <div className="es-log-view-header">
            <span className="es-log-view-title">🔍 Investigating: {logPipeline?.name}</span>
            <button
              type="button"
              className="es-log-close-btn"
              onClick={() => setLogPipelineId(null)}
            >
              ✕ Close
            </button>
          </div>
          <div className="es-log-lines">
            {fakeLogs.map((line, i) => (
              <div key={i} className="es-log-line">{line}</div>
            ))}
          </div>
        </div>
      )}

      {/* Pipeline table */}
      <div className="es-pipeline-table-wrap">
        <table className="es-pipeline-table">
          <thead>
            <tr>
              <th>Name</th>
              <th>Schedule</th>
              <th>Last Run</th>
              <th>Status</th>
              <th>Duration</th>
              <th>Records</th>
              <th>SLA</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {pipelines.map((p, i) => {
              const ss = STATUS_STYLE[p.status] || STATUS_STYLE.warning;
              const slaSt = SLA_STYLE[p.slaStatus] || SLA_STYLE.ok;
              const isFailed = p.status === 'failed' || p.status === 'warning';
              return (
                <tr key={p.id} className={i % 2 === 1 ? 'es-tr-alt' : ''}>
                  <td className="es-pipeline-name">{p.name}</td>
                  <td>{p.schedule}</td>
                  <td>{p.lastRun}</td>
                  <td>
                    <span
                      className={p.status === 'running' ? 'es-badge es-badge-spin' : 'es-badge'}
                      style={{ background: ss.bg, color: ss.text, border: `1px solid ${ss.border}` }}
                    >
                      {ss.symbol} {p.status}
                    </span>
                  </td>
                  <td>{p.duration}</td>
                  <td>{p.records}</td>
                  <td>
                    <span
                      className="es-badge"
                      style={{ background: slaSt.bg, color: slaSt.text, border: `1px solid ${slaSt.border}` }}
                    >
                      {p.slaStatus}
                    </span>
                  </td>
                  <td>
                    {isFailed && (
                      <button
                        type="button"
                        className="es-investigate-btn"
                        onClick={() => setLogPipelineId(p.id)}
                      >
                        🔍 Investigate
                      </button>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Data Sources */}
      <h4 className="es-sources-heading">Data Sources</h4>
      <div className="es-sources-grid">
        {sources.map((src, i) => (
          <div key={i} className="es-source-card">
            <div className="es-source-card-top">
              <span className="es-source-name">{src.name}</span>
              <span className="es-source-type-badge">{src.type}</span>
            </div>
            <div className="es-source-detail">
              <span className="es-source-volume">{src.volume}</span>
              <span className="es-source-method">{src.ingestionMethod}</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ── Tab: Architecture ─────────────────────────────────────────────────────────

function ArchitectureTab({ company, decisions, onChoose }) {
  const allDecisions = company.architectureDecisions || [];
  const [currentIndex, setCurrentIndex] = useState(0);

  const decision = allDecisions[currentIndex];
  const allDone = allDecisions.every(d => decisions[`${company.id}_${d.id}`] !== undefined);

  if (!decision) {
    return (
      <div className="es-arch-empty">
        <p>No architecture decisions available for this company.</p>
      </div>
    );
  }

  const savedChoice = decisions[`${company.id}_${decision.id}`];
  const hasChosen = savedChoice !== undefined && savedChoice !== null;

  if (allDone) {
    return (
      <div className="es-arch-summary">
        <h3 className="es-arch-summary-title">Architecture Decisions Complete</h3>
        <p className="es-arch-summary-sub">You made decisions on {allDecisions.length} architectural challenges.</p>
        <div className="es-arch-summary-list">
          {allDecisions.map((d, idx) => {
            const myChoice = decisions[`${company.id}_${d.id}`];
            const myOption = d.options && d.options[myChoice];
            const isRecommended = myChoice === d.recommendedOption;
            return (
              <div key={d.id} className="es-arch-summary-row">
                <div className="es-arch-summary-row-left">
                  <span className="es-arch-badge">Decision #{idx + 1}</span>
                  <span className="es-arch-summary-title-text">{d.title}</span>
                </div>
                <div className="es-arch-summary-row-right">
                  <span className="es-arch-chosen-label">You chose:</span>
                  <span className="es-arch-chosen">{myOption ? myOption.label : 'N/A'}</span>
                  {isRecommended ? (
                    <span className="es-arch-match">✓ Matches recommended</span>
                  ) : (
                    <span className="es-arch-mismatch">
                      Recommended: {d.options && d.options[d.recommendedOption] ? d.options[d.recommendedOption].label : 'N/A'}
                    </span>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    );
  }

  return (
    <div className="es-arch">
      {/* Challenge header */}
      <div className="es-arch-header">
        <span className="es-arch-badge">Architecture Decision #{currentIndex + 1} of {allDecisions.length}</span>
        <h3 className="es-arch-title">{decision.title}</h3>
        <p className="es-arch-context">{decision.context}</p>
      </div>

      {/* Options */}
      <div className="es-arch-options">
        {(decision.options || []).map((opt, optIdx) => {
          const isChosen = hasChosen && savedChoice === optIdx;
          const isRecommended = decision.recommendedOption === optIdx;
          const impact = opt.impact || {};

          return (
            <div
              key={optIdx}
              className={[
                'es-arch-option',
                isChosen ? 'es-arch-option-chosen' : '',
                hasChosen && isRecommended ? 'es-arch-option-recommended' : '',
              ].filter(Boolean).join(' ')}
            >
              <div className="es-arch-option-header">
                <span className="es-arch-option-label">{opt.label}</span>
                {hasChosen && isChosen && <span className="es-arch-your-choice">Your Choice</span>}
                {hasChosen && isRecommended && <span className="es-arch-recommended-tag">Recommended</span>}
              </div>

              {opt.pros && opt.pros.length > 0 && (
                <ul className="es-arch-pros">
                  {opt.pros.map((pro, pi) => (
                    <li key={pi} className="es-arch-pro-item">
                      <span className="es-pro-mark">✓</span> {pro}
                    </li>
                  ))}
                </ul>
              )}

              {opt.cons && opt.cons.length > 0 && (
                <ul className="es-arch-cons">
                  {opt.cons.map((con, ci) => (
                    <li key={ci} className="es-arch-con-item">
                      <span className="es-con-mark">✗</span> {con}
                    </li>
                  ))}
                </ul>
              )}

              {/* Impact bars */}
              <div className="es-impact-section">
                {[
                  ['Cost',        impact.cost],
                  ['Performance', impact.performance],
                  ['Reliability', impact.reliability],
                  ['Complexity',  impact.complexity],
                ].map(([label, val]) => (
                  <div key={label} className="es-impact-row">
                    <span className="es-impact-label">{label}</span>
                    <ImpactBar value={val} />
                    <span className="es-impact-num">{val || 0}</span>
                  </div>
                ))}
              </div>

              {!hasChosen && (
                <button
                  type="button"
                  className="es-choose-btn"
                  onClick={() => onChoose(company.id, decision.id, optIdx)}
                >
                  Choose This Approach
                </button>
              )}
            </div>
          );
        })}
      </div>

      {/* Rationale (after choosing) */}
      {hasChosen && (
        <div className="es-arch-rationale">
          <h4 className="es-rationale-title">Expert Rationale</h4>
          <p className="es-rationale-text">{decision.rationale}</p>
        </div>
      )}

      {/* Next button */}
      {hasChosen && currentIndex < allDecisions.length - 1 && (
        <div className="es-arch-next-row">
          <button
            type="button"
            className="es-arch-next-btn"
            onClick={() => setCurrentIndex(i => i + 1)}
          >
            Next Decision →
          </button>
        </div>
      )}

      {hasChosen && currentIndex === allDecisions.length - 1 && (
        <div className="es-arch-next-row">
          <button
            type="button"
            className="es-arch-next-btn"
            onClick={() => setCurrentIndex(0)}
          >
            Review All Decisions
          </button>
        </div>
      )}
    </div>
  );
}

// ── CareerPanel ───────────────────────────────────────────────────────────────

function CareerPanel({ completedTickets, companyId }) {
  const done = completedTickets[companyId] || [];
  const count = done.length;
  const xp = count * 20;
  const xpForNext = 100;
  const progressPct = Math.min(100, Math.round((xp / xpForNext) * 100));

  return (
    <div className="es-career-panel">
      <div className="es-career-role">
        <span className="es-career-role-badge">Junior Data Engineer</span>
      </div>

      <div className="es-career-xp">
        <div className="es-xp-label-row">
          <span className="es-xp-label">XP: {xp} / {xpForNext}</span>
          <span className="es-xp-next">Next: Data Engineer (5 tickets)</span>
        </div>
        <div className="es-xp-track">
          <div
            className="es-xp-fill"
            style={{ width: `${progressPct}%`, background: '#2f756e' }}
          />
        </div>
      </div>

      <div className="es-career-count">
        <span className="es-career-num">{count}</span>
        <span className="es-career-count-label">tickets completed today</span>
      </div>

      {count >= 3 && (
        <div className="es-promo-tip">
          You're on track for a promotion review!
        </div>
      )}
    </div>
  );
}

// ── CommandCenter ─────────────────────────────────────────────────────────────

function CommandCenter({ company, completedTickets, decisions, onBack, onCompleteTicket, onChooseArch }) {
  const [tab, setTab] = useState('standup');

  const TABS = [
    { id: 'standup',      label: 'Standup' },
    { id: 'tickets',      label: 'Tickets' },
    { id: 'slack',        label: 'Slack' },
    { id: 'pipeline',     label: 'Pipeline' },
    { id: 'architecture', label: 'Architecture' },
  ];

  // Compute health indicators
  const pipelines = company.pipelines || [];
  const hasFailed  = pipelines.some(p => p.status === 'failed');
  const hasWarning = pipelines.some(p => p.status === 'warning');
  const pipelineHealthColor = hasFailed ? '#dc2626' : hasWarning ? '#d97706' : '#2f756e';

  const slas = company.slas || [];
  const hasBreached = slas.some(s => s.status === 'breached');
  const hasAtRisk   = slas.some(s => s.status === 'at-risk');
  const slaColor = hasBreached ? '#dc2626' : hasAtRisk ? '#d97706' : '#2f756e';

  const messages = company.slackMessages || [];
  const alertCount = messages.filter(m => m.isAlert || m.isUrgent).length;

  const today = new Date().toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' });

  return (
    <div className="es-command-center">
      {/* Top bar */}
      <div className="es-topbar">
        <div className="es-topbar-left">
          <span className="es-topbar-icon" aria-hidden="true">{company.icon}</span>
          <div>
            <span className="es-topbar-company">{company.name}</span>
            <button type="button" className="es-back-btn" onClick={onBack}>
              ← Back to Companies
            </button>
          </div>
        </div>

        <div className="es-topbar-center">
          <span className="es-day-badge">Day 1</span>
          <span className="es-role-badge">Junior Data Engineer</span>
          <span className="es-topbar-date">{today}</span>
        </div>

        <div className="es-topbar-right">
          <HealthDot color={pipelineHealthColor} title="Pipeline Health" />
          <HealthDot color={slaColor} title="SLA Status" />
          <span
            className="es-alert-count"
            style={{ background: alertCount > 0 ? '#fee2e2' : 'var(--surface-soft)', color: alertCount > 0 ? '#b91c1c' : 'var(--muted)' }}
          >
            {alertCount} alerts
          </span>
        </div>
      </div>

      {/* Briefing */}
      {company.todaysBriefing && (
        <div className="es-briefing">
          <span className="es-briefing-label">Today's Briefing</span>
          <p className="es-briefing-text">{company.todaysBriefing}</p>
        </div>
      )}

      {/* Tab nav */}
      <div className="es-tabs" role="tablist">
        {TABS.map(t => (
          <button
            key={t.id}
            type="button"
            role="tab"
            aria-selected={tab === t.id}
            className={tab === t.id ? 'es-tab es-tab-active' : 'es-tab'}
            style={tab === t.id ? { '--active-color': company.color } : {}}
            onClick={() => setTab(t.id)}
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* Tab panels */}
      <div className="es-tab-panel">
        {tab === 'standup'      && <StandupTab company={company} />}
        {tab === 'tickets'      && (
          <TicketsTab
            company={company}
            completedTickets={completedTickets}
            onCompleteTicket={onCompleteTicket}
          />
        )}
        {tab === 'slack'        && <SlackTab company={company} />}
        {tab === 'pipeline'     && <PipelineTab company={company} />}
        {tab === 'architecture' && (
          <ArchitectureTab
            company={company}
            decisions={decisions}
            onChoose={onChooseArch}
          />
        )}
      </div>

      {/* Career panel */}
      <CareerPanel completedTickets={completedTickets} companyId={company.id} />
    </div>
  );
}

// ── Root export ───────────────────────────────────────────────────────────────

export const EnterpriseSimulator = memo(function EnterpriseSimulator() {
  const [storedCompanyId, setStoredCompanyId] = useLocalStorage('dem-enterprise-company', null);
  const [completedTickets, setCompletedTickets] = useLocalStorage('dem-enterprise-tickets', {});
  const [decisions, setDecisions] = useLocalStorage('dem-enterprise-decisions', {});
  const [, setCareerStats] = useLocalStorage('dem-enterprise-career', {
    level: 0, xp: 0, completedToday: 0,
  });

  const [companyId, setCompanyId] = useState(storedCompanyId);

  const company = COMPANIES.find(c => c.id === companyId) || null;

  const handleJoin = useCallback((id) => {
    setCompanyId(id);
    setStoredCompanyId(id);
  }, [setStoredCompanyId]);

  const handleBack = useCallback(() => {
    setStoredCompanyId(null);
    setCompanyId(null);
  }, [setStoredCompanyId]);

  const handleCompleteTicket = useCallback((cId, ticketId) => {
    setCompletedTickets(prev => {
      const arr = prev[cId] ? [...prev[cId]] : [];
      if (arr.includes(ticketId)) return prev;
      return { ...prev, [cId]: [...arr, ticketId] };
    });
    setCareerStats(prev => ({
      ...prev,
      xp: (prev.xp || 0) + 20,
      completedToday: (prev.completedToday || 0) + 1,
    }));
  }, [setCompletedTickets, setCareerStats]);

  const handleChooseArch = useCallback((cId, decisionId, optionIndex) => {
    const key = `${cId}_${decisionId}`;
    setDecisions(prev => ({ ...prev, [key]: optionIndex }));
  }, [setDecisions]);

  return (
    <section id="enterprise" className="section">
      <div className="es-section-header">
        <p className="eyebrow">Flagship Feature</p>
        <h2>Enterprise Simulation</h2>
        <p className="es-section-sub">
          Join a Fortune 500 data team. Work real tickets. Build real systems.
        </p>
      </div>

      {!company ? (
        <CompanyLobby onJoin={handleJoin} />
      ) : (
        <CommandCenter
          company={company}
          completedTickets={completedTickets}
          decisions={decisions}
          onBack={handleBack}
          onCompleteTicket={handleCompleteTicket}
          onChooseArch={handleChooseArch}
        />
      )}
    </section>
  );
});

export default EnterpriseSimulator;
