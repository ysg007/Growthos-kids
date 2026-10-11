"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import { createClient } from "@/lib/supabase/client";
import toast from "react-hot-toast";

type Step = "details" | "otp";

export default function SignupPage() {
  const router = useRouter();
  const [step, setStep] = useState<Step>("details");
  const [form, setForm] = useState({ name: "", email: "" });
  const [otp, setOtp] = useState("");
  const [loading, setLoading] = useState(false);
  const supabase = createClient();

  async function handleSignup(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    try {
      const { error } = await supabase.auth.signInWithOtp({
        email: form.email,
        options: {
          shouldCreateUser: true,
          data: { full_name: form.name },
        },
      });
      if (error) throw error;
      setStep("otp");
      toast.success("Check your email for the verification code!");
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Something went wrong";
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  }

  async function handleVerifyOTP(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    try {
      const { data, error } = await supabase.auth.verifyOtp({
        email: form.email,
        token: otp,
        type: "email",
      });
      if (error) throw error;
      if (data.user) {
        // Update display name
        await supabase.auth.updateUser({ data: { full_name: form.name } });
        toast.success("Account created! Let's set up your child's profile.");
        router.push("/auth/onboarding");
        router.refresh();
      }
    } catch {
      toast.error("Invalid or expired code. Try again.");
    } finally {
      setLoading(false);
    }
  }

  async function handleGoogleSignup() {
    setLoading(true);
    const { error } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: {
        redirectTo: `${window.location.origin}/auth/callback?redirect=/auth/onboarding`,
      },
    });
    if (error) { toast.error(error.message); setLoading(false); }
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-6 bg-surface-muted">
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-md"
      >
        <div className="flex items-center gap-2 justify-center mb-8">
          <div className="w-10 h-10 rounded-2xl bg-brand-gradient flex items-center justify-center text-xl">🌱</div>
          <span className="font-bold text-xl text-ink">GrowthOS Kids</span>
        </div>

        <div className="card p-8">
          <AnimatePresence mode="wait">
            {step === "details" ? (
              <motion.div
                key="details"
                initial={{ opacity: 0, x: -16 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 16 }}
              >
                <h2 className="text-2xl font-bold text-ink mb-1">Create your account</h2>
                <p className="text-ink-muted text-sm mb-8">Start your child&apos;s growth journey today</p>

                <button
                  onClick={handleGoogleSignup}
                  disabled={loading}
                  className="w-full flex items-center justify-center gap-3 px-4 py-3 rounded-xl border border-surface-border bg-white hover:bg-surface-muted text-sm font-medium text-ink transition-all mb-4"
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
                    or sign up with email
                  </div>
                </div>

                <form onSubmit={handleSignup} className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-ink mb-1.5">Your full name</label>
                    <input
                      type="text"
                      value={form.name}
                      onChange={(e) => setForm({ ...form, name: e.target.value })}
                      placeholder="Rahul Sharma"
                      required
                      className="input-base"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-ink mb-1.5">Email address</label>
                    <input
                      type="email"
                      value={form.email}
                      onChange={(e) => setForm({ ...form, email: e.target.value })}
                      placeholder="rahul@example.com"
                      required
                      className="input-base"
                    />
                  </div>
                  <button type="submit" disabled={loading || !form.email || !form.name} className="btn-primary w-full py-3">
                    {loading ? "Sending code…" : "Create account"}
                  </button>
                </form>

                <p className="text-xs text-ink-subtle text-center mt-4">
                  By creating an account, you agree to our{" "}
                  <a href="/terms" className="text-brand-500 hover:underline">Terms</a>{" "}
                  and{" "}
                  <a href="/privacy" className="text-brand-500 hover:underline">Privacy Policy</a>
                </p>
              </motion.div>
            ) : (
              <motion.div
                key="otp"
                initial={{ opacity: 0, x: 16 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -16 }}
              >
                <button onClick={() => setStep("details")} className="btn-ghost mb-6 -ml-2">
                  ← Back
                </button>
                <h2 className="text-2xl font-bold text-ink mb-1">Verify your email</h2>
                <p className="text-ink-muted text-sm mb-8">
                  We sent a 6-digit code to <span className="text-ink font-medium">{form.email}</span>
                </p>
                <form onSubmit={handleVerifyOTP} className="space-y-4">
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
                  <button type="submit" disabled={loading || otp.length !== 6} className="btn-primary w-full py-3">
                    {loading ? "Verifying…" : "Verify & continue"}
                  </button>
                </form>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        <p className="text-center text-sm text-ink-muted mt-6">
          Already have an account?{" "}
          <Link href="/auth/login" className="text-brand-500 font-medium hover:underline">
            Sign in
          </Link>
        </p>
      </motion.div>
    </div>
  );
}
