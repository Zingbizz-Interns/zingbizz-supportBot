"use client";

import { motion, Variants } from "framer-motion";

const steps = [
  {
    number: "01",
    title: "Connect Your Data",
    description:
      "Enter your website URL or upload documents. We extract and process your content automatically.",
  },
  {
    number: "02",
    title: "Train in Seconds",
    description:
      "Click Train. Your chatbot becomes an expert on your business instantly — no waiting, no coding.",
  },
  {
    number: "03",
    title: "Embed Anywhere",
    description:
      "Copy one script tag. Paste it into your website's HTML. Your AI chatbot is live.",
  },
];

const containerVariants: Variants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.2,
    },
  },
};

const itemVariants: Variants = {
  hidden: { opacity: 0, y: 30 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.6, ease: [0.22, 1, 0.36, 1] },
  },
};

export function HowItWorks() {
  return (
    <section id="how-it-works" className="py-24 md:py-32 bg-[#2D3A31] overflow-hidden">
      <div className="max-w-7xl mx-auto px-4 md:px-8">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          whileInView={{ opacity: 1, scale: 1 }}
          viewport={{ once: true, margin: "-100px" }}
          transition={{ duration: 0.7, ease: "easeOut" }}
          className="text-center mb-16"
        >
          <h2 className="font-[family-name:var(--font-serif)] text-4xl md:text-5xl font-bold text-white mb-4">
            Up and running in
            <br />
            <em>three steps</em>
          </h2>
        </motion.div>
        
        <motion.div
          variants={containerVariants}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: "-100px" }}
          className="grid md:grid-cols-3 gap-8 md:gap-16"
        >
          {steps.map((step) => (
            <motion.div
              variants={itemVariants}
              key={step.number}
              className="text-center group cursor-default transition-transform duration-300 hover:-translate-y-2"
            >
              <div className="font-[family-name:var(--font-serif)] text-6xl font-bold text-[#8C9A84]/40 mb-6 transition-colors duration-300 group-hover:text-[#8C9A84]">
                {step.number}
              </div>
              <h3 className="font-[family-name:var(--font-serif)] text-xl font-semibold text-white mb-3">
                {step.title}
              </h3>
              <p className="font-[family-name:var(--font-sans)] text-white/60 leading-relaxed transition-colors duration-300 group-hover:text-white/80">
                {step.description}
              </p>
            </motion.div>
          ))}
        </motion.div>
      </div>
    </section>
  );
}
