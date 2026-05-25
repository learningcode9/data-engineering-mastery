import { memo, useState, useRef, useEffect, useMemo } from 'react';
import MonacoEditor from '@monaco-editor/react';
import { CodeBlock } from '../ui/CodeBlock.jsx';

const NOTEBOOKS = [
  {
    id: 'bronze-ingest',
    name: '01_bronze_ingest',
    path: '/pipelines/01_bronze_ingest',
    language: 'Python',
    cells: [
      {
        type: 'markdown',
        source: '# Bronze Ingestion — Auto Loader\nIngest raw CSV files from ADLS into Bronze Delta table using Databricks Auto Loader.',
      },
      {
        type: 'code',
        source: `# Configure Auto Loader with schema evolution
bronze_df = (
    spark.readStream
    .format("cloudFiles")
    .option("cloudFiles.format", "csv")
    .option("cloudFiles.schemaLocation", "/mnt/bronze/_schema/sales")
    .option("header", "true")
    .load("/mnt/raw/sales/")
    .withColumn("_ingested_at", current_timestamp())
    .withColumn("_source_file", input_file_name())
)`,
        output: null,
        executionTime: '1.8s',
        logs: [
          'Scanning cloudFiles source: /mnt/raw/sales/',
          'Schema inference complete: 14 columns detected',
          'Auto Loader trigger: availableNow',
        ],
      },
      {
        type: 'code',
        source: `# Write stream to Bronze Delta table
(bronze_df.writeStream
    .format("delta")
    .outputMode("append")
    .option("checkpointLocation", "/mnt/bronze/_checkpoints/sales")
    .trigger(availableNow=True)
    .toTable("bronze.sales_raw")
)`,
        output: { type: 'stream', text: 'Stream started. Processing 1 batch...\nBatch 0 completed in 8.4s. 142,890 rows written to bronze.sales_raw.\nCheckpoint saved to /mnt/bronze/_checkpoints/sales.' },
        executionTime: '8.4s',
        logs: [
          'StreamingQuery started: bronze.sales_raw',
          'Micro-batch 0 scheduled',
          '142,890 records written (append mode)',
          'Checkpoint committed to ADLS',
        ],
      },
      {
        type: 'code',
        source: `# Verify Bronze table
spark.sql("""
  SELECT COUNT(*) as row_count, MAX(_ingested_at) as last_ingested
  FROM bronze.sales_raw
""").show()`,
        output: { type: 'table', headers: ['row_count', 'last_ingested'], rows: [['142,890', '2024-01-16 09:14:22']] },
        executionTime: '1.2s',
        logs: [
          'Executing SQL on bronze.sales_raw',
          'Scan complete: 142,890 rows',
          'Query plan optimized (predicate pushdown)',
        ],
      },
    ],
  },
  {
    id: 'silver-transform',
    name: '02_silver_transform',
    path: '/pipelines/02_silver_transform',
    language: 'Python',
    cells: [
      {
        type: 'markdown',
        source: '# Silver Transformation\nClean, deduplicate, and enrich Bronze data. Apply SCD Type 2 for customer dimension.',
      },
      {
        type: 'code',
        source: `from delta.tables import DeltaTable
from pyspark.sql.functions import col, to_date, row_number
from pyspark.sql.window import Window

# Read Bronze and cast types
silver_df = (
    spark.table("bronze.sales_raw")
    .filter(col("order_id").isNotNull())
    .withColumn("order_date", to_date(col("order_date"), "yyyy-MM-dd"))
    .withColumn("amount", col("amount").cast("double"))
    .dropDuplicates(["order_id"])
)
print(f"Rows after dedup: {silver_df.count():,}")`,
        output: { type: 'text', text: 'Rows after dedup: 141,203' },
        executionTime: '3.7s',
        logs: [
          'Reading bronze.sales_raw (142,890 rows)',
          'Filter applied: order_id IS NOT NULL',
          'Type casting: order_date, amount',
          'Dedup on order_id: 1,687 duplicates removed',
        ],
      },
      {
        type: 'code',
        source: `# MERGE into Silver (upsert pattern)
delta_table = DeltaTable.forName(spark, "silver.sales")
(delta_table.alias("t")
  .merge(silver_df.alias("s"), "t.order_id = s.order_id")
  .whenMatchedUpdateAll()
  .whenNotMatchedInsertAll()
  .execute()
)
print("Merge complete")`,
        output: { type: 'text', text: 'Merge complete\n+ 141,203 rows upserted into silver.sales' },
        executionTime: '14.2s',
        logs: [
          'Delta MERGE started on silver.sales',
          'Reading target table (Silver)',
          '141,203 rows evaluated',
          'Match condition: t.order_id = s.order_id',
          'whenMatched: 0 updates | whenNotMatched: 141,203 inserts',
          'MERGE committed in 14.2s',
        ],
      },
    ],
  },
  {
    id: 'gold-aggregate',
    name: '03_gold_aggregate',
    path: '/pipelines/03_gold_aggregate',
    language: 'SQL',
    cells: [
      {
        type: 'markdown',
        source: '# Gold Aggregation Layer\nBuild business-level KPIs for BI dashboards. Optimised for Power BI DirectQuery.',
      },
      {
        type: 'code',
        source: `-- Gold: Daily sales KPIs by store and product category
CREATE OR REPLACE TABLE gold.daily_sales AS
SELECT
  store_id,
  order_date,
  product_category,
  SUM(amount)           AS total_revenue,
  COUNT(order_id)       AS order_count,
  ROUND(AVG(amount), 2) AS avg_order_value
FROM silver.sales
GROUP BY store_id, order_date, product_category;

SELECT COUNT(*) AS rows_written FROM gold.daily_sales;`,
        output: { type: 'table', headers: ['rows_written'], rows: [['8,451']] },
        executionTime: '6.8s',
        logs: [
          'CREATE OR REPLACE TABLE: gold.daily_sales',
          'Reading silver.sales (141,203 rows)',
          'GroupBy: store_id, order_date, product_category',
          '8,451 aggregated rows written to Gold',
        ],
      },
      {
        type: 'code',
        source: `-- Optimize for BI query performance
OPTIMIZE gold.daily_sales ZORDER BY (order_date, store_id);
ANALYZE TABLE gold.daily_sales COMPUTE STATISTICS FOR ALL COLUMNS;`,
        output: { type: 'table', headers: ['numFilesAdded', 'numFilesRemoved', 'avgFileSize', 'zOrderCubes'], rows: [['4', '87', '241.5 MB', '1']] },
        executionTime: '22.1s',
        logs: [
          'OPTIMIZE started: gold.daily_sales',
          'Z-ORDER by (order_date, store_id)',
          '87 small files compacted → 4 optimized files',
          'Statistics computed for all columns',
          'OPTIMIZE completed in 22.1s',
        ],
      },
    ],
  },
  {
    id: 'delta-live-tables',
    name: '04_delta_live_tables',
    path: '/pipelines/04_delta_live_tables',
    language: 'Python',
    cells: [
      {
        type: 'markdown',
        source: '# Delta Live Tables\nDefine declarative pipelines with built-in data quality expectations using DLT.',
      },
      {
        type: 'code',
        source: `# Cell 1: Define DLT Bronze table
import dlt
from pyspark.sql.functions import col, current_timestamp

@dlt.table(
    name="bronze_orders",
    comment="Raw orders ingested via Auto Loader",
    table_properties={"quality": "bronze"}
)
def bronze_orders():
    return (
        spark.readStream.format("cloudFiles")
        .option("cloudFiles.format", "json")
        .option("cloudFiles.schemaLocation", "/dlt/_schema/orders")
        .load("/raw/orders/")
        .withColumn("_ingested_at", current_timestamp())
    )`,
        output: { type: 'text', text: "DLT table 'bronze_orders' registered. Pipeline: data_platform_dlt. Mode: TRIGGERED." },
        executionTime: '2.1s',
        logs: [
          'Registering DLT table: bronze_orders',
          'Auto Loader source: /raw/orders/ (json)',
          'Schema location: /dlt/_schema/orders',
          'Table registered in pipeline: data_platform_dlt',
        ],
      },
      {
        type: 'code',
        source: `# Cell 2: Define Silver expectations
@dlt.table(name="silver_orders", comment="Validated orders with data quality checks")
@dlt.expect_or_drop("valid_order_id", "order_id IS NOT NULL")
@dlt.expect_or_drop("positive_amount", "amount > 0")
@dlt.expect("valid_customer", "customer_id IS NOT NULL", on_violation="warn")
def silver_orders():
    return dlt.read_stream("bronze_orders").filter(col("status") != "test")`,
        output: { type: 'text', text: 'Silver table registered. Expectations: 3 defined. Quality enforcement: DROP + WARN.' },
        executionTime: '1.6s',
        logs: [
          'Registering DLT table: silver_orders',
          'Expectation [DROP]: valid_order_id — order_id IS NOT NULL',
          'Expectation [DROP]: positive_amount — amount > 0',
          'Expectation [WARN]: valid_customer — customer_id IS NOT NULL',
          'Reading stream from: bronze_orders',
        ],
      },
      {
        type: 'code',
        source: `# Cell 3: Monitor DLT pipeline metrics
display(spark.sql("""
  SELECT
    name,
    num_output_rows,
    num_input_rows,
    batch_id,
    timestamp
  FROM event_log('/dlt/data_platform_dlt')
  WHERE event_type = 'flow_progress'
  ORDER BY timestamp DESC
  LIMIT 10
"""))`,
        output: {
          type: 'table',
          headers: ['name', 'num_output_rows', 'num_input_rows', 'batch_id', 'timestamp'],
          rows: [
            ['silver_orders', '18,420', '18,503', '7', '2024-01-16 09:18:44'],
            ['bronze_orders', '18,503', '18,503', '7', '2024-01-16 09:18:31'],
            ['silver_orders', '15,210', '15,210', '6', '2024-01-16 08:52:17'],
          ],
        },
        executionTime: '3.4s',
        logs: [
          'Querying DLT event log: /dlt/data_platform_dlt',
          'Filtering: event_type = flow_progress',
          '3 recent flow_progress events returned',
        ],
      },
    ],
  },
];

const MONACO_OPTIONS = {
  minimap: { enabled: false },
  lineNumbers: 'on',
  roundedSelection: false,
  scrollBeyondLastLine: false,
  readOnly: false,
  fontSize: 12,
  fontFamily: "'Fira Code', 'Courier New', monospace",
  automaticLayout: true,
  padding: { top: 8, bottom: 8 },
};

function PipelineDAG({ activeNotebook }) {
  const nodes = [
    { id: 'bronze-ingest',    label: 'Bronze',  sublabel: 'Auto Loader', color: '#cd7f32', bg: '#cd7f3215' },
    { id: 'silver-transform', label: 'Silver',  sublabel: 'Delta Merge', color: '#a0a0a0', bg: '#a0a0a015' },
    { id: 'gold-aggregate',   label: 'Gold',    sublabel: 'Aggregation', color: '#d4a800', bg: '#d4a80015' },
    { id: 'delta-live-tables',label: 'DLT',     sublabel: 'Live Tables', color: '#3ec6f5', bg: '#3ec6f515' },
  ];
  return (
    <div className="nb-dag">
      {nodes.map((node, i) => (
        <div key={node.id} className="nb-dag-node-wrap">
          <div
            className={`nb-dag-node${activeNotebook === node.id ? ' nb-dag-node--active' : ''}`}
            style={{ '--dag-color': node.color, '--dag-bg': node.bg }}
          >
            <span className="nb-dag-label">{node.label}</span>
            <span className="nb-dag-sub">{node.sublabel}</span>
          </div>
          {i < nodes.length - 1 && <span className="nb-dag-arrow">→</span>}
        </div>
      ))}
    </div>
  );
}

function ClusterStatusBar({ running, cpu, memory }) {
  return (
    <div className={`nb-cluster-bar${running ? ' nb-cluster-bar--running' : ''}`}>
      <div className="nb-cluster-indicator">
        <div className="nb-cluster-dot" />
        <div className="nb-cluster-text">
          <span className="nb-cluster-name">DE-Job-Cluster · Standard_DS3_v2 × 4</span>
          <span className="nb-cluster-status">{running ? 'Running' : 'Terminated'}</span>
        </div>
      </div>
      {running && (
        <div className="nb-cluster-metrics">
          <div className="nb-metric">
            <span className="nb-metric-label">CPU</span>
            <div className="nb-metric-bar">
              <div className="nb-metric-fill nb-metric-fill--cpu" style={{ width: `${cpu}%` }} />
            </div>
            <span className="nb-metric-val">{cpu}%</span>
          </div>
          <div className="nb-metric">
            <span className="nb-metric-label">Mem</span>
            <div className="nb-metric-bar">
              <div className="nb-metric-fill nb-metric-fill--mem" style={{ width: `${memory}%` }} />
            </div>
            <span className="nb-metric-val">{Math.round(memory * 0.28)}GB</span>
          </div>
        </div>
      )}
      <div className="nb-cluster-tags">
        <span className="nb-cluster-label">Runtime 13.3 LTS ML</span>
        <span className="nb-cluster-label">Spark 3.4.1</span>
        <span className="nb-cluster-label">Python 3.10</span>
      </div>
    </div>
  );
}

function TopClusterBar() {
  const [uptime, setUptime] = useState({ h: 3, m: 14 });

  useEffect(() => {
    const id = setInterval(() => {
      setUptime(prev => {
        const newM = prev.m + 1 >= 60 ? 0 : prev.m + 1;
        const newH = prev.m + 1 >= 60 ? prev.h + 1 : prev.h;
        return { h: newH, m: newM };
      });
    }, 60000);
    return () => clearInterval(id);
  }, []);

  return (
    <div className="nb-cluster-bar nb-cluster-bar--running nb-cluster-bar--top">
      <span className="nb-cluster-dot" />
      <span className="nb-cluster-label">RUNNING</span>
      <span className="nb-cluster-label nb-cluster-label--dim">Cluster: data-eng-cluster (14.3 LTS, 8 workers)</span>
      <span className="nb-cluster-label nb-cluster-label--dim">
        Runtime: {uptime.h}h {String(uptime.m).padStart(2, '0')}m
      </span>
      <span className="nb-cluster-label nb-cluster-label--dim">Memory: 42% used</span>
    </div>
  );
}

function CellOutput({ output, visible }) {
  if (!output) return null;
  return (
    <div className={`nb-cell-output${visible ? ' nb-cell-output--visible' : ''}`}>
      {output.type === 'text' && <pre className="nb-output-text">{output.text}</pre>}
      {output.type === 'stream' && <pre className="nb-output-stream">{output.text}</pre>}
      {output.type === 'table' && (
        <div className="nb-output-table">
          <div className="nb-table-header">
            {output.headers.map(h => <span key={h} className="nb-th">{h}</span>)}
          </div>
          {output.rows.map((row, i) => (
            <div key={i} className="nb-table-row">
              {row.map((cell, j) => <span key={j} className="nb-td">{cell}</span>)}
            </div>
          ))}
          <div className="nb-table-footer">{output.rows.length} row{output.rows.length !== 1 ? 's' : ''}</div>
        </div>
      )}
    </div>
  );
}

function NotebookCell({ cell, index, runState, cellElapsed, cellProgress, onRun }) {
  const state    = runState[index] ?? 'idle';
  const elapsed  = cellElapsed?.[index];
  const progress = cellProgress?.[index] ?? 0;

  const [selected, setSelected]     = useState(false);
  const [cellSource, setCellSource] = useState(cell.source);

  const lineCount = cellSource.split('\n').length;
  const monacoHeight = Math.max(100, lineCount * 20 + 32);

  return (
    <div
      className={`nb-cell nb-cell--${cell.type}${state === 'done' ? ' nb-cell--executed' : ''}${selected ? ' nb-cell--selected' : ''}`}
      onClick={() => cell.type === 'code' && setSelected(true)}
    >
      <div className="nb-cell-gutter">
        {cell.type === 'code' && (
          <>
            <span className="nb-cell-num">
              {state === 'running' ? (
                <span className="nb-running-indicator">●</span>
              ) : state === 'done' ? (
                <span className="nb-done-indicator">[{index}]</span>
              ) : (
                <span className="nb-idle-indicator">[ ]</span>
              )}
            </span>
            <button
              type="button"
              className={`nb-run-btn${state === 'running' ? ' nb-run-btn--running' : ''}`}
              onClick={e => { e.stopPropagation(); onRun(index); }}
              title="Run cell (Shift+Enter)"
              disabled={state === 'running'}
            >
              {state === 'running' ? '■' : '▶'}
            </button>
          </>
        )}
      </div>

      <div className="nb-cell-body">
        {cell.type === 'markdown' ? (
          <div className="nb-markdown">
            {cell.source.split('\n').map((line, i) => {
              if (line.startsWith('# '))  return <h3 key={i} className="nb-md-h1">{line.slice(2)}</h3>;
              if (line.startsWith('## ')) return <h4 key={i} className="nb-md-h2">{line.slice(3)}</h4>;
              return line ? <p key={i} className="nb-md-p">{line}</p> : null;
            })}
          </div>
        ) : (
          <>
            {selected ? (
              <div
                className="nb-monaco-wrap"
                style={{ height: monacoHeight }}
                onClick={e => e.stopPropagation()}
              >
                <MonacoEditor
                  height={monacoHeight}
                  defaultLanguage="python"
                  value={cellSource}
                  onChange={val => setCellSource(val ?? '')}
                  theme="vs-dark"
                  options={MONACO_OPTIONS}
                />
              </div>
            ) : (
              <CodeBlock code={cellSource} />
            )}

            {state === 'running' && (
              <div className="nb-running-bar">
                <div className="nb-running-fill" />
                {elapsed !== undefined && (
                  <span className="nb-elapsed-live">{elapsed}s</span>
                )}
              </div>
            )}

            {state === 'running' && (
              <div className="nb-cell-progress">
                <div
                  className="nb-cell-progress-fill"
                  style={{ width: `${progress}%`, transition: 'width 0.1s linear' }}
                />
              </div>
            )}

            {state === 'done' && (
              <>
                <CellOutput output={cell.output} visible />
                <div className="nb-execution-meta">
                  <span className="nb-execution-time">✓ {elapsed ? `${elapsed}s` : cell.executionTime}</span>
                  <span className="nb-execution-ok">OK</span>
                </div>
              </>
            )}
          </>
        )}
      </div>
    </div>
  );
}

function ExecutionLog({ logs, isOpen, onToggle }) {
  const logRef = useRef(null);
  useEffect(() => {
    if (logRef.current) logRef.current.scrollTop = logRef.current.scrollHeight;
  }, [logs]);

  return (
    <div className={`nb-log-panel${isOpen ? ' nb-log-panel--open' : ''}`}>
      <button type="button" className="nb-log-toggle" onClick={onToggle}>
        <span className="nb-log-toggle-icon">{isOpen ? '▼' : '▲'}</span>
        <span>Execution Log</span>
        {logs.length > 0 && <span className="nb-log-count">{logs.length}</span>}
      </button>
      {isOpen && (
        <div className="nb-log-body" ref={logRef}>
          {logs.length === 0 ? (
            <span className="nb-log-empty">No logs yet. Run a cell to see output.</span>
          ) : (
            logs.map((l, i) => (
              <div key={i} className={`nb-log-line nb-log-line--${l.level.toLowerCase()}`}>
                <span className="nb-log-time">{l.time}</span>
                <span className="nb-log-level">{l.level}</span>
                <span className="nb-log-msg">{l.msg}</span>
              </div>
            ))
          )}
        </div>
      )}
    </div>
  );
}

const DatabricksNB = memo(function DatabricksNB() {
  const [activeNotebook, setActiveNotebook]   = useState(NOTEBOOKS[0].id);
  const [runState, setRunState]               = useState({});
  const [cellElapsed, setCellElapsed]         = useState({});
  const [cellProgress, setCellProgress]       = useState({});
  const [clusterRunning, setClusterRunning]   = useState(false);
  const [clusterWarming, setClusterWarming]   = useState(true);
  const [warmupPct, setWarmupPct]             = useState(0);
  const [logs, setLogs]                       = useState([]);
  const [logOpen, setLogOpen]                 = useState(false);
  const [cpu, setCpu]                         = useState(12);
  const [memory, setMemory]                   = useState(18);
  const timersRef    = useRef({});
  const cpuTimerRef  = useRef(null);
  const elapsedRefs  = useRef({});

  // Cluster warmup simulation on first render
  useEffect(() => {
    const warmupSteps = [
      { pct: 15,  msg: 'Allocating cluster resources…' },
      { pct: 35,  msg: 'Starting Spark driver…' },
      { pct: 55,  msg: 'Configuring executors (4 workers)…' },
      { pct: 75,  msg: 'Loading runtime 13.3 LTS ML…' },
      { pct: 90,  msg: 'Initializing Python environment…' },
      { pct: 100, msg: 'Cluster ready', level: 'OK' },
    ];
    let delay = 0;
    warmupSteps.forEach((step, i) => {
      delay += 380 + i * 90;
      setTimeout(() => {
        setWarmupPct(step.pct);
        setLogs(prev => [...prev, {
          time: new Date().toLocaleTimeString('en-GB', { hour12: false }),
          level: step.level ?? 'INFO',
          msg: step.msg,
        }]);
        if (step.pct === 100) {
          setTimeout(() => { setClusterWarming(false); setClusterRunning(true); }, 300);
        }
      }, delay);
    });
  }, []);

  const notebook = NOTEBOOKS.find(n => n.id === activeNotebook);

  function addLog(msg, level = 'INFO') {
    const time = new Date().toLocaleTimeString('en-GB', { hour12: false });
    setLogs(prev => [...prev.slice(-99), { time, level, msg }]);
  }

  function startClusterActivity() {
    if (cpuTimerRef.current) clearInterval(cpuTimerRef.current);
    cpuTimerRef.current = setInterval(() => {
      setCpu(Math.round(30 + Math.random() * 55));
      setMemory(Math.round(35 + Math.random() * 45));
    }, 800);
  }

  function stopClusterActivity() {
    if (cpuTimerRef.current) clearInterval(cpuTimerRef.current);
    setCpu(12);
    setMemory(18);
  }

  function handleRun(cellIndex) {
    setRunState(r => ({ ...r, [cellIndex]: 'running' }));
    setCellElapsed(e => ({ ...e, [cellIndex]: 0 }));
    setCellProgress(p => ({ ...p, [cellIndex]: 0 }));
    setLogOpen(true);
    const cell    = notebook.cells[cellIndex];
    const startTs = Date.now();
    const delay   = cell.executionTime ? Math.min(parseFloat(cell.executionTime) * 1000, 3200) : 700;

    addLog(`[${cellIndex}] Executing cell in ${notebook.name}`);
    startClusterActivity();

    // Stream cell logs with staggered timing
    if (cell.logs) {
      cell.logs.forEach((msg, i) => {
        setTimeout(() => addLog(msg), 180 + i * 220);
      });
    }

    // Tick elapsed time while running
    if (elapsedRefs.current[cellIndex]) clearInterval(elapsedRefs.current[cellIndex]);
    elapsedRefs.current[cellIndex] = setInterval(() => {
      const elapsed = (Date.now() - startTs) / 1000;
      setCellElapsed(e => ({ ...e, [cellIndex]: elapsed.toFixed(1) }));
      const pct = Math.min((elapsed * 1000 / delay) * 100, 98);
      setCellProgress(p => ({ ...p, [cellIndex]: pct }));
    }, 100);

    if (timersRef.current[cellIndex]) clearTimeout(timersRef.current[cellIndex]);
    timersRef.current[cellIndex] = setTimeout(() => {
      clearInterval(elapsedRefs.current[cellIndex]);
      const elapsed = ((Date.now() - startTs) / 1000).toFixed(1);
      setCellElapsed(e => ({ ...e, [cellIndex]: elapsed }));
      setCellProgress(p => ({ ...p, [cellIndex]: 100 }));
      setRunState(r => ({ ...r, [cellIndex]: 'done' }));
      addLog(`[${cellIndex}] Completed in ${elapsed}s`, 'OK');
      stopClusterActivity();
    }, delay);
  }

  function handleRunAll() {
    addLog('Run All triggered');
    setLogOpen(true);
    const codeCells = notebook.cells
      .map((cell, i) => ({ cell, i }))
      .filter(({ cell }) => cell.type === 'code');

    let cumulativeDelay = 0;
    codeCells.forEach(({ cell, i }) => {
      setTimeout(() => handleRun(i), cumulativeDelay);
      const cellDuration = Math.min(parseFloat(cell.executionTime ?? '1') * 1000, 3200);
      cumulativeDelay += cellDuration + 1500;
    });
  }

  function handleClearOutputs() {
    setRunState({});
    setLogs([]);
    setCellProgress({});
    stopClusterActivity();
  }

  function handleSwitchNotebook(id) {
    setActiveNotebook(id);
    setRunState({});
    setCellProgress({});
  }

  const activeNb       = NOTEBOOKS.find(n => n.id === activeNotebook);
  const runningCount   = Object.values(runState).filter(s => s === 'running').length;
  const isReady        = clusterRunning && !clusterWarming;
  const doneCount      = Object.values(runState).filter(s => s === 'done').length;
  const totalCodeCells = useMemo(
    () => notebook.cells.filter(c => c.type === 'code').length,
    [notebook]
  );
  const allDone = isReady && doneCount > 0 && doneCount === totalCodeCells && runningCount === 0;
  const totalElapsedSec = useMemo(
    () => Object.values(cellElapsed).reduce((sum, v) => sum + parseFloat(v || 0), 0).toFixed(1),
    [cellElapsed]
  );

  return (
    <section className="section" id="databricks">
      <div className="section-title-row">
        <div>
          <p className="eyebrow">Simulation</p>
          <h2>Databricks Notebook</h2>
        </div>
        <div className="nb-header-right">
          <span className="nb-lang-badge">{activeNb?.language ?? 'Python'}</span>
          <span className="nb-sim-badge">Interactive</span>
        </div>
      </div>

      {/* Purpose card */}
      <div className="lab-purpose-card">
        <div className="lab-purpose-header">
          <span className="lab-purpose-icon">🧱</span>
          <div>
            <div className="lab-purpose-title">Databricks Notebook Lab</div>
            <div style={{ fontSize: '0.85rem', color: 'var(--muted)', marginTop: 2 }}>
              Estimated time: 45–90 min per module
            </div>
          </div>
        </div>
        <strong style={{ fontSize: '0.85rem', color: 'var(--heading)' }}>What you will practice:</strong>
        <ul style={{ margin: '8px 0 12px', paddingLeft: 18, fontSize: '0.875rem', color: 'var(--text)' }}>
          <li>Notebook execution and cell-by-cell PySpark workflow</li>
          <li>Delta Lake operations — Bronze, Silver, Gold ingestion and MERGE</li>
          <li>Spark DataFrame API — filtering, joins, aggregations, type casting</li>
        </ul>
        <div className="lab-skills-row">
          {['PySpark', 'Delta Lake', 'SQL Analytics', 'Unity Catalog'].map(s => (
            <span key={s} className="lab-skill-badge">{s}</span>
          ))}
        </div>
      </div>

      <PipelineDAG activeNotebook={activeNotebook} />

      {clusterWarming && (
        <div className="nb-warmup-overlay">
          <div className="nb-warmup-inner">
            <div className="nb-warmup-icon">⚙</div>
            <p className="nb-warmup-label">Starting cluster…</p>
            <div className="nb-warmup-track">
              <div className="nb-warmup-fill" style={{ width: `${warmupPct}%` }} />
            </div>
            <span className="nb-warmup-pct">{warmupPct}%</span>
          </div>
        </div>
      )}

      <div className="nb-workspace">
        <div className="nb-file-explorer">
          <div className="nb-explorer-header">Workspace</div>
          <div className="nb-explorer-tree">
            <div className="nb-tree-folder">📁 pipelines/</div>
            {NOTEBOOKS.map(nb => (
              <button
                key={nb.id}
                type="button"
                className={`nb-tree-file${nb.id === activeNotebook ? ' nb-tree-file--active' : ''}`}
                onClick={() => handleSwitchNotebook(nb.id)}
              >
                📓 {nb.name}
              </button>
            ))}
          </div>
          <div className="nb-explorer-status">
            {doneCount > 0 && (
              <div className="nb-explorer-stat">
                <span className="nb-explorer-stat-dot nb-explorer-stat-dot--done" />
                <span>{doneCount} done</span>
              </div>
            )}
            {runningCount > 0 && (
              <div className="nb-explorer-stat">
                <span className="nb-explorer-stat-dot nb-explorer-stat-dot--run" />
                <span>{runningCount} running</span>
              </div>
            )}
          </div>
        </div>

        <div className="nb-editor">
          <TopClusterBar />

          <ClusterStatusBar running={clusterRunning} cpu={cpu} memory={memory} />

          <div className="nb-toolbar">
            <span className="nb-breadcrumb">{notebook.path}</span>
            <div className="nb-toolbar-actions">
              <button
                type="button"
                className="nb-action-btn nb-action-btn--primary nb-run-all-btn"
                onClick={handleRunAll}
                disabled={!isReady}
              >
                ▶▶ Run All
              </button>
              <button type="button" className="nb-action-btn" onClick={handleClearOutputs} disabled={!isReady}>
                ✕ Clear
              </button>
              <button
                type="button"
                className="nb-action-btn"
                onClick={() => { setClusterRunning(r => !r); setClusterWarming(false); }}
              >
                {clusterRunning ? '◉ Terminate' : '▶ Start'}
              </button>
            </div>
          </div>

          <div className="nb-cells">
            {notebook.cells.map((cell, i) => (
              <NotebookCell
                key={`${notebook.id}-${i}`}
                cell={cell}
                index={i}
                runState={runState}
                cellElapsed={cellElapsed}
                cellProgress={cellProgress}
                onRun={handleRun}
              />
            ))}
          </div>

          {allDone && (
            <div className="nb-run-summary">
              <span className="nb-run-summary-ok" aria-hidden="true">✓</span>
              <div className="nb-run-summary-body">
                <strong className="nb-run-summary-title">Run complete</strong>
                <span className="nb-run-summary-detail">
                  {doneCount} cell{doneCount !== 1 ? 's' : ''} · {totalElapsedSec}s total
                </span>
              </div>
              <span className="nb-run-summary-badge">Pipeline ready</span>
            </div>
          )}

          <ExecutionLog logs={logs} isOpen={logOpen} onToggle={() => setLogOpen(o => !o)} />
        </div>
      </div>
    </section>
  );
});

export default DatabricksNB;
