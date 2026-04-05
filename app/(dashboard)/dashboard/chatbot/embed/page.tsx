import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { getChatbotByUserId } from "@/lib/db/queries/chatbots";
import { recoverTrainingStatus } from "@/lib/training-status";
import { EmbedPageClient } from "@/components/dashboard/embed-page-client";

export default async function EmbedPage() {
  const session = await auth();

  if (!session?.user?.id) {
    redirect("/login");
  }

  const chatbot = await recoverTrainingStatus(
    await getChatbotByUserId(session.user.id)
  );

  return <EmbedPageClient chatbot={chatbot} />;
}
