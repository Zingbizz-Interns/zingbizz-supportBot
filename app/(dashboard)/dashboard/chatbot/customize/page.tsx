import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { CustomizePageClient } from "@/components/dashboard/customize-page-client";
import { getChatbotByUserId } from "@/lib/db/queries/chatbots";
import { recoverTrainingStatus } from "@/lib/training-status";

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

  return <CustomizePageClient chatbot={chatbot} />;
}
