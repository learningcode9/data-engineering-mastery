# SQL Execution Engine

## Engine choice

**sql.js** (SQLite compiled to WebAssembly via Emscripten).

- Zero backend required — runs entirely in the browser
- Full SQLite 3.43+ feature set: window functions, CTEs, recursive queries, FULL OUTER JOIN
- Binary files served from `/public/sql-wasm.wasm` and `/public/sql-wasm-browser.js`
- Loaded once via a singleton pattern; all practice cards share the same in-memory DB

DuckDB-WASM was considered but rejected for this phase: its initial WASM bundle (>10 MB) is significantly larger and its Vite integration requires additional worker/COOP headers. sql.js loads in ~1 MB and works with no extra configuration.

---

## Sample schema

Eight tables seeded with realistic rows. All relationships use explicit foreign keys.

| Table          | Rows | Purpose |
|---|---|---|
| `customers`    | 15   | 5 cities, includes NULL emails and inactive statuses |
| `products`     | 12   | 4 categories (Education, Lab, Tools, Cloud), prices $39–$249 |
| `orders`       | 30   | Jan–Jul 2024, statuses: pending / shipped / delivered / cancelled / refunded |
| `employees`    | 20   | 4 departments, self-referential manager_id, salaries $62k–$140k |
| `transactions` | 40   | Jan–Nov 2024, 4 payment methods |
| `events`       | 30   | Web analytics: page_view, click, search, purchase, sign_up, logout |
| `shipments`    | 25   | 4 carriers (FedEx, UPS, USPS, DHL), NULL delivered_at for in-flight |
| `inventory`    | 20   | 4 warehouses (East, West, Central, South), low-stock rows for analysis |

Full DDL and seed data: `src/data/sqlDataset.js`

---

## Validation approach

`validateAndCompare(db, userSql, solutionSql)` in `src/utils/sqlEngine.js`:

1. **Execute user SQL** — on error, return the friendly error message (see Error Translation below).
2. **If no solution** — any successful execution is accepted.
3. **Execute solution SQL** — if the solution itself fails (conceptual/commented tasks), fall back to accepting any successful user execution.
4. **Semantic check** — before numeric comparison, run task-specific rules (e.g., the "product_name LIKE '%Pro'" task checks the exact column used).
5. **Result comparison** — compare row counts, column counts, and values. Row order is ignored by normalising both sets before comparison. Numeric values are rounded to 3 decimal places.

### Error translation

Raw SQLite errors are converted to beginner-friendly messages:

| SQLite error | User-facing message |
|---|---|
| `no such column: name` on `products` | `Column 'name' does not exist in table 'products'. Available columns: … Did you mean 'product_name'?` |
| `no such table: customers_v2` | `Table 'customers_v2' does not exist. Available tables: customers, products, …` |
| `ambiguous column name: status` | `Column 'status' is ambiguous — qualify it as table_name.status` |
| `syntax error near "FORM"` | `SQL syntax error near 'FORM'. Check for typos or missing keywords.` |
| `misuse of aggregate function` | Use HAVING, not WHERE, to filter aggregated values. |

Edit distance (Levenshtein) is used to suggest the closest valid column or table name.

---

## DDL restrictions

The following statements are blocked to keep the shared DB clean:

```
DROP TABLE, CREATE TABLE, ALTER TABLE, ATTACH, DETACH, PRAGMA
```

`INSERT`, `UPDATE`, and `DELETE` are allowed (they modify the in-memory DB for the session). The DB is re-seeded on each page load.

---

## File map

| File | Role |
|---|---|
| `public/sql-wasm.wasm` | SQLite compiled to WASM |
| `public/sql-wasm-browser.js` | sql.js loader (exposes `window.initSqlJs`) |
| `src/data/sqlDataset.js` | SCHEMA_SQL, SEED_SQL, TABLE_SCHEMAS |
| `src/utils/sqlEngine.js` | Singleton engine, execQuery, validateAndCompare, error translation |
| `src/hooks/useSqlEngine.js` | React hook: engineReady, run, runAndValidate, history |
| `src/services/sqlEngine/sqlEngine.ts` | TypeScript re-export layer |
| `src/services/sqlEngine/schema.ts` | getTables, getColumns, validateTableExists, validateColumnExists |
| `src/services/sqlEngine/resultValidator.ts` | validateUserQuery, runQuery, checkResultShape, VALIDATION_EXAMPLES |
| `src/components/workspace/SQLWorkspace.jsx` | Full-featured practice workspace (editor, schema, plan, hints, notes tabs) |
| `src/components/ui/PracticeCard.jsx` | Lightweight practice card with SQL mode |
| `src/utils/queryAnalyzer.js` | Static query analysis (detects joins, aggregates, window functions) |

---

## Limitations (Phase 8)

- **In-memory only** — data resets on page reload. Designed for practice, not persistence.
- **Single DB instance** — all practice cards share one in-memory DB. DML from one card affects another in the same session.
- **No stored procedures** — SQLite does not support CREATE PROCEDURE. Conceptual tasks use comment-only solutions.
- **FULL OUTER JOIN** — supported in sql.js 1.10+ (SQLite 3.39+); older builds may need the UNION ALL simulation shown in the FULL OUTER JOIN practice task.
- **Date functions** — use SQLite syntax: `strftime('%Y-%m', col)`, `julianday()`. PostgreSQL functions like `DATE_TRUNC` and `NOW()` are not available.

---

## Phase 9 plan (DuckDB)

When the course scales to larger datasets or analytics-focused tasks:

1. Replace `src/utils/sqlEngine.js` with a DuckDB-WASM provider behind the same `execQuery`/`validateAndCompare` API.
2. Serve DuckDB WASM assets with `Cross-Origin-Opener-Policy: same-origin` and `Cross-Origin-Embedder-Policy: require-corp` headers (required for SharedArrayBuffer).
3. Benefit: columnar storage, Parquet/CSV ingestion, PIVOT, UNNEST, and true analytical performance on large datasets.
