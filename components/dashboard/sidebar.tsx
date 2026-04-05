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
  { label: "Home",      href: "/dashboard",                icon: LayoutDashboard },
  { label: "Setup",     href: "/dashboard/chatbot/setup",  icon: Settings        },
  { label: "Customize", href: "/dashboard/chatbot/customize", icon: Palette      },
  { label: "Sources",   href: "/dashboard/chatbot/sources",icon: Database        },
  { label: "Embed",     href: "/dashboard/chatbot/embed",  icon: Code            },
  { label: "Insights",  href: "/dashboard/insights",       icon: BarChart2       },
];

export function Sidebar({ canCustomize }: { canCustomize: boolean }) {
  const pathname = usePathname();

  function isActive(href: string): boolean {
    if (href === "/dashboard") return pathname === "/dashboard";
    return pathname.startsWith(href);
  }

  return (
    <aside className="hidden lg:flex fixed left-0 top-0 h-full w-[280px] flex-col bg-background border-r border-clay z-40">
      {/* Brand */}
      <div className="px-8 py-8 border-b border-clay bg-stone">
        <span className="font-[family-name:var(--font-serif)] tracking-tighter text-3xl font-black text-foreground">
          ZingDesk
        </span>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-3 py-6 space-y-1 overflow-y-auto">
        {navItems.map((item) => {
          const Icon = item.icon;
          const active = isActive(item.href);

          return (
            <Link
              key={item.label}
              href={item.href}
              title={
                item.label === "Customize" && !canCustomize
                  ? "Complete setup to unlock customization"
                  : undefined
              }
              aria-disabled={item.label === "Customize" && !canCustomize}
              className={`flex min-h-11 items-center gap-3.5 rounded-xl px-4 py-3 text-sm font-[family-name:var(--font-sans)] uppercase tracking-widest transition-all duration-200 w-full ${
                active
                  ? "bg-foreground text-background font-bold"
                  : "text-foreground hover:bg-stone"
              }`}
            >
              <Icon size={17} strokeWidth={1.5} />
              <span>{item.label}</span>
            </Link>
          );
        })}
      </nav>

      {/* Sign out */}
      <div className="px-3 py-5 border-t border-clay bg-stone">
        <button
          onClick={() => signOut({ callbackUrl: "/login" })}
          className="flex items-center gap-3.5 w-full rounded-xl px-4 py-3 text-sm font-[family-name:var(--font-sans)] uppercase tracking-widest font-bold text-foreground hover:bg-clay transition-colors duration-200"
        >
          <LogOut size={17} strokeWidth={1.5} />
          Sign out
        </button>
      </div>
    </aside>
  );
}
