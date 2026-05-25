/**
 * SQL Lab 2.0 — Interactive SQL editor with schema browser, result grid,
 * mock execution engine, and interview-prep mode.
 */
import { memo, useState, useCallback, useEffect, useRef } from 'react';
import MonacoEditor from '@monaco-editor/react';
import { MOCK_DB } from '../../data/mockDatabase.js';
import { runMockSQL } from '../../utils/mockSqlRunner.js';

// ─── Monaco config ────────────────────────────────────────────────────────────

const MONACO_SQL_OPTS = {
  theme: 'vs-dark',
  language: 'sql',
  minimap: { enabled: false },
  fontSize: 13,
  fontFamily: '"Fira Code", "Cascadia Code", monospace',
  lineNumbers: 'on',
  scrollBeyondLastLine: false,
  automaticLayout: true,
  padding: { top: 10, bottom: 10 },
  wordWrap: 'on',
  renderLineHighlight: 'all',
  suggestOnTriggerCharacters: true,
  quickSuggestions: true,
};

// ─── Practice questions ───────────────────────────────────────────────────────

const QUESTIONS = [
  // ── BEGINNER ────────────────────────────────────────────────────────────────
  {
    id: 'q1', difficulty: 'beginner', title: 'Active Customers',
    prompt: 'Return customer_name and city for all customers with status "active".',
    hint1: 'Use SELECT with specific columns — not *',
    hint2: "Add WHERE status = 'active'",
    hint3: "SELECT customer_name, city FROM customers WHERE status = 'active'",
    validate: r => !r.error && !r.complex && r.rows?.length === 5,
    answer: "SELECT customer_name, city\nFROM customers\nWHERE status = 'active';",
    whyMatters: 'Filtering rows with WHERE is the most-used SQL operation in data engineering — every pipeline validation, every BI query, and every audit query uses WHERE. In production, a missing WHERE clause on a 500M row table triggers a full table scan and can cost hundreds of dollars in cloud warehouses.',
    wrongApproach: 'Beginners often write SELECT * — but in column-store databases (BigQuery, Redshift, Synapse), you are charged by bytes scanned per column. SELECT * on a wide table costs 10x more than selecting 3 needed columns.',
    optimizationNote: 'In Databricks/Spark, add a partition filter alongside the WHERE clause: WHERE status = \'active\' AND signup_date >= \'2024-01-01\'. Delta Lake will skip all partitions outside that date range — potentially scanning 1/365th of the data.',
  },
  {
    id: 'q2', difficulty: 'beginner', title: 'Orders by Status',
    prompt: 'Count the number of orders grouped by status. Alias the count as order_count.',
    hint1: 'Use GROUP BY on the status column',
    hint2: 'Use COUNT(*) as the aggregate',
    hint3: "SELECT status, COUNT(*) as order_count FROM orders GROUP BY status",
    validate: r => !r.error && !r.complex && r.rows?.length >= 2,
    answer: "SELECT status, COUNT(*) as order_count\nFROM orders\nGROUP BY status;",
    whyMatters: 'GROUP BY aggregations are the foundation of every data warehouse report. In production, the daily_orders_by_status table powering an executive dashboard is built exactly this way — just with a date dimension added.',
    wrongApproach: 'A common mistake is selecting columns not in GROUP BY — this throws an error in strict SQL engines. Every non-aggregate column in SELECT must appear in GROUP BY.',
    optimizationNote: 'In production, this query would run on a partitioned table with a date filter: WHERE order_date = CURRENT_DATE - 1. This turns a full-table scan into a single partition read.',
  },
  {
    id: 'q5', difficulty: 'beginner', title: 'Dallas Customers',
    prompt: "How many customers are from Dallas? Return a single number aliased as 'count'.",
    hint1: 'Use COUNT(*)',
    hint2: "WHERE city = 'Dallas'",
    hint3: "SELECT COUNT(*) as count FROM customers WHERE city = 'Dallas'",
    validate: r => !r.error && !r.complex && r.rows?.length === 1,
    answer: "SELECT COUNT(*) as count\nFROM customers\nWHERE city = 'Dallas';",
    whyMatters: 'Count-with-filter queries are used in data quality checks. A common pipeline validation: "Does the count of rows in the destination match the count in the source?" — this is exactly that pattern.',
    wrongApproach: 'Confusing COUNT(*) with COUNT(column): COUNT(city) would exclude NULL cities, while COUNT(*) counts all rows. In a data quality check, use COUNT(*) unless you specifically need to measure non-null completeness.',
    optimizationNote: 'In a data quality framework, you would parameterize the filter: SELECT COUNT(*) as count FROM customers WHERE {filter_column} = \'{filter_value}\'. This makes the check reusable across tables.',
  },
  {
    id: 'q9', difficulty: 'beginner', title: 'Education Products',
    prompt: "List all products in the 'Education' category. Return product_name and price, sorted by price ascending.",
    hint1: "WHERE category = 'Education'",
    hint2: 'ORDER BY price ASC',
    hint3: "SELECT product_name, price FROM products WHERE category = 'Education' ORDER BY price ASC",
    validate: r => !r.error && !r.complex && r.rows?.length === 4,
    answer: "SELECT product_name, price\nFROM products\nWHERE category = 'Education'\nORDER BY price ASC;",
    whyMatters: 'Filtering and sorting are used together to build ordered reports — top-10 products, cheapest items, most recent transactions. ORDER BY on a large table is expensive — it triggers a sort operation across all matching rows.',
    wrongApproach: 'ORDER BY in a subquery or CTE is usually redundant — the outer query\'s ORDER BY controls the final sort. Only add ORDER BY on the outermost query or when using LIMIT.',
    optimizationNote: 'If you frequently filter by category AND sort by price, a composite index (category, price) lets the database skip the sort step entirely — it just reads the pre-ordered index entries.',
  },
  {
    id: 'q10', difficulty: 'beginner', title: 'Failed Pipeline Runs',
    prompt: "Count how many pipeline runs had status 'failed'. Return a single value aliased as failed_count.",
    hint1: "WHERE status = 'failed'",
    hint2: 'Use COUNT(*)',
    hint3: "SELECT COUNT(*) as failed_count FROM pipeline_runs WHERE status = 'failed'",
    validate: r => !r.error && !r.complex && r.rows?.length === 1 && (r.rows[0]?.failed_count ?? r.rows[0]?.['count(*)']) === 2,
    answer: "SELECT COUNT(*) as failed_count\nFROM pipeline_runs\nWHERE status = 'failed';",
    whyMatters: 'This is a real production monitoring query. Data platform teams run this every morning: "How many pipelines failed last night?" In Airflow, you can run this directly against the metadata database to get a daily failure count.',
    wrongApproach: 'Using HAVING instead of WHERE here is a common mistake. HAVING filters groups after aggregation. WHERE filters rows before aggregation — always use WHERE for single-table row filtering.',
    optimizationNote: 'In production, extend this with a date filter: WHERE status = \'failed\' AND run_date = CURRENT_DATE - 1. Then compare failed_count > 0 as a pipeline health check in your monitoring system.',
  },
  // ── INTERMEDIATE ─────────────────────────────────────────────────────────────
  {
    id: 'q3', difficulty: 'intermediate', title: 'High-Value Orders',
    prompt: 'Find orders with amount greater than 100. Return order_id, customer_id, and amount. Sort by amount descending.',
    hint1: 'WHERE amount > 100',
    hint2: 'ORDER BY amount DESC',
    hint3: "SELECT order_id, customer_id, amount FROM orders WHERE amount > 100 ORDER BY amount DESC",
    validate: r => !r.error && !r.complex && r.rows?.length >= 5 && r.rows[0]?.amount >= (r.rows[1]?.amount ?? 0),
    answer: "SELECT order_id, customer_id, amount\nFROM orders\nWHERE amount > 100\nORDER BY amount DESC;",
    whyMatters: 'Range filters (>, <, BETWEEN) on numeric and date columns are the workhorses of business reporting. "Show me all transactions over $10,000" or "Show me orders in the last 30 days" are the same pattern.',
    wrongApproach: 'Using >= vs > matters for boundaries. WHERE amount > 100 excludes exactly 100. WHERE amount >= 100 includes it. Know which boundary your business rule requires — an off-by-one error in revenue reporting is a serious data quality issue.',
    optimizationNote: 'Combine with a date filter for incremental queries: WHERE amount > 100 AND created_at >= CURRENT_DATE - 7. This is the basis of a "high-value orders this week" KPI that refreshes daily.',
  },
  {
    id: 'q4', difficulty: 'intermediate', title: 'Category Revenue',
    prompt: 'Calculate total price per product category. Return category and total. Sort by total descending.',
    hint1: 'GROUP BY category',
    hint2: 'Use SUM(price) as total',
    hint3: "SELECT category, SUM(price) as total FROM products GROUP BY category ORDER BY total DESC",
    validate: r => !r.error && !r.complex && r.rows?.length >= 2,
    answer: "SELECT category, SUM(price) as total\nFROM products\nGROUP BY category\nORDER BY total DESC;",
    whyMatters: 'This is the template for every revenue-by-dimension report: revenue by region, revenue by product line, revenue by sales rep. In data warehouses, these become the Gold layer aggregation tables that Power BI and Tableau read directly.',
    wrongApproach: 'Applying SUM to a price column assumes prices are additive. If the table stores unit prices and you need revenue, you need SUM(price * quantity). Always verify what the column represents before aggregating.',
    optimizationNote: 'In a production Gold table, this GROUP BY runs incrementally: GROUP BY category, DATE_TRUNC(\'day\', created_at) — adding the date dimension enables time-series analysis. The Gold table is then Z-ORDERed on category and date for fast BI queries.',
  },
  {
    id: 'q7', difficulty: 'intermediate', title: 'Shipped Order Total',
    prompt: "Calculate the total amount of all 'shipped' orders.",
    hint1: "Filter WHERE status = 'shipped'",
    hint2: 'Use SUM(amount)',
    hint3: "SELECT SUM(amount) as total_shipped FROM orders WHERE status = 'shipped'",
    validate: r => !r.error && !r.complex && r.rows?.length === 1,
    answer: "SELECT SUM(amount) as total_shipped\nFROM orders\nWHERE status = 'shipped';",
    whyMatters: 'Aggregate with a status filter is the pattern behind every business KPI: shipped revenue, active user count, successful job throughput. The WHERE clause determines what counts — getting this wrong means wrong KPIs in dashboards.',
    wrongApproach: 'Using SUM on a nullable column returns NULL if all values are NULL. Use COALESCE(SUM(amount), 0) in production to handle edge cases where a time period has no matching rows.',
    optimizationNote: 'In dbt, this becomes a simple metric definition: metric(name: shipped_revenue, model: ref(\'orders\'), type: sum, expression: amount, filter: "status = \'shipped\'"). Metrics are then reusable across all reports without re-writing the SQL.',
  },
  {
    id: 'q11', difficulty: 'intermediate', title: 'Revenue per Pipeline',
    prompt: 'For each pipeline_name, find the total rows_processed across all successful runs. Return pipeline_name and total_rows. Sort by total_rows descending.',
    hint1: "WHERE status = 'success'",
    hint2: 'GROUP BY pipeline_name, then SUM(rows_processed)',
    hint3: "SELECT pipeline_name, SUM(rows_processed) as total_rows FROM pipeline_runs WHERE status = 'success' GROUP BY pipeline_name ORDER BY total_rows DESC",
    validate: r => !r.error && !r.complex && r.rows?.length >= 2,
    answer: "SELECT pipeline_name, SUM(rows_processed) as total_rows\nFROM pipeline_runs\nWHERE status = 'success'\nGROUP BY pipeline_name\nORDER BY total_rows DESC;",
    whyMatters: 'This is a real data platform operations query — pipeline throughput by name. In production, data platform teams build dashboards showing "which pipelines process the most rows?" to understand load distribution and identify bottlenecks.',
    wrongApproach: 'Including failed runs in the SUM would produce misleading throughput numbers (failed runs have 0 rows_processed). Always filter to relevant status values before aggregating operational metrics.',
    optimizationNote: 'Add AVG(duration_secs) to the same query to get both throughput and performance in one result. Compare rows_processed / duration_secs across pipelines to calculate processing efficiency (rows/second).',
  },
  {
    id: 'q12', difficulty: 'intermediate', title: 'Avg Salary by Department',
    prompt: 'Find the average salary per department. Return department and avg_salary. Sort alphabetically by department.',
    hint1: 'GROUP BY department',
    hint2: 'Use AVG(salary) as avg_salary',
    hint3: "SELECT department, AVG(salary) as avg_salary FROM employees GROUP BY department ORDER BY department ASC",
    validate: r => !r.error && !r.complex && r.rows?.length === 3,
    answer: "SELECT department, AVG(salary) as avg_salary\nFROM employees\nGROUP BY department\nORDER BY department ASC;",
    whyMatters: 'GROUP BY aggregations over HR or operational data are commonly used in data quality investigations — "Is the average salary by department reasonable?" is a sanity check that catches bad data imports.',
    wrongApproach: 'AVG ignores NULLs in most databases — if some salary values are NULL (e.g., contractors), the average is computed only over non-null rows. Check for NULLs first: SELECT department, COUNT(*) as total, COUNT(salary) as non_null_count FROM employees GROUP BY department.',
    optimizationNote: 'Combine with PERCENTILE_CONT(0.5) WITHIN GROUP (ORDER BY salary) to get median salary alongside the average — median is more informative than average when salaries are skewed.',
  },
  // ── ADVANCED ─────────────────────────────────────────────────────────────────
  {
    id: 'q6', difficulty: 'advanced', title: 'Most Expensive Product',
    prompt: 'Return the single most expensive product. Show product_name and price.',
    hint1: 'ORDER BY price DESC',
    hint2: 'LIMIT 1',
    hint3: "SELECT product_name, price FROM products ORDER BY price DESC LIMIT 1",
    validate: r => !r.error && !r.complex && r.rows?.length === 1 && r.rows[0]?.price === 149,
    answer: "SELECT product_name, price\nFROM products\nORDER BY price DESC\nLIMIT 1;",
    whyMatters: 'ORDER BY + LIMIT is used everywhere from "top 10 customers" to "most recent pipeline run". But in distributed systems (Spark/BigQuery), LIMIT does NOT reduce compute — the full sort still runs.',
    wrongApproach: 'If there are multiple products with the same max price, LIMIT 1 returns only one arbitrarily. Use MAX(price) in a subquery to return ALL products at the max price: WHERE price = (SELECT MAX(price) FROM products).',
    optimizationNote: 'For production "top N" patterns, use window functions: SELECT * FROM (SELECT *, RANK() OVER (ORDER BY price DESC) as rnk FROM products) WHERE rnk = 1. This correctly handles ties and is more expressive.',
  },
  {
    id: 'q8', difficulty: 'advanced', title: 'Avg Order Amount by Status',
    prompt: 'Find the average order amount for each status. Order by average descending.',
    hint1: 'GROUP BY status',
    hint2: 'Use AVG(amount)',
    hint3: "SELECT status, AVG(amount) as avg_amount FROM orders GROUP BY status ORDER BY avg_amount DESC",
    validate: r => !r.error && !r.complex && r.rows?.length >= 2,
    answer: "SELECT status, AVG(amount) as avg_amount\nFROM orders\nGROUP BY status\nORDER BY avg_amount DESC;",
    whyMatters: 'Comparing averages across categories reveals business patterns — if cancelled orders have a higher average amount, that\'s a revenue risk that needs investigation. This type of segmented analysis is central to data engineering work.',
    wrongApproach: 'Ordering by avg_amount alias in ORDER BY works in most modern databases, but in strict SQL (some versions of SQL Server) you may need to repeat: ORDER BY AVG(amount) DESC. Always test ORDER BY on the target database engine.',
    optimizationNote: 'Add COUNT(*) and STDDEV(amount) to the same query: SELECT status, COUNT(*) as n, AVG(amount) as avg, ROUND(STDDEV(amount), 2) as std. High standard deviation in a group means high variance — potentially a data quality signal.',
  },
  {
    id: 'q13', difficulty: 'advanced', title: 'Productive Pipelines Only',
    prompt: 'Find pipelines with more than 5 total runs. Return pipeline_name and run_count.',
    hint1: 'GROUP BY pipeline_name',
    hint2: 'Use HAVING COUNT(*) > 5',
    hint3: "SELECT pipeline_name, COUNT(*) as run_count FROM pipeline_runs GROUP BY pipeline_name HAVING COUNT(*) > 5",
    validate: r => !r.error && !r.complex && r.rows?.length >= 1,
    answer: "SELECT pipeline_name, COUNT(*) as run_count\nFROM pipeline_runs\nGROUP BY pipeline_name\nHAVING COUNT(*) > 5;",
    whyMatters: 'HAVING filters groups — it is the correct way to filter aggregated results. This pattern is used in data quality checks: "find tables with more than N duplicate records", "find pipelines with more than 3 failures this week".',
    wrongApproach: 'A classic mistake: putting the aggregate condition in WHERE instead of HAVING. WHERE COUNT(*) > 5 throws an error — aggregate functions cannot be used in WHERE because WHERE runs before GROUP BY.',
    optimizationNote: 'Combine WHERE and HAVING: WHERE run_date >= CURRENT_DATE - 30 (filter rows first, reducing GROUP BY input) HAVING COUNT(*) > 5 (filter groups after). Always push filters to WHERE when possible — it reduces the data that GROUP BY processes.',
  },
  {
    id: 'q14', difficulty: 'advanced', title: 'Top Engineers by Salary',
    prompt: "Find the top 3 highest-paid employees in the Engineering department. Return name and salary.",
    hint1: "WHERE department = 'Engineering'",
    hint2: 'ORDER BY salary DESC LIMIT 3',
    hint3: "SELECT name, salary FROM employees WHERE department = 'Engineering' ORDER BY salary DESC LIMIT 3",
    validate: r => !r.error && !r.complex && r.rows?.length === 3,
    answer: "SELECT name, salary\nFROM employees\nWHERE department = 'Engineering'\nORDER BY salary DESC\nLIMIT 3;",
    whyMatters: 'Top-N queries per department are common in reporting: top 3 sales reps per region, highest-latency pipelines per team, most expensive queries per user. The production version uses ROW_NUMBER() to handle ties and multiple departments at once.',
    wrongApproach: 'LIMIT does not guarantee deterministic results when rows are tied — two engineers with the same salary compete for the 3rd slot arbitrarily. Add a tiebreaker: ORDER BY salary DESC, employee_id ASC to get consistent results across runs.',
    optimizationNote: 'Production version using window functions (no LIMIT): SELECT name, salary FROM (SELECT name, salary, ROW_NUMBER() OVER (PARTITION BY department ORDER BY salary DESC) as rn FROM employees) WHERE rn <= 3. This scales to any number of departments without repeating the query.',
  },
  // ── JOIN challenges ──────────────────────────────────────────────────────────
  {
    id: 'q15', difficulty: 'advanced', title: 'Customer Orders (INNER JOIN)',
    prompt: 'Join customers and orders to return customer_name and amount for all orders. Sort by amount descending.',
    hint1: 'FROM customers INNER JOIN orders ON customers.customer_id = orders.customer_id',
    hint2: 'SELECT customers.customer_name, orders.amount',
    hint3: "SELECT customers.customer_name, orders.amount\nFROM customers\nINNER JOIN orders ON customers.customer_id = orders.customer_id\nORDER BY orders.amount DESC",
    validate: r => !r.error && r.rows?.length >= 5,
    answer: "SELECT customers.customer_name, orders.amount\nFROM customers\nINNER JOIN orders ON customers.customer_id = orders.customer_id\nORDER BY orders.amount DESC;",
    whyMatters: 'JOINs are the most common operation in data warehouse queries — combining a fact table (orders) with a dimension table (customers) is the star schema pattern. Every BI report that combines customer attributes with transaction data uses this.',
    wrongApproach: 'Forgetting the ON clause creates a Cartesian product — every row in customers joined to every row in orders. With 7 customers × 10 orders = 70 rows instead of 10. In production, this can generate billions of rows and crash the job.',
    optimizationNote: 'In Spark, if customers is small (< 10 MB), use a broadcast join: df_orders.join(broadcast(df_customers), "customer_id"). This sends a copy of customers to every executor, eliminating the shuffle of orders data across the network.',
  },
  {
    id: 'q16', difficulty: 'advanced', title: 'Customers Without Orders (LEFT JOIN)',
    prompt: 'Find customers who have never placed an order. Return customer_name. Use a LEFT JOIN.',
    hint1: 'FROM customers LEFT JOIN orders ON ...',
    hint2: 'WHERE orders.order_id IS NULL',
    hint3: "SELECT customers.customer_name\nFROM customers\nLEFT JOIN orders ON customers.customer_id = orders.customer_id\nWHERE orders.order_id IS NULL",
    validate: r => !r.error && r.rows?.length >= 1,
    answer: "SELECT customers.customer_name\nFROM customers\nLEFT JOIN orders ON customers.customer_id = orders.customer_id\nWHERE orders.order_id IS NULL;",
    whyMatters: 'LEFT JOIN + IS NULL is the standard pattern for "find records in A with no match in B" — inactive users, customers who haven\'t ordered, products never sold. In data quality work: "find orders with no matching customer record" catches referential integrity violations.',
    wrongApproach: 'Adding a WHERE filter on the right table (orders) after a LEFT JOIN converts it to an INNER JOIN — it removes the NULLs you were trying to find. Only filter on the right table with IS NULL (anti-join) or in the ON clause.',
    optimizationNote: 'Alternative using NOT EXISTS: SELECT customer_name FROM customers WHERE NOT EXISTS (SELECT 1 FROM orders WHERE orders.customer_id = customers.customer_id). NOT EXISTS often performs better than LEFT JOIN + IS NULL when the right table is large.',
  },
  {
    id: 'q17', difficulty: 'advanced', title: 'Total Revenue per Customer',
    prompt: 'Calculate total spending per customer. Join customers and orders. Return customer_name and total_spent. Sort by total_spent descending.',
    hint1: 'INNER JOIN customers and orders on customer_id',
    hint2: 'GROUP BY customers.customer_name, use SUM(orders.amount)',
    hint3: "SELECT customers.customer_name, SUM(orders.amount) as total_spent\nFROM customers\nINNER JOIN orders ON customers.customer_id = orders.customer_id\nGROUP BY customers.customer_name\nORDER BY total_spent DESC",
    validate: r => !r.error && r.rows?.length >= 3,
    answer: "SELECT customers.customer_name, SUM(orders.amount) as total_spent\nFROM customers\nINNER JOIN orders ON customers.customer_id = orders.customer_id\nGROUP BY customers.customer_name\nORDER BY total_spent DESC;",
    whyMatters: 'JOIN + GROUP BY + SUM is the core of customer revenue analysis — one of the most common patterns in analytics engineering. In production, this feeds the dim_customer Gold table with a total_lifetime_value column used for segmentation.',
    wrongApproach: 'GROUP BY customers.customer_name can produce incorrect results if two customers have the same name. GROUP BY customers.customer_id (the primary key) is correct — then include customer_name in the SELECT since it depends on customer_id.',
    optimizationNote: 'Production version adds time filtering: WHERE orders.created_at >= CURRENT_DATE - 365 for LTV over last 12 months. Also add COUNT(orders.order_id) as order_count alongside the SUM — frequency + monetary value together reveal high-value customer segments.',
  },
  // ── CTE / Window ─────────────────────────────────────────────────────────────
  {
    id: 'q18', difficulty: 'advanced', title: 'Running Total (Window Function)',
    prompt: 'Write a window function query to show each order with a running total of amount ordered by order_id. This uses window functions — run it and check the pattern.',
    hint1: 'SUM(amount) OVER (ORDER BY order_id)',
    hint2: 'Alias the running total as running_total',
    hint3: "SELECT order_id, amount,\n  SUM(amount) OVER (ORDER BY order_id) as running_total\nFROM orders\nORDER BY order_id",
    validate: r => !r.error,
    expectedOutput: [
      { order_id: 101, amount: 150,  running_total: 150  },
      { order_id: 102, amount:  89,  running_total: 239  },
      { order_id: 103, amount: 230,  running_total: 469  },
    ],
    answer: "SELECT order_id, amount,\n  SUM(amount) OVER (ORDER BY order_id) as running_total\nFROM orders\nORDER BY order_id;",
    whyMatters: 'Running totals are essential in financial reporting — cumulative revenue, cumulative shipped orders, running average. Window functions compute these without GROUP BY, so each individual row is preserved alongside the aggregate.',
    wrongApproach: 'Trying to compute a running total with a correlated subquery (SELECT SUM(amount) FROM orders WHERE order_id <= o.order_id) works but is O(n²) — extremely slow on large tables. Window functions are O(n log n) and are the correct production approach.',
    optimizationNote: 'Add PARTITION BY to reset the running total per customer: SUM(amount) OVER (PARTITION BY customer_id ORDER BY order_id). This gives each customer\'s running order total, which is used in customer lifetime value calculations.',
  },
  {
    id: 'q19', difficulty: 'advanced', title: 'Deduplicate with CTE',
    prompt: 'Write a CTE that deduplicates customers by city — keep only the customer with the highest customer_id per city. Return city and customer_name.',
    hint1: 'WITH deduped AS (SELECT *, ROW_NUMBER() OVER (PARTITION BY city ORDER BY customer_id DESC) as rn FROM customers)',
    hint2: 'SELECT city, customer_name FROM deduped WHERE rn = 1',
    hint3: "WITH deduped AS (\n  SELECT *, ROW_NUMBER() OVER (PARTITION BY city ORDER BY customer_id DESC) as rn\n  FROM customers\n)\nSELECT city, customer_name FROM deduped WHERE rn = 1",
    validate: r => !r.error,
    expectedOutput: [
      { city: 'Austin',  customer_name: 'Frank Chen'   },
      { city: 'Dallas',  customer_name: 'Eva Martinez'  },
      { city: 'Houston', customer_name: 'Grace Kim'     },
    ],
    answer: "WITH deduped AS (\n  SELECT *,\n    ROW_NUMBER() OVER (PARTITION BY city ORDER BY customer_id DESC) as rn\n  FROM customers\n)\nSELECT city, customer_name\nFROM deduped\nWHERE rn = 1;",
    whyMatters: 'Deduplication with ROW_NUMBER() is one of the most important production SQL patterns. Every pipeline that loads data incrementally must handle duplicates — late-arriving events, API retries, and reprocessing all create duplicate records.',
    wrongApproach: 'Using DISTINCT only works when all columns are identical. If two rows have the same key but different values (e.g., two records for the same customer with different addresses), DISTINCT keeps both. ROW_NUMBER is the correct pattern because you control which version to keep via ORDER BY.',
    optimizationNote: 'In Delta Lake: MERGE INTO target USING (SELECT *, ROW_NUMBER() OVER (PARTITION BY customer_id ORDER BY updated_at DESC) as rn FROM source) staged ON target.id = staged.id AND staged.rn = 1 WHEN MATCHED THEN UPDATE ... WHEN NOT MATCHED THEN INSERT. This deduplicates at write time, not query time.',
  },
];

const DIFF_STYLE = {
  beginner:     { bg: '#d1fae520', color: '#4ade80', border: '#16653040' },
  intermediate: { bg: '#fef3c720', color: '#fcd34d', border: '#92400e40' },
  advanced:     { bg: '#fee2e220', color: '#fca5a5', border: '#991b1b40' },
};

const COL_TYPES = {
  customer_id: 'INT PK', customer_name: 'VARCHAR', city: 'VARCHAR', status: 'VARCHAR', signup_date: 'DATE',
  order_id: 'INT PK', amount: 'DECIMAL', created_at: 'DATE',
  product_id: 'INT PK', product_name: 'VARCHAR', category: 'VARCHAR', price: 'DECIMAL', stock: 'INT',
  employee_id: 'INT PK', name: 'VARCHAR', department: 'VARCHAR', salary: 'DECIMAL', manager_id: 'INT FK',
  run_id: 'INT PK', pipeline_name: 'VARCHAR', rows_processed: 'INT', duration_secs: 'INT', run_date: 'DATE',
};

// ─── Schema Browser ───────────────────────────────────────────────────────────

function SchemaBrowser({ onInsertCol }) {
  const [expanded, setExpanded] = useState(new Set(['customers', 'orders']));

  function toggle(t) {
    setExpanded(prev => {
      const n = new Set(prev);
      n.has(t) ? n.delete(t) : n.add(t);
      return n;
    });
  }

  return (
    <div className="sqll-schema">
      <div className="sqll-schema-head">
        <span className="sqll-schema-label">Schema</span>
        <span className="sqll-schema-db">mock_db</span>
      </div>
      {Object.entries(MOCK_DB).map(([table, data]) => (
        <div key={table} className="sqll-table-group">
          <button type="button" className="sqll-table-btn" onClick={() => toggle(table)}>
            <span className="sqll-chevron">{expanded.has(table) ? '▾' : '▸'}</span>
            <span className="sqll-table-icon">◫</span>
            <span className="sqll-table-name">{table}</span>
            <span className="sqll-row-count">{data.rows.length}r</span>
          </button>
          {expanded.has(table) && (
            <div className="sqll-cols">
              {data.columns.map(col => (
                <button
                  key={col} type="button" className="sqll-col-btn"
                  onClick={() => onInsertCol(col)} title={`Insert ${col}`}
                >
                  <span className="sqll-col-dot">◦</span>
                  <span className="sqll-col-name">{col}</span>
                  <span className="sqll-col-type">{COL_TYPES[col] || 'TEXT'}</span>
                </button>
              ))}
            </div>
          )}
        </div>
      ))}
    </div>
  );
}

// ─── Result Grid ──────────────────────────────────────────────────────────────

function ResultGrid({ result, runMs, running }) {
  if (running) return (
    <div className="sqll-result-state">
      <span className="sqll-running-dot" />
      <span>Executing query…</span>
    </div>
  );
  if (!result) return (
    <div className="sqll-result-state sqll-result-state--empty">
      Run a query to see results — <kbd>Ctrl+Enter</kbd>
    </div>
  );
  if (result.error) return (
    <div className="sqll-result-error">
      <span className="sqll-error-icon">⚠</span>
      <span>{result.error}</span>
    </div>
  );
  if (result.complex) return (
    <div className="sqll-result-complex">
      <span className="sqll-complex-icon">◈</span>
      <div className="sqll-complex-body">
        <p className="sqll-complex-title">
          {result.feature === 'cte_window'
            ? 'CTE / Window Function — advanced query'
            : 'Complex query recognized'}
        </p>
        <p className="sqll-complex-sub">
          {result.feature === 'cte_window'
            ? 'CTEs and window functions run in the expected-output mode. Compare your logic against the expected results shown in the challenge panel.'
            : 'This query pattern is not fully supported by the mock engine. Check the expected output in the challenge panel for reference.'}
        </p>
        <span className="sqll-complex-badge">✓ Syntax accepted</span>
      </div>
    </div>
  );

  const { rows = [], columns = [], rowCount = 0 } = result;

  return (
    <div className="sqll-result">
      <div className="sqll-result-meta">
        <span className="sqll-result-count">↳ {rowCount} row{rowCount !== 1 ? 's' : ''}</span>
        {runMs > 0 && <span className="sqll-result-ms">{runMs}ms</span>}
        <span className="sqll-result-engine">mock_engine</span>
      </div>
      <div className="sqll-result-scroll">
        <table className="sqll-table">
          <thead>
            <tr>{columns.map(c => <th key={c}>{c}</th>)}</tr>
          </thead>
          <tbody>
            {rows.map((row, i) => (
              <tr key={i}>
                {columns.map(c => (
                  <td key={c}>
                    {row[c] == null
                      ? <span className="sqll-null">NULL</span>
                      : String(row[c])}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// ─── Question Panel ───────────────────────────────────────────────────────────

function QuestionPanel({ question, hintsShown, onShowHint, result, onScore, score }) {
  const ds = DIFF_STYLE[question.difficulty] || DIFF_STYLE.intermediate;
  const passed = question.validate?.(result ?? {});
  const [showContext, setShowContext] = useState(false);

  return (
    <div className="sqll-qpanel">
      <div className="sqll-qpanel-head">
        <span className="sqll-qpanel-label">Question</span>
        <span className="sqll-qdiff" style={{ background: ds.bg, color: ds.color, border: `1px solid ${ds.border}` }}>
          {question.difficulty}
        </span>
      </div>
      <h3 className="sqll-qtitle">{question.title}</h3>
      <p className="sqll-qprompt">{question.prompt}</p>

      <div className="sqll-hints">
        {[1, 2, 3].map(lvl => (
          <button
            key={lvl}
            type="button"
            className={`sqll-hint-btn${hintsShown >= lvl ? ' sqll-hint-btn--on' : ''}`}
            onClick={() => onShowHint(lvl)}
            disabled={hintsShown >= lvl}
          >
            {hintsShown >= lvl ? `✓ Hint ${lvl}` : `Hint ${lvl}`}
          </button>
        ))}
      </div>
      {hintsShown >= 1 && <div className="sqll-hint sqll-hint--1">{question.hint1}</div>}
      {hintsShown >= 2 && <div className="sqll-hint sqll-hint--2">{question.hint2}</div>}
      {hintsShown >= 3 && <div className="sqll-hint sqll-hint--3">{question.hint3}</div>}

      {result && !result.error && (
        <div className={`sqll-validate ${passed ? 'sqll-validate--pass' : (result.complex ? 'sqll-validate--complex' : 'sqll-validate--fail')}`}>
          {result.complex
            ? '◈ Advanced query — check expected output below'
            : passed
              ? '✓ Output matches expected'
              : '✗ Output mismatch — recheck your query'}
        </div>
      )}

      {question.expectedOutput && (
        <div className="sqll-expected-output">
          <span className="sqll-expected-label">Expected output (first 3 rows)</span>
          <div className="sqll-expected-table-wrap">
            <table className="sqll-expected-table">
              <thead>
                <tr>{Object.keys(question.expectedOutput[0]).map(k => <th key={k}>{k}</th>)}</tr>
              </thead>
              <tbody>
                {question.expectedOutput.map((row, i) => (
                  <tr key={i}>
                    {Object.values(row).map((v, j) => <td key={j}>{v}</td>)}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {result && !score && (
        <div className="sqll-self-score">
          <p className="sqll-self-label">Self-assessment</p>
          <div className="sqll-score-btns">
            <button type="button" className="sqll-score-btn sqll-score-btn--miss" onClick={() => onScore('miss')}>✗ Missed</button>
            <button type="button" className="sqll-score-btn sqll-score-btn--almost" onClick={() => onScore('almost')}>~ Almost</button>
            <button type="button" className="sqll-score-btn sqll-score-btn--got" onClick={() => onScore('got')}>✓ Got it</button>
          </div>
        </div>
      )}
      {score && (
        <div className={`sqll-score-result sqll-score-result--${score}`}>
          {score === 'got' ? '✓ Solved' : score === 'almost' ? '~ Almost — review the answer' : '✗ Missed — study the approach'}
        </div>
      )}

      {(question.whyMatters || question.wrongApproach || question.optimizationNote) && (
        <div className="sqll-eng-context">
          <button
            type="button"
            className={`sqll-eng-toggle${showContext ? ' sqll-eng-toggle--open' : ''}`}
            onClick={() => setShowContext(v => !v)}
          >
            <span className="sqll-eng-toggle-icon">{showContext ? '▾' : '▸'}</span>
            Engineering Context
          </button>
          {showContext && (
            <div className="sqll-eng-body">
              {question.whyMatters && (
                <div className="sqll-eng-block sqll-eng-block--why">
                  <span className="sqll-eng-label">Why this matters</span>
                  <p>{question.whyMatters}</p>
                </div>
              )}
              {question.wrongApproach && (
                <div className="sqll-eng-block sqll-eng-block--wrong">
                  <span className="sqll-eng-label">Common mistake</span>
                  <p>{question.wrongApproach}</p>
                </div>
              )}
              {question.optimizationNote && (
                <div className="sqll-eng-block sqll-eng-block--opt">
                  <span className="sqll-eng-label">Production optimization</span>
                  <p>{question.optimizationNote}</p>
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// ─── SQLLab ───────────────────────────────────────────────────────────────────

const SQLLab = memo(function SQLLab() {
  const [mode, setMode]       = useState('practice');
  const [sql, setSql]         = useState("-- Welcome to SQL Lab\n-- Press Ctrl+Enter (Cmd+Enter on Mac) to run\n\nSELECT *\nFROM customers\nLIMIT 5;");
  const [result, setResult]   = useState(null);
  const [running, setRunning] = useState(false);
  const [runMs, setRunMs]     = useState(0);

  // Interview state
  const [qIdx, setQIdx]           = useState(0);
  const [hintsShown, setHintsShown] = useState(0);
  const [scores, setScores]       = useState([]);
  const [done, setDone]           = useState(false);

  const editorRef    = useRef(null);
  const handleRunRef = useRef(null);

  const handleRun = useCallback(() => {
    const query = editorRef.current?.getValue() ?? sql;
    if (!query.trim()) return;
    setRunning(true);
    setResult(null);
    const t0 = Date.now();
    setTimeout(() => {
      setResult(runMockSQL(query));
      setRunMs(Date.now() - t0);
      setRunning(false);
    }, 350 + Math.floor(Math.random() * 450));
  }, [sql]);

  useEffect(() => {
    handleRunRef.current = handleRun;
  }, [handleRun]);

  const handleMount = useCallback((editor, monaco) => {
    editorRef.current = editor;
    editor.addCommand(monaco.KeyMod.CtrlCmd | monaco.KeyCode.Enter, () => handleRunRef.current?.());
  }, []);

  function insertCol(col) {
    const editor = editorRef.current;
    if (!editor) return;
    const pos = editor.getPosition();
    editor.executeEdits('', [{
      range: { startLineNumber: pos.lineNumber, startColumn: pos.column, endLineNumber: pos.lineNumber, endColumn: pos.column },
      text: col,
    }]);
    editor.focus();
  }

  function handleScore(s) {
    const next = [...scores, s];
    setScores(next);
    if (qIdx + 1 >= QUESTIONS.length) {
      setDone(true);
    } else {
      setQIdx(i => i + 1);
      setHintsShown(0);
      setResult(null);
      editorRef.current?.setValue('-- Write your SQL here\n');
    }
  }

  function resetInterview() {
    setQIdx(0); setScores([]); setHintsShown(0); setResult(null); setDone(false);
    editorRef.current?.setValue('-- Write your SQL here\n');
  }

  function switchMode(m) {
    setMode(m);
    setResult(null);
    if (m === 'interview') resetInterview();
    else {
      editorRef.current?.setValue("SELECT *\nFROM customers\nLIMIT 5;");
    }
  }

  const isInterview = mode === 'interview';

  // ── Interview completion ──────────────────────────────────────────────────
  if (isInterview && done) {
    const got = scores.filter(s => s === 'got').length;
    const pct = Math.round((got / QUESTIONS.length) * 100);
    return (
      <section className="section" id="sql-lab">
        <div className="sqll-header">
          <div><p className="eyebrow">SQL Lab</p><h2>Session Complete</h2></div>
        </div>
        <div className="sqll-done">
          <div className="sqll-done-score">
            <span className="sqll-done-pct">{pct}%</span>
            <span className="sqll-done-sub">{got} / {QUESTIONS.length} correct</span>
          </div>
          <p className="sqll-done-msg">
            {pct >= 80
              ? '✦ SQL Interview-Ready — you handled aggregations, filters, and ordering with confidence.'
              : pct >= 60
              ? '◈ Good foundation — review GROUP BY, aggregation patterns, and ORDER BY.'
              : '◎ Keep practising — focus on SELECT, WHERE, GROUP BY, and ORDER BY fundamentals.'}
          </p>
          <div className="sqll-done-list">
            {QUESTIONS.map((q, i) => (
              <div key={q.id} className={`sqll-done-row sqll-done-row--${scores[i] ?? 'skip'}`}>
                <span className="sqll-done-icon">{scores[i] === 'got' ? '✓' : scores[i] === 'almost' ? '~' : '✗'}</span>
                <span className="sqll-done-title">{q.title}</span>
                <span className="sqll-done-diff">{q.difficulty}</span>
              </div>
            ))}
          </div>
          <div style={{ display: 'flex', gap: 8 }}>
            <button type="button" className="secondary-button" onClick={resetInterview}>↺ Retry session</button>
            <button type="button" className="secondary-button" onClick={() => switchMode('practice')}>Open free SQL lab</button>
          </div>
        </div>
      </section>
    );
  }

  // ── Main workspace ────────────────────────────────────────────────────────
  return (
    <section className="section" id="sql-lab">
      {/* Header bar */}
      <div className="sqll-header">
        <div>
          <p className="eyebrow">Interactive</p>
          <h2>SQL Lab</h2>
        </div>
        <div className="sqll-modes">
          {[
            { id: 'practice',  label: '◎ Practice'  },
            { id: 'interview', label: '⏱ Interview' },
          ].map(m => (
            <button
              key={m.id}
              type="button"
              className={`sqll-mode-btn${mode === m.id ? ' sqll-mode-btn--on' : ''}`}
              onClick={() => switchMode(m.id)}
            >
              {m.label}
            </button>
          ))}
        </div>
        <div className="sqll-meta">
          <span className="sqll-chip sqll-chip--db">mock_db</span>
          <span className="sqll-chip">{Object.keys(MOCK_DB).length} tables</span>
          <span className="sqll-chip sqll-chip--live">● LIVE ENGINE</span>
        </div>
      </div>

      {/* Purpose card */}
      {!isInterview && (
        <div className="lab-purpose-card">
          <div className="lab-purpose-header">
            <span className="lab-purpose-icon">🔷</span>
            <div>
              <div className="lab-purpose-title">SQL Analytics Lab</div>
              <div style={{ fontSize: '0.85rem', color: 'var(--muted)', marginTop: 2 }}>
                Estimated time: 20–60 min per challenge
              </div>
            </div>
          </div>
          <strong style={{ fontSize: '0.85rem', color: 'var(--heading)' }}>What you will practice:</strong>
          <ul style={{ margin: '8px 0 12px', paddingLeft: 18, fontSize: '0.875rem', color: 'var(--text)' }}>
            <li>Complex queries — GROUP BY, aggregations, ORDER BY, LIMIT</li>
            <li>Window functions and query optimisation techniques</li>
            <li>Interview-style timed SQL challenges with self-assessment</li>
          </ul>
          <div className="lab-skills-row">
            {['SQL', 'Query Planning', 'Performance Tuning', 'Analytics'].map(s => (
              <span key={s} className="lab-skill-badge">{s}</span>
            ))}
          </div>
        </div>
      )}

      {/* Interview progress bar */}
      {isInterview && !done && (
        <div className="sqll-progress">
          <div className="sqll-progress-bar">
            <div className="sqll-progress-fill" style={{ width: `${(qIdx / QUESTIONS.length) * 100}%` }} />
          </div>
          <span className="sqll-progress-label">Q{qIdx + 1} / {QUESTIONS.length}</span>
          {scores.filter(s => s === 'got').length > 0 && (
            <span className="sqll-progress-score">✓ {scores.filter(s => s === 'got').length} solved</span>
          )}
        </div>
      )}

      {/* Workspace grid */}
      <div className={`sqll-workspace${isInterview ? ' sqll-workspace--interview' : ''}`}>
        <SchemaBrowser onInsertCol={insertCol} />

        {/* Editor + Results */}
        <div className="sqll-editor-col">
          <div className="sqll-toolbar">
            <span className="sqll-file">query.sql</span>
            <span className="sqll-kbd-hint">⌃↵ / ⌘↵ to run</span>
            <button
              type="button"
              className={`sqll-run-btn${running ? ' sqll-run-btn--busy' : ''}`}
              onClick={handleRun}
              disabled={running}
            >
              {running ? '⟳  Running…' : '▶  Run'}
            </button>
            <button
              type="button"
              className="sqll-clear-btn"
              onClick={() => { setResult(null); editorRef.current?.setValue(''); }}
            >
              Clear
            </button>
          </div>
          <div className="sqll-monaco">
            <MonacoEditor
              height="220px"
              defaultLanguage="sql"
              value={sql}
              onChange={v => setSql(v ?? '')}
              onMount={handleMount}
              options={MONACO_SQL_OPTS}
            />
          </div>
          <ResultGrid result={result} runMs={runMs} running={running} />
        </div>

        {/* Question panel — interview mode only */}
        {isInterview && !done && (
          <QuestionPanel
            question={QUESTIONS[qIdx]}
            hintsShown={hintsShown}
            onShowHint={lvl => setHintsShown(l => Math.max(l, lvl))}
            result={result}
            onScore={handleScore}
            score={scores[qIdx]}
          />
        )}
      </div>
    </section>
  );
});

export default SQLLab;
