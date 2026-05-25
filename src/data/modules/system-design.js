// System Design module — realistic DE architecture interview questions
// Each scenario: requirements → architecture → scaling → tradeoffs → interview expectations

export const systemDesignModule = {
  sections: [
    {
      title: 'Streaming & Real-Time Systems',
      subtopics: [
        {
          id: 'sd-streaming-analytics',
          title: 'Design a Real-Time Streaming Analytics Platform',
          difficulty: 'Advanced',
          explanation: 'Design an end-to-end streaming analytics system that ingests 10 million events per day from mobile apps, processes them in real time, and serves sub-second dashboards to 500 concurrent users.',
          why: 'Streaming system design is one of the most common senior DE interview questions. Interviewers test whether you understand the tradeoffs between latency, throughput, cost, and correctness — not just which tools exist.',
          syntax: `// Requirements to clarify in the interview:
// 1. Latency: how fresh must dashboard data be? (seconds vs minutes)
// 2. Throughput: peak events/sec? (10M/day = ~120/sec avg, maybe 1000/sec peak)
// 3. Correctness: at-least-once or exactly-once?
// 4. Query patterns: per-user aggregates? time-series? ad-hoc?
// 5. Retention: how long must raw events be stored?
// 6. Scale: growth expectations for next 12 months?`,
          example: `// Architecture: Lambda + Kappa hybrid on Azure

// INGESTION LAYER
// Mobile apps → Azure Event Hubs (16 partitions, 7-day retention)
// Event schema: { user_id, event_type, page, session_id, timestamp, properties{} }

// STREAM PROCESSING (Kappa path — real-time)
// Event Hubs → Spark Structured Streaming (Databricks)
//   - Parse JSON, validate required fields
//   - Aggregate: event counts per user per 5-min window
//   - Write to: KQL Database (for dashboard < 1s latency)

// BATCH/HISTORICAL (Lambda path — accurate)
// Event Hubs → AutoLoader → Bronze Delta (Lakehouse)
// Bronze → Silver: dedup by event_id, type cast
// Silver → Gold: daily user engagement metrics, funnel analysis
// Gold → Power BI Direct Lake semantic model

// SERVING LAYER
// Real-time dashboards → KQL Database (sub-second)
// Historical reports → Power BI Direct Lake (seconds)
// Data science queries → Silver/Gold Delta tables

// MONITORING
// Event Hub consumer lag → Alert if lag > 100K events
// KQL Database ingestion lag → Alert if > 2 minutes
// Pipeline success rate → Alert on any Bronze/Silver failure`,
          expectedOutput: `Architecture handles 10M events/day with:
- Real-time dashboards: < 5 second latency (Event Hubs → KQL)
- Historical reports: near-real-time via Direct Lake
- Exactly-once semantics via Delta MERGE + checkpoint
- Autoscaling compute (Databricks serverless or Fabric Spark)
- Full data lineage via Unity Catalog`,
          practice: 'Design a streaming analytics platform for a mobile gaming company that generates 10M events/day (level completions, purchases, crashes). Product managers need real-time active player dashboards refreshed every 5 seconds, and data scientists need accurate daily cohort reports. Walk through your full architecture including ingestion, processing, and serving layers.',
          hint: 'Real-time dashboards and accurate daily reports have different latency/accuracy tradeoffs. Consider a hybrid Lambda approach: streaming path for low latency, batch path for correctness. Choose the right serving store for each consumer.',
          solution: 'Ingestion: Mobile SDKs → Azure Event Hubs (16 partitions, 7-day retention, 1 TU per 1 MB/s peak). Real-time path: Event Hubs → Spark Structured Streaming → KQL Database — aggregate active players per 5-minute window. KQL serves < 1 second dashboard queries. Batch path: Event Hubs → AutoLoader → Bronze Delta (partitioned by event_date). Bronze → Silver: dedup by event_id, validate event_type enum. Silver → Gold: daily cohort metrics, retention rates, revenue by level. Serving: dashboards from KQL, cohort reports from Gold via Power BI Direct Lake. Monitoring: alert if KQL ingestion lag > 30 seconds or if Silver daily row count drops > 30% from 7-day average.',
          interview: {
            question: 'Walk me through your design for a streaming analytics platform. What are the main tradeoffs?',
            answer: 'Key tradeoff: Lambda vs Kappa architecture. Lambda runs both a real-time path (Kafka → stream processor → KQL) and a batch path (Kafka → Delta → aggregations → Power BI) in parallel — gives accuracy + low latency but doubles operational complexity. Kappa uses only streaming, reprocessing historical data by replaying the stream — simpler but expensive for large backlogs. For most analytics platforms, I use a hybrid: streaming for operational dashboards (Event Hubs → KQL), batch for accurate reporting (Delta Medallion). Second tradeoff: KQL vs Delta for serving. KQL: sub-second latency, time-series optimized, limited SQL. Delta: full SQL, supports Power BI Direct Lake, slower for point lookups. Serve dashboards from KQL, reports from Delta.',
          },
          commonMistakes: [
            'Over-engineering the real-time path — most "real-time" business requirements are satisfied by 30-second micro-batches, not true streaming. Clarify the actual latency requirement before designing.',
            'Not designing for backfill — what happens when the streaming job is down for 4 hours? The pipeline must replay the Kafka buffer and catch up. Design Event Hub retention and checkpointing accordingly.',
            'Ignoring the serving layer — great streaming architecture is wasted if Power BI has a 2-hour import refresh. Design the serving layer to match the freshness guarantee you\'re advertising.',
          ],
          productionContext: 'This architecture is used by major e-commerce and SaaS companies. The typical team: 2 data engineers own the ingestion and streaming layers, 1 owns the batch transformations, 1 owns the semantic models and BI. The biggest operational challenge is consumer lag management — set up Azure Monitor alerts for Event Hub consumer lag and Databricks streaming job health.',
          performanceTip: 'Event Hub throughput unit (TU) governs ingestion rate: 1 TU = 1 MB/s inbound, 2 MB/s outbound. At 1KB average event size and 1000 events/sec peak: 1 MB/s inbound = 1 TU. Always provision 2–3x expected peak TUs and enable auto-inflate to handle spikes without dropping events.',
        },
        {
          id: 'sd-fraud-detection',
          title: 'Design a Real-Time Fraud Detection System',
          difficulty: 'Advanced',
          explanation: 'Design a system that evaluates every financial transaction within 200ms of it occurring and assigns a fraud risk score, blocking high-risk transactions before they complete.',
          why: 'Fraud detection combines streaming architecture with ML serving — a common senior interview topic. It tests your understanding of latency constraints, feature serving, model deployment, and fallback strategies.',
          syntax: `// Key constraints (always clarify these):
// - Decision latency: < 200ms end-to-end
// - Throughput: 5,000 transactions/second peak
// - False positive cost: legitimate transactions blocked (bad UX, lost revenue)
// - False negative cost: fraud passes through (financial loss)
// - Availability: 99.99% (fraud check cannot go down)

// Feature types needed for fraud detection:
// Real-time: current transaction (amount, merchant, location, device)
// Near-real-time: user\'s last 5 minutes (velocity: 5 transactions in 5 min?)
// Historical: user\'s 90-day spending pattern (avg, std dev by merchant category)`,
          example: `// Architecture:

// INGESTION
// POS/Web → Azure Event Hubs → Fraud Check Service

// FEATURE SERVING (the critical path for < 200ms)
// Real-time features: extracted from the transaction payload itself
// Near-real-time: Azure Cache for Redis
//   - Key: user_id | Value: { tx_count_5min, tx_total_5min, last_merchant }
//   - TTL: 10 minutes, updated by a Spark streaming job every 30 seconds
// Historical features: Azure Cosmos DB (< 10ms read latency)
//   - Key: user_id | Value: { avg_monthly_spend, typical_merchants[], location_history[] }
//   - Updated by nightly batch job from Gold Delta tables

// MODEL SERVING
// ML model (gradient boosted tree): hosted on Azure ML real-time endpoint
// Input: 30 features (real-time + near-RT + historical)
// Output: fraud_score (0-1), top 3 risk factors
// SLA: p99 response < 50ms

// DECISION ENGINE
// fraud_score > 0.9 → block transaction
// fraud_score > 0.7 → challenge (2FA step-up)
// fraud_score < 0.7 → approve
// ML service down → fallback rules engine (rule-based scoring)

// FEEDBACK LOOP
// Fraud analyst decisions → Event Hub → Delta table
// Nightly model retraining job reads Delta tables
// New model → A/B test against champion model → promote if better`,
          expectedOutput: `End-to-end fraud decision in < 150ms:
- Transaction received: 5ms
- Redis/Cosmos feature lookup: 10ms
- ML model inference: 40ms
- Decision + response: 95ms total
- 99.9% of legitimate transactions approved
- > 85% of fraud blocked at < 0.1% false positive rate`,
          practice: 'A fintech startup processes 2,000 transactions/second. Their ML-based fraud detection must respond in < 200ms. The current system calls the ML model synchronously and queries a PostgreSQL feature store — p99 latency is 800ms. Redesign the feature serving and model architecture to hit the 200ms SLA.',
          hint: 'The bottleneck is almost certainly the feature store read latency. Think about what features are truly needed at decision time vs what can be pre-computed. Redis and Cosmos DB have very different latency profiles from PostgreSQL.',
          solution: 'Root cause: PostgreSQL query under load is 600–700ms. Fix: Replace with tiered feature serving. Real-time features (transaction amount, merchant, device fingerprint): extracted from the payload — 0ms. Velocity features (5-minute transaction count per user): pre-computed by Spark Structured Streaming, stored in Redis with TTL = 10 min — 3ms read latency. Historical features (90-day spending pattern): stored in Cosmos DB as a single document per user_id — 8ms read latency. Total feature fetch: 11ms. ML model (Azure ML real-time endpoint, gradient boosted tree): p99 40ms. Decision logic (threshold check): 2ms. Total: ~55ms well under 200ms. Add a circuit breaker: if Redis is down, fall back to rules-based scoring using only real-time features. Add Redis Cluster with 3 replicas to ensure HA.',
          interview: {
            question: 'How do you handle the feature freshness vs latency tradeoff in real-time fraud detection?',
            answer: 'This is the core tension. The most predictive features (velocity signals like "5 transactions in the last 5 minutes") need to be fresh but computing them at query time takes too long. The solution is a feature store with tiered latency: (1) Real-time features from the transaction payload itself — zero latency, always fresh. (2) Near-real-time features from Redis — pre-computed by a Spark Structured Streaming job every 30 seconds, served with < 5ms latency, 30-second staleness. (3) Historical features from Cosmos DB — updated nightly, served with < 10ms latency, 24-hour staleness. Tier 2 is the engineering challenge: the streaming job must be highly available (if it falls behind, fraud scores degrade). Design with: multiple Kafka consumer groups for redundancy, DLQ for failed updates, and monitoring on Redis key staleness.',
          },
          commonMistakes: [
            'Designing without a fallback — if the ML service is down at p999, you still need to make a fraud decision. Always design a rules-based fallback that operates on the transaction payload alone.',
            'Not designing the feedback loop — a fraud model without retraining degrades as fraud patterns evolve. The data pipeline for model retraining is as important as the real-time scoring path.',
            'Underestimating Redis consistency requirements — if two concurrent transactions for the same user both update the Redis velocity counter, you need atomic increment operations (Redis INCR), not read-modify-write.',
          ],
          productionContext: 'This architecture pattern is used by payment processors (Stripe, Adyen) and banks. The key operational metric: decision latency p99 (target < 200ms). Any degradation triggers PagerDuty. The ML model is retrained weekly; feature engineering runs nightly on Databricks Gold layer tables.',
          performanceTip: 'Redis latency is the most critical bottleneck. Use Redis Cluster with at least 3 replicas for read scaling. Keep feature payloads small (< 1KB per key). Profile with Redis SLOWLOG to catch any serialization overhead. A 1ms Redis latency difference at 5,000 TPS compounds to 5 seconds of total latency overhead per second of throughput.',
        },
      ],
    },
    {
      title: 'Data Lake Architecture',
      subtopics: [
        {
          id: 'sd-medallion-lakehouse',
          title: 'Design a Petabyte-Scale Medallion Lakehouse',
          difficulty: 'Advanced',
          explanation: 'Design a medallion lakehouse architecture that handles 5 TB of new data per day from 50 source systems, supports 200 engineers and analysts, and serves Power BI dashboards with < 10 second refresh.',
          why: 'Large-scale lakehouse design is the most common senior/staff DE system design question. Interviewers test storage organization, compute tiering, governance, and incremental processing at scale.',
          syntax: `// Scale parameters to clarify:
// - Data volume: 5 TB new data/day, ~1 PB total
// - Source systems: 50 (mix of SQL DBs, APIs, files, CDC streams)
// - Users: 50 engineers, 150 analysts (different access needs)
// - SLA: Gold layer fresh within 4 hours of source data
// - Retention: Bronze 7 years (compliance), Silver 3 years, Gold 1 year
// - Governance: GDPR/CCPA — right to deletion support needed`,
          example: `// Architecture: Azure + Databricks + Fabric Lakehouse

// STORAGE LAYER — OneLake / ADLS Gen2
// bronze/   — raw, append-only, partitioned by ingest_date
// silver/   — cleaned, deduplicated, partitioned by event_date
// gold/     — aggregated, optimized for BI, partitioned by report_date

// INGESTION LAYER (Bronze)
// Batch sources (SQL, CSV, APIs) → ADF Copy → ADLS Bronze
// CDC sources → Debezium → Event Hubs → AutoLoader → Bronze Delta
// Semi-structured (JSON logs) → Event Hubs → AutoLoader → Bronze Delta
// All Bronze writes: append-only, never modify

// TRANSFORMATION LAYER (Silver)
// Databricks Jobs — one job per domain (orders, customers, products)
// Each job: dedup by natural key + updated_at, type cast, validate, MERGE into Silver
// Schedule: every 15 minutes (incremental MERGE)
// Data quality: DLT expectations on all Silver tables

// AGGREGATION LAYER (Gold)
// Databricks Jobs — one per reporting domain
// Each job: JOIN Silver tables, compute KPIs, MERGE into Gold
// Schedule: every 1 hour
// Output: Gold tables with ZORDER by query pattern

// SERVING LAYER
// Power BI: Direct Lake on Gold Lakehouses → < 5s dashboard
// Analysts: Databricks SQL Warehouse or Fabric SQL Analytics Endpoint
// Data Science: read Silver Delta directly from notebooks

// GOVERNANCE (Unity Catalog)
// catalog structure: prod_bronze / prod_silver / prod_gold / dev_*
// RBAC: engineers get MODIFY on silver/gold, analysts get SELECT on gold
// Row-level security on gold tables (sales analysts see only their region)
// Column masking on PII fields (email, SSN shown only to data_admin group)

// GDPR compliance
// Deletion requests → Delta REWRITE to physically remove rows
// PII fields tracked in a data catalog (Purview)
// Retention: automated Azure Policy deletes Bronze > 7 years`,
          expectedOutput: `Architecture supports:
- 5 TB/day ingestion, 1 PB total storage
- 50 concurrent engineering workflows
- 150 analysts with role-based SQL access
- Power BI dashboards fresh within 2 hours (Gold SLA: 4h, typical: 1.5h)
- Full GDPR compliance with 30-day deletion SLA
- All PII masked at the serving layer`,
          practice: 'A retail company has 50 data sources (ERP, CRM, POS, web clickstream), 5 TB of new data per day, 200 users (engineers and analysts), and a GDPR requirement to delete all data for a given customer within 30 days of request. Design the full medallion lakehouse architecture including storage layout, ingestion strategy, GDPR deletion approach, and access control.',
          hint: 'Each layer (Bronze/Silver/Gold) has different retention requirements, partitioning strategies, and access levels. GDPR deletion must physically remove data, not just soft-delete. Partitioning by ingest_date enables efficient time-range scans.',
          solution: 'Storage: ADLS Gen2 / OneLake. Bronze: partitioned by ingest_date, append-only, 7-year compliance retention, access restricted to engineering. Silver: partitioned by event_date, MERGE-based, 3-year retention, PII column masking in Unity Catalog. Gold: partitioned by report_date, 1-year retention, row-level security (analysts see only their region). Ingestion: batch sources via ADF → Bronze. CDC sources via Fabric Mirroring / Debezium → Bronze. Structured logs via AutoLoader → Bronze. GDPR deletion: receive deletion request → identify customer_id across all tables → run Delta DELETE on Silver and Gold → run REWRITE (OPTIMIZE) to physically remove from Parquet files → run VACUUM after retention window → log deletion timestamp for audit → verify via SELECT on deleted customer_id. Access: Unity Catalog RBAC — engineers get MODIFY on Silver/Gold dev, SELECT only on prod. Analysts get SELECT on Gold only. Column masks on email, SSN, phone.',
          interview: {
            question: 'How do you handle GDPR right-to-erasure in a Delta Lake-based lakehouse?',
            answer: 'GDPR right-to-erasure in Delta Lake is a multi-step process: (1) Receive deletion request for customer_id X. (2) Run DELETE FROM silver.customers WHERE customer_id = X on all Silver and Gold tables — Delta records this as a delete operation in the transaction log. (3) Run REWRITE (OPTIMIZE on the table) to physically remove the deleted rows from Parquet files — without REWRITE, rows are logically deleted but still physically present. (4) Run VACUUM to remove old Parquet files containing the deleted data. (5) Repeat for Bronze — Bronze is append-only so you need a separate REWRITE pass. (6) Log the deletion with timestamp for compliance audit. The challenge: time travel versions before the deletion still contain the data — set Delta retention to 30 days maximum for PII tables and VACUUM accordingly.',
          },
          commonMistakes: [
            'Not partitioning Bronze by ingest_date — without time-based partitioning, every incremental query scans the entire Bronze table. At 1 PB, this is catastrophically slow.',
            'Sharing one Databricks cluster for all workloads — Bronze ingestion, Silver transformation, and analyst queries have different resource profiles. Separate clusters prevent one workload from starving another.',
            'Not planning for backfill — what happens when the Silver job fails for 12 hours? You need a backfill mode that reprocesses 12 hours of Bronze data efficiently. Design this before you need it.',
          ],
          productionContext: 'This architecture runs at major financial services and retail companies. At 5 TB/day, Databricks job compute is the largest cost item — optimize by right-sizing job clusters, using spot instances for non-critical jobs, and OPTIMIZE reducing file count (fewer files = faster future queries). Monitor Gold SLA daily and alert when Gold table freshness > 6 hours.',
          performanceTip: 'Z-ORDER by (customer_id, order_date) on Gold fact tables if those are the dominant filter columns. For a 10 TB Gold table with 50 billion rows, ZORDER reduces average query data scanned from 10 TB to < 100 MB for filtered queries — a 100x improvement in query cost and speed.',
        },
        {
          id: 'sd-multi-tenant',
          title: 'Design a Multi-Tenant Analytics Platform',
          difficulty: 'Advanced',
          explanation: 'Design a shared analytics platform that serves 50 client companies (tenants), each with complete data isolation, independent SLAs, and the ability to query only their own data.',
          why: 'Multi-tenant data platform design comes up at SaaS companies and platform engineering interviews. It tests your understanding of isolation models, shared infrastructure, and cost allocation.',
          syntax: `// Isolation model options:
// 1. Silo model: separate infrastructure per tenant (highest isolation, highest cost)
// 2. Pool model: shared infrastructure, logical isolation (lowest cost, highest complexity)
// 3. Bridge model: shared storage/compute, tenant-specific schemas (common choice)

// Key requirements to clarify:
// - How many tenants? (50 tenants, growing to 500?)
// - What is the data isolation requirement? (logical? physical?)
// - SLA variability: can tenant A's heavy job impact tenant B? (noisy neighbor problem)
// - Cost model: how is compute charged back per tenant?`,
          example: `// Architecture: Bridge model (shared OneLake, tenant-specific schemas)

// STORAGE (OneLake)
// /bronze/tenant_id=ACME/...
// /bronze/tenant_id=GLOBEX/...
// /silver/tenant_id=ACME/...
// Each tenant's data is physically isolated in separate partitions

// GOVERNANCE (Unity Catalog)
// prod_catalog
//   ├── ACME_bronze (schema) — Row filter: tenant_id = 'ACME'
//   ├── ACME_silver (schema) — Row filter applied via dynamic data masking
//   ├── GLOBEX_bronze (schema)
//   └── GLOBEX_silver (schema)
// Service principal per tenant for API access
// Row-level security: CURRENT_USER() function maps to tenant_id

// COMPUTE (Databricks SQL Warehouses)
// Shared SQL warehouse for small tenants (< 1GB queries)
// Dedicated warehouses for Enterprise tier tenants (SLA guarantee)
// Usage metering: track DBU consumption per tenant_id tag

// INGESTION
// Tenant sends data via: SFTP upload, API POST, ADF pipeline
// All ingestion routes to bronze/tenant_id=X/ partition
// Schema validation per tenant (tenant-specific schema registry)

// SERVING
// Tenant portal queries Fabric Warehouse via service principal token
// Power BI embedded reports: tenant-filtered semantic model
// API: FastAPI service reads Gold Warehouse with tenant_id WHERE clause`,
          expectedOutput: `Platform serves 50 tenants with:
- Complete data isolation (tenant A cannot query tenant B's data)
- Shared compute (80% cost reduction vs silo model)
- Per-tenant SLA monitoring and alerting
- Cost attribution by tenant for billing`,
          practice: 'A B2B SaaS company provides an analytics platform to 80 clients. One large enterprise client runs heavy batch queries at 9am that slow down the dashboards for all other tenants. Design an isolation and resource management strategy that prevents this while keeping infrastructure costs reasonable.',
          hint: 'The noisy neighbor problem has multiple solutions with different cost/complexity tradeoffs. Think about query prioritisation, resource pools, and which tenants genuinely need dedicated compute vs can share.',
          solution: 'Classify tenants into tiers: Enterprise (10 tenants, high revenue) and Standard (70 tenants). For Enterprise: dedicated Databricks SQL Warehouse per tenant — physical isolation guarantees no noisy neighbor. For Standard: shared SQL Warehouse with workload classification. Apply query tags with tenant_id. Set query timeout of 300 seconds and max concurrent queries of 5 per tenant on shared warehouse. Use Databricks admission control to limit Standard tier to "medium" priority — Enterprise queries at "high" preempt Standard during resource contention. Add 9am scheduled auto-scale on shared warehouse to handle the morning spike. Implement usage metering: tag all Databricks jobs/queries with tenant_id, export DBU logs to Delta, aggregate cost by tenant daily. Expose cost dashboard to account managers. Offer Enterprise upgrade to tenants who consistently hit Standard tier limits.',
          interview: {
            question: 'How do you prevent a noisy neighbor problem in a multi-tenant shared compute environment?',
            answer: 'Noisy neighbor = one tenant\'s heavy query consuming all compute and slowing every other tenant. Solutions in order of complexity: (1) Query timeout and queue limits at the SQL warehouse or Databricks cluster level — prevent single queries from monopolizing resources. (2) Workload classification: label each query with its tenant_id and assign priority classes. Heavy analytics get "medium" priority; interactive dashboard queries get "high" priority. (3) Resource pools in Databricks: tenant tier maps to a pool (Enterprise tier → dedicated pool, Standard tier → shared pool). (4) Tenant-specific warehouses for Enterprise SLA customers — physical isolation for those who pay for it. The key insight: don\'t treat all tenants equally. 80% of tenants need "good enough" with shared resources; 20% pay for dedicated resources.',
          },
          commonMistakes: [
            'Using a single service principal for all tenant data access — if that credential is compromised, all tenants are exposed. Use per-tenant service principals.',
            'Logical isolation via WHERE clause only — a SQL injection vulnerability could expose all tenants. Row-level security at the database/Unity Catalog layer is mandatory defense-in-depth.',
            'Not metering per-tenant compute — without cost attribution, you can\'t identify which tenant is causing compute cost spikes or implement usage-based billing.',
          ],
          productionContext: 'Multi-tenant analytics platforms are common at SaaS companies (HR platforms, CRM vendors, ERP providers). The typical architecture evolution: start silo (separate storage per tenant) for simplicity, move to bridge model at 20+ tenants for cost, consider pool model at 100+ tenants with good isolation tooling.',
          performanceTip: 'Partition all storage by tenant_id first, then by date. This ensures every query with a tenant_id filter uses partition pruning and reads only that tenant\'s data — preventing cross-tenant data scans that would both slow queries and risk data leakage.',
        },
      ],
    },
    {
      title: 'Observability and Reliability',
      subtopics: [
        {
          id: 'sd-observability',
          title: 'Design a Data Observability Platform',
          difficulty: 'Advanced',
          explanation: 'Design a system that monitors data quality across a lakehouse with 500 tables, detects anomalies automatically, alerts on SLA breaches, and provides root cause visibility when data issues occur.',
          why: '"Data downtime" costs more than system downtime at data-mature companies. Designing observability is a top-of-mind concern for senior DEs and is tested in architecture rounds.',
          syntax: `// Four pillars of data observability:
// 1. Freshness: is data arriving on schedule?
//    → Check MAX(updated_at) per table vs expected schedule
// 2. Volume: does the row count look normal?
//    → Compare today's count to 7-day rolling average ± 3 std deviations
// 3. Distribution: do column statistics look normal?
//    → Track NULL%, unique count, min/max, mean for key columns
// 4. Schema: did column names or types change?
//    → Compare current schema to last-known-good schema in registry`,
          example: `// Data observability pipeline architecture:

// METRICS COLLECTION
// After each pipeline run: collect_table_metrics()
def collect_table_metrics(table_name: str, spark) -> dict:
    df = spark.table(table_name)
    return {
        "table_name": table_name,
        "row_count": df.count(),
        "max_updated_at": df.agg({"updated_at": "max"}).collect()[0][0],
        "null_pcts": {c: df.filter(F.col(c).isNull()).count() / df.count()
                     for c in df.columns},
        "collected_at": datetime.now().isoformat()
    }

// ANOMALY DETECTION
// Store metrics in Delta table: observability.table_metrics
// Nightly: compare today vs 7-day rolling avg + stdev
// Alert if: row_count < mean - 3*stdev (volume drop)
//           null_pct > historical_p99 + 5% (quality degradation)
//           max_updated_at > schedule_sla (freshness breach)

// LINEAGE (Unity Catalog or Purview)
// When alert fires: trace upstream to find root cause
// orders table stale? → check upstream silver.orders → check bronze.raw_orders
// → find that the Bronze AutoLoader hasn't processed files in 2 hours

// ALERTING
// Severity 1 (Gold table breach > 2h late) → PagerDuty (on-call)
// Severity 2 (Silver quality degradation > 5%) → Teams channel
// Severity 3 (Volume anomaly < 2 stdev) → Daily digest email`,
          expectedOutput: `Observability platform covers 500 tables:
- Freshness SLA monitoring on all Gold tables
- Volume anomaly detection on Silver/Gold
- Schema change detection on Bronze
- Root cause trace via lineage graph
- < 5 minute alert delivery on Severity 1 issues`,
          practice: 'Design a data observability system for a lakehouse with 200 production tables. The team has been burned by: (1) Gold tables silently going stale for 4 hours before anyone noticed, (2) a column being renamed in a source system breaking downstream aggregations, (3) a pipeline producing the right row count but with 30% null values in a critical column. Design monitoring that catches all three failure modes.',
          hint: 'Each failure mode maps to one observability pillar: freshness, schema, and distribution/quality. Think about where in the pipeline each check should run and how to route alerts to the right responder.',
          solution: 'Failure 1 (staleness): After every Gold pipeline run, collect MAX(updated_at) per table. Compare to expected schedule. If freshness > SLA + 30 minutes → Severity 1 PagerDuty alert. Store metrics in observability.freshness_checks Delta table. Failure 2 (schema change): On Bronze AutoLoader load, compare incoming schema to registered schema in a schema_registry Delta table. If any column renamed or dropped → Severity 1 alert and halt Silver pipeline for that table. Allow new columns (additive changes) with a Severity 3 notification. Failure 3 (null spike): After Silver write, compute NULL% per column using a post-pipeline check notebook. Compare to 7-day rolling average per column. If NULL% increases > 5 percentage points for a flagged column → Severity 2 Teams channel alert. Architecture: each pipeline job triggers a check notebook via Databricks Workflow dependency. All check results written to observability.quality_metrics. Dashboards in Fabric Power BI show table health at a glance.',
          interview: {
            question: 'How do you distinguish between a data quality problem and a legitimate business change (like a holiday causing lower order volume)?',
            answer: 'This is one of the hardest data observability problems. Approaches: (1) Year-over-year comparison for known seasonal patterns — compare this Monday to last Monday and to the same day last year, not just the rolling 7-day average. (2) Business context metadata — maintain a calendar of expected low-volume events (holidays, maintenance windows) and suppress volume alerts during these periods. (3) Relative vs absolute thresholds — alert on percentage change from expected (-30%) rather than absolute values, so alerts auto-adjust as the business grows. (4) Multi-signal correlation — a volume drop AND a freshness delay AND a schema change all at once is likely a pipeline problem. A volume drop alone on a holiday is likely normal. Integrate business context into your alerting logic.',
          },
          commonMistakes: [
            'Only monitoring pipeline success/failure — a pipeline can succeed (no errors) but produce wrong data (wrong logic, silent deduplication failure). Volume and quality checks are orthogonal to job success.',
            'Too many alerts → alert fatigue → oncall ignores alerts. Start with 5–10 critical alerts, tune thresholds to < 1 false positive per day before adding more.',
            'Not capturing lineage — when an alert fires, you need to know which upstream table or pipeline caused it. Lineage (Unity Catalog, Purview, or OpenLineage) is not optional for a mature observability system.',
          ],
          productionContext: 'Open-source options: Monte Carlo, Great Expectations, dbt tests + Elementary. Azure-native: Purview Data Quality features + Azure Monitor + Log Analytics. At scale (500+ tables), build your own lightweight metrics collection into every pipeline job and centralize in a Delta observability table.',
          performanceTip: 'Run observability checks after each pipeline stage, not just at the end. Catching a problem at Bronze prevents it from propagating through Silver to Gold. The cost of a check at each stage is much lower than debugging why Gold data is wrong three hops downstream.',
        },
        {
          id: 'sd-incident-recovery',
          title: 'Recovering from a Production Pipeline Failure',
          difficulty: 'Advanced',
          explanation: 'A nightly Gold layer pipeline fails at 3am. Business stakeholders notice stale Power BI dashboards at 9am. Walk through the diagnosis and recovery steps for a senior DE.',
          why: 'Production incident response is tested in senior interviews to assess real operational experience. Interviewers want to see a systematic debugging approach, not panic.',
          syntax: `// Incident response framework:
// 1. TRIAGE: what failed, what is the business impact?
// 2. CONTAIN: is bad data propagating? Stop it.
// 3. DIAGNOSE: find root cause
// 4. RECOVER: fix and rerun safely
// 5. POSTMORTEM: prevent recurrence`,
          example: `// Example incident playbook:

// 9:00am — Alert fires: Gold table gold.daily_revenue freshness > 6 hours
// Step 1: TRIAGE
//   - Check pipeline run history in Databricks Workflows / ADF Monitor
//   - Find: Gold notebook failed at 3:17am with OOM error (OutOfMemoryError)
//   - Impact: Power BI reports showing yesterday's data. SLA breach confirmed.
//   - Escalate to data engineering lead immediately.

// Step 2: CONTAIN
//   - Is bad (partial) data in Gold? Check: did any rows write before OOM?
//   - Use Delta time travel: SELECT COUNT(*) FROM gold.daily_revenue VERSION AS OF 5
//   - If partial rows exist: RESTORE TABLE gold.daily_revenue TO VERSION AS OF 5
//   - Communicate to stakeholders: "Dashboards are stale, no bad data. Fix ETA: 11am."

// Step 3: DIAGNOSE
//   - Read the error: OutOfMemoryError in Gold aggregation notebook
//   - Check data volume: was today's Silver much larger than usual?
//   - spark.sql("SELECT order_date, COUNT(*) FROM silver.orders GROUP BY 1 ORDER BY 1 DESC").show(5)
//   - Find: 10x more rows than yesterday (backfill from a source system)
//   - Root cause: Silver received 5 days of backdated orders from a source migration

// Step 4: RECOVER
//   - Increase cluster memory for this run: 64 GB → 128 GB nodes
//   - Re-run Gold notebook with larger cluster
//   - Verify: row counts match Silver aggregation
//   - Monitor Gold table freshness → confirmed fresh at 10:45am

// Step 5: POSTMORTEM
//   - Add alert: if Silver daily volume > 3x 7-day average, page oncall BEFORE Gold runs
//   - Add volume check between Silver → Gold to auto-scale cluster
//   - Schedule monthly capacity review for busiest tables`,
          expectedOutput: `Incident resolved in < 2 hours:
- No bad data reached dashboards (Gold restored to last good version)
- Root cause identified: 5x volume spike from source migration
- Prevention: volume anomaly alert before Gold stage
- Postmortem completed with 3 action items`,
          practice: 'At 7am you receive a PagerDuty alert: gold.daily_revenue is showing data from 2 days ago. Power BI dashboards are stale. Write your step-by-step incident response, including what commands you run, how you communicate to stakeholders, and what prevention you add to the postmortem.',
          hint: 'Follow the TRIAGE → CONTAIN → DIAGNOSE → RECOVER → POSTMORTEM framework. Check pipeline run history first, then data state, then root cause. Communicate before you have all the answers — a 5-minute acknowledgment is better than silence.',
          solution: '7:05am TRIAGE: Check Databricks Workflow run history. Find: Gold notebook failed at 3:22am, error = "AnalysisException: Table silver.orders does not exist". Impact: Gold has 2-day-old data. Send Slack message: "Gold.daily_revenue alert acknowledged — investigating, ETA 30 min." 7:10am CONTAIN: Check Delta history on gold.daily_revenue. Confirm last successful write was 2 days ago. No partial data — safe. No rollback needed. 7:15am DIAGNOSE: Check Silver pipeline. Find: Silver notebook failed at 2:58am with "path not found" — ADLS mount point disconnected due to expired service principal credentials. 7:25am RECOVER: Rotate service principal credentials. Re-mount ADLS. Re-run Silver pipeline (succeeds in 8 min). Re-run Gold pipeline (succeeds in 12 min). Verify gold.daily_revenue freshness. 7:50am RESOLVE: Confirm dashboards updated. Send resolution message: "Gold data is fresh as of 7:48am. Root cause: expired SP credential. Fix deployed." POSTMORTEM: Add SP credential expiry alert to Azure Key Vault (30-day warning). Add automated SP rotation. Add monitoring for ADLS mount health as a pre-check before every pipeline run.',
          interview: {
            question: 'A senior engineer says "just re-run the pipeline." What risks exist and what do you check before re-running?',
            answer: 'Re-running without investigation is how incidents get worse. Before re-running: (1) Check if partial data was written — if a Gold MERGE wrote 50% of rows before OOM, re-running may create duplicates or miss rows. Use Delta time travel to verify the table state. If partial data exists, RESTORE to the last clean version before re-running. (2) Check whether the root cause is still present — if OOM was caused by a volume spike that\'s still in Silver, re-running with the same cluster size will OOM again. Fix the cluster size first. (3) Check for downstream dependencies — does the Gold table feed any other pipelines, Semantic Models, or exports? If so, communicate the expected fresh time before they trigger on stale data.',
          },
          commonMistakes: [
            'Not using Delta time travel before recovery — overwriting or re-running without checking current state can make a partial-write problem into a data loss problem.',
            'Re-running in production without testing the fix — test on a sample of the failing data in a dev environment first.',
            'Not communicating during the incident — stakeholders discovering the problem on their own before engineering notifies them destroys trust. Send a brief update every 30 minutes during an active incident.',
          ],
          productionContext: 'Senior DEs are expected to own incidents end-to-end: diagnose, communicate, fix, postmortem. The biggest differentiator between senior and mid-level engineers is the systematic approach to containment before recovery — always check what state you\'re in before taking action.',
          performanceTip: 'Delta\'s time travel is your safety net. Every production pipeline should have a rollback step in its runbook: identify the last known good version, document the RESTORE command, test it in staging. Knowing you can roll back in 2 minutes removes the panic from production incidents.',
        },
      ],
    },
    {
      title: 'CDC and Migration',
      subtopics: [
        {
          id: 'sd-cdc-platform',
          title: 'Design a CDC Data Replication Platform',
          difficulty: 'Advanced',
          explanation: 'Design a system that continuously replicates 100 tables from a production Azure SQL database to an analytics lakehouse with < 30 second lag, without impacting the production database.',
          why: 'CDC architecture is one of the most important real-world data engineering patterns. It shows up in interviews when a company wants to replace nightly batch ETL with real-time replication.',
          syntax: `// CDC source options for Azure SQL:
// 1. Fabric Mirroring (managed, zero code, < 30s lag) — recommended
// 2. Debezium + Event Hubs (open source, more control)
// 3. Azure Data Factory (CDC connector, batch-based, not truly streaming)
// 4. SQL Change Tracking (lightweight, doesn\'t capture full before/after)

// Key questions:
// - Schema changes in source: how do you handle ADD COLUMN?
// - Delete handling: soft delete or hard delete?
// - Historical snapshot: do you need a full initial load?
// - PII in source: mask before landing in analytics?`,
          example: `// Architecture: Azure SQL → Fabric Mirroring → Lakehouse → Gold

// OPTION 1: Fabric Mirroring (simplest)
// Setup: Enable CDC on Azure SQL, configure Fabric Mirroring
// Result: 100 tables appear as Delta tables in OneLake within minutes
// Lag: < 30 seconds (CDC reads transaction log)
// Schema evolution: new columns auto-detected and added
// Limitation: read-only Bronze, need Spark for Silver/Gold transforms

// OPTION 2: Debezium + Event Hubs (max control)
// Deploy Debezium connector on Azure Container Apps
// Debezium reads SQL Server transaction log → pushes to Event Hubs
// Spark Structured Streaming reads Event Hubs → foreachBatch → Delta MERGE
// Schema: Debezium schema registry tracks evolution

// SCHEMA CHANGE HANDLING (Debezium)
// Source: ALTER TABLE orders ADD COLUMN discount DECIMAL
// Debezium: detects schema change, emits schema change event
// Consumer: catch SchemaChangedException, update Silver schema,
//           run ALTER TABLE silver.orders ADD COLUMN discount DECIMAL

// PII MASKING AT INGESTION
// Bronze: raw data (full access restricted to security team)
// Silver: PII columns masked via column masking policy in Unity Catalog
// Gold: masked columns excluded from aggregation tables`,
          expectedOutput: `CDC platform replicates 100 tables with:
- < 30 second replication lag (steady state)
- Schema evolution handled automatically
- Zero production DB impact (reads transaction log only)
- Full audit trail of all changes preserved in Bronze`,
          practice: 'A company wants to replace their nightly ADF batch copy of 80 Azure SQL tables (8-hour data lag) with a CDC-based replication pipeline targeting < 1 minute lag. Design the end-to-end CDC architecture. Include: tooling choice, initial snapshot strategy, schema evolution handling, PII masking, and how you migrate from batch to CDC without a data gap.',
          hint: 'The migration from batch to CDC has a tricky transition: you need to establish a consistent snapshot baseline before enabling CDC, otherwise you may have a gap or duplicates. Think about the switchover sequence carefully.',
          solution: 'Tooling: Use Fabric Mirroring for Azure SQL (managed, zero-infrastructure, < 30s lag). If more control needed: Debezium on Azure Container Apps + Event Hubs. Initial snapshot: enable CDC on Azure SQL (requires SQL sysadmin). Fabric Mirroring performs an automatic initial snapshot — it copies all current rows, then switches to CDC streaming. The snapshot is consistent: it reads at a single LSN point, then CDC picks up from that LSN. No gap. Migration switchover: Run batch ADF and Fabric Mirroring in parallel for 3 days. Compare row counts and spot-check values. Confirm lag is consistently < 1 minute. On cutover day: stop ADF pipeline, redirect all downstream consumers to the mirrored Delta tables. PII masking: Bronze tables in mirrored Lakehouse get column masking policies in Unity Catalog — email, SSN, phone masked for all users except data_admin group. Silver tables have masked columns excluded from aggregations. Schema evolution: Fabric Mirroring auto-detects new columns and adds them to the Delta schema. For column renames (breaking change), alert the engineering team via Azure Monitor schema change event and update Silver transformation logic before the rename goes live.',
          interview: {
            question: 'How do you handle a schema change (new column added) in the source database in a CDC pipeline?',
            answer: 'Schema evolution in CDC is a multi-step problem. The approach depends on your architecture: (1) Fabric Mirroring handles this automatically — it detects the new column in the CDC stream and adds it to the OneLake Delta table schema. (2) With Debezium: the connector emits a schema change event. Your Spark consumer catches this, applies ALTER TABLE on the Silver Delta table, then continues processing. Delta Lake\'s mergeSchema option handles this: spark.conf.set("spark.databricks.delta.schema.autoMerge.enabled", "true"). (3) Proactive strategy: schema changes in production databases should go through a change management process where the data engineering team is notified before deployment. A schema registry (e.g., Azure Schema Registry, Confluent Schema Registry) maintains the canonical schema and validates incoming CDC events.',
          },
          commonMistakes: [
            'Not handling the initial snapshot — CDC captures changes from a point in time. You need a full snapshot load before starting CDC to have complete data. Plan 4–8 hours for initial snapshot of large tables.',
            'Ignoring transaction boundaries — a single business operation (e.g., place order) writes to 3 tables atomically. CDC may deliver these in separate batches. Decide if you need cross-table consistency or if eventual consistency is acceptable.',
            'Not testing delete handling — deletes are the most commonly missed case. Test your pipeline by deleting a test row in source and verifying it propagates to Silver correctly.',
          ],
          productionContext: 'At companies migrating from nightly batch ETL to CDC, the typical project timeline: Month 1 — set up Fabric Mirroring for the 10 highest-priority tables. Month 2 — Silver/Gold transformations on mirrored data. Month 3 — decommission the ADF batch pipeline for those 10 tables. Measure lag reduction (from 8 hours to < 1 minute) and present the business case for expanding to all 100 tables.',
          performanceTip: 'CDC replication lag is dominated by two factors: (1) Transaction log read frequency — Debezium polls the transaction log every 500ms by default. Reduce to 100ms for < 1 second lag at increased I/O cost. (2) Consumer processing time — if your Spark foreachBatch MERGE takes 45 seconds and you receive batches every 30 seconds, you\'re falling behind. Profile and optimize the MERGE (add partition filter, check for skew) to keep consumer processing < trigger interval.',
        },
      ],
    },
  ],
};
