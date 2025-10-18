# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

AI Preza Demos is a Next.js application showcasing four AI-powered demo applications:
- **Bedtime Story Writer** - AI-generated personalized bedtime stories for children
- **Email Helper** - Professional email writing assistant
- **RAG Chat** - Document Q&A using Retrieval-Augmented Generation
- **Jobs Application Reviewer** - AI-powered candidate matching system with vector embeddings

The project uses Next.js 15 with TypeScript, Tailwind CSS v4, Drizzle ORM with PostgreSQL (pgvector), Anthropic Claude via LangChain, and LangGraph for agent workflows.

## Development Commands

```bash
# Development
npm run dev                    # Start Next.js development server

# Building and Production
npm run build                  # Build the application for production
npm run start                  # Start production server

# Code Quality
npm run lint                   # Run Biome linter
npm run format                 # Format code with Biome

# Database Operations
npm run db:generate            # Generate new Drizzle migration
npm run db:migrate             # Run pending migrations
npm run db:push                # Push schema changes (development only)
npm run db:studio              # Open Drizzle Studio database browser

# Data Seeding
npm run seed-positions         # Seed job positions for Jobs feature
npm run embed-applications     # Generate embeddings for applications

# Docker Operations
docker compose up -d           # Start PostgreSQL + App (full stack)
docker compose up -d postgres  # Start PostgreSQL only (local development)
docker compose down            # Stop all services
docker compose logs -f         # View logs
```

## Architecture & Code Organization

### Feature-Based Architecture with Route Groups

The application uses **route groups** (folders in parentheses) in `src/app/` to organize features by domain. Route groups are organizational folders that don't affect the URL structure.

#### Project Structure

```
src/
├── app/
│   ├── (bedtimeStory)/        # Bedtime Story Writer Feature
│   │   ├── bedtime-story/
│   │   │   ├── (components)/  # UI components specific to this route
│   │   │   │   ├── StoryForm.tsx
│   │   │   │   └── StoryDisplay.tsx
│   │   │   ├── actions.ts     # Server actions for story generation
│   │   │   ├── types.ts       # TypeScript types
│   │   │   └── page.tsx       # Story creation page
│   │   ├── story-library/
│   │   │   └── page.tsx       # Story library listing
│   │   └── story/[id]/
│   │       └── page.tsx       # Individual story view
│   │
│   ├── (emailHelper)/         # Email Helper Feature
│   │   ├── email-helper/
│   │   │   ├── (components)/
│   │   │   │   ├── EmailForm.tsx
│   │   │   │   └── EmailDisplay.tsx
│   │   │   ├── actions.ts
│   │   │   └── page.tsx
│   │   └── email-library/
│   │       └── page.tsx
│   │
│   ├── (ragChat)/             # RAG Chat Feature
│   │   ├── rag-chat/
│   │   │   ├── (components)/
│   │   │   │   ├── ChatInterface.tsx
│   │   │   │   ├── SourceResults.tsx
│   │   │   │   ├── ApplicationResults.tsx
│   │   │   │   ├── JobPositionResults.tsx
│   │   │   │   ├── PositionMatchesResults.tsx
│   │   │   │   └── JobActionConfirmation.tsx
│   │   │   └── page.tsx
│   │   └── rag-documents/
│   │       ├── (components)/
│   │       │   ├── DocumentUpload.tsx
│   │       │   ├── TextDocumentUpload.tsx
│   │       │   └── DocumentList.tsx
│   │       ├── actions.ts
│   │       └── page.tsx
│   │
│   ├── (jobs)/                # Jobs Feature
│   │   └── jobs/
│   │       ├── positions/     # Job position management
│   │       │   ├── PositionForm.tsx
│   │       │   ├── actions.ts
│   │       │   ├── types.ts
│   │       │   ├── page.tsx
│   │       │   └── [id]/
│   │       │       └── page.tsx
│   │       └── applications/  # Application review
│   │           ├── actions.ts
│   │           ├── page.tsx
│   │           └── [id]/
│   │               └── page.tsx
│   │
│   ├── (common)/              # Shared functionality
│   │   └── (components)/
│   │       └── Sidebar.tsx    # Navigation sidebar
│   │
│   ├── api/                   # API routes
│   │   ├── jobs/
│   │   │   └── embed-applications/
│   │   │       └── route.ts
│   │   └── rag-chat/
│   │       └── stream-chat/
│   │           └── route.ts
│   │
│   ├── layout.tsx             # Root layout with Sidebar
│   ├── page.tsx               # Home page/dashboard
│   └── globals.css            # Global styles
│
├── components/                # Reusable UI components
│   ├── MessageMarkdown.tsx
│   └── ui/                    # UI primitives
│
├── services/                  # Business logic layer
│   ├── RAGService.ts          # RAG document processing
│   ├── AgentService.ts        # LangGraph agent workflows
│   ├── BaseEmbeddingService.ts
│   ├── StoryEmbeddingService.ts
│   └── ApplicationEmbeddingService.ts
│
├── lib/                       # Utilities & configurations
│   ├── db.ts                  # Database connection
│   └── pdfParser.server.ts    # PDF processing (server-only)
│
├── repo/                      # Database schema (Drizzle ORM)
│   └── schema.ts              # All table definitions
│
└── utils/                     # Helper functions
    └── cn.ts                  # Tailwind class merging
```

### Module Organization Patterns

#### Parentheses Convention
Folders in parentheses `()` are organizational and **don't affect URL routing**:
- `(bedtimeStory)` - Route group for bedtime story feature
- `(components)` - UI components specific to a route
- `(emailHelper)` - Route group for email helper feature
- `(ragChat)` - Route group for RAG chat feature
- `(jobs)` - Route group for jobs feature
- `(common)` - Shared components and functionality

**URL Examples:**
- `/bedtime-story` → `app/(bedtimeStory)/bedtime-story/page.tsx`
- `/story-library` → `app/(bedtimeStory)/story-library/page.tsx`
- `/jobs/positions` → `app/(jobs)/jobs/positions/page.tsx`

#### Component Hierarchy
- **Pages** are made of components
- **Components** import from services
- **Services** contain business logic
- **Actions** coordinate between UI and services

### Code Organization Best Practices

1. **Feature Isolation**: Keep feature-specific code within its route group
2. **Component Reusability**: Extract reusable UI to `/src/components`
3. **Business Logic**: Put complex logic in `/src/services`
4. **Server Actions**: Keep actions close to their routes in `actions.ts` files
5. **Type Safety**: Define types in `types.ts` files within features

## Server Actions Pattern

All data mutations and server-side operations use Next.js Server Actions with the `"use server"` directive.

### Server Action Conventions

#### 1. File Structure
```typescript
// src/app/(featureName)/route-name/actions.ts
"use server";

import { getDb } from "@/lib/db";
import { tableName } from "@/repo/schema";

export async function actionNameAction(params: ParamsType) {
  // Implementation
}
```

#### 2. Naming Convention
- All server actions end with `Action` suffix
- Use descriptive verbs: `createStoryAction`, `updatePositionAction`, `deleteDocumentAction`
- Group related actions in the same file

#### 3. Standard Return Pattern
Always return an object with a `success` boolean and either data or error:

```typescript
// Success case
return {
  success: true,
  data: result,         // or specific field like 'story', 'position', etc.
  // optional metadata
};

// Error case
return {
  success: false,
  error: "User-friendly error message",
  // optional: include empty data for type safety
};
```

#### 4. Error Handling
```typescript
export async function createResourceAction(data: FormData) {
  try {
    // Validation
    if (!data.requiredField) {
      return {
        success: false,
        error: "Required field is missing",
      };
    }

    // Database operation
    const result = await getDb()
      .insert(tableName)
      .values(data)
      .returning();

    return {
      success: true,
      resource: result[0],
    };
  } catch (error) {
    console.error("Error creating resource:", error);
    return {
      success: false,
      error: "Failed to create resource. Please try again.",
    };
  }
}
```

### Complete Action Examples

#### CRUD Actions Example (Bedtime Story)
```typescript
"use server";

import { getDb } from "@/lib/db";
import { stories } from "@/repo/schema";
import { eq, desc } from "drizzle-orm";
import type { StoryFormData } from "./types";

// CREATE
export async function saveStoryAction(formData: StoryFormData, story: string) {
  try {
    const [savedStory] = await getDb()
      .insert(stories)
      .values({
        topic: formData.interests.join(", "),
        childAge: parseInt(formData.age),
        emphasis: [formData.style, formData.lesson],
        generatedStory: story,
      })
      .returning();

    return {
      success: true,
      storyId: savedStory.id,
    };
  } catch (error) {
    console.error("Error saving story:", error);
    return {
      success: false,
      error: "Failed to save story. Please try again.",
    };
  }
}

// READ (list)
export async function getStoriesAction() {
  try {
    const allStories = await getDb()
      .select()
      .from(stories)
      .orderBy(desc(stories.createdAt));

    return {
      success: true,
      stories: allStories,
    };
  } catch (error) {
    console.error("Error fetching stories:", error);
    return {
      success: false,
      error: "Failed to fetch stories.",
      stories: [],
    };
  }
}

// READ (single)
export async function getStoryAction(storyId: number) {
  try {
    const [story] = await getDb()
      .select()
      .from(stories)
      .where(eq(stories.id, storyId))
      .limit(1);

    if (!story) {
      return {
        success: false,
        error: "Story not found.",
        story: null,
      };
    }

    return {
      success: true,
      story,
    };
  } catch (error) {
    console.error("Error fetching story:", error);
    return {
      success: false,
      error: "Failed to fetch story.",
      story: null,
    };
  }
}

// DELETE
export async function deleteStoryAction(storyId: number) {
  try {
    await getDb().delete(stories).where(eq(stories.id, storyId));

    return {
      success: true,
    };
  } catch (error) {
    console.error("Error deleting story:", error);
    return {
      success: false,
      error: "Failed to delete story.",
    };
  }
}
```

### Using Actions in Components

```typescript
"use client";

import { useState } from "react";
import { saveStoryAction } from "./actions";

export function StoryForm() {
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (formData: FormData) => {
    setIsLoading(true);

    const result = await saveStoryAction(data, story);

    if (result.success) {
      toast.success("Story saved!");
      router.push(`/story/${result.storyId}`);
    } else {
      toast.error(result.error);
    }

    setIsLoading(false);
  };

  return (
    <form onSubmit={handleSubmit}>
      {/* Form fields */}
    </form>
  );
}
```

## Database Architecture (Drizzle ORM + PostgreSQL)

### Database Schema Organization

All database tables are defined in `src/repo/schema.ts` using Drizzle ORM. The schema is organized by feature.

#### Schema Structure
```typescript
import { pgTable, serial, text, integer, timestamp, vector } from "drizzle-orm/pg-core";

// Feature: Bedtime Story Writer
export const stories = pgTable("stories", {
  id: serial("id").primaryKey(),
  topic: text("topic").notNull(),
  childAge: integer("child_age").notNull(),
  emphasis: text("emphasis").array().notNull(),
  generatedStory: text("generated_story").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const storyEmbeddings = pgTable("story_embeddings", {
  id: serial("id").primaryKey(),
  storyId: integer("story_id")
    .references(() => stories.id, { onDelete: "cascade" })
    .notNull(),
  chunkText: text("chunk_text").notNull(),
  chunkIndex: integer("chunk_index").notNull(),
  embedding: vector("embedding", { dimensions: 1536 }),
});

// Type exports
export type Story = typeof stories.$inferSelect;
export type NewStory = typeof stories.$inferInsert;
```

### Database Tables by Feature

#### 1. Bedtime Story Writer
- **stories** - Generated bedtime stories
- **storyEmbeddings** - Vector embeddings for semantic search

#### 2. Email Helper
- **emails** - Generated professional emails

#### 3. RAG Chat
- **documents** - Uploaded documents (PDF, text)
- **documentChunks** - Chunked document content with embeddings
- **chatHistory** - Chat conversation history

#### 4. Jobs Application Reviewer
- **openPositions** - Job positions with status tracking
- **reviewedApplications** - AI-reviewed job applications
- **applicationEmbeddings** - Vector embeddings of applications
- **applicationPositionMatches** - Candidate-to-position matches with scores

### Vector Embeddings with pgvector

The project uses PostgreSQL's `pgvector` extension for semantic similarity search.

#### Embedding Dimensions
All vector embeddings use **1536 dimensions** (OpenAI text-embedding-3-small model).

```typescript
embedding: vector("embedding", { dimensions: 1536 })
```

#### Vector Similarity Search Pattern
```typescript
// 1. Generate query embedding
const queryEmbedding = await embeddings.embedQuery(query);

// 2. Perform similarity search using cosine distance (<=>)
const results = await getDb().execute(sql`
  SELECT
    content,
    1 - (embedding <=> ${queryEmbedding}::vector) as similarity
  FROM table_name
  ORDER BY similarity DESC
  LIMIT ${limit}
`);
```

### Database Connection

```typescript
// src/lib/db.ts
import { drizzle } from "drizzle-orm/node-postgres";
import pg from "pg";

const pool = new pg.Pool({
  connectionString: process.env.DATABASE_URL,
});

export const db = drizzle(pool);
export const getDb = () => db;
```

### Migration Workflow

```bash
# 1. Modify schema in src/repo/schema.ts
# 2. Generate migration
npm run db:generate

# 3. Review generated SQL in drizzle/ directory
# 4. Apply migration
npm run db:migrate

# Alternative: Push schema directly (dev only, no migration files)
npm run db:push
```

### Foreign Key Relationships

```typescript
// CASCADE deletion example
export const documentChunks = pgTable("document_chunks", {
  id: serial("id").primaryKey(),
  documentId: integer("document_id")
    .references(() => documents.id, { onDelete: "cascade" })
    .notNull(),
  // ... other fields
});
```

When a document is deleted, all its chunks are automatically deleted.

## Services Layer Pattern

Services encapsulate business logic, external API calls, and complex operations. They are located in `src/services/`.

### Service Organization

#### Base Service Pattern
```typescript
// src/services/BaseEmbeddingService.ts
export abstract class BaseEmbeddingService<T> {
  protected abstract tableName: string;
  protected abstract chunkSize: number;

  async embedEntity(entityId: number, content: string): Promise<void> {
    // Common embedding logic
  }

  async similaritySearch(query: string, limit: number): Promise<T[]> {
    // Common search logic
  }
}
```

#### Feature-Specific Service
```typescript
// src/services/StoryEmbeddingService.ts
import { BaseEmbeddingService } from "./BaseEmbeddingService";

export class StoryEmbeddingService extends BaseEmbeddingService<Story> {
  protected tableName = "story_embeddings";
  protected chunkSize = 500;

  async embedStory(storyId: number, storyContent: string) {
    return this.embedEntity(storyId, storyContent);
  }

  async findSimilarStories(query: string) {
    return this.similaritySearch(query, 5);
  }
}
```

### Service Examples

#### RAG Service (Document Processing)
```typescript
// src/services/RAGService.ts
export class RAGService {
  /**
   * Process and store a PDF document
   * 1. Extract text from PDF
   * 2. Chunk text semantically
   * 3. Generate embeddings
   * 4. Store in database
   */
  static async processDocument(file: File) {
    // PDF extraction
    const fullText = await extractPDFText(filePath);

    // Store document
    const [document] = await getDb()
      .insert(documents)
      .values({ filename, content: fullText })
      .returning();

    // Chunk with LangChain
    const textSplitter = new RecursiveCharacterTextSplitter({
      chunkSize: 1000,
      chunkOverlap: 200,
    });
    const chunks = await textSplitter.createDocuments([fullText]);

    // Generate and store embeddings
    for (const chunk of chunks) {
      const embedding = await embeddings.embedQuery(chunk.pageContent);
      await getDb().insert(documentChunks).values({
        documentId: document.id,
        chunkText: chunk.pageContent,
        embedding,
      });
    }

    return { documentId: document.id, chunksCount: chunks.length };
  }

  /**
   * Perform vector similarity search
   */
  static async similaritySearch(query: string, limit = 3) {
    const queryEmbedding = await embeddings.embedQuery(query);

    const results = await getDb().execute(sql`
      SELECT content, filename
      FROM documents d
      JOIN document_chunks dc ON d.id = dc.document_id
      WHERE 1 - (dc.embedding <=> ${queryEmbedding}::vector) > 0.7
      ORDER BY dc.embedding <=> ${queryEmbedding}::vector
      LIMIT ${limit}
    `);

    return results.rows;
  }
}
```

#### Agent Service (LangGraph)
```typescript
// src/services/AgentService.ts
import { createReactAgent } from "@langchain/langgraph/prebuilt";
import { ChatAnthropic } from "@langchain/anthropic";
import { tool } from "@langchain/core/tools";

export class AgentService {
  static streamChat(message: string, thread_id: string) {
    return new Observable((subscriber) => {
      const llm = new ChatAnthropic({
        model: "claude-3-7-sonnet-20250219",
        streaming: true,
        callbacks: [{
          handleLLMNewToken(token: string) {
            subscriber.next(token);
          }
        }]
      });

      const agent = createReactAgent({
        llm,
        tools: [searchDocumentsTool, searchStoriesTool, ...],
        checkpointSaver: memorySaver,
        messageModifier: SYSTEM_PROMPT,
      });

      await agent.invoke(
        { messages: [{ role: "user", content: message }] },
        { configurable: { thread_id } }
      );

      subscriber.complete();
    });
  }
}
```

### Service Usage in Actions

```typescript
// In action file
"use server";

import { RAGService } from "@/services/RAGService";
import { StoryEmbeddingService } from "@/services/StoryEmbeddingService";

export async function processDocumentAction(formData: FormData) {
  try {
    const file = formData.get("file") as File;
    const result = await RAGService.processDocument(file);

    return {
      success: true,
      documentId: result.documentId,
    };
  } catch (error) {
    return {
      success: false,
      error: "Failed to process document",
    };
  }
}

export async function saveStoryAction(story: string, storyId: number) {
  try {
    // Save to database
    const savedStory = await saveToDb(story);

    // Generate embeddings asynchronously (don't block response)
    const embeddingService = new StoryEmbeddingService();
    embeddingService.embedStory(savedStory.id, story).catch(console.error);

    return { success: true, storyId: savedStory.id };
  } catch (error) {
    return { success: false, error: "Failed to save story" };
  }
}
```

## AI Integration Patterns

### Anthropic Claude Direct API

For simple, synchronous AI generation:

```typescript
import Anthropic from "@anthropic-ai/sdk";

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

export async function generateStoryAction(formData: StoryFormData) {
  const prompt = `Create a bedtime story for a ${formData.age}-year-old...`;

  const message = await anthropic.messages.create({
    model: "claude-3-7-sonnet-20250219",
    max_tokens: 1500,
    messages: [{ role: "user", content: prompt }],
  });

  const story = message.content[0].type === "text"
    ? message.content[0].text
    : "";

  return { success: true, story };
}
```

### LangChain with Streaming

For streaming responses:

```typescript
import { ChatAnthropic } from "@langchain/anthropic";

const streamingLlm = new ChatAnthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
  model: "claude-3-7-sonnet-20250219",
  streaming: true,
  callbacks: [{
    handleLLMNewToken(token: string) {
      // Send token to client
      subscriber.next(token);
    }
  }]
});
```

### LangGraph Agent with Tools

For complex workflows with tool calling:

```typescript
import { createReactAgent } from "@langchain/langgraph/prebuilt";
import { tool } from "@langchain/core/tools";
import { z } from "zod";

// Define tools
const searchDocumentsTool = tool(
  async (input: { query: string }) => {
    const results = await RAGService.similaritySearch(input.query);
    return JSON.stringify({ data: { sources: results } });
  },
  {
    name: "search_documents",
    description: "Search through uploaded PDF documents",
    schema: z.object({
      query: z.string().describe("Search query"),
    }),
  }
);

// Create agent
const agent = createReactAgent({
  llm: streamingLlm,
  tools: [searchDocumentsTool, searchStoriesTool],
  checkpointSaver: memorySaver,
  messageModifier: SYSTEM_PROMPT,
});

// Invoke with thread for memory
const result = await agent.invoke(
  { messages: [{ role: "user", content: query }] },
  { configurable: { thread_id } }
);
```

## Environment Variables

### Required Variables

```bash
# Database
DATABASE_URL=postgresql://user:password@host:port/database

# AI Services
ANTHROPIC_API_KEY=sk-ant-api03-...    # Required
OPENAI_API_KEY=sk-proj-...             # Required for embeddings

# Optional
VOYAGE_API_KEY=pa-...                  # Alternative embeddings provider
NODE_ENV=development                   # Environment
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

### Environment Files

- `.env` - Committed, contains non-sensitive defaults
- `.env.local` - Not committed, contains secrets (API keys)
- `.env.production` - Production configuration

## Component Patterns

### Client Components
```typescript
"use client";

import { useState } from "react";

export function InteractiveComponent() {
  const [state, setState] = useState("");

  const handleAction = async () => {
    const result = await serverAction(data);
    if (result.success) {
      // Handle success
    }
  };

  return <div>{/* UI */}</div>;
}
```

### Server Components (Default)
```typescript
// No "use client" directive needed

import { getDb } from "@/lib/db";
import { stories } from "@/repo/schema";

export default async function StoryListPage() {
  const stories = await getDb().select().from(stories);

  return <div>{/* Render stories */}</div>;
}
```

## Key Technologies & Patterns

### Frontend
- **Next.js 15** - App Router with Server Components
- **React 19** - Latest React features
- **TypeScript** - Strict type checking
- **Tailwind CSS v4** - Utility-first styling

### Backend
- **Next.js API Routes** - RESTful endpoints
- **Server Actions** - Type-safe server functions
- **Drizzle ORM** - Type-safe database queries
- **PostgreSQL 16** - Relational database with pgvector

### AI & ML
- **Anthropic Claude 3.7 Sonnet** - Primary LLM
- **LangChain** - AI framework and abstractions
- **LangGraph** - Agent workflows with tools
- **OpenAI Embeddings** - text-embedding-3-small (1536 dimensions)
- **pgvector** - Vector similarity search

### Developer Experience
- **Biome** - Fast linter and formatter
- **Drizzle Studio** - Database GUI
- **Docker Compose** - Local PostgreSQL + App deployment

## Development Best Practices

### 1. Feature Development Workflow

```bash
# 1. Create feature route group
mkdir -p src/app/(newFeature)/feature-name

# 2. Create page and actions
touch src/app/(newFeature)/feature-name/page.tsx
touch src/app/(newFeature)/feature-name/actions.ts
touch src/app/(newFeature)/feature-name/types.ts

# 3. Create components folder
mkdir src/app/(newFeature)/feature-name/(components)

# 4. Update database schema if needed
# Edit src/repo/schema.ts

# 5. Generate migration
npm run db:generate
npm run db:migrate

# 6. Create service if needed
touch src/services/FeatureService.ts
```

### 2. Creating a New Feature

**Example: Adding a "Notes" feature**

```typescript
// 1. Define schema (src/repo/schema.ts)
export const notes = pgTable("notes", {
  id: serial("id").primaryKey(),
  title: text("title").notNull(),
  content: text("content").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export type Note = typeof notes.$inferSelect;
export type NewNote = typeof notes.$inferInsert;

// 2. Create route group structure
// src/app/(notes)/notes/page.tsx
export default function NotesPage() {
  return <div>Notes List</div>;
}

// 3. Create actions (src/app/(notes)/notes/actions.ts)
"use server";

import { getDb } from "@/lib/db";
import { notes } from "@/repo/schema";

export async function createNoteAction(data: { title: string; content: string }) {
  try {
    const [note] = await getDb()
      .insert(notes)
      .values(data)
      .returning();

    return { success: true, note };
  } catch (error) {
    return { success: false, error: "Failed to create note" };
  }
}

// 4. Create service if needed (src/services/NoteService.ts)
export class NoteService {
  static async processNote(content: string) {
    // Business logic here
  }
}

// 5. Update sidebar navigation (src/app/(common)/(components)/Sidebar.tsx)
const navigation = [
  // ...
  {
    name: "Notes",
    href: "/notes",
    icon: FileText,
    color: "text-yellow-600 dark:text-yellow-400",
  },
];
```

### 3. Adding Vector Search to a Feature

```typescript
// 1. Add embeddings table to schema
export const noteEmbeddings = pgTable("note_embeddings", {
  id: serial("id").primaryKey(),
  noteId: integer("note_id")
    .references(() => notes.id, { onDelete: "cascade" })
    .notNull(),
  chunkText: text("chunk_text").notNull(),
  embedding: vector("embedding", { dimensions: 1536 }),
});

// 2. Create embedding service
export class NoteEmbeddingService extends BaseEmbeddingService<Note> {
  protected tableName = "note_embeddings";
  protected chunkSize = 500;

  async embedNote(noteId: number, content: string) {
    return this.embedEntity(noteId, content);
  }

  async searchNotes(query: string) {
    return this.similaritySearch(query, 5);
  }
}

// 3. Use in action
export async function saveNoteAction(data: NoteData) {
  const [note] = await getDb().insert(notes).values(data).returning();

  // Generate embeddings async
  const embeddingService = new NoteEmbeddingService();
  embeddingService.embedNote(note.id, data.content).catch(console.error);

  return { success: true, note };
}
```

### 4. Error Handling Guidelines

```typescript
// ✅ Good - User-friendly errors
return {
  success: false,
  error: "Failed to save story. Please try again.",
};

// ❌ Bad - Technical errors exposed to users
return {
  success: false,
  error: error.message, // May expose stack traces or DB errors
};

// ✅ Good - Log technical details, return friendly message
try {
  // operation
} catch (error) {
  console.error("Detailed error for debugging:", error);
  return {
    success: false,
    error: "An unexpected error occurred. Please try again.",
  };
}
```

### 5. Type Safety Best Practices

```typescript
// ✅ Good - Infer types from schema
import type { Story, NewStory } from "@/repo/schema";

// ✅ Good - Define action parameter types
export async function updateStoryAction(
  id: number,
  updates: Partial<NewStory>
) {
  // ...
}

// ✅ Good - Type action return values
interface ActionResult<T> {
  success: boolean;
  data?: T;
  error?: string;
}

export async function getStoryAction(id: number): Promise<ActionResult<Story>> {
  // ...
}
```

## Testing Considerations

While the project doesn't currently have a test suite, here are recommended patterns:

### Unit Testing Actions
```typescript
// __tests__/actions.test.ts
import { createStoryAction } from "../actions";

describe("createStoryAction", () => {
  it("should create a story successfully", async () => {
    const result = await createStoryAction(validData);
    expect(result.success).toBe(true);
    expect(result.storyId).toBeDefined();
  });

  it("should return error for invalid data", async () => {
    const result = await createStoryAction(invalidData);
    expect(result.success).toBe(false);
    expect(result.error).toBeDefined();
  });
});
```

### E2E Testing with Playwright
```typescript
// e2e/bedtime-story.spec.ts
test("should generate a bedtime story", async ({ page }) => {
  await page.goto("/bedtime-story");
  await page.fill('[name="age"]', "5");
  await page.click('button:text("Generate Story")');
  await expect(page.locator(".story-content")).toBeVisible();
});
```

## Deployment

### Docker Production Deployment

```bash
# Build and start full stack
docker compose up -d

# The Dockerfile:
# - Uses Node 20 Alpine
# - Installs poppler-utils for PDF processing
# - Builds Next.js in standalone mode
# - Runs as non-root user (nextjs:nodejs)
# - Exposes port 3000

# Environment variables from .env file:
# - ANTHROPIC_API_KEY
# - OPENAI_API_KEY
# - DATABASE_URL (automatically set for Docker network)
```

### Database Migrations in Production

```bash
# Run migrations before starting app
npm run db:migrate

# Or include in Dockerfile/docker-compose
```

## Common Patterns Reference

### Pattern: Async Operations Don't Block Response
```typescript
export async function saveStoryAction(story: string) {
  const saved = await saveToDatabase(story);

  // Don't await - let it run in background
  generateEmbeddings(saved.id).catch(console.error);

  return { success: true, storyId: saved.id };
}
```

### Pattern: Pagination
```typescript
export async function getItemsAction(page: number = 1, limit: number = 10) {
  const offset = (page - 1) * limit;

  const items = await getDb()
    .select()
    .from(table)
    .limit(limit)
    .offset(offset);

  return { success: true, items };
}
```

### Pattern: Optimistic Updates
```typescript
"use client";

export function ItemList() {
  const [items, setItems] = useState(initialItems);

  const handleDelete = async (id: number) => {
    // Optimistic update
    setItems(prev => prev.filter(item => item.id !== id));

    const result = await deleteItemAction(id);

    if (!result.success) {
      // Revert on error
      setItems(initialItems);
      toast.error(result.error);
    }
  };
}
```

---

## Quick Reference

### Common Imports
```typescript
// Database
import { getDb } from "@/lib/db";
import { stories, documents } from "@/repo/schema";
import { eq, desc, sql } from "drizzle-orm";

// AI
import Anthropic from "@anthropic-ai/sdk";
import { ChatAnthropic } from "@langchain/anthropic";
import { OpenAIEmbeddings } from "@langchain/openai";

// Services
import { RAGService } from "@/services/RAGService";
import { AgentService } from "@/services/AgentService";

// Utils
import { cn } from "@/utils/cn";
```

### Frequently Used Commands
```bash
npm run dev              # Start dev server
npm run db:studio        # Open database GUI
npm run db:push          # Quick schema sync (no migration)
docker compose up -d     # Start database
docker compose logs -f   # View logs
```

---

Built with ❤️ using Next.js, Claude, and LangChain
