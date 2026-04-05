import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { getChatbotByUserId } from "@/lib/db/queries/chatbots";
import { recoverTrainingStatus } from "@/lib/training-status";
import {
  getTopQuestions,
  getUnansweredQuestions,
  getQueryStats,
  getDailyQuestionCounts,
} from "@/lib/db/queries/queries";
import { InsightsPageClient } from "@/components/dashboard/insights-page-client";

export default async function InsightsPage() {
  const session = await auth();

  if (!session?.user?.id) {
    redirect("/login");
  }

  const chatbot = await recoverTrainingStatus(
    await getChatbotByUserId(session.user.id)
  );

  if (!chatbot) {
    redirect("/dashboard/chatbot/setup");
  }

  const [topQuestions, unansweredQuestions, stats, dailyCounts] =
    await Promise.all([
      getTopQuestions(chatbot.id, 20),
      getUnansweredQuestions(chatbot.id, 20),
      getQueryStats(chatbot.id),
      getDailyQuestionCounts(chatbot.id, 7),
    ]);

  // Serialize Date objects so they can be passed to the client component
  const serializedUnanswered = unansweredQuestions.map((q) => ({
    question: q.question,
    askedAt: q.askedAt instanceof Date ? q.askedAt.toISOString() : String(q.askedAt),
  }));

  return (
    <InsightsPageClient
      topQuestions={topQuestions}
      unansweredQuestions={serializedUnanswered}
      stats={stats}
      dailyCounts={dailyCounts}
    />
  );
}
