"use client";

import { motion, AnimatePresence } from "framer-motion";
import { useEffect } from "react";
import { useConfetti } from "@/components/ui/Confetti";

interface Props {
  open: boolean;
  level: string;
  onClose: () => void;
}

const LEVEL_EMOJI: Record<string, string> = {
  Explorer: "🔭", Learner: "📖", Achiever: "🎯", Innovator: "💡", Champion: "🏆",
};

export default function LevelUpModal({ open, level, onClose }: Props) {
  const fireConfetti = useConfetti();

  useEffect(() => {
    if (open) {
      fireConfetti(window.innerWidth / 2, window.innerHeight / 3);
      setTimeout(() => fireConfetti(window.innerWidth / 3, window.innerHeight / 3), 200);
      setTimeout(() => fireConfetti((window.innerWidth / 3) * 2, window.innerHeight / 3), 400);
    }
  }, [open, fireConfetti]);

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
          className="fixed inset-0 z-[100] flex items-center justify-center p-4"
          style={{ background: "rgb(0 0 0 / 0.6)", backdropFilter: "blur(8px)" }}
          onClick={onClose}
        >
          <motion.div
            initial={{ scale: 0.5, opacity: 0, rotate: -10 }}
            animate={{ scale: 1, opacity: 1, rotate: 0 }}
            exit={{ scale: 0.5, opacity: 0 }}
            transition={{ type: "spring", stiffness: 260, damping: 18 }}
            className="card p-10 text-center max-w-sm relative overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="absolute inset-0 pointer-events-none" style={{
              background: "radial-gradient(ellipse at 50% 0%, rgb(110 81 255 / 0.15) 0%, transparent 70%)"
            }} />
            <motion.div
              className="text-7xl mb-4 relative z-10"
              animate={{ y: [0, -12, 0], rotate: [0, -5, 5, 0] }}
              transition={{ duration: 1.5, repeat: Infinity, repeatDelay: 0.5 }}
            >
              {LEVEL_EMOJI[level] ?? "⭐"}
            </motion.div>
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }} className="relative z-10">
              <p className="text-sm font-semibold mb-1" style={{ color: "var(--brand-500)" }}>LEVEL UP!</p>
              <h2 className="text-2xl font-bold mb-2" style={{ color: "var(--ink)" }}>
                You're now a {level}!
              </h2>
              <p className="text-sm mb-6" style={{ color: "var(--ink-muted)" }}>
                Incredible progress! Keep up the momentum to reach the next level.
              </p>
              <button onClick={onClose} className="btn-primary w-full py-3">
                Awesome! 🎉
              </button>
            </motion.div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
