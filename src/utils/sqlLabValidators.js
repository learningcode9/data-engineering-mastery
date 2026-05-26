import { runMockSQL } from './mockSqlRunner.js';

export function analyzeMismatch(question, result) {
  if (!result || result.error || result.complex) return null;
  const expected = runMockSQL(question.answer);
  if (!expected || expected.error || expected.complex) return null;

  const actualRows   = result.rows   ?? [];
  const expectedRows = expected.rows ?? [];
  const actualCols   = result.columns   ?? [];
  const expectedCols = expected.columns ?? [];

  const colsSorted  = JSON.stringify([...actualCols].sort()) === JSON.stringify([...expectedCols].sort());
  const colsOrdered = JSON.stringify(actualCols) === JSON.stringify(expectedCols);
  const rowCountOk  = actualRows.length === expectedRows.length;
  const isClose     = colsSorted && Math.abs(actualRows.length - expectedRows.length) <= 1;

  let likelyIssue = '';
  let hint = '';

  if (!colsSorted) {
    const missing = expectedCols.filter(c => !actualCols.includes(c));
    const extra   = actualCols.filter(c => !expectedCols.includes(c));
    if (missing.length > 0) {
      likelyIssue = `Missing column${missing.length > 1 ? 's' : ''}: ${missing.join(', ')}`;
      hint = 'Add the missing column(s) to your SELECT list.';
    } else if (extra.length > 0) {
      likelyIssue = `Unexpected column${extra.length > 1 ? 's' : ''}: ${extra.join(', ')}`;
      hint = 'Remove the extra column(s) from your SELECT list.';
    } else {
      likelyIssue = 'Column aliases differ from expected';
      hint = 'Check your column aliases — they must match exactly.';
    }
  } else if (!colsOrdered) {
    likelyIssue = 'Column order differs from expected';
    hint = 'Reorder your SELECT columns to match the expected output.';
  } else if (!rowCountOk) {
    likelyIssue = actualRows.length > expectedRows.length
      ? `Too many rows — got ${actualRows.length}, expected ${expectedRows.length}`
      : `Too few rows — got ${actualRows.length}, expected ${expectedRows.length}`;
    hint = actualRows.length > expectedRows.length
      ? 'Your WHERE clause may be missing or too broad.'
      : 'Your WHERE clause may be too restrictive, or a filter value may be wrong.';
  } else {
    likelyIssue = 'Row values differ — columns and count match';
    hint = 'Double-check your ORDER BY direction, aggregate expressions, or WHERE values.';
  }

  return {
    expectedRowCount: expectedRows.length,
    actualRowCount:   actualRows.length,
    expectedColumns:  expectedCols,
    actualColumns:    actualCols,
    expectedRows:     expectedRows.slice(0, 5),
    actualRows:       actualRows.slice(0, 5),
    likelyIssue,
    hint,
    isClose,
  };
}
