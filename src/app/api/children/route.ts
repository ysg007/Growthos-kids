import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { z } from "zod";

const CreateChildSchema = z.object({
  name: z.string().min(1).max(100),
  date_of_birth: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  gender: z.enum(["male", "female", "other", "prefer_not_to_say"]).optional(),
  grade: z.string().optional(),
  school: z.string().optional(),
  interests: z.array(z.string()).default([]),
  hobbies: z.array(z.string()).default([]),
  favorite_subjects: z.array(z.string()).default([]),
  sports_interests: z.array(z.string()).default([]),
});

export async function GET() {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { data, error } = await supabase
      .from("children")
      .select("*")
      .eq("parent_id", user.id)
      .is("deleted_at", null)
      .order("created_at");

    if (error) throw error;
    return NextResponse.json({ data });
  } catch (error) {
    return NextResponse.json({ error: "Failed to fetch children" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const body = await request.json();
    const validated = CreateChildSchema.parse(body);

    const { data, error } = await supabase
      .from("children")
      .insert({ ...validated, parent_id: user.id })
      .select()
      .single();

    if (error) throw error;

    // Log audit
    await supabase.from("audit_logs").insert({
      user_id: user.id,
      action: "child.created",
      table_name: "children",
      record_id: data.id,
      new_data: data,
    });

    return NextResponse.json({ data }, { status: 201 });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: "Validation failed", details: error.errors }, { status: 400 });
    }
    return NextResponse.json({ error: "Failed to create child" }, { status: 500 });
  }
}
