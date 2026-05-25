// Kafka + Streaming module — Kafka architecture, Spark Structured Streaming,
// Delta Live Tables, CDC, exactly-once semantics, watermarking.

export const kafkaStreamingModule = {
  sections: [
    {
      title: 'Kafka Fundamentals',
      subtopics: [
        {
          id: 'kafka-architecture',
          title: 'Kafka Architecture',
          difficulty: 'Intermediate',
          explanation: 'Apache Kafka is a distributed event streaming platform. Producers write events to topics. Consumers read events from topics. Brokers store events. ZooKeeper (or KRaft mode) manages cluster metadata. Events are durably stored and replayable — unlike message queues where messages are deleted after consumption.',
          why: 'Kafka is the backbone of real-time data platforms. It decouples producers from consumers, allows multiple consumers to independently read the same stream, and persists events for replay — critical for audit trails, exactly-once pipelines, and recovery from failures.',
          syntax: `// Core Kafka concepts:
// Topic: named stream of events (like a table in a database)
// Partition: horizontal subdivision of a topic for parallelism
// Offset: sequential ID of each message within a partition
// Producer: writes messages to a topic
// Consumer: reads messages from a topic
// Consumer Group: group of consumers sharing a topic's partitions
// Broker: Kafka server that stores partitions
// Retention: how long Kafka keeps messages (default: 7 days)`,
          example: `// Event Hub (Azure's managed Kafka) reading from PySpark:
from pyspark.sql.functions import from_json, col
from pyspark.sql.types import StructType, StructField, StringType, DoubleType

schema = StructType([
    StructField("order_id",  StringType(),  True),
    StructField("amount",    DoubleType(),  True),
    StructField("status",    StringType(),  True),
])

# Read from Kafka/Event Hub as a stream
stream = spark.readStream \
    .format("kafka") \
    .option("kafka.bootstrap.servers", "my-eventhub.servicebus.windows.net:9093") \
    .option("subscribe", "orders-topic") \
    .option("startingOffsets", "latest") \
    .load()

# Decode binary value, parse JSON
orders = stream \
    .select(from_json(col("value").cast("string"), schema).alias("data")) \
    .select("data.*")

# Write to Delta sink
orders.writeStream \
    .format("delta") \
    .outputMode("append") \
    .option("checkpointLocation", "/checkpoints/orders/") \
    .start("/tables/bronze_orders/")`,
          expectedOutput: 'Continuous stream of orders flowing into Bronze Delta table',
          practice: 'Your company ingests 500K transactions/second through Kafka. The downstream Spark job is slow and lagging. Design the partition strategy: how many partitions, what partition key, and what consumer group configuration would you use?',
          hint: 'Start with peak throughput and per-partition capacity. Partition key should spread load evenly without hotspots. Consumer count must not exceed partition count.',
          solution: 'Partitions = peak_throughput / per_partition_capacity. At 500K events/sec with 1KB avg size = 500 MB/s. Event Hubs Standard handles ~1 MB/s per partition → 500 partitions. Partition key: use customer_id hash (not merchant_id — high-value merchants cause hotspots). Consumer group: deploy 500 Spark executor tasks, one per partition. Separate consumer groups for real-time scoring vs batch analytics so they don\'t compete. Monitor consumer lag — set PagerDuty alert at lag > 100K events.',
          interview: {
            question: 'Explain the Kafka architecture: what is a partition, why does it matter, and how do consumer groups relate to partitions?',
            answer: 'A Kafka topic is split into partitions — ordered, append-only sequences of messages. Partitions are the unit of parallelism: a topic with 12 partitions can be read by up to 12 consumer instances in parallel, each handling its own partition. Consumer groups are the coordination mechanism: when multiple consumers share a consumer group, Kafka assigns each partition to exactly one consumer in the group (no duplicate reads). If you have 12 partitions and 6 consumers in a group, each consumer handles 2 partitions. Add a 13th consumer and it sits idle (more consumers than partitions = wasted resources). This is why partition count determines the maximum parallelism of your consumer pipeline.',
          },
          commonMistakes: [
            'Not configuring enough partitions upfront — Kafka allows increasing partitions but not decreasing. Plan for 2–3x your expected peak throughput from the start.',
            'Using a single consumer group for both real-time processing and batch analytics — they have different consumption rates. Use separate consumer groups so batch doesn\'t hold back real-time.',
            'Treating Kafka offsets as globally unique message IDs — offsets are per-partition. Message uniqueness requires (topic, partition, offset) as the composite key.',
          ],
          productionContext: 'Azure Event Hubs is a fully managed Kafka-compatible service used in most Azure streaming architectures. It exposes the Kafka protocol, so PySpark Structured Streaming, Flink, and any Kafka client work without changes. Event Hubs handles broker management, replication, and scaling — you configure partition count and retention, then connect your consumers.',
          performanceTip: 'Partition count = max parallelism. For Event Hubs, choose partition count based on your peak ingestion throughput divided by per-partition throughput. Event Hubs Standard handles ~1 MB/s per partition. For 100 MB/s throughput: 100 partitions. More partitions also mean more memory for consumer offset tracking — don\'t over-partition.',
        },
        {
          id: 'kafka-consumer-groups',
          title: 'Consumer Groups and Offsets',
          difficulty: 'Intermediate',
          explanation: 'Consumer groups enable parallel consumption and offset tracking. Each consumer group independently tracks its position (offset) in each partition. Multiple groups can read the same topic independently — e.g., a real-time group and a batch processing group both consume the same events without interfering.',
          why: 'Consumer groups are the foundation of Kafka\'s scalability and multi-tenancy. They allow different systems (Spark Structured Streaming, a Flink job, an alerting service) to all read the same event stream independently, each at their own pace.',
          syntax: `// Consumer group offset management:
// auto.offset.reset controls behavior when no committed offset exists
// "earliest" = start from the beginning of the topic
// "latest" = start from new messages only (skip existing)

// Python consumer example (Confluent Kafka client):
from confluent_kafka import Consumer

c = Consumer({
    "bootstrap.servers": "broker1:9092",
    "group.id":          "order-processor-v1",  # unique per consumer app
    "auto.offset.reset": "earliest",
    "enable.auto.commit": False,  # manual commit for exactly-once
})

c.subscribe(["orders-topic"])

while True:
    msg = c.poll(timeout=1.0)
    if msg is None or msg.error():
        continue
    process(msg.value())
    c.commit(msg)  # only commit after successful processing`,
          example: `// Kafka offset commit strategies:
// auto-commit: Kafka commits offsets periodically (at-least-once, risk duplicates)
// manual commit: your code commits after processing (more control)
// transactional: Kafka + your sink in a single transaction (exactly-once)

// Monitoring consumer lag (how far behind the consumer is):
// Consumer lag = latest partition offset - last committed consumer offset
// High lag = consumer is falling behind = investigate throughput bottleneck

// Azure Event Hubs metric: Consumer Group Lag
// Databricks: .streamingQuery.lastProgress["sources"][0]["endOffset"]`,
          expectedOutput: 'Consumer processes messages, commits offsets after success, maintains lag = 0 under normal conditions',
          practice: 'Your Kafka consumer group for a payments pipeline shows lag growing from 0 to 2 million over 30 minutes. The Spark streaming job is still running. Walk through your diagnosis and remediation steps.',
          hint: 'Check whether the bottleneck is consumer throughput, downstream write speed, or a sudden producer spike. Lag growth rate tells you if you\'re falling behind at constant or accelerating speed.',
          solution: 'Step 1: Check producer throughput — did Event Hub ingest rate spike? Step 2: Check consumer processing time per batch — is the Delta MERGE taking longer than trigger interval? Step 3: Check partition assignment — are all partitions assigned, or is a rebalance happening? Step 4: If MERGE is slow, add a partition filter to the merge condition to reduce scan scope. Step 5: If producer spike, increase maxOffsetsPerTrigger to process larger batches. Step 6: If executor OOM, increase cluster memory. Add a lag alert in Azure Monitor so you catch this within 5 minutes next time.',
          interview: {
            question: 'What is consumer group lag and why does it matter operationally?',
            answer: 'Consumer lag is the number of uncommitted messages between the consumer\'s last committed offset and the latest message in the partition. Lag = 0 means the consumer is fully caught up. Growing lag means the consumer is processing slower than producers are writing — a warning sign that the pipeline will fall behind and eventually cause memory pressure and upstream backpressure. In production: alert when lag exceeds 10,000 messages (or whatever threshold means "X minutes of data unprocessed"). Common causes: slow downstream writes (Delta MERGE taking too long), insufficient consumer parallelism (need more partitions or consumer instances), or a processing spike.',
          },
          commonMistakes: [
            'Committing offsets before processing — if the app crashes after committing but before writing the result, you lose those messages (at-most-once semantics). Always process first, commit after.',
            'Using the same consumer group ID for different applications — two apps sharing a group split the partitions between them; each gets only half the messages.',
            'Not monitoring consumer lag in production — lag alerts are the primary signal for streaming pipeline health issues.',
          ],
          productionContext: 'In Azure Event Hubs, consumer group lag is visible in Azure Monitor and the Event Hubs namespace metrics. Set up a Monitor alert rule: if consumer group lag > 50,000 events for more than 5 minutes, trigger a PagerDuty/Teams alert. This catches slow consumers before they cause pipeline SLA breaches.',
          performanceTip: 'If consumer lag grows and you can\'t increase Spark parallelism immediately, temporarily increase spark.streaming.kafka.maxRatePerPartition to control the micro-batch size, then set spark.sql.shuffle.partitions appropriately. This prevents the Spark job from trying to process a huge backlog batch that causes OOM.',
        },
        {
          id: 'kafka-exactly-once',
          title: 'Exactly-Once Semantics',
          difficulty: 'Advanced',
          explanation: 'Exactly-once semantics guarantees that each message is processed and written to the output exactly one time — no duplicates, no losses. Kafka supports this via idempotent producers, transactional APIs, and consumer offset coordination with the sink.',
          why: 'Financial transactions, order processing, and inventory updates require exactly-once — duplicate processing causes double charges or incorrect stock levels. At-least-once (the default) produces duplicates; at-most-once loses data. Exactly-once is the hardest to implement but the only correct choice for money-related streams.',
          syntax: `// Exactly-once with Spark Structured Streaming + Delta Lake:
// Delta Lake provides idempotent writes via the checkpoint mechanism.
// When Spark re-processes a micro-batch after failure, Delta's transaction log
// detects the duplicate write and skips it.

// Key settings for exactly-once:
spark.conf.set("spark.sql.streaming.stateStore.providerClass",
    "org.apache.spark.sql.execution.streaming.state.HDFSBackedStateStoreProvider")

query = stream.writeStream \
    .format("delta") \
    .outputMode("append") \
    .option("checkpointLocation", "abfss://checkpoints@adls/orders/") \
    .trigger(processingTime="30 seconds") \
    .start("abfss://silver@adls/orders/")`,
          example: `# Exactly-once pattern with foreachBatch + MERGE:
# This prevents duplicate rows even if the micro-batch is replayed.

def upsert_to_delta(microBatchDF, batchId):
    from delta.tables import DeltaTable

    # Deduplicate within the micro-batch first
    deduped = microBatchDF.dropDuplicates(["order_id"])

    # MERGE is idempotent — replaying this batch with same batchId
    # produces the same result (no extra rows)
    target = DeltaTable.forName(spark, "silver.orders")
    target.alias("t").merge(
        deduped.alias("s"),
        "t.order_id = s.order_id"
    ).whenMatchedUpdateAll() \
     .whenNotMatchedInsertAll() \
     .execute()

    print(f"Batch {batchId}: {deduped.count()} rows merged")

stream.writeStream \
    .foreachBatch(upsert_to_delta) \
    .option("checkpointLocation", "/checkpoints/orders/") \
    .trigger(processingTime="60 seconds") \
    .start()`,
          expectedOutput: 'Each order_id appears exactly once in silver.orders regardless of stream replays',
          practice: 'A Spark Structured Streaming job writing to Delta crashed mid-batch at 3am. On restart, some records may have been partially written. Describe the exactly-once recovery procedure and what you verify before declaring the pipeline healthy.',
          hint: 'The checkpoint tells Spark the last committed batch. Delta\'s transaction log tells you what was actually written. Compare the two before re-running.',
          solution: 'Step 1: Check checkpoint — find last successfully committed batchId in the checkpoint directory. Step 2: Check Delta transaction log — run DESCRIBE HISTORY silver.orders to see if any partial write occurred after the last clean batch. Step 3: If partial data exists, use RESTORE TABLE silver.orders TO VERSION AS OF <last_clean_version>. Step 4: Restart the Spark job — Structured Streaming reads the checkpoint and replays from the last committed Kafka offset. Step 5: Verify row count matches expected: compare silver.orders count to bronze count for the same time window. The foreachBatch + MERGE pattern is idempotent — the same batchId replayed produces the same result.',
          interview: {
            question: 'How do you achieve exactly-once processing in a Kafka → Delta Lake pipeline?',
            answer: 'Three components working together: (1) Kafka idempotent producer (enable.idempotence=true) prevents duplicates from producer retries. (2) Spark Structured Streaming checkpoint tracks which Kafka offsets have been processed; on restart, Spark re-reads from the last committed offset without skipping or re-processing committed batches. (3) Delta Lake MERGE with a natural key at the sink ensures idempotency — if a micro-batch is replayed after a crash, the MERGE updates instead of inserting, producing no duplicates. The checkpoint + Delta MERGE combination is the practical exactly-once pattern without needing Kafka\'s full transactional API.',
          },
          commonMistakes: [
            'Relying on at-least-once + downstream deduplication instead of designing for exactly-once — deduplication at query time is expensive and error-prone at scale.',
            'Not testing failure recovery — exactly-once only matters when failures happen. Always test your pipeline by killing the Spark job mid-batch and verifying no duplicates appear.',
            'Using append output mode with a non-idempotent sink — if your sink doesn\'t support deduplication (a REST API, non-Delta database), append + replays = duplicates.',
          ],
          productionContext: 'In Azure streaming pipelines, Spark Structured Streaming + Delta Lake MERGE is the standard exactly-once pattern. The checkpoint sits in ADLS or Fabric OneLake. The pattern is: readStream from Event Hubs → foreachBatch → deduplicate within batch → MERGE into Delta. This handles both in-order and out-of-order messages correctly.',
          performanceTip: 'The MERGE in foreachBatch is the most expensive operation. Optimize it by: (1) adding a date partition filter to the MERGE condition to limit the target table scan, (2) pre-sorting the micro-batch by partition key before MERGE so Delta file skipping works, (3) keeping micro-batch size at 30–60 seconds so each MERGE is manageable in size.',
        },
      ],
    },
    {
      title: 'Watermarking and Time Semantics',
      subtopics: [
        {
          id: 'kafka-watermarking',
          title: 'Watermarking and Late Data',
          difficulty: 'Advanced',
          explanation: 'Watermarking tells Spark Structured Streaming how long to wait for late-arriving events before closing a time window. Event time is when the event actually occurred; processing time is when Spark receives it. Late data arrives with event time in the past.',
          why: 'Without watermarking, Spark must keep all historical state in memory to handle any possible late event — causing unbounded memory growth. Watermarking bounds the state by discarding events older than the watermark threshold.',
          syntax: `from pyspark.sql.functions import window, col

# Watermark: wait up to 2 hours for late events
# Events more than 2 hours late are dropped from aggregations

stream_with_watermark = stream \
    .withWatermark("event_time", "2 hours") \
    .groupBy(
        window(col("event_time"), "1 hour"),  # 1-hour tumbling window
        col("product_category")
    ) \
    .sum("amount")

# Output mode "append" only emits a window result after the watermark passes it
stream_with_watermark.writeStream \
    .outputMode("append") \
    .format("delta") \
    .option("checkpointLocation", "/checkpoints/hourly_revenue/") \
    .start("/tables/gold_hourly_revenue/")`,
          example: `// Event-time vs processing-time example:
// An IoT sensor records a reading at 14:00 (event_time)
// Network issues delay delivery — Spark receives it at 16:05 (processing_time)
// Processing time is 2 hours and 5 minutes AFTER event time

// Without watermark: Spark keeps the 14:00 window open forever
// Memory grows unboundedly as more late events arrive

// With .withWatermark("event_time", "2 hours"):
// At processing time 16:05, max event_time seen = ~16:00
// Watermark = 16:00 - 2 hours = 14:00
// The 14:00 window is right at the boundary — included
// At 16:10, watermark = 14:10 — the 14:00 window is now closed
// Events arriving for 14:00 after 16:10 are dropped (too late)

// The tradeoff: larger watermark = more late data accepted,
// but more memory used to hold open windows.`,
          expectedOutput: 'Time windows close after watermark passes, state is bounded, late data within threshold is included',
          practice: 'You are building a pipeline that aggregates IoT sensor readings into 1-hour windows. Sensors can lose network connectivity for up to 6 hours and send buffered readings when reconnected. Choose the correct watermark threshold and explain why using processing time instead of event time would produce wrong results.',
          hint: 'Watermark must be at least as long as the maximum expected late-arrival delay. Think about what happens to historical windows if you use the wrong time column.',
          solution: 'Watermark: use .withWatermark("sensor_timestamp", "6 hours") — sensors can buffer 6 hours, so any watermark less than 6 hours would drop valid readings. Use event time (sensor_timestamp) not processing time because: a sensor buffered for 5 hours then reconnects and sends readings timestamped 5 hours ago. Processing time windows would put these in the current hour — wrong. Event time windows put them in the correct historical hour — right. The 1-hour aggregation grouped by window(sensor_timestamp, "1 hour") with a 6-hour watermark means windows stay open 6 hours after their end time to accept late arrivals.',
          interview: {
            question: 'What is the difference between event time and processing time, and when does watermarking become critical?',
            answer: 'Event time is when the event actually occurred (recorded by the source, e.g., a sensor timestamp). Processing time is when Spark receives and processes the event. In ideal conditions they\'re nearly equal; in real systems, network delays, source backlogs, or retries can make processing time hours or days after event time. Watermarking is critical when: (1) you\'re grouping data by event-time windows (hourly revenue, 5-minute sensor averages), (2) your source can have late-arriving events, and (3) you need bounded memory usage. Without watermarking, Spark Structured Streaming keeps all window state in memory forever to handle any possible late event — eventually causing OOM on long-running streaming jobs.',
          },
          commonMistakes: [
            'Using processing time for business KPIs — hourly revenue should be calculated by the event\'s order timestamp, not when Spark processed it. Processing time windows are non-deterministic and produce different results if the pipeline is restarted.',
            'Setting watermark too short — a 5-minute watermark for IoT sensors that can have 30-minute network delays will drop valid data. Profile your source\'s actual late-arrival distribution before setting the threshold.',
            'Using "update" output mode without understanding state semantics — update mode re-emits updated window values continuously; append mode only emits when a window is finalized. Wrong mode = wrong results.',
          ],
          productionContext: 'In production IoT pipelines on Databricks/Fabric, watermark of 30 minutes to 2 hours is typical. Larger watermarks (6–24 hours) are used for mobile app event pipelines where devices may be offline for hours. Monitor late data percentage using the streaming query metrics — if > 5% of events are arriving past the watermark, increase it.',
          performanceTip: 'Watermark threshold directly affects stateful operator memory. A 2-hour watermark for 1-hour windows means Spark keeps 2 hours of window state in memory. For 1M events/hour, this can be 2-4 GB of state. Use RocksDB state store (spark.sql.streaming.stateStore.providerClass=RocksDB) for large state — it spills to disk and avoids OOM for high-cardinality windows.',
        },
      ],
    },
    {
      title: 'Spark Structured Streaming',
      subtopics: [
        {
          id: 'sss-basics',
          title: 'Structured Streaming Patterns',
          difficulty: 'Advanced',
          explanation: 'Spark Structured Streaming is a scalable stream processing engine built on Spark SQL. It uses the same DataFrame API as batch processing. Spark treats a stream as an unbounded table and incrementally appends new data every trigger interval.',
          why: 'The "stream as a table" abstraction means the same business logic works for both batch and streaming — write once, run in both modes. This eliminates maintaining two separate codebases for batch and streaming analytics.',
          syntax: `# Three trigger modes:
# processingTime: run every N seconds (most common)
# once: process all available data then stop (useful for backfill)
# availableNow: process all available data (modern replacement for once)

query = stream.writeStream \
    .format("delta") \
    .outputMode("append") \
    .option("checkpointLocation", "...") \
    .trigger(processingTime="30 seconds") \
    .start("...")

# Monitor streaming query:
print(query.status)
print(query.lastProgress["numInputRows"])
print(query.lastProgress["processedRowsPerSecond"])`,
          example: `# Production streaming pattern: multi-stage with quality gates

from pyspark.sql.functions import from_json, col, current_timestamp

# Stage 1: Read from Kafka
raw = spark.readStream \
    .format("kafka") \
    .option("kafka.bootstrap.servers", "eventhub:9093") \
    .option("subscribe", "transactions") \
    .option("startingOffsets", "latest") \
    .load()

# Stage 2: Parse and validate
parsed = raw \
    .select(from_json(col("value").cast("string"), schema).alias("d")) \
    .select("d.*") \
    .filter(col("transaction_id").isNotNull()) \
    .filter(col("amount") > 0) \
    .withColumn("processed_at", current_timestamp())

# Stage 3: Write to Bronze (append) — fast, no MERGE needed
bronze_query = parsed.writeStream \
    .format("delta") \
    .outputMode("append") \
    .option("checkpointLocation", "/checkpoints/bronze_tx/") \
    .trigger(processingTime="30 seconds") \
    .start("/tables/bronze_transactions/")

bronze_query.awaitTermination()`,
          expectedOutput: 'Validated transactions flowing into Bronze Delta with 30-second micro-batches',
          practice: 'Design a Structured Streaming pipeline that reads from a Kafka topic, deduplicates by transaction_id within each micro-batch, validates that amount > 0 and transaction_id is not null, and writes clean records to Bronze Delta. Describe the trigger choice and why you would or would not use foreachBatch.',
          hint: 'Think about which operations require foreachBatch vs can be expressed as a standard writeStream. Deduplication within a batch does not require foreachBatch, but MERGE does.',
          solution: 'Read with readStream.format("kafka"). Parse JSON payload. Filter: col("transaction_id").isNotNull() and col("amount") > 0. Deduplicate: .dropDuplicates(["transaction_id"]) — this works within a micro-batch. For Bronze: use standard writeStream.format("delta").outputMode("append") — no foreachBatch needed since Bronze is append-only and Structured Streaming handles idempotency via checkpoint. Trigger: processingTime="30 seconds" for balanced latency vs throughput. Use foreachBatch only if you need MERGE (Silver/Gold), not for Bronze append. Add .option("maxOffsetsPerTrigger", 100000) to cap batch size.',
          interview: {
            question: 'What is the foreachBatch pattern in Structured Streaming and why is it important?',
            answer: 'foreachBatch allows you to apply any arbitrary batch DataFrame operation to each micro-batch in a stream. The standard writeStream sink only supports append or a few native formats. foreachBatch unlocks: Delta MERGE (for exactly-once upserts), writing to multiple sinks in one micro-batch, custom deduplication logic, and calling external APIs. The micro-batch DataFrame and a batchId are passed to your function — batchId is monotonically increasing and stable across retries, so you can use it for idempotent operations. Critical rule: make your foreachBatch function idempotent — it will be re-called with the same batchId on failure recovery.',
          },
          commonMistakes: [
            'Using awaitTermination() in production notebooks — it blocks the driver indefinitely. In production, run streaming as a Databricks/Fabric continuous job.',
            'Not handling schema evolution — Kafka payloads change over time. Use from_json with permissive mode and log schema mismatches rather than crashing.',
            'Calling df.count() or df.show() inside foreachBatch — these trigger extra Spark jobs on each micro-batch, dramatically slowing throughput.',
          ],
          productionContext: 'In production Databricks streaming jobs, the trigger is set to processingTime="30 seconds" for most streaming pipelines. The job runs as a "Continuous" Databricks Workflow — Databricks manages the always-on compute, auto-restarts on failure, and sends alerts via the job notification settings.',
          performanceTip: 'Set maxOffsetsPerTrigger (Kafka) or maxFilesPerTrigger (cloudFiles) to control how many records each micro-batch processes. Without a limit, a pipeline that falls behind may try to process 10M records in one batch, causing OOM. Start with a cap, measure steady-state latency, then tune upward.',
        },
      ],
    },
    {
      title: 'Delta Live Tables',
      subtopics: [
        {
          id: 'dlt-basics',
          title: 'Delta Live Tables (DLT)',
          difficulty: 'Advanced',
          explanation: 'Delta Live Tables is Databricks\' declarative pipeline framework. You define tables as Python or SQL with @dlt.table decorators, and DLT handles orchestration, dependency resolution, error recovery, data quality enforcement, and lineage automatically.',
          why: 'Traditional Spark pipelines require manual orchestration, manual error handling, and manual data quality checks. DLT removes all of that — you declare WHAT you want (the transformation), and DLT manages HOW it runs (ordering, retries, quality enforcement, incremental vs full refresh).',
          syntax: `import dlt
from pyspark.sql.functions import col, to_date

# Bronze: raw ingestion (streaming or batch)
@dlt.table(name="bronze_orders",
           comment="Raw orders from Kafka Event Hub")
def bronze_orders():
    return (
        spark.readStream
             .format("cloudFiles")
             .option("cloudFiles.format", "json")
             .option("cloudFiles.schemaLocation", "/schemas/orders/")
             .load("/raw/orders/")
    )

# Silver: clean and validate with DLT expectations
@dlt.table(name="silver_orders",
           comment="Validated and typed order records")
@dlt.expect_or_drop("valid_amount", "amount > 0")
@dlt.expect_or_drop("valid_order_id", "order_id IS NOT NULL")
def silver_orders():
    return (
        dlt.read_stream("bronze_orders")
           .withColumn("order_date", to_date(col("order_date"), "yyyy-MM-dd"))
           .withColumn("amount", col("amount").cast("double"))
    )`,
          example: `# Gold: aggregation with SCD2 support
@dlt.table(name="gold_daily_revenue",
           comment="Daily revenue by product category")
def gold_daily_revenue():
    return (
        dlt.read("silver_orders")
           .groupBy("order_date", "product_category")
           .agg({"amount": "sum", "order_id": "count"})
    )

# Apply changes (SCD Type 1 and 2) using DLT APPLY CHANGES:
dlt.create_streaming_table("dim_customers")
dlt.apply_changes(
    target = "dim_customers",
    source = dlt.read_stream("bronze_customers"),
    keys   = ["customer_id"],
    sequence_by = col("updated_at"),  # tiebreaker for ordering
    stored_as_scd_type = 2,           # or 1 for overwrite
)`,
          expectedOutput: 'Declarative pipeline: Bronze ingests → Silver validates (bad rows dropped per expectation) → Gold aggregates → DLT manages all scheduling and recovery',
          practice: 'You are building a DLT pipeline for order data. The Silver table must reject orders with null order_id and drop orders with amount <= 0 or amount > 1,000,000 (assumed fraudulent). Design the expectations, choose the correct expectation type for each rule, and explain what happens to the rejected rows.',
          hint: 'Choose between expect(), expect_or_drop(), and expect_or_fail() based on business impact. Null order_id is a data integrity issue. Amount out of range is a quality issue but should not halt the pipeline.',
          solution: 'Use @dlt.expect_or_fail("non_null_order_id", "order_id IS NOT NULL") — a null primary key means we cannot identify the record; the pipeline should stop and alert rather than silently discard. Use @dlt.expect_or_drop("valid_amount", "amount > 0 AND amount <= 1000000") — out-of-range amounts are cleaned by dropping them; the pipeline continues. DLT logs dropped rows to the pipeline event log under the expectation name. You can query dropped counts in the DLT UI or via spark.table("event_log") filtered by expectation name. Review dropped-row counts in the daily quality report — a spike means a source data problem.',
          interview: {
            question: 'What are DLT expectations and how do they compare to external data quality tools like Great Expectations or dbt tests?',
            answer: 'DLT expectations are inline data quality rules declared with @dlt.expect(), @dlt.expect_or_drop(), or @dlt.expect_or_fail(). Expect logs violations but keeps rows; expect_or_drop removes failing rows and tracks the drop count in DLT metrics; expect_or_fail halts the pipeline on any violation. Compared to Great Expectations or dbt tests: DLT expectations run inline during the transformation (not as a separate post-load step), which means bad data is caught at the gate rather than after it\'s loaded. The tradeoff: DLT expectations are simpler and integrated with Databricks observability but less flexible than Great Expectations for complex statistical tests. In production, use DLT expectations for fast row-level checks and a separate Great Expectations suite for distribution/statistical checks.',
          },
          commonMistakes: [
            'Using @dlt.expect_or_fail for non-critical quality issues — this halts the entire pipeline. Use expect_or_drop for cleanable issues and reserve expect_or_fail for data integrity violations that truly shouldn\'t proceed.',
            'Not using APPLY CHANGES for CDC sources — manually implementing SCD logic in DLT is error-prone. APPLY CHANGES handles out-of-order events and late-arriving deletes correctly.',
            'Mixing batch (@dlt.table with no stream) and streaming tables in the same pipeline incorrectly — batch tables re-read all source data on every DLT run; streaming tables only read new data. Use streaming for large sources.',
          ],
          productionContext: 'DLT pipelines in Databricks run as "Continuous" or "Triggered" jobs. Continuous mode: pipeline always-on, processes new data within seconds. Triggered mode: pipeline runs on schedule, processes all new data since last run. For Medallion pipelines: Bronze and Silver are usually continuous (low latency), Gold is triggered (run after Silver completes).',
          performanceTip: 'DLT Enhanced Autoscaling is more aggressive than standard Databricks autoscaling — it scales down clusters faster after each micro-batch. Enable it for streaming DLT pipelines to cut idle compute costs by 30–50% without impacting throughput.',
        },
      ],
    },
    {
      title: 'CDC Streaming',
      subtopics: [
        {
          id: 'cdc-patterns',
          title: 'Change Data Capture (CDC) Streaming',
          difficulty: 'Advanced',
          explanation: 'CDC captures row-level changes (INSERT, UPDATE, DELETE) from a database\'s transaction log and streams them as events. Tools like Debezium, Azure Event Hubs Change Feed, and Fabric Mirroring implement CDC. The stream contains each change with: operation type (I/U/D), before/after row values, and a sequence number.',
          why: 'CDC is the foundation of real-time operational analytics. Instead of copying entire tables every night (full extract), CDC captures only what changed — reducing extract time from hours to seconds and enabling near-real-time data freshness in the warehouse.',
          syntax: `// Debezium CDC event schema:
{
  "op":   "c" | "u" | "d" | "r",  // create, update, delete, read(snapshot)
  "ts_ms": 1704000000000,           // event timestamp
  "before": { ...previous row...  },  // null for inserts
  "after":  { ...new row...       },  // null for deletes
  "source": {
    "db":    "salesdb",
    "table": "orders",
    "lsn":   "12345/678"  // log sequence number (ordering key)
  }
}`,
          example: `# Process CDC stream into Delta Lake using APPLY CHANGES pattern

from pyspark.sql.functions import from_json, col
from delta.tables import DeltaTable

# Parse CDC events from Kafka (Debezium format)
def process_cdc_batch(micro_batch_df, batch_id):
    # Flatten Debezium payload
    changes = micro_batch_df.select(
        col("after.order_id").alias("order_id"),
        col("after.customer_id").alias("customer_id"),
        col("after.amount").cast("double").alias("amount"),
        col("op").alias("operation"),
        col("ts_ms").alias("cdc_timestamp")
    )

    # Handle deletes
    deletes = changes.filter(col("operation") == "d") \
                     .select("order_id")

    # Handle inserts and updates
    upserts = changes.filter(col("operation").isin("c", "u")) \
                     .drop("operation", "cdc_timestamp")

    # Apply to Silver Delta
    target = DeltaTable.forName(spark, "silver.orders")
    target.alias("t").merge(
        upserts.alias("s"), "t.order_id = s.order_id"
    ).whenMatchedUpdateAll() \
     .whenNotMatchedInsertAll() \
     .execute()

    # Apply deletes
    if deletes.count() > 0:
        target.delete(col("order_id").isin([r.order_id for r in deletes.collect()]))

stream.writeStream \
    .foreachBatch(process_cdc_batch) \
    .option("checkpointLocation", "/checkpoints/orders_cdc/") \
    .trigger(processingTime="30 seconds") \
    .start()`,
          expectedOutput: 'Silver orders table reflects source database changes within 30 seconds: inserts appear, updates overwrite, deletes remove rows',
          practice: 'Design a CDC streaming flow for replicating a customers table from Azure SQL to Delta Lake. The source table has soft deletes (is_deleted flag) but also hard deletes. Your Silver table must reflect both. Walk through the Debezium event schema, the foreachBatch logic, and how you handle out-of-order events.',
          hint: 'Soft deletes are UPDATEs in CDC (op = "u" with is_deleted = true). Hard deletes are DELETEs (op = "d"). You need MERGE for upserts and a separate DELETE call for hard deletes. Use the LSN (log sequence number) to handle ordering.',
          solution: 'Debezium emits op = "c"/"u"/"d"/"r". In foreachBatch: (1) Extract op, lsn, before, after from the CDC payload. (2) Filter soft-deletes: op = "u" AND after.is_deleted = true → treat as a logical delete in Silver (set deleted_at timestamp). (3) Hard deletes: op = "d" → run DeltaTable.delete(customer_id IN [...]). (4) Inserts/updates: op = "c"/"u" → MERGE with condition "t.customer_id = s.customer_id AND t.updated_at < s.updated_at" — the updated_at guard prevents an older CDC event from overwriting a newer state. (5) Order events within the micro-batch by lsn before processing to handle Kafka partition interleaving. Test by deleting a row in Azure SQL and verifying it disappears from Silver within 60 seconds.',
          interview: {
            question: 'How do you handle out-of-order CDC events, and what causes them?',
            answer: 'Out-of-order CDC events happen when: network partitions, Kafka rebalancing, or CDC lag cause events from different partitions to arrive interleaved. An UPDATE event might arrive before the INSERT for the same row, or a DELETE might arrive before the UPDATE. To handle this: (1) Always include a sequence number (LSN or timestamp) with each CDC event. (2) In your MERGE logic, include a condition like "AND t.updated_at < s.updated_at" — only apply the update if the incoming event is newer. (3) For APPLY CHANGES in DLT, specify sequence_by to declare the ordering column — DLT handles out-of-order events automatically by buffering and reordering within the watermark window.',
          },
          commonMistakes: [
            'Not handling deletes in CDC processing — if you only MERGE inserts and updates, deleted rows in the source persist in your warehouse indefinitely. Always check for "d" operation in CDC events.',
            'Applying CDC events without sequence ordering — applying an older UPDATE after a newer UPDATE overwrites the correct state with stale data.',
            'Using CDC for tables without a stable primary key — CDC events are correlated by the primary key. Tables with composite or unstable keys produce confusing before/after states.',
          ],
          productionContext: 'Debezium + Kafka is the most common CDC stack for on-premises databases. For Azure SQL, use Fabric Mirroring (no infrastructure to manage) or Azure SQL Change Feed + Event Hubs. For Cosmos DB, use Change Feed + Event Hubs. The choice: managed CDC services (Mirroring, Change Feed) for simplicity, Debezium for maximum control and connector coverage.',
          performanceTip: 'CDC streams can surge during bulk database operations (large imports, migrations). To prevent your streaming pipeline from being overwhelmed: set maxOffsetsPerTrigger on the Kafka reader, and add a circuit-breaker in foreachBatch that slows the processing rate when the Delta MERGE takes > 60 seconds. Monitor with streaming query metrics.',
        },
      ],
    },
  ],
};
