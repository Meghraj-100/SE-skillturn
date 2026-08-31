"use client";

import React from "react";
import { motion, HTMLMotionProps } from "framer-motion";

interface CardProps extends HTMLMotionProps<"div"> {
  variant?: "elevated" | "outlined" | "filled";
  children: React.ReactNode;
}

export const Card = ({
  variant = "elevated",
  children,
  className = "",
  ...props
}: CardProps) => {
  const baseStyles =
    "rounded-xl p-4 transition-shadow duration-300 ease-out overflow-hidden bg-[var(--md-sys-color-surface)] text-[var(--md-sys-color-on-surface)]";

  const variantStyles = {
    elevated:
      "shadow-[0px_1px_3px_1px_rgba(0,0,0,0.15),0px_1px_2px_0px_rgba(0,0,0,0.3)] hover:shadow-[0px_2px_4px_1px_rgba(0,0,0,0.2),0px_4px_5px_0px_rgba(0,0,0,0.14),0px_1px_10px_0px_rgba(0,0,0,0.12)]",
    outlined:
      "border border-[var(--md-sys-color-secondary)] bg-[var(--md-sys-color-surface)]",
    filled:
      "bg-[var(--md-sys-color-secondary-container)] text-[var(--md-sys-color-on-secondary-container)]",
  };

  return (
    <motion.div
      className={`${baseStyles} ${variantStyles[variant]} ${className}`}
      whileHover={{ y: -5, transition: { duration: 0.2 } }}
      {...props}
    >
      {children}
    </motion.div>
  );
};
