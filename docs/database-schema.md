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

One chatbot per user is enforced in application logic.

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
};
```

Current indexing:

- B-tree index on `chatbot_id`
- No ANN vector index is currently defined in the live Drizzle schema

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
- `false` when retrieval is below threshold, even though the chat model may still answer greetings

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

## Embedding Dimensions

The vector type is generated from `EMBEDDING_DIMENSIONS` in `lib/config/embedding.ts`.

- Default dimension: `1536`
- The current migration history includes:
  - initial `1536`
  - a temporary move to `2560`
  - a reset back to `1536` in `0003_embedding_dimension_1536.sql`

Because Postgres vector dimensions cannot be safely cast across arbitrary sizes, the reset migration truncates `documents` before changing the type.

## Relationships

- `users` -> many `chatbots`
- `users` -> many `accounts`
- `chatbots` -> many `documents`
- `chatbots` -> many `queries`

## Migration Notes

`drizzle.config.ts` prefers `DATABASE_URL_UNPOOLED`, but can derive a direct host from a pooled Neon URL when necessary.

Common commands:

```bash
npm run db:generate
npm run db:migrate
npm run db:studio
```
