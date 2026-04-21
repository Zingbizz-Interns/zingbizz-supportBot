import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { CustomizePageClient } from "@/components/dashboard/customize-page-client";
import { getChatbotByUserId } from "@/lib/db/queries/chatbots";
import { recoverTrainingStatus } from "@/lib/training-status";
import type { ChatbotConfig } from "@/types/chatbot";

export default async function CustomizePage() {
  const session = await auth();

  if (!session?.user?.id) {
    redirect("/login");
  }

  const chatbot = await recoverTrainingStatus(
    await getChatbotByUserId(session.user.id)
  );

  if (!chatbot || chatbot.trainingStatus !== "ready") {
    redirect("/dashboard/chatbot/setup");
  }

  const chatbotConfig: ChatbotConfig = {
    id: chatbot.id,
    name: chatbot.name,
    trainingStatus: chatbot.trainingStatus as ChatbotConfig["trainingStatus"],
    welcomeMessage: chatbot.welcomeMessage,
    fallbackMessage: chatbot.fallbackMessage,
    brandColor: chatbot.brandColor,
    logoUrl: chatbot.logoUrl || null,
    personality: chatbot.personality,
    tone: chatbot.tone,
    responseStyle: chatbot.responseStyle,
  };

  return <CustomizePageClient chatbot={chatbotConfig} />;
}
