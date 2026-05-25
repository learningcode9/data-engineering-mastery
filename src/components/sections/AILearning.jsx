import { memo, useState, useMemo } from 'react';
import { useLocalStorage } from '../../hooks/useLocalStorage.js';
import { topics as ALL_TOPICS } from '../../data/topics.js';
import { useLearningMemory } from '../../hooks/useLearningMemory.js';

// ─── helpers ────────────────────────────────────────────────────────────────

function computeTopicProgress(practiceProgress) {
  return ALL_TOPICS.map(t => {
    const sections = t.module?.sections ?? [];
    const practisable = sections.filter(s => s.subtopics.some(st => st.practice));
    if (!practisable.length) return { id: t.id, title: t.title, pct: 0 };
    const done = practisable.filter(s =>
      s.subtopics.filter(st => st.practice).every(st => !!practiceProgress?.[st.id])
    ).length;
    return { id: t.id, title: t.title, pct: Math.round((done / practisable.length) * 100) };
  });
}

// ─── Daily Tips ──────────────────────────────────────────────────────────────

const DAILY_TIPS = [
  { day: 0, tip: 'Always partition large tables by date — it cuts query costs by 90% in most cases.', icon: '◈' },
  { day: 1, tip: 'Use EXPLAIN ANALYZE before optimizing a query. Never guess where the bottleneck is.', icon: '◎' },
  { day: 2, tip: 'Idempotent pipelines are safer: design every step so it can run twice without creating duplicates.', icon: '⟳' },
  { day: 3, tip: 'Delta Lake MERGE is more efficient than DELETE + INSERT — use it for SCD Type 2 patterns.', icon: '◆' },
  { day: 4, tip: 'Add row count and null checks as post-load validations — catch data quality issues before analysts do.', icon: '✦' },
  { day: 5, tip: 'Broadcast joins in Spark avoid shuffle when one table is small (< 10 MB). Use broadcast() hint.', icon: '⚡' },
  { day: 6, tip: 'Document your DAGs with clear task descriptions and SLAs — future-you will thank you.', icon: '◑' },
];

// ─── Contextual response engine ───────────────────────────────────────────────
// Each entry: { match[], title, summary, body[{label,text,warn?}], code?, next[] }

const TOPIC_RESPONSES = [
  {
    match: ['data engineering', 'what is data engineering', 'why data engineering', 'data engineer role', 'career in data'],
    title: 'Data Engineering',
    summary: 'Data engineers build the infrastructure and pipelines that make data usable by analysts, scientists, and business stakeholders.',
    body: [
      { label: 'What it is', text: 'Data engineering is the practice of designing, building, and maintaining the systems that move data reliably from source systems (databases, APIs, event streams) to analytical destinations (data warehouses, lakehouses) in a clean, consistent, and timely way. The three core responsibilities: ingestion, transformation, and serving.' },
      { label: 'Real-world analogy', text: 'Data engineers are the plumbers of a city\'s water system. Analysts are the taps that deliver water to end users. Data engineers build and maintain the pipes, treatment plants (transformations), and reservoirs (warehouses). Without them, analysts have no clean, reliable data.' },
      { label: 'Business importance', text: 'Every company using data for decisions depends on data engineering. Poor pipelines cause incorrect dashboards, wrong ML training data, and missed SLAs. Companies like Netflix, Uber, and Airbnb have hundreds of data engineers — because data infrastructure at scale is a serious engineering discipline.' },
      { label: 'Interview angle', text: 'Describe data engineering as "the bridge between raw operational data and analytics-ready data." Mention the three key responsibilities: ingestion (getting data in), transformation (cleaning and modeling), and serving (delivering to consumers). Always tie your answer to a specific production example.' },
      { label: 'Common mistake', text: 'Confusing data engineering with data science. Data engineers build tools and infrastructure; data scientists use those tools to build models. The roles use different skills and require different expertise.', warn: true },
    ],
    next: ['Start the SQL module — SQL is the foundational DE language', 'Learning Path → Foundations phase'],
  },
  {
    match: ['window function', 'window functions', 'row_number', 'rank(', 'dense_rank', 'lag(', 'lead(', 'partition by', 'over(', 'over (', 'running total', 'running sum'],
    title: 'Window Functions',
    summary: 'Compute aggregations or rankings across related rows without collapsing them the way GROUP BY does.',
    body: [
      { label: 'What it is', text: 'Window functions apply a calculation across a "window" of rows related to the current row. Unlike GROUP BY which collapses to one row per group, window functions add a computed column while keeping every original row. Syntax: FUNCTION() OVER (PARTITION BY col ORDER BY col).' },
      { label: 'The key functions', text: 'ROW_NUMBER() — unique sequential rank, no ties. RANK() — ties get same rank, next rank skips (1,1,3). DENSE_RANK() — ties get same rank, no gaps (1,1,2). LAG(col,n) — value from n rows before. LEAD(col,n) — value from n rows ahead. SUM/AVG OVER ORDER BY — running totals and moving averages.' },
      { label: 'Real-world analogy', text: 'Ranking salespeople by revenue within each region. GROUP BY gives you total revenue per region. A window function gives you each salesperson\'s row PLUS their rank within their region — individual detail and the group aggregate at the same time.' },
      { label: 'Interview angle', text: 'Classic interview questions: "Remove duplicates keeping the most recent row" (ROW_NUMBER + CTE, WHERE rn = 1). "Rank products by sales per category" (RANK OVER PARTITION BY). "Calculate a 7-day rolling average" (AVG OVER ROWS BETWEEN 6 PRECEDING AND CURRENT ROW). Window functions separate candidates who know SQL from those who\'ve mastered it.' },
      { label: 'Common mistake', text: 'Reaching for GROUP BY when you need per-row results AND an aggregate. If you need both, that\'s a window function. GROUP BY is only for when you genuinely want one summary row per group.', warn: true },
    ],
    code: 'SELECT name, department, salary,\n  RANK() OVER (PARTITION BY department ORDER BY salary DESC) as dept_rank,\n  AVG(salary) OVER (PARTITION BY department) as dept_avg,\n  SUM(salary) OVER (ORDER BY hire_date) as running_payroll\nFROM employees;',
    next: ['SQL Lab → "Running Total" challenge (SUM OVER)', 'SQL Lab → "Deduplicate with CTE" uses ROW_NUMBER'],
  },
  {
    match: ['delta lake', 'delta table', 'delta format', 'acid', 'time travel', 'merge into', 'z-order', 'zorder', 'optimize', 'vacuum', 'transaction log'],
    title: 'Delta Lake',
    summary: 'An open storage layer that adds ACID transactions, schema enforcement, and time travel to data lakes.',
    body: [
      { label: 'What it is', text: 'Delta Lake stores data as Parquet files plus a transaction log (_delta_log/). Every write — INSERT, UPDATE, DELETE, MERGE — creates a new JSON log entry. This log enables ACID guarantees, time travel (VERSION AS OF N), schema evolution, and concurrent writer safety. Plain Parquet has none of these.' },
      { label: 'Real-world analogy', text: 'Delta Lake is Git for data. Each commit is a transaction log entry. You can check out any previous version, see what changed, and safely roll back. Plain Parquet is like an unversioned folder of files — no history, no atomicity, no safe concurrent writes.' },
      { label: 'Key operations', text: 'MERGE: upsert in one atomic step (insert if new, update if matched). OPTIMIZE: compacts many small files into large ones — solves the small file problem from frequent streaming writes. ZORDER: physically co-locates data by filter columns for faster reads. VACUUM: removes old file versions beyond the retention window (default 7 days — never lower it).' },
      { label: 'Interview angle', text: 'Know the "small file problem": frequent streaming writes create thousands of tiny Parquet files, making reads slow. Delta OPTIMIZE solves this. Also explain ACID in context: plain data lakes have no concurrency control — two concurrent writers corrupt each other\'s data. Delta\'s transaction log prevents this.' },
      { label: 'Common mistake', text: 'Running VACUUM with retention of 0 hours. This deletes all historical versions immediately, breaks time travel, and violates Delta Lake\'s concurrency guarantees. Default retention is 7 days. Never go below 7 days in production.', warn: true },
    ],
    code: '-- Upsert with MERGE\nMERGE INTO target t USING source s ON t.id = s.id\nWHEN MATCHED THEN UPDATE SET t.status = s.status, t.updated_at = s.updated_at\nWHEN NOT MATCHED THEN INSERT *;\n\n-- Compact small files and co-locate by filter column\nOPTIMIZE orders ZORDER BY (customer_id, order_date);\n\n-- Read historical version\nSELECT * FROM orders VERSION AS OF 10;',
    next: ['Databricks lab → run Delta Lake MERGE interactively', 'Interview Prep → Databricks category'],
  },
  {
    match: ['spark', 'pyspark', 'dataframe', 'rdd', 'broadcast', 'shuffle', 'executor', 'catalyst', 'aqe', 'repartition', 'coalesce', 'narrow transformation', 'wide transformation'],
    title: 'Apache Spark & PySpark',
    summary: 'Distributed processing engine for large-scale data transformations — the backbone of modern data lakehouses.',
    body: [
      { label: 'What it is', text: 'Spark distributes data and computation across a cluster. The driver creates a logical execution plan; executors run tasks in parallel across partitions. DataFrames are the primary API — they use the Catalyst optimizer (converts DataFrame ops to an optimal physical plan) and Tungsten (efficient memory management). RDDs are the low-level API — avoid unless you need custom serialization.' },
      { label: 'Narrow vs wide transformations', text: 'Narrow: each input partition maps to exactly one output partition — filter, select, withColumn. Fast, no network I/O. Wide: data must move between partitions (shuffle) — join, groupBy, distinct, repartition. Slow, triggers network data exchange. Minimizing wide transformations is the #1 Spark optimization. This is a classic interview question.' },
      { label: 'Performance essentials', text: 'Broadcast joins: if one table is < 10 MB, send a copy to every executor — eliminates shuffle entirely. AQE (Spark 3+): automatically adjusts partition counts, broadcast thresholds, and skew handling at runtime. Avoid collect() on large DataFrames — it pulls everything to the driver and crashes it. Cache DataFrames you reuse with df.cache() before the first action.' },
      { label: 'Interview angle', text: '"Explain the difference between narrow and wide transformations." Narrow = no shuffle, fast. Wide = shuffle, expensive. "How do you optimize a slow Spark join?" Check for data skew (one partition 10× larger than others), use broadcast if one side is small, repartition on the join key before joining, enable AQE.' },
      { label: 'Common mistake', text: 'Calling df.count(), df.show(), or df.collect() inside a loop. Each call triggers a full DAG recomputation from scratch. Cache the DataFrame before the loop — df.cache() — or restructure the logic to avoid repeated full scans.', warn: true },
    ],
    code: 'from pyspark.sql import functions as F\nfrom pyspark.sql.window import Window\n\n# Broadcast join (eliminates shuffle for small table)\ndf_joined = df_orders.join(F.broadcast(df_customers), "customer_id")\n\n# Repartition on join key before large-table join\ndf_large = df_large.repartition(200, "customer_id")\n\n# Window function in PySpark\nw = Window.partitionBy("department").orderBy(F.desc("salary"))\ndf.withColumn("rank", F.rank().over(w)).show()',
    next: ['Interview Prep → PySpark category', 'Databricks lab for hands-on Spark practice'],
  },
  {
    match: ['cte', 'common table expression', 'with clause', 'with statement', 'recursive cte'],
    title: 'CTEs (Common Table Expressions)',
    summary: 'Named subqueries that make complex SQL readable, debuggable, and reusable — defined before the main query with WITH.',
    body: [
      { label: 'What it is', text: 'A CTE is defined as WITH name AS (SELECT ...) before the main query. Chain multiple CTEs with commas: WITH cte1 AS (...), cte2 AS (...) SELECT .... Each CTE is a logical step you can name, reference by name, and debug independently by selecting from it directly.' },
      { label: 'Real-world analogy', text: 'CTEs are scratch pads. Instead of nesting five subqueries inside each other — a Russian doll nightmare to read and debug — you write each logical step on its own named page, then reference those pages in the final query. The query reads like prose: first I rank orders, then I filter to rank 1, then I join to customers.' },
      { label: 'CTEs vs subqueries vs temp tables', text: 'CTE: readable, scoped to the query, most databases re-execute per reference (not cached). Subquery: same performance, harder to read. Temp table: physically materialized — use when the intermediate result is large AND referenced multiple times, since CTEs recompute on each reference in most engines.' },
      { label: 'Interview angle', text: 'The classic CTE question: "Remove duplicate rows keeping the most recent per ID." Answer: WITH ranked AS (SELECT *, ROW_NUMBER() OVER (PARTITION BY id ORDER BY updated_at DESC) AS rn FROM table), SELECT * FROM ranked WHERE rn = 1. Know this cold.' },
      { label: 'Common mistake', text: 'Assuming a CTE is always materialized/cached. In PostgreSQL and BigQuery a CTE referenced 3× is executed 3× — tripling query cost. For large intermediate results referenced multiple times, use a temp table or dbt ephemeral model instead.', warn: true },
    ],
    code: 'WITH\nordersRanked AS (\n  SELECT *,\n    ROW_NUMBER() OVER (PARTITION BY customer_id ORDER BY created_at DESC) as rn\n  FROM orders\n),\nlatestOrders AS (\n  SELECT * FROM ordersRanked WHERE rn = 1\n)\nSELECT c.customer_name, o.amount, o.status\nFROM customers c\nINNER JOIN latestOrders o ON c.customer_id = o.customer_id;',
    next: ['SQL Lab → "Deduplicate with CTE" challenge', 'SQL Lab → "Running Total" for window functions inside CTEs'],
  },
  {
    match: ['scd', 'slowly changing', 'type 2', 'type 1', 'dimension history', 'surrogate key', 'effective date', 'is_current', 'expiry date'],
    title: 'Slowly Changing Dimensions (SCD)',
    summary: 'Strategies for tracking how dimension data (customer, product, employee) changes over time in a data warehouse.',
    body: [
      { label: 'The types', text: 'Type 1: overwrite old value — no history preserved, simplest. Type 2: insert a new row per change with effective_date, expiry_date, and is_current flag — full history, the industry standard. Type 3: add a previous_value column — limited (only one version back). Type 6: combines 1+2+3. In practice: use Type 2 for anything where historical accuracy matters — customer segments, product prices, employee roles.' },
      { label: 'Real-world analogy', text: 'A customer moves from Austin to Dallas. Type 1: update the city field — Austin is gone forever. Type 2: close the Austin row (is_current=false, expiry_date=today) and insert a new Dallas row (is_current=true, effective_date=today). All historical orders still link to Austin via the old surrogate key. Revenue by city for last year remains accurate.' },
      { label: 'Implementation with MERGE', text: 'The correct production pattern: one MERGE statement that simultaneously closes the old row (SET is_current = false, expiry_date = CURRENT_DATE - 1) and inserts the new row. This is atomic — no window where the table has neither the old nor new version. Delta Lake MERGE handles this in a single operation.' },
      { label: 'Interview angle', text: '"Walk me through SCD Type 2." Key points to cover: surrogate key (sk) vs natural key (id), the MERGE implementation, querying current state (WHERE is_current = true), querying at a point in time (WHERE report_date BETWEEN effective_date AND expiry_date), and handling late-arriving events (update timestamp before current effective_date).' },
      { label: 'Common mistake', text: 'Querying a Type 2 table without a filter — SELECT * FROM dim_customer WHERE id = 123 returns multiple rows (one per version). Always add WHERE is_current = true or a date range filter. Forgetting this in a JOIN causes fan-out and wrong aggregations.', warn: true },
    ],
    code: '-- SCD Type 2 schema\nCREATE TABLE dim_customer (\n  customer_sk    BIGINT PRIMARY KEY,   -- surrogate key\n  customer_id    INT,                  -- natural key\n  name           VARCHAR,\n  city           VARCHAR,\n  effective_date DATE NOT NULL,\n  expiry_date    DATE DEFAULT \'9999-12-31\',\n  is_current     BOOLEAN DEFAULT TRUE\n);\n\n-- Always filter to current or point-in-time\nSELECT * FROM dim_customer\nWHERE customer_id = 42 AND is_current = TRUE;',
    next: ['Interview Prep → Data Modeling for SCD questions', 'Projects section → Medallion pipeline uses SCD2'],
  },
  {
    match: ['airflow', 'dag', 'orchestration', 'adf', 'data factory', 'trigger', 'schedule', 'pipeline orchestration', 'task dependency', 'operator', 'pythonoperator'],
    title: 'Orchestration — Airflow & ADF',
    summary: 'Schedule, coordinate, and monitor pipeline tasks — ensuring Task B only runs after Task A succeeds.',
    body: [
      { label: 'What it is', text: 'Orchestration tools manage task scheduling, dependency chains, retries, and failure alerts. Apache Airflow defines pipelines as Python DAGs (Directed Acyclic Graphs) of Operators. Azure Data Factory is the managed cloud equivalent — GUI-driven, Azure-native, with built-in connectors and Integration Runtime for hybrid connectivity.' },
      { label: 'Airflow vs ADF', text: 'Airflow: Python-based, unlimited flexibility, any cloud or on-prem, requires infrastructure management. Best for complex logic, custom operators, cross-cloud pipelines. ADF: click-to-configure, Azure-native, no infra to manage, limited extensibility. Best for Azure-only workloads and teams without Python expertise.' },
      { label: 'Real-world analogy', text: 'Cooking a meal. You can\'t plate before cooking; can\'t cook before prepping. An orchestrator manages this dependency chain — runs steps in order, retries if the oven breaks, and alerts when dinner is ready or burned. The DAG is the recipe; tasks are the steps.' },
      { label: 'Interview angle', text: '"Design a pipeline that extracts from an API, transforms in Spark, loads to Synapse." Airflow DAG: extract_task (PythonOperator) → transform_task (SparkSubmitOperator) → load_task (SqlOperator). Key parameters: retries=3, retry_delay=timedelta(minutes=5), email_on_failure=True, SLA=timedelta(hours=2). Always mention SLAs and alerting.' },
      { label: 'Common mistake', text: 'Putting business logic inside Airflow tasks — processing 10 million rows inside a PythonOperator on the Airflow worker. Airflow is an orchestrator, not a compute engine. Tasks should call Spark, dbt, or a subprocess — not do the heavy processing themselves.', warn: true },
    ],
    code: 'from airflow import DAG\nfrom airflow.operators.python import PythonOperator\nfrom airflow.providers.apache.spark.operators.spark_submit import SparkSubmitOperator\nfrom datetime import datetime, timedelta\n\ndefault_args = {"retries": 2, "retry_delay": timedelta(minutes=5), "email_on_failure": True}\n\nwith DAG("orders_etl", default_args=default_args,\n         start_date=datetime(2024,1,1), schedule="0 6 * * *") as dag:\n    extract = PythonOperator(task_id="extract_api", python_callable=extract_fn)\n    transform = SparkSubmitOperator(task_id="spark_transform", application="jobs/transform.py")\n    extract >> transform',
    next: ['Interview Prep → Orchestration & ADF category', 'Projects → build an Airflow DAG for a real dataset'],
  },
  {
    match: ['kafka', 'streaming', 'real-time', 'event streaming', 'stream processing', 'event hub', 'eventstream', 'consumer group', 'producer', 'offset', 'topic partition'],
    title: 'Kafka & Stream Processing',
    summary: 'Process data continuously as events happen — millisecond latency instead of hourly batch runs.',
    body: [
      { label: 'What it is', text: 'Kafka is a distributed event streaming platform. Producers write messages to topics; consumers read from topics at their own pace via consumer groups. Topics are partitioned (unit of parallelism) and replicated (fault tolerance). Kafka retains messages for a configurable period (default 7 days) — consumers can replay events from any offset. Azure equivalent: Event Hubs (Kafka-compatible API).' },
      { label: 'Real-world analogy', text: 'Kafka is a river. Producers (rain) continuously pour water in. Consumers (farms) tap at their own rate. The river stores water — if a farm\'s pump breaks for 2 hours, it can catch up. Compare to batch ETL which is like filling a reservoir once a day and draining it completely.' },
      { label: 'When to use streaming vs batch', text: 'Use streaming when: latency matters (fraud detection needs seconds, not hours), data is continuous (IoT, clickstreams, payments), or you need real-time joins. Use batch when: hourly/daily latency is acceptable, data is naturally batch (monthly files, daily DB dumps), or cost is constrained. Streaming is 3-5× more complex and expensive — choose it deliberately.' },
      { label: 'Interview angle', text: '"Kafka vs batch — which do you use for a fraud detection system?" Answer: streaming, because fraud must be caught in seconds. Key tradeoffs: streaming adds exactly-once semantics complexity, schema registry management, consumer lag monitoring, and always-on infrastructure. Explain the choice, don\'t just pick one.' },
      { label: 'Common mistake', text: 'Using streaming for everything because it sounds modern. A daily revenue dashboard does not need Kafka. Streaming adds schema registry, consumer group coordination, offset management, and always-on infrastructure costs. Over-engineering with streaming for batch use cases is a common anti-pattern.', warn: true },
    ],
    code: 'from kafka import KafkaProducer, KafkaConsumer\nimport json\n\n# Producer\nproducer = KafkaProducer(\n    bootstrap_servers=["broker:9092"],\n    value_serializer=lambda v: json.dumps(v).encode()\n)\nproducer.send("orders", {"order_id": 12345, "amount": 99.99})\n\n# Consumer\nconsumer = KafkaConsumer(\n    "orders", bootstrap_servers=["broker:9092"],\n    group_id="orders-processor", auto_offset_reset="earliest"\n)\nfor msg in consumer:\n    process(json.loads(msg.value))',
    next: ['Interview Prep → Streaming & Kafka category', 'Streaming module in the Learning Path'],
  },
  {
    match: ['databricks', 'unity catalog', 'autoloader', 'all-purpose cluster', 'job cluster', 'structured streaming', 'dbfs', 'databricks notebook'],
    title: 'Databricks',
    summary: 'Managed Spark platform with Delta Lake, Unity Catalog, and AutoLoader — the industry standard lakehouse environment.',
    body: [
      { label: 'What it is', text: 'Databricks wraps Apache Spark in a managed platform: collaborative notebooks, Delta Lake by default, Unity Catalog for governance, and AutoLoader for incremental file ingestion. Key components: workspace (notebooks + jobs), clusters (Spark compute — job clusters for production, all-purpose for development), Unity Catalog (catalog.schema.table namespace, row/column-level security), MLflow (experiment tracking).' },
      { label: 'AutoLoader', text: 'AutoLoader is the correct way to ingest files from cloud storage into Delta Lake. It uses checkpoint state to track which files have been processed — so re-runs never reprocess old files. Uses Structured Streaming under the hood, works with cloudFiles format. Alternative (listing all files every run) is slow and expensive at scale.' },
      { label: 'Medallion architecture', text: 'Bronze: raw data as-is in Delta format, append-only, exact copy from source. Silver: cleaned, deduplicated, validated — business rules applied. Gold: aggregated, denormalized tables built for specific reports. Each layer is a Delta table. Spark jobs transform Bronze → Silver → Gold on a schedule via Databricks Jobs.' },
      { label: 'Interview angle', text: '"Describe the medallion architecture." Bronze = raw ore (unprocessed, exact). Silver = refined metal (cleaned, validated). Gold = finished product (shaped for a specific use case). Each layer adds value. Bronze is safe to reprocess at any time. Gold is what BI tools query — kept fast and simple.' },
      { label: 'Common mistake', text: 'Using all-purpose clusters for production jobs. All-purpose clusters are shared, expensive, and always-on. Production jobs must use job clusters — they provision at job start and terminate on completion, typically 5-10× cheaper. All-purpose clusters are for development only.', warn: true },
    ],
    code: '# AutoLoader — incremental file ingestion to Delta\ndf = (spark.readStream\n    .format("cloudFiles")\n    .option("cloudFiles.format", "json")\n    .option("cloudFiles.schemaLocation", "/checkpoints/orders_schema")\n    .load("/mnt/raw/orders/"))\n\n(df.writeStream\n    .format("delta")\n    .option("checkpointLocation", "/checkpoints/orders")\n    .outputMode("append")\n    .table("bronze.orders"))',
    next: ['Databricks Notebook lab', 'Interview Prep → Databricks category'],
  },
  {
    match: ['dbt', 'data build tool', 'dbt model', 'dbt test', 'materialization', 'ref(', 'source(', 'jinja', 'incremental model', 'is_incremental'],
    title: 'dbt (data build tool)',
    summary: 'Write SELECT statements, let dbt handle the CREATE TABLE/VIEW, dependency ordering, testing, and documentation.',
    body: [
      { label: 'What it is', text: 'dbt is an ELT transformation tool. You write SELECT statements in SQL files (models). dbt builds a DAG from ref() dependencies and runs models in the correct order. It handles materialization (table, view, incremental), runs tests after each build (unique, not_null, referential integrity), and generates data lineage documentation automatically.' },
      { label: 'Materializations', text: 'table: drops and recreates from scratch each run — safe but slow at scale. view: just a SQL view, no data copy — fast but every query re-executes the SQL. incremental: appends or merges only new rows since last run using is_incremental() — the correct choice for large production tables. ephemeral: inline CTE, no physical table created.' },
      { label: 'Real-world analogy', text: 'dbt is a Makefile for SQL. You declare what each model depends on via ref("model_name"), and dbt determines the correct build order automatically. Change a source model and all downstream models rebuild. It brings software engineering practices (version control, testing, CI/CD) to SQL transformations.' },
      { label: 'Interview angle', text: '"What is the difference between table and incremental materialization?" Table: full rebuild every run — safe but scans all data. Incremental: adds only rows created since MAX(updated_at) in the target — fast but needs careful handling of late-arriving data and the first full-refresh run.' },
      { label: 'Common mistake', text: 'Using table materialization for every model at scale. A model processing 2 years of data as a full rebuild runs expensively every hour. Use incremental for large models with a reliable watermark column. But test carefully — schema changes on incremental models require a full-refresh flag.', warn: true },
    ],
    code: '-- models/silver/orders_cleaned.sql\n{{ config(materialized="incremental", unique_key="order_id") }}\n\nSELECT\n    order_id, customer_id,\n    amount,\n    CAST(created_at AS DATE) as order_date\nFROM {{ source("raw", "orders") }}\nWHERE amount > 0\n\n{% if is_incremental() %}\n  AND created_at > (SELECT MAX(created_at) FROM {{ this }})\n{% endif %}',
    next: ['Interview Prep → ETL & Pipelines for dbt questions', 'Projects section for a dbt pipeline project'],
  },
  {
    match: ['medallion', 'bronze', 'silver', 'gold layer', 'lakehouse architecture', 'raw layer', 'curated layer', 'bronze silver'],
    title: 'Medallion Architecture',
    summary: 'Three-layer data organization (Bronze → Silver → Gold) that structures how raw data becomes analytics-ready.',
    body: [
      { label: 'The three layers', text: 'Bronze: raw data exactly as received from sources — append-only, immutable, schema-on-read. Silver: cleaned, deduplicated, validated data — business rules applied, schema enforced. Gold: aggregated, denormalized tables for specific reporting use cases — one Gold table per report or dashboard. Each layer is a Delta table.' },
      { label: 'Real-world analogy', text: 'Bronze = raw ore dug from the ground (unprocessed, exactly as extracted). Silver = refined metal (cleaned of impurities, standardized form). Gold = finished product shaped for specific use. Each layer adds value but removes raw flexibility.' },
      { label: 'Why it matters', text: 'Without layering, pipelines get tangled — transformations are inconsistent, quality issues propagate to dashboards, and reprocessing is dangerous. With medallion: Bronze is always safe to reprocess (it\'s just a copy). Silver is the source of truth for clean data. Gold is what analysts query — fast, simple, purpose-built.' },
      { label: 'Interview angle', text: '"Design the data architecture for an e-commerce company." Bronze: raw API payloads in Delta. Silver: deduplicated, typed orders with business rules. Gold: daily_revenue table aggregated by category and region for BI dashboards. Mention: Bronze never deletes, Silver uses MERGE, Gold is rebuilt with dbt incrementally.' },
      { label: 'Common mistake', text: 'Transforming data in the Bronze layer. Bronze is a landing zone — no filtering, no business logic, no deduplication. If the source sends duplicates, Bronze has duplicates. Silver\'s job is to deduplicate. Transforming in Bronze means you can\'t reprocess from source later without losing your changes.', warn: true },
    ],
    next: ['Microsoft Fabric module — built on medallion architecture', 'Databricks lab — build a Bronze → Silver → Gold pipeline'],
  },
  {
    match: ['etl', 'elt', 'etl vs elt', 'extract transform load', 'extract load transform', 'transformation pipeline'],
    title: 'ETL vs ELT',
    summary: 'ETL transforms before loading. ELT loads raw data first, then transforms inside the warehouse using SQL.',
    body: [
      { label: 'The difference', text: 'ETL: extract from source → transform externally (Python, Spark) → load to destination. ELT: extract from source → load raw to destination → transform using the warehouse SQL engine. Modern cloud warehouses (Snowflake, BigQuery, Synapse) are powerful enough to transform in-place, making ELT the current default for most teams.' },
      { label: 'When to use ETL', text: 'ETL is appropriate when: data contains PII that must be masked before landing in the warehouse, transformation requires complex Python logic that cannot be expressed in SQL, or the source data is so large that transformation dramatically reduces it before loading.' },
      { label: 'When to use ELT', text: 'ELT is the modern default: warehouse is powerful (Snowflake, BigQuery, Databricks), you use dbt for transformations, you want raw data preserved for reprocessing, and your team writes SQL better than Python. ELT + dbt is the standard "modern data stack" pattern.' },
      { label: 'Interview angle', text: '"Which do you prefer?" Answer: ELT for most cases. Cloud warehouses scale compute independently from storage, making in-warehouse transformation efficient. dbt is the standard ELT transformation layer. I\'d only choose ETL when data privacy requires transformation before landing — masking PII before it reaches the warehouse.' },
      { label: 'Common mistake', text: 'Building ETL in Python/Pandas on a single machine for data that could be handled in SQL inside the warehouse. This is slower (single machine vs distributed compute), harder to maintain, and loses the audit trail of what raw data looked like.', warn: true },
    ],
    next: ['dbt module — the standard ELT transformation tool', 'Interview Prep → ETL & Pipelines'],
  },
  {
    match: ['partition', 'partitioning', 'partition pruning', 'partition key', 'bucketing', 'partition by date', 'small file'],
    title: 'Partitioning',
    summary: 'Divide large tables by a column value so queries skip irrelevant data entirely — the #1 cost optimization in cloud warehouses.',
    body: [
      { label: 'What it is', text: 'Partitioning stores table data in separate folders by a column value (usually date). A query with WHERE order_date = \'2024-01-15\' on a partitioned table reads only the January 15th folder — skipping all other data. In cloud warehouses (BigQuery, Synapse, Delta Lake), this can reduce query cost and time by 99% for date-filtered queries.' },
      { label: 'Real-world analogy', text: 'Filing cabinets organized by year. If you need 2023 receipts, you open the 2023 drawer — not all 20 drawers. The date partition is the drawer label. Queries with a date filter go straight to the right drawer.' },
      { label: 'Choosing a partition column', text: 'Best partition column = most frequently filtered in WHERE clauses. Transactional tables: partition by date (order_date, event_date). Multi-tenant: partition by tenant_id. Avoid high-cardinality columns like UUIDs or user IDs with millions of values — creates millions of tiny files (the small file problem). Target: 100 MB – 1 GB per partition.' },
      { label: 'Interview angle', text: '"How would you optimize a slow query on a 10 TB orders table?" First answer: partition by order_date. WHERE order_date = CURRENT_DATE - 1 then scans 1/365th of data. Second: add ZORDER BY customer_id (Delta Lake) or clustering (BigQuery) to optimize customer-filtered queries on top of the date partition.' },
      { label: 'Common mistake', text: 'Over-partitioning by both date AND hour AND customer — creating thousands of tiny partitions per day. Spark file-open overhead dominates read time. Always test partition granularity. Daily partitions are right for most production tables; hourly only when data volume genuinely demands it.', warn: true },
    ],
    code: '-- Delta Lake: partition by date\nCREATE TABLE orders (\n  order_id   BIGINT,\n  customer_id INT,\n  amount     DECIMAL(10,2),\n  order_date DATE\n)\nUSING DELTA\nPARTITIONED BY (order_date);\n\n-- Scans only 1 partition:\nSELECT SUM(amount) FROM orders\nWHERE order_date = \'2024-01-15\';',
    next: ['SQL Lab — practice writing filter queries with partition-friendly WHERE clauses', 'Interview Prep → System Design for partition design questions'],
  },
  {
    match: ['data warehouse', 'data lake', 'lakehouse', 'warehouse vs lake', 'snowflake', 'bigquery', 'synapse', 'redshift', 'data swamp'],
    title: 'Data Warehouse vs Data Lake vs Lakehouse',
    summary: 'Three architectural patterns for storing and querying large-scale data — each with different cost, flexibility, and governance tradeoffs.',
    body: [
      { label: 'The three types', text: 'Data Warehouse (Snowflake, BigQuery, Synapse): structured data only, SQL-first, schema-on-write, fast BI queries, expensive proprietary storage. Data Lake (ADLS, S3): any format, cheap object storage, schema-on-read, no ACID, requires Spark to process. Lakehouse (Delta Lake, Iceberg, Microsoft Fabric): combines lake storage costs with warehouse-quality ACID, time travel, and SQL performance.' },
      { label: 'Real-world analogy', text: 'Data Warehouse = well-organized library with a card catalog (structured, fast to find things, expensive). Data Lake = a storage unit where you dump everything (cheap, flexible, chaotic). Lakehouse = a smart library built on cheap storage, with metadata that makes it searchable and reliable.' },
      { label: 'The data swamp problem', text: 'Data lakes without governance become "data swamps" — nobody knows what format files are in, schemas are undocumented, data quality is unknown. Every data lake needs: a catalog (Unity Catalog, Purview, Glue), schema enforcement (Delta Lake), and data quality checks. The lakehouse pattern solves the data swamp problem by adding structure back.' },
      { label: 'Interview angle', text: '"Describe the modern standard data architecture." Answer: a lakehouse (Delta Lake or Iceberg on cloud object storage) as the central store, Spark/dbt for transformation, BI tools connecting to the Gold layer. This is where Databricks, Microsoft Fabric, Snowflake, and BigQuery are all converging.' },
      { label: 'Common mistake', text: 'Building a data lake "for flexibility" without a governance plan. Raw flexibility without cataloging, schema enforcement, and quality checks creates a swamp that costs more to fix than a warehouse would have.', warn: true },
    ],
    next: ['Microsoft Fabric module — Microsoft\'s lakehouse platform', 'Interview Prep → Cloud & Architecture category'],
  },
  {
    match: ['star schema', 'fact table', 'dimension table', 'dimensional modeling', 'snowflake schema', 'grain', 'kimball', 'measure', 'surrogate key'],
    title: 'Dimensional Modeling & Star Schema',
    summary: 'Organize data warehouse tables into facts (events with measures) and dimensions (context) for optimal BI performance.',
    body: [
      { label: 'What it is', text: 'Star schema has one central fact table surrounded by dimension tables. Fact table: records business events, has foreign keys to dimensions, and numeric measures (amount, quantity, duration). Dimension tables: describe context — who, what, where, when. The star shape comes from joining fact to each dimension, like spokes on a wheel.' },
      { label: 'Real-world analogy', text: 'A sales receipt is the fact (what happened: Product X sold for $50 at 2pm on Dec 1). The store, customer, product catalog, and calendar are dimensions (context). The receipt points to all context tables. BI reports join the receipt (fact) to dimensions to answer "how much did we sell in Texas in Q3 to customers under 30?"' },
      { label: 'Grain decision', text: 'The grain is what one fact row represents. This is the most important design decision. Order-level grain: one row per order. Line-item grain: one row per order line (more granular, more flexible, larger table). Choosing the wrong grain means you can\'t answer certain business questions — and changing it later is expensive.' },
      { label: 'Interview angle', text: '"Design a star schema for an e-commerce platform." Fact: fact_orders (grain = one order line). Measures: amount, quantity. Dimensions: dim_customer, dim_product, dim_date. The interviewer will probe your grain decision and how you handle slowly changing dimensions (Type 2) in dim_customer.' },
      { label: 'Common mistake', text: 'Normalizing dimension tables into a snowflake schema. While normalized, snowflake schemas require more joins for every BI query — slowing dashboards. Dimensional modeling intentionally denormalizes dimensions for query speed. Storage is cheap; analyst time waiting for dashboards is expensive.', warn: true },
    ],
    next: ['Interview Prep → Data Modeling category', 'SCD section — how dimensions change over time'],
  },
  {
    match: ['data quality', 'data validation', 'great expectations', 'soda', 'null check', 'row count check', 'anomaly detection', 'data testing', 'dq check'],
    title: 'Data Quality & Validation',
    summary: 'Catch bad data before it reaches analysts — automated checks on completeness, uniqueness, freshness, and distribution.',
    body: [
      { label: 'Core DQ checks', text: 'Completeness: no unexpected NULLs in required columns. Uniqueness: no duplicate values on primary keys. Freshness: data arrived within expected time window. Referential integrity: FK values exist in dimension tables. Distribution: values within expected ranges, no unexpected categories, counts within ±20% of yesterday.' },
      { label: 'Implementation approaches', text: 'SQL assertions: SELECT COUNT(*) WHERE required_col IS NULL → fail job if > 0. dbt tests: add not_null, unique, accepted_values, relationships in schema.yml — runs automatically after each build. Great Expectations / Soda Core: Python framework with an expectation catalog, HTML reports, and CI/CD integration. In production: DQ tasks run as Airflow steps after each pipeline stage.' },
      { label: 'Real-world analogy', text: 'Quality control in manufacturing. You don\'t wait for customers to find defective products — you check at each production stage. In pipelines: validate after extraction (did we get all rows?), after transformation (unexpected NULLs?), and before loading (schema match?).' },
      { label: 'Interview angle', text: '"How do you handle data quality?" Structure your answer: define checks per table (uniqueness on PKs, null rates for required fields, row count vs yesterday within 20%, FK integrity). Run as Airflow post-load tasks. On failure: alert, halt downstream pipeline, do NOT overwrite the previous Gold layer — fail safely and preserve the last good state.' },
      { label: 'Common mistake', text: 'Only checking that a pipeline ran without error (exit code 0), not that the data is correct. A pipeline can succeed and produce completely wrong data — an API returning an empty list with HTTP 200, a MERGE silently matching on the wrong key. Always validate the DATA, not just the process status.', warn: true },
    ],
    next: ['dbt tests — built-in DQ framework', 'Interview Prep → ETL & Pipelines for DQ questions'],
  },
  {
    match: ['interview', 'interview prep', 'prepare for interview', 'faang', 'amazon', 'google', 'meta', 'microsoft interview', 'technical interview'],
    title: 'Interview Preparation Strategy',
    summary: 'Data engineering interviews cover SQL, PySpark, system design, cloud tools, and behavioral — here\'s how to approach each.',
    body: [
      { label: 'Interview structure', text: '1) SQL screen — window functions, CTEs, dedup, aggregations (45 min). 2) Python/PySpark coding — DataFrame transformations, data processing logic (45 min). 3) System design — design a pipeline at scale (60 min). 4) Cloud/tools — Azure, Databricks, Airflow concepts (30 min). 5) Behavioral — STAR method for past projects (30 min). Expect 3–5 rounds total.' },
      { label: 'SQL — table stakes', text: 'SQL appears in 90% of DE interviews. Master: window functions (ROW_NUMBER for dedup, RANK for top-N, SUM OVER for running totals), CTEs for multi-step queries, JOINs and their cardinality implications, GROUP BY + HAVING patterns, NULL handling with COALESCE and IS NULL. Know the dedup-with-ROW_NUMBER pattern cold.' },
      { label: 'System design — the differentiator', text: '"Design a pipeline that ingests 100M events/day." Structure: source ingestion (Kafka) → landing zone (Bronze Delta) → transformation (Spark, Silver) → serving (Gold, dbt) → orchestration (Airflow) → quality checks → monitoring/alerts. Cover tradeoffs at each step. This is where junior vs senior candidates diverge.' },
      { label: '30-day prep plan', text: 'Week 1: SQL daily — SQL Lab challenges + window functions + CTEs. Week 2: PySpark — DataFrame API, joins, aggregations. Week 3: system design — scalable pipeline patterns, lakehouse architecture. Week 4: mock interviews on full loop. Throughout all 4 weeks: Interview Prep mock sessions 30 min/day.' },
      { label: 'Common mistake', text: 'Over-preparing SQL, under-preparing system design. SQL is table stakes — everyone needs it. System design differentiates junior from senior. Practice explaining end-to-end architectures with clear tradeoffs out loud: "I chose Kafka because the fraud SLA requires sub-5-second detection."', warn: true },
    ],
    next: ['Interview Prep section → Start Mock Interview', 'SQL Lab → complete all advanced challenges before your interview'],
  },
  {
    match: ['focus', 'what should i', 'next step', 'recommend', 'study plan', 'weak area', 'what to study', 'where to start'],
    title: 'Personalized Study Plan',
    summary: null,
    body: null, // handled dynamically in getContextualResponse
    next: null,
  },
];

function buildStudyPlanResponse(topicProgress, completedTopics) {
  const ct = completedTopics ?? {};
  const inProgress = topicProgress.filter(t => t.pct > 0 && t.pct < 100 && !ct[t.id]).slice(0, 2);
  const notStarted  = topicProgress.filter(t => t.pct === 0 && !ct[t.id]).slice(0, 3);

  const steps = [
    ...inProgress.map(t => ({
      icon: '↻', color: '#6b7cdb',
      label: `Continue ${t.title}`,
      detail: `${t.pct}% complete — finish practice tasks to unlock the next topic`,
    })),
    ...notStarted.slice(0, 3 - inProgress.length).map(t => ({
      icon: '▶', color: '#10b981',
      label: `Start ${t.title}`,
      detail: 'Not started — high interview value',
    })),
    { icon: '◈', color: '#f59e0b', label: 'Practice SQL daily', detail: 'SQL Lab → one challenge per day builds fluency fast' },
  ].slice(0, 4);

  return {
    title: 'Your Personalized Study Plan',
    steps,
    next: ['Learning Path → full roadmap with locked/unlocked phases', 'Interview Prep → mock session to find knowledge gaps'],
  };
}

function buildFallbackResponse(input) {
  const lc = input.toLowerCase();

  // Detect comparison questions
  if (lc.includes(' vs ') || lc.includes(' versus ') || lc.includes(' or ')) {
    const parts = input.split(/\s+vs\.?\s+|\s+versus\s+|\s+or\s+/i);
    return {
      title: 'Technology Comparison',
      summary: 'Here is how to think about this tradeoff as a data engineer.',
      body: [
        { label: 'Framework for any DE comparison', text: 'For any "X vs Y" question in data engineering, evaluate on four axes: (1) Latency — real-time vs batch? (2) Scale — how much data, how many writes/reads? (3) Consistency — do you need ACID transactions? (4) Operational complexity — can your team manage it? The right choice depends on your specific constraints, not on which technology sounds more impressive.' },
        { label: 'For your specific question', text: `"${input.trim()}" — both options likely have valid use cases. Use the four axes above to reason through the tradeoff. In an interview, always answer with: "I would choose X when [condition] because [reason], and Y when [other condition]."` },
        { label: 'Interview angle', text: 'Interviewers asking comparison questions want to hear tradeoffs, not just "X is better." A strong answer names the conditions under which you would choose each, with specific examples from production scenarios.' },
      ],
      next: ['Interview Prep → System Design for architecture tradeoff questions', 'Ask a more specific question for a detailed answer on either technology'],
    };
  }

  // Detect "how do I" / "how to" questions
  if (lc.match(/how (do|to|can|would|should)/)) {
    return {
      title: 'Implementation Guidance',
      summary: 'Here is a data engineering approach to your question.',
      body: [
        { label: 'General DE problem-solving approach', text: 'For most data engineering implementation questions, break the problem into three layers: (1) Ingestion — where does the data come from, what is the format, what is the frequency? (2) Transformation — what cleaning, deduplication, or business logic is needed? (3) Serving — who consumes this data, what latency and format do they need?' },
        { label: 'Your question', text: `"${input.trim()}" — consider which layer this falls in: ingestion, transformation, or serving. Then choose the right tool for that layer: Kafka/AutoLoader/ADF for ingestion, Spark/dbt/SQL for transformation, Power BI/Delta tables for serving.` },
        { label: 'Finding specific answers', text: 'Check the platform topics that match your layer: SQL module for transformation queries, PySpark module for DataFrame operations, Airflow/ADF module for orchestration, Databricks module for lakehouse implementation.' },
      ],
      next: ['Topics section — find the specific module for your question', 'Interview Prep — related questions in the matching category'],
    };
  }

  // Generic fallback — give a useful structured response
  return {
    title: 'Data Engineering Perspective',
    summary: 'Here is what matters about this topic as a data engineer.',
    body: [
      { label: 'DE context', text: `"${input.trim()}" is a topic that comes up in data engineering practice. In production DE work, the key questions to ask about any technology or concept are: What problem does it solve? What are the performance characteristics at scale? How does it fit into a pipeline (ingestion, transformation, or serving)? What are the failure modes?` },
      { label: 'How to learn it effectively', text: 'The most effective DE learning path for any new concept: (1) Read the official documentation introduction. (2) Find a hands-on example in a realistic context. (3) Identify the common failure modes and tradeoffs. (4) Practice explaining it as an interview answer. (5) Build a small project that uses it.' },
      { label: 'Interview readiness', text: 'For any DE topic, prepare two answers: a 30-second overview ("X is a distributed system that...") and a 3-minute deep dive covering architecture, tradeoffs, and a production example you have worked with or studied.' },
    ],
    next: ['Topics section — browse modules for structured lessons', 'Interview Prep → find questions in the matching category'],
  };
}

function getContextualResponse(input, topicProgress, completedTopics) {
  const lc = input.toLowerCase();

  // Focus/study plan query
  const isFocusQuery = ['what should i', 'focus', 'next step', 'recommend', 'study plan', 'weak area', 'what to study', 'where to start'].some(k => lc.includes(k));
  if (isFocusQuery) return buildStudyPlanResponse(topicProgress, completedTopics);

  // Match topic responses (skip the focus placeholder entry)
  const matched = TOPIC_RESPONSES.find(r => r.body !== null && r.match.some(kw => lc.includes(kw)));
  if (matched) return matched;

  // Smart fallback — always give a real answer
  return buildFallbackResponse(input);
}

function DailyTip() {
  const dayOfWeek = new Date().getDay();
  const tip = DAILY_TIPS[dayOfWeek] ?? DAILY_TIPS[0];

  return (
    <div className="coach-daily-tip">
      <div className="coach-tip-header">
        <span className="coach-tip-icon" aria-hidden="true">💡</span>
        <span className="coach-tip-label">Daily Learning Tip</span>
        <span className="coach-tip-day">{['Sun','Mon','Tue','Wed','Thu','Fri','Sat'][dayOfWeek]}</span>
      </div>
      <p className="coach-tip-text">{tip.tip}</p>
    </div>
  );
}

// ─── Ask the Coach ───────────────────────────────────────────────────────────

const SUGGESTED_PROMPTS = [
  'What is data engineering and why does it matter?',
  'Explain window functions with examples',
  'What should I focus on this week?',
  'Explain Delta Lake MERGE pattern',
  'What is medallion architecture?',
  'How do I prepare for a data engineering interview?',
  'Kafka vs batch processing — when to use each?',
  'Explain dbt and when to use it',
];

// ─── Response card renderer ───────────────────────────────────────────────────

const SECTION_ICONS = {
  'What it is': '◦',
  'The three types': '◦',
  'The types': '◦',
  'The three layers': '◦',
  'The difference': '◦',
  'Core DQ checks': '◦',
  'Interview structure': '◦',
  'Core DE Python patterns': '◦',
  default: '◦',
  analogy: '◎',
  'Real-world analogy': '◎',
  interview: '◈',
  'Interview angle': '◈',
  '30-day prep plan': '◈',
  warn: '⚠',
  'Common mistake': '⚠',
  performance: '⚡',
  'Key functions': '⚡',
  'Key operations': '⚡',
  'Performance essentials': '⚡',
  'Narrow vs wide transformations': '⚡',
};

function sectionIcon(label, warn) {
  if (warn) return '⚠';
  return SECTION_ICONS[label] ?? '◦';
}

function CoachResponseCard({ resp }) {
  const [expandedSections, setExpandedSections] = useState(() => new Set([0, 1]));

  function toggleSection(i) {
    setExpandedSections(prev => {
      const next = new Set(prev);
      next.has(i) ? next.delete(i) : next.add(i);
      return next;
    });
  }

  return (
    <div className="coach-response-card">
      <div className="coach-response-header">
        <span className="coach-response-icon" aria-hidden="true">◈</span>
        <span className="coach-response-title">{resp.title}</span>
        <span className="coach-response-badge">Coach</span>
      </div>

      {resp.summary && (
        <p className="coach-resp-summary">{resp.summary}</p>
      )}

      {/* Study plan steps */}
      {resp.steps && (
        <div className="coach-plan-steps">
          {resp.steps.map((step, i) => (
            <div key={i} className="coach-plan-step">
              <span className="coach-plan-icon" style={{ color: step.color }}>{step.icon}</span>
              <div className="coach-plan-body">
                <strong className="coach-plan-label">{step.label}</strong>
                <span className="coach-plan-detail">{step.detail}</span>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Structured body sections */}
      {resp.body && (
        <div className="coach-resp-sections">
          {resp.body.map((section, i) => (
            <div key={i} className={`coach-resp-section${section.warn ? ' coach-resp-section--warn' : ''}`}>
              <button
                type="button"
                className="coach-resp-section-head"
                onClick={() => toggleSection(i)}
                aria-expanded={expandedSections.has(i)}
              >
                <span className="coach-resp-section-icon">{sectionIcon(section.label, section.warn)}</span>
                <span className="coach-resp-section-label">{section.label}</span>
                <span className="coach-resp-chevron">{expandedSections.has(i) ? '▾' : '▸'}</span>
              </button>
              {expandedSections.has(i) && (
                <p className="coach-resp-section-text">{section.text}</p>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Code example */}
      {resp.code && (
        <div className="coach-resp-code-wrap">
          <span className="coach-resp-code-label">Example</span>
          <pre className="coach-response-code"><code>{resp.code}</code></pre>
        </div>
      )}

      {/* Next steps */}
      {resp.next && resp.next.length > 0 && (
        <div className="coach-resp-next">
          <span className="coach-resp-next-label">What to do next</span>
          <ul className="coach-resp-next-list">
            {resp.next.map((item, i) => (
              <li key={i} className="coach-resp-next-item">→ {item}</li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}

function AskCoach() {
  const [input, setInput]             = useState('');
  const [contextResp, setContextResp] = useState(null);
  const [submitted, setSubmitted]     = useState(false);
  const [practiceProgress]            = useLocalStorage('dem-practice-progress', {});
  const [completedTopics]             = useLocalStorage('dem-completed-topics', {});

  const topicProg = useMemo(() => computeTopicProgress(practiceProgress), [practiceProgress]);

  function handleChip(prompt) {
    setInput(prompt);
    setContextResp(null);
    setSubmitted(false);
  }

  function handleSubmit(e) {
    e.preventDefault();
    if (!input.trim()) return;
    setContextResp(getContextualResponse(input, topicProg, completedTopics));
    setSubmitted(true);
  }

  function handleClear() {
    setInput('');
    setContextResp(null);
    setSubmitted(false);
  }

  return (
    <div className="coach-ask-section">
      <div className="ai-section-label">
        <span className="ai-label-badge">◈ Ask the Coach</span>
        <span className="ai-label-sub">Direct answers — concepts, tradeoffs, interview prep, roadmap guidance</span>
      </div>

      <div className="coach-chips">
        {SUGGESTED_PROMPTS.map(p => (
          <button
            key={p}
            type="button"
            className={`coach-chip${input === p ? ' coach-chip--active' : ''}`}
            onClick={() => handleChip(p)}
          >
            {p}
          </button>
        ))}
      </div>

      <form className="coach-form" onSubmit={handleSubmit}>
        <textarea
          className="coach-textarea"
          placeholder="Ask anything — explain a concept, compare technologies, get interview guidance, or ask for your next study focus…"
          value={input}
          onChange={e => { setInput(e.target.value); setSubmitted(false); setContextResp(null); }}
          rows={3}
          aria-label="Ask the AI coach"
        />
        <div className="coach-form-actions">
          {(input || contextResp) && (
            <button type="button" className="coach-clear-btn" onClick={handleClear}>
              Clear
            </button>
          )}
          <button type="submit" className="coach-submit-btn" disabled={!input.trim()}>
            Ask Coach →
          </button>
        </div>
      </form>

      {submitted && contextResp && <CoachResponseCard resp={contextResp} />}
    </div>
  );
}

// ─── Weak Areas / Focus Areas ────────────────────────────────────────────────

function WeakAreas({ onNavigate }) {
  const [practiceProgress] = useLocalStorage('dem-practice-progress', {});
  const [completedTopics]  = useLocalStorage('dem-completed-topics', {});

  const topicProg = useMemo(() => computeTopicProgress(practiceProgress), [practiceProgress]);

  const { inProgress, notStarted } = useMemo(() => {
    const ct = completedTopics ?? {};
    return {
      inProgress: topicProg.filter(t => t.pct > 0 && t.pct < 80 && !ct[t.id]).slice(0, 2),
      notStarted: topicProg.filter(t => t.pct === 0 && !ct[t.id]).slice(0, 3),
    };
  }, [topicProg, completedTopics]);

  const items = [...inProgress, ...notStarted].slice(0, 4);
  if (!items.length) return null;

  return (
    <div className="coach-focus-section">
      <div className="ai-section-label">
        <span className="ai-label-badge" style={{ '--badge-color': '#f59e0b' }}>⚠ Focus Areas</span>
        <span className="ai-label-sub">In-progress and not-started topics — highest interview value</span>
      </div>
      <div className="coach-focus-list">
        {items.map(t => (
          <div key={t.id} className="coach-focus-item">
            <div className="coach-focus-info">
              <span className="coach-focus-name">{t.title}</span>
              {t.pct > 0
                ? <span className="coach-focus-badge coach-focus-badge--progress">{t.pct}% done</span>
                : <span className="coach-focus-badge">Not started</span>
              }
            </div>
            {t.pct > 0 && (
              <div className="coach-focus-bar">
                <div className="coach-focus-fill" style={{ width: `${t.pct}%` }} />
              </div>
            )}
            <button
              type="button"
              className="coach-focus-cta"
              onClick={() => onNavigate?.('topics')}
            >
              {t.pct > 0 ? 'Continue →' : 'Start →'}
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── Due for Review (Revision Queue) ─────────────────────────────────────────

function DueForReview() {
  const { overdueTopics, studyLog } = useLearningMemory();

  if (!overdueTopics.length) return null;

  const topicTitle = id => ALL_TOPICS.find(t => t.id === id)?.title ?? id;

  function formatLastReviewed(topicId) {
    const log = studyLog[topicId];
    if (!log?.lastStudied) return 'Unknown';
    const days = Math.round((Date.now() - new Date(log.lastStudied).getTime()) / (1000 * 60 * 60 * 24));
    if (days === 0) return 'Today';
    if (days === 1) return '1 day ago';
    return `${days} days ago`;
  }

  return (
    <div className="coach-review-section">
      <div className="ai-section-label">
        <span className="ai-label-badge" style={{ '--badge-color': '#6b7cdb' }}>↻ Due for Review</span>
        <span className="ai-label-sub">Spaced repetition — review before forgetting</span>
      </div>
      <div className="coach-review-list">
        {overdueTopics.slice(0, 4).map(t => (
          <div key={t.topicId} className="coach-review-item">
            <div className="coach-review-info">
              <span className="coach-review-name">{topicTitle(t.topicId)}</span>
              <span className="coach-review-meta">
                Last reviewed: {formatLastReviewed(t.topicId)} · studied {t.count}× total
              </span>
            </div>
            <div className="coach-review-right">
              <span className={`coach-review-urgency${t.overdueDays > 7 ? ' coach-review-urgency--high' : ''}`}>
                {t.overdueDays > 7 ? 'Urgent' : `${t.overdueDays}d overdue`}
              </span>
              <button
                type="button"
                className="coach-review-btn"
                onClick={() => {
                  const el = document.getElementById('topics') ?? document.getElementById('learning');
                  el?.scrollIntoView({ behavior: 'smooth' });
                }}
              >
                Review Now
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── Prompt Library ───────────────────────────────────────────────────────────

const PROMPT_CATEGORIES = [
  {
    label: 'Explain',
    icon: '💡',
    prompts: [
      { title: 'Explain simply', template: t => `Explain "${t || '[topic]'}" for a data engineer learning it for the first time. Use: (1) a plain-English definition, (2) a real-world analogy, (3) how it's used in a data pipeline, (4) one gotcha to watch out for.` },
      { title: 'Compare concepts', template: (a) => `Compare "${a || '[concept A]'}" vs "${a || '[concept B]'}" for a data engineer. Show: what each does, when to choose each, a concrete code comparison, and key performance differences.` },
      { title: 'Explain an error', template: () => `I'm a data engineer and got this error: [paste error here]. Explain: what it means in plain English, the root cause, and 3 ways to fix it — from quick workaround to proper solution.` },
    ],
  },
  {
    label: 'Quiz me',
    icon: '🧠',
    prompts: [
      { title: 'Practice quiz', template: t => `Quiz me on "${t || '[topic]'}". Give 5 questions — one at a time, wait for my answer, start easy and progress to advanced. At the end: give a score and highlight any knowledge gaps.` },
      { title: 'Interview simulation', template: t => `Simulate a data engineering interview for "${t || '[topic]'}". Ask 4 questions: one conceptual, one SQL/code, one system design, one production scenario. Evaluate my answers with detailed feedback.` },
      { title: 'Fill-in-the-blank', template: t => `Create 5 fill-in-the-blank code exercises for "${t || '[topic]'}". Show partial code with _____ blanks. After my answer, show the solution with an explanation of why it's correct.` },
    ],
  },
  {
    label: 'Generate',
    icon: '⚡',
    prompts: [
      { title: 'Mini project', template: t => `Design a hands-on mini project for learning "${t || '[topic]'}". Include: goal, realistic dataset, 5 implementation steps, expected output, and 2 stretch challenges. Should be completable in 1–2 hours.` },
      { title: 'Revision notes', template: t => `Create concise revision notes for "${t || '[topic]'}" for a data engineering interview. Format: key concepts (bullets), common pitfalls, 3 interview Q&As, and a cheat-sheet reference.` },
      { title: 'Test data', template: () => `Generate 10 rows of realistic test data for this schema: [paste column names and types here]. Use believable values — not "test1", "foo", "abc". Output as Python list of dicts and SQL INSERT statements.` },
    ],
  },
  {
    label: 'Code help',
    icon: '⌨',
    prompts: [
      { title: 'Code review', template: () => `Review this data engineering code as a senior engineer: [paste code]. Check for: correctness, performance issues, missing error handling, and style. Give specific improvements with example rewrites.` },
      { title: 'SQL → PySpark', template: () => `Convert this SQL to PySpark DataFrame API: [paste SQL]. Maintain identical logic. Add a comment per step. Highlight any gotchas in the translation.` },
      { title: 'Debug pipeline', template: () => `Help me debug a pipeline issue. Expected: [describe expected output]. Actual: [describe what happened]. Code: [paste relevant code]. What's wrong and how do I fix it properly?` },
    ],
  },
];

function PromptCard({ prompt, copiedId, onCopy }) {
  const [topic, setTopic] = useState('');
  const copied = copiedId === prompt.title;

  function handleCopy() {
    const text = prompt.template(topic || undefined);
    navigator.clipboard.writeText(text).then(() => onCopy(prompt.title));
  }

  return (
    <div className="ai-prompt-card">
      <div className="ai-prompt-header">
        <span className="ai-prompt-title">{prompt.title}</span>
        <button type="button"
          className={`ai-copy-btn${copied ? ' ai-copy-btn--done' : ''}`}
          onClick={handleCopy}>
          {copied ? '✓ Copied' : '⎘ Copy'}
        </button>
      </div>
      <p className="ai-prompt-preview">
        {prompt.template('[topic]').slice(0, 110)}…
      </p>
      <input type="text" className="ai-topic-input"
        placeholder='Topic — e.g. "window functions", "Delta MERGE"'
        value={topic} onChange={e => setTopic(e.target.value)}
        aria-label="Topic to insert into prompt" />
    </div>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────

const AILearning = memo(function AILearning({ onNavigate }) {
  const [activeTab, setActiveTab] = useState(0);
  const [copiedId, setCopiedId]   = useState(null);

  function handleCopy(id) {
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2200);
  }

  const cat = PROMPT_CATEGORIES[activeTab];

  return (
    <section className="section ai-coach-section" id="ai-learning">
      {/* Hero Header */}
      <div className="coach-hero">
        <div className="coach-hero-text">
          <p className="eyebrow">AI-Powered</p>
          <h2 className="coach-hero-title">Your AI Learning Coach</h2>
          <p className="coach-hero-subtitle">Ask anything, get personalized guidance</p>
        </div>
        <span className="section-badge">Personal Mentor</span>
      </div>

      {/* Daily Tip */}
      <DailyTip />

      {/* Ask the Coach */}
      <AskCoach />

      {/* Weak Areas */}
      <WeakAreas onNavigate={onNavigate} />

      {/* Due for Review */}
      <DueForReview />

      {/* Prompt Templates */}
      <div className="ai-prompts-header">
        <div className="ai-section-label" style={{ marginBottom: 0 }}>
          <span className="ai-label-badge">⌨ Study Exercises</span>
          <span className="ai-label-sub">Practice prompts — copy and use for self-study or mock interviews</span>
        </div>
        <div className="ai-tabs" role="tablist" aria-label="Prompt categories">
          {PROMPT_CATEGORIES.map((c, i) => (
            <button key={c.label} type="button" role="tab"
              aria-selected={i === activeTab}
              className={`ai-tab${i === activeTab ? ' ai-tab--active' : ''}`}
              onClick={() => setActiveTab(i)}>
              <span aria-hidden="true">{c.icon}</span> {c.label}
            </button>
          ))}
        </div>
      </div>

      <div className="ai-prompts-grid">
        {cat.prompts.map(p => (
          <PromptCard key={p.title} prompt={p} copiedId={copiedId} onCopy={handleCopy} />
        ))}
      </div>
    </section>
  );
});

export default AILearning;
