import {
  pgTable,
  uuid,
  text,
  timestamp,
  boolean,
  integer,
  jsonb,
  index,
  uniqueIndex,
  check,
  customType,
} from "drizzle-orm/pg-core";
import { relations, sql } from "drizzle-orm";
import { EMBEDDING_DIMENSIONS } from "@/lib/config/embedding";
import { COLORS } from "@/lib/design-tokens";

// Custom pgvector type for configurable-dimensional embeddings
const vector = customType<{ data: number[]; driverData: string }>({
  dataType() {
    return `vector(${EMBEDDING_DIMENSIONS})`;
  },
  toDriver(value: number[]): string {
    return `[${value.join(",")}]`;
  },
  fromDriver(value: string): number[] {
    return value
      .replace("[", "")
      .replace("]", "")
      .split(",")
      .map(Number);
  },
});

// ─── Users ────────────────────────────────────────────────────────────────────

export const users = pgTable("users", {
  id: uuid("id").primaryKey().defaultRandom(),
  email: text("email").notNull().unique(),
  passwordHash: text("password_hash"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// ─── OAuth Accounts ───────────────────────────────────────────────────────────

export const accounts = pgTable(
  "accounts",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    provider: text("provider").notNull(),
    providerAccountId: text("provider_account_id").notNull(),
    createdAt: timestamp("created_at").defaultNow().notNull(),
  },
  (table) => ({
    providerAccountIdx: uniqueIndex("accounts_provider_account_idx").on(
      table.provider,
      table.providerAccountId
    ),
  })
);

// ─── Chatbots ─────────────────────────────────────────────────────────────────

export const chatbots = pgTable(
  "chatbots",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    name: text("name").notNull().default("Support Bot"),
    welcomeMessage: text("welcome_message")
      .notNull()
      .default("Hi! How can I help you today?"),
    fallbackMessage: text("fallback_message")
      .notNull()
      .default("I'm not sure about that. Please contact support for assistance."),
    brandColor: text("brand_color").notNull().default(COLORS.primary),
    logoUrl: text("logo_url"),
    personality: text("personality").notNull().default("friendly"),
    tone: text("tone").notNull().default("professional"),
    responseStyle: text("response_style").notNull().default("concise"),
    trainingStatus: text("training_status").notNull().default("idle"),
    // trainingStatus values: idle | training | ready | error
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at").defaultNow().notNull().$onUpdateFn(() => new Date()),
  },
  (table) => ({
    // One chatbot per user — mirrors the UNIQUE INDEX in migration 0005
    userIdUniqueIdx: uniqueIndex("chatbots_user_id_unique_idx").on(table.userId),
    // Only valid training status values — mirrors the CHECK constraint in migration 0005
    trainingStatusCheck: check(
      "chatbots_training_status_check",
      sql`${table.trainingStatus} IN ('idle', 'training', 'ready', 'error')`
    ),
  })
);

// ─── Chatbot Sources ──────────────────────────────────────────────────────────

export const chatbotSources = pgTable(
  "chatbot_sources",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    chatbotId: uuid("chatbot_id")
      .notNull()
      .references(() => chatbots.id, { onDelete: "cascade" }),
    sourceKey: text("source_key").notNull(),
    title: text("title").notNull(),
    url: text("url"),
    sourceType: text("source_type").notNull(),
    fileName: text("file_name"),
    blobUrl: text("blob_url"),
    chunkCount: integer("chunk_count").notNull().default(0),
    isEnabled: boolean("is_enabled").notNull().default(true),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at").defaultNow().notNull().$onUpdateFn(() => new Date()),
  },
  (table) => ({
    chatbotIdIdx: index("chatbot_sources_chatbot_id_idx").on(table.chatbotId),
    chatbotSourceUniqueIdx: uniqueIndex("chatbot_sources_chatbot_id_source_key_idx").on(
      table.chatbotId,
      table.sourceKey
    ),
  })
);

// ─── Documents (embeddings) ───────────────────────────────────────────────────

export const documents = pgTable(
  "documents",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    chatbotId: uuid("chatbot_id")
      .notNull()
      .references(() => chatbots.id, { onDelete: "cascade" }),
    content: text("content").notNull(),
    metadata: jsonb("metadata").notNull(),
    // metadata shape: { url?: string, title?: string, source_type: 'scrape'|'upload'|'pdf'|'txt'|'md'|'docx'|'xlsx'|'csv', file_name?: string }
    embedding: vector("embedding").notNull(),
    createdAt: timestamp("created_at").defaultNow().notNull(),
  },
  (table) => ({
    // B-tree index for filtering by chatbot before the vector scan
    chatbotIdIdx: index("documents_chatbot_id_idx").on(table.chatbotId),
    // HNSW vector index is created via migration 0005 — not representable in Drizzle schema syntax
  })
);

// ─── Training Jobs ────────────────────────────────────────────────────────────

export const trainingJobs = pgTable(
  "training_jobs",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    chatbotId: uuid("chatbot_id")
      .notNull()
      .references(() => chatbots.id, { onDelete: "cascade" }),
    status: text("status").notNull().default("queued"),
    payload: jsonb("payload").$type<TrainingJobPayload>().notNull(),
    attempts: integer("attempts").notNull().default(0),
    maxAttempts: integer("max_attempts").notNull().default(2),
    lastError: text("last_error"),
    availableAt: timestamp("available_at").defaultNow().notNull(),
    lockedBy: text("locked_by"),
    lockedAt: timestamp("locked_at"),
    leaseExpiresAt: timestamp("lease_expires_at"),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    startedAt: timestamp("started_at"),
    finishedAt: timestamp("finished_at"),
    updatedAt: timestamp("updated_at").defaultNow().notNull().$onUpdateFn(() => new Date()),
  },
  (table) => ({
    chatbotIdIdx: index("training_jobs_chatbot_id_idx").on(table.chatbotId),
    statusCreatedAtIdx: index("training_jobs_status_created_at_idx").on(table.status, table.createdAt),
    statusCheck: check(
      "training_jobs_status_check",
      sql`${table.status} IN ('queued', 'running', 'completed', 'failed')`
    ),
  })
);

// ─── Queries (insights) ───────────────────────────────────────────────────────

export const queries = pgTable(
  "queries",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    chatbotId: uuid("chatbot_id")
      .notNull()
      .references(() => chatbots.id, { onDelete: "cascade" }),
    question: text("question").notNull(),
    answered: boolean("answered").notNull().default(false),
    createdAt: timestamp("created_at").defaultNow().notNull(),
  },
  (table) => ({
    chatbotIdIdx: index("queries_chatbot_id_idx").on(table.chatbotId),
  })
);

// ─── Relations ────────────────────────────────────────────────────────────────

export const usersRelations = relations(users, ({ many }) => ({
  chatbots: many(chatbots),
  accounts: many(accounts),
}));

export const accountsRelations = relations(accounts, ({ one }) => ({
  user: one(users, { fields: [accounts.userId], references: [users.id] }),
}));

export const chatbotsRelations = relations(chatbots, ({ one, many }) => ({
  user: one(users, { fields: [chatbots.userId], references: [users.id] }),
  sources: many(chatbotSources),
  documents: many(documents),
  trainingJobs: many(trainingJobs),
  queries: many(queries),
}));

export const chatbotSourcesRelations = relations(chatbotSources, ({ one }) => ({
  chatbot: one(chatbots, {
    fields: [chatbotSources.chatbotId],
    references: [chatbots.id],
  }),
}));

export const documentsRelations = relations(documents, ({ one }) => ({
  chatbot: one(chatbots, {
    fields: [documents.chatbotId],
    references: [chatbots.id],
  }),
}));

export const trainingJobsRelations = relations(trainingJobs, ({ one }) => ({
  chatbot: one(chatbots, {
    fields: [trainingJobs.chatbotId],
    references: [chatbots.id],
  }),
}));

export const queriesRelations = relations(queries, ({ one }) => ({
  chatbot: one(chatbots, {
    fields: [queries.chatbotId],
    references: [chatbots.id],
  }),
}));

// ─── Types ────────────────────────────────────────────────────────────────────

export type User = typeof users.$inferSelect;
export type NewUser = typeof users.$inferInsert;
export type Account = typeof accounts.$inferSelect;
export type NewAccount = typeof accounts.$inferInsert;
export type Chatbot = typeof chatbots.$inferSelect;
export type NewChatbot = typeof chatbots.$inferInsert;
export type ChatbotSource = typeof chatbotSources.$inferSelect;
export type NewChatbotSource = typeof chatbotSources.$inferInsert;
export type Document = typeof documents.$inferSelect;
export type NewDocument = typeof documents.$inferInsert;
export type TrainingJob = typeof trainingJobs.$inferSelect;
export type NewTrainingJob = typeof trainingJobs.$inferInsert;
export type Query = typeof queries.$inferSelect;
export type NewQuery = typeof queries.$inferInsert;

export type DocumentMetadata = {
  url?: string;
  title?: string;
  source_type: "scrape" | "upload" | "pdf" | "txt" | "md" | "docx" | "xlsx" | "csv";
  file_name?: string;
  blob_url?: string; // Full Vercel Blob URL — upload sources only, used for cleanup on deletion
};

export type TrainingJobPayload = {
  mode?: "replace" | "append";
  pages: Array<{
    url: string;
    title: string;
    content: string;
  }>;
  fileKeys: string[];
};
