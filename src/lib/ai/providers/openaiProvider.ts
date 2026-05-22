import type { AIProvider, AIRequest, AIResponse, AIStreamChunk } from '../aiTypes'
import { SYSTEM_PROMPTS } from '../aiTypes'

// OpenAI provider — swap API key in .env.local
// Calls the OpenAI Chat Completions API directly from the browser
// For production, route through a Supabase Edge Function to keep the key server-side

const OPENAI_API_URL = 'https://api.openai.com/v1/chat/completions'

function getApiKey(): string {
  const key = import.meta.env.VITE_OPENAI_API_KEY
  if (!key) throw new Error('VITE_OPENAI_API_KEY is not set. Add it to .env.local')
  return key
}

function buildMessages(request: AIRequest) {
  const systemPrompt = SYSTEM_PROMPTS[request.context.type] ?? SYSTEM_PROMPTS.general
  return [
    { role: 'system', content: systemPrompt },
    ...request.messages.map(m => ({ role: m.role, content: m.content })),
  ]
}

export const openaiProvider: AIProvider = {
  name: 'openai',

  async complete(request: AIRequest): Promise<AIResponse> {
    const res = await fetch(OPENAI_API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${getApiKey()}`,
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        messages: buildMessages(request),
        max_tokens: request.maxTokens ?? 1024,
        temperature: 0.7,
      }),
    })

    if (!res.ok) {
      const err = await res.json().catch(() => ({}))
      throw new Error(`OpenAI error ${res.status}: ${err?.error?.message ?? res.statusText}`)
    }

    const data = await res.json()
    const choice = data.choices[0]
    return {
      content: choice.message.content,
      model: data.model,
      tokensUsed: data.usage?.total_tokens ?? 0,
      finishReason: choice.finish_reason,
    }
  },

  async *stream(request: AIRequest): AsyncIterable<AIStreamChunk> {
    const res = await fetch(OPENAI_API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${getApiKey()}`,
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        messages: buildMessages(request),
        max_tokens: request.maxTokens ?? 1024,
        temperature: 0.7,
        stream: true,
      }),
    })

    if (!res.ok) throw new Error(`OpenAI stream error: ${res.status}`)

    const reader = res.body!.getReader()
    const decoder = new TextDecoder()

    while (true) {
      const { done, value } = await reader.read()
      if (done) break

      const lines = decoder.decode(value).split('\n')
      for (const line of lines) {
        if (!line.startsWith('data: ')) continue
        const raw = line.slice(6).trim()
        if (raw === '[DONE]') { yield { delta: '', done: true }; return }

        try {
          const chunk = JSON.parse(raw)
          const delta = chunk.choices?.[0]?.delta?.content ?? ''
          if (delta) yield { delta, done: false }
        } catch {
          // malformed chunk — skip
        }
      }
    }
  },
}
