"use client";

import Link from "next/link";

export function Footer() {
  return (
    <footer className="border-t border-[#DCCFC2] py-12 md:py-24 bg-[#E6E2DA] text-[#2D3A31] overflow-hidden">
      <div className="max-w-[1400px] mx-auto px-4 md:px-8 flex flex-col items-start gap-16 md:gap-32">
        <div className="w-full">
          <Link
            href="/"
            className="font-[family-name:var(--font-serif)] text-[15vw] leading-none font-bold tracking-tighter hover:text-[#9E5946] transition-colors block"
          >
            ZingDesk
          </Link>
        </div>
        
        <div className="w-full flex flex-col md:flex-row justify-between items-start md:items-end gap-12 border-t border-[#2D3A31] pt-8">
          <p className="font-[family-name:var(--font-sans)] text-sm md:text-base text-[#6A7A62] max-w-sm">
            Not another widget. An intelligent agent. <br className="hidden md:block" />
            &copy; {new Date().getFullYear()} ZingDesk. All rights reserved.
          </p>
          <nav aria-label="Footer Navigation" className="flex flex-wrap gap-8">
            <Link
              href="/login"
              className="font-[family-name:var(--font-sans)] text-sm md:text-base font-bold uppercase tracking-widest text-[#2D3A31] hover:text-[#9E5946] transition-colors"
            >
              Sign In
            </Link>
            <Link
              href="/signup"
              className="font-[family-name:var(--font-sans)] text-sm md:text-base font-bold uppercase tracking-widest text-[#2D3A31] hover:text-[#9E5946] transition-colors"
            >
              Sign Up
            </Link>
          </nav>
        </div>
      </div>
    </footer>
  );
}
