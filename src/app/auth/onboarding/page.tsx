"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { createClient } from "@/lib/supabase/client";
import toast from "react-hot-toast";

const STEPS = ["Welcome", "Child Profile", "Interests", "All Set!"];
const GRADES = ["Grade 1","Grade 2","Grade 3","Grade 4","Grade 5","Grade 6","Grade 7","Grade 8","Grade 9","Grade 10","Grade 11","Grade 12"];
const INTERESTS = ["Reading","Drawing","Coding","Sports","Music","Dance","Science","Cooking","Gaming","Photography","Writing","Robotics","Yoga","Swimming","Chess"];
const SUBJECTS = ["Mathematics","Science","English","Hindi","Social Studies","Computer Science","Art","Physical Education"];
const SPORTS = ["Cricket","Football","Basketball","Badminton","Tennis","Swimming","Running","Cycling","Yoga","Gymnastics"];

interface ChildForm {
  name: string;
  date_of_birth: string;
  gender: string;
  grade: string;
  school: string;
  interests: string[];
  hobbies: string[];
  favorite_subjects: string[];
  sports_interests: string[];
}

export default function OnboardingPage() {
  const router = useRouter();
  const supabase = createClient();
  const [step, setStep] = useState(0);
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState<ChildForm>({
    name: "",
    date_of_birth: "",
    gender: "",
    grade: "",
    school: "",
    interests: [],
    hobbies: [],
    favorite_subjects: [],
    sports_interests: [],
  });

  function toggleArrayItem(field: keyof ChildForm, item: string) {
    const arr = form[field] as string[];
    const next = arr.includes(item) ? arr.filter((x) => x !== item) : [...arr, item];
    setForm({ ...form, [field]: next });
  }

  async function handleFinish() {
    setLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      const { error } = await supabase.from("children").insert({
        parent_id: user.id,
        name: form.name,
        date_of_birth: form.date_of_birth,
        gender: form.gender || null,
        grade: form.grade || null,
        school: form.school || null,
        interests: form.interests,
        hobbies: form.hobbies,
        favorite_subjects: form.favorite_subjects,
        sports_interests: form.sports_interests,
      });
      if (error) throw error;

      // Mark user as onboarded
      await supabase.from("users").update({ onboarded: true }).eq("id", user.id);

      toast.success(`${form.name}'s profile is ready!`);
      router.push("/parent/dashboard");
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Could not save profile";
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  }

  const canProceed = [
    true,
    form.name && form.date_of_birth,
    true,
    true,
  ][step];

  return (
    <div className="min-h-screen bg-surface-muted flex items-center justify-center p-6">
      <div className="w-full max-w-lg">
        {/* Logo */}
        <div className="flex items-center gap-2 justify-center mb-8">
          <div className="w-9 h-9 rounded-xl bg-brand-gradient flex items-center justify-center text-lg">🌱</div>
          <span className="font-bold text-ink">GrowthOS Kids</span>
        </div>

        {/* Progress */}
        <div className="flex items-center gap-2 mb-8">
          {STEPS.map((s, i) => (
            <div key={s} className="flex items-center gap-2 flex-1">
              <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold transition-all
                ${i < step ? "bg-brand-500 text-white" : i === step ? "bg-brand-500 text-white ring-4 ring-brand-100" : "bg-surface-border text-ink-subtle"}`}>
                {i < step ? "✓" : i + 1}
              </div>
              {i < STEPS.length - 1 && (
                <div className={`flex-1 h-0.5 rounded-full transition-all ${i < step ? "bg-brand-500" : "bg-surface-border"}`} />
              )}
            </div>
          ))}
        </div>

        <div className="card p-8 min-h-[400px] flex flex-col">
          <AnimatePresence mode="wait">
            {/* Step 0: Welcome */}
            {step === 0 && (
              <motion.div key="welcome" initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -12 }} className="flex-1 flex flex-col items-center justify-center text-center gap-6">
                <div className="text-6xl animate-float">🌱</div>
                <div>
                  <h2 className="text-2xl font-bold text-ink mb-2">Welcome to GrowthOS!</h2>
                  <p className="text-ink-muted">Let&apos;s set up your child&apos;s growth profile. It takes under 2 minutes.</p>
                </div>
                <div className="grid grid-cols-2 gap-3 w-full max-w-sm">
                  {[["📚","Track academics"],["💪","Build habits"],["🎯","Discover talents"],["🏆","Earn rewards"]].map(([e,l]) => (
                    <div key={l} className="flex items-center gap-2 p-3 rounded-xl bg-surface-subtle text-sm text-ink-muted">
                      <span>{e}</span><span>{l}</span>
                    </div>
                  ))}
                </div>
              </motion.div>
            )}

            {/* Step 1: Child Profile */}
            {step === 1 && (
              <motion.div key="profile" initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -12 }} className="flex-1">
                <h2 className="text-xl font-bold text-ink mb-1">Child&apos;s Profile</h2>
                <p className="text-ink-muted text-sm mb-6">Tell us about your child</p>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-ink mb-1.5">Full name *</label>
                    <input className="input-base" placeholder="Arjun Sharma" value={form.name}
                      onChange={e => setForm({...form, name: e.target.value})} />
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-sm font-medium text-ink mb-1.5">Date of birth *</label>
                      <input type="date" className="input-base" value={form.date_of_birth}
                        max={new Date().toISOString().split("T")[0]}
                        onChange={e => setForm({...form, date_of_birth: e.target.value})} />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-ink mb-1.5">Gender</label>
                      <select className="input-base" value={form.gender} onChange={e => setForm({...form, gender: e.target.value})}>
                        <option value="">Select</option>
                        <option value="male">Male</option>
                        <option value="female">Female</option>
                        <option value="other">Other</option>
                        <option value="prefer_not_to_say">Prefer not to say</option>
                      </select>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-sm font-medium text-ink mb-1.5">Grade</label>
                      <select className="input-base" value={form.grade} onChange={e => setForm({...form, grade: e.target.value})}>
                        <option value="">Select grade</option>
                        {GRADES.map(g => <option key={g} value={g}>{g}</option>)}
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-ink mb-1.5">School</label>
                      <input className="input-base" placeholder="School name" value={form.school}
                        onChange={e => setForm({...form, school: e.target.value})} />
                    </div>
                  </div>
                </div>
              </motion.div>
            )}

            {/* Step 2: Interests */}
            {step === 2 && (
              <motion.div key="interests" initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -12 }} className="flex-1">
                <h2 className="text-xl font-bold text-ink mb-1">Interests & Hobbies</h2>
                <p className="text-ink-muted text-sm mb-5">Select all that apply — this helps us personalise the experience</p>
                <div className="space-y-5">
                  <div>
                    <div className="text-xs font-semibold text-ink-muted uppercase tracking-wide mb-2">General Interests</div>
                    <div className="flex flex-wrap gap-2">
                      {INTERESTS.map(item => (
                        <button key={item} type="button"
                          onClick={() => toggleArrayItem("interests", item)}
                          className={`px-3 py-1.5 rounded-full text-sm font-medium border transition-all ${form.interests.includes(item) ? "bg-brand-500 text-white border-brand-500" : "bg-white border-surface-border text-ink-muted hover:border-brand-300"}`}>
                          {item}
                        </button>
                      ))}
                    </div>
                  </div>
                  <div>
                    <div className="text-xs font-semibold text-ink-muted uppercase tracking-wide mb-2">Favourite Subjects</div>
                    <div className="flex flex-wrap gap-2">
                      {SUBJECTS.map(item => (
                        <button key={item} type="button"
                          onClick={() => toggleArrayItem("favorite_subjects", item)}
                          className={`px-3 py-1.5 rounded-full text-sm font-medium border transition-all ${form.favorite_subjects.includes(item) ? "bg-brand-500 text-white border-brand-500" : "bg-white border-surface-border text-ink-muted hover:border-brand-300"}`}>
                          {item}
                        </button>
                      ))}
                    </div>
                  </div>
                  <div>
                    <div className="text-xs font-semibold text-ink-muted uppercase tracking-wide mb-2">Sports</div>
                    <div className="flex flex-wrap gap-2">
                      {SPORTS.map(item => (
                        <button key={item} type="button"
                          onClick={() => toggleArrayItem("sports_interests", item)}
                          className={`px-3 py-1.5 rounded-full text-sm font-medium border transition-all ${form.sports_interests.includes(item) ? "bg-brand-500 text-white border-brand-500" : "bg-white border-surface-border text-ink-muted hover:border-brand-300"}`}>
                          {item}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              </motion.div>
            )}

            {/* Step 3: All Set */}
            {step === 3 && (
              <motion.div key="done" initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0 }} className="flex-1 flex flex-col items-center justify-center text-center gap-6">
                <motion.div className="text-6xl" animate={{ rotate: [0, -10, 10, -10, 0], scale: [1, 1.2, 1] }} transition={{ duration: 0.6, delay: 0.2 }}>🎉</motion.div>
                <div>
                  <h2 className="text-2xl font-bold text-ink mb-2">{form.name}&apos;s profile is ready!</h2>
                  <p className="text-ink-muted">We&apos;ve created a personalised growth profile. Time to start tracking!</p>
                </div>
                <div className="bg-surface-subtle rounded-2xl p-5 w-full text-left space-y-2">
                  <div className="flex justify-between text-sm"><span className="text-ink-muted">Name</span><span className="font-medium text-ink">{form.name}</span></div>
                  <div className="flex justify-between text-sm"><span className="text-ink-muted">Grade</span><span className="font-medium text-ink">{form.grade || "—"}</span></div>
                  <div className="flex justify-between text-sm"><span className="text-ink-muted">Interests</span><span className="font-medium text-ink">{form.interests.length > 0 ? form.interests.slice(0,3).join(", ") + (form.interests.length > 3 ? "…" : "") : "—"}</span></div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Navigation */}
          <div className="flex gap-3 mt-8">
            {step > 0 && step < 3 && (
              <button onClick={() => setStep(s => s - 1)} className="btn-secondary flex-1">Back</button>
            )}
            {step < 2 && (
              <button onClick={() => setStep(s => s + 1)} disabled={!canProceed} className="btn-primary flex-1">
                {step === 0 ? "Get started" : "Continue"}
              </button>
            )}
            {step === 2 && (
              <button onClick={() => setStep(3)} className="btn-primary flex-1">Continue →</button>
            )}
            {step === 3 && (
              <button onClick={handleFinish} disabled={loading} className="btn-primary flex-1 py-3 text-base">
                {loading ? "Setting up…" : "Go to dashboard 🚀"}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
