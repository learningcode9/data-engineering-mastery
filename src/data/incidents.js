// Production incident simulations for the War Room feature.
// Each incident represents a realistic on-call scenario with logs, metrics,
// investigation steps, root cause analysis, and a fix snippet.

export const INCIDENTS = [
  {
    id: 'adf-schema-drift',
    title: 'ADF Schema Drift Breaking Copy Activity',
    severity: 'P1',
    category: 'Pipeline',
    tool: 'Azure Data Factory',
    icon: '🔴',
    briefing:
      'Copy activity "CopyOrdersToSilver" failed at 02:17 UTC with a schema mismatch error. Downstream Silver tables for orders are not refreshing and 6 Power BI reports are stale.',
    logs: [
      {
        time: '2026-05-21T02:17:03Z',
        level: 'ERROR',
        source: 'ADF / CopyActivity / CopyOrdersToSilver',
        msg: "ErrorCode=SchemaColumnNameInvalid, Type=Microsoft.DataTransfer.Common.Shared.HybridDeliveryException, Message='Column [discount_percent] of type [Decimal] in source schema does not exist in sink schema. Sink schema: [order_id, customer_id, item_sku, quantity, unit_price, order_ts].'",
      },
      {
        time: '2026-05-21T02:17:03Z',
        level: 'ERROR',
        source: 'ADF / Pipeline / PL_Ingest_Orders',
        msg: "Activity CopyOrdersToSilver failed. Status: Failed. Duration: 00:00:08. Error: SchemaColumnNameInvalid.",
      },
      {
        time: '2026-05-21T02:17:05Z',
        level: 'WARN',
        source: 'ADF / Trigger / TR_Daily_02:00',
        msg: 'Pipeline PL_Ingest_Orders finished with status Failed. Retry 1 of 3 scheduled in 5 minutes.',
      },
      {
        time: '2026-05-21T02:22:07Z',
        level: 'ERROR',
        source: 'ADF / CopyActivity / CopyOrdersToSilver',
        msg: "ErrorCode=SchemaColumnNameInvalid, Message='Column [discount_percent] not found in sink schema.' Retry 1 failed.",
      },
      {
        time: '2026-05-21T02:27:09Z',
        level: 'ERROR',
        source: 'ADF / CopyActivity / CopyOrdersToSilver',
        msg: "ErrorCode=SchemaColumnNameInvalid, Message='Column [discount_percent] not found in sink schema.' Retry 2 failed.",
      },
      {
        time: '2026-05-21T02:32:11Z',
        level: 'ERROR',
        source: 'ADF / Pipeline / PL_Ingest_Orders',
        msg: 'All 3 retries exhausted. Pipeline PL_Ingest_Orders marked as Failed. Alert sent to on-call channel.',
      },
      {
        time: '2026-05-21T02:32:14Z',
        level: 'INFO',
        source: 'Azure Monitor / AlertRule / ADF_Pipeline_Failure',
        msg: 'Alert fired: Pipeline PL_Ingest_Orders failed 3 consecutive runs. Runbook: https://wiki.internal/adf-oncall',
      },
    ],
    metrics: [
      { label: 'Pipeline Success Rate (24h)', value: '0%', status: 'critical' },
      { label: 'Rows Copied (last success)', value: '0', status: 'critical' },
      { label: 'Silver Table Freshness', value: '4h 17m stale', status: 'critical' },
      { label: 'Source Schema Columns', value: '7 (was 6)', status: 'warning' },
      { label: 'Sink Schema Columns', value: '6', status: 'warning' },
      { label: 'Downstream Reports Stale', value: '6', status: 'critical' },
    ],
    steps: [
      "Open the failed pipeline run in ADF Monitor and expand the CopyOrdersToSilver activity error — confirm the column name in the error message.",
      "Compare source and sink schemas: navigate to the dataset linked to the source and run a schema preview, then check the sink Azure SQL / ADLS schema definition.",
      "Identify the new column — query the source system's information_schema or ask the upstream team what changed in the last deployment.",
      "Update the sink schema: ALTER the target table to add the new column (or update the ADF mapping in the Copy activity to include it).",
      "Re-run the pipeline manually from ADF Monitor and verify rows copy successfully, then confirm Silver table row count matches source.",
    ],
    correctRCA:
      "The upstream orders API team deployed a new `discount_percent DECIMAL(5,2)` column to the source database at 02:00 UTC without notifying the data engineering team. ADF copy activity uses an explicit column mapping that does not include this new column, causing a schema mismatch on every run. Because the sink schema was not updated before the pipeline ran, all three automatic retries also failed.",
    fix: "Add the `discount_percent` column to the sink table and update the ADF copy activity column mapping to include it, then re-run the pipeline.",
    fixCode: `-- Step 1: Add missing column to the sink table (Azure SQL example)
ALTER TABLE silver.orders
ADD discount_percent DECIMAL(5, 2) NULL;

-- Step 2: Verify source data for the new column
SELECT TOP 10 discount_percent FROM bronze.orders_raw ORDER BY order_ts DESC;

-- Step 3: (Optional) Backfill historical rows if discount_percent is available upstream
UPDATE s
SET    s.discount_percent = r.discount_percent
FROM   silver.orders s
JOIN   bronze.orders_raw r ON s.order_id = r.order_id
WHERE  s.discount_percent IS NULL;

-- Step 4: In ADF, open the Copy Activity > Mapping tab,
--         click "Import schemas", tick discount_percent, and publish.
-- Then trigger the pipeline manually to confirm success.`,
  },

  {
    id: 'spark-oom-wide-join',
    title: 'Spark OOM on Wide Join — Executor Crash Loop',
    severity: 'P1',
    category: 'Spark',
    tool: 'Databricks',
    icon: '💥',
    briefing:
      'Databricks job `transform_customer_360` has been crashing every 8 minutes for the last 40 minutes with executor OOM errors. The daily customer aggregate table has not been updated since midnight and 4 ML feature pipelines are blocked.',
    logs: [
      {
        time: '2026-05-21T03:08:44Z',
        level: 'ERROR',
        source: 'Spark / Executor / 10.0.4.22:45621',
        msg: 'ExecutorLostFailure: Executor 14 exited with code 137 (OOM killed by container manager). java.lang.OutOfMemoryError: GC overhead limit exceeded',
      },
      {
        time: '2026-05-21T03:08:44Z',
        level: 'WARN',
        source: 'Spark / Driver / DAGScheduler',
        msg: 'Stage 7 (sortMergeJoin at CustomerTransform.scala:184) lost 3 executors. Resubmitting 24 tasks.',
      },
      {
        time: '2026-05-21T03:08:46Z',
        level: 'ERROR',
        source: 'Spark / Driver / TaskSchedulerImpl',
        msg: 'Task 18.3 (stage 7.3) failed 4 times; aborting job. Last failure reason: ExecutorLostFailure (executor 15 exited caused by OOM).',
      },
      {
        time: '2026-05-21T03:08:47Z',
        level: 'INFO',
        source: 'Databricks / JobRunner / job-7831',
        msg: 'Job run 7831-attempt-4 failed. Retrying (4/5) with 8 minute backoff.',
      },
      {
        time: '2026-05-21T03:16:52Z',
        level: 'ERROR',
        source: 'Spark / Executor / 10.0.4.30:45700',
        msg: 'Container killed by YARN for exceeding memory limits. 16.2 GB used, limit 16.0 GB. Dump of top allocations: sortMergeJoin shuffle write — 14.8 GB.',
      },
      {
        time: '2026-05-21T03:16:53Z',
        level: 'WARN',
        source: 'Spark / Driver / ShuffleManager',
        msg: 'Detected data skew: partition 0 of stage 7 contains 82.4% of shuffle data (11.2 GB / 13.6 GB total).',
      },
      {
        time: '2026-05-21T03:16:54Z',
        level: 'ERROR',
        source: 'Databricks / JobRunner / job-7831',
        msg: 'Job run 7831-attempt-5 failed after 5 retries. Job marked FAILED. SLA breach imminent.',
      },
    ],
    metrics: [
      { label: 'Job Success Rate (7d avg)', value: '100% → 0%', status: 'critical' },
      { label: 'Peak Executor Memory', value: '16.2 GB / 16 GB limit', status: 'critical' },
      { label: 'Shuffle Skew Ratio', value: '82.4% in 1 partition', status: 'critical' },
      { label: 'fact_customers Freshness', value: '7h 8m stale', status: 'critical' },
      { label: 'Cluster CPU Utilization', value: '12% (wasteful)', status: 'warning' },
      { label: 'Shuffle Write Size', value: '13.6 GB', status: 'warning' },
    ],
    steps: [
      "Open the failed job in Databricks Job runs UI — click into the failed stage (Stage 7) and look at the shuffle read/write sizes per partition to confirm skew.",
      "Check the query plan in the Spark UI (SQL tab) — look for a SortMergeJoin where one side is large and confirm neither table has a broadcast hint applied.",
      "Check the size of the smaller join table: `%sql SELECT COUNT(*), pg_size_pretty(SUM(pg_column_size(row(*)))) FROM dim_products` — if < 200 MB it is broadcastable.",
      "Add a broadcast hint to the smaller table in the PySpark code and re-run the job in an interactive cluster to verify no OOM.",
      "If the join cannot be broadcast (both tables large), investigate the skew key: add a salted join or use `spark.sql.adaptive.skewJoin.enabled=true` (AQE).",
    ],
    correctRCA:
      "The `transform_customer_360` job performs a SortMergeJoin between `fact_orders` (480 GB, 2.1B rows) and `dim_products` (95 MB, 18k rows). Because no broadcast hint was specified, Spark chose a SortMergeJoin and shuffled both tables across the network. The `product_id` join key is heavily skewed — one popular product accounts for 82% of order rows — causing a single executor to hold 14.8 GB of shuffle data, exceeding the 16 GB memory limit. The crash loop repeated on every retry.",
    fix: "Add a broadcast hint for `dim_products` so Spark sends the small table to every executor instead of shuffling the large table, eliminating the shuffle and the OOM.",
    fixCode: `from pyspark.sql import SparkSession
from pyspark.sql.functions import broadcast

spark = SparkSession.builder.getOrCreate()

fact_orders  = spark.table("gold.fact_orders")
dim_products = spark.table("gold.dim_products")  # 95 MB — safe to broadcast

# Before (causes OOM — SortMergeJoin with skewed key):
# result = fact_orders.join(dim_products, "product_id")

# After: broadcast the small dimension table
result = fact_orders.join(broadcast(dim_products), "product_id")

# Alternatively, enable Adaptive Query Execution globally in cluster config:
# spark.conf.set("spark.sql.adaptive.enabled", "true")
# spark.conf.set("spark.sql.adaptive.autoBroadcastJoinThreshold", "200mb")
# spark.conf.set("spark.sql.adaptive.skewJoin.enabled", "true")

result.write.mode("overwrite").saveAsTable("gold.customer_360")`,
  },

  {
    id: 'kafka-consumer-lag',
    title: 'Kafka Consumer Group Lag: 2M+ Messages Behind',
    severity: 'P2',
    category: 'Streaming',
    tool: 'Kafka',
    icon: '⏳',
    briefing:
      'PagerDuty alert: Kafka consumer group `clickstream-to-delta` is 2.3 million messages behind on topic `user.clickstream`. Real-time session aggregates are 45 minutes stale and the product analytics team is escalating.',
    logs: [
      {
        time: '2026-05-21T07:14:02Z',
        level: 'WARN',
        source: 'kafka.consumer / clickstream-to-delta / partition-4',
        msg: 'consumer lag=487203 for topic=user.clickstream partition=4 offset=9234100 end=9721303. Lag increasing.',
      },
      {
        time: '2026-05-21T07:14:15Z',
        level: 'WARN',
        source: 'kafka.consumer / clickstream-to-delta / coordinator',
        msg: 'Consumer group clickstream-to-delta is 2318407 messages behind across 6 partitions. Average consume rate: 1,240 msg/s, produce rate: 18,500 msg/s.',
      },
      {
        time: '2026-05-21T07:15:03Z',
        level: 'ERROR',
        source: 'Spark Structured Streaming / MicroBatch / id=42',
        msg: 'Batch processing time 58.3s exceeded trigger interval 10s. Micro-batch falling behind. maxOffsetsPerTrigger=10000 may need tuning.',
      },
      {
        time: '2026-05-21T07:15:44Z',
        level: 'WARN',
        source: 'kafka.consumer / clickstream-to-delta / deserializer',
        msg: 'AvroDeserializer took avg 38.2ms per record (baseline: 0.4ms). Schema registry lookup for schema_id=8841 is not cached — fetching from https://schema-registry:8081 on every record.',
      },
      {
        time: '2026-05-21T07:16:01Z',
        level: 'ERROR',
        source: 'schema-registry / http / GET /schemas/ids/8841',
        msg: 'Response time 36.1ms (p99). Connection pool exhausted: 100/100 connections in use. New requests queuing.',
      },
      {
        time: '2026-05-21T07:18:30Z',
        level: 'INFO',
        source: 'Prometheus / Alertmanager',
        msg: 'Alert kafka_consumer_lag_critical firing: consumer_group=clickstream-to-delta lag=2318407 > threshold=500000 for 5m.',
      },
    ],
    metrics: [
      { label: 'Consumer Lag (total)', value: '2,318,407 msgs', status: 'critical' },
      { label: 'Consume Rate', value: '1,240 msg/s', status: 'critical' },
      { label: 'Produce Rate', value: '18,500 msg/s', status: 'warning' },
      { label: 'Avg Deserializer Latency', value: '38.2 ms / record', status: 'critical' },
      { label: 'Schema Registry p99 Latency', value: '36.1 ms', status: 'warning' },
      { label: 'Session Aggregates Freshness', value: '45 min stale', status: 'critical' },
    ],
    steps: [
      "Run `kafka-consumer-groups.sh --describe --group clickstream-to-delta` to confirm which partitions have the highest lag and whether any partition has LAG=0 (would indicate consumer death vs slow consumer).",
      "Check Spark Structured Streaming metrics in the Databricks / Grafana UI — look at 'inputRowsPerSecond' vs 'processedRowsPerSecond' and 'processingTime' per micro-batch to find the bottleneck.",
      "Profile the deserializer: search job logs for 'AvroDeserializer' or 'schema registry' latency — a schema registry lookup on every record would explain a 95x slowdown from the 0.4ms baseline.",
      "Verify the schema registry URL and connection pool settings in the consumer config (`schema.registry.url`, `max.schemas.per.subject`, `max.cached.schemas`) — if caching is disabled the consumer fetches the schema on every record.",
      "Re-enable schema caching (`max.cached.schemas=1000`) and restart the consumer group, then monitor lag trend in Grafana to confirm it is decreasing.",
    ],
    correctRCA:
      "A new Avro schema (schema_id=8841) was deployed to the schema registry at 06:45 UTC with a default cache TTL of 0 (no caching), which caused the Confluent Avro deserializer to issue an HTTP GET to the schema registry for every single message. The schema registry's connection pool was saturated with 100 concurrent connections, introducing 36ms of latency per record — a 95x increase from the 0.4ms baseline — dropping throughput from 18,500 msg/s to 1,240 msg/s and causing the consumer group to fall 2.3M messages behind within 30 minutes.",
    fix: "Update the consumer configuration to re-enable schema caching (`max.cached.schemas=1000`) and restart the consumer group; the lag will drain as the consumer catches up at full throughput.",
    fixCode: `# kafka_consumer_config.py — fixed schema registry caching

KAFKA_CONSUMER_CONFIG = {
    "bootstrap.servers": "kafka-broker-1:9092,kafka-broker-2:9092,kafka-broker-3:9092",
    "group.id": "clickstream-to-delta",
    "auto.offset.reset": "latest",

    # Schema registry — FIX: re-enable local schema cache
    "schema.registry.url": "https://schema-registry:8081",
    "max.cached.schemas": 1000,          # was accidentally set to 0 in last deploy
    "schema.registry.connection.timeout.ms": 5000,
    "schema.registry.read.timeout.ms": 5000,
}

# Spark Structured Streaming — also increase maxOffsetsPerTrigger
# to drain the backlog faster while catching up
spark.readStream \\
    .format("kafka") \\
    .option("kafka.bootstrap.servers", "kafka-broker-1:9092") \\
    .option("subscribe", "user.clickstream") \\
    .option("maxOffsetsPerTrigger", 500_000)  \\  # raise during catch-up, revert to 50k after
    .option("kafka.group.id", "clickstream-to-delta") \\
    .load()`,
  },

  {
    id: 'snowflake-credit-explosion',
    title: 'Snowflake Credit Explosion — Accidental Cartesian Join',
    severity: 'P2',
    category: 'Database',
    tool: 'Snowflake',
    icon: '💸',
    briefing:
      'Finance alert: Snowflake credit consumption for the `TRANSFORM_WH` warehouse is tracking 100x above yesterday. The daily budget of 200 credits was exceeded in 90 minutes. A single query has been running for 3+ hours scanning 10 billion rows.',
    logs: [
      {
        time: '2026-05-21T08:01:44Z',
        level: 'INFO',
        source: 'Snowflake / QUERY_HISTORY / TRANSFORM_WH',
        msg: "Query 01b3f7e4-0000-1234-0001-000300010001 started. Session: SYSADMIN. Statement: 'INSERT INTO gold.customer_product_matrix SELECT ...'",
      },
      {
        time: '2026-05-21T08:02:12Z',
        level: 'WARN',
        source: 'Snowflake / WAREHOUSE_METERING_HISTORY / TRANSFORM_WH',
        msg: 'Credits consumed in last 5 min: 18.4 (baseline: 0.2 per 5-min window). Warehouse auto-scaled to MAX_CLUSTER_COUNT=4.',
      },
      {
        time: '2026-05-21T08:15:00Z',
        level: 'WARN',
        source: 'Snowflake / QUERY_HISTORY / TRANSFORM_WH',
        msg: "Query 01b3f7e4 still running after 13m. Bytes scanned: 4.2 TB. Estimated bytes remaining: 38.6 TB. No partition pruning detected — full table scan on fact_events (9.8B rows).",
      },
      {
        time: '2026-05-21T09:00:00Z',
        level: 'ERROR',
        source: 'Snowflake / RESOURCE_MONITOR / DAILY_BUDGET_RM',
        msg: 'Resource monitor DAILY_BUDGET_RM: NOTIFY action triggered. Credits used: 201.3 / 200 limit. Notifying ACCOUNTADMIN.',
      },
      {
        time: '2026-05-21T09:01:00Z',
        level: 'WARN',
        source: 'Snowflake / RESOURCE_MONITOR / DAILY_BUDGET_RM',
        msg: 'Resource monitor DAILY_BUDGET_RM: SUSPEND_IMMEDIATE action triggered at 210 credits. Warehouse TRANSFORM_WH suspended. Running query 01b3f7e4 killed.',
      },
      {
        time: '2026-05-21T09:01:05Z',
        level: 'ERROR',
        source: 'Snowflake / QUERY_HISTORY / TRANSFORM_WH',
        msg: "Query 01b3f7e4 killed after 59m 21s. Status: FAILED. Error: 'Query was canceled by resource monitor DAILY_BUDGET_RM.'",
      },
    ],
    metrics: [
      { label: 'Credits Consumed Today', value: '210 / 200 budget', status: 'critical' },
      { label: 'Yesterday Credits (same hour)', value: '2.1', status: 'ok' },
      { label: 'Query Runtime', value: '59m 21s (killed)', status: 'critical' },
      { label: 'Bytes Scanned', value: '4.2 TB before kill', status: 'critical' },
      { label: 'Partition Pruning', value: 'None detected', status: 'critical' },
      { label: 'Estimated Result Rows', value: '~10B (cross join)', status: 'warning' },
    ],
    steps: [
      "Pull the full query text from QUERY_HISTORY: `SELECT query_text FROM snowflake.account_usage.query_history WHERE query_id = '01b3f7e4-0000-1234-0001-000300010001'` — look for a JOIN missing an ON clause.",
      "Check the query profile in Snowflake UI (History > query_id > Query Profile) — look for a 'CartesianJoin' or 'NestedLoopJoin' node with an extremely large output row estimate.",
      "Estimate the row explosion: `SELECT COUNT(*) FROM customers` × `SELECT COUNT(*) FROM fact_events` — if result is in billions you have confirmed the cartesian product.",
      "Review the dbt model or SQL file that generated this query in version control — find the missing JOIN condition and confirm it was not present in the previous version.",
      "Fix the JOIN condition, add a resource monitor with a lower SUSPEND threshold (e.g. 50 credits triggers SUSPEND, 100 triggers SUSPEND_IMMEDIATE), and add a LIMIT guard or row-count assertion to the model.",
    ],
    correctRCA:
      "A dbt model `customer_product_matrix.sql` was merged with a missing JOIN condition — the ON clause was accidentally deleted during a rebase conflict resolution, turning an intended INNER JOIN between `dim_customers` (500k rows) and `fact_events` (20k rows per customer, 10B total) into a cartesian product generating 5 trillion intermediate rows. Snowflake auto-scaled the warehouse to 4 clusters to handle the load, burning 210 credits in 90 minutes against a 200-credit daily budget before the resource monitor killed the query.",
    fix: "Restore the correct JOIN condition (`ON c.customer_id = e.customer_id`) in the dbt model, add a row-count test, and lower the resource monitor SUSPEND threshold to catch runaway queries sooner.",
    fixCode: `-- customer_product_matrix.sql (FIXED)
-- Before (missing ON clause — cartesian join):
-- SELECT c.customer_id, e.event_type, COUNT(*) AS event_count
-- FROM dim_customers c, fact_events e           -- implicit cross join!
-- GROUP BY 1, 2;

-- After (correct INNER JOIN with explicit ON clause):
SELECT
    c.customer_id,
    c.customer_segment,
    e.event_type,
    COUNT(*)              AS event_count,
    MIN(e.event_ts)       AS first_event_ts,
    MAX(e.event_ts)       AS last_event_ts
FROM dim_customers  c
JOIN fact_events    e  ON c.customer_id = e.customer_id   -- explicit join condition restored
WHERE e.event_ts >= DATEADD(day, -90, CURRENT_DATE)       -- partition pruning filter
GROUP BY 1, 2, 3;

-- dbt schema.yml — add a row count guard to catch explosions in CI
-- models:
--   - name: customer_product_matrix
--     tests:
--       - dbt_utils.expression_is_true:
--           expression: "count(*) < 50000000"  -- alert if > 50M rows`,
  },

  {
    id: 'airflow-dag-stuck',
    title: 'Airflow DAG Stuck in Running — Zombie Task',
    severity: 'P2',
    category: 'Orchestration',
    tool: 'Apache Airflow',
    icon: '🧟',
    briefing:
      'DAG `daily_warehouse_load` has been in "running" state for 6 hours. The upstream task `extract_salesforce` was manually marked as success by a team member yesterday but 3 downstream tasks remain queued and have not started. The warehouse load SLA of 08:00 UTC is already breached.',
    logs: [
      {
        time: '2026-05-21T02:00:01Z',
        level: 'INFO',
        source: 'airflow.scheduler / DagFileProcessor / daily_warehouse_load',
        msg: "DAG daily_warehouse_load scheduled for execution_date=2026-05-21T02:00:00+00:00. DagRun created with run_id=scheduled__2026-05-21T02:00:00+00:00.",
      },
      {
        time: '2026-05-21T02:00:05Z',
        level: 'INFO',
        source: 'airflow.task / extract_salesforce / 2026-05-21T02:00:00+00:00',
        msg: 'Task extract_salesforce manually set to SUCCESS by user admin via Airflow UI (Grid view > Mark success). Task did not actually execute.',
      },
      {
        time: '2026-05-21T02:00:07Z',
        level: 'WARN',
        source: 'airflow.scheduler / TaskInstance',
        msg: 'Task transform_crm_data is in QUEUED state but has unresolved upstream dependency: extract_salesforce expected state=SUCCESS — found SUCCESS (manual). Dependency check passed.',
      },
      {
        time: '2026-05-21T02:01:00Z',
        level: 'ERROR',
        source: 'airflow.scheduler / TaskInstance / transform_crm_data',
        msg: "Task transform_crm_data cannot start: XCom key 'salesforce_extract_path' pushed by extract_salesforce not found. Task state remains QUEUED.",
      },
      {
        time: '2026-05-21T04:00:00Z',
        level: 'WARN',
        source: 'airflow.scheduler / DeadlockDetector',
        msg: "Potential deadlock detected: 3 tasks in QUEUED state for DAG daily_warehouse_load (run_id=scheduled__2026-05-21T02:00:00+00:00) for > 120 minutes. Tasks: ['transform_crm_data', 'load_to_snowflake', 'dq_checks'].",
      },
      {
        time: '2026-05-21T08:05:00Z',
        level: 'ERROR',
        source: 'airflow.sla_miss / daily_warehouse_load',
        msg: "SLA miss detected: DAG daily_warehouse_load missed SLA of 08:00:00 UTC. Notification sent to #data-engineering-alerts. Execution still in RUNNING state.",
      },
    ],
    metrics: [
      { label: 'DAG Run Duration', value: '6h 5m (expected: 45min)', status: 'critical' },
      { label: 'Tasks in QUEUED', value: '3 of 7', status: 'critical' },
      { label: 'SLA Breach', value: 'Yes — 05:05 overdue', status: 'critical' },
      { label: 'XCom Value (extract_path)', value: 'NOT FOUND', status: 'critical' },
      { label: 'Scheduler Heartbeat', value: 'Healthy (5s)', status: 'ok' },
      { label: 'Worker Slots Available', value: '8 / 16 free', status: 'ok' },
    ],
    steps: [
      "Open Airflow Grid view for `daily_warehouse_load` execution_date=2026-05-21T02:00:00 — hover over `extract_salesforce` to confirm it shows 'Success (manual mark)' rather than a completed task run.",
      "Check XCom values: Admin > XComs, filter by dag_id=daily_warehouse_load, execution_date=2026-05-21, key=salesforce_extract_path — confirm the value is missing because the task never ran.",
      "Confirm the downstream tasks are stuck on missing XCom: open `transform_crm_data` logs and look for the XCom key lookup failure.",
      "Clear the manually-marked `extract_salesforce` task (right-click > Clear in Grid view) so it re-runs properly and pushes the XCom value, then monitor until it completes successfully.",
      "After the DAG completes, add an Airflow SLA callback and a DAG-level note discouraging manual task marking without verifying downstream XCom dependencies.",
    ],
    correctRCA:
      "A team member manually marked `extract_salesforce` as success in the Airflow UI at 02:00 UTC to unblock what they believed was a transient failure, but the task had never actually executed — meaning it never pushed its output path to XCom (`salesforce_extract_path`). Downstream tasks `transform_crm_data`, `load_to_snowflake`, and `dq_checks` all read this XCom key at startup; without it they fail the XCom lookup silently and remain in QUEUED state indefinitely, blocking the entire DAG run for 6 hours until the SLA miss alert fired.",
    fix: "Clear the manually-marked `extract_salesforce` task in Airflow Grid view to force a real execution; it will push the XCom value and unblock the 3 downstream tasks automatically.",
    fixCode: `# airflow CLI — clear the stuck task to force re-execution
airflow tasks clear daily_warehouse_load \\
    --task-ids extract_salesforce \\
    --execution-date 2026-05-21T02:00:00+00:00 \\
    --yes

# To prevent this class of issue, add XCom validation in the downstream operator:
# transform_crm_data.py
from airflow.exceptions import AirflowSkipException

def transform_crm(**context):
    ti = context["ti"]
    extract_path = ti.xcom_pull(
        task_ids="extract_salesforce",
        key="salesforce_extract_path"
    )
    if not extract_path:
        raise ValueError(
            "XCom 'salesforce_extract_path' is None — "
            "extract_salesforce may have been manually marked success without running. "
            "Clear the task and let it re-execute."
        )
    # ... rest of transform logic`,
  },

  {
    id: 'delta-small-file-problem',
    title: 'Delta Lake Small File Proliferation — 8x Query Slowdown',
    severity: 'P3',
    category: 'Storage',
    tool: 'Delta Lake',
    icon: '🐢',
    briefing:
      'Analysts are reporting that queries on `silver.clickstream_events` have gone from ~45 seconds to 6+ minutes over the past 3 weeks. The table is used by 12 dashboards. No schema changes have been made and cluster size is unchanged.',
    logs: [
      {
        time: '2026-05-21T09:30:12Z',
        level: 'WARN',
        source: 'Spark / Driver / FileSourceStrategy',
        msg: 'Planning query on silver.clickstream_events: discovered 47,832 Parquet files across 91 partitions. File listing took 38.4s. Consider running OPTIMIZE to compact small files.',
      },
      {
        time: '2026-05-21T09:30:51Z',
        level: 'WARN',
        source: 'Spark / Driver / FileScanRDD',
        msg: 'Opening 47,832 files for scan. Avg file size: 18 KB (target: 128 MB). File open overhead estimated at 47.8s for this query.',
      },
      {
        time: '2026-05-21T09:31:00Z',
        level: 'INFO',
        source: 'Spark / Executor / all',
        msg: 'Stage 0: 47,832 tasks created (1 task per file). Most tasks complete in < 50ms — task scheduling overhead dominates over actual computation.',
      },
      {
        time: '2026-05-21T09:35:44Z',
        level: 'WARN',
        source: 'Delta / DeltaLog / silver.clickstream_events',
        msg: 'Transaction log has 21,440 entries (commits). Checkpoint is 5,000 commits stale. Log replay during table scan adding 12.2s overhead.',
      },
      {
        time: '2026-05-21T09:36:55Z',
        level: 'INFO',
        source: 'Spark / Driver / SQLExecution',
        msg: "Query on silver.clickstream_events completed in 367.1s. Breakdown: file listing 38s, log replay 12s, task scheduling 180s, actual computation 137s.",
      },
    ],
    metrics: [
      { label: 'Total Parquet Files', value: '47,832', status: 'critical' },
      { label: 'Average File Size', value: '18 KB (target 128 MB)', status: 'critical' },
      { label: 'Query Runtime (today)', value: '367 sec (was 45 sec)', status: 'critical' },
      { label: 'Delta Log Commits (since checkpoint)', value: '21,440', status: 'warning' },
      { label: 'Task Scheduling Overhead', value: '180s / 367s total', status: 'warning' },
      { label: 'Last OPTIMIZE Run', value: 'Never', status: 'critical' },
    ],
    steps: [
      "Confirm the file count: `DESCRIBE DETAIL silver.clickstream_events` in a notebook — look at `numFiles` and calculate average file size as `sizeInBytes / numFiles`.",
      "Check Delta transaction log health: `SELECT * FROM silver.clickstream_events.history LIMIT 20` — look for the last checkpoint timestamp and number of commits since then.",
      "Run OPTIMIZE on a sample partition first to test improvement: `OPTIMIZE silver.clickstream_events WHERE event_date = '2026-05-20' ZORDER BY (user_id, event_type)` — compare before/after query time on that partition.",
      "Run a full table OPTIMIZE with ZORDER on the most commonly filtered columns to compact all 47k files and create a colocality index.",
      "Schedule OPTIMIZE + VACUUM to run nightly via a Databricks Job or Airflow DAG to prevent re-accumulation; set `delta.autoOptimize.optimizeWrite=true` and `delta.autoOptimize.autoCompact=true` on the table.",
    ],
    correctRCA:
      "The Spark streaming job that writes to `silver.clickstream_events` runs every 5 minutes with micro-batches of ~500 rows, writing one tiny Parquet file (~18 KB) per partition per trigger. Over 3 weeks this accumulated 47,832 files averaging 18 KB each — 7,000x smaller than the 128 MB Parquet target. Every query now requires Spark to open nearly 48,000 file handles (adding 86 seconds of I/O overhead) and schedule 48,000 tasks (adding 180 seconds of scheduling overhead), turning a 45-second analytical query into a 6-minute one. OPTIMIZE was never configured to run on this table.",
    fix: "Run `OPTIMIZE silver.clickstream_events ZORDER BY (user_id, event_type)` immediately to compact files, then enable `autoOptimize` on the table and schedule a nightly OPTIMIZE + VACUUM job.",
    fixCode: `-- Step 1: Immediate fix — compact all small files with ZORDER
OPTIMIZE silver.clickstream_events
ZORDER BY (user_id, event_type);
-- Runtime ~15-30 min for first run; rewrites 47k files into ~400 x 128 MB files

-- Step 2: Clean up old file versions (retain 7 days for time travel)
VACUUM silver.clickstream_events RETAIN 168 HOURS;

-- Step 3: Enable auto-compaction to prevent recurrence
ALTER TABLE silver.clickstream_events
SET TBLPROPERTIES (
  'delta.autoOptimize.optimizeWrite' = 'true',   -- coalesces small writes at write time
  'delta.autoOptimize.autoCompact'   = 'true'    -- background compaction after writes
);

-- Step 4: Schedule nightly OPTIMIZE in Databricks workflow (pseudocode)
-- Databricks Jobs YAML:
-- name: nightly_delta_optimize
-- schedule: "0 3 * * *"   # 03:00 UTC daily
-- tasks:
--   - task_key: optimize_clickstream
--     notebook_task:
--       notebook_path: /ops/delta_optimize
--     cluster: job_cluster_small`,
  },
];
