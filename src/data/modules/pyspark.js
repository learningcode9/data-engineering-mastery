export const pysparkModule = {
  sections: [
    {
      title: 'Spark Basics',
      subtopics: [
        {
          id: 'pyspark-session',
          title: 'SparkSession',
          difficulty: 'intermediate',
          explanation: 'SparkSession is the entry point to Spark. Every PySpark job starts by creating one.',
          why: 'You need a SparkSession before reading data, running transformations, or writing results.',
          syntax: `from pyspark.sql import SparkSession\n\nspark = SparkSession.builder \\\n    .appName("SalesPipeline") \\\n    .getOrCreate()`,
          example: `from pyspark.sql import SparkSession\n\nspark = SparkSession.builder \\\n    .appName("OrdersJob") \\\n    .getOrCreate()\n\nprint(spark.version)  # e.g. 3.4.0\nspark.stop()`,
          expectedOutput: '3.4.0',
          interview: {
            question: 'Why call getOrCreate() instead of just create()?',
            answer: 'getOrCreate() reuses an existing session if one already exists, preventing duplicate contexts in notebooks or test runs.',
          },
        },
        {
          id: 'pyspark-dataframe',
          title: 'DataFrames',
          difficulty: 'intermediate',
          explanation: 'A Spark DataFrame is a distributed table with named columns. It is lazily evaluated — transformations are planned but not run until an action is called.',
          why: 'DataFrames let you query and transform billions of rows across a cluster using familiar SQL-like methods.',
          syntax: `df = spark.read.csv("s3://bucket/orders.csv", header=True, inferSchema=True)\ndf.printSchema()\ndf.show(5)`,
          example: `df = spark.read.parquet("s3://datalake/orders/")\n\nprint(f"Rows: {df.count()}")\ndf.select("order_id", "amount", "status").show(3)`,
          expectedOutput: 'Rows: 4200000\n+--------+------+---------+\n|order_id|amount|   status|\n+--------+------+---------+\n|     101| 150.0|  shipped|\n|     102|  89.0|  pending|\n|     103| 230.0|  shipped|\n+--------+------+---------+',
          interview: {
            question: 'What is lazy evaluation in Spark?',
            answer: 'Spark builds a query plan for transformations (filter, select) but does not execute until an action (show, count, write) is called. This allows Spark to optimise the plan.',
          },
        },
      ],
    },
    {
      title: 'Transformations & Writes',
      subtopics: [
        {
          id: 'pyspark-filter-select',
          title: 'Filter & Select',
          difficulty: 'intermediate',
          explanation: 'select() picks columns; filter() (or where()) keeps only rows matching a condition.',
          why: 'Most pipeline jobs reduce columns to what is needed and filter out invalid or irrelevant rows.',
          syntax: `from pyspark.sql.functions import col\n\nclean = df \\\n    .select("order_id", "amount", "status") \\\n    .filter(col("amount") > 0)`,
          example: `from pyspark.sql.functions import col\n\nshipped = df \\\n    .select("order_id", "customer_id", "amount") \\\n    .filter(col("status") == "shipped") \\\n    .filter(col("amount") > 100)\n\nshipped.show()`,
          expectedOutput: '+--------+-----------+------+\n|order_id|customer_id|amount|\n+--------+-----------+------+\n|     101|          1| 150.0|\n|     103|          1| 230.0|\n|     105|          4| 320.0|\n+--------+-----------+------+',
          interview: {
            question: 'What is the difference between filter() and where() in PySpark?',
            answer: 'They are identical — where() is an alias for filter(). Use whichever reads more naturally.',
          },
        },
        {
          id: 'pyspark-write',
          title: 'Writing Data',
          difficulty: 'intermediate',
          explanation: 'DataFrame.write saves the result in Parquet, CSV, Delta, or other formats to cloud storage or a database.',
          why: 'The final step of most Spark jobs persists the transformed data for downstream consumers or reporting.',
          syntax: `df.write \\\n    .mode("overwrite") \\\n    .partitionBy("status") \\\n    .parquet("s3://datalake/clean/orders/")`,
          example: `clean_df \\\n    .write \\\n    .mode("overwrite") \\\n    .option("compression", "snappy") \\\n    .parquet("s3://warehouse/orders_clean/")\n\nprint("Write complete")`,
          expectedOutput: 'Write complete',
          interview: {
            question: 'What does partitionBy() do when writing Parquet files?',
            answer: 'It organises output into subdirectories by the partition column value (e.g. status=shipped/). This speeds up queries that filter on that column.',
          },
        },
      ],
    },
  ],
};
