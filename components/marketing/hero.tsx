"use client";

import Link from "next/link";
import { motion, Variants } from "framer-motion";

const containerVariants: Variants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.15,
      delayChildren: 0.2,
    },
  },
};

const itemVariants: Variants = {
  hidden: { opacity: 0, y: 20 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.6, ease: [0.22, 1, 0.36, 1] },
  },
};

export function Hero() {
  return (
    <section className="pt-32 pb-24 md:pt-40 md:pb-32 overflow-hidden">
      <div className="max-w-7xl mx-auto px-4 md:px-8">
        <div className="grid md:grid-cols-2 gap-16 items-center">
          {/* Text */}
          <motion.div
            variants={containerVariants}
            initial="hidden"
            animate="visible"
          >
            <motion.div
              variants={itemVariants}
              className="inline-flex items-center rounded-full bg-[#8C9A84]/15 px-4 py-1.5 text-xs font-[family-name:var(--font-sans)] text-[#8C9A84] uppercase tracking-widest mb-8"
            >
              AI-Powered Support
            </motion.div>
            <motion.h1
              variants={itemVariants}
              className="font-[family-name:var(--font-serif)] text-5xl md:text-7xl font-bold text-[#2D3A31] leading-[1.05] mb-6"
            >
              Your website,
              <br />
              now <em>answers</em>
              <br />
              questions.
            </motion.h1>
            <motion.p
              variants={itemVariants}
              className="font-[family-name:var(--font-sans)] text-lg text-[#2D3A31]/70 max-w-md mb-10 leading-relaxed"
            >
              Create an AI chatbot trained on your business in minutes. Paste a
              URL, let it learn, and embed it on your site with one line of
              code.
            </motion.p>
            <motion.div
              variants={itemVariants}
              className="flex flex-col sm:flex-row gap-4"
            >
              <Link
                href="/signup"
                className="inline-flex items-center justify-center rounded-full bg-[#2D3A31] text-white px-10 py-4 text-sm font-[family-name:var(--font-sans)] uppercase tracking-widest transition-all duration-300 hover:bg-[#3d5245] hover:-translate-y-1 hover:shadow-[0_15px_30px_-5px_rgba(45,58,49,0.25)] active:scale-95 active:translate-y-0"
              >
                Start for free
              </Link>
              <a
                href="#how-it-works"
                className="inline-flex items-center justify-center rounded-full border border-[#8C9A84] text-[#8C9A84] px-10 py-4 text-sm font-[family-name:var(--font-sans)] uppercase tracking-widest transition-all duration-300 hover:bg-[#8C9A84] hover:text-white hover:-translate-y-1 hover:shadow-[0_15px_30px_-5px_rgba(140,154,132,0.3)] active:scale-95 active:translate-y-0"
              >
                See how it works
              </a>
            </motion.div>
          </motion.div>

          {/* Decorative arch image */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95, x: 20 }}
            animate={{ opacity: 1, scale: 1, x: 0 }}
            transition={{ duration: 0.8, delay: 0.4, ease: [0.22, 1, 0.36, 1] }}
            className="relative flex justify-center md:justify-end"
          >
            <div
              className="w-72 h-96 md:w-80 md:h-[480px] bg-[#DCCFC2] flex items-center justify-center relative overflow-hidden group"
              style={{ borderRadius: "9999px 9999px 40px 40px" }}
            >
              {/* Subtle background animation inside the arch */}
              <div className="absolute inset-0 bg-gradient-to-t from-[#8C9A84]/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-700"></div>

              <div className="text-center px-8 relative z-10 transition-transform duration-500 group-hover:-translate-y-2">
                <div className="w-16 h-16 rounded-full bg-[#8C9A84]/30 flex items-center justify-center mx-auto mb-6 transform transition-transform duration-500 group-hover:scale-110">
                  <svg
                    width="28"
                    height="28"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="#8C9A84"
                    strokeWidth="1.5"
                  >
                    <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
                  </svg>
                </div>
                <p className="font-[family-name:var(--font-serif)] text-xl italic text-[#2D3A31] leading-snug">
                  &ldquo;How can I help you today?&rdquo;
                </p>
                <p className="font-[family-name:var(--font-sans)] text-xs text-[#2D3A31]/50 mt-3 uppercase tracking-wider">
                  Your AI Assistant
                </p>
              </div>
            </div>
            {/* Floating stat card */}
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 1, duration: 0.6, type: "spring", stiffness: 100 }}
              whileHover={{ y: -8, scale: 1.02, transition: { type: "spring", stiffness: 300, damping: 20 } }}
              className="absolute -bottom-4 -left-4 md:left-0 bg-white rounded-2xl p-4 shadow-[0_20px_40px_-10px_rgba(45,58,49,0.15)] border border-[#F2F0EB] cursor-default"
            >
              <p className="font-[family-name:var(--font-sans)] text-xs text-[#8C9A84] uppercase tracking-wide mb-1">
                Setup time
              </p>
              <p className="font-[family-name:var(--font-serif)] text-2xl font-bold text-[#2D3A31]">
                &lt; 5 min
              </p>
            </motion.div>
          </motion.div>
        </div>
      </div>
    </section>
  );
}
