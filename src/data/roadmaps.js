import { seniorAzureRoadmapTrack } from './seniorAzurePath.js';

const legacyRoadmapTracks = [
  {
    id: 'sql-engineer',
    title: 'SQL Engineer',
    icon: '🗄️',
    color: '#2f756e',
    description: 'Master SQL from basic queries to production-grade data patterns. Build the query skills every data engineer depends on daily.',
    duration: '6–8 weeks',
    difficulty: 'Beginner → Intermediate',
    prerequisites: ['Basic computer literacy', 'Familiarity with spreadsheets'],
    skills: [
      'SELECT, WHERE, GROUP BY, ORDER BY',
      'JOINs (INNER, LEFT, RIGHT, FULL)',
      'Window functions',
      'CTEs and subqueries',
      'Indexes and query plans',
      'Stored procedures and views',
      'Partitioning and performance tuning',
      'Slowly Changing Dimensions'
    ],
    phases: [
      {
        id: 'sql-foundations',
        title: 'SQL Foundations',
        duration: '1–2 weeks',
        description: 'Learn core SQL syntax, filtering, sorting, and aggregation on single tables.',
        skills: ['SELECT statements', 'WHERE clauses', 'GROUP BY / HAVING', 'ORDER BY', 'Basic aggregate functions'],
        milestones: [
          'Write a query that filters, sorts, and paginates a 1M-row table',
          'Aggregate sales data by region and month using GROUP BY',
          'Use HAVING to filter aggregated results by threshold',
          'Distinguish NULL handling in WHERE vs HAVING clauses'
        ],
        topicIds: ['sql']
      },
      {
        id: 'intermediate-sql',
        title: 'Intermediate SQL',
        duration: '2 weeks',
        description: 'Join multiple tables, write subqueries, and use common table expressions.',
        skills: ['INNER/LEFT/RIGHT/FULL JOINs', 'Subqueries', 'CTEs', 'UNION / INTERSECT / EXCEPT', 'CASE expressions'],
        milestones: [
          'Join 3 tables to produce a denormalized reporting dataset',
          'Replace a nested subquery with an equivalent CTE',
          'Use CASE WHEN to bucket continuous values into categories',
          'Identify and fix a Cartesian product caused by a missing JOIN condition'
        ],
        topicIds: ['sql']
      },
      {
        id: 'query-optimization',
        title: 'Query Optimization',
        duration: '2 weeks',
        description: 'Read execution plans, add indexes, and rewrite slow queries for production workloads.',
        skills: ['EXPLAIN / EXPLAIN ANALYZE', 'B-tree and covering indexes', 'Partitioning', 'Query rewrites', 'Statistics and cardinality'],
        milestones: [
          'Reduce a 30-second query to under 2 seconds using an index',
          'Interpret an execution plan and identify a full-table scan',
          'Partition a 500M-row table by date and verify partition pruning',
          'Rewrite a correlated subquery as a JOIN for 10x speedup'
        ],
        topicIds: ['sql']
      },
      {
        id: 'production-data-patterns',
        title: 'Production Data Patterns',
        duration: '2 weeks',
        description: 'Apply advanced SQL patterns used in real data warehouses and analytics engineering.',
        skills: ['Window functions', 'Slowly Changing Dimensions', 'Incremental loads', 'Views and materialized views', 'Stored procedures'],
        milestones: [
          'Implement SCD Type 2 with effective_date and is_current columns',
          'Write an incremental load using MAX(updated_at) watermark logic',
          'Build a running total and 7-day rolling average with window functions',
          'Create a materialized view and schedule a refresh job'
        ],
        topicIds: ['sql']
      }
    ]
  },
  {
    id: 'python-de',
    title: 'Python for Data Engineering',
    icon: '🐍',
    color: '#3776ab',
    description: 'Go from Python basics to building production ETL pipelines. Learn the libraries and patterns data engineers use every day.',
    duration: '8–10 weeks',
    difficulty: 'Beginner → Intermediate',
    prerequisites: ['Basic programming concepts', 'Command-line familiarity'],
    skills: [
      'Python syntax and data structures',
      'File I/O (CSV, JSON, Parquet)',
      'pandas and polars',
      'Requests and REST APIs',
      'SQLAlchemy and database connectivity',
      'Error handling and logging',
      'Unit testing with pytest',
      'Scheduling with Airflow'
    ],
    phases: [
      {
        id: 'python-fundamentals',
        title: 'Python Fundamentals',
        duration: '1–2 weeks',
        description: 'Learn Python syntax, built-in data structures, and control flow as applied to data tasks.',
        skills: ['Variables and types', 'Lists, dicts, sets, tuples', 'Loops and comprehensions', 'Functions and modules', 'Exception handling'],
        milestones: [
          'Parse a JSON config file and print each key-value pair',
          'Write a function that deduplicates a list of dicts by a key',
          'Handle FileNotFoundError and log a meaningful message',
          'Use a list comprehension to filter and transform a dataset'
        ],
        topicIds: ['python']
      },
      {
        id: 'file-processing',
        title: 'File Processing',
        duration: '2 weeks',
        description: 'Read, write, and transform files in CSV, JSON, and Parquet formats at scale.',
        skills: ['csv module', 'json module', 'pyarrow / fastparquet', 'pathlib', 'glob for batch files'],
        milestones: [
          'Read 100 CSV files from a folder and concatenate into one dataset',
          'Convert a CSV file to Parquet with correct schema inference',
          'Write a script that processes only files modified in the last 24h',
          'Profile memory usage reading a 1GB CSV vs. its Parquet equivalent'
        ],
        topicIds: ['python']
      },
      {
        id: 'etl-pipelines',
        title: 'ETL Pipelines',
        duration: '2–3 weeks',
        description: 'Build end-to-end extract-transform-load pipelines with proper error handling and logging.',
        skills: ['SQLAlchemy', 'psycopg2 / pyodbc', 'Logging module', 'Retry logic', 'Idempotent writes (UPSERT)'],
        milestones: [
          'Build a pipeline that extracts from Postgres and loads into a data warehouse',
          'Implement exponential backoff retry on transient DB connection errors',
          'Write an upsert using INSERT ... ON CONFLICT DO UPDATE',
          'Add structured JSON logging with timestamps and pipeline run IDs'
        ],
        topicIds: ['python']
      },
      {
        id: 'apis-external-data',
        title: 'APIs & External Data',
        duration: '2 weeks',
        description: 'Ingest data from REST APIs, handle pagination, and manage authentication securely.',
        skills: ['requests library', 'OAuth2 and API keys', 'Pagination patterns', 'Rate limiting', 'Webhook receivers (Flask)'],
        milestones: [
          'Paginate through all records of a REST API using cursor-based pagination',
          'Store API credentials in environment variables, never in code',
          'Respect a rate limit by sleeping between requests automatically',
          'Write a webhook receiver that validates HMAC signatures'
        ],
        topicIds: ['python']
      },
      {
        id: 'pandas-for-de',
        title: 'Pandas for Data Engineering',
        duration: '2 weeks',
        description: 'Use pandas for data profiling, cleaning, and transformation tasks in a DE context.',
        skills: ['DataFrame operations', 'merge and groupby', 'Data type casting', 'Missing value handling', 'Memory optimization'],
        milestones: [
          'Profile a dataset: null counts, cardinality, and value distributions',
          'Merge two DataFrames and flag unmatched rows from each side',
          'Downcast numeric columns to reduce DataFrame memory by 40%+',
          'Write a reusable data quality function that returns a pass/fail report'
        ],
        topicIds: ['python']
      }
    ]
  },
  {
    id: 'azure-de',
    title: 'Azure Data Engineer',
    icon: '☁️',
    color: '#0078d4',
    description: 'Build cloud-native data pipelines on Microsoft Azure from ingestion to analytics. Aligned with the DP-203 certification exam objectives.',
    duration: '10–12 weeks',
    difficulty: 'Intermediate → Advanced',
    prerequisites: ['SQL proficiency', 'Basic Python', 'Cloud computing concepts'],
    skills: [
      'Azure Data Lake Storage Gen2',
      'Azure Data Factory pipelines',
      'Azure Databricks and PySpark',
      'Azure Synapse Analytics',
      'Azure Event Hubs',
      'Azure Key Vault',
      'Delta Lake on Azure',
      'DP-203 exam topics'
    ],
    phases: [
      {
        id: 'azure-fundamentals',
        title: 'Azure Fundamentals',
        duration: '1–2 weeks',
        description: 'Provision core Azure services, configure ADLS Gen2, and understand the Azure data platform landscape.',
        skills: ['Azure portal navigation', 'ADLS Gen2', 'Azure Blob Storage', 'IAM and RBAC', 'Azure Key Vault'],
        milestones: [
          'Provision an ADLS Gen2 account with hierarchical namespace enabled',
          'Create bronze/silver/gold containers with appropriate RBAC roles',
          'Store a connection string in Key Vault and retrieve it via a Managed Identity',
          'Upload and list files in ADLS Gen2 using the Azure CLI'
        ],
        topicIds: ['azure-data-factory']
      },
      {
        id: 'azure-data-factory',
        title: 'Azure Data Factory',
        duration: '2–3 weeks',
        description: 'Build ADF pipelines to ingest, copy, and orchestrate data movements across Azure services.',
        skills: ['Linked Services', 'Datasets', 'Copy Activity', 'Mapping Data Flows', 'Triggers and scheduling', 'Pipeline parameters'],
        milestones: [
          'Build a pipeline that copies data from an HTTP source to ADLS Gen2',
          'Parameterize a pipeline to run for any date partition dynamically',
          'Use a Mapping Data Flow to join two datasets and write to Parquet',
          'Configure a tumbling window trigger for nightly incremental loads'
        ],
        topicIds: ['azure-data-factory']
      },
      {
        id: 'azure-databricks',
        title: 'Azure Databricks',
        duration: '3 weeks',
        description: 'Process large datasets with PySpark on Databricks and build Delta Lake tables.',
        skills: ['Databricks clusters', 'Notebooks and Jobs', 'PySpark DataFrames', 'Delta Lake', 'Unity Catalog basics'],
        milestones: [
          'Attach a Databricks cluster to ADLS Gen2 using a service principal',
          'Read raw CSV from bronze layer and write cleaned Delta table to silver',
          'Schedule a Databricks Job with email alerts on failure',
          'Use MERGE INTO to upsert records into a Delta table'
        ],
        topicIds: ['azure-databricks']
      },
      {
        id: 'synapse-analytics',
        title: 'Synapse Analytics',
        duration: '2 weeks',
        description: 'Query data at scale using Synapse serverless SQL and dedicated SQL pools.',
        skills: ['Synapse Studio', 'Serverless SQL pool', 'Dedicated SQL pool', 'External tables over ADLS', 'PolyBase and COPY INTO'],
        milestones: [
          'Create an external table over Parquet files in ADLS Gen2 using OPENROWSET',
          'Load 10GB of data into a dedicated SQL pool with COPY INTO',
          'Implement a star schema with distribution and index best practices',
          'Write a Synapse Pipeline that chains an ADF copy with a SQL notebook'
        ],
        topicIds: ['azure-data-factory', 'azure-databricks']
      },
      {
        id: 'production-dp203',
        title: 'Production & DP-203',
        duration: '2–3 weeks',
        description: 'Apply monitoring, security, and optimization patterns; review DP-203 exam objectives.',
        skills: ['Azure Monitor and Log Analytics', 'Pipeline alerting', 'Cost optimization', 'DP-203 practice exams', 'End-to-end project'],
        milestones: [
          'Set up Azure Monitor alerts for ADF pipeline failures',
          'Implement column-level encryption for PII in Synapse',
          'Score 80%+ on two full DP-203 practice exams',
          'Deploy a complete medallion architecture pipeline end-to-end'
        ],
        topicIds: ['azure-data-factory', 'azure-databricks']
      }
    ]
  },
  {
    id: 'pyspark-engineer',
    title: 'PySpark Engineer',
    icon: '⚡',
    color: '#e25a1c',
    description: 'Master distributed data processing with Apache Spark and PySpark. Learn to build scalable pipelines, tune performance, and work with Delta Lake.',
    duration: '8–10 weeks',
    difficulty: 'Intermediate → Advanced',
    prerequisites: ['Python proficiency', 'SQL knowledge', 'Basic Linux/terminal'],
    skills: [
      'Spark architecture (driver, executors, DAG)',
      'PySpark DataFrames and Datasets',
      'Spark SQL',
      'Delta Lake',
      'Broadcast joins and partitioning',
      'Spark UI and tuning',
      'Structured Streaming',
      'Databricks platform'
    ],
    phases: [
      {
        id: 'spark-architecture',
        title: 'Spark Architecture',
        duration: '1–2 weeks',
        description: 'Understand how Spark executes jobs: the driver, executors, stages, tasks, and DAG scheduler.',
        skills: ['SparkContext / SparkSession', 'RDDs vs DataFrames', 'Transformations vs Actions', 'Lazy evaluation', 'Spark UI'],
        milestones: [
          'Explain the difference between a transformation and an action',
          'Read the DAG for a 3-stage job in the Spark UI',
          'Count the tasks in a stage and explain why that number exists',
          'Trigger and inspect a shuffle by doing a groupBy on a large dataset'
        ],
        topicIds: ['pyspark']
      },
      {
        id: 'dataframe-operations',
        title: 'DataFrame Operations',
        duration: '2–3 weeks',
        description: 'Write production-quality DataFrame code for filtering, joining, aggregating, and transforming data.',
        skills: ['select, filter, withColumn', 'join types and strategies', 'groupBy / agg', 'Window functions', 'UDFs vs built-ins'],
        milestones: [
          'Join two DataFrames and verify row counts match expectations',
          'Replace a Python UDF with an equivalent built-in function for 5x speedup',
          'Compute a 7-day rolling average using a Window spec',
          'Write a reusable transformation function with schema validation'
        ],
        topicIds: ['pyspark']
      },
      {
        id: 'delta-lake',
        title: 'Delta Lake',
        duration: '2 weeks',
        description: 'Store data reliably with ACID transactions, schema enforcement, and time travel using Delta Lake.',
        skills: ['Delta table creation', 'MERGE INTO (upsert)', 'Time travel', 'Schema evolution', 'Vacuum and optimize'],
        milestones: [
          'Write a MERGE INTO statement that handles inserts, updates, and deletes',
          'Query a Delta table as of 7 days ago using VERSION AS OF',
          'Enable schema evolution and add a new column without breaking readers',
          'Run OPTIMIZE with Z-ORDER on a query predicate column and measure speedup'
        ],
        topicIds: ['pyspark', 'azure-databricks']
      },
      {
        id: 'performance-tuning',
        title: 'Performance Tuning',
        duration: '2 weeks',
        description: 'Diagnose and fix common Spark performance problems: skew, spill, and inefficient shuffles.',
        skills: ['Partition sizing', 'Broadcast joins', 'Salting for skew', 'Caching and persistence', 'Executor and memory config'],
        milestones: [
          'Detect data skew in the Spark UI and fix it with salting',
          'Convert a sort-merge join to a broadcast join and confirm speedup',
          'Tune spark.sql.shuffle.partitions to reduce task overhead by 50%',
          'Eliminate spill-to-disk by adjusting executor memory configuration'
        ],
        topicIds: ['pyspark']
      },
      {
        id: 'structured-streaming',
        title: 'Structured Streaming',
        duration: '2 weeks',
        description: 'Process real-time data streams using Spark Structured Streaming with Kafka and Delta Lake sinks.',
        skills: ['readStream / writeStream', 'Kafka source', 'Trigger intervals', 'Checkpointing', 'Watermarking for late data'],
        milestones: [
          'Read from a Kafka topic and write to a Delta table with checkpointing',
          'Implement a 5-minute tumbling window aggregation on an event stream',
          'Handle late-arriving events with a 10-minute watermark',
          'Monitor a streaming query via StreamingQueryListener and alert on lag'
        ],
        topicIds: ['pyspark', 'azure-databricks']
      }
    ]
  },
  {
    id: 'etl-developer',
    title: 'ETL Developer',
    icon: '🔄',
    color: '#7c3aed',
    description: 'Design and build robust extract-transform-load pipelines that move data reliably from sources to destinations. Covers patterns, tools, and orchestration.',
    duration: '7–9 weeks',
    difficulty: 'Beginner → Intermediate',
    prerequisites: ['SQL knowledge', 'Basic Python or scripting experience'],
    skills: [
      'ETL vs ELT patterns',
      'Data extraction (APIs, databases, files)',
      'Data transformation and cleansing',
      'Loading strategies (full, incremental, CDC)',
      'Apache Airflow orchestration',
      'Data quality checks',
      'Error handling and alerting',
      'AWS Glue and Azure Data Factory'
    ],
    phases: [
      {
        id: 'etl-fundamentals',
        title: 'ETL Fundamentals',
        duration: '1–2 weeks',
        description: 'Understand ETL vs ELT, pipeline architecture patterns, and the tools of the trade.',
        skills: ['ETL vs ELT', 'Batch vs streaming', 'Pipeline stages', 'Data lineage concepts', 'Idempotency'],
        milestones: [
          'Draw a complete ETL architecture diagram for a given use case',
          'Explain the trade-offs between ETL and ELT with a concrete example',
          'Identify a non-idempotent pipeline and describe how to fix it',
          'Map a source-to-target schema for a simple dimensional model'
        ],
        topicIds: ['python', 'sql']
      },
      {
        id: 'data-extraction',
        title: 'Data Extraction',
        duration: '2 weeks',
        description: 'Extract data reliably from relational databases, REST APIs, flat files, and cloud storage.',
        skills: ['JDBC / ODBC connectors', 'REST API ingestion', 'CDC with Debezium', 'Incremental extraction', 'Schema detection'],
        milestones: [
          'Extract an incremental load using a high-watermark timestamp column',
          'Set up Debezium to capture change events from a Postgres table',
          'Ingest all pages of a paginated REST API into a staging table',
          'Handle schema drift by detecting new columns and logging a warning'
        ],
        topicIds: ['python', 'aws-glue', 'azure-data-factory']
      },
      {
        id: 'transformation-patterns',
        title: 'Transformation Patterns',
        duration: '2–3 weeks',
        description: 'Apply standard transformation patterns: deduplication, normalization, aggregation, and business rule application.',
        skills: ['Deduplication strategies', 'Data type coercion', 'Null handling', 'Lookup enrichment', 'SCD Type 1 and 2'],
        milestones: [
          'Deduplicate a dataset using ROW_NUMBER() with a defined key',
          'Apply SCD Type 2 logic to track historical dimension changes',
          'Enrich transactions with a lookup table using a broadcast join',
          'Write a data quality transform that quarantines invalid rows'
        ],
        topicIds: ['sql', 'python', 'pyspark']
      },
      {
        id: 'orchestration-monitoring',
        title: 'Orchestration & Monitoring',
        duration: '2–3 weeks',
        description: 'Schedule, orchestrate, and monitor ETL pipelines using Apache Airflow and cloud-native tools.',
        skills: ['Apache Airflow DAGs', 'Task dependencies', 'Airflow sensors', 'Retry and SLA settings', 'Alerting with PagerDuty/Slack'],
        milestones: [
          'Write an Airflow DAG with task dependencies and a daily schedule',
          'Use an S3KeySensor to wait for an upstream file before transforming',
          'Configure SLA misses to send a Slack notification via webhook',
          'Implement pipeline metadata logging to a runs audit table'
        ],
        topicIds: ['python', 'aws-glue', 'azure-data-factory']
      }
    ]
  },
  {
    id: 'lakehouse-engineer',
    title: 'Lakehouse Engineer',
    icon: '🏠',
    color: '#0ea5e9',
    description: 'Build a modern data lakehouse using the medallion architecture on Delta Lake or Apache Iceberg. Covers ingestion through serving and governance.',
    duration: '10–12 weeks',
    difficulty: 'Intermediate → Advanced',
    prerequisites: ['PySpark basics', 'SQL proficiency', 'Cloud storage familiarity'],
    skills: [
      'Medallion architecture (bronze/silver/gold)',
      'Delta Lake and Apache Iceberg',
      'Unity Catalog / AWS Lake Formation',
      'Data quality with Great Expectations',
      'dbt for transformation layer',
      'Incremental and CDC patterns',
      'Table formats and file layout',
      'Serving layer design'
    ],
    phases: [
      {
        id: 'lakehouse-concepts',
        title: 'Lakehouse Concepts',
        duration: '1 week',
        description: 'Understand the lakehouse paradigm, table formats, and why it supersedes the data warehouse + data lake split.',
        skills: ['Lakehouse vs data warehouse', 'Delta Lake vs Iceberg vs Hudi', 'ACID on object storage', 'Medallion architecture', 'File formats: Parquet, ORC, Avro'],
        milestones: [
          'Compare Delta Lake, Iceberg, and Hudi in a written architecture decision record',
          'Explain how ACID transactions work on top of object storage',
          'Sketch a medallion architecture for a given business domain',
          'Identify when to use Parquet vs Avro for a given access pattern'
        ],
        topicIds: ['pyspark', 'azure-databricks']
      },
      {
        id: 'bronze-layer',
        title: 'Bronze Layer',
        duration: '2 weeks',
        description: 'Land raw data as-is from all sources into the bronze layer with full auditability.',
        skills: ['Auto Loader (Databricks)', 'Schema inference and evolution', 'Ingestion metadata', 'Idempotent landing', 'File quarantine'],
        milestones: [
          'Set up Auto Loader to continuously ingest new files from cloud storage',
          'Add ingestion metadata columns: source, file_name, ingest_timestamp',
          'Quarantine malformed records into a _bad_records subfolder',
          'Verify idempotency by re-running the ingestion and confirming no duplicates'
        ],
        topicIds: ['pyspark', 'azure-databricks', 'aws-glue']
      },
      {
        id: 'silver-layer',
        title: 'Silver Layer',
        duration: '2–3 weeks',
        description: 'Clean, deduplicate, and conform bronze data into validated, typed silver tables.',
        skills: ['Data type casting', 'Deduplication with MERGE', 'Schema enforcement', 'Great Expectations checks', 'CDC handling'],
        milestones: [
          'Apply MERGE INTO to upsert CDC events into a silver Delta table',
          'Enforce schema with Delta using mergeSchema=False to catch drift',
          'Run Great Expectations suite validating nullability and value ranges',
          'Write a deduplication job that is safe to re-run on overlapping windows'
        ],
        topicIds: ['pyspark', 'azure-databricks']
      },
      {
        id: 'gold-layer-serving',
        title: 'Gold Layer & Serving',
        duration: '2–3 weeks',
        description: 'Build business-ready aggregated and dimensional models in the gold layer for BI and ML.',
        skills: ['Star schema design', 'dbt models', 'Materialized aggregates', 'Query optimization for BI', 'Serving via SQL endpoint'],
        milestones: [
          'Model a star schema fact and dimension in dbt with tests and docs',
          'Build a pre-aggregated daily summary table reducing BI query time by 80%',
          'Publish a gold table as a Databricks SQL endpoint for a BI tool',
          'Write dbt tests covering uniqueness, not-null, and referential integrity'
        ],
        topicIds: ['sql', 'pyspark', 'azure-databricks']
      },
      {
        id: 'governance-production',
        title: 'Governance & Production',
        duration: '2 weeks',
        description: 'Apply data governance, access control, lineage tracking, and production readiness to the lakehouse.',
        skills: ['Unity Catalog / Lake Formation', 'Row and column-level security', 'Data lineage', 'Cost monitoring', 'SLA and alerting'],
        milestones: [
          'Configure Unity Catalog with row-level security on a sensitive table',
          'View and verify end-to-end data lineage in Unity Catalog UI',
          'Set up cost alerts for cloud storage and compute exceeding a budget',
          'Document the lakehouse runbook covering failure recovery procedures'
        ],
        topicIds: ['azure-databricks', 'aws-glue']
      }
    ]
  },
  {
    id: 'streaming-engineer',
    title: 'Streaming Engineer',
    icon: '🌊',
    color: '#06b6d4',
    description: 'Build real-time data pipelines using Apache Kafka, Spark Structured Streaming, and Azure Streaming Services. Process events with low latency at scale.',
    duration: '8–10 weeks',
    difficulty: 'Intermediate → Advanced',
    prerequisites: ['Python proficiency', 'SQL knowledge', 'Basic distributed systems concepts'],
    skills: [
      'Apache Kafka producers and consumers',
      'Kafka topics, partitions, and consumer groups',
      'Spark Structured Streaming',
      'Azure Event Hubs',
      'Azure Stream Analytics',
      'Windowing and watermarking',
      'Exactly-once semantics',
      'Kafka Connect and Schema Registry'
    ],
    phases: [
      {
        id: 'streaming-fundamentals',
        title: 'Streaming Fundamentals',
        duration: '1–2 weeks',
        description: 'Understand event streaming concepts: event time vs processing time, delivery guarantees, and stream topologies.',
        skills: ['Event time vs processing time', 'At-least-once / exactly-once', 'Backpressure', 'Stateful vs stateless processing', 'Stream vs batch trade-offs'],
        milestones: [
          'Explain the difference between event time and processing time with an example',
          'Describe when to choose at-least-once vs exactly-once semantics',
          'Draw a stream processing topology for a click-stream aggregation use case',
          'Identify a backpressure scenario and its downstream effect'
        ],
        topicIds: ['pyspark']
      },
      {
        id: 'apache-kafka',
        title: 'Apache Kafka',
        duration: '2–3 weeks',
        description: 'Set up Kafka, produce and consume messages, configure topics, and use Kafka Connect for integrations.',
        skills: ['Kafka cluster setup', 'Producer and Consumer APIs', 'Topic partitioning', 'Consumer groups and offsets', 'Kafka Connect', 'Schema Registry with Avro'],
        milestones: [
          'Produce and consume 1M messages and measure end-to-end latency',
          'Configure a topic with 12 partitions and observe parallel consumer throughput',
          'Deploy a Kafka Connect JDBC source connector for a Postgres table',
          'Register an Avro schema in Confluent Schema Registry and enforce compatibility'
        ],
        topicIds: ['pyspark']
      },
      {
        id: 'spark-structured-streaming',
        title: 'Spark Structured Streaming',
        duration: '2–3 weeks',
        description: 'Process Kafka streams with Spark Structured Streaming, apply windowing, and write to Delta Lake.',
        skills: ['readStream from Kafka', 'Tumbling and sliding windows', 'Watermarks for late data', 'Delta Lake sink', 'Trigger.ProcessingTime'],
        milestones: [
          'Stream Kafka JSON events into a Delta table with exactly-once semantics',
          'Compute a 5-minute tumbling window count and write results continuously',
          'Apply a 2-minute watermark and verify late events are correctly dropped',
          'Monitor streaming query progress using query.lastProgress'
        ],
        topicIds: ['pyspark', 'azure-databricks']
      },
      {
        id: 'azure-streaming-services',
        title: 'Azure Streaming Services',
        duration: '2–3 weeks',
        description: 'Use Azure Event Hubs and Azure Stream Analytics to build managed cloud streaming pipelines.',
        skills: ['Azure Event Hubs', 'Event Hubs Kafka endpoint', 'Azure Stream Analytics', 'Stream Analytics windowing', 'Integration with Blob Storage and Power BI'],
        milestones: [
          'Send events to Azure Event Hubs using the Kafka producer API',
          'Create a Stream Analytics job that aggregates events in a 1-minute window',
          'Write Stream Analytics output to ADLS Gen2 in Parquet format',
          'Connect a Stream Analytics output to a Power BI streaming dataset'
        ],
        topicIds: ['azure-data-factory', 'azure-databricks']
      }
    ]
  },
  {
    id: 'interview-track',
    title: 'Interview Preparation',
    icon: '🎯',
    color: '#dc2626',
    description: 'Prepare systematically for data engineering interviews covering SQL, coding, system design, and behavioral questions. Structured for 4–6 weeks of focused prep.',
    duration: '4–6 weeks',
    difficulty: 'Intermediate → Advanced',
    prerequisites: ['SQL proficiency', 'Python or Scala experience', 'Familiarity with data pipelines'],
    skills: [
      'Advanced SQL (window functions, optimization)',
      'Python coding challenges',
      'Data pipeline system design',
      'Distributed systems fundamentals',
      'Behavioral question frameworks (STAR)',
      'Mock interview practice',
      'Resume and portfolio review',
      'Salary negotiation'
    ],
    phases: [
      {
        id: 'sql-deep-dive',
        title: 'SQL Deep Dive',
        duration: '1 week',
        description: 'Master the SQL patterns most commonly tested in data engineering interviews: window functions, recursive CTEs, and query optimization.',
        skills: ['Window functions (RANK, DENSE_RANK, LAG/LEAD)', 'Recursive CTEs', 'Query optimization', 'Tricky NULLs and edge cases', 'Interview-specific patterns'],
        milestones: [
          'Solve 20 LeetCode SQL medium/hard problems without hints',
          'Write a recursive CTE to traverse a hierarchical org chart',
          'Optimize a slow query given only EXPLAIN output, no data access',
          'Find the Nth highest salary and running total in under 2 minutes each'
        ],
        topicIds: ['sql']
      },
      {
        id: 'coding-challenges',
        title: 'Coding Challenges',
        duration: '1–2 weeks',
        description: 'Practice Python coding questions focused on data manipulation, algorithms, and DE-specific problems.',
        skills: ['Data structure manipulation', 'Sorting and searching', 'HashMap and set patterns', 'Two-pointer and sliding window', 'DE-specific: parsing, ETL logic'],
        milestones: [
          'Solve 30 LeetCode easy/medium problems in Python within 25 minutes each',
          'Implement a Python function to flatten nested JSON structures',
          'Write a function to detect and remove duplicate events by ID and timestamp',
          'Complete a take-home data pipeline challenge end-to-end in under 3 hours'
        ],
        topicIds: ['python']
      },
      {
        id: 'system-design',
        title: 'System Design',
        duration: '1–2 weeks',
        description: 'Design scalable data systems under interview conditions: ingestion, storage, processing, and serving layers.',
        skills: ['Designing data pipelines at scale', 'CAP theorem and consistency', 'Lambda vs Kappa architecture', 'Schema design trade-offs', 'Cost vs latency trade-offs'],
        milestones: [
          'Design a real-time fraud detection pipeline within a 45-minute mock session',
          'Architect a data warehouse for a ride-sharing company with 10B daily events',
          'Explain the trade-offs between a Lambda and Kappa architecture verbally',
          'Draw a complete system design diagram with components and data flows'
        ],
        topicIds: ['pyspark', 'azure-databricks', 'aws-glue']
      },
      {
        id: 'behavioral-communication',
        title: 'Behavioral & Communication',
        duration: '1 week',
        description: 'Craft compelling STAR stories, present technical work clearly, and negotiate offers confidently.',
        skills: ['STAR framework', 'Technical storytelling', 'Handling failures and setbacks', 'Questions to ask interviewers', 'Offer evaluation and negotiation'],
        milestones: [
          'Write 8 STAR stories covering impact, failure, conflict, and leadership',
          'Record a 5-minute mock answer and identify 3 areas for improvement',
          'Prepare a list of 10 thoughtful questions for interviewers',
          'Research market compensation range for target roles and locations'
        ],
        topicIds: ['sql', 'python']
      }
    ]
  },
  {
    id: 'microsoft-fabric',
    title: 'Microsoft Fabric Engineer',
    icon: '◈',
    color: '#0078d4',
    description: 'Master Microsoft Fabric end-to-end — OneLake, Lakehouses, Warehouses, Pipelines, Real-Time Intelligence, and Direct Lake Semantic Models. The fastest path to an Azure-stack data engineering role.',
    duration: '8–10 weeks',
    difficulty: 'Intermediate → Advanced',
    prerequisites: ['SQL proficiency', 'PySpark basics', 'Azure fundamentals'],
    skills: [
      'OneLake and Shortcuts',
      'Fabric Lakehouse (Delta tables, SQL Analytics Endpoint)',
      'Fabric Warehouse (T-SQL, views, stored procedures)',
      'Medallion Architecture (Bronze / Silver / Gold)',
      'Data Factory Pipelines in Fabric',
      'Dataflows Gen2 (Power Query)',
      'Spark Notebooks in Fabric',
      'Eventstream and Real-Time Intelligence',
      'KQL Database and Kusto Query Language',
      'Direct Lake Semantic Models and Power BI',
      'Fabric CI/CD and Deployment Pipelines',
    ],
    phases: [
      {
        id: 'fabric-foundations',
        title: 'Fabric Foundations',
        duration: '1 week',
        description: 'Understand the Fabric platform, workspace structure, OneLake, and how Fabric items relate to each other.',
        skills: ['Microsoft Fabric overview', 'Workspace and item types', 'OneLake architecture', 'OneLake Shortcuts', 'Licensing tiers (Trial, F SKU)'],
        milestones: [
          'Create a Fabric workspace and list all available item types',
          'Explain the difference between OneLake and Azure Data Lake Storage Gen2',
          'Create a OneLake Shortcut pointing to an ADLS Gen2 container',
          'Explain when to use a Lakehouse vs a Warehouse',
        ],
        topicIds: ['microsoft-fabric'],
      },
      {
        id: 'fabric-lakehouse',
        title: 'Lakehouse & Delta Engineering',
        duration: '2 weeks',
        description: 'Build a full Medallion architecture using Fabric Lakehouses, Spark Notebooks, and Delta tables.',
        skills: ['Creating Lakehouses', 'Delta table operations (CRUD)', 'SQL Analytics Endpoint', 'Medallion Bronze / Silver / Gold', 'OPTIMIZE and ZORDER', 'Time travel and schema evolution'],
        milestones: [
          'Ingest raw CSV into Lakehouse Files and convert to Bronze Delta table',
          'Build a Silver Notebook that casts types, removes nulls, and deduplicates',
          'Build a Gold Notebook that aggregates to daily revenue by region',
          'Run OPTIMIZE ZORDER on a Gold table and measure query improvement',
          'Query Gold table via SQL Analytics Endpoint from a Warehouse',
        ],
        topicIds: ['microsoft-fabric', 'azure-databricks'],
      },
      {
        id: 'fabric-pipelines',
        title: 'Pipelines & Dataflows',
        duration: '2 weeks',
        description: 'Orchestrate data movement and transformation using Data Factory Pipelines and Dataflows Gen2.',
        skills: ['Pipeline activities (Copy, Notebook, Stored Procedure)', 'Event and schedule triggers', 'Pipeline monitoring and alerts', 'Dataflows Gen2 Power Query', 'Incremental refresh in Dataflows'],
        milestones: [
          'Build a nightly pipeline: Copy Activity → Bronze Notebook → Silver Notebook → Gold Notebook',
          'Add retry policies and email alerts to a pipeline',
          'Create a Dataflow Gen2 that ingests data from a REST API into a Lakehouse table',
          'Configure incremental refresh on a Dataflow Gen2 using RangeStart / RangeEnd parameters',
        ],
        topicIds: ['microsoft-fabric', 'azure-data-factory'],
      },
      {
        id: 'fabric-realtime',
        title: 'Real-Time Intelligence',
        duration: '2 weeks',
        description: 'Build streaming pipelines using Eventstream and query live data with KQL.',
        skills: ['Eventstream architecture', 'Source connectors (Event Hubs, Kafka, IoT Hub)', 'Stream transformations (Filter, Aggregate, Group By)', 'KQL Database ingestion', 'Kusto Query Language fundamentals', 'KQL time-series and anomaly functions'],
        milestones: [
          'Build an Eventstream from an Event Hub source to a KQL Database destination',
          'Apply a 5-minute tumbling window aggregation in Eventstream',
          'Write a KQL query to detect temperature spikes in the last 24 hours',
          'Create a Power BI real-time dashboard on a KQL queryset',
        ],
        topicIds: ['microsoft-fabric'],
      },
      {
        id: 'fabric-bi-semantic-models',
        title: 'Semantic Models & Power BI',
        duration: '1 week',
        description: 'Expose Gold Lakehouse tables as Power BI reports using Direct Lake mode.',
        skills: ['Default and custom Semantic Models', 'Direct Lake vs Import vs DirectQuery', 'DAX measures', 'Relationships between fact and dimension tables', 'Row-level security in Semantic Models'],
        milestones: [
          'Create a custom Semantic Model on a Gold Lakehouse with 3 DAX measures',
          'Verify a report uses Direct Lake mode (not Import)',
          'Add a date table and define a year-over-year measure in DAX',
          'Implement row-level security that filters by user email',
        ],
        topicIds: ['microsoft-fabric'],
      },
      {
        id: 'fabric-cicd',
        title: 'CI/CD & Production Readiness',
        duration: '2 weeks',
        description: 'Version-control Fabric items with Git, promote across environments with Deployment Pipelines, and monitor production workloads.',
        skills: ['Git integration (GitHub / Azure DevOps)', 'Fabric Deployment Pipelines (Dev → Test → Prod)', 'Workspace parameters for environment switching', 'Monitoring with Fabric Capacity Metrics app', 'OneLake access control and Microsoft Purview'],
        milestones: [
          'Connect a Fabric workspace to a GitHub repo and commit a Notebook via PR',
          'Create a 3-stage Deployment Pipeline and promote a Notebook from Dev to Prod',
          'Configure workspace parameters to swap Lakehouse connections per environment',
          'Set up Microsoft Entra group-based access control for a production workspace',
        ],
        topicIds: ['microsoft-fabric'],
      },
    ],
  },
  {
    id: 'dbt-analytics-engineering',
    title: 'dbt & Analytics Engineering',
    icon: '🔷',
    color: '#ff694a',
    description: 'Master dbt from first model to production-grade transformation pipelines. Learn the staging/intermediate/mart pattern, testing, documentation, incremental models, snapshots, and CI/CD — the analytics engineering stack used at modern data-driven companies.',
    duration: '4–6 weeks',
    difficulty: 'Intermediate → Advanced',
    prerequisites: ['SQL proficiency', 'Basic Python', 'Familiarity with a data warehouse (Snowflake, Databricks, BigQuery, or Redshift)'],
    skills: [
      'dbt models and materialisation',
      'Staging / Intermediate / Mart layer architecture',
      'source() and ref() functions',
      'Generic and singular dbt tests',
      'Incremental models with is_incremental()',
      'Snapshots for SCD Type 2',
      'Macros and Jinja templating',
      'dbt Cloud vs dbt Core',
      'CI/CD with --state and Slim CI',
      'dbt with Snowflake, Databricks, and Fabric',
    ],
    phases: [
      {
        id: 'dbt-foundations',
        title: 'dbt Foundations',
        duration: '1 week',
        description: 'Install dbt, write your first models, and understand the staging/intermediate/mart layer pattern.',
        skills: ['dbt project structure', 'Model files and SELECT → table', 'source() and ref()', 'View vs table materialisation', 'dbt run and dbt compile'],
        milestones: [
          'Create a dbt project connected to a local Postgres or Snowflake trial',
          'Write stg_orders.sql using {{ source() }} and verify it creates a view',
          'Write int_orders_enriched.sql joining stg_orders and stg_customers using {{ ref() }}',
          'Build a fct_daily_revenue.sql mart model with table materialisation',
          'Run dbt run and verify all 3 models appear in the warehouse',
        ],
        topicIds: ['dbt'],
      },
      {
        id: 'dbt-testing-documentation',
        title: 'Testing and Documentation',
        duration: '1 week',
        description: 'Add generic and singular tests to every model. Write YAML documentation. Generate and serve dbt docs.',
        skills: ['Generic tests (not_null, unique, accepted_values, relationships)', 'Singular test SQL files', 'Schema .yml documentation', 'dbt docs generate', 'Source freshness checks'],
        milestones: [
          'Add unique and not_null tests to every primary key column in your project',
          'Add an accepted_values test on order status column',
          'Write a singular test that catches negative order amounts',
          'Write YAML descriptions for all 3 models including grain and consumers',
          'Run dbt docs generate && dbt docs serve and navigate the lineage graph',
        ],
        topicIds: ['dbt'],
      },
      {
        id: 'dbt-incremental-snapshots',
        title: 'Incremental Models and Snapshots',
        duration: '1–2 weeks',
        description: 'Convert a fact table to incremental materialisation. Implement SCD Type 2 with a dbt snapshot.',
        skills: ['is_incremental() block', 'Lookback windows for late data', 'merge vs append incremental strategy', 'Snapshot timestamp strategy', 'Point-in-time queries on snapshot tables'],
        milestones: [
          'Convert fct_orders from table to incremental with a 25-hour lookback window',
          'Add unique_key="order_id" with merge strategy and verify MERGE runs on second execution',
          'Create a customers_snapshot.sql with the timestamp strategy',
          'Run dbt snapshot twice after modifying a customer record in the source',
          'Write a query returning the customer segment at the time of each order using the snapshot',
        ],
        topicIds: ['dbt'],
      },
      {
        id: 'dbt-macros-production',
        title: 'Macros and Production Deployment',
        duration: '1–2 weeks',
        description: 'Write reusable Jinja macros, set up multi-environment profiles, and implement CI/CD with dbt Cloud or GitHub Actions.',
        skills: ['Jinja macro syntax', 'dbt-utils package', 'profiles.yml multi-environment config', 'dbt Cloud job scheduling', 'CI with --select state:modified+'],
        milestones: [
          'Install dbt-utils and use generate_surrogate_key in a mart model',
          'Write a custom clean_string macro and apply it across 3 staging models',
          'Configure dev and prod targets in profiles.yml pointing to separate schemas',
          'Set up a GitHub Actions workflow that runs dbt compile and dbt test on PRs',
          'Configure dbt source freshness as the first step in a dbt Cloud job',
        ],
        topicIds: ['dbt'],
      },
    ],
  },
  {
    id: 'azure-security',
    title: 'Azure Security & Secrets Management',
    icon: '🔐',
    color: '#ef4444',
    phases: [
      {
        id: 'azure-security-identity',
        title: 'Managed Identity & Key Vault',
        duration: '1 week',
        description: 'Replace Service Principal secrets with Managed Identity. Store remaining credentials in Key Vault and reference them from ADF Linked Services and Databricks secret scopes.',
        skills: ['System-assigned vs user-assigned MI', 'MI RBAC assignment on ADLS', 'KV-backed ADF Linked Services', 'Databricks secret scopes', 'Key Vault RBAC vs Access Policies'],
        milestones: [
          'Enable system-assigned MI on an ADF instance and verify the Object ID',
          'Assign Storage Blob Data Reader to the ADF MI on a specific ADLS container (not the storage account)',
          'Migrate one ADF Linked Service from connection string to Key Vault reference',
          'Create a Key Vault-backed Databricks secret scope and retrieve a secret with dbutils.secrets.get',
          'Verify no secrets appear in ADF JSON export or Databricks notebook output',
        ],
        topicIds: ['azure-security'],
      },
      {
        id: 'azure-security-rbac',
        title: 'RBAC & Unity Catalog Access Control',
        duration: '1 week',
        description: 'Design least-privilege RBAC for a medallion architecture. Implement Unity Catalog GRANT statements, column masking, and row filters.',
        skills: ['Container-scoped Storage RBAC', 'AAD group management for RBAC', 'Unity Catalog GRANT syntax', 'Column masking for PII', 'Row-level security filters'],
        milestones: [
          'Design a RBAC matrix for Bronze/Silver/Gold containers with three different pipeline identities',
          'Create AAD security groups for data roles (data-engineers, data-analysts, pii-restricted)',
          'Assign RBAC at container scope — verify it does NOT apply to other containers on the same storage account',
          'Write a Unity Catalog column mask for an SSN or email column',
          'Create a row filter on a multi-tenant table that restricts rows to the querying user\'s region',
        ],
        topicIds: ['azure-security'],
      },
      {
        id: 'azure-security-networking',
        title: 'Private Networking & Data Governance',
        duration: '1 week',
        description: 'Deploy Private Endpoints for ADLS and Key Vault. Scan and classify data with Microsoft Purview.',
        skills: ['Private Endpoint setup for ADLS', 'Private DNS zone configuration', 'Disabling public access post-migration', 'SHIR for ADF on-premise connectivity', 'Purview scanning and classification', 'GDPR SAR response workflow'],
        milestones: [
          'Deploy a Private Endpoint for an ADLS Gen2 account in a test VNet',
          'Configure the privatelink.dfs.core.windows.net DNS zone and verify nslookup returns a private IP',
          'Disable public access on the storage account and confirm ADF still connects via Private Endpoint',
          'Set up a Purview scan on a Delta Lake container and classify at least one PII column',
          'Simulate a GDPR SAR: use Purview catalog to identify all tables containing a specific customer\'s PII',
        ],
        topicIds: ['azure-security'],
      },
      {
        id: 'azure-security-cicd',
        title: 'CI/CD Secrets & Incident Response',
        duration: '1 week',
        description: 'Implement OIDC federation for GitHub Actions and Azure DevOps. Practice incident response for leaked keys, public blob exposure, and 403 debugging.',
        skills: ['OIDC Workload Identity Federation', 'GitHub Actions OIDC login', 'Azure DevOps service connections', 'Key Vault in GitHub Actions workflows', 'Secret scanning and rotation', 'Incident response for credential leaks'],
        milestones: [
          'Create an App Registration with a Federated Credential for a GitHub Actions workflow',
          'Replace a client_secret in GitHub Secrets with OIDC login using azure/login@v2',
          'Configure a GitHub Actions workflow that reads a Key Vault secret at deploy time using OIDC (no stored secret)',
          'Enable GitHub secret scanning on a repo and confirm it catches a test Azure key pattern',
          'Run through the leaked-key incident response: rotate key, check Storage logs, remove from git history',
        ],
        topicIds: ['azure-security'],
      },
    ],
  },
];

export const roadmapTracks = [
  seniorAzureRoadmapTrack,
  ...legacyRoadmapTracks.filter(track => track.id !== seniorAzureRoadmapTrack.id),
];
