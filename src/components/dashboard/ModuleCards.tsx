"use client";

import Link from "next/link";
import { motion, type Variants } from "framer-motion";

const MODULES = [
  { href:"/parent/academics", icon:"📚", label:"Academics",   color:"#6E51FF", desc:"Subjects & exams" },
  { href:"/parent/habits",    icon:"⚡", label:"Habits",      color:"#10B981", desc:"Daily routines" },
  { href:"/parent/skills",    icon:"🎯", label:"Skills",      color:"#F59E0B", desc:"Life skills" },
  { href:"/parent/physical",  icon:"💪", label:"Physical",    color:"#EF4444", desc:"Growth & fitness" },
  { href:"/parent/mental",    icon:"🧠", label:"Mental",      color:"#8B5CF6", desc:"Focus & logic" },
  { href:"/parent/homework",  icon:"✏️", label:"Homework",    color:"#F97316", desc:"AI-guided help" },
  { href:"/parent/reports",   icon:"📊", label:"Reports",     color:"#0EA5E9", desc:"Weekly & monthly" },
  { href:"/parent/ai-coach",  icon:"🤖", label:"AI Coach",    color:"#EC4899", desc:"Parenting advice" },
];

const container: Variants = {
  hidden: {},
  show: { transition: { staggerChildren: 0.06 } },
};

const item: Variants = {
  hidden: { opacity: 0, y: 16, scale: 0.95 },
  show: {
    opacity: 1, y: 0, scale: 1,
    transition: { type: "spring", stiffness: 400, damping: 25 } as never,
  },
};

interface Props { childId?: string; }

export default function ModuleCards({ childId }: Props) {
  return (
    <motion.div variants={container} initial="hidden" animate="show" className="grid grid-cols-2 md:grid-cols-4 gap-3">
      {MODULES.map((mod) => (
        <motion.div key={mod.href} variants={item}>
          <Link href={childId ? `${mod.href}?child=${childId}` : mod.href} className="group block">
            <motion.div
              className="card p-4 relative overflow-hidden"
              whileHover={{ y: -4, boxShadow: "0 8px 24px rgb(0 0 0 / 0.1)" }}
              whileTap={{ scale: 0.97 }}
              transition={{ type: "spring", stiffness: 500, damping: 25 }}
            >
              <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300"
                style={{ background: `radial-gradient(ellipse at 30% 30%, ${mod.color}12 0%, transparent 70%)` }} />
              <div className="absolute top-0 left-0 right-0 h-0.5 opacity-0 group-hover:opacity-100 transition-opacity duration-300"
                style={{ background: mod.color }} />
              <motion.div
                className="text-2xl mb-3 inline-block"
                whileHover={{ rotate: -8, scale: 1.15 }}
                transition={{ type: "spring", stiffness: 400, damping: 10 }}
                style={{ filter: `drop-shadow(0 2px 8px ${mod.color}60)` }}
              >{mod.icon}</motion.div>
              <div className="font-semibold text-sm mb-0.5 relative z-10" style={{ color: "var(--ink)" }}>{mod.label}</div>
              <div className="text-xs relative z-10" style={{ color: "var(--ink-muted)" }}>{mod.desc}</div>
              <div className="absolute bottom-3 right-3 text-xs font-bold opacity-0 group-hover:opacity-100 transition-opacity"
                style={{ color: mod.color }}>→</div>
            </motion.div>
          </Link>
        </motion.div>
      ))}
    </motion.div>
  );
}
