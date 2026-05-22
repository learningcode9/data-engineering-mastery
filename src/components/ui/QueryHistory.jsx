import { memo, useState } from 'react';

function relativeTime(ts) {
  const secs = Math.round((Date.now() - ts) / 1000);
  if (secs < 60)  return `${secs}s ago`;
  if (secs < 3600) return `${Math.round(secs / 60)}m ago`;
  return `${Math.round(secs / 3600)}h ago`;
}

function truncate(sql, maxLen = 72) {
  const s = sql.replace(/\s+/g, ' ').trim();
  return s.length > maxLen ? s.slice(0, maxLen) + '…' : s;
}

export const QueryHistory = memo(function QueryHistory({ history, onRerun, onClear }) {
  const [open, setOpen] = useState(false);

  if (!history?.length) return null;

  return (
    <div className="query-history">
      <div className="query-history-bar">
        <button
          type="button"
          className="query-history-toggle"
          onClick={() => setOpen(o => !o)}
          aria-expanded={open}
        >
          <span className="query-history-icon" aria-hidden="true">⌚</span>
          <span>History</span>
          <span className="query-history-badge">{history.length}</span>
          <span className={`result-chevron${open ? ' result-chevron--open' : ''}`} aria-hidden="true">▾</span>
        </button>
        {open && (
          <button
            type="button"
            className="query-history-clear"
            onClick={onClear}
            aria-label="Clear query history"
          >
            Clear
          </button>
        )}
      </div>

      {open && (
        <ul className="query-history-list" role="list">
          {history.map((entry, i) => {
            const isError = !!entry.result?.error;
            return (
              <li key={i} className={`query-history-item${isError ? ' query-history-item--error' : ''}`}>
                <span className={`query-history-status-dot${isError ? ' dot--error' : ' dot--ok'}`} aria-hidden="true" />
                <span className="query-history-sql">{truncate(entry.sql)}</span>
                <span className="query-history-meta">
                  {!isError && entry.result?.rowCount != null && (
                    <span className="query-history-rows">{entry.result.rowCount}r</span>
                  )}
                  {entry.execTime != null && (
                    <span className="query-history-time">{entry.execTime}ms</span>
                  )}
                  <span className="query-history-ago">{relativeTime(entry.ts)}</span>
                </span>
                <button
                  type="button"
                  className="query-history-rerun"
                  onClick={() => onRerun(entry.sql)}
                  aria-label={`Re-run: ${entry.sql}`}
                  title="Re-run this query"
                >
                  ↺
                </button>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
});
