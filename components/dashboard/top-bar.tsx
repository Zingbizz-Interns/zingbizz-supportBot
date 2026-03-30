"use client";

import { signOut } from "next-auth/react";
import { LogOut } from "lucide-react";

export function TopBar() {
  return (
    <header className="lg:hidden flex items-center justify-between px-4 py-4 bg-white border-b border-[#E6E2DA]">
      <span className="font-serif text-xl font-semibold text-[#2D3A31]">
        ZingBizz
      </span>
      <button
        onClick={() => signOut({ callbackUrl: "/login" })}
        className="p-2 rounded-xl text-[#8C9A84] hover:bg-[#F2F0EB] hover:text-[#2D3A31] transition-colors duration-200"
        aria-label="Sign out"
      >
        <LogOut size={18} strokeWidth={1.5} />
      </button>
    </header>
  );
}
