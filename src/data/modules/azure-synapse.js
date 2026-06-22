export const synapseModule = {
  documentationMapping: [
    {
      concept: 'Azure Synapse Analytics',
      officialSource: 'Official Documentation References',
      sourceUrl: 'https://learn.microsoft.com/en-us/azure/synapse-analytics/',
      howThisLessonUsesIt: 'This module frames Synapse as an Azure analytics service with serverless SQL, dedicated SQL pools, data lake querying, pipelines, workload management, and cost controls.',
    },
  ],
  sections: [
    {
      title: 'Synapse Core Architecture',
      subtopics: [
        {
          id: 'synapse-serverless-vs-dedicated',
          title: 'Serverless SQL vs Dedicated SQL Pool',
          difficulty: 'Intermediate',
          explanation: 'Synapse Serverless SQL queries files in the data lake on demand, while Dedicated SQL Pool is provisioned MPP warehouse compute for high-concurrency warehouse workloads.',
          what: 'Use serverless for exploration, external lake querying, and ad hoc analysis. Use dedicated pools when you need predictable warehouse performance, workload isolation, and loaded relational tables.',
          why: 'Senior Azure Data Engineers must choose the right Synapse engine because it affects cost, performance, storage layout, and operational ownership.',
          realWorldUsage: 'A team uses Serverless SQL to inspect raw Parquet in ADLS, then loads curated Gold data into a Dedicated SQL Pool for a finance reporting SLA.',
          azureUsage: 'Serverless SQL reads ADLS directly through external tables or OPENROWSET. Dedicated SQL Pool stores data in distributed tables and uses DWUs for provisioned compute.',
          azureRelevance: 'This is a core Azure architecture decision for teams that still operate Synapse alongside Fabric and Databricks.',
          databricksUsage: 'Databricks may prepare Delta/Parquet lakehouse tables that Synapse Serverless reads, or it may publish curated outputs for warehouse serving.',
          databricksRelevance: 'Keep heavy Spark transformations in Databricks when data processing is complex; use Synapse SQL for serving and SQL analytics where it fits.',
          syntax: `Decision guide:
  Serverless SQL: lake exploration, pay-per-data-scanned
  Dedicated SQL Pool: provisioned MPP warehouse, predictable workload
  Fabric Warehouse: SaaS warehouse for newer Microsoft analytics estates`,
          example: `-- Serverless SQL reads lake files
SELECT TOP 100 *
FROM OPENROWSET(
  BULK 'https://acct.dfs.core.windows.net/silver/orders/*.parquet',
  FORMAT = 'PARQUET'
) AS rows;`,
          expectedOutput: 'A clear engine decision that balances scan cost, SLA, concurrency, and operational complexity.',
          interview: {
            question: 'When would you use Synapse Serverless SQL instead of Dedicated SQL Pool?',
            answer: 'Use Serverless SQL for ad hoc lake queries and exploration where pay-per-scan is acceptable. Use Dedicated SQL Pool for governed warehouse workloads needing predictable performance, distribution design, workload management, and concurrency control.',
          },
          practice: 'Choose Synapse Serverless or Dedicated SQL Pool for three workloads: raw lake inspection, daily finance warehouse, and one-time CSV profiling.',
          practiceTask: 'Explain the cost/performance tradeoff for each workload.',
          commonMistakes: [
            'Using Serverless SQL for repeated large scans without controlling file layout.',
            'Keeping a Dedicated SQL Pool running when no workload needs provisioned compute.',
            'Treating Synapse, Fabric, and Databricks as interchangeable instead of workload-specific.',
          ],
          productionContext: 'Engine selection should be documented because it drives cost model, performance tuning, security model, and runbook ownership.',
          performanceTip: 'For Serverless SQL, reduce bytes scanned with Parquet, partition pruning, and selective columns. For dedicated pools, tune distribution, partitions, and statistics.',
          performanceConsiderations: 'Serverless cost grows with scanned data; dedicated pool cost grows with provisioned runtime and DWU sizing.',
          seniorEngineeringInsights: 'Strong answers compare workload shape, SLA, concurrency, governance, cost, and migration direction toward Fabric where relevant.',
        },
        {
          id: 'synapse-cetas-copy-into',
          title: 'CETAS and COPY INTO',
          difficulty: 'Intermediate',
          explanation: 'CETAS writes query results to external lake files, while COPY INTO loads files into dedicated SQL pool tables.',
          what: 'CETAS is useful for exporting curated results to ADLS. COPY INTO is a production-friendly way to load lake files into warehouse tables.',
          why: 'Data engineers use these commands to bridge lake storage and SQL warehouse serving without manual file movement.',
          realWorldUsage: 'A daily curated Parquet folder is loaded into a staging table with COPY INTO, then merged into warehouse facts. A summary extract is written back to ADLS using CETAS.',
          azureUsage: 'Synapse pipelines or SQL scripts can run COPY INTO after ADF/Databricks lands files in ADLS.',
          azureRelevance: 'This pattern appears in Synapse migrations, lakehouse-to-warehouse publishing, and regulated export workflows.',
          databricksUsage: 'Databricks commonly creates the Parquet/Delta outputs; Synapse consumes exported Parquet when the warehouse is the serving engine.',
          databricksRelevance: 'If data remains in Delta, validate whether Synapse engine and format support match the serving requirement.',
          syntax: `COPY INTO dbo.stage_orders
FROM 'https://acct.dfs.core.windows.net/silver/orders/'
WITH (FILE_TYPE = 'PARQUET');

CREATE EXTERNAL TABLE export.daily_sales
WITH (LOCATION = '/gold/daily_sales/', DATA_SOURCE = lake, FILE_FORMAT = parquet_format)
AS SELECT business_date, SUM(net_sales) AS revenue
FROM dbo.fact_sales
GROUP BY business_date;`,
          example: 'ADF triggers a Synapse SQL script after the Silver Parquet files land successfully.',
          expectedOutput: 'Warehouse staging tables are loaded from lake files, and curated SQL results can be exported back to the lake.',
          interview: {
            question: 'When would you use COPY INTO versus CETAS in Synapse?',
            answer: 'Use COPY INTO to load external files into dedicated SQL pool tables. Use CETAS to write query output from Synapse back to external storage as files.',
          },
          practice: 'Design a load step that imports daily Parquet orders from ADLS into a Synapse staging table and records row counts.',
          practiceTask: 'Include load command, validation check, and failure behavior.',
          commonMistakes: [
            'Loading files before schema and file format are validated.',
            'Skipping row-count reconciliation after COPY INTO.',
            'Using CETAS as a substitute for governed Gold table modeling.',
          ],
          productionContext: 'COPY/CETAS scripts should be parameterized, audited, and included in deployment pipelines.',
          performanceTip: 'Use columnar files, sensible partition paths, and appropriately sized files to improve load/query performance.',
          performanceConsiderations: 'Too many tiny files slow loading and metadata operations.',
          seniorEngineeringInsights: 'A senior answer connects command choice to lake/warehouse boundaries and validation.',
        },
      ],
    },
    {
      title: 'Synapse Performance Engineering',
      subtopics: [
        {
          id: 'synapse-distribution-keys',
          title: 'Distribution Keys and Table Design',
          difficulty: 'Advanced',
          explanation: 'Dedicated SQL Pool distributes table rows across compute distributions. Hash, round-robin, and replicated table choices determine data movement during joins.',
          what: 'Large fact tables usually need a thoughtful hash distribution key. Small dimensions may be replicated. Temporary staging tables often start round-robin before transformation.',
          why: 'Bad distribution keys cause expensive data movement and slow joins, which is a common senior interview topic.',
          realWorldUsage: 'A fact_sales table distributed by customer_key joins frequently to dim_customer. If the dimension is replicated or aligned well, large joins avoid unnecessary movement.',
          azureUsage: 'Synapse Dedicated SQL Pool exposes distribution choices directly in CREATE TABLE statements.',
          azureRelevance: 'This is one of the main differences between Synapse Dedicated SQL Pool and serverless/Fabric Warehouse tuning.',
          databricksUsage: 'Databricks tuning focuses on partitions/files/shuffle; Synapse dedicated pool tuning focuses on distributions, statistics, and workload management.',
          databricksRelevance: 'Knowing the difference helps explain platform-specific optimization in interviews.',
          syntax: `CREATE TABLE dbo.fact_sales
WITH (
  DISTRIBUTION = HASH(customer_key),
  CLUSTERED COLUMNSTORE INDEX
) AS SELECT * FROM dbo.stage_sales;`,
          example: 'A large fact table hash-distributed on customer_key joins to a replicated dim_customer to reduce data movement.',
          expectedOutput: 'Fewer data movement operations and faster joins for common warehouse queries.',
          interview: {
            question: 'How do you choose a Synapse dedicated pool distribution key?',
            answer: 'Choose a high-cardinality, frequently joined column that evenly distributes rows and reduces data movement. Avoid skewed keys, low-cardinality columns, and keys not used in major joins.',
          },
          practice: 'Choose distribution strategies for fact_sales, dim_product, and stage_orders.',
          practiceTask: 'Explain hash, replicated, or round-robin for each table.',
          commonMistakes: [
            'Hash distributing on low-cardinality status columns.',
            'Ignoring data skew in the distribution key.',
            'Using round-robin for final large fact tables that join heavily.',
          ],
          productionContext: 'Distribution design should be tested with real row counts and query plans, not guessed from names alone.',
          performanceTip: 'Update statistics and inspect data movement operations after changing distribution design.',
          performanceConsiderations: 'Replicating too many dimensions increases storage and refresh work; hash keys can skew if business keys are uneven.',
          seniorEngineeringInsights: 'Senior answers mention join patterns, cardinality, skew, replicated dimensions, and query-plan validation.',
        },
        {
          id: 'synapse-workload-management',
          title: 'Workload Management and Concurrency',
          difficulty: 'Advanced',
          explanation: 'Synapse workload management controls how resources are assigned across users, queries, and pipeline loads.',
          what: 'Production systems separate ingestion, transformation, and analyst workloads so critical loads and executive reports do not block each other.',
          why: 'A warehouse that works in development can fail under real concurrency without workload groups, resource classes, or scheduling controls.',
          realWorldUsage: 'Finance reports need morning priority while overnight COPY/MERGE loads consume heavy compute. Workload management protects report SLA.',
          azureUsage: 'Use workload groups/classifiers, scaling, pause/resume, and scheduling patterns in dedicated pools.',
          azureRelevance: 'Synapse is often shared by ETL, analysts, and Power BI; resource governance is required for predictable service.',
          databricksUsage: 'Databricks has analogous concepts through job clusters, SQL warehouse sizing, and query queues, but not Synapse workload groups.',
          databricksRelevance: 'Compare platform-specific concurrency controls in architecture interviews.',
          syntax: `Workload controls:
  - workload groups for resource allocation
  - workload classifiers for routing sessions
  - schedule heavy loads outside BI peak
  - scale DWU before known load windows
  - pause/resume for idle periods`,
          example: 'Morning Power BI queries run in a reporting workload group while batch transformations use a separate group during off-hours.',
          expectedOutput: 'Predictable query performance and fewer noisy-neighbor incidents.',
          interview: {
            question: 'How do you protect business reporting from heavy Synapse loads?',
            answer: 'Separate workloads with workload management, schedule heavy loads away from reporting windows, scale when justified, keep statistics current, and monitor queueing/resource waits.',
          },
          practice: 'Design a workload strategy for a dedicated pool shared by ETL and 200 business users.',
          practiceTask: 'Include scheduling, resource separation, and monitoring.',
          commonMistakes: [
            'Running heavy transformation jobs during business reporting windows.',
            'Scaling DWUs without checking query waits and data movement.',
            'Letting all users share the same resource behavior.',
          ],
          productionContext: 'Workload management is an SLA control, not just a performance tuning detail.',
          performanceTip: 'Monitor query waits, duration, and concurrency before and after workload changes.',
          performanceConsiderations: 'Higher DWU can reduce runtime but increases cost while active. Pair scale-up with scheduled scale-down.',
          seniorEngineeringInsights: 'Senior answers balance user experience, ETL windows, cost, and operational monitoring.',
        },
      ],
    },
    {
      title: 'Synapse Operations',
      subtopics: [
        {
          id: 'synapse-statistics-partitioning',
          title: 'Statistics, Partitioning, and Maintenance',
          difficulty: 'Advanced',
          explanation: 'Synapse query performance depends on accurate statistics, sensible partitioning, and regular table maintenance.',
          what: 'Statistics help the optimizer estimate row counts. Partitioning helps manage large tables by date or business window. Maintenance keeps warehouse performance stable.',
          why: 'Slow Synapse queries are often caused by stale statistics, poor distribution, partition misuse, or too much data scanned.',
          realWorldUsage: 'A monthly close report slows after a large backfill because statistics are stale and the optimizer chooses a bad join plan.',
          azureUsage: 'Dedicated SQL Pool requires conscious statistics and table maintenance as part of production operations.',
          azureRelevance: 'This is a practical distinction from serverless/Fabric where the tuning controls differ.',
          databricksUsage: 'Databricks uses Delta statistics, file pruning, OPTIMIZE, and query plans; Synapse dedicated uses SQL statistics and MPP distribution.',
          databricksRelevance: 'Senior Azure engineers should explain both tuning models without mixing them up.',
          syntax: `Maintenance checklist:
  - update statistics after large loads
  - partition large facts by date when it supports load/query windows
  - validate distribution skew
  - inspect query plan/data movement
  - archive or purge old partitions by retention policy`,
          example: 'After loading 18 months of history, update statistics on fact_sales before releasing the report.',
          expectedOutput: 'More stable query plans and predictable report performance.',
          interview: {
            question: 'Why do Synapse queries slow down after a large load?',
            answer: 'Common causes are stale statistics, data skew, poor distribution, missing partition pruning, and increased data movement. Validate with query plans and system views before scaling compute.',
          },
          practice: 'A query slowed after a historical backfill. List your investigation order.',
          practiceTask: 'Include statistics, distribution, partitioning, query plan, and workload checks.',
          commonMistakes: [
            'Scaling up before checking stale statistics.',
            'Partitioning every table even when queries do not filter by the partition key.',
            'Confusing Databricks OPTIMIZE with Synapse dedicated pool maintenance.',
          ],
          productionContext: 'Maintenance should be part of release/backfill runbooks.',
          performanceTip: 'Update statistics after large data changes and check whether queries actually prune partitions.',
          performanceConsiderations: 'Partitioning improves manageability only when aligned to query/load patterns; otherwise it adds complexity.',
          seniorEngineeringInsights: 'Senior answers show an evidence-based tuning workflow before changing compute size.',
        },
        {
          id: 'synapse-cost-and-migration',
          title: 'Cost Controls and Fabric Migration Decisions',
          difficulty: 'Advanced',
          explanation: 'Synapse cost management includes pause/resume, right-sizing dedicated pools, reducing serverless scan bytes, and deciding when Fabric is a better strategic platform.',
          what: 'A senior Azure engineer should operate existing Synapse estates well while understanding which workloads are candidates for Fabric migration.',
          why: 'Many companies will run Synapse and Fabric side-by-side. Interviewers expect balanced tradeoff thinking, not blind migration advice.',
          realWorldUsage: 'A stable finance dedicated pool stays in Synapse, while a new self-service analytics workspace starts in Fabric with OneLake and Direct Lake semantic models.',
          azureUsage: 'Use Azure Cost Management, Synapse monitoring, scheduled pause/resume, query optimization, and capacity planning.',
          azureRelevance: 'Cost and migration strategy are now part of senior Azure data platform ownership.',
          databricksUsage: 'Databricks remains strong for Spark/lakehouse transformations even when serving moves to Synapse or Fabric.',
          databricksRelevance: 'Architecture decisions should compare Databricks, Synapse, and Fabric by workload and governance model.',
          syntax: `Cost controls:
  Dedicated: pause/resume, scale DWU, workload windows
  Serverless: reduce scanned bytes, Parquet, partition pruning
  Migration: compare workload fit, governance, cost, and rewrite effort`,
          example: 'Pause a dedicated pool outside business hours and migrate exploratory lake queries to Fabric/Serverless where it reduces operational overhead.',
          expectedOutput: 'A pragmatic operating model: optimize what exists, migrate where value is clear.',
          interview: {
            question: 'How do you decide whether a Synapse workload should move to Fabric?',
            answer: 'Compare business value, migration effort, current cost, governance needs, performance SLA, integration dependencies, and whether Fabric capabilities like OneLake, Direct Lake, and SaaS operations simplify the workload.',
          },
          practice: 'Evaluate whether to migrate a Synapse Gold reporting workload to Fabric.',
          practiceTask: 'List factors that would support migration and factors that would argue for staying.',
          commonMistakes: [
            'Saying Fabric always replaces Synapse.',
            'Ignoring rewrite/testing cost and stakeholder risk.',
            'Leaving dedicated pools running idle instead of fixing operating cost first.',
          ],
          productionContext: 'Migration decisions should include side-by-side validation and rollback plans.',
          performanceTip: 'Measure current workload behavior before migration; assumptions about cost/performance are often wrong.',
          performanceConsiderations: 'Fabric capacity and Synapse dedicated pool costs are different models. Compare real workload cost, not list prices.',
          seniorEngineeringInsights: 'Senior answers are balanced: protect current SLAs while identifying rational modernization paths.',
        },
      ],
    },
  ],
  interviewGroups: [
    {
      title: 'Senior',
      questions: [
        {
          question: 'How do you tune a slow Synapse dedicated pool query?',
          answer: 'Inspect the query plan and data movement first, then review distribution key, statistics freshness, partition pruning, workload waits, and table design before scaling DWUs.',
        },
        {
          question: 'How do Synapse Serverless, Dedicated SQL Pool, Fabric Warehouse, and Databricks differ?',
          answer: 'Serverless scans lake files on demand, Dedicated SQL Pool is provisioned MPP SQL warehouse compute, Fabric Warehouse is SaaS SQL serving in Fabric, and Databricks is Spark/lakehouse compute for engineering-heavy transformations.',
        },
      ],
    },
  ],
  miniProject: {
    title: 'Synapse Gold Serving Layer',
    goal: 'Design a Synapse serving model for Gold sales reporting that balances dedicated pool performance, serverless exploration, and Fabric migration readiness.',
    tasks: [
      'Choose Serverless SQL or Dedicated SQL Pool for each workload.',
      'Design distribution and partitioning for fact_sales.',
      'Add COPY INTO and validation checks for staged files.',
      'Define workload management and pause/resume cost controls.',
    ],
    expectedOutput: 'A Synapse architecture note with table design, load pattern, cost controls, and migration recommendation.',
  },
};
