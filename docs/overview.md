# Project Overview

## Product

This repository contains a hosted support-chatbot SaaS built with Next.js 16. A user signs up, creates one chatbot, trains it on scraped web pages and uploaded documents, customizes its presentation, and embeds it on an external site with a single `<script>` tag.

## Current Product Flow

1. A user signs up with credentials or optional Google/GitHub OAuth.
2. The dashboard creates one chatbot record for the account.
3. The user scrapes up to 10 pages from a site and/or uploads up to 10 files.
4. `POST /api/train` validates the payload, applies rate limiting, trims oversized page content, and enqueues a durable `training_jobs` record.
5. The in-app queue worker resolves private Blob files, parses content, chunks text, embeds chunks, and rewrites the chatbot's indexed documents.
6. The chatbot becomes `ready` when the latest job completes, or `error` when the queue exhausts its retries.
7. The user customizes the chatbot name, welcome message, fallback message, and brand color.
8. The user copies a script snippet that loads `public/widget.js`.
9. The public widget calls `GET /api/agents/:id/config` and only initializes when `isReady === true`.
10. The widget posts messages to `POST /api/chat`, which retrieves relevant chunks, streams the LLM response, and logs lightweight analytics in `queries`.
11. The dashboard insights page summarizes top questions and unanswered queries from `queries`.

## Supported Inputs

- Website pages discovered by the scraper
- PDF uploads
- Plain text uploads
- Markdown uploads

## Current Constraints

- One chatbot per user account, enforced in both app logic and a database unique index
- No persisted end-user conversation transcripts; only per-question analytics are stored
- Queue processing still runs inside the Next.js app process, but jobs survive restarts because they are stored in Postgres
- Widget initialization is blocked until `trainingStatus === "ready"`
- Analytics are question-based, not thread-based
- Widget allowlisting, multibot accounts, and billing are not implemented

## Authentication Model

- Credentials auth is always available
- Google OAuth is enabled only when `GOOGLE_CLIENT_ID` and `GOOGLE_CLIENT_SECRET` are set
- GitHub OAuth is enabled only when `GITHUB_ID` and `GITHUB_SECRET` are set
- Protected dashboard routes are enforced in both `proxy.ts` and the dashboard layout

## AI Behavior

- Document and query embeddings use OpenAI `text-embedding-3-small`
- The embedding dimensionality is configurable via `EMBEDDING_DIMENSIONS` and must match the database vector column
- Production chat responses use xAI Grok through the Vercel AI SDK
- Test mode can swap chat generation to NVIDIA NIM via `AI_PROVIDER_MODE=test`
- Retrieved context is included whenever search returns chunks; the `0.75` similarity threshold currently controls analytics only
- If no useful context exists, the system prompt forces the configured fallback message for factual questions while still allowing simple greetings

## Docs Map

- `docs/architecture.md`: request boundaries, queue flow, retrieval flow, and training lifecycle
- `docs/api-design.md`: request and response contracts for all routes
- `docs/database-schema.md`: Drizzle schema, constraints, and queue tables
- `docs/project-structure.md`: repository layout and key files
- `docs/tech-stack.md`: dependencies, scripts, and environment requirements
- `docs/design-system.md`: UI style direction and component rules
- `docs/changes.md`: implementation change log and documentation sync notes
