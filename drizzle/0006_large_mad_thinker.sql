CREATE TABLE "application_embeddings" (
	"id" serial PRIMARY KEY NOT NULL,
	"application_id" integer NOT NULL,
	"chunk_text" text NOT NULL,
	"chunk_index" integer NOT NULL,
	"section_type" text,
	"embedding" vector(1536)
);
--> statement-breakpoint
ALTER TABLE "application_embeddings" ADD CONSTRAINT "application_embeddings_application_id_reviewed_applications_id_fk" FOREIGN KEY ("application_id") REFERENCES "public"."reviewed_applications"("id") ON DELETE cascade ON UPDATE no action;