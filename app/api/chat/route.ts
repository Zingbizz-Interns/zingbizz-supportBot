import { ragQuery } from "@/lib/ai/rag";
import { chatRateLimit } from "@/lib/rate-limit";
import { parseBody } from "@/lib/validation/parse";
import { chatRequestSchema } from "@/lib/validation/schemas";

const CORS_HEADERS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type",
};

export async function OPTIONS() {
  return new Response(null, { status: 204, headers: CORS_HEADERS });
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

  const parsed = parseBody(chatRequestSchema, body, CORS_HEADERS);
  if (!parsed.ok) return parsed.response;

  const { chatbotId, message, history } = parsed.data;

  // Rate limiting per chatbotId
  const { success } = await chatRateLimit.limit(chatbotId);
  if (!success) {
    return Response.json(
      { error: "Too many requests. Please slow down." },
      { status: 429, headers: CORS_HEADERS }
    );
  }

  try {
    const result = await ragQuery({ chatbotId, message, history });

    if (!result.stream) {
      return new Response(result.fallbackText ?? "", {
        status: 200,
        headers: { ...CORS_HEADERS, "Content-Type": "text/plain; charset=utf-8" },
      });
    }

    const streamResponse = result.stream.toTextStreamResponse();

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
    const msg = error instanceof Error ? error.message : "Internal server error";
    return Response.json(
      { error: msg },
      { status: 500, headers: CORS_HEADERS }
    );
  }
}
