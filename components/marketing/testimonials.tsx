"use client";

import { motion } from "framer-motion";

const testimonials = [
  {
    quote: "Our support load dropped by 40% in the first week. Customers get answers instantly instead of waiting for email.",
    name: "Sarah M.",
    role: "Owner, Bloom Boutique",
    initials: "SM",
  },
  {
    quote: "Setup took less than 10 minutes. I pointed it at our FAQ page and it was answering questions perfectly.",
    name: "James K.",
    role: "Founder, KrispTech",
    initials: "JK",
  },
  {
    quote: "The embed code just works. Two lines and our chatbot was live. No developer needed.",
    name: "Priya L.",
    role: "Marketing Lead, Florish Studio",
    initials: "PL",
  },
];

export function Testimonials() {
  return (
    <section className="py-24 md:py-32 bg-[#F9F8F4] text-[#2D3A31]">
      <div className="max-w-[1400px] mx-auto px-4 md:px-8">
        <h2 className="font-[family-name:var(--font-serif)] text-3xl md:text-5xl font-bold mb-16 md:mb-24">
          The verdict.
        </h2>

        <div className="flex flex-col border-t border-[#DCCFC2]">
          {testimonials.map((t, index) => (
            <motion.div
              key={t.name}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6, delay: index * 0.1 }}
              className="py-12 md:py-24 border-b border-[#DCCFC2] flex flex-col lg:flex-row justify-between items-start gap-8 lg:gap-24"
            >
              <div className="max-w-4xl relative">
                <span className="absolute -left-6 md:-left-12 -top-4 md:-top-8 text-[#E6E2DA] font-serif text-6xl md:text-9xl pointer-events-none select-none">
                  &ldquo;
                </span>
                <p className="font-[family-name:var(--font-serif)] text-3xl md:text-5xl leading-tight font-medium text-[#2D3A31] relative z-10 text-balance">
                  {t.quote}
                </p>
              </div>

              <div className="flex items-center gap-4 flex-shrink-0 pt-4 lg:pt-0">
                <div className="w-16 h-16 rounded-full border border-[#2D3A31] flex items-center justify-center flex-shrink-0">
                  <span className="font-[family-name:var(--font-sans)] text-xl font-bold">{t.initials}</span>
                </div>
                <div>
                  <p className="font-[family-name:var(--font-sans)] text-xl font-bold text-[#2D3A31] uppercase tracking-wide">{t.name}</p>
                  <p className="font-[family-name:var(--font-sans)] text-sm text-[#6A7A62]">{t.role}</p>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
