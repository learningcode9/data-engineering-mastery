// AI Copilot service — mock-first, OpenAI-ready.
// Provides localStorage persistence + optional Supabase sync.
// Swap generateMockAIResponse for a real API call in Phase 8.

import { isSupabaseConfigured, requireSupabase } from '../supabase/client'

// ─── Types ────────────────────────────────────────────────────────────────────

export type CopilotContextType =
  | 'sql'
  | 'pyspark'
  | 'incident'
  | 'interview'
  | 'architecture'
  | 'roadmap'
  | 'general'

export interface CopilotMessage {
  id: string
  role: 'user' | 'assistant'
  content: string
  contextType: CopilotContextType
  timestamp: string
}

// ─── localStorage persistence ─────────────────────────────────────────────────

const LS_KEY     = 'dem-ai-copilot-history'
const MAX_STORED = 50

function readLS(): CopilotMessage[] {
  try { return JSON.parse(localStorage.getItem(LS_KEY) ?? '[]') } catch { return [] }
}

function writeLS(msgs: CopilotMessage[]): void {
  localStorage.setItem(LS_KEY, JSON.stringify(msgs.slice(-MAX_STORED)))
}

// ─── History API ──────────────────────────────────────────────────────────────

export async function getAIHistory(_userId: string): Promise<CopilotMessage[]> {
  return readLS()
}

export async function saveAIMessage(
  userId: string,
  message: string,
  response: string,
  contextType: CopilotContextType
): Promise<void> {
  const userMsg: CopilotMessage = {
    id: `${Date.now()}-u`,
    role: 'user',
    content: message,
    contextType,
    timestamp: new Date().toISOString(),
  }
  const botMsg: CopilotMessage = {
    id: `${Date.now()}-a`,
    role: 'assistant',
    content: response,
    contextType,
    timestamp: new Date().toISOString(),
  }
  writeLS([...readLS(), userMsg, botMsg])

  if (!isSupabaseConfigured() || !userId || userId === 'local-guest') return
  try {
    await requireSupabase()
      .from('ai_chat_history')
      .insert({ user_id: userId, message, response, context_type: contextType })
  } catch { /* localStorage is source of truth */ }
}

export function clearAIHistory(): void {
  localStorage.removeItem(LS_KEY)
}

// ─── Mock response engine ─────────────────────────────────────────────────────

type KeywordRule = { keywords: string[]; response: string }

const KEYWORD_RULES: Record<CopilotContextType, KeywordRule[]> = {
  sql: [
    {
      keywords: ['row_number', 'row number', 'rank', 'dense_rank', 'partition by'],
      response:
        `Your query is using ROW_NUMBER correctly. In interviews, explain PARTITION BY as "grouping rows before ranking" — it's the most common follow-up. The ORDER BY inside the OVER() controls rank order within each partition, not the final result order.`,
    },
    {
      keywords: ['join', 'left join', 'inner join', 'outer join', 'full join'],
      response:
        `JOIN analysis: verify expected cardinality first. If you get more rows than expected, check for duplicate keys in the right table. Run COUNT(*) before and after the join as a sanity check. For multi-table joins, use aliases and verify each join condition adds the expected rows.`,
    },
    {
      keywords: ['slow', 'performance', 'index', 'optimize', 'explain'],
      response:
        `Query performance checklist: (1) run EXPLAIN to find full table scans, (2) add a composite index on WHERE and JOIN columns, (3) avoid functions on indexed columns in WHERE clauses — e.g. WHERE YEAR(created_at) = 2023 prevents index use; use date range instead, (4) push filters as early as possible in CTEs.`,
    },
    {
      keywords: ['cte', 'with ', 'common table expression'],
      response:
        `CTEs improve readability but aren't always materialized — the optimizer may inline them. Use a temp table or MATERIALIZED hint (Postgres) when you need to force early evaluation. In interviews, compare CTEs vs subqueries: CTEs are reusable within the query, subqueries are inlined once per reference.`,
    },
    {
      keywords: ['window', 'lag', 'lead', 'sum over', 'avg over'],
      response:
        `Window function tip: they execute AFTER WHERE and GROUP BY but BEFORE HAVING. Use ROWS BETWEEN UNBOUNDED PRECEDING AND CURRENT ROW for a running total. RANGE BETWEEN is date-aware. For interview prep: always be ready to explain the difference between RANK (gaps on ties) and DENSE_RANK (no gaps).`,
    },
    {
      keywords: ['group by', 'aggregate', 'having', 'count(', 'sum('],
      response:
        `Aggregation pattern: WHERE filters before aggregation, HAVING filters after. For rolling aggregates over time, window functions with RANGE BETWEEN are more efficient than multiple self-joins. Be ready to explain the logical query processing order: FROM → WHERE → GROUP BY → HAVING → SELECT → ORDER BY.`,
    },
  ],

  pyspark: [
    {
      keywords: ['join', 'broadcast'],
      response:
        `Your join may cause shuffle. Consider broadcast join if one dataset is small (< 10 MB default): \`from pyspark.sql.functions import broadcast\` then \`df.join(broadcast(small_df), "key")\`. Check Spark UI → Stages for shuffle read/write volume to confirm the improvement.`,
    },
    {
      keywords: ['error', 'exception', 'fail', 'traceback'],
      response:
        `PySpark debug workflow: (1) read the bottom of the stack trace first — that's the root cause, (2) narrow down with \`df.show(5)\` after each transformation, (3) run \`df.explain()\` to inspect the execution plan, (4) watch for nulls in join keys — PySpark silently drops those rows.`,
    },
    {
      keywords: ['partition', 'repartition', 'coalesce', 'skew'],
      response:
        `Partitioning: \`repartition(n)\` triggers a full shuffle — use it for even distribution before expensive operations. \`coalesce(n)\` reduces partitions without shuffle — use it before writing to control output file count. For skewed data, \`repartition("date", "category")\` distributes by multiple columns to avoid hot partitions.`,
    },
    {
      keywords: ['cache', 'persist', 'memory', 'performance', 'slow'],
      response:
        `PySpark performance checklist: (1) \`df.cache()\` on DataFrames used more than once, (2) filter and select early to reduce data volume, (3) avoid Python UDFs — they're 2–10× slower than built-ins; use pandas UDFs if you need Python logic, (4) check Spark UI for GC time spikes indicating memory pressure.`,
    },
    {
      keywords: ['delta', 'merge', 'upsert', 'delete'],
      response:
        `Delta Lake MERGE for upserts:\n\`\`\`python\nDeltaTable.forPath(spark, path)\n  .alias("target")\n  .merge(updates.alias("src"), "target.id = src.id")\n  .whenMatchedUpdateAll()\n  .whenNotMatchedInsertAll()\n  .execute()\n\`\`\`\nAdd \`ZORDER BY\` on your most-filtered column to reduce file scanning by 10–100×.`,
    },
    {
      keywords: ['schema', 'struct', 'infer', 'read'],
      response:
        `Always define an explicit schema when reading CSVs or JSON in production — schema inference scans the whole file and produces inconsistent types between runs. Use \`StructType\` with \`StructField\` for each column. Mismatched schemas between runs are the #1 cause of silent data corruption in Spark jobs.`,
    },
  ],

  incident: [
    {
      keywords: ['schema', 'drift', 'column', 'missing', 'added'],
      response:
        `This looks like a schema drift issue. First check source schema changes: query INFORMATION_SCHEMA.COLUMNS with a timestamp filter, or diff current schema against your documented contract. Then validate downstream table contracts. Prevention: add Great Expectations or dbt schema tests at each Bronze → Silver boundary.`,
    },
    {
      keywords: ['null', 'data quality', 'missing', 'empty'],
      response:
        `Data quality incident workflow: (1) quantify — what % of rows are affected? (2) trace origin — is null coming from source or introduced by a transformation? (3) check if this is sudden (data pipeline bug) or gradual (upstream schema change). Add NOT NULL assertions to your pipeline's quality layer to catch this automatically.`,
    },
    {
      keywords: ['slow', 'sla', 'delay', 'late', 'timeout', 'long'],
      response:
        `SLA breach investigation: (1) check job duration trend — sudden spike or gradual growth? (2) look for data volume increase (larger source table, new partitions), (3) check resource contention (cluster sizing, competing jobs), (4) review recent pipeline changes. For immediate mitigation: check if downstream consumers can tolerate stale data while you investigate.`,
    },
    {
      keywords: ['duplicate', 'dedup', 'replay', 'reprocess'],
      response:
        `Duplicate data: trace the duplicate key upstream. Most common cause — pipeline re-ran without idempotent writes, or a CDC source replayed events. Immediate fix: run a MERGE/UPSERT to deduplicate the target table. Long-term: add idempotency keys and verify that re-runs in staging produce identical output.`,
    },
    {
      keywords: ['rca', 'root cause', 'postmortem', 'write up'],
      response:
        `RCA structure: **Timeline** → **Root Cause** (specific technical failure) → **Business Impact** (SLA breach duration, affected reports, data freshness lag) → **Remediation** (what was done) → **Prevention** (monitoring, validation, process changes). Keep it factual — avoid blame language. A good RCA prevents the same incident, not just this one.`,
    },
  ],

  interview: [
    {
      keywords: ['window', 'row_number', 'rank', 'partition', 'over'],
      response:
        `Strong answer for window functions: start with the definition ("calculates across a set of rows without collapsing them"), give syntax, then a real-world example (running totals, rank within group, lag/lead for time-series). Key: OVER(), PARTITION BY, ORDER BY, ROWS/RANGE BETWEEN. Common follow-up: "What's the difference between RANK and DENSE_RANK?" — gaps vs no gaps on ties.`,
    },
    {
      keywords: ['acid', 'transaction', 'isolation', 'consistency'],
      response:
        `ACID answer: Atomicity (all or nothing), Consistency (valid state transitions only), Isolation (concurrent transactions don't interfere), Durability (committed data survives failures). Connect to data engineering: Delta Lake and Iceberg bring ACID to data lakes, enabling safe upserts, schema evolution, and time travel — this is what the "lakehouse" pattern is built on.`,
    },
    {
      keywords: ['star schema', 'fact', 'dimension', 'kimball'],
      response:
        `Star schema answer: fact table (measures + foreign keys to dimensions) surrounded by dimension tables (descriptive attributes). Star is denormalized for query performance. Compare with snowflake (normalized dimensions) — star is faster for BI queries, snowflake saves storage. Interview signal: mention slowly changing dimensions (SCD Type 1/2) and why they matter for historical reporting.`,
    },
    {
      keywords: ['cdc', 'change data capture', 'debezium'],
      response:
        `CDC answer: captures row-level changes from source databases via transaction log mining. Tools: Debezium (Kafka-based), AWS DMS, Azure Data Factory. Patterns: log-based CDC (most accurate, zero source impact) vs query-based (simpler but misses deletes). Interview gotcha: explain how you handle the initial full-load vs ongoing incremental CDC, and how you ensure exactly-once delivery.`,
    },
    {
      keywords: ['behavioral', 'tell me about', 'time when', 'example of'],
      response:
        `STAR structure for behavioral questions: **Situation** (context + scale) → **Task** (your specific responsibility) → **Action** (what YOU did — use "I" not "we") → **Result** (quantified: rows/day processed, SLA improvement, cost saved). Data engineering signal: mention data volume, reliability metrics, on-call experience, and any incident you debugged or prevented.`,
    },
  ],

  architecture: [
    {
      keywords: ['medallion', 'bronze', 'silver', 'gold', 'layer'],
      response:
        `Medallion layers: **Bronze** (raw, append-only, schema-on-read), **Silver** (cleaned, validated, schema-on-write with DQ checks), **Gold** (business-aggregated, query-optimized serving layer). Key decision: what validation happens at each boundary? Use Delta Lake / Iceberg for ACID semantics across all layers. Most data modeling work happens in the Silver → Gold transition.`,
    },
    {
      keywords: ['batch', 'streaming', 'real-time', 'latency', 'micro'],
      response:
        `Batch vs streaming decision: ask "what's the required latency?" — batch for hourly/daily (Spark, dbt), micro-batch for minutes (Spark Structured Streaming), streaming for seconds (Flink, Kafka Streams). Most use cases that ask for "real-time" actually need micro-batch (5–15 min). Streaming adds significant operational overhead — only choose it when the business genuinely needs sub-minute freshness.`,
    },
    {
      keywords: ['lakehouse', 'data lake', 'warehouse', 'hybrid'],
      response:
        `Lakehouse = open storage (S3/ADLS) + warehouse query performance. Key technologies: Delta Lake, Apache Iceberg, Apache Hudi — all add ACID, time travel, and schema evolution to data lakes. Choose over a managed warehouse when: you need ML workloads alongside BI, have unstructured/semi-structured data, or want to avoid vendor lock-in. Trade-off: more operational overhead than a fully managed warehouse.`,
    },
    {
      keywords: ['cost', 'expensive', 'optimize', 'savings'],
      response:
        `Cost optimization: (1) Parquet + Snappy + date partitioning can cut storage and scan costs 80%+ vs raw CSV, (2) right-size compute — use spot/preemptible instances for batch jobs, (3) auto-terminate idle clusters, (4) partition pruning and Z-ORDER reduce scanned data volume. Run a cost attribution analysis first — most overspend comes from a small number of over-scanning queries.`,
    },
    {
      keywords: ['schema evolution', 'breaking', 'backward', 'contract'],
      response:
        `Schema evolution strategy: additive changes (new nullable columns) are backward compatible — safe with Delta/Iceberg. Column renames and type changes are breaking — require a versioning window or migration. Define a schema contract between producer and consumer. Use \`mergeSchema=true\` in Delta for additive evolution. For breaking changes, use a blue-green pipeline pattern with validation before cutover.`,
    },
  ],

  roadmap: [
    {
      keywords: ['next', 'learn', 'start', 'recommend', 'what should'],
      response:
        `Recommended data engineering sequence: **Foundation** — SQL Mastery + Python for Data (unlock everything else), **Core** — PySpark (distributed processing backbone), **Platform** — pick your cloud (Azure: ADF + Databricks, AWS: Glue + EMR), **Advanced** — Delta Lake, data modeling, streaming, AI integration. Each tier directly unlocks the next.`,
    },
    {
      keywords: ['interview', 'job', 'hire', 'prepare', 'ready'],
      response:
        `Interview prep priority: (1) SQL window functions and GROUP BY — asked in 90% of data engineer interviews, (2) PySpark joins and optimization — 70%, (3) system design (design an ETL pipeline for X) — senior roles, (4) behavioral questions about incidents. Focus SQL + PySpark first — highest ROI per hour of study.`,
    },
    {
      keywords: ['plan', 'weeks', 'schedule', 'timeline', 'fast', 'quickly'],
      response:
        `Accelerated plan: **Week 1–2** SQL (all practice tasks), **Week 3–4** Python + file processing, **Week 5–6** PySpark (joins, aggregations, Spark UI), **Week 7–8** cloud platform (ADF or Glue), **Week 9–10** mock interviews daily. Rule: 80% hands-on practice, 20% theory. The Spark UI alone is worth 3 hours of dedicated study.`,
    },
    {
      keywords: ['skill', 'gap', 'missing', 'weak', 'senior'],
      response:
        `Most commonly missing mid-level skills: (1) query optimization + EXPLAIN plans, (2) partition pruning + data skew debugging in Spark, (3) CDC and upsert patterns (MERGE INTO, SCD), (4) data quality frameworks (Great Expectations, dbt tests), (5) incident RCA documentation. These are what separate mid from senior in interviews.`,
    },
  ],

  general: [
    {
      keywords: ['practice', 'exercise', 'task', 'challenge', 'project'],
      response:
        `Practice task: write a PySpark job that reads a CSV, filters rows by a numeric threshold, groups by a category column, computes count + average, and writes the result partitioned by date. This covers the most common ETL patterns and exercises 5+ skills that appear in data engineering interviews — read, filter, aggregate, write, partition.`,
    },
    {
      keywords: ['senior', 'career', 'level up', 'grow', 'promotion'],
      response:
        `What separates senior data engineers: (1) they design for failure — every pipeline has dead-letter queues, alerting, and runbooks, (2) they think in data contracts — not just "does this run" but "does the output schema match the consumer's expectation", (3) they own SLAs and can state reliability metrics for every pipeline they own, (4) they document decisions, especially tradeoffs they rejected.`,
    },
    {
      keywords: ['simplify', 'explain simply', 'eli5', 'basic'],
      response:
        `Mental model: think of a data pipeline as a factory assembly line. Raw materials (source data) come in, get cleaned and transformed at each station (transformations), and finished products (analytics tables) come out. Each station has quality checks (data validation), and if something breaks there's a log of exactly where and why. The goal: reliable, traceable, repeatable.`,
    },
    {
      keywords: ['databricks', 'spark', 'cluster', 'notebook'],
      response:
        `Databricks best practices: (1) use Delta Live Tables (DLT) for pipeline orchestration — it handles retries, data quality, and lineage automatically, (2) enable auto-optimize and auto-compaction on Delta tables, (3) use Unity Catalog for fine-grained access control, (4) right-size your cluster — most jobs don't need a Standard_DS4_v2; start smaller and scale up based on Spark UI metrics.`,
    },
  ],
}

const FALLBACK_RESPONSES: Record<CopilotContextType, string> = {
  sql:          `SQL tip: use EXPLAIN before running expensive queries. Write the smallest query that returns the right rows, then add complexity. The most common interview question after any SQL: "How would you optimize this at 10× scale?"`,
  pyspark:      `PySpark tip: always define an explicit schema when reading external data. Check the Spark UI after your first run — shuffle read/write volume tells you where the bottlenecks are before you start optimizing.`,
  incident:     `Incident workflow: (1) state the impact and severity, (2) identify the first failing component in the logs, (3) verify with a targeted SQL query, (4) apply the lowest-risk fix, (5) write an RCA with trigger, blast radius, fix, and prevention steps.`,
  interview:    `Interview framework: for technical questions, start with a clear definition, give a real-world example at production scale, then cover trade-offs and edge cases. For behavioral questions, use STAR (Situation, Task, Action, Result) and quantify the impact.`,
  architecture: `Architecture review framework: start with the SLA and data contract requirements, then choose batch vs streaming based on latency needs, pick storage by query pattern (analytical vs transactional), and define monitoring before writing any pipeline code.`,
  roadmap:      `Learning path: SQL Mastery → Python for Data → PySpark → Cloud Platform (ADF/Glue) → Advanced topics. Each skill directly unlocks the next. Spend 80% of time on hands-on practice tasks, 20% on theory.`,
  general:      `Data engineering tip: the most valuable skill isn't knowing every tool — it's the ability to reason about tradeoffs (latency vs cost, flexibility vs performance, simplicity vs scalability). Build that mental model and you can evaluate any new tool quickly.`,
}

export async function generateMockAIResponse(
  message: string,
  contextType: CopilotContextType
): Promise<string> {
  // Simulate realistic thinking delay
  await new Promise(r => setTimeout(r, 700 + Math.random() * 500))

  const lc    = message.toLowerCase()
  const rules = KEYWORD_RULES[contextType] ?? []

  for (const rule of rules) {
    if (rule.keywords.some(kw => lc.includes(kw))) {
      return rule.response
    }
  }

  // Cross-context keyword fallback — message may reference a different domain
  const allRules: KeywordRule[] = Object.values(KEYWORD_RULES).flat()
  for (const rule of allRules) {
    if (rule.keywords.some(kw => lc.includes(kw))) {
      return rule.response
    }
  }

  return FALLBACK_RESPONSES[contextType] ?? FALLBACK_RESPONSES.general
}
