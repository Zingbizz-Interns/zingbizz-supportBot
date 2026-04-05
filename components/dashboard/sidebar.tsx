"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  Settings,
  Palette,
  Database,
  Code,
  BarChart2,
  LogOut,
} from "lucide-react";
import { signOut } from "next-auth/react";

interface NavItem {
  label: string;
  href: string;
  icon: React.ComponentType<{ size?: number; strokeWidth?: number; className?: string }>;
}

export function Sidebar({ canCustomize }: { canCustomize: boolean }) {
  const pathname = usePathname();
  const navItems: NavItem[] = [
    { label: "Home", href: "/dashboard", icon: LayoutDashboard },
    { label: "Setup", href: "/dashboard/chatbot/setup", icon: Settings },
    { label: "Customize", href: "/dashboard/chatbot/customize", icon: Palette },
    { label: "Sources", href: "/dashboard/chatbot/sources", icon: Database },
    { label: "Embed", href: "/dashboard/chatbot/embed", icon: Code },
    { label: "Insights", href: "/dashboard/insights", icon: BarChart2 },
  ];

  function isActive(href: string): boolean {
    if (href === "/dashboard") {
      return pathname === "/dashboard";
    }
    return pathname.startsWith(href);
  }

  return (
    <aside className="hidden lg:flex fixed left-0 top-0 h-full w-[280px] flex-col bg-[#F9F8F4] border-r border-[#DCCFC2] z-40">
      {/* Brand */}
      <div className="px-8 py-8 border-b border-[#DCCFC2] bg-[#E6E2DA]">
        <span className="font-[family-name:var(--font-serif)] tracking-tighter text-3xl font-black text-[#2D3A31]">
          ZingDesk
        </span>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-4 py-8 space-y-2 overflow-y-auto relative">
        {navItems.map((item) => {
          const Icon = item.icon;
          const active = isActive(item.href);
          
          return (
            <Link
              key={item.label}
              href={item.href}
              title={item.label === "Customize" && !canCustomize ? "Complete setup to unlock customization" : undefined}
              aria-disabled={item.label === "Customize" && !canCustomize}
              className={`relative flex min-h-11 items-center gap-4 px-4 py-3 text-sm font-[family-name:var(--font-sans)] uppercase tracking-widest transition-colors duration-200 z-10 w-full group ${
                active ? "text-[#F9F8F4] font-bold bg-[#2D3A31]" : "text-[#2D3A31] hover:text-[#9E5946]"
              }`}
            >
              <Icon size={18} strokeWidth={2} className="relative z-10" />
              <span className="relative z-10">{item.label}</span>
            </Link>
          );
        })}
      </nav>

      {/* Sign out */}
      <div className="px-4 py-6 border-t border-[#DCCFC2] bg-[#E6E2DA]">
        <button
          onClick={() => signOut({ callbackUrl: "/login" })}
          className="flex items-center gap-4 w-full px-4 py-3 text-sm font-[family-name:var(--font-sans)] uppercase tracking-widest font-bold text-[#2D3A31] hover:bg-[#DCCFC2] transition-colors duration-200"
        >
          <LogOut size={18} strokeWidth={2} />
          Sign out
        </button>
      </div>
    </aside>
  );
}
