// Standalone interview Q&A used by the InterviewPrep page.
// Each level is an independent section; real-world scenarios are scenario-based.

export const sqlInterviewQuestions = {
  beginner: [
    { q: 'What is SQL?', a: 'SQL (Structured Query Language) is used to query and manage data in relational databases.' },
    { q: 'What is a table?', a: 'A table stores data in rows (records) and columns (attributes) — like a spreadsheet.' },
    { q: 'What does SELECT do?', a: 'It specifies which columns to retrieve from a table.' },
    { q: 'What is WHERE used for?', a: 'It filters rows so only rows matching the condition are returned.' },
    { q: 'What is the difference between WHERE and HAVING?', a: 'WHERE filters rows before grouping. HAVING filters groups after GROUP BY runs.' },
    { q: 'What does ORDER BY do?', a: 'It sorts the result set by one or more columns, ascending (ASC) or descending (DESC).' },
    { q: 'What does DISTINCT do?', a: 'It removes duplicate rows from the result.' },
    { q: 'What does GROUP BY do?', a: 'It groups rows with the same value into summary rows so you can apply aggregate functions.' },
    { q: 'What is a NULL value?', a: 'NULL means no value is stored. Use IS NULL or IS NOT NULL to check for it — you cannot use = NULL.' },
    { q: 'What does COUNT(*) return?', a: 'The total number of rows in the result, including NULLs.' },
  ],
  intermediate: [
    { q: 'INNER JOIN vs LEFT JOIN?', a: 'INNER JOIN returns only matching rows. LEFT JOIN returns all left rows, with NULLs for non-matches on the right.' },
    { q: 'What is a CTE and why use it?', a: 'A CTE (Common Table Expression) is a named temporary result defined with WITH. It makes complex queries more readable and allows reuse.' },
    { q: 'UNION vs UNION ALL?', a: 'UNION removes duplicates (slower). UNION ALL keeps all rows (faster). Use UNION ALL unless you specifically need deduplication.' },
    { q: 'What is a subquery?', a: 'A query nested inside another query. Often replaceable with a CTE for readability.' },
    { q: 'What is a window function?', a: 'A function that calculates values across a set of rows related to the current row without collapsing them like GROUP BY.' },
    { q: 'What does PARTITION BY do?', a: 'It divides rows into groups for a window function — like GROUP BY but it keeps all individual rows.' },
    { q: 'What is ROW_NUMBER?', a: 'A window function that assigns a unique sequential integer to each row within a partition.' },
    { q: 'What is the difference between RANK and DENSE_RANK?', a: 'RANK skips numbers after ties (1,1,3). DENSE_RANK never skips (1,1,2).' },
    { q: 'What is a view?', a: 'A saved SQL query stored with a name. Querying it always runs the underlying query against current data.' },
    { q: 'What is EXISTS vs IN?', a: 'EXISTS stops at first match — efficient for large subqueries. IN materialises the entire list first.' },
  ],
  advanced: [
    { q: 'How do you deduplicate rows in SQL?', a: 'Use ROW_NUMBER() OVER (PARTITION BY key ORDER BY updated_at DESC) in a CTE, then SELECT WHERE rn = 1.' },
    { q: 'What is SCD Type 2?', a: 'A dimension table pattern that preserves history by inserting a new row for each change and marking old rows as expired with an end date.' },
    { q: 'SCD Type 1 vs Type 2?', a: 'Type 1 overwrites old data — no history. Type 2 keeps history by adding new rows with effective/expiry dates.' },
    { q: 'What is an incremental load?', a: 'A pipeline that processes only new or changed rows since the last run, using a watermark like updated_at.' },
    { q: 'What is partition pruning?', a: 'The database automatically skips partitions whose key range cannot match the WHERE clause — dramatically reducing scanned data.' },
    { q: 'How do you tune a slow query?', a: 'SELECT only needed columns, filter early with WHERE, add indexes on join/filter columns, and run EXPLAIN to spot full table scans.' },
    { q: 'What is an index and its downside?', a: 'An index speeds up reads. The downside: every INSERT/UPDATE/DELETE must also update the index, adding write overhead.' },
    { q: 'What is the difference between a temp table and a CTE?', a: 'A CTE exists only for one query. A temp table persists for the session, can be indexed, and can be queried multiple times.' },
    { q: 'What is LAG used for?', a: 'LAG accesses a previous row value within a window — useful for calculating day-over-day or month-over-month changes.' },
    { q: 'What are audit columns?', a: 'Columns like created_at, updated_at, created_by that track when and by whom a row was created or changed — essential for debugging pipelines.' },
  ],
  realWorld: [
    {
      scenario: 'A daily report shows double the expected revenue.',
      q: 'How would you diagnose and fix a duplicate data problem in a pipeline?',
      a: "Run: SELECT key, COUNT(*) FROM table GROUP BY key HAVING COUNT(*) > 1. If duplicates exist, trace the pipeline step that introduced them. Fix with a deduplication CTE using ROW_NUMBER. Add a uniqueness check to your post-load validation.",
    },
    {
      scenario: 'A dashboard query takes 3 minutes to run on a table with 50 million rows.',
      q: 'What steps would you take to optimise it?',
      a: "1. Run EXPLAIN ANALYZE to find full table scans. 2. Add indexes on WHERE and JOIN columns. 3. Replace SELECT * with specific columns. 4. Add a WHERE clause to filter early. 5. Consider partitioning by date if the query always filters on a date column.",
    },
    {
      scenario: 'You need to track customer address changes over time for audit purposes.',
      q: 'Which SCD type would you use and why?',
      a: "SCD Type 2 — it inserts a new row for each change with start_date and end_date, preserving the full history. SCD Type 1 would overwrite and lose history, which defeats the audit purpose.",
    },
    {
      scenario: 'A pipeline runs every night and loads a 200 million row orders table.',
      q: 'How would you make this pipeline faster?',
      a: "Switch to an incremental load: track the last successful run timestamp in a control table, then only load WHERE updated_at > last_run. This processes thousands of rows instead of millions.",
    },
    {
      scenario: 'After a pipeline run, analysts report missing orders from a specific region.',
      q: 'How would you write a validation query to detect this?',
      a: "Compare row counts between source and destination: SELECT 'source' AS src, COUNT(*) FROM source_orders WHERE region = 'West' UNION ALL SELECT 'warehouse', COUNT(*) FROM warehouse_orders WHERE region = 'West'. If counts differ, the pipeline is dropping rows.",
    },
    {
      scenario: 'You need to build a customer loyalty segment (VIP / Regular / New) based on total spend.',
      q: 'How would you write this query?',
      a: "Use CASE WHEN inside a GROUP BY query: SELECT customer_id, SUM(amount) AS spend, CASE WHEN SUM(amount) > 10000 THEN 'VIP' WHEN SUM(amount) > 1000 THEN 'Regular' ELSE 'New' END AS segment FROM orders GROUP BY customer_id.",
    },
  ],
};
