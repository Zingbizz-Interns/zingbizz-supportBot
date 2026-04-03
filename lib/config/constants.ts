/** Bcrypt cost factor for password hashing */
export const BCRYPT_ROUNDS = 12;

/** Batch size for embedding API calls (shared between embed.ts and pipeline.ts) */
export const EMBEDDING_BATCH_SIZE = 25;

/** Valid training status values for chatbots */
export const TRAINING_STATUSES = ["idle", "training", "ready", "error"] as const;
export type TrainingStatus = (typeof TRAINING_STATUSES)[number];
