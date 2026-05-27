# AI Knowledge

A working collection of mental models, patterns, opinions, and workflows I've picked up building AI features in production from 2023 through 2026.

This complements the rest of `/docs/` (which covers the **how** of these demo apps) — this folder covers the **when**, **why**, and **what I'd do differently**.

## 📚 Buckets

### 🧠 [Concepts](./concepts/) — mental models
How LLMs actually behave, what tokens are, why embeddings work the way they do.

- [Context Windows & Tokens](./concepts/context-windows-and-tokens.md) — How to think about LLM working memory
- *(more to come: embeddings-intuition, prompt-engineering-mental-model, agents-as-graphs, evals-and-observability)*

### 🛠️ [Patterns](./patterns/) — playbooks
"If you're building X, here's the recipe I'd reach for."

- [When to Use RAG (and When Not To)](./patterns/when-rag-when-not.md) — Decision framework for retrieval
- *(more to come: tool-use-design, streaming-ux-patterns, multi-step-ai-forms, n8n-vs-code-agent)*

### 🔥 [Opinions](./opinions/) — hot takes
Where I disagree with the consensus, with reasoning.

- [LangChain — The Good, The Bad, and The Ugly](./opinions/langchain-good-bad-ugly.md) — My honest review after 3 years
- *(more to come: when-agents-are-overkill, rag-is-overhyped, claude-vs-openai-vs-gemini, prompt-engineering-myths)*

### ⚡ [Workflows](./workflows/) — how I actually work
Daily habits, tooling, the Second Brain pattern.

- [Claude Code as Daily Driver](./workflows/claude-code-as-daily-driver.md) — How I use Claude Code at Profico
- *(more to come: oh-my-claudecode-orchestration, second-brain-with-ai, lovable-bolt-v0-when-to-use)*

### 🔧 [Tools](./tools/) — short reviews
SDK / platform / framework comparisons.

- *(coming soon: vercel-ai-sdk-vs-langchain, mcp-the-good-parts, coolify-for-ai-projects)*

## 📖 How to read

- Each file is one focused idea (~5–10 min read)
- Files cross-link via standard markdown — open them on GitHub or locally
- Status of this collection: **active and growing** as I capture more

## 🔄 Where this lives

This is a **mirror**. The master lives in [kulify-sb](https://github.com/kula124/kulify) `Wiki/AI/` (private Obsidian vault, also publishes selected pages to `sb.kulify.me`). This GitHub copy is the public, code-adjacent version — next to the demo apps that illustrate many of these concepts.

If you spot an error or want to discuss something here, open an issue against `ai-preza-demos`.

## 🆚 How this folder differs from the rest of `/docs/`

| Folder | Focus |
|--------|-------|
| `/docs/BEGINNER_GUIDE.md` etc. | **How these demo apps work** — tutorial-style, tied to specific code |
| `/docs/knowledge/` (this folder) | **Cross-cutting AI knowledge** — decisions, opinions, workflows, mental models |

Read the existing docs to learn the codebase. Read this folder to learn the *thinking* behind the codebase.

---

**Last updated:** 2026-05-27
