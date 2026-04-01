# ChatBot SaaS

A Next.js 16 SaaS app for creating a single embeddable support chatbot per account. Users can sign up, scrape their site, upload documents, train a RAG knowledge base, customize the assistant, and embed it on any website with one script tag.

## What It Includes

- Marketing site, auth flow, and protected dashboard
- Credentials auth plus optional Google and GitHub OAuth
- Website scraping with Cheerio and document uploads through Vercel Blob
- In-process training pipeline that chunks content, embeds it, and stores vectors in Neon Postgres
- Public widget script at `public/widget.js` backed by `/api/chat`
- Basic insights based on logged questions and unanswered queries

## Quick Start

```bash
npm install
npm run dev
```

Open `http://localhost:3000`.

## Required Environment

Set these before running the app:

- `DATABASE_URL`
- `DATABASE_URL_UNPOOLED` or a pooled `DATABASE_URL` that Drizzle can normalize
- `AUTH_SECRET`
- `BLOB_READ_WRITE_TOKEN`
- `UPSTASH_REDIS_REST_URL`
- `UPSTASH_REDIS_REST_TOKEN`
- `COHERE_API_KEY`
- `XAI_API_KEY`

Optional:

- `GOOGLE_CLIENT_ID` and `GOOGLE_CLIENT_SECRET`
- `GITHUB_ID` and `GITHUB_SECRET`
- `AI_PROVIDER_MODE=test`
- `NVIDIA_NIM_BASE_URL`
- `NVIDIA_NIM_API_KEY`
- `NVIDIA_NIM_CHAT_MODEL`
- `EMBEDDING_DIMENSIONS` (defaults to `1536`)

## Useful Scripts

```bash
npm run dev
npm run build
npm run lint
npm run db:generate
npm run db:migrate
npm run db:studio
npm run build:widget
```

## Notes

- Training runs in-process from `/api/train`. If the server restarts during training, stale `training` chatbots are recovered to `error`.
- The embeddable widget only initializes when `/api/agents/:id/config` reports `isReady: true`.
- `public/widget.js` is generated from `widget-src/` with `npm run build:widget`.

## Documentation

- [Overview](docs/overview.md)
- [Architecture](docs/architecture.md)
- [API Design](docs/api-design.md)
- [Database Schema](docs/database-schema.md)
- [Tech Stack](docs/tech-stack.md)
- [Project Structure](docs/project-structure.md)
- [Design System](docs/design-system.md)
- [Changes Log](docs/changes.md)
