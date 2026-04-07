import { errorResponse, jsonResponse } from "@/lib/api-response";
import { getChatbotById } from "@/lib/db/queries/chatbots";
import { extractErrorMessage } from "@/lib/errors";

const CORS_HEADERS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type",
};

export async function OPTIONS() {
  return new Response(null, { status: 204, headers: CORS_HEADERS });
}

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  try {
    const chatbot = await getChatbotById(id);

    if (!chatbot) {
      return errorResponse("Not found", 404, CORS_HEADERS);
    }

    return jsonResponse(
      {
        id: chatbot.id,
        name: chatbot.name,
        welcomeMessage: chatbot.welcomeMessage,
        brandColor: chatbot.brandColor,
        isReady: chatbot.trainingStatus === "ready",
      },
      {
        status: 200,
        headers: {
          ...CORS_HEADERS,
          "Cache-Control": "public, max-age=60",
        },
      }
    );
  } catch (error) {
    return errorResponse(
      extractErrorMessage(error, "Internal server error"),
      500,
      CORS_HEADERS
    );
  }
}
