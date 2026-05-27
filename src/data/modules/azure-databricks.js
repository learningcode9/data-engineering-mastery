export const databricksModule = {
  documentationMapping: [
    {
      concept: 'Delta Lake ACID transactions and time travel',
      officialSource: 'Delta Lake Documentation — Table Utility Commands',
      sourceUrl: 'https://docs.delta.io/latest/delta-utility.html',
      howThisLessonUsesIt: 'The transaction log (_delta_log) as the source of ACID guarantees, DESCRIBE HISTORY syntax, VERSION AS OF / TIMESTAMP AS OF for time travel, and VACUUM retention are taught using the official Delta Lake documentation.',
    },
    {
      concept: 'Unity Catalog 3-level namespace',
      officialSource: 'Databricks Documentation — Unity Catalog',
      sourceUrl: 'https://docs.databricks.com/en/data-governance/unity-catalog/index.html',
      howThisLessonUsesIt: 'The catalog.schema.table namespace, metastore hierarchy, securable objects (catalog, schema, table, view, function), and GRANT SQL syntax follow the official Unity Catalog documentation.',
    },
    {
      concept: 'Auto Loader incremental ingestion',
      officialSource: 'Databricks Documentation — Auto Loader',
      sourceUrl: 'https://docs.databricks.com/en/ingestion/cloud-object-storage/auto-loader/index.html',
      howThisLessonUsesIt: 'The cloudFiles source format, directory listing vs file notification modes, schema inference and evolution options, and checkpoint directory behavior are explained using the official Auto Loader documentation.',
    },
    {
      concept: 'Delta Live Tables declarative pipelines',
      officialSource: 'Databricks Documentation — Delta Live Tables',
      sourceUrl: 'https://docs.databricks.com/en/delta-live-tables/index.html',
      howThisLessonUsesIt: 'The @dlt.table and @dlt.expect decorators, pipeline definition vs trigger, the difference between Complete and Append/SCD Type 1/2 modes, and the DLT event log follow the official DLT documentation.',
    },
    {
      concept: 'Databricks Workflows orchestration',
      officialSource: 'Databricks Documentation — Workflows',
      sourceUrl: 'https://docs.databricks.com/en/workflows/index.html',
      howThisLessonUsesIt: 'Multi-task job DAG construction, task dependencies, retry policies, cluster type selection per task, and job cluster vs all-purpose cluster trade-offs follow the official Databricks Workflows documentation.',
    },
  ],
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
    {
      title: 'Databricks Performance Engineering',
      subtopics: [
        {
          id: 'databricks-photon',
          title: 'Photon Engine — Vectorized Query Execution',
          difficulty: 'Advanced',
          explanation: 'Photon is Databricks\' native vectorized query engine written in C++ that replaces the JVM-based Spark SQL engine for supported operations. It processes data in batches (vectors) of 1024 rows using SIMD CPU instructions — achieving 2-10x throughput improvement over standard Spark SQL.',
          why: 'JVM Spark SQL has overhead from garbage collection, JVM object creation, and row-by-row processing. Photon bypasses all of this by operating in native C++ on columnar data. For analytical SQL workloads (aggregations, joins, scans) on large datasets, Photon dramatically reduces compute time and therefore cost.',
          syntax: `// Photon is enabled at the cluster level — no code changes required
// Enable: Cluster config → Enable Photon acceleration ✓

// Operations accelerated by Photon:
// - SELECT, WHERE, GROUP BY, ORDER BY, JOIN
// - Window functions
// - Delta Lake reads and writes
// - SQL aggregations (SUM, COUNT, AVG, MIN, MAX)

// Operations NOT accelerated by Photon (fall back to Spark JVM):
// - Python UDFs (use Pandas UDFs/vectorized UDFs instead)
// - RDD operations
// - Complex CASE WHEN with external Python logic`,
          example: `-- This query runs 5x faster on Photon vs standard Spark SQL:
SELECT
  region,
  DATE_TRUNC('month', order_date) AS month,
  SUM(amount)                     AS total_revenue,
  COUNT(DISTINCT customer_id)     AS unique_customers,
  AVG(amount)                     AS avg_order_value
FROM gold.fact_orders
WHERE order_date >= '2024-01-01'
GROUP BY region, DATE_TRUNC('month', order_date)
ORDER BY month, total_revenue DESC;

-- Check if Photon is being used:
-- In the Spark UI → SQL tab → query plan shows "PhotonGroupingAgg"
-- vs standard "HashAggregate" for non-Photon`,
          expectedOutput: 'Sub-second aggregation on 500M rows, Photon node visible in query plan',
          interview: {
            question: 'When does Photon NOT help, and how do you work around those limitations?',
            answer: 'Photon does not accelerate Python UDFs — each row crosses the JVM-to-Python boundary, negating Photon\'s vectorization. Workaround: rewrite Python UDFs as Pandas UDFs (vectorized UDFs) which process batches of rows as Pandas Series — Photon can then accelerate the surrounding SQL and the Pandas UDF handles the Python logic efficiently. Also: custom RDD operations and Scala UDFs using non-SQL logic fall back to the JVM engine. For maximum Photon benefit, write workloads as pure SQL or DataFrame API without custom Python functions.',
          },
          commonMistakes: [
            'Assuming Photon is enabled on all cluster types — Photon requires a Photon-enabled runtime (DBR 9.1+). Standard clusters without Photon runtime do not use it regardless of the UI setting.',
            'Mixing Python UDFs into SQL pipelines on Photon clusters — each Python UDF call disables Photon for that stage. Profile with Spark UI to find UDF hotspots.',
            'Not using Photon for Databricks SQL Warehouses — SQL Warehouses automatically use Photon. If you are running analytical SQL on an all-purpose cluster instead of a SQL Warehouse, you may be missing free Photon acceleration.',
          ],
          productionContext: 'Photon delivers the most value on: large aggregation queries (GROUP BY on 100M+ rows), hash joins between large tables, and Delta Lake scan-heavy workloads. Teams report 40-70% cost reduction for analytics SQL workloads after enabling Photon — the same query runs faster, so the cluster terminates sooner, billing less DBU time.',
          performanceTip: 'Profile your workload in the Spark UI SQL tab before and after enabling Photon. Queries with "PhotonGroupingAgg", "PhotonShuffleExchangeSink", and "PhotonScan" nodes in the plan are fully accelerated. If you see standard Spark nodes mixed in, find the UDF or unsupported operation causing the fallback.',
          juniorMistake: 'Rewriting working Python pipelines to SQL just to enable Photon — the rewrite cost is rarely worth it for non-bottleneck code. Profile first, optimize only the slowest stages.',
          productionTradeoff: 'Photon clusters cost slightly more per DBU than non-Photon clusters but run faster — net effect is usually cost neutral or cost reduction. For short-running jobs (<5 min), the per-job fixed overhead reduces Photon\'s relative benefit.',
        },
        {
          id: 'databricks-aqe',
          title: 'Adaptive Query Execution (AQE)',
          difficulty: 'Advanced',
          explanation: 'Adaptive Query Execution (AQE) is a Spark feature that re-optimizes the query plan at runtime using actual data statistics — instead of relying only on pre-execution estimates. It dynamically adjusts the number of shuffle partitions, converts sort-merge joins to broadcast joins when a table turns out to be small, and handles skewed join partitions.',
          why: 'Static query plans fail when data statistics are stale or unavailable. AQE fixes three of the most common Spark performance problems automatically: too many small shuffle partitions (reduces overhead), wrong join type (avoids expensive sort-merge when broadcast would work), and skewed partitions (splits large skewed partitions).',
          syntax: `# Enable AQE (default ON in Databricks Runtime 10+):
spark.conf.set("spark.sql.adaptive.enabled", "true")

# AQE auto-coalesces shuffle partitions:
spark.conf.set("spark.sql.adaptive.coalescePartitions.enabled", "true")
spark.conf.set("spark.sql.adaptive.advisoryPartitionSizeInBytes", "128mb")

# AQE skew join handling:
spark.conf.set("spark.sql.adaptive.skewJoin.enabled", "true")
spark.conf.set("spark.sql.adaptive.skewJoin.skewedPartitionFactor", "5")
# A partition is skewed if it is 5x larger than the median partition`,
          example: `# AQE in action — skewed join example:
# orders table: 500M rows, customer_id column has 90% rows for customer_id=1 (skewed)
# customers table: 100K rows

# Without AQE: one executor processes 450M rows (customer_id=1), others sit idle
# With AQE skew join: Spark splits the skewed partition into sub-partitions
# Result: work distributed evenly, job completes 8x faster

orders_df = spark.read.format("delta").table("silver.orders")
customers_df = spark.read.format("delta").table("silver.customers")

# AQE handles the skewed join automatically:
result = orders_df.join(customers_df, "customer_id", "inner")
result.write.format("delta").mode("overwrite").saveAsTable("gold.orders_enriched")

# Check AQE decisions in Spark UI → SQL → query plan:
# Look for "AQEShuffleRead" and "CustomShuffleReader" nodes`,
          expectedOutput: 'Job completes without OOM errors, AQEShuffleRead visible in plan, execution time reduced',
          interview: {
            question: 'What are the three main things AQE does at runtime, and what problem does each solve?',
            answer: '(1) Coalesce shuffle partitions — after a shuffle, AQE merges small partitions into larger ones. Problem solved: 200 small partitions that each complete in 10ms waste scheduler overhead; AQE merges them into 20 larger partitions. (2) Convert sort-merge join to broadcast join — if the runtime statistics show a table is smaller than the broadcast threshold, AQE switches to broadcast join. Problem solved: static planning estimated the table was large, but after filtering it was only 10MB — broadcast join is 100x faster. (3) Split skewed partitions — if one partition is 5x+ larger than median, AQE splits it into sub-partitions. Problem solved: one executor processing all data for customer_id=1 while 99 others are idle — AQE redistributes.',
          },
          commonMistakes: [
            'Manually setting spark.sql.shuffle.partitions to a fixed number (200) when AQE is enabled — AQE overrides this dynamically, so a fixed setting is ignored. Let AQE determine the partition count based on actual data.',
            'Assuming AQE fixes all skew problems — AQE handles join skew and shuffle skew, but GROUP BY skew (many rows with the same group key) still requires manual salting.',
            'Disabling AQE to "simplify" debugging — AQE makes execution non-deterministic (different plan each run), which confuses some engineers. Keep it enabled; use the Spark UI AQE tab to understand what it changed.',
          ],
          productionContext: 'AQE is one of the most impactful Spark features for production stability. Before AQE, a spike in data volume could cause OOM from a skewed partition — requiring manual tuning of spark.sql.shuffle.partitions per job. With AQE, the same job adapts to 10x data volume changes without intervention. Enable AQE globally in your cluster policy or Spark config and rarely touch it again.',
          performanceTip: 'Set spark.sql.adaptive.advisoryPartitionSizeInBytes to 128-256MB. This is the target partition size after AQE coalescing. Too small → too many tasks. Too large → executor memory pressure. Monitor partition size distribution in Spark UI → Stages → shuffle read/write sizes.',
          juniorMistake: 'Running EXPLAIN on a query and treating the output as the actual plan — with AQE, the plan changes at runtime. Use EXPLAIN FORMATTED or the Spark UI SQL tab to see the actual executed plan with AQE decisions.',
          productionTradeoff: 'AQE adds planning overhead between shuffle stages (re-optimizing the plan). For very short-running jobs (<30 seconds), AQE overhead can be measurable. Disable AQE only for micro-jobs where you have measured that AQE planning costs more than it saves.',
        },
        {
          id: 'databricks-liquid-clustering',
          title: 'Liquid Clustering and Delta Optimization',
          difficulty: 'Advanced',
          explanation: 'Liquid Clustering is the next generation of Delta Lake data layout optimization — replacing ZORDER for most use cases. Instead of rewriting all files in a specific column order (ZORDER), Liquid Clustering incrementally clusters files by selected columns, supports multiple clustering keys simultaneously, and is incremental — only newly written files are clustered, avoiding full table rewrites.',
          why: 'ZORDER requires a full table scan and rewrite every time you run OPTIMIZE — expensive for large tables. Liquid Clustering clusters only the new data written since the last OPTIMIZE, making maintenance dramatically cheaper. It also handles multiple clustering keys better than ZORDER, which degrades with more than 2 columns.',
          syntax: `-- Enable Liquid Clustering at table creation:
CREATE TABLE gold.fact_orders
  (order_id BIGINT, customer_id INT, order_date DATE, amount DECIMAL(10,2))
  USING DELTA
  CLUSTER BY (customer_id, order_date);

-- Add Liquid Clustering to an existing table:
ALTER TABLE silver.events CLUSTER BY (event_date, user_id);

-- Run incremental clustering (only clusters new/changed data):
OPTIMIZE silver.events;

-- Check clustering status:
DESCRIBE DETAIL silver.events;
-- Returns: clusteringColumns: ["event_date", "user_id"]

-- ZORDER (old approach — avoid for new tables):
OPTIMIZE silver.events ZORDER BY (event_date, user_id);  -- full table rewrite every time`,
          example: `# Liquid Clustering maintenance job (runs incrementally — fast even on large tables):
spark.sql("OPTIMIZE silver.events")   # Only clusters files written since last OPTIMIZE

# Then VACUUM to remove old file versions:
spark.sql("VACUUM silver.events RETAIN 168 HOURS")  # Keep 7 days for time travel

# Choosing clustering columns — follow these rules:
# 1. High-cardinality columns used in WHERE filters
# 2. Columns used in JOIN conditions
# 3. Columns used in GROUP BY
# Maximum 4 clustering columns for Liquid Clustering

# Bad: clustering by a column with 3 distinct values (low cardinality, no benefit)
# Good: clustering by customer_id (millions of distinct values) + order_date`,
          expectedOutput: 'OPTIMIZE completes in minutes (not hours) for a 10TB table; query scan reduced from 10TB to 200GB for filtered queries',
          interview: {
            question: 'When would you use Liquid Clustering over ZORDER, and what are the tradeoffs?',
            answer: 'Use Liquid Clustering for: (1) large tables where full-table ZORDER rewrites are too expensive, (2) tables with multiple frequently-queried columns (ZORDER degrades beyond 2 columns), (3) tables that receive frequent incremental writes. ZORDER may still be appropriate for: small tables (<100GB) where full rewrites are fast, or if you need strict column ordering for a specific query pattern. Key tradeoff: Liquid Clustering is incremental (fast maintenance) but takes several OPTIMIZE runs to fully cluster historical data. ZORDER applies to all data in one run but requires a full table rewrite each time. Migration: `ALTER TABLE t CLUSTER BY (col)` removes any existing ZORDER configuration automatically.',
          },
          commonMistakes: [
            'Using CLUSTER BY on write-heavy columns that change frequently — clustering is most valuable for read-heavy filter columns. Clustering a column that every write touches causes constant reclustering overhead.',
            'Setting more than 4 clustering columns — Delta\'s file pruning algorithm is less effective beyond 4 columns. Choose the 2-4 most selective WHERE/JOIN columns.',
            'Not running OPTIMIZE after enabling Liquid Clustering — enabling clustering does not recluster existing data. Run OPTIMIZE to begin the incremental clustering process on existing files.',
          ],
          productionContext: 'Migration path from ZORDER to Liquid Clustering: (1) `ALTER TABLE t CLUSTER BY (same_cols_as_zorder)` — one-time change, no data rewrite. (2) OPTIMIZE runs incrementally from this point forward. (3) After 3-5 OPTIMIZE runs, historical files are fully clustered. Teams report 30-50% reduction in OPTIMIZE job duration after switching from ZORDER to Liquid Clustering for large tables.',
          performanceTip: 'Run OPTIMIZE on a schedule matched to your write cadence — hourly writes → daily OPTIMIZE. Very frequent writes (streaming) → enable delta.autoOptimize.optimizeWrite=true to produce larger initial files, and run OPTIMIZE weekly. VACUUM after OPTIMIZE to reclaim storage from old file versions.',
          juniorMistake: 'Running OPTIMIZE ZORDER on a Liquid Clustered table — once a table has CLUSTER BY, OPTIMIZE ignores any ZORDER BY clause. The error is silent: the command succeeds but ZORDER is ignored.',
          productionTradeoff: 'Liquid Clustering is optimized for analytical read patterns — it improves query performance by enabling file pruning. It does not help with write-heavy workloads like high-frequency streaming inserts where write amplification is the bottleneck. For streaming, use small frequent writes + scheduled OPTIMIZE + delta.autoOptimize.optimizeWrite.',
        },
      ],
    },
    {
      title: 'Delta Live Tables and Unity Catalog',
      subtopics: [
        {
          id: 'databricks-dlt',
          title: 'Delta Live Tables (DLT)',
          difficulty: 'Advanced',
          explanation: 'Delta Live Tables (DLT) is a declarative framework for building reliable, maintainable data pipelines on Databricks. You declare your transformations as Python or SQL table definitions; DLT handles dependency resolution, incremental processing, error handling, and monitoring. Tables can be "Streaming" (incremental) or "Materialized View" (recomputed).',
          why: 'Traditional Spark pipelines require manual dependency management — if Table C depends on Table B which depends on Table A, you must orchestrate the order and handle failures. DLT infers the dependency graph automatically, runs tables in the correct order, handles retries, and provides built-in data quality assertions (expectations). This eliminates an entire class of pipeline orchestration bugs.',
          syntax: `import dlt
from pyspark.sql.functions import col, current_timestamp

# Bronze: streaming table from Autoloader
@dlt.table(
  name="bronze_orders",
  comment="Raw orders from cloud storage via Autoloader"
)
def bronze_orders():
  return (
    spark.readStream.format("cloudFiles")
      .option("cloudFiles.format", "json")
      .option("cloudFiles.schemaLocation", "/mnt/checkpoints/bronze_orders")
      .load("/mnt/raw/orders/")
  )

# Silver: streaming table with data quality expectations
@dlt.table(name="silver_orders")
@dlt.expect_or_drop("valid_amount", "amount > 0")
@dlt.expect_or_drop("non_null_customer", "customer_id IS NOT NULL")
def silver_orders():
  return (
    dlt.read_stream("bronze_orders")
      .select(
        col("order_id").cast("long"),
        col("customer_id").cast("int"),
        col("amount").cast("decimal(10,2)"),
        col("order_date").cast("date"),
        current_timestamp().alias("processed_at")
      )
  )

# Gold: materialized view (recomputed, not incremental)
@dlt.table(name="gold_daily_revenue")
def gold_daily_revenue():
  return (
    dlt.read("silver_orders")
      .groupBy("order_date")
      .agg({"amount": "sum", "order_id": "count"})
  )`,
          example: `# DLT Expectations — three behaviors:
# expect()             → log violation, keep row
# expect_or_drop()     → log violation, drop row
# expect_or_fail()     → log violation, fail pipeline

@dlt.table(name="silver_customers")
@dlt.expect("valid_email", "email LIKE '%@%.%'")           # warn but keep
@dlt.expect_or_drop("positive_age", "age > 0 AND age < 120")  # drop invalid
@dlt.expect_or_fail("non_null_id", "customer_id IS NOT NULL")  # halt pipeline
def silver_customers():
  return dlt.read_stream("bronze_customers")

# DLT pipelines run in two modes:
# Continuous: always on, processes data as it arrives
# Triggered:  run on demand or on schedule, then stop`,
          expectedOutput: 'DLT pipeline runs Bronze → Silver → Gold automatically, violations logged to pipeline event log',
          interview: {
            question: 'How does DLT handle schema evolution, and what happens when the source schema changes?',
            answer: 'DLT with Autoloader and schema inference automatically handles new column additions — new columns are added to the Bronze Delta table schema without pipeline failure. For schema changes that break existing logic (renamed columns, type changes), DLT fails the pipeline with a schema mismatch error. Best practice: define an explicit schema in Bronze Autoloader (not inferred) and add schema evolution logic in Silver — use `from_json` with a defined schema to be explicit about what fields you process. Configure `cloudFiles.schemaEvolutionMode=addNewColumns` for Bronze to auto-add new source fields without failing.',
          },
          commonMistakes: [
            'Using dlt.read() instead of dlt.read_stream() for streaming pipelines — dlt.read() is for batch materialized views. Using it in a streaming pipeline reprocesses all data on every run instead of incrementally.',
            'Adding expectations to Bronze tables — expectations that drop rows at Bronze lose data permanently. Bronze should store all raw data; apply dropping expectations in Silver where data has been validated.',
            'Not separating Continuous and Triggered pipelines — Continuous pipelines have higher cost (always-on compute). Use Triggered mode for batch-latency acceptable pipelines (hourly, daily) to save cost.',
          ],
          productionContext: 'DLT is the recommended pattern for new Databricks pipelines. It replaces: manually ordered Databricks Workflows, custom retry logic, manual data quality checks, and pipeline event logging. The DLT event log records every expectation violation, pipeline run, and table update — providing audit-ready data quality history without custom logging code.',
          performanceTip: 'DLT pipelines use "Enhanced Autoscaling" — the cluster scales workers based on backlog size. For streaming pipelines processing a large initial backlog, set max workers high initially; DLT will scale down once backlog is clear. For steady-state streaming with low latency, use Continuous mode with 2-4 workers and a Photon-enabled cluster.',
          juniorMistake: 'Building a DLT pipeline then separately scheduling it in a Databricks Workflow — DLT pipelines have their own scheduler (Triggered mode with a cron). No need to wrap in a Workflow unless chaining with non-DLT tasks.',
          productionTradeoff: 'DLT is more opinionated than raw Spark — you cannot use arbitrary Spark operations freely. Complex cross-pipeline operations (reading from a different DLT pipeline\'s output) require materialized views and careful dependency management. Teams with highly custom pipeline logic sometimes find raw Workflows + Notebooks more flexible, but lose DLT\'s built-in quality assertions and automatic dependency resolution.',
        },
        {
          id: 'databricks-unity-catalog',
          title: 'Unity Catalog — Governance and Lineage',
          difficulty: 'Advanced',
          explanation: 'Unity Catalog (UC) is Databricks\' unified governance layer — a metastore that spans all workspaces in an account. It provides: centralized access control (GRANT/REVOKE on any object), data lineage (column-level lineage across notebooks, jobs, and SQL), fine-grained permissions (table, column, row-level), and cross-workspace data sharing without copying.',
          why: 'Without Unity Catalog, permissions are workspace-scoped — access changes must be made in every workspace separately. Unity Catalog centralizes governance: one GRANT statement applies across all workspaces that share the metastore. Lineage shows exactly which job or notebook wrote to a table, what it read from, and which column transformations occurred — critical for compliance (GDPR, CCPA right-to-erasure impact analysis).',
          syntax: `-- Unity Catalog three-level namespace: catalog.schema.table
SELECT * FROM prod.gold.dim_customer;

-- Grant table access:
GRANT SELECT ON TABLE prod.gold.dim_customer TO \`analyst@company.com\`;
GRANT SELECT ON TABLE prod.gold.dim_customer TO \`data-analysts-group\`;

-- Grant schema-level access (inherits to all tables):
GRANT USE SCHEMA, SELECT ON SCHEMA prod.gold TO \`data-analysts-group\`;

-- Row-level security via Dynamic Views:
CREATE VIEW prod.gold.dim_customer_view AS
SELECT *
FROM prod.gold.dim_customer
WHERE region = current_user()          -- filter by logged-in user's mapped region
   OR IS_ACCOUNT_GROUP_MEMBER('data_admin');

-- Column masking (Data Masking function):
ALTER TABLE prod.gold.dim_customer
ALTER COLUMN ssn SET MASK prod.security.mask_ssn USING COLUMNS (ssn);`,
          example: `-- Unity Catalog lineage — view in Databricks UI: Data → table → Lineage tab
-- Programmatically query lineage via system tables (preview):
SELECT
  source_table_full_name,
  target_table_full_name,
  created_by,
  event_time
FROM system.access.table_lineage
WHERE target_table_full_name = 'prod.gold.dim_customer'
ORDER BY event_time DESC;

-- Unity Catalog tags for data classification:
ALTER TABLE prod.gold.dim_customer
SET TAGS ('pii' = 'true', 'data_domain' = 'customer', 'retention_days' = '2555');

-- Audit log query (system table):
SELECT user_identity, action_name, request_object_type, request_object_name
FROM system.access.audit
WHERE request_object_name LIKE 'prod.gold%'
  AND event_date >= current_date - 30
ORDER BY event_time DESC;`,
          expectedOutput: 'Centralized access control, column-level lineage, audit logs, and PII masking applied across all workspaces',
          interview: {
            question: 'How does Unity Catalog column-level lineage work, and why does it matter for GDPR compliance?',
            answer: 'Unity Catalog tracks column-level lineage by intercepting Spark and SQL query plans at execution time — recording which source columns were read and which target columns were written. For GDPR: when a "right to erasure" request arrives for customer_id=12345, lineage shows every downstream table that received data derived from that customer\'s rows — enabling a complete deletion impact analysis without manual code archaeology. Without lineage, deleting a customer from the source means manually tracing all pipelines that might have copied that data. With Unity Catalog lineage, this is a UI query showing the complete data propagation graph for that column.',
          },
          commonMistakes: [
            'Granting admin-level access (account admin, metastore admin) to individual engineers instead of using groups — Unity Catalog admins can access all data in all workspaces. Use data steward groups with limited grants.',
            'Using the Hive metastore alongside Unity Catalog — Databricks supports both but they are isolated. Hive metastore tables are not governed by Unity Catalog. Migrate fully to Unity Catalog; do not run hybrid.',
            'Not enabling column masking for PII columns before granting analyst access — analysts can see unmasked SSNs, credit card numbers, etc. if masking is not configured before the GRANT.',
          ],
          productionContext: 'Unity Catalog migration pattern from Hive metastore: (1) Create new Unity Catalog tables in a new catalog (prod, dev, test). (2) Migrate table by table using DEEP CLONE or CTAS (CREATE TABLE ... AS SELECT). (3) Update notebook references from `schema.table` to `catalog.schema.table`. (4) Apply GRANT statements to groups, not individuals. (5) Enable audit logging (system.access.audit) from day one — retroactive audit is not possible. Teams typically run UC and Hive metastore in parallel for 3-6 months during migration.',
          performanceTip: 'Unity Catalog adds a governance check overhead on every query — typically 10-50ms per query for permission validation. This is negligible for batch jobs but noticeable for high-frequency micro-queries. For latency-sensitive workloads, cache permission checks using Databricks SQL Warehouse result caching.',
          juniorMistake: 'Thinking Unity Catalog works like a database schema — it is a metastore, not a storage layer. Dropping a Unity Catalog table does not delete the underlying Delta files unless USING LOCATION is not specified (managed tables). Always check if a table is managed or external before dropping.',
          productionTradeoff: 'Unity Catalog requires upgrading cluster runtime to DBR 11.3+. Some legacy Spark operations (RDD-based access to DBFS paths, spark.hadoop.fs.* direct calls) do not pass through UC governance. Full UC coverage requires using DataFrame API and SQL, not low-level RDD or file system calls.',
        },
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
