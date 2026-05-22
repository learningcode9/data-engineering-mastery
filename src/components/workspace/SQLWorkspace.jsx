import { memo, useCallback, useRef, useState } from 'react';
import { SqlEditor } from '../ui/SqlEditor.jsx';
import { ExecutionPlan } from '../ui/ExecutionPlan.jsx';
import { QueryResultTable } from '../ui/QueryResultTable.jsx';
import { DifficultyBadge } from '../ui/DifficultyBadge.jsx';
import { CodeBlock } from '../ui/CodeBlock.jsx';
import { useLocalStorage } from '../../hooks/useLocalStorage.js';
import { useSqlEngine } from '../../hooks/useSqlEngine.js';
import { TABLE_SCHEMAS, getEngine } from '../../utils/sqlEngine.js';
import { analyzeQuery, getSQLitePlan } from '../../utils/queryAnalyzer.js';
import { toast } from '../../utils/toast.js';

const TABS = [
  { id: 'editor',  label: 'Editor'  },
  { id: 'schema',  label: 'Schema'  },
  { id: 'plan',    label: 'Plan'    },
  { id: 'hints',   label: 'Hints'   },
  { id: 'notes',   label: 'Notes'   },
];

// ── Schema panel ───────────────────────────────────────────────────────────────
function SchemaPanel({ onInsert }) {
  const [expanded, setExpanded] = useState(null);
  const [preview, setPreview]   = useState(null);  // { table, rows, columns }
  const [loadingPreview, setLoadingPreview] = useState(false);

  async function handlePreview(tableName) {
    if (preview?.table === tableName) { setPreview(null); return; }
    setLoadingPreview(true);
    try {
      const db = await getEngine();
      const result = db.exec(`SELECT * FROM ${tableName} LIMIT 5`);
      if (result.length) {
        const { columns, values } = result[0];
        const rows = values.map(v => Object.fromEntries(columns.map((c, i) => [c, v[i]])));
        setPreview({ table: tableName, columns, rows });
      }
    } catch { /* ignore */ }
    setLoadingPreview(false);
  }

  return (
    <div className="schema-panel">
      <div className="schema-panel-hint">Click a column name to insert it into the editor.</div>
      {Object.entries(TABLE_SCHEMAS).map(([name, schema]) => {
        const isOpen    = expanded === name;
        const isPrev    = preview?.table === name;
        return (
          <div key={name} className={`schema-ws-table${isOpen ? ' schema-ws-table--open' : ''}`}>
            {/* Table header */}
            <div className="schema-ws-table-head">
              <button
                type="button"
                className="schema-ws-trigger"
                onClick={() => setExpanded(isOpen ? null : name)}
                aria-expanded={isOpen}
              >
                <span className="schema-ws-icon" aria-hidden="true">⊞</span>
                <span className="schema-ws-name">{name}</span>
                <span className="schema-ws-count">{schema.rowCount} rows</span>
                <span className={`result-chevron${isOpen ? ' result-chevron--open' : ''}`} aria-hidden="true">▾</span>
              </button>
              <button
                type="button"
                className={`schema-ws-preview-btn${isPrev ? ' active' : ''}`}
                onClick={() => handlePreview(name)}
                title="Preview first 5 rows"
                aria-label={`Preview ${name} data`}
              >
                {loadingPreview && !isPrev ? '…' : isPrev ? 'Close' : 'Preview'}
              </button>
            </div>

            {/* Preview table */}
            {isPrev && preview && (
              <div className="schema-ws-preview">
                <div className="schema-ws-preview-scroll">
                  <table className="query-result-table">
                    <thead>
                      <tr>
                        {preview.columns.map(c => <th key={c}>{c}</th>)}
                      </tr>
                    </thead>
                    <tbody>
                      {preview.rows.map((row, i) => (
                        <tr key={i}>
                          {preview.columns.map(c => (
                            <td key={c}>{row[c] == null ? <span className="null-val">NULL</span> : String(row[c])}</td>
                          ))}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* Column list */}
            {isOpen && (
              <div className="schema-ws-cols">
                <p className="schema-ws-note">{schema.note}</p>
                <table className="schema-col-table">
                  <thead>
                    <tr><th>Column</th><th>Type</th><th></th></tr>
                  </thead>
                  <tbody>
                    {schema.columns.map((col, i) => (
                      <tr
                        key={col}
                        className="schema-col-row"
                        onClick={() => onInsert?.(col)}
                        title={`Insert: ${col}`}
                        style={{ cursor: 'pointer' }}
                      >
                        <td className="schema-col-name">{col}</td>
                        <td className="schema-col-type">{schema.types[i]}</td>
                        <td className="schema-col-meta">
                          {col === schema.pk && <span className="schema-badge schema-badge--pk">PK</span>}
                          {schema.fks?.[col] && (
                            <span className="schema-badge schema-badge--fk" title={`→ ${schema.fks[col]}`}>FK</span>
                          )}
                          <span className="schema-col-insert-hint" aria-hidden="true">+ insert</span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}

// ── Hints panel ────────────────────────────────────────────────────────────────
function HintsPanel({ subtopic }) {
  const [revealed, setRevealed] = useState(0);

  // Build 4-level hints from existing data
  const hints = (() => {
    if (Array.isArray(subtopic.hints) && subtopic.hints.length) return subtopic.hints;
    const h1 = subtopic.hint ?? 'Think about which SQL clause solves this problem.';
    const h2 = subtopic.syntax ? `Syntax: ${subtopic.syntax}` : 'Check the SQL syntax for this operation.';
    const sol = subtopic.solution ?? '';
    // Level 3: partial — show first ~55% of solution, blank the rest
    const mid = Math.floor(sol.length * 0.55);
    const partial = sol.slice(0, mid) + (sol.length > mid ? ' …' : '');
    return [h1, h2, partial, sol];
  })();

  const HINT_META = [
    { label: '1. Conceptual',    desc: 'A nudge about the approach'      },
    { label: '2. Syntax',        desc: 'The relevant SQL syntax'         },
    { label: '3. Partial query', desc: 'Part of the solution'            },
    { label: '4. Full solution', desc: 'The complete correct answer'     },
  ];

  return (
    <div className="hints-panel">

      {/* Expected output */}
      {subtopic.expectedOutput && (
        <div className="hint-expected">
          <span className="hint-expected-label">Expected output</span>
          <span className="hint-expected-value">{subtopic.expectedOutput}</span>
        </div>
      )}

      <p className="hints-intro">
        Reveal hints one at a time — each level unlocks after you reveal the previous one.
      </p>

      {hints.map((hint, i) => {
        const isRevealed = i < revealed;
        const isCurrent  = i === revealed;
        const isLocked   = i > revealed;
        return (
          <div
            key={i}
            className={[
              'hint-card',
              isRevealed ? 'hint-card--seen'    : '',
              isCurrent  ? 'hint-card--current' : '',
              isLocked   ? 'hint-card--locked'  : '',
            ].filter(Boolean).join(' ')}
          >
            <div className="hint-card-header">
              <span className="hint-level-label">
                {isRevealed && <span className="hint-check" aria-hidden="true">✓ </span>}
                {HINT_META[i]?.label}
              </span>
              <span className="hint-level-desc">{HINT_META[i]?.desc}</span>
            </div>

            {isRevealed ? (
              <div className="hint-content">
                {i === 3 && subtopic.solution
                  ? <CodeBlock code={hint} />
                  : <p>{hint}</p>
                }
              </div>
            ) : isCurrent ? (
              <button
                type="button"
                className="hint-reveal-btn hint-reveal-btn--active"
                onClick={() => setRevealed(i + 1)}
              >
                Reveal level {i + 1}
              </button>
            ) : (
              <div className="hint-locked-msg" aria-hidden="true">
                🔒 Reveal level {i} first
              </div>
            )}
          </div>
        );
      })}

      {revealed > 0 && (
        <button
          type="button"
          className="hints-reset-btn"
          onClick={() => setRevealed(0)}
        >
          ↺ Reset hints
        </button>
      )}
    </div>
  );
}

// ── Notes panel ────────────────────────────────────────────────────────────────
function NotesPanel({ subtopicId }) {
  const [notes, setNotes] = useLocalStorage(`dem-ws-notes-${subtopicId}`, '');
  const [saved, setSaved] = useState(false);
  const saveTimer = useRef(null);

  function handleChange(text) {
    setNotes(text);
    clearTimeout(saveTimer.current);
    setSaved(false);
    saveTimer.current = setTimeout(() => setSaved(true), 800);
  }

  return (
    <div className="ws-notes-panel">
      <div className="ws-notes-header">
        <span>Personal notes for this topic</span>
        {saved && <span className="ws-notes-saved">✓ Saved</span>}
      </div>
      <textarea
        className="ws-notes-textarea"
        value={notes}
        onChange={e => handleChange(e.target.value)}
        placeholder="Write notes, key takeaways, or questions here…"
        aria-label="Topic notes"
      />
      <div className="ws-notes-footer">
        <span>{notes.length} chars</span>
      </div>
    </div>
  );
}

// ── Engine states ──────────────────────────────────────────────────────────────
function EngineLoadingBanner() {
  return (
    <div className="engine-loading ws-engine-loading">
      <span className="engine-spinner" aria-hidden="true" />
      <span>Loading SQLite engine…</span>
    </div>
  );
}

// ── Main SQLWorkspace ──────────────────────────────────────────────────────────
export const SQLWorkspace = memo(function SQLWorkspace({
  subtopic,
  completed,
  onToggleComplete,
}) {
  const [tab,         setTab]         = useState('editor');
  const [answer,      setAnswer]      = useLocalStorage(`dem-ws-sql-${subtopic.id}`, '');
  const [validation,  setValidation]  = useState(null);
  const [queryResult, setQueryResult] = useState(null);
  const [resultsOpen, setResultsOpen] = useState(false);
  const [analysis,    setAnalysis]    = useState(null);
  const [rawPlan,     setRawPlan]     = useState(null);
  const [runCount,    setRunCount]    = useLocalStorage(`dem-ws-runs-${subtopic.id}`, 0);

  const editorRef = useRef(null);
  const { engineReady, engineError, running, runAndValidate } = useSqlEngine();

  const canRun = engineReady && !running && !!answer.trim();

  async function handleRun() {
    if (!canRun) return;

    // Run analysis before execution
    const a = analyzeQuery(answer);
    setAnalysis(a);

    // Get SQLite's actual plan (needs the DB)
    try {
      const db = await getEngine();
      setRawPlan(getSQLitePlan(db, answer));
    } catch { setRawPlan(null); }

    const outcome = await runAndValidate(answer, subtopic.solution);
    if (!outcome) return;

    setValidation({
      valid:   outcome.valid,
      message: outcome.message,
      mismatch: outcome.mismatch ?? false,
      expectedRowCount: outcome.expectedRowCount ?? null,
    });
    setQueryResult(outcome.queryResult ?? null);
    setResultsOpen(true);
    setRunCount(n => n + 1);

    // Auto-switch to plan tab to show the result
    if (tab === 'editor') {
      // Stay on editor — results appear inline
    }

    if (outcome.valid && !completed) {
      onToggleComplete(subtopic.id, subtopic.title);
      toast(`Completed: ${subtopic.title}`, 'success');
    }
  }

  function handleReset() {
    setAnswer('');
    setValidation(null);
    setQueryResult(null);
    setResultsOpen(false);
    setAnalysis(null);
    setRawPlan(null);
  }

  const handleInsert = useCallback((text) => {
    editorRef.current?.insertAtCursor(text);
    editorRef.current?.focus();
    setTab('editor');
  }, []);

  const runBtnClass = [
    'workspace-run-btn',
    validation?.valid ? 'workspace-run-btn--success' : '',
    running           ? 'workspace-run-btn--running'  : '',
  ].filter(Boolean).join(' ');

  return (
    <div className={`sql-workspace${completed ? ' sql-workspace--done' : ''}`}>

      {/* ── Header ── */}
      <div className="workspace-header">
        <div className="workspace-meta">
          <span className="practice-label">Practice Task</span>
          <DifficultyBadge level={subtopic.difficulty} />
          {runCount > 0 && (
            <span className="workspace-run-count" title="Attempts">{runCount} run{runCount !== 1 ? 's' : ''}</span>
          )}
        </div>
        <label className="practice-check">
          <input
            type="checkbox"
            checked={!!completed}
            onChange={() => onToggleComplete(subtopic.id, subtopic.title)}
            aria-label="Mark practice complete"
          />
          <span>{completed ? 'Completed' : 'Mark complete'}</span>
        </label>
      </div>

      {/* ── Practice question ── */}
      <p className="workspace-question">{subtopic.practice}</p>

      {/* ── Tab bar ── */}
      <div className="workspace-tabs" role="tablist" aria-label="SQL workspace">
        {TABS.map(t => (
          <button
            key={t.id}
            type="button"
            role="tab"
            className={`workspace-tab${tab === t.id ? ' workspace-tab--active' : ''}${t.id === 'plan' && analysis ? ' workspace-tab--has-data' : ''}`}
            onClick={() => setTab(t.id)}
            aria-selected={tab === t.id}
          >
            {t.label}
            {t.id === 'plan' && analysis && (
              <span className="workspace-tab-dot" aria-hidden="true" />
            )}
          </button>
        ))}
      </div>

      {/* ── Tab content ── */}
      <div className="workspace-panel" role="tabpanel">

        {/* Editor tab */}
        {tab === 'editor' && (
          <div className="workspace-editor-tab">
            {!engineReady && !engineError && <EngineLoadingBanner />}
            {engineError && (
              <div className="engine-error">⚠ {engineError}</div>
            )}

            <SqlEditor
              ref={editorRef}
              value={answer}
              onChange={(next) => {
                setAnswer(next);
                setValidation(null);
                setQueryResult(null);
                setResultsOpen(false);
              }}
              onRun={handleRun}
              disabled={running || !engineReady}
            />

            {/* Action bar */}
            <div className="workspace-action-bar">
              <button
                type="button"
                className={runBtnClass}
                onClick={handleRun}
                disabled={!canRun}
                aria-label="Run and validate your SQL query"
              >
                {running ? (
                  <><span className="btn-spinner" aria-hidden="true" /> Running…</>
                ) : validation?.valid ? (
                  '✓ Correct'
                ) : (
                  '▶ Run Query'
                )}
              </button>
              {answer && (
                <button type="button" className="workspace-btn-secondary" onClick={handleReset}>Reset</button>
              )}
              {analysis && (
                <button
                  type="button"
                  className="workspace-btn-secondary workspace-btn-plan"
                  onClick={() => setTab('plan')}
                  title="View execution plan"
                >
                  View Plan →
                </button>
              )}
            </div>

            {/* Validation banner */}
            {validation && (
              <div className={`practice-result ${
                validation.valid    ? 'practice-result--success' :
                validation.mismatch ? 'practice-result--mismatch' :
                                      'practice-result--error'
              }`}>
                <div className="practice-result-body">
                  <span className="practice-result-status">
                    {validation.valid ? '✓' : validation.mismatch ? '◎' : '✕'} {validation.message}
                  </span>
                  {validation.mismatch && validation.expectedRowCount != null && (
                    <p className="practice-result-hint">
                      💡 Expected {validation.expectedRowCount} row{validation.expectedRowCount !== 1 ? 's' : ''}.
                    </p>
                  )}
                  {validation.valid && (
                    <p className="practice-result-hint">
                      🎉 Well done! Check the Plan tab to see how SQLite executed this query.
                    </p>
                  )}
                </div>
                <button
                  type="button"
                  className="practice-result-dismiss"
                  onClick={() => { setValidation(null); setQueryResult(null); setResultsOpen(false); }}
                  aria-label="Dismiss results"
                  title="Hide results"
                >×</button>
              </div>
            )}

            {/* Query results */}
            {queryResult && (
              <QueryResultTable
                result={queryResult}
                expectedOutput={subtopic.expectedOutput}
                open={resultsOpen}
                onToggle={() => setResultsOpen(o => !o)}
                execTime={queryResult.execTime}
              />
            )}
          </div>
        )}

        {/* Schema tab */}
        {tab === 'schema' && (
          <SchemaPanel onInsert={handleInsert} />
        )}

        {/* Plan tab */}
        {tab === 'plan' && (
          <ExecutionPlan
            analysis={analysis}
            rawPlan={rawPlan}
            result={queryResult}
          />
        )}

        {/* Hints tab */}
        {tab === 'hints' && (
          <HintsPanel subtopic={subtopic} />
        )}

        {/* Notes tab */}
        {tab === 'notes' && (
          <NotesPanel subtopicId={subtopic.id} />
        )}
      </div>
    </div>
  );
});
