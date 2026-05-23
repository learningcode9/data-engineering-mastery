export const newTopics1 = [
  {
    id: 'linux-cli',
    title: 'Linux CLI',
    label: 'Terminal',
    category: 'Foundations',
    difficulty: 'Beginner',
    progress: '0%',
    body: 'Learn to navigate servers, manipulate files, and automate tasks using the Linux command line.',
    overview: [
      {
        title: 'What is this?',
        body: 'The Linux command-line interface (CLI) is a text-based way to interact with a server or computer. Data engineers use it daily to move files, inspect logs, schedule jobs, and manage permissions on remote machines.',
      },
      {
        title: 'Why do we use it?',
        body: 'Most data infrastructure runs on Linux servers — Spark clusters, Airflow workers, cloud VMs. Being comfortable in a terminal lets you debug failed jobs, inspect raw files with cat/less/grep, transfer data with scp, and schedule recurring tasks with cron — all without a GUI.',
      },
      {
        title: 'Simple example',
        body: 'To find all CSV files modified in the last 24 hours and count their lines: find /data -name "*.csv" -mtime -1 | xargs wc -l. This chains find, xargs, and wc — three common CLI tools working together.',
      },
      {
        title: 'Practice task',
        body: 'Open a terminal, navigate to your home directory with cd ~, create a folder called de-practice with mkdir, create a file inside it with touch test.csv, list all files with ls -lah, then view the file with cat. Finally, write a one-line cron entry that would run a Python script every day at 6 AM.',
      },
    ],
    questions: [
      {
        question: 'What command searches inside file contents for a pattern?',
        answer: 'grep, e.g. grep "ERROR" app.log prints every line containing the word ERROR. Add -r to search recursively and -n to show line numbers.',
      },
      {
        question: 'How do you make a shell script executable and run it?',
        answer: 'Run chmod +x script.sh to add execute permission, then ./script.sh to execute it. Without chmod +x you will get a "Permission denied" error.',
      },
      {
        question: 'What is cron and how do you schedule a job to run every day at midnight?',
        answer: 'cron is the Linux task scheduler. Edit the schedule with crontab -e and add the line: 0 0 * * * /usr/bin/python3 /home/user/pipeline.py. The five fields are minute, hour, day, month, weekday.',
      },
    ],
    module: null,
    step: 3,
    prerequisites: ['python'],
    timeEstimate: '1–2 weeks',
    interviewImportance: 'medium',
    commonMistakes: [
      'Ignoring exit codes — always check $? or use set -e in scripts so a failing command does not silently let the rest of the pipeline continue.',
      'Using rm -rf without double-checking paths — a wrong variable in a cleanup script can delete production data; prefer mv to a trash folder first.',
      'Hardcoding absolute paths in cron jobs — cron runs with a minimal PATH; always use full paths like /usr/bin/python3 and /home/user/script.sh.',
    ],
    resumeRelevance: 'Mention Linux CLI proficiency when describing any cloud or on-prem pipeline work — e.g., "managed Spark cluster startup scripts, log rotation, and cron-scheduled ingestion jobs on Linux servers."',
    careerContext: {
      whyItMatters: 'Every production data pipeline eventually lands on a Linux server. Engineers who cannot navigate a terminal are blocked the moment a job fails on a remote machine at 2 AM.',
      realWorldUseCase: 'A DE investigating a failed nightly Airflow DAG SSHes into the worker node, uses journalctl to read service logs, grep to find the exact traceback, and df -h to confirm the disk was full — all in under five minutes.',
      interviewTip: 'Interviewers rarely quiz CLI syntax, but they notice when a candidate confidently describes debugging a production failure via SSH. Mention specific commands (grep, awk, tail -f) to signal real-world experience.',
      projectLink: 'Any pipeline project — use CLI tools to inspect raw files, tail logs during a run, and set up cron as a lightweight scheduler before adopting Airflow.',
    },
    nextStep: {
      id: 'git',
      title: 'Git',
      reason: 'Once you can work in a terminal you need version control — Git lets you track every change to your pipeline code and collaborate safely with a team.',
    },
  },
  {
    id: 'git',
    title: 'Git',
    label: 'Version Control',
    category: 'Foundations',
    difficulty: 'Beginner',
    progress: '0%',
    body: 'Track changes to pipeline code, collaborate with teammates, and roll back mistakes using Git.',
    overview: [
      {
        title: 'What is this?',
        body: 'Git is a distributed version control system that records every change made to your code. Data engineers use it to version SQL scripts, Python pipelines, dbt models, and Airflow DAGs so that changes are traceable, reviewable, and reversible.',
      },
      {
        title: 'Why do we use it?',
        body: 'Without Git, a broken deploy means scrambling to remember what changed. With Git, you run git log to see every commit, git diff to see exactly what changed, and git revert to undo a bad deployment in seconds. Teams use pull requests to review pipeline changes before they reach production.',
      },
      {
        title: 'Simple example',
        body: 'A typical workflow: git checkout -b feature/add-customer-dim creates a new branch, you edit your dbt model, run git add models/customer_dim.sql, git commit -m "add customer dimension model", then git push origin feature/add-customer-dim to open a pull request for review.',
      },
      {
        title: 'Practice task',
        body: 'Create a new Git repo with git init, add a .gitignore file that excludes .env and __pycache__, make your first commit, create a feature branch, make a change, and merge it back into main using a pull request on GitHub. Practice using git log --oneline to see your history.',
      },
    ],
    questions: [
      {
        question: 'What is the difference between git merge and git rebase?',
        answer: 'git merge creates a merge commit that preserves the full branch history. git rebase replays your commits on top of another branch for a linear history. Most data engineering teams use merge for feature branches and rebase for keeping a local branch up to date with main.',
      },
      {
        question: 'What should go in a .gitignore file for a data engineering project?',
        answer: 'Exclude .env files (credentials), __pycache__/, *.pyc (Python bytecode), .venv/ (virtual environments), large data files like *.csv or *.parquet, and IDE config folders like .vscode/ or .idea/. Never commit secrets or large binary files.',
      },
      {
        question: 'How do you undo the last commit without losing your file changes?',
        answer: 'Run git reset --soft HEAD~1. This moves the HEAD pointer back one commit but leaves your files staged, so you can fix the commit message or add more changes before recommitting. Use --hard only if you truly want to discard the changes.',
      },
    ],
    module: null,
    step: 4,
    prerequisites: ['python'],
    timeEstimate: '1 week',
    interviewImportance: 'medium',
    commonMistakes: [
      'Committing directly to main — always use feature branches and pull requests so changes are reviewed before reaching production pipelines.',
      'Vague commit messages like "fix stuff" — write messages that explain why the change was made, e.g. "fix incremental watermark to handle NULL updated_at".',
      'Committing secrets or large files — add a .gitignore before the first commit; removing secrets from Git history is painful and involves rewriting history with git filter-repo.',
    ],
    resumeRelevance: 'Every data engineering role lists Git as required. On your resume, mention Git in project descriptions: "managed pipeline code with Git, using feature branches and pull requests for all production changes."',
    careerContext: {
      whyItMatters: 'Data pipelines that are not in version control are a liability — no audit trail, no rollback, no collaboration. Git is the minimum standard for treating data code as software.',
      realWorldUseCase: 'A team discovers a dbt model started returning wrong revenue figures after a Friday deploy. They run git log --oneline to find the commit, git show to see the exact SQL change, and git revert to restore production in ten minutes.',
      interviewTip: 'Be ready to describe a Git branching strategy (e.g., GitHub Flow) and explain how you handle hotfixes on a production pipeline. Mentioning CI/CD integration (GitHub Actions running dbt test on every PR) impresses interviewers.',
      projectLink: 'All portfolio projects should live on GitHub with meaningful commit history — recruiters and hiring managers look at your repos to evaluate code quality and engineering habits.',
    },
    nextStep: {
      id: 'data-modeling',
      title: 'Data Modeling',
      reason: 'With SQL, Python, terminal skills, and version control in place, data modeling teaches you how to design the tables and schemas your pipelines will load into — the foundation of every data warehouse.',
    },
  },
  {
    id: 'data-modeling',
    title: 'Data Modeling',
    label: 'Modeling',
    category: 'Foundations',
    difficulty: 'Beginner to Intermediate',
    progress: '0%',
    body: 'Design efficient, queryable data warehouse schemas using star schemas, normalization, and dimensional modeling techniques.',
    overview: [
      {
        title: 'What is this?',
        body: 'Data modeling is the process of deciding how to organize data into tables and how those tables relate to each other. For data warehouses, the most common approach is dimensional modeling — separating business events (fact tables) from descriptive context (dimension tables) into a star or snowflake schema.',
      },
      {
        title: 'Why do we use it?',
        body: 'A well-modeled warehouse makes analytics fast and intuitive. A star schema with a fact_orders table joined to dim_customer, dim_product, and dim_date lets an analyst answer any business question with a simple JOIN — no tribal knowledge required. Poor modeling means slow queries, confusing schemas, and broken reports.',
      },
      {
        title: 'Simple example',
        body: 'A retail star schema: fact_sales stores one row per transaction with foreign keys order_id, customer_id, product_id, date_id, and the measure sale_amount. dim_customer stores customer_id, name, city, segment. An analyst sums sale_amount grouped by dim_customer.segment with one JOIN — no complex subqueries needed.',
      },
      {
        title: 'Practice task',
        body: 'Design a star schema for an e-commerce business. Identify at least one fact table and three dimension tables. Write CREATE TABLE SQL for each, making sure fact table columns use foreign keys to dimension tables. Then consider: how would you handle a customer who changes their address? (SCD Type 2)',
      },
    ],
    questions: [
      {
        question: 'What is the difference between a star schema and a snowflake schema?',
        answer: 'In a star schema, dimension tables are denormalized — all attributes live in one flat table. In a snowflake schema, dimensions are normalized into multiple related tables (e.g., dim_product references dim_category). Star schemas are faster to query; snowflake schemas save storage and reduce update anomalies.',
      },
      {
        question: 'What is a Slowly Changing Dimension (SCD) and what are Type 1 and Type 2?',
        answer: 'An SCD handles dimension attributes that change over time (e.g., a customer changes city). Type 1 overwrites the old value — simple but loses history. Type 2 adds a new row with an effective_date and end_date, preserving full history so you can report on what the attribute was at any point in time.',
      },
      {
        question: 'What is a surrogate key and why is it preferred over a natural key in dimension tables?',
        answer: 'A surrogate key is a system-generated integer (e.g., customer_dim_key = 1001) with no business meaning. It is preferred because natural keys (email, SSN) can change, contain PII, or be inconsistent across source systems. Surrogate keys remain stable even when source data changes.',
      },
    ],
    module: null,
    step: 5,
    prerequisites: ['sql'],
    timeEstimate: '2–3 weeks',
    interviewImportance: 'high',
    commonMistakes: [
      'Building one giant "ODS" table instead of fact/dimension tables — wide denormalized tables are hard to maintain, slow to query, and break analytics tools.',
      'Forgetting grain definition — always state the grain of a fact table (one row per order line, not per order) before designing it; the wrong grain causes double-counting in reports.',
      'Ignoring SCD strategy — loading dimension data with a simple INSERT overwrites history; decide upfront whether you need Type 1 (overwrite) or Type 2 (history) for each dimension.',
    ],
    resumeRelevance: 'List data modeling on your resume with specifics: "designed star schema with 3 fact tables and 8 dimension tables in Snowflake, reducing average dashboard query time by 60%."',
    careerContext: {
      whyItMatters: 'Data modeling is the design phase of data engineering — getting it wrong means analysts write slow, confusing queries and dashboards return wrong numbers. A good model is the foundation every downstream consumer depends on.',
      realWorldUseCase: 'A DE designs a fact_events table at the session-grain for a SaaS product, linked to dim_user (with SCD Type 2 for plan changes) and dim_feature. The analytics team can now accurately report feature adoption by plan tier, even for users who upgraded mid-period.',
      interviewTip: 'Interviewers often ask you to design a schema for a given business (Uber, Airbnb, retail). Practice stating the grain first, then naming your fact and dimension tables. Knowing SCD Types 1 and 2 is essential for senior roles.',
      projectLink: 'Incremental ETL Pipeline — the target tables you load into should follow a star schema; design them first before writing the ingestion code.',
    },
    nextStep: {
      id: 'etl-vs-elt',
      title: 'ETL vs ELT',
      reason: 'With a target schema designed, the next decision is whether to transform data before loading it (ETL) or after (ELT) — this choice shapes every pipeline you build.',
    },
  },
  {
    id: 'etl-vs-elt',
    title: 'ETL vs ELT',
    label: 'ETL/ELT',
    category: 'Pipeline',
    difficulty: 'Beginner',
    progress: '0%',
    body: 'Understand the architectural difference between ETL and ELT, and know when to use each pattern in modern data stacks.',
    overview: [
      {
        title: 'What is this?',
        body: 'ETL (Extract, Transform, Load) transforms data in a processing layer before it reaches the warehouse. ELT (Extract, Load, Transform) loads raw data into the warehouse first, then transforms it there using SQL or dbt. Both describe where and when transformation happens in a pipeline.',
      },
      {
        title: 'Why do we use it?',
        body: 'ETL was the standard when warehouses were expensive and slow — you cleaned data before loading to save space. Modern cloud warehouses (Snowflake, BigQuery, Redshift) are cheap and fast at SQL, making ELT the preferred modern pattern. ELT preserves raw data for reprocessing, and dbt makes the transform step version-controlled and testable.',
      },
      {
        title: 'Simple example',
        body: 'ETL: A Python script reads from a Postgres source, cleans nulls, standardizes dates, and writes clean rows to Snowflake. ELT: Fivetran copies the raw Postgres table to Snowflake unchanged, then a dbt model runs SELECT statements to create the clean, transformed version inside Snowflake.',
      },
      {
        title: 'Practice task',
        body: 'For a scenario where you receive a daily JSON file of orders from an e-commerce API: design both an ETL approach (Python transforms before load) and an ELT approach (load raw JSON to a staging table, transform with SQL). List the pros and cons of each for this specific case.',
      },
    ],
    questions: [
      {
        question: 'What is the main advantage of ELT over ETL in modern data stacks?',
        answer: 'ELT preserves raw data in the warehouse, so you can rerun transformations when business logic changes without re-ingesting from the source. Cloud warehouses execute SQL transforms at scale cheaply, making in-warehouse transformation faster and more maintainable than custom Python ETL code.',
      },
      {
        question: 'When is ETL still the right choice over ELT?',
        answer: 'ETL is preferable when: data contains PII that must be masked before it touches the warehouse, source data is very large and pre-aggregation saves storage costs, or the target system cannot handle raw/semi-structured data (e.g., a legacy relational database with a strict schema).',
      },
      {
        question: 'What tool is most associated with the ELT transform step in the modern data stack?',
        answer: 'dbt (data build tool) — it lets you write SQL SELECT statements that define transformations, runs them inside the warehouse, and adds version control, testing, and documentation. Fivetran or Airbyte handle the EL (extract and load) portion.',
      },
    ],
    module: null,
    step: 6,
    prerequisites: ['python'],
    timeEstimate: '1 week',
    interviewImportance: 'high',
    commonMistakes: [
      'Treating ETL and ELT as mutually exclusive — most real pipelines are hybrid; raw ingestion is ELT but some masking or flattening happens before load for security or schema reasons.',
      'Skipping the raw/staging layer in ELT — always land data in a raw schema before transforming; without it, a broken transform means re-ingesting from the source.',
      'Choosing ETL for all transformations because it feels "cleaner" — complex Python transform logic is harder to test, version, and maintain than SQL in dbt.',
    ],
    resumeRelevance: 'Mention ETL vs ELT when describing pipeline architecture decisions: "migrated legacy Python ETL to an ELT pattern using Fivetran for ingestion and dbt for in-warehouse transformation, reducing pipeline maintenance time by 40%."',
    careerContext: {
      whyItMatters: 'The shift from ETL to ELT defines the modern data stack. Every DE interview will ask you to describe a pipeline architecture, and knowing when and why to choose each pattern shows architectural maturity.',
      realWorldUseCase: 'A startup replaces a fragile Python ETL script (that breaks whenever the source schema changes) with Fivetran to load raw data into Snowflake, then dbt models to transform it. Schema changes now only break the dbt layer, which is version-controlled and easy to fix.',
      interviewTip: 'When asked to design a pipeline, always clarify whether the company uses a modern cloud warehouse. If yes, default to ELT and mention dbt for transforms. Explain that raw data retention is a key benefit — it signals that you understand production realities.',
      projectLink: 'Incremental ETL Pipeline — even if you write the transform in Python, articulate why you made that choice and what an ELT version would look like.',
    },
    nextStep: {
      id: 'batch-processing',
      title: 'Batch Processing',
      reason: 'Understanding ETL vs ELT sets the stage for batch processing — the most common pipeline execution model, where data is collected and processed in scheduled chunks rather than record by record.',
    },
  },
  {
    id: 'batch-processing',
    title: 'Batch Processing',
    label: 'Batch',
    category: 'Pipeline',
    difficulty: 'Intermediate',
    progress: '0%',
    body: 'Build reliable scheduled pipelines that process data in discrete time windows using tools like Airflow, Spark, and SQL.',
    overview: [
      {
        title: 'What is this?',
        body: 'Batch processing collects data over a period of time and processes it all at once on a schedule — hourly, daily, or weekly. It is the dominant pattern in data engineering, covering nightly warehouse loads, daily reporting aggregations, and weekly ML feature generation.',
      },
      {
        title: 'Why do we use it?',
        body: 'Batch is simpler, cheaper, and easier to retry than streaming. Most business questions (daily revenue, weekly active users, monthly churn) do not need real-time answers — a nightly batch load is sufficient. Airflow is the most common orchestrator: it schedules DAGs, handles retries, and sends alerts on failure.',
      },
      {
        title: 'Simple example',
        body: 'An Airflow DAG runs at 2 AM: Task 1 extracts yesterday\'s orders from Postgres using a Python operator with a date filter (WHERE created_at >= \'{{ ds }}\'), Task 2 runs a Spark job to aggregate by product, Task 3 loads the result to Snowflake. If Task 2 fails, Airflow retries twice before alerting on Slack.',
      },
      {
        title: 'Practice task',
        body: 'Write an Airflow DAG with three tasks: (1) a PythonOperator that simulates extracting rows for a given execution_date, (2) a BashOperator that echoes the row count, and (3) a PythonOperator that marks the run complete. Use Airflow\'s {{ ds }} macro for the execution date. Practice triggering it manually with airflow dags trigger.',
      },
    ],
    questions: [
      {
        question: 'What is idempotency and why is it critical for batch pipelines?',
        answer: 'An idempotent pipeline produces the same result no matter how many times it runs for the same time window. It is critical because Airflow retries, backfills, and manual reruns are common. Achieve it by deleting and reinserting data for the partition (DELETE WHERE date = \'{{ ds }}\' then INSERT) rather than appending.',
      },
      {
        question: 'What is a DAG in Airflow and what are its three main scheduling concepts?',
        answer: 'A DAG (Directed Acyclic Graph) is a collection of tasks with defined dependencies. The three key concepts are: schedule_interval (how often it runs, e.g. @daily), start_date (the first execution date), and catchup (whether to backfill missed runs). Dependencies are set with task_a >> task_b.',
      },
      {
        question: 'How do you handle a batch pipeline that needs to process data for the past 30 days after a bug fix?',
        answer: 'Use Airflow backfill: airflow dags backfill --start-date 2024-01-01 --end-date 2024-01-30 my_dag. This triggers a DAG run for each day in the range. The pipeline must be idempotent — it should overwrite the partition, not append — so reruns produce correct results.',
      },
    ],
    module: null,
    step: 7,
    prerequisites: ['etl-vs-elt'],
    timeEstimate: '2–3 weeks',
    interviewImportance: 'high',
    commonMistakes: [
      'Non-idempotent pipelines that append on every run — a single Airflow retry doubles your data; always DELETE the partition before INSERT or use MERGE/UPSERT.',
      'Using catchup=True without understanding backfill — enabling catchup on a DAG with a past start_date triggers hundreds of runs on deploy, overwhelming the database and downstream systems.',
      'Not setting task-level retries and timeouts — a task waiting indefinitely on a slow API will block the entire DAG; always set retries=3 and execution_timeout.',
    ],
    resumeRelevance: 'Describe batch pipelines with specifics: "built an idempotent Airflow DAG processing 5M daily order events with automatic retry logic and Slack alerting on failure."',
    careerContext: {
      whyItMatters: 'The vast majority of data engineering work is batch — daily warehouse loads, nightly dbt runs, weekly ML feature pipelines. Mastering batch processing with Airflow is the core skill of the role.',
      realWorldUseCase: 'A DE builds a nightly Airflow DAG that extracts the prior day\'s clickstream from S3, runs a Spark job to sessionize events, and loads session-level aggregates to Snowflake by 6 AM. Analysts have fresh data when they arrive at work.',
      interviewTip: 'Idempotency is the most common batch processing interview question. Be ready to explain exactly how you make a pipeline safe to retry: the DELETE-then-INSERT pattern, partitioned overwrites in Spark, or MERGE statements.',
      projectLink: 'Incremental ETL Pipeline — the scheduled execution model is batch; wire it up with Airflow and make it idempotent by design.',
    },
    nextStep: {
      id: 'incremental-loading',
      title: 'Incremental Loading',
      reason: 'Batch processing often loads all data, which is slow and expensive at scale. Incremental loading is the optimization — processing only new or changed rows each run.',
    },
  },
  {
    id: 'incremental-loading',
    title: 'Incremental Loading',
    label: 'Incremental',
    category: 'Pipeline',
    difficulty: 'Intermediate',
    progress: '0%',
    body: 'Load only new or changed data each pipeline run using watermarks, MERGE statements, and partition-based strategies to minimize cost and processing time.',
    overview: [
      {
        title: 'What is this?',
        body: 'Incremental loading is a pipeline strategy that processes only records that are new or changed since the last successful run, rather than reloading the entire dataset. It uses a watermark — typically a max(updated_at) timestamp — to filter the source, and a MERGE (upsert) statement to update existing rows and insert new ones in the target.',
      },
      {
        title: 'Why do we use it?',
        body: 'Full loads of large tables take hours and waste compute. A table with 500M rows only has 50K new rows per day — incremental loading processes only those 50K. This reduces run time from hours to minutes, cuts cloud compute costs, and reduces load on source systems during business hours.',
      },
      {
        title: 'Simple example',
        body: 'Watermark pattern: store max_updated_at = SELECT MAX(updated_at) FROM target_table. Then extract: SELECT * FROM source WHERE updated_at > max_updated_at. Finally MERGE into the target: match on primary key, UPDATE if exists, INSERT if not. Store the new watermark for the next run.',
      },
      {
        title: 'Practice task',
        body: 'Build a Python script that: (1) reads a watermark from a metadata table (or a JSON file), (2) queries a source table for rows updated after the watermark, (3) upserts those rows into a target table using MERGE or INSERT ON CONFLICT, and (4) saves the new watermark. Make it safe to rerun by storing the watermark only after a successful load.',
      },
    ],
    questions: [
      {
        question: 'What is a watermark in the context of incremental loading and what are its failure modes?',
        answer: 'A watermark is the last-processed timestamp used to filter new data — typically MAX(updated_at) from the previous run. Failure modes: late-arriving data with an updated_at in the past will be missed; if the source system clock skews or updated_at is nullable, rows are silently skipped. Mitigation: use a small lookback buffer (e.g., subtract 10 minutes from the watermark).',
      },
      {
        question: 'What is the difference between INSERT-only incremental loading and upsert (MERGE) incremental loading?',
        answer: 'INSERT-only appends new rows — suitable for immutable event logs (clicks, sensor readings) where records never change. MERGE (upsert) handles both inserts and updates — required for entity tables (customers, orders) where existing records change. Using INSERT-only on a mutable table results in duplicates.',
      },
      {
        question: 'How does dbt handle incremental models and what strategy does it use by default?',
        answer: 'dbt incremental models use the {% if is_incremental() %} block to add a WHERE filter for new rows. The default strategy is "append" (INSERT only). Use strategy="merge" with a unique_key to upsert. dbt also supports "delete+insert" for partitioned tables and "insert_overwrite" for Spark/BigQuery partition replacement.',
      },
    ],
    module: null,
    step: 8,
    prerequisites: ['batch-processing'],
    timeEstimate: '2 weeks',
    interviewImportance: 'critical',
    commonMistakes: [
      'Saving the watermark before the load completes — if the MERGE fails after saving the watermark, the next run skips those rows permanently; always save the watermark only after a confirmed successful load.',
      'Not handling late-arriving data — source systems sometimes backfill old records; add a lookback window (e.g., watermark minus 1 hour) to catch late arrivals at the cost of reprocessing a small overlap.',
      'Using updated_at as the only filter when soft deletes exist — deleted rows in the source keep their old updated_at and are never processed; add a separate delete detection step or use CDC.',
    ],
    resumeRelevance: 'Incremental loading is one of the most resume-impactful DE skills. Quantify it: "converted full-load pipeline to incremental with watermark tracking, reducing daily run time from 4 hours to 12 minutes and cutting Spark compute costs by 80%."',
    careerContext: {
      whyItMatters: 'At scale, full loads are simply not viable — a 1 TB table cannot be reloaded daily. Every senior DE role expects you to design and debug incremental pipelines. It is also one of the most common interview design questions.',
      realWorldUseCase: 'A fintech DE replaces a nightly full reload of a 200M-row transactions table with a watermark-based incremental MERGE. The pipeline now runs in 8 minutes instead of 3.5 hours, and the source Postgres database is no longer overwhelmed during business hours.',
      interviewTip: 'When asked to design a pipeline, always ask: "How large is the table and how frequently does it change?" If large and frequently updated, propose incremental loading with a watermark and MERGE, and discuss late-arriving data handling.',
      projectLink: 'Incremental ETL Pipeline — the entire project is built around this pattern; implement watermark tracking in a metadata table and use MERGE to handle updates.',
    },
    nextStep: {
      id: 'cdc',
      title: 'Change Data Capture',
      reason: 'Incremental loading with watermarks requires updated_at columns and misses hard deletes. CDC reads the database transaction log to capture every insert, update, and delete without modifying the source schema.',
    },
  },
  {
    id: 'cdc',
    title: 'Change Data Capture',
    label: 'CDC',
    category: 'Pipeline',
    difficulty: 'Intermediate',
    progress: '0%',
    body: 'Stream database changes (inserts, updates, deletes) from source systems to targets in near-real-time by reading transaction logs with tools like Debezium.',
    overview: [
      {
        title: 'What is this?',
        body: 'Change Data Capture (CDC) is a technique that reads a database\'s transaction log (e.g., PostgreSQL WAL, MySQL binlog) to capture every row-level change — inserts, updates, and deletes — as they happen. Unlike watermark-based incremental loading, CDC catches hard deletes and does not require an updated_at column in the source table.',
      },
      {
        title: 'Why do we use it?',
        body: 'Watermark-based loading misses hard deletes and requires source tables to have updated_at columns. CDC solves both problems. It is the gold standard for keeping a data warehouse in sync with an OLTP database with sub-minute latency. Debezium (open source) is the most popular CDC tool, streaming changes to Kafka topics.',
      },
      {
        title: 'Simple example',
        body: 'Debezium monitors a Postgres orders table. When a row is deleted, Debezium emits a Kafka message: {"op": "d", "before": {"order_id": 123, "status": "pending"}, "after": null}. A consumer reads this message and deletes order 123 from the warehouse, or marks it as deleted in a soft-delete pattern.',
      },
      {
        title: 'Practice task',
        body: 'Set up Debezium with a local Postgres database using Docker Compose. Insert, update, and delete a row in Postgres. Use a Kafka consumer (kafkacat or Python kafka-python) to read the CDC messages from the Debezium topic and print the operation type (c=create, u=update, d=delete) and the changed row.',
      },
    ],
    questions: [
      {
        question: 'What are the three operation types in a CDC event and what does each payload look like?',
        answer: 'Create (op: c): before is null, after contains the new row. Update (op: u): before contains the old values, after contains the new values. Delete (op: d): before contains the deleted row, after is null. Debezium emits these as JSON messages on Kafka topics named server.schema.table.',
      },
      {
        question: 'What database-level prerequisite must be configured before Debezium can capture changes from Postgres?',
        answer: 'Logical replication must be enabled in PostgreSQL. Set wal_level = logical in postgresql.conf, create a replication slot, and grant the Debezium user REPLICATION privilege. Without this, Debezium cannot read the WAL (Write Ahead Log) and will fail to connect.',
      },
      {
        question: 'How do you handle CDC events to maintain an accurate snapshot table in a warehouse?',
        answer: 'Apply events in order using a MERGE statement: for op=c and op=u, upsert the row (match on primary key, INSERT or UPDATE). For op=d, DELETE the row or set a deleted_at timestamp for soft-delete auditing. Process events in Kafka offset order to avoid applying an old update after a newer delete.',
      },
    ],
    module: null,
    step: 9,
    prerequisites: ['incremental-loading'],
    timeEstimate: '2 weeks',
    interviewImportance: 'high',
    commonMistakes: [
      'Not planning for replication slot lag — Debezium replication slots hold WAL segments until consumed; if the consumer is slow or down, the Postgres disk fills up and crashes the source database.',
      'Ignoring schema evolution — a source column rename or type change breaks the Debezium connector; use a schema registry (Confluent Schema Registry with Avro) to manage schema versions.',
      'Processing CDC events out of order — consuming multiple Kafka partitions in parallel without ordering by primary key can apply an old update after a delete, causing phantom rows.',
    ],
    resumeRelevance: 'CDC is a differentiating skill. List it as: "implemented CDC pipeline using Debezium and Kafka to replicate Postgres changes to Snowflake with sub-minute latency, replacing a brittle nightly full load."',
    careerContext: {
      whyItMatters: 'As companies move toward real-time analytics, CDC is becoming a standard pattern for keeping warehouses in sync with operational databases. It eliminates the last major gap of watermark-based loading: hard deletes.',
      realWorldUseCase: 'An e-commerce company needs to reflect order cancellations in their warehouse within minutes for fraud detection. They implement Debezium on their Postgres orders database, stream changes to Kafka, and a Flink consumer applies deletes to their Snowflake fact_orders table in near real time.',
      interviewTip: 'CDC questions often appear as system design scenarios: "How would you replicate a Postgres database to a warehouse in near real time?" Walk through: enable WAL logical replication, deploy Debezium, stream to Kafka, consume and apply MERGE/DELETE operations.',
      projectLink: 'Add a CDC component to your incremental pipeline project: use Debezium to capture deletes from a local Postgres database and propagate them to your target table.',
    },
    nextStep: {
      id: 'data-quality',
      title: 'Data Quality',
      reason: 'Once data is flowing through your pipelines, you need automated checks to catch corrupt, missing, or anomalous data before it reaches analysts — that is what data quality frameworks provide.',
    },
  },
  {
    id: 'data-quality',
    title: 'Data Quality',
    label: 'Data Quality',
    category: 'Pipeline',
    difficulty: 'Intermediate',
    progress: '0%',
    body: 'Implement automated data quality checks using Great Expectations, dbt tests, and anomaly detection to catch bad data before it reaches dashboards.',
    overview: [
      {
        title: 'What is this?',
        body: 'Data quality is the practice of automatically validating that data meets defined expectations at every stage of a pipeline — source, staging, and final tables. It covers completeness (no unexpected nulls), uniqueness (no duplicates on primary keys), freshness (data arrived on time), and business logic (revenue is never negative).',
      },
      {
        title: 'Why do we use it?',
        body: 'Bad data in production is a silent killer — dashboards show wrong revenue, ML models train on corrupt features, and finance reports reconcile incorrectly. Automated DQ checks act as a test suite for your data: they run after every pipeline load and fail fast if something is wrong, preventing bad data from propagating downstream.',
      },
      {
        title: 'Simple example',
        body: 'A dbt test suite on a fact_orders table: unique and not_null on order_id (primary key integrity), accepted_values on status (only allowed: pending, shipped, delivered, cancelled), relationships to dim_customer (every order has a valid customer), and a custom test that COUNT(*) > 10000 (freshness check — daily load should have >10K rows).',
      },
      {
        title: 'Practice task',
        body: 'Install Great Expectations (pip install great_expectations) and write a suite for a CSV file with columns: order_id, customer_id, amount, status. Add expectations for: order_id is unique and not null, amount is between 0 and 10000, status is in ["pending","shipped","cancelled"]. Run the suite and generate an HTML data docs report.',
      },
    ],
    questions: [
      {
        question: 'What are the four dimensions of data quality most commonly checked in pipelines?',
        answer: 'Completeness (no unexpected nulls — is required data present?), Uniqueness (no duplicates on primary keys), Freshness (data arrived on time — is today\'s partition non-empty?), and Validity/Accuracy (values are in expected ranges or sets — e.g., age between 0 and 120, status in allowed enum values).',
      },
      {
        question: 'What is the difference between dbt tests and Great Expectations?',
        answer: 'dbt tests are lightweight SQL assertions (unique, not_null, accepted_values, relationships) defined in YAML and run after dbt models execute — best for in-warehouse column-level checks. Great Expectations is a standalone Python framework for defining complex expectation suites, generating HTML data docs, and validating data at any stage (file, Spark DataFrame, database table).',
      },
      {
        question: 'How should a pipeline respond when a data quality check fails — block or alert?',
        answer: 'It depends on severity. Critical checks (missing primary key, negative revenue) should block the pipeline — fail the Airflow task so bad data never reaches production tables. Warning-level checks (e.g., 5% more nulls than usual) should alert via Slack or PagerDuty but let the pipeline continue, giving engineers time to investigate without stopping the business.',
      },
    ],
    module: null,
    step: 10,
    prerequisites: ['batch-processing'],
    timeEstimate: '2 weeks',
    interviewImportance: 'high',
    commonMistakes: [
      'Only adding DQ checks at the final table — bad data should be caught at source/staging before it propagates; add checks at each layer (raw, staging, final) to localize where corruption entered.',
      'Writing checks that never fail in practice — a not_null check on a column that is never null adds no value; focus checks on columns that have historically had quality issues or that feed critical KPIs.',
      'Not alerting on DQ failures — a failing check that silently stops the pipeline with no notification means analysts discover bad data hours later; always wire DQ failures to Slack/email alerting.',
    ],
    resumeRelevance: 'Mention DQ frameworks by name: "implemented Great Expectations suite with 45 checks across raw and staging layers, reducing data quality incidents by 70% in the first quarter."',
    careerContext: {
      whyItMatters: 'Data quality is increasingly a dedicated role (Analytics Engineer, Data Reliability Engineer) and a key interview topic. Companies that have suffered a "bad data" incident in production are especially focused on hiring engineers who build quality checks proactively.',
      realWorldUseCase: 'A DE adds a Great Expectations suite to an Airflow DAG loading marketing spend data. A check for sum(spend) > 0 catches a day where the source API returned an empty response instead of an error — saving the marketing team from making budget decisions on a dashboard showing $0 spend.',
      interviewTip: 'Interviewers love to ask: "How do you ensure data quality in your pipelines?" Go beyond saying "we test it" — describe specific frameworks (dbt tests, Great Expectations), the four DQ dimensions, and your strategy for blocking vs alerting on failures.',
      projectLink: 'Add a dbt test suite to your incremental pipeline project: write unique, not_null, and at least one custom row-count freshness test for your main fact table.',
    },
    nextStep: {
      id: 'pyspark',
      title: 'PySpark',
      reason: 'With pipeline patterns mastered, the next step is big data processing — PySpark lets you process terabytes of data in parallel across a cluster, which is required when pandas and SQL reach their limits.',
    },
  },
  {
    id: 'spark-optimization',
    title: 'Spark Optimization',
    label: 'Spark Tuning',
    category: 'Big Data',
    difficulty: 'Intermediate to Advanced',
    progress: '0%',
    body: 'Tune Spark jobs for production performance by understanding shuffles, partitioning, caching, and executor configuration to eliminate bottlenecks.',
    overview: [
      {
        title: 'What is this?',
        body: 'Spark optimization is the practice of making Spark jobs run faster and cheaper by eliminating unnecessary work. It covers understanding the physical execution plan (EXPLAIN), tuning shuffle partitions, reducing data movement across the network, caching reused DataFrames, and right-sizing executor memory and cores.',
      },
      {
        title: 'Why do we use it?',
        body: 'An unoptimized Spark job processing 1 TB might take 4 hours and cost $200. The same job, properly tuned, takes 20 minutes and costs $10. In production, slow jobs cause SLA breaches; over-provisioned clusters waste budget. Spark optimization is the difference between a Spark user and a Spark engineer.',
      },
      {
        title: 'Simple example',
        body: 'A join between a 500 GB fact table and a 5 MB dimension table runs slowly because Spark shuffles both sides (sort-merge join). Fix: broadcast the small table with spark.sql("SELECT /*+ BROADCAST(d) */ * FROM fact f JOIN dim d ON f.key = d.key"). This eliminates the shuffle entirely and cuts the job from 45 minutes to 8 minutes.',
      },
      {
        title: 'Practice task',
        body: 'Run a Spark job that joins two DataFrames and open the Spark UI (localhost:4040). Find the longest stage, check if it has a shuffle. Try: (1) broadcasting the smaller DataFrame, (2) changing spark.sql.shuffle.partitions from 200 to match your data size, and (3) caching an intermediate DataFrame that is used twice. Measure the before/after run times.',
      },
    ],
    questions: [
      {
        question: 'What is a shuffle in Spark and why is it expensive?',
        answer: 'A shuffle is when Spark must redistribute data across all executors — it happens during groupBy, join, distinct, and repartition operations. It is expensive because it requires writing intermediate data to disk and transferring it over the network. Reducing shuffle is the single highest-impact Spark optimization.',
      },
      {
        question: 'What is data skew in Spark and how do you fix it?',
        answer: 'Data skew occurs when one partition is much larger than others — e.g., a groupBy on customer_id where one customer has 80% of the rows. That one partition runs on a single executor while all others finish. Fix: use salting (add a random suffix to the key, process in two stages), or in Spark 3.0+ enable Adaptive Query Execution (AQE) with spark.sql.adaptive.enabled=true which handles skew automatically.',
      },
      {
        question: 'When should you use cache() vs persist() in Spark?',
        answer: 'cache() stores a DataFrame in memory (MEMORY_AND_DISK storage level). persist() lets you choose the storage level: MEMORY_ONLY (fastest, fails if OOM), MEMORY_AND_DISK (spills to disk if needed), DISK_ONLY (slower but safe for large DataFrames). Use cache/persist only when a DataFrame is used more than once in the same job; caching a single-use DataFrame wastes memory.',
      },
    ],
    module: null,
    step: 12,
    prerequisites: ['pyspark'],
    timeEstimate: '2–3 weeks',
    interviewImportance: 'high',
    commonMistakes: [
      'Leaving spark.sql.shuffle.partitions at the default 200 — for small datasets this creates overhead; for large datasets 200 partitions cause each partition to be too large. Set it to 2-3x the number of executor cores.',
      'Not checking the Spark UI — every optimization hypothesis should be validated in the Spark UI (stages, tasks, shuffle bytes); tuning without looking at the execution plan is guesswork.',
      'Caching too aggressively — caching DataFrames that are only used once wastes cluster memory, can cause out-of-memory errors for subsequent tasks, and actually slows the job down.',
    ],
    resumeRelevance: 'Spark optimization is a differentiating skill at the senior level. Quantify: "reduced Spark job runtime from 3 hours to 25 minutes by adding broadcast hints, fixing data skew with salting, and tuning shuffle partitions — saving $8K/month in Databricks compute."',
    careerContext: {
      whyItMatters: 'At companies processing petabytes, Spark job performance directly translates to cloud infrastructure cost. Senior DE roles and big data-focused interviews almost always include a Spark optimization scenario.',
      realWorldUseCase: 'A Databricks job processing 10 TB of clickstream data runs out of memory nightly. Investigation in the Spark UI reveals data skew: 60% of data belongs to one session ID used by a load tester. The DE adds a salting step to distribute the skewed key, re-tunes shuffle partitions with AQE, and the job stabilizes under its memory budget.',
      interviewTip: 'Spark optimization questions are tiered: juniors should know about broadcast joins and shuffle partitions, mid-level should explain data skew and AQE, and seniors should be able to read a Spark UI and diagnose bottlenecks from stage timelines and task metrics.',
      projectLink: 'Revisit any PySpark job in your portfolio, open the Spark UI, and apply at least one optimization. Document the before/after metrics — this makes a strong talking point in interviews.',
    },
    nextStep: {
      id: 'partitioning-strategies',
      title: 'Partitioning Strategies',
      reason: 'Spark optimization teaches you how to tune processing; partitioning strategies teach you how to physically organize data on storage so that future reads are fast — the two concerns work together.',
    },
  },
  {
    id: 'partitioning-strategies',
    title: 'Partitioning Strategies',
    label: 'Partitioning',
    category: 'Big Data',
    difficulty: 'Intermediate',
    progress: '0%',
    body: 'Organize large datasets into efficient partitions on cloud storage to enable partition pruning, reduce scan costs, and speed up both Spark and SQL queries.',
    overview: [
      {
        title: 'What is this?',
        body: 'Partitioning is the practice of dividing a large dataset into smaller physical chunks — folders on S3, HDFS, or ADLS — based on the value of one or more columns. A query that filters on the partition column only reads the relevant folders, skipping the rest. This is called partition pruning and is the primary mechanism for query acceleration on large datasets.',
      },
      {
        title: 'Why do we use it?',
        body: 'Without partitioning, a query for yesterday\'s data on a 3-year fact table scans all 1,095 days of data. With daily date partitioning, the same query reads 1/1,095 of the data. Partitioning by event_date is the default strategy for time-series data; partitioning by region or source_system is common for multi-tenant pipelines.',
      },
      {
        title: 'Simple example',
        body: 'Writing partitioned Parquet in Spark: df.write.partitionBy("event_date","region").parquet("s3://bucket/events/"). This creates folders like s3://bucket/events/event_date=2024-01-15/region=US/. A query with WHERE event_date = \'2024-01-15\' AND region = \'US\' reads only that one folder, not the entire dataset.',
      },
      {
        title: 'Practice task',
        body: 'Write a Spark job that reads a large CSV, adds an event_date column derived from a timestamp column, and writes the result as Parquet partitioned by event_date. Then run two queries: (1) without a date filter, (2) with WHERE event_date = \'2024-01-15\'. Compare the number of files read in the Spark UI to confirm partition pruning is working.',
      },
    ],
    questions: [
      {
        question: 'What is the small file problem in partitioned storage and how do you fix it?',
        answer: 'If a partition has many small files (e.g., hundreds of 100 KB Parquet files), read performance degrades because each file open is an expensive metadata call to S3/HDFS. Fix: after writing, run a compaction step — df.repartition(n).write.parquet() to merge small files into larger ones (target 128 MB–1 GB per file). Delta Lake\'s OPTIMIZE command automates this.',
      },
      {
        question: 'What is partition cardinality and why does high cardinality partitioning cause problems?',
        answer: 'Partition cardinality is the number of distinct values in the partition column. High cardinality partitions (e.g., partitioning by user_id with 50 million users) create 50 million folders — each with tiny files. Cloud object stores slow down with millions of prefixes, metadata operations become a bottleneck, and Spark produces one task per partition. Use low-to-medium cardinality columns (date, region, country) for partitioning.',
      },
      {
        question: 'What is the difference between Spark\'s partitionBy (storage partitioning) and repartition/coalesce (in-memory partitioning)?',
        answer: 'partitionBy in DataFrameWriter creates physical folder partitions on disk/storage — affects how files are organized for future reads. repartition() and coalesce() control the number of in-memory partitions during processing — affects parallelism and task count. You often use repartition() before a partitionBy write to control how many files are written per storage partition.',
      },
    ],
    module: null,
    step: 13,
    prerequisites: ['pyspark'],
    timeEstimate: '1–2 weeks',
    interviewImportance: 'high',
    commonMistakes: [
      'Partitioning by a high-cardinality column like user_id or order_id — creates millions of tiny files, destroys read performance, and overwhelms S3 metadata APIs; always partition by low-cardinality columns like date or region.',
      'Not controlling files-per-partition during writes — df.repartition(1).write.partitionBy("date") writes one file per partition but creates a serialization bottleneck; use repartition(N) where N gives files of 128 MB–512 MB each.',
      'Assuming partition pruning is automatic — in Spark, pruning only works if the filter column exactly matches the partitionBy column and the filter is pushed down before the scan; verify in EXPLAIN that PartitionFilters is populated.',
    ],
    resumeRelevance: 'Mention partitioning in cloud pipeline projects: "designed a partitioned Parquet data lake on S3 with daily date partitioning and automated compaction, reducing average query scan size by 95%."',
    careerContext: {
      whyItMatters: 'Partitioning strategy is a data lake design decision that cannot be easily changed after data accumulates — getting it wrong costs months of reprocessing. Every cloud DE role expects you to design partitioned storage layouts.',
      realWorldUseCase: 'A data lake stores 4 years of clickstream events in a single flat S3 folder. Every Spark query scans all 4 years. The DE rebuilds the lake partitioned by event_date, reducing query scan cost by 99% and slashing Databricks job costs by $15K/month.',
      interviewTip: 'Partitioning questions often come as design tasks: "How would you store 5 TB of daily transaction data in S3 for efficient querying?" Answer: partition by transaction_date (low cardinality), use Parquet, target 256 MB files, and run periodic compaction with OPTIMIZE or a Spark repartition job.',
      projectLink: 'In your data lake or pipeline project, explicitly choose a partition strategy and document why. Demonstrating intentional design decisions is more impressive than accidentally correct code.',
    },
    nextStep: {
      id: 'file-formats',
      title: 'File Formats',
      reason: 'Partitioning determines how data is organized; file formats determine how it is encoded within each partition. Choosing the right format (Parquet, ORC, Avro) has a major impact on performance and storage cost.',
    },
  },
  {
    id: 'file-formats',
    title: 'File Formats',
    label: 'File Formats',
    category: 'Big Data',
    difficulty: 'Intermediate',
    progress: '0%',
    body: 'Choose the right file format — Parquet, ORC, Avro, or Delta — based on read/write patterns, compression, schema evolution needs, and query engine compatibility.',
    overview: [
      {
        title: 'What is this?',
        body: 'File formats define how data is encoded, compressed, and stored in a data lake. The main options are: Parquet (columnar, best for analytics reads), ORC (columnar, optimized for Hive/Presto), Avro (row-based, best for streaming and writes), CSV/JSON (human-readable but slow and storage-inefficient), and Delta Lake (Parquet + transaction log).',
      },
      {
        title: 'Why do we use it?',
        body: 'Choosing the wrong format can make queries 10-100x slower. Parquet stores data by column — a query for SELECT revenue, category FROM orders only reads those two columns, skipping all others. CSV reads the entire row for every column in the query. Columnar formats also compress 5-10x better than row formats because similar values are grouped together.',
      },
      {
        title: 'Simple example',
        body: 'A 100 GB CSV table converted to Parquet with Snappy compression becomes ~12 GB. A query reading 3 columns out of 50 scans only 3/50 of the data (column pruning). On Spark, reading this Parquet file for a GROUP BY aggregation is 20-50x faster than reading the CSV equivalent.',
      },
      {
        title: 'Practice task',
        body: 'Take a large CSV file (>500 MB) and write it to three formats using Spark: CSV, Parquet with Snappy, and Parquet with ZSTD. Compare: (1) storage size, (2) time to run SELECT COUNT(*), SUM(amount) GROUP BY category, and (3) time to read a single column. Record the results and explain which format you would choose for a read-heavy analytics workload.',
      },
    ],
    questions: [
      {
        question: 'Why is Parquet preferred over CSV for analytics workloads?',
        answer: 'Parquet is a columnar format: it stores each column separately on disk, enabling column pruning (read only needed columns) and better compression (similar values compress well together). CSV is row-based — every query reads all columns. On a 50-column table where a query needs 3 columns, Parquet reads ~6% of the data that CSV would read, making queries orders of magnitude faster.',
      },
      {
        question: 'What is the difference between Snappy and ZSTD compression for Parquet and when would you choose each?',
        answer: 'Snappy compresses and decompresses very fast with moderate compression ratio (~3:1 for typical data). ZSTD achieves a higher compression ratio (~4-5:1) with acceptable speed. Choose Snappy when query latency matters most (Spark streaming, interactive queries). Choose ZSTD for cold archive data or when storage cost is the primary concern. LZ4 is another fast option similar to Snappy.',
      },
      {
        question: 'When would you choose Avro over Parquet in a data engineering pipeline?',
        answer: 'Choose Avro when writing data (streaming ingestion with Kafka, CDC pipelines) because Avro is row-based — writing one row at a time is efficient. Avro also stores the schema in the file header, making it self-describing and excellent for schema evolution with a Confluent Schema Registry. Parquet is optimized for reads; use it downstream after ingestion when the data is read many times by analytics queries.',
      },
    ],
    module: null,
    step: 14,
    prerequisites: ['pyspark'],
    timeEstimate: '1 week',
    interviewImportance: 'medium',
    commonMistakes: [
      'Using CSV in production data lakes — CSV has no schema enforcement, no compression, no column pruning, and breaks on commas in values; always use Parquet or ORC for analytics storage.',
      'Mixing multiple Parquet schemas in the same partition directory — different schemas in the same folder cause Spark schema inference to fail or silently return wrong data; use schema enforcement or Delta Lake.',
      'Ignoring row group size in Parquet — a Parquet file\'s row group (default 128 MB) determines the minimum read unit; too small and you lose compression and parallelism; too large and filter pushdown within a file becomes inefficient.',
    ],
    resumeRelevance: 'Mention file format decisions in project descriptions: "migrated data lake from CSV to Parquet with ZSTD compression, reducing storage costs by 70% and cutting Spark query times by 15x."',
    careerContext: {
      whyItMatters: 'File format is a foundational data lake design decision. Every DE needs to explain why they chose Parquet over CSV, understand the trade-offs for streaming vs. batch, and know when schema evolution requirements change the choice.',
      realWorldUseCase: 'A startup stores all pipeline output as JSON (human-readable but huge). A DE benchmarks Parquet vs. JSON on their 2 TB table: Parquet is 8x smaller and 25x faster for aggregation queries. The storage cost savings alone cover the engineering time within the first month.',
      interviewTip: 'File format questions are often part of data lake design problems. Be ready to compare Parquet vs. Avro vs. CSV, explain columnar vs. row storage, and justify your choice for a given scenario (streaming ingest vs. batch analytics).',
      projectLink: 'Explicitly write your pipeline output as Parquet with partitioning. Add a comparison in your README showing storage size and query time vs. CSV — it demonstrates empirical engineering judgment.',
    },
    nextStep: {
      id: 'delta-lake',
      title: 'Delta Lake',
      reason: 'Parquet gives you columnar storage, but it lacks ACID transactions and time travel. Delta Lake adds a transaction log on top of Parquet, turning a data lake into a reliable, queryable lakehouse.',
    },
  },
  {
    id: 'delta-lake',
    title: 'Delta Lake',
    label: 'Delta Lake',
    category: 'Big Data',
    difficulty: 'Intermediate',
    progress: '0%',
    body: 'Build reliable data lakehouses with ACID transactions, time travel, schema enforcement, and automatic optimization using the Delta Lake open-source format.',
    overview: [
      {
        title: 'What is this?',
        body: 'Delta Lake is an open-source storage layer built on top of Parquet that adds ACID transactions, time travel (query historical snapshots), schema enforcement, and scalable metadata management to a data lake. It is the storage format of Databricks and is supported natively in Apache Spark, Flink, and Trino.',
      },
      {
        title: 'Why do we use it?',
        body: 'Plain Parquet on S3 has no transactions — two concurrent writers corrupt the table. Delta Lake\'s transaction log (_delta_log/) serializes all writes, making concurrent writes safe. Time travel (VERSION AS OF 5) lets you query the table as it was before a bad write. Schema enforcement rejects writes with unexpected columns. OPTIMIZE and VACUUM compact small files and remove old versions automatically.',
      },
      {
        title: 'Simple example',
        body: 'Using Delta Lake in Spark: df.write.format("delta").mode("overwrite").save("/mnt/data/orders"). To time travel: spark.read.format("delta").option("versionAsOf", 10).load("/mnt/data/orders"). To MERGE (upsert): DeltaTable.forPath(spark, "/mnt/data/orders").alias("t").merge(updates.alias("s"), "t.id = s.id").whenMatchedUpdateAll().whenNotMatchedInsertAll().execute().',
      },
      {
        title: 'Practice task',
        body: 'Create a Delta table in Databricks or local Spark. Write 1000 rows, then overwrite with 1100 rows. Use DESCRIBE HISTORY to see the two versions. Time travel to version 0 and count the rows. Run OPTIMIZE to compact files, then VACUUM to clean up old versions (set retentionDurationCheck.enabled=false for the exercise). Observe how the _delta_log/ folder changes after each operation.',
      },
    ],
    questions: [
      {
        question: 'How does Delta Lake achieve ACID transactions and what is the transaction log?',
        answer: 'Delta Lake stores a _delta_log/ folder alongside the Parquet files. Every write (INSERT, UPDATE, DELETE, MERGE, OPTIMIZE) appends a new JSON commit file to this log. The log records which Parquet files were added and removed in that transaction. Readers always check the log first to see the current state of the table. This optimistic concurrency control provides serializable isolation.',
      },
      {
        question: 'What is Z-ordering in Delta Lake and when should you use it?',
        answer: 'Z-ordering is a technique that co-locates related values within the same Parquet files by rewriting data sorted on multiple columns simultaneously. OPTIMIZE my_table ZORDER BY (customer_id, event_date) ensures that queries filtering on customer_id or event_date skip the maximum number of files via data skipping. Use it on columns that are frequently filtered but not used as partition columns.',
      },
      {
        question: 'What is the difference between OPTIMIZE and VACUUM in Delta Lake and how often should you run each?',
        answer: 'OPTIMIZE compacts small Parquet files into larger ones (targeting 1 GB) to improve query performance and reduce the small file problem. Run it daily or after high-frequency streaming writes. VACUUM removes Parquet files that are no longer referenced by the transaction log (older than the retention period, default 7 days). Run VACUUM weekly to reclaim storage. Do not reduce retention below 7 days if time travel queries are important.',
      },
    ],
    module: null,
    step: 15,
    prerequisites: ['pyspark'],
    timeEstimate: '2–3 weeks',
    interviewImportance: 'critical',
    commonMistakes: [
      'Running VACUUM with a retention period under 7 days — this deletes files needed for time travel and can break concurrent readers; the default 7-day retention exists for safety.',
      'Not running OPTIMIZE after streaming writes — micro-batch streaming creates thousands of tiny files per hour; without daily OPTIMIZE the table becomes unqueryable within weeks.',
      'Forgetting to enable Change Data Feed for CDC use cases — Delta Lake\'s CDF (ALTER TABLE t SET TBLPROPERTIES (delta.enableChangeDataFeed=true)) lets downstream consumers read only changed rows since their last checkpoint, similar to CDC on a database.',
    ],
    resumeRelevance: 'Delta Lake proficiency is highly valued at companies using Databricks. List it as: "built a Delta Lake lakehouse on ADLS with ACID MERGE pipelines, Z-ordered fact tables, and automated OPTIMIZE/VACUUM maintenance jobs."',
    careerContext: {
      whyItMatters: 'Delta Lake (and the broader lakehouse paradigm) is the dominant architecture at large-scale data engineering shops using Databricks, Azure, or AWS. It is the most-discussed storage format in modern DE interviews, especially for senior roles.',
      realWorldUseCase: 'A media company\'s data lake has been corrupted by concurrent Spark writes — duplicate rows appear after every peak traffic event. The DE migrates all tables to Delta Lake, which serializes concurrent writers via its transaction log. They also implement SCD Type 2 using Delta MERGE, replacing 200 lines of custom dedup SQL with a 10-line MERGE statement.',
      interviewTip: 'Expect questions on: (1) how the transaction log works, (2) time travel and version history, (3) MERGE syntax for upserts, and (4) OPTIMIZE + VACUUM for maintenance. At Databricks-heavy shops, Delta Lake depth is a primary differentiator between candidates.',
      projectLink: 'Rebuild your ETL pipeline project to write to Delta Lake instead of plain Parquet. Add a MERGE step for upserts, run OPTIMIZE after each load, and demonstrate time travel by querying a previous version. This is one of the most impressive portfolio upgrades for a DE resume.',
    },
    nextStep: {
      id: 'cloud-storage',
      title: 'Cloud Storage',
      reason: 'Delta Lake and all big data processing ultimately stores data in cloud object storage — learning how S3, ADLS, and GCS work at the API and permissions level is the next practical skill.',
    },
  },
  {
    id: 'cloud-storage',
    title: 'Cloud Storage',
    label: 'Cloud Storage',
    category: 'Cloud',
    difficulty: 'Beginner',
    progress: '0%',
    body: 'Store, organize, and access large datasets using cloud object storage services — AWS S3, Azure ADLS, and GCS — including permissions, lifecycle policies, and integration with data tools.',
    overview: [
      {
        title: 'What is this?',
        body: 'Cloud object storage (AWS S3, Azure Data Lake Storage Gen2, Google Cloud Storage) is the foundational storage layer for modern data lakehouses. Unlike databases, object storage holds any file type at virtually unlimited scale and very low cost (~$0.023/GB/month for S3 Standard). Data lakes, Delta Lakes, and data warehouses like Snowflake and BigQuery all use cloud object storage as their underlying file store.',
      },
      {
        title: 'Why do we use it?',
        body: 'Cloud object storage decouples storage from compute — you pay only for what you store, and any number of compute clusters (Spark, Databricks, Athena, Redshift Spectrum) can read the same files simultaneously. It replaces expensive on-prem SANs, supports any file format (Parquet, Avro, JSON, CSV), and integrates natively with every cloud data tool.',
      },
      {
        title: 'Simple example',
        body: 'An AWS pipeline: raw JSON from a Kinesis stream lands in s3://company-raw/events/2024/01/15/. A Glue job reads it, transforms to Parquet, and writes to s3://company-curated/events/event_date=2024-01-15/. An S3 lifecycle policy automatically moves files in company-raw older than 90 days to S3 Glacier, cutting storage costs by 70%.',
      },
      {
        title: 'Practice task',
        body: 'Using the AWS CLI (or Azure CLI), create an S3 bucket, upload a Parquet file with aws s3 cp, list the contents with aws s3 ls, and grant read access to a specific IAM role. Set a lifecycle rule that transitions objects to S3-IA (Infrequent Access) after 30 days. Then test that a Python script using boto3 can read the file using the IAM role (not hardcoded credentials).',
      },
    ],
    questions: [
      {
        question: 'What is the difference between S3, ADLS Gen2, and GCS for data engineering workloads?',
        answer: 'All three are equivalent in concept (cloud object storage) but differ in ecosystem integration. S3 is the default for AWS-native tools (Glue, Athena, EMR, Redshift Spectrum). ADLS Gen2 has hierarchical namespace (real folders) and integrates with Azure Databricks, Synapse, and Azure Data Factory. GCS is the native store for BigQuery and Dataproc. Choose based on your cloud provider — mixing providers adds egress costs.',
      },
      {
        question: 'How should a data pipeline authenticate to cloud storage in production?',
        answer: 'Never use hardcoded access keys. Use IAM roles attached to the compute resource (EC2 instance role, EKS service account, Databricks instance profile for AWS; Managed Identity for Azure). The compute service automatically receives temporary credentials via the metadata service. This eliminates credential rotation risk, prevents accidental key exposure in code, and provides audit logs via CloudTrail/Azure Monitor.',
      },
      {
        question: 'What is an S3 lifecycle policy and how does it help manage data lake storage costs?',
        answer: 'An S3 lifecycle policy automatically transitions objects to cheaper storage classes or deletes them after a defined period. Example: move raw ingest files to S3-IA after 30 days (40% cheaper), move to S3 Glacier after 90 days (68% cheaper), delete after 365 days. For a data lake receiving 1 TB/day, lifecycle policies can reduce monthly storage costs by 50-70% compared to keeping everything in S3 Standard.',
      },
    ],
    module: null,
    step: 16,
    prerequisites: ['python'],
    timeEstimate: '1–2 weeks',
    interviewImportance: 'medium',
    commonMistakes: [
      'Using hardcoded AWS access keys in pipeline code — keys get committed to Git, rotated manually, and exposed in logs; always use IAM instance roles or Managed Identity for production workloads.',
      'Storing all data in a single S3 bucket without folder structure — unstructured buckets become impossible to manage at scale; use a consistent prefix convention like bucket/layer/domain/table/event_date=YYYY-MM-DD.',
      'Ignoring S3 request costs for small file workloads — S3 charges per GET/PUT request; a pipeline that writes 100,000 tiny files makes 100,000 PUT requests; compact files before writing to minimize request costs.',
    ],
    resumeRelevance: 'Mention cloud storage in every pipeline project: "designed a three-layer data lake (raw/staging/curated) on S3 with IAM role-based access control and lifecycle policies reducing storage costs by 55%."',
    careerContext: {
      whyItMatters: 'Cloud object storage is the foundation of every modern data platform. A DE who does not understand S3/ADLS permissions, folder organization, and lifecycle management will struggle to build and maintain production pipelines.',
      realWorldUseCase: 'A DE discovers that a Spark job reading from S3 is slow not because of Spark configuration, but because the data is stored in millions of tiny files with no partitioning. They reorganize the lake into partitioned Parquet with correct prefix structure, reducing S3 LIST API calls by 99% and cutting job startup time from 12 minutes to 45 seconds.',
      interviewTip: 'Cloud storage questions often come as part of architecture design: "How would you design a data lake on AWS?" Cover: bucket structure (raw/staging/curated layers), file format (Parquet), partitioning strategy, IAM roles for access control, and lifecycle policies for cost management.',
      projectLink: 'Host your data pipeline project on a real cloud — even a free-tier AWS S3 bucket. Demonstrating that you can write Parquet to S3 from Python using boto3 with an IAM role (not hardcoded keys) signals production-readiness to hiring managers.',
    },
    nextStep: {
      id: 'azure-data-factory',
      title: 'Azure Data Factory',
      reason: 'With cloud storage fundamentals in place, Azure Data Factory is the next step for Azure-focused engineers — it provides a visual, low-code orchestration layer for building and scheduling cloud pipelines on Azure.',
    },
  },
];
