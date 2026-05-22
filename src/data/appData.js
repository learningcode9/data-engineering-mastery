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

export const navItems = [
  { label: 'Dashboard',      icon: '⌂' },
  { label: 'Roadmap',        icon: '◇' },
  { label: 'Topics',         icon: '▦' },
  { label: 'Projects',       icon: '▣' },
  { label: 'Architecture',   icon: '◫' },
  { label: 'Enterprise',     icon: '◈', id: 'enterprise'   },
  { label: 'Skill Graph',    icon: '◉', id: 'skill-graph'  },
  { label: 'Incidents',      icon: '⊗', id: 'incidents'    },
  { label: 'War Room',       icon: '⊘', id: 'war-room'     },
  { label: 'Standup',        icon: '◷', id: 'standup'      },
  { label: 'SQL Lab',        icon: '▤', id: 'sql-lab'   },
  { label: 'Databricks',     icon: '⚡' },
  { label: 'Interview Prep', icon: '◌' },
  { label: 'Analytics',      icon: '▧' },
  { label: 'AI Learning',    icon: '✦' },
];

export const summaryCards = [
  { variant: 'teal',  icon: '▦', label: 'Topics',      value: '7',  sub: '2 in progress'    },
  { variant: 'green', icon: '▣', label: 'Projects',    value: '7',  sub: 'Portfolio-ready'  },
  { variant: 'blue',  icon: '◌', label: 'Interview',   value: '4',  sub: 'Question banks'   },
  { variant: 'amber', icon: '✦', label: 'AI Sessions', value: '12', sub: 'Coaching prompts' },
];
