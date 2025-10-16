# AI Preza Demos

Four AI-powered demo applications built with Next.js 15, TypeScript, Anthropic Claude, and LangChain.

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

### 4. Jobs Application Reviewer
AI-powered candidate matching system that analyzes job applications and matches them to open positions using semantic search and vector embeddings.

**Features:**
- Job position management (create, view, edit open positions)
- Application review with AI-powered scoring and analysis
- Vector-based semantic candidate matching using embeddings
- Automated position recommendations based on skills and experience
- LangGraph agent workflows for intelligent application processing
- Application and position tracking dashboard

**Note:** This feature is accessible via the sidebar navigation at `/jobs/positions`

## 🚀 Quick Start

### Prerequisites
- **Node.js 20+** - [Download here](https://nodejs.org/)
- **Docker & Docker Compose** - [Get Docker Desktop](https://www.docker.com/products/docker-desktop/)
- **Anthropic API key** - [Get your API key](https://console.anthropic.com/)
- **Terminal/Command Line** access

### Step-by-Step Installation

#### 1. Clone and Install Dependencies

```bash
# Clone the repository
git clone <repository-url>
cd ai-preza-demos

# Install all npm packages
npm install
```

This will install all dependencies including Next.js, React, TypeScript, Drizzle ORM, LangChain, and AI SDKs.

#### 2. Set Up Environment Variables

```bash
# Copy the example environment file
cp .env.example .env
```

Now open `.env` in your text editor and configure the following:

```bash
# Database - Choose ONE option:

# Option 1: Local Docker PostgreSQL (default for local development)
DATABASE_URL=postgresql://postgres:postgres@localhost:5433/ai_preza_demos

# Option 2: Remote Database (Supabase, Neon, etc.)
# DATABASE_URL=postgresql://user:password@host:port/database

# Required: Get your API key from https://console.anthropic.com/
ANTHROPIC_API_KEY=sk-ant-api03-YOUR-KEY-HERE

# Optional: Only needed if you want to use OpenAI for embeddings
OPENAI_API_KEY=sk-YOUR-KEY-HERE

# Optional: For Voyage AI embeddings
# VOYAGE_API_KEY=pa-YOUR-VOYAGE-KEY

# Application
NODE_ENV=development
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

**Important:**
- Replace `YOUR-KEY-HERE` with your actual Anthropic API key
- Choose the appropriate DATABASE_URL for your setup (local Docker or remote database)

#### 3. Start the PostgreSQL Database

**If using local Docker database (Option 1):**

```bash
# Start PostgreSQL with pgvector extension
docker compose up -d postgres

# Verify the database is running
docker ps
```

You should see a container named `ai-preza-postgres` in the running state.

**If using remote database (Option 2 - Supabase, Neon, etc.):**

Skip this step - your database is already running remotely. Make sure your `DATABASE_URL` in `.env` is correctly configured.

**Troubleshooting:**
- If port 5433 is already in use, edit `docker-compose.yml` to change the port
- Run `docker compose logs postgres` to see database logs if issues occur
- For remote databases, verify the connection string and ensure your IP is whitelisted

#### 4. Initialize the Database

```bash
# Run Drizzle migrations to create all tables
npm run db:migrate
```

This creates all necessary tables including:
- `stories` and `storyEmbeddings` (Bedtime Story feature)
- `emails` (Email Helper feature)
- `documents`, `documentChunks`, `chatHistory` (RAG Chat feature)
- `openPositions`, `reviewedApplications`, `applicationEmbeddings`, `applicationPositionMatches` (Jobs feature)

**Optional:** Seed job positions data
```bash
npm run seed-positions
```

#### 5. Start the Development Server

```bash
# Start Next.js development server
npm run dev
```

You should see output like:
```
  ▲ Next.js 15.5.4
  - Local:        http://localhost:3000
  - Ready in 2.1s
```

#### 6. Access the Application

Open your browser and navigate to:
```
http://localhost:3000
```

You should see the AI Preza Demos dashboard with three featured applications:
1. Bedtime Story Writer
2. Email Helper
3. RAG Chat

The Jobs Application Reviewer feature is accessible via the sidebar navigation on the left.

### Verify Installation

Test each feature to ensure everything is working:

1. **Bedtime Story Writer** - Try generating a short story
2. **Email Helper** - Create a test email
3. **RAG Chat** - Upload a small text file and ask a question
4. **Jobs** - View the jobs dashboard (requires seeded data)

## 🐳 Docker Deployment

### Full Stack Deployment

You can run the entire application stack (database + app) using Docker:

```bash
# Build and start both services
docker compose up -d

# View logs
docker compose logs -f

# Stop all services
docker compose down
```

This will:
1. Start PostgreSQL with pgvector on port 5433
2. Build the Next.js application as a Docker image
3. Run the app on port 3000

**Environment Variables for Docker:**
Make sure your `.env` file contains:
- `ANTHROPIC_API_KEY` - Your Anthropic API key
- `OPENAI_API_KEY` - (Optional) Your OpenAI API key
- `VOYAGE_API_KEY` - (Optional) Your Voyage AI API key

The docker-compose configuration will automatically:
- Connect the app to the PostgreSQL database
- Mount necessary volumes for data persistence
- Set up networking between services

**Note:** The Dockerfile includes poppler-utils for PDF processing, ensuring full RAG Chat functionality.

## 🔧 Troubleshooting

### Database Connection Issues

**Problem:** Cannot connect to database
```bash
# Check if PostgreSQL is running
docker ps

# Restart the database
docker compose down
docker compose up -d

# Check logs
docker compose logs postgres
```

### Port Already in Use

**Problem:** Port 3000 or 5433 already in use

```bash
# For Next.js (port 3000)
npm run dev -- -p 3001

# For PostgreSQL (port 5433)
# Edit docker-compose.yml and change "5433:5432" to "5434:5432"
# Then update DATABASE_URL in .env to use port 5434
```

### Missing API Key

**Problem:** "ANTHROPIC_API_KEY is not set" error

Make sure your `.env` file exists and contains:
```bash
ANTHROPIC_API_KEY=sk-ant-api03-...
```

Restart the dev server after updating `.env`.

### Migration Issues

**Problem:** Tables don't exist or migration fails

```bash
# Drop and recreate migrations
npm run db:push

# Or manually reset (WARNING: deletes all data)
docker compose down -v
docker compose up -d
npm run db:migrate
```

## 🗄️ Database Management

### Available Commands

```bash
# Start database in background
docker compose up -d

# Stop database
docker compose down

# Stop and remove volumes (deletes all data)
docker compose down -v

# View database logs
docker compose logs -f postgres

# Generate new migration after schema changes
npm run db:generate

# Apply pending migrations
npm run db:migrate

# Push schema directly (development only)
npm run db:push

# Open Drizzle Studio - visual database browser
npm run db:studio
# Then visit: https://local.drizzle.studio
```

### Accessing PostgreSQL Directly

```bash
# Connect via psql
docker exec -it ai-preza-postgres psql -U postgres -d ai_preza_demos

# View all tables
\dt

# Query example
SELECT * FROM stories LIMIT 5;

# Exit
\q
```

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

For detailed architecture information, see **[ARCHITECTURE.md](./ARCHITECTURE.md)**

## 📁 Project Structure

```
src/
├── app/
│   ├── (common)/              # Shared components
│   │   └── (components)/
│   │       └── Sidebar.tsx    # Navigation sidebar
│   ├── (bedtimeStory)/        # Bedtime Story Writer
│   │   ├── bedtime-story/     # Story creation
│   │   ├── story-library/     # Story library view
│   │   └── story/[id]/        # Individual story page
│   ├── (emailHelper)/         # Email Helper
│   │   ├── email-helper/      # Email creation
│   │   └── email-library/     # Email library view
│   ├── (ragChat)/             # RAG Chat
│   │   ├── rag-chat/          # Chat interface
│   │   └── rag-documents/     # Document management
│   ├── (jobs)/                # Jobs Application Reviewer
│   │   └── jobs/
│   │       ├── positions/     # Position management
│   │       └── applications/  # Application review
│   ├── api/                   # API routes
│   │   ├── jobs/              # Jobs API endpoints
│   │   └── rag-chat/          # RAG Chat API endpoints
│   ├── layout.tsx             # Root layout
│   └── page.tsx               # Dashboard homepage
├── components/
│   └── ui/                    # Reusable UI components
├── lib/                       # Utilities & configurations
├── repo/                      # Database schema (Drizzle ORM)
│   └── schema.ts              # All table definitions
├── services/                  # Business logic
└── utils/                     # Helper functions
```

## 🔧 Development

### Available Scripts

```bash
# Development
npm run dev          # Start development server
npm run build        # Build for production
npm run start        # Start production server

# Code Quality
npm run lint         # Run Biome linter
npm run format       # Format code with Biome

# Database
npm run db:generate  # Generate new Drizzle migration
npm run db:migrate   # Run pending migrations
npm run db:push      # Push schema changes (dev only)
npm run db:studio    # Open Drizzle Studio database browser

# Data Seeding
npm run seed-positions      # Seed job positions for Jobs feature
npm run embed-applications  # Generate embeddings for applications
```

### Environment Variables

See `.env.example` for all required environment variables.

**Required:**
- `DATABASE_URL` - PostgreSQL connection string (local or remote)
- `ANTHROPIC_API_KEY` - Your Anthropic API key from https://console.anthropic.com/

**Optional:**
- `OPENAI_API_KEY` - For OpenAI embeddings and models
- `VOYAGE_API_KEY` - For Voyage AI embeddings
- `NODE_ENV` - Environment (development, production)
- `NEXT_PUBLIC_APP_URL` - Application URL (default: http://localhost:3000)

## 📖 Documentation

### Core Documentation
- **[ARCHITECTURE.md](./ARCHITECTURE.md)** - Complete system architecture and design patterns
- **[README.md](./README.md)** - This file - getting started guide

### Feature Documentation
- **[BEDTIME_STORY_APP.md](./BEDTIME_STORY_APP.md)** - Bedtime Story Writer implementation details
- **[EMAIL_HELPER_APP.md](./EMAIL_HELPER_APP.md)** - Email Helper implementation details
- **[RAG_IMPLEMENTATION_STATUS.md](./RAG_IMPLEMENTATION_STATUS.md)** - RAG Chat implementation status
- **[JOBS_FEATURE_TODO.md](./JOBS_FEATURE_TODO.md)** - Jobs feature specifications

### Development Documentation
- **[TODO.md](./TODO.md)** - Detailed task list and specifications
- **[INSTRUCTIONS.md](./INSTRUCTIONS.md)** - Comprehensive guide for AI agents/developers

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
