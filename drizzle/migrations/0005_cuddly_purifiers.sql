ALTER TABLE "chatbots" ADD COLUMN "logo_url" text;--> statement-breakpoint
ALTER TABLE "chatbots" ADD COLUMN "personality" text DEFAULT 'friendly' NOT NULL;--> statement-breakpoint
ALTER TABLE "chatbots" ADD COLUMN "tone" text DEFAULT 'professional' NOT NULL;--> statement-breakpoint
ALTER TABLE "chatbots" ADD COLUMN "response_style" text DEFAULT 'concise' NOT NULL;
