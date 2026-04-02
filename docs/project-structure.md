# Project Structure

```text
chat-bot/
├── app/
│   ├── (marketing)/
│   ├── (auth)/
│   ├── (dashboard)/
│   ├── api/
│   │   ├── auth/
│   │   ├── agents/
│   │   │   └── [id]/
│   │   │       ├── config/
│   │   │       ├── insights/
│   │   │       ├── sources/
│   │   │       └── status/
│   │   ├── chat/
│   │   ├── scrape/
│   │   ├── train/
│   │   └── upload/
│   ├── globals.css
│   └── layout.tsx
├── components/
│   ├── auth/
│   ├── dashboard/
│   ├── marketing/
│   └── ui/
├── docs/
├── drizzle/
│   └── migrations/
├── lib/
│   ├── ai/
│   ├── config/
│   ├── db/
│   │   └── queries/
│   ├── ingestion/
│   ├── validation/
│   ├── auth.ts
│   ├── rate-limit.ts
│   ├── training-queue.ts
│   └── training-status.ts
├── public/
│   └── widget.js
├── types/
├── widget-src/
├── build-widget.mjs
├── drizzle.config.ts
├── next.config.ts
├── proxy.ts
└── package.json
```

## Key Areas

### `app/`

- Route groups split the public marketing site, auth pages, and protected dashboard.
- `app/api/` contains all server entry points, including public widget endpoints and authenticated dashboard endpoints.

### `components/`

- `components/ui/` holds reusable primitives.
- `components/auth/` contains the client forms that call Auth.js and the register route.
- `components/dashboard/` contains persistent shell navigation.

### `lib/`

- `lib/ai/` contains embeddings, model selection, and RAG orchestration.
- `lib/db/queries/` isolates database access behind query helpers.
- `lib/ingestion/` owns scraping, parsing, chunking, and document rewrite logic.
- `lib/training-queue.ts` owns durable queue coordination and worker leasing.
- `lib/training-status.ts` reconciles persisted chatbot status with queue state on reads.
- `lib/validation/` centralizes Zod request schemas and parsing helpers.

### `widget-src/`

- Source for the embeddable widget.
- Built into `public/widget.js` with `npm run build:widget`.

## High-Value Files

| File | Responsibility |
|------|----------------|
| `app/api/chat/route.ts` | Public streaming chat endpoint used by the widget |
| `app/api/train/route.ts` | Validates training input, applies rate limiting, and enqueues durable jobs |
| `app/api/agents/route.ts` | Fetches or creates the single chatbot for the logged-in user |
| `app/api/agents/[id]/sources/[sourceId]/route.ts` | Deletes a source's indexed chunks and cleans up its Vercel Blob file when applicable |
| `lib/ai/rag.ts` | Retrieval, prompt construction, source extraction, and query logging |
| `lib/ai/embed.ts` | OpenAI embedding integration and dimension validation |
| `lib/ingestion/pipeline.ts` | Chunk embedding, document replacement, and chatbot training state updates |
| `lib/training-queue.ts` | Durable queue claiming, lease renewal, retries, and worker startup |
| `lib/db/queries/training-jobs.ts` | SQL helpers for queue persistence and locking |
| `lib/db/schema.ts` | Source of truth for tables, relations, and types |
| `proxy.ts` | Redirects unauthenticated users away from `/dashboard` |
| `widget-src/ui.ts` | DOM injection, message streaming UI, and client-side history |
| `build-widget.mjs` | Bundles the widget into a single browser script |
