/**
 * InvestigationWorkspace — Flagship incident investigation overlay.
 * Opens full-screen when the user clicks "Investigate" on any active incident.
 */

import { memo, useState, useEffect, useCallback, useMemo, useRef } from 'react';
import useSimulationStore, {
  FIX_OPTIONS,
  SLA_MINUTES,
  CASCADE_MAP,
} from '../../store/simulationStore.js';
import { INCIDENTS } from '../../data/incidents.js';

// ─── helpers ─────────────────────────────────────────────────────────────────

function fmtElapsed(ms) {
  const totalSec = Math.floor(ms / 1000);
  const h = Math.floor(totalSec / 3600);
  const m = Math.floor((totalSec % 3600) / 60);
  const s = totalSec % 60;
  if (h > 0) return `${h}h ${String(m).padStart(2, '0')}m ${String(s).padStart(2, '0')}s`;
  return `${String(m).padStart(2, '0')}m ${String(s).padStart(2, '0')}s`;
}

function fmtTime(ts) {
  if (!ts) return '';
  const d = new Date(ts);
  return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
}

function parseRuntimeMs(runtime) {
  if (!runtime) return 5000;
  const match = runtime.match(/(\d+)\s*min/);
  if (match) return parseInt(match[1], 10) * 60 * 1000;
  const secMatch = runtime.match(/(\d+)\s*s/);
  if (secMatch) return parseInt(secMatch[1], 10) * 1000;
  return 5000;
}

function severityColor(sev) {
  if (sev === 'P1') return '#ef4444';
  if (sev === 'P2') return '#f59e0b';
  return '#3b82f6';
}

function statusDot(status) {
  if (status === 'critical') return '#ef4444';
  if (status === 'warning')  return '#f59e0b';
  return '#22c55e';
}

const HOURLY_IMPACT = {
  P1: { dollar: 28, users: 55 },
  P2: { dollar: 7.5, users: 14 },
  P3: { dollar: 0.9, users: 1.8 },
};

// ─── sub-components ───────────────────────────────────────────────────────────

// ─── Streaming Logs ───────────────────────────────────────────────────────────

const LOG_LEVEL_COLOR = { ERROR: '#ef4444', WARN: '#f59e0b', INFO: '#60a5fa', DEBUG: '#6b7280' };

function LogsTab({ logs }) {
  const [visible, setVisible]       = useState([]);
  const [paused, setPaused]         = useState(false);
  const [filter, setFilter]         = useState('');
  const [levelFilter, setLevelFilter] = useState('ALL');
  const idxRef    = useRef(0);
  const pausedRef = useRef(false);
  const endRef    = useRef(null);
  const timerRef  = useRef(null);

  useEffect(() => {
    pausedRef.current = paused;
  }, [paused]);

  useEffect(() => {
    idxRef.current = 0;

    function scheduleNext() {
      if (idxRef.current >= logs.length) return;
      const delay = idxRef.current === 0 ? 80 : 220 + Math.random() * 380;
      timerRef.current = setTimeout(() => {
        if (!pausedRef.current) {
          setVisible(v => [...v, logs[idxRef.current]]);
          idxRef.current++;
        }
        scheduleNext();
      }, delay);
    }

    scheduleNext();
    return () => clearTimeout(timerRef.current);
  }, [logs]);

  useEffect(() => {
    if (!paused) endRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [visible, paused]);

  const shown = visible.filter(log => {
    if (levelFilter !== 'ALL' && log.level !== levelFilter) return false;
    if (filter) {
      const q = filter.toLowerCase();
      if (!`${log.msg} ${log.source}`.toLowerCase().includes(q)) return false;
    }
    return true;
  });

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', overflow: 'hidden' }}>
      {/* Log toolbar */}
      <div style={{ display: 'flex', gap: 8, padding: '7px 12px', background: '#0f1923', borderBottom: '1px solid #1e2d3d', flexShrink: 0, alignItems: 'center' }}>
        <button
          onClick={() => setPaused(p => !p)}
          style={{ background: paused ? '#1d4ed820' : '#1e2533', border: `1px solid ${paused ? '#3b82f6' : '#2d3748'}`, borderRadius: 5, color: paused ? '#93c5fd' : '#94a3b8', padding: '3px 10px', fontSize: 11, fontWeight: 600, cursor: 'pointer', minHeight: 0, boxShadow: 'none', transition: 'all 0.14s' }}
        >
          {paused ? '▶ Resume' : '⏸ Pause'}
        </button>
        <select
          value={levelFilter}
          onChange={e => setLevelFilter(e.target.value)}
          style={{ background: '#1e2533', border: '1px solid #2d3748', color: '#94a3b8', borderRadius: 5, padding: '3px 8px', fontSize: 11, cursor: 'pointer', outline: 'none' }}
        >
          <option>ALL</option><option>ERROR</option><option>WARN</option><option>INFO</option>
        </select>
        <input
          placeholder="Filter logs…"
          value={filter}
          onChange={e => setFilter(e.target.value)}
          style={{ background: '#1e2533', border: '1px solid #2d3748', color: '#e2e8f0', borderRadius: 5, padding: '3px 10px', fontSize: 11, flex: 1, outline: 'none' }}
        />
        <span style={{ fontSize: 10, color: '#475569', fontFamily: 'monospace', flexShrink: 0 }}>
          {visible.length}/{logs.length}
        </span>
        {!paused && visible.length < logs.length && (
          <span style={{ width: 6, height: 6, borderRadius: '50%', background: '#22c55e', flexShrink: 0, animation: 'inv-pulse 1s ease-in-out infinite' }} />
        )}
        {paused && <span style={{ fontSize: 10, color: '#f59e0b', fontWeight: 700, flexShrink: 0 }}>PAUSED</span>}
      </div>

      {/* Log lines */}
      <div style={{ flex: 1, overflowY: 'auto', background: '#0d1117', padding: '8px 14px', fontFamily: '"Fira Code","Cascadia Code","Courier New",monospace', fontSize: 11, lineHeight: 1.65 }}>
        {shown.map((log, i) => (
          <div key={i} style={{ display: 'flex', gap: 10, alignItems: 'flex-start', marginBottom: 1, animation: 'invLogIn 0.18s ease both' }}>
            <span style={{ color: '#2d4a62', flexShrink: 0, fontSize: 10, paddingTop: 1, userSelect: 'none' }}>
              {log.time ? log.time.replace('T', ' ').slice(0, 19) : ''}
            </span>
            <span style={{ width: 38, flexShrink: 0, color: LOG_LEVEL_COLOR[log.level] || '#6b7280', fontWeight: 700, fontSize: 10, paddingTop: 1 }}>
              {log.level}
            </span>
            <span style={{ color: '#4b8bbc', flexShrink: 0, maxWidth: 180, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', fontSize: 10, paddingTop: 1 }}>
              {log.source}
            </span>
            <span style={{ color: log.level === 'ERROR' ? '#fca5a5' : log.level === 'WARN' ? '#fde68a' : '#94a3b8', flex: 1, wordBreak: 'break-word', fontSize: 11 }}>
              {log.msg}
            </span>
          </div>
        ))}
        {shown.length === 0 && filter && (
          <div style={{ color: '#475569', fontSize: 12, padding: 8 }}>No log lines match "{filter}"</div>
        )}
        <div ref={endRef} />
      </div>
    </div>
  );
}

// ─── DAG Visualization ────────────────────────────────────────────────────────

const INCIDENT_DAGS = {
  'adf-schema-drift': [
    { id: 'sqldb',   label: 'SQL Server',      type: 'source',    status: 'ok',       note: 'dbo.orders — healthy' },
    { id: 'adf',     label: 'ADF Copy',         type: 'transform', status: 'failed',   note: 'CopyOrdersToSilver ❌' },
    { id: 'bronze',  label: 'Bronze Delta',     type: 'storage',   status: 'stale',    note: 'bronze.orders_raw' },
    { id: 'silver',  label: 'Silver Delta',     type: 'storage',   status: 'stale',    note: 'silver.orders_clean' },
    { id: 'gold',    label: 'Gold Tables',      type: 'storage',   status: 'stale',    note: 'gold.daily_sales' },
    { id: 'powerbi', label: 'Power BI',         type: 'sink',      status: 'stale',    note: '6 reports stale' },
  ],
  'spark-oom-wide-join': [
    { id: 'bronze',    label: 'Delta Bronze',    type: 'source',    status: 'ok',       note: 'events_raw table' },
    { id: 'spark',     label: 'Spark Wide Join', type: 'compute',   status: 'failed',   note: 'OOM — executor GC' },
    { id: 'silver',    label: 'Silver Delta',    type: 'storage',   status: 'stale',    note: 'Not refreshed' },
    { id: 'agg',       label: 'Aggregation',     type: 'transform', status: 'stale',    note: 'Blocked upstream' },
    { id: 'gold',      label: 'Gold Output',     type: 'storage',   status: 'stale',    note: 'Blocked' },
  ],
  'kafka-consumer-lag': [
    { id: 'pg',       label: 'Postgres CDC',    type: 'source',    status: 'ok',       note: 'WAL → Debezium' },
    { id: 'kafka',    label: 'Kafka Topic',     type: 'queue',     status: 'warning',  note: '8M msg backlog' },
    { id: 'consumer', label: 'Consumer Group',  type: 'compute',   status: 'critical', note: 'orders_consumer_v2' },
    { id: 'delta',    label: 'Delta Sink',      type: 'storage',   status: 'stale',    note: '4h behind realtime' },
    { id: 'dash',     label: 'Dashboard',       type: 'sink',      status: 'stale',    note: 'Stale data' },
  ],
};

const DAG_STATUS = {
  ok:       { color: '#22c55e', bg: '#052e1640', border: '#16653044', label: 'OK',    pulse: false },
  warning:  { color: '#f59e0b', bg: '#451a0340', border: '#92400e44', label: 'WARN',  pulse: false },
  critical: { color: '#ef4444', bg: '#450a0a40', border: '#991b1b44', label: 'CRIT',  pulse: true  },
  failed:   { color: '#ef4444', bg: '#450a0a40', border: '#991b1b44', label: 'FAIL',  pulse: true  },
  stale:    { color: '#64748b', bg: '#1e253340', border: '#37415144', label: 'STALE', pulse: false },
};

const TYPE_ICONS = { source: '◉', transform: '⚙', compute: '⚡', storage: '▦', queue: '◈', sink: '▧' };

function DAGTab({ incidentId }) {
  const [selected, setSelected] = useState(null);
  const nodes = INCIDENT_DAGS[incidentId] || [];

  if (!nodes.length) return (
    <div className="investigation-tab-content" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: 120, color: '#64748b', fontSize: 13 }}>
      No pipeline DAG available for this incident.
    </div>
  );

  return (
    <div className="investigation-tab-content" style={{ padding: '20px 16px', overflowX: 'auto' }}>
      {/* Pipeline row */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 0, minWidth: 'max-content', marginBottom: 20 }}>
        {nodes.map((node, i) => {
          const st = DAG_STATUS[node.status] || DAG_STATUS.ok;
          const isSel = selected?.id === node.id;
          return (
            <div key={node.id} style={{ display: 'flex', alignItems: 'center' }}>
              <button
                type="button"
                onClick={() => setSelected(isSel ? null : node)}
                style={{
                  background: isSel ? st.bg : '#1a2332',
                  border: `1px solid ${isSel ? st.border : '#2d3748'}`,
                  borderRadius: 8, padding: '10px 14px',
                  cursor: 'pointer', display: 'flex', flexDirection: 'column',
                  gap: 5, minWidth: 116, textAlign: 'left',
                  boxShadow: isSel ? `0 0 0 2px ${st.color}33` : 'none',
                  transition: 'all 0.15s', boxSizing: 'border-box',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
                  <span style={{
                    width: 7, height: 7, borderRadius: '50%', background: st.color,
                    flexShrink: 0, display: 'inline-block',
                    ...(st.pulse ? { animation: 'inv-pulse 1s ease-in-out infinite' } : {}),
                  }} />
                  <span style={{ fontSize: 10, fontWeight: 700, color: st.color, letterSpacing: 0.4 }}>{st.label}</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
                  <span style={{ fontSize: 11, color: '#64748b' }}>{TYPE_ICONS[node.type] || '◦'}</span>
                  <span style={{ fontSize: 12, fontWeight: 700, color: '#f1f5f9' }}>{node.label}</span>
                </div>
                <span style={{ fontSize: 10, color: '#475569', fontFamily: 'monospace' }}>{node.note}</span>
              </button>
              {i < nodes.length - 1 && (
                <div style={{ display: 'flex', alignItems: 'center', padding: '0 2px', flexShrink: 0 }}>
                  <div style={{ width: 18, height: 1, background: '#2d3748' }} />
                  <span style={{ color: '#374151', fontSize: 10 }}>▸</span>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Legend */}
      <div style={{ display: 'flex', gap: 14, flexWrap: 'wrap', marginBottom: selected ? 12 : 0 }}>
        {Object.entries(DAG_STATUS).map(([key, s]) => (
          <div key={key} style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
            <span style={{ width: 6, height: 6, borderRadius: '50%', background: s.color, display: 'inline-block' }} />
            <span style={{ fontSize: 10, color: '#475569', fontWeight: 600 }}>{s.label}</span>
          </div>
        ))}
      </div>

      {/* Selected node detail */}
      {selected && (
        <div style={{ padding: '12px 14px', background: '#1a2332', borderRadius: 8, border: `1px solid ${DAG_STATUS[selected.status]?.border || '#2d3748'}` }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
            <span style={{ fontSize: 13, color: '#64748b' }}>{TYPE_ICONS[selected.type]}</span>
            <span style={{ fontSize: 14, fontWeight: 700, color: '#f1f5f9' }}>{selected.label}</span>
            <span style={{ padding: '2px 8px', borderRadius: 4, fontSize: 11, fontWeight: 700, background: `${DAG_STATUS[selected.status]?.color}22`, color: DAG_STATUS[selected.status]?.color }}>
              {DAG_STATUS[selected.status]?.label}
            </span>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
            <div><span style={{ fontSize: 10, color: '#475569', display: 'block' }}>Type</span><span style={{ fontSize: 12, color: '#94a3b8' }}>{selected.type}</span></div>
            <div><span style={{ fontSize: 10, color: '#475569', display: 'block' }}>Details</span><span style={{ fontSize: 12, color: '#94a3b8', fontFamily: 'monospace' }}>{selected.note}</span></div>
          </div>
        </div>
      )}
    </div>
  );
}

function MetricsTab({ metrics }) {
  return (
    <div className="investigation-tab-content" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: 12, padding: 4 }}>
      {metrics.map((m, i) => (
        <div key={i} style={{ background: '#1e2533', border: '1px solid #2d3748', borderRadius: 8, padding: '12px 14px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 6 }}>
            <span style={{ width: 8, height: 8, borderRadius: '50%', background: statusDot(m.status), flexShrink: 0, display: 'inline-block' }} />
            <span style={{ fontSize: 11, color: '#94a3b8', fontWeight: 500 }}>{m.label}</span>
          </div>
          <div style={{ fontSize: 15, fontWeight: 700, color: m.status === 'critical' ? '#ef4444' : m.status === 'warning' ? '#f59e0b' : '#22c55e' }}>
            {m.value}
          </div>
        </div>
      ))}
    </div>
  );
}

function StepsTab({ steps, checkedSteps, onToggle, allDone }) {
  const done = steps.filter((_, i) => checkedSteps[i]).length;
  const pct  = steps.length > 0 ? Math.round((done / steps.length) * 100) : 0;

  return (
    <div className="investigation-tab-content" style={{ padding: 4 }}>
      <div style={{ marginBottom: 12 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11, color: '#94a3b8', marginBottom: 4 }}>
          <span>Investigation progress</span>
          <span>{done} / {steps.length} steps ({pct}%)</span>
        </div>
        <div style={{ height: 6, background: '#1e2533', borderRadius: 4, overflow: 'hidden' }}>
          <div style={{ height: '100%', width: `${pct}%`, background: allDone ? '#22c55e' : '#3b82f6', transition: 'width 0.3s ease', borderRadius: 4 }} />
        </div>
        {allDone && (
          <div style={{ marginTop: 8, padding: '6px 10px', background: '#052e16', border: '1px solid #16a34a', borderRadius: 6, fontSize: 12, color: '#4ade80' }}>
            All steps complete — RCA tab unlocked.
          </div>
        )}
      </div>
      {steps.map((step, i) => {
        const checked = !!checkedSteps[i];
        return (
          <div
            key={i}
            className={`investigation-step-item${checked ? ' investigation-step-item--done' : ''}`}
            onClick={() => onToggle(i)}
            style={{ display: 'flex', alignItems: 'flex-start', gap: 10, padding: '10px 0', borderBottom: '1px solid #1e2533', cursor: 'pointer', userSelect: 'none' }}
          >
            <div style={{
              width: 20, height: 20, borderRadius: 4, border: `2px solid ${checked ? '#22c55e' : '#4b5563'}`,
              background: checked ? '#22c55e' : 'transparent', flexShrink: 0, marginTop: 1,
              display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'all 0.2s',
            }}>
              {checked && <span style={{ color: '#fff', fontSize: 11, lineHeight: 1 }}>✓</span>}
            </div>
            <div style={{ flex: 1 }}>
              <span style={{ fontSize: 11, color: '#64748b', marginRight: 6 }}>Step {i + 1}</span>
              <span style={{ fontSize: 13, color: checked ? '#64748b' : '#e2e8f0', textDecoration: checked ? 'line-through' : 'none' }}>
                {step}
              </span>
            </div>
          </div>
        );
      })}
    </div>
  );
}

function RcaTab({ rca, stepsComplete }) {
  if (!stepsComplete) {
    return (
      <div className="investigation-tab-content" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: 200, gap: 12, color: '#64748b' }}>
        <span style={{ fontSize: 32 }}>🔒</span>
        <div style={{ fontSize: 14, fontWeight: 600 }}>Complete all investigation steps to unlock the Root Cause</div>
        <div style={{ fontSize: 12 }}>Work through each step in the Investigation Steps tab first.</div>
      </div>
    );
  }
  return (
    <div className="investigation-tab-content" style={{ padding: 4 }}>
      <div style={{ background: '#0f2d1f', border: '1px solid #16a34a', borderRadius: 8, padding: '16px 18px', marginBottom: 12 }}>
        <div style={{ fontSize: 11, color: '#4ade80', fontWeight: 700, marginBottom: 8, textTransform: 'uppercase', letterSpacing: 1 }}>Root Cause Analysis</div>
        <p style={{ fontSize: 14, color: '#d1fae5', lineHeight: 1.7, margin: 0 }}>{rca}</p>
      </div>
    </div>
  );
}

function FixCodeTab({ fixCode }) {
  const [copied, setCopied] = useState(false);

  function handleCopy() {
    navigator.clipboard.writeText(fixCode).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  }

  return (
    <div className="investigation-tab-content" style={{ position: 'relative', padding: 4 }}>
      <button
        onClick={handleCopy}
        style={{
          position: 'absolute', top: 10, right: 10, zIndex: 2,
          padding: '4px 12px', fontSize: 11, borderRadius: 4, border: '1px solid #374151',
          background: copied ? '#16a34a' : '#1e2533', color: copied ? '#fff' : '#94a3b8',
          cursor: 'pointer', transition: 'all 0.2s',
        }}
      >
        {copied ? 'Copied!' : 'Copy'}
      </button>
      <pre style={{
        background: '#0d1117', color: '#e2e8f0', fontSize: 12, lineHeight: 1.6,
        borderRadius: 6, padding: '14px 16px', overflowX: 'auto', margin: 0,
        whiteSpace: 'pre-wrap', wordBreak: 'break-word',
      }}>
        {fixCode}
      </pre>
    </div>
  );
}

const SPARK_STAGES = [
  { stage: 'Stage 0', tasks: '48 / 48', duration: '4.2s', input: '2.1 GB', shuffle: '—', status: 'ok' },
  { stage: 'Stage 1', tasks: '96 / 96', duration: '18.7s', input: '2.1 GB', shuffle: '13.6 GB', status: 'ok' },
  { stage: 'Stage 2 (FAILED)', tasks: '3 / 24', duration: '58.3s', input: '13.6 GB', shuffle: '—', status: 'failed' },
];

function SparkUITab() {
  return (
    <div className="investigation-tab-content" style={{ padding: 4 }}>
      <div style={{ background: '#1e2533', border: '1px solid #2d3748', borderRadius: 8, padding: 16 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 16 }}>
          <span style={{ background: '#7f1d1d', color: '#fca5a5', borderRadius: 4, padding: '2px 8px', fontSize: 11, fontWeight: 700 }}>FAILED</span>
          <span style={{ fontSize: 14, fontWeight: 600, color: '#e2e8f0' }}>Job 247: patient_cohort_aggregation</span>
        </div>
        <div style={{ fontSize: 11, color: '#94a3b8', marginBottom: 12 }}>
          Submitted: 2026-05-21 03:08:40 · Duration: 1m 14s · Cluster: de-prod-r5.4xlarge ×8
        </div>
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}>
            <thead>
              <tr style={{ borderBottom: '1px solid #374151' }}>
                {['Stage', 'Tasks', 'Duration', 'Input', 'Shuffle Write', 'Status'].map(h => (
                  <th key={h} style={{ padding: '6px 10px', textAlign: 'left', color: '#64748b', fontWeight: 600, whiteSpace: 'nowrap' }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {SPARK_STAGES.map((row, i) => (
                <tr key={i} style={{ borderBottom: '1px solid #1e2533', background: row.status === 'failed' ? 'rgba(127,29,29,0.15)' : 'transparent' }}>
                  <td style={{ padding: '7px 10px', color: row.status === 'failed' ? '#fca5a5' : '#e2e8f0' }}>{row.stage}</td>
                  <td style={{ padding: '7px 10px', color: '#cbd5e1' }}>{row.tasks}</td>
                  <td style={{ padding: '7px 10px', color: '#cbd5e1' }}>{row.duration}</td>
                  <td style={{ padding: '7px 10px', color: '#cbd5e1' }}>{row.input}</td>
                  <td style={{ padding: '7px 10px', color: row.shuffle !== '—' ? '#f59e0b' : '#4b5563' }}>{row.shuffle}</td>
                  <td style={{ padding: '7px 10px' }}>
                    <span style={{
                      padding: '2px 7px', borderRadius: 4, fontSize: 10, fontWeight: 700,
                      background: row.status === 'failed' ? '#7f1d1d' : '#052e16',
                      color: row.status === 'failed' ? '#fca5a5' : '#4ade80',
                    }}>
                      {row.status === 'failed' ? 'OOM / KILLED' : 'SUCCEEDED'}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div style={{ marginTop: 14, padding: '8px 12px', background: '#7f1d1d22', border: '1px solid #7f1d1d', borderRadius: 6, fontSize: 12, color: '#fca5a5' }}>
          <strong>Failure reason:</strong> Executor 14 exited with code 137 — OOM killed by container manager.
          Shuffle write for Stage 2 exceeded 16 GB executor memory limit.
          82.4% of shuffle data concentrated in partition 0 (data skew on product_id).
        </div>
      </div>
    </div>
  );
}

// ─── AI hints ─────────────────────────────────────────────────────────────────

function AIAssistant({ doneCount, totalSteps }) {
  let hint;
  if (doneCount === 0) {
    hint = 'Start by reviewing the error logs. Look for the first ERROR timestamp — it tells you exactly when the incident started and what component failed.';
  } else if (doneCount < totalSteps) {
    hint = "You've identified the source. Check the schema diff between the source and sink, or look at the specific resource (memory, credits, lag) that is outside normal bounds.";
  } else {
    hint = "You've found the root cause. Look at the Fix Options below — choose carefully based on trust and cost impact. The fastest fix is not always the right one.";
  }

  const dotColor = doneCount === 0 ? '#f59e0b' : doneCount < totalSteps ? '#3b82f6' : '#22c55e';

  return (
    <div className="investigation-ai-box" style={{ background: '#0f172a', border: '1px solid #1e3a5f', borderRadius: 8, padding: '12px 14px' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
        <span style={{ width: 8, height: 8, borderRadius: '50%', background: dotColor, flexShrink: 0, display: 'inline-block' }} />
        <span style={{ fontSize: 11, fontWeight: 700, color: '#38bdf8', textTransform: 'uppercase', letterSpacing: 1 }}>AI Assistant</span>
      </div>
      <p style={{ fontSize: 12, color: '#cbd5e1', lineHeight: 1.65, margin: 0 }}>{hint}</p>
      {doneCount > 0 && doneCount < totalSteps && (
        <div style={{ marginTop: 8, fontSize: 11, color: '#475569' }}>
          {doneCount} of {totalSteps} steps investigated
        </div>
      )}
    </div>
  );
}

// ─── Team Chat ────────────────────────────────────────────────────────────────

function TeamChat({ messages }) {
  if (messages.length === 0) {
    return (
      <div style={{ padding: '12px 0', color: '#475569', fontSize: 12, textAlign: 'center' }}>
        No team messages yet. Messages appear as the incident ages.
      </div>
    );
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 8, maxHeight: 220, overflowY: 'auto' }}>
      {messages.slice(0, 8).map((msg) => {
        let borderColor = '#2d3748';
        let extraClass = '';
        if (msg.urgency === 'critical') { borderColor = '#ef4444'; extraClass = 'investigation-chat-msg--critical'; }
        else if (msg.urgency === 'high' || msg.urgency === 'warning') { borderColor = '#f59e0b'; extraClass = 'investigation-chat-msg--warning'; }
        else if (msg.urgency === 'success') { borderColor = '#22c55e'; extraClass = 'investigation-chat-msg--success'; }

        return (
          <div
            key={msg.id}
            className={`investigation-chat-msg ${extraClass}`}
            style={{ borderLeft: `3px solid ${borderColor}`, paddingLeft: 10, paddingTop: 4, paddingBottom: 4 }}
          >
            <div style={{ display: 'flex', alignItems: 'baseline', gap: 6, marginBottom: 3 }}>
              <span style={{ fontSize: 14 }}>{msg.avatar}</span>
              <span style={{ fontSize: 11, fontWeight: 700, color: '#e2e8f0' }}>{msg.author}</span>
              <span style={{ fontSize: 10, color: '#64748b' }}>{msg.role}</span>
              <span style={{ fontSize: 10, color: '#475569', marginLeft: 'auto' }}>{fmtTime(msg.timestamp)}</span>
            </div>
            <div style={{ fontSize: 12, color: '#cbd5e1', lineHeight: 1.5 }}>{msg.text}</div>
          </div>
        );
      })}
    </div>
  );
}

// ─── Fix Options ──────────────────────────────────────────────────────────────

function FixOptions({ incidentId, uid, applyingFix, applyFix, completeFix }) {
  const options = useMemo(() => FIX_OPTIONS[incidentId] || [], [incidentId]);
  const [countdowns, setCountdowns] = useState({});

  useEffect(() => {
    if (!applyingFix || applyingFix.uid !== uid) return;

    const interval = setInterval(() => {
      const remaining = applyingFix.resolveAt - Date.now();
      if (remaining <= 0) {
        clearInterval(interval);
        const opt = options.find(o => o.id === applyingFix.optionId);
        if (opt) completeFix(uid, opt);
      } else {
        setCountdowns(prev => ({ ...prev, [applyingFix.optionId]: remaining }));
      }
    }, 250);

    return () => clearInterval(interval);
  }, [applyingFix, uid, options, completeFix]);

  if (options.length === 0) {
    return <div style={{ fontSize: 12, color: '#475569', padding: '8px 0' }}>No fix options configured for this incident.</div>;
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
      {options.map(opt => {
        const isApplying = applyingFix?.uid === uid && applyingFix?.optionId === opt.id;
        const remaining  = countdowns[opt.id];
        const pct        = isApplying && remaining != null
          ? Math.max(0, Math.round((1 - remaining / parseRuntimeMs(opt.runtime)) * 100))
          : 0;

        return (
          <div
            key={opt.id}
            className={`investigation-fix-card${isApplying ? ' investigation-fix-card--applying' : ''}`}
            style={{
              background: isApplying ? '#0f2d1f' : '#1a2035',
              border: `1px solid ${isApplying ? '#16a34a' : opt.isCorrect ? '#1e3a5f' : '#3b1f1f'}`,
              borderRadius: 8, padding: '10px 12px',
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 4 }}>
              <span style={{ fontSize: 13, fontWeight: 600, color: '#e2e8f0' }}>{opt.label}</span>
              <span style={{ fontSize: 11, color: '#64748b', whiteSpace: 'nowrap', marginLeft: 8 }}>{opt.runtime}</span>
            </div>
            <div style={{ fontSize: 11, color: '#94a3b8', marginBottom: 8, lineHeight: 1.5 }}>{opt.detail}</div>

            <div style={{ display: 'flex', gap: 8, marginBottom: 8 }}>
              <ImpactBar label="XP" value={opt.xp} max={600} color="#3b82f6" />
              <ImpactBar label="Trust" value={opt.trustDelta} max={20} color={opt.trustDelta >= 0 ? '#22c55e' : '#ef4444'} showSign />
              <ImpactBar label="Cost" value={opt.costDelta} max={3000} color={opt.costDelta <= 0 ? '#22c55e' : '#f59e0b'} showSign prefix="$" />
            </div>

            {isApplying ? (
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11, color: '#4ade80', marginBottom: 4 }}>
                  <span>Applying fix...</span>
                  <span>{pct}%</span>
                </div>
                <div style={{ height: 4, background: '#1e2533', borderRadius: 4, overflow: 'hidden' }}>
                  <div style={{ height: '100%', width: `${pct}%`, background: '#22c55e', transition: 'width 0.25s linear', borderRadius: 4 }} />
                </div>
                {remaining != null && (
                  <div style={{ fontSize: 10, color: '#64748b', marginTop: 3 }}>
                    ~{Math.ceil(remaining / 1000)}s remaining
                  </div>
                )}
              </div>
            ) : (
              <button
                disabled={!!applyingFix}
                onClick={() => applyFix(uid, opt.id, parseRuntimeMs(opt.runtime))}
                style={{
                  padding: '5px 14px', fontSize: 12, fontWeight: 600, borderRadius: 4,
                  border: 'none', cursor: applyingFix ? 'not-allowed' : 'pointer',
                  background: applyingFix ? '#1e2533' : opt.isCorrect ? '#1d4ed8' : '#7f1d1d',
                  color: applyingFix ? '#475569' : '#fff', transition: 'all 0.2s',
                }}
              >
                Apply Fix
              </button>
            )}
          </div>
        );
      })}
    </div>
  );
}

function ImpactBar({ label, value, max, color, showSign, prefix }) {
  const absVal = Math.abs(value);
  const pct    = Math.min(100, Math.round((absVal / max) * 100));
  const display = showSign
    ? `${value >= 0 ? '+' : ''}${prefix || ''}${value}`
    : `${prefix || ''}${value}`;

  return (
    <div style={{ flex: 1 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 9, color: '#64748b', marginBottom: 2 }}>
        <span>{label}</span>
        <span style={{ color }}>{display}</span>
      </div>
      <div className="investigation-fix-bar" style={{ height: 3, background: '#2d3748', borderRadius: 2, overflow: 'hidden' }}>
        <div style={{ height: '100%', width: `${pct}%`, background: color, borderRadius: 2 }} />
      </div>
    </div>
  );
}

// ─── Bottom Timeline ──────────────────────────────────────────────────────────

function BottomTimeline({ messages }) {
  const events = messages.slice(0, 5);
  if (events.length === 0) return null;

  return (
    <div className="investigation-timeline" style={{ display: 'flex', alignItems: 'center', gap: 0, padding: '10px 20px', borderTop: '1px solid #1e2533', overflowX: 'auto' }}>
      {events.map((msg, i) => (
        <div key={msg.id} style={{ display: 'flex', alignItems: 'center', flexShrink: 0 }}>
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', maxWidth: 200 }}>
            <div style={{
              width: 10, height: 10, borderRadius: '50%', flexShrink: 0,
              background: msg.urgency === 'critical' ? '#ef4444' : msg.urgency === 'success' ? '#22c55e' : msg.urgency === 'high' ? '#f59e0b' : '#475569',
            }} />
            <div style={{ fontSize: 10, color: '#475569', marginTop: 3, whiteSpace: 'nowrap' }}>{fmtTime(msg.timestamp)}</div>
            <div style={{ fontSize: 11, color: '#94a3b8', textAlign: 'center', maxWidth: 180, lineHeight: 1.3, marginTop: 2 }}>
              {msg.text.length > 60 ? msg.text.slice(0, 57) + '...' : msg.text}
            </div>
          </div>
          {i < events.length - 1 && (
            <div style={{ width: 40, height: 1, background: '#2d3748', flexShrink: 0, margin: '0 4px', marginBottom: 20 }} />
          )}
        </div>
      ))}
    </div>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────

export const InvestigationWorkspace = memo(function InvestigationWorkspace() {
  const investigatingIncidentId = useSimulationStore(s => s.investigatingIncidentId);
  const activeIncidents         = useSimulationStore(s => s.activeIncidents);
  const teamMessages            = useSimulationStore(s => s.teamMessages);
  const applyingFix             = useSimulationStore(s => s.applyingFix);
  const closeInvestigation      = useSimulationStore(s => s.closeInvestigation);
  const applyFix                = useSimulationStore(s => s.applyFix);
  const completeFix             = useSimulationStore(s => s.completeFix);

  const [activeTab, setActiveTab]       = useState('logs');
  const [checkedSteps, setCheckedSteps] = useState({});
  const [elapsed, setElapsed]           = useState(0);

  // Find the active incident record + the static incident definition
  const activeRecord = activeIncidents.find(i => i.uid === investigatingIncidentId);
  const incident     = activeRecord ? INCIDENTS.find(inc => inc.id === activeRecord.incidentId) : null;

  // Lock scroll when overlay is open
  useEffect(() => {
    if (investigatingIncidentId) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => { document.body.style.overflow = ''; };
  }, [investigatingIncidentId]);

  // SLA count-up timer
  useEffect(() => {
    if (!activeRecord) return;
    const interval = setInterval(() => {
      setElapsed(Date.now() - activeRecord.startedAt);
    }, 1000);
    return () => clearInterval(interval);
  }, [activeRecord]);

  // Reset checked steps when switching incidents
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setCheckedSteps({});
    setActiveTab('logs');
  }, [investigatingIncidentId]);

  const handleToggleStep = useCallback((idx) => {
    setCheckedSteps(prev => ({ ...prev, [idx]: !prev[idx] }));
  }, []);

  const handleKeyDown = useCallback((e) => {
    if (e.key === 'Escape') closeInvestigation();
  }, [closeInvestigation]);

  useEffect(() => {
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [handleKeyDown]);

  if (!investigatingIncidentId) return null;
  if (!incident || !activeRecord) return null;

  const slaMs        = (SLA_MINUTES[activeRecord.severity] || 60) * 60 * 1000;
  const slaPct       = elapsed / slaMs;
  const isBreached   = slaPct >= 1;
  const isAmber      = slaPct >= 0.5 && !isBreached;

  const affectedSystems = CASCADE_MAP[incident.id] || [];
  const impact          = HOURLY_IMPACT[activeRecord.severity] || { dollar: 0, users: 0 };
  const doneCount       = incident.steps.filter((_, i) => checkedSteps[i]).length;
  const allDone         = doneCount === incident.steps.length;

  const incidentMessages = teamMessages.filter(m => m.incidentId === incident.id);

  const TABS = [
    { id: 'logs',    label: '▤ Logs'    },
    { id: 'dag',     label: '◫ DAG'     },
    { id: 'metrics', label: '▧ Metrics' },
    { id: 'steps',   label: '◎ Steps'   },
    { id: 'rca',     label: '◈ RCA'     },
    { id: 'fixcode', label: '⌥ Fix'     },
    { id: 'spark',   label: '⚡ Spark'  },
  ];

  return (
    <div
      className="investigation-overlay"
      style={{ position: 'fixed', inset: 0, zIndex: 1000, background: 'rgba(0,0,0,0.85)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
      onClick={(e) => { if (e.target === e.currentTarget) closeInvestigation(); }}
    >
      <div
        className="investigation-panel"
        style={{
          width: '90vw', height: '92vh', background: '#111827', borderRadius: 12,
          display: 'flex', flexDirection: 'column', overflow: 'hidden',
          boxShadow: '0 25px 60px rgba(0,0,0,0.7)',
        }}
      >
        {/* ── Header ── */}
        <div
          className="investigation-header"
          style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '12px 20px', borderBottom: '1px solid #1e2533', flexShrink: 0 }}
        >
          <span style={{ fontSize: 20 }}>{incident.icon}</span>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
              <span style={{ fontSize: 11, fontWeight: 700, color: '#64748b', textTransform: 'uppercase', letterSpacing: 1 }}>Investigation</span>
              <span style={{ fontSize: 15, fontWeight: 700, color: '#f1f5f9', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                {incident.title}
              </span>
              <span style={{
                padding: '2px 8px', borderRadius: 4, fontSize: 11, fontWeight: 700,
                background: `${severityColor(activeRecord.severity)}22`,
                color: severityColor(activeRecord.severity),
                border: `1px solid ${severityColor(activeRecord.severity)}55`,
              }}>
                {activeRecord.severity}
              </span>
              <span style={{ fontSize: 11, color: '#475569' }}>{incident.tool}</span>
            </div>
          </div>

          <div
            className={`investigation-timer${isBreached ? ' investigation-timer--breach' : ''}`}
            style={{
              display: 'flex', alignItems: 'center', gap: 6, padding: '4px 12px',
              borderRadius: 6, border: `1px solid ${isBreached ? '#ef4444' : isAmber ? '#f59e0b' : '#2d3748'}`,
              background: isBreached ? '#7f1d1d22' : isAmber ? '#78350f22' : '#1e2533',
              flexShrink: 0,
            }}
          >
            <span style={{ fontSize: 10, color: isBreached ? '#fca5a5' : isAmber ? '#fcd34d' : '#64748b', fontWeight: 600, textTransform: 'uppercase' }}>
              {isBreached ? 'BREACHED' : 'ELAPSED'}
            </span>
            <span style={{ fontSize: 13, fontFamily: 'monospace', fontWeight: 700, color: isBreached ? '#ef4444' : isAmber ? '#f59e0b' : '#94a3b8' }}>
              {fmtElapsed(elapsed)}
            </span>
            <span style={{ fontSize: 10, color: '#475569' }}>/ {SLA_MINUTES[activeRecord.severity]}m SLA</span>
          </div>

          <button
            onClick={closeInvestigation}
            style={{ background: 'none', border: 'none', color: '#64748b', fontSize: 20, cursor: 'pointer', padding: '4px 8px', lineHeight: 1, flexShrink: 0 }}
            aria-label="Close investigation"
          >
            ✕
          </button>
        </div>

        {/* ── Body ── */}
        <div
          className="investigation-body"
          style={{ display: 'flex', flex: 1, overflow: 'hidden' }}
        >
          {/* Left Panel */}
          <div
            className="investigation-left"
            style={{ width: 260, flexShrink: 0, borderRight: '1px solid #1e2533', padding: '14px 16px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 14 }}
          >
            {/* Severity */}
            <div>
              <div style={{ fontSize: 10, color: '#475569', fontWeight: 600, textTransform: 'uppercase', letterSpacing: 1, marginBottom: 6 }}>Severity</div>
              <div style={{ display: 'inline-flex', alignItems: 'center', gap: 6, padding: '4px 10px', borderRadius: 4, background: `${severityColor(activeRecord.severity)}22`, border: `1px solid ${severityColor(activeRecord.severity)}44` }}>
                <span style={{ width: 8, height: 8, borderRadius: '50%', background: severityColor(activeRecord.severity), display: 'inline-block' }} />
                <span style={{ fontSize: 13, fontWeight: 700, color: severityColor(activeRecord.severity) }}>{activeRecord.severity} — {incident.category}</span>
              </div>
            </div>

            {/* Briefing */}
            <div>
              <div style={{ fontSize: 10, color: '#475569', fontWeight: 600, textTransform: 'uppercase', letterSpacing: 1, marginBottom: 6 }}>Briefing</div>
              <p style={{ fontSize: 12, color: '#94a3b8', lineHeight: 1.6, margin: 0 }}>{incident.briefing}</p>
            </div>

            {/* Business Impact */}
            <div>
              <div style={{ fontSize: 10, color: '#475569', fontWeight: 600, textTransform: 'uppercase', letterSpacing: 1, marginBottom: 6 }}>Business Impact</div>
              <div style={{ fontSize: 12, color: '#fca5a5', marginBottom: 3 }}>
                ~${impact.dollar}K/hr revenue at risk
              </div>
              <div style={{ fontSize: 12, color: '#fcd34d' }}>
                ~{impact.users}K affected users
              </div>
            </div>

            {/* SLA Status */}
            <div>
              <div style={{ fontSize: 10, color: '#475569', fontWeight: 600, textTransform: 'uppercase', letterSpacing: 1, marginBottom: 6 }}>SLA Status</div>
              <div style={{ height: 4, background: '#1e2533', borderRadius: 4, overflow: 'hidden', marginBottom: 4 }}>
                <div style={{ height: '100%', width: `${Math.min(100, Math.round(slaPct * 100))}%`, background: isBreached ? '#ef4444' : isAmber ? '#f59e0b' : '#22c55e', borderRadius: 4, transition: 'width 1s linear' }} />
              </div>
              <div style={{ fontSize: 11, color: isBreached ? '#fca5a5' : isAmber ? '#fcd34d' : '#4ade80' }}>
                {isBreached ? `SLA breached by ${fmtElapsed(elapsed - slaMs)}` : `${Math.round(slaPct * 100)}% of ${SLA_MINUTES[activeRecord.severity]}m SLA used`}
              </div>
            </div>

            {/* Affected Systems */}
            {affectedSystems.length > 0 && (
              <div>
                <div style={{ fontSize: 10, color: '#475569', fontWeight: 600, textTransform: 'uppercase', letterSpacing: 1, marginBottom: 6 }}>Affected Pipelines</div>
                {affectedSystems.map(sys => (
                  <div key={sys} style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 4 }}>
                    <span style={{ width: 6, height: 6, borderRadius: '50%', background: activeRecord.escalationLevel >= 2 ? '#ef4444' : '#f59e0b', flexShrink: 0, display: 'inline-block' }} />
                    <span style={{ fontSize: 11, color: '#94a3b8', fontFamily: 'monospace' }}>{sys}</span>
                  </div>
                ))}
              </div>
            )}

            {/* Escalation Level */}
            <div>
              <div style={{ fontSize: 10, color: '#475569', fontWeight: 600, textTransform: 'uppercase', letterSpacing: 1, marginBottom: 6 }}>Escalation Level</div>
              <div style={{ display: 'flex', gap: 6 }}>
                {[1, 2, 3].map(lvl => (
                  <div
                    key={lvl}
                    style={{
                      flex: 1, height: 6, borderRadius: 3,
                      background: activeRecord.escalationLevel >= lvl
                        ? lvl === 3 ? '#ef4444' : lvl === 2 ? '#f59e0b' : '#3b82f6'
                        : '#1e2533',
                    }}
                  />
                ))}
              </div>
              <div style={{ fontSize: 11, color: '#64748b', marginTop: 4 }}>
                {activeRecord.escalationLevel === 0 ? 'No escalation' : `Level ${activeRecord.escalationLevel} escalation`}
              </div>
            </div>
          </div>

          {/* Center Panel */}
          <div
            className="investigation-center"
            style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}
          >
            <div className="investigation-tabs" style={{ display: 'flex', borderBottom: '1px solid #1e2533', padding: '0 16px', flexShrink: 0 }}>
              {TABS.map(tab => {
                const locked = tab.id === 'rca' && !allDone;
                return (
                  <button
                    key={tab.id}
                    onClick={() => !locked && setActiveTab(tab.id)}
                    className={`investigation-tab${activeTab === tab.id ? ' investigation-tab--active' : ''}`}
                    style={{
                      padding: '10px 14px', fontSize: 12, fontWeight: activeTab === tab.id ? 700 : 500,
                      background: 'none', border: 'none', cursor: locked ? 'not-allowed' : 'pointer',
                      color: locked ? '#374151' : activeTab === tab.id ? '#3b82f6' : '#64748b',
                      borderBottom: activeTab === tab.id ? '2px solid #3b82f6' : '2px solid transparent',
                      marginBottom: -1, transition: 'color 0.2s',
                    }}
                  >
                    {tab.label}{locked ? ' 🔒' : ''}
                    {tab.id === 'steps' && (
                      <span style={{ marginLeft: 5, fontSize: 10, background: allDone ? '#16a34a' : '#1e3a5f', color: allDone ? '#4ade80' : '#38bdf8', borderRadius: 10, padding: '1px 6px' }}>
                        {doneCount}/{incident.steps.length}
                      </span>
                    )}
                  </button>
                );
              })}
            </div>

            <div style={{ flex: 1, overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
              {activeTab === 'logs'    && <LogsTab key={incident.id} logs={incident.logs} />}
              {activeTab === 'dag'     && <DAGTab incidentId={incident.id} />}
              {activeTab === 'metrics' && (
                <div style={{ flex: 1, overflowY: 'auto', padding: '14px 16px' }}>
                  <MetricsTab metrics={incident.metrics} />
                </div>
              )}
              {activeTab === 'steps'   && (
                <div style={{ flex: 1, overflowY: 'auto', padding: '14px 16px' }}>
                  <StepsTab steps={incident.steps} checkedSteps={checkedSteps} onToggle={handleToggleStep} allDone={allDone} />
                </div>
              )}
              {activeTab === 'rca'     && (
                <div style={{ flex: 1, overflowY: 'auto', padding: '14px 16px' }}>
                  <RcaTab rca={incident.correctRCA} stepsComplete={allDone} />
                </div>
              )}
              {activeTab === 'fixcode' && (
                <div style={{ flex: 1, overflowY: 'auto', padding: '14px 16px' }}>
                  <FixCodeTab fixCode={incident.fixCode} />
                </div>
              )}
              {activeTab === 'spark'   && (
                <div style={{ flex: 1, overflowY: 'auto', padding: '14px 16px' }}>
                  <SparkUITab />
                </div>
              )}
            </div>
          </div>

          {/* Right Panel */}
          <div
            className="investigation-right"
            style={{ width: 300, flexShrink: 0, borderLeft: '1px solid #1e2533', padding: '14px 14px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 16 }}
          >
            <AIAssistant doneCount={doneCount} totalSteps={incident.steps.length} />

            <div>
              <div style={{ fontSize: 10, color: '#475569', fontWeight: 600, textTransform: 'uppercase', letterSpacing: 1, marginBottom: 8 }}>Team Chat</div>
              <TeamChat messages={incidentMessages} />
            </div>

            <div>
              <div style={{ fontSize: 10, color: '#475569', fontWeight: 600, textTransform: 'uppercase', letterSpacing: 1, marginBottom: 8 }}>Apply Fix</div>
              <FixOptions
                incidentId={incident.id}
                uid={activeRecord.uid}
                applyingFix={applyingFix}
                applyFix={applyFix}
                completeFix={completeFix}
              />
            </div>
          </div>
        </div>

        {/* Bottom Timeline */}
        <BottomTimeline messages={incidentMessages} />
      </div>
    </div>
  );
});

export default InvestigationWorkspace;
