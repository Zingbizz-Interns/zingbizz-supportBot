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
  sources: Array<{ label: string; url?: string }>;
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

  // 6. Always inject retrieved context when results exist.
  // `answered` only controls the queries log — not context injection.
  // Withholding context on low scores caused the LLM to receive an empty prompt
  // and respond with the fallback even when relevant documents were retrieved.
  let contextChunks = "";
  let sources: Array<{ label: string; url?: string }> = [];

  if (results.length > 0) {
    contextChunks = results
      .map((r, i) => `[Context ${i + 1}]\n${r.content}`)
      .join("\n\n---\n\n");
    sources = deduplicateSources(results.map((r) => r.metadata));
  }

  // 7. Build system prompt
  const systemPrompt = buildSystemPrompt(chatbot.name, contextChunks, chatbot.fallbackMessage);

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

  return { stream, fallbackText: null, sources, answered };
}

function buildSystemPrompt(chatbotName: string, context: string, fallbackMessage: string | null): string {
  const fallback = fallbackMessage || "I'm not sure about that. Please contact support for assistance.";

  return `You are ${chatbotName}, a helpful AI assistant. Answer questions using ONLY the provided context below. Be concise, friendly, and accurate.

If the user sends a basic greeting or conversational pleasantry (e.g., "hi", "hello", "thanks"), respond politely and warmly.
However, if the user asks a specific question and the context doesn't contain enough information to answer it, you MUST reply EXACTLY with this fallback message:
"${fallback}"

Do NOT make up information. Do NOT reference "the context", "the document", or "your training data" directly.

CONTEXT:
${context ? context : "No context available. Only answer greetings."}`;
}

function deduplicateSources(metadataList: DocumentMetadata[]): Array<{ label: string; url?: string }> {
  const seen = new Set<string>();
  const sources: Array<{ label: string; url?: string }> = [];

  for (const meta of metadataList) {
    const key = meta.url ?? meta.file_name ?? meta.title ?? "";
    if (key && !seen.has(key)) {
      seen.add(key);
      sources.push({ label: meta.title ?? meta.file_name ?? meta.url ?? key, url: meta.url });
    }
  }

  return sources;
}
