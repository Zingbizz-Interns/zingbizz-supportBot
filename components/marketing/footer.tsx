import Link from "next/link";

export function Footer() {
  return (
    <footer className="border-t border-[#E6E2DA] py-12">
      <div className="max-w-7xl mx-auto px-4 md:px-8 flex flex-col md:flex-row justify-between items-center gap-6">
        <div className="font-[family-name:var(--font-serif)] text-lg font-bold text-[#2D3A31]">
          ChatBot <em>SaaS</em>
        </div>
        <p className="font-[family-name:var(--font-sans)] text-sm text-[#2D3A31]/50">
          &copy; {new Date().getFullYear()} ChatBot SaaS. All rights reserved.
        </p>
        <div className="flex gap-6">
          <Link
            href="/login"
            className="font-[family-name:var(--font-sans)] text-sm text-[#2D3A31]/60 hover:text-[#2D3A31] transition-colors"
          >
            Sign In
          </Link>
          <Link
            href="/signup"
            className="font-[family-name:var(--font-sans)] text-sm text-[#2D3A31]/60 hover:text-[#2D3A31] transition-colors"
          >
            Sign Up
          </Link>
        </div>
      </div>
    </footer>
  );
}
