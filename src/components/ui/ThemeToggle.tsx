"use client";

import React, { useSyncExternalStore } from "react";
import { useTheme } from "next-themes";
import { motion, AnimatePresence } from "framer-motion";

const emptySubscribe = () => () => {};

function useIsMounted() {
  return useSyncExternalStore(
    emptySubscribe,
    () => true,
    () => false
  );
}

export function ThemeToggle() {
  const { theme, setTheme, resolvedTheme } = useTheme();
  const mounted = useIsMounted();

  if (!mounted) {
    return (
      <div className="w-10 h-10 rounded-full bg-[var(--liquid-bg)] border border-[var(--liquid-border)] opacity-50" />
    );
  }

  const currentTheme = theme === "system" ? resolvedTheme : theme;
  const isDark = currentTheme === "dark";

  const toggleTheme = () => {
    setTheme(isDark ? "light" : "dark");
  };

  return (
    <motion.button
      onClick={toggleTheme}
      className="relative flex items-center justify-center w-10 h-10 rounded-full bg-[var(--liquid-bg)] border border-[var(--liquid-border)] text-[var(--md-sys-color-primary)] hover:bg-[var(--liquid-hover-bg)] hover:border-[var(--liquid-hover-border)] hover:shadow-[0_0_15px_var(--liquid-hover-shadow)] backdrop-blur-md transition-all duration-300 outline-none cursor-pointer overflow-hidden"
      whileHover={{ scale: 1.08 }}
      whileTap={{ scale: 0.92 }}
      title={`Switch to ${isDark ? "light" : "dark"} mode`}
      aria-label="Toggle Theme"
    >
      <AnimatePresence mode="wait" initial={false}>
        {isDark ? (
          <motion.svg
            key="sun"
            initial={{ scale: 0, rotate: -90, opacity: 0 }}
            animate={{ scale: 1, rotate: 0, opacity: 1 }}
            exit={{ scale: 0, rotate: 90, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="w-5 h-5 fill-current text-[var(--md-sys-color-primary)]"
            viewBox="0 0 24 24"
          >
            <path d="M12 7c-2.76 0-5 2.24-5 5s2.24 5 5 5 5-2.24 5-5-2.24-5-5-5zM2 13h2c.55 0 1-.45 1-1s-.45-1-1-1H2c-.55 0-1 .45-1 1s.45 1 1 1zm18 0h2c.55 0 1-.45 1-1s-.45-1-1-1h-2c-.55 0-1 .45-1 1s.45 1 1 1zM11 2v2c0 .55.45 1 1 1s1-.45 1-1V2c0-.55-.45-1-1-1s-1 .45-1 1zm0 18v2c0 .55.45 1 1 1s1-.45 1-1v-2c0-.55-.45-1-1-1s-1 .45-1 1zM5.99 4.58c-.39-.39-1.03-.39-1.41 0s-.39 1.03 0 1.41l1.06 1.06c.39.39 1.03.39 1.41 0s.39-1.03 0-1.41L5.99 4.58zm12.37 12.37c-.39-.39-1.03-.39-1.41 0s-.39 1.03 0 1.41l1.06 1.06c.39.39 1.03.39 1.41 0s.39-1.03 0-1.41l-1.06-1.06zm1.06-10.96c.39-.39.39-1.03 0-1.41s-1.03-.39-1.41 0l-1.06 1.06c-.39.39-.39 1.03 0 1.41s1.03.39 1.41 0l1.06-1.06zM7.05 18.36c.39-.39.39-1.03 0-1.41s-1.03-.39-1.41 0l-1.06 1.06c-.39.39-.39 1.03 0 1.41s1.03.39 1.41 0l1.06-1.06z" />
          </motion.svg>
        ) : (
          <motion.svg
            key="moon"
            initial={{ scale: 0, rotate: 90, opacity: 0 }}
            animate={{ scale: 1, rotate: 0, opacity: 1 }}
            exit={{ scale: 0, rotate: -90, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="w-5 h-5 fill-current text-[var(--md-sys-color-primary)]"
            viewBox="0 0 24 24"
          >
            <path d="M12.3 2c.43 0 .77.35.7.78-.62 3.84 1.5 7.6 5.17 9.17.4.17.58.64.4.1.04 0 .09 0 .13-.01.38-.13.78.11.89.5.46 1.69 2.14 2.65 3.99 2.37 4.14-1.39 1.42-3.89 1.42-5.28 0-4.66-3.8-8.44-8.48-8.44-1.57 0-3.07.43-4.36 1.25-.37.23-.85.12-1.07-.24-.2-.33-.12-.76.19-.99C6.07 3.32 8.98 2 12.3 2z" />
          </motion.svg>
        )}
      </AnimatePresence>
    </motion.button>
  );
}
