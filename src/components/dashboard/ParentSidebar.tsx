"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { cn, generateInitials } from "@/lib/utils";
import { useUIStore, useChildrenStore, useSessionStore } from "@/stores";
import { createClient } from "@/lib/supabase/client";
import type { User, Child } from "@/types/database";
import { useEffect, useState } from "react";
import toast from "react-hot-toast";

const NAV = [
  { href: "/parent/dashboard", icon: "🏠", label: "Dashboard",  shortcut: "D" },
  { href: "/parent/academics", icon: "📚", label: "Academics",  shortcut: "A" },
  { href: "/parent/habits",    icon: "⚡", label: "Habits",     shortcut: "H" },
  { href: "/parent/skills",    icon: "🎯", label: "Skills",     shortcut: "S" },
  { href: "/parent/physical",  icon: "💪", label: "Physical",   shortcut: "P" },
  { href: "/parent/reports",   icon: "📊", label: "Reports",    shortcut: "R" },
  { href: "/parent/ai-coach",  icon: "🤖", label: "AI Coach",   shortcut: "I" },
];

const LEVEL_XP: Record<string, number> = {
  Explorer: 35, Learner: 55, Achiever: 75, Innovator: 90, Champion: 100
};

interface Props { user: User | null; children: Child[]; }

export default function ParentSidebar({ user, children }: Props) {
  const pathname = usePathname();
  const router = useRouter();
  const { sidebarCollapsed, toggleSidebar } = useUIStore();
  const { setChildren, activeChildId, setActiveChild, getActiveChild } = useChildrenStore();
  const [signingOut, setSigningOut] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  useEffect(() => { setChildren(children); }, [children, setChildren]);

  // Keyboard shortcuts
  useEffect(() => {
    function handler(e: KeyboardEvent) {
      if (e.altKey) {
        const nav = NAV.find((n) => n.shortcut === e.key.toUpperCase());
        if (nav) { e.preventDefault(); router.push(nav.href); }
      }
      if (e.key === "[" && (e.metaKey || e.ctrlKey)) { e.preventDefault(); toggleSidebar(); }
    }
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [router, toggleSidebar]);

  async function handleSignOut() {
    setSigningOut(true);
    const supabase = createClient();
    await supabase.auth.signOut();
    useSessionStore.getState().clearSession();
    router.push("/auth/login");
    toast.success("Signed out");
  }

  const activeChild = getActiveChild();
  const xp = activeChild ? Math.round(activeChild.growth_score) : 0;
  const nextLevel = LEVEL_XP[activeChild?.current_level ?? "Explorer"] ?? 35;
  const xpPct = Math.min((xp / nextLevel) * 100, 100);

  const SidebarContent = () => (
    <div className="flex flex-col h-full">
      {/* Logo */}
      <div className="flex items-center gap-3 px-4 py-5" style={{ borderBottom: "0.5px solid var(--surface-border)" }}>
        <motion.div
          className="w-8 h-8 rounded-xl flex items-center justify-center text-base shrink-0"
          style={{ background: "linear-gradient(135deg, #6E51FF, #A897FF)" }}
          whileHover={{ rotate: -8, scale: 1.1 }}
          transition={{ type: "spring", stiffness: 400 }}
        >🌱</motion.div>
        <AnimatePresence>
          {!sidebarCollapsed && (
            <motion.span
              initial={{ opacity: 0, x: -8 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -8 }}
              className="font-bold text-sm whitespace-nowrap" style={{ color: "var(--ink)" }}
            >GrowthOS Kids</motion.span>
          )}
        </AnimatePresence>
        <motion.button
          onClick={toggleSidebar}
          className="btn-ghost p-1.5 ml-auto shrink-0"
          whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }}
          title="Toggle sidebar (⌘[)"
        >
          <svg className="w-4 h-4" viewBox="0 0 16 16" fill="none">
            <path d={sidebarCollapsed ? "M6 3l5 5-5 5" : "M10 3L5 8l5 5"} stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        </motion.button>
      </div>

      {/* Child switcher */}
      {children.length > 0 && (
        <div className="px-3 py-3" style={{ borderBottom: "0.5px solid var(--surface-border)" }}>
          {!sidebarCollapsed ? (
            <div>
              <p className="text-[10px] font-bold px-2 mb-2 uppercase tracking-wider" style={{ color: "var(--ink-subtle)" }}>Children</p>
              {children.map((child) => {
                const active = activeChildId === child.id;
                return (
                  <motion.button
                    key={child.id}
                    onClick={() => setActiveChild(child.id)}
                    className={cn("w-full flex items-center gap-2.5 px-2.5 py-2 rounded-xl text-sm transition-all")}
                    style={{
                      background: active ? "var(--brand-50)" : "transparent",
                      color: active ? "var(--brand-600)" : "var(--ink-muted)",
                      fontWeight: active ? 600 : 400,
                    }}
                    whileHover={{ x: 2 }}
                    whileTap={{ scale: 0.97 }}
                  >
                    <div className="w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold text-white shrink-0"
                      style={{ background: "linear-gradient(135deg, #6E51FF, #A897FF)" }}>
                      {generateInitials(child.name)}
                    </div>
                    <span className="truncate flex-1 text-left">{child.name}</span>
                    {active && (
                      <motion.div
                        layoutId="active-child-dot"
                        className="w-1.5 h-1.5 rounded-full"
                        style={{ background: "var(--brand-500)" }}
                      />
                    )}
                  </motion.button>
                );
              })}
              <Link href="/parent/children/add"
                className="flex items-center gap-2 px-2.5 py-2 rounded-xl text-xs mt-1 transition-all"
                style={{ color: "var(--ink-subtle)" }}
                onMouseEnter={(e) => { e.currentTarget.style.color = "var(--brand-500)"; e.currentTarget.style.background = "var(--brand-50)"; }}
                onMouseLeave={(e) => { e.currentTarget.style.color = "var(--ink-subtle)"; e.currentTarget.style.background = ""; }}
              >
                <span className="text-base">+</span> Add child
              </Link>
            </div>
          ) : (
            <div className="flex flex-col items-center gap-1.5">
              {children.map((child) => (
                <motion.button
                  key={child.id}
                  onClick={() => setActiveChild(child.id)}
                  title={child.name}
                  className="w-9 h-9 rounded-full flex items-center justify-center text-xs font-bold text-white"
                  style={{
                    background: activeChildId === child.id ? "var(--brand-500)" : "var(--brand-300)",
                    outline: activeChildId === child.id ? "3px solid var(--brand-100)" : "none",
                  }}
                  whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }}
                >
                  {generateInitials(child.name)}
                </motion.button>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Navigation */}
      <nav className="flex-1 px-3 py-3 space-y-0.5 overflow-y-auto">
        {NAV.map((item) => {
          const active = pathname.startsWith(item.href);
          return (
            <Link key={item.href} href={item.href}>
              <motion.div
                className={cn("flex items-center gap-3 px-2.5 py-2.5 rounded-xl text-sm font-medium relative",
                  sidebarCollapsed && "justify-center px-0"
                )}
                style={{
                  background: active ? "var(--brand-50)" : "transparent",
                  color: active ? "var(--brand-600)" : "var(--ink-muted)",
                }}
                whileHover={{ x: sidebarCollapsed ? 0 : 3, background: active ? "var(--brand-50)" : "var(--surface-subtle)" }}
                whileTap={{ scale: 0.97 }}
                title={sidebarCollapsed ? `${item.label} (Alt+${item.shortcut})` : undefined}
              >
                {active && (
                  <motion.div
                    layoutId="nav-active"
                    className="absolute inset-0 rounded-xl"
                    style={{ background: "var(--brand-50)" }}
                    transition={{ type: "spring", stiffness: 500, damping: 30 }}
                  />
                )}
                <span className="text-lg shrink-0 relative z-10">{item.icon}</span>
                <AnimatePresence>
                  {!sidebarCollapsed && (
                    <motion.span
                      initial={{ opacity: 0, x: -6 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0 }}
                      className="whitespace-nowrap relative z-10 flex-1"
                    >{item.label}</motion.span>
                  )}
                </AnimatePresence>
                {!sidebarCollapsed && active && (
                  <motion.span
                    initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                    className="text-[10px] px-1.5 py-0.5 rounded font-bold relative z-10"
                    style={{ background: "var(--brand-100)", color: "var(--brand-600)" }}
                  >Alt+{item.shortcut}</motion.span>
                )}
              </motion.div>
            </Link>
          );
        })}
      </nav>

      {/* XP bar */}
      {activeChild && !sidebarCollapsed && (
        <div className="px-4 py-3" style={{ borderTop: "0.5px solid var(--surface-border)" }}>
          <div className="flex items-center justify-between mb-1.5">
            <span className="text-xs font-semibold" style={{ color: "var(--ink-muted)" }}>{activeChild.current_level}</span>
            <span className="text-xs font-bold" style={{ color: "var(--brand-500)" }}>{xp}/{nextLevel} XP</span>
          </div>
          <div className="progress-bar h-2">
            <motion.div
              className="progress-fill xp-fill"
              style={{ background: "linear-gradient(90deg, var(--brand-500), var(--brand-300))" }}
              initial={{ width: 0 }}
              animate={{ width: `${xpPct}%` }}
              transition={{ duration: 1.2, ease: [0.34, 1.56, 0.64, 1], delay: 0.3 }}
            />
          </div>
          <div className="text-[10px] mt-1" style={{ color: "var(--ink-subtle)" }}>
            {nextLevel - xp} XP to next level
          </div>
        </div>
      )}

      {/* User profile + signout */}
      <div className="px-3 pb-4 pt-2" style={{ borderTop: sidebarCollapsed ? "0.5px solid var(--surface-border)" : "none" }}>
        <div className={cn("flex items-center gap-2.5 px-2.5 py-2", sidebarCollapsed && "justify-center px-0")}>
          <motion.div
            className="w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold shrink-0"
            style={{ background: "var(--brand-50)", color: "var(--brand-600)" }}
            whileHover={{ scale: 1.05 }}
          >
            {user?.full_name ? generateInitials(user.full_name) : "P"}
          </motion.div>
          <AnimatePresence>
            {!sidebarCollapsed && (
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="flex-1 min-w-0">
                <div className="text-xs font-semibold truncate" style={{ color: "var(--ink)" }}>{user?.full_name ?? "Parent"}</div>
                <div className="text-[10px] truncate" style={{ color: "var(--ink-subtle)" }}>{user?.email}</div>
              </motion.div>
            )}
          </AnimatePresence>
          <AnimatePresence>
            {!sidebarCollapsed && (
              <motion.button
                initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                onClick={handleSignOut}
                disabled={signingOut}
                className="btn-ghost p-1.5 ml-auto"
                title="Sign out"
                whileHover={{ scale: 1.1, color: "#EF4444" }}
              >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                </svg>
              </motion.button>
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );

  return (
    <>
      {/* Desktop sidebar */}
      <motion.aside
        animate={{ width: sidebarCollapsed ? 72 : 240 }}
        transition={{ type: "spring", stiffness: 400, damping: 35 }}
        className="hidden md:flex flex-col h-full shrink-0"
        style={{
          background: "var(--surface)",
          borderRight: "0.5px solid var(--surface-border)",
          overflow: "hidden",
        }}
      >
        <SidebarContent />
      </motion.aside>

      {/* Mobile bottom nav */}
      <nav className="mobile-nav items-center justify-around px-2">
        {NAV.slice(0, 5).map((item) => {
          const active = pathname.startsWith(item.href);
          return (
            <Link key={item.href} href={item.href}
              className="flex flex-col items-center gap-0.5 py-2 px-3 rounded-xl transition-all"
              style={{ color: active ? "var(--brand-500)" : "var(--ink-subtle)" }}
            >
              <motion.span
                className="text-xl"
                animate={{ scale: active ? 1.1 : 1 }}
                transition={{ type: "spring", stiffness: 500 }}
              >{item.icon}</motion.span>
              <span className="text-[9px] font-semibold">{item.label}</span>
              {active && (
                <motion.div
                  layoutId="mobile-nav-dot"
                  className="w-1 h-1 rounded-full"
                  style={{ background: "var(--brand-500)" }}
                />
              )}
            </Link>
          );
        })}
      </nav>
    </>
  );
}
