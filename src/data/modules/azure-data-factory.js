export const adfModule = {
  sections: [
    {
      title: 'Pipelines & Activities',
      subtopics: [
        {
          id: 'adf-pipeline',
          title: 'What is a Pipeline?',
          difficulty: 'beginner',
          explanation: 'A pipeline is a logical group of activities that together perform a data movement or transformation task.',
          why: 'Pipelines let you orchestrate multi-step data flows — copy, transform, validate — as a single managed unit.',
          syntax: `Pipeline\n  └─ Activity 1: Copy Data (source → sink)\n  └─ Activity 2: Stored Procedure (transform)\n  └─ Activity 3: Email Notification (on success)`,
          example: `Pipeline: "Load Daily Sales"\n  1. Copy Activity  → copy CSV from Blob Storage to SQL\n  2. Stored Proc    → run dbo.usp_calc_summary\n  3. Web Activity   → POST to Slack webhook "Done"`,
          expectedOutput: 'Daily sales loaded and summary recalculated. Slack notified.',
          interview: {
            question: 'What is the difference between a pipeline and an activity in ADF?',
            answer: 'A pipeline is the container. An activity is a single step inside it. One pipeline can have many activities connected by success/failure/completion conditions.',
          },
        },
        {
          id: 'adf-copy-activity',
          title: 'Copy Activity',
          difficulty: 'beginner',
          explanation: 'Copy Activity moves data from a source to a sink, with optional column mapping and transformations.',
          why: 'It is the most common ADF activity — used for ingesting files into a data lake or loading tables into a warehouse.',
          syntax: `Source:  Azure Blob Storage (CSV)\nSink:    Azure SQL Database (table)\nMapping: file columns → table columns`,
          example: `Copy Activity: "Ingest Orders"\n  Source:\n    - Linked Service: BlobStorageLS\n    - File:  orders/2024-01-15.csv\n    - Format: DelimitedText (header=true)\n  Sink:\n    - Linked Service: SqlDwLS\n    - Table: staging.orders\n    - Write mode: Insert`,
          expectedOutput: 'Rows read: 4200 | Rows written: 4200 | Duration: 18s',
          interview: {
            question: 'What is a linked service in ADF?',
            answer: 'A linked service stores the connection information (URL, credentials) for an external system. Activities reference linked services rather than storing credentials directly.',
          },
        },
      ],
    },
    {
      title: 'Triggers & Parameters',
      subtopics: [
        {
          id: 'adf-triggers',
          title: 'Triggers',
          difficulty: 'beginner',
          explanation: 'A trigger defines when a pipeline runs — on a schedule, on a storage event, or manually.',
          why: 'Scheduling with triggers removes manual work. You set it once and the pipeline loads data automatically.',
          syntax: `Trigger Types:\n  - Schedule trigger   → cron expression (e.g. daily at 6am)\n  - Storage event      → fires when a file arrives in Blob\n  - Tumbling window    → fixed time windows with retry`,
          example: `Schedule Trigger: "Daily 6AM Load"\n  Recurrence: Every 1 day\n  Start time: 2024-01-01 06:00 UTC\n  Pipeline:   LoadDailySalesPipeline\n  Parameter:  date = @trigger().scheduledTime`,
          expectedOutput: 'Pipeline LoadDailySalesPipeline starts at 06:00 UTC each day',
          interview: {
            question: 'What is a tumbling window trigger and when would you use it?',
            answer: 'It fires for fixed, non-overlapping time windows and retries failed windows automatically. Good for hourly or daily batch loads that must process every window exactly once.',
          },
        },
        {
          id: 'adf-parameters',
          title: 'Parameters & Variables',
          difficulty: 'intermediate',
          explanation: 'Parameters are pipeline-level inputs set at runtime. Variables are internal pipeline values you update during execution.',
          why: 'Parameterised pipelines are reusable — the same pipeline loads any date range or table by passing different parameter values.',
          syntax: `Parameter: load_date (type: String, default: @utcnow())\n\nCopy Activity source path:\n  "raw/orders/@{pipeline().parameters.load_date}.csv"`,
          example: `Parameters:\n  - load_date: "2024-01-15"\n  - target_table: "staging.orders"\n\nCopy source: "raw/orders/@{pipeline().parameters.load_date}.csv"\nCopy sink:   "@{pipeline().parameters.target_table}"`,
          expectedOutput: 'Loads raw/orders/2024-01-15.csv into staging.orders',
          interview: {
            question: 'Why use parameters instead of hardcoding dates in a pipeline?',
            answer: 'Parameters let you re-run the same pipeline for any date (backfill, reprocess) without editing the pipeline definition.',
          },
        },
      ],
    },
  ],
};
