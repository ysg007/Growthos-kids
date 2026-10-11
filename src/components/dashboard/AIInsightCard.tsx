"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";

interface Props {
  childId?: string;
  childName?: string;
}

export default function AIInsightCard({ childId, childName }: Props) {
  const [insight, setInsight] = useState<string>("");
  const [loading, setLoading] = useState(false);
  const [loaded, setLoaded] = useState(false);

  async function loadInsight() {
    if (!childId || loading) return;
    setLoading(true);
    try {
      const res = await fetch("/api/ai/coach", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          childId,
          type: "dashboard_insight",
          message: `Give a brief 2-3 sentence encouraging weekly insight for ${childName ?? "this child"}'s growth. Be warm, specific, and actionable. Focus on what's going well and one area to improve.`,
        }),
      });
      const data = await res.json();
      setInsight(data.content ?? "Keep up the great work! Consistency is key to long-term growth.");
      setLoaded(true);
    } catch {
      setInsight("Every day is a new opportunity to grow. Keep encouraging your child's curiosity and consistency!");
      setLoaded(true);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    if (childId && !loaded) loadInsight();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [childId]);

  return (
    <div className="card p-6 border-l-4 border-brand-500">
      <div className="flex items-start gap-3">
        <div className="w-10 h-10 rounded-xl bg-brand-50 flex items-center justify-center text-xl shrink-0">🤖</div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-2">
            <h3 className="font-semibold text-sm text-ink">AI Weekly Insight</h3>
            <span className="badge-brand text-[10px]">AI</span>
          </div>
          <AnimatePresence mode="wait">
            {loading ? (
              <motion.div key="loading" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-2">
                <div className="skeleton h-3 w-full rounded" />
                <div className="skeleton h-3 w-4/5 rounded" />
                <div className="skeleton h-3 w-3/5 rounded" />
              </motion.div>
            ) : loaded ? (
              <motion.p key="insight" initial={{ opacity: 0, y: 4 }} animate={{ opacity: 1, y: 0 }}
                className="text-sm text-ink-muted leading-relaxed">
                {insight}
              </motion.p>
            ) : (
              <motion.div key="cta" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                <p className="text-sm text-ink-muted mb-3">Get personalised insights powered by AI.</p>
                <button onClick={loadInsight} className="btn-secondary text-xs py-1.5 px-3">
                  Generate insight ✨
                </button>
              </motion.div>
            )}
          </AnimatePresence>
          {loaded && (
            <div className="mt-3 flex gap-2">
              <a href="/parent/ai-coach" className="text-xs text-brand-500 hover:underline font-medium">
                Ask AI Coach →
              </a>
              <button onClick={() => { setLoaded(false); setInsight(""); loadInsight(); }}
                className="text-xs text-ink-subtle hover:text-ink-muted">
                Refresh
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
