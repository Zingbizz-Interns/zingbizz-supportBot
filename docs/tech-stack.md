# Tech Stack

## Final Decisions

| Layer | Technology | Version | Why |
|-------|-----------|---------|-----|
| Framework | Next.js | 16 (App Router) | Full-stack, serverless-ready, Vercel-native |
| Auth | NextAuth.js (Auth.js) | v5 | Credentials provider, JWT sessions, extensible to OAuth |
| Database | Neon | latest | Serverless Postgres + pgvector, generous free tier |
| ORM | Drizzle ORM | latest | Type-safe, lightweight, pgvector support, works with Neon |
| LLM | xAI Grok | grok-2 | OpenAI-compatible API, good reasoning, competitive cost |
| AI SDK | Vercel AI SDK | latest | `streamText()`, `useChat()` hook, provider-agnostic |
| Embeddings | OpenAI | text-embedding-3-small | 1536 dims, cheap (~$0.02/1M tokens), fast |
| Scraping | Cheerio + node-fetch | latest | Lightweight (~50KB), serverless-compatible, sufficient for static HTML |
| File Storage | Vercel Blob | latest | Zero-config with Vercel, handles PDF/text uploads |
| Rate Limiting | Upstash Redis | latest | Serverless Redis, per-chatbot rate limiting on `/api/chat` |
| Styling | Tailwind CSS | v4 | Utility-first, matches design system tokens |
| Icons | Lucide React | latest | Thin stroke (1.5px), consistent with design system |
| Fonts | Google Fonts | — | Playfair Display + Source Sans 3 |
| Widget Build | esbuild | latest | Single-file widget.js, minimal bundle size target ~20KB |
| Deployment | Vercel | — | Zero-config Next.js, edge functions, Blob storage |

## Key Packages

```json
{
  "dependencies": {
    "next": "^15.0.0",
    "react": "^19.0.0",
    "next-auth": "^5.0.0",
    "drizzle-orm": "latest",
    "@neondatabase/serverless": "latest",
    "ai": "latest",
    "@ai-sdk/xai": "latest",
    "@ai-sdk/openai": "latest",
    "@vercel/blob": "latest",
    "@upstash/redis": "latest",
    "@upstash/ratelimit": "latest",
    "cheerio": "latest",
    "lucide-react": "latest",
    "pdf-parse": "latest"
  },
  "devDependencies": {
    "drizzle-kit": "latest",
    "esbuild": "latest",
    "tailwindcss": "^4.0.0",
    "@types/node": "latest",
    "typescript": "^5.0.0"
  }
}
```

## Environment Variables Required

```bash
# Database
DATABASE_URL=                    # Neon connection string (pooled)
DATABASE_URL_UNPOOLED=           # Neon direct connection (for migrations)

# Auth
AUTH_SECRET=                     # NextAuth secret (32+ chars)

# AI
OPENAI_API_KEY=                  # OpenAI — for embeddings only
XAI_API_KEY=                     # xAI Grok — for LLM responses

# Storage
BLOB_READ_WRITE_TOKEN=           # Vercel Blob

# Rate Limiting
UPSTASH_REDIS_REST_URL=
UPSTASH_REDIS_REST_TOKEN=
```

## Architecture Decisions

### Why Cheerio over Playwright for scraping?
Playwright is ~100MB and has a long cold-start time on serverless. For MVP, most small business sites are static HTML. Use Cheerio + node-fetch as default; add a Playwright fallback only if a URL returns empty content (indicates JS-rendered page).

### Why Drizzle over Prisma?
Drizzle has native pgvector support, generates lighter queries, and has zero-overhead on edge/serverless. Prisma's query engine is heavy for Vercel Edge Functions.

### Why Vercel AI SDK over raw OpenAI SDK?
The Vercel AI SDK provides `streamText()` and the `useChat()` React hook, which handles streaming, loading states, and message history automatically. Switching LLM providers (Grok → GPT-4o → Claude) is a 1-line config change.

### Why NOT Playwright in production?
On Vercel serverless, binaries like Chromium have a max 250MB limit. Cheerio avoids this entirely. If JS-rendered scraping is needed later, use a headless browser API service (e.g., Browserbase, ScrapingBee).

### Why NOT store full files in Postgres?
Raw PDF/text files can be hundreds of MB. Store only extracted text chunks + their embeddings in Postgres. Archive original files in Vercel Blob (cheap object storage).
