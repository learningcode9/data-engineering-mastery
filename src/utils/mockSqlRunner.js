import { MOCK_DB } from '../data/mockDatabase.js';

function norm(sql) {
  return (sql ?? '').replace(/\s+/g, ' ').trim().toLowerCase();
}

const SQL_KW = new Set([
  'select','from','where','group','by','order','having','inner','left','right',
  'full','join','cross','on','limit','top','distinct','count','sum','avg','max',
  'min','as','and','or','asc','desc','not','in','is','null','like','between',
  'true','false','case','when','then','else','end','coalesce','nullif',
]);

function applyWhere(rows, clause, allCols) {
  const conditions = clause.trim().split(/\s+and\s+/i);
  return rows.filter(row =>
    conditions.every(cond => {
      cond = cond.trim();
      let m;

      // table.col = 'val' or col = 'val'
      m = cond.match(/^(?:\w+\.)?(\w+)\s*=\s*'([^']*)'$/);
      if (m) return String(row[m[1]] ?? '').toLowerCase() === m[2].toLowerCase();

      m = cond.match(/^(?:\w+\.)?(\w+)\s*=\s*(-?\d+\.?\d*)$/);
      if (m) return Number(row[m[1]]) === Number(m[2]);

      m = cond.match(/^(?:\w+\.)?(\w+)\s*>\s*(-?\d+\.?\d*)$/);
      if (m) return Number(row[m[1]]) > Number(m[2]);

      m = cond.match(/^(?:\w+\.)?(\w+)\s*<\s*(-?\d+\.?\d*)$/);
      if (m) return Number(row[m[1]]) < Number(m[2]);

      m = cond.match(/^(?:\w+\.)?(\w+)\s*>=\s*(-?\d+\.?\d*)$/);
      if (m) return Number(row[m[1]]) >= Number(m[2]);

      m = cond.match(/^(?:\w+\.)?(\w+)\s*<=\s*(-?\d+\.?\d*)$/);
      if (m) return Number(row[m[1]]) <= Number(m[2]);

      m = cond.match(/^(?:\w+\.)?(\w+)\s*!=\s*'([^']*)'$/);
      if (m) return String(row[m[1]] ?? '').toLowerCase() !== m[2].toLowerCase();

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

      m = cond.match(/^(?:\w+\.)?(\w+)\s+in\s+\(([^)]+)\)$/);
      if (m) {
        const vals = m[2].split(',').map(v => v.trim().replace(/^'|'$/g, '').toLowerCase());
        return vals.includes(String(row[m[1]] ?? '').toLowerCase());
      }

      m = cond.match(/^(?:\w+\.)?(\w+)\s+between\s+(-?\d+\.?\d*)\s+and\s+(-?\d+\.?\d*)$/);
      if (m) {
        const v = Number(row[m[1]]);
        return v >= Number(m[2]) && v <= Number(m[3]);
      }

      return true;
    })
  );
}

// Apply HAVING clause to already-grouped rows
function applyHaving(rows, clause) {
  const conditions = clause.trim().split(/\s+and\s+/i);
  return rows.filter(row =>
    conditions.every(cond => {
      cond = cond.trim();
      // count(*) > N  or  sum(col) >= N etc.
      let m = cond.match(/^\w+\s*\(\s*[\w*]+\s*\)\s*(?:as\s+\w+\s*)?(>|<|>=|<=|=|!=)\s*(-?\d+\.?\d*)$/i);
      if (m) {
        // find the first numeric value in the row that matches the aggregate label
        const aggKey = Object.keys(row).find(k => typeof row[k] === 'number' && k !== 'count(*)');
        const aggVal = aggKey ? row[aggKey] : (row['count(*)'] ?? 0);
        const rhs = Number(m[2]);
        const op = m[1];
        if (op === '>') return aggVal > rhs;
        if (op === '<') return aggVal < rhs;
        if (op === '>=') return aggVal >= rhs;
        if (op === '<=') return aggVal <= rhs;
        if (op === '=') return aggVal === rhs;
        if (op === '!=') return aggVal !== rhs;
      }
      return true;
    })
  );
}

// Resolve a column expression that may be prefixed with a table alias
function resolveCol(row, expr) {
  // strip table prefix
  const col = expr.replace(/^\w+\./, '').trim();
  return row[col];
}

// Evaluate simple CASE WHEN expressions
function evalCaseWhen(row, expr) {
  const whenClauses = [];
  const whenRe = /when\s+'?([^']+)'?\s+then\s+'?([^']+)'?/g;
  let m;
  while ((m = whenRe.exec(expr)) !== null) wenClauses.push({ when: m[1], then: m[2] });
  return null; // fall through to raw value
}

// Parse a simple JOIN query
function parseJoin(n) {
  // Patterns: FROM t1 [INNER] JOIN t2 ON t1.col = t2.col
  //           FROM t1 LEFT [OUTER] JOIN t2 ON ...
  const joinRe = /\bfrom\s+(\w+)(?:\s+(?:as\s+)?(\w+))?\s+((?:inner\s+)?join|left(?:\s+outer)?\s+join)\s+(\w+)(?:\s+(?:as\s+)?(\w+))?\s+on\s+(\w+)\.(\w+)\s*=\s*(\w+)\.(\w+)/;
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

  // Build joined rows
  let joined = [];
  for (const r1 of t1.rows) {
    const matches = t2.rows.filter(r2 => String(r1[onC1]) === String(r2[onC2]));
    if (matches.length > 0) {
      for (const r2 of matches) {
        const row = {};
        t1.columns.forEach(c => { row[c] = r1[c]; });
        t2.columns.forEach(c => { if (!(c in row)) row[c] = r2[c]; else row[`${t2Name}_${c}`] = r2[c]; });
        // Also store prefixed versions for qualification
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

  // Apply WHERE
  const whereMatch = n.match(/\bon\s+\w+\.\w+\s*=\s*\w+\.\w+\s+where\s+(.+?)(?=\s+(?:group\s+by|order\s+by|having|limit)\b|$)/);
  if (whereMatch) joined = applyWhere(joined, whereMatch[1], allCols);

  // Apply GROUP BY
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

    joined = Object.entries(groups).map(([key, grp]) => {
      const out = { [groupCol]: isNaN(key) ? key : Number(key) };
      const aggRe = /\b(count|sum|avg|max|min)\s*\(\s*(\*|\w+(?:\.\w+)?)\s*\)(?:\s+as\s+(\w+))?/g;
      for (const [, fn, rawCol, alias] of selectRaw.matchAll(aggRe)) {
        const col = rawCol === '*' ? rawCol : rawCol.replace(/^\w+\./, '');
        const label = alias ?? `${fn}(${col})`;
        const nums = grp.map(r => Number(r[col] ?? 0));
        if (fn === 'count') out[label] = grp.length;
        else if (fn === 'sum') out[label] = nums.reduce((a, b) => a + b, 0);
        else if (fn === 'avg') out[label] = +(nums.reduce((a, b) => a + b, 0) / nums.length).toFixed(2);
        else if (fn === 'max') out[label] = Math.max(...nums);
        else if (fn === 'min') out[label] = Math.min(...nums);
      }
      return out;
    });
  }

  // Apply HAVING
  const havingMatch = n.match(/\bhaving\s+(.+?)(?=\s+(?:order\s+by|limit)\b|$)/);
  if (havingMatch && groupMatch) joined = applyHaving(joined, havingMatch[1]);

  // Apply ORDER BY
  const orderMatch = n.match(/\border\s+by\s+(\w+(?:\.\w+)?)(?:\s+(asc|desc))?/);
  if (orderMatch) {
    const col = orderMatch[1].replace(/^\w+\./, '');
    const desc = orderMatch[2] === 'desc';
    joined = [...joined].sort((a, b) => {
      const va = a[col], vb = b[col];
      if (va == null) return 1;
      if (vb == null) return -1;
      const cmp = typeof va === 'number' ? va - vb : String(va).localeCompare(String(vb));
      return desc ? -cmp : cmp;
    });
  }

  // Apply LIMIT
  const limitMatch = n.match(/\blimit\s+(\d+)/);
  if (limitMatch) joined = joined.slice(0, parseInt(limitMatch[1], 10));

  // Project columns
  if (selectRaw !== '*') {
    const colDefs = selectRaw.split(',').map(c => {
      const t = c.trim();
      const asM = t.match(/^([\w.]+)\s+as\s+(\w+)$/i);
      if (asM) return { from: asM[1].replace(/^\w+\./, ''), to: asM[2] };
      // skip aggregates (already computed)
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

  // CTE and window function support — mark as complex with a helpful message
  if (/\bwith\s+\w+\s+as\s*\(|\bover\s*\(|\brow_number\b|\brank\b|\bdense_rank\b|\bpartition\s+by\b|\blag\b|\blead\b/.test(n)) {
    return { complex: true, feature: 'cte_window' };
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

  const groupMatch = n.match(/\bgroup\s+by\s+(\w+)/);
  const selectRaw  = n.match(/^select\s+(.+?)\s+from\b/)?.[1] ?? '*';

  if (groupMatch) {
    const groupCol = groupMatch[1];
    const groups   = {};
    rows.forEach(r => {
      const k = String(r[groupCol] ?? 'null');
      if (!groups[k]) groups[k] = [];
      groups[k].push(r);
    });

    rows = Object.entries(groups).map(([key, grp]) => {
      const out = { [groupCol]: isNaN(key) ? key : Number(key) };
      const aggRe = /\b(count|sum|avg|max|min)\s*\(\s*(\*|\w+)\s*\)(?:\s+as\s+(\w+))?/g;
      for (const [, fn, col, alias] of selectRaw.matchAll(aggRe)) {
        const label = alias ?? `${fn}(${col})`;
        const nums  = grp.map(r => Number(r[col] ?? 0));
        if (fn === 'count') out[label] = grp.length;
        else if (fn === 'sum') out[label] = nums.reduce((a, b) => a + b, 0);
        else if (fn === 'avg') out[label] = +(nums.reduce((a, b) => a + b, 0) / nums.length).toFixed(2);
        else if (fn === 'max') out[label] = Math.max(...nums);
        else if (fn === 'min') out[label] = Math.min(...nums);
      }
      return out;
    });

    // HAVING
    const havingMatch = n.match(/\bhaving\s+(.+?)(?=\s+(?:order\s+by|limit)\b|$)/);
    if (havingMatch) rows = applyHaving(rows, havingMatch[1]);
  }

  if (!groupMatch && /\b(count|sum|avg|max|min)\s*\(/.test(selectRaw)) {
    const out   = {};
    const aggRe = /\b(count|sum|avg|max|min)\s*\(\s*(\*|\w+)\s*\)(?:\s+as\s+(\w+))?/g;
    for (const [, fn, col, alias] of selectRaw.matchAll(aggRe)) {
      const label = alias ?? `${fn}(${col})`;
      const nums  = rows.map(r => Number(r[col] ?? 0));
      if (fn === 'count') out[label] = rows.length;
      else if (fn === 'sum') out[label] = nums.reduce((a, b) => a + b, 0);
      else if (fn === 'avg') out[label] = +(nums.reduce((a, b) => a + b, 0) / nums.length).toFixed(2);
      else if (fn === 'max') out[label] = Math.max(...nums);
      else if (fn === 'min') out[label] = Math.min(...nums);
    }
    rows = [out];
  }

  const orderMatch = n.match(/\border\s+by\s+(\w+)(?:\s+(asc|desc))?/);
  if (orderMatch) {
    const col  = orderMatch[1];
    const desc = orderMatch[2] === 'desc';
    rows = [...rows].sort((a, b) => {
      const va = a[col], vb = b[col];
      if (va == null) return 1;
      if (vb == null) return -1;
      const cmp = typeof va === 'number' ? va - vb : String(va).localeCompare(String(vb));
      return desc ? -cmp : cmp;
    });
  }

  const limitMatch = n.match(/\blimit\s+(\d+)/);
  if (limitMatch) rows = rows.slice(0, parseInt(limitMatch[1], 10));

  if (selectRaw !== '*' && !groupMatch && !/\b(count|sum|avg|max|min)\s*\(/.test(selectRaw)) {
    const cols = selectRaw.split(',').map(c => {
      const t  = c.trim();
      const asM = t.match(/^(\w+)\s+as\s+(\w+)$/i);
      return asM ? { from: asM[1], to: asM[2] } : { from: t, to: t };
    }).filter(({ from }) => from !== 'distinct');

    rows = rows.map(row => {
      const r = {};
      cols.forEach(({ from, to }) => { if (from in row) r[to] = row[from]; });
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
