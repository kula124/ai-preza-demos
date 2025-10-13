import Anthropic from "@anthropic-ai/sdk";
import { RecursiveCharacterTextSplitter } from "@langchain/textsplitters";
import { OpenAIEmbeddings } from "@langchain/openai";
import { eq, sql } from "drizzle-orm";
import { promises as fs } from "fs";
import path from "path";
import { db } from "@/lib/db";
import { extractPDFText } from "@/lib/pdfParser.server";
import { documentChunks, documents } from "@/repo/schema";

export class RAGService {
	private static getEmbeddings() {
		const apiKey = process.env.OPENAI_API_KEY;
		console.log("OpenAI API Key present:", !!apiKey);
		console.log("OpenAI API Key length:", apiKey?.length);

		if (!apiKey) {
			throw new Error("OPENAI_API_KEY is not configured in environment variables");
		}

		return new OpenAIEmbeddings({
			apiKey: apiKey,
			modelName: "text-embedding-3-small", // 1536 dimensions
		});
	}

	private static embeddings = RAGService.getEmbeddings();

	/**
	 * Process and store a PDF file
	 * 1. Save file to /uploads
	 * 2. Extract text from PDF
	 * 3. Chunk text semantically
	 * 4. Generate embeddings
	 * 5. Store in database
	 */
	static async processDocument(
		file: File,
	): Promise<{ documentId: number; chunksCount: number }> {
		try {
			// 1. Save file to uploads directory
			const uploadsDir = path.join(process.cwd(), "uploads");
			const fileName = `${Date.now()}_${file.name}`;
			const filePath = path.join(uploadsDir, fileName);

			const arrayBuffer = await file.arrayBuffer();
			await fs.writeFile(filePath, Buffer.from(arrayBuffer));

			// 2. Extract text from PDF using server-only utility
			const fullText = await extractPDFText(filePath);

			// 3. Store document in database
			const [document] = await db
				.insert(documents)
				.values({
					filename: file.name,
					fileType: "pdf",
					content: fullText,
				})
				.returning();

			// 4. Chunk text with RecursiveCharacterTextSplitter
			// Splits on natural boundaries: paragraphs, sentences, words
			const textSplitter = new RecursiveCharacterTextSplitter({
				chunkSize: 1000, // Characters per chunk
				chunkOverlap: 200, // Overlap between chunks for context
				separators: ["\n\n", "\n", ". ", " ", ""], // Split on natural boundaries
			});

			const chunks = await textSplitter.createDocuments([fullText]);

			// 5. Generate embeddings and store chunks
			console.log(`Generating embeddings for ${chunks.length} chunks...`);
			const chunkRecords = [];

			// Process chunks sequentially to avoid rate limiting
			for (let index = 0; index < chunks.length; index++) {
				const chunk = chunks[index];
				try {
					console.log(`Chunk ${index + 1}/${chunks.length}: Generating embedding (length: ${chunk.pageContent.length} chars)...`);

					// Add retry logic with exponential backoff
					let embedding;
					let retries = 3;
					let delay = 500; // Start with 500ms delay

					while (retries > 0) {
						try {
							// Add a delay between requests to avoid rate limiting
							if (index > 0) {
								await new Promise(resolve => setTimeout(resolve, 500));
							}

							// Clean the text: remove zero-width characters and normalize whitespace
							const cleanText = chunk.pageContent
								.replace(/[\u200B-\u200D\uFEFF]/g, "") // Remove zero-width chars
								.replace(/\s+/g, " ") // Normalize whitespace
								.trim();

							if (!cleanText || cleanText.length < 10) {
								console.log(`Skipping chunk ${index + 1}: too short or empty`);
								break; // Skip this chunk
							}

							embedding = await RAGService.embeddings.embedQuery(cleanText);
							break; // Success, exit retry loop
						} catch (retryError) {
							retries--;
							if (retries === 0) {
								console.error(`Failed after all retries for chunk ${index}:`, retryError);
								console.error(`Chunk content preview: "${chunk.pageContent.substring(0, 100)}..."`);
								throw retryError;
							}
							console.log(`Retry ${3 - retries}/3 for chunk ${index + 1} after ${delay}ms...`);
							await new Promise(resolve => setTimeout(resolve, delay));
							delay *= 2; // Exponential backoff
						}
					}

					// Only process if we got an embedding (chunk wasn't skipped)
					if (embedding) {
						console.log(`Chunk ${index + 1}: Embedding generated, length: ${embedding?.length}`);

						if (!Array.isArray(embedding) || embedding.length === 0) {
							throw new Error(`Invalid embedding returned for chunk ${index}`);
						}

						chunkRecords.push({
							documentId: document.id,
							chunkText: chunk.pageContent,
							chunkIndex: index,
							embedding: embedding, // Drizzle ORM will handle vector conversion
						});
					}
				} catch (error) {
					console.error(`Error generating embedding for chunk ${index}:`, error);
					throw error;
				}
			}

			await db.insert(documentChunks).values(chunkRecords);

			return {
				documentId: document.id,
				chunksCount: chunks.length,
			};
		} catch (error) {
			console.error("Error processing document:", error);
			throw new Error(
				`Failed to process document: ${error instanceof Error ? error.message : "Unknown error"}`,
			);
		}
	}

	/**
	 * Perform vector similarity search
	 */
	static async similaritySearch(
		query: string,
		limit = 3,
	): Promise<
		Array<{ content: string; documentId: number; filename: string }>
	> {
		try {
			// Generate query embedding
			const queryEmbedding = await RAGService.embeddings.embedQuery(query);

			// Convert embedding array to pgvector string format
			const embeddingString = `[${queryEmbedding.join(",")}]`;

			// Perform vector similarity search using pgvector
			// Group by document to avoid duplicates, return full document content
			const results = await db.execute<{
				content: string;
				document_id: number;
				filename: string;
				best_similarity: number;
			}>(sql`
				SELECT
					d.content,
					d.id as document_id,
					d.filename,
					MAX(1 - (dc.embedding <=> ${embeddingString}::vector)) as best_similarity
				FROM document_chunks dc
				JOIN documents d ON dc.document_id = d.id
				GROUP BY d.id, d.filename, d.content
				ORDER BY best_similarity DESC
				LIMIT ${limit}
			`);

			return results.rows.map((row) => ({
				content: row.content,
				documentId: row.document_id,
				filename: row.filename,
			}));
		} catch (error) {
			console.error("Error performing similarity search:", error);
			throw new Error(
				`Similarity search failed: ${error instanceof Error ? error.message : "Unknown error"}`,
			);
		}
	}

	/**
	 * Get all documents
	 */
	static async getAllDocuments() {
		return await db.select().from(documents).orderBy(documents.uploadDate);
	}

	/**
	 * Delete a document and its chunks
	 */
	static async deleteDocument(documentId: number) {
		// Chunks will be automatically deleted due to CASCADE
		await db.delete(documents).where(eq(documents.id, documentId));
	}

	/**
	 * Generate answer using Claude with retrieved context
	 */
	static async generateAnswer(
		question: string,
		context: Array<{ content: string; filename: string }>,
	): Promise<string> {
		const anthropic = new Anthropic({
			apiKey: process.env.ANTHROPIC_API_KEY,
		});

		const contextText = context
			.map(
				(c, idx) =>
					`[Source ${idx + 1}: ${c.filename}]\n${c.content}\n`,
			)
			.join("\n---\n\n");

		const prompt = `You are a helpful AI assistant. Answer the user's question based on the provided context from their documents.

Context from documents:
${contextText}

User Question: ${question}

Instructions:
- Answer based ONLY on the provided context
- If the context doesn't contain relevant information, say so
- Cite sources using [Source X] notation
- Be concise and accurate`;

		const message = await anthropic.messages.create({
			model: "claude-3-7-sonnet-20250219",
			max_tokens: 1500,
			messages: [{ role: "user", content: prompt }],
		});

		return message.content[0].type === "text" ? message.content[0].text : "";
	}
}
