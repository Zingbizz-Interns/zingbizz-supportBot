# System Architecture

## High-Level Shape

```text
Dashboard UI (Next.js App Router)
  -> authenticated API routes
  -> Neon Postgres via Drizzle

Embeddable widget (public/widget.js)
  -> public config endpoint
  -> public streaming chat endpoint

In-app training worker
  -> Postgres-backed training_jobs queue
  -> ingestion pipeline

External services
  -> OpenAI for embeddings
  -> xAI for production chat generation
  -> NVIDIA NIM for test-mode chat generation
  -> Vercel Blob for uploaded files
  -> Upstash Redis for rate limiting
```

## Request Boundaries

- The dashboard, auth pages, and training flows run inside the main Next.js app.
- The widget is loaded from `public/widget.js` on third-party sites.
- Only two widget-facing endpoints are public:
  - `GET /api/agents/[id]/config`
  - `POST /api/chat`
- Both public endpoints send permissive CORS headers.

## Training and Ingestion Flow

Training starts in `app/api/train/route.ts`, is persisted in `training_jobs`, and is drained by `lib/training-queue.ts` into `lib/ingestion/pipeline.ts`.

```text
1. Authenticate the user and confirm chatbot ownership.
2. Validate the payload and rate-limit training requests.
3. Trim scraped page content to per-page and total character budgets.
4. Create or reuse a durable `training_jobs` row and mark the chatbot as training.
5. Kick the in-process queue worker.
6. Claim the next job with a short renewable lease.
7. Resolve private Vercel Blob URLs through `get(..., { access: "private" })`.
8. Parse uploaded content:
   - PDF via pdf-parse v2 class API
   - text and markdown via utf-8 decode
9. Chunk each page or file with `RecursiveCharacterTextSplitter`.
10. Delete all existing chatbot documents so the retrain fully replaces prior knowledge.
11. Embed chunks in batches and insert them into Postgres.
12. Mark the job completed and the chatbot ready, or retry/fail the job on error.
```

Important implementation details:

- Jobs are durable because the source payload is stored in Postgres.
- The queue enforces one active job per chatbot with a partial unique index.
- The worker renews a 2-minute lease while processing long-running jobs.
- Failed jobs are retried after a short delay until `maxAttempts` is exhausted.
- Queue processing is kicked on enqueue and on training-status reconciliation, so interrupted work resumes when the dashboard polls again.
- Upload fetches are guarded to `https://*.vercel-storage.com`.
- Chunking defaults to 1000 characters with 80 overlap.

## Retrieval and Chat Flow

`lib/ai/rag.ts` owns the runtime query path.

```text
1. /api/chat validates chatbotId, message, and history.
2. Upstash rate limiting is applied per chatbotId.
3. The user message is embedded with OpenAI text-embedding-3-small.
4. Top 5 chunks are fetched from documents using pgvector cosine distance.
5. The top similarity score is compared with the 0.75 threshold.
6. Query analytics are logged with answered=true/false based on that score.
7. Retrieved chunks are still included in the prompt whenever any results exist.
8. Source labels are deduplicated from chunk metadata.
9. The response is streamed back as plain text through the AI SDK.
```

Important nuance:

- The similarity threshold no longer gates prompt context.
- It currently controls analytics classification in the `queries` table.
- The fallback answer is enforced by the system prompt when the available context is insufficient.

## Widget Flow

`widget-src/` is bundled into `public/widget.js`.

```text
1. Read `data-chatbot-id` from the embedding script tag.
2. Derive the base app URL from the script src.
3. GET /api/agents/[id]/config.
4. Abort initialization if `isReady` is false.
5. Inject the chat bubble, panel, styles, and welcome message.
6. Auto-open the chat after 3 seconds.
7. Keep message history in memory only.
8. POST to /api/chat and stream the plain text response.
9. Show up to 3 source labels from the `X-Sources` header.
```

Client-side limits and behavior:

- The widget input caps typed messages at 500 characters.
- The server still enforces a 1000-character maximum.
- The widget sends at most the last 10 prior messages as history.

## Training Status Lifecycle

```text
idle -> training -> ready
                 -> error
```

Recovery behavior:

- `training_jobs` is the durable source of truth for queued and running work.
- Reads through `/api/agents` and `/api/agents/[id]/status` reconcile `chatbots.training_status` with the latest queue state.
- A chatbot can be moved back into `training` on reads if an active job still exists.
- A stale `training` chatbot with no active or completed job is normalized to `error`.

## Authentication Architecture

- Auth.js v5 uses JWT sessions.
- Credentials auth is always registered.
- Google and GitHub providers are added only when their env vars exist.
- `proxy.ts` redirects unauthenticated dashboard traffic to `/login`.
- `app/(dashboard)/layout.tsx` repeats the server-side session guard for safety.
