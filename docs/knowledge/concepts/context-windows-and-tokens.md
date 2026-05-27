# Context Windows & Tokens (Mental Model)

## TL;DR

A **context window** is the LLM's working memory. Everything you cram in — system prompt, tool definitions, conversation history, retrieved RAG chunks, the user's message, **and** the space reserved for the response — has to fit. **Tokens** are how that memory gets counted, not characters or words. Get this right and most of your "weird LLM behavior" stops being weird.

## What's a token?

A token is the unit the model actually reads. Not a character, not a word — somewhere in between.

| Content | Rough token cost |
|---------|------------------|
| English prose | ~4 chars ≈ 1 token |
| Code | ~3 chars ≈ 1 token (more punctuation) |
| 1000 words of English | ~1300–1500 tokens |
| 1000 lines of TypeScript | ~6000–9000 tokens |

Tokens are also **model-specific** — Claude's tokenizer is not GPT's. If you're estimating costs, use the right one.

```typescript
// "Hello, world!" tokenizes to roughly 4 tokens:
// ["Hello", ",", " world", "!"]
//
// "console.log('Hello, world!');" tokenizes to ~10 tokens
// — punctuation and underscores split things up
```

## What's a context window?

Think of it as a single sliding window of tokens that contains **everything** the model considers for the next response:

```
┌──────────────────────────────────────────────┐
│   CONTEXT WINDOW (e.g. 200,000 tokens)       │
├──────────────────────────────────────────────┤
│  System prompt              (~800 tokens)    │
│  Tool definitions           (~600 tokens)    │
│  Few-shot examples          (~1,500 tokens)  │
│  Conversation history       (~3,200 tokens)  │
│  Retrieved RAG chunks       (~2,000 tokens)  │
│  User message               (~150 tokens)    │
│  ▼ Reserved for response    (~4,000 tokens)  │
│  ▲                                           │
│  …unused budget…                             │
└──────────────────────────────────────────────┘
```

### What's available in 2026

| Model | Context window | Max output | Notes |
|-------|---------------|------------|-------|
| GPT-4o | 128k | 16k | Common default for OpenAI |
| Claude Sonnet 4.6 | 200k | 32k | Long-form default |
| Claude Opus 4.7 (1M) | **1,000,000** | 32k | Whole-codebase reads |
| Gemini 2.0 Pro | 1,000,000 | 8k | Multimodal advantage |

## The input/output asymmetry (often missed)

- **Input tokens are cheap** (relatively)
- **Output tokens cost ~5× more**
- **Reasoning tokens** (Sonnet thinking, OpenAI o1) are also priced at output rates
- **Max output is a separate cap** — even with a 1M context, Claude tops out at ~32k output per response

Implications: if you're generating long code, looping an agent, or batch-translating, you'll burn money on the output side fast — even if your inputs feel modest.

## What actually counts against your window

Things people forget:

1. **System prompt** — agent system prompts can be 5k–15k tokens
2. **Tool definitions** — each tool spec adds 100–300 tokens; an agent with 10 tools = 1k–3k of permanent overhead
3. **Few-shot examples** in the prompt
4. **Conversation history** — it grows every turn
5. **Retrieved context** — RAG chunks aren't free
6. **The user's current message**
7. **Reserved output space** — you tell the API `max_tokens` upfront; that space is *unavailable* for input

```typescript
// What you THINK you're sending
const message = "Summarize this PDF: ..."

// What's ACTUALLY in the window
// - System:         800
// - Tools (3×200):  600
// - Conversation:  3200
// - RAG chunks:    2000
// - User message:  1500
// - max_tokens:    4000  ← reserved, not usable for input
// Total committed: 12,100 of 200,000
```

## 💡 Prompt caching (the cost killer)

Anthropic and OpenAI both support it now. **You can cache long, stable prefixes** — system prompts, tool definitions, RAG context — and pay roughly 1/10th the input cost on cache hits.

- TTL on Anthropic: **5 minutes**, refreshed on each hit
- Cost savings for chat apps: **50–90% off input tokens**
- One-line change in most SDKs

```typescript
const response = await anthropic.messages.create({
  model: "claude-opus-4-7",
  system: [
    {
      type: "text",
      text: longSystemPrompt,
      cache_control: { type: "ephemeral" }   // ← cache this prefix
    }
  ],
  messages: [...]
});
```

If you're not using prompt caching on a chat product in 2026, you're leaving the majority of your input bill on the table.

## Long context vs RAG

A common false dichotomy. The real decision:

| Data size & nature | Reach for |
|--------------------|-----------|
| ≤100k tokens of stable data | Just put it in the context, with caching |
| 100k–1M tokens, stable | Cached long context often beats RAG infra |
| >1M tokens, or frequently changing | RAG |
| Mixed | Hybrid: RAG retrieves, long context holds the chunks |

See [When to use RAG](../patterns/when-rag-when-not.md) for the deeper version of this decision.

## Mental model: budget like RAM, not disk

Treat context like RAM. Every token you put in has to be loaded, attended to, and considered. Bigger ≠ better — at high token counts, **attention dilution** is real. The model can technically see your 500k-token codebase but it's not going to attend to all of it equally. Use long context for "needle in haystack" lookups; don't use it for "synthesize everything I gave you."

## ⚠️ Common pitfalls

1. **"Why is my agent suddenly slow/expensive?"** → context bloat from accumulated history. Cap your conversation window.
2. **"Why does my answer get cut off?"** → `max_tokens` too low, or you hit the model's output cap.
3. **"Why does it forget the system prompt halfway through?"** → it doesn't; you're reading drift, not amnesia. The whole window is always re-attended.
4. **"Why is Claude rejecting my 200k input?"** → because `max_tokens + input > window`. Reserve output space.
5. **"Why is RAG slower than just sending the whole doc?"** → if the doc is small (≤50k tokens), it probably is. RAG only wins at scale.

## ✅ Practical checklist

- [ ] You know your model's **input and output** limits separately
- [ ] You estimate system prompt + tool budget **once**, not per request
- [ ] You **cap conversation history** (sliding window or summarization)
- [ ] You **measure** actual token usage (`response.usage`), not assumed
- [ ] You **cache stable prefixes** with prompt caching
- [ ] You **reserve adequate** `max_tokens` for the answer

## Related

- [When to use RAG (and when not to)](../patterns/when-rag-when-not.md) — when retrieval beats long context
- *(coming) Evals & Observability — measuring what's actually happening*
- *(coming) Claude vs OpenAI vs Gemini — model-by-model comparison*
