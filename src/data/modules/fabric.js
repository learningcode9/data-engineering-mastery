// Microsoft Fabric module — covers the full Fabric analytics platform.
// Source: https://learn.microsoft.com/en-us/fabric/

export const fabricModule = {
  sections: [
    {
      title: 'Microsoft Fabric Overview',
      subtopics: [
        {
          id: 'fabric-what-is',
          title: 'What is Microsoft Fabric?',
          difficulty: 'Beginner',
          explanation: 'Microsoft Fabric is an all-in-one analytics platform that unifies data engineering, data science, real-time analytics, and business intelligence in a single SaaS product. It runs on OneLake — a single logical data lake for the entire organization.',
          why: 'Fabric eliminates the need to stitch together separate tools (ADF, Synapse, Power BI, Databricks) — everything is integrated, governed under one identity, and billed from one place.',
          syntax: `// Fabric workspaces group items by project or team
// Items: Lakehouses, Warehouses, Notebooks, Pipelines, Reports, Semantic Models
// All items live on OneLake — no separate storage accounts needed`,
          example: `// Typical Fabric analytics architecture:
// Raw data → Eventstream (streaming) or Pipeline (batch)
//         → Lakehouse Bronze (raw Delta tables)
//         → Lakehouse Silver (cleaned Delta tables)
//         → Lakehouse Gold (aggregated Delta tables)
//         → Semantic Model → Power BI Dashboard`,
          expectedOutput: 'End-to-end pipeline from raw data to Power BI in a single platform with no external storage configuration',
          interview: {
            question: 'How does Microsoft Fabric differ from Azure Synapse Analytics, and when would you recommend migrating?',
            answer: 'Fabric is a complete SaaS platform built on OneLake — it includes Synapse-like capabilities (Spark, SQL) plus Power BI, Data Factory, and Real-Time Intelligence under one roof with unified governance and billing. Synapse requires you to wire together separate storage accounts, compute pools, linked services, and Power BI workspaces. Fabric removes that infrastructure overhead and adds Direct Lake mode for near-instant Power BI queries without import. Recommend migrating when: the team wants reduced operational overhead, you\'re already deep in Power BI and Azure, or you need to eliminate the Synapse → Power BI refresh latency. Keep Synapse if you have heavy dedicated SQL pool workloads or complex existing pipelines not yet supported in Fabric.',
          },
          commonMistakes: [
            'Treating Fabric as just "Synapse with a new UI" — Fabric is a fundamentally different architecture. OneLake eliminates storage silos; Direct Lake eliminates import refresh. These change how you design your data estate.',
            'Creating separate storage accounts instead of using OneLake — defeats the purpose of Fabric. All data should live in OneLake to benefit from Shortcuts, Direct Lake, and unified governance.',
            'Licensing confusion: Fabric requires F-SKU or Power BI Premium P-SKU — it does not run on standard Power BI Pro licenses.',
          ],
          productionContext: 'Enterprises migrating from Synapse typically run Fabric alongside Synapse for 6–12 months: new workloads go Fabric-native, existing Synapse pipelines migrate gradually. The migration path: replace ADLS Gen2 storage with OneLake Shortcuts first (no data movement), then migrate pipelines and notebooks, then switch semantic models to Direct Lake.',
          performanceTip: 'Fabric Spark automatically scales compute based on workload — you don\'t pre-allocate a fixed cluster. For cost control, use Fabric capacity bursting limits and set workspace-level consumption budgets in the Admin portal.',
        },
      ],
    },
    {
      title: 'OneLake',
      subtopics: [
        {
          id: 'fabric-onelake',
          title: 'OneLake — The Data Foundation',
          difficulty: 'Beginner',
          explanation: 'OneLake is a single, tenant-wide logical data lake that automatically stores all Fabric items. Built on Azure Data Lake Storage Gen2, it provides one namespace for all data across an organization — eliminating data silos.',
          why: 'Teams no longer need to copy data between storage accounts for different tools. A Lakehouse, Warehouse, and Power BI semantic model can all read the same OneLake Delta files without duplication.',
          syntax: `// OneLake path structure:
// onelake://<workspace-name>/<item-name>/<Tables or Files>/<path>

// ABFS path for Spark:
// abfss://<workspace-id>@onelake.dfs.fabric.microsoft.com/<item-id>/Tables/

// OneLake Shortcuts let you point to:
// - Other OneLake locations (cross-workspace)
// - Azure Data Lake Storage Gen2
// - Amazon S3
// - Google Cloud Storage`,
          example: `# Reading a Lakehouse Delta table from a Notebook
df = spark.read.format("delta").load(
    "abfss://workspace-id@onelake.dfs.fabric.microsoft.com/lakehouse-id/Tables/customers"
)

# Alternatively, use the managed path (auto-resolved in Fabric Notebooks):
df = spark.read.format("delta").table("customers")`,
          expectedOutput: 'Spark DataFrame loaded from Delta table on OneLake',
          interview: {
            question: 'What is a OneLake Shortcut and when would you use one over copying data?',
            answer: 'A Shortcut is a virtual pointer to data stored in another location — another OneLake path, ADLS Gen2, S3, or GCS — without physically copying the data. Use Shortcuts when: (1) data already exists in ADLS or S3 and you want to query it from Fabric immediately without a migration, (2) multiple Lakehouses in different workspaces need to share the same dataset without duplication, (3) you want to bring external data under Fabric governance and query it with Spark or SQL Analytics Endpoint. Copy data into OneLake when: you need full Delta ACID semantics, OPTIMIZE/ZORDER, or write access from Fabric pipelines — Shortcuts are read-only for S3/ADLS sources.',
          },
          commonMistakes: [
            'Assuming Shortcuts give write access to external storage — S3 and ADLS Shortcuts are read-only. Only OneLake-to-OneLake Shortcuts can be writable.',
            'Not understanding that OneLake is per-tenant not per-workspace — all workspaces in the same Fabric tenant share one OneLake, which is why Shortcuts work cross-workspace without copying.',
            'Using ABFS paths with workspace name instead of workspace GUID in production code — names can change; GUIDs are stable.',
          ],
          productionContext: 'In enterprise Fabric deployments, Shortcuts are the primary migration path from Azure Data Lake Storage Gen2. The data stays in ADLS (no cost for moving petabytes), but Fabric Notebooks and SQL Analytics Endpoints can immediately query it via Shortcuts. Once teams validate the Fabric queries, they schedule a data migration to OneLake proper for full Delta Lake benefits.',
          performanceTip: 'OneLake stores data as Delta Parquet with automatic file organization. For read performance, run OPTIMIZE on Delta tables regularly and use ZORDER on the most-queried filter columns. Fabric\'s Direct Lake reads Delta Parquet files directly from OneLake — the more compact and Z-ordered your files, the faster Power BI dashboards render.',
        },
      ],
    },
    {
      title: 'Lakehouse',
      subtopics: [
        {
          id: 'fabric-lakehouse-tables',
          title: 'Fabric Lakehouse and Delta Tables',
          difficulty: 'Intermediate',
          explanation: 'A Fabric Lakehouse stores data as Delta tables in the Tables folder and unstructured files in the Files folder. The SQL Analytics Endpoint automatically exposes Delta tables as a T-SQL read-only interface without any configuration.',
          why: 'Lakehouses give you the flexibility of a data lake (any format, Spark processing) with the usability of a warehouse (SQL queries, Power BI Direct Lake). Delta format provides ACID transactions and time travel.',
          syntax: `-- SQL Analytics Endpoint: read Delta tables with T-SQL
SELECT TOP 100 * FROM customers;

-- Time travel: read data as of a specific version
SELECT * FROM customers
  VERSION AS OF 3;

-- Time travel by timestamp
SELECT * FROM customers
  TIMESTAMP AS OF '2025-01-01';`,
          example: `# Create a managed Delta table from a Spark Notebook
df = spark.createDataFrame([
    (1, "Alice", "Engineering"),
    (2, "Bob", "Marketing"),
], ["id", "name", "department"])

df.write.format("delta").mode("overwrite").saveAsTable("employees")

# OPTIMIZE for better read performance
spark.sql("OPTIMIZE employees ZORDER BY (department)")`,
          expectedOutput: 'Delta table created in Lakehouse Tables folder, queryable via SQL Analytics Endpoint',
          interview: {
            question: 'What is the difference between a Fabric Lakehouse and a Fabric Warehouse, and how do you choose?',
            answer: 'A Lakehouse stores Delta files in OneLake and exposes them via a read-only SQL Analytics Endpoint — writes happen through Spark/notebooks. A Warehouse is a fully managed T-SQL environment with full read/write SQL support, including CREATE TABLE, INSERT, UPDATE, stored procedures, and views. The key decision: choose Lakehouse when your team writes code (Python/Spark) and the Spark notebook workflow is the primary transformation path. Choose Warehouse when your team is SQL-first, needs T-SQL stored procedures, or has BI analysts who need to write SQL to create views and derived tables directly. Both sit on OneLake, so you can join across them.',
          },
          commonMistakes: [
            'Writing to Lakehouse Tables via the SQL Analytics Endpoint — it\'s read-only for T-SQL. Use Spark (saveAsTable) or the Lakehouse Files API to write.',
            'Forgetting that the SQL Analytics Endpoint schema updates are not instantaneous — after a Spark write, there\'s a brief sync delay before new columns appear in the endpoint.',
            'Using Files/ folder for structured data instead of Tables/ — data in Files/ is not exposed as a Delta table; the SQL Analytics Endpoint only sees Tables/.',
          ],
          productionContext: 'In Fabric production deployments, the standard pattern is: Pipeline or Notebook writes to Lakehouse Tables/ as Delta tables → SQL Analytics Endpoint exposes them for BI analysts who run ad-hoc T-SQL → Default Semantic Model auto-updates → Power BI reports refresh via Direct Lake within minutes of the Spark write completing.',
          performanceTip: 'Run OPTIMIZE and VACUUM on Gold-layer Lakehouse tables after each pipeline run. Without OPTIMIZE, many small Delta files accumulate and slow both Spark reads and Direct Lake queries. Fabric Lakehouse does not auto-optimize by default — unlike Databricks which has Auto Optimize. Schedule a maintenance notebook that runs OPTIMIZE on all Gold tables nightly.',
        },
        {
          id: 'fabric-lakehouse-vs-warehouse',
          title: 'Lakehouse vs Warehouse — Decision Guide',
          difficulty: 'Intermediate',
          explanation: 'Fabric offers two primary data stores: Lakehouse (Delta files + Spark + SQL Analytics Endpoint) and Warehouse (managed T-SQL). They coexist on OneLake and can be cross-queried. The choice determines your write path, transformation language, and SQL feature set.',
          why: 'Choosing the wrong store creates friction: SQL-first teams fighting Spark APIs on a Lakehouse, or Python engineers limited by T-SQL on a Warehouse. Match the store to the team\'s skillset and workload pattern.',
          syntax: `-- Lakehouse: write via Spark, read via SQL Analytics Endpoint (read-only T-SQL)
-- Good for: Spark transformations, medallion pipelines, ML feature stores

-- Warehouse: write via T-SQL, read/write via T-SQL endpoint
-- Good for: SQL-native teams, stored procedures, complex views, RBAC at table level

-- Cross-querying (both on OneLake):
SELECT l.customer_id, l.total_spend, w.credit_limit
FROM MyLakehouse.dbo.gold_customers l
JOIN MyWarehouse.dbo.credit_limits w
  ON l.customer_id = w.customer_id`,
          example: `// Decision matrix:
//
// Scenario                         → Lakehouse  or  Warehouse
// ----------------------------------------------------------------
// Spark notebooks primary          → Lakehouse
// SQL stored procedures needed     → Warehouse
// Direct Lake Power BI             → Either (both support it)
// INSERT/UPDATE via T-SQL          → Warehouse
// Large Spark transformations      → Lakehouse
// Analysts writing ad-hoc SQL      → Warehouse (full T-SQL)
// ML feature engineering           → Lakehouse
// Shared SQL views for BI          → Warehouse
// Medallion bronze/silver layers   → Lakehouse
// Gold reporting layer             → Either (or both, cross-queried)`,
          expectedOutput: 'Architecture decision that matches tool to team workflow and avoids capability gaps',
          interview: {
            question: 'A team of 10 has 3 data engineers writing PySpark and 7 BI analysts writing T-SQL. How do you structure a Fabric architecture?',
            answer: 'Use both — they\'re complementary. Data engineers write Bronze and Silver layers to Lakehouses (Spark notebooks, Delta tables). The Gold layer is a Warehouse: engineers write Spark aggregations to a staging Lakehouse, then use a Copy Activity or stored procedure to land the final gold tables in the Warehouse where analysts can build views, write ad-hoc queries, and use full T-SQL. Power BI semantic models sit on the Warehouse via Direct Lake or DirectQuery. Both stores are on OneLake, so engineers can cross-query from Spark when needed.',
          },
          commonMistakes: [
            'Building everything in one Lakehouse and leaving SQL analysts with a read-only endpoint — analysts can\'t create views or write queries against it. Use a Warehouse for analyst-facing Gold data.',
            'Building everything in a Warehouse and losing Spark capabilities — you can\'t run large-scale PySpark transformations from a Warehouse.',
            'Not using cross-querying — many teams don\'t realize they can JOIN Lakehouse and Warehouse tables in a single T-SQL or Spark query.',
          ],
          productionContext: 'Mature Fabric deployments typically have: 1-2 Lakehouses for engineering layers (Bronze, Silver), 1 Warehouse for Gold/reporting layers, and cross-workspace Shortcuts connecting them. The Warehouse surfaces clean data to BI teams while Lakehouses remain the engineering transformation zone.',
          performanceTip: 'Warehouse tables support clustered columnstore indexes automatically — all writes go through Fabric\'s distributed engine. For the highest-performing Warehouse queries, partition large tables by date using table distribution and avoid cross-workspace queries for high-frequency dashboard queries (add the data to the local Warehouse instead).',
        },
        {
          id: 'fabric-medallion',
          title: 'Medallion Architecture in Fabric',
          difficulty: 'Intermediate',
          explanation: 'The Medallion architecture organizes data into three layers: Bronze (raw ingested data), Silver (cleaned and validated data), and Gold (business-aggregated data). In Fabric, each layer is typically a separate Lakehouse or schema within a Lakehouse.',
          why: 'Medallion provides clear data quality tiers, enables incremental processing, and allows downstream teams to trust the Gold layer as their source of truth for reporting and ML.',
          syntax: `-- Bronze: raw ingestion (usually via Pipeline or Eventstream)
-- Silver: cleaned with type casting and null handling
-- Gold: business aggregations ready for reporting

-- Example Bronze → Silver transformation in SparkSQL:
CREATE OR REPLACE TABLE silver.orders AS
SELECT
  CAST(order_id AS BIGINT) AS order_id,
  CAST(order_date AS DATE) AS order_date,
  customer_id,
  CAST(amount AS DECIMAL(10,2)) AS amount
FROM bronze.raw_orders
WHERE order_id IS NOT NULL
  AND amount > 0;`,
          example: `# Silver layer: clean and validate
from pyspark.sql.functions import col, to_date, when

bronze_df = spark.read.format("delta").table("bronze.raw_orders")

silver_df = bronze_df \
  .withColumn("order_date", to_date(col("order_date"), "yyyy-MM-dd")) \
  .withColumn("amount", col("amount").cast("double")) \
  .filter(col("order_id").isNotNull() & (col("amount") > 0))

silver_df.write.format("delta").mode("overwrite").saveAsTable("silver.orders")`,
          expectedOutput: 'Clean Delta table in silver layer, with nulls removed and types cast',
          interview: {
            question: 'How would you implement a multi-workspace Medallion architecture in Fabric, and why would you separate workspaces by layer?',
            answer: 'Separate workspaces by layer (Bronze workspace, Silver workspace, Gold workspace) to enforce clear ownership and access control: ingestion engineers own Bronze, transformation engineers own Silver, BI/analytics teams own Gold. Cross-workspace data access uses OneLake Shortcuts — Silver reads Bronze via a Shortcut, Gold reads Silver via a Shortcut, without copying data. This also allows different Fabric capacity assignment per layer — cheaper/smaller capacity for Bronze ingestion (low compute), larger capacity for Silver Spark transformations. In smaller teams, all three layers can live in the same workspace as separate Lakehouses or schemas.',
          },
          commonMistakes: [
            'Applying business transformations in Bronze — Bronze must be immutable raw data. Any filtering or transformation in Bronze means you lose the ability to reprocess from original source.',
            'Using overwrite mode for Silver when MERGE should be used — overwrite re-scans and rewrites the full Silver table nightly, even if only 0.1% of rows changed.',
            'Not running data quality checks between layers — bad data from Silver should never reach Gold. Add a validation step after each layer transition.',
          ],
          productionContext: 'In Fabric, the Medallion pipeline typically runs as: Pipeline (Copy Activity for Bronze ingestion) → Notebook Activity (Bronze → Silver transformation) → Notebook Activity (Silver → Gold aggregation) → Stored Procedure Activity (refresh semantic model). The whole pipeline runs nightly at 2am with email alerts on failure. Incremental loading (not full refresh) is added after the initial full-load version is validated.',
          performanceTip: 'In Fabric Spark notebooks, use Delta MERGE for Silver layer updates instead of full overwrite. A nightly full overwrite on a 10B-row Silver table takes hours; MERGE on only the rows changed in the last 24 hours takes minutes. The key: watermark the Bronze table with an ingest_timestamp and only MERGE rows where ingest_timestamp > last_successful_run.',
        },
      ],
    },
    {
      title: 'Data Factory in Fabric',
      subtopics: [
        {
          id: 'fabric-pipelines',
          title: 'Pipelines in Fabric',
          difficulty: 'Intermediate',
          explanation: 'Data Factory in Fabric provides visual pipeline authoring — similar to Azure Data Factory. A Pipeline orchestrates data movement (Copy Activity) and transformation (Notebook Activity, Stored Procedure Activity). Pipelines schedule Fabric notebooks and handle dependencies between activities.',
          why: 'Pipelines centralize orchestration without leaving Fabric — no separate ADF instance needed. You can run notebook-based Medallion layers in sequence, with built-in retry, alerts, and run history.',
          syntax: `// Pipeline activities commonly used:
// - Copy Data: ingest from REST, SQL Server, blob storage, SharePoint
// - Notebook: run a Fabric Spark Notebook
// - Stored Procedure: call a Warehouse stored procedure
// - Delete: remove old files from Lakehouse Files
// - ForEach: loop over a list of tables or files
// - If Condition: branch pipeline based on a variable`,
          example: `// Typical nightly pipeline structure:
// 1. Copy Activity: load raw CSV from ADLS → Lakehouse Files/raw
// 2. Notebook Activity: Bronze notebook (raw → bronze Delta)
// 3. Notebook Activity: Silver notebook (bronze → silver Delta)
// 4. Notebook Activity: Gold notebook (silver → gold aggregations)
// 5. Stored Procedure: update pipeline audit table in Warehouse

// Each activity has: Retry count, Timeout, Dependencies (success/failure/completion)`,
          expectedOutput: 'End-to-end Medallion pipeline running on a schedule with email alerts on failure',
          interview: {
            question: 'How is Data Factory in Fabric different from standalone Azure Data Factory, and when would you keep using ADF?',
            answer: 'Data Factory in Fabric is fully embedded in the Fabric workspace — no linked services for OneLake, no separate resource group or subscription. Pipelines directly invoke Fabric Notebooks, Lakehouses, and Warehouses without connection strings. It uses the same visual interface as ADF. Keep using standalone ADF when: you need connectors Fabric doesn\'t yet support (SAP, mainframe, Salesforce via specific certified connectors), you have complex existing ADF pipelines already in production, or you need ADF\'s global distribution and self-hosted integration runtime for on-prem connectivity at scale.',
          },
          commonMistakes: [
            'Not setting retry policies on Notebook Activities — transient cluster startup failures are common; always set 1–2 retries with a 30-second retry interval.',
            'Using sequential notebook chains when activities can run in parallel — Bronze notebooks for different domains (orders, inventory, customers) can all run in parallel before Silver starts.',
            'Hardcoding dates in pipeline parameters — always use @pipeline().TriggerTime or @addDays(utcNow(), -1) for dynamic date-based loading.',
          ],
          productionContext: 'In production Fabric pipelines, parameterize every Notebook Activity with the load_date parameter (passed as @formatDateTime(pipeline().TriggerTime, \'yyyy-MM-dd\')). The notebook reads this widget and uses it as the watermark. This makes every pipeline run independently rerunnable for any date without code changes — critical for backfill scenarios.',
          performanceTip: 'Use ForEach + Notebook Activity to parallelize table loads. Instead of one notebook that loads 50 tables sequentially, use a Lookup to get the table list, pass it to ForEach (set Batch Count = 10 for 10 concurrent loads). Total load time drops from N × single_load_time to N/10 × single_load_time.',
        },
        {
          id: 'fabric-dataflows-gen2',
          title: 'Dataflows Gen2',
          difficulty: 'Intermediate',
          explanation: 'Dataflows Gen2 is a Power Query-based data transformation tool inside Fabric. It provides a low-code graphical interface for extracting, transforming, and loading data into Lakehouse or Warehouse destinations. Behind the scenes, Dataflows Gen2 uses Fabric Spark.',
          why: 'Ideal for analysts and engineers who prefer a visual ETL tool over writing Spark code. Supports 150+ connectors, incremental refresh, and direct output to Lakehouse Delta tables.',
          syntax: `// Power Query M formula language sample:
let
  Source = Sql.Database("server.database.windows.net", "SalesDB"),
  Orders = Source{[Schema="dbo", Item="Orders"]}[Data],
  FilteredRows = Table.SelectRows(Orders, each [Status] = "Completed"),
  RenamedColumns = Table.RenameColumns(FilteredRows, {{"OrderDate", "order_date"}}),
  TypedColumns = Table.TransformColumnTypes(RenamedColumns, {{"order_date", type date}})
in
  TypedColumns`,
          example: `// Dataflows Gen2 output destination options:
// - Lakehouse table (writes to Delta format automatically)
// - Warehouse table (writes via T-SQL INSERT)
// - Azure SQL Database
// - Azure Data Lake Storage Gen2

// Incremental refresh setup:
// Define a RangeStart and RangeEnd parameter in Power Query
// Fabric auto-identifies the incremental column and runs delta loads`,
          expectedOutput: 'Data loaded into Lakehouse Delta table via Power Query transformation, refreshable on a schedule',
          interview: {
            question: 'When would you use Dataflows Gen2 vs a Fabric Notebook for transformation, and what are the tradeoffs?',
            answer: 'Use Dataflows Gen2 when: the transformation is straightforward (filter, rename, type cast, simple join), the team includes analysts comfortable with Power Query, or you need to connect to a source not easily accessible from Spark (SharePoint lists, Dynamics 365, OData feeds). Use a Notebook when: you need custom Python logic, ML feature engineering, complex window functions, large-scale Spark optimization, or reproducible code in Git. The key tradeoff: Dataflows Gen2 is faster to build but harder to test, version-control, and debug. Notebooks take longer to write but are testable, version-controlled, and infinitely more powerful for scale.',
          },
          commonMistakes: [
            'Using Dataflows Gen2 for large-scale transformations — it uses Fabric Spark under the hood but without the control you have in a notebook. For tables > 100M rows, use a notebook.',
            'Not enabling incremental refresh — without it, Dataflows Gen2 does a full extract and reload on every refresh, making it slow and expensive for large source tables.',
            'Ignoring the staging Lakehouse — Dataflows Gen2 uses a staging Lakehouse for intermediate results. If you hit capacity limits, data spills here first.',
          ],
          productionContext: 'Dataflows Gen2 is most commonly used in Fabric for the "last mile" data ingestion problem: small-to-medium datasets from sources that Notebooks can\'t easily connect to (SharePoint, Dynamics, small SQL tables). Engineering teams use them for quick Bronze loading of these sources, then Notebooks handle Silver/Gold transformations.',
          performanceTip: 'Enable Fast Copy in Dataflows Gen2 for large datasets — it bypasses the Power Query engine and uses native copy capabilities that are 5–10x faster. Fast Copy automatically activates when source is ADLS/Blob/SQL and destination is Lakehouse; it uses the Copy Activity under the hood rather than the M evaluation engine.',
        },
      ],
    },
    {
      title: 'Spark Notebooks',
      subtopics: [
        {
          id: 'fabric-notebooks',
          title: 'Fabric Spark Notebooks',
          difficulty: 'Intermediate',
          explanation: 'Fabric Notebooks are Jupyter-compatible environments running on Fabric Spark compute. They support Python, Scala, SQL, and R in the same notebook. Fabric auto-mounts the workspace Lakehouses so data is accessible without ABFS paths.',
          why: 'Notebooks are the primary transformation tool for data engineers in Fabric. They combine interactive development with production-ready code that pipelines can schedule. Version control via Git integration turns notebook code into reviewable artifacts.',
          syntax: `# Fabric Notebooks auto-attach the workspace Lakehouse
# No SparkSession creation needed — spark is already available

# Read a Delta table (short form — Lakehouse auto-mounted)
df = spark.read.format("delta").table("silver.orders")

# Write to Lakehouse table
df.write.format("delta").mode("overwrite").saveAsTable("gold.daily_revenue")

# Use notebookutils for file operations
notebookutils.fs.ls("Files/raw/")

# Run another notebook from this notebook
notebookutils.notebook.run("SilverTransform", timeout_seconds=300,
    arguments={"load_date": "2025-01-15"})`,
          example: `from pyspark.sql.functions import col, sum, to_date, current_timestamp
from delta.tables import DeltaTable

# Read Silver
silver = spark.read.format("delta").table("silver.orders")

# Build Gold aggregate
gold = silver \
  .groupBy("order_date", "product_category") \
  .agg(
    sum("amount").alias("revenue"),
    sum("quantity").alias("units_sold")
  ) \
  .withColumn("loaded_at", current_timestamp())

# Merge into Gold Delta table (idempotent)
if DeltaTable.isDeltaTable(spark, "Tables/gold_revenue"):
    target = DeltaTable.forName(spark, "gold.daily_revenue")
    target.alias("t").merge(
        gold.alias("s"),
        "t.order_date = s.order_date AND t.product_category = s.product_category"
    ).whenMatchedUpdateAll().whenNotMatchedInsertAll().execute()
else:
    gold.write.format("delta").saveAsTable("gold.daily_revenue")

print(f"Gold rows: {spark.table('gold.daily_revenue').count():,}")`,
          expectedOutput: `Gold rows: 4,200`,
          interview: {
            question: 'How does a Fabric Notebook differ from a Databricks Notebook, and what should you watch out for when migrating?',
            answer: 'Both run on Spark and support PySpark/SparkSQL — most transformation code is portable. Key differences: (1) Fabric uses notebookutils instead of dbutils for file operations and notebook chaining. (2) Fabric Spark auto-mounts workspace Lakehouses; Databricks requires mount points or ABFS paths. (3) Fabric notebooks have no cluster concept — compute starts automatically per notebook run. (4) mssparkutils is the Fabric equivalent of dbutils. Migration gotchas: replace dbutils.fs with notebookutils.fs, replace dbutils.widgets with notebookutils.runtime for parameter passing, and test library imports (some Databricks-specific MLflow integrations need updating).',
          },
          commonMistakes: [
            'Using dbutils in a Fabric Notebook — it doesn\'t exist. Replace all dbutils calls with notebookutils (mssparkutils) equivalents.',
            'Not parameterizing notebooks before scheduling via Pipeline — hardcoded dates or paths make backfill impossible without editing code.',
            'Chaining long notebook runs in a single cell — if one step fails, the entire cell output is lost. Structure notebooks as discrete functions/cells with clear checkpoints.',
          ],
          productionContext: 'In production Fabric, notebooks are version-controlled via Git integration. The pattern: feature branch → PR with notebook diff review → merge to main → Deployment Pipeline promotes to Prod. Notebooks are parameterized with notebookutils.runtime.getParameterValue() so pipelines can pass load_date, env, and other context.',
          performanceTip: 'Fabric Spark auto-scales — the cluster grows when your notebook starts a heavy computation and shrinks when idle. To avoid slow cold-start times on production runs, use "Keep Alive" compute settings for critical notebooks that run on tight SLA windows. For exploratory notebooks, let the auto-scale handle it (no cost when idle).',
        },
      ],
    },
    {
      title: 'Real-Time Intelligence',
      subtopics: [
        {
          id: 'fabric-eventstream',
          title: 'Eventstream',
          difficulty: 'Intermediate',
          explanation: 'Eventstream is a no-code streaming ingestion tool in Fabric Real-Time Intelligence. It captures events from sources (Event Hubs, Kafka, IoT Hub, custom endpoints) and routes them to destinations (KQL Database, Lakehouse, Warehouse, or another Eventstream) in real time.',
          why: 'Eliminates the need to write Azure Stream Analytics jobs or manage Kafka consumer code for common streaming patterns — drag-and-drop pipeline from source to destination with built-in transformations.',
          syntax: `// Eventstream supports built-in transformations:
// - Filter: keep events matching a condition
// - Aggregate: time-window aggregations (tumbling, hopping, session)
// - Group By: partition stream by a field
// - Expand: flatten nested JSON arrays
// - Union: merge multiple streams
// - Manage Fields: rename, drop, add columns`,
          example: `// Architecture: IoT sensors → Eventstream → KQL Database
// Eventstream reads from: Azure IoT Hub (device telemetry)
// Transformation: filter WHERE temperature > 0 AND device_id IS NOT NULL
// Destination: KQL Database "sensor_readings" table
// Result: live telemetry queryable in milliseconds via KQL

// Alternative destination: Lakehouse
// Eventstream lands micro-batches into Lakehouse Files/streaming/
// A downstream Notebook processes them into Bronze Delta tables`,
          expectedOutput: 'Real-time events flowing from IoT Hub into KQL Database with < 1 second latency',
          interview: {
            question: 'What is the difference between Fabric Eventstream and Azure Stream Analytics, and when would you choose each?',
            answer: 'Both handle real-time streaming, but Eventstream is no-code and natively integrated in Fabric — it connects directly to KQL Databases, Lakehouses, and Warehouses without extra pipeline config. Azure Stream Analytics uses SQL-like queries for complex event processing (CEP) and outputs to many Azure services outside Fabric. Choose Eventstream for Fabric-first architectures where you need simple filter/aggregate/route patterns with no-code setup. Choose Stream Analytics if you need complex temporal joins across multiple streams, sophisticated CEP patterns (event detection across windows), or must write to non-Fabric Azure services like Azure SQL, Cosmos DB, or Service Bus.',
          },
          commonMistakes: [
            'Using Eventstream for complex multi-stream joins — Eventstream supports simple transformations; complex CEP queries belong in Stream Analytics or Spark Structured Streaming.',
            'Not setting a destination for transformed events — Eventstream without a destination drops events. Always configure at least one destination (KQL Database for analytics, Lakehouse for long-term storage).',
            'Ignoring the event delivery guarantee — Eventstream provides at-least-once delivery. Design destinations to handle duplicates (use a KQL dedup policy or Delta MERGE at the sink).',
          ],
          productionContext: 'Fabric Eventstream is typically used in IoT and clickstream scenarios where data arrives via Event Hubs and needs to be: (1) routed to a KQL Database for operational dashboards (< 1s latency), (2) landed in a Lakehouse Bronze table for long-term batch analysis. The dual-sink pattern (KQL + Lakehouse) handles both use cases from a single Eventstream.',
          performanceTip: 'For high-throughput Eventstream sources (millions of events/second), increase Event Hub partitions before connecting to Eventstream — Eventstream inherits the source partition count and processes partitions in parallel. More partitions = more parallelism = higher throughput. Standard Event Hub supports up to 32 partitions; Premium tier supports up to 200.',
        },
        {
          id: 'fabric-kql',
          title: 'KQL Database and Kusto Query Language',
          difficulty: 'Advanced',
          explanation: 'A KQL (Kusto Query Language) Database in Fabric is a high-performance time-series database optimized for log, telemetry, and event analytics. It ingests millions of events per second and returns aggregations in milliseconds. KQL is the query language used to explore this data.',
          why: 'KQL databases are purpose-built for real-time analytics on streaming data — think application logs, sensor readings, clickstreams, and security events. Much faster than running the same queries on Delta tables in SQL.',
          syntax: `// KQL syntax is pipe-based (results flow left to right)

// Filter rows
sensor_readings
| where device_id == "device-001"
| where ingestion_time() > ago(1h)

// Aggregation
sensor_readings
| summarize avg_temp = avg(temperature) by bin(timestamp, 5m), device_id
| order by timestamp desc

// Join with a dimension table
sensor_readings
| join kind=inner (devices | project device_id, location) on device_id
| summarize avg_temp = avg(temperature) by location`,
          example: `// Real-world KQL: detect anomalies in the last 24h
sensor_readings
| where timestamp > ago(24h)
| summarize avg_temp = avg(temperature), max_temp = max(temperature),
    stddev_temp = stdev(temperature) by device_id, bin(timestamp, 1h)
| where max_temp > avg_temp + 3 * stddev_temp
| join kind=inner (
    devices | project device_id, location, owner_email
  ) on device_id
| project timestamp, location, max_temp, avg_temp, owner_email
| order by max_temp desc`,
          expectedOutput: 'Anomalous temperature spikes with device context for alerting',
          interview: {
            question: 'When would you use a KQL Database over a Lakehouse Delta table, and what are the limitations of KQL?',
            answer: 'Use KQL Database for: operational dashboards requiring sub-second latency, high-cardinality time-series data (IoT, logs, telemetry), and streaming data that needs immediate queryability. KQL\'s columnar storage and time-based indexing make it 100x faster than SQL on these patterns. Limitations: KQL is read-optimized — updates and deletes are hard (use table policies or soft deletes). KQL data isn\'t as accessible for ML pipelines as Delta tables. KQL tables have retention policies, not unlimited storage. For long-term historical analysis beyond retention window, use KQL → Lakehouse export as the archival pattern.',
          },
          commonMistakes: [
            'Using KQL Database for data that needs updates/deletes — KQL is append-optimized. If rows need corrections, use Delta tables instead.',
            'Querying without time filters — KQL tables can hold billions of rows. Always filter on timestamp with | where timestamp > ago(Xh) before summarize or join operations.',
            'Joining large KQL tables without | project first — project (select columns) before a join to reduce the data flowing through the join. Same principle as pushdown in SQL.',
          ],
          productionContext: 'KQL Databases in production handle the real-time layer of a dual-path architecture: events flow to both KQL (for immediate operational queries) and Lakehouse Bronze (for long-term batch analysis). Dashboards query KQL for live metrics; data science teams query Bronze/Silver Delta tables for historical model training.',
          performanceTip: 'Use bin() in summarize operations to reduce the result set before ordering — summarizing at 5-minute bins instead of per-row is 1000x faster and usually sufficient for dashboards. For alerts, use KQL policies (update policies and alert rules) to trigger notifications rather than polling dashboards.',
        },
      ],
    },
    {
      title: 'Semantic Models and Power BI',
      subtopics: [
        {
          id: 'fabric-semantic-models',
          title: 'Direct Lake Semantic Models',
          difficulty: 'Advanced',
          explanation: 'Semantic Models in Fabric are Power BI data models that define measures, relationships, and hierarchies on top of Lakehouse or Warehouse data. Direct Lake mode reads Delta files directly from OneLake without importing data — delivering near-instant query performance at scale.',
          why: 'Direct Lake eliminates the data import cycle: changes in your Delta tables appear in Power BI dashboards immediately without a scheduled refresh. This makes Fabric the fastest path from raw data to business insights.',
          syntax: `// DAX measure example in a Semantic Model
Total Revenue = SUMX(
  Orders,
  Orders[Quantity] * Orders[Unit Price]
)

// Year-over-year growth measure
YoY Growth % =
  DIVIDE(
    [Total Revenue] - CALCULATE([Total Revenue], SAMEPERIODLASTYEAR(Calendar[Date])),
    CALCULATE([Total Revenue], SAMEPERIODLASTYEAR(Calendar[Date]))
  )`,
          example: `// Direct Lake semantic model flow:
// 1. Gold Lakehouse Delta table: sales_summary (updated by Spark)
// 2. Fabric auto-creates Default Semantic Model (no import needed)
// 3. Or create a Custom Semantic Model:
//    - Add Delta tables from Lakehouse
//    - Define DAX measures
//    - Set relationships between fact and dimension tables
// 4. Power BI report uses Direct Lake mode:
//    - No import = no refresh lag
//    - Queries go directly to OneLake Delta files`,
          expectedOutput: 'Power BI dashboard with live data from Lakehouse Delta tables, no import refresh required',
          interview: {
            question: 'What is Direct Lake mode and what are its limitations compared to Import mode?',
            answer: 'Direct Lake reads Delta Parquet files directly from OneLake — no import copy, no refresh schedule. Queries are as fast as Import mode for warm (framing-cached) data because Fabric caches Delta column segments in memory. Limitations: (1) Direct Lake falls back to DirectQuery when memory pressure occurs or when querying columns not yet cached — this is called "fallback" and can slow dashboards. (2) Direct Lake only works with Fabric Lakehouses and Warehouses, not external sources. (3) Complex DAX queries that can\'t be pushed to the underlying engine fall back to in-memory evaluation. (4) Calculated columns in DAX are not supported in Direct Lake (use computed columns in the Lakehouse instead). Monitor for fallbacks using the Fabric capacity metrics app.',
          },
          commonMistakes: [
            'Not running OPTIMIZE on Gold tables — Direct Lake reads individual Parquet files; many small files slow down framing (column loading). OPTIMIZE compacts files for faster Direct Lake reads.',
            'Using calculated columns in DAX with Direct Lake — they\'re not supported. Move calculations to the Lakehouse Spark notebook and store them as physical columns.',
            'Assuming Direct Lake is always live — Fabric uses a framing process to load new Delta files; there\'s a brief delay (typically seconds to minutes) before new data is visible in Direct Lake.',
          ],
          productionContext: 'In production Fabric BI architectures, the pattern is: Spark Gold notebook writes Delta table → OPTIMIZE runs automatically (or via maintenance notebook) → Semantic Model uses Direct Lake → Power BI reports show data within minutes of pipeline completion. This replaces a 2-6 hour Power BI Import refresh cycle with near-real-time data.',
          performanceTip: 'To minimize Direct Lake fallback, ensure your Gold Lakehouse tables have small row group sizes (≤ 1M rows per file after OPTIMIZE) and that frequently queried columns are ZORDER\'d. Fabric reads entire row groups into memory for framing — large row groups waste memory and increase fallback probability under memory pressure.',
        },
      ],
    },
    {
      title: 'Mirroring',
      subtopics: [
        {
          id: 'fabric-mirroring',
          title: 'Fabric Mirroring',
          difficulty: 'Advanced',
          explanation: 'Fabric Mirroring replicates operational databases (Azure SQL, Snowflake, Cosmos DB, Azure SQL Managed Instance) into OneLake in near-real-time using CDC (Change Data Capture). Mirrored data is stored as Delta Parquet in OneLake and queryable via SQL Analytics Endpoint or Spark.',
          why: 'Mirroring eliminates the Extract step of ETL pipelines: no ADF copy activity, no scheduled batch extract, no stale data window. Changes in the source appear in OneLake within seconds. This enables real-time analytics on operational data without impacting the source database.',
          syntax: `// Mirroring setup (Fabric UI only — no code required):
// 1. Create a new Mirrored Database item in your Fabric workspace
// 2. Select the source: Azure SQL DB, Snowflake, Cosmos DB, etc.
// 3. Choose tables to mirror
// 4. Fabric creates a Lakehouse with the mirrored tables as Delta files
// 5. Query via SQL Analytics Endpoint or Spark immediately

// Query mirrored data (same as any Lakehouse table):
SELECT TOP 100 * FROM MirroredSalesDB.dbo.orders
ORDER BY created_at DESC;

// Join mirrored data with Gold aggregations:
SELECT m.customer_id, m.order_total, g.lifetime_value
FROM MirroredSalesDB.dbo.orders m
JOIN GoldLakehouse.dbo.customer_lifetime_value g
  ON m.customer_id = g.customer_id`,
          example: `// Real-world Mirroring scenario:
// Source: Azure SQL Database (production CRM with 50M customer records)
// Goal: Real-time analytics on CRM data without impacting CRM performance

// Before Mirroring:
// - ADF runs every 6 hours to copy CRM tables to ADLS
// - Reports are 0-6 hours stale
// - 6-hour extract jobs increase load on CRM SQL DB

// After Mirroring:
// - Mirroring captures CDC changes continuously
// - Reports show CRM data within seconds
// - No load on CRM SQL DB (CDC reads the transaction log, not the tables)
// - No ADF pipeline for CRM ingestion needed

// Mirrored table path in OneLake:
// OneLake/workspace/MirroredCRM.MirroredDatabase/Tables/dbo/customers`,
          expectedOutput: 'CRM changes appear in OneLake within seconds; Power BI dashboards show near-real-time operational data',
          interview: {
            question: 'How does Fabric Mirroring work under the hood, and what are its limitations?',
            answer: 'Mirroring uses Change Data Capture (CDC) — it reads the source database\'s transaction log, not the tables themselves, which minimizes source load. Changes are streamed to OneLake as Delta Parquet files continuously. Initial load does a full snapshot, then applies CDC changes incrementally. Limitations: (1) Not all source databases are supported (Azure SQL, Snowflake, Cosmos DB, Azure SQL MI — check current docs for latest). (2) Mirrored tables are read-only in Fabric — you can\'t write back to the source via OneLake. (3) Schema changes in the source (new columns, renamed tables) require a re-sync. (4) Mirroring requires the source database to have CDC enabled and sufficient transaction log retention. (5) It\'s not a replacement for ETL transformations — mirrored data is raw operational schema, not a clean analytics model.',
          },
          commonMistakes: [
            'Treating mirrored tables as analytics-ready — operational tables have denormalized structures, cryptic column names, and technical fields not meant for BI. You still need Silver/Gold transformation on top of mirrored Bronze data.',
            'Not monitoring replication lag — Mirroring can fall behind if the source has high write volume or network issues. Always add a freshness check on the mirrored table\'s _change_timestamp column.',
            'Mirroring all tables instead of selected tables — mirror only the tables your analytics pipeline needs. Mirroring everything creates unnecessary OneLake storage and CDC overhead.',
          ],
          productionContext: 'Mirroring is transforming how enterprises do operational analytics in Fabric. The pattern: Mirror production Azure SQL DB → OneLake (near-real-time Bronze layer) → Fabric Notebook Silver transformation → Warehouse Gold layer → Direct Lake Power BI. This replaces a 3-step ADF Extract → ADLS Load → Synapse Transform pipeline with a single Mirroring setup plus one Notebook.',
          performanceTip: 'After the initial Mirroring snapshot, run OPTIMIZE on the mirrored Delta tables to compact the many small CDC files into larger Parquet files. CDC writes arrive as many small files (one per change batch); without OPTIMIZE, query performance degrades over time. Schedule a weekly OPTIMIZE job on mirrored tables.',
        },
      ],
    },
    {
      title: 'CI/CD and Deployment Pipelines',
      subtopics: [
        {
          id: 'fabric-cicd',
          title: 'Fabric Git Integration and Deployment Pipelines',
          difficulty: 'Advanced',
          explanation: 'Fabric supports Git integration with GitHub or Azure DevOps — Fabric items (notebooks, pipelines, semantic models) are serialized to JSON/YAML and committed to a repo. Deployment Pipelines promote items through Dev → Test → Production environments.',
          why: 'Fabric CI/CD brings software engineering practices to analytics: version control, code review, automated promotion, and rollback. Teams can collaborate on notebooks via pull requests instead of shared workspaces.',
          syntax: `// Fabric item structure in Git:
// workspace/
//   MyLakehouse.Lakehouse/
//   MyPipeline.DataPipeline/
//     pipeline-content.json
//   SilverNotebook.Notebook/
//     notebook-content.py
//   GoldSemanticModel.SemanticModel/
//     definition.pbir

// .platform file stores item metadata:
{
  "$schema": "...",
  "metadata": { "type": "Notebook", "displayName": "SilverNotebook" },
  "config": { "logicalId": "..." }
}`,
          example: `// Deployment Pipeline flow:
// Dev workspace (connected to feature branch)
//   → PR review → merge to main
//     → Test workspace (connected to main branch)
//       → Automated validation (data quality checks)
//         → Production workspace (manual promotion gate)

// Fabric Deployment Pipeline stages:
// Dev → Test → Production
// Each stage maps to a Fabric workspace
// Promotion copies items and optionally replaces data source parameters`,
          expectedOutput: 'Code-reviewed notebook and pipeline promoted from Dev to Production with full audit trail',
          interview: {
            question: 'How would you implement a full CI/CD workflow for a Fabric data platform with 5 engineers?',
            answer: 'Three-layer approach: (1) Git Integration — connect each Fabric workspace to a branch (Dev → feature/* branches, Test → develop branch, Prod → main branch). Engineers open PRs to develop; notebook code is reviewed as Python diff in the PR. (2) Fabric Deployment Pipelines — configure Dev → Test → Prod. Merge to develop auto-syncs Test workspace. (3) Automated validation — a Deployment Pipeline pre-promotion rule runs a data quality Notebook against Test; if DQ checks fail, promotion is blocked. Manual approval gate before Prod promotion. Use workspace parameters to swap data sources between environments. This eliminates the "it works in Dev but not in Prod" problem by making environments identical except for data source parameters.',
          },
          commonMistakes: [
            'Not using workspace parameters for environment-specific connections — hardcoded Lakehouse names break when items are promoted to Prod. Use parameters to dynamically resolve workspace/Lakehouse names.',
            'Promoting without validation — always run at minimum a row-count check and a freshness check against the Test workspace before promoting to Prod.',
            'Skipping semantic model sync after notebook promotion — Deployment Pipelines promote notebooks and pipelines, but semantic models may need manual refresh or re-binding after data schema changes.',
          ],
          productionContext: 'Teams using Fabric CI/CD report 80% reduction in "it worked in Dev" incidents. The key discipline: every notebook must be parameterized, every pipeline must be testable, and every Deployment Pipeline stage must have at least one automated validation step. Start simple: Git integration first (immediate value), Deployment Pipelines after the team is comfortable with Git workflows.',
          performanceTip: 'Fabric Git sync happens at the item level — committing changes to 50 notebooks at once creates 50 separate Git commits. Use batched commits (select all changed items, commit together) to keep the Git history readable and the sync operation fast.',
        },
      ],
    },
    {
      title: 'Fabric Warehouse',
      subtopics: [
        {
          id: 'fabric-warehouse-depth',
          title: 'Fabric Warehouse — When to Use SQL Over Spark',
          difficulty: 'Intermediate',
          explanation: 'A Fabric Warehouse is a fully managed T-SQL data warehouse built on OneLake. Unlike the Lakehouse SQL Analytics Endpoint (read-only T-SQL over Delta files), the Warehouse supports full DML: INSERT, UPDATE, DELETE, CREATE TABLE, and stored procedures. It uses a distributed query engine optimized for concurrent analytical workloads.',
          why: 'Use the Warehouse when you need concurrent multi-user SQL access with heavy DML workloads, stored procedures, complex schema management, or when your team is SQL-first and not comfortable with Spark notebooks. The Lakehouse is better for Spark-heavy transformations and file-level access.',
          syntax: `-- Create a table in Fabric Warehouse (T-SQL)
CREATE TABLE gold.dim_customer (
  customer_id    INT           NOT NULL,
  customer_name  NVARCHAR(200) NOT NULL,
  region         NVARCHAR(50),
  account_tier   NVARCHAR(20),
  effective_date DATE          NOT NULL,
  expiry_date    DATE,
  is_current     BIT           DEFAULT 1,
  CONSTRAINT pk_dim_customer PRIMARY KEY (customer_id)
);

-- INSERT with staging pattern
INSERT INTO gold.dim_customer
SELECT DISTINCT customer_id, customer_name, region, 'Standard', GETDATE(), NULL, 1
FROM silver.customers
WHERE customer_id NOT IN (SELECT customer_id FROM gold.dim_customer WHERE is_current = 1);

-- Cross-database query: Warehouse can query Lakehouse SQL Endpoint
SELECT w.order_id, l.customer_name
FROM warehouse.dbo.fact_orders w
JOIN lakehouse_sql.customers l ON w.customer_id = l.customer_id;`,
          example: `-- SCD Type 2 implementation in Fabric Warehouse
-- Step 1: Identify changed records
WITH changes AS (
  SELECT s.customer_id, s.customer_name, s.region
  FROM silver.customers s
  JOIN gold.dim_customer d ON s.customer_id = d.customer_id
  WHERE d.is_current = 1
    AND (s.customer_name <> d.customer_name OR s.region <> d.region)
)
-- Step 2: Expire old records
UPDATE gold.dim_customer
SET is_current = 0, expiry_date = CAST(GETDATE() AS DATE)
WHERE customer_id IN (SELECT customer_id FROM changes) AND is_current = 1;

-- Step 3: Insert new versions
INSERT INTO gold.dim_customer (customer_id, customer_name, region, account_tier, effective_date, expiry_date, is_current)
SELECT c.customer_id, c.customer_name, c.region, 'Standard', CAST(GETDATE() AS DATE), NULL, 1
FROM changes c;`,
          expectedOutput: 'SCD Type 2 slowly-changing dimension with current row flagging, no Spark required',
          interview: {
            question: 'When would you use a Fabric Warehouse over a Fabric Lakehouse with SQL Analytics Endpoint?',
            answer: 'Use the Warehouse when you need: (1) Full DML — UPDATE/DELETE/stored procedures that the read-only SQL Analytics Endpoint cannot do. (2) Concurrent SQL users — Warehouse has a dedicated distributed SQL engine tuned for concurrency; the Lakehouse SQL endpoint serializes some operations. (3) T-SQL-first teams — SQL engineers who do not write Spark notebooks are more productive in the Warehouse. (4) Complex schema management — Warehouse supports constraints, schemas, and full DDL. Use the Lakehouse when: you need Spark notebooks for complex transformations, Direct Lake Power BI, or Delta time travel and ACID semantics are the priority.',
          },
          commonMistakes: [
            'Storing raw or Bronze data in the Warehouse — Warehouses are expensive compute for structured Gold-layer data, not raw ingestion. Use Lakehouse for Bronze/Silver.',
            'Assuming Warehouse tables are Delta format — Fabric Warehouse uses its own internal format (not Delta Parquet). You cannot run Delta time travel or OPTIMIZE on Warehouse tables.',
            'Forgetting that cross-database queries are possible — teams build unnecessary data copies instead of using the SQL Analytics Endpoint cross-reference to query Lakehouse data from the Warehouse.',
          ],
          productionContext: 'Enterprise patterns: Bronze/Silver in Lakehouse (Spark transforms), Gold dimension and fact tables in Warehouse (T-SQL SCD logic, stored procedures for complex business rules). Power BI reports connect to Warehouse via DirectQuery for write-back scenarios. Migration from Azure Synapse Dedicated SQL Pool to Fabric Warehouse is the most common Synapse exit path — Fabric Warehouse is serverless so there is no capacity to pre-provision.',
          performanceTip: 'Fabric Warehouse scales compute automatically — you do not set a DWU count like Synapse. For concurrent user workloads, the Warehouse distributes queries across nodes. To optimize: use round-robin distribution for fact tables, replicated distribution for small dimension tables, and always filter on partitioned columns in WHERE clauses. Statistics are auto-generated but you can run CREATE STATISTICS manually for complex query plans.',
          juniorMistake: 'Treating Fabric Warehouse as a Synapse Dedicated SQL Pool replacement by trying to manage distribution keys manually — Fabric Warehouse handles distribution automatically. Focus on query design and indexing, not distribution strategy.',
          productionTradeoff: 'Fabric Warehouse has no Delta Lake format — you gain full T-SQL DML but lose Delta time travel, Delta MERGE with complex conditions, and OPTIMIZE/ZORDER. For teams that rely heavily on Delta Lake features, Lakehouse + SQL Analytics Endpoint is a better long-term architecture even if it requires learning Spark.',
          whenNotToUse: 'Do not use Fabric Warehouse for: (1) Streaming ingestion — use Lakehouse Delta tables with Spark Structured Streaming. (2) Unstructured or semi-structured data processing — use Notebooks. (3) Teams already fluent in PySpark — the Lakehouse Spark path is more powerful and flexible. (4) Cost-sensitive workloads where Delta Lakehouse compute is cheaper for batch transforms.',
        },
      ],
    },
    {
      title: 'Fabric Security and RBAC',
      subtopics: [
        {
          id: 'fabric-security-rbac',
          title: 'Fabric Security, RBAC, and Data Governance',
          difficulty: 'Advanced',
          explanation: 'Fabric uses a layered security model: Fabric capacity-level admin controls, workspace-level RBAC (Admin/Member/Contributor/Viewer), item-level permissions, and data-level controls (row-level security, column-level security, object-level security). Microsoft Entra ID (formerly Azure AD) is the identity backbone.',
          why: 'Fabric handles both analytics AND data access in one platform — a single RBAC misconfiguration can expose sensitive data across Lakehouses, Warehouses, and Power BI reports simultaneously. Security must be designed before data is loaded, not retrofitted.',
          syntax: `-- Row-Level Security in Fabric Warehouse (T-SQL)
-- Step 1: Create the security predicate function
CREATE FUNCTION dbo.fn_region_security(@region NVARCHAR(50))
RETURNS TABLE
WITH SCHEMABINDING
AS
RETURN SELECT 1 AS result
  WHERE @region = USER_NAME()          -- user-based
     OR IS_MEMBER('data_admin') = 1;   -- admin bypass

-- Step 2: Create security policy
CREATE SECURITY POLICY RegionFilter
ADD FILTER PREDICATE dbo.fn_region_security(region)
ON gold.dim_customer
WITH (STATE = ON);

-- Column-Level Security: DENY specific columns
DENY SELECT ON gold.dim_customer (ssn, account_number) TO analyst_role;

-- Object-Level Security: grant table access to role
GRANT SELECT ON gold.dim_customer TO analyst_role;`,
          example: `-- Fabric workspace RBAC roles and what they can do:
-- Admin:       Full control — can delete workspace, manage access, publish items
-- Member:      Create and edit items, manage data connections
-- Contributor: Create and edit items, cannot share externally
-- Viewer:      Read-only access to items the workspace exposes

-- OneLake Data Access Roles (item-level)
-- These are separate from workspace RBAC:
-- Lakehouse → Manage item → Data access roles
-- Create custom roles with folder-level read/write permissions
-- Example: 'bronze_reader' role gets read access to /Tables/bronze_* only

-- Fabric + Microsoft Purview integration:
-- Purview auto-scans OneLake and catalogs all Delta tables
-- Apply sensitivity labels (Confidential, PII, Internal) in Purview
-- Labels propagate to Power BI reports automatically`,
          expectedOutput: 'Row-level and column-level security enforced at the data layer, with workspace RBAC controlling platform access',
          interview: {
            question: 'A Fabric workspace has 20 analysts who should only see their region\'s data in Power BI. How do you implement this without managing individual user permissions?',
            answer: 'Three-layer approach: (1) Entra ID Security Groups — create groups per region (group: "APAC-Analysts", "EMEA-Analysts"). Assign groups to workspace Viewer role, not individuals. (2) Row-Level Security in the Fabric Warehouse or Lakehouse SQL layer — create a security policy that filters rows based on the user\'s group membership using IS_MEMBER(). (3) Power BI RLS — add a Dynamic RLS rule on the semantic model that maps the authenticated user to their region. This way: adding a new analyst = add them to the correct Entra group. No individual permission changes needed. OneLake Data Access Roles give fine-grained folder-level control if analysts need Spark notebook access too.',
          },
          commonMistakes: [
            'Setting workspace role to Admin or Member for all users "for simplicity" — workspace Admin can delete the entire workspace and all its data. Use Viewer for analysts, Contributor for engineers.',
            'Not enabling OneLake Data Access Roles — without these, any workspace Contributor can read ALL data in the Lakehouse including Bronze raw data with PII. Data Access Roles let you restrict to specific folders.',
            'Relying only on Power BI RLS without data-layer RLS — if anyone queries the SQL Analytics Endpoint or Warehouse directly (via SSMS, Azure Data Studio), Power BI RLS is bypassed. Always enforce security at the data layer.',
            'Not integrating Microsoft Purview — without Purview, there is no audit trail for who queried what data, no sensitivity labels, and no data lineage. Regulated industries (banking, healthcare) require Purview integration.',
          ],
          productionContext: 'Enterprise Fabric security architecture: Entra ID groups as the source of truth for roles. Workspace RBAC + item-level sharing for access breadth. OneLake Data Access Roles for folder-level control. Warehouse/Lakehouse SQL RLS for row/column filtering. Power BI Dynamic RLS for report-level filtering. Purview for audit and compliance. The key principle: never grant access to an individual — always use groups. Offboarding = removing from the group, not hunting through 15 workspace permission screens.',
          performanceTip: 'Row-Level Security adds a filter predicate to every query. For large tables with millions of rows, ensure the RLS filter column (e.g., region) is indexed or partitioned. An unindexed RLS predicate on a 500M row fact table can 10x query latency. Test RLS performance with a realistic data volume before going to production.',
          juniorMistake: 'Implementing security only at the Power BI report layer — then the Lakehouse SQL endpoint and Warehouse are completely open. Security must be enforced at the closest layer to the data, not the presentation layer.',
          productionTradeoff: 'Fabric RBAC is simpler than Synapse + ADLS Gen2 + Azure AD POSIX ACLs — but it means Fabric controls both your compute and your security. If you need multi-cloud or want to keep data governance separate from the analytics platform, Unity Catalog on Databricks gives you more separation of concerns.',
          whenNotToUse: 'Fabric RBAC is not sufficient for: (1) Data residency requirements across multiple Azure regions — Fabric is single-region per tenant. (2) Cross-cloud governance — use Unity Catalog or Apache Atlas if data spans AWS + Azure. (3) Highly regulated workloads requiring hardware-level isolation — use dedicated compute with private endpoints and Fabric Private Links.',
        },
      ],
    },
  ],
};
