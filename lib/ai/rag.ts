import { embedText } from "./embed";
import { streamChatResponse } from "./chat";
import { searchDocuments } from "../db/queries/documents";
import { logQuery } from "../db/queries/queries";
import { getChatbotById } from "../db/queries/chatbots";
import type { ModelMessage } from "ai";
import type { DocumentMetadata } from "../db/schema";

const SIMILARITY_THRESHOLD = 0.75;

interface RagQueryOptions {
  chatbotId: string;
  message: string;
  history: Array<{ role: "user" | "assistant"; content: string }>;
}

interface RagResult {
  stream: ReturnType<typeof streamChatResponse> | null;
  fallbackText: string | null;
  sources: string[];
  answered: boolean;
}

export async function ragQuery({
  chatbotId,
  message,
  history,
}: RagQueryOptions): Promise<RagResult> {
  // 1. Get chatbot config
  const chatbot = await getChatbotById(chatbotId);
  if (!chatbot) throw new Error("Chatbot not found");

  // 2. Embed the query
  const queryEmbedding = await embedText(message);

  // 3. Vector similarity search
  const results = await searchDocuments(chatbotId, queryEmbedding, 5);

  // 4. Check confidence threshold
  const topScore = results[0]?.similarity ?? 0;
  const answered = topScore >= SIMILARITY_THRESHOLD;

  // 5. Log query (fire-and-forget, don't await)
  logQuery({
    chatbotId,
    question: message,
    answered,
  }).catch(console.error);

  // 6. If below threshold, return fallback directly — no LLM call
  if (!answered || results.length === 0) {
    return { stream: null, fallbackText: chatbot.fallbackMessage, sources: [], answered: false };
  }

  // 7. Build context from retrieved chunks
  const contextChunks = results
    .map((r, i) => `[Context ${i + 1}]\n${r.content}`)
    .join("\n\n---\n\n");

  // 8. Deduplicate sources
  const sources = deduplicateSources(results.map((r) => r.metadata));

  // 9. Build system prompt
  const systemPrompt = buildSystemPrompt(chatbot.name, contextChunks);

  // 10. Build messages array (history + current message)
  const messages: ModelMessage[] = [
    ...history.slice(-10).map((m) => ({
      role: m.role as "user" | "assistant",
      content: m.content,
    })),
    { role: "user" as const, content: message },
  ];

  // 11. Stream response
  const stream = streamChatResponse(systemPrompt, messages);

  return { stream, fallbackText: null, sources, answered: true };
}

function buildSystemPrompt(chatbotName: string, context: string): string {
  return `You are ${chatbotName}, a helpful AI assistant. Answer questions using ONLY the provided context below. Be concise, friendly, and accurate.

If the context doesn't contain enough information to answer the question, say you're not sure and suggest contacting support.

Do NOT make up information. Do NOT reference "the context" or "the document" directly — just answer naturally.

CONTEXT:
${context}`;
}

function deduplicateSources(metadataList: DocumentMetadata[]): string[] {
  const seen = new Set<string>();
  const sources: string[] = [];

  for (const meta of metadataList) {
    const key = meta.url ?? meta.file_name ?? meta.title ?? "";
    if (key && !seen.has(key)) {
      seen.add(key);
      sources.push(meta.title ?? meta.url ?? meta.file_name ?? key);
    }
  }

  return sources;
}
