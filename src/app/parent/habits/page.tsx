"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useChildrenStore } from "@/stores";
import { useConfetti } from "@/components/ui/Confetti";
import { getHabitIcon, getHabitLabel, formatDate } from "@/lib/utils";
import { format, subDays } from "date-fns";
import toast from "react-hot-toast";
import type { Habit, HabitStreak, HabitType } from "@/types/database";

const ALL_HABITS: HabitType[] = ["reading","homework","exercise","sleep","meditation","water","journaling","screen_time"];

const HABIT_TARGETS: Record<HabitType, { value: number; unit: string; label: string }> = {
  reading:    { value: 20, unit: "min",  label: "minutes" },
  homework:   { value: 45, unit: "min",  label: "minutes" },
  exercise:   { value: 30, unit: "min",  label: "minutes" },
  sleep:      { value: 8,  unit: "hr",   label: "hours" },
  meditation: { value: 10, unit: "min",  label: "minutes" },
  water:      { value: 6,  unit: "glass",label: "glasses" },
  journaling: { value: 10, unit: "min",  label: "minutes" },
  screen_time:{ value: 60, unit: "min",  label: "minutes (limit)" },
};

const container = { hidden: {}, show: { transition: { staggerChildren: 0.05 } } };
const item = {
  hidden: { opacity: 0, y: 12, scale: 0.96 },
  show: { opacity: 1, y: 0, scale: 1, transition: { type: "spring" as const, stiffness: 400, damping: 25 } },
};

export default function HabitsPage() {
  const { getActiveChild } = useChildrenStore();
  const child = getActiveChild();
  const today = format(new Date(), "yyyy-MM-dd");
  const fireConfetti = useConfetti();

  const [habits, setHabits] = useState<Habit[]>([]);
  const [streaks, setStreaks] = useState<HabitStreak[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedDate, setSelectedDate] = useState(today);
  const [logging, setLogging] = useState<string | null>(null);
  const [showAddHabit, setShowAddHabit] = useState(false);
  const buttonRefs = useRef<Record<string, HTMLButtonElement | null>>({});

  const load = useCallback(async () => {
    if (!child) return;
    setLoading(true);
    try {
      const res = await fetch(`/api/habits?child_id=${child.id}&days=14`);
      const { habits: h, streaks: s } = await res.json();
      setHabits(h ?? []);
      setStreaks(s ?? []);
    } catch { toast.error("Failed to load habits"); }
    finally { setLoading(false); }
  }, [child]);

  useEffect(() => { load(); }, [load]);

  function getHabitForDate(type: HabitType, date: string) {
    return habits.find((h) => h.habit_type === type && h.logged_date === date);
  }
  function getStreak(type: HabitType) {
    return streaks.find((s) => s.habit_type === type);
  }

  async function toggleHabit(habitType: HabitType) {
    if (!child || logging) return;
    const existing = getHabitForDate(habitType, selectedDate);
    const newCompleted = !existing?.completed;
    setLogging(habitType);

    // Fire confetti at button position when completing
    if (newCompleted) {
      const btn = buttonRefs.current[habitType];
      if (btn) {
        const rect = btn.getBoundingClientRect();
        fireConfetti(rect.left + rect.width / 2, rect.top + rect.height / 2);
      }
    }

    const target = HABIT_TARGETS[habitType];
    if (existing) {
      setHabits((h) => h.map((x) => x.id === existing.id ? { ...x, completed: newCompleted } : x));
    } else {
      const tempHabit: Habit = {
        id: "temp-" + habitType, child_id: child.id, habit_type: habitType, completed: true,
        value: target.value, unit: target.unit, target_value: target.value,
        logged_date: selectedDate, notes: null, created_at: new Date().toISOString(),
      };
      setHabits((h) => [...h, tempHabit]);
    }

    try {
      const res = await fetch("/api/habits", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          child_id: child.id, habit_type: habitType, completed: newCompleted,
          value: target.value, unit: target.unit, target_value: target.value, logged_date: selectedDate,
        }),
      });
      if (!res.ok) throw new Error();
      if (newCompleted && selectedDate === today) {
        toast.success(`${getHabitLabel(habitType)} logged! 🎉`, {
          style: { background: "#ECFDF5", border: "1px solid #6EE7B7", color: "#065F46" },
        });
      }
      await load();
    } catch {
      toast.error("Failed to update habit");
      await load();
    } finally { setLogging(null); }
  }

  const last7 = Array.from({ length: 7 }, (_, i) => {
    const d = subDays(new Date(), 6 - i);
    const ds = format(d, "yyyy-MM-dd");
    return { date: ds, label: format(d, "EEE"), dayNum: format(d, "d"), isToday: ds === today };
  });

  const completedToday = ALL_HABITS.filter((h) => getHabitForDate(h, selectedDate)?.completed).length;
  const completionRate = Math.round((completedToday / ALL_HABITS.length) * 100);
  const allDone = completedToday === ALL_HABITS.length;

  return (
    <div className="max-w-4xl space-y-6">
      <div className="flex items-center justify-between page-header">
        <div>
          <h1 className="page-title">Habits</h1>
          <p className="page-subtitle">{child?.name ?? "—"} · {completedToday}/{ALL_HABITS.length} done today</p>
        </div>
        <motion.button onClick={() => setShowAddHabit(true)} className="btn-secondary gap-2"
          whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }}>
          <span>⚙️</span> Manage Habits
        </motion.button>
      </div>

      {/* 7-day calendar strip */}
      <div className="card p-4">
        <div className="flex gap-2 justify-between">
          {last7.map((d, i) => {
            const dayCompleted = ALL_HABITS.filter((h) => getHabitForDate(h, d.date)?.completed).length;
            const rate = dayCompleted / ALL_HABITS.length;
            const selected = selectedDate === d.date;
            return (
              <motion.button
                key={d.date}
                onClick={() => setSelectedDate(d.date)}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.04 }}
                whileHover={{ y: -2 }}
                whileTap={{ scale: 0.95 }}
                className="flex-1 flex flex-col items-center gap-1.5 py-3 rounded-xl transition-colors"
                style={{
                  background: selected ? "var(--brand-500)" : "transparent",
                  color: selected ? "#fff" : "var(--ink-muted)",
                }}
              >
                <span className="text-[10px] font-semibold uppercase">{d.label}</span>
                <span className="text-sm font-bold" style={{ color: d.isToday && !selected ? "var(--brand-500)" : undefined }}>{d.dayNum}</span>
                {dayCompleted > 0 && (
                  <div className="w-5 h-1.5 rounded-full overflow-hidden" style={{ background: selected ? "rgb(255 255 255 / 0.3)" : "var(--surface-border)" }}>
                    <motion.div className="h-full rounded-full"
                      style={{ background: rate >= 0.8 ? "#34D399" : rate >= 0.5 ? "#FBBF24" : "#FB923C" }}
                      initial={{ width: 0 }} animate={{ width: `${rate * 100}%` }} transition={{ delay: 0.3 + i * 0.05, duration: 0.5 }} />
                  </div>
                )}
              </motion.button>
            );
          })}
        </div>
      </div>

      {/* Progress */}
      <motion.div className="card p-5" animate={allDone ? { boxShadow: "0 0 0 2px #34D39960" } : {}}>
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm font-semibold" style={{ color: "var(--ink)" }}>
            {selectedDate === today ? "Today's Progress" : formatDate(selectedDate, "EEEE, MMM d")}
          </span>
          <motion.span className="font-bold" style={{ color: "var(--brand-500)" }} key={completionRate}
            initial={{ scale: 1.3 }} animate={{ scale: 1 }} transition={{ type: "spring", stiffness: 500 }}>
            {completionRate}%
          </motion.span>
        </div>
        <div className="progress-bar h-3">
          <motion.div className="progress-fill" style={{ background: allDone ? "linear-gradient(90deg, #10B981, #34D399)" : "linear-gradient(90deg, var(--brand-500), var(--brand-300))" }}
            animate={{ width: `${completionRate}%` }} transition={{ duration: 0.6, ease: [0.34, 1.56, 0.64, 1] }} />
        </div>
        <AnimatePresence mode="wait">
          <motion.p key={allDone ? "done" : "progress"} initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-xs mt-2" style={{ color: "var(--ink-muted)" }}>
            {allDone ? "🎉 All habits completed! Amazing consistency!" : `${ALL_HABITS.length - completedToday} habits remaining`}
          </motion.p>
        </AnimatePresence>
      </motion.div>

      {/* Habit list */}
      {loading ? (
        <div className="space-y-3">{Array.from({length:6}).map((_,i) => <div key={i} className="skeleton h-16 rounded-2xl" />)}</div>
      ) : (
        <motion.div variants={container} initial="hidden" animate="show" className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {ALL_HABITS.map((habitType) => {
            const habit = getHabitForDate(habitType, selectedDate);
            const streak = getStreak(habitType);
            const done = habit?.completed ?? false;
            const isLogging = logging === habitType;
            const target = HABIT_TARGETS[habitType];
            const hasFireStreak = (streak?.current_streak ?? 0) >= 3;

            return (
              <motion.button
                key={habitType}
                ref={(el) => { buttonRefs.current[habitType] = el; }}
                variants={item}
                onClick={() => toggleHabit(habitType)}
                disabled={isLogging}
                whileTap={{ scale: 0.97 }}
                className={`${done ? "habit-chip-done" : "habit-chip-todo"} w-full`}
              >
                <motion.div
                  className="w-10 h-10 rounded-xl flex items-center justify-center text-xl"
                  style={{ background: done ? "rgb(16 185 129 / 0.15)" : "var(--surface-subtle)" }}
                  animate={done ? { scale: [1, 1.2, 1] } : {}}
                  transition={{ duration: 0.4 }}
                >
                  {isLogging ? (
                    <motion.div animate={{ rotate: 360 }} transition={{ duration: 0.6, repeat: Infinity, ease: "linear" }}
                      className="w-5 h-5 border-2 rounded-full" style={{ borderColor: "var(--brand-500)", borderTopColor: "transparent" }} />
                  ) : getHabitIcon(habitType)}
                </motion.div>
                <div className="flex-1 min-w-0 text-left">
                  <div className="font-semibold text-sm">{getHabitLabel(habitType)}</div>
                  <div className="text-xs opacity-70">Target: {target.value} {target.label}</div>
                </div>
                <div className="text-right">
                  <AnimatePresence mode="wait">
                    {done ? (
                      <motion.div key="check" initial={{ scale: 0, rotate: -90 }} animate={{ scale: 1, rotate: 0 }} exit={{ scale: 0 }}
                        transition={{ type: "spring", stiffness: 500 }}
                        className="w-7 h-7 rounded-full bg-green-500 flex items-center justify-center text-white text-sm">✓</motion.div>
                    ) : (
                      <motion.div key="empty" exit={{ scale: 0 }} className="w-7 h-7 rounded-full border-2 border-current opacity-25" />
                    )}
                  </AnimatePresence>
                  {streak && streak.current_streak > 0 && (
                    <div className="text-[10px] font-bold mt-1 flex items-center gap-0.5 justify-end" style={{ color: "#F97316" }}>
                      <span className={hasFireStreak ? "streak-fire" : ""}>🔥</span> {streak.current_streak}
                    </div>
                  )}
                </div>
              </motion.button>
            );
          })}
        </motion.div>
      )}

      {/* Streak leaderboard */}
      {streaks.filter((s) => s.current_streak > 0).length > 0 && (
        <motion.div className="card p-6" initial={{ opacity: 0, y: 12 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}>
          <h2 className="font-semibold text-sm mb-4" style={{ color: "var(--ink)" }}>🔥 Active Streaks</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {streaks.filter((s) => s.current_streak > 0).sort((a, b) => b.current_streak - a.current_streak).map((s, i) => (
              <motion.div key={s.id} initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: i * 0.05 }}
                className="rounded-xl p-3 text-center" style={{ background: "#FFFBEB", border: "1px solid #FDE68A" }}>
                <div className={`text-2xl mb-1 ${s.current_streak >= 3 ? "streak-fire" : ""}`}>{getHabitIcon(s.habit_type as HabitType)}</div>
                <div className="text-xl font-bold" style={{ color: "#D97706" }}>{s.current_streak}</div>
                <div className="text-xs font-medium" style={{ color: "#B45309" }}>{getHabitLabel(s.habit_type as HabitType)}</div>
                <div className="text-[10px] mt-0.5" style={{ color: "#F59E0B" }}>best: {s.longest_streak} days</div>
              </motion.div>
            ))}
          </div>
        </motion.div>
      )}

      <AnimatePresence>
        {showAddHabit && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4"
            style={{ background: "rgb(0 0 0 / 0.4)", backdropFilter: "blur(4px)" }}
            onClick={(e) => e.target === e.currentTarget && setShowAddHabit(false)}>
            <motion.div initial={{ y: "100%" }} animate={{ y: 0 }} exit={{ y: "100%" }}
              transition={{ type: "spring", stiffness: 400, damping: 35 }}
              className="card p-6 w-full sm:max-w-sm rounded-t-3xl sm:rounded-3xl">
              <div className="bottom-sheet-handle sm:hidden" />
              <div className="flex items-center justify-between mb-4 mt-2 sm:mt-0">
                <h2 className="font-bold" style={{ color: "var(--ink)" }}>Habit Settings</h2>
                <button onClick={() => setShowAddHabit(false)} className="btn-ghost p-1.5">✕</button>
              </div>
              <p className="text-sm mb-4" style={{ color: "var(--ink-muted)" }}>
                All {ALL_HABITS.length} habits are active. Custom targets coming in Phase 2!
              </p>
              <div className="space-y-2">
                {ALL_HABITS.map((h) => (
                  <div key={h} className="flex items-center gap-3 p-2.5 rounded-xl" style={{ background: "var(--surface-subtle)" }}>
                    <span>{getHabitIcon(h)}</span>
                    <span className="text-sm flex-1" style={{ color: "var(--ink)" }}>{getHabitLabel(h)}</span>
                    <span className="text-xs" style={{ color: "var(--ink-subtle)" }}>{HABIT_TARGETS[h].value} {HABIT_TARGETS[h].unit}</span>
                  </div>
                ))}
              </div>
              <button onClick={() => setShowAddHabit(false)} className="btn-primary w-full mt-4">Done</button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
