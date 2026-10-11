"use client";

import { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useChildrenStore } from "@/stores";
import toast from "react-hot-toast";

interface Message { role: "user" | "assistant"; content: string; id: string; }

const STARTER_QUESTIONS = [
  "How can I improve my child's focus and concentration?",
  "My child is struggling with math. What can I do at home?",
  "How do I build a consistent reading habit?",
  "My child seems stressed about exams. How do I help?",
  "How do I encourage my child without putting pressure?",
  "What's the best screen time routine for a 10-year-old?",
];

export default function AICoachPage() {
  const { getActiveChild } = useChildrenStore();
  const activeChild = getActiveChild();
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  async function sendMessage(text: string) {
    const userMessage = text.trim();
    if (!userMessage || loading) return;
    setInput("");

    const newMessages: Message[] = [
      ...messages,
      { role: "user", content: userMessage, id: crypto.randomUUID() },
    ];
    setMessages(newMessages);
    setLoading(true);

    try {
      const res = await fetch("/api/ai/coach", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          childId: activeChild?.id,
          message: userMessage,
          history: messages.map((m) => ({ role: m.role, content: m.content })),
          type: "parent_coach",
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setMessages([...newMessages, { role: "assistant", content: data.content, id: crypto.randomUUID() }]);
    } catch {
      toast.error("AI coach unavailable. Please try again.");
      setMessages(newMessages.slice(0, -1));
    } finally {
      setLoading(false);
      inputRef.current?.focus();
    }
  }

  return (
    <div className="max-w-3xl mx-auto h-full flex flex-col gap-4">
      {/* Header */}
      <div className="page-header">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-brand-gradient flex items-center justify-center text-xl">🤖</div>
          <div>
            <h1 className="page-title">AI Parent Coach</h1>
            <p className="page-subtitle">
              {activeChild
                ? `Personalised advice for ${activeChild.name}`
                : "Ask me anything about your child's growth"}
            </p>
          </div>
        </div>
      </div>

      {/* Chat window */}
      <div className="card flex-1 flex flex-col min-h-[500px] overflow-hidden">
        <div className="flex-1 overflow-y-auto p-6 space-y-4">
          {/* Welcome */}
          {messages.length === 0 && (
            <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="space-y-4">
              <div className="chat-ai">
                <p className="font-medium mb-1">Hello! I&apos;m your AI Parent Coach 👋</p>
                <p className="text-ink-muted text-xs leading-relaxed">
                  I&apos;m here to help you support {activeChild?.name ?? "your child"}&apos;s growth with evidence-based, personalised guidance.
                  What would you like to explore today?
                </p>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {STARTER_QUESTIONS.map((q) => (
                  <button
                    key={q}
                    onClick={() => sendMessage(q)}
                    className="text-left p-3 rounded-xl border border-surface-border bg-surface-subtle hover:bg-brand-50 hover:border-brand-200 text-xs text-ink-muted hover:text-brand-600 transition-all"
                  >
                    {q}
                  </button>
                ))}
              </div>
            </motion.div>
          )}

          {/* Messages */}
          <AnimatePresence initial={false}>
            {messages.map((msg) => (
              <motion.div
                key={msg.id}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                className={msg.role === "user" ? "flex justify-end" : "flex justify-start"}
              >
                {msg.role === "assistant" && (
                  <div className="w-7 h-7 rounded-full bg-brand-50 flex items-center justify-center text-sm mr-2 mt-1 shrink-0">🤖</div>
                )}
                <div className={msg.role === "user" ? "chat-user" : "chat-ai"}>
                  {msg.content.split("\n").map((line, i) => (
                    <span key={i}>{line}{i < msg.content.split("\n").length - 1 && <br />}</span>
                  ))}
                </div>
              </motion.div>
            ))}
          </AnimatePresence>

          {/* Loading */}
          {loading && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-full bg-brand-50 flex items-center justify-center text-sm shrink-0">🤖</div>
              <div className="chat-ai flex items-center gap-1 py-4 px-5">
                {[0, 1, 2].map((i) => (
                  <motion.div key={i} className="w-2 h-2 rounded-full bg-ink-subtle"
                    animate={{ scale: [1, 1.4, 1], opacity: [0.5, 1, 0.5] }}
                    transition={{ duration: 1, repeat: Infinity, delay: i * 0.2 }} />
                ))}
              </div>
            </motion.div>
          )}
          <div ref={bottomRef} />
        </div>

        {/* Input */}
        <div className="p-4 border-t border-surface-border">
          <form
            onSubmit={(e) => { e.preventDefault(); sendMessage(input); }}
            className="flex gap-2"
          >
            <input
              ref={inputRef}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Ask anything about your child's growth…"
              className="input-base flex-1"
              disabled={loading}
            />
            <button
              type="submit"
              disabled={loading || !input.trim()}
              className="btn-primary px-4 py-2.5 shrink-0"
            >
              <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
              </svg>
            </button>
          </form>
          <p className="text-[10px] text-ink-subtle mt-2 text-center">
            AI responses are educational guidance only, not professional medical or psychological advice.
          </p>
        </div>
      </div>
    </div>
  );
}
