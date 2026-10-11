import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import GrowthScoreRing from "@/components/dashboard/GrowthScoreRing";
import ModuleCards from "@/components/dashboard/ModuleCards";
import RecentActivity from "@/components/dashboard/RecentActivity";
import WeeklyHabitChart from "@/components/charts/WeeklyHabitChart";
import AcademicTrendChart from "@/components/charts/AcademicTrendChart";
import AIInsightCard from "@/components/dashboard/AIInsightCard";
import StatCard from "@/components/dashboard/StatCard";
import { getAge } from "@/lib/utils";

export const metadata = { title: "Dashboard" };
export const dynamic = "force-dynamic";

export default async function ParentDashboard() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/auth/login");

  const { data: children } = await supabase
    .from("children").select("*").eq("parent_id", user.id).is("deleted_at", null).order("created_at");

  const childList = children ?? [];
  if (childList.length === 0) redirect("/auth/onboarding");

  const childIds = childList.map((c) => c.id);
  const [
    { data: academicRecords },
    { data: habitRecords },
    { data: habitStreakData },
    { data: badgeData },
  ] = await Promise.all([
    supabase.from("academic_records").select("*, subjects(name, icon, color)").in("child_id", childIds).is("deleted_at", null).order("recorded_at", { ascending: false }).limit(10),
    supabase.from("habits").select("*").in("child_id", childIds).gte("logged_date", new Date(Date.now() - 7 * 86400000).toISOString().split("T")[0]),
    supabase.from("habit_streaks").select("*").in("child_id", childIds),
    supabase.from("child_badges").select("*, badges(*)").in("child_id", childIds).order("earned_at", { ascending: false }).limit(6),
  ]);

  const childSummaries = childList.map((child) => {
    const childHabits7d = (habitRecords ?? []).filter((h) => h.child_id === child.id);
    const completedHabits = childHabits7d.filter((h) => h.completed).length;
    const totalHabits = childHabits7d.length;
    const habitRate = totalHabits > 0 ? Math.round((completedHabits / totalHabits) * 100) : 0;
    const childStreaks = (habitStreakData ?? []).filter((s) => s.child_id === child.id);
    const maxStreak = Math.max(0, ...childStreaks.map((s) => s.current_streak));
    const childAcademic = (academicRecords ?? []).filter((r) => r.child_id === child.id);
    const avgScore = childAcademic.length
      ? Math.round(childAcademic.reduce((a, r) => a + (r.percentage ?? 0), 0) / childAcademic.length)
      : 0;
    const earnedBadges = (badgeData ?? []).filter((b) => b.child_id === child.id);
    return { child, habitRate, maxStreak, avgScore, earnedBadges, childHabits7d, childAcademic };
  });

  const primaryChild = childSummaries[0];

  return (
    <div className="space-y-6 max-w-7xl">
      <div className="page-header">
        <h1 className="page-title">Dashboard</h1>
        <p className="page-subtitle">
          {childList.length === 1
            ? `Tracking ${primaryChild.child.name}'s growth journey`
            : `Tracking ${childList.length} children's growth journeys`}
        </p>
      </div>

      {childList.length > 1 && (
        <div className="flex gap-2 overflow-x-auto pb-1">
          {childSummaries.map(({ child }) => (
            <div key={child.id} className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium shrink-0"
              style={{ background: "var(--surface)", border: "0.5px solid var(--surface-border)", color: "var(--ink)" }}>
              <span className="w-6 h-6 rounded-full flex items-center justify-center text-white text-[10px] font-bold"
                style={{ background: "linear-gradient(135deg, #6E51FF, #A897FF)" }}>{child.name[0]}</span>
              {child.name}
              <span className="badge-brand">{Math.round(child.growth_score)}%</span>
            </div>
          ))}
        </div>
      )}

      {childSummaries.map(({ child, habitRate, maxStreak, avgScore, earnedBadges }) => (
        <div key={child.id} className="grid grid-cols-1 lg:grid-cols-4 gap-4">
          <div className="card p-6 flex flex-col items-center justify-center gap-4 lg:col-span-1 ambient-bg">
            <div className="relative z-10">
              <GrowthScoreRing score={child.growth_score} level={child.current_level} name={child.name} />
            </div>
            <div className="text-center relative z-10">
              <div className="text-sm font-semibold" style={{ color: "var(--ink)" }}>{child.name}</div>
              <div className="text-xs" style={{ color: "var(--ink-muted)" }}>{child.grade} · Age {getAge(child.date_of_birth)}</div>
            </div>
          </div>

          <div className="lg:col-span-3 grid grid-cols-2 md:grid-cols-4 gap-4">
            <StatCard icon="📚" value={avgScore} suffix="%" label="Academic Avg" sublabel="Last 30 days" delay={0} />
            <StatCard icon="⚡" value={habitRate} suffix="%" label="Habit Rate" sublabel="This week" delay={0.05} />
            <StatCard icon="🔥" value={maxStreak} label="Best Streak" sublabel="Days in a row" delay={0.1} />
            <StatCard icon="🏆" value={earnedBadges.length} label="Badges Earned" sublabel={`${child.total_points} total points`} delay={0.15} />
          </div>
        </div>
      ))}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div className="card p-6">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="font-semibold text-sm" style={{ color: "var(--ink)" }}>Academic Trend</h3>
              <p className="text-xs" style={{ color: "var(--ink-muted)" }}>Score % over recent assessments</p>
            </div>
          </div>
          <AcademicTrendChart records={academicRecords ?? []} />
        </div>
        <div className="card p-6">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="font-semibold text-sm" style={{ color: "var(--ink)" }}>Habit Completion</h3>
              <p className="text-xs" style={{ color: "var(--ink-muted)" }}>Last 7 days</p>
            </div>
          </div>
          <WeeklyHabitChart habits={habitRecords ?? []} />
        </div>
      </div>

      <div>
        <h2 className="text-base font-bold mb-3" style={{ color: "var(--ink)" }}>Growth Modules</h2>
        <ModuleCards childId={primaryChild?.child.id} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <AIInsightCard childId={primaryChild?.child.id} childName={primaryChild?.child.name} />
        <RecentActivity records={academicRecords ?? []} habits={habitRecords ?? []} />
      </div>
    </div>
  );
}
