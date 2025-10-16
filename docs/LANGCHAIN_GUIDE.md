# LangChain Tools & Architecture Guide

## What is LangChain?

**LangChain** is a framework that makes it easier to build applications with Large Language Models (LLMs). Think of it as a toolkit that handles common AI tasks so you don't have to build everything from scratch.

### The Problem LangChain Solves

**Without LangChain:**
```typescript
// You have to do everything manually
async function askQuestion(question: string) {
  // 1. Split question into proper format
  // 2. Manage conversation history
  // 3. Call OpenAI API with correct parameters
  // 4. Parse response
  // 5. Handle errors
  // 6. Stream responses
  // ...hundreds of lines of code
}
```

**With LangChain:**
```typescript
import { ChatOpenAI } from "@langchain/openai";

const llm = new ChatOpenAI();
const response = await llm.invoke("What is the capital of France?");
// Done! LangChain handles everything
```

## LangChain Components in This Project

### 1. Text Splitters (Document Chunking)

**File**: Used in `src/services/RAGService.ts`, `src/services/BaseEmbeddingService.ts`

#### RecursiveCharacterTextSplitter

**What it does:** Intelligently splits long documents into smaller chunks.

```typescript
import { RecursiveCharacterTextSplitter } from "@langchain/textsplitters";

const splitter = new RecursiveCharacterTextSplitter({
  chunkSize: 1000,        // Target chunk size in characters
  chunkOverlap: 200,      // Overlap between chunks
  separators: ["\n\n", "\n", ". ", " ", ""]  // Split hierarchy
});

const chunks = await splitter.createDocuments([longText]);
```

#### How It Works (Step by Step)

**Input text:**
```
Chapter 1: Introduction

This is a long document about AI. It has multiple paragraphs.

AI is transforming the world. Machine learning is a subset of AI.

Chapter 2: Deep Learning

Deep learning uses neural networks...
```

**Step 1**: Try splitting by `\n\n` (double newline - paragraphs)
```javascript
[
  "Chapter 1: Introduction",
  "This is a long document about AI. It has multiple paragraphs.",
  "AI is transforming the world. Machine learning is a subset of AI.",
  "Chapter 2: Deep Learning\n\nDeep learning uses neural networks..."
]
```

**Step 2**: Check if any chunk > 1000 chars
- If yes, try next separator (`. ` for sentences)
- If no, we're done!

**Step 3**: Add overlap (200 chars from previous chunk)
```javascript
[
  {
    pageContent: "Chapter 1: Introduction\n\nThis is a long document...",
    metadata: {}
  },
  {
    pageContent: "...long document about AI. It has multiple paragraphs.\n\nAI is transforming...",
    // ↑ Notice overlap with previous chunk
    metadata: {}
  }
]
```

#### Why This Matters

**Bad chunking:**
```
Chunk 1: "The remote work policy states that"
Chunk 2: "employees can work 3 days from home."
```
User asks "How many remote days?" → Chunk 1 doesn't have the answer!

**Good chunking (with overlap):**
```
Chunk 1: "The remote work policy states that employees can work 3 days from home."
Chunk 2: "...3 days from home. Manager approval is required for remote work."
```
User asks "How many remote days?" → Chunk 1 has the full answer!

### 2. Embeddings (Vector Generation)

**File**: `src/services/RAGService.ts`, `src/services/BaseEmbeddingService.ts`

#### OpenAIEmbeddings

**What it does:** Converts text into numerical vectors (embeddings).

```typescript
import { OpenAIEmbeddings } from "@langchain/openai";

const embeddings = new OpenAIEmbeddings({
  apiKey: process.env.OPENAI_API_KEY,
  modelName: "text-embedding-3-small"  // 1536 dimensions
});

const vector = await embeddings.embedQuery("Hello world");
// vector = [0.123, -0.456, 0.789, ..., 0.321]  (1536 numbers)
```

#### Batch Embeddings

```typescript
const vectors = await embeddings.embedDocuments([
  "First document",
  "Second document",
  "Third document"
]);
// Returns array of 3 vectors
```

#### How We Use It

```typescript
// In RAGService.ts
for (const chunk of chunks) {
  const embedding = await this.embeddings.embedQuery(chunk.pageContent);

  await db.insert(documentChunks).values({
    chunkText: chunk.pageContent,
    embedding: embedding  // Store in PostgreSQL with pgvector
  });
}
```

### 3. Chat Models (LLM Integration)

**File**: `src/services/AgentService.ts`

#### ChatAnthropic (Claude)

**What it does:** Easy interface to call Claude API.

```typescript
import { ChatAnthropic } from "@langchain/anthropic";

const llm = new ChatAnthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
  model: "claude-3-7-sonnet-20250219",
  temperature: 0.7,  // Creativity level (0 = deterministic, 1 = creative)
});

// Simple call
const response = await llm.invoke("What is 2+2?");
console.log(response.content);  // "4"
```

#### Streaming Responses

**What it does:** Send response word-by-word as it's generated (like ChatGPT).

```typescript
const streamingLlm = new ChatAnthropic({
  model: "claude-3-7-sonnet-20250219",
  streaming: true,
  callbacks: [{
    handleLLMNewToken(token: string) {
      console.log(token);  // Each word appears here
      // Send to frontend in real-time
    }
  }]
});

await streamingLlm.invoke("Write a short poem");
// Output appears word by word:
// "Roses" → "are" → "red" → "," → "violets" → "are" → "blue" → ...
```

### 4. Agents (AI with Tools)

**File**: `src/services/AgentService.ts`

#### What are Agents?

An **agent** is an AI that can:
1. Understand what the user wants
2. Decide which tool(s) to use
3. Call those tools
4. Use the results to answer the user

**Example conversation:**
```
User: "Find Python developers"

Agent thinks: "The user wants to search for candidates with Python skills.
              I should use the search_applications tool."

Agent calls: searchApplicationsTool({ query: "Python developers" })

Tool returns: [
  { name: "Alice", skills: "Python, Django" },
  { name: "Bob", skills: "Python, Flask" }
]

Agent responds: "I found 2 Python developers: Alice (Django) and Bob (Flask)"
```

#### Creating Agents with LangGraph

**LangGraph** = LangChain's library for building agent workflows

```typescript
import { createReactAgent } from "@langchain/langgraph/prebuilt";
import { MemorySaver } from "@langchain/langgraph";

const agent = createReactAgent({
  llm: new ChatAnthropic({ model: "claude-3-7-sonnet" }),
  tools: [searchTool, calculateTool, weatherTool],
  checkpointSaver: new MemorySaver(),  // Remembers conversation
  messageModifier: systemPrompt         // Instructions for the agent
});

const result = await agent.invoke({
  messages: [{ role: "user", content: "What's the weather in Paris?" }]
});
```

#### How Agents Work (Detailed Flow)

**User**: "Find senior Python developers in applications"

**Step 1: Agent receives message**
```typescript
await agent.invoke({
  messages: [{ role: "user", content: "Find senior Python developers" }]
});
```

**Step 2: Agent analyzes available tools**
```typescript
tools: [
  {
    name: "search_documents",
    description: "Search uploaded PDF documents"
  },
  {
    name: "search_applications",
    description: "Search job applications by skills"  // ← Will use this!
  },
  {
    name: "search_positions",
    description: "Search open job positions"
  }
]
```

**Step 3: Agent thinks (internal reasoning)**
```
Claude (internal): "The user wants to find candidates. I should use
the search_applications tool with query 'senior Python developers'."
```

**Step 4: Agent calls tool**
```typescript
const toolResult = await searchApplicationsTool.invoke({
  query: "senior Python developers",
  limit: 5
});
```

**Step 5: Tool executes**
```typescript
// Inside search_applications tool
async (input) => {
  const embedding = await embeddings.embedQuery(input.query);
  const results = await db.vectorSearch(embedding);
  return results;
}
```

**Step 6: Tool returns data**
```json
{
  "data": {
    "applications": [
      { "name": "Alice", "skills": "Senior Python, Django, 8 years" },
      { "name": "Bob", "skills": "Python, FastAPI, 6 years" }
    ]
  }
}
```

**Step 7: Agent formulates response**
```
Claude: "I found 2 senior Python developers: Alice (8 years, Django)
        and Bob (6 years, FastAPI)."
```

### 5. Tools (Agent Functions)

**File**: `src/services/AgentService.ts`

#### What are Tools?

Tools are functions that agents can call. They're like giving the AI access to a calculator, database, or API.

#### Creating a Tool

```typescript
import { tool } from "@langchain/core/tools";
import { z } from "zod";

const searchApplicationsTool = tool(
  async (input: any) => {
    // Tool logic here
    const results = await database.search(input.query);

    // Must return JSON string
    return JSON.stringify({
      data: {
        applications: results,
        searchQuery: input.query
      }
    });
  },
  {
    name: "search_applications",
    description: `Search for job applications by skills or experience.

    Use this when the user asks:
    - "Find Python developers"
    - "Show candidates with React experience"
    - "Who knows AWS?"`,

    schema: z.object({
      query: z.string().describe("Search query (e.g., 'Python developer')"),
      limit: z.number().optional().describe("Max results (default: 5)")
    })
  }
);
```

#### Tool Components

1. **Function** - What the tool does
2. **Name** - How the agent identifies it
3. **Description** - When to use this tool (important for agent decision-making!)
4. **Schema** - Input parameters (uses Zod for validation)

#### Example: Search Documents Tool

```typescript
const createSearchTool = () => {
  return tool(
    async (input: any) => {
      // 1. Extract query
      const query = input.query;

      // 2. Perform vector search
      const results = await RAGService.similaritySearch(query, 5);

      // 3. Return formatted results
      return JSON.stringify({
        data: {
          sources: results.map(r => ({
            content: r.content,
            filename: r.filename
          })),
          searchQuery: query
        }
      });
    },
    {
      name: "search_documents",
      description: `Search uploaded PDF documents using semantic similarity.

      Use this for:
      - Company policies and procedures
      - Technical documentation
      - Any uploaded PDF content

      Examples:
      - "What are the travel expense rules?"
      - "Find information about sick leave policy"`,

      schema: z.object({
        query: z.string().describe("The search query")
      })
    }
  );
};
```

### 6. Prompts (Structured Prompting)

**File**: `src/services/AgentService.ts`

#### PromptTemplate

**What it does:** Create reusable prompt templates with variables.

```typescript
import { PromptTemplate } from "@langchain/core/prompts";

const template = PromptTemplate.fromTemplate(`
You are a helpful assistant.

User question: {question}
Context: {context}

Please answer the question based on the context.
`);

const prompt = await template.format({
  question: "What is AI?",
  context: "AI stands for Artificial Intelligence..."
});

// Result:
// "You are a helpful assistant.
//
//  User question: What is AI?
//  Context: AI stands for Artificial Intelligence...
//
//  Please answer the question based on the context."
```

#### System Prompts for Agents

```typescript
const SYSTEM_PROMPT = `You are a helpful AI assistant with access to:
1. Document database - Search uploaded documents
2. Bedtime stories database - Search generated stories
3. Job applications - Search candidates

Available tools:
- search_documents: Find information in PDFs
- search_stories: Find bedtime stories
- search_applications: Find job candidates

When responding:
1. Choose the right tool for the question
2. Provide clear answers based on retrieved data
3. Cite sources when applicable`;

const agent = createReactAgent({
  llm,
  tools,
  messageModifier: SYSTEM_PROMPT  // Agent follows these instructions
});
```

### 7. Memory (Conversation History)

**File**: `src/services/AgentService.ts`

#### MemorySaver

**What it does:** Remembers conversation history so the agent has context.

```typescript
import { MemorySaver } from "@langchain/langgraph";

const memory = new MemorySaver();

const agent = createReactAgent({
  llm,
  tools,
  checkpointSaver: memory
});

// First message
await agent.invoke(
  { messages: [{ role: "user", content: "Find Python developers" }] },
  { configurable: { thread_id: "user123" } }  // Unique ID for this conversation
);
// Agent: "I found Alice and Bob"

// Second message (same thread)
await agent.invoke(
  { messages: [{ role: "user", content: "Tell me more about Alice" }] },
  { configurable: { thread_id: "user123" } }  // Same thread!
);
// Agent: "Alice is a senior Python developer with Django experience..."
// Agent remembers Alice from the previous search!
```

#### How Memory Works

```
Thread: "user123"

┌──────────────────────────────────────────┐
│ Message 1:                               │
│ User: "Find Python developers"           │
│ Agent: "Found Alice and Bob"             │
│ Tool: search_applications                │
│ Results: [{Alice}, {Bob}]                │
└──────────────────────────────────────────┘
                  ↓ Saved to memory
┌──────────────────────────────────────────┐
│ Message 2:                               │
│ User: "Tell me more about Alice"         │
│ Agent: [Checks memory, sees Alice]       │
│ Agent: "Alice is senior Python dev..."   │
└──────────────────────────────────────────┘
```

## Real Implementation Examples

### Example 1: RAG Service (No Agents)

**Simple Q&A without tools:**

```typescript
// src/services/RAGService.ts

export class RAGService {
  private static embeddings = new OpenAIEmbeddings({
    modelName: "text-embedding-3-small"
  });

  // 1. Process document
  static async processDocument(file: File) {
    // Parse PDF
    const text = await extractPDFText(filePath);

    // Chunk with LangChain
    const splitter = new RecursiveCharacterTextSplitter({
      chunkSize: 1000,
      chunkOverlap: 200
    });
    const chunks = await splitter.createDocuments([text]);

    // Embed with LangChain
    for (const chunk of chunks) {
      const embedding = await this.embeddings.embedQuery(chunk.pageContent);
      await db.insert(documentChunks).values({
        chunkText: chunk.pageContent,
        embedding
      });
    }
  }

  // 2. Search
  static async similaritySearch(query: string) {
    const queryEmbedding = await this.embeddings.embedQuery(query);
    return await db.vectorSearch(queryEmbedding);
  }

  // 3. Generate answer (using direct Anthropic SDK, not LangChain)
  static async generateAnswer(question: string, context: any[]) {
    const anthropic = new Anthropic();
    const response = await anthropic.messages.create({
      model: "claude-3-7-sonnet",
      messages: [{
        role: "user",
        content: `Context: ${context}\n\nQuestion: ${question}`
      }]
    });
    return response.content[0].text;
  }
}
```

### Example 2: Agent Service (With Tools)

**Advanced: AI with multiple tools:**

```typescript
// src/services/AgentService.ts

export class AgentService {
  private static memorySaver = new MemorySaver();

  static streamChat(message: string, thread_id: string) {
    return new Observable((subscriber) => {
      (async () => {
        // 1. Create streaming LLM
        const llm = new ChatAnthropic({
          model: "claude-3-7-sonnet",
          streaming: true,
          callbacks: [{
            handleLLMNewToken(token: string) {
              subscriber.next(token);  // Stream to frontend
            }
          }]
        });

        // 2. Create tools
        const tools = [
          createSearchDocumentsTool(),    // Search PDFs
          createSearchStoresTool(),       // Search stories
          createSearchApplicationsTool()  // Search job applications
        ];

        // 3. Create agent with tools
        const agent = createReactAgent({
          llm,
          tools,
          checkpointSaver: this.memorySaver,
          messageModifier: SYSTEM_PROMPT
        });

        // 4. Invoke agent with callbacks for tool usage
        await agent.invoke(
          { messages: [{ role: "user", content: message }] },
          {
            configurable: { thread_id },
            callbacks: [{
              handleToolStart(tool, input) {
                // Notify frontend: "Searching documents..."
                subscriber.next({
                  data: { toolUsage: { name: tool.name, input }}
                });
              },
              handleToolEnd(output) {
                // Send tool results to frontend
                const data = JSON.parse(output.content);
                subscriber.next({ data: data.data });
              }
            }]
          }
        );

        subscriber.complete();
      })();
    });
  }
}
```

## LangChain Patterns in This Project

### Pattern 1: BaseEmbeddingService (DRY)

**Problem**: Multiple features need embeddings (stories, applications, documents)

**Solution**: Abstract base class using LangChain

```typescript
// src/services/BaseEmbeddingService.ts

export abstract class BaseEmbeddingService {
  private static embeddings = new OpenAIEmbeddings({
    modelName: "text-embedding-3-small"
  });

  protected abstract getEmbeddingsTable(): PgTable;
  protected abstract getEntityTable(): PgTable;

  // Reusable chunking & embedding
  protected async chunkAndEmbed(content: string) {
    const splitter = new RecursiveCharacterTextSplitter({
      chunkSize: 1000,
      chunkOverlap: 200
    });

    const chunks = await splitter.createDocuments([content]);
    const results = [];

    for (const chunk of chunks) {
      const embedding = await BaseEmbeddingService.embeddings.embedQuery(
        chunk.pageContent
      );
      results.push({ chunkText: chunk.pageContent, embedding });
    }

    return results;
  }

  // Reusable similarity search
  async similaritySearch(query: string, limit = 3) {
    const queryEmbedding = await BaseEmbeddingService.embeddings.embedQuery(query);
    // ... vector search logic
  }
}
```

**Usage:**
```typescript
// Story embeddings
class StoryEmbeddingService extends BaseEmbeddingService {
  protected getEmbeddingsTable() { return storyEmbeddings; }
  protected getEntityTable() { return stories; }
}

// Application embeddings
class ApplicationEmbeddingService extends BaseEmbeddingService {
  protected getEmbeddingsTable() { return applicationEmbeddings; }
  protected getEntityTable() { return reviewedApplications; }
}
```

### Pattern 2: Observable Streaming

**Problem**: Need real-time updates from agent (tool calls + LLM responses)

**Solution**: RxJS Observable with LangChain callbacks

```typescript
import { Observable } from "rxjs";

static streamChat(message: string): Observable<string | ToolData> {
  return new Observable((subscriber) => {
    const llm = new ChatAnthropic({
      streaming: true,
      callbacks: [{
        handleLLMNewToken(token: string) {
          subscriber.next(token);  // Stream text tokens
        }
      }]
    });

    const agent = createReactAgent({ llm, tools });

    await agent.invoke(message, {
      callbacks: [{
        handleToolStart(tool, input) {
          subscriber.next({  // Stream tool usage
            data: { toolUsage: { name: tool.name, input }}
          });
        },
        handleToolEnd(output) {
          subscriber.next({  // Stream tool results
            data: JSON.parse(output.content).data
          });
        }
      }]
    });

    subscriber.complete();
  });
}
```

### Pattern 3: Retry Logic for Embeddings

**Problem**: OpenAI API rate limits

**Solution**: Exponential backoff with LangChain embeddings

```typescript
async function embedWithRetry(text: string) {
  let retries = 3;
  let delay = 500;

  while (retries > 0) {
    try {
      return await embeddings.embedQuery(text);
    } catch (error) {
      retries--;
      if (retries === 0) throw error;

      await sleep(delay);
      delay *= 2;  // 500ms → 1000ms → 2000ms
    }
  }
}
```

## When to Use LangChain vs Direct API

### Use LangChain When:

✅ **Text splitting** - RecursiveCharacterTextSplitter is excellent
✅ **Embeddings** - Unified interface (swap OpenAI ↔ Anthropic easily)
✅ **Agents** - Complex workflows with tools
✅ **Memory** - Multi-turn conversations
✅ **Chaining** - Multiple LLM steps

### Use Direct API When:

✅ **Simple single calls** - One question, one answer
✅ **Custom streaming** - Very specific streaming requirements
✅ **Performance critical** - Every millisecond counts
✅ **Specific API features** - Need exact API parameters

**Example (Direct API for simple streaming):**
```typescript
// Bedtime story generation - simple single call
const anthropic = new Anthropic();
const stream = await anthropic.messages.stream({
  model: "claude-3-5-haiku",
  messages: [{ role: "user", content: storyPrompt }]
});

for await (const chunk of stream) {
  yield chunk.delta.text;
}
```

## Debugging LangChain

### Enable Verbose Logging

```typescript
import { ChatAnthropic } from "@langchain/anthropic";

const llm = new ChatAnthropic({
  verbose: true  // Logs all LLM calls
});

// Also works for agents
const agent = createReactAgent({
  llm,
  tools,
  verbose: true  // Logs tool calls, reasoning, etc.
});
```

### Log Tool Calls

```typescript
const agent = createReactAgent({
  llm,
  tools,
  callbacks: [{
    handleToolStart(tool, input) {
      console.log("Tool called:", tool.name);
      console.log("Input:", input);
    },
    handleToolEnd(output) {
      console.log("Tool output:", output);
    },
    handleLLMStart(llm, prompts) {
      console.log("LLM called with:", prompts);
    }
  }]
});
```

## Testing LangChain Components

### Test Text Splitter

```typescript
import { describe, it, expect } from "vitest";

describe("RecursiveCharacterTextSplitter", () => {
  it("should split text into chunks", async () => {
    const splitter = new RecursiveCharacterTextSplitter({
      chunkSize: 100,
      chunkOverlap: 20
    });

    const docs = await splitter.createDocuments([
      "This is a long text that should be split into multiple chunks..."
    ]);

    expect(docs.length).toBeGreaterThan(1);
    expect(docs[0].pageContent.length).toBeLessThanOrEqual(100);
  });
});
```

### Test Embeddings

```typescript
describe("OpenAIEmbeddings", () => {
  it("should generate embeddings", async () => {
    const embeddings = new OpenAIEmbeddings();
    const vector = await embeddings.embedQuery("test");

    expect(vector).toHaveLength(1536);
    expect(vector[0]).toBeTypeOf("number");
  });

  it("should generate similar embeddings for similar text", async () => {
    const embeddings = new OpenAIEmbeddings();

    const vec1 = await embeddings.embedQuery("dog");
    const vec2 = await embeddings.embedQuery("puppy");
    const vec3 = await embeddings.embedQuery("car");

    const similarity12 = cosineSimilarity(vec1, vec2);
    const similarity13 = cosineSimilarity(vec1, vec3);

    expect(similarity12).toBeGreaterThan(similarity13);  // dog closer to puppy than car
  });
});
```

## Summary: LangChain in This Project

**Core LangChain Components Used:**

1. **RecursiveCharacterTextSplitter** - Smart document chunking
2. **OpenAIEmbeddings** - Text → vector conversion
3. **ChatAnthropic** - Claude API wrapper
4. **createReactAgent** - AI agents with tools
5. **MemorySaver** - Conversation memory
6. **tool()** - Define agent tools
7. **PromptTemplate** - Reusable prompts

**Architecture Benefits:**

- **Modularity** - Swap OpenAI ↔ Anthropic easily
- **Reusability** - BaseEmbeddingService shared across features
- **Abstraction** - Don't worry about API details
- **Power** - Agents can use tools intelligently

**Key Files:**

- `src/services/RAGService.ts` - Text splitting, embeddings
- `src/services/AgentService.ts` - Agents, tools, memory
- `src/services/BaseEmbeddingService.ts` - Shared embedding logic

**Next Steps:**

- Read `docs/AI_INTEGRATION.md` - Claude & OpenAI APIs
- Read `docs/REUSABLE_PATTERNS.md` - Extract for your project

LangChain makes complex AI workflows simple! 🎉
