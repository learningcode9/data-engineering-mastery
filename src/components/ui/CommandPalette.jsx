/**
 * Command Palette — ⌘K / Ctrl+K
 * Global keyboard-driven navigation and quick actions.
 */
import { memo, useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { topics }         from '../../data/topics.js';
import { projectDetails } from '../../data/projectDetails.js';
import { INCIDENTS }      from '../../data/incidents.js';
import useSimulationStore from '../../store/simulationStore.js';

// ─── command registry ─────────────────────────────────────────────────────────

function buildCommands({ onNavigate, startIncident, openInvestigation, activeIncidents }) {
  const nav = (section) => () => onNavigate(section);

  const PAGES = [
    // Core MVP sections
    { id: 'cmd-dash',       label: 'Dashboard',       icon: '⌂', group: 'Navigate', action: nav('dashboard')      },
    { id: 'cmd-topics',     label: 'Learning Topics', icon: '▦', group: 'Navigate', action: nav('topics')         },
    { id: 'cmd-sqllab',     label: 'SQL Lab',         icon: '▤', group: 'Navigate', action: nav('sql-lab')        },
    { id: 'cmd-interview',  label: 'Interview Prep',  icon: '◌', group: 'Navigate', action: nav('interview-prep') },
    { id: 'cmd-projects',   label: 'Projects',        icon: '▣', group: 'Navigate', action: nav('projects')       },
    { id: 'cmd-roadmap',    label: 'Roadmap',         icon: '◇', group: 'Navigate', action: nav('roadmap')        },
    { id: 'cmd-ai',         label: 'AI Learning',     icon: '✦', group: 'Navigate', action: nav('ai-learning')    },
    // Labs — advanced features
    { id: 'cmd-arch',       label: 'Architecture',    icon: '◫', group: 'Labs', action: nav('architecture')  },
    { id: 'cmd-skillgraph', label: 'Skill Graph',     icon: '◉', group: 'Labs', action: nav('skill-graph')   },
    { id: 'cmd-incidents',  label: 'Incident Lab',    icon: '⊗', group: 'Labs', action: nav('incidents')     },
    { id: 'cmd-enterprise', label: 'Enterprise Sim',  icon: '◈', group: 'Labs', action: nav('enterprise')    },
    { id: 'cmd-warroom',    label: 'War Room',        icon: '⊘', group: 'Labs', action: nav('war-room')      },
    { id: 'cmd-standup',    label: 'Daily Standup',   icon: '◷', group: 'Labs', action: nav('standup')       },
    { id: 'cmd-databricks', label: 'Databricks NB',   icon: '⚡', group: 'Labs', action: nav('databricks')    },
    { id: 'cmd-analytics',  label: 'Analytics',       icon: '▧', group: 'Labs', action: nav('analytics')     },
  ];

  const TOPIC_CMDS = topics.map(t => ({
    id:     `topic-${t.id}`,
    label:  `Study: ${t.title}`,
    icon:   '▦',
    group:  'Topics',
    action: () => { onNavigate('topics'); },
    meta:   t.subtitle,
  }));

  const INCIDENT_CMDS = INCIDENTS.map(inc => ({
    id:     `inc-${inc.id}`,
    label:  `${inc.severity}: ${inc.title}`,
    icon:   inc.icon || '🔴',
    group:  'Incidents',
    action: () => {
      const existing = activeIncidents.find(a => a.incidentId === inc.id);
      if (existing) {
        openInvestigation(existing.uid);
      } else {
        const uid = startIncident(inc.id, inc.severity);
        openInvestigation(uid);
      }
    },
    meta: inc.tool,
  }));

  const PROJECT_CMDS = projectDetails.slice(0, 6).map(p => ({
    id:     `proj-${p.id || p.title}`,
    label:  `Project: ${p.title}`,
    icon:   '▣',
    group:  'Projects',
    action: nav('projects'),
    meta:   p.stack?.slice(0, 2).join(' · '),
  }));

  const ACTION_CMDS = [
    {
      id: 'act-launch-p1',
      label: 'Launch P1 Incident: ADF Schema Drift',
      icon: '🔴',
      group: 'Actions',
      action: () => {
        const uid = startIncident('adf-schema-drift', 'P1');
        openInvestigation(uid);
      },
      meta: 'Start live simulation',
    },
    {
      id: 'act-launch-spark',
      label: 'Launch P1 Incident: Spark OOM',
      icon: '🔴',
      group: 'Actions',
      action: () => {
        const uid = startIncident('spark-oom-wide-join', 'P1');
        openInvestigation(uid);
      },
      meta: 'Start live simulation',
    },
    {
      id: 'act-launch-kafka',
      label: 'Launch P2 Incident: Kafka Consumer Lag',
      icon: '🟡',
      group: 'Actions',
      action: () => {
        const uid = startIncident('kafka-consumer-lag', 'P2');
        openInvestigation(uid);
      },
      meta: 'Start live simulation',
    },
    {
      id: 'act-standup',
      label: 'Open Today\'s Standup',
      icon: '◷',
      group: 'Actions',
      action: nav('standup'),
      meta: 'Daily engineering standup',
    },
    {
      id: 'act-enterprise',
      label: 'Join Enterprise Simulator',
      icon: '◈',
      group: 'Actions',
      action: nav('enterprise'),
      meta: 'ShopSphere · FinVerse · MediFlow',
    },
  ];

  return [...PAGES, ...ACTION_CMDS, ...INCIDENT_CMDS, ...TOPIC_CMDS, ...PROJECT_CMDS];
}

// ─── highlight matching text ──────────────────────────────────────────────────

function Highlight({ text, query }) {
  if (!query) return <>{text}</>;
  const idx = text.toLowerCase().indexOf(query.toLowerCase());
  if (idx === -1) return <>{text}</>;
  return (
    <>
      {text.slice(0, idx)}
      <mark className="cp-highlight">{text.slice(idx, idx + query.length)}</mark>
      {text.slice(idx + query.length)}
    </>
  );
}

// ─── main component ───────────────────────────────────────────────────────────

export const CommandPalette = memo(function CommandPalette({ isOpen, onClose, onNavigate }) {
  const [query, setQuery]         = useState('');
  const [cursor, setCursor]       = useState(0);
  const inputRef                  = useRef(null);
  const listRef                   = useRef(null);

  const startIncident     = useSimulationStore(s => s.startIncident);
  const openInvestigation = useSimulationStore(s => s.openInvestigation);
  const activeIncidents   = useSimulationStore(s => s.activeIncidents);

  const allCommands = useMemo(
    () => buildCommands({ onNavigate, startIncident, openInvestigation, activeIncidents }),
    [onNavigate, startIncident, openInvestigation, activeIncidents]
  );

  const filtered = useMemo(() => {
    if (!query.trim()) return allCommands.slice(0, 12);
    const q = query.toLowerCase();
    return allCommands
      .filter(c => c.label.toLowerCase().includes(q) || c.group.toLowerCase().includes(q) || c.meta?.toLowerCase().includes(q))
      .slice(0, 16);
  }, [query, allCommands]);

  // Group filtered results
  const grouped = useMemo(() => {
    const map = new Map();
    for (const cmd of filtered) {
      if (!map.has(cmd.group)) map.set(cmd.group, []);
      map.get(cmd.group).push(cmd);
    }
    return map;
  }, [filtered]);

  // Flat index for keyboard nav
  const flatList = filtered;

  const handleClose = useCallback(() => {
    setQuery('');
    setCursor(0);
    onClose();
  }, [onClose]);

  const runCommand = useCallback((cmd) => {
    cmd.action?.();
    setQuery('');
    setCursor(0);
    onClose();
  }, [onClose]);

  useEffect(() => {
    if (isOpen) {
      setTimeout(() => inputRef.current?.focus(), 40);
    }
  }, [isOpen]);

  useEffect(() => {
    if (!isOpen) return;
    function onKeyDown(e) {
      if (e.key === 'Escape') { handleClose(); return; }
      if (e.key === 'ArrowDown') {
        e.preventDefault();
        setCursor(c => Math.min(c + 1, flatList.length - 1));
      }
      if (e.key === 'ArrowUp') {
        e.preventDefault();
        setCursor(c => Math.max(c - 1, 0));
      }
      if (e.key === 'Enter') {
        e.preventDefault();
        const cmd = flatList[cursor];
        if (cmd) runCommand(cmd);
      }
    }
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [isOpen, cursor, flatList, handleClose, runCommand]);

  // Scroll active item into view
  useEffect(() => {
    const el = listRef.current?.querySelector('.cp-item--active');
    el?.scrollIntoView({ block: 'nearest' });
  }, [cursor]);

  if (!isOpen) return null;

  let globalIdx = 0;

  return (
    <div className="cp-overlay" onClick={handleClose} role="dialog" aria-modal aria-label="Command palette">
      <div className="cp-panel" onClick={e => e.stopPropagation()}>
        {/* Search input */}
        <div className="cp-input-wrap">
          <span className="cp-search-icon" aria-hidden="true">⌕</span>
          <input
            ref={inputRef}
            className="cp-input"
            placeholder="Type a command or search…"
            value={query}
            onChange={e => { setQuery(e.target.value); setCursor(0); }}
            autoComplete="off"
            spellCheck={false}
          />
          <kbd className="cp-esc-hint">esc</kbd>
        </div>

        {/* Results */}
        <div className="cp-list" ref={listRef} role="listbox">
          {filtered.length === 0 && (
            <div className="cp-empty">No commands match "{query}"</div>
          )}
          {[...grouped.entries()].map(([group, cmds]) => (
            <div key={group} className="cp-group">
              <p className="cp-group-label">{group}</p>
              {cmds.map(cmd => {
                const idx     = globalIdx++;
                const isActive = idx === cursor;
                return (
                  <div
                    key={cmd.id}
                    className={`cp-item${isActive ? ' cp-item--active' : ''}`}
                    role="option"
                    aria-selected={isActive}
                    onClick={() => runCommand(cmd)}
                    onMouseEnter={() => setCursor(idx)}
                  >
                    <span className="cp-item-icon" aria-hidden="true">{cmd.icon}</span>
                    <span className="cp-item-label">
                      <Highlight text={cmd.label} query={query} />
                    </span>
                    {cmd.meta && (
                      <span className="cp-item-meta">{cmd.meta}</span>
                    )}
                    {isActive && <span className="cp-item-enter" aria-hidden="true">↵</span>}
                  </div>
                );
              })}
            </div>
          ))}
        </div>

        {/* Footer */}
        <div className="cp-footer">
          <span className="cp-footer-hint"><kbd>↑↓</kbd> navigate</span>
          <span className="cp-footer-hint"><kbd>↵</kbd> select</span>
          <span className="cp-footer-hint"><kbd>esc</kbd> close</span>
          <span className="cp-footer-spacer" />
          <span className="cp-footer-count">{filtered.length} result{filtered.length !== 1 ? 's' : ''}</span>
        </div>
      </div>
    </div>
  );
});

export default CommandPalette;
