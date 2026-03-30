# CLAUDE.md — AI Assistant Instructions

This file provides context and rules for AI assistants (Claude, Cursor, Copilot, etc.) working on this codebase.

---

## What This Project Is

An AI-powered chatbot SaaS MVP. Small business owners connect their website URL or upload documents, and the platform trains a RAG-based chatbot that can be embedded on any website via a `<script>` tag.

**Full documentation is in `/docs/`** — read those files before making significant changes.

| Doc | Read when... |
|-----|-------------|
| `docs/overview.md` | Understanding the product and user journey |
| `docs/architecture.md` | Understanding the RAG pipeline, widget, or auth flow |
| `docs/tech-stack.md` | Choosing libraries, adding dependencies |
| `docs/database-schema.md` | Modifying DB schema or writing queries |
| `docs/api-design.md` | Adding or modifying API routes |
| `docs/design-system.md` | Building or modifying UI components |
| `docs/project-structure.md` | Understanding where files belong |

---

## Tech Stack (Quick Reference)

- **Framework**: Next.js 16 App Router
- **Auth**: NextAuth.js v5 (Credentials provider, JWT sessions)
- **Database**: Neon (Postgres + pgvector) + Drizzle ORM
- **LLM**: xAI Grok via Vercel AI SDK (`@ai-sdk/xai`)
- **Embeddings**: OpenAI `text-embedding-3-small` via `@ai-sdk/openai` (1536 dims)
- **Streaming**: Vercel AI SDK `streamText()` + `useChat()` React hook
- **File Storage**: Vercel Blob
- **Rate Limiting**: Upstash Redis (`@upstash/ratelimit`)
- **Scraping**: Cheerio + node-fetch (NOT Playwright)
- **Styling**: Tailwind CSS v4
- **Icons**: Lucide React (`strokeWidth={1.5}` always)
- **Fonts**: Playfair Display (headings) + Source Sans 3 (body/UI)
- **Widget**: Separate source in `widget-src/`, bundled with esbuild → `public/widget.js`

---

## Critical Rules

### Never do these:

1. **Never use Playwright or Puppeteer** for scraping — they're too heavy for Vercel serverless. Use Cheerio + node-fetch. Only consider a headless browser API service (Browserbase, ScrapingBee) if JS-rendered scraping is specifically needed.

2. **Never store raw files in Postgres** — use Vercel Blob for original PDFs/text files. Only store extracted text chunks + embeddings in the `documents` table.

3. **Never hardcode API keys** — all secrets via environment variables. See `.env.example` for required vars.

4. **Never skip CORS headers on public endpoints** — `/api/chat` and `/api/chatbots/[id]/config` are called from external domains. They MUST have `Access-Control-Allow-Origin: *`.

5. **Never add rate limiting to dashboard/auth routes** — only `/api/chat` (per `chatbotId`, 50 req/min via Upstash).

6. **Never use Sage Green (`#8C9A84`) for body text** — fails WCAG AA contrast. Use Forest Green (`#2D3A31`) for all meaningful text. Sage is decorative only.

7. **Never use terracotta (`#C27B66`) hover states in the dashboard** — terracotta is for the marketing/landing page and alert accents only. Dashboard button hover: `#3d5245`.

8. **Never use staggered card layout (`translate-y-12`) in the dashboard** — stagger is for landing page feature grids only. Keep dashboard layouts aligned.

9. **Never put Playfair Display on dashboard UI chrome** — navigation, form labels, table headers, and small UI text must use Source Sans 3.

### Always do these:

1. **Always include the paper texture overlay** in `app/layout.tsx` — it's the defining visual element of the design. See `docs/design-system.md` for the exact SVG code.

2. **Always pass the last 3–5 message pairs** from the widget when calling `/api/chat` — chat context is maintained client-side only (not stored in DB).

3. **Always validate `chatbotId` ownership** in protected API routes — check that the chatbot belongs to the authenticated user.

4. **Always log queries** to the `queries` table after each chat interaction — include `answered: false` if top similarity score < 0.75.

5. **Always use `strokeWidth={1.5}`** on all Lucide React icons.

6. **Always deduplicate sources** in RAG responses — if multiple chunks come from the same URL, show that URL once.

---

## Database

- **ORM**: Drizzle ORM
- **Schema file**: `lib/db/schema.ts` — single source of truth
- **Client file**: `lib/db/client.ts` — Neon serverless driver
- **Migrations**: `drizzle/migrations/` — generated with `npx drizzle-kit generate`

**Vector search uses `<=>` (cosine distance)**:
```sql
ORDER BY embedding <=> $queryEmbedding LIMIT 5
```

**Fallback threshold**: If `1 - (embedding <=> queryEmbedding) < 0.75` → use `chatbot.fallbackMessage`.

---

## Authentication

- NextAuth.js v5 (`auth.ts` in `lib/`)
- Sessions are JWT (no DB session table needed for MVP)
- Protected routes: all `(dashboard)` group routes
- Public routes: `/api/chat`, `/api/chatbots/[id]/config`, `public/widget.js`
- `proxy.ts` handles route protection automatically

---

## RAG Pipeline

The core logic lives in `lib/ai/rag.ts`. The flow:

```
widget message → embed query → vector search (top-5) → check similarity threshold
  → if score < 0.75: return fallback message
  → if score >= 0.75: build prompt (system + context + history) → streamText(grok)
  → stream response → deduplicate sources → log to queries table
```

**Ingestion pipeline** is in `lib/ingestion/pipeline.ts`:
```
URL/file → scrape/parse → chunk (500–1000 tokens, 100 overlap) → embed → store in documents
```

---

## Chat Widget

The embeddable widget is a **separate build target**:
- Source: `widget-src/`
- Output: `public/widget.js` (single file, ~20KB target)
- Build: `esbuild` (no React — vanilla JS only for minimal footprint)
- The widget maintains message history in memory (array), never in localStorage or server

Widget calls two public API endpoints:
1. `GET /api/chatbots/{id}/config` — on load, to get name/color/welcome message
2. `POST /api/chat` — on each user message (streaming)

---

## Styling Rules

All components must follow the Botanical design system. Key Tailwind classes:

```
Cards:         rounded-3xl bg-white shadow-sm hover:-translate-y-1 hover:shadow-lg duration-500
Buttons:       rounded-full uppercase tracking-widest text-sm duration-300
Inputs:        rounded-full bg-[#F2F0EB] focus:ring-2 focus:ring-[#8C9A84]
Containers:    max-w-7xl mx-auto px-4 md:px-8
Section pad:   py-24 md:py-32 (landing), py-8 md:py-12 (dashboard)
```

For full token reference, see `docs/design-system.md`.

---

## Folder Conventions

- `app/` — Next.js pages and API routes only. No business logic.
- `lib/` — All business logic, DB queries, AI calls, utilities.
- `components/ui/` — Reusable base components (no app-specific logic).
- `components/dashboard/` — Dashboard-specific components.
- `components/marketing/` — Landing page components.
- `widget-src/` — Widget source (compiled separately).
- `docs/` — Documentation (update when changing architecture).

---

## Environment Variables

Required vars (see `.env.example`):

```
DATABASE_URL                 Neon pooled connection
DATABASE_URL_UNPOOLED        Neon direct (for drizzle-kit migrations)
AUTH_SECRET                  NextAuth secret
OPENAI_API_KEY               For embeddings (text-embedding-3-small)
XAI_API_KEY                  For xAI Grok LLM
BLOB_READ_WRITE_TOKEN        Vercel Blob
UPSTASH_REDIS_REST_URL       Upstash Redis
UPSTASH_REDIS_REST_TOKEN     Upstash Redis
```

---

## MVP Constraints

- **1 chatbot per user** — enforced at application layer, not DB constraint
- **No billing** — Stripe deferred to v2
- **No OAuth** — credentials only (email + password)
- **No chat history persistence** — history lives in widget memory only
- **Max 10 pages scraped** per training run
- **Max 10MB** per uploaded file

---

## What's NOT Built Yet (Future v2)

- Multiple chatbots per account
- Stripe billing / subscription tiers
- OAuth providers (Google, GitHub)
- Human handoff (WhatsApp/email escalation)
- Shopify / WordPress plugins
- Full conversation history dashboard
- Domain allowlisting for the widget
- Custom LLM fine-tuning
