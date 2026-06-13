import { memo, useState } from 'react';
import { topics } from '../../data/topics.js';
import { useLocalStorage } from '../../hooks/useLocalStorage.js';
import useLearningStore from '../../store/learningStore.js';

const TOPIC_SKILLS = {
  'sql':                   ['SQL queries & joins', 'Window functions (ROW_NUMBER, LAG, RANK)', 'CTEs & subqueries', 'Query optimization'],
  'python':                ['Python ETL scripting', 'API ingestion & pagination', 'Data validation', 'File I/O (CSV, JSON, Parquet)'],
  'pyspark':               ['PySpark DataFrames', 'Spark transformations & actions', 'Lazy evaluation', 'Data partitioning'],
  'azure-data-factory':    ['ADF pipelines & activities', 'Schedule & event triggers', 'Linked services & datasets', 'Pipeline monitoring & retry'],
  'azure-databricks':      ['Databricks notebooks', 'Delta Lake & ACID transactions', 'Medallion architecture (Bronze/Silver/Gold)', 'Unity Catalog'],
  'aws-glue':              ['AWS Glue ETL jobs', 'Glue Data Catalog & crawlers', 'Job bookmarks (incremental loads)', 'Athena integration'],
  'ai-for-data-engineers': ['LLM prompt engineering', 'RAG pipeline basics', 'AI-assisted code review', 'Vector store concepts'],
};

const TOPIC_PROJECT_BULLETS = {
  'sql':                   'Built SQL analytics queries using window functions and CTEs against a multi-table transactional schema.',
  'python':                'Developed Python ETL pipeline that ingests paginated API data, validates schema, and writes partitioned Parquet files.',
  'pyspark':               'Implemented PySpark transformation job processing 10M+ rows with deduplication using window functions and Delta writes.',
  'azure-data-factory':    'Designed ADF pipeline with event-triggered copy activity, Databricks notebook step, and alerting on failure.',
  'azure-databricks':      'Built end-to-end medallion lakehouse in Azure Databricks: Auto Loader ingestion, Silver cleaning, Gold aggregation with Delta Lake.',
  'aws-glue':              'Configured AWS Glue crawler and incremental job to process S3-partitioned data and register tables in the Glue Catalog.',
  'ai-for-data-engineers': 'Prototyped RAG pipeline using text embeddings and vector search to enable semantic querying over data documentation.',
};

const TOPIC_TALKING_POINTS = {
  'sql':                   'I can write window functions to deduplicate late-arriving events, and I understand query plan analysis to avoid full table scans.',
  'python':                'I\'ve built Python ETL scripts with proper error handling, schema validation, and unit tests — not just one-off scripts.',
  'pyspark':               'I understand the difference between transformations and actions, and I know how to diagnose and fix data skew in production jobs.',
  'azure-data-factory':    'I can design ADF pipelines that handle failure gracefully — retry policies, dependency conditions, and email alerts on errors.',
  'azure-databricks':      'I\'ve applied the medallion architecture in practice: Bronze for raw ingestion, Silver for clean typed data, Gold for business aggregates.',
  'aws-glue':              'I understand when to use Glue versus EMR versus Athena, and how job bookmarks solve the incremental load problem without re-processing.',
  'ai-for-data-engineers': 'I know how to build a RAG pipeline end-to-end — chunking strategy, embedding model selection, vector store retrieval, and prompt design.',
};

const ResumeOutput = memo(function ResumeOutput() {
  const completedTopics = useLearningStore(s => s.completedTopics);
  const [learnedSet]    = useLocalStorage('dem-interview-learned', {});
  const [copyDone, setCopyDone] = useState(false);

  const comp = completedTopics ?? {};
  const learned = learnedSet ?? {};

  const doneTopics = topics.filter(t => comp[t.id]);
  const learnedCount = Object.values(learned).filter(Boolean).length;

  const allSkills = doneTopics.flatMap(t => TOPIC_SKILLS[t.id] ?? []);
  const allBullets = doneTopics.map(t => TOPIC_PROJECT_BULLETS[t.id]).filter(Boolean);
  const allTalkingPoints = doneTopics.map(t => TOPIC_TALKING_POINTS[t.id]).filter(Boolean);

  const isEmpty = doneTopics.length === 0 && learnedCount === 0;

  function handleCopySkills() {
    const text = allSkills.join('\n');
    navigator.clipboard.writeText(text).then(() => {
      setCopyDone(true);
      setTimeout(() => setCopyDone(false), 1800);
    });
  }

  return (
    <section className="section" id="resume-output">
      <div className="section-title-row">
        <div>
          <p className="eyebrow">Career Tools</p>
          <h2>Resume &amp; Interview Output</h2>
          <p style={{ color: 'var(--muted)', fontSize: 13, margin: '4px 0 0' }}>
            Complete topics to generate resume bullet points and talking points.
          </p>
        </div>
      </div>

      {isEmpty ? (
        <div className="resume-empty-state resume-empty-state--locked">
          <span className="resume-empty-state-lock" aria-hidden="true">🔒</span>
          <div className="resume-empty-state-copy">
            <strong>Complete your first topic to unlock Resume &amp; Interview Output</strong>
            <p>Mark a topic as completed to generate resume bullet points, interview talking points, and skill summaries.</p>
            <ul>
              <li>Resume bullet points</li>
              <li>Interview talking points</li>
              <li>Skill summaries</li>
            </ul>
          </div>
        </div>
      ) : (
        <div className="resume-output-grid">
          <div className="resume-panel">
            <div className="resume-panel-header">
              <h3>Skills Earned</h3>
              {allSkills.length > 0 && (
                <button type="button" className="secondary-button" onClick={handleCopySkills}>
                  {copyDone ? '✓ Copied' : '⎘ Copy skills'}
                </button>
              )}
            </div>
            {allSkills.length > 0 ? (
              <ul className="resume-skills-list">
                {allSkills.map(skill => (
                  <li key={skill} className="resume-skill-chip">{skill}</li>
                ))}
              </ul>
            ) : (
              <p className="resume-panel-empty">Complete a topic to see your skills here.</p>
            )}
          </div>

          <div className="resume-panel">
            <div className="resume-panel-header">
              <h3>Project Bullets</h3>
            </div>
            {allBullets.length > 0 ? (
              <ul className="resume-bullet-list">
                {allBullets.map((bullet, i) => (
                  <li key={i}>{bullet}</li>
                ))}
              </ul>
            ) : (
              <p className="resume-panel-empty">Complete a topic to generate project bullet points.</p>
            )}
          </div>

          <div className="resume-panel resume-panel--wide">
            <div className="resume-panel-header">
              <h3>Interview Talking Points</h3>
              {learnedCount > 0 && (
                <span className="resume-learned-badge">{learnedCount} questions learned</span>
              )}
            </div>
            {allTalkingPoints.length > 0 ? (
              <ul className="resume-talking-list">
                {allTalkingPoints.map((point, i) => (
                  <li key={i}>
                    <span className="resume-talking-topic">{doneTopics[i]?.title}</span>
                    <p>{point}</p>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="resume-panel-empty">Complete a topic to unlock talking points.</p>
            )}
          </div>
        </div>
      )}
    </section>
  );
});

export default ResumeOutput;
