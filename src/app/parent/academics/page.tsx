"use client";

import { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useChildrenStore } from "@/stores";
import { formatDate, getScoreColor } from "@/lib/utils";
import toast from "react-hot-toast";
import type { AcademicRecord, Subject } from "@/types/database";

const RECORD_TYPES = ["homework","assignment","quiz","exam","test","project"] as const;
const TYPE_EMOJI: Record<string, string> = {
  homework:"✏️", assignment:"📋", quiz:"❓", exam:"📝", test:"📝", project:"🔬"
};

export default function AcademicsPage() {
  const { getActiveChild } = useChildrenStore();
  const child = getActiveChild();

  const [records, setRecords] = useState<AcademicRecord[]>([]);
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [filter, setFilter] = useState<string>("all");
  const [form, setForm] = useState({
    title: "", subject_id: "", record_type: "homework" as typeof RECORD_TYPES[number],
    score: "", max_score: "", study_minutes: "", notes: "",
    recorded_at: new Date().toISOString().split("T")[0],
  });
  const [saving, setSaving] = useState(false);

  const load = useCallback(async () => {
    if (!child) return;
    setLoading(true);
    try {
      const [rRes, sRes] = await Promise.all([
        fetch(`/api/academics?child_id=${child.id}&limit=50`),
        fetch("/api/subjects"),
      ]);
      const { data: rData } = await rRes.json();
      const { data: sData } = await sRes.json();
      setRecords(rData ?? []);
      setSubjects(sData ?? []);
    } catch { toast.error("Failed to load records"); }
    finally { setLoading(false); }
  }, [child]);

  useEffect(() => { load(); }, [load]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!child || !form.title) return;
    setSaving(true);
    try {
      const res = await fetch("/api/academics", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          child_id: child.id,
          title: form.title,
          subject_id: form.subject_id || undefined,
          record_type: form.record_type,
          score: form.score ? parseFloat(form.score) : undefined,
          max_score: form.max_score ? parseFloat(form.max_score) : undefined,
          study_minutes: parseInt(form.study_minutes) || 0,
          notes: form.notes || undefined,
          recorded_at: form.recorded_at,
        }),
      });
      if (!res.ok) throw new Error();
      toast.success("Record added!");
      setShowForm(false);
      setForm({ title:"", subject_id:"", record_type:"homework", score:"", max_score:"", study_minutes:"", notes:"", recorded_at: new Date().toISOString().split("T")[0] });
      load();
    } catch { toast.error("Failed to save record"); }
    finally { setSaving(false); }
  }

  async function handleDelete(id: string) {
    if (!confirm("Delete this record?")) return;
    await fetch(`/api/academics?id=${id}`, { method: "DELETE" });
    setRecords((r) => r.filter((x) => x.id !== id));
    toast.success("Deleted");
  }

  const filtered = filter === "all" ? records : records.filter((r) => r.record_type === filter);
  const avgScore = records.filter((r) => r.percentage !== null).reduce((a, r, _, arr) => a + (r.percentage ?? 0) / arr.length, 0);
  const subjectMap = Object.fromEntries(subjects.map((s) => [s.id, s]));

  // Stats by subject
  const subjectStats = subjects.map((s) => {
    const subRecs = records.filter((r) => r.subject_id === s.id && r.percentage !== null);
    const avg = subRecs.length ? subRecs.reduce((a, r) => a + (r.percentage ?? 0), 0) / subRecs.length : null;
    return { ...s, avg, count: subRecs.length };
  }).filter((s) => s.count > 0).sort((a, b) => (b.avg ?? 0) - (a.avg ?? 0));

  return (
    <div className="max-w-5xl space-y-6">
      <div className="flex items-center justify-between page-header">
        <div>
          <h1 className="page-title">Academics</h1>
          <p className="page-subtitle">{child?.name ?? "—"} · {records.length} records</p>
        </div>
        <button onClick={() => setShowForm(true)} className="btn-primary gap-2">
          <span>+</span> Add Record
        </button>
      </div>

      {/* Summary stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <div className="stat-card">
          <div className="text-2xl">📊</div>
          <div className="stat-value" style={{ color: getScoreColor(avgScore) }}>{avgScore.toFixed(1)}%</div>
          <div className="stat-label">Overall Average</div>
        </div>
        <div className="stat-card">
          <div className="text-2xl">📝</div>
          <div className="stat-value">{records.length}</div>
          <div className="stat-label">Total Records</div>
        </div>
        <div className="stat-card">
          <div className="text-2xl">🏅</div>
          <div className="stat-value">{records.filter((r) => (r.percentage ?? 0) >= 80).length}</div>
          <div className="stat-label">Scores ≥ 80%</div>
        </div>
        <div className="stat-card">
          <div className="text-2xl">⏱️</div>
          <div className="stat-value">{Math.round(records.reduce((a, r) => a + (r.study_minutes ?? 0), 0) / 60)}h</div>
          <div className="stat-label">Study Time</div>
        </div>
      </div>

      {/* Subject performance */}
      {subjectStats.length > 0 && (
        <div className="card p-6">
          <h2 className="font-semibold text-sm text-ink mb-4">Performance by Subject</h2>
          <div className="space-y-3">
            {subjectStats.map((s) => (
              <div key={s.id} className="flex items-center gap-3">
                <span className="text-lg w-7">{s.icon}</span>
                <div className="flex-1">
                  <div className="flex justify-between text-sm mb-1">
                    <span className="font-medium text-ink">{s.name}</span>
                    <span className="font-bold" style={{ color: getScoreColor(s.avg ?? 0) }}>{(s.avg ?? 0).toFixed(1)}%</span>
                  </div>
                  <div className="progress-bar">
                    <motion.div
                      className="progress-fill"
                      style={{ background: s.color ?? "#6E51FF", width: "0%" }}
                      animate={{ width: `${s.avg ?? 0}%` }}
                      transition={{ duration: 0.8, ease: "easeOut" }}
                    />
                  </div>
                </div>
                <span className="text-xs text-ink-subtle w-12 text-right">{s.count} tests</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Filter tabs */}
      <div className="flex gap-2 overflow-x-auto">
        {["all", ...RECORD_TYPES].map((t) => (
          <button key={t} onClick={() => setFilter(t)}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all whitespace-nowrap ${filter === t ? "bg-brand-500 text-white" : "bg-white border border-surface-border text-ink-muted hover:border-brand-300"}`}>
            {t === "all" ? "All" : t.charAt(0).toUpperCase() + t.slice(1)}
            {t === "all" ? ` (${records.length})` : ` (${records.filter((r) => r.record_type === t).length})`}
          </button>
        ))}
      </div>

      {/* Records table */}
      <div className="card overflow-hidden">
        {loading ? (
          <div className="p-6 space-y-3">{Array.from({length:5}).map((_,i) => <div key={i} className="skeleton h-12 rounded-xl" />)}</div>
        ) : filtered.length === 0 ? (
          <div className="p-12 text-center">
            <div className="text-4xl mb-3">📚</div>
            <p className="font-medium text-ink mb-1">No records yet</p>
            <p className="text-sm text-ink-muted mb-4">Add your first academic record to start tracking progress</p>
            <button onClick={() => setShowForm(true)} className="btn-primary">Add Record</button>
          </div>
        ) : (
          <div className="divide-y divide-surface-border">
            {filtered.map((r) => {
              const sub = r.subject_id ? subjectMap[r.subject_id] : null;
              return (
                <div key={r.id} className="flex items-center gap-4 px-5 py-4 hover:bg-surface-muted transition-colors group">
                  <span className="text-lg">{TYPE_EMOJI[r.record_type] ?? "📝"}</span>
                  <div className="flex-1 min-w-0">
                    <div className="font-medium text-sm text-ink truncate">{r.title}</div>
                    <div className="text-xs text-ink-muted flex items-center gap-2 mt-0.5">
                      {sub && <span style={{ color: sub.color ?? "#6E51FF" }}>{sub.icon} {sub.name}</span>}
                      <span>·</span>
                      <span>{formatDate(r.recorded_at)}</span>
                      {r.study_minutes > 0 && <><span>·</span><span>⏱ {r.study_minutes}m</span></>}
                    </div>
                  </div>
                  <div className="text-right">
                    {r.score !== null && r.max_score !== null ? (
                      <>
                        <div className="font-bold text-sm" style={{ color: getScoreColor(r.percentage ?? 0) }}>
                          {(r.percentage ?? 0).toFixed(0)}%
                        </div>
                        <div className="text-xs text-ink-subtle">{r.score}/{r.max_score}</div>
                      </>
                    ) : (
                      <div className="text-xs text-ink-subtle">No score</div>
                    )}
                  </div>
                  <button
                    onClick={() => handleDelete(r.id)}
                    className="opacity-0 group-hover:opacity-100 btn-ghost p-1.5 text-red-400 hover:text-red-600 hover:bg-red-50 transition-all"
                  >
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                    </svg>
                  </button>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Add Record Modal */}
      <AnimatePresence>
        {showForm && (
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4"
            style={{ background: "rgb(0 0 0 / 0.4)", backdropFilter: "blur(4px)" }}
            onClick={(e) => e.target === e.currentTarget && setShowForm(false)}
          >
            <motion.div
              initial={{ y: "100%", opacity: 1 }} animate={{ y: 0 }} exit={{ y: "100%" }}
              transition={{ type: "spring", stiffness: 380, damping: 32 }}
              className="card p-6 w-full sm:max-w-lg rounded-t-3xl sm:rounded-3xl max-h-[90vh] overflow-y-auto"
            >
              <div className="bottom-sheet-handle sm:hidden mb-2" />
              <div className="flex items-center justify-between mb-5">
                <h2 className="font-bold text-ink">Add Academic Record</h2>
                <button onClick={() => setShowForm(false)} className="btn-ghost p-1.5">✕</button>
              </div>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-ink mb-1.5">Title *</label>
                  <input className="input-base" placeholder="e.g. Chapter 5 Math Quiz" value={form.title}
                    onChange={(e) => setForm({...form, title: e.target.value})} required />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-sm font-medium text-ink mb-1.5">Type</label>
                    <select className="input-base" value={form.record_type}
                      onChange={(e) => setForm({...form, record_type: e.target.value as typeof form.record_type})}>
                      {RECORD_TYPES.map((t) => <option key={t} value={t}>{t.charAt(0).toUpperCase()+t.slice(1)}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-ink mb-1.5">Subject</label>
                    <select className="input-base" value={form.subject_id}
                      onChange={(e) => setForm({...form, subject_id: e.target.value})}>
                      <option value="">Select subject</option>
                      {subjects.map((s) => <option key={s.id} value={s.id}>{s.icon} {s.name}</option>)}
                    </select>
                  </div>
                </div>
                <div className="grid grid-cols-3 gap-3">
                  <div>
                    <label className="block text-sm font-medium text-ink mb-1.5">Score</label>
                    <input type="number" min="0" className="input-base" placeholder="85" value={form.score}
                      onChange={(e) => setForm({...form, score: e.target.value})} />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-ink mb-1.5">Out of</label>
                    <input type="number" min="0" className="input-base" placeholder="100" value={form.max_score}
                      onChange={(e) => setForm({...form, max_score: e.target.value})} />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-ink mb-1.5">Study (min)</label>
                    <input type="number" min="0" className="input-base" placeholder="45" value={form.study_minutes}
                      onChange={(e) => setForm({...form, study_minutes: e.target.value})} />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-sm font-medium text-ink mb-1.5">Date</label>
                    <input type="date" className="input-base" value={form.recorded_at}
                      onChange={(e) => setForm({...form, recorded_at: e.target.value})} />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-ink mb-1.5">Notes</label>
                  <textarea className="input-base min-h-[70px] resize-none" placeholder="Any observations..."
                    value={form.notes} onChange={(e) => setForm({...form, notes: e.target.value})} />
                </div>
                <div className="flex gap-3 pt-1">
                  <button type="button" onClick={() => setShowForm(false)} className="btn-secondary flex-1">Cancel</button>
                  <button type="submit" disabled={saving || !form.title} className="btn-primary flex-1">
                    {saving ? "Saving…" : "Save Record"}
                  </button>
                </div>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
