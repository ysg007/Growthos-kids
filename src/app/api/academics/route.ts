import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { z } from "zod";

const CreateRecordSchema = z.object({
  child_id: z.string().uuid(),
  subject_id: z.string().uuid().optional(),
  record_type: z.enum(["homework", "assignment", "quiz", "exam", "test", "project"]),
  title: z.string().min(1).max(200),
  score: z.number().min(0).optional(),
  max_score: z.number().min(0).optional(),
  grade_label: z.string().optional(),
  study_minutes: z.number().int().min(0).default(0),
  notes: z.string().optional(),
  recorded_at: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
});

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { searchParams } = new URL(request.url);
    const childId = searchParams.get("child_id");
    const subjectId = searchParams.get("subject_id");
    const limit = parseInt(searchParams.get("limit") ?? "50");

    // Verify child belongs to user
    if (childId) {
      const { data: child } = await supabase
        .from("children")
        .select("id")
        .eq("id", childId)
        .eq("parent_id", user.id)
        .single();
      if (!child) return NextResponse.json({ error: "Child not found" }, { status: 404 });
    }

    let query = supabase
      .from("academic_records")
      .select("*, subjects(id, name, icon, color)")
      .is("deleted_at", null)
      .order("recorded_at", { ascending: false })
      .limit(limit);

    if (childId) query = query.eq("child_id", childId);
    if (subjectId) query = query.eq("subject_id", subjectId);

    const { data, error } = await query;
    if (error) throw error;
    return NextResponse.json({ data });
  } catch {
    return NextResponse.json({ error: "Failed to fetch records" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const body = await request.json();
    const validated = CreateRecordSchema.parse(body);

    // Verify child ownership via RLS (Supabase owns_child check)
    const { data, error } = await supabase
      .from("academic_records")
      .insert(validated)
      .select("*, subjects(id, name, icon, color)")
      .single();

    if (error) throw error;

    // Recompute growth score async
    supabase.rpc("compute_child_growth_score", { p_child_id: validated.child_id }).then(() => {});

    return NextResponse.json({ data }, { status: 201 });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: "Validation failed", details: error.errors }, { status: 400 });
    }
    return NextResponse.json({ error: "Failed to create record" }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");
    if (!id) return NextResponse.json({ error: "ID required" }, { status: 400 });

    // Soft delete
    const { error } = await supabase
      .from("academic_records")
      .update({ deleted_at: new Date().toISOString() })
      .eq("id", id);

    if (error) throw error;
    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ error: "Failed to delete record" }, { status: 500 });
  }
}
