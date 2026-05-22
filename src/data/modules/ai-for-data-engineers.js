export const aiModule = {
  sections: [
    {
      title: 'Prompt Engineering',
      subtopics: [
        {
          id: 'ai-prompt-basics',
          title: 'Writing Effective Prompts',
          difficulty: 'Beginner',
          explanation: 'A good prompt has four parts: Role (who AI should be), Context (the data/system), Task (specific request), and Format (how to structure the answer). Vague prompts produce generic, often wrong answers.',
          why: 'A well-structured prompt gets you a working SQL query or PySpark script in one shot. A vague prompt wastes time on back-and-forth clarifications. Time savings are 5-10x for common engineering tasks.',
          syntax: `Prompt template:
  Role:    "You are a senior data engineer working with [tool/system]"
  Context: "I have a [table/DataFrame] with columns: [list them]"
  Task:    "Write [specific thing] that [specific requirement]"
  Format:  "Include [comments/explanation/examples]. Output only the code."

Example structure:
  "You are a data engineer using PySpark on Azure Databricks.
   I have an orders DataFrame: order_id (long), amount (double),
   status (string), created_at (timestamp), customer_id (long).
   Write a PySpark transformation that filters shipped orders,
   adds a tax column (8%), and groups by customer_id to get total spend.
   Use PySpark DataFrame API, not SQL. Add comments."`,
          example: `Weak prompt:
  "Write a query for orders"
  → AI response: generic boilerplate, wrong columns, unclear output

Strong prompt:
  "You are a data engineer using PostgreSQL.
   Table: orders(order_id BIGINT, customer_id INT, amount NUMERIC, status VARCHAR, created_at TIMESTAMP)
   Task: Find the top 5 customers by total spend in January 2024.
   Include: customer_id, order_count, total_amount, avg_order.
   Sort: total_amount descending.
   Format: Production-ready SQL with a brief explanation above the query."

AI output:
  -- Top 5 customers by total spend in January 2024
  SELECT customer_id,
         COUNT(order_id)  AS order_count,
         SUM(amount)      AS total_amount,
         AVG(amount)      AS avg_order
  FROM orders
  WHERE created_at >= '2024-01-01' AND created_at < '2024-02-01'
  GROUP BY customer_id
  ORDER BY total_amount DESC
  LIMIT 5;`,
          expectedOutput: `Strong prompt produces ready-to-use SQL with correct column names, proper date filter, and matching output shape.`,
          interview: {
            question: 'What four elements make a data engineering AI prompt effective?',
            answer: 'Role (what persona AI should adopt), Context (exact schema, system, and constraints), Task (specific and measurable request), Format (output structure — code only, with comments, with explanation). Missing any element degrades the output quality.',
          },
          practice: 'Write a strong AI prompt asking for a PySpark script that reads a Delta table, filters cancelled orders, and writes a daily cancellation report to S3. Include all four prompt elements.',
          hint: 'Role: data engineer with PySpark/Databricks. Context: Delta table schema and S3 output path. Task: specific filter + write operation. Format: code with comments, DataFrame API.',
          solution: `"You are a senior data engineer using PySpark on Azure Databricks with Delta Lake.

Context:
  - Source: Delta table at dbfs:/mnt/silver/orders
  - Schema: order_id (long), customer_id (long), amount (double),
            status (string), order_date (date), created_at (timestamp)
  - Target: Parquet files at s3://reports/cancellations/

Task:
  Write a PySpark script that:
  1. Reads the silver orders Delta table
  2. Filters rows where status = 'cancelled' and order_date = today
  3. Groups by order_date to get: order_count, total_refund_amount, avg_order_amount
  4. Writes the result to S3 as Parquet partitioned by order_date with mode overwrite

Format: PySpark DataFrame API, Python, with inline comments on each step.
Output only the code."`,
        },
        {
          id: 'ai-chain-prompting',
          title: 'Chain-of-Thought & Iterative Prompting',
          difficulty: 'Intermediate',
          explanation: 'Chain-of-thought prompting asks AI to reason step-by-step before answering. Iterative prompting builds on previous responses. These techniques handle complex multi-step data engineering problems.',
          why: 'Complex tasks like designing a medallion architecture or debugging a Spark skew issue have many interdependent steps. Asking AI to think through them explicitly produces more accurate and explainable answers.',
          syntax: `Chain-of-thought:
  "Think step by step before answering.
   First list the approach, then write the code."

Iterative:
  Turn 1: "Design the table schema for a SCD Type 2 customer dimension"
  Turn 2: "Now write the MERGE statement for this schema"
  Turn 3: "Add a quality check that verifies no customer_id has two is_current=true rows"

Few-shot (give examples):
  "Here is an example of how I transform raw data: [example].
   Now do the same for this new schema: [schema]"`,
          example: `Chain-of-thought prompt:
  "I have a PySpark job joining orders (500M rows) with customers (1M rows).
   The job runs in 45 minutes but should finish in 5.
   Think through the most likely causes of slowness step by step,
   then recommend the top 3 fixes with code examples."

AI response (structured):
  Step 1 — Diagnosis:
  - Check if the join triggers a SortMergeJoin (both sides shuffled = expensive)
  - Check for data skew: one customer_id with millions of orders
  - Check shuffle partitions setting

  Step 2 — Fixes:
  Fix 1: Broadcast the customers table (1M rows fits in memory)
    from pyspark.sql.functions import broadcast
    result = orders.join(broadcast(customers), "customer_id")

  Fix 2: Enable AQE for automatic skew handling
    spark.conf.set("spark.sql.adaptive.enabled", "true")
    spark.conf.set("spark.sql.adaptive.skewJoin.enabled", "true")

  Fix 3: Pre-filter customers before joining
    active_customers = customers.filter(col("status") == "active")
    result = orders.join(broadcast(active_customers), "customer_id")`,
          expectedOutput: `Chain-of-thought produces a structured diagnosis and actionable fixes, not just a code snippet.`,
          interview: {
            question: 'When is iterative prompting more effective than a single complex prompt?',
            answer: 'When tasks have multiple dependent steps. Start with architecture design, then schema creation, then the ETL logic, then tests. Each step uses the context from the previous. This matches how engineers actually think and allows course correction between steps.',
          },
          practice: 'Design a chain-of-thought prompt sequence (3 turns) to build a Delta Lake SCD Type 2 pipeline. What would each turn ask?',
          hint: 'Turn 1: design the schema. Turn 2: write the MERGE statement using that schema. Turn 3: write a data quality test for the result.',
          solution: `# Turn 1 — Schema design
"You are a data engineer using Delta Lake on Databricks.
Design the schema for a customer dimension table using SCD Type 2.
Include all necessary columns for tracking history.
Output: CREATE TABLE SQL."

# Turn 2 — MERGE logic (references Turn 1 result)
"Using the schema you defined, write the PySpark Delta MERGE statement
that upserts customer records: updates tier and city when changed,
inserts new customers. Include is_current and end_date handling."

# Turn 3 — Quality check
"Write a PySpark assertion that verifies the SCD2 merge worked correctly:
no customer_id should have more than one row with is_current = true.
Raise an exception with the count if any violations are found."`,
        },
      ],
    },
    {
      title: 'LLM Basics',
      subtopics: [
        {
          id: 'ai-llm-concepts',
          title: 'How LLMs Work',
          difficulty: 'Beginner',
          explanation: 'Large Language Models (LLMs) predict the next token based on all previous tokens in the context window. They are trained on vast text corpora and fine-tuned for helpfulness. Key parameters: temperature (randomness) and max_tokens (output length).',
          why: 'Understanding LLMs helps you use them more effectively — knowing why they hallucinate, when to trust outputs, how temperature affects creativity vs. accuracy, and why context window size matters for long tasks.',
          syntax: `Key LLM concepts:
  Token:          ~4 characters of text (words, subwords)
  Context window: max tokens in input + output (4K to 200K+)
  Temperature:    0 = deterministic, 1 = creative, 2 = chaotic
                  For code: use 0–0.3. For creative writing: 0.7–1.0
  Top-p:          nucleus sampling — limits token probability pool
  Hallucination:  model generates plausible-sounding but false facts
  Grounding:      providing facts in the prompt to reduce hallucination`,
          example: `# Temperature effect on SQL generation

# Temperature = 0 (deterministic, precise — use for code)
Prompt: "Write SQL to count orders by status"
Output: SELECT status, COUNT(*) FROM orders GROUP BY status;
# Same output every time — reliable for production code generation

# Temperature = 0.9 (creative — use for brainstorming)
Prompt: "Suggest names for a data pipeline monitoring dashboard"
Output varies: "DataPulse", "FlowGuard", "StreamSentinel", "PipelineRadar"
# Different suggestions each run — good for ideation

# Context window matters:
# Small model (4K tokens): can hold ~1 table schema + query
# Large model (128K tokens): can hold entire codebase + ask questions`,
          expectedOutput: `Temperature 0: consistent, reliable code output\nTemperature 0.9: creative, varied brainstorming\nRight temperature choice prevents wasted back-and-forth`,
          interview: {
            question: 'What is hallucination in LLMs and how do you mitigate it for data engineering tasks?',
            answer: 'Hallucination is when the model generates plausible-sounding but factually wrong output — wrong column names, non-existent functions, incorrect SQL syntax. Mitigate by: providing exact schema in the prompt, testing all code before production use, and using retrieval-augmented generation (RAG) to ground answers in real documentation.',
          },
          practice: 'Explain what temperature you would set when using an LLM to generate production SQL code, and what you would set for brainstorming new pipeline architecture ideas. Why?',
          hint: 'SQL code: low temperature (0–0.2) for deterministic, precise output. Architecture brainstorming: higher temperature (0.7–0.9) for creative, varied ideas.',
          solution: `# Production SQL generation: temperature = 0.1
# Reason: SQL must be syntactically correct and deterministic.
# A higher temperature introduces random token choices that
# can produce invalid syntax or wrong logic.
# Consistency matters: re-running the same prompt gives the same code.

# Architecture brainstorming: temperature = 0.8
# Reason: You want diverse, creative suggestions — different
# approaches to the same problem. Higher temperature explores
# the probability distribution of next tokens more broadly,
# generating varied ideas rather than the most probable single answer.

# Rule of thumb:
# accuracy/precision tasks: 0.0–0.3 (SQL, code, data validation)
# creative/exploration tasks: 0.6–1.0 (naming, design, brainstorming)`,
        },
      ],
    },
    {
      title: 'OpenAI API & Claude API',
      subtopics: [
        {
          id: 'ai-openai-api',
          title: 'Using LLM APIs Programmatically',
          difficulty: 'Intermediate',
          explanation: 'LLM APIs (OpenAI, Anthropic Claude) let you call AI models from your data pipelines. The chat completions API takes a list of messages and returns a response. Use it to automate code generation, data classification, and text extraction.',
          why: 'Calling AI APIs inside pipelines enables AI-powered ETL: classify product descriptions, extract structured data from free text, generate SQL from natural language, or flag anomalies using LLM reasoning.',
          syntax: `# OpenAI Python SDK
from openai import OpenAI
client = OpenAI(api_key="sk-...")

response = client.chat.completions.create(
    model="gpt-4o",
    temperature=0.1,
    messages=[
        {"role": "system", "content": "You are a data quality expert."},
        {"role": "user",   "content": "Is this SQL safe to run? " + sql}
    ]
)
answer = response.choices[0].message.content

# Anthropic Claude SDK
import anthropic
claude = anthropic.Anthropic(api_key="sk-ant-...")
msg = claude.messages.create(
    model="claude-sonnet-4-6",
    max_tokens=1024,
    messages=[{"role": "user", "content": "Convert this SQL to PySpark: " + sql}]
)`,
          example: `import anthropic
import pandas as pd

claude = anthropic.Anthropic()

def classify_product(description: str) -> str:
    """Use Claude to classify product descriptions into categories."""
    response = claude.messages.create(
        model="claude-sonnet-4-6",
        max_tokens=50,
        messages=[{
            "role": "user",
            "content": (
                "Classify this product description into one category: "
                "Electronics | Clothing | Food | Home | Sports. "
                "Reply with only the category name.\\n\\n"
                f"Description: {description}"
            )
        }]
    )
    return response.content[0].text.strip()

# Apply to a DataFrame
products_df["ai_category"] = products_df["description"].apply(classify_product)
print(products_df[["product_id","description","ai_category"]].head())`,
          expectedOutput: `product_id | description                    | ai_category\n1001       | Wireless noise-cancelling ...  | Electronics\n1002       | Men's running shoes, size 10   | Sports\n1003       | Organic oat milk, 1 litre      | Food`,
          interview: {
            question: 'How would you use an LLM API in a data pipeline for data quality?',
            answer: 'Use it to classify ambiguous data, detect anomalies with natural language reasoning, or validate business rules that are hard to express as SQL. For example: classify free-text complaint descriptions, detect whether a product description matches its category, or flag suspicious transaction patterns with an explanation.',
          },
          practice: 'Write Python code using an LLM API to extract structured data (product_name, price, brand) from unstructured product descriptions. How would you make the output parseable programmatically?',
          hint: 'Ask the model to respond in JSON format: {"product_name": ..., "price": ..., "brand": ...}. Use json.loads() to parse. Set temperature=0 for consistent JSON structure.',
          solution: `import anthropic, json

claude = anthropic.Anthropic()

def extract_product_data(raw_description: str) -> dict:
    response = claude.messages.create(
        model="claude-sonnet-4-6",
        max_tokens=200,
        messages=[{
            "role": "user",
            "content": (
                "Extract product info from this description. "
                "Return ONLY valid JSON with keys: product_name, price, brand. "
                "price should be a number (null if not found).\\n\\n"
                f"Description: {raw_description}"
            )
        }]
    )
    try:
        return json.loads(response.content[0].text)
    except json.JSONDecodeError:
        return {"product_name": None, "price": None, "brand": None}

# Test
result = extract_product_data("Apple AirPods Pro 2nd Gen, $249, noise cancellation")
print(result)
# {"product_name": "AirPods Pro 2nd Gen", "price": 249, "brand": "Apple"}`,
        },
      ],
    },
    {
      title: 'AI Agents for Data Engineering',
      subtopics: [
        {
          id: 'ai-agents',
          title: 'AI Agents & Tool Use',
          difficulty: 'Advanced',
          explanation: 'An AI agent uses LLM reasoning to plan and execute multi-step tasks using tools (functions it can call). Tools can include running SQL, reading files, calling APIs, and writing outputs. The agent decides which tool to use and when.',
          why: 'An agent can autonomously investigate a data quality issue: query a database for anomalies, check logs, read source files, compare with historical data, and produce a root-cause report — without a human orchestrating each step.',
          syntax: `# Tool use pattern (Anthropic)
tools = [
    {
        "name":        "run_sql_query",
        "description": "Run a SQL query on the data warehouse and return results",
        "input_schema": {
            "type": "object",
            "properties": {
                "query": {"type": "string", "description": "The SQL query to execute"}
            },
            "required": ["query"]
        }
    }
]

response = claude.messages.create(
    model="claude-sonnet-4-6",
    tools=tools,
    messages=[{"role": "user", "content": "Check if yesterday's order count is normal"}]
)

# Agent decides: call run_sql_query with appropriate SQL
# Your code executes the tool and feeds result back to agent`,
          example: `import anthropic, sqlite3, json

claude = anthropic.Anthropic()

def run_sql(query: str) -> str:
    conn = sqlite3.connect("warehouse.db")
    result = conn.execute(query).fetchall()
    conn.close()
    return json.dumps(result[:10])  # return first 10 rows as JSON

tools = [{
    "name": "run_sql_query",
    "description": "Execute SQL and return results as JSON",
    "input_schema": {
        "type": "object",
        "properties": {"query": {"type": "string"}},
        "required": ["query"]
    }
}]

messages = [{"role": "user", "content": "How many orders were placed today vs yesterday?"}]

while True:
    resp = claude.messages.create(model="claude-sonnet-4-6", tools=tools, messages=messages)
    if resp.stop_reason == "end_turn":
        print(resp.content[0].text)
        break
    # Execute tool the agent requested
    for block in resp.content:
        if block.type == "tool_use":
            result = run_sql(block.input["query"])
            messages += [
                {"role": "assistant", "content": resp.content},
                {"role": "user",      "content": [{"type": "tool_result", "tool_use_id": block.id, "content": result}]}
            ]`,
          expectedOutput: `Agent decides to run:\n  SELECT DATE(created_at), COUNT(*) FROM orders GROUP BY 1 ORDER BY 1 DESC LIMIT 2\n\nAgent response:\n  Today (2024-01-16): 4,200 orders — 12% below yesterday's 4,775.\n  This is within normal variance (±15%). No alert needed.`,
          interview: {
            question: 'What is the ReAct pattern for AI agents?',
            answer: 'ReAct = Reasoning + Acting. The agent alternates between: (1) Reason — think about what to do next. (2) Act — call a tool. (3) Observe — see the tool result. (4) Repeat until done. This loop allows multi-step problem solving with tool calls in between.',
          },
          practice: 'Describe how you would use an AI agent to investigate a data quality issue. What tools would you give it and what steps would it take automatically?',
          hint: 'Tools: run_sql (query the DB), read_file (read logs or S3 files), write_report (save findings). Steps: check row counts, compare with history, look at null rates, check source data, write a summary.',
          solution: `# Agent for data quality investigation

Tools to provide:
  1. run_sql(query)       — query the data warehouse
  2. get_s3_file_list(prefix) — list files in S3 path
  3. read_file_sample(path)   — read first N rows of a file
  4. post_slack_alert(msg)    — send alert to Slack channel

Agent steps (autonomous):
  1. run_sql: "SELECT COUNT(*) FROM silver.orders WHERE order_date = today"
     → Got 2,100. Expected ~4,200 based on recent days.
  2. run_sql: "SELECT COUNT(*) FROM bronze.orders WHERE order_date = today"
     → Bronze also has 2,100. Issue is upstream, not in transform.
  3. get_s3_file_list: "s3://raw/orders/date=today/"
     → 1 file found. Yesterday had 2 files. Source is incomplete.
  4. post_slack_alert: "Missing source file for today's orders load.
     Only 1 of 2 expected files arrived. Bronze count: 2,100 (expected ~4,200)"
  5. write_report: Summary of findings + recommendation to wait for late file.`,
        },
      ],
    },
    {
      title: 'RAG & Vector Databases',
      subtopics: [
        {
          id: 'ai-rag',
          title: 'Retrieval-Augmented Generation (RAG)',
          difficulty: 'Advanced',
          explanation: 'RAG combines a vector database search with LLM generation. Instead of relying on training knowledge, the LLM is given retrieved relevant documents as context. This grounds answers in your specific data and reduces hallucination.',
          why: 'LLMs do not know your internal documentation, schema catalog, or business rules. RAG lets you build a Q&A system over your data documentation, pipeline runbooks, or incident history without fine-tuning.',
          syntax: `RAG pipeline:
  1. Index:   chunk documents → embed with embedding model → store in vector DB
  2. Retrieve: embed the query → find top-k similar chunks from vector DB
  3. Generate: send query + retrieved chunks to LLM → get grounded answer

  # Embedding model: converts text to float vector (e.g. 1536 dimensions)
  # Similarity:      cosine similarity or dot product
  # Vector DBs:      Pinecone, ChromaDB, pgvector (PostgreSQL), Weaviate, FAISS`,
          example: `import anthropic
from chromadb import Client

claude = anthropic.Anthropic()
chroma = Client()

# Step 1: Index data documentation
collection = chroma.get_or_create_collection("data_docs")
docs = [
    {"id": "1", "doc": "orders table: order_id BIGINT, customer_id INT, amount DOUBLE, status VARCHAR, created_at TIMESTAMP. Partitioned by order_date. Updated nightly at 02:00 UTC."},
    {"id": "2", "doc": "customers table: customer_id INT PK, name VARCHAR, email VARCHAR, tier VARCHAR (bronze/silver/gold). SCD2 history tracked with is_current and end_date."},
]
collection.add(ids=[d["id"] for d in docs], documents=[d["doc"] for d in docs])

def ask_about_data(question: str) -> str:
    # Step 2: Retrieve relevant docs
    results = collection.query(query_texts=[question], n_results=2)
    context = "\\n".join(results["documents"][0])

    # Step 3: Generate with context
    response = claude.messages.create(
        model="claude-sonnet-4-6",
        max_tokens=500,
        messages=[{
            "role": "user",
            "content": f"Answer using this context:\\n{context}\\n\\nQuestion: {question}"
        }]
    )
    return response.content[0].text

print(ask_about_data("What columns does the orders table have?"))`,
          expectedOutput: `The orders table has these columns:\n- order_id (BIGINT): unique identifier\n- customer_id (INT): links to customers table\n- amount (DOUBLE): order value\n- status (VARCHAR): order status\n- created_at (TIMESTAMP): when order was placed\nThe table is partitioned by order_date and updated nightly at 02:00 UTC.`,
          interview: {
            question: 'Why is RAG better than fine-tuning for internal data documentation?',
            answer: 'RAG uses retrieval at inference time — answers always use the latest documents. Fine-tuning bakes knowledge into weights, which becomes stale and requires retraining. RAG is also cheaper, faster to update, and lets you see exactly what context the LLM used.',
          },
          practice: 'Describe the three steps in a RAG pipeline. What is stored in the vector database and what is the role of the embedding model?',
          hint: 'Steps: Index (chunk + embed + store), Retrieve (embed query + similarity search), Generate (LLM with context). Vector DB stores embeddings (float vectors) and document text. Embedding model converts text to vectors.',
          solution: `# Step 1: INDEX
# - Split your documents into chunks (e.g. 500 tokens each with overlap)
# - Pass each chunk to an embedding model (e.g. text-embedding-3-small)
# - Embedding model returns a float vector (e.g. [0.12, -0.34, 0.91, ...] × 1536)
# - Store (chunk_text, embedding_vector, metadata) in a vector database

# Step 2: RETRIEVE
# - Take the user's question: "What columns does orders table have?"
# - Embed it using the same embedding model → query vector
# - Search vector database for top-k chunks with highest cosine similarity
# - Return those chunks as the "context"

# Step 3: GENERATE
# - Construct prompt: "Context: [retrieved chunks]\\nQuestion: [user question]"
# - Send to LLM (Claude, GPT-4, etc.)
# - LLM generates an answer grounded in the retrieved context
# - Output is specific to your data, not generic training knowledge`,
        },
      ],
    },
    {
      title: 'AI for ETL Automation',
      subtopics: [
        {
          id: 'ai-etl',
          title: 'AI-assisted ETL Development',
          difficulty: 'Intermediate',
          explanation: 'AI dramatically accelerates ETL development: writing boilerplate, converting between languages (SQL → PySpark), generating schema mappings, and creating data validation checks from business rules described in plain English.',
          why: 'Repetitive ETL tasks — writing type casts, null checks, deduplication logic, and test data — each take 15-30 minutes. AI reduces each to under 2 minutes. Across a 10-table ingestion project, this saves a full week of work.',
          syntax: `High-value AI ETL prompts:
  "Convert this SQL to PySpark DataFrame API: [SQL]"
  "Write Python code to validate this schema: [columns + expected types]"
  "Generate 20 realistic test rows for this schema: [schema]"
  "Convert this flat CSV to a nested JSON matching this target schema: [schema]"
  "Write a PySpark transformation that implements this business rule: [rule]"
  "Add error handling and logging to this Glue job: [code]"`,
          example: `Prompt: "Convert this SQL aggregation to PySpark:
  SELECT status, DATE_TRUNC('month', created_at) as month,
         COUNT(*) as order_count, SUM(amount) as revenue
  FROM orders
  WHERE created_at >= '2024-01-01'
  GROUP BY 1, 2
  ORDER BY 2, revenue DESC"

AI output:
  from pyspark.sql.functions import col, trunc, count, sum as F_sum

  result = orders_df \\
      .filter(col("created_at") >= "2024-01-01") \\
      .withColumn("month", trunc("created_at", "MM")) \\
      .groupBy("status", "month") \\
      .agg(
          count("*").alias("order_count"),
          F_sum("amount").alias("revenue")
      ) \\
      .orderBy("month", col("revenue").desc())`,
          expectedOutput: `SQL converted to PySpark in 5 seconds.\nManual effort: ~15 minutes with documentation lookup.`,
          interview: {
            question: 'What are three data engineering tasks where AI provides the biggest time savings?',
            answer: '1. Writing boilerplate ingestion code (schema definition, type casting, null handling). 2. Converting queries between dialects (SQL → PySpark, SQL Server → Snowflake). 3. Generating test data and data validation assertions from business rules.',
          },
          practice: 'Write a prompt that asks AI to generate a PySpark validation function for an orders DataFrame. The function should check: no null order_ids, all amounts > 0, status in a valid set, and print a summary of any violations found.',
          hint: 'Include the DataFrame schema, list the validation rules clearly, and ask for a function that prints a report rather than just assertions that raise errors.',
          solution: `"You are a data engineer writing PySpark quality checks.

Schema: orders DataFrame
  - order_id: long
  - customer_id: long
  - amount: double
  - status: string  (valid values: shipped, pending, cancelled, delivered)
  - created_at: timestamp

Task: Write a Python function validate_orders(df) that:
  1. Checks for null order_ids → count violations
  2. Checks for amount <= 0 → count violations
  3. Checks for invalid status values → count violations
  4. Prints a summary table of each check: rule | violations | pass/fail
  5. Returns True if all checks pass, False otherwise

Use PySpark DataFrame API. Do not raise exceptions — return a report."`,
        },
      ],
    },
    {
      title: 'AI for SQL Generation',
      subtopics: [
        {
          id: 'ai-sql-gen',
          title: 'Natural Language to SQL',
          difficulty: 'Intermediate',
          explanation: 'LLMs can convert natural language questions into SQL queries given the schema context. This enables analysts to query data by describing what they need in plain English, and data engineers to validate complex business logic with AI assistance.',
          why: 'Business stakeholders can get answers without waiting for data engineers. Data engineers can draft complex window functions, CTEs, and multi-join queries 5x faster using AI as a starting point.',
          syntax: `Effective text-to-SQL prompt:
  "You are a SQL expert using [dialect: PostgreSQL / Snowflake / BigQuery].
   Database schema:
     [table1]: [columns with types]
     [table2]: [columns with types]
   Business question: [in plain English]
   Requirements: [performance notes, NULL handling, date ranges]
   Output: SQL only, with a 1-line comment describing the query."`,
          example: `Prompt:
  "You are a SQL expert using Snowflake.
   Tables:
     orders: order_id BIGINT, customer_id INT, amount NUMERIC, status VARCHAR, created_at TIMESTAMP
     customers: customer_id INT, name VARCHAR, city VARCHAR, tier VARCHAR, signup_date DATE
   Question: Which cities had a higher average order value in Q1 2024 than their all-time average?
   Show: city, q1_avg, all_time_avg, difference. Sort by difference descending."

AI output:
  -- Cities with above-average Q1 2024 order values
  WITH all_time AS (
    SELECT c.city, AVG(o.amount) AS all_time_avg
    FROM orders o JOIN customers c USING (customer_id)
    GROUP BY c.city
  ),
  q1 AS (
    SELECT c.city, AVG(o.amount) AS q1_avg
    FROM orders o JOIN customers c USING (customer_id)
    WHERE o.created_at BETWEEN '2024-01-01' AND '2024-03-31'
    GROUP BY c.city
  )
  SELECT q1.city,
         ROUND(q1.q1_avg, 2)      AS q1_avg,
         ROUND(at.all_time_avg, 2) AS all_time_avg,
         ROUND(q1.q1_avg - at.all_time_avg, 2) AS difference
  FROM q1 JOIN all_time USING (city)
  WHERE q1.q1_avg > at.all_time_avg
  ORDER BY difference DESC;`,
          expectedOutput: `Complex CTE-based query produced in ~5 seconds. Manual effort: 20-30 minutes including documentation lookup and testing.`,
          interview: {
            question: 'Why should you always test AI-generated SQL before running it in production?',
            answer: 'AI can hallucinate column names, invent non-existent functions, produce logically incorrect joins, or generate valid-looking SQL that returns wrong results. Always run on a dev environment with a small dataset, validate the output against known values, and review the query logic before promoting to production.',
          },
          practice: 'Write a complete text-to-SQL prompt that would generate a query finding the top 3 products by revenue in each region for the last 30 days. Include all elements needed for an accurate result.',
          hint: 'Include: dialect, exact table schemas with types, the business question, output columns, date filter logic, ranking requirement (TOP 3 per region = window function or QUALIFY).',
          solution: `"You are a SQL expert using Snowflake.

Tables:
  orders: order_id BIGINT, customer_id INT, product_id INT,
          amount NUMERIC(10,2), order_date DATE, status VARCHAR
  products: product_id INT, name VARCHAR, category VARCHAR, region VARCHAR

Question: Find the top 3 products by total revenue in each region
          for orders placed in the last 30 days.

Requirements:
  - Only include shipped or delivered orders
  - Group by region and product
  - Rank within each region by total_revenue descending
  - Return: region, product_name, total_revenue, order_count, rank
  - Include only ranks 1, 2, 3 (use QUALIFY or CTE)
  - Format numbers with 2 decimal places

Output: Snowflake SQL only, with a brief comment."`,
        },
      ],
    },
    {
      title: 'AI Debugging & Code Review',
      subtopics: [
        {
          id: 'ai-debugging',
          title: 'AI-assisted Debugging',
          difficulty: 'Intermediate',
          explanation: 'AI can explain error messages, identify bugs in SQL or PySpark code, suggest fixes, and explain what a complex query does line by line. It is most effective when given the exact error, the code, and the expected vs actual result.',
          why: 'Stack traces from Spark, database errors, and Glue failures are often cryptic. AI can translate them into plain-English root causes and suggest fixes in seconds — often faster than reading documentation.',
          syntax: `Debugging prompt template:
  "I have an error in my [SQL/PySpark/Glue] code.

  Code:
  [paste code]

  Error message:
  [paste full error]

  What I expected:
  [describe expected behavior]

  What actually happened:
  [describe actual behavior]

  Please: (1) explain the root cause, (2) fix the code, (3) explain the fix."`,
          example: `Prompt:
  "I have a PySpark error. Code:

    result = orders.groupBy('customer_id') \\
        .agg({'amount': 'sum', 'order_id': 'countDistinct'})
    result.show()

  Error: AnalysisException: Resolved attribute(s) countDistinct missing from child

  Expected: Group orders by customer_id and count unique order_ids.
  What happened: Job crashes immediately."

AI response:
  Root cause: The dict syntax for agg() does not support countDistinct.
  Only built-in aggregation names as strings work in dict form.
  countDistinct is a function, not a string name.

  Fix:
    from pyspark.sql.functions import sum, countDistinct

    result = orders.groupBy('customer_id') \\
        .agg(
            sum('amount').alias('total_spent'),
            countDistinct('order_id').alias('unique_orders')
        )

  Explanation: Use the function import form for agg() with
  named aliases for clarity. Dict syntax only supports basic
  aggregation strings like 'sum', 'count', 'avg', 'max', 'min'.`,
          expectedOutput: `AI identifies root cause, provides working fix, and explains why — typically in under 10 seconds.`,
          interview: {
            question: 'What information should you always include when asking AI to debug code?',
            answer: 'The complete code snippet, the exact error message (full stack trace), what you expected to happen, what actually happened, and any relevant schema or context. Without the error message and expected vs actual behaviour, AI gives generic advice rather than targeted fixes.',
          },
          practice: 'Write a debugging prompt for this scenario: a Glue job that should write 50K rows to S3 Parquet completes successfully (no error) but the output file is empty. What information would you include?',
          hint: 'Include: Glue job code (read + write sections), CloudWatch log output (no error = what IS logged?), job.commit() placement, DPU count. Empty output often means no records passed a filter.',
          solution: `"I have a AWS Glue ETL job that completes without errors but writes 0 rows to S3.

Code:
  dyf = glueContext.create_dynamic_frame.from_catalog(database='raw_db', table_name='orders')
  df  = dyf.toDF().filter(col('status') == 'Shipped')
  out = DynamicFrame.fromDF(df, glueContext, 'out')
  glueContext.write_dynamic_frame.from_options(
      frame=out, connection_type='s3',
      connection_options={'path': 's3://bucket/clean/orders/'},
      format='parquet'
  )
  job.commit()

CloudWatch log: 'Rows read: 42000. Job committed successfully.'
Output S3 path: no files written.

Expected: 42,000 rows filtered to ~28,000 shipped orders and written to S3.
Actual: S3 path is empty after job completes.

Please: (1) explain why the output is empty despite 42,000 rows read,
(2) show the fix, (3) how to add logging to catch this next time."`,
        },
      ],
    },
    {
      title: 'AI-assisted Analytics',
      subtopics: [
        {
          id: 'ai-analytics',
          title: 'AI for Data Analysis & Insights',
          difficulty: 'Intermediate',
          explanation: 'AI can interpret query results, explain trends, detect anomalies, and generate narrative summaries of data findings. Combined with your pipeline output, it turns raw numbers into business-ready insights.',
          why: 'Data engineers produce clean data; AI can help explain what that data says. A five-line AI prompt can generate an executive summary of a weekly sales report, flagging anomalies and recommending investigation areas.',
          syntax: `Analysis prompts:
  "Summarise this data in 3 bullet points for a non-technical executive: [data]"
  "Identify any anomalies in this time series: [data]"
  "Compare this week's numbers to last week and explain the differences: [data]"
  "What are the top 3 business insights from this dataset? [data]"
  "Create a plain-English explanation of why sales in [region] dropped 23%"

Structured output:
  Ask for JSON when you need to parse the insights programmatically:
  "Return your findings as JSON: {insights: [], anomalies: [], recommendations: []}"`,
          example: `import anthropic, json

claude = anthropic.Anthropic()

weekly_data = """
Week 1: revenue=120000, orders=800, avg_order=150, returns=12
Week 2: revenue=132000, orders=880, avg_order=150, returns=10
Week 3: revenue=115000, orders=760, avg_order=151, returns=8
Week 4: revenue=89000,  orders=590, avg_order=151, returns=45
"""

response = claude.messages.create(
    model="claude-sonnet-4-6",
    max_tokens=400,
    messages=[{
        "role": "user",
        "content": (
            "Analyse this weekly sales data for a data engineering team meeting.\\n"
            "Return JSON with keys: summary (2 sentences), anomalies (list), "
            "recommended_investigations (list).\\n\\nData:\\n" + weekly_data
        )
    }]
)

insights = json.loads(response.content[0].text)
print(json.dumps(insights, indent=2))`,
          expectedOutput: `{\n  "summary": "Revenue and orders declined 24% in Week 4 while returns spiked 4x, suggesting a product or fulfilment issue. Weeks 1-3 showed healthy growth with stable average order values.",\n  "anomalies": ["Week 4 returns jumped from 8 to 45 (463% increase)", "Revenue drop exceeds order count drop proportionally"],\n  "recommended_investigations": ["Investigate Week 4 return reasons (product defect? wrong items?)", "Check fulfilment logs for Week 4 delivery issues", "Review any promotion or discount that ran in Week 4"]\n}`,
          interview: {
            question: 'How can AI help with the "last mile" of data delivery to business stakeholders?',
            answer: 'AI can generate plain-English summaries of query results, flag statistical anomalies in time series data, compare periods and explain differences, and format insights as narrative text or structured JSON for dashboards. This bridges the gap between clean data and actionable business communication.',
          },
          practice: 'Write a Python function that takes a Pandas DataFrame of daily metrics and uses an LLM API to return a JSON anomaly report identifying any metrics that changed more than 20% week-over-week.',
          hint: 'Convert the DataFrame to a string (df.to_string()). Ask the LLM to identify week-over-week changes > 20% and return JSON: {anomalies: [{metric, current, previous, change_pct}]}.',
          solution: `import anthropic, json
import pandas as pd

claude = anthropic.Anthropic()

def detect_anomalies(df: pd.DataFrame) -> dict:
    data_str = df.to_string()
    response = claude.messages.create(
        model="claude-sonnet-4-6",
        max_tokens=500,
        messages=[{
            "role": "user",
            "content": (
                "Analyse this daily metrics data. "
                "Find any metrics that changed more than 20% week-over-week. "
                "Return ONLY valid JSON: "
                "{anomalies: [{metric, current_week_avg, prev_week_avg, change_pct, severity}], "
                "overall_health: healthy|warning|critical}\\n\\n"
                f"Data:\\n{data_str}"
            )
        }]
    )
    try:
        return json.loads(response.content[0].text)
    except json.JSONDecodeError:
        return {"anomalies": [], "overall_health": "unknown"}`,
        },
      ],
    },
    {
      title: 'AI Workflows & Integration',
      subtopics: [
        {
          id: 'ai-workflows',
          title: 'AI in Production Data Pipelines',
          difficulty: 'Advanced',
          explanation: 'AI can be integrated as a step in production data pipelines: classifying records, enriching with AI-generated content, validating data quality with LLM reasoning, or generating documentation automatically from pipeline metadata.',
          why: 'Purely rule-based pipelines break on unexpected input. AI steps handle edge cases gracefully — classifying unusual products, interpreting ambiguous status codes, or explaining anomalies that hard-coded rules cannot detect.',
          syntax: `Integration patterns:
  1. Classification step: pass each batch of rows to AI, get category labels
  2. Enrichment: AI adds descriptions, summaries, or derived fields
  3. Validation: AI checks if text data is plausible/consistent
  4. Documentation: AI generates data dictionary from schema + sample data

  Cost awareness:
    Batch API calls (async): 50% cheaper, higher throughput
    Rate limits: OpenAI/Anthropic enforce tokens/minute limits
    Parallelism: use concurrent.futures.ThreadPoolExecutor for batching
    Caching: cache AI results for identical inputs (e.g. Redis or Delta cache column)`,
          example: `import anthropic, concurrent.futures
from functools import lru_cache

claude = anthropic.Anthropic()

@lru_cache(maxsize=10000)
def classify_category_cached(description: str) -> str:
    resp = claude.messages.create(
        model="claude-haiku-4-5-20251001",  # cheapest model for simple classification
        max_tokens=20,
        messages=[{
            "role": "user",
            "content": f"Category (Electronics|Clothing|Food|Home|Sports|Other): {description}"
        }]
    )
    return resp.content[0].text.strip()

def enrich_batch(batch_descriptions: list[str]) -> list[str]:
    with concurrent.futures.ThreadPoolExecutor(max_workers=10) as executor:
        results = list(executor.map(classify_category_cached, batch_descriptions))
    return results

# Apply to PySpark via Pandas UDF or collect + process in batches
sample = ["iPhone 15 Pro", "Yoga pants XS", "Oat milk 1L", "Kitchen mixer"]
categories = enrich_batch(sample)
print(list(zip(sample, categories)))`,
          expectedOutput: `[('iPhone 15 Pro', 'Electronics'), ('Yoga pants XS', 'Clothing'), ('Oat milk 1L', 'Food'), ('Kitchen mixer', 'Home')]`,
          interview: {
            question: 'What are the main cost and performance considerations when using AI APIs in a production pipeline?',
            answer: 'Token cost: use the smallest model that achieves the task (Haiku for classification, Sonnet/Opus for complex reasoning). Rate limits: batch requests and use parallel workers. Caching: cache results for identical inputs. Latency: AI calls add 0.5-2s per request — batch process, do not inline in streaming. Fallback: always handle API errors gracefully with retries and defaults.',
          },
          practice: 'Design a production pipeline step that uses AI to classify 100,000 product descriptions into categories. How do you handle rate limits, caching, and failures?',
          hint: 'Batch in chunks (100-500 per batch), parallelise with ThreadPoolExecutor, cache results in a lookup column, handle API errors with retry + fallback category "Unknown".',
          solution: `# Production AI classification pipeline step

# 1. Batch processing (avoid one API call per row)
BATCH_SIZE = 200
batches = [descriptions[i:i+BATCH_SIZE] for i in range(0, len(descriptions), BATCH_SIZE)]

# 2. Parallel API calls (respect rate limits)
import time, random
def classify_with_retry(desc, retries=3):
    for attempt in range(retries):
        try:
            return classify_category_cached(desc)
        except anthropic.RateLimitError:
            time.sleep(2 ** attempt + random.random())  # exponential backoff
        except Exception:
            return "Unknown"  # fallback on error
    return "Unknown"

# 3. Cache results (avoid re-classifying same description)
# Store (description_hash, category) in a Delta cache table
# On each run: check cache first, only call AI for uncached descriptions

# 4. Write results back to the pipeline
# Enriched DataFrame with new "ai_category" column
# Write to Silver Delta table with mode="append"`,
        },
      ],
    },
  ],

  interviewGroups: [
    {
      title: 'Beginner',
      questions: [
        { question: 'What four elements make a good AI prompt for data engineering?', answer: 'Role (persona), Context (exact schema and system), Task (specific requirement), Format (output structure). Missing any element leads to generic or incorrect output.' },
        { question: 'What is hallucination in LLMs?', answer: 'When an AI generates plausible-sounding but factually incorrect output — wrong column names, non-existent functions, incorrect SQL logic. Always test AI-generated code before production use.' },
        { question: 'What temperature should you use when generating SQL with AI?', answer: 'Low temperature (0–0.2). SQL requires precision and determinism — lower temperature reduces random token choices and produces more reliable, correct syntax.' },
        { question: 'Name three data engineering tasks where AI saves the most time.', answer: '1. Writing boilerplate ingestion code (schema definition, type casting). 2. Converting queries between dialects (SQL → PySpark, SQL Server → BigQuery). 3. Generating test data and data validation assertions.' },
        { question: 'Should you trust AI-generated SQL without testing it?', answer: 'Never. AI can produce plausible-looking but logically incorrect SQL, hallucinate column names, or miss business rules. Always run on dev data with known expected results before promotion.' },
      ],
    },
    {
      title: 'Intermediate',
      questions: [
        { question: 'What is RAG and when would you use it?', answer: 'Retrieval-Augmented Generation: index your documents in a vector database, retrieve relevant chunks at query time, and send them as context to the LLM. Use it to build Q&A over internal documentation, schema catalogs, and runbooks.' },
        { question: 'How do you call an LLM API from a Python data pipeline?', answer: 'Use the OpenAI or Anthropic SDK. Create a client with your API key, call client.chat.completions.create() or claude.messages.create() with your messages list. Parse the response from response.choices[0].message.content or response.content[0].text.' },
        { question: 'What is chain-of-thought prompting?', answer: 'Asking AI to reason step-by-step before answering ("Think through the approach, then write the code"). This produces more accurate results for complex multi-step tasks like debugging or architecture design.' },
        { question: 'How do you reduce hallucination when using AI for data tasks?', answer: 'Provide exact schemas and column names in the prompt. Use RAG to ground answers in real documentation. Set low temperature. Always verify output against known results. Use iterative prompting to check each step.' },
        { question: 'What is an AI agent?', answer: 'An LLM that can use tools (functions) to take actions — running SQL, reading files, calling APIs. The agent reasons about which tool to use, executes it, observes the result, and continues until the task is complete.' },
      ],
    },
    {
      title: 'Advanced',
      questions: [
        { question: 'What is the ReAct pattern for AI agents?', answer: 'Reasoning + Acting loop: (1) Reason about what to do. (2) Act by calling a tool. (3) Observe the result. (4) Repeat. This enables multi-step problem solving where each action informs the next.' },
        { question: 'How do you integrate AI classification into a production PySpark pipeline?', answer: 'Use Pandas UDFs or collect batches and process with ThreadPoolExecutor. Cache results in a Delta table lookup column. Handle rate limits with exponential backoff. Use the smallest capable model (Haiku for classification) for cost efficiency.' },
        { question: 'What are the main cost levers when using LLM APIs at scale?', answer: 'Model choice (Haiku < Sonnet < Opus), batch API pricing (50% cheaper), input token caching (repeated system prompts cached at 10% cost), output length (shorter = cheaper), and result caching (Delta table, Redis) to avoid re-calling for duplicate inputs.' },
        { question: 'How would you build a self-healing data pipeline using AI?', answer: 'AI monitors pipeline metrics and errors. When anomalies are detected: (1) AI agent runs diagnostic SQL queries. (2) Reads error logs. (3) Compares with historical patterns. (4) Either applies a known fix automatically or generates a root-cause report and sends an alert with recommended actions.' },
        { question: 'What is embedding and why is it central to RAG?', answer: 'An embedding converts text to a float vector capturing semantic meaning. Similar texts produce similar vectors. RAG stores document embeddings in a vector database. At query time, the query is embedded and the most similar document vectors are retrieved — finding relevant context even when exact words differ.' },
      ],
    },
    {
      title: 'Real-world Scenarios',
      questions: [
        { question: 'An analyst asks: "Why did revenue drop 30% last Tuesday?" How would you use AI to investigate this?', answer: 'Build an AI agent with tools: run_sql (query DW), read_logs (check pipeline logs), compare_periods (generate comparison SQL). Agent autonomously runs queries: checks order count, avg order value, return rate, source data completeness for that date. Returns a structured root-cause report.' },
        { question: 'You have 500,000 product descriptions in mixed languages needing English category labels. How do you AI-classify them efficiently?', answer: 'Use a small fast model (Claude Haiku or GPT-3.5-turbo). Batch in groups of 100-200. Parallelise with ThreadPoolExecutor (10 workers). Cache in a Delta table: hash(description) → category. Process uncached only on each run. Total cost: ~$5-15 at Haiku pricing.' },
        { question: 'Your team\'s data documentation is scattered across Confluence pages. How do you build an AI Q&A system for it?', answer: 'RAG pipeline: (1) Export Confluence pages as text. (2) Chunk into 500-token sections. (3) Embed with text-embedding model. (4) Store in ChromaDB or pgvector. (5) Build a chat interface: embed the question, retrieve top-5 chunks, pass to Claude for a grounded answer.' },
        { question: 'A new data engineer joins and asks you to explain a 200-line PySpark script. How would you use AI for this?', answer: 'Paste the script into Claude with: "Explain this PySpark script step by step. For each logical section, explain what it does, why it does it, and what business problem it solves. Format as numbered sections matching the code blocks." AI produces documentation that would take 1 hour to write manually, in under 30 seconds.' },
        { question: 'How would you set up an automated daily data quality report using AI?', answer: 'Schedule a Python script daily: (1) Run SQL checks (row counts, null rates, duplicate rates, range violations). (2) Compare with historical baselines. (3) Pass the summary metrics to Claude: "Summarise data quality for [date], flag anything >10% from baseline, return JSON." (4) Format as Slack message or email. Fully automated narrative report without manual analysis.' },
      ],
    },
  ],

  miniProjects: [
    {
      title: 'Mini Project 1: AI-powered Data Dictionary Generator',
      goal: 'Build a tool that reads a database schema and uses AI to automatically generate a business-friendly data dictionary.',
      steps: [
        'Connect to a SQLite or PostgreSQL database and extract all table schemas (table name, column name, type, sample values).',
        'For each table, build a prompt: "You are a data documentation expert. Given this schema and sample data, write a business-friendly description for the table and each column. Focus on what the data represents, not its technical type."',
        'Call the Claude API with the prompt for each table.',
        'Parse the response and structure it as: {table_name, description, columns: [{name, type, description, example_values}]}.',
        'Write the full data dictionary to a JSON file and a Markdown file.',
        'Add a Q&A function: given a plain-English question, use RAG to find the relevant table/column and return a schema-aware answer.',
      ],
      output: 'Auto-generated data dictionary in JSON and Markdown with business descriptions for every table and column. Q&A interface over the documentation.',
    },
    {
      title: 'Mini Project 2: AI Data Quality Monitor',
      goal: 'Build an automated pipeline that runs data quality checks and uses AI to generate a plain-English report with anomaly explanations.',
      steps: [
        'Write SQL quality checks: row counts per table, null rates per column, value distribution for categorical columns, comparison with previous day.',
        'Run checks daily and store results in a monitoring table: (date, table_name, metric, value, previous_value).',
        'Build a Python function that collects today\'s metrics and previous 7 days.',
        'Call Claude with the metrics: "Identify anomalies (>15% change), explain likely causes, and suggest investigation steps. Return JSON."',
        'Format the AI response as a Slack message with emoji indicators (green/yellow/red).',
        'Schedule with cron to run every morning and post the report automatically.',
      ],
      output: 'Daily automated data quality report posted to Slack with AI-generated anomaly explanations and investigation recommendations.',
    },
    {
      title: 'Enterprise Project: Intelligent ETL Pipeline with AI Steps',
      goal: 'Build a production ETL pipeline that uses AI to classify, enrich, and validate data as part of the transformation layer.',
      steps: [
        'Ingest raw product data from a CSV with inconsistent categories and free-text descriptions.',
        'Bronze: load raw data to Delta table with Autoloader.',
        'Silver Step 1 (rule-based): cast types, deduplicate, standardise column names.',
        'Silver Step 2 (AI-based): call Claude Haiku API to classify each product description into a standardised category. Cache results in a lookup Delta table. Handle API failures with fallback category.',
        'Silver Step 3 (AI validation): pass a sample of 100 rows to Claude and ask it to flag any data anomalies (descriptions not matching their category, suspicious price values, missing key fields).',
        'Gold: aggregate by AI-assigned category — total products, price ranges, top brands.',
        'Monitoring: AI generates a weekly summary comparing category distributions week-over-week.',
        'Cost control: use Haiku (cheapest model) for classification, track API spend in a cost_log Delta table, alert if daily spend exceeds $10.',
      ],
      output: 'Production pipeline with AI classification and validation steps, cached API calls, cost monitoring, and automated weekly insights report.',
    },
  ],
};
