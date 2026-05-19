import { memo } from 'react';

export const QueryResultTable = memo(function QueryResultTable({ result, expectedOutput }) {
  if (!result) return null;

  if (result.error) {
    return (
      <div className="query-result query-result--error">
        <span className="query-result-label">Error</span>
        <p>{result.error}</p>
      </div>
    );
  }

  if (result.complex) {
    return (
      <div className="query-result query-result--info">
        <span className="query-result-label">Expected output</span>
        <p>{expectedOutput}</p>
        <p className="query-result-note">Advanced query — run in a real DB to see live results.</p>
      </div>
    );
  }

  const { rows, columns, rowCount } = result;

  return (
    <div className="query-result">
      <div className="query-result-header">
        <span className="query-result-label">Query result</span>
        <span className="query-result-count">{rowCount} row{rowCount !== 1 ? 's' : ''}</span>
      </div>
      {rows.length === 0 ? (
        <p className="query-result-empty">No rows matched.</p>
      ) : (
        <div className="query-result-scroll">
          <table className="query-result-table">
            <thead>
              <tr>{columns.map(c => <th key={c}>{c}</th>)}</tr>
            </thead>
            <tbody>
              {rows.map((row, i) => (
                <tr key={i}>
                  {columns.map(c => (
                    <td key={c}>{row[c] == null ? <span className="null-val">NULL</span> : String(row[c])}</td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
});
