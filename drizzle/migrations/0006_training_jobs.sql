-- Durable training queue for chatbot ingestion.
-- Stores queued/running/completed/failed jobs in Postgres so work can resume
-- after a process restart instead of being lost with an in-memory promise.

CREATE TABLE IF NOT EXISTS training_jobs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  chatbot_id uuid NOT NULL REFERENCES chatbots(id) ON DELETE CASCADE,
  status text NOT NULL DEFAULT 'queued',
  payload jsonb NOT NULL,
  attempts integer NOT NULL DEFAULT 0,
  max_attempts integer NOT NULL DEFAULT 2,
  last_error text,
  available_at timestamp NOT NULL DEFAULT now(),
  locked_by text,
  locked_at timestamp,
  lease_expires_at timestamp,
  created_at timestamp NOT NULL DEFAULT now(),
  started_at timestamp,
  finished_at timestamp,
  updated_at timestamp NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS training_jobs_chatbot_id_idx
  ON training_jobs (chatbot_id);

CREATE INDEX IF NOT EXISTS training_jobs_status_created_at_idx
  ON training_jobs (status, created_at);

CREATE UNIQUE INDEX IF NOT EXISTS training_jobs_one_active_per_chatbot_idx
  ON training_jobs (chatbot_id)
  WHERE status IN ('queued', 'running');

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'training_jobs_status_check'
      AND conrelid = 'training_jobs'::regclass
  ) THEN
    ALTER TABLE training_jobs
      ADD CONSTRAINT training_jobs_status_check
      CHECK (status IN ('queued', 'running', 'completed', 'failed'));
  END IF;
END $$;
