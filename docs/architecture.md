# System Architecture

## High-Level Shape

```text
Dashboard UI (Next.js App Router)
  -> authenticated API routes
  -> Neon Postgres via Drizzle

Embeddable widget (public/widget.js)
  -> public config endpoint
  -> public streaming chat endpoint

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

Both public endpoints send permissive CORS headers.

## Ingestion Flow

Training starts in `app/api/train/route.ts` and then hands off to `lib/ingestion/pipeline.ts`.

```text
1. Authenticate the user and confirm chatbot ownership.
2. Validate page payloads and Blob URLs.
3. Mark chatbot as training.
4. Resolve private Vercel Blob URLs through head().
5. Parse uploaded content:
   - PDF via pdf-parse v2 class API
   - text and markdown via utf-8 decode
6. Chunk each page or file with RecursiveCharacterTextSplitter.
7. Embed each chunk batch through OpenAI text-embedding-3-small.
8. Insert chunk documents into Postgres in small batches.
9. Mark chatbot ready on success or error on failure.
```

Important implementation details:

- Training is fire-and-forget from the request handler.
- Work is done in-process, not on a queue or background worker.
- Upload fetches are guarded to `https://*.vercel-storage.com`.
- Chunking defaults to 3000 characters with 400 overlap.

## Retrieval and Chat Flow

`lib/ai/rag.ts` owns the runtime query path.

```text
1. /api/chat validates chatbotId, message, and history.
2. Upstash rate limiting is applied per chatbotId.
3. The user message is embedded with OpenAI text-embedding-3-small.
4. Top 5 chunks are fetched from documents using pgvector cosine distance.
5. If similarity is >= 0.75:
   - context chunks are included
   - source labels are extracted
   - answered=true is logged
6. If similarity is < 0.75:
   - no document context is included
   - answered=false is logged
   - the model is instructed to return the configured fallback for factual questions
7. The response is streamed back as plain text through the AI SDK.
```

This means low-confidence queries do not short-circuit at the API layer. The fallback is currently enforced by prompt behavior, not by bypassing the model.

## Widget Flow

`widget-src/` is bundled into `public/widget.js`.

```text
1. Read data-chatbot-id from the embedding script tag.
2. Derive the base app URL from the script src.
3. GET /api/agents/[id]/config.
4. Abort initialization if isReady is false.
5. Inject the chat bubble, panel, styles, and welcome message.
6. Auto-open the chat after 3 seconds.
7. Keep message history in memory only.
8. POST to /api/chat and stream the plain text response.
9. Show up to 3 source labels from the X-Sources header.
```

Client-side limits and behavior:

- The widget input element caps typed messages at 500 characters.
- The server still enforces a 1000-character maximum.
- The widget sends at most the last 10 prior messages as history.

## Training Status Lifecycle

```text
idle -> training -> ready
                 -> error
```

The app also includes stale training recovery:

- `lib/training-status.ts` records server start time.
- If a chatbot is still marked `training` after a server restart, reads through `/api/agents` or `/api/agents/[id]/status` convert it to `error`.

## Authentication Architecture

- Auth.js v5 uses JWT sessions.
- Credentials auth is always registered.
- Google and GitHub providers are added only when their env vars exist.
- `proxy.ts` redirects unauthenticated dashboard traffic to `/login`.
- `app/(dashboard)/layout.tsx` repeats the server-side session guard for safety.
