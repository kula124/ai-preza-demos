ALTER TABLE "reviewed_applications" ADD COLUMN "full_markdown_review" text NOT NULL;--> statement-breakpoint
ALTER TABLE "reviewed_applications" DROP COLUMN "candidate_email";--> statement-breakpoint
ALTER TABLE "reviewed_applications" DROP COLUMN "candidate_github";--> statement-breakpoint
ALTER TABLE "reviewed_applications" DROP COLUMN "position_applied";--> statement-breakpoint
ALTER TABLE "reviewed_applications" DROP COLUMN "required_skills_score";--> statement-breakpoint
ALTER TABLE "reviewed_applications" DROP COLUMN "experience_score";--> statement-breakpoint
ALTER TABLE "reviewed_applications" DROP COLUMN "technical_depth_score";--> statement-breakpoint
ALTER TABLE "reviewed_applications" DROP COLUMN "communication_score";--> statement-breakpoint
ALTER TABLE "reviewed_applications" DROP COLUMN "strengths";--> statement-breakpoint
ALTER TABLE "reviewed_applications" DROP COLUMN "gaps_concerns";--> statement-breakpoint
ALTER TABLE "reviewed_applications" DROP COLUMN "red_flags";--> statement-breakpoint
ALTER TABLE "reviewed_applications" DROP COLUMN "requirements_coverage";--> statement-breakpoint
ALTER TABLE "reviewed_applications" DROP COLUMN "code_quality_review";--> statement-breakpoint
ALTER TABLE "reviewed_applications" DROP COLUMN "recommendation";--> statement-breakpoint
ALTER TABLE "reviewed_applications" DROP COLUMN "recommendation_reasoning";--> statement-breakpoint
ALTER TABLE "reviewed_applications" DROP COLUMN "next_steps";--> statement-breakpoint
ALTER TABLE "reviewed_applications" DROP COLUMN "potential_fit";--> statement-breakpoint
ALTER TABLE "reviewed_applications" DROP COLUMN "concerns_to_validate";--> statement-breakpoint
ALTER TABLE "reviewed_applications" DROP COLUMN "application_text";--> statement-breakpoint
ALTER TABLE "reviewed_applications" DROP COLUMN "resume_url";