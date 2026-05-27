# Claude Code as Daily Driver

## TL;DR

In 2026 I do **~70% of my dev work through Claude Code** instead of an IDE-with-AI like Cursor. Different model: instead of inline autocomplete, I delegate **whole tasks** to an agent that reads, plans, edits, runs, and verifies. This page is how I actually do it — setup, daily flow, when it shines, when it doesn't.

## What Claude Code is (briefly)

A terminal-native CLI agent built by Anthropic. You type a task; it reads files, runs commands, edits code, runs tests, and reports back. Different paradigm from Cursor/Copilot's inline completion. Closer in spirit to a junior engineer you can ask "go investigate X" or "implement Y, ping me when done."

## My setup

```
~/.claude/CLAUDE.md       ← global instructions (oh-my-claudecode preset)
~/.claude/keybindings.json ← custom shortcuts
.claude/settings.json     ← per-project settings, permissions, hooks
.claude/commands/         ← per-project skills (slash commands)
```

**Plugin layer**: oh-my-claudecode (OMC) — orchestration on top of Claude Code. Multi-agent teams, autopilot loops, parallel execution, reusable skills. The "framework for the framework" piece.

**MCP servers I keep enabled**:
- `chrome-devtools` — browser automation + console reading (gold for UI work)
- `figma` — design-to-code and code-to-design
- `context7` — fetch current library docs (replaces hallucinated SDK calls)

**Custom skills I built for kulify** (Profico-relevant ones):
- `/brief` — generate a context briefing before starting a session
- `/ingest` — pull a URL/PDF/transcript into the Second Brain
- `/recall` — Q&A against the SB
- `/commit` — controlled commit with our conventions
- `/sprint-demo` — build a sprint deck from a Jira epic
- `/end-session` — write a structured session report

## The daily flow

### 1. Morning brief (30 seconds)

```bash
cd ~/Desktop/Projects/fajb-next
claude /brief
```

`/brief` reads recent commits, pulls open Jira tickets, scans the current branch, and gives me a 200-word context-load on where things are. Better than reading 50 GitHub notifications.

### 2. Task delegation

Most work happens via:

```
> implement JB-131: add tooltip to author filter, match the design in figma.com/...
```

Claude Code:
1. Reads the Jira ticket via `read-jira-issue` skill
2. Opens Figma, pulls the design context
3. Reads relevant files in the repo
4. Plans (sometimes asks clarifying questions)
5. Edits files
6. Runs the dev server, takes a screenshot, compares to the design
7. Iterates if mismatch
8. Reports back

I'm in the loop for plan approval and final review, not for every edit.

### 3. End-session capture

```
> /end-session
```

Writes a structured report (what I worked on, what's left, what was learned) that flows into kulify-sb. Future-me has continuity. Future-Claude has context.

## What it's actually good at

### ✅ Multi-file refactors

Renaming a concept across 20 files? Splitting a module? Migrating an API? Claude Code shines here. It can read the whole tree, plan the move, execute, run tests, and self-correct on failures. Cursor can do this but you're driving; here you're reviewing.

### ✅ "Investigate this" tasks

"Why is the dev server crashing on cold start?" — give it the error, let it grep the codebase, read the relevant files, form a hypothesis, test it. Closer to having a co-worker than a code completer.

### ✅ Boilerplate that follows a pattern

"Add a new feature page that follows the same pattern as `/users` but for `/teams`" — it reads the pattern, applies it, adapts the schema. Fast.

### ✅ Connecting tools

Reading a Jira ticket, pulling a Figma design, generating code that matches it, committing with our format — Claude Code stitches the toolchain. MCP servers are the multiplier.

### ✅ Working in unfamiliar codebases

Joining a new project? Have Claude Code do a `codebase-analyst` pass first. It generates architectural docs that make onboarding 3× faster.

## What it's not good at (yet)

### ❌ Tight UI iteration

When I'm tweaking spacing, colors, micro-interactions — the agent loop (edit → run → screenshot → compare) is slower than just opening the browser and editing live. **Cursor or vanilla IDE still wins here.**

### ❌ Very small edits

"Rename this variable" — overkill for Claude Code. Use your IDE.

### ❌ Live debugging with breakpoints

The agent can run a script and read output, but it can't sit in a debugger with you stepping through. Hybrid flow: I debug, Claude Code fixes once I find the issue.

### ❌ Anything where you need to *think harder than the AI*

Architecture decisions with serious tradeoffs, security-critical code, novel algorithms. The AI is a strong implementer, not a strong architect (yet). I plan first, then delegate execution.

## The Second Brain pattern

This is the part I think most colleagues miss when they try Claude Code and bounce off.

**The agent is only as smart as the context you give it.** Claude Code reads the current directory by default, but it doesn't know:
- Why your team made the decisions it made
- What was tried and didn't work last quarter
- The opinions, preferences, conventions of the team
- The pending Jira tickets that should inform the design

I keep all of that in `kulify-sb/` — an Obsidian vault Claude Code can read. When I delegate a task, the agent picks up:
- `CLAUDE.md` — global preferences (commit format, tone, conventions)
- `MEMORY.md` — auto-loaded context (current project state, recent learnings)
- `Wiki/` — the knowledge graph
- `Projects/<name>/` — per-project notes

The result is an agent that knows my workflow, my preferences, and my history. **Onboarding the AI** is the work; once onboarded, leverage compounds.

This is the part you can't easily get from Cursor — it's the **persistent context layer**.

## ROI estimate

Roughly, since adopting Claude Code + the OMC + Second Brain stack:

| Task type | Time before | Time now |
|-----------|------------|----------|
| Multi-file refactor (medium) | 2–3 hours | 30–45 min |
| New page from existing pattern | 1 hour | 15 min |
| Investigating a bug in unfamiliar code | 1–2 hours | 30 min |
| Sprint demo prep | 4 hours | 1 hour |
| Onboarding to a new repo | 2 days | 4 hours |

Not all wins. Tight UI work and architecture-heavy work are still ~the same. But across a week, the net is probably **15–20 hours back**. The leverage isn't in any single task; it's in the *aggregate* of small wins not feeling small.

## Onboarding tips for colleagues

If you've never used Claude Code:

1. **Don't start with autocomplete brain.** This isn't Cursor. Delegate whole tasks, not characters.
2. **Read the CLAUDE.md before you start.** Set up your global preferences first. The agent matches what's in there.
3. **Start with read-only tasks.** "Explain how X works", "find all places we do Y", "review this branch." Build trust before letting it edit.
4. **Use plan mode for non-trivial work.** `claude --permission plan` makes it propose before acting.
5. **Build one custom skill.** The moment you have a `/commit` or `/standup` that matches your team's exact flow, the leverage clicks.
6. **Don't skip the verifier pass.** Have the agent (or a second agent) verify its own work. Trust-but-verify isn't optional.

## ⚠️ Anti-patterns I had to unlearn

- **Watching every edit** — defeats the purpose; review the diff at the end
- **Single agent for everything** — use specialized subagents (executor, code-reviewer, etc.)
- **Skipping the planning step** — leads to half-finished implementations
- **No persistent context** — every session starts cold without `CLAUDE.md` and SB
- **Ignoring permission modes** — `acceptEdits` for trusted tasks, `plan` for risky ones

## Related

- *(coming) oh-my-claudecode orchestration — the OMC layer on top*
- *(coming) Second Brain with AI — the persistent context pattern in detail*
- *(coming) AI pair programming flow — when to hand off vs sit beside*
