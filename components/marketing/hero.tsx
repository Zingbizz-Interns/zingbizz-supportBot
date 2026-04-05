"use client";

import { motion, useScroll, useTransform } from "framer-motion";
import { CinematicButton } from "@/components/ui/cinematic-button";
import { useRef } from "react";

export function Hero() {
  const targetRef = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({
    target: targetRef,
    offset: ["start start", "end start"],
  });

  const y1      = useTransform(scrollYProgress, [0, 1], [0, 100]);
  const opacity1 = useTransform(scrollYProgress, [0, 0.8], [1, 0]);

  return (
    <section
      ref={targetRef}
      className="relative flex min-h-[90vh] items-center justify-center overflow-hidden pt-24 pb-12 md:min-h-screen"
    >
      <div className="absolute top-0 left-0 w-full h-[50vh] bg-gradient-to-b from-stone/30 to-transparent pointer-events-none" />

      <div className="relative z-10 mx-auto flex w-full max-w-[95%] flex-col items-center px-4 text-center sm:px-6">
        <motion.div
          initial={{ opacity: 0, scale: 0.9, filter: "blur(10px)" }}
          animate={{ opacity: 1, scale: 1, filter: "blur(0px)" }}
          transition={{ duration: 1.2, ease: [0.16, 1, 0.3, 1] }}
          style={{ y: y1, opacity: opacity1 }}
          className="relative mx-auto flex max-w-7xl flex-col items-center"
        >
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3, duration: 0.8, ease: "easeOut" }}
            className="inline-flex items-center rounded-sm bg-foreground px-4 py-1.5 text-xs font-[family-name:var(--font-sans)] text-background uppercase tracking-[0.2em] mb-12"
          >
            AI-Powered Support
          </motion.div>

          <h1 className="mb-8 font-[family-name:var(--font-serif)] text-[15vw] font-medium leading-[0.88] tracking-tight text-foreground mix-blend-multiply md:text-[10vw] lg:text-[8rem]">
            <span className="block pr-8 italic text-sage md:pr-24">Instant</span>
            <span className="block text-center indent-8 md:indent-32">Answers.</span>
            <span className="block pr-2 text-right italic text-terracotta md:pr-16">Zero Config.</span>
          </h1>

          <div className="relative mt-12 w-full max-w-5xl border-t border-clay pt-8 text-left">
            <div className="pointer-events-none absolute -top-6 right-0 hidden font-[family-name:var(--font-serif)] text-[5rem] leading-none text-clay md:block">
              01
            </div>
            <div className="max-w-2xl">
              <p className="mb-5 font-[family-name:var(--font-serif)] text-2xl font-medium text-sage md:max-w-lg md:text-3xl">
                Conversational infrastructure for teams who want elegance, not setup debt.
              </p>
              <p className="font-[family-name:var(--font-sans)] text-lg font-light leading-relaxed text-foreground/80">
                ZingDesk absorbs your business context in minutes. We replace static FAQ pages with a living, intelligent system—built to embed anywhere with just a single line of code.
              </p>
            </div>

            <div className="mt-10 flex flex-col gap-6 sm:flex-row">
              <CinematicButton href="/signup" variant="primary">
                Start for free
              </CinematicButton>
              <CinematicButton href="#how-it-works" variant="secondary">
                See how it works
              </CinematicButton>
            </div>
          </div>
        </motion.div>
      </div>

      <motion.div
        initial={{ scaleY: 0 }}
        animate={{ scaleY: 1 }}
        transition={{ delay: 0.6, duration: 1.5, ease: [0.77, 0, 0.175, 1] }}
        className="absolute bottom-0 right-[15%] w-[1px] h-32 bg-foreground/20 hidden md:block origin-bottom"
      />
    </section>
  );
}
