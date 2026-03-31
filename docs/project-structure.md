# Project Structure

```
chat-bot/
│
├── app/                                  # Next.js 16 App Router
│   ├── (marketing)/                      # Route group: public landing pages
│   │   ├── layout.tsx                    # Marketing layout (full botanical style)
│   │   └── page.tsx                      # Landing page
│   │
│   ├── (auth)/                           # Route group: authentication
│   │   ├── login/
│   │   │   └── page.tsx
│   │   └── signup/
│   │       └── page.tsx
│   │
│   ├── (dashboard)/                      # Route group: protected app
│   │   ├── layout.tsx                    # Dashboard layout (sidebar + top nav)
│   │   ├── page.tsx                      # Dashboard home / overview
│   │   ├── chatbot/
│   │   │   ├── setup/
│   │   │   │   └── page.tsx              # Step 1: URL input + file upload + Train button
│   │   │   ├── customize/
│   │   │   │   └── page.tsx              # Step 2: Name, color, messages
│   │   │   ├── sources/
│   │   │   │   └── page.tsx              # Manage scraped pages + uploaded files
│   │   │   └── embed/
│   │   │       └── page.tsx              # Get embed code snippet
│   │   └── insights/
│   │       └── page.tsx                  # Top questions + unanswered questions
│   │
│   ├── api/
│   │   ├── auth/
│   │   │   └── [...nextauth]/route.ts    # NextAuth.js v5 handler
│   │   ├── chat/
│   │   │   └── route.ts                  # POST — public widget chat endpoint (streaming)
│   │   ├── scrape/
│   │   │   └── route.ts                  # POST — scrape a URL
│   │   ├── train/
│   │   │   └── route.ts                  # POST — trigger ingestion pipeline
│   │   ├── upload/
│   │   │   └── route.ts                  # POST — upload PDF/text to Vercel Blob
│   │   └── chatbots/
│   │       ├── route.ts                  # GET (list), POST (create)
│   │       └── [id]/
│   │           ├── route.ts              # PATCH (update), DELETE
│   │           ├── config/route.ts       # GET — public config for widget
│   │           ├── status/route.ts       # GET — training status (polled)
│   │           ├── insights/route.ts     # GET — query insights
│   │           └── sources/
│   │               ├── route.ts          # GET — list sources
│   │               └── [sourceId]/
│   │                   └── route.ts      # DELETE — remove source
│   │
│   ├── globals.css                       # Tailwind base + CSS custom properties
│   └── layout.tsx                        # Root layout (paper texture, fonts)
│
├── components/
│   ├── ui/                               # Base design system primitives
│   │   ├── button.tsx                    # Primary + secondary variants
│   │   ├── card.tsx                      # rounded-3xl card with hover
│   │   ├── input.tsx                     # Pill + underline variants
│   │   ├── badge.tsx
│   │   └── paper-texture.tsx             # The SVG noise overlay component
│   │
│   ├── marketing/                        # Landing page sections
│   │   ├── nav.tsx                       # Top nav (desktop + mobile hamburger)
│   │   ├── hero.tsx                      # Hero section with arch image
│   │   ├── features.tsx                  # Staggered feature cards
│   │   ├── how-it-works.tsx
│   │   └── footer.tsx
│   │
│   └── dashboard/                        # Dashboard-specific components
│       ├── sidebar.tsx                   # Fixed left nav (desktop only)
│       ├── bottom-nav.tsx                # Bottom tab bar (mobile only)
│       └── top-bar.tsx                   # Mobile header with brand name + sign-out
│
├── lib/
│   ├── db/
│   │   ├── schema.ts                     # Drizzle ORM table definitions
│   │   ├── client.ts                     # Neon + Drizzle client singleton
│   │   └── queries/
│   │       ├── chatbots.ts               # Chatbot CRUD queries
│   │       ├── documents.ts              # Document insert + vector search
│   │       └── queries.ts                # Insights query logging
│   │
│   ├── ai/
│   │   ├── embed.ts                      # OpenAI text-embedding-3-small
│   │   ├── chat.ts                       # xAI Grok via Vercel AI SDK streamText()
│   │   └── rag.ts                        # Full RAG pipeline (embed → search → prompt → stream)
│   │
│   ├── ingestion/
│   │   ├── scraper.ts                    # Cheerio + node-fetch web scraper
│   │   ├── chunker.ts                    # Text chunking (500–1000 tokens, overlap)
│   │   ├── pdf-parser.ts                 # pdf-parse wrapper for file uploads
│   │   └── pipeline.ts                   # Orchestrates: scrape → chunk → embed → store
│   │
│   ├── auth.ts                           # NextAuth.js v5 config
│   └── rate-limit.ts                     # Upstash Redis rate limiter
│
├── proxy.ts                              # NextAuth route protection (session check for /dashboard/*)
│
├── public/
│   └── widget.js                         # Bundled embeddable chat widget (esbuild output)
│
├── widget-src/                           # Widget source (compiled to public/widget.js)
│   ├── index.ts                          # Entry point
│   ├── ui.ts                             # DOM injection logic
│   ├── api.ts                            # Streaming fetch to /api/chat
│   └── styles.ts                         # Inlined CSS string
│
├── drizzle/
│   └── migrations/                       # Auto-generated SQL migration files
│
├── docs/                                 # Project documentation (this folder)
│   ├── overview.md
│   ├── architecture.md
│   ├── tech-stack.md
│   ├── database-schema.md
│   ├── api-design.md
│   ├── design-system.md
│   └── project-structure.md
│
├── CLAUDE.md                             # Claude Code instructions for this project
├── .env.local                            # Environment variables (never commit)
├── .env.example                          # Template for env vars (commit this)
├── next.config.ts
├── tailwind.config.ts
├── drizzle.config.ts
├── tsconfig.json
└── package.json
```

## Key File Responsibilities

| File | Purpose |
|------|---------|
| `app/layout.tsx` | Paper texture overlay, font loading, global providers |
| `lib/db/schema.ts` | Single source of truth for DB schema |
| `lib/ai/rag.ts` | Core RAG pipeline — touch with care |
| `lib/ingestion/pipeline.ts` | Ingestion orchestrator — called by `/api/train` |
| `proxy.ts` | Route protection — all `/dashboard/*` require auth |
| `widget-src/index.ts` | Widget entry — compiled to `public/widget.js` |
| `CLAUDE.md` | Instructions for AI assistants working on this project |
