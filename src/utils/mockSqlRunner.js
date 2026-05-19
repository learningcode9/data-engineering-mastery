import { MOCK_DB } from '../data/mockDatabase.js';

function norm(sql) {
  return (sql ?? '').replace(/\s+/g, ' ').trim().toLowerCase();
}

function applyWhere(rows, clause) {
  const conditions = clause.trim().split(/\s+and\s+/);
  return rows.filter(row =>
    conditions.every(cond => {
      cond = cond.trim();
      let m;

      // col = 'string'
      m = cond.match(/^(\w+)\s*=\s*'([^']*)'$/);
      if (m) return String(row[m[1]] ?? '').toLowerCase() === m[2].toLowerCase();

      // col = number
      m = cond.match(/^(\w+)\s*=\s*(-?\d+\.?\d*)$/);
      if (m) return Number(row[m[1]]) === Number(m[2]);

      // col > number
      m = cond.match(/^(\w+)\s*>\s*(-?\d+\.?\d*)$/);
      if (m) return Number(row[m[1]]) > Number(m[2]);

      // col < number
      m = cond.match(/^(\w+)\s*<\s*(-?\d+\.?\d*)$/);
      if (m) return Number(row[m[1]]) < Number(m[2]);

      // col >= number
      m = cond.match(/^(\w+)\s*>=\s*(-?\d+\.?\d*)$/);
      if (m) return Number(row[m[1]]) >= Number(m[2]);

      // col <= number
      m = cond.match(/^(\w+)\s*<=\s*(-?\d+\.?\d*)$/);
      if (m) return Number(row[m[1]]) <= Number(m[2]);

      // col LIKE '%pattern%'
      m = cond.match(/^(\w+)\s+like\s+'([^']+)'$/);
      if (m) {
        const re = new RegExp('^' + m[2].replace(/%/g, '.*').replace(/_/g, '.') + '$', 'i');
        return re.test(String(row[m[1]] ?? ''));
      }

      // col IS NULL / IS NOT NULL
      if (/\bis\s+not\s+null\b/.test(cond)) {
        m = cond.match(/^(\w+)\s+is\s+not\s+null$/);
        if (m) return row[m[1]] != null;
      }
      m = cond.match(/^(\w+)\s+is\s+null$/);
      if (m) return row[m[1]] == null;

      // col IN ('a','b')
      m = cond.match(/^(\w+)\s+in\s+\(([^)]+)\)$/);
      if (m) {
        const vals = m[2].split(',').map(v => v.trim().replace(/^'|'$/g, '').toLowerCase());
        return vals.includes(String(row[m[1]] ?? '').toLowerCase());
      }

      return true; // unrecognised — pass through
    })
  );
}

export function runMockSQL(sql) {
  const n = norm(sql);

  // Bail on queries too complex to simulate accurately
  if (/\bjoin\b|\bwith\s+\w|\bover\s*\(|\brow_number\b|\brank\b|\bpartition\s+by\b/.test(n)) {
    return { complex: true };
  }

  // Extract table name
  const fromMatch = n.match(/\bfrom\s+(\w+)\b/);
  if (!fromMatch) return { error: 'No FROM clause found.' };

  const tableName = fromMatch[1];
  const tableData = MOCK_DB[tableName];
  if (!tableData) {
    const available = Object.keys(MOCK_DB).join(', ');
    return { error: `Table "${tableName}" not found. Playground tables: ${available}.` };
  }

  let rows = tableData.rows.map(r => ({ ...r }));

  // WHERE
  const whereMatch = n.match(/\bwhere\b\s+(.+?)(?=\s+(?:group\s+by|order\s+by|having|limit)\b|$)/);
  if (whereMatch) rows = applyWhere(rows, whereMatch[1]);

  // GROUP BY
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
        const label  = alias ?? `${fn}(${col})`;
        const nums   = grp.map(r => Number(r[col] ?? 0));
        if (fn === 'count') out[label] = grp.length;
        else if (fn === 'sum') out[label] = nums.reduce((a, b) => a + b, 0);
        else if (fn === 'avg') out[label] = +(nums.reduce((a, b) => a + b, 0) / nums.length).toFixed(2);
        else if (fn === 'max') out[label] = Math.max(...nums);
        else if (fn === 'min') out[label] = Math.min(...nums);
      }
      return out;
    });
  }

  // Scalar aggregates (no GROUP BY)
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

  // ORDER BY
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

  // LIMIT
  const limitMatch = n.match(/\blimit\s+(\d+)/);
  if (limitMatch) rows = rows.slice(0, parseInt(limitMatch[1], 10));

  // SELECT specific columns (skip for aggregate queries already computed)
  if (selectRaw !== '*' && !groupMatch && !/\b(count|sum|avg|max|min)\s*\(/.test(selectRaw)) {
    const cols = selectRaw.split(',').map(c => {
      const t = c.trim();
      const asM = t.match(/^(\w+)\s+as\s+(\w+)$/i);
      return asM ? { from: asM[1], to: asM[2] } : { from: t, to: t };
    }).filter(({ from }) => from !== 'distinct');

    rows = rows.map(row => {
      const r = {};
      cols.forEach(({ from, to }) => { if (from in row) r[to] = row[from]; });
      return r;
    });
  }

  // DISTINCT
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
