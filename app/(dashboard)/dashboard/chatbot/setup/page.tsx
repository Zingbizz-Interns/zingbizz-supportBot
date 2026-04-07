import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { getChatbotByUserId } from "@/lib/db/queries/chatbots";
import { recoverTrainingStatus } from "@/lib/training-status";
import ChatbotSetupPageClient from "@/components/dashboard/chatbot-setup-page-client";
import type { ChatbotSummary } from "@/types/chatbot";

export default async function ChatbotSetupPage() {
  const session = await auth();

  if (!session?.user?.id) {
    redirect("/login");
  }

  const chatbot = await recoverTrainingStatus(
    await getChatbotByUserId(session.user.id)
  );
  const initialChatbot: ChatbotSummary | null = chatbot
    ? {
        id: chatbot.id,
        name: chatbot.name,
        trainingStatus: chatbot.trainingStatus as ChatbotSummary["trainingStatus"],
      }
    : null;

  return <ChatbotSetupPageClient initialChatbot={initialChatbot} />;
}
