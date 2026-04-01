-- Phase 3: Database hardening
-- Run after 0004_openai_embeddings.sql (documents table is empty, making the
-- HNSW index creation instant and the unique index safe to add).

-- 1. HNSW approximate nearest-neighbour index for vector search.
--    Uses cosine distance to match the <=> operator in searchDocuments().
--    m=16 and ef_construction=64 are pgvector defaults (good for MVP scale).
CREATE INDEX IF NOT EXISTS documents_embedding_hnsw_idx
  ON documents USING hnsw (embedding vector_cosine_ops);

-- 2. Enforce one chatbot per user at the database level.
--    The application already prevents duplicates, but this makes it a hard
--    constraint so no race condition or direct DB insert can violate it.
CREATE UNIQUE INDEX IF NOT EXISTS chatbots_user_id_unique_idx
  ON chatbots (user_id);

-- 3. Restrict training_status to known values.
--    Prevents typos or bad direct inserts from putting the chatbot into an
--    unrecoverable state that the polling logic doesn't handle.
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'chatbots_training_status_check'
      AND conrelid = 'chatbots'::regclass
  ) THEN
    ALTER TABLE chatbots
      ADD CONSTRAINT chatbots_training_status_check
      CHECK (training_status IN ('idle', 'training', 'ready', 'error'));
  END IF;
END $$;
