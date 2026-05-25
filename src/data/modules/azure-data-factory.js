export const adfModule = {
  sections: [
    {
      title: 'ADF Concepts',
      subtopics: [
        {
          id: 'adf-overview',
          title: 'What is Azure Data Factory?',
          difficulty: 'Beginner',
          explanation: 'Azure Data Factory (ADF) is a cloud ETL and orchestration service. It moves data between systems (ELT/ETL), transforms it, and schedules these operations without you managing any servers.',
          why: 'A data engineer uses ADF to automate data loads that would otherwise require manual downloads, scripts, and schedules. One pipeline can replace hours of daily manual work.',
          syntax: `ADF core objects:
  Pipeline     — logical container for activities
  Activity     — one step (copy, transform, call API)
  Dataset      — named pointer to a data location
  Linked Service — connection/credentials for a system
  Trigger      — when/why a pipeline runs`,
          example: `Real-world pipeline: "Nightly Sales Load"

  Linked Services:
    - BlobStorageLS  → Azure Blob (source)
    - SqlWarehouseLS → Azure SQL DW (sink)

  Activities:
    1. Lookup: read config table → get yesterday's date
    2. Copy:   Blob CSV → SQL staging table
    3. SP:     EXEC dbo.usp_merge_sales  (transform)
    4. Web:    POST to Slack "Load complete"

  Trigger: Schedule — daily at 02:00 UTC`,
          expectedOutput: `Pipeline completes in ~4 minutes. 42,000 rows loaded. Slack notified.`,
          interview: {
            question: 'How does ADF fit into a modern Azure data platform, and what are its limitations?',
            answer: 'ADF is the orchestration and ingestion layer — it moves data, not transforms it. It connects 90+ sources to Azure storage with no-code Copy Activities, handles scheduling, retries, and alerting. Use ADF when: ingesting from many heterogeneous sources, orchestrating Databricks notebooks or Synapse pipelines, or building visual low-code ETL that non-engineers can maintain. ADF limitations: transformation logic inside ADF (Data Flows) is limited — complex PySpark logic should run in Databricks. ADF pipelines can become unwieldy at 100+ pipelines without a metadata-driven approach. For Python-native orchestration with more flexibility, Apache Airflow (Azure MWAA or self-hosted) is a stronger fit.',
          },
          commonMistakes: [
            'Building transformation logic inside ADF Data Flows for complex operations — Data Flows are good for simple column operations; complex business logic belongs in Databricks notebooks called via Notebook Activity.',
            'Not parameterizing pipelines from day one — hardcoded pipeline for each table or date is an antipattern. Every new pipeline should have load_date and table_name parameters minimum.',
            'Storing secrets in Linked Services directly — always reference Azure Key Vault. ADF pipelines are stored in Git; hardcoded secrets would be committed.',
          ],
          productionContext: 'In enterprise Azure data platforms, ADF typically handles ingestion (source → Bronze ADLS) and orchestration (trigger Databricks notebooks for Silver/Gold). The transformation logic lives in Databricks. ADF becomes the "traffic controller" that sequences activities, handles retries, and sends alerts — while keeping compute in specialized engines.',
          performanceTip: 'Use the Integration Runtime (Azure IR) in the same region as your source and sink to minimize data transfer latency and egress costs. For on-premises sources, use a Self-Hosted Integration Runtime on a VM near the source. The IR region choice can mean the difference between 5 MB/s and 50 MB/s Copy Activity throughput.',
          practice: 'Name the four core objects in Azure Data Factory and describe what each one does in one sentence.',
          hint: 'Think about: what holds activities together (Pipeline), what does one step (Activity), what describes data location (Dataset), and what holds credentials (Linked Service).',
          solution: `# Pipeline: logical container that groups activities into a workflow.
# Activity: a single unit of work — copy data, run SQL, call an API.
# Dataset: a named reference to a data source or sink (file path, table name).
# Linked Service: stores connection info and credentials for an external system.
# Trigger: defines when a pipeline runs — schedule, event, or manual.`,
        },
        {
          id: 'adf-linked-services',
          title: 'Linked Services & Datasets',
          difficulty: 'Beginner',
          explanation: 'A Linked Service stores connection information for an external system. A Dataset is a named pointer to a specific data location using a Linked Service. Datasets are the inputs and outputs of activities.',
          why: 'Separating credentials (Linked Service) from data location (Dataset) means you update credentials in one place and all pipelines inherit the change. Credentials are stored in Azure Key Vault, not in the pipeline.',
          syntax: `Linked Service example (Azure Blob):
  Name:          BlobStorageLS
  Type:          AzureBlobStorage
  Connection:    AccountEndpoint=https://myaccount.blob.core.windows.net
  Auth:          Managed Identity (preferred) or Key Vault ref

Dataset example (CSV file):
  Name:          OrdersCsvDS
  Linked Service: BlobStorageLS
  File path:      raw/orders/@{pipeline().parameters.load_date}.csv
  Format:         DelimitedText (header=true, comma delimiter)`,
          example: `Linked Service: AzureKeyVaultLS
  → Stores all other credentials as secrets

Linked Service: AzureSqlDwLS
  → Connection: Server=myserver.database.windows.net
  → Auth: Key Vault secret "SqlDwPassword"

Dataset: StagingOrdersDS
  → Linked Service: AzureSqlDwLS
  → Table: staging.orders
  → Parameterised: table name passed at runtime

This pattern means:
  - Credentials never appear in pipeline JSON
  - One Linked Service update rotates credentials everywhere`,
          expectedOutput: `Linked services pass credential rotation instantly to all pipelines using them. Datasets parameterised with @{pipeline().parameters.table_name} work for any table.`,
          interview: {
            question: 'What is the best practice for storing database credentials in ADF?',
            answer: 'Never store credentials in the Linked Service directly. Reference them from Azure Key Vault using a Key Vault Linked Service. ADF retrieves the secret at runtime. This separates secrets from pipeline configuration.',
          },
          practice: 'Describe how you would create a Linked Service and Dataset for reading a CSV file from Azure Blob Storage. What information does each object need?',
          hint: 'Linked Service needs: type (AzureBlobStorage), connection string or managed identity. Dataset needs: which Linked Service, the container/folder path, and the file format details.',
          solution: `# Linked Service: BlobStorageLS
#   Type: AzureBlobStorage
#   Auth: Managed Identity (no secrets stored)
#   Account URL: https://mystorage.blob.core.windows.net

# Dataset: RawOrdersCsvDS
#   Linked Service: BlobStorageLS
#   Container: raw
#   File path: orders/@{pipeline().parameters.load_date}/orders.csv
#   Format: DelimitedText
#   First row as header: true
#   Column delimiter: comma
#   Null value: empty string`,
        },
      ],
    },
    {
      title: 'Core Activities',
      subtopics: [
        {
          id: 'adf-copy-activity',
          title: 'Copy Activity',
          difficulty: 'Beginner',
          explanation: 'Copy Activity moves data from a source to a sink with optional column mapping and type conversions. It supports 90+ connectors including Blob, SQL, Snowflake, Salesforce, REST APIs, and S3.',
          why: 'Copy Activity is the most common ADF activity. Ingesting files from storage into a warehouse, exporting warehouse tables to Parquet, syncing databases — all use Copy Activity.',
          syntax: `Copy Activity config:
  Source:
    Dataset: RawOrdersCsvDS
    Wildcard file path: orders/*.csv
    Recursive: true

  Sink:
    Dataset: StagingOrdersSqlDS
    Write method: Insert (or Upsert with key columns)
    Pre-copy script: TRUNCATE TABLE staging.orders

  Mapping: (auto-detect or explicit column mapping)
  Parallelism: degree of copy parallelism (1–32)`,
          example: `Pipeline: "IngestDailyOrders"

Copy Activity: "CopyOrdersToStaging"
  Source:
    Linked Service: BlobStorageLS
    File:  raw/orders/@{pipeline().parameters.load_date}.csv
    Format: CSV, header=true

  Sink:
    Linked Service: SqlDwLS
    Table: staging.orders
    Write mode: Insert
    Pre-copy: DELETE FROM staging.orders WHERE load_date = '@{pipeline().parameters.load_date}'

  Monitoring output:
    Rows read:    42,000
    Rows written: 42,000
    Duration:     18s
    Throughput:   12.5 MB/s`,
          expectedOutput: `Rows read: 42,000 | Rows written: 42,000 | Duration: 18s | Throughput: 12.5 MB/s`,
          interview: {
            question: 'What is a Linked Service in ADF and why is it separate from a Dataset?',
            answer: 'A Linked Service holds connection info and credentials. A Dataset references a Linked Service and adds the specific data location (file path, table name). Separation means you update credentials once in the Linked Service and all Datasets using it are updated automatically.',
          },
          practice: 'Design a Copy Activity that reads all CSV files from a "raw/sales/" folder in Blob Storage and writes to a SQL table "staging.sales". What pre-copy SQL should you run and why?',
          hint: 'Pre-copy cleans the staging table before loading. Use "TRUNCATE TABLE staging.sales" or DELETE by load date. This ensures idempotency — re-running gives the same result.',
          solution: `Copy Activity: "CopyAllSalesToStaging"
  Source:
    Linked Service: BlobStorageLS
    File path:      raw/sales/
    Wildcard:       *.csv
    Recursive:      false

  Sink:
    Linked Service: SqlDwLS
    Table: staging.sales
    Write mode: Insert
    Pre-copy: TRUNCATE TABLE staging.sales

  # Pre-copy TRUNCATE ensures idempotency:
  # If the pipeline re-runs, stale data is removed before reload.
  # Alternative: DELETE WHERE load_date = '@{pipeline().parameters.load_date}'
  # for partitioned incremental loads.`,
        },
        {
          id: 'adf-lookup-foreach',
          title: 'Lookup & ForEach',
          difficulty: 'Intermediate',
          explanation: 'Lookup Activity reads a single result from a database or file (e.g. a list of tables). ForEach iterates over that list and runs a child activity for each item — enabling metadata-driven dynamic pipelines.',
          why: 'Without Lookup + ForEach, you hardcode one Copy Activity per table. With them, one pipeline dynamically loads 50 tables by reading the table list from a config table — zero code changes when tables are added.',
          syntax: `Lookup Activity:
  Source: SQL query → "SELECT table_name FROM config.tables WHERE is_active = 1"
  Returns: { value: [ {table_name: "orders"}, {table_name: "products"}, ... ] }

ForEach Activity:
  Items: @activity('LookupTables').output.value
  Is Sequential: false (parallel)
  Activities inside: Copy Activity
    Source table: @item().table_name
    Sink table:   @concat('staging.', item().table_name)`,
          example: `Pipeline: "MetadataLoadPipeline"

Step 1 — Lookup: "GetTableList"
  Query: SELECT table_name, source_path FROM etl.config WHERE is_active = 1
  Output: [
    { table_name: "orders",   source_path: "raw/orders/" },
    { table_name: "products", source_path: "raw/products/" }
  ]

Step 2 — ForEach: "LoadEachTable"
  Items:         @activity('GetTableList').output.value
  Is Sequential: false
  Batch count:   5 (5 tables in parallel)
  Child: Copy Activity
    Source: @{item().source_path}
    Sink:   @{concat('staging.', item().table_name)}`,
          expectedOutput: `Pipeline loads N tables in parallel. Adding a new table to etl.config automatically includes it next run — no pipeline changes needed.`,
          interview: {
            question: 'What is the advantage of a metadata-driven pipeline using Lookup + ForEach?',
            answer: 'The pipeline is self-configuring. A config table controls which tables load, their source paths, and their targets. Adding a new source requires only a DB row insert — no pipeline editing, no redeployment. This pattern also enables centralized monitoring (all loads logged in one run log table), easy disabling of individual tables without touching the pipeline (set is_active = 0), and self-documenting pipeline behavior.',
          },
          commonMistakes: [
            'Setting ForEach Batch Count too high — 20 parallel Copy Activities all hitting the same SQL Server source can overwhelm it. Start with 3–5 and tune based on source capacity.',
            'Not handling per-item failures inside ForEach — if one Copy fails, ForEach continues with the rest by default. Add error handling inside the ForEach to log failures per item and send notifications.',
            'Using ForEach for sequential dependencies — if Table B must load after Table A, use a sequential pipeline chain, not a parallel ForEach.',
          ],
          productionContext: 'Metadata-driven pipelines are standard at enterprises with 20+ source tables. The config table becomes a self-service catalog: data owners can add new sources by inserting a row, and the pipeline picks them up on the next scheduled run. Combine with a control table that logs each load\'s success/failure for a complete audit trail.',
          performanceTip: 'In ForEach, set Batch Count = 5–10 for database sources and 10–20 for storage sources (Blob/ADLS). Database sources have connection pool limits; hitting 50 concurrent connections to a SQL Server causes throttling. Storage sources can handle much higher parallelism.',
          practice: 'Explain how you would use Lookup and ForEach to build a pipeline that loads 20 CSV files from different paths into 20 SQL staging tables. Where would you store the table-to-path mapping?',
          hint: 'Store the mapping in a SQL config table: (table_name, source_path). Lookup reads it. ForEach iterates. Copy uses @item().source_path and @item().table_name.',
          solution: `# 1. Config table (created once):
#    CREATE TABLE etl.config (table_name VARCHAR(100), source_path VARCHAR(500), is_active BIT)
#    INSERT INTO etl.config VALUES ('orders', 'raw/orders/*.csv', 1), ...

# 2. Lookup Activity:
#    Source: SQL query: SELECT table_name, source_path FROM etl.config WHERE is_active = 1
#    Output: array of { table_name, source_path }

# 3. ForEach Activity:
#    Items: @activity('Lookup').output.value
#    IsSequential: false
#    BatchCount: 5 (5 parallel copies)
#    Child Copy Activity:
#      Source path: @{item().source_path}
#      Sink table:  @{concat('staging.', item().table_name)}`,
        },
        {
          id: 'adf-ifcondition',
          title: 'If Condition & Switch',
          difficulty: 'Intermediate',
          explanation: 'If Condition Activity branches execution based on a boolean expression. The True branch and False branch can contain any number of activities. Switch Activity extends this to multiple cases (like a case/when statement).',
          why: 'Pipelines need branching logic: run a full load on Mondays, incremental on other days. Or notify differently on success vs failure. If Condition makes this declarative without writing separate pipelines.',
          syntax: `If Condition Activity:
  Expression: @equals(dayOfWeek(utcnow()), 1)  # true if Sunday

  If True:
    → Copy Activity (Full Load)
  If False:
    → Copy Activity (Incremental Load)

Switch Activity:
  On: @pipeline().parameters.load_type
  Cases:
    "full":        → Full load activities
    "incremental": → Incremental activities
    "repair":      → Repair/backfill activities
  Default:         → Error notification`,
          example: `Pipeline: "SmartDailyLoad"

If Condition: "IsFirstDayOfWeek"
  Expression: @equals(dayOfWeek(utcnow()), 1)

  TRUE branch (Monday — full reload):
    Pre-copy: TRUNCATE TABLE staging.orders
    Copy: ALL orders from last 90 days
    Log: SET load_type = 'full'

  FALSE branch (Tue–Sun — incremental):
    Lookup: get last_watermark from etl.watermarks
    Copy: only orders WHERE created_at > last_watermark
    Update: SET last_watermark = @utcnow()`,
          expectedOutput: `Monday run: TRUNCATE + full 90-day reload (~180s)\nOther days: incremental, only new rows (~12s)`,
          interview: {
            question: 'When would you use If Condition vs two separate pipelines?',
            answer: 'Use If Condition when the branching logic is simple and shares setup steps (like a common Lookup). Use separate pipelines when the logic is complex enough to justify different schedules, monitoring, or access control.',
          },
          practice: 'Design an If Condition that checks if today is the first of the month. On the first: run a full monthly refresh. On other days: run an incremental load. What ADF expression checks the day of the month?',
          hint: 'Use @equals(dayOfMonth(utcnow()), 1) for the condition. True branch = full load. False branch = incremental.',
          solution: `If Condition: "IsFirstOfMonth"
  Expression: @equals(dayOfMonth(utcnow()), 1)

  TRUE (1st of month):
    Copy Activity: full load, source = all records, pre-copy = TRUNCATE
    Set Variable: load_type = "full"

  FALSE (other days):
    Lookup: SELECT max_created_at FROM etl.watermarks WHERE table_name = 'orders'
    Copy Activity: incremental, WHERE created_at > @{activity('Lookup').output.firstRow.max_created_at}
    Stored Proc: UPDATE etl.watermarks SET max_created_at = @utcnow() WHERE table_name = 'orders'`,
        },
      ],
    },
    {
      title: 'Parameters & Variables',
      subtopics: [
        {
          id: 'adf-parameters',
          title: 'Pipeline Parameters',
          difficulty: 'Intermediate',
          explanation: 'Parameters are pipeline-level inputs set at trigger or run time. They make pipelines reusable — the same pipeline loads any date, table, or environment by passing different parameter values.',
          why: 'A parameterised pipeline replaces 365 hardcoded pipelines (one per date) with one flexible pipeline. Parameters also drive environment switching (dev/test/prod) without code changes.',
          syntax: `Pipeline Parameters:
  - load_date:    String, default: @formatDateTime(utcnow(), 'yyyy-MM-dd')
  - target_table: String, no default
  - env:          String, default: "prod"

Usage in expressions:
  File path: raw/orders/@{pipeline().parameters.load_date}/orders.csv
  Table:     @{pipeline().parameters.target_table}
  Env URL:   @{if(equals(pipeline().parameters.env,'prod'), prodUrl, devUrl)}`,
          example: `Pipeline: "LoadTableForDate"
Parameters:
  - load_date:    "2024-01-15"
  - source_table: "orders"
  - target_table: "staging.orders"

Copy Activity source file path:
  raw/@{pipeline().parameters.source_table}/@{pipeline().parameters.load_date}.csv

Copy Activity sink table:
  @{pipeline().parameters.target_table}

# Trigger with different dates:
# Run 1: load_date = "2024-01-14" → loads Jan 14 data
# Run 2: load_date = "2024-01-15" → loads Jan 15 data
# Same pipeline, different parameters`,
          expectedOutput: `Pipeline runs with load_date="2024-01-15" loads exactly that date's file. Reusable for any date by changing the parameter.`,
          interview: {
            question: 'What is the difference between a Pipeline Parameter and a Pipeline Variable in ADF?',
            answer: 'Parameters are set externally (at trigger time or by a parent pipeline) and are read-only during the run. Variables are internal to the pipeline, can be set and read during execution, and are useful for accumulating values across ForEach iterations.',
          },
          practice: 'Add a parameter "load_date" to a pipeline that defaults to today\'s date. Show how to use it in a Copy Activity source file path expression.',
          hint: 'Default value: @formatDateTime(utcnow(), \'yyyy-MM-dd\'). In expression: @{pipeline().parameters.load_date}.',
          solution: `# Pipeline parameter definition:
#   Name: load_date
#   Type: String
#   Default: @formatDateTime(utcnow(), 'yyyy-MM-dd')

# Usage in Copy Activity source path:
#   raw/orders/@{pipeline().parameters.load_date}/orders.csv

# Usage in Lookup query:
#   SELECT * FROM config WHERE load_date = '@{pipeline().parameters.load_date}'

# When triggered manually: pass load_date = "2024-01-10" to backfill
# When triggered by schedule: default uses today's date automatically`,
        },
      ],
    },
    {
      title: 'Triggers',
      subtopics: [
        {
          id: 'adf-triggers',
          title: 'Schedule & Event Triggers',
          difficulty: 'Beginner',
          explanation: 'ADF has three trigger types: Schedule (cron-based), Storage Event (fires when a file arrives in Blob), and Tumbling Window (fixed time windows with retry and dependency tracking).',
          why: 'Triggers remove the need for manual pipeline runs. A schedule trigger loads data nightly. A storage event trigger starts processing immediately when a file lands — no polling needed.',
          syntax: `Schedule Trigger:
  Recurrence: Every 1 day at 02:00 UTC
  Parameters: load_date = @trigger().scheduledTime

Storage Event Trigger:
  Storage account: mystorage
  Container:       raw
  Blob path begins with: orders/
  Event: BlobCreated
  Parameters: file_path = @triggerBody().fileName

Tumbling Window Trigger:
  Frequency: Hour
  Interval:  1
  Start:     2024-01-01T00:00:00Z
  Max concurrency: 1`,
          example: `Schedule Trigger: "DailyOrdersLoad"
  Recurrence: Every 1 day
  Start time: 2024-01-01 02:00 UTC
  Pipeline:   LoadDailyOrdersPipeline
  Parameters:
    load_date: @formatDateTime(trigger().scheduledTime, 'yyyy-MM-dd')

Storage Event Trigger: "OnOrderFileArrival"
  Storage: mystorage.blob.core.windows.net
  Container: raw
  Blob path begins with: orders/
  Event: BlobCreated
  Pipeline: ProcessOrderFilePipeline
  Parameters:
    file_path: @triggerBody().fileName`,
          expectedOutput: `Schedule trigger fires daily at 02:00 UTC.\nStorage trigger fires within seconds of file upload — no polling delay.`,
          interview: {
            question: 'What is a Tumbling Window trigger and when would you use it?',
            answer: 'It fires for fixed non-overlapping time windows (e.g. every hour) and retries failed windows automatically. Use it when each time window must be processed exactly once and you need dependency tracking between windows.',
          },
          practice: 'Design a Schedule trigger that runs a pipeline every day at 06:00 UTC. Pass the run date as a parameter named "run_date" using the trigger time expression.',
          hint: 'In the trigger parameters section: run_date = @formatDateTime(trigger().scheduledTime, \'yyyy-MM-dd\').',
          solution: `Trigger: "DailyAt6AM"
  Type: Schedule
  Recurrence: Every 1 Day
  Start: 2024-01-01T06:00:00Z
  Time zone: UTC
  Pipeline: MyDailyPipeline
  Parameters:
    run_date: @formatDateTime(trigger().scheduledTime, 'yyyy-MM-dd')

# This passes "2024-01-15" when running on Jan 15
# Use @pipeline().parameters.run_date inside the pipeline to access it`,
        },
      ],
    },
    {
      title: 'Incremental Load',
      subtopics: [
        {
          id: 'adf-incremental',
          title: 'Watermark-based Incremental Load',
          difficulty: 'Intermediate',
          explanation: 'Incremental loading reads only new/changed records since the last run using a watermark — a stored timestamp or ID that marks the last successfully processed record.',
          why: 'Full table reloads become impractical as tables grow. A table with 100M rows and only 50K daily changes should load only those 50K — 99.95% less I/O.',
          syntax: `Pattern:
  1. Lookup: read old_watermark from watermarks table
  2. Copy:   WHERE created_at > old_watermark AND created_at <= @utcnow()
  3. Stored Proc: UPDATE watermarks SET watermark = @utcnow()

Watermarks table:
  CREATE TABLE etl.watermarks (
    table_name  VARCHAR(100),
    watermark   DATETIME2
  )`,
          example: `Pipeline: "IncrementalOrdersLoad"

Activity 1 — Lookup "GetWatermark":
  Query: SELECT watermark FROM etl.watermarks WHERE table_name = 'orders'
  Output: { firstRow: { watermark: "2024-01-14 02:00:00" } }

Activity 2 — Copy "LoadNewOrders":
  Source query:
    SELECT * FROM source_db.orders
    WHERE created_at > '@{activity('GetWatermark').output.firstRow.watermark}'
      AND created_at <= '@{pipeline().parameters.run_time}'
  Sink: staging.orders_incremental

Activity 3 — StoredProc "UpdateWatermark":
  EXEC dbo.usp_update_watermark 'orders', '@{pipeline().parameters.run_time}'`,
          expectedOutput: `Run 1 (Jan 14): watermark=2023-12-31, copies 42,000 rows, updates watermark to Jan 14\nRun 2 (Jan 15): watermark=Jan 14, copies only 4,200 new rows — 10x less data`,
          interview: {
            question: 'How do you handle late-arriving data in an ADF watermark-based pipeline?',
            answer: 'Late-arriving data (records that appear in the source after their event time) can be missed if the watermark has already advanced past them. Two strategies: (1) Watermark buffer — subtract 2–4 hours from the watermark lower bound: WHERE created_at > @{old_watermark} - 2 HOURS. This re-processes the overlap window and catches late records; use MERGE at the sink to handle the duplicate rows idempotently. (2) Two-watermark approach — one watermark for "first load" and a separate "repair" pipeline that re-scans a 48-hour lookback window nightly. The choice depends on how late your source can be: if records arrive within minutes, a 1-hour buffer is sufficient; if they can arrive days late (a connected system that was offline), use the repair approach.',
          },
          commonMistakes: [
            'Updating the watermark BEFORE the Copy Activity succeeds — if Copy fails after watermark update, data from that window is permanently skipped. Always update watermark on success only, using On Success dependency.',
            'Not using MERGE at the sink — if the pipeline runs twice (retry after failure), two INSERTs for the same rows create duplicates. Use UPSERT/MERGE so replays are idempotent.',
            'Using created_at as watermark when the source supports updates — if rows can be updated after creation, use updated_at (or a max(updated_at, created_at) expression) as the watermark column.',
          ],
          productionContext: 'The watermark pattern is the most commonly tested ADF concept in data engineering interviews. In production, the watermarks table is a central control table maintained by the pipeline team. Each environment (dev/test/prod) has its own watermarks table so dev runs don\'t advance production watermarks. A separate "backfill" pipeline accepts a date range parameter for recovery scenarios.',
          performanceTip: 'Index the watermark column (created_at or updated_at) in the source database. Without an index, the WHERE created_at > @watermark filter does a full table scan on every pipeline run. On a 500M-row table, this can be the difference between a 2-second and a 10-minute query.',
          practice: 'Describe the three steps in a watermark-based incremental load pipeline. What table stores the watermark and what happens if the pipeline fails mid-run?',
          hint: 'Steps: (1) Lookup reads old watermark, (2) Copy loads records newer than watermark up to now, (3) Stored Proc updates watermark. On failure: watermark is NOT updated, so next run retries the same window safely.',
          solution: `# Step 1 — Lookup Activity:
#   SELECT watermark FROM etl.watermarks WHERE table_name = 'orders'
#   → returns last successful load timestamp

# Step 2 — Copy Activity:
#   Source WHERE created_at > @{old_watermark} AND created_at <= @{utcnow()}
#   → copies only new records

# Step 3 — Stored Procedure (runs ONLY if Copy succeeds):
#   UPDATE etl.watermarks SET watermark = @{utcnow()} WHERE table_name = 'orders'

# On failure: Step 3 does NOT run → watermark stays at old value
# Next run retries the same window → idempotent (no data loss, possible duplicates in staging)
# Add MERGE or UPSERT at sink to handle duplicate runs safely`,
        },
      ],
    },
    {
      title: 'Error Handling & Monitoring',
      subtopics: [
        {
          id: 'adf-error-handling',
          title: 'Error Handling & Retry',
          difficulty: 'Intermediate',
          explanation: 'ADF activities have dependency conditions: On Success, On Failure, On Completion, and On Skip. Use these to build error notification paths, cleanup activities, and conditional retry logic.',
          why: 'Production pipelines fail occasionally. Proper error handling means the team is notified immediately, partial data is cleaned up, and the next run can safely retry — rather than silently leaving a broken state.',
          syntax: `Activity dependency conditions:
  → On Success  (default) — run only if previous succeeded
  → On Failure            — run only if previous failed
  → On Completion         — run regardless of success/failure
  → On Skip               — run if previous was skipped

Retry settings per activity:
  Retry count: 3
  Retry interval: 30 seconds

Failure path pattern:
  Main Copy → [On Failure] → Web Activity (POST to Teams/Slack alert)
            → [On Failure] → Stored Proc (EXEC cleanup)`,
          example: `Pipeline: "SafeOrdersLoad"

Activity 1: Copy "LoadOrders" (retry 3, interval 30s)
  → On Success:  Stored Proc "MergeToFinal"
  → On Failure:  Web Activity "AlertTeam"
                 POST https://teams-webhook-url
                 Body: {
                   "text": "Pipeline FAILED: @{pipeline().Pipeline} at @{utcnow()}
                           Error: @{activity('LoadOrders').error.message}"
                 }
  → On Failure:  Stored Proc "CleanupStaging"
                 EXEC usp_rollback_staging @run_date`,
          expectedOutput: `On success: data merged, no notification.\nOn failure: Teams alert sent with error details, staging cleaned up, next run retries safely.`,
          interview: {
            question: 'How do you alert on pipeline failure in ADF?',
            answer: 'Add a Web Activity on the failure path of a key activity. POST to a Teams or Slack webhook with the pipeline name, activity name, and error message from @{activity(\'ActivityName\').error.message}. You can also set up Azure Monitor alerts on ADF metrics.',
          },
          practice: 'Add a failure notification to a pipeline: if the Copy activity fails, call a web API with the pipeline name and error message. What expression gives you the error message?',
          hint: '@{activity(\'CopyActivityName\').error.message} gives the error. Use a Web Activity with POST method and JSON body containing those expressions.',
          solution: `# Add Web Activity after Copy Activity with "On Failure" dependency

Web Activity: "NotifyOnFailure"
  Method: POST
  URL: @{linkedService().TeamsWebhookURL}
  Body:
  {
    "text": "ADF FAILURE: Pipeline @{pipeline().Pipeline} | Activity CopyOrders | Error: @{activity('CopyOrders').error.message} | Time: @{utcnow()}"
  }

# Also add Stored Proc on failure to clean staging:
Stored Proc: "CleanupStagingOnFailure"
  Connection: SqlDwLS
  Proc: EXEC dbo.usp_truncate_staging '@{pipeline().parameters.load_date}'`,
        },
        {
          id: 'adf-logging',
          title: 'Pipeline Logging & Monitoring',
          difficulty: 'Intermediate',
          explanation: 'ADF Monitor view shows all pipeline and activity runs with status, duration, and error details. Custom logging uses Set Variable and Stored Procedure activities to write run metadata to a SQL log table.',
          why: 'The built-in monitor shows run status but not business metrics (rows loaded, source file size, rejection counts). Custom logging captures these for SLA tracking, capacity planning, and audit trails.',
          syntax: `Log table pattern:
  CREATE TABLE etl.pipeline_log (
    run_id        UNIQUEIDENTIFIER,
    pipeline_name VARCHAR(200),
    activity_name VARCHAR(200),
    load_date     DATE,
    rows_read     INT,
    rows_written  INT,
    status        VARCHAR(20),
    duration_sec  INT,
    start_time    DATETIME2,
    end_time      DATETIME2,
    error_message NVARCHAR(MAX)
  )`,
          example: `Logging pattern using Set Variable + Stored Proc:

Set Variable "rows_copied":
  Value: @{activity('CopyOrders').output.rowsCopied}

Set Variable "duration":
  Value: @{activity('CopyOrders').output.copyDuration}

Stored Proc "WriteRunLog":
  EXEC etl.usp_log_run
    @run_id       = '@{pipeline().RunId}',
    @pipeline     = '@{pipeline().Pipeline}',
    @load_date    = '@{pipeline().parameters.load_date}',
    @rows_written = @{variables('rows_copied')},
    @duration_sec = @{variables('duration')},
    @status       = 'SUCCESS'`,
          expectedOutput: `etl.pipeline_log after successful run:\n run_id=abc123 | pipeline=LoadOrders | load_date=2024-01-15 | rows_written=42000 | duration=18 | status=SUCCESS`,
          interview: {
            question: 'How do you capture the number of rows copied in a Copy Activity for logging?',
            answer: 'Use @{activity(\'CopyActivityName\').output.rowsCopied} in a Set Variable activity after the copy. Then pass the variable value to a Stored Procedure that inserts a row into your log table.',
          },
          practice: 'Design a SQL log table for ADF pipeline runs. What columns would you include? How would you capture the rows written from a Copy Activity?',
          hint: 'Columns: run_id, pipeline_name, load_date, rows_read, rows_written, status, start_time, end_time. Rows written: @{activity(\'CopyActivity\').output.rowsCopied}.',
          solution: `CREATE TABLE etl.pipeline_log (
    run_id        UNIQUEIDENTIFIER DEFAULT NEWID(),
    pipeline_name VARCHAR(200)     NOT NULL,
    load_date     DATE             NOT NULL,
    rows_read     INT,
    rows_written  INT,
    status        VARCHAR(20),     -- SUCCESS | FAILED | PARTIAL
    start_time    DATETIME2,
    end_time      DATETIME2,
    duration_sec  INT,
    error_message NVARCHAR(MAX)
)

-- Capture in ADF:
-- rows_written: @{activity('CopyOrders').output.rowsCopied}
-- duration_sec: @{activity('CopyOrders').output.copyDuration}
-- start_time:   @{pipeline().TriggerTime}
-- end_time:     @{utcnow()}`,
        },
      ],
    },
    {
      title: 'Dynamic Pipelines',
      subtopics: [
        {
          id: 'adf-dynamic',
          title: 'Metadata-Driven Pipelines',
          difficulty: 'Advanced',
          explanation: 'A metadata-driven pipeline reads its configuration from a database table at runtime. The pipeline is a generic framework; the config table controls which tables load, their schedules, source types, and transformations.',
          why: 'Hardcoded pipelines require a code change and redeployment for every new table. A metadata-driven approach lets data engineers add tables to a config DB and have them automatically included in the next run.',
          syntax: `Config table: etl.table_config
  Columns:
    table_name      VARCHAR(100)   -- "orders"
    source_type     VARCHAR(50)    -- "blob_csv", "sql", "api"
    source_path     VARCHAR(500)   -- "raw/orders/"
    sink_table      VARCHAR(200)   -- "staging.orders"
    load_type       VARCHAR(20)    -- "full", "incremental"
    watermark_col   VARCHAR(100)   -- "created_at"
    is_active       BIT
    priority        INT

Generic pipeline:
  1. Lookup → SELECT * FROM etl.table_config WHERE is_active = 1 ORDER BY priority
  2. ForEach → iterate over config rows
  3. If Condition → switch on load_type
  4. Copy → use @item().source_path, @item().sink_table`,
          example: `etl.table_config rows:
  orders   | blob_csv | raw/orders/   | staging.orders   | incremental | created_at
  products | blob_csv | raw/products/ | staging.products | full        | NULL
  customers| sql      | crm.customers | staging.customers| incremental | updated_at

Pipeline "MetadataDrivenLoad":
  Lookup: SELECT * FROM etl.table_config WHERE is_active = 1
  ForEach (parallel, batch=5):
    If @equals(item().load_type, 'incremental'):
      TRUE:  Lookup watermark → incremental Copy → update watermark
      FALSE: Truncate → full Copy`,
          expectedOutput: `All active tables loaded in one pipeline run.\nAdding a new table requires only inserting a row in etl.table_config — no ADF changes.`,
          interview: {
            question: 'What are the advantages of a metadata-driven pipeline in ADF?',
            answer: 'New sources are added by inserting a config row — no ADF changes needed. Load behaviour (full/incremental, frequency, priority) is centrally managed. One pipeline handles all tables, reducing maintenance. Monitoring is unified.',
          },
          practice: 'Design the etl.table_config schema for a metadata-driven ADF pipeline. What columns would you include and why is each important?',
          hint: 'Think about what the pipeline needs at runtime: source location, sink table, load type, watermark column, active flag, and priority for ordering.',
          solution: `CREATE TABLE etl.table_config (
    id               INT IDENTITY PRIMARY KEY,
    table_name       VARCHAR(100)  NOT NULL,  -- logical name for logging
    source_type      VARCHAR(50)   NOT NULL,  -- blob_csv | sql | rest_api
    source_path      VARCHAR(500),            -- container/path or DB.schema.table
    sink_schema      VARCHAR(100)  NOT NULL,  -- staging
    sink_table       VARCHAR(100)  NOT NULL,  -- orders
    load_type        VARCHAR(20)   NOT NULL,  -- full | incremental
    watermark_column VARCHAR(100),            -- created_at (for incremental)
    is_active        BIT           DEFAULT 1, -- disable without deleting
    priority         INT           DEFAULT 100,-- lower = runs first
    created_at       DATETIME2     DEFAULT GETDATE(),
    notes            NVARCHAR(500)            -- description for ops team
)`,
        },
      ],
    },
    {
      title: 'CI/CD for ADF',
      subtopics: [
        {
          id: 'adf-cicd',
          title: 'Git Integration & CI/CD',
          difficulty: 'Advanced',
          explanation: 'ADF integrates with Azure DevOps or GitHub for version control. Pipelines are stored as JSON in a Git repo. CI/CD deploys from dev → test → prod using ARM templates or ADF publish + parameterisation.',
          why: 'Without CI/CD, pipelines are changed directly in production — no audit trail, no code review, no rollback. Git integration gives change history, pull requests, and safe deployment pipelines.',
          syntax: `ADF CI/CD pattern:
  1. Dev environment: connected to feature branch
  2. Developer creates/edits pipelines in ADF UI
  3. Changes saved to Git as JSON files
  4. Pull request to main branch → peer review
  5. On merge: Azure DevOps pipeline triggers
  6. Publish ARM template from main branch → deploys to Test
  7. Manual approval → deploys to Prod

Key files in repo:
  /pipeline/   — pipeline JSON definitions
  /linkedService/ — Linked Service JSON (no secrets)
  /dataset/    — Dataset JSON
  /trigger/    — Trigger JSON
  ARMTemplateForFactory.json — full ADF ARM template`,
          example: `Azure DevOps Pipeline YAML:

stages:
  - stage: Deploy_Test
    jobs:
      - job: ADF_Deploy
        steps:
          - task: AzureResourceManagerTemplateDeployment@3
            inputs:
              deploymentScope: Resource Group
              resourceGroupName: rg-data-test
              templateLocation: Linked artifact
              csmFile: ARMTemplateForFactory.json
              csmParametersFile: ARMTemplateParametersForFactory-test.json
              overrideParameters: >
                -factoryName adf-data-test
                -BlobStorageLS_connectionString @Microsoft.KeyVault(...)

  - stage: Deploy_Prod
    dependsOn: Deploy_Test
    condition: succeeded()
    jobs:
      - deployment: Approve_Prod
        environment: production   # requires manual approval`,
          expectedOutput: `After merge to main:\n1. ARM template deployed to Test automatically\n2. Manual approval gate\n3. Same template deployed to Prod with prod parameters`,
          interview: {
            question: 'How do you handle environment-specific settings (dev/test/prod connection strings) in ADF CI/CD?',
            answer: 'Use ADF global parameters or ARM template parameters. Each environment has its own parameter file that overrides connection strings, storage accounts, and Key Vault references. Secrets are never stored in Git — they are referenced from Key Vault in each environment.',
          },
          practice: 'Describe the steps to promote an ADF pipeline change from Dev to Prod using Git integration and Azure DevOps. What prevents secrets from being committed to Git?',
          hint: 'Steps: edit in Dev ADF → commit to feature branch → PR to main → merge triggers DevOps pipeline → ARM template deploy to Test → approval → deploy to Prod. Secrets prevented by: Linked Services reference Key Vault instead of hardcoded values.',
          solution: `# Promotion flow:
# 1. Developer edits pipeline in Dev ADF (connected to feature/my-feature branch)
# 2. Saves → JSON committed to feature branch in Azure DevOps repo
# 3. Create Pull Request: feature/my-feature → main
# 4. Team reviews pipeline JSON diff
# 5. PR merged to main
# 6. Azure DevOps pipeline triggers:
#    - Export ARM template from ADF (adf_publish branch)
#    - Deploy to Test using test-parameters.json
# 7. Test validation (automated tests / manual smoke test)
# 8. Manual approval in Azure DevOps
# 9. Deploy same ARM template to Prod using prod-parameters.json

# Secrets: Linked Services use @Microsoft.KeyVault(SecretUri=...) references
# The Key Vault URI is in the parameters file — secret VALUE is never in Git`,
        },
      ],
    },
  ],

  interviewGroups: [
    {
      title: 'Beginner',
      questions: [
        { question: 'What is Azure Data Factory?', answer: 'A cloud ETL/ELT and orchestration service that moves and transforms data between systems without managing servers.' },
        { question: 'What is a Linked Service in ADF?', answer: 'A connection definition storing credentials and endpoint info for an external system (Azure SQL, Blob, Snowflake). Activities reference Linked Services rather than storing credentials directly.' },
        { question: 'What is a Dataset in ADF?', answer: 'A named reference to a specific data location using a Linked Service — e.g. a specific file path in Blob or a table name in SQL. Datasets are inputs and outputs of Copy Activities.' },
        { question: 'What is a Copy Activity?', answer: 'The most common ADF activity. It moves data from a source Dataset to a sink Dataset with optional column mapping, type conversion, and data preview.' },
        { question: 'What types of triggers does ADF support?', answer: 'Schedule trigger (cron-based), Storage Event trigger (fires on file arrival in Blob), and Tumbling Window trigger (fixed time windows with retry and dependency tracking).' },
      ],
    },
    {
      title: 'Intermediate',
      questions: [
        { question: 'How does a watermark-based incremental load work?', answer: 'A watermarks table stores the last successfully processed timestamp. Each run: Lookup reads old watermark → Copy loads records WHERE created_at > old_watermark → Stored Proc updates watermark to current time.' },
        { question: 'What does Lookup + ForEach enable in ADF?', answer: 'Metadata-driven pipelines. Lookup reads a config table with a list of tables/files. ForEach iterates over them. One pipeline handles N sources without hardcoding.' },
        { question: 'What is the difference between Pipeline Parameters and Variables?', answer: 'Parameters are set externally (by trigger or parent pipeline) and read-only during the run. Variables are internal and mutable — set and read within the pipeline. Variables accumulate state across ForEach iterations.' },
        { question: 'How do you handle activity failures in ADF?', answer: 'Add activities on the failure dependency path: a Web Activity to notify Teams/Slack, a Stored Proc to clean staging, and a Set Variable to record the error. The watermark is only updated on success.' },
        { question: 'What is the If Condition activity?', answer: 'A branching activity that runs one set of child activities when the expression is true and another when false. Used for full vs incremental logic, day-of-week branching, and conditional notifications.' },
      ],
    },
    {
      title: 'Advanced',
      questions: [
        { question: 'What is a metadata-driven pipeline?', answer: 'A pipeline whose behaviour is controlled by a config table, not hardcoded. Lookup reads the config, ForEach iterates over it. Adding a new source table requires only a DB insert — no pipeline editing.' },
        { question: 'How do you implement CI/CD for ADF?', answer: 'Connect ADF to a Git repo (Azure DevOps or GitHub). Changes are saved as JSON. Merge to main triggers an Azure DevOps pipeline that deploys the ARM template to Test → approval → Prod, with environment-specific parameter files.' },
        { question: 'How do you secure credentials in ADF?', answer: 'Linked Services reference Azure Key Vault secrets instead of storing credentials directly. ADF uses Managed Identity to access Key Vault — no passwords or connection strings in code or config.' },
        { question: 'What is a Tumbling Window trigger?', answer: 'A trigger that fires for fixed, non-overlapping time windows (e.g. hourly). Unlike Schedule triggers, it retries failed windows and supports dependency on a previous window — ensuring every window is processed exactly once.' },
        { question: 'How do you pass data between activities in ADF?', answer: 'Use @{activity(\'ActivityName\').output.fieldName} expressions. For Copy: output.rowsCopied. For Lookup: output.firstRow.columnName or output.value (array). Store in Variables for reuse across multiple activities.' },
      ],
    },
    {
      title: 'Real-world Scenarios',
      questions: [
        { question: 'A Copy Activity fails intermittently due to network issues. How do you handle this?', answer: 'Set retry count (3) and retry interval (30s) on the Copy Activity. Add a Web Activity on failure dependency to alert the team. Log the error with @{activity(\'Copy\').error.message}. The watermark is only updated on success.' },
        { question: 'You need to load 50 tables from SQL Server to Azure SQL DW daily. How would you design this?', answer: 'Metadata-driven pipeline: one config table with 50 rows. Lookup reads all active tables. ForEach (parallel, batch=10) runs a Copy Activity using @item().source_table and @item().sink_table. Zero hardcoded table names in the pipeline.' },
        { question: 'How would you backfill 30 days of data using ADF when the daily pipeline failed?', answer: 'Run the pipeline manually 30 times passing different load_date parameters. Or create a ForEach that iterates over a date list. Or use a Tumbling Window trigger starting from 30 days ago — it processes each missed window sequentially.' },
        { question: 'A pipeline loads data at 2am but the source file sometimes arrives late. How do you handle this?', answer: 'Switch from a Schedule trigger to a Storage Event trigger that fires when the file lands in Blob. The pipeline starts processing immediately on file arrival rather than waiting for a fixed schedule.' },
        { question: 'How do you monitor ADF pipeline SLAs (must complete before 6am)?', answer: 'Use Azure Monitor alerts on ADF pipeline failure metrics. Log run start/end times to a SQL table via Stored Proc activities. Create a Power BI report on the log table. Set up Teams alerts if end_time > 06:00.' },
      ],
    },
  ],

  miniProjects: [
    {
      title: 'Mini Project 1: Daily Sales Incremental Load',
      goal: 'Build a parameterised, incrementally loading ADF pipeline for a daily sales feed.',
      steps: [
        'Create two Linked Services: BlobStorageLS (source) and AzureSqlDwLS (sink) both referencing Key Vault for credentials.',
        'Create a watermarks table: etl.watermarks(table_name, watermark DATETIME2).',
        'Create a pipeline parameter: run_date (default: today\'s date).',
        'Lookup Activity: read the current watermark for "sales" from etl.watermarks.',
        'Copy Activity: copy from raw/sales/@{run_date}.csv WHERE created_at > old watermark.',
        'Stored Proc Activity (on success only): update watermark to run_date.',
        'Web Activity (on failure): POST alert to Teams webhook with error details.',
        'Create a Schedule trigger to run at 03:00 UTC daily.',
      ],
      output: 'Idempotent incremental pipeline that loads only new sales records daily, notifies on failure, and maintains a watermark.',
    },
    {
      title: 'Mini Project 2: Metadata-Driven Table Loader',
      goal: 'Build a generic ADF pipeline that loads N tables using a config table.',
      steps: [
        'Create etl.table_config with columns: table_name, source_path, sink_table, load_type, is_active.',
        'Insert 5 rows: orders (incremental), products (full), customers (incremental), stores (full), promotions (full).',
        'Build a pipeline with: Lookup → read all active tables. ForEach (parallel, batch=3) → Copy for each table.',
        'Inside ForEach: If Condition on load_type. Full branch: TRUNCATE + Copy. Incremental branch: Lookup watermark → Copy → Update watermark.',
        'Add a Stored Proc after ForEach to write a run summary to etl.pipeline_log.',
        'Test by disabling one table (set is_active=0) and verify it is skipped.',
      ],
      output: 'One pipeline that loads all active tables. New tables added to config are picked up automatically next run.',
    },
    {
      title: 'Enterprise Project: End-to-End Medallion Load Pipeline',
      goal: 'Build a production ADF pipeline that loads raw files into Bronze, transforms to Silver via Databricks notebook, and aggregates to Gold via stored procedure.',
      steps: [
        'Design three Linked Services: ADLS (raw/bronze/silver/gold), Databricks (for notebook activity), Azure SQL (Gold layer tables).',
        'Build Pipeline Stage 1 — Bronze Load: Storage Event trigger on raw file arrival → Copy to Bronze ADLS with schema validation.',
        'Build Pipeline Stage 2 — Silver Transform: Databricks Notebook Activity runs a PySpark notebook that cleans and deduplicates Bronze data → writes Silver Delta.',
        'Build Pipeline Stage 3 — Gold Aggregate: Stored Proc activity calls usp_build_gold_daily to aggregate Silver into Gold SQL tables.',
        'Add error handling at each stage: failure → Web Activity alert + Set Variable error message.',
        'Add custom logging: Stored Proc writes stage completion times and row counts to etl.pipeline_log.',
        'Create a Schedule trigger at 02:00 UTC and a manual trigger for backfill with date parameter.',
        'Deploy via CI/CD: Git-backed ADF → Azure DevOps pipeline → parameterised deploy to Test then Prod.',
      ],
      output: 'Production-grade, three-stage medallion pipeline with CI/CD, error alerting, custom logging, and both scheduled and ad-hoc execution.',
    },
  ],

  orchestrationPatterns: [
    {
      id: 'orch-airflow-vs-adf',
      title: 'Airflow vs ADF — When to Use Each',
      difficulty: 'Advanced',
      explanation: 'Apache Airflow and Azure Data Factory are both orchestration tools but serve different workflows. ADF is visual, low-code, and Azure-native. Airflow is Python-native, code-first, and cloud-agnostic.',
      why: 'Interviewers ask this comparison frequently. Understanding the tradeoffs demonstrates architectural maturity and shows you can match the tool to the team\'s needs.',
      syntax: `// ADF strengths:
// - Visual pipeline builder (accessible to non-engineers)
// - 90+ native connectors (no code for SAP, Salesforce, etc.)
// - Native Azure integration (no infrastructure to manage)
// - Built-in monitoring and alerting UI

// Airflow strengths:
// - Python code → version-controlled, testable DAGs
// - Unlimited custom operators (any Python library)
// - Dynamic DAG generation (generate 100 tasks programmatically)
// - Complex dependencies (conditional branches, XCom data passing)
// - Community ecosystem (Astronomer, provider packages for every cloud)`,
      example: `# Airflow DAG example — Medallion pipeline
from airflow import DAG
from airflow.providers.databricks.operators.databricks import DatabricksRunNowOperator
from airflow.providers.microsoft.azure.operators.adls import ADLSDeleteOperator
from airflow.utils.dates import days_ago
from datetime import timedelta

default_args = {
    "owner": "data-engineering",
    "retries": 2,
    "retry_delay": timedelta(minutes=5),
    "email_on_failure": True,
    "email": ["data-eng-alerts@company.com"],
}

with DAG(
    dag_id="medallion_nightly",
    default_args=default_args,
    schedule_interval="0 2 * * *",   # 2am daily
    start_date=days_ago(1),
    catchup=False,
    tags=["medallion", "production"],
) as dag:

    bronze_job = DatabricksRunNowOperator(
        task_id="bronze_ingest",
        databricks_conn_id="databricks_prod",
        job_id=1001,
        notebook_params={"load_date": "{{ ds }}"},  # Airflow date template
    )

    silver_job = DatabricksRunNowOperator(
        task_id="silver_transform",
        databricks_conn_id="databricks_prod",
        job_id=1002,
        notebook_params={"load_date": "{{ ds }}"},
    )

    gold_job = DatabricksRunNowOperator(
        task_id="gold_aggregate",
        databricks_conn_id="databricks_prod",
        job_id=1003,
        notebook_params={"load_date": "{{ ds }}"},
    )

    # Sequential dependency chain
    bronze_job >> silver_job >> gold_job`,
      expectedOutput: 'DAG runs bronze → silver → gold in sequence nightly, with retries and email alerts on failure',
      interview: {
        question: 'Your team has 5 data engineers who all know Python. Would you use ADF or Airflow as your orchestration layer? Why?',
        answer: 'Airflow is the stronger choice for a Python-native team. Reasons: (1) DAGs are Python files — testable with pytest, reviewable via PR, versioned in Git, and portable across clouds. (2) Dynamic DAG generation handles cases like "create one task per table" with a for loop — ADF needs a config table + ForEach. (3) XCom enables data passing between tasks without a database table. (4) The Airflow provider ecosystem (Databricks, Azure, dbt, Slack) covers all modern DE tools. Counter-argument: ADF wins if the team includes non-engineers who need to build and debug pipelines visually, or if you need connectors like SAP/Mainframe that Airflow lacks. In practice, many Azure shops run both: ADF for ingestion from complex sources, Airflow for orchestration of Databricks transformation notebooks.',
      },
      commonMistakes: [
        'Using Airflow to run heavyweight data transformations — Airflow is an orchestrator, not a compute engine. Tasks should trigger Spark jobs, not process data themselves.',
        'Not setting catchup=False when you don\'t want historical backfill — if catchup=True and your start_date is 1 year ago, Airflow tries to run 365 DAG runs on deployment.',
        'Using a single Airflow worker for everything — production Airflow needs at minimum: separate scheduler, multiple workers for parallel tasks, and a separate metadata database (not SQLite).',
      ],
      productionContext: 'Azure Managed Airflow (Azure MWAA or Airflow on AKS) is the production deployment choice. Team DAGs are stored in Azure Blob; MWAA syncs them automatically. Airflow connections (Databricks, Azure SQL, Event Hubs) are stored in the Airflow metadata DB encrypted — no secrets in DAG code.',
      performanceTip: 'Set concurrency limits at the DAG and task pool level to prevent Airflow from overwhelming downstream systems. Use pools to cap parallel tasks that hit the same database source. Example: create a pool "databricks_pool" with 10 slots; all Databricks tasks draw from it, capping concurrent Databricks job submissions.',
    },
    {
      id: 'orch-idempotency',
      title: 'Idempotent Pipeline Design',
      difficulty: 'Advanced',
      explanation: 'An idempotent pipeline produces the same result regardless of how many times it runs for the same input. Re-running a pipeline (for retries, backfill, or bug fixes) should not create duplicates or inconsistent data.',
      why: 'Idempotency is one of the most important properties of production pipelines. Without it, retries after failures corrupt data. With it, you can re-run any pipeline at any time without fear.',
      syntax: `// Idempotent patterns:
// 1. DELETE + INSERT (partition overwrite):
//    DELETE FROM gold.orders WHERE order_date = @load_date
//    INSERT INTO gold.orders SELECT ... WHERE order_date = @load_date

// 2. MERGE / UPSERT:
//    MERGE target USING source ON target.key = source.key
//    WHEN MATCHED → UPDATE
//    WHEN NOT MATCHED → INSERT

// 3. Delta overwrite by partition:
//    df.write.format("delta")
//       .mode("overwrite")
//       .option("replaceWhere", f"order_date = '{load_date}'")
//       .save("...")

// 4. Watermark idempotency:
//    Update watermark ONLY after successful load
//    On failure, same window re-processes (safe with MERGE at sink)`,
      example: `# Idempotent Databricks notebook pattern:
from delta.tables import DeltaTable
from pyspark.sql.functions import col

load_date = dbutils.widgets.get("load_date")

# Read only this date's Silver data
silver = spark.table("silver.orders").filter(col("order_date") == load_date)

# Compute Gold aggregation
gold_day = silver.groupBy("product_category") \
    .agg({"amount": "sum", "order_id": "count"}) \
    .withColumn("order_date", lit(load_date))

# Idempotent write: replace only this date's partition
# Running this 10 times produces the same Gold rows for load_date
gold_day.write \
    .format("delta") \
    .mode("overwrite") \
    .option("replaceWhere", f"order_date = '{load_date}'") \
    .saveAsTable("gold.daily_revenue")

print(f"Gold loaded for {load_date}: {gold_day.count()} rows")`,
      expectedOutput: 'Running for 2025-01-15 five times produces exactly the same gold.daily_revenue rows for that date',
      interview: {
        question: 'How do you design a pipeline so that re-running it for the same date produces the same result?',
        answer: 'Three techniques depending on the storage layer: (1) Partition overwrite — DELETE WHERE load_date = X then INSERT, or Delta replaceWhere. Exactly replaces that date\'s data on every run. Best for Gold aggregation tables. (2) MERGE/UPSERT — ON (natural key), UPDATE if match, INSERT if new. Best for Silver tables where rows can arrive out of order. (3) Watermark update on success only — the watermark doesn\'t advance if the pipeline fails, so the next run reprocesses the same window and MERGE makes it idempotent at the sink. The key principle: separate the pipeline into a "pure computation" phase (input → output, same every time for same input) and a "commit" phase (update control tables, advance watermarks). Only the commit phase should be non-idempotent, and it should only run on success.',
      },
      commonMistakes: [
        'Using INSERT without a prior DELETE for date-partitioned tables — on retry, you get double rows for that date. Always overwrite the date partition.',
        'Checking idempotency only for the happy path — test idempotency by running the pipeline twice and comparing row counts. Also test failure recovery: kill the pipeline mid-run, re-run, verify correctness.',
        'Making idempotency more complex than needed — for most Gold aggregation tables, "DELETE date + INSERT date" is simpler and more reliable than MERGE.',
      ],
      productionContext: 'Every production pipeline at data-mature companies has a documented "re-run procedure." The procedure should be: "Pass load_date parameter, pipeline is idempotent, safe to re-run." If re-running requires manual cleanup, the pipeline is not production-ready.',
      performanceTip: 'Delta replaceWhere is the most efficient idempotent overwrite for partitioned tables — it only rewrites the target partition\'s files, not the entire table. Compare to overwrite mode which rewrites everything. For a 1TB Gold table with daily partitions, replaceWhere rewrites ~3GB (one day) vs 1TB (full overwrite).',
    },
  ],
};
