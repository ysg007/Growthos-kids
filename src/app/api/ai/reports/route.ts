import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { aiGateway } from "@/lib/ai/gateway";
import { subDays, subMonths, subQuarters, format } from "date-fns";

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    const childId = new URL(request.url).searchParams.get("child_id");
    if (!childId) return NextResponse.json({ error: "child_id required" }, { status: 400 });
    const { data, error } = await supabase
      .from("ai_reports").select("*").eq("child_id", childId)
      .order("generated_at", { ascending: false }).limit(20);
    if (error) throw error;
    return NextResponse.json({ data });
  } catch {
    return NextResponse.json({ error: "Failed to fetch reports" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const body = await request.json();
    const { child_id, report_type = "monthly" } = body;
    if (!child_id) return NextResponse.json({ error: "child_id required" }, { status: 400 });

    // Determine period
    const now = new Date();
    let periodStart: Date;
    if (report_type === "weekly") periodStart = subDays(now, 7);
    else if (report_type === "quarterly") periodStart = subQuarters(now, 1);
    else periodStart = subMonths(now, 1);

    const periodStartStr = format(periodStart, "yyyy-MM-dd");
    const periodEndStr = format(now, "yyyy-MM-dd");

    // Fetch all data for the period
    const [
      { data: child },
      { data: academicRecords },
      { data: habits },
      { data: streaks },
      { data: skills },
      { data: physical },
    ] = await Promise.all([
      supabase.from("children").select("*").eq("id", child_id).single(),
      supabase.from("academic_records").select("*, subjects(name)").eq("child_id", child_id).gte("recorded_at", periodStartStr).is("deleted_at", null),
      supabase.from("habits").select("*").eq("child_id", child_id).gte("logged_date", periodStartStr),
      supabase.from("habit_streaks").select("*").eq("child_id", child_id),
      supabase.from("skills").select("*").eq("child_id", child_id).gte("assessed_at", periodStartStr),
      supabase.from("physical_metrics").select("*").eq("child_id", child_id).gte("recorded_at", periodStartStr),
    ]);

    if (!child) return NextResponse.json({ error: "Child not found" }, { status: 404 });

    // Compute stats
    const avgAcademic = academicRecords?.length
      ? (academicRecords.reduce((a, r) => a + (r.percentage ?? 0), 0) / academicRecords.length).toFixed(1)
      : null;
    const habitCompletion = habits?.length
      ? ((habits.filter((h) => h.completed).length / habits.length) * 100).toFixed(0)
      : null;
    const maxStreak = Math.max(0, ...(streaks?.map((s) => s.current_streak) ?? []));

    const reportData = {
      period: `${periodStartStr} to ${periodEndStr}`,
      child_name: child.name,
      grade: child.grade,
      academic: {
        records_count: academicRecords?.length ?? 0,
        avg_score: avgAcademic,
        subjects_covered: [...new Set(academicRecords?.map((r) => (r as { subjects?: { name: string } }).subjects?.name).filter(Boolean))],
      },
      habits: {
        total_logged: habits?.length ?? 0,
        completed: habits?.filter((h) => h.completed).length ?? 0,
        completion_rate: habitCompletion,
        max_streak: maxStreak,
      },
      skills: {
        assessments: skills?.length ?? 0,
        avg_score: skills?.length ? (skills.reduce((a, s) => a + s.score, 0) / skills.length).toFixed(1) : null,
      },
      physical: {
        activities: physical?.filter((p) => p.metric_type === "activity").length ?? 0,
      },
    };

    // Generate AI summary
    const prompt = `Generate a ${report_type} growth report for ${child.name} (${child.grade ?? "student"}).

Data for the period ${periodStartStr} to ${periodEndStr}:
${JSON.stringify(reportData, null, 2)}

Write a warm, encouraging parent-friendly report with:
1. Opening summary (2 sentences about overall growth)
2. Key highlights (what went well)
3. Areas for attention (framed positively)
4. 3 specific, actionable recommendations for next ${report_type === "weekly" ? "week" : "month"}

Keep it under 300 words. Be specific, not generic.`;

    const aiResult = await aiGateway({
      messages: [{ role: "user", content: prompt }],
      systemPrompt: "You are a child development expert writing growth reports for parents. Be warm, specific, evidence-based, and encouraging. Never diagnose or make medical claims.",
      sessionType: "report_generation",
      parentId: user.id,
      childId: child_id,
      maxTokens: 1000,
    });

    // Extract recommendations from the response
    const recMatches = aiResult.content.match(/\d\.\s+([^\n]+)/g)?.slice(-3) ?? [];
    const recommendations = recMatches.map((r) => r.replace(/^\d\.\s+/, ""));

    // Save report
    const { data: savedReport, error: saveError } = await supabase
      .from("ai_reports")
      .insert({
        child_id,
        report_type,
        period_start: periodStartStr,
        period_end: periodEndStr,
        data: reportData,
        summary: aiResult.content,
        recommendations,
      })
      .select()
      .single();

    if (saveError) throw saveError;
    return NextResponse.json({ data: savedReport }, { status: 201 });
  } catch (error) {
    console.error("[Reports API]", error);
    return NextResponse.json({ error: "Failed to generate report" }, { status: 500 });
  }
}
