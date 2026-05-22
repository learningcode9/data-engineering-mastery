export const COMPANIES = [
  {
    id: 'shopsphere',
    name: 'ShopSphere',
    tagline: "Europe's fastest-growing e-commerce platform, processing 80 million orders per month across 22 countries.",
    industry: 'E-Commerce',
    icon: '🛒',
    color: '#2f756e',
    difficulty: 'Beginner',
    teamSize: '14 Data Engineers',
    stack: ['Azure Data Factory', 'Databricks', 'Delta Lake', 'dbt', 'Apache Airflow', 'Power BI'],
    description:
      'ShopSphere operates a lakehouse architecture on Azure, ingesting clickstream, order, and inventory events from microservices into a Delta Lake medallion structure. The platform supports real-time dashboards for the merchandising and finance teams, but rapid growth has introduced pipeline latency issues that are starting to affect business decisions. Duplicate order records appearing in the Gold layer have eroded analyst trust in the revenue metrics, and reducing the dashboard refresh lag from hours to minutes is the team\'s top quarterly priority.',
    yourRole:
      'You have just joined the Data Platform team as a Junior Data Engineer, reporting to the Lead Platform Engineer. Your first week focuses on understanding the existing pipelines and fixing a latency issue that is currently holding up the daily revenue dashboard used by the CFO.',
    todaysBriefing:
      "It's 08:30 on a Tuesday and the revenue pipeline that feeds the CFO's morning dashboard hasn't completed since 06:15 — it's now 2 hours stale. The merchandising analyst has already pinged the channel asking why yesterday's orders look low. Your lead has flagged it as P2 and asked you to investigate the Airflow DAG and the downstream dbt model.",

    orgChart: [
      { name: 'Priya Nair', role: 'Lead Platform Engineer', avatar: '👩‍💻', relation: 'manager' },
      { name: 'Tomasz Wierzbicki', role: 'Senior Data Engineer', avatar: '👨‍💻', relation: 'peer' },
      { name: 'Lena Hoffmann', role: 'Analytics Engineer (dbt)', avatar: '👩‍🔬', relation: 'peer' },
      { name: 'Carlos Ruiz', role: 'Finance BI Analyst', avatar: '📊', relation: 'stakeholder' },
      { name: 'Arjun Sharma', role: 'Data Architect', avatar: '🏗️', relation: 'architect' }
    ],

    dataSources: [
      { name: 'Orders Service', type: 'PostgreSQL (CDC)', volume: '~2.8M rows/day', ingestionMethod: 'Azure Data Factory CDC' },
      { name: 'Clickstream Events', type: 'Kafka Topics', volume: '~180M events/day', ingestionMethod: 'Kafka → Databricks Auto Loader' },
      { name: 'Inventory System', type: 'REST API', volume: '~400K SKU updates/day', ingestionMethod: 'ADF HTTP connector (hourly)' },
      { name: 'Payments Gateway', type: 'Webhook / JSON', volume: '~3.1M transactions/day', ingestionMethod: 'Event Hub → Delta Live Tables' },
      { name: 'Product Catalog', type: 'MySQL (replicated)', volume: '~2.2M products', ingestionMethod: 'ADF Full Refresh (daily 01:00)' }
    ],

    kpis: [
      { name: 'Revenue Dashboard Freshness', target: '< 30 min lag', current: '2h 15m lag', status: 'breached' },
      { name: 'Order Deduplication Rate', target: '99.99%', current: '99.71%', status: 'at-risk' },
      { name: 'Pipeline SLA Adherence', target: '> 98%', current: '96.2%', status: 'at-risk' },
      { name: 'Data Quality Score (Gold Layer)', target: '> 99.5%', current: '99.6%', status: 'healthy' }
    ],

    slas: [
      { pipeline: 'Revenue Gold Model (dbt)', sla: 'Complete by 07:00', current: 'Still running (08:45)', status: 'breached' },
      { pipeline: 'Orders Bronze Ingestion', sla: 'Max 15 min lag', current: '22 min lag', status: 'at-risk' },
      { pipeline: 'Inventory Hourly Sync', sla: 'Complete within 20 min', current: '18 min avg', status: 'healthy' },
      { pipeline: 'Clickstream Daily Aggregate', sla: 'Complete by 03:00', current: 'Completed 02:47', status: 'healthy' }
    ],

    slackMessages: [
      {
        id: 'ss-msg-1',
        author: 'Airflow Alertmanager',
        authorRole: 'Automated Monitor',
        avatar: '🤖',
        channel: '#data-alerts',
        time: '06:18',
        text: '🔴 DAG `revenue_gold_refresh` task `dbt_run_revenue_metrics` has been in state RUNNING for 45 minutes (threshold: 30 min). Executor: Databricks cluster `dbt-prod-medium`. Runbook: https://wiki/runbooks/revenue-dag',
        isAlert: true,
        isUrgent: true
      },
      {
        id: 'ss-msg-2',
        author: 'Priya Nair',
        authorRole: 'Lead Platform Engineer',
        avatar: '👩‍💻',
        channel: '#data-platform',
        time: '07:05',
        text: "Morning team — heads up, `revenue_gold_refresh` is stuck on the dbt step. I've paged the on-call but @new-de please take a look at the Databricks cluster logs when you're online. This feeds Carlos's CFO dashboard so it's P2.",
        isAlert: false,
        isUrgent: true
      },
      {
        id: 'ss-msg-3',
        author: 'Carlos Ruiz',
        authorRole: 'Finance BI Analyst',
        avatar: '📊',
        channel: '#data-platform',
        time: '08:12',
        text: "Hi team — the revenue dashboard is showing yesterday's numbers still. I have a stand-up with the CFO at 09:00 and she'll ask about the overnight order volume. Is there an ETA on the fix?",
        isAlert: false,
        isUrgent: true
      },
      {
        id: 'ss-msg-4',
        author: 'Tomasz Wierzbicki',
        authorRole: 'Senior Data Engineer',
        avatar: '👨‍💻',
        channel: '#data-platform',
        time: '08:20',
        text: "I had a quick look — the Databricks cluster is alive but the dbt model `fct_orders_daily` is doing a full table scan on `silver_orders` which grew by 40% last week after the Black Friday data load. We probably need to add a date partition filter to that model's incremental logic.",
        isAlert: false,
        isUrgent: false
      },
      {
        id: 'ss-msg-5',
        author: 'Lena Hoffmann',
        authorRole: 'Analytics Engineer',
        avatar: '👩‍🔬',
        channel: '#data-platform',
        time: '08:31',
        text: "Also worth checking: `fct_orders_daily` uses `is_incremental()` but the `unique_key` is set to `order_id` and we've been seeing ~0.3% duplicate `order_id` values coming out of the CDC source. dbt might be doing a merge-then-dedupe which tanks performance at scale.",
        isAlert: false,
        isUrgent: false
      },
      {
        id: 'ss-msg-6',
        author: 'Airflow Alertmanager',
        authorRole: 'Automated Monitor',
        avatar: '🤖',
        channel: '#data-alerts',
        time: '08:35',
        text: '🟡 DAG `orders_bronze_cdc` SLA WARNING — task `adf_trigger_orders_cdc` completed but downstream Delta write is showing 22-minute end-to-end lag (SLA: 15 min). Possible upstream CDC cursor stall. Check ADF pipeline run ID: run_20260521_0615.',
        isAlert: true,
        isUrgent: false
      },
      {
        id: 'ss-msg-7',
        author: 'Arjun Sharma',
        authorRole: 'Data Architect',
        avatar: '🏗️',
        channel: '#data-platform',
        time: '08:44',
        text: "For context on the duplicates issue: the Orders CDC source does at-least-once delivery. We discussed adding a dedup step in the Silver layer transformation back in Q3 but it got deprioritized. This might be a good time to pick up DPLAT-247 and finally close it properly.",
        isAlert: false,
        isUrgent: false
      },
      {
        id: 'ss-msg-8',
        author: 'Priya Nair',
        authorRole: 'Lead Platform Engineer',
        avatar: '👩‍💻',
        channel: '#data-platform',
        time: '08:52',
        text: "@new-de — I've added you to DPLAT-247 (dedup) and created DPLAT-251 for the incremental model fix. Start with 251 since that's the immediate production blocker. Lena can walk you through the dbt project structure. Let me know if you need cluster access elevated.",
        isAlert: false,
        isUrgent: false
      }
    ],

    jiraTickets: [
      {
        id: 'DPLAT-251',
        type: 'hotfix',
        priority: 'P2',
        title: 'fct_orders_daily dbt model doing full table scan — revenue dashboard SLA breached',
        description:
          'The `fct_orders_daily` incremental model is performing a full scan of the `silver_orders` Delta table instead of reading only the incremental window. This started after the Black Friday historical data load last week increased the table from ~180GB to ~290GB. The model has been running for over 2 hours and has caused the revenue dashboard to miss its 07:00 SLA.',
        acceptanceCriteria: [
          'The `fct_orders_daily` model completes within 15 minutes on the production Databricks cluster',
          'The incremental predicate correctly filters `silver_orders` using the `order_created_at` partition column',
          'A `--full-refresh` dry-run in staging confirms correct row counts and no regression in deduplication metrics',
          'Dashboard freshness returns to < 30 minutes after the fix is deployed'
        ],
        businessImpact: 'CFO revenue dashboard is 2+ hours stale. Finance team is blocked on daily stand-up reporting.',
        effort: '2h',
        tags: ['dbt', 'delta-lake', 'performance', 'incremental-model', 'production-incident']
      },
      {
        id: 'DPLAT-247',
        type: 'tech-debt',
        priority: 'P2',
        title: 'Add idempotent deduplication step in Silver layer for Orders CDC source',
        description:
          'The Orders microservice CDC pipeline (Azure Data Factory) delivers at-least-once semantics, resulting in approximately 0.3% duplicate `order_id` values in the `silver_orders` Delta table. Currently the Gold layer dbt model attempts deduplication via a `MERGE` on `unique_key`, but this approach is fragile and causes performance degradation at scale. A proper dedup step should be introduced in the Silver transformation using `ROW_NUMBER()` window logic before data is promoted to Gold.',
        acceptanceCriteria: [
          'A Silver transformation step applies `ROW_NUMBER() OVER (PARTITION BY order_id ORDER BY cdc_timestamp DESC) = 1` before writing to `silver_orders_clean`',
          'Data quality test in dbt confirms `order_id` uniqueness in `silver_orders_clean` is 100%',
          'The Gold model `fct_orders_daily` is updated to read from `silver_orders_clean` instead of `silver_orders`',
          'A backfill script is written and reviewed for the last 90 days of historical data'
        ],
        businessImpact: 'Duplicate orders inflate revenue metrics by an estimated 0.29%, causing incorrect financial reporting.',
        effort: '1d',
        tags: ['data-quality', 'cdc', 'deduplication', 'silver-layer', 'delta-lake']
      },
      {
        id: 'DPLAT-249',
        type: 'feature',
        priority: 'P3',
        title: 'Add dynamic partition pruning to Databricks Delta writes in Bronze → Silver job',
        description:
          'The Bronze-to-Silver Spark job currently overwrites entire date partitions when processing CDC events, even when only a small subset of records for that partition have changed. This causes unnecessary read amplification on downstream queries. Enabling dynamic partition overwrite mode (`spark.sql.sources.partitionOverwriteMode = dynamic`) will limit rewrites to only affected partitions, improving both job duration and cluster cost.',
        acceptanceCriteria: [
          'Spark config `spark.sql.sources.partitionOverwriteMode` is set to `dynamic` in the job cluster config',
          'Integration test confirms that a CDC batch affecting 2 date partitions results in exactly 2 partition rewrites (verified via Delta transaction log)',
          'Average Bronze→Silver job duration reduces by at least 20% in staging benchmarks',
          'No data loss or incorrect partition state confirmed via row count reconciliation'
        ],
        businessImpact: 'Reduces Databricks DBU cost by an estimated 18% for the Bronze→Silver job and improves pipeline throughput.',
        effort: '4h',
        tags: ['spark', 'delta-lake', 'performance', 'cost-optimisation', 'partitioning']
      },
      {
        id: 'DPLAT-244',
        type: 'spike',
        priority: 'P3',
        title: 'Evaluate Delta Live Tables for real-time Orders ingestion path',
        description:
          'The current ADF-based CDC ingestion for Orders runs on a 15-minute micro-batch schedule, which contributes to the overall dashboard lag. This spike should evaluate whether migrating the Orders ingestion path to Databricks Delta Live Tables (DLT) with Auto Loader and Structured Streaming would reduce end-to-end latency to under 5 minutes. The evaluation should include cost comparison, operational complexity, and the impact on existing downstream consumers.',
        acceptanceCriteria: [
          'A proof-of-concept DLT pipeline is built in the dev environment ingesting from the Orders Event Hub',
          'Latency benchmarks are documented comparing ADF micro-batch vs DLT streaming for a representative 1-hour window',
          'Cost estimate (DBU + networking) is produced for running DLT continuously vs current scheduled approach',
          'Findings and recommendation are written up in Confluence before the next architecture review'
        ],
        businessImpact: 'Could reduce revenue dashboard lag from 30 min target to under 5 minutes, enabling near-real-time financial monitoring.',
        effort: '2d',
        tags: ['delta-live-tables', 'streaming', 'spike', 'latency', 'architecture']
      },
      {
        id: 'DPLAT-238',
        type: 'bug',
        priority: 'P3',
        title: 'Inventory hourly sync silently drops records when API rate limit is hit',
        description:
          'The ADF HTTP connector polling the Inventory REST API does not handle HTTP 429 (rate limit) responses correctly — it logs a warning but marks the pipeline run as succeeded and continues without the dropped page of results. This means during high-SKU-update windows (typically around 14:00–16:00 CET when warehouse operations peak), up to 1–2% of inventory updates are silently missing from the Silver layer until the next full refresh at 01:00.',
        acceptanceCriteria: [
          'ADF pipeline is updated to treat HTTP 429 responses as retriable errors with exponential backoff (max 3 retries, starting at 30s)',
          'A data quality test in dbt checks that the count of `updated_at` records in `silver_inventory` for the last hour is within 0.1% of the source API count endpoint',
          'Pipeline run history shows no silent data gaps in a 7-day staging soak test',
          'Alerting is added to notify #data-alerts if retry exhaustion occurs'
        ],
        businessImpact: 'Inventory inaccuracies affect stock availability calculations shown to customers, potentially causing overselling.',
        effort: '4h',
        tags: ['bug', 'data-loss', 'adf', 'inventory', 'error-handling']
      }
    ],

    pipelines: [
      {
        id: 'ss-pipe-1',
        name: 'revenue_gold_refresh (dbt)',
        schedule: 'Every 1h',
        lastRun: '06:15',
        status: 'running',
        duration: '2h 30m (still running)',
        records: '—',
        slaStatus: 'breached'
      },
      {
        id: 'ss-pipe-2',
        name: 'orders_bronze_cdc (ADF)',
        schedule: 'Every 15m',
        lastRun: '08:30',
        status: 'warning',
        duration: '12m 44s',
        records: '41,200 rows',
        slaStatus: 'at-risk'
      },
      {
        id: 'ss-pipe-3',
        name: 'clickstream_daily_agg (Databricks)',
        schedule: 'Daily 01:00',
        lastRun: '01:00',
        status: 'success',
        duration: '47m 02s',
        records: '183.2M events',
        slaStatus: 'ok'
      },
      {
        id: 'ss-pipe-4',
        name: 'inventory_hourly_sync (ADF)',
        schedule: 'Every 1h',
        lastRun: '08:00',
        status: 'success',
        duration: '18m 09s',
        records: '387,400 SKUs',
        slaStatus: 'ok'
      },
      {
        id: 'ss-pipe-5',
        name: 'product_catalog_full_refresh (ADF)',
        schedule: 'Daily 01:00',
        lastRun: '01:00',
        status: 'success',
        duration: '22m 51s',
        records: '2.19M products',
        slaStatus: 'ok'
      },
      {
        id: 'ss-pipe-6',
        name: 'payments_bronze_streaming (DLT)',
        schedule: 'Continuous',
        lastRun: '08:44',
        status: 'success',
        duration: 'Streaming',
        records: '1.8M txns today',
        slaStatus: 'ok'
      }
    ],

    architectureDecisions: [
      {
        id: 'ss-adr-1',
        title: 'How should we reduce revenue dashboard latency from 2 hours to under 30 minutes?',
        context:
          'The revenue dashboard currently relies on an hourly dbt batch job (`revenue_gold_refresh`) that reads from a Silver Delta table populated by a 15-minute ADF micro-batch CDC pipeline. End-to-end latency has grown to over 2 hours due to full table scans in the dbt model. The CFO has mandated a maximum of 30 minutes lag. We have three broad approaches: fix the existing batch pipeline, introduce a streaming layer, or adopt a hybrid incremental approach.',
        options: [
          {
            label: 'Fix the dbt incremental model and add partition pruning to the existing batch pipeline',
            pros: [
              'Minimal architectural change — leverages existing ADF and Databricks infrastructure',
              'Lowest engineering effort and can be deployed within a sprint',
              'Easy to test and roll back'
            ],
            cons: [
              'Still constrained by the 15-minute ADF micro-batch window — will never achieve sub-10-minute freshness',
              'Does not address the root cause of growing table scans as data volume increases'
            ],
            impact: { cost: 80, performance: 60, reliability: 75, complexity: 90 }
          },
          {
            label: 'Migrate Orders ingestion to Delta Live Tables (DLT) Structured Streaming',
            pros: [
              'Reduces end-to-end latency to under 5 minutes with continuous processing',
              'DLT handles exactly-once semantics and automatic schema evolution natively'
            ],
            cons: [
              'Requires rewriting the ingestion pipeline and a full migration of downstream consumers',
              'DLT continuous clusters cost more than scheduled jobs — needs DBU cost analysis',
              'Higher operational complexity for on-call engineers unfamiliar with streaming'
            ],
            impact: { cost: 45, performance: 95, reliability: 70, complexity: 40 }
          },
          {
            label: 'Add a 5-minute Structured Streaming layer for the revenue metric only, keep batch for everything else',
            pros: [
              'Achieves sub-10-minute freshness for the highest-priority dashboard without a full platform migration',
              'Limits blast radius — only the revenue metric path changes',
              'Good stepping stone to a fuller streaming migration in the future'
            ],
            cons: [
              'Two separate ingestion paths for the same source table introduces operational complexity',
              'Requires careful coordination to avoid write conflicts on the Silver Delta table'
            ],
            impact: { cost: 65, performance: 88, reliability: 78, complexity: 55 }
          }
        ],
        recommendedOption: 0,
        rationale:
          'For a team with a junior engineer on point and a P2 production incident in progress, Option A is the correct immediate choice. The full table scan fix and partition pruning will restore SLA compliance within hours rather than days and requires no new infrastructure. Options B and C are architecturally superior for the long term but carry significant delivery risk for a team that hasn\'t yet stabilised the existing batch pipeline. The right sequencing is: fix the incremental model now (DPLAT-251), close the dedup tech debt (DPLAT-247), then run the DLT spike (DPLAT-244) from a position of stability rather than urgency.'
      },
      {
        id: 'ss-adr-2',
        title: 'Where should order deduplication live in the medallion architecture?',
        context:
          'The Orders CDC source delivers at-least-once semantics, producing approximately 0.3% duplicate `order_id` values. Currently, deduplication is attempted inside the Gold-layer dbt model via a `MERGE` on `unique_key`. This approach is causing performance issues at scale and has failed to catch all duplicates. We need to decide at which layer deduplication should be enforced: Bronze, Silver, or Gold.',
        options: [
          {
            label: 'Deduplicate at the Silver layer using a window function before promoting to silver_orders_clean',
            pros: [
              'Ensures all downstream Gold models and ad-hoc queries consume clean, deduplicated data automatically',
              'Single source of truth for deduplication logic — no risk of inconsistency between Gold models',
              'Standard medallion architecture pattern — Silver layer is the right place for conformance transforms'
            ],
            cons: [
              'Requires a backfill of the Silver table to clean up existing duplicates',
              'Slightly increases Silver layer job duration'
            ],
            impact: { cost: 75, performance: 80, reliability: 92, complexity: 72 }
          },
          {
            label: 'Deduplicate at the Bronze layer immediately on ingestion from ADF',
            pros: [
              'Stops duplicates at the earliest possible point, keeping all downstream tables clean',
              'Simplifies all Silver and Gold transforms'
            ],
            cons: [
              'Bronze should be a raw, unmodified landing zone — deduplication here violates medallion best practices and makes auditing harder',
              'CDC events may legitimately repeat within a small window; deduplicating too early risks data loss'
            ],
            impact: { cost: 70, performance: 85, reliability: 65, complexity: 60 }
          },
          {
            label: 'Keep deduplication in the Gold dbt model but improve the MERGE key strategy',
            pros: [
              'No changes required to the Bronze or Silver layers',
              'Deduplication logic stays close to the business model where it is easiest to reason about'
            ],
            cons: [
              'Every new Gold model that reads from Silver must independently implement deduplication logic',
              'MERGE-based deduplication at Gold scale continues to be a performance bottleneck',
              'Any Gold model that forgets to implement dedup will produce incorrect metrics'
            ],
            impact: { cost: 60, performance: 40, reliability: 55, complexity: 65 }
          }
        ],
        recommendedOption: 0,
        rationale:
          'Silver-layer deduplication is the correct architectural choice. The medallion pattern assigns Bronze as raw landing, Silver as conformed and cleaned, and Gold as business-aggregated. Putting dedup at Silver means every downstream consumer — whether a dbt Gold model, a data scientist\'s notebook, or a direct SQL query — automatically gets clean data. Option B violates the principle of Bronze as an immutable audit log. Option C creates a maintenance burden and performance problem that will worsen as more Gold models are added. The backfill effort is a one-time cost that pays dividends in perpetuity.'
      },
      {
        id: 'ss-adr-3',
        title: 'How should we handle the growing size of the silver_orders Delta table (290GB and growing)?',
        context:
          'The `silver_orders` Delta table has grown from ~180GB to ~290GB over the last 30 days, primarily due to a Black Friday historical data load and 80M orders/month growth. Without intervention, the table will exceed 1TB within 6 months. The current dbt incremental models perform full scans when the incremental predicate is missing or misconfigured, and OPTIMIZE + ZORDER runs are becoming slow. We need a long-term table management strategy.',
        options: [
          {
            label: 'Introduce date-based partitioning on order_created_date and enforce it via OPTIMIZE with ZORDER on order_id',
            pros: [
              'Date partitioning enables aggressive partition pruning — most queries only touch the last 7–30 days',
              'ZORDER on `order_id` accelerates point lookups for order-level reconciliation queries',
              'Compatible with existing dbt incremental models once the partition filter is added'
            ],
            cons: [
              'Requires a full table rebuild with the new partition scheme — significant one-time compute cost',
              'Small partition problem can occur if daily order volume is low in certain markets'
            ],
            impact: { cost: 72, performance: 88, reliability: 85, complexity: 70 }
          },
          {
            label: 'Implement Delta table shallow clones per month for archival and only query current + last month in production models',
            pros: [
              'Reduces the active table size immediately without a full rebuild',
              'Historical data remains accessible for audit without bloating the production table'
            ],
            cons: [
              'Adds operational complexity — month-boundary queries must union across clones',
              'dbt models need significant refactoring to handle the sharded table logic',
              'Clone management adds a new operational task to the on-call runbook'
            ],
            impact: { cost: 80, performance: 70, reliability: 60, complexity: 35 }
          },
          {
            label: 'Enable Delta table auto-optimisation and VACUUM aggressively (retain 7 days) with no schema changes',
            pros: [
              'Zero migration cost — fully managed by Databricks with no pipeline changes',
              'Immediate reduction in small file overhead'
            ],
            cons: [
              'Does not address the fundamental full-scan problem — queries will still read all partitions',
              '7-day VACUUM retention reduces time-travel capability and limits incident recovery window'
            ],
            impact: { cost: 88, performance: 45, reliability: 72, complexity: 92 }
          }
        ],
        recommendedOption: 0,
        rationale:
          'Date partitioning is the correct long-term solution and should be sequenced immediately after the DPLAT-251 hotfix is deployed. The full table rebuild is a one-time cost that unlocks compounding performance benefits as the table continues to grow. Option C (auto-optimize only) is a good hygiene measure but does not solve the scan problem and should be enabled regardless of which option is chosen. Option B (monthly clones) creates fragile pipeline logic that will cause query errors at month boundaries and is not recommended. The recommended approach is: deploy DPLAT-251 hotfix → plan and execute the partitioned table rebuild in a staging environment → migrate production with a brief maintenance window.'
      }
    ]
  },

  // ─────────────────────────────────────────────────────────────────────────────
  // FINVERSE
  // ─────────────────────────────────────────────────────────────────────────────
  {
    id: 'finverse',
    name: 'FinVerse',
    tagline: 'A digital banking platform serving 4.2 million customers across the EU, with strict regulatory reporting obligations under CRR III and GDPR.',
    industry: 'Digital Banking',
    icon: '🏦',
    color: '#1d6fbd',
    difficulty: 'Intermediate',
    teamSize: '22 Data Engineers',
    stack: ['AWS Glue', 'Amazon Redshift', 'Apache Kafka', 'Apache Spark', 'Great Expectations', 'dbt'],
    description:
      'FinVerse operates a change-data-capture architecture on AWS, streaming transaction, account, and customer events from eight core banking microservices into a Redshift-based analytical warehouse via Kafka and Glue ETL jobs. The platform must produce daily regulatory reports for the European Banking Authority (EBA) and national competent authorities by 07:00 each morning, a deadline that carries legal penalties if missed. Schema drift from upstream microservice deployments and intermittent CDC consumer lag have become the two most destabilising forces in the pipeline, threatening both compliance deadlines and GDPR data masking guarantees.',
    yourRole:
      'You are a mid-level Data Engineer on the Data Governance team at FinVerse, with two years of experience in the platform. Your primary responsibility is the reliability and data quality of the regulatory reporting pipeline, and you are the on-call engineer this week.',
    todaysBriefing:
      "At 05:47 UTC the Kafka consumer for the `transactions-cdc` topic stalled and the overnight Glue job that populates `dwh.fact_transactions` did not complete. The compliance report scheduled for 07:00 is now at risk — if the job does not complete and pass Great Expectations validation by 06:45, the report cannot be filed on time. You have been paged and have approximately 55 minutes to diagnose and either fix or invoke the manual filing contingency.",

    orgChart: [
      { name: 'Ingrid Solvang', role: 'Head of Data Engineering', avatar: '👩‍💼', relation: 'manager' },
      { name: 'Dmitri Volkov', role: 'Senior Data Engineer (CDC)', avatar: '👨‍💻', relation: 'peer' },
      { name: 'Fatima Al-Rashid', role: 'Data Quality Engineer', avatar: '👩‍🔬', relation: 'peer' },
      { name: 'Hans-Peter Gruber', role: 'Compliance & Regulatory Analyst', avatar: '⚖️', relation: 'stakeholder' },
      { name: 'Nia Osei', role: 'Principal Data Architect', avatar: '🏗️', relation: 'architect' }
    ],

    dataSources: [
      { name: 'Core Banking Transactions', type: 'Kafka CDC (Debezium)', volume: '~12M events/day', ingestionMethod: 'Kafka → Glue Streaming → Redshift' },
      { name: 'Customer Identity (KYC)', type: 'PostgreSQL (CDC)', volume: '~180K updates/day', ingestionMethod: 'Debezium → Kafka → Glue Batch' },
      { name: 'Accounts Ledger', type: 'Oracle (LogMiner CDC)', volume: '~4.5M entries/day', ingestionMethod: 'Kafka Connect Oracle → S3 → Glue' },
      { name: 'Fraud Signals', type: 'REST API (near real-time)', volume: '~200K signals/day', ingestionMethod: 'Lambda → Kinesis → Redshift Streaming' },
      { name: 'AML Watchlist', type: 'Flat file (SFTP)', volume: '~50K entities/day', ingestionMethod: 'SFTP → S3 → Glue batch (06:00)' },
      { name: 'FX Rates', type: 'Third-party REST API', volume: '~2K rate updates/day', ingestionMethod: 'Lambda scheduled (every 30 min)' }
    ],

    kpis: [
      { name: 'Regulatory Report Filing On-Time Rate', target: '100%', current: 'At risk today', status: 'breached' },
      { name: 'Great Expectations Pass Rate (DQ)', target: '> 99.8%', current: '98.9%', status: 'at-risk' },
      { name: 'CDC Consumer Lag (transactions topic)', target: '< 5 min', current: '47 min', status: 'breached' },
      { name: 'GDPR PII Masking Coverage', target: '100%', current: '100%', status: 'healthy' }
    ],

    slas: [
      { pipeline: 'Regulatory Report Pipeline (EBA)', sla: 'Complete by 06:45', current: 'Not started (05:52)', status: 'breached' },
      { pipeline: 'transactions-cdc Kafka Consumer', sla: 'Max 5 min consumer lag', current: '47 min lag', status: 'breached' },
      { pipeline: 'AML Watchlist Daily Load', sla: 'Complete by 06:15', current: 'Completed 06:08', status: 'healthy' },
      { pipeline: 'KYC Identity Sync', sla: 'Complete by 04:00', current: 'Completed 03:41', status: 'healthy' }
    ],

    slackMessages: [
      {
        id: 'fv-msg-1',
        author: 'PagerDuty',
        authorRole: 'Automated Monitor',
        avatar: '🚨',
        channel: '#data-alerts',
        time: '05:47',
        text: '🔴 P1 ALERT — Kafka consumer group `glue-transactions-cdc-consumer` has stalled. Consumer lag on topic `transactions-cdc` partition 0–11 exceeds threshold of 300,000 messages (current: 1,847,302). Glue job `transactions_cdc_loader` is blocking on consumer poll. On-call: @mid-level-de',
        isAlert: true,
        isUrgent: true
      },
      {
        id: 'fv-msg-2',
        author: 'Ingrid Solvang',
        authorRole: 'Head of Data Engineering',
        avatar: '👩‍💼',
        channel: '#data-governance',
        time: '05:51',
        text: "@mid-level-de — you're on-call. We have a P1 on the transactions CDC. EBA compliance report files at 07:00. If `fact_transactions` isn't populated and validated by 06:45 we need to invoke the manual contingency. Keep me posted every 10 minutes.",
        isAlert: false,
        isUrgent: true
      },
      {
        id: 'fv-msg-3',
        author: 'Dmitri Volkov',
        authorRole: 'Senior Data Engineer (CDC)',
        avatar: '👨‍💻',
        channel: '#data-governance',
        time: '06:02',
        text: "I'm awake. Checked the Kafka broker metrics — consumer stall looks like it was triggered by a schema registry exception at 05:44. Upstream `payments-service` deployed v2.3.1 last night and added a new nullable field `merchant_category_code` to the transaction event schema. The Glue job's Avro deserializer is failing on the new schema version because `schema.compatibility` is set to BACKWARD_TRANSITIVE — the new field doesn't have a default.",
        isAlert: false,
        isUrgent: true
      },
      {
        id: 'fv-msg-4',
        author: 'Fatima Al-Rashid',
        authorRole: 'Data Quality Engineer',
        avatar: '👩‍🔬',
        channel: '#data-governance',
        time: '06:08',
        text: "Confirmed — the Great Expectations suite for `fact_transactions` is going to fail the `expect_column_to_exist` check for `merchant_category_code` because our expectation suite was written against the v2.2 schema and doesn't know about the new column. We need to update the GE suite AND add the column to the Redshift target table before we can validate. I can handle the GE suite update if you handle the schema migration.",
        isAlert: false,
        isUrgent: true
      },
      {
        id: 'fv-msg-5',
        author: 'Hans-Peter Gruber',
        authorRole: 'Compliance Analyst',
        avatar: '⚖️',
        channel: '#data-governance',
        time: '06:14',
        text: "Just to flag from the compliance side: `merchant_category_code` (MCC) is a required field in the EBA Transaction Report under CRR III Article 430b. If the field is NULL for today's report we will need to document it as a known data gap and notify the regulator. Please confirm once the pipeline is unblocked whether the new events actually carry MCC values or if the upstream service is sending NULLs.",
        isAlert: false,
        isUrgent: false
      },
      {
        id: 'fv-msg-6',
        author: 'Dmitri Volkov',
        authorRole: 'Senior Data Engineer (CDC)',
        avatar: '👨‍💻',
        channel: '#data-governance',
        time: '06:19',
        text: "Schema registry fix applied — I added `\"default\": null` to the `merchant_category_code` field in schema version v2.3.2 and re-registered it. Consumer group has been reset to resume from the stall offset. The Glue job should restart and begin draining the backlog now. Estimated catch-up time: 18–22 minutes based on current throughput. That puts completion around 06:40 — tight but possible.",
        isAlert: false,
        isUrgent: false
      },
      {
        id: 'fv-msg-7',
        author: 'AWS CloudWatch Alarms',
        authorRole: 'Automated Monitor',
        avatar: '🤖',
        channel: '#data-alerts',
        time: '06:22',
        text: '🟡 INFO — Glue job `transactions_cdc_loader` resumed processing. Current throughput: 82,400 records/min. Backlog: 1,847,302 remaining. Estimated completion: 06:44 UTC.',
        isAlert: true,
        isUrgent: false
      },
      {
        id: 'fv-msg-8',
        author: 'Fatima Al-Rashid',
        authorRole: 'Data Quality Engineer',
        avatar: '👩‍🔬',
        channel: '#data-governance',
        time: '06:25',
        text: "GE suite updated and deployed — added `expect_column_to_exist('merchant_category_code')` and `expect_column_values_to_be_of_type('merchant_category_code', 'VARCHAR')`. Left the not-null expectation as a warning (not a hard fail) for today given Hans-Peter's note about NULLs being acceptable with a documented gap. FVDQ-89 raised to make it a hard fail from next Monday once upstream confirms MCC population.",
        isAlert: false,
        isUrgent: false
      }
    ],

    jiraTickets: [
      {
        id: 'FVDQ-89',
        type: 'hotfix',
        priority: 'P1',
        title: 'Schema drift in transactions-cdc caused by payments-service v2.3.1 deployment broke Glue job',
        description:
          'A new field `merchant_category_code` (VARCHAR) was added to the `TransactionEvent` Avro schema in `payments-service` v2.3.1 without a default value, violating BACKWARD_TRANSITIVE schema compatibility rules. This caused the Glue streaming job to throw a SchemaCompatibilityException and stall the `transactions-cdc` Kafka consumer group, resulting in a 47-minute lag and a near-miss on the EBA compliance report deadline. The immediate fix (adding a null default) has been applied but the process failure must be addressed systemically.',
        acceptanceCriteria: [
          'Schema registry compatibility policy is documented and enforced in the `payments-service` CI/CD pipeline via a schema compatibility check step before deployment',
          'A pre-deployment hook is added to the data engineering on-call runbook requiring schema registry impact assessment for all upstream service releases',
          'A Slack notification is configured to alert #data-governance 24 hours before any planned schema change to a topic consumed by a regulated pipeline',
          'Redshift DDL for `dwh.fact_transactions` is updated to include `merchant_category_code VARCHAR(10)` and the dbt model is updated accordingly'
        ],
        businessImpact: 'Near-miss on EBA compliance report deadline. If the contingency had been invoked, a regulator notification would have been required, carrying reputational and potential financial risk.',
        effort: '1d',
        tags: ['schema-drift', 'kafka', 'compliance', 'p1-incident', 'schema-registry']
      },
      {
        id: 'FVDQ-84',
        type: 'feature',
        priority: 'P2',
        title: 'Implement automated schema compatibility checks in upstream service CI/CD pipelines',
        description:
          'Multiple schema drift incidents in the last quarter have all followed the same pattern: an upstream microservice team adds or changes a field without coordinating with the data engineering team, breaking Avro deserialisation in the Glue consumer. A reusable CI step using the Confluent Schema Registry REST API should be built and published as a shared GitHub Action for all teams that produce events to regulated Kafka topics. The check should fail the deployment pipeline if the proposed schema change violates the topic\'s configured compatibility level.',
        acceptanceCriteria: [
          'A GitHub Actions composite action `schema-registry-check` is published to the internal actions marketplace',
          'The action accepts `schema_file`, `subject_name`, and `registry_url` inputs and exits non-zero if the compatibility check fails',
          'The action is integrated into the CI pipeline of the four highest-risk upstream services: `payments-service`, `accounts-service`, `customer-service`, and `fraud-service`',
          'Runbook is updated with instructions for upstream engineers on how to request a schema evolution review from the data governance team'
        ],
        businessImpact: 'Eliminates the most common class of P1 incident in the data platform, protecting the 07:00 regulatory filing deadline.',
        effort: '2d',
        tags: ['schema-registry', 'ci-cd', 'data-governance', 'kafka', 'developer-experience']
      },
      {
        id: 'FVDQ-81',
        type: 'tech-debt',
        priority: 'P2',
        title: 'Great Expectations suites are not version-controlled and drift from actual schema',
        description:
          "FinVerse's Great Expectations suites for regulated tables are stored in S3 as JSON files and edited manually by engineers. There is no version control, no review process, and no automated synchronisation with the actual Redshift table schemas. As a result, when upstream schemas change (as in today's incident), the GE suites are always discovered to be out-of-date reactively rather than proactively. The suites must be migrated to a Git-managed repository with a CI process that validates suites against the current table schema on every pull request.",
        acceptanceCriteria: [
          'All GE expectation suites are exported from S3 and committed to a new `data-quality` Git repository',
          'A CI job runs `great_expectations suite demo` against a Redshift dev schema snapshot on every PR to the repository',
          'A nightly job compares the current Redshift production schema against the committed GE suites and raises a JIRA ticket automatically if a mismatch is detected',
          'The S3-based manual editing workflow is deprecated and access is restricted to read-only for the ops team'
        ],
        businessImpact: 'Reduces mean time to detect schema drift from hours (reactive) to minutes (proactive), protecting compliance report deadlines.',
        effort: '2d',
        tags: ['great-expectations', 'data-quality', 'tech-debt', 'version-control', 'compliance']
      },
      {
        id: 'FVDQ-77',
        type: 'bug',
        priority: 'P2',
        title: 'GDPR masking not applied to transaction descriptions in Redshift staging table',
        description:
          'A data audit found that the Redshift staging table `stg.transactions_raw` retains the unmasked `transaction_description` field, which can contain free-text PII such as personal names and merchant descriptions. The masking transform is correctly applied in the Silver→Gold step producing `dwh.fact_transactions`, but the staging table persists for 7 days and is accessible to data scientists with Redshift read access. Under GDPR Article 25 (data protection by design), PII must not be accessible in staging environments unless there is a documented lawful basis.',
        acceptanceCriteria: [
          '`stg.transactions_raw.transaction_description` is masked using SHA-256 hashing at ingestion time (not post-load)',
          'A Great Expectations test is added to verify that no value in `stg.transactions_raw.transaction_description` matches the regex pattern for common PII formats',
          'The Redshift column-level security policy is updated to revoke SELECT on `transaction_description` for the `data_science_readonly` role in all staging schemas',
          'A GDPR impact assessment (DPIA) note is added to Confluence documenting the fix and the 7-day retention policy for staging data'
        ],
        businessImpact: 'Active GDPR compliance gap. If discovered in a regulatory audit, FinVerse faces fines up to 4% of global annual turnover under GDPR Article 83.',
        effort: '1d',
        tags: ['gdpr', 'pii', 'security', 'compliance', 'redshift', 'data-masking']
      },
      {
        id: 'FVDQ-71',
        type: 'spike',
        priority: 'P3',
        title: 'Evaluate Apache Flink for sub-minute regulatory event detection to replace Spark Structured Streaming',
        description:
          'The current real-time fraud signal processing job uses Spark Structured Streaming on EMR with a 30-second micro-batch trigger. Regulatory requirements under PSD2 require that suspicious transaction patterns be flagged within 60 seconds of occurrence. In peak load tests, the Spark job has shown 45–55 second end-to-end latency, leaving only a 5–15 second margin. This spike should evaluate whether Apache Flink on Kinesis Data Analytics would provide sufficient latency improvement and what the migration cost would be.',
        acceptanceCriteria: [
          'A Flink proof-of-concept job is built that reads from the `fraud-signals` Kafka topic and writes to the Redshift `stg.fraud_signals` table',
          'End-to-end latency is benchmarked under simulated peak load (2,000 events/sec) and compared against the current Spark baseline',
          'Operational considerations (deployment, monitoring, job recovery) are documented',
          'A go/no-go recommendation with cost estimate is presented at the next architecture review'
        ],
        businessImpact: 'PSD2 compliance risk if fraud detection latency exceeds 60 seconds under peak load. A missed detection could result in uncontested chargebacks and regulatory scrutiny.',
        effort: '2d',
        tags: ['flink', 'spark', 'streaming', 'psd2', 'spike', 'fraud-detection']
      }
    ],

    pipelines: [
      {
        id: 'fv-pipe-1',
        name: 'transactions_cdc_loader (Glue Streaming)',
        schedule: 'Continuous',
        lastRun: '05:44 (stalled)',
        status: 'running',
        duration: 'Resumed 06:22 (draining backlog)',
        records: '1.85M events backlogged',
        slaStatus: 'breached'
      },
      {
        id: 'fv-pipe-2',
        name: 'eba_regulatory_report (Glue Batch)',
        schedule: 'Daily 06:00',
        lastRun: 'Not started',
        status: 'failed',
        duration: '—',
        records: '—',
        slaStatus: 'breached'
      },
      {
        id: 'fv-pipe-3',
        name: 'aml_watchlist_daily (Glue Batch)',
        schedule: 'Daily 06:00',
        lastRun: '06:00',
        status: 'success',
        duration: '7m 44s',
        records: '51,200 entities',
        slaStatus: 'ok'
      },
      {
        id: 'fv-pipe-4',
        name: 'kyc_identity_sync (Glue Batch)',
        schedule: 'Daily 03:00',
        lastRun: '03:00',
        status: 'success',
        duration: '41m 02s',
        records: '4.2M customer records',
        slaStatus: 'ok'
      },
      {
        id: 'fv-pipe-5',
        name: 'fraud_signals_streaming (Spark / EMR)',
        schedule: 'Continuous',
        lastRun: '06:20',
        status: 'warning',
        duration: '52s avg latency',
        records: '~200K signals/day',
        slaStatus: 'at-risk'
      },
      {
        id: 'fv-pipe-6',
        name: 'fx_rates_refresh (Lambda)',
        schedule: 'Every 30m',
        lastRun: '06:00',
        status: 'success',
        duration: '8s',
        records: '2,144 rates',
        slaStatus: 'ok'
      }
    ],

    architectureDecisions: [
      {
        id: 'fv-adr-1',
        title: 'How should we enforce schema compatibility across 12 upstream Kafka producers?',
        context:
          "FinVerse has 12 microservices producing events to Kafka topics that are consumed by the regulated data pipeline. Three P1 incidents in Q1 were caused by schema drift — upstream teams deploying changes without coordinating with data engineering. The Schema Registry is configured with BACKWARD_TRANSITIVE compatibility but this is only enforced at runtime (when the Glue consumer tries to deserialise). We need a shift-left approach that catches incompatible changes before they reach production. The platform team has capacity to build automation but must balance developer experience with enforcement.",
        options: [
          {
            label: 'Mandatory CI/CD schema compatibility check as a GitHub Actions step in all upstream producer pipelines',
            pros: [
              'Breaks the deployment pipeline immediately if an incompatible schema change is attempted — zero-tolerance enforcement',
              'Runs in CI before code reaches production, not at runtime when it is too late',
              'Produces a clear, actionable error message guiding the upstream engineer to request a schema evolution review'
            ],
            cons: [
              'Requires coordination with 8 separate engineering teams to integrate the GitHub Action',
              'Teams with legacy CI systems (Jenkins) need a different integration path'
            ],
            impact: { cost: 78, performance: 85, reliability: 95, complexity: 60 }
          },
          {
            label: 'Schema review board: all schema changes require a data engineering sign-off ticket before merging',
            pros: [
              'Provides human review and context that automated checks cannot — catches semantic issues not just structural ones',
              'Works regardless of upstream CI system'
            ],
            cons: [
              'Creates a bottleneck on the data engineering team — every upstream release must wait for DE review',
              'Does not scale as the number of producers grows',
              'Manual process is error-prone and will eventually be bypassed under release pressure'
            ],
            impact: { cost: 65, performance: 70, reliability: 72, complexity: 45 }
          },
          {
            label: 'Consumer-side schema evolution: make the Glue job tolerant of unknown fields by switching to schema-less JSON with explicit field mapping',
            pros: [
              'Eliminates the entire class of schema-drift-induced consumer failures',
              'No changes needed to upstream services'
            ],
            cons: [
              'Loses compile-time schema guarantees — bugs become silent data quality issues rather than loud failures',
              'JSON at 12M events/day is significantly more expensive to process and store than Avro',
              'Data quality issues become harder to detect and may slip into regulatory reports unnoticed'
            ],
            impact: { cost: 40, performance: 50, reliability: 45, complexity: 80 }
          }
        ],
        recommendedOption: 0,
        rationale:
          "CI/CD enforcement is the only approach that is both scalable and reliable. The manual review board (Option B) is a reasonable interim measure but will become a bottleneck and compliance risk as the organisation grows. Option C trades loud, fast failures for silent data corruption, which is the worst possible outcome for a regulated financial platform — a missed regulatory field is far more dangerous than a deployment failure. The recommended path is to build the GitHub Action (FVDQ-84), deploy it to the four highest-risk producers immediately, and use the schema review board only for teams with legacy CI as a time-limited bridge."
      },
      {
        id: 'fv-adr-2',
        title: 'Should GDPR masking be applied at ingestion time or at the transformation layer?',
        context:
          "FVDQ-77 revealed that PII is persisting in Redshift staging tables. The current architecture applies GDPR masking in the Silver→Gold dbt transformation, meaning all intermediate staging tables contain unmasked PII. Under GDPR Article 25, data must be protected by design and by default. The data engineering team must decide whether to move masking to the earliest possible point (Kafka / Glue ingestion) or retain it in the transformation layer with stronger access controls on staging tables.",
        options: [
          {
            label: 'Apply masking at the Kafka consumer / Glue ingestion step — no PII ever lands in Redshift',
            pros: [
              'Satisfies GDPR data protection by design — PII never touches the analytical environment',
              'Eliminates the need for column-level security policies on staging tables',
              'Simplifies the data masking audit — one enforcement point rather than many'
            ],
            cons: [
              'Irreversible — once masked, the original PII cannot be recovered for legitimate purposes (e.g., fraud investigations) without a separate secure access path',
              'Masking in Glue adds processing overhead and requires a secure key management integration (AWS KMS)'
            ],
            impact: { cost: 70, performance: 72, reliability: 90, complexity: 55 }
          },
          {
            label: 'Retain masking in the transformation layer but implement strict column-level security on all staging tables',
            pros: [
              'Preserves the ability to access unmasked data for authorised purposes (fraud investigation, legal holds)',
              'Lower implementation risk — no changes to the ingestion layer'
            ],
            cons: [
              'Column-level security in Redshift requires careful role management and is error-prone to maintain as schemas evolve',
              'Staging tables with PII require regular GDPR Article 30 processing activity documentation',
              'Regulators increasingly expect "privacy by design" — this approach may not satisfy future guidance'
            ],
            impact: { cost: 75, performance: 80, reliability: 68, complexity: 50 }
          },
          {
            label: 'Implement a tokenisation vault: replace PII with reversible tokens at ingestion, with the token-to-PII mapping held in a separate HSM-backed vault',
            pros: [
              'Best of both worlds — analytical pipelines work with tokens (no PII exposure), but authorised teams can de-tokenise for legitimate purposes',
              'Tokens are useless to an attacker without vault access — significantly reduces breach impact'
            ],
            cons: [
              'Highest implementation complexity — requires a new vault infrastructure component, vault API integration, and strict access controls',
              'Token resolution adds latency to any workflow that needs original PII values',
              'Significant engineering effort — likely 4–6 weeks for a production-quality implementation'
            ],
            impact: { cost: 40, performance: 65, reliability: 85, complexity: 25 }
          }
        ],
        recommendedOption: 1,
        rationale:
          "For FinVerse's current maturity level, Option B (transformation-layer masking with strict column-level security) is the pragmatic recommendation, with Option C as the target-state architecture on an 18-month roadmap. Applying masking at ingestion (Option A) is architecturally cleaner but risks losing the ability to perform fraud investigations and legal holds using original transaction data, which has significant legal implications for a regulated bank. Tokenisation (Option C) is the gold standard but requires infrastructure investment that should be planned carefully rather than rushed. The immediate priority is to fix the FVDQ-77 compliance gap with enhanced column-level security, document the approach in a DPIA, and propose the tokenisation roadmap to the CTO."
      },
      {
        id: 'fv-adr-3',
        title: 'How should we handle late-arriving CDC events that land after the regulatory report has been generated?',
        context:
          "The EBA regulatory report is generated daily at 07:00 UTC using a T+0 snapshot of `dwh.fact_transactions`. Occasionally, network issues or upstream service restarts cause CDC events to arrive 30–120 minutes late, meaning they are missed from the T+0 report. The current process requires a manual correction report to be filed with the regulator when this is discovered, which has happened three times in the last six months. The data engineering team needs a systematic approach to detect and handle late-arriving events.",
        options: [
          {
            label: 'Add a T+2h reconciliation job that compares the filed report against late-arriving events and generates an automated correction notice',
            pros: [
              'Automates what is currently a manual, error-prone process',
              'Correction notices filed quickly (within 2 hours) demonstrate good-faith compliance to regulators',
              'Low implementation risk — builds on existing pipeline infrastructure'
            ],
            cons: [
              'Does not prevent late arrivals — only handles them after the fact',
              'Regulators may scrutinise the correction rate if it increases rather than decreases over time'
            ],
            impact: { cost: 72, performance: 75, reliability: 80, complexity: 68 }
          },
          {
            label: 'Switch to a watermark-based late data window: delay the report generation to 09:00 to allow a 2-hour late-arrival window',
            pros: [
              'Significantly reduces the number of corrections needed by absorbing most late arrivals into the filing window',
              'Simpler than building a reconciliation system'
            ],
            cons: [
              'EBA reporting deadline is 07:00 — a 09:00 filing would require regulatory approval and may not be permissible',
              'Moving the report later pushes other downstream processes (intraday risk calculations) later as well'
            ],
            impact: { cost: 80, performance: 60, reliability: 70, complexity: 75 }
          },
          {
            label: 'Implement event-time processing with a 15-minute late-arrival watermark in the Glue streaming job and freeze the report snapshot only after the watermark passes',
            pros: [
              'Handles the majority of late arrivals (network jitter, brief restarts) within the existing 07:00 window',
              'Industry-standard streaming pattern — well understood and operationally proven'
            ],
            cons: [
              'Watermarks cannot protect against the 30–120 minute late arrivals caused by major upstream outages',
              'Requires restructuring the Glue streaming job to use event-time semantics rather than processing-time'
            ],
            impact: { cost: 65, performance: 85, reliability: 75, complexity: 45 }
          }
        ],
        recommendedOption: 0,
        rationale:
          "The reconciliation job (Option A) is the recommended approach because it directly solves the actual problem — correction reports are filed manually and slowly. A 15-minute watermark (Option C) helps with minor jitter but does not address the 30–120 minute late arrivals from upstream outages that actually trigger the corrections. Delaying the report to 09:00 (Option B) is unlikely to be permissible under EBA guidelines. The recommended architecture combines Option A (automated correction) as the primary protection with Option C (watermark) as a secondary optimisation to reduce the number of corrections triggered. This combination should be the target architecture in the next quarter."
      }
    ]
  },

  // ─────────────────────────────────────────────────────────────────────────────
  // MEDIFLOW
  // ─────────────────────────────────────────────────────────────────────────────
  {
    id: 'mediflow',
    name: 'MediFlow',
    tagline: 'A healthcare analytics platform processing EHR data from 340 hospital networks, enabling clinical research and population health management at HIPAA-compliant scale.',
    industry: 'Healthcare Analytics',
    icon: '🏥',
    color: '#7c4dbd',
    difficulty: 'Advanced',
    teamSize: '31 Data Engineers',
    stack: ['Snowflake', 'dbt', 'Apache Airflow', 'Apache Kafka', 'Great Expectations', 'Terraform'],
    description:
      'MediFlow ingests HL7 FHIR and X12 EDI data from 340 hospital network EHR systems into a Snowflake-based lakehouse, supporting clinical analytics, population health dashboards, and pharmaceutical research cohort queries. The platform operates under strict HIPAA compliance requirements, meaning all PHI (Protected Health Information) must be de-identified or access-controlled through a cell-level encryption policy before leaving the Trusted Data Zone. Spark-based patient cohort queries running on the 500M-record patient events table have begun experiencing out-of-memory failures as the dataset grows, and a pattern of late-arriving insurance claims data is causing incorrect attribution in clinical outcome reports.',
    yourRole:
      'You are a Senior Data Engineer on the Clinical Analytics team, with primary ownership of the patient cohort query infrastructure and the claims data ingestion pipeline. You hold the keys for the Snowflake PHI Trusted Zone and are the primary on-call engineer for HIPAA-related data incidents.',
    todaysBriefing:
      'At 03:00 UTC, the nightly Spark job `patient_cohort_build_v3` processing the full 500M-record patient events table for the Q2 cardiovascular research cohort hit an OOM error on the executor nodes and failed. The cardiovascular research team needs the cohort by 09:00 for a clinical trial kickoff meeting. Additionally, the late-arriving claims ingestion job shows that 12% of May claims have not arrived from three hospital networks — this will cause attribution errors in the Q1 outcomes report due to be published next week.',

    orgChart: [
      { name: 'Dr. Maya Chen', role: 'VP of Clinical Data Engineering', avatar: '👩‍⚕️', relation: 'manager' },
      { name: 'Kwame Asante', role: 'Staff Data Engineer (Infrastructure)', avatar: '👨‍💻', relation: 'peer' },
      { name: 'Preethi Venkataraman', role: 'Clinical Data Scientist', avatar: '🔬', relation: 'stakeholder' },
      { name: 'Ravi Patel', role: 'HIPAA Compliance Officer', avatar: '🔒', relation: 'stakeholder' },
      { name: 'Sonja Eriksen', role: 'Principal Data Architect', avatar: '🏗️', relation: 'architect' }
    ],

    dataSources: [
      { name: 'Hospital EHR Systems (HL7 FHIR)', type: 'REST API / FHIR R4', volume: '~8M patient events/day', ingestionMethod: 'Kafka FHIR Connector → Snowflake Snowpipe' },
      { name: 'Insurance Claims (X12 EDI 837)', type: 'SFTP Flat File (EDI)', volume: '~1.2M claims/day (variable)', ingestionMethod: 'SFTP → S3 → Airflow → Snowflake COPY INTO' },
      { name: 'Lab Results (HL7 v2.x)', type: 'MLLP / HL7 v2', volume: '~3.4M results/day', ingestionMethod: 'HL7 Listener → Kafka → Snowflake Snowpipe' },
      { name: 'Pharmacy Dispensing Events', type: 'HL7 FHIR MedicationDispense', volume: '~900K events/day', ingestionMethod: 'Kafka FHIR Connector → Snowflake Snowpipe' },
      { name: 'Clinical Trial Enrollment (REDCap)', type: 'REST API', volume: '~12K enrollments/day', ingestionMethod: 'Airflow HTTP operator (hourly)' },
      { name: 'ICD-10 / SNOMED Reference Data', type: 'Static flat files (quarterly)', volume: '~280K code entries', ingestionMethod: 'Airflow → Snowflake COPY INTO (quarterly refresh)' }
    ],

    kpis: [
      { name: 'Patient Cohort Build SLA (09:00)', target: '100% on-time', current: 'FAILED at 03:00', status: 'breached' },
      { name: 'Claims Completeness (30-day window)', target: '> 99%', current: '88% (3 networks missing)', status: 'breached' },
      { name: 'PHI De-identification Coverage', target: '100%', current: '100%', status: 'healthy' },
      { name: 'HIPAA Audit Log Completeness', target: '100%', current: '100%', status: 'healthy' }
    ],

    slas: [
      { pipeline: 'patient_cohort_build_v3 (Spark)', sla: 'Complete by 06:00', current: 'FAILED 03:00 (OOM)', status: 'breached' },
      { pipeline: 'claims_edi_ingestion (Airflow)', sla: 'T+4h from file arrival', current: '12% of May claims missing', status: 'breached' },
      { pipeline: 'ehr_fhir_snowpipe (Kafka → Snowflake)', sla: '< 10 min end-to-end lag', current: '7 min avg', status: 'healthy' },
      { pipeline: 'lab_results_snowpipe', sla: '< 10 min end-to-end lag', current: '9 min avg', status: 'healthy' }
    ],

    slackMessages: [
      {
        id: 'mf-msg-1',
        author: 'Airflow Alertmanager',
        authorRole: 'Automated Monitor',
        avatar: '🤖',
        channel: '#clinical-data-alerts',
        time: '03:04',
        text: '🔴 DAG `patient_cohort_build_v3` task `spark_cohort_build` FAILED at 03:00 UTC. Error: `org.apache.spark.SparkException: Job aborted due to stage failure: Total size of serialized results of 4,821 tasks (10.1 GiB) is bigger than spark.driver.maxResultSize (10.0 GiB)`. Executor logs: s3://mediflow-logs/spark/cohort-v3/2026-05-21/. PHI data scope: Trusted Zone only.',
        isAlert: true,
        isUrgent: true
      },
      {
        id: 'mf-msg-2',
        author: 'Dr. Maya Chen',
        authorRole: 'VP of Clinical Data Engineering',
        avatar: '👩‍⚕️',
        channel: '#clinical-data-platform',
        time: '03:09',
        text: "@senior-de — paged you on the cohort job. The cardiovascular research team needs cohort v3 for their trial kickoff at 09:00. Ravi will need a summary of what data was processed before the failure so we can assess PHI incident risk. Please confirm whether any PHI left the Trusted Zone and keep me updated every 30 min.",
        isAlert: false,
        isUrgent: true
      },
      {
        id: 'mf-msg-3',
        author: 'Kwame Asante',
        authorRole: 'Staff Data Engineer',
        avatar: '👨‍💻',
        channel: '#clinical-data-platform',
        time: '03:22',
        text: "I looked at the Spark executor logs. The job is trying to collect a 10.1GB result set to the driver for a `groupBy().agg()` operation on the full 500M patient events table. The cohort filter (`condition_code IN ('I20', 'I21', 'I25')` — cardiovascular ICD-10) is being applied AFTER the aggregation rather than before it in the `build_cardiovascular_cohort` SQL step. That means it's aggregating all 500M rows, then filtering — instead of filtering first (which would reduce to ~4.2M rows) and then aggregating.",
        isAlert: false,
        isUrgent: true
      },
      {
        id: 'mf-msg-4',
        author: 'Preethi Venkataraman',
        authorRole: 'Clinical Data Scientist',
        avatar: '🔬',
        channel: '#clinical-data-platform',
        time: '03:31',
        text: "To clarify the research requirements: we need patients with a primary or secondary ICD-10 code in the `I20-I25` range (ischemic heart disease), at least one inpatient encounter in the last 24 months, and no prior enrollment in a cardiovascular trial. The cohort size should be approximately 4–5M patients from the full dataset. If the filter-then-aggregate approach reduces it to that range, the driver memory issue should go away.",
        isAlert: false,
        isUrgent: false
      },
      {
        id: 'mf-msg-5',
        author: 'Ravi Patel',
        authorRole: 'HIPAA Compliance Officer',
        avatar: '🔒',
        channel: '#clinical-data-platform',
        time: '03:38',
        text: "Confirmed — the Spark job ran entirely within the Trusted Zone EMR cluster and no output was written before the failure. PHI audit logs show no egress from the Trusted Zone boundary. This is not a HIPAA incident. However, please add a note to the CDAN-118 runbook that all cohort builds must have a pre-flight row count check before the aggregation step so we can detect runaway queries before they consume driver memory.",
        isAlert: false,
        isUrgent: false
      },
      {
        id: 'mf-msg-6',
        author: 'Airflow Alertmanager',
        authorRole: 'Automated Monitor',
        avatar: '🤖',
        channel: '#clinical-data-alerts',
        time: '04:15',
        text: '🟡 WARNING — DAG `claims_edi_ingestion` SLA CHECK: Expected 340 hospital SFTP drops by 04:00. Received: 302 (missing: NWHS-014, SJMH-007, CAMH-023). These networks account for ~12% of May claims volume. Claim completeness for May will be below 99% SLA until files arrive. Last successful transfer from missing networks: 2026-05-19.',
        isAlert: true,
        isUrgent: false
      },
      {
        id: 'mf-msg-7',
        author: 'Kwame Asante',
        authorRole: 'Staff Data Engineer',
        avatar: '👨‍💻',
        channel: '#clinical-data-platform',
        time: '05:10',
        text: "Pushed a fix to the `build_cardiovascular_cohort` dbt model: moved the ICD-10 filter to a CTE before the aggregation step, and switched the Spark job to use Snowflake's native query pushdown instead of collecting results to the EMR driver. Re-ran in staging against a 5% sample — row count is 4.1M patients, runtime is 18 minutes. Full production rerun is queued for 05:30. Should complete by 06:00 if throughput holds.",
        isAlert: false,
        isUrgent: false
      },
      {
        id: 'mf-msg-8',
        author: 'Dr. Maya Chen',
        authorRole: 'VP of Clinical Data Engineering',
        avatar: '👩‍⚕️',
        channel: '#clinical-data-platform',
        time: '05:18',
        text: "Good work on the fix. For the missing claims from NWHS-014, SJMH-007, and CAMH-023 — please open CDAN-122 and reach out to the hospital network liaisons. We cannot publish the Q1 outcomes report next week with 12% of May claims missing. Also flag whether these three networks have had SFTP connectivity issues before — if this is a pattern we need to consider a push-based ingestion mechanism rather than relying on SFTP drops.",
        isAlert: false,
        isUrgent: false
      }
    ],

    jiraTickets: [
      {
        id: 'CDAN-118',
        type: 'hotfix',
        priority: 'P1',
        title: 'patient_cohort_build_v3 OOM — cohort filter applied post-aggregation on 500M row table',
        description:
          "The `build_cardiovascular_cohort` SQL step in the `patient_cohort_build_v3` Airflow DAG applies the ICD-10 cohort filter (condition_code IN range I20–I25) after a full-table GROUP BY aggregation of the 500M-row `patient_events` Snowflake table. This causes the Spark driver to collect 10.1GB of pre-filter aggregation results, exceeding the `spark.driver.maxResultSize` limit of 10GB. The correct approach is to push the cohort filter into a CTE before the aggregation, reducing the working set from 500M to approximately 4.2M rows. The fix also needs to leverage Snowflake's native query pushdown to avoid unnecessary data movement to the EMR cluster.",
        acceptanceCriteria: [
          'The `build_cardiovascular_cohort` dbt model is refactored to apply all cohort filters in a `WHERE` clause CTE before any aggregation',
          'The Spark job is updated to use Snowflake Connector pushdown mode (`autopushdown=on`) so aggregations execute in Snowflake rather than on the EMR driver',
          'A pre-flight row count assertion is added to the Airflow DAG: if the filtered cohort exceeds 50M rows, the job fails fast with a clear error requiring human review',
          'The Q2 cardiovascular cohort is produced and validated by 06:00 UTC with correct patient counts confirmed by Preethi Venkataraman'
        ],
        businessImpact: 'Cardiovascular research trial kickoff at 09:00 UTC is blocked. Delay would affect 14 clinical investigators and a $2.4M research grant timeline.',
        effort: '2h',
        tags: ['spark', 'oom', 'snowflake', 'patient-cohort', 'performance', 'production-incident']
      },
      {
        id: 'CDAN-122',
        type: 'bug',
        priority: 'P2',
        title: 'SFTP claims not received from 3 hospital networks — Q1 outcomes report at risk',
        description:
          'Networks NWHS-014, SJMH-007, and CAMH-023 have not delivered May X12 EDI 837 claims files since 2026-05-19. These three networks collectively represent 12% of the monthly claims volume. The Q1 Clinical Outcomes Report is due for publication on 2026-05-28 and requires at least 99% claims completeness for attribution accuracy. Late-arriving claims after the report publication date will require a report amendment, which requires sign-off from the CMO and notifies partner hospitals.',
        acceptanceCriteria: [
          'Network liaisons for NWHS-014, SJMH-007, and CAMH-023 are contacted within 4 hours with a request for ETA on the missing files',
          'Root cause is documented: determine whether the failure is on the hospital SFTP server, the MediFlow SFTP client, or a network/firewall issue',
          'If files are not received by 2026-05-24, a claims completeness gap note is prepared for the Q1 report with methodology impact assessment',
          'A Jira epic is opened to evaluate replacing SFTP pull ingestion with an HL7 FHIR push-based Claims API for these three networks'
        ],
        businessImpact: 'Q1 Clinical Outcomes Report with incomplete claims data may affect hospital network performance scores and quality incentive payments.',
        effort: '1d',
        tags: ['claims', 'sftp', 'data-completeness', 'late-arriving-data', 'hospital-networks']
      },
      {
        id: 'CDAN-115',
        type: 'tech-debt',
        priority: 'P2',
        title: 'Snowflake PHI Trusted Zone lacks row-level security policies — any analyst with TRUSTED_ANALYST role can query all patients',
        description:
          'The current Snowflake RBAC setup grants the `TRUSTED_ANALYST` role SELECT on all tables in the `PHI_TRUSTED` database without row-level filtering. Clinical researchers at partner institutions should only be able to query patient cohorts that they are enrolled in a specific IRB-approved study for. HIPAA\'s Minimum Necessary standard requires that access be limited to only the PHI needed for a given use. A row-level security policy using Snowflake Dynamic Data Masking and Row Access Policies must be implemented before the platform can be considered compliant with this standard.',
        acceptanceCriteria: [
          'A Snowflake Row Access Policy is created on `PHI_TRUSTED.patient_events` that filters rows to only patients in cohorts associated with the querying user\'s active IRB study IDs',
          'A Snowflake Dynamic Data Masking policy is applied to direct identifiers (name, DOB, address, SSN) for the `TRUSTED_ANALYST` role — full values visible only to `TRUSTED_PHI_ADMIN`',
          'Terraform code manages all policies in the `snowflake-iac` repository with peer review required for any policy changes',
          'A HIPAA compliance attestation document is drafted confirming Minimum Necessary compliance for the Snowflake layer'
        ],
        businessImpact: 'Active HIPAA Minimum Necessary compliance gap. Potential penalty up to $1.9M per violation category under HITECH if discovered in an OCR audit.',
        effort: '2d',
        tags: ['hipaa', 'snowflake', 'row-level-security', 'phi', 'compliance', 'terraform']
      },
      {
        id: 'CDAN-109',
        type: 'feature',
        priority: 'P3',
        title: 'Build a claims late-arrival compensation pipeline using event-time watermarks in Snowflake Dynamic Tables',
        description:
          'Insurance claims data follows a well-known late-arrival pattern in healthcare: claims can arrive 30–120 days after the date of service due to billing cycles, denial/resubmission workflows, and hospital administrative backlogs. Clinical outcome reports currently use a fixed T+7 day snapshot for claims attribution, which misses 8–15% of eventual claims. Snowflake Dynamic Tables with incremental refresh can model a watermark-based late arrival compensation scheme where the outcomes report is recalculated incrementally as late claims arrive, rather than requiring a full report rerun.',
        acceptanceCriteria: [
          'A Snowflake Dynamic Table `dyn.claims_attributed_outcomes` is created with an `INCREMENTAL` refresh strategy and a 90-day late-arrival window',
          'The downstream `clinical_outcomes_report` dbt model is refactored to read from the dynamic table rather than a static snapshot',
          'A Great Expectations test confirms that the completeness of claims attribution improves from 87% (T+7 fixed) to > 96% (T+90 rolling) for a representative 3-month test period',
          'Documentation explains the methodology change to clinical research consumers so they understand why historical figures may be revised'
        ],
        businessImpact: 'Improves clinical outcome attribution accuracy from ~87% to >96%, significantly improving the quality and credibility of research publications.',
        effort: '2d',
        tags: ['snowflake', 'dynamic-tables', 'late-arriving-data', 'claims', 'clinical-outcomes']
      },
      {
        id: 'CDAN-103',
        type: 'spike',
        priority: 'P3',
        title: 'Evaluate Snowpark Container Services for running patient cohort ML models natively in Snowflake',
        description:
          'Patient cohort builds that involve ML-based inclusion criteria (e.g., predicted 30-day readmission risk scores) currently run on a separate EMR cluster, requiring PHI to be temporarily exported from the Snowflake Trusted Zone to the EMR environment under a strict encryption-in-transit policy. This creates operational complexity and an expanded PHI surface area. Snowpark Container Services would allow Python ML models to run natively inside Snowflake\'s trust boundary, eliminating the EMR dependency for these workloads entirely.',
        acceptanceCriteria: [
          'A Snowpark Container Services container is deployed in the `PHI_TRUSTED` database running a Python environment with scikit-learn and the readmission risk model',
          'The readmission prediction step of the patient cohort build is migrated from EMR to Snowpark Container Services in a dev environment',
          'Latency and cost are benchmarked against the current EMR approach for a 5M-patient cohort',
          'HIPAA technical safeguard assessment is completed for the Snowpark Container Services execution environment and reviewed by Ravi Patel'
        ],
        businessImpact: 'Eliminates PHI egress from Snowflake for ML workloads, reducing HIPAA attack surface and removing dependency on EMR cluster management.',
        effort: '2d',
        tags: ['snowpark', 'snowflake', 'machine-learning', 'hipaa', 'spike', 'phi']
      }
    ],

    pipelines: [
      {
        id: 'mf-pipe-1',
        name: 'patient_cohort_build_v3 (Spark / EMR)',
        schedule: 'Daily 01:00',
        lastRun: '01:00 (FAILED 03:00)',
        status: 'failed',
        duration: '2h 00m (OOM)',
        records: '—',
        slaStatus: 'breached'
      },
      {
        id: 'mf-pipe-2',
        name: 'claims_edi_ingestion (Airflow)',
        schedule: 'Daily 04:00 (SFTP check)',
        lastRun: '04:00',
        status: 'warning',
        duration: '14m 02s',
        records: '302/340 networks received',
        slaStatus: 'breached'
      },
      {
        id: 'mf-pipe-3',
        name: 'ehr_fhir_snowpipe (Kafka → Snowflake)',
        schedule: 'Continuous',
        lastRun: '05:15',
        status: 'success',
        duration: 'Streaming (7 min avg lag)',
        records: '~8M events/day',
        slaStatus: 'ok'
      },
      {
        id: 'mf-pipe-4',
        name: 'lab_results_snowpipe (Kafka → Snowflake)',
        schedule: 'Continuous',
        lastRun: '05:15',
        status: 'success',
        duration: 'Streaming (9 min avg lag)',
        records: '~3.4M results/day',
        slaStatus: 'ok'
      },
      {
        id: 'mf-pipe-5',
        name: 'clinical_outcomes_report_dbt',
        schedule: 'Daily 06:00',
        lastRun: 'Pending cohort build',
        status: 'running',
        duration: '—',
        records: '—',
        slaStatus: 'at-risk'
      },
      {
        id: 'mf-pipe-6',
        name: 'icd_snomed_reference_refresh (Airflow)',
        schedule: 'Quarterly',
        lastRun: '2026-04-01',
        status: 'success',
        duration: '8m 44s',
        records: '281,200 code entries',
        slaStatus: 'ok'
      }
    ],

    architectureDecisions: [
      {
        id: 'mf-adr-1',
        title: 'How should we resolve Spark OOM on the 500M-row patient events table in the cohort build pipeline?',
        context:
          'The `patient_cohort_build_v3` job fails with a Spark driver OOM error because it collects aggregation results from the full 500M-row `patient_events` table to the EMR driver before applying cohort filters. The cardiovascular cohort represents only ~4.2M patients (~0.84% of the total). The job architecture predates the platform\'s growth to 500M records and was designed when the table was 80M rows. Three architectural approaches are available: fix the Spark query plan, move the computation to Snowflake natively, or adopt a partitioned cohort materialisation strategy.',
        options: [
          {
            label: 'Fix the Spark query plan: apply cohort filter before aggregation and enable Snowflake Connector pushdown',
            pros: [
              'Immediate fix achievable within hours — restores the 09:00 SLA for today',
              'No new infrastructure required — leverages existing EMR and Snowflake setup',
              'Snowflake pushdown offloads the heavy lifting to Snowflake\'s MPP engine where the data lives'
            ],
            cons: [
              'Does not address the fundamental architectural question of why Spark is being used for a query that Snowflake can execute natively',
              'As the table grows beyond 1B rows, driver memory constraints will recur for broader cohort queries'
            ],
            impact: { cost: 82, performance: 80, reliability: 78, complexity: 88 }
          },
          {
            label: 'Migrate cohort builds to pure Snowflake dbt models — eliminate the Spark/EMR layer entirely for cohort queries',
            pros: [
              'Snowflake\'s MPP engine scales to any table size without driver memory constraints',
              'Eliminates the PHI egress to EMR — cohort data never leaves Snowflake, simplifying HIPAA compliance',
              'dbt models are versioned, tested, and easier for clinical data scientists to understand than Spark jobs'
            ],
            cons: [
              'Cohort builds that include ML scoring steps (readmission risk) still require a compute environment outside Snowflake',
              'Requires rewriting existing Spark cohort logic into dbt SQL — effort estimated at 3–5 days per complex cohort'
            ],
            impact: { cost: 75, performance: 92, reliability: 90, complexity: 65 }
          },
          {
            label: 'Pre-materialise condition-stratified cohort base tables in Snowflake, updated nightly, so cohort builds query pre-filtered subsets',
            pros: [
              'Cohort build queries become trivially fast — they join against pre-filtered tables of 1–10M rows',
              'Multiple research teams can build cohorts simultaneously without contending for the full 500M row table'
            ],
            cons: [
              'Pre-materialisation adds storage cost and nightly compute time for building all stratified base tables',
              'Requires predicting which condition stratifications research teams will need — ad-hoc conditions still hit the full table'
            ],
            impact: { cost: 60, performance: 95, reliability: 85, complexity: 55 }
          }
        ],
        recommendedOption: 1,
        rationale:
          "Option A (fix the Spark query plan) must be executed immediately to unblock today's 09:00 SLA, but Option B (migrate to Snowflake dbt) is the correct long-term architecture. Running Spark on EMR to query data that already lives in Snowflake is an anti-pattern: it requires PHI to cross trust boundaries, adds EMR infrastructure costs, and introduces a driver memory ceiling that will be hit again as the dataset grows. Snowflake's native MPP engine is the right compute layer for SQL-based cohort queries. Option C (pre-materialised stratifications) is a valuable optimisation that should be built on top of the Snowflake-native architecture, not instead of it. The recommendation is: fix Spark query plan today (Option A), execute the Snowflake migration over the next sprint (Option B), then build pre-materialised base tables as a performance enhancement (Option C elements)."
      },
      {
        id: 'mf-adr-2',
        title: 'How should we handle the 30–120 day late-arrival window for insurance claims data?',
        context:
          'Insurance claims in healthcare routinely arrive 30–120 days after the date of service due to billing cycles, claim denials, and resubmission workflows. The current clinical outcomes report uses a T+7 day static snapshot, which captures approximately 87% of eventual claims. This causes attribution errors in clinical outcome calculations — patients who had services appear to lack follow-up care, inflating readmission rates and other quality metrics. Three approaches exist: extend the static snapshot window, implement a late-arrival compensation pipeline, or adopt an event-time streaming model.',
        options: [
          {
            label: 'Extend the static snapshot window from T+7 to T+90 days for all outcomes reports',
            pros: [
              'Simple to implement — change one configuration parameter',
              'Captures approximately 96% of eventual claims (vs 87% at T+7)'
            ],
            cons: [
              'Delays report publication by 83 days — clinicians and hospital networks need outcomes data much sooner',
              'Still misses the 4% of claims that arrive after 90 days',
              'Does not solve the problem for reports with contractual publication deadlines'
            ],
            impact: { cost: 85, performance: 55, reliability: 72, complexity: 95 }
          },
          {
            label: 'Implement a Snowflake Dynamic Table with incremental refresh for rolling claims attribution (T+90 window, recalculated as late claims arrive)',
            pros: [
              'Reports can be published on time using best-available data, and are automatically revised as late claims arrive',
              'Snowflake Dynamic Tables handle the incremental recalculation automatically — no custom micro-batch logic',
              'Research consumers get a versioned view of outcomes that improves over time'
            ],
            cons: [
              'Research consumers must understand that published figures may be revised — requires clear data versioning documentation',
              'Dynamic Table costs may be higher than static snapshots if refresh frequency is high'
            ],
            impact: { cost: 68, performance: 85, reliability: 88, complexity: 58 }
          },
          {
            label: 'Build a bi-temporal data model in Snowflake that records both the valid time (date of service) and transaction time (date claim was received)',
            pros: [
              'Enables point-in-time reproducibility — any report can be reproduced as it would have appeared on any given date',
              'Industry-standard approach for financial and healthcare data with late-arriving corrections',
              'Supports regulatory audit requirements for showing what was known when'
            ],
            cons: [
              'Significantly higher implementation complexity — bi-temporal queries are non-trivial for most data consumers',
              'Increases storage by approximately 2x for claims data',
              'Requires substantial data consumer education and tooling updates'
            ],
            impact: { cost: 45, performance: 75, reliability: 95, complexity: 20 }
          }
        ],
        recommendedOption: 1,
        rationale:
          "Snowflake Dynamic Tables (Option B) are the recommended approach for MediFlow's maturity level and timeline. Extending the static window (Option A) simply delays the problem and does not meet the timelines required by hospital network contracts. The bi-temporal model (Option C) is architecturally superior for long-term auditability and should be the target state architecture, but it requires 3–4x more engineering effort and significant consumer education — it should be planned as a 12-month roadmap item, not an immediate fix. Option B gives MediFlow publishable reports with documented revision windows, leverages Snowflake's native incremental computation, and provides a migration path toward bi-temporality later. The key operational requirement is that all report versions are stamped with a `data_as_of` timestamp so consumers understand the completeness level."
      },
      {
        id: 'mf-adr-3',
        title: 'How should PHI access be controlled for the Snowflake Trusted Zone as the research user base grows?',
        context:
          "MediFlow's research user base has grown from 12 internal analysts to over 140 users including external clinical researchers at partner institutions. The current RBAC model grants the `TRUSTED_ANALYST` role broad SELECT access to all PHI tables, with no row-level filtering by study or IRB approval. HIPAA's Minimum Necessary standard requires that each user only access the PHI needed for their specific approved research purpose. CDAN-115 has been open for 3 months and the compliance gap is growing as more external researchers are onboarded.",
        options: [
          {
            label: 'Implement Snowflake Row Access Policies and Dynamic Data Masking, managed via Terraform in the snowflake-iac repository',
            pros: [
              'Native Snowflake feature — policies are enforced at the query layer and cannot be bypassed by any client tool',
              'Terraform management ensures all policy changes go through peer review and are auditable in git history',
              'Row Access Policies can filter by IRB study ID stored in a Snowflake access mapping table, enabling fine-grained per-study access'
            ],
            cons: [
              'Initial implementation is complex — requires building and populating the IRB-to-patient mapping table and integrating with the IRB management system',
              'Policy misconfiguration could inadvertently block legitimate research access — requires thorough testing'
            ],
            impact: { cost: 68, performance: 82, reliability: 90, complexity: 45 }
          },
          {
            label: 'Create study-specific Snowflake database clones with pre-filtered data, refreshed weekly, accessible only to the relevant research team',
            pros: [
              'Simple mental model for researchers — each team has their own isolated environment',
              'Eliminates cross-study PHI exposure risk entirely',
              'Easy to audit and revoke access by dropping the clone'
            ],
            cons: [
              'Storage cost scales linearly with the number of active studies — at 50 studies, storage costs become significant',
              'Weekly refresh cycle means researchers work with data that is up to 7 days stale',
              'Clone management (provisioning, decommissioning, refresh) adds operational overhead for the data engineering team'
            ],
            impact: { cost: 35, performance: 65, reliability: 80, complexity: 55 }
          },
          {
            label: 'Implement attribute-based access control (ABAC) using an external policy engine (OPA / Open Policy Agent) that intercepts Snowflake queries',
            pros: [
              'Most flexible and expressive access control model — policies can be based on any combination of user attributes, data attributes, and context',
              'Single policy engine governs access across Snowflake and other platform components (S3, Kafka)',
              'Industry-standard approach for zero-trust data architectures'
            ],
            cons: [
              'Highest implementation complexity and ongoing operational burden — OPA is a new infrastructure component to maintain',
              'Query interception adds latency to all Snowflake queries',
              'Requires deep integration work with Snowflake\'s external OAuth / network policy system'
            ],
            impact: { cost: 40, performance: 60, reliability: 82, complexity: 18 }
          }
        ],
        recommendedOption: 0,
        rationale:
          "Snowflake's native Row Access Policies and Dynamic Data Masking (Option A) are the right choice for MediFlow. They enforce access controls at the Snowflake engine level — no client tool or query pattern can bypass them — which is the strongest possible HIPAA technical safeguard. The Terraform-managed approach in CDAN-115 ensures all policy changes are auditable, which is essential for HIPAA audit trail requirements. Study-specific clones (Option B) solve isolation but create a storage and operational scaling problem as MediFlow grows to 200+ active studies. OPA (Option C) is architecturally elegant but introduces an entirely new infrastructure dependency for a problem that Snowflake already has a native, well-tested solution for. The IRB mapping table integration is the most complex part of Option A but is also the most valuable — it directly ties data access to legally-approved research activities, which is exactly what HIPAA Minimum Necessary requires."
      }
    ]
  }
]
