import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";
import { differenceInYears, differenceInMonths, format, parseISO } from "date-fns";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function getAge(dateOfBirth: string): number {
  return differenceInYears(new Date(), parseISO(dateOfBirth));
}

export function getAgeInMonths(dateOfBirth: string): number {
  return differenceInMonths(new Date(), parseISO(dateOfBirth));
}

export function formatDate(date: string, fmt = "MMM d, yyyy"): string {
  return format(parseISO(date), fmt);
}

export function formatScore(score: number): string {
  return score.toFixed(1);
}

export function getGrowthLevel(score: number): {
  level: string;
  color: string;
  next: number;
} {
  if (score >= 90) return { level: "Champion",  color: "#EF4444", next: 100 };
  if (score >= 75) return { level: "Innovator", color: "#F97316", next: 90 };
  if (score >= 55) return { level: "Achiever",  color: "#FBBF24", next: 75 };
  if (score >= 35) return { level: "Learner",   color: "#34D399", next: 55 };
  return               { level: "Explorer",  color: "#60A5FA", next: 35 };
}

export function getScoreColor(score: number): string {
  if (score >= 80) return "#10B981";
  if (score >= 60) return "#F59E0B";
  if (score >= 40) return "#F97316";
  return "#EF4444";
}

export function getTrendIcon(trend: "up" | "down" | "stable" | null): string {
  if (trend === "up") return "↑";
  if (trend === "down") return "↓";
  return "→";
}

export function getTrendColor(trend: "up" | "down" | "stable" | null): string {
  if (trend === "up") return "text-green-500";
  if (trend === "down") return "text-red-500";
  return "text-gray-400";
}

export function getHabitIcon(habitType: string): string {
  const icons: Record<string, string> = {
    reading:    "📖",
    homework:   "✏️",
    exercise:   "🏃",
    sleep:      "😴",
    meditation: "🧘",
    screen_time:"📱",
    water:      "💧",
    journaling: "📔",
  };
  return icons[habitType] ?? "⭐";
}

export function getHabitLabel(habitType: string): string {
  const labels: Record<string, string> = {
    reading:    "Reading",
    homework:   "Homework",
    exercise:   "Exercise",
    sleep:      "Sleep",
    meditation: "Meditation",
    screen_time:"Screen Time",
    water:      "Water Intake",
    journaling: "Journaling",
  };
  return labels[habitType] ?? habitType;
}

export function getSkillLabel(skillType: string): string {
  const labels: Record<string, string> = {
    communication:         "Communication",
    creativity:            "Creativity",
    leadership:            "Leadership",
    teamwork:              "Teamwork",
    problem_solving:       "Problem Solving",
    critical_thinking:     "Critical Thinking",
    emotional_intelligence:"Emotional Intelligence",
    resilience:            "Resilience",
  };
  return labels[skillType] ?? skillType;
}

export function truncate(str: string, maxLen: number): string {
  if (str.length <= maxLen) return str;
  return str.slice(0, maxLen - 3) + "...";
}

export function pluralize(count: number, singular: string, plural?: string): string {
  return count === 1 ? singular : (plural ?? singular + "s");
}

export function getDaysInStreak(streak: number): string {
  if (streak === 0) return "Start today!";
  if (streak === 1) return "1 day streak 🔥";
  return `${streak} day streak 🔥`;
}

export function calculateBMI(weightKg: number, heightCm: number): number {
  const heightM = heightCm / 100;
  return Math.round((weightKg / (heightM * heightM)) * 10) / 10;
}

export function getSubjectColor(slug: string): string {
  const colors: Record<string, string> = {
    math:    "#6C63FF",
    science: "#00BFA5",
    english: "#FF7043",
    social:  "#42A5F5",
    hindi:   "#EC407A",
    cs:      "#26C6DA",
    art:     "#AB47BC",
    pe:      "#66BB6A",
  };
  return colors[slug] ?? "#6E51FF";
}

export function generateInitials(name: string): string {
  return name
    .split(" ")
    .slice(0, 2)
    .map((n) => n[0])
    .join("")
    .toUpperCase();
}

export function formatCurrency(usd: number): string {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(usd * 84);
}
