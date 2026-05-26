/**
 * SQL Lab 2.0 — Interactive SQL editor with schema browser, result grid,
 * mock execution engine, and interview-prep mode.
 */
import { memo, useState, useCallback, useEffect, useRef } from 'react';
import MonacoEditor from '@monaco-editor/react';
import { MOCK_DB } from '../../data/mockDatabase.js';
import { runMockSQL } from '../../utils/mockSqlRunner.js';
import { QUESTIONS }             from '../../data/sqlLab/questions.js';
import { DEBUG_QUESTIONS }       from '../../data/sqlLab/debugQuestions.js';
import { PRODUCTION_INCIDENTS }  from '../../data/sqlLab/incidents.js';
import { DIFF_STYLE, COL_TYPES } from '../../data/sqlLab/schemas.js';
import { analyzeMismatch }       from '../../utils/sqlLabValidators.js';

// ─── Monaco config ────────────────────────────────────────────────────────────

const MONACO_SQL_OPTS = {
  theme: 'vs-dark',
  language: 'sql',
  minimap: { enabled: false },
  fontSize: 13,
  fontFamily: '"Fira Code", "Cascadia Code", monospace',
  lineNumbers: 'on',
  scrollBeyondLastLine: false,
  automaticLayout: true,
  padding: { top: 10, bottom: 10 },
  wordWrap: 'on',
  renderLineHighlight: 'all',
  suggestOnTriggerCharacters: true,
  quickSuggestions: true,
};


// ─── Schema Browser ───────────────────────────────────────────────────────────

function SchemaBrowser({ onInsertCol }) {
  const [expanded, setExpanded] = useState(new Set(['customers', 'orders']));

  function toggle(t) {
    setExpanded(prev => {
      const n = new Set(prev);
      n.has(t) ? n.delete(t) : n.add(t);
      return n;
    });
  }

  return (
    <div className="sqll-schema">
      <div className="sqll-schema-head">
        <span className="sqll-schema-label">Schema</span>
        <span className="sqll-schema-db">mock_db</span>
      </div>
      {Object.entries(MOCK_DB).map(([table, data]) => (
        <div key={table} className="sqll-table-group">
          <button type="button" className="sqll-table-btn" onClick={() => toggle(table)}>
            <span className="sqll-chevron">{expanded.has(table) ? '▾' : '▸'}</span>
            <span className="sqll-table-icon">◫</span>
            <span className="sqll-table-name">{table}</span>
            <span className="sqll-row-count">{data.rows.length}r</span>
          </button>
          {expanded.has(table) && (
            <div className="sqll-cols">
              {data.columns.map(col => (
                <button
                  key={col} type="button" className="sqll-col-btn"
                  onClick={() => onInsertCol(col)} title={`Insert ${col}`}
                >
                  <span className="sqll-col-dot">◦</span>
                  <span className="sqll-col-name">{col}</span>
                  <span className="sqll-col-type">{COL_TYPES[col] || 'TEXT'}</span>
                </button>
              ))}
            </div>
          )}
        </div>
      ))}
    </div>
  );
}

// ─── Result Grid ──────────────────────────────────────────────────────────────

function ResultGrid({ result, runMs, running }) {
  if (running) return (
    <div className="sqll-result-state">
      <span className="sqll-running-dot" />
      <span>Executing query…</span>
    </div>
  );
  if (!result) return (
    <div className="sqll-result-state sqll-result-state--empty">
      Run a query to see results — <kbd>Ctrl+Enter</kbd>
    </div>
  );
  if (result.error) return (
    <div className="sqll-result-error">
      <span className="sqll-error-icon">⚠</span>
      <span>{result.error}</span>
    </div>
  );
  if (result.complex) return (
    <div className="sqll-result-complex">
      <span className="sqll-complex-icon">◈</span>
      <div className="sqll-complex-body">
        <p className="sqll-complex-title">
          {result.feature === 'cte_window'
            ? 'CTE / Window Function — advanced query'
            : 'Complex query recognized'}
        </p>
        <p className="sqll-complex-sub">
          {result.feature === 'cte_window'
            ? 'CTEs and window functions run in the expected-output mode. Compare your logic against the expected results shown in the challenge panel.'
            : 'This query pattern is not fully supported by the mock engine. Check the expected output in the challenge panel for reference.'}
        </p>
        <span className="sqll-complex-badge">✓ Syntax accepted</span>
      </div>
    </div>
  );

  const { rows = [], columns = [], rowCount = 0 } = result;

  return (
    <div className="sqll-result">
      <div className="sqll-result-meta">
        <span className="sqll-result-count">↳ {rowCount} row{rowCount !== 1 ? 's' : ''}</span>
        {runMs > 0 && <span className="sqll-result-ms">{runMs}ms</span>}
        <span className="sqll-result-engine">mock_engine</span>
      </div>
      <div className="sqll-result-scroll">
        <table className="sqll-table">
          <thead>
            <tr>{columns.map(c => <th key={c}>{c}</th>)}</tr>
          </thead>
          <tbody>
            {rows.map((row, i) => (
              <tr key={i}>
                {columns.map(c => (
                  <td key={c}>
                    {row[c] == null
                      ? <span className="sqll-null">NULL</span>
                      : String(row[c])}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// ─── Question Panel ───────────────────────────────────────────────────────────

function QuestionPanel({ question, hintsShown, onShowHint, result, onScore, score }) {
  const ds = DIFF_STYLE[question.difficulty] || DIFF_STYLE.intermediate;
  const passed = question.validate?.(result ?? {});
  const [showContext, setShowContext] = useState(false);
  const [showExpected, setShowExpected] = useState(false);

  useEffect(() => { setShowExpected(false); }, [question.id]);

  const mismatch = (!passed && result && !result.error && !result.complex)
    ? analyzeMismatch(question, result)
    : null;

  return (
    <div className="sqll-qpanel">
      <div className="sqll-qpanel-head">
        <span className="sqll-qpanel-label">Question</span>
        <span className="sqll-qdiff" style={{ background: ds.bg, color: ds.color, border: `1px solid ${ds.border}` }}>
          {question.difficulty}
        </span>
      </div>
      <h3 className="sqll-qtitle">{question.title}</h3>
      <p className="sqll-qprompt">{question.prompt}</p>

      <div className="sqll-hints">
        {[1, 2, 3].map(lvl => (
          <button
            key={lvl}
            type="button"
            className={`sqll-hint-btn${hintsShown >= lvl ? ' sqll-hint-btn--on' : ''}`}
            onClick={() => onShowHint(lvl)}
            disabled={hintsShown >= lvl}
          >
            {hintsShown >= lvl ? `✓ Hint ${lvl}` : `Hint ${lvl}`}
          </button>
        ))}
      </div>
      {hintsShown >= 1 && <div className="sqll-hint sqll-hint--1">{question.hint1}</div>}
      {hintsShown >= 2 && <div className="sqll-hint sqll-hint--2">{question.hint2}</div>}
      {hintsShown >= 3 && <div className="sqll-hint sqll-hint--3">{question.hint3}</div>}

      {result && !result.error && (passed || result.complex) && (
        <div className={`sqll-validate ${result.complex ? 'sqll-validate--complex' : 'sqll-validate--pass'}`}>
          {result.complex ? '◈ Advanced query — check expected output below' : '✓ Output matches expected'}
        </div>
      )}

      {mismatch && (
        <div className="sqll-mismatch">
          <div className="sqll-mismatch-header">
            <span className="sqll-mismatch-icon">✗</span>
            <span className="sqll-mismatch-title">Output mismatch</span>
            {mismatch.isClose && (
              <span className="sqll-mismatch-close">Your query is close — check column order, row order, or exact filter</span>
            )}
          </div>

          <div className="sqll-mismatch-grid">
            <div className="sqll-mismatch-cell">
              <span className="sqll-mismatch-label">Expected</span>
              <span className="sqll-mismatch-val">{mismatch.expectedRowCount} row{mismatch.expectedRowCount !== 1 ? 's' : ''}</span>
              <span className="sqll-mismatch-cols">{mismatch.expectedColumns.join(', ')}</span>
            </div>
            <div className="sqll-mismatch-sep">vs</div>
            <div className="sqll-mismatch-cell sqll-mismatch-cell--actual">
              <span className="sqll-mismatch-label">Your output</span>
              <span className="sqll-mismatch-val">{mismatch.actualRowCount} row{mismatch.actualRowCount !== 1 ? 's' : ''}</span>
              <span className="sqll-mismatch-cols">{mismatch.actualColumns.length > 0 ? mismatch.actualColumns.join(', ') : '—'}</span>
            </div>
          </div>

          <div className="sqll-mismatch-detail">
            <span className="sqll-mismatch-detail-label">Likely issue:</span>
            <span>{mismatch.likelyIssue}</span>
          </div>
          <div className="sqll-mismatch-detail sqll-mismatch-detail--hint">
            <span className="sqll-mismatch-detail-label">Next step:</span>
            <span>{mismatch.hint}</span>
          </div>

          <button type="button" className="sqll-show-expected-btn" onClick={() => setShowExpected(v => !v)}>
            {showExpected ? '▾ Hide expected output' : '▸ Show expected output'}
          </button>

          {showExpected && (
            <div className="sqll-compare">
              <div className="sqll-compare-col">
                <div className="sqll-compare-label sqll-compare-label--exp">
                  Expected — {mismatch.expectedRowCount} row{mismatch.expectedRowCount !== 1 ? 's' : ''}{mismatch.expectedRowCount > 5 ? ' (first 5)' : ''}
                </div>
                <div className="sqll-compare-scroll">
                  <table className="sqll-compare-table">
                    <thead><tr>{mismatch.expectedColumns.map(c => <th key={c}>{c}</th>)}</tr></thead>
                    <tbody>
                      {mismatch.expectedRows.map((row, i) => (
                        <tr key={i}>{mismatch.expectedColumns.map(c => (
                          <td key={c}>{row[c] == null ? <span className="sqll-null">NULL</span> : String(row[c])}</td>
                        ))}</tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
              <div className="sqll-compare-col">
                <div className="sqll-compare-label sqll-compare-label--act">
                  Your output — {mismatch.actualRowCount} row{mismatch.actualRowCount !== 1 ? 's' : ''}{mismatch.actualRowCount > 5 ? ' (first 5)' : ''}
                </div>
                <div className="sqll-compare-scroll">
                  <table className="sqll-compare-table">
                    <thead><tr>{mismatch.actualColumns.map(c => <th key={c}>{c}</th>)}</tr></thead>
                    <tbody>
                      {mismatch.actualRows.map((row, i) => (
                        <tr key={i}>{mismatch.actualColumns.map(c => (
                          <td key={c}>{row[c] == null ? <span className="sqll-null">NULL</span> : String(row[c])}</td>
                        ))}</tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {question.expectedOutput && (
        <div className="sqll-expected-output">
          <span className="sqll-expected-label">Expected output (first 3 rows)</span>
          <div className="sqll-expected-table-wrap">
            <table className="sqll-expected-table">
              <thead>
                <tr>{Object.keys(question.expectedOutput[0]).map(k => <th key={k}>{k}</th>)}</tr>
              </thead>
              <tbody>
                {question.expectedOutput.map((row, i) => (
                  <tr key={i}>
                    {Object.values(row).map((v, j) => <td key={j}>{v}</td>)}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {result && !score && (
        <div className="sqll-self-score">
          <p className="sqll-self-label">Self-assessment</p>
          <div className="sqll-score-btns">
            <button type="button" className="sqll-score-btn sqll-score-btn--miss" onClick={() => onScore('miss')}>✗ Missed</button>
            <button type="button" className="sqll-score-btn sqll-score-btn--almost" onClick={() => onScore('almost')}>~ Almost</button>
            <button type="button" className="sqll-score-btn sqll-score-btn--got" onClick={() => onScore('got')}>✓ Got it</button>
          </div>
        </div>
      )}
      {score && (
        <div className={`sqll-score-result sqll-score-result--${score}`}>
          {score === 'got' ? '✓ Solved' : score === 'almost' ? '~ Almost — review the answer' : '✗ Missed — study the approach'}
        </div>
      )}

      {(question.whyMatters || question.wrongApproach || question.optimizationNote || question.juniorMistake || question.productionTradeoff) && (
        <div className="sqll-eng-context">
          <button
            type="button"
            className={`sqll-eng-toggle${showContext ? ' sqll-eng-toggle--open' : ''}`}
            onClick={() => setShowContext(v => !v)}
          >
            <span className="sqll-eng-toggle-icon">{showContext ? '▾' : '▸'}</span>
            Engineering Context
          </button>
          {showContext && (
            <div className="sqll-eng-body">
              {question.whyMatters && (
                <div className="sqll-eng-block sqll-eng-block--why">
                  <span className="sqll-eng-label">Why this matters</span>
                  <p>{question.whyMatters}</p>
                </div>
              )}
              {question.wrongApproach && (
                <div className="sqll-eng-block sqll-eng-block--wrong">
                  <span className="sqll-eng-label">Common mistake</span>
                  <p>{question.wrongApproach}</p>
                </div>
              )}
              {question.juniorMistake && (
                <div className="sqll-eng-block sqll-eng-block--junior">
                  <span className="sqll-eng-label">What juniors miss</span>
                  <p>{question.juniorMistake}</p>
                </div>
              )}
              {question.optimizationNote && (
                <div className="sqll-eng-block sqll-eng-block--opt">
                  <span className="sqll-eng-label">Production optimization</span>
                  <p>{question.optimizationNote}</p>
                </div>
              )}
              {question.productionTradeoff && (
                <div className="sqll-eng-block sqll-eng-block--tradeoff">
                  <span className="sqll-eng-label">Production tradeoff</span>
                  <p>{question.productionTradeoff}</p>
                </div>
              )}
              {question.engineeringContext && (
                <div className="sqll-eng-block sqll-eng-block--ctx">
                  <span className="sqll-eng-label">Engineering context</span>
                  <p>{question.engineeringContext}</p>
                </div>
              )}
              {question.performanceNote && (
                <div className="sqll-eng-block sqll-eng-block--perf">
                  <span className="sqll-eng-label">What breaks at scale</span>
                  <p>{question.performanceNote}</p>
                </div>
              )}
              {question.interviewExpectation && (
                <div className="sqll-eng-block sqll-eng-block--interview">
                  <span className="sqll-eng-label">Interviewer expectations</span>
                  <p>{question.interviewExpectation}</p>
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// ─── Debug Panel ─────────────────────────────────────────────────────────────

function DebugPanel({ question, onScore, score, onLoadQuery }) {
  const [revealed, setRevealed] = useState(false);
  useEffect(() => { setRevealed(false); }, [question.id]);

  return (
    <div className="sqll-qpanel">
      <div className="sqll-qpanel-head">
        <span className="sqll-qpanel-label">Debug Challenge</span>
        <span className="sqll-qdiff" style={{ background: '#431407 20', color: '#fb923c', border: '1px solid #92400e40' }}>
          bug
        </span>
      </div>
      <h3 className="sqll-qtitle">{question.title}</h3>

      <div className="sqll-debug-meta">
        <span className="sqll-debug-type-label">Bug category:</span>
        <code className="sqll-debug-type">{question.bugType}</code>
      </div>

      <p className="sqll-qprompt">{question.scenario}</p>

      <button
        type="button"
        className="sqll-hint-btn"
        style={{ marginBottom: 8 }}
        onClick={() => onLoadQuery(question.brokenSql)}
      >
        ↳ Load broken query
      </button>

      <div className="sqll-hint sqll-hint--1">{question.hint}</div>

      {!score && (
        <div className="sqll-self-score">
          <p className="sqll-self-label">Did you find and fix the bug?</p>
          <div className="sqll-score-btns">
            <button type="button" className="sqll-score-btn sqll-score-btn--miss" onClick={() => { setRevealed(true); onScore('miss'); }}>✗ Missed it</button>
            <button type="button" className="sqll-score-btn sqll-score-btn--almost" onClick={() => { setRevealed(true); onScore('almost'); }}>~ Partially</button>
            <button type="button" className="sqll-score-btn sqll-score-btn--got" onClick={() => { setRevealed(true); onScore('got'); }}>✓ Fixed it</button>
          </div>
        </div>
      )}
      {score && (
        <div className={`sqll-score-result sqll-score-result--${score}`}>
          {score === 'got' ? '✓ Bug found & fixed' : score === 'almost' ? '~ Partially correct — review the fix' : '✗ Missed — study the root cause'}
        </div>
      )}

      {(revealed || score) && (
        <div className="sqll-eng-context">
          <div className="sqll-eng-body">
            <div className="sqll-eng-block sqll-eng-block--wrong">
              <span className="sqll-eng-label">Root cause</span>
              <p>{question.bugDescription}</p>
            </div>
            <div className="sqll-eng-block sqll-eng-block--opt">
              <span className="sqll-eng-label">Fixed query</span>
              <pre className="sqll-debug-fixed">{question.fixedSql}</pre>
            </div>
            <div className="sqll-eng-block sqll-eng-block--ctx">
              <span className="sqll-eng-label">Interview note</span>
              <p>{question.interviewNote}</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Incident Panel ───────────────────────────────────────────────────────────

function IncidentPanel() {
  const [openId, setOpenId] = useState(null);
  const SEV = { P1: { bg: '#450a0a30', color: '#fca5a5', border: '#991b1b40' }, P2: { bg: '#451a0330', color: '#fcd34d', border: '#92400e40' } };

  return (
    <div className="sqll-incidents">
      <div className="sqll-incidents-header">
        <span className="sqll-incidents-title">Production Incident SQL — Study Mode</span>
        <span className="sqll-incidents-sub">Real patterns from data engineering on-call. Diagnose the symptom, understand the root cause, apply the fix.</span>
      </div>
      {PRODUCTION_INCIDENTS.map(inc => {
        const s = SEV[inc.severity] ?? SEV.P2;
        const open = openId === inc.id;
        return (
          <div key={inc.id} className="sqll-incident-card">
            <button
              type="button"
              className="sqll-incident-header"
              onClick={() => setOpenId(open ? null : inc.id)}
            >
              <span className="sqll-incident-sev" style={{ background: s.bg, color: s.color, border: `1px solid ${s.border}` }}>{inc.severity}</span>
              <span className="sqll-incident-title-text">{inc.title}</span>
              <span className="sqll-incident-chevron">{open ? '▾' : '▸'}</span>
            </button>

            {open && (
              <div className="sqll-incident-body">
                <div className="sqll-eng-block sqll-eng-block--wrong">
                  <span className="sqll-eng-label">Symptom</span>
                  <p>{inc.symptom}</p>
                </div>
                <div className="sqll-eng-block" style={{ background: '#0c1219', border: '1px solid #1e2d3d' }}>
                  <span className="sqll-eng-label" style={{ color: '#38bdf8' }}>Diagnosis query</span>
                  <pre className="sqll-incident-sql">{inc.diagnosisQuery}</pre>
                </div>
                <div className="sqll-eng-block sqll-eng-block--why">
                  <span className="sqll-eng-label">Root cause</span>
                  <p>{inc.rootCause}</p>
                </div>
                <div className="sqll-eng-block sqll-eng-block--opt">
                  <span className="sqll-eng-label">Fix query</span>
                  <pre className="sqll-incident-sql">{inc.fixQuery}</pre>
                </div>
                <div className="sqll-eng-block sqll-eng-block--ctx">
                  <span className="sqll-eng-label">Prevention</span>
                  <p>{inc.prevention}</p>
                </div>
                <div className="sqll-eng-block sqll-eng-block--interview">
                  <span className="sqll-eng-label">Lesson learned</span>
                  <p>{inc.lesson}</p>
                </div>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}

// ─── SQLLab ───────────────────────────────────────────────────────────────────

const SQLLab = memo(function SQLLab() {
  const [mode, setMode]       = useState('practice');
  const [sql, setSql]         = useState("-- Welcome to SQL Lab\n-- Press Ctrl+Enter (Cmd+Enter on Mac) to run\n\nSELECT *\nFROM customers\nLIMIT 5;");
  const [result, setResult]   = useState(null);
  const [running, setRunning] = useState(false);
  const [runMs, setRunMs]     = useState(0);

  // Interview state
  const [qIdx, setQIdx]           = useState(0);
  const [hintsShown, setHintsShown] = useState(0);
  const [scores, setScores]       = useState([]);
  const [done, setDone]           = useState(false);

  // Debug mode state
  const [dbgIdx, setDbgIdx]       = useState(0);
  const [dbgScores, setDbgScores] = useState([]);
  const [dbgDone, setDbgDone]     = useState(false);

  const editorRef    = useRef(null);
  const handleRunRef = useRef(null);

  const handleRun = useCallback(() => {
    const query = editorRef.current?.getValue() ?? sql;
    if (!query.trim()) return;
    setRunning(true);
    setResult(null);
    const t0 = Date.now();
    setTimeout(() => {
      setResult(runMockSQL(query));
      setRunMs(Date.now() - t0);
      setRunning(false);
    }, 350 + Math.floor(Math.random() * 450));
  }, [sql]);

  useEffect(() => {
    handleRunRef.current = handleRun;
  }, [handleRun]);

  const handleMount = useCallback((editor, monaco) => {
    editorRef.current = editor;
    editor.addCommand(monaco.KeyMod.CtrlCmd | monaco.KeyCode.Enter, () => handleRunRef.current?.());
  }, []);

  function insertCol(col) {
    const editor = editorRef.current;
    if (!editor) return;
    const pos = editor.getPosition();
    editor.executeEdits('', [{
      range: { startLineNumber: pos.lineNumber, startColumn: pos.column, endLineNumber: pos.lineNumber, endColumn: pos.column },
      text: col,
    }]);
    editor.focus();
  }

  function handleScore(s) {
    const next = [...scores, s];
    setScores(next);
    if (qIdx + 1 >= QUESTIONS.length) {
      setDone(true);
    } else {
      setQIdx(i => i + 1);
      setHintsShown(0);
      setResult(null);
      editorRef.current?.setValue('-- Write your SQL here\n');
    }
  }

  function resetInterview() {
    setQIdx(0); setScores([]); setHintsShown(0); setResult(null); setDone(false);
    editorRef.current?.setValue('-- Write your SQL here\n');
  }

  function resetDebug() {
    setDbgIdx(0); setDbgScores([]); setDbgDone(false); setResult(null);
    editorRef.current?.setValue('-- Load a broken query using the button →\n');
  }

  function switchMode(m) {
    setMode(m);
    setResult(null);
    if (m === 'interview') resetInterview();
    else if (m === 'debug') resetDebug();
    else if (m === 'incident') { /* read-only mode, no editor change */ }
    else {
      editorRef.current?.setValue("SELECT *\nFROM customers\nLIMIT 5;");
    }
  }

  const isInterview = mode === 'interview';
  const isDebug     = mode === 'debug';
  const isIncident  = mode === 'incident';

  // ── Interview completion ──────────────────────────────────────────────────
  if (isInterview && done) {
    const got = scores.filter(s => s === 'got').length;
    const pct = Math.round((got / QUESTIONS.length) * 100);
    return (
      <section className="section" id="sql-lab">
        <div className="sqll-header">
          <div><p className="eyebrow">SQL Lab</p><h2>Session Complete</h2></div>
        </div>
        <div className="sqll-done">
          <div className="sqll-done-score">
            <span className="sqll-done-pct">{pct}%</span>
            <span className="sqll-done-sub">{got} / {QUESTIONS.length} correct</span>
          </div>
          <p className="sqll-done-msg">
            {pct >= 80
              ? '✦ SQL Interview-Ready — you handled aggregations, filters, and ordering with confidence.'
              : pct >= 60
              ? '◈ Good foundation — review GROUP BY, aggregation patterns, and ORDER BY.'
              : '◎ Keep practising — focus on SELECT, WHERE, GROUP BY, and ORDER BY fundamentals.'}
          </p>
          <div className="sqll-done-list">
            {QUESTIONS.map((q, i) => (
              <div key={q.id} className={`sqll-done-row sqll-done-row--${scores[i] ?? 'skip'}`}>
                <span className="sqll-done-icon">{scores[i] === 'got' ? '✓' : scores[i] === 'almost' ? '~' : '✗'}</span>
                <span className="sqll-done-title">{q.title}</span>
                <span className="sqll-done-diff">{q.difficulty}</span>
              </div>
            ))}
          </div>
          <div style={{ display: 'flex', gap: 8 }}>
            <button type="button" className="secondary-button" onClick={resetInterview}>↺ Retry session</button>
            <button type="button" className="secondary-button" onClick={() => switchMode('practice')}>Open free SQL lab</button>
          </div>
        </div>
      </section>
    );
  }

  // ── Debug completion ──────────────────────────────────────────────────────
  if (isDebug && dbgDone) {
    const got = dbgScores.filter(s => s === 'got').length;
    return (
      <section className="section" id="sql-lab">
        <div className="sqll-header">
          <div><p className="eyebrow">SQL Lab</p><h2>Debug Session Complete</h2></div>
        </div>
        <div className="sqll-done">
          <div className="sqll-done-score">
            <span className="sqll-done-pct">{got}/{DEBUG_QUESTIONS.length}</span>
            <span className="sqll-done-sub">bugs found and fixed</span>
          </div>
          <p className="sqll-done-msg">
            {got >= 4
              ? '✦ Sharp debugging instincts — you caught the production-critical patterns.'
              : got >= 2
              ? '◈ Good start — review the missed bugs, they appear in real production code.'
              : '◎ Keep practising — these bugs cause silent data loss in production pipelines.'}
          </p>
          <div className="sqll-done-list">
            {DEBUG_QUESTIONS.map((q, i) => (
              <div key={q.id} className={`sqll-done-row sqll-done-row--${dbgScores[i] ?? 'skip'}`}>
                <span className="sqll-done-icon">{dbgScores[i] === 'got' ? '✓' : dbgScores[i] === 'almost' ? '~' : '✗'}</span>
                <span className="sqll-done-title">{q.title}</span>
                <span className="sqll-done-diff">{q.bugType}</span>
              </div>
            ))}
          </div>
          <button type="button" className="secondary-button" onClick={resetDebug}>↺ Retry debug session</button>
        </div>
      </section>
    );
  }

  // ── Incident reference mode ───────────────────────────────────────────────
  if (isIncident) {
    return (
      <section className="section" id="sql-lab">
        <div className="sqll-header">
          <div><p className="eyebrow">SQL Lab</p><h2>Production Incident SQL</h2></div>
          <div className="sqll-modes">
            {[
              { id: 'practice',  label: '◎ Practice'   },
              { id: 'interview', label: '⏱ Interview'  },
              { id: 'debug',     label: '☰ Debug'      },
              { id: 'incident',  label: '⚠ Incidents'  },
            ].map(m => (
              <button key={m.id} type="button"
                className={`sqll-mode-btn${mode === m.id ? ' sqll-mode-btn--on' : ''}`}
                onClick={() => switchMode(m.id)}
              >{m.label}</button>
            ))}
          </div>
        </div>
        <IncidentPanel />
      </section>
    );
  }

  // ── Main workspace ────────────────────────────────────────────────────────
  return (
    <section className="section" id="sql-lab">
      {/* Header bar */}
      <div className="sqll-header">
        <div>
          <p className="eyebrow">Interactive</p>
          <h2>SQL Lab</h2>
        </div>
        <div className="sqll-modes">
          {[
            { id: 'practice',  label: '◎ Practice'  },
            { id: 'interview', label: '⏱ Interview' },
            { id: 'debug',     label: '☰ Debug'     },
            { id: 'incident',  label: '⚠ Incidents' },
          ].map(m => (
            <button
              key={m.id}
              type="button"
              className={`sqll-mode-btn${mode === m.id ? ' sqll-mode-btn--on' : ''}`}
              onClick={() => switchMode(m.id)}
            >
              {m.label}
            </button>
          ))}
        </div>
        <div className="sqll-meta">
          <span className="sqll-chip sqll-chip--db">mock_db</span>
          <span className="sqll-chip">{Object.keys(MOCK_DB).length} tables</span>
          <span className="sqll-chip sqll-chip--live">● LIVE ENGINE</span>
        </div>
      </div>

      {/* Purpose card */}
      {!isInterview && (
        <div className="lab-purpose-card">
          <div className="lab-purpose-header">
            <span className="lab-purpose-icon">🔷</span>
            <div>
              <div className="lab-purpose-title">SQL Analytics Lab</div>
              <div style={{ fontSize: '0.85rem', color: 'var(--muted)', marginTop: 2 }}>
                Estimated time: 20–60 min per challenge
              </div>
            </div>
          </div>
          <strong style={{ fontSize: '0.85rem', color: 'var(--heading)' }}>What you will practice:</strong>
          <ul style={{ margin: '8px 0 12px', paddingLeft: 18, fontSize: '0.875rem', color: 'var(--text)' }}>
            <li>Complex queries — GROUP BY, aggregations, ORDER BY, LIMIT</li>
            <li>Window functions and query optimisation techniques</li>
            <li>Interview-style timed SQL challenges with self-assessment</li>
          </ul>
          <div className="lab-skills-row">
            {['SQL', 'Query Planning', 'Performance Tuning', 'Analytics'].map(s => (
              <span key={s} className="lab-skill-badge">{s}</span>
            ))}
          </div>
        </div>
      )}

      {/* Interview progress bar */}
      {isInterview && !done && (
        <div className="sqll-progress">
          <div className="sqll-progress-bar">
            <div className="sqll-progress-fill" style={{ width: `${(qIdx / QUESTIONS.length) * 100}%` }} />
          </div>
          <span className="sqll-progress-label">Q{qIdx + 1} / {QUESTIONS.length}</span>
          {scores.filter(s => s === 'got').length > 0 && (
            <span className="sqll-progress-score">✓ {scores.filter(s => s === 'got').length} solved</span>
          )}
        </div>
      )}

      {/* Debug progress bar */}
      {isDebug && !dbgDone && (
        <div className="sqll-progress">
          <div className="sqll-progress-bar">
            <div className="sqll-progress-fill" style={{ width: `${(dbgIdx / DEBUG_QUESTIONS.length) * 100}%`, background: '#fb923c' }} />
          </div>
          <span className="sqll-progress-label">Bug {dbgIdx + 1} / {DEBUG_QUESTIONS.length}</span>
          {dbgScores.filter(s => s === 'got').length > 0 && (
            <span className="sqll-progress-score" style={{ color: '#fb923c' }}>✓ {dbgScores.filter(s => s === 'got').length} fixed</span>
          )}
        </div>
      )}

      {/* Workspace grid */}
      <div className={`sqll-workspace${(isInterview || isDebug) ? ' sqll-workspace--interview' : ''}`}>
        <SchemaBrowser onInsertCol={insertCol} />

        {/* Editor + Results */}
        <div className="sqll-editor-col">
          <div className="sqll-toolbar">
            <span className="sqll-file">query.sql</span>
            <span className="sqll-kbd-hint">⌃↵ / ⌘↵ to run</span>
            <button
              type="button"
              className={`sqll-run-btn${running ? ' sqll-run-btn--busy' : ''}`}
              onClick={handleRun}
              disabled={running}
            >
              {running ? '⟳  Running…' : '▶  Run'}
            </button>
            <button
              type="button"
              className="sqll-clear-btn"
              onClick={() => { setResult(null); editorRef.current?.setValue(''); }}
            >
              Clear
            </button>
          </div>
          <div className="sqll-monaco">
            <MonacoEditor
              height="220px"
              defaultLanguage="sql"
              value={sql}
              onChange={v => setSql(v ?? '')}
              onMount={handleMount}
              options={MONACO_SQL_OPTS}
            />
          </div>
          <ResultGrid result={result} runMs={runMs} running={running} />
        </div>

        {/* Question panel — interview mode */}
        {isInterview && !done && (
          <QuestionPanel
            question={QUESTIONS[qIdx]}
            hintsShown={hintsShown}
            onShowHint={lvl => setHintsShown(l => Math.max(l, lvl))}
            result={result}
            onScore={handleScore}
            score={scores[qIdx]}
          />
        )}

        {/* Debug panel */}
        {isDebug && !dbgDone && (
          <DebugPanel
            question={DEBUG_QUESTIONS[dbgIdx]}
            onScore={s => {
              const next = [...dbgScores, s];
              setDbgScores(next);
              if (dbgIdx + 1 >= DEBUG_QUESTIONS.length) {
                setDbgDone(true);
              } else {
                setDbgIdx(i => i + 1);
                setResult(null);
                editorRef.current?.setValue('-- Load the next broken query →\n');
              }
            }}
            score={dbgScores[dbgIdx]}
            onLoadQuery={q => {
              editorRef.current?.setValue(q);
              setResult(null);
            }}
          />
        )}
      </div>
    </section>
  );
});

export default SQLLab;
