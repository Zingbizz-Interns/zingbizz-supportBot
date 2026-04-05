"use client";

import { motion } from "framer-motion";
import { CinematicButton } from "@/components/ui/cinematic-button";

const features = [
  "1 AI chatbot for your website",
  "Up to 10 pages scraped per training",
  "PDF & document uploads",
  "Embeddable on any website",
  "Insights & analytics dashboard",
  "Unlimited chat messages",
  "Free during beta — no credit card required",
];

export function Pricing() {
  return (
    <section id="pricing" className="py-24 md:py-48 bg-[#9E5946] text-[#F9F8F4] overflow-hidden">
      <div className="max-w-[1400px] mx-auto px-4 md:px-8">
        
        <div className="flex flex-col md:flex-row justify-between items-start md:items-end mb-16 gap-8">
          <div>
            <h2 className="font-[family-name:var(--font-serif)] text-5xl md:text-[8rem] font-bold leading-none tracking-tighter mb-4">
              Beta Plan
            </h2>
            <p className="font-[family-name:var(--font-sans)] text-[#F9F8F4]/80 text-xl max-w-md">
              Full access while we&apos;re in beta. Pricing will be introduced with advanced features in v2.
            </p>
          </div>
          <div className="font-[family-name:var(--font-sans)] text-[10rem] md:text-[16rem] leading-none font-black tracking-tighter text-[#F9F8F4]">
            $0
          </div>
        </div>

        <div className="w-full h-px bg-[#F9F8F4]/20 mb-16" />

        <div className="flex flex-col lg:flex-row gap-16 justify-between items-start">
          <ul className="grid grid-cols-1 md:grid-cols-2 gap-x-12 gap-y-6 w-full lg:w-2/3">
            {features.map((f, i) => (
              <motion.li 
                key={f}
                initial={{ opacity: 0, y: 10 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: i * 0.05 }}
                className="flex items-center gap-4 font-[family-name:var(--font-sans)] text-xl"
              >
                <div className="w-2 h-2 bg-[#F9F8F4] rounded-full flex-shrink-0" />
                {f}
              </motion.li>
            ))}
          </ul>
          
          <div className="w-full lg:w-1/3 flex justify-end">
            <CinematicButton 
              href="/signup"
              variant="outline"
              className="w-full md:w-auto text-xl md:text-2xl px-12 py-12 rounded-full border border-[#F9F8F4] text-[#F9F8F4] hover:bg-[#F9F8F4] hover:text-[#9E5946]"
            >
              Start for free
            </CinematicButton>
          </div>
        </div>

      </div>
    </section>
  );
}
