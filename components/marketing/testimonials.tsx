"use client";

import { motion, Variants } from "framer-motion";

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

const containerVariants: Variants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { staggerChildren: 0.15, delayChildren: 0.1 } },
};

const itemVariants: Variants = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.5 } },
};

export function Testimonials() {
  return (
    <section className="py-24 md:py-32 bg-[#F9F8F4]">
      <div className="max-w-7xl mx-auto px-4 md:px-8">
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-100px" }}
          transition={{ duration: 0.6 }}
          className="text-center mb-16"
        >
          <span className="inline-block font-sans text-xs uppercase tracking-widest text-[#8C9A84] bg-[#8C9A84]/10 px-4 py-1.5 rounded-full mb-4">
            What customers say
          </span>
          <h2 className="font-serif text-4xl md:text-5xl font-bold text-[#2D3A31]">
            Loved by small businesses
          </h2>
        </motion.div>

        <motion.div
          className="grid md:grid-cols-3 gap-8"
          variants={containerVariants}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: "-100px" }}
        >
          {testimonials.map((t) => (
            <motion.div
              key={t.name}
              variants={itemVariants}
              className="bg-white rounded-3xl p-8 shadow-sm flex flex-col gap-6"
            >
              <p className="font-sans text-[#2D3A31] leading-relaxed flex-1">
                &ldquo;{t.quote}&rdquo;
              </p>
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-[#8C9A84]/20 flex items-center justify-center flex-shrink-0">
                  <span className="font-sans text-xs font-semibold text-[#2D3A31]">{t.initials}</span>
                </div>
                <div>
                  <p className="font-sans text-sm font-semibold text-[#2D3A31]">{t.name}</p>
                  <p className="font-sans text-xs text-[#8C9A84]">{t.role}</p>
                </div>
              </div>
            </motion.div>
          ))}
        </motion.div>
      </div>
    </section>
  );
}
