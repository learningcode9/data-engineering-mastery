export const checklist = [
  { id: 'sql-review',    task: 'Study a topic section',       done: true  },
  { id: 'practice-task', task: 'Complete a practice exercise', done: false },
  { id: 'notes',         task: 'Capture a key takeaway',       done: false },
];

export const quickLinks = [
  'SQL practice set',
  'Spark lab notes',
  'Cloud glossary',
  'Interview prompts',
];

// Core navigation pages — rendered as distinct views, not scroll targets
export const coreNavItems = [
  { id: 'dashboard',      label: 'Dashboard',           icon: '⌂' },
  { id: 'topics',         label: 'Learning Path',       icon: '▦' },
  { id: 'sql-lab',        label: 'SQL Lab',             icon: '▤' },
  { id: 'projects',       label: 'Projects',            icon: '▣' },
  { id: 'workplace',      label: 'Workplace',           icon: '🖥' },
  { id: 'interview-prep', label: 'Interview Prep',      icon: '◌' },
  { id: 'roadmap',        label: 'Roadmaps',            icon: '◇' },
  { id: 'ai-learning',    label: 'AI Coach',            icon: '✦' },
];

// Engineering-mode labs — shown under collapsible Labs section
export const labsNavItems = [
  { id: 'hands-on-labs', label: 'Hands-On Labs', icon: '◬' },
  { id: 'architecture', label: 'Architecture', icon: '◫' },
  { id: 'skill-graph',  label: 'Skill Graph',  icon: '◉' },
  { id: 'incidents',    label: 'Incidents',    icon: '⊗' },
  { id: 'enterprise',   label: 'Enterprise',   icon: '◈' },
  { id: 'war-room',     label: 'War Room',     icon: '⊘' },
  { id: 'standup',      label: 'Standup',      icon: '◷' },
  { id: 'databricks',   label: 'Databricks',   icon: '⚡' },
  { id: 'analytics',    label: 'Analytics',    icon: '▧' },
];

export const navItems = [...coreNavItems, ...labsNavItems];

export const summaryCards = [
  { variant: 'teal',  icon: '▦', label: 'Topics',      value: '7',  sub: '2 in progress'    },
  { variant: 'green', icon: '▣', label: 'Projects',    value: '7',  sub: 'Portfolio-ready'  },
  { variant: 'blue',  icon: '◌', label: 'Interview',   value: '4',  sub: 'Question banks'   },
  { variant: 'amber', icon: '✦', label: 'AI Sessions', value: '12', sub: 'Coaching prompts' },
];
