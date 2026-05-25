import { sqlModule }        from './modules/sql.js';
import { pythonModule }     from './modules/python.js';
import { pysparkModule }    from './modules/pyspark.js';
import { adfModule }        from './modules/azure-data-factory.js';
import { databricksModule } from './modules/azure-databricks.js';
import { awsGlueModule }    from './modules/aws-glue.js';
import { aiModule }         from './modules/ai-for-data-engineers.js';
import { fabricModule }     from './modules/fabric.js';
import { newTopics }        from './newTopics.js';
import { phases }           from './phases.js';

const coreTopics = [
  {
    id: 'sql',
    title: 'SQL',
    label: 'Database',
    category: 'Foundations',
    difficulty: 'Beginner to Advanced',
    progress: '15%',
    body: 'Read and ask questions from tables.',
    overview: [
      { title: 'What is this?', body: 'SQL is a language we use to ask questions from data stored in tables.' },
      { title: 'Why do we use it?', body: 'A data engineer may use SQL to find yesterday sales before sending a report to a manager.' },
      { title: 'Simple example', body: 'SELECT name FROM customers; shows customer names from a customers table.' },
      { title: 'Practice task', body: 'Write one question you would ask from a sales table.' },
    ],
    questions: [
      { question: 'What is SQL?', answer: 'A language for working with table data.' },
      { question: 'What is a table?', answer: 'A place where data is stored in rows and columns.' },
      { question: 'Why use SELECT?', answer: 'To choose the data you want to see.' },
    ],
    module: sqlModule,
    step: 1,
    prerequisites: [],
    timeEstimate: '3–4 weeks',
    interviewImportance: 'critical',
    commonMistakes: [
      'Using SELECT * in production ETL jobs — always name columns explicitly so schema changes don\'t silently break pipelines.',
      'Forgetting NULL handling in JOINs — unexpected NULLs cause row loss; always use COALESCE or explicit IS NULL checks.',
      'Skipping window functions — ROW_NUMBER, LAG, and RANK come up in nearly every Data Engineering interview.',
    ],
    resumeRelevance: 'Mention window functions (ROW_NUMBER, LAG), CTEs, deduplication patterns, and query optimization in any ETL or analytics pipeline project on your resume.',
    careerContext: {
      whyItMatters: 'SQL is the universal language of data — every DE role requires it for querying warehouses, writing dbt models, validating pipeline output, and debugging data quality issues.',
      realWorldUseCase: 'A DE debugging a failed nightly load runs SQL to find the 2,000 missing rows: a window function to deduplicate late-arriving events, then a MERGE to upsert only the changed records.',
      interviewTip: 'Expect window functions (ROW_NUMBER for dedup, LAG/LEAD for time-series, RANK for rankings) in every interview. The gap between junior and senior SQL is almost always window functions and query optimization.',
      projectLink: 'Incremental ETL Pipeline — the watermark tracking and idempotent UPSERT patterns are pure SQL.',
    },
    nextStep: {
      id: 'python',
      title: 'Python',
      reason: 'SQL lets you query data — Python lets you automate pipelines, read APIs, and orchestrate the work that runs SQL.',
    },
    docs: ['postgresql-docs', 'ms-synapse'],
  },
  {
    id: 'python',
    title: 'Python',
    label: 'Coding',
    category: 'Foundations',
    difficulty: 'Beginner',
    progress: '15%',
    body: 'Write simple scripts to move and clean data.',
    overview: [
      { title: 'What is this?', body: 'Python is a friendly programming language used to tell a computer what to do.' },
      { title: 'Why do we use it?', body: 'A data engineer may use Python to download a file every morning and clean it before loading it.' },
      { title: 'Simple example', body: 'print("Hello data") shows a message on the screen.' },
      { title: 'Practice task', body: 'Write a Python list of three column names you might find in an orders table.' },
    ],
    questions: [
      { question: 'What is Python?', answer: 'A programming language used to build scripts and apps.' },
      { question: 'Why is Python useful?', answer: 'It helps automate repeated work like downloading, cleaning, and loading files.' },
      { question: 'What is a list?', answer: 'A group of values kept together in order, e.g. column names or file paths.' },
    ],
    module: pythonModule,
    step: 2,
    prerequisites: ['sql'],
    timeEstimate: '2–3 weeks',
    interviewImportance: 'high',
    commonMistakes: [
      'Writing untestable procedural scripts — use functions so you can unit-test your ETL logic.',
      'No error handling on API calls — always catch exceptions, handle rate limits, and log failures.',
      'Hard-coding credentials in scripts — use environment variables or a secrets manager.',
    ],
    resumeRelevance: 'Highlight API ingestion scripts, schema validation pipelines, and automation of file processing tasks — include the volume of data moved or time saved.',
    careerContext: {
      whyItMatters: 'Python is the glue of modern data engineering — used to write ETL scripts, call APIs, manage files, test pipelines, and automate everything that SQL alone cannot.',
      realWorldUseCase: 'A DE writes a Python script that runs every hour: calls the Stripe API with pagination, validates the JSON schema, writes partitioned Parquet to S3, then triggers the downstream Glue job.',
      interviewTip: 'Interviewers test list comprehensions, generators, error handling, and writing testable functions. Be ready to refactor a messy procedural script into clean, reusable code.',
      projectLink: 'Incremental ETL Pipeline and API Ingestion Workflow — both are built entirely in Python.',
    },
    nextStep: {
      id: 'pyspark',
      title: 'PySpark',
      reason: 'Python handles gigabytes; PySpark handles terabytes — when your data outgrows a single machine, Spark is the tool every senior DE reaches for.',
    },
    docs: ['python-docs', 'pandas-docs'],
  },
  {
    id: 'pyspark',
    title: 'PySpark',
    label: 'Big Data',
    category: 'Foundations',
    difficulty: 'Intermediate',
    progress: '10%',
    body: 'Work with large data using Python-style code.',
    overview: [
      { title: 'What is this?', body: 'PySpark lets you use Python to process very large datasets across a cluster of computers.' },
      { title: 'Why do we use it?', body: 'A data engineer uses PySpark when data is too big for a single machine — millions of rows processed in parallel.' },
      { title: 'Simple example', body: 'df.filter(col("status") == "shipped").count() counts only shipped orders in a 100M-row table.' },
      { title: 'Practice task', body: 'Write one reason a company would need PySpark instead of a regular Python script.' },
    ],
    questions: [
      { question: 'What is PySpark?', answer: 'Python API for Apache Spark — processes large data in parallel across many machines.' },
      { question: 'What is lazy evaluation?', answer: 'Spark does not run transformations until you call an action like count() or write(). It builds a plan first.' },
      { question: 'What is a Spark DataFrame?', answer: 'A distributed table with named columns, processed in parallel across the cluster.' },
    ],
    module: pysparkModule,
    step: 11,
    prerequisites: ['python'],
    timeEstimate: '3–4 weeks',
    interviewImportance: 'high',
    commonMistakes: [
      'Calling collect() on large DataFrames — this pulls all data to the driver and causes out-of-memory errors.',
      'Not handling data skew — uneven partitions create slow tasks and job timeouts; use salting or repartition.',
      'Using Python UDFs where native Spark functions exist — native functions run on JVM and are 10–100× faster.',
    ],
    resumeRelevance: 'Describe scale (rows or GB processed), partitioning strategy, and Delta Lake usage in Spark project bullets — numbers make the impact tangible.',
    careerContext: {
      whyItMatters: 'PySpark is the industry standard for processing data at scale — when tables have billions of rows and single-machine tools give up, Spark distributes the work across a cluster.',
      realWorldUseCase: 'A DE at a fintech company uses PySpark to join a 5-billion-row transaction table with a 50M-row user table every night, applying window deduplication and writing partitioned Delta files to ADLS.',
      interviewTip: 'Know the difference between transformations and actions, why lazy evaluation matters, and how to diagnose data skew. Partition tuning and broadcast joins come up in every senior interview.',
      projectLink: 'CDC Pipeline and Sales Lakehouse Pipeline — both use PySpark/Spark Streaming for large-scale transformation.',
    },
    nextStep: {
      id: 'azure-data-factory',
      title: 'Azure Data Factory',
      reason: 'Once you can write Spark code, the next step is orchestrating it on a schedule — ADF is how Azure DEs trigger and chain their Spark jobs.',
    },
    docs: ['apache-spark', 'delta-lake'],
  },
  {
    id: 'azure-data-factory',
    title: 'Azure Data Factory',
    label: 'Pipeline',
    category: 'Azure',
    difficulty: 'Beginner',
    progress: '10%',
    body: 'Move data between places with simple steps.',
    overview: [
      { title: 'What is this?', body: 'Azure Data Factory is a cloud orchestration service that moves and transforms data between systems.' },
      { title: 'Why do we use it?', body: 'A data engineer uses ADF to schedule automatic data loads — copying files from storage into a warehouse every night without manual work.' },
      { title: 'Simple example', body: 'A Copy Activity reads orders.csv from Azure Blob Storage and writes it to a SQL table in the data warehouse.' },
      { title: 'Practice task', body: 'Name one source and one destination for a daily data copy task in your organisation.' },
    ],
    questions: [
      { question: 'What is Azure Data Factory?', answer: 'A cloud ETL/ELT and orchestration service for moving and transforming data.' },
      { question: 'What is a linked service?', answer: 'A connection definition storing credentials and endpoint info for an external system.' },
      { question: 'What triggers a pipeline?', answer: 'A schedule trigger (cron), an event trigger (file arrives), or a manual run.' },
    ],
    module: adfModule,
    step: 17,
    prerequisites: ['pyspark'],
    timeEstimate: '1–2 weeks',
    interviewImportance: 'medium',
    commonMistakes: [
      'Hardcoding connection strings in activities — always use Linked Services with Key Vault references.',
      'Missing retry policies on activities — production pipelines need retry logic for transient network failures.',
      'No alerting on failures — always configure email or Teams notifications for failed pipeline runs.',
    ],
    resumeRelevance: 'Mention orchestration patterns, event-triggered pipelines, and cross-system data movement — emphasise the reliability and scheduling aspects.',
    careerContext: {
      whyItMatters: 'Orchestration is what separates a one-time script from a production pipeline. ADF schedules, monitors, retries, and chains every step automatically — without manual babysitting.',
      realWorldUseCase: 'A DE builds an ADF pipeline that triggers on file arrival in Blob Storage, runs a Databricks notebook to transform the data, then calls a stored procedure to update the data warehouse — all automatically at midnight.',
      interviewTip: 'Know the difference between schedule triggers and event triggers, how linked services work, and how to handle pipeline failures with retry policies and alerts. Activity-level error handling is a common scenario question.',
      projectLink: 'Sales Lakehouse Pipeline and API Ingestion Workflow — both use ADF for orchestration and scheduling.',
    },
    nextStep: {
      id: 'azure-databricks',
      title: 'Azure Databricks',
      reason: 'ADF orchestrates pipelines — Databricks is where the heavy transformation logic runs, combining Spark, Delta Lake, and notebooks in one managed platform.',
    },
    docs: ['ms-adf', 'ms-synapse'],
  },
  {
    id: 'azure-databricks',
    title: 'Azure Databricks',
    label: 'Notebook',
    category: 'Azure',
    difficulty: 'Intermediate',
    progress: '10%',
    body: 'Clean and study data in cloud notebooks.',
    overview: [
      { title: 'What is this?', body: 'Azure Databricks is a managed cloud workspace for running Apache Spark workloads using notebooks and scheduled jobs.' },
      { title: 'Why do we use it?', body: 'A data engineer uses Databricks to build scalable transformation pipelines on a data lake using Delta Lake as the storage format.' },
      { title: 'Simple example', body: 'A Bronze → Silver notebook reads raw Parquet files, removes duplicates, casts types, and writes clean Delta tables.' },
      { title: 'Practice task', body: 'Describe the three layers in a medallion architecture and what goes in each.' },
    ],
    questions: [
      { question: 'What is Delta Lake?', answer: 'An open storage format adding ACID transactions, schema enforcement, and time travel to Parquet files.' },
      { question: 'What is a job cluster vs all-purpose cluster?', answer: 'Job cluster: starts for one run, stops when done (cheapest). All-purpose: stays running for interactive notebooks.' },
      { question: 'What is the medallion architecture?', answer: 'Bronze (raw) → Silver (clean) → Gold (aggregated). Each layer has a clear data quality contract.' },
    ],
    module: databricksModule,
    step: 18,
    prerequisites: ['azure-data-factory'],
    timeEstimate: '3–4 weeks',
    interviewImportance: 'high',
    commonMistakes: [
      'Using all-purpose clusters for production jobs — job clusters auto-terminate and cost far less.',
      'Skipping the Bronze layer — saving raw data is critical for debugging, reprocessing, and audit trails.',
      'Not using Delta ACID transactions — without them, concurrent writes cause data corruption.',
    ],
    resumeRelevance: 'Describe the medallion layers (Bronze/Silver/Gold), Delta Lake ACID guarantees, and cluster configuration choices — interviewers look for these specific terms.',
    careerContext: {
      whyItMatters: 'Databricks is where most Azure data teams do their heavy lifting — a managed Spark environment with Delta Lake, Unity Catalog, and MLflow built in, all on top of the cloud infrastructure your company already has.',
      realWorldUseCase: 'A DE at a healthcare company builds a medallion pipeline in Databricks: Bronze Auto Loader ingests HL7 files, Silver notebooks clean and standardise them, Gold aggregates to patient-level metrics — all with Delta ACID guarantees and Unity Catalog access controls.',
      interviewTip: 'Understand the medallion architecture deeply — interviewers want to know what belongs in Bronze vs Silver vs Gold, why Delta Lake is preferred over Parquet, and how you handle schema drift in production.',
      projectLink: 'Sales Lakehouse Pipeline and Medallion Architecture Project — both are built end-to-end on Databricks.',
    },
    nextStep: {
      id: 'aws-glue',
      title: 'AWS Glue',
      reason: 'Databricks is the Azure world — AWS Glue is the equivalent on AWS. Most DE job descriptions list both, so knowing both makes you cloud-agnostic and more hireable.',
    },
    docs: ['ms-databricks', 'databricks-docs', 'databricks-unity-catalog', 'delta-lake'],
  },
  {
    id: 'aws-glue',
    title: 'AWS Glue',
    label: 'Cloud ETL',
    category: 'AWS',
    difficulty: 'Intermediate',
    progress: '10%',
    body: 'Prepare data in AWS with managed jobs.',
    overview: [
      { title: 'What is this?', body: 'AWS Glue is a serverless ETL service that runs PySpark jobs and manages a metadata catalog for your data lake.' },
      { title: 'Why do we use it?', body: 'A data engineer uses Glue to ingest S3 files, catalogue them automatically, and query with Athena — no server management needed.' },
      { title: 'Simple example', body: 'A Glue Crawler scans s3://bucket/orders/ and creates a table in the Glue Catalog that Athena can query instantly.' },
      { title: 'Practice task', body: 'Write one scenario where you would choose AWS Glue over a self-managed Spark cluster.' },
    ],
    questions: [
      { question: 'What is the Glue Data Catalog?', answer: 'A centralised metadata store used by Athena, EMR, and Redshift Spectrum to find table schemas and S3 locations.' },
      { question: 'What is a Glue Crawler?', answer: 'A job that scans a data source, infers the schema, and registers or updates a table in the catalog.' },
      { question: 'What are job bookmarks?', answer: 'A feature that tracks processed files so each run only reads new data, enabling incremental loads.' },
    ],
    module: awsGlueModule,
    step: 19,
    prerequisites: ['pyspark'],
    timeEstimate: '1–2 weeks',
    interviewImportance: 'medium',
    commonMistakes: [
      'Not enabling job bookmarks — without bookmarks every run reprocesses all data, which is expensive.',
      'Crawling too frequently — crawlers cost money; use scheduled runs or event triggers instead.',
      'Choosing the wrong worker type — G.1X for standard workloads, G.2X for memory-intensive operations.',
    ],
    resumeRelevance: 'Highlight serverless ETL, Glue Catalog integration, and incremental loads via job bookmarks — mention cost efficiency and scalability.',
    careerContext: {
      whyItMatters: 'AWS Glue makes S3-based data lakes production-ready without managing servers — the Glue Catalog gives Athena, EMR, and Redshift Spectrum a shared schema, and Glue jobs run serverless PySpark at scale.',
      realWorldUseCase: 'A DE at an e-commerce company sets up a Glue Crawler on s3://orders/ that automatically catalogues new Parquet partitions each night, then a Glue job joins order and customer data and writes to S3 for Athena queries.',
      interviewTip: 'Understand the Glue Data Catalog vs Hive Metastore, when to use Glue vs EMR vs Athena, and how job bookmarks enable incremental processing. Cost and cold-start latency trade-offs come up often.',
      projectLink: 'Any project can be adapted to AWS — Incremental ETL Pipeline is the most direct fit as a serverless Glue job.',
    },
    nextStep: {
      id: 'ai-for-data-engineers',
      title: 'AI for Data Engineers',
      reason: 'With cloud and pipeline skills solid, the final frontier is AI — building LLM pipelines, vector stores, and using AI tools to 10x your own productivity as a DE.',
    },
    docs: ['aws-glue', 'aws-s3', 'aws-redshift'],
  },
  {
    id: 'ai-for-data-engineers',
    title: 'AI for Data Engineers',
    label: 'Assistant',
    category: 'AI',
    difficulty: 'Beginner',
    progress: '10%',
    body: 'Use AI to explain, check, and speed up learning.',
    overview: [
      { title: 'What is this?', body: 'AI assistants (like Claude, ChatGPT, Copilot) can write code, explain concepts, debug queries, and generate documentation on demand.' },
      { title: 'Why do we use it?', body: 'A data engineer uses AI to write boilerplate faster, convert SQL to PySpark, explain unfamiliar code, and get instant answers to technical questions.' },
      { title: 'Simple example', body: 'Prompt: "Convert this SQL GROUP BY to PySpark DataFrame API." AI returns working PySpark code in seconds.' },
      { title: 'Practice task', body: 'Write a prompt asking AI to explain a specific data engineering concept you are currently learning.' },
    ],
    questions: [
      { question: 'How can AI help data engineers?', answer: 'Writing code, explaining concepts, debugging queries, converting between languages, and generating documentation.' },
      { question: 'Should AI answers be trusted without checking?', answer: 'No. AI can produce plausible-looking but wrong SQL or code. Always test on real data.' },
      { question: 'What makes a good AI prompt?', answer: 'Role + context + specific task + expected output format. Vague prompts produce generic answers.' },
    ],
    module: aiModule,
    step: 36,
    prerequisites: ['python'],
    timeEstimate: '2–3 weeks',
    interviewImportance: 'growing',
    commonMistakes: [
      'Trusting LLM output without validation — always test generated SQL or code against real data.',
      'Not handling token limits — large documents need a chunking strategy before embedding.',
      'Embedding whole documents instead of chunks — chunking by paragraph improves retrieval precision.',
    ],
    resumeRelevance: 'Describe RAG pipeline components (chunking, embedding model, vector store, retrieval), LLM integration, and the business problem solved — this is a differentiator on a DE resume.',
    careerContext: {
      whyItMatters: 'AI fluency is now a DE differentiator — teams are building LLM pipelines, semantic search over data lakes, and AI-assisted data quality checks. DEs who can build and maintain these systems are highly sought after.',
      realWorldUseCase: 'A DE builds a pipeline that embeds product descriptions with OpenAI, stores vectors in Pinecone, and exposes a semantic search API — the same ETL skills applied to a new data modality.',
      interviewTip: 'Know how to build a RAG pipeline (chunking, embedding, vector store, retrieval), understand LLM token limits and cost implications, and be able to explain when a traditional ML model is better than an LLM.',
      projectLink: 'Any project benefits from AI tooling — use AI to generate test data, write boilerplate, explain error messages, and review your code.',
    },
    nextStep: {
      id: 'microsoft-fabric',
      title: 'Microsoft Fabric',
      reason: 'Fabric is the next-generation Azure analytics platform that unifies data engineering, warehousing, and BI — increasingly asked in Azure DE interviews.',
    },
    docs: ['python-docs', 'dbt-docs'],
  },
  {
    id: 'microsoft-fabric',
    title: 'Microsoft Fabric',
    label: 'Platform',
    category: 'Azure',
    difficulty: 'Intermediate',
    progress: '0%',
    body: 'Build end-to-end analytics pipelines on Microsoft\'s unified data platform.',
    overview: [
      { title: 'What is this?', body: 'Microsoft Fabric is an all-in-one SaaS analytics platform that combines data engineering, warehousing, real-time analytics, and Power BI in one workspace.' },
      { title: 'Why do we use it?', body: 'A data engineer uses Fabric to build Bronze → Silver → Gold Medallion pipelines using Spark Notebooks and Lakehouses, all stored on OneLake, with zero external storage configuration.' },
      { title: 'Simple example', body: 'A Fabric Pipeline runs every night: a Copy Activity lands raw CSV in Lakehouse Bronze, a Notebook cleans it to Silver, another Notebook aggregates to Gold, and a Direct Lake Semantic Model makes it available in Power BI immediately.' },
      { title: 'Practice task', body: 'List the 5 main Fabric item types and what each one is used for.' },
    ],
    questions: [
      { question: 'What is OneLake?', answer: 'A single tenant-wide logical data lake that stores all Fabric items — no separate storage accounts needed.' },
      { question: 'What is Direct Lake mode?', answer: 'A Power BI mode that reads Delta files directly from OneLake without importing — always fresh, near-instant queries.' },
      { question: 'What is the difference between a Lakehouse and a Warehouse in Fabric?', answer: 'Lakehouse stores Delta tables accessed via Spark and read-only SQL Analytics Endpoint. Warehouse is a full T-SQL read/write analytics store.' },
    ],
    module: fabricModule,
    step: 20,
    prerequisites: ['azure-databricks'],
    timeEstimate: '3–4 weeks',
    interviewImportance: 'growing',
    commonMistakes: [
      'Confusing Lakehouse with Warehouse — a Lakehouse SQL Analytics Endpoint is read-only; writes must go through Spark or a Pipeline.',
      'Not using Shortcuts — copying data when a Shortcut would virtualise it adds unnecessary cost and sync complexity.',
      'Using all-purpose clusters for batch jobs — Fabric Starter Pools are cheaper for production notebook runs.',
      'Forgetting to enable Git integration — all Fabric items should be version-controlled from day one.',
    ],
    resumeRelevance: 'Mention OneLake Shortcuts, Medallion architecture with Fabric Lakehouses, Direct Lake semantic models, and Deployment Pipeline CI/CD — these signal hands-on Fabric experience.',
    careerContext: {
      whyItMatters: 'Microsoft Fabric is rapidly replacing separate Azure Synapse + ADF + Power BI architectures at enterprises. Azure DE job descriptions increasingly list Fabric experience, and it shows up in interviews at companies standardising on the Microsoft stack.',
      realWorldUseCase: 'A DE at a retail company migrates from ADF + Synapse + Power BI to a single Fabric workspace: Pipelines replace ADF, Lakehouses replace Synapse data lake, and Direct Lake replaces Power BI import refreshes — reducing operational overhead by 60%.',
      interviewTip: 'Understand OneLake vs ADLS Gen2, when to use a Lakehouse vs Warehouse, and how Direct Lake mode differs from Import/DirectQuery. Medallion architecture in Fabric is the most commonly tested scenario.',
      projectLink: 'Sales Lakehouse Pipeline and Medallion Architecture Project — both map directly to Fabric Lakehouse + Notebook patterns.',
    },
    nextStep: null,
    docs: ['ms-fabric-overview', 'ms-fabric-onelake', 'ms-fabric-lakehouse', 'ms-fabric-warehouse', 'ms-fabric-data-factory', 'ms-fabric-spark', 'ms-fabric-rti', 'ms-fabric-deployment'],
  },
];

const REQUIRED_TITLE_OVERRIDES = {
  'linux-cli': 'Linux & Command Line',
  'cloud-storage': 'ADLS / S3',
  'kafka-basics': 'Kafka',
  'checkpointing': 'Checkpointing & Watermarking',
  'retry-handling': 'Retry & Failure Recovery',
  'unity-catalog': 'Unity Catalog / RBAC',
  'de-projects': 'Real-world Projects',
  'llm-pipelines': 'LLM-assisted Pipelines',
};

const phaseByTopicId = phases.reduce((acc, phase) => {
  for (const topicId of phase.topicIds) acc[topicId] = phase.id;
  return acc;
}, {});

function uniqueById(items) {
  const seen = new Set();
  return items.filter(item => {
    if (!item?.id || seen.has(item.id)) return false;
    seen.add(item.id);
    return true;
  });
}

function practiceTasksFor(topic) {
  const overviewTasks = (topic.overview ?? [])
    .filter(item => item.title?.toLowerCase().includes('practice'))
    .map(item => item.body)
    .filter(Boolean);

  const moduleTasks = (topic.module?.sections ?? [])
    .flatMap(section => section.subtopics ?? [])
    .map(subtopic => subtopic.practice)
    .filter(Boolean)
    .slice(0, 5);

  const tasks = [...overviewTasks, ...moduleTasks];
  if (tasks.length > 0) return tasks;

  return [
    `Create a short implementation plan showing how ${topic.title} would be used in a production data engineering pipeline.`,
  ];
}

function learningObjectivesFor(topic) {
  if (topic.learningObjectives?.length) return topic.learningObjectives;

  const overviewObjectives = (topic.overview ?? [])
    .filter(item => !item.title?.toLowerCase().includes('practice'))
    .map(item => item.body)
    .filter(Boolean)
    .slice(0, 3);

  if (overviewObjectives.length > 0) return overviewObjectives;

  return [
    `Explain what ${topic.title} is and where it fits in a modern data engineering platform.`,
    `Identify production use cases, trade-offs, and failure modes for ${topic.title}.`,
    `Practice applying ${topic.title} in a realistic pipeline or interview scenario.`,
  ];
}

function miniProjectFor(topic, practiceTasks) {
  if (topic.miniProject) return topic.miniProject;
  if (topic.module?.miniProject) return topic.module.miniProject;
  if (topic.module?.miniProjects?.length) return topic.module.miniProjects[0];

  return {
    title: `${topic.title} Mini Project`,
    goal: `Apply ${topic.title} in a realistic data engineering workflow.`,
    tasks: practiceTasks,
    expectedOutput: `A concise artifact showing the design, implementation approach, and validation checks for ${topic.title}.`,
  };
}

function normalizeTopic(topic) {
  const title = REQUIRED_TITLE_OVERRIDES[topic.id] ?? topic.title;
  const estimatedTime = topic.estimatedTime ?? topic.timeEstimate ?? '1–2 weeks';
  const practiceTasks = practiceTasksFor({ ...topic, title });

  return {
    ...topic,
    title,
    phase: topic.phase ?? phaseByTopicId[topic.id] ?? 'foundation',
    category: topic.category ?? 'General',
    difficulty: topic.difficulty ?? 'Beginner',
    estimatedTime,
    timeEstimate: topic.timeEstimate ?? estimatedTime,
    prerequisites: topic.prerequisites ?? [],
    whyItMatters: topic.whyItMatters ?? topic.careerContext?.whyItMatters ?? topic.overview?.find(item => item.title === 'Why do we use it?')?.body ?? '',
    learningObjectives: learningObjectivesFor({ ...topic, title }),
    realWorldUseCase: topic.realWorldUseCase ?? topic.careerContext?.realWorldUseCase ?? '',
    commonMistakes: topic.commonMistakes ?? [],
    practiceTasks,
    interviewQuestions: topic.interviewQuestions ?? topic.questions ?? [],
    miniProject: miniProjectFor({ ...topic, title }, practiceTasks),
    nextStep: topic.nextStep ?? null,
  };
}

const normalizedTopics = uniqueById([...coreTopics, ...newTopics])
  .map(normalizeTopic)
  .sort((a, b) => (a.step ?? 999) - (b.step ?? 999));

export const topics = normalizedTopics.map((topic, index, allTopics) => {
  if (topic.nextStep || index === allTopics.length - 1) return topic;
  const next = allTopics[index + 1];
  return {
    ...topic,
    nextStep: {
      id: next.id,
      title: next.title,
      reason: `Continue with ${next.title} to build on ${topic.title} without skipping the learning path.`,
    },
  };
});
