import { sql } from "drizzle-orm";
import {
	integer,
	pgTable,
	serial,
	text,
	timestamp,
	vector,
} from "drizzle-orm/pg-core";

// ==========================================
// BEDTIME STORY WRITER TABLES
// ==========================================

export const stories = pgTable("stories", {
	id: serial("id").primaryKey(),
	topic: text("topic").notNull(),
	childAge: integer("child_age").notNull(),
	emphasis: text("emphasis").array().notNull(), // Array of character traits
	additionalInstructions: text("additional_instructions"),
	generatedStory: text("generated_story").notNull(),
	createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const storyEmbeddings = pgTable("story_embeddings", {
	id: serial("id").primaryKey(),
	storyId: integer("story_id")
		.references(() => stories.id, { onDelete: "cascade" })
		.notNull(),
	chunkText: text("chunk_text").notNull(),
	chunkIndex: integer("chunk_index").notNull(),
	// Vector embeddings - dimension 1536 for OpenAI text-embedding-3-small
	embedding: vector("embedding", { dimensions: 1536 }),
});

// ==========================================
// EMAIL HELPER TABLES
// ==========================================

export const emails = pgTable("emails", {
	id: serial("id").primaryKey(),
	emailType: text("email_type").notNull(), // professional, casual, marketing, etc.
	tone: text("tone").notNull(), // formal, friendly, persuasive, etc.
	keyPoints: text("key_points").array().notNull(),
	context: text("context"),
	generatedSubject: text("generated_subject").notNull(),
	generatedBody: text("generated_body").notNull(),
	createdAt: timestamp("created_at").defaultNow().notNull(),
});

// ==========================================
// RAG CHAT TABLES
// ==========================================

export const documents = pgTable("documents", {
	id: serial("id").primaryKey(),
	filename: text("filename").notNull(),
	fileType: text("file_type").notNull(), // 'pdf' or 'text'
	content: text("content").notNull(),
	uploadDate: timestamp("upload_date").defaultNow().notNull(),
});

export const documentChunks = pgTable("document_chunks", {
	id: serial("id").primaryKey(),
	documentId: integer("document_id")
		.references(() => documents.id, { onDelete: "cascade" })
		.notNull(),
	chunkText: text("chunk_text").notNull(),
	chunkIndex: integer("chunk_index").notNull(),
	// Vector embeddings - dimension 1536 for OpenAI text-embedding-3-small
	embedding: vector("embedding", { dimensions: 1536 }),
});

export const chatHistory = pgTable("chat_history", {
	id: serial("id").primaryKey(),
	documentId: integer("document_id").references(() => documents.id),
	question: text("question").notNull(),
	answer: text("answer").notNull(),
	relevantChunks: integer("relevant_chunks").array(), // Array of chunk IDs
	createdAt: timestamp("created_at").defaultNow().notNull(),
});

// ==========================================
// TYPE EXPORTS
// ==========================================

export type Story = typeof stories.$inferSelect;
export type NewStory = typeof stories.$inferInsert;

export type StoryEmbedding = typeof storyEmbeddings.$inferSelect;
export type NewStoryEmbedding = typeof storyEmbeddings.$inferInsert;

export type Email = typeof emails.$inferSelect;
export type NewEmail = typeof emails.$inferInsert;

export type Document = typeof documents.$inferSelect;
export type NewDocument = typeof documents.$inferInsert;

export type DocumentChunk = typeof documentChunks.$inferSelect;
export type NewDocumentChunk = typeof documentChunks.$inferInsert;

export type ChatHistory = typeof chatHistory.$inferSelect;
export type NewChatHistory = typeof chatHistory.$inferInsert;

// ==========================================
// JOBS FEATURE TABLES
// ==========================================

export const openPositions = pgTable("open_positions", {
	id: text("id").primaryKey(), // e.g., "JOB001"
	title: text("title").notNull(),
	department: text("department").notNull(),
	requiredSkills: text("required_skills").array().notNull(),
	experienceLevel: text("experience_level").notNull(),
	location: text("location").notNull(),
	employmentType: text("employment_type").notNull(),
	salaryMin: integer("salary_min"),
	salaryMax: integer("salary_max"),
	status: text("status").default("open").notNull(), // 'open', 'closed', 'filled'
	description: text("description"),
	closedBy: integer("closed_by").references(() => reviewedApplications.id), // FK to application that filled this position
	createdAt: timestamp("created_at").defaultNow().notNull(),
	updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const reviewedApplications = pgTable("reviewed_applications", {
	id: serial("id").primaryKey(),
	candidateName: text("candidate_name").notNull(),
	dateReviewed: timestamp("date_reviewed").notNull(),
	overallScore: integer("overall_score").notNull(),
	fullMarkdownReview: text("full_markdown_review").notNull(), // Complete review in markdown format
	createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const applicationEmbeddings = pgTable("application_embeddings", {
	id: serial("id").primaryKey(),
	applicationId: integer("application_id")
		.references(() => reviewedApplications.id, { onDelete: "cascade" })
		.notNull(),
	chunkText: text("chunk_text").notNull(),
	chunkIndex: integer("chunk_index").notNull(),
	// Optional: Section type for better context
	sectionType: text("section_type"), // 'experience', 'skills', 'education', 'summary', etc.
	// Vector embeddings - dimension 1536 for OpenAI text-embedding-3-small
	embedding: vector("embedding", { dimensions: 1536 }),
});

export const applicationPositionMatches = pgTable(
	"application_position_matches",
	{
		id: serial("id").primaryKey(),
		applicationId: integer("application_id")
			.references(() => reviewedApplications.id, { onDelete: "cascade" })
			.notNull(),
		positionId: text("position_id")
			.references(() => openPositions.id, { onDelete: "cascade" })
			.notNull(),
		matchingScore: integer("matching_score").notNull(),
		matchReasoning: text("match_reasoning"),
		createdAt: timestamp("created_at").defaultNow().notNull(),
	},
);

export type OpenPosition = typeof openPositions.$inferSelect;
export type NewOpenPosition = typeof openPositions.$inferInsert;

export type ReviewedApplication = typeof reviewedApplications.$inferSelect;
export type NewReviewedApplication = typeof reviewedApplications.$inferInsert;

export type ApplicationEmbedding = typeof applicationEmbeddings.$inferSelect;
export type NewApplicationEmbedding = typeof applicationEmbeddings.$inferInsert;

export type ApplicationPositionMatch =
	typeof applicationPositionMatches.$inferSelect;
export type NewApplicationPositionMatch =
	typeof applicationPositionMatches.$inferInsert;
