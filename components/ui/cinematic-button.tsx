"use client";

import { motion } from "framer-motion";
import { ReactNode, useRef, useState, MouseEvent } from "react";
import Link from "next/link";
import { cn } from "@/lib/utils";

interface CinematicButtonProps {
  children: ReactNode;
  href?: string;
  className?: string;
  variant?: "primary" | "secondary" | "outline";
  onClick?: () => void;
  disabled?: boolean;
}

export function CinematicButton({ 
  children, 
  href, 
  className, 
  variant = "primary",
  onClick,
  disabled
}: CinematicButtonProps) {
  const ref = useRef<HTMLDivElement>(null);
  const [position, setPosition] = useState({ x: 0, y: 0 });

  const handleMouseMove = (e: MouseEvent<HTMLDivElement>) => {
    if (!ref.current) return;
    const { clientX, clientY } = e;
    const { height, width, left, top } = ref.current.getBoundingClientRect();
    const middleX = clientX - (left + width / 2);
    const middleY = clientY - (top + height / 2);
    setPosition({ x: middleX * 0.1, y: middleY * 0.1 });
  };

  const reset = () => {
    setPosition({ x: 0, y: 0 });
  };

  const baseClasses = cn(
    "relative inline-flex min-h-11 items-center justify-center overflow-hidden rounded-full px-10 py-4 font-[family-name:var(--font-sans)] text-sm uppercase tracking-widest transition-colors duration-300 group",
    {
      "bg-foreground text-background hover:bg-primary-hover": variant === "primary",
      "border border-sage text-sage hover:bg-sage hover:text-background": variant === "secondary",
      "border border-border text-foreground hover:bg-muted": variant === "outline",
      "opacity-50 pointer-events-none": disabled
    },
    className
  );

  const innerContent = (
    <>
      <span className="relative z-10">{children}</span>
      {variant === "primary" && (
        <span className="absolute inset-0 z-0 bg-primary-hover translate-y-[100%] rounded-full transition-transform duration-500 ease-out group-hover:translate-y-0" />
      )}
      {variant === "secondary" && (
        <span className="absolute inset-0 z-0 bg-sage translate-y-[100%] rounded-full transition-transform duration-500 ease-out group-hover:translate-y-0" />
      )}
    </>
  );

  const motionProps = {
    ref,
    onMouseMove: handleMouseMove,
    onMouseLeave: reset,
    animate: { x: position.x, y: position.y },
    transition: { type: "spring" as const, stiffness: 150, damping: 15, mass: 0.1 },
    whileHover: { scale: 1.05 },
    whileTap: { scale: 0.95 },
    className: baseClasses,
    onClick,
    disabled
  };

  if (href) {
    return (
      <motion.div {...motionProps} style={{ display: "inline-block" }}>
        <Link
          href={href}
          aria-disabled={disabled}
          className={cn(baseClasses, "w-full", disabled && "pointer-events-none")}
        >
          {innerContent}
        </Link>
      </motion.div>
    );
  }

  return (
    <motion.button {...motionProps}>
      {innerContent}
    </motion.button>
  );
}
