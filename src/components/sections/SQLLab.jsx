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
    validate: r => !r.error && !r.complex && r.rows?.length === 3,
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
    validate: r => !r.error && !r.complex && r.rows?.length === 1 && (r.rows[0]?.count ?? r.rows[0]?.['count(*)']) === 2,
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
    validate: r => !r.error && !r.complex && r.rows?.length === 4 && r.rows[0]?.price <= r.rows[1]?.price,
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
    validate: r => !r.error && !r.complex && r.rows?.length === 6 && r.rows[0]?.amount >= (r.rows[1]?.amount ?? 0),
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
    validate: r => !r.error && !r.complex && r.rows?.length === 3,
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
    validate: r => !r.error && !r.complex && r.rows?.length === 1 && (r.rows[0]?.total_shipped ?? r.rows[0]?.['sum(amount)']) === 1485,
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
    validate: r => !r.error && !r.complex && r.rows?.length === 3,
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
  {
    id: 'q13', difficulty: 'intermediate', title: 'Productive Pipelines Only',
    prompt: 'Find pipelines with more than 2 total runs. Return pipeline_name and run_count.',
    hint1: 'GROUP BY pipeline_name',
    hint2: 'Use HAVING COUNT(*) > 2',
    hint3: "SELECT pipeline_name, COUNT(*) as run_count FROM pipeline_runs GROUP BY pipeline_name HAVING COUNT(*) > 2",
    validate: r => !r.error && !r.complex && r.rows?.length === 2,
    answer: "SELECT pipeline_name, COUNT(*) as run_count\nFROM pipeline_runs\nGROUP BY pipeline_name\nHAVING COUNT(*) > 2;",
    whyMatters: 'HAVING filters groups — it is the correct way to filter aggregated results. This pattern is used in data quality checks: "find tables with more than N duplicate records", "find pipelines with more than 3 failures this week".',
    wrongApproach: 'A classic mistake: putting the aggregate condition in WHERE instead of HAVING. WHERE COUNT(*) > 2 throws an error — aggregate functions cannot be used in WHERE because WHERE runs before GROUP BY.',
    optimizationNote: 'Combine WHERE and HAVING: WHERE run_date >= CURRENT_DATE - 30 (filter rows first, reducing GROUP BY input) HAVING COUNT(*) > 2 (filter groups after). Always push filters to WHERE when possible — it reduces the data that GROUP BY processes.',
  },
  {
    id: 'q20', difficulty: 'intermediate', title: 'Low Stock Alert',
    prompt: 'Find all products with stock under 100. Return product_name, category, price, and stock. Sort by stock ascending.',
    hint1: 'WHERE stock < 100',
    hint2: 'ORDER BY stock ASC',
    hint3: "SELECT product_name, category, price, stock FROM products WHERE stock < 100 ORDER BY stock ASC",
    validate: r => !r.error && !r.complex && r.rows?.length === 3 && r.rows[0]?.stock === 50,
    answer: "SELECT product_name, category, price, stock\nFROM products\nWHERE stock < 100\nORDER BY stock ASC;",
    whyMatters: 'Threshold alerts are a core DE responsibility — data quality checks, SLA breach detection, and pipeline health monitoring all use WHERE < threshold. In production, this query would feed a Slack/PagerDuty alert: "3 products need restocking."',
    wrongApproach: 'Using <= 100 instead of < 100 changes the boundary — it would include items with exactly 100 stock. In SLA monitoring, an off-by-one error on a threshold check can generate false alerts. Know your business rule precisely.',
    optimizationNote: 'In production, combine with a subquery or CTE to rank by urgency: RANK() OVER (PARTITION BY category ORDER BY stock ASC). This surfaces the lowest-stock item per category rather than a flat list — more actionable for the ops team.',
  },
  {
    id: 'q21', difficulty: 'intermediate', title: 'Price Range Filter',
    prompt: 'Find all products priced between 79 and 129 (inclusive). Return product_name, category, and price. Sort by price ascending.',
    hint1: 'WHERE price BETWEEN 79 AND 129',
    hint2: 'ORDER BY price ASC',
    hint3: "SELECT product_name, category, price FROM products WHERE price BETWEEN 79 AND 129 ORDER BY price ASC",
    validate: r => !r.error && !r.complex && r.rows?.length === 4,
    answer: "SELECT product_name, category, price\nFROM products\nWHERE price BETWEEN 79 AND 129\nORDER BY price ASC;",
    whyMatters: 'BETWEEN is used for date range filtering in incremental ETL — the most common pattern in production pipelines: WHERE load_date BETWEEN start_date AND end_date. It\'s also used for bucketing records into tiers (e.g., price bands for reporting).',
    wrongApproach: 'BETWEEN is inclusive on both ends (equivalent to >= 79 AND <= 129). A common mistake is assuming it\'s exclusive. In incremental loads, this means WHERE event_date BETWEEN yesterday AND today would include both boundaries — make sure your watermark logic accounts for overlap.',
    optimizationNote: 'BETWEEN on a date column benefits heavily from table partitioning — if the table is partitioned by year/month, WHERE created_at BETWEEN \'2024-01-01\' AND \'2024-01-31\' reads only the January partition, skipping the rest of the table entirely.',
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
    validate: r => !r.error && !r.complex && r.rows?.length === 3,
    answer: "SELECT status, AVG(amount) as avg_amount\nFROM orders\nGROUP BY status\nORDER BY avg_amount DESC;",
    whyMatters: 'Comparing averages across categories reveals business patterns — if cancelled orders have a higher average amount, that\'s a revenue risk that needs investigation. This type of segmented analysis is central to data engineering work.',
    wrongApproach: 'Ordering by avg_amount alias in ORDER BY works in most modern databases, but in strict SQL (some versions of SQL Server) you may need to repeat: ORDER BY AVG(amount) DESC. Always test ORDER BY on the target database engine.',
    optimizationNote: 'Add COUNT(*) and STDDEV(amount) to the same query: SELECT status, COUNT(*) as n, AVG(amount) as avg, ROUND(STDDEV(amount), 2) as std. High standard deviation in a group means high variance — potentially a data quality signal.',
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
    validate: r => !r.error && r.rows?.length === 10,
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
    validate: r => !r.error && r.rows?.length === 1,
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
    validate: r => !r.error && r.rows?.length === 6 && r.rows[0]?.total_spent >= (r.rows[1]?.total_spent ?? 0),
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
  // ── JOIN + GROUP BY ──────────────────────────────────────────────────────────
  {
    id: 'q22', difficulty: 'advanced', title: 'Austin Customer Spend',
    prompt: 'Find the total order spend per customer, but only for customers from Austin. Return customer_name and total_spent. Sort by total_spent descending.',
    hint1: 'INNER JOIN customers and orders on customer_id',
    hint2: "WHERE customers.city = 'Austin'",
    hint3: "SELECT customers.customer_name, SUM(orders.amount) as total_spent\nFROM customers\nINNER JOIN orders ON customers.customer_id = orders.customer_id\nWHERE customers.city = 'Austin'\nGROUP BY customers.customer_name\nORDER BY total_spent DESC",
    validate: r => !r.error && r.rows?.length === 2 && r.rows[0]?.total_spent === 475,
    answer: "SELECT customers.customer_name, SUM(orders.amount) as total_spent\nFROM customers\nINNER JOIN orders ON customers.customer_id = orders.customer_id\nWHERE customers.city = 'Austin'\nGROUP BY customers.customer_name\nORDER BY total_spent DESC;",
    whyMatters: 'JOIN + WHERE + GROUP BY is the most common multi-step pattern in analytics engineering: start with the dimension filter (city = Austin), join to the fact table, aggregate. This pattern builds every segmented revenue metric: revenue by region, by channel, by cohort.',
    wrongApproach: 'Filtering in WHERE vs ON changes what rows are included. WHERE customers.city = \'Austin\' filters AFTER the join — correct here. Putting the filter in the ON clause ON customers.customer_id = orders.customer_id AND customers.city = \'Austin\' gives the same result for INNER JOIN but different results for LEFT JOIN. Know the difference.',
    optimizationNote: 'In Databricks, push the city filter to a pre-join filter: customers_filtered = customers.filter(city=\'Austin\'). With Delta Lake Z-ORDER on city, this scan is sub-second. Then broadcast join the filtered customers (< 1K rows) to orders (millions of rows) for maximum efficiency.',
  },
  {
    id: 'q23', difficulty: 'advanced', title: 'Products with Multiple Category Metrics',
    prompt: 'For each product category, show the count of products, the average price (avg_price), and the minimum stock (min_stock). Sort by avg_price descending.',
    hint1: 'GROUP BY category',
    hint2: 'Use COUNT(*), AVG(price), MIN(stock)',
    hint3: "SELECT category, COUNT(*) as product_count, AVG(price) as avg_price, MIN(stock) as min_stock\nFROM products\nGROUP BY category\nORDER BY avg_price DESC",
    validate: r => !r.error && !r.complex && r.rows?.length === 3,
    answer: "SELECT category, COUNT(*) as product_count,\n  AVG(price) as avg_price,\n  MIN(stock) as min_stock\nFROM products\nGROUP BY category\nORDER BY avg_price DESC;",
    whyMatters: 'Multiple aggregates in a single GROUP BY are how data profiling works — you get completeness (count), typical value (avg), and edge case (min/max) in one pass. In production, this runs as part of a data quality dashboard: "Profile each product category" returns count, avg, min, max, stddev for every metric column.',
    wrongApproach: 'Running four separate queries (one per aggregate) instead of combining them is inefficient — it reads the table four times. Always combine aggregates in one GROUP BY. In Spark, this is even more important: a single aggregation across partitions vs four separate jobs.',
    optimizationNote: 'Extend with STDDEV(price) to detect high price variance within a category — a high standard deviation signals inconsistent pricing that may need investigation. Adding PERCENTILE_CONT(0.5) WITHIN GROUP (ORDER BY price) as median_price alongside AVG gives a complete distribution picture.',
  },
  // ── WINDOW FUNCTIONS ─────────────────────────────────────────────────────────
  {
    id: 'q24', difficulty: 'advanced', title: 'LAG: Track Pipeline Row Counts',
    prompt: 'For each successful pipeline run, show the rows_processed alongside the previous run\'s rows_processed (named prev_rows). Partition by pipeline_name, order by run_id. This uses window functions — compare your logic against the expected output.',
    hint1: "LAG(rows_processed) OVER (PARTITION BY pipeline_name ORDER BY run_id)",
    hint2: "WHERE status = 'success'",
    hint3: "SELECT run_id, pipeline_name, rows_processed,\n  LAG(rows_processed) OVER (PARTITION BY pipeline_name ORDER BY run_id) as prev_rows\nFROM pipeline_runs\nWHERE status = 'success'\nORDER BY pipeline_name, run_id",
    validate: r => !r.error,
    expectedOutput: [
      { run_id: 1,  pipeline_name: 'orders_etl',     rows_processed: 15420, prev_rows: null  },
      { run_id: 5,  pipeline_name: 'orders_etl',     rows_processed: 16001, prev_rows: 15420 },
      { run_id: 8,  pipeline_name: 'orders_etl',     rows_processed: 14900, prev_rows: 16001 },
      { run_id: 10, pipeline_name: 'orders_etl',     rows_processed: 17200, prev_rows: 14900 },
      { run_id: 2,  pipeline_name: 'customers_sync', rows_processed:  3201, prev_rows: null  },
      { run_id: 9,  pipeline_name: 'customers_sync', rows_processed:  3300, prev_rows:  3201 },
    ],
    answer: "SELECT run_id, pipeline_name, rows_processed,\n  LAG(rows_processed) OVER (\n    PARTITION BY pipeline_name\n    ORDER BY run_id\n  ) AS prev_rows\nFROM pipeline_runs\nWHERE status = 'success'\nORDER BY pipeline_name, run_id;",
    whyMatters: 'LAG is the go-to function for detecting anomalies in sequential data — comparing each pipeline run to the previous one catches sudden drops in throughput. In production, this feeds a monitoring query: "Alert if rows_processed < LAG(rows_processed) * 0.8" — a 20% drop flags a potential upstream data issue.',
    wrongApproach: 'Using a correlated subquery to get the previous row — SELECT (SELECT rows_processed FROM pipeline_runs p2 WHERE p2.run_id < p1.run_id ORDER BY run_id DESC LIMIT 1) — works but is O(n²). LAG is an O(n) single-pass operation. Never use correlated subqueries where window functions will do.',
    optimizationNote: 'In Databricks/Spark, window functions require a shuffle step. Reduce the data first with WHERE status = \'success\' before applying the window — this cuts the shuffle size. Use spark.conf.set("spark.sql.shuffle.partitions", "8") for small datasets to avoid the default 200-partition overhead.',
  },
  {
    id: 'q25', difficulty: 'advanced', title: 'RANK: Salary Ranking by Department',
    prompt: 'Rank each employee by salary within their department. Return name, department, salary, and salary_rank (1 = highest). Use RANK(). This uses window functions — compare your logic against the expected output.',
    hint1: "RANK() OVER (PARTITION BY department ORDER BY salary DESC)",
    hint2: "ORDER BY department, salary_rank",
    hint3: "SELECT name, department, salary,\n  RANK() OVER (PARTITION BY department ORDER BY salary DESC) as salary_rank\nFROM employees\nORDER BY department, salary_rank",
    validate: r => !r.error,
    expectedOutput: [
      { name: 'Lisa Chen',    department: 'Analytics',   salary: 105000, salary_rank: 1 },
      { name: 'Chris Murphy', department: 'Analytics',   salary:  92000, salary_rank: 2 },
      { name: 'Maria Santos', department: 'Data',        salary: 110000, salary_rank: 1 },
      { name: 'Tom Bradley',  department: 'Data',        salary:  88000, salary_rank: 2 },
      { name: 'Derek Wilson', department: 'Data',        salary:  78000, salary_rank: 3 },
      { name: 'Sarah Wong',   department: 'Engineering', salary: 120000, salary_rank: 1 },
      { name: 'Priya Patel',  department: 'Engineering', salary: 115000, salary_rank: 2 },
      { name: 'James Park',   department: 'Engineering', salary:  95000, salary_rank: 3 },
    ],
    answer: "SELECT name, department, salary,\n  RANK() OVER (\n    PARTITION BY department\n    ORDER BY salary DESC\n  ) AS salary_rank\nFROM employees\nORDER BY department, salary_rank;",
    whyMatters: 'RANK() within a PARTITION is one of the most common DE interview questions. In production, it\'s used for: finding the top N performers per region, identifying the highest-cost pipeline per team, and building compensation band reports. PARTITION BY is the key — it resets the rank for each group.',
    wrongApproach: 'RANK() vs DENSE_RANK(): if two employees tie at rank 2, RANK() skips rank 3 (next rank is 4), DENSE_RANK() does not (next rank is 3). In HR reporting, DENSE_RANK is usually correct — ties shouldn\'t create gaps in the band numbering. Know which one your use case requires.',
    optimizationNote: 'In Spark, RANK() triggers a full shuffle to sort rows per partition. If you only need the top-1 per department (not the full ranking), use first()/last() over an aggregated DataFrame — much cheaper than a full window sort.',
  },
  {
    id: 'q26', difficulty: 'advanced', title: 'ROW_NUMBER: Latest Run per Pipeline',
    prompt: 'Use a CTE with ROW_NUMBER to find the most recent run per pipeline (highest run_id = most recent). Return pipeline_name, status, rows_processed, and run_date for only the latest run of each pipeline. This uses CTEs — compare your logic against the expected output.',
    hint1: "WITH latest AS (SELECT *, ROW_NUMBER() OVER (PARTITION BY pipeline_name ORDER BY run_id DESC) as rn FROM pipeline_runs)",
    hint2: "SELECT ... FROM latest WHERE rn = 1",
    hint3: "WITH latest AS (\n  SELECT *,\n    ROW_NUMBER() OVER (PARTITION BY pipeline_name ORDER BY run_id DESC) as rn\n  FROM pipeline_runs\n)\nSELECT pipeline_name, status, rows_processed, run_date\nFROM latest\nWHERE rn = 1\nORDER BY pipeline_name",
    validate: r => !r.error,
    expectedOutput: [
      { pipeline_name: 'customers_sync', status: 'success', rows_processed: 3300,  run_date: '2024-01-19' },
      { pipeline_name: 'orders_etl',     status: 'success', rows_processed: 17200, run_date: '2024-01-19' },
      { pipeline_name: 'products_load',  status: 'success', rows_processed: 851,   run_date: '2024-01-18' },
    ],
    answer: "WITH latest AS (\n  SELECT *,\n    ROW_NUMBER() OVER (\n      PARTITION BY pipeline_name\n      ORDER BY run_id DESC\n    ) AS rn\n  FROM pipeline_runs\n)\nSELECT pipeline_name, status, rows_processed, run_date\nFROM latest\nWHERE rn = 1\nORDER BY pipeline_name;",
    whyMatters: 'CTE + ROW_NUMBER to get the latest record per group is the most commonly used DE SQL pattern. It powers: "Show the current status of each pipeline", "Get the most recent snapshot per customer", "Find the latest price per product". Every data platform has dozens of queries following this exact structure.',
    wrongApproach: 'Using MAX(run_id) with GROUP BY and then rejoining is correct but verbose: SELECT p.* FROM pipeline_runs p INNER JOIN (SELECT pipeline_name, MAX(run_id) as max_id FROM pipeline_runs GROUP BY pipeline_name) latest ON p.pipeline_name = latest.pipeline_name AND p.run_id = latest.max_id. The ROW_NUMBER CTE pattern is cleaner and extends naturally to top-N (WHERE rn <= 3).',
    optimizationNote: 'In Delta Lake, add a QUALIFY clause instead of wrapping in a CTE: SELECT *, ROW_NUMBER() OVER (...) as rn FROM pipeline_runs QUALIFY rn = 1. Supported in Databricks SQL — eliminates the CTE wrapper, simpler to read and often better optimized by the Photon engine.',
  },
  {
    id: 'q27', difficulty: 'advanced', title: 'CASE WHEN: Pipeline Health Classification',
    prompt: 'For each pipeline, show total_runs, success_count, failure_count, and a health_status column: "Healthy" if success rate >= 80%, "At Risk" otherwise. Use CASE WHEN with conditional aggregation. This is a complex query — compare your logic against the expected output.',
    hint1: "SUM(CASE WHEN status = 'success' THEN 1 ELSE 0 END) as success_count",
    hint2: "CASE WHEN success_count * 100.0 / total_runs >= 80 THEN 'Healthy' ELSE 'At Risk' END",
    hint3: "SELECT pipeline_name,\n  COUNT(*) as total_runs,\n  SUM(CASE WHEN status = 'success' THEN 1 ELSE 0 END) as success_count,\n  SUM(CASE WHEN status = 'failed' THEN 1 ELSE 0 END) as failure_count,\n  CASE WHEN SUM(CASE WHEN status = 'success' THEN 1 ELSE 0 END) * 100.0 / COUNT(*) >= 80 THEN 'Healthy' ELSE 'At Risk' END as health_status\nFROM pipeline_runs\nGROUP BY pipeline_name\nORDER BY pipeline_name",
    validate: r => !r.error,
    expectedOutput: [
      { pipeline_name: 'customers_sync', total_runs: 3, success_count: 2, failure_count: 1, health_status: 'At Risk'  },
      { pipeline_name: 'orders_etl',     total_runs: 5, success_count: 4, failure_count: 1, health_status: 'Healthy'  },
      { pipeline_name: 'products_load',  total_runs: 2, success_count: 2, failure_count: 0, health_status: 'Healthy'  },
    ],
    answer: "SELECT\n  pipeline_name,\n  COUNT(*) AS total_runs,\n  SUM(CASE WHEN status = 'success' THEN 1 ELSE 0 END) AS success_count,\n  SUM(CASE WHEN status = 'failed'  THEN 1 ELSE 0 END) AS failure_count,\n  CASE\n    WHEN SUM(CASE WHEN status = 'success' THEN 1 ELSE 0 END) * 100.0 / COUNT(*) >= 80\n    THEN 'Healthy'\n    ELSE 'At Risk'\n  END AS health_status\nFROM pipeline_runs\nGROUP BY pipeline_name\nORDER BY pipeline_name;",
    whyMatters: 'CASE WHEN inside SUM is conditional aggregation — the standard SQL technique for pivoting and classifying within a single GROUP BY. In production, this pattern generates pipeline scorecards, customer health scores, and data quality dashboards — all without subqueries or multiple passes.',
    wrongApproach: 'Trying to reference an alias in the same SELECT level — CASE WHEN success_count >= ... — fails in most databases because aliases are not available at SELECT evaluation time. You must repeat the full expression, or wrap in a CTE/subquery: WITH metrics AS (...) SELECT *, CASE WHEN success_count / total_runs >= 0.8 THEN \'Healthy\' ELSE \'At Risk\' END FROM metrics.',
    optimizationNote: 'In dbt, conditional aggregation becomes a metric definition with filters: metric(name: success_rate, expression: successes / total_runs, type: ratio). The CASE WHEN pattern is essentially what dbt compiles down to under the hood. Understanding it at the SQL level helps debug dbt metric output.',
  },
  {
    id: 'q28', difficulty: 'advanced', title: 'LEAD: Next Run Forecast',
    prompt: 'For each successful pipeline run, show the rows_processed and the next run\'s rows_processed (named next_run_rows) using LEAD. Partition by pipeline_name, order by run_id. This uses window functions — compare your logic against the expected output.',
    hint1: "LEAD(rows_processed) OVER (PARTITION BY pipeline_name ORDER BY run_id)",
    hint2: "WHERE status = 'success'",
    hint3: "SELECT run_id, pipeline_name, rows_processed,\n  LEAD(rows_processed) OVER (PARTITION BY pipeline_name ORDER BY run_id) as next_run_rows\nFROM pipeline_runs\nWHERE status = 'success'\nORDER BY pipeline_name, run_id",
    validate: r => !r.error,
    expectedOutput: [
      { run_id: 1,  pipeline_name: 'orders_etl',     rows_processed: 15420, next_run_rows: 16001 },
      { run_id: 5,  pipeline_name: 'orders_etl',     rows_processed: 16001, next_run_rows: 14900 },
      { run_id: 8,  pipeline_name: 'orders_etl',     rows_processed: 14900, next_run_rows: 17200 },
      { run_id: 10, pipeline_name: 'orders_etl',     rows_processed: 17200, next_run_rows: null  },
      { run_id: 2,  pipeline_name: 'customers_sync', rows_processed:  3201, next_run_rows:  3300 },
      { run_id: 9,  pipeline_name: 'customers_sync', rows_processed:  3300, next_run_rows:  null },
    ],
    answer: "SELECT run_id, pipeline_name, rows_processed,\n  LEAD(rows_processed) OVER (\n    PARTITION BY pipeline_name\n    ORDER BY run_id\n  ) AS next_run_rows\nFROM pipeline_runs\nWHERE status = 'success'\nORDER BY pipeline_name, run_id;",
    whyMatters: 'LEAD is LAG in the opposite direction — it looks forward rather than backward. It\'s used in time-series forecasting patterns: "What did the next period look like?" It\'s also used to calculate gaps and intervals — LEAD(event_time) - event_time gives session duration in clickstream analysis.',
    wrongApproach: 'A common confusion: LEAD(col, 1) is the immediate next row. LEAD(col, 2) is two rows ahead. The offset defaults to 1 — always state it explicitly when you need a specific look-ahead distance to make the intent clear for reviewers.',
    optimizationNote: 'LEAD and LAG are computed in the same window pass — you can include both in the same SELECT without doubling compute: SELECT rows_processed, LAG(rows_processed) OVER (...) as prev_rows, LEAD(rows_processed) OVER (...) as next_rows FROM ... — one shuffle, two window columns.',
  },
  {
    id: 'q29', difficulty: 'advanced', title: 'NTILE: Salary Quartiles',
    prompt: 'Divide all employees into 4 salary quartiles (1 = lowest, 4 = highest) using NTILE(4). Return name, department, salary, and salary_quartile sorted by salary ascending. This uses window functions — compare your logic against the expected output.',
    hint1: "NTILE(4) OVER (ORDER BY salary)",
    hint2: "ORDER BY salary ASC",
    hint3: "SELECT name, department, salary,\n  NTILE(4) OVER (ORDER BY salary) as salary_quartile\nFROM employees\nORDER BY salary ASC",
    validate: r => !r.error,
    expectedOutput: [
      { name: 'Derek Wilson', department: 'Data',        salary:  78000, salary_quartile: 1 },
      { name: 'Tom Bradley',  department: 'Data',        salary:  88000, salary_quartile: 1 },
      { name: 'Chris Murphy', department: 'Analytics',   salary:  92000, salary_quartile: 2 },
      { name: 'James Park',   department: 'Engineering', salary:  95000, salary_quartile: 2 },
      { name: 'Lisa Chen',    department: 'Analytics',   salary: 105000, salary_quartile: 3 },
      { name: 'Maria Santos', department: 'Data',        salary: 110000, salary_quartile: 3 },
      { name: 'Priya Patel',  department: 'Engineering', salary: 115000, salary_quartile: 4 },
      { name: 'Sarah Wong',   department: 'Engineering', salary: 120000, salary_quartile: 4 },
    ],
    answer: "SELECT name, department, salary,\n  NTILE(4) OVER (\n    ORDER BY salary\n  ) AS salary_quartile\nFROM employees\nORDER BY salary ASC;",
    whyMatters: 'NTILE divides data into equal-sized buckets — it\'s used for percentile bucketing in analytics: quartiles, deciles (NTILE(10)), percentiles (NTILE(100)). In production, NTILE powers customer segmentation models: "Place all customers into 10 deciles by LTV and flag the top 2 deciles for marketing."',
    wrongApproach: 'NTILE(4) distributes rows as evenly as possible — with 8 employees, each quartile gets exactly 2. With 9 employees, the first quartile gets 3 (remainder distributed to lower buckets). Don\'t assume equal bucket sizes; use COUNT(*) per quartile to verify distribution in production.',
    optimizationNote: 'NTILE is a single-pass window function — all NTILE(N) calls with the same ORDER BY can share one window sort. If you need quartiles AND deciles for the same analysis, compute them in the same SELECT: NTILE(4) OVER (ORDER BY salary) as quartile, NTILE(10) OVER (ORDER BY salary) as decile — one sort, two columns.',
  },

  // ── SENIOR INTERVIEW — Advanced patterns ────────────────────────────────────
  {
    id: 'q30', difficulty: 'advanced', title: 'Multi-CTE Chain: Customer Spend Tiers',
    prompt: `Business scenario: Segment customers into spending tiers using a 3-stage CTE chain.
Tier rules: Platinum ≥ $400 | Gold $200–$399 | Silver < $200

Stage 1 — "order_totals": aggregate SUM(amount) per customer_id from orders
Stage 2 — "customer_tiers": join to customers, assign tier with CASE WHEN
Stage 3 — final SELECT: GROUP BY tier → customer_count + avg_spend

Tables: customers, orders`,
    hint1: "WITH order_totals AS (SELECT customer_id, SUM(amount) AS total_spent FROM orders GROUP BY customer_id)",
    hint2: "customer_tiers AS (SELECT c.customer_name, ot.total_spent, CASE WHEN ot.total_spent >= 400 THEN 'Platinum' WHEN ot.total_spent >= 200 THEN 'Gold' ELSE 'Silver' END AS tier FROM customers c JOIN order_totals ot ON c.customer_id = ot.customer_id)",
    hint3: "SELECT tier, COUNT(*) AS customer_count, ROUND(AVG(total_spent),2) AS avg_spend FROM customer_tiers GROUP BY tier ORDER BY avg_spend DESC",
    validate: r => !r.error,
    expectedOutput: [
      { tier: 'Platinum', customer_count: 3, avg_spend: 468.33 },
      { tier: 'Gold',     customer_count: 1, avg_spend: 264.00 },
      { tier: 'Silver',   customer_count: 2, avg_spend: 48.50  },
    ],
    answer: "WITH order_totals AS (\n  SELECT customer_id, SUM(amount) AS total_spent\n  FROM orders\n  GROUP BY customer_id\n),\ncustomer_tiers AS (\n  SELECT c.customer_name, ot.total_spent,\n    CASE\n      WHEN ot.total_spent >= 400 THEN 'Platinum'\n      WHEN ot.total_spent >= 200 THEN 'Gold'\n      ELSE 'Silver'\n    END AS tier\n  FROM customers c\n  INNER JOIN order_totals ot ON c.customer_id = ot.customer_id\n)\nSELECT tier, COUNT(*) AS customer_count,\n  ROUND(AVG(total_spent), 2) AS avg_spend\nFROM customer_tiers\nGROUP BY tier\nORDER BY avg_spend DESC;",
    whyMatters: 'Multi-CTE chains are the standard structure for stepwise transformations in dbt Silver→Gold models. Each CTE is one logical transformation — independently testable and readable. In production this exact 3-stage pattern generates customer lifetime-value segments that feed marketing automation systems.',
    wrongApproach: 'Nesting subqueries instead of CTEs produces the same result but is nearly unreadable and impossible to debug mid-query. CTEs let you run each stage in isolation: just SELECT * FROM order_totals to inspect stage-1 output during development.',
    optimizationNote: 'In Databricks, CTEs referenced once are inlined by Catalyst optimizer — no extra compute. If customer_tiers is referenced in two downstream CTEs, cache it: CREATE OR REPLACE TEMP VIEW customer_tiers AS (...). This materializes it once instead of running the join twice.',
    engineeringContext: 'Multi-CTE chains are the core pattern in every dbt project. The 3-stage structure above maps directly to: Bronze (raw) → Silver (clean + join) → Gold (aggregated). Databricks Photon collapses CTE chains into a single physical plan when possible — you write readable stages, Photon executes efficiently.',
    performanceNote: 'Avoid referencing the same CTE more than once — Catalyst may re-evaluate it each time. For chains longer than 5 CTEs, explicitly cache intermediate DataFrames in PySpark or use temp views. The ROUND() call on avg_spend adds negligible CPU but prevents floating-point noise in dashboard comparisons.',
    interviewExpectation: 'Seniors explain each CTE\'s purpose before writing code: "Stage 1 aggregates, Stage 2 enriches and classifies, Stage 3 summarizes." They mention testability (each CTE queryable in isolation), Catalyst optimization, and how this maps to dbt model layers. Interviewers look for structured thinking — not just correct syntax.',
  },
  {
    id: 'q31', difficulty: 'advanced', title: 'Recursive CTE: Employee Org Tree',
    prompt: `Business scenario: Traverse the employee hierarchy to find all reports under Sarah Wong (the root manager, manager_id IS NULL). Return each employee's name and their depth in the hierarchy (root = 0, direct reports = 1, indirect = 2).

Anchor member: employees WHERE manager_id IS NULL
Recursive member: join employees on e.manager_id = oc.employee_id

Tables: employees (employee_id, name, department, salary, manager_id)`,
    hint1: "WITH RECURSIVE org_chart AS (SELECT employee_id, name, 0 AS level FROM employees WHERE manager_id IS NULL",
    hint2: "UNION ALL SELECT e.employee_id, e.name, oc.level + 1 FROM employees e INNER JOIN org_chart oc ON e.manager_id = oc.employee_id)",
    hint3: "SELECT name, level FROM org_chart ORDER BY level, name",
    validate: r => !r.error,
    expectedOutput: [
      { name: 'Sarah Wong',   level: 0 },
      { name: 'James Park',   level: 1 },
      { name: 'Lisa Chen',    level: 1 },
      { name: 'Maria Santos', level: 1 },
      { name: 'Priya Patel',  level: 1 },
      { name: 'Chris Murphy', level: 2 },
      { name: 'Derek Wilson', level: 2 },
      { name: 'Tom Bradley',  level: 2 },
    ],
    answer: "WITH RECURSIVE org_chart AS (\n  -- Anchor: root manager\n  SELECT employee_id, name, manager_id, 0 AS level\n  FROM employees\n  WHERE manager_id IS NULL\n\n  UNION ALL\n\n  -- Recursive: find direct reports\n  SELECT e.employee_id, e.name, e.manager_id, oc.level + 1\n  FROM employees e\n  INNER JOIN org_chart oc ON e.manager_id = oc.employee_id\n)\nSELECT name, level\nFROM org_chart\nORDER BY level, name;",
    whyMatters: 'Recursive CTEs are the only pure-SQL way to traverse hierarchical data of arbitrary depth: org charts, product category trees, bill-of-materials, graph adjacency lists. Without recursion you need N separate self-joins — one per depth level — and the query breaks if a new level is added.',
    wrongApproach: 'Using multiple self-joins (LEFT JOIN employees mgr1 ON ... LEFT JOIN employees mgr2 ON ...) only works for a fixed known depth. Adding a new management tier requires rewriting the query. Recursive CTE handles unlimited depth with no query changes.',
    optimizationNote: 'Always add a depth cap to prevent infinite loops from bad data (circular manager_id references): WHERE level < 10. In Spark SQL, WITH RECURSIVE is not supported — use GraphFrames or a Python/Scala loop with iterative DataFrame joins. In Snowflake and BigQuery, RECURSIVE is fully supported and uses breadth-first traversal.',
    engineeringContext: 'Recursive CTEs appear in dimension modeling for multi-level hierarchies: product taxonomy (category → subcategory → SKU), geography rollups (country → region → city), account trees in financial systems. Common in Snowflake and BigQuery interview rounds — Spark candidates should know the PySpark equivalent (GraphFrames BFS).',
    performanceNote: 'Each recursion level is a separate join pass — depth-10 hierarchy = 10 join operations. For very deep or wide trees, the recursive CTE can be slow. Add a LIMIT or depth cap. In BigQuery, recursive CTEs support LIMIT per level. In production, pre-compute the hierarchy as a materialized flattened table (customer_id, ancestor_id, depth) for fast lookup.',
    interviewExpectation: 'Interviewers expect: (1) identify the anchor and recursive member; (2) UNION ALL not UNION (preserve duplicates for performance); (3) cycle prevention with depth limit; (4) know that Spark does not support RECURSIVE — alternative is iterative Spark or GraphFrames; (5) explain BFS vs DFS traversal order.',
  },
  {
    id: 'q32', difficulty: 'advanced', title: 'SCD2: Detect Changed Records',
    prompt: `Business scenario: You have dim_customers (target, is_current=true records) and stg_customers (today's source snapshot). Find customers whose city or status changed — these need a new SCD2 history record.

Table structures:
  dim_customers: customer_id, customer_name, city, status, effective_date, is_current BOOLEAN
  stg_customers: customer_id, customer_name, city, status

Write a query returning: customer_id, old_city, new_city, old_status, new_status for changed records.
Use IS DISTINCT FROM for NULL-safe comparison where possible.`,
    hint1: 'JOIN dim_customers d TO stg_customers s ON d.customer_id = s.customer_id AND d.is_current = true',
    hint2: 'WHERE d.city != s.city OR d.status != s.status  (or use IS DISTINCT FROM for NULL safety)',
    hint3: "SELECT d.customer_id, d.city AS old_city, s.city AS new_city, d.status AS old_status, s.status AS new_status FROM dim_customers d JOIN stg_customers s ON d.customer_id = s.customer_id AND d.is_current = true WHERE d.city != s.city OR d.status != s.status",
    validate: r => !r.error,
    expectedOutput: [
      { customer_id: 3, old_city: 'Austin',  new_city: 'Dallas',  old_status: 'inactive', new_status: 'active' },
      { customer_id: 6, old_city: 'Austin',  new_city: 'Houston', old_status: 'inactive', new_status: 'active' },
    ],
    answer: "-- Step 1: Detect changes (NULL-safe)\nSELECT\n  d.customer_id,\n  d.city    AS old_city,    s.city    AS new_city,\n  d.status  AS old_status,  s.status  AS new_status\nFROM dim_customers d\nINNER JOIN stg_customers s\n  ON d.customer_id = s.customer_id\n  AND d.is_current = true\nWHERE d.city   IS DISTINCT FROM s.city\n   OR d.status IS DISTINCT FROM s.status;\n\n-- Step 2: SCD2 MERGE (Databricks / Delta Lake)\n-- WHEN MATCHED AND changed → UPDATE SET is_current=false, end_date=today\n-- WHEN NOT MATCHED     → INSERT with is_current=true, start_date=today",
    whyMatters: 'SCD2 is the foundation of dimension modeling wherever history must be preserved — every Kimball-style data warehouse uses it for customer, product, and employee dimensions. Change detection is Step 1 of the 3-step SCD2 lifecycle: detect → expire old record → insert new current record.',
    wrongApproach: "Using != to compare nullable columns misses NULL-to-value transitions: NULL != 'Dallas' evaluates to NULL (not TRUE) in SQL. Use IS DISTINCT FROM (Postgres/Spark/Snowflake) or COALESCE(d.city, '__null__') != COALESCE(s.city, '__null__') for NULL-safe change detection.",
    optimizationNote: 'In Delta Lake: MERGE INTO dim_customers USING stg_customers ON d.customer_id = s.customer_id AND d.is_current = true WHEN MATCHED AND (d.city IS DISTINCT FROM s.city OR d.status IS DISTINCT FROM s.status) THEN UPDATE SET is_current = false, end_date = current_date() WHEN NOT MATCHED THEN INSERT (...). Partition dim_customers by is_current for fast filter pushdown on the active records.',
    engineeringContext: 'SCD2 merge logic is the most common senior DE interview question at data warehouse companies. Every Snowflake, Redshift, BigQuery, and Synapse data engineer must know the 3-step lifecycle. Databricks MERGE handles all three steps atomically — the change detection query above feeds the MATCHED condition.',
    performanceNote: 'SCD2 tables grow unbounded. Partition by is_current so WHERE is_current = true prunes ~99% of historical records. In Databricks, Z-ORDER on customer_id + is_current enables sub-second point lookups on billion-row dimension tables. Monitor the active record count monthly — sudden jumps indicate missing is_current=false expirations.',
    interviewExpectation: "Seniors describe the full 3-step lifecycle unprompted: detect → expire → insert. They mention NULL-safe comparison (IS DISTINCT FROM), surrogate key vs natural key, the AND is_current = true in the ON clause (critical — missing it creates phantom records), and Delta Lake MERGE as the production implementation.",
  },
  {
    id: 'q33', difficulty: 'advanced', title: 'Incremental Load: Watermark Filter',
    prompt: `Business scenario: Your daily orders pipeline uses a watermark of '2024-01-17' (the last successfully loaded date). Write the Bronze-layer incremental load query that fetches only new orders since that watermark.

Return: order_id, customer_id, amount, status, created_at
Filter: created_at > '2024-01-17'
Sort: created_at ASC (for ordered batch replay)

This is a real, executable query against the orders table.`,
    hint1: "WHERE created_at > '2024-01-17'",
    hint2: 'ORDER BY created_at ASC — ensures idempotent ordered loading',
    hint3: "SELECT order_id, customer_id, amount, status, created_at FROM orders WHERE created_at > '2024-01-17' ORDER BY created_at ASC",
    validate: r => !r.error && !r.complex && r.rows?.length === 7,
    answer: "SELECT order_id, customer_id, amount, status, created_at\nFROM orders\nWHERE created_at > '2024-01-17'\nORDER BY created_at ASC;",
    whyMatters: 'Watermark-based incremental loading is the foundation of every production ETL pipeline. Full-load pipelines scan billions of rows to load thousands of new records — incremental loads scan only the new partition. The WHERE created_at > watermark filter is literally the most-used SQL pattern in data engineering.',
    wrongApproach: 'Using >= instead of > duplicates the boundary row on every run. Use > with the watermark and save MAX(created_at) of the loaded batch as the next watermark. Combine with MERGE (not INSERT) on the target to make the load idempotent — safe to re-run without creating duplicates.',
    optimizationNote: 'The watermark column (created_at) must be the partition column. In Delta Lake: WHERE created_at > CAST(\'2024-01-17\' AS DATE) prunes all earlier partitions — scanning 1 day instead of the full table. Store the watermark in a control table: SELECT MAX(created_at) FROM silver.orders to derive it automatically.',
    engineeringContext: 'This is the Bronze-layer query in every medallion architecture pipeline. In ADF/Databricks jobs, the watermark is a pipeline parameter populated from a control table. After a successful load, MAX(created_at) of the new batch is written back to the control table for the next run. Airflow uses XCom to pass watermarks between tasks.',
    performanceNote: 'Without date partitioning, created_at > \'2024-01-17\' scans the full table. With daily partitioning, it reads 1/N partitions. On a 3-year table (1095 partitions), a single-day incremental load scans 0.09% of the data vs 100% for a full scan. Partition pruning is the single biggest performance win in incremental pipelines.',
    interviewExpectation: 'Seniors immediately ask: "Is this idempotent?" and "What happens on failure and retry?" They discuss: watermark storage (control table vs pipeline parameter), late-arriving data (events that arrive after cutoff), > vs >= boundary semantics, and MERGE to make reruns safe. Missing the idempotency discussion is a gap at the senior level.',
  },
  {
    id: 'q34', difficulty: 'advanced', title: 'Composite-Key Dedup: API Retry Storm',
    prompt: `Business scenario: An API retry storm inserted duplicate orders into the Bronze table. Deduplicate using ROW_NUMBER() keeping the highest order_id per composite business key: (customer_id, amount, status).

Write a CTE that:
1. Assigns ROW_NUMBER() PARTITION BY (customer_id, amount, status) ORDER BY order_id DESC
2. Filters to rn = 1 in the outer query

Tables: orders`,
    hint1: 'WITH deduped AS (SELECT *, ROW_NUMBER() OVER (PARTITION BY customer_id, amount, status ORDER BY order_id DESC) AS rn FROM orders)',
    hint2: 'SELECT order_id, customer_id, amount, status, created_at FROM deduped WHERE rn = 1',
    hint3: "WITH deduped AS (\n  SELECT *,\n    ROW_NUMBER() OVER (PARTITION BY customer_id, amount, status ORDER BY order_id DESC) AS rn\n  FROM orders\n)\nSELECT order_id, customer_id, amount, status, created_at\nFROM deduped WHERE rn = 1 ORDER BY order_id",
    validate: r => !r.error,
    expectedOutput: [
      { order_id: 101, customer_id: 1, amount: 150, status: 'shipped',   created_at: '2024-01-15' },
      { order_id: 102, customer_id: 2, amount: 89,  status: 'pending',   created_at: '2024-01-16' },
      { order_id: 103, customer_id: 1, amount: 230, status: 'shipped',   created_at: '2024-01-17' },
    ],
    answer: "WITH deduped AS (\n  SELECT *,\n    ROW_NUMBER() OVER (\n      PARTITION BY customer_id, amount, status\n      ORDER BY order_id DESC\n    ) AS rn\n  FROM orders\n)\nSELECT order_id, customer_id, amount, status, created_at\nFROM deduped\nWHERE rn = 1\nORDER BY order_id;",
    whyMatters: 'Multi-column PARTITION BY is the production deduplication standard. A single-column PARTITION BY on customer_id would incorrectly treat two different orders from the same customer as duplicates. The composite business key (all attributes that define a unique business event) must drive the PARTITION BY.',
    wrongApproach: 'SELECT DISTINCT only deduplicates rows where ALL selected columns are identical — it will keep two rows with the same customer/amount/status if they differ in order_id. ROW_NUMBER with composite PARTITION BY correctly handles the "same business event, different surrogate key" case.',
    optimizationNote: 'In Delta Lake Bronze→Silver pipeline: INSERT INTO silver.orders SELECT order_id, customer_id, amount, status FROM (SELECT *, ROW_NUMBER() OVER (PARTITION BY customer_id, amount, created_at ORDER BY ingested_at DESC) rn FROM bronze.orders) WHERE rn = 1. This deduplicates at write time — the Silver layer is always clean.',
    engineeringContext: 'This pattern is at the Bronze→Silver boundary of every CDC pipeline. API retries, Kafka at-least-once delivery, and Lambda fan-out all create duplicate records. ROW_NUMBER + composite key is the universal dedup solution. Databricks Autoloader + Delta MERGE can do this automatically with schema inference.',
    performanceNote: 'ROW_NUMBER() triggers a full shuffle in Spark — all rows sharing the composite key must colocate on one executor. For very wide tables, project only the dedup key + ordering column in the CTE before the window to reduce shuffle size. Z-ORDER on the composite key in Delta Lake speeds future dedup queries by co-locating related rows.',
    interviewExpectation: 'Seniors define the composite business key before writing any SQL: "What makes two rows truly the same business event — not just sharing a customer_id?" They mention idempotency (same dedup query on same data = same result), late-arriving duplicates (what if the duplicate arrives tomorrow?), and the Delta MERGE pattern as the production-scale implementation.',
  },
  {
    id: 'q35', difficulty: 'advanced', title: 'Sessionization: 30-Minute Gap Detection',
    prompt: `Business scenario: Assign session IDs to user events. A new session starts when the gap since the previous event for the same user exceeds 30 minutes. Use a 3-CTE pattern:
1. "gaps" — LAG to get prev_event_time per user
2. "flags" — CASE WHEN DATEDIFF(MINUTE, prev, curr) > 30 THEN 1 ELSE 0 END as is_new_session
3. Final — SUM(is_new_session) OVER (PARTITION BY user_id ORDER BY event_time ROWS UNBOUNDED PRECEDING) as session_id

Hypothetical table: user_events (user_id INT, event_time TIMESTAMP, event_type VARCHAR)`,
    hint1: 'WITH gaps AS (SELECT *, LAG(event_time) OVER (PARTITION BY user_id ORDER BY event_time) AS prev_time FROM user_events)',
    hint2: 'flags AS (SELECT *, CASE WHEN prev_time IS NULL OR DATEDIFF(MINUTE, prev_time, event_time) > 30 THEN 1 ELSE 0 END AS is_new FROM gaps)',
    hint3: 'SELECT *, SUM(is_new) OVER (PARTITION BY user_id ORDER BY event_time ROWS BETWEEN UNBOUNDED PRECEDING AND CURRENT ROW) AS session_id FROM flags',
    validate: r => !r.error,
    expectedOutput: [
      { user_id: 101, event_time: '10:00', event_type: 'page_view', session_id: 1 },
      { user_id: 101, event_time: '10:15', event_type: 'click',     session_id: 1 },
      { user_id: 101, event_time: '11:30', event_type: 'purchase',  session_id: 2 },
      { user_id: 101, event_time: '11:35', event_type: 'page_view', session_id: 2 },
    ],
    answer: "WITH gaps AS (\n  SELECT *,\n    LAG(event_time) OVER (PARTITION BY user_id ORDER BY event_time) AS prev_time\n  FROM user_events\n),\nflags AS (\n  SELECT *,\n    CASE\n      WHEN prev_time IS NULL THEN 1\n      WHEN DATEDIFF(MINUTE, prev_time, event_time) > 30 THEN 1\n      ELSE 0\n    END AS is_new_session\n  FROM gaps\n)\nSELECT\n  user_id, event_time, event_type,\n  SUM(is_new_session) OVER (\n    PARTITION BY user_id\n    ORDER BY event_time\n    ROWS BETWEEN UNBOUNDED PRECEDING AND CURRENT ROW\n  ) AS session_id\nFROM flags\nORDER BY user_id, event_time;",
    whyMatters: 'Sessionization is the core algorithm behind Google Analytics, Amplitude, Mixpanel, and every product analytics system. The LAG → flag → cumulative SUM pattern is the canonical SQL approach. In production it runs on billions of clickstream events daily to assign session boundaries for funnel and retention analysis.',
    wrongApproach: "GROUP BY user_id, DATE_TRUNC('hour', event_time) creates fixed time windows — it splits a user active from 10:58–11:05 across two sessions at the hour boundary. Real sessionization must detect activity gaps, not calendar boundaries. Fixed windows miscount sessions by 10–40% vs gap-based sessions.",
    optimizationNote: 'Sessionization on large event tables (billions/day) is shuffle-intensive — PARTITION BY user_id colocates all user events. Pre-filter to the relevant date window before sessionizing. In Databricks Structured Streaming, use flatMapGroupsWithState for real-time stateful sessionization without batch window limitations.',
    engineeringContext: 'Sessionization queries are asked in product analytics engineering interviews at Uber, Airbnb, Netflix, and DoorDash. The 3-CTE LAG → flag → cumulative SUM pattern is standard. Production implementations often use Spark Structured Streaming with watermarks (withWatermark("event_time", "30 minutes")) for real-time session detection.',
    performanceNote: 'The cumulative SUM window requires ROWS BETWEEN UNBOUNDED PRECEDING AND CURRENT ROW — the full frame explicitly stated. Without ROWS, the default RANGE frame may behave differently when event_times tie. For 10B events/day, pre-partition source by user_id % 1000 before the LAG to distribute the sort across executors.',
    interviewExpectation: 'Interviewers look for: (1) 3-stage CTE structure; (2) ROWS BETWEEN UNBOUNDED PRECEDING AND CURRENT ROW frame; (3) NULL handling for the first event per user; (4) awareness of Spark Structured Streaming alternative for real-time; (5) clarifying what "30 minutes" means — wall clock gap vs event-time gap.',
  },
  {
    id: 'q36', difficulty: 'advanced', title: 'Cohort Retention: 7-Day Retention Rate',
    prompt: `Business scenario: Calculate 7-day retention by signup cohort. A customer is "retained" if they placed at least one order within 7 days of signing up.

Return: cohort_month, cohort_size, retained_7d count, retention_rate_pct

Pattern:
  1. CTE "cohorts": extract cohort_month = SUBSTR(signup_date, 1, 7)
  2. LEFT JOIN orders ON customer_id AND DATEDIFF(order, signup) BETWEEN 0 AND 7
  3. COUNT(DISTINCT c.customer_id) = cohort size; COUNT(DISTINCT when retained) = retained_7d

Tables: customers (signup_date), orders (created_at)`,
    hint1: "WITH cohorts AS (SELECT customer_id, signup_date, SUBSTR(signup_date, 1, 7) AS cohort_month FROM customers)",
    hint2: 'LEFT JOIN orders o ON c.customer_id = o.customer_id — apply date range in CASE WHEN, not WHERE',
    hint3: "COUNT(DISTINCT CASE WHEN DATEDIFF(o.created_at, c.signup_date) BETWEEN 0 AND 7 THEN c.customer_id END) AS retained_7d",
    validate: r => !r.error,
    expectedOutput: [
      { cohort_month: '2023-01', cohort_size: 1, retained_7d: 0, retention_rate_pct: 0 },
      { cohort_month: '2023-02', cohort_size: 1, retained_7d: 0, retention_rate_pct: 0 },
      { cohort_month: '2023-07', cohort_size: 1, retained_7d: 0, retention_rate_pct: 0 },
    ],
    answer: "WITH cohorts AS (\n  SELECT customer_id, signup_date,\n    SUBSTR(signup_date, 1, 7) AS cohort_month\n  FROM customers\n)\nSELECT\n  c.cohort_month,\n  COUNT(DISTINCT c.customer_id) AS cohort_size,\n  COUNT(DISTINCT CASE\n    WHEN DATEDIFF(o.created_at, c.signup_date) BETWEEN 0 AND 7\n    THEN c.customer_id END) AS retained_7d,\n  ROUND(\n    COUNT(DISTINCT CASE WHEN DATEDIFF(o.created_at, c.signup_date) BETWEEN 0 AND 7\n    THEN c.customer_id END) * 100.0 / COUNT(DISTINCT c.customer_id), 1\n  ) AS retention_rate_pct\nFROM cohorts c\nLEFT JOIN orders o ON c.customer_id = o.customer_id\nGROUP BY c.cohort_month\nORDER BY c.cohort_month;",
    whyMatters: 'Cohort retention is the primary product health metric at every SaaS and e-commerce company. Healthy businesses show stable or improving D7/D30 retention across cohorts. This exact query pattern powers growth dashboards at Stripe, Shopify, and Airbnb — it\'s a first-round interview question at product-analytics-heavy companies.',
    wrongApproach: 'Filtering orders with WHERE o.created_at BETWEEN signup AND signup+7 before the LEFT JOIN converts it to an INNER JOIN — customers with no early orders are excluded and retention appears inflated. Always apply the date condition inside COUNT(DISTINCT CASE WHEN ...) to preserve all cohort members in the LEFT JOIN.',
    optimizationNote: 'For scale, pre-compute a user_first_order table (customer_id, first_order_date). Then retention check = WHERE first_order_date BETWEEN signup_date AND signup_date + 7 — a point lookup instead of a range scan per user. Reduces the cohort query from O(customers × orders) to O(customers).',
    engineeringContext: 'Cohort retention is a first-round question at Airbnb, Meta, Stripe, and DoorDash DE roles. dbt models this as cohort_retention.sql in the Gold layer. Amplitude and Mixpanel run this query at scale under the hood. The COUNT(DISTINCT CASE WHEN) pattern is the SQL standard for conditional cardinality.',
    performanceNote: 'DATEDIFF in the JOIN condition prevents partition pruning — every order row is scanned per customer. For scale: pre-join to a user_orders_within_7d boolean flag in the Silver layer. Then the Gold retention query is a simple GROUP BY — no per-row DATEDIFF computation.',
    interviewExpectation: "Seniors precisely define retention before writing: 'retained = at least one order within 7 days of signup.' They discuss COUNT(DISTINCT) vs COUNT to avoid duplicate counting, the LEFT JOIN anti-pattern (WHERE on right table = INNER JOIN), and multi-window retention (D1/D7/D30/D90 computed in a single pass using multiple CASE WHEN columns).",
  },
  {
    id: 'q37', difficulty: 'advanced', title: 'Funnel Analysis: Conversion Stage Counts',
    prompt: `Business scenario: Analyze a purchase funnel across 3 stages: page_view → add_to_cart → purchase. Count distinct users at each stage and calculate step-over-step conversion rate.

Use conditional COUNT DISTINCT in a single-pass CTE to avoid scanning the table 3 times.

Hypothetical table: user_events (user_id INT, event_type VARCHAR)
event_type values: 'page_view' | 'add_to_cart' | 'purchase'`,
    hint1: "WITH counts AS (SELECT COUNT(DISTINCT CASE WHEN event_type = 'page_view' THEN user_id END) AS viewed, ...",
    hint2: "COUNT(DISTINCT CASE WHEN event_type = 'add_to_cart' THEN user_id END) AS added, COUNT(DISTINCT CASE WHEN event_type = 'purchase' THEN user_id END) AS purchased FROM user_events)",
    hint3: "SELECT 'page_view' AS stage, viewed AS users, NULL AS prev FROM counts UNION ALL SELECT 'add_to_cart', added, viewed FROM counts UNION ALL SELECT 'purchase', purchased, added FROM counts",
    validate: r => !r.error,
    expectedOutput: [
      { stage: 'page_view',   users: 1000, conversion_rate_pct: null },
      { stage: 'add_to_cart', users: 400,  conversion_rate_pct: 40.0 },
      { stage: 'purchase',    users: 120,  conversion_rate_pct: 30.0 },
    ],
    answer: "WITH counts AS (\n  SELECT\n    COUNT(DISTINCT CASE WHEN event_type = 'page_view'   THEN user_id END) AS viewed,\n    COUNT(DISTINCT CASE WHEN event_type = 'add_to_cart' THEN user_id END) AS added,\n    COUNT(DISTINCT CASE WHEN event_type = 'purchase'    THEN user_id END) AS purchased\n  FROM user_events\n),\nstages AS (\n  SELECT 'page_view'   AS stage, viewed    AS users, NULL  AS prev FROM counts\n  UNION ALL\n  SELECT 'add_to_cart' AS stage, added      AS users, viewed AS prev FROM counts\n  UNION ALL\n  SELECT 'purchase'    AS stage, purchased  AS users, added  AS prev FROM counts\n)\nSELECT stage, users,\n  ROUND(users * 100.0 / NULLIF(prev, 0), 1) AS conversion_rate_pct\nFROM stages;",
    whyMatters: "Funnel analysis is the primary tool for identifying conversion bottlenecks. '40% view-to-cart, 30% cart-to-purchase' immediately identifies the checkout flow as the constraint. Every A/B test, every product experiment, and every marketing ROI analysis uses funnel metrics. This query is the engine behind Amplitude's funnel charts.",
    wrongApproach: "COUNT(event_type = 'add_to_cart') counts events, not users. A user who adds to cart 5 times counts as 5. Always use COUNT(DISTINCT user_id) for funnel analysis. Overcounting by 2–3× inflates conversion rates and produces misleading A/B test results.",
    optimizationNote: 'This single-pass approach scans user_events once and computes all stage counts simultaneously — O(n). Running 3 separate queries with UNION ALL scans 3× and is 3× more expensive. On a 1B-row event table, the single-pass approach saves hundreds of slot-hours. Partition user_events by event_date and filter to the analysis window first.',
    engineeringContext: 'Funnel analysis is asked in every product analytics DE interview. Amplitude, Mixpanel, and Heap implement SQL funnel engines under the hood. The conditional COUNT DISTINCT pattern is the most common SQL funnel implementation. Ordered funnels (step A must happen before step B) require window functions — a common follow-up question.',
    performanceNote: 'For ordered funnels (strict sequence required), the approach changes: use LAG/LEAD to verify step ordering, or a self-JOIN with event_time ordering. Ordered funnels typically show 20–30% lower conversion than unordered because some users complete steps out of sequence. Always clarify with the interviewer.',
    interviewExpectation: "Seniors immediately clarify: 'ordered or unordered funnel?' Ordered = step A must occur before step B for the same user (requires window functions or self-join). Unordered = user did both steps regardless of order. They also discuss NULLIF(prev, 0) for division-by-zero safety and multi-segment funnels (mobile vs desktop).",
  },
  {
    id: 'q38', difficulty: 'advanced', title: 'Late-Arriving Data: MERGE Reprocessing',
    prompt: `Business scenario: Your daily pipeline processed 2024-01-19 data yesterday. Today, 2 orders with created_at = '2024-01-19' arrived late from a delayed microservice. They must be merged into the Silver table without duplicating existing rows.

Key concepts to demonstrate:
1. Query to identify late arrivals: orders WHERE created_at = '2024-01-19' AND order_id > 105
2. Why INSERT fails: would create duplicates
3. Why MERGE is correct: idempotent upsert on order_id

Write the MERGE statement that safely applies late arrivals.`,
    hint1: 'MERGE INTO silver.orders AS target USING late_arrivals AS source ON target.order_id = source.order_id',
    hint2: 'WHEN MATCHED THEN UPDATE SET * -- update if already exists (idempotent)',
    hint3: 'WHEN NOT MATCHED THEN INSERT * -- insert only if new',
    validate: r => !r.error,
    expectedOutput: [
      { order_id: 106, customer_id: 2, amount: 175, status: 'shipped', created_at: '2024-01-20', arrival_type: 'on-time' },
      { order_id: 107, customer_id: 5, amount: 42,  status: 'pending', created_at: '2024-01-21', arrival_type: 'late'    },
    ],
    answer: "-- Step 1: Identify late-arriving records\nSELECT order_id, customer_id, amount, status, created_at\nFROM orders\nWHERE created_at = '2024-01-19'\n  AND order_id > 105;  -- simulate late arrivals not seen in yesterday's run\n\n-- Step 2: Merge them idempotently (Delta Lake syntax)\nMERGE INTO silver.orders AS target\nUSING (\n  SELECT * FROM bronze.orders\n  WHERE created_at = '2024-01-19'\n    AND ingested_at > last_run_timestamp\n) AS late_arrivals\n  ON target.order_id = late_arrivals.order_id\nWHEN MATCHED     THEN UPDATE SET *\nWHEN NOT MATCHED THEN INSERT *;\n\n-- Step 3: Update the reprocessing watermark\nUPDATE pipeline_control\nSET last_reprocess_date = '2024-01-19'\nWHERE pipeline_name = 'orders_etl';",
    whyMatters: 'Late-arriving data is one of the most common production data quality issues. IoT sensors, mobile apps, and microservices with retries frequently deliver events hours or days after occurrence. Pipelines using strict watermarks silently miss these records permanently — late-arrival handling with MERGE is a critical senior DE capability.',
    wrongApproach: 'INSERT INTO silver.orders SELECT * FROM late_arrivals fails with duplicate key errors if any late records overlap with already-processed rows. Even with INSERT IGNORE, you silently drop updates to existing records. MERGE handles both new (INSERT) and already-processed (UPDATE) late arrivals correctly.',
    optimizationNote: 'Set a lookback window for late arrival detection: scan the last N days for any records not yet in Silver. Store the scan result in a staging table, then MERGE in one atomic operation. Delta Lake\'s transaction log ensures the MERGE is atomic — no partial state if the job fails mid-merge.',
    engineeringContext: 'Late-arriving data handling is a common senior interview topic at Uber, Lyft, and any company with mobile or IoT event streams. Spark Structured Streaming handles late data natively with withWatermark("event_time", "2 hours") — events arriving up to 2 hours late are still included in the correct window.',
    performanceNote: "Scanning for late arrivals daily (WHERE created_at BETWEEN today-7 AND today-1) is expensive without partitioning. In production, maintain a late_arrivals staging table flagged during Bronze ingestion. This reduces reprocessing to a small staging scan instead of scanning 7 days of history.",
    interviewExpectation: "Seniors distinguish late-arriving (event time is old, arrives now) vs out-of-order (events arrive in wrong sequence). They discuss: (1) Structured Streaming withWatermark(); (2) MERGE for idempotent application; (3) monitoring late arrival rates (alert if > 0.1% daily volume); (4) business impact — late orders missed from yesterday's revenue report.",
  },
  {
    id: 'q39', difficulty: 'advanced', title: 'Rolling 7-Day Window: Pipeline Throughput',
    prompt: `Business scenario: Calculate a rolling 7-run average of rows_processed per pipeline to smooth daily variance and reveal throughput trends.

Use AVG() OVER with a ROWS BETWEEN 6 PRECEDING AND CURRENT ROW frame.

Tables: pipeline_runs
Filter: status = 'success'
Return: pipeline_name, run_date, rows_processed, rolling_7d_avg`,
    hint1: "AVG(rows_processed) OVER (PARTITION BY pipeline_name ORDER BY run_id ROWS BETWEEN 6 PRECEDING AND CURRENT ROW)",
    hint2: "WHERE status = 'success'",
    hint3: "SELECT pipeline_name, run_date, rows_processed, ROUND(AVG(rows_processed) OVER (PARTITION BY pipeline_name ORDER BY run_id ROWS BETWEEN 6 PRECEDING AND CURRENT ROW), 0) AS rolling_7d_avg FROM pipeline_runs WHERE status = 'success' ORDER BY pipeline_name, run_id",
    validate: r => !r.error,
    expectedOutput: [
      { pipeline_name: 'orders_etl', run_date: '2024-01-15', rows_processed: 15420, rolling_7d_avg: 15420 },
      { pipeline_name: 'orders_etl', run_date: '2024-01-17', rows_processed: 16001, rolling_7d_avg: 15711 },
      { pipeline_name: 'orders_etl', run_date: '2024-01-18', rows_processed: 14900, rolling_7d_avg: 15440 },
      { pipeline_name: 'orders_etl', run_date: '2024-01-19', rows_processed: 17200, rolling_7d_avg: 15880 },
    ],
    answer: "SELECT\n  pipeline_name,\n  run_date,\n  rows_processed,\n  ROUND(\n    AVG(rows_processed) OVER (\n      PARTITION BY pipeline_name\n      ORDER BY run_id\n      ROWS BETWEEN 6 PRECEDING AND CURRENT ROW\n    ), 0\n  ) AS rolling_7d_avg\nFROM pipeline_runs\nWHERE status = 'success'\nORDER BY pipeline_name, run_id;",
    whyMatters: 'Rolling averages smooth noisy time-series data and reveal trends that raw values obscure. A 7-day rolling average of pipeline throughput flattens weekend dips and one-off spikes, showing the true throughput trend. This pattern powers SLA dashboards, anomaly thresholds, and capacity planning projections.',
    wrongApproach: 'AVG(rows_processed) OVER (PARTITION BY pipeline_name ORDER BY run_id) without a ROWS frame computes a cumulative average — it grows monotonically and never reflects recent trends. The ROWS frame is mandatory for rolling windows. ROWS BETWEEN N PRECEDING AND CURRENT ROW defines a sliding window of exactly N+1 rows.',
    optimizationNote: 'ROWS frames are based on row count, not calendar time. If some days have no runs (weekends, failures), ROWS BETWEEN 6 PRECEDING gives "last 7 runs" not "last 7 days." For true calendar 7-day windows: RANGE BETWEEN INTERVAL 7 DAYS PRECEDING AND CURRENT ROW on a timestamp column. Production SLA dashboards use RANGE for calendar semantics.',
    engineeringContext: 'Rolling window aggregations are the backbone of Databricks pipeline monitoring dashboards, Grafana metric alerts, and business KPI trend lines. The ROWS vs RANGE frame distinction is a classic senior SQL interview question — get it wrong and your "weekly average" is actually a "last-N-runs average" that misses calendar gaps.',
    performanceNote: 'Window functions with ROWS frames are O(n) per partition — efficient. RANGE frames with INTERVAL require dynamic boundary evaluation per row and can be slower on unsorted data. Ensure ORDER BY column is the partition column (run_date) for best optimizer behavior. Pre-filter to successful runs before the window to minimize the sort input.',
    interviewExpectation: "Seniors immediately distinguish ROWS vs RANGE: 'ROWS BETWEEN 6 PRECEDING gives the last 6 rows; RANGE BETWEEN INTERVAL 7 DAYS PRECEDING gives the last 7 calendar days — different results when runs are missing.' They also discuss: PARTITION BY to reset per pipeline, filtering failed runs before the window, and using RANGE for calendar-day semantics in production dashboards.",
  },
  {
    id: 'q40', difficulty: 'advanced', title: 'Anomaly Detection: Statistical Outliers',
    prompt: `Business scenario: Flag pipeline runs where rows_processed is more than 2 standard deviations below the historical mean — these are likely upstream data issues.

Pattern:
  1. CTE "stats" — AVG and STDDEV per pipeline (successful runs only)
  2. Main query — JOIN stats back, evaluate rows_processed < avg - 2*stddev

Return: run_id, pipeline_name, rows_processed, avg_rows (rounded), is_anomaly (true/false)

Tables: pipeline_runs`,
    hint1: "WITH stats AS (SELECT pipeline_name, AVG(rows_processed) AS avg_rows, STDDEV(rows_processed) AS stddev_rows FROM pipeline_runs WHERE status = 'success' GROUP BY pipeline_name)",
    hint2: 'INNER JOIN stats s ON p.pipeline_name = s.pipeline_name',
    hint3: "CASE WHEN p.rows_processed < s.avg_rows - 2 * s.stddev_rows THEN true ELSE false END AS is_anomaly",
    validate: r => !r.error,
    expectedOutput: [
      { run_id: 1,  pipeline_name: 'orders_etl', rows_processed: 15420, avg_rows: 15880, is_anomaly: false },
      { run_id: 5,  pipeline_name: 'orders_etl', rows_processed: 16001, avg_rows: 15880, is_anomaly: false },
      { run_id: 8,  pipeline_name: 'orders_etl', rows_processed: 14900, avg_rows: 15880, is_anomaly: false },
      { run_id: 10, pipeline_name: 'orders_etl', rows_processed: 17200, avg_rows: 15880, is_anomaly: false },
    ],
    answer: "WITH stats AS (\n  SELECT\n    pipeline_name,\n    AVG(rows_processed)    AS avg_rows,\n    STDDEV(rows_processed) AS stddev_rows\n  FROM pipeline_runs\n  WHERE status = 'success'\n  GROUP BY pipeline_name\n)\nSELECT\n  p.run_id,\n  p.pipeline_name,\n  p.rows_processed,\n  ROUND(s.avg_rows, 0) AS avg_rows,\n  CASE\n    WHEN p.rows_processed < s.avg_rows - 2 * s.stddev_rows THEN true\n    ELSE false\n  END AS is_anomaly\nFROM pipeline_runs p\nINNER JOIN stats s ON p.pipeline_name = s.pipeline_name\nWHERE p.status = 'success'\nORDER BY p.pipeline_name, p.run_id;",
    whyMatters: 'The 2-sigma rule (mean ± 2×stddev) is the foundational statistical anomaly detection pattern. A sudden drop in rows_processed often indicates upstream source failures, schema changes, or pipeline bugs — catching it automatically prevents stale dashboards and undetected data loss.',
    wrongApproach: "Fixed thresholds (rows_processed < 10000) require manual tuning per pipeline and break when baseline throughput changes. The stddev-based approach is self-calibrating — it adapts as the pipeline's normal range shifts over time without parameter updates. Use 3-sigma for high-volume pipelines to reduce false positives.",
    optimizationNote: 'For real-time anomaly detection, maintain a stats table updated daily (not computed on every alert check). Use a rolling STDDEV window (last 30 runs) rather than all-time STDDEV for adaptive bounds. Schedule a daily dbt model to update pipeline_run_stats, then trigger alerts when is_anomaly = true via Great Expectations or Monte Carlo.',
    engineeringContext: 'Statistical anomaly detection on pipeline metadata is a senior DE interview topic at data platform teams (Uber, Lyft, DoorDash, Airbnb). The 2-sigma rule catches ~95% of anomalies. This pattern also appears in data quality checks on null rates (flag if null_rate > avg_null_rate + 2*stddev) and schema drift detection.',
    performanceNote: 'STDDEV is a two-pass algorithm requiring the mean first, then squared deviations. In Spark, STDDEV triggers an extra shuffle. For approximate bounds on very large datasets, use approx_percentile() for IQR-based anomaly detection — single-pass and more robust to outliers than stddev (which is sensitive to extreme values).',
    interviewExpectation: "Seniors mention: (1) statistical approach vs fixed thresholds and why adaptive is better; (2) rolling window for adaptive bounds (last 30 runs not all-time); (3) STDDEV_SAMP vs STDDEV_POP — use SAMP for small historical windows; (4) one-sided anomaly (only flag too-low for row counts); (5) PagerDuty/Slack alerting when is_anomaly = true.",
  },
  {
    id: 'q41', difficulty: 'advanced', title: 'Gap Detection: Missing Pipeline Runs',
    prompt: `Business scenario: Your orders_etl pipeline should run daily. Detect any date gaps in the successful run history using LAG to compute the gap between consecutive run dates.

Return gaps: pipeline_name, run_date, prev_run_date, days_gap — where days_gap > 1

Tables: pipeline_runs
Filter: pipeline_name = 'orders_etl', status = 'success'`,
    hint1: "WITH runs AS (SELECT pipeline_name, run_date, LAG(run_date) OVER (PARTITION BY pipeline_name ORDER BY run_date) AS prev_run_date FROM pipeline_runs WHERE status = 'success' AND pipeline_name = 'orders_etl')",
    hint2: 'DATEDIFF(run_date, prev_run_date) AS days_gap',
    hint3: "SELECT * FROM runs WHERE DATEDIFF(run_date, prev_run_date) > 1 ORDER BY run_date",
    validate: r => !r.error,
    expectedOutput: [
      { pipeline_name: 'orders_etl', run_date: '2024-01-17', prev_run_date: '2024-01-15', days_gap: 2 },
    ],
    answer: "WITH ordered_runs AS (\n  SELECT\n    pipeline_name,\n    run_date,\n    LAG(run_date) OVER (\n      PARTITION BY pipeline_name\n      ORDER BY run_date\n    ) AS prev_run_date\n  FROM pipeline_runs\n  WHERE status = 'success'\n    AND pipeline_name = 'orders_etl'\n)\nSELECT\n  pipeline_name,\n  run_date,\n  prev_run_date,\n  DATEDIFF(run_date, prev_run_date) AS days_gap\nFROM ordered_runs\nWHERE DATEDIFF(run_date, prev_run_date) > 1\nORDER BY run_date;",
    whyMatters: 'Gap detection is critical for SLA monitoring. A missed daily pipeline run means downstream dashboards are stale and business decisions are made on incomplete data. Automated gap detection queries run as data quality checks to page on-call engineers before anyone notices a stale dashboard.',
    wrongApproach: 'The LAG approach detects the gap boundary but not the specific missing dates. For a complete list of all missing dates, LEFT JOIN to a generated calendar series and find NULL rows. The LAG approach is simpler and works without a calendar table — use it for alerting, use the calendar join for the full audit report.',
    optimizationNote: 'For a comprehensive SLA report across all pipelines: remove the pipeline_name filter and add it to PARTITION BY. This detects gaps for every pipeline simultaneously in one query. Schedule this as a daily dbt test: "Assert that no gaps > 1 day exist in pipeline_runs for any pipeline with expected_frequency = daily."',
    engineeringContext: 'Gap detection queries appear in data platform SLA dashboards at every data-mature company. Airflow detects missing DAG runs natively, but SQL-based gap detection on pipeline metadata is used for cross-pipeline analysis, historical audits, and compliance reporting. Common in Databricks Delta Live Tables pipeline monitoring.',
    performanceNote: 'LAG on a partitioned, indexed run_date is an O(n) single-pass operation — very fast on pipeline metadata tables (typically < 1M rows). Pre-filter to the last 30 days before applying LAG to minimize window sort cost. For the calendar join approach to find all missing dates, pre-generate a date_dim table rather than using a recursive CTE.',
    interviewExpectation: "Seniors immediately ask: 'What constitutes a gap — any missing day including weekends, or only business days?' They distinguish LAG-based detection (boundary only) from calendar-join (all missing dates). They also mention: failed runs vs missing runs are different (pipeline failed ≠ pipeline didn't run), and combining gap detection with failure rate for a complete SLA view.",
  },
  {
    id: 'q42', difficulty: 'advanced', title: 'Surrogate Keys: Stable Hash-Based IDs',
    prompt: `Business scenario: Generate stable, deterministic surrogate keys for dim_customers using MD5 of the composite business key (customer_id + city + status). Hash-based keys survive full table rebuilds without breaking fact table foreign keys.

Generate: LEFT(MD5(CONCAT(CAST(customer_id AS VARCHAR), '|', city, '|', status)), 16) AS surrogate_key

Return: surrogate_key, customer_id, customer_name, city, status
Tables: customers`,
    hint1: "MD5(CONCAT(CAST(customer_id AS VARCHAR), '|', city, '|', status))",
    hint2: "LEFT(..., 16) AS surrogate_key — first 16 hex chars of MD5",
    hint3: "SELECT LEFT(MD5(CONCAT(CAST(customer_id AS VARCHAR),'|',city,'|',status)),16) AS surrogate_key, customer_id, customer_name, city, status FROM customers ORDER BY customer_id",
    validate: r => !r.error,
    expectedOutput: [
      { surrogate_key: '<md5_hash_16>', customer_id: 1, customer_name: 'Alice Johnson', city: 'Austin', status: 'active' },
      { surrogate_key: '<md5_hash_16>', customer_id: 2, customer_name: 'Bob Smith',     city: 'Dallas', status: 'active' },
    ],
    answer: "SELECT\n  LEFT(\n    MD5(CONCAT(CAST(customer_id AS VARCHAR), '|', city, '|', status)),\n    16\n  ) AS surrogate_key,\n  customer_id,\n  customer_name,\n  city,\n  status\nFROM customers\nORDER BY customer_id;\n\n-- dbt equivalent (cross-database):\n-- {{ dbt_utils.generate_surrogate_key(['customer_id', 'city', 'status']) }}",
    whyMatters: 'Hash-based surrogate keys are critical when dimension tables must survive full reloads. Auto-increment IDs change on every rebuild, breaking all fact table foreign key references. Hash keys based on business attributes are deterministic — the same source data always produces the same key, enabling safe MERGE operations.',
    wrongApproach: 'ROW_NUMBER() as a surrogate key is non-deterministic — the same source row gets a different number depending on load order and partitioning. On a table rebuild, ROW_NUMBER=5 may point to a different customer, silently breaking all downstream fact table joins. Always use deterministic hash keys for dimensions.',
    optimizationNote: 'In dbt, use dbt_utils.generate_surrogate_key([\'customer_id\', \'city\', \'status\']) for cross-database compatibility (handles NULL coalescing and hash function differences between BigQuery, Snowflake, Databricks). Store as CHAR(32) (MD5) or CHAR(64) (SHA256) — not VARCHAR, which adds overhead. For join performance, integer surrogate keys are faster than string hashes.',
    engineeringContext: 'Surrogate key generation with hash functions is a core technique in dbt dimension modeling. The dbt_utils.generate_surrogate_key() macro implements this for multi-cloud compatibility. In Databricks Unity Catalog, deterministic hash keys enable consistent JOIN behavior between tables loaded by different jobs across different clusters.',
    performanceNote: 'Hash functions add CPU overhead per row. For billion-row fact tables, pre-compute surrogate keys during Bronze ingestion rather than at query time. MD5 has ~1-in-2^64 collision probability — acceptable for most cases. Use SHA256 for security-sensitive dimensions. Integer sequences join faster than string hashes — use hash keys for correctness, integer sequences for query performance.',
    interviewExpectation: "Seniors explain: (1) determinism — why hash beats auto-increment for rebuild-safe dimensions; (2) NULL handling in CONCAT (use COALESCE(col, '__null__')); (3) MD5 vs SHA256 collision probability tradeoff; (4) the dbt surrogate key pattern; (5) storage cost (CHAR(32) per row × billions of rows = significant). They generate the key during ingestion, not at query time.",
  },
  {
    id: 'q43', difficulty: 'advanced', title: 'CDC MERGE: Upsert from Change Stream',
    prompt: `Business scenario: You receive CDC events (INSERT/UPDATE/DELETE) from Debezium into a Bronze staging table. Write a MERGE statement that applies them idempotently to the Silver dimension table.

MERGE rules:
- WHEN MATCHED AND data changed → UPDATE the target record
- WHEN NOT MATCHED BY TARGET → INSERT new record
- WHEN MATCHED AND op_type = 'D' → DELETE (handle deletes)

Source: stg_customers_cdc (customer_id, customer_name, city, status, op_type, cdc_ts)
Target: silver.customers (customer_id, customer_name, city, status, updated_at)`,
    hint1: 'MERGE INTO silver.customers AS target USING stg_customers_cdc AS source ON target.customer_id = source.customer_id',
    hint2: "WHEN MATCHED AND (target.city != source.city OR target.status != source.status) THEN UPDATE SET ...",
    hint3: "WHEN NOT MATCHED BY TARGET THEN INSERT (customer_id, customer_name, city, status, updated_at) VALUES (source.*)",
    validate: r => !r.error,
    expectedOutput: [
      { operation: 'MATCHED+changed', customer_id: 3, old_city: 'Austin',  new_city: 'Dallas'  },
      { operation: 'NOT MATCHED',     customer_id: 8, customer_name: 'Henry Liu', city: 'Phoenix' },
    ],
    answer: "MERGE INTO silver.customers AS target\nUSING stg_customers_cdc AS source\n  ON target.customer_id = source.customer_id\n\n-- Update changed records\nWHEN MATCHED\n  AND source.op_type != 'D'\n  AND (target.city   != source.city\n    OR target.status != source.status)\nTHEN UPDATE SET\n  target.customer_name = source.customer_name,\n  target.city          = source.city,\n  target.status        = source.status,\n  target.updated_at    = source.cdc_ts\n\n-- Delete records flagged as deleted in CDC\nWHEN MATCHED AND source.op_type = 'D'\nTHEN DELETE\n\n-- Insert new records\nWHEN NOT MATCHED BY TARGET\nTHEN INSERT (customer_id, customer_name, city, status, updated_at)\nVALUES (\n  source.customer_id,\n  source.customer_name,\n  source.city,\n  source.status,\n  source.cdc_ts\n);",
    whyMatters: 'MERGE (UPSERT) is the standard idempotent write pattern in data lake architectures. Delta Lake MERGE enables exactly-once semantics in CDC pipelines — even if the same CDC event replays, the result is correct. Every production Silver-layer pipeline processing Debezium/Kafka CDC data uses MERGE to consolidate change events.',
    wrongApproach: 'INSERT OVERWRITE for CDC data rewrites entire partitions for single-record updates — on a 10M-row customers dimension, updating 100 changed records rewrites 10M records (100,000× amplification). MERGE touches only the changed rows, making it O(changed_rows) not O(table_size).',
    optimizationNote: 'Delta Lake MERGE performance: pre-filter the source to only changed records (source WHERE cdc_ts > last_merge_ts) to reduce the search space. Enable photon: SET spark.databricks.delta.merge.enableLowShuffle.merge=true for 2–4× faster MERGE. Z-ORDER target on customer_id so Databricks skips non-matching files during the MERGE scan.',
    engineeringContext: 'CDC MERGE is the core pattern in every Databricks Silver-layer pipeline. AWS DMS, Fivetran, Debezium, and Kafka Connect all produce CDC streams that land in Bronze as INSERT/UPDATE/DELETE events. The Silver MERGE consolidates these into the current-state dimension. This is a guaranteed interview question for DE roles at companies with Kafka or DMS pipelines.',
    performanceNote: 'MERGE on Delta Lake requires scanning the target for matching rows. Without Z-ORDER, a 10B-row target MERGE scans every Parquet file. With Z-ORDER BY customer_id, Databricks reads only the files that could contain matching customer_ids — often 1–5% of total files. Combine with LIQUID CLUSTERING (DBR 13+) for automatic layout optimization.',
    interviewExpectation: "Seniors write all 3 MERGE clauses immediately: MATCHED+changed (update), MATCHED+deleted (delete), NOT MATCHED (insert). They discuss: (1) idempotency — same CDC event twice = same result; (2) WHEN MATCHED with no-change condition to avoid unnecessary I/O; (3) Delta Lake transaction log ensuring atomicity; (4) deduplicating the CDC source before MERGE (op_type = latest per key).",
  },
  {
    id: 'q44', difficulty: 'advanced', title: 'Skewed Join: Broadcast & Salt Strategies',
    prompt: `Business scenario: An orders-to-customers JOIN is taking 6 hours instead of 45 seconds. The Spark UI shows one executor processing 80% of the data. Customer_id = 1 (bulk import account) holds 8M of 10M orders.

Three strategies exist:
1. Broadcast hint — for small dimensions (< 10MB)
2. Salt join — for large-table skewed keys
3. AQE skew detection — Spark 3.x automatic

Write the SQL broadcast hint approach and explain the salt join pattern conceptually.

Tables: orders (skewed), customers (small dimension)`,
    hint1: 'SELECT /*+ BROADCAST(c) */ ... FROM orders o INNER JOIN customers c ON o.customer_id = c.customer_id',
    hint2: 'Salt: orders_salted = orders.withColumn("salt", (rand()*N).cast("int"))',
    hint3: 'customers_replicated = customers.crossJoin(spark.range(N)) then JOIN on (customer_id, salt)',
    validate: r => !r.error,
    expectedOutput: [
      { strategy: 'Broadcast hint',    condition: 'Small table < 10MB',        benefit: 'Eliminates shuffle entirely'              },
      { strategy: 'Salt join (N=10)',  condition: 'Skewed key in large table',  benefit: 'Distributes hot key across N partitions'  },
      { strategy: 'AQE skew join',     condition: 'Spark 3.x with AQE enabled', benefit: 'Automatic detection and split at runtime' },
    ],
    answer: "-- Strategy 1: Broadcast hint (customers is small — 7 rows in mock_db)\nSELECT /*+ BROADCAST(c) */\n  c.customer_name,\n  COUNT(o.order_id)  AS order_count,\n  SUM(o.amount)      AS total_revenue\nFROM orders o\nINNER JOIN customers c ON o.customer_id = c.customer_id\nGROUP BY c.customer_name;\n\n-- Strategy 2: Salt join (PySpark — for extreme large-table skew)\n-- N = 10  # salt buckets\n-- orders_salted = orders.withColumn('salt', (F.rand() * N).cast('int'))\n-- customers_rep = customers.crossJoin(spark.range(N).select(col('id').alias('salt')))\n-- result = orders_salted.join(customers_rep, ['customer_id', 'salt'])\n\n-- Strategy 3: AQE (Spark 3.x — automatic, no code change)\n-- SET spark.sql.adaptive.enabled = true;\n-- SET spark.sql.adaptive.skewJoin.enabled = true;\n-- SET spark.sql.adaptive.skewJoin.skewedPartitionThresholdInBytes = '256MB';",
    whyMatters: 'Data skew is the #1 performance killer in distributed SQL and Spark workloads. An 80/20 key distribution causes 80% of work to land on one executor — the rest sit idle. Without skew handling, a 45-second job becomes a 6-hour job. Broadcast, salting, and AQE are the three required tools for any senior DE working with distributed joins.',
    wrongApproach: 'Increasing spark.sql.shuffle.partitions from 200 to 2000 does NOT fix skew. The hot key still lands in one partition regardless of partition count — more partitions just means 1999 empty partitions and one giant one. The only fixes are: eliminate the shuffle (broadcast), distribute the hot key (salt), or let AQE split it (Spark 3.x).',
    optimizationNote: 'In Spark 3.x, enable AQE as the first line of defense: spark.sql.adaptive.enabled=true, spark.sql.adaptive.skewJoin.enabled=true. AQE automatically detects partitions > 5× median size and splits them. For Spark 2.x or when AQE is insufficient, use the broadcast hint for dimensions < 10MB. Manual salting (N=10–50) is the last resort for large-table skewed joins.',
    engineeringContext: 'Skewed join handling is a top-3 Spark performance interview question at Uber, Lyft, DoorDash, Airbnb, and any company running large-scale Spark. The broadcast hint is the first solution for small dimensions; salting is the production solution for large-table skew. AQE in Databricks Runtime 10+ handles most cases automatically.',
    performanceNote: 'Salting multiplies the small table N times (memory cost) and adds a composite JOIN key (CPU cost). Choose N based on skew ratio — 80% of data in one key → N=10 distributes it sufficiently. In Databricks Runtime 10+, AQE skew join is enabled by default and handles most skew cases without manual intervention.',
    interviewExpectation: "Seniors recognize skew from symptoms: 'one executor 10× longer than others' or 'OOM on single executor during JOIN.' They present 3 solutions in order: broadcast → salting → AQE. They explain tradeoffs: broadcast is fastest but limited to small tables; salting has replication overhead; AQE is automatic but requires Spark 3.x. Missing the AQE option in Spark 3.x discussions is a gap.",
  },
];

// ─── Debug challenges — intentionally broken queries ─────────────────────────

const DEBUG_QUESTIONS = [
  {
    id: 'dbg1', title: 'Cartesian Product After Missing JOIN Condition',
    bugType: 'Missing ON clause',
    scenario: 'This query should return 10 rows (one per order with customer name). It returns 70 rows instead. Find and fix the bug.',
    brokenSql: "-- Expected: 10 rows (one per order)\n-- Actual: 70 rows — why?\nSELECT\n  customers.customer_name,\n  orders.order_id,\n  orders.amount\nFROM customers, orders\nORDER BY orders.amount DESC;",
    bugDescription: 'The FROM clause uses a comma-separated list with no JOIN condition — this creates a Cartesian product: 7 customers × 10 orders = 70 rows. Every customer is paired with every order regardless of relationship.',
    fixedSql: "SELECT\n  customers.customer_name,\n  orders.order_id,\n  orders.amount\nFROM customers\nINNER JOIN orders ON customers.customer_id = orders.customer_id\nORDER BY orders.amount DESC;",
    hint: 'Check the FROM clause — is there a JOIN condition linking customers to orders?',
    interviewNote: 'In production on billion-row tables, a Cartesian product generates terabytes of shuffle data and crashes the cluster. Always verify row counts after JOINs: expected = n_fact_rows, not n_dim × n_fact.',
  },
  {
    id: 'dbg2', title: 'Missing PARTITION BY in ROW_NUMBER',
    bugType: 'Missing PARTITION BY',
    scenario: 'This query should return 3 rows — the most recent run per pipeline. It returns only 1 row. Find the bug.',
    brokenSql: "-- Expected: 3 rows (one per pipeline)\n-- Actual: 1 row\nWITH latest AS (\n  SELECT *,\n    ROW_NUMBER() OVER (ORDER BY run_id DESC) AS rn\n  FROM pipeline_runs\n)\nSELECT pipeline_name, status, rows_processed\nFROM latest\nWHERE rn = 1;",
    bugDescription: 'ROW_NUMBER() OVER (ORDER BY run_id DESC) has no PARTITION BY — it ranks ALL rows globally. rn = 1 is only the single row with the highest run_id across all pipelines, not the top row per pipeline.',
    fixedSql: "WITH latest AS (\n  SELECT *,\n    ROW_NUMBER() OVER (\n      PARTITION BY pipeline_name  -- ← the critical fix\n      ORDER BY run_id DESC\n    ) AS rn\n  FROM pipeline_runs\n)\nSELECT pipeline_name, status, rows_processed\nFROM latest\nWHERE rn = 1\nORDER BY pipeline_name;",
    hint: 'Look at the OVER clause — does it have PARTITION BY to reset the counter per group?',
    interviewNote: 'This is the most common window function bug in production code. It runs without error and returns wrong results silently. Always verify: row count after WHERE rn = 1 should equal the number of distinct partition values (here: 3 pipelines).',
  },
  {
    id: 'dbg3', title: 'Missing WHERE rn = 1 Filter',
    bugType: 'Missing dedup filter',
    scenario: 'This deduplication query should return one customer per city (highest customer_id). It returns all 7 rows instead. Find the bug.',
    brokenSql: "-- Expected: one customer per city\n-- Actual: all 7 rows returned\nWITH deduped AS (\n  SELECT *,\n    ROW_NUMBER() OVER (\n      PARTITION BY city\n      ORDER BY customer_id DESC\n    ) AS rn\n  FROM customers\n)\nSELECT customer_id, customer_name, city\nFROM deduped\nORDER BY city;",
    bugDescription: 'The CTE correctly assigns row numbers but the outer SELECT never filters WHERE rn = 1. Without that filter ALL rows are returned — the ROW_NUMBER column exists in the result but is never used to deduplicate.',
    fixedSql: "WITH deduped AS (\n  SELECT *,\n    ROW_NUMBER() OVER (\n      PARTITION BY city\n      ORDER BY customer_id DESC\n    ) AS rn\n  FROM customers\n)\nSELECT customer_id, customer_name, city\nFROM deduped\nWHERE rn = 1  -- ← the missing dedup filter\nORDER BY city;",
    hint: 'Look at the outer SELECT — which filter on the rn column is missing?',
    interviewNote: 'Easy to miss in code review — the CTE logic looks correct. Always validate dedup results: COUNT(*) should equal COUNT(DISTINCT partition_key). If they differ, the dedup filter is missing or incorrect.',
  },
  {
    id: 'dbg4', title: 'Aggregate Function in WHERE Clause',
    bugType: 'WHERE vs HAVING',
    scenario: "This query tries to find pipelines with more than 2 runs. It throws a syntax error: 'aggregate functions are not allowed in WHERE'. Fix it.",
    brokenSql: "-- Error: aggregate functions not allowed in WHERE\nSELECT\n  pipeline_name,\n  COUNT(*) AS run_count\nFROM pipeline_runs\nWHERE COUNT(*) > 2\nGROUP BY pipeline_name;",
    bugDescription: "WHERE is evaluated BEFORE GROUP BY — at the WHERE stage there are no groups yet, so COUNT(*) is undefined. Aggregate functions cannot appear in WHERE. HAVING is evaluated AFTER GROUP BY and is the correct place for aggregate conditions.",
    fixedSql: "SELECT\n  pipeline_name,\n  COUNT(*) AS run_count\nFROM pipeline_runs\nGROUP BY pipeline_name\nHAVING COUNT(*) > 2;  -- ← HAVING filters after aggregation",
    hint: 'SQL execution order: FROM → WHERE → GROUP BY → HAVING → SELECT. Which clause runs after GROUP BY?',
    interviewNote: 'Classic interview question: "Explain the difference between WHERE and HAVING." WHERE filters rows before aggregation. HAVING filters groups after aggregation. You can combine both: WHERE status = \'success\' (filter rows first) HAVING COUNT(*) > 2 (then filter groups) for best performance.',
  },
  {
    id: 'dbg5', title: 'Off-by-One Watermark Boundary',
    bugType: 'Incorrect > vs >= boundary',
    scenario: "Your incremental pipeline uses watermark '2024-01-18'. One order from exactly that date is silently missing from the Silver layer every day this query runs. Find and fix the bug.",
    brokenSql: "-- Watermark: '2024-01-18' (last processed date)\n-- Bug: order_id 104 (created_at = '2024-01-18') is permanently excluded\nSELECT order_id, customer_id, amount, created_at\nFROM orders\nWHERE created_at > '2024-01-18'\nORDER BY created_at;",
    bugDescription: "The > '2024-01-18' filter excludes orders on exactly the watermark date. If the previous run processed up to (but including) 2024-01-18, then today's run with > misses it. When combined with a reprocessing scenario, boundary rows are permanently lost.",
    fixedSql: "-- Option 1: Use >= for safe reprocessing of boundary date\nSELECT order_id, customer_id, amount, created_at\nFROM orders\nWHERE created_at >= '2024-01-18'\nORDER BY created_at;\n\n-- Option 2 (production): Use MERGE to make reruns idempotent\n-- Even if the boundary row loads twice, MERGE deduplicates it\n-- MERGE INTO silver.orders USING new_batch ON order_id MATCH\n-- WHEN MATCHED THEN UPDATE\n-- WHEN NOT MATCHED THEN INSERT",
    hint: 'Should the filter use > (exclusive) or >= (inclusive) to avoid losing boundary-date records?',
    interviewNote: 'Watermark boundary bugs are silent — the pipeline succeeds but rows are lost. In production: use >= with MERGE to make reruns idempotent. Always cross-check source row count vs target row count per partition after every incremental load.',
  },
];

// ─── Production incident scenarios ───────────────────────────────────────────

const PRODUCTION_INCIDENTS = [
  {
    id: 'inc1', title: 'Duplicate CDC Rows Flooding Silver Layer',
    severity: 'P1',
    symptom: 'Silver layer customers table row count doubled overnight (14 → 28 rows). Revenue dashboard shows 2× inflated customer counts. Detected at 08:15, pipeline ran at 02:00.',
    diagnosisQuery: "-- Step 1: Detect duplicates in Silver\nSELECT customer_id, COUNT(*) AS cnt\nFROM silver.customers\nGROUP BY customer_id\nHAVING COUNT(*) > 1;\n\n-- Step 2: Check Bronze for duplicate CDC events\nSELECT customer_id, cdc_ts, COUNT(*)\nFROM bronze.customers_cdc\nWHERE DATE(cdc_ts) = CURRENT_DATE - 1\nGROUP BY customer_id, cdc_ts\nHAVING COUNT(*) > 1;",
    rootCause: 'A team member changed the Silver MERGE to INSERT OVERWRITE "to fix a performance issue." INSERT OVERWRITE appended all historical Bronze records into Silver rather than merging — duplicating every existing row.',
    fixQuery: "-- Step 1: Remove phantom duplicates from Silver\nWITH ranked AS (\n  SELECT *,\n    ROW_NUMBER() OVER (\n      PARTITION BY customer_id ORDER BY cdc_ts DESC\n    ) AS rn\n  FROM silver.customers\n)\nDELETE FROM silver.customers\nWHERE customer_id IN (\n  SELECT customer_id FROM ranked WHERE rn > 1\n);\n\n-- Step 2: Restore MERGE logic\nMERGE INTO silver.customers AS target\nUSING bronze.customers_cdc AS source\n  ON target.customer_id = source.customer_id\nWHEN MATCHED THEN UPDATE SET *\nWHEN NOT MATCHED THEN INSERT *;",
    prevention: '1. Add row-count assertion after every pipeline run: COUNT(*) = COUNT(DISTINCT customer_id). 2. Block INSERT OVERWRITE on Silver tables via Delta Lake column-level permissions. 3. Code review all changes that modify pipeline write modes.',
    lesson: '"Performance fixes" that change INSERT semantics (OVERWRITE vs MERGE) are high-risk schema changes. Always validate row count = expected cardinality before marking a fix complete.',
  },
  {
    id: 'inc2', title: 'NULL Explosion from Wrong JOIN Type',
    severity: 'P2',
    symptom: 'Revenue dashboard shows NULL for amount on 40% of order rows. Total revenue dropped from $2,500 to $1,500. A dbt model was deployed at 03:00.',
    diagnosisQuery: "-- Step 1: Check null rate in affected column\nSELECT\n  COUNT(*) AS total_rows,\n  COUNT(amount) AS non_null_amount,\n  ROUND((COUNT(*) - COUNT(amount)) * 100.0 / COUNT(*), 1) AS null_rate_pct\nFROM gold.orders_enriched;\n\n-- Step 2: Find orders with no product match\nSELECT o.order_id, o.amount, p.product_name\nFROM orders o\nLEFT JOIN products p ON o.order_id = p.product_id\nWHERE p.product_id IS NULL;",
    rootCause: 'A dbt model change accidentally switched INNER JOIN to LEFT JOIN on the orders-to-products enrichment. Orders for deleted products now produce NULL for all product columns. A COALESCE copy-paste error then surfaced NULL as the amount value.',
    fixQuery: "-- Fix: Restore INNER JOIN for required dimension joins\nSELECT\n  o.order_id,\n  o.customer_id,\n  o.amount,         -- use fact table column, not the dimension\n  c.customer_name\nFROM orders o\nINNER JOIN customers c ON o.customer_id = c.customer_id;\n\n-- Add dbt not_null test:\n-- tests:\n--   - not_null:\n--       column_name: amount",
    prevention: '1. Add dbt not_null tests on all financial metric columns. 2. Add pre/post-deploy null rate checks to CI pipeline. 3. Require JOIN type justification in PR descriptions.',
    lesson: 'LEFT JOIN vs INNER JOIN is a high-impact change invisible in code review unless the reviewer knows the expected cardinality. Column-level null rate checks on dashboards catch this class of bug automatically.',
  },
  {
    id: 'inc3', title: 'Skewed Partition Causing Executor OOM',
    severity: 'P1',
    symptom: 'orders_etl Spark job running 6 hours (normally 45 sec). One executor at 8GB (4GB limit). Job failing with java.lang.OutOfMemoryError. Root cause: bulk import created 8M orders for customer_id = 1.',
    diagnosisQuery: "-- Identify skewed keys in orders\nSELECT\n  customer_id,\n  COUNT(*) AS order_count,\n  ROUND(COUNT(*) * 100.0 / SUM(COUNT(*)) OVER (), 1) AS pct_of_total\nFROM orders\nGROUP BY customer_id\nORDER BY order_count DESC\nLIMIT 10;\n\n-- If any key > 10% of total → skew risk",
    rootCause: 'The GROUP BY customer_id in the aggregation step hashes all 8M rows for customer_id=1 to one partition. One executor receives 80% of the data while 199 others sit idle.',
    fixQuery: "-- Fix 1: Broadcast hint for small dimension tables\nSELECT /*+ BROADCAST(c) */\n  c.customer_name,\n  COUNT(o.order_id)  AS order_count,\n  SUM(o.amount)      AS total_revenue\nFROM orders o\nINNER JOIN customers c ON o.customer_id = c.customer_id\nGROUP BY c.customer_name;\n\n-- Fix 2: Enable AQE (Spark 3.x)\n-- SET spark.sql.adaptive.enabled = true;\n-- SET spark.sql.adaptive.skewJoin.enabled = true;\n\n-- Fix 3: Manual salt join (Spark 2.x / extreme skew)\n-- N = 10\n-- orders_salted = orders.withColumn('salt', (rand()*N).cast('int'))\n-- customers_rep = customers.crossJoin(range(N).alias('salt'))\n-- orders_salted.join(customers_rep, ['customer_id','salt'])",
    prevention: '1. Add pre-pipeline cardinality check: if any key holds > 10% of rows, switch to broadcast/AQE strategy. 2. Enable AQE by default in Databricks cluster policy. 3. Monitor Spark UI stage duration for long-tail patterns after every deployment.',
    lesson: 'Data skew is invisible in development (small test data) but catastrophic in production. Adding AQE to the cluster configuration is a one-time fix that prevents most future skew incidents automatically.',
  },
  {
    id: 'inc4', title: 'Stale Dashboard from Silent Zero-Row Pipeline',
    severity: 'P2',
    symptom: "Revenue dashboard hasn't updated in 2 days. Pipeline shows green — all runs report SUCCESS with 0 rows_processed. No alerts triggered. Last real data: 2024-01-17.",
    diagnosisQuery: "-- Step 1: Check recent pipeline runs — notice 0 rows\nSELECT run_date, pipeline_name, status, rows_processed\nFROM pipeline_runs\nWHERE pipeline_name = 'orders_etl'\nORDER BY run_date DESC LIMIT 7;\n\n-- Step 2: Check current watermark vs source data freshness\nSELECT MAX(created_at) AS last_loaded FROM silver.orders;\n\n-- Step 3: Count new source rows after the watermark\nSELECT COUNT(*) AS unloaded_rows\nFROM bronze.orders\nWHERE created_at > (SELECT MAX(created_at) FROM silver.orders);",
    rootCause: "Watermark was accidentally set to '2099-12-31' during a test. The WHERE created_at > '2099-12-31' clause returns 0 rows from source — no error, no failure, status = SUCCESS because 0 rows is a valid run result.",
    fixQuery: "-- Fix 1: Correct the watermark\n-- Set pipeline_control.watermark = '2024-01-17'\n\n-- Fix 2: Add minimum rows assertion\n-- IF rows_processed = 0 AND expected_rows > 0 THEN\n--   RAISE 'Pipeline loaded 0 rows — check watermark'\n\n-- Fix 3: Add data freshness SLA check\nSELECT\n  CASE\n    WHEN MAX(created_at) < CURRENT_DATE - 1\n    THEN 'STALE — last update: ' || MAX(created_at)\n    ELSE 'FRESH'\n  END AS freshness_status\nFROM silver.orders;",
    prevention: '1. Alert if rows_processed = 0 AND expected_rows > 0 (mark as FAILED not SUCCESS). 2. Add data freshness SLA: if MAX(updated_at) in target < CURRENT_DATE - 1, trigger P2 alert. 3. Validate all pipeline parameters before deployment — never allow hardcoded future dates.',
    lesson: '"SUCCESS" means the pipeline ran without an error — it does NOT mean the data is fresh or correct. Always validate rows_processed > expected_minimum and that MAX(updated_at) is within the SLA window as a separate quality check.',
  },
  {
    id: 'inc5', title: 'Phantom Records from Broken SCD2 Merge',
    severity: 'P2',
    symptom: 'dim_customers grows 10–15% daily even on days with no source data changes. After 1 week the table has 5× more rows than the source customer count. Started after a dbt refactor deployed 7 days ago.',
    diagnosisQuery: "-- Step 1: Count active vs historical records\nSELECT is_current, COUNT(*) AS cnt\nFROM dim_customers\nGROUP BY is_current;\n\n-- Step 2: Find customers with multiple current records\n-- (should be impossible in a correct SCD2 table)\nSELECT customer_id, COUNT(*) AS current_count\nFROM dim_customers\nWHERE is_current = true\nGROUP BY customer_id\nHAVING COUNT(*) > 1;\n\n-- Step 3: Detect phantom duplicates\nSELECT d1.customer_id, d1.city, d1.status\nFROM dim_customers d1\nJOIN dim_customers d2\n  ON d1.customer_id = d2.customer_id\n  AND d1.record_id != d2.record_id\n  AND d1.city = d2.city AND d1.status = d2.status\nWHERE d1.is_current = true AND d2.is_current = true;",
    rootCause: "The SCD2 MERGE was missing AND is_current = true in the ON clause. Without it, the MERGE matched both current AND historical records. For each historical record it found, it inserted a new 'current' duplicate — phantom records growing daily even with no real changes.",
    fixQuery: "-- Step 1: Remove phantom records (keep latest per customer)\nWITH ranked AS (\n  SELECT *,\n    ROW_NUMBER() OVER (\n      PARTITION BY customer_id ORDER BY effective_date DESC\n    ) AS rn\n  FROM dim_customers\n  WHERE is_current = true\n)\nDELETE FROM dim_customers\nWHERE record_id IN (SELECT record_id FROM ranked WHERE rn > 1);\n\n-- Step 2: Fix the MERGE ON clause\nMERGE INTO dim_customers AS target\nUSING stg_customers AS source\n  ON target.customer_id = source.customer_id\n  AND target.is_current = true  -- ← the critical missing filter\nWHEN MATCHED AND (target.city != source.city OR target.status != source.status)\n  THEN UPDATE SET is_current = false, end_date = CURRENT_DATE\nWHEN NOT MATCHED\n  THEN INSERT (customer_id, city, status, is_current, effective_date)\n  VALUES (source.customer_id, source.city, source.status, true, CURRENT_DATE);",
    prevention: '1. Add uniqueness assertion: COUNT(*) WHERE is_current = true = COUNT(DISTINCT customer_id). 2. Monitor dimension table growth rate — > 5% daily growth with no source changes is anomalous. 3. In dbt: add unique test on customer_id WHERE is_current = true.',
    lesson: 'SCD2 MERGE without AND is_current = true in the ON clause is a silent correctness bug. Always include a post-merge assertion that COUNT(DISTINCT customer_id) WHERE is_current = true equals the source system customer count.',
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

// ─── Mismatch analysis ────────────────────────────────────────────────────────

function analyzeMismatch(question, result) {
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
  const [showExpected, setShowExpected] = useState(false);

  useEffect(() => { setShowExpected(false); }, [question.id]);

  const mismatch = (!passed && result && !result.error && !result.complex)
    ? analyzeMismatch(question, result)
    : null;

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

      {result && !result.error && (passed || result.complex) && (
        <div className={`sqll-validate ${result.complex ? 'sqll-validate--complex' : 'sqll-validate--pass'}`}>
          {result.complex ? '◈ Advanced query — check expected output below' : '✓ Output matches expected'}
        </div>
      )}

      {mismatch && (
        <div className="sqll-mismatch">
          <div className="sqll-mismatch-header">
            <span className="sqll-mismatch-icon">✗</span>
            <span className="sqll-mismatch-title">Output mismatch</span>
            {mismatch.isClose && (
              <span className="sqll-mismatch-close">Your query is close — check column order, row order, or exact filter</span>
            )}
          </div>

          <div className="sqll-mismatch-grid">
            <div className="sqll-mismatch-cell">
              <span className="sqll-mismatch-label">Expected</span>
              <span className="sqll-mismatch-val">{mismatch.expectedRowCount} row{mismatch.expectedRowCount !== 1 ? 's' : ''}</span>
              <span className="sqll-mismatch-cols">{mismatch.expectedColumns.join(', ')}</span>
            </div>
            <div className="sqll-mismatch-sep">vs</div>
            <div className="sqll-mismatch-cell sqll-mismatch-cell--actual">
              <span className="sqll-mismatch-label">Your output</span>
              <span className="sqll-mismatch-val">{mismatch.actualRowCount} row{mismatch.actualRowCount !== 1 ? 's' : ''}</span>
              <span className="sqll-mismatch-cols">{mismatch.actualColumns.length > 0 ? mismatch.actualColumns.join(', ') : '—'}</span>
            </div>
          </div>

          <div className="sqll-mismatch-detail">
            <span className="sqll-mismatch-detail-label">Likely issue:</span>
            <span>{mismatch.likelyIssue}</span>
          </div>
          <div className="sqll-mismatch-detail sqll-mismatch-detail--hint">
            <span className="sqll-mismatch-detail-label">Next step:</span>
            <span>{mismatch.hint}</span>
          </div>

          <button type="button" className="sqll-show-expected-btn" onClick={() => setShowExpected(v => !v)}>
            {showExpected ? '▾ Hide expected output' : '▸ Show expected output'}
          </button>

          {showExpected && (
            <div className="sqll-compare">
              <div className="sqll-compare-col">
                <div className="sqll-compare-label sqll-compare-label--exp">
                  Expected — {mismatch.expectedRowCount} row{mismatch.expectedRowCount !== 1 ? 's' : ''}{mismatch.expectedRowCount > 5 ? ' (first 5)' : ''}
                </div>
                <div className="sqll-compare-scroll">
                  <table className="sqll-compare-table">
                    <thead><tr>{mismatch.expectedColumns.map(c => <th key={c}>{c}</th>)}</tr></thead>
                    <tbody>
                      {mismatch.expectedRows.map((row, i) => (
                        <tr key={i}>{mismatch.expectedColumns.map(c => (
                          <td key={c}>{row[c] == null ? <span className="sqll-null">NULL</span> : String(row[c])}</td>
                        ))}</tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
              <div className="sqll-compare-col">
                <div className="sqll-compare-label sqll-compare-label--act">
                  Your output — {mismatch.actualRowCount} row{mismatch.actualRowCount !== 1 ? 's' : ''}{mismatch.actualRowCount > 5 ? ' (first 5)' : ''}
                </div>
                <div className="sqll-compare-scroll">
                  <table className="sqll-compare-table">
                    <thead><tr>{mismatch.actualColumns.map(c => <th key={c}>{c}</th>)}</tr></thead>
                    <tbody>
                      {mismatch.actualRows.map((row, i) => (
                        <tr key={i}>{mismatch.actualColumns.map(c => (
                          <td key={c}>{row[c] == null ? <span className="sqll-null">NULL</span> : String(row[c])}</td>
                        ))}</tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}
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
              {question.engineeringContext && (
                <div className="sqll-eng-block sqll-eng-block--ctx">
                  <span className="sqll-eng-label">Engineering context</span>
                  <p>{question.engineeringContext}</p>
                </div>
              )}
              {question.performanceNote && (
                <div className="sqll-eng-block sqll-eng-block--perf">
                  <span className="sqll-eng-label">Performance note</span>
                  <p>{question.performanceNote}</p>
                </div>
              )}
              {question.interviewExpectation && (
                <div className="sqll-eng-block sqll-eng-block--interview">
                  <span className="sqll-eng-label">What interviewers expect</span>
                  <p>{question.interviewExpectation}</p>
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// ─── Debug Panel ─────────────────────────────────────────────────────────────

function DebugPanel({ question, onScore, score, onLoadQuery }) {
  const [revealed, setRevealed] = useState(false);
  useEffect(() => { setRevealed(false); }, [question.id]);

  return (
    <div className="sqll-qpanel">
      <div className="sqll-qpanel-head">
        <span className="sqll-qpanel-label">Debug Challenge</span>
        <span className="sqll-qdiff" style={{ background: '#431407 20', color: '#fb923c', border: '1px solid #92400e40' }}>
          bug
        </span>
      </div>
      <h3 className="sqll-qtitle">{question.title}</h3>

      <div className="sqll-debug-meta">
        <span className="sqll-debug-type-label">Bug category:</span>
        <code className="sqll-debug-type">{question.bugType}</code>
      </div>

      <p className="sqll-qprompt">{question.scenario}</p>

      <button
        type="button"
        className="sqll-hint-btn"
        style={{ marginBottom: 8 }}
        onClick={() => onLoadQuery(question.brokenSql)}
      >
        ↳ Load broken query
      </button>

      <div className="sqll-hint sqll-hint--1">{question.hint}</div>

      {!score && (
        <div className="sqll-self-score">
          <p className="sqll-self-label">Did you find and fix the bug?</p>
          <div className="sqll-score-btns">
            <button type="button" className="sqll-score-btn sqll-score-btn--miss" onClick={() => { setRevealed(true); onScore('miss'); }}>✗ Missed it</button>
            <button type="button" className="sqll-score-btn sqll-score-btn--almost" onClick={() => { setRevealed(true); onScore('almost'); }}>~ Partially</button>
            <button type="button" className="sqll-score-btn sqll-score-btn--got" onClick={() => { setRevealed(true); onScore('got'); }}>✓ Fixed it</button>
          </div>
        </div>
      )}
      {score && (
        <div className={`sqll-score-result sqll-score-result--${score}`}>
          {score === 'got' ? '✓ Bug found & fixed' : score === 'almost' ? '~ Partially correct — review the fix' : '✗ Missed — study the root cause'}
        </div>
      )}

      {(revealed || score) && (
        <div className="sqll-eng-context">
          <div className="sqll-eng-body">
            <div className="sqll-eng-block sqll-eng-block--wrong">
              <span className="sqll-eng-label">Root cause</span>
              <p>{question.bugDescription}</p>
            </div>
            <div className="sqll-eng-block sqll-eng-block--opt">
              <span className="sqll-eng-label">Fixed query</span>
              <pre className="sqll-debug-fixed">{question.fixedSql}</pre>
            </div>
            <div className="sqll-eng-block sqll-eng-block--ctx">
              <span className="sqll-eng-label">Interview note</span>
              <p>{question.interviewNote}</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Incident Panel ───────────────────────────────────────────────────────────

function IncidentPanel() {
  const [openId, setOpenId] = useState(null);
  const SEV = { P1: { bg: '#450a0a30', color: '#fca5a5', border: '#991b1b40' }, P2: { bg: '#451a0330', color: '#fcd34d', border: '#92400e40' } };

  return (
    <div className="sqll-incidents">
      <div className="sqll-incidents-header">
        <span className="sqll-incidents-title">Production Incident SQL — Study Mode</span>
        <span className="sqll-incidents-sub">Real patterns from data engineering on-call. Diagnose the symptom, understand the root cause, apply the fix.</span>
      </div>
      {PRODUCTION_INCIDENTS.map(inc => {
        const s = SEV[inc.severity] ?? SEV.P2;
        const open = openId === inc.id;
        return (
          <div key={inc.id} className="sqll-incident-card">
            <button
              type="button"
              className="sqll-incident-header"
              onClick={() => setOpenId(open ? null : inc.id)}
            >
              <span className="sqll-incident-sev" style={{ background: s.bg, color: s.color, border: `1px solid ${s.border}` }}>{inc.severity}</span>
              <span className="sqll-incident-title-text">{inc.title}</span>
              <span className="sqll-incident-chevron">{open ? '▾' : '▸'}</span>
            </button>

            {open && (
              <div className="sqll-incident-body">
                <div className="sqll-eng-block sqll-eng-block--wrong">
                  <span className="sqll-eng-label">Symptom</span>
                  <p>{inc.symptom}</p>
                </div>
                <div className="sqll-eng-block" style={{ background: '#0c1219', border: '1px solid #1e2d3d' }}>
                  <span className="sqll-eng-label" style={{ color: '#38bdf8' }}>Diagnosis query</span>
                  <pre className="sqll-incident-sql">{inc.diagnosisQuery}</pre>
                </div>
                <div className="sqll-eng-block sqll-eng-block--why">
                  <span className="sqll-eng-label">Root cause</span>
                  <p>{inc.rootCause}</p>
                </div>
                <div className="sqll-eng-block sqll-eng-block--opt">
                  <span className="sqll-eng-label">Fix query</span>
                  <pre className="sqll-incident-sql">{inc.fixQuery}</pre>
                </div>
                <div className="sqll-eng-block sqll-eng-block--ctx">
                  <span className="sqll-eng-label">Prevention</span>
                  <p>{inc.prevention}</p>
                </div>
                <div className="sqll-eng-block sqll-eng-block--interview">
                  <span className="sqll-eng-label">Lesson learned</span>
                  <p>{inc.lesson}</p>
                </div>
              </div>
            )}
          </div>
        );
      })}
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

  // Debug mode state
  const [dbgIdx, setDbgIdx]       = useState(0);
  const [dbgScores, setDbgScores] = useState([]);
  const [dbgDone, setDbgDone]     = useState(false);

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

  function resetDebug() {
    setDbgIdx(0); setDbgScores([]); setDbgDone(false); setResult(null);
    editorRef.current?.setValue('-- Load a broken query using the button →\n');
  }

  function switchMode(m) {
    setMode(m);
    setResult(null);
    if (m === 'interview') resetInterview();
    else if (m === 'debug') resetDebug();
    else if (m === 'incident') { /* read-only mode, no editor change */ }
    else {
      editorRef.current?.setValue("SELECT *\nFROM customers\nLIMIT 5;");
    }
  }

  const isInterview = mode === 'interview';
  const isDebug     = mode === 'debug';
  const isIncident  = mode === 'incident';

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

  // ── Debug completion ──────────────────────────────────────────────────────
  if (isDebug && dbgDone) {
    const got = dbgScores.filter(s => s === 'got').length;
    return (
      <section className="section" id="sql-lab">
        <div className="sqll-header">
          <div><p className="eyebrow">SQL Lab</p><h2>Debug Session Complete</h2></div>
        </div>
        <div className="sqll-done">
          <div className="sqll-done-score">
            <span className="sqll-done-pct">{got}/{DEBUG_QUESTIONS.length}</span>
            <span className="sqll-done-sub">bugs found and fixed</span>
          </div>
          <p className="sqll-done-msg">
            {got >= 4
              ? '✦ Sharp debugging instincts — you caught the production-critical patterns.'
              : got >= 2
              ? '◈ Good start — review the missed bugs, they appear in real production code.'
              : '◎ Keep practising — these bugs cause silent data loss in production pipelines.'}
          </p>
          <div className="sqll-done-list">
            {DEBUG_QUESTIONS.map((q, i) => (
              <div key={q.id} className={`sqll-done-row sqll-done-row--${dbgScores[i] ?? 'skip'}`}>
                <span className="sqll-done-icon">{dbgScores[i] === 'got' ? '✓' : dbgScores[i] === 'almost' ? '~' : '✗'}</span>
                <span className="sqll-done-title">{q.title}</span>
                <span className="sqll-done-diff">{q.bugType}</span>
              </div>
            ))}
          </div>
          <button type="button" className="secondary-button" onClick={resetDebug}>↺ Retry debug session</button>
        </div>
      </section>
    );
  }

  // ── Incident reference mode ───────────────────────────────────────────────
  if (isIncident) {
    return (
      <section className="section" id="sql-lab">
        <div className="sqll-header">
          <div><p className="eyebrow">SQL Lab</p><h2>Production Incident SQL</h2></div>
          <div className="sqll-modes">
            {[
              { id: 'practice',  label: '◎ Practice'   },
              { id: 'interview', label: '⏱ Interview'  },
              { id: 'debug',     label: '☰ Debug'      },
              { id: 'incident',  label: '⚠ Incidents'  },
            ].map(m => (
              <button key={m.id} type="button"
                className={`sqll-mode-btn${mode === m.id ? ' sqll-mode-btn--on' : ''}`}
                onClick={() => switchMode(m.id)}
              >{m.label}</button>
            ))}
          </div>
        </div>
        <IncidentPanel />
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
            { id: 'debug',     label: '☰ Debug'     },
            { id: 'incident',  label: '⚠ Incidents' },
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

      {/* Debug progress bar */}
      {isDebug && !dbgDone && (
        <div className="sqll-progress">
          <div className="sqll-progress-bar">
            <div className="sqll-progress-fill" style={{ width: `${(dbgIdx / DEBUG_QUESTIONS.length) * 100}%`, background: '#fb923c' }} />
          </div>
          <span className="sqll-progress-label">Bug {dbgIdx + 1} / {DEBUG_QUESTIONS.length}</span>
          {dbgScores.filter(s => s === 'got').length > 0 && (
            <span className="sqll-progress-score" style={{ color: '#fb923c' }}>✓ {dbgScores.filter(s => s === 'got').length} fixed</span>
          )}
        </div>
      )}

      {/* Workspace grid */}
      <div className={`sqll-workspace${(isInterview || isDebug) ? ' sqll-workspace--interview' : ''}`}>
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

        {/* Question panel — interview mode */}
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

        {/* Debug panel */}
        {isDebug && !dbgDone && (
          <DebugPanel
            question={DEBUG_QUESTIONS[dbgIdx]}
            onScore={s => {
              const next = [...dbgScores, s];
              setDbgScores(next);
              if (dbgIdx + 1 >= DEBUG_QUESTIONS.length) {
                setDbgDone(true);
              } else {
                setDbgIdx(i => i + 1);
                setResult(null);
                editorRef.current?.setValue('-- Load the next broken query →\n');
              }
            }}
            score={dbgScores[dbgIdx]}
            onLoadQuery={q => {
              editorRef.current?.setValue(q);
              setResult(null);
            }}
          />
        )}
      </div>
    </section>
  );
});

export default SQLLab;
