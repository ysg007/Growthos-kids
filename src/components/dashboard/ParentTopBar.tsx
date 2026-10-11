"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { motion, AnimatePresence, useScroll, useMotionValueEvent } from "framer-motion";
import { createClient } from "@/lib/supabase/client";
import { useNotificationsStore } from "@/stores";
import { formatDate } from "@/lib/utils";
import ThemeToggle from "@/components/ui/ThemeToggle";
import type { User } from "@/types/database";

interface Props { user: User | null; }

const GREETING = () => {
  const h = new Date().getHours();
  if (h < 12) return "Good morning";
  if (h < 17) return "Good afternoon";
  return "Good evening";
};

export default function ParentTopBar({ user }: Props) {
  const supabase = createClient();
  const { notifications, unreadCount, setNotifications, markRead, markAllRead } = useNotificationsStore();
  const [notifOpen, setNotifOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const notifRef = useRef<HTMLDivElement>(null);
  const { scrollY } = useScroll();

  useMotionValueEvent(scrollY, "change", (y) => setScrolled(y > 12));

  useEffect(() => {
    if (!user) return;
    supabase.from("notifications").select("*")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false })
      .limit(20)
      .then(({ data }) => { if (data) setNotifications(data); });

    const channel = supabase.channel("notif-realtime")
      .on("postgres_changes", { event: "INSERT", schema: "public", table: "notifications", filter: `user_id=eq.${user.id}` },
        (p) => { useNotificationsStore.getState().addNotification(p.new as never); })
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [user]);

  // Close notif on outside click
  useEffect(() => {
    function handler(e: MouseEvent) {
      if (notifRef.current && !notifRef.current.contains(e.target as Node)) setNotifOpen(false);
    }
    if (notifOpen) document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [notifOpen]);

  async function handleMarkRead(id: string) {
    markRead(id);
    await supabase.from("notifications").update({ is_read: true }).eq("id", id);
  }

  return (
    <motion.header
      className="h-14 flex items-center justify-between px-6 shrink-0 transition-all duration-300"
      animate={{
        background: scrolled ? "rgba(255,255,255,0.88)" : "rgba(255,255,255,1)",
        backdropFilter: scrolled ? "blur(20px) saturate(180%)" : "none",
        boxShadow: scrolled ? "0 1px 12px rgb(0 0 0 / 0.06)" : "none",
        borderBottom: scrolled ? "0.5px solid var(--surface-border)" : "0.5px solid transparent",
      }}
      style={{ position: "sticky", top: 0, zIndex: 30 }}
    >
      {/* Greeting */}
      <motion.div
        className="flex items-center gap-2 text-sm"
        initial={{ opacity: 0, x: -12 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ delay: 0.1 }}
      >
        <span style={{ color: "var(--ink-muted)" }}>{GREETING()},</span>
        <span className="font-semibold" style={{ color: "var(--ink)" }}>
          {user?.full_name?.split(" ")[0] ?? "there"}
        </span>
        <motion.span
          animate={{ rotate: [0, 20, -10, 20, 0] }}
          transition={{ duration: 1, delay: 0.5 }}
        >👋</motion.span>
      </motion.div>

      <div className="flex items-center gap-1">
        {/* Search */}
        <Link href="/parent/search">
          <motion.div
            className="btn-ghost p-2"
            whileHover={{ scale: 1.08 }}
            whileTap={{ scale: 0.92 }}
            title="Search (⌘K)"
          >
            <svg className="w-4.5 h-4.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8} style={{ width: 18, height: 18 }}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
          </motion.div>
        </Link>

        {/* Notifications */}
        <div className="relative" ref={notifRef}>
          <motion.button
            onClick={() => setNotifOpen((v) => !v)}
            className="btn-ghost p-2 relative"
            whileHover={{ scale: 1.08 }}
            whileTap={{ scale: 0.92 }}
            aria-label={`${unreadCount} notifications`}
          >
            <svg style={{ width: 18, height: 18 }} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
            </svg>
            <AnimatePresence>
              {unreadCount > 0 && (
                <motion.span
                  initial={{ scale: 0 }} animate={{ scale: 1 }} exit={{ scale: 0 }}
                  transition={{ type: "spring", stiffness: 500 }}
                  className="absolute top-1 right-1 min-w-[16px] h-4 px-1 rounded-full flex items-center justify-center text-[9px] font-bold text-white"
                  style={{ background: "var(--brand-500)" }}
                >
                  {unreadCount > 9 ? "9+" : unreadCount}
                </motion.span>
              )}
            </AnimatePresence>
          </motion.button>

          <AnimatePresence>
            {notifOpen && (
              <motion.div
                initial={{ opacity: 0, y: 8, scale: 0.96 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: 8, scale: 0.96 }}
                transition={{ type: "spring", stiffness: 400, damping: 25 }}
                className="absolute right-0 top-11 w-80 card shadow-lg z-50 overflow-hidden"
                style={{ boxShadow: "var(--shadow-lg)" }}
              >
                <div className="flex items-center justify-between px-4 py-3" style={{ borderBottom: "0.5px solid var(--surface-border)" }}>
                  <span className="font-semibold text-sm" style={{ color: "var(--ink)" }}>Notifications</span>
                  <div className="flex items-center gap-2">
                    {unreadCount > 0 && (
                      <button onClick={async () => { markAllRead(); await supabase.from("notifications").update({ is_read: true }).eq("user_id", user?.id ?? ""); }}
                        className="text-xs font-medium transition-colors"
                        style={{ color: "var(--brand-500)" }}
                        onMouseEnter={(e) => (e.currentTarget.style.textDecoration = "underline")}
                        onMouseLeave={(e) => (e.currentTarget.style.textDecoration = "none")}
                      >Mark all read</button>
                    )}
                    <span className="text-[10px] px-1.5 py-0.5 rounded-full font-bold"
                      style={{ background: "var(--brand-50)", color: "var(--brand-600)" }}>
                      {unreadCount} new
                    </span>
                  </div>
                </div>
                <div className="max-h-80 overflow-y-auto divide-y" style={{ borderColor: "var(--surface-border)" }}>
                  {notifications.length === 0 ? (
                    <div className="px-4 py-10 text-center">
                      <div className="text-3xl mb-2">🔔</div>
                      <p className="text-sm" style={{ color: "var(--ink-muted)" }}>All caught up!</p>
                    </div>
                  ) : notifications.map((n, i) => (
                    <motion.button
                      key={n.id}
                      onClick={() => handleMarkRead(n.id)}
                      initial={{ opacity: 0, x: -8 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: i * 0.03 }}
                      className="w-full text-left px-4 py-3 transition-colors"
                      style={{ background: n.is_read ? "transparent" : "var(--brand-50)" }}
                      onMouseEnter={(e) => (e.currentTarget.style.background = n.is_read ? "var(--surface-muted)" : "var(--brand-100)")}
                      onMouseLeave={(e) => (e.currentTarget.style.background = n.is_read ? "transparent" : "var(--brand-50)")}
                    >
                      <div className="flex items-start gap-2.5">
                        {!n.is_read && (
                          <div className="w-1.5 h-1.5 rounded-full mt-1.5 shrink-0" style={{ background: "var(--brand-500)" }} />
                        )}
                        <div className={n.is_read ? "" : ""}>
                          <div className="text-sm font-medium" style={{ color: "var(--ink)" }}>{n.title}</div>
                          {n.body && <div className="text-xs mt-0.5 line-clamp-2" style={{ color: "var(--ink-muted)" }}>{n.body}</div>}
                          <div className="text-[10px] mt-1" style={{ color: "var(--ink-subtle)" }}>{formatDate(n.created_at, "MMM d, h:mm a")}</div>
                        </div>
                      </div>
                    </motion.button>
                  ))}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Theme toggle */}
        <ThemeToggle />

        {/* Settings */}
        <Link href="/parent/settings">
          <motion.div className="btn-ghost p-2" whileHover={{ scale: 1.08, rotate: 45 }} whileTap={{ scale: 0.92 }} title="Settings">
            <svg style={{ width: 18, height: 18 }} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
              <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
          </motion.div>
        </Link>
      </div>
    </motion.header>
  );
}
