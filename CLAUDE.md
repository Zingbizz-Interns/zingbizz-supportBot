# CLAUDE.md

Repo guidance for AI coding assistants working in this project.

## Project Summary

ZingDesk is a Next.js 16 SaaS app for creating one embeddable support chatbot per user. Users can scrape up to 10 site pages and/or upload files, train a RAG index, customize the bot, and embed a vanilla-JS widget served from `public/widget.js`.

## Tech Stack

- Next.js 16 App Router + React 19
- NextAuth v5 beta with JWT sessions
- Neon Postgres + pgvector + Drizzle ORM
- Vercel AI SDK + `@ai-sdk/openai`
- OpenAI embeddings with configurable dimensions (`EMBEDDING_DIMENSIONS`, default 1536)
- Upstash Redis rate limits
- Vercel Blob for uploaded source files
- Tailwind CSS v4
- Widget bundle built with esbuild from `widget-src/`

## Source Of Truth

- DB schema: `lib/db/schema.ts`
- DB access/query helpers: `lib/db/queries/*`
- Auth config: `lib/auth.ts`
- Route protection: `proxy.ts`
- RAG orchestration: `lib/ai/rag.ts`
- Chat model streaming: `lib/ai/chat.ts`
- Embeddings: `lib/ai/embed.ts`
- Scraping: `lib/ingestion/scraper.ts`
- Ingestion pipeline: `lib/ingestion/pipeline.ts`
- Training queue: `lib/training-queue.ts`
- Request validation: `lib/validation/schemas.ts`
- Widget source: `widget-src/*`

## Architecture Rules

1. Keep business logic out of `app/` route files when possible. Put shared logic in `lib/`.
2. Do not store raw uploaded file contents in Postgres. Store extracted chunks in `documents`; original files live in Vercel Blob.
3. Do not introduce Playwright/Puppeteer scraping here unless the requirement explicitly changes. Current scraping is `fetch` + Cheerio with SSRF checks and content limits.
4. Preserve CORS on the public cross-origin endpoints:
   - `POST /api/chat`
   - `GET /api/agents/[id]/config`
5. Preserve ownership checks on protected agent/chatbot APIs. The public config route is intentionally unauthenticated; most other `/api/agents/*` routes are not.
6. Keep the paper-grain overlay in `app/layout.tsx`; it is part of the current visual identity.
7. Keep the widget framework-free. It is plain TypeScript/DOM code bundled to one browser file.

## Current Product Constraints

- One chatbot per user is enforced by a unique DB index on `chatbots.user_id`.
- Chat history is not persisted server-side. The widget keeps history in memory only.
- Training supports `replace` and `append` modes.
- Training accepts up to 10 scraped pages and up to 10 uploaded files per request.
- Uploads allow `.pdf`, `.txt`, `.md`, `.docx`, `.xlsx`, and `.csv` up to 10 MB.
- Scraping caps page count at 10 and applies character budgets.

## Authentication And Routing

- `proxy.ts` protects `/dashboard` and `/dashboard/:path*`.
- Sessions use JWT strategy; there is no DB-backed session table.
- Credentials auth is always available.
- Google auth is enabled only when `GOOGLE_CLIENT_ID` and `GOOGLE_CLIENT_SECRET` exist.
- GitHub auth is enabled only when `GITHUB_ID` and `GITHUB_SECRET` exist.

## Rate Limits

- Chat: `50 req / 1 min` per `chatbotId`
- Training: `5 req / 10 min` per `userId`
- Upload: `20 req / 10 min` per `userId`
- Scrape: `10 req / 5 min` per `userId`

Defined in `lib/rate-limit.ts`.

## RAG Behavior

`lib/ai/rag.ts` currently does this:

1. Loads chatbot config.
2. Embeds the user query, enriching short referential follow-ups with the last assistant turn.
3. Searches top 5 document chunks with pgvector cosine distance.
4. Sanitizes noisy retrieved content and removes duplicate chunks.
5. Marks `answered=true` only if at least one cleaned result has similarity `>= 0.75`.
6. Still allows lower-confidence context down to `0.45` into the prompt.
7. Deduplicates source links before returning them.
8. Logs every query to the `queries` table.

Do not change these thresholds casually. They affect both product behavior and insights.

## Training Flow

Training is queue-backed, not immediate:

1. `/api/train` validates input, checks ownership, trims page content to budget, and enqueues a `training_jobs` row.
2. `lib/training-queue.ts` claims jobs, renews leases, downloads Blob files, extracts text, and runs ingestion.
3. `lib/ingestion/pipeline.ts` chunks content, batches embeddings, writes `documents`, and updates chatbot `trainingStatus`.

If you change training behavior, keep job lease/retry semantics intact.

## Widget Notes

- Entry: `widget-src/index.ts`
- Output: `public/widget.js`
- Build command: `npm run build:widget`
- The widget auto-opens after 3 seconds.
- The widget sends only recent in-memory history and filters empty turns before use.
- Empty model streams are treated as errors via a guarded response path in `app/api/chat/route.ts`.

## UI Notes

- Fonts are defined in `app/layout.tsx`: Playfair Display and Source Sans 3.
- The current palette repeatedly uses `#F9F8F4`, `#2D3A31`, `#8C9A84`, and `#C27B66`.
- Lucide icons are consistently used with `strokeWidth={1.5}` across the current UI. Follow that unless there is a concrete reason not to.

Do not invent a separate design system doc reference unless one actually exists in the repo.

## Environment Variables

See `.env.example`. Current vars include:

- `DATABASE_URL`
- `DATABASE_URL_UNPOOLED`
- `AUTH_SECRET`
- `AUTH_URL`
- `GOOGLE_CLIENT_ID`
- `GOOGLE_CLIENT_SECRET`
- `GITHUB_ID`
- `GITHUB_SECRET`
- `OPENAI_API_KEY`
- `OPENAI_CHAT_MODEL`
- `EMBEDDING_DIMENSIONS`
- `BLOB_READ_WRITE_TOKEN`
- `UPSTASH_REDIS_REST_URL`
- `UPSTASH_REDIS_REST_TOKEN`

## Working Rules For Assistants

1. Verify claims against code before documenting them.
2. Do not make changes until you have 95% confidence in what needs to be built; ask follow-up questions until you reach that confidence.
3. Prefer updating `lib/` helpers over duplicating logic inside route handlers.
4. Keep public API contracts backward-compatible unless the task explicitly requires a breaking change.
5. When changing widget request/response shapes, update both `widget-src/*` and the corresponding API route.
6. When changing schema or constraints, update Drizzle schema and migrations together.
7. Keep this file concise and accurate. If architecture changes, update this file in the same task.
