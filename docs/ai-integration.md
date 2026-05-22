# AI Integration Plan

## Provider Abstraction

The AI layer uses a provider pattern so the underlying model can be swapped without changing any UI code.

```
src/lib/ai/
├── aiTypes.ts              ← interfaces + system prompts
├── aiService.ts            ← public API (orchestrates provider + DB persistence)
└── providers/
    ├── mockProvider.ts     ← instant mock responses (default, no API key needed)
    └── openaiProvider.ts   ← real OpenAI GPT-4o-mini calls
```

## Switching Providers

| `VITE_AI_PROVIDER` | `VITE_OPENAI_API_KEY` | Behavior |
|---|---|---|
| `mock` or empty | any | Mock responses, instant, no cost |
| `openai` | set | Real OpenAI calls from browser |
| `openai` | not set | Throws error on first AI call |

For production, **never expose `VITE_OPENAI_API_KEY` in a public deployment**. Route calls through a Supabase Edge Function instead:

```typescript
// supabase/functions/ai-complete/index.ts (future)
// Receives { messages, context } from frontend
// Makes OpenAI call server-side with key from Supabase secrets
// Returns { content, model, tokensUsed }
```

## AI Contexts

Each feature area uses a typed context that selects the appropriate system prompt:

| Context | Trigger | System Prompt Focus |
|---|---|---|
| `sql_explain` | SQLLab explain button | Query analysis, performance hints |
| `interview_help` | Interview Q&A coach | Structured answer guidance |
| `incident_rca` | Incident resolution | Root cause analysis format |
| `spark_explain` | PySpark code blocks | Transformations, shuffle, optimization |
| `architecture_review` | Architecture diagrams | Scalability, reliability, cost |
| `topic_summary` | Section summary button | Key takeaways for practitioners |
| `general` | Floating AI coach | General DE assistant |

## Conversation Persistence

Every AI interaction is persisted to Supabase (when backend is enabled):
1. `createThread()` — creates a thread scoped to the user + context
2. `appendMessage('user', ...)` — saves the user's message
3. `provider.complete()` — calls the AI
4. `appendMessage('assistant', ...)` — saves the response with token count + model

This enables:
- Full conversation history across sessions
- Token usage tracking per user
- Fine-tuning data collection
- AI response quality review

## Streaming

Both the mock and OpenAI providers implement the `stream()` interface:

```typescript
for await (const chunk of stream(messages, context)) {
  if (chunk.done) break
  setResponse(prev => prev + chunk.delta)
}
```

The mock provider simulates word-by-word streaming with 30ms delays.

## Adding a New Provider (e.g. Anthropic Claude)

1. Create `src/lib/ai/providers/anthropicProvider.ts` implementing `AIProvider`
2. In `aiService.ts`, update `getProvider()` to check `VITE_AI_PROVIDER === 'anthropic'`
3. Add `VITE_ANTHROPIC_API_KEY` to `.env.example`
