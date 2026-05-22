import { memo } from 'react';
import { getOpMeta, getPerfTips } from '../../utils/queryAnalyzer.js';

// ── Individual plan step block ─────────────────────────────────────────────────
function PlanStep({ step, index }) {
  const meta = getOpMeta(step.op);
  return (
    <div
      className={`plan-step plan-step--${meta.color}`}
      style={{ '--step-i': index }}
      aria-label={`${meta.label}: ${step.detail}`}
    >
      <span className="plan-step-icon" aria-hidden="true">{meta.icon}</span>
      <span className="plan-step-op">{meta.label}</span>
      {step.detail && (
        <span className="plan-step-detail">{step.detail}</span>
      )}
    </div>
  );
}

// ── SQLite EXPLAIN QUERY PLAN raw output ────────────────────────────────────────
function SQLitePlanView({ rawPlan }) {
  if (!rawPlan?.length) return null;
  return (
    <details className="sqlite-plan-details">
      <summary className="sqlite-plan-summary">SQLite internal plan (EXPLAIN QUERY PLAN)</summary>
      <ul className="sqlite-plan-list">
        {rawPlan.map((row, i) => (
          <li key={i} className="sqlite-plan-row">
            <span className="sqlite-plan-id">{row.id}</span>
            <span className="sqlite-plan-detail">{row.detail}</span>
          </li>
        ))}
      </ul>
    </details>
  );
}

// ── Complexity badge ────────────────────────────────────────────────────────────
function ComplexityBadge({ label, score }) {
  const cls =
    label === 'Beginner'     ? 'plan-complexity--beginner' :
    label === 'Intermediate' ? 'plan-complexity--intermediate' :
    label === 'Advanced'     ? 'plan-complexity--advanced' :
                               'plan-complexity--expert';
  return (
    <span className={`plan-complexity ${cls}`} aria-label={`Complexity: ${label}`}>
      {label} · score {score}
    </span>
  );
}

// ── Main ExecutionPlan component ────────────────────────────────────────────────
export const ExecutionPlan = memo(function ExecutionPlan({ analysis, rawPlan, result }) {
  if (!analysis) {
    return (
      <div className="plan-empty">
        <span className="plan-empty-icon" aria-hidden="true">▶</span>
        <span>Run your query to see the execution plan.</span>
      </div>
    );
  }

  if (result?.error) {
    return (
      <div className="plan-empty plan-empty--error">
        <span>Fix the error in your query first.</span>
      </div>
    );
  }

  const { plan, complexity, complexityLabel, aggFunctions, joinCount, hasWindow, hasCTE } = analysis;
  const tips = getPerfTips(analysis);

  return (
    <div className="execution-plan">
      {/* Header */}
      <div className="plan-header">
        <ComplexityBadge label={complexityLabel} score={complexity} />
        <div className="plan-stat-chips">
          {joinCount > 0  && <span className="plan-chip plan-chip--join">{joinCount} JOIN{joinCount > 1 ? 's' : ''}</span>}
          {aggFunctions.length > 0 && <span className="plan-chip plan-chip--agg">{aggFunctions.join(', ')}</span>}
          {hasWindow      && <span className="plan-chip plan-chip--win">WINDOW</span>}
          {hasCTE         && <span className="plan-chip plan-chip--cte">CTE</span>}
          {result?.rowCount != null && (
            <span className="plan-chip plan-chip--rows">{result.rowCount} row{result.rowCount !== 1 ? 's' : ''}</span>
          )}
          {result?.execTime != null && (
            <span className="plan-chip plan-chip--time">{result.execTime}ms</span>
          )}
        </div>
      </div>

      {/* Visual pipeline */}
      {plan.length > 0 ? (
        <div className="plan-pipeline" role="list" aria-label="Execution pipeline">
          {plan.map((step, i) => (
            <div key={i} className="plan-pipeline-item" role="listitem">
              <PlanStep step={step} index={i} />
              {i < plan.length - 1 && (
                <span
                  className="plan-arrow"
                  style={{ '--arrow-i': i }}
                  aria-hidden="true"
                >→</span>
              )}
            </div>
          ))}
        </div>
      ) : (
        <p className="plan-simple">Simple scan — no filters, joins, or sorting detected.</p>
      )}

      {/* Performance tips */}
      {tips.length > 0 && (
        <div className="plan-tips">
          <span className="plan-tips-label">💡 Performance notes</span>
          <ul className="plan-tips-list">
            {tips.map((t, i) => <li key={i}>{t}</li>)}
          </ul>
        </div>
      )}

      {/* SQLite raw plan */}
      <SQLitePlanView rawPlan={rawPlan} />
    </div>
  );
});
