"use client";

import type { CSSProperties } from "react";
import { motion } from "framer-motion";

export function CinematicSkeleton({ 
  className = "", 
  variant = "rectangular",
  style,
}: { 
  className?: string; 
  variant?: "rectangular" | "circular" | "title" | "text";
  style?: CSSProperties;
}) {
  const getVariantClasses = () => {
    switch (variant) {
      case "circular": return "rounded-full w-12 h-12";
      case "title": return "rounded-none w-3/4 h-12";
      case "text": return "rounded-none w-full h-4";
      default: return "rounded-none w-full h-full";
    }
  };

  return (
    <motion.div
      className={`bg-[#DCCFC2]/40 overflow-hidden relative ${getVariantClasses()} ${className}`}
      style={style}
      initial={{ opacity: 0.5 }}
      animate={{ opacity: [0.5, 1, 0.5] }}
      transition={{ 
        duration: 2.5, 
        repeat: Infinity, 
        ease: "easeInOut" 
      }}
    >
      {/* Cinematic sheer sheen overlay */}
      <motion.div
        className="absolute inset-0 z-10 w-full h-full"
        style={{
          background: "linear-gradient(90deg, transparent 0%, rgba(249, 248, 244, 0.4) 50%, transparent 100%)",
        }}
        initial={{ x: "-100%" }}
        animate={{ x: "100%" }}
        transition={{
          duration: 2,
          repeat: Infinity,
          ease: "easeInOut",
          repeatDelay: 0.5
        }}
      />
    </motion.div>
  );
}

export function SkeletonGrid({ count = 3 }: { count?: number }) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 w-full">
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="flex flex-col gap-4 border border-[#DCCFC2] p-6 bg-[#F9F8F4]">
          <CinematicSkeleton variant="title" />
          <div className="space-y-2 mt-4">
            <CinematicSkeleton variant="text" />
            <CinematicSkeleton variant="text" />
            <CinematicSkeleton variant="text" className="w-5/6" />
          </div>
        </div>
      ))}
    </div>
  );
}
