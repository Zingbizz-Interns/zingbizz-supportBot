# Changes Log

## 2026-04-01

### Documentation refresh

- Added a root `README.md` with setup, environment, scripts, and doc links.
- Rewrote the core docs to match the current `/api/agents` route structure instead of the removed `/api/chatbots` paths.
- Updated the docs to reflect optional Google and GitHub OAuth, not credentials-only auth.
- Corrected the AI stack documentation to match the current implementation:
  - Cohere for embeddings
  - xAI Grok for production chat
  - optional NVIDIA NIM test mode
- Corrected the training lifecycle docs to describe the current in-process fire-and-forget pipeline and stale `training` recovery behavior.
- Updated the widget docs to match the real streaming contract, auto-open behavior, message history depth, and source-label header.
- Updated the database docs to include the `accounts` table, nullable `users.passwordHash`, configurable embedding dimensions, and current migration history.
- Updated the tech stack docs to the versions and packages actually present in `package.json`.

## 2026-03-31

### Verified and corrected issues

- Source deletion for uploaded files:
  Updated `deleteDocumentsBySource()` to delete documents by either `metadata->>'url'` or `metadata->>'file_name'`, so uploaded sources can now be removed correctly.

- SSRF risk in `/api/train`:
  Added a guard so file fetching only allows `https` Blob URLs on `*.vercel-storage.com` before any server-side fetch occurs.

- `/api/chat` streaming contract mismatch:
  Confirmed the implementation uses a plain text response stream plus the `X-Sources` response header, and updated the API docs to match that contract.

- Training lifecycle docs drift:
  Updated the docs to describe the actual single fire-and-forget ingestion pipeline that ends at `ready` or `error`, instead of the old Phase 1 / Phase 2 / `complete` flow.

- Setup page lifecycle mismatch:
  Updated the dashboard setup flow to treat `ready` as the terminal success state and changed the success copy to say the chatbot is ready.

- Upload docs drift:
  Clarified that `/api/upload` returns a full Vercel Blob URL in `key`, and that the same URL is passed back through `fileKeys` to `/api/train`.

- Project structure docs drift:
  Corrected the route-protection file reference from `middleware.ts` to `proxy.ts`, which matches the actual repository layout.

- Sources API docs drift:
  Updated the documented `/api/agents/[id]/sources` response shape to match the real snake_case payload returned by the API.

### Authentication hardening

- Conditional OAuth provider setup:
  Updated `lib/auth.ts` so Google and GitHub providers are only registered when their env vars are present, avoiding broken OAuth buttons and invalid provider configuration on fresh setups.

- Auth UI now reflects configured providers:
  Split the login and signup pages into server/client pieces and updated `components/ui/oauth-buttons.tsx` so only configured OAuth providers are shown.

- Example environment setup fixed:
  Added missing Google OAuth variables to `.env.example`.

- Stale JWT session protection:
  Updated the JWT/session callbacks in `lib/auth.ts` to verify that the token's `user.id` still exists in the database. This prevents deleted users or post-reset stale cookies from continuing to access protected dashboard routes.

- Dashboard route guards tightened:
  Updated both `proxy.ts` and `app/(dashboard)/layout.tsx` to treat only sessions with a real `user.id` as authenticated.

### Training and crash recovery

- Reduced ingestion memory usage:
  Refactored `lib/ingestion/pipeline.ts` to process source chunks in small batches and insert documents incrementally, instead of building one large in-memory `allDocs` array for the full training run.

- Stuck `training` status recovery:
  Added `lib/training-status.ts` and wired it into `/api/agents` and `/api/agents/[id]/status` so if the server restarts after an in-process training crash, stale `training` rows are converted to `error` automatically.

### PDF ingestion update

- Updated `pdf-parse` integration:
  Replaced the old v1-style callable wrapper in `lib/ingestion/pdf-parser.ts` with the supported v2 `PDFParse` class API and ensured parsers are destroyed after use. This removed the unsupported wrapper logic and aligned the app with the current package behavior.

### Embeddings and vector dimensions

- Embedding provider configuration cleaned up:
  Updated `lib/ai/embed.ts` to validate returned embedding sizes before insert/query usage.

- Embedding dimensions made configurable:
  Added shared config in `lib/config/embedding.ts` and updated both `lib/ai/embed.ts` and `lib/db/schema.ts` to use env-driven embedding dimensions instead of hardcoded `1536`.

- Environment config extended:
  Added `EMBEDDING_DIMENSIONS` to `.env.example` so the configured vector size stays aligned with the active embedding model.

- Database vector size updated for the configured embedding model:
  Updated the live `documents.embedding` column from `vector(1536)` to `vector(2560)` and added an idempotent SQL migration at `drizzle/migrations/0002_embedding_dimension_2560.sql` to capture that schema change in the repo.
