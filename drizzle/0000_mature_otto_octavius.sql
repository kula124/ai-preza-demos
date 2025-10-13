CREATE TABLE "application_embeddings" (
	"id" serial PRIMARY KEY NOT NULL,
	"application_id" integer NOT NULL,
	"chunk_text" text NOT NULL,
	"chunk_index" integer NOT NULL,
	"section_type" text,
	"embedding" vector(1536)
);
--> statement-breakpoint
CREATE TABLE "application_position_matches" (
	"id" serial PRIMARY KEY NOT NULL,
	"application_id" integer NOT NULL,
	"position_id" text NOT NULL,
	"matching_score" integer NOT NULL,
	"match_reasoning" text,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
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
CREATE TABLE "open_positions" (
	"id" text PRIMARY KEY NOT NULL,
	"title" text NOT NULL,
	"department" text NOT NULL,
	"required_skills" text[] NOT NULL,
	"experience_level" text NOT NULL,
	"location" text NOT NULL,
	"employment_type" text NOT NULL,
	"salary_min" integer,
	"salary_max" integer,
	"status" text DEFAULT 'open' NOT NULL,
	"description" text,
	"closed_by" integer,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "reviewed_applications" (
	"id" serial PRIMARY KEY NOT NULL,
	"candidate_name" text NOT NULL,
	"date_reviewed" timestamp NOT NULL,
	"overall_score" integer NOT NULL,
	"full_markdown_review" text NOT NULL,
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
CREATE TABLE "story_embeddings" (
	"id" serial PRIMARY KEY NOT NULL,
	"story_id" integer NOT NULL,
	"chunk_text" text NOT NULL,
	"chunk_index" integer NOT NULL,
	"embedding" vector(1536)
);
--> statement-breakpoint
ALTER TABLE "application_embeddings" ADD CONSTRAINT "application_embeddings_application_id_reviewed_applications_id_fk" FOREIGN KEY ("application_id") REFERENCES "public"."reviewed_applications"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "application_position_matches" ADD CONSTRAINT "application_position_matches_application_id_reviewed_applications_id_fk" FOREIGN KEY ("application_id") REFERENCES "public"."reviewed_applications"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "application_position_matches" ADD CONSTRAINT "application_position_matches_position_id_open_positions_id_fk" FOREIGN KEY ("position_id") REFERENCES "public"."open_positions"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "chat_history" ADD CONSTRAINT "chat_history_document_id_documents_id_fk" FOREIGN KEY ("document_id") REFERENCES "public"."documents"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "document_chunks" ADD CONSTRAINT "document_chunks_document_id_documents_id_fk" FOREIGN KEY ("document_id") REFERENCES "public"."documents"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "open_positions" ADD CONSTRAINT "open_positions_closed_by_reviewed_applications_id_fk" FOREIGN KEY ("closed_by") REFERENCES "public"."reviewed_applications"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "story_embeddings" ADD CONSTRAINT "story_embeddings_story_id_stories_id_fk" FOREIGN KEY ("story_id") REFERENCES "public"."stories"("id") ON DELETE cascade ON UPDATE no action;