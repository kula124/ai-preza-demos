import type { PgTable } from "drizzle-orm/pg-core";
import { BaseEmbeddingService } from "./BaseEmbeddingService";
import { applicationEmbeddings, reviewedApplications } from "@/repo/schema";

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
		return "applicationText";
	}

	protected getContentFieldNameDB(): string {
		return "application_text";
	}
}
