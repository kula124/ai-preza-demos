CREATE TABLE "application_position_matches" (
	"id" serial PRIMARY KEY NOT NULL,
	"application_id" integer NOT NULL,
	"position_id" text NOT NULL,
	"matching_score" integer NOT NULL,
	"match_reasoning" text,
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
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "reviewed_applications" (
	"id" serial PRIMARY KEY NOT NULL,
	"candidate_name" text NOT NULL,
	"candidate_email" text NOT NULL,
	"candidate_github" text,
	"position_applied" text NOT NULL,
	"date_reviewed" timestamp NOT NULL,
	"overall_score" integer NOT NULL,
	"required_skills_score" integer,
	"experience_score" integer,
	"technical_depth_score" integer,
	"communication_score" integer,
	"strengths" text,
	"gaps_concerns" text,
	"red_flags" text,
	"requirements_coverage" text,
	"code_quality_review" text,
	"recommendation" text NOT NULL,
	"recommendation_reasoning" text,
	"next_steps" text,
	"potential_fit" text,
	"concerns_to_validate" text,
	"application_text" text,
	"resume_url" text,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "application_position_matches" ADD CONSTRAINT "application_position_matches_application_id_reviewed_applications_id_fk" FOREIGN KEY ("application_id") REFERENCES "public"."reviewed_applications"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "application_position_matches" ADD CONSTRAINT "application_position_matches_position_id_open_positions_id_fk" FOREIGN KEY ("position_id") REFERENCES "public"."open_positions"("id") ON DELETE cascade ON UPDATE no action;