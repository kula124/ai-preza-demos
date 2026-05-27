# When to Use RAG (and When Not To)

## TL;DR

RAG is the **default** in 2026 AI tutorials. It shouldn't be. About half the systems I've seen built as RAG would have been cheaper, simpler, and more accurate as **long-context-with-caching**, **fine-tuning**, or **just a good prompt**. This is the decision framework I actually use.

If you're new to RAG, read [RAG_EXPLAINED.md](../../RAG_EXPLAINED.md) first. This page is about *choosing* RAG, not building it.

## The 5 questions

Before you write a single line of RAG code, answer these:

| # | Question | If "no" or "low" |
|---|----------|------------------|
| 1 | Is the corpus **>100k tokens**? | Long-context wins — just dump it in with caching |
| 2 | Does the corpus **change often** (daily/hourly)? | Static? Fine-tune or cache instead |
| 3 | Do you need **precise citations** from sources? | If just need general knowledge, prompting wins |
| 4 | Is **retrieval latency** acceptable (200–500ms extra)? | Real-time? Skip the retrieval hop |
| 5 | Is the AI's answer **bounded by the corpus** (not creative)? | Creative tasks? RAG actively hurts |

If you can't answer "yes/high" to most of these, RAG is probably the wrong tool.

## Decision matrix

| Situation | Reach for |
|-----------|-----------|
| Small, stable docs (≤100k tokens) | **Long context + prompt caching** |
| Large, stable docs (100k–1M) | Cached long context, *or* RAG with simple BM25 |
| Large, changing docs | **RAG** (vector + keyword hybrid) |
| Style/format adherence (not knowledge) | **Fine-tune**, don't RAG |
| Multiple unrelated sources | **Agentic search** (let the LLM pick which tool) |
| One-off Q&A on a doc you have | **Just paste it in** |
| Code Q&A over a repo | **Long context + file-by-file**, not RAG |
| Highly structured data (DB rows, JSON) | **SQL/structured queries via tool use**, not RAG |

## Cases where I see RAG abused

### 🚫 RAGging a 30-page PDF

I've seen teams build full pgvector + embeddings + chunking pipelines for documents that fit in 40k tokens. With prompt caching, sending the entire doc costs ~$0.001/query and gets *better* answers because the model sees full context, not retrieved fragments.

### 🚫 RAGging a database

If your "knowledge" is in Postgres tables, you don't need embeddings — you need **tool use**. Give the LLM a `query_database(sql)` tool, write good descriptions, and let it ask. Embedding your `users` table is an anti-pattern.

### 🚫 RAGging for "company chatbot" with 50 FAQs

If your corpus is small and finite, paste the FAQs into the system prompt with caching. RAG retrieval at this size introduces failure modes (wrong chunk, missing context) that just-paste-it doesn't have.

### 🚫 RAGging code

Code Q&A over a repo is one of the trickiest RAG cases — chunking code semantically is hard, embeddings of code are weaker than embeddings of prose, and you usually need *structure* (call graphs, imports) more than *similarity*. For ≤1M tokens of code, throw it at Claude Opus 4.7 (1M) directly. For larger, use AST-aware tools (`ast-grep`, LSP) before reaching for vectors.

## Cases where RAG genuinely shines

### ✅ Large, changing knowledge bases

Confluence wikis, internal docs that update daily, support ticket histories, customer conversation logs — corpora that grow continuously past the long-context limit. RAG is the right answer.

### ✅ Citation requirements

When the answer must point back to a specific source ("according to Section 4.2.1 of the contract"), RAG's retrieval step gives you that anchor naturally. Long-context can do it but is less reliable.

### ✅ Cost-sensitive scale

At high QPS over a large corpus, RAG can be cheaper per query than full long-context, especially if your vector search is well-indexed. Run the math both ways before assuming.

### ✅ Cross-document synthesis

When the answer requires pulling from 3 unrelated docs out of 10,000, vector search is genuinely better than hoping the model finds them in 1M tokens.

## A war story

A team I worked with built a RAG system for a 25MB markdown wiki (~200k tokens). Pipeline: pdf parser → RecursiveCharacterTextSplitter → OpenAI embeddings → pgvector → top-5 retrieval → Claude. Took a sprint. Accuracy was meh — the wiki had lots of short pages and embeddings struggled with terse content.

We rebuilt it as: **system prompt = the entire wiki, with prompt caching**. Total cost per query dropped 60% (because cached input is dirt cheap and we'd been over-retrieving), accuracy improved (model sees full context), latency improved (no retrieval hop), and the whole thing was ~30 lines of code instead of a service.

The lesson isn't "RAG is bad" — it's "RAG is a *scale* solution that gets applied at *prototype* size where it adds complexity without earning it."

## The hybrid sweet spot

For real production systems past 1M tokens:

```typescript
// 1. Coarse retrieval — narrow corpus to relevant docs
const candidates = await vectorSearch(query, { topK: 20 });

// 2. Long-context synthesis — feed candidates to Claude
const answer = await anthropic.messages.create({
  model: "claude-opus-4-7",
  system: candidates.map(c => c.fullDocument).join("\n---\n"),
  messages: [{ role: "user", content: query }]
});
```

You get the precision of retrieval (relevant docs) with the synthesis power of long context (no chunking artifacts). The chunking step exists only to *filter*, not to *replace* full-document reasoning.

## ✅ Checklist before you build RAG

- [ ] Corpus is **>100k tokens** and you've checked total token count
- [ ] Corpus **changes regularly** (otherwise: cache + fine-tune candidates exist)
- [ ] You've tried **prompt caching** with the full corpus and it didn't work / wasn't affordable
- [ ] You **measured** answer quality at corpus size before deciding to chunk
- [ ] You know **what your top-k should be** based on actual retrieval evals
- [ ] You have a plan for **re-embedding** when content changes
- [ ] You've considered **hybrid** (vector + BM25/keyword) instead of pure vector
- [ ] You've considered **agentic search** (give the LLM tools, let it retrieve) instead of pre-built RAG

## Related

- [Context Windows & Tokens](../concepts/context-windows-and-tokens.md) — why long-context-with-caching is often the right call
- *(coming) Tool-use design — agentic search as a RAG alternative*
- *(coming) Evals & Observability — measuring retrieval quality before scaling*
