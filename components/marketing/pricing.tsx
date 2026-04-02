"use client";

import { motion } from "framer-motion";
import { CheckCircle2 } from "lucide-react";
import Link from "next/link";

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
    <section id="pricing" className="py-24 md:py-32 bg-[#2D3A31]">
      <div className="max-w-7xl mx-auto px-4 md:px-8 text-center">
        <motion.div
          initial={{ opacity: 0, scale: 0.97 }}
          whileInView={{ opacity: 1, scale: 1 }}
          viewport={{ once: true, margin: "-100px" }}
          transition={{ duration: 0.7 }}
        >
          <span className="inline-block font-sans text-xs uppercase tracking-widest text-[#8C9A84] bg-[#8C9A84]/20 px-4 py-1.5 rounded-full mb-6">
            Pricing
          </span>
          <h2 className="font-serif text-4xl md:text-5xl font-bold text-white mb-4">
            Free during beta
          </h2>
          <p className="font-sans text-white/60 text-lg max-w-md mx-auto mb-12">
            Full access while we&apos;re in beta. Pricing will be introduced with advanced features in v2.
          </p>

          <div className="max-w-sm mx-auto bg-white/5 border border-white/10 rounded-3xl p-8 text-left space-y-6">
            <div>
              <p className="font-sans text-xs uppercase tracking-widest text-[#8C9A84] mb-2">Beta Plan</p>
              <div className="flex items-end gap-2">
                <span className="font-serif text-5xl font-bold text-white">$0</span>
                <span className="font-sans text-white/40 text-sm mb-2">/ month</span>
              </div>
            </div>

            <ul className="space-y-3">
              {features.map((f) => (
                <li key={f} className="flex items-start gap-3">
                  <CheckCircle2 size={16} strokeWidth={1.5} className="text-[#8C9A84] flex-shrink-0 mt-0.5" />
                  <span className="font-sans text-sm text-white/80">{f}</span>
                </li>
              ))}
            </ul>

            <Link
              href="/signup"
              className="block w-full text-center rounded-full bg-white text-[#2D3A31] font-sans text-sm uppercase tracking-widest px-8 py-3 hover:bg-[#F2F0EB] transition-colors duration-300"
            >
              Get started free
            </Link>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
