"use client";

import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import { createClient } from "@/lib/supabase/client";
import toast from "react-hot-toast";

type Step = "email" | "otp";

export default function LoginPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirect = searchParams.get("redirect") ?? "/parent/dashboard";

  const [step, setStep] = useState<Step>("email");
  const [email, setEmail] = useState("");
  const [otp, setOtp] = useState("");
  const [loading, setLoading] = useState(false);
  const supabase = createClient();

  async function handleSendOTP(e: React.FormEvent) {
    e.preventDefault();
    if (!email) return;
    setLoading(true);
    try {
      const { error } = await supabase.auth.signInWithOtp({
        email,
        options: { shouldCreateUser: false },
      });
      if (error) throw error;
      setStep("otp");
      toast.success("Check your email for the code!");
    } catch {
      toast.error("No account found. Sign up first.");
    } finally {
      setLoading(false);
    }
  }

  async function handleVerifyOTP(e: React.FormEvent) {
    e.preventDefault();
    if (otp.length !== 6) return;
    setLoading(true);
    try {
      const { error } = await supabase.auth.verifyOtp({
        email,
        token: otp,
        type: "email",
      });
      if (error) throw error;
      toast.success("Welcome back!");
      router.push(redirect);
      router.refresh();
    } catch {
      toast.error("Invalid or expired code. Try again.");
    } finally {
      setLoading(false);
    }
  }

  async function handleGoogleLogin() {
    setLoading(true);
    const { error } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: {
        redirectTo: `${window.location.origin}/auth/callback?redirect=${redirect}`,
      },
    });
    if (error) { toast.error(error.message); setLoading(false); }
  }

  return (
    <div className="min-h-screen flex">
      {/* Left panel — branding */}
      <div className="hidden lg:flex lg:w-1/2 bg-brand-gradient flex-col justify-between p-12 relative overflow-hidden">
        <div className="relative z-10">
          <div className="flex items-center gap-3 mb-16">
            <div className="w-10 h-10 rounded-2xl bg-white/20 backdrop-blur flex items-center justify-center text-xl">🌱</div>
            <span className="text-white font-bold text-xl">GrowthOS Kids</span>
          </div>
          <h1 className="text-5xl font-bold text-white leading-tight mb-6">
            Every child&apos;s growth,<br />beautifully tracked.
          </h1>
          <p className="text-white/80 text-lg leading-relaxed max-w-md">
            AI-powered insights for academics, habits, skills, and more — all in one place for parents who care deeply.
          </p>
        </div>

        {/* Floating stat cards */}
        <div className="relative z-10 flex flex-col gap-4">
          {[
            { emoji: "📈", label: "Academic Progress", value: "+24% this month" },
            { emoji: "🔥", label: "Habit Streak", value: "21 days strong" },
            { emoji: "🏆", label: "Badges Earned", value: "12 achievements" },
          ].map((item) => (
            <div key={item.label} className="flex items-center gap-4 bg-white/10 backdrop-blur-sm rounded-2xl px-5 py-4 border border-white/20">
              <span className="text-2xl">{item.emoji}</span>
              <div>
                <div className="text-white/60 text-xs font-medium">{item.label}</div>
                <div className="text-white font-semibold text-sm">{item.value}</div>
              </div>
            </div>
          ))}
        </div>

        {/* Background decoration */}
        <div className="absolute top-0 right-0 w-96 h-96 bg-white/5 rounded-full -translate-y-1/2 translate-x-1/2" />
        <div className="absolute bottom-0 left-0 w-64 h-64 bg-white/5 rounded-full translate-y-1/2 -translate-x-1/2" />
      </div>

      {/* Right panel — form */}
      <div className="flex-1 flex items-center justify-center p-6 bg-surface-muted">
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          className="w-full max-w-md"
        >
          {/* Mobile logo */}
          <div className="lg:hidden flex items-center gap-2 mb-8">
            <div className="w-9 h-9 rounded-xl bg-brand-gradient flex items-center justify-center text-lg">🌱</div>
            <span className="font-bold text-ink">GrowthOS Kids</span>
          </div>

          <div className="card p-8">
            <AnimatePresence mode="wait">
              {step === "email" ? (
                <motion.div
                  key="email"
                  initial={{ opacity: 0, x: -16 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 16 }}
                >
                  <h2 className="text-2xl font-bold text-ink mb-1">Welcome back</h2>
                  <p className="text-ink-muted text-sm mb-8">Sign in to your GrowthOS account</p>

                  {/* Google */}
                  <button
                    onClick={handleGoogleLogin}
                    disabled={loading}
                    className="w-full flex items-center justify-center gap-3 px-4 py-3 rounded-xl border border-surface-border bg-white hover:bg-surface-muted text-sm font-medium text-ink transition-all mb-4 disabled:opacity-50"
                  >
                    <svg className="w-5 h-5" viewBox="0 0 24 24">
                      <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
                      <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                      <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
                      <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
                    </svg>
                    Continue with Google
                  </button>

                  <div className="relative my-5">
                    <div className="absolute inset-0 flex items-center">
                      <div className="w-full border-t border-surface-border" />
                    </div>
                    <div className="relative flex justify-center text-xs text-ink-subtle bg-white px-3">
                      or sign in with email
                    </div>
                  </div>

                  <form onSubmit={handleSendOTP} className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-ink mb-1.5">Email address</label>
                      <input
                        type="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        placeholder="parent@example.com"
                        required
                        className="input-base"
                      />
                    </div>
                    <button type="submit" disabled={loading || !email} className="btn-primary w-full py-3">
                      {loading ? "Sending…" : "Send sign-in code"}
                    </button>
                  </form>
                </motion.div>
              ) : (
                <motion.div
                  key="otp"
                  initial={{ opacity: 0, x: 16 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -16 }}
                >
                  <button onClick={() => setStep("email")} className="btn-ghost mb-6 -ml-2 text-ink-muted">
                    ← Back
                  </button>
                  <h2 className="text-2xl font-bold text-ink mb-1">Check your email</h2>
                  <p className="text-ink-muted text-sm mb-8">
                    We sent a 6-digit code to <span className="text-ink font-medium">{email}</span>
                  </p>
                  <form onSubmit={handleVerifyOTP} className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-ink mb-1.5">Verification code</label>
                      <input
                        type="text"
                        inputMode="numeric"
                        pattern="[0-9]{6}"
                        maxLength={6}
                        value={otp}
                        onChange={(e) => setOtp(e.target.value.replace(/\D/g, ""))}
                        placeholder="000000"
                        required
                        className="input-base text-center text-2xl tracking-[0.5em] font-bold"
                        autoFocus
                      />
                    </div>
                    <button type="submit" disabled={loading || otp.length !== 6} className="btn-primary w-full py-3">
                      {loading ? "Verifying…" : "Sign in"}
                    </button>
                  </form>
                  <button
                    onClick={handleSendOTP}
                    className="w-full mt-3 text-sm text-ink-muted hover:text-brand-500 transition-colors"
                  >
                    Resend code
                  </button>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          <p className="text-center text-sm text-ink-muted mt-6">
            New to GrowthOS?{" "}
            <Link href="/auth/signup" className="text-brand-500 font-medium hover:underline">
              Create an account
            </Link>
          </p>
        </motion.div>
      </div>
    </div>
  );
}
