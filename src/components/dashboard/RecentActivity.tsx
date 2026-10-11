import { formatDate, getHabitIcon, getHabitLabel } from "@/lib/utils";
import type { AcademicRecord, Habit } from "@/types/database";

interface Props {
  records: AcademicRecord[];
  habits: Habit[];
}

type ActivityItem = {
  id: string;
  type: "academic" | "habit";
  label: string;
  sub: string;
  score?: number;
  emoji: string;
  date: string;
};

export default function RecentActivity({ records, habits }: Props) {
  const activities: ActivityItem[] = [
    ...records.slice(0, 5).map((r) => ({
      id: r.id,
      type: "academic" as const,
      label: r.title,
      sub: (r as AcademicRecord & { subjects?: { name: string } }).subjects?.name ?? "Academic",
      score: r.percentage ?? undefined,
      emoji: "📝",
      date: r.recorded_at,
    })),
    ...habits.filter((h) => h.completed).slice(0, 5).map((h) => ({
      id: h.id,
      type: "habit" as const,
      label: getHabitLabel(h.habit_type) + " completed",
      sub: "Habit",
      emoji: getHabitIcon(h.habit_type),
      date: h.logged_date,
    })),
  ].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()).slice(0, 8);

  return (
    <div className="card p-6">
      <h3 className="font-semibold text-sm text-ink mb-4">Recent Activity</h3>
      {activities.length === 0 ? (
        <div className="text-center py-8">
          <div className="text-3xl mb-2">📋</div>
          <p className="text-sm text-ink-muted">No activity yet. Start tracking!</p>
        </div>
      ) : (
        <div className="space-y-3">
          {activities.map((item) => (
            <div key={item.id} className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-surface-subtle flex items-center justify-center text-base shrink-0">
                {item.emoji}
              </div>
              <div className="flex-1 min-w-0">
                <div className="text-sm font-medium text-ink truncate">{item.label}</div>
                <div className="text-xs text-ink-muted">{item.sub} · {formatDate(item.date, "MMM d")}</div>
              </div>
              {item.score !== undefined && (
                <div className={`text-sm font-bold ${item.score >= 80 ? "text-green-500" : item.score >= 60 ? "text-amber-500" : "text-red-500"}`}>
                  {item.score.toFixed(0)}%
                </div>
              )}
              {item.type === "habit" && (
                <div className="text-green-500 text-sm">✓</div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
