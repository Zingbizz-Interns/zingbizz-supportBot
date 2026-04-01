# Project Structure

```text
chat-bot/
├── app/
│   ├── (marketing)/
│   │   ├── layout.tsx
│   │   └── page.tsx
│   ├── (auth)/
│   │   ├── layout.tsx
│   │   ├── login/page.tsx
│   │   └── signup/page.tsx
│   ├── (dashboard)/
│   │   ├── layout.tsx
│   │   └── dashboard/
│   │       ├── page.tsx
│   │       ├── insights/page.tsx
│   │       └── chatbot/
│   │           ├── setup/page.tsx
│   │           ├── customize/page.tsx
│   │           ├── sources/page.tsx
│   │           └── embed/page.tsx
│   ├── api/
│   │   ├── auth/
│   │   │   ├── [...nextauth]/route.ts
│   │   │   └── register/route.ts
│   │   ├── agents/
│   │   │   ├── route.ts
│   │   │   └── [id]/
│   │   │       ├── route.ts
│   │   │       ├── config/route.ts
│   │   │       ├── status/route.ts
│   │   │       ├── insights/route.ts
│   │   │       └── sources/
│   │   │           ├── route.ts
│   │   │           └── [sourceId]/route.ts
│   │   ├── chat/route.ts
│   │   ├── scrape/route.ts
│   │   ├── train/route.ts
│   │   └── upload/route.ts
│   ├── favicon.ico
│   ├── globals.css
│   └── layout.tsx
├── components/
│   ├── auth/
│   │   ├── login-form.tsx
│   │   └── signup-form.tsx
│   ├── dashboard/
│   │   ├── bottom-nav.tsx
│   │   ├── sidebar.tsx
│   │   ├── top-bar.tsx
│   │   └── index.ts
│   ├── marketing/
│   │   ├── features.tsx
│   │   ├── footer.tsx
│   │   ├── hero.tsx
│   │   ├── how-it-works.tsx
│   │   └── nav.tsx
│   └── ui/
│       ├── badge.tsx
│       ├── button.tsx
│       ├── card.tsx
│       ├── input.tsx
│       ├── oauth-buttons.tsx
│       ├── paper-texture.tsx
│       ├── textarea.tsx
│       └── index.ts
├── lib/
│   ├── ai/
│   │   ├── chat.ts
│   │   ├── embed.ts
│   │   └── rag.ts
│   ├── config/
│   │   └── embedding.ts
│   ├── db/
│   │   ├── client.ts
│   │   ├── schema.ts
│   │   └── queries/
│   │       ├── accounts.ts
│   │       ├── chatbots.ts
│   │       ├── documents.ts
│   │       ├── queries.ts
│   │       └── users.ts
│   ├── ingestion/
│   │   ├── chunker.ts
│   │   ├── pdf-parser.ts
│   │   ├── pipeline.ts
│   │   └── scraper.ts
│   ├── auth.ts
│   ├── rate-limit.ts
│   └── training-status.ts
├── drizzle/
│   └── migrations/
├── public/
│   └── widget.js
├── widget-src/
│   ├── api.ts
│   ├── index.ts
│   ├── styles.ts
│   ├── types.ts
│   └── ui.ts
├── docs/
├── build-widget.mjs
├── check.ts
├── drizzle.config.ts
├── next.config.ts
├── proxy.ts
├── package.json
└── tsconfig.json
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
- `lib/db/queries/` isolates all database access behind small query helpers.
- `lib/ingestion/` owns scraping, parsing, chunking, and training pipeline utilities.

### `widget-src/`

- Source for the embeddable widget.
- Built into `public/widget.js` with `npm run build:widget`.

## High-Value Files

| File | Responsibility |
|------|----------------|
| `app/api/chat/route.ts` | Public streaming chat endpoint used by the widget |
| `app/api/train/route.ts` | Validates training input, fetches Blob files, and starts ingestion |
| `app/api/agents/route.ts` | Fetches or creates the single chatbot for the logged-in user |
| `lib/ai/rag.ts` | Retrieval, prompt construction, source extraction, and query logging |
| `lib/ai/embed.ts` | Cohere embedding integration and dimension validation |
| `lib/ingestion/pipeline.ts` | Chunk embedding and incremental document insertion |
| `lib/db/schema.ts` | Source of truth for tables and types |
| `proxy.ts` | Redirects unauthenticated users away from `/dashboard` |
| `widget-src/ui.ts` | DOM injection, message streaming UI, and client-side history |
| `build-widget.mjs` | Bundles the widget into a single browser script |
