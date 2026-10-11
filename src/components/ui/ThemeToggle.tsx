"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";

export default function ThemeToggle() {
  const [dark, setDark] = useState(false);

  useEffect(() => {
    const stored = localStorage.getItem("growthos-theme");
    const prefersDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
    const isDark = stored ? stored === "dark" : prefersDark;
    setDark(isDark);
    document.documentElement.classList.toggle("dark", isDark);
  }, []);

  function toggle() {
    const next = !dark;
    setDark(next);
    document.documentElement.classList.toggle("dark", next);
    localStorage.setItem("growthos-theme", next ? "dark" : "light");
  }

  return (
    <motion.button
      onClick={toggle}
      className="relative w-12 h-6 rounded-full p-0.5 transition-colors"
      style={{ background: dark ? "var(--brand-500)" : "var(--surface-border)" }}
      whileTap={{ scale: 0.92 }}
      aria-label="Toggle dark mode"
    >
      <motion.div
        className="w-5 h-5 rounded-full bg-white flex items-center justify-center text-[10px] shadow-sm"
        animate={{ x: dark ? 24 : 0 }}
        transition={{ type: "spring", stiffness: 500, damping: 30 }}
      >
        {dark ? "🌙" : "☀️"}
      </motion.div>
    </motion.button>
  );
}
