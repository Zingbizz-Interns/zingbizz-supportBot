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
  { label: "Home",      href: "/dashboard",                icon: LayoutDashboard },
  { label: "Setup",     href: "/dashboard/chatbot/setup",  icon: Settings        },
  { label: "Customize", href: "/dashboard/chatbot/customize", icon: Palette      },
  { label: "Sources",   href: "/dashboard/chatbot/sources",icon: Database        },
  { label: "Insights",  href: "/dashboard/insights",       icon: BarChart2       },
];

export function BottomNav({ canCustomize }: { canCustomize: boolean }) {
  const pathname = usePathname();

  function isActive(href: string): boolean {
    if (href === "/dashboard") return pathname === "/dashboard";
    return pathname.startsWith(href);
  }

  return (
    <nav className="lg:hidden fixed bottom-0 left-0 right-0 z-40 bg-background border-t border-clay pb-safe">
      <div className="flex items-center justify-around px-2 py-3">
        {navItems.map((item) => {
          const Icon = item.icon;
          const active = isActive(item.href);
          const isDisabled = item.label === "Customize" && !canCustomize;

          return (
            <Link
              key={item.label}
              href={isDisabled ? "#" : item.href}
              title={
                isDisabled
                  ? "Complete setup to unlock customization"
                  : undefined
              }
              aria-disabled={isDisabled}
              className={`flex min-h-11 min-w-11 flex-col items-center justify-center gap-1.5 rounded-xl px-3 py-2 transition-all duration-200 ${
                active
                  ? "bg-foreground text-background"
                  : "text-foreground hover:bg-stone"
              } ${isDisabled ? "pointer-events-none opacity-50" : ""}`}
            >
              <Icon size={20} strokeWidth={1.5} />
              <span className="text-[10px] font-[family-name:var(--font-sans)] uppercase tracking-widest font-bold leading-none">
                {item.label}
              </span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
