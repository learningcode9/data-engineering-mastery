// Analyzes a SQL query to produce a visual execution plan and complexity stats.
// Combines manual parsing with SQLite's own EXPLAIN QUERY PLAN when a DB is available.

const OP_META = {
  SCAN:      { icon: '▥', color: 'blue',   label: 'TABLE SCAN'  },
  SEARCH:    { icon: '⊕', color: 'teal',   label: 'INDEX SEEK'  },
  FILTER:    { icon: '⊗', color: 'amber',  label: 'FILTER'      },
  JOIN:      { icon: '⋈', color: 'violet', label: 'JOIN'        },
  GROUP:     { icon: '∑', color: 'orange', label: 'GROUP BY'    },
  WINDOW:    { icon: '⊞', color: 'pink',   label: 'WINDOW'      },
  HAVING:    { icon: '⊘', color: 'amber',  label: 'HAVING'      },
  SORT:      { icon: '⇅', color: 'cyan',   label: 'SORT'        },
  LIMIT:     { icon: '⊤', color: 'gray',   label: 'LIMIT'       },
  DISTINCT:  { icon: '◎', color: 'indigo', label: 'DISTINCT'    },
  CTE:       { icon: '⊢', color: 'purple', label: 'CTE'         },
  SUBQUERY:  { icon: '⊂', color: 'purple', label: 'SUBQUERY'    },
  AGGREGATE: { icon: 'Σ', color: 'orange', label: 'AGGREGATE'   },
};

export function getOpMeta(op) {
  return OP_META[op] ?? { icon: '●', color: 'gray', label: op };
}

// ── Get SQLite's real query plan ───────────────────────────────────────────────
export function getSQLitePlan(db, sql) {
  if (!db) return null;
  try {
    const result = db.exec(`EXPLAIN QUERY PLAN ${sql.trim()}`);
    if (!result.length) return null;
    const { columns, values } = result[0];
    return values.map(v => ({
      id:     v[columns.indexOf('id')],
      parent: v[columns.indexOf('parent')],
      detail: v[columns.indexOf('detail')] ?? '',
    }));
  } catch {
    return null;
  }
}

// ── Manual analysis (always runs, augments SQLite plan) ───────────────────────
export function analyzeQuery(sql) {
  const n = sql.toLowerCase().replace(/\s+/g, ' ').trim();
  const plan = [];
  let complexity = 0;

  // CTE
  if (/^\s*with\s+\w/.test(n)) {
    const cteNames = [...n.matchAll(/with\s+(\w+)\s+as\s*\(/g)].map(m => m[1]);
    plan.push({ op: 'CTE', detail: cteNames.join(', ') || '' });
    complexity += 2;
  }

  // Subqueries (SELECT inside SELECT)
  const subqueryCount = (n.match(/\bselect\b/g) || []).length - 1;
  if (subqueryCount > 0) {
    plan.push({ op: 'SUBQUERY', detail: `${subqueryCount} nested` });
    complexity += subqueryCount * 2;
  }

  // TABLE SCANs (FROM clause)
  const fromMatches = [...n.matchAll(/\bfrom\s+(\w+)/g)];
  fromMatches.forEach(m => {
    plan.push({ op: 'SCAN', detail: m[1] });
    complexity += 1;
  });

  // JOINs
  const joinRe = /\b(left\s+(?:outer\s+)?join|right\s+(?:outer\s+)?join|full\s+(?:outer\s+)?join|inner\s+join|cross\s+join|join)\s+(\w+)/g;
  for (const m of n.matchAll(joinRe)) {
    const jtype = m[1].replace(/\s+/g, ' ').trim().toUpperCase();
    plan.push({ op: 'JOIN', detail: `${jtype}\n${m[2]}` });
    complexity += 3;
  }

  // WHERE filter
  const whereM = n.match(/\bwhere\b\s+(.+?)(?=\s+(?:group\s+by|order\s+by|having|limit|$))/);
  if (whereM) {
    const clause = whereM[1].slice(0, 32) + (whereM[1].length > 32 ? '…' : '');
    plan.push({ op: 'FILTER', detail: clause });
    complexity += 1;
  }

  // WINDOW functions
  const winRe = /\b(row_number|rank|dense_rank|ntile|lag|lead|first_value|last_value|sum|avg|count)\s*\([^)]*\)\s*over\s*\(/g;
  const winFns = [...n.matchAll(winRe)].map(m => m[1].toUpperCase());
  if (winFns.length) {
    plan.push({ op: 'WINDOW', detail: [...new Set(winFns)].join(', ') });
    complexity += 3;
  }

  // GROUP BY
  const groupM = n.match(/\bgroup\s+by\s+(.+?)(?=\s+(?:having|order\s+by|limit|$))/);
  if (groupM) {
    const cols = groupM[1].trim().slice(0, 28) + (groupM[1].length > 28 ? '…' : '');
    plan.push({ op: 'GROUP', detail: cols });
    complexity += 2;
  }

  // Aggregate functions (standalone, no GROUP BY)
  if (!groupM && /\b(count|sum|avg|max|min)\s*\(/.test(n)) {
    const fns = [...n.matchAll(/\b(count|sum|avg|max|min)\s*\(/g)].map(m => m[1].toUpperCase());
    plan.push({ op: 'AGGREGATE', detail: [...new Set(fns)].join(', ') });
    complexity += 1;
  }

  // HAVING
  const havingM = n.match(/\bhaving\b\s+(.+?)(?=\s+(?:order\s+by|limit|$))/);
  if (havingM) {
    plan.push({ op: 'HAVING', detail: havingM[1].trim().slice(0, 28) });
    complexity += 1;
  }

  // DISTINCT
  if (/\bselect\s+distinct\b/.test(n)) {
    plan.push({ op: 'DISTINCT', detail: '' });
    complexity += 1;
  }

  // ORDER BY
  const orderM = n.match(/\border\s+by\s+(.+?)(?=\s+limit|$)/);
  if (orderM) {
    plan.push({ op: 'SORT', detail: orderM[1].trim().slice(0, 28) });
    complexity += 1;
  }

  // LIMIT
  const limitM = n.match(/\blimit\s+(\d+)/);
  if (limitM) {
    plan.push({ op: 'LIMIT', detail: limitM[1] });
  }

  // Aggregate detection for stats
  const aggFns = [...n.matchAll(/\b(count|sum|avg|max|min)\s*\(/g)].map(m => m[1].toUpperCase());

  const complexityLabel =
    complexity <= 2 ? 'Beginner' :
    complexity <= 5 ? 'Intermediate' :
    complexity <= 9 ? 'Advanced' : 'Expert';

  return {
    plan,
    complexity,
    complexityLabel,
    joinCount:    (n.match(/\bjoin\b/g) || []).length,
    aggCount:     aggFns.length,
    aggFunctions: [...new Set(aggFns)],
    hasWindow:    winFns.length > 0,
    hasCTE:       /^\s*with\s+\w/.test(n),
    hasSubquery:  subqueryCount > 0,
    tables:       fromMatches.map(m => m[1]),
  };
}

// ── Performance tips based on plan ────────────────────────────────────────────
export function getPerfTips(analysis) {
  const tips = [];
  if (analysis.joinCount >= 2)
    tips.push('Multiple JOINs: make sure columns used in ON clauses are indexed.');
  if (analysis.hasWindow && analysis.joinCount > 0)
    tips.push('Window functions over joined data can be expensive — consider a CTE first.');
  if (analysis.hasCTE)
    tips.push('CTEs improve readability. In SQLite they are inlined — no additional cost.');
  if (analysis.hasSubquery)
    tips.push('Correlated subqueries run once per row — prefer JOINs or CTEs when possible.');
  if (analysis.plan.some(p => p.op === 'SCAN') && !analysis.joinCount)
    tips.push('Full table scan — a WHERE clause with an indexed column speeds this up.');
  return tips;
}
