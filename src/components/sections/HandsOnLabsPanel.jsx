import { memo, useEffect, useMemo, useState } from 'react';
import { AppCard, Badge, StatPill } from '../ui/design-system.jsx';
import { buildLabs, debuggingDrills, productionChecklists } from '../../data/handsOnLabs.js';
import { AdfPipelineSimulator } from './AdfPipelineSimulator.jsx';

const LAB_CATEGORIES = [
  {
    id: 'build',
    label: 'Build',
    description: 'Build ADF API pipelines, Bronze landing zones, CDC merges, and Spark transforms.',
    count: buildLabs.length,
    variant: 'info',
  },
  {
    id: 'debug',
    label: 'Debug',
    description: 'Trace failed jobs, schema drift, duplicate CDC, and recovery steps from logs.',
    count: debuggingDrills.length,
    variant: 'warning',
  },
  {
    id: 'checklist',
    label: 'Production',
    description: 'Validate release readiness, Key Vault secrets, rollback steps, and post-deploy checks.',
    count: productionChecklists.length,
    variant: 'info',
  },
];

const LAB_SETS = {
  build: buildLabs,
  debug: debuggingDrills,
  checklist: productionChecklists,
};

const LAB_META = {
  build: {
    difficulty: 'Intermediate',
    eta: '25 min',
    icon: '▣',
    cta: 'Start Lab',
    tools: item => item.services?.slice(0, 3).map(service => service.name) ?? ['ADF', 'ADLS', 'Key Vault'],
    mission: item => item.objective,
    cardSummary: item => {
      switch (item?.id) {
        case 'adf-api-ingestion': return 'Restart-safe API load into Bronze.';
        case 'medallion-transform': return 'Raw to Bronze, Silver, Gold.';
        case 'cdc-merge': return 'Replay-safe CDC upserts and deletes.';
        case 'synapse-design': return 'Design fast Synapse reporting tables.';
        case 'spark-performance': return 'Tune Spark skew and shuffle.';
        case 'cicd-deploy': return 'Promote ADF and Databricks safely.';
        default: return shortSentence(item?.objective, 74);
      }
    },
    what: item => item.scenario,
    interactiveLabel: 'Build decision',
    detailLabel: 'What you will build',
    validationLabel: 'Validation',
    notesLabel: 'Interview notes',
    hintLabel: 'Hints',
    mistakeLabel: 'Common mistakes',
    stepLabel: 'Steps',
    stepTitle: 'Task checklist',
    notes: item => [item.interviewAngle],
    hints: item => item.optimizationTips,
    mistakes: item => item.commonMistakes,
    validation: item => item.validation,
    stepItems: item => item.steps,
    solution: item => item.productionChecklist,
    completionCopy: 'Practice the full pipeline end to end before moving on.',
  },
  debug: {
    difficulty: 'Advanced',
    eta: '15 min',
    icon: '⚠',
    cta: 'Start Drill',
    tools: () => ['Logs', 'Spark', 'ADF'],
    mission: item => `Investigate why ${item.title.toLowerCase()} is failing and restore a clean run.`,
    cardSummary: item => {
      switch (item?.id) {
        case 'failed-adf-trigger': return 'Trace why the scheduled ADF run stopped.';
        case 'schema-mismatch': return 'Trace the source schema change that broke ingest.';
        case 'duplicate-cdc': return 'Stop duplicate CDC rows after a replay.';
        case 'null-explosion': return 'Fix a join that multiplied rows and nulls.';
        case 'slow-shuffle': return 'Reduce Spark shuffle caused by skew.';
        case 'synapse-distribution': return 'Remove extra data movement in Synapse.';
        case 'powerbi-refresh': return 'Restore a broken Power BI refresh.';
        default: return shortSentence(item?.symptoms?.[0] ?? 'Use logs, history, and run metadata to isolate the failure.', 74);
      }
    },
    what: item => item.symptoms?.[0] ?? 'Use logs, history, and run metadata to isolate the failure.',
    interactiveLabel: 'Debug decision',
    detailLabel: 'What you will investigate',
    validationLabel: 'Validation',
    notesLabel: 'Interview notes',
    hintLabel: 'Hints',
    mistakeLabel: 'Common mistakes',
    stepLabel: 'Steps',
    stepTitle: 'Investigation path',
    notes: item => [
      'Explain the failure shape first, then show how you narrowed the cause.',
      `Root cause: ${item.rootCause}`,
      `Fix: ${item.fix}`,
    ],
    hints: item => item.logs,
    mistakes: () => [
      'Restarting the job before reading the error.',
      'Treating the symptom as the root cause.',
      'Ignoring replay, watermark, or contract state.',
    ],
    validation: item => [
      'Rerun the same window successfully.',
      'Confirm the failure no longer repeats.',
      'Verify alerts point to the correct failure layer.',
    ],
    stepItems: item => item.investigation,
    solution: item => [
      `Root cause: ${item.rootCause}`,
      `Fix: ${item.fix}`,
      `Prevention: ${item.prevention}`,
    ],
    completionCopy: 'Your fix should be safe to replay and easy to explain.',
  },
  checklist: {
    difficulty: 'Beginner',
    eta: '10 min',
    icon: '✓',
    cta: 'Start Review',
    tools: () => ['DevOps', 'Key Vault', 'QA'],
    mission: () => 'Validate the release, smoke test the flow, and keep rollback ready.',
    cardSummary: () => 'Verify release readiness and rollback steps.',
    what: () => 'Use this checklist before release cutover or production promotion.',
    interactiveLabel: 'Release decision',
    detailLabel: 'What you will validate',
    validationLabel: 'Validation',
    notesLabel: 'Interview notes',
    hintLabel: 'Hints',
    mistakeLabel: 'Common mistakes',
    stepLabel: 'Steps',
    stepTitle: 'Go-live checklist',
    notes: () => [
      'Describe how you keep releases predictable and how you verify the first production run.',
      'Call out approvals, environment values, and rollback readiness.',
    ],
    hints: () => [
      'Check release versioning and approval flow before promoting.',
      'Keep the smoke test short and objective.',
    ],
    mistakes: () => [
      'Shipping without a smoke test.',
      'Hardcoding environment-specific values.',
      'Skipping rollback verification.',
    ],
    validation: () => [
      'Smoke test passes in dev and test.',
      'Secrets and approvals are in place.',
      'Rollback path is documented and tested.',
    ],
    stepItems: item => item.items,
    solution: () => [
      'Promote only after smoke tests pass in lower environments.',
      'Keep secrets externalized and approvals explicit.',
      'Document and test rollback before the first production run.',
    ],
    completionCopy: 'Release safety matters as much as pipeline logic.',
  },
};

function shortSentence(text, max = 74) {
  const cleaned = String(text ?? '').replace(/\s+/g, ' ').trim();
  if (cleaned.length <= max) return cleaned;
  const cut = cleaned.slice(0, max - 1);
  const trimmed = cut.slice(0, Math.max(cut.lastIndexOf(' '), 20)).trimEnd();
  return `${trimmed}…`;
}

function countLabel(categoryId) {
  const total = LAB_SETS[categoryId]?.length ?? 0;
  return `${total} ${total === 1 ? 'item' : 'items'}`;
}

function ToolGrid({ tools }) {
  if (!tools?.length) return null;
  return (
    <div className="hol-tool-grid">
      {tools.map(tool => (
        <span key={tool} className="hol-tool-chip">{tool}</span>
      ))}
    </div>
  );
}

function BulletList({ items }) {
  if (!items?.length) return null;
  return (
    <ul className="hol-bullet-list" role="list">
      {items.map((item, idx) => (
        <li key={`${item}-${idx}`}>
          <span className="hol-bullet-mark" aria-hidden="true">•</span>
          <span>{item}</span>
        </li>
      ))}
    </ul>
  );
}

function CheckList({ items }) {
  if (!items?.length) return null;
  return (
    <ul className="hol-check-list" role="list">
      {items.map((item, idx) => (
        <li key={`${item}-${idx}`}>
          <span className="hol-check-icon" aria-hidden="true">✓</span>
          <span>{item}</span>
        </li>
      ))}
    </ul>
  );
}

function Disclosure({ title, subtitle, defaultOpen = false, children }) {
  return (
    <details className="hol-disclosure" open={defaultOpen}>
      <summary>
        <div>
          <strong>{title}</strong>
          {subtitle ? <span>{subtitle}</span> : null}
        </div>
        <span className="hol-disclosure-caret" aria-hidden="true">⌄</span>
      </summary>
      <div className="hol-disclosure-body">
        {children}
      </div>
    </details>
  );
}

function PracticeChoices({ prompt, options, selectedIndex, onSelect, feedback }) {
  return (
    <div className="hol-practice-choices">
      <div className="hol-practice-question">
        <p className="hol-section-label">Interactive task</p>
        <h4>{prompt}</h4>
      </div>
      <div className="hol-choice-grid" role="radiogroup" aria-label={prompt}>
        {options.map((option, idx) => {
          const active = selectedIndex === idx;
          return (
            <button
              key={option.label}
              type="button"
              className={`hol-choice-btn${active ? ' hol-choice-btn--active' : ''}${option.correct && active ? ' hol-choice-btn--correct' : ''}`}
              onClick={() => onSelect(idx)}
              aria-pressed={active}
            >
              <span className="hol-choice-label">{option.label}</span>
              <span className="hol-choice-meta">{option.tag}</span>
            </button>
          );
        })}
      </div>
      {feedback ? (
        <div className={`hol-feedback ${feedback.variant === 'success' ? 'hol-feedback--success' : feedback.variant === 'warning' ? 'hol-feedback--warning' : 'hol-feedback--neutral'}`}>
          <strong>{feedback.title}</strong>
          <p>{feedback.message}</p>
        </div>
      ) : null}
    </div>
  );
}

function StepList({ items, completedMap, onToggle }) {
  if (!items?.length) return null;
  return (
    <ul className="hol-step-list" role="list">
      {items.map((item, idx) => {
        const checked = !!completedMap?.[idx];
        return (
          <li key={`${item}-${idx}`}>
            <button
              type="button"
              className={`hol-step-toggle${checked ? ' hol-step-toggle--checked' : ''}`}
              onClick={() => onToggle(idx)}
              aria-pressed={checked}
            >
              <span className="hol-step-box" aria-hidden="true">{checked ? '✓' : '□'}</span>
              <span>{item}</span>
            </button>
          </li>
        );
      })}
    </ul>
  );
}

function PracticeStatus({ selectedIndex, options, completedCount, totalSteps, validation }) {
  const answerText = selectedIndex == null ? 'No answer selected yet.' : options[selectedIndex]?.label ?? 'Selected answer';
  return (
    <div className="hol-practice-status">
      <div>
        <span className="hol-practice-status-label">Answer</span>
        <strong>{answerText}</strong>
      </div>
      <div>
        <span className="hol-practice-status-label">Steps</span>
        <strong>{completedCount}/{totalSteps}</strong>
      </div>
      <div>
        <span className="hol-practice-status-label">Feedback</span>
        <strong>{validation?.score != null ? `${validation.score}%` : 'Pending'}</strong>
      </div>
    </div>
  );
}

function ProjectTicketCard({ ticket }) {
  return (
    <AppCard className="hol-ticket-card">
      <div className="hol-ticket-top">
        <div>
          <p className="hol-section-label">Project Ticket</p>
          <h3>{ticket.title}</h3>
          <p className="hol-ticket-subtitle">{ticket.subtitle}</p>
        </div>
        <Badge variant={ticket.priorityVariant} size="sm">{ticket.priority}</Badge>
      </div>

      <div className="hol-ticket-meta-row">
        <div>
          <span className="hol-ticket-meta-label">Business Team</span>
          <strong>{ticket.businessTeam}</strong>
        </div>
        <div>
          <span className="hol-ticket-meta-label">Priority</span>
          <strong>{ticket.priority}</strong>
        </div>
      </div>

      <div className="hol-ticket-lists">
        <div>
          <span className="hol-ticket-meta-label">Requirements</span>
          <BulletList items={ticket.requirements} />
        </div>
        <div>
          <span className="hol-ticket-meta-label">Success Criteria</span>
          <BulletList items={ticket.successCriteria} />
        </div>
      </div>
    </AppCard>
  );
}

function BuildCanvas({ stages }) {
  return (
    <AppCard className="hol-canvas-card">
      <div className="hol-canvas-header">
        <div>
          <p className="hol-section-label">Build canvas</p>
          <h3>How the office laptop build should evolve</h3>
        </div>
        <Badge variant="info" size="sm">Updates live</Badge>
      </div>
      <div className="hol-canvas-track" role="list" aria-label="Build canvas stages">
        {stages.map((stage, idx) => (
          <div key={stage.title} className={`hol-canvas-node hol-canvas-node--${stage.status}`} role="listitem">
            <span className="hol-canvas-node-index">{idx + 1}</span>
            <strong>{stage.title}</strong>
            <p>{stage.detail}</p>
          </div>
        ))}
      </div>
    </AppCard>
  );
}

function ValidationResults({ validation, successItems, failureItems, missingItems }) {
  const hasAny = successItems.length || failureItems.length || missingItems.length;
  return (
    <AppCard className="hol-validation-results">
      <div className="hol-validation-results-top">
        <div>
          <p className="hol-section-label">Validation results</p>
          <h3>{validation?.title ?? 'Check my work'}</h3>
        </div>
        <Badge variant={validation?.variant === 'success' ? 'success' : validation?.variant === 'warning' ? 'warning' : 'muted'} size="sm">
          {validation?.score != null ? `${validation.score}%` : 'Pending'}
        </Badge>
      </div>

      {!hasAny ? (
        <p className="hol-task-note">Run the check to see what passed, what failed, and what is still missing.</p>
      ) : (
        <div className="hol-validation-columns">
          <div>
            <span className="hol-ticket-meta-label">Success</span>
            <BulletList items={successItems.length ? successItems : ['No validated success yet.']} />
          </div>
          <div>
            <span className="hol-ticket-meta-label">Failures</span>
            <BulletList items={failureItems.length ? failureItems : ['No failure once the correct decision is selected.']} />
          </div>
          <div>
            <span className="hol-ticket-meta-label">Missing configuration</span>
            <BulletList items={missingItems.length ? missingItems : ['Nothing missing after validation passes.']} />
          </div>
        </div>
      )}
    </AppCard>
  );
}

function MentorPanel({ item, meta, challenge, state, validation }) {
  const selected = challenge.options[state.choiceIndex];
  const selectedLabel = selected?.label ?? 'No decision selected yet.';
  const hints = item?.simulator?.mentorHints ?? meta.hints(item) ?? [];
  const productionNote = item?.simulator?.postCompletion?.incident
    ? shortSentence(item.simulator.postCompletion.incident, 130)
    : shortSentence(meta.interviewAngle, 130);

  return (
    <AppCard className="hol-mentor-panel">
      <div className="hol-mentor-header">
        <div>
          <p className="hol-section-label">AI Mentor</p>
          <h3>Contextual coaching</h3>
        </div>
        <Badge variant="info" size="sm">Live hints</Badge>
      </div>

      <div className="hol-mentor-block">
        <span className="hol-ticket-meta-label">Current decision</span>
        <strong>{selectedLabel}</strong>
        <p>{validation?.choiceFeedback?.message ?? 'Pick the safest production choice for the current step.'}</p>
      </div>

      <div className="hol-mentor-block">
        <span className="hol-ticket-meta-label">Helpful hints</span>
        <BulletList items={hints.slice(0, 3)} />
      </div>

      <div className="hol-mentor-block">
        <span className="hol-ticket-meta-label">What the interviewer checks</span>
        <p>{productionNote}</p>
      </div>
    </AppCard>
  );
}

function PostCompletionPanels({ item, meta, solutionUnlocked }) {
  const simulator = item?.simulator ?? {};
  const post = simulator.postCompletion ?? {};
  const incident = post.incident ?? `${item.title} has a production issue during a replay window. How would you diagnose it?`;
  const interview = post.interview ?? meta.interviewAngle;
  const resume = post.resume ?? meta.solution(item)?.[0] ?? 'Built a production-ready Azure Data Engineering workflow.';

  return (
    <div className="hol-post-completion-grid">
      <Disclosure
        title="Production Incident"
        subtitle={solutionUnlocked ? 'Ready to discuss' : 'Unlock after validation'}
        defaultOpen={false}
      >
        <p className="hol-task-copy">{incident}</p>
      </Disclosure>
      <Disclosure
        title="Interview Question"
        subtitle={solutionUnlocked ? 'Senior follow-up' : 'Unlock after validation'}
        defaultOpen={false}
      >
        <p className="hol-task-copy">{interview}</p>
      </Disclosure>
      <Disclosure
        title="Resume Bullet"
        subtitle={solutionUnlocked ? 'Use in your CV' : 'Unlock after validation'}
        defaultOpen={false}
      >
        <p className="hol-task-copy">{resume}</p>
      </Disclosure>
    </div>
  );
}

function getProjectTicket(categoryId, item, meta) {
  const fallbackTeam = categoryId === 'debug'
    ? 'Data Platform Operations'
    : categoryId === 'checklist'
      ? 'Release Management'
      : 'Delivery Team';
  const priority = item?.projectTicket?.priority ?? (categoryId === 'debug' ? 'P1 • Production issue' : categoryId === 'checklist' ? 'P2 • Release gate' : 'P1 • Delivery task');
  const priorityVariant = categoryId === 'debug' ? 'warning' : categoryId === 'checklist' ? 'muted' : 'info';

  return {
    title: item?.title ?? 'Project Ticket',
    subtitle: item?.scenario ? shortSentence(item.scenario, 120) : meta.mission(item),
    businessTeam: item?.projectTicket?.businessTeam ?? fallbackTeam,
    priority,
    priorityVariant,
    requirements: item?.projectTicket?.requirements ?? [
      shortSentence(meta.what(item), 110),
      categoryId === 'build'
        ? 'Keep the pipeline restart-safe and track the watermark outside the payload.'
        : categoryId === 'debug'
          ? 'Read the logs first, then isolate the root cause before changing code.'
          : 'Confirm approvals, secrets, and rollback before release.',
      categoryId === 'build'
        ? 'Land raw data in Bronze before any transformation or aggregation.'
        : categoryId === 'debug'
          ? 'Validate the replay path after the fix.'
          : 'Run a smoke test in lower environments.',
    ],
    successCriteria: item?.projectTicket?.successCriteria ?? [
      categoryId === 'build'
        ? 'Bronze row counts reconcile to the source response window.'
        : categoryId === 'debug'
          ? 'The failure no longer reproduces for the same window.'
          : 'The release is safe to promote and rollback-ready.',
      categoryId === 'build'
        ? 'A rerun with the same inputs stays idempotent.'
        : categoryId === 'debug'
          ? 'The root cause is documented with a safe prevention step.'
          : 'Secrets and environment values are parameterized.',
      categoryId === 'build'
        ? 'Key Vault and managed identity protect credentials.'
        : categoryId === 'debug'
          ? 'Alerts point at the real failure layer.'
          : 'Monitoring is in place for the first production run.',
    ],
  };
}

function getCanvasStages(categoryId, item, meta, state, validation, challenge) {
  const baseStages = item?.simulator?.canvas ?? [
    { title: 'Ticket review', detail: 'Confirm scope and source contract.' },
    { title: 'Source setup', detail: 'Create the right linked service and auth.' },
    { title: 'Landing zone', detail: 'Write to Bronze with audit metadata.' },
    { title: 'Validation gate', detail: 'Check counts, retries, and replay safety.' },
    { title: 'Production ready', detail: 'Release with monitoring and rollback notes.' },
  ];
  const selectedCorrect = challenge.options[state.choiceIndex]?.correct ?? false;
  const completedCount = Object.values(state.steps ?? {}).filter(Boolean).length;
  const totalSteps = meta.stepItems(item).length || 1;
  const finished = validation?.score === 100;

  return baseStages.map((stage, index) => {
    let status = 'pending';
    if (index === 0) status = 'complete';
    else if (index === 1) status = state.choiceIndex == null ? 'pending' : (selectedCorrect ? 'complete' : 'warning');
    else if (index === 2) status = completedCount > 0 ? 'active' : 'pending';
    else if (index === 3) status = completedCount >= Math.max(1, Math.ceil(totalSteps / 2)) ? 'active' : completedCount > 0 ? 'warning' : 'pending';
    else if (index >= 4) status = finished ? 'complete' : validation ? 'active' : 'pending';
    return { ...stage, status };
  });
}

function getValidationBreakdown(categoryId, item, meta, challenge, state, validation) {
  const selected = challenge.options[state.choiceIndex];
  const completedMap = state.steps ?? {};
  const stepItems = meta.stepItems(item);
  const missingSteps = stepItems.filter((_, idx) => !completedMap[idx]);
  const success = [];
  const failures = [];
  const missing = [];

  if (validation?.score === 100) {
    success.push(validation.message ?? 'Your decision and checklist match the production approach.');
  } else if (selected?.correct) {
    success.push('Your decision matches the production approach.');
  } else if (selected) {
    failures.push(selected.feedback || 'The selected decision is not the safest production choice.');
  } else {
    failures.push('No decision has been selected yet.');
  }

  if (validation?.score === 100) {
    success.push(categoryId === 'build' ? 'The pipeline is restart-safe and idempotent.' : categoryId === 'debug' ? 'The root cause and replay path are proven safe.' : 'Release checks and rollback steps are complete.');
  } else if (missingSteps.length) {
    missing.push(...missingSteps);
  }

  if (item?.projectTicket?.requirements?.length && validation?.score !== 100) {
    missing.push(...item.projectTicket.requirements.slice(0, 2));
  }

  return { success, failures, missing };
}

function PracticeWorkspace({ categoryId, item, meta, state, onSelectChoice, onToggleStep, onCheckWork }) {
  const question = useMemo(() => getPracticeChallenge(categoryId, item), [categoryId, item]);
  const selectedIndex = state?.choiceIndex ?? null;
  const completedMap = state?.steps ?? {};
  const validation = state?.validation ?? null;
  const completedCount = Object.values(completedMap).filter(Boolean).length;
  const totalSteps = meta.stepItems(item).length;
  const solutionUnlocked = !!state?.solutionUnlocked;
  const ticket = useMemo(() => getProjectTicket(categoryId, item, meta), [categoryId, item, meta]);
  const canvasStages = useMemo(() => getCanvasStages(categoryId, item, meta, state ?? {}, validation, question), [categoryId, item, meta, state, validation, question]);
  const breakdown = useMemo(() => getValidationBreakdown(categoryId, item, meta, question, state ?? {}, validation), [categoryId, item, meta, question, state, validation]);

  return (
    <div className="hol-sim-workspace">
      <ProjectTicketCard ticket={ticket} />

      <div className="hol-sim-grid">
        <div className="hol-sim-main">
          <AppCard className="hol-sim-overview">
            <div className="hol-sim-overview-top">
              <div>
                <p className="hol-section-label">Overview</p>
                <h3>{item.title}</h3>
              </div>
              <Badge variant={categoryId === 'debug' ? 'warning' : categoryId === 'checklist' ? 'muted' : 'info'} size="sm">
                {categoryId === 'build' ? 'Build task' : categoryId === 'debug' ? 'Debug drill' : 'Production review'}
              </Badge>
            </div>
            <p className="hol-task-copy">{meta.mission(item)}</p>
            <p className="hol-task-note">{meta.completionCopy}</p>
            <ToolGrid tools={meta.tools(item)} />
          </AppCard>

          <BuildCanvas stages={canvasStages} />

          <AppCard className="hol-sim-task-panel">
            <div className="hol-task-workspace-header">
              <div>
                <p className="hol-section-label" style={{ marginBottom: 6 }}>Interactive tasks</p>
                <h3>{item.title}</h3>
              </div>
              <Badge variant={categoryId === 'debug' ? 'warning' : 'info'}>{item.badge ?? 'Hands-on'}</Badge>
            </div>

            <PracticeChoices
              prompt={question.prompt}
              options={question.options}
              selectedIndex={selectedIndex}
              onSelect={onSelectChoice}
              feedback={validation?.choiceFeedback ?? null}
            />

            <PracticeStatus
              selectedIndex={selectedIndex}
              options={question.options}
              completedCount={completedCount}
              totalSteps={totalSteps}
              validation={validation}
            />

            <div className="hol-sim-step-row">
              <div>
                <p className="hol-section-label">Task checklist</p>
                <p className="hol-task-note">{meta.stepTitle}</p>
              </div>
            </div>
            <StepList items={meta.stepItems(item)} completedMap={completedMap} onToggle={onToggleStep} />
          </AppCard>
        </div>

        <div className="hol-sim-side">
          <MentorPanel
            ticket={ticket}
            item={item}
            meta={meta}
            challenge={question}
            state={state ?? {}}
            validation={validation}
          />

          <ValidationResults
            validation={validation}
            successItems={breakdown.success}
            failureItems={breakdown.failures}
            missingItems={breakdown.missing}
          />

          <AppCard className="hol-sim-solution-card">
            <div className="hol-validation-results-top">
              <div>
                <p className="hol-section-label">Solution</p>
                <h3>{solutionUnlocked ? 'Unlocked' : 'Locked until validation'}</h3>
              </div>
              <Badge variant={solutionUnlocked ? 'success' : 'muted'} size="sm">
                {solutionUnlocked ? 'Ready' : 'Locked'}
              </Badge>
            </div>
            {solutionUnlocked ? (
              <BulletList items={meta.solution(item)} />
            ) : (
              <p className="hol-task-note">Complete the decision and the checklist, then check your work to reveal the recommended approach.</p>
            )}
          </AppCard>
        </div>
      </div>

      <div className="hol-sim-post-completion">
        <PostCompletionPanels item={item} meta={meta} solutionUnlocked={solutionUnlocked} />
      </div>

      <div className="hol-task-workspace-footer hol-sim-footer">
        <p>{solutionUnlocked ? 'You have a production-ready workflow and the story to explain it.' : 'Work through the decision, checklist, and validation to unlock the next interview-ready sections.'}</p>
        <button
          type="button"
          className="btn-secondary"
          onClick={onCheckWork}
        >
          Check my work
        </button>
      </div>
    </div>
  );
}

function getPracticeChallenge(categoryId, item) {
  if (!item) {
    return {
      prompt: 'Choose the best next step.',
      options: [{ label: 'Review the task', correct: true, tag: 'Start here' }],
    };
  }

  if (categoryId === 'build') {
    switch (item.id) {
      case 'adf-api-ingestion':
        return {
          prompt: 'What should you do to keep the ADF ingestion restart-safe?',
          options: [
            { label: 'Advance the watermark before the copy runs.', tag: 'Risky', correct: false },
            { label: 'Store the watermark only after a successful Bronze load.', tag: 'Best', correct: true },
            { label: 'Reload the full source on every schedule.', tag: 'Expensive', correct: false },
          ],
        };
      case 'medallion-transform':
        return {
          prompt: 'Where should dedupe and type cleanup happen in medallion flow?',
          options: [
            { label: 'Bronze, before storing raw files.', tag: 'Too early', correct: false },
            { label: 'Silver, after raw landing and before Gold publishing.', tag: 'Best', correct: true },
            { label: 'Gold only, after dashboards break.', tag: 'Too late', correct: false },
          ],
        };
      case 'cdc-merge':
        return {
          prompt: 'How should a delete event be handled in CDC MERGE logic?',
          options: [
            { label: 'Drop the row so history disappears.', tag: 'Wrong', correct: false },
            { label: 'Expire the current row and keep historical trace.', tag: 'Best', correct: true },
            { label: 'Insert the delete as a duplicate row.', tag: 'Wrong', correct: false },
          ],
        };
      case 'synapse-design':
        return {
          prompt: 'Which design choice should you test first for Synapse performance?',
          options: [
            { label: 'Round-robin all tables and hope for the best.', tag: 'Weak', correct: false },
            { label: 'Align distribution with the most common fact-to-dimension join key.', tag: 'Best', correct: true },
            { label: 'Leave every table without partitioning.', tag: 'Weak', correct: false },
          ],
        };
      case 'spark-performance':
        return {
          prompt: 'What should you inspect before increasing cluster size?',
          options: [
            { label: 'Spark UI and physical plan for skew and spill.', tag: 'Best', correct: true },
            { label: 'Only the job title in the notebook.', tag: 'Weak', correct: false },
            { label: 'Add more retries to mask the slowdown.', tag: 'Weak', correct: false },
          ],
        };
      case 'cicd-deploy':
        return {
          prompt: 'What keeps environment values out of deployment code?',
          options: [
            { label: 'Hardcode dev/test/prod values in the notebook.', tag: 'Wrong', correct: false },
            { label: 'Parameterize artifacts and reference secrets from Key Vault.', tag: 'Best', correct: true },
            { label: 'Copy the same config file into every environment.', tag: 'Weak', correct: false },
          ],
        };
      default:
        return {
          prompt: 'What is the safest next step in this build task?',
          options: [
            { label: 'Inspect source, build the pipeline, then validate counts.', tag: 'Best', correct: true },
            { label: 'Skip landing and publish directly to Gold.', tag: 'Weak', correct: false },
            { label: 'Only review the docs and do not implement anything.', tag: 'Weak', correct: false },
          ],
        };
    }
  }

  if (categoryId === 'debug') {
    switch (item.id) {
      case 'failed-adf-trigger':
        return {
          prompt: 'What should you check first when an ADF trigger stops firing?',
          options: [
            { label: 'Linked service authentication and trigger state.', tag: 'Best', correct: true },
            { label: 'Rename the pipeline and retry later.', tag: 'Weak', correct: false },
            { label: 'Increase the number of Bronze files.', tag: 'Weak', correct: false },
          ],
        };
      case 'schema-mismatch':
        return {
          prompt: 'What is the right response to a source schema change?',
          options: [
            { label: 'Compare schema snapshots and version the contract.', tag: 'Best', correct: true },
            { label: 'Ignore the change because the job ran once.', tag: 'Weak', correct: false },
            { label: 'Drop the new column without validation.', tag: 'Weak', correct: false },
          ],
        };
      case 'duplicate-cdc':
        return {
          prompt: 'What most likely caused the duplicate CDC rows?',
          options: [
            { label: 'The watermark advanced before the merge commit succeeded.', tag: 'Best', correct: true },
            { label: 'The fact table was too small.', tag: 'Weak', correct: false },
            { label: 'A dashboard filter changed colors.', tag: 'Weak', correct: false },
          ],
        };
      case 'null-explosion':
        return {
          prompt: 'What usually causes a null explosion after a join?',
          options: [
            { label: 'Join grain is wrong or the key is not unique.', tag: 'Best', correct: true },
            { label: 'The Bronze layer is compressed.', tag: 'Weak', correct: false },
            { label: 'The trigger runs at night.', tag: 'Weak', correct: false },
          ],
        };
      case 'slow-shuffle':
        return {
          prompt: 'What is the best first fix for a slow Spark shuffle?',
          options: [
            { label: 'Inspect skew and use repartition, salting, or broadcast.', tag: 'Best', correct: true },
            { label: 'Double the cluster size before looking at the plan.', tag: 'Weak', correct: false },
            { label: 'Delete checkpoints and rerun blindly.', tag: 'Weak', correct: false },
          ],
        };
      case 'synapse-distribution':
        return {
          prompt: 'What is the most likely cause of the Synapse slowdown?',
          options: [
            { label: 'The distribution key does not match the join pattern.', tag: 'Best', correct: true },
            { label: 'The report title is too long.', tag: 'Weak', correct: false },
            { label: 'There are too many tabs open in the browser.', tag: 'Weak', correct: false },
          ],
        };
      case 'powerbi-refresh':
        return {
          prompt: 'What should you compare first when Power BI refresh breaks?',
          options: [
            { label: 'Warehouse schema and the semantic model contract.', tag: 'Best', correct: true },
            { label: 'The dashboard theme color.', tag: 'Weak', correct: false },
            { label: 'The source API rate limit only.', tag: 'Weak', correct: false },
          ],
        };
      default:
        return {
          prompt: 'What is the right first move in a production issue?',
          options: [
            { label: 'Read the logs, isolate the failure, then test the fix safely.', tag: 'Best', correct: true },
            { label: 'Restart everything without checking the error.', tag: 'Weak', correct: false },
            { label: 'Tell stakeholders it is probably fine.', tag: 'Weak', correct: false },
          ],
        };
    }
  }

  return {
    prompt: 'Which release step matters most before production?',
    options: [
      { label: 'Smoke test, approvals, and rollback readiness.', tag: 'Best', correct: true },
      { label: 'Skip validation if the pipeline compiled.', tag: 'Weak', correct: false },
      { label: 'Hardcode secrets to move faster.', tag: 'Weak', correct: false },
    ],
  };
}

function buildValidationFeedback(categoryId, item, challenge, selectedIndex, allStepsDone) {
  const selected = challenge.options[selectedIndex];
  const choiceCorrect = !!selected?.correct;
  const score = (choiceCorrect ? 50 : 0) + (allStepsDone ? 50 : 0);

  if (score === 100) {
    return {
      score,
      variant: 'success',
      title: 'Great work',
      message: categoryId === 'debug'
        ? 'You isolated the failure, proved the fix, and kept the replay safe.'
        : categoryId === 'checklist'
          ? 'Your release checklist covers safety, validation, and rollback.'
          : 'Your answer and checklist both match the production approach.',
      choiceFeedback: {
        variant: 'success',
        title: 'Correct answer',
        message: selected.feedback || 'That is the right production approach.',
      },
    };
  }

  if (choiceCorrect || allStepsDone) {
    return {
      score,
      variant: 'warning',
      title: 'Almost there',
      message: choiceCorrect
        ? 'Your answer is right. Finish the checklist to unlock the full solution.'
        : 'Your checklist is complete. Pick the answer that matches the production pattern.',
      choiceFeedback: {
        variant: choiceCorrect ? 'success' : 'warning',
        title: choiceCorrect ? 'Correct answer' : 'Try again',
        message: selected?.feedback || 'You are close; review the other choices and pick the safest production step.',
      },
    };
  }

  return {
    score,
    variant: 'neutral',
    title: 'Keep going',
    message: 'Select the best answer and complete the checklist to unlock the solution.',
    choiceFeedback: selected
      ? {
          variant: selected.correct ? 'success' : 'warning',
          title: selected.correct ? 'Good choice' : 'Not quite',
          message: selected.feedback || 'Keep going and try the safest production option.',
        }
      : null,
  };
}

function LabCard({ categoryId, item, active, onClick }) {
  const meta = LAB_META[categoryId] ?? LAB_META.build;
  const tools = meta.tools(item);
  const summary = meta.cardSummary?.(item) ?? shortSentence(meta.mission(item), 74);
  const title = item.title;

  return (
    <AppCard
      as="button"
      type="button"
      interactive
      compact
      className={`hol-lab-card${active ? ' hol-lab-card--active' : ''}`}
      onClick={onClick}
      aria-pressed={active}
    >
      <div className="hol-lab-card-top">
        <div className="hol-lab-card-copy">
          <p className="hol-lab-card-kicker">{categoryId === 'build' ? 'Build' : categoryId === 'debug' ? 'Debug' : 'Production'}</p>
          <strong>{title}</strong>
          <p>{summary}</p>
        </div>
        <Badge variant={categoryId === 'debug' ? 'warning' : 'info'} size="sm">
          {meta.difficulty}
        </Badge>
      </div>

      <div className="hol-lab-card-meta-row">
        <span>⏱ {meta.eta}</span>
        <span>{item.badge ?? 'Hands-on lab'}</span>
      </div>

      <div className="hol-lab-card-chip-row" aria-hidden="true">
        {tools.map(tool => (
          <span key={tool} className="hol-lab-card-chip">{tool}</span>
        ))}
      </div>

      <div className="hol-lab-card-cta-row">
        <span>{meta.cta} →</span>
      </div>
    </AppCard>
  );
}

const HandsOnLabsPanel = memo(function HandsOnLabsPanel({
  previewOnly = false,
  onOpenFullWorkspace,
}) {
  const [activeCategory, setActiveCategory] = useState('build');
  const items = LAB_SETS[activeCategory] ?? buildLabs;
  const [activeId, setActiveId] = useState(items[0]?.id ?? '');
  const [practiceState, setPracticeState] = useState({});

  useEffect(() => {
    const firstItem = LAB_SETS[activeCategory]?.[0]?.id ?? '';
    setActiveId(prev => (LAB_SETS[activeCategory]?.some(item => item.id === prev) ? prev : firstItem));
  }, [activeCategory]);

  const activeItem = useMemo(
    () => items.find(item => item.id === activeId) ?? items[0] ?? null,
    [items, activeId]
  );
  const activeMeta = LAB_CATEGORIES.find(cat => cat.id === activeCategory);
  const useAdfSimulator = activeCategory === 'build' && activeItem?.id === 'adf-api-ingestion';
  const challenge = useMemo(() => getPracticeChallenge(activeCategory, activeItem), [activeCategory, activeItem]);
  const activePractice = practiceState[activeItem?.id ?? ''] ?? { choiceIndex: null, steps: {}, validation: null, solutionUnlocked: false };

  const updatePractice = (itemId, updater) => {
    setPracticeState(prev => {
      const current = prev[itemId] ?? { choiceIndex: null, steps: {}, validation: null, solutionUnlocked: false };
      const next = typeof updater === 'function' ? updater(current) : updater;
      return {
        ...prev,
        [itemId]: { ...current, ...next },
      };
    });
  };

  const handleSelectChoice = index => {
    if (!activeItem) return;
    updatePractice(activeItem.id, current => ({
      ...current,
      choiceIndex: index,
      validation: null,
    }));
  };

  const handleToggleStep = index => {
    if (!activeItem) return;
    updatePractice(activeItem.id, current => ({
      ...current,
      steps: {
        ...current.steps,
        [index]: !current.steps?.[index],
      },
      validation: null,
    }));
  };

  const handleCheckWork = () => {
    if (!activeItem) return;
    const stepItems = LAB_META[activeCategory]?.stepItems(activeItem) ?? [];
    const completedMap = activePractice.steps ?? {};
    const allStepsDone = stepItems.length > 0 && stepItems.every((_, idx) => !!completedMap[idx]);
    const validation = buildValidationFeedback(activeCategory, activeItem, challenge, activePractice.choiceIndex, allStepsDone);
    updatePractice(activeItem.id, {
      validation,
      solutionUnlocked: validation.score === 100,
    });
  };

  if (previewOnly) {
    return (
      <section className="hands-on-labs-section section" id="hands-on-labs">
        <AppCard className="hol-preview-compact">
          <div className="hol-preview-compact-top">
            <div>
              <p className="eyebrow" style={{ marginBottom: 6 }}>Practice simulator</p>
              <h3>Hands-On Labs & Real Tasks</h3>
              <p className="hol-preview-compact-copy">
                Launch short labs for ADF, CDC, Spark, Synapse, and CI/CD practice.
              </p>
            </div>
            <Badge variant="info">Inline preview</Badge>
          </div>

          <div className="hol-preview-launch-grid" role="list" aria-label="Lab launchers">
            {LAB_CATEGORIES.map(category => {
              const meta = LAB_META[category.id] ?? LAB_META.build;
              const firstItem = LAB_SETS[category.id]?.[0];
              return (
                <AppCard
                  key={category.id}
                  as="button"
                  interactive
                  compact
                  className="hol-launcher-card"
                  style={{ '--launch-color': category.id === 'build' ? '#2c6cf7' : category.id === 'debug' ? '#19b7d7' : '#6b7cdb' }}
                  onClick={() => {
                    setActiveCategory(category.id);
                    setActiveId(firstItem?.id ?? '');
                    onOpenFullWorkspace?.();
                  }}
                >
                  <div className="hol-launcher-top">
                    <div className="hol-launcher-icon" aria-hidden="true">{meta.icon}</div>
                    <Badge variant={category.id === 'debug' ? 'warning' : 'info'} size="sm">{meta.difficulty}</Badge>
                  </div>
                  <div className="hol-launcher-copy">
                    <Badge variant="info" size="sm">{category.label}</Badge>
                    <strong>{meta.cardSummary?.(firstItem ?? items[0] ?? {}) ?? shortSentence(meta.mission(firstItem ?? items[0] ?? {}), 74)}</strong>
                    <p>{category.description}</p>
                  </div>
                  <div className="hol-launcher-chip-row" aria-hidden="true">
                    {(meta.tools(firstItem ?? items[0] ?? {}) || []).slice(0, 3).map(tag => (
                      <span key={tag} className="hol-launcher-chip">{tag}</span>
                    ))}
                  </div>
                  <div className="hol-launcher-meta">
                    <span className="hol-launcher-eta">⏱ {meta.eta}</span>
                  </div>
                  <span className="hol-launcher-cta">{meta.cta} →</span>
                </AppCard>
              );
            })}
          </div>

          <div className="hol-preview-footer-row">
            <button type="button" className="btn-secondary" onClick={onOpenFullWorkspace}>
              Open Full Lab Workspace →
            </button>
          </div>
        </AppCard>
      </section>
    );
  }

  if (!activeItem) {
    return null;
  }

  return (
    <section className="hands-on-labs-section section" id="hands-on-labs">
      <div className="hol-workspace-shell">
        <div className="hol-workspace-header">
          <div className="hol-workspace-heading">
            <p className="eyebrow">Practice simulator</p>
            <h2>Hands-On Labs</h2>
            <p>Practice real Azure Data Engineering tasks.</p>
          </div>
          <div className="hol-workspace-stats">
            <StatPill label="Build" value={buildLabs.length} icon="▣" variant="info" />
            <StatPill label="Debug" value={debuggingDrills.length} icon="⚠" variant="warning" />
            <StatPill label="Production" value={productionChecklists.length} icon="✓" variant="info" />
          </div>
        </div>

        <div className="hol-tabs" role="tablist" aria-label="Hands-on lab categories">
          {LAB_CATEGORIES.map(category => {
            const active = category.id === activeCategory;
            return (
              <button
                key={category.id}
                type="button"
                className={`hol-tab${active ? ' hol-tab--active' : ''}`}
                onClick={() => setActiveCategory(category.id)}
                aria-pressed={active}
              >
                <span>{category.label}</span>
                <Badge variant={category.variant}>{category.count}</Badge>
              </button>
            );
          })}
        </div>

        <div className="hol-workspace-intro">
          <p>{activeMeta?.description}</p>
          <span>{countLabel(activeCategory)}</span>
        </div>

        <div className="hol-lab-grid">
          {items.map(item => {
            const active = item.id === activeItem?.id;
            return (
              <LabCard
                key={item.id}
                categoryId={activeCategory}
                item={item}
                active={active}
                onClick={() => setActiveId(item.id)}
              />
            );
          })}
        </div>

        {useAdfSimulator ? (
          <AdfPipelineSimulator item={activeItem} onResetRequest={() => setPracticeState({})} />
        ) : (
          <AppCard className="hol-task-workspace">
            <div className="hol-task-workspace-header">
              <div>
                <p className="eyebrow" style={{ marginBottom: 6 }}>
                  {activeCategory === 'build' ? 'Build task' : activeCategory === 'debug' ? 'Debugging drill' : 'Production checklist'}
                </p>
                <h3>{activeItem?.title}</h3>
              </div>
              <Badge variant={activeCategory === 'debug' ? 'warning' : 'info'}>
                {activeItem?.badge ?? 'Hands-on'}
              </Badge>
            </div>

            <PracticeWorkspace
              categoryId={activeCategory}
              item={activeItem}
              meta={LAB_META[activeCategory]}
              state={activePractice}
              onSelectChoice={handleSelectChoice}
              onToggleStep={handleToggleStep}
              onCheckWork={handleCheckWork}
            />

            <div className="hol-task-workspace-footer">
              <p>{LAB_META[activeCategory]?.completionCopy}</p>
              <button
                type="button"
                className="btn-secondary"
                onClick={() => setActiveId(items[0]?.id ?? activeItem?.id ?? '')}
              >
                Reset Task
              </button>
            </div>
          </AppCard>
        )}
      </div>
    </section>
  );
});

export default HandsOnLabsPanel;
