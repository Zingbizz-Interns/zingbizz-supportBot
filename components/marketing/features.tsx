import { Card } from "@/components/ui/card";
import { Zap, Globe, Code } from "lucide-react";

const features = [
  {
    icon: Globe,
    title: "Train on Your Website",
    description:
      "Paste your URL and we scrape your pages automatically. Your chatbot learns everything about your business in seconds.",
  },
  {
    icon: Zap,
    title: "Instant AI Answers",
    description:
      "Powered by advanced RAG technology — your chatbot retrieves the most relevant knowledge before answering every question.",
  },
  {
    icon: Code,
    title: "One-Line Embed",
    description:
      "Copy a single script tag. Paste it anywhere. Your chatbot appears as a floating widget on any website.",
  },
];

export function Features() {
  return (
    <section id="features" className="py-24 md:py-32">
      <div className="max-w-7xl mx-auto px-4 md:px-8">
        <div className="text-center mb-16 md:mb-20">
          <p className="font-[family-name:var(--font-sans)] text-sm text-[#8C9A84] uppercase tracking-widest mb-4">
            Features
          </p>
          <h2 className="font-[family-name:var(--font-serif)] text-4xl md:text-5xl font-bold text-[#2D3A31]">
            Everything you need to
            <br />
            <em>automate support</em>
          </h2>
        </div>

        <div className="grid md:grid-cols-3 gap-8">
          {features.map((feature, i) => {
            const Icon = feature.icon;
            return (
              <div
                key={feature.title}
                className={`transition-transform ${i % 2 === 1 ? "md:translate-y-12" : ""}`}
              >
                <Card className="h-full">
                  <div className="w-12 h-12 rounded-full bg-[#F2F0EB] flex items-center justify-center mb-6">
                    <Icon size={20} strokeWidth={1.5} className="text-[#8C9A84]" />
                  </div>
                  <h3 className="font-[family-name:var(--font-serif)] text-xl font-semibold text-[#2D3A31] mb-3">
                    {feature.title}
                  </h3>
                  <p className="font-[family-name:var(--font-sans)] text-[#2D3A31]/70 leading-relaxed">
                    {feature.description}
                  </p>
                </Card>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
