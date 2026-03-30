"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  Settings,
  Palette,
  Database,
  BarChart2,
} from "lucide-react";

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
  { label: "Insights", href: "/dashboard/insights", icon: BarChart2 },
];

export function BottomNav() {
  const pathname = usePathname();

  function isActive(href: string): boolean {
    if (href === "/dashboard") {
      return pathname === "/dashboard";
    }
    return pathname.startsWith(href);
  }

  return (
    <nav className="lg:hidden fixed bottom-0 left-0 right-0 z-40 bg-white border-t border-[#E6E2DA]">
      <div className="flex items-center justify-around px-2 py-2">
        {navItems.map((item) => {
          const active = isActive(item.href);
          const Icon = item.icon;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex flex-col items-center gap-1 px-3 py-1.5 rounded-xl transition-colors duration-200 ${
                active
                  ? "text-[#2D3A31]"
                  : "text-[#8C9A84] hover:text-[#2D3A31]"
              }`}
            >
              <Icon
                size={20}
                strokeWidth={1.5}
                className={active ? "text-[#2D3A31]" : ""}
              />
              <span className="text-[10px] font-sans font-medium leading-none">
                {item.label}
              </span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
