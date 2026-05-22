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
  },
];
