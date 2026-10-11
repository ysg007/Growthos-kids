import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { aiGateway } from "@/lib/ai/gateway";

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const body = await request.json();
    const { childId, message, history = [], type = "parent_coach" } = body;

    if (!message) return NextResponse.json({ error: "Message required" }, { status: 400 });

    // Fetch child context if provided
    let childContext = "";
    if (childId) {
      const { data: child } = await supabase.from("children").select("*").eq("id", childId).single();
      if (child) {
        const { data: recentAcademic } = await supabase
          .from("academic_records")
          .select("*, subjects(name)")
          .eq("child_id", childId)
          .order("recorded_at", { ascending: false })
          .limit(5);
        const { data: streaks } = await supabase
          .from("habit_streaks")
          .select("*")
          .eq("child_id", childId);

        const avgScore = recentAcademic?.length
          ? Math.round(recentAcademic.reduce((a, r) => a + (r.percentage ?? 0), 0) / recentAcademic.length)
          : null;

        childContext = `
Child Profile:
- Name: ${child.name}
- Grade: ${child.grade ?? "Unknown"}
- Age: approximately ${new Date().getFullYear() - new Date(child.date_of_birth).getFullYear()} years old
- Interests: ${(child.interests as string[]).join(", ") || "Not specified"}
- Favorite subjects: ${(child.favorite_subjects as string[]).join(", ") || "Not specified"}
${avgScore !== null ? `- Recent academic average: ${avgScore}%` : ""}
${streaks?.length ? `- Active habit streaks: ${streaks.map((s) => `${s.habit_type} (${s.current_streak} days)`).join(", ")}` : ""}
`;
      }
    }

    const systemPrompt = `You are an expert AI Parent Coach for GrowthOS Kids. You help parents understand and support their child's growth.

${childContext}

Your role:
- Provide evidence-based, practical parenting advice
- Give specific action plans, not vague suggestions
- Be warm, empathetic, and encouraging
- Focus on growth mindset and positive reinforcement
- Keep responses focused and actionable (2-4 paragraphs max)
- Never provide medical or psychological diagnoses
- Always frame challenges as opportunities for growth`;

    const messages = [
      ...history.map((h: { role: string; content: string }) => ({
        role: h.role as "user" | "assistant",
        content: h.content,
      })),
      { role: "user" as const, content: message },
    ];

    const result = await aiGateway({
      messages,
      systemPrompt,
      sessionType: type,
      parentId: user.id,
      childId: childId ?? undefined,
      maxTokens: 1024,
    });

    return NextResponse.json({ content: result.content, sessionId: result.sessionId });
  } catch (error) {
    console.error("[AI Coach]", error);
    return NextResponse.json({ error: "AI service unavailable" }, { status: 500 });
  }
}
