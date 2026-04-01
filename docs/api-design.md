# API Design

All server routes live under `app/api/`.

## Access Model

- Public routes:
  - `POST /api/chat`
  - `OPTIONS /api/chat`
  - `GET /api/agents/[id]/config`
  - `OPTIONS /api/agents/[id]/config`
  - Auth.js callback routes
  - `POST /api/auth/register`
- Protected routes:
  - Everything else in `app/api/agents`
  - `POST /api/scrape`
  - `POST /api/train`
  - `POST /api/upload`

## Public Endpoints

### `POST /api/chat`

Streaming endpoint used by the widget.

Request body:

```ts
{
  chatbotId: string;
  message: string;
  history?: Array<{
    role: "user" | "assistant";
    content: string;
  }>;
}
```

Behavior:

- Validates JSON, `chatbotId`, and `message`
- Rejects messages over 1000 characters
- Applies Upstash sliding-window rate limiting at 50 requests per minute per `chatbotId`
- Filters `history` server-side to valid `user` and `assistant` entries
- Streams a plain text response body

Response characteristics:

- `Content-Type: text/plain; charset=utf-8`
- `X-Sources` is optionally set to a JSON array of source labels
- CORS headers are included for all origins

Notes:

- `X-Sources` values are display labels derived from metadata, not guaranteed raw URLs
- Low-confidence retrieval currently still goes through the model; the fallback message is enforced in the prompt

### `OPTIONS /api/chat`

Returns `204` with the widget CORS headers.

### `GET /api/agents/[id]/config`

Public widget bootstrap route.

Response:

```ts
{
  id: string;
  name: string;
  welcomeMessage: string;
  brandColor: string;
  isReady: boolean;
}
```

Headers:

- `Access-Control-Allow-Origin: *`
- `Cache-Control: public, max-age=60`

### `OPTIONS /api/agents/[id]/config`

Returns `204` with widget CORS headers.

### `POST /api/auth/register`

Creates a credentials user.

Request body:

```ts
{
  email: string;
  password: string;
}
```

Behavior:

- Requires an email containing `@`
- Requires password length of at least 8
- Rejects duplicate emails
- Returns a provider-specific error when the email already belongs to an OAuth-only account

Success response:

```ts
{
  success: true;
  userId: string;
}
```

## Protected Endpoints

### `GET /api/agents`

Returns the logged-in user's chatbot or `null`.

Response:

```ts
{
  chatbot: {
    id: string;
    userId: string;
    name: string;
    welcomeMessage: string;
    fallbackMessage: string;
    brandColor: string;
    trainingStatus: "idle" | "training" | "ready" | "error";
    createdAt: string;
    updatedAt: string;
  } | null;
}
```

Special behavior:

- Runs stale-training recovery before returning the chatbot

### `POST /api/agents`

Creates the chatbot for the current user.

Request body is optional:

```ts
{
  name?: string;
  welcomeMessage?: string;
  fallbackMessage?: string;
  brandColor?: string;
}
```

Constraints:

- Only one chatbot per account
- Returns `409` if a chatbot already exists

### `PATCH /api/agents/[id]`

Updates chatbot presentation fields.

Allowed fields:

- `name`
- `welcomeMessage`
- `fallbackMessage`
- `brandColor`

### `DELETE /api/agents/[id]`

Deletes the chatbot and all related documents and queries through cascading foreign keys.

### `GET /api/agents/[id]/status`

Returns:

```ts
{
  trainingStatus: "idle" | "training" | "ready" | "error";
}
```

Also performs stale-training recovery before returning the current status.

### `GET /api/agents/[id]/insights`

Returns:

```ts
{
  topQuestions: Array<{
    question: string;
    count: number;
    answered: boolean;
  }>;
  unansweredQuestions: Array<{
    question: string;
    askedAt: string;
  }>;
}
```

### `GET /api/agents/[id]/sources`

Returns grouped document sources:

```ts
{
  sources: Array<{
    url: string | null;
    title: string | null;
    source_type: "scrape" | "upload";
    file_name: string | null;
    chunk_count: number;
    created_at: string | null;
  }>;
}
```

### `DELETE /api/agents/[id]/sources/[sourceId]`

Deletes all document chunks whose metadata matches the decoded `sourceId` by:

- `metadata.url`, or
- `metadata.file_name`

### `POST /api/scrape`

Scrapes up to 10 internal pages from a site.

Request body:

```ts
{
  url: string;
}
```

Response:

```ts
{
  pages: Array<{
    url: string;
    title: string;
    content: string;
  }>;
}
```

Behavior:

- Only accepts `http` and `https`
- Skips non-HTML responses
- Limits per-page and total scraped content
- Removes common nav, header, footer, and script blocks before text extraction

### `POST /api/upload`

Uploads a training file to private Vercel Blob storage.

Accepted extensions:

- `.pdf`
- `.txt`
- `.md`

Maximum size:

- `10 MB`

Success response:

```ts
{
  key: string;
  filename: string;
  size: number;
}
```

`key` is the full Blob URL later passed to `/api/train`.

### `POST /api/train`

Starts the chatbot training job.

Request body:

```ts
{
  chatbotId: string;
  pages?: Array<{
    url: string;
    title: string;
    content: string;
  }>;
  fileKeys?: string[];
}
```

Validation limits:

- Up to 10 pages
- Up to 10 uploaded files
- At least one page or file required
- Scraped page content is trimmed to the configured page and total budgets

Blob handling rules:

- Only `https://*.vercel-storage.com` Blob URLs are fetched
- Private Blob download URLs are resolved with `head()`

Success response:

```ts
{
  success: true;
  trainingStatus: "training";
}
```

## Error Format

Routes generally return:

```ts
{
  error: string;
}
```

Common statuses:

- `400` invalid input
- `401` unauthenticated
- `403` wrong owner
- `404` not found
- `409` chatbot already exists or duplicate registration case
- `422` scrape produced no usable content
- `429` rate limit hit
- `500` unexpected server error
