"use client";

import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ReferenceLine } from "recharts";
import { format, parseISO } from "date-fns";
import type { AcademicRecord } from "@/types/database";

interface Props { records: AcademicRecord[] }

export default function AcademicTrendChart({ records }: Props) {
  const sorted = [...records]
    .filter((r) => r.percentage !== null)
    .sort((a, b) => new Date(a.recorded_at).getTime() - new Date(b.recorded_at).getTime())
    .slice(-12)
    .map((r) => ({
      label: format(parseISO(r.recorded_at), "MMM d"),
      score: r.percentage ?? 0,
      title: r.title,
      subject: (r as AcademicRecord & { subjects?: { name: string } }).subjects?.name ?? "—",
    }));

  if (sorted.length === 0) {
    return (
      <div className="h-40 flex flex-col items-center justify-center gap-2 text-center">
        <span className="text-3xl">📚</span>
        <p className="text-sm text-ink-muted">No academic records yet</p>
        <a href="/parent/academics" className="text-xs text-brand-500 hover:underline">Add first record →</a>
      </div>
    );
  }

  return (
    <ResponsiveContainer width="100%" height={160}>
      <LineChart data={sorted} margin={{ top: 4, right: 4, left: -20, bottom: 0 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="#E8E5FF" vertical={false} />
        <XAxis dataKey="label" tick={{ fontSize: 11, fill: "#9CA3AF" }} axisLine={false} tickLine={false} />
        <YAxis domain={[0, 100]} tick={{ fontSize: 11, fill: "#9CA3AF" }} axisLine={false} tickLine={false} unit="%" />
        <ReferenceLine y={60} stroke="#E8E5FF" strokeDasharray="4 4" />
        <Tooltip
          content={({ active, payload }) => {
            if (!active || !payload?.length) return null;
            const d = payload[0].payload;
            return (
              <div className="bg-white border border-surface-border rounded-xl px-3 py-2 text-xs shadow-card max-w-[160px]">
                <div className="font-semibold text-ink truncate">{d.title}</div>
                <div className="text-ink-muted">{d.subject} · {d.label}</div>
                <div className="text-brand-500 font-bold mt-1">{d.score.toFixed(1)}%</div>
              </div>
            );
          }}
        />
        <Line
          type="monotone" dataKey="score" stroke="#6E51FF" strokeWidth={2.5}
          dot={{ fill: "#6E51FF", r: 4, strokeWidth: 0 }}
          activeDot={{ r: 6, fill: "#6E51FF" }}
        />
      </LineChart>
    </ResponsiveContainer>
  );
}
