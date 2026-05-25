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
            question: 'How does Microsoft Fabric differ from Azure Synapse Analytics?',
            answer: 'Fabric is a complete SaaS-based platform built on OneLake — it includes Synapse-like capabilities (Spark, SQL) plus Power BI, Data Factory, and Real-Time Intelligence all under one roof with unified governance. Synapse requires separate storage, compute, and linked service configuration. Fabric removes that complexity and adds Direct Lake mode for near-instant Power BI queries without import.',
          },
          practice: 'List 5 item types you can create in a Fabric workspace and what each one is used for.',
          hint: 'Think: where does data live, how is it transformed, how is it queried, and how is it visualised?',
          solution: 'Lakehouse (Delta tables + SQL analytics), Warehouse (T-SQL warehouse), Notebook (PySpark/SparkSQL), Pipeline (orchestration/copy), Semantic Model (Power BI data model)',
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
            question: 'What is a OneLake Shortcut and when would you use one?',
            answer: 'A Shortcut is a pointer to data stored in another location — another OneLake path, ADLS Gen2, S3, or GCS. It virtualises external data inside a Fabric Lakehouse without copying it. Use Shortcuts when you need to query existing cloud storage without a data migration, or when you want multiple Lakehouses to share the same underlying data.',
          },
          practice: 'Explain the difference between OneLake Shortcuts and data copy. When is each approach appropriate?',
          hint: 'Consider data governance, cost, and latency trade-offs.',
          solution: 'Shortcuts reference data in place (no copy, lower cost, original governance applies). Data copy brings data into OneLake under Fabric governance with better query performance. Use Shortcuts for read-only access to external sources; use copy for full Fabric integration.',
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
            question: 'What is the difference between a Fabric Lakehouse and a Fabric Warehouse?',
            answer: 'A Lakehouse stores Delta files in OneLake and exposes them via a read-only SQL Analytics Endpoint — writes happen through Spark/notebooks. A Warehouse is a fully managed T-SQL environment with read/write SQL support, better suited for team-shared SQL workloads, views, and stored procedures. Both sit on OneLake; choose Lakehouse for Spark-first workloads and Warehouse for SQL-first workloads.',
          },
          practice: 'Write a Spark command to create a Delta table from a CSV file, then query it using the SQL Analytics Endpoint.',
          hint: 'Use spark.read.csv() → write.format("delta").saveAsTable()',
          solution: `df = spark.read.option("header", True).csv("Files/raw/orders.csv")
df.write.format("delta").mode("overwrite").saveAsTable("orders")
# Then in SQL: SELECT * FROM orders LIMIT 10;`,
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
            question: 'In a Fabric Medallion architecture, what do Bronze, Silver, and Gold represent?',
            answer: 'Bronze = raw data exactly as received (no transformation, historical record). Silver = cleansed, validated, conformed data (correct types, nulls handled, deduplication). Gold = business-level aggregations and KPIs optimized for BI reporting and ML features. Each layer is a Delta table, and transformations between layers run as Spark notebooks or pipelines.',
          },
          practice: 'Design a Medallion architecture for an e-commerce company. List what data goes in each layer and what transformations happen between layers.',
          hint: 'Start with raw order events → cleaned orders → daily revenue aggregations',
          solution: 'Bronze: raw JSON from order API (no changes). Silver: parse JSON, cast types, deduplicate by order_id, add ingestion timestamp. Gold: daily/weekly revenue by region and product category, joined with customer dimension.',
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
            question: 'How is Data Factory in Fabric different from standalone Azure Data Factory?',
            answer: 'Data Factory in Fabric uses the same pipeline visual experience but is fully integrated in the Fabric workspace — no linked services for OneLake, no separate resource group. Pipelines can directly call Fabric Notebooks, Lakehouses, and Warehouses. The trade-off: Fabric pipelines currently lack some ADF connectors. For migrations, start Fabric-native; use ADF if you need SAP, mainframe, or very specific on-prem connectors.',
          },
          practice: 'Design a pipeline that loads data from a SQL Server on-premises source into a Fabric Lakehouse Bronze layer nightly.',
          hint: 'Use On-premises Data Gateway + Copy Activity → Lakehouse Files',
          solution: 'Install On-premises Data Gateway on a local machine. In Fabric, create a SQL Server connection using the gateway. Build a Pipeline with a Copy Activity: Source = SQL Server table, Sink = Lakehouse Files/raw/. Schedule nightly. Add a Notebook Activity after copy to move data to Bronze Delta table.',
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
            question: 'When would you use Dataflows Gen2 vs a Fabric Notebook for transformation?',
            answer: 'Use Dataflows Gen2 when: the transformation logic is straightforward (filter, rename, join), the author is comfortable with Power Query rather than Python/Spark, or you need to connect to a source not easily accessible from Spark. Use a Notebook when: you need complex custom logic in Python, ML features, large-scale Spark optimization (partitioning, ZORDER), or when you want version-controlled code in Git.',
          },
          practice: 'Using Power Query M, write a transformation that reads an orders table, filters for completed orders, and renames OrderDate to order_date.',
          hint: 'Use Table.SelectRows and Table.RenameColumns',
          solution: `let
  Source = Lakehouse_Connection{[Item="bronze_orders"]}[Data],
  Filtered = Table.SelectRows(Source, each [status] = "Completed"),
  Renamed = Table.RenameColumns(Filtered, {{"OrderDate", "order_date"}})
in
  Renamed`,
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
            question: 'What is the difference between Fabric Eventstream and Azure Stream Analytics?',
            answer: 'Both handle real-time streaming but Eventstream is no-code and natively integrated in Fabric — it connects directly to KQL Databases, Lakehouses, and Warehouses without extra pipeline config. Azure Stream Analytics uses SQL-like queries and outputs to Azure services outside Fabric. Choose Eventstream for Fabric-first architectures; use Stream Analytics if you need complex CEP (complex event processing) queries or must output to non-Fabric Azure services.',
          },
          practice: 'Design an Eventstream topology for a retail company that wants real-time transaction fraud detection. What sources, transformations, and destinations would you use?',
          hint: 'Think: where does the transaction data come from → what signals indicate fraud → where does the output need to go for alerting?',
          solution: 'Source: Event Hub receiving POS transactions. Transformation: Aggregate → tumbling 5-minute window, Group By customer_id, flag WHERE transaction_count > 20 in window. Destination: KQL Database for live queries + Lakehouse for historical analysis. Alert: Power BI real-time dashboard on KQL.',
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
          example: `// Real-world KQL: detect temperature spikes
sensor_readings
| where timestamp > ago(24h)
| summarize max_temp = max(temperature) by device_id, bin(timestamp, 1h)
| where max_temp > 95
| join kind=inner (
    devices | project device_id, location, owner_email
  ) on device_id
| project timestamp, location, max_temp, owner_email
| order by max_temp desc`,
          expectedOutput: 'Table of temperature spikes in the last 24h with device location and owner contact',
          interview: {
            question: 'When would you use a KQL Database over a Lakehouse Delta table for analytics?',
            answer: 'KQL Databases are optimized for time-series, log, and event data with high ingestion rates and millisecond query latency — ideal for operational dashboards, anomaly detection, and security analytics. Delta tables in a Lakehouse are better for batch transformations, large-scale historical analysis, and ML features. Use KQL when queries always filter by time and you need sub-second response for live dashboards.',
          },
          practice: 'Write a KQL query that counts events per 10-minute window for the last 6 hours, grouped by event_type.',
          hint: 'Use summarize with bin(timestamp, 10m) and count()',
          solution: `events
| where timestamp > ago(6h)
| summarize event_count = count() by bin(timestamp, 10m), event_type
| order by timestamp asc`,
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
            question: 'What is Direct Lake mode in Fabric and how does it differ from Import mode in Power BI?',
            answer: 'Import mode copies data into the Power BI model — fast queries but requires scheduled refresh and has dataset size limits. Direct Query reads from the source on every query — always fresh but slower. Direct Lake is a new Fabric-only mode that reads Delta Parquet files directly from OneLake — it is as fast as Import but always up-to-date, with no dataset size limit at scale. It only works with Fabric Lakehouses and Warehouses.',
          },
          practice: 'Explain the steps to expose a Gold Lakehouse table as a Power BI report using Direct Lake mode.',
          hint: 'Gold Delta table → Default Semantic Model → New Report in Fabric',
          solution: '1. Create Gold Delta table in Lakehouse (e.g., gold.daily_revenue). 2. Open the Lakehouse in Fabric — click SQL Analytics Endpoint. 3. Click "New semantic model" or use the auto-created Default Semantic Model. 4. Select the gold.daily_revenue table. 5. Create a new Report from the semantic model. 6. Build visuals — Power BI reads Delta files via Direct Lake automatically.',
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
            question: 'How would you implement CI/CD for a Fabric Lakehouse ETL pipeline?',
            answer: 'Connect each Fabric workspace (Dev, Test, Prod) to a Git branch. Developers work in feature branches, open PRs to main — notebook code is reviewed as Python files in Git. On merge to main, a Deployment Pipeline stage promotes items to Test. After automated data quality tests pass (run via Notebook Activity), a manual approval gates promotion to Production. Use workspace parameters to swap data connections between environments.',
          },
          practice: 'Describe how you would set up a 3-stage Fabric Deployment Pipeline for a team of 5 data engineers working on the same Lakehouse ETL.',
          hint: 'Consider: Git branching strategy, workspace isolation, parameter replacement, approval gates',
          solution: 'Create 3 workspaces: dev-analytics, test-analytics, prod-analytics. Connect dev-analytics to a shared Git repo develop branch. Connect prod-analytics to main. Set up Fabric Deployment Pipeline: Dev → Test → Prod. In Dev, engineers use feature branches. PRs merge to develop → auto-deploys to Test. Data quality Notebook runs against Test. After review, manually promote to Prod. Use workspace parameters to replace Lakehouse connection strings per environment.',
        },
      ],
    },
  ],
};
