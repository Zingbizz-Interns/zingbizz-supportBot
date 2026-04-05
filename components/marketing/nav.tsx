"use client";

import { useState } from "react";
import Link from "next/link";
import { Menu, X } from "lucide-react";
import { motion, AnimatePresence, useScroll, useTransform } from "framer-motion";

const navLinks = [
  { label: "Features",    href: "#features"     },
  { label: "How it Works",href: "#how-it-works" },
  { label: "Pricing",     href: "#pricing"      },
];

export function Nav({ isLoggedIn = false }: { isLoggedIn?: boolean }) {
  const [mobileOpen, setMobileOpen] = useState(false);
  const primaryHref = isLoggedIn ? "/dashboard" : "/signup";
  const primaryLabel = isLoggedIn ? "Open Dashboard" : "Get Started";
  const mobilePrimaryLabel = isLoggedIn ? "Open Dashboard" : "Get Started Free";

  const { scrollY } = useScroll();
  // Keep raw RGBA values here — framer-motion useTransform requires string interpolation
  const backgroundColor = useTransform(
    scrollY,
    [0, 50],
    ["rgba(249, 248, 244, 0)", "rgba(249, 248, 244, 0.9)"]
  );
  const backdropBlur = useTransform(scrollY, [0, 50], ["0px", "8px"]);
  const borderBottom = useTransform(
    scrollY,
    [0, 50],
    ["1px solid rgba(230, 226, 218, 0)", "1px solid rgba(230, 226, 218, 1)"]
  );

  return (
    <motion.header
      initial={{ y: -100, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
      style={{
        backgroundColor,
        backdropFilter: useTransform(backdropBlur, (blur) => `blur(${blur})`),
        borderBottom,
      }}
      className="fixed top-0 left-0 right-0 z-40"
    >
      <div className="max-w-7xl mx-auto px-4 md:px-8 h-16 flex items-center justify-between">
        {/* Logo */}
        <Link
          href="/"
          className="font-[family-name:var(--font-serif)] text-xl font-bold text-foreground tracking-tight hover:opacity-80 transition-opacity"
        >
          ZingDesk
        </Link>

        {/* Desktop nav */}
        <nav aria-label="Main Navigation" className="hidden md:flex items-center gap-8">
          {navLinks.map((link, i) => (
            <motion.a
              key={link.label}
              href={link.href}
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 * i + 0.3, duration: 0.4 }}
              className="relative inline-flex min-h-11 items-center text-sm font-[family-name:var(--font-sans)] text-foreground/70 hover:text-foreground transition-colors duration-300 group"
            >
              {link.label}
              <span className="absolute -bottom-1 left-1/2 h-[2px] w-0 -translate-x-1/2 bg-sage transition-all duration-300 group-hover:w-full rounded-full" />
            </motion.a>
          ))}
        </nav>

        {/* Desktop CTAs */}
        <div className="hidden md:flex items-center gap-3">
          {!isLoggedIn && (
            <Link
              href="/login"
              className="inline-flex min-h-11 items-center text-sm font-[family-name:var(--font-sans)] text-foreground/70 hover:text-foreground transition-all duration-300 px-4 py-2 hover:bg-sage-light/10 rounded-full"
            >
              Sign In
            </Link>
          )}
          <Link
            href={primaryHref}
            className="inline-flex min-h-11 items-center justify-center rounded-full bg-foreground text-background px-6 py-2.5 text-xs font-[family-name:var(--font-sans)] uppercase tracking-widest transition-all duration-300 hover:bg-primary-hover hover:-translate-y-0.5 active:scale-95"
          >
            {primaryLabel}
          </Link>
        </div>

        {/* Mobile hamburger */}
        <button
          onClick={() => setMobileOpen(true)}
          className="md:hidden p-2 text-foreground active:scale-95 transition-transform"
          aria-label="Open menu"
        >
          <Menu strokeWidth={1.5} size={24} />
        </button>
      </div>

      {/* Mobile overlay */}
      <AnimatePresence>
        {mobileOpen && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.3, ease: "easeInOut" }}
            className="fixed inset-0 z-50 bg-background flex flex-col p-8"
          >
            <div className="flex justify-between items-center mb-12">
              <span className="font-[family-name:var(--font-serif)] text-xl font-bold text-foreground">
                ZingDesk
              </span>
              <button
                onClick={() => setMobileOpen(false)}
                className="p-2 text-foreground active:scale-95 transition-transform"
                aria-label="Close menu"
              >
                <X strokeWidth={1.5} size={24} />
              </button>
            </div>
            <nav aria-label="Mobile Navigation" className="flex flex-col gap-6">
              {navLinks.map((link, i) => (
                <motion.a
                  key={link.label}
                  href={link.href}
                  onClick={() => setMobileOpen(false)}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.1 * i + 0.1 }}
                  className="font-[family-name:var(--font-serif)] text-3xl text-foreground hover:text-sage-light transition-colors duration-300 inline-block w-max"
                >
                  {link.label}
                </motion.a>
              ))}
            </nav>
            <div className="mt-auto flex flex-col gap-4">
              {!isLoggedIn && (
                <Link
                  href="/login"
                  onClick={() => setMobileOpen(false)}
                  className="inline-flex items-center justify-center rounded-full border border-sage-light text-sage-light px-8 py-3 text-sm font-[family-name:var(--font-sans)] uppercase tracking-widest transition-all duration-300 hover:bg-sage-light hover:text-background active:scale-95"
                >
                  Sign In
                </Link>
              )}
              <Link
                href={primaryHref}
                onClick={() => setMobileOpen(false)}
                className="inline-flex items-center justify-center rounded-full bg-foreground text-background px-8 py-3 text-sm font-[family-name:var(--font-sans)] uppercase tracking-widest transition-all duration-300 hover:bg-primary-hover hover:shadow-lg active:scale-95"
              >
                {mobilePrimaryLabel}
              </Link>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.header>
  );
}
