"use client";

import { useRef } from "react";
import { motion, useScroll, useTransform } from "framer-motion";

interface Step {
  number: string;
  title: string;
  description: string;
}

const steps: Step[] = [
  {
    number: "01",
    title: "Connect Your Data",
    description: "Enter your website URL or upload documents. We extract and process your content automatically."
  },
  {
    number: "02",
    title: "Train in Seconds",
    description: "Click Train. Your chatbot becomes an expert on your business instantly — no waiting, no coding."
  },
  {
    number: "03",
    title: "Embed Anywhere",
    description: "Copy one script tag. Paste it into your website's HTML. Your AI chatbot is live."
  }
];

export function HowItWorks() {
  const containerRef = useRef<HTMLDivElement>(null);

  return (
    <section
      id="how-it-works"
      ref={containerRef}
      className="relative scroll-mt-24 py-24 md:scroll-mt-32 md:py-48 bg-stone text-foreground border-y border-clay"
    >
      <div className="max-w-[1400px] mx-auto px-4 md:px-8">
        <div className="flex flex-col lg:flex-row gap-16 lg:gap-32 items-start">

          <div className="lg:sticky lg:top-32 lg:w-1/3 z-10 w-full mb-12 lg:mb-0">
            <h2 className="font-[family-name:var(--font-serif)] text-5xl md:text-7xl font-bold leading-none mb-6">
              Three steps.<br />
              <em className="font-light italic text-terracotta">Zero code.</em>
            </h2>
            <p className="font-[family-name:var(--font-sans)] text-sage text-xl max-w-sm">
              We abstracted away the complex machine learning infrastructure. You just paste a link.
            </p>
          </div>

          <div className="w-full lg:w-2/3 flex flex-col gap-24 md:gap-40">
            {steps.map((step) => (
              <StepItem key={step.number} step={step} />
            ))}
          </div>

        </div>
      </div>
    </section>
  );
}

function StepItem({ step }: { step: Step }) {
  const itemRef = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({
    target: itemRef,
    offset: ["start 80%", "start 20%"]
  });

  const y       = useTransform(scrollYProgress, [0, 1], [100, 0]);
  const opacity = useTransform(scrollYProgress, [0, 1], [0.1, 1]);

  return (
    <motion.div
      ref={itemRef}
      style={{ y, opacity }}
      className="relative flex flex-col md:flex-row gap-8 md:gap-16 items-start"
    >
      <div className="font-[family-name:var(--font-sans)] text-6xl md:text-8xl font-black text-clay tracking-tighter self-start pt-2">
        {step.number}
      </div>
      <div className="flex flex-col">
        <h3 className="font-[family-name:var(--font-serif)] text-3xl md:text-4xl font-semibold mb-4">
          {step.title}
        </h3>
        <p className="font-[family-name:var(--font-sans)] text-sage text-xl md:text-2xl leading-relaxed max-w-xl">
          {step.description}
        </p>
      </div>
    </motion.div>
  );
}
