import { getChatbotById } from "@/lib/db/queries/chatbots";

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
      return Response.json(
        { error: "Not found" },
        { status: 404, headers: CORS_HEADERS }
      );
    }

    return Response.json(
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
    const msg =
      error instanceof Error ? error.message : "Internal server error";
    return Response.json(
      { error: msg },
      { status: 500, headers: CORS_HEADERS }
    );
  }
}
