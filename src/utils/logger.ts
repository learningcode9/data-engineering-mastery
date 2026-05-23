// Structured logger — currently silent until an external sink is configured.

type LogLevel = 'debug' | 'info' | 'warn' | 'error'

interface LogEntry {
  level: LogLevel
  module: string
  message: string
  data?: unknown
  timestamp: string
}

function log(level: LogLevel, module: string, message: string, data?: unknown): void {
  void ({
    level,
    module,
    message,
    data,
    timestamp: new Date().toISOString(),
  } satisfies LogEntry)
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
