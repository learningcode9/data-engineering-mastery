export const databricksModule = {
  sections: [
    {
      title: 'Notebooks & Clusters',
      subtopics: [
        {
          id: 'databricks-notebook',
          title: 'Notebooks',
          difficulty: 'beginner',
          explanation: 'A Databricks notebook is an interactive document with code cells, markdown, and output. Each cell runs independently.',
          why: 'Data engineers use notebooks to explore data, prototype transformations, and document pipeline logic in one place.',
          syntax: `# Cell 1 — read data\ndf = spark.read.parquet("dbfs:/mnt/datalake/orders/")\n\n# Cell 2 — inspect\ndf.printSchema()\ndf.show(5)`,
          example: `# %md\n# ## Orders Quality Check\n\n# Cell 1\ndf = spark.read.parquet("dbfs:/mnt/raw/orders/")\nprint(f"Total rows: {df.count()}")\n\n# Cell 2\nfrom pyspark.sql.functions import col\nnulls = df.filter(col("amount").isNull()).count()\nprint(f"Null amounts: {nulls}")`,
          expectedOutput: 'Total rows: 420000\nNull amounts: 3',
          interview: {
            question: 'What is dbfs:/ in Databricks?',
            answer: 'DBFS (Databricks File System) is a distributed file system mounted in the workspace. It abstracts cloud storage (e.g. Azure Data Lake) behind a simple path.',
          },
        },
        {
          id: 'databricks-cluster',
          title: 'Clusters',
          difficulty: 'intermediate',
          explanation: 'A cluster is a set of cloud VMs that run Spark. Databricks manages scaling, upgrades, and termination automatically.',
          why: 'Choosing the right cluster size controls cost and performance — too small is slow, too large wastes money.',
          syntax: `Cluster config:\n  Runtime:    Databricks Runtime 13.3 LTS\n  Node type:  Standard_DS3_v2\n  Workers:    2–8 (auto-scale)\n  Termination: 30 min idle`,
          example: `Cluster sizes by workload:\n\n  Dev / Exploration:\n    Workers: 1–2, spot instances, auto-terminate 20 min\n\n  Daily batch job:\n    Workers: 4–8, on-demand, job cluster (starts, runs, stops)\n\n  Streaming:\n    Workers: 4, on-demand, always-on`,
          expectedOutput: 'Right-sizing clusters is the biggest cost lever in Databricks.',
          interview: {
            question: 'What is a job cluster vs an all-purpose cluster?',
            answer: 'A job cluster is created for a single job run and terminated when done — cheapest for production. An all-purpose cluster stays running for interactive work but costs more if idle.',
          },
        },
      ],
    },
    {
      title: 'Delta Lake & Data Processing',
      subtopics: [
        {
          id: 'databricks-delta',
          title: 'Delta Lake Basics',
          difficulty: 'intermediate',
          explanation: 'Delta Lake adds ACID transactions, schema enforcement, and time travel to Parquet files on cloud storage.',
          why: 'Delta tables are the standard storage format in Databricks — they handle concurrent writes, schema evolution, and let you query historical versions.',
          syntax: `# Write as Delta\ndf.write.format("delta").mode("overwrite").save("dbfs:/mnt/silver/orders")\n\n# Read\nspark.read.format("delta").load("dbfs:/mnt/silver/orders").show()`,
          example: `# Append new records\nnew_df.write \\\n    .format("delta") \\\n    .mode("append") \\\n    .save("dbfs:/mnt/silver/orders")\n\n# Time travel — read yesterday's snapshot\nfrom delta.tables import DeltaTable\ndt = DeltaTable.forPath(spark, "dbfs:/mnt/silver/orders")\ndt.history(3).select("version","timestamp","operation").show()`,
          expectedOutput: '+-------+-------------------+---------+\n|version|          timestamp|operation|\n+-------+-------------------+---------+\n|      2|2024-01-16 06:02:00|    WRITE|\n|      1|2024-01-15 06:01:00|    WRITE|\n|      0|2024-01-14 06:00:00|    WRITE|\n+-------+-------------------+---------+',
          interview: {
            question: 'What is time travel in Delta Lake?',
            answer: 'Every write to a Delta table creates a new version. You can query any past version by version number or timestamp — useful for auditing, debugging, or rollback.',
          },
        },
        {
          id: 'databricks-medallion',
          title: 'Medallion Architecture',
          difficulty: 'intermediate',
          explanation: 'Bronze → Silver → Gold is a layered data organisation pattern in Databricks lakehouses.',
          why: 'Each layer has a clear contract: Bronze is raw, Silver is clean and deduplicated, Gold is aggregated for reporting.',
          syntax: `Bronze: raw ingest, no changes\n  "dbfs:/mnt/bronze/orders/"\n\nSilver: cleaned, typed, deduplicated\n  "dbfs:/mnt/silver/orders/"\n\nGold: aggregated, business-ready\n  "dbfs:/mnt/gold/daily_revenue/"`,
          example: `# Bronze → Silver\nbronze = spark.read.format("delta").load("dbfs:/mnt/bronze/orders")\n\nsilver = bronze \\\n    .dropDuplicates(["order_id"]) \\\n    .filter(col("amount") > 0) \\\n    .withColumn("amount", col("amount").cast("double"))\n\nsilver.write.format("delta").mode("overwrite") \\\n    .save("dbfs:/mnt/silver/orders")`,
          expectedOutput: 'Rows: 4200000 → 4197843 after dedup and filter',
          interview: {
            question: 'Why keep raw Bronze data if you always overwrite it?',
            answer: 'Bronze is your audit trail. If a Silver transformation has a bug you can reprocess from the untouched raw data without re-ingesting from source.',
          },
        },
      ],
    },
  ],
};
