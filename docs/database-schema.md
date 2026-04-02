# Database Schema

Database: Neon Postgres with `pgvector`  
ORM: Drizzle ORM

## Tables

### `users`

Stores login identities.

```ts
users = {
  id: uuid primary key,
  email: text unique not null,
  passwordHash: text nullable,
  createdAt: timestamp not null
}
```

Notes:

- `passwordHash` is nullable so OAuth-only users can exist without credentials

### `accounts`

Stores linked OAuth provider identities.

```ts
accounts = {
  id: uuid primary key,
  userId: uuid references users.id on delete cascade,
  provider: text not null,
  providerAccountId: text not null,
  createdAt: timestamp not null
}
```

Constraint:

- Unique index on `(provider, providerAccountId)`

### `chatbots`

Exactly one chatbot per user is enforced in both application logic and the database.

```ts
chatbots = {
  id: uuid primary key,
  userId: uuid references users.id on delete cascade,
  name: text default "Support Bot",
  welcomeMessage: text default "Hi! How can I help you today?",
  fallbackMessage: text default "I'm not sure about that. Please contact support for assistance.",
  brandColor: text default "#2D3A31",
  trainingStatus: text default "idle",
  createdAt: timestamp not null,
  updatedAt: timestamp not null
}
```

Training states:

- `idle`
- `training`
- `ready`
- `error`

Constraints:

- Unique index on `user_id`
- Check constraint limiting `training_status` to the four known values

### `documents`

Stores chunked source material plus embeddings.

```ts
documents = {
  id: uuid primary key,
  chatbotId: uuid references chatbots.id on delete cascade,
  content: text not null,
  metadata: jsonb not null,
  embedding: vector(EMBEDDING_DIMENSIONS) not null,
  createdAt: timestamp not null
}
```

Metadata shape:

```ts
type DocumentMetadata = {
  url?: string;
  title?: string;
  source_type: "scrape" | "upload";
  file_name?: string;
  blob_url?: string;
};
```

Current indexing:

- B-tree index on `chatbot_id`
- HNSW index on `embedding` using cosine distance, created in migration `0005_db_hardening.sql`

### `training_jobs`

Stores durable queue jobs for chatbot training.

```ts
training_jobs = {
  id: uuid primary key,
  chatbotId: uuid references chatbots.id on delete cascade,
  status: text default "queued",
  payload: jsonb not null,
  attempts: integer default 0,
  maxAttempts: integer default 2,
  lastError: text nullable,
  availableAt: timestamp not null,
  lockedBy: text nullable,
  lockedAt: timestamp nullable,
  leaseExpiresAt: timestamp nullable,
  createdAt: timestamp not null,
  startedAt: timestamp nullable,
  finishedAt: timestamp nullable,
  updatedAt: timestamp not null
}
```

Status values:

- `queued`
- `running`
- `completed`
- `failed`

Constraints and indexes:

- Check constraint limiting status to the four queue states
- Index on `chatbot_id`
- Composite index on `(status, created_at)`
- Partial unique index allowing only one active `queued` or `running` job per chatbot

Payload shape:

```ts
type TrainingJobPayload = {
  pages: Array<{
    url: string;
    title: string;
    content: string;
  }>;
  fileKeys: string[];
};
```

### `queries`

Stores lightweight analytics.

```ts
queries = {
  id: uuid primary key,
  chatbotId: uuid references chatbots.id on delete cascade,
  question: text not null,
  answered: boolean default false,
  createdAt: timestamp not null
}
```

Meaning of `answered`:

- `true` when the top retrieval similarity meets the threshold
- `false` when retrieval is below threshold
- This is an analytics signal, not a transcript-level guarantee that the LLM response was correct or incorrect

## Vector Search

Search is implemented with raw SQL in `lib/db/queries/documents.ts`.

```sql
SELECT
  content,
  metadata,
  1 - (embedding <=> $embedding::vector) AS similarity
FROM documents
WHERE chatbot_id = $chatbotId
ORDER BY embedding <=> $embedding::vector
LIMIT 5;
```

Behavior:

- Uses pgvector cosine distance
- Converts distance to similarity with `1 - distance`
- Uses a `0.75` threshold in `lib/ai/rag.ts`
- Returns the top 5 chunks for prompt construction

## Embedding Dimensions

The vector type is generated from `EMBEDDING_DIMENSIONS` in `lib/config/embedding.ts`.

- Default dimension: `1536`
- The migration history includes:
  - initial `1536`
  - a temporary move to `2560`
  - a reset back to `1536` in `0003_embedding_dimension_1536.sql`

Because Postgres vector dimensions cannot be safely cast across arbitrary sizes, the reset migration truncates `documents` before changing the type.

## Relationships

- `users` -> many `chatbots`
- `users` -> many `accounts`
- `chatbots` -> many `documents`
- `chatbots` -> many `training_jobs`
- `chatbots` -> many `queries`

## Migration Notes

`drizzle.config.ts` prefers `DATABASE_URL_UNPOOLED`, but can derive a direct host from a pooled Neon URL when necessary.

Common commands:

```bash
npm run db:generate
npm run db:migrate
npm run db:studio
```
