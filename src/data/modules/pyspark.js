export const pysparkModule = {
  sections: [
    {
      title: 'Spark Basics',
      subtopics: [
        {
          id: 'pyspark-session',
          title: 'SparkSession',
          difficulty: 'Beginner',
          explanation: 'SparkSession is the single entry point to Apache Spark. It encapsulates SparkContext, SQLContext, and HiveContext. Every PySpark job starts by creating or retrieving one.',
          why: 'Without a SparkSession you cannot read data, run transformations, or write results. It manages the Spark driver process and the connection to the cluster.',
          syntax: `from pyspark.sql import SparkSession

spark = SparkSession.builder \\
    .appName("MyPipeline") \\
    .config("spark.sql.shuffle.partitions", "200") \\
    .getOrCreate()`,
          example: `from pyspark.sql import SparkSession

spark = SparkSession.builder \\
    .appName("OrdersJob") \\
    .config("spark.sql.shuffle.partitions", "100") \\
    .getOrCreate()

print(spark.version)
print(spark.sparkContext.master)
spark.stop()`,
          expectedOutput: `3.4.0\nlocal[*]`,
          interview: {
            question: 'Why call getOrCreate() instead of just create()?',
            answer: 'getOrCreate() reuses an existing session if one already exists, preventing duplicate contexts in notebooks or test runs. In Databricks, the session already exists — always use getOrCreate().',
          },
          practice: 'Write code to create a SparkSession for an app called "InventoryJob" with shuffle partitions set to 50. Print the Spark version.',
          hint: 'Use SparkSession.builder.appName("InventoryJob").config("spark.sql.shuffle.partitions", "50").getOrCreate(). Access spark.version.',
          solution: `from pyspark.sql import SparkSession

spark = SparkSession.builder \\
    .appName("InventoryJob") \\
    .config("spark.sql.shuffle.partitions", "50") \\
    .getOrCreate()

print(spark.version)`,
        },
        {
          id: 'pyspark-architecture',
          title: 'Spark Architecture',
          difficulty: 'Beginner',
          explanation: 'Spark uses a driver/executor model. The Driver builds the execution plan. Executors on worker nodes run parallel tasks on data partitions. The Cluster Manager (YARN, Kubernetes, standalone) allocates VMs.',
          why: 'Understanding the architecture explains why Spark can process petabytes — data is split into partitions and each executor processes its own partitions in parallel.',
          syntax: `Driver process:
  - Runs SparkSession / SparkContext
  - Builds DAG of transformations
  - Splits into stages and tasks
  - Sends tasks to executors

Executor processes (one per worker node):
  - Execute assigned tasks on partitions
  - Store cached data in memory
  - Report results back to driver`,
          example: `# Inspect parallelism settings
print("Default parallelism:", spark.sparkContext.defaultParallelism)
print("Shuffle partitions: ", spark.conf.get("spark.sql.shuffle.partitions"))

# Understanding partition count
df = spark.read.parquet("s3://bucket/orders/")
print("Number of partitions:", df.rdd.getNumPartitions())
# Each partition = one task on one executor core`,
          expectedOutput: `Default parallelism: 8\nShuffle partitions:  200\nNumber of partitions: 24`,
          interview: {
            question: 'What is the difference between a Spark stage and a task?',
            answer: 'A stage is a set of transformations that run without a shuffle. A task is the smallest unit of work — one task processes one partition. A stage with 200 partitions creates 200 parallel tasks.',
          },
          practice: 'Explain the difference between a transformation and an action in Spark. Give one example of each and describe when execution actually happens.',
          hint: 'Transformations (filter, select, groupBy) are lazy — they build a plan. Actions (count, show, write) trigger actual computation.',
          solution: `# Transformation — lazy, no data movement yet
filtered = df.filter(col("amount") > 100)   # builds plan only
grouped  = filtered.groupBy("status").count()  # still no execution

# Action — triggers the full plan to execute
grouped.show()    # Spark NOW processes all the data
total = df.count()  # another action = another execution`,
        },
        {
          id: 'pyspark-lazy-eval',
          title: 'Lazy Evaluation & DAG',
          difficulty: 'Intermediate',
          explanation: 'Spark builds a Directed Acyclic Graph (DAG) of transformations but executes nothing until an action is called. The Catalyst optimizer rewrites the DAG for efficiency — pushing filters earlier, pruning columns, reordering joins.',
          why: 'Lazy evaluation lets Spark see the full query plan and optimise it before running. Catalyst can push a filter before a join to reduce the data shuffled, saving hours on large datasets.',
          syntax: `# Nothing runs yet — Spark builds a logical plan
df2 = df.filter(col("amount") > 100)
df3 = df2.select("order_id", "amount")
df4 = df3.withColumn("tax", col("amount") * 0.1)

# These lines trigger execution:
df4.show()         # action
df4.count()        # action
df4.write.parquet("s3://output/")  # action

# Inspect the optimised physical plan
df4.explain(True)`,
          example: `from pyspark.sql.functions import col

orders  = spark.read.parquet("s3://bucket/orders/")      # lazy — no read
filtered = orders.filter(col("status") == "shipped")      # lazy
totals   = filtered.groupBy("customer_id").sum("amount")  # lazy

# show() triggers the entire pipeline
totals.show(5)

# Inspect plan — Spark pushed the filter before the shuffle
totals.explain()`,
          expectedOutput: `+----------+-----------+\n|customer_id|sum(amount)|\n+----------+-----------+\n|         1|      540.0|\n|         4|      320.0|\n+----------+-----------+\n\n== Physical Plan ==\nHashAggregate(keys=[customer_id#0L], functions=[sum(amount#1)])\n+- Exchange hashpartitioning(customer_id#0L, 200)\n   +- Filter (status#2 = shipped)\n      +- FileScan parquet [order_id,amount,status,customer_id]`,
          interview: {
            question: 'Why does lazy evaluation improve performance?',
            answer: 'Spark can optimise the combined query plan before executing. For example, it applies predicate pushdown (filtering before joins reduces shuffle volume) and column pruning (reads only needed columns from Parquet).',
          },
          practice: 'Write a PySpark pipeline: read a Parquet file, filter where amount > 500, select 3 columns, then call explain() to show the plan. Describe why nothing executes until you call show().',
          hint: 'Chain .filter().select() — both are transformations. Call .explain() to see the plan. Only .show() or .count() triggers execution.',
          solution: `from pyspark.sql.functions import col

df = spark.read.parquet("s3://bucket/orders/")

pipeline = df \\
    .filter(col("amount") > 500) \\
    .select("order_id", "customer_id", "amount")

pipeline.explain()   # shows plan, no data read yet
pipeline.show(5)     # NOW Spark reads and processes the data`,
        },
      ],
    },
    {
      title: 'DataFrames',
      subtopics: [
        {
          id: 'pyspark-read',
          title: 'Reading Data',
          difficulty: 'Beginner',
          explanation: 'spark.read loads data from CSV, Parquet, JSON, Delta, or JDBC into a DataFrame. Options control headers, schema inference, delimiter, and how corrupt records are handled.',
          why: 'Every Spark job starts by reading from cloud storage. The right reader options prevent schema errors, silent data loss, and expensive double-scans (inferSchema).',
          syntax: `# CSV
df = spark.read.csv("path.csv", header=True, inferSchema=True)

# Parquet (preferred — columnar and compressed)
df = spark.read.parquet("s3://bucket/orders/")

# Delta Lake
df = spark.read.format("delta").load("dbfs:/mnt/silver/orders")

# JSON
df = spark.read.json("s3://bucket/events.json")

# JDBC (database)
df = spark.read.jdbc(url=jdbc_url, table="orders", properties=props)`,
          example: `from pyspark.sql.types import StructType, StructField, StringType, DoubleType, LongType

# Explicit schema is faster and safer than inferSchema
schema = StructType([
    StructField("order_id",    LongType(),   True),
    StructField("customer_id", LongType(),   True),
    StructField("amount",      DoubleType(), True),
    StructField("status",      StringType(), True),
])

df = spark.read.csv(
    "s3://bucket/raw/orders/2024-01-15.csv",
    header=True,
    schema=schema
)

print(f"Rows: {df.count()}")
df.printSchema()`,
          expectedOutput: `Rows: 4200\nroot\n |-- order_id: long (nullable = true)\n |-- customer_id: long (nullable = true)\n |-- amount: double (nullable = true)\n |-- status: string (nullable = true)`,
          interview: {
            question: 'Why provide an explicit schema instead of using inferSchema for CSV files?',
            answer: 'inferSchema reads the entire file twice — once to detect types, once to load — which is slow on large files. It also guesses types incorrectly on edge cases. Explicit schemas are always faster and more reliable.',
          },
          practice: 'Write PySpark code to read a JSON file at "s3://data/customers.json". Print the row count and call printSchema().',
          hint: 'Use spark.read.json("path"). Follow with .count() for rows and .printSchema() for schema.',
          solution: `df = spark.read.json("s3://data/customers.json")
print(f"Rows: {df.count()}")
df.printSchema()`,
        },
        {
          id: 'pyspark-schema',
          title: 'Schema & Type Casting',
          difficulty: 'Intermediate',
          explanation: 'DataFrames have a typed schema. Use StructType to define it explicitly, cast() to convert types, and printSchema() or dtypes to inspect. Wrong types cause NULL values silently.',
          why: 'CSV files arrive with all columns as strings. Casting to the correct types (double, timestamp, long) is required before any calculation or aggregation.',
          syntax: `from pyspark.sql.functions import col, to_timestamp

# Cast individual columns
df = df.withColumn("amount",     col("amount").cast("double"))
df = df.withColumn("order_id",   col("order_id").cast("long"))
df = df.withColumn("created_at", to_timestamp("created_at", "yyyy-MM-dd HH:mm:ss"))

# Check schema
df.printSchema()
print(df.dtypes)`,
          example: `from pyspark.sql.functions import col, to_timestamp

raw = spark.read.csv("orders.csv", header=True)

clean = raw \\
    .withColumn("order_id",   col("order_id").cast("long")) \\
    .withColumn("amount",     col("amount").cast("double")) \\
    .withColumn("created_at", to_timestamp("created_at", "yyyy-MM-dd"))

# Check for cast failures (nulls introduced by bad data)
bad_amounts = clean.filter(col("amount").isNull()).count()
print(f"Bad amount rows: {bad_amounts}")
clean.printSchema()`,
          expectedOutput: `Bad amount rows: 3\nroot\n |-- order_id: long (nullable = true)\n |-- amount: double (nullable = true)\n |-- created_at: timestamp (nullable = true)`,
          interview: {
            question: 'What happens if you cast a non-numeric string to DoubleType?',
            answer: 'Spark returns NULL for that row silently — the job does not fail. Always count nulls after casting: df.filter(col("amount").isNull()).count() to detect bad data.',
          },
          practice: 'Given a CSV DataFrame with string columns "price" and "qty", cast price to DoubleType and qty to IntegerType. Count how many rows have null price after casting.',
          hint: 'Use .withColumn("price", col("price").cast("double")).withColumn("qty", col("qty").cast("integer")). Then .filter(col("price").isNull()).count().',
          solution: `from pyspark.sql.functions import col

clean = df \\
    .withColumn("price", col("price").cast("double")) \\
    .withColumn("qty",   col("qty").cast("integer"))

null_prices = clean.filter(col("price").isNull()).count()
print(f"Null prices: {null_prices}")
clean.printSchema()`,
        },
      ],
    },
    {
      title: 'Transformations',
      subtopics: [
        {
          id: 'pyspark-select-filter',
          title: 'select & filter',
          difficulty: 'Intermediate',
          explanation: 'select() picks and renames columns. filter() (alias: where()) keeps only matching rows. Both are lazy transformations — they build the plan but do not execute.',
          why: 'Reducing columns with select() cuts shuffle volume and reduces memory usage. Filtering early (predicate pushdown) means less data flows through the pipeline.',
          syntax: `from pyspark.sql.functions import col, upper, trim

df.select("order_id", "amount")               # pick columns by name
df.select(col("amount").alias("revenue"))     # rename
df.filter(col("amount") > 100)                # comparison filter
df.filter(col("status").isin("shipped", "delivered"))  # list filter
df.where(col("customer_id").isNotNull())      # where = filter alias`,
          example: `from pyspark.sql.functions import col

shipped_high = df \\
    .select("order_id", "customer_id", "amount", "status") \\
    .filter(col("status") == "shipped") \\
    .filter(col("amount") > 100)

shipped_high.show(3)`,
          expectedOutput: `+--------+-----------+------+-------+\n|order_id|customer_id|amount| status|\n+--------+-----------+------+-------+\n|     101|          1| 150.0|shipped|\n|     103|          1| 230.0|shipped|\n|     105|          4| 320.0|shipped|\n+--------+-----------+------+-------+`,
          interview: {
            question: 'What is the difference between filter() and where() in PySpark?',
            answer: 'They are identical — where() is an alias for filter(). Use whichever reads more naturally in context.',
          },
          practice: 'Filter a DataFrame to keep rows where status is "active" and amount is between 50 and 500. Select only id, name, and amount columns.',
          hint: 'Chain .filter(col("status") == "active").filter(col("amount").between(50, 500)).select("id", "name", "amount").',
          solution: `from pyspark.sql.functions import col

result = df \\
    .filter(col("status") == "active") \\
    .filter(col("amount").between(50, 500)) \\
    .select("id", "name", "amount")

result.show()`,
        },
        {
          id: 'pyspark-withcolumn',
          title: 'withColumn — Derived Columns',
          difficulty: 'Intermediate',
          explanation: 'withColumn() adds a new column or overwrites an existing one. Combine it with pyspark.sql.functions for math, string ops, conditionals, and date functions.',
          why: 'Most ETL jobs add computed columns: taxes, segments, date parts, normalised values. withColumn makes these transformations readable and composable.',
          syntax: `from pyspark.sql.functions import col, when, upper, lit, current_timestamp, round as F_round

df.withColumn("tax",       col("amount") * 0.1)
df.withColumn("upper_name", upper(col("name")))
df.withColumn("segment",   when(col("amount") > 1000, "VIP").otherwise("standard"))
df.withColumn("loaded_at", current_timestamp())
df.withColumn("source",    lit("orders_api"))`,
          example: `from pyspark.sql.functions import col, when, round as F_round, current_date, datediff

enriched = df \\
    .withColumn("tax",     F_round(col("amount") * 0.08, 2)) \\
    .withColumn("total",   col("amount") + col("tax")) \\
    .withColumn("segment", when(col("amount") > 1000, "VIP")
                           .when(col("amount") > 100, "Standard")
                           .otherwise("Small")) \\
    .withColumn("days_old", datediff(current_date(), col("order_date")))

enriched.select("order_id","amount","tax","total","segment","days_old").show(3)`,
          expectedOutput: `+--------+------+----+------+--------+--------+\n|order_id|amount| tax| total| segment|days_old|\n+--------+------+----+------+--------+--------+\n|     101| 150.0|12.0| 162.0|Standard|      15|\n|     102|  89.0| 7.1|  96.1|   Small|      15|\n|     103|1230.0|98.4|1328.4|     VIP|      15|\n+--------+------+----+------+--------+--------+`,
          interview: {
            question: 'How do you overwrite an existing column with withColumn?',
            answer: 'Use the same column name as the first argument. df.withColumn("amount", col("amount").cast("double")) overwrites the existing amount column with a cast version.',
          },
          practice: 'Add a "price_category" column: "premium" if price > 200, "mid-range" if > 50, else "budget". Also add "profit_margin" as (price - cost) / price * 100 rounded to 1 decimal.',
          hint: 'Use when/otherwise for price_category. Use col() arithmetic and F_round(..., 1) for profit_margin.',
          solution: `from pyspark.sql.functions import col, when, round as F_round

enriched = df \\
    .withColumn("price_category",
        when(col("price") > 200, "premium")
        .when(col("price") > 50, "mid-range")
        .otherwise("budget")) \\
    .withColumn("profit_margin",
        F_round((col("price") - col("cost")) / col("price") * 100, 1))

enriched.show()`,
        },
        {
          id: 'pyspark-agg',
          title: 'GroupBy & Aggregations',
          difficulty: 'Intermediate',
          explanation: 'groupBy() groups rows by one or more columns. agg() applies aggregate functions: sum, count, avg, min, max, countDistinct. Import these from pyspark.sql.functions.',
          why: 'Aggregations power every business report — daily revenue by region, order count per customer, average basket size. Spark runs these across distributed partitions then merges results.',
          syntax: `from pyspark.sql.functions import sum, count, avg, max, min, countDistinct

df.groupBy("status").count()

df.groupBy("customer_id").agg(
    sum("amount").alias("total_spent"),
    count("order_id").alias("order_count"),
    avg("amount").alias("avg_order"),
    max("amount").alias("max_order")
)`,
          example: `from pyspark.sql.functions import sum, count, avg, max, round as F_round, col

daily = df \\
    .groupBy("order_date", "status") \\
    .agg(
        count("order_id").alias("orders"),
        F_round(sum("amount"), 2).alias("revenue"),
        F_round(avg("amount"), 2).alias("avg_order"),
        max("amount").alias("max_order")
    ) \\
    .orderBy("order_date", "status")

daily.show(4)`,
          expectedOutput: `+----------+---------+------+---------+---------+---------+\n|order_date|   status|orders|  revenue|avg_order|max_order|\n+----------+---------+------+---------+---------+---------+\n|2024-01-15|cancelled|    50|  4500.00|    90.00|   450.00|\n|2024-01-15|  pending|   120| 15600.00|   130.00|   980.00|\n|2024-01-15|  shipped|   280| 56000.00|   200.00|  2400.00|\n|2024-01-15|delivered|   150| 28500.00|   190.00|  1800.00|\n+----------+---------+------+---------+---------+---------+`,
          interview: {
            question: 'What causes a shuffle in a groupBy aggregation, and how do you tune it?',
            answer: 'groupBy triggers a hash shuffle: all rows with the same key must land on the same partition. The default spark.sql.shuffle.partitions=200 creates 200 output partitions regardless of data size. For a 10 GB dataset: 200 partitions = 50 MB each (good). For a 1 TB dataset: 200 partitions = 5 GB each (too large, causes spill). Rule: target 100–200 MB per partition. For 1 TB: set shuffle.partitions to ~5000. Adaptive Query Execution (AQE) in Spark 3+ can tune this automatically — enable with spark.sql.adaptive.enabled=true.',
          },
          commonMistakes: [
            'Leaving spark.sql.shuffle.partitions at the default 200 for large datasets — this causes memory spill when each partition exceeds available executor memory.',
            'Calling groupBy on a column with extreme skew (e.g., most rows have status="unknown") — one partition gets 90% of the data. Use salting or AQE skew join handling to redistribute.',
            'Chaining multiple groupBy operations — each triggers a separate shuffle. Combine aggregations into a single groupBy.agg() call when possible.',
          ],
          productionContext: 'In Databricks, Adaptive Query Execution is on by default and automatically coalesces over-partitioned shuffle output. For jobs where you know the data volume, set spark.sql.shuffle.partitions explicitly in the notebook\'s first cell to avoid the overhead of AQE measuring partition sizes at runtime.',
          performanceTip: 'For very common groupBy patterns (daily aggregations run hundreds of times), pre-sort/pre-bucket the input table by the group key using ZORDER or bucketing. A bucketed table eliminates the groupBy shuffle entirely — Spark recognizes the data is already partitioned by the key.',
          practice: 'Group an orders DataFrame by product_id and compute total quantity sold, total revenue, and average revenue per order. Sort by total revenue descending.',
          hint: 'Use .groupBy("product_id").agg(sum("qty").alias(...), sum("revenue").alias(...), avg("revenue").alias(...)).orderBy(col("total_revenue").desc()).',
          solution: `from pyspark.sql.functions import sum, avg, col

result = df \\
    .groupBy("product_id") \\
    .agg(
        sum("qty").alias("total_qty"),
        sum("revenue").alias("total_revenue"),
        avg("revenue").alias("avg_revenue")
    ) \\
    .orderBy(col("total_revenue").desc())

result.show()`,
        },
      ],
    },
    {
      title: 'Joins',
      subtopics: [
        {
          id: 'pyspark-joins',
          title: 'Join Types',
          difficulty: 'Intermediate',
          explanation: 'PySpark supports inner, left, right, full (outer), cross, left_semi, and left_anti joins. The join type is the third argument to .join().',
          why: 'Joins combine tables. Choosing the wrong type silently drops rows (inner loses unmatched) or explodes rows (cross join). Understanding each type prevents subtle data quality issues.',
          syntax: `# Inner — matching rows only
result = orders.join(customers, "customer_id", "inner")

# Left — all orders, NULL for missing customer
result = orders.join(customers, "customer_id", "left")

# Anti — orders with NO matching customer
orphans = orders.join(customers, "customer_id", "left_anti")

# Different column names
result = orders.join(customers, orders.cust_id == customers.id, "inner")`,
          example: `from pyspark.sql.functions import broadcast, col

# Enrich orders with customer info
enriched = orders.join(
    customers.select("customer_id", "name", "city", "tier"),
    on="customer_id",
    how="left"
)

# Data quality: find orders with no matching customer
orphaned = orders.join(
    customers.select("customer_id"),
    on="customer_id",
    how="left_anti"
)
print(f"Orphaned orders: {orphaned.count()}")

enriched.show(3)`,
          expectedOutput: `Orphaned orders: 2\n\n+--------+-----------+-----------+-----+---------+\n|order_id|customer_id|       name| city|     tier|\n+--------+-----------+-----------+-----+---------+\n|     101|          1|Alice Smith|  NYC|  premium|\n|     102|          2|  Bob Jones|   LA| standard|\n|     103|          1|Alice Smith|  NYC|  premium|\n+--------+-----------+-----------+-----+---------+`,
          interview: {
            question: 'What is a broadcast join and when should you use it?',
            answer: 'A broadcast join copies the small DataFrame to every executor, eliminating the shuffle of the large table. Use it when one table fits in executor memory (< 10 MB by default, configurable via spark.sql.autoBroadcastJoinThreshold). Spark auto-broadcasts tables below the threshold, but you can force it with broadcast() hint. In production pipelines, broadcasting a dimension table (customers ~5 MB) when joining with a 500 GB fact table (orders) reduces job time from 20 minutes to 2 minutes.',
          },
          commonMistakes: [
            'Using inner join when the fact table has orphaned rows — you silently drop orders with no matching customer. Always check with left_anti before switching to inner.',
            'Joining on columns with different names without an explicit condition — Spark will error or produce a cartesian product; always specify the join condition explicitly.',
            'Forgetting to deduplicate the small table before a broadcast join — if the dimension has duplicate keys, every matching fact row gets multiplied.',
          ],
          productionContext: 'In Databricks Silver notebooks, every fact-to-dimension join uses broadcast() for dimension tables under 10 MB. Tables like dim_product (10K rows) or dim_region (50 rows) are always broadcast. Without it, a 1B-row orders join shuffles 400 GB across the cluster — the biggest single cause of slow pipeline jobs.',
          performanceTip: 'Check whether Spark auto-broadcast is working with .explain() — look for "BroadcastHashJoin" in the plan. If you see "SortMergeJoin" on a small table, increase spark.sql.autoBroadcastJoinThreshold to "50mb" or add the broadcast() hint explicitly.',
          practice: 'Join orders with products on product_id using a left join to keep all orders. Then use left_anti to find orders with no matching product.',
          hint: 'Left join: orders.join(products, "product_id", "left"). Anti join: orders.join(products.select("product_id"), "product_id", "left_anti").',
          solution: `from pyspark.sql.functions import broadcast

enriched = orders.join(
    broadcast(products.select("product_id", "category")),
    on="product_id",
    how="left"
)

missing_product = orders.join(
    products.select("product_id"),
    on="product_id",
    how="left_anti"
)
print(f"Orders missing product: {missing_product.count()}")
enriched.show()`,
        },
      ],
    },
    {
      title: 'Window Functions',
      subtopics: [
        {
          id: 'pyspark-window',
          title: 'Window Functions',
          difficulty: 'Advanced',
          explanation: 'Window functions compute values over a window of related rows without collapsing them. Define the window with Window.partitionBy() and orderBy(). Apply functions: row_number, rank, dense_rank, lead, lag, sum, avg.',
          why: 'Window functions power analytics: rankings, running totals, month-over-month comparisons, finding first/last events per user — all without self-joins or subqueries.',
          syntax: `from pyspark.sql.window import Window
from pyspark.sql.functions import row_number, rank, dense_rank, lag, lead, sum, avg

# Per-customer window ordered by date
w = Window.partitionBy("customer_id").orderBy("order_date")

df.withColumn("order_num",     row_number().over(w))
df.withColumn("prev_amount",   lag("amount", 1).over(w))
df.withColumn("next_amount",   lead("amount", 1).over(w))
df.withColumn("running_total", sum("amount").over(w))`,
          example: `from pyspark.sql.window import Window
from pyspark.sql.functions import row_number, sum, lag, dense_rank, col, round as F_round

w      = Window.partitionBy("customer_id").orderBy("order_date")
w_all  = Window.partitionBy("customer_id")
w_rank = Window.orderBy(col("total_spent").desc())

result = df \\
    .withColumn("order_num",   row_number().over(w)) \\
    .withColumn("running_rev", F_round(sum("amount").over(w), 2)) \\
    .withColumn("prev_amount", lag("amount", 1).over(w)) \\
    .withColumn("total_spent", sum("amount").over(w_all))

result.select("customer_id","order_date","amount","order_num","running_rev","prev_amount").show(5)`,
          expectedOutput: `+-----------+----------+------+---------+-----------+-----------+\n|customer_id|order_date|amount|order_num|running_rev|prev_amount|\n+-----------+----------+------+---------+-----------+-----------+\n|          1|2024-01-01| 150.0|        1|      150.0|       null|\n|          1|2024-01-05| 230.0|        2|      380.0|      150.0|\n|          1|2024-01-12| 310.0|        3|      690.0|      230.0|\n|          2|2024-01-02|  89.0|        1|       89.0|       null|\n|          2|2024-01-08| 420.0|        2|      509.0|       89.0|\n+-----------+----------+------+---------+-----------+-----------+`,
          interview: {
            question: 'How does RANK() differ from DENSE_RANK() and ROW_NUMBER()?',
            answer: 'ROW_NUMBER: unique sequential number per row (no ties — arbitrary tiebreak). RANK: ties get the same rank with a gap after (1,1,3) — good for "3rd place" semantics. DENSE_RANK: ties get the same rank with no gap (1,1,2) — good for "top 3 tiers" without skipping a tier. In production, deduplication always uses ROW_NUMBER (you need exactly one row per key). Ranking reports use DENSE_RANK to avoid confusing gaps in tier labels.',
          },
          commonMistakes: [
            'Defining the window without orderBy — row_number and rank produce nondeterministic results without a sort order.',
            'Using a windowless frame (Window.partitionBy(...) with no rowsBetween) for running totals — the default frame is RANGE UNBOUNDED PRECEDING, which includes all ties on the same ORDER BY value.',
            'Computing the same window spec multiple times in different withColumn calls — define it once as a variable and reuse it.',
          ],
          productionContext: 'Window functions in PySpark are the backbone of Gold-layer transformation: ROW_NUMBER for deduplication in Silver, DENSE_RANK for customer tier assignment in Gold, LAG for MoM revenue deltas in reporting tables. All three appear in nearly every Databricks production notebook.',
          performanceTip: 'Each distinct Window spec (different PARTITION BY or ORDER BY) triggers a separate shuffle. Combine all window calculations that share the same spec into one withColumn chain rather than defining multiple windows. For very large tables, use repartition(n, "partition_key") before the window to pre-distribute data and reduce shuffle size.',
          practice: 'Add a "region_rank" column that ranks customers by total spend within each region (highest = rank 1). Use dense_rank.',
          hint: 'Define Window.partitionBy("region").orderBy(col("total_spend").desc()). Apply dense_rank().over(window).',
          solution: `from pyspark.sql.window import Window
from pyspark.sql.functions import dense_rank, col

w = Window.partitionBy("region").orderBy(col("total_spend").desc())
result = df.withColumn("region_rank", dense_rank().over(w))
result.show()`,
        },
      ],
    },
    {
      title: 'Partitioning & Caching',
      subtopics: [
        {
          id: 'pyspark-partitioning',
          title: 'Partitioning Data',
          difficulty: 'Intermediate',
          explanation: 'partitionBy() on a write divides output into subdirectories per column value (e.g. date=2024-01-15/). repartition() shuffles in memory; coalesce() merges partitions without a shuffle.',
          why: 'Partition pruning is the biggest single query speedup available — reading one daily partition instead of a full year table. repartition ensures even distribution; coalesce prevents small file problems.',
          syntax: `# Write partitioned by date
df.write.partitionBy("order_date").parquet("s3://bucket/silver/orders/")

# Reduce partitions (no shuffle — merge only)
df.coalesce(4).write.parquet("s3://output/")

# Repartition for even distribution before a join
df.repartition(200, "customer_id")

# Read a specific partition only
spark.read.parquet("s3://bucket/silver/orders/order_date=2024-01-15/")`,
          example: `# Write partitioned data
clean_df \\
    .repartition("order_date") \\
    .write \\
    .mode("overwrite") \\
    .partitionBy("order_date") \\
    .parquet("s3://datalake/silver/orders/")

# Partition pruning — Spark only reads one directory
today = spark.read.parquet("s3://datalake/silver/orders/") \\
    .filter(col("order_date") == "2024-01-15")

print(f"Today's orders: {today.count()}")
# Files scanned: only order_date=2024-01-15/ directory`,
          expectedOutput: `Today's orders: 4200\n# Files scanned: order_date=2024-01-15/ only (365x less I/O)`,
          interview: {
            question: 'What is the difference between repartition() and coalesce()?',
            answer: 'repartition(n) triggers a full shuffle and produces evenly distributed partitions — use it before a join or aggregation on a skewed key. coalesce(n) merges partitions without shuffling — it can only decrease the count and may produce uneven partitions, but it\'s much faster. Rule of thumb: use repartition() before heavy transformations to balance work; use coalesce() just before writing to reduce output file count without paying shuffle cost.',
          },
          commonMistakes: [
            'Using repartition() just before write — this shuffles the entire dataset one extra time with no query benefit. Use coalesce() instead to reduce file count cheaply.',
            'Writing without controlling partition count — a 200-partition default produces 200 small Parquet files per date partition, creating a small files problem that slows future reads.',
            'Partitioning by a high-cardinality column like customer_id — this creates millions of tiny directories, one per customer, making metadata operations extremely slow.',
          ],
          productionContext: 'Small files are one of the top causes of slow pipelines in Azure Data Lake and ADLS. In production, after every partitioned write, teams run OPTIMIZE on Delta tables to compact small files into 128MB–1GB Parquet files. AutoOptimize in Databricks can do this automatically on write.',
          performanceTip: 'Target 128 MB to 1 GB per output file. Formula: estimate total_bytes / 128MB = target partition count. Use coalesce(target) before write. For Delta tables, skip manual coalesce and run OPTIMIZE with ZORDER instead — it compacts and clusters in one operation.',
          practice: 'Write a DataFrame to S3 partitioned by year and month. Before writing, use coalesce to produce at most 4 files per partition to avoid many small files.',
          hint: 'You can use .coalesce(4) before .write, or set .option("maxRecordsPerFile", N). Use .partitionBy("year", "month") on the writer.',
          solution: `df.coalesce(4) \\
    .write \\
    .mode("overwrite") \\
    .partitionBy("year", "month") \\
    .parquet("s3://bucket/partitioned/")`,
        },
        {
          id: 'pyspark-caching',
          title: 'Caching & Persistence',
          difficulty: 'Intermediate',
          explanation: 'cache() stores a DataFrame in memory (and disk on spill) so subsequent actions reuse it without recomputing. persist() lets you choose the StorageLevel. Always unpersist() when done.',
          why: 'Without caching, running three actions on the same DataFrame re-reads and re-transforms all the data three times. Caching trades memory for speed — read once, compute many times.',
          syntax: `from pyspark import StorageLevel

df.cache()                                    # MEMORY_AND_DISK (default)
df.persist(StorageLevel.MEMORY_ONLY)          # fails if not enough RAM
df.persist(StorageLevel.MEMORY_AND_DISK_SER)  # serialised (less RAM)

df.count()    # first action fills the cache
df.unpersist()  # always release when done`,
          example: `# Without cache: S3 is read 3 times
orders = spark.read.parquet("s3://bucket/orders/")
shipped_count  = orders.filter(col("status") == "shipped").count()   # read #1
pending_count  = orders.filter(col("status") == "pending").count()   # read #2
orders.write.parquet("s3://output/")                                 # read #3

# With cache: S3 is read once
orders = spark.read.parquet("s3://bucket/orders/").cache()
orders.count()  # fill cache (first action is always a read)

shipped_count  = orders.filter(col("status") == "shipped").count()   # from cache
pending_count  = orders.filter(col("status") == "pending").count()   # from cache
orders.write.parquet("s3://output/")                                 # from cache
orders.unpersist()`,
          expectedOutput: `# Without cache: 3x S3 read cost\n# With cache:    1x S3 read + 2x faster subsequent actions`,
          interview: {
            question: 'When should you NOT use cache()?',
            answer: 'When the DataFrame is only used once — caching wastes memory and time to fill. Also avoid caching DataFrames that exceed executor memory, as disk spilling may be slower than re-reading from storage.',
          },
          practice: 'Write a PySpark job that reads a Parquet file, caches it, counts shipped and cancelled orders separately, then unpersists the cache.',
          hint: 'Call .cache() then trigger cache fill with .count(). Run two separate .filter().count() calls. End with .unpersist().',
          solution: `df = spark.read.parquet("s3://bucket/sales/").cache()
df.count()  # fill cache

shipped   = df.filter(col("status") == "shipped").count()
cancelled = df.filter(col("status") == "cancelled").count()
print(f"Shipped: {shipped}, Cancelled: {cancelled}")

df.unpersist()`,
        },
      ],
    },
    {
      title: 'Delta Lake',
      subtopics: [
        {
          id: 'pyspark-delta-basics',
          title: 'Delta Lake Basics',
          difficulty: 'Intermediate',
          explanation: 'Delta Lake adds ACID transactions, schema enforcement, and time travel to Parquet files on cloud storage. Write with .format("delta") and read the same way. A _delta_log folder stores all change metadata.',
          why: 'Plain Parquet has no update/delete support and no transactional safety. Delta solves this: you can MERGE, UPDATE, DELETE rows atomically, and roll back if a bad load happens.',
          syntax: `# Write as Delta
df.write.format("delta").mode("overwrite").save("dbfs:/mnt/silver/orders")
df.write.format("delta").mode("append").save("dbfs:/mnt/silver/orders")

# Read Delta
df = spark.read.format("delta").load("dbfs:/mnt/silver/orders")

# Time travel — read a past version
df_v1 = spark.read.format("delta") \\
    .option("versionAsOf", 1) \\
    .load("dbfs:/mnt/silver/orders")`,
          example: `from delta.tables import DeltaTable

df.write.format("delta").mode("overwrite").save("dbfs:/mnt/silver/orders")

# View history
dt = DeltaTable.forPath(spark, "dbfs:/mnt/silver/orders")
dt.history(3).select("version","timestamp","operation").show()

# OPTIMIZE and VACUUM
spark.sql("OPTIMIZE delta.\`dbfs:/mnt/silver/orders\` ZORDER BY (customer_id)")
spark.sql("VACUUM delta.\`dbfs:/mnt/silver/orders\` RETAIN 168 HOURS")`,
          expectedOutput: `+-------+-------------------+---------+\n|version|          timestamp|operation|\n+-------+-------------------+---------+\n|      2|2024-01-16 06:02:00|    WRITE|\n|      1|2024-01-15 06:01:00|    WRITE|\n|      0|2024-01-14 06:00:00|    WRITE|\n+-------+-------------------+---------+`,
          interview: {
            question: 'What does time travel in Delta Lake mean?',
            answer: 'Every write creates a new version in the _delta_log. You can query any past version with .option("versionAsOf", N) or .option("timestampAsOf", "2024-01-15"). Useful for auditing, debugging, and rollback.',
          },
          practice: 'Write a DataFrame to a Delta table at "dbfs:/mnt/gold/products". Then read it back, print the row count, and show the last 3 history entries.',
          hint: 'Write with .format("delta").mode("overwrite"). Use DeltaTable.forPath() to get history, then .history(3).show().',
          solution: `from delta.tables import DeltaTable

df.write.format("delta").mode("overwrite").save("dbfs:/mnt/gold/products")

products = spark.read.format("delta").load("dbfs:/mnt/gold/products")
print(f"Rows: {products.count()}")

dt = DeltaTable.forPath(spark, "dbfs:/mnt/gold/products")
dt.history(3).select("version","timestamp","operation").show()`,
        },
        {
          id: 'pyspark-merge',
          title: 'Delta MERGE (Upsert)',
          difficulty: 'Advanced',
          explanation: 'DeltaTable.merge() performs an atomic upsert: update rows that match on a key, insert rows that are new, optionally delete rows that are gone. It is the core primitive for incremental pipelines.',
          why: 'Daily pipelines receive changed and new records. Without MERGE you overwrite everything (expensive) or run separate UPDATE/INSERT (not atomic). MERGE is idempotent and handles both cases in one operation.',
          syntax: `from delta.tables import DeltaTable

target = DeltaTable.forPath(spark, "path/to/delta/table")

target.alias("t") \\
    .merge(
        source=updates_df.alias("s"),
        condition="t.id = s.id"
    ) \\
    .whenMatchedUpdateAll() \\
    .whenNotMatchedInsertAll() \\
    .execute()`,
          example: `from delta.tables import DeltaTable

customers = DeltaTable.forPath(spark, "dbfs:/mnt/silver/customers")
updates   = spark.read.parquet("s3://raw/customers/2024-01-16/")

customers.alias("t") \\
    .merge(
        updates.alias("s"),
        "t.customer_id = s.customer_id"
    ) \\
    .whenMatchedUpdate(set={
        "name":       "s.name",
        "email":      "s.email",
        "updated_at": "s.updated_at",
    }) \\
    .whenNotMatchedInsert(values={
        "customer_id": "s.customer_id",
        "name":        "s.name",
        "email":       "s.email",
        "updated_at":  "s.updated_at",
        "created_at":  "s.created_at",
    }) \\
    .execute()`,
          expectedOutput: `MERGE complete.\nRows matched (updated): 1240\nRows inserted (new):     312`,
          interview: {
            question: 'Why is MERGE preferred over delete + insert for upserts?',
            answer: 'MERGE is atomic — it either fully succeeds or the table remains unchanged. Delete + insert is two separate operations: if the job fails between them, the table has no data (deleted) but no new data (insert didn\'t run). MERGE is also idempotent — you can re-run the same MERGE safely on pipeline retry without creating duplicates. In a streaming context, MERGE with a deduplication CTE on the source gives exactly-once semantics even when the stream delivers duplicate messages.',
          },
          commonMistakes: [
            'Using whenMatchedUpdateAll() when the source has extra columns not in the target — this fails with a schema mismatch. Use whenMatchedUpdate(set={...}) with explicit column mapping.',
            'Not filtering the source before MERGE — if your source contains duplicates on the merge key, MERGE throws "Multiple source rows matched the same target row." Deduplicate source first.',
            'Running MERGE without OPTIMIZE afterward — each MERGE appends new data files; over time the table accumulates many small files and reads slow down.',
          ],
          productionContext: 'Delta MERGE is the standard incremental load pattern in Databricks pipelines. A typical Silver notebook: (1) read new records from Bronze since last watermark, (2) deduplicate source with ROW_NUMBER, (3) MERGE into Silver. This runs every 15 minutes for near-real-time Silver tables.',
          performanceTip: 'MERGE performance depends on how well Spark can skip target files. Add a date filter to the MERGE condition: "t.order_date = s.order_date AND t.id = s.id" — this lets Delta file skipping eliminate most target files. Without the date filter, MERGE scans the entire target table for every run.',
          practice: 'Write a Delta MERGE that upserts product records: update name and price when product_id matches, insert when it does not exist.',
          hint: 'Use DeltaTable.forPath(). Chain .merge(..., "t.product_id = s.product_id").whenMatchedUpdate(set={...}).whenNotMatchedInsert(values={...}).execute().',
          solution: `from delta.tables import DeltaTable

products = DeltaTable.forPath(spark, "dbfs:/mnt/silver/products")

products.alias("t").merge(
    new_df.alias("s"),
    "t.product_id = s.product_id"
).whenMatchedUpdate(set={
    "name":  "s.name",
    "price": "s.price",
}).whenNotMatchedInsert(values={
    "product_id": "s.product_id",
    "name":       "s.name",
    "price":      "s.price",
}).execute()`,
        },
      ],
    },
    {
      title: 'SCD Type 2 in Spark',
      subtopics: [
        {
          id: 'pyspark-scd2',
          title: 'SCD Type 2 Implementation',
          difficulty: 'Advanced',
          explanation: 'SCD Type 2 (Slowly Changing Dimension Type 2) tracks historical changes by inserting a new row for each change and expiring the old row. The current row has is_current=true and end_date=NULL.',
          why: 'BI teams need to know what a customer\'s tier or address was at the time of a transaction. SCD2 preserves that history. Without it, retroactive changes would corrupt historical reporting.',
          syntax: `# SCD2 pattern with Delta MERGE:
# 1. Detect changes (join source with current target rows)
# 2. Expire changed rows (set is_current=False, end_date=today)
# 3. Insert new versions of changed rows + brand new rows`,
          example: `from pyspark.sql.functions import current_date, lit, col
from delta.tables import DeltaTable

target = DeltaTable.forPath(spark, "dbfs:/mnt/gold/dim_customers")

# Find rows that changed (compare on business key)
changed = source.alias("s").join(
    target.toDF().filter(col("is_current")).alias("t"),
    on="customer_id", how="left"
).filter(
    col("t.customer_id").isNull() |  # new customer
    (col("s.tier") != col("t.tier")) |
    (col("s.city") != col("t.city"))
)

# Step 1: expire old rows
target.alias("t").merge(
    changed.select("customer_id").alias("s"),
    "t.customer_id = s.customer_id AND t.is_current = true"
).whenMatchedUpdate(set={
    "is_current": lit(False),
    "end_date":   current_date(),
}).execute()

# Step 2: insert new versions
changed \\
    .withColumn("is_current", lit(True)) \\
    .withColumn("start_date",  current_date()) \\
    .withColumn("end_date",    lit(None)) \\
    .write.format("delta").mode("append") \\
    .save("dbfs:/mnt/gold/dim_customers")`,
          expectedOutput: `# dim_customers after SCD2 run:\n# customer_id=1 (old row): is_current=false, end_date=2024-01-16, tier=silver\n# customer_id=1 (new row): is_current=true,  end_date=null,       tier=gold`,
          interview: {
            question: 'What is the difference between SCD Type 1 and Type 2?',
            answer: 'SCD1 overwrites the old value — no history kept, simple to maintain. SCD2 inserts a new row for every change and expires the old one — full history preserved, required for time-based analysis.',
          },
          practice: 'Describe the three steps in an SCD Type 2 implementation using Delta Lake. What do the is_current and end_date columns represent?',
          hint: 'Steps: (1) detect changed rows by comparing source vs current target, (2) expire changed rows (is_current=false, end_date=today), (3) insert new rows with is_current=true, end_date=null.',
          solution: `# Step 1: Detect changed rows
# Join source with current target (is_current=True) on business key.
# Flag rows where any tracked column differs (tier, city, email).

# Step 2: Expire old rows
# Delta MERGE: when t.customer_id = s.customer_id AND t.is_current=True
# → update: is_current=False, end_date=current_date()

# Step 3: Insert new versions
# Take changed source rows, add is_current=True, start_date=today, end_date=null
# Append to Delta table.

# is_current = True:  this is the latest record for the key
# is_current = False: this row was superseded on end_date
# end_date = null:    still current (no expiry date set)`,
        },
      ],
    },
    {
      title: 'Performance Tuning',
      subtopics: [
        {
          id: 'pyspark-broadcast',
          title: 'Broadcast Joins',
          difficulty: 'Advanced',
          explanation: 'A broadcast join copies a small DataFrame to every executor\'s memory so the large DataFrame never needs to be shuffled. Spark auto-broadcasts tables below spark.sql.autoBroadcastJoinThreshold (default 10 MB).',
          why: 'A shuffle join on a 500M-row fact table with a 5K-row dimension is extremely slow. Broadcasting the dimension eliminates the shuffle entirely — often 10-50x faster.',
          syntax: `from pyspark.sql.functions import broadcast

# Force broadcast of small table
result = large_df.join(broadcast(small_df), "id")

# Tune auto-broadcast threshold
spark.conf.set("spark.sql.autoBroadcastJoinThreshold", 50 * 1024 * 1024)

# Check plan — look for BroadcastHashJoin vs SortMergeJoin
result.explain()`,
          example: `from pyspark.sql.functions import broadcast

orders   = spark.read.parquet("s3://warehouse/fact_orders/")   # 500M rows
products = spark.read.parquet("s3://warehouse/dim_products/")  # 5K rows

result = orders.join(
    broadcast(products.select("product_id", "category", "brand")),
    on="product_id",
    how="left"
)

result.explain()`,
          expectedOutput: `== Physical Plan ==\n*(2) BroadcastHashJoin [product_id#0L], [product_id#1L], LeftOuter, BuildRight\n:- *(2) FileScan parquet [order_id,product_id,amount]\n+- BroadcastExchange HashedRelationBroadcastMode\n   +- *(1) FileScan parquet [product_id,category,brand]`,
          interview: {
            question: 'How do you force a broadcast join in PySpark?',
            answer: 'Wrap the small DataFrame in broadcast(): df.join(broadcast(small_df), "key"). You can also increase the auto-broadcast threshold via spark.sql.autoBroadcastJoinThreshold.',
          },
          practice: 'Join a 200M-row orders DataFrame with a 3K-row stores DataFrame on store_id. Force a broadcast join and confirm the plan shows BroadcastHashJoin.',
          hint: 'Wrap stores in broadcast(). Call .explain() on the result and look for BroadcastHashJoin in the output.',
          solution: `from pyspark.sql.functions import broadcast

result = orders.join(
    broadcast(stores.select("store_id", "region", "manager")),
    on="store_id",
    how="left"
)
result.explain()
# Look for: BroadcastHashJoin [store_id], BuildRight`,
        },
        {
          id: 'pyspark-aqe',
          title: 'Adaptive Query Execution (AQE)',
          difficulty: 'Advanced',
          explanation: 'AQE re-optimises a Spark query at runtime using statistics collected during execution. It handles partition skew, coalesces small shuffle partitions, and switches join strategies — all automatically.',
          why: 'Static query plans cannot account for runtime data skew. AQE fixes the most common performance problems automatically, often 2-5x faster without any code changes.',
          syntax: `# Enable AQE (default ON in Spark 3.2+)
spark.conf.set("spark.sql.adaptive.enabled", "true")

# Handle skewed join partitions
spark.conf.set("spark.sql.adaptive.skewJoin.enabled", "true")

# Merge small post-shuffle partitions
spark.conf.set("spark.sql.adaptive.coalescePartitions.enabled", "true")

# Tune skew threshold (partition > factor * median = skewed)
spark.conf.set("spark.sql.adaptive.skewJoin.skewedPartitionFactor", "5")`,
          example: `spark.conf.set("spark.sql.adaptive.enabled", "true")
spark.conf.set("spark.sql.adaptive.skewJoin.enabled", "true")
spark.conf.set("spark.sql.adaptive.coalescePartitions.enabled", "true")

# AQE automatically handles this skewed join
# customer_id=1 has 50M rows; all others have ~100
result = skewed_orders.join(customers, on="customer_id")

# Without AQE: 1 task processes 50M rows → job is stuck for hours
# With AQE: Spark splits big partitions into sub-tasks automatically`,
          expectedOutput: `# AQE log (visible in Spark UI → SQL tab):\n# Skewed partition detected: customer_id=1, size=8.2 GB\n# Split into 32 sub-tasks\n# Job completed in 52s instead of 4m 20s`,
          interview: {
            question: 'What is data skew and how does AQE handle it?',
            answer: 'Data skew means one partition has far more rows than others (e.g. one customer_id with millions of orders). Without handling, one task processes all those rows while others finish in seconds. AQE detects oversized shuffle partitions and splits them into smaller sub-tasks.',
          },
          practice: 'Name two things AQE does automatically and which Spark configuration properties enable them. Explain why each improves performance.',
          hint: 'Think about (1) too many tiny shuffle partitions after groupBy, and (2) one partition in a join that is 50x larger than the others.',
          solution: `# 1. Coalesce small post-shuffle partitions
# Config: spark.sql.adaptive.coalescePartitions.enabled = true
# Why: groupBy with 200 shuffle.partitions may produce 190 empty/tiny partitions
# after processing. AQE merges them into a few larger ones, reducing task overhead.

# 2. Skew join handling
# Config: spark.sql.adaptive.skewJoin.enabled = true
# Why: if customer_id=1 has 50M rows, its partition is one giant task.
# AQE detects it exceeds the skewedPartitionFactor threshold and splits
# it into sub-tasks, parallelising the work.`,
        },
      ],
    },
  ],

  interviewGroups: [
    {
      title: 'Beginner',
      questions: [
        { question: 'What is PySpark?', answer: 'The Python API for Apache Spark — a distributed computing engine that processes large datasets across a cluster in parallel.' },
        { question: 'What is a Spark DataFrame?', answer: 'A distributed table with named, typed columns, partitioned across many machines. Transformations are lazy — nothing runs until an action is called.' },
        { question: 'What is lazy evaluation in Spark?', answer: 'Spark builds a DAG of transformations but executes nothing until an action (show, count, write) is called. This lets the Catalyst optimizer rewrite the plan before running.' },
        { question: 'What is the difference between a transformation and an action?', answer: 'Transformations (filter, select, groupBy) are lazy — they plan. Actions (count, show, write) trigger execution and return results.' },
        { question: 'Why use Parquet instead of CSV for large datasets?', answer: 'Parquet is columnar and compressed. Spark reads only the columns needed (pruning), pushes filters to the file level, and reads 5-10x less data than CSV.' },
      ],
    },
    {
      title: 'Intermediate',
      questions: [
        { question: 'What does repartition() do versus coalesce()?', answer: 'repartition() triggers a full shuffle and can increase or decrease partition count. coalesce() merges partitions without a shuffle — can only decrease. Use coalesce before writing to avoid small files.' },
        { question: 'When should you broadcast a join?', answer: 'When one DataFrame is small enough to fit in executor memory (< 10 MB by default). Broadcasting avoids shuffling the large DataFrame, dramatically improving performance.' },
        { question: 'What is a Window function in PySpark?', answer: 'A function that runs over a defined window of rows without collapsing them. Used for rankings, running totals, lag/lead comparisons — all without self-joins.' },
        { question: 'What is spark.sql.shuffle.partitions?', answer: 'The number of partitions created after a groupBy or join shuffle. Default is 200. Set lower for small DataFrames to avoid hundreds of tiny tasks; higher for large data.' },
        { question: 'How do you prevent re-reading the same large file multiple times in one job?', answer: 'Use cache() after reading. The first action fills the cache; all subsequent actions read from memory instead of storage.' },
      ],
    },
    {
      title: 'Advanced',
      questions: [
        { question: 'How do you handle a skewed join in PySpark?', answer: 'Options: (1) Enable AQE with spark.sql.adaptive.skewJoin.enabled=true for automatic handling. (2) Salt the skewed key with a random suffix and handle separately. (3) Broadcast the smaller side.' },
        { question: 'What is Delta Lake MERGE and when should you use it?', answer: 'MERGE performs an atomic upsert: update rows matching on key, insert new rows. Use for incremental loads and SCD Type 2 dimension updates.' },
        { question: 'What is SCD Type 2 and how is it implemented in Spark?', answer: 'SCD2 tracks history by inserting a new row for each change and expiring the old one. In Spark: (1) detect changes, (2) Delta MERGE to expire old rows, (3) append new versions with is_current=true.' },
        { question: 'What does the Catalyst optimizer do?', answer: 'Catalyst converts the logical plan into an optimised physical plan: predicate pushdown, column pruning, join reordering, constant folding, and code generation (Tungsten).' },
        { question: 'What is AQE and what does it fix automatically?', answer: 'Adaptive Query Execution re-optimises at runtime: coalesces small shuffle partitions, splits skewed partitions in joins, and switches join strategies based on actual runtime statistics.' },
      ],
    },
    {
      title: 'Real-world Scenarios',
      questions: [
        { question: 'A Spark job runs fine with 100K rows but times out with 100M rows. What do you check first?', answer: 'Check Spark UI for: (1) skew — one task processing 90% of data. (2) shuffle.partitions — 200 too low for large data. (3) joins — use broadcast for small tables. (4) caching — avoid re-reading. (5) enable AQE.' },
        { question: 'How do you implement an incremental load with Delta Lake?', answer: 'Use Delta MERGE: read new source data, merge into target on business key — update changed rows, insert new rows. For append-only tables, read only the new partition and append.' },
        { question: 'Your Delta table has a bad load — wrong values written. How do you recover?', answer: 'Use Delta time travel: (1) read the version before the bad load: .option("versionAsOf", N). (2) Verify data is correct. (3) Overwrite the table with the good version. (4) VACUUM after validation.' },
        { question: 'A groupBy on customer_id is extremely slow — customer_id=1 has 40M rows, others have ~100. What is happening and how do you fix it?', answer: 'This is data skew. Fix options: (1) Enable AQE skew handling (automatic). (2) Salt customer_id=1 by appending random suffix (0-N), join, then strip suffix. (3) Handle customer_id=1 separately as a special case.' },
        { question: 'How do you test a PySpark pipeline locally before deploying to a cluster?', answer: 'Use local mode: SparkSession.builder.master("local[*]"). Create small representative test DataFrames with spark.createDataFrame(). Write pytest tests and use the chispa library for DataFrame equality assertions.' },
      ],
    },
  ],

  miniProjects: [
    {
      title: 'Mini Project 1: Daily Orders ETL Pipeline',
      goal: 'Build a PySpark pipeline that ingests raw CSV orders, cleans and enriches the data, and writes partitioned Parquet to a silver layer.',
      steps: [
        'Create SparkSession with appName="OrdersETL" and shuffle.partitions=50.',
        'Define an explicit schema: order_id (long), customer_id (long), amount (double), status (string), order_date (date).',
        'Read orders CSV with the explicit schema.',
        'Filter out rows where amount is null or negative.',
        'Add columns: tax (amount * 0.08 rounded to 2dp), value_tier (VIP/Standard/Small), load_date (current_date()).',
        'Repartition by order_date column.',
        'Write to Parquet partitioned by order_date with mode overwrite.',
        'Read back and verify row count equals source minus invalid rows.',
      ],
      output: 'Partitioned Parquet files in silver layer with tax, value_tier, and load_date columns. Zero null amounts.',
    },
    {
      title: 'Mini Project 2: Customer LTV Report',
      goal: 'Use PySpark aggregations and window functions to build a customer lifetime value report.',
      steps: [
        'Read a Delta table of orders and a customers Delta table.',
        'Join on customer_id (left join to keep all customers).',
        'GroupBy customer_id and compute: total_orders (count), total_spent (sum of amount), avg_order (avg), first_order_date (min), last_order_date (max).',
        'Add a window function: customer_rank using dense_rank() over all customers ordered by total_spent descending.',
        'Add a segment column: Diamond (>10000), Gold (>1000), Silver (>100), Bronze (rest).',
        'Write the Gold Delta table partitioned by segment.',
      ],
      output: 'Gold Delta table with one row per customer: total orders, lifetime value, rank among all customers, and spend segment.',
    },
    {
      title: 'Enterprise Project: SCD Type 2 Customer Dimension',
      goal: 'Build a production-grade SCD Type 2 pipeline for a customer dimension table tracking tier and address changes.',
      steps: [
        'Design the schema: customer_id, name, email, tier, city, is_current (boolean), start_date, end_date, surrogate_key (md5 of customer_id + start_date).',
        'Write the initial full load to a Delta table with is_current=true for all rows.',
        'On each daily run, read the latest extract and the current target (filter is_current=true).',
        'Detect changes: join on customer_id, flag rows where tier or city differs from the current row.',
        'Delta MERGE: expire changed rows (is_current=false, end_date=today).',
        'Append new versions of changed rows and brand-new customers with is_current=true.',
        'Add data quality check: assert no customer_id appears more than once with is_current=true.',
        'Run OPTIMIZE with ZORDER BY customer_id weekly to maintain query performance.',
        'Write pytest tests validating the full SCD2 logic with a small 5-row test DataFrame.',
      ],
      output: 'Production Delta table with full SCD2 history, zero duplicate current rows, pytest coverage, and optimized Parquet layout.',
    },
  ],
};
