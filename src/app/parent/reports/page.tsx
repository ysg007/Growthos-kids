"use client";

import { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useChildrenStore } from "@/stores";
import { formatDate } from "@/lib/utils";
import toast from "react-hot-toast";
import type { AIReport } from "@/types/database";

const REPORT_TYPES = [
  { id: "weekly",    label: "Weekly",    icon: "📅", desc: "7-day summary with habits, academics & highlights" },
  { id: "monthly",  label: "Monthly",   icon: "📊", desc: "Full monthly analysis with trends & recommendations" },
  { id: "quarterly",label: "Quarterly", icon: "📈", desc: "Deep quarterly insights and growth trajectory" },
];

export default function ReportsPage() {
  const { getActiveChild } = useChildrenStore();
  const child = getActiveChild();
  const [reports, setReports] = useState<AIReport[]>([]);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [selectedReport, setSelectedReport] = useState<AIReport | null>(null);

  const load = useCallback(async () => {
    if (!child) return;
    setLoading(true);
    try {
      const res = await fetch(`/api/ai/reports?child_id=${child.id}`);
      const { data } = await res.json();
      setReports(data ?? []);
    } catch { toast.error("Failed to load reports"); }
    finally { setLoading(false); }
  }, [child]);

  useEffect(() => { load(); }, [load]);

  async function generateReport(type: string) {
    if (!child || generating) return;
    setGenerating(true);
    try {
      const res = await fetch("/api/ai/reports", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ child_id: child.id, report_type: type }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      toast.success(`${type.charAt(0).toUpperCase() + type.slice(1)} report generated!`);
      setSelectedReport(data.data);
      load();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Failed to generate report";
      toast.error(msg);
    } finally { setGenerating(false); }
  }

  return (
    <div className="max-w-5xl space-y-6">
      <div className="page-header">
        <h1 className="page-title">Reports</h1>
        <p className="page-subtitle">{child?.name} · AI-powered growth reports</p>
      </div>

      {/* Generate report cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {REPORT_TYPES.map((rt) => (
          <div key={rt.id} className="card p-5 flex flex-col gap-3">
            <div className="flex items-center gap-3">
              <span className="text-2xl">{rt.icon}</span>
              <div>
                <div className="font-semibold text-ink">{rt.label} Report</div>
                <div className="text-xs text-ink-muted">{rt.desc}</div>
              </div>
            </div>
            <button
              onClick={() => generateReport(rt.id)}
              disabled={generating}
              className="btn-primary text-sm py-2 mt-auto"
            >
              {generating ? "Generating… ✨" : `Generate ${rt.label} Report`}
            </button>
          </div>
        ))}
      </div>

      {/* Previous reports */}
      <div className="card overflow-hidden">
        <div className="px-5 py-4 border-b border-surface-border">
          <h2 className="font-semibold text-sm text-ink">Previous Reports</h2>
        </div>
        {loading ? (
          <div className="p-6 space-y-3">{Array.from({length:3}).map((_,i) => <div key={i} className="skeleton h-14 rounded-xl" />)}</div>
        ) : reports.length === 0 ? (
          <div className="p-12 text-center">
            <div className="text-4xl mb-3">📊</div>
            <p className="font-medium text-ink mb-1">No reports yet</p>
            <p className="text-sm text-ink-muted">Generate your first report above to get started</p>
          </div>
        ) : (
          <div className="divide-y divide-surface-border">
            {reports.map((r) => (
              <button key={r.id} onClick={() => setSelectedReport(r)}
                className="w-full flex items-center gap-4 px-5 py-4 hover:bg-surface-muted transition-colors text-left">
                <div className="w-10 h-10 rounded-xl bg-brand-50 flex items-center justify-center text-xl">
                  {REPORT_TYPES.find((t) => t.id === r.report_type)?.icon ?? "📊"}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="font-medium text-sm text-ink capitalize">{r.report_type} Report</div>
                  <div className="text-xs text-ink-muted">
                    {formatDate(r.period_start)} — {formatDate(r.period_end)}
                  </div>
                </div>
                <div className="text-xs text-ink-subtle">{formatDate(r.generated_at, "MMM d, h:mm a")}</div>
                <svg className="w-4 h-4 text-ink-subtle" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Report viewer modal */}
      <AnimatePresence>
        {selectedReport && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4 bg-black/40 backdrop-blur-sm"
            onClick={(e) => e.target === e.currentTarget && setSelectedReport(null)}
          >
            <motion.div initial={{ y: 40, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: 40, opacity: 0 }}
              className="card p-6 w-full max-w-2xl max-h-[80vh] overflow-y-auto shadow-card-lg">
              <div className="flex items-center justify-between mb-5">
                <div>
                  <h2 className="font-bold text-ink capitalize">{selectedReport.report_type} Growth Report</h2>
                  <p className="text-xs text-ink-muted mt-0.5">
                    {formatDate(selectedReport.period_start)} — {formatDate(selectedReport.period_end)}
                  </p>
                </div>
                <div className="flex gap-2">
                  <a href={`/r/${selectedReport.shared_token}`} target="_blank"
                    className="btn-secondary text-xs py-1.5 px-3 gap-1.5">
                    <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" />
                    </svg>
                    Share
                  </a>
                  <button onClick={() => setSelectedReport(null)} className="btn-ghost p-1.5">✕</button>
                </div>
              </div>

              {selectedReport.summary && (
                <div className="bg-brand-50 border border-brand-100 rounded-xl p-4 mb-4">
                  <p className="text-sm text-ink leading-relaxed">{selectedReport.summary}</p>
                </div>
              )}

              {(selectedReport.recommendations as string[])?.length > 0 && (
                <div className="space-y-2">
                  <h3 className="font-semibold text-sm text-ink">AI Recommendations</h3>
                  {(selectedReport.recommendations as string[]).map((rec, i) => (
                    <div key={i} className="flex items-start gap-2.5 text-sm text-ink-muted">
                      <span className="text-brand-500 mt-0.5 shrink-0">→</span>
                      <span>{rec}</span>
                    </div>
                  ))}
                </div>
              )}

              {selectedReport.data && typeof selectedReport.data === "object" && Object.keys(selectedReport.data).length > 0 && (
                <div className="mt-4 space-y-2">
                  <h3 className="font-semibold text-sm text-ink">Detailed Data</h3>
                  <pre className="text-xs bg-surface-subtle rounded-xl p-4 overflow-x-auto text-ink-muted">
                    {JSON.stringify(selectedReport.data, null, 2)}
                  </pre>
                </div>
              )}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
