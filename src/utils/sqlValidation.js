// Keyword-based SQL validation — case/whitespace insensitive, tolerant of minor differences.

const SQL_KEYWORDS = [
  'select', 'from', 'where', 'group by', 'order by', 'having',
  'inner join', 'left join', 'right join', 'full join', 'join', 'cross join',
  'on', 'limit', 'top', 'distinct', 'count', 'sum', 'avg', 'max', 'min',
  'insert into', 'update', 'set', 'delete from', 'create table', 'drop table', 'alter table',
  'with', 'union all', 'union', 'intersect', 'except',
  'case', 'when', 'then', 'else', 'end',
  'over', 'partition by', 'row_number', 'rank', 'dense_rank', 'ntile',
  'lag', 'lead', 'first_value', 'last_value',
  'between', 'like', 'ilike', 'in', 'not in', 'exists', 'not exists',
  'is null', 'is not null',
];

function norm(sql) {
  return (sql ?? '').replace(/\s+/g, ' ').trim().toLowerCase();
}

function tokenize(sql) {
  return norm(sql)
    .split(/[\s,;()\n=<>!'"]+/)
    .filter(t => /^[a-z_][a-z0-9_]{1,}$/.test(t));
}

export function validateSQL(userAnswer, solution) {
  const user = norm(userAnswer);
  const sol  = norm(solution ?? '');

  if (!user) return { valid: false, message: 'Write a query first.' };

  // Collect multi-word and single-word SQL keywords present in the solution
  const requiredKws = SQL_KEYWORDS.filter(kw => sol.includes(kw));

  // Each required keyword must appear in the user's answer too
  const missingKws = requiredKws.filter(kw => !user.includes(kw));

  // Allow at most 1 missing keyword (tolerant)
  if (missingKws.length > 1) {
    const display = missingKws
      .slice(0, 3)
      .map(k => k.toUpperCase())
      .join(', ');
    return { valid: false, message: `Missing: ${display}` };
  }

  // Check that key identifiers (table/column names) from the solution appear in the user query.
  // Filter out pure SQL keywords to leave only identifiers.
  const allKwTokens = new Set(SQL_KEYWORDS.flatMap(kw => kw.split(' ')));
  const solIdentifiers = tokenize(sol).filter(t => !allKwTokens.has(t) && t.length > 2);
  const missingIds = solIdentifiers.filter(t => !user.includes(t));

  if (solIdentifiers.length > 1 && missingIds.length > solIdentifiers.length * 0.45) {
    return { valid: false, message: 'Check your column or table names.' };
  }

  return { valid: true, message: 'Query looks correct!' };
}
