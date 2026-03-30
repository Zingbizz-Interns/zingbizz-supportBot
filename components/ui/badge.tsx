import { type ReactNode } from "react";

interface BadgeProps {
  children: ReactNode;
  variant?: "default" | "sage" | "terracotta" | "success" | "warning";
  className?: string;
}

export function Badge({ children, variant = "default", className = "" }: BadgeProps) {
  const base = "inline-flex items-center rounded-full px-3 py-1 text-xs font-medium font-sans uppercase tracking-wide";

  const variants = {
    default: "bg-[#F2F0EB] text-[#2D3A31]",
    sage: "bg-[#8C9A84]/15 text-[#8C9A84]",
    terracotta: "bg-[#C27B66]/15 text-[#C27B66]",
    success: "bg-[#8C9A84]/20 text-[#2D3A31]",
    warning: "bg-[#C27B66]/15 text-[#C27B66]",
  };

  return (
    <span className={`${base} ${variants[variant]} ${className}`}>
      {children}
    </span>
  );
}
