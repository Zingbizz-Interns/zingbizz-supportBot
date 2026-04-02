"use client";

import { Card } from "@/components/ui/card";
import { Zap, Globe, Code, MessageSquare } from "lucide-react";
import { motion, Variants } from "framer-motion";

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
  {
    icon: MessageSquare,
    title: "Instant Answers",
    description:
      "Visitors get accurate answers in seconds — no waiting, no scrolling through docs.",
  },
];

const containerVariants: Variants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.15,
    },
  },
};

const itemVariants: Variants = {
  hidden: { opacity: 0, scale: 0.95, y: 30 },
  visible: {
    opacity: 1,
    scale: 1,
    y: 0,
    transition: { duration: 0.5, ease: "easeOut" },
  },
};

export function Features() {
  return (
    <section id="features" className="py-24 md:py-32 overflow-hidden">
      <div className="max-w-7xl mx-auto px-4 md:px-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-100px" }}
          transition={{ duration: 0.6 }}
          className="text-center mb-16 md:mb-20"
        >
          <p className="font-[family-name:var(--font-sans)] text-sm text-[#8C9A84] uppercase tracking-widest mb-4">
            Features
          </p>
          <h2 className="font-[family-name:var(--font-serif)] text-4xl md:text-5xl font-bold text-[#2D3A31]">
            Everything you need to
            <br />
            <em>automate support</em>
          </h2>
        </motion.div>

        <motion.div
          variants={containerVariants}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: "-100px" }}
          className="grid md:grid-cols-2 lg:grid-cols-4 gap-8"
        >
          {features.map((feature, i) => {
            const Icon = feature.icon;
            return (
              <motion.div
                variants={itemVariants}
                key={feature.title}
                className="flex transition-transform duration-300"
              >
                <div className="group w-full block hover:-translate-y-2 hover:shadow-xl transition-all duration-300 active:scale-95 cursor-default">
                  <Card className="h-full border border-black/[0.08] transition-colors duration-300 group-hover:border-[#8C9A84]/30">
                    <div className="w-12 h-12 rounded-full bg-[#F2F0EB] flex items-center justify-center mb-6 transition-colors duration-300 group-hover:bg-[#8C9A84]/20 group-hover:scale-110">
                      <Icon size={20} strokeWidth={1.5} className="text-[#8C9A84] transition-colors duration-300 group-hover:text-[#2D3A31]" />
                    </div>
                    <h3 className="font-[family-name:var(--font-serif)] text-xl font-semibold text-[#2D3A31] mb-3 transition-colors duration-300">
                      {feature.title}
                    </h3>
                    <p className="font-[family-name:var(--font-sans)] text-[#2D3A31]/70 leading-relaxed transition-colors duration-300 group-hover:text-[#2D3A31]/90">
                      {feature.description}
                    </p>
                  </Card>
                </div>
              </motion.div>
            );
          })}
        </motion.div>
      </div>
    </section>
  );
}
