"use client";

import { useState } from "react";
import Link from "next/link";
import { Menu, X } from "lucide-react";

const navLinks = [
  { label: "Features", href: "#features" },
  { label: "How it Works", href: "#how-it-works" },
  { label: "Pricing", href: "#pricing" },
];

export function Nav() {
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <header className="fixed top-0 left-0 right-0 z-40 bg-[#F9F8F4]/90 backdrop-blur-sm border-b border-[#E6E2DA]">
      <div className="max-w-7xl mx-auto px-4 md:px-8 h-16 flex items-center justify-between">
        {/* Logo */}
        <Link
          href="/"
          className="font-[family-name:var(--font-serif)] text-xl font-bold text-[#2D3A31] tracking-tight"
        >
          ChatBot <em>SaaS</em>
        </Link>

        {/* Desktop nav */}
        <nav className="hidden md:flex items-center gap-8">
          {navLinks.map((link) => (
            <a
              key={link.label}
              href={link.href}
              className="text-sm font-[family-name:var(--font-sans)] text-[#2D3A31]/70 hover:text-[#2D3A31] transition-colors duration-300"
            >
              {link.label}
            </a>
          ))}
        </nav>

        {/* Desktop CTAs */}
        <div className="hidden md:flex items-center gap-3">
          <Link
            href="/login"
            className="text-sm font-[family-name:var(--font-sans)] text-[#2D3A31]/70 hover:text-[#2D3A31] transition-colors duration-300 px-4 py-2"
          >
            Sign In
          </Link>
          <Link
            href="/signup"
            className="inline-flex items-center justify-center rounded-full bg-[#2D3A31] text-white px-6 py-2.5 text-xs font-[family-name:var(--font-sans)] uppercase tracking-widest transition-colors duration-300 hover:bg-[#3d5245]"
          >
            Get Started
          </Link>
        </div>

        {/* Mobile hamburger */}
        <button
          onClick={() => setMobileOpen(true)}
          className="md:hidden p-2 text-[#2D3A31]"
          aria-label="Open menu"
        >
          <Menu strokeWidth={1.5} size={24} />
        </button>
      </div>

      {/* Mobile overlay */}
      {mobileOpen && (
        <div className="fixed inset-0 z-50 bg-[#F9F8F4] flex flex-col p-8">
          <div className="flex justify-between items-center mb-12">
            <span className="font-[family-name:var(--font-serif)] text-xl font-bold text-[#2D3A31]">
              ChatBot <em>SaaS</em>
            </span>
            <button
              onClick={() => setMobileOpen(false)}
              className="p-2 text-[#2D3A31]"
              aria-label="Close menu"
            >
              <X strokeWidth={1.5} size={24} />
            </button>
          </div>
          <nav className="flex flex-col gap-6">
            {navLinks.map((link) => (
              <a
                key={link.label}
                href={link.href}
                onClick={() => setMobileOpen(false)}
                className="font-[family-name:var(--font-serif)] text-3xl text-[#2D3A31] hover:text-[#8C9A84] transition-colors duration-300"
              >
                {link.label}
              </a>
            ))}
          </nav>
          <div className="mt-auto flex flex-col gap-3">
            <Link
              href="/login"
              onClick={() => setMobileOpen(false)}
              className="inline-flex items-center justify-center rounded-full border border-[#8C9A84] text-[#8C9A84] px-8 py-3 text-sm font-[family-name:var(--font-sans)] uppercase tracking-widest transition-colors duration-300 hover:bg-[#8C9A84] hover:text-white"
            >
              Sign In
            </Link>
            <Link
              href="/signup"
              onClick={() => setMobileOpen(false)}
              className="inline-flex items-center justify-center rounded-full bg-[#2D3A31] text-white px-8 py-3 text-sm font-[family-name:var(--font-sans)] uppercase tracking-widest transition-colors duration-300 hover:bg-[#3d5245]"
            >
              Get Started Free
            </Link>
          </div>
        </div>
      )}
    </header>
  );
}
