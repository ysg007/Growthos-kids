"use client";

import { motion, useMotionValue, useTransform, animate } from "framer-motion";
import { useEffect } from "react";
import { getGrowthLevel } from "@/lib/utils";
import type { ChildLevel } from "@/types/database";

const LEVEL_EMOJI: Record<string, string> = {
  Explorer: "🔭", Learner: "📖", Achiever: "🎯", Innovator: "💡", Champion: "🏆",
};
const LEVEL_COLORS: Record<string, string> = {
  Explorer: "#60A5FA", Learner: "#34D399", Achiever: "#FBBF24", Innovator: "#F97316", Champion: "#EF4444",
};

interface Props { score: number; level: ChildLevel; name: string; size?: number; }

export default function GrowthScoreRing({ score, level, size = 140 }: Props) {
  const { color } = getGrowthLevel(score);
  const levelColor = LEVEL_COLORS[level] ?? color;

  const outerR = (size - 14) / 2;
  const innerR = outerR - 12;
  const outerC = 2 * Math.PI * outerR;
  const innerC = 2 * Math.PI * innerR;

  const outerProgress = useMotionValue(outerC);
  const innerProgress = useMotionValue(innerC);
  const displayScore = useMotionValue(0);

  useEffect(() => {
    animate(outerProgress, outerC - (score / 100) * outerC, {
      duration: 1.4, ease: [0.34, 1.56, 0.64, 1], delay: 0.2
    });
    animate(innerProgress, innerC - (score / 100) * 0.7 * innerC, {
      duration: 1.6, ease: [0.34, 1.56, 0.64, 1], delay: 0.4
    });
    animate(displayScore, score, {
      duration: 1.2, ease: "easeOut", delay: 0.3,
    });
  }, [score]);

  const displayScoreRounded = useTransform(displayScore, (v) => Math.round(v).toString());

  return (
    <div className="flex flex-col items-center gap-3">
      <div className="relative" style={{ width: size, height: size }}>
        <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} style={{ transform: "rotate(-90deg)" }}>
          {/* Outer track */}
          <circle cx={size/2} cy={size/2} r={outerR}
            fill="none" stroke="var(--surface-subtle)" strokeWidth="7" />
          {/* Outer progress */}
          <motion.circle
            cx={size/2} cy={size/2} r={outerR}
            fill="none" stroke={levelColor} strokeWidth="7" strokeLinecap="round"
            strokeDasharray={outerC}
            style={{ strokeDashoffset: outerProgress }}
          />
          {/* Inner track */}
          <circle cx={size/2} cy={size/2} r={innerR}
            fill="none" stroke="var(--surface-subtle)" strokeWidth="4" />
          {/* Inner progress (secondary ring) */}
          <motion.circle
            cx={size/2} cy={size/2} r={innerR}
            fill="none" stroke={levelColor} strokeWidth="4" strokeLinecap="round"
            strokeDasharray={innerC} opacity={0.35}
            style={{ strokeDashoffset: innerProgress }}
          />
        </svg>

        {/* Center content */}
        <div className="absolute inset-0 flex flex-col items-center justify-center gap-0.5">
          <motion.span
            className="text-2xl"
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ type: "spring", stiffness: 500, delay: 0.8 }}
          >{LEVEL_EMOJI[level] ?? "⭐"}</motion.span>
          <motion.span
            className="text-2xl font-bold"
            style={{ color: "var(--ink)", letterSpacing: "-0.04em", lineHeight: 1 }}
          >{displayScoreRounded}</motion.span>
          <span className="text-xs font-medium" style={{ color: "var(--ink-subtle)" }}>/ 100</span>
        </div>

        {/* Glow ring on hover */}
        <div className="absolute inset-0 rounded-full opacity-0 hover:opacity-100 transition-opacity duration-300 pointer-events-none"
          style={{ boxShadow: `0 0 32px ${levelColor}40` }} />
      </div>

      {/* Level badge */}
      <motion.div
        className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold border"
        style={{ background: levelColor + "18", color: levelColor, borderColor: levelColor + "40" }}
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.9 }}
        whileHover={{ scale: 1.05 }}
      >
        {LEVEL_EMOJI[level]} {level}
      </motion.div>
    </div>
  );
}
