// War Room interview question banks.
// 4 categories × 8 questions = 32 total.
// Used by the War Room feature for timed interview simulation.

export const WAR_ROOM_CATEGORIES = [
  {
    id: 'sql-challenge',
    label: 'SQL Challenge',
    icon: '◧',
    color: '#2f756e',
    description: '8 SQL problems covering window functions, CTEs, deduplication, and query optimization',
    questions: [
      {
        id: 'sql-01',
        difficulty: 'Medium',
        question:
          'You have a table `user_events(user_id, event_type, event_ts)` with 500 million rows. Write a query to find, for each user, the time gap in minutes between their first and second purchase event.',
        expectedPoints: [
          'Use ROW_NUMBER() or LEAD() to isolate first and second purchase rows per user',
          'Filter event_type = "purchase" before windowing to avoid ranking non-purchase events',
          'Use TIMESTAMPDIFF or EXTRACT(EPOCH FROM ...) to compute the gap in minutes',
          'Handle users with only one purchase (NULL gap or exclude them) explicitly',
          'Consider a CTE for readability instead of a nested subquery',
        ],
        modelAnswer:
          "Use a CTE to assign row numbers within each user partitioned by event_type = 'purchase' ordered by event_ts, then self-join or pivot on rn=1 and rn=2 to compute the gap. A clean approach uses LEAD: `SELECT user_id, event_ts AS first_purchase_ts, LEAD(event_ts) OVER (PARTITION BY user_id ORDER BY event_ts) AS second_purchase_ts` on a pre-filtered purchase-only CTE, then subtract and convert to minutes. Always handle the NULL case — LEAD returns NULL when there is no next row, meaning those users had only one purchase and should be excluded or flagged separately. On large tables, pre-filter to purchases first to avoid scanning all 500M rows in the window function.",
        followUp:
          'How would you rewrite this query if you needed the gap between every consecutive pair of purchases, not just the first two — and what index or clustering key would help performance?',
        timeTarget: 90,
      },
      {
        id: 'sql-02',
        difficulty: 'Hard',
        question:
          'A `transactions` table has duplicate rows caused by a double-write bug: the same `transaction_id` can appear 2-3 times with identical data. Write a query to deduplicate and keep exactly one row per `transaction_id`, keeping the row with the latest `created_at`. What happens if `created_at` values are also identical on the duplicates?',
        expectedPoints: [
          'Use ROW_NUMBER() OVER (PARTITION BY transaction_id ORDER BY created_at DESC) in a CTE, then SELECT WHERE rn = 1',
          'If created_at is also identical, add a deterministic tiebreaker such as a ctid/rowid or a secondary sort column',
          'Explain why DELETE with a self-join or DISTINCT alone may not work for exact duplicates with no unique row identifier',
          'Mention CREATE TABLE AS SELECT (CTAS) pattern for large tables instead of in-place deletion',
          'In distributed systems (Snowflake/BigQuery) there is no guaranteed rowid — use QUALIFY ROW_NUMBER() = 1',
        ],
        modelAnswer:
          "The canonical approach is a CTE with ROW_NUMBER() partitioned by transaction_id ordered by created_at DESC — then SELECT WHERE rn = 1. In Snowflake or BigQuery you can compress this with QUALIFY: `SELECT * FROM transactions QUALIFY ROW_NUMBER() OVER (PARTITION BY transaction_id ORDER BY created_at DESC) = 1`. When created_at is identical across duplicates you need a deterministic tiebreaker — in Postgres you can use ctid (physical row id), in Snowflake there is no equivalent so you must add a synthetic row identifier or accept any arbitrary survivor. For large tables avoid in-place DELETE; instead write the deduplicated result into a new table with CTAS, validate row counts, then swap or rename. Always run a count check before and after: `SELECT COUNT(*) vs COUNT(DISTINCT transaction_id)` to confirm the dedup worked.",
        followUp:
          'How would you build a deduplication strategy in a streaming pipeline — specifically using Apache Kafka and Spark Structured Streaming — to prevent duplicate transactions from ever landing in the table?',
        timeTarget: 120,
      },
      {
        id: 'sql-03',
        difficulty: 'Medium',
        question:
          'Write a SQL query using window functions to calculate a 7-day rolling average of daily revenue, alongside each day\'s revenue and the percentage difference from the rolling average. Table: `daily_revenue(date, revenue_usd)`.',
        expectedPoints: [
          'Use AVG() OVER (ORDER BY date ROWS BETWEEN 6 PRECEDING AND CURRENT ROW) for a true 7-day trailing window',
          'Distinguish ROWS-based vs RANGE-based windows — RANGE uses logical date values while ROWS counts physical rows',
          'Calculate pct_diff as (revenue - rolling_avg) / rolling_avg * 100',
          'Handle the first 6 days where fewer than 7 rows exist in the window (partial windows)',
          'Mention that ROUND() should be applied for readability',
        ],
        modelAnswer:
          "The key is using `ROWS BETWEEN 6 PRECEDING AND CURRENT ROW` rather than `RANGE BETWEEN INTERVAL 6 DAYS PRECEDING AND CURRENT ROW` — the ROWS form counts physical rows which is correct when the table has one row per day, but RANGE is safer when dates might have gaps (it uses actual date arithmetic). The full query: `SELECT date, revenue_usd, ROUND(AVG(revenue_usd) OVER (ORDER BY date ROWS BETWEEN 6 PRECEDING AND CURRENT ROW), 2) AS rolling_7d_avg, ROUND((revenue_usd - AVG(revenue_usd) OVER (ORDER BY date ROWS BETWEEN 6 PRECEDING AND CURRENT ROW)) / NULLIF(AVG(revenue_usd) OVER (ORDER BY date ROWS BETWEEN 6 PRECEDING AND CURRENT ROW), 0) * 100, 1) AS pct_from_avg FROM daily_revenue ORDER BY date`. The NULLIF guards against division-by-zero on days with zero revenue. For the first 6 days the window is automatically partial — AVG averages fewer rows, which is usually acceptable behavior but worth documenting.",
        followUp:
          'The business wants a 7-day rolling average that excludes the current day (a "lagged" rolling average for forecasting). How do you adjust the window frame, and why might that matter for a predictive model?',
        timeTarget: 90,
      },
      {
        id: 'sql-04',
        difficulty: 'Hard',
        question:
          'You have `orders(order_id, customer_id, order_date, amount)` and need to identify customers whose spending in any single month is more than 3x their average monthly spend across all months. Write the query without subqueries — using only CTEs.',
        expectedPoints: [
          'CTE 1: monthly_spend — SUM(amount) per customer per month using DATE_TRUNC or year/month extraction',
          'CTE 2: avg_spend — AVG(monthly_total) per customer across all their months',
          'Final SELECT: join the two CTEs and filter WHERE monthly_total > 3 * avg_monthly',
          'Handle customers with only one month of data (their average equals their spend — they can never be 3x, or they always are — clarify the requirement)',
          'Avoid repeating the aggregation logic — this is the exact use case for CTEs over subqueries',
        ],
        modelAnswer:
          "Build it in two CTEs: the first computes each customer's total spend per calendar month using DATE_TRUNC('month', order_date) and SUM(amount), and the second computes each customer's average across those monthly totals. The final query joins them on customer_id and filters where the monthly total exceeds three times the average. The CTE structure is important here: without it you would either repeat the SUM aggregation in a subquery or use a window function inside a HAVING clause, both of which are harder to maintain. An edge case worth raising: customers who only appear in one month — their average equals their monthly total, so the ratio is exactly 1x and they will never qualify. If the business wants to flag them separately, add a filter on COUNT(month) > 1 in CTE 2. This query pattern also applies directly to anomaly detection use cases like fraud or usage spike detection.",
        followUp:
          'How would you optimize this query for a 500-million row orders table in Snowflake — specifically around clustering keys, materialized views, and whether CTEs are materialized or inlined by the optimizer?',
        timeTarget: 120,
      },
      {
        id: 'sql-05',
        difficulty: 'Easy',
        question:
          'Explain the difference between `RANK()`, `DENSE_RANK()`, and `ROW_NUMBER()`. Give a concrete example showing all three returning different results on the same dataset.',
        expectedPoints: [
          'ROW_NUMBER always assigns a unique sequential integer — no ties, fully deterministic with an ORDER BY',
          'RANK assigns the same rank to ties but skips subsequent numbers (1,1,3,4)',
          'DENSE_RANK assigns the same rank to ties but does NOT skip numbers (1,1,2,3)',
          'Use ROW_NUMBER for deduplication, RANK for competition leaderboards, DENSE_RANK for tiered classifications',
          'All three require OVER (ORDER BY ...) and optionally PARTITION BY',
        ],
        modelAnswer:
          "Given scores [100, 100, 90, 80]: ROW_NUMBER gives [1,2,3,4] — always unique, the tie between the two 100s is broken arbitrarily (or by a secondary sort). RANK gives [1,1,3,4] — both 100s share rank 1, but rank 2 is skipped entirely because two people 'occupy' positions 1 and 2. DENSE_RANK gives [1,1,2,3] — both 100s share rank 1, but rank 2 is the next rank with no gap. In practice: use ROW_NUMBER() for deduplication (you only want one survivor), use RANK() for 'top-N with ties allowed where N is the cutoff number', and use DENSE_RANK() for tier assignments like 'Gold/Silver/Bronze' where you never want to skip a tier. All three are non-aggregate window functions and have zero effect on the number of rows returned — they just add a column.",
        followUp:
          'You need to return the top 3 customers by revenue, but ties at position 3 should all be included. Which function do you use and why — and how does this differ from using a LIMIT clause?',
        timeTarget: 60,
      },
      {
        id: 'sql-06',
        difficulty: 'Medium',
        question:
          'A Snowflake query scanning a 2 TB table is running slowly. Walk through the five main levers you would pull to optimize it, in the order you would investigate them.',
        expectedPoints: [
          '1. Check partition pruning — ensure WHERE clause filters use the CLUSTER BY column so Snowflake skips micro-partitions',
          '2. Review query profile for the most expensive node — look for TableScan with high "partitions scanned" vs "partitions total"',
          '3. Check for cartesian joins or missing join conditions inflating row counts mid-query',
          '4. Consider materializing expensive CTEs or subqueries into a temporary table if re-used',
          '5. Warehouse sizing — only after confirming the query plan is correct, consider scaling up to reduce spill to disk',
        ],
        modelAnswer:
          "Start with the Query Profile in Snowflake UI — it shows execution time per node and immediately reveals whether the bottleneck is scanning, joining, or aggregation. The first thing to check is partition pruning: Snowflake stores data in micro-partitions of ~16 MB each and tracks min/max values per column; if your WHERE clause filters on a clustered or frequently filtered column, Snowflake can skip most micro-partitions and reduce scan dramatically. If partition pruning is poor, consider clustering the table on the filter column. Second, check for row explosion in joins — a missing ON clause or a fanout join can multiply rows by 100x and make aggregation expensive downstream. Third, look for 'spill to disk' in the profile — this indicates the warehouse ran out of memory and had to write shuffle data to storage, which is 100x slower; the fix is either a larger warehouse or rewriting the query to reduce intermediate data. Fourth, if a CTE is referenced multiple times Snowflake may inline it and re-execute it each time — in that case materialize it into a temporary table. Finally, warehouse scaling is a last resort after the query plan is correct.",
        followUp:
          'How does Snowflake\'s result cache work, and under what conditions does it NOT apply — such that a query that ran in 2 seconds yesterday now takes 3 minutes?',
        timeTarget: 90,
      },
      {
        id: 'sql-07',
        difficulty: 'Hard',
        question:
          'Write a SQL query to perform a "sessionization" of user events: given `events(user_id, event_ts)`, group events into sessions where a session ends when there is a gap of more than 30 minutes between consecutive events for the same user. Return `user_id, session_id, session_start, session_end, event_count`.',
        expectedPoints: [
          'Use LAG() to compute the gap between consecutive events per user',
          'Flag each row as a session start (gap > 30 min or first event) using a CASE expression',
          'Use a running SUM() of the session-start flag to generate a session number per user',
          'Final aggregation groups by user_id and session number to compute start, end, and event count',
          'This is a classic gaps-and-islands problem — mention the pattern by name',
        ],
        modelAnswer:
          "This is a classic gaps-and-islands problem. The solution has three CTE steps. First, compute the gap from the previous event per user using LAG: `prev_ts = LAG(event_ts) OVER (PARTITION BY user_id ORDER BY event_ts)` and `gap_minutes = DATEDIFF('minute', prev_ts, event_ts)`. Second, flag session starts: a row is a new session if gap_minutes > 30 OR prev_ts IS NULL (first event). Third, compute a session identifier by taking a running SUM of the is_new_session flag: `SUM(is_new_session) OVER (PARTITION BY user_id ORDER BY event_ts)` — this increments only when a new session starts, so all events in the same session get the same session number. Finally, aggregate: `GROUP BY user_id, session_num` to get MIN(event_ts) as session_start, MAX(event_ts) as session_end, and COUNT(*) as event_count. The session_id can be constructed as `user_id || '-' || session_num` for uniqueness. This pattern generalizes to any time-based grouping problem — consecutive active days, overlapping bookings, or network connection sessions.",
        followUp:
          'How would you implement this same sessionization logic in PySpark on a 1 TB events table — and what are the performance implications of using Window functions vs a custom UDAF?',
        timeTarget: 120,
      },
      {
        id: 'sql-08',
        difficulty: 'Medium',
        question:
          'You have two tables: `current_customers` (today\'s snapshot) and `previous_customers` (yesterday\'s snapshot), both with schema `(customer_id, email, plan, status)`. Write a query to produce a change report showing: new customers, churned customers, and customers whose plan changed.',
        expectedPoints: [
          'New customers: customer_id in current but NOT in previous (LEFT JOIN with NULL check or EXCEPT)',
          'Churned customers: customer_id in previous but NOT in current',
          'Plan changes: INNER JOIN on customer_id WHERE current.plan != previous.plan',
          'Union all three result sets with a change_type column for readability',
          'Mention that this is the foundation of a CDC (Change Data Capture) pattern',
        ],
        modelAnswer:
          "This is a full outer join or UNION-based change detection query. The cleanest implementation uses three CTEs and a UNION ALL: `new_customers` selects customer_ids from a LEFT JOIN between current and previous where previous.customer_id IS NULL; `churned_customers` does the reverse LEFT JOIN; and `plan_changes` does an INNER JOIN on customer_id and filters WHERE curr.plan != prev.plan. Union all three with a literal change_type column ('NEW', 'CHURNED', 'PLAN_CHANGE'). Alternatively a FULL OUTER JOIN handles all three cases in one pass — new customers have NULL on the previous side, churned have NULL on the current side, and plan changes have different plan values on both sides. The FULL OUTER JOIN approach is more efficient (one scan each) but harder to read. This pattern is the foundation of Slowly Changing Dimension (SCD Type 2) logic and any CDC merge operation. For very large tables consider using MERGE INTO (upsert) syntax rather than three separate queries.",
        followUp:
          'How would you extend this change detection to track historical plan changes over time — specifically how SCD Type 2 would model this with effective_date and expiry_date columns?',
        timeTarget: 90,
      },
    ],
  },

  {
    id: 'spark-pyspark',
    label: 'Spark & PySpark',
    icon: '⚡',
    color: '#d97706',
    description: '8 questions on partitioning, broadcast joins, OOM debugging, UDFs, and Structured Streaming',
    questions: [
      {
        id: 'spark-01',
        difficulty: 'Medium',
        question:
          'Explain the difference between `repartition()` and `coalesce()` in Spark. When would you use each, and what are the performance trade-offs?',
        expectedPoints: [
          'repartition() triggers a full shuffle and can increase or decrease partition count',
          'coalesce() avoids a shuffle by merging partitions locally — can only decrease partition count',
          'Use repartition() when you need even data distribution (e.g., before a join or write)',
          'Use coalesce() to reduce file count before writing to storage without the cost of a shuffle',
          'coalesce() can create data skew if partition sizes are uneven — mention this trade-off',
        ],
        modelAnswer:
          "`repartition(n)` performs a full shuffle — it sends data across the network to redistribute rows evenly into exactly n partitions. This is expensive (involves sorting, serialization, and network I/O) but guarantees even distribution. `coalesce(n)` avoids the shuffle by combining existing partitions locally on the same executor — it simply merges neighboring partitions without moving data across nodes. Because coalesce avoids the shuffle it is much cheaper, but it can only reduce the partition count (not increase it), and it may produce uneven partitions if the original partitions had different sizes. Use repartition before a join on a column that is not the current partition key (to co-locate matching rows), before a wide aggregation to distribute work evenly, or when reading from a highly skewed source. Use coalesce just before writing output files to reduce the number of small files — for example `df.coalesce(1).write.parquet(...)` to write a single file. A common pitfall is calling coalesce to a very low number like 1 on a large dataset — this forces all data onto one executor and kills parallelism.",
        followUp:
          'You have a 500 GB DataFrame currently in 10,000 partitions and you want to write it as 200 Parquet files. Which approach do you choose and does the write itself affect the partition count?',
        timeTarget: 90,
      },
      {
        id: 'spark-02',
        difficulty: 'Hard',
        question:
          'A Spark job is experiencing severe data skew on a join between `fact_orders` (2 billion rows) and `dim_customers` (5 million rows). The join key is `customer_id` and one customer accounts for 40% of all orders. Walk through your complete debugging and resolution process.',
        expectedPoints: [
          'Identify skew in Spark UI: Stage details > Task metrics — one task takes 10x longer than median',
          'Confirm skew: count orders per customer_id and find the heavy-hitter',
          'Solution 1: Broadcast dim_customers if < 200 MB (check with df.count() and schema size estimate)',
          'Solution 2: If broadcast is not possible — salt the join key on the large side and explode the small side',
          'Enable AQE (Adaptive Query Execution) as a configuration-level fix: spark.sql.adaptive.skewJoin.enabled=true',
        ],
        modelAnswer:
          "Start in the Spark UI: look at Stage details and sort tasks by Duration — if one task is taking 10-100x longer than the median, you have skew. Confirm it by running `fact_orders.groupBy('customer_id').count().orderBy(col('count').desc()).show(5)` — if the top customer has 800M rows you know the skew source. The first fix to try is broadcasting `dim_customers`: if it fits in memory (< 200 MB on the driver), wrap it with `broadcast(dim_customers)` and Spark sends the whole table to every executor, eliminating the shuffle entirely. If dim_customers is too large to broadcast, use key salting: add a random salt suffix (0-9) to customer_id in fact_orders (`customer_id + '_' + (rand * 10).cast(int)`), and replicate dim_customers 10 times with each salt suffix, then join on the salted key. This distributes the skewed partition across 10 tasks. A third option is enabling AQE's skew join optimization: `spark.conf.set('spark.sql.adaptive.skewJoin.enabled', 'true')` — Spark 3.x will automatically detect and split skewed partitions at runtime. AQE is the lowest-effort fix but requires Spark 3.x and may not handle extreme skew as well as explicit salting.",
        followUp:
          'How does AQE (Adaptive Query Execution) change the way you approach Spark performance tuning compared to Spark 2.x, and what are its limitations?',
        timeTarget: 120,
      },
      {
        id: 'spark-03',
        difficulty: 'Medium',
        question:
          'What is the difference between a narrow transformation and a wide transformation in Spark? Why does this matter for performance and fault tolerance?',
        expectedPoints: [
          'Narrow: each input partition contributes to exactly one output partition — no shuffle (map, filter, select)',
          'Wide: input partitions contribute to multiple output partitions — requires a shuffle (groupBy, join, repartition)',
          'Stage boundaries in the DAG are created at wide transformations',
          'Fault tolerance: narrow transformations can be recomputed from the parent RDD cheaply; wide transformations require recomputing from the last shuffle (expensive)',
          'Minimize wide transformations and chain narrow transformations together to reduce stages and network overhead',
        ],
        modelAnswer:
          "A narrow transformation produces exactly one output partition from each input partition — examples include map(), filter(), select(), and withColumn(). Because no data moves between executors, narrow transformations are fast and can be pipelined. A wide transformation requires data from multiple input partitions to produce each output partition — examples include groupBy(), join(), distinct(), and repartition(). Wide transformations trigger a shuffle: Spark writes intermediate results to disk, sends data across the network, and reads it back — this is the most expensive operation in Spark. DAG stages are separated by shuffle boundaries, so each wide transformation creates a new stage. Fault tolerance is also affected: if a task fails in a narrow stage, Spark only needs to recompute from the parent partition; if a task fails after a shuffle, Spark must recompute from the last shuffle write on the previous stage. In practice this means you should push filters (narrow) as early as possible to reduce data volume before any shuffles (wide), and try to minimize the number of distinct shuffle operations in your pipeline.",
        followUp:
          'Explain how the Catalyst optimizer in Spark SQL uses predicate pushdown and projection pruning to automatically reduce the cost of wide transformations.',
        timeTarget: 90,
      },
      {
        id: 'spark-04',
        difficulty: 'Hard',
        question:
          'You are asked to convert a Python UDF in PySpark that applies a complex business rule to every row of a 100 GB DataFrame. The current UDF takes 4 hours to run. What are your options for speeding it up, in order of preference?',
        expectedPoints: [
          '1. Rewrite using native Spark SQL functions / Column API — eliminates Python serialization overhead entirely',
          '2. Use a Pandas UDF (vectorized UDF via PyArrow) instead of a row-by-row Python UDF for 10-100x speedup',
          '3. Use a Spark SQL expression or SparkSQL equivalent if the logic can be expressed in SQL',
          '4. Pre-filter data to reduce rows before applying the UDF',
          'Explain WHY Python UDFs are slow: row-by-row serialization, Python-JVM boundary crossing',
        ],
        modelAnswer:
          "Python UDFs are slow because Spark must serialize each row from the JVM (where Spark runs) to a Python process, apply the function, then deserialize the result back to the JVM — for 100 GB of data this serialization overhead dominates the actual computation. The options in priority order: First, rewrite using native Spark functions (`from pyspark.sql.functions import *`) — these execute in the JVM and bypass Python entirely. Most business rules can be expressed with `when/otherwise`, string functions, and mathematical functions. Second, if the logic is genuinely complex and cannot be expressed natively, convert to a Pandas UDF (also called a vectorized UDF): `@pandas_udf('double', PandasUDFType.SCALAR)` processes a Pandas Series of ~10,000 rows at a time using Arrow serialization instead of row-by-row, giving a 10-100x speedup over a standard Python UDF. Third, consider splitting the logic: push any filterable conditions into a `filter()` call before the UDF to reduce the number of rows it touches. Fourth, increase parallelism by repartitioning before the UDF so more executors process slices concurrently. Avoid broadcasting large lookup tables within the UDF — pass them as a broadcast variable instead.",
        followUp:
          'What is the difference between a Pandas UDF (vectorized UDF) and a regular Python UDF at the execution level — specifically how does Apache Arrow change the data transfer between the JVM and Python?',
        timeTarget: 120,
      },
      {
        id: 'spark-05',
        difficulty: 'Medium',
        question:
          'Explain Spark\'s memory model: what is execution memory vs storage memory, and what happens when a job runs out of both?',
        expectedPoints: [
          'Unified memory pool split into execution memory (shuffles, aggregations, joins) and storage memory (cached RDDs/DataFrames)',
          'They share the same pool and can borrow from each other (unified memory management since Spark 1.6)',
          'When execution memory is exhausted, Spark spills shuffle data to disk (huge performance penalty)',
          'When storage memory is exhausted, cached partitions are evicted (LRU) — next access recomputes them',
          'spark.memory.fraction (default 0.6) and spark.memory.storageFraction (default 0.5 within that) control the split',
        ],
        modelAnswer:
          "Spark uses a unified memory pool (since 1.6) where execution memory and storage memory share the same region and can borrow from each other. Execution memory is used for shuffle buffers, sort buffers, hash aggregation, and join hash tables — it is consumed and released within a single operation. Storage memory holds cached RDDs and DataFrames (via `df.cache()` or `df.persist()`). The pool is sized as `spark.memory.fraction` × JVM heap (default 60%), and within that, storage gets a minimum of `spark.memory.storageFraction` (default 50%) that execution cannot evict. When execution memory is exhausted Spark spills intermediate data to disk — this causes a 10-100x slowdown because sort-merge shuffle now involves disk I/O. When storage memory is exhausted, Spark evicts cached partitions using LRU — the data is not lost (it can be recomputed), but cache misses force re-reads from source. Symptoms of OOM: executor containers killed by YARN/Kubernetes with exit code 137 (OOM kill), or 'OutOfMemoryError: Java heap space' in the logs. Fixes: increase executor memory, reduce the size of cached datasets, use Kryo serialization to shrink serialized partition size, or switch to `MEMORY_AND_DISK` persistence level.",
        followUp:
          'When would you use `persist(StorageLevel.DISK_ONLY)` vs `persist(StorageLevel.MEMORY_AND_DISK_SER)`, and what are the trade-offs in terms of recomputation cost vs serialization overhead?',
        timeTarget: 90,
      },
      {
        id: 'spark-06',
        difficulty: 'Hard',
        question:
          'Design a PySpark Structured Streaming job that reads from a Kafka topic, deduplicates events using a 24-hour watermark window, and writes exactly-once to a Delta Lake table. What guarantees does this provide and where might data loss or duplicates still occur?',
        expectedPoints: [
          'Use dropDuplicates(["event_id"]) with withWatermark("event_ts", "24 hours") for stateful deduplication',
          'Delta Lake provides ACID writes — combined with Structured Streaming checkpointing this gives end-to-end exactly-once',
          'Kafka source provides at-least-once delivery — the deduplication step converts this to effectively-once',
          'Data loss risk: events arriving more than 24 hours late will be silently dropped by the watermark',
          'The checkpoint location must be on durable storage (ADLS, S3) — loss of checkpoint = potential duplicates on restart',
        ],
        modelAnswer:
          "The architecture combines three components: Kafka (at-least-once source), Structured Streaming with stateful deduplication, and Delta Lake (ACID sink). The deduplication logic uses `withWatermark('event_ts', '24 hours').dropDuplicates(['event_id'])` — Spark maintains a state store of seen event_ids within the last 24 hours, and the watermark allows Spark to safely purge state older than 24 hours to prevent unbounded state growth. Delta Lake's `foreachBatch` sink with MERGE INTO or the native Delta streaming sink provides idempotent writes — if a micro-batch is replayed due to a failure, the same rows will not be double-inserted. Combined with the Structured Streaming checkpoint (which tracks Kafka offsets), this gives end-to-end exactly-once semantics within the watermark window. Key caveats: events arriving more than 24 hours late are silently dropped — this is the trade-off of bounded watermarking. If the checkpoint is lost (corrupt or deleted), the job will reprocess from the last committed Kafka offset, and any events already written to Delta may be duplicated; the Delta MERGE handles this but only if the merge key (event_id) is indexed. The checkpoint should live on durable cloud storage, never on ephemeral executor disk.",
        followUp:
          'How does Structured Streaming\'s checkpointing differ from Spark batch job checkpointing — and what happens to in-flight micro-batches when a streaming cluster crashes mid-write?',
        timeTarget: 120,
      },
      {
        id: 'spark-07',
        difficulty: 'Easy',
        question:
          'What is lazy evaluation in Spark and why is it important? Give an example of a transformation and an action, and explain when Spark actually executes the computation.',
        expectedPoints: [
          'Transformations (map, filter, join) are lazy — they build a DAG but do not execute immediately',
          'Actions (count, collect, show, write) trigger execution of the accumulated DAG',
          'Lazy evaluation allows Catalyst optimizer to see the full query plan and optimize it before running',
          'Example: df.filter().join().groupBy() builds the plan; df.count() triggers execution',
          'Without lazy evaluation, each transformation would execute immediately, preventing whole-plan optimization',
        ],
        modelAnswer:
          "Lazy evaluation means Spark does not execute transformations immediately when you call them — instead it records each transformation as a node in a Directed Acyclic Graph (DAG). Nothing actually runs until you call an action. Transformations include filter(), select(), join(), groupBy(), withColumn() — these return a new DataFrame object describing what to compute. Actions include count(), collect(), show(), write() — these trigger Spark to compile the DAG into a physical plan, optimize it via the Catalyst optimizer, and execute it on the cluster. The key benefit is that Catalyst can see the entire query plan before executing any of it, enabling optimizations that would be impossible if each step ran immediately: it can push filters down before joins (reducing data scanned), eliminate unused columns (projection pruning), reorder operations, and combine multiple map operations into one pass (pipelining). Practically: if you call `df.filter(...).count()`, Spark does not first create a full filtered DataFrame in memory and then count it — it counts during the scan, never materializing the intermediate result.",
        followUp:
          'If lazy evaluation is so powerful, when would you want to force eager evaluation by calling `cache()` or `persist()` on an intermediate DataFrame?',
        timeTarget: 60,
      },
      {
        id: 'spark-08',
        difficulty: 'Medium',
        question:
          'You have a PySpark job that reads a 100-partition DataFrame, applies a complex multi-step transformation, and writes to Parquet. The job works correctly but creates 100 Parquet files. The downstream team needs 5 files max. How do you solve this without reading all 100 files into one executor?',
        expectedPoints: [
          'Use coalesce(5) before the write — merges partitions locally without a full shuffle',
          'Explain why coalesce(5) is preferred over repartition(5) here — same result but no shuffle cost',
          'Mention the trade-off: coalesce may create uneven file sizes if partitions are unequal',
          'Alternative: use maxRecordsPerFile option in the DataFrameWriter to cap file size',
          'If even file sizes are important, repartition(5) is correct despite the shuffle cost',
        ],
        modelAnswer:
          "The simplest fix is `df.coalesce(5).write.parquet(output_path)`. Coalesce reduces the partition count without a shuffle by merging partitions within the same executor — it avoids sending all 100 partitions to a single executor and simply combines neighboring partitions locally. This is much cheaper than repartition(5) which would trigger a full shuffle. The trade-off is that coalesce may produce uneven file sizes if the 100 original partitions had unequal data volumes — you might get files of 50 MB, 200 MB, and 800 MB instead of 5 even 200 MB files. If even file sizes matter for downstream query performance, use `repartition(5)` instead — you pay the shuffle cost but get evenly distributed files. A third option is the `maxRecordsPerFile` writer option: `df.write.option('maxRecordsPerFile', 1_000_000).parquet(output_path)` — this caps each file at 1M rows regardless of partition count, though it does not guarantee exactly 5 files. For Parquet specifically, target file sizes of 128–512 MB for optimal Spark read performance — compute this as total_bytes / target_file_size_bytes to choose your repartition count.",
        followUp:
          'In a Delta Lake context, what is the difference between using coalesce before a write vs running the OPTIMIZE command after the write — and when would you use each approach?',
        timeTarget: 90,
      },
    ],
  },

  {
    id: 'system-design',
    label: 'System Design',
    icon: '🏗',
    color: '#6d28d9',
    description: '8 senior-level system design questions covering data lakes, CDC, real-time pipelines, and cost optimization',
    questions: [
      {
        id: 'sd-01',
        difficulty: 'Hard',
        question:
          'Design a data lake for a mid-sized e-commerce company processing 50 million events per day. Cover storage layers, ingestion, processing, and query access patterns. What would you use in 2026 and why?',
        expectedPoints: [
          'Bronze / Silver / Gold (Medallion) architecture — separate raw, cleaned, and business-ready layers',
          'Ingestion: Kafka for streaming events, ADF/Fivetran for batch source systems',
          'Storage: ADLS Gen2 or S3 with Delta Lake or Apache Iceberg for ACID and time travel',
          'Processing: Databricks or Spark on a managed platform for batch; Structured Streaming for near-real-time',
          'Query access: Databricks SQL / Snowflake external tables / Athena for ad-hoc; semantic layer (dbt) for BI',
        ],
        modelAnswer:
          "Start with the Medallion architecture: Bronze layer stores raw, immutable data exactly as received (JSON events in cloud object storage); Silver applies schema enforcement, deduplication, and type casting to produce clean, queryable tables; Gold contains business-aggregated tables purpose-built for BI and ML. For ingestion at 50M events/day (~580 events/sec), Kafka handles real-time event streaming with a Structured Streaming consumer writing to Bronze in Delta Lake; batch sources (ERP, CRM) use a managed connector like Fivetran or ADF. Storage should be ADLS Gen2 or S3 with Delta Lake (or Iceberg if you need multi-engine compatibility) — both provide ACID transactions, time travel, schema evolution, and Z-ordering for query optimization. Processing uses Databricks with scheduled jobs for heavy batch transforms and Structured Streaming for latency-sensitive paths. For query access, Databricks SQL serves analysts directly on Delta tables; dbt builds a semantic layer transforming Gold tables into consumption-ready marts; and BI tools (Power BI, Tableau) connect to a certified dataset layer to avoid raw table access. Cost governance from day one: resource monitors in Snowflake, cluster autoscaling with auto-termination in Databricks, and lifecycle policies on object storage to tier cold data to cheaper storage classes after 90 days.",
        followUp:
          'How would your design change if the company needed to support real-time personalization — serving feature vectors to a recommendation model within 200 milliseconds of a user click?',
        timeTarget: 120,
      },
      {
        id: 'sd-02',
        difficulty: 'Hard',
        question:
          'Design a Change Data Capture (CDC) pipeline to replicate changes from a production PostgreSQL database to a Snowflake data warehouse in near-real-time (< 5 minute latency). What tools would you use and what failure modes must you handle?',
        expectedPoints: [
          'Use Debezium to capture PostgreSQL WAL (Write-Ahead Log) changes and publish to Kafka',
          'Kafka topics buffer the change events and decouple ingestion from loading',
          'Kafka Connect Snowflake Sink (or custom Spark job) consumes and merges changes into Snowflake staging',
          'MERGE INTO Snowflake target table using the primary key to apply inserts, updates, and deletes',
          'Failure modes: WAL retention running out, connector offset loss, schema changes breaking the pipeline',
        ],
        modelAnswer:
          "The canonical CDC stack for PostgreSQL to Snowflake: Debezium (source connector) reads PostgreSQL's Write-Ahead Log (WAL) using logical replication, emitting row-level INSERT/UPDATE/DELETE events as Kafka messages. Kafka decouples the source database from the sink and provides durability — if the Snowflake sink is down, Kafka retains messages until it recovers. The Confluent Kafka Connect Snowflake Sink connector (or a Spark Structured Streaming job) consumes the Kafka topic and applies changes to a Snowflake staging table; a MERGE INTO statement then upserts staging into the target table using the primary key. For deletes, Debezium emits a tombstone event — the pipeline should soft-delete (set an `is_deleted` flag and `deleted_at` timestamp) rather than hard-delete, to preserve history. Critical failure modes: (1) PostgreSQL WAL retention — if Debezium falls behind and WAL files are recycled, the connector must perform a full resync; set `wal_keep_size` or replication slots to prevent this. (2) Schema changes — a new column in Postgres will break Avro schema compatibility; use the Schema Registry with FORWARD or FULL compatibility and handle evolution in the sink DDL. (3) Offset loss — if Kafka consumer offsets are lost, the sink may replay events; the MERGE INTO pattern is idempotent so replays are safe if you have a reliable deduplication key. Monitor consumer lag as the primary SLA metric — alert if lag exceeds 10,000 messages.",
        followUp:
          'How would you handle a bulk DELETE of 10 million rows in the source PostgreSQL table — specifically the impact on WAL volume, Kafka throughput, and Snowflake credit consumption during the delete propagation?',
        timeTarget: 120,
      },
      {
        id: 'sd-03',
        difficulty: 'Hard',
        question:
          'Design a real-time dashboard showing order metrics (orders per minute, revenue, top products) that must be accurate within 30 seconds of an order being placed. The system must handle 10,000 orders per minute at peak. Describe the full data path.',
        expectedPoints: [
          'Order events published to Kafka immediately on placement in the transactional system',
          'Spark Structured Streaming (or Flink) aggregates events in 10-second micro-batches or tumbling windows',
          'Write aggregated metrics to a low-latency serving store (Redis, DynamoDB, or Druid) for sub-second dashboard reads',
          'BI tool (Grafana, Superset, or custom) polls the serving store, not the raw stream',
          'Exactly-once semantics using Kafka transactional APIs + idempotent sink writes',
        ],
        modelAnswer:
          "The architecture has four layers. Event emission: when an order is placed, the order service publishes an event to a Kafka topic `orders.placed` synchronously (or via transactional outbox). At 10,000 orders/min (~167/sec) Kafka handles this comfortably with a single-digit number of partitions. Stream processing: Spark Structured Streaming or Apache Flink reads from the Kafka topic and computes aggregations over 30-second tumbling windows — orders per minute, revenue sum, and a top-N product aggregation. Flink is preferred here for true event-time processing and lower latency; Structured Streaming with 10-second trigger intervals also works and is easier to operate in a Databricks environment. The aggregated results are written to a serving store: Redis for simple counters and top-N lists (sub-millisecond reads), or Apache Druid / ClickHouse if you need slice-and-dice analytics on the real-time data. Dashboard layer: Grafana or a custom React frontend polls the serving store every 5-10 seconds — never the Kafka stream directly. Exactly-once guarantees come from the combination of Kafka's transactional producer (ensures the order event is published exactly once) and idempotent sink writes (using the order_id as a deduplication key in Redis/Druid). For fault tolerance the stream processor must checkpoint state to durable storage (S3/ADLS) every 10 seconds so a crash causes at most a 10-second reprocessing delay, well within the 30-second SLA.",
        followUp:
          'How would you handle a late-arriving event — an order placed 2 minutes ago that just appeared in Kafka due to a transient network partition — without skewing the dashboard metrics?',
        timeTarget: 120,
      },
      {
        id: 'sd-04',
        difficulty: 'Hard',
        question:
          'Your Snowflake bill doubled last month with no new features shipped. Walk through how you would conduct a cost investigation and what optimizations you would implement.',
        expectedPoints: [
          'Start with QUERY_HISTORY and WAREHOUSE_METERING_HISTORY to identify which warehouse, user, or query drove the cost',
          'Look for: missing LIMIT clauses, cartesian joins, full table scans with no partition pruning, repeated expensive queries',
          'Optimizations: result cache (ensure queries are cache-eligible), clustering keys, materialized views for expensive aggregations',
          'Warehouse right-sizing: match warehouse size to query complexity; use auto-suspend and auto-resume',
          'Resource monitors: set SUSPEND at 80% of budget and SUSPEND_IMMEDIATE at 100%',
        ],
        modelAnswer:
          "Start with data, not guesses. Query `snowflake.account_usage.warehouse_metering_history` to see credit consumption per warehouse per day compared to the previous month — identify which warehouse spiked. Then query `snowflake.account_usage.query_history` grouped by user_name and total_elapsed_time to find the top 10 most expensive queries by credits_used_cloud_services or bytes_scanned. Common culprits: (1) a new report or dashboard running full table scans without partition pruning — fix by adding WHERE clauses on CLUSTER BY columns; (2) a BI tool running the same expensive query repeatedly — fix by pointing it at a materialized view or enabling Snowflake's result cache (queries must be identical for cache hits); (3) a warehouse left running without auto-suspend — set AUTO_SUSPEND = 60 seconds on all warehouses; (4) a warehouse that was upscaled for a one-time load and never downscaled — right-size it using the 'Queued load' metric in Warehouse Monitoring. For structural optimizations: add clustering keys on columns frequently used in WHERE and JOIN predicates to enable micro-partition pruning; create materialized views for expensive aggregations run repeatedly by dashboards; use multi-cluster warehouses only for concurrency-heavy workloads, not for single large queries. Finally, set resource monitors on every warehouse: NOTIFY at 50% of expected spend, SUSPEND at 80%, SUSPEND_IMMEDIATE at 110% — this prevents runaway queries from running unchecked overnight.",
        followUp:
          'Snowflake recently introduced serverless tasks (Snowpark Container Services) and serverless compute for tasks and pipes. How does serverless pricing differ from virtual warehouse pricing, and when does it save money vs cost more?',
        timeTarget: 120,
      },
      {
        id: 'sd-05',
        difficulty: 'Medium',
        question:
          'What is the Medallion Architecture (Bronze/Silver/Gold)? Explain each layer\'s purpose, what transformations happen there, and what data quality guarantees each layer should provide.',
        expectedPoints: [
          'Bronze: raw, immutable copy of source data — no transformation, append-only, preserves exactly what was received',
          'Silver: cleaned, validated, deduplicated, type-cast data — schema enforced, NULLs handled, PII masked',
          'Gold: business-aggregated, domain-specific tables — joins between Silver entities, KPIs, mart tables for BI/ML',
          'Quality increases with each layer: Bronze=no guarantee, Silver=schema contract, Gold=business metric accuracy',
          'Reprocessing: because Bronze is immutable you can always reprocess Silver and Gold from raw',
        ],
        modelAnswer:
          "The Medallion Architecture structures a data lake into three progressively refined layers. Bronze (raw): data is landed exactly as received from the source — JSON blobs, CSV files, Kafka messages — with minimal transformation. The only additions are ingestion metadata (source_file, ingested_at, batch_id). Bronze is append-only and immutable; you never overwrite it. This is your audit trail and allows you to reprocess everything downstream from scratch if you discover a transformation bug. Silver (cleaned): Bronze data is read, parsed, type-cast, schema-validated, deduplicated, and enriched. NULL handling logic is applied, PII fields are masked or tokenized, and the data is stored as Parquet or Delta Lake with a stable schema. Silver provides a schema contract — downstream consumers can rely on column types and non-nullable fields. Gold (business): Silver tables are joined and aggregated into business-domain marts — `dim_customers`, `fact_orders`, `agg_daily_revenue`. These are optimized for consumption by BI tools, ML models, and APIs. Gold tables should have documented business definitions (in a data catalog), pass data quality tests (dbt tests, Great Expectations), and be versioned for schema changes. The quality guarantee increases with each layer: Bronze makes no data quality guarantee, Silver guarantees structural correctness, and Gold guarantees business correctness. This separation means a bug in a Silver transform only requires reprocessing Silver and Gold — Bronze is untouched.",
        followUp:
          'Some teams advocate for a "Delta Architecture" or "Lakehouse" pattern that collapses Bronze/Silver into a single layer. What are the trade-offs of that simplification and when does it make sense?',
        timeTarget: 90,
      },
      {
        id: 'sd-06',
        difficulty: 'Hard',
        question:
          'Design a data pipeline for GDPR compliance: when a user requests account deletion, all their personal data must be removed from the data warehouse, data lake, and all downstream ML training datasets within 72 hours. How do you architect this?',
        expectedPoints: [
          'Maintain a deletion request queue (Kafka topic or database table) as the source of truth',
          'Data lake: Delta Lake supports row-level deletes via DELETE WHERE — purge PII columns or delete rows by user_id',
          'Data warehouse: targeted DELETE statements in Snowflake/BigQuery against all tables containing user_id',
          'ML datasets: maintain lineage of which training datasets used which user records; rebuild affected datasets after deletion',
          'Verification: after deletion, run a scan to confirm no PII remains for the user_id in any layer',
        ],
        modelAnswer:
          "GDPR right-to-erasure requires deleting data from every system that holds it. The architecture needs three components: a deletion registry, a propagation pipeline, and a verification audit. The deletion registry is a database table (or Kafka compacted topic) that records each deletion request with user_id, request_ts, and status. When a user submits a deletion request it lands here first — this is the source of truth and the SLA clock starts. The propagation pipeline runs every hour and processes pending deletions. For the data lake (Delta Lake), use `DELETE FROM silver.events WHERE user_id = X` — Delta's ACID support makes this safe and efficient, and VACUUM removes the deleted files from storage. For the data warehouse (Snowflake), execute targeted DELETEs against every table that contains user_id — you need a data catalog or manifest listing all such tables. For object storage (S3/ADLS) raw files in Bronze: you cannot do row-level deletes on Parquet/JSON files, so you must rewrite the affected partition files with the user's data redacted — use PySpark to read, filter out the user, and overwrite. For ML training datasets: this is the hardest part — you need dataset lineage tracking (which models were trained on which user records), and affected models may need to be retrained from the purged dataset. Verification: after each deletion job runs, execute a scan query against all layers to confirm the user_id returns zero rows, and log the result in the deletion registry as VERIFIED. Alert if any deletion remains unverified within 48 hours of the request.",
        followUp:
          'How does pseudonymization differ from anonymization under GDPR, and could you use it to avoid needing to delete records from ML training sets?',
        timeTarget: 120,
      },
      {
        id: 'sd-07',
        difficulty: 'Medium',
        question:
          'Explain the CAP theorem in the context of data engineering. How do you decide between a consistent vs available system when designing a data pipeline?',
        expectedPoints: [
          'CAP: Consistency (every read reflects the latest write), Availability (every request gets a response), Partition tolerance (system works despite network partitions)',
          'CAP says you can guarantee at most 2 of 3 during a network partition',
          'Data engineering context: batch pipelines tolerate eventual consistency; financial reporting requires strong consistency',
          'CP systems: traditional RDBMS, HBase — choose when data accuracy is critical (banking, inventory)',
          'AP systems: Cassandra, DynamoDB — choose when availability and low latency matter more (clickstream, logs)',
        ],
        modelAnswer:
          "The CAP theorem states that a distributed system cannot simultaneously guarantee Consistency (all nodes return the same, up-to-date data), Availability (every request receives a response), and Partition Tolerance (the system continues operating despite network partitions between nodes). Since network partitions are unavoidable in any distributed system, the real trade-off is between C and A. In data engineering, the choice maps to use case: CP systems (strong consistency, may sacrifice availability during a partition) are right for financial transactions, inventory management, and any pipeline where a stale read would cause a material business error — use PostgreSQL, Snowflake, or Delta Lake with ACID guarantees. AP systems (highly available, eventually consistent) are right for clickstream ingestion, log pipelines, and user activity tracking where a few seconds of inconsistency is acceptable — use Kafka, Cassandra, or DynamoDB. In practice, most data lakes are AP: a streaming pipeline that is slightly behind is acceptable, but you must design idempotent consumers and deduplication logic to handle the eventual consistency. A Gold layer BI table must be CP — a revenue report that shows different numbers to different analysts is a business incident. Architect accordingly: design your Bronze/Silver ingestion to tolerate eventual consistency, but use transactions (Delta Lake MERGE, Snowflake MERGE) in your Gold layer writes to ensure readers always see a complete, consistent snapshot.",
        followUp:
          'How does Delta Lake\'s transaction log (ACID) change the consistency model of a data lake built on object storage — which is inherently an AP system?',
        timeTarget: 90,
      },
      {
        id: 'sd-08',
        difficulty: 'Medium',
        question:
          'What is data lineage, why does it matter for a data engineering team, and how would you implement automated lineage tracking in a dbt + Databricks + Snowflake stack?',
        expectedPoints: [
          'Data lineage: tracking which source datasets produced each downstream table and transformation steps between them',
          'Why it matters: impact analysis (what breaks if I change table X), debugging (where did this NULL come from), compliance (where does this PII field flow)',
          'dbt provides column-level lineage out of the box via its DAG — viewable in dbt docs and exportable via the dbt artifact API',
          'Databricks Unity Catalog provides automated system-level lineage tracking for Spark jobs',
          'For cross-system lineage, OpenLineage / Marquez provides a vendor-neutral API to emit and store lineage events',
        ],
        modelAnswer:
          "Data lineage is the ability to trace data from its origin (source system) through every transformation to its final destination — and backwards from any output to understand how it was produced. It matters for three practical reasons: impact analysis (before changing a column in `dim_customers`, you need to know which 47 downstream tables and 12 dashboards reference it), incident debugging (when a metric shows an unexpected value, you need to trace back through transformations to find where it diverged), and compliance (GDPR deletion requires knowing every table that contains a user's data). Implementation in a dbt + Databricks + Snowflake stack: dbt provides DAG-level lineage natively — the `dbt docs generate` command produces a `manifest.json` artifact that maps every model's source tables, and the dbt DAG in the docs UI shows the full dependency graph. For column-level lineage within dbt, tools like dbt-osmosis or third-party platforms (Atlan, Alation) parse the SQL to track individual columns. Databricks Unity Catalog provides system-level lineage for Spark jobs — it automatically records which tables a Spark job read and wrote to, viewable in the Unity Catalog UI. For cross-system lineage spanning Kafka, Databricks, and Snowflake, OpenLineage (an open standard) and its reference implementation Marquez provide a vendor-neutral lineage event API that each system emits to — giving you a unified graph across the entire stack. The key architectural principle: lineage should be captured automatically as a side effect of running jobs, never maintained manually.",
        followUp:
          'How would you use data lineage to estimate the blast radius of a proposed schema change — specifically dropping a column from a Bronze table — before making the change in production?',
        timeTarget: 90,
      },
    ],
  },

  {
    id: 'behavioral',
    label: 'Behavioral',
    icon: '🗣',
    color: '#0369a1',
    description: '8 behavioral questions covering production incidents, conflict resolution, mentoring, and prioritization',
    questions: [
      {
        id: 'beh-01',
        difficulty: 'Medium',
        question:
          'Tell me about a time you were on-call and had to resolve a production data incident that was causing business impact. Walk me through what you did, step by step.',
        expectedPoints: [
          'Describe the alert and how you scoped the impact (blast radius) before making changes',
          'Show structured thinking: triage first, then investigate, then fix — not the reverse',
          'Explain how you communicated status to stakeholders during the incident',
          'Describe the fix and how you verified it resolved the issue',
          'Mention the post-mortem: what preventive measures you put in place afterwards',
        ],
        modelAnswer:
          "A strong answer follows the STAR format but specifically demonstrates engineering discipline. Situation: describe a real incident — be specific about the alert, the time, and the business impact (e.g., 'our daily revenue report was 3 hours stale, affecting a board presentation at 9am'). Task: you were the on-call engineer. Action: walk through your investigation methodology — show that you scoped the problem before touching anything, checked logs and metrics to form a hypothesis, tested the hypothesis with a targeted query before running a fix, and communicated a status update to stakeholders every 15 minutes during the incident. Result: describe what you fixed and how you verified it (e.g., re-ran the pipeline and validated row counts matched source). Crucially, include the post-mortem: what monitoring did you add, what runbook did you write, what architectural change did you make to prevent recurrence? Interviewers are assessing: (1) your structured thinking under pressure, (2) your technical depth in identifying the root cause, (3) your communication skills with non-technical stakeholders, and (4) your ownership mentality in the post-incident follow-through. Avoid answers that jump straight to 'I fixed it' without showing the investigation process — the investigation is what demonstrates skill.",
        followUp:
          'How do you balance the urgency of restoring service quickly with the risk of making the situation worse by changing things in production without full understanding?',
        timeTarget: 90,
      },
      {
        id: 'beh-02',
        difficulty: 'Medium',
        question:
          'Describe a situation where you disagreed with a technical decision made by a colleague or manager. How did you handle it and what was the outcome?',
        expectedPoints: [
          'Show that you raised the disagreement professionally and with data/evidence, not just opinion',
          'Demonstrate that you listened to the other perspective and genuinely considered it',
          'Explain whether you changed your mind, reached a compromise, or escalated — and why',
          'Show that the relationship remained productive after the disagreement',
          'Avoid answers that frame you as always right or the other person as clearly wrong',
        ],
        modelAnswer:
          "A strong answer demonstrates that you can disagree and commit — a critical skill in data engineering where technical decisions have long-term consequences. Pick a real example where the stakes were meaningful (not a trivial disagreement). Structure: describe the technical decision being made (e.g., 'my manager wanted to move all our batch pipelines to a single Airflow instance with no failover, I believed this created unacceptable SLA risk'). Explain how you raised your concern: ideally in a private conversation first, with a concrete risk estimate ('this creates a single point of failure for 14 production pipelines including the daily revenue report'). Describe how you listened to the other perspective — there is usually a valid constraint you were not aware of (e.g., budget, timeline). Show what happened: either you brought data that changed the decision, you reached a compromise (e.g., failover for critical pipelines only), you were overruled and then committed fully to the chosen approach, or you escalated to a third party. The most important signal interviewers look for: that you separate 'winning the argument' from 'making the best decision for the team'. An answer where you were overruled but then executed the decision professionally and monitored for the risks you identified is often more impressive than an answer where you won the argument.",
        followUp:
          'How do you decide when a technical disagreement is worth escalating to leadership vs when you should disagree but commit and move on?',
        timeTarget: 90,
      },
      {
        id: 'beh-03',
        difficulty: 'Easy',
        question:
          'Tell me about a time you had to explain a complex data engineering concept to a non-technical stakeholder. What was the concept, how did you explain it, and did it work?',
        expectedPoints: [
          'Identify that the challenge is translating technical complexity into business impact language',
          'Describe using analogies or visual aids rather than technical jargon',
          'Show that you checked for understanding (asked questions, did not just monologue)',
          'Demonstrate that the explanation led to a concrete outcome (decision made, alignment reached)',
          'Reflect on what you would do differently if the first explanation did not land',
        ],
        modelAnswer:
          "Data engineers frequently need to explain concepts like data freshness, pipeline failures, or schema evolution to business analysts, product managers, or executives who care about outcomes not implementation. A strong answer picks a specific example with real stakes — not a training exercise. Describe the concept you needed to explain (e.g., why the dashboard is showing yesterday's data after a pipeline failure). Explain how you translated it: use business language and analogies rather than technical terms. For example: 'Imagine the dashboard is a newspaper. Our pipeline is the printing press. The printing press broke this morning, so the newspaper on your desk is yesterday's edition — we are fixing the press now and the new edition will be ready by 2pm.' Show that you confirmed understanding by asking 'Does that make sense?' or 'What questions do you have?' rather than assuming they understood. Describe the outcome — the stakeholder was able to communicate the situation to their own team accurately, or a decision was unblocked. The most important demonstration: that you think about communication as a skill to invest in, not a burden. Interviewers note whether you adapted to the audience (executive vs analyst), and whether you showed curiosity about what the stakeholder needed to know vs what you wanted to say.",
        followUp:
          'How do you decide how much technical detail to include when communicating a pipeline incident to the CTO vs to a data analyst?',
        timeTarget: 60,
      },
      {
        id: 'beh-04',
        difficulty: 'Medium',
        question:
          'Tell me about a time you had to push back on a stakeholder request because it was technically unfeasible or would create unsustainable technical debt. How did you handle it?',
        expectedPoints: [
          'Show that you understood the business need behind the request before pushback',
          'Explain that you came with an alternative solution, not just a "no"',
          'Quantify the technical debt or risk when possible (e.g., "this would require 3 months of refactoring later")',
          'Demonstrate that you maintained a collaborative relationship despite the pushback',
          'Show how the conversation led to a better outcome than the original request',
        ],
        modelAnswer:
          "Pushback is a core senior engineering skill — the ability to say 'no' effectively, with evidence, while preserving the relationship and offering a path forward. Strong answers avoid two failure modes: saying yes to everything (leading to unsustainable debt) and saying no without a constructive alternative (leaving the stakeholder without a solution). Pick an example with real stakes: e.g., a product manager wanted a new real-time feature implemented by direct queries against the production OLTP database, which would have caused query contention and risked production downtime. Start by describing how you first sought to understand the underlying need — 'before responding, I asked what decision they needed to make and on what frequency.' This often reveals that 'real-time' meant 'I want it to feel fast' rather than 'I need millisecond latency.' Then describe your pushback: acknowledge the business value of the request, quantify the risk of the as-asked approach ('querying the OLTP database directly risks 20-40% query latency increase for end users during business hours'), and immediately offer an alternative ('I can replicate this table to a read replica in 2 days, or build a cached dashboard in Tableau refreshing every 15 minutes'). The outcome should show that the stakeholder left the conversation with a path to achieving their goal, not just a refusal.",
        followUp:
          'How do you track and communicate technical debt so that business stakeholders understand the long-term cost of accumulated shortcuts?',
        timeTarget: 90,
      },
      {
        id: 'beh-05',
        difficulty: 'Easy',
        question:
          'Describe your approach to mentoring a junior data engineer. How do you balance teaching them with getting your own work done? What does a successful mentoring relationship look like to you?',
        expectedPoints: [
          'Show a structured approach: regular 1:1s, defined learning goals, not just ad-hoc help',
          'Demonstrate the "guide on the side" approach: ask questions to help them think through problems rather than giving answers',
          'Explain how you calibrate support: more guidance early, progressively more autonomy as they grow',
          'Describe how you make time for mentoring without sacrificing your own delivery',
          'Give a concrete example of a junior engineer\'s growth you contributed to',
        ],
        modelAnswer:
          "Effective mentoring in data engineering requires structure because the domain is broad and it is easy for juniors to feel overwhelmed or to get stuck on the wrong problems. My approach starts with understanding their current skill level and career goals in the first 1:1 — I ask what they want to be able to do in 6 months that they cannot do today. Then I create a lightweight learning plan: specific skills to develop (e.g., write their first dbt model, debug a Spark OOM), with real project work as the vehicle. For day-to-day support, I use the Socratic method when possible — when they bring a problem, I ask 'What have you tried? What does the error message tell you? What would you check next?' rather than immediately giving the answer. This takes longer in the moment but builds independent problem-solving faster. For time management: I block two fixed hours per week for mentoring-related activities and encourage juniors to batch their questions rather than interrupt me continuously. I also use code reviews as a teaching moment — I write review comments that explain the why, not just the what. A successful mentoring relationship is one where the junior engineer is taking on progressively harder work with less guidance over time, not where they depend on me for every decision. The metric I care about: within 6 months, are they debugging their own production issues?",
        followUp:
          'How do you handle a situation where a junior engineer you are mentoring is underperforming or consistently missing deadlines — at what point do you escalate to their manager?',
        timeTarget: 60,
      },
      {
        id: 'beh-06',
        difficulty: 'Medium',
        question:
          'Tell me about the most technically challenging project you have worked on as a data engineer. What made it hard, how did you approach the complexity, and what did you learn?',
        expectedPoints: [
          'Identify the sources of complexity (scale, ambiguity, technical novelty, cross-team dependencies)',
          'Show a structured approach to the complexity: break it down, prototype, get early feedback',
          'Demonstrate that you sought help and collaborated when appropriate — did not try to solve everything alone',
          'Quantify the outcome where possible: performance improvement, cost saving, time saved',
          'Share a genuine lesson learned — not a platitude, but a specific thing you would do differently',
        ],
        modelAnswer:
          "Choose a project with genuine technical depth — not one that sounds hard because you describe it vaguely. The answer should cover four things: what was technically hard and why (e.g., 'migrating a 10-year-old Hadoop cluster to Databricks while keeping pipelines live — 800 jobs, no documentation, and a 2-month deadline'), how you approached the complexity systematically (e.g., 'I started by building an automated job inventory tool to catalog all 800 jobs and their dependencies, then classified them by complexity and risk, and migrated in waves starting with the lowest-risk jobs'), what you did when you got stuck (e.g., 'we hit a Spark performance issue on a specific join pattern that took 2 weeks to diagnose — I used Spark UI flame graphs, posted in the Databricks community forum, and eventually found a known bug in Spark 3.2 that was fixed in 3.3'), and what the outcome was ('we completed the migration in 9 weeks, reduced compute costs by 40%, and had zero data SLA misses during the transition'). The lesson should be specific: e.g., 'I learned that the most important thing in a large migration is observability — if you cannot see clearly what is running and what is succeeding, you are working blind. I now build monitoring dashboards before starting any major pipeline work, not after.' Interviewers are assessing technical depth, problem-solving approach, and self-awareness.",
        followUp:
          'If you were starting that project over today, what would you do differently in the first two weeks?',
        timeTarget: 90,
      },
      {
        id: 'beh-07',
        difficulty: 'Medium',
        question:
          'Describe a time when you had to prioritize between multiple urgent requests from different stakeholders. How did you decide what to work on first and how did you communicate your prioritization?',
        expectedPoints: [
          'Show a framework for prioritization: business impact, urgency, effort, and dependencies',
          'Demonstrate that you communicated transparently with all stakeholders, not just the squeakiest wheel',
          'Show that you escalated to management when the prioritization was above your authority to decide',
          'Describe how you managed expectations for the lower-priority requests',
          'Reflect on whether the outcome validated your prioritization decision',
        ],
        modelAnswer:
          "Competing priorities are a constant in senior data engineering roles. A strong answer shows that you have a principled framework, not just gut instinct. The framework I use: score each request on business impact (what revenue or decision does this unblock?), urgency (what happens if this waits 24 hours vs 1 week?), and effort (is this a 1-hour fix or a 2-week project?). Present a specific scenario with real stakes — e.g., on the same Friday afternoon I had a P2 incident (a broken dashboard for the CFO), a product team asking for a new data feed, and a compliance team asking for a GDPR deletion to be processed. My prioritization: the GDPR deletion first (legal obligation with a 72-hour SLA), the CFO dashboard second (C-suite visibility and active meeting blocked), and the product data feed third (no deadline for 2 weeks). The communication part is equally important: I sent a Slack message to all three stakeholders explaining what I was working on, in what order, and giving an ETA for each. I asked the CFO's team if the 2-hour wait was acceptable or if they needed me to find someone else to cover. This kind of transparent communication prevents stakeholders from assuming their request is simply ignored. Post-prioritization reflection: was the decision right? In this case, yes — the GDPR deadline would have been missed by 4 hours if I had done the dashboard first.",
        followUp:
          'How do you handle a situation where two stakeholders of equal seniority both claim their request is the highest priority and you must choose between them?',
        timeTarget: 90,
      },
      {
        id: 'beh-08',
        difficulty: 'Hard',
        question:
          'Tell me about a time you identified a significant problem or opportunity proactively — something no one asked you to look at — and what happened as a result.',
        expectedPoints: [
          'Show curiosity and ownership: you were not waiting to be assigned the work',
          'Describe how you quantified or validated the problem before raising it (data-driven, not anecdotal)',
          'Explain how you built the business case and communicated it to get buy-in',
          'Show the outcome — was it acted on? If not, what did you learn about driving change?',
          'Demonstrate that this is a pattern of behavior, not a one-off — connect it to how you work generally',
        ],
        modelAnswer:
          "This question assesses ownership, curiosity, and the ability to drive change without being told to. The best answers describe finding a problem that had real business impact and taking it from observation to resolution. Example structure: 'While reviewing query costs for a routine optimization task, I noticed that 60% of our Snowflake credits were being consumed by a single BI dashboard tool running 400+ queries per day without result caching.' Quantify the discovery: 'I pulled 90 days of QUERY_HISTORY, built a cost attribution model by department, and found we were spending $18,000/month on queries that were identical and could be cached.' Build the case: 'I prepared a 5-slide deck quantifying the cost, identifying the root cause (the BI tool was configured to bypass result cache), and proposing a fix (3 configuration changes and a materialized view for the most expensive query).' Outcome: 'After presenting it to the data platform manager, we implemented the changes in one sprint and reduced our Snowflake bill by $12,000/month — a 40% reduction.' Connect to a general work pattern: 'I spend roughly 2 hours per week reviewing metrics and logs that nobody asked me to look at — a cost dashboard, pipeline latency trends, and data quality scores — because problems are cheaper to fix when you find them than when a stakeholder does.' Interviewers are looking for engineers who have internal motivation to improve things, not just task-completers.",
        followUp:
          'How do you avoid becoming overwhelmed by self-directed initiatives — how do you decide which proactive improvements are worth your time and which to let go?',
        timeTarget: 120,
      },
    ],
  },
];
