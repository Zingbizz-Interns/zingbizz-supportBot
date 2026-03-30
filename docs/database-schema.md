# Database Schema

**Database**: Neon (Serverless Postgres + pgvector)
**ORM**: Drizzle ORM

## Tables

### `users`

```typescript
export const users = pgTable('users', {
  id:           uuid('id').primaryKey().defaultRandom(),
  email:        text('email').notNull().unique(),
  passwordHash: text('password_hash').notNull(),
  createdAt:    timestamp('created_at').defaultNow().notNull(),
})
```

### `chatbots`

```typescript
export const chatbots = pgTable('chatbots', {
  id:              uuid('id').primaryKey().defaultRandom(),
  userId:          uuid('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  name:            text('name').notNull().default('Support Bot'),
  welcomeMessage:  text('welcome_message').notNull().default('Hi! How can I help you today?'),
  fallbackMessage: text('fallback_message').notNull().default("I'm not sure about that. Please contact support."),
  brandColor:      text('brand_color').notNull().default('#2D3A31'),   // hex value
  trainingStatus:  text('training_status').notNull().default('idle'),  // idle | training | ready | error
  createdAt:       timestamp('created_at').defaultNow().notNull(),
  updatedAt:       timestamp('updated_at').defaultNow().notNull(),
})
```

**Constraint**: One chatbot per user enforced at application layer (MVP). Architecture supports multi-chatbot via `userId` FK.

### `documents`

```typescript
export const documents = pgTable('documents', {
  id:        uuid('id').primaryKey().defaultRandom(),
  chatbotId: uuid('chatbot_id').notNull().references(() => chatbots.id, { onDelete: 'cascade' }),
  content:   text('content').notNull(),            // raw text chunk
  metadata:  jsonb('metadata').notNull(),           // { url, title, source_type }
  embedding: vector('embedding', { dimensions: 1536 }).notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
})

// Index for fast vector search per chatbot
export const documentsEmbeddingIndex = index('documents_embedding_idx')
  .on(documents.embedding)
  .using('hnsw')   // HNSW index for fast ANN search
```

**Metadata shape**:
```typescript
type DocumentMetadata = {
  url?: string           // source page URL (for web scrapes)
  title?: string         // page title or filename
  source_type: 'scrape' | 'upload'
  file_name?: string     // original filename (for uploads)
}
```

**Embedding model**: `text-embedding-3-small` → 1536 dimensions

### `queries`

```typescript
export const queries = pgTable('queries', {
  id:        uuid('id').primaryKey().defaultRandom(),
  chatbotId: uuid('chatbot_id').notNull().references(() => chatbots.id, { onDelete: 'cascade' }),
  question:  text('question').notNull(),
  answered:  boolean('answered').notNull().default(false),
  createdAt: timestamp('created_at').defaultNow().notNull(),
})
```

`answered = false` when top similarity score < 0.75 (triggered fallback message).

---

## Vector Search Query

```sql
SELECT
  content,
  metadata,
  1 - (embedding <=> $1::vector) AS similarity_score
FROM documents
WHERE chatbot_id = $2
ORDER BY embedding <=> $1::vector
LIMIT 5;
```

- `<=>` = cosine distance operator (pgvector)
- `1 - cosine_distance` = cosine similarity (0 to 1, higher = more similar)
- Threshold: similarity_score < 0.75 → trigger fallback

---

## Drizzle Migration Setup

```typescript
// drizzle.config.ts
export default {
  schema: './lib/db/schema.ts',
  out: './drizzle/migrations',
  dialect: 'postgresql',
  dbCredentials: {
    url: process.env.DATABASE_URL_UNPOOLED!,
  },
}
```

Run migrations:
```bash
npx drizzle-kit generate   # generate SQL migration
npx drizzle-kit migrate    # apply to Neon
```

## pgvector Setup

The `vector` extension must be enabled in Neon before running migrations:

```sql
CREATE EXTENSION IF NOT EXISTS vector;
```

This is typically pre-enabled on Neon. Verify in the Neon console SQL editor.
