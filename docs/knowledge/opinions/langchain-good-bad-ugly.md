# LangChain — The Good, The Bad, and The Ugly

## TL;DR

After three years of using LangChain (and LangGraph) in production: **I use it for ~30% of what I used to**. The framework solved real problems in 2023 when SDKs were terrible. In 2026, with native Anthropic SDK + Vercel AI SDK + MCP, much of LangChain's surface area is now redundant abstraction. **Start with the direct SDK. Add LangChain only when you genuinely need agent orchestration or want a specific component.**

This is a contrarian take. [`LANGCHAIN_GUIDE.md`](../../LANGCHAIN_GUIDE.md) in this same `/docs/` takes the standard "LangChain is great" position. This is the other side.

## ✅ The good

There's a reason LangChain became the default. Genuine wins:

### RecursiveCharacterTextSplitter
The single most useful piece of LangChain. Smart, fast, the right hierarchy of separators. I'd pull it in just for this even in pure-SDK projects.

### LangGraph for real agents
When you actually need a state machine — checkpointing, conditional edges, human-in-the-loop interrupts — LangGraph is the best option in the ecosystem. It's *underneath* most production agent frameworks now.

### Vector store abstractions
If you want to start on pgvector and migrate to Pinecone or Weaviate later, LangChain's vector store interface saves you from rewriting. Real value if you're undecided.

### Document loaders
PDF, DOCX, HTML, Notion, S3 — the ecosystem of loaders is genuinely big and well-maintained. Reinventing these is a waste of time.

## 🚧 The bad

### API churn

This is the biggest one. Between 2023 and 2026, LangChain went through:
- LCEL (LangChain Expression Language) replacing chains
- Splitting into `@langchain/core` + provider packages
- Deprecating `LLMChain`, `RetrievalQAChain`, etc.
- LangGraph extracting agent logic into a separate concept
- Multiple breaking changes to the agent constructor signatures

Code I wrote in 2024 doesn't run in 2026 without rewrites. That's a tax you pay every quarter or so.

### Leaky abstractions

LangChain's chains look clean until you need to debug them. Then you're three layers deep, looking at why the prompt the model actually saw is different from the one in your code. Common debug session:

```
1. Add verbose:true
2. Realize the output is buried in a callback handler
3. Start reading langchain-core source to figure out what
   actually gets sent to the LLM
4. Wonder if you should just be calling the SDK directly
```

### Over-engineering for the simple case

For a one-shot LLM call, LangChain is more code, more dependencies, and slower than:

```typescript
// LangChain way
const llm = new ChatAnthropic({ model: "claude-opus-4-7", temperature: 0.7 });
const prompt = PromptTemplate.fromTemplate("Translate: {text}");
const chain = prompt.pipe(llm).pipe(new StringOutputParser());
const result = await chain.invoke({ text: "Hello" });

// Direct SDK
const response = await anthropic.messages.create({
  model: "claude-opus-4-7",
  max_tokens: 1024,
  messages: [{ role: "user", content: "Translate: Hello" }]
});
const result = response.content[0].text;
```

The LangChain version is "more abstract." The direct version is one fewer dependency, one fewer source of breaking changes, and clearer about what's actually being sent.

## 🔥 The ugly

### Debugging across the stack

When LangChain + LangGraph + a streaming callback + a tool error all interact, you get stack traces that are unreadable. You learn to set `verbose: true` everywhere, lean on LangSmith (their hosted observability tool — separate product, pricing kicks in fast), and accept that you'll spend more time on framework friction than on business logic.

### Type safety regressions

LangChain TypeScript types are… aspirational. `any` shows up in places that matter. Tool inputs are `any`. Callback handlers are `any`. The framework that promised to make AI engineering safer often makes type-checking weaker.

### Performance overhead

Each LangChain abstraction adds latency. Not catastrophic, but at high QPS it adds up. The direct SDK is faster, and for a streaming chat product where every 50ms is felt by the user, that matters.

### The "you don't need LangChain" rabbit hole

The dirty secret: most of what LangChain offers — chunking, embedding, retrieval, prompt templates — is **30–80 lines of code** if you write it yourself. People used to argue "but you'll need it later." In practice, the projects that *did* need scale rewrote the LangChain layer anyway, because the abstractions don't survive contact with production constraints.

## When I still use LangChain in 2026

| Use case | Why |
|----------|-----|
| Genuine agent orchestration with state | LangGraph is best-in-class |
| Heavy document ingestion (varied formats) | Loaders ecosystem |
| `RecursiveCharacterTextSplitter` | Just imports cleanly, no wider framework cost |
| Quick prototype where I don't care about overhead | Speed-of-development |
| Multi-provider abstraction (genuinely swapping LLMs) | Real benefit of the wrapper layer |

## When I don't anymore

| Use case | What I use instead |
|----------|-------------------|
| Simple LLM call | Direct Anthropic SDK |
| Streaming chat to a UI | Vercel AI SDK (`ai` package) — purpose-built for this |
| Single-tool agent | Anthropic SDK with `tools` parameter, no framework |
| RAG for ≤1M tokens | Long context + prompt caching (see [When to use RAG](../patterns/when-rag-when-not.md)) |
| MCP-based tool use | MCP server directly + Anthropic tool use |

## The replacement stack I reach for now

```
Anthropic SDK         ← LLM calls, tool use, streaming
Vercel AI SDK         ← UI streaming, useChat, edge runtime helpers
LangGraph (only)      ← real agent state machines
@langchain/textsplitters ← just the splitter, nothing else
MCP servers           ← tool / data source integrations
```

That's roughly 5 packages where I used to use 15. Build times are faster, the dependency tree is smaller, breaking-change exposure is much lower, and the code reads closer to what's actually happening at the LLM call.

## Counter-argument I take seriously

"LangChain documentation is the de facto AI tutorial — when you hire/onboard, that's what people know." This is fair. There's a real cost to bucking the default.

My response: in 2026, **Vercel AI SDK has nearly caught up** as a default, and the Anthropic SDK docs are now strong enough to stand on. The "default" is moving. Building on the contrarian stack today positions you better for 2027.

## ✅ Recommendation

- Starting a new AI feature? **Direct Anthropic SDK first.** Only add LangChain when you hit a *specific* limitation.
- Already on LangChain? Don't rip it out for ripping out's sake. But when you do refactors, ask "could this be 20 lines of direct SDK?"
- Building real agents? **LangGraph, yes.** Building chains? Probably not anymore.

## Related

- [When to use RAG (and when not to)](../patterns/when-rag-when-not.md) — RAG without RAG framework
- *(coming) Vercel AI SDK vs LangChain — head-to-head on the streaming chat case*
- *(coming) MCP — the good parts — the alternative to bespoke tool definitions*
