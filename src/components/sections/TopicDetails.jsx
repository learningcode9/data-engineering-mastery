import { memo, useMemo, useRef, useState } from 'react';
import { AccordionItem } from '../ui/Accordion.jsx';
import { CodeBlock } from '../ui/CodeBlock.jsx';
import { DifficultyBadge } from '../ui/DifficultyBadge.jsx';
import { PracticeCard } from '../ui/PracticeCard.jsx';
import { SQLWorkspace } from '../workspace/SQLWorkspace.jsx';
import { DocLinksPanel } from '../ui/DocLinksPanel.jsx';
import { useLocalStorage } from '../../hooks/useLocalStorage.js';
import { getMentorshipForTopic } from '../../data/careerGuidance.js';

// ── Subtopic card ──────────────────────────────────────────────────────────────
function SubtopicCard({ subtopic, practiceCompleted, onTogglePractice, sqlMode }) {
  const insightGroups = [
    { title: 'Production mistakes', items: subtopic.productionMistakes },
    { title: 'Optimization tips', items: subtopic.optimizationTips },
    { title: 'Cost considerations', items: subtopic.costConsiderations },
    { title: 'Scalability concerns', items: subtopic.scalabilityConcerns },
    { title: 'Debugging tips', items: subtopic.debuggingTips },
  ].filter(group => group.items?.length > 0);

  return (
    <div className="subtopic-card">
      <div className="subtopic-card-header">
        <h5>{subtopic.title}</h5>
        <DifficultyBadge level={subtopic.difficulty} />
      </div>
      {(subtopic.badges?.length > 0 || subtopic.medallionLayer) && (
        <div className="subtopic-badges" aria-label={`${subtopic.title} learning tags`}>
          {subtopic.medallionLayer && (
            <span className={`subtopic-badge subtopic-badge--medallion subtopic-badge--${subtopic.medallionLayer.toLowerCase().replace(/\s+/g, '-')}`}>
              {subtopic.medallionLayer}
            </span>
          )}
          {subtopic.pipelineStage && <span className="subtopic-badge subtopic-badge--stage">{subtopic.pipelineStage}</span>}
          {(subtopic.badges ?? []).map(badge => <span key={badge} className="subtopic-badge">{badge}</span>)}
          {subtopic.dependsOn && <span className="subtopic-badge subtopic-badge--dependency">Needed before {subtopic.dependsOn}</span>}
        </div>
      )}
      <div className="subtopic-content">
        <div>
          <span>What it does</span>
          <p>{subtopic.explanation}</p>
        </div>
        <div>
          <span>Why use it</span>
          <p>{subtopic.why}</p>
        </div>
        {subtopic.businessPurpose && (
          <div className="subtopic-wide">
            <span>Business purpose</span>
            <p>{subtopic.businessPurpose}</p>
          </div>
        )}
        <div className="subtopic-full">
          <span>Syntax</span>
          <CodeBlock code={subtopic.syntax} />
        </div>
        <div className="subtopic-full">
          <span>Real-world example</span>
          <CodeBlock code={subtopic.example} />
        </div>
        <div>
          <span>Expected output</span>
          <p>{subtopic.expectedOutput}</p>
        </div>
        {subtopic.interview && (
          <div className="subtopic-wide">
            <span>Interview Q&amp;A</span>
            <div className="subtopic-interview">
              <strong>{subtopic.interview.question}</strong>
              <p>{subtopic.interview.answer}</p>
            </div>
          </div>
        )}
        {subtopic.commonMistakes?.length > 0 && (
          <div className="subtopic-wide">
            <span>Common mistakes</span>
            <ul className="subtopic-mistakes">
              {subtopic.commonMistakes.map((m, i) => (
                <li key={i}><span className="subtopic-mistake-icon">⚠</span>{m}</li>
              ))}
            </ul>
          </div>
        )}
        {subtopic.architectureRelevance && (
          <div className="subtopic-wide">
            <span>Architecture relevance</span>
            <p>{subtopic.architectureRelevance}</p>
          </div>
        )}
        {subtopic.azureRelevance && (
          <div>
            <span>Azure / Fabric / Synapse</span>
            <p>{subtopic.azureRelevance}</p>
          </div>
        )}
        {subtopic.databricksRelevance && (
          <div>
            <span>Databricks relevance</span>
            <p>{subtopic.databricksRelevance}</p>
          </div>
        )}
        {subtopic.productionContext && (
          <div className="subtopic-wide">
            <span>Production context</span>
            <p className="subtopic-production">{subtopic.productionContext}</p>
          </div>
        )}
        {subtopic.productionConcern && (
          <div className="subtopic-wide">
            <span>Production concern</span>
            <p className="subtopic-production">{subtopic.productionConcern}</p>
          </div>
        )}
        {subtopic.seniorEngineerNote && (
          <div className="subtopic-wide">
            <span>How seniors use this</span>
            <p className="subtopic-production">{subtopic.seniorEngineerNote}</p>
          </div>
        )}
        {subtopic.hint && (
          <div>
            <span>Hint</span>
            <p>{subtopic.hint}</p>
          </div>
        )}
        {subtopic.solution && (
          <div className="subtopic-wide">
            <span>Solution</span>
            <p>{subtopic.solution}</p>
          </div>
        )}
        {subtopic.performanceTip && (
          <div className="subtopic-wide">
            <span>Performance tip</span>
            <p className="subtopic-perf"><span aria-hidden="true">⚡</span> {subtopic.performanceTip}</p>
          </div>
        )}
        {subtopic.visualAids?.length > 0 && (
          <div className="subtopic-wide">
            <span>Visual thinking</span>
            <div className="subtopic-visual-grid">
              {subtopic.visualAids.map((aid, i) => (
                <article key={`${aid.title}-${i}`} className="subtopic-visual-card">
                  <strong>{aid.title}</strong>
                  <p>{aid.body}</p>
                  {aid.warning && <em>{aid.warning}</em>}
                </article>
              ))}
            </div>
          </div>
        )}
        {insightGroups.length > 0 && (
          <div className="subtopic-wide">
            <span>Senior engineering insights</span>
            <div className="subtopic-insight-list">
              {insightGroups.map(group => (
                <details key={group.title} className="subtopic-insight-card">
                  <summary>{group.title}</summary>
                  <ul>
                    {group.items.map((item, i) => <li key={i}>{item}</li>)}
                  </ul>
                </details>
              ))}
            </div>
          </div>
        )}
        {subtopic.completionOutcome && (
          <div className="subtopic-wide">
            <span>Completion outcome</span>
            <p className="subtopic-outcome">{subtopic.completionOutcome}</p>
          </div>
        )}
      </div>
      {subtopic.practice && sqlMode ? (
        <SQLWorkspace
          subtopic={subtopic}
          completed={practiceCompleted}
          onToggleComplete={onTogglePractice}
        />
      ) : subtopic.practice ? (
        <PracticeCard
          subtopic={subtopic}
          completed={practiceCompleted}
          onToggleComplete={onTogglePractice}
          sqlMode={false}
        />
      ) : null}
    </div>
  );
}

function LessonInfoCard({ label, value, code = false, accent = false, bodyClass = '' }) {
  if (!value) return null;
  return (
    <article className={`lesson-info-card${accent ? ' lesson-info-card--accent' : ''}`}>
      <span className="lesson-info-label">{label}</span>
      {code ? (
        <CodeBlock code={value} />
      ) : (
        <p className={`lesson-info-value ${bodyClass}`.trim()}>{value}</p>
      )}
    </article>
  );
}

function LessonAccordionBlock({ title, badge, badgeVariant, children, defaultOpen = false }) {
  return (
    <AccordionItem
      title={title}
      badge={badge}
      badgeVariant={badgeVariant}
      defaultOpen={defaultOpen}
      level="h4"
    >
      {children}
    </AccordionItem>
  );
}

function getTopicLessons(topic) {
  return (topic?.module?.sections ?? []).flatMap(section =>
    (section.subtopics ?? []).map(subtopic => ({
      ...subtopic,
      sectionTitle: section.title,
    }))
  );
}

function getActiveLesson(topic, lessonId) {
  const lessons = getTopicLessons(topic);
  if (!lessons.length) return null;
  return lessons.find(lesson => lesson.id === lessonId) ?? lessons[0];
}

function textFromList(value) {
  if (!value) return '';
  if (Array.isArray(value)) return value.filter(Boolean).join('\n');
  return String(value);
}

function firstText(...values) {
  return values.find(value => {
    if (Array.isArray(value)) return value.length > 0;
    return Boolean(value);
  });
}

function buildLessonItem(key, label, lesson, fallback = {}) {
  return {
    key,
    label,
    type: 'lesson',
    lesson,
    title: fallback.title ?? lesson?.title ?? label,
    explanation: firstText(lesson?.explanation, lesson?.why, fallback.explanation),
    syntax: lesson?.syntax ?? fallback.syntax,
    example: lesson?.example ?? fallback.example,
    expectedOutput: lesson?.expectedOutput ?? fallback.expectedOutput,
    useCase: firstText(lesson?.productionContext, lesson?.databricksRelevance, lesson?.azureRelevance, fallback.useCase),
    commonMistake: textFromList(firstText(lesson?.commonMistakes, lesson?.productionMistakes, lesson?.commonMistake, fallback.commonMistake)),
    azureNotes: lesson?.azureRelevance ?? fallback.azureNotes,
    databricksUsage: lesson?.databricksRelevance ?? fallback.databricksUsage,
    productionContext: textFromList(firstText(lesson?.productionContext, lesson?.productionConcern, fallback.productionContext)),
    performanceTips: textFromList(firstText(
      lesson?.performanceTip,
      lesson?.optimizationTips,
      lesson?.costConsiderations,
      fallback.performanceTips
    )),
    seniorInsights: textFromList(firstText(
      lesson?.seniorEngineerNote,
      lesson?.scalabilityConcerns,
      lesson?.debuggingTips,
      fallback.seniorInsights
    )),
    resumeTips: fallback.resumeTips,
    interviewTip: lesson?.interview
      ? `${lesson.interview.question}\n\n${lesson.interview.answer}`
      : fallback.interviewTip,
    practice: firstText(lesson?.practice, fallback.practice),
    hint: lesson?.hint ?? fallback.hint,
    solution: lesson?.solution ?? fallback.solution,
  };
}

function isRenderableTutorialItem(item) {
  if (!item) return false;
  if (item.type === 'group') return (item.children ?? []).some(isRenderableTutorialItem);
  return item.type !== 'lesson' || item.lesson || item.explanation || item.syntax || item.example;
}

function buildTutorialGroup(key, label, children) {
  return {
    key,
    label,
    type: 'group',
    children: children.filter(isRenderableTutorialItem),
  };
}

function flattenTutorialItems(items) {
  return items.flatMap(item => (item.type === 'group' ? flattenTutorialItems(item.children ?? []) : [item]));
}

function getSqlTutorialItems(topic, activeLesson, lessonSummary, whatYouLearn) {
  const lessons = getTopicLessons(topic);
  const byId = id => lessons.find(lesson => lesson.id === id);
  const byTitle = pattern => lessons.find(lesson => pattern.test(lesson.title ?? '') || pattern.test(lesson.id ?? ''));
  const overview = {
    key: 'overview',
    label: 'SQL Foundations',
    type: 'overview',
    title: 'SQL Foundations',
    lesson: null,
    explanation: 'SQL Foundations is your starting point for reading, filtering, joining, aggregating, and validating production data. Work through one concept at a time: SELECT, WHERE, joins, aggregations, windows, CTEs, MERGE, and reconciliation SQL.',
    learnItems: whatYouLearn,
    useCase: topic.careerContext?.realWorldUseCase ?? 'Production data engineers use SQL to validate Bronze and Silver tables, build Gold reporting models, debug pipeline issues, and answer stakeholder questions with trusted data.',
    interviewTip: topic.careerContext?.interviewTip ?? topic.questions?.[0]?.question,
    practice: 'Start with SELECT, then move one topic at a time through filters, joins, aggregations, window functions, CTEs, and production validation patterns.',
  };

  return [
    overview,
    buildLessonItem('select', 'SELECT', byId('sql-foundation-select') ?? byTitle(/select/i)),
    buildLessonItem('where', 'WHERE', byId('sql-foundation-where') ?? byTitle(/where/i)),
    buildTutorialGroup('joins', 'JOINs', [
      buildLessonItem('inner-join', 'INNER JOIN', byId('sql-join-inner') ?? byTitle(/inner join/i)),
      buildLessonItem('left-join', 'LEFT JOIN', byId('sql-join-left') ?? byTitle(/left join/i)),
      buildLessonItem('right-join', 'RIGHT JOIN', byId('sql-join-right-full') ?? byTitle(/right join/i)),
      buildLessonItem('full-outer-join', 'FULL OUTER JOIN', byId('sql-join-full-outer') ?? byTitle(/full outer|full join/i)),
      buildLessonItem('cross-join', 'CROSS JOIN', byId('sql-join-cross') ?? byTitle(/cross join/i)),
      buildLessonItem('self-join', 'SELF JOIN', byId('sql-join-self') ?? byTitle(/self join/i)),
    ]),
    buildLessonItem('aggregate-functions', 'Aggregate Functions', byId('sql-agg-aggregate-functions') ?? byTitle(/aggregate|count|sum|avg/i)),
    buildLessonItem('group-by', 'GROUP BY', byId('sql-agg-group-by') ?? byTitle(/group/i)),
    buildLessonItem('having', 'HAVING', byId('sql-agg-having') ?? byTitle(/having/i)),
    buildTutorialGroup('window-functions', 'Window Functions', [
      buildLessonItem('row-number', 'ROW_NUMBER', byId('sql-window-row-number') ?? byTitle(/row_number|row number/i)),
      buildLessonItem('rank', 'RANK', byId('sql-window-rank') ?? byTitle(/^rank$/i)),
      buildLessonItem('dense-rank', 'DENSE_RANK', byId('sql-window-dense-rank') ?? byTitle(/dense/i)),
      buildLessonItem('ntile', 'NTILE', byId('sql-window-ntile') ?? byTitle(/ntile/i)),
      buildLessonItem('lag', 'LAG', byId('sql-window-lag') ?? byTitle(/^lag$/i)),
      buildLessonItem('lead', 'LEAD', byId('sql-window-lead') ?? byTitle(/^lead$/i)),
      buildLessonItem('first-value', 'FIRST_VALUE', byId('sql-window-first-value') ?? byTitle(/first_value|first value/i)),
      buildLessonItem('last-value', 'LAST_VALUE', byId('sql-window-last-value') ?? byTitle(/last_value|last value/i)),
      buildLessonItem('running-totals', 'Running Totals', byId('sql-window-running-totals') ?? byTitle(/running/i)),
      buildLessonItem('partition-by-order-by', 'PARTITION BY vs ORDER BY', byId('sql-window-partitioning-logic') ?? byTitle(/partitioning/i), { title: 'PARTITION BY vs ORDER BY' }),
      buildLessonItem('dedup-row-number', 'Deduplication with ROW_NUMBER', byId('sql-window-deduplication-patterns') ?? byTitle(/dedup/i)),
    ]),
    buildLessonItem('ctes', 'CTEs', byId('sql-intermediate-ctes') ?? byTitle(/cte/i), { title: 'CTEs' }),
    buildLessonItem('recursive-ctes', 'Recursive CTEs', byId('sql-intermediate-recursive-ctes') ?? byTitle(/recursive/i)),
    buildLessonItem('subqueries', 'Subqueries', byId('sql-intermediate-subqueries') ?? byTitle(/subquer/i)),
    buildTutorialGroup('case-nulls', 'CASE / NULLs', [
      buildLessonItem('case-when', 'CASE WHEN', byId('sql-foundation-case-when') ?? byTitle(/case/i)),
      buildLessonItem('null-handling', 'NULL Handling', byId('sql-foundation-null-handling') ?? byTitle(/null/i)),
      buildLessonItem('date-functions', 'Date Functions', byId('sql-foundation-date-functions') ?? byTitle(/date function/i)),
      buildLessonItem('string-functions', 'String Functions', byId('sql-foundation-string-functions') ?? byTitle(/string function/i)),
      buildLessonItem('union', 'UNION vs UNION ALL', byId('sql-union') ?? byTitle(/union/i)),
    ]),
    buildTutorialGroup('views-temp-tables', 'Views / Temp Tables', [
      buildLessonItem('views', 'Views', byId('sql-intermediate-views') ?? byTitle(/views?/i)),
      buildLessonItem('temp-tables', 'Temp Tables', byId('sql-intermediate-temp-tables') ?? byTitle(/temp/i)),
      buildLessonItem('indexes', 'Index Basics', byId('sql-perf-indexes') ?? byTitle(/index/i), { title: 'Index Basics' }),
    ]),
    buildLessonItem('sql-functions', 'SQL Functions', byId('sql-intermediate-functions') ?? byTitle(/function/i)),
    buildLessonItem('stored-procedures', 'Stored Procedures', byId('sql-intermediate-stored-procedures') ?? byTitle(/stored/i)),
    buildLessonItem('merge-upsert', 'MERGE / UPSERT', byId('sql-intermediate-merge') ?? byTitle(/merge|upsert/i), { title: 'MERGE / UPSERT' }),
    buildTutorialGroup('validation-reconciliation', 'Validation & Reconciliation', [
      buildLessonItem('cdc-merge-logic', 'CDC Merge Logic', byId('sql-de-cdc-merge-logic') ?? byTitle(/cdc/i)),
      buildLessonItem('incremental-loads', 'Incremental Load Patterns', byId('sql-de-incremental-loads') ?? byTitle(/incremental/i)),
      buildLessonItem('reconciliation', 'Reconciliation Checks', byId('sql-de-reconciliation-queries') ?? byTitle(/reconciliation/i)),
      buildLessonItem('duplicate-detection', 'Duplicate Detection', byId('sql-de-duplicate-detection') ?? byTitle(/duplicate detection/i)),
    ]),
  ].filter(isRenderableTutorialItem);
}

function getGenericTutorialItems(topic, activeLesson, lessonSummary, whatYouLearn) {
  const lessons = getTopicLessons(topic).slice(0, 10);
  return [
    {
      key: 'overview',
      label: topic.title,
      type: 'overview',
      title: topic.title,
      lesson: activeLesson,
      explanation: topic.body ?? lessonSummary,
      learnItems: whatYouLearn,
      syntax: activeLesson?.syntax,
      example: activeLesson?.example,
      expectedOutput: activeLesson?.expectedOutput,
      useCase: topic.careerContext?.realWorldUseCase ?? activeLesson?.productionContext,
      interviewTip: topic.careerContext?.interviewTip ?? activeLesson?.interview?.question,
      practice: activeLesson?.practice ?? 'Complete the topic practice and explain the tradeoffs in interview language.',
    },
    ...lessons.map(lesson => buildLessonItem(lesson.id, lesson.title, lesson)),
    {
      key: 'practice',
      label: 'Practice',
      type: 'practice',
      title: 'Practice task',
      explanation: 'Apply this lesson to a realistic data engineering workflow.',
      lesson: activeLesson,
      practice: activeLesson?.practice,
      hint: activeLesson?.hint,
      solution: activeLesson?.solution,
    },
    {
      key: 'interview',
      label: 'Interview Q&A',
      type: 'interview',
      title: 'Interview Q&A',
      explanation: 'Turn the concept into a concise, senior-ready interview answer.',
      lesson: activeLesson,
      interviewTip: activeLesson?.interview
        ? `${activeLesson.interview.question}\n\n${activeLesson.interview.answer}`
        : topic.questions?.[0]
          ? `${topic.questions[0].question}\n\n${topic.questions[0].answer}`
          : '',
      questions: topic.questions ?? [],
    },
  ].filter(item => item.title || item.explanation || item.practice || item.interviewTip);
}

function LessonTextSection({ title, children, code = false }) {
  if (!children) return null;
  return (
    <section className={`lesson-tutorial-section${code ? ' lesson-tutorial-section--code' : ''}`}>
      <h4>{title}</h4>
      {code ? <CodeBlock code={children} /> : <p>{children}</p>}
    </section>
  );
}

function LessonAdvancedDetails({ title, children }) {
  if (!children) return null;
  return (
    <details className="lesson-tutorial-detail">
      <summary>{title}</summary>
      <p>{children}</p>
    </details>
  );
}

function TryItYourself({ item, topic, practiceCompleted, onTogglePractice }) {
  const lesson = item.lesson;
  if (!lesson?.practice) {
    return (
      <section className="lesson-try-panel">
        <div>
          <span className="lesson-try-kicker">Try it yourself</span>
          <h4>Practice the idea</h4>
          <p>{item.practice ?? 'Use this concept in a small query or implementation step before moving to the next lesson.'}</p>
        </div>
      </section>
    );
  }

  return (
    <section className="lesson-try-panel">
      <div className="lesson-try-header">
        <span className="lesson-try-kicker">Try it yourself</span>
        <h4>{topic.id === 'sql' ? 'Run the SQL practice' : 'Practice the task'}</h4>
        <p>Make one small change, validate the result, then continue.</p>
      </div>
      {topic.id === 'sql' ? (
        <SQLWorkspace
          subtopic={lesson}
          completed={practiceCompleted}
          onToggleComplete={onTogglePractice}
        />
      ) : (
        <PracticeCard
          subtopic={lesson}
          completed={practiceCompleted}
          onToggleComplete={onTogglePractice}
          sqlMode={false}
        />
      )}
    </section>
  );
}

function LessonTutorialContent({ item, topic, completed, isLocked, practiceProgress, onTogglePractice }) {
  const practiceCompleted = item.lesson?.id ? !!practiceProgress?.[item.lesson.id] : false;

  if (item.type === 'practice') {
    return (
      <div className="lesson-tutorial-content-stack">
        <LessonTextSection title="Practice task">{item.practice}</LessonTextSection>
        <LessonTextSection title="Hint">{item.hint}</LessonTextSection>
        <LessonTextSection title="Solution">{item.solution}</LessonTextSection>
        {item.lesson?.practice && (
          <div className="lesson-tutorial-practice-card">
            <PracticeCard
              subtopic={item.lesson}
              completed={practiceCompleted}
              onToggleComplete={onTogglePractice}
              sqlMode={topic.id === 'sql'}
            />
          </div>
        )}
      </div>
    );
  }

  if (item.type === 'interview') {
    return (
      <div className="lesson-tutorial-content-stack">
        <LessonTextSection title="Common interview question">{item.interviewTip}</LessonTextSection>
        {(item.questions ?? []).slice(0, 4).map((question, index) => (
          <section key={`${question.question}-${index}`} className="lesson-tutorial-section">
            <h4>{question.question}</h4>
            <p>{question.answer}</p>
          </section>
        ))}
      </div>
    );
  }

  return (
    <div className="lesson-tutorial-content-stack">
      <LessonTextSection title="What is it?">{item.explanation}</LessonTextSection>
      <LessonTextSection title="Syntax" code>{item.syntax}</LessonTextSection>
      <LessonTextSection title="Example" code>{item.example}</LessonTextSection>
      <LessonTextSection title="Expected output">{item.expectedOutput}</LessonTextSection>
      <TryItYourself
        item={item}
        topic={topic}
        practiceCompleted={practiceCompleted}
        onTogglePractice={onTogglePractice}
      />
      <LessonTextSection title="Practice task">{item.practice}</LessonTextSection>
      <LessonTextSection title="One interview question">{item.interviewTip}</LessonTextSection>
      <div className="lesson-tutorial-details-stack">
        <LessonAdvancedDetails title="Real Data Engineering Usage">{item.useCase}</LessonAdvancedDetails>
        <LessonAdvancedDetails title="Azure / Fabric Notes">{item.azureNotes}</LessonAdvancedDetails>
        <LessonAdvancedDetails title="Databricks Usage">{item.databricksUsage}</LessonAdvancedDetails>
        <LessonAdvancedDetails title="Production Context">{item.productionContext}</LessonAdvancedDetails>
        <LessonAdvancedDetails title="Performance Tips">{item.performanceTips}</LessonAdvancedDetails>
        <LessonAdvancedDetails title="Senior Engineering Insights">{textFromList([
          item.seniorInsights,
          item.commonMistake,
        ].filter(Boolean))}</LessonAdvancedDetails>
        <LessonAdvancedDetails title="Resume Tips">{item.resumeTips ?? topic.resumeRelevance}</LessonAdvancedDetails>
      </div>
      {item.type === 'overview' && (
        <section className="lesson-tutorial-section lesson-tutorial-status">
          <h4>Lesson progress</h4>
          <p>{completed ? 'This lesson is marked complete.' : isLocked ? 'Complete prerequisites first to mark this lesson complete.' : 'Read the basics, practice the task, then mark the lesson complete when you are comfortable.'}</p>
        </section>
      )}
    </div>
  );
}

function TutorialMenuEntry({ item, selectedKey, onSelect }) {
  if (item.type === 'group') {
    const isGroupActive = (item.children ?? []).some(child => child.key === selectedKey);
    const openProps = isGroupActive ? { open: true } : {};

    return (
      <details className={`lesson-tutorial-group${isGroupActive ? ' is-active' : ''}`} {...openProps}>
        <summary>{item.label}</summary>
        <div className="lesson-tutorial-sublist">
          {(item.children ?? []).map(child => (
            <TutorialMenuEntry
              key={child.key}
              item={child}
              selectedKey={selectedKey}
              onSelect={onSelect}
            />
          ))}
        </div>
      </details>
    );
  }

  return (
    <button
      type="button"
      role="tab"
      aria-selected={selectedKey === item.key}
      className={`lesson-tutorial-tab${selectedKey === item.key ? ' is-active' : ''}${item.type === 'lesson' ? ' lesson-tutorial-tab--lesson' : ''}`}
      onClick={() => onSelect(item.key)}
    >
      {item.label}
    </button>
  );
}

// ── Sticky section navigation ──────────────────────────────────────────────────
function TopicNavBar({ sections, topicId }) {
  const [activeIdx, setActiveIdx] = useState(0);
  const [hidden, setHidden]       = useState(false);
  const wrapperRef                = useRef(null);

  function handleNavClick(i) {
    setActiveIdx(i);
    const el = document.getElementById(`${topicId}-section-${i}`);
    if (!el) return;

    const trigger = el.querySelector('.accordion-trigger');
    const wasClosed = trigger && trigger.getAttribute('aria-expanded') === 'false';
    if (wasClosed) trigger.click();

    setTimeout(() => {
      const navH = wrapperRef.current ? wrapperRef.current.offsetHeight : 52;
      const rect = el.getBoundingClientRect();
      const targetY = rect.top + window.scrollY - navH - 8;
      window.scrollTo({ top: Math.max(0, targetY), behavior: 'smooth' });
    }, wasClosed ? 320 : 0);
  }

  if (hidden) {
    return (
      <div className="sql-nav-wrapper sql-nav-wrapper--hidden" ref={wrapperRef}>
        <button
          type="button"
          className="sql-nav-toggle sql-nav-show-btn"
          onClick={() => setHidden(false)}
        >
          ▾ Show section nav
        </button>
      </div>
    );
  }

  return (
    <div className="sql-nav-wrapper" ref={wrapperRef}>
      <nav className="sql-nav-bar" aria-label="Jump to section">
        {sections.map((section, i) => (
          <button
            key={section.title}
            type="button"
            className={`sql-nav-btn${activeIdx === i ? ' sql-nav-active' : ''}`}
            onClick={() => handleNavClick(i)}
          >
            {section.title}
          </button>
        ))}
      </nav>
      <button
        type="button"
        className="sql-nav-toggle sql-nav-hide-btn"
        onClick={() => setHidden(true)}
        title="Hide navigation"
        aria-label="Hide section navigation"
      >
        ✕ Hide
      </button>
    </div>
  );
}

function subtopicMatchesSearch(st, lc) {
  return (
    st.id?.toLowerCase().includes(lc) ||
    st.title?.toLowerCase().includes(lc) ||
    st.explanation?.toLowerCase().includes(lc) ||
    st.why?.toLowerCase().includes(lc) ||
    st.syntax?.toLowerCase().includes(lc) ||
    st.example?.toLowerCase().includes(lc) ||
    st.expectedOutput?.toLowerCase().includes(lc) ||
    st.practice?.toLowerCase().includes(lc) ||
    st.hint?.toLowerCase().includes(lc) ||
    st.solution?.toLowerCase().includes(lc) ||
    st.architectureRelevance?.toLowerCase().includes(lc) ||
    st.azureRelevance?.toLowerCase().includes(lc) ||
    st.databricksRelevance?.toLowerCase().includes(lc) ||
    st.productionContext?.toLowerCase().includes(lc) ||
    st.productionConcern?.toLowerCase().includes(lc) ||
    st.seniorEngineerNote?.toLowerCase().includes(lc) ||
    st.commonMistake?.toLowerCase().includes(lc) ||
    st.medallionLayer?.toLowerCase().includes(lc) ||
    st.pipelineStage?.toLowerCase().includes(lc) ||
    st.businessPurpose?.toLowerCase().includes(lc) ||
    st.productionMistakes?.some(item => item.toLowerCase().includes(lc)) ||
    st.optimizationTips?.some(item => item.toLowerCase().includes(lc)) ||
    st.costConsiderations?.some(item => item.toLowerCase().includes(lc)) ||
    st.scalabilityConcerns?.some(item => item.toLowerCase().includes(lc)) ||
    st.debuggingTips?.some(item => item.toLowerCase().includes(lc)) ||
    st.visualAids?.some(aid =>
      aid.title?.toLowerCase().includes(lc) ||
      aid.body?.toLowerCase().includes(lc) ||
      aid.warning?.toLowerCase().includes(lc)
    ) ||
    st.badges?.some(badge => badge.toLowerCase().includes(lc)) ||
    st.interview?.question?.toLowerCase().includes(lc) ||
    st.interview?.answer?.toLowerCase().includes(lc)
  );
}

// ── Topic sections with search-aware accordion ─────────────────────────────────
function TopicSections({ sections, topicId, sqlMode, searchTerm, practiceProgress, onTogglePractice }) {
  const lc = searchTerm?.toLowerCase() ?? '';
  const [openIndex, setOpenIndex] = useState(0);

  const sectionsWithMatch = useMemo(() => {
    if (!lc) return sections.map(s => ({ ...s, hasMatch: false }));
    return sections.map(s => ({
      ...s,
      hasMatch:
        s.title.toLowerCase().includes(lc) ||
        s.subtopics.some(st => subtopicMatchesSearch(st, lc)),
    }));
  }, [sections, lc]);

  const anyMatch = lc && sectionsWithMatch.some(s => s.hasMatch);

  const firstMatchIndex = lc ? sectionsWithMatch.findIndex(s => s.hasMatch) : -1;
  const effectiveOpenIndex = firstMatchIndex >= 0 ? firstMatchIndex : openIndex;

  return (
    <div className="accordion" style={{ marginTop: 8 }}>
      {sectionsWithMatch.map((section, i) => {
        const matchingSubtopics = lc
          ? section.subtopics.filter(st => subtopicMatchesSearch(st, lc))
          : section.subtopics;

        if (anyMatch && matchingSubtopics.length === 0) return null;

        const practiceSubs    = section.subtopics.filter(st => st.practice);
        const practiceTotal   = practiceSubs.length;
        const completedCount  = practiceSubs.filter(st => !!practiceProgress?.[st.id]).length;

        const badge = practiceTotal === 0
          ? `${section.subtopics.length} topics`
          : completedCount === practiceTotal
            ? '✓ Complete'
            : `${completedCount}/${practiceTotal}`;

        const isComplete = practiceTotal > 0 && completedCount === practiceTotal;
        const isOpen = i === effectiveOpenIndex;
        return (
          <AccordionItem
            key={section.title}
            id={`${topicId}-section-${i}`}
            title={section.title}
            badge={badge}
            badgeVariant={isComplete ? 'success' : undefined}
            controlledOpen={isOpen}
            onOpenChange={next => setOpenIndex(next ? i : -1)}
            level="h4"
          >
            {section.outcome && (
              <div className="phase-outcome-card">
                <span>You can now do:</span>
                <p>{section.outcome}</p>
              </div>
            )}
            <div className="subtopic-grid">
              {matchingSubtopics.map(st => (
                <SubtopicCard
                  key={st.id ?? st.title}
                  subtopic={st}
                  practiceCompleted={!!practiceProgress?.[st.id]}
                  onTogglePractice={onTogglePractice}
                  sqlMode={sqlMode}
                />
              ))}
            </div>
          </AccordionItem>
        );
      })}
    </div>
  );
}

// ── Query examples ─────────────────────────────────────────────────────────────
function QueryExamples({ examples }) {
  return (
    <section className="wide-section">
      <h4>Practice SQL Queries</h4>
      <div className="query-list">
        {examples.map(ex => (
          <div key={ex.title} className="query-example">
            <strong>{ex.title}</strong>
            <CodeBlock code={ex.sql} />
          </div>
        ))}
      </div>
    </section>
  );
}

// ── Mini project ───────────────────────────────────────────────────────────────
function MiniProject({ project }) {
  return (
    <section className="wide-section mini-project-card">
      <div className="mini-project-header">
        <span className="mini-project-kicker">Hands-on project</span>
        <h4>{project.title}</h4>
      </div>
      <p className="mini-project-goal">{project.goal}</p>
      <ol className="mini-project-steps">
        {project.steps.map((step, i) => <li key={i}>{step}</li>)}
      </ol>
      <p className="mini-project-output"><strong>Expected output:</strong> {project.output}</p>
    </section>
  );
}

function AppliedScenarios({ groups }) {
  const scenarioGroup = groups?.find(group => /real[-\s]?world|scenario/i.test(group.title));
  if (!scenarioGroup?.questions?.length) return null;

  return (
    <section className="wide-section applied-scenarios">
      <div className="applied-scenarios-header">
        <span className="mini-project-kicker">Enterprise scenarios</span>
        <h4>Production Decision Practice</h4>
      </div>
      <div className="applied-scenario-grid">
        {scenarioGroup.questions.slice(0, 3).map((q, i) => (
          <article key={i} className="applied-scenario-card">
            <strong>{q.question}</strong>
            <p>{q.answer}</p>
          </article>
        ))}
      </div>
    </section>
  );
}

// ── Overview boxes ─────────────────────────────────────────────────────────────
function OverviewSection({ overview }) {
  if (!overview?.length) return null;
  return (
    <div className="learning-content">
      {overview.map(item => (
        <section key={item.title}>
          <h4>{item.title}</h4>
          <p>{item.body}</p>
        </section>
      ))}
    </div>
  );
}

// ── Source Mapping Panel ───────────────────────────────────────────────────────
function SourceMappingPanel({ mappings }) {
  const [expanded, setExpanded] = useState(false);
  if (!mappings?.length) return null;
  return (
    <section className="source-mapping-panel">
      <button
        type="button"
        className="source-mapping-toggle"
        onClick={() => setExpanded(e => !e)}
        aria-expanded={expanded}
      >
        <span className="source-mapping-title">How This Lesson Uses Official Docs</span>
        <span className="source-mapping-count">{mappings.length} concept{mappings.length !== 1 ? 's' : ''} mapped</span>
        <span className="source-mapping-chevron" aria-hidden="true">{expanded ? '▴' : '▾'}</span>
      </button>
      {expanded && (
        <ul className="source-mapping-list">
          {mappings.map((m, i) => (
            <li key={i} className="source-mapping-item">
              <div className="source-mapping-concept">{m.concept}</div>
              <a
                href={m.sourceUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="source-mapping-source"
              >
                {m.officialSource} ↗
              </a>
              <p className="source-mapping-usage">{m.howThisLessonUsesIt}</p>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}

// ── Locked topic banner ────────────────────────────────────────────────────────
const PREREQ_NAMES = {
  sql: 'SQL', python: 'Python', pyspark: 'PySpark',
  'azure-data-factory': 'Azure Data Factory',
  'azure-databricks': 'Azure Databricks',
  'aws-glue': 'AWS Glue',
  'ai-for-data-engineers': 'AI for Data Engineers',
};

function LockedBanner({ prerequisites }) {
  const names = (prerequisites ?? []).map(id => PREREQ_NAMES[id] ?? id);
  return (
    <div className="topic-locked-banner">
      <span className="locked-banner-icon" aria-hidden="true">🔒</span>
      <div>
        <strong>This topic is locked</strong>
        <p>
          Complete{' '}
          {names.length === 1
            ? <strong>{names[0]}</strong>
            : names.map((n, i) => (
                <span key={n}>{i > 0 && (i === names.length - 1 ? ' and ' : ', ')}<strong>{n}</strong></span>
              ))
          }
          {' '}first to unlock this topic and its practice tasks.
        </p>
      </div>
    </div>
  );
}

// ── Mastery meter ──────────────────────────────────────────────────────────────
function MasteryMeter({ masteryPct, topicState }) {
  if (!topicState || topicState === 'available' || topicState === 'locked') return null;
  const isMastered = topicState === 'mastered';
  const label = isMastered ? 'Mastered' : topicState === 'completed' ? 'Completed' : 'In Progress';
  return (
    <div className="mastery-meter">
      <div className="mastery-meter-header">
        <span className={`mastery-meter-label${isMastered ? ' mastery-meter-label--gold' : ''}`}>
          {isMastered ? '⭐ ' : ''}{label}
        </span>
        <span className={`mastery-meter-pct${isMastered ? ' mastery-meter-pct--gold' : ''}`}>
          {masteryPct}% mastery
        </span>
      </div>
      <div className={`mastery-meter-track${isMastered ? ' mastery-meter-track--gold' : ''}`}>
        <div className="mastery-meter-fill" style={{ width: `${masteryPct}%` }} />
      </div>
      {!isMastered && masteryPct < 60 && (
        <p className="mastery-meter-hint">
          Complete {60 - masteryPct}% more practice tasks to reach Mastered status
        </p>
      )}
    </div>
  );
}

// ── Interview importance banner ────────────────────────────────────────────────
const IMPORTANCE_CONFIG = {
  critical: { label: 'Critical interview topic',  sub: 'Appears in nearly every Data Engineering interview.', cls: 'imp--critical' },
  high:     { label: 'High interview importance',  sub: 'Frequently asked — expect multiple questions on this.', cls: 'imp--high'     },
  medium:   { label: 'Common in interviews',       sub: 'Comes up regularly, especially for cloud-specific roles.', cls: 'imp--medium'  },
  growing:  { label: 'Rapidly growing topic',      sub: 'Increasingly asked — early knowledge gives you an edge.', cls: 'imp--growing' },
};

function InterviewImportanceBanner({ importance }) {
  const cfg = importance ? IMPORTANCE_CONFIG[importance] : null;
  if (!cfg) return null;
  return (
    <div className={`interview-importance-banner ${cfg.cls}`}>
      <span className="iib-icon" aria-hidden="true">◉</span>
      <div>
        <strong>{cfg.label}</strong>
        <p>{cfg.sub}</p>
      </div>
    </div>
  );
}

function TopicGuidanceSnapshot({ topic }) {
  const mentor = getMentorshipForTopic(topic);
  const companyCare =
    topic.careerContext?.whyItMatters ||
    topic.whyItMatters ||
    mentor.why;
  const productionUse =
    topic.careerContext?.realWorldUseCase ||
    topic.realWorldUseCase ||
    mentor.companiesUse;
  const nextText = topic.nextStep
    ? `${topic.nextStep.title}: ${topic.nextStep.reason}`
    : 'Move into projects and interview practice once this topic feels comfortable.';

  const cards = [
    { label: 'Why companies care', value: companyCare },
    { label: 'Where it is used', value: productionUse },
    { label: 'Timeline', value: `${topic.timeEstimate ?? mentor.timeline} · ${topic.difficulty ?? mentor.difficulty}` },
    { label: 'What to learn next', value: nextText },
  ];

  return (
    <section className="topic-guidance-snapshot">
      {cards.map(card => (
        <article key={card.label} className="topic-guidance-card">
          <span>{card.label}</span>
          <p>{card.value}</p>
        </article>
      ))}
    </section>
  );
}

// ── Common mistakes section ────────────────────────────────────────────────────
function CommonMistakes({ mistakes }) {
  if (!mistakes?.length) return null;
  return (
    <section className="common-mistakes-section">
      <h4 className="common-mistakes-heading">Common Mistakes to Avoid</h4>
      <ul className="common-mistakes-list">
        {mistakes.map((m, i) => {
          const [headline, ...rest] = m.split(' — ');
          return (
            <li key={i} className="common-mistake-item">
              <span className="mistake-icon" aria-hidden="true">✕</span>
              <div>
                <strong>{headline}</strong>
                {rest.length > 0 && <p>{rest.join(' — ')}</p>}
              </div>
            </li>
          );
        })}
      </ul>
    </section>
  );
}

// ── Resume relevance callout ───────────────────────────────────────────────────
function ResumeRelevance({ text }) {
  if (!text) return null;
  return (
    <div className="resume-relevance-callout">
      <span className="rrc-icon" aria-hidden="true">▣</span>
      <div>
        <strong>Resume tip</strong>
        <p>{text}</p>
      </div>
    </div>
  );
}

// ── Career context panel ───────────────────────────────────────────────────────
function CareerContextPanel({ careerContext, step }) {
  if (!careerContext) return null;
  const items = [
    { icon: '◎', label: 'Why it matters',      text: careerContext.whyItMatters    },
    { icon: '▣', label: 'Real-world use case',  text: careerContext.realWorldUseCase },
    { icon: '◉', label: 'Interview tip',        text: careerContext.interviewTip    },
    { icon: '▤', label: 'Builds toward',        text: careerContext.projectLink     },
  ];
  return (
    <section className="career-context-panel">
      <h4 className="career-context-heading">Step {step} in Your DE Career</h4>
      <div className="career-context-grid">
        {items.map(item => (
          <div key={item.label} className="career-context-item">
            <span className="career-context-icon" aria-hidden="true">{item.icon}</span>
            <div>
              <span className="career-context-label">{item.label}</span>
              <p>{item.text}</p>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}

// ── Next step card ─────────────────────────────────────────────────────────────
function NextStepCard({ nextStep, currentStep, onSelectTopic }) {
  if (!nextStep) {
    return (
      <div className="next-step-card next-step-card--final">
        <span className="next-step-icon" aria-hidden="true">✓</span>
        <div>
          <strong>All topics complete!</strong>
          <p>You have the full skill stack. Now build projects and ace your interviews.</p>
        </div>
      </div>
    );
  }
  return (
    <div className="next-step-card">
      <div className="next-step-content">
        <p className="eyebrow">Up next — Step {currentStep + 1}</p>
        <strong className="next-step-title">{nextStep.title}</strong>
        <p className="next-step-reason">{nextStep.reason}</p>
      </div>
      <button
        type="button"
        className="next-step-btn"
        onClick={() => onSelectTopic?.(nextStep.id)}
      >
        Start {nextStep.title} →
      </button>
    </div>
  );
}

// ── Quick Q&A ─────────────────────────────────────────────────────────────────
function QuickQuestions({ questions }) {
  if (!questions?.length) return null;
  return (
    <section>
      <h4>Quick Q&amp;A</h4>
      <ul className="interview-list">
        {questions.map((q, i) => (
          <li key={i} className="check-item iq-item">
            <strong>{q.question}</strong>
            <p>{q.answer}</p>
          </li>
        ))}
      </ul>
    </section>
  );
}

// ── Interview groups ───────────────────────────────────────────────────────────
const REAL_WORLD_RE = /real[-\s]?world|scenario/i;

function InterviewGroups({ groups }) {
  if (!groups?.length) return null;
  // Real-world scenarios are rendered separately by AppliedScenarios below.
  // Only render the level-based groups here to avoid the 4th-item wrap bug.
  const levelGroups = groups.filter(g => !REAL_WORLD_RE.test(g.title));
  if (!levelGroups.length) return null;
  return (
    <section className="wide-section">
      <h4>Interview Questions by Level</h4>
      <div className="interview-questions-grid">
        {levelGroups.map(group => (
          <div key={group.title} className="interview-group">
            <strong>{group.title}</strong>
            <ul className="interview-list">
              {group.questions.map((q, i) => (
                <li key={i} className="iq-item">
                  <strong>{q.question}</strong>
                  <p>{q.answer}</p>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>
    </section>
  );
}

// ── Notes box with auto-save, copy, timestamp ─────────────────────────────────
function NotesBox({ topicId, notes, onNotesChange }) {
  const [showSaved, setShowSaved] = useState(false);
  const [copyDone,  setCopyDone]  = useState(false);
  const saveTimer = useRef(null);
  const [timestamps, setTimestamps] = useLocalStorage('dem-note-timestamps', {});

  function handleChange(text) {
    onNotesChange(topicId, text);
    clearTimeout(saveTimer.current);
    setShowSaved(false);
    saveTimer.current = setTimeout(() => {
      setTimestamps(prev => ({ ...prev, [topicId]: new Date().toISOString() }));
      setShowSaved(true);
      setTimeout(() => setShowSaved(false), 2000);
    }, 700);
  }

  function handleCopy() {
    if (!notes) return;
    navigator.clipboard.writeText(notes).then(() => {
      setCopyDone(true);
      setTimeout(() => setCopyDone(false), 1800);
    });
  }

  function formatTs(iso) {
    if (!iso) return null;
    const d = new Date(iso);
    return (
      d.toLocaleDateString(undefined, { month: 'short', day: 'numeric' }) +
      ' · ' +
      d.toLocaleTimeString(undefined, { hour: 'numeric', minute: '2-digit' })
    );
  }

  const ts = timestamps[topicId];
  const charCount = (notes ?? '').length;

  return (
    <div className="notes-box">
      <div className="notes-header">
        <span>My Notes</span>
        <div className="notes-toolbar">
          {showSaved && <span className="notes-saved">Saved ✓</span>}
          {ts && !showSaved && <span className="notes-timestamp">Saved {formatTs(ts)}</span>}
          <button
            type="button"
            className="secondary-button notes-copy-btn"
            onClick={handleCopy}
            disabled={!notes}
            title="Copy notes to clipboard"
          >
            {copyDone ? '✓ Copied' : '⎘ Copy'}
          </button>
        </div>
      </div>
      <textarea
        placeholder="Write notes, key takeaways, or questions here…"
        value={notes ?? ''}
        onChange={e => handleChange(e.target.value)}
        aria-label="Topic notes"
      />
      <div className="notes-footer">
        <span className="notes-charcount">{charCount} {charCount === 1 ? 'char' : 'chars'}</span>
      </div>
    </div>
  );
}

// ── Main component ─────────────────────────────────────────────────────────────
const TopicDetails = memo(function TopicDetails({
  topic,
  lessonId,
  lessonTitle,
  previousLesson,
  nextLesson,
  completed,
  notes,
  onNotesChange,
  onToggleComplete,
  searchTerm,
  practiceProgress,
  onTogglePractice,
  onNavigateLesson,
}) {
  if (!topic) return null;
  const mod = topic.module;
  const activeLesson = useMemo(() => getActiveLesson(topic, lessonId), [topic, lessonId]);
  const lessonName = lessonTitle ?? activeLesson?.title ?? topic.title;
  const lessonSummary =
    activeLesson?.explanation ??
    activeLesson?.why ??
    topic.body ??
    topic.careerContext?.whyItMatters ??
    '';
  const estimatedTime = topic.timeEstimate ?? topic.estimatedTime ?? '20 min';
  const topicState = topic.topicState;
  const masteryPct = topic.masteryPct ?? 0;
  const isLocked   = topicState === 'locked';
  const relatedLessons = getTopicLessons(topic);
  const totalSubtopics = relatedLessons.length;
  const completedPractice = relatedLessons.reduce(
    (acc, lesson) => acc + (practiceProgress?.[lesson.id] ? 1 : 0),
    0
  );
  const whyThisMatters =
    topic.careerContext?.whyItMatters ??
    topic.whyItMatters ??
    lessonSummary;
  const whatYouLearn = [
    {
      title: 'Concept',
      body: activeLesson?.explanation ?? topic.overview?.[0]?.body ?? lessonSummary,
    },
    {
      title: 'Real-world usage',
      body: topic.careerContext?.realWorldUseCase ?? activeLesson?.productionContext ?? topic.overview?.[1]?.body ?? '',
    },
    {
      title: 'Interview angle',
      body: topic.careerContext?.interviewTip ?? activeLesson?.interview?.question ?? topic.questions?.[0]?.question ?? '',
    },
    {
      title: 'Hands-on practice',
      body: activeLesson?.practice ?? topic.overview?.[3]?.body ?? 'Practice this lesson in the workspace below.',
    },
  ].filter(item => item.body);

  const coreCards = [
    { title: 'Definition', body: activeLesson?.explanation ?? lessonSummary },
    { title: 'Syntax', code: activeLesson?.syntax },
    { title: 'Simple example', code: activeLesson?.example },
    { title: 'Expected output', body: activeLesson?.expectedOutput },
    {
      title: 'Real data engineering example',
      body: activeLesson?.productionContext ?? activeLesson?.databricksRelevance ?? topic.careerContext?.realWorldUseCase,
    },
    {
      title: 'Common interview question',
      body: activeLesson?.interview
        ? `${activeLesson.interview.question}\n\n${activeLesson.interview.answer}`
        : topic.questions?.[0]
          ? `${topic.questions[0].question}\n\n${topic.questions[0].answer}`
          : '',
    },
    { title: 'Practice task', body: activeLesson?.practice ?? topic.overview?.find(item => /practice/i.test(item.title))?.body ?? '' },
  ].filter(card => card.body || card.code);

  const advancedCards = [
    activeLesson?.azureRelevance && {
      title: 'Azure / Fabric Notes',
      body: activeLesson.azureRelevance,
    },
    activeLesson?.databricksRelevance && {
      title: 'Databricks Usage',
      body: activeLesson.databricksRelevance,
    },
    (activeLesson?.productionContext || activeLesson?.productionConcern) && {
      title: 'Production Context',
      body: [activeLesson.productionContext, activeLesson.productionConcern].filter(Boolean).join('\n\n'),
    },
    (activeLesson?.performanceTip || activeLesson?.optimizationTips?.length || activeLesson?.costConsiderations?.length) && {
      title: 'Performance Tips',
      body: [
        activeLesson.performanceTip,
        ...(activeLesson.optimizationTips ?? []),
        ...(activeLesson.costConsiderations ?? []),
      ].filter(Boolean).join('\n'),
    },
    (activeLesson?.seniorEngineerNote || activeLesson?.productionMistakes?.length || activeLesson?.scalabilityConcerns?.length || activeLesson?.debuggingTips?.length) && {
      title: 'Senior Engineering Insights',
      body: [
        activeLesson.seniorEngineerNote,
        ...(activeLesson.productionMistakes ?? []),
        ...(activeLesson.scalabilityConcerns ?? []),
        ...(activeLesson.debuggingTips ?? []),
      ].filter(Boolean).join('\n'),
    },
    (activeLesson?.commonMistake || activeLesson?.commonMistakes?.length) && {
      title: 'Common Mistakes',
      body: [
        activeLesson.commonMistake,
        ...(activeLesson.commonMistakes ?? []),
      ].filter(Boolean).join('\n'),
    },
    (activeLesson?.medallionLayer || activeLesson?.pipelineStage || activeLesson?.businessPurpose) && {
      title: 'Medallion Placement',
      body: [
        activeLesson.medallionLayer ? `Layer: ${activeLesson.medallionLayer}` : null,
        activeLesson.pipelineStage ? `Stage: ${activeLesson.pipelineStage}` : null,
        activeLesson.businessPurpose ? `Business purpose: ${activeLesson.businessPurpose}` : null,
      ].filter(Boolean).join('\n'),
    },
    ((activeLesson?.interview?.question || activeLesson?.interview?.answer) || (topic.questions?.length ?? 0) > 0) && {
      title: 'Additional Interview Questions',
      body: [
        activeLesson?.interview?.question ? `Q: ${activeLesson.interview.question}\nA: ${activeLesson.interview.answer}` : null,
        ...(topic.questions ?? []).map(q => `Q: ${q.question}\nA: ${q.answer}`),
      ].filter(Boolean).join('\n\n'),
    },
    (mod?.queryExamples?.length ?? 0) > 0 && {
      title: 'Worked examples',
      body: mod.queryExamples.map(ex => `${ex.title}\n${ex.sql}`).join('\n\n'),
    },
    mod?.miniProject && {
      title: 'Mini project',
      body: `${mod.miniProject.title}\n${mod.miniProject.goal}\n${(mod.miniProject.steps ?? []).join('\n')}\n\nExpected output: ${mod.miniProject.output}`,
    },
    (mod?.miniProjects?.length ?? 0) > 0 && {
      title: 'Mini projects',
      body: mod.miniProjects.map(project => `${project.title}\n${project.goal}`).join('\n\n'),
    },
  ].filter(Boolean);
  const tutorialItems = useMemo(
    () => topic.id === 'sql'
      ? getSqlTutorialItems(topic, activeLesson, lessonSummary, whatYouLearn)
      : getGenericTutorialItems(topic, activeLesson, lessonSummary, whatYouLearn),
    [topic, activeLesson, lessonSummary, whatYouLearn]
  );
  const flatTutorialItems = useMemo(() => flattenTutorialItems(tutorialItems), [tutorialItems]);
  const [selectedTutorialKey, setSelectedTutorialKey] = useState('overview');
  const selectedTutorial =
    flatTutorialItems.find(item => item.key === selectedTutorialKey) ??
    flatTutorialItems[0];

  return (
    <article className="topic-details topic-details--lesson">
      <section className="lesson-hero-card">
        <div className="lesson-hero-top">
          <div className="lesson-hero-copy">
            <div className="lesson-hero-meta">
              <span className="lesson-meta-chip">{topic.category ?? 'Topic'}</span>
              <span className="lesson-meta-chip lesson-meta-chip--diff">{topic.difficulty ?? 'Beginner'}</span>
              <span className="lesson-meta-chip lesson-meta-chip--muted">{estimatedTime}</span>
            </div>
            <h3 className="lesson-hero-title">{lessonName}</h3>
            <p className="lesson-hero-summary">{lessonSummary}</p>
          </div>
          <button
            type="button"
            className={`secondary-button lesson-hero-complete${completed ? ' completed' : ''}${isLocked ? ' disabled' : ''}`}
            onClick={() => !isLocked && onToggleComplete(topic.id)}
            disabled={isLocked}
            title={isLocked ? 'Complete prerequisites first' : undefined}
          >
            {completed ? '✓ Completed' : 'Mark complete'}
          </button>
        </div>

        <div className="lesson-hero-progress">
          <div className="lesson-hero-progress-text">
            <strong>{masteryPct}% Complete</strong>
            <span>{completedPractice} / {Math.max(1, totalSubtopics)} practice tasks completed</span>
          </div>
          <div className="lesson-hero-track">
            <div className="lesson-hero-fill" style={{ width: `${masteryPct}%` }} />
          </div>
        </div>
      </section>

      {isLocked && <LockedBanner prerequisites={topic.prerequisites} />}

      <section className="lesson-tutorial-shell" aria-label={`${topic.title} tutorial reader`}>
        <aside className="lesson-tutorial-menu" aria-label="Lesson topics">
          <div className="lesson-tutorial-menu-title">
            <span>Tutorial menu</span>
            <strong>{topic.title}</strong>
          </div>
          <div className="lesson-tutorial-list" role="tablist" aria-label="Select a lesson topic">
            {tutorialItems.map(item => (
              <TutorialMenuEntry
                key={item.key}
                item={item}
                selectedKey={selectedTutorial.key}
                onSelect={setSelectedTutorialKey}
              />
            ))}
          </div>
        </aside>

        <div className="lesson-tutorial-pane" role="tabpanel">
          <div className="lesson-tutorial-pane-header">
            <span className="lesson-tutorial-eyebrow">{selectedTutorial.type === 'overview' ? 'Start here' : selectedTutorial.label}</span>
            <h3>{selectedTutorial.title}</h3>
          </div>
          <LessonTutorialContent
            item={selectedTutorial}
            topic={topic}
            completed={completed}
            isLocked={isLocked}
            practiceProgress={practiceProgress}
            onTogglePractice={onTogglePractice}
          />
          <details className="lesson-tutorial-reference-row">
            <summary>Notes and references</summary>
            <div className="lesson-tutorial-reference-inner">
              <NotesBox topicId={topic.id} notes={notes} onNotesChange={onNotesChange} />
              <div className="lesson-tutorial-reference-links">
                <ResumeRelevance text={topic.resumeRelevance} />
                <DocLinksPanel docIds={topic.docs} />
                <SourceMappingPanel mappings={mod?.documentationMapping} />
              </div>
            </div>
          </details>
        </div>
      </section>

      <nav className="lesson-footer-nav" aria-label="Previous and next topic">
        <button
          type="button"
          className="lesson-back-btn lesson-back-btn--nav"
          onClick={() => previousLesson && onNavigateLesson?.(previousLesson.id)}
          disabled={!previousLesson}
        >
          ← Previous Topic
        </button>
        <button
          type="button"
          className="lesson-next-btn lesson-next-btn--nav"
          onClick={() => nextLesson ? onNavigateLesson?.(nextLesson.id) : null}
          disabled={!nextLesson}
        >
          Next Topic →
        </button>
      </nav>
    </article>
  );
});

export default TopicDetails;
