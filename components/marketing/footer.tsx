"use client";

import Link from "next/link";

export function Footer() {
  return (
    <footer className="border-t border-clay py-12 md:py-24 bg-stone text-foreground overflow-hidden">
      <div className="max-w-[1400px] mx-auto px-4 md:px-8 flex flex-col items-start gap-16 md:gap-32">
        <div className="w-full">
          <Link
            href="/"
            className="font-[family-name:var(--font-serif)] text-[15vw] leading-none font-bold tracking-tighter hover:text-terracotta transition-colors block"
          >
            ZingDesk
          </Link>
        </div>

        <div className="w-full flex flex-col md:flex-row justify-between items-start md:items-end gap-12 border-t border-foreground pt-8">
          <p className="font-[family-name:var(--font-sans)] text-sm md:text-base text-sage max-w-sm">
            Not another widget. An intelligent agent. <br className="hidden md:block" />
            &copy; {new Date().getFullYear()} ZingDesk. All rights reserved.
          </p>
          <nav aria-label="Footer Navigation" className="flex flex-wrap gap-8">
            <Link
              href="/login"
              className="font-[family-name:var(--font-sans)] text-sm md:text-base font-bold uppercase tracking-widest text-foreground hover:text-terracotta transition-colors"
            >
              Sign In
            </Link>
            <Link
              href="/signup"
              className="font-[family-name:var(--font-sans)] text-sm md:text-base font-bold uppercase tracking-widest text-foreground hover:text-terracotta transition-colors"
            >
              Sign Up
            </Link>
          </nav>
        </div>
      </div>
    </footer>
  );
}
