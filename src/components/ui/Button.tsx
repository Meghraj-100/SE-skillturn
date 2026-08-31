"use client";

import React from "react";
import { motion, HTMLMotionProps } from "framer-motion";

interface ButtonProps extends HTMLMotionProps<"button"> {
  variant?: "filled" | "outlined" | "text" | "glass";
  children: React.ReactNode;
}

export const Button = ({
  variant = "filled",
  children,
  className = "",
  ...props
}: ButtonProps) => {
  const baseStyles =
    "inline-flex items-center justify-center relative min-w-[64px] rounded-full px-6 h-10 text-sm font-medium tracking-wide transition-all duration-300 backdrop-blur-md cursor-pointer select-none overflow-hidden outline-none before:absolute before:inset-0 before:-translate-x-full hover:before:translate-x-full before:transition-transform before:duration-500 before:ease-in-out before:bg-gradient-to-r before:from-transparent before:via-[var(--liquid-shine)] before:to-transparent before:z-10";

  const variantStyles = {
    filled:
      "bg-[var(--md-sys-color-primary)] text-[var(--md-sys-color-on-primary)] border border-white/10 shadow-[0_4px_15px_rgba(0,0,0,0.1)] hover:shadow-[0_0_20px_var(--liquid-hover-shadow)] hover:border-white/30",
    outlined:
      "bg-[var(--liquid-bg)] border border-[var(--liquid-border)] text-[var(--md-sys-color-primary)] hover:bg-[var(--liquid-hover-bg)] hover:border-[var(--liquid-hover-border)] hover:shadow-[0_0_15px_var(--liquid-hover-shadow)]",
    text: "text-[var(--md-sys-color-primary)] bg-transparent px-4 hover:bg-[var(--liquid-hover-bg)]",
    glass:
      "bg-[var(--liquid-bg)] border border-[var(--liquid-border)] text-[var(--md-sys-color-on-surface)] hover:bg-[var(--liquid-hover-bg)] hover:border-[var(--liquid-hover-border)] hover:shadow-[0_0_15px_var(--liquid-hover-shadow)]",
  };

  return (
    <motion.button
      className={`${baseStyles} ${variantStyles[variant]} ${className}`}
      whileHover={{ scale: 1.05 }}
      whileTap={{ scale: 0.95 }}
      suppressHydrationWarning
      {...props}
    >
      <span className="relative z-20 inline-flex items-center justify-center gap-2">
        {children}
      </span>
    </motion.button>
  );
};
