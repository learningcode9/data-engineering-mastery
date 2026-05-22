export const awsGlueModule = {
  sections: [
    {
      title: 'Glue Architecture',
      subtopics: [
        {
          id: 'glue-overview',
          title: 'AWS Glue Overview',
          difficulty: 'Beginner',
          explanation: 'AWS Glue is a serverless ETL service. You write PySpark or Python Shell scripts; AWS manages the Spark cluster, scaling, and infrastructure. It integrates natively with S3, Athena, Redshift, and the Glue Data Catalog.',
          why: 'Without Glue you would manage your own Spark cluster on EMR — patching, scaling, and monitoring VMs. Glue removes this undifferentiated heavy lifting so you focus on the ETL logic.',
          syntax: `AWS Glue core concepts:
  Crawlers:    scan S3/databases → create tables in the Data Catalog
  Data Catalog: centralised metadata store (schemas, locations)
  ETL Jobs:    PySpark scripts run on managed Spark (G.1X, G.2X workers)
  Workflows:   chain crawlers and jobs with triggers
  Bookmarks:   track processed files for incremental loads
  Glue Studio: visual no-code/low-code ETL designer

Worker types:
  G.1X  — 4 vCPU, 16 GB RAM, 64 GB disk  (general ETL)
  G.2X  — 8 vCPU, 32 GB RAM, 128 GB disk (heavy transforms)
  G.025X — 2 vCPU, 4 GB RAM               (small/dev jobs)`,
          example: `# Basic Glue job structure
import sys
from awsglue.transforms import *
from awsglue.utils import getResolvedOptions
from pyspark.context import SparkContext
from awsglue.context import GlueContext
from awsglue.job import Job

# Standard boilerplate for every Glue job
args = getResolvedOptions(sys.argv, ['JOB_NAME', 'load_date'])
sc   = SparkContext()
glueContext = GlueContext(sc)
spark = glueContext.spark_session
job = Job(glueContext)
job.init(args['JOB_NAME'], args)

load_date = args['load_date']
print(f"Processing date: {load_date}")

# ... your ETL logic here ...

job.commit()  # finalise bookmark progress`,
          expectedOutput: `Job: orders-etl-job\nProcessing date: 2024-01-15\nJob committed successfully.`,
          interview: {
            question: 'What makes AWS Glue "serverless"?',
            answer: 'You do not provision or manage EC2 instances. Glue allocates the Spark cluster automatically when a job starts and terminates it when done. You pay per DPU-second (Data Processing Unit) of compute used, not for idle time.',
          },
          practice: 'Write the boilerplate code that starts every AWS Glue PySpark job. What are the four objects you always create and what does job.commit() do?',
          hint: 'Four objects: SparkContext, GlueContext, spark (SparkSession), Job. job.commit() saves the bookmark state — marking the job as complete so incremental loads know where to resume.',
          solution: `import sys
from awsglue.utils import getResolvedOptions
from pyspark.context import SparkContext
from awsglue.context import GlueContext
from awsglue.job import Job

args = getResolvedOptions(sys.argv, ['JOB_NAME'])
sc   = SparkContext()
glueContext = GlueContext(sc)
spark = glueContext.spark_session
job = Job(glueContext)
job.init(args['JOB_NAME'], args)

# Your ETL logic here

job.commit()
# job.commit() saves the bookmark position.
# Without it, the next run re-processes the same files.`,
        },
      ],
    },
    {
      title: 'Crawlers & Data Catalog',
      subtopics: [
        {
          id: 'glue-crawler',
          title: 'Glue Crawlers',
          difficulty: 'Beginner',
          explanation: 'A Glue Crawler scans a data source (S3, RDS, DynamoDB), infers the schema, and registers or updates tables in the Glue Data Catalog. It detects partitions, column types, and file formats automatically.',
          why: 'Once catalogued, data can be queried by Athena, Redshift Spectrum, EMR, and Glue jobs without writing ingestion code. The catalog is the single source of truth for all metadata.',
          syntax: `Crawler configuration:
  Name:       orders-crawler
  Source:     S3 bucket — s3://my-datalake/raw/orders/
  Database:   raw_db
  Table:      orders
  Schedule:   On demand | cron(0 6 * * ? *)
  IAM Role:   GlueCrawlerRole (S3 read + catalog write)

After crawling:
  Glue Catalog Table: raw_db.orders
    Columns: order_id (bigint), amount (double), status (string)
    Location: s3://my-datalake/raw/orders/
    Format:   Parquet / CSV / JSON (auto-detected)
    Partitions: date=2024-01-15/ (auto-detected)`,
          example: `# Glue Catalog after crawler runs on s3://datalake/raw/orders/

# Catalog entry:
# Database: raw_db
# Table:    orders
# Columns:
#   order_id:    bigint
#   customer_id: bigint
#   amount:      double
#   status:      string
#   created_at:  string
# Partitions: date=2024-01-14/, date=2024-01-15/

# Immediately queryable in Athena
# No code needed — just run SQL:
# SELECT status, COUNT(*) as cnt
# FROM raw_db.orders
# WHERE date = '2024-01-15'
# GROUP BY status;`,
          expectedOutput: `Athena query result:\n+----------+------+\n|    status|   cnt|\n+----------+------+\n|   shipped|  2800|\n|   pending|  1100|\n|cancelled |   300|\n+----------+------+`,
          interview: {
            question: 'What is the Glue Data Catalog and why is it central to the AWS data architecture?',
            answer: 'The Glue Data Catalog is a centralised metadata store. It holds table definitions (schema, S3 location, format) used by Athena, EMR, Redshift Spectrum, and Glue jobs. One catalog update makes new tables instantly queryable across all these services without duplicating metadata.',
          },
          practice: 'Describe what a Glue Crawler does step by step when it runs on an S3 path containing CSV files. What does it create and where?',
          hint: 'Steps: (1) scan S3 path, (2) sample files to infer schema, (3) detect format and partitions, (4) create/update table in the Glue Catalog database. No data is moved.',
          solution: `# Glue Crawler steps when run on s3://datalake/raw/orders/:

# 1. Scan S3 path
#    Lists all objects under s3://datalake/raw/orders/
#    Detects partition folders: date=2024-01-15/, date=2024-01-16/

# 2. Sample files
#    Opens a sample of files to detect format (CSV, Parquet, JSON)
#    Reads column names and infers data types

# 3. Update Glue Catalog
#    Creates database "raw_db" if not exists
#    Creates (or updates) table "orders" with:
#      - Column definitions: order_id bigint, amount double, etc.
#      - Location: s3://datalake/raw/orders/
#      - Format: CSV (delimiter=,, header=true)
#      - Partitions: date=2024-01-15, date=2024-01-16

# 4. Result: table is immediately queryable in Athena
#    No data copied or moved — only metadata stored in Catalog`,
        },
        {
          id: 'glue-catalog',
          title: 'Data Catalog & Athena',
          difficulty: 'Intermediate',
          explanation: 'The Glue Data Catalog is the central metadata repository for AWS. Athena queries S3 data using catalog table definitions — you write SQL against virtual tables backed by S3 files, paying only for bytes scanned.',
          why: 'Athena + Glue Catalog enables SQL analytics directly on S3 without loading data into a database. This is a core pattern in AWS data lakes: store in S3, catalog with Glue, query with Athena.',
          syntax: `-- Athena queries use catalog.database.table format
SELECT * FROM raw_db.orders LIMIT 10;

-- Partition pruning (reads only 2024-01-15 folder)
SELECT status, SUM(amount) FROM raw_db.orders
WHERE date = '2024-01-15'
GROUP BY status;

-- MSCK REPAIR TABLE adds new partitions to the catalog
MSCK REPAIR TABLE raw_db.orders;

-- Create Athena table pointing to S3 Parquet
CREATE EXTERNAL TABLE clean_db.orders (
    order_id    BIGINT,
    amount      DOUBLE,
    status      STRING
)
STORED AS PARQUET
LOCATION 's3://datalake/clean/orders/'
TBLPROPERTIES ('parquet.compress'='SNAPPY');`,
          example: `-- Query the Glue Catalog table with partition pruning
SELECT
    status,
    COUNT(*)          AS order_count,
    ROUND(SUM(amount),2) AS total_revenue,
    ROUND(AVG(amount),2) AS avg_order
FROM raw_db.orders
WHERE date = '2024-01-15'          -- partition pruning: reads only this folder
  AND amount > 0                   -- predicate pushdown to Parquet
GROUP BY status
ORDER BY total_revenue DESC;

-- Cost: ~8 MB scanned (only 2024-01-15/ folder, Parquet column pruning)
-- Without partitioning: 365 days × full table = 2.9 GB scanned`,
          expectedOutput: `+---------+-------------+---------------+-----------+\n|   status|  order_count|  total_revenue|  avg_order|\n+---------+-------------+---------------+-----------+\n|  shipped|         2800|      420000.00|     150.00|\n|  pending|         1100|      110000.00|     100.00|\n|cancelled|          300|       21000.00|      70.00|\n+---------+-------------+---------------+-----------+`,
          interview: {
            question: 'How does Athena use the Glue Data Catalog?',
            answer: 'Athena reads the catalog to find table location (S3 path), file format, column schemas, and partition keys. It uses this metadata to scan only required S3 partitions and columns (partition pruning + column pruning), reducing cost and query time.',
          },
          practice: 'Write an Athena SQL query that reads from a Glue Catalog table "analytics_db.sales" for only "2024-01" (a date partition), computing total revenue and order count per product_id.',
          hint: 'Use WHERE month = \'2024-01\' for partition pruning. GROUP BY product_id with SUM(revenue) and COUNT(order_id).',
          solution: `SELECT
    product_id,
    COUNT(order_id)        AS order_count,
    ROUND(SUM(revenue), 2) AS total_revenue
FROM analytics_db.sales
WHERE month = '2024-01'       -- partition pruning: reads only Jan 2024 data
GROUP BY product_id
ORDER BY total_revenue DESC
LIMIT 20;`,
        },
      ],
    },
    {
      title: 'ETL Jobs & DynamicFrames',
      subtopics: [
        {
          id: 'glue-job',
          title: 'Glue ETL Jobs',
          difficulty: 'Intermediate',
          explanation: 'Glue ETL jobs run PySpark scripts on managed Spark. You can read from the Glue Catalog, S3, JDBC, and other sources. DynamicFrames are Glue\'s extension of DataFrames that handle schema inconsistencies.',
          why: 'Glue jobs transform raw S3 data into clean, optimised Parquet without managing any infrastructure. Adding partitions, casting types, deduplicating, and writing back to S3 — all in one managed Spark job.',
          syntax: `from awsglue.dynamicframe import DynamicFrame

# Read from Glue Catalog (recommended)
dyf = glueContext.create_dynamic_frame.from_catalog(
    database="raw_db",
    table_name="orders"
)

# Read from S3 directly
dyf = glueContext.create_dynamic_frame.from_options(
    connection_type="s3",
    connection_options={"path": "s3://bucket/raw/orders/"},
    format="csv",
    format_options={"withHeader": True}
)

# Convert to DataFrame for complex transforms
df = dyf.toDF()

# Convert back to DynamicFrame for writing
out_dyf = DynamicFrame.fromDF(df, glueContext, "output")`,
          example: `from awsglue.dynamicframe import DynamicFrame
from pyspark.sql.functions import col, current_date

# Read raw orders from catalog
orders_dyf = glueContext.create_dynamic_frame.from_catalog(
    database="raw_db",
    table_name="orders",
    push_down_predicate="date='2024-01-15'"  # partition pruning
)

# Convert and transform
df = orders_dyf.toDF() \\
    .filter(col("amount") > 0) \\
    .withColumn("amount",    col("amount").cast("double")) \\
    .withColumn("load_date", current_date())

# Write clean data to S3 as Parquet
clean_dyf = DynamicFrame.fromDF(df, glueContext, "clean_orders")

glueContext.write_dynamic_frame.from_options(
    frame=clean_dyf,
    connection_type="s3",
    connection_options={"path": "s3://datalake/clean/orders/"},
    format="parquet",
    format_options={"compression": "snappy"}
)

print(f"Rows written: {df.count()}")
job.commit()`,
          expectedOutput: `Rows written: 41,992\nJob: orders-clean-job | Status: Succeeded | Duration: 3m 42s`,
          interview: {
            question: 'What is a DynamicFrame and how is it different from a Spark DataFrame?',
            answer: 'A DynamicFrame is Glue\'s schema-flexible DataFrame. It tolerates inconsistent types and missing fields by tracking each field\'s type per row. A Spark DataFrame enforces a fixed schema and fails on type mismatches. Use DynamicFrame for reading messy raw data, then convert to DataFrame for complex PySpark transforms.',
          },
          practice: 'Write a Glue ETL job that reads an S3 CSV, converts to DataFrame, filters rows with amount > 0, and writes clean Parquet back to S3.',
          hint: 'Use create_dynamic_frame.from_options for S3 CSV. Convert with .toDF(). Filter with .filter(col("amount") > 0). Convert back and use write_dynamic_frame.from_options with format="parquet".',
          solution: `from awsglue.dynamicframe import DynamicFrame
from pyspark.sql.functions import col

# Read raw CSV
raw_dyf = glueContext.create_dynamic_frame.from_options(
    connection_type="s3",
    connection_options={"path": "s3://bucket/raw/orders/"},
    format="csv",
    format_options={"withHeader": True, "separator": ","}
)

# Transform
df = raw_dyf.toDF().filter(col("amount").cast("double") > 0)

# Write clean Parquet
clean_dyf = DynamicFrame.fromDF(df, glueContext, "clean")
glueContext.write_dynamic_frame.from_options(
    frame=clean_dyf,
    connection_type="s3",
    connection_options={"path": "s3://bucket/clean/orders/"},
    format="parquet"
)
job.commit()`,
        },
        {
          id: 'glue-dynamicframe',
          title: 'DynamicFrame Transforms',
          difficulty: 'Intermediate',
          explanation: 'DynamicFrames have built-in transforms: resolveChoice (fix ambiguous types), dropNullFields (remove all-null columns), relationalize (flatten nested JSON into flat tables), and filter/map for row-level operations.',
          why: 'Real-world data is messy — columns with mixed types, nested JSON, inconsistent nulls. DynamicFrame transforms handle these without crashing on a strict schema, making initial data ingestion more resilient.',
          syntax: `# Fix ambiguous type (e.g. amount is sometimes int, sometimes string)
dyf = dyf.resolveChoice(
    specs=[("amount", "cast:double")]
)

# Remove columns that are entirely null
dyf = dyf.dropNullFields()

# Flatten nested JSON (creates multiple tables for arrays)
dfs = dyf.relationalize("root", "s3://temp/relational/")

# Filter rows
dyf = Filter.apply(dyf, f=lambda x: x["amount"] > 0)

# Apply a custom transform to each row
from awsglue.transforms import Map
def add_load_date(rec):
    rec["load_date"] = "2024-01-15"
    return rec
dyf = Map.apply(dyf, f=add_load_date)`,
          example: `# Source data has inconsistent "amount" column (string in some rows)
# resolveChoice fixes this without failing the job

resolved = orders_dyf.resolveChoice(
    specs=[
        ("amount",    "cast:double"),
        ("order_id",  "cast:long"),
    ]
)

# Remove completely empty columns (common in wide CSV exports)
cleaned = resolved.dropNullFields()

print(f"Schema before: {orders_dyf.schema()}")
print(f"Schema after:  {cleaned.schema()}")
print(f"Input records:  {orders_dyf.count()}")
print(f"Output records: {cleaned.count()}")`,
          expectedOutput: `Schema before: order_id: string, amount: choice[string, long], status: string\nSchema after:  order_id: long,   amount: double,              status: string\nInput records:  42003\nOutput records: 42003`,
          interview: {
            question: 'When would you use resolveChoice in a Glue job?',
            answer: 'When a column has mixed types (e.g. "amount" is sometimes a string "150.00" and sometimes a long 150). resolveChoice handles the ambiguity without failing — it casts to the target type or creates sub-fields for each type variant.',
          },
          practice: 'Write Glue code to resolve a "price" column that has mixed string and double types to a consistent double, then drop all-null fields from the DynamicFrame.',
          hint: 'Use .resolveChoice(specs=[("price", "cast:double")]). Then .dropNullFields().',
          solution: `# Fix mixed type column
resolved = raw_dyf.resolveChoice(
    specs=[("price", "cast:double")]
)

# Remove completely null columns
cleaned = resolved.dropNullFields()

print(f"Records: {cleaned.count()}")
print(cleaned.schema())`,
        },
      ],
    },
    {
      title: 'Incremental ETL & Bookmarks',
      subtopics: [
        {
          id: 'glue-bookmarks',
          title: 'Job Bookmarks',
          difficulty: 'Intermediate',
          explanation: 'Job bookmarks track which S3 files have been processed so each run only reads new files. Glue stores bookmark state after job.commit(). The next run skips all previously processed files automatically.',
          why: 'Without bookmarks, every run re-reads and re-processes the entire S3 path. Bookmarks make incremental loads work without any watermark table — Glue tracks the state internally.',
          syntax: `# Enable bookmark when creating the job (in AWS console or CLI):
# Bookmark enabled: true

# In code — bookmark is automatic once enabled
# No code changes needed — Glue tracks S3 file modified timestamps

# Read from catalog with bookmark support
dyf = glueContext.create_dynamic_frame.from_catalog(
    database="raw_db",
    table_name="orders",
    additional_options={"jobBookmarkKeys": ["order_id"], "jobBookmarkKeysSortOrder": "asc"}
)

# MUST call job.commit() for bookmark to update
job.commit()`,
          example: `# Bookmark state tracking:

# Run 1 — Jan 15:
#   S3 path scanned: s3://bucket/raw/orders/
#   Files found: orders_2024-01-15_001.csv, orders_2024-01-15_002.csv
#   Files processed: both (bookmark records last_modified timestamp)
#   job.commit() → bookmark saved: { last_modified: "2024-01-15T23:59:00" }

# Run 2 — Jan 16:
#   S3 path scanned: same path
#   Files found: 3 files (Jan 15 × 2 + Jan 16 × 1)
#   Bookmark filters: only orders_2024-01-16_001.csv (new since last run)
#   Files processed: 1 new file only
#   job.commit() → bookmark updated: { last_modified: "2024-01-16T23:59:00" }

print("Files to process (after bookmark filter): 1")
print("Rows in new file: 4,200")`,
          expectedOutput: `Run 1: 2 files processed, 8,400 rows\nRun 2: 1 new file processed, 4,200 rows (8,400 skipped by bookmark)\nDPU cost: 66% lower than full reload`,
          interview: {
            question: 'What happens if a Glue job fails before job.commit()? Does the bookmark advance?',
            answer: 'No. The bookmark only advances when job.commit() is called successfully. If the job fails before commit(), the next run re-processes the same files — which is correct and safe. This is why job.commit() must be the final statement.',
          },
          practice: 'Describe what happens to bookmark state when a Glue job fails halfway through. What is the consequence for the next run? Why is job.commit() important?',
          hint: 'Failed job = job.commit() never called = bookmark not updated. Next run retries same files. This is safe (no data loss) but may cause duplicate staging rows if sink is not idempotent.',
          solution: `# Scenario: Job fails after processing 50% of files, before job.commit()

# Bookmark NOT updated (commit never called)
# Next run: Glue re-reads ALL files from last committed bookmark
# → same files processed again

# This is SAFE for data lakes (re-writing Parquet is idempotent)
# but causes DUPLICATES in databases unless you TRUNCATE or UPSERT at sink

# Best practice:
# 1. Sink to S3 Parquet with overwrite mode → re-runs are idempotent
# 2. If sink is SQL table: use MERGE/UPSERT not INSERT
# 3. Always call job.commit() at the very end, after all writes succeed

job.commit()  # MUST be last line — advances bookmark on success`,
        },
      ],
    },
    {
      title: 'Glue Workflows & Scheduling',
      subtopics: [
        {
          id: 'glue-workflows',
          title: 'Glue Workflows',
          difficulty: 'Intermediate',
          explanation: 'A Glue Workflow chains crawlers and jobs with triggers. Triggers fire on schedule, job success, or job failure — creating a multi-step pipeline with dependency management.',
          why: 'Without workflows, you manually coordinate: run crawler, wait, run job 1, wait, run job 2. Workflows orchestrate this automatically with retry logic and status monitoring in the Glue console.',
          syntax: `Workflow: "DailySalesLoad"

Trigger 1 (Schedule 06:00 UTC) → RawOrdersCrawler
Trigger 2 (Crawler succeeded)  → TransformOrdersJob
Trigger 3 (Job succeeded)      → LoadToRedshiftJob
Trigger 4 (Job failed)         → NotifyTeamLambda

Trigger types:
  - Schedule:       cron(0 6 * * ? *)
  - On Demand:      manual start
  - Event (Crawler): fires when crawler finishes
  - Event (Job):    fires when job completes (success/failure)`,
          example: `# Workflow: DailyOrdersPipeline

Step 1: Schedule trigger at 06:00 UTC
  → RawOrdersCrawler (scans s3://bucket/raw/orders/)

Step 2: "crawler-success" trigger
  Condition: RawOrdersCrawler SUCCEEDED
  → TransformOrdersJob
    Input: raw_db.orders (new partition)
    Output: s3://bucket/clean/orders/date=2024-01-16/

Step 3a: "job-success" trigger
  Condition: TransformOrdersJob SUCCEEDED
  → UpdateCatalogCrawler (re-scans clean/ to register new partition)

Step 3b: "job-failure" trigger
  Condition: TransformOrdersJob FAILED
  → SendAlertLambda (SNS notification to ops team)

Monitoring: AWS Glue console → Workflows → DailyOrdersPipeline
  Run graph shows each step with duration and status`,
          expectedOutput: `06:00 UTC: Crawler started\n06:02 UTC: Crawler succeeded — 1 new partition detected\n06:02 UTC: TransformOrdersJob started\n06:10 UTC: TransformOrdersJob succeeded — 42,000 rows written\n06:10 UTC: UpdateCatalogCrawler started\n06:12 UTC: Workflow complete`,
          interview: {
            question: 'How does a Glue Workflow handle a job failure differently from a successful run?',
            answer: 'Downstream "succeeded" triggers do not fire. Separate "failed" triggers can run — typically a Lambda or Step Functions that sends an SNS alert or cleans up partial output. The failed run can be retried manually from the console or via EventBridge automation.',
          },
          practice: 'Design a Glue Workflow for a daily pipeline: crawl raw S3 → transform job → load to Redshift → notify on failure. Draw the trigger chain with conditions.',
          hint: 'Schedule trigger → Crawler. On crawler success → Transform job. On job success → Redshift load job. On job failure → SNS notification Lambda.',
          solution: `# Glue Workflow: NightlyOrdersLoad

Trigger 1: Schedule (cron 0 2 * * ? *)
  → Action: Run RawOrdersCrawler

Trigger 2: Event (RawOrdersCrawler SUCCEEDED)
  → Action: Run TransformOrdersGlueJob
             JobParameters: --load_date 2024-01-16

Trigger 3: Event (TransformOrdersGlueJob SUCCEEDED)
  → Action: Run LoadToRedshiftGlueJob

Trigger 4: Event (TransformOrdersGlueJob FAILED)
  → Action: Run AlertLambdaFunction
             (Lambda publishes to SNS: "Transform job failed at 02:xx UTC")

# Workflow shows all nodes in a DAG in the Glue console
# Each node shows status: Waiting | Running | Succeeded | Failed`,
        },
      ],
    },
    {
      title: 'Partitioning & Performance',
      subtopics: [
        {
          id: 'glue-partitioning',
          title: 'S3 Partitioning & Pushdown',
          difficulty: 'Intermediate',
          explanation: 'Partitioning S3 data into subfolders by column value (date=2024-01-15/) enables partition pruning in Athena and Glue — only the needed folders are read. Predicate pushdown further reduces data at the file level (Parquet only).',
          why: 'A 1TB table partitioned by date scans only 2.7 GB for a single-day query instead of 1 TB — a 370x reduction in I/O. This is the biggest performance and cost lever in S3-based data lakes.',
          syntax: `# Write partitioned Parquet from Glue job
glueContext.write_dynamic_frame.from_options(
    frame=clean_dyf,
    connection_type="s3",
    connection_options={
        "path":        "s3://datalake/clean/orders/",
        "partitionKeys": ["order_date"]   # creates order_date=YYYY-MM-DD/ folders
    },
    format="parquet",
    format_options={"compression": "snappy"}
)

# Read with partition filter (Glue)
dyf = glueContext.create_dynamic_frame.from_catalog(
    database="clean_db",
    table_name="orders",
    push_down_predicate="order_date='2024-01-15'"  # reads only that folder
)`,
          example: `# Before partitioning — Athena scans full table
SELECT * FROM raw_db.orders WHERE order_date = '2024-01-15'
-- Data scanned: 1.2 TB (all 365 days)
-- Cost: 1200 GB × $5/TB = $6.00

# After partitioning by order_date
SELECT * FROM raw_db.orders WHERE order_date = '2024-01-15'
-- Data scanned: 3.3 GB (only 2024-01-15/ folder)
-- Cost: 3.3 GB × $5/TB = $0.02

# 300x cost reduction from partitioning alone

# Parquet columnar reading (additional saving)
-- SELECT only 3 columns from 20-column table
-- Parquet reads only those 3 columns: 15% of file data`,
          expectedOutput: `Without partitioning: 1.2 TB scanned, $6.00 Athena cost\nWith partitioning:    3.3 GB scanned, $0.02 Athena cost\nSavings: 99.7%`,
          interview: {
            question: 'What is the push_down_predicate option in Glue and how does it help performance?',
            answer: 'push_down_predicate applies a partition filter at the catalog level, telling Glue to read only the S3 folders matching the condition. Without it, Glue reads all partitions and filters in Spark — much slower and more expensive.',
          },
          practice: 'Write a Glue job that reads from the Glue Catalog with partition pushdown for "2024-01-15", then writes the result partitioned by both "year" and "month" in Parquet Snappy format.',
          hint: 'Use push_down_predicate="order_date=\'2024-01-15\'" on the read. Use partitionKeys=["year","month"] on the write connection options.',
          solution: `# Read with partition pushdown
orders_dyf = glueContext.create_dynamic_frame.from_catalog(
    database="raw_db",
    table_name="orders",
    push_down_predicate="order_date='2024-01-15'"
)

# Write partitioned by year and month
glueContext.write_dynamic_frame.from_options(
    frame=orders_dyf,
    connection_type="s3",
    connection_options={
        "path":         "s3://datalake/clean/orders/",
        "partitionKeys": ["year", "month"]
    },
    format="parquet",
    format_options={"compression": "snappy"}
)
job.commit()`,
        },
      ],
    },
    {
      title: 'Monitoring & Error Handling',
      subtopics: [
        {
          id: 'glue-monitoring',
          title: 'Glue Monitoring & CloudWatch',
          difficulty: 'Intermediate',
          explanation: 'Glue publishes job metrics to CloudWatch: DPU usage, bytes read/written, records processed, and error counts. CloudWatch Alarms notify on failures. Continuous logging streams Spark driver and executor logs to CloudWatch Logs.',
          why: 'Without monitoring, a failed Glue job is invisible until an analyst reports missing data. CloudWatch alarms provide proactive alerting. Structured logs help debug silent data quality issues.',
          syntax: `# Enable continuous logging in Glue job settings:
# --enable-continuous-cloudwatch-log: true
# --enable-metrics: true

# CloudWatch metrics published automatically:
#   glue.driver.aggregate.bytesRead
#   glue.driver.aggregate.recordsRead
#   glue.driver.aggregate.numFailedTasks
#   glue.driver.ExecutorAllocationManager.executors.numberAllExecutors

# CloudWatch Alarm example (via AWS console or Terraform):
#   Metric:    AWS/Glue → JobName → glue.driver.aggregate.numFailedTasks
#   Threshold: >= 1
#   Action:    SNS notification → ops-team topic`,
          example: `# Add structured logging to your Glue job
import logging

logger = logging.getLogger()
logger.setLevel(logging.INFO)

# Start of job
logger.info(f"Job started: {args['JOB_NAME']} | Date: {args.get('load_date','N/A')}")

# After reading
input_count = orders_dyf.count()
logger.info(f"Records read: {input_count}")

# After filtering
clean_df = orders_dyf.toDF().filter(col("amount") > 0)
clean_count = clean_df.count()
dropped = input_count - clean_count
logger.warning(f"Records dropped (invalid amount): {dropped}")

# After writing
logger.info(f"Records written: {clean_count}")
job.commit()
logger.info("Job committed successfully — bookmark advanced")`,
          expectedOutput: `[INFO]  Job started: orders-clean-job | Date: 2024-01-15\n[INFO]  Records read: 42,008\n[WARNING] Records dropped (invalid amount): 16\n[INFO]  Records written: 41,992\n[INFO]  Job committed successfully — bookmark advanced`,
          interview: {
            question: 'How do you get alerted when a Glue job fails?',
            answer: 'Three approaches: (1) CloudWatch Alarm on the glue.driver.aggregate.numFailedTasks metric → SNS topic → email/Slack. (2) EventBridge rule on Glue job state change to FAILED → Lambda → notification. (3) Glue Workflow failure trigger → SNS/Lambda.',
          },
          practice: 'Add structured logging to a Glue job that records: job start, records read, records dropped after filtering, records written, and job completion. What Python logging level would you use for dropped records?',
          hint: 'Use logging.WARNING for dropped records (unexpected data quality issue). INFO for normal progress. The logger output goes to CloudWatch Logs automatically with continuous logging enabled.',
          solution: `import logging
logger = logging.getLogger()
logger.setLevel(logging.INFO)

logger.info(f"START | Job: {args['JOB_NAME']} | load_date: {args.get('load_date')}")

raw_dyf  = glueContext.create_dynamic_frame.from_catalog(database="raw_db", table_name="orders")
read_cnt = raw_dyf.count()
logger.info(f"READ  | Records: {read_cnt:,}")

df = raw_dyf.toDF().filter(col("amount") > 0)
write_cnt = df.count()
dropped   = read_cnt - write_cnt

if dropped > 0:
    logger.warning(f"QUALITY | Dropped {dropped:,} records (invalid amount)")

glueContext.write_dynamic_frame.from_options(...)
logger.info(f"WRITE | Records: {write_cnt:,}")

job.commit()
logger.info("DONE  | Bookmark advanced")`,
        },
      ],
    },
  ],

  interviewGroups: [
    {
      title: 'Beginner',
      questions: [
        { question: 'What is AWS Glue?', answer: 'A serverless ETL service that runs PySpark scripts on managed Spark infrastructure. You pay per DPU-second; AWS manages the cluster.' },
        { question: 'What is the Glue Data Catalog?', answer: 'A centralised metadata store holding table definitions (schema, S3 location, format) used by Athena, EMR, Redshift Spectrum, and Glue jobs without duplicating metadata.' },
        { question: 'What is a Glue Crawler?', answer: 'A job that scans a data source (S3, RDS, DynamoDB), infers schema, and creates or updates tables in the Glue Data Catalog.' },
        { question: 'What is a DynamicFrame?', answer: 'Glue\'s schema-flexible DataFrame that handles inconsistent types and missing fields without failing. You convert to a Spark DataFrame for complex PySpark transforms.' },
        { question: 'What is job.commit() and why is it critical?', answer: 'job.commit() saves the bookmark state — marking which files have been processed. Without it, the next run re-processes all files. It must be the last statement in a Glue job.' },
      ],
    },
    {
      title: 'Intermediate',
      questions: [
        { question: 'How do Glue job bookmarks work?', answer: 'Bookmarks track which S3 files have been processed based on modification timestamps. On each run, only new files (added since last committed bookmark) are read. Bookmark advances only when job.commit() succeeds.' },
        { question: 'What is push_down_predicate in Glue?', answer: 'A partition filter applied at the catalog level before data is read. It tells Glue to access only the S3 folders matching the predicate, skipping all other partitions.' },
        { question: 'How do you handle mixed-type columns in a Glue DynamicFrame?', answer: 'Use resolveChoice(specs=[(column_name, "cast:target_type")]) to cast the ambiguous column to a consistent type without failing the job.' },
        { question: 'What triggers can a Glue Workflow use?', answer: 'Schedule triggers (cron), On-Demand (manual), and Event triggers (fires when a specific crawler or job completes — either succeeded or failed).' },
        { question: 'What is the difference between G.1X and G.2X Glue workers?', answer: 'G.1X: 4 vCPU, 16 GB RAM — general ETL. G.2X: 8 vCPU, 32 GB RAM — memory-intensive joins and shuffles. G.025X: minimal resources for dev/testing.' },
      ],
    },
    {
      title: 'Advanced',
      questions: [
        { question: 'How does S3 partitioning reduce Athena query cost?', answer: 'Partitioning creates subfolders per column value (date=2024-01-15/). A query filtering on that column reads only the matching folder — Athena pays per byte scanned, so reading one day instead of a year is 365x cheaper.' },
        { question: 'How do you implement incremental loading without job bookmarks?', answer: 'Watermark pattern: store the last processed timestamp in a DynamoDB table or Glue catalog table. Each run reads only records WHERE created_at > last_watermark. Update the watermark on job success.' },
        { question: 'How do you handle schema evolution in Glue (source adds a new column)?', answer: 'Run the Glue Crawler after the schema change — it updates the catalog table with the new column. In the Glue job, DynamicFrames handle the new column automatically. For Spark DataFrames, use .mergeSchema in Delta or manage explicitly.' },
        { question: 'What is the Glue relationalize transform?', answer: 'It flattens nested JSON (arrays of objects) into multiple flat tables with foreign key relationships. Useful when API responses have nested arrays that need to be normalised into relational form.' },
        { question: 'How do you optimise a slow Glue job?', answer: '(1) Enable bookmarks to skip already-processed files. (2) Use push_down_predicate for partition pruning. (3) Increase DPU count or switch to G.2X workers. (4) Use Parquet Snappy (compressed columnar). (5) Reduce shuffle partitions for small data.' },
      ],
    },
    {
      title: 'Real-world Scenarios',
      questions: [
        { question: 'A Glue job runs daily but re-processes all historical files every time. What is the fix?', answer: 'Enable job bookmarks in the job settings. Call job.commit() at the end. Bookmarks track which files were processed so the next run only reads new files.' },
        { question: 'A new column was added to the source S3 CSV. How do you update the Glue Catalog without breaking existing jobs?', answer: 'Re-run the Glue Crawler. It detects the new column and adds it to the catalog table. Existing jobs using DynamicFrames will include the new column automatically. Spark DataFrame jobs need code update to handle the new column.' },
        { question: 'Athena queries on a 2TB table take 3+ minutes. What would you check?', answer: 'Check: (1) Is the table partitioned? If not, all 2TB is scanned for every query. (2) Is it Parquet? CSV is 5-10x larger. (3) Are queries using partition columns in WHERE? (4) Are columns queried matching Parquet column layout?' },
        { question: 'You need to load 100 CSV files from S3 into Redshift daily. Design the Glue solution.', answer: 'Glue Workflow: (1) Crawler scans new S3 files → updates catalog. (2) ETL Job: read from catalog with push_down_predicate=today, transform, write clean Parquet to S3. (3) Second ETL Job: COPY clean Parquet into Redshift. (4) Bookmark tracks processed files for incremental loads.' },
        { question: 'A Glue job failed 3 hours into a 4-hour run. What happens to the data and how do you recover?', answer: 'If bookmarks enabled: commit never called → next run retries same files safely. Partial output files in S3 need cleanup (delete the incomplete partition). If sink is a SQL table: incomplete data may be there — use a staging table + SWAP pattern for atomicity.' },
      ],
    },
  ],

  miniProjects: [
    {
      title: 'Mini Project 1: Serverless Data Lake Ingestion',
      goal: 'Build a fully serverless ingestion pipeline using Glue Crawlers, ETL job, and Athena querying.',
      steps: [
        'Create an S3 bucket with folders: raw/, clean/, and athena-results/.',
        'Upload 3 CSV files simulating orders from different dates.',
        'Create a Glue Crawler that scans s3://bucket/raw/ and creates table raw_db.orders.',
        'Write a Glue ETL job that reads raw_db.orders with push_down_predicate, casts types, removes nulls, and writes Parquet to s3://bucket/clean/ partitioned by order_date.',
        'Enable job bookmarks and call job.commit() at the end.',
        'Run a second Glue Crawler on s3://bucket/clean/ to create clean_db.orders.',
        'Query clean_db.orders in Athena with a partition filter and verify results.',
        'Upload a 4th CSV file and re-run the job — verify only the new file is processed.',
      ],
      output: 'Serverless pipeline: CSV → Glue Catalog → ETL Job → Parquet → Athena queries. Bookmark ensures incremental processing.',
    },
    {
      title: 'Mini Project 2: Multi-table ETL with Workflow',
      goal: 'Build a Glue Workflow that orchestrates crawling, transforming, and joining multiple tables.',
      steps: [
        'Create raw S3 data for three tables: orders, customers, products.',
        'Create a Glue Crawler for each raw table.',
        'Write Glue jobs: TransformOrders (clean + type-cast), TransformCustomers, JoinOrdersCustomers (join and enrich).',
        'Create a Glue Workflow: Schedule trigger → three crawlers in parallel → three transforms (on crawler success) → join job (on all transforms success).',
        'Add a failure trigger: if any job fails, run a Lambda that sends an SNS alert.',
        'Monitor the workflow in the Glue console — review the run graph and CloudWatch logs.',
      ],
      output: 'Multi-step orchestrated workflow producing a joined gold-layer table. Automated alerting on failure.',
    },
    {
      title: 'Enterprise Project: Full AWS Data Lake Pipeline',
      goal: 'Design and build a production AWS data lake pipeline from raw S3 ingestion to Athena analytics to Redshift data warehouse.',
      steps: [
        'Raw zone: create S3 structure raw/, cleansed/, analytics/, archive/ with lifecycle policies.',
        'Glue Crawlers: daily crawl of raw zone, update catalog with new partitions.',
        'Glue ETL Job (Bronze → Silver): read raw, apply resolveChoice, cast types, deduplicate, write Parquet Snappy to cleansed/ partitioned by year/month/day.',
        'Glue ETL Job (Silver → Gold): join orders with customers and products, compute KPIs (daily revenue, customer LTV, product rank), write to analytics/ as Parquet.',
        'Athena views: create SQL views on analytics/ for BI tool consumption.',
        'Redshift COPY: optional — COPY analytics/ Parquet into Redshift for dashboards needing sub-second response.',
        'Glue Workflow: schedule all steps, add failure triggers to SNS.',
        'CloudWatch Dashboard: track DPU usage, bytes processed, job duration, and failure count.',
        'Cost optimisation: enable S3 Intelligent-Tiering, right-size DPU counts using CloudWatch metrics, enable Glue auto-scaling.',
      ],
      output: 'Production AWS data lake with raw → cleansed → analytics layers, Athena SQL analytics, Redshift integration, automated orchestration, monitoring, and cost controls.',
    },
  ],
};
