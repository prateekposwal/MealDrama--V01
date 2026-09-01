// ─────────────────────────────────────────────────────────────────────────────
// Notification Store — Central notification system for MealDrama
// Supports: meal reminders, swap alerts, new-user tips, plan notices, cook share
// Persisted via Zustand + nativeStorage. Browser Notification API for live push.
// ─────────────────────────────────────────────────────────────────────────────

import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { nanoid } from 'nanoid';
import { nativeStorage } from '../../app/utils/nativeStorage';

export type NotificationType =
  | 'meal_reminder'
  | 'swap_reminder'
  | 'new_user_guide'
  | 'plan_ending'
  | 'meal_changed'
  | 'cook_share'
  | 'tip'
  | 'pantry_reminder'
  | 'pantry_low'
  | 'pantry_expired'
  | 'pantry_buy'
  // household feed (shared plan / purchases / permissions / requests)
  | 'family_request'
  | 'family_activity';

export interface AppNotification {
  id: string;
  type: NotificationType;
  title: string;
  message: string;
  timestamp: number;
  read: boolean;
  action?: { label: string; route?: string };
}

interface NotificationState {
  notifications: AppNotification[];
  enabled: boolean;
  browserEnabled: boolean;
  lastSeenGuide: number; // timestamp when user last saw guide notifications
  addNotification: (n: Omit<AppNotification, 'id' | 'timestamp' | 'read'>) => void;
  markRead: (id: string) => void;
  markAllRead: () => void;
  clearNotification: (id: string) => void;
  clearAll: () => void;
  setEnabled: (v: boolean) => void;
  setBrowserEnabled: (v: boolean) => void;
  requestBrowserPermission: () => void;
  unreadCount: () => number;
  recentByType: (type: NotificationType, withinMs?: number) => AppNotification[];
}

const NOTIF_PERSIST_KEY = 'mealdrama-notifications';

export const useNotificationStore = create<NotificationState>()(
  persist(
    (set, get) => ({
      notifications: [],
      enabled: true,
      browserEnabled: false,
      lastSeenGuide: 0,

      addNotification: (n) => {
        const id = `notif_${nanoid(12)}`;
        const notification: AppNotification = {
          ...n,
          id,
          timestamp: Date.now(),
          read: false,
        };
        set((s) => ({
          notifications: [notification, ...s.notifications].slice(0, 50),
        }));

        // Browser notification if enabled and permission granted
        const state = get();
        if (state.browserEnabled && typeof Notification !== 'undefined' && Notification.permission === 'granted') {
          new Notification(n.title, { body: n.message, icon: '/logo.png' });
        }
      },

      markRead: (id) =>
        set((s) => ({
          notifications: s.notifications.map((n) =>
            n.id === id ? { ...n, read: true } : n
          ),
        })),

      markAllRead: () =>
        set((s) => ({
          notifications: s.notifications.map((n) => ({ ...n, read: true })),
        })),

      clearNotification: (id) =>
        set((s) => ({
          notifications: s.notifications.filter((n) => n.id !== id),
        })),

      clearAll: () => set({ notifications: [] }),

      setEnabled: (v) => set({ enabled: v }),

      setBrowserEnabled: (v) => set({ browserEnabled: v }),

      requestBrowserPermission: () => {
        if (typeof Notification === 'undefined') return;
        if (Notification.permission === 'granted') {
          set({ browserEnabled: true });
          return;
        }
        if (Notification.permission === 'denied') return;
        Notification.requestPermission().then((result) => {
          set({ browserEnabled: result === 'granted' });
        });
      },

      unreadCount: () => get().notifications.filter((n) => !n.read).length,

      recentByType: (type, withinMs = 60000) => {
        const now = Date.now();
        return get().notifications.filter(
          (n) => n.type === type && now - n.timestamp < withinMs
        );
      },
    }),
    {
      name: NOTIF_PERSIST_KEY,
      storage: nativeStorage,
      partialize: (state) => ({
        notifications: state.notifications,
        enabled: state.enabled,
        browserEnabled: state.browserEnabled,
        lastSeenGuide: state.lastSeenGuide,
      }),
    }
  )
);
