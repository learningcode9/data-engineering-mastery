export const dbtModule = {
  documentationMapping: [
    {
      concept: 'ELT and the analytics engineering model',
      officialSource: 'dbt Documentation — What is dbt?',
      sourceUrl: 'https://docs.getdbt.com/docs/introduction',
      howThisLessonUsesIt: 'The "T in ELT" framing, the distinction from ETL tools, and the analytics engineering role are explained using dbt\'s own product documentation language and positioning.',
    },
    {
      concept: 'Model materializations (view, table, incremental, ephemeral)',
      officialSource: 'dbt Docs — Materializations',
      sourceUrl: 'https://docs.getdbt.com/docs/build/materializations',
      howThisLessonUsesIt: 'The four materialization types, their performance trade-offs, the is_incremental() macro pattern, and merge vs append strategies are taught exactly as documented in the official materializations guide.',
    },
    {
      concept: 'source() and ref() functions',
      officialSource: 'dbt Docs — Sources',
      sourceUrl: 'https://docs.getdbt.com/docs/build/sources',
      howThisLessonUsesIt: 'The schema.yml source declaration syntax, source() call in models, freshness checks, and ref() dependency graph resolution follow the official dbt sources and refs documentation.',
    },
    {
      concept: 'dbt generic and singular tests',
      officialSource: 'dbt Docs — Data Tests',
      sourceUrl: 'https://docs.getdbt.com/docs/build/data-tests',
      howThisLessonUsesIt: 'Built-in generic tests (unique, not_null, relationships, accepted_values), schema.yml test syntax, and custom singular test SQL files match the official dbt testing documentation.',
    },
    {
      concept: 'Snapshots for SCD Type 2',
      officialSource: 'dbt Docs — Snapshots',
      sourceUrl: 'https://docs.getdbt.com/docs/build/snapshots',
      howThisLessonUsesIt: 'Snapshot config block (strategy, unique_key, updated_at), the dbt_scd_id surrogate key, and dbt_valid_from / dbt_valid_to fields come directly from the official dbt snapshots reference.',
    },
    {
      concept: 'Jinja templating and macros',
      officialSource: 'dbt Docs — Jinja & Macros',
      sourceUrl: 'https://docs.getdbt.com/docs/build/jinja-macros',
      howThisLessonUsesIt: 'The {{ macro() }} call syntax, macro definition in the macros/ directory, and the use of dbt-utils package macros follow the official Jinja & Macros guide.',
    },
  ],
  sections: [
    {
      title: 'dbt Foundations',
      subtopics: [
        {
          id: 'dbt-what-is-dbt',
          title: 'What is dbt and Why It Matters',
          difficulty: 'Beginner',
          explanation: 'dbt (data build tool) is an open-source CLI that lets you write transformation logic as SQL SELECT statements — dbt wraps them in CREATE TABLE AS or CREATE VIEW AS, resolves dependencies, runs tests, and generates documentation automatically. dbt implements the T in ELT: it runs inside the data warehouse, transforming data that has already been loaded.',
          why: 'Before dbt, SQL transformations lived in scattered stored procedures, Airflow BashOperators, and handwritten scripts with no lineage, no tests, and no shared docs. dbt centralises transformation in version-controlled .sql files, adds automated testing, generates a lineage DAG, and deploys in one command. The result: a transformation layer that behaves like software — reviewable, testable, and observable.',
          syntax: `# Project structure
my_dbt_project/
├── dbt_project.yml       # Project config: name, version, profile, model paths
├── profiles.yml          # Connection config: credentials (outside repo)
├── models/
│   ├── staging/          # One model per source table — minimal transforms
│   ├── intermediate/     # Business logic joins and aggregations
│   └── marts/            # Final tables consumed by BI and analysts
├── tests/                # Custom singular test files
├── macros/               # Reusable Jinja/SQL functions
├── snapshots/            # SCD Type 2 tracking
└── seeds/                # Static CSV files loaded as tables

# Core commands
dbt run               # Execute all models
dbt test              # Run all tests
dbt docs generate     # Build documentation site
dbt docs serve        # Serve docs locally
dbt snapshot          # Run snapshot models
dbt compile           # Show compiled SQL without running
dbt source freshness  # Check ingestion recency`,
          example: `-- models/staging/stg_orders.sql
-- Staged orders: clean types, standardise names, no business logic

SELECT
    order_id::INT                    AS order_id,
    customer_id::INT                 AS customer_id,
    amount::DECIMAL(10,2)            AS amount,
    created_at::TIMESTAMP            AS created_at,
    UPPER(TRIM(status))              AS status,
    _fivetran_synced                 AS _source_loaded_at
FROM {{ source('raw', 'orders') }}
WHERE order_id IS NOT NULL`,
          expectedOutput: `Running with dbt=1.7.0

Found 12 models, 34 tests, 0 snapshots, 2 seeds, 5 sources

1 of 12 START sql view model staging.stg_orders ............... [RUN]
1 of 12 OK created sql view model staging.stg_orders .......... [CREATE VIEW 0.84s]
...
12 of 12 OK created sql table model marts.fct_orders .......... [CREATE TABLE 2.31s]

Completed successfully in 8.47 seconds.`,
          interview: {
            question: 'What is dbt and how does it fit into a modern data stack?',
            answer: 'dbt is the transformation layer in an ELT pipeline. You write SQL SELECT statements (models); dbt handles CREATE TABLE/VIEW, test execution, dependency ordering, and documentation. It sits between the ingestion layer (Fivetran/ADF/Kafka) and the consumption layer (Power BI/Looker). The modern stack: ingest raw data → load to warehouse → dbt transforms → serve to BI.',
          },
          practice: 'Explain the difference between ETL and ELT and where dbt sits in the ELT pattern. Why does running transforms inside the warehouse have advantages over a separate transformation cluster?',
          hint: 'ETL: transform before loading (Spark, pandas — separate compute). ELT: load raw first, transform inside the warehouse using SQL. dbt enables ELT because it pushes SQL to run inside warehouse compute — no separate cluster needed.',
          solution: `-- ETL: transform OUTSIDE the warehouse
# Spark/pandas: separate cluster, separate cost
df = spark.read.parquet("raw/orders")
df_clean = df.withColumn("status", F.upper(F.trim(F.col("status"))))
df_clean.write.parquet("transformed/orders")

-- ELT with dbt: transform INSIDE the warehouse
-- Step 1: load raw data (ADF / Fivetran / Airbyte)
-- Step 2: dbt transforms raw inside Snowflake/BigQuery/Databricks

-- models/staging/stg_orders.sql
SELECT order_id, customer_id, UPPER(TRIM(status)) AS status
FROM {{ source('raw', 'orders') }}

-- Advantages:
-- Warehouse compute is already paid for — no extra cluster cost
-- SQL is the native language — no serialisation overhead
-- All logic in version-controlled .sql files
-- dbt lineage graph shows exactly how each table was built`,
          seniorNote: 'The ELT shift happened because modern cloud warehouses (Snowflake, BigQuery, Redshift, Databricks SQL) became cheap enough that in-warehouse compute is more cost-effective than a separate transformation cluster. dbt makes that workflow production-grade by adding CI/CD, testing, and documentation to what would otherwise be untracked SQL scripts.',
        },
        {
          id: 'dbt-models',
          title: 'dbt Models and Materialisation',
          difficulty: 'Beginner',
          explanation: 'A dbt model is a .sql file containing a SELECT statement. dbt wraps it in CREATE TABLE AS or CREATE VIEW AS (based on materialisation config) and runs it against the warehouse. Every model in models/ becomes a table or view. The {{ ref() }} Jinja function creates an explicit dependency between models — dbt uses these to build a DAG and runs models in correct order.',
          why: 'Traditional SQL pipelines require manually creating tables in the right order, managing dependencies by hand. ref() declares dependencies implicitly — dbt builds the DAG automatically. Change the SQL in one model, and dbt knows which downstream models need to be rebuilt.',
          syntax: `-- Materialisation options (set in dbt_project.yml or inline config block)
-- view:        CREATE VIEW AS SELECT ...   (no data stored, always fresh)
-- table:       CREATE TABLE AS SELECT ...  (data stored, rebuilt each run)
-- incremental: Only processes new rows since last run
-- ephemeral:   CTE injected inline — no object created in warehouse

-- Inline config block:
{{ config(
    materialized='table',
    schema='marts',
    tags=['daily', 'finance']
) }}

SELECT ...

-- Reference another dbt model (creates DAG dependency):
FROM {{ ref('stg_orders') }}

-- Reference a raw source table (loaded by ingestion):
FROM {{ source('raw_shopify', 'orders') }}`,
          example: `-- models/intermediate/int_orders_with_customers.sql
{{ config(materialized='view') }}

SELECT
    o.order_id,
    o.amount,
    o.status,
    o.created_at,
    c.customer_name,
    c.city,
    c.segment
FROM {{ ref('stg_orders') }} o
LEFT JOIN {{ ref('stg_customers') }} c
    ON o.customer_id = c.customer_id`,
          expectedOutput: `-- dbt compile shows the resolved SQL sent to the warehouse:
CREATE OR REPLACE VIEW analytics.int_orders_with_customers AS (
  SELECT
      o.order_id, o.amount, o.status, o.created_at,
      c.customer_name, c.city, c.segment
  FROM analytics.stg_orders o
  LEFT JOIN analytics.stg_customers c ON o.customer_id = c.customer_id
)`,
          interview: {
            question: 'What is the difference between table and view materialisation in dbt?',
            answer: 'View: dbt creates a view — no data stored, the SELECT re-executes every time the view is queried. Fast to build, but slow for BI tools on large underlying tables. Table: dbt runs CREATE TABLE AS SELECT — data physically stored and precomputed. Query performance is fast but rebuild time increases with volume. For Gold/mart tables read by Power BI, use table. For intermediate joins nobody queries directly, view is fine. Incremental extends table materialisation to process only new records.',
          },
          practice: 'Create a dbt model called int_revenue_by_day that joins stg_orders and stg_customers, groups by date and city, and computes total_revenue and order_count. Use table materialisation.',
          hint: 'Use {{ ref() }} for both staging models. GROUP BY created_at::DATE, city. Materialise as table since this feeds Power BI.',
          solution: `-- models/intermediate/int_revenue_by_day.sql
{{ config(materialized='table') }}

SELECT
    o.created_at::DATE      AS order_date,
    c.city,
    COUNT(o.order_id)       AS order_count,
    SUM(o.amount)           AS total_revenue,
    AVG(o.amount)           AS avg_order_value
FROM {{ ref('stg_orders') }} o
LEFT JOIN {{ ref('stg_customers') }} c
    ON o.customer_id = c.customer_id
WHERE o.status != 'cancelled'
GROUP BY 1, 2`,
          seniorNote: 'The materialisation choice is a performance contract. Views defer cost to query time — every Power BI refresh re-executes the view SQL. Tables shift cost to build time — a 5-minute dbt run precomputes results once, amortised across 50 analyst queries. Rule: materialise at the boundary between dbt and BI consumers. Ephemeral models are a code-DRY tool, not a performance optimisation — they compile to CTEs and can bloat generated SQL.',
        },
        {
          id: 'dbt-layer-structure',
          title: 'Staging / Intermediate / Mart Layers',
          difficulty: 'Intermediate',
          explanation: `Standard dbt project structure uses three layers:
1. Staging (stg_): One model per source table. Cast types, rename columns, deduplicate, add audit columns. No business logic. This is where source quirks are isolated.
2. Intermediate (int_): Business logic. Joins across staging models, business rules, derived columns. Not exposed directly to BI.
3. Marts (fct_/dim_): Final tables consumed by BI. Fact tables (fct_orders) and dimensions (dim_customers). Optimised for query performance.`,
          why: 'Layering separates concerns. When a source renames a column, you fix one staging model — not 20 mart models. When a business rule changes, you update one intermediate model. The lineage graph shows the impact of each change. Without layers, you end up with one 400-line mart model that nobody can test, document, or safely modify.',
          syntax: `models/
├── staging/
│   ├── _sources.yml          # Raw source definitions + freshness checks
│   ├── _staging.yml          # Docs and tests for staging models
│   ├── stg_orders.sql        # SELECT from source('raw', 'orders')
│   └── stg_customers.sql
├── intermediate/
│   ├── int_orders_enriched.sql       # Join orders + customers
│   └── int_customer_lifetime.sql     # Aggregate to customer-level
└── marts/
    ├── finance/
    │   └── fct_orders.sql            # Grain: one row per order
    └── marketing/
        └── dim_customers.sql         # Customer dimension`,
          example: `-- models/staging/stg_customers.sql  (source isolation)
SELECT
    customer_id,
    TRIM(LOWER(email))               AS email,
    signup_date::DATE                AS signup_date,
    CASE status
        WHEN 'A' THEN 'active'
        WHEN 'I' THEN 'inactive'
        ELSE 'unknown'
    END                              AS status
FROM {{ source('shopify', 'customers') }}

-- models/marts/dim_customers.sql  (final dimension)
{{ config(materialized='table') }}

SELECT
    c.customer_id,
    c.email,
    c.status,
    c.signup_date,
    DATEDIFF('day', c.signup_date, CURRENT_DATE) AS days_since_signup,
    COALESCE(ltv.lifetime_value, 0)              AS lifetime_value
FROM {{ ref('stg_customers') }} c
LEFT JOIN {{ ref('int_customer_lifetime') }} ltv
    ON c.customer_id = ltv.customer_id`,
          expectedOutput: `-- Lineage in dbt docs:
raw.shopify.customers
    └── stg_customers  [view, staging]
            └── int_customer_lifetime  [view, intermediate]
                    └── dim_customers  [table, marts] ← Power BI connects here`,
          interview: {
            question: 'Why separate staging, intermediate, and mart layers instead of writing one big model per business table?',
            answer: 'Separation of concerns: staging isolates each source\'s quirks — if Shopify renames a column, you fix stg_customers, not all 20 mart models referencing it. Intermediate holds reusable business logic — customer LTV defined once, referenced by multiple marts. Marts serve specific consumer needs. The DAG makes cross-cutting impact visible: change stg_orders and dbt shows every downstream model affected. Without layers, you end up with one 400-line mart that is impossible to test, document, or debug safely.',
          },
          practice: 'Sketch the staging → intermediate → mart structure for a "revenue by customer segment" use case. Name at least 3 staging models, 1 intermediate, and 1 mart. Explain what each does.',
          hint: 'stg_orders, stg_customers, stg_products → int_orders_enriched (join all three, add segment) → fct_revenue_by_segment (aggregate to day-segment grain).',
          solution: `-- stg_orders.sql: clean order_id, customer_id, amount, status from raw
-- stg_customers.sql: clean customer_id, segment, city, signup_date from raw
-- stg_products.sql: clean product_id, category, price from raw

-- int_orders_enriched.sql:
SELECT o.*, c.segment, c.city, p.category
FROM {{ ref('stg_orders') }} o
JOIN {{ ref('stg_customers') }} c ON o.customer_id = c.customer_id
JOIN {{ ref('stg_products') }} p ON o.product_id = p.product_id

-- marts/finance/fct_revenue_by_segment.sql
{{ config(materialized='table') }}
SELECT
    created_at::DATE  AS order_date,
    segment,
    COUNT(order_id)   AS order_count,
    SUM(amount)       AS revenue
FROM {{ ref('int_orders_enriched') }}
WHERE status NOT IN ('cancelled', 'refunded')
GROUP BY 1, 2`,
          seniorNote: 'Senior engineers add an implicit fourth boundary: the source() macro references raw tables loaded by Fivetran/ADF, keeping that boundary explicit. Some teams add a "base" layer between raw and staging for heavy denormalisation. The key insight: each layer transition should have a single, testable responsibility. If a model both cleans source data AND applies business rules, split it.',
        },
      ],
    },
    {
      title: 'Core dbt Features',
      subtopics: [
        {
          id: 'dbt-sources-refs',
          title: 'Sources and refs',
          difficulty: 'Beginner',
          explanation: `Two key Jinja functions power dbt dependency management:
1. {{ source('source_name', 'table_name') }}: References a raw table loaded by ingestion. Defined in _sources.yml. Enables freshness checks.
2. {{ ref('model_name') }}: References another dbt model — creates a DAG dependency and handles cross-environment schema resolution automatically.`,
          why: 'Without ref(), you hardcode table names like analytics.stg_orders — which breaks when schemas differ between dev and prod. ref() is dynamic: in dev, {{ ref("stg_orders") }} resolves to dev_yourname.stg_orders; in prod, analytics.stg_orders. This one pattern enables isolated developer schemas without conflicts.',
          syntax: `-- _sources.yml: define raw source tables
version: 2
sources:
  - name: raw_shopify
    database: raw_db
    schema: shopify
    freshness:
      warn_after: {count: 12, period: hour}
      error_after: {count: 24, period: hour}
    tables:
      - name: orders
        loaded_at_field: _fivetran_synced
        columns:
          - name: order_id
            tests: [unique, not_null]

-- Reference a source in a model:
FROM {{ source('raw_shopify', 'orders') }}

-- Reference a dbt model:
FROM {{ ref('stg_orders') }}

-- Run a model and all its upstream dependencies:
dbt run --select +dim_customers

-- Check source freshness:
dbt source freshness`,
          example: `-- models/staging/_sources.yml
version: 2
sources:
  - name: raw
    schema: raw
    tables:
      - name: orders
        freshness:
          warn_after: {count: 6, period: hour}
        loaded_at_field: created_at
      - name: customers
      - name: products

-- models/staging/stg_orders.sql
SELECT order_id, customer_id, amount, status, created_at
FROM {{ source('raw', 'orders') }}
WHERE order_id IS NOT NULL

-- models/intermediate/int_orders_enriched.sql
SELECT
    o.order_id, o.amount,
    c.customer_name, c.segment
FROM {{ ref('stg_orders') }} o
JOIN {{ ref('stg_customers') }} c ON o.customer_id = c.customer_id`,
          expectedOutput: `dbt source freshness

Found 3 sources.

1 of 3 PASS freshness of raw.orders ............ [PASS, last loaded 2h ago]
2 of 3 PASS freshness of raw.customers ......... [PASS, last loaded 2h ago]
3 of 3 WARN freshness of raw.products .......... [WARN, last loaded 8h ago]

Done. PASS=2 WARN=1 ERROR=0.`,
          interview: {
            question: 'What is the difference between source() and ref() in dbt?',
            answer: 'source() references raw tables loaded by the ingestion layer (Fivetran, ADF, Airbyte) — tables dbt did not create. ref() references another dbt model — creates a DAG dependency. source() enables freshness checks to alert when ingestion is delayed. ref() enables multi-environment schema resolution — dev vs prod schemas resolve automatically. Never hardcode table names; always use source() or ref().',
          },
          practice: 'Write a _sources.yml defining a "crm" source with tables contacts and deals. Add a freshness check on deals: warn after 8 hours, error after 24 hours. Then write stg_deals.sql selecting from it.',
          hint: 'Include loaded_at_field for freshness. Reference with {{ source("crm", "deals") }}.',
          solution: `-- models/staging/_sources.yml
version: 2
sources:
  - name: crm
    schema: raw_crm
    tables:
      - name: contacts
      - name: deals
        loaded_at_field: _fivetran_synced
        freshness:
          warn_after: {count: 8, period: hour}
          error_after: {count: 24, period: hour}

-- models/staging/stg_deals.sql
SELECT
    deal_id,
    contact_id,
    deal_name,
    amount::DECIMAL(12,2)   AS amount,
    stage,
    close_date::DATE        AS close_date,
    created_at
FROM {{ source('crm', 'deals') }}
WHERE deal_id IS NOT NULL`,
          seniorNote: 'Run dbt source freshness as the first step in your Airflow DAG — before any dbt run. If freshness errors, the ingestion layer is delayed and you should halt the transformation run entirely. This prevents dbt from producing "fresh-looking" Gold tables built on stale source data — a silent failure that is worse than a visible pipeline error.',
        },
        {
          id: 'dbt-tests',
          title: 'dbt Tests',
          difficulty: 'Intermediate',
          explanation: `dbt has two test categories:
1. Generic (built-in): not_null, unique, accepted_values, relationships. Declared in schema .yml files. Run with dbt test.
2. Singular: custom .sql files in tests/. If the query returns ANY rows, the test fails. Used for business-rule assertions.`,
          why: 'Data quality checks in dbt are first-class citizens — they run automatically in CI, flag broken data before it reaches analysts, and live alongside the SQL that produced the data. A model with zero tests is an untested assumption running in production. Senior engineers treat test coverage as a first-class metric.',
          syntax: `-- models/staging/_staging.yml (generic tests)
version: 2
models:
  - name: stg_orders
    columns:
      - name: order_id
        tests: [unique, not_null]
      - name: status
        tests:
          - accepted_values:
              values: ['pending', 'processing', 'shipped', 'delivered', 'cancelled']
      - name: customer_id
        tests:
          - relationships:
              to: ref('stg_customers')
              field: customer_id

-- Singular test: tests/assert_positive_amounts.sql
-- Returns rows = FAIL. Returns 0 rows = PASS
SELECT * FROM {{ ref('stg_orders') }}
WHERE amount <= 0

-- Run tests:
dbt test
dbt test --select stg_orders     # single model
dbt test --store-failures        # write failing rows to a table`,
          example: `-- models/marts/_marts.yml
version: 2
models:
  - name: fct_orders
    description: "One row per order. Grain: order_id."
    columns:
      - name: order_id
        tests: [unique, not_null]
      - name: customer_id
        tests:
          - not_null
          - relationships:
              to: ref('dim_customers')
              field: customer_id
      - name: status
        tests:
          - accepted_values:
              values: ['pending','processing','shipped','delivered','cancelled']

-- tests/assert_no_future_orders.sql
SELECT order_id, created_at
FROM {{ ref('fct_orders') }}
WHERE created_at > CURRENT_TIMESTAMP`,
          expectedOutput: `dbt test

1 of 8 PASS not_null_fct_orders_order_id .................. [PASS 0.43s]
2 of 8 PASS unique_fct_orders_order_id .................... [PASS 0.51s]
3 of 8 FAIL relationships_fct_orders_customer_id .......... [FAIL 3 in 0.61s]
  Failure: 3 rows in fct_orders have customer_id not found in dim_customers

PASS=7 FAIL=1`,
          interview: {
            question: 'How does dbt testing differ from Python unit testing in a pipeline?',
            answer: 'Python unit tests mock data to verify logic in isolation. dbt tests run on actual materialised tables in the warehouse — they test data reality, not code logic. A dbt unique test literally runs SELECT COUNT(*) - COUNT(DISTINCT id) on the real table. This catches data quality issues that unit tests cannot: a model can be logically correct SQL but produce duplicate IDs due to an unexpected join fan-out. dbt tests are SQL assertions on real data. Fail CI on any error-severity test failure.',
          },
          practice: 'Write schema.yml test definitions for dim_customers: customer_id is unique and not_null, email is not_null, status is one of active/inactive/churned. Also write a singular test catching customers with future signup_dates.',
          hint: 'Generic tests in _marts.yml. Singular test is a .sql file in tests/ returning failing rows.',
          solution: `-- models/marts/_marts.yml
version: 2
models:
  - name: dim_customers
    columns:
      - name: customer_id
        tests: [unique, not_null]
      - name: email
        tests: [not_null]
      - name: status
        tests:
          - accepted_values:
              values: ['active', 'inactive', 'churned']

-- tests/assert_no_future_signup_dates.sql
SELECT customer_id, signup_date
FROM {{ ref('dim_customers') }}
WHERE signup_date > CURRENT_DATE`,
          seniorNote: 'Test severity matters in production. Use error (default) for PK uniqueness and not_null on critical columns — these halt the pipeline. Use warn for referential integrity on optional foreign keys. In dbt_project.yml, set +store_failures: true for all tests so failing rows go to a separate table, making root-cause analysis instant without re-running. Block CI merges only on error-severity failures.',
        },
        {
          id: 'dbt-docs-lineage',
          title: 'Documentation and Lineage',
          difficulty: 'Intermediate',
          explanation: 'dbt docs generate builds a documentation website from YAML descriptions plus auto-generated model metadata. It includes a data lineage DAG showing every model from raw sources to marts. Column descriptions, test coverage, and model owners are all part of the generated docs.',
          why: 'Documentation solves the "who owns this table?" and "what does revenue mean?" problems at scale. When the finance team asks why March revenue differs from April, a documented dbt project shows exactly which model computes revenue, which columns it uses, and every upstream dependency. Without docs, every DE team accumulates SQL files only the original author understands.',
          syntax: `-- models/marts/_marts.yml (documentation)
version: 2
models:
  - name: fct_orders
    description: >
      One row per confirmed order. Excludes cancelled orders.
      Revenue is order amount before tax. Used by: Finance dashboard.
    meta:
      owner: analytics-engineering
      tags: [finance, daily]
    columns:
      - name: order_id
        description: "Unique order identifier from Shopify — PK"
      - name: amount
        description: "Order total in USD, pre-tax, pre-shipping"

# Generate and serve docs:
dbt docs generate
dbt docs serve --port 8080`,
          example: `-- Full schema.yml with docs + tests:
version: 2
models:
  - name: fct_daily_revenue
    description: >
      Daily revenue by segment. Grain: (order_date, segment).
      Rebuilt 07:00 UTC daily. Consumed by: Finance dashboard,
      Executive weekly review. Excludes cancelled/refunded orders.
    meta:
      owner: analytics-engineering
      slack_channel: "#data-alerts"
    columns:
      - name: order_date
        description: "Calendar date in UTC"
        tests: [not_null]
      - name: segment
        description: "Customer segment: enterprise, mid-market, smb"
        tests:
          - not_null
          - accepted_values:
              values: ['enterprise', 'mid-market', 'smb']
      - name: revenue
        description: "Sum of confirmed order amounts in USD"
        tests: [not_null]`,
          expectedOutput: `dbt docs generate
Generating manifest file...
Generating catalog file...
Documentation written to /target/catalog.json

dbt docs serve
Serving docs at http://localhost:8080
Lineage graph: 12 models, 5 sources visible.`,
          interview: {
            question: 'How does dbt lineage help debug a data quality issue in a Gold table?',
            answer: 'The lineage graph shows every upstream model and source. Click backwards: Gold mart → intermediate model → staging models → raw sources. At each hop, run the model SQL directly and check where bad data enters. Lineage also shows which downstream models are affected by a proposed change — preventing regressions. Without lineage, debugging cross-model issues means reading dozens of SQL files and reconstructing dependencies manually.',
          },
          practice: 'Write the documentation YAML for a model fct_daily_revenue. Include model description (grain, refresh schedule, consumers), column docs for order_date/segment/revenue, and tests for each column.',
          hint: 'Use the > block syntax for multi-line descriptions. Include meta.owner. Add not_null on all columns and accepted_values on segment.',
          solution: `-- models/marts/_marts.yml
version: 2
models:
  - name: fct_daily_revenue
    description: >
      Daily revenue by segment. Grain: (order_date, segment).
      Rebuilt 07:00 UTC. Consumers: Finance dashboard, exec review.
      Revenue excludes cancelled and refunded orders.
    meta:
      owner: analytics-engineering
    columns:
      - name: order_date
        description: "Calendar date of orders (UTC)"
        tests: [not_null]
      - name: segment
        description: "Customer segment — enterprise, mid-market, smb"
        tests:
          - not_null
          - accepted_values:
              values: ['enterprise', 'mid-market', 'smb']
      - name: revenue
        description: "Sum of confirmed order amounts (USD, exc. cancelled)"
        tests: [not_null]`,
          seniorNote: 'In dbt Cloud, configure an exposures file listing the Power BI reports and ML models that consume each mart. The lineage graph then extends from raw source all the way to the dashboard — column-level lineage that enterprise governance teams require. Treat a model without a description as a code review blocker, the same as an undocumented API endpoint.',
        },
      ],
    },
    {
      title: 'Advanced dbt Patterns',
      subtopics: [
        {
          id: 'dbt-snapshots',
          title: 'Snapshots (SCD Type 2)',
          difficulty: 'Intermediate',
          explanation: 'dbt Snapshots implement SCD Type 2 automatically. On each run, dbt compares the current source result to the previous snapshot. Changed rows: the current record gets dbt_valid_to = now (closed), a new record is inserted with dbt_valid_from = now and dbt_valid_to = NULL. New rows: inserted with dbt_valid_from = now. Unchanged rows: no action.',
          why: 'SCD2 is critical for historical accuracy: "What was this customer\'s segment on the date of that order?" Without SCD2, you only have the current value — historical queries are wrong. dbt handles the entire SCD2 mechanics; you just write the SELECT and specify the strategy.',
          syntax: `-- snapshots/customers_snapshot.sql
{% snapshot customers_snapshot %}

{{
    config(
      target_schema='snapshots',
      unique_key='customer_id',
      strategy='timestamp',        -- use 'check' if no updated_at column
      updated_at='updated_at',
      invalidate_hard_deletes=True
    )
}}

SELECT customer_id, customer_name, email, segment, city, updated_at
FROM {{ source('raw', 'customers') }}

{% endsnapshot %}

-- dbt adds automatically:
-- dbt_scd_id:       unique ID per snapshot row
-- dbt_valid_from:   when this version became active
-- dbt_valid_to:     when superseded (NULL = current)`,
          example: `-- Point-in-time query: what segment was customer 42 on 2024-01-15?
SELECT customer_id, segment, dbt_valid_from, dbt_valid_to
FROM analytics.customers_snapshot
WHERE customer_id = 42
  AND dbt_valid_from <= '2024-01-15'
  AND (dbt_valid_to > '2024-01-15' OR dbt_valid_to IS NULL)

-- Join snapshot to fact for accurate historical attribution:
SELECT
    o.order_id,
    o.amount,
    c.segment AS segment_at_order_time
FROM {{ ref('fct_orders') }} o
JOIN analytics.customers_snapshot c
    ON  o.customer_id = c.customer_id
    AND o.created_at >= c.dbt_valid_from
    AND (o.created_at < c.dbt_valid_to OR c.dbt_valid_to IS NULL)`,
          expectedOutput: `-- customer_id=42 history:
customer_id | segment     | dbt_valid_from      | dbt_valid_to
42          | smb         | 2023-01-01 00:00:00 | 2023-11-15 02:00:00
42          | mid-market  | 2023-11-15 02:00:00 | 2024-03-01 02:00:00
42          | enterprise  | 2024-03-01 02:00:00 | NULL  (current)`,
          interview: {
            question: 'How does dbt snapshot implement SCD Type 2 and what strategies does it support?',
            answer: 'A snapshot compares the current source SELECT to its previous snapshot state. On each run: unchanged rows — no action. Changed rows — close the current record (dbt_valid_to = now), insert a new record (dbt_valid_from = now, dbt_valid_to = NULL). Two strategies: timestamp (use updated_at column — efficient) and check (hash all monitored columns, compare hashes — use when source has no updated_at). invalidate_hard_deletes: true marks source-deleted rows with dbt_valid_to instead of leaving orphaned "current" records.',
          },
          practice: 'Write a snapshot for a products table tracking price and category changes. Products have an updated_at timestamp. Write a query showing the price of product_id=5 on 2024-06-01.',
          hint: 'strategy="timestamp", updated_at="updated_at". Point-in-time query: dbt_valid_from <= date AND (dbt_valid_to > date OR dbt_valid_to IS NULL).',
          solution: `-- snapshots/products_snapshot.sql
{% snapshot products_snapshot %}
{{
    config(
      target_schema='snapshots',
      unique_key='product_id',
      strategy='timestamp',
      updated_at='updated_at'
    )
}}
SELECT product_id, product_name, category, price, updated_at
FROM {{ source('raw', 'products') }}
{% endsnapshot %}

-- Point-in-time price on 2024-06-01:
SELECT product_id, product_name, price, category
FROM analytics.products_snapshot
WHERE product_id = 5
  AND dbt_valid_from <= '2024-06-01'
  AND (dbt_valid_to > '2024-06-01' OR dbt_valid_to IS NULL)`,
          seniorNote: 'Snapshot performance degrades at scale — each run compares the full source result against all existing snapshot records. On a 100M-row customer table, this is expensive. Optimisations: filter the snapshot SELECT to only recently modified rows if the warehouse has a reliable updated_at; partition the snapshot table by year_month. For very large tables, a custom incremental model with explicit MERGE and dbt_valid_from/dbt_valid_to gives more control at the cost of more code.',
        },
        {
          id: 'dbt-incremental-models',
          title: 'Incremental Models',
          difficulty: 'Intermediate',
          explanation: 'An incremental model only processes new/changed records each run. On first run it behaves like a table materialisation (full load). On subsequent runs, the is_incremental() block filters the source to records newer than MAX(timestamp) of the existing table, which are then appended or merged.',
          why: 'Full table rebuilds become impractical at scale. A 5-billion-row event table rebuilt daily would take hours. Incremental processes only yesterday\'s new events — 100× faster. This is the standard pattern for all large fact tables in production dbt projects.',
          syntax: `{{ config(
    materialized='incremental',
    unique_key='event_id',           -- enables MERGE (upsert) instead of append
    incremental_strategy='merge',
    on_schema_change='append_new_columns'
) }}

SELECT event_id, user_id, event_type, created_at
FROM {{ source('raw', 'events') }}

{% if is_incremental() %}
    -- Only runs on incremental runs (not first run or --full-refresh)
    WHERE created_at > (SELECT MAX(created_at) FROM {{ this }})
{% endif %}

-- Force a full rebuild:
dbt run --select fct_events --full-refresh`,
          example: `-- models/marts/fct_page_views.sql
{{ config(
    materialized='incremental',
    unique_key='page_view_id',
    incremental_strategy='merge',
    on_schema_change='append_new_columns'
) }}

SELECT
    page_view_id,
    user_id,
    page_url,
    session_id,
    viewed_at::TIMESTAMP   AS viewed_at,
    duration_secs
FROM {{ source('raw', 'page_view_events') }}

{% if is_incremental() %}
    WHERE viewed_at > (
        SELECT DATEADD('hour', -2, MAX(viewed_at))  -- 2hr lookback for late arrivals
        FROM {{ this }}
    )
{% endif %}`,
          expectedOutput: `-- First run:
  CREATE TABLE analytics.fct_page_views AS SELECT ...
  Rows inserted: 42,000,000  (full history)

-- Subsequent run:
  MERGE INTO analytics.fct_page_views USING (...)
  Rows merged: 1,847,432  (yesterday's events only)
  Runtime: 23 seconds  (vs 18 minutes for full rebuild)`,
          interview: {
            question: 'What does is_incremental() do in a dbt model?',
            answer: 'is_incremental() returns True when the model already exists as a table and is running in incremental mode (not --full-refresh). The SQL inside {% if is_incremental() %} typically adds a WHERE clause filtering to records newer than the existing table\'s MAX timestamp. On first run (no existing table) or --full-refresh, is_incremental() is False and the WHERE clause is omitted — processing all records. The same model file handles full and incremental correctly without separate logic.',
          },
          practice: 'Write an incremental model fct_orders with a 25-hour lookback buffer for late-arriving orders. Use merge strategy with order_id as the unique key.',
          hint: 'WHERE created_at > (SELECT DATEADD("hour", -25, MAX(created_at)) FROM {{ this }}). unique_key="order_id" with incremental_strategy="merge".',
          solution: `-- models/marts/fct_orders.sql
{{ config(
    materialized='incremental',
    unique_key='order_id',
    incremental_strategy='merge',
    on_schema_change='append_new_columns'
) }}

SELECT order_id, customer_id, amount, status, created_at, updated_at
FROM {{ ref('stg_orders') }}

{% if is_incremental() %}
    WHERE created_at > (
        SELECT DATEADD('hour', -25, MAX(created_at))
        FROM {{ this }}
    )
{% endif %}`,
          seniorNote: 'Incremental models have silent failure modes. Late-arriving data outside the lookback window is skipped forever. Schema changes in the source are not picked up without --full-refresh. In production: run weekly --full-refresh on non-critical tables, quarterly on large facts during maintenance windows. Document the lookback window in the model description — it defines the late-data SLA that downstream consumers must understand.',
        },
        {
          id: 'dbt-macros',
          title: 'Macros and Jinja Templating',
          difficulty: 'Advanced',
          explanation: 'dbt macros are reusable Jinja functions in .sql files under macros/. They generate SQL at compile time. Common uses: DRY patterns (deduplication, audit columns), dynamic SQL generation, and cross-database compatibility.',
          why: 'Without macros, teams copy-paste the same deduplication CTE or audit column logic across dozens of models. When the logic changes, every copy must be updated. A macro centralises the pattern — change once, all models update on next dbt run.',
          syntax: `-- macros/deduplicate.sql
{% macro deduplicate(relation, partition_by, order_by) %}
    SELECT * FROM (
        SELECT *, ROW_NUMBER() OVER (
            PARTITION BY {{ partition_by }}
            ORDER BY {{ order_by }} DESC
        ) AS _row_num
        FROM {{ relation }}
    ) ranked
    WHERE _row_num = 1
{% endmacro %}

-- Use in a model:
{{ deduplicate(ref('stg_orders'), 'order_id', 'updated_at') }}

-- macros/audit_columns.sql
{% macro audit_columns() %}
    CURRENT_TIMESTAMP()    AS _dbt_loaded_at,
    '{{ invocation_id }}' AS _dbt_run_id
{% endmacro %}`,
          example: `-- macros/cents_to_dollars.sql
{% macro cents_to_dollars(column_name, precision=2) %}
    ROUND({{ column_name }} / 100, {{ precision }})
{% endmacro %}

-- Use in model:
SELECT
    order_id,
    {{ cents_to_dollars('amount_cents') }}   AS amount_usd,
    {{ cents_to_dollars('tax_cents', 4) }}   AS tax_usd,
    {{ audit_columns() }}
FROM {{ source('raw', 'orders') }}`,
          expectedOutput: `-- Compiled SQL output:
SELECT
    order_id,
    ROUND(amount_cents / 100, 2)   AS amount_usd,
    ROUND(tax_cents / 100, 4)      AS tax_usd,
    CURRENT_TIMESTAMP()            AS _dbt_loaded_at,
    'abcd-1234-efgh'              AS _dbt_run_id
FROM raw.orders`,
          interview: {
            question: 'When would you write a dbt macro instead of repeating SQL in each model?',
            answer: 'When the same pattern appears in three or more models. Classic candidates: deduplication with ROW_NUMBER(), surrogate key generation from multiple columns, audit column additions, cents-to-dollars conversion, date spine generation. Rule: paste the same block twice → abstract; paste a third time → you have a bug waiting to happen. Also use macros for cross-database compatibility — one macro generates correct date_trunc syntax for both Snowflake and BigQuery.',
          },
          practice: 'Write a macro clean_string(col) that TRIMs and LOWERs a column. Use it in stg_customers.sql to clean email and city.',
          hint: 'The macro returns a SQL expression string. Call with {{ clean_string("email") }} AS email.',
          solution: `-- macros/clean_string.sql
{% macro clean_string(col) %}
    LOWER(TRIM({{ col }}))
{% endmacro %}

-- models/staging/stg_customers.sql
SELECT
    customer_id,
    {{ clean_string('email') }}    AS email,
    {{ clean_string('city') }}     AS city,
    status, signup_date
FROM {{ source('raw', 'customers') }}
-- Compiles to: LOWER(TRIM(email)) AS email`,
          seniorNote: 'dbt-utils is a dbt package (hub.getdbt.com) with battle-tested macros: generate_surrogate_key, get_column_values, pivot, date_spine. Install via packages.yml and dbt deps. Never write your own surrogate key macro from scratch — dbt_utils.generate_surrogate_key handles NULL values and cross-database hash differences that home-grown macros miss.',
        },
      ],
    },
    {
      title: 'dbt in Production',
      subtopics: [
        {
          id: 'dbt-cloud-vs-core',
          title: 'dbt Cloud vs dbt Core',
          difficulty: 'Intermediate',
          explanation: `dbt Core is the open-source CLI — free, runs anywhere, you manage scheduling and CI. dbt Cloud is the managed SaaS platform — adds scheduling, IDE, CI runner, audit logs, permissions, and hosted docs.
- dbt Core: pip install dbt-core, manage your own scheduler (Airflow/ADF/GitHub Actions), your own CI, your own docs hosting.
- dbt Cloud: ~$100+/month/seat, turn-key scheduling, built-in PR CI runs, browser IDE, auto-hosted docs, job observability dashboard.`,
          why: 'Most production dbt deployments use dbt Cloud for orchestration because running dbt Core via Airflow adds operational overhead. However, dbt Core in Airflow is common in organisations with complex inter-job dependencies (dbt runs after ADF + Fivetran + Spark jobs) or with existing Airflow expertise.',
          syntax: `-- dbt Cloud job (UI/API):
Job: "Daily Gold Rebuild"
  Schedule: 0 6 * * *
  Steps:
    - dbt source freshness
    - dbt run
    - dbt test
  Notifications: Slack #data-alerts on failure

-- dbt Core with Airflow:
with DAG('dbt_daily', schedule='0 6 * * *') as dag:
    freshness = BashOperator(task_id='freshness',
        bash_command='dbt source freshness --profiles-dir /profiles')
    run = BashOperator(task_id='run',
        bash_command='dbt run --profiles-dir /profiles')
    test = BashOperator(task_id='test',
        bash_command='dbt test --profiles-dir /profiles')
    freshness >> run >> test`,
          example: `-- profiles.yml for Snowflake (dbt Core)
my_dbt_project:
  target: dev
  outputs:
    dev:
      type: snowflake
      account: "{{ env_var('SNOWFLAKE_ACCOUNT') }}"
      user: "{{ env_var('SNOWFLAKE_USER') }}"
      private_key_path: ~/.snowflake/key.p8
      role: transformer
      database: analytics_dev
      warehouse: transforming_wh
      schema: "dbt_{{ env_var('DBT_USER', 'dev') }}"
      threads: 4
    prod:
      type: snowflake
      account: "{{ env_var('SNOWFLAKE_ACCOUNT') }}"
      user: "{{ env_var('SNOWFLAKE_USER') }}"
      private_key_path: /secrets/snowflake_key.p8
      role: transformer
      database: analytics
      warehouse: transforming_wh
      schema: analytics
      threads: 8`,
          expectedOutput: `-- dbt Cloud CI run on Pull Request:
PR #42: "Add fct_revenue_daily model"

dbt Cloud CI triggered:
✓ dbt compile — no SQL syntax errors
✓ dbt run --models state:modified+  — changed models + downstream only
✓ dbt test --models state:modified+  — tests for changed models only
✓ 3 tests passed. PR can be merged.`,
          interview: {
            question: 'When would you choose dbt Cloud over dbt Core with Airflow?',
            answer: 'dbt Cloud suits smaller teams (< 5 DEs) who do not want to maintain Airflow; analysts contributing SQL without a local Python env; teams needing turn-key PR CI without GitHub Actions setup. dbt Core in Airflow is better when you have complex inter-job dependencies (dbt runs after ADF + Spark + Fivetran); need custom retry logic; already have Airflow expertise; or run dbt against multiple warehouses. Large enterprises typically use dbt Core orchestrated via ADF, Airflow, or Prefect — dbt Cloud is most common at startups and mid-size companies.',
          },
          practice: 'Design the CI/CD workflow for a dbt project with dev, staging, and production environments. What commands run in each and what triggers them?',
          hint: 'Dev: manual dbt run in personal schema. Staging: automated on PR (modified+ models). Production: scheduled — freshness → run → test.',
          solution: `# Dev (local or dbt Cloud IDE):
dbt run --select my_model
dbt test --select my_model
dbt compile --select my_model

# Staging (triggered on Pull Request):
dbt run --select state:modified+    # only changed + downstream
dbt test --select state:modified+   # pass = PR can merge

# Production (scheduled 06:00 UTC):
dbt source freshness                # halt if ingestion delayed
dbt run                             # rebuild all models
dbt test                            # run all tests
dbt docs generate                   # rebuild documentation
# Alert on failure: Slack + PagerDuty for critical models`,
          seniorNote: 'dbt environments map directly to Git branches. The canonical pattern: feature branches → dev schema (dbt_yourname), develop branch → CI schema (dbt_ci), main → production schema (analytics). The dbt Cloud CLI "defer" feature lets local dev reference production tables for unmodified upstream models — no need to rebuild the entire project locally. In CI, use --state to detect changed models and run only affected + downstream — keeps CI under 5 minutes even for 500+ model projects.',
        },
        {
          id: 'dbt-with-platforms',
          title: 'dbt with Snowflake, Databricks, Fabric, and Synapse',
          difficulty: 'Advanced',
          explanation: `dbt supports multiple adapters, each with different behaviours:
- Snowflake: native adapter, most mature dbt experience. Best community support.
- Databricks: dbt-databricks adapter. Uses Unity Catalog (3-level: catalog.schema.table). Models run as Spark SQL.
- Fabric/Synapse: dbt-fabric or dbt-synapse adapter. T-SQL dialect, more adapter limitations.
Each platform handles CREATE TABLE AS, MERGE, and schema management differently.`,
          why: 'Most organisations run multiple platforms. Senior DEs need to know how dbt behaves on each: Databricks needs Unity Catalog config and uses Spark SQL; Snowflake is most feature-complete; Fabric/Synapse have adapter limitations. The profiles.yml adapter configuration is the first failure point when setting up a new dbt project.',
          syntax: `-- Snowflake profiles.yml:
type: snowflake
account: abc123.us-east-1
user: "{{ env_var('SNOWFLAKE_USER') }}"
private_key_path: ~/.snowflake/key.p8
role: transformer_role
database: analytics
warehouse: transforming_wh
schema: dbt_dev
threads: 4

-- Databricks (Unity Catalog) profiles.yml:
type: databricks
host: adb-123456.1.azuredatabricks.net
http_path: /sql/1.0/warehouses/abc123
token: "{{ env_var('DATABRICKS_TOKEN') }}"
catalog: main        # Unity Catalog catalog
schema: analytics
threads: 4

-- Fabric profiles.yml:
type: fabric
driver: "ODBC Driver 18 for SQL Server"
server: xxx.datawarehouse.fabric.microsoft.com
port: 1433
database: my_warehouse
schema: analytics
authentication: ServicePrincipal
tenant_id: "{{ env_var('AZURE_TENANT_ID') }}"
client_id: "{{ env_var('AZURE_CLIENT_ID') }}"
client_secret: "{{ env_var('AZURE_CLIENT_SECRET') }}"`,
          example: `-- Databricks-specific model: Delta Lake features
{{ config(
    materialized='incremental',
    unique_key='order_id',
    incremental_strategy='merge',
    file_format='delta',
    partition_by=['order_date'],
    cluster_by=['customer_id']   -- Liquid Clustering (Databricks-specific)
) }}

SELECT order_id, customer_id, amount, order_date
FROM {{ ref('stg_orders') }}

{% if is_incremental() %}
    WHERE order_date >= (SELECT MAX(order_date) FROM {{ this }}) - INTERVAL 2 DAYS
{% endif %}`,
          expectedOutput: `-- Databricks run output:
Running with dbt=1.7.0 with dbt-databricks 1.7.5
Using profile: prod (Unity Catalog: main.analytics)

1 of 6 START incremental model analytics.fct_orders ........ [RUN]
1 of 6 OK created incremental model analytics.fct_orders ... [MERGE 47,231 in 4.82s]

Finished 6 models in 31.22 seconds. All succeeded.`,
          interview: {
            question: 'How does dbt behave differently on Databricks compared to Snowflake?',
            answer: 'Databricks with Unity Catalog uses a three-level namespace (catalog.schema.table vs Snowflake\'s database.schema.table). Models run as Spark SQL — not all Snowflake-specific functions are available. Incremental models use Delta Lake MERGE under the hood. Databricks supports Liquid Clustering via the cluster_by config, which has no Snowflake equivalent. Performance: Databricks SQL Warehouses have cold-start latency — use Serverless SQL Warehouses to avoid this. Snowflake warehouses start in < 3 seconds. Practically, Snowflake is the most polished dbt experience — fewer adapter limitations and more community examples.',
          },
          practice: 'Write the profiles.yml for a production dbt project on Azure Databricks with Unity Catalog. Catalog is "analytics_prod", schema is "gold", token from environment variable.',
          hint: 'type: databricks. Include host (workspace URL), http_path (SQL Warehouse endpoint), token via env_var, catalog, schema.',
          solution: `# profiles.yml
my_dbt_project:
  target: prod
  outputs:
    dev:
      type: databricks
      host: adb-123456789.1.azuredatabricks.net
      http_path: /sql/1.0/warehouses/def456
      token: "{{ env_var('DATABRICKS_DEV_TOKEN') }}"
      catalog: analytics_dev
      schema: "dbt_{{ env_var('DBT_USER', 'dev') }}"
      threads: 4
    prod:
      type: databricks
      host: adb-123456789.1.azuredatabricks.net
      http_path: /sql/1.0/warehouses/abc123
      token: "{{ env_var('DATABRICKS_PROD_TOKEN') }}"
      catalog: analytics_prod
      schema: gold
      threads: 8`,
          seniorNote: 'Platform choice affects more than profiles.yml. Some dbt packages (like dbt_utils date_spine) generate Snowflake-specific SQL that needs adapter overrides for Databricks. The dbt-fabric adapter has notable limitations: no Python models, limited incremental strategies, T-SQL quirks with date functions. Before committing to a new platform adapter, test your 5 most complex models. If you are evaluating Fabric, run dbt compile on all models first and inspect generated T-SQL for compatibility issues.',
        },
      ],
    },
  ],
};
