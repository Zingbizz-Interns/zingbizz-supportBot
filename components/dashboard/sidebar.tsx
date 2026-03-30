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

const navItems: NavItem[] = [
  { label: "Home", href: "/dashboard", icon: LayoutDashboard },
  { label: "Setup", href: "/dashboard/chatbot/setup", icon: Settings },
  { label: "Customize", href: "/dashboard/chatbot/customize", icon: Palette },
  { label: "Sources", href: "/dashboard/chatbot/sources", icon: Database },
  { label: "Embed", href: "/dashboard/chatbot/embed", icon: Code },
  { label: "Insights", href: "/dashboard/insights", icon: BarChart2 },
];

export function Sidebar() {
  const pathname = usePathname();

  function isActive(href: string): boolean {
    if (href === "/dashboard") {
      return pathname === "/dashboard";
    }
    return pathname.startsWith(href);
  }

  return (
    <aside className="hidden lg:flex fixed left-0 top-0 h-full w-[250px] flex-col bg-white border-r border-[#E6E2DA] z-40">
      {/* Brand */}
      <div className="px-6 py-6 border-b border-[#E6E2DA]">
        <span className="font-serif text-xl font-semibold text-[#2D3A31]">
          ZingBizz
        </span>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
        {navItems.map((item) => {
          const active = isActive(item.href);
          const Icon = item.icon;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-sans transition-colors duration-200 ${
                active
                  ? "bg-[#F2F0EB] text-[#2D3A31] font-medium"
                  : "text-[#8C9A84] hover:bg-[#F2F0EB] hover:text-[#2D3A31]"
              }`}
            >
              <Icon size={18} strokeWidth={1.5} />
              {item.label}
            </Link>
          );
        })}
      </nav>

      {/* Sign out */}
      <div className="px-3 py-4 border-t border-[#E6E2DA]">
        <button
          onClick={() => signOut({ callbackUrl: "/login" })}
          className="flex items-center gap-3 w-full px-3 py-2.5 rounded-xl text-sm font-sans text-[#8C9A84] hover:bg-[#F2F0EB] hover:text-[#2D3A31] transition-colors duration-200"
        >
          <LogOut size={18} strokeWidth={1.5} />
          Sign out
        </button>
      </div>
    </aside>
  );
}
