import {
  pgTable,
  uuid,
  text,
  timestamp,
  boolean,
  jsonb,
  index,
  uniqueIndex,
  customType,
} from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";
import { EMBEDDING_DIMENSIONS } from "@/lib/config/embedding";

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

export const chatbots = pgTable("chatbots", {
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
  brandColor: text("brand_color").notNull().default("#2D3A31"),
  trainingStatus: text("training_status").notNull().default("idle"),
  // trainingStatus values: idle | training | ready | error
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

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
    // metadata shape: { url?: string, title?: string, source_type: 'scrape'|'upload', file_name?: string }
    embedding: vector("embedding").notNull(),
    createdAt: timestamp("created_at").defaultNow().notNull(),
  },
  (table) => ({
    chatbotIdIdx: index("documents_chatbot_id_idx").on(table.chatbotId),
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
  documents: many(documents),
  queries: many(queries),
}));

export const documentsRelations = relations(documents, ({ one }) => ({
  chatbot: one(chatbots, {
    fields: [documents.chatbotId],
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
export type Document = typeof documents.$inferSelect;
export type NewDocument = typeof documents.$inferInsert;
export type Query = typeof queries.$inferSelect;
export type NewQuery = typeof queries.$inferInsert;

export type DocumentMetadata = {
  url?: string;
  title?: string;
  source_type: "scrape" | "upload";
  file_name?: string;
};
