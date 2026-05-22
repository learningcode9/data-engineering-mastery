# AI Copilot Plan

## Architecture

```
User triggers AI action (e.g. "Explain this SQL")
    │
    ▼
src/services/supabase/ai.ts
    │
    ├─ isAIEnabled() = false → return mock response (instant)
    │
    └─ isAIEnabled() = true →
           │
           ├─ env.aiProvider = 'mock'   → MOCK_RESPONSES[context]
           │
           └─ env.aiProvider = 'openai' →
                    │
                    ▼
               POST https://api.openai.com/v1/chat/completions
               with context-appropriate system prompt
                    │
                    ▼
               Stream response back to component
                    │
                    ▼
               saveConversation() → persist to ai_threads + ai_messages
```

## AI Contexts

Each feature area has a dedicated system prompt optimized for that use case:

| Context | Trigger location | Key output |
|---|---|---|
| `sql_explain` | SQL Lab "Explain" button | Query walkthrough + performance hints |
| `interview_help` | Interview War Room "Help me answer" | Structured answer with examples |
| `incident_rca` | Incident Simulator "Generate RCA" | Formal RCA document |
| `spark_explain` | PySpark code blocks | Transformation + shuffle analysis |
| `architecture_review` | Architecture Diagrams | Scalability + cost recommendations |
| `topic_summary` | Topic section header | Practitioner-focused key takeaways |
| `general` | Floating AI Coach | General DE questions |

## Enabling AI

```bash
# .env.local
VITE_ENABLE_AI=true
VITE_AI_PROVIDER=mock          # or "openai"
VITE_OPENAI_API_KEY=sk-...     # only needed when AI_PROVIDER=openai
```

## Streaming response pattern

```jsx
function AIResponse({ question, context }) {
  const [text, setText] = useState('')
  const [loading, setLoading] = useState(false)

  async function ask() {
    setLoading(true)
    setText('')
    for await (const chunk of stream(question, { context })) {
      setText(prev => prev + chunk)
    }
    setLoading(false)
  }

  return (
    <div>
      <button onClick={ask} disabled={loading}>Ask AI</button>
      {text && <p>{text}</p>}
    </div>
  )
}
```

## Conversation persistence

When `VITE_ENABLE_BACKEND=true` and user is authenticated, every AI interaction is saved:
- `ai_threads` — one thread per conversation (scoped to context type)
- `ai_messages` — individual messages with role, content, model, token count

This enables:
- History view ("Previous AI explanations")
- Token usage analytics
- Fine-tuning dataset collection (opt-in)

## Moving to production (edge function)

For public deployment, **never expose `VITE_OPENAI_API_KEY`**. Instead:

1. Create `supabase/functions/ai-complete/index.ts`
2. Store API key in Supabase secrets: `supabase secrets set OPENAI_API_KEY=sk-...`
3. Frontend calls `/functions/v1/ai-complete` instead of OpenAI directly
4. Edge function authenticates the Supabase user before calling OpenAI

This keeps the API key server-side and adds per-user rate limiting.

## Adding a new AI provider (e.g. Anthropic Claude)

1. Add `VITE_ANTHROPIC_API_KEY` to `.env.example`
2. In `src/services/supabase/ai.ts`, add `callAnthropic()` function
3. Update `complete()` to check `env.aiProvider === 'anthropic'`
4. Add system prompts if Claude requires different formatting

The provider abstraction means zero UI changes are needed.
