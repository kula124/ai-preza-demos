# AI Integration Guide: Claude & OpenAI APIs

## Overview

This project uses two AI services:
- **Anthropic Claude** - Text generation (chat, stories, emails, Q&A)
- **OpenAI** - Text embeddings (vector generation for RAG)

## Why Two Different Services?

**Claude (Anthropic)** - Best for:
- ✅ Long context (200k tokens)
- ✅ Accurate reasoning
- ✅ Following instructions precisely
- ✅ Safer outputs

**OpenAI** - Best for:
- ✅ Embeddings (text-embedding-3-small)
- ✅ Cost-effective vectors
- ✅ Fast embedding generation

**Strategy**: Use OpenAI for embeddings, Claude for generation

## Anthropic Claude Integration

### 1. Setup

**Install SDK:**
```bash
npm install @anthropic-ai/sdk
```

**Get API Key:**
1. Visit https://console.anthropic.com/
2. Create account
3. Go to API Keys
4. Create new key: `sk-ant-api03-...`
5. Add to `.env`: `ANTHROPIC_API_KEY=sk-ant-api03-...`

### 2. Basic Usage (Direct SDK)

```typescript
import Anthropic from "@anthropic-ai/sdk";

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

const message = await anthropic.messages.create({
  model: "claude-3-7-sonnet-20250219",
  max_tokens: 1024,
  messages: [
    { role: "user", content: "What is the capital of France?" }
  ],
});

console.log(message.content[0].text);
// Output: "The capital of France is Paris."
```

### 3. Available Models

**Model Selection:**

| Model | Use Case | Speed | Intelligence | Cost |
|-------|----------|-------|--------------|------|
| **claude-3-5-haiku** | Quick tasks, emails | ⚡⚡⚡ Fast | ⭐⭐ Good | $ Cheap |
| **claude-3-5-sonnet** | Balanced | ⚡⚡ Medium | ⭐⭐⭐ Great | $$ Medium |
| **claude-3-7-sonnet** | Complex reasoning | ⚡ Slower | ⭐⭐⭐⭐ Excellent | $$$ Premium |

**Used in this project:**
```typescript
// Email Helper - Fast, simple
model: "claude-3-5-haiku-20241022"

// RAG Chat, Agents - Complex reasoning
model: "claude-3-7-sonnet-20250219"

// Bedtime Stories - Creative
model: "claude-3-5-sonnet-20241022"
```

### 4. Streaming Responses

**Why stream?** Better UX - users see words appear in real-time (like ChatGPT)

```typescript
const stream = await anthropic.messages.stream({
  model: "claude-3-7-sonnet-20250219",
  max_tokens: 1024,
  messages: [
    { role: "user", content: "Write a short poem" }
  ],
});

// Method 1: For-await loop
for await (const chunk of stream) {
  if (chunk.type === 'content_block_delta' && chunk.delta.type === 'text_delta') {
    process.stdout.write(chunk.delta.text);  // Print each word
  }
}

// Output appears gradually:
// "Roses" → "are" → "red" → "," → "violets" → "are" → "blue"
```

### 5. System Prompts (Best Practice)

**What are system prompts?** Instructions that guide the AI's behavior.

**Bad approach:**
```typescript
messages: [
  {
    role: "user",
    content: "You are a helpful assistant. Answer this: What is AI?"
  }
]
```

**Good approach:**
```typescript
const message = await anthropic.messages.create({
  model: "claude-3-7-sonnet",
  max_tokens: 1024,
  system: "You are a helpful AI assistant. Be concise and accurate.",  // ← System prompt
  messages: [
    { role: "user", content: "What is AI?" }
  ]
});
```

**Why?** System prompts:
- Set personality/tone
- Don't count against message tokens
- More consistent behavior

### 6. Streaming in Next.js API Routes

**File**: `src/app/api/rag-chat/stream-chat/route.ts`

```typescript
import { NextRequest } from "next/server";
import Anthropic from "@anthropic-ai/sdk";

export async function POST(request: NextRequest) {
  const { question } = await request.json();

  const anthropic = new Anthropic({
    apiKey: process.env.ANTHROPIC_API_KEY
  });

  const stream = await anthropic.messages.stream({
    model: "claude-3-7-sonnet-20250219",
    max_tokens: 1500,
    messages: [{ role: "user", content: question }]
  });

  // Convert Anthropic stream to Web ReadableStream
  const encoder = new TextEncoder();
  const readableStream = new ReadableStream({
    async start(controller) {
      for await (const chunk of stream) {
        if (chunk.type === 'content_block_delta') {
          const text = chunk.delta.text;
          controller.enqueue(encoder.encode(text));
        }
      }
      controller.close();
    }
  });

  return new Response(readableStream, {
    headers: {
      "Content-Type": "text/plain; charset=utf-8",
      "Transfer-Encoding": "chunked",
    }
  });
}
```

**Frontend consumption:**
```typescript
const response = await fetch("/api/rag-chat/stream-chat", {
  method: "POST",
  body: JSON.stringify({ question: "What is AI?" })
});

const reader = response.body.getReader();
const decoder = new TextDecoder();

while (true) {
  const { done, value } = await reader.read();
  if (done) break;

  const text = decoder.decode(value);
  setAnswer(prev => prev + text);  // Append to UI
}
```

### 7. Multi-Message Conversations

```typescript
const messages = [
  { role: "user", content: "What's the capital of France?" },
  { role: "assistant", content: "The capital of France is Paris." },
  { role: "user", content: "What's the population?" }
];

const response = await anthropic.messages.create({
  model: "claude-3-7-sonnet",
  max_tokens: 1024,
  messages: messages
});

// Claude knows context from previous messages!
// Response: "Paris has a population of approximately 2.1 million..."
```

### 8. Error Handling

```typescript
try {
  const message = await anthropic.messages.create({
    model: "claude-3-7-sonnet",
    max_tokens: 1024,
    messages: [{ role: "user", content: question }]
  });

  return message.content[0].text;

} catch (error) {
  if (error instanceof Anthropic.APIError) {
    console.error("Status:", error.status);
    console.error("Message:", error.message);

    if (error.status === 429) {
      // Rate limit exceeded
      throw new Error("Too many requests. Please try again later.");
    }

    if (error.status === 401) {
      // Invalid API key
      throw new Error("Invalid API key. Check ANTHROPIC_API_KEY.");
    }
  }

  throw error;
}
```

### 9. Claude with LangChain

**File**: `src/services/AgentService.ts`

```typescript
import { ChatAnthropic } from "@langchain/anthropic";

const llm = new ChatAnthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
  model: "claude-3-7-sonnet-20250219",
  temperature: 0.7,  // 0 = deterministic, 1 = creative
  maxTokens: 2000,
  streaming: true,
  callbacks: [{
    handleLLMNewToken(token: string) {
      console.log(token);  // Each word
    }
  }]
});

const response = await llm.invoke("Write a poem");
```

**Benefits of LangChain wrapper:**
- Unified interface (swap models easily)
- Built-in streaming callbacks
- Integration with agents and tools
- Automatic retry logic

## OpenAI Integration

### 1. Setup

**Install SDK:**
```bash
npm install openai
```

**Get API Key:**
1. Visit https://platform.openai.com/api-keys
2. Create new secret key: `sk-...`
3. Add to `.env`: `OPENAI_API_KEY=sk-...`

### 2. Text Embeddings (Core Use)

**What are embeddings?** Numerical representations of text meaning.

```typescript
import OpenAI from "openai";

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
});

const response = await openai.embeddings.create({
  model: "text-embedding-3-small",
  input: "Hello world",
});

const embedding = response.data[0].embedding;
// embedding = [0.123, -0.456, 0.789, ..., 0.321]  (1536 numbers)
```

### 3. Embedding Models

| Model | Dimensions | Cost | Use Case |
|-------|------------|------|----------|
| text-embedding-3-small | 1536 | $0.02/1M tokens | ✅ **Used in project** - Good balance |
| text-embedding-3-large | 3072 | $0.13/1M tokens | Higher accuracy, slower |
| text-embedding-ada-002 | 1536 | $0.10/1M tokens | Legacy model |

**Why text-embedding-3-small?**
- Cost-effective ($0.02 vs $0.13 per million)
- Fast (< 100ms per embedding)
- Good quality for RAG
- 1536 dimensions = enough for semantic search

### 4. OpenAI with LangChain

**File**: `src/services/RAGService.ts`, `src/services/BaseEmbeddingService.ts`

```typescript
import { OpenAIEmbeddings } from "@langchain/openai";

const embeddings = new OpenAIEmbeddings({
  apiKey: process.env.OPENAI_API_KEY,
  modelName: "text-embedding-3-small",
  batchSize: 512,  // How many texts to embed at once
});

// Single embedding
const vector = await embeddings.embedQuery("What is AI?");

// Batch embeddings
const vectors = await embeddings.embedDocuments([
  "First document",
  "Second document",
  "Third document"
]);
```

**Why use LangChain wrapper?**
- Automatic batching
- Built-in retry logic
- Easy to swap providers (OpenAI → Cohere → Voyage)

### 5. Rate Limiting & Optimization

**Problem**: OpenAI limits requests per minute

**Solution 1: Add delays**
```typescript
for (let i = 0; i < chunks.length; i++) {
  if (i > 0) {
    await new Promise(resolve => setTimeout(resolve, 500));  // 500ms delay
  }

  const embedding = await embeddings.embedQuery(chunks[i]);
  await db.insert(documentChunks).values({ embedding });
}
```

**Solution 2: Exponential backoff**
```typescript
async function embedWithRetry(text: string, retries = 3) {
  let delay = 500;

  for (let i = 0; i < retries; i++) {
    try {
      return await embeddings.embedQuery(text);
    } catch (error) {
      if (i === retries - 1) throw error;

      console.log(`Retry ${i + 1}/${retries} after ${delay}ms`);
      await sleep(delay);
      delay *= 2;  // 500ms → 1000ms → 2000ms
    }
  }
}
```

**Solution 3: Batch processing**
```typescript
// Instead of embedding one by one
const vectors = await Promise.all(
  chunks.map(chunk => embeddings.embedQuery(chunk))
);

// Embed in batches
const batchSize = 10;
for (let i = 0; i < chunks.length; i += batchSize) {
  const batch = chunks.slice(i, i + batchSize);
  const vectors = await embeddings.embedDocuments(batch);
  await db.insert(documentChunks).values(vectors.map((v, idx) => ({
    embedding: v,
    chunkText: batch[idx]
  })));
}
```

## Cost Estimation

### Anthropic Claude Costs

**Pricing (Claude 3.7 Sonnet):**
- Input: $3 per million tokens
- Output: $15 per million tokens

**Example: RAG Chat**
```
User question: "What is the remote work policy?" (10 tokens)
Context (3 chunks): 1500 tokens
Prompt total: ~1510 tokens
Response: 200 tokens

Cost per query:
  Input:  1510 tokens × $3/1M = $0.00453
  Output: 200 tokens × $15/1M = $0.003
  Total: $0.00753 per query

100 queries/day = $0.753/day = ~$23/month
```

**Example: Bedtime Story**
```
Story prompt: 500 tokens
Generated story: 2000 tokens

Cost per story:
  Input:  500 × $3/1M = $0.0015
  Output: 2000 × $15/1M = $0.03
  Total: $0.0315 per story

10 stories/day = $0.315/day = ~$9.50/month
```

### OpenAI Embeddings Costs

**Pricing:**
- text-embedding-3-small: $0.02 per million tokens

**Example: Document Upload**
```
PDF: 50 pages = ~25,000 words = ~33,000 tokens
After chunking: 30 chunks

Cost: 33,000 × $0.02/1M = $0.00066 per document

100 documents = $0.066 total
```

**Example: Search Query**
```
Query: "Find Python developers" = ~5 tokens

Cost: 5 × $0.02/1M = $0.0000001 (essentially free)
```

### Total Estimated Costs

**Typical usage (100 users/day):**
- RAG queries: 500 queries × $0.0075 = $3.75/day
- Bedtime stories: 50 stories × $0.0315 = $1.58/day
- Embeddings: 20 documents × $0.00066 = $0.013/day
- **Total: ~$5.35/day = ~$160/month**

**Note**: Add 20% buffer for retries, errors = **~$192/month**

## Environment Variables

### Required Configuration

```bash
# .env file

# Anthropic API (Required for all AI features)
ANTHROPIC_API_KEY=sk-ant-api03-xxxxxxxxxxxxxxxxxxxxxxxxxxxxx

# OpenAI API (Required for embeddings/RAG)
OPENAI_API_KEY=sk-xxxxxxxxxxxxxxxxxxxxxxxxxxxxx

# Optional: Use Anthropic for embeddings instead
# ANTHROPIC_EMBEDDINGS=true
```

### Checking API Keys

```typescript
// lib/check-env.ts

export function checkEnvVars() {
  if (!process.env.ANTHROPIC_API_KEY) {
    throw new Error("ANTHROPIC_API_KEY is not set in .env");
  }

  if (!process.env.OPENAI_API_KEY) {
    console.warn("OPENAI_API_KEY is not set. RAG features will not work.");
  }

  console.log("✅ API keys configured");
}
```

## API Integration Patterns

### Pattern 1: Service Layer Abstraction

**Good**: Business logic in services, not controllers

```typescript
// ❌ Bad - API route with logic
export async function POST(request: Request) {
  const { question } = await request.json();

  const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
  const message = await anthropic.messages.create({
    model: "claude-3-7-sonnet",
    messages: [{ role: "user", content: question }]
  });

  return Response.json({ answer: message.content[0].text });
}

// ✅ Good - Service handles logic
// API route
export async function POST(request: Request) {
  const { question } = await request.json();
  const answer = await RAGService.generateAnswer(question);
  return Response.json({ answer });
}

// Service
export class RAGService {
  static async generateAnswer(question: string) {
    const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
    // ... logic here
  }
}
```

### Pattern 2: Streaming with Observables

**Used for**: Real-time updates (agent tool calls + LLM responses)

```typescript
import { Observable } from "rxjs";

export class AgentService {
  static streamChat(message: string): Observable<string | ToolData> {
    return new Observable((subscriber) => {
      (async () => {
        const stream = await anthropic.messages.stream({
          model: "claude-3-7-sonnet",
          messages: [{ role: "user", content: message }]
        });

        for await (const chunk of stream) {
          if (chunk.type === 'content_block_delta') {
            subscriber.next(chunk.delta.text);  // Emit text
          }
        }

        subscriber.complete();
      })();
    });
  }
}
```

**API route consumes Observable:**
```typescript
export async function POST(request: Request) {
  const { message } = await request.json();

  const encoder = new TextEncoder();
  const stream = new ReadableStream({
    start(controller) {
      AgentService.streamChat(message).subscribe({
        next: (chunk) => {
          if (typeof chunk === "string") {
            controller.enqueue(encoder.encode(chunk));
          }
        },
        complete: () => controller.close()
      });
    }
  });

  return new Response(stream);
}
```

### Pattern 3: Error Boundaries

```typescript
export class RAGService {
  static async generateAnswer(question: string, context: any[]) {
    try {
      const anthropic = new Anthropic({
        apiKey: process.env.ANTHROPIC_API_KEY
      });

      const response = await anthropic.messages.create({
        model: "claude-3-7-sonnet",
        max_tokens: 1500,
        messages: [{ role: "user", content: buildPrompt(question, context) }]
      });

      return response.content[0].text;

    } catch (error) {
      // Log for debugging
      console.error("Error generating answer:", error);

      // User-friendly error
      if (error instanceof Anthropic.APIError) {
        if (error.status === 429) {
          throw new Error("AI service is busy. Please try again in a moment.");
        }

        if (error.status === 500) {
          throw new Error("AI service error. Please try again.");
        }
      }

      throw new Error("Failed to generate answer. Please try again.");
    }
  }
}
```

## Switching Between Providers

### Swapping Embedding Providers

**Current: OpenAI**
```typescript
import { OpenAIEmbeddings } from "@langchain/openai";

const embeddings = new OpenAIEmbeddings({
  modelName: "text-embedding-3-small"
});
```

**Alternative: Voyage AI**
```typescript
import { VoyageEmbeddings } from "@langchain/community/embeddings/voyage";

const embeddings = new VoyageEmbeddings({
  apiKey: process.env.VOYAGE_API_KEY,
  modelName: "voyage-2"
});
```

**Alternative: Cohere**
```typescript
import { CohereEmbeddings } from "@langchain/cohere";

const embeddings = new CohereEmbeddings({
  apiKey: process.env.COHERE_API_KEY,
  model: "embed-english-v3.0"
});
```

**LangChain makes swapping easy!** Just change the import and API key.

### Swapping LLM Providers

**Current: Claude**
```typescript
import { ChatAnthropic } from "@langchain/anthropic";

const llm = new ChatAnthropic({
  model: "claude-3-7-sonnet"
});
```

**Alternative: OpenAI**
```typescript
import { ChatOpenAI } from "@langchain/openai";

const llm = new ChatOpenAI({
  model: "gpt-4-turbo"
});
```

**Alternative: Ollama (local)**
```typescript
import { ChatOllama } from "@langchain/community/chat_models/ollama";

const llm = new ChatOllama({
  model: "llama3",
  baseUrl: "http://localhost:11434"
});
```

**Agents work with any LLM:**
```typescript
const agent = createReactAgent({
  llm: llm,  // Works with Claude, GPT-4, Llama, etc.
  tools: tools
});
```

## Best Practices

### 1. API Key Security

✅ **Do:**
- Store in `.env` file
- Add `.env` to `.gitignore`
- Use environment variables in production
- Rotate keys regularly

❌ **Don't:**
- Hardcode in source code
- Commit to Git
- Share in logs
- Expose in client-side code

### 2. Prompt Engineering

✅ **Do:**
- Use system prompts for behavior
- Be specific and clear
- Provide examples when needed
- Test different phrasings

**Example:**
```typescript
// ❌ Vague
"Write a story"

// ✅ Specific
const system = "You are a children's story writer. Create age-appropriate stories with positive messages.";
const user = "Write a 500-word story for a 6-year-old about a brave rabbit. Include themes of friendship and courage.";
```

### 3. Rate Limiting

✅ **Do:**
- Add delays between requests
- Implement exponential backoff
- Batch operations when possible
- Cache results

```typescript
// Rate limiter
class RateLimiter {
  private queue: Promise<any> = Promise.resolve();
  private delay = 500;

  async execute<T>(fn: () => Promise<T>): Promise<T> {
    const result = this.queue.then(() => fn());
    this.queue = result.then(() => sleep(this.delay));
    return result;
  }
}

const limiter = new RateLimiter();
const embedding = await limiter.execute(() =>
  embeddings.embedQuery(text)
);
```

### 4. Error Handling

✅ **Do:**
- Catch and log errors
- Provide user-friendly messages
- Implement retry logic
- Monitor error rates

```typescript
async function callAI(prompt: string, retries = 3): Promise<string> {
  for (let i = 0; i < retries; i++) {
    try {
      const response = await anthropic.messages.create({
        model: "claude-3-7-sonnet",
        messages: [{ role: "user", content: prompt }]
      });
      return response.content[0].text;

    } catch (error) {
      if (i === retries - 1) throw error;

      console.log(`Retry ${i + 1}/${retries}`);
      await sleep(1000 * Math.pow(2, i));  // Exponential backoff
    }
  }

  throw new Error("Failed after retries");
}
```

### 5. Token Management

✅ **Do:**
- Estimate tokens before calling
- Set appropriate max_tokens
- Monitor token usage
- Truncate long inputs

```typescript
function estimateTokens(text: string): number {
  // Rough estimate: 1 token ≈ 4 characters
  return Math.ceil(text.length / 4);
}

async function generateWithLimit(prompt: string) {
  const tokens = estimateTokens(prompt);

  if (tokens > 100000) {
    throw new Error("Input too long. Please shorten your text.");
  }

  const maxTokens = Math.min(4000, 200000 - tokens);  // Leave room for response

  return await anthropic.messages.create({
    model: "claude-3-7-sonnet",
    max_tokens: maxTokens,
    messages: [{ role: "user", content: prompt }]
  });
}
```

## Testing AI Integrations

### Mock API Calls

```typescript
// __tests__/services/RAGService.test.ts

import { vi, describe, it, expect } from "vitest";
import { RAGService } from "@/services/RAGService";

vi.mock("@anthropic-ai/sdk", () => ({
  default: vi.fn().mockImplementation(() => ({
    messages: {
      create: vi.fn().mockResolvedValue({
        content: [{ type: "text", text: "Mocked response" }]
      })
    }
  }))
}));

describe("RAGService", () => {
  it("should generate answer", async () => {
    const answer = await RAGService.generateAnswer("test", []);
    expect(answer).toBe("Mocked response");
  });
});
```

### Integration Tests

```typescript
describe("Claude API Integration", () => {
  it("should call Claude API", async () => {
    const anthropic = new Anthropic({
      apiKey: process.env.ANTHROPIC_API_KEY
    });

    const response = await anthropic.messages.create({
      model: "claude-3-5-haiku",  // Use cheapest model for tests
      max_tokens: 50,
      messages: [{ role: "user", content: "Say 'test'" }]
    });

    expect(response.content[0].text).toContain("test");
  });
});
```

## Summary

**Anthropic Claude:**
- Text generation (chat, stories, emails)
- Multiple models (Haiku, Sonnet, Opus)
- Streaming for real-time UX
- Direct SDK + LangChain wrapper

**OpenAI:**
- Text embeddings for RAG
- text-embedding-3-small (1536d)
- Cost-effective ($0.02/1M)
- LangChain integration

**Key Files:**
- `src/services/RAGService.ts` - OpenAI embeddings, Claude generation
- `src/services/AgentService.ts` - Claude with LangChain
- `src/app/api/rag-chat/stream-chat/route.ts` - Streaming example

**Cost:** ~$160-200/month for moderate usage (100 users/day)

**Next Steps:**
- Read `docs/REUSABLE_PATTERNS.md` - Extract for your project

You now understand how to integrate Claude and OpenAI APIs! 🚀
