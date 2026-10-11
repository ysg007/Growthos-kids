import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import type { Child, User, Notification, Subscription } from "@/types/database";

// ─── Session Store ───────────────────────────────────────
interface SessionStore {
  user: User | null;
  subscription: Subscription | null;
  setUser: (user: User | null) => void;
  setSubscription: (sub: Subscription | null) => void;
  clearSession: () => void;
  isPremium: () => boolean;
}

export const useSessionStore = create<SessionStore>()(
  persist(
    (set, get) => ({
      user: null,
      subscription: null,
      setUser: (user) => set({ user }),
      setSubscription: (subscription) => set({ subscription }),
      clearSession: () => set({ user: null, subscription: null }),
      isPremium: () => {
        const plan = get().subscription?.plan;
        return plan === "premium" || plan === "school" || plan === "enterprise";
      },
    }),
    {
      name: "growthos-session",
      storage: createJSONStorage(() => sessionStorage),
      partialize: (state) => ({ user: state.user }),
    }
  )
);

// ─── Children Store ───────────────────────────────────────
interface ChildrenStore {
  children: Child[];
  activeChildId: string | null;
  setChildren: (children: Child[]) => void;
  addChild: (child: Child) => void;
  updateChild: (id: string, updates: Partial<Child>) => void;
  setActiveChild: (id: string) => void;
  getActiveChild: () => Child | null;
}

export const useChildrenStore = create<ChildrenStore>()(
  persist(
    (set, get) => ({
      children: [],
      activeChildId: null,
      setChildren: (children) =>
        set({
          children,
          activeChildId: children.length > 0 ? (get().activeChildId ?? children[0].id) : null,
        }),
      addChild: (child) =>
        set((s) => ({
          children: [...s.children, child],
          activeChildId: s.activeChildId ?? child.id,
        })),
      updateChild: (id, updates) =>
        set((s) => ({
          children: s.children.map((c) => (c.id === id ? { ...c, ...updates } : c)),
        })),
      setActiveChild: (id) => set({ activeChildId: id }),
      getActiveChild: () => {
        const { children, activeChildId } = get();
        return children.find((c) => c.id === activeChildId) ?? children[0] ?? null;
      },
    }),
    {
      name: "growthos-children",
      storage: createJSONStorage(() => localStorage),
    }
  )
);

// ─── Notifications Store ──────────────────────────────────
interface NotificationsStore {
  notifications: Notification[];
  unreadCount: number;
  setNotifications: (notifications: Notification[]) => void;
  markRead: (id: string) => void;
  markAllRead: () => void;
  addNotification: (n: Notification) => void;
}

export const useNotificationsStore = create<NotificationsStore>()((set) => ({
  notifications: [],
  unreadCount: 0,
  setNotifications: (notifications) =>
    set({
      notifications,
      unreadCount: notifications.filter((n) => !n.is_read).length,
    }),
  markRead: (id) =>
    set((s) => {
      const notifications = s.notifications.map((n) =>
        n.id === id ? { ...n, is_read: true } : n
      );
      return { notifications, unreadCount: notifications.filter((n) => !n.is_read).length };
    }),
  markAllRead: () =>
    set((s) => ({
      notifications: s.notifications.map((n) => ({ ...n, is_read: true })),
      unreadCount: 0,
    })),
  addNotification: (n) =>
    set((s) => ({
      notifications: [n, ...s.notifications],
      unreadCount: s.unreadCount + (n.is_read ? 0 : 1),
    })),
}));

// ─── UI Store ─────────────────────────────────────────────
interface UIStore {
  sidebarCollapsed: boolean;
  onboardingStep: number;
  setSidebarCollapsed: (v: boolean) => void;
  toggleSidebar: () => void;
  setOnboardingStep: (step: number) => void;
}

export const useUIStore = create<UIStore>()(
  persist(
    (set) => ({
      sidebarCollapsed: false,
      onboardingStep: 0,
      setSidebarCollapsed: (sidebarCollapsed) => set({ sidebarCollapsed }),
      toggleSidebar: () => set((s) => ({ sidebarCollapsed: !s.sidebarCollapsed })),
      setOnboardingStep: (onboardingStep) => set({ onboardingStep }),
    }),
    {
      name: "growthos-ui",
      storage: createJSONStorage(() => localStorage),
    }
  )
);
