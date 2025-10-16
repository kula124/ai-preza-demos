import { OpenAIEmbeddings } from "@langchain/openai";
import { RecursiveCharacterTextSplitter } from "@langchain/textsplitters";
import { sql, type SQL } from "drizzle-orm";
import type { PgTable } from "drizzle-orm/pg-core";
import { getDb } from "@/lib/db";

/**
 * Base service for handling embeddings across different entity types
 * Provides shared functionality for chunking, embedding, and vector search
 */
export abstract class BaseEmbeddingService {
	private static embeddings = new OpenAIEmbeddings({
		apiKey: process.env.OPENAI_API_KEY,
		modelName: "text-embedding-3-small", // 1536 dimensions
	});

	/**
	 * Get the embeddings table for this service
	 */
	protected abstract getEmbeddingsTable(): PgTable;

	/**
	 * Get the parent entity table for this service
	 */
	protected abstract getEntityTable(): PgTable;

	/**
	 * Get the foreign key column name (e.g., 'storyId', 'applicationId')
	 * This is the TypeScript/Drizzle field name
	 */
	protected abstract getFKColumnName(): string;

	/**
	 * Get the database column name for the foreign key (e.g., 'story_id', 'application_id')
	 * This is the actual SQL column name
	 */
	protected abstract getFKColumnNameDB(): string;

	/**
	 * Get the entity ID column name in the parent table (usually 'id')
	 */
	protected abstract getEntityIdColumnName(): string;

	/**
	 * Get the content field name in the parent table
	 * This is the TypeScript/Drizzle field name
	 */
	protected abstract getContentFieldName(): string;

	/**
	 * Get the database column name for the content field
	 * This is the actual SQL column name
	 */
	protected abstract getContentFieldNameDB(): string;

	/**
	 * Chunk text and generate embeddings
	 */
	protected async chunkAndEmbed(
		content: string,
		chunkSize = 1000,
		chunkOverlap = 200,
	): Promise<Array<{ chunkText: string; embedding: number[] }>> {
		const textSplitter = new RecursiveCharacterTextSplitter({
			chunkSize,
			chunkOverlap,
			separators: ["\n\n", "\n", ". ", " ", ""],
		});

		const chunks = await textSplitter.createDocuments([content]);
		const results: Array<{ chunkText: string; embedding: number[] }> = [];

		for (let index = 0; index < chunks.length; index++) {
			const chunk = chunks[index];

			// Clean text
			const cleanText = chunk.pageContent
				.replace(/[\u200B-\u200D\uFEFF]/g, "")
				.replace(/\s+/g, " ")
				.trim();

			if (cleanText.length < 10) continue;

			// Add delay to avoid rate limiting
			if (index > 0) {
				await new Promise((resolve) => setTimeout(resolve, 500));
			}

			const embedding = await BaseEmbeddingService.embeddings.embedQuery(
				cleanText,
			);

			results.push({
				chunkText: cleanText,
				embedding,
			});
		}

		return results;
	}

	/**
	 * Store embeddings for an entity
	 */
	async embedEntity(entityId: number, content: string): Promise<void> {
		const chunks = await this.chunkAndEmbed(content);

		const chunkRecords = chunks.map((chunk, index) => ({
			[this.getFKColumnName()]: entityId,
			chunkText: chunk.chunkText,
			chunkIndex: index,
			embedding: chunk.embedding,
		}));

		const table = this.getEmbeddingsTable();
		await getDb().insert(table).values(chunkRecords);
	}

	/**
	 * Perform vector similarity search
	 * Returns full entities (not just chunks), grouped by entity
	 */
	async similaritySearch(
		query: string,
		limit = 3,
	): Promise<Array<{ content: string; entityId: number; entity: any; chunkText?: string; similarity?: number }>> {
		const queryEmbedding =
			await BaseEmbeddingService.embeddings.embedQuery(query);
		const embeddingString = `[${queryEmbedding.join(",")}]`;

		const embeddingsTable = this.getEmbeddingsTable();
		const entityTable = this.getEntityTable();
		const fkColumnDB = this.getFKColumnNameDB();
		const entityIdColumn = this.getEntityIdColumnName();
		const contentFieldDB = this.getContentFieldNameDB();

		// Build dynamic SQL query
		const results = await getDb().execute<{
			content: string;
			entity_id: number;
			entity_data: any;
			best_similarity: number;
			chunk_text: string;
		}>(sql`
			SELECT
				e.${sql.identifier(contentFieldDB)} as content,
				e.${sql.identifier(entityIdColumn)} as entity_id,
				row_to_json(e.*) as entity_data,
				MAX(1 - (emb.embedding <=> ${embeddingString}::vector)) as best_similarity,
				(SELECT chunk_text FROM ${embeddingsTable} emb2
					WHERE emb2.${sql.identifier(fkColumnDB)} = e.${sql.identifier(entityIdColumn)}
					ORDER BY (emb2.embedding <=> ${embeddingString}::vector) ASC
					LIMIT 1) as chunk_text
			FROM ${embeddingsTable} emb
			JOIN ${entityTable} e ON emb.${sql.identifier(fkColumnDB)} = e.${sql.identifier(entityIdColumn)}
			GROUP BY e.${sql.identifier(entityIdColumn)}, e.${sql.identifier(contentFieldDB)}
			ORDER BY best_similarity DESC
			LIMIT ${limit}
		`);

		return results.rows.map((row) => ({
			content: row.content,
			entityId: row.entity_id,
			entity: row.entity_data,
			chunkText: row.chunk_text,
			similarity: row.best_similarity,
		}));
	}

	/**
	 * Delete embeddings for an entity
	 */
	async deleteEmbeddings(entityId: number): Promise<void> {
		const table = this.getEmbeddingsTable();
		const fkColumnDB = this.getFKColumnNameDB();

		await getDb().execute(sql`
			DELETE FROM ${table}
			WHERE ${sql.identifier(fkColumnDB)} = ${entityId}
		`);
	}

	/**
	 * Re-embed an entity (delete old embeddings and create new ones)
	 */
	async reEmbedEntity(entityId: number, content: string): Promise<void> {
		await this.deleteEmbeddings(entityId);
		await this.embedEntity(entityId, content);
	}
}
