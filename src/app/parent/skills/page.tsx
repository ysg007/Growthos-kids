"use client";

import { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  RadarChart, PolarGrid, PolarAngleAxis, Radar,
  ResponsiveContainer, Tooltip
} from "recharts";
import { useChildrenStore } from "@/stores";
import { getSkillLabel } from "@/lib/utils";
import toast from "react-hot-toast";
import type { Skill, SkillType } from "@/types/database";

const ALL_SKILLS: SkillType[] = [
  "communication","creativity","leadership","teamwork",
  "problem_solving","critical_thinking","emotional_intelligence","resilience"
];

const SKILL_ICONS: Record<SkillType, string> = {
  communication: "🗣️", creativity: "🎨", leadership: "👑", teamwork: "🤝",
  problem_solving: "🧩", critical_thinking: "💭", emotional_intelligence: "❤️", resilience: "⚡"
};

const SKILL_DESCRIPTIONS: Record<SkillType, string> = {
  communication: "Expresses ideas clearly and listens actively",
  creativity: "Generates novel ideas and approaches",
  leadership: "Guides and motivates others toward goals",
  teamwork: "Collaborates effectively in group settings",
  problem_solving: "Identifies and resolves challenges systematically",
  critical_thinking: "Analyses information and forms reasoned judgments",
  emotional_intelligence: "Understands and manages emotions",
  resilience: "Recovers quickly from setbacks",
};

export default function SkillsPage() {
  const { getActiveChild } = useChildrenStore();
  const child = getActiveChild();
  const [skills, setSkills] = useState<Skill[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState<{ skill_type: SkillType; score: number; evidence: string }>({
    skill_type: "communication", score: 5, evidence: ""
  });
  const [saving, setSaving] = useState(false);

  const load = useCallback(async () => {
    if (!child) return;
    setLoading(true);
    try {
      const res = await fetch(`/api/skills?child_id=${child.id}`);
      const { data } = await res.json();
      setSkills(data ?? []);
    } catch { toast.error("Failed to load skills"); }
    finally { setLoading(false); }
  }, [child]);

  useEffect(() => { load(); }, [load]);

  // Latest score per skill
  function getLatestScore(skillType: SkillType): number {
    const skillRecords = skills.filter((s) => s.skill_type === skillType);
    if (!skillRecords.length) return 0;
    return skillRecords.sort((a, b) => new Date(b.assessed_at).getTime() - new Date(a.assessed_at).getTime())[0].score;
  }

  const radarData = ALL_SKILLS.map((s) => ({
    skill: getSkillLabel(s).replace(" ", "\n"),
    score: getLatestScore(s),
    fullMark: 10,
  }));

  const avgSkill = ALL_SKILLS.reduce((a, s) => a + getLatestScore(s), 0) / ALL_SKILLS.length;
  const topSkills = ALL_SKILLS.filter((s) => getLatestScore(s) >= 7).sort((a, b) => getLatestScore(b) - getLatestScore(a));
  const growthAreas = ALL_SKILLS.filter((s) => getLatestScore(s) < 5).sort((a, b) => getLatestScore(a) - getLatestScore(b));

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!child) return;
    setSaving(true);
    try {
      const res = await fetch("/api/skills", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ child_id: child.id, ...form }),
      });
      if (!res.ok) throw new Error();
      toast.success("Skill assessed!");
      setShowForm(false);
      load();
    } catch { toast.error("Failed to save"); }
    finally { setSaving(false); }
  }

  return (
    <div className="max-w-5xl space-y-6">
      <div className="flex items-center justify-between page-header">
        <div>
          <h1 className="page-title">Skills</h1>
          <p className="page-subtitle">{child?.name} · Avg score: {avgSkill.toFixed(1)}/10</p>
        </div>
        <button onClick={() => setShowForm(true)} className="btn-primary">+ Assess Skill</button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Radar chart */}
        <div className="card p-6">
          <h2 className="font-semibold text-sm text-ink mb-4">Skills Radar</h2>
          {skills.length === 0 ? (
            <div className="h-64 flex flex-col items-center justify-center gap-3">
              <div className="text-4xl">🎯</div>
              <p className="text-sm text-ink-muted text-center">No skills assessed yet.<br />Start your first assessment!</p>
              <button onClick={() => setShowForm(true)} className="btn-primary text-sm">Assess Now</button>
            </div>
          ) : (
            <ResponsiveContainer width="100%" height={280}>
              <RadarChart data={radarData}>
                <PolarGrid stroke="#E8E5FF" />
                <PolarAngleAxis dataKey="skill" tick={{ fontSize: 10, fill: "#9CA3AF" }} />
                <Radar name="Skills" dataKey="score" stroke="#6E51FF" fill="#6E51FF" fillOpacity={0.15} strokeWidth={2} />
                <Tooltip
                  content={({ active, payload }) => {
                    if (!active || !payload?.length) return null;
                    return (
                      <div className="bg-white border border-surface-border rounded-xl px-3 py-2 text-xs shadow-card">
                        <div className="font-semibold text-ink">{payload[0].payload.skill.replace("\n", " ")}</div>
                        <div className="text-brand-500 font-bold">{payload[0].value}/10</div>
                      </div>
                    );
                  }}
                />
              </RadarChart>
            </ResponsiveContainer>
          )}
        </div>

        {/* Skill bars + insights */}
        <div className="space-y-4">
          {topSkills.length > 0 && (
            <div className="card p-5">
              <div className="flex items-center gap-2 mb-3">
                <span>💪</span>
                <h3 className="font-semibold text-sm text-ink">Strengths</h3>
              </div>
              <div className="space-y-2">
                {topSkills.slice(0, 3).map((s) => (
                  <div key={s} className="flex items-center gap-3">
                    <span className="w-6">{SKILL_ICONS[s]}</span>
                    <div className="flex-1">
                      <div className="flex justify-between text-sm mb-1">
                        <span className="text-ink font-medium">{getSkillLabel(s)}</span>
                        <span className="font-bold text-green-500">{getLatestScore(s)}/10</span>
                      </div>
                      <div className="progress-bar h-1.5">
                        <motion.div className="progress-fill bg-green-400"
                          animate={{ width: `${getLatestScore(s) * 10}%` }}
                          transition={{ duration: 0.6 }} />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {growthAreas.length > 0 && (
            <div className="card p-5">
              <div className="flex items-center gap-2 mb-3">
                <span>🌱</span>
                <h3 className="font-semibold text-sm text-ink">Growth Areas</h3>
              </div>
              <div className="space-y-2">
                {growthAreas.slice(0, 3).map((s) => (
                  <div key={s} className="flex items-center gap-3">
                    <span className="w-6">{SKILL_ICONS[s]}</span>
                    <div className="flex-1">
                      <div className="flex justify-between text-sm mb-1">
                        <span className="text-ink font-medium">{getSkillLabel(s)}</span>
                        <span className="font-bold text-amber-500">{getLatestScore(s)}/10</span>
                      </div>
                      <div className="progress-bar h-1.5">
                        <motion.div className="progress-fill bg-amber-400"
                          animate={{ width: `${getLatestScore(s) * 10}%` }}
                          transition={{ duration: 0.6 }} />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* All skills grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {ALL_SKILLS.map((skillType) => {
          const score = getLatestScore(skillType);
          const history = skills.filter((s) => s.skill_type === skillType).sort((a, b) => new Date(a.assessed_at).getTime() - new Date(b.assessed_at).getTime());
          const prevScore = history.length > 1 ? history[history.length - 2].score : null;
          const trend = prevScore !== null ? (score > prevScore ? "↑" : score < prevScore ? "↓" : "→") : null;

          return (
            <div key={skillType} className="card p-4 cursor-pointer hover:shadow-card-lg transition-all"
              onClick={() => { setForm({ skill_type: skillType, score: score || 5, evidence: "" }); setShowForm(true); }}>
              <div className="flex items-center justify-between mb-2">
                <span className="text-xl">{SKILL_ICONS[skillType]}</span>
                {trend && <span className={`text-xs font-bold ${trend === "↑" ? "text-green-500" : trend === "↓" ? "text-red-500" : "text-gray-400"}`}>{trend}</span>}
              </div>
              <div className={`text-2xl font-bold mb-0.5 ${score >= 7 ? "text-green-500" : score >= 4 ? "text-amber-500" : score > 0 ? "text-red-400" : "text-ink-subtle"}`}>
                {score > 0 ? score : "—"}
                {score > 0 && <span className="text-sm text-ink-subtle font-normal">/10</span>}
              </div>
              <div className="text-xs font-medium text-ink mb-1">{getSkillLabel(skillType)}</div>
              <div className="text-[10px] text-ink-subtle leading-tight">{SKILL_DESCRIPTIONS[skillType]}</div>
            </div>
          );
        })}
      </div>

      {/* Assess Skill Modal */}
      <AnimatePresence>
        {showForm && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm"
            onClick={(e) => e.target === e.currentTarget && setShowForm(false)}
          >
            <motion.div initial={{ scale: 0.95 }} animate={{ scale: 1 }} exit={{ scale: 0.95 }}
              className="card p-6 w-full max-w-md">
              <div className="flex items-center justify-between mb-5">
                <h2 className="font-bold text-ink">Assess Skill</h2>
                <button onClick={() => setShowForm(false)} className="btn-ghost p-1.5">✕</button>
              </div>
              <form onSubmit={handleSubmit} className="space-y-5">
                <div>
                  <label className="block text-sm font-medium text-ink mb-1.5">Skill</label>
                  <select className="input-base" value={form.skill_type}
                    onChange={(e) => setForm({ ...form, skill_type: e.target.value as SkillType })}>
                    {ALL_SKILLS.map((s) => <option key={s} value={s}>{SKILL_ICONS[s]} {getSkillLabel(s)}</option>)}
                  </select>
                  <p className="text-xs text-ink-subtle mt-1">{SKILL_DESCRIPTIONS[form.skill_type]}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-ink mb-3">
                    Score: <span className="text-brand-500 font-bold">{form.score}/10</span>
                  </label>
                  <input type="range" min="1" max="10" value={form.score}
                    onChange={(e) => setForm({ ...form, score: parseInt(e.target.value) })}
                    className="w-full accent-brand-500" />
                  <div className="flex justify-between text-[10px] text-ink-subtle mt-1">
                    <span>1 - Needs work</span><span>5 - Developing</span><span>10 - Excellent</span>
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-ink mb-1.5">Evidence / Notes</label>
                  <textarea className="input-base min-h-[80px] resize-none"
                    placeholder="What did you observe? e.g. Led group project at school, presented confidently..."
                    value={form.evidence}
                    onChange={(e) => setForm({ ...form, evidence: e.target.value })} />
                </div>
                <div className="flex gap-3">
                  <button type="button" onClick={() => setShowForm(false)} className="btn-secondary flex-1">Cancel</button>
                  <button type="submit" disabled={saving} className="btn-primary flex-1">
                    {saving ? "Saving…" : "Save Assessment"}
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
