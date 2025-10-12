import type { PgTable } from "drizzle-orm/pg-core";
import { BaseEmbeddingService } from "./BaseEmbeddingService";
import { applicationEmbeddings, reviewedApplications } from "@/repo/schema";
import { db } from "@/lib/db";
import { eq, sql } from "drizzle-orm";

/**
 * Service for handling job application embeddings
 */
export class ApplicationEmbeddingService extends BaseEmbeddingService {
	protected getEmbeddingsTable(): PgTable {
		return applicationEmbeddings;
	}

	protected getEntityTable(): PgTable {
		return reviewedApplications;
	}

	protected getFKColumnName(): string {
		return "applicationId";
	}

	protected getFKColumnNameDB(): string {
		return "application_id";
	}

	protected getEntityIdColumnName(): string {
		return "id";
	}

	protected getContentFieldName(): string {
		return "fullMarkdownReview";
	}

	protected getContentFieldNameDB(): string {
		return "full_markdown_review";
	}

	/**
	 * Find all applications that don't have embeddings yet
	 */
	async findUnembeddedApplications(): Promise<
		Array<{ id: number; candidateName: string; fullMarkdownReview: string }>
	> {
		const results = await db.execute<{
			id: number;
			candidate_name: string;
			full_markdown_review: string;
		}>(sql`
			SELECT a.id, a.candidate_name, a.full_markdown_review
			FROM ${reviewedApplications} a
			LEFT JOIN ${applicationEmbeddings} e ON a.id = e.application_id
			WHERE e.id IS NULL
			ORDER BY a.created_at DESC
		`);

		return results.rows.map((row) => ({
			id: row.id,
			candidateName: row.candidate_name,
			fullMarkdownReview: row.full_markdown_review,
		}));
	}

	/**
	 * Embed all applications that don't have embeddings yet
	 */
	async embedUnembeddedApplications(): Promise<{
		processed: number;
		errors: Array<{ id: number; error: string }>;
	}> {
		const unembedded = await this.findUnembeddedApplications();
		let processed = 0;
		const errors: Array<{ id: number; error: string }> = [];

		console.log(
			`Found ${unembedded.length} applications without embeddings. Processing...`,
		);

		for (const application of unembedded) {
			try {
				console.log(
					`Embedding application ${application.id} (${application.candidateName})...`,
				);
				await this.embedEntity(application.id, application.fullMarkdownReview);
				processed++;
				console.log(`  ✓ Successfully embedded application ${application.id}`);
			} catch (error) {
				const errorMessage =
					error instanceof Error ? error.message : "Unknown error";
				console.error(
					`  ✗ Failed to embed application ${application.id}:`,
					errorMessage,
				);
				errors.push({ id: application.id, error: errorMessage });
			}
		}

		return { processed, errors };
	}

	/**
	 * Check if an application has embeddings
	 */
	async hasEmbeddings(applicationId: number): Promise<boolean> {
		const results = await db.execute<{ count: number }>(sql`
			SELECT COUNT(*) as count
			FROM ${applicationEmbeddings}
			WHERE application_id = ${applicationId}
		`);

		return (results.rows[0]?.count ?? 0) > 0;
	}

	/**
	 * Get embedding statistics
	 */
	async getEmbeddingStats(): Promise<{
		totalApplications: number;
		embeddedApplications: number;
		unembeddedApplications: number;
		totalChunks: number;
	}> {
		const stats = await db.execute<{
			total_applications: number;
			embedded_applications: number;
			total_chunks: number;
		}>(sql`
			SELECT
				COUNT(DISTINCT a.id) as total_applications,
				COUNT(DISTINCT e.application_id) as embedded_applications,
				COUNT(e.id) as total_chunks
			FROM ${reviewedApplications} a
			LEFT JOIN ${applicationEmbeddings} e ON a.id = e.application_id
		`);

		const row = stats.rows[0];
		const totalApplications = row?.total_applications ?? 0;
		const embeddedApplications = row?.embedded_applications ?? 0;

		return {
			totalApplications,
			embeddedApplications,
			unembeddedApplications: totalApplications - embeddedApplications,
			totalChunks: row?.total_chunks ?? 0,
		};
	}
}
