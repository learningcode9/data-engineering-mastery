import {
  aiLearningPathTemplate,
  optionalTechnologiesTemplate,
  seniorAzureLearningPathTemplate,
} from './seniorAzurePath.js';

// ─── Legacy lesson content retained for hydration ─────────────────────────────
// Phase 1: all orientation guide lessons — never locked, always open.
// Phases 2–7: topic-based lessons, unlock sequentially as phases complete.

const legacyLearningPathPhases = [

  // ═══════════════════════════════════════════════════════════════════════════
  // PHASE 1 — Understand Data Engineering
  // All lessons are guide-type (no topicId) → always available, never locked.
  // ═══════════════════════════════════════════════════════════════════════════
  {
    id: 'lp-orientation',
    title: 'Phase 1 — Understand Data Engineering',
    shortTitle: 'Orientation',
    estimatedTime: '1–2 days',
    difficulty: 'Beginner',
    why: 'Before touching any tool, you need a mental model of the field — what engineers build, why it matters, and where you are headed.',
    companiesUse: 'Every tech company has data pipelines, warehouses, and orchestration. This phase gives you the language to talk about all of it.',
    interviewImportance: 'Interviewers always start with: "Tell me what a data engineer does." This phase prepares your answer.',
    modules: [
      {
        id: 'orientation-intro',
        title: 'Start Here',
        lessons: [
          {
            id: 'what-is-data-engineering',
            title: 'What is Data Engineering?',
            label: 'Orientation',
            difficulty: 'Beginner',
            type: 'guide',
            body: 'Learn what data engineers actually build, how pipelines support analytics and AI, and what this career looks like day to day.',
            guide: {
              headline: 'Data engineers build the infrastructure that turns raw data into trusted, usable products.',
              objectives: [
                'Understand what a data engineer does day-to-day',
                'Learn how data engineering differs from data science and analytics',
                'See where DE fits in a modern tech team',
                'Understand what a "data pipeline" means in practice',
              ],
              explanation: 'A data engineer\'s job is to make data available, reliable, and ready for use. While data scientists build models and analysts build dashboards, data engineers build the underlying systems that collect, clean, store, and deliver the data those people depend on. If data science is cooking, data engineering is farming — you ensure the ingredients exist, are fresh, and arrive on time.',
              analogy: {
                title: 'The Water Utility Analogy',
                text: 'Think of a city\'s water supply. Raw water comes from rivers and lakes — that\'s your source data (databases, APIs, logs). It gets filtered and treated — that\'s your transformation logic (SQL, Spark, Python). It travels through pipes — that\'s your pipeline (ADF, Airflow, Glue). It arrives clean at the tap — that\'s your data warehouse or dashboard. A data engineer designs and maintains the entire water system, not just the tap.',
              },
              keyPoints: [
                { title: 'You build pipelines', body: 'A pipeline is a series of steps that moves data from a source (API, database, file) to a destination (warehouse, lake, dashboard) — automatically and reliably.' },
                { title: 'You own reliability', body: 'Pipelines break. Data engineers add retries, alerts, data quality checks, and monitoring so failures are caught before analysts notice missing data.' },
                { title: 'You think in systems', body: 'Good DEs think about data flow end to end: ingestion → transformation → storage → serving. Every decision has downstream consequences.' },
                { title: 'You enable everyone else', body: 'Without solid DE work, data scientists can\'t train models, analysts can\'t build dashboards, and businesses can\'t make data-driven decisions.' },
              ],
              whyCompaniesUse: 'Every company with more than a few hundred users generates data that needs to be collected, cleaned, and made queryable. A single broken pipeline can cause wrong financial reports, failed ML predictions, or missed SLAs — which is why companies hire dedicated data engineers.',
              interviewNote: '"Walk me through what a data engineer does" is the most common opening question. Answer with: ingest → transform → load → serve, plus mention reliability and monitoring.',
              recap: [
                'Data engineers build pipelines that move and transform data from sources to destinations',
                'The role focuses on reliability, scalability, and correctness — not analysis or modelling',
                'Core tools: Python, SQL, Spark, cloud platforms (Azure/AWS), and orchestration tools like Airflow',
              ],
              quiz: [
                {
                  q: 'What is the primary responsibility of a data engineer?',
                  options: [
                    'Building and maintaining reliable data pipelines',
                    'Training machine learning models',
                    'Creating business intelligence dashboards',
                    'Managing database servers',
                  ],
                  answer: 0,
                  explanation: 'Data engineers focus on pipeline infrastructure — moving, transforming, and delivering data reliably. Data scientists train models; analysts build dashboards.',
                },
                {
                  q: 'A data pipeline can be described as:',
                  options: [
                    'A database index that speeds up queries',
                    'A series of automated steps that moves and transforms data from source to destination',
                    'A Python library for machine learning',
                    'A type of SQL JOIN',
                  ],
                  answer: 1,
                  explanation: 'A pipeline is a sequence of automated steps — extract from source, transform/clean, load to destination. Think assembly line, not a single query.',
                },
              ],
            },
            nextLesson: { id: 'what-is-a-pipeline', title: 'What is a Data Pipeline?', reason: 'Now that you know the role, learn exactly how pipelines are structured — the core unit of DE work.' },
          },

          {
            id: 'what-is-a-pipeline',
            title: 'What is a Data Pipeline?',
            label: 'Orientation',
            difficulty: 'Beginner',
            type: 'guide',
            body: 'A data pipeline is the core unit of work in data engineering. Learn how pipelines are structured, what each stage does, and what makes them reliable.',
            guide: {
              headline: 'A data pipeline is an automated system that extracts, transforms, and delivers data on a schedule.',
              objectives: [
                'Understand the three stages of every pipeline: Extract, Transform, Load',
                'Learn what triggers a pipeline (schedules, events, APIs)',
                'Understand what makes a pipeline production-ready',
                'See a real-world pipeline example end to end',
              ],
              explanation: 'Every pipeline has three phases: Extract (read data from a source), Transform (clean, filter, join, aggregate), and Load (write to a destination). Some pipelines are simple (copy a file every hour), others are complex (join 5 data sources, apply business logic, write to 3 destinations). What makes them "data engineering" is that they run unattended, reliably, at scale.',
              analogy: {
                title: 'The Factory Assembly Line',
                text: 'Imagine a car factory. Raw steel and parts arrive at the start (extract from sources). Robots shape, weld, and paint them through different stations (transform: clean, join, aggregate). A finished car rolls off at the end (load into warehouse or dashboard). Now imagine that factory running 24/7, automatically, with alerts if any station jams. That\'s a production data pipeline.',
              },
              keyPoints: [
                { title: 'Extract', body: 'Read raw data from sources: databases, REST APIs, CSV files, Kafka topics, event logs. Use connectors like Fivetran, or write custom Python scripts.' },
                { title: 'Transform', body: 'Apply business logic: clean nulls, standardise formats, join tables, calculate metrics, apply filters. Done with SQL, dbt, Spark, or pandas.' },
                { title: 'Load', body: 'Write the result to a destination: a data warehouse (Snowflake, BigQuery), a data lake (S3, ADLS), a database, or a streaming sink.' },
                { title: 'Orchestration', body: 'A scheduler (Airflow, ADF, Prefect) triggers the pipeline, monitors each step, retries on failure, and sends alerts if something goes wrong.' },
              ],
              whyCompaniesUse: 'Without pipelines, every analyst would write one-off scripts to pull data manually — no consistency, no reliability, no scale. Pipelines standardise data delivery and let teams trust that their dashboards reflect reality.',
              interviewNote: 'When asked to "design a pipeline," always walk through: source → extract → transform → load → destination, then add: scheduling, error handling, and data quality checks.',
              recap: [
                'Every pipeline follows Extract → Transform → Load (ETL) or Extract → Load → Transform (ELT)',
                'Pipelines run on schedules or triggers, unattended, and must handle failures gracefully',
                'Orchestration tools (Airflow, ADF) manage pipeline execution, retries, and monitoring',
              ],
              quiz: [
                {
                  q: 'Which stage of a pipeline is responsible for cleaning nulls and joining tables?',
                  options: ['Extract', 'Transform', 'Load', 'Orchestrate'],
                  answer: 1,
                  explanation: 'Transform is where business logic runs: cleaning, joining, aggregating, filtering. Extract reads raw data; Load writes the result.',
                },
                {
                  q: 'What does an orchestration tool like Airflow do?',
                  options: [
                    'Stores data in a warehouse',
                    'Trains machine learning models',
                    'Schedules pipeline runs, monitors steps, and handles retries',
                    'Writes SQL transformation queries',
                  ],
                  answer: 2,
                  explanation: 'Orchestration tools manage the when and how of pipeline execution — triggering runs, tracking dependencies, retrying failures, and alerting on errors.',
                },
              ],
            },
            nextLesson: { id: 'etl-vs-elt-orientation', title: 'ETL vs ELT', reason: 'Pipelines follow one of two patterns: ETL or ELT. Understanding the difference shapes every design decision you\'ll make.' },
          },
        ],
      },

      {
        id: 'orientation-concepts',
        title: 'Core Concepts',
        lessons: [
          {
            id: 'etl-vs-elt-orientation',
            title: 'ETL vs ELT',
            label: 'Concept',
            difficulty: 'Beginner',
            type: 'guide',
            body: 'Two dominant patterns for moving data. ETL transforms before loading; ELT loads first and transforms inside the warehouse. Learn when to use each.',
            guide: {
              headline: 'ETL transforms data before it lands. ELT loads raw data first and transforms it later — inside the warehouse.',
              objectives: [
                'Understand the difference between ETL and ELT',
                'Know when each pattern is the right choice',
                'Understand why ELT has become the modern default',
                'Learn where tools like dbt fit in',
              ],
              explanation: 'ETL (Extract, Transform, Load) was the default for decades: transform the data in a separate layer before it reaches the warehouse. ELT (Extract, Load, Transform) emerged with cloud warehouses: load raw data first, then transform it using the warehouse\'s own SQL engine. ELT preserves raw data, enables re-processing, and is cheaper to maintain.',
              analogy: {
                title: 'Cooking at Home vs a Restaurant Kitchen',
                text: 'ETL is like preparing a meal at home before delivering it to a guest. You cook everything first (transform), then deliver the finished dish (load). ELT is like a restaurant that receives raw ingredients (load), stores them in the kitchen, and cooks to order (transform). The restaurant model is more flexible — you can make any dish from the same ingredients, and nothing is wasted.',
              },
              keyPoints: [
                { title: 'ETL: Transform first', body: 'Data is cleaned and shaped in a staging layer before entering the warehouse. Good for strict PII masking, small datasets, or when raw data must never touch the warehouse.' },
                { title: 'ELT: Load first', body: 'Raw data lands in the lake or warehouse as-is. SQL/dbt runs transformation afterwards. Modern default because compute is cheap and raw data is preserved for reprocessing.' },
                { title: 'The "T" in ELT is dbt', body: 'dbt (data build tool) runs SQL transformations inside the warehouse with testing, documentation, and lineage — it\'s the most popular ELT transformation layer.' },
                { title: 'ELT is the default today', body: 'Cloud warehouses (Snowflake, BigQuery, Redshift) have massive compute that scales cheaply. ELT offloads the heavy transformation there instead of custom Python.' },
              ],
              whyCompaniesUse: 'ELT lets teams change transformation logic without re-ingesting data. Raw data is always available for new use cases, audits, or bug fixes. ETL still makes sense for PII compliance or when warehouse storage is very expensive.',
              interviewNote: '"What\'s the difference between ETL and ELT?" is a universal interview question. Always mention: data preservation, when to use each, and where dbt fits.',
              recap: [
                'ETL transforms before loading — good for PII, strict schemas, or legacy systems',
                'ELT loads raw data first and transforms inside the warehouse — modern default with cloud platforms',
                'dbt is the transformation layer for ELT: SQL models, testing, and data lineage in one tool',
              ],
              quiz: [
                {
                  q: 'What is the main advantage of ELT over ETL?',
                  options: [
                    'It uses less storage',
                    'Raw data is preserved and can be re-transformed without re-ingesting from the source',
                    'It is faster on local machines',
                    'It does not require SQL',
                  ],
                  answer: 1,
                  explanation: 'ELT preserves raw data in the warehouse. If transformation logic changes or has a bug, you can re-run it without pulling data from the source system again.',
                },
                {
                  q: 'When would you still choose ETL over ELT?',
                  options: [
                    'When you have very large datasets',
                    'When you use Snowflake or BigQuery',
                    'When data contains PII that must be masked before landing in the warehouse',
                    'When you want to use dbt',
                  ],
                  answer: 2,
                  explanation: 'ETL is still correct when raw data must never touch the warehouse due to compliance or PII concerns. The transformation happens in a separate, controlled layer first.',
                },
              ],
            },
            nextLesson: { id: 'batch-vs-streaming-orientation', title: 'Batch vs Streaming', reason: 'Pipelines run in two fundamentally different modes: batch (scheduled chunks) vs streaming (real-time). Understanding this shapes your architecture.' },
          },

          {
            id: 'batch-vs-streaming-orientation',
            title: 'Batch vs Streaming',
            label: 'Concept',
            difficulty: 'Beginner',
            type: 'guide',
            body: 'Most data moves in one of two modes: batch (scheduled bulk loads) or streaming (real-time event processing). Learn the difference and when each fits.',
            guide: {
              headline: 'Batch processes data in scheduled chunks. Streaming processes data as it arrives — event by event, in real time.',
              objectives: [
                'Understand batch processing: what it is and when it\'s used',
                'Understand streaming: what it is and when it\'s used',
                'Know the latency and complexity trade-offs',
                'Learn which most companies rely on day-to-day',
              ],
              explanation: 'Batch processing waits until data accumulates over a time window (hourly, daily), then processes it all at once. It\'s simpler, cheaper, and sufficient for most reporting. Streaming processes each event as it arrives — milliseconds of latency. It\'s needed for fraud detection, real-time dashboards, and operational alerts. Most companies use both: batch for historical reporting and streaming for operational events.',
              analogy: {
                title: 'Mail vs Phone Calls',
                text: 'Batch is like postal mail: letters accumulate in the mailbox all day, then a postal worker picks them all up at 5pm and delivers them the next morning. Streaming is like a phone call: the message is delivered the instant it\'s sent, with no waiting. Mail is cheaper and simpler; phone calls are immediate but require both parties to be ready.',
              },
              keyPoints: [
                { title: 'Batch: scheduled and simple', body: 'Runs on a schedule (every hour, every night). Processes a bounded dataset (yesterday\'s orders). Simpler to build, test, and debug. Right for 80% of DE workloads.' },
                { title: 'Streaming: continuous and complex', body: 'Processes each event as it arrives. Latency in milliseconds. Required for fraud detection, real-time alerts, or live dashboards. Harder to build and test.' },
                { title: 'Micro-batch is a middle ground', body: 'Spark Structured Streaming and Flink can process data in small batches (every 30 seconds). You get near-real-time latency with some batch simplicity.' },
                { title: 'Most workloads are batch', body: 'Even at large companies, the majority of pipelines run on a schedule. Start with batch; add streaming only when the business requires low latency.' },
              ],
              whyCompaniesUse: 'Batch drives nightly warehouse loads, weekly reports, and ML feature pipelines. Streaming drives fraud alerts, recommendation engines, and real-time customer dashboards. Every mature data platform has both.',
              interviewNote: '"When would you use streaming vs batch?" is asked constantly. Answer: streaming when latency matters (fraud, alerts, live dashboards); batch for everything else.',
              recap: [
                'Batch: processes a window of accumulated data on a schedule — simpler, cheaper, right for most workloads',
                'Streaming: processes each event as it arrives with millisecond latency — needed for fraud, alerts, real-time systems',
                'Most companies rely on batch for reporting and streaming for operational/real-time use cases',
              ],
              quiz: [
                {
                  q: 'A nightly warehouse load that processes the previous day\'s orders is an example of:',
                  options: ['Streaming', 'Batch processing', 'Micro-batch', 'Real-time event processing'],
                  answer: 1,
                  explanation: 'Processing a bounded time window on a schedule is batch. The data accumulates all day and is processed together at a scheduled time.',
                },
                {
                  q: 'Which use case requires streaming rather than batch?',
                  options: [
                    'Monthly financial reporting',
                    'Weekly email digest for subscribers',
                    'Real-time fraud detection on payment transactions',
                    'Daily ML model retraining',
                  ],
                  answer: 2,
                  explanation: 'Fraud detection requires acting on a transaction within milliseconds of it occurring. A nightly batch job would be hours too late. Streaming is the only viable approach.',
                },
              ],
            },
            nextLesson: { id: 'warehouse-vs-lake-orientation', title: 'Data Warehouses vs Data Lakes', reason: 'Data lands somewhere — warehouse or lake. Understanding the difference is essential before you design any storage layer.' },
          },

          {
            id: 'warehouse-vs-lake-orientation',
            title: 'Data Warehouses vs Data Lakes',
            label: 'Concept',
            difficulty: 'Beginner',
            type: 'guide',
            body: 'Where does your data actually live? Learn the difference between warehouses (structured, SQL-optimised) and lakes (raw, flexible, cheap), and why modern companies use both.',
            guide: {
              headline: 'Warehouses store structured, query-optimised data. Lakes store everything raw, cheaply, at any scale.',
              objectives: [
                'Understand what a data warehouse is and what it\'s optimised for',
                'Understand what a data lake is and why it exists',
                'Learn about the modern lakehouse architecture',
                'Know which tools belong to each category',
              ],
              explanation: 'A data warehouse is a structured, SQL-queryable database designed for analytics (Snowflake, BigQuery, Redshift). It stores clean, modelled data and serves dashboards and reports fast. A data lake is cheap object storage (S3, Azure Data Lake Storage) that holds raw data in any format — JSON, CSV, Parquet, images. It scales to petabytes cheaply. Modern companies use a lakehouse — a data lake with a table format layer (Delta Lake) that adds ACID transactions and SQL on top.',
              analogy: {
                title: 'Data Lake vs Warehouse',
                text: 'A data warehouse is like a well-organised library: every book (table) is catalogued, indexed, and in the right place. Searching is fast and reliable. A data lake is like a giant warehouse full of boxes: you can store anything — books, equipment, raw materials — cheaply and at scale, but finding what you need takes more work. The lakehouse is a library built inside a warehouse: cheap storage with library-grade organisation on top.',
              },
              keyPoints: [
                { title: 'Data Warehouse', body: 'Structured, SQL-optimised, fast queries. Examples: Snowflake, BigQuery, Azure Synapse, Redshift. Used for BI dashboards and self-service analytics. Expensive per TB stored.' },
                { title: 'Data Lake', body: 'Raw object storage (S3, ADLS Gen2). Any file format. Very cheap at scale. Used for raw data landing, ML feature stores, archiving. Requires more work to query.' },
                { title: 'Lakehouse', body: 'Delta Lake, Iceberg, or Hudi adds ACID transactions and SQL table semantics on top of a data lake. You get cheap storage AND reliable, SQL-queryable tables. Databricks and Snowflake both support this pattern.' },
                { title: 'Medallion Architecture', body: 'Bronze (raw) → Silver (cleaned) → Gold (modelled). Raw data lands in Bronze cheaply, gets cleaned into Silver, and becomes trusted Gold tables used for analytics. Standard in Databricks environments.' },
              ],
              whyCompaniesUse: 'Warehouses are expensive. Lakes are unstructured. The lakehouse gives companies the best of both: cheap petabyte-scale storage with reliable, fast, SQL-queryable tables on top.',
              interviewNote: '"What\'s the difference between a data lake and a data warehouse?" is asked in 90% of DE interviews. Know the trade-offs and mention Delta Lake / lakehouse as the modern answer.',
              recap: [
                'Warehouse: structured, SQL, fast, expensive — Snowflake, BigQuery, Redshift',
                'Lake: raw, cheap, any format, flexible — S3, ADLS Gen2',
                'Lakehouse: Delta Lake adds ACID + SQL on top of a lake — modern standard, used in Databricks/Azure environments',
              ],
              quiz: [
                {
                  q: 'A data lake is best described as:',
                  options: [
                    'A structured SQL database optimised for fast analytics queries',
                    'Cheap object storage that holds raw data in any format at scale',
                    'A type of relational database with foreign key constraints',
                    'A real-time streaming platform',
                  ],
                  answer: 1,
                  explanation: 'A data lake (S3, ADLS) stores raw data cheaply in any format. It\'s not optimised for queries by default — that\'s what a table format like Delta Lake adds on top.',
                },
                {
                  q: 'What does the Medallion Architecture\'s Bronze layer contain?',
                  options: [
                    'Fully modelled, aggregated data for BI dashboards',
                    'Cleaned and validated data with business rules applied',
                    'Raw, unprocessed data exactly as received from the source',
                    'ML model outputs and feature tables',
                  ],
                  answer: 2,
                  explanation: 'Bronze is the raw landing zone — data arrives exactly as-is from the source. No cleaning, no schema enforcement. Silver cleans it; Gold models it.',
                },
              ],
            },
            nextLesson: { id: 'modern-data-stack-orientation', title: 'The Modern Data Stack', reason: 'Now that you know warehouses and lakes, see the full toolchain: which tools companies actually use and how they connect.' },
          },

          {
            id: 'modern-data-stack-orientation',
            title: 'The Modern Data Stack',
            label: 'Concept',
            difficulty: 'Beginner',
            type: 'guide',
            body: 'A tour of the tools companies use in production: ingestion, transformation, storage, orchestration, and BI. Know the landscape before you learn each tool.',
            guide: {
              headline: 'The modern data stack is a collection of cloud-native tools, each doing one job well, connected by pipelines.',
              objectives: [
                'Understand the five layers of a modern data platform',
                'Recognise the most common tools in each layer',
                'See how tools connect into an end-to-end architecture',
                'Know which tools you\'ll encounter as a data engineer',
              ],
              explanation: 'The modern data stack replaced the old monolithic data warehouse with a set of specialised cloud tools: Fivetran ingests data, Snowflake stores it, dbt transforms it, Airflow orchestrates it, and Tableau visualises it. Each tool does one thing well and integrates with the others via standard interfaces (SQL, REST APIs, Python SDKs). You don\'t need to know all of them immediately — but you need a map of the landscape.',
              analogy: {
                title: 'A Restaurant Kitchen',
                text: 'A restaurant kitchen has specialised stations: one chef handles raw ingredients (ingestion), another handles prep (transformation), a cold store handles storage, a chef de cuisine orchestrates the whole service (orchestration), and the front-of-house serves the finished dish (BI/reporting). Each person is specialised. The "modern data stack" works the same way — each tool is a specialist, not a generalist.',
              },
              keyPoints: [
                { title: 'Ingestion', body: 'Tools that move raw data from sources to your lake/warehouse. Managed connectors: Fivetran, Airbyte, Stitch. Custom code: Python + APIs, ADF, AWS Glue.' },
                { title: 'Storage & Compute', body: 'Where data lives and gets queried. Cloud warehouses: Snowflake, BigQuery, Azure Synapse. Lakehouses: Databricks (Delta Lake), Azure Data Lake + Synapse.' },
                { title: 'Transformation', body: 'Turning raw data into analytics-ready tables. dbt is the standard SQL-based transformer. PySpark for large-scale distributed transformation.' },
                { title: 'Orchestration', body: 'What schedules and monitors pipelines. Apache Airflow is the most common. Alternatives: Prefect, Dagster, Azure Data Factory, AWS Step Functions.' },
              ],
              whyCompaniesUse: 'The modular stack is faster to build (use managed tools), cheaper to maintain (no custom servers), and easier to hire for (standard tools). Companies can swap any layer independently without rebuilding the whole platform.',
              interviewNote: 'Know the major tools in each layer. Interviewers often ask: "What does your current data stack look like?" or "Which tools have you used for X?" Map your experience to the five layers.',
              recap: [
                'Ingestion: Fivetran, Airbyte, ADF, Glue — move raw data from sources to storage',
                'Storage: Snowflake, BigQuery, Databricks, S3/ADLS — where data lives',
                'Transformation: dbt (SQL), PySpark (distributed) — turn raw into analytics-ready',
                'Orchestration: Airflow, ADF, Prefect — schedule, monitor, retry pipelines',
              ],
              quiz: [
                {
                  q: 'Which layer of the modern data stack does dbt belong to?',
                  options: ['Ingestion', 'Storage', 'Transformation', 'Orchestration'],
                  answer: 2,
                  explanation: 'dbt runs SQL transformations inside the warehouse. It\'s the "T" in ELT — it belongs to the transformation layer, not ingestion or storage.',
                },
                {
                  q: 'A company uses Fivetran → Snowflake → dbt → Tableau. What is missing for production reliability?',
                  options: [
                    'A data lake',
                    'An orchestration tool like Airflow to schedule and monitor pipeline runs',
                    'A CDC connector',
                    'A machine learning platform',
                  ],
                  answer: 1,
                  explanation: 'Fivetran ingests, Snowflake stores, dbt transforms, Tableau visualises — but nothing is orchestrating the schedule, monitoring failures, or retrying errors. An orchestration layer (Airflow, Prefect, ADF) is needed.',
                },
              ],
            },
            nextLesson: null,
          },
        ],
      },
    ],
  },

  // ═══════════════════════════════════════════════════════════════════════════
  // PHASE 2 — SQL Foundations
  // ═══════════════════════════════════════════════════════════════════════════
  {
    id: 'lp-sql',
    title: 'Phase 2 — SQL Foundations',
    shortTitle: 'SQL',
    estimatedTime: '2–3 weeks',
    difficulty: 'Beginner',
    why: 'SQL is the universal language of data. Every pipeline, warehouse, and BI tool uses it. You cannot do data engineering without it.',
    companiesUse: 'SQL warehouses, analytical queries, pipeline validation, dbt models, and ad-hoc debugging.',
    interviewImportance: 'Critical. SQL appears in every single DE interview — from entry level to senior.',
    modules: [
      {
        id: 'sql-core',
        title: 'Core SQL',
        lessons: [
          {
            id: 'sql-select-basics',
            title: 'SELECT, WHERE & ORDER BY',
            topicId: 'sql',
            label: 'Beginner SQL',
            difficulty: 'Beginner',
            body: 'Read data from tables, filter rows, and sort results. The foundation of every SQL query you will write.',
          },
          {
            id: 'sql-aggregations',
            title: 'Aggregations & GROUP BY',
            topicId: 'sql',
            label: 'Beginner SQL',
            difficulty: 'Beginner',
            body: 'Count, sum, average, and group data. Aggregation is how raw rows become meaningful business metrics.',
          },
          {
            id: 'sql-joins',
            title: 'Joins — INNER, LEFT, RIGHT',
            topicId: 'sql',
            label: 'Intermediate SQL',
            difficulty: 'Beginner to Intermediate',
            body: 'Combine data from multiple tables. JOINs are used in virtually every real-world query and pipeline.',
          },
          {
            id: 'sql-window-functions',
            title: 'Window Functions',
            topicId: 'sql',
            label: 'Intermediate SQL',
            difficulty: 'Intermediate',
            body: 'ROW_NUMBER, RANK, LAG, LEAD — window functions let you calculate across rows without collapsing the result set.',
            guide: {
              headline: 'Window functions compute aggregates, rankings, and offsets across rows related to the current row — without collapsing the result like GROUP BY.',
              objectives: [
                'Understand what the OVER() clause does and how it defines a "window"',
                'Know when to use ROW_NUMBER vs RANK vs DENSE_RANK',
                'Use LAG/LEAD to access adjacent row values',
                'Write running totals and moving averages with SUM/AVG OVER',
                'Apply window functions to real deduplication and ranking problems',
              ],
              explanation: 'A window function applies a calculation across a set of rows related to the current row, defined by the OVER() clause. Unlike GROUP BY which collapses many rows into one, window functions add a computed column alongside every original row. The window is defined by PARTITION BY (which groups to separate) and ORDER BY (how rows are ordered within each group). This combination unlocks patterns impossible with GROUP BY alone: running totals, row-level rankings, period-over-period comparisons, and deduplication.',
              analogy: {
                title: 'Leaderboard Without Collapsing',
                text: 'Imagine a sales leaderboard for 10 reps across 3 regions. GROUP BY region gives you total sales per region — you lose the individual rep rows. A window function gives you every rep\'s row PLUS their rank within their region in a new column. The individual data is preserved; the group context is added alongside it. That\'s exactly what OVER(PARTITION BY region ORDER BY sales DESC) does.',
              },
              keyPoints: [
                { title: 'ROW_NUMBER()', body: 'Assigns a unique sequential integer to each row within the partition. Ties are broken arbitrarily. Use for deduplication: CTE with ROW_NUMBER() → filter WHERE rn = 1 to keep one row per group. This is the most common production deduplication pattern.' },
                { title: 'RANK() and DENSE_RANK()', body: 'RANK: tied rows get the same rank, and the next rank skips (1, 1, 3). DENSE_RANK: tied rows get the same rank, no gaps (1, 1, 2). Use DENSE_RANK when you need exactly the top-N items and ties should be treated equally. Use RANK when gaps in the sequence are acceptable.' },
                { title: 'LAG() and LEAD()', body: 'LAG(col, n) returns the value from n rows before the current row. LEAD(col, n) returns the value from n rows after. Used for period-over-period comparisons: LAG(revenue) gives last period\'s revenue on the same row, enabling revenue_change = revenue - LAG(revenue) in a single query without self-joins.' },
                { title: 'SUM/AVG OVER ORDER BY', body: 'When ORDER BY is included in OVER(), aggregate functions become cumulative. SUM(amount) OVER (ORDER BY date) gives a running total. AVG(amount) OVER (ORDER BY date ROWS BETWEEN 6 PRECEDING AND CURRENT ROW) gives a 7-day rolling average. These replace expensive correlated subqueries.' },
              ],
              whyCompaniesUse: 'Window functions power the Gold layer aggregations in every mature data warehouse. Running totals in financial dashboards, session analysis for clickstreams, deduplication in MERGE pipelines, period-over-period KPIs, and customer ranking by lifetime value all require window functions. Any DE who cannot write them fluently is limited to beginner-level query work.',
              interviewNote: 'Window functions appear in nearly every SQL-heavy DE interview. Classic questions: (1) "Remove duplicates keeping the most recent row" — ROW_NUMBER() OVER (PARTITION BY id ORDER BY updated_at DESC), CTE, WHERE rn = 1. (2) "Rank products by revenue per category" — RANK() OVER (PARTITION BY category ORDER BY revenue DESC). (3) "Calculate a 30-day rolling average" — AVG(amount) OVER (PARTITION BY user_id ORDER BY date ROWS BETWEEN 29 PRECEDING AND CURRENT ROW). Know these three patterns cold.',
              commonMistakes: [
                { mistake: 'Using GROUP BY when you need per-row results AND an aggregate', why: 'GROUP BY collapses rows — if you need each row\'s data alongside a group-level calculation, you\'ve chosen the wrong tool.', fix: 'Use a window function: AVG(salary) OVER (PARTITION BY department) adds the department average to every employee row without collapsing.' },
                { mistake: 'Confusing ROW_NUMBER and RANK for deduplication', why: 'RANK can assign the same number to two rows, so WHERE rank = 1 might return multiple rows per group — defeating the purpose of deduplication.', fix: 'Always use ROW_NUMBER() for deduplication — it assigns unique numbers even to ties, so WHERE rn = 1 always returns exactly one row per partition.' },
                { mistake: 'Forgetting that ORDER BY in OVER is not the same as the outer ORDER BY', why: 'The ORDER BY inside OVER() defines the ordering within the window for the calculation. The outer ORDER BY controls the final result order. They can differ.', fix: 'Keep them separate and intentional: RANK() OVER (PARTITION BY dept ORDER BY salary DESC) for ranking, ORDER BY dept, rank for display.' },
              ],
              performanceTips: [
                'Window functions sort data internally for each partition. On large tables, a covering index on (partition_col, order_col) can eliminate this sort step entirely.',
                'When using ROW_NUMBER for deduplication at scale in Spark, partition by the dedup key with repartition(n, "key") before the window to reduce shuffle. The window\'s PARTITION BY then operates on data already co-located.',
                'In BigQuery and Snowflake, window functions can scan the full table per partition if the window frames are unbounded. Use explicit ROWS BETWEEN UNBOUNDED PRECEDING AND CURRENT ROW rather than relying on defaults.',
                'Correlated subqueries for running totals are O(n²) — exponentially slower than window functions which are O(n log n). Always prefer SUM OVER to a subquery-based running total on large tables.',
              ],
              bestPractices: [
                'Always name the window expression clearly: ROW_NUMBER() OVER (...) AS rn, not just row_num or r — rn is the convention.',
                'Use CTEs to separate window function logic from outer filter logic. This is more readable and easier to debug.',
                'Verify partition cardinality before running window functions on large data. If PARTITION BY generates millions of single-row partitions, the window function adds overhead with no benefit.',
                'In dbt, document window functions in the model description. Future maintainers need to understand that a Gold model uses ROW_NUMBER deduplication and which field drives the ORDER BY.',
              ],
              recap: [
                'Window functions compute across related rows using OVER(PARTITION BY ... ORDER BY ...) without collapsing them',
                'ROW_NUMBER: unique rank (use for dedup). RANK: tied ranks with gaps. DENSE_RANK: tied ranks without gaps.',
                'LAG/LEAD: access adjacent rows. SUM/AVG OVER ORDER BY: running totals and moving averages.',
                'Classic interview pattern: CTE + ROW_NUMBER → WHERE rn = 1 for deduplication.',
              ],
              quiz: [
                {
                  q: 'You need to remove duplicate order records, keeping the most recent row per order_id. Which window function should you use?',
                  options: ['RANK() OVER (PARTITION BY order_id ORDER BY updated_at DESC)', 'ROW_NUMBER() OVER (PARTITION BY order_id ORDER BY updated_at DESC)', 'DENSE_RANK() OVER (PARTITION BY order_id ORDER BY updated_at DESC)', 'SUM(1) OVER (PARTITION BY order_id)'],
                  answer: 1,
                  explanation: 'ROW_NUMBER always assigns unique sequential integers — rn = 1 always returns exactly one row per order_id. RANK and DENSE_RANK can return the same number for tied rows, potentially keeping duplicates.',
                },
                {
                  q: 'What does SUM(amount) OVER (ORDER BY order_date) return?',
                  options: ['Total amount for the entire table', 'Average amount per day', 'A running cumulative total of amount, ordered by date', 'Amount partitioned by date'],
                  answer: 2,
                  explanation: 'When ORDER BY is used inside OVER without PARTITION BY, the window expands from the first row to the current row — producing a running total. Each row shows the sum of all amounts from the start up to and including that row.',
                },
                {
                  q: 'You want to show each employee\'s salary alongside the average salary for their department. What is the correct approach?',
                  options: ['GROUP BY department, then JOIN back to employees', 'AVG(salary) OVER (PARTITION BY department) — window function alongside each row', 'A correlated subquery in the SELECT clause', 'Both B and C work, but B is faster'],
                  answer: 3,
                  explanation: 'Both window functions and correlated subqueries produce the same result, but window functions are O(n log n) while correlated subqueries are O(n²). At scale, the difference is dramatic. B is the production-grade answer.',
                },
              ],
            },
            nextLesson: { id: 'advanced-sql', title: 'Advanced SQL Patterns', reason: 'Window functions unlock the next level — CTEs, subqueries, and advanced query patterns used daily in production.' },
          },
        ],
      },
    ],
  },

  // ═══════════════════════════════════════════════════════════════════════════
  // PHASE 3 — Engineering Foundations
  // ═══════════════════════════════════════════════════════════════════════════
  {
    id: 'lp-engineering-foundations',
    title: 'Phase 3 — Engineering Foundations',
    shortTitle: 'Engineering Basics',
    estimatedTime: '3–4 weeks',
    difficulty: 'Beginner',
    why: 'Data engineers write code. Python scripts, shell commands, version control, and APIs are daily tools — you need fluency in all of them.',
    companiesUse: 'Python scripts for ingestion and transformation, Git for version control, CLI for server management, REST APIs for data extraction.',
    interviewImportance: 'High. Python coding screens, Git workflow questions, and API design questions are common.',
    modules: [
      {
        id: 'code-fundamentals',
        title: 'Code Fundamentals',
        lessons: [
          {
            id: 'python-basics',
            title: 'Python Basics',
            topicId: 'python',
            label: 'Beginner Python',
            difficulty: 'Beginner',
            body: 'Variables, functions, loops, lists, dictionaries, and file I/O — the Python fundamentals every data engineer uses daily.',
          },
          {
            id: 'linux-cli',
            title: 'Linux & CLI',
            topicId: 'linux-cli',
            label: 'Terminal',
            difficulty: 'Beginner',
            body: 'Navigate servers, run scripts, inspect logs, and schedule jobs. Every cloud environment runs Linux.',
          },
          {
            id: 'git-github',
            title: 'Git & Version Control',
            topicId: 'git',
            label: 'Version Control',
            difficulty: 'Beginner',
            body: 'Track changes, collaborate with teammates, and deploy safely. Every pipeline lives in a Git repository.',
          },
          {
            id: 'apis-basics',
            title: 'REST APIs & Data Extraction',
            topicId: 'python',
            label: 'APIs',
            difficulty: 'Beginner to Intermediate',
            body: 'Most modern data sources expose REST APIs. Learn how to authenticate, paginate, rate-limit, and extract data reliably.',
          },
        ],
      },
    ],
  },

  // ═══════════════════════════════════════════════════════════════════════════
  // PHASE 4 — Intermediate Data Engineering
  // ═══════════════════════════════════════════════════════════════════════════
  {
    id: 'lp-intermediate',
    title: 'Phase 4 — Intermediate Data Engineering',
    shortTitle: 'Intermediate DE',
    estimatedTime: '6–8 weeks',
    difficulty: 'Intermediate',
    why: 'These are the patterns that appear in every production pipeline: advanced SQL, data modeling, ETL patterns, Spark, and performance.',
    companiesUse: 'Spark jobs, warehouse modeling, incremental loads, partitioned datasets, and performance-tuned queries.',
    interviewImportance: 'Very high. Most technical DE interviews focus on exactly these topics.',
    modules: [
      {
        id: 'advanced-sql-module',
        title: 'Advanced SQL',
        lessons: [
          {
            id: 'advanced-sql',
            title: 'Advanced SQL Patterns',
            topicId: 'sql',
            label: 'Advanced SQL',
            difficulty: 'Intermediate',
            body: 'CTEs, subqueries, CASE expressions, string functions, and query optimisation. The SQL patterns used in real pipeline debugging and reporting.',
          },
          {
            id: 'data-modeling',
            title: 'Data Modeling',
            topicId: 'data-modeling',
            label: 'Design',
            difficulty: 'Intermediate',
            body: 'Star schema, snowflake schema, SCD Type 2, surrogate keys — design tables that are fast to query and easy for analysts.',
          },
        ],
      },
      {
        id: 'dbt-analytics-engineering',
        title: 'dbt & Analytics Engineering',
        lessons: [
          {
            id: 'dbt-overview',
            title: 'dbt Fundamentals',
            topicId: 'dbt',
            label: 'Transform',
            difficulty: 'Intermediate',
            body: 'dbt models, staging/intermediate/mart layers, sources, ref(), and how dbt turns SQL files into a production transformation pipeline with built-in lineage.',
          },
          {
            id: 'dbt-testing-docs',
            title: 'dbt Tests and Documentation',
            topicId: 'dbt',
            label: 'Quality',
            difficulty: 'Intermediate',
            body: 'not_null, unique, accepted_values, relationships — built-in tests plus custom singular tests. Documentation YAML, lineage graph, and dbt docs serve.',
          },
          {
            id: 'dbt-incremental-snapshots',
            title: 'Incremental Models and Snapshots',
            topicId: 'dbt',
            label: 'Advanced',
            difficulty: 'Intermediate to Advanced',
            body: 'is_incremental() for large fact tables with lookback buffers. SCD Type 2 via dbt snapshots. --full-refresh strategies for schema evolution.',
          },
          {
            id: 'dbt-macros-production',
            title: 'Macros, Jinja, and Production dbt',
            topicId: 'dbt',
            label: 'Production',
            difficulty: 'Advanced',
            body: 'Reusable Jinja macros, dbt Cloud vs dbt Core with Airflow, CI/CD on PRs, and adapter configuration for Snowflake, Databricks, Fabric, and Synapse.',
          },
        ],
      },
      {
        id: 'pipeline-patterns',
        title: 'Pipeline Patterns',
        lessons: [
          {
            id: 'etl-vs-elt-deep',
            title: 'ETL vs ELT — Deep Dive',
            topicId: 'etl-vs-elt',
            label: 'Patterns',
            difficulty: 'Intermediate',
            body: 'Go beyond the concept. Learn how to implement ELT with dbt, handle schema drift, manage idempotency, and choose the right pattern for each use case.',
          },
          {
            id: 'batch-processing',
            title: 'Batch Processing',
            topicId: 'batch-processing',
            label: 'Processing',
            difficulty: 'Intermediate',
            body: 'Build reliable batch pipelines: watermarks, idempotent writes, partition strategies, and retry logic.',
          },
          {
            id: 'incremental-loading',
            title: 'Incremental Loading',
            topicId: 'incremental-loading',
            label: 'Optimization',
            difficulty: 'Intermediate',
            body: 'Process only what changed since the last run. Watermarks, MERGE/UPSERT patterns, and handling late-arriving data.',
            guide: {
              headline: 'Incremental loading processes only new or changed records since the last run — making pipelines 10x-100x faster than full reloads.',
              objectives: [
                'Understand why full reloads are expensive and when incremental is essential',
                'Implement high-watermark tracking to identify new records',
                'Write idempotent MERGE/UPSERT patterns that are safe to re-run',
                'Handle late-arriving data without missing records or creating duplicates',
                'Use Databricks AutoLoader for continuous file-based incremental ingestion',
              ],
              explanation: 'A full reload reads the entire source table on every run. On a 100 million row table that grows by 50,000 rows daily, a full reload scans 100M rows to find 50K changes — a 2000x waste. Incremental loading uses a high-watermark (usually the MAX updated_at or MAX created_at from the last successful run) to query only rows changed since that point. The new records are then merged into the target table with an UPSERT/MERGE that handles both inserts and updates atomically. The result: a pipeline that takes 30 seconds instead of 30 minutes.',
              analogy: {
                title: 'Reading Only New Emails',
                text: 'Imagine re-reading your entire email inbox every day to find new messages. That\'s a full reload. Incremental loading is like checking only emails received since your last visit — you remember your last read position (the watermark) and start from there. If you miss a day and come back, you read the last 2 days rather than 10 years of history. The watermark is your bookmark.',
              },
              keyPoints: [
                { title: 'High-Watermark Pattern', body: 'Store MAX(updated_at) from the previous successful run in a state table. On the next run, query WHERE updated_at > watermark to get only new/changed records. After successful load, update the watermark. This ensures every run is both incremental (fast) and complete (no gaps). The watermark must be persisted externally — not in memory.' },
                { title: 'MERGE / UPSERT', body: 'Once you have incremental records, you need to apply them correctly: new records → INSERT, changed records → UPDATE. MERGE (Delta Lake) or ON CONFLICT DO UPDATE (PostgreSQL) handles both in one atomic statement. This is idempotent — running MERGE twice with the same data produces the same result. DELETE + INSERT is not idempotent and risks data gaps during pipeline failures.' },
                { title: 'Idempotency', body: 'A pipeline step is idempotent if running it multiple times produces the same result. Idempotency is essential for safe retries. To make loads idempotent: use MERGE not INSERT (avoid duplicates on rerun), use a state store for watermarks (don\'t rely on in-memory variables), and design transformations to be stateless (same input → same output).' },
                { title: 'Late-Arriving Data', body: 'Records sometimes arrive with an updated_at timestamp earlier than the current watermark — events generated offline, API retries, delayed CDC. Strategy: move the watermark lookback window backward by a buffer (e.g., process records updated in the last 25 hours instead of 24 hours). This catches most late arrivals at a small extra cost. Accept that data more than N hours late requires a backfill.' },
                { title: 'Databricks AutoLoader', body: 'For file-based incremental ingestion, AutoLoader (cloudFiles format) tracks which files in an ADLS/S3 folder have been processed using a checkpoint directory. New files trigger processing automatically without listing the entire folder. It scales to millions of files per folder and handles exactly-once delivery via Spark checkpointing.' },
              ],
              whyCompaniesUse: 'A financial services company loading 5 years of transaction history full every night would take hours and hammer the source database during peak hours. Incremental loads make this a 15-minute job that sources only yesterday\'s records. Every mature data platform uses incremental patterns in Silver and Gold layers — full reloads are only acceptable for very small, completely replaced dimension tables.',
              interviewNote: '"How do you implement incremental loading?" Answer with three components: (1) Watermark tracking — persist MAX(updated_at) in a state table, query WHERE updated_at > watermark. (2) MERGE — apply changes atomically, safe to re-run. (3) Late data handling — lookback buffer of 25-48 hours covers most stragglers. Then mention AutoLoader for file-based sources. Interviewers often follow up: "What happens if the pipeline fails midway?" Answer: watermark is only updated after a successful MERGE — so a failed run is safely retried from the same starting point.',
              commonMistakes: [
                { mistake: 'Updating the watermark before the load succeeds', why: 'If the watermark advances before the MERGE completes, a pipeline failure leaves a gap — records between the old watermark and the new one are never processed.', fix: 'Only update the watermark after the MERGE or UPSERT transaction commits successfully. Use a try/finally pattern or a pipeline stage dependency in Airflow.' },
                { mistake: 'Using created_at instead of updated_at for the watermark', why: 'created_at only catches new rows, not updates to existing rows. A customer who changes their address will not be picked up by a created_at watermark.', fix: 'Use updated_at for the watermark. If the source does not have an updated_at column, use CDC (Change Data Capture) instead.' },
                { mistake: 'Not deduplicating before MERGE', why: 'If the source has duplicate records for the same key (a common occurrence with API retries and CDC), MERGE receives multiple update rows for one target row. The last one wins — which may not be the most recent.', fix: 'Deduplicate source records before MERGE: ROW_NUMBER() OVER (PARTITION BY key ORDER BY updated_at DESC) WHERE rn = 1.' },
              ],
              performanceTips: [
                'Partition target tables by year_month or date. Incremental MERGE scans only the relevant partition when the WHERE condition includes the partition column.',
                'Use Delta Lake\'s MERGE with a date filter on the target table: MERGE INTO target USING source ON target.id = source.id AND target.year_month = source.year_month. This prunes the target scan to recent partitions.',
                'For very high-frequency incremental loads (every 5 minutes), consider Spark Structured Streaming with trigger(processingTime="5 minutes") instead of scheduled batch MERGE — it provides lower latency with less orchestration overhead.',
              ],
              bestPractices: [
                'Store watermarks in a dedicated etl_state table or in Delta table properties (TBLPROPERTIES) — never in a variable or pipeline parameter that is lost on failure.',
                'Log watermark transitions: "Processed records from 2024-01-15 12:00 to 2024-01-15 13:00. Rows loaded: 4,271." This makes debugging and auditing straightforward.',
                'Test your pipeline\'s behavior on restart after failure. Kill the pipeline mid-MERGE and restart — verify no duplicates and no gaps.',
                'Document the expected incremental volume: "This pipeline loads approximately 5,000-50,000 rows per run. Alert if <1,000 (possible source issue) or >200,000 (unexpected spike)."',
              ],
              recap: [
                'High-watermark = MAX(updated_at) stored in state. Query WHERE updated_at > watermark for incremental extraction.',
                'MERGE/UPSERT applies inserts and updates atomically. Idempotent — safe to re-run on failure.',
                'Update watermark AFTER successful load, not before.',
                'Late data: use a lookback buffer (25-48 hours). AutoLoader for file-based incremental ingestion.',
              ],
              quiz: [
                {
                  q: 'Your incremental pipeline fails halfway through the MERGE operation. On the next run, what records will it process?',
                  options: ['Only records from after the failure point — causing a gap', 'Records from the same watermark start point again — no gap, no duplicate (because MERGE is idempotent)', 'All records since the beginning of time — full reload fallback', 'Nothing — the pipeline waits for manual intervention'],
                  answer: 1,
                  explanation: 'Because the watermark is only updated after a successful MERGE, a failed run does not advance the watermark. The next run starts from the same point. MERGE is idempotent — inserting the same records again updates them to the same values, producing no duplicates.',
                },
                {
                  q: 'A customer updated their address at 11:58 PM. Your pipeline runs at midnight using a 24-hour lookback. The customer\'s record has updated_at = 11:59:59. Will this record be included?',
                  options: ['Yes — a 25-hour lookback buffer would catch it', 'No — it arrives before midnight, so it is missed by the watermark', 'Yes — updated_at is before midnight, so it is in the window', 'It depends on timezone settings'],
                  answer: 0,
                  explanation: 'With a 25-hour lookback buffer, the pipeline processes records updated_at > (midnight - 25 hours), which includes 11:59 PM. The 1-hour buffer beyond 24 hours is specifically designed to catch records updated just before the run window closes.',
                },
              ],
            },
            nextLesson: { id: 'data-quality', title: 'Data Quality', reason: 'Incremental loads require validation checks to catch silent failures — missing rows, null anomalies, and unexpected data distributions.' },
          },
          {
            id: 'data-quality',
            title: 'Data Quality',
            topicId: 'data-quality',
            label: 'Quality',
            difficulty: 'Intermediate',
            body: 'Null checks, schema validation, duplicate detection, and alerting. Data quality is the line between trusted and useless data.',
            guide: {
              headline: 'Data quality checks are automated validations that catch bad data before it reaches analysts — the difference between trusted pipelines and silent data corruption.',
              objectives: [
                'Understand the five dimensions of data quality and what each catches',
                'Implement SQL-based assertions and dbt tests for pipeline validation',
                'Design a fail-safe pipeline that halts rather than propagates bad data',
                'Build row-count and sum reconciliation checks between pipeline layers',
                'Know when to quarantine vs reject vs alert on bad records',
              ],
              explanation: 'A pipeline that runs without errors can still produce completely wrong data. An API returning HTTP 200 with an empty list, a MERGE matching on the wrong key, a schema change in the source — all produce bad data silently. Data quality checks are assertions that run after each pipeline step and fail the pipeline if the data does not meet expectations. They are your last line of defence before wrong data reaches analysts, ML models, or executives.',
              analogy: {
                title: 'Quality Control in Manufacturing',
                text: 'A car factory does not wait for customers to find defective cars — they have quality control stations at each stage of the assembly line. Before the engine is installed, before the car leaves the factory, inspectors check critical measurements. If something fails, the car is flagged and quarantined — not shipped. Data quality is the same: validate at each pipeline stage (after extraction, after transformation, before loading to Gold), halt and alert if a check fails. Never ship bad data to customers (analysts).',
              },
              keyPoints: [
                { title: 'Completeness', body: 'Are expected records present? Checks: COUNT(*) matches yesterday\'s count ±20%, no NULL in required columns (order_id, customer_id, amount), all expected dates are present. Completeness catches missing records from API failures, incomplete CDC events, and partial file uploads.' },
                { title: 'Uniqueness', body: 'No duplicate primary keys in final tables. Check: SELECT id, COUNT(*) FROM table GROUP BY id HAVING COUNT(*) > 1 returns 0 rows. Duplicate PKs cause JOIN fan-out, wrong aggregations, and downstream report errors. Run on every Silver table after MERGE.' },
                { title: 'Freshness', body: 'Data arrived within the expected time window. Check: MAX(updated_at) from Silver is within N hours of the current time. Stale data in Gold (because Silver did not update) means analysts are looking at yesterday\'s numbers thinking they are today\'s. Monitor freshness per table with a metadata table.' },
                { title: 'Referential Integrity', body: 'Foreign key values exist in the referenced dimension table. Check: SELECT COUNT(*) FROM fact_orders WHERE customer_id NOT IN (SELECT customer_id FROM dim_customer) = 0. Violated FK constraints cause NULL joins in reports and wrong revenue attribution by customer segment.' },
                { title: 'Distribution / Range Checks', body: 'Values within expected statistical ranges. Checks: amount > 0 and < 100000 (no obviously wrong amounts), no future dates in order_date, status only in (\'pending\', \'processing\', \'shipped\', \'delivered\', \'cancelled\'). Distribution drift — average order value suddenly 50% higher — is an early signal of upstream data corruption.' },
              ],
              whyCompaniesUse: 'At scale, silent data quality failures cost real money. A wrong revenue dashboard used by the CFO to make budget decisions. A ML model trained on corrupted features that makes bad recommendations for months. A customer list with duplicates that sends 10 emails to the same person. Every mature data platform invests in automated DQ checks for exactly these reasons.',
              interviewNote: '"How do you ensure data quality in your pipelines?" This is a common mid-senior level DE question. Structure your answer: (1) Define checks per table (uniqueness, null rates, row count ±20% of yesterday, FK integrity). (2) Run checks as Airflow tasks after each pipeline stage. (3) On failure: alert, halt downstream pipeline, do NOT overwrite last good Gold layer — preserve it until the issue is fixed. Mention tools: dbt tests (simple, SQL-native), Great Expectations (comprehensive, framework-based), or custom SQL assertions.',
              commonMistakes: [
                { mistake: 'Only checking pipeline exit status, not data correctness', why: 'A pipeline can complete with exit code 0 while producing completely wrong data. HTTP 200 does not mean correct data was returned. Spark does not error on an empty DataFrame.', fix: 'Add explicit data assertions: if row_count == 0: raise PipelineDataError("Empty result — source API may have returned no data"). Never trust process success as data quality evidence.' },
                { mistake: 'Alerting on DQ failures but continuing the pipeline', why: 'If a DQ check fails and the pipeline continues, wrong data overwrites the last good Gold layer. Now you have a broken dashboard AND no clean version to roll back to.', fix: 'Make DQ failures blocking: Airflow task state = FAILED, downstream tasks do not run, Delta Lake Gold table is not overwritten. Preserve the last good state until the issue is resolved.' },
                { mistake: 'Writing DQ checks as warnings instead of errors in development', why: 'DQ checks that only log warnings in development never catch real issues because nobody reads warning logs at scale.', fix: 'Make checks fail hard from the start. A DQ check that only warns is not a DQ check — it is a log message nobody reads.' },
              ],
              performanceTips: [
                'Run lightweight SQL-based checks (COUNT(*), MAX, NULL counts) against already-computed Delta tables rather than re-scanning source data. DQ checks should be fast — under 30 seconds for most tables.',
                'dbt tests run on the materialised table, not re-executing the transformation. For large Gold tables, use dbt\'s store_failures=true to write failing rows to a separate table for debugging without slowing the main check.',
                'Run DQ checks in parallel where possible — uniqueness check, null check, and freshness check for the same table can run simultaneously in Airflow with fan-out tasks.',
              ],
              bestPractices: [
                'Define expected row count ranges per pipeline run: "This table should have between 10,000 and 200,000 rows. Alert if outside this range." Document it as a table-level property.',
                'Build a DQ dashboard: a table tracking check_name, table_name, status (pass/fail), run_timestamp, and row_count per run. This creates an audit trail and shows DQ trends over time.',
                'Tier your DQ checks: critical (pipeline halts), warning (alert but continue), and informational (logged only). Not all checks are equal severity.',
                'Review DQ check results weekly in a team meeting. If a check never fails in 3 months, either the data is clean or the check is wrong. Periodically inject bad test data to verify checks catch it.',
              ],
              recap: [
                'Five dimensions: completeness, uniqueness, freshness, referential integrity, distribution',
                'DQ failures must halt the pipeline — not just alert. Preserve last good state.',
                'dbt tests: built-in not_null, unique, accepted_values, relationships — simple and SQL-native',
                'Never trust process exit code as data quality evidence. Check the data, not the process.',
              ],
              quiz: [
                {
                  q: 'Your daily pipeline runs successfully (no errors) but the Gold table shows 0 rows for today. What DQ check would have caught this?',
                  options: ['A uniqueness check on the primary key', 'A row count check asserting COUNT(*) > 0 (or within expected range)', 'A NULL check on required columns', 'A referential integrity check on foreign keys'],
                  answer: 1,
                  explanation: 'A row count check (COUNT(*) > 0, or within expected range ± yesterday\'s count) catches empty results that the pipeline treated as success. The pipeline technically succeeded — it just processed an empty source and loaded an empty result. A NULL check would not fire because there are no rows to check.',
                },
                {
                  q: 'After a DQ check failure, the correct action is:',
                  options: ['Log the error and continue loading to Gold — analysts need today\'s data', 'Alert the team, halt the pipeline, and preserve the previous Gold state until the issue is fixed', 'Automatically rerun the pipeline three times and only alert if all three fail', 'Skip the failed check and continue with remaining pipeline stages'],
                  answer: 1,
                  explanation: 'Loading bad data to Gold overwrites the last good state. Analysts then see wrong data instead of slightly stale-but-correct data. Preserving the previous state is always better than overwriting it with known-bad data. Alerting the team and halting is the correct production response.',
                },
              ],
            },
            nextLesson: { id: 'orchestration', title: 'Orchestration & Airflow', reason: 'Quality checks need to be orchestrated alongside pipeline steps. Airflow manages the dependency: load → check → alert on failure.' },
          },
        ],
      },
      {
        id: 'spark-foundations',
        title: 'Spark & Big Data',
        lessons: [
          {
            id: 'pyspark-basics',
            title: 'PySpark Basics',
            topicId: 'pyspark',
            label: 'Spark',
            difficulty: 'Intermediate',
            body: 'DataFrames, transformations, actions, and the Spark execution model. The entry point to distributed data processing.',
            guide: {
              headline: 'PySpark lets you process datasets too large for a single machine by distributing computation across a cluster — with a DataFrame API that mirrors SQL logic.',
              objectives: [
                'Understand Spark\'s distributed execution model: driver, executors, and partitions',
                'Know the difference between transformations (lazy) and actions (trigger execution)',
                'Write DataFrame transformations: select, filter, withColumn, groupBy, join',
                'Read and write Delta tables, Parquet, and CSV from cloud storage',
                'Understand why collect() on large DataFrames is dangerous',
              ],
              explanation: 'Spark splits your dataset into partitions and distributes them across executor processes on multiple machines. The driver program (your Python script or notebook) builds a logical execution plan from your DataFrame operations. Nothing runs until you call an action (count(), show(), write()). At that point, Spark compiles the logical plan into physical tasks and sends them to executors. This lazy evaluation lets Spark optimise the full pipeline — eliminating unnecessary operations, pushing filters down, and choosing the best join strategy before any data moves.',
              analogy: {
                title: 'Restaurant Kitchen vs Home Cooking',
                text: 'A single machine running pandas is home cooking — one chef, one stove, handles a family-sized meal fine. PySpark is a restaurant kitchen: many chefs (executors), each handling one section of the meal (a data partition), working in parallel. The head chef (driver) coordinates the plan but doesn\'t cook themselves. The kitchen is efficient for large banquets (terabytes) but has overhead for a small dinner (megabytes). Don\'t use a restaurant kitchen to cook for two — use pandas for small data, PySpark for data that doesn\'t fit in RAM.',
              },
              keyPoints: [
                { title: 'Driver and Executors', body: 'The driver runs your Python code and builds the query plan. Executors are JVM processes on cluster nodes that actually process data partitions. When you call df.show() or df.write(), the driver sends tasks to executors. The driver has limited memory — never collect() large DataFrames to the driver. Executors have the bulk of the cluster RAM.' },
                { title: 'Transformations (Lazy)', body: 'select, filter, withColumn, groupBy, join, orderBy — these define what to do but do nothing immediately. They build a directed acyclic graph (DAG) of operations. Lazy evaluation is why you can chain 10 transformations and Spark optimises them as one unit — pushing filter() down before groupBy() automatically.' },
                { title: 'Actions (Trigger Execution)', body: 'count(), show(), first(), collect(), write() — these trigger the actual computation. The DAG is compiled and sent to executors. Every action triggers a full DAG recomputation from scratch unless the DataFrame is cached. This is why calling count() 3 times in a loop is 3 full scans — cache first.' },
                { title: 'DataFrames vs RDDs', body: 'DataFrames are the modern API — typed, optimised by Catalyst, parallel to SQL. RDDs (Resilient Distributed Datasets) are the low-level API — untyped, no Catalyst optimisation, harder to use. Always use DataFrames. Only reach for RDDs when you need custom serialisation or non-tabular data processing that DataFrames cannot express.' },
                { title: 'Partitions', body: 'A partition is the unit of parallelism — one partition = one task on one executor core. Too few partitions = underutilisation (10 tasks on a 200-core cluster = 190 idle cores). Too many = overhead (10,000 tiny tasks with scheduling cost > compute cost). Rule of thumb: 128–256 MB per partition. After a wide transformation (groupBy, join), use repartition() or coalesce() to right-size the partition count.' },
              ],
              whyCompaniesUse: 'When data volumes exceed what a single machine can process (>10 GB with pandas, >100 GB in most cases), PySpark is the standard solution. It runs on Databricks, AWS EMR, Google Dataproc, and Azure HDInsight. A data engineer who cannot write PySpark is limited to small-data tools — which excludes them from most enterprise DE roles that process hundreds of GB to TB daily.',
              interviewNote: '"Explain the difference between a transformation and an action in Spark." This is asked in every Spark interview. Answer: transformations (select, filter, groupBy, join) are lazy — they build a plan. Actions (count, show, write) execute the plan. Everything between actions is optimised as one unit by Catalyst. Then add: "This is why you cache DataFrames before using them in multiple actions — otherwise each action triggers a full recomputation from the source."',
              commonMistakes: [
                { mistake: 'Calling collect() on a large DataFrame', why: 'collect() pulls every row from every executor to the driver\'s memory. On a 10 GB DataFrame, this causes the driver to OOM (out of memory) and crash the entire Spark session.', fix: 'Never use collect() for large data. Use df.show(20) to preview, df.write() to save results, or df.toPandas() only after filtering to a small subset (< 100K rows).' },
                { mistake: 'Running actions inside a loop without caching', why: 'df.count() inside a for loop re-reads and re-processes the data from scratch on every iteration. 10 iterations = 10 full scans of the source table.', fix: 'Call df.cache() before the loop. The first action materialises the data to executor memory. Subsequent actions read from cache — typically 10-100x faster.' },
                { mistake: 'Using pandas for large-data operations inside a PySpark job', why: 'pandas.read_csv() on a 50 GB file crashes with OOM. Mixed pandas/Spark code often means small-data thinking applied to big-data problems.', fix: 'Read large files directly with spark.read.csv(). Convert to pandas (toPandas()) only after aggregating to a small result set. Use Pandas API on Spark (pyspark.pandas) if you need the pandas API on distributed data.' },
              ],
              performanceTips: [
                'Broadcast small tables (< 10 MB) in joins: df_large.join(broadcast(df_small), "key"). This sends df_small to every executor, eliminating the shuffle of df_large across the network — typically a 10x speedup.',
                'Enable Adaptive Query Execution (AQE) in Spark 3+: spark.conf.set("spark.sql.adaptive.enabled", "true"). AQE dynamically adjusts partition counts after each stage based on actual data size, handling skew and reducing shuffle automatically.',
                'Push filter() before join() in your code. Even though Catalyst often does this automatically, explicit ordering helps readability and ensures it happens in all cases.',
                'Use Delta table reads with predicate push-down: spark.read.format("delta").load(path).filter("date = \'2024-01-15\'"). Delta\'s transaction log statistics mean only the relevant Parquet files are read.',
              ],
              bestPractices: [
                'Import spark functions from pyspark.sql.functions as F — then use F.col(), F.sum(), F.lit(). Avoids naming conflicts with Python builtins like sum and round.',
                'Write modular transformation functions: def clean_orders(df: DataFrame) -> DataFrame. Testable, reusable, and easier to unit test with a small fixture DataFrame.',
                'Add logging at each major transformation step: logger.info(f"Orders after dedup: {df.count()} rows"). This makes production debugging feasible.',
                'Test PySpark code locally with SparkSession.builder.master("local[2]") — a local Spark instance using 2 CPU cores. Run unit tests without a cluster.',
              ],
              recap: [
                'Driver builds the plan. Executors run the tasks. Partitions are the unit of parallelism.',
                'Transformations are lazy (no execution). Actions trigger the full DAG execution.',
                'Never collect() large DataFrames. Cache DataFrames used in multiple actions.',
                'Use broadcast() for small table joins. Enable AQE. Filter early, join later.',
              ],
              quiz: [
                {
                  q: 'You call df.count() three times in your Spark notebook. How many times does Spark read the source data?',
                  options: ['Once — Spark caches the result after the first count', 'Three times — each count() is a separate action that triggers full recomputation', 'Twice — the first count is computed; the second and third are cached', 'It depends on the executor memory available'],
                  answer: 1,
                  explanation: 'count() is an action. Every action triggers a full DAG recomputation from the source data. Without explicit caching (df.cache()), Spark re-reads and re-processes the data for each count(). Fix: df.cache() before the first count().',
                },
                {
                  q: 'When joining a 500 GB orders table with a 2 MB customers lookup table, what is the most effective optimisation?',
                  options: ['Repartition the orders table to 200 partitions before the join', 'Use a broadcast join to send customers to every executor', 'Sort both tables by customer_id before joining', 'Use a LEFT JOIN instead of INNER JOIN'],
                  answer: 1,
                  explanation: 'A broadcast join sends the small table (customers, 2 MB) to every executor in memory. The large table (orders) never needs to shuffle — each executor already has the customers data it needs to join locally. This eliminates the most expensive operation in distributed computing: shuffling 500 GB of orders data across the network.',
                },
              ],
            },
            nextLesson: { id: 'spark-optimization', title: 'Spark Optimization', reason: 'Once you can write PySpark, the next skill is making it fast — shuffles, skew handling, AQE, and explain plans.' },
          },
          {
            id: 'partitioning',
            title: 'Partitioning Strategies',
            topicId: 'partitioning-strategies',
            label: 'Performance',
            difficulty: 'Intermediate',
            body: 'Partition by date, ID, or region. Good partitioning turns 4-hour jobs into 4-minute jobs.',
          },
          {
            id: 'file-formats',
            title: 'File Formats',
            topicId: 'file-formats',
            label: 'Storage',
            difficulty: 'Intermediate',
            body: 'Parquet, Delta, Avro, ORC — why format choice affects query speed, storage cost, and schema evolution.',
          },
          {
            id: 'spark-optimization',
            title: 'Spark Optimization',
            topicId: 'spark-optimization',
            label: 'Performance',
            difficulty: 'Intermediate to Advanced',
            body: 'Shuffle reduction, broadcast joins, caching, and explain plans. Turn slow jobs into production-grade pipelines.',
          },
        ],
      },
    ],
  },

  // ═══════════════════════════════════════════════════════════════════════════
  // PHASE 5 — Cloud Platforms & Pipelines
  // ═══════════════════════════════════════════════════════════════════════════
  {
    id: 'lp-cloud',
    title: 'Phase 5 — Cloud Platforms & Pipelines',
    shortTitle: 'Cloud & Pipelines',
    estimatedTime: '6–8 weeks',
    difficulty: 'Intermediate to Advanced',
    why: 'Real pipelines run on cloud platforms. ADF, Databricks, and Airflow are the tools you\'ll see in every job description.',
    companiesUse: 'ADF pipelines, Databricks notebooks, AWS Glue jobs, Airflow DAGs, CI/CD for data teams.',
    interviewImportance: 'High, especially for Azure, AWS, and Databricks-specific roles.',
    modules: [
      {
        id: 'cloud-tools',
        title: 'Managed Pipeline Tools',
        lessons: [
          {
            id: 'azure-data-factory',
            title: 'Azure Data Factory',
            topicId: 'azure-data-factory',
            label: 'Azure',
            difficulty: 'Intermediate',
            body: 'Build, schedule, and monitor data pipelines with Azure\'s managed ETL service — no servers to manage.',
          },
          {
            id: 'databricks',
            title: 'Databricks',
            topicId: 'azure-databricks',
            label: 'Databricks',
            difficulty: 'Intermediate',
            body: 'Notebooks, clusters, Delta Lake, and Unity Catalog — the platform that powers most enterprise DE workloads today.',
          },
          {
            id: 'aws-glue',
            title: 'AWS Glue',
            topicId: 'aws-glue',
            label: 'AWS',
            difficulty: 'Intermediate',
            body: 'Serverless ETL on AWS: Glue jobs, crawlers, Data Catalog, and integration with S3 and Redshift.',
          },
          {
            id: 'microsoft-fabric',
            title: 'Microsoft Fabric',
            topicId: 'microsoft-fabric',
            label: 'Fabric',
            difficulty: 'Intermediate',
            body: 'OneLake, Lakehouses, Warehouses, Pipelines, Eventstream, KQL, and Direct Lake — the unified Azure analytics platform reshaping enterprise data engineering.',
          },
        ],
      },
      {
        id: 'fabric-deep-dive',
        title: 'Microsoft Fabric Deep Dive',
        lessons: [
          {
            id: 'fabric-onelake-lesson',
            title: 'OneLake and Shortcuts',
            topicId: 'microsoft-fabric',
            label: 'Fabric',
            difficulty: 'Intermediate',
            body: 'Understand OneLake as the universal data layer for Fabric — and use Shortcuts to virtualise external data without migration.',
          },
          {
            id: 'fabric-lakehouse-lesson',
            title: 'Fabric Lakehouse & Medallion',
            topicId: 'microsoft-fabric',
            label: 'Fabric',
            difficulty: 'Intermediate',
            body: 'Build Bronze → Silver → Gold Delta pipelines using Spark Notebooks and Fabric Lakehouses backed by OneLake.',
          },
          {
            id: 'fabric-rti-lesson',
            title: 'Real-Time Intelligence & KQL',
            topicId: 'microsoft-fabric',
            label: 'Fabric',
            difficulty: 'Advanced',
            body: 'Stream events via Eventstream, store in KQL Databases, and query telemetry in milliseconds with Kusto Query Language.',
          },
          {
            id: 'fabric-semantic-models-lesson',
            title: 'Direct Lake Semantic Models',
            topicId: 'microsoft-fabric',
            label: 'Fabric',
            difficulty: 'Advanced',
            body: 'Expose Gold Lakehouse tables as Power BI reports using Direct Lake — always-fresh data at Import-mode speed, no refresh lag.',
          },
          {
            id: 'fabric-cicd-lesson',
            title: 'Fabric CI/CD & Deployment Pipelines',
            topicId: 'microsoft-fabric',
            label: 'Fabric',
            difficulty: 'Advanced',
            body: 'Connect Fabric workspaces to Git, promote items Dev → Test → Production with Deployment Pipelines, and version-control notebooks as code.',
          },
        ],
      },
      {
        id: 'azure-security-module',
        title: 'Azure Security & Secrets Management',
        lessons: [
          {
            id: 'azure-security-managed-identity',
            title: 'Managed Identity & Key Vault',
            topicId: 'azure-security',
            label: 'Security',
            difficulty: 'Advanced',
            body: 'Replace connection strings and Service Principal secrets with Managed Identity. Store remaining credentials in Key Vault and reference them from ADF Linked Services and Databricks secret scopes.',
          },
          {
            id: 'azure-security-rbac',
            title: 'RBAC & Unity Catalog Access Control',
            topicId: 'azure-security',
            label: 'Security',
            difficulty: 'Advanced',
            body: 'Design least-privilege RBAC for a medallion architecture: container-scoped Storage roles, Unity Catalog GRANT statements, column masking for PII, and AAD group management.',
          },
          {
            id: 'azure-security-networking',
            title: 'Private Networking & Data Governance',
            topicId: 'azure-security',
            label: 'Security',
            difficulty: 'Advanced',
            body: 'Lock down ADLS and Key Vault with Private Endpoints and DNS configuration. Scan and classify data with Microsoft Purview for GDPR compliance.',
          },
          {
            id: 'azure-security-cicd',
            title: 'Secrets in CI/CD & Incident Response',
            topicId: 'azure-security',
            label: 'Security',
            difficulty: 'Advanced',
            body: 'Implement OIDC federation for GitHub Actions and Azure DevOps — no long-lived credentials in pipelines. Run through incident scenarios: leaked keys, exposed public blobs, 403 debugging.',
          },
        ],
      },
      {
        id: 'production-ops',
        title: 'Production Operations',
        lessons: [
          {
            id: 'orchestration',
            title: 'Orchestration & Airflow',
            topicId: 'orchestration',
            label: 'Orchestration',
            difficulty: 'Intermediate',
            body: 'DAGs, dependencies, sensors, and scheduling. Airflow is the most common orchestration tool in production DE.',
          },
          {
            id: 'monitoring',
            title: 'Monitoring & Alerting',
            topicId: 'monitoring-logging',
            label: 'Operations',
            difficulty: 'Intermediate',
            body: 'Pipeline SLAs, alerting on failures, structured logging, and dashboards for pipeline health.',
          },
          {
            id: 'cicd-de',
            title: 'CI/CD for Data Engineering',
            topicId: 'cicd-de',
            label: 'DevOps',
            difficulty: 'Intermediate',
            body: 'Automated testing, deployment, and release management for data pipelines — treat pipelines as code.',
          },
          {
            id: 'delta-lake',
            title: 'Delta Lake',
            topicId: 'delta-lake',
            label: 'Storage',
            difficulty: 'Intermediate',
            body: 'ACID transactions, time travel, schema enforcement, and MERGE on a data lake. Delta Lake is the foundation of the lakehouse.',
            guide: {
              headline: 'Delta Lake adds ACID transactions, schema enforcement, time travel, and efficient upserts on top of cheap cloud object storage.',
              objectives: [
                'Understand why plain Parquet lacks ACID and how Delta Lake adds it via a transaction log',
                'Use time travel to query historical data and audit changes',
                'Write idempotent upserts with MERGE INTO',
                'Solve the small file problem with OPTIMIZE and ZORDER',
                'Apply schema evolution and enforcement in production pipelines',
              ],
              explanation: 'Delta Lake stores data as Parquet files in cloud storage (ADLS, S3) plus a transaction log directory (_delta_log/). Every write operation — INSERT, UPDATE, DELETE, MERGE — appends a new JSON entry to the log. This log is the source of truth for what data exists. It enables ACID transactions (no partial writes), time travel (read any previous version), schema enforcement (reject bad writes), and concurrent writer safety (optimistic concurrency). Delta Lake is the default table format in Databricks and Microsoft Fabric.',
              analogy: {
                title: 'Git for Data Files',
                text: 'Plain Parquet files are like an unversioned folder of documents — no history, no atomicity, no concurrent edit protection. Delta Lake is like adding Git to that folder. Every write is a commit with a unique version number. You can check out version 42 with TIMESTAMP AS OF or VERSION AS OF. You can see the full change history. Two people can write simultaneously without corrupting each other\'s data. And if a write fails halfway, the partial data is invisible — the transaction log only records completed commits.',
              },
              keyPoints: [
                { title: 'Transaction log (_delta_log/)', body: 'Every operation creates a new JSON file in _delta_log/ describing what changed (which files were added/removed, schema, stats). Spark reads the log to understand what data exists. This is what makes all Delta Lake features work — without the log, it\'s just Parquet.' },
                { title: 'MERGE INTO (Upsert)', body: 'MERGE matches source rows to target rows on a key, then UPDATE matched rows and INSERT unmatched rows in a single atomic statement. This is the production standard for incremental loads, SCD Type 2 updates, and CDC application. MERGE is far more efficient than DELETE + INSERT and handles concurrent writes safely.' },
                { title: 'OPTIMIZE and ZORDER', body: 'OPTIMIZE compacts many small Parquet files into larger ones — solves the "small file problem" from frequent streaming writes (thousands of 1 MB files → a few 256 MB files). ZORDER co-locates data on disk by a column\'s values, so queries filtering by that column skip most files. OPTIMIZE ZORDER BY (customer_id) = faster WHERE customer_id = 123 queries.' },
                { title: 'Time Travel', body: 'SELECT * FROM table VERSION AS OF 10 reads the table as it was at version 10. SELECT * FROM table TIMESTAMP AS OF \'2024-01-15\' reads as of that date. Use for: auditing (what did the data look like before the bad pipeline run?), rollback (RESTORE TABLE to VERSION 5), and reproducible ML training datasets.' },
                { title: 'Schema Evolution', body: 'Add .option("mergeSchema", "true") to writes to automatically add new source columns to the Delta table schema. Or use ALTER TABLE ADD COLUMNS for explicit migrations. Schema enforcement is on by default — writes with wrong schema fail before touching any data, protecting downstream consumers.' },
              ],
              whyCompaniesUse: 'Production data lakes built on plain Parquet regularly corrupt data from concurrent pipeline runs, accumulate thousands of small files that slow queries, and have no way to audit what changed when a pipeline introduced bad data. Delta Lake solves all three. It\'s why Databricks adopted it as the default format and why Microsoft Fabric\'s OneLake is built entirely on Delta.',
              interviewNote: '"What is Delta Lake and why is it better than Parquet?" This is asked in nearly every Databricks interview. Answer: Delta adds a transaction log to Parquet that enables ACID transactions, time travel (version history), schema enforcement, and MERGE upserts. Mention the small file problem and OPTIMIZE. Then say: "MERGE is how we do incremental loads and CDC — it\'s more efficient than DELETE + INSERT and handles concurrent writers safely."',
              commonMistakes: [
                { mistake: 'Running VACUUM with a short retention period', why: 'VACUUM removes old file versions. Setting retention below 7 days (or to 0) breaks time travel, concurrent reads, and Delta\'s concurrency guarantees.', fix: 'Never set retention_hours below 168 (7 days) in production. The default is safe. Only reduce it if you have storage cost pressure AND you understand the consequences.' },
                { mistake: 'Using MERGE with a non-unique join key', why: 'If the source has duplicate keys, MERGE produces undefined behavior — one source row may match multiple target rows, and the result depends on execution order.', fix: 'Deduplicate the source before MERGE: WITH deduped AS (SELECT *, ROW_NUMBER() OVER (PARTITION BY id ORDER BY updated_at DESC) AS rn FROM source) SELECT * FROM deduped WHERE rn = 1.' },
                { mistake: 'Not running OPTIMIZE regularly on streaming tables', why: 'Structured Streaming writes many small files per micro-batch. Without OPTIMIZE, a table written 100x/hour accumulates 2400 files per day — making reads slow.', fix: 'Schedule OPTIMIZE as a daily maintenance job. In Databricks, use Auto Optimize (optimizeWrite=true) to merge small files at write time automatically.' },
              ],
              performanceTips: [
                'Enable Auto Optimize in Databricks (spark.databricks.delta.optimizeWrite.enabled=true) for streaming tables — it merges small files at write time, reducing OPTIMIZE maintenance.',
                'ZORDER is most effective on high-cardinality columns that are frequently filtered: customer_id, product_id, event_type. Low-cardinality columns (status with 3 values) have low data skipping benefit.',
                'Partition by date AND use ZORDER by customer_id for the most common query pattern: WHERE order_date = X AND customer_id = Y. The partition skips wrong dates; ZORDER skips wrong customers within the partition.',
                'Delta\'s data skipping reads column min/max stats from the transaction log without opening Parquet files. ANALYZE TABLE ... COMPUTE STATISTICS FOR COLUMNS ensures stats are fresh after bulk loads.',
              ],
              bestPractices: [
                'Always write streaming data with a checkpointLocation to prevent reprocessing on restart.',
                'Use Unity Catalog table names (catalog.schema.table) instead of paths for all Delta table references in production — paths are fragile to storage reorganization.',
                'Set table properties for retention and commenting: TBLPROPERTIES (delta.logRetentionDuration="interval 30 days", comment="Bronze orders raw").',
                'Run DESCRIBE HISTORY table to audit what changed and when — invaluable for debugging pipeline incidents.',
              ],
              recap: [
                'Delta Lake = Parquet + transaction log (_delta_log/) → ACID, time travel, schema enforcement',
                'MERGE INTO = idempotent upsert in one atomic statement — the production standard for incremental loads',
                'OPTIMIZE compacts small files. ZORDER co-locates data by column for faster filtered reads.',
                'Time travel: VERSION AS OF N or TIMESTAMP AS OF date — use for auditing, rollback, reproducible ML',
              ],
              quiz: [
                {
                  q: 'You run a pipeline that accidentally writes bad data to a Delta table. How do you recover without losing subsequent valid data?',
                  options: ['Delete the table and rerun the pipeline from scratch', 'Use RESTORE TABLE ... TO VERSION AS OF N to roll back to before the bad run, then reprocess only the affected time window', 'DROP TABLE and recreate it', 'You cannot recover — Delta tables are immutable'],
                  answer: 1,
                  explanation: 'RESTORE TABLE uses the transaction log to revert the table to a previous version. The Parquet files from the bad write are still there but become "orphaned" — invisible to Delta reads until VACUUM removes them. This is why Delta is superior to plain Parquet for production.',
                },
                {
                  q: 'What is the purpose of ZORDER BY in a Delta Lake OPTIMIZE statement?',
                  options: ['It sorts the data by the specified column globally across the table', 'It co-locates rows with similar values in the same Parquet files, enabling data skipping for queries filtering on that column', 'It partitions the table by the specified column', 'It creates an index on the column'],
                  answer: 1,
                  explanation: 'ZORDER physically co-locates data with similar values into the same files. When you query WHERE customer_id = 123, Delta reads the column min/max stats from the transaction log and skips all files that don\'t contain customer_id 123. This is data skipping — not a global sort or an index.',
                },
              ],
            },
            nextLesson: { id: 'medallion-architecture', title: 'Medallion Architecture', reason: 'Delta Lake is the storage engine. Medallion architecture is how you organise data across Bronze, Silver, and Gold layers using Delta.' },
          },
          {
            id: 'medallion-architecture',
            title: 'Medallion Architecture',
            topicId: 'medallion-architecture',
            label: 'Architecture',
            difficulty: 'Intermediate',
            body: 'Bronze → Silver → Gold. Design a lakehouse that grows cleanly and supports multiple downstream consumers.',
            guide: {
              headline: 'Medallion architecture organises your lakehouse into Bronze (raw), Silver (clean), and Gold (business-ready) layers — each adding value and trust.',
              objectives: [
                'Understand what each layer stores and what transformations belong in each',
                'Know why Bronze is append-only and why that matters for reprocessing',
                'Apply the correct transformation logic for Silver: deduplication, validation, SCD2',
                'Design Gold tables fit for BI tools without modifying upstream layers',
                'Understand when to add more layers (Platinum) or separate workspaces',
              ],
              explanation: 'Medallion architecture (coined by Databricks) divides the lakehouse into three progressive layers of data quality. Bronze: raw data exactly as received, append-only, schema-on-read Delta tables. No transformations — this is your safety net for reprocessing. Silver: cleaned, validated, deduplicated data with business rules applied. This is the "single source of truth" layer. Gold: denormalised, aggregated tables built for specific use cases — one model per report or consumer group. Each layer is a Delta table. Spark or dbt jobs transform data forward through the layers on a schedule.',
              analogy: {
                title: 'Oil Refining',
                text: 'Bronze = crude oil pumped from the ground, stored exactly as extracted — unprocessed, impure, but 100% traceable to the source. Silver = refined petroleum — impurities removed, standardised grade, consistent quality. Gold = finished products (petrol, jet fuel, plastics) — each shaped for a specific end use. You can refine crude oil multiple times in different ways. But you can never un-refine it — which is why Bronze must stay raw. The crude oil is your ground truth.',
              },
              keyPoints: [
                { title: 'Bronze — Raw Landing Zone', body: 'Land data exactly as received: keep original column names, keep duplicates, keep nulls, keep bad records. Add metadata columns (_ingested_at, _source_file) but never filter or transform source data. This is your recovery point — if Silver logic has a bug, you reprocess from Bronze without re-calling the source API.' },
                { title: 'Silver — Source of Truth', body: 'Apply all business logic here: cast types, standardise formats, deduplicate by primary key with ROW_NUMBER, validate constraints (amount > 0, email format), apply SCD Type 2 for slowly changing dimensions, join lookup tables. Silver should be completely trusted data that could serve analytical queries — even if Gold doesn\'t exist yet.' },
                { title: 'Gold — Business-Ready', body: 'Pre-aggregate, denormalise, and reshape data for specific consumption patterns. One Gold table per use case: daily_revenue for a dashboard, customer_ltv for the ML team, ops_pipeline_metrics for the platform team. Gold tables are optimised for their consumers — Z-ORDERed on their most common filter columns, with ANALYZE TABLE for fresh statistics.' },
                { title: 'Data Contract at Each Layer', body: 'Define schema contracts: Bronze schema is the source\'s schema (may drift). Silver schema is your data team\'s contract (stable, versioned). Gold schema is the consumer\'s contract (changes require coordination). Schema enforcement in Delta enforces these contracts at write time.' },
              ],
              whyCompaniesUse: 'Without layering, pipelines become entangled: transformations applied inconsistently, quality issues propagating to dashboards, no safe recovery path when a pipeline bug corrupts data. Medallion gives each layer a clear owner, a clear purpose, and a clear recovery strategy. It\'s the reason Databricks, Microsoft Fabric, and most modern data platforms recommend it as the default architecture.',
              interviewNote: '"Design a data architecture for an e-commerce company." This question is asking for medallion architecture. Walk through: Bronze (raw orders CSV from API, auto-loaded with Databricks AutoLoader), Silver (deduplicated orders with MERGE, customer SCD2 dimension), Gold (daily_revenue by store and category, customer_ltv table, ZORDER optimised for BI). Mention orchestration (ADF or Airflow), testing (dbt tests or Great Expectations on Silver), and monitoring (row count checks between layers).',
              commonMistakes: [
                { mistake: 'Transforming data in the Bronze layer', why: 'Any transformation in Bronze means you cannot reproduce original source data. If you later discover the transformation was wrong, you have lost the raw input.', fix: 'Bronze must be a faithful copy of the source. If the source sends duplicates, Bronze has duplicates. Silver deduplicates.' },
                { mistake: 'Putting business logic in Gold instead of Silver', why: 'If three Gold tables each apply the same deduplication logic independently, any bug in that logic must be fixed three times. Silver is the single place for deduplication.', fix: 'Gold reads from Silver and only aggregates/reshapes. Business rules live in Silver. The only exception: Gold-specific derived metrics that have no meaning at the Silver level.' },
                { mistake: 'Not testing the Silver → Gold transformation', why: 'Gold tables are what analysts trust. A silent logic error in a Gold aggregation can produce wrong dashboards for weeks before anyone notices.', fix: 'Add row-count and sum reconciliation tests between Silver and Gold: if SUM(amount) in Gold.daily_revenue differs from SUM(amount) in Silver.orders for the same date range by >0.1%, alert.' },
              ],
              performanceTips: [
                'Bronze tables: do not OPTIMIZE — append-only workloads compound small file problems if you OPTIMIZE frequently. Use AutoLoader with trigger(availableNow=True) to process incrementally.',
                'Silver MERGE: partition Silver tables by year_month or date to limit the MERGE scan to the relevant partition. A MERGE that scans all of Silver is expensive on large tables.',
                'Gold tables: always OPTIMIZE ZORDER after a bulk rebuild. Gold is read-heavy — the extra write cost of ZORDER pays for itself many times over in faster BI queries.',
                'Delta Live Tables (Databricks): automates Bronze → Silver → Gold dependencies, handles retries, and provides built-in data quality rules — reducing medallion pipeline code by ~60%.',
              ],
              bestPractices: [
                'Name layers explicitly in your catalog: bronze.orders, silver.orders_clean, gold.daily_revenue — not just the table name.',
                'Add pipeline metadata to Bronze: _ingested_at TIMESTAMP, _source_file STRING, _pipeline_version STRING. This enables debugging when source data changes unexpectedly.',
                'Define SLAs per layer: Bronze must be current within 15 minutes of source. Silver within 1 hour. Gold within 2 hours. Monitor these SLAs with freshness checks.',
                'Treat Silver as the "permanent record" — never delete Silver rows except for regulatory GDPR deletion requests, handled via Delta MERGE with a soft-delete flag.',
              ],
              recap: [
                'Bronze: raw, append-only, no transformations — the recovery safety net and audit trail',
                'Silver: deduplicated, typed, validated, business-rule-applied — the single source of truth',
                'Gold: aggregated, denormalised, consumer-specific — optimised for each downstream use case',
                'Each layer is a Delta table. Spark/dbt jobs transform data through layers on a schedule or trigger.',
              ],
              quiz: [
                {
                  q: 'You discover that your Silver deduplication logic had a bug that affected 3 months of data. What is the recovery path with medallion architecture?',
                  options: ['Re-extract 3 months of data from the source system', 'Fix the Silver logic and reprocess from Bronze — Bronze has the raw source data intact', 'Manually correct the Silver rows with UPDATE statements', 'Delete Silver and start fresh from the source'],
                  answer: 1,
                  explanation: 'This is exactly why Bronze exists. Bronze has the untouched source data for the entire history. You fix the Silver transformation logic and reprocess from Bronze for the affected time window. No source re-extraction needed — and that\'s the architectural value of the raw landing layer.',
                },
                {
                  q: 'Where should SCD Type 2 (slowly changing dimension) logic be applied?',
                  options: ['Bronze — when the raw data first arrives', 'Silver — when applying business rules and transformations', 'Gold — when building the final dimension table for BI', 'It does not matter — any layer is correct'],
                  answer: 1,
                  explanation: 'SCD2 is a business rule about how to handle dimension changes. Business rules belong in Silver. Gold reads the Silver dimension table (which has the is_current flag and history) and uses it in aggregations. Bronze has the raw source records as received.',
                },
              ],
            },
            nextLesson: { id: 'incremental-loading', title: 'Incremental Loading', reason: 'Medallion architecture requires incremental loads at every layer — learn the watermark, MERGE, and AutoLoader patterns that make it efficient.' },
          },
        ],
      },
    ],
  },

  // ═══════════════════════════════════════════════════════════════════════════
  // PHASE 6 — Real-Time & Streaming Systems
  // ═══════════════════════════════════════════════════════════════════════════
  {
    id: 'lp-streaming',
    title: 'Phase 6 — Real-Time & Streaming Systems',
    shortTitle: 'Streaming',
    estimatedTime: '4–5 weeks',
    difficulty: 'Advanced',
    why: 'Fraud detection, recommendation systems, and operational dashboards all require real-time data. Streaming is the growing edge of DE.',
    companiesUse: 'Kafka topics, CDC feeds, Structured Streaming jobs, Event Hubs, real-time ML feature pipelines.',
    interviewImportance: 'Medium to high, critical for senior and platform-facing roles.',
    modules: [
      {
        id: 'streaming-foundations',
        title: 'Streaming Foundations',
        lessons: [
          {
            id: 'kafka',
            title: 'Apache Kafka',
            topicId: 'kafka-basics',
            label: 'Streaming',
            difficulty: 'Intermediate',
            body: 'Topics, producers, consumers, partitions, and consumer groups. Kafka is the backbone of most event-driven architectures.',
          },
          {
            id: 'cdc',
            title: 'Change Data Capture',
            topicId: 'cdc',
            label: 'Advanced',
            difficulty: 'Intermediate to Advanced',
            body: 'Capture every database change (insert, update, delete) as a stream event. Used for real-time sync, audit logs, and event-driven pipelines.',
          },
          {
            id: 'structured-streaming',
            title: 'Structured Streaming',
            topicId: 'structured-streaming',
            label: 'Spark Streaming',
            difficulty: 'Advanced',
            body: 'Process streaming data using Spark\'s familiar DataFrame API. Watermarks, triggers, output modes, and Delta Lake sinks.',
          },
          {
            id: 'event-hubs',
            title: 'Azure Event Hubs',
            topicId: 'event-hubs',
            label: 'Azure',
            difficulty: 'Intermediate',
            body: 'Azure\'s managed Kafka-compatible event streaming service. Ingestion at scale, integration with Databricks and Stream Analytics.',
          },
          {
            id: 'checkpointing',
            title: 'Checkpointing & Fault Tolerance',
            topicId: 'checkpointing',
            label: 'Reliability',
            difficulty: 'Advanced',
            body: 'Exactly-once semantics, checkpoint recovery, and offset management for reliable streaming pipelines.',
          },
        ],
      },
      {
        id: 'kafka-streaming-deep-dive',
        title: 'Kafka & Streaming Engineering',
        lessons: [
          {
            id: 'kafka-streaming-overview',
            title: 'Kafka & Streaming Deep Dive',
            topicId: 'kafka-streaming',
            label: 'Streaming',
            difficulty: 'Advanced',
            body: 'Kafka consumer groups, exactly-once semantics with checkpoints, Spark Structured Streaming, watermarking for late data, Delta Live Tables, and CDC streaming patterns.',
          },
          {
            id: 'kafka-exactly-once',
            title: 'Exactly-Once Streaming',
            topicId: 'kafka-streaming',
            label: 'Advanced',
            difficulty: 'Advanced',
            body: 'Idempotent producers + checkpoint directories + Delta MERGE — the three-part contract that prevents duplicates in production streaming pipelines.',
          },
          {
            id: 'kafka-watermarking',
            title: 'Watermarking & Late Data',
            topicId: 'kafka-streaming',
            label: 'Streaming',
            difficulty: 'Advanced',
            body: 'withWatermark() tells Spark how long to wait for late-arriving events before dropping them from stateful aggregations. Critical for correct window counts.',
          },
          {
            id: 'kafka-dlt',
            title: 'Delta Live Tables',
            topicId: 'kafka-streaming',
            label: 'Databricks',
            difficulty: 'Advanced',
            body: '@dlt.table and @dlt.expect_or_drop decorators, APPLY CHANGES INTO for CDC/SCD2, and DLT pipeline observability.',
          },
          {
            id: 'kafka-cdc-patterns',
            title: 'CDC Streaming Patterns',
            topicId: 'kafka-streaming',
            label: 'CDC',
            difficulty: 'Advanced',
            body: 'Debezium, Azure Event Hubs Change Feed, and Fabric Mirroring for capturing every database change as a stream event. Out-of-order event handling and schema evolution.',
          },
        ],
      },
    ],
  },

  // ═══════════════════════════════════════════════════════════════════════════
  // PHASE 7 — Projects & Career Preparation
  // ═══════════════════════════════════════════════════════════════════════════
  {
    id: 'lp-career',
    title: 'Phase 7 — Projects & Career Preparation',
    shortTitle: 'Projects & Career',
    estimatedTime: '4–6 weeks',
    difficulty: 'Portfolio',
    why: 'Learning is proven through projects. Interviews are won by those who can explain real systems they built. This phase turns your skills into career capital.',
    companiesUse: 'End-to-end pipelines, lakehouse projects, streaming demos, and resume-backed interview stories.',
    interviewImportance: 'Critical when you are actively applying. Projects become your interview stories.',
    modules: [
      {
        id: 'portfolio-projects',
        title: 'Portfolio Projects',
        lessons: [
          { id: 'batch-etl-project',    title: 'Batch ETL Pipeline',        section: 'projects', label: 'Project', tools: ['Python', 'SQL'] },
          { id: 'lakehouse-project',    title: 'Lakehouse on Databricks',    section: 'projects', label: 'Project', tools: ['Databricks', 'Delta Lake'] },
          { id: 'streaming-pipeline',  title: 'Real-Time Streaming Pipeline', section: 'projects', label: 'Project', tools: ['Kafka', 'Spark'] },
          { id: 'azure-e2e-project',   title: 'End-to-End Azure Pipeline',  section: 'projects', label: 'Project', tools: ['ADF', 'Databricks', 'ADLS'] },
          { id: 'cdc-pipeline',        title: 'CDC Pipeline',               section: 'projects', label: 'Project', tools: ['Debezium', 'Delta'] },
        ],
      },
      {
        id: 'interview-readiness',
        title: 'Interview Prep',
        lessons: [
          { id: 'sql-interview',       title: 'SQL Interview Questions',  section: 'interview-prep', label: 'Interview' },
          { id: 'spark-scenarios',     title: 'Spark & PySpark Scenarios', section: 'interview-prep', label: 'Interview' },
          { id: 'system-design-nav',   title: 'System Design for DE',     section: 'interview-prep', label: 'Interview' },
          { id: 'resume-prep',         title: 'Resume & LinkedIn',        section: 'resume-output',  label: 'Career'    },
          { id: 'mock-interviews',     title: 'Mock Interviews',          section: 'war-room',       label: 'Career'    },
        ],
      },
      {
        id: 'system-design-module',
        title: 'System Design for Data Engineers',
        lessons: [
          {
            id: 'system-design-overview',
            title: 'System Design Overview',
            topicId: 'system-design',
            label: 'Architecture',
            difficulty: 'Advanced',
            body: 'Design production-grade data architectures: Lambda vs Kappa, petabyte ingestion, multi-tenant isolation, GDPR erasure, and data observability. The senior DE interview round.',
          },
          {
            id: 'system-design-streaming',
            title: 'Streaming Analytics Architecture',
            topicId: 'system-design',
            label: 'Architecture',
            difficulty: 'Advanced',
            body: 'Design a real-time streaming analytics platform on Azure: Event Hubs + Spark Structured Streaming + Delta Lake + Power BI Direct Lake. Lambda vs Kappa tradeoffs.',
          },
          {
            id: 'system-design-fraud',
            title: 'Fraud Detection Pipeline',
            topicId: 'system-design',
            label: 'Architecture',
            difficulty: 'Advanced',
            body: 'High-throughput fraud detection: Kafka ingestion → Structured Streaming → Redis feature store → ML serving → Delta audit trail. <500ms SLA at 100K TPS.',
          },
          {
            id: 'system-design-observability',
            title: 'Data Observability Architecture',
            topicId: 'system-design',
            label: 'Architecture',
            difficulty: 'Advanced',
            body: 'Four pillars: freshness, volume, distribution, and schema. Build a monitoring layer using Great Expectations + PagerDuty + Grafana for a production data platform.',
          },
          {
            id: 'system-design-cdc',
            title: 'CDC & Migration Patterns',
            topicId: 'system-design',
            label: 'Architecture',
            difficulty: 'Advanced',
            body: 'Fabric Mirroring vs Debezium vs Azure Event Hubs Change Feed. Schema evolution handling, backfill strategies, and zero-downtime cutover patterns.',
          },
        ],
      },
    ],
  },
];

const legacyLessons = legacyLearningPathPhases.flatMap(phase =>
  phase.modules.flatMap(module =>
    module.lessons.map(lesson => ({ ...lesson, _legacyPhaseId: phase.id, _legacyModuleId: module.id }))
  )
);

const legacyLessonById = new Map(legacyLessons.map(lesson => [lesson.id, lesson]));
const legacyLessonsByTopic = legacyLessons.reduce((acc, lesson) => {
  if (!lesson.topicId) return acc;
  if (!acc.has(lesson.topicId)) acc.set(lesson.topicId, []);
  acc.get(lesson.topicId).push(lesson);
  return acc;
}, new Map());

function hydrateLesson(templateLesson) {
  const legacyLesson = legacyLessonById.get(templateLesson.id)
    ?? legacyLessonsByTopic.get(templateLesson.topicId)?.[0]
    ?? null;

  return {
    ...(legacyLesson ?? {}),
    ...templateLesson,
    guide: templateLesson.guide ?? legacyLesson?.guide ?? null,
    body: templateLesson.body ?? legacyLesson?.body ?? '',
    label: templateLesson.label ?? legacyLesson?.label ?? null,
    difficulty: templateLesson.difficulty ?? legacyLesson?.difficulty ?? null,
    nextLesson: templateLesson.nextLesson ?? legacyLesson?.nextLesson ?? null,
  };
}

export const learningPathPhases = seniorAzureLearningPathTemplate.map(phase => ({
  ...phase,
  modules: phase.modules.map(module => ({
    ...module,
    lessons: module.lessons.map(hydrateLesson),
  })),
}));

export const aiLearningPathPhases = aiLearningPathTemplate.map(phase => ({
  ...phase,
  modules: phase.modules.map(module => ({
    ...module,
    lessons: module.lessons.map(hydrateLesson),
  })),
}));

export const optionalTechnologyPhases = optionalTechnologiesTemplate.map(phase => ({
  ...phase,
  modules: phase.modules.map(module => ({
    ...module,
    lessons: module.lessons.map(hydrateLesson),
  })),
}));

export function getLearningPathLessons() {
  return [...learningPathPhases, ...aiLearningPathPhases, ...optionalTechnologyPhases].flatMap(phase =>
    phase.modules.flatMap(module =>
      module.lessons.map(lesson => ({ ...lesson, phaseId: phase.id, moduleId: module.id }))
    )
  );
}
