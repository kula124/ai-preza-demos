import { OpenAIEmbeddings } from "@langchain/openai";
import { RecursiveCharacterTextSplitter } from "@langchain/textsplitters";
import { db } from "@/lib/db";
import { sql } from "drizzle-orm";
import type { PgTable } from "drizzle-orm/pg-core";

/**
 * Base class for embedding services
 * Provides common functionality for generating and storing embeddings
 */
export abstract class BaseEmbeddingService {
	private static getEmbeddings() {
		const apiKey = process.env.OPENAI_API_KEY;
		if (!apiKey) {
			throw new Error("OPENAI_API_KEY is not configured in environment variables");
		}

		return new OpenAIEmbeddings({
			apiKey: apiKey,
			modelName: "text-embedding-3-small", // 1536 dimensions
		});
	}

	protected static embeddings = BaseEmbeddingService.getEmbeddings();

	/**
	 * Abstract methods that child classes must implement
	 */
	protected abstract getEmbeddingsTable(): PgTable;
	protected abstract getEntityTable(): PgTable;
	protected abstract getFKColumnName(): string;
	protected abstract getFKColumnNameDB(): string;
	protected abstract getEntityIdColumnName(): string;
	protected abstract getContentFieldName(): string;
	protected abstract getContentFieldNameDB(): string;

	/**
	 * Embed a single entity (story, application, etc.)
	 * Chunks the content and generates embeddings for each chunk
	 */
	async embedEntity(entityId: number, content: string): Promise<void> {
		try {
			// Validate content
			if (!content || content.trim().length < 10) {
				throw new Error("Content is too short or empty");
			}

			// 1. Chunk the content
			const textSplitter = new RecursiveCharacterTextSplitter({
				chunkSize: 1000,
				chunkOverlap: 200,
				separators: ["\n\n", "\n", ". ", " ", ""],
			});

			const chunks = await textSplitter.createDocuments([content]);
			console.log(`Created ${chunks.length} chunks for entity ${entityId}`);

			// 2. Generate embeddings for each chunk
			const chunkRecords = [];
			for (let index = 0; index < chunks.length; index++) {
				const chunk = chunks[index];
				try {
					// Add delay to avoid rate limiting
					if (index > 0) {
						await new Promise((resolve) => setTimeout(resolve, 500));
					}

					// Clean the text
					const cleanText = chunk.pageContent
						.replace(/[\u200B-\u200D\uFEFF]/g, "")
						.replace(/\s+/g, " ")
						.trim();

					if (!cleanText || cleanText.length < 10) {
						console.log(`Skipping chunk ${index + 1}: too short or empty`);
						continue;
					}

					// Generate embedding
					const embedding = await BaseEmbeddingService.embeddings.embedQuery(cleanText);

					if (!Array.isArray(embedding) || embedding.length === 0) {
						throw new Error(`Invalid embedding returned for chunk ${index}`);
					}

					chunkRecords.push({
						[this.getFKColumnName()]: entityId,
						chunkText: cleanText,
						chunkIndex: index,
						embedding: embedding,
					});
				} catch (error) {
					console.error(`Error generating embedding for chunk ${index}:`, error);
					throw error;
				}
			}

			// 3. Store embeddings in database
			if (chunkRecords.length > 0) {
				const embeddingsTable = this.getEmbeddingsTable();
				await db.insert(embeddingsTable).values(chunkRecords);
				console.log(`Stored ${chunkRecords.length} embeddings for entity ${entityId}`);
			} else {
				throw new Error("No valid chunks to embed");
			}
		} catch (error) {
			console.error(`Error embedding entity ${entityId}:`, error);
			throw error;
		}
	}

	/**
	 * Re-embed an entity (delete old embeddings and create new ones)
	 */
	async reEmbedEntity(entityId: number, content: string): Promise<void> {
		// Delete old embeddings
		const embeddingsTable = this.getEmbeddingsTable();
		const fkColumnNameDB = this.getFKColumnNameDB();

		await db.execute(sql`
			DELETE FROM ${embeddingsTable}
			WHERE ${sql.raw(fkColumnNameDB)} = ${entityId}
		`);

		// Create new embeddings
		await this.embedEntity(entityId, content);
	}

	/**
	 * Perform similarity search across all embeddings
	 */
	async similaritySearch(
		query: string,
		limit = 5,
	): Promise<
		Array<{
			entityId: number;
			chunkText: string;
			similarity: number;
		}>
	> {
		try {
			// Generate query embedding
			const queryEmbedding = await BaseEmbeddingService.embeddings.embedQuery(query);
			const embeddingString = `[${queryEmbedding.join(",")}]`;

			const embeddingsTable = this.getEmbeddingsTable();
			const fkColumnNameDB = this.getFKColumnNameDB();

			// Perform vector similarity search
			const results = await db.execute<{
				entity_id: number;
				chunk_text: string;
				similarity: number;
			}>(sql`
				SELECT
					${sql.raw(fkColumnNameDB)} as entity_id,
					chunk_text,
					1 - (embedding <=> ${embeddingString}::vector) as similarity
				FROM ${embeddingsTable}
				ORDER BY similarity DESC
				LIMIT ${limit}
			`);

			return results.rows.map((row) => ({
				entityId: row.entity_id,
				chunkText: row.chunk_text,
				similarity: row.similarity,
			}));
		} catch (error) {
			console.error("Error performing similarity search:", error);
			throw error;
		}
	}
}
