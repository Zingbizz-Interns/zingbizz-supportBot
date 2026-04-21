CREATE TABLE "training_jobs" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"chatbot_id" uuid NOT NULL,
	"status" text DEFAULT 'queued' NOT NULL,
	"payload" jsonb NOT NULL,
	"attempts" integer DEFAULT 0 NOT NULL,
	"max_attempts" integer DEFAULT 2 NOT NULL,
	"last_error" text,
	"available_at" timestamp DEFAULT now() NOT NULL,
	"locked_by" text,
	"locked_at" timestamp,
	"lease_expires_at" timestamp,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"started_at" timestamp,
	"finished_at" timestamp,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "training_jobs_status_check" CHECK ("training_jobs"."status" IN ('queued', 'running', 'completed', 'failed'))
);
--> statement-breakpoint
ALTER TABLE "chatbots" ADD COLUMN "logo_url" text;--> statement-breakpoint
ALTER TABLE "chatbots" ADD COLUMN "personality" text DEFAULT 'friendly' NOT NULL;--> statement-breakpoint
ALTER TABLE "chatbots" ADD COLUMN "tone" text DEFAULT 'professional' NOT NULL;--> statement-breakpoint
ALTER TABLE "chatbots" ADD COLUMN "response_style" text DEFAULT 'concise' NOT NULL;--> statement-breakpoint
ALTER TABLE "training_jobs" ADD CONSTRAINT "training_jobs_chatbot_id_chatbots_id_fk" FOREIGN KEY ("chatbot_id") REFERENCES "public"."chatbots"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "training_jobs_chatbot_id_idx" ON "training_jobs" USING btree ("chatbot_id");--> statement-breakpoint
CREATE INDEX "training_jobs_status_created_at_idx" ON "training_jobs" USING btree ("status","created_at");--> statement-breakpoint
CREATE UNIQUE INDEX "chatbots_user_id_unique_idx" ON "chatbots" USING btree ("user_id");--> statement-breakpoint
ALTER TABLE "chatbots" ADD CONSTRAINT "chatbots_training_status_check" CHECK ("chatbots"."training_status" IN ('idle', 'training', 'ready', 'error'));