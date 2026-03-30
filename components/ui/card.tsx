import { type HTMLAttributes } from "react";

interface CardProps extends HTMLAttributes<HTMLDivElement> {
  hover?: boolean;
  variant?: "white" | "muted";
}

export function Card({
  hover = true,
  variant = "white",
  children,
  className = "",
  ...props
}: CardProps) {
  const base = "rounded-3xl p-8";
  const variants = {
    white: "bg-white",
    muted: "bg-[#F2F0EB]",
  };
  const hoverClass = hover
    ? "transition-all duration-500 hover:-translate-y-1 hover:shadow-[0_20px_40px_-10px_rgba(45,58,49,0.1)]"
    : "";
  const shadow = "shadow-[0_4px_6px_-1px_rgba(45,58,49,0.05)]";

  return (
    <div
      className={`${base} ${variants[variant]} ${shadow} ${hoverClass} ${className}`}
      {...props}
    >
      {children}
    </div>
  );
}
