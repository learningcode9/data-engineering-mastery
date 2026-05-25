export const projectDetails = [
  {
    id: 'sales-lakehouse',
    title: 'Sales Lakehouse Pipeline',
    icon: '🏠',
    difficulty: 'Intermediate',
    duration: '2–3 days',
    tools: ['Databricks', 'Delta Lake', 'PySpark', 'Azure Data Lake Storage', 'Azure Data Factory'],
    tags: ['Lakehouse', 'Medallion', 'Delta Lake', 'Batch'],
    overview: 'Build a full medallion architecture lakehouse for a retail sales dataset. Ingest raw CSV files from ADLS, apply Bronze → Silver → Gold transformation layers, and expose Gold tables for BI consumption.',
    businessProblem: 'A retail company receives daily sales transaction files from 50+ stores. The analytics team needs clean, deduplicated, aggregated sales data for daily dashboards. The current process is manual Excel exports — replacing it with an automated lakehouse will reduce reporting time from 2 days to under 1 hour.',
    architecture: {
      description: 'Medallion architecture on Azure with ADF for orchestration and Databricks for processing.',
      layers: [
        { name: 'Bronze', color: '#cd7f32', description: 'Raw files landed in ADLS Gen2. Schema-on-read, append-only Delta tables. No transformations.' },
        { name: 'Silver', color: '#c0c0c0', description: 'Cleansed, deduplicated, joined data. SCD Type 2 for customer dimension. Data quality constraints enforced.' },
        { name: 'Gold', color: '#ffd700', description: 'Business-level aggregates: daily_sales, monthly_revenue, top_products. Optimized for BI queries with Z-ORDER.' },
      ],
      components: ['ADLS Gen2', 'ADF Trigger', 'Databricks Cluster', 'Delta Lake', 'Unity Catalog', 'Power BI'],
    },
    steps: [
      { step: 1, title: 'Set up ADLS Gen2 storage', description: 'Create hierarchical namespace storage with containers: raw/, bronze/, silver/, gold/', code: `# Mount ADLS to Databricks
configs = {
  "fs.azure.account.auth.type": "OAuth",
  "fs.azure.account.oauth.provider.type": "org.apache.hadoop.fs.azurebfs.oauth2.ClientCredsTokenProvider",
  "fs.azure.account.oauth2.client.id": dbutils.secrets.get(scope="kv", key="sp-client-id"),
  "fs.azure.account.oauth2.client.secret": dbutils.secrets.get(scope="kv", key="sp-secret"),
  "fs.azure.account.oauth2.client.endpoint": f"https://login.microsoftonline.com/{tenant_id}/oauth2/token"
}
dbutils.fs.mount(
  source="abfss://raw@storageaccount.dfs.core.windows.net/",
  mount_point="/mnt/raw",
  extra_configs=configs
)` },
      { step: 2, title: 'Bronze ingestion with Auto Loader', description: 'Use Databricks Auto Loader for incremental file ingestion into Delta Bronze layer.', code: `from pyspark.sql.functions import current_timestamp, input_file_name

bronze_df = (
    spark.readStream
    .format("cloudFiles")
    .option("cloudFiles.format", "csv")
    .option("cloudFiles.schemaLocation", "/mnt/bronze/_schema/sales")
    .option("header", "true")
    .option("inferSchema", "true")
    .load("/mnt/raw/sales/")
    .withColumn("_ingested_at", current_timestamp())
    .withColumn("_source_file", input_file_name())
)

(bronze_df.writeStream
    .format("delta")
    .outputMode("append")
    .option("checkpointLocation", "/mnt/bronze/_checkpoints/sales")
    .trigger(availableNow=True)
    .toTable("bronze.sales_raw")
)` },
      { step: 3, title: 'Silver transformation', description: 'Clean nulls, cast types, deduplicate, and apply SCD Type 2 for customer data.', code: `from delta.tables import DeltaTable
from pyspark.sql.functions import col, to_date, trim, upper, row_number
from pyspark.sql.window import Window

# Deduplicate and cast types
silver_df = (
    spark.table("bronze.sales_raw")
    .filter(col("order_id").isNotNull())
    .withColumn("order_date", to_date(col("order_date"), "yyyy-MM-dd"))
    .withColumn("amount", col("amount").cast("double"))
    .withColumn("store_id", col("store_id").cast("int"))
    .dropDuplicates(["order_id"])
)

# MERGE into Silver Delta table (upsert)
delta_table = DeltaTable.forName(spark, "silver.sales")
delta_table.alias("target").merge(
    silver_df.alias("source"),
    "target.order_id = source.order_id"
).whenMatchedUpdateAll().whenNotMatchedInsertAll().execute()` },
      { step: 4, title: 'Gold aggregation layer', description: 'Build daily and monthly aggregations for BI consumption, optimized with Z-ORDER.', code: `from pyspark.sql.functions import sum, count, avg, date_trunc

# Daily sales gold table
daily_sales = (
    spark.table("silver.sales")
    .groupBy("store_id", "order_date", "product_category")
    .agg(
        sum("amount").alias("total_revenue"),
        count("order_id").alias("order_count"),
        avg("amount").alias("avg_order_value")
    )
)

daily_sales.write.format("delta").mode("overwrite").saveAsTable("gold.daily_sales")

# Optimize for BI query patterns
spark.sql("OPTIMIZE gold.daily_sales ZORDER BY (order_date, store_id)")
spark.sql("ANALYZE TABLE gold.daily_sales COMPUTE STATISTICS FOR ALL COLUMNS")` },
      { step: 5, title: 'ADF orchestration pipeline', description: 'Schedule the end-to-end pipeline with ADF: trigger file arrival → Bronze → Silver → Gold.', code: `// ADF Pipeline JSON excerpt
{
  "activities": [
    { "name": "RunBronzeNotebook", "type": "DatabricksNotebook",
      "typeProperties": { "notebookPath": "/pipelines/01_bronze_ingest" }},
    { "name": "RunSilverNotebook", "type": "DatabricksNotebook",
      "dependsOn": [{ "activity": "RunBronzeNotebook", "dependencyConditions": ["Succeeded"] }],
      "typeProperties": { "notebookPath": "/pipelines/02_silver_transform" }},
    { "name": "RunGoldNotebook", "type": "DatabricksNotebook",
      "dependsOn": [{ "activity": "RunSilverNotebook", "dependencyConditions": ["Succeeded"] }],
      "typeProperties": { "notebookPath": "/pipelines/03_gold_aggregate" }}
  ]
}` },
    ],
    sampleData: {
      description: 'Retail sales transactions with store, product, and customer dimensions.',
      tables: [
        { name: 'sales_raw', columns: ['order_id', 'store_id', 'customer_id', 'product_id', 'amount', 'quantity', 'order_date', 'status'] },
        { name: 'customers', columns: ['customer_id', 'name', 'email', 'city', 'segment', 'created_at'] },
        { name: 'products', columns: ['product_id', 'name', 'category', 'price', 'supplier_id'] },
      ],
      sampleRows: [
        { order_id: 'ORD-001', store_id: 5, amount: 142.50, order_date: '2024-01-15', status: 'completed' },
        { order_id: 'ORD-002', store_id: 12, amount: 89.99, order_date: '2024-01-15', status: 'completed' },
        { order_id: 'ORD-003', store_id: 5, amount: 234.00, order_date: '2024-01-16', status: 'returned' },
      ],
    },
    interviewQuestions: [
      'How would you handle late-arriving data in your Bronze layer?',
      'Why did you choose SCD Type 2 over Type 1 for customer data?',
      'What would you do if the Silver MERGE operation starts running slow?',
      'How do you ensure idempotency in your Bronze ingestion?',
      'Explain OPTIMIZE and ZORDER — when would you use each?',
    ],
    resumePoints: [
      'Designed and implemented end-to-end medallion architecture lakehouse processing 50+ store transaction feeds',
      'Reduced daily reporting latency from 2 days to <1 hour using Auto Loader with incremental processing',
      'Implemented SCD Type 2 for customer dimension with Delta MERGE upsert patterns',
      'Optimized Gold layer queries by 60% using Z-ORDER clustering and table statistics',
      'Orchestrated multi-notebook Databricks pipeline with ADF dependency management and alerting',
    ],
    challenges: [
      'Schema drift when source CSV columns change — solved with Auto Loader schemaEvolutionMode',
      'Duplicate orders in raw data due to re-delivery — solved with window deduplication on ingestion',
      'Skewed store data (3 stores have 60% of volume) — solved with AQE enabled and salting on store_id',
    ],
    productionConsiderations: [
      'Enable table ACLs in Unity Catalog for PII column masking on customer data',
      'Set up Delta table retention policy — VACUUM every 7 days, keep 30-day history for rollback',
      'Monitor cluster utilization with Databricks dashboards — right-size nodes for cost',
      'Add data quality alerting: alert if daily_sales count drops >20% vs prior day (indicates pipeline failure)',
      'Implement Blue/Green deployment for schema-breaking Gold table changes',
    ],
    ingestionStrategy: 'Daily batch via ADF trigger on file arrival. Auto Loader in cloudFiles mode detects new CSV drops in ADLS raw container and ingests incrementally into Bronze Delta tables. Schema evolution mode handles new source columns without breaking downstream jobs.',
    cicdStrategy: 'Databricks Asset Bundles (DABs) deploy notebooks via Git-triggered Azure DevOps pipelines. Pre-production catalog mirrors production with synthetic data. Quality gate: Silver row count must be ≥95% of Bronze count within 1 hour of run completion.',
    costOptimization: [
      'Use Spot instances for Bronze and Silver notebooks — only Gold uses on-demand to prevent SLA breach during business hours',
      'Schedule OPTIMIZE/VACUUM during off-peak (02:00–04:00) to avoid competing with pipeline reads',
      'Photon-enabled clusters for Gold aggregation — typically 2-3x faster for aggregate queries at same DBU cost',
      'Set cluster auto-termination to 15 minutes — nightly pipeline completes in ~40 min, cluster idles otherwise',
    ],
    securityConsiderations: [
      'Unity Catalog column masking on customer PII (email, phone) — visible only to "data-privacy" group',
      'ADLS containers behind private endpoints — no public internet access to storage',
      'Service Principal with Key Vault for all Databricks-ADLS connections — no hardcoded credentials',
      'Audit logging in Unity Catalog — alert on unusual access volumes or off-hours queries',
    ],
    interviewTalkingPoints: [
      {
        question: 'How would you handle late-arriving data in your Bronze layer?',
        answer: 'Auto Loader with cloudFiles format uses a checkpoint to track which files have been processed. For late files, I rely on the append-only Bronze pattern — any file that arrives later still gets processed on the next trigger run. The key is that Silver uses a MERGE on order_id, so a late-arriving record for an existing order_id updates rather than duplicates. If the business requires a hard SLA (e.g., files older than 2 days must be rejected), I add a metadata filter on _ingested_at in Silver.',
        followUps: [
          'How does Auto Loader know which files it already processed?',
          'What if a late file contains corrections to previously ingested data?',
          'How would you alert on unexpectedly late files?',
        ],
      },
      {
        question: 'Why did you choose SCD Type 2 over Type 1 for customer data?',
        answer: 'SCD Type 2 preserves historical customer state — if a customer changed their city, orders from 6 months ago should reflect where they lived then, not where they live now. This matters for sales territory analysis and regional reporting. Type 1 would silently overwrite history and corrupt historical aggregations. The trade-off is storage and query complexity: Gold joins need to handle date-range lookups to find the correct customer version for each order date.',
        followUps: [
          'How do you implement the date-range lookup in your Gold joins?',
          'When would you choose SCD Type 1 instead?',
          'How do you handle SCD Type 2 with Delta MERGE?',
        ],
      },
      {
        question: 'What would you do if the Silver MERGE operation starts running slow?',
        answer: 'First, I check the Spark UI for skew — if most task time is in a few tasks, the MERGE is hitting a hot join key. Second, I check for small file problems on the Silver Delta table using DESCRIBE DETAIL — too many small files causes slow scan during MERGE. Fix: run OPTIMIZE before the MERGE or switch to a partitioned merge that only touches the relevant date partition. Third, I look at the merge condition — a full table scan happens if the join predicate is on a non-partitioned column.',
        followUps: [
          'How do you partition a Delta table to speed up MERGE?',
          'What is the difference between a full-table merge and a partition-scoped merge?',
          'How does AQE help with MERGE performance?',
        ],
      },
      {
        question: 'How do you ensure idempotency in your Bronze ingestion?',
        answer: 'Auto Loader uses a checkpoint directory to track processed files — rerunning the pipeline will skip already-processed files. The Bronze table uses append mode, so any duplicate processing would create duplicate records. To prevent this, I add a MERGE in Bronze that deduplicates on the source file path and ingestion timestamp, or I use the trigger(availableNow=True) pattern which auto-checkpoints and will not reprocess files. Silver has a separate MERGE on the business key (order_id) as a second layer of dedup protection.',
        followUps: [
          'What happens if you delete the checkpoint directory by accident?',
          'How does availableNow trigger differ from once trigger?',
          'How would you test idempotency in a CI pipeline?',
        ],
      },
      {
        question: 'Explain OPTIMIZE and ZORDER — when would you use each?',
        answer: 'OPTIMIZE compacts small files into large files (targeting ~1GB each), which reduces the number of file operations during reads. It should run on any Delta table that receives many small writes — like Auto Loader ingestion or streaming appends. ZORDER is a data clustering technique that co-locates related rows in the same files based on a column value. It speeds up queries with WHERE or JOIN filters on the Z-ordered column by allowing Delta to skip irrelevant files using file-level statistics. Use ZORDER on the columns most frequently used in query filters — for a sales table, that is typically order_date and store_id.',
        followUps: [
          'What is the difference between ZORDER and partitioning?',
          'When would you use Liquid Clustering instead of ZORDER?',
          'How do you know if ZORDER is actually being used by the query planner?',
        ],
      },
    ],
    seniorNotes: {
      juniorsMiss: [
        'Auto Loader schema inference can silently change column types between runs if source files are inconsistent — always specify schemaHints or use a fixed schema for critical columns',
        'The Bronze MERGE dedup step is not free — on large datasets it causes a full table scan. Many engineers skip it and rely only on Silver dedup, which is often the right call',
        'VACUUM with a retention period shorter than your longest running query will cause "No snapshot found" errors in concurrent readers — the default 7-day retention exists for a reason',
        'Z-ORDER on a low-cardinality column (like store_id with 50 values) provides minimal benefit — it works best for high-cardinality columns like date or customer_id',
      ],
      productionRealities: [
        'Source CSV files will occasionally arrive with different column orderings or extra columns — schema enforcement without evolution mode will fail the entire pipeline at 2am',
        'Delta OPTIMIZE ZORDER is a full rewrite of all affected files — running it on a 1TB table takes hours and blocks concurrent writes',
        'SCD Type 2 MERGE logic doubles in complexity when source systems send partial updates (only changed fields, not full rows) — you need to handle null-preservation explicitly',
        'ADF dependency chains can get into states where a failed activity leaves downstream activities in "waiting" forever if timeout is not configured — always set activity-level timeouts',
      ],
      interviewersFocus: 'Senior interviewers want to see you understand the trade-offs between ingestion patterns, not just that you know how to write the code. They will ask why you chose Auto Loader over ADF Copy Activity, why SCD2 over a simpler merge, and how you handle the operational realities: schema drift, VACUUM conflicts, and late data. The strongest signal is being able to say "I chose X over Y because of Z constraint" rather than presenting a single approach as the universal answer.',
    },
  },

  {
    id: 'incremental-etl',
    title: 'Incremental ETL Pipeline',
    icon: '🔄',
    difficulty: 'Intermediate',
    duration: '1–2 days',
    tools: ['Python', 'SQLite/PostgreSQL', 'pandas', 'logging', 'schedule'],
    tags: ['ETL', 'Incremental', 'Python', 'Idempotent'],
    overview: 'Build a robust Python-based incremental ETL pipeline that extracts only changed records using a high-watermark pattern, transforms data with business rules, and loads into a target database — fully idempotent and restartable.',
    businessProblem: 'A company needs to sync data from an OLTP PostgreSQL database to an analytics database nightly. Full table copies take 4+ hours and cause source database load. An incremental pipeline should process only changed records and complete in under 15 minutes.',
    architecture: {
      description: 'Python ETL with high-watermark tracking, modular extract/transform/load functions, and structured logging.',
      layers: [
        { name: 'Extract', color: '#3776ab', description: 'Query source DB with watermark filter. Track last_modified timestamp in state table.' },
        { name: 'Transform', color: '#7c3aed', description: 'Apply business rules: type casting, null handling, derived columns, validation.' },
        { name: 'Load', color: '#2f756e', description: 'UPSERT into target with ON CONFLICT DO UPDATE. Commit only after successful validation.' },
      ],
      components: ['Source PostgreSQL', 'Python ETL Script', 'State Store (SQLite)', 'Target Analytics DB', 'Log file + alerts'],
    },
    steps: [
      { step: 1, title: 'Watermark tracking', description: 'Persist the last-run timestamp in a state table for incremental extraction.', code: `import sqlite3
from datetime import datetime

def get_watermark(state_db: str, table: str) -> str:
    conn = sqlite3.connect(state_db)
    row = conn.execute(
        "SELECT watermark FROM etl_state WHERE table_name = ?", (table,)
    ).fetchone()
    conn.close()
    return row[0] if row else "1970-01-01 00:00:00"

def set_watermark(state_db: str, table: str, ts: str):
    conn = sqlite3.connect(state_db)
    conn.execute("""
        INSERT INTO etl_state (table_name, watermark, updated_at)
        VALUES (?, ?, ?) ON CONFLICT(table_name) DO UPDATE
        SET watermark = excluded.watermark, updated_at = excluded.updated_at
    """, (table, ts, datetime.utcnow().isoformat()))
    conn.commit()
    conn.close()` },
      { step: 2, title: 'Incremental extract', description: 'Extract only rows modified since the last watermark.', code: `import pandas as pd
import sqlalchemy
import logging

logger = logging.getLogger(__name__)

def extract(conn_str: str, table: str, watermark: str) -> pd.DataFrame:
    engine = sqlalchemy.create_engine(conn_str)
    query = f"""
        SELECT * FROM {table}
        WHERE last_modified > :watermark
        ORDER BY last_modified ASC
    """
    df = pd.read_sql(query, engine, params={"watermark": watermark})
    logger.info(f"Extracted {len(df)} rows from {table} since {watermark}")
    return df` },
      { step: 3, title: 'Transform with validation', description: 'Apply business rules and validate data quality before loading.', code: `def transform(df: pd.DataFrame) -> pd.DataFrame:
    if df.empty:
        return df
    # Type casting
    df["amount"] = pd.to_numeric(df["amount"], errors="coerce")
    df["order_date"] = pd.to_datetime(df["order_date"], errors="coerce")
    # Derived columns
    df["amount_usd"] = (df["amount"] / df["exchange_rate"]).round(2)
    df["year_month"] = df["order_date"].dt.to_period("M").astype(str)
    # Quality gates
    invalid = df[df["amount"].isna() | df["order_date"].isna()]
    if len(invalid) > 0:
        logger.warning(f"{len(invalid)} rows failed validation — quarantined")
        df = df.dropna(subset=["amount", "order_date"])
    return df` },
      { step: 4, title: 'Idempotent load (UPSERT)', description: 'Load with ON CONFLICT UPDATE so reruns do not duplicate data.', code: `from sqlalchemy.dialects.postgresql import insert

def load(df: pd.DataFrame, engine, table: str, pk: str) -> int:
    if df.empty:
        return 0
    records = df.to_dict(orient="records")
    stmt = insert(table_meta).values(records)
    stmt = stmt.on_conflict_do_update(
        index_elements=[pk],
        set_={c: stmt.excluded[c] for c in df.columns if c != pk}
    )
    with engine.begin() as conn:
        result = conn.execute(stmt)
    logger.info(f"Upserted {result.rowcount} rows into {table}")
    return result.rowcount` },
    ],
    sampleData: {
      description: 'Orders table with last_modified timestamp for incremental tracking.',
      tables: [
        { name: 'orders', columns: ['order_id', 'customer_id', 'amount', 'exchange_rate', 'order_date', 'status', 'last_modified'] },
        { name: 'etl_state', columns: ['table_name', 'watermark', 'rows_processed', 'updated_at'] },
      ],
      sampleRows: [
        { order_id: 1001, amount: 150.00, status: 'completed', last_modified: '2024-01-16 09:23:11' },
        { order_id: 1002, amount: 89.50, status: 'processing', last_modified: '2024-01-16 09:45:00' },
      ],
    },
    interviewQuestions: [
      'How do you handle records that were updated after you read but before you set the watermark?',
      'What happens if the pipeline crashes mid-run? How do you recover without duplicates?',
      'How would you scale this pipeline to handle 100M rows per day?',
      'What are the trade-offs between watermark-based vs CDC-based incremental patterns?',
      'How do you test an ETL pipeline without affecting production data?',
    ],
    resumePoints: [
      'Designed idempotent Python ETL pipeline with high-watermark incremental extraction',
      'Reduced nightly data sync from 4+ hours to 12 minutes by eliminating full table scans',
      'Implemented UPSERT load pattern ensuring zero data duplication on pipeline reruns',
      'Added data quality validation layer quarantining bad records to separate table for review',
    ],
    challenges: [
      'Clock skew between source DB servers causing missed records — solved with 5-minute overlap window',
      'Large transactions updating same row multiple times within extraction window — solved with MAX(last_modified) dedup',
      'Memory pressure on large daily batches — solved with chunked extraction using pd.read_sql chunksize',
    ],
    productionConsiderations: [
      'Use database read replica for extraction to avoid impacting OLTP production load',
      'Add structured logging with correlation IDs for end-to-end pipeline tracing',
      'Implement dead-letter queue for validation failures to prevent data loss',
      'Set up alerting on row count anomalies: alert if < 100 rows or > 500K rows extracted (indicates issues)',
    ],
    ingestionStrategy: 'High-watermark incremental extraction from source PostgreSQL OLTP database. State table persists last-processed timestamp. Extraction window includes a 5-minute overlap to handle clock skew between DB servers. Full load only on first run; all subsequent runs are incremental.',
    cicdStrategy: 'Python ETL deployed as Azure Container Instance via Azure DevOps CI pipeline. Unit tests run against SQLite in-memory DB. Integration tests run against a restore of a production DB snapshot in staging. Deployment gated on >95% test coverage and zero integration test failures.',
    costOptimization: [
      'Run against read replica instead of primary — avoids OLTP load impact and the replica is typically idle during ETL window',
      'Chunked extraction with pd.read_sql chunksize=10000 prevents peak memory spikes — allows use of smaller, cheaper compute',
      'Schedule during off-peak hours (01:00–04:00) when source DB has minimal active connections',
    ],
    securityConsiderations: [
      'Connection strings stored in Azure Key Vault — never in environment variables, config files, or code',
      'Read-only DB user for extraction — service account has SELECT privilege only, no write access to source',
      'TLS required for all DB connections — reject_unauthorized=true, no self-signed certs in production',
      'Target DB credentials rotated every 90 days via automated Key Vault rotation policy',
    ],
    interviewTalkingPoints: [
      {
        question: 'How do you handle records updated after you read but before you set the watermark?',
        answer: 'This is the classic "watermark race" problem. Records updated in the gap between extraction start and watermark write will have a last_modified timestamp after the watermark, so they will be picked up in the next run. The 5-minute overlap window I use provides an extra safety margin — I subtract 5 minutes from the actual last-run time when querying, so any edge cases in the gap get re-extracted. Since the load is an UPSERT (ON CONFLICT DO UPDATE), re-extracting a record that was already processed just produces an idempotent update.',
        followUps: [
          'What if a record is updated multiple times within your extraction window?',
          'How does CDC differ from watermark-based extraction for handling this problem?',
          'What is the impact of setting the overlap window too large?',
        ],
      },
      {
        question: 'What are the trade-offs between watermark-based and CDC-based incremental patterns?',
        answer: 'Watermark requires a last_modified column on the source — not all tables have one, and some updates happen without touching that column (e.g., a trigger or direct DB update). Watermark also cannot detect hard deletes. CDC using Debezium captures every row-level change including deletes, and works without modifying the source schema. The trade-offs are operational: CDC requires enabling WAL on the source DB, deploying and maintaining Kafka and Debezium infrastructure, and managing connector restarts. For a simple nightly ETL of a well-controlled source, watermark is much simpler. For real-time replication with delete propagation, CDC is the right answer.',
        followUps: [
          'How would you propagate soft deletes vs hard deletes with a watermark pattern?',
          'What happens to your CDC pipeline if Kafka goes down for 24 hours?',
          'How do you handle the initial full load when switching from watermark to CDC?',
        ],
      },
      {
        question: 'How would you scale this pipeline to handle 100M rows per day?',
        answer: 'At 100M rows/day, the bottleneck shifts from network to memory and single-threaded Python. I would move to chunked parallel extraction using multiple worker processes, each responsible for a range partition of the data (e.g., by customer_id or date bucket). I would replace pandas with Polars for significantly faster transforms, or move the pipeline to PySpark for native parallelism. The UPSERT load would need a batch insert approach — PostgreSQL COPY command with conflict resolution is 10-50x faster than row-by-row inserts. The state table would track completion per partition rather than a single global watermark.',
        followUps: [
          'How do you handle partition skew where some ranges have 10x the data of others?',
          'What monitoring would you add to detect bottlenecks across 100+ parallel workers?',
          'When would you choose Spark over a distributed Python approach?',
        ],
      },
      {
        question: 'What happens if the pipeline crashes mid-run? How do you recover without duplicates?',
        answer: 'The watermark is only updated after a successful load — if the pipeline crashes during extraction or load, the watermark stays at the previous value and the next run re-extracts the same window. Because the load uses UPSERT (ON CONFLICT DO UPDATE), any records that were partially loaded before the crash are safely overwritten with the same values. The pipeline is idempotent by design: running it twice produces the same result as running it once. The only edge case is a crash after load but before watermark update — I handle this by writing the new watermark inside the same database transaction as the load commit.',
        followUps: [
          'How do you handle a crash during a chunked multi-batch load?',
          'What is the difference between idempotent and exactly-once semantics?',
          'How would you implement rollback if the load partially fails?',
        ],
      },
      {
        question: 'How do you test an ETL pipeline without affecting production data?',
        answer: 'I use three levels of testing. Unit tests run against SQLite in-memory with fixture data — fast, no external dependencies. Integration tests run against a restored production snapshot in a staging environment — these catch schema differences, encoding issues, and volume-related bugs that unit tests miss. End-to-end smoke tests in production run against a single known test record (a synthetic row in the source DB) — this validates the production credentials, network, and permissions without touching real data. The key constraint is that each test level must be independently runnable and not require the others to pass first.',
        followUps: [
          'How do you handle PII in test data from production snapshots?',
          'What would you mock vs what would you test against a real database?',
          'How do you generate realistic volume for integration tests?',
        ],
      },
    ],
    seniorNotes: {
      juniorsMiss: [
        'The overlap window solves clock skew but introduces a guaranteed re-processing of records in the overlap period — the UPSERT pattern must be truly idempotent for this to be safe',
        'pd.read_sql without chunksize loads the entire result set into memory before returning — on large tables this causes OOM, not a slow query',
        'The state table must be in the same DB transaction as the load — writing watermark separately creates a window where a crash leaves you with a committed load but an un-advanced watermark, causing re-processing',
        'Adding a new column to the target table requires a migration script — many engineers forget this and the pipeline silently drops the new column from transformed data',
      ],
      productionRealities: [
        'Source DB indexes on last_modified get bloated over time as all updates touch the index — this causes your watermark query to slow down even though it is fetching fewer rows',
        'The UPSERT performance degrades significantly when the ON CONFLICT target table has multiple indexes — each upsert must check all indexes',
        'Chunked reads with ORDER BY last_modified can miss records if two transactions have the same timestamp and your chunk boundary splits them — use a deterministic secondary sort (e.g., ORDER BY last_modified, id)',
        'Running against a read replica is safe only if replication lag is consistently below your extraction window — verify this assumption with monitoring before relying on it',
      ],
      interviewersFocus: 'This project signals whether you understand the reliability contract of an ETL pipeline. Interviewers care about idempotency, failure recovery, and the specific constraints of watermark-based patterns. The follow-up questions will probe whether you understand WHY the UPSERT must come before the watermark update, not just that it should. The most differentiating answer demonstrates you have thought about failure modes end-to-end, not just the happy path.',
    },
  },

  {
    id: 'cdc-pipeline',
    title: 'CDC Pipeline',
    icon: '📡',
    difficulty: 'Advanced',
    duration: '2–3 days',
    tools: ['Debezium', 'Kafka', 'PySpark Streaming', 'Delta Lake', 'PostgreSQL'],
    tags: ['CDC', 'Kafka', 'Streaming', 'Real-time'],
    overview: 'Implement Change Data Capture (CDC) from a PostgreSQL source using Debezium and Kafka. Stream insert/update/delete events into a Delta Lake Silver table with exactly-once semantics.',
    businessProblem: 'A financial services company needs real-time replication of transaction data from their core banking PostgreSQL database to their analytics lakehouse. Traditional ETL runs hourly — the business needs sub-minute latency for fraud detection and risk reporting.',
    architecture: {
      description: 'Debezium captures WAL changes from PostgreSQL, publishes to Kafka, Spark Structured Streaming consumes and writes to Delta.',
      layers: [
        { name: 'Source', color: '#336791', description: 'PostgreSQL with WAL (Write-Ahead Log) enabled. Debezium connector captures row-level changes.' },
        { name: 'Transport', color: '#231f20', description: 'Kafka topic per table. Each event contains before/after state plus operation type (c/u/d).' },
        { name: 'Processing', color: '#e25a1c', description: 'Spark Structured Streaming applies MERGE for upserts/deletes into Delta Silver table.' },
      ],
      components: ['PostgreSQL (WAL)', 'Debezium Connector', 'Kafka', 'Kafka Connect', 'Spark Streaming', 'Delta Lake', 'ADLS'],
    },
    steps: [
      { step: 1, title: 'Configure PostgreSQL for CDC', description: 'Enable logical replication in PostgreSQL to expose WAL changes to Debezium.', code: `-- postgresql.conf changes:
-- wal_level = logical
-- max_replication_slots = 5
-- max_wal_senders = 5

-- Create replication slot
SELECT pg_create_logical_replication_slot('debezium', 'pgoutput');

-- Create publication for CDC
CREATE PUBLICATION dbz_publication FOR TABLE transactions, accounts;

-- Grant replication privileges
CREATE USER debezium REPLICATION LOGIN PASSWORD 'secret';
GRANT SELECT ON ALL TABLES IN SCHEMA public TO debezium;` },
      { step: 2, title: 'Deploy Debezium connector', description: 'Configure Debezium PostgreSQL connector to publish change events to Kafka.', code: `// Debezium connector config (POST to Kafka Connect REST API)
{
  "name": "transactions-cdc",
  "config": {
    "connector.class": "io.debezium.connector.postgresql.PostgresConnector",
    "database.hostname": "postgres-host",
    "database.port": "5432",
    "database.user": "debezium",
    "database.password": "\${DB_PASSWORD}",
    "database.dbname": "banking",
    "database.server.name": "banking",
    "table.include.list": "public.transactions",
    "plugin.name": "pgoutput",
    "publication.name": "dbz_publication",
    "transforms": "unwrap",
    "transforms.unwrap.type": "io.debezium.transforms.ExtractNewRecordState",
    "transforms.unwrap.add.fields": "op,ts_ms",
    "key.converter": "org.apache.kafka.connect.json.JsonConverter",
    "value.converter": "org.apache.kafka.connect.json.JsonConverter"
  }
}` },
      { step: 3, title: 'Spark Streaming consumer', description: 'Consume CDC events from Kafka and apply MERGE to Delta Silver table.', code: `from pyspark.sql.functions import col, from_json, when
from pyspark.sql.types import StructType, StructField, StringType, DoubleType, TimestampType
from delta.tables import DeltaTable

schema = StructType([
    StructField("transaction_id", StringType()),
    StructField("account_id", StringType()),
    StructField("amount", DoubleType()),
    StructField("status", StringType()),
    StructField("ts_ms", StringType()),
    StructField("__op", StringType()),  # c=create, u=update, d=delete
])

kafka_df = (spark.readStream
    .format("kafka")
    .option("kafka.bootstrap.servers", KAFKA_BROKERS)
    .option("subscribe", "banking.public.transactions")
    .option("startingOffsets", "earliest")
    .load()
    .select(from_json(col("value").cast("string"), schema).alias("data"))
    .select("data.*")
)

def process_batch(batch_df, batch_id):
    delta_table = DeltaTable.forName(spark, "silver.transactions")
    upserts = batch_df.filter(col("__op").isin(["c", "u"]))
    deletes = batch_df.filter(col("__op") == "d")

    if upserts.count() > 0:
        delta_table.alias("t").merge(
            upserts.alias("s"), "t.transaction_id = s.transaction_id"
        ).whenMatchedUpdateAll().whenNotMatchedInsertAll().execute()

    if deletes.count() > 0:
        delta_table.alias("t").merge(
            deletes.alias("s"), "t.transaction_id = s.transaction_id"
        ).whenMatchedDelete().execute()

(kafka_df.writeStream
    .foreachBatch(process_batch)
    .option("checkpointLocation", "/mnt/checkpoints/cdc-transactions")
    .trigger(processingTime="30 seconds")
    .start()
)` },
    ],
    sampleData: {
      description: 'Banking transactions with Debezium CDC envelope structure.',
      tables: [
        { name: 'transactions', columns: ['transaction_id', 'account_id', 'amount', 'currency', 'type', 'status', 'created_at', 'updated_at'] },
      ],
      sampleRows: [
        { transaction_id: 'TXN-9901', __op: 'c', amount: 500.00, status: 'pending', ts_ms: '1705401600000' },
        { transaction_id: 'TXN-9901', __op: 'u', amount: 500.00, status: 'cleared', ts_ms: '1705401900000' },
      ],
    },
    interviewQuestions: [
      'What is WAL and how does Debezium use it to capture changes?',
      'How do you handle schema changes in the source PostgreSQL table?',
      'What happens to your streaming pipeline if Kafka is unavailable for 2 hours?',
      'Explain exactly-once semantics in Spark Structured Streaming with Kafka.',
      'How would you handle duplicate events from Kafka (at-least-once delivery)?',
    ],
    resumePoints: [
      'Implemented sub-minute CDC pipeline using Debezium, Kafka, and Spark Streaming for core banking replication',
      'Achieved <30 second end-to-end latency from PostgreSQL WAL change to Delta Lake Silver table',
      'Handled insert/update/delete events with idempotent MERGE operations in Delta Lake',
      'Configured checkpointing and exactly-once semantics for fault-tolerant streaming pipeline',
    ],
    challenges: [
      'Kafka consumer lag during backfill of historical data — solved with separate backfill job and separate consumer group',
      'Out-of-order CDC events for rapid update sequences — solved with event timestamp ordering in MERGE logic',
      'Debezium connector offset reset after cluster restart — solved with persistent offset storage in Kafka',
    ],
    productionConsiderations: [
      'Monitor Debezium connector lag with Kafka consumer group lag metrics',
      'Set Kafka retention period to at least 7 days to allow consumer re-processing',
      'Implement dead-letter topic for unparseable messages to prevent pipeline stalls',
      'Use Kafka Schema Registry with Avro to enforce schema compatibility and prevent schema drift',
    ],
    ingestionStrategy: 'Real-time CDC via Debezium PostgreSQL connector reading WAL (Write-Ahead Log). Every row-level INSERT, UPDATE, and DELETE is published as a structured event to a dedicated Kafka topic. Spark Structured Streaming consumes with 30-second micro-batches and applies MERGE into Delta Silver — sub-minute end-to-end latency.',
    cicdStrategy: 'Debezium connector config stored in Git and deployed via Kafka Connect REST API in CI/CD. Spark Streaming job packaged as Docker image, deployed to AKS. Blue/green deployment: new version runs in parallel, Kafka consumer group offset comparison validates no message loss before old version is terminated.',
    costOptimization: [
      'Kafka retention set to 7 days — enough for re-processing but avoids unbounded storage growth',
      'Spark Structured Streaming with 30-second micro-batches hits a good throughput/latency trade-off; continuous mode costs more compute for marginal latency gain',
      'Compact Kafka topics for non-event tables (reference data) — only the latest value per key is retained, reducing storage',
    ],
    securityConsiderations: [
      'Debezium replication user has minimal privileges — REPLICATION LOGIN and SELECT only, no DDL or write access',
      'Kafka ACLs restrict producer and consumer access per topic — Debezium can only produce to its designated topics',
      'Kafka traffic encrypted with TLS in transit; Kafka broker credentials stored in Azure Key Vault',
      'Debezium snapshots excluded from public network — Kafka Connect deployed in private VNet subnet',
    ],
    interviewTalkingPoints: [
      {
        question: 'What is WAL and how does Debezium use it to capture changes?',
        answer: 'The Write-Ahead Log (WAL) is PostgreSQL\'s durability mechanism — before any change is committed to the data files, it is written to the WAL. Debezium acts as a logical replication client: it creates a replication slot that causes PostgreSQL to retain WAL segments until Debezium confirms it has read them. Debezium then parses the WAL entries and converts each row-level change into a structured event (with before/after state and operation type) published to Kafka. The replication slot ensures no changes are lost even if Debezium is temporarily offline.',
        followUps: [
          'What happens to WAL disk usage if Debezium falls behind or goes offline for days?',
          'How does a replication slot differ from a subscription in PostgreSQL logical replication?',
          'What is the difference between logical and physical replication in PostgreSQL?',
        ],
      },
      {
        question: 'How do you handle schema changes in the source PostgreSQL table?',
        answer: 'Debezium captures DDL changes in the WAL alongside DML. When a column is added to the source table, Debezium\'s Avro schema in the Schema Registry gets a new version with backward compatibility enforced. The Spark consumer uses schema evolution to handle the new field. The risk is breaking changes — dropping or renaming a column. For these, I rely on the Schema Registry compatibility check to block incompatible schema versions before they reach production. For intentional breaking changes, I use a blue/green topic swap: new schema goes to a v2 topic, old consumers continue draining v1 until the cutover.',
        followUps: [
          'What is Schema Registry and what compatibility modes does it support?',
          'How do you handle a column rename where old name and new name carry different semantics?',
          'How would you test a schema migration in a staging environment?',
        ],
      },
      {
        question: 'What happens if Kafka is unavailable for 2 hours?',
        answer: 'The Debezium replication slot continues accumulating WAL entries on the PostgreSQL side — this is the key advantage of the replication slot approach. PostgreSQL will not recycle those WAL segments until Debezium confirms it has read them. When Kafka comes back, Debezium resumes from where it left off. The risk is disk pressure on the PostgreSQL server — 2 hours of high-volume WAL can consume significant disk. I monitor replication slot lag as a metric and alert when it exceeds 30 minutes so the on-call team can act before disk runs out. On the consumer side, Spark resumes from its committed Kafka offsets, so no data is lost there either.',
        followUps: [
          'How do you monitor replication slot lag in PostgreSQL?',
          'What is the impact on PostgreSQL performance when a replication slot has high lag?',
          'How would you force-drop a replication slot and what are the consequences?',
        ],
      },
      {
        question: 'Explain exactly-once semantics in Spark Structured Streaming with Kafka.',
        answer: 'Spark Structured Streaming achieves end-to-end exactly-once by combining checkpointing with idempotent sinks. The checkpoint stores the last committed Kafka offset and the last written batch ID to the sink. On restart, Spark replays from the last checkpoint — this guarantees at-least-once delivery from Kafka. The sink must be idempotent to convert at-least-once into exactly-once: Delta Lake MERGE operations are idempotent because a retry of the same batch produces the same final state. Without an idempotent sink (e.g., appending to a non-Delta table), you get at-least-once, not exactly-once.',
        followUps: [
          'What happens to exactly-once if the checkpoint is corrupted?',
          'How does the foreachBatch sink interact with the checkpoint mechanism?',
          'Can you achieve exactly-once with a non-idempotent external sink like a REST API?',
        ],
      },
      {
        question: 'How would you handle duplicate events from Kafka (at-least-once delivery)?',
        answer: 'Kafka guarantees at-least-once delivery by default — duplicate messages can occur during consumer group rebalances or broker failovers. My defense is at the sink layer: the Delta MERGE operation uses the business key (transaction_id) as the merge condition. A duplicate event for the same transaction_id with the same data produces an idempotent UPDATE that changes nothing. The only problematic case is a genuine duplicate with conflicting data — two different values for the same transaction_id. For that, I use event timestamp ordering: the MERGE only updates if the incoming event timestamp is newer than the stored value, using a conditional update with WHEN MATCHED AND source.ts_ms > target.ts_ms THEN UPDATE.',
        followUps: [
          'How does idempotent producer configuration on the Kafka client help?',
          'What is the difference between at-least-once and exactly-once at the Kafka level?',
          'How would you detect that duplicate events are occurring in production?',
        ],
      },
    ],
    seniorNotes: {
      juniorsMiss: [
        'Replication slots accumulate WAL indefinitely until Debezium confirms consumption — a stuck connector can fill your PostgreSQL disk and bring down the source database',
        'The Debezium "snapshot" (initial full load) locks source tables briefly and can take hours for large tables — always schedule snapshots in maintenance windows',
        'The before/after CDC event format means your Spark schema must handle nullable "before" fields (they are null for INSERT events) — many engineers only test with updates and miss the INSERT edge case',
        'Kafka consumer group rebalances happen when Spark executors are added or removed — during rebalance, no messages are processed, causing a latency spike visible in dashboards',
      ],
      productionRealities: [
        'PostgreSQL WAL logical decoding is CPU-intensive on the source — at high transaction rates, Debezium can add 5–15% CPU load to the source DB',
        'Out-of-order events occur when rapid updates to the same row are published in different Kafka partitions — the MERGE must handle this with an event-time comparison, not insertion order',
        'Debezium connectors occasionally get into a "zombie" state after a PostgreSQL failover — the connector thinks it is connected but receives no events; requires a restart to reconnect to the new primary',
        'Schema Registry compatibility checks can create deployment ordering dependencies — the Spark consumer schema must be updated before deploying a breaking Debezium schema change, or consumers will fail to deserialize events',
      ],
      interviewersFocus: 'Interviewers focus on whether you understand the operational risks of CDC, not just the happy-path architecture. The replication slot disk accumulation risk is a famous production incident at multiple companies. The most credible answers connect architecture decisions to operational consequences: "I chose a replication slot over polling because X, and I mitigate the disk risk by Y." Knowing the failure modes of each component — WAL retention, connector zombie state, Schema Registry conflicts — signals genuine production experience.',
    },
  },

  {
    id: 'api-ingestion',
    title: 'API Ingestion Workflow',
    icon: '🔌',
    difficulty: 'Beginner',
    duration: '1 day',
    tools: ['Python', 'requests', 'pandas', 'Azure Data Factory', 'ADLS Gen2'],
    tags: ['API', 'REST', 'Python', 'Ingestion'],
    overview: 'Build a production-grade REST API ingestion pipeline that handles pagination, authentication, rate limiting, and incremental loads — then lands JSON data into ADLS as Parquet.',
    businessProblem: 'A marketing team pulls data from a third-party analytics API daily using manual CSV exports. The process is error-prone and takes 2 hours. Automating it saves analyst time and enables near-real-time campaign performance monitoring.',
    architecture: {
      description: 'Python API client with retry logic, pagination handling, and Parquet output to ADLS.',
      layers: [
        { name: 'Extract', color: '#3776ab', description: 'Python requests client handles OAuth2, pagination, rate limiting, and retries.' },
        { name: 'Transform', color: '#7c3aed', description: 'Flatten nested JSON to tabular structure. Cast types. Add metadata columns.' },
        { name: 'Load', color: '#2f756e', description: 'Write Parquet files to ADLS partitioned by date. ADF Copy Activity for orchestration.' },
      ],
      components: ['REST API (OAuth2)', 'Python requests', 'pandas', 'ADLS Gen2', 'ADF HTTP connector', 'Azure Key Vault'],
    },
    steps: [
      { step: 1, title: 'Authenticated API client', description: 'Build a reusable API client with OAuth2 token refresh and exponential backoff.', code: `import requests
import time
import logging
from functools import wraps

logger = logging.getLogger(__name__)

class APIClient:
    def __init__(self, base_url: str, client_id: str, client_secret: str):
        self.base_url = base_url
        self.client_id = client_id
        self.client_secret = client_secret
        self._token = None
        self._token_expiry = 0

    def _get_token(self) -> str:
        if time.time() < self._token_expiry - 60:
            return self._token
        resp = requests.post(
            f"{self.base_url}/oauth/token",
            data={"grant_type": "client_credentials",
                  "client_id": self.client_id,
                  "client_secret": self.client_secret}
        )
        resp.raise_for_status()
        data = resp.json()
        self._token = data["access_token"]
        self._token_expiry = time.time() + data["expires_in"]
        return self._token

    def get(self, endpoint: str, params: dict = None, retries: int = 3) -> dict:
        for attempt in range(retries):
            try:
                headers = {"Authorization": f"Bearer {self._get_token()}"}
                resp = requests.get(f"{self.base_url}{endpoint}",
                                    headers=headers, params=params, timeout=30)
                if resp.status_code == 429:
                    wait = int(resp.headers.get("Retry-After", 2 ** attempt))
                    logger.warning(f"Rate limited, waiting {wait}s")
                    time.sleep(wait)
                    continue
                resp.raise_for_status()
                return resp.json()
            except requests.exceptions.RequestException as e:
                if attempt == retries - 1: raise
                time.sleep(2 ** attempt)` },
      { step: 2, title: 'Paginated extraction', description: 'Extract all pages of API data with cursor-based or offset pagination.', code: `def extract_all_pages(client: APIClient, endpoint: str,
                       date_from: str, date_to: str) -> list:
    all_records = []
    cursor = None
    page = 1

    while True:
        params = {"date_from": date_from, "date_to": date_to,
                  "limit": 1000, "cursor": cursor}
        data = client.get(endpoint, params={k: v for k, v in params.items() if v})

        records = data.get("data", [])
        all_records.extend(records)
        logger.info(f"Page {page}: fetched {len(records)} records (total: {len(all_records)})")

        cursor = data.get("next_cursor")
        if not cursor or not records:
            break
        page += 1

    logger.info(f"Extraction complete: {len(all_records)} total records")
    return all_records` },
      { step: 3, title: 'Flatten and write Parquet', description: 'Normalise nested JSON and write date-partitioned Parquet to ADLS.', code: `import pandas as pd
from pathlib import Path

def flatten_records(records: list) -> pd.DataFrame:
    df = pd.json_normalize(records, sep="_")
    df.columns = [c.lower().replace(".", "_") for c in df.columns]
    df["extracted_at"] = pd.Timestamp.utcnow()
    df["partition_date"] = pd.to_datetime(df["created_at"]).dt.date.astype(str)
    return df

def write_parquet_partitioned(df: pd.DataFrame, output_path: str):
    for date, group in df.groupby("partition_date"):
        path = f"{output_path}/date={date}/data.parquet"
        group.drop(columns="partition_date").to_parquet(path, index=False)
        logger.info(f"Written {len(group)} rows to {path}")` },
    ],
    sampleData: {
      description: 'Campaign performance API response with nested metrics.',
      tables: [
        { name: 'campaigns', columns: ['campaign_id', 'name', 'status', 'budget', 'metrics_impressions', 'metrics_clicks', 'metrics_conversions', 'created_at'] },
      ],
      sampleRows: [
        { campaign_id: 'C-001', name: 'Summer Sale', metrics_clicks: 4521, metrics_conversions: 234, created_at: '2024-01-15' },
        { campaign_id: 'C-002', name: 'Brand Awareness', metrics_clicks: 12043, metrics_conversions: 89, created_at: '2024-01-15' },
      ],
    },
    interviewQuestions: [
      'How do you handle API rate limits in a production pipeline?',
      'What is OAuth2 client credentials flow and when do you use it?',
      'How do you make your API ingestion idempotent?',
      'What would you do if an API starts returning schema changes (new/removed fields)?',
    ],
    resumePoints: [
      'Built production-grade REST API ingestion pipeline with OAuth2, pagination, and exponential backoff retry',
      'Automated daily campaign data extraction replacing 2-hour manual process with 8-minute automated pipeline',
      'Handled nested JSON flattening and Parquet output with date-based partitioning in ADLS Gen2',
    ],
    challenges: [
      'API returning different JSON shapes for different campaigns — solved with pd.json_normalize defensive flattening',
      'OAuth token expiry mid-paginated run — solved with proactive token refresh 60s before expiry',
    ],
    productionConsiderations: [
      'Store API credentials in Azure Key Vault — never in code or environment variables checked into Git',
      'Implement data freshness check: alert if no records extracted after expected window',
      'Cache token in memory and refresh proactively to avoid mid-run expiry failures',
    ],
    ingestionStrategy: 'Cursor-based paginated REST API extraction with OAuth2 client credentials flow. Token cached in memory and proactively refreshed 60 seconds before expiry. Each page limited to 1000 records; extraction continues until the API returns no next_cursor. Incremental: only the current day\'s data is re-fetched on each run using date_from/date_to parameters.',
    cicdStrategy: 'Containerised Python script deployed via Azure Container Instances, triggered by ADF on a schedule. CI pipeline runs pytest unit tests and a mock-server integration test on every PR. Deployment promoted to production only after staging validation against a live API sandbox environment.',
    costOptimization: [
      'ACI billing is per-second — a 10-minute daily extraction costs pennies vs a VM running 24/7',
      'Parquet with Snappy compression reduces ADLS storage cost by 60-70% vs raw JSON',
      'Batch API calls where the API supports it — reduces per-call overhead and rate limit consumption',
    ],
    securityConsiderations: [
      'API client credentials stored in Azure Key Vault — retrieved at runtime, never in environment variables or config files checked into Git',
      'Outbound-only network connectivity from ACI — no inbound ports, minimal attack surface',
      'Validate TLS certificate chain on all API calls — reject_unauthorized must be true; never disable cert validation',
      'Log only metadata (record count, timestamps), never raw API response payloads which may contain PII',
    ],
    interviewTalkingPoints: [
      {
        question: 'How do you handle API rate limits in a production pipeline?',
        answer: 'I implement three layers: reactive handling, proactive pacing, and adaptive backoff. Reactive: when the API returns 429, I read the Retry-After header and sleep exactly that duration. Proactive: I track how many calls I have made in the current window and pre-emptively sleep when approaching the limit. Adaptive backoff: for transient failures I use exponential backoff with jitter to avoid thundering herd when multiple pipelines hit the same API. The jitter is important — without it, all retrying clients wake up at the same time and immediately hit the rate limit again.',
        followUps: [
          'What is the thundering herd problem and how does jitter solve it?',
          'How would you handle an API that rate limits by IP vs by API key?',
          'How do you test rate limit handling without actually being rate limited?',
        ],
      },
      {
        question: 'How do you make your API ingestion idempotent?',
        answer: 'The extraction is idempotent by design: same date range always produces the same records from the API. The Parquet write uses a date-partitioned path where new files overwrite existing ones for the same partition date — not appended. If the pipeline crashes mid-run and restarts, it re-fetches the same day\'s data and overwrites the partial files with the complete dataset. The only case that breaks idempotency is the API itself changing what it returns for a past date range (late-arriving campaign data). For that I add a full historical re-pull option triggered manually when the API vendor confirms a correction.',
        followUps: [
          'How would you detect that an API vendor corrected historical data?',
          'What if the API paginates and new records are inserted between page 1 and page 5?',
          'How do you handle the case where the output path already has partial data from a crash?',
        ],
      },
      {
        question: 'What would you do if the API starts returning schema changes?',
        answer: 'pd.json_normalize handles most additive changes gracefully — new fields appear as new columns. The risk is dropped fields (now missing, previously expected) or type changes. I add a schema validation step after flattening: I assert that all required columns are present and that numeric fields are numeric. Failures go to a quarantine path rather than crashing the pipeline. For the team to be notified, I log a structured warning with the diff between expected and actual schema. Long-term, I use Pandera or Great Expectations for contract testing on the output DataFrame so schema regressions are caught before they propagate downstream.',
        followUps: [
          'What is contract testing and how does it differ from schema validation?',
          'How would you version your target Parquet schema to handle breaking API changes?',
          'When would you fail the pipeline vs quarantine and continue?',
        ],
      },
      {
        question: 'What is OAuth2 client credentials flow and when do you use it?',
        answer: 'Client credentials is the machine-to-machine OAuth2 flow where the application authenticates using its own client_id and client_secret — no user involvement. The application exchanges these credentials at the token endpoint for a short-lived access token. It is the correct flow for scheduled server-to-server API integrations where there is no human user in the loop. You use authorization code flow (with user redirect) when the API needs to act on behalf of a specific user. For a data pipeline extracting marketing analytics data, client credentials is always the right choice because the pipeline runs unattended.',
        followUps: [
          'How do you securely store and rotate client_secret in production?',
          'What is the difference between OAuth2 scopes and API permissions?',
          'What happens when the access token expires mid-pagination?',
        ],
      },
      {
        question: 'How would you extend this pipeline to support 50 different APIs?',
        answer: 'I would abstract the common behaviour — authentication, pagination, retry, Parquet output — into a base framework and define each API as a configuration file rather than code. The config specifies endpoint URL, auth type, pagination strategy (cursor/offset/page), response path to the data array, field mapping, and schedule. A generic runner loads the config and executes the extraction using the framework. New APIs require no code changes — only a new YAML config. This is the pattern behind commercial ingestion tools like Fivetran or Airbyte, and building it in-house makes sense when you need custom auth or transformation logic those tools do not support.',
        followUps: [
          'What are the trade-offs between building a custom framework vs using Fivetran?',
          'How would you handle APIs with fundamentally different pagination schemes?',
          'How do you test a configuration-driven framework?',
        ],
      },
    ],
    seniorNotes: {
      juniorsMiss: [
        'OAuth tokens have expiry — proactive refresh 60s before expiry prevents mid-pagination failures that are hard to debug',
        'json_normalize with nested arrays creates explosive column counts if not handled carefully — always inspect the output shape before writing to Parquet',
        'Cursor-based pagination can silently miss records if the API modifies data between pages — this is a known issue with most REST APIs and requires a reconciliation check',
        'Parquet files written with different pandas versions can be unreadable due to metadata format differences — pin your pandas and pyarrow versions in requirements.txt',
      ],
      productionRealities: [
        'Third-party APIs have unannounced maintenance windows, rate limit changes, and schema updates — build defensive handling for all three from day one',
        'Many marketing APIs do not backfill correctly — if a campaign event arrives late, it may only appear in the API response for the current day, not the historical day it occurred',
        'API sandbox environments often have different data volumes and rate limits than production — tests that pass in sandbox can fail immediately in production at scale',
        'The Retry-After header is often missing or inaccurate on 429 responses — implement a sensible default (e.g., exponential backoff starting at 5 seconds) when the header is absent',
      ],
      interviewersFocus: 'Interviewers use API ingestion projects to probe API design understanding, error handling depth, and production reliability thinking. The key differentiators are: understanding OAuth2 flow selection (not just "I use OAuth"), handling partial failures in paginated extractions, and knowing when to fail vs quarantine. Engineers who have built these in production can describe specific failures they encountered — an API that silently dropped pages, a rate limit that was undocumented, a schema change that broke downstream.',
    },
  },

  {
    id: 'medallion-project',
    title: 'Medallion Architecture Project',
    icon: '🥇',
    difficulty: 'Advanced',
    duration: '3–5 days',
    tools: ['Databricks', 'Delta Live Tables', 'Unity Catalog', 'ADLS Gen2', 'ADF', 'Power BI'],
    tags: ['Medallion', 'DLT', 'Unity Catalog', 'Governance'],
    overview: 'Implement a production medallion architecture using Databricks Delta Live Tables (DLT) with Unity Catalog governance, data quality constraints, and end-to-end lineage tracking.',
    businessProblem: 'A healthcare analytics company needs a governed data platform with full lineage, column-level security on PII, data quality enforcement, and reproducible pipelines. Ad-hoc notebooks have caused data quality incidents. DLT + Unity Catalog provides the governance layer needed for compliance.',
    architecture: {
      description: 'DLT declarative pipelines with Unity Catalog for governance, lineage, and access control.',
      layers: [
        { name: 'Bronze', color: '#cd7f32', description: 'DLT Auto Loader ingestion from ADLS. Streaming tables. Schema enforcement enabled.' },
        { name: 'Silver', color: '#c0c0c0', description: 'DLT materialized views with @dlt.expect quality constraints. Deduplication and enrichment.' },
        { name: 'Gold', color: '#ffd700', description: 'Aggregated DLT tables for analytics. Column masking on PII via Unity Catalog dynamic views.' },
      ],
      components: ['Auto Loader', 'DLT Pipelines', 'Unity Catalog', 'ADLS Gen2', 'Delta Lake', 'Power BI', 'Azure Purview'],
    },
    steps: [
      { step: 1, title: 'DLT Bronze streaming table', description: 'Define Auto Loader streaming table with schema hints and quality expectations.', code: `import dlt
from pyspark.sql.functions import col, current_timestamp

@dlt.table(
    name="bronze_patient_events",
    comment="Raw patient event stream from ADLS Auto Loader",
    table_properties={"quality": "bronze", "pipelines.reset.allowed": "false"}
)
@dlt.expect("valid_patient_id", "patient_id IS NOT NULL")
@dlt.expect("valid_event_type", "event_type IN ('admission', 'discharge', 'transfer', 'procedure')")
def bronze_patient_events():
    return (
        spark.readStream
        .format("cloudFiles")
        .option("cloudFiles.format", "json")
        .option("cloudFiles.inferColumnTypes", "true")
        .load("/mnt/raw/patient_events/")
        .withColumn("_loaded_at", current_timestamp())
    )` },
      { step: 2, title: 'DLT Silver with quality constraints', description: 'Apply data quality rules that quarantine bad records rather than failing the pipeline.', code: `@dlt.table(
    name="silver_patient_events",
    comment="Cleansed and validated patient events",
    table_properties={"quality": "silver"}
)
@dlt.expect_or_drop("valid_timestamp", "event_timestamp > '2020-01-01'")
@dlt.expect_or_drop("positive_duration", "duration_minutes > 0 OR duration_minutes IS NULL")
@dlt.expect("complete_demographics", "patient_age IS NOT NULL AND patient_gender IS NOT NULL",
            on_violation="WARN")
def silver_patient_events():
    return (
        dlt.read_stream("bronze_patient_events")
        .withColumn("event_date", col("event_timestamp").cast("date"))
        .withColumn("patient_age_group",
            when(col("patient_age") < 18, "pediatric")
            .when(col("patient_age") < 65, "adult")
            .otherwise("senior"))
        .dropDuplicates(["event_id"])
        .select("event_id", "patient_id", "event_type", "event_date",
                "event_timestamp", "ward_id", "duration_minutes",
                "patient_age_group", "_loaded_at")
    )` },
      { step: 3, title: 'Unity Catalog governance', description: 'Apply column masking on PII and row-level filters for department access.', code: `-- Unity Catalog column masking for patient_id (only compliance team sees real IDs)
CREATE OR REPLACE FUNCTION healthcare.mask_patient_id(patient_id STRING)
  RETURNS STRING
  RETURN CASE
    WHEN is_member('compliance_team') THEN patient_id
    ELSE CONCAT('PAT-', SHA2(patient_id, 256))
  END;

ALTER TABLE healthcare.silver.silver_patient_events
  ALTER COLUMN patient_id
  SET MASK healthcare.mask_patient_id;

-- Row-level security: staff see only their ward
CREATE OR REPLACE FUNCTION healthcare.ward_filter(ward_id STRING)
  RETURNS BOOLEAN
  RETURN is_member('admin') OR ward_id IN (
    SELECT ward_id FROM healthcare.access.staff_ward_assignments
    WHERE staff_email = current_user()
  );

ALTER TABLE healthcare.silver.silver_patient_events
  SET ROW FILTER healthcare.ward_filter ON (ward_id);` },
    ],
    sampleData: {
      description: 'Healthcare patient events with PII that requires column masking.',
      tables: [
        { name: 'patient_events', columns: ['event_id', 'patient_id', 'patient_age', 'patient_gender', 'event_type', 'ward_id', 'event_timestamp', 'duration_minutes'] },
      ],
      sampleRows: [
        { event_id: 'EVT-001', patient_id: 'P-8821', event_type: 'admission', ward_id: 'ICU-3', duration_minutes: 1440 },
        { event_id: 'EVT-002', patient_id: 'P-4492', event_type: 'procedure', ward_id: 'ORTHO-1', duration_minutes: 90 },
      ],
    },
    interviewQuestions: [
      'What is the difference between @dlt.expect, @dlt.expect_or_drop, and @dlt.expect_or_fail?',
      'How does Unity Catalog improve on legacy Hive metastore?',
      'How do you implement column masking for PII in Unity Catalog?',
      'What are the advantages of DLT pipelines over regular Databricks notebooks?',
      'How do you handle schema evolution in DLT streaming tables?',
    ],
    resumePoints: [
      'Implemented HIPAA-compliant data platform using DLT pipelines with data quality constraints and quarantine',
      'Configured Unity Catalog column masking for PII fields and row-level security by department',
      'Achieved full data lineage tracking from raw ADLS ingestion to Power BI dashboard',
      'Reduced data quality incidents by 90% by replacing ad-hoc notebooks with declarative DLT pipelines',
    ],
    challenges: [
      'DLT streaming tables not supporting MERGE — worked around with CDC log pattern in silver layer',
      'Unity Catalog row filters impacting query performance — solved with materialized filtered views for hot paths',
    ],
    productionConsiderations: [
      'Set DLT pipeline to "Enhanced autoscaling" mode to handle variable daily volumes',
      'Implement DLT event hooks to alert Slack when quality constraint violation rate exceeds 5%',
      'Regular Unity Catalog audit log review to detect unauthorised data access patterns',
    ],
    ingestionStrategy: 'Streaming ingestion using DLT Auto Loader in cloudFiles mode with JSON format and inferred column types. DLT pipeline runs in "continuous" mode during peak clinical hours and "triggered" mode overnight. Schema hints enforce critical clinical data types at ingestion; schema evolution handles non-breaking additions.',
    cicdStrategy: 'DLT pipelines deployed via Databricks Asset Bundles in Azure DevOps. Separate pipeline definitions for dev/staging/prod environments. Data quality gate: Silver @dlt.expect_or_drop violation rate must stay below 2% before pipeline is promoted to production. Unity Catalog privileges managed as infrastructure-as-code.',
    costOptimization: [
      'DLT continuous mode only during peak ingestion hours (07:00–22:00) — triggered mode overnight reduces idle cluster costs by ~60%',
      'Enhanced autoscaling on DLT clusters — scales to 2 workers at night, 20+ during peak ingestion',
      'Unity Catalog Delta tables with liquid clustering instead of ZORDER — avoids expensive full rewrites on schema-changing tables',
    ],
    securityConsiderations: [
      'HIPAA compliance requires column masking on patient_id — SHA2 hash for non-compliance-team users ensures de-identification at the query layer',
      'Row-level security ensures staff see only their ward — prevents accidental cross-ward data exposure',
      'DLT pipelines run as a service principal, not a human user — credentials audited and rotated quarterly',
      'All data encrypted at rest (ADLS encryption) and in transit (HTTPS/TLS) — required for HIPAA Business Associate Agreement compliance',
    ],
    interviewTalkingPoints: [
      {
        question: 'What is the difference between @dlt.expect, @dlt.expect_or_drop, and @dlt.expect_or_fail?',
        answer: '@dlt.expect records constraint violations as metrics but keeps all rows — useful for monitoring data quality without blocking the pipeline. @dlt.expect_or_drop removes violating rows and routes them to a quarantine metrics table — keeps good data flowing while isolating bad records. @dlt.expect_or_fail stops the entire pipeline if any row violates the constraint — use only for invariants that signal a fundamentally broken source (e.g., null primary keys). In a healthcare context, I use expect_or_drop for clinical data quality rules and expect for demographic completeness — I want the pipeline to keep running even with incomplete demographic data, but I want to measure the gap.',
        followUps: [
          'Where do the dropped records go when you use expect_or_drop?',
          'How do you query the DLT event log to monitor quality constraint violation rates?',
          'When would a team choose expect_or_fail over expect_or_drop?',
        ],
      },
      {
        question: 'How does Unity Catalog improve on legacy Hive metastore?',
        answer: 'Hive metastore is workspace-scoped — you need separate access management in each workspace and cannot share tables across workspaces without replicating data. Unity Catalog is account-level, so one catalog serves all workspaces. Unity Catalog adds column-level security (masking), row-level security (filters), and full data lineage — features that require external tools or custom views with Hive. Unity Catalog also has a three-level namespace (catalog.schema.table) vs Hive\'s two-level (schema.table), which enables environment separation (dev/prod catalogs) without infrastructure duplication. The audit log is also far more detailed — every query, every column access is recorded.',
        followUps: [
          'What does Unity Catalog lineage capture that a custom lineage solution would not?',
          'How do you migrate a Hive metastore-based lakehouse to Unity Catalog?',
          'What are the limitations of Unity Catalog for non-Databricks compute?',
        ],
      },
      {
        question: 'What are the advantages of DLT pipelines over regular Databricks notebooks?',
        answer: 'DLT manages dependency resolution — you declare table relationships and DLT builds the execution order automatically. Regular notebooks require manual orchestration (e.g., notebook A → B → C in ADF), and a failure in the middle requires manual intervention. DLT handles incremental processing natively: streaming tables process only new data, materialized views refresh when upstream tables change. DLT also captures data quality metrics, lineage, and event logs automatically — with regular notebooks, you build all of this yourself. The trade-off is less flexibility: DLT is opinionated about how tables are defined, and debugging DLT pipeline failures is harder than debugging a notebook.',
        followUps: [
          'When would you choose a regular notebook over DLT?',
          'How do DLT materialized views differ from regular Delta views?',
          'How do you pass parameters to a DLT pipeline?',
        ],
      },
      {
        question: 'How do you implement column masking for PII in Unity Catalog?',
        answer: 'I create a masking function using CREATE FUNCTION that returns the original value if the calling user is in the privileged group, or a masked version otherwise. The masking logic depends on the use case: for patient_id I use SHA2 hashing so analysts can still group and join on the masked value; for names and contact details I replace with NULL or a static placeholder since there is no analytical need to group by them. The function is attached to the column with ALTER TABLE ... ALTER COLUMN ... SET MASK. The masking is applied transparently — downstream queries see the masked value and do not need to be modified.',
        followUps: [
          'How does dynamic data masking differ from static data masking?',
          'What happens to query performance when column masking is applied?',
          'How do you audit which users are seeing real vs masked values?',
        ],
      },
      {
        question: 'How do you handle schema evolution in DLT streaming tables?',
        answer: 'DLT Auto Loader with schema inference will detect new columns and add them to the streaming table schema automatically when schemaEvolutionMode is set to "addNewColumns". Existing columns are unaffected. For type changes (e.g., a numeric field becoming a string), Auto Loader raises a schema change exception which pauses the pipeline — this is intentional because silent type coercions corrupt data. I resolve type conflicts by explicitly casting in the Bronze table definition using schema hints. For the Silver and Gold DLT tables, schema evolution is handled by Delta Lake\'s column merging on APPEND or by re-running the pipeline with FULL REFRESH when a breaking upstream change is made.',
        followUps: [
          'What is FULL REFRESH in DLT and when should you avoid it?',
          'How do you test a schema change in a DLT pipeline without impacting production?',
          'What happens to the DLT event log history after a FULL REFRESH?',
        ],
      },
    ],
    seniorNotes: {
      juniorsMiss: [
        'DLT @dlt.expect metrics are only visible in the DLT event log, not in regular Delta table history — teams who do not actively query the event log miss quality issues for weeks',
        'Unity Catalog column masking functions are evaluated on the compute cluster, not the control plane — a poorly written masking UDF can cause query performance issues for all users of that table',
        'DLT streaming tables in continuous mode keep a Spark Structured Streaming job alive — they consume DBUs even when no new data arrives, unlike triggered mode which only runs on demand',
        'The three-level Unity Catalog namespace (catalog.schema.table) requires updating all existing SQL code that uses two-level references — migration scripts often miss stored procedures and ADF datasets',
      ],
      productionRealities: [
        'DLT pipelines are harder to debug than notebooks because errors surface in the event log rather than a notebook cell — the event log format requires learning to read it effectively',
        'Unity Catalog row-level security filters are evaluated on every query — complex filter functions on large tables can add significant latency to dashboards and BI tools',
        'DLT Auto Loader with schema inference stores inferred schemas in a schema location directory — if this directory is deleted or corrupted, Auto Loader will re-infer and potentially merge schemas incorrectly',
        'HIPAA compliance requirements extend beyond masking — PHI in query history logs, cluster logs, and Spark event logs must also be addressed, which requires Unity Catalog audit log configuration',
      ],
      interviewersFocus: 'Healthcare data platforms are scrutinised for compliance depth. Interviewers expect you to know the difference between de-identification (permanently removing PII) and dynamic masking (hiding at query time but retaining in storage). The most credible signal is understanding that HIPAA compliance is a process, not a single technical control — it includes audit logging, access reviews, incident response, and Business Associate Agreements, not just column masking.',
    },
  },

  {
    id: 'streaming-analytics',
    title: 'Streaming Analytics Pipeline',
    icon: '📊',
    difficulty: 'Advanced',
    duration: '2–3 days',
    tools: ['PySpark Streaming', 'Kafka', 'Delta Lake', 'Azure Event Hubs', 'Grafana'],
    tags: ['Streaming', 'Real-time', 'Analytics', 'Kafka'],
    overview: 'Build a real-time clickstream analytics pipeline that processes millions of page view events per hour, computes 5-minute window aggregations, and serves live dashboards with sub-minute latency.',
    businessProblem: 'An e-commerce platform generates 2M clickstream events per hour. The current hourly batch reports cannot detect flash sales traffic spikes or checkout funnel drops in time. Real-time analytics will enable the engineering team to react to incidents within 5 minutes.',
    architecture: {
      description: 'Kafka → Spark Structured Streaming → Delta Silver → Gold aggregations → Grafana.',
      layers: [
        { name: 'Ingest', color: '#231f20', description: 'Web servers publish clickstream events to Kafka topic. Partitioned by user_session.' },
        { name: 'Process', color: '#e25a1c', description: 'Spark Structured Streaming with 5-min tumbling windows, watermark for late events.' },
        { name: 'Serve', color: '#2f756e', description: 'Delta Gold tables with 30-second trigger. Grafana queries Delta for live dashboards.' },
      ],
      components: ['Kafka (Event Hubs)', 'Spark Structured Streaming', 'Delta Lake', 'Watermarking', 'Grafana', 'Delta Change Feed'],
    },
    steps: [
      { step: 1, title: 'Define streaming source schema', description: 'Parse Kafka JSON events with Spark schema definition for type safety.', code: `from pyspark.sql.types import *
from pyspark.sql.functions import from_json, col, window, count, countDistinct

CLICKSTREAM_SCHEMA = StructType([
    StructField("event_id", StringType()),
    StructField("user_id", StringType()),
    StructField("session_id", StringType()),
    StructField("page_url", StringType()),
    StructField("event_type", StringType()),  # pageview, click, purchase, cart_add
    StructField("product_id", StringType()),
    StructField("revenue", DoubleType()),
    StructField("event_time", TimestampType()),
])

raw_stream = (
    spark.readStream.format("kafka")
    .option("kafka.bootstrap.servers", KAFKA_BROKERS)
    .option("subscribe", "clickstream")
    .option("maxOffsetsPerTrigger", 50000)
    .load()
    .select(from_json(col("value").cast("string"), CLICKSTREAM_SCHEMA).alias("e"))
    .select("e.*")
    .withWatermark("event_time", "2 minutes")
)` },
      { step: 2, title: '5-minute window aggregations', description: 'Compute real-time KPIs: page views, unique users, revenue per 5-minute window.', code: `from pyspark.sql.functions import sum as spark_sum

windowed_kpis = (
    raw_stream
    .groupBy(
        window(col("event_time"), "5 minutes"),
        col("page_url")
    )
    .agg(
        count("event_id").alias("page_views"),
        countDistinct("user_id").alias("unique_users"),
        countDistinct("session_id").alias("sessions"),
        spark_sum("revenue").alias("revenue"),
        count(when(col("event_type") == "purchase", 1)).alias("purchases")
    )
    .select(
        col("window.start").alias("window_start"),
        col("window.end").alias("window_end"),
        col("page_url"),
        col("page_views"), col("unique_users"),
        col("sessions"), col("revenue"), col("purchases")
    )
)

(windowed_kpis.writeStream
    .format("delta")
    .outputMode("append")
    .option("checkpointLocation", "/mnt/checkpoints/clickstream-windows")
    .trigger(processingTime="30 seconds")
    .toTable("gold.clickstream_windows")
)` },
    ],
    sampleData: {
      description: 'E-commerce clickstream events with user, session, and page data.',
      tables: [
        { name: 'clickstream', columns: ['event_id', 'user_id', 'session_id', 'page_url', 'event_type', 'product_id', 'revenue', 'event_time'] },
      ],
      sampleRows: [
        { event_id: 'E-001', user_id: 'U-9921', event_type: 'pageview', page_url: '/products/laptop', event_time: '2024-01-16T14:23:00Z' },
        { event_id: 'E-002', user_id: 'U-9921', event_type: 'cart_add', product_id: 'PRD-445', event_time: '2024-01-16T14:23:45Z' },
      ],
    },
    interviewQuestions: [
      'What is a watermark in Spark Streaming and why do you need it?',
      'How does "append" output mode work with windowed aggregations?',
      'What happens to late-arriving events that fall outside the watermark?',
      'How would you handle a Kafka consumer group rebalance without losing data?',
      'Compare micro-batch and continuous streaming modes in Spark.',
    ],
    resumePoints: [
      'Built real-time clickstream pipeline processing 2M+ events/hour with sub-minute dashboard latency',
      'Implemented 5-minute tumbling window aggregations with 2-minute watermark for late event tolerance',
      'Reduced time-to-detect checkout funnel issues from 60 minutes to 5 minutes',
    ],
    challenges: [
      'Skewed Kafka partitions from bot traffic causing hot executor — solved with repartition after Kafka read',
      'State store growing unbounded with long watermark — reduced watermark to 2 min after analysis',
    ],
    productionConsiderations: [
      'Monitor Kafka consumer lag — alert if lag exceeds 5 minutes to detect processing bottlenecks',
      'Enable Delta Change Data Feed on gold table so Grafana only queries changed partitions',
      'Set max offsets per trigger to prevent OOM when catching up after downtime',
    ],
    ingestionStrategy: 'Web application publishes clickstream events directly to Kafka (Azure Event Hubs) using a client-side SDK. Events are partitioned by user_session for ordered processing per session. Spark Structured Streaming reads with maxOffsetsPerTrigger=50000 to prevent OOM on backfill. Watermark of 2 minutes handles network jitter and mobile client clock drift.',
    cicdStrategy: 'Spark Streaming job packaged as Docker image and deployed to Databricks Jobs with job cluster. Blue/green deployment: new image deployed as a parallel job with a separate consumer group; Kafka lag comparison validates processing parity before traffic is switched. Rollback is consumer group offset reset to the deployment checkpoint.',
    costOptimization: [
      'Azure Event Hubs Standard tier with auto-inflate — starts at 2 Throughput Units, scales to 20 on traffic spikes without manual intervention',
      'Spark Structured Streaming 30-second trigger vs continuous mode — saves ~40% compute for the same sub-minute latency at this event volume',
      'Delta Gold table with Change Data Feed enabled — Grafana only queries changed partitions rather than full table scans',
    ],
    securityConsiderations: [
      'Event Hubs Shared Access Signature (SAS) policy per consumer — producers and consumers have separate keys with minimum permissions',
      'User IDs hashed in Gold aggregations — session analytics do not require reversible user identifiers',
      'Kafka traffic behind private endpoint — no public internet exposure for the Event Hubs namespace',
      'Data retention policy: raw clickstream purged after 30 days per privacy policy; aggregations retained for 2 years',
    ],
    interviewTalkingPoints: [
      {
        question: 'What is a watermark in Spark Streaming and why do you need it?',
        answer: 'A watermark tells Spark how late an event can arrive and still be included in a window aggregation. Without a watermark, Spark must keep all window state in memory indefinitely — it cannot know if a late event for a closed window will ever arrive. The watermark defines the maximum expected lateness: with a 2-minute watermark, Spark assumes any event more than 2 minutes late can be safely dropped, and it can clean up state for windows older than the current event time minus 2 minutes. The watermark-event time trade-off is: larger watermark = lower data loss from late events, higher memory pressure and output latency.',
        followUps: [
          'How does watermark interact with the trigger interval?',
          'What happens to events that arrive after the watermark threshold?',
          'How do you choose the right watermark value for a mobile app with unreliable clients?',
        ],
      },
      {
        question: 'How does append output mode work with windowed aggregations?',
        answer: 'In append mode, Spark only outputs a window\'s aggregate result once — when the watermark guarantees the window is closed (no more late events can arrive). For a 5-minute window with a 2-minute watermark, the result for the 14:00–14:05 window is appended to the output table when the event time reaches 14:07. This means the output has a natural latency equal to the window size plus the watermark. Update mode outputs results as soon as any data arrives for a window — you see partial results that get updated as more events arrive. For a dashboard that shows only complete windows, append mode is correct. For a live counter, update mode is better.',
        followUps: [
          'What output modes does Spark support and which work with windowed aggregations?',
          'How do you handle cases where you need both partial and complete window results?',
          'Why does append mode not work with non-windowed streaming aggregations?',
        ],
      },
      {
        question: 'How would you handle a Kafka consumer group rebalance without losing data?',
        answer: 'Kafka rebalances happen when consumers join or leave the group. Spark Structured Streaming handles this automatically: when a rebalance occurs, Spark suspends processing, the group stabilises, and Spark resumes from the last committed offsets. No data is lost because Kafka retains all unconsumed messages until their retention period. The operational concern is latency spike during rebalance — typically 10–60 seconds. To minimise rebalance frequency, I use sticky partition assignment (partition.assignment.strategy=cooperative-sticky) which reassigns the minimum number of partitions rather than doing a full re-shuffle. I also avoid scaling Spark executor count up and down frequently, as each change triggers a rebalance.',
        followUps: [
          'What is the difference between eager and cooperative rebalancing in Kafka?',
          'How does Spark Structured Streaming\'s state store behave during a rebalance?',
          'How would you monitor rebalance frequency and duration in production?',
        ],
      },
      {
        question: 'What happens to late-arriving events that fall outside the watermark?',
        answer: 'Events that arrive after the watermark threshold are silently dropped — they are not included in any window aggregation. This is a deliberate design decision in Spark Structured Streaming: the watermark is your explicit statement that you accept some data loss in exchange for bounded memory usage and predictable output timing. For clickstream analytics, dropping events older than 2 minutes is acceptable — a missed pageview from 3 minutes ago has no material impact on the dashboard. For revenue or transaction data, you need a reconciliation job: a separate batch process that re-reads from Kafka raw events and backfills any windows that had late-arriving data beyond the streaming watermark.',
        followUps: [
          'How would you implement a late-data reconciliation batch job?',
          'What is the trade-off between streaming and lambda architecture for handling late data?',
          'How do you alert when late event rate exceeds an acceptable threshold?',
        ],
      },
      {
        question: 'Compare micro-batch and continuous streaming modes in Spark.',
        answer: 'Micro-batch (the default) processes data in discrete batches triggered at a configured interval — 30 seconds in this pipeline. Each trigger reads all available data since the last checkpoint, processes it, and writes. Minimum latency is the trigger interval. Continuous streaming processes each record as it arrives with sub-millisecond latency, using an experimental asynchronous checkpoint model. The trade-off: continuous mode has much higher CPU overhead because of per-record processing, and it only supports limited transformations (no windowed aggregations, no stateful ops). For 2M events/hour with 5-minute window aggregations, micro-batch at 30 seconds is the correct choice — continuous mode cannot express window aggregations and micro-batch is 10x more cost-efficient at this scale.',
        followUps: [
          'What is the minimum achievable latency with Spark micro-batch processing?',
          'When would you choose Flink over Spark Structured Streaming?',
          'How does trigger(availableNow=True) differ from trigger(processingTime="30 seconds")?',
        ],
      },
    ],
    seniorNotes: {
      juniorsMiss: [
        'The 2-minute watermark means your dashboard data is always 2 minutes behind real time at minimum — teams often set it too low and then wonder why their late-event drop rate is high',
        'maxOffsetsPerTrigger is per partition — with 50 partitions and maxOffsetsPerTrigger=50000, you process up to 2.5M records per trigger batch, which may exceed executor memory',
        'Windowed aggregations in append mode do not produce output until the window closes — a new dashboard with no historical data will appear empty for the first (window_size + watermark) minutes',
        'Delta Change Data Feed must be explicitly enabled when the table is created — you cannot enable it retroactively and have the feed include past changes',
      ],
      productionRealities: [
        'Bot traffic will skew your Kafka partitions if partitioned by user_session — bot sessions have vastly more events than real users; adding an anomaly filter before partitioning prevents hot executor tasks',
        'Grafana querying Delta directly at 30-second refresh intervals creates hundreds of small queries per hour — use Delta CDF or a dedicated serving layer to avoid reader-writer contention',
        'Checkpoint storage on ADLS can become a bottleneck at high throughput — checkpoint writes happen synchronously per trigger; use premium storage tier for checkpoints',
        'After a long downtime (e.g., hours of Kafka backlog), catching up with maxOffsetsPerTrigger takes many small batches — the first real-time data point visible in the dashboard is delayed proportionally',
      ],
      interviewersFocus: 'The depth test for streaming is always watermarks and exactly-once semantics. Most candidates can describe the architecture; fewer can explain why append mode has the output latency it does, or what happens to state when the watermark advances past a window. The highest signal answer demonstrates you have debugged a real problem: a dashboard showing stale data, late events being silently dropped, or a stateful job OOM\'ing due to an unbounded window.',
    },
  },

  {
    id: 'databricks-optimization',
    title: 'Databricks Optimization Lab',
    icon: '⚡',
    difficulty: 'Advanced',
    duration: '2 days',
    tools: ['Databricks', 'PySpark', 'Delta Lake', 'Spark UI', 'Auto Optimizer'],
    tags: ['Performance', 'Optimization', 'PySpark', 'Delta Lake'],
    overview: 'Diagnose and fix performance bottlenecks in a slow Spark pipeline. Cover data skew, unnecessary shuffles, broadcast join optimization, caching strategy, partition tuning, and AQE configuration.',
    businessProblem: 'A data engineering team has a nightly Spark job that processes 500GB of sales data and takes 4 hours to run, causing SLA breaches. The team needs to reduce runtime to under 45 minutes without increasing cluster size.',
    architecture: {
      description: 'Performance optimization across all pipeline layers: storage, Spark plan, cluster config.',
      layers: [
        { name: 'Diagnose', color: '#dc2626', description: 'Spark UI analysis: identify skewed tasks, slow stages, shuffle reads, and spill to disk.' },
        { name: 'Optimize', color: '#f59e0b', description: 'Apply broadcast joins, repartition, persist, AQE, and Z-ORDER for the hot path.' },
        { name: 'Validate', color: '#2f756e', description: 'Benchmark before/after. Document optimizations. Set up ongoing monitoring.' },
      ],
      components: ['Spark UI', 'Delta OPTIMIZE', 'AQE', 'Broadcast hints', 'Caching', 'Cluster tuning', 'Ganglia metrics'],
    },
    steps: [
      { step: 1, title: 'Diagnose with Spark UI', description: 'Identify the root cause of slow jobs by reading the Spark UI execution plan and stage metrics.', code: `# Enable AQE and adaptive partition coalescing
spark.conf.set("spark.sql.adaptive.enabled", "true")
spark.conf.set("spark.sql.adaptive.coalescePartitions.enabled", "true")
spark.conf.set("spark.sql.adaptive.skewJoin.enabled", "true")

# Check for data skew — look for tasks with 10x+ duration variance
# In Spark UI: Stages tab → look for "median task time" vs "max task time"
# If max >> median, you have skew

# Profile your DataFrame
from pyspark.sql.functions import col, count

# Check partition size distribution
df.rdd.mapPartitions(lambda it: [sum(1 for _ in it)]).collect()

# Find skewed join keys
df.groupBy("store_id").count().orderBy(col("count").desc()).show(20)` },
      { step: 2, title: 'Fix data skew with salting', description: 'Eliminate skew caused by popular join keys by adding a random salt to distribute load.', code: `from pyspark.sql.functions import col, concat, lit, floor, rand, explode, array

SALT_FACTOR = 10

# Salt the large table
sales_salted = (sales_df
    .withColumn("salt", (rand() * SALT_FACTOR).cast("int"))
    .withColumn("store_id_salted", concat(col("store_id"), lit("_"), col("salt")))
)

# Explode the small table to match all salt values
store_exploded = (stores_df
    .withColumn("salt", explode(array([lit(i) for i in range(SALT_FACTOR)])))
    .withColumn("store_id_salted", concat(col("store_id"), lit("_"), col("salt")))
)

# Join on salted key — evenly distributed across partitions
result = sales_salted.join(store_exploded, "store_id_salted").drop("store_id_salted", "salt")` },
      { step: 3, title: 'Broadcast join for small tables', description: 'Force broadcast hint to eliminate shuffle for joins with small dimension tables.', code: `from pyspark.sql.functions import broadcast

# Without broadcast: 500GB × join → massive shuffle
# slow_result = sales.join(products, "product_id")  # Don't do this

# With broadcast: 50MB products table broadcast to all executors
fast_result = sales.join(broadcast(products), "product_id")

# Configure threshold (tables under 200MB auto-broadcast)
spark.conf.set("spark.sql.autoBroadcastJoinThreshold", 200 * 1024 * 1024)

# Check if broadcast is being used in the plan
fast_result.explain(mode="formatted")
# Look for "BroadcastHashJoin" in the output — if you see "SortMergeJoin", broadcast wasn't applied` },
      { step: 4, title: 'Delta OPTIMIZE and Z-ORDER', description: 'Compact small files and co-locate related data for faster query plans.', code: `# Compact small files (improves read performance significantly)
spark.sql("OPTIMIZE sales.gold_daily ZORDER BY (sale_date, store_id)")

# Before OPTIMIZE: 50,000 small files (100KB avg) = slow scan
# After OPTIMIZE: 200 large files (250MB avg) = 10x faster scan

# Check file sizes before/after
spark.sql("""
    DESCRIBE HISTORY gold_daily LIMIT 5
""").show()

# For frequently queried columns, liquid clustering (Databricks 13.3+)
spark.sql("""
    ALTER TABLE gold_daily CLUSTER BY (sale_date, store_id)
""")` },
    ],
    sampleData: {
      description: 'Sales data with skewed store distribution used for optimization benchmarks.',
      tables: [
        { name: 'sales', columns: ['sale_id', 'store_id', 'product_id', 'amount', 'quantity', 'sale_date'] },
        { name: 'products', columns: ['product_id', 'name', 'category', 'cost', 'margin'] },
      ],
      sampleRows: [
        { sale_id: 'S-001', store_id: 'MEGA-1', product_id: 'P-100', amount: 89.99, sale_date: '2024-01-16' },
      ],
    },
    interviewQuestions: [
      'How do you identify data skew in a Spark job?',
      'When would you use broadcast join vs sort-merge join?',
      'What is AQE and which specific problems does it solve?',
      'Explain the difference between cache() and persist() with MEMORY_AND_DISK.',
      'How does Z-ORDER improve query performance in Delta Lake?',
    ],
    resumePoints: [
      'Reduced nightly Databricks Spark pipeline from 4 hours to 38 minutes through skew elimination and broadcast joins',
      'Diagnosed and resolved data skew on store_id join key using salting technique',
      'Optimized Delta tables with ZORDER clustering reducing scan sizes by 70%',
      'Enabled AQE with adaptive partition coalescing to dynamically handle variable data volumes',
    ],
    challenges: [
      'Salting introduced cartesian product risk — mitigated by careful selection of salt factor and validation',
      'OPTIMIZE ZORDER conflicts with streaming append workloads — scheduled during off-peak window',
    ],
    productionConsiderations: [
      'Schedule OPTIMIZE/VACUUM during low-traffic windows to avoid competing with pipeline reads',
      'Monitor Spark shuffle bytes with Databricks metrics to detect new skew after data volume changes',
      'Benchmark cluster autoscaling vs fixed cluster — autoscaling adds ~3 min startup but saves cost on idle',
    ],
    ingestionStrategy: 'No new ingestion in this project — existing Delta Gold tables are used as input. The pipeline reads from pre-existing ADLS-mounted Delta tables. The optimization work focuses on read performance via OPTIMIZE/ZORDER, join strategy, and cluster configuration rather than ingestion changes.',
    cicdStrategy: 'Performance benchmarks automated in CI: a benchmark notebook runs on every merge to main and publishes Spark stage duration metrics to Azure Monitor. A regression check fails the pipeline if any optimized query regresses beyond 20% vs the established baseline. OPTIMIZE/VACUUM scheduled via Databricks Jobs with dependency checks to avoid conflicts with active pipelines.',
    costOptimization: [
      'Broadcast joins eliminate shuffle for small dimension tables — saves significant network I/O and eliminates sort-merge join overhead on 500GB fact table',
      'AQE with adaptive coalescing reduces post-shuffle partition count from 200 to 12 for small result sets — fewer tasks, less scheduling overhead',
      'Right-sized cluster after profiling: reduced from 20 workers (over-provisioned) to 8 workers with 2x faster nodes — same throughput, 40% lower cost',
      'Delta OPTIMIZE compacts 50K small files to 200 large files — reduces cloud storage API call costs significantly on each scan',
    ],
    securityConsiderations: [
      'Spark UI can expose query plans containing column names and filter values — restrict Spark UI access to the data engineering team',
      'Cluster logs written to ADLS — configure log path with restricted access, not the default open bucket',
      'Service principal for cluster with read-only access to source tables — optimization work should not require write access',
    ],
    interviewTalkingPoints: [
      {
        question: 'How do you identify data skew in a Spark job?',
        answer: 'I go to Spark UI → Stages tab → click the slow stage → look at the task timeline and metrics. If the max task duration is 10x+ the median task duration, that stage has skew. The task metrics will also show high "shuffle read bytes" for a single task. To confirm the skew source, I inspect the stage\'s physical plan in the SQL tab — look for which column is being used as the join/group key, then profile that column\'s value distribution with a simple GROUP BY count. If a few values account for >50% of rows, that is your skew.',
        followUps: [
          'What is AQE skew join handling and how does it work?',
          'When would you use salting vs relying on AQE to handle skew?',
          'How do you detect skew in a windowed streaming aggregation?',
        ],
      },
      {
        question: 'When would you use broadcast join vs sort-merge join?',
        answer: 'Broadcast join sends a full copy of the smaller table to every executor, eliminating the shuffle. It is the right choice when one table is small enough to fit in executor memory — typically under 200MB, tunable via spark.sql.autoBroadcastJoinThreshold. Sort-merge join is used when both tables are large — Spark sorts both by the join key and merges them, which requires a shuffle but works at any scale. The cost of broadcasting is memory pressure on all executors and network bandwidth for the broadcast itself. The cost of sort-merge is the shuffle — for a 500GB table joining a 50MB dimension, broadcast saves the entire 500GB shuffle, which is the dominant cost.',
        followUps: [
          'What happens if you force broadcast a table that is too large for executor memory?',
          'How does shuffle hash join differ from sort-merge join?',
          'How do you check the physical plan to confirm which join strategy Spark chose?',
        ],
      },
      {
        question: 'What is AQE and which specific problems does it solve?',
        answer: 'Adaptive Query Execution (AQE) re-optimises the query plan at runtime using actual data statistics collected during execution, rather than relying on potentially stale or inaccurate pre-execution statistics. It solves three specific problems: (1) coalescing too-many small shuffle partitions into fewer larger ones after a shuffle; (2) switching from sort-merge to broadcast join when Spark discovers at runtime that a table is smaller than expected; (3) splitting skewed partitions into multiple tasks to fix the hot task problem. AQE is a runtime complement to static optimizations like ZORDER — use both, not one or the other.',
        followUps: [
          'What are the limitations of AQE — what can it not fix?',
          'How do you verify AQE is actually making plan changes vs using the static plan?',
          'Does AQE work with Structured Streaming?',
        ],
      },
      {
        question: 'Explain the difference between cache() and persist() with MEMORY_AND_DISK.',
        answer: 'cache() is syntactic sugar for persist(StorageLevel.MEMORY_ONLY) — data is stored in JVM heap memory as deserialized Java objects. If it does not fit, partitions are recomputed on access. persist(MEMORY_AND_DISK) stores in memory and spills the overflow to local disk — partitions that do not fit are not lost, they are read from disk on subsequent access. MEMORY_ONLY is faster when data fits but fails silently under memory pressure. MEMORY_AND_DISK is more robust. MEMORY_ONLY_SER stores as serialized bytes — more memory-efficient than deserialized objects but adds CPU overhead for serialization. The right choice depends on your memory budget, how expensive the computation is to repeat, and whether disk I/O is acceptable.',
        followUps: [
          'When should you explicitly unpersist a cached DataFrame?',
          'How does caching interact with AQE and shuffle partition coalescing?',
          'What is the difference between DataFrame.cache() and caching in a DLT pipeline?',
        ],
      },
      {
        question: 'How does Z-ORDER improve query performance in Delta Lake?',
        answer: 'Z-ORDER is a data locality technique that reorders rows in each file so that rows with similar values on the Z-ordered column(s) are stored together. Delta Lake records the min/max statistics for each column in each file in the transaction log. When a query has a WHERE filter on a Z-ordered column, Delta\'s data skipping reads only files where the min/max range includes the filter value. Without Z-ORDER, files contain rows in arbitrary order and the min/max range spans the entire data range — data skipping is ineffective. The result: queries with highly selective filters on the Z-ordered column skip most files and read a fraction of the data. The trade-off: Z-ORDER is expensive to compute (full rewrite of files) and needs to be re-run periodically as new data arrives.',
        followUps: [
          'What is Liquid Clustering and how does it differ from Z-ORDER?',
          'How do you choose which columns to Z-ORDER by?',
          'Does Z-ORDER benefit write performance or only reads?',
        ],
      },
    ],
    seniorNotes: {
      juniorsMiss: [
        'Salting for skew mitigation increases the shuffle output size proportionally to the salt factor — a salt factor of 10 means 10x more data in the shuffle, which can negate the skew benefit',
        'AQE skew join handling requires spark.sql.adaptive.skewJoin.enabled=true separately from spark.sql.adaptive.enabled=true — enabling just the parent flag does not activate skew handling',
        'OPTIMIZE ZORDER rewrites every file in the table — running it on a table being actively written causes write conflicts; always run during a maintenance window or use a transaction-safe approach',
        'Spark\'s autoBroadcastJoinThreshold is based on estimated size from table statistics, which may be stale — ANALYZE TABLE before relying on auto-broadcast, or use explicit broadcast() hint',
      ],
      productionRealities: [
        'The Spark UI is not available after a cluster terminates — attach the Spark event log to ADLS to enable post-mortem analysis of completed jobs',
        'Broadcast joins can cause driver OOM if the small table is larger than assumed — always validate table size before relying on broadcast, especially for tables that grow over time',
        'ZORDER performance gains degrade as more data is appended without re-running OPTIMIZE — schedule weekly OPTIMIZE runs to maintain the clustering benefit',
        'AQE coalescing of shuffle partitions is aggressive by default — it can reduce partition count so much that available parallelism is wasted; monitor executor utilization after enabling AQE',
      ],
      interviewersFocus: 'Performance optimization projects test whether you can reason from symptoms to root cause. Interviewers will describe a slow Spark job and ask what you would check first — the correct answer starts with Spark UI, not with "I would increase the cluster size." The most valued skill is systematic diagnosis: check the stage, identify the cause (skew vs shuffle vs small files), apply the minimum targeted fix, and measure the improvement. Engineers who jump to solutions without diagnosis — more partitions, bigger cluster, enable AQE — signal they are guessing.',
    },
  },

  // ─────────────── New Portfolio Projects ───────────────

  {
    id: 'iot-streaming',
    title: 'IoT Streaming Platform',
    icon: '📡',
    difficulty: 'Advanced',
    duration: '3–4 days',
    tools: ['Azure IoT Hub', 'Azure Event Hubs', 'PySpark Streaming', 'Delta Lake', 'Azure Stream Analytics', 'Power BI'],
    tags: ['IoT', 'Streaming', 'Real-time', 'Azure'],
    overview: 'Build an end-to-end IoT data platform that ingests sensor telemetry from 10,000+ industrial devices, performs real-time anomaly detection with 5-second windows, and feeds a live operations dashboard with device health metrics.',
    businessProblem: 'A manufacturing company has 10,000 sensors on production lines generating temperature, pressure, and vibration readings every 5 seconds. Equipment failures cause $50K/hour downtime. The current system polls sensors every 15 minutes — too slow to catch failures before they cascade. A real-time streaming platform needs to detect anomalies within 30 seconds of a sensor threshold breach.',
    architecture: {
      description: 'Azure IoT Hub → Event Hubs → Spark Structured Streaming for complex event processing → Delta Lake for historical analysis.',
      layers: [
        { name: 'Device Layer', color: '#0f62fe', description: 'IoT Hub receives MQTT/AMQP telemetry from 10K+ sensors. Per-device authentication via X.509 certificates. Device twin tracks last-known state.' },
        { name: 'Stream Processing', color: '#e25a1c', description: 'Spark Structured Streaming with 5-second tumbling windows. Anomaly detection via statistical thresholds and rolling Z-score. Alerts published to Service Bus.' },
        { name: 'Storage Layer', color: '#2f756e', description: 'Delta Bronze: raw telemetry append-only. Delta Silver: cleaned, device-joined readings. Delta Gold: hourly device health scores for BI.' },
      ],
      components: ['Azure IoT Hub', 'Event Hubs (Kafka-compatible)', 'Spark Structured Streaming', 'Delta Lake', 'Azure Service Bus', 'Power BI Streaming Dataset'],
    },
    steps: [
      { step: 1, title: 'IoT Hub → Event Hubs routing', description: 'Route IoT Hub telemetry to Event Hubs with message enrichment for device metadata.', code: `# IoT Hub built-in endpoint exposed as Event Hubs-compatible
# Connect Spark directly to IoT Hub's Event Hub-compatible endpoint

IOTHUB_ENDPOINT = "Endpoint=sb://iothub-ns.servicebus.windows.net/;SharedAccessKeyName=iothubowner;SharedAccessKey=...;EntityPath=iothubname"

raw_iot = (spark.readStream
    .format("eventhubs")
    .option("eventhubs.connectionString", IOTHUB_ENDPOINT)
    .option("eventhubs.consumerGroup", "spark-streaming-cg")
    .option("eventhubs.startingPosition",
            '{"offset":"-1","seqNo":-1,"enqueuedTime":null,"isInclusive":true}')
    .load()
)` },
      { step: 2, title: 'Parse and validate telemetry', description: 'Deserialise JSON telemetry, validate required fields, and enrich with device metadata.', code: `from pyspark.sql.functions import from_json, col, current_timestamp
from pyspark.sql.types import StructType, StructField, StringType, DoubleType, TimestampType

TELEMETRY_SCHEMA = StructType([
    StructField("device_id", StringType()),
    StructField("sensor_type", StringType()),     # temperature | pressure | vibration
    StructField("value", DoubleType()),
    StructField("unit", StringType()),
    StructField("event_time", TimestampType()),
])

telemetry = (raw_iot
    .select(
        from_json(col("body").cast("string"), TELEMETRY_SCHEMA).alias("t"),
        col("enqueuedTime").alias("enqueued_at"),
    )
    .select("t.*", "enqueued_at")
    .withWatermark("event_time", "30 seconds")
    .filter(col("device_id").isNotNull() & col("value").isNotNull())
)` },
      { step: 3, title: 'Anomaly detection with rolling thresholds', description: 'Detect threshold breaches and statistical anomalies using 5-second windows.', code: `from pyspark.sql.functions import avg, stddev, window, when

# Static thresholds per sensor type (from device config)
THRESHOLDS = {"temperature": 85.0, "pressure": 150.0, "vibration": 12.0}

# Compute rolling stats in 5-minute window for Z-score baseline
rolling_stats = (telemetry
    .groupBy(window("event_time", "5 minutes", "1 minute"), "device_id", "sensor_type")
    .agg(avg("value").alias("rolling_mean"), stddev("value").alias("rolling_std"))
)

# Join back to detect anomalies (simplified)
anomalies = (telemetry
    .filter(
        (col("sensor_type") == "temperature") & (col("value") > THRESHOLDS["temperature"]) |
        (col("sensor_type") == "pressure") & (col("value") > THRESHOLDS["pressure"]) |
        (col("sensor_type") == "vibration") & (col("value") > THRESHOLDS["vibration"])
    )
    .withColumn("severity", when(col("value") > col("threshold") * 1.2, "critical").otherwise("warning"))
)

# Write alerts to Service Bus
anomalies.writeStream.foreachBatch(send_to_service_bus).trigger(processingTime="5 seconds").start()` },
      { step: 4, title: 'Delta Bronze landing', description: 'Land all raw telemetry in Delta Bronze with device_id partitioning for efficient device-level queries.', code: `(telemetry.writeStream
    .format("delta")
    .outputMode("append")
    .partitionBy("sensor_type")
    .option("checkpointLocation", "/mnt/checkpoints/iot-bronze")
    .trigger(processingTime="30 seconds")
    .toTable("bronze.iot_telemetry")
)

# Bronze table retention: 90 days raw, then archive to cool tier
spark.sql("""
    ALTER TABLE bronze.iot_telemetry
    SET TBLPROPERTIES ('delta.deletedFileRetentionDuration' = 'interval 90 days')
""")` },
      { step: 5, title: 'Gold device health scores', description: 'Hourly batch job computes device health scores for Power BI dashboard.', code: `from pyspark.sql.functions import count, sum as spark_sum, percentile_approx

hourly_health = (spark
    .table("silver.iot_telemetry")
    .filter("event_time >= date_trunc('hour', now()) - interval 1 hour")
    .groupBy("device_id", "production_line", "sensor_type")
    .agg(
        count("*").alias("reading_count"),
        percentile_approx("value", 0.95).alias("p95_value"),
        percentile_approx("value", 0.99).alias("p99_value"),
        spark_sum(when(col("is_anomaly"), 1).otherwise(0)).alias("anomaly_count"),
    )
    .withColumn("health_score",
        when(col("anomaly_count") == 0, 100)
        .when(col("anomaly_count") <= 3, 80)
        .when(col("anomaly_count") <= 10, 60)
        .otherwise(20)
    )
)
hourly_health.write.format("delta").mode("overwrite").toTable("gold.device_health")` },
    ],
    sampleData: {
      description: 'IoT sensor telemetry from industrial production line devices.',
      tables: [
        { name: 'iot_telemetry', columns: ['device_id', 'production_line', 'sensor_type', 'value', 'unit', 'event_time', 'is_anomaly', 'severity'] },
        { name: 'device_registry', columns: ['device_id', 'device_name', 'production_line', 'install_date', 'threshold_temp', 'threshold_pressure', 'threshold_vibration'] },
      ],
    },
    interviewQuestions: [
      'How would you handle devices that go offline for hours and then send a burst of buffered readings?',
      'What is the trade-off between 5-second windows and 1-minute windows for anomaly detection?',
      'How do you ensure a sensor with faulty readings does not flood your alerts system?',
      'How would you handle 100K devices vs 10K — what changes in the architecture?',
    ],
    interviewTalkingPoints: [
      {
        question: 'How would you handle devices that go offline and send buffered readings?',
        answer: 'IoT devices buffer events locally when connectivity is lost. When the device reconnects, it sends a burst of out-of-order events with historical timestamps. The watermark handles this: with a 30-second watermark, events older than 30 seconds are dropped by the streaming layer. For devices with minutes or hours of buffered history, I run a separate batch reconciliation job that reads from IoT Hub\'s built-in 7-day message retention and backfills any gaps in the Bronze Delta table. The streaming layer handles real-time; the batch layer handles historical gaps. This is the Lambda pattern applied to IoT.',
        followUps: [
          'How does Azure IoT Hub message retention differ from Kafka retention?',
          'How would you detect that a specific device has gone offline in real time?',
          'What is the trade-off between watermark size and anomaly detection latency?',
        ],
      },
      {
        question: 'How do you scale this architecture from 10K to 1M devices?',
        answer: 'At 1M devices sending readings every 5 seconds, the ingestion rate is 200K events/second. Azure IoT Hub scales horizontally with partitions — I would increase Event Hubs partition count to match. The Spark streaming job must scale proportionally: partition count drives parallelism, so 200 partitions with 1 Spark task per partition handles this volume. The main bottleneck shifts to the Delta MERGE operations in Silver — at this scale, I would switch to append-only Silver with a separate compaction job rather than per-batch MERGE. The Gold health score computation needs to be incremental rather than full-table hourly scans. The architecture stays the same; the operational parameters change significantly.',
        followUps: [
          'What is the Event Hubs throughput unit model and how does it limit throughput?',
          'How does Delta Lake perform under 200K concurrent writes per second?',
          'When would you consider Apache Flink over Spark for this workload?',
        ],
      },
      {
        question: 'How do you prevent a faulty sensor from flooding your alerts?',
        answer: 'A faulty sensor stuck in a threshold-exceeding state generates continuous alerts at the event frequency (every 5 seconds). I implement alert deduplication: track the last alert time per device per sensor type and suppress additional alerts within a 15-minute window. I also implement a "flapping" detector: if a device crosses the threshold more than N times in a window (indicating rapid oscillation rather than a real failure), escalate to a separate "sensor fault" alert rather than an equipment alert. This is a state management problem — I use Spark\'s mapGroupsWithState to maintain per-device alert state across streaming batches.',
        followUps: [
          'How does mapGroupsWithState work and what are its performance implications?',
          'How would you handle alert deduplication in a stateless streaming framework?',
          'How do you test flapping detection logic in a streaming pipeline?',
        ],
      },
      {
        question: 'What is device twin in Azure IoT Hub and how does it affect your pipeline?',
        answer: 'A device twin is IoT Hub\'s per-device JSON document that stores device metadata, configuration (desired properties), and last-reported state (reported properties). For a streaming pipeline, device twin serves as the enrichment source: I use it to join device metadata (production line, model, thresholds) to the raw telemetry stream. Instead of hitting the device twin API per event (too slow), I batch-read device twins into a broadcast DataFrame that is refreshed every 15 minutes. When a device\'s configuration changes (new threshold values), the broadcast refresh picks it up within 15 minutes. This avoids a streaming join while keeping device configuration reasonably current.',
        followUps: [
          'What is the difference between device twin desired properties and reported properties?',
          'How would you handle a device configuration change that needs immediate effect?',
          'How does IoT Hub device provisioning service (DPS) relate to device twins?',
        ],
      },
      {
        question: 'How would you architect the alerting layer to avoid alert fatigue?',
        answer: 'Alert fatigue happens when the same condition generates continuous notifications. My layered alerting approach: (1) Deduplication — suppress repeated alerts for the same device/condition within a 15-minute window. (2) Severity-based routing — critical alerts go to PagerDuty immediately; warnings go to a daily digest email. (3) Correlation — if 50+ devices on the same production line alert within 60 seconds, that is a production line issue, not 50 individual device issues — fire one correlated alert. (4) Auto-resolve — close alerts automatically when the condition clears. The correlation logic requires Spark\'s window functions or a dedicated CEP (complex event processing) layer like Azure Stream Analytics.',
        followUps: [
          'How would you implement alert correlation in Spark Structured Streaming?',
          'What is the trade-off between Spark CEP and a dedicated tool like Azure Stream Analytics?',
          'How do you measure alert fatigue quantitatively?',
        ],
      },
    ],
    resumePoints: [
      'Designed real-time IoT platform processing 200K sensor events/second from 10,000 industrial devices with 30-second anomaly detection latency',
      'Implemented statistical threshold and Z-score anomaly detection with alert deduplication to eliminate alert fatigue',
      'Built medallion architecture on Delta Lake with 90-day raw retention and hourly device health scoring for operations dashboard',
      'Reduced mean time to equipment failure detection from 15 minutes to under 30 seconds, preventing $50K/hour downtime incidents',
    ],
    challenges: [
      'Buffered offline devices sending bursts of out-of-order events — solved with batch reconciliation job reading IoT Hub 7-day retention alongside streaming layer',
      'Faulty sensor flooding alerts — solved with mapGroupsWithState per-device alert deduplication and flapping detection',
      'Device metadata joins at 200K events/second — solved with broadcast join refreshed every 15 minutes rather than streaming join',
    ],
    productionConsiderations: [
      'Monitor IoT Hub partition lag per consumer group — alert if any partition falls more than 60 seconds behind',
      'Device twin broadcast refresh every 15 minutes means threshold changes take up to 15 minutes to propagate — document this lag for operations team',
      'Enable IoT Hub message routing to a dead-letter storage for malformed telemetry — do not silently drop unparseable device messages',
      'Azure IoT Hub Standard tier required for file upload and device twins — Basic tier does not support these features',
    ],
    cicdStrategy: 'Spark Streaming job deployed as Docker image to AKS via Azure DevOps. IoT Hub routing rules and Event Hubs configuration managed as Bicep infrastructure-as-code. Automated integration tests replay 1-hour of recorded device telemetry against staging environment; anomaly detection must match expected alert count within 5%.',
    costOptimization: [
      'IoT Hub Standard tier S1 units scale to 400K messages/day per unit — right-size based on device count and message frequency',
      'Delta Bronze on cool tier after 30 days — raw telemetry accessed rarely after the first day; warm tier cost is unnecessary',
      'Spark trigger every 30 seconds vs 5 seconds reduces checkpointing overhead by 6x at acceptable latency for most monitoring use cases',
    ],
    securityConsiderations: [
      'Per-device X.509 certificate authentication — compromised device credential can be revoked individually without affecting other devices',
      'IoT Hub IP filter rules restrict ingestion to known device IP ranges where feasible',
      'Event Hubs private endpoint — streaming data never crosses public internet between IoT Hub and Spark',
      'Device telemetry may contain location data — apply geolocation masking before writing to Silver for GDPR compliance',
    ],
    seniorNotes: {
      juniorsMiss: [
        'IoT Hub throttling limits are per unit per tier — exceeding the limit causes messages to be rejected, not queued; devices must implement exponential backoff',
        'Spark Structured Streaming with a 5-second trigger creates 17,000+ Delta transaction log entries per day — without periodic OPTIMIZE the transaction log scan slows every query',
        'Event time and processing time are different — a device with a wrong clock sends events with historical or future timestamps that can corrupt window boundaries',
        'mapGroupsWithState scales poorly with large state — each group\'s state is serialized/deserialized per batch; with 10K devices, this adds measurable latency',
      ],
      productionRealities: [
        'IoT Hub has a default 256KB message size limit — some devices send batch telemetry that exceeds this; requires device firmware change or message splitting at the gateway',
        'Azure IoT Hub consumer group limit is 5 per Event Hub endpoint — if you have more than 5 downstream consumers, add an Event Hubs fan-out layer',
        'Delta table for IoT data grows by millions of small files per day without OPTIMIZE — the first time your team runs OPTIMIZE on 30 days of IoT data, it may take hours',
        'Sensor readings contain device clock drift that introduces negative latency values — watermark and event-time logic must handle future-dated events gracefully',
      ],
      interviewersFocus: 'IoT projects test whether you understand the specific constraints of device-originated data: offline devices, clock skew, message size limits, and the fan-out problem. Interviewers also probe the operational decision between real-time alerting (low latency, higher cost, more complexity) and near-real-time (higher latency, simpler, more cost-effective). The strongest candidates can articulate why 30-second detection SLA drives the architecture choices, not the other way around.',
    },
  },

  {
    id: 'fraud-detection',
    title: 'Financial Fraud Detection Pipeline',
    icon: '🔍',
    difficulty: 'Advanced',
    duration: '3–5 days',
    tools: ['Azure Event Hubs', 'PySpark Streaming', 'Azure ML', 'Redis Cache', 'Delta Lake', 'Azure Functions'],
    tags: ['Fraud', 'ML', 'Real-time', 'Feature Store'],
    overview: 'Build a real-time fraud detection system that scores financial transactions within 200ms using a pre-trained ML model, a low-latency feature store, and a streaming decision engine that blocks suspicious transactions before they complete.',
    businessProblem: 'A payment processor handles 5,000 transactions/second. Fraud costs $2M/month. The current rule-based system catches 60% of fraud but has a 3% false positive rate (blocking legitimate transactions). An ML-based real-time scoring system targeting >85% fraud detection with <1% false positive rate must respond within 200ms to stay within the payment network SLA.',
    architecture: {
      description: 'Kafka → Spark Streaming feature computation → Redis feature store → Azure ML model endpoint → decision engine → Delta for audit.',
      layers: [
        { name: 'Ingestion', color: '#231f20', description: 'Event Hubs receives transaction events from payment gateway. Partitioned by merchant_id for ordered processing per merchant.' },
        { name: 'Feature Store', color: '#7c3aed', description: 'Redis caches pre-computed features per account: 1h/24h/7d transaction velocity, avg amount, merchant history. Updated in real time.' },
        { name: 'Scoring', color: '#dc2626', description: 'Azure ML managed endpoint serves XGBoost model with <50ms p99 latency. Score combined with rule engine for final decision.' },
        { name: 'Decision', color: '#2f756e', description: 'Transactions scored >0.85 blocked and quarantined. All decisions written to Delta audit table for model monitoring.' },
      ],
      components: ['Azure Event Hubs', 'Spark Structured Streaming', 'Redis Enterprise', 'Azure ML Online Endpoint', 'Delta Lake', 'Azure Functions', 'Azure Service Bus'],
    },
    steps: [
      { step: 1, title: 'Real-time feature computation', description: 'Compute sliding window transaction velocity features and update Redis feature store.', code: `from pyspark.sql.functions import window, count, avg, sum as spark_sum, col, to_json, struct
import redis

# Sliding window feature computation
velocity_features = (txn_stream
    .groupBy(
        window("txn_time", "1 hour", "5 minutes"),  # sliding window
        "account_id"
    )
    .agg(
        count("*").alias("txn_count_1h"),
        spark_sum("amount").alias("total_amount_1h"),
        avg("amount").alias("avg_amount_1h"),
        count(when(col("country") != col("home_country"), True)).alias("foreign_txns_1h"),
    )
)

def update_redis_features(batch_df, batch_id):
    r = redis.Redis(host=REDIS_HOST, password=REDIS_KEY, ssl=True)
    pipe = r.pipeline()
    for row in batch_df.collect():
        key = f"features:{row.account_id}"
        pipe.hset(key, mapping={
            "txn_count_1h": row.txn_count_1h,
            "total_amount_1h": float(row.total_amount_1h),
            "avg_amount_1h": float(row.avg_amount_1h),
            "foreign_txns_1h": row.foreign_txns_1h,
        })
        pipe.expire(key, 3600)
    pipe.execute()

velocity_features.writeStream.foreachBatch(update_redis_features).trigger(processingTime="30 seconds").start()` },
      { step: 2, title: 'ML scoring with feature lookup', description: 'Fetch features from Redis and score transactions against the Azure ML endpoint.', code: `import redis
import requests
import json

r = redis.Redis(host=REDIS_HOST, password=REDIS_KEY, ssl=True)

def score_transaction(txn: dict) -> dict:
    # Fetch precomputed features (sub-millisecond lookup)
    raw = r.hgetall(f"features:{txn['account_id']}")
    features = {k.decode(): float(v) for k, v in raw.items()} if raw else {}

    payload = {
        "inputs": [{
            "amount": txn["amount"],
            "merchant_category": txn["merchant_category"],
            "country": txn["country"],
            "hour_of_day": txn["hour_of_day"],
            "txn_count_1h": features.get("txn_count_1h", 0),
            "total_amount_1h": features.get("total_amount_1h", 0),
            "avg_amount_1h": features.get("avg_amount_1h", 0),
            "foreign_txns_1h": features.get("foreign_txns_1h", 0),
        }]
    }

    resp = requests.post(
        ML_ENDPOINT_URL,
        headers={"Authorization": f"Bearer {ML_API_KEY}", "Content-Type": "application/json"},
        json=payload,
        timeout=0.15  # 150ms timeout — fail safe on SLA breach
    )
    score = resp.json()["outputs"][0]
    return {"txn_id": txn["txn_id"], "fraud_score": score, "decision": "block" if score > 0.85 else "allow"}` },
      { step: 3, title: 'Decision engine and audit trail', description: 'Apply final decision rules and write all outcomes to Delta audit table.', code: `from pyspark.sql.functions import udf, col
from pyspark.sql.types import StructType, StructField, StringType, DoubleType

SCORE_SCHEMA = StructType([
    StructField("txn_id", StringType()),
    StructField("fraud_score", DoubleType()),
    StructField("decision", StringType()),
])

score_udf = udf(lambda txn_json: score_transaction(json.loads(txn_json)), SCORE_SCHEMA)

decisions = (txn_stream
    .withColumn("score_result", score_udf(to_json(struct("*"))))
    .select("*", "score_result.txn_id", "score_result.fraud_score", "score_result.decision")
)

# Write to Delta audit table — immutable record of every decision
(decisions.writeStream
    .format("delta")
    .outputMode("append")
    .option("checkpointLocation", "/mnt/checkpoints/fraud-decisions")
    .trigger(processingTime="5 seconds")
    .toTable("gold.fraud_decisions")
)

# Block transactions: publish "block" decisions to Service Bus for payment gateway
blocked = decisions.filter(col("decision") == "block")
blocked.writeStream.foreachBatch(publish_to_service_bus).trigger(processingTime="5 seconds").start()` },
    ],
    sampleData: {
      description: 'Payment transactions with account and merchant context for fraud scoring.',
      tables: [
        { name: 'transactions', columns: ['txn_id', 'account_id', 'merchant_id', 'merchant_category', 'amount', 'currency', 'country', 'home_country', 'txn_time', 'hour_of_day'] },
        { name: 'fraud_decisions', columns: ['txn_id', 'fraud_score', 'decision', 'model_version', 'features_snapshot', 'decided_at', 'was_fraud'] },
      ],
    },
    interviewQuestions: [
      'How do you ensure the ML model responds within 200ms end-to-end?',
      'How do you handle model drift — the model degrades as fraud patterns change?',
      'What happens if Redis is unavailable — how does scoring degrade gracefully?',
      'How do you measure false positive rate in production without annoying legitimate customers?',
    ],
    interviewTalkingPoints: [
      {
        question: 'How do you ensure the ML model responds within 200ms end-to-end?',
        answer: 'The 200ms budget is decomposed: 5ms for Kafka consumer to receive the event, 2ms for Redis feature lookup (sub-millisecond in Redis Enterprise), 50ms for Azure ML managed endpoint (p99 after warm-up), 10ms for decision logic and Delta write. The critical path is the ML inference. I ensure the endpoint has minimum 2 warm instances to avoid cold start latency spikes. I set a 150ms HTTP timeout on the scoring call — if the ML endpoint exceeds this, the transaction falls back to the rule engine (which runs in <5ms). This trades some fraud detection accuracy for SLA compliance, which is the correct business trade-off.',
        followUps: [
          'How do you measure the latency budget across each component in production?',
          'What is the cold start problem for ML endpoints and how do you mitigate it?',
          'When would you choose Azure ML vs a custom FastAPI model server?',
        ],
      },
      {
        question: 'How do you handle model drift over time?',
        answer: 'Fraud patterns evolve — a model trained on Q1 data degrades by Q3 as fraudsters adapt. I track two metrics: (1) feature drift — the distribution of input features shifts compared to training data (detected with PSI or KL divergence checks); (2) label drift — the fraud rate or false positive rate in production deviates from validation metrics. When drift is detected, I trigger a retraining pipeline that uses a rolling window of the last 90 days of labelled transactions. The new model is deployed via A/B testing — 10% of transactions go to the new model, 90% to the current model — and promoted only if it improves fraud catch rate without increasing false positives over 7 days.',
        followUps: [
          'What is PSI (Population Stability Index) and when is it a useful drift signal?',
          'How do you get ground truth labels for fraud in production (fraud is confirmed days later)?',
          'How do you A/B test a fraud model without exposing customers to more fraud during the test?',
        ],
      },
      {
        question: 'What happens if Redis is unavailable when a transaction arrives?',
        answer: 'Redis unavailability means the velocity features cannot be looked up. I implement a graceful degradation strategy: if Redis returns an error or times out in 5ms, the scoring call uses zero/default values for the velocity features and adds a "missing_features: true" flag to the payload. The ML model was trained with imputed values for missing features, so it degrades to a lower-accuracy baseline rather than failing completely. Simultaneously, an alert fires to the on-call team. For the duration of the outage, the rule engine (which requires no external lookups) handles all high-confidence blocks. I do not fail the transaction — a failed scoring is never a reason to block a legitimate payment.',
        followUps: [
          'How would you implement a circuit breaker pattern for the Redis dependency?',
          'What is the fraud detection accuracy impact of missing 1-hour velocity features?',
          'How do you test the degraded-mode behaviour in a staging environment?',
        ],
      },
      {
        question: 'How do you measure false positive rate without annoying customers?',
        answer: 'Every "block" decision is recorded in the fraud_decisions Delta table with the model version and feature snapshot. Blocked customers who dispute the decision are logged as false positives. I track the false positive rate as: disputed_blocks / total_blocks over a rolling 7-day window. I also sample 1% of "allow" decisions and send them to a human review queue — this gives me a ground truth estimate of false negatives (fraud that was not caught). The key insight is that you measure FPR through customer service data, not through automated signals — a blocked transaction only reveals itself as a false positive when the customer contacts support. This means your FPR metrics always lag reality by 1-3 days.',
        followUps: [
          'How do you reduce measurement lag for false positive rate?',
          'What is the cost of a false positive vs a false negative in this context?',
          'How do you set the blocking threshold (0.85) — what process do you use?',
        ],
      },
      {
        question: 'How would you explain this project to a fraud analyst who is not technical?',
        answer: 'Every time someone makes a payment, we check three things instantly: how many times they\'ve paid in the last hour, whether this transaction looks different from their normal behaviour, and what our machine learning model says about the overall risk. If the risk score is high enough, we hold the transaction for review before it completes. We keep a record of every decision — what we saw, what score we gave it, and what we decided — so when fraud analysts review cases, they can see exactly why we flagged a transaction. This also lets us improve the model over time by comparing our predictions to what actually turned out to be fraud.',
        followUps: [
          'How would you explain a false positive to an angry customer whose transaction was blocked?',
          'What does the fraud analyst see when they review a flagged transaction?',
          'How do analyst feedback and case outcomes feed back into the model?',
        ],
      },
    ],
    resumePoints: [
      'Designed real-time fraud detection pipeline scoring 5,000 transactions/second within 200ms end-to-end latency',
      'Built sub-millisecond feature serving layer using Redis with sliding window velocity features for ML inference',
      'Implemented graceful degradation — rule engine fallback ensures zero transaction failures during ML endpoint outages',
      'Reduced fraud losses by 35% over rule-based system while cutting false positive rate from 3% to 0.8%',
      'Deployed A/B model testing framework enabling safe model updates without production fraud risk',
    ],
    challenges: [
      'ML endpoint cold-start latency spikes causing SLA breaches — solved with minimum warm instance configuration and 150ms timeout with rule-engine fallback',
      'Redis partition skew from high-activity accounts — solved with per-account key design rather than bucketed keys',
      'Ground truth labels delayed 3–5 days (fraud confirmed by investigation) — solved with Kafka-based label join pipeline that retroactively updates fraud_decisions audit table',
    ],
    productionConsiderations: [
      'Monitor ML endpoint latency p99 in real time — SLA breach at inference layer causes cascading fallback to less accurate rule engine',
      'Redis memory must be sized for the number of active accounts in the feature window — monitor memory usage and set eviction policy to volatile-lru',
      'Fraud patterns are adversarial — fraudsters probe the system to find patterns that avoid detection; never publish model features or thresholds publicly',
      'Regulatory requirement (PCI DSS) to retain all transaction decisions for 7 years — Delta table must have retention policy and immutable audit trail',
    ],
    cicdStrategy: 'ML model versioned and deployed via Azure ML model registry. Model promotion requires A/B test approval with 7-day monitoring period. Spark streaming code deployed via Azure DevOps with automated regression tests using recorded transaction replay. Zero-downtime deployment via blue/green consumer groups.',
    costOptimization: [
      'Azure ML managed endpoint minimum instances set to 2 (not 0) — cold start cost is less than SLA penalty',
      'Redis Enterprise cache sized to 90-day active account window — accounts inactive >90 days evicted, reducing Redis memory by 60%',
      'Delta audit table on hot tier for 30 days (active investigation), cool tier after — reduces storage cost by 70% for historical audit data',
    ],
    securityConsiderations: [
      'PCI DSS Level 1 compliance required — transaction data encrypted at rest and in transit; key management via Azure Key Vault HSM',
      'ML model weights treated as intellectual property — model artifacts in private Azure ML registry, not accessible to data analysts',
      'Feature store access restricted to scoring pipeline service principal — no direct analyst access to real-time account velocity features',
      'Fraud decisions audit table is append-only with immutable transaction log — Delta Lake RETAIN DELETE FILES policy prevents data tampering',
    ],
    seniorNotes: {
      juniorsMiss: [
        'The 200ms SLA must be measured end-to-end (Kafka → decision → Service Bus) not just ML inference time — many engineers only benchmark the model and miss the networking overhead',
        'Redis connection pooling is critical at 5K transactions/second — a new Redis connection per transaction will exhaust connection limits and add 10ms latency',
        'Fraud models trained on imbalanced data (0.1% fraud rate) require careful threshold selection — the default 0.5 threshold is almost always wrong for fraud use cases',
        'Storing feature snapshots in the audit table is required for model explainability and regulatory compliance — it is not optional, even under cost pressure',
      ],
      productionRealities: [
        'Fraudsters intentionally probe systems to map decision boundaries — anomalously low fraud rates for specific merchants often indicate probing, not clean traffic',
        'ML model performance degrades silently if the feature pipeline lags behind — scoring with stale features looks identical to scoring with fresh features in metrics, but accuracy drops',
        'Payment network SLAs penalise both false positives (wrongly blocked legitimate payments) and latency breaches equally — the architecture must optimise for both simultaneously',
        'Model retraining pipelines often overfit to recent fraud patterns at the expense of historical patterns that are still active — use a stratified training window rather than pure recency weighting',
      ],
      interviewersFocus: 'Fraud ML projects are high-signal because they require understanding latency constraints, ML serving infrastructure, feature store design, and business trade-offs simultaneously. Interviewers want to see you reason about the 200ms budget decomposition, not just describe the architecture. The most differentiating insight is understanding that fraud detection accuracy and false positive rate are adversarially linked — improving one degrades the other — and that the threshold setting is a business decision, not a technical one.',
    },
  },

  {
    id: 'fabric-migration',
    title: 'Fabric Lakehouse Migration',
    icon: '🏗️',
    difficulty: 'Advanced',
    duration: '4–5 days',
    tools: ['Microsoft Fabric', 'OneLake', 'Fabric Notebooks', 'Fabric Pipelines', 'Power BI Direct Lake', 'Fabric Warehouse'],
    tags: ['Microsoft Fabric', 'OneLake', 'Migration', 'Lakehouse'],
    overview: 'Migrate a production Azure Synapse Analytics + ADLS Gen2 lakehouse to Microsoft Fabric OneLake, implementing Fabric Lakehouses, Fabric Pipelines for orchestration, and Power BI Direct Lake for zero-copy semantic models.',
    businessProblem: 'A retail analytics team runs an Azure Synapse + ADLS lakehouse. Synapse Spark clusters take 4 minutes to start, Synapse Analytics integration is expensive, and maintaining separate compute, storage, and Power BI service entitlements is operationally complex. Microsoft Fabric unifies these on a single SaaS platform with OneLake as the single copy of truth, reducing operational overhead and licensing costs by an estimated 30%.',
    architecture: {
      description: 'OneLake as unified storage, Fabric Lakehouses for Bronze/Silver/Gold, Fabric Pipelines replacing ADF, Direct Lake for Power BI serving.',
      layers: [
        { name: 'OneLake', color: '#0078d4', description: 'Single logical data lake across all Fabric workloads. ADLS Gen2 data shortcuts eliminate data copies. Delta Parquet format shared across all Fabric engines.' },
        { name: 'Fabric Lakehouse', color: '#7c3aed', description: 'Bronze, Silver, Gold as separate Fabric Lakehouse items in a single workspace. Fabric Notebooks (Spark) replace Databricks notebooks.' },
        { name: 'Fabric Warehouse', color: '#2f756e', description: 'Structured relational layer over OneLake for SQL-first users. T-SQL queries on Delta tables without data movement.' },
        { name: 'Direct Lake', color: '#ffd700', description: 'Power BI semantic models read directly from OneLake Delta files — no Import or DirectQuery overhead. Automatic refresh when OneLake data changes.' },
      ],
      components: ['OneLake', 'Fabric Lakehouse', 'Fabric Notebook', 'Fabric Pipeline', 'Fabric Warehouse', 'Power BI Direct Lake', 'Fabric Data Activator'],
    },
    steps: [
      { step: 1, title: 'Set up Fabric workspace and lakehouses', description: 'Create Bronze, Silver, Gold Fabric Lakehouses and configure OneLake shortcuts to existing ADLS data.', code: `# Fabric REST API — create workspace and lakehouses
# (typically done via Fabric portal or Power BI REST API)

# OneLake shortcut: point to existing ADLS without data copy
# In Fabric Lakehouse UI: Files → New shortcut → Azure Data Lake Storage Gen2
# shortcut_config = {
#   "name": "raw_sales",
#   "type": "AdlsGen2",
#   "location": "https://storageaccount.dfs.core.windows.net/raw/sales/",
#   "credential": { "type": "ServicePrincipal", ... }
# }

# After shortcut creation, files appear in Lakehouse but no data is copied
# Spark can query the shortcut path directly:
df = spark.read.format("delta").load("Files/raw_sales/")
display(df.limit(10))

# Register existing Delta tables from ADLS into Fabric Lakehouse catalog
spark.sql("""
    CREATE TABLE IF NOT EXISTS bronze.sales_raw
    USING DELTA
    LOCATION 'Files/raw_sales/'
""")` },
      { step: 2, title: 'Migrate Synapse Spark notebooks to Fabric', description: 'Convert Synapse notebooks to Fabric notebooks — most PySpark code works unchanged.', code: `# Key differences: Synapse vs Fabric Notebooks
# 1. Mount points: Synapse uses dbutils.fs.mount() — Fabric uses direct OneLake paths
# 2. Synapse: "/mnt/raw/sales/"  →  Fabric: "Files/raw_sales/" (relative to Lakehouse)
# 3. Spark session is pre-configured in Fabric — no spark.conf setup needed
# 4. Fabric Lakehouse tables available via: spark.table("bronze.sales_raw")

# Synapse version (OLD):
df = spark.read.parquet("/mnt/raw/sales/2024-01-15/")

# Fabric version (NEW):
df = spark.read.parquet("Files/raw_sales/2024-01-15/")

# Or using Delta table registered in Fabric catalog:
df = spark.table("bronze.sales_raw").filter("order_date = '2024-01-15'")

# Writing to Fabric Lakehouse (creates managed Delta table):
df.write.format("delta").mode("overwrite").saveAsTable("silver.sales_cleaned")` },
      { step: 3, title: 'Fabric Pipeline replacing ADF', description: 'Recreate ADF orchestration pipeline in Fabric Pipelines — UI is nearly identical to ADF.', code: `# Fabric Pipeline activities available:
# - Copy Data (same as ADF Copy Activity)
# - Notebook (same as ADF Databricks Notebook)
# - Dataflow Gen2 (Power Query visual ETL — unique to Fabric)
# - Stored Procedure (Fabric Warehouse)
# - Delete Data, Web, Lookup, etc.

# Key difference: Fabric Pipelines use workspace-level Linked Services
# called "Connections" — no IR (Integration Runtime) needed for OneLake sources

# Example pipeline JSON (Fabric native format):
pipeline_def = {
    "activities": [
        {
            "name": "RunBronzeNotebook",
            "type": "TridentNotebook",
            "typeProperties": {
                "notebookId": "bronze-ingest-notebook-guid",
                "workspaceId": "workspace-guid",
            }
        },
        {
            "name": "RunSilverNotebook",
            "type": "TridentNotebook",
            "dependsOn": [{"activity": "RunBronzeNotebook", "dependencyConditions": ["Succeeded"]}],
            "typeProperties": {
                "notebookId": "silver-transform-notebook-guid",
            }
        }
    ]
}` },
      { step: 4, title: 'Power BI Direct Lake semantic model', description: 'Create Direct Lake semantic model on Gold Lakehouse tables — no data refresh needed.', code: `# Direct Lake mode reads Delta Parquet files directly from OneLake
# No data copy into Power BI dataset (unlike Import mode)
# No live query to source (unlike DirectQuery mode)

# Create semantic model via Tabular Object Model (TOM) or Fabric REST API
# Direct Lake framing query connects semantic model to Lakehouse table:

framing_query = """
SELECT
    d.store_id,
    d.order_date,
    d.product_category,
    d.total_revenue,
    d.order_count,
    d.avg_order_value
FROM gold.daily_sales d
"""

# Direct Lake model is automatically refreshed when:
# - OneLake Delta table files change (detected by Delta log scan)
# - No manual refresh needed unlike Import mode

# Performance note: Direct Lake uses "frame" concept
# If table is not framed (too many partitions), falls back to DirectQuery
# Monitor: Fabric Monitoring Hub → Semantic Model → Direct Lake events` },
      { step: 5, title: 'Validate migration and benchmark', description: 'Run parallel queries on Synapse and Fabric to validate data parity and benchmark performance.', code: `# Validation: compare row counts across all tables
validation_queries = [
    "SELECT COUNT(*) FROM bronze.sales_raw",
    "SELECT COUNT(*) FROM silver.sales_cleaned",
    "SELECT SUM(total_revenue) FROM gold.daily_sales",
    "SELECT COUNT(DISTINCT store_id) FROM gold.daily_sales",
]

for query in validation_queries:
    synapse_result = run_on_synapse(query)
    fabric_result = spark.sql(query).collect()[0][0]
    status = "PASS" if synapse_result == fabric_result else "FAIL"
    print(f"{status}: {query[:50]}... Synapse={synapse_result}, Fabric={fabric_result}")

# Performance benchmark: compare query latency
import time

for query in validation_queries:
    start = time.time()
    spark.sql(query).collect()
    latency_ms = (time.time() - start) * 1000
    print(f"Fabric latency: {latency_ms:.0f}ms — {query[:50]}")` },
    ],
    sampleData: {
      description: 'Retail sales data migrated from Synapse/ADLS to Fabric OneLake.',
      tables: [
        { name: 'sales_raw', columns: ['order_id', 'store_id', 'customer_id', 'product_id', 'amount', 'order_date', 'status'] },
        { name: 'daily_sales', columns: ['store_id', 'order_date', 'product_category', 'total_revenue', 'order_count', 'avg_order_value'] },
        { name: 'migration_validation', columns: ['table_name', 'synapse_count', 'fabric_count', 'synapse_checksum', 'fabric_checksum', 'validation_status'] },
      ],
    },
    interviewQuestions: [
      'What is OneLake and how does it differ from ADLS Gen2?',
      'What is Direct Lake mode and how does it compare to Import and DirectQuery?',
      'What are the key differences between Fabric Lakehouse and Databricks Delta Lake?',
      'How would you decide between Fabric Lakehouse vs Fabric Warehouse for a given workload?',
    ],
    interviewTalkingPoints: [
      {
        question: 'What is OneLake and how does it differ from ADLS Gen2?',
        answer: 'OneLake is a single logical data lake that spans an entire Microsoft Fabric tenant. Every Fabric item — Lakehouses, Warehouses, Semantic Models — reads and writes to the same OneLake storage, which is physically backed by ADLS Gen2. The key difference from raw ADLS is the abstraction layer: you never manage ADLS containers, access tiers, or firewalls directly. OneLake handles storage management and provides the folder hierarchy (workspace → item → Files/Tables). Shortcuts allow OneLake to reference external storage (other tenants, ADLS accounts, S3) without copying data. Think of OneLake as the "one storage account to rule them all" for the entire Fabric platform.',
        followUps: [
          'What is a OneLake shortcut and when would you use it vs copying data?',
          'How does OneLake handle multi-tenant data isolation?',
          'What storage format does OneLake use natively?',
        ],
      },
      {
        question: 'What is Direct Lake mode and how does it compare to Import and DirectQuery?',
        answer: 'Import mode copies data from the source into a Power BI compressed in-memory cache (VertiPaq). Queries are fast, but data is stale and requires scheduled refresh (max 48x/day). DirectQuery sends every visual query to the source in real time — always fresh, but each interaction triggers a source query, which is slow and puts load on the source. Direct Lake reads Delta Parquet files directly from OneLake without importing them into VertiPaq memory. It is as fast as Import because the data is pre-compressed Delta files, but it does not need scheduled refresh — the model detects Delta log changes and "faults in" new data on the next query. The limitation: if the Delta table has too many partitions, Power BI falls back to DirectQuery mode automatically.',
        followUps: [
          'What is "framing" in the context of Direct Lake and why does it matter?',
          'How does Direct Lake handle datasets too large to fit in memory?',
          'What is the maximum file count before Direct Lake falls back to DirectQuery?',
        ],
      },
      {
        question: 'How would you decide between Fabric Lakehouse vs Fabric Warehouse?',
        answer: 'Fabric Lakehouse uses Apache Spark as the compute engine — it is the right choice for large-scale data engineering workloads, complex transformations, schema evolution, and streaming ingestion. It stores data as open-format Delta Parquet files that any Spark-compatible tool can read. Fabric Warehouse uses T-SQL compute (similar to Synapse Dedicated SQL Pool) — it is the right choice for SQL analysts, BI teams, and workloads that need stored procedures, views, and traditional relational semantics. Both read from OneLake, so data created in the Lakehouse is immediately queryable in the Warehouse via the SQL analytics endpoint. In practice, engineering teams use Lakehouse and analyst teams use Warehouse, with OneLake as the shared storage layer.',
        followUps: [
          'What is the SQL analytics endpoint in a Fabric Lakehouse?',
          'When would you choose Fabric over Databricks for a new greenfield project?',
          'How does Fabric Warehouse compare to Azure Synapse Dedicated SQL Pool?',
        ],
      },
      {
        question: 'What are the migration risks from Synapse to Fabric?',
        answer: 'The four main risks are: (1) Spark version compatibility — Fabric runs Spark 3.4+ and some Synapse code written for older Spark versions has API differences. (2) Mount point vs OneLake path changes — all /mnt/ references in Synapse notebooks must be updated to OneLake paths. (3) Integration Runtime replacement — Synapse uses IR for on-premises and cross-network data movement; Fabric uses a different connectivity model (Virtual Network Data Gateway) which requires separate licensing. (4) Feature gaps — Synapse has mature streaming capabilities (Synapse Link) that Fabric is still developing. I mitigate these by running Synapse and Fabric in parallel for 4 weeks, comparing outputs row-by-row, before cutting over.',
        followUps: [
          'How do you handle private endpoints and VNet integration in Fabric?',
          'What Synapse features do not have direct equivalents in Fabric?',
          'How would you roll back if the Fabric migration causes a data quality issue post-cutover?',
        ],
      },
      {
        question: 'How does Microsoft Fabric licensing differ from Azure Synapse?',
        answer: 'Azure Synapse uses a pay-as-you-go model: you pay separately for Spark clusters (per vCore-hour), SQL pools (per DWU-hour), and Data Factory pipelines (per activity run). Microsoft Fabric uses a capacity model: you buy F-SKU capacity (F2, F4, F8, F16, F32, F64, F128) that provides a pool of Compute Units shared across all Fabric workloads. One F64 SKU (roughly equivalent to a Power BI P2 Premium capacity) provides compute for Spark notebooks, pipelines, Warehouses, and Power BI in a single monthly fee. For organisations already paying for Power BI Premium, Fabric is often cost-neutral or cheaper — the Fabric capacity replaces the Premium capacity and adds all the data engineering workloads. The catch: burst workloads can exhaust capacity and throttle other workloads if not managed carefully.',
        followUps: [
          'What happens when a Fabric capacity is overloaded — does it scale automatically?',
          'How does Fabric capacity smoothing work?',
          'How would you right-size a Fabric F-SKU for a workload you are migrating from Synapse?',
        ],
      },
    ],
    resumePoints: [
      'Led migration of production Azure Synapse lakehouse to Microsoft Fabric OneLake, eliminating separate compute/storage/BI service entitlements',
      'Implemented OneLake shortcuts for zero-copy data access from existing ADLS Gen2 storage, avoiding multi-petabyte data movement',
      'Deployed Power BI Direct Lake semantic models achieving real-time data freshness without scheduled refresh overhead',
      'Reduced infrastructure operational complexity by 60% and estimated platform costs by 30% through Fabric capacity consolidation',
      'Validated migration correctness with automated row-count and checksum comparison across all tables before production cutover',
    ],
    challenges: [
      'Spark version differences between Synapse 3.1 and Fabric 3.4 — required fixing deprecated API calls in 12 notebooks',
      'Power BI Direct Lake falling back to DirectQuery on large partition Gold tables — resolved by implementing table partitioning within Direct Lake framing limits',
      'VNet Integration Runtime replacement — Fabric Virtual Network Gateway has different authentication model requiring service principal re-provisioning',
    ],
    productionConsiderations: [
      'Fabric capacity is shared — a runaway notebook can throttle all other workloads in the capacity; configure notebook session limits and monitor CU consumption',
      'OneLake shortcuts are read-only for data source files — writes must go through native Fabric storage; plan write paths carefully in hybrid migration periods',
      'Direct Lake falls back to DirectQuery silently when framing conditions are violated — monitor Direct Lake events in Fabric Monitoring Hub to detect regressions',
      'Fabric is a SaaS service with shared infrastructure — planned maintenance windows may affect availability; design pipelines with retry logic for Fabric-initiated interruptions',
    ],
    cicdStrategy: 'Fabric workspace items (Notebooks, Pipelines, Semantic Models) deployed via Fabric Git Integration (GitHub or Azure DevOps). Workspace items exported as JSON definitions stored in Git. Promotion from dev to prod workspace via pull request approval + automated validation pipeline that runs data quality checks against staging data.',
    costOptimization: [
      'OneLake shortcuts eliminate data copy costs — existing ADLS data is queryable from Fabric without duplicating storage',
      'Direct Lake eliminates Power BI Import refresh compute cost — no scheduled refresh jobs, no Import storage duplication',
      'Fabric capacity smoothing spreads burst usage over 24 hours — occasional large jobs do not require over-provisioning the F-SKU',
    ],
    securityConsiderations: [
      'OneLake data access governed by Fabric workspace roles — workspace Admin/Member/Contributor/Viewer controls data access',
      'Fabric workspace identity isolation — data in different workspaces is logically separated even within the same Fabric capacity',
      'Service Principal authentication for pipeline connections — no interactive user credentials in automated pipelines',
      'Microsoft Purview integration available for unified data governance across OneLake and external sources',
    ],
    seniorNotes: {
      juniorsMiss: [
        'Fabric capacity is a shared resource — a poorly sized notebook that runs for hours will cause throttling that affects Power BI reports and other pipelines in the same capacity',
        'OneLake shortcuts are read-through, not read-optimised — querying a shortcut to ADLS without Delta format will not benefit from Delta data skipping and will be slow',
        'Fabric Git Integration exports workspace items as JSON but does not version data — the item definitions and the data have separate change management, and they can get out of sync',
        'Direct Lake "framing" is a Power BI concept that limits which data is in scope for the model — misunderstanding framing leads to semantic models that appear correct but quietly exclude data',
      ],
      productionRealities: [
        'Fabric is a rapidly evolving product — features announced at Microsoft Build may be in preview for 12+ months before they are production-ready; verify GA status before committing to a feature in a production architecture',
        'Fabric capacity smoothing means burst jobs do not cause immediate throttling — but they do accumulate "CU debt" that causes throttling hours later, which is harder to debug',
        'The Fabric Lakehouse SQL analytics endpoint (T-SQL over Delta) has significant query plan differences from Synapse SQL Dedicated Pool — do not assume queries will perform the same after migration',
        'Fabric workload isolation (separate workspaces per team) increases governance overhead — each workspace has separate capacity allocation, permissions, and monitoring, which multiplies admin effort',
      ],
      interviewersFocus: 'Fabric migration projects signal whether you understand the Microsoft data platform landscape and the strategic reasons organisations are moving to Fabric. Interviewers will test whether you know the actual differences between Fabric and Databricks, when to choose each, and what the real migration risks are. The highest-signal answer demonstrates you have a nuanced view of Fabric\'s maturity — acknowledging that it is genuinely powerful for certain workloads while being honest about the feature gaps and the shared-capacity operational model that differs significantly from Azure IaaS.',
    },
  },
];
