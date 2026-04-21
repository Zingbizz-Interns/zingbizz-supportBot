CREATE TABLE IF NOT EXISTS "chatbot_sources" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "chatbot_id" uuid NOT NULL REFERENCES "chatbots"("id") ON DELETE cascade,
  "source_key" text NOT NULL,
  "title" text NOT NULL,
  "url" text,
  "source_type" text NOT NULL,
  "file_name" text,
  "blob_url" text,
  "chunk_count" integer NOT NULL DEFAULT 0,
  "is_enabled" boolean NOT NULL DEFAULT true,
  "created_at" timestamp DEFAULT now() NOT NULL,
  "updated_at" timestamp DEFAULT now() NOT NULL
);

CREATE INDEX IF NOT EXISTS "chatbot_sources_chatbot_id_idx"
  ON "chatbot_sources" ("chatbot_id");

CREATE UNIQUE INDEX IF NOT EXISTS "chatbot_sources_chatbot_id_source_key_idx"
  ON "chatbot_sources" ("chatbot_id", "source_key");

INSERT INTO "chatbot_sources" (
  "chatbot_id",
  "source_key",
  "title",
  "url",
  "source_type",
  "file_name",
  "blob_url",
  "chunk_count",
  "is_enabled",
  "created_at",
  "updated_at"
)
SELECT
  "chatbot_id",
  COALESCE("metadata"->>'url', "metadata"->>'file_name', "metadata"->>'title') AS "source_key",
  COALESCE("metadata"->>'title', "metadata"->>'file_name', "metadata"->>'url', 'Untitled source') AS "title",
  "metadata"->>'url' AS "url",
  COALESCE("metadata"->>'source_type', 'txt') AS "source_type",
  "metadata"->>'file_name' AS "file_name",
  "metadata"->>'blob_url' AS "blob_url",
  COUNT(*)::integer AS "chunk_count",
  true AS "is_enabled",
  MIN("created_at") AS "created_at",
  now() AS "updated_at"
FROM "documents"
GROUP BY
  "chatbot_id",
  COALESCE("metadata"->>'url', "metadata"->>'file_name', "metadata"->>'title'),
  COALESCE("metadata"->>'title', "metadata"->>'file_name', "metadata"->>'url', 'Untitled source'),
  "metadata"->>'url',
  COALESCE("metadata"->>'source_type', 'txt'),
  "metadata"->>'file_name',
  "metadata"->>'blob_url'
ON CONFLICT ("chatbot_id", "source_key") DO NOTHING;
