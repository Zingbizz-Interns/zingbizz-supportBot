# System Architecture

## High-Level Overview

```
┌─────────────────────────────────────────────────────────┐
│                   User Dashboard (Next.js)               │
│  Marketing Site │ Auth │ Dashboard │ Customization       │
└────────────────────────┬────────────────────────────────┘
                         │
            ┌────────────▼────────────┐
            │     Next.js API Routes   │
            │  /api/scrape             │
            │  /api/upload             │
            │  /api/train              │
            │  /api/chat  (public)     │
            │  /api/chatbots           │
            └────┬──────────┬─────────┘
                 │          │
        ┌────────▼──┐  ┌────▼──────────────┐
        │ Neon DB   │  │  External Services  │
        │ Postgres  │  │  OpenAI (embed)    │
        │ pgvector  │  │  xAI Grok (LLM)    │
        │ Drizzle   │  │  Vercel Blob (files)│
        └───────────┘  └────────────────────┘

┌────────────────────────────────────────────────────────┐
│              Client's Website (any domain)              │
│                                                         │
│  <script src="yourapp.com/widget.js"                   │
│          data-chatbot-id="abc123">                     │
│                                                         │
│  ┌──────────────────────────────────┐                  │
│  │  Chat Widget (injected DOM)   │                  │
│  │  → Floating bubble (brand color) │                  │
│  │  → Chat window                   │                  │
│  │  → Calls POST /api/chat          │                  │
│  └──────────────────────────────────┘                  │
└────────────────────────────────────────────────────────┘
```

---

## RAG Pipeline

### Ingestion (runs when user clicks "Train")

```
Single pipeline (fire-and-forget after response):
  1. Scrape all selected pages (Cheerio + node-fetch, max 10)
  2. Fetch uploaded files from Vercel Blob URLs
  3. Parse PDFs / plain text
  4. Clean HTML → plain text
  5. Chunk text (~3000 chars, 400-char overlap, sentence-boundary aware)
  6. Generate embeddings (OpenAI text-embedding-3-small, 1536 dims)
  7. Store chunks + embeddings in Neon (pgvector)
  8. Set chatbot training_status = "ready"
  9. On any error: set training_status = "error"
```

### Query (runs on every chat message)

```
1. Receive { chatbotId, message, history[] } from widget
2. Validate chatbotId exists and is active
3. Embed query → OpenAI text-embedding-3-small → 1536-dim vector
4. Vector similarity search:
     SELECT content, metadata, 1 - (embedding <=> $queryVec) AS score
     FROM documents
     WHERE chatbot_id = $chatbotId
     ORDER BY embedding <=> $queryVec
     LIMIT 5
5. If top score < 0.75 threshold → return fallback message
6. Build prompt:
     - System: "You are a helpful assistant for {chatbot_name}. Answer using ONLY the provided context."
     - Context: top-k chunks
     - History: last 3–5 message pairs (passed from widget, not stored)
     - User message
7. Call xAI Grok via Vercel AI SDK streamText()
8. Stream response back to widget
9. Deduplicate source URLs from metadata
10. Log question + answered(bool) to queries table
```

---

## Widget Architecture

```
public/widget.js  (bundled with esbuild, ~20KB target)
  │
  ├── Reads data-chatbot-id from <script> tag
  ├── Fetches chatbot config (name, brand_color, welcome_message)
  │     GET /api/chatbots/{id}/config  (public, cached)
  ├── Injects DOM:
  │     <div id="cb-root">
  │       <button id="cb-bubble">  ← brand_color background
  │       <div id="cb-window">
  │         <div id="cb-messages">
  │         <input id="cb-input">
  │         <button id="cb-send">
  ├── Maintains local message history (array in memory, not persisted)
  ├── POSTs to /api/chat with:
  │     { chatbotId, message, history: last5 }
  ├── Reads streaming response (Vercel AI SDK compatible)
  └── Auto-opens after 3s delay, shows welcome_message
```

**CORS**: `/api/chat` and `/api/chatbots/{id}/config` must allow all origins (`Access-Control-Allow-Origin: *`).

**Rate Limiting**: Per `chatbotId` via Upstash Redis — 50 requests/minute.

---

## Training Status State Machine

```
idle ──► training ──► ready
                  └──► error
```

- `idle`: no training run yet
- `training`: ingestion pipeline running
- `ready`: all pages and files processed, chatbot can answer questions
- `error`: ingestion failed — user can retry

Dashboard polls `GET /api/chatbots/{id}/status` every 3 seconds while `training`.

---

## Authentication Flow

- NextAuth.js v5 with Credentials provider
- Session stored as JWT (no DB adapter needed for MVP)
- Protected routes: all `/dashboard/*` paths
- Public routes: `/api/chat`, `/api/chatbots/{id}/config`, `/widget.js`
- Proxy in `proxy.ts` handles route protection
