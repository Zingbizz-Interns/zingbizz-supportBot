import Link from "next/link";
import { auth } from "@/lib/auth";
import { Card } from "@/components/ui/card";
import { Settings, Palette, Code, ArrowRight } from "lucide-react";
import { getChatbotByUserId } from "@/lib/db/queries/chatbots";
import { recoverTrainingStatus } from "@/lib/training-status";
import { isChatbotReady } from "@/lib/chatbot-navigation";

interface QuickLink {
  key: string;
  label: string;
  description: string;
  href: string;
  icon: React.ComponentType<{ size?: number; strokeWidth?: number; className?: string }>;
}

export default async function DashboardPage() {
  const session = await auth();
  const email = session?.user?.email ?? "";
  const displayName = email.split("@")[0] ?? "there";
  const chatbot =
    session?.user?.id
      ? await recoverTrainingStatus(await getChatbotByUserId(session.user.id))
      : null;
  const canCustomize = isChatbotReady(chatbot);
  const quickLinks: QuickLink[] = [
    {
      key: "setup",
      label: "Setup Chatbot",
      description: "Train your chatbot on your website or documents.",
      href: "/dashboard/chatbot/setup",
      icon: Settings,
    },
    {
      key: "customize",
      label: "Customize",
      description: canCustomize
        ? "Adjust the look, name, and welcome message."
        : "Complete setup and training before customizing your chatbot.",
      href: "/dashboard/chatbot/customize",
      icon: Palette,
    },
    {
      key: "embed",
      label: "Embed",
      description: "Get the script tag and add it to your site.",
      href: "/dashboard/chatbot/embed",
      icon: Code,
    },
  ];

  const trainingContent = chatbot?.trainingStatus === "ready"
    ? {
        title: "Training complete",
        description: "Your chatbot is ready to customize and embed.",
        badgeLabel: "Ready",
        badgeClassName: "bg-[#2D3A31] text-white",
        actionLabel: "Manage chatbot",
      }
    : chatbot?.trainingStatus === "training"
      ? {
          title: "Training in progress",
          description: "We're processing your content and building your chatbot knowledge base.",
          badgeLabel: "Training",
          badgeClassName: "bg-[#F2F0EB] text-[#2D3A31]",
          actionLabel: "View training",
        }
      : chatbot?.trainingStatus === "error"
        ? {
            title: "Training needs attention",
            description: "Something interrupted training. Review your sources and try again.",
            badgeLabel: "Error",
            badgeClassName: "bg-[#F7E6E1] text-[#A25743]",
            actionLabel: "Retry training",
          }
        : {
            title: "Not trained yet",
            description: "Add a website URL or upload documents to train your chatbot.",
            badgeLabel: "Pending",
            badgeClassName: "bg-[#F2F0EB] text-[#8C9A84]",
            actionLabel: "Start training",
          };

  return (
    <div className="py-8 md:py-12">
      <div className="max-w-5xl mx-auto px-4 md:px-8 space-y-8">
        {/* Welcome heading */}
        <div>
          <h1 className="font-serif text-3xl md:text-4xl font-semibold text-[#2D3A31] mb-1">
            Welcome back, {displayName}
          </h1>
          <p className="font-sans text-[#8C9A84] text-base">
            Here&apos;s a quick overview of your chatbot.
          </p>
        </div>

        {/* Training status card */}
        <Card hover={false} className="p-6 relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-br from-white to-transparent opacity-50" />
          <div className="flex items-start justify-between gap-4 relative z-10">
            <div>
              <p className="font-sans text-xs uppercase tracking-widest text-[#8C9A84] mb-1">
                Training Status
              </p>
              <p className="font-serif text-2xl font-bold text-[#2D3A31]">
                {trainingContent.title}
              </p>
              <p className="font-sans text-sm text-[#2D3A31]/70 mt-1 max-w-sm leading-relaxed">
                {trainingContent.description}
              </p>
            </div>
            <span
              className={`flex-shrink-0 shadow-sm inline-flex items-center px-3 py-1 rounded-full text-[11px] font-sans font-bold uppercase tracking-widest ${trainingContent.badgeClassName}`}
            >
              {trainingContent.badgeLabel}
            </span>
          </div>
          <div className="mt-6 pt-4 border-t border-[#E6E2DA]/50 relative z-10">
            <Link
              href="/dashboard/chatbot/setup"
              className="inline-flex items-center gap-2 font-sans text-sm font-semibold text-[#8C9A84] hover:text-[#2D3A31] transition-all duration-300 group/link"
            >
              {trainingContent.actionLabel}
              <ArrowRight size={16} strokeWidth={2} className="transform transition-transform group-hover/link:translate-x-1" />
            </Link>
          </div>
        </Card>

        {/* Quick links */}
        <div>
          <h2 className="font-sans text-sm uppercase tracking-widest text-[#8C9A84] mb-4">
            Quick Actions
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {quickLinks.map((item) => {
              const Icon = item.icon;
              return (
                <Link
                  key={item.key}
                  href={item.href}
                  className="group block transition-transform duration-500 hover:-translate-y-1 active:scale-95"
                >
                  <Card
                    hover={true}
                    className="p-6 h-full cursor-pointer group-hover:border-[#8C9A84]/40 group-hover:shadow-[0_15px_30px_-5px_rgba(45,58,49,0.1)] transition-all duration-500 bg-white"
                  >
                    <div className="flex flex-col h-full">
                      <div className="inline-flex items-center justify-center w-10 h-10 rounded-2xl bg-[#F2F0EB] mb-4 transition-colors duration-500 group-hover:bg-[#8C9A84]/10">
                        <Icon size={20} strokeWidth={1.5} className="text-[#8C9A84] transition-colors duration-500 group-hover:text-[#2D3A31]" />
                      </div>
                      <p className="font-serif text-lg font-bold text-[#2D3A31] mb-1">
                        {item.label}
                      </p>
                      <p className="font-sans text-sm text-[#2D3A31]/60 flex-1 leading-relaxed">
                        {item.description}
                      </p>
                      <div className="mt-4 flex items-center gap-1 text-xs font-sans font-bold uppercase tracking-widest text-[#8C9A84] transition-colors duration-500 group-hover:text-[#2D3A31]">
                        Go
                        <ArrowRight
                          size={14}
                          strokeWidth={2}
                          className="transition-transform duration-500 group-hover:translate-x-1"
                        />
                      </div>
                    </div>
                  </Card>
                </Link>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
