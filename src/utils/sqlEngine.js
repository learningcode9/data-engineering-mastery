// Real SQL execution engine backed by SQLite (sql.js / WASM).
// Singleton pattern: WASM loads once, all PracticeCards share the same DB.

import { SCHEMA_SQL, SEED_SQL, TABLE_SCHEMAS } from '../data/sqlDataset.js';

export { TABLE_SCHEMAS };

// ── Singleton ──────────────────────────────────────────────────────────────────

let _enginePromise = null;

export function getEngine() {
  if (!_enginePromise) _enginePromise = _initEngine();
  return _enginePromise;
}

function _loadScript(src) {
  return new Promise((resolve, reject) => {
    if (document.querySelector(`script[src="${src}"]`)) { resolve(); return; }
    const s = document.createElement('script');
    s.src = src;
    s.onload  = resolve;
    s.onerror = () => reject(new Error(`Failed to load: ${src}`));
    document.head.appendChild(s);
  });
}

async function _initEngine() {
  await _loadScript('/sql-wasm-browser.js');
  const initSqlJs = window.initSqlJs;
  if (typeof initSqlJs !== 'function') {
    throw new Error('sql.js did not expose initSqlJs on window');
  }
  const SQL = await initSqlJs({ locateFile: () => '/sql-wasm.wasm' });
  const db = new SQL.Database();
  db.run(SCHEMA_SQL);
  db.run(SEED_SQL);
  return db;
}

// ── Query safety ───────────────────────────────────────────────────────────────

const BLOCKED = /^\s*(drop\s+table|create\s+table|alter\s+table|attach\s|detach\s|pragma\s)/i;

function assertSafe(sql) {
  if (BLOCKED.test(sql.trim())) {
    throw new Error('DDL statements (CREATE/DROP/ALTER TABLE) are not allowed in the playground.');
  }
}

// ── Execute ────────────────────────────────────────────────────────────────────

/**
 * Run a SQL query against the shared DB.
 * Returns: { rows, columns, rowCount, execTime } | { error, execTime }
 */
export function execQuery(db, sql) {
  const t0 = performance.now();
  try {
    assertSafe(sql);
    const results = db.exec(sql.trim());
    const elapsed = Math.round(performance.now() - t0);

    if (results.length === 0) {
      // DML with no result set (INSERT/UPDATE/DELETE)
      const changed = db.getRowsModified();
      return { rows: [], columns: [], rowCount: 0, rowsModified: changed, execTime: elapsed };
    }

    const { columns, values } = results[0];
    const rows = values.map(v => Object.fromEntries(columns.map((c, i) => [c, v[i]])));
    return { rows, columns, rowCount: rows.length, execTime: elapsed };
  } catch (err) {
    return { error: _friendlyError(err, sql), execTime: Math.round(performance.now() - t0) };
  }
}

// ── Validate + compare ─────────────────────────────────────────────────────────

/**
 * Execute user query and compare against solution.
 * Returns: { valid, queryResult, message, mismatch? }
 */
export function validateAndCompare(db, userSql, solutionSql) {
  const userResult = execQuery(db, userSql);

  if (userResult.error) {
    return { valid: false, message: userResult.error, queryResult: userResult };
  }

  // If no solution provided — just require successful execution
  if (!solutionSql?.trim()) {
    return { valid: true, message: 'Query executed successfully.', queryResult: userResult };
  }

  const solResult = execQuery(db, solutionSql);
  if (solResult.error) {
    // Solution is broken — accept any successful execution
    return { valid: true, message: 'Query executed successfully.', queryResult: userResult };
  }

  const semanticCheck = _validateSemanticPractice(db, userSql, solutionSql, userResult);
  if (semanticCheck) return semanticCheck;

  const cmp = _compareResults(userResult, solResult);
  if (cmp.match) {
    return { valid: true, message: 'Query looks correct!', queryResult: userResult };
  }

  return {
    valid: false,
    message: cmp.reason,
    queryResult: userResult,
    mismatch: true,
    expectedRowCount: solResult.rowCount,
  };
}

// ── Result comparison ──────────────────────────────────────────────────────────

function _compareResults(a, b) {
  if (a.rowCount !== b.rowCount) {
    return {
      match: false,
      reason: `Expected ${b.rowCount} row${b.rowCount !== 1 ? 's' : ''}, got ${a.rowCount}.`,
    };
  }
  if (a.columns.length !== b.columns.length) {
    return {
      match: false,
      reason: `Expected ${b.columns.length} column${b.columns.length !== 1 ? 's' : ''}, got ${a.columns.length}.`,
    };
  }

  // Sort both sets for order-independent comparison.
  // We sort by stringified row to handle mixed types consistently.
  const norm = rows =>
    rows
      .map(row =>
        Object.fromEntries(
          Object.entries(row).map(([k, v]) => [
            k.toLowerCase(),
            typeof v === 'number' ? Math.round(v * 1000) / 1000 : v,
          ])
        )
      )
      .sort((x, y) => (JSON.stringify(x) < JSON.stringify(y) ? -1 : 1));

  const aN = norm(a.rows);
  const bN = norm(b.rows);

  if (JSON.stringify(aN) !== JSON.stringify(bN)) {
    return { match: false, reason: 'Result data does not match the expected output.' };
  }
  return { match: true };
}

function _normalizeSql(sql) {
  return (sql ?? '').replace(/\s+/g, ' ').trim().toLowerCase();
}

function _isProductNameEndsWithProTask(solutionSql) {
  const s = _normalizeSql(solutionSql);
  return /\bfrom\s+products\b/.test(s) && /\bproduct_name\s+like\s+['"]%pro['"]/.test(s);
}

function _extractProductIds(result) {
  return new Set(
    (result.rows ?? [])
      .map(row => row.product_id)
      .filter(v => v !== undefined && v !== null)
      .map(String)
  );
}

function _extractColumnValues(result, column) {
  return new Set(
    (result.rows ?? [])
      .map(row => row[column])
      .filter(v => v !== undefined && v !== null)
      .map(String)
  );
}

function _validateSemanticPractice(db, userSql, solutionSql, userResult) {
  if (!_isProductNameEndsWithProTask(solutionSql)) return null;

  const sql = _normalizeSql(userSql);
  if (!/\bfrom\s+products\b/.test(sql)) {
    return { valid: false, message: "Use the products table for this task.", queryResult: userResult };
  }

  if (/\b(?:\w+\.)?name\s+like\b/.test(sql)) {
    return {
      valid: false,
      message: "The products table has product_name, not name. Use product_name LIKE '%Pro'.",
      queryResult: userResult,
    };
  }

  if (!/\b(?:\w+\.)?product_name\s+like\s+['"]%pro['"]/.test(sql)) {
    return {
      valid: false,
      message: "Filter with product_name LIKE '%Pro' so the name ends with Pro.",
      queryResult: userResult,
    };
  }

  const expected = execQuery(db, "SELECT product_id FROM products WHERE product_name LIKE '%Pro';");
  const expectedNames = execQuery(db, "SELECT product_name FROM products WHERE product_name LIKE '%Pro';");
  const actual = execQuery(db, `SELECT product_id FROM (${userSql.replace(/;+\s*$/, '')}) AS learner_result;`);
  if (!actual.error) {
    const expectedIds = _extractProductIds(expected);
    const actualIds = _extractProductIds(actual);
    const sameIds = expectedIds.size === actualIds.size && [...expectedIds].every(id => actualIds.has(id));
    if (!sameIds) {
      return {
        valid: false,
        message: 'The filter should return exactly the products ending with Pro.',
        queryResult: userResult,
        mismatch: true,
        expectedRowCount: expected.rowCount,
      };
    }
  } else {
    const actualNames = _extractColumnValues(userResult, 'product_name');
    const expectedProductNames = _extractColumnValues(expectedNames, 'product_name');
    const sameNames = actualNames.size > 0 &&
      actualNames.size === expectedProductNames.size &&
      [...expectedProductNames].every(name => actualNames.has(name));

    if (!sameNames && userResult.rowCount !== expected.rowCount) {
      return {
        valid: false,
        message: `Expected ${expected.rowCount} row${expected.rowCount !== 1 ? 's' : ''}, got ${userResult.rowCount}.`,
        queryResult: userResult,
        mismatch: true,
        expectedRowCount: expected.rowCount,
      };
    }

    if (!sameNames && actualNames.size > 0) {
      return {
        valid: false,
        message: 'The filter should return exactly the products ending with Pro.',
        queryResult: userResult,
        mismatch: true,
        expectedRowCount: expected.rowCount,
      };
    }
  }

  if (userResult.rowCount !== expected.rowCount) {
    return {
      valid: false,
      message: `Expected ${expected.rowCount} row${expected.rowCount !== 1 ? 's' : ''}, got ${userResult.rowCount}.`,
      queryResult: userResult,
      mismatch: true,
      expectedRowCount: expected.rowCount,
    };
  }

  return { valid: true, message: 'Query looks correct!', queryResult: userResult };
}

// ── Error translation ──────────────────────────────────────────────────────────

function _editDistance(a, b) {
  const m = a.length, n = b.length;
  const dp = Array.from({ length: m + 1 }, (_, i) =>
    Array.from({ length: n + 1 }, (_, j) => i || j)
  );
  for (let i = 1; i <= m; i++)
    for (let j = 1; j <= n; j++)
      dp[i][j] = a[i - 1] === b[j - 1]
        ? dp[i - 1][j - 1]
        : 1 + Math.min(dp[i - 1][j], dp[i][j - 1], dp[i - 1][j - 1]);
  return dp[m][n];
}

function _closest(name, candidates) {
  let best = null, bestDist = Infinity;
  for (const c of candidates) {
    const d = _editDistance(name.toLowerCase(), c.toLowerCase());
    if (d < bestDist) { bestDist = d; best = c; }
  }
  return bestDist <= Math.max(2, Math.floor(name.length * 0.45)) ? best : null;
}

function _friendlyError(err, sql) {
  const raw  = err?.message ?? String(err);
  const norm = raw.toLowerCase();

  // ── no such column ──
  const colMatch = raw.match(/no such column:\s*(\S+)/i);
  if (colMatch) {
    const col = colMatch[1];
    const tableMatch = sql.toLowerCase().match(/\bfrom\s+(\w+)/);
    const tableName  = tableMatch?.[1];
    const schema     = tableName && TABLE_SCHEMAS[tableName];
    if (schema) {
      const suggestion = _closest(col, schema.columns);
      const cols = schema.columns.map(c => `  • ${c}`).join('\n');
      return (
        `Column '${col}' does not exist in table '${tableName}'.\n\n` +
        `Available columns:\n${cols}` +
        (suggestion ? `\n\n💡 Did you mean '${suggestion}'?` : '')
      );
    }
    return `Column '${col}' does not exist. Check the column name.`;
  }

  // ── no such table ──
  const tableMatch = raw.match(/no such table:\s*(\S+)/i);
  if (tableMatch) {
    const tbl = tableMatch[1];
    const available = Object.keys(TABLE_SCHEMAS);
    const suggestion = _closest(tbl, available);
    return (
      `Table '${tbl}' does not exist.\n\n` +
      `Available tables: ${available.join(', ')}` +
      (suggestion ? `\n\n💡 Did you mean '${suggestion}'?` : '')
    );
  }

  // ── ambiguous column ──
  const ambigMatch = raw.match(/ambiguous column name:\s*(\S+)/i);
  if (ambigMatch) {
    return (
      `Column '${ambigMatch[1]}' is ambiguous — it exists in multiple joined tables.\n` +
      `Qualify it as: table_name.${ambigMatch[1]}`
    );
  }

  // ── syntax error ──
  if (norm.includes('syntax error')) {
    const near = raw.match(/near\s+"([^"]+)"/i);
    return near
      ? `SQL syntax error near '${near[1]}'. Check for typos or missing keywords.`
      : 'SQL syntax error — check your query for typos or missing keywords.';
  }

  // ── aggregate misuse ──
  if (norm.includes('misuse of aggregate')) {
    return (
      'Aggregate functions (COUNT, SUM, AVG, MAX, MIN) cannot be used in the WHERE clause.\n' +
      'Use HAVING to filter on aggregated values.'
    );
  }

  // ── no such function ──
  const fnMatch = raw.match(/no such function:\s*(\S+)/i);
  if (fnMatch) {
    return `'${fnMatch[1]}' is not a recognized SQL function.`;
  }

  // ── GROUP BY required ──
  if (norm.includes('not a group-by expression') || norm.includes('must appear in the group by')) {
    return (
      'Column must appear in the GROUP BY clause or be used inside an aggregate function.\n' +
      'Either add the column to GROUP BY, or wrap it in COUNT/SUM/AVG/MAX/MIN.'
    );
  }

  // ── type mismatch ──
  if (norm.includes('datatype mismatch')) {
    return 'Type mismatch — you may be comparing a text column to a number (or vice versa).';
  }

  return raw;
}
