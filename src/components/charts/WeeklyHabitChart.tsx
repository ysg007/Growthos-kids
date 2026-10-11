"use client";

import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from "recharts";
import { format, subDays, parseISO, startOfDay } from "date-fns";
import type { Habit } from "@/types/database";

interface Props { habits: Habit[] }

export default function WeeklyHabitChart({ habits }: Props) {
  // Build 7-day data
  const days = Array.from({ length: 7 }, (_, i) => {
    const date = subDays(new Date(), 6 - i);
    const dateStr = format(date, "yyyy-MM-dd");
    const dayHabits = habits.filter((h) => h.logged_date === dateStr);
    const completed = dayHabits.filter((h) => h.completed).length;
    const total = dayHabits.length;
    return {
      day: format(date, "EEE"),
      date: dateStr,
      completed,
      total,
      rate: total > 0 ? Math.round((completed / total) * 100) : 0,
      isToday: startOfDay(date).getTime() === startOfDay(new Date()).getTime(),
    };
  });

  if (habits.length === 0) {
    return (
      <div className="h-40 flex flex-col items-center justify-center gap-2 text-center">
        <span className="text-3xl">⚡</span>
        <p className="text-sm text-ink-muted">No habits tracked yet this week</p>
        <a href="/parent/habits" className="text-xs text-brand-500 hover:underline">Set up habits →</a>
      </div>
    );
  }

  return (
    <ResponsiveContainer width="100%" height={160}>
      <BarChart data={days} barSize={28} margin={{ top: 4, right: 4, left: -20, bottom: 0 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="#E8E5FF" vertical={false} />
        <XAxis
          dataKey="day"
          tick={{ fontSize: 11, fill: "#9CA3AF" }}
          axisLine={false} tickLine={false}
        />
        <YAxis domain={[0, 100]} tick={{ fontSize: 11, fill: "#9CA3AF" }} axisLine={false} tickLine={false} unit="%" />
        <Tooltip
          cursor={{ fill: "#F1EFFF" }}
          content={({ active, payload }) => {
            if (!active || !payload?.length) return null;
            const d = payload[0].payload;
            return (
              <div className="bg-white border border-surface-border rounded-xl px-3 py-2 text-xs shadow-card">
                <div className="font-semibold text-ink">{d.day}</div>
                <div className="text-ink-muted">{d.completed}/{d.total} habits · {d.rate}%</div>
              </div>
            );
          }}
        />
        <Bar dataKey="rate" radius={[6, 6, 0, 0]}>
          {days.map((d) => (
            <Cell
              key={d.date}
              fill={d.rate >= 80 ? "#10B981" : d.rate >= 50 ? "#F59E0B" : d.rate > 0 ? "#EF4444" : "#E8E5FF"}
              opacity={d.isToday ? 1 : 0.75}
            />
          ))}
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  );
}
