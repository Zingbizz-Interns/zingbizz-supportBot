import { requireOwnedChatbot, isAuthError } from "@/lib/auth-helpers";
import {
  getTopQuestions,
  getUnansweredQuestions,
  getQueryStats,
  getDailyQuestionCounts,
} from "@/lib/db/queries/queries";

const CACHE_MAX_AGE_SECONDS = 30;

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  const authResult = await requireOwnedChatbot(id);
  if (isAuthError(authResult)) return authResult.response;

  try {
    const [topQuestions, unansweredQuestions, stats, dailyCounts] = await Promise.all([
      getTopQuestions(id, 20),
      getUnansweredQuestions(id, 20),
      getQueryStats(id),
      getDailyQuestionCounts(id, 7),
    ]);

    return Response.json(
      { topQuestions, unansweredQuestions, stats, dailyCounts },
      {
        headers: {
          "Cache-Control": `private, max-age=${CACHE_MAX_AGE_SECONDS}`,
        },
      }
    );
  } catch (error) {
    const msg = error instanceof Error ? error.message : "Internal server error";
    return Response.json({ error: msg }, { status: 500 });
  }
}
