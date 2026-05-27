import { MOCK_DB } from '../data/mockDatabase.js';

function norm(sql) {
  return (sql ?? '').replace(/\s+/g, ' ').trim().toLowerCase().replace(/;+$/, '');
}

const SQL_KW = new Set([
  'select','from','where','group','by','order','having','inner','left','right',
  'full','join','cross','on','limit','top','distinct','count','sum','avg','max',
  'min','as','and','or','asc','desc','not','in','is','null','like','between',
  'true','false','case','when','then','else','end','coalesce','nullif',
]);

// Evaluate CASE WHEN col op val THEN n ELSE m END against a single row
function evalRowCaseExpr(row, caseExpr) {
  const m = caseExpr.match(
    /case\s+when\s+(?:\w+\.)?(\w+)\s*(>=|<=|!=|<>|=|>|<)\s*(?:'([^']*)'|([-\d.]+))\s+then\s+(?:'([^']*)'|([-\d.]+))(?:\s+else\s+(?:'([^']*)'|([-\d.]+)))?\s+end/i
  );
  if (!m) return 0;
  const [, col, op, strVal, numVal, thenStr, thenNum, elseStr, elseNum] = m;
  const rowVal = row[col];
  let cond = false;
  if (strVal !== undefined) {
    const rv = String(rowVal ?? '').toLowerCase();
    const cv = strVal.toLowerCase();
    if (op === '=' || op === '==') cond = rv === cv;
    else if (op === '!=' || op === '<>') cond = rv !== cv;
    else if (op === '>') cond = rv > cv;
    else if (op === '<') cond = rv < cv;
    else if (op === '>=') cond = rv >= cv;
    else if (op === '<=') cond = rv <= cv;
  } else {
    const nv = Number(rowVal);
    const cv = Number(numVal);
    if (op === '=' || op === '==') cond = nv === cv;
    else if (op === '!=' || op === '<>') cond = nv !== cv;
    else if (op === '>') cond = nv > cv;
    else if (op === '<') cond = nv < cv;
    else if (op === '>=') cond = nv >= cv;
    else if (op === '<=') cond = nv <= cv;
  }
  const thenV = thenStr ?? thenNum;
  const elseV = elseStr ?? elseNum ?? '0';
  const out = cond ? thenV : elseV;
  return /^-?\d+(\.\d+)?$/.test(String(out)) ? Number(out) : out;
}

function evalSingleCondition(cond, row, betweens) {
  cond = cond.trim();

  const bm = cond.match(/^__btw(\d+)__$/);
  if (bm) {
    const { col, lo, hi } = betweens[+bm[1]];
    const v = Number(row[col]);
    return v >= lo && v <= hi;
  }

  let m;

  // NOT IN
  m = cond.match(/^(?:\w+\.)?(\w+)\s+not\s+in\s+\(([^)]+)\)$/);
  if (m) {
    const vals = m[2].split(',').map(v => v.trim().replace(/^'|'$/g, '').toLowerCase());
    return !vals.includes(String(row[m[1]] ?? '').toLowerCase());
  }

  // IN
  m = cond.match(/^(?:\w+\.)?(\w+)\s+in\s+\(([^)]+)\)$/);
  if (m) {
    const vals = m[2].split(',').map(v => v.trim().replace(/^'|'$/g, '').toLowerCase());
    return vals.includes(String(row[m[1]] ?? '').toLowerCase());
  }

  // table.col = 'val' or col = 'val'
  m = cond.match(/^(?:\w+\.)?(\w+)\s*=\s*'([^']*)'$/);
  if (m) return String(row[m[1]] ?? '').toLowerCase() === m[2].toLowerCase();

  // Numeric equals
  m = cond.match(/^(?:\w+\.)?(\w+)\s*=\s*(-?\d+\.?\d*)$/);
  if (m) return Number(row[m[1]]) === Number(m[2]);

  // Numeric comparisons
  m = cond.match(/^(?:\w+\.)?(\w+)\s*>\s*(-?\d+\.?\d*)$/);
  if (m) return Number(row[m[1]]) > Number(m[2]);

  m = cond.match(/^(?:\w+\.)?(\w+)\s*<\s*(-?\d+\.?\d*)$/);
  if (m) return Number(row[m[1]]) < Number(m[2]);

  m = cond.match(/^(?:\w+\.)?(\w+)\s*>=\s*(-?\d+\.?\d*)$/);
  if (m) return Number(row[m[1]]) >= Number(m[2]);

  m = cond.match(/^(?:\w+\.)?(\w+)\s*<=\s*(-?\d+\.?\d*)$/);
  if (m) return Number(row[m[1]]) <= Number(m[2]);

  // String inequality
  m = cond.match(/^(?:\w+\.)?(\w+)\s*!=\s*'([^']*)'$/);
  if (m) return String(row[m[1]] ?? '').toLowerCase() !== m[2].toLowerCase();

  // String comparisons — handles date columns like created_at > '2024-01-17'
  m = cond.match(/^(?:\w+\.)?(\w+)\s*(>|<|>=|<=)\s*'([^']*)'$/);
  if (m) {
    const [, col, op, val] = m;
    const rv = String(row[col] ?? '');
    if (op === '>') return rv > val;
    if (op === '<') return rv < val;
    if (op === '>=') return rv >= val;
    if (op === '<=') return rv <= val;
  }

  m = cond.match(/^(?:\w+\.)?(\w+)\s+like\s+'([^']+)'$/);
  if (m) {
    const re = new RegExp('^' + m[2].replace(/%/g, '.*').replace(/_/g, '.') + '$', 'i');
    return re.test(String(row[m[1]] ?? ''));
  }

  if (/\bis\s+not\s+null\b/.test(cond)) {
    m = cond.match(/^(?:\w+\.)?(\w+)\s+is\s+not\s+null$/);
    if (m) return row[m[1]] != null;
  }
  m = cond.match(/^(?:\w+\.)?(\w+)\s+is\s+null$/);
  if (m) return row[m[1]] == null;

  return true;
}

function applyWhere(rows, clause, allCols) {
  // Protect BETWEEN...AND... from the AND-split
  const betweens = [];
  const safe = clause.replace(
    /\b((?:\w+\.)?\w+)\s+between\s+(-?\d+\.?\d*)\s+and\s+(-?\d+\.?\d*)/gi,
    (_, fullCol, lo, hi) => {
      betweens.push({ col: fullCol.replace(/^\w+\./, ''), lo: Number(lo), hi: Number(hi) });
      return `__btw${betweens.length - 1}__`;
    }
  );
  // Split on OR first (lower precedence), then AND within each OR group
  const orGroups = safe.trim().split(/\s+or\s+/i);
  return rows.filter(row =>
    orGroups.some(orGroup => {
      const andConds = orGroup.trim().split(/\s+and\s+/i);
      return andConds.every(cond => evalSingleCondition(cond, row, betweens));
    })
  );
}

function evalSingleHavingCond(cond, row) {
  cond = cond.trim();
  let m = cond.match(/^\w+\s*\(\s*[\w*]+\s*\)\s*(?:as\s+\w+\s*)?(>=|<=|!=|>|<|=)\s*(-?\d+\.?\d*)$/i);
  if (m) {
    const numericKeys = Object.keys(row).filter(k => typeof row[k] === 'number');
    const aggKey = 'count(*)' in row
      ? 'count(*)'
      : numericKeys.find(k => /(count|sum|avg|min|max|total|revenue|rows|amount)/i.test(k))
        ?? numericKeys[numericKeys.length - 1];
    const aggVal = aggKey ? row[aggKey] : 0;
    const op = m[1];
    const rhs = Number(m[2]);
    if (op === '>') return aggVal > rhs;
    if (op === '<') return aggVal < rhs;
    if (op === '>=') return aggVal >= rhs;
    if (op === '<=') return aggVal <= rhs;
    if (op === '=') return aggVal === rhs;
    if (op === '!=') return aggVal !== rhs;
  }
  // HAVING alias > N (e.g., HAVING run_count > 2)
  m = cond.match(/^(\w+)\s*(>=|<=|!=|>|<|=)\s*(-?\d+\.?\d*)$/);
  if (m) {
    const [, alias, op, rhs] = m;
    const val = row[alias];
    if (val !== undefined) {
      const n = Number(val), r = Number(rhs);
      if (op === '>') return n > r;
      if (op === '<') return n < r;
      if (op === '>=') return n >= r;
      if (op === '<=') return n <= r;
      if (op === '=') return n === r;
      if (op === '!=') return n !== r;
    }
  }
  return true;
}

// Apply HAVING clause to already-grouped rows (supports AND and OR)
function applyHaving(rows, clause) {
  const orGroups = clause.trim().split(/\s+or\s+/i);
  return rows.filter(row =>
    orGroups.some(orGroup => {
      const andConds = orGroup.trim().split(/\s+and\s+/i);
      return andConds.every(cond => evalSingleHavingCond(cond, row));
    })
  );
}

function resolveCol(row, expr) {
  const col = expr.replace(/^\w+\./, '').trim();
  return row[col];
}

function splitSelectExpressions(selectRaw) {
  const parts = [];
  let depth = 0;
  let quote = false;
  let current = '';
  for (const ch of selectRaw) {
    if (ch === "'") quote = !quote;
    if (!quote && ch === '(') depth += 1;
    if (!quote && ch === ')') depth -= 1;
    if (!quote && depth === 0 && ch === ',') {
      parts.push(current.trim());
      current = '';
    } else {
      current += ch;
    }
  }
  if (current.trim()) parts.push(current.trim());
  return parts;
}

function evaluateProjection(row, expression) {
  const aliasMatch = expression.match(/^(.+?)\s+as\s+(\w+)$/i);
  const expr = (aliasMatch ? aliasMatch[1] : expression).trim();
  const alias = aliasMatch?.[2] ?? expr.replace(/^\w+\./, '');

  const coalesce = expr.match(/^coalesce\s*\(\s*(?:\w+\.)?(\w+)\s*,\s*(?:'([^']*)'|(-?\d+\.?\d*))\s*\)$/i);
  if (coalesce) {
    const [, col, strDefault, numDefault] = coalesce;
    const fallback = strDefault ?? (numDefault != null ? Number(numDefault) : null);
    return { key: alias, value: row[col] ?? fallback };
  }

  if (/^case\s+when\b/i.test(expr)) {
    return { key: alias, value: evalRowCaseExpr(row, expr) };
  }

  if (/^\w+\s*\(/.test(expr)) return null;
  const col = expr.replace(/^\w+\./, '');
  return { key: alias, value: row[col] ?? null };
}

function executeWindowRank(n) {
  const cte = n.match(
    /^with\s+(\w+)\s+as\s*\(\s*select\s+\*,\s*(row_number|rank|dense_rank)\s*\(\s*\)\s+over\s*\(\s*partition\s+by\s+(\w+)\s+order\s+by\s+(\w+)(?:\s+(asc|desc))?\s*\)\s+as\s+(\w+)\s+from\s+(\w+)\s*\)\s*select\s+(.+?)\s+from\s+\1(?:\s+where\s+(.+))?$/i
  );
  const direct = n.match(
    /^select\s+\*,\s*(row_number|rank|dense_rank)\s*\(\s*\)\s+over\s*\(\s*partition\s+by\s+(\w+)\s+order\s+by\s+(\w+)(?:\s+(asc|desc))?\s*\)\s+as\s+(\w+)\s+from\s+(\w+)(?:\s+where\s+(.+))?$/i
  );

  let fn, partitionCol, orderCol, direction, alias, tableName, outerSelect, outerWhere;
  if (cte) {
    [, , fn, partitionCol, orderCol, direction = 'asc', alias, tableName, outerSelect, outerWhere] = cte;
  } else if (direct) {
    [, fn, partitionCol, orderCol, direction = 'asc', alias, tableName, outerWhere] = direct;
    outerSelect = '*';
  } else {
    return null;
  }

  const table = MOCK_DB[tableName];
  if (!table) return { error: `Table '${tableName}' not found.` };

  const grouped = new Map();
  for (const row of table.rows) {
    const key = String(row[partitionCol] ?? 'null');
    if (!grouped.has(key)) grouped.set(key, []);
    grouped.get(key).push({ ...row });
  }

  let rows = [];
  for (const groupRows of grouped.values()) {
    const sorted = applyOrderBy(groupRows, `${orderCol} ${direction}`);
    let previousValue;
    let previousRank = 0;
    sorted.forEach((row, idx) => {
      const currentValue = row[orderCol];
      let value = idx + 1;
      if (fn === 'rank') {
        value = idx === 0 || currentValue !== previousValue ? idx + 1 : previousRank;
        previousRank = value;
      }
      if (fn === 'dense_rank') {
        value = idx === 0 ? 1 : currentValue === previousValue ? previousRank : previousRank + 1;
        previousRank = value;
      }
      previousValue = currentValue;
      rows.push({ ...row, [alias]: value });
    });
  }

  if (outerWhere) rows = applyWhere(rows, outerWhere, [...table.columns, alias]);

  if (outerSelect && outerSelect !== '*') {
    const selected = splitSelectExpressions(outerSelect);
    rows = rows.map(row => {
      const out = {};
      selected.forEach(expr => {
        const projected = evaluateProjection(row, expr);
        if (projected) out[projected.key] = projected.value;
      });
      return out;
    });
  }

  return { rows, columns: rows.length ? Object.keys(rows[0]) : [...table.columns, alias], rowCount: rows.length, feature: 'window_rank' };
}

function executeExistsFilter(n) {
  const match = n.match(
    /^select\s+(.+?)\s+from\s+(\w+)(?:\s+(\w+))?\s+where\s+(not\s+)?exists\s*\(\s*select\s+1\s+from\s+(\w+)(?:\s+(\w+))?\s+where\s+(?:\w+\.)?(\w+)\s*=\s*(?:\w+\.)?(\w+)\s*\)$/i
  );
  if (!match) return null;
  const [, selectRaw, leftTable, leftAliasRaw, notKeyword, rightTable, rightAliasRaw, rightCol, leftCol] = match;
  const left = MOCK_DB[leftTable];
  const right = MOCK_DB[rightTable];
  if (!left) return { error: `Table '${leftTable}' not found.` };
  if (!right) return { error: `Table '${rightTable}' not found.` };
  const leftAlias = leftAliasRaw ?? leftTable;
  const rightAlias = rightAliasRaw ?? rightTable;
  void leftAlias;
  void rightAlias;

  let rows = left.rows
    .map(row => ({ ...row }))
    .filter(row => {
      const exists = right.rows.some(r => String(r[rightCol]) === String(row[leftCol]));
      return notKeyword ? !exists : exists;
    });

  if (selectRaw !== '*') {
    const selected = splitSelectExpressions(selectRaw);
    rows = rows.map(row => {
      const out = {};
      selected.forEach(expr => {
        const projected = evaluateProjection(row, expr);
        if (projected) out[projected.key] = projected.value;
      });
      return out;
    });
  }

  return { rows, columns: rows.length ? Object.keys(rows[0]) : left.columns, rowCount: rows.length, feature: notKeyword ? 'not_exists' : 'exists' };
}

// Apply aggregates to a group of rows, returning one result row
function applyAggregates(selectRaw, groupCol, groupKey, grp) {
  const out = groupCol ? { [groupCol]: isNaN(groupKey) ? groupKey : Number(groupKey) } : {};

  // Standard aggregate: COUNT(*), SUM(col), AVG(col), MAX(col), MIN(col)
  const stdAggRe = /\b(count|sum|avg|max|min)\s*\(\s*(\*|\w+(?:\.\w+)?)\s*\)(?:\s+as\s+(\w+))?/gi;
  for (const [, fn, col, alias] of selectRaw.matchAll(stdAggRe)) {
    const c = col === '*' ? col : col.replace(/^\w+\./, '');
    const label = alias ?? `${fn}(${c})`;
    const nums = grp.map(r => Number(r[c] ?? 0));
    if (fn === 'count') out[label] = grp.length;
    else if (fn === 'sum') out[label] = nums.reduce((a, b) => a + b, 0);
    else if (fn === 'avg') out[label] = +(nums.reduce((a, b) => a + b, 0) / nums.length).toFixed(2);
    else if (fn === 'max') out[label] = Math.max(...nums);
    else if (fn === 'min') out[label] = Math.min(...nums);
  }

  // CASE WHEN aggregate: SUM(CASE WHEN col = 'val' THEN 1 ELSE 0 END)
  const caseAggRe = /\b(count|sum|avg|max|min)\s*\(\s*(case\s+when\s+.+?\s+end)\s*\)(?:\s+as\s+(\w+))?/gi;
  for (const [, fn, caseExpr, alias] of selectRaw.matchAll(caseAggRe)) {
    const label = alias ?? `${fn}(case)`;
    const vals = grp.map(r => evalRowCaseExpr(r, caseExpr));
    if (fn === 'sum' || fn === 'count') out[label] = vals.reduce((a, b) => a + b, 0);
    else if (fn === 'avg') out[label] = +(vals.reduce((a, b) => a + b, 0) / vals.length).toFixed(2);
    else if (fn === 'max') out[label] = Math.max(...vals);
    else if (fn === 'min') out[label] = Math.min(...vals);
  }

  // ROUND(aggregate, precision): e.g. ROUND(AVG(salary), 2) AS avg_salary
  const roundAggRe = /\bround\s*\(\s*((?:count|sum|avg|max|min)\s*\([^)]+\))\s*,\s*(\d+)\s*\)(?:\s+as\s+(\w+))?/gi;
  for (const [, innerAgg, precStr, alias] of selectRaw.matchAll(roundAggRe)) {
    const innerMatch = innerAgg.match(/^(count|sum|avg|max|min)\s*\(\s*(\*|\w+(?:\.\w+)?)\s*\)$/i);
    if (!innerMatch) continue;
    const [, fn, col] = innerMatch;
    const c = col === '*' ? col : col.replace(/^\w+\./, '');
    const label = alias ?? `round(${innerAgg},${precStr})`;
    const prec = Number(precStr);
    const nums = grp.map(r => Number(r[c] ?? 0));
    let raw;
    if (fn === 'count') raw = grp.length;
    else if (fn === 'sum') raw = nums.reduce((a, b) => a + b, 0);
    else if (fn === 'avg') raw = nums.reduce((a, b) => a + b, 0) / nums.length;
    else if (fn === 'max') raw = Math.max(...nums);
    else if (fn === 'min') raw = Math.min(...nums);
    const factor = Math.pow(10, prec);
    out[label] = Math.round(raw * factor) / factor;
  }

  return out;
}

// Multi-column ORDER BY
function applyOrderBy(rows, orderClause) {
  const clauses = orderClause.split(',').map(c => {
    const t = c.trim();
    const m = t.match(/^([\w.]+)\s*(asc|desc)?$/i);
    if (!m) return null;
    return { col: m[1].replace(/^\w+\./, ''), desc: (m[2] ?? '').toLowerCase() === 'desc' };
  }).filter(Boolean);

  if (clauses.length === 0) return rows;

  return [...rows].sort((a, b) => {
    for (const { col, desc } of clauses) {
      const va = a[col], vb = b[col];
      if (va == null && vb == null) continue;
      if (va == null) return 1;
      if (vb == null) return -1;
      const cmp = typeof va === 'number' && typeof vb === 'number'
        ? va - vb
        : String(va).localeCompare(String(vb));
      if (cmp !== 0) return desc ? -cmp : cmp;
    }
    return 0;
  });
}

// Parse a simple JOIN query
function parseJoin(n) {
  const joinRe = /\bfrom\s+(\w+)(?:\s+(?:as\s+)?(?!inner\b|left\b|right\b|full\b|cross\b|join\b)(\w+))?\s+((?:inner\s+)?join|left(?:\s+outer)?\s+join)\s+(\w+)(?:\s+(?:as\s+)?(?!on\b|where\b|group\b|order\b|having\b|limit\b)(\w+))?\s+on\s+(\w+)\.(\w+)\s*=\s*(\w+)\.(\w+)/;
  const m = n.match(joinRe);
  if (!m) return null;

  const [, t1Name, t1Alias, joinType, t2Name, t2Alias, onT1, onC1, onT2, onC2] = m;
  return {
    t1Name, t1Alias: t1Alias ?? t1Name,
    t2Name, t2Alias: t2Alias ?? t2Name,
    isLeft: /^left/.test(joinType.trim()),
    onC1, onC2,
  };
}

function executeJoin(n, joinInfo) {
  const { t1Name, t1Alias, t2Name, t2Alias, isLeft, onC1, onC2 } = joinInfo;

  const t1 = MOCK_DB[t1Name];
  const t2 = MOCK_DB[t2Name];
  if (!t1) return { error: `Table '${t1Name}' not found.` };
  if (!t2) return { error: `Table '${t2Name}' not found.` };

  let joined = [];
  for (const r1 of t1.rows) {
    const matches = t2.rows.filter(r2 => String(r1[onC1]) === String(r2[onC2]));
    if (matches.length > 0) {
      for (const r2 of matches) {
        const row = {};
        t1.columns.forEach(c => { row[c] = r1[c]; });
        t2.columns.forEach(c => { if (!(c in row)) row[c] = r2[c]; else row[`${t2Name}_${c}`] = r2[c]; });
        t1.columns.forEach(c => { row[`${t1Alias}.${c}`] = r1[c]; });
        t2.columns.forEach(c => { row[`${t2Alias}.${c}`] = r2[c]; });
        joined.push(row);
      }
    } else if (isLeft) {
      const row = {};
      t1.columns.forEach(c => { row[c] = r1[c]; });
      t2.columns.forEach(c => { row[c] = null; });
      t1.columns.forEach(c => { row[`${t1Alias}.${c}`] = r1[c]; });
      t2.columns.forEach(c => { row[`${t2Alias}.${c}`] = null; });
      joined.push(row);
    }
  }

  const allCols = [...new Set([...t1.columns, ...t2.columns.filter(c => !t1.columns.includes(c))])];

  const whereMatch = n.match(/\bon\s+\w+\.\w+\s*=\s*\w+\.\w+\s+where\s+(.+?)(?=\s+(?:group\s+by|order\s+by|having|limit)\b|$)/);
  if (whereMatch) joined = applyWhere(joined, whereMatch[1], allCols);

  const groupMatch = n.match(/\bgroup\s+by\s+(\w+(?:\.\w+)?)/);
  const selectRaw = n.match(/^select\s+(.+?)\s+from\b/)?.[1] ?? '*';

  if (groupMatch) {
    const rawGroupCol = groupMatch[1];
    const groupCol = rawGroupCol.replace(/^\w+\./, '');
    const groups = {};
    joined.forEach(r => {
      const k = String(r[groupCol] ?? 'null');
      if (!groups[k]) groups[k] = [];
      groups[k].push(r);
    });
    joined = Object.entries(groups).map(([key, grp]) => applyAggregates(selectRaw, groupCol, key, grp));
  }

  const havingMatch = n.match(/\bhaving\s+(.+?)(?=\s+(?:order\s+by|limit)\b|$)/);
  if (havingMatch && groupMatch) joined = applyHaving(joined, havingMatch[1]);

  const orderMatch = n.match(/\border\s+by\s+(.+?)(?=\s+(?:limit)\b|$)/);
  if (orderMatch) joined = applyOrderBy(joined, orderMatch[1]);

  const limitMatch = n.match(/\blimit\s+(\d+)/);
  if (limitMatch) joined = joined.slice(0, parseInt(limitMatch[1], 10));

  if (selectRaw !== '*') {
    const colDefs = selectRaw.split(',').map(c => {
      const t = c.trim();
      const asM = t.match(/^([\w.]+)\s+as\s+(\w+)$/i);
      if (asM) return { from: asM[1].replace(/^\w+\./, ''), to: asM[2] };
      if (/^\w+\s*\(/.test(t)) return null;
      const col = t.replace(/^\w+\./, '');
      return { from: col, to: col };
    }).filter(Boolean);

    if (colDefs.length > 0 && !groupMatch) {
      joined = joined.map(row => {
        const r = {};
        colDefs.forEach(({ from, to }) => { r[to] = row[from] ?? null; });
        return r;
      });
    }
  }

  const columns = joined.length > 0 ? Object.keys(joined[0]).filter(k => !k.includes('.')) : allCols;
  return { rows: joined, columns, rowCount: joined.length };
}

export function runMockSQL(sql) {
  const n = norm(sql);

  const mergePattern = n.match(/^merge\s+into\s+(\w+)\s+(?:as\s+)?(\w+)?/i);
  if (mergePattern) {
    const isScd2 = /\bis_current\b|\beffective_start_date\b|\beffective_end_date\b|\bwhen\s+matched\b.*\bthen\s+update\b.*\bwhen\s+not\s+matched\b.*\bthen\s+insert\b/i.test(n);
    return {
      complex: true,
      feature: isScd2 ? 'scd2_merge_pattern' : 'merge_pattern',
      rows: [{
        pattern: isScd2 ? 'SCD Type 2 MERGE pattern recognized' : 'MERGE pattern recognized',
        validation: 'Educational simulation only',
        note: 'The lab checks the MERGE shape without mutating mock tables.',
      }],
      columns: ['pattern', 'validation', 'note'],
      rowCount: 1,
    };
  }

  const windowResult = executeWindowRank(n);
  if (windowResult) return windowResult;

  const existsResult = executeExistsFilter(n);
  if (existsResult) return existsResult;

  // CTE and unsupported window functions → complex mode
  if (/\bwith\s+\w+\s+as\s*\(|\bover\s*\(|\brow_number\b|\brank\b|\bdense_rank\b|\bntile\b|\bpartition\s+by\b|\blag\b|\blead\b/.test(n)) {
    return { complex: true, feature: 'cte_window' };
  }

  // CASE WHEN: only mark unsupported complex if it appears outside a supported SELECT projection or aggregate context
  if (/\bcase\s+when\b/i.test(n)) {
    const totalCW = (n.match(/\bcase\s+when\b/gi) ?? []).length;
    const aggCW   = (n.match(/\b(?:sum|count|avg|max|min)\s*\(\s*case\s+when\b/gi) ?? []).length;
    const projectionCW = n.match(/^select\s+.+case\s+when\s+.+\s+from\s+\w+/i);
    if (totalCW !== aggCW && !projectionCW) return { complex: true, feature: 'cte_window' };
  }

  // JOIN handling
  if (/\bjoin\b/.test(n)) {
    const joinInfo = parseJoin(n);
    if (!joinInfo) return { complex: true, feature: 'join_unsupported' };
    return executeJoin(n, joinInfo);
  }

  const fromMatch = n.match(/\bfrom\s+(\w+)\b/);
  if (!fromMatch) return { error: 'No FROM clause found.' };

  const tableName = fromMatch[1];
  const tableData = MOCK_DB[tableName];
  if (!tableData) {
    const available = Object.keys(MOCK_DB).join(', ');
    return { error: `Table '${tableName}' not found. Available: ${available}.` };
  }

  let rows = tableData.rows.map(r => ({ ...r }));

  const whereMatch = n.match(/\bwhere\b\s+(.+?)(?=\s+(?:group\s+by|order\s+by|having|limit)\b|$)/);
  if (whereMatch) rows = applyWhere(rows, whereMatch[1], tableData.columns);

  const groupMatch = n.match(/\bgroup\s+by\s+([\w.]+)/);
  const selectRaw  = n.match(/^select\s+(.+?)\s+from\b/)?.[1] ?? '*';

  if (groupMatch) {
    const groupCol = groupMatch[1].replace(/^\w+\./, '');
    const groups   = {};
    rows.forEach(r => {
      const k = String(r[groupCol] ?? 'null');
      if (!groups[k]) groups[k] = [];
      groups[k].push(r);
    });
    rows = Object.entries(groups).map(([key, grp]) => applyAggregates(selectRaw, groupCol, key, grp));

    const havingMatch = n.match(/\bhaving\s+(.+?)(?=\s+(?:order\s+by|limit)\b|$)/);
    if (havingMatch) rows = applyHaving(rows, havingMatch[1]);
  }

  // Standalone aggregate (no GROUP BY)
  if (!groupMatch && /\b(count|sum|avg|max|min)\s*\(/.test(selectRaw)) {
    const out = applyAggregates(selectRaw, null, null, rows);
    rows = [out];
  }

  const orderMatch = n.match(/\border\s+by\s+(.+?)(?=\s+(?:limit)\b|$)/);
  if (orderMatch) rows = applyOrderBy(rows, orderMatch[1]);

  const limitMatch = n.match(/\blimit\s+(\d+)/);
  if (limitMatch) rows = rows.slice(0, parseInt(limitMatch[1], 10));

  if (selectRaw !== '*' && !groupMatch && !/\b(count|sum|avg|max|min)\s*\(/.test(selectRaw)) {
    const cols = splitSelectExpressions(selectRaw)
      .filter(expr => expr.toLowerCase() !== 'distinct');
    rows = rows.map(row => {
      const r = {};
      cols.forEach(expr => {
        const projected = evaluateProjection(row, expr);
        if (projected) r[projected.key] = projected.value;
      });
      return r;
    });
  }

  if (/\bselect\s+distinct\b/.test(n)) {
    const seen = new Set();
    rows = rows.filter(r => {
      const k = JSON.stringify(r);
      if (seen.has(k)) return false;
      seen.add(k);
      return true;
    });
  }

  const columns = rows.length > 0 ? Object.keys(rows[0]) : (tableData.columns ?? []);
  return { rows, columns, rowCount: rows.length };
}
