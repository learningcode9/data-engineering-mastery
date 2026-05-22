import { MOCK_DB } from '../data/mockDatabase.js';

function norm(sql) {
  return (sql ?? '').replace(/\s+/g, ' ').trim().toLowerCase();
}

const SQL_KW = new Set([
  'select','from','where','group','by','order','having','inner','left','right',
  'full','join','cross','on','limit','top','distinct','count','sum','avg','max',
  'min','as','and','or','asc','desc','not','in','is','null','like','between',
  'true','false',
]);

// Validate that every concrete column reference in the query exists in tableColumns.
// Returns an error string on failure, or null if everything checks out.
function validateColumns(n, tableName, tableColumns) {
  const selectM = n.match(/^select\s+(.*?)\s+from\b/s);
  if (selectM) {
    const clause = selectM[1];
    if (!/^\s*\*\s*$/.test(clause) && !/^\s*distinct\s+\*\s*$/.test(clause)) {
      for (let expr of clause.split(',')) {
        expr = expr.trim().replace(/\s+as\s+\w+$/i, '').trim();
        const aggM = expr.match(/^\w+\s*\(\s*(\*|\w+)\s*\)$/);
        if (aggM) {
          if (aggM[1] !== '*' && !tableColumns.includes(aggM[1]))
            return `Column '${aggM[1]}' does not exist in table '${tableName}'.`;
          continue;
        }
        const col = expr.replace(/^\w+\./, '').replace(/^distinct\s+/i, '').trim();
        if (/^\w+$/.test(col) && !SQL_KW.has(col) && !tableColumns.includes(col))
          return `Column '${col}' does not exist in table '${tableName}'.`;
      }
    }
  }

  const whereM = n.match(/\bwhere\b\s+(.+?)(?=\s+(?:group\s+by|order\s+by|having|limit)\b|$)/);
  if (whereM) {
    const parts = whereM[1].split(/\s+(?:and|or)\s+/i);
    for (const part of parts) {
      if (/^\w+\s*\(/.test(part.trim())) continue; // skip function calls
      const m = part.trim().match(/^(\w+)\s*(?:=|!=|<>|>=|<=|>|<|\s+like|\s+in|\s+is|\s+between)/i);
      if (m && !SQL_KW.has(m[1]) && !tableColumns.includes(m[1]))
        return `Column '${m[1]}' does not exist in table '${tableName}'.`;
    }
  }

  const groupM = n.match(/\bgroup\s+by\s+(\w+)/);
  if (groupM && !tableColumns.includes(groupM[1]))
    return `Column '${groupM[1]}' does not exist in table '${tableName}'.`;

  return null;
}

function applyWhere(rows, clause) {
  const conditions = clause.trim().split(/\s+and\s+/);
  return rows.filter(row =>
    conditions.every(cond => {
      cond = cond.trim();
      let m;

      m = cond.match(/^(\w+)\s*=\s*'([^']*)'$/);
      if (m) return String(row[m[1]] ?? '').toLowerCase() === m[2].toLowerCase();

      m = cond.match(/^(\w+)\s*=\s*(-?\d+\.?\d*)$/);
      if (m) return Number(row[m[1]]) === Number(m[2]);

      m = cond.match(/^(\w+)\s*>\s*(-?\d+\.?\d*)$/);
      if (m) return Number(row[m[1]]) > Number(m[2]);

      m = cond.match(/^(\w+)\s*<\s*(-?\d+\.?\d*)$/);
      if (m) return Number(row[m[1]]) < Number(m[2]);

      m = cond.match(/^(\w+)\s*>=\s*(-?\d+\.?\d*)$/);
      if (m) return Number(row[m[1]]) >= Number(m[2]);

      m = cond.match(/^(\w+)\s*<=\s*(-?\d+\.?\d*)$/);
      if (m) return Number(row[m[1]]) <= Number(m[2]);

      m = cond.match(/^(\w+)\s+like\s+'([^']+)'$/);
      if (m) {
        const re = new RegExp('^' + m[2].replace(/%/g, '.*').replace(/_/g, '.') + '$', 'i');
        return re.test(String(row[m[1]] ?? ''));
      }

      if (/\bis\s+not\s+null\b/.test(cond)) {
        m = cond.match(/^(\w+)\s+is\s+not\s+null$/);
        if (m) return row[m[1]] != null;
      }
      m = cond.match(/^(\w+)\s+is\s+null$/);
      if (m) return row[m[1]] == null;

      m = cond.match(/^(\w+)\s+in\s+\(([^)]+)\)$/);
      if (m) {
        const vals = m[2].split(',').map(v => v.trim().replace(/^'|'$/g, '').toLowerCase());
        return vals.includes(String(row[m[1]] ?? '').toLowerCase());
      }

      return true; // unrecognised condition — pass through
    })
  );
}

export function runMockSQL(sql) {
  const n = norm(sql);

  if (/\bjoin\b|\bwith\s+\w|\bover\s*\(|\brow_number\b|\brank\b|\bpartition\s+by\b/.test(n)) {
    return { complex: true };
  }

  const fromMatch = n.match(/\bfrom\s+(\w+)\b/);
  if (!fromMatch) return { error: 'No FROM clause found.' };

  const tableName = fromMatch[1];
  const tableData = MOCK_DB[tableName];
  if (!tableData) {
    const available = Object.keys(MOCK_DB).join(', ');
    return { error: `Table '${tableName}' not found. Available tables: ${available}.` };
  }

  // Validate all column references before touching data
  const colErr = validateColumns(n, tableName, tableData.columns);
  if (colErr) return { error: colErr };

  let rows = tableData.rows.map(r => ({ ...r }));

  const whereMatch = n.match(/\bwhere\b\s+(.+?)(?=\s+(?:group\s+by|order\s+by|having|limit)\b|$)/);
  if (whereMatch) rows = applyWhere(rows, whereMatch[1]);

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
