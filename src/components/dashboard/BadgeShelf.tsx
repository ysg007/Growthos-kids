"use client";

import { motion } from "framer-motion";
import type { ChildBadge } from "@/types/database";

interface Props { badges: ChildBadge[]; }

const CATEGORY_COLORS: Record<string, string> = {
  academic: "#6E51FF", habits: "#10B981", skills: "#F59E0B",
  physical: "#EF4444", mental: "#8B5CF6", consistency: "#F97316", milestone: "#0EA5E9",
};

export default function BadgeShelf({ badges }: Props) {
  if (badges.length === 0) {
    return (
      <div className="card p-8 text-center">
        <div className="text-4xl mb-3">🏅</div>
        <p className="text-sm font-medium" style={{ color: "var(--ink)" }}>No badges yet</p>
        <p className="text-xs mt-1" style={{ color: "var(--ink-muted)" }}>Complete habits and academics to earn your first badge!</p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
      {badges.map((cb, i) => {
        const badge = cb.badge;
        if (!badge) return null;
        const color = CATEGORY_COLORS[badge.category] ?? "#6E51FF";
        return (
          <motion.div
            key={cb.id}
            className="badge-card"
            initial={{ opacity: 0, scale: 0.8, rotateY: -30 }}
            animate={{ opacity: 1, scale: 1, rotateY: 0 }}
            transition={{ delay: i * 0.08, type: "spring", stiffness: 300, damping: 20 }}
          >
            <div className="badge-inner relative" style={{ height: 140 }}>
              {/* Front */}
              <div className="badge-front card p-4 h-full flex flex-col items-center justify-center text-center gap-2"
                style={{ background: `linear-gradient(135deg, ${color}10, ${color}02)`, border: `1px solid ${color}30` }}>
                <motion.div
                  className="text-4xl"
                  animate={{ rotate: [0, -5, 5, 0] }}
                  transition={{ duration: 3, repeat: Infinity, repeatDelay: 2 }}
                  style={{ filter: `drop-shadow(0 4px 8px ${color}50)` }}
                >{badge.icon}</motion.div>
                <div className="text-xs font-bold" style={{ color: "var(--ink)" }}>{badge.name}</div>
                <div className="text-[10px] font-semibold px-2 py-0.5 rounded-full" style={{ background: color + "18", color }}>
                  +{badge.points} XP
                </div>
              </div>
              {/* Back */}
              <div className="badge-back card p-4" style={{ background: color, color: "#fff" }}>
                <p className="text-xs text-center leading-relaxed font-medium">{badge.description}</p>
              </div>
            </div>
          </motion.div>
        );
      })}
    </div>
  );
}
