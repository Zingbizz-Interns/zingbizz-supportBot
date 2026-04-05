import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { Sidebar } from "@/components/dashboard/sidebar";
import { BottomNav } from "@/components/dashboard/bottom-nav";
import { TopBar } from "@/components/dashboard/top-bar";
import type { Metadata } from "next";
import { getChatbotByUserId } from "@/lib/db/queries/chatbots";
import { recoverTrainingStatus } from "@/lib/training-status";
import { isChatbotReady } from "@/lib/chatbot-navigation";

export const metadata: Metadata = {
  robots: {
    index: false,
    follow: false,
    nocache: true,
    googleBot: {
      index: false,
      follow: false,
      noimageindex: true,
      "max-snippet": 0,
      "max-image-preview": "none",
      "max-video-preview": 0,
    },
  },
};
export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await auth();

  if (!session?.user?.id) {
    redirect("/login");
  }

  const chatbot = await recoverTrainingStatus(
    await getChatbotByUserId(session.user.id)
  );
  const canCustomize = isChatbotReady(chatbot);

  return (
    <div className="min-h-screen bg-[#F9F8F4] flex">
      <Sidebar canCustomize={canCustomize} />
      <main className="flex-1 lg:ml-[280px] pb-20 lg:pb-0">
        <TopBar />
        {children}
      </main>
      <BottomNav canCustomize={canCustomize} />
    </div>
  );
}
