import { ragQuery } from "@/lib/ai/rag";
import { chatRateLimit } from "@/lib/rate-limit";

const CORS_HEADERS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type",
};

export async function OPTIONS() {
  return new Response(null, { status: 204, headers: CORS_HEADERS });
}

interface ChatMessage {
  role: "user" | "assistant";
  content: string;
}

interface ChatRequestBody {
  chatbotId: string;
  message: string;
  history?: ChatMessage[];
}

export async function POST(request: Request) {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return Response.json(
      { error: "Invalid JSON body" },
      { status: 400, headers: CORS_HEADERS }
    );
  }

  const { chatbotId, message, history = [] } = body as ChatRequestBody;

  // Validate required fields
  if (!chatbotId || typeof chatbotId !== "string") {
    return Response.json(
      { error: "chatbotId is required" },
      { status: 400, headers: CORS_HEADERS }
    );
  }

  if (!message || typeof message !== "string") {
    return Response.json(
      { error: "message is required" },
      { status: 400, headers: CORS_HEADERS }
    );
  }

  if (message.length > 1000) {
    return Response.json(
      { error: "message must be 1000 characters or fewer" },
      { status: 400, headers: CORS_HEADERS }
    );
  }

  // Rate limiting per chatbotId
  const { success } = await chatRateLimit.limit(chatbotId);
  if (!success) {
    return Response.json(
      { error: "Too many requests. Please slow down." },
      { status: 429, headers: CORS_HEADERS }
    );
  }

  // Validate history shape
  const validHistory: ChatMessage[] = Array.isArray(history)
    ? history.filter(
        (m): m is ChatMessage =>
          m !== null &&
          typeof m === "object" &&
          (m.role === "user" || m.role === "assistant") &&
          typeof m.content === "string"
      )
    : [];

  try {
    const result = await ragQuery({
      chatbotId,
      message,
      history: validHistory,
    });

    // Fallback path: return the message directly without calling the LLM
    if (!result.answered || result.stream === null) {
      return new Response(result.fallbackText ?? "", {
        status: 200,
        headers: { ...CORS_HEADERS, "Content-Type": "text/plain; charset=utf-8" },
      });
    }

    const streamResponse = result.stream.toTextStreamResponse();

    // Merge CORS headers and sources header into the streaming response
    const responseHeaders = new Headers(streamResponse.headers);
    for (const [key, value] of Object.entries(CORS_HEADERS)) {
      responseHeaders.set(key, value);
    }
    if (result.sources.length > 0) {
      responseHeaders.set("X-Sources", JSON.stringify(result.sources));
    }

    return new Response(streamResponse.body, {
      status: streamResponse.status,
      headers: responseHeaders,
    });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Internal server error";
    return Response.json(
      { error: message },
      { status: 500, headers: CORS_HEADERS }
    );
  }
}
