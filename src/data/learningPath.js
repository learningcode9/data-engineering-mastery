// ─── Learning Path — 7 progressive phases ─────────────────────────────────────
// Phase 1: all orientation guide lessons — never locked, always open.
// Phases 2–7: topic-based lessons, unlock sequentially as phases complete.

export const learningPathPhases = [

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
                title: 'Library vs Warehouse',
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
          },
          {
            id: 'data-quality',
            title: 'Data Quality',
            topicId: 'data-quality',
            label: 'Quality',
            difficulty: 'Intermediate',
            body: 'Null checks, schema validation, duplicate detection, and alerting. Data quality is the line between trusted and useless data.',
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
          },
          {
            id: 'medallion-architecture',
            title: 'Medallion Architecture',
            topicId: 'medallion-architecture',
            label: 'Architecture',
            difficulty: 'Intermediate',
            body: 'Bronze → Silver → Gold. Design a lakehouse that grows cleanly and supports multiple downstream consumers.',
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
        title: 'Interview Preparation',
        lessons: [
          { id: 'sql-interview',       title: 'SQL Interview Questions',  section: 'interview-prep', label: 'Interview' },
          { id: 'spark-scenarios',     title: 'Spark & PySpark Scenarios', section: 'interview-prep', label: 'Interview' },
          { id: 'system-design',       title: 'System Design for DE',     section: 'interview-prep', label: 'Interview' },
          { id: 'resume-prep',         title: 'Resume & LinkedIn',        section: 'resume-output',  label: 'Career'    },
          { id: 'mock-interviews',     title: 'Mock Interviews',          section: 'war-room',       label: 'Career'    },
        ],
      },
    ],
  },
];

export function getLearningPathLessons() {
  return learningPathPhases.flatMap(phase =>
    phase.modules.flatMap(module =>
      module.lessons.map(lesson => ({ ...lesson, phaseId: phase.id, moduleId: module.id }))
    )
  );
}
