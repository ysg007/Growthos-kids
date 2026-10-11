import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { z } from "zod";

const LogHabitSchema = z.object({
  child_id: z.string().uuid(),
  habit_type: z.enum(["reading","homework","exercise","sleep","meditation","screen_time","water","journaling"]),
  completed: z.boolean().default(true),
  value: z.number().optional(),
  unit: z.string().optional(),
  target_value: z.number().optional(),
  logged_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
  notes: z.string().optional(),
});

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { searchParams } = new URL(request.url);
    const childId = searchParams.get("child_id");
    const days = parseInt(searchParams.get("days") ?? "7");
    const fromDate = new Date(Date.now() - days * 86400000).toISOString().split("T")[0];

    if (!childId) return NextResponse.json({ error: "child_id required" }, { status: 400 });

    const [{ data: habits }, { data: streaks }] = await Promise.all([
      supabase.from("habits").select("*").eq("child_id", childId).gte("logged_date", fromDate).order("logged_date", { ascending: false }),
      supabase.from("habit_streaks").select("*").eq("child_id", childId),
    ]);

    return NextResponse.json({ habits: habits ?? [], streaks: streaks ?? [] });
  } catch {
    return NextResponse.json({ error: "Failed to fetch habits" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const body = await request.json();
    const validated = LogHabitSchema.parse(body);

    const { data, error } = await supabase
      .from("habits")
      .upsert(
        { ...validated, logged_date: validated.logged_date ?? new Date().toISOString().split("T")[0] },
        { onConflict: "child_id,habit_type,logged_date" }
      )
      .select()
      .single();

    if (error) throw error;

    // Trigger growth score update
    supabase.rpc("compute_child_growth_score", { p_child_id: validated.child_id }).then(() => {});

    return NextResponse.json({ data }, { status: 201 });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: "Validation failed", details: error.errors }, { status: 400 });
    }
    return NextResponse.json({ error: "Failed to log habit" }, { status: 500 });
  }
}
