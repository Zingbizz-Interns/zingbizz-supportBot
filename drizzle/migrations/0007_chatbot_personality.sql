ALTER TABLE "chatbots" ADD COLUMN IF NOT EXISTS "logo_url" text;
ALTER TABLE "chatbots" ADD COLUMN IF NOT EXISTS "personality" text DEFAULT 'friendly' NOT NULL;
ALTER TABLE "chatbots" ADD COLUMN IF NOT EXISTS "tone" text DEFAULT 'professional' NOT NULL;
ALTER TABLE "chatbots" ADD COLUMN IF NOT EXISTS "response_style" text DEFAULT 'concise' NOT NULL;
