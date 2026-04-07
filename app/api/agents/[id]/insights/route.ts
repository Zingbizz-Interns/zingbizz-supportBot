import { errorResponse, jsonResponse } from "@/lib/api-response";
import { requireOwnedChatbot, isAuthError } from "@/lib/auth-helpers";
import { extractErrorMessage } from "@/lib/errors";
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

    return jsonResponse(
      { topQuestions, unansweredQuestions, stats, dailyCounts },
      {
        headers: {
          "Cache-Control": `private, max-age=${CACHE_MAX_AGE_SECONDS}`,
        },
      }
    );
  } catch (error) {
    return errorResponse(extractErrorMessage(error, "Internal server error"), 500);
  }
}
