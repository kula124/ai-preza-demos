CREATE TABLE "chat_history" (
	"id" serial PRIMARY KEY NOT NULL,
	"document_id" integer,
	"question" text NOT NULL,
	"answer" text NOT NULL,
	"relevant_chunks" integer[],
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "document_chunks" (
	"id" serial PRIMARY KEY NOT NULL,
	"document_id" integer NOT NULL,
	"chunk_text" text NOT NULL,
	"chunk_index" integer NOT NULL,
	"embedding" vector(1536)
);
--> statement-breakpoint
CREATE TABLE "documents" (
	"id" serial PRIMARY KEY NOT NULL,
	"filename" text NOT NULL,
	"file_type" text NOT NULL,
	"content" text NOT NULL,
	"upload_date" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "emails" (
	"id" serial PRIMARY KEY NOT NULL,
	"email_type" text NOT NULL,
	"tone" text NOT NULL,
	"key_points" text[] NOT NULL,
	"context" text,
	"generated_subject" text NOT NULL,
	"generated_body" text NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "stories" (
	"id" serial PRIMARY KEY NOT NULL,
	"topic" text NOT NULL,
	"child_age" integer NOT NULL,
	"emphasis" text[] NOT NULL,
	"additional_instructions" text,
	"generated_story" text NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "chat_history" ADD CONSTRAINT "chat_history_document_id_documents_id_fk" FOREIGN KEY ("document_id") REFERENCES "public"."documents"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "document_chunks" ADD CONSTRAINT "document_chunks_document_id_documents_id_fk" FOREIGN KEY ("document_id") REFERENCES "public"."documents"("id") ON DELETE cascade ON UPDATE no action;