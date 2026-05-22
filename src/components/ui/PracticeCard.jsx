import { useState } from 'react';
import { CodeBlock } from './CodeBlock.jsx';
import { DifficultyBadge } from './DifficultyBadge.jsx';
import { QueryResultTable } from './QueryResultTable.jsx';
import { QueryHistory } from './QueryHistory.jsx';
import { useLocalStorage } from '../../hooks/useLocalStorage.js';
import { useSqlEngine } from '../../hooks/useSqlEngine.js';
import { TABLE_SCHEMAS } from '../../utils/sqlEngine.js';
import { toast } from '../../utils/toast.js';

// ── Schema explorer ────────────────────────────────────────────────────────────
function SchemaExplorer() {
  const [expandedTable, setExpandedTable] = useState(null);

  return (
    <div className="schema-explorer">
      <div className="schema-explorer-header">
        <span className="schema-explorer-title">Playground Schema</span>
        <span className="schema-explorer-hint">5 tables · click to inspect</span>
      </div>
      <div className="schema-table-list">
        {Object.entries(TABLE_SCHEMAS).map(([name, schema]) => {
          const isOpen = expandedTable === name;
          return (
            <div key={name} className={`schema-table-item${isOpen ? ' schema-table-item--open' : ''}`}>
              <button
                type="button"
                className="schema-table-trigger"
                onClick={() => setExpandedTable(isOpen ? null : name)}
                aria-expanded={isOpen}
              >
                <span className="schema-table-icon" aria-hidden="true">⊞</span>
                <span className="schema-table-name">{name}</span>
                <span className="schema-table-count">{schema.rowCount} rows</span>
                <span className={`result-chevron${isOpen ? ' result-chevron--open' : ''}`} aria-hidden="true">▾</span>
              </button>
              {isOpen && (
                <div className="schema-table-body">
                  <p className="schema-table-note">{schema.note}</p>
                  <table className="schema-col-table">
                    <thead>
                      <tr>
                        <th>Column</th>
                        <th>Type</th>
                        <th></th>
                      </tr>
                    </thead>
                    <tbody>
                      {schema.columns.map((col, i) => (
                        <tr key={col}>
                          <td className="schema-col-name">{col}</td>
                          <td className="schema-col-type">{schema.types[i]}</td>
                          <td className="schema-col-meta">
                            {col === schema.pk && <span className="schema-badge schema-badge--pk">PK</span>}
                            {schema.fks?.[col] && (
                              <span className="schema-badge schema-badge--fk" title={`→ ${schema.fks[col]}`}>FK</span>
                            )}
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
    </div>
  );
}

// ── Engine loading states ──────────────────────────────────────────────────────
function EngineLoading() {
  return (
    <div className="engine-loading">
      <span className="engine-spinner" aria-hidden="true" />
      <span>Loading SQL engine…</span>
    </div>
  );
}

function EngineError({ message }) {
  return (
    <div className="engine-error">
      ⚠ SQL engine failed to load: {message}
    </div>
  );
}

// ── PracticeCard ───────────────────────────────────────────────────────────────
export function PracticeCard({ subtopic, completed, onToggleComplete, sqlMode = false }) {
  const [showHint,     setShowHint]     = useState(false);
  const [showSolution, setShowSolution] = useState(false);
  const [showSchema,   setShowSchema]   = useState(false);
  const [answer,       setAnswer]       = useLocalStorage(`dem-practice-answer-${subtopic.id}`, '');
  const [validation,   setValidation]   = useState(null);
  const [queryResult,  setQueryResult]  = useState(null);
  const [resultsOpen,  setResultsOpen]  = useState(false);

  // Real SQL engine (only used when sqlMode = true)
  const { engineReady, engineError, running, history, runAndValidate, clearHistory } =
    useSqlEngine();

  async function handleRun() {
    if (!sqlMode || !answer.trim()) return;

    const outcome = await runAndValidate(answer, subtopic.solution);
    if (!outcome) return;

    setValidation({
      valid:      outcome.valid,
      message:    outcome.message,
      mismatch:   outcome.mismatch ?? false,
      expectedRowCount: outcome.expectedRowCount ?? null,
    });
    setQueryResult(outcome.queryResult);
    setResultsOpen(true);

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
    setShowHint(false);
    setShowSolution(false);
  }

  function handleRerun(sql) {
    setAnswer(sql);
    setValidation(null);
    setQueryResult(null);
    setResultsOpen(false);
  }

  const textareaClass = [
    'practice-textarea',
    validation?.valid                   ? 'practice-textarea--valid' : '',
    validation && !validation.valid     ? 'practice-textarea--error' : '',
    running                             ? 'practice-textarea--running' : '',
  ].filter(Boolean).join(' ');

  const showRunButton = sqlMode && subtopic.solution;
  const canRun        = engineReady && !running && !!answer.trim();

  return (
    <div className={`practice-card${completed ? ' practice-done' : ''}`}>
      {/* ── Header ── */}
      <div className="practice-header">
        <div className="practice-meta">
          <span className="practice-label">Practice Task</span>
          <DifficultyBadge level={subtopic.difficulty} />
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

      <p className="practice-question">{subtopic.practice}</p>

      {/* ── SQL mode: schema toggle ── */}
      {sqlMode && (
        <div className="practice-schema-bar">
          <button
            type="button"
            className={`practice-schema-btn${showSchema ? ' active' : ''}`}
            onClick={() => setShowSchema(s => !s)}
            aria-expanded={showSchema}
          >
            <span aria-hidden="true">⊞</span> Schema
            <span className={`result-chevron${showSchema ? ' result-chevron--open' : ''}`} aria-hidden="true">▾</span>
          </button>
          <span className="schema-pills">
            {Object.keys(TABLE_SCHEMAS).map(t => (
              <span key={t} className="schema-pill">{t}</span>
            ))}
          </span>
        </div>
      )}

      {sqlMode && showSchema && <SchemaExplorer />}

      {/* ── Engine states ── */}
      {sqlMode && !engineReady && !engineError && <EngineLoading />}
      {sqlMode && engineError && <EngineError message={engineError} />}

      {/* ── Editor ── */}
      <div className="practice-editor-wrap">
        <textarea
          className={textareaClass}
          placeholder={sqlMode ? 'Write your SQL query here…' : 'Write your code or answer here…'}
          value={answer}
          onChange={e => {
            setAnswer(e.target.value);
            setValidation(null);
            setQueryResult(null);
            setResultsOpen(false);
          }}
          onKeyDown={e => {
            if (sqlMode && (e.metaKey || e.ctrlKey) && e.key === 'Enter') {
              e.preventDefault();
              if (canRun) handleRun();
            }
          }}
          aria-label={`Practice answer for ${subtopic.title}`}
          spellCheck={false}
          disabled={running}
        />
        {sqlMode && (
          <span className="practice-shortcut-hint">
            <kbd>⌘</kbd><kbd>↵</kbd> to run
          </span>
        )}
      </div>

      {/* ── Validation banner ── */}
      {validation && (
        <div className={`practice-result ${
          validation.valid    ? 'practice-result--success' :
          validation.mismatch ? 'practice-result--mismatch' :
                                'practice-result--error'
        }`}>
          <span className="practice-result-status">
            {validation.valid ? '✓' : validation.mismatch ? '◎' : '✕'} {validation.message}
          </span>
          {validation.mismatch && validation.expectedRowCount != null && (
            <p className="practice-result-hint">
              💡 Expected {validation.expectedRowCount} row{validation.expectedRowCount !== 1 ? 's' : ''}.
              Your query returned {queryResult?.rowCount ?? 0}.
            </p>
          )}
        </div>
      )}

      {/* ── Live query result ── */}
      {queryResult && (
        <QueryResultTable
          result={queryResult}
          expectedOutput={subtopic.expectedOutput}
          open={resultsOpen}
          onToggle={() => setResultsOpen(o => !o)}
          execTime={queryResult.execTime}
        />
      )}

      {/* ── Actions ── */}
      <div className="practice-actions">
        {showRunButton && (
          <button
            type="button"
            className={`practice-run-btn${validation?.valid ? ' practice-run-btn--success' : ''}${running ? ' practice-run-btn--running' : ''}`}
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
        )}
        {answer && (
          <button type="button" className="secondary-button practice-btn" onClick={handleReset}>
            Reset
          </button>
        )}
        {subtopic.hint && (
          <button type="button" className="secondary-button practice-btn" onClick={() => setShowHint(h => !h)}>
            {showHint ? 'Hide hint' : 'Hint'}
          </button>
        )}
        {subtopic.solution && (
          <button type="button" className="secondary-button practice-btn" onClick={() => setShowSolution(s => !s)}>
            {showSolution ? 'Hide solution' : 'Solution'}
          </button>
        )}
      </div>

      {/* ── Hint / Solution reveals ── */}
      {showHint && subtopic.hint && (
        <div className="practice-reveal practice-hint">
          <span>Hint</span>
          <p>{subtopic.hint}</p>
        </div>
      )}

      {showSolution && subtopic.solution && (
        <div className="practice-reveal practice-solution">
          <span>Solution</span>
          <CodeBlock code={subtopic.solution} />
        </div>
      )}

      {/* ── Query history ── */}
      {sqlMode && (
        <QueryHistory
          history={history}
          onRerun={handleRerun}
          onClear={clearHistory}
        />
      )}
    </div>
  );
}
