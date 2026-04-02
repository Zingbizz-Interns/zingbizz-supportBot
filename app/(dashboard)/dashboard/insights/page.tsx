"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2, BarChart2, MessageSquare, CheckCircle, XCircle } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart";
import { Bar, BarChart, XAxis, YAxis, ResponsiveContainer } from "recharts";

interface QuestionInsight {
  question: string;
  count: number;
  answered: boolean;
}

interface RecentUnanswered {
  question: string;
  askedAt?: Date | string;
}

interface QueryStats {
  total: number;
  answered: number;
  unanswered: number;
}

interface DailyCount {
  date: string;
  count: number;
  answered: number;
}

interface InsightsData {
  topQuestions?: QuestionInsight[];
  unansweredQuestions?: RecentUnanswered[];
  stats?: QueryStats;
  dailyCounts?: DailyCount[];
}

function timeAgo(dateStr?: string): string {
  if (!dateStr) return "";
  try {
    const diff = Date.now() - new Date(dateStr).getTime();
    const mins = Math.floor(diff / 60000);
    if (mins < 1) return "just now";
    if (mins < 60) return `${mins}m ago`;
    const hrs = Math.floor(mins / 60);
    if (hrs < 24) return `${hrs}h ago`;
    const days = Math.floor(hrs / 24);
    return `${days}d ago`;
  } catch {
    return "";
  }
}

function formatShortDate(dateStr: string): string {
  try {
    return new Date(dateStr).toLocaleDateString("en-US", { month: "short", day: "numeric" });
  } catch {
    return dateStr;
  }
}

const chartConfig = {
  count: { label: "Questions", color: "#8C9A84" },
  answered: { label: "Answered", color: "#2D3A31" },
};

export default function InsightsPage() {
  const router = useRouter();
  const [insights, setInsights] = useState<InsightsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchData() {
      try {
        const chatbotRes = await fetch("/api/agents");
        if (!chatbotRes.ok) throw new Error("Failed to load chatbot");
        const chatbotData = await chatbotRes.json();
        const bot = chatbotData.chatbot;
        if (!bot) {
          router.replace("/dashboard/chatbot/setup");
          return;
        }

        const insightsRes = await fetch(`/api/agents/${bot.id}/insights`);
        if (!insightsRes.ok) throw new Error("Failed to load insights");
        const insightsData = await insightsRes.json();
        setInsights(insightsData);
      } catch (err: unknown) {
        setError(err instanceof Error ? err.message : "Something went wrong");
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, [router]);

  const topQuestions = insights?.topQuestions ?? [];
  const recentUnanswered = insights?.unansweredQuestions ?? [];
  const stats = insights?.stats ?? { total: 0, answered: 0, unanswered: 0 };
  const dailyCounts = (insights?.dailyCounts ?? []).map((d) => ({
    ...d,
    date: formatShortDate(d.date),
  }));
  const answerRate = stats.total > 0 ? Math.round((stats.answered / stats.total) * 100) : 0;
  const hasData = stats.total > 0;

  if (loading) {
    return (
      <div className="py-8 md:py-12">
        <div className="max-w-5xl mx-auto px-4 md:px-8 flex items-center justify-center py-24">
          <Loader2 size={28} strokeWidth={1.5} className="animate-spin text-[#8C9A84]" />
        </div>
      </div>
    );
  }

  return (
    <div className="py-8 md:py-12">
      <div className="max-w-5xl mx-auto px-4 md:px-8 space-y-8">
        <div>
          <h1 className="font-serif text-3xl font-semibold text-[#2D3A31] mb-1">
            Insights
          </h1>
          <p className="font-sans text-[#8C9A84] text-base">
            Understand what your visitors are asking.
          </p>
        </div>

        {error && <p className="text-[#C27B66] text-sm font-sans">{error}</p>}

        {!hasData ? (
          <Card hover={false} className="p-12 text-center">
            <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-[#F2F0EB] mb-4">
              <BarChart2 size={24} strokeWidth={1.5} className="text-[#8C9A84]" />
            </div>
            <p className="font-sans font-semibold text-[#2D3A31] mb-1">No insights yet</p>
            <p className="font-sans text-sm text-[#8C9A84]">Start chatting to see analytics.</p>
          </Card>
        ) : (
          <div className="space-y-8">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              {[
                {
                  label: "Total Questions",
                  value: stats.total,
                  icon: <MessageSquare size={18} strokeWidth={1.5} className="text-[#8C9A84]" />,
                },
                {
                  label: "Answer Rate",
                  value: `${answerRate}%`,
                  icon: <CheckCircle size={18} strokeWidth={1.5} className="text-[#8C9A84]" />,
                },
                {
                  label: "Unanswered",
                  value: stats.unanswered,
                  icon: <XCircle size={18} strokeWidth={1.5} className="text-[#8C9A84]" />,
                },
              ].map((stat) => (
                <Card key={stat.label} hover={false} className="p-6 flex items-start gap-4">
                  <div className="flex items-center justify-center w-10 h-10 rounded-xl bg-[#F2F0EB] flex-shrink-0">
                    {stat.icon}
                  </div>
                  <div>
                    <p className="font-sans text-xs uppercase tracking-widest text-[#8C9A84] mb-1">
                      {stat.label}
                    </p>
                    <p className="font-sans text-2xl font-semibold text-[#2D3A31]">
                      {stat.value}
                    </p>
                  </div>
                </Card>
              ))}
            </div>

            {dailyCounts.length > 0 && (
              <section className="space-y-4">
                <h2 className="font-sans text-sm uppercase tracking-widest text-[#8C9A84]">
                  7-Day Question Trend
                </h2>
                <Card hover={false} className="p-6">
                  <ChartContainer config={chartConfig} className="h-48 w-full">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={dailyCounts} barGap={4}>
                        <XAxis
                          dataKey="date"
                          tickLine={false}
                          axisLine={false}
                          tick={{ fontSize: 11, fill: "#8C9A84", fontFamily: "var(--font-sans)" }}
                        />
                        <YAxis hide />
                        <ChartTooltip content={<ChartTooltipContent />} />
                        <Bar dataKey="count" fill="#8C9A84" radius={[4, 4, 0, 0]} name="Questions" />
                        <Bar dataKey="answered" fill="#2D3A31" radius={[4, 4, 0, 0]} name="Answered" />
                      </BarChart>
                    </ResponsiveContainer>
                  </ChartContainer>
                </Card>
              </section>
            )}

            {topQuestions.length > 0 && (
              <section className="space-y-4">
                <h2 className="font-sans text-sm uppercase tracking-widest text-[#8C9A84]">
                  Top Questions
                </h2>
                <Card hover={false} className="p-0 overflow-hidden">
                  <div className="hidden md:grid grid-cols-[1fr_80px_120px] gap-4 px-6 py-3 bg-[#F9F8F4] border-b border-[#E6E2DA]">
                    <span className="font-sans text-xs uppercase tracking-widest text-[#8C9A84]">Question</span>
                    <span className="font-sans text-xs uppercase tracking-widest text-[#8C9A84]">Count</span>
                    <span className="font-sans text-xs uppercase tracking-widest text-[#8C9A84]">Status</span>
                  </div>
                  <ul className="divide-y divide-[#E6E2DA]">
                    {topQuestions.map((q, i) => (
                      <li key={i} className="flex flex-col md:grid md:grid-cols-[1fr_80px_120px] gap-2 md:gap-4 items-start md:items-center px-6 py-4">
                        <p className="font-sans text-sm text-[#2D3A31] leading-relaxed">{q.question}</p>
                        <span className="font-sans text-sm font-semibold text-[#2D3A31]">{q.count}</span>
                        <div>
                          {q.answered ? (
                            <Badge variant="success">Answered</Badge>
                          ) : (
                            <Badge variant="warning">Unanswered</Badge>
                          )}
                        </div>
                      </li>
                    ))}
                  </ul>
                </Card>
              </section>
            )}

            {recentUnanswered.length > 0 && (
              <section className="space-y-4">
                <h2 className="font-sans text-sm uppercase tracking-widest text-[#8C9A84]">
                  Recent Unanswered Questions
                </h2>
                <Card hover={false} className="p-0 overflow-hidden">
                  <ul className="divide-y divide-[#E6E2DA]">
                    {recentUnanswered.map((q, i) => (
                      <li key={i} className="flex items-start justify-between gap-4 px-6 py-4">
                        <p className="font-sans text-sm text-[#2D3A31] leading-relaxed flex-1">{q.question}</p>
                        {q.askedAt && (
                          <span className="font-sans text-xs text-[#8C9A84] flex-shrink-0 mt-0.5">
                            {timeAgo(String(q.askedAt))}
                          </span>
                        )}
                      </li>
                    ))}
                  </ul>
                </Card>
              </section>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
