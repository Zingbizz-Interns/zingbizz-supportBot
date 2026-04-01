import { and, desc, eq, or, sql } from "drizzle-orm";
import { db } from "../client";
import {
  trainingJobs,
  type NewTrainingJob,
  type TrainingJob,
  type TrainingJobPayload,
} from "../schema";

const DEFAULT_MAX_ATTEMPTS = 2;
const LEASE_MINUTES = 2;
const RETRY_DELAY_SECONDS = 5;

export async function createTrainingJob(
  chatbotId: string,
  payload: TrainingJobPayload
): Promise<TrainingJob> {
  const result = await db
    .insert(trainingJobs)
    .values({
      chatbotId,
      payload,
      status: "queued",
      attempts: 0,
      maxAttempts: DEFAULT_MAX_ATTEMPTS,
    } satisfies NewTrainingJob)
    .returning();

  return result[0];
}

export async function getActiveTrainingJobByChatbot(
  chatbotId: string
): Promise<TrainingJob | null> {
  const result = await db
    .select()
    .from(trainingJobs)
    .where(
      and(
        eq(trainingJobs.chatbotId, chatbotId),
        or(eq(trainingJobs.status, "queued"), eq(trainingJobs.status, "running"))
      )
    )
    .orderBy(desc(trainingJobs.createdAt))
    .limit(1);

  return result[0] ?? null;
}

export async function getLatestTrainingJobByChatbot(
  chatbotId: string
): Promise<TrainingJob | null> {
  const result = await db
    .select()
    .from(trainingJobs)
    .where(eq(trainingJobs.chatbotId, chatbotId))
    .orderBy(desc(trainingJobs.createdAt))
    .limit(1);

  return result[0] ?? null;
}

export async function claimNextTrainingJob(workerId: string): Promise<TrainingJob | null> {
  const result = await db.execute(sql`
    WITH next_job AS (
      SELECT id
      FROM training_jobs
      WHERE (
        status = 'queued'
        AND available_at <= NOW()
      ) OR (
        status = 'running'
        AND lease_expires_at IS NOT NULL
        AND lease_expires_at < NOW()
        AND attempts < max_attempts
      )
      ORDER BY created_at ASC
      LIMIT 1
      FOR UPDATE SKIP LOCKED
    )
    UPDATE training_jobs
    SET
      status = 'running',
      attempts = training_jobs.attempts + 1,
      locked_by = ${workerId},
      locked_at = NOW(),
      lease_expires_at = NOW() + (${LEASE_MINUTES} * INTERVAL '1 minute'),
      started_at = COALESCE(training_jobs.started_at, NOW()),
      updated_at = NOW()
    FROM next_job
    WHERE training_jobs.id = next_job.id
    RETURNING training_jobs.id
  `);

  const row = result.rows[0] as { id: string } | undefined;
  if (!row?.id) return null;

  const claimedJob = await db
    .select()
    .from(trainingJobs)
    .where(eq(trainingJobs.id, row.id))
    .limit(1);

  return claimedJob[0] ?? null;
}

export async function markTrainingJobCompleted(
  jobId: string,
  workerId: string
): Promise<void> {
  await db
    .update(trainingJobs)
    .set({
      status: "completed",
      availableAt: new Date(),
      lockedBy: null,
      lockedAt: null,
      leaseExpiresAt: null,
      finishedAt: new Date(),
      updatedAt: new Date(),
      lastError: null,
    })
    .where(and(eq(trainingJobs.id, jobId), eq(trainingJobs.lockedBy, workerId)));
}

export async function renewTrainingJobLease(
  jobId: string,
  workerId: string
): Promise<void> {
  await db.execute(sql`
    UPDATE training_jobs
    SET
      locked_at = NOW(),
      lease_expires_at = NOW() + (${LEASE_MINUTES} * INTERVAL '1 minute'),
      updated_at = NOW()
    WHERE id = ${jobId}
      AND locked_by = ${workerId}
      AND status = 'running'
  `);
}

export async function retryOrFailTrainingJob(
  job: TrainingJob,
  workerId: string,
  errorMessage: string
): Promise<"queued" | "failed"> {
  if (job.attempts < job.maxAttempts) {
    await db.execute(sql`
      UPDATE training_jobs
      SET
        status = 'queued',
        available_at = NOW() + (${RETRY_DELAY_SECONDS} * INTERVAL '1 second'),
        locked_by = NULL,
        locked_at = NULL,
        lease_expires_at = NULL,
        updated_at = NOW(),
        last_error = ${errorMessage}
      WHERE id = ${job.id}
        AND locked_by = ${workerId}
    `);

    return "queued";
  }

  await db
    .update(trainingJobs)
    .set({
      status: "failed",
      availableAt: new Date(),
      lockedBy: null,
      lockedAt: null,
      leaseExpiresAt: null,
      updatedAt: new Date(),
      finishedAt: new Date(),
      lastError: errorMessage,
    })
    .where(and(eq(trainingJobs.id, job.id), eq(trainingJobs.lockedBy, workerId)));

  return "failed";
}

export async function expireAbandonedTrainingJobs(): Promise<string[]> {
  const result = await db.execute(sql`
    UPDATE training_jobs
    SET
      status = 'failed',
      last_error = COALESCE(last_error, 'Training job lease expired before completion.'),
      available_at = NOW(),
      locked_by = NULL,
      locked_at = NULL,
      lease_expires_at = NULL,
      finished_at = NOW(),
      updated_at = NOW()
    WHERE
      status = 'running'
      AND lease_expires_at IS NOT NULL
      AND lease_expires_at < NOW()
      AND attempts >= max_attempts
    RETURNING chatbot_id
  `);

  return (result.rows as Array<{ chatbot_id: string }>).map((row) => row.chatbot_id);
}
