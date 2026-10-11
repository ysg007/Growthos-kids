export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export type UserRole = "parent" | "child" | "admin" | "teacher" | "school";
export type ChildLevel = "Explorer" | "Learner" | "Achiever" | "Innovator" | "Champion";
export type HabitType = "reading" | "homework" | "exercise" | "sleep" | "meditation" | "screen_time" | "water" | "journaling";
export type SkillType = "communication" | "creativity" | "leadership" | "teamwork" | "problem_solving" | "critical_thinking" | "emotional_intelligence" | "resilience";
export type MentalDomain = "memory" | "focus" | "logic" | "pattern_recognition" | "creativity" | "spatial";
export type RecordType = "homework" | "assignment" | "quiz" | "exam" | "test" | "project";
export type AIProvider = "openai" | "claude" | "gemini";
export type AISessionType = "study_assistant" | "homework_help" | "parent_coach" | "report_generation" | "assessment" | "quiz_generation";
export type ReportType = "weekly" | "monthly" | "quarterly" | "annual" | "on_demand";
export type SubscriptionPlan = "free" | "premium" | "school" | "enterprise";
export type NotificationType = "achievement" | "weekly_summary" | "monthly_report" | "missed_goal" | "encouragement" | "system" | "badge_earned";

export interface User {
  id: string;
  email: string;
  full_name: string | null;
  avatar_url: string | null;
  role: UserRole;
  phone: string | null;
  timezone: string;
  onboarded: boolean;
  created_at: string;
  updated_at: string;
  deleted_at: string | null;
}

export interface Child {
  id: string;
  parent_id: string;
  name: string;
  date_of_birth: string;
  gender: "male" | "female" | "other" | "prefer_not_to_say" | null;
  grade: string | null;
  school: string | null;
  avatar_url: string | null;
  interests: string[];
  hobbies: string[];
  favorite_subjects: string[];
  sports_interests: string[];
  growth_score: number;
  current_level: ChildLevel;
  total_points: number;
  created_at: string;
  updated_at: string;
  deleted_at: string | null;
}

export interface Subject {
  id: string;
  name: string;
  slug: string;
  icon: string | null;
  color: string | null;
  is_active: boolean;
  created_at: string;
}

export interface AcademicRecord {
  id: string;
  child_id: string;
  subject_id: string | null;
  record_type: RecordType;
  title: string;
  score: number | null;
  max_score: number | null;
  percentage: number | null; // computed
  grade_label: string | null;
  study_minutes: number;
  notes: string | null;
  attachment_url: string | null;
  recorded_at: string;
  created_at: string;
  updated_at: string;
  deleted_at: string | null;
  subject?: Subject;
}

export interface Habit {
  id: string;
  child_id: string;
  habit_type: HabitType;
  completed: boolean;
  value: number | null;
  unit: string | null;
  target_value: number | null;
  logged_date: string;
  notes: string | null;
  created_at: string;
}

export interface HabitStreak {
  id: string;
  child_id: string;
  habit_type: HabitType;
  current_streak: number;
  longest_streak: number;
  last_logged: string | null;
  updated_at: string;
}

export interface PhysicalMetric {
  id: string;
  child_id: string;
  metric_type: "height" | "weight" | "bmi" | "activity";
  value: number;
  unit: string;
  activity_type: string | null;
  duration_min: number | null;
  notes: string | null;
  recorded_at: string;
  created_at: string;
}

export interface Skill {
  id: string;
  child_id: string;
  skill_type: SkillType;
  score: number;
  evidence: string | null;
  assessed_by: string;
  assessed_at: string;
  created_at: string;
}

export interface MentalAssessment {
  id: string;
  child_id: string;
  domain: MentalDomain;
  score: number;
  duration_sec: number | null;
  game_id: string | null;
  results: Json;
  taken_at: string;
}

export interface AISession {
  id: string;
  child_id: string | null;
  parent_id: string | null;
  session_type: AISessionType;
  provider: AIProvider;
  model: string | null;
  prompt_tokens: number;
  completion_tokens: number;
  total_tokens: number;
  cost_usd: number;
  messages: Json[];
  metadata: Json;
  status: "pending" | "completed" | "failed" | "cancelled";
  created_at: string;
}

export interface AIReport {
  id: string;
  child_id: string;
  report_type: ReportType;
  period_start: string;
  period_end: string;
  data: Json;
  summary: string | null;
  recommendations: Json[];
  storage_path: string | null;
  shared_token: string;
  generated_at: string;
  expires_at: string | null;
}

export interface Badge {
  id: string;
  slug: string;
  name: string;
  description: string | null;
  icon: string | null;
  category: "academic" | "habits" | "skills" | "physical" | "mental" | "consistency" | "milestone";
  points: number;
  is_active: boolean;
  created_at: string;
}

export interface ChildBadge {
  id: string;
  child_id: string;
  badge_id: string;
  earned_at: string;
  badge?: Badge;
}

export interface Notification {
  id: string;
  user_id: string;
  child_id: string | null;
  type: NotificationType;
  title: string;
  body: string | null;
  action_url: string | null;
  is_read: boolean;
  metadata: Json;
  created_at: string;
}

export interface Subscription {
  id: string;
  user_id: string;
  plan: SubscriptionPlan;
  status: "active" | "cancelled" | "past_due" | "trialing" | "paused";
  stripe_customer_id: string | null;
  stripe_subscription_id: string | null;
  current_period_start: string | null;
  current_period_end: string | null;
  cancel_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface GrowthSnapshot {
  id: string;
  child_id: string;
  snapshot_month: string;
  academic_score: number | null;
  habit_score: number | null;
  skill_score: number | null;
  physical_score: number | null;
  mental_score: number | null;
  overall_score: number | null;
  academic_trend: "up" | "down" | "stable" | null;
  habit_trend: "up" | "down" | "stable" | null;
  highlights: string[];
  areas_for_improvement: string[];
  created_at: string;
}

// API Response types
export interface ChildSummary {
  child_id: string;
  name: string;
  growth_score: number;
  level: ChildLevel;
  total_points: number;
  habits_today: { completed: number; total: number };
  streak_max: number;
  badges_count: number;
  recent_academic: number;
  unread_notifications: number;
}

export interface GrowthRadarData {
  academic: number;
  habits: number;
  skills: number;
  physical: number;
  mental: number;
}
