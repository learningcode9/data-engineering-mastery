export const roadmapCards = [
  { title: 'Foundations', icon: '⌘', percent: '82%', body: 'SQL, Python, Git, Linux, and data modeling.' },
  { title: 'Batch Pipelines', icon: '↦', percent: '55%', body: 'ETL design, orchestration, testing, and quality gates.' },
  { title: 'Cloud Data', icon: '☁', percent: '34%', body: 'Azure, AWS, lakehouse storage, and cost-aware design.' },
  { title: 'Production Skills', icon: '◈', percent: '18%', body: 'Monitoring, CI/CD, incident notes, and stakeholder updates.' },
];

export const checklist = [
  { id: 'sql-review', task: 'Read one topic detail', done: true },
  { id: 'practice-task', task: 'Finish one practice task', done: false },
  { id: 'notes', task: 'Write one learning note', done: false },
];

export const quickLinks = [
  'SQL practice set',
  'Spark lab notes',
  'Cloud glossary',
  'Interview prompts',
];

export const projects = [
  { title: 'Sales lakehouse pipeline', meta: 'Databricks + SQL', icon: '▤' },
  { title: 'API ingestion workflow', meta: 'Python + orchestration', icon: '↧' },
  { title: 'Spark performance lab', meta: 'PySpark tuning', icon: '⚙' },
];

export const navItems = [
  { label: 'Dashboard', icon: '⌂' },
  { label: 'Roadmap', icon: '◇' },
  { label: 'Topics', icon: '▦' },
  { label: 'Projects', icon: '▣' },
  { label: 'Interview Prep', icon: '◌' },
  { label: 'AI Learning', icon: '✦' },
];

export const summaryCards = [
  { variant: 'teal', icon: '▦', label: 'Topics', value: '7', sub: '2 in progress' },
  { variant: 'green', icon: '▣', label: 'Projects', value: '3', sub: 'Portfolio ready' },
  { variant: 'blue', icon: '◌', label: 'Interview', value: '4', sub: 'Practice sets' },
  { variant: 'amber', icon: '✦', label: 'AI Sessions', value: '12', sub: 'This month' },
];
