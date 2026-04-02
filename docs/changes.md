# Changes Log

Last updated: 2026-04-02

## Summary

The docs folder was refreshed to match the current implementation. The biggest architectural change since the earlier docs pass is the move from inline training to a durable Postgres-backed training queue, along with newer dashboard insights and source-management behavior.

## What Changed In The App

### Durable training queue

- Training no longer runs as a fire-and-forget in-memory ingestion task.
- `POST /api/train` now enqueues work in the `training_jobs` table.
- The queue worker claims jobs with `FOR UPDATE SKIP LOCKED`, renews a short lease while processing, retries failed jobs, and marks exhausted jobs as failed.
- Training-status recovery now checks queue state during `GET /api/agents` and `GET /api/agents/[id]/status`.

### Database hardening

- The database now enforces one chatbot per user with a unique index on `chatbots.user_id`.
- `chatbots.training_status` is constrained to valid values by a database check constraint.
- `documents.embedding` now has an HNSW pgvector index for faster similarity search.
- `training_jobs` was added as a new first-class table with status, payload, lease, retry, and audit fields.

### Ingestion and source lifecycle

- Retraining fully replaces a chatbot's prior indexed documents before inserting new chunks.
- Upload metadata now stores `blob_url` so uploaded sources can be deleted from Vercel Blob when a source is removed.
- `DELETE /api/agents/[id]/sources/[sourceId]` now performs best-effort Blob cleanup in addition to document cleanup.

### Retrieval and analytics

- `lib/ai/rag.ts` now always includes retrieved context when search returns chunks.
- The `0.75` similarity threshold is still used, but only to log whether a query was "answered" for analytics.
- Insights endpoints and dashboard pages now expose top questions and unanswered questions from the `queries` table.

### Public widget behavior

- The widget still boots from `public/widget.js`, but it now hard-blocks initialization until the config endpoint reports `isReady: true`.
- Widget responses can include deduplicated source labels through the `X-Sources` header.

## Docs Updated In This Pass

- `docs/overview.md`
- `docs/architecture.md`
- `docs/api-design.md`
- `docs/database-schema.md`
- `docs/project-structure.md`
- `docs/tech-stack.md`
- `docs/changes.md`

## Notes

- `docs/design-system.md` was left as-is because it still reflects the current product styling direction.
- The README still links to `docs/changes.md`, which is now restored.
