// AICopilotPanel — Phase 7 floating AI assistant.
// Context-aware: adjusts suggested prompts based on activeSection.
// Built on useAICopilot hook with localStorage persistence.

import { useState, useRef, useEffect, type FormEvent } from 'react'
import { useAICopilot } from '../../hooks/useAICopilot'
import { sectionToContext } from '../../services/ai/promptTemplates'
import type { CopilotContextType } from '../../services/ai/aiCopilotService'

const CONTEXT_LABELS: Record<CopilotContextType, string> = {
  sql:          'SQL',
  pyspark:      'PySpark',
  incident:     'Incidents',
  interview:    'Interview Prep',
  architecture: 'Architecture',
  roadmap:      'Roadmap',
  general:      'General',
}

interface Props {
  activeSection: string
  engineeringMode?: boolean
}

export function AICopilotPanel({ activeSection, engineeringMode }: Props) {
  const contextType   = sectionToContext(activeSection)
  const { messages, sendMessage, isThinking, clearHistory, suggestedPrompts } = useAICopilot(contextType)

  const [open,  setOpen]  = useState(false)
  const [input, setInput] = useState('')
  const logRef            = useRef<HTMLDivElement>(null)

  // Scroll to bottom when messages or thinking state changes
  useEffect(() => {
    if (open && logRef.current) {
      logRef.current.scrollTop = logRef.current.scrollHeight
    }
  }, [messages, isThinking, open])

  function handleSubmit(e: FormEvent) {
    e.preventDefault()
    const text = input.trim()
    if (!text || isThinking) return
    setInput('')
    sendMessage(text, contextType)
  }

  function handleChip(prompt: string) {
    sendMessage(prompt, contextType)
  }

  const sectionLabel = CONTEXT_LABELS[contextType]

  return (
    <>
      {/* Floating action button */}
      <button
        type="button"
        className={`coach-fab${open ? ' coach-fab--open' : ''}`}
        onClick={() => setOpen(o => !o)}
        aria-label={open ? 'Close AI Copilot' : 'Open AI Copilot'}
        title="AI Copilot"
      >
        <span className="coach-fab-icon" aria-hidden="true">
          {open ? '✕' : '◈'}
        </span>
      </button>

      {/* Panel */}
      {open && (
        <div className="coach-panel" role="complementary" aria-label="AI Copilot panel">

          {/* Header */}
          <div className="coach-panel-header">
            <div className="coach-panel-title">
              <span className="coach-panel-icon" aria-hidden="true">◈</span>
              <div>
                <strong>AI Copilot</strong>
                <span className="coach-panel-context">↳ {sectionLabel}</span>
              </div>
            </div>
            <div className="copilot-header-actions">
              {engineeringMode && (
                <span className="coach-eng-badge">Eng Mode</span>
              )}
              <button
                type="button"
                className="copilot-clear-btn"
                onClick={clearHistory}
                title="Clear chat history"
                aria-label="Clear chat history"
              >
                ↺
              </button>
            </div>
          </div>

          {/* Suggested prompt chips */}
          <div className="copilot-chips" role="list" aria-label="Suggested prompts">
            {suggestedPrompts.map(p => (
              <button
                key={p.id}
                type="button"
                className="copilot-chip"
                role="listitem"
                onClick={() => handleChip(p.prompt)}
                disabled={isThinking}
              >
                {p.label}
              </button>
            ))}
          </div>

          {/* Chat log */}
          <div className="coach-chat">
            <div
              className="coach-chat-log"
              ref={logRef}
              aria-live="polite"
              aria-label="Chat messages"
            >
              {messages.map(m => (
                <div key={m.id} className={`coach-msg coach-msg--${m.role}`}>
                  <span>{m.role === 'assistant' ? 'Copilot' : 'You'}</span>
                  <p>{m.content}</p>
                </div>
              ))}

              {isThinking && (
                <div className="coach-msg coach-msg--assistant">
                  <span>Copilot</span>
                  <p className="copilot-thinking" aria-label="Thinking">
                    <span className="copilot-dot" />
                    <span className="copilot-dot" />
                    <span className="copilot-dot" />
                  </p>
                </div>
              )}
            </div>

            {/* Input form */}
            <form className="coach-chat-form" onSubmit={handleSubmit}>
              <input
                value={input}
                onChange={e => setInput(e.target.value)}
                placeholder="Ask about SQL, Spark, incidents…"
                aria-label="Send a message to AI Copilot"
                disabled={isThinking}
                autoComplete="off"
              />
              <button
                type="submit"
                disabled={!input.trim() || isThinking}
              >
                Send
              </button>
            </form>
          </div>

          {/* Footer */}
          <div className="coach-panel-footer">
            <span className="coach-footer-hint">
              Mock AI responses — no external API calls.
            </span>
          </div>
        </div>
      )}
    </>
  )
}
