# Tech Stack

## Runtime Stack

| Layer | Technology | Version in repo | Notes |
|-------|------------|-----------------|-------|
| App framework | Next.js | `16.2.1` | App Router project with route handlers |
| UI runtime | React | `19.2.4` | Paired with `react-dom 19.2.4` |
| Auth | Auth.js / NextAuth | `5.0.0-beta.30` | JWT sessions with credentials and optional OAuth |
| ORM | Drizzle ORM | `0.45.2` | Uses Neon HTTP driver |
| Database | Neon serverless Postgres | package `@neondatabase/serverless 1.0.2` | Stores users, chatbots, queue jobs, vectors, and insights |
| Vector search | pgvector | database extension | Custom Drizzle vector type plus HNSW index migration |
| AI SDK | Vercel AI SDK | `6.0.141` | Used for embeddings and streamed text generation |
| Embeddings | OpenAI | package `@ai-sdk/openai 3.0.48` | `text-embedding-3-small` for query and document vectors |
| Production chat model | xAI | package `@ai-sdk/xai 3.0.74` | `grok-2-1212` |
| Test chat model | NVIDIA NIM | `@ai-sdk/openai-compatible 2.0.37` | Enabled through `AI_PROVIDER_MODE=test` |
| Storage | Vercel Blob | `2.3.2` | Private file uploads resolved through `get(..., { access: "private" })` |
| Rate limiting | Upstash Redis + Ratelimit | `1.37.0` / `2.0.8` | Per-user limits for scrape/upload/train and per-chatbot limits for chat |
| Scraping | Cheerio + built-in fetch | `1.2.0` | HTML-only site scraping |
| PDF parsing | pdf-parse | `2.4.5` | Uses the v2 `PDFParse` class API |
| Chunking | LangChain text splitters | `0.1.0` | Recursive character splitter |
| Styling | Tailwind CSS | `4.2.2` | Tailwind v4 via `@tailwindcss/postcss` |
| Motion | Framer Motion | `12.38.0` | Used in UI layer |
| Widget bundling | esbuild | `0.27.4` | Bundles `widget-src/` into `public/widget.js` |

## Primary Scripts

```bash
npm run dev
npm run build
npm run start
npm run lint
npm run db:generate
npm run db:migrate
npm run db:studio
npm run db:push
npm run build:widget
```

## Environment Requirements

### Required for normal app usage

```bash
DATABASE_URL=
AUTH_SECRET=
BLOB_READ_WRITE_TOKEN=
UPSTASH_REDIS_REST_URL=
UPSTASH_REDIS_REST_TOKEN=
OPENAI_API_KEY=
XAI_API_KEY=
```

### Required for migration workflows

```bash
DATABASE_URL_UNPOOLED=
```

If `DATABASE_URL_UNPOOLED` is not set, `drizzle.config.ts` attempts to derive a direct Neon host from `DATABASE_URL`.

### Optional auth providers

```bash
GOOGLE_CLIENT_ID=
GOOGLE_CLIENT_SECRET=
GITHUB_ID=
GITHUB_SECRET=
```

### Optional test-mode chat provider

```bash
AI_PROVIDER_MODE=test
NVIDIA_NIM_BASE_URL=
NVIDIA_NIM_API_KEY=
NVIDIA_NIM_CHAT_MODEL=
```

### Optional embedding config

```bash
EMBEDDING_DIMENSIONS=1536
```

## Implementation Notes

### AI provider split

- Embeddings and chat generation are configured independently
- Embeddings use OpenAI `text-embedding-3-small`
- Chat generation uses xAI Grok in production and NVIDIA NIM in test mode

### Scraping tradeoff

- The scraper intentionally targets static HTML and same-domain links
- It avoids heavier browser automation and skips non-HTML pages

### Widget deployment

- The embeddable widget is a plain browser script, not a React bundle
- Any changes under `widget-src/` should be followed by `npm run build:widget`

### Training runtime model

- `/api/train` persists work into `training_jobs`
- Queue draining still happens inside the app process
- Job leasing and retry state live in Postgres, so training survives process restarts better than the old in-memory approach
