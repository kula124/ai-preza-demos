# AI Preza Demos - TODO & Specifications

## Project Overview
Three AI-powered demo applications built with Next.js 15, TypeScript, and Anthropic Claude via LangChain.

### Applications
1. **Bedtime Story Writer** - Multi-step AI story generator for children
2. **Email Helper** - Professional email writing assistant with tone control
3. **RAG Chat** - Document Q&A using Retrieval-Augmented Generation

---

## ✅ Phase 1: Foundation & Infrastructure (CURRENT)

### 1.1 Project Setup
- [x] Next.js 15 project initialized
- [ ] Documentation created (TODO.md, INSTRUCTIONS.md)
- [ ] Basic folder structure established
- [ ] Environment variables template (.env.example)

### 1.2 Core Infrastructure
- [ ] Docker Compose setup (PostgreSQL 16 + pgvector extension)
- [ ] Database connection configuration
- [ ] Drizzle ORM setup with migrations
- [ ] Database schema for all three apps

### 1.3 Dependencies Installation
Required packages:
```bash
# AI & LangChain
@langchain/anthropic
@langchain/community
@langchain/core
langchain

# Database
drizzle-orm
drizzle-kit
pg
@neondatabase/serverless (for edge compatibility)
pgvector (for vector similarity search)

# UI & Components
lucide-react (icons)
sonner (toast notifications)
class-variance-authority (component variants)
clsx, tailwind-merge

# Utilities
zod (validation)
react-hook-form, @hookform/resolvers
date-fns
```

### 1.4 Dashboard & Navigation
- [ ] Root layout with sidebar
- [ ] Sidebar component with navigation links
- [ ] Home dashboard page with app cards
- [ ] Theme provider (light/dark mode)
- [ ] Responsive layout structure

---

## 📋 Phase 2: Bedtime Story Writer App

### 2.1 UI Components & Flow
Multi-step form process:
1. **Topic Selection** - Predefined topics or custom input
2. **Child's Age** - Age range selector (2-12 years)
3. **Character Emphasis** - Confidence, Kindness, Bravery, Creativity, etc.
4. **Additional Instructions** - Free text prompt
5. **Story Generation** - Display with streaming
6. **Save & Share** - Store story in database

### 2.2 Database Schema
```sql
stories (
  id SERIAL PRIMARY KEY,
  topic TEXT NOT NULL,
  child_age INTEGER NOT NULL,
  emphasis TEXT[], -- Array of character traits
  additional_instructions TEXT,
  generated_story TEXT NOT NULL,
  created_at TIMESTAMP DEFAULT NOW()
)
```

### 2.3 AI Integration
- [ ] LangChain prompt template for story generation
- [ ] Claude API integration with streaming
- [ ] Story generation service
- [ ] Server actions for form submission

### 2.4 Features
- [ ] Multi-step form with progress indicator
- [ ] Story preview with markdown support
- [ ] Copy to clipboard functionality
- [ ] Story history/library view
- [ ] Regenerate story option

---

## 📧 Phase 3: Email Helper App

### 3.1 UI Components & Flow
Multi-step email creation:
1. **Email Type** - Professional, Casual, Marketing, Sales, Support
2. **Tone Selection** - Formal, Friendly, Persuasive, Apologetic, etc.
3. **Key Points** - Bullet points or free text
4. **Additional Context** - Recipient info, purpose
5. **Email Generation** - Subject + Body
6. **Edit & Refine** - Regenerate or manual edit

### 3.2 Database Schema
```sql
emails (
  id SERIAL PRIMARY KEY,
  email_type TEXT NOT NULL,
  tone TEXT NOT NULL,
  key_points TEXT[],
  context TEXT,
  generated_subject TEXT NOT NULL,
  generated_body TEXT NOT NULL,
  created_at TIMESTAMP DEFAULT NOW()
)
```

### 3.3 AI Integration
- [ ] Email prompt templates by type/tone
- [ ] Subject line generation
- [ ] Body generation with proper formatting
- [ ] Refinement/regeneration capability

### 3.4 Features
- [ ] Multi-step form with validation
- [ ] Live preview with HTML formatting
- [ ] Copy subject + body separately
- [ ] Email template library
- [ ] Tone adjustment slider

---

## 🔍 Phase 4: RAG Chat App

### 4.1 Document Management
- [ ] PDF upload component (drag & drop)
- [ ] Text file upload
- [ ] Document parsing (PDFLoader, TextLoader)
- [ ] Document chunking strategy
- [ ] Vector embeddings generation
- [ ] pgvector storage

### 4.2 Database Schema
```sql
documents (
  id SERIAL PRIMARY KEY,
  filename TEXT NOT NULL,
  file_type TEXT NOT NULL, -- 'pdf' or 'text'
  content TEXT NOT NULL,
  upload_date TIMESTAMP DEFAULT NOW()
)

document_chunks (
  id SERIAL PRIMARY KEY,
  document_id INTEGER REFERENCES documents(id) ON DELETE CASCADE,
  chunk_text TEXT NOT NULL,
  chunk_index INTEGER NOT NULL,
  embedding VECTOR(1536) -- Claude embeddings dimension
)

chat_history (
  id SERIAL PRIMARY KEY,
  document_id INTEGER REFERENCES documents(id),
  question TEXT NOT NULL,
  answer TEXT NOT NULL,
  relevant_chunks INTEGER[],
  created_at TIMESTAMP DEFAULT NOW()
)
```

### 4.3 RAG Pipeline
- [ ] Document upload handler
- [ ] Text extraction (pdf-parse for PDFs)
- [ ] Chunking strategy (RecursiveCharacterTextSplitter)
- [ ] Embedding generation (Anthropic or OpenAI embeddings)
- [ ] Vector similarity search
- [ ] Context retrieval
- [ ] Answer generation with citations

### 4.4 Chat Interface
- [ ] Document selector/library
- [ ] Chat input with auto-resize
- [ ] Message history display
- [ ] Streaming responses
- [ ] Source citations (show relevant chunks)
- [ ] Clear/new conversation

### 4.5 Features
- [ ] Multiple document support
- [ ] Document deletion
- [ ] Chat history per document
- [ ] Export chat as markdown
- [ ] Relevance scoring display

---

## 🎨 Phase 5: UI/UX Polish

### 5.1 Shared Components
- [ ] Loading states & skeletons
- [ ] Error boundaries & error states
- [ ] Success/error toast notifications
- [ ] Form validation with error messages
- [ ] Responsive design (mobile/tablet/desktop)

### 5.2 Accessibility
- [ ] Keyboard navigation
- [ ] ARIA labels
- [ ] Focus management
- [ ] Color contrast compliance

### 5.3 Performance
- [ ] React Query for data fetching
- [ ] Optimistic updates
- [ ] Image optimization
- [ ] Code splitting
- [ ] Bundle size optimization

---

## 🧪 Phase 6: Testing & Documentation

### 6.1 Testing
- [ ] Unit tests for utilities
- [ ] Integration tests for AI services
- [ ] E2E tests for critical flows
- [ ] Database migration tests

### 6.2 Documentation
- [ ] API documentation
- [ ] Component documentation
- [ ] Setup guide (README.md)
- [ ] Environment variables guide
- [ ] Deployment guide

---

## 🚀 Phase 7: Deployment

### 7.1 Environment Setup
- [ ] Production environment variables
- [ ] Database migration strategy
- [ ] Error tracking (Sentry/LogRocket)
- [ ] Analytics setup

### 7.2 Deployment
- [ ] Docker production build
- [ ] Vercel/Railway deployment
- [ ] Database hosting (Supabase/Neon)
- [ ] CI/CD pipeline

---

## Technical Decisions

### Architecture Pattern
- **Route Groups**: `(bedtimeStory)`, `(emailHelper)`, `(ragChat)`, `(common)`
- **Server Actions**: All AI calls and DB operations
- **Client Components**: Interactive forms and real-time updates
- **Streaming**: Server-Sent Events for AI responses

### File Structure
```
src/
├── app/
│   ├── (common)/
│   │   ├── (components)/
│   │   │   ├── Sidebar.tsx
│   │   │   └── ThemeProvider.tsx
│   │   └── layout.tsx
│   ├── (bedtimeStory)/
│   │   ├── bedtime-story/
│   │   │   ├── (components)/
│   │   │   ├── (hooks)/
│   │   │   ├── actions.ts
│   │   │   └── page.tsx
│   │   └── story-library/
│   │       └── page.tsx
│   ├── (emailHelper)/
│   │   ├── email-helper/
│   │   │   ├── (components)/
│   │   │   ├── actions.ts
│   │   │   └── page.tsx
│   │   └── email-library/
│   │       └── page.tsx
│   ├── (ragChat)/
│   │   ├── rag-chat/
│   │   │   ├── (components)/
│   │   │   ├── (services)/
│   │   │   ├── actions.ts
│   │   │   └── page.tsx
│   │   └── documents/
│   │       └── page.tsx
│   ├── globals.css
│   ├── layout.tsx
│   └── page.tsx (Dashboard)
├── components/
│   └── ui/ (Reusable UI components)
├── lib/
│   ├── db.ts (Database connection)
│   └── langchain.ts (LangChain utilities)
├── repo/
│   └── schema.ts (Drizzle schema)
├── services/
│   ├── StoryService.ts
│   ├── EmailService.ts
│   └── RAGService.ts
└── types/
    └── index.ts
```

### Environment Variables
```bash
# Database
DATABASE_URL=postgresql://user:password@localhost:5432/ai_preza_demos

# Anthropic Claude
ANTHROPIC_API_KEY=sk-ant-...

# Optional: OpenAI for embeddings (if not using Anthropic)
OPENAI_API_KEY=sk-...

# App
NODE_ENV=development
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

---

## Notes & Considerations

1. **Vector Embeddings**: Use Anthropic's embedding model or OpenAI's text-embedding-3-small
2. **Streaming**: Implement proper streaming for all AI responses
3. **Error Handling**: Graceful degradation when AI services fail
4. **Rate Limiting**: Consider implementing rate limits for API calls
5. **Caching**: Cache embeddings and frequently used prompts
6. **Security**: Input sanitization, SQL injection prevention
7. **Cost Management**: Track token usage, implement limits

---

## Current Status
**Phase**: 1 - Foundation & Infrastructure
**Last Updated**: 2025-10-10
**Blockers**: None
