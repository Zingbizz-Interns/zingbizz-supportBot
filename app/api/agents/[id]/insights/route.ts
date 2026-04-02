import { auth } from "@/lib/auth";
import { getChatbotById } from "@/lib/db/queries/chatbots";
import {
  getTopQuestions,
  getUnansweredQuestions,
  getQueryStats,
  getDailyQuestionCounts,
} from "@/lib/db/queries/queries";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session?.user?.id) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;

  try {
    const chatbot = await getChatbotById(id);
    if (!chatbot) return Response.json({ error: "Not found" }, { status: 404 });
    if (chatbot.userId !== session.user.id) {
      return Response.json({ error: "Forbidden" }, { status: 403 });
    }

    const [topQuestions, unansweredQuestions, stats, dailyCounts] = await Promise.all([
      getTopQuestions(id, 20),
      getUnansweredQuestions(id, 20),
      getQueryStats(id),
      getDailyQuestionCounts(id, 7),
    ]);

    return Response.json({ topQuestions, unansweredQuestions, stats, dailyCounts });
  } catch (error) {
    const msg = error instanceof Error ? error.message : "Internal server error";
    return Response.json({ error: msg }, { status: 500 });
  }
}
