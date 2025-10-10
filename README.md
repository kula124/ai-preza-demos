# AI Preza Demos

Three AI-powered demo applications built with Next.js 15, TypeScript, Anthropic Claude, and LangChain.

## 📚 Applications

### 1. Bedtime Story Writer
Create personalized bedtime stories for children using AI. Multi-step process with topic selection, age customization, and character trait emphasis.

**Features:**
- Age-appropriate content (2-12 years)
- Topic selection
- Character emphasis (Confidence, Kindness, Bravery, etc.)
- Story library
- Streaming AI responses

### 2. Email Helper ✅
Professional email writing assistant powered by Claude 3.5 Haiku. Transform raw, informal text into polished professional emails with customizable tone and type.

**Features:**
- 5 email types (Professional, Casual, Marketing, Sales, Support)
- 6 tone options (Formal, Friendly, Persuasive, Apologetic, Enthusiastic, Neutral)
- Raw text input (write naturally, AI formats it)
- Rewrite capability (edit inputs and regenerate)
- Subject line + body generation
- Email library with save/delete
- Copy to clipboard

### 3. RAG Chat
Document Q&A using Retrieval-Augmented Generation. Upload PDFs or text files and ask questions with source citations.

**Features:**
- PDF & text file upload
- Vector similarity search (pgvector)
- Source citations
- Chat history
- Streaming responses

## 🚀 Quick Start

### Prerequisites
- Node.js 20+
- Docker & Docker Compose
- Anthropic API key

### Installation

1. **Clone and install dependencies:**
   ```bash
   git clone <repository-url>
   cd ai-preza-demos
   npm install
   ```

2. **Set up environment variables:**
   ```bash
   cp .env.example .env
   # Edit .env and add your ANTHROPIC_API_KEY
   ```

3. **Start the database:**
   ```bash
   docker compose up -d
   ```

4. **Run database migrations:**
   ```bash
   npm run db:migrate
   ```

5. **Start the development server:**
   ```bash
   npm run dev
   ```

6. **Open your browser:**
   Navigate to [http://localhost:3000](http://localhost:3000)

## 🛠️ Tech Stack

- **Framework:** Next.js 15 (App Router)
- **Language:** TypeScript
- **Styling:** Tailwind CSS v4
- **AI:** Anthropic Claude via LangChain
- **Database:** PostgreSQL 16 with pgvector
- **ORM:** Drizzle ORM
- **UI:** Custom components with lucide-react icons
- **Forms:** react-hook-form + zod
- **Notifications:** sonner

## 📁 Project Structure

```
src/
├── app/
│   ├── (common)/              # Shared components
│   │   └── (components)/
│   │       └── Sidebar.tsx
│   ├── (bedtimeStory)/        # Bedtime Story Writer
│   │   └── bedtime-story/
│   ├── (emailHelper)/         # Email Helper
│   │   └── email-helper/
│   ├── (ragChat)/             # RAG Chat
│   │   └── rag-chat/
│   ├── layout.tsx             # Root layout
│   └── page.tsx               # Dashboard
├── components/
│   └── ui/                    # Reusable UI components
├── lib/                       # Utilities & configurations
├── repo/                      # Database schema (Drizzle)
├── services/                  # Business logic
└── utils/                     # Helper functions
```

## 🗄️ Database

This project uses PostgreSQL with the pgvector extension for vector similarity search (RAG functionality).

### Available Commands:

```bash
# Start database
docker compose up -d

# Stop database
docker compose down

# Generate migration
npm run db:generate

# Apply migrations
npm run db:migrate

# Open Drizzle Studio (visual DB browser)
npm run db:studio
```

## 🔧 Development

### Available Scripts

```bash
npm run dev          # Start development server
npm run build        # Build for production
npm run start        # Start production server
npm run lint         # Run Biome linter
npm run format       # Format code with Biome
```

### Environment Variables

See `.env.example` for all required environment variables.

**Required:**
- `DATABASE_URL` - PostgreSQL connection string
- `ANTHROPIC_API_KEY` - Your Anthropic API key

**Optional:**
- `OPENAI_API_KEY` - For OpenAI embeddings (if not using Anthropic)

## 📖 Documentation

- **[TODO.md](./TODO.md)** - Detailed task list and specifications
- **[INSTRUCTIONS.md](./INSTRUCTIONS.md)** - Comprehensive guide for AI agents/developers
- **[BEDTIME_STORY_APP.md](./BEDTIME_STORY_APP.md)** - Bedtime Story Writer implementation details
- **[EMAIL_HELPER_APP.md](./EMAIL_HELPER_APP.md)** - Email Helper implementation details

## 🎨 Features

### Dark Mode
Automatic dark mode support based on system preferences with manual toggle.

### Responsive Design
Fully responsive layout optimized for mobile, tablet, and desktop.

### Streaming Responses
Real-time AI response streaming for better user experience.

### Type Safety
Full TypeScript coverage with strict type checking.

## 🤝 Contributing

This is a demo project. Feel free to fork and customize for your own use.

## 📝 License

MIT

---

Built with ❤️ using Next.js, Claude, and LangChain
