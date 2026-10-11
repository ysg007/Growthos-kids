import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { z } from "zod";

const Schema = z.object({
  child_id: z.string().uuid(),
  metric_type: z.enum(["height","weight","bmi","activity"]),
  value: z.number().positive(),
  unit: z.string(),
  activity_type: z.string().optional(),
  duration_min: z.number().int().positive().optional(),
  notes: z.string().optional(),
  recorded_at: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
});

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    const childId = new URL(request.url).searchParams.get("child_id");
    if (!childId) return NextResponse.json({ error: "child_id required" }, { status: 400 });
    const { data, error } = await supabase.from("physical_metrics").select("*").eq("child_id", childId).order("recorded_at", { ascending: false });
    if (error) throw error;
    return NextResponse.json({ data });
  } catch {
    return NextResponse.json({ error: "Failed to fetch metrics" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    const body = await request.json();
    const validated = Schema.parse(body);
    const { data, error } = await supabase.from("physical_metrics").insert(validated).select().single();
    if (error) throw error;
    supabase.rpc("compute_child_growth_score", { p_child_id: validated.child_id }).then(() => {});
    return NextResponse.json({ data }, { status: 201 });
  } catch (error) {
    if (error instanceof z.ZodError) return NextResponse.json({ error: "Validation failed" }, { status: 400 });
    return NextResponse.json({ error: "Failed to save metric" }, { status: 500 });
  }
}
