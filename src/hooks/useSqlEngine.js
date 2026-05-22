import { useState, useEffect, useCallback, useRef } from 'react';
import { getEngine, execQuery, validateAndCompare } from '../utils/sqlEngine.js';

const MAX_HISTORY = 10;

/**
 * Hook for a single PracticeCard's SQL execution context.
 * Shares the singleton DB but maintains per-card execution state.
 */
export function useSqlEngine() {
  const [engineReady, setEngineReady] = useState(false);
  const [engineError, setEngineError] = useState(null);
  const [running,     setRunning]     = useState(false);
  const [history,     setHistory]     = useState([]);  // [{ sql, result, execTime, ts }]
  const dbRef = useRef(null);

  useEffect(() => {
    let cancelled = false;
    getEngine()
      .then(db => {
        if (cancelled) return;
        dbRef.current = db;
        setEngineReady(true);
      })
      .catch(err => {
        if (cancelled) return;
        setEngineError(err?.message ?? 'Failed to load SQL engine.');
      });
    return () => { cancelled = true; };
  }, []);

  const run = useCallback(async (sql) => {
    if (!dbRef.current) return null;
    setRunning(true);
    try {
      const result = execQuery(dbRef.current, sql);
      setHistory(prev => [
        { sql, result, execTime: result.execTime, ts: Date.now() },
        ...prev.slice(0, MAX_HISTORY - 1),
      ]);
      return result;
    } finally {
      setRunning(false);
    }
  }, []);

  const runAndValidate = useCallback(async (sql, solution) => {
    if (!dbRef.current) return null;
    setRunning(true);
    try {
      const outcome = validateAndCompare(dbRef.current, sql, solution);
      setHistory(prev => [
        { sql, result: outcome.queryResult, execTime: outcome.queryResult?.execTime, ts: Date.now() },
        ...prev.slice(0, MAX_HISTORY - 1),
      ]);
      return outcome;
    } finally {
      setRunning(false);
    }
  }, []);

  const clearHistory = useCallback(() => setHistory([]), []);

  return { engineReady, engineError, running, history, run, runAndValidate, clearHistory };
}
