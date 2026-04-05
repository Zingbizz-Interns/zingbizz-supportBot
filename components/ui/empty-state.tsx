"use client";

import { motion } from "framer-motion";
import { ReactNode } from "react";

interface EmptyStateProps {
  title: string;
  description: string;
  action?: ReactNode;
  icon?: ReactNode;
}

export function CinematicEmptyState({ title, description, action, icon }: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center min-h-[40vh] w-full px-4 text-center">
      <motion.div
        initial={{ opacity: 0, filter: "blur(10px)", y: 20 }}
        animate={{ opacity: 1, filter: "blur(0px)", y: 0 }}
        transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
        className="flex flex-col items-center max-w-lg mx-auto"
      >
        {icon && (
          <motion.div 
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ delay: 0.2, duration: 0.6, ease: "easeOut" }}
            className="mb-8 p-4 rounded-full bg-[#8C9A84]/10 text-[#6A7A62]"
          >
            {icon}
          </motion.div>
        )}
        
        <h3 className="font-[family-name:var(--font-serif)] text-4xl md:text-5xl font-medium text-[#2D3A31] mb-4 text-balance">
          {title}
        </h3>
        
        <p className="font-[family-name:var(--font-sans)] text-[#6A7A62] text-lg mb-8 leading-relaxed text-balance">
          {description}
        </p>

        {action && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3, duration: 0.5 }}
          >
            {action}
          </motion.div>
        )}
      </motion.div>
    </div>
  );
}
