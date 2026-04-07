import { errorResponse } from "@/lib/api-response";
import { extractErrorMessage } from "@/lib/errors";
import { ragQuery } from "@/lib/ai/rag";
import { chatRateLimit } from "@/lib/rate-limit";
import { parseBody } from "@/lib/validation/parse";
import { chatRequestSchema } from "@/lib/validation/schemas";

/**
 * Pipes `source` through a TransformStream that monitors whether any bytes
 * were forwarded.  If the source closes with zero bytes written the transform
 * flushes an empty-stream sentinel (`\x00`) so the widget's `tokensReceived`
 * flag stays false and the error UI branch is taken instead of a blank bubble.
 */
function guardEmptyStream(source: ReadableStream<Uint8Array>): ReadableStream<Uint8Array> {
  let bytesForwarded = 0;

  const { readable, writable } = new TransformStream<Uint8Array, Uint8Array>({
    transform(chunk, controller) {
      bytesForwarded += chunk.byteLength;
      controller.enqueue(chunk);
    },
    flush(controller) {
      if (bytesForwarded === 0) {
        // Signal an empty response so the widget treats this as an error.
        // The widget ignores any chunk that is solely this NUL byte because
        // TextDecoder produces "" for a single 0x00 byte in some runtimes; we
        // rely on `tokensReceived` staying false rather than any text value.
        controller.enqueue(new Uint8Array([0x00]));
      }
    },
  });

  source.pipeTo(writable).catch(() => {
    // Silently ignore — if the pipe errors the client will see an abrupt close
    // which the widget error handler already handles.
  });

  return readable;
}

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

    // Wrap the stream body so we can detect zero-byte completions.
    // If the upstream model stream closes without yielding any content, we
    // inject an empty-stream marker that the widget can detect and handle.
    const guardedBody = streamResponse.body
      ? guardEmptyStream(streamResponse.body)
      : null;

    return new Response(guardedBody, {
      status: streamResponse.status,
      headers: responseHeaders,
    });
  } catch (error) {
    return errorResponse(
      extractErrorMessage(error, "Internal server error"),
      500,
      CORS_HEADERS
    );
  }
}
