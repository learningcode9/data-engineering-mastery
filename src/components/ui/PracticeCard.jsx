import { useState } from 'react';
import { CodeBlock } from './CodeBlock.jsx';
import { DifficultyBadge } from './DifficultyBadge.jsx';
import { QueryResultTable } from './QueryResultTable.jsx';
import { useLocalStorage } from '../../hooks/useLocalStorage.js';
import { validateSQL } from '../../utils/sqlValidation.js';
import { runMockSQL } from '../../utils/mockSqlRunner.js';
import { toast } from '../../utils/toast.js';

export function PracticeCard({ subtopic, completed, onToggleComplete }) {
  const [showHint,     setShowHint]     = useState(false);
  const [showSolution, setShowSolution] = useState(false);
  const [showSchema,   setShowSchema]   = useState(false);
  const [answer, setAnswer] = useLocalStorage(`dem-practice-answer-${subtopic.id}`, '');
  const [validation, setValidation]   = useState(null); // { valid, message }
  const [queryResult, setQueryResult] = useState(null); // mock SQL result

  function handleRun() {
    const val = validateSQL(answer, subtopic.solution);
    const qr  = runMockSQL(answer);
    setValidation(val);
    setQueryResult(qr);
    if (val.valid && !completed) {
      onToggleComplete(subtopic.id);
      toast(`Completed: ${subtopic.title}`, 'success');
    }
  }

  function handleReset() {
    setAnswer('');
    setValidation(null);
    setQueryResult(null);
    setShowHint(false);
    setShowSolution(false);
  }

  const textareaClass = [
    'practice-textarea',
    validation?.valid              ? 'practice-textarea--valid' : '',
    validation && !validation.valid ? 'practice-textarea--error' : '',
  ].filter(Boolean).join(' ');

  return (
    <div className={`practice-card${completed ? ' practice-done' : ''}`}>
      <div className="practice-header">
        <div className="practice-meta">
          <span className="practice-label">Practice Task</span>
          <DifficultyBadge level={subtopic.difficulty} />
        </div>
        <label className="practice-check">
          <input
            type="checkbox"
            checked={!!completed}
            onChange={() => onToggleComplete(subtopic.id)}
            aria-label="Mark practice complete"
          />
          <span>{completed ? 'Completed' : 'Mark complete'}</span>
        </label>
      </div>

      <p className="practice-question">{subtopic.practice}</p>

      {/* Playground schema hint */}
      <div className="practice-schema-bar">
        <span className="practice-schema-label">Playground tables:</span>
        {['customers', 'orders', 'products'].map(t => (
          <button
            key={t}
            type="button"
            className={`practice-table-chip${showSchema ? ' active' : ''}`}
            onClick={() => setShowSchema(s => !s)}
            title="Show table schema"
          >
            {t}
          </button>
        ))}
      </div>

      {showSchema && (
        <div className="practice-schema-preview">
          <div>
            <strong>customers</strong>
            <code>customer_id, customer_name, city, status</code>
          </div>
          <div>
            <strong>orders</strong>
            <code>order_id, customer_id, amount, status, created_at</code>
          </div>
          <div>
            <strong>products</strong>
            <code>product_id, product_name, category, price</code>
          </div>
        </div>
      )}

      <textarea
        className={textareaClass}
        placeholder="Write your SQL query here…"
        value={answer}
        onChange={e => { setAnswer(e.target.value); setValidation(null); setQueryResult(null); }}
        aria-label={`Practice answer for ${subtopic.title}`}
        spellCheck={false}
      />

      {/* Validation banner */}
      {validation && (
        <div className={`practice-result${validation.valid ? ' practice-result--success' : ' practice-result--error'}`}>
          <span className="practice-result-status">
            {validation.valid ? '✓' : '✕'} {validation.message}
          </span>
          {validation.valid && !queryResult && subtopic.expectedOutput && (
            <p className="practice-result-output">{subtopic.expectedOutput}</p>
          )}
        </div>
      )}

      {/* Mock query result table */}
      {queryResult && (
        <QueryResultTable result={queryResult} expectedOutput={subtopic.expectedOutput} />
      )}

      <div className="practice-actions">
        {subtopic.solution && (
          <button
            type="button"
            className={`practice-run-btn${validation?.valid ? ' practice-run-btn--success' : ''}`}
            onClick={handleRun}
            disabled={!answer.trim()}
            aria-label="Run and validate your SQL query"
          >
            {validation?.valid ? '✓ Correct' : '▶ Run Query'}
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
    </div>
  );
}
