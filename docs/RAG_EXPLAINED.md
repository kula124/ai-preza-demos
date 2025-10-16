# RAG Architecture Deep Dive

## What is RAG? (Retrieval-Augmented Generation)

RAG solves a fundamental problem with Large Language Models (LLMs): **they don't know about your specific documents or data**.

### The Problem RAG Solves

**Without RAG:**
```
User: "What's our company's remote work policy?"
AI: "I don't have access to your company's specific policies."
```

**With RAG:**
```
User: "What's our company's remote work policy?"
System: [Searches company handbook, finds relevant section]
AI: "According to your company handbook, employees can work remotely
     up to 3 days per week with manager approval..."
```

### How RAG Works (5 Steps)

```
┌─────────────────────────────────────────────────────────┐
│  1. INGESTION: Process & Store Documents                │
│                                                          │
│  Document → Split into chunks → Create embeddings       │
│                               → Store in vector DB      │
└─────────────────────────────────────────────────────────┘
                          ↓
┌─────────────────────────────────────────────────────────┐
│  2. USER ASKS QUESTION                                   │
│                                                          │
│  "What's the travel expense policy?"                     │
└─────────────────────────────────────────────────────────┘
                          ↓
┌─────────────────────────────────────────────────────────┐
│  3. RETRIEVAL: Find Relevant Information                │
│                                                          │
│  Question → Create embedding → Search vector DB         │
│                              → Get top matching chunks  │
└─────────────────────────────────────────────────────────┘
                          ↓
┌─────────────────────────────────────────────────────────┐
│  4. AUGMENTATION: Build Context                         │
│                                                          │
│  Retrieved chunks → Format as context                    │
│                  → Add to prompt                        │
└─────────────────────────────────────────────────────────┘
                          ↓
┌─────────────────────────────────────────────────────────┐
│  5. GENERATION: AI Generates Answer                     │
│                                                          │
│  Context + Question → Send to LLM                       │
│                    → Get answer with citations          │
└─────────────────────────────────────────────────────────┘
```

## RAG Implementation in This Project

### 1. Document Ingestion Pipeline

**File**: `src/services/RAGService.ts`

#### Step 1.1: Upload & Parse

```typescript
static async processDocument(file: File) {
  // Save file to uploads directory
  const filePath = path.join(process.cwd(), "uploads", fileName);
  await fs.writeFile(filePath, Buffer.from(arrayBuffer));

  // Extract text from PDF using pdf-parse library
  const fullText = await extractPDFText(filePath);
  // fullText = "Chapter 1: Introduction\n\nThis document..."
}
```

**What happens:**
- User uploads `company_handbook.pdf`
- System saves it to `uploads/1234567890_company_handbook.pdf`
- PDF parser reads the PDF and extracts all text
- Result: Plain text string with entire document content

#### Step 1.2: Store Document Record

```typescript
const [document] = await getDb()
  .insert(documents)
  .values({
    filename: "company_handbook.pdf",
    fileType: "pdf",
    content: fullText,  // Full document text
  })
  .returning();

// document.id = 1
```

**Database - documents table:**
| id | filename              | fileType | content                | uploadDate |
|----|-----------------------|----------|------------------------|------------|
| 1  | company_handbook.pdf  | pdf      | "Chapter 1: Intro..." | 2024-01-15 |

#### Step 1.3: Chunk the Document

**Why chunk?**
- LLMs have token limits (can't send entire 100-page document)
- Embeddings work better on focused text snippets
- Enables precise retrieval (get relevant paragraphs, not whole doc)

```typescript
const textSplitter = new RecursiveCharacterTextSplitter({
  chunkSize: 1000,      // ~1000 characters per chunk (≈200 words)
  chunkOverlap: 200,    // 200 char overlap between chunks for context
  separators: ["\n\n", "\n", ". ", " ", ""]  // Split on natural boundaries
});

const chunks = await textSplitter.createDocuments([fullText]);
```

**Example chunking:**

**Original text:**
```
Chapter 1: Remote Work Policy

Employees may work remotely up to 3 days per week.
Manager approval is required. Equipment will be provided.

Chapter 2: Travel Policy

Travel expenses must be pre-approved...
```

**After chunking:**
```javascript
[
  {
    pageContent: "Chapter 1: Remote Work Policy\n\nEmployees may work remotely up to 3 days per week. Manager approval is required. Equipment will be provided.",
    metadata: {}
  },
  {
    pageContent: "Equipment will be provided.\n\nChapter 2: Travel Policy\n\nTravel expenses must be pre-approved...",
    metadata: {}
  }
]
```

Notice chunk 2 includes "Equipment will be provided" from chunk 1 (the overlap). This preserves context.

#### Step 1.4: Create Embeddings

**What are embeddings?**
Embeddings convert text into vectors (arrays of numbers) that capture semantic meaning.

```typescript
const embeddings = new OpenAIEmbeddings({
  modelName: "text-embedding-3-small"  // Creates 1536-dimensional vectors
});

for (const chunk of chunks) {
  const embedding = await embeddings.embedQuery(chunk.pageContent);
  // embedding = [0.123, -0.456, 0.789, ..., 0.321]  (1536 numbers)
}
```

**How embeddings work:**

Similar text → Similar vectors
```
"dog"      → [0.2, 0.8, 0.1, ...]
"puppy"    → [0.21, 0.79, 0.11, ...]  ← Very similar numbers!
"car"      → [0.7, 0.1, 0.9, ...]     ← Completely different

"remote work policy"    → [0.4, 0.6, 0.2, ...]
"work from home rules"  → [0.41, 0.61, 0.19, ...]  ← Similar!
"vacation days"         → [0.1, 0.2, 0.8, ...]     ← Different
```

Mathematically, the distance between vectors indicates semantic similarity:
- Small distance = Similar meaning
- Large distance = Different meaning

#### Step 1.5: Store Chunks with Embeddings

```typescript
const chunkRecords = chunks.map((chunk, index) => ({
  documentId: document.id,
  chunkText: chunk.pageContent,
  chunkIndex: index,
  embedding: embedding  // PostgreSQL pgvector stores this as vector type
}));

await getDb().insert(documentChunks).values(chunkRecords);
```

**Database - document_chunks table:**
| id | document_id | chunk_text                | chunk_index | embedding              |
|----|-------------|---------------------------|-------------|------------------------|
| 1  | 1           | "Chapter 1: Remote..."    | 0           | [0.4, 0.6, 0.2, ...]  |
| 2  | 1           | "Equipment will be..."    | 1           | [0.39, 0.58, 0.21, ...] |
| 3  | 1           | "Chapter 2: Travel..."    | 2           | [0.7, 0.3, 0.5, ...]  |

### 2. Query & Retrieval Pipeline

**File**: `src/services/RAGService.ts`

#### Step 2.1: User Asks Question

```typescript
// User input
const question = "Can I work from home?";
```

#### Step 2.2: Convert Question to Embedding

```typescript
const queryEmbedding = await embeddings.embedQuery(question);
// queryEmbedding = [0.41, 0.59, 0.21, ...]  (1536 numbers)
```

**Key insight**: The question "Can I work from home?" gets converted to a vector very similar to the chunk about remote work!

```
Question: "Can I work from home?"
  → Embedding: [0.41, 0.59, 0.21, ...]

Chunk 1: "Remote Work Policy... work remotely up to 3 days..."
  → Embedding: [0.4, 0.6, 0.2, ...]     ← VERY CLOSE! (distance ≈ 0.02)

Chunk 3: "Travel expenses must be pre-approved..."
  → Embedding: [0.7, 0.3, 0.5, ...]     ← Far away (distance ≈ 0.45)
```

#### Step 2.3: Vector Similarity Search (pgvector)

```typescript
const embeddingString = `[${queryEmbedding.join(",")}]`;

const results = await getDb().execute(sql`
  SELECT
    d.content,
    d.id as document_id,
    d.filename,
    MAX(1 - (dc.embedding <=> ${embeddingString}::vector)) as best_similarity
  FROM document_chunks dc
  JOIN documents d ON dc.document_id = d.id
  GROUP BY d.id, d.filename, d.content
  ORDER BY best_similarity DESC
  LIMIT 3
`);
```

**What's happening:**
1. `dc.embedding <=> ${embeddingString}::vector` - Cosine distance operator
   - `<=>` calculates distance between two vectors
   - Returns 0 for identical vectors, 1 for completely different
2. `1 - (distance)` converts to similarity score
   - 1 = perfect match, 0 = no match
3. `ORDER BY best_similarity DESC` - Most similar chunks first
4. `LIMIT 3` - Get top 3 most relevant chunks

**Results:**
```javascript
[
  {
    content: "Chapter 1: Remote Work Policy...",
    document_id: 1,
    filename: "company_handbook.pdf",
    best_similarity: 0.95  // 95% similar!
  },
  {
    content: "Chapter 5: Equipment Policy...",
    document_id: 1,
    filename: "company_handbook.pdf",
    best_similarity: 0.73
  }
]
```

### 3. Answer Generation with Claude

**File**: `src/services/RAGService.ts`

#### Step 3.1: Build Context from Retrieved Chunks

```typescript
const contextText = results
  .map((r, idx) =>
    `[Source ${idx + 1}: ${r.filename}]\n${r.content}\n`
  )
  .join("\n---\n\n");

// Formatted context:
// [Source 1: company_handbook.pdf]
// Chapter 1: Remote Work Policy
// Employees may work remotely up to 3 days per week...
// ---
// [Source 2: company_handbook.pdf]
// Chapter 5: Equipment Policy...
```

#### Step 3.2: Create Prompt with Context

```typescript
const prompt = `You are a helpful AI assistant. Answer the user's question based on the provided context from their documents.

Context from documents:
${contextText}

User Question: ${question}

Instructions:
- Answer based ONLY on the provided context
- If the context doesn't contain relevant information, say so
- Cite sources using [Source X] notation
- Be concise and accurate`;
```

**Full prompt sent to Claude:**
```
You are a helpful AI assistant. Answer the user's question based on the provided context from their documents.

Context from documents:
[Source 1: company_handbook.pdf]
Chapter 1: Remote Work Policy

Employees may work remotely up to 3 days per week.
Manager approval is required. Equipment will be provided.

---

[Source 2: company_handbook.pdf]
Chapter 5: Equipment Policy
Company-provided laptops are available for remote work...

User Question: Can I work from home?

Instructions:
- Answer based ONLY on the provided context
- If the context doesn't contain relevant information, say so
- Cite sources using [Source X] notation
- Be concise and accurate
```

#### Step 3.3: Call Claude API

```typescript
const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

const message = await anthropic.messages.create({
  model: "claude-3-7-sonnet-20250219",
  max_tokens: 1500,
  messages: [{ role: "user", content: prompt }],
});

const answer = message.content[0].text;
```

**Claude's response:**
```
Yes, you can work from home! According to [Source 1], employees may work
remotely up to 3 days per week, but manager approval is required. The company
will provide equipment for remote work [Source 1, Source 2].
```

#### Step 3.4: Stream Response (Real-time)

For better UX, we can stream the response word-by-word:

```typescript
const stream = await anthropic.messages.stream({
  model: "claude-3-7-sonnet-20250219",
  max_tokens: 1500,
  messages: [{ role: "user", content: prompt }],
});

// Stream back to user
for await (const chunk of stream) {
  if (chunk.type === 'content_block_delta') {
    yield chunk.delta.text;  // Send each word as it's generated
  }
}
```

**User sees:**
```
Yes, you can work from home! According to
```
→ (200ms delay)
```
[Source 1], employees may work remotely up to
```
→ (200ms delay)
```
3 days per week, but manager approval is required...
```

## Vector Similarity Deep Dive

### What is Cosine Similarity?

Cosine similarity measures the angle between two vectors:
- Same direction (angle = 0°) → Similarity = 1 (identical)
- Perpendicular (angle = 90°) → Similarity = 0 (unrelated)
- Opposite direction (angle = 180°) → Similarity = -1 (opposites)

```
Vector A: "remote work"  → [0.8, 0.6]
Vector B: "work from home" → [0.7, 0.7]

                    ↑ B
                   /|
                  / |
                 /  |
                /   |
            A  /    |
              /_____|_____→

Angle ≈ 10° → Cosine similarity ≈ 0.98 (very similar!)
```

### pgvector Operators

PostgreSQL with pgvector extension provides three distance operators:

1. **`<->` (Euclidean distance)** - Straight-line distance
2. **`<=>` (Cosine distance)** - 1 - cosine similarity (we use this!)
3. **`<#>` (Inner product)** - Dot product

**Why cosine distance?**
- Works best for text embeddings
- Ignores magnitude, only cares about direction
- "dog" and "puppy" point in similar directions → high similarity

### Embedding Model: text-embedding-3-small

**Specs:**
- Dimensions: 1536
- Model: OpenAI's text-embedding-3-small
- Cost: $0.02 per 1M tokens
- Speed: ~500ms per embedding

**What each dimension represents:**
- Each of 1536 numbers captures a different aspect of meaning
- Dim 234 might capture "animal-related" concepts
- Dim 891 might capture "positive sentiment"
- Dim 1402 might capture "formal vs casual"
- Combined, they create a unique "fingerprint" of the text

## Advanced RAG Techniques Used

### 1. Chunking Strategy

**RecursiveCharacterTextSplitter**:
```typescript
{
  chunkSize: 1000,
  chunkOverlap: 200,
  separators: ["\n\n", "\n", ". ", " ", ""]
}
```

**How it works:**
1. Try to split on `\n\n` (paragraphs)
2. If chunk still too large, try `\n` (lines)
3. If still too large, try `. ` (sentences)
4. If still too large, try ` ` (words)
5. Last resort: split by character

**Why overlap?**
- Preserves context across chunk boundaries
- "...provides equipment. Manager approval required..."
  - Chunk 1 ends: "...provides equipment."
  - Chunk 2 starts: "provides equipment. Manager approval required..."
  - Query "who approves equipment?" finds chunk 2!

### 2. Retry Logic with Exponential Backoff

```typescript
let retries = 3;
let delay = 500;

while (retries > 0) {
  try {
    embedding = await embeddings.embedQuery(text);
    break;  // Success!
  } catch (error) {
    retries--;
    await sleep(delay);
    delay *= 2;  // 500ms → 1000ms → 2000ms
  }
}
```

**Handles:**
- Rate limiting (too many requests)
- Network errors
- Temporary API outages

### 3. Text Cleaning

```typescript
const cleanText = chunk.pageContent
  .replace(/[\u200B-\u200D\uFEFF]/g, "")  // Remove zero-width chars
  .replace(/\s+/g, " ")                   // Normalize whitespace
  .trim();

if (cleanText.length < 10) {
  continue;  // Skip empty/tiny chunks
}
```

**Prevents:**
- Embedding whitespace-only chunks
- Wasting API calls on junk data
- Polluting vector store with useless entries

### 4. Grouping Results by Document

```sql
SELECT
  d.content,
  d.id as document_id,
  MAX(1 - (dc.embedding <=> ${embedding}::vector)) as best_similarity
FROM document_chunks dc
JOIN documents d ON dc.document_id = d.id
GROUP BY d.id  -- Group by document
ORDER BY best_similarity DESC
```

**Why group?**
- Prevents returning 5 chunks from same document
- Ensures diversity in results
- Shows best match per document

## RAG in Different Features

### 1. RAG Chat (Documents)

**Purpose**: Q&A over uploaded PDFs
**Embeddings table**: `document_chunks`
**Implementation**: `src/services/RAGService.ts`

```typescript
// Upload PDF → Extract text → Chunk → Embed → Store
await RAGService.processDocument(pdfFile);

// Query → Embed → Search → Generate answer
const results = await RAGService.similaritySearch(question);
const answer = await RAGService.generateAnswer(question, results);
```

### 2. Story Search (Bedtime Stories)

**Purpose**: Find stories by theme/character
**Embeddings table**: `story_embeddings`
**Implementation**: `src/services/StoryEmbeddingService.ts`

```typescript
class StoryEmbeddingService extends BaseEmbeddingService {
  protected getEmbeddingsTable() { return storyEmbeddings; }
  protected getEntityTable() { return stories; }
}

// Generate story → Embed story → Store
await storyService.embedEntity(storyId, generatedStory);

// Search stories
const results = await storyService.similaritySearch("brave princess");
```

### 3. Application Matching (Jobs)

**Purpose**: Match candidates to positions
**Embeddings table**: `application_embeddings`
**Implementation**: `src/services/ApplicationEmbeddingService.ts`

```typescript
// Embed job application
await appService.embedEntity(applicationId, resumeText);

// Find candidates with Python skills
const matches = await appService.similaritySearch("Python Django AWS");
```

## Common RAG Challenges & Solutions

### Challenge 1: Large Documents

**Problem**: 500-page PDF creates 5000 chunks
**Solution**:
- Batch processing with delays
- Background jobs (for production)
- Progress tracking

### Challenge 2: Rate Limiting

**Problem**: OpenAI API limits requests
**Solution**:
```typescript
if (index > 0) {
  await sleep(500);  // 500ms delay between requests
}
```

### Challenge 3: Low-Quality Retrieval

**Problem**: Wrong chunks retrieved
**Solutions**:
- Better chunking (smaller/larger chunks)
- Query reformulation (rephrase question)
- Hybrid search (vector + keyword)
- Re-ranking (score results again)

### Challenge 4: Hallucination

**Problem**: AI makes up facts not in context
**Solution**:
```typescript
const prompt = `
Instructions:
- Answer based ONLY on the provided context
- If the context doesn't contain relevant information, say so clearly
- Do not make assumptions or add external knowledge
- Cite sources using [Source X] notation
`;
```

## Performance Optimization

### 1. Connection Pooling

```typescript
// lib/db.ts
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  max: 20,  // Max 20 concurrent connections
});
```

### 2. Indexing

```sql
-- Create index on embeddings for faster search
CREATE INDEX ON document_chunks USING ivfflat (embedding vector_cosine_ops)
WITH (lists = 100);
```

### 3. Caching

**Strategy**: Cache embeddings for common queries
```typescript
const cache = new Map<string, number[]>();

async function getEmbedding(text: string) {
  if (cache.has(text)) {
    return cache.get(text);
  }
  const embedding = await embeddings.embedQuery(text);
  cache.set(text, embedding);
  return embedding;
}
```

## Testing RAG

### Test 1: Relevance Test

```typescript
// Upload known document
await RAGService.processDocument(testPDF);

// Query with expected answer
const results = await RAGService.similaritySearch("remote work policy");

// Verify correct chunks retrieved
expect(results[0].content).toContain("work remotely");
```

### Test 2: Accuracy Test

```typescript
const answer = await RAGService.generateAnswer(
  "How many remote days allowed?",
  retrievedChunks
);

expect(answer).toMatch(/3 days/);
expect(answer).toMatch(/Source 1/);
```

## Diagram: Complete RAG Flow

```
┌──────────────┐
│ User uploads │
│ document.pdf │
└──────┬───────┘
       │
       ▼
┌──────────────────────────────────────────┐
│ 1. INGESTION PIPELINE                    │
│                                          │
│  ┌─────────┐    ┌──────────┐           │
│  │ Parse   │───→│  Chunk   │           │
│  │ PDF     │    │ (1000ch) │           │
│  └─────────┘    └────┬─────┘           │
│                      │                  │
│                      ▼                  │
│              ┌───────────────┐          │
│              │  Embed chunks │          │
│              │  (OpenAI API) │          │
│              └───────┬───────┘          │
│                      │                  │
│                      ▼                  │
│         ┌────────────────────────┐      │
│         │  Store in PostgreSQL   │      │
│         │  with pgvector         │      │
│         └────────────────────────┘      │
└──────────────────────────────────────────┘
                     │
                     ▼
         ┌───────────────────────┐
         │ Vector DB Ready       │
         │ (3 chunks stored)     │
         └───────────────────────┘
                     │
                     ▼
┌──────────────────────────────────────────┐
│ 2. QUERY PIPELINE                        │
│                                          │
│  User: "What's the remote work policy?"  │
│                      │                   │
│                      ▼                   │
│         ┌──────────────────────┐         │
│         │  Embed question      │         │
│         │  (OpenAI API)        │         │
│         └──────────┬───────────┘         │
│                    │                     │
│                    ▼                     │
│         ┌──────────────────────┐         │
│         │  Vector search       │         │
│         │  (pgvector <=>)      │         │
│         └──────────┬───────────┘         │
│                    │                     │
│                    ▼                     │
│         ┌──────────────────────┐         │
│         │  Get top 3 chunks    │         │
│         └──────────┬───────────┘         │
│                    │                     │
│                    ▼                     │
│         ┌──────────────────────┐         │
│         │  Build prompt with   │         │
│         │  context + question  │         │
│         └──────────┬───────────┘         │
│                    │                     │
│                    ▼                     │
│         ┌──────────────────────┐         │
│         │  Send to Claude AI   │         │
│         └──────────┬───────────┘         │
│                    │                     │
│                    ▼                     │
│         ┌──────────────────────┐         │
│         │  Stream response     │         │
│         │  to user             │         │
│         └──────────────────────┘         │
└──────────────────────────────────────────┘
```

## Next Steps

- **Read**: `docs/LANGCHAIN_GUIDE.md` - Learn how LangChain powers this
- **Read**: `docs/AI_INTEGRATION.md` - Claude and OpenAI API details
- **Read**: `docs/REUSABLE_PATTERNS.md` - Extract for your project

## Summary

**RAG = Smart Document Q&A**

1. **Upload** document → **Parse** → **Chunk** → **Embed** → **Store**
2. **Question** → **Embed** → **Search** → **Retrieve** → **Generate**

**Key Technologies:**
- **LangChain**: Text splitting, embeddings API
- **OpenAI**: text-embedding-3-small (vectors)
- **pgvector**: Vector storage & similarity search
- **Claude**: Answer generation from context

**Why it works:**
- Embeddings capture semantic meaning
- Vector search finds relevant info fast
- Claude generates accurate answers with context

You now understand how this project turns uploaded PDFs into a smart Q&A system! 🎉
