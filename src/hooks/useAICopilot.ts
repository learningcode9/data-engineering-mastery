import { useState, useEffect, useCallback, useMemo } from 'react'
import {
  getAIHistory,
  saveAIMessage,
  clearAIHistory,
  generateMockAIResponse,
  type CopilotMessage,
  type CopilotContextType,
} from '../services/ai/aiCopilotService'
import { getSuggestedPrompts } from '../services/ai/promptTemplates'
import { useUser } from '../providers/UserProvider'

const WELCOME: CopilotMessage = {
  id: 'welcome',
  role: 'assistant',
  content: 'Ask me to explain a concept, debug SQL or PySpark, review an architecture, or summarise an incident. I can also suggest what to study next.',
  contextType: 'general',
  timestamp: new Date().toISOString(),
}

export function useAICopilot(contextType: CopilotContextType = 'general') {
  const { userId } = useUser()
  const [messages,   setMessages]   = useState<CopilotMessage[]>([WELCOME])
  const [isThinking, setIsThinking] = useState(false)

  useEffect(() => {
    getAIHistory(userId ?? 'local-guest').then(history => {
      if (history.length > 0) setMessages([WELCOME, ...history])
    })
  }, [userId])

  const sendMessage = useCallback(async (
    message: string,
    ctx: CopilotContextType = contextType
  ) => {
    const trimmed = message.trim()
    if (!trimmed || isThinking) return

    const userMsg: CopilotMessage = {
      id:          `${Date.now()}-u`,
      role:        'user',
      content:     trimmed,
      contextType: ctx,
      timestamp:   new Date().toISOString(),
    }

    setMessages(prev => [...prev, userMsg])
    setIsThinking(true)

    try {
      const response = await generateMockAIResponse(trimmed, ctx)
      const botMsg: CopilotMessage = {
        id:          `${Date.now()}-a`,
        role:        'assistant',
        content:     response,
        contextType: ctx,
        timestamp:   new Date().toISOString(),
      }
      setMessages(prev => [...prev, botMsg])
      await saveAIMessage(userId ?? 'local-guest', trimmed, response, ctx)
    } catch {
      const errMsg: CopilotMessage = {
        id:          `${Date.now()}-err`,
        role:        'assistant',
        content:     'Sorry, something went wrong. Please try again.',
        contextType: ctx,
        timestamp:   new Date().toISOString(),
      }
      setMessages(prev => [...prev, errMsg])
    } finally {
      setIsThinking(false)
    }
  }, [contextType, isThinking, userId])

  const clearHistory = useCallback(() => {
    clearAIHistory()
    setMessages([WELCOME])
  }, [])

  const suggestedPrompts = useMemo(
    () => getSuggestedPrompts(contextType),
    [contextType]
  )

  return { messages, sendMessage, isThinking, clearHistory, suggestedPrompts }
}
