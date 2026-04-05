"use client";

import { signOut } from "next-auth/react";
import { LogOut } from "lucide-react";

export function TopBar() {
  return (
    <header className="lg:hidden flex items-center justify-between px-4 py-4 bg-surface border-b border-border">
      <span className="font-[family-name:var(--font-serif)] text-xl font-semibold text-foreground">
        ZingDesk
      </span>
      <button
        onClick={() => signOut({ callbackUrl: "/login" })}
        className="p-2 rounded-xl text-sage-light hover:bg-muted hover:text-foreground transition-colors duration-200"
        aria-label="Sign out"
      >
        <LogOut size={18} strokeWidth={1.5} />
      </button>
    </header>
  );
}
