// Structured logger — console in dev, silent in prod (swap for Sentry/Datadog later)

type LogLevel = 'debug' | 'info' | 'warn' | 'error'

interface LogEntry {
  level: LogLevel
  module: string
  message: string
  data?: unknown
  timestamp: string
}

const isDev = import.meta.env.DEV

const LEVEL_STYLES: Record<LogLevel, string> = {
  debug: 'color: #888',
  info:  'color: #4CAF50',
  warn:  'color: #FF9800',
  error: 'color: #F44336; font-weight: bold',
}

function log(level: LogLevel, module: string, message: string, data?: unknown): void {
  if (!isDev && level === 'debug') return

  const entry: LogEntry = {
    level,
    module,
    message,
    data,
    timestamp: new Date().toISOString(),
  }

  const prefix = `%c[${entry.timestamp.slice(11, 19)}] [${module}]`
  const style  = LEVEL_STYLES[level]

  if (level === 'error') {
    console.error(prefix, style, message, data !== undefined ? data : '')
  } else if (level === 'warn') {
    console.warn(prefix, style, message, data !== undefined ? data : '')
  } else if (isDev) {
    console.log(prefix, style, message, data !== undefined ? data : '')
  }
}

// Factory — create a logger scoped to a module
export function createLogger(module: string) {
  return {
    debug: (msg: string, data?: unknown) => log('debug', module, msg, data),
    info:  (msg: string, data?: unknown) => log('info',  module, msg, data),
    warn:  (msg: string, data?: unknown) => log('warn',  module, msg, data),
    error: (msg: string, data?: unknown) => log('error', module, msg, data),
  }
}

// Default app-level logger
export const logger = createLogger('App')
