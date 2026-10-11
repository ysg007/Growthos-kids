# 🌱 GrowthOS Kids

**The Digital Growth Record of Every Child**

AI-powered Child Growth Operating System — track academics, habits, skills, physical development, and more for children aged 5–18.

---

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | Next.js 15, TypeScript, Tailwind CSS, Framer Motion |
| State | Zustand |
| Forms | React Hook Form + Zod |
| Charts | Recharts |
| Backend | Supabase (PostgreSQL, Auth, Storage, Realtime, Edge Functions) |
| AI | Claude (primary), GPT-4o, Gemini (via centralized gateway) |
| Deployment | Vercel (ap-south-1 region) |

---

## Quick Start

```bash
# 1. Clone and install
npm install

# 2. Set up environment variables
cp .env.example .env.local
# Fill in all values

# 3. Run development server
npm run dev
```

---

## Architecture

```
Parent/Child App (Next.js 15)
    ↓
Next.js API Routes (Auth Guards + Rate Limiting + Audit Logs)
    ↓
AI Gateway (lib/ai/gateway.ts) ← centralized, never call AI directly
    ↓
Claude / OpenAI / Gemini (with fallback)
    ↓
Supabase (PostgreSQL + Auth + Storage + Realtime)
    ↓
Vercel Edge Network (bom1 region - Mumbai)
```

---

## Database

Supabase project: `igytigqoattydxyezewa` (ap-south-1)
URL: `https://igytigqoattydxyezewa.supabase.co`

**Core tables:**
- `users` — extends Supabase auth
- `children` — per-parent child profiles
- `academic_records` — all test/exam/homework scores
- `habits` + `habit_streaks` — daily habit logging with auto-streak computation
- `physical_metrics` — height, weight, BMI, activities
- `skills` — 8-domain skill assessments
- `mental_assessments` — game-based cognitive assessments
- `ai_sessions` — all AI usage tracked with cost
- `ai_reports` — generated reports with shareable tokens
- `badges` + `child_badges` — gamification
- `notifications` — realtime push-style notifications
- `subscriptions` — Stripe-ready plan management
- `audit_logs` — full audit trail
- `growth_snapshots` — monthly computed summaries

**Security:**
- RLS enabled on every table
- `owns_child()` function enforces parent-child ownership
- No cross-account data access possible

---

## Key Files

```
src/lib/ai/gateway.ts          ← Central AI router (Claude/OpenAI/Gemini)
src/lib/supabase/server.ts     ← Server-side Supabase client
src/lib/supabase/client.ts     ← Browser Supabase client
src/middleware.ts              ← Auth protection + redirects
src/stores/index.ts            ← Zustand state management
src/types/database.ts          ← Full TypeScript types

src/app/auth/login/            ← Email OTP + Google OAuth
src/app/auth/signup/           ← Registration flow
src/app/auth/onboarding/       ← Child profile creation wizard
src/app/parent/dashboard/      ← Main parent dashboard
src/app/parent/academics/      ← Academic tracking
src/app/parent/habits/         ← Daily habit logging
src/app/parent/skills/         ← Skill assessment with radar chart
src/app/parent/physical/       ← Physical metrics & growth charts
src/app/parent/reports/        ← AI report generation
src/app/parent/ai-coach/       ← AI Parent Coach chat

src/app/api/academics/         ← Academic records CRUD
src/app/api/habits/            ← Habit logging + upsert
src/app/api/skills/            ← Skill assessment
src/app/api/physical/          ← Physical metrics
src/app/api/ai/coach/          ← AI Parent Coach endpoint
src/app/api/ai/study/          ← AI Study Assistant (streaming)
src/app/api/ai/reports/        ← AI Report generation

supabase/migrations/
  001_growthos_init_schema.sql ← Full schema (applied ✓)
  002_rls_policies.sql         ← RLS policies (applied ✓)
  003_indexes_and_functions.sql← Indexes + triggers (applied ✓)
```

---

## Environment Variables

```env
# Required
NEXT_PUBLIC_SUPABASE_URL=https://igytigqoattydxyezewa.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=<from Supabase>
SUPABASE_SERVICE_ROLE_KEY=<from Supabase Settings → API>

# AI (at least one required)
ANTHROPIC_API_KEY=<from console.anthropic.com>
OPENAI_API_KEY=<from platform.openai.com>
GEMINI_API_KEY=<from aistudio.google.com>

# Optional
STRIPE_SECRET_KEY=<for billing>
NEXT_PUBLIC_APP_URL=https://your-domain.com
```

---

## MVP Phase 1 Checklist

- [x] Supabase project configured (ap-south-1)
- [x] Full production schema (14 tables + triggers)
- [x] RLS policies on every table
- [x] Optimized indexes
- [x] Auth (Email OTP + Google OAuth)
- [x] Onboarding flow (4-step wizard)
- [x] Parent dashboard with growth score ring
- [x] Academic tracking with subject performance
- [x] Habit logging with streak automation
- [x] Skills assessment with radar chart
- [x] Physical metrics with growth charts
- [x] AI Parent Coach (streaming chat)
- [x] AI Report generation (weekly/monthly/quarterly)
- [x] Shareable report links (`/r/[token]`)
- [x] Centralized AI gateway (Claude/OpenAI/Gemini)
- [x] Real-time notifications
- [x] Zustand state management
- [x] Full TypeScript coverage
- [x] Tailwind design system
- [x] Vercel deployment config

## Phase 2 (next sprint)
- [ ] Child dashboard (gamified, age-appropriate)
- [ ] AI Study Assistant (streaming, Socratic method)
- [ ] Homework image upload (OCR)
- [ ] Mental assessments (game-based)
- [ ] Talent discovery engine
- [ ] Admin panel

---

## Deploy to Vercel

```bash
# Install Vercel CLI
npm i -g vercel

# Deploy
vercel --prod

# Set environment variables in Vercel dashboard
# or use: vercel env add ANTHROPIC_API_KEY
```

---

Built with ❤️ for parents who want the best for their children.
