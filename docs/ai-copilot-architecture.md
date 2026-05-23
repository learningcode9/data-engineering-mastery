# AI Copilot Architecture

## Overview

Phase 7 establishes the AI Copilot foundation with a mock-first approach.
No external API calls are made. All responses are generated locally using
keyword-matching rules. The architecture is designed so that swapping in
a real AI provider (Phase 8) requires changing one function.

---

## Mock AI Flow

```
User types message in AICopilotPanel
    │
    ▼
useAICopilot.sendMessage(message, contextType)
    │
    ├─ Add user message to state
    ├─ Set isThinking = true
    │
    ▼
generateMockAIResponse(message, contextType)        ← Phase 7: local keyword matching
    │                                               ← Phase 8: call OpenAI / Anthropic API
    ├─ Scan KEYWORD_RULES[contextType] for matches
    ├─ Cross-context fallback if no match
    ├─ Simulate 700–1200ms delay
    │
    ▼
saveAIMessage(userId, message, response, contextType)
    │
    ├─ Write to localStorage (dem-ai-copilot-history, max 50 messages)
    └─ If Supabase configured: insert into ai_chat_history (best-effort)
    │
    ▼
Add assistant message to state, set isThinking = false
```

---

## Phase 8 OpenAI Integration Plan

Swap `generateMockAIResponse` in `src/services/ai/aiCopilotService.ts`:

```typescript
// Phase 7 — mock
export async function generateMockAIResponse(message, contextType) {
  await delay(700 + Math.random() * 500)
  return matchKeywords(message, contextType)
}

// Phase 8 — real (drop-in replacement)
export async function generateMockAIResponse(message, contextType) {
  const systemPrompt = SYSTEM_PROMPTS[contextType]
  const res = await fetch('/api/ai/chat', {         // Supabase Edge Function
    method: 'POST',
    body: JSON.stringify({ message, contextType, systemPrompt }),
  })
  return res.json().then(d => d.content)
}
```

The Supabase Edge Function proxies to OpenAI so the API key stays server-side.
Enable with `VITE_ENABLE_AI=true` and `VITE_AI_PROVIDER=openai` in `.env.local`.

Existing provider infrastructure in `src/lib/ai/` (openaiProvider.ts, mockProvider.ts)
is already built and tested — Phase 8 connects it to the Copilot panel.

---

## Context Types

| contextType   | Trigger section(s)                        | Prompt focus |
|---|---|---|
| `sql`         | `topics` (default)                        | Query explanation, optimization, window functions |
| `pyspark`     | `databricks`                              | Shuffle, partitioning, Delta Lake |
| `incident`    | `incidents`, `enterprise`                 | RCA, schema drift, SLA debugging |
| `interview`   | `interview-prep`, `war-room`              | STAR answers, technical Q&A |
| `architecture`| `architecture`                            | Medallion, batch vs streaming, cost |
| `roadmap`     | `roadmap`                                 | Learning path, skill gap |
| `general`     | all other sections                        | Career advice, concept explanations |

Context is derived automatically from `activeSection` via `sectionToContext()` in
`src/services/ai/promptTemplates.ts`.

---

## Prompt Template Design

`promptTemplates.ts` provides 4 suggested prompts per context type.
Each template has:
- `id`: stable key for React rendering
- `label`: short chip text (≤ 20 chars)
- `prompt`: pre-filled message sent when chip is clicked

Templates are designed to be open-ended ("Explain this query:") so the user
can append their own content. This pattern mirrors how developers use AI assistants
in real tools (Cursor, GitHub Copilot Chat).

To add templates: edit `TEMPLATES` in `promptTemplates.ts`. No hook or component changes needed.

---

## Chat History Persistence

**localStorage** (always active)
- Key: `dem-ai-copilot-history`
- Stores last 50 `CopilotMessage` objects
- Written after every exchange; cleared via "↺" button in panel header

**Supabase** (when `VITE_ENABLE_BACKEND=true`)
- Table: `ai_chat_history` (columns: user_id, message, response, context_type, created_at)
- Written best-effort after localStorage; errors are silently swallowed
- Phase 8 will add read-back from Supabase on session restore

---

## File Map

| File | Purpose |
|---|---|
| `src/services/ai/aiCopilotService.ts` | Core: mock responses, history API |
| `src/services/ai/promptTemplates.ts` | Suggested chips, section→context mapping |
| `src/hooks/useAICopilot.ts` | React hook: state, sendMessage, clearHistory |
| `src/components/ai/AICopilotPanel.tsx` | Floating panel UI |
| `src/services/supabase/ai.ts` | Supabase AI service (domain helpers + history) |
| `src/lib/ai/aiService.ts` | Provider abstraction (mock/OpenAI) |
| `src/lib/ai/providers/mockProvider.ts` | Mock provider with streaming simulation |
| `src/lib/ai/providers/openaiProvider.ts` | OpenAI Chat Completions (Phase 8 activation) |

---

## UX Decisions

- **Panel position**: fixed bottom-right (same as previous FloatingCoach). Does not cover the main content column on desktop (320px panel, main content has right margin).
- **Mobile**: panel expands to `calc(100vw - 32px)`, positioned above the MobileBottomNav.
- **Thinking animation**: 3-dot bounce (`.copilot-dot`), replaces last message area while response loads.
- **Suggested chips**: 4 per context, compact pill style. Disabled while thinking.
- **Clear button**: `↺` in panel header — clears localStorage and resets to welcome message.
- **No login required**: works entirely in demo mode via localStorage.
