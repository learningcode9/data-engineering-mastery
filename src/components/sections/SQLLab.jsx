/**
 * SQL Lab 2.0 — Interactive SQL editor with schema browser, result grid,
 * mock execution engine, and interview-prep mode.
 */
import { memo, useState, useCallback, useEffect, useRef } from 'react';
import MonacoEditor from '@monaco-editor/react';
import { MOCK_DB } from '../../data/mockDatabase.js';
import { runMockSQL } from '../../utils/mockSqlRunner.js';

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

// ─── Practice questions ───────────────────────────────────────────────────────

const QUESTIONS = [
  {
    id: 'q1', difficulty: 'beginner', title: 'Active Customers',
    prompt: 'Return customer_name and city for all customers with status "active".',
    hint1: 'Use SELECT with specific columns — not *',
    hint2: "Add WHERE status = 'active'",
    hint3: "SELECT customer_name, city FROM customers WHERE status = 'active'",
    validate: r => !r.error && !r.complex && r.rows?.length === 4,
    answer: "SELECT customer_name, city\nFROM customers\nWHERE status = 'active';",
  },
  {
    id: 'q2', difficulty: 'beginner', title: 'Orders by Status',
    prompt: 'Count the number of orders grouped by status. Alias the count as order_count.',
    hint1: 'Use GROUP BY on the status column',
    hint2: 'Use COUNT(*) as the aggregate',
    hint3: "SELECT status, COUNT(*) as order_count FROM orders GROUP BY status",
    validate: r => !r.error && !r.complex && r.rows?.length >= 2,
    answer: "SELECT status, COUNT(*) as order_count\nFROM orders\nGROUP BY status;",
  },
  {
    id: 'q3', difficulty: 'intermediate', title: 'High-Value Orders',
    prompt: 'Find orders with amount greater than 100. Return order_id, customer_id, and amount. Sort by amount descending.',
    hint1: 'WHERE amount > 100',
    hint2: 'ORDER BY amount DESC',
    hint3: "SELECT order_id, customer_id, amount FROM orders WHERE amount > 100 ORDER BY amount DESC",
    validate: r => !r.error && !r.complex && r.rows?.length >= 2 && r.rows[0]?.amount >= (r.rows[1]?.amount ?? 0),
    answer: "SELECT order_id, customer_id, amount\nFROM orders\nWHERE amount > 100\nORDER BY amount DESC;",
  },
  {
    id: 'q4', difficulty: 'intermediate', title: 'Category Revenue',
    prompt: 'Calculate total price per product category. Return category and total. Sort by total descending.',
    hint1: 'GROUP BY category',
    hint2: 'Use SUM(price) as total',
    hint3: "SELECT category, SUM(price) as total FROM products GROUP BY category ORDER BY total DESC",
    validate: r => !r.error && !r.complex && r.rows?.length >= 2,
    answer: "SELECT category, SUM(price) as total\nFROM products\nGROUP BY category\nORDER BY total DESC;",
  },
  {
    id: 'q5', difficulty: 'beginner', title: 'Dallas Customers',
    prompt: "How many customers are from Dallas? Return a single number aliased as 'count'.",
    hint1: 'Use COUNT(*)',
    hint2: "WHERE city = 'Dallas'",
    hint3: "SELECT COUNT(*) as count FROM customers WHERE city = 'Dallas'",
    validate: r => !r.error && !r.complex && r.rows?.length === 1,
    answer: "SELECT COUNT(*) as count\nFROM customers\nWHERE city = 'Dallas';",
  },
  {
    id: 'q6', difficulty: 'advanced', title: 'Most Expensive Product',
    prompt: 'Return the single most expensive product. Show product_name and price.',
    hint1: 'ORDER BY price DESC',
    hint2: 'LIMIT 1',
    hint3: "SELECT product_name, price FROM products ORDER BY price DESC LIMIT 1",
    validate: r => !r.error && !r.complex && r.rows?.length === 1 && r.rows[0]?.price === 149,
    answer: "SELECT product_name, price\nFROM products\nORDER BY price DESC\nLIMIT 1;",
  },
  {
    id: 'q7', difficulty: 'intermediate', title: 'Shipped Order Total',
    prompt: "Calculate the total amount of all 'shipped' orders.",
    hint1: "Filter WHERE status = 'shipped'",
    hint2: 'Use SUM(amount)',
    hint3: "SELECT SUM(amount) as total_shipped FROM orders WHERE status = 'shipped'",
    validate: r => !r.error && !r.complex && r.rows?.length === 1,
    answer: "SELECT SUM(amount) as total_shipped\nFROM orders\nWHERE status = 'shipped';",
  },
  {
    id: 'q8', difficulty: 'advanced', title: 'Avg Order Amount by Status',
    prompt: 'Find the average order amount for each status. Order by average descending.',
    hint1: 'GROUP BY status',
    hint2: 'Use AVG(amount)',
    hint3: "SELECT status, AVG(amount) as avg_amount FROM orders GROUP BY status ORDER BY avg_amount DESC",
    validate: r => !r.error && !r.complex && r.rows?.length >= 2,
    answer: "SELECT status, AVG(amount) as avg_amount\nFROM orders\nGROUP BY status\nORDER BY avg_amount DESC;",
  },
];

const DIFF_STYLE = {
  beginner:     { bg: '#d1fae520', color: '#4ade80', border: '#16653040' },
  intermediate: { bg: '#fef3c720', color: '#fcd34d', border: '#92400e40' },
  advanced:     { bg: '#fee2e220', color: '#fca5a5', border: '#991b1b40' },
};

const COL_TYPES = {
  customer_id: 'INT PK', customer_name: 'VARCHAR', city: 'VARCHAR', status: 'VARCHAR',
  order_id: 'INT PK', amount: 'DECIMAL', created_at: 'DATE',
  product_id: 'INT PK', product_name: 'VARCHAR', category: 'VARCHAR', price: 'DECIMAL',
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
      <p>Complex query (JOINs / CTEs / window functions) — would execute in production.</p>
      <p>The mock engine supports single-table queries for practice. Try a simpler query to see live results.</p>
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

      {result && !result.error && !result.complex && (
        <div className={`sqll-validate ${passed ? 'sqll-validate--pass' : 'sqll-validate--fail'}`}>
          {passed ? '✓ Output matches expected' : '✗ Output mismatch — recheck your query'}
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

  function switchMode(m) {
    setMode(m);
    setResult(null);
    if (m === 'interview') resetInterview();
    else {
      editorRef.current?.setValue("SELECT *\nFROM customers\nLIMIT 5;");
    }
  }

  const isInterview = mode === 'interview';

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

      {/* Workspace grid */}
      <div className={`sqll-workspace${isInterview ? ' sqll-workspace--interview' : ''}`}>
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

        {/* Question panel — interview mode only */}
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
      </div>
    </section>
  );
});

export default SQLLab;
