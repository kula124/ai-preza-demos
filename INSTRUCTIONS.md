# AI Preza Demos - Instructions for AI Agents

## Project Context

This is a Next.js 15 demo application showcasing three AI-powered tools using Anthropic Claude via LangChain. The project is located at `/Users/kula/Desktop/Projects/ai-preza-demos`.

**IMPORTANT**: We are building this project from scratch, taking inspiration from `/Users/kula/Desktop/Projects/fajb-next` but NOT copying authentication, complex features, or unnecessary dependencies.

---

## Key Architecture Decisions

### 1. No Authentication
- No login/signup flows
- No user management
- No session guards
- All features are publicly accessible

### 2. Technology Stack
- **Framework**: Next.js 15 (App Router)
- **Language**: TypeScript
- **Styling**: Tailwind CSS v4
- **AI**: Anthropic Claude via LangChain
- **Database**: PostgreSQL 16 with pgvector extension
- **ORM**: Drizzle ORM
- **UI Components**: Custom components (no shadcn/ui)
- **Icons**: lucide-react
- **Forms**: react-hook-form + zod
- **Notifications**: sonner

### 3. Database Strategy
- Local Docker setup with PostgreSQL + pgvector
- Each app has its own tables
- Vector storage for RAG functionality
- Simple schema, no complex relationships

### 4. Project Structure
We follow the **route groups** pattern from fajb-next:

```
src/app/
├── (common)/              # Shared components (Sidebar, Layout)
├── (bedtimeStory)/        # Bedtime Story Writer app
├── (emailHelper)/         # Email Helper app
├── (ragChat)/             # RAG Chat app
├── layout.tsx             # Root layout
└── page.tsx               # Dashboard
```

**Naming Convention**:
- Use parentheses `()` for route groups
- CamelCase for feature folders: `(bedtimeStory)`, `(emailHelper)`, `(ragChat)`
- kebab-case for actual routes: `/bedtime-story`, `/email-helper`, `/rag-chat`

---

## Three Demo Apps

### 1. Bedtime Story Writer (`/bedtime-story`)

**Purpose**: Generate personalized bedtime stories for children using AI.

**User Flow**:
1. Select or enter a story topic
2. Choose child's age (2-12 years)
3. Select character emphasis (Confidence, Kindness, Bravery, etc.)
4. Add optional custom instructions
5. Generate story with streaming response
6. Save story to library

**Technical Details**:
- Multi-step form with progress indicator
- Claude streaming for real-time generation
- Database storage for story history
- Markdown rendering for formatted stories

**Database Schema**:
```sql
stories (
  id, topic, child_age, emphasis[],
  additional_instructions, generated_story, created_at
)
```

---

### 2. Email Helper (`/email-helper`)

**Purpose**: AI-powered professional email writing assistant.

**User Flow**:
1. Choose email type (Professional, Casual, Marketing, etc.)
2. Select tone (Formal, Friendly, Persuasive, etc.)
3. Input key points (bullet list or free text)
4. Add context (recipient, purpose)
5. Generate email (subject + body)
6. Edit, regenerate, or save

**Technical Details**:
- Multi-step form similar to story writer
- Separate prompts for subject and body
- HTML email preview
- Copy to clipboard functionality

**Database Schema**:
```sql
emails (
  id, email_type, tone, key_points[],
  context, generated_subject, generated_body, created_at
)
```

---

### 3. RAG Chat (`/rag-chat`)

**Purpose**: Document Q&A using Retrieval-Augmented Generation.

**User Flow**:
1. Upload PDF or text file
2. Document is chunked and embedded
3. User asks questions about the document
4. System retrieves relevant chunks
5. Claude generates answer with citations
6. Chat history is preserved

**Technical Details**:
- PDF parsing with pdf-parse
- Text chunking with RecursiveCharacterTextSplitter
- Vector embeddings (Anthropic or OpenAI)
- pgvector for similarity search
- Streaming chat responses
- Source citation display

**Database Schema**:
```sql
documents (id, filename, file_type, content, upload_date)
document_chunks (id, document_id, chunk_text, chunk_index, embedding)
chat_history (id, document_id, question, answer, relevant_chunks[], created_at)
```

---

## Code Patterns & Best Practices

### 1. Component Organization
Follow fajb-next patterns:
- `(components)/` for page-specific UI
- `(hooks)/` for custom React hooks
- `(services)/` for business logic
- `actions.ts` for server actions

### 2. Server Actions
All AI calls and database operations use Next.js Server Actions:

```typescript
// actions.ts
'use server'

export async function generateStoryAction(formData: StoryFormData) {
  // Validation
  const validated = storySchema.parse(formData);

  // AI call
  const story = await StoryService.generate(validated);

  // Database save
  await db.insert(stories).values({ ...validated, generated_story: story });

  return { success: true, story };
}
```

### 3. Streaming Responses
Use Server-Sent Events for AI streaming:

```typescript
// Client component
const { data: stream } = useStreamingResponse(formData);
```

### 4. Database Operations
Use Drizzle ORM exclusively:

```typescript
import { db } from '@/lib/db';
import { stories } from '@/repo/schema';

await db.select().from(stories).where(eq(stories.id, id));
```

### 5. LangChain Integration
```typescript
import { ChatAnthropic } from '@langchain/anthropic';
import { PromptTemplate } from '@langchain/core/prompts';

const model = new ChatAnthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
  model: 'claude-3-5-sonnet-20241022',
  streaming: true,
});
```

---

## UI/UX Guidelines

### 1. Dashboard Design
Inspired by fajb-next home page (`/Users/kula/Desktop/Projects/fajb-next/src/app/page.tsx`):
- Card-based layout
- Clear CTA buttons
- Feature highlights
- Dark mode support

### 2. Sidebar Navigation
Simplified version of fajb-next sidebar:
- App logo/title
- Navigation links to three apps
- Theme toggle
- No user profile (no auth)

### 3. Layout Structure
```tsx
<div className="flex h-screen">
  <Sidebar />
  <main className="flex-1 overflow-auto p-6">
    {children}
  </main>
</div>
```

### 4. Color Scheme
- Primary: Blue (stories, default)
- Secondary: Green (emails)
- Accent: Purple (RAG chat)
- Dark mode compatible

---

## Environment Setup

### Required Environment Variables
```bash
# Database
DATABASE_URL=postgresql://postgres:postgres@localhost:5432/ai_preza_demos

# Anthropic Claude
ANTHROPIC_API_KEY=sk-ant-api-key-here

# Optional: OpenAI (for embeddings if not using Anthropic)
OPENAI_API_KEY=sk-openai-key-here

# App Config
NODE_ENV=development
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

### Docker Setup
```yaml
# docker-compose.yml
services:
  postgres:
    image: pgvector/pgvector:pg16
    ports:
      - "5432:5432"
    environment:
      POSTGRES_DB: ai_preza_demos
      POSTGRES_USER: postgres
      POSTGRES_PASSWORD: postgres
    volumes:
      - postgres_data:/var/lib/postgresql/data
```

---

## Development Workflow

### 1. Initial Setup
```bash
cd ai-preza-demos
npm install
cp .env.example .env
docker compose up -d
npm run db:migrate
npm run dev
```

### 2. Database Migrations
```bash
# Generate migration
npm run db:generate

# Apply migration
npm run db:migrate

# Studio (visual DB browser)
npm run db:studio
```

### 3. Development Server
```bash
npm run dev  # http://localhost:3000
```

---

## DO's and DON'Ts

### ✅ DO:
- Keep it simple - these are demos
- Reuse UI patterns from fajb-next
- Use route groups for organization
- Implement streaming for AI responses
- Add loading states and error handling
- Make it responsive
- Support dark mode
- Use TypeScript strictly

### ❌ DON'T:
- Copy authentication code from fajb-next
- Add complex user management
- Over-engineer solutions
- Use external component libraries (except icons)
- Add features not in the spec
- Forget error boundaries
- Skip input validation
- Hardcode API keys

---

## Testing Strategy

### Unit Tests
- AI service functions
- Database operations
- Form validation

### Integration Tests
- Server actions
- Full user flows
- Database migrations

### E2E Tests (Optional)
- Critical paths only
- Story generation
- Email creation
- RAG Q&A

---

## Performance Considerations

1. **Streaming**: Always stream AI responses for better UX
2. **Caching**: Cache embeddings and documents
3. **Chunking**: Optimal chunk size for RAG (500-1000 tokens)
4. **Indexing**: Proper database indexes on foreign keys
5. **Vector Search**: Use HNSW index for pgvector

---

## Common Patterns to Copy from fajb-next

### 1. Sidebar Component
Location: `/Users/kula/Desktop/Projects/fajb-next/src/app/(commonFeature)/(commonModules)/Sidebar/Sidebar.tsx`

**Copy**: Structure, styling, icon usage
**Remove**: User authentication, UserProfile component

### 2. Layout Pattern
Location: `/Users/kula/Desktop/Projects/fajb-next/src/app/layout.tsx`

**Copy**: ThemeProvider, Toaster, basic structure
**Remove**: SessionGuard, QueryProvider (add if needed), auth-related code

### 3. Dashboard Cards
Location: `/Users/kula/Desktop/Projects/fajb-next/src/app/page.tsx`

**Copy**: Card design, gradient sections, responsive grid
**Adapt**: Create three cards for our three apps

---

## Troubleshooting

### Database Connection Issues
- Check Docker container is running: `docker ps`
- Verify DATABASE_URL in `.env`
- Test connection: `npm run db:studio`

### AI API Errors
- Verify ANTHROPIC_API_KEY is set
- Check API quota/limits
- Review error messages from LangChain

### Vector Search Not Working
- Ensure pgvector extension is installed
- Check embedding dimensions match
- Verify index creation

---

## Project Status Tracking

Refer to `TODO.md` for:
- Current phase
- Completed tasks
- Pending tasks
- Known blockers

---

## Questions to Ask User

Before implementing a feature:
1. Clarify multi-step form requirements
2. Confirm AI model choice (Claude 3.5 Sonnet vs Opus)
3. Verify database schema before migration
4. Check UI/UX preferences for complex features

---

## Additional Resources

- **fajb-next reference**: `/Users/kula/Desktop/Projects/fajb-next`
- **Next.js 15 docs**: https://nextjs.org/docs
- **LangChain docs**: https://js.langchain.com/
- **Drizzle ORM**: https://orm.drizzle.team/
- **pgvector**: https://github.com/pgvector/pgvector

---

**Last Updated**: 2025-10-10
**Maintained By**: Claude Code AI Agent
