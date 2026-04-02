import { randomUUID } from "node:crypto";
import { get } from "@vercel/blob";
import { updateChatbot } from "@/lib/db/queries/chatbots";
import {
  claimNextTrainingJob,
  createTrainingJob,
  expireAbandonedTrainingJobs,
  getActiveTrainingJobByChatbot,
  getLatestTrainingJobByChatbot,
  markTrainingJobCompleted,
  renewTrainingJobLease,
  retryOrFailTrainingJob,
} from "@/lib/db/queries/training-jobs";
import { type TrainingJob, type TrainingJobPayload } from "@/lib/db/schema";
import { runIngestionPipeline, type IngestionFile, type IngestionPage } from "@/lib/ingestion/pipeline";
import { extractTextFromPdf, extractTextFromPlainText } from "@/lib/ingestion/pdf-parser";

type QueueGlobal = typeof globalThis & {
  __trainingQueueDrain?: Promise<void>;
};

const queueGlobal = globalThis as QueueGlobal;

function isTrainingJobPayload(value: unknown): value is TrainingJobPayload {
  if (!value || typeof value !== "object") return false;

  const payload = value as Record<string, unknown>;
  if (payload.mode !== undefined && payload.mode !== "replace" && payload.mode !== "append") {
    return false;
  }
  if (!Array.isArray(payload.pages) || !Array.isArray(payload.fileKeys)) return false;

  return payload.pages.every((page) => {
    if (!page || typeof page !== "object") return false;
    const item = page as Record<string, unknown>;
    return (
      typeof item.url === "string" &&
      typeof item.title === "string" &&
      typeof item.content === "string"
    );
  }) && payload.fileKeys.every((key) => typeof key === "string");
}

async function resolveTrainingFiles(
  fileKeys: string[],
  onProgress?: () => Promise<void>
): Promise<IngestionFile[]> {
  const ingestionFiles: IngestionFile[] = [];

  for (const blobUrl of fileKeys) {
    await onProgress?.();

    try {
      const parsed = new URL(blobUrl);
      if (parsed.protocol !== "https:" || !parsed.hostname.endsWith(".vercel-storage.com")) {
        console.warn("[training-queue] Rejected non-Blob URL:", parsed.hostname);
        continue;
      }

      const blobResult = await get(blobUrl, { access: "private" });
      if (!blobResult?.stream) {
        console.error("[training-queue] Failed to download blob:", blobUrl);
        continue;
      }

      const buffer = Buffer.from(await new Response(blobResult.stream).arrayBuffer());
      const fileName = parsed.pathname.split("/").pop() ?? "file";
      const content = fileName.toLowerCase().endsWith(".pdf")
        ? await extractTextFromPdf(buffer)
        : await extractTextFromPlainText(buffer);

      const trimmedContent = content.trim();
      if (!trimmedContent) {
        console.warn(`[training-queue] No text extracted from ${fileName}`);
        continue;
      }

      ingestionFiles.push({ fileName, content: trimmedContent, blobUrl });
    } catch (error) {
      console.error("[training-queue] Error resolving file", blobUrl, ":", error);
    }
  }

  return ingestionFiles;
}

async function processTrainingJob(job: TrainingJob, workerId: string): Promise<void> {
  const payload = job.payload;
  if (!isTrainingJobPayload(payload)) {
    throw new Error("Training job payload is invalid.");
  }

  const pages: IngestionPage[] = payload.pages;
  const files = await resolveTrainingFiles(
    payload.fileKeys,
    async () => renewTrainingJobLease(job.id, workerId)
  );

  if (pages.length === 0 && files.length === 0) {
    throw new Error(
      "No content could be extracted from the provided files. The PDF may be corrupt, scanned-only, or password-protected."
    );
  }

  await updateChatbot(job.chatbotId, { trainingStatus: "training" });
  await renewTrainingJobLease(job.id, workerId);

  await runIngestionPipeline(
    job.chatbotId,
    pages,
    files,
    payload.mode ?? "replace",
    async () => renewTrainingJobLease(job.id, workerId)
  );

  await markTrainingJobCompleted(job.id, workerId);
}

async function reconcileExpiredJobs(): Promise<void> {
  const chatbotIds = await expireAbandonedTrainingJobs();

  for (const chatbotId of chatbotIds) {
    await updateChatbot(chatbotId, { trainingStatus: "error" });
  }
}

async function drainTrainingQueue(): Promise<void> {
  const workerId = `training-worker:${randomUUID()}`;

  await reconcileExpiredJobs();

  while (true) {
    const job = await claimNextTrainingJob(workerId);
    if (!job) return;

    try {
      await processTrainingJob(job, workerId);
    } catch (error) {
      const message = error instanceof Error ? error.message : "Training job failed.";
      console.error("[training-queue] Job failed:", job.id, message);

      const nextStatus = await retryOrFailTrainingJob(job, workerId, message);
      await updateChatbot(job.chatbotId, {
        trainingStatus: nextStatus === "queued" ? "training" : "error",
      });
    }
  }
}

export function kickTrainingQueue(): void {
  if (queueGlobal.__trainingQueueDrain) return;

  const drainPromise = drainTrainingQueue()
    .catch((error) => {
      console.error("[training-queue] Worker crashed:", error);
    })
    .finally(() => {
      if (queueGlobal.__trainingQueueDrain === drainPromise) {
        queueGlobal.__trainingQueueDrain = undefined;
      }
    });

  queueGlobal.__trainingQueueDrain = drainPromise;
}

export async function enqueueTrainingJob(
  chatbotId: string,
  payload: TrainingJobPayload
): Promise<TrainingJob> {
  const existingJob = await getActiveTrainingJobByChatbot(chatbotId);
  if (existingJob) {
    await updateChatbot(chatbotId, { trainingStatus: "training" });
    kickTrainingQueue();
    return existingJob;
  }

  let job: TrainingJob;
  try {
    job = await createTrainingJob(chatbotId, payload);
  } catch (error) {
    const activeJob = await getActiveTrainingJobByChatbot(chatbotId);
    if (activeJob) {
      await updateChatbot(chatbotId, { trainingStatus: "training" });
      kickTrainingQueue();
      return activeJob;
    }

    throw error;
  }

  await updateChatbot(chatbotId, { trainingStatus: "training" });
  kickTrainingQueue();
  return job;
}

export async function syncChatbotTrainingStatus(
  chatbotId: string,
  currentStatus: "idle" | "training" | "ready" | "error"
): Promise<"idle" | "training" | "ready" | "error"> {
  const activeJob = await getActiveTrainingJobByChatbot(chatbotId);
  if (activeJob) {
    kickTrainingQueue();
    return "training";
  }

  const latestJob = await getLatestTrainingJobByChatbot(chatbotId);
  if (!latestJob) {
    return currentStatus === "training" ? "error" : currentStatus;
  }

  if (latestJob.status === "completed") return "ready";
  if (latestJob.status === "failed") return "error";

  kickTrainingQueue();
  return "training";
}
