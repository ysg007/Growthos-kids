import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { z } from "zod";

const CreateSkillSchema = z.object({
  child_id: z.string().uuid(),
  skill_type: z.enum(["communication","creativity","leadership","teamwork","problem_solving","critical_thinking","emotional_intelligence","resilience"]),
  score: z.number().int().min(1).max(10),
  evidence: z.string().optional(),
  assessed_by: z.string().default("parent"),
});

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    const childId = new URL(request.url).searchParams.get("child_id");
    if (!childId) return NextResponse.json({ error: "child_id required" }, { status: 400 });
    const { data, error } = await supabase
      .from("skills").select("*").eq("child_id", childId)
      .order("assessed_at", { ascending: false });
    if (error) throw error;
    return NextResponse.json({ data });
  } catch {
    return NextResponse.json({ error: "Failed to fetch skills" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    const body = await request.json();
    const validated = CreateSkillSchema.parse(body);
    const { data, error } = await supabase.from("skills").insert(validated).select().single();
    if (error) throw error;
    supabase.rpc("compute_child_growth_score", { p_child_id: validated.child_id }).then(() => {});
    return NextResponse.json({ data }, { status: 201 });
  } catch (error) {
    if (error instanceof z.ZodError) return NextResponse.json({ error: "Validation failed" }, { status: 400 });
    return NextResponse.json({ error: "Failed to save skill" }, { status: 500 });
  }
}
