// Day in the Life — production incident simulations.
// Each scenario walks through a realistic data engineering incident with guided investigation.

export const SCENARIOS = [
  {
    id: 'null-spike',
    badge: 'Incident',
    badgeColor: '#dc2626',
    icon: '🚨',
    title: 'Null Spike in Orders Pipeline',
    time: '06:43 UTC',
    impact: 'High — 14k rows affected, 3 dashboards stale',
    skills: ['SQL', 'Data Quality', 'Schema Evolution'],
    context: `Your on-call alert fires at 6:43am. The orders Silver table is showing 23% NULL in customer_id — up from a 0.2% baseline. Three downstream Tableau dashboards are surfacing broken data and the business team is escalating.`,
    steps: [
      {
        title: 'Triage: Scope the problem',
        content: `First, establish the blast radius before touching anything.`,
        code: `-- How many rows are affected and since when?
SELECT
  DATE(ingested_at)          AS ingest_date,
  COUNT(*)                   AS total_rows,
  COUNT(customer_id)         AS non_null_count,
  ROUND(COUNT(customer_id) * 100.0 / COUNT(*), 2) AS fill_rate_pct
FROM silver.orders
WHERE ingested_at >= CURRENT_DATE - INTERVAL 7 DAYS
GROUP BY 1 ORDER BY 1 DESC;`,
        finding: 'Fill rate drops from 99.8% to 77.1% starting 2025-01-14 02:00 UTC — correlates with a source API deployment.',
      },
      {
        title: 'Root Cause: Schema drift in upstream API',
        content: `The upstream API team deployed v2 yesterday. Check the raw Bronze layer before any transformation.`,
        code: `-- Compare Bronze (raw) vs Silver (transformed) for the same batch
SELECT
  b.raw:customerId::STRING    AS bronze_customer_id_v1,
  b.raw:customer_id::STRING   AS bronze_customer_id_v2,
  s.customer_id               AS silver_customer_id
FROM bronze.orders_raw b
JOIN silver.orders s ON b.order_id = s.order_id
WHERE b.ingested_at >= '2025-01-14'
LIMIT 10;`,
        finding: 'API v2 renamed `customerId` → `customer_id`. The ETL transform was hardcoded to `customerId` — mapping broke silently.',
      },
      {
        title: 'Fix: Update the transformation + backfill',
        content: `Never patch data in place without an audit trail. Use Delta MERGE with a clear backfill logic.`,
        code: `-- Fix the ETL transform (update your PySpark/SQL pipeline)
-- Before: raw.get("customerId")
-- After:  raw.get("customer_id") or raw.get("customerId")  # handle both versions

-- Backfill affected rows using Delta MERGE
MERGE INTO silver.orders AS target
USING (
  SELECT
    order_id,
    COALESCE(raw:customer_id::STRING, raw:customerId::STRING) AS customer_id_fixed
  FROM bronze.orders_raw
  WHERE ingested_at BETWEEN '2025-01-14 02:00' AND CURRENT_TIMESTAMP
    AND COALESCE(raw:customer_id::STRING, raw:customerId::STRING) IS NOT NULL
) AS source
ON target.order_id = source.order_id
WHEN MATCHED AND target.customer_id IS NULL
  THEN UPDATE SET target.customer_id = source.customer_id_fixed;`,
        finding: 'Backfill completed. 14,203 rows patched. Downstream pipelines reprocessing.',
      },
      {
        title: 'Prevention: Add schema contract + data quality checks',
        content: `The real fix is preventing this from reaching Silver silently.`,
        code: `# Add a Great Expectations / dbt test to enforce fill rates
# great_expectations:
expect_column_values_to_not_be_null(
  column="customer_id",
  mostly=0.99  # fail if NULL rate > 1%
)

# In Databricks Delta Live Tables — add constraint:
CONSTRAINT valid_customer EXPECT (customer_id IS NOT NULL) ON VIOLATION DROP ROW

# Add to your schema registry or API contract:
# Source team must notify data team of field renames 5 days before deployment`,
        finding: 'Schema contract added. DQ check will fire before data reaches Silver. Postmortem scheduled.',
      },
    ],
    prompt: `I'm a data engineer debugging a production incident: 23% NULL spike in customer_id in my Silver orders table. The upstream API renamed "customerId" to "customer_id" in v2 without notifying my team. Help me: (1) write a Delta MERGE backfill query, (2) add a Great Expectations schema contract, (3) design a schema registry notification process to prevent this in future. Use production-grade PySpark and Databricks patterns.`,
  },
  {
    id: 'spark-skew',
    badge: 'Performance',
    badgeColor: '#d97706',
    icon: '⚡',
    title: 'Spark Job 8× Slower — SLA Breach',
    time: '09:15 UTC',
    impact: 'Medium-High — Daily report 2.5h late, SLA 30min',
    skills: ['PySpark', 'Spark Optimization', 'Partitioning'],
    context: `The daily sales aggregation job took 4 hours this morning instead of 30 minutes. The downstream BI team triggered an SLA breach. Your Spark UI shows one task taking 3.8 hours while all others finished in 12 minutes.`,
    steps: [
      {
        title: 'Diagnose: Read the Spark UI',
        content: `One executor processing 89% of data is the signature of a data skew problem.`,
        code: `# Check partition sizes — the smoking gun for skew
df = spark.table("silver.sales_events")
df.groupBy(spark_partition_id()).count().orderBy("count", ascending=False).show(20)

# Also check the distribution of your join key
df.groupBy("user_id").count() \
  .agg(
    F.min("count").alias("min"),
    F.max("count").alias("max"),
    F.mean("count").alias("mean"),
    F.percentile_approx("count", 0.99).alias("p99")
  ).show()`,
        finding: 'user_id="bot_crawler_1" has 4.2M events. Next highest user has 8k. Classic high-cardinality outlier skew.',
      },
      {
        title: 'Fix Option A: Filter + union (for known outliers)',
        content: `If the outlier is known (bots, test accounts), split the job.`,
        code: `# Split into normal + outlier paths, then union
normal = df.filter(F.col("user_id") != "bot_crawler_1")
outlier = df.filter(F.col("user_id") == "bot_crawler_1")

# Process outlier separately with more parallelism
result_normal  = normal.groupBy("user_id", "date").agg(...)
result_outlier = outlier.repartition(200).groupBy("user_id", "date").agg(...)

result = result_normal.union(result_outlier)`,
        finding: 'Job time: 4h → 28min. But this is brittle if new outliers emerge.',
      },
      {
        title: 'Fix Option B: Salting keys (robust solution)',
        content: `Salt the join key to distribute load across partitions. Best for unknown future skew.`,
        code: `import math

SALT_BUCKETS = 20

# Add salt to both sides of the join
events_salted = df.withColumn(
  "salted_key",
  F.concat(F.col("user_id"), F.lit("_"), (F.rand() * SALT_BUCKETS).cast("int"))
)
lookup_salted = lookup_df.withColumn("bucket", F.explode(F.array([F.lit(i) for i in range(SALT_BUCKETS)]))) \
  .withColumn("salted_key", F.concat(F.col("user_id"), F.lit("_"), F.col("bucket")))

result = events_salted.join(lookup_salted, "salted_key").drop("salted_key", "bucket")`,
        finding: 'Eliminates skew by spreading one hot key across 20 partitions. Adds ~2% overhead on non-skewed data.',
      },
      {
        title: 'Prevention: Adaptive Query Execution (AQE)',
        content: `Spark 3.x AQE handles skew joins automatically if enabled properly.`,
        code: `spark.conf.set("spark.sql.adaptive.enabled", "true")
spark.conf.set("spark.sql.adaptive.skewJoin.enabled", "true")
spark.conf.set("spark.sql.adaptive.skewJoin.skewedPartitionFactor", "5")
spark.conf.set("spark.sql.adaptive.skewJoin.skewedPartitionThresholdInBytes", "256m")

# Monitor: check skew metrics in Spark UI → SQL → Stages → Shuffle Read Size`,
        finding: 'AQE detects and splits skewed partitions at runtime. Enable this in all production Databricks clusters.',
      },
    ],
    prompt: `I'm debugging a Spark data skew issue. One user_id has 4M events while the average is 8k, causing one executor to process 89% of data and blowing my SLA. Explain: (1) how to diagnose skew using Spark UI and partition inspection, (2) the salting pattern with working PySpark code, (3) how AQE skew join detection works and when it's insufficient, (4) the tradeoffs between salting, repartition, and AQE. Use production Databricks 12.x patterns.`,
  },
  {
    id: 'schema-drift',
    badge: 'Schema',
    badgeColor: '#7c3aed',
    icon: '🔄',
    title: 'Schema Drift Broke Downstream Tables',
    time: '14:20 UTC',
    impact: 'Medium — BI team cannot load Tableau extracts',
    skills: ['Delta Lake', 'Schema Evolution', 'Data Contracts'],
    context: `The BI team reports "Invalid column: cust_tier" errors in Tableau at 2pm. Your Silver customer table DDL no longer matches the source. The source team added a new field without going through the schema review process.`,
    steps: [
      {
        title: 'Verify: Check Delta table history',
        content: `Delta Lake maintains full transaction history. Use it to find exactly when schema changed.`,
        code: `-- When did the schema change?
DESCRIBE HISTORY silver.customers;

-- What changed between versions?
SELECT
  version,
  timestamp,
  operation,
  operationParameters.schemaString
FROM (DESCRIBE HISTORY silver.customers)
WHERE operation IN ('WRITE', 'STREAMING UPDATE', 'MERGE')
ORDER BY version DESC
LIMIT 10;`,
        finding: 'Version 847 (2025-01-14 13:58 UTC): schema changed — `cust_tier STRING` added to source. Auto-migrate was disabled.',
      },
      {
        title: 'Enable schema evolution for Bronze → Silver',
        content: `Delta Lake supports two modes: schema enforcement (default) and schema evolution. Enable mergeSchema for additive changes.`,
        code: `# In your ingestion pipeline — allow additive schema changes
df.write \
  .format("delta") \
  .option("mergeSchema", "true") \
  .mode("append") \
  .save("/silver/customers")

# For streaming pipelines (Auto Loader):
spark.readStream \
  .format("cloudFiles") \
  .option("cloudFiles.format", "parquet") \
  .option("cloudFiles.schemaEvolutionMode", "addNewColumns") \
  .load(source_path)`,
        finding: 'mergeSchema adds new columns automatically. Existing downstream queries using `SELECT *` will now include the new column.',
      },
      {
        title: 'Protect downstream with schema contracts',
        content: `Upstream schema evolution shouldn't silently break consumers. Add schema contracts.`,
        code: `from delta.tables import DeltaTable

# Add column-level constraints
spark.sql("""
  ALTER TABLE silver.customers
  ADD CONSTRAINT valid_tier
  CHECK (cust_tier IN ('free', 'pro', 'enterprise') OR cust_tier IS NULL)
""")

# In dbt — add column-level tests
# models/silver/customers.yml
columns:
  - name: cust_tier
    tests:
      - accepted_values:
          values: ['free', 'pro', 'enterprise']
          config:
            severity: warn  # warn first, fail later`,
        finding: 'Schema contract registered. New columns trigger a Slack notification to consumers before deployment.',
      },
    ],
    prompt: `I'm dealing with schema drift in a Delta Lake medallion architecture. A source team added a new field without notice, breaking downstream Silver tables and Tableau dashboards. Explain: (1) how Delta's mergeSchema and autoMerge options work and their limitations, (2) how to implement schema contracts using dbt tests or Great Expectations, (3) how to design a schema registry notification process, (4) the difference between schema evolution vs schema enforcement in production Databricks. Be production-grade and opinionated.`,
  },
  {
    id: 'late-data',
    badge: 'Streaming',
    badgeColor: '#0891b2',
    icon: '🌊',
    title: 'Late Data: Revenue Reports Show −18%',
    time: '08:05 UTC',
    impact: 'High — CFO escalation, reporting integrity at risk',
    skills: ['Structured Streaming', 'Watermarks', 'Delta Lake'],
    context: `Monday morning. The CFO escalates: yesterday's revenue reports show −18% vs actuals. Your mobile app transactions arrive up to 6 hours late due to offline sync. Your streaming pipeline watermark is set to 2 hours — so 6-hour-late events are being silently dropped.`,
    steps: [
      {
        title: 'Diagnose: How many events are being dropped?',
        content: `Structured Streaming's watermark drops late events after the threshold. First quantify the loss.`,
        code: `-- Compare event_time distribution to ingestion_time
SELECT
  DATEDIFF(hour, event_time, ingestion_time) AS latency_hours,
  COUNT(*) AS event_count,
  SUM(transaction_amount) AS revenue_at_risk
FROM bronze.mobile_transactions
WHERE ingestion_time >= '2025-01-13' -- yesterday
GROUP BY 1
ORDER BY 1;`,
        finding: '23k events arrive 2-8 hours late. At current 2h watermark, ~18% of mobile revenue is being dropped. Matches CFO report.',
      },
      {
        title: 'Immediate fix: Extend watermark + trigger reprocessing',
        content: `Extend watermark to 8h for mobile stream. Process missed events with a batch backfill.`,
        code: `from pyspark.sql import functions as F

# Fix 1: Extend watermark in your streaming job
mobile_stream = spark.readStream \
  .format("delta") \
  .load("/bronze/mobile_transactions")

aggregated = mobile_stream \
  .withWatermark("event_time", "8 hours")  # was 2 hours
  .groupBy(
    F.window("event_time", "1 hour"),
    "product_id"
  ).agg(F.sum("amount").alias("revenue"))

# Fix 2: Batch backfill yesterday's late arrivals
spark.read.format("delta") \
  .load("/bronze/mobile_transactions") \
  .filter(
    (F.col("ingestion_time") >= "2025-01-13") &
    (F.col("event_time") >= "2025-01-12")  # capture prior-day events
  ) \
  .write.format("delta").mode("overwrite") \
  .option("replaceWhere", "report_date = '2025-01-13'") \
  .save("/gold/daily_revenue")`,
        finding: 'Backfill restored 18% revenue. Extended watermark prevents future losses up to 8h late arrivals.',
      },
      {
        title: 'Architecture: Use merge-on-read for late data',
        content: `Watermarks are a tradeoff between latency and completeness. For revenue reporting, use a reconciliation pattern.`,
        code: `# Pattern: Write provisional → reconcile with final
# Step 1: Provisional table (near-real-time, incomplete)
# Step 2: Reconciliation job runs hourly with 8h lookback

MERGE INTO gold.daily_revenue AS target
USING (
  SELECT
    DATE(event_time) AS report_date,
    SUM(amount) AS revenue
  FROM bronze.mobile_transactions
  WHERE ingestion_time >= CURRENT_TIMESTAMP - INTERVAL 8 HOURS
  GROUP BY 1
) AS source
ON target.report_date = source.report_date
WHEN MATCHED THEN UPDATE SET revenue = source.revenue
WHEN NOT MATCHED THEN INSERT *;

-- Dashboard reads from gold.daily_revenue
-- Report caveat: "Revenue figures updated every hour for 8h window"`,
        finding: 'Business now understands the 8h finality window. "Provisional" badge added to near-real-time dashboards.',
      },
    ],
    prompt: `I'm a data engineer debugging a late-arriving data problem in Structured Streaming. Mobile app transactions arrive up to 6 hours late due to offline sync. My 2-hour watermark is dropping 18% of revenue. Help me: (1) explain watermark mechanics and the completeness vs latency tradeoff, (2) write a production-grade reconciliation MERGE job, (3) design a "provisional + final" reporting architecture, (4) explain when to use Trigger.Once vs Trigger.AvailableNow for reconciliation jobs. Be opinionated and production-focused.`,
  },
  {
    id: 'cost-spike',
    badge: 'Cost',
    badgeColor: '#059669',
    icon: '💰',
    title: 'Storage Cost +400% — Engineering Escalation',
    time: '11:30 UTC',
    impact: 'Medium — $14k overage this month, finance escalating',
    skills: ['Delta Lake', 'File Optimization', 'Storage Management'],
    context: `Finance flags a $14k storage bill — 4× last month. Your data lake on Azure has ballooned from 2TB to 9TB in 3 weeks. The culprit: a streaming job writing every micro-batch to a new Parquet file, creating 180k files averaging 48KB each (the "small file problem").`,
    steps: [
      {
        title: 'Diagnose: Count small files',
        content: `Before fixing, understand the scale. Delta's transaction log makes this easy.`,
        code: `-- How bad is the small file problem?
SELECT
  COUNT(*)                         AS total_files,
  ROUND(AVG(size) / 1024, 1)      AS avg_size_kb,
  ROUND(SUM(size) / 1e9, 2)       AS total_size_gb,
  COUNT(CASE WHEN size < 134217728 THEN 1 END) AS files_under_128mb
FROM (
  SELECT explode(allFiles().path) AS file_path,
         allFiles().size          AS size
  FROM delta.\`/silver/events\`
);`,
        finding: '183,412 files, avg 48KB. Optimal is 128MB–1GB per file. Estimated overhead: 15× more files than needed = 15× more storage operations cost.',
      },
      {
        title: 'Immediate fix: OPTIMIZE + ZORDER',
        content: `Delta OPTIMIZE compacts small files. ZORDER co-locates data for query performance. Run both.`,
        code: `-- Compact all small files
OPTIMIZE silver.events;

-- With ZORDER on your most common filter column (faster subsequent queries)
OPTIMIZE silver.events ZORDER BY (event_date, user_id);

-- Enable Auto Optimize on the table to prevent future small files
ALTER TABLE silver.events
SET TBLPROPERTIES (
  'delta.autoOptimize.optimizeWrite' = 'true',
  'delta.autoOptimize.autoCompact'   = 'true'
);`,
        finding: '183k files → 1,247 files. Storage footprint: 9TB → 2.1TB. Query scan time reduced 8×.',
      },
      {
        title: 'Fix the streaming job: batch micro-batches',
        content: `The root cause is the streaming trigger firing too frequently. Use longer intervals or AvailableNow.`,
        code: `# Before: trigger every 10 seconds = thousands of small files
.trigger(processingTime="10 seconds")

# After Option A: trigger every 5 minutes (good for near-real-time)
.trigger(processingTime="5 minutes")

# After Option B: AvailableNow (process all backlog in one batch, then stop)
.trigger(availableNow=True)

# After Option C: Set file size target in Spark config
spark.conf.set("spark.sql.files.maxRecordsPerFile", 500000)  # ~128MB per file

# For Auto Loader pipelines — also set:
.option("cloudFiles.maxFilesPerTrigger", "1000")  # batch more files per trigger`,
        finding: 'Trigger interval changed to 5min. New files average 340MB. Monthly cost projected at $3.2k vs $14k.',
      },
      {
        title: 'Ongoing: Schedule VACUUM to remove old versions',
        content: `Delta retains deleted files for 7 days by default. VACUUM releases storage. Never skip this.`,
        code: `-- Remove old file versions (default 7 days retention — never go below this)
VACUUM silver.events RETAIN 168 HOURS;  -- 7 days in hours

-- Schedule as a weekly Databricks Job:
# In your Databricks workflow YAML:
tasks:
  - task_key: weekly_vacuum
    schedule: "0 2 * * 0"  # 2am every Sunday
    notebook_path: /shared/maintenance/vacuum_all_tables

-- Check: how much space will VACUUM reclaim?
SELECT
  SUM(size) / 1e9 AS reclaimable_gb
FROM delta.\`/silver/events\`
WHERE NOT is_data_change  -- deleted files`,
        finding: 'VACUUM reclaimed 6.8TB of deleted-but-retained files. Total storage now 2.1TB. VACUUM scheduled weekly.',
      },
    ],
    prompt: `I'm dealing with the small file problem in Delta Lake — a streaming job created 183k files at 48KB average, causing $14k/month storage costs. Help me: (1) explain why the small file problem is expensive beyond just storage (catalog overhead, read amplification), (2) write a compaction strategy using OPTIMIZE + ZORDER with rationale for when to use each, (3) explain autoOptimize vs manual compaction tradeoffs in production, (4) design a streaming job trigger configuration that balances latency vs file size. Production Databricks context.`,
  },
  {
    id: 'slow-query',
    badge: 'Debug',
    badgeColor: '#be185d',
    icon: '🔍',
    title: 'SQL Query Taking 47 Minutes on 10M Rows',
    time: '16:00 UTC',
    impact: 'Medium — Analyst blocked, reporting pipeline delayed',
    skills: ['SQL Optimization', 'Execution Plans', 'Partitioning'],
    context: `An analyst reports their daily metrics query is taking 47 minutes on a 10M row table. It's been running fine for months but started degrading 2 weeks ago when the data team began appending data in small batches. This is a common query optimization pattern interview.`,
    steps: [
      {
        title: 'Read the execution plan',
        content: `Never optimize a query without reading EXPLAIN ANALYZE first. Performance intuition without data is guessing.`,
        code: `-- Read the execution plan
EXPLAIN ANALYZE
SELECT
  customer_segment,
  DATE_TRUNC('week', order_date) AS week,
  SUM(revenue) AS weekly_revenue,
  COUNT(DISTINCT order_id) AS order_count
FROM silver.orders
WHERE order_date >= '2024-01-01'
GROUP BY 1, 2;

-- Look for: full table scans, nested loop joins, missing partition pruning
-- In Databricks: %sql EXPLAIN EXTENDED (shows physical plan + statistics)`,
        finding: 'Plan shows Full Table Scan on `silver.orders` (10M rows read). No partition pruning despite `order_date` filter. 847k files being scanned.',
      },
      {
        title: 'Fix: Partition pruning was silently broken',
        content: `Delta partition pruning only works if the filter column matches the partition column exactly.`,
        code: `-- Check: is the table actually partitioned?
DESCRIBE EXTENDED silver.orders;
-- Result: partitioned by ingestion_date (NOT order_date)
-- The WHERE clause filters on order_date — no pruning!

-- Fix Option A: Re-partition by order_date (requires full rewrite)
spark.table("silver.orders") \
  .repartitionByRange(200, "order_date") \
  .write.format("delta") \
  .partitionBy("order_date") \
  .mode("overwrite") \
  .option("overwriteSchema", "true") \
  .save("/silver/orders_v2")

-- Fix Option B: Add order_date as a clustering key (Delta 2.x+)
ALTER TABLE silver.orders
CLUSTER BY (order_date);  -- No full rewrite needed, applied incrementally`,
        finding: 'Table was partitioned on ingestion_date, not order_date. Analyst\'s date filter was doing a full scan. Re-clustering by order_date: query time 47min → 4.2min.',
      },
      {
        title: 'Fix the small file root cause',
        content: `847k files is why even a "good" query was slow. Run OPTIMIZE before re-evaluating performance.`,
        code: `-- First compact, THEN benchmark
OPTIMIZE silver.orders ZORDER BY (customer_segment, order_date);

-- After OPTIMIZE: check file count
SELECT COUNT(*) FROM (SHOW PARTITIONS silver.orders);

-- Benchmark the query again
-- Target: < 2 minutes for this query profile on 10M rows`,
        finding: '847k files → 312 files after OPTIMIZE. Same query: 47min → 38sec. Both fixes together = 74× improvement.',
      },
    ],
    prompt: `I'm optimizing a slow SQL query on a Delta Lake table. The query takes 47 minutes on 10M rows. EXPLAIN shows a full table scan despite a date filter — because the table is partitioned on ingestion_date, not order_date. Help me: (1) explain why partition pruning failed and how to verify it's working, (2) compare Delta clustering vs partitioning strategies with production tradeoffs, (3) how does ZORDER interact with Z-cube file layout and when does it help/hurt, (4) what metrics should I monitor in the Databricks SQL Warehouse UI to diagnose query bottlenecks systematically?`,
  },
];
