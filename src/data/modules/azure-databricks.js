export const databricksModule = {
  sections: [
    {
      title: 'Workspace Basics',
      subtopics: [
        {
          id: 'databricks-workspace',
          title: 'Workspace Overview',
          difficulty: 'Beginner',
          explanation: 'A Databricks Workspace is a cloud-based environment for collaborative data engineering and analytics. It provides notebooks, clusters, jobs, the Data Explorer, and the Databricks File System (DBFS).',
          why: 'Databricks brings together Spark compute, Delta Lake storage, notebooks, and workflow scheduling in one platform — eliminating the need to manage separate tools for each.',
          syntax: `Workspace structure:
  /Users/        — personal notebooks per user
  /Shared/       — team notebooks
  /Repos/        — Git-synced notebooks (Databricks Repos)
  /clusters/     — cluster definitions
  /jobs/         — scheduled workflow definitions

DBFS paths:
  dbfs:/mnt/     — mounted cloud storage (ADLS, S3, GCS)
  dbfs:/tmp/     — temporary storage
  dbfs:/FileStore/— uploaded files (UI)

Useful magic commands in notebooks:
  %python   — switch cell to Python
  %sql      — switch cell to SQL
  %md       — Markdown cell
  %sh       — run shell command
  %fs       — DBFS file system commands`,
          example: `# Check DBFS mount points
%fs ls /mnt/

# Check current cluster info
print(spark.version)
print(spark.sparkContext.master)

# Read from mounted ADLS
df = spark.read.parquet("dbfs:/mnt/datalake/silver/orders/")
print(f"Rows: {df.count()}")
df.printSchema()`,
          expectedOutput: `dbfs:/mnt/bronze/   DIRECTORY\ndbfs:/mnt/silver/   DIRECTORY\ndbfs:/mnt/gold/     DIRECTORY\n\n3.4.0\nSpark://driver:33615\nRows: 420000`,
          interview: {
            question: 'What is DBFS and what is it used for?',
            answer: 'DBFS (Databricks File System) is a distributed file system abstraction over cloud storage. It presents ADLS, S3, or GCS as local-looking paths (dbfs:/mnt/...). You mount cloud storage once and all notebooks use the dbfs:/ prefix.',
          },
          practice: 'Write a Databricks notebook cell that lists files in dbfs:/mnt/silver/, reads a Parquet file from there, and prints the row count and schema.',
          hint: 'Use %fs ls /mnt/silver/ for file listing. Then spark.read.parquet("dbfs:/mnt/silver/orders/").count() and .printSchema().',
          solution: `# Cell 1 — list files
%fs ls /mnt/silver/

# Cell 2 — read and inspect
df = spark.read.parquet("dbfs:/mnt/silver/orders/")
print(f"Total rows: {df.count()}")
df.printSchema()`,
        },
        {
          id: 'databricks-clusters',
          title: 'Clusters',
          difficulty: 'Intermediate',
          explanation: 'A Databricks cluster is a set of cloud VMs running Apache Spark. All-purpose clusters stay running for interactive work. Job clusters are created for a single job run and terminated when done.',
          why: 'Choosing the right cluster type controls cost and performance. An always-on all-purpose cluster costs 5-10× more than a job cluster for production workloads. Auto-scaling right-sizes the cluster for actual load.',
          syntax: `All-purpose cluster:
  Runtime:        Databricks Runtime 13.3 LTS
  Node type:      Standard_DS3_v2 (14 GB RAM, 4 cores)
  Workers:        2–8 (autoscale)
  Auto-terminate: 30 min idle
  Use for:        Development and exploration

Job cluster:
  Created fresh for each job run
  Terminated immediately on completion
  Use for:        Production scheduled jobs (cheapest)
  Config:         Defined in the Job configuration`,
          example: `# Check current cluster configuration
import json
from pyspark.sql import SparkSession

conf = spark.sparkContext.getConf()
print("Cluster name:   ", conf.get("spark.databricks.clusterName", "unknown"))
print("Runtime:        ", spark.conf.get("spark.databricks.clusterUsageTags.clusterWorkers", "?"), "workers")
print("Shuffle parts:  ", spark.conf.get("spark.sql.shuffle.partitions"))
print("Driver memory:  ", spark.conf.get("spark.driver.memory", "not set"))`,
          expectedOutput: `Cluster name:    dev-exploration\nRuntime:         4 workers\nShuffle parts:   200\nDriver memory:   28g`,
          interview: {
            question: 'What is the difference between a job cluster and an all-purpose cluster?',
            answer: 'A job cluster is created fresh for each job run and terminated immediately on completion — cheapest for production, zero idle cost. An all-purpose cluster stays running for interactive development and can be shared by multiple notebooks, but accumulates cost whenever idle. A practical rule: all-purpose clusters for development and exploration; job clusters for every scheduled production workflow. Forgetting to set auto-terminate on all-purpose clusters is one of the most common Databricks cost overrun causes.',
          },
          commonMistakes: [
            'Running production jobs on all-purpose clusters — they stay alive between runs, costing 5–10× more than a job cluster that terminates immediately.',
            'Setting cluster size too large and leaving it fixed — use autoscale (min 2, max 8 workers) so the cluster right-sizes for actual job load.',
            'Not enabling auto-terminate on all-purpose clusters — a developer forgets to stop the cluster and it runs overnight, accumulating hours of idle cost.',
          ],
          productionContext: 'In enterprise Databricks environments, teams enforce cluster policies via the Cluster Policy feature — engineers can only create clusters within approved node types and size ranges. Production job clusters are defined in Databricks Workflows (or ADF Databricks Notebook Activity) and always use the cheapest compatible node type for the job\'s memory profile.',
          performanceTip: 'Enable Photon runtime on compute-heavy jobs — Photon is Databricks\' vectorized C++ query engine that can speed up aggregations and joins by 2–5×. It\'s available on Standard and Premium tier clusters at a small DBU surcharge, but the speedup usually more than pays for it.',
          practice: 'Describe when you would choose a job cluster vs an all-purpose cluster. What is the cost risk of running production jobs on all-purpose clusters?',
          hint: 'All-purpose: development, exploration, interactive. Job clusters: production scheduled jobs. Risk: all-purpose clusters stay running even when idle, accumulating cost 24/7.',
          solution: `# Use all-purpose cluster when:
# - Developing and testing new notebooks
# - Exploring data interactively
# - Running ad-hoc queries in the UI
# - Multiple team members sharing a cluster for dev

# Use job cluster when:
# - Running scheduled production jobs (Databricks Workflows)
# - CI/CD pipeline tests
# - Any automated run that does not need the cluster to stay alive

# Cost risk: an all-purpose cluster with 8 workers running 24/7
# = 8 * $0.60/hr * 720 hrs/month = ~$3,456/month
# Same work on job clusters: 8 * $0.60/hr * 2 hrs/day * 30 days = ~$288/month
# 12x cost savings for production workloads`,
        },
      ],
    },
    {
      title: 'Notebooks',
      subtopics: [
        {
          id: 'databricks-notebooks',
          title: 'Notebooks & Magic Commands',
          difficulty: 'Beginner',
          explanation: 'Databricks notebooks are interactive documents with code cells (Python, SQL, Scala, R), markdown cells, and visualisation output. Magic commands (%sql, %md, %python, %sh) switch a cell\'s language.',
          why: 'Notebooks let data engineers prototype, document, and run transformations interactively before promoting to production jobs. They combine code, results, and documentation in one shareable document.',
          syntax: `# Python cell (default)
df = spark.read.parquet("dbfs:/mnt/silver/orders/")
display(df.limit(10))   # display() renders interactive tables

# Switch to SQL for a specific cell
%sql
SELECT status, COUNT(*) as cnt
FROM silver.orders
GROUP BY status

# Markdown cell
%md
## Orders Quality Check
This notebook validates the Silver orders layer.

# Shell command
%sh
ls /dbfs/mnt/silver/orders/ | head -5`,
          example: `# %md
# # Daily Orders Quality Report
# Run after Bronze → Silver transform

# --- Cell 1: Load data
df = spark.read.format("delta").load("dbfs:/mnt/silver/orders")
total = df.count()
print(f"Total rows: {total:,}")

# --- Cell 2: Null check
from pyspark.sql.functions import col
null_amounts = df.filter(col("amount").isNull()).count()
null_ids     = df.filter(col("order_id").isNull()).count()
print(f"Null amounts: {null_amounts}  |  Null order_ids: {null_ids}")

# --- Cell 3: Status distribution (SQL cell)
%sql
SELECT status, COUNT(*) as count, ROUND(COUNT(*) * 100.0 / SUM(COUNT(*)) OVER (), 1) as pct
FROM silver.orders
GROUP BY status
ORDER BY count DESC`,
          expectedOutput: `Total rows: 420,000\nNull amounts: 0  |  Null order_ids: 0\n\nstatus    | count  | pct\nshipped   | 280000 | 66.7\npending   | 84000  | 20.0\ndelivered | 42000  |  10.0\ncancelled |  14000 |   3.3`,
          interview: {
            question: 'What is the difference between display() and show() in Databricks?',
            answer: 'show() is the standard PySpark method — prints text output to the console. display() is Databricks-specific — renders an interactive table with sortable columns, pagination, and built-in chart visualisation in the notebook UI.',
          },
          practice: 'Write a Databricks notebook with three cells: (1) Python cell reading a Delta table and printing row count, (2) SQL cell showing status distribution, (3) Markdown cell with a header. What magic command switches a cell to SQL?',
          hint: 'Magic command: %sql at the top of the cell. For Python: %python (or no prefix as it is the default). For markdown: %md.',
          solution: `# Cell 1: Python
df = spark.read.format("delta").load("dbfs:/mnt/silver/orders")
print(f"Rows: {df.count():,}")

# Cell 2: SQL (%sql magic at top of cell)
# %sql
# SELECT status, COUNT(*) as order_count
# FROM silver.orders
# GROUP BY status
# ORDER BY order_count DESC

# Cell 3: Markdown (%md magic)
# %md
# ## Orders Summary Report
# Quality checks for the Silver orders Delta table.
# Run daily after the ingestion job completes.`,
        },
        {
          id: 'databricks-widgets',
          title: 'Widgets & Notebook Parameters',
          difficulty: 'Intermediate',
          explanation: 'Databricks Widgets are interactive input controls that parameterise notebooks. They let users change values without editing code. Widgets can be text, dropdown, combobox, or multiselect.',
          why: 'Widgets make notebooks reusable for different dates, environments, and inputs. A notebook with a date widget replaces 365 hardcoded notebooks. Jobs pass widget values as job parameters.',
          syntax: `import databricks.sdk.runtime  # for dbutils

# Create widgets
dbutils.widgets.text("load_date", "2024-01-15", "Load Date")
dbutils.widgets.dropdown("env", "prod", ["dev", "test", "prod"], "Environment")

# Read widget values
load_date = dbutils.widgets.get("load_date")
env       = dbutils.widgets.get("env")

# Remove widget
dbutils.widgets.remove("load_date")

# Remove all widgets
dbutils.widgets.removeAll()`,
          example: `# At top of notebook — create input widgets
dbutils.widgets.text("load_date",     "2024-01-15", "Load Date")
dbutils.widgets.dropdown("load_type", "incremental", ["full", "incremental"])

# Read values
load_date = dbutils.widgets.get("load_date")
load_type = dbutils.widgets.get("load_type")

print(f"Loading {load_type} data for {load_date}")

# Use in path expression
source_path = f"dbfs:/mnt/bronze/orders/date={load_date}/"
df = spark.read.parquet(source_path)
print(f"Rows: {df.count():,}")`,
          expectedOutput: `Loading incremental data for 2024-01-15\nRows: 4,200`,
          interview: {
            question: 'How do you pass parameters to a Databricks notebook from an ADF pipeline?',
            answer: 'In ADF, use a Databricks Notebook Activity. Under Base parameters, add key-value pairs matching your widget names. ADF passes them at runtime. In the notebook, read with dbutils.widgets.get("param_name").',
          },
          practice: 'Write the code to create two widgets in a Databricks notebook: a text widget for "run_date" (default today) and a dropdown for "layer" with options bronze, silver, gold. Then read and print both values.',
          hint: 'Use dbutils.widgets.text("run_date", ...) and dbutils.widgets.dropdown("layer", "silver", ["bronze", "silver", "gold"]). Read with dbutils.widgets.get("name").',
          solution: `dbutils.widgets.text(    "run_date", "2024-01-15",   "Run Date")
dbutils.widgets.dropdown("layer",    "silver",       ["bronze","silver","gold"], "Layer")

run_date = dbutils.widgets.get("run_date")
layer    = dbutils.widgets.get("layer")

path = f"dbfs:/mnt/{layer}/orders/date={run_date}/"
print(f"Reading from: {path}")`,
        },
      ],
    },
    {
      title: 'Delta Lake',
      subtopics: [
        {
          id: 'databricks-delta-lake',
          title: 'Delta Lake in Databricks',
          difficulty: 'Intermediate',
          explanation: 'Delta Lake is the default table format in Databricks. It adds ACID transactions, schema enforcement, time travel, and streaming support on top of Parquet. All Databricks managed tables are Delta by default.',
          why: 'Delta solves the three biggest problems with data lakes: no updates, no schema enforcement, and no transactional safety. It makes a data lake behave like a database while keeping lake-scale storage economics.',
          syntax: `# Write Delta table
df.write.format("delta").mode("overwrite").save("dbfs:/mnt/silver/orders")

# Register as SQL table
spark.sql("""
  CREATE TABLE IF NOT EXISTS silver.orders
  USING DELTA
  LOCATION 'dbfs:/mnt/silver/orders'
""")

# Append new records
new_df.write.format("delta").mode("append").save("dbfs:/mnt/silver/orders")

# Read with time travel
old = spark.read.format("delta").option("versionAsOf", 5).load("dbfs:/mnt/silver/orders")`,
          example: `from delta.tables import DeltaTable
from pyspark.sql.functions import col

# Write
df.write.format("delta").mode("overwrite").save("dbfs:/mnt/silver/orders")

# Table history
dt = DeltaTable.forPath(spark, "dbfs:/mnt/silver/orders")
dt.history(5).select("version","timestamp","operation","operationMetrics").show(truncate=False)

# Optimize + Z-order for faster queries
spark.sql("OPTIMIZE delta.\`dbfs:/mnt/silver/orders\` ZORDER BY (customer_id, order_date)")

# Vacuum old versions (keep last 7 days)
spark.sql("VACUUM delta.\`dbfs:/mnt/silver/orders\` RETAIN 168 HOURS")`,
          expectedOutput: `+-------+-------------------+---------+------------------------------------------+\n|version|timestamp          |operation|operationMetrics                          |\n+-------+-------------------+---------+------------------------------------------+\n|      4|2024-01-16 06:02:00|MERGE    |{numTargetRowsUpdated->1240,inserted->312}|\n|      3|2024-01-15 06:01:00|WRITE    |{numFiles->24,numOutputRows->42000}       |\n|      2|2024-01-14 06:00:00|OPTIMIZE |{numFilesAdded->1,numFilesRemoved->24}    |\n+-------+-------------------+---------+------------------------------------------+`,
          interview: {
            question: 'What are the four key features Delta Lake adds over plain Parquet?',
            answer: '(1) ACID transactions — concurrent reads and writes are safe via optimistic concurrency control in the _delta_log. (2) Schema enforcement — writes that don\'t match the table schema fail fast, preventing silent data corruption. (3) Time travel — every write creates a new version in the transaction log; query any past version with VERSION AS OF or TIMESTAMP AS OF. (4) DML operations — UPDATE, DELETE, and MERGE are supported; plain Parquet cannot update rows without rewriting entire files. These four properties transform a data lake from a write-only archive into a reliable operational store.',
          },
          commonMistakes: [
            'Running VACUUM with RETAIN 0 HOURS in production — this deletes all historical versions immediately, breaking any in-flight reads and removing the ability to time-travel or rollback.',
            'Forgetting to run OPTIMIZE after many small MERGE operations — each MERGE appends new data files; without OPTIMIZE, the table accumulates thousands of small files that slow reads significantly.',
            'Using overwrite mode for incremental data — overwrites rewrite the entire table even when only 1% of rows changed; use MERGE for incremental updates.',
          ],
          productionContext: 'In production Databricks pipelines, OPTIMIZE runs nightly as a maintenance job after the last MERGE of the day. VACUUM runs weekly with RETAIN 168 HOURS (7 days) to balance storage cost against rollback capability. The transaction log is the source of truth for all change history — never manually delete files from the Delta table directory.',
          performanceTip: 'ZORDER BY is the most impactful single optimization for Delta query performance. Choose the column you filter most often in queries (e.g., customer_id or order_date). ZORDER physically co-locates rows with similar key values in the same Parquet files, allowing Delta file skipping to eliminate 80–99% of files on filtered queries.',
          practice: 'Write a Delta table to dbfs:/mnt/silver/customers in overwrite mode, then show the last 3 history entries, then run OPTIMIZE with ZORDER BY customer_id.',
          hint: 'Write with .format("delta").mode("overwrite"). Use DeltaTable.forPath() for history. OPTIMIZE SQL: "OPTIMIZE delta.`path` ZORDER BY (customer_id)".',
          solution: `from delta.tables import DeltaTable

# Write
df.write.format("delta").mode("overwrite").save("dbfs:/mnt/silver/customers")

# History
dt = DeltaTable.forPath(spark, "dbfs:/mnt/silver/customers")
dt.history(3).select("version","timestamp","operation").show()

# Optimize
spark.sql("OPTIMIZE delta.\`dbfs:/mnt/silver/customers\` ZORDER BY (customer_id)")`,
        },
      ],
    },
    {
      title: 'Unity Catalog',
      subtopics: [
        {
          id: 'databricks-unity-catalog',
          title: 'Unity Catalog — Data Governance',
          difficulty: 'Intermediate',
          explanation: 'Unity Catalog is Databricks\' centralised governance layer. It provides a three-level namespace (catalog.schema.table), column-level access controls, data lineage, and audit logging across all workspaces.',
          why: 'Without Unity Catalog, each workspace has isolated security. Unity Catalog provides one place to manage access — grant analyst A access to gold.sales.orders across all workspaces from one policy.',
          syntax: `-- Three-level namespace
SELECT * FROM prod_catalog.silver.orders;

-- Grant access
GRANT SELECT ON TABLE prod_catalog.silver.orders TO analysts;
GRANT USAGE ON CATALOG prod_catalog TO data_team;

-- Row-level security
CREATE ROW FILTER region_filter ON prod_catalog.silver.orders
AS (current_user() IN (SELECT user FROM region_access WHERE region = region));

-- Column masking
CREATE FUNCTION mask_email(email STRING)
RETURNS STRING
RETURN CASE WHEN is_account_group_member('data_admin')
            THEN email ELSE regexp_replace(email, '(.*)@', '*****@') END;`,
          example: `-- Check catalogs and schemas
SHOW CATALOGS;
SHOW SCHEMAS IN prod_catalog;

-- Create a managed table in Unity Catalog
CREATE TABLE prod_catalog.silver.orders (
    order_id    BIGINT NOT NULL,
    customer_id BIGINT,
    amount      DOUBLE,
    status      STRING,
    order_date  DATE
) USING DELTA;

-- Grant access to team
GRANT SELECT ON TABLE prod_catalog.silver.orders TO \`data-analysts-group\`;
GRANT MODIFY ON TABLE prod_catalog.silver.orders TO \`data-engineers-group\`;

-- Audit: who accessed what
SELECT user_identity.email, action_name, request_params
FROM system.access.audit
WHERE action_name = 'selectTable'
  AND request_params.table_full_name = 'prod_catalog.silver.orders'
ORDER BY event_time DESC LIMIT 20;`,
          expectedOutput: `prod_catalog\ndev_catalog\n\nsilver (schema)\ngold (schema)\n\nGrant applied to data-analysts-group on prod_catalog.silver.orders`,
          interview: {
            question: 'What is the three-level namespace in Unity Catalog and how does it map to real-world environments?',
            answer: 'Catalog → Schema → Table. Example: prod_catalog.silver.orders. The catalog is typically an environment (dev_catalog, test_catalog, prod_catalog) or a business domain (sales_catalog, finance_catalog). Schema is a grouping within the catalog — often a medallion layer (bronze, silver, gold) or a business subdomain. This three-level structure lets you grant access at any level: GRANT USAGE ON CATALOG prod_catalog (environment-wide), GRANT SELECT ON SCHEMA prod_catalog.gold (all gold tables), or GRANT SELECT ON TABLE prod_catalog.gold.revenue (one table). Unity Catalog enforces these grants consistently across all workspaces in the account.',
          },
          commonMistakes: [
            'Granting access at the table level for every table individually — use schema-level or catalog-level grants for groups, then restrict exceptions at table level.',
            'Not enabling lineage tracking before starting pipeline development — Unity Catalog captures column-level lineage automatically once enabled, but historical lineage before enablement is lost.',
            'Mixing Unity Catalog tables with legacy hive_metastore tables in the same pipeline — cross-metastore joins work but lineage and governance don\'t apply to legacy tables.',
          ],
          productionContext: 'In a mature Databricks deployment, the data governance team owns the Unity Catalog structure: one catalog per environment, schemas per domain/layer, and all grants managed via service principal groups rather than individual users. Engineers request access via a ticket process; the governance team grants it in Unity Catalog. This replaces the old per-workspace, per-mount-point access matrix.',
          performanceTip: 'Unity Catalog\'s system tables (system.access.audit, system.access.table_lineage) are invaluable for understanding query patterns. Run weekly reports on the most-queried Gold tables and which teams read them — this drives OPTIMIZE and ZORDER decisions (optimize what gets queried most).',
          practice: 'Write SQL to grant SELECT on a table "gold.daily_revenue" in catalog "prod" to a group "executive_team". Also write a SHOW SCHEMAS query to list all schemas in the prod catalog.',
          hint: 'GRANT SELECT ON TABLE prod.gold.daily_revenue TO `executive_team`. SHOW SCHEMAS IN prod.',
          solution: `-- Grant access
GRANT SELECT ON TABLE prod.gold.daily_revenue TO \`executive_team\`;

-- Verify schemas in catalog
SHOW SCHEMAS IN prod;

-- Check what permissions a group has
SHOW GRANTS ON TABLE prod.gold.daily_revenue;

-- Unity Catalog lineage — see upstream tables
SELECT source_table_full_name, target_table_full_name
FROM system.access.table_lineage
WHERE target_table_full_name = 'prod.gold.daily_revenue'`,
        },
      ],
    },
    {
      title: 'Medallion Architecture',
      subtopics: [
        {
          id: 'databricks-medallion',
          title: 'Bronze → Silver → Gold',
          difficulty: 'Intermediate',
          explanation: 'The Medallion Architecture organises data into three layers: Bronze (raw, append-only), Silver (clean, typed, deduplicated), Gold (aggregated, business-ready). Each layer has a clear data quality contract.',
          why: 'The three-layer pattern gives a clear pipeline structure: Bronze preserves the original data for debugging, Silver is the trusted cleaned dataset, Gold serves BI tools and dashboards. Reprocessing Silver from Bronze is always possible.',
          syntax: `Bronze:  Raw ingest — no changes, schema flexible
  "dbfs:/mnt/bronze/orders/"
  Write mode: append
  Format: Delta (or Parquet for raw)

Silver:  Clean and conforming — typed, deduped, validated
  "dbfs:/mnt/silver/orders/"
  Write mode: MERGE or overwrite by date
  Format: Delta

Gold:    Aggregated — optimised for reporting
  "dbfs:/mnt/gold/daily_revenue/"
  Write mode: overwrite or MERGE
  Format: Delta`,
          example: `from pyspark.sql.functions import col, to_timestamp, current_timestamp

# Bronze → Silver transform
bronze = spark.read.format("delta").load("dbfs:/mnt/bronze/orders")

silver = bronze \\
    .dropDuplicates(["order_id"]) \\
    .filter(col("amount").isNotNull() & (col("amount") > 0)) \\
    .withColumn("amount",     col("amount").cast("double")) \\
    .withColumn("created_at", to_timestamp("created_at", "yyyy-MM-dd HH:mm:ss")) \\
    .withColumn("silver_loaded_at", current_timestamp())

silver.write.format("delta").mode("overwrite").save("dbfs:/mnt/silver/orders")

# Silver → Gold aggregate
gold = silver \\
    .groupBy("order_date", "status") \\
    .agg({"amount": "sum", "order_id": "count"}) \\
    .withColumnRenamed("sum(amount)", "daily_revenue") \\
    .withColumnRenamed("count(order_id)", "order_count")

gold.write.format("delta").mode("overwrite").save("dbfs:/mnt/gold/daily_revenue")`,
          expectedOutput: `Silver: 42,000 rows (3 duplicates dropped, 8 nulls removed)\nGold:   4 rows (one per status per day)\n\nGold preview:\n+----------+---------+--------------+------------+\n|order_date|   status|daily_revenue |order_count |\n+----------+---------+--------------+------------+\n|2024-01-15|  shipped|    56,000.00 |        280 |\n|2024-01-15|  pending|    15,600.00 |        120 |`,
          interview: {
            question: 'Why is Bronze data kept raw and unchanged?',
            answer: 'Bronze is an immutable audit trail of exactly what the source system sent. If the Silver notebook has a bug (wrong filter, incorrect cast), you reprocess from Bronze with the corrected logic without re-extracting from source — critical when the source is a transactional database that doesn\'t retain deleted records, or a message queue that only retains 7 days. Bronze also stores data before any business rules are applied, so compliance teams can audit what the raw source delivered vs what transformations changed it. In practice, Bronze tables are append-only Delta tables with minimal schema enforcement.',
          },
          commonMistakes: [
            'Applying business logic transformations in Bronze — any transform in Bronze means you cannot replay the pipeline from raw data if the logic changes.',
            'Compressing or re-encoding raw files before Bronze landing — raw data should be stored as-received for maximum recoverability and audit fidelity.',
            'Running VACUUM too aggressively on Bronze — Bronze is your last recovery line; retain at least 30 days of history.',
          ],
          productionContext: 'In Databricks Workflows, the Bronze → Silver → Gold pipeline is typically three separate notebook jobs chained as task dependencies. Bronze runs first (ingest from ADLS/Kafka), then Silver (clean/merge), then Gold (aggregate). If Silver fails, Bronze is complete and untouched — you fix the Silver notebook and re-run just that task without re-ingesting.',
          performanceTip: 'Use Delta Auto Loader (cloudFiles format) for Bronze ingestion — it tracks which files have been processed using checkpoints, so re-running the Bronze notebook never re-ingests already-loaded files. This makes Bronze idempotent without any watermark table management.',
          practice: 'Describe what transformations happen at each medallion layer. Give one example of something you do in Silver that you would NOT do in Bronze.',
          hint: 'Bronze: raw, no changes. Silver: clean, cast types, deduplicate, validate. Gold: aggregate, join with dimensions, format for BI. Silver example: cast string amounts to double.',
          solution: `# Bronze layer: append-only, raw, no transformations
# - Ingest exactly as received from source
# - Preserve original column names and types (all strings if CSV)
# - Add only: ingest_timestamp, source_file_name

# Silver layer: clean and conform
# - Cast types: "150.00" (string) → 150.0 (double)
# - Deduplicate: remove duplicate order_ids
# - Validate: filter null amounts and negative values
# - Standardise: lowercase status, strip whitespace from names
# Example (NOT in Bronze): col("amount").cast("double") with null check

# Gold layer: aggregate for business use
# - GROUP BY date and status for daily revenue report
# - JOIN with dimension tables (product names, customer segments)
# - Create pre-computed KPIs for dashboards
# - Optimised for query performance (ZORDER, partitioning)`,
        },
      ],
    },
    {
      title: 'Structured Streaming',
      subtopics: [
        {
          id: 'databricks-streaming',
          title: 'Structured Streaming Basics',
          difficulty: 'Advanced',
          explanation: 'Structured Streaming processes continuous data streams using the same DataFrame API as batch Spark. It reads from Kafka, Event Hubs, cloud files, or Delta tables, processes incrementally, and writes to Delta tables or other sinks.',
          why: 'Near real-time use cases — fraud detection, live dashboards, IoT processing — need data processed within seconds of arrival, not in the next morning\'s batch job.',
          syntax: `# Read stream from Delta table
stream = spark.readStream \\
    .format("delta") \\
    .load("dbfs:/mnt/bronze/events/")

# Read from Kafka
stream = spark.readStream \\
    .format("kafka") \\
    .option("kafka.bootstrap.servers", "broker:9092") \\
    .option("subscribe", "orders-topic") \\
    .load()

# Write stream to Delta table
query = stream.writeStream \\
    .format("delta") \\
    .outputMode("append") \\
    .option("checkpointLocation", "dbfs:/mnt/checkpoints/events/") \\
    .start("dbfs:/mnt/silver/events/")`,
          example: `from pyspark.sql.functions import col, from_json, current_timestamp
from pyspark.sql.types import StructType, StructField, StringType, DoubleType

schema = StructType([
    StructField("order_id",    StringType(),  True),
    StructField("amount",      DoubleType(),  True),
    StructField("status",      StringType(),  True),
])

# Read incoming Kafka JSON messages
raw_stream = spark.readStream \\
    .format("kafka") \\
    .option("kafka.bootstrap.servers", "eventhub:9093") \\
    .option("subscribe", "orders") \\
    .load()

# Parse JSON payload
parsed = raw_stream \\
    .select(from_json(col("value").cast("string"), schema).alias("data")) \\
    .select("data.*") \\
    .withColumn("processed_at", current_timestamp())

# Write to Delta sink with checkpointing
query = parsed.writeStream \\
    .format("delta") \\
    .outputMode("append") \\
    .option("checkpointLocation", "dbfs:/checkpoints/orders/") \\
    .start("dbfs:/mnt/silver/orders_stream/")

query.awaitTermination()`,
          expectedOutput: `Stream started. Processing messages...\n[Batch 1] Processed 42 records in 1.2s\n[Batch 2] Processed 18 records in 0.9s\nStream running — no termination.`,
          interview: {
            question: 'What is a checkpoint in Structured Streaming and why is it critical?',
            answer: 'A checkpoint stores the stream\'s progress — which offsets (Kafka topic/partition/offset or file paths) have been processed — in durable storage (ADLS, DBFS). On restart after failure, Spark reads the checkpoint and resumes exactly where it left off, preventing duplicate processing and data loss. Without a checkpoint: if the cluster crashes and restarts, the stream starts from the beginning (or latest, depending on startingOffsets), causing either data loss or reprocessing. Always set checkpointLocation to a unique path per stream; sharing a checkpoint between two streams corrupts both.',
          },
          commonMistakes: [
            'Reusing the same checkpointLocation for a different stream or after schema changes — checkpoint state is tied to the exact query structure; changing the schema or reusing the path causes failures.',
            'Not setting checkpointLocation at all — Spark will warn but continue; on restart, the stream starts from offset 0 or latest, creating gaps or duplicates.',
            'Using awaitTermination() in production notebooks — it blocks the notebook cell indefinitely. In production, run streams as Databricks Workflows in "Continuous" mode instead.',
          ],
          productionContext: 'In production, Databricks Structured Streaming jobs run as Workflows with "Continuous" job type — Databricks manages the always-on compute and auto-restarts the stream on cluster failure. The checkpoint (on ADLS) ensures the stream picks up exactly where it left off. Monitoring is via Databricks Structured Streaming UI: lag metrics, batch duration, input rate per trigger.',
          performanceTip: 'Set trigger(processingTime="30 seconds") instead of the default continuous trigger for most streaming jobs. This batches 30 seconds of data per micro-batch, dramatically improving throughput vs the default (process each message individually). For near-real-time requirements, "10 seconds" is a common production setting that balances latency with efficiency.',
          practice: 'Describe how a Structured Streaming job differs from a batch Spark job. What must you always configure and why?',
          hint: 'Differences: batch reads a static source; streaming reads an unbounded source continuously. Must configure: checkpointLocation (so progress survives restarts).',
          solution: `# Batch Spark:
# - Reads a fixed dataset (all files in a folder, all rows in a table)
# - Runs, completes, terminates
# - Re-run processes the same data again

# Structured Streaming:
# - Reads an unbounded source (Kafka, Event Hubs, cloud files)
# - Runs continuously, processing new data as it arrives
# - Never terminates (until stopped)
# - Uses micro-batches (default) or continuous processing

# Must configure: checkpointLocation
# WHY: Checkpoints track which offsets have been processed.
# On cluster restart (crash, rolling upgrade), the stream resumes
# from the last checkpoint — no data loss and no duplicate processing.
# Without checkpoints, every restart reprocesses everything from the start.`,
        },
      ],
    },
    {
      title: 'Autoloader',
      subtopics: [
        {
          id: 'databricks-autoloader',
          title: 'Autoloader (cloudFiles)',
          difficulty: 'Intermediate',
          explanation: 'Autoloader incrementally ingests files from cloud storage (ADLS, S3, GCS) as they arrive. It uses the cloudFiles format, tracks processed files in a checkpoint, and supports schema inference and schema evolution.',
          why: 'Without Autoloader, ingesting new files requires either full re-reads (expensive) or custom file tracking logic (complex). Autoloader handles new file detection, schema changes, and exactly-once processing automatically.',
          syntax: `# Autoloader reads new files continuously
stream = spark.readStream \\
    .format("cloudFiles") \\
    .option("cloudFiles.format", "csv")       # source format
    .option("cloudFiles.schemaLocation", "dbfs:/schemas/orders/")  # inferred schema
    .option("header", "true") \\
    .load("abfss://raw@storage.dfs.core.windows.net/orders/")

# Write to Bronze Delta
query = stream.writeStream \\
    .format("delta") \\
    .option("checkpointLocation", "dbfs:/checkpoints/orders-bronze/") \\
    .start("dbfs:/mnt/bronze/orders/")`,
          example: `# Autoloader for JSON files with schema inference
stream = spark.readStream \\
    .format("cloudFiles") \\
    .option("cloudFiles.format", "json") \\
    .option("cloudFiles.schemaLocation", "dbfs:/mnt/schemas/events/") \\
    .option("cloudFiles.inferColumnTypes", "true") \\
    .load("abfss://raw@adlsaccount.dfs.core.windows.net/events/")

enriched = stream \\
    .withColumn("source_file", col("_metadata.file_path")) \\
    .withColumn("ingest_time", current_timestamp())

query = enriched.writeStream \\
    .format("delta") \\
    .option("checkpointLocation", "dbfs:/checkpoints/events-bronze/") \\
    .option("mergeSchema", "true") \\
    .outputMode("append") \\
    .start("dbfs:/mnt/bronze/events/")

print(f"Query ID: {query.id}")
print(f"Status: {query.status['message']}")`,
          expectedOutput: `Query ID: abc123-def456\nStatus: Processing new data\n\nNew files processed as they arrive:\n[2024-01-15 06:00:01] orders_20240115_001.json → 4,200 rows\n[2024-01-15 06:00:45] orders_20240115_002.json → 3,890 rows`,
          interview: {
            question: 'What makes Autoloader better than listing files manually for incremental ingestion?',
            answer: 'Listing files manually (spark.read where filename > last_processed) requires scanning all directory metadata on every run — slow and unreliable at millions of files. Autoloader uses cloud notification events (Azure Event Grid, AWS SNS/SQS) to detect new files without scanning: new files trigger an event, Autoloader queues them, processes them, and marks them done in the checkpoint. This scales to millions of files per day. It also handles schema evolution: new columns in source files are detected automatically and added to the Bronze Delta table with mergeSchema=true.',
          },
          commonMistakes: [
            'Forgetting cloudFiles.schemaLocation — Autoloader needs a stable path to persist inferred schema across restarts; without it, schema is re-inferred on every run (slow and inconsistent).',
            'Using file listing mode when directory contains millions of files — file listing mode scans the entire directory on every micro-batch; notification mode (the default for ADLS/S3) is required at scale.',
            'Pointing two Autoloader streams at the same path with different checkpoint locations — both streams will process all files; each checkpoint is independent so you\'ll get double processing.',
          ],
          productionContext: 'AutoLoader is the standard Bronze ingestion pattern in Databricks on Azure. Files land in ADLS (via ADF Copy Activity or upstream system), Event Grid fires a notification, AutoLoader picks it up within 30 seconds. The Bronze Delta table grows append-only. Downstream Silver jobs trigger on a schedule (every 15 minutes) and MERGE new Bronze rows into Silver.',
          performanceTip: 'Use .option("cloudFiles.maxFilesPerTrigger", "1000") to control how many files are processed per micro-batch. Without this cap, a backfill of 100,000 files creates one enormous batch. Cap it, let Autoloader catch up over multiple batches, and your stream remains responsive to new real-time data during backfill.',
          practice: 'Write an Autoloader job that reads new CSV files from "abfss://raw@mystorage.dfs.core.windows.net/sales/", adds an ingest_time column, and writes to a Bronze Delta table.',
          hint: 'Use format("cloudFiles") with cloudFiles.format="csv". Add .withColumn("ingest_time", current_timestamp()). Write with format("delta") and checkpointLocation.',
          solution: `from pyspark.sql.functions import current_timestamp

stream = spark.readStream \\
    .format("cloudFiles") \\
    .option("cloudFiles.format", "csv") \\
    .option("cloudFiles.schemaLocation", "dbfs:/mnt/schemas/sales/") \\
    .option("header", "true") \\
    .load("abfss://raw@mystorage.dfs.core.windows.net/sales/")

enriched = stream.withColumn("ingest_time", current_timestamp())

query = enriched.writeStream \\
    .format("delta") \\
    .option("checkpointLocation", "dbfs:/checkpoints/sales-bronze/") \\
    .outputMode("append") \\
    .start("dbfs:/mnt/bronze/sales/")`,
        },
      ],
    },
    {
      title: 'Optimization',
      subtopics: [
        {
          id: 'databricks-optimize',
          title: 'OPTIMIZE, ZORDER & VACUUM',
          difficulty: 'Advanced',
          explanation: 'OPTIMIZE compacts many small Parquet files into larger ones. ZORDER BY co-locates related rows in the same files for faster point queries. VACUUM removes old Delta versions beyond the retention period.',
          why: 'Delta tables accumulate many small files over time — each append or MERGE creates new files. OPTIMIZE merges them, dramatically improving query performance. ZORDER by query columns further reduces files scanned.',
          syntax: `-- Compact files
OPTIMIZE delta.\`dbfs:/mnt/silver/orders\`

-- Compact + Z-order by query columns (most selective first)
OPTIMIZE delta.\`dbfs:/mnt/silver/orders\` ZORDER BY (customer_id, order_date)

-- Remove old versions (default retention = 7 days)
VACUUM delta.\`dbfs:/mnt/silver/orders\` RETAIN 168 HOURS

-- Liquid Clustering (Databricks 13.3+ alternative to ZORDER)
ALTER TABLE silver.orders CLUSTER BY (customer_id)

-- Check table details
DESCRIBE DETAIL silver.orders`,
          example: `# Check table stats before optimize
%sql
DESCRIBE DETAIL silver.orders

-- Output: numFiles=482, sizeInBytes=2.1GB (many small files)

-- Run OPTIMIZE with ZORDER
OPTIMIZE silver.orders ZORDER BY (customer_id, order_date)

-- Check after
DESCRIBE DETAIL silver.orders
-- Output: numFiles=12, sizeInBytes=1.8GB (fewer, larger files)

-- Query is now 10x faster for: WHERE customer_id = 12345
SELECT * FROM silver.orders WHERE customer_id = 12345 AND order_date >= '2024-01-01'`,
          expectedOutput: `Before OPTIMIZE: 482 files, query scans all 482\nAfter OPTIMIZE + ZORDER: 12 files, query scans 1-2 files\nQuery time: 45s → 4s`,
          interview: {
            question: 'What is ZORDER and how does it improve query performance?',
            answer: 'ZORDER sorts and co-locates rows with the same key values into the same Parquet files. When you query WHERE customer_id = 123, Spark reads only the files that contain that customer_id and skips the rest (data skipping), dramatically reducing I/O.',
          },
          practice: 'Write SQL to optimize a Delta table "gold.orders" with ZORDER on customer_id and order_date. Then vacuum old versions keeping only the last 7 days.',
          hint: 'OPTIMIZE gold.orders ZORDER BY (customer_id, order_date). VACUUM gold.orders RETAIN 168 HOURS.',
          solution: `-- Optimize and co-locate data for common query patterns
OPTIMIZE gold.orders ZORDER BY (customer_id, order_date);

-- Remove old file versions (keep last 7 days for time travel)
VACUUM gold.orders RETAIN 168 HOURS;

-- Verify improvement
DESCRIBE DETAIL gold.orders;
-- Check numFiles dropped significantly
-- Min/maxValues per file now reflect ZORDER columns`,
        },
      ],
    },
    {
      title: 'Job Scheduling & Monitoring',
      subtopics: [
        {
          id: 'databricks-jobs',
          title: 'Databricks Workflows',
          difficulty: 'Intermediate',
          explanation: 'Databricks Workflows (formerly Jobs) schedule notebooks or PySpark scripts as recurring tasks. Multi-task workflows chain notebooks with dependency management, retry logic, and failure notifications.',
          why: 'Ad-hoc notebook runs are not reliable for production. Workflows provide scheduling, dependency ordering, job clusters (cheapest compute), email/webhook alerts, and run history — everything needed for production pipelines.',
          syntax: `Workflow configuration:
  Job name: DailyOrdersPipeline
  Schedule: 0 2 * * *  (daily at 02:00 UTC)
  Cluster:  Job cluster (DBR 13.3 LTS, 4 workers, auto-terminate)

  Tasks:
    Task 1: "BronzeIngest"
      Notebook: /Shared/pipelines/01_bronze_ingest
      Parameters: load_date: {{job.parameters.load_date}}

    Task 2: "SilverTransform"
      Depends on: BronzeIngest (on success)
      Notebook: /Shared/pipelines/02_silver_transform

    Task 3: "GoldAggregate"
      Depends on: SilverTransform (on success)
      Notebook: /Shared/pipelines/03_gold_aggregate

  Failure notifications: email to data-team@company.com`,
          example: `# In notebook — receive job parameters as widgets
load_date = dbutils.widgets.get("load_date") if "load_date" in [w.name for w in dbutils.widgets.getAll()] else "2024-01-15"
layer     = dbutils.widgets.get("layer") if "layer" in [w.name for w in dbutils.widgets.getAll()] else "silver"

# Run result logging
result = {
    "rows_processed": df.count(),
    "load_date":      load_date,
    "status":         "success"
}
dbutils.notebook.exit(json.dumps(result))  # pass result to parent workflow`,
          expectedOutput: `Workflow run 2024-01-16:\n  BronzeIngest:    SUCCESS  (42,000 rows, 45s)\n  SilverTransform: SUCCESS  (41,989 rows, 1m 12s)\n  GoldAggregate:   SUCCESS  (4 rows, 8s)\nTotal duration: 2m 05s\nNext run: 2024-01-17 02:00 UTC`,
          interview: {
            question: 'Why use a job cluster instead of an all-purpose cluster for Databricks Workflows?',
            answer: 'A job cluster is created fresh for each run and terminated when done — you pay only for the run duration. An all-purpose cluster runs continuously, accumulating cost 24/7. For scheduled production jobs, job clusters are typically 10-20x cheaper.',
          },
          practice: 'Design a Databricks Workflow with three tasks: BronzeLoad → SilverClean → GoldAggregate, where each task depends on the previous. What cluster type should you use and why?',
          hint: 'Three tasks with sequential dependencies (Task B depends on Task A success). Use a job cluster — created fresh each run, terminated on completion, cheapest for production.',
          solution: `# Databricks Workflow design:

# Task 1: BronzeLoad
#   Notebook: /Shared/pipelines/01_bronze
#   Cluster:  New job cluster (DBR 13.3 LTS, 4 workers)
#   Depends:  None (first task)

# Task 2: SilverClean
#   Notebook: /Shared/pipelines/02_silver
#   Cluster:  Same job cluster (shared within workflow)
#   Depends:  BronzeLoad → Success

# Task 3: GoldAggregate
#   Notebook: /Shared/pipelines/03_gold
#   Cluster:  Same job cluster
#   Depends:  SilverClean → Success

# Job cluster: created at workflow start, terminated at end
# Cost: pay only for active compute during the ~10 minute run
# All-purpose cluster: running 24/7 = 144x more expensive for same work`,
        },
      ],
    },
  ],

  interviewGroups: [
    {
      title: 'Beginner',
      questions: [
        { question: 'What is Azure Databricks?', answer: 'A managed cloud workspace combining Apache Spark, Delta Lake, collaborative notebooks, and workflow scheduling on Azure infrastructure.' },
        { question: 'What is DBFS?', answer: 'Databricks File System — a distributed abstraction over cloud storage. You mount ADLS or S3 once and access it via dbfs:/mnt/ paths from any notebook.' },
        { question: 'What is Delta Lake?', answer: 'An open storage format that adds ACID transactions, schema enforcement, time travel, and DML operations (UPDATE/DELETE/MERGE) to Parquet files on cloud storage.' },
        { question: 'What is the medallion architecture?', answer: 'Bronze (raw ingest) → Silver (clean, typed, deduplicated) → Gold (aggregated, business-ready). Each layer has a clear data quality contract.' },
        { question: 'What is a Databricks notebook?', answer: 'An interactive document with code cells (Python, SQL, Scala), markdown, and visualisation output. Multiple users can collaborate in one notebook connected to a shared cluster.' },
      ],
    },
    {
      title: 'Intermediate',
      questions: [
        { question: 'What is Unity Catalog and why is it used?', answer: 'Unity Catalog is Databricks centralised governance layer — a three-level namespace (catalog.schema.table), column-level access control, data lineage, and audit logging across all workspaces.' },
        { question: 'What does OPTIMIZE with ZORDER BY do?', answer: 'OPTIMIZE compacts many small Parquet files into larger ones. ZORDER co-locates rows with the same key values into the same files, so queries filtering on those columns read fewer files (data skipping).' },
        { question: 'What is Autoloader and when should you use it?', answer: 'Autoloader (cloudFiles format) incrementally ingests new files from cloud storage as they arrive, tracking progress in a checkpoint. Use it when files land continuously and you want incremental Bronze ingestion without custom tracking code.' },
        { question: 'What is a job cluster vs all-purpose cluster?', answer: 'Job cluster: created for one workflow run, terminated on completion — cheapest for production. All-purpose: stays running for interactive development — use only for notebooks, not production scheduled jobs.' },
        { question: 'What is time travel in Delta Lake?', answer: 'Every Delta write creates a new version in the _delta_log. You can read any past version with .option("versionAsOf", N) or .option("timestampAsOf", "2024-01-15"). Useful for auditing, debugging, and rollback.' },
      ],
    },
    {
      title: 'Advanced',
      questions: [
        { question: 'What is Structured Streaming in Databricks?', answer: 'An API for processing continuous data streams using the same DataFrame API as batch Spark. Reads from Kafka, Event Hubs, or cloud files. Requires a checkpoint location to survive restarts.' },
        { question: 'How do checkpoints work in Structured Streaming?', answer: 'The checkpoint stores the offset (position in the stream) of the last processed record. On restart, Spark reads the checkpoint and resumes from exactly that offset — preventing duplicate processing and data loss.' },
        { question: 'What is Liquid Clustering in Delta Lake?', answer: 'An alternative to ZORDER (available in Databricks 13.3+). ALTER TABLE ... CLUSTER BY automatically optimises data layout as new data arrives. Unlike ZORDER, it does not require manual OPTIMIZE runs.' },
        { question: 'How do you implement SCD Type 2 in Databricks?', answer: 'Use Delta MERGE: detect changed rows by joining source with current target (is_current=true), expire changed rows (update is_current=false, end_date=today), then append new versions with is_current=true.' },
        { question: 'How do you pass results between tasks in a Databricks Workflow?', answer: 'Use dbutils.notebook.exit(json.dumps(result)) to return a JSON string. The calling task reads it with dbutils.notebook.run("notebook", timeout, parameters)["result"].' },
      ],
    },
    {
      title: 'Real-world Scenarios',
      questions: [
        { question: 'A Delta table has accumulated 5,000 small files and queries are slow. What do you do?', answer: 'Run OPTIMIZE to compact files. Add ZORDER BY your most-filtered columns (customer_id, order_date). Schedule weekly OPTIMIZE + VACUUM. Monitor with DESCRIBE DETAIL to track file count.' },
        { question: 'A streaming job fails and restarts. How do you prevent duplicate records?', answer: 'The checkpoint saves the last processed offset. On restart, Spark resumes from the checkpoint. Ensure the checkpoint is on durable storage (ADLS, not local disk). Use Delta as the sink for automatic deduplication support.' },
        { question: 'You need to reprocess last month\'s data through the Silver layer. How do you do this?', answer: 'Use Delta time travel to read Bronze from the correct version. Filter for the date range. Run the Silver transform. Write to Silver with mode="overwrite" for the affected partition or use MERGE to update only changed records.' },
        { question: 'A production Databricks job is unexpectedly slow today. What do you check first?', answer: 'Check Spark UI for: (1) task skew — one long-running task. (2) shuffle size — unusually large shuffle. (3) GC time — high garbage collection. (4) AQE enabled. (5) Check if cluster auto-scaled correctly.' },
        { question: 'How do you migrate from workspace-level security to Unity Catalog?', answer: 'Create a Unity Catalog metastore, assign it to the workspace. Migrate existing tables to Unity Catalog using the SYNC command or by recreating external tables pointing to existing Delta locations. Set up group mappings. Grant permissions using GRANT SQL statements.' },
      ],
    },
  ],

  miniProjects: [
    {
      title: 'Mini Project 1: Bronze → Silver Pipeline',
      goal: 'Build a complete Bronze → Silver notebook pipeline for an orders dataset using Delta Lake and Autoloader.',
      steps: [
        'Mount ADLS to DBFS: dbfs:/mnt/bronze/ and dbfs:/mnt/silver/.',
        'Create a Bronze ingestion notebook using Autoloader to read new CSV files from ADLS and write to a Bronze Delta table.',
        'Create a Silver transform notebook: read from Bronze Delta, deduplicate on order_id, cast types, validate amounts > 0.',
        'Add columns: silver_loaded_at (current_timestamp), days_since_order (datediff), order_tier (when/otherwise).',
        'Write to Silver Delta with MERGE (upsert on order_id).',
        'Run OPTIMIZE on Silver with ZORDER BY (customer_id, order_date).',
        'Parameterise both notebooks with load_date widget.',
        'Schedule as a two-task Databricks Workflow using a job cluster.',
      ],
      output: 'Bronze Delta table with raw ingest. Silver Delta table with clean, typed, deduplicated orders and ZORDER optimisation.',
    },
    {
      title: 'Mini Project 2: Real-time Event Dashboard',
      goal: 'Build a Structured Streaming pipeline that processes click events from Kafka into a Gold Delta table for real-time analytics.',
      steps: [
        'Create a Kafka topic with click event JSON messages: user_id, page, timestamp, session_id.',
        'Write a readStream notebook using format("kafka") with the topic configuration.',
        'Parse the JSON payload using from_json and the event schema.',
        'Aggregate with a 5-minute sliding window: COUNT clicks per page per window.',
        'Write the aggregated stream to a Gold Delta table with checkpointing.',
        'Query the Gold table with SQL to show the top 10 pages in the last hour.',
      ],
      output: 'Live-updating Gold Delta table with page click counts per 5-minute window. Sub-minute latency from event to queryable result.',
    },
    {
      title: 'Enterprise Project: Full Medallion Data Platform',
      goal: 'Build a production-grade three-layer data platform with governance, monitoring, and CI/CD on Azure Databricks.',
      steps: [
        'Set up Unity Catalog with three schemas: bronze, silver, gold in catalog "prod".',
        'Configure Autoloader for Bronze: reads from ADLS raw container, writes to Delta tables in bronze schema.',
        'Build Silver notebooks: cleanse, cast, deduplicate, validate. Register as Unity Catalog tables.',
        'Build Gold notebooks: dimension joins, KPI aggregations. Write to gold schema tables.',
        'Implement SCD Type 2 for the customer dimension using Delta MERGE.',
        'Set up row-level security: analysts can only see their region\'s data.',
        'Configure Databricks Workflow: Bronze → Silver → Gold with job cluster, retry logic, and email alerts.',
        'Implement custom logging: each notebook writes row counts and duration to a monitoring Delta table.',
        'Connect Power BI to the Gold layer using the Databricks connector.',
        'Set up CI/CD: Databricks Repos + Azure DevOps pipeline to promote notebooks from dev → test → prod.',
      ],
      output: 'Full production data platform: governed Unity Catalog tables, automated three-layer pipeline, row-level security, monitoring dashboard, and CI/CD deployment.',
    },
  ],
};
