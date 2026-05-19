import { sqlModule }        from './modules/sql.js';
import { pythonModule }     from './modules/python.js';
import { pysparkModule }    from './modules/pyspark.js';
import { adfModule }        from './modules/azure-data-factory.js';
import { databricksModule } from './modules/azure-databricks.js';
import { awsGlueModule }    from './modules/aws-glue.js';
import { aiModule }         from './modules/ai-for-data-engineers.js';

export const topics = [
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
  },
];
