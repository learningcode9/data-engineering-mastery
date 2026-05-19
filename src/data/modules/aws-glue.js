export const awsGlueModule = {
  sections: [
    {
      title: 'Glue Basics',
      subtopics: [
        {
          id: 'glue-crawler',
          title: 'Crawlers & Data Catalog',
          difficulty: 'intermediate',
          explanation: 'A Glue Crawler scans S3 (or other sources), infers schema, and registers the table in the Glue Data Catalog automatically.',
          why: 'Once catalogued, data can be queried with Athena, Redshift Spectrum, or EMR without writing ingestion code.',
          syntax: `Crawler config:\n  Source:   s3://bucket/raw/orders/\n  Database: raw_db\n  Table:    orders\n  Schedule: On demand / cron`,
          example: `After crawler runs on s3://bucket/raw/orders/:\n\nGlue Catalog entry:\n  Database: raw_db\n  Table:    orders\n  Columns:\n    - order_id   (bigint)\n    - amount     (double)\n    - status     (string)\n    - created_at (string)\n\nAthena query:\nSELECT status, COUNT(*) FROM raw_db.orders GROUP BY status;`,
          expectedOutput: '+----------+--------+\n|    status|count(1)|\n+----------+--------+\n|   shipped|    2800|\n|   pending|    1100|\n| cancelled|     300|\n+----------+--------+',
          interview: {
            question: 'What is the Glue Data Catalog?',
            answer: 'A centralised metadata store for AWS. It holds table definitions (schema, location, format) used by Athena, EMR, Redshift Spectrum, and Glue jobs.',
          },
        },
        {
          id: 'glue-job',
          title: 'Glue ETL Jobs',
          difficulty: 'intermediate',
          explanation: 'A Glue job runs PySpark or Python Shell scripts managed by AWS — no cluster provisioning required.',
          why: 'Glue handles the Spark infrastructure, letting you focus on the transformation logic rather than cluster management.',
          syntax: `import sys\nfrom awsglue.context import GlueContext\nfrom pyspark.context import SparkContext\n\nsc = SparkContext()\nglueContext = GlueContext(sc)`,
          example: `from awsglue.dynamicframe import DynamicFrame\n\n# Read from catalog\norders_dyf = glueContext.create_dynamic_frame.from_catalog(\n    database="raw_db",\n    table_name="orders"\n)\n\n# Convert and filter\norders_df = orders_dyf.toDF().filter("amount > 0")\n\n# Write to S3 as Parquet\nclean_dyf = DynamicFrame.fromDF(orders_df, glueContext, "clean")\nglueContext.write_dynamic_frame.from_options(\n    frame=clean_dyf,\n    connection_type="s3",\n    connection_options={"path": "s3://bucket/clean/orders/"},\n    format="parquet"\n)`,
          expectedOutput: 'Job run succeeded. 3892 records written to s3://bucket/clean/orders/',
          interview: {
            question: 'What is a DynamicFrame in Glue vs a Spark DataFrame?',
            answer: 'A DynamicFrame tolerates schema inconsistencies (missing fields, mixed types) without failing. You typically convert to a DataFrame for complex transformations, then back to DynamicFrame for writing.',
          },
        },
      ],
    },
    {
      title: 'Glue Workflows & Scheduling',
      subtopics: [
        {
          id: 'glue-workflow',
          title: 'Workflows',
          difficulty: 'intermediate',
          explanation: 'A Glue Workflow chains crawlers, jobs, and triggers into a multi-step pipeline with dependency management.',
          why: 'Workflows let you run crawler → transform job → catalog update as a coordinated sequence, with retries and status tracking.',
          syntax: `Workflow: "DailySalesLoad"\n  Trigger 1 (Schedule 6am) → Crawler: RawOrdersCrawler\n  Trigger 2 (CrawlerSuccess) → Job: TransformOrders\n  Trigger 3 (JobSuccess)    → Job: LoadToRedshift`,
          example: `Workflow steps:\n  1. Schedule trigger at 06:00 UTC\n  2. RawOrdersCrawler — scans s3://bucket/raw/orders/2024-01-15/\n  3. On crawler success: TransformOrdersJob\n     Input:  raw_db.orders (new partition)\n     Output: s3://bucket/clean/orders/date=2024-01-15/\n  4. On job success: notify via SNS`,
          expectedOutput: 'Workflow run 06:00 UTC — Crawler: 2m → Transform job: 8m → SNS notified ✓',
          interview: {
            question: 'How does Glue Workflow handle a job failure?',
            answer: 'Downstream triggers with "Job succeeded" condition do not fire. You can add a separate "Job failed" trigger to send an alert or run a cleanup job.',
          },
        },
        {
          id: 'glue-bookmarks',
          title: 'Job Bookmarks',
          difficulty: 'intermediate',
          explanation: 'Job bookmarks track which S3 data has already been processed so the next run only reads new files.',
          why: 'Bookmarks prevent reprocessing historical data on every run, making incremental loads efficient and idempotent.',
          syntax: `Glue job property:\n  Job bookmark: Enable\n\nGlue reads only files added since the last successful run.`,
          example: `Run 1 (Jan 15):\n  Files processed: orders_2024-01-15.csv\n  Bookmark saved:  { last_modified: "2024-01-15T23:59" }\n\nRun 2 (Jan 16):\n  Files scanned:   orders_2024-01-15.csv + orders_2024-01-16.csv\n  Files NEW:       orders_2024-01-16.csv  ← only this is processed\n  Bookmark updated: { last_modified: "2024-01-16T23:59" }`,
          expectedOutput: 'Run 2 processed 1 new file (skipped 1 already-seen file)',
          interview: {
            question: 'When would you reset a Glue job bookmark?',
            answer: 'When you need to reprocess all historical data — for example after fixing a bug in the transformation logic or backfilling a new column.',
          },
        },
      ],
    },
  ],
};
