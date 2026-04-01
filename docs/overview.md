# Project Overview

## Product

This repository contains a hosted support-chatbot SaaS built with Next.js 16. A user signs up, creates one chatbot, trains it on scraped web pages and uploaded documents, customizes its presentation, and embeds it on an external site with a single `<script>` tag.

## Current Product Flow

1. User signs up with credentials or optional OAuth.
2. The dashboard creates one chatbot record for the account.
3. The user scrapes up to 10 pages from a site and/or uploads up to 10 files.
4. `/api/train` kicks off an in-process ingestion job.
5. Content is chunked, embedded, and written into the `documents` table.
6. The chatbot becomes `ready` when training finishes.
7. The user customizes the chatbot name, welcome message, fallback message, and brand color.
8. The user copies a script snippet that loads `public/widget.js`.
9. The public widget calls `/api/chat` and streams responses from the RAG pipeline.
10. Dashboard insights are built from entries in the `queries` table.

## Supported Inputs

- Website pages discovered by the scraper
- PDF uploads
- Plain text uploads
- Markdown uploads

## Current Constraints

- One chatbot per user account
- No persisted conversation transcripts
- Training jobs run in the Next.js process, not in a separate worker
- Widget initialization is blocked until `trainingStatus === "ready"`
- Analytics are lightweight and question-based, not conversation-thread based
- Widget allowlisting and billing are not implemented

## Authentication Model

- Credentials auth is always available
- Google OAuth is enabled only when `GOOGLE_CLIENT_ID` and `GOOGLE_CLIENT_SECRET` are set
- GitHub OAuth is enabled only when `GITHUB_ID` and `GITHUB_SECRET` are set
- Protected dashboard routes are enforced in both `proxy.ts` and the dashboard layout

## AI Behavior

- Document and query embeddings use OpenAI text-embedding-3-small (1536 dims)
- Production chat responses use xAI Grok through the Vercel AI SDK
- Test mode can swap chat generation to NVIDIA NIM via `AI_PROVIDER_MODE=test`
- When retrieval confidence is low, the app still calls the chat model, but the system prompt forces the configured fallback message for factual questions and allows simple greetings

## Docs Map

- `docs/architecture.md`: runtime flow, widget flow, and training lifecycle
- `docs/api-design.md`: request and response contracts for all routes
- `docs/database-schema.md`: Drizzle schema and query model
- `docs/project-structure.md`: repository layout and key files
- `docs/tech-stack.md`: dependencies, scripts, and environment requirements
