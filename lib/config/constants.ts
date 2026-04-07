/** Bcrypt cost factor for password hashing */
export const BCRYPT_ROUNDS = 12;

/** Batch size for embedding API calls (shared between embed.ts and pipeline.ts) */
export const EMBEDDING_BATCH_SIZE = 25;

/** Max characters per scraped page (shared between scraper and train route) */
export const MAX_PAGE_CONTENT_CHARS = 50_000;

/** Max total characters across all scraped pages in one training job */
export const MAX_TOTAL_PAGE_CHARS = 250_000;

/** Consecutive training-status polling failures before showing a hard error */
export const MAX_STATUS_FAILURES = 3;

/** Valid training status values for chatbots */
export const TRAINING_STATUSES = ["idle", "training", "ready", "error"] as const;
export type TrainingStatus = (typeof TRAINING_STATUSES)[number];
