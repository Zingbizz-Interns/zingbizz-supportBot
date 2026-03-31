# API Design

All routes use Next.js App Router (`app/api/*/route.ts`).

## Authentication

- **Protected routes**: Require valid NextAuth.js session (check with `auth()` helper)
- **Public routes**: `/api/chat`, `/api/chatbots/[id]/config` — open to all origins

---

## Public Endpoints (no auth required)

### `POST /api/chat`

Called by the embeddable widget from any domain.

**Headers required**:
```
Content-Type: application/json
```

**CORS**: `Access-Control-Allow-Origin: *` — must be set explicitly.

**Rate limit**: 50 requests/minute per `chatbotId` (Upstash Redis).

**Request**:
```typescript
{
  chatbotId: string,          // UUID
  message:   string,          // user's message (max 1000 chars)
  history:   Array<{          // last 3–5 pairs, passed from widget memory
    role: 'user' | 'assistant',
    content: string
  }>
}
```

**Response** (streaming — plain text):
```
Content-Type: text/plain; charset=utf-8
X-Sources: ["https://example.com/about","https://example.com/pricing"]

Hello how can I help...
```

The response body is a plain text stream — read chunks directly, no SSE framing.

**Sources**: Sent in the `X-Sources` response header as a JSON-encoded array of strings. Read the header before consuming the body stream. Empty array if no sources or fallback path taken.

**Fallback**: If top similarity score < 0.75, return `chatbot.fallbackMessage` without calling the LLM.

---

### `GET /api/chatbots/[id]/config`

Called by widget.js on load to get chatbot display config.

**CORS**: `Access-Control-Allow-Origin: *`

**Response**:
```typescript
{
  id:             string,
  name:           string,
  welcomeMessage: string,
  brandColor:     string,   // hex e.g. "#2D3A31"
  isReady:        boolean   // false if training_status is not "ready"
}
```

Cached with `Cache-Control: public, max-age=60` (1 minute).

---

## Protected Endpoints (NextAuth session required)

### `POST /api/scrape`

Scrapes a website URL and returns discovered pages.

**Request**:
```typescript
{ url: string }
```

**Response**:
```typescript
{
  pages: Array<{
    url:     string,
    title:   string,
    content: string,   // extracted plain text
    enabled: boolean   // default true
  }>
}
```

**Behavior**: Fetches homepage + internal links (max 10). Uses Cheerio to extract clean text. Strips nav, footer, scripts, styles.

---

### `POST /api/train`

Triggers the ingestion pipeline for a chatbot.

**Request**:
```typescript
{
  chatbotId: string,
  pages:     Array<{ url: string, content: string, title: string }>,   // from scrape
  fileKeys:  string[]   // Vercel Blob URLs for uploaded files
}
```

**Response**:
```typescript
{ success: true, trainingStatus: 'training' }
```

**Behavior**:
1. Sets `training_status = 'training'` immediately
2. Fire-and-forget: fetches each Blob URL, parses content, chunks + embeds all pages and files
3. On completion: sets status to `'ready'`
4. On error: sets status to `'error'`

The pipeline runs as a fire-and-forget async task. Poll `GET /api/chatbots/[id]/status` every 3s until status is `'ready'` or `'error'`.

---

### `POST /api/upload`

Uploads a PDF or text file to Vercel Blob.

**Request**: `multipart/form-data` with `file` field.

**Supported types**: `application/pdf`, `text/plain`

**Max size**: 10MB per file

**Response**:
```typescript
{
  key:      string,   // Vercel Blob URL (full https URL — pass as fileKeys in /api/train)
  filename: string,
  size:     number
}
```

**Behavior**: Uploads to Vercel Blob. Does NOT extract text or embed yet — that happens in `/api/train`.

---

### `GET /api/chatbots`

Returns the current user's chatbot (or null).

**Response**:
```typescript
{
  chatbot: {
    id:              string,
    name:            string,
    welcomeMessage:  string,
    fallbackMessage: string,
    brandColor:      string,
    trainingStatus:  'idle' | 'training' | 'ready' | 'error',
    createdAt:       string
  } | null
}
```

---

### `POST /api/chatbots`

Creates a chatbot for the current user (only allowed if none exists).

**Request**:
```typescript
{
  name?:            string,
  welcomeMessage?:  string,
  fallbackMessage?: string,
  brandColor?:      string
}
```

**Response**: Created chatbot object.

---

### `PATCH /api/chatbots/[id]`

Updates chatbot customization settings.

**Request**: Partial chatbot fields (name, welcomeMessage, fallbackMessage, brandColor).

**Response**: Updated chatbot object.

---

### `GET /api/chatbots/[id]/status`

Lightweight polling endpoint for training status.

**Response**:
```typescript
{ trainingStatus: 'idle' | 'training' | 'ready' | 'error' }
```

Polled every 3 seconds from the dashboard during training.

---

### `GET /api/chatbots/[id]/insights`

Returns query insights for the chatbot.

**Response**:
```typescript
{
  topQuestions: Array<{
    question: string,
    count:    number,
    answered: boolean
  }>,
  unansweredQuestions: Array<{
    question: string,
    askedAt:  string
  }>
}
```

---

### `GET /api/chatbots/[id]/sources`

Returns the list of ingested pages/documents.

**Response**:
```typescript
{
  sources: Array<{
    url?:        string,
    title:       string | null,
    source_type: 'scrape' | 'upload',
    file_name?:  string | null,
    chunk_count: number,
    created_at:  string | null
  }>
}
```

---

### `DELETE /api/chatbots/[id]/sources/[sourceId]`

Deletes all document chunks associated with a specific source (URL or file).

---

## Error Response Format

All errors follow a consistent envelope:

```typescript
{
  error:   string,   // human-readable message
  code?:   string,   // machine-readable error code (optional)
}
```

HTTP status codes:
- `400` — bad request / validation error
- `401` — not authenticated
- `403` — not authorized (e.g., wrong chatbot owner)
- `404` — not found
- `429` — rate limited
- `500` — server error
