// Typed in-memory event bus for incident simulation engine
// Decouples simulation state from UI components

type EventHandler<T = unknown> = (payload: T) => void

interface BusEvent {
  type: string
  payload: unknown
  timestamp: number
}

class SimulationEventBus {
  private handlers = new Map<string, Set<EventHandler>>()
  private history: BusEvent[] = []

  emit<T>(type: string, payload: T): void {
    this.history.push({ type, payload, timestamp: Date.now() })
    const handlers = this.handlers.get(type)
    if (handlers) handlers.forEach(h => h(payload))
    // Also fire wildcard listeners
    const wildcards = this.handlers.get('*')
    if (wildcards) wildcards.forEach(h => h({ type, payload }))
  }

  on<T>(type: string, handler: EventHandler<T>): () => void {
    if (!this.handlers.has(type)) this.handlers.set(type, new Set())
    this.handlers.get(type)!.add(handler as EventHandler)
    return () => this.off(type, handler as EventHandler)
  }

  off(type: string, handler: EventHandler): void {
    this.handlers.get(type)?.delete(handler)
  }

  once<T>(type: string, handler: EventHandler<T>): void {
    const wrapper: EventHandler<T> = (payload) => {
      handler(payload)
      this.off(type, wrapper as EventHandler)
    }
    this.on(type, wrapper)
  }

  getHistory(type?: string): BusEvent[] {
    return type ? this.history.filter(e => e.type === type) : [...this.history]
  }

  clear(): void {
    this.handlers.clear()
    this.history = []
  }
}

// Singleton instance shared across the simulation
export const simulationBus = new SimulationEventBus()

// ─── Event type constants ─────────────────────────────────────────────────────

export const SIM_EVENTS = {
  STARTED:          'simulation:started',
  ACTION_TAKEN:     'simulation:action_taken',
  CLUE_REVEALED:    'simulation:clue_revealed',
  ESCALATED:        'simulation:escalated',
  SLA_WARNING:      'simulation:sla_warning',
  SLA_BREACHED:     'simulation:sla_breached',
  RESOLVED:         'simulation:resolved',
  FAILED:           'simulation:failed',
  XP_AWARDED:       'simulation:xp_awarded',
  TIMER_TICK:       'simulation:timer_tick',
  LOG_ENTRY:        'simulation:log_entry',
} as const

export type SimEventType = typeof SIM_EVENTS[keyof typeof SIM_EVENTS]

// ─── Payload types ────────────────────────────────────────────────────────────

export interface TimerTickPayload { elapsed: number; remaining: number }
export interface LogEntryPayload  { level: 'info' | 'warn' | 'error'; message: string; source?: string }
export interface ActionPayload    { actionId: string; label: string; correct: boolean; points: number }
export interface XPPayload        { amount: number; source: string; total: number }
export interface SLAPayload       { remainingSec: number; severity: string }
