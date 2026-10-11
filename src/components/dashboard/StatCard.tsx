"use client";

import { motion } from "framer-motion";
import AnimatedCounter from "@/components/ui/AnimatedCounter";

interface Props {
  icon: string;
  value: number;
  suffix?: string;
  decimals?: number;
  label: string;
  sublabel?: string;
  delay?: number;
}

export default function StatCard({ icon, value, suffix = "", decimals = 0, label, sublabel, delay = 0 }: Props) {
  return (
    <motion.div
      className="stat-card"
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay, type: "spring", stiffness: 300, damping: 25 }}
      whileHover={{ y: -3 }}
    >
      <motion.div className="text-2xl" initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ delay: delay + 0.1, type: "spring", stiffness: 500 }}>
        {icon}
      </motion.div>
      <div className="stat-value">
        <AnimatedCounter value={value} suffix={suffix} decimals={decimals} duration={1000} />
      </div>
      <div className="stat-label">{label}</div>
      {sublabel && <div className="text-xs" style={{ color: "var(--ink-subtle)" }}>{sublabel}</div>}
    </motion.div>
  );
}
