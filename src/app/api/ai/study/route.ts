import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { aiGatewayStream } from "@/lib/ai/gateway";

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const body = await request.json();
    const { childId, message, history = [], subject, grade } = body;

    if (!message) return NextResponse.json({ error: "Message required" }, { status: 400 });

    const systemPrompt = `You are a patient, encouraging AI study assistant for GrowthOS Kids.
${grade ? `The child is in ${grade}.` : ""}
${subject ? `Current subject: ${subject}.` : ""}

STRICT RULES:
1. NEVER give direct answers to homework or exam questions
2. ALWAYS guide the student to discover the answer themselves
3. Use the Socratic method: ask guiding questions
4. Break problems into small, manageable steps
5. Celebrate correct reasoning, not just correct answers
6. Use simple, age-appropriate language
7. Include emojis to make learning fun 🎯
8. If the student is stuck, provide a hint, not the answer
9. Always end with an encouraging message or follow-up question

Teaching approach:
- "What do you already know about this?"
- "Let's break this into smaller steps..."
- "Great thinking! Now, what do you think happens next?"
- "You're so close! Try thinking about it this way..."`;

    const messages = [
      ...history.map((h: { role: string; content: string }) => ({
        role: h.role as "user" | "assistant",
        content: h.content,
      })),
      { role: "user" as const, content: message },
    ];

    const stream = await aiGatewayStream({
      messages,
      systemPrompt,
      sessionType: "study_assistant",
      childId: childId ?? undefined,
      parentId: user.id,
      maxTokens: 1500,
    });

    return new Response(stream, {
      headers: {
        "Content-Type": "text/event-stream",
        "Cache-Control": "no-cache",
        Connection: "keep-alive",
      },
    });
  } catch (error) {
    console.error("[Study Assistant]", error);
    return NextResponse.json({ error: "AI service unavailable" }, { status: 500 });
  }
}
