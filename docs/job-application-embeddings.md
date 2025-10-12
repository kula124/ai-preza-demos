# Job Application Embeddings

This document describes how to manage embeddings for job applications.

## Overview

Job applications are reviewed by n8n agents and stored in the `reviewed_applications` table with a full markdown review. To enable semantic search of these applications, we need to generate vector embeddings of the markdown content.

## Architecture

- **Service**: `ApplicationEmbeddingService` extends `BaseEmbeddingService`
- **Content**: Embeddings are generated from the `fullMarkdownReview` field
- **Storage**: Embeddings are stored in the `application_embeddings` table
- **Model**: OpenAI `text-embedding-3-small` (1536 dimensions)
- **Chunking**: 1000 characters with 200 character overlap

## Manual Embedding

Since n8n populates the database directly, embeddings need to be generated manually after applications are created.

### CLI Commands

#### Check Statistics
```bash
npm run embed-applications -- stats
```

This shows:
- Total applications
- How many have embeddings
- How many need embeddings
- Total chunks created
- Average chunks per application

#### Embed Unembed Applications
```bash
npm run embed-applications
```

This will:
1. Find all applications without embeddings
2. Generate embeddings for each application
3. Show progress for each application
4. Report successes and failures
5. Show before/after statistics

### API Endpoints

#### GET /api/jobs/embed-applications
Get embedding statistics

**Response:**
```json
{
  "success": true,
  "stats": {
    "totalApplications": 10,
    "embeddedApplications": 7,
    "unembeddedApplications": 3,
    "totalChunks": 21
  }
}
```

#### POST /api/jobs/embed-applications
Trigger embedding of all unembed applications

**Response:**
```json
{
  "success": true,
  "message": "Successfully embedded 3 applications",
  "processed": 3,
  "errors": [],
  "statsBefore": {
    "totalApplications": 10,
    "embeddedApplications": 7,
    "unembeddedApplications": 3,
    "totalChunks": 21
  },
  "statsAfter": {
    "totalApplications": 10,
    "embeddedApplications": 10,
    "unembeddedApplications": 0,
    "totalChunks": 30
  }
}
```

## Programmatic Usage

```typescript
import { ApplicationEmbeddingService } from "@/services/ApplicationEmbeddingService";

const service = new ApplicationEmbeddingService();

// Get statistics
const stats = await service.getEmbeddingStats();
console.log(`${stats.unembeddedApplications} applications need embedding`);

// Find unembed applications
const unembed = await service.findUnembeddedApplications();
console.log("Unembed applications:", unembed);

// Embed all unembed applications
const result = await service.embedUnembeddedApplications();
console.log(`Embedded ${result.processed} applications`);
console.log(`Errors: ${result.errors.length}`);

// Embed a specific application
await service.embedEntity(applicationId, markdownReview);

// Check if an application has embeddings
const hasEmbeddings = await service.hasEmbeddings(applicationId);

// Search for similar applications
const similar = await service.similaritySearch("Python developer with React experience", 5);
```

## Workflow

### When n8n Creates New Applications

1. n8n agent reviews application and creates record in `reviewed_applications`
2. Run `npm run embed-applications -- stats` to check for unembed applications
3. Run `npm run embed-applications` to generate embeddings
4. Applications are now searchable via the chat agent

### Automated Option

You can set up a cron job or scheduled task to periodically check for and embed new applications:

```bash
# Run every hour
0 * * * * cd /path/to/project && npm run embed-applications
```

Or trigger via n8n workflow after creating an application:
1. Create application in database
2. HTTP Request to POST `/api/jobs/embed-applications`

## Troubleshooting

### Rate Limiting

If you hit OpenAI rate limits:
- The service includes a 500ms delay between chunks
- Reduce batch size by embedding applications one at a time
- Check your OpenAI API quota

### Failed Embeddings

If embedding fails for specific applications:
- Check the error message in the CLI output or API response
- Verify the `fullMarkdownReview` field contains valid text
- Ensure the text is not empty or too short (< 10 characters)
- Check OpenAI API key is valid

### Re-embedding

To re-embed an application:
```typescript
const service = new ApplicationEmbeddingService();
await service.reEmbedEntity(applicationId, markdownReview);
```

This will delete old embeddings and create new ones.

## Database Schema

### reviewed_applications
- `id`: serial primary key
- `candidate_name`: text (required)
- `date_reviewed`: timestamp (required)
- `overall_score`: integer (required)
- `full_markdown_review`: text (required) - **This is what gets embedded**
- `created_at`: timestamp

### application_embeddings
- `id`: serial primary key
- `application_id`: integer FK to `reviewed_applications`
- `chunk_text`: text (the chunked portion of markdown)
- `chunk_index`: integer (order of chunk)
- `section_type`: text (optional metadata)
- `embedding`: vector(1536) (the vector embedding)
