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

// Core MVP navigation — shown in main sidebar
export const coreNavItems = [
  { label: 'Dashboard',      icon: '⌂' },
  { label: 'Topics',         icon: '▦' },
  { label: 'SQL Lab',        icon: '▤' },
  { label: 'Interview Prep', icon: '◌' },
  { label: 'Projects',       icon: '▣' },
  { label: 'Roadmap',        icon: '◇' },
  { label: 'AI Learning',    icon: '✦' },
];

// Advanced features — shown under a collapsible Labs section
export const labsNavItems = [
  { label: 'Architecture',   icon: '◫' },
  { label: 'Skill Graph',    icon: '◉' },
  { label: 'Incidents',      icon: '⊗' },
  { label: 'Enterprise',     icon: '◈' },
  { label: 'War Room',       icon: '⊘' },
  { label: 'Standup',        icon: '◷' },
  { label: 'Databricks',     icon: '⚡' },
  { label: 'Analytics',      icon: '▧' },
];

export const navItems = [...coreNavItems, ...labsNavItems];

export const summaryCards = [
  { variant: 'teal',  icon: '▦', label: 'Topics',      value: '7',  sub: '2 in progress'    },
  { variant: 'green', icon: '▣', label: 'Projects',    value: '7',  sub: 'Portfolio-ready'  },
  { variant: 'blue',  icon: '◌', label: 'Interview',   value: '4',  sub: 'Question banks'   },
  { variant: 'amber', icon: '✦', label: 'AI Sessions', value: '12', sub: 'Coaching prompts' },
];
