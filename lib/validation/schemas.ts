import { z } from "zod";

// ─── Auth ─────────────────────────────────────────────────────────────────────

export const registerSchema = z.object({
  email: z.string().email("Invalid email address"),
  password: z.string().min(8, "Password must be at least 8 characters"),
});

// ─── Chatbot ──────────────────────────────────────────────────────────────────

export const createChatbotSchema = z.object({
  name: z.string().min(1, "name must be a non-empty string").trim().optional(),
  welcomeMessage: z.string().optional(),
  fallbackMessage: z.string().optional(),
  brandColor: z.string().optional(),
});

export const updateChatbotSchema = z
  .object({
    name: z.string().min(1, "name must be a non-empty string").trim().optional(),
    welcomeMessage: z.string().optional(),
    fallbackMessage: z.string().optional(),
    brandColor: z.string().optional(),
  })
  .refine(
    (data) => Object.values(data).some((v) => v !== undefined),
    { message: "No valid fields to update" }
  );

// ─── Chat ─────────────────────────────────────────────────────────────────────

const chatMessageSchema = z.object({
  role: z.enum(["user", "assistant"]),
  content: z.string(),
});

export const chatRequestSchema = z.object({
  chatbotId: z.string().min(1, "chatbotId is required"),
  message: z
    .string()
    .min(1, "message is required")
    .max(1000, "message must be 1000 characters or fewer"),
  history: z.array(chatMessageSchema).optional().default([]),
});

// ─── Scrape ───────────────────────────────────────────────────────────────────

export const scrapeRequestSchema = z.object({
  url: z
    .string()
    .url("Invalid URL format")
    .refine(
      (url) => url.startsWith("http://") || url.startsWith("https://"),
      { message: "URL must use http or https protocol" }
    ),
});

// ─── Train ────────────────────────────────────────────────────────────────────

const trainingPageSchema = z.object({
  url: z.string(),
  title: z.string(),
  content: z.string(),
});

export const trainRequestSchema = z
  .object({
    chatbotId: z.string().min(1, "chatbotId is required"),
    mode: z.enum(["replace", "append"]).optional().default("replace"),
    pages: z
      .array(trainingPageSchema)
      .max(10, "You can train with up to 10 scraped pages at a time.")
      .optional()
      .default([]),
    fileKeys: z
      .array(z.string())
      .max(10, "You can train with up to 10 uploaded files at a time.")
      .optional()
      .default([]),
  })
  .refine(
    (data) => data.pages.length > 0 || data.fileKeys.length > 0,
    { message: "At least one page or fileKey must be provided" }
  );

// ─── Inferred types ───────────────────────────────────────────────────────────

export type RegisterInput = z.infer<typeof registerSchema>;
export type CreateChatbotInput = z.infer<typeof createChatbotSchema>;
export type UpdateChatbotInput = z.infer<typeof updateChatbotSchema>;
export type ChatRequestInput = z.infer<typeof chatRequestSchema>;
export type ScrapeRequestInput = z.infer<typeof scrapeRequestSchema>;
export type TrainRequestInput = z.infer<typeof trainRequestSchema>;
