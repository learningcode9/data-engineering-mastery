import { memo } from 'react';
import { CollapsiblePanel } from './CollapsiblePanel.jsx';

// Infer a compact type badge for a column based on its first non-null value
function colTypeBadge(rows, col) {
  for (const row of rows) {
    const v = row[col];
    if (v == null) continue;
    if (typeof v === 'number') return <span className="col-type-badge col-type-badge--num">123</span>;
    if (typeof v === 'string' && /^\d{4}-\d{2}/.test(v))
      return <span className="col-type-badge col-type-badge--date">date</span>;
    return <span className="col-type-badge col-type-badge--str">abc</span>;
  }
  return null;
}

export const QueryResultTable = memo(function QueryResultTable({
  result,
  expectedOutput,
  open,
  onToggle,
  execTime,
}) {
  if (!result) return null;

  // ── Error state ────────────────────────────────────────────────────────────
  if (result.error) {
    return (
      <div className="query-result query-result--error">
        <button
          type="button"
          className="result-status-bar result-status-bar--error"
          onClick={onToggle}
          aria-expanded={!!open}
          aria-label={open ? 'Hide error details' : 'Show error details'}
        >
          <span className="result-status-icon" aria-hidden="true">✕</span>
          <span className="result-status-label">Error</span>
          <span className="result-status-spacer" />
          <span className="result-toggle-label">{open ? 'Hide' : 'Details'}</span>
          <span className={`result-chevron${open ? ' result-chevron--open' : ''}`} aria-hidden="true">▾</span>
        </button>
        <CollapsiblePanel open={open} label="Error details">
          <div className="result-error-body">
            <p>{result.error}</p>
          </div>
        </CollapsiblePanel>
      </div>
    );
  }

  // ── Complex / advanced query ───────────────────────────────────────────────
  if (result.complex) {
    return (
      <div className="query-result query-result--info">
        <button
          type="button"
          className="result-status-bar result-status-bar--info"
          onClick={onToggle}
          aria-expanded={!!open}
          aria-label={open ? 'Hide expected output' : 'Show expected output'}
        >
          <span className="result-status-icon" aria-hidden="true">ℹ</span>
          <span className="result-status-label">Advanced Query</span>
          <span className="result-status-spacer" />
          <span className="result-toggle-label">{open ? 'Hide' : 'Show expected'}</span>
          <span className={`result-chevron${open ? ' result-chevron--open' : ''}`} aria-hidden="true">▾</span>
        </button>
        <CollapsiblePanel open={open} label="Expected output">
          <div className="result-info-body">
            <p><strong>Expected output:</strong> {expectedOutput}</p>
            <p className="query-result-note">Advanced query — run in a real database to see live results.</p>
          </div>
        </CollapsiblePanel>
      </div>
    );
  }

  // ── Success state ──────────────────────────────────────────────────────────
  const { rows, columns, rowCount } = result;

  return (
    <div className="query-result">
      <button
        type="button"
        className="result-status-bar result-status-bar--success"
        onClick={onToggle}
        aria-expanded={!!open}
        aria-label={open ? 'Hide query results' : `Show query results — ${rowCount} row${rowCount !== 1 ? 's' : ''}`}
      >
        <span className="result-status-icon" aria-hidden="true">✓</span>
        <span className="result-status-label">Query Result</span>
        <span className="result-status-count" aria-hidden="true">
          {rowCount} row{rowCount !== 1 ? 's' : ''}
        </span>
        {execTime != null && (
          <span className="result-exec-time" aria-label={`Executed in ${execTime} milliseconds`}>
            {execTime}ms
          </span>
        )}
        <span className="result-status-spacer" />
        <span className="result-toggle-label">{open ? 'Hide Result' : 'Show Result'}</span>
        <span className={`result-chevron${open ? ' result-chevron--open' : ''}`} aria-hidden="true">▾</span>
      </button>

      <CollapsiblePanel open={open} label="Query results">
        <div className="result-table-body">
          {rows.length === 0 ? (
            <div className="query-result-empty">
              <span className="query-result-empty-icon" aria-hidden="true">⊘</span>
              <span>No rows matched your query.</span>
            </div>
          ) : (
            <div className="query-result-scroll">
              <table className="query-result-table">
                <thead>
                  <tr>
                    <th className="row-num-th" aria-label="Row number">#</th>
                    {columns.map(c => (
                      <th key={c}>
                        <span className="col-header-name">{c}</span>
                        {colTypeBadge(rows, c)}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {rows.map((row, i) => (
                    <tr key={i}>
                      <td className="row-num-td">{i + 1}</td>
                      {columns.map(c => (
                        <td key={c}>
                          {row[c] == null
                            ? <span className="null-val">NULL</span>
                            : String(row[c])
                          }
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </CollapsiblePanel>
    </div>
  );
});
