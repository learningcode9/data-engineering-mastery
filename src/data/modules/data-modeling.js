function modelingSubtopic({
  id,
  title,
  difficulty = 'Intermediate',
  beginnerExplanation,
  realWorldBusinessExample,
  productionContext,
  architectureRelevance,
  interviewAngle,
  commonMistake,
  seniorEngineerNote,
  practiceTask,
  hint,
  solution,
  syntax,
  example,
  expectedOutput,
  azureUsage,
  databricksUsage,
  performanceConsiderations,
}) {
  return {
    id,
    title,
    difficulty,
    explanation: beginnerExplanation,
    why: realWorldBusinessExample,
    beginnerExplanation,
    realWorldBusinessExample,
    productionContext,
    realWorldUsage: realWorldBusinessExample,
    azureUsage,
    azureRelevance: azureUsage,
    databricksUsage,
    databricksRelevance: databricksUsage,
    architectureRelevance,
    interviewAngle,
    commonMistake,
    seniorEngineerNote,
    seniorNote: seniorEngineerNote,
    commonMistakes: [commonMistake],
    practice: practiceTask,
    hint,
    solution,
    syntax,
    example,
    expectedOutput,
    performanceConsiderations,
    performanceTip: performanceConsiderations,
    interview: {
      question: interviewAngle,
      answer: seniorEngineerNote,
    },
  };
}

export const dataModelingModule = {
  documentationMapping: [
    {
      concept: 'Dimensional modeling for analytics',
      officialSource: 'Microsoft Learn — Dimensional modeling in Microsoft Fabric Warehouse',
      sourceUrl: 'https://learn.microsoft.com/en-us/fabric/data-warehouse/dimensional-modeling-overview',
      howThisLessonUsesIt: 'The module uses Microsoft terminology around fact tables, dimension tables, star schemas, surrogate keys, slowly changing dimensions, and Fabric Warehouse dimensional modeling.',
    },
    {
      concept: 'Power BI star schema guidance',
      officialSource: 'Microsoft Learn — Understand star schema and the importance for Power BI',
      sourceUrl: 'https://learn.microsoft.com/en-us/power-bi/guidance/star-schema',
      howThisLessonUsesIt: 'The BI dashboard sections align with Microsoft guidance that star schemas improve model usability, filter behavior, and report performance.',
    },
    {
      concept: 'Lakehouse medallion modeling',
      officialSource: 'Databricks Documentation — Medallion lakehouse architecture',
      sourceUrl: 'https://docs.databricks.com/en/lakehouse/medallion.html',
      howThisLessonUsesIt: 'The lakehouse section maps Bronze/Silver/Gold layers to raw, conformed, and dimensional business-ready models.',
    },
    {
      concept: 'Kimball dimensional modeling techniques',
      officialSource: 'Kimball Group — Dimensional Modeling Techniques',
      sourceUrl: 'https://www.kimballgroup.com/data-warehouse-business-intelligence-resources/kimball-techniques/dimensional-modeling-techniques/',
      howThisLessonUsesIt: 'Kimball terminology is used for grain, conformed dimensions, fact types, additive measures, and business process modeling.',
    },
  ],
  sections: [
    {
      title: 'Warehouse Foundations',
      subtopics: [
        modelingSubtopic({
          id: 'dm-oltp-vs-olap',
          title: 'OLTP vs OLAP',
          difficulty: 'Beginner',
          beginnerExplanation: 'OLTP systems run business transactions one row at a time: orders, payments, account updates. OLAP systems support analytics: many rows scanned, grouped, joined, and aggregated for reporting.',
          realWorldBusinessExample: 'Shopify order checkout writes one order into an OLTP database. A weekly revenue dashboard reads millions of orders from an OLAP warehouse and groups them by date, store, and product category.',
          productionContext: 'Do not point BI tools directly at OLTP systems. Long dashboard queries can lock tables, slow customer-facing apps, and mix operational schemas with analytics logic.',
          architectureRelevance: 'Senior Azure designs land OLTP extracts into ADLS/Delta, transform them through Silver, and serve OLAP-friendly Gold tables in Synapse, Fabric Warehouse, Databricks SQL, or Power BI semantic models.',
          interviewAngle: 'Explain OLTP vs OLAP using workload shape: writes vs reads, normalized vs dimensional, low-latency transactions vs analytical scans.',
          commonMistake: 'Building dashboards directly on source OLTP tables because the data is already there.',
          seniorEngineerNote: 'The key tradeoff is isolation. OLTP optimizes correctness and write latency; OLAP optimizes analytical read performance and semantic clarity.',
          practiceTask: 'Given an orders application database, list three tables you would not expose directly to BI and describe the OLAP model you would build instead.',
          hint: 'Look for normalized tables like orders, order_items, products, customers, and addresses. BI usually wants facts and dimensions.',
          solution: 'Create fact_sales at one row per order line, dim_customer, dim_product, dim_store, and dim_date. Load from OLTP snapshots or CDC into the warehouse/lakehouse before Power BI queries it.',
          syntax: `-- OLTP style: row lookup for application workflow
SELECT *
FROM orders
WHERE order_id = 10042;

-- OLAP style: aggregate many rows for analytics
SELECT d.month_name, p.category, SUM(f.net_sales) AS revenue
FROM gold.fact_sales f
JOIN gold.dim_date d ON f.date_key = d.date_key
JOIN gold.dim_product p ON f.product_key = p.product_key
GROUP BY d.month_name, p.category;`,
          example: 'A payment service writes transactions into PostgreSQL. A nightly ADF + Databricks job builds a Gold sales mart for Power BI so analysts never query the payment database directly.',
          expectedOutput: 'Clear separation: source systems keep serving customers; warehouse/lakehouse tables serve analytics.',
        }),
        modelingSubtopic({
          id: 'dm-fact-vs-dimension',
          title: 'Fact Tables vs Dimension Tables',
          difficulty: 'Beginner',
          beginnerExplanation: 'A fact table stores business events and measures. A dimension table stores descriptive context. Facts answer "how much/how many"; dimensions answer "by whom/where/when/what".',
          realWorldBusinessExample: 'fact_sales stores quantity, gross_sales, discounts, and product_key/customer_key/date_key. dim_product stores product name, category, brand, and launch date.',
          productionContext: 'Fact tables usually grow very large and need partitioning. Dimensions are smaller, wider, and often need SCD handling for historical correctness.',
          architectureRelevance: 'Gold lakehouse and Fabric Warehouse layers should expose clear facts and dimensions so Power BI relationships are simple and governed.',
          interviewAngle: 'Be ready to design fact_sales and dimensions for a sales dashboard in under five minutes.',
          commonMistake: 'Putting descriptive attributes like product_category directly in every fact row and then failing to manage changes consistently.',
          seniorEngineerNote: 'Facts and dimensions are ownership boundaries. Facts should be loaded from events; dimensions should be curated and conformed across business processes.',
          practiceTask: 'Model daily sales by store and product. Identify one fact table, four dimensions, and three measures.',
          hint: 'Start with the business event: one sold product line at one store on one date.',
          solution: 'fact_sales_line(date_key, store_key, product_key, customer_key, quantity, gross_sales, discount_amount, net_sales). Dimensions: dim_date, dim_store, dim_product, dim_customer.',
          syntax: `CREATE TABLE gold.fact_sales_line (
  sales_line_key BIGINT,
  date_key INT,
  store_key BIGINT,
  product_key BIGINT,
  customer_key BIGINT,
  quantity INT,
  gross_sales DECIMAL(12,2),
  discount_amount DECIMAL(12,2),
  net_sales DECIMAL(12,2)
);`,
          example: 'Finance uses fact_sales_line for revenue; merchandising uses the same fact joined to dim_product for category performance.',
          expectedOutput: 'One reusable fact table supports several dashboards without duplicated revenue logic.',
        }),
        modelingSubtopic({
          id: 'dm-star-schema',
          title: 'Star Schema',
          difficulty: 'Beginner',
          beginnerExplanation: 'A star schema has one central fact table connected directly to denormalized dimension tables. It is the default shape for BI-friendly warehouses.',
          realWorldBusinessExample: 'fact_orders joins directly to dim_customer, dim_product, dim_store, and dim_date. Power BI users can drag fields without understanding twenty normalized source tables.',
          productionContext: 'Star schemas reduce joins, simplify semantic models, and prevent analysts from rebuilding business logic differently in every report.',
          architectureRelevance: 'In Azure, the Gold layer often becomes a star schema consumed by Power BI Direct Lake, Synapse serverless, or Fabric Warehouse.',
          interviewAngle: 'If asked to design a warehouse schema, start with a star schema unless requirements demand otherwise.',
          commonMistake: 'Leaving the Gold layer as one giant flat table or a mirror of the source schema.',
          seniorEngineerNote: 'Star schema is not old-fashioned. It is still the cleanest contract between data engineering and BI consumers.',
          practiceTask: 'Sketch a star schema for e-commerce sales and explain which table is central.',
          hint: 'The fact table is the central table because it contains the measurable event.',
          solution: 'Central fact: fact_order_line. Dimensions: dim_date, dim_customer, dim_product, dim_store, dim_promotion. Measures: quantity, gross_sales, net_sales.',
          syntax: `fact_order_line
  ├── date_key      -> dim_date
  ├── customer_key  -> dim_customer
  ├── product_key   -> dim_product
  ├── store_key     -> dim_store
  └── measures: quantity, net_sales, discount_amount`,
          example: 'A retail executive dashboard filters revenue by date, store region, and product category through dimensions that all connect to fact_order_line.',
          expectedOutput: 'A model where BI joins are obvious, fast, and consistent.',
        }),
        modelingSubtopic({
          id: 'dm-snowflake-schema',
          title: 'Snowflake Schema',
          difficulty: 'Intermediate',
          beginnerExplanation: 'A snowflake schema normalizes dimensions into additional related tables. For example, dim_product points to dim_brand and dim_category instead of storing brand/category directly.',
          realWorldBusinessExample: 'A product catalog with category, subcategory, brand, and supplier hierarchy might be snowflaked if those hierarchies are large, governed, or reused independently.',
          productionContext: 'Snowflaking can reduce dimension duplication but increases joins and makes BI semantic models harder for business users.',
          architectureRelevance: 'Use snowflake patterns sparingly in Gold. They are more common in Silver/conformed layers where governance and reuse matter more than report simplicity.',
          interviewAngle: 'Explain the tradeoff: storage and governance vs query simplicity and BI usability.',
          commonMistake: 'Normalizing every dimension because OLTP habits carried into OLAP design.',
          seniorEngineerNote: 'A snowflake is a deliberate exception, not the default. In Power BI-facing marts, denormalized dimensions usually win.',
          practiceTask: 'Decide whether product hierarchy should be star or snowflake for a Power BI sales dashboard.',
          hint: 'Ask who consumes it. Executives need simple filters; data stewards may need governed hierarchy tables.',
          solution: 'For the Power BI sales mart, keep dim_product denormalized with category/subcategory/brand. Maintain governed hierarchy tables upstream in Silver if needed.',
          syntax: `-- Star dimension
dim_product(product_key, sku, product_name, brand, category, subcategory)

-- Snowflaked dimension
dim_product(product_key, sku, product_name, brand_key, category_key)
dim_brand(brand_key, brand_name)
dim_category(category_key, category_name, parent_category_key)`,
          example: 'A product stewardship team manages normalized category hierarchies in Silver, while Gold exposes a flattened dim_product for dashboards.',
          expectedOutput: 'A conscious design choice with a clear consumer and performance rationale.',
        }),
      ],
    },
    {
      title: 'Keys, Grain, and Measures',
      subtopics: [
        modelingSubtopic({
          id: 'dm-surrogate-natural-keys',
          title: 'Surrogate Keys vs Natural Keys',
          difficulty: 'Intermediate',
          beginnerExplanation: 'A natural key comes from the business source, like customer_id or email. A surrogate key is generated by the warehouse, like customer_key = 12345.',
          realWorldBusinessExample: 'A customer can change email or be merged across CRM systems. The warehouse keeps a stable customer_key and stores source customer_id as an attribute.',
          productionContext: 'Surrogate keys make SCD Type 2 and multi-source integration safer because facts point to the exact dimension row version.',
          architectureRelevance: 'In lakehouse Gold models, surrogate keys protect downstream Power BI relationships from source-system changes and duplicate natural keys.',
          interviewAngle: 'Explain why a fact table joins to customer_key, not customer_id, in an SCD2 model.',
          commonMistake: 'Using email as a key because it looks unique, then breaking history when the email changes.',
          seniorEngineerNote: 'Surrogate keys are not just performance helpers; they encode warehouse identity independent from source-system identity.',
          practiceTask: 'Design keys for dim_customer where a customer address changes over time.',
          hint: 'You need both a warehouse key and the original source key.',
          solution: 'Use customer_key as the surrogate primary key and customer_id as the natural/business key. fact_sales references customer_key for point-in-time reporting.',
          syntax: `CREATE TABLE gold.dim_customer (
  customer_key BIGINT GENERATED ALWAYS AS IDENTITY,
  customer_id STRING,
  customer_name STRING,
  city STRING,
  effective_start_date DATE,
  effective_end_date DATE,
  is_current BOOLEAN
);`,
          example: 'Customer C-101 has two dimension rows after moving cities. Orders before the move join to the old customer_key; orders after the move join to the new one.',
          expectedOutput: 'Historical reports stay correct even when source customer attributes change.',
        }),
        modelingSubtopic({
          id: 'dm-fact-grain',
          title: 'Grain of a Fact Table',
          difficulty: 'Intermediate',
          beginnerExplanation: 'Grain defines what one row in a fact table represents. You must declare it before adding dimensions or measures.',
          realWorldBusinessExample: 'fact_order_line grain is one row per product per order. fact_order grain is one row per order. Mixing them causes duplicated order totals.',
          productionContext: 'Most duplicate revenue incidents happen because a fact table at one grain is joined to data at another grain without aggregation.',
          architectureRelevance: 'Grain controls partitioning, unique keys, fact/dimension relationships, and semantic model measures in Fabric/Power BI.',
          interviewAngle: 'Before designing a schema, say: "First I would define the grain." That is a senior signal.',
          commonMistake: 'Adding product_id to an order-level fact without changing the grain to order line.',
          seniorEngineerNote: 'Grain is a contract. Once violated, every measure becomes suspect.',
          practiceTask: 'Why can adding product_id to fact_orders double revenue?',
          hint: 'Think about one order containing multiple products.',
          solution: 'If fact_orders stores one row per order but product_id creates one row per line item, order_total repeats for each product. Use fact_order_line with line_amount or aggregate before joining.',
          syntax: `-- Declare the grain in the table comment or docs:
-- fact_order_line grain: one row per order_id + line_id

SELECT order_id, COUNT(*) AS rows_per_order
FROM gold.fact_order_line
GROUP BY order_id
HAVING COUNT(*) > 1;`,
          example: 'Order 100 has three products. If order_total = 90 appears on all three rows, SUM(order_total) returns 270 unless the model uses line-level measures.',
          expectedOutput: 'A fact table with a documented, testable unique grain.',
        }),
        modelingSubtopic({
          id: 'dm-additive-measures',
          title: 'Additive, Semi-Additive, and Non-Additive Measures',
          difficulty: 'Intermediate',
          beginnerExplanation: 'Additive measures can be summed across all dimensions. Semi-additive measures can be summed across some dimensions but not time. Non-additive measures should not be summed directly.',
          realWorldBusinessExample: 'Revenue is additive. Account balance is semi-additive: sum across accounts on one date, but not across dates. Conversion rate is non-additive: recompute from numerator and denominator.',
          productionContext: 'Wrong measure type causes executive dashboards to show inflated balances, averaged percentages, or duplicated rates.',
          architectureRelevance: 'Semantic models should define measures carefully, often storing base numerators/denominators in facts rather than precomputed ratios.',
          interviewAngle: 'Use account balance and conversion rate examples to show you understand BI correctness, not only table joins.',
          commonMistake: 'Summing daily account balances over a month and calling it monthly balance.',
          seniorEngineerNote: 'Good modelers design measures for aggregation behavior. Bad models force BI developers to guess.',
          practiceTask: 'Classify revenue, inventory_on_hand, and margin_percent as additive, semi-additive, or non-additive.',
          hint: 'Ask whether SUM makes sense across date, product, and store.',
          solution: 'Revenue is additive. Inventory_on_hand is semi-additive across product/store but not time. Margin_percent is non-additive; calculate SUM(profit)/SUM(revenue).',
          syntax: `-- Correct margin measure pattern
SELECT
  SUM(profit) / NULLIF(SUM(revenue), 0) AS margin_percent
FROM gold.fact_sales;`,
          example: 'A store dashboard computes monthly conversion_rate from total_conversions / total_visits, not AVG(daily_conversion_rate).',
          expectedOutput: 'Measures aggregate correctly at daily, monthly, store, and enterprise levels.',
        }),
        modelingSubtopic({
          id: 'dm-date-dimension',
          title: 'Date Dimension',
          difficulty: 'Beginner',
          beginnerExplanation: 'A date dimension is a calendar table with one row per date and attributes like week, month, quarter, fiscal period, holiday, and business day flag.',
          realWorldBusinessExample: 'Finance wants fiscal month; operations wants weekday/weekend; retail wants holiday season. dim_date provides all of these consistently.',
          productionContext: 'Do not let every dashboard reinvent date logic. A conformed dim_date prevents inconsistent fiscal calendars across reports.',
          architectureRelevance: 'Date dimensions are shared across marts and are especially important in Power BI semantic models and Fabric Warehouse reporting.',
          interviewAngle: 'Mention dim_date when designing any sales, inventory, or finance warehouse.',
          commonMistake: 'Using raw timestamps directly in every report and letting each report define weeks differently.',
          seniorEngineerNote: 'dim_date is small but strategic. It centralizes calendar semantics and removes report-level ambiguity.',
          practiceTask: 'List five columns you would include in dim_date for a retail company.',
          hint: 'Think business calendar, not only year/month/day.',
          solution: 'date_key, full_date, day_of_week, week_start_date, month_name, fiscal_month, fiscal_quarter, is_weekend, is_holiday, retail_445_week.',
          syntax: `CREATE TABLE gold.dim_date (
  date_key INT,
  full_date DATE,
  day_name STRING,
  week_start_date DATE,
  month_name STRING,
  fiscal_period STRING,
  is_weekend BOOLEAN,
  is_holiday BOOLEAN
);`,
          example: 'Power BI uses dim_date for all sales and inventory reports, ensuring the same fiscal quarter definition everywhere.',
          expectedOutput: 'Consistent calendar filtering across every fact table.',
        }),
      ],
    },
    {
      title: 'Dimensional Patterns',
      subtopics: [
        modelingSubtopic({
          id: 'dm-scd-type-1',
          title: 'Slowly Changing Dimension Type 1',
          difficulty: 'Intermediate',
          beginnerExplanation: 'SCD Type 1 overwrites old dimension values. It keeps only the latest version and does not preserve history.',
          realWorldBusinessExample: 'If a customer fixes a misspelled name, Type 1 overwrites the old typo because historical analysis does not need the incorrect value.',
          productionContext: 'Type 1 is simple and cheap but dangerous when business questions depend on point-in-time truth.',
          architectureRelevance: 'Use Type 1 for corrections and non-analytical attributes in Silver/Gold dimensions.',
          interviewAngle: 'State when Type 1 is correct: corrections, non-historical attributes, or data quality cleanup.',
          commonMistake: 'Using Type 1 for customer segment or address when historical reporting needs prior values.',
          seniorEngineerNote: 'SCD1 is not "bad"; it is a deliberate decision that history is not analytically meaningful for that attribute.',
          practiceTask: 'Choose Type 1 or Type 2 for fixing a misspelled product name and explain why.',
          hint: 'Ask whether business users need to report what the typo was in the past.',
          solution: 'Use Type 1. It is a correction, not a business event. Overwrite the old value and keep an audit column for pipeline traceability if needed.',
          syntax: `MERGE INTO gold.dim_product t
USING silver.product_updates s
ON t.product_id = s.product_id
WHEN MATCHED THEN UPDATE SET
  product_name = s.product_name,
  updated_at = current_timestamp();`,
          example: 'A product name changes from "Iphone Case" to "iPhone Case"; all historical reports should show the corrected spelling.',
          expectedOutput: 'One current dimension row per product with corrected attributes.',
        }),
        modelingSubtopic({
          id: 'dm-scd-type-2',
          title: 'Slowly Changing Dimension Type 2',
          difficulty: 'Advanced',
          beginnerExplanation: 'SCD Type 2 preserves history by expiring the old dimension row and inserting a new row for each meaningful change.',
          realWorldBusinessExample: 'A customer moves from Austin to Seattle. Orders before the move should count toward Austin sales territory; orders after the move should count toward Seattle.',
          productionContext: 'SCD2 needs surrogate keys, effective dates, is_current flags, deduplicated source changes, and tests for exactly one current row per natural key.',
          architectureRelevance: 'SCD2 is common in Delta Lake, Fabric Warehouse, Synapse, and dbt snapshots when BI needs point-in-time reporting.',
          interviewAngle: 'Explain the three steps: detect changes, expire current row, insert new row.',
          commonMistake: 'Joining facts to the current dimension row instead of the dimension row valid on the fact date.',
          seniorEngineerNote: 'SCD2 correctness is mostly about joins and tests, not only MERGE syntax.',
          practiceTask: 'Design an SCD2 customer dimension and explain how fact_sales should join to it.',
          hint: 'The fact date must fall between effective_start_date and effective_end_date.',
          solution: 'Use customer_key surrogate key, customer_id natural key, effective_start_date, effective_end_date, is_current. During fact load, lookup the dimension row where order_date is within the validity range.',
          syntax: `SELECT f.order_id, d.customer_key
FROM silver.orders f
JOIN gold.dim_customer d
  ON f.customer_id = d.customer_id
 AND f.order_date >= d.effective_start_date
 AND f.order_date <  d.effective_end_date;`,
          example: 'Customer C-101 moved in March. February orders join to the Austin row; April orders join to the Seattle row.',
          expectedOutput: 'Historical reports reflect the customer attributes that were true at transaction time.',
        }),
        modelingSubtopic({
          id: 'dm-conformed-dimensions',
          title: 'Conformed Dimensions',
          difficulty: 'Intermediate',
          beginnerExplanation: 'A conformed dimension is shared across multiple fact tables so reports use the same definition of customer, product, store, or date.',
          realWorldBusinessExample: 'fact_sales and fact_returns both join to the same dim_product, so net sales by category uses one product hierarchy.',
          productionContext: 'Without conformed dimensions, each mart creates its own product or customer definition and cross-domain dashboards disagree.',
          architectureRelevance: 'Conformed dimensions are the bridge between separate marts in a lakehouse or Fabric Warehouse.',
          interviewAngle: 'Use conformed dimensions when asked how to combine sales, returns, inventory, and marketing metrics.',
          commonMistake: 'Creating dim_customer separately in every mart with slightly different filters and business rules.',
          seniorEngineerNote: 'Conformed dimensions are a governance mechanism. They make metric reconciliation possible.',
          practiceTask: 'Design shared dimensions for sales and returns marts.',
          hint: 'Look for entities both facts describe.',
          solution: 'Use conformed dim_date, dim_product, dim_store, and dim_customer. fact_sales and fact_returns reference the same keys so category, region, and customer segment filters behave consistently.',
          syntax: `fact_sales.product_key   -> dim_product.product_key
fact_returns.product_key -> dim_product.product_key

-- One product hierarchy powers both revenue and return-rate measures.`,
          example: 'The merchandising team can calculate return_rate = returns / sales by product category because both facts share dim_product.',
          expectedOutput: 'Cross-domain dashboards reconcile because dimensions mean the same thing everywhere.',
        }),
        modelingSubtopic({
          id: 'dm-data-marts',
          title: 'Data Marts',
          difficulty: 'Intermediate',
          beginnerExplanation: 'A data mart is a curated subset of warehouse data designed for a specific business domain like finance, sales, marketing, or operations.',
          realWorldBusinessExample: 'Finance gets a revenue mart; marketing gets a campaign attribution mart; operations gets a fulfillment SLA mart.',
          productionContext: 'Marts should be owned, documented, tested, and aligned to business metrics. Random one-off tables become data debt.',
          architectureRelevance: 'Gold layer tables are often domain marts built from conformed Silver models and consumed by Power BI or semantic models.',
          interviewAngle: 'Explain that marts improve usability but require governance to avoid metric drift.',
          commonMistake: 'Creating a new mart for every dashboard instead of reusable domain models.',
          seniorEngineerNote: 'A mart is a product. It needs an owner, SLA, docs, tests, and a deprecation path.',
          practiceTask: 'Define a sales mart and three tables it should expose.',
          hint: 'Think facts, dimensions, and a small aggregate for common dashboard needs.',
          solution: 'sales_mart.fact_sales_line, sales_mart.dim_product, sales_mart.dim_store, sales_mart.agg_daily_sales_by_store_product.',
          syntax: `sales_mart/
  fact_sales_line
  dim_product
  dim_store
  dim_customer
  agg_daily_sales`,
          example: 'Power BI connects to sales_mart instead of raw Silver tables, reducing report complexity and metric drift.',
          expectedOutput: 'A domain-specific serving layer with stable contracts and fewer ad hoc joins.',
        }),
        modelingSubtopic({
          id: 'dm-kimball-basics',
          title: 'Kimball Modeling Basics',
          difficulty: 'Intermediate',
          beginnerExplanation: 'Kimball dimensional modeling starts with business processes, declares grain, identifies dimensions, and then adds facts/measures.',
          realWorldBusinessExample: 'For retail sales: business process = sale transaction; grain = one row per order line; dimensions = date, product, store, customer; facts = quantity and net_sales.',
          productionContext: 'Kimball prevents modelers from starting with source tables. You model business processes first, which makes reports business-friendly.',
          architectureRelevance: 'Kimball fits naturally in Gold marts even when Bronze/Silver are built in a medallion lakehouse.',
          interviewAngle: 'A strong warehouse design answer follows Kimball order: process, grain, dimensions, facts.',
          commonMistake: 'Starting with all source tables and trying to mirror them into a warehouse.',
          seniorEngineerNote: 'The business process is the anchor. Source systems are implementation details.',
          practiceTask: 'Apply Kimball’s four-step process to store inventory snapshots.',
          hint: 'Inventory is usually a periodic snapshot fact, not a transaction fact.',
          solution: 'Process: inventory measurement. Grain: one row per product-store-day. Dimensions: date, product, store. Facts: quantity_on_hand, inventory_value, reorder_flag.',
          syntax: `-- Kimball sequence
1. Select business process: daily inventory snapshot
2. Declare grain: product + store + day
3. Identify dimensions: date, product, store
4. Identify facts: quantity_on_hand, inventory_value`,
          example: 'Inventory, sales, and returns become separate facts sharing product/store/date dimensions.',
          expectedOutput: 'A model that maps to how the business operates, not how the source database stores rows.',
        }),
        modelingSubtopic({
          id: 'dm-data-vault-basics',
          title: 'Data Vault Basics',
          difficulty: 'Advanced',
          beginnerExplanation: 'Data Vault separates business keys (hubs), relationships (links), and descriptive history (satellites). It is designed for auditability and change resilience.',
          realWorldBusinessExample: 'hub_customer stores customer business keys, link_customer_account stores relationships, sat_customer_profile stores changing customer attributes over time.',
          productionContext: 'Data Vault is useful in complex, regulated, multi-source environments but can be overkill for simple BI marts.',
          architectureRelevance: 'A Data Vault can sit in Silver as an auditable integration layer, with Kimball marts built downstream in Gold.',
          interviewAngle: 'Know when to mention it: complex integration, audit, many sources, changing structures.',
          commonMistake: 'Using Data Vault for a small dashboard project and creating unnecessary complexity.',
          seniorEngineerNote: 'Data Vault optimizes for integration and history; Kimball optimizes for consumption. They can coexist.',
          practiceTask: 'Model customer and account data using hub/link/satellite concepts.',
          hint: 'Hubs are nouns/business keys; links are relationships; satellites store descriptive attributes.',
          solution: 'hub_customer(customer_hash_key, customer_id), hub_account(account_hash_key, account_id), link_customer_account(customer_hash_key, account_hash_key), sat_customer_profile(customer_hash_key, name, address, load_ts).',
          syntax: `hub_customer(customer_hk, customer_id, load_ts, record_source)
hub_account(account_hk, account_id, load_ts, record_source)
link_customer_account(customer_account_hk, customer_hk, account_hk, load_ts)
sat_customer_profile(customer_hk, name, address, hashdiff, load_ts)`,
          example: 'A bank integrates customer data from CRM, core banking, and fraud systems while preserving source lineage and change history.',
          expectedOutput: 'An auditable integration model that can feed simpler star-schema marts.',
        }),
      ],
    },
    {
      title: 'Lakehouse and BI Reliability',
      subtopics: [
        modelingSubtopic({
          id: 'dm-lakehouse-medallion-modeling',
          title: 'Modeling for Lakehouse and Medallion Architecture',
          difficulty: 'Advanced',
          beginnerExplanation: 'Medallion architecture organizes data by quality: Bronze raw, Silver cleaned/conformed, Gold business-ready. Dimensional modeling usually happens in Gold.',
          realWorldBusinessExample: 'Bronze stores raw Shopify orders. Silver deduplicates and conforms customers/products. Gold publishes fact_sales_line, dim_customer, dim_product, and agg_daily_sales.',
          productionContext: 'Do not put business-only dashboard tables in Silver. Silver should be reusable, while Gold should be optimized for consumers.',
          architectureRelevance: 'This connects Databricks/Fabric lakehouse architecture with Kimball-style BI models.',
          interviewAngle: 'Explain where dimensional models live in a medallion architecture and why.',
          commonMistake: 'Calling every cleaned table “Gold” even when it is not business-ready or documented.',
          seniorEngineerNote: 'Bronze/Silver/Gold is a quality contract; dimensional modeling is a consumption contract. They solve different problems and should be aligned deliberately.',
          practiceTask: 'Map raw orders, cleaned orders, and sales dashboard tables to Bronze/Silver/Gold.',
          hint: 'Ask whether the table is raw, conformed, or directly consumed by business users.',
          solution: 'Bronze: raw order files/events. Silver: cleaned orders, customers, products with dedup and schema enforcement. Gold: fact_sales_line, dim_customer, dim_product, agg_daily_sales.',
          syntax: `bronze.orders_raw
silver.orders_clean
silver.customers_conformed
gold.fact_sales_line
gold.dim_customer
gold.agg_daily_sales`,
          example: 'A Databricks job builds Silver Delta tables; a dbt or SQL job builds Gold facts/dimensions for Power BI Direct Lake.',
          expectedOutput: 'A lakehouse where raw recovery, conformed data, and BI serving have clear boundaries.',
        }),
        modelingSubtopic({
          id: 'dm-bi-modeling-mistakes',
          title: 'Modeling Mistakes That Break BI Dashboards',
          difficulty: 'Advanced',
          beginnerExplanation: 'Bad modeling can make dashboards wrong even if every pipeline runs successfully.',
          realWorldBusinessExample: 'A dashboard shows duplicate revenue because fact_order joins to order_items and repeats order_total for every product row.',
          productionContext: 'Production BI failures often come from grain mismatch, many-to-many relationships, duplicated dimensions, ambiguous filters, or unmanaged SCD joins.',
          architectureRelevance: 'Power BI semantic models depend on clean one-to-many relationships and trustworthy measures from Gold tables.',
          interviewAngle: 'Debug from symptoms: duplicate revenue, missing rows, wrong filters, or totals that do not match finance.',
          commonMistake: 'Fixing the dashboard visual instead of fixing the underlying grain or relationship problem.',
          seniorEngineerNote: 'When BI numbers are wrong, debug the model before debugging the chart.',
          practiceTask: 'A Power BI dashboard shows revenue twice as high after adding product category. How do you debug it?',
          hint: 'Check row counts before and after joins, then inspect relationship cardinality and measure grain.',
          solution: 'Verify fact grain, join path, and aggregation. Run COUNT and SUM before/after the product join. If order_total is repeated per line, switch to line-level fact or aggregate line_amount correctly.',
          syntax: `SELECT
  COUNT(*) AS joined_rows,
  COUNT(DISTINCT order_id) AS orders,
  SUM(order_total) AS suspicious_revenue
FROM fact_orders o
JOIN order_items i ON o.order_id = i.order_id;`,
          example: 'Finance total is $1.2M, dashboard says $2.4M. The model joined order header totals to two order lines on average.',
          expectedOutput: 'A corrected model with one measure at the right grain and tests that catch duplicate joins.',
        }),
      ],
    },
    {
      title: 'Senior Modeling Reliability',
      subtopics: [
        modelingSubtopic({
          id: 'dm-bridge-many-to-many',
          title: 'Bridge Tables and Many-to-Many Relationships',
          difficulty: 'Advanced',
          beginnerExplanation: 'A bridge table resolves a many-to-many relationship by storing one row per valid relationship between two entities, often with weighting or effective dates.',
          realWorldBusinessExample: 'A customer can belong to multiple marketing segments, and one segment contains many customers. A bridge_customer_segment table prevents duplicating customer or sales facts.',
          productionContext: 'Many-to-many relationships can silently duplicate measures in Power BI if modeled directly between facts and dimensions.',
          architectureRelevance: 'Gold models in Fabric Warehouse, Synapse, or Databricks SQL should expose bridge tables deliberately so semantic models have stable relationship paths.',
          azureUsage: 'Use Fabric Warehouse or Synapse SQL to publish the bridge as a governed Gold table, then model relationships carefully in Power BI semantic models.',
          databricksUsage: 'Databricks can build bridge tables from Silver relationship history and publish them as Delta Gold tables with effective-date filters.',
          performanceConsiderations: 'Bridge tables can increase join size. Filter by effective date and segment type before joining to large facts.',
          interviewAngle: 'How do you model customers that belong to multiple segments without double-counting revenue?',
          commonMistake: 'Joining fact_sales directly to a multi-row customer segment table and summing revenue without weighting or distinct grain.',
          seniorEngineerNote: 'Use a bridge table with clear grain, optional allocation weights, and validation checks proving totals do not change after segment joins.',
          practiceTask: 'Design a bridge table for customer-to-segment membership and explain how a revenue dashboard should avoid double-counting.',
          hint: 'Declare the bridge grain and decide whether allocation weights are needed.',
          solution: 'Create bridge_customer_segment(customer_key, segment_key, effective_start, effective_end, allocation_weight). Join facts through customer_key only when segment analysis is requested, and validate total revenue before/after segment filtering.',
          syntax: `bridge_customer_segment(
  customer_key,
  segment_key,
  effective_start_date,
  effective_end_date,
  allocation_weight
)`,
          example: 'Marketing wants revenue by loyalty segment, but customers can be in Gold and Holiday Promo at the same time.',
          expectedOutput: 'A model that supports segment analysis without duplicating base revenue totals.',
        }),
        modelingSubtopic({
          id: 'dm-late-arriving-dimensions',
          title: 'Late-Arriving Dimensions',
          difficulty: 'Advanced',
          beginnerExplanation: 'A late-arriving dimension occurs when a fact event arrives before the dimension row needed to describe it.',
          realWorldBusinessExample: 'An order event arrives with customer_id=123, but the customer profile feed is delayed. The sales fact still needs to load without losing the event.',
          productionContext: 'Production pipelines must decide whether to use unknown dimension rows, retry queues, inferred members, or reprocessing once the dimension arrives.',
          architectureRelevance: 'This affects CDC, SCD2, fact loading, and Power BI completeness in Azure lakehouse/warehouse models.',
          azureUsage: 'ADF or Databricks can route unresolved facts to a retry table, while Fabric/Synapse Gold tables expose an Unknown Customer member until correction.',
          databricksUsage: 'Use Delta MERGE to update inferred dimension records and restate affected fact foreign keys after the true dimension arrives.',
          performanceConsiderations: 'Avoid repeatedly scanning all facts for unresolved keys. Track only affected business keys or date partitions.',
          interviewAngle: 'How do you handle facts that arrive before their dimension rows?',
          commonMistake: 'Dropping the fact row or forcing an inner join that hides valid business events.',
          seniorEngineerNote: 'Preserve the fact, assign an unknown or inferred surrogate key, record the unresolved natural key, and reconcile once the dimension arrives.',
          practiceTask: 'Design handling for orders arriving before customer dimension updates.',
          hint: 'Think unknown member, retry, audit, and later correction.',
          solution: 'Load the fact with unknown_customer_key or an inferred customer dimension row, log unresolved customer_id, rerun the resolution job after customer feed arrival, and validate unresolved count trends.',
          syntax: `-- Unknown dimension member
dim_customer(customer_key=-1, customer_id='UNKNOWN', customer_name='Unknown')

-- Fact keeps source natural key for later repair
fact_sales(customer_key=-1, source_customer_id='123', order_id, amount)`,
          example: 'A CDC customer feed is delayed by 30 minutes but order events arrive continuously.',
          expectedOutput: 'No lost sales facts; unresolved dimensions are visible and repairable.',
        }),
        modelingSubtopic({
          id: 'dm-fact-reconciliation-checks',
          title: 'Fact Reconciliation Checks',
          difficulty: 'Advanced',
          beginnerExplanation: 'Reconciliation checks compare source totals, Silver tables, and Gold facts so model errors are caught before dashboards refresh.',
          realWorldBusinessExample: 'Finance expects $1.25M in yesterday revenue. Gold fact_sales must reconcile to source orders after refunds, tax exclusions, and currency rules are applied.',
          productionContext: 'A pipeline can succeed technically while producing wrong totals due to duplicate joins, missed CDC deletes, or grain mismatch.',
          architectureRelevance: 'Reconciliation is the quality gate between lakehouse transformation and trusted BI consumption.',
          azureUsage: 'Store reconciliation results in an audit Delta/Fabric table and block Power BI refresh or Synapse publish when thresholds fail.',
          databricksUsage: 'Databricks jobs can compute row counts, sums, checksums, duplicate keys, and null foreign-key counts before publishing Gold tables.',
          performanceConsiderations: 'Run checks at partition/batch level for large facts, then aggregate trends for monitoring.',
          interviewAngle: 'What checks prove your dimensional model is not double-counting?',
          commonMistake: 'Only checking row counts and ignoring business measures like revenue, quantity, or balances.',
          seniorEngineerNote: 'Use business-aligned checks: row counts, distinct business keys, additive totals, duplicate fact keys, null dimension keys, and variance thresholds.',
          practiceTask: 'Write validation checks for a daily sales fact table before publishing to Power BI.',
          hint: 'Compare source, Silver, and Gold for the same date window.',
          solution: 'Check source_count vs gold_count, SUM(net_sales), duplicate order_line_id, null product/customer keys, and variance against prior-day trend. Fail closed if thresholds breach.',
          syntax: `SELECT business_date,
       COUNT(*) AS fact_rows,
       COUNT(DISTINCT order_line_id) AS distinct_lines,
       SUM(net_sales) AS revenue,
       SUM(CASE WHEN customer_key IS NULL THEN 1 ELSE 0 END) AS null_customer_keys
FROM gold.fact_sales_line
WHERE business_date = @load_date
GROUP BY business_date;`,
          example: 'A product dimension join duplicates rows and doubles revenue; reconciliation catches it before executives see the dashboard.',
          expectedOutput: 'A pass/fail validation record with row, key, and business metric checks.',
        }),
        modelingSubtopic({
          id: 'dm-semantic-model-contracts',
          title: 'Power BI Semantic Model Contracts',
          difficulty: 'Advanced',
          beginnerExplanation: 'A semantic model contract defines stable measures, relationships, keys, refresh expectations, and security assumptions for BI consumers.',
          realWorldBusinessExample: 'The Sales semantic model promises one active relationship from fact_sales to dim_date, certified Revenue measures, and RLS by region.',
          productionContext: 'Changing Gold table grain, column names, or relationship paths without a contract can break reports even when the warehouse load succeeds.',
          architectureRelevance: 'Senior Azure data engineers must understand how Gold tables become Fabric/Power BI semantic models and how model contracts protect consumers.',
          azureUsage: 'Fabric semantic models and Power BI datasets depend on stable Gold schemas, Direct Lake/Import choices, RLS roles, and refresh SLAs.',
          databricksUsage: 'Databricks SQL can serve Gold tables, but Power BI model quality still depends on clean dimensions, measures, and relationship design.',
          performanceConsiderations: 'High-cardinality columns, bi-directional filters, and ambiguous relationships can slow semantic models and confuse measures.',
          interviewAngle: 'How do you prevent warehouse changes from breaking Power BI dashboards?',
          commonMistake: 'Treating the semantic model as a report-layer detail instead of a governed data product contract.',
          seniorEngineerNote: 'Version the Gold schema, coordinate breaking changes, certify shared measures, document RLS, and test refresh/measure outputs before release.',
          practiceTask: 'Define a semantic model contract for a Sales Gold mart.',
          hint: 'Include keys, relationships, measures, refresh SLA, and RLS assumptions.',
          solution: 'Contract: fact_sales_line grain, conformed dim_date/product/customer/store, certified measures Revenue/Units/Margin, single-direction relationships, regional RLS, daily refresh by 8 AM, and deprecation window for schema changes.',
          syntax: `Semantic model contract:
  Fact grain: one row per order line
  Required keys: date_key, product_key, customer_key, store_key
  Measures: Revenue, Units, Gross Margin
  Security: region-based RLS
  SLA: daily refresh by 08:00 local time`,
          example: 'A developer renames net_sales to revenue_amount; contract tests catch the breaking change before report refresh fails.',
          expectedOutput: 'A predictable BI serving layer with clear ownership and release rules.',
        }),
        modelingSubtopic({
          id: 'dm-junk-degenerate-dimensions',
          title: 'Junk and Degenerate Dimensions',
          difficulty: 'Intermediate',
          beginnerExplanation: 'A junk dimension groups low-cardinality flags, while a degenerate dimension stores a business identifier directly in the fact table when no separate dimension is needed.',
          realWorldBusinessExample: 'Order flags such as is_gift, is_first_order, and channel_type can live in dim_order_flags. order_number can remain as a degenerate dimension in fact_sales_line.',
          productionContext: 'These patterns keep fact tables understandable without creating dozens of tiny dimensions or bloating facts with repeated descriptive columns.',
          architectureRelevance: 'Gold dimensional models should balance usability, performance, and semantic clarity for Fabric/Power BI consumers.',
          azureUsage: 'Fabric Warehouse or Synapse Gold marts can expose junk dimensions and degenerate identifiers for easier slicing and drill-through.',
          databricksUsage: 'Databricks can derive junk dimensions during Gold transformation and preserve order_number in facts for lineage/drill-through.',
          performanceConsiderations: 'Avoid over-normalizing tiny flags into many joins. A compact junk dimension can reduce semantic model clutter.',
          interviewAngle: 'When would you use a junk dimension or a degenerate dimension?',
          commonMistake: 'Creating separate dimensions for every low-cardinality flag or removing order numbers needed for traceability.',
          seniorEngineerNote: 'Use junk dimensions for grouped flags; keep transaction identifiers as degenerate dimensions when they support drill-through but have no descriptive attributes.',
          practiceTask: 'Model order flags and order number for a sales fact table.',
          hint: 'Flags often belong together; transaction numbers often stay in the fact.',
          solution: 'Create dim_order_flags(flag_key, is_gift, is_first_order, channel_type). Store order_number directly in fact_sales_line as a degenerate dimension.',
          syntax: `dim_order_flags(flag_key, is_gift, is_first_order, channel_type)
fact_sales_line(order_number, flag_key, date_key, product_key, net_sales)`,
          example: 'Customer support drills from a dashboard total to a specific order_number without joining another order header dimension.',
          expectedOutput: 'A cleaner star schema with fewer unnecessary dimensions and better drill-through support.',
        }),
      ],
    },
  ],
  miniProject: {
    title: 'Retail Sales Dimensional Warehouse',
    goal: 'Design a Gold-layer dimensional model for sales analytics that can survive customer address changes and product hierarchy updates.',
    tasks: [
      'Declare the grain for fact_sales_line.',
      'Design dim_customer with SCD Type 2 fields.',
      'Design conformed dim_product and dim_date.',
      'Define additive, semi-additive, and non-additive measures.',
      'Write reconciliation checks for revenue and row counts.',
    ],
    expectedOutput: 'A star schema design document with table definitions, grain declaration, SCD2 strategy, and dashboard validation checks.',
  },
  interviewQuestions: [
    { question: 'What is the grain of a fact table?', answer: 'The exact business event represented by one row. It must be declared before measures or dimensions are added.' },
    { question: 'Why do surrogate keys matter in SCD2?', answer: 'They let facts join to the exact historical dimension version while keeping source natural keys as attributes.' },
    { question: 'How do you prevent duplicate revenue in BI?', answer: 'Model facts at the correct grain, avoid many-to-many joins, define measures from base facts, and add reconciliation tests.' },
  ],
};

function normalizeDataModelingLesson(lesson) {
  const title = lesson.title || 'this modeling pattern';
  return {
    ...lesson,
    azureUsage:
      lesson.azureUsage ??
      `In Azure, ${title} is applied when shaping Gold models for Synapse, Fabric Warehouse, and Power BI semantic models that need stable joins and trusted measures.`,
    databricksUsage:
      lesson.databricksUsage ??
      `In Databricks lakehouse projects, ${title} helps turn Silver conformed data into Gold facts, dimensions, and governed marts for BI consumption.`,
    performanceConsiderations:
      lesson.performanceConsiderations ??
      lesson.performanceTip ??
      `Check how ${title} affects join paths, semantic model size, partition strategy, and query cost before publishing it broadly.`,
    performanceTip:
      lesson.performanceTip ??
      lesson.performanceConsiderations ??
      `Validate grain, filter paths, and dimensional joins early so ${title} stays fast and trustworthy in reporting workloads.`,
    resumeTips:
      lesson.resumeTips ??
      lesson.resumeFraming ??
      `Explain how you used ${title} to design a trustworthy warehouse or lakehouse model that improved Power BI, Fabric, or Databricks reporting outcomes.`,
  };
}

dataModelingModule.sections = dataModelingModule.sections.map((section) => ({
  ...section,
  subtopics: section.subtopics.map(normalizeDataModelingLesson),
}));
