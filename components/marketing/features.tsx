"use client";

import { useRef } from "react";
import { motion, useScroll, useTransform } from "framer-motion";

interface Feature {
  number: string;
  title: string;
  description: string;
}

const features: Feature[] = [
  {
    number: "01",
    title: "Train on Your Website",
    description: "Paste your URL and we scrape your pages automatically. Your chatbot learns everything about your business in seconds."
  },
  {
    number: "02",
    title: "Instant AI Answers",
    description: "Powered by advanced RAG technology — your chatbot retrieves the most relevant knowledge before answering every question."
  },
  {
    number: "03",
    title: "One-Line Embed",
    description: "Copy a single script tag. Paste it anywhere. Your chatbot appears as a floating widget on any website."
  },
  {
    number: "04",
    title: "Always Available",
    description: "Visitors get accurate answers around the clock — no waiting, no scrolling through docs, no support tickets."
  }
];

export function Features() {
  const containerRef = useRef<HTMLDivElement>(null);

  return (
    <section id="features" className="py-24 bg-foreground text-background relative selection:bg-sage selection:text-background">
      <div className="max-w-7xl mx-auto px-4 md:px-8 mb-16 md:mb-32">
        <h2 className="font-[family-name:var(--font-serif)] text-5xl md:text-7xl font-medium text-balance mb-8">
          Not another <em className="text-sage-light italic">widget</em>.<br />
          An <span className="underline decoration-terracotta underline-offset-8">intelligent</span> agent.
        </h2>
      </div>

      <div ref={containerRef} className="relative max-w-7xl mx-auto px-4 md:px-8 flex flex-col gap-0">
        {features.map((feature) => (
          <FeatureCard key={feature.number} feature={feature} />
        ))}
      </div>

      <div className="h-24 md:h-48" />
    </section>
  );
}

function FeatureCard({ feature }: { feature: Feature }) {
  const cardRef = useRef<HTMLDivElement>(null);

  const { scrollYProgress } = useScroll({
    target: cardRef,
    offset: ["start end", "start 20%"]
  });

  const opacity = useTransform(scrollYProgress, [0, 1], [0.3, 1]);
  const scale   = useTransform(scrollYProgress, [0, 1], [0.95, 1]);

  return (
    <motion.div
      ref={cardRef}
      style={{ opacity, scale }}
      className="sticky top-20 md:top-24 w-full min-h-[40vh] md:min-h-[50vh] bg-background text-foreground border-x border-t border-clay overflow-hidden flex flex-col justify-between p-8 md:p-16"
      initial={{ y: 50, opacity: 0 }}
      whileInView={{ y: 0, opacity: 1 }}
      viewport={{ once: true, margin: "-100px" }}
      transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
    >
      <div className="flex flex-col md:flex-row justify-between items-start gap-12 w-full h-full">
        <div className="font-[family-name:var(--font-sans)] font-bold text-[8rem] md:text-[14rem] leading-none text-stone tracking-tighter">
          {feature.number}
        </div>

        <div className="max-w-xl self-end md:-mt-8 relative z-10 flex flex-col">
          <h3 className="font-[family-name:var(--font-serif)] text-3xl md:text-5xl font-medium text-foreground mb-6">
            {feature.title}
          </h3>
          <p className="font-[family-name:var(--font-sans)] text-sage text-xl md:text-2xl leading-relaxed text-balance">
            {feature.description}
          </p>
        </div>
      </div>
    </motion.div>
  );
}
