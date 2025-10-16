# Beginner's Guide to This AI Demo Project

## What Is This Project?

This is a **Next.js web application** that demonstrates how to build AI-powered features using modern AI tools. Think of it as a playground showing 4 different AI-powered apps:

1. **Bedtime Story Writer** - AI creates custom stories for kids
2. **Email Helper** - AI writes professional emails for you
3. **RAG Chat** - Upload documents and ask questions about them
4. **Jobs Matcher** - AI matches job candidates to positions

## Key Concepts for Beginners

### What is AI/LLM?

**LLM** = Large Language Model (like ChatGPT or Claude)
- It's a computer program that can understand and generate human-like text
- You send it a question/prompt, it gives you an answer
- Examples: ChatGPT (OpenAI), Claude (Anthropic), Gemini (Google)

### What is RAG?

**RAG** = Retrieval-Augmented Generation

Imagine you have a huge textbook and want to ask questions about it:
1. **Normal AI**: The AI doesn't know what's in your textbook, so it can't answer specific questions about it
2. **RAG System**:
   - You upload your textbook
   - The system "reads" it and stores it in a smart way
   - When you ask a question, it finds relevant pages
   - It gives those pages to the AI
   - The AI answers based on YOUR textbook

**Simple analogy**:
- Without RAG: "Hey AI, what does Chapter 5 of my book say?" → AI: "I don't know your book"
- With RAG: "Hey AI, what does Chapter 5 of my book say?" → System finds Chapter 5 → AI: "According to your book, Chapter 5 says..."

### What are Vector Embeddings?

This is the "smart way" to store documents for RAG:

**Traditional search** (like Ctrl+F):
- You search for "dog" → It finds the exact word "dog"
- Misses "puppy", "canine", "pet"

**Vector embeddings** (semantic search):
- Converts text into numbers that capture meaning
- "dog" and "puppy" have similar numbers because they mean similar things
- When you search "dog", it also finds "puppy", "canine", etc.

**How it works**:
1. Text → AI converts to numbers (called a "vector" or "embedding")
2. "dog" → `[0.2, 0.8, 0.3, ...]` (1536 numbers)
3. "puppy" → `[0.21, 0.79, 0.31, ...]` (very similar numbers!)
4. Search finds text with similar numbers

### What is LangChain?

**LangChain** is a toolkit that makes it easier to build AI applications.

**Without LangChain**:
```typescript
// You have to write all this yourself
- Split documents into chunks
- Generate embeddings
- Store in database
- Search for similar chunks
- Format prompts
- Call AI API
- Handle streaming
```

**With LangChain**:
```typescript
import { RecursiveCharacterTextSplitter } from "@langchain/textsplitters";
import { OpenAIEmbeddings } from "@langchain/openai";

// LangChain handles all the complex stuff for you
const splitter = new RecursiveCharacterTextSplitter();
const chunks = await splitter.createDocuments([text]);

const embeddings = new OpenAIEmbeddings();
const vector = await embeddings.embedQuery(query);
```

LangChain provides:
- **Text splitters** - Split documents smartly
- **Embeddings** - Easy vector creation
- **Agents** - AI that can use tools
- **Chains** - Connect multiple AI steps
- **Memory** - Make AI remember conversation

## Tech Stack Explained

### Frontend (What Users See)

**Next.js 15** - A framework for building websites with React
- Think of it as a super-powered React that can also run code on the server
- **App Router** - New way to organize pages (files = pages)
- **Server Components** - Pages that load data on the server (faster, more secure)
- **Client Components** - Interactive parts (buttons, forms)

**React** - Library for building user interfaces
- Everything is a "component" (reusable piece of UI)
- Example: Button component, Form component, Card component

**TypeScript** - JavaScript with types
- Helps catch bugs before running code
- Instead of `let name` → `let name: string` (must be text)

**Tailwind CSS** - Styling approach
- Instead of writing CSS files, you add classes to HTML
- `<div class="bg-blue-500 text-white p-4">` = blue background, white text, padding

### Backend (Behind the Scenes)

**PostgreSQL** - Database (where we store data)
- Like Excel sheets but for servers
- Tables: stories, emails, documents, job_applications, etc.

**pgvector** - PostgreSQL extension for vector embeddings
- Allows storing those number arrays (embeddings) in the database
- Can search for similar vectors super fast

**Drizzle ORM** - Tool to talk to database using TypeScript
```typescript
// Instead of writing SQL:
SELECT * FROM stories WHERE id = 1;

// You write TypeScript:
await db.select().from(stories).where(eq(stories.id, 1));
```

### AI Services (The Smart Parts)

**Anthropic Claude** - The main AI we use
- Similar to ChatGPT but made by Anthropic
- Models: Claude 3.5 Sonnet (smart), Claude 3.5 Haiku (fast)
- We use it via API (send request over internet, get response)

**OpenAI API** - For embeddings
- Converts text → vectors
- Model: `text-embedding-3-small` (creates 1536-number vectors)

**LangChain** - Glue that connects everything
- Helps with chunking, embeddings, agents, memory
- Makes complex AI workflows easier

## How The Project Works

### Architecture Overview

```
┌─────────────────────────────────────────────────┐
│  USER'S BROWSER (Frontend)                      │
│  - Next.js pages (React)                        │
│  - Forms, buttons, displays                     │
└─────────────────┬───────────────────────────────┘
                  │ HTTP Request
                  ▼
┌─────────────────────────────────────────────────┐
│  NEXT.JS SERVER (Backend)                       │
│  - API Routes (endpoints)                       │
│  - Server Actions                               │
└─────────────────┬───────────────────────────────┘
                  │
                  ▼
┌─────────────────────────────────────────────────┐
│  SERVICE LAYER (Business Logic)                 │
│  - RAGService: Document Q&A                     │
│  - AgentService: AI with tools                  │
│  - EmbeddingServices: Create vectors            │
└─────┬──────────────────────────┬────────────────┘
      │                          │
      ▼                          ▼
┌─────────────┐          ┌───────────────────────┐
│  AI APIs    │          │  DATABASE             │
│  - Claude   │          │  - PostgreSQL         │
│  - OpenAI   │          │  - pgvector           │
└─────────────┘          └───────────────────────┘
```

### Example Flow: RAG Chat

Let's trace what happens when you upload a PDF and ask a question:

#### Step 1: Upload PDF

**User**: Clicks "Upload PDF" button, selects file
```
Browser → POST /api/rag-chat/upload
```

**Server** (src/services/RAGService.ts):
```typescript
// 1. Save file to disk
await fs.writeFile("uploads/document.pdf", fileData);

// 2. Extract text from PDF
const text = await extractPDFText(filePath); // Uses pdf-parse library

// 3. Split into chunks (using LangChain)
const splitter = new RecursiveCharacterTextSplitter({
  chunkSize: 1000,      // ~1000 characters per chunk
  chunkOverlap: 200     // Chunks overlap by 200 chars for context
});
const chunks = await splitter.createDocuments([text]);
// Result: ["chunk 1 text...", "chunk 2 text...", ...]

// 4. Convert each chunk to embedding (vector)
for (const chunk of chunks) {
  const embedding = await embeddings.embedQuery(chunk);
  // embedding = [0.123, 0.456, ...] (1536 numbers)

  // 5. Store in database
  await db.insert(documentChunks).values({
    documentId: doc.id,
    chunkText: chunk,
    embedding: embedding
  });
}
```

**Database after upload**:
```
documents table:
| id | filename      | content              |
|----|---------------|----------------------|
| 1  | resume.pdf    | "John Doe... (full)" |

document_chunks table:
| id | document_id | chunk_text        | embedding           |
|----|-------------|-------------------|---------------------|
| 1  | 1           | "John Doe has..." | [0.12, 0.45, ...]  |
| 2  | 1           | "Experience: ..." | [0.34, 0.78, ...]  |
| 3  | 1           | "Skills: Pytho..." | [0.56, 0.23, ...]  |
```

#### Step 2: Ask Question

**User**: Types "What are John's Python skills?"
```
Browser → POST /api/rag-chat/query { question: "What are John's Python skills?" }
```

**Server**:
```typescript
// 1. Convert question to embedding
const questionEmbedding = await embeddings.embedQuery(
  "What are John's Python skills?"
);
// questionEmbedding = [0.54, 0.21, ...] (1536 numbers)

// 2. Find similar chunks using vector search (pgvector)
const results = await db.execute(sql`
  SELECT chunk_text
  FROM document_chunks
  ORDER BY embedding <=> ${questionEmbedding}  -- <=> is "distance operator"
  LIMIT 5
`);
// Returns chunks with vectors closest to question vector
// Likely returns chunk 3: "Skills: Python, JavaScript..."

// 3. Build context from retrieved chunks
const context = results.map(r => r.chunk_text).join("\n");

// 4. Ask Claude AI with context
const prompt = `
Context from document:
${context}

Question: What are John's Python skills?

Answer based only on the context above.
`;

const answer = await claude.messages.create({
  model: "claude-3-7-sonnet-20250219",
  messages: [{ role: "user", content: prompt }]
});
// Claude: "According to the document, John has 5 years of Python experience..."

// 5. Stream answer back to user
return streamResponse(answer);
```

**User sees**: Answer appears word-by-word in real-time

### Example Flow: Agent with Tools (Jobs Feature)

This is more advanced - the AI can use "tools" to search databases and take actions.

**User**: "Find Python developers"

**Server** (src/services/AgentService.ts):
```typescript
// 1. Create AI agent with tools
const agent = createReactAgent({
  llm: new ChatAnthropic({ model: "claude-3-7-sonnet" }),
  tools: [
    searchDocumentsTool,      // Search PDFs
    searchStoriesTool,        // Search stories
    searchApplicationsTool,   // Search job applications ← Will use this one!
    searchPositionsTool,      // Search job openings
    closePositionTool         // Close a job with a candidate
  ]
});

// 2. Agent thinks: "User wants to search applications, I'll use searchApplicationsTool"
const result = await searchApplicationsTool.invoke({
  query: "Python developers"
});

// 3. Tool searches using vector similarity
const appEmbedding = await embeddings.embedQuery("Python developers");
const matches = await db.execute(sql`
  SELECT applications.*,
         1 - (embeddings.embedding <=> ${appEmbedding}) as similarity
  FROM application_embeddings embeddings
  JOIN applications ON embeddings.application_id = applications.id
  ORDER BY similarity DESC
  LIMIT 5
`);

// 4. Tool returns results to agent
return {
  candidates: [
    { name: "Alice", skills: "Python, Django, 5 years" },
    { name: "Bob", skills: "Python, Flask, 3 years" }
  ]
};

// 5. Agent formulates natural response
// "I found 2 Python developers: Alice (5 years, Django) and Bob (3 years, Flask)"
```

## Project Structure Walkthrough

```
ai-preza-demos/
├── src/
│   ├── app/                       # Next.js App Router (Pages)
│   │   ├── (ragChat)/             # RAG feature
│   │   │   ├── rag-chat/
│   │   │   │   └── page.tsx       # Chat UI page
│   │   │   └── rag-documents/
│   │   │       └── page.tsx       # Document upload page
│   │   ├── api/                   # API endpoints
│   │   │   └── rag-chat/
│   │   │       └── stream-chat/
│   │   │           └── route.ts   # POST /api/rag-chat/stream-chat
│   │   └── page.tsx               # Home page (dashboard)
│   │
│   ├── services/                  # Business logic
│   │   ├── RAGService.ts          # RAG functionality
│   │   ├── AgentService.ts        # AI agents with tools
│   │   └── BaseEmbeddingService.ts # Reusable embedding code
│   │
│   ├── lib/                       # Utilities
│   │   ├── db.ts                  # Database connection
│   │   └── pdfParser.server.ts   # PDF text extraction
│   │
│   ├── repo/                      # Database
│   │   └── schema.ts              # Table definitions (Drizzle)
│   │
│   └── components/                # Reusable UI pieces
│       └── ui/                    # Buttons, forms, etc.
│
├── uploads/                       # Uploaded files stored here
├── docker-compose.yml             # PostgreSQL setup
├── package.json                   # Dependencies
└── .env                           # API keys (keep secret!)
```

### Key Files Explained

**src/services/RAGService.ts**
- Main RAG logic
- Functions: `processDocument()`, `similaritySearch()`, `generateAnswer()`
- Uses LangChain for chunking and embeddings

**src/services/AgentService.ts**
- AI agents that can use tools
- Uses LangGraph to create agent workflows
- Tools: search documents, search applications, close jobs

**src/app/api/rag-chat/stream-chat/route.ts**
- API endpoint for chat
- Handles streaming responses
- Receives user question, returns AI answer in real-time

**src/repo/schema.ts**
- Database table definitions
- Uses Drizzle ORM
- Defines: documents, documentChunks, chatHistory, etc.

## How to Add a New Feature (Beginner Recipe)

Let's say you want to add a "Recipe Generator" feature:

### Step 1: Add Database Tables

Edit `src/repo/schema.ts`:
```typescript
export const recipes = pgTable("recipes", {
  id: serial("id").primaryKey(),
  ingredients: text("ingredients").array(),
  dietaryRestrictions: text("dietary_restrictions").array(),
  generatedRecipe: text("generated_recipe"),
  createdAt: timestamp("created_at").defaultNow(),
});

export const recipeEmbeddings = pgTable("recipe_embeddings", {
  id: serial("id").primaryKey(),
  recipeId: integer("recipe_id").references(() => recipes.id),
  chunkText: text("chunk_text").notNull(),
  embedding: vector("embedding", { dimensions: 1536 }),
});
```

### Step 2: Create Service

Create `src/services/RecipeService.ts`:
```typescript
import { ChatAnthropic } from "@langchain/anthropic";

export class RecipeService {
  static async generateRecipe(ingredients: string[], diet: string[]) {
    const llm = new ChatAnthropic({
      model: "claude-3-5-sonnet-20241022"
    });

    const prompt = `
      Create a recipe using: ${ingredients.join(", ")}
      Dietary restrictions: ${diet.join(", ")}
    `;

    const result = await llm.invoke(prompt);
    return result.content;
  }
}
```

### Step 3: Create API Route

Create `src/app/api/recipe/generate/route.ts`:
```typescript
import { RecipeService } from "@/services/RecipeService";

export async function POST(request: Request) {
  const { ingredients, diet } = await request.json();
  const recipe = await RecipeService.generateRecipe(ingredients, diet);
  return Response.json({ recipe });
}
```

### Step 4: Create Page

Create `src/app/(recipes)/recipe-generator/page.tsx`:
```typescript
'use client';
import { useState } from 'react';

export default function RecipeGenerator() {
  const [recipe, setRecipe] = useState('');

  const generateRecipe = async () => {
    const response = await fetch('/api/recipe/generate', {
      method: 'POST',
      body: JSON.stringify({
        ingredients: ['chicken', 'rice'],
        diet: ['gluten-free']
      })
    });
    const data = await response.json();
    setRecipe(data.recipe);
  };

  return (
    <div>
      <button onClick={generateRecipe}>Generate Recipe</button>
      <p>{recipe}</p>
    </div>
  );
}
```

Done! You now have a recipe generator feature.

## Common Questions

### Q: Do I need to know AI/ML to use this?
**A**: No! You just need to know how to call APIs. The AI services (Claude, OpenAI) do all the AI work. You just send them text and they send back results.

### Q: What's the difference between Claude and ChatGPT?
**A**: Both are LLMs (AI text generators). Claude is made by Anthropic, ChatGPT by OpenAI. They work similarly - you can swap them. This project uses Claude.

### Q: Why use embeddings instead of regular search?
**A**: Regular search only finds exact words. Embeddings understand meaning:
- Search "happy" → Finds "happy"
- Embedding search "happy" → Finds "happy", "joyful", "delighted", "cheerful"

### Q: What is the difference between sync and streaming?
**A**:
- **Sync**: Wait for complete answer, then show it (slower UX)
- **Streaming**: Show answer as it's generated word-by-word (better UX, like ChatGPT)

### Q: How much does this cost to run?
**A**:
- **Database**: Free (local PostgreSQL)
- **Next.js hosting**: Free on Vercel
- **AI API calls**: Pay per use
  - Claude: ~$3 per million tokens (~750k words)
  - OpenAI embeddings: ~$0.02 per million tokens

### Q: Can I use this in production?
**A**: This is a demo. For production you'd need:
- User authentication
- Rate limiting
- Error handling improvements
- Security hardening
- Monitoring and logging
- Scalable infrastructure

## Next Steps

1. **Read**: `docs/RAG_EXPLAINED.md` - Deep dive into RAG architecture
2. **Read**: `docs/LANGCHAIN_GUIDE.md` - How LangChain tools work
3. **Read**: `docs/AI_INTEGRATION.md` - Integrating Claude/OpenAI APIs
4. **Read**: `docs/REUSABLE_PATTERNS.md` - Extract patterns for your project
5. **Try**: Run the project locally and experiment with the code

## Glossary

- **LLM** - Large Language Model (AI that understands/generates text)
- **RAG** - Retrieval-Augmented Generation (AI + your documents)
- **Vector** - Array of numbers representing text meaning
- **Embedding** - Converting text to vector
- **Chunk** - Small piece of a document (~1000 characters)
- **Semantic search** - Search by meaning, not exact words
- **pgvector** - PostgreSQL extension for vector storage/search
- **LangChain** - Toolkit for building AI applications
- **Agent** - AI that can use tools to accomplish tasks
- **Tool** - Function an agent can call (search, calculate, etc.)
- **Streaming** - Sending response piece-by-piece as it's generated
- **ORM** - Object-Relational Mapping (use TypeScript instead of SQL)
- **API Route** - Server endpoint (URL that accepts requests)
- **Server Component** - React component that runs on server
- **Client Component** - React component that runs in browser

---

**Remember**: AI development is just about:
1. Getting data (documents, questions)
2. Preparing it (chunking, embeddings)
3. Storing it (database)
4. Retrieving relevant pieces (vector search)
5. Sending to AI (API call)
6. Displaying results (UI)

You don't need a PhD in AI - you just need to know how to glue these pieces together! 🚀
