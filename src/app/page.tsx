"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { motion, useScroll, useTransform, AnimatePresence } from "framer-motion";
import ScrollReveal from "@/components/ui/ScrollReveal";

const FEATURES = [
  { icon: "📚", title: "Academic Tracking", desc: "Track every subject, quiz, exam, and assignment with AI-powered trend analysis.", color: "#6E51FF" },
  { icon: "⚡", title: "Habit Development", desc: "Build life-changing daily habits with streak tracking, reminders, and beautiful visualisations.", color: "#10B981" },
  { icon: "🎯", title: "Skill Assessment", desc: "Measure and grow 8 core life skills from communication to emotional intelligence.", color: "#F59E0B" },
  { icon: "💪", title: "Physical Growth", desc: "Monitor height, weight, BMI, and fitness activities with growth charts over time.", color: "#EF4444" },
  { icon: "🧠", title: "Mental Development", desc: "Game-based assessments for memory, focus, logic, creativity, and spatial thinking.", color: "#8B5CF6" },
  { icon: "🤖", title: "AI Parent Coach", desc: "Get personalised, evidence-based parenting advice from an AI that knows your child.", color: "#EC4899" },
  { icon: "📊", title: "Growth Reports", desc: "AI-generated weekly, monthly, and quarterly reports with shareable links.", color: "#0EA5E9" },
  { icon: "🏆", title: "Gamification", desc: "Badges, XP levels, and rewards that motivate without creating screen addiction.", color: "#F97316" },
];

const STATS = [
  { value: 15, suffix: "+", label: "Growth Modules" },
  { value: 8,  suffix: "",  label: "Skill Domains" },
  { value: 3,  suffix: "",  label: "AI Providers" },
  { value: 18, suffix: "",  label: "Max Child Age" },
];

const TESTIMONIALS = [
  { name: "Priya Sharma", role: "Mother of 2, Delhi", text: "GrowthOS completely changed how I understand my son's development. The AI insights are incredibly accurate.", avatar: "PS" },
  { name: "Rahul Mehta",  role: "Father, Mumbai",     text: "The habit tracking with streak system is genius. My daughter hasn't missed her reading habit in 60 days!", avatar: "RM" },
  { name: "Sunita Patel", role: "Parent, Bangalore",  text: "Monthly AI reports give me exactly what I need to talk to teachers. It's like having a child development expert at home.", avatar: "SP" },
];

function useCountUp(target: number, duration = 2000) {
  const [count, setCount] = useState(0);
  const [started, setStarted] = useState(false);
  const ref = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const observer = new IntersectionObserver(([entry]) => {
      if (entry.isIntersecting && !started) setStarted(true);
    }, { threshold: 0.5 });
    observer.observe(el);
    return () => observer.disconnect();
  }, [started]);

  useEffect(() => {
    if (!started) return;
    let frame = 0;
    const start = performance.now();
    const step = (now: number) => {
      const p = Math.min((now - start) / duration, 1);
      const ease = 1 - Math.pow(1 - p, 3);
      setCount(Math.round(target * ease));
      if (p < 1) frame = requestAnimationFrame(step);
    };
    frame = requestAnimationFrame(step);
    return () => cancelAnimationFrame(frame);
  }, [started, target, duration]);

  return { count, ref };
}

function StatItem({ value, suffix, label }: { value: number; suffix: string; label: string }) {
  const { count, ref } = useCountUp(value, 1800);
  return (
    <div className="text-center">
      <div className="text-4xl font-bold" style={{ color: "var(--brand-500)", letterSpacing: "-0.03em" }}>
        <span ref={ref}>{count}</span>{suffix}
      </div>
      <div className="text-sm mt-1" style={{ color: "var(--ink-muted)" }}>{label}</div>
    </div>
  );
}

export default function HomePage() {
  const heroRef = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({ target: heroRef, offset: ["start start", "end start"] });
  const heroY = useTransform(scrollYProgress, [0, 1], ["0%", "30%"]);
  const heroOpacity = useTransform(scrollYProgress, [0, 0.8], [1, 0]);

  const [activeTestimonial, setActiveTestimonial] = useState(0);
  useEffect(() => {
    const t = setInterval(() => setActiveTestimonial((i) => (i + 1) % TESTIMONIALS.length), 4000);
    return () => clearInterval(t);
  }, []);

  // Scroll reveal
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => entries.forEach((e) => {
        if (e.isIntersecting) { e.target.classList.add("visible"); }
      }),
      { threshold: 0.1, rootMargin: "0px 0px -60px 0px" }
    );
    document.querySelectorAll(".reveal").forEach((el) => observer.observe(el));
    return () => observer.disconnect();
  }, []);

  return (
    <div className="min-h-screen" style={{ background: "var(--surface-muted)" }}>

      {/* ── Sticky Nav ─────────────────────────────────────── */}
      <nav className="fixed top-0 left-0 right-0 z-50 glass-nav"
        style={{ borderBottom: "0.5px solid var(--surface-border)" }}>
        <div className="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <motion.div
              className="w-8 h-8 rounded-xl flex items-center justify-center text-base"
              style={{ background: "linear-gradient(135deg, #6E51FF, #A897FF)" }}
              whileHover={{ rotate: -8, scale: 1.1 }}
              transition={{ type: "spring", stiffness: 400, damping: 15 }}
            >🌱</motion.div>
            <span className="font-bold text-base" style={{ color: "var(--ink)" }}>GrowthOS Kids</span>
          </div>
          <div className="hidden md:flex items-center gap-6">
            {["Features","Pricing","Blog"].map((item) => (
              <a key={item} href="#" className="text-sm font-medium transition-colors"
                style={{ color: "var(--ink-muted)" }}
                onMouseEnter={(e) => (e.currentTarget.style.color = "var(--brand-500)")}
                onMouseLeave={(e) => (e.currentTarget.style.color = "var(--ink-muted)")}
              >{item}</a>
            ))}
          </div>
          <div className="flex items-center gap-2">
            <Link href="/auth/login" className="btn-ghost text-sm">Sign in</Link>
            <Link href="/auth/signup" className="btn-primary text-sm">Get started free</Link>
          </div>
        </div>
      </nav>

      {/* ── Hero ───────────────────────────────────────────── */}
      <section ref={heroRef} className="relative pt-32 pb-24 px-6 overflow-hidden" style={{ minHeight: "100vh", display: "flex", alignItems: "center" }}>
        {/* Ambient blobs */}
        <div className="absolute inset-0 pointer-events-none">
          <motion.div style={{ y: heroY }} className="absolute inset-0">
            <div className="absolute top-0 right-0 w-[600px] h-[600px] rounded-full"
              style={{ background: "radial-gradient(circle, rgb(110 81 255 / 0.14) 0%, transparent 70%)", transform: "translate(20%, -30%)" }} />
            <div className="absolute bottom-0 left-0 w-[500px] h-[500px] rounded-full"
              style={{ background: "radial-gradient(circle, rgb(16 185 129 / 0.1) 0%, transparent 70%)", transform: "translate(-20%, 20%)" }} />
            <div className="absolute top-1/2 left-1/2 w-[400px] h-[400px] rounded-full"
              style={{ background: "radial-gradient(circle, rgb(139 92 246 / 0.07) 0%, transparent 70%)", transform: "translate(-50%, -50%)" }} />
          </motion.div>
        </div>

        <motion.div className="max-w-5xl mx-auto text-center relative z-10" style={{ opacity: heroOpacity }}>
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-full text-sm font-semibold mb-8"
            style={{ background: "var(--brand-50)", color: "var(--brand-600)", border: "0.5px solid var(--brand-100)" }}
          >
            <motion.span animate={{ rotate: [0, 15, -15, 0] }} transition={{ duration: 2, repeat: Infinity, repeatDelay: 3 }}>✨</motion.span>
            AI-Powered Child Growth Operating System
          </motion.div>

          <motion.h1
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.1 }}
            className="text-6xl md:text-7xl font-bold mb-6"
            style={{ color: "var(--ink)", letterSpacing: "-0.04em", lineHeight: 1.1 }}
          >
            The Digital Growth Record<br />
            <span style={{ background: "linear-gradient(135deg, #6E51FF 0%, #A897FF 50%, #10B981 100%)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent", backgroundClip: "text" }}>
              of Every Child
            </span>
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="text-xl max-w-2xl mx-auto mb-10"
            style={{ color: "var(--ink-muted)", lineHeight: 1.7 }}
          >
            Track academics, habits, skills, and physical development in one beautiful platform.
            Powered by Claude AI. Built for parents who care deeply.
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.3 }}
            className="flex flex-col sm:flex-row gap-3 justify-center mb-6"
          >
            <Link href="/auth/signup">
              <motion.div
                className="btn-primary py-4 px-8 text-base"
                whileHover={{ scale: 1.03 }}
                whileTap={{ scale: 0.97 }}
              >
                Start free — no credit card
                <motion.span animate={{ x: [0, 4, 0] }} transition={{ duration: 1.5, repeat: Infinity }}>→</motion.span>
              </motion.div>
            </Link>
            <Link href="/auth/login">
              <motion.div
                className="btn-secondary py-4 px-8 text-base"
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.97 }}
              >
                Sign in
              </motion.div>
            </Link>
          </motion.div>

          <motion.p
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.5 }}
            className="text-sm" style={{ color: "var(--ink-subtle)" }}
          >
            Free forever · 5 min setup · Ages 5–18
          </motion.p>

          {/* Floating stat badges */}
          <div className="relative mt-16 hidden md:block">
            {[
              { emoji: "📈", label: "Academic avg", value: "+24%", color: "#6E51FF", x: "5%", y: 0 },
              { emoji: "🔥", label: "Habit streak", value: "21 days", color: "#F97316", x: "72%", y: 10 },
              { emoji: "🏆", label: "Badges earned", value: "12", color: "#F59E0B", x: "38%", y: -10 },
            ].map((badge, i) => (
              <motion.div
                key={badge.label}
                className="absolute card px-4 py-3 flex items-center gap-3"
                style={{ left: badge.x, top: badge.y, width: "auto", minWidth: 160 }}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: [badge.y, badge.y - 8, badge.y] }}
                transition={{
                  opacity: { delay: 0.6 + i * 0.15, duration: 0.5 },
                  y: { delay: 0.6 + i * 0.15, duration: 3 + i, repeat: Infinity, ease: "easeInOut" }
                }}
              >
                <span className="text-xl">{badge.emoji}</span>
                <div>
                  <div className="text-xs font-medium" style={{ color: "var(--ink-muted)" }}>{badge.label}</div>
                  <div className="text-sm font-bold" style={{ color: badge.color }}>{badge.value}</div>
                </div>
              </motion.div>
            ))}
          </div>
        </motion.div>
      </section>

      {/* ── Stats strip ────────────────────────────────────── */}
      <section className="py-16 px-6" style={{ borderTop: "0.5px solid var(--surface-border)", borderBottom: "0.5px solid var(--surface-border)", background: "var(--surface)" }}>
        <div className="max-w-4xl mx-auto grid grid-cols-2 md:grid-cols-4 gap-8">
          {STATS.map((s) => (
            <ScrollReveal key={s.label}>
              <StatItem {...s} />
            </ScrollReveal>
          ))}
        </div>
      </section>

      {/* ── Features ───────────────────────────────────────── */}
      <section className="py-24 px-6">
        <div className="max-w-6xl mx-auto">
          <ScrollReveal className="text-center mb-16">
            <h2 className="text-4xl font-bold mb-4" style={{ color: "var(--ink)", letterSpacing: "-0.03em" }}>
              Everything a growing child needs
            </h2>
            <p className="text-lg max-w-xl mx-auto" style={{ color: "var(--ink-muted)" }}>
              One platform to track, improve, and celebrate every dimension of your child's growth.
            </p>
          </ScrollReveal>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {FEATURES.map((f, i) => (
              <ScrollReveal key={f.title} delay={(i % 4 + 1) as 1|2|3|4|5|6}>
                <div className="feature-card group">
                  <motion.div
                    className="text-3xl mb-4"
                    whileHover={{ scale: 1.2, rotate: -8 }}
                    transition={{ type: "spring", stiffness: 400, damping: 10 }}
                    style={{ display: "inline-block" }}
                  >{f.icon}</motion.div>
                  <div className="font-semibold text-sm mb-2" style={{ color: "var(--ink)" }}>{f.title}</div>
                  <div className="text-xs leading-relaxed" style={{ color: "var(--ink-muted)" }}>{f.desc}</div>
                  <div className="absolute bottom-0 left-0 right-0 h-0.5 rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-300"
                    style={{ background: f.color }} />
                </div>
              </ScrollReveal>
            ))}
          </div>
        </div>
      </section>

      {/* ── Testimonials ───────────────────────────────────── */}
      <section className="py-24 px-6" style={{ background: "var(--surface)" }}>
        <div className="max-w-3xl mx-auto text-center">
          <ScrollReveal>
            <h2 className="text-4xl font-bold mb-12" style={{ color: "var(--ink)", letterSpacing: "-0.03em" }}>
              Loved by parents across India
            </h2>
          </ScrollReveal>
          <div className="relative" style={{ minHeight: 200 }}>
            <AnimatePresence mode="wait">
              <motion.div
                key={activeTestimonial}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                transition={{ duration: 0.4 }}
                className="card p-8"
              >
                <p className="text-lg mb-6 italic" style={{ color: "var(--ink)", lineHeight: 1.7 }}>
                  "{TESTIMONIALS[activeTestimonial].text}"
                </p>
                <div className="flex items-center justify-center gap-3">
                  <div className="w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold"
                    style={{ background: "var(--brand-50)", color: "var(--brand-600)" }}>
                    {TESTIMONIALS[activeTestimonial].avatar}
                  </div>
                  <div className="text-left">
                    <div className="font-semibold text-sm" style={{ color: "var(--ink)" }}>{TESTIMONIALS[activeTestimonial].name}</div>
                    <div className="text-xs" style={{ color: "var(--ink-muted)" }}>{TESTIMONIALS[activeTestimonial].role}</div>
                  </div>
                </div>
              </motion.div>
            </AnimatePresence>
            <div className="flex justify-center gap-2 mt-6">
              {TESTIMONIALS.map((_, i) => (
                <button key={i} onClick={() => setActiveTestimonial(i)}
                  className="rounded-full transition-all duration-300"
                  style={{
                    width: i === activeTestimonial ? 24 : 8,
                    height: 8,
                    background: i === activeTestimonial ? "var(--brand-500)" : "var(--surface-border2)",
                    border: "none",
                    cursor: "pointer",
                  }} />
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ── CTA ────────────────────────────────────────────── */}
      <section className="py-28 px-6 relative overflow-hidden">
        <div className="absolute inset-0" style={{
          background: "linear-gradient(135deg, #6E51FF 0%, #8B74FF 50%, #10B981 100%)"
        }} />
        <div className="absolute inset-0" style={{
          background: "radial-gradient(ellipse at 30% 50%, rgb(255 255 255 / 0.08) 0%, transparent 60%)"
        }} />
        <ScrollReveal className="max-w-2xl mx-auto text-center relative z-10">
          <motion.div
            className="text-5xl mb-6"
            animate={{ y: [0, -8, 0] }}
            transition={{ duration: 2.5, repeat: Infinity, ease: "easeInOut" }}
          >🌱</motion.div>
          <h2 className="text-4xl font-bold text-white mb-4" style={{ letterSpacing: "-0.03em" }}>
            Start your child's growth journey
          </h2>
          <p className="text-xl text-white/80 mb-10">
            Join thousands of parents building the digital growth records of their children.
          </p>
          <Link href="/auth/signup">
            <motion.div
              className="inline-flex items-center gap-3 bg-white font-bold py-4 px-10 rounded-2xl text-base cursor-pointer"
              style={{ color: "var(--brand-600)" }}
              whileHover={{ scale: 1.04, boxShadow: "0 8px 32px rgb(0 0 0 / 0.2)" }}
              whileTap={{ scale: 0.97 }}
            >
              Create free account →
            </motion.div>
          </Link>
        </ScrollReveal>
      </section>

      {/* ── Footer ─────────────────────────────────────────── */}
      <footer className="py-12 px-6" style={{ borderTop: "0.5px solid var(--surface-border)" }}>
        <div className="max-w-6xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-xl flex items-center justify-center text-sm"
              style={{ background: "linear-gradient(135deg, #6E51FF, #A897FF)" }}>🌱</div>
            <span className="font-bold" style={{ color: "var(--ink)" }}>GrowthOS Kids</span>
          </div>
          <p className="text-sm" style={{ color: "var(--ink-subtle)" }}>
            The Digital Growth Record of Every Child · Built with ❤️
          </p>
          <div className="flex gap-4 text-sm" style={{ color: "var(--ink-muted)" }}>
            {["Terms","Privacy","Support"].map((l) => (
              <a key={l} href="#" className="transition-colors hover:text-brand-500">{l}</a>
            ))}
          </div>
        </div>
      </footer>
    </div>
  );
}
