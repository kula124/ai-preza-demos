# Reusable Architecture Patterns

## How to Extract This Architecture for Your Projects

This guide shows you how to take the patterns from this demo project and apply them to your own applications.

## Table of Contents

1. [Core Patterns Overview](#core-patterns-overview)
2. [Pattern 1: RAG System](#pattern-1-rag-system)
3. [Pattern 2: AI Agents with Tools](#pattern-2-ai-agents-with-tools)
4. [Pattern 3: Streaming Responses](#pattern-3-streaming-responses)
5. [Pattern 4: Vector Embeddings](#pattern-4-vector-embeddings)
6. [Pattern 5: Service Layer Architecture](#pattern-5-service-layer-architecture)
6. [Starter Templates](#starter-templates)

---

## Core Patterns Overview

This project demonstrates 5 reusable patterns:

| Pattern | Use Case | Key Technologies |
|---------|----------|------------------|
| **RAG System** | Document Q&A, Knowledge bases | LangChain, pgvector, OpenAI |
| **AI Agents** | Multi-step workflows, Tool usage | LangGraph, Claude |
| **Streaming** | Real-time AI responses | Server-Sent Events, Observables |
| **Embeddings** | Semantic search, Similarity | OpenAI embeddings, pgvector |
| **Service Layer** | Clean architecture, Reusability | TypeScript, Drizzle ORM |

---

## Pattern 1: RAG System

### What You Can Reuse

**Core components:**
1. Document processing pipeline
2. Vector similarity search
3. Context-aware AI generation

### Step-by-Step Extraction

#### 1. Database Schema (Drizzle)

```typescript
// schema.ts
import { pgTable, serial, text, timestamp, vector } from "drizzle-orm/pg-core";

export const documents = pgTable("documents", {
  id: serial("id").primaryKey(),
  filename: text("filename").notNull(),
  content: text("content").notNull(),
  uploadDate: timestamp("upload_date").defaultNow(),
});

export const documentChunks = pgTable("document_chunks", {
  id: serial("id").primaryKey(),
  documentId: integer("document_id").references(() => documents.id, { onDelete: "cascade" }),
  chunkText: text("chunk_text").notNull(),
  chunkIndex: integer("chunk_index").notNull(),
  embedding: vector("embedding", { dimensions: 1536 }).notNull(),
});
```

**Adapt for your project:**
- Rename `documents` → your entity (e.g., `articles`, `products`)
- Add your own fields (e.g., `author`, `category`, `tags`)
- Keep the embedding structure the same

#### 2. RAG Service

```typescript
// RAGService.ts
import { OpenAIEmbeddings } from "@langchain/openai";
import { RecursiveCharacterTextSplitter } from "@langchain/textsplitters";
import Anthropic from "@anthropic-ai/sdk";

export class RAGService {
  private static embeddings = new OpenAIEmbeddings({
    modelName: "text-embedding-3-small"
  });

  // 1. Process & store document
  static async processDocument(content: string, metadata: any) {
    // Chunk text
    const splitter = new RecursiveCharacterTextSplitter({
      chunkSize: 1000,
      chunkOverlap: 200
    });
    const chunks = await splitter.createDocuments([content]);

    // Generate embeddings
    const chunkRecords = [];
    for (let i = 0; i < chunks.length; i++) {
      const embedding = await this.embeddings.embedQuery(chunks[i].pageContent);
      chunkRecords.push({
        documentId: metadata.id,
        chunkText: chunks[i].pageContent,
        chunkIndex: i,
        embedding
      });
    }

    // Store in database
    await db.insert(documentChunks).values(chunkRecords);
  }

  // 2. Search similar chunks
  static async similaritySearch(query: string, limit = 5) {
    const queryEmbedding = await this.embeddings.embedQuery(query);
    const embeddingString = `[${queryEmbedding.join(",")}]`;

    const results = await db.execute(sql`
      SELECT chunk_text, document_id
      FROM document_chunks
      ORDER BY embedding <=> ${embeddingString}::vector
      LIMIT ${limit}
    `);

    return results.rows;
  }

  // 3. Generate answer with AI
  static async generateAnswer(question: string, context: any[]) {
    const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

    const contextText = context.map(c => c.chunk_text).join("\n\n");
    const prompt = `Context:\n${contextText}\n\nQuestion: ${question}\n\nAnswer based on context:`;

    const response = await anthropic.messages.create({
      model: "claude-3-7-sonnet-20250219",
      max_tokens: 1500,
      messages: [{ role: "user", content: prompt }]
    });

    return response.content[0].text;
  }
}
```

**How to adapt:**
- Change `processDocument()` to accept your data format
- Modify `generateAnswer()` prompt for your use case
- Add business logic specific to your domain

#### 3. API Route (Next.js)

```typescript
// app/api/chat/route.ts
export async function POST(request: Request) {
  const { question } = await request.json();

  // 1. Find relevant chunks
  const context = await RAGService.similaritySearch(question);

  // 2. Generate answer
  const answer = await RAGService.generateAnswer(question, context);

  return Response.json({ answer, sources: context });
}
```

### Use Cases for This Pattern

- **Customer support chatbot** - Answer questions from documentation
- **Legal document analysis** - Query contracts and agreements
- **Research assistant** - Search academic papers
- **Product catalog** - Semantic search for products
- **Knowledge base** - Company internal wiki Q&A

### Minimal Setup

```typescript
// 1. Install dependencies
npm install @langchain/openai @langchain/textsplitters drizzle-orm pg

// 2. Set up PostgreSQL with pgvector
// 3. Copy RAGService.ts
// 4. Adapt schema for your data
// 5. Create API route
// 6. Done!
```

---

## Pattern 2: AI Agents with Tools

### What You Can Reuse

**Core components:**
1. Agent creation with LangGraph
2. Tool definition pattern
3. Multi-tool orchestration

### Step-by-Step Extraction

#### 1. Define Tools

```typescript
// tools/searchTool.ts
import { tool } from "@langchain/core/tools";
import { z } from "zod";

export const createSearchTool = () => {
  return tool(
    async (input: { query: string }) => {
      // Your search logic
      const results = await yourSearchFunction(input.query);

      return JSON.stringify({
        data: { results }
      });
    },
    {
      name: "search_database",
      description: `Search your database for information.

      Use this when the user asks:
      - "Find records about X"
      - "Show me information on Y"`,

      schema: z.object({
        query: z.string().describe("The search query")
      })
    }
  );
};
```

**Tool pattern to copy:**
- Function that does the work
- JSON string response
- Clear name & description
- Zod schema for inputs

#### 2. Create Agent

```typescript
// AgentService.ts
import { ChatAnthropic } from "@langchain/anthropic";
import { createReactAgent } from "@langchain/langgraph/prebuilt";
import { MemorySaver } from "@langchain/langgraph";

export class AgentService {
  private static memory = new MemorySaver();

  static async chat(message: string, userId: string) {
    const llm = new ChatAnthropic({
      model: "claude-3-7-sonnet-20250219"
    });

    const agent = createReactAgent({
      llm,
      tools: [
        createSearchTool(),
        createCalculatorTool(),
        createDatabaseTool()
      ],
      checkpointSaver: this.memory,
      messageModifier: `You are a helpful assistant with access to tools.
                       Use the appropriate tool for each user request.`
    });

    const result = await agent.invoke(
      { messages: [{ role: "user", content: message }] },
      { configurable: { thread_id: userId } }
    );

    return result.messages.at(-1).content;
  }
}
```

#### 3. Streaming Agent

```typescript
import { Observable } from "rxjs";

export class AgentService {
  static streamChat(message: string, userId: string): Observable<string> {
    return new Observable((subscriber) => {
      (async () => {
        const llm = new ChatAnthropic({
          streaming: true,
          callbacks: [{
            handleLLMNewToken(token: string) {
              subscriber.next(token);  // Stream tokens
            }
          }]
        });

        const agent = createReactAgent({ llm, tools });

        await agent.invoke(
          { messages: [{ role: "user", content: message }] },
          {
            configurable: { thread_id: userId },
            callbacks: [{
              handleToolStart(tool, input) {
                subscriber.next(`[Using ${tool.name}...]`);
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

### Use Cases for This Pattern

- **Customer service bot** - Search FAQs, create tickets, check order status
- **Data analyst assistant** - Query databases, generate reports, visualize data
- **Personal assistant** - Check calendar, send emails, set reminders
- **E-commerce helper** - Search products, add to cart, track orders
- **DevOps assistant** - Check logs, restart services, deploy code

### Tool Ideas

**Database tools:**
```typescript
- search_users(query: string)
- create_record(data: object)
- update_record(id: number, data: object)
- delete_record(id: number)
```

**API tools:**
```typescript
- fetch_weather(location: string)
- send_email(to: string, subject: string, body: string)
- create_calendar_event(title: string, datetime: string)
```

**Action tools:**
```typescript
- run_script(scriptName: string, args: any)
- trigger_workflow(workflowId: string)
- generate_report(type: string, filters: object)
```

---

## Pattern 3: Streaming Responses

### What You Can Reuse

**Core components:**
1. Server-Sent Events (SSE) streaming
2. Observable pattern for backend
3. ReadableStream for API routes

### Step-by-Step Extraction

#### 1. Backend Streaming Service

```typescript
// StreamingService.ts
import { Observable } from "rxjs";
import Anthropic from "@anthropic-ai/sdk";

export class StreamingService {
  static streamResponse(prompt: string): Observable<string> {
    return new Observable((subscriber) => {
      (async () => {
        try {
          const anthropic = new Anthropic({
            apiKey: process.env.ANTHROPIC_API_KEY
          });

          const stream = await anthropic.messages.stream({
            model: "claude-3-7-sonnet-20250219",
            max_tokens: 2000,
            messages: [{ role: "user", content: prompt }]
          });

          for await (const chunk of stream) {
            if (chunk.type === 'content_block_delta') {
              subscriber.next(chunk.delta.text);
            }
          }

          subscriber.complete();
        } catch (error) {
          subscriber.error(error);
        }
      })();
    });
  }
}
```

#### 2. API Route with Streaming

```typescript
// app/api/stream/route.ts
import { NextRequest } from "next/server";
import { StreamingService } from "@/services/StreamingService";

export async function POST(request: NextRequest) {
  const { prompt } = await request.json();

  const encoder = new TextEncoder();
  const stream = new ReadableStream({
    start(controller) {
      StreamingService.streamResponse(prompt).subscribe({
        next: (chunk) => {
          controller.enqueue(encoder.encode(chunk));
        },
        error: (error) => {
          controller.error(error);
        },
        complete: () => {
          controller.close();
        }
      });
    }
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/plain; charset=utf-8",
      "Transfer-Encoding": "chunked"
    }
  });
}
```

#### 3. Frontend Consumption

```typescript
// Frontend component
async function streamChat(message: string) {
  const response = await fetch("/api/stream", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ prompt: message })
  });

  const reader = response.body.getReader();
  const decoder = new TextDecoder();

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;

    const text = decoder.decode(value);
    setDisplayText(prev => prev + text);  // Append to UI
  }
}
```

### Use Cases for This Pattern

- **Chatbots** - Stream responses word-by-word
- **Code generation** - Show code as it's written
- **Content creation** - Stories, articles appear gradually
- **Translation** - Translate and stream simultaneously
- **Summarization** - Summary appears in real-time

---

## Pattern 4: Vector Embeddings

### What You Can Reuse

**Core components:**
1. Base embedding service (abstract class)
2. Entity-specific embedding services
3. Vector similarity search

### Step-by-Step Extraction

#### 1. Base Service (Copy & Paste)

```typescript
// BaseEmbeddingService.ts
import { OpenAIEmbeddings } from "@langchain/openai";
import { RecursiveCharacterTextSplitter } from "@langchain/textsplitters";

export abstract class BaseEmbeddingService {
  private static embeddings = new OpenAIEmbeddings({
    modelName: "text-embedding-3-small"
  });

  protected abstract getEmbeddingsTable(): PgTable;
  protected abstract getEntityTable(): PgTable;
  protected abstract getFKColumnName(): string;

  // Chunk and embed text
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

  // Store embeddings
  async embedEntity(entityId: number, content: string) {
    const chunks = await this.chunkAndEmbed(content);

    await db.insert(this.getEmbeddingsTable()).values(
      chunks.map((chunk, index) => ({
        [this.getFKColumnName()]: entityId,
        chunkText: chunk.chunkText,
        chunkIndex: index,
        embedding: chunk.embedding
      }))
    );
  }

  // Search similar entities
  async similaritySearch(query: string, limit = 5) {
    const queryEmbedding = await BaseEmbeddingService.embeddings.embedQuery(query);
    const embeddingString = `[${queryEmbedding.join(",")}]`;

    const results = await db.execute(sql`
      SELECT e.*, MAX(1 - (emb.embedding <=> ${embeddingString}::vector)) as similarity
      FROM ${this.getEmbeddingsTable()} emb
      JOIN ${this.getEntityTable()} e ON emb.${sql.identifier(this.getFKColumnName())} = e.id
      GROUP BY e.id
      ORDER BY similarity DESC
      LIMIT ${limit}
    `);

    return results.rows;
  }
}
```

#### 2. Create Specific Services

```typescript
// ProductEmbeddingService.ts
export class ProductEmbeddingService extends BaseEmbeddingService {
  protected getEmbeddingsTable() { return productEmbeddings; }
  protected getEntityTable() { return products; }
  protected getFKColumnName() { return "productId"; }
}

// ArticleEmbeddingService.ts
export class ArticleEmbeddingService extends BaseEmbeddingService {
  protected getEmbeddingsTable() { return articleEmbeddings; }
  protected getEntityTable() { return articles; }
  protected getFKColumnName() { return "articleId"; }
}
```

#### 3. Usage

```typescript
// Embed a product
const productService = new ProductEmbeddingService();
await productService.embedEntity(productId, productDescription);

// Search similar products
const similarProducts = await productService.similaritySearch("wireless headphones");
```

### Use Cases for This Pattern

- **E-commerce** - Product similarity, recommendations
- **Content platforms** - Similar articles, related posts
- **Job boards** - Match candidates to jobs
- **Music/Video** - Content-based recommendations
- **Code search** - Find similar code snippets

---

## Pattern 5: Service Layer Architecture

### What You Can Reuse

**Core components:**
1. Layered architecture separation
2. Service abstraction
3. Clean API routes

### Architecture Layers

```
┌─────────────────────────────────┐
│  API Layer (Next.js routes)     │  ← Thin controllers
│  - Validate input                │
│  - Call services                 │
│  - Return responses              │
└────────────┬────────────────────┘
             │
┌────────────▼────────────────────┐
│  Service Layer                   │  ← Business logic
│  - RAGService                    │
│  - AgentService                  │
│  - EmbeddingServices             │
└────────────┬────────────────────┘
             │
┌────────────▼────────────────────┐
│  Data Layer (Drizzle ORM)        │  ← Database access
│  - Schema definitions            │
│  - Query builders                │
└────────────┬────────────────────┘
             │
┌────────────▼────────────────────┐
│  Database (PostgreSQL)           │
└─────────────────────────────────┘
```

### Step-by-Step Extraction

#### 1. Service Layer Template

```typescript
// services/YourService.ts
export class YourService {
  // Private helpers (not exposed)
  private static async helperMethod() {
    // ...
  }

  // Public API methods
  static async processData(input: any) {
    // 1. Validate
    if (!input) throw new Error("Invalid input");

    // 2. Business logic
    const result = await this.helperMethod();

    // 3. Database operations
    await db.insert(yourTable).values(result);

    // 4. Return
    return result;
  }

  static async searchData(query: string) {
    // Search logic
  }
}
```

#### 2. API Route Template

```typescript
// app/api/your-endpoint/route.ts
import { YourService } from "@/services/YourService";

export async function POST(request: Request) {
  try {
    // 1. Parse input
    const body = await request.json();

    // 2. Validate (optional - Zod recommended)
    const schema = z.object({
      field: z.string().min(1)
    });
    const validated = schema.parse(body);

    // 3. Call service
    const result = await YourService.processData(validated);

    // 4. Return response
    return Response.json({ success: true, data: result });

  } catch (error) {
    console.error("API error:", error);
    return Response.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}
```

#### 3. Database Schema

```typescript
// repo/schema.ts
export const yourTable = pgTable("your_table", {
  id: serial("id").primaryKey(),
  field1: text("field1").notNull(),
  field2: integer("field2"),
  createdAt: timestamp("created_at").defaultNow()
});

export const yourEmbeddings = pgTable("your_embeddings", {
  id: serial("id").primaryKey(),
  entityId: integer("entity_id").references(() => yourTable.id, {
    onDelete: "cascade"
  }),
  embedding: vector("embedding", { dimensions: 1536 })
});
```

---

## Starter Templates

### Template 1: RAG System from Scratch

```bash
# 1. Create Next.js project
npx create-next-app@latest my-rag-app
cd my-rag-app

# 2. Install dependencies
npm install @langchain/openai @langchain/anthropic @langchain/textsplitters
npm install drizzle-orm pg @anthropic-ai/sdk
npm install -D drizzle-kit

# 3. Set up PostgreSQL with pgvector
docker run -d \
  --name rag-postgres \
  -e POSTGRES_PASSWORD=postgres \
  -e POSTGRES_DB=ragdb \
  -p 5432:5432 \
  ankane/pgvector

# 4. Create .env
echo "DATABASE_URL=postgresql://postgres:postgres@localhost:5432/ragdb" > .env
echo "ANTHROPIC_API_KEY=your-key" >> .env
echo "OPENAI_API_KEY=your-key" >> .env

# 5. Copy files from this project:
# - src/services/RAGService.ts
# - src/repo/schema.ts (documents & documentChunks tables)
# - src/app/api/chat/route.ts

# 6. Run migrations
npx drizzle-kit generate
npx drizzle-kit migrate

# 7. Start dev server
npm run dev
```

### Template 2: AI Agent from Scratch

```bash
# 1-4. Same as RAG template

# 5. Copy files:
# - src/services/AgentService.ts
# - Create your own tools in src/tools/

# 6. Create agent API route:
# app/api/agent/route.ts

export async function POST(request: Request) {
  const { message, userId } = await request.json();

  const encoder = new TextEncoder();
  const stream = new ReadableStream({
    start(controller) {
      AgentService.streamChat(message, userId).subscribe({
        next: (chunk) => {
          controller.enqueue(encoder.encode(chunk));
        },
        complete: () => controller.close()
      });
    }
  });

  return new Response(stream);
}
```

### Template 3: Vector Search from Scratch

```bash
# 1-4. Same as RAG template

# 5. Copy files:
# - src/services/BaseEmbeddingService.ts
# - Create YourEmbeddingService extends BaseEmbeddingService

# 6. Schema:
export const products = pgTable("products", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  description: text("description").notNull()
});

export const productEmbeddings = pgTable("product_embeddings", {
  id: serial("id").primaryKey(),
  productId: integer("product_id").references(() => products.id),
  chunkText: text("chunk_text").notNull(),
  embedding: vector("embedding", { dimensions: 1536 })
});

# 7. Service:
class ProductEmbeddingService extends BaseEmbeddingService {
  protected getEmbeddingsTable() { return productEmbeddings; }
  protected getEntityTable() { return products; }
  protected getFKColumnName() { return "productId"; }
}

# 8. Usage:
const service = new ProductEmbeddingService();
await service.embedEntity(productId, description);
const similar = await service.similaritySearch("headphones");
```

---

## Checklist: Adding RAG to Your Project

- [ ] Install dependencies (LangChain, Anthropic, OpenAI, Drizzle)
- [ ] Set up PostgreSQL with pgvector extension
- [ ] Create database schema (entity table + embeddings table)
- [ ] Copy `BaseEmbeddingService.ts` or `RAGService.ts`
- [ ] Create your service extending base service
- [ ] Add API routes for upload & query
- [ ] Configure environment variables
- [ ] Test with sample data
- [ ] Add error handling
- [ ] Implement rate limiting
- [ ] Add frontend UI
- [ ] Deploy!

---

## Checklist: Adding AI Agents to Your Project

- [ ] Install LangGraph (`@langchain/langgraph`)
- [ ] Install Anthropic SDK (`@anthropic-ai/sdk`)
- [ ] Define your tools (using `tool()` from LangChain)
- [ ] Create `AgentService` with `createReactAgent()`
- [ ] Add system prompt describing tool usage
- [ ] Implement streaming if needed (Observable pattern)
- [ ] Create API route for agent chat
- [ ] Add conversation memory (MemorySaver)
- [ ] Test tool calling
- [ ] Add error handling for tool failures
- [ ] Deploy!

---

## Common Gotchas & Solutions

### 1. pgvector not installed

**Error:** `type "vector" does not exist`

**Solution:**
```sql
CREATE EXTENSION vector;
```

### 2. Rate limiting from OpenAI

**Error:** `Rate limit exceeded`

**Solution:**
```typescript
// Add delays
for (let i = 0; i < chunks.length; i++) {
  if (i > 0) await sleep(500);
  const embedding = await embeddings.embedQuery(chunks[i]);
}
```

### 3. Agent not using tools

**Problem:** Agent responds without calling tools

**Solution:** Improve tool descriptions
```typescript
{
  name: "search_db",
  description: `Search the database. Use this when:
  - User asks "find X"
  - User asks "show me Y"
  - User asks "search for Z"`
}
```

### 4. Context too long for LLM

**Error:** `Maximum context length exceeded`

**Solution:** Limit chunks
```typescript
const chunks = await similaritySearch(query, 3);  // Limit to 3 chunks
```

---

## Next-Level Patterns (Advanced)

### 1. Hybrid Search (Vector + Keyword)

Combine vector similarity with traditional search for better results.

```typescript
async function hybridSearch(query: string) {
  // Vector search
  const vectorResults = await vectorSearch(query);

  // Keyword search
  const keywordResults = await db
    .select()
    .from(documents)
    .where(sql`to_tsvector(content) @@ plainto_tsquery(${query})`);

  // Merge and rank
  return mergeResults(vectorResults, keywordResults);
}
```

### 2. Multi-Query RAG

Generate multiple variations of the question for better retrieval.

```typescript
async function multiQueryRAG(question: string) {
  // Generate question variations with LLM
  const variations = await llm.invoke(
    `Generate 3 variations of: "${question}"`
  );

  // Search with each variation
  const allChunks = await Promise.all(
    variations.map(q => similaritySearch(q))
  );

  // Deduplicate and rank
  const uniqueChunks = deduplicateChunks(allChunks.flat());

  // Generate answer
  return generateAnswer(question, uniqueChunks);
}
```

### 3. Re-ranking Results

Use a re-ranking model to improve retrieval quality.

```typescript
import { CohereRerank } from "@langchain/cohere";

async function rerankSearch(query: string, chunks: any[]) {
  const reranker = new CohereRerank({
    apiKey: process.env.COHERE_API_KEY
  });

  const reranked = await reranker.compressDocuments(
    chunks.map(c => ({ pageContent: c.chunk_text })),
    query
  );

  return reranked.slice(0, 5);  // Top 5 after re-ranking
}
```

---

## Summary

**What You Can Reuse:**

1. **RAG System** - Copy `RAGService.ts`, adapt schema
2. **AI Agents** - Copy `AgentService.ts`, create your tools
3. **Streaming** - Copy Observable + ReadableStream pattern
4. **Embeddings** - Copy `BaseEmbeddingService.ts`, extend it
5. **Architecture** - Follow service layer pattern

**Key Files to Copy:**
- `src/services/RAGService.ts`
- `src/services/AgentService.ts`
- `src/services/BaseEmbeddingService.ts`
- `src/repo/schema.ts` (adapt tables)

**Technologies to Use:**
- LangChain for AI orchestration
- Drizzle ORM for database
- PostgreSQL + pgvector for vectors
- Next.js for API routes
- Anthropic Claude for generation
- OpenAI for embeddings

**Time to Build:**
- Basic RAG: 2-4 hours
- AI Agent: 3-6 hours
- Full system: 1-2 days

You now have everything you need to build your own AI-powered application! 🚀

**Next Steps:**
1. Choose a pattern that fits your use case
2. Follow the starter template
3. Copy relevant files
4. Adapt to your domain
5. Deploy and iterate

Good luck with your project!
