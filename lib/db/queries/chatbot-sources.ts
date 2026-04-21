import { and, desc, eq, inArray } from "drizzle-orm";
import { db } from "../client";
import { getDocumentSources } from "./documents";
import {
  chatbotSources,
  type ChatbotSource,
  type DocumentMetadata,
} from "../schema";

export const SOURCE_REGISTRY_UNAVAILABLE_MESSAGE =
  "Source controls require the latest database migration. Run npm run db:migrate.";

export function isMissingSourceRegistryError(error: unknown): boolean {
  const value = error instanceof Error
    ? `${error.message} ${String((error as Error & { cause?: unknown }).cause ?? "")}`
    : String(error);
  const normalized = value.toLowerCase();

  return normalized.includes("chatbot_sources") && (
    normalized.includes("does not exist") ||
    normalized.includes("relation") ||
    normalized.includes("column") ||
    normalized.includes("no such table")
  );
}

function toLegacyChatbotSource(
  chatbotId: string,
  source: Awaited<ReturnType<typeof getDocumentSources>>[number]
): ChatbotSource {
  const sourceKey = source.url ?? source.file_name ?? source.title ?? "";
  const createdAt = source.created_at ? new Date(source.created_at) : new Date();

  return {
    id: `legacy:${chatbotId}:${sourceKey}`,
    chatbotId,
    sourceKey,
    title: source.title ?? source.file_name ?? source.url ?? "Untitled source",
    url: source.url,
    sourceType: (
      source.source_type === "scrape" ||
      source.source_type === "upload" ||
      source.source_type === "pdf" ||
      source.source_type === "txt" ||
      source.source_type === "md" ||
      source.source_type === "docx" ||
      source.source_type === "xlsx" ||
      source.source_type === "csv"
        ? source.source_type
        : "txt"
    ) as ChatbotSource["sourceType"],
    fileName: source.file_name,
    blobUrl: null,
    chunkCount: source.chunk_count,
    isEnabled: true,
    createdAt,
    updatedAt: createdAt,
  };
}

function getSourceKeyFromParts({
  url,
  fileName,
  title,
}: {
  url?: string | null;
  fileName?: string | null;
  title?: string | null;
}): string {
  return url ?? fileName ?? title ?? "";
}

export function getSourceKeyFromMetadata(metadata: Pick<DocumentMetadata, "url" | "file_name" | "title">) {
  return getSourceKeyFromParts({
    url: metadata.url,
    fileName: metadata.file_name,
    title: metadata.title,
  });
}

type UpsertSourceInput = {
  chatbotId: string;
  title: string;
  url?: string | null;
  sourceType: ChatbotSource["sourceType"];
  fileName?: string | null;
  blobUrl?: string | null;
  chunkCount: number;
};

export async function listChatbotSources(chatbotId: string): Promise<ChatbotSource[]> {
  try {
    return await db
      .select()
      .from(chatbotSources)
      .where(eq(chatbotSources.chatbotId, chatbotId))
      .orderBy(desc(chatbotSources.createdAt));
  } catch (error) {
    if (!isMissingSourceRegistryError(error)) throw error;
    const legacySources = await getDocumentSources(chatbotId);
    return legacySources.map((source) => toLegacyChatbotSource(chatbotId, source));
  }
}

export async function getChatbotSource(
  chatbotId: string,
  sourceKey: string
): Promise<ChatbotSource | null> {
  try {
    const result = await db
      .select()
      .from(chatbotSources)
      .where(and(
        eq(chatbotSources.chatbotId, chatbotId),
        eq(chatbotSources.sourceKey, sourceKey),
      ))
      .limit(1);

    return result[0] ?? null;
  } catch (error) {
    if (!isMissingSourceRegistryError(error)) throw error;
    return null;
  }
}

export async function listEnabledSourceKeys(chatbotId: string): Promise<string[] | null> {
  try {
    const rows = await db
      .select({ sourceKey: chatbotSources.sourceKey })
      .from(chatbotSources)
      .where(and(
        eq(chatbotSources.chatbotId, chatbotId),
        eq(chatbotSources.isEnabled, true),
      ));

    return rows.map((row) => row.sourceKey);
  } catch (error) {
    if (!isMissingSourceRegistryError(error)) throw error;
    return null;
  }
}

export async function upsertChatbotSource(input: UpsertSourceInput): Promise<ChatbotSource> {
  const sourceKey = getSourceKeyFromParts(input);
  try {
    const result = await db
      .insert(chatbotSources)
      .values({
        chatbotId: input.chatbotId,
        sourceKey,
        title: input.title,
        url: input.url ?? null,
        sourceType: input.sourceType,
        fileName: input.fileName ?? null,
        blobUrl: input.blobUrl ?? null,
        chunkCount: input.chunkCount,
      })
      .onConflictDoUpdate({
        target: [chatbotSources.chatbotId, chatbotSources.sourceKey],
        set: {
          title: input.title,
          url: input.url ?? null,
          sourceType: input.sourceType,
          fileName: input.fileName ?? null,
          blobUrl: input.blobUrl ?? null,
          chunkCount: input.chunkCount,
          updatedAt: new Date(),
        },
      })
      .returning();

    return result[0];
  } catch (error) {
    if (!isMissingSourceRegistryError(error)) throw error;
    return {
      id: `legacy:${input.chatbotId}:${sourceKey}`,
      chatbotId: input.chatbotId,
      sourceKey,
      title: input.title,
      url: input.url ?? null,
      sourceType: input.sourceType,
      fileName: input.fileName ?? null,
      blobUrl: input.blobUrl ?? null,
      chunkCount: input.chunkCount,
      isEnabled: true,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
  }
}

export async function updateChatbotSourceEnabledState(
  chatbotId: string,
  sourceKey: string,
  isEnabled: boolean
): Promise<ChatbotSource | null> {
  try {
    const result = await db
      .update(chatbotSources)
      .set({ isEnabled, updatedAt: new Date() })
      .where(and(
        eq(chatbotSources.chatbotId, chatbotId),
        eq(chatbotSources.sourceKey, sourceKey),
      ))
      .returning();

    return result[0] ?? null;
  } catch (error) {
    if (!isMissingSourceRegistryError(error)) throw error;
    throw new Error(SOURCE_REGISTRY_UNAVAILABLE_MESSAGE);
  }
}

export async function deleteChatbotSource(chatbotId: string, sourceKey: string): Promise<void> {
  try {
    await db
      .delete(chatbotSources)
      .where(and(
        eq(chatbotSources.chatbotId, chatbotId),
        eq(chatbotSources.sourceKey, sourceKey),
      ));
  } catch (error) {
    if (!isMissingSourceRegistryError(error)) throw error;
  }
}

export async function deleteChatbotSources(chatbotId: string, sourceKeys: string[]): Promise<void> {
  if (sourceKeys.length === 0) return;

  try {
    await db
      .delete(chatbotSources)
      .where(and(
        eq(chatbotSources.chatbotId, chatbotId),
        inArray(chatbotSources.sourceKey, sourceKeys),
      ));
  } catch (error) {
    if (!isMissingSourceRegistryError(error)) throw error;
  }
}

export async function clearChatbotSources(chatbotId: string): Promise<void> {
  try {
    await db.delete(chatbotSources).where(eq(chatbotSources.chatbotId, chatbotId));
  } catch (error) {
    if (!isMissingSourceRegistryError(error)) throw error;
  }
}
