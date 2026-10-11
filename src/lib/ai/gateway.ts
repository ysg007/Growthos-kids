/**
 * GrowthOS AI Gateway
 * ─────────────────────────────────────────────────────────────
 * Centralised AI call router. Never call AI providers directly.
 * All calls go through here so we get:
 *  • Provider switching
 *  • Cost tracking
 *  • Usage limits
 *  • Logging to Supabase
 *  • Rate limiting
 *  • Fallback handling
 */

import Anthropic from "@anthropic-ai/sdk";
import OpenAI from "openai";
import { createServiceClient } from "@/lib/supabase/server";
import type { AIProvider, AISessionType } from "@/types/database";

export interface GatewayMessage {
  role: "user" | "assistant" | "system";
  content: string;
}

export interface GatewayRequest {
  messages: GatewayMessage[];
  systemPrompt?: string;
  provider?: AIProvider;
  sessionType: AISessionType;
  childId?: string;
  parentId?: string;
  maxTokens?: number;
  temperature?: number;
  stream?: boolean;
}

export interface GatewayResponse {
  content: string;
  provider: AIProvider;
  model: string;
  promptTokens: number;
  completionTokens: number;
  totalTokens: number;
  costUsd: number;
  sessionId: string;
}

// Cost per 1M tokens in USD (input / output)
const PRICING: Record<string, { input: number; output: number }> = {
  "claude-sonnet-4-6":          { input: 3.00,  output: 15.00 },
  "claude-haiku-4-5-20251001":  { input: 0.25,  output: 1.25 },
  "gpt-4o":                     { input: 5.00,  output: 15.00 },
  "gpt-4o-mini":                { input: 0.15,  output: 0.60 },
  "gemini-2.0-flash":           { input: 0.10,  output: 0.40 },
};

function computeCost(model: string, promptTokens: number, completionTokens: number): number {
  const p = PRICING[model] ?? { input: 3.0, output: 15.0 };
  return ((promptTokens * p.input) + (completionTokens * p.output)) / 1_000_000;
}

// GrowthOS child-safety system prefix — always prepended
const SAFETY_PREFIX = `You are an AI assistant for GrowthOS Kids, a child growth tracking platform for children aged 5–18.
CRITICAL RULES:
- Never provide direct answers to homework or exam questions. Always guide, explain, and teach step by step.
- Never generate content that is inappropriate, violent, or harmful for children.
- Never make medical, psychological, or IQ diagnoses. Provide observations only.
- Always be encouraging, warm, and age-appropriate.
- Keep all responses focused on learning, growth, and development.
`;

async function callClaude(
  request: GatewayRequest,
  model = "claude-sonnet-4-6"
): Promise<{ content: string; promptTokens: number; completionTokens: number }> {
  const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
  const systemPrompt = SAFETY_PREFIX + (request.systemPrompt ?? "");

  const messages = request.messages
    .filter((m) => m.role !== "system")
    .map((m) => ({ role: m.role as "user" | "assistant", content: m.content }));

  const response = await client.messages.create({
    model,
    max_tokens: request.maxTokens ?? 1024,
    system: systemPrompt,
    messages,
  });

  const content = response.content
    .filter((b) => b.type === "text")
    .map((b) => (b as { type: "text"; text: string }).text)
    .join("");

  return {
    content,
    promptTokens: response.usage.input_tokens,
    completionTokens: response.usage.output_tokens,
  };
}

async function callOpenAI(
  request: GatewayRequest,
  model = "gpt-4o-mini"
): Promise<{ content: string; promptTokens: number; completionTokens: number }> {
  const client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
  const systemPrompt = SAFETY_PREFIX + (request.systemPrompt ?? "");

  const messages: OpenAI.Chat.ChatCompletionMessageParam[] = [
    { role: "system", content: systemPrompt },
    ...request.messages
      .filter((m) => m.role !== "system")
      .map((m) => ({ role: m.role as "user" | "assistant", content: m.content })),
  ];

  const response = await client.chat.completions.create({
    model,
    messages,
    max_tokens: request.maxTokens ?? 1024,
    temperature: request.temperature ?? 0.7,
  });

  return {
    content: response.choices[0]?.message?.content ?? "",
    promptTokens: response.usage?.prompt_tokens ?? 0,
    completionTokens: response.usage?.completion_tokens ?? 0,
  };
}

async function callGemini(
  request: GatewayRequest
): Promise<{ content: string; promptTokens: number; completionTokens: number }> {
  const { GoogleGenerativeAI } = await import("@google/generative-ai");
  const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!);
  const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash" });

  const systemPrompt = SAFETY_PREFIX + (request.systemPrompt ?? "");
  const lastMessage = request.messages[request.messages.length - 1];

  const history = request.messages
    .slice(0, -1)
    .filter((m) => m.role !== "system")
    .map((m) => ({
      role: m.role === "assistant" ? "model" : "user",
      parts: [{ text: m.content }],
    }));

  const chat = model.startChat({
    history,
    systemInstruction: systemPrompt,
  });

  const result = await chat.sendMessage(lastMessage.content);
  const response = await result.response;

  return {
    content: response.text(),
    promptTokens: response.usageMetadata?.promptTokenCount ?? 0,
    completionTokens: response.usageMetadata?.candidatesTokenCount ?? 0,
  };
}

export async function aiGateway(request: GatewayRequest): Promise<GatewayResponse> {
  const provider = request.provider ?? (process.env.AI_DEFAULT_PROVIDER as AIProvider) ?? "claude";

  let result: { content: string; promptTokens: number; completionTokens: number };
  let model: string;

  try {
    switch (provider) {
      case "openai":
        model = "gpt-4o-mini";
        result = await callOpenAI(request, model);
        break;
      case "gemini":
        model = "gemini-2.0-flash";
        result = await callGemini(request);
        break;
      case "claude":
      default:
        model = "claude-sonnet-4-6";
        result = await callClaude(request, model);
        break;
    }
  } catch (primaryError) {
    console.error(`[AI Gateway] Primary provider ${provider} failed:`, primaryError);
    // Fallback to Claude
    if (provider !== "claude") {
      console.info("[AI Gateway] Falling back to Claude");
      model = "claude-sonnet-4-6";
      result = await callClaude(request, model);
    } else {
      throw primaryError;
    }
  }

  const costUsd = computeCost(model, result.promptTokens, result.completionTokens);

  // Log to Supabase (non-blocking)
  let sessionId = crypto.randomUUID();
  try {
    const supabase = await createServiceClient();
    const { data } = await supabase
      .from("ai_sessions")
      .insert({
        child_id: request.childId ?? null,
        parent_id: request.parentId ?? null,
        session_type: request.sessionType,
        provider,
        model,
        prompt_tokens: result.promptTokens,
        completion_tokens: result.completionTokens,
        total_tokens: result.promptTokens + result.completionTokens,
        cost_usd: costUsd,
        messages: request.messages as unknown[],
        status: "completed",
      })
      .select("id")
      .single();
    if (data) sessionId = data.id;
  } catch (logError) {
    console.error("[AI Gateway] Failed to log session:", logError);
  }

  return {
    content: result.content,
    provider,
    model,
    promptTokens: result.promptTokens,
    completionTokens: result.completionTokens,
    totalTokens: result.promptTokens + result.completionTokens,
    costUsd,
    sessionId,
  };
}

// Streaming version for study assistant
export async function aiGatewayStream(request: GatewayRequest): Promise<ReadableStream> {
  const provider = request.provider ?? "claude";
  const systemPrompt = SAFETY_PREFIX + (request.systemPrompt ?? "");

  if (provider === "claude") {
    const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
    const messages = request.messages
      .filter((m) => m.role !== "system")
      .map((m) => ({ role: m.role as "user" | "assistant", content: m.content }));

    const stream = await client.messages.stream({
      model: "claude-sonnet-4-6",
      max_tokens: request.maxTokens ?? 2048,
      system: systemPrompt,
      messages,
    });

    return new ReadableStream({
      async start(controller) {
        const encoder = new TextEncoder();
        for await (const chunk of stream) {
          if (
            chunk.type === "content_block_delta" &&
            chunk.delta.type === "text_delta"
          ) {
            controller.enqueue(encoder.encode(`data: ${JSON.stringify({ text: chunk.delta.text })}\n\n`));
          }
        }
        controller.enqueue(encoder.encode("data: [DONE]\n\n"));
        controller.close();
      },
    });
  }

  // Fallback: non-streaming for other providers
  const result = await aiGateway(request);
  return new ReadableStream({
    start(controller) {
      const encoder = new TextEncoder();
      const words = result.content.split(" ");
      let i = 0;
      const interval = setInterval(() => {
        if (i < words.length) {
          controller.enqueue(encoder.encode(`data: ${JSON.stringify({ text: words[i] + " " })}\n\n`));
          i++;
        } else {
          controller.enqueue(encoder.encode("data: [DONE]\n\n"));
          controller.close();
          clearInterval(interval);
        }
      }, 20);
    },
  });
}
