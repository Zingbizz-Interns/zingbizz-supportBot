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

export function BottomNav({ canCustomize }: { canCustomize: boolean }) {
  const pathname = usePathname();
  const navItems: NavItem[] = [
    { label: "Home", href: "/dashboard", icon: LayoutDashboard },
    { label: "Setup", href: "/dashboard/chatbot/setup", icon: Settings },
    { label: "Customize", href: "/dashboard/chatbot/customize", icon: Palette },
    { label: "Sources", href: "/dashboard/chatbot/sources", icon: Database },
    { label: "Insights", href: "/dashboard/insights", icon: BarChart2 },
  ];

  function isActive(href: string): boolean {
    if (href === "/dashboard") {
      return pathname === "/dashboard";
    }
    return pathname.startsWith(href);
  }

  return (
    <nav className="lg:hidden fixed bottom-0 left-0 right-0 z-40 bg-[#F9F8F4] border-t border-[#DCCFC2] pb-safe">
      <div className="flex items-center justify-around px-2 py-4">
        {navItems.map((item) => {
          const Icon = item.icon;
          const active = isActive(item.href);
          
          return (
            <Link
              key={item.label}
              href={item.href}
              title={item.label === "Customize" && !canCustomize ? "Complete setup to unlock customization" : undefined}
              aria-disabled={item.label === "Customize" && !canCustomize}
              className={`relative flex min-h-11 min-w-11 flex-col items-center justify-center gap-1.5 px-3 py-2 transition-colors duration-200 z-10 ${
                active ? "text-[#F9F8F4] bg-[#2D3A31]" : "text-[#2D3A31] hover:text-[#9E5946]"
              }`}
            >
              <Icon size={20} strokeWidth={2} className="relative z-10" />
              <span className="text-[10px] font-[family-name:var(--font-sans)] uppercase tracking-widest font-bold leading-none relative z-10">
                {item.label}
              </span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
