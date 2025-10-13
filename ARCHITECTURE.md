# Architecture Documentation

## Table of Contents
- [System Overview](#system-overview)
- [Technology Stack](#technology-stack)
- [Project Structure](#project-structure)
- [Architecture Patterns](#architecture-patterns)
- [Database Architecture](#database-architecture)
- [Service Layer](#service-layer)
- [API Layer](#api-layer)
- [Frontend Architecture](#frontend-architecture)
- [Data Flow](#data-flow)
- [AI Integration](#ai-integration)

## System Overview

AI Preza Demos is a Next.js-based application showcasing four AI-powered features:
1. **Bedtime Story Writer** - Interactive story generation for children
2. **Email Helper** - Professional email composition assistant
3. **RAG Chat** - Document Q&A with retrieval-augmented generation
4. **Jobs Application Reviewer** - AI-powered candidate matching system

The application follows a modern full-stack architecture with server-side rendering, API routes, and streaming AI responses.

## Technology Stack

### Core Framework
- **Next.js 15** - React framework with App Router
- **React 19** - UI library
- **TypeScript 5** - Type-safe JavaScript

### Styling
- **Tailwind CSS v4** - Utility-first CSS framework
- **class-variance-authority** - Component variants
- **tailwind-merge** - Tailwind class merging utility
- **lucide-react** - Icon library

### AI & LangChain
- **@anthropic-ai/sdk** - Direct Anthropic API access
- **LangChain** - AI orchestration framework
  - `@langchain/anthropic` - Claude integration
  - `@langchain/openai` - OpenAI integration
  - `@langchain/community` - Community integrations
  - `@langchain/langgraph` - Agent workflow graphs

### Database
- **PostgreSQL 16** - Primary database with pgvector extension
- **Drizzle ORM** - Type-safe ORM
- **pgvector** - Vector similarity search for embeddings

### Forms & Validation
- **react-hook-form** - Form state management
- **zod** - Schema validation
- **@hookform/resolvers** - Form validation integration

### Development Tools
- **Biome** - Fast linter and formatter (replaces ESLint/Prettier)
- **tsx** - TypeScript execution for scripts
- **Docker Compose** - Database containerization

## Project Structure

```
ai-preza-demos/
├── src/
│   ├── app/                          # Next.js App Router
│   │   ├── (common)/                 # Shared components
│   │   │   └── (components)/
│   │   │       └── Sidebar.tsx       # Navigation sidebar
│   │   ├── (bedtimeStory)/           # Feature: Bedtime Story
│   │   │   ├── bedtime-story/        # Story generation page
│   │   │   ├── story-library/        # Story library page
│   │   │   └── story/                # Individual story view
│   │   ├── (emailHelper)/            # Feature: Email Helper
│   │   │   ├── email-helper/         # Email composition page
│   │   │   └── email-library/        # Email library page
│   │   ├── (ragChat)/                # Feature: RAG Chat
│   │   │   ├── rag-chat/             # Chat interface
│   │   │   └── rag-documents/        # Document management
│   │   ├── (jobs)/                   # Feature: Job Matching
│   │   │   └── jobs/                 # Jobs dashboard
│   │   ├── api/                      # API routes
│   │   │   ├── rag-chat/             # RAG API endpoints
│   │   │   └── jobs/                 # Jobs API endpoints
│   │   ├── layout.tsx                # Root layout
│   │   └── page.tsx                  # Home/dashboard page
│   ├── components/
│   │   └── ui/                       # Reusable UI components
│   ├── lib/                          # Core utilities
│   │   ├── db.ts                     # Database connection
│   │   └── pdfParser.server.ts      # PDF parsing utility
│   ├── repo/                         # Database layer
│   │   └── schema.ts                 # Drizzle schema definitions
│   ├── services/                     # Business logic
│   │   ├── AgentService.ts           # AI agent workflows
│   │   ├── RAGService.ts             # RAG functionality
│   │   ├── BaseEmbeddingService.ts   # Base embedding service
│   │   ├── ApplicationEmbeddingService.ts
│   │   └── StoryEmbeddingService.ts
│   └── utils/                        # Helper utilities
├── scripts/                          # Database scripts
│   ├── embed-applications.ts         # Embed job applications
│   └── seed-positions.ts             # Seed job positions
├── drizzle/                          # Database migrations
├── uploads/                          # File upload storage
├── docker-compose.yml                # PostgreSQL setup
├── drizzle.config.ts                 # Drizzle configuration
└── package.json                      # Dependencies

```

### Route Groups (Next.js 15 App Router)

Route groups (denoted by parentheses) organize routes without affecting the URL structure:
- `(common)` - Shared components across all features
- `(bedtimeStory)` - Bedtime story feature routes
- `(emailHelper)` - Email helper feature routes
- `(ragChat)` - RAG chat feature routes
- `(jobs)` - Job matching feature routes

## Architecture Patterns

### 1. Layered Architecture

```
┌─────────────────────────────────────┐
│     Frontend (React Components)     │
│  - Pages (Server Components)        │
│  - Forms & UI                       │
└──────────────┬──────────────────────┘
               │
┌──────────────▼──────────────────────┐
│         API Layer (Next.js)         │
│  - Route handlers                   │
│  - Server Actions                   │
└──────────────┬──────────────────────┘
               │
┌──────────────▼──────────────────────┐
│        Service Layer                │
│  - AgentService (AI workflows)      │
│  - RAGService (vector search)       │
│  - EmbeddingServices                │
└──────────────┬──────────────────────┘
               │
┌──────────────▼──────────────────────┐
│         Data Layer                  │
│  - Drizzle ORM                      │
│  - Database queries                 │
└──────────────┬──────────────────────┘
               │
┌──────────────▼──────────────────────┐
│      Database (PostgreSQL)          │
│  - Relational data                  │
│  - Vector embeddings (pgvector)     │
└─────────────────────────────────────┘
```

### 2. Server-First Architecture

Next.js 15 uses React Server Components by default:
- **Server Components** - Data fetching, database queries (default)
- **Client Components** - Interactive UI, forms, state management (use 'use client')
- **Server Actions** - Mutations and data updates
- **API Routes** - Streaming responses, webhooks

### 3. Feature-Based Organization

Each feature is self-contained with its own:
- Pages and layouts
- Components
- API routes
- Database tables
- Business logic

## Database Architecture

### Schema Design

The database uses a multi-tenant schema with separate tables per feature:

#### Bedtime Story Tables
```typescript
stories
├── id (serial, PK)
├── topic
├── childAge
├── emphasis (text[])
├── additionalInstructions
├── generatedStory
└── createdAt

storyEmbeddings
├── id (serial, PK)
├── storyId (FK → stories.id)
├── chunkText
├── chunkIndex
└── embedding (vector[1536])
```

#### Email Helper Tables
```typescript
emails
├── id (serial, PK)
├── emailType
├── tone
├── keyPoints (text[])
├── context
├── generatedSubject
├── generatedBody
└── createdAt
```

#### RAG Chat Tables
```typescript
documents
├── id (serial, PK)
├── filename
├── fileType
├── content
└── uploadDate

documentChunks
├── id (serial, PK)
├── documentId (FK → documents.id)
├── chunkText
├── chunkIndex
└── embedding (vector[1536])

chatHistory
├── id (serial, PK)
├── documentId (FK → documents.id)
├── question
├── answer
├── relevantChunks (int[])
└── createdAt
```

#### Jobs Feature Tables
```typescript
openPositions
├── id (text, PK)
├── title
├── department
├── requiredSkills (text[])
├── experienceLevel
├── location
├── employmentType
├── salaryMin/salaryMax
├── status
├── description
├── closedBy (FK → reviewedApplications.id)
└── createdAt/updatedAt

reviewedApplications
├── id (serial, PK)
├── candidateName
├── dateReviewed
├── overallScore
├── fullMarkdownReview
└── createdAt

applicationEmbeddings
├── id (serial, PK)
├── applicationId (FK → reviewedApplications.id)
├── chunkText
├── chunkIndex
├── sectionType
└── embedding (vector[1536])

applicationPositionMatches
├── id (serial, PK)
├── applicationId (FK → reviewedApplications.id)
├── positionId (FK → openPositions.id)
├── matchingScore
├── matchReasoning
└── createdAt
```

### Vector Embeddings

The application uses **OpenAI text-embedding-3-small** (1536 dimensions) for all vector embeddings:
- **pgvector extension** - Enables vector similarity search in PostgreSQL
- **Cosine similarity** - Measures semantic similarity between text chunks
- **Chunking strategy** - Documents split into ~500 character chunks with overlap

## Service Layer

### Base Services

#### `BaseEmbeddingService.ts`
Abstract base class for embedding generation:
- Standardizes embedding creation
- Handles chunking logic
- Database persistence
- Used by all embedding services

#### `RAGService.ts`
Core RAG functionality:
```typescript
- uploadDocument(file) → Parses, chunks, embeds, stores
- searchSimilarChunks(query, documentId) → Vector search
- generateAnswer(question, context) → Claude API call
- streamChat(question, documentId) → Streaming responses
```

#### `AgentService.ts`
AI agent orchestration using LangGraph:
- Multi-step workflows
- Tool calling and function execution
- State management
- Job matching logic

### Specialized Services

#### `ApplicationEmbeddingService.ts`
Handles job application embeddings:
- Parses application text
- Creates section-aware embeddings
- Links to `reviewedApplications`

#### `StoryEmbeddingService.ts`
Handles bedtime story embeddings:
- Embeds generated stories
- Enables semantic search across stories

## API Layer

### API Route Pattern

API routes in Next.js 15 use Web Standard Request/Response:

```typescript
// Example: /app/api/rag-chat/stream-chat/route.ts
export async function POST(request: Request) {
  const body = await request.json();

  // Business logic via service layer
  const stream = await ragService.streamChat(body);

  // Return streaming response
  return new Response(stream, {
    headers: { 'Content-Type': 'text/event-stream' }
  });
}
```

### Streaming Responses

Uses Server-Sent Events (SSE) for real-time AI responses:
1. Client sends POST request
2. Server initiates AI stream
3. Tokens stream back via Response
4. Client renders incrementally

## Frontend Architecture

### Component Hierarchy

```
Layout (Root)
├── Sidebar (Navigation)
└── Page (Feature-specific)
    ├── Form Components
    ├── Display Components
    └── Action Buttons
```

### State Management

- **Server State** - Database queries via Server Components
- **Form State** - `react-hook-form` for controlled forms
- **Client State** - React hooks for UI state
- **URL State** - Next.js routing for navigation

### Form Pattern

```typescript
// 1. Define Zod schema
const schema = z.object({
  field: z.string().min(1)
});

// 2. Initialize form with react-hook-form
const form = useForm({
  resolver: zodResolver(schema)
});

// 3. Handle submission
const onSubmit = async (data) => {
  // Call API or Server Action
  const response = await fetch('/api/endpoint', {
    method: 'POST',
    body: JSON.stringify(data)
  });
};
```

## Data Flow

### RAG Chat Flow
```
1. User uploads PDF
   ↓
2. Server parses PDF (pdfParser.server.ts)
   ↓
3. Text chunked into ~500 char segments
   ↓
4. Chunks embedded via OpenAI API
   ↓
5. Embeddings stored in documentChunks table
   ↓
6. User asks question
   ↓
7. Question embedded
   ↓
8. Vector similarity search (pgvector)
   ↓
9. Top 5 chunks retrieved
   ↓
10. Context + question sent to Claude
    ↓
11. Streaming response returned
```

### Job Matching Flow
```
1. Applications seeded/uploaded
   ↓
2. Applications embedded (via script)
   ↓
3. User initiates job matching
   ↓
4. AgentService orchestrates workflow
   ↓
5. Vector search finds relevant candidates
   ↓
6. Claude analyzes fit for each position
   ↓
7. Match scores calculated
   ↓
8. Results stored in applicationPositionMatches
   ↓
9. UI displays ranked candidates
```

## AI Integration

### Anthropic Claude Integration

#### Models Used
- **Claude 3.5 Sonnet** - Complex reasoning, long context
- **Claude 3.5 Haiku** - Fast responses (Email Helper)

#### Integration Methods

**1. Direct SDK** (Streaming)
```typescript
import Anthropic from '@anthropic-ai/sdk';

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY
});

const stream = await anthropic.messages.stream({
  model: 'claude-3-5-sonnet-20241022',
  messages: [{ role: 'user', content: prompt }],
  max_tokens: 2000
});
```

**2. LangChain** (Agent workflows)
```typescript
import { ChatAnthropic } from '@langchain/anthropic';

const model = new ChatAnthropic({
  modelName: 'claude-3-5-sonnet-20241022',
  anthropicApiKey: process.env.ANTHROPIC_API_KEY
});
```

### Prompt Engineering

Each feature uses carefully crafted system prompts:
- **Bedtime Stories** - Age-appropriate content, character development
- **Email Helper** - Professional tone, structure
- **RAG Chat** - Source citation, accuracy
- **Job Matching** - Structured analysis, scoring

## Development Workflow

### Local Development
1. Start PostgreSQL: `docker compose up -d`
2. Run migrations: `npm run db:migrate`
3. Start dev server: `npm run dev`
4. Access at: `http://localhost:3000`

### Database Management
- **Migrations** - `npm run db:generate` then `db:migrate`
- **Schema push** - `npm run db:push` (development only)
- **Studio** - `npm run db:studio` (visual database browser)

### Code Quality
- **Linting** - `npm run lint` (Biome)
- **Formatting** - `npm run format` (Biome)
- **Type checking** - `tsc --noEmit`

## Deployment Considerations

### Environment Variables
```bash
DATABASE_URL=postgresql://...           # PostgreSQL with pgvector
ANTHROPIC_API_KEY=sk-ant-...           # Claude API
OPENAI_API_KEY=sk-...                  # OpenAI embeddings (optional)
NODE_ENV=production
NEXT_PUBLIC_APP_URL=https://...
```

### Production Setup
1. PostgreSQL 16+ with pgvector extension
2. Persistent file storage for uploads
3. Environment variable configuration
4. Build: `npm run build`
5. Start: `npm run start`

### Scaling Considerations
- **Database** - Connection pooling, read replicas
- **File Storage** - S3 or equivalent for uploads
- **Caching** - Redis for session/embedding cache
- **Rate Limiting** - API route protection
- **Monitoring** - Error tracking, performance monitoring

## Security

### API Key Management
- Environment variables only
- Never commit to version control
- Use `.env.example` for templates

### Database Security
- Parameterized queries (Drizzle prevents SQL injection)
- Row-level security for multi-tenant features
- Regular backups

### File Upload Security
- Type validation (PDF, text only)
- Size limits
- Virus scanning (recommended for production)

## Future Enhancements

### Potential Improvements
1. **Authentication** - User accounts, session management
2. **Multi-tenancy** - User-specific data isolation
3. **Real-time Updates** - WebSocket for live collaboration
4. **Advanced RAG** - Multi-query, re-ranking, citations
5. **Caching** - Redis for embeddings and responses
6. **Batch Processing** - Queue system for large document uploads
7. **Analytics** - Usage tracking, AI cost monitoring
8. **Testing** - Unit tests, integration tests, E2E tests

---

**Last Updated:** October 2025
**Version:** 1.0.0
