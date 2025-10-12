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

export type Email = typeof emails.$inferSelect;
export type NewEmail = typeof emails.$inferInsert;

export type Document = typeof documents.$inferSelect;
export type NewDocument = typeof documents.$inferInsert;

export type DocumentChunk = typeof documentChunks.$inferSelect;
export type NewDocumentChunk = typeof documentChunks.$inferInsert;

export type ChatHistory = typeof chatHistory.$inferSelect;
export type NewChatHistory = typeof chatHistory.$inferInsert;
