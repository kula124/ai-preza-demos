import type { PgTable } from "drizzle-orm/pg-core";
import { BaseEmbeddingService } from "./BaseEmbeddingService";
import { storyEmbeddings, stories } from "@/repo/schema";

/**
 * Service for handling story embeddings
 */
export class StoryEmbeddingService extends BaseEmbeddingService {
	protected getEmbeddingsTable(): PgTable {
		return storyEmbeddings;
	}

	protected getEntityTable(): PgTable {
		return stories;
	}

	protected getFKColumnName(): string {
		return "storyId";
	}

	protected getFKColumnNameDB(): string {
		return "story_id";
	}

	protected getEntityIdColumnName(): string {
		return "id";
	}

	protected getContentFieldName(): string {
		return "generatedStory";
	}

	protected getContentFieldNameDB(): string {
		return "generated_story";
	}
}
