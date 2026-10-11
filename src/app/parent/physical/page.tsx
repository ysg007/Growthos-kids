"use client";

import { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from "recharts";
import { useChildrenStore } from "@/stores";
import { formatDate, getAge, calculateBMI } from "@/lib/utils";
import toast from "react-hot-toast";
import type { PhysicalMetric } from "@/types/database";

type MetricType = "height" | "weight" | "activity";

export default function PhysicalPage() {
  const { getActiveChild } = useChildrenStore();
  const child = getActiveChild();
  const [metrics, setMetrics] = useState<PhysicalMetric[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [activeTab, setActiveTab] = useState<MetricType>("height");
  const [form, setForm] = useState({
    metric_type: "height" as "height" | "weight" | "bmi" | "activity",
    value: "", unit: "cm", activity_type: "", duration_min: "",
    notes: "", recorded_at: new Date().toISOString().split("T")[0],
  });
  const [saving, setSaving] = useState(false);

  const load = useCallback(async () => {
    if (!child) return;
    setLoading(true);
    try {
      const res = await fetch(`/api/physical?child_id=${child.id}`);
      const { data } = await res.json();
      setMetrics(data ?? []);
    } catch { toast.error("Failed to load metrics"); }
    finally { setLoading(false); }
  }, [child]);

  useEffect(() => { load(); }, [load]);

  const heightData = metrics
    .filter((m) => m.metric_type === "height")
    .sort((a, b) => new Date(a.recorded_at).getTime() - new Date(b.recorded_at).getTime())
    .map((m) => ({ date: formatDate(m.recorded_at, "MMM yyyy"), value: m.value }));

  const weightData = metrics
    .filter((m) => m.metric_type === "weight")
    .sort((a, b) => new Date(a.recorded_at).getTime() - new Date(b.recorded_at).getTime())
    .map((m) => ({ date: formatDate(m.recorded_at, "MMM yyyy"), value: m.value }));

  const latestHeight = metrics.filter((m) => m.metric_type === "height").sort((a, b) => new Date(b.recorded_at).getTime() - new Date(a.recorded_at).getTime())[0];
  const latestWeight = metrics.filter((m) => m.metric_type === "weight").sort((a, b) => new Date(b.recorded_at).getTime() - new Date(a.recorded_at).getTime())[0];
  const bmi = latestHeight && latestWeight ? calculateBMI(latestWeight.value, latestHeight.value) : null;
  const activities = metrics.filter((m) => m.metric_type === "activity");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!child || !form.value) return;
    setSaving(true);
    try {
      const res = await fetch("/api/physical", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          child_id: child.id,
          metric_type: form.metric_type,
          value: parseFloat(form.value),
          unit: form.unit,
          activity_type: form.activity_type || undefined,
          duration_min: form.duration_min ? parseInt(form.duration_min) : undefined,
          notes: form.notes || undefined,
          recorded_at: form.recorded_at,
        }),
      });
      if (!res.ok) throw new Error();
      toast.success("Recorded!");
      setShowForm(false);
      load();
    } catch { toast.error("Failed to save"); }
    finally { setSaving(false); }
  }

  function getBMICategory(bmi: number) {
    if (bmi < 18.5) return { label: "Underweight", color: "#F59E0B" };
    if (bmi < 25) return { label: "Healthy", color: "#10B981" };
    if (bmi < 30) return { label: "Overweight", color: "#F97316" };
    return { label: "Obese", color: "#EF4444" };
  }

  return (
    <div className="max-w-5xl space-y-6">
      <div className="flex items-center justify-between page-header">
        <div>
          <h1 className="page-title">Physical Development</h1>
          <p className="page-subtitle">{child?.name} · Age {child ? getAge(child.date_of_birth) : "—"}</p>
        </div>
        <button onClick={() => setShowForm(true)} className="btn-primary">+ Log Metric</button>
      </div>

      {/* Summary stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <div className="stat-card">
          <div className="text-2xl">📏</div>
          <div className="stat-value">{latestHeight ? `${latestHeight.value}` : "—"}</div>
          <div className="stat-label">Height (cm)</div>
          {latestHeight && <div className="text-xs text-ink-subtle">Last: {formatDate(latestHeight.recorded_at, "MMM d")}</div>}
        </div>
        <div className="stat-card">
          <div className="text-2xl">⚖️</div>
          <div className="stat-value">{latestWeight ? `${latestWeight.value}` : "—"}</div>
          <div className="stat-label">Weight (kg)</div>
          {latestWeight && <div className="text-xs text-ink-subtle">Last: {formatDate(latestWeight.recorded_at, "MMM d")}</div>}
        </div>
        <div className="stat-card">
          <div className="text-2xl">💚</div>
          <div className="stat-value" style={{ color: bmi ? getBMICategory(bmi).color : undefined }}>{bmi ?? "—"}</div>
          <div className="stat-label">BMI</div>
          {bmi && <div className="text-xs" style={{ color: getBMICategory(bmi).color }}>{getBMICategory(bmi).label}</div>}
        </div>
        <div className="stat-card">
          <div className="text-2xl">🏃</div>
          <div className="stat-value">{activities.length}</div>
          <div className="stat-label">Activities Logged</div>
          <div className="text-xs text-ink-subtle">All time</div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-2">
        {(["height","weight","activity"] as MetricType[]).map((t) => (
          <button key={t} onClick={() => setActiveTab(t)}
            className={`px-4 py-2 rounded-xl text-sm font-medium transition-all capitalize ${activeTab === t ? "bg-brand-500 text-white" : "bg-white border border-surface-border text-ink-muted"}`}>
            {t === "activity" ? "Activities" : t.charAt(0).toUpperCase() + t.slice(1)}
          </button>
        ))}
      </div>

      {/* Charts */}
      {(activeTab === "height" || activeTab === "weight") && (
        <div className="card p-6">
          <h2 className="font-semibold text-sm text-ink mb-4">
            {activeTab === "height" ? "Height Growth Chart (cm)" : "Weight Chart (kg)"}
          </h2>
          {(activeTab === "height" ? heightData : weightData).length < 2 ? (
            <div className="h-48 flex flex-col items-center justify-center gap-3">
              <div className="text-3xl">{activeTab === "height" ? "📏" : "⚖️"}</div>
              <p className="text-sm text-ink-muted">Need at least 2 records to show a chart</p>
              <button onClick={() => setShowForm(true)} className="btn-primary text-sm">Log Now</button>
            </div>
          ) : (
            <ResponsiveContainer width="100%" height={200}>
              <LineChart data={activeTab === "height" ? heightData : weightData} margin={{ left: -20 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#E8E5FF" vertical={false} />
                <XAxis dataKey="date" tick={{ fontSize: 11, fill: "#9CA3AF" }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 11, fill: "#9CA3AF" }} axisLine={false} tickLine={false} domain={["auto", "auto"]} />
                <Tooltip content={({ active, payload }) => active && payload?.length ? (
                  <div className="bg-white border border-surface-border rounded-xl px-3 py-2 text-xs shadow-card">
                    <div className="font-bold text-brand-500">{payload[0].value} {activeTab === "height" ? "cm" : "kg"}</div>
                    <div className="text-ink-muted">{payload[0].payload.date}</div>
                  </div>
                ) : null} />
                <Line type="monotone" dataKey="value" stroke="#6E51FF" strokeWidth={2.5}
                  dot={{ fill: "#6E51FF", r: 4 }} activeDot={{ r: 6 }} />
              </LineChart>
            </ResponsiveContainer>
          )}
        </div>
      )}

      {activeTab === "activity" && (
        <div className="card overflow-hidden">
          {activities.length === 0 ? (
            <div className="p-12 text-center">
              <div className="text-4xl mb-3">🏃</div>
              <p className="font-medium text-ink mb-1">No activities logged yet</p>
              <button onClick={() => { setForm({...form, metric_type: "activity", unit: "min"}); setShowForm(true); }} className="btn-primary mt-3">Log Activity</button>
            </div>
          ) : (
            <div className="divide-y divide-surface-border">
              {activities.sort((a, b) => new Date(b.recorded_at).getTime() - new Date(a.recorded_at).getTime()).map((a) => (
                <div key={a.id} className="flex items-center gap-4 px-5 py-4">
                  <div className="w-10 h-10 rounded-xl bg-red-50 flex items-center justify-center text-xl">🏃</div>
                  <div className="flex-1">
                    <div className="font-medium text-sm text-ink">{a.activity_type ?? "Activity"}</div>
                    <div className="text-xs text-ink-muted">{formatDate(a.recorded_at)}{a.duration_min ? ` · ${a.duration_min} min` : ""}</div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Add metric modal */}
      <AnimatePresence>
        {showForm && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm"
            onClick={(e) => e.target === e.currentTarget && setShowForm(false)}
          >
            <motion.div initial={{ scale: 0.95 }} animate={{ scale: 1 }} exit={{ scale: 0.95 }}
              className="card p-6 w-full max-w-md">
              <div className="flex items-center justify-between mb-5">
                <h2 className="font-bold text-ink">Log Physical Metric</h2>
                <button onClick={() => setShowForm(false)} className="btn-ghost p-1.5">✕</button>
              </div>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-ink mb-1.5">Type</label>
                  <select className="input-base" value={form.metric_type}
                    onChange={(e) => {
                      const t = e.target.value as typeof form.metric_type;
                      setForm({...form, metric_type: t, unit: t === "height" ? "cm" : t === "weight" ? "kg" : "min"});
                    }}>
                    <option value="height">📏 Height</option>
                    <option value="weight">⚖️ Weight</option>
                    <option value="activity">🏃 Activity</option>
                  </select>
                </div>
                {form.metric_type === "activity" && (
                  <div>
                    <label className="block text-sm font-medium text-ink mb-1.5">Activity Type</label>
                    <input className="input-base" placeholder="e.g. Football, Swimming, Yoga" value={form.activity_type}
                      onChange={(e) => setForm({...form, activity_type: e.target.value})} />
                  </div>
                )}
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-sm font-medium text-ink mb-1.5">
                      {form.metric_type === "activity" ? "Duration (min)" : `Value (${form.unit})`}
                    </label>
                    <input type="number" min="0" step="0.1" className="input-base"
                      placeholder={form.metric_type === "height" ? "142" : form.metric_type === "weight" ? "35" : "30"}
                      value={form.metric_type === "activity" ? form.duration_min : form.value}
                      onChange={(e) => setForm(form.metric_type === "activity" ? {...form, duration_min: e.target.value} : {...form, value: e.target.value})} required />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-ink mb-1.5">Date</label>
                    <input type="date" className="input-base" value={form.recorded_at}
                      onChange={(e) => setForm({...form, recorded_at: e.target.value})} />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-ink mb-1.5">Notes</label>
                  <input className="input-base" placeholder="Optional notes" value={form.notes}
                    onChange={(e) => setForm({...form, notes: e.target.value})} />
                </div>
                <div className="flex gap-3">
                  <button type="button" onClick={() => setShowForm(false)} className="btn-secondary flex-1">Cancel</button>
                  <button type="submit" disabled={saving} className="btn-primary flex-1">
                    {saving ? "Saving…" : "Save"}
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
