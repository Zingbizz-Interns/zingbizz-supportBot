"use client";

import Link from "next/link";
import { motion } from "framer-motion";

export function Footer() {
  return (
    <motion.footer
      initial={{ opacity: 0, y: 30 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-50px" }}
      transition={{ duration: 0.8, ease: "easeOut" }}
      className="border-t border-[#E6E2DA] py-12"
    >
      <div className="max-w-7xl mx-auto px-4 md:px-8 flex flex-col md:flex-row justify-between items-center gap-6">
        <Link
          href="/"
          className="font-[family-name:var(--font-serif)] text-lg font-bold text-[#2D3A31] hover:opacity-80 transition-opacity"
        >
          ChatBot <em>SaaS</em>
        </Link>
        <p className="font-[family-name:var(--font-sans)] text-sm text-[#2D3A31]/50">
          &copy; {new Date().getFullYear()} ChatBot SaaS. All rights reserved.
        </p>
        <div className="flex gap-6">
          <Link
            href="/login"
            className="font-[family-name:var(--font-sans)] text-sm text-[#2D3A31]/60 hover:text-[#2D3A31] transition-all hover:-translate-y-0.5"
          >
            Sign In
          </Link>
          <Link
            href="/signup"
            className="font-[family-name:var(--font-sans)] text-sm text-[#2D3A31]/60 hover:text-[#2D3A31] transition-all hover:-translate-y-0.5"
          >
            Sign Up
          </Link>
        </div>
      </div>
    </motion.footer>
  );
}
