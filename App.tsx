import React, { useState, useEffect, Suspense, useMemo, useRef, useCallback } from 'react';
import { useStore } from './app/store/useStore';
import { useTrayStore, seedTodayFromTray } from './plan/store/useTrayStore';
import { usePantryStore } from './app/store/pantryStore';
import { useLoopStore } from './plan/store/useLoopStore';
import { healTrayDietGaps } from './utils/dietHeal';
import { useHouseholdFeedStore } from './plan/store/householdFeedStore';
import { useHouseholdKitchenStore } from './plan/store/householdKitchenStore';
import api, { setAuthReady } from './lib/api';
import { getMe } from './app/utils/authApi';
import { X } from 'lucide-react';
import { useBackendDishes } from './hooks/useBackendDishes';
import { spiceLevelFromNumber } from './utils/formatSpice';
import { SwapCustomizeProvider } from './components/meal/SwapCustomizeModalContext';
import { ErrorBoundary } from './components/new/ErrorBoundary';
import { OfflineBanner } from './components/new/OfflineBanner';
import { enqueue } from './app/utils/offlineQueue';
import { DashboardSkeleton, PlanScreenSkeleton, PantryPulseSkeleton, ProfileSkeleton } from './components/new/ScreenSkeletons';
import type { Dish } from './meal/constants/dishLibrary';
import { DISH_LIBRARY } from './meal/constants/dishLibrary';
import type { SourcePool } from './plan/utils/mealLoopEngine';
import type { Meal, MealLoopConfig } from './types/tray';
import { getISODate } from './utils/dateUTC';
import { NotificationCenter, checkMealReminder, checkPlanEnding, checkPantryNeeds, startNewUserGuide, useNotificationStore } from './app/notifications';
import { Toast } from './components/new/Toast';
import { TabBar, type Tab } from './components/new/TabBar';
import { useBackNavigation } from './hooks/useBackNavigation';
import { getRegionKey } from './utils/dishSearch';
import { isPureSweetDish } from './meal/constants/pairingCatalog';
import { pickDietRepresentativesWithSlots, distinctiveTypeFor, dietDeficitBySlot, allowedTypesForDiet, keepRegionTrayItems } from './utils/dietQuota';
import { buildEnrichedLoopPool, poolTargetForCycleLength, healthMatchFor } from './utils/loopPool';

const getDishLibrary = () => import('./meal/constants/dishLibrary').then(m => m.DISH_LIBRARY);

// Legacy-clone purge: older builds seeded the same dish under different ids
// (style-expanded clones) — "Yakhni ×2" in the tray. Keep first per name,
// via a proper setState so the persist middleware writes it back.
const purgeTrayClones = () => {
  const norm = (s: string) => (s || '').trim().toLowerCase();
  useStore.setState((s) => {
    let changed = false;
    const next: typeof s.trayLibrary = { ...s.trayLibrary };
    for (const slotKey of ['breakfast', 'lunch', 'snacks', 'dinner'] as const) {
      const tray = s.trayLibrary[slotKey] || [];
      const seen = new Set<string>();
      const deduped = tray.filter(m => {
        const n = norm(m.name);
        if (seen.has(n)) return false;
        seen.add(n);
        return true;
      });
      if (deduped.length !== tray.length) {
        changed = true;
        next[slotKey] = deduped;
      }
    }
    return changed ? { trayLibrary: next } : {};
  });
};

// Stale-loop sanitize: queues built by the old modulo-wrap code contain the
// same dish multiple times, and old assignments repeat dishes within a day.
// Keep-first per (slot, name) in the queue and per (date, name) in
// assignments so legacy persisted data heals itself on startup.
const TRAY_SLOT_CAP = 6;
const PLAN_SLOT_CAP = 6;
/** Per-slot minimum × representatives for distinctive diets (the "more eggs" bar). */
const DIET_REP_TARGET = 2;
const purgeTrayOverflow = () => {
  useStore.setState((s) => {
    let changed = false;
    const next: typeof s.trayLibrary = { ...s.trayLibrary };
    for (const slotKey of ['breakfast', 'lunch', 'snacks', 'dinner'] as const) {
      const tray = s.trayLibrary[slotKey] || [];
      // Cap keep-first — legacy builds stacked distinct dishes across
      // repeated rebuilds (13-lunch trays).
      if (tray.length > TRAY_SLOT_CAP) { changed = true; next[slotKey] = tray.slice(0, TRAY_SLOT_CAP); }
    }
    return changed ? { trayLibrary: next } : {};
  });
};
const purgePlanDayDupes = () => {
  try {
    useTrayStore.setState((s: any) => {
      const days = s.plan?.days;
      if (!days || Object.keys(days).length === 0) return {};
      let changed = false;
      const nextDays: any = {};
      for (const date of Object.keys(days)) {
        const day = days[date];
        if (!day) continue;
        const nextDay: any = {};
        for (const slot of ['breakfast', 'lunch', 'snacks', 'dinner'] as const) {
          const items = day[slot] || [];
          const seen = new Set<string>();
          const kept = items.filter((m: any) => {
            const n = (m.name || m.title || '').trim().toLowerCase();
            if (n && seen.has(n)) return false;
            if (n) seen.add(n);
            return true;
          }).slice(0, PLAN_SLOT_CAP);
          if (kept.length !== items.length) { changed = true; nextDay[slot] = kept; }
        }
        if (Object.keys(nextDay).length > 0) nextDays[date] = { ...day, ...nextDay };
      }
      if (!changed) return {};
      return { plan: { ...s.plan, days: { ...days, ...nextDays } } };
    });
  } catch (e) {
    console.warn('[App] purgePlanDayDupes skipped:', e);
  }
};
// Diet-violation purge: a veg user must never see non-veg in their week.
// Persisted loop queues/assignments from older configs (or family accepts)
// can hold diet-invalid dishes — drop them so plans respect the CURRENT diet.
const purgeLoopDietViolations = () => {
  try {
    const { mealLoop } = useLoopStore.getState() as any;
    const allowed = allowedTypesForDiet(useStore.getState().user?.diet);
    if (!mealLoop || (!mealLoop.rotationQueue?.length && !mealLoop.assignments?.length)) return;
    const typeOf = (id?: string) => (id ? DISH_LIBRARY.find(d => d.id === id)?.type : undefined);
    const queue = (mealLoop.rotationQueue || []).filter((q: any) => !q.dishId || allowed.includes(typeOf(q.dishId) ?? 'x-no-type'));
    const assignments = (mealLoop.assignments || []).filter((a: any) => !a.dishId || allowed.includes(typeOf(a.dishId) ?? 'x-no-type'));
    if (queue.length !== (mealLoop.rotationQueue || []).length || assignments.length !== (mealLoop.assignments || []).length) {
      useLoopStore.setState((s: any) => ({
        mealLoop: { ...s.mealLoop, rotationQueue: queue, assignments },
      }));
      console.log('[App] purgeLoopDietViolations: removed diet-invalid loop rows');
    }
  } catch (e) {
    console.warn('[App] purgeLoopDietViolations skipped:', e);
  }
};

const purgeLoopDupes = () => {
  const norm = (s: string) => (s || '').trim().toLowerCase();
  try {
    const { mealLoop } = useLoopStore.getState() as any;
    if (!mealLoop?.config && !(mealLoop?.rotationQueue?.length)) return;
    let queueChanged = false;
    const qKeys = new Set<string>();
    const dedupedQueue: any[] = [];
    for (const q of mealLoop.rotationQueue || []) {
      // Same slot+name (variant clones) or same slot+id (old wrap bug) → dup.
      const kName = `${q.mealType}:${norm(q.dishName)}`;
      const kId = `${q.mealType}:${q.dishId}`;
      if (qKeys.has(kName) || qKeys.has(kId)) { queueChanged = true; continue; }
      qKeys.add(kName); qKeys.add(kId);
      dedupedQueue.push(q);
    }
    let assignmentsChanged = false;
    const aSeen = new Set<string>();
    const dedupedAssignments: any[] = [];
    for (const a of mealLoop.assignments || []) {
      const k = `${a.date}:${a.mealType}:${norm(a.dishName)}`;
      if (aSeen.has(k)) { assignmentsChanged = true; continue; }
      aSeen.add(k);
      dedupedAssignments.push(a);
    }
    if (queueChanged || assignmentsChanged) {
      const nextIndex = Math.min(mealLoop.next_index || 0, dedupedQueue.length);
      const nextPointer = Math.min(mealLoop.rotationPointer || 0, dedupedQueue.length);
      useLoopStore.setState({
        mealLoop: { ...mealLoop, rotationQueue: dedupedQueue, assignments: dedupedAssignments, next_index: nextIndex, rotationPointer: nextPointer },
      });
    }
  } catch (e) {
    console.warn('[App] purgeLoopDupes skipped:', e);
  }
};

const DashScreen = React.lazy(() => import('./screens/Dashboard'));
const PlanScreen = React.lazy(() => import('./screens/PlanScreen'));
const Profile = React.lazy(() => import('./components/new/Profile'));
const PantryPulse = React.lazy(() => import('./components/new/PantryPulse'));
const LoginScreen = React.lazy(() => import('./components/new/LoginScreen'));
const FlashOnboarding = React.lazy(() => import('./components/new/FlashOnboarding'));
const MealTrayBuilder = React.lazy(() => import('./screens/MealTrayBuilder'));
const MealLoopConfigModal = React.lazy(() => import('./components/meal/MealLoopConfigModal'));

const App: React.FC = () => {
  const {
    isLoggedIn, authReady, user,
    login, updateProfile, logout, setDishes, setSwap, toast, setToast,
    trayBuilt, setTrayBuilt,
  } = useStore();
  const { quickSetupOpen, quickSetupPrefill, openQuickSetup, closeQuickSetup } = useStore();
  const { dishes: fetchedDishes } = useBackendDishes();

  // ─── ALL hooks must be before any conditional return (Rules of Hooks) ──
  const [isHydrated, setIsHydrated] = useState(false);
  const _rehydrateAttempted = useRef(false);
  const _trayLibrary = useStore(s => s.trayLibrary);
  const planDays = useTrayStore(s => s.plan.days);
  const today = getISODate();
  const sourcePool = useMemo((): SourcePool => {
    const pool: SourcePool = { breakfast: [], lunch: [], snacks: [], dinner: [] };
    const seen = { breakfast: new Set<string>(), lunch: new Set<string>(), snacks: new Set<string>(), dinner: new Set<string>() };
    for (const mt of ['breakfast', 'lunch', 'snacks', 'dinner'] as const) {
      for (const item of planDays[today]?.[mt] ?? _trayLibrary[mt] ?? []) {
        const itemId = 'meal_id' in item ? item.meal_id : item.dishId;
        const dish = fetchedDishes.find((d: Dish) => d.id === itemId)
          ?? fetchedDishes.find((d: Dish) => d.name === item.name);
        if (dish && !seen[mt].has(dish.id)) {
          seen[mt].add(dish.id);
          pool[mt].push(dish);
        }
      }
    }
    return pool;
  }, [planDays, today, _trayLibrary, fetchedDishes]);
  const { applyLoopConfig } = useLoopStore();
  const trayEditSession = useStore(s => s.trayEditSession);
  const [activeTab, setActiveTab] = useState<string>('dashboard');
  const [manageTray, setManageTray] = useState(false);
  const [manageTraySlot, setManageTraySlot] = useState<string | undefined>(undefined);
  const [showLoopConfig, setShowLoopConfig] = useState(false);
  const [cycleEndNudge, setCycleEndNudge] = useState<{ lastDate: string; daysLeft: number } | null>(null);
  const mainRef = useRef<HTMLElement>(null);

  // ─── Back navigation ───
  const { navStack, pushNav, goBack } = useBackNavigation(activeTab, setActiveTab, setToast);

  // Listen for navigation events from screens without direct onNavigate prop
  useEffect(() => {
    const handler = () => setActiveTab('profile');
    window.addEventListener('navigate:profile', handler);
    const navHandler = (e: Event) => {
      const detail = (e as CustomEvent).detail;
      if (detail?.tab) setActiveTab(detail.tab);
    };
    window.addEventListener('navigate-to', navHandler);
    return () => {
      window.removeEventListener('navigate:profile', handler);
      window.removeEventListener('navigate-to', navHandler);
    };
  }, []);

  // Focus management on tab change for accessibility
  useEffect(() => {
    mainRef.current?.focus({ preventScroll: true });
  }, [activeTab]);

  // Hydration detection — Zustand 5 hydrates automatically on store creation
  useEffect(() => {
    let cancelled = false;
    let unsub1: (() => void) | undefined;
    let unsub2: (() => void) | undefined;
    let timeoutId: ReturnType<typeof setTimeout> | undefined;

    const checkBoth = () => {
      if (!cancelled) {
        if (timeoutId) clearTimeout(timeoutId);
        purgeTrayClones();
        purgeTrayOverflow();
        purgeLoopDupes();
        purgeLoopDietViolations();
        purgePlanDayDupes();
        seedTodayFromTray();
        // Heal stale trays: rebuild-time quota fixes never reached installs
        // hydrated BEFORE those fixes (trays with zero egg dishes persist).
        void healTrayDietGaps();
        const hhId = useStore.getState().householdId;
        if (hhId) useStore.getState().refreshHousehold();
        setIsHydrated(true);
      }
    };

    // Safety timeout: force hydration after 3s even if stores haven't finished
    timeoutId = setTimeout(() => {
      console.warn('[App] Hydration timeout — forcing render after 3s');
      checkBoth();
    }, 3000);

    const store1Ready = useStore.persist.hasHydrated();
    const store2Ready = useTrayStore.persist.hasHydrated();

    if (store1Ready && store2Ready) {
      checkBoth();
      return;
    }

    if (!store1Ready) {
      unsub1 = useStore.persist.onFinishHydration(() => {
        if (useTrayStore.persist.hasHydrated()) checkBoth();
      });
    }

    if (!store2Ready) {
      unsub2 = useTrayStore.persist.onFinishHydration(() => {
        if (useStore.persist.hasHydrated()) checkBoth();
      });
    }

    return () => {
      cancelled = true;
      unsub1?.();
      unsub2?.();
      if (timeoutId) clearTimeout(timeoutId);
    };
  }, []);

  // RECOVERY: If Zustand state is empty but storage has data, force rehydrate (once)
  useEffect(() => {
    if (isHydrated && !isLoggedIn && !_rehydrateAttempted.current) {
      const raw = localStorage.getItem('mealdrama-store');
      if (raw) {
        console.warn('[App] Zustand state empty but storage has data. Forcing rehydrate.');
        _rehydrateAttempted.current = true;
        useStore.persist.rehydrate();
      }
    }
  }, [isHydrated, isLoggedIn]);

  // OAuth callback: handle Google Sign-In token from URL
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const token = params.get('token');
    if (token) {
      // Store the token and fetch user data
      useStore.setState({ token });
      // Clean the URL
      window.history.replaceState({}, '', '/');
      // Fetch user from token
      import('./app/utils/authApi').then(({ getMe }) => {
        getMe().then((res: any) => {
          if (res?.data?.user) {
            useStore.setState({
              user: res.data.user,
              isLoggedIn: true,
            });
          }
        }).catch((err) => {
          console.warn('[App] getMe after OAuth failed:', err);
        });
      });
    }
  }, []);

  // TITLE MIGRATION: Strip ` + ` from all persisted meal titles (one-time)
  useEffect(() => {
    if (!isHydrated) return;
    const raw = localStorage.getItem('mealdrama-store');
    if (!raw) return;
    try {
      const store = JSON.parse(raw);
      let mutated = false;
      const days = store.state?.plan?.days;
      if (days) {
        for (const date of Object.keys(days)) {
            for (const mealType of Object.keys(days[date])) {
            const meals = days[date][mealType as keyof typeof days[string]];
            if (!meals) continue;
            for (const meal of meals) {
              if (meal.title && meal.title.includes(' + ') && meal.name && !meal.title.includes(meal.name)) {
                meal.title = meal.title.replace(/ \+ /g, ' ');
                mutated = true;
              }
            }
          }
        }
      }
      if (mutated) {
        localStorage.setItem('mealdrama-store', JSON.stringify(store));
        console.log('[Migration] Stripped + from persisted meal titles');
      }
    } catch {}
  }, [isHydrated]);

  // RESTORE: Verify token on startup by calling GET /auth/me
  const _authMeVerified = useRef(false);
  useEffect(() => {
    if (!isHydrated || !isLoggedIn) return;
    const token = useStore.getState().token;
    if (!token) return;
    if (_authMeVerified.current) return;
    _authMeVerified.current = true;
    getMe().then(serverUser => {
      if (!serverUser) {
        useStore.getState().clearToken();
      } else if (typeof serverUser.name === 'string' && serverUser.name) {
        updateProfile({ username: serverUser.name as string });
      }
    });
  }, [isHydrated, isLoggedIn, updateProfile]);

  // REGION-CHANGE RESEED — dropping/re-seeding isn't manual anymore. On region
  // edit: drop far-region tray leftovers, heal reps for the new region, toast.
  const _prevRegion = useRef<string | null>(user?.region ?? null);
  useEffect(() => {
    const cur = user?.region;
    if (cur && _prevRegion.current && _prevRegion.current !== cur) {
      const newKey = getRegionKey(cur) || 'north';
      useStore.setState((s: any) => ({ trayLibrary: keepRegionTrayItems(s.trayLibrary, newKey) as any }));
      void healTrayDietGaps(true);
      useStore.getState().refreshHousehold();
      setToast({ message: 'Region updated — tray reseeded for your cuisine', type: 'success' });
    }
    _prevRegion.current = cur ?? null;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.region]);

  // GRACEFUL session expiry: a routine save/sync 401 signals 'auth:unauthorized'
  // WITHOUT nuking the app (closing a meal card used to bounce to login). Revalid
  // ately via getMe(); only a CONFIRMED stale/revoked token logs out.
  useEffect(() => {
    if (!isHydrated) return;
    const onUnauthorized = async () => {
      setToast({ message: 'Reconnecting — verifying session…', type: 'info' });
      const serverUser = await getMe().catch(() => null);
      if (!serverUser) {
        useStore.getState().clearToken();
        setToast({ message: 'Session expired — please log in again', type: 'error' });
      }
    };
    window.addEventListener('auth:unauthorized', onUnauthorized as any);
    return () => window.removeEventListener('auth:unauthorized', onUnauthorized as any);
  }, [isHydrated, setToast]);

  // HOUSEHOLD FEED — poll shared requests + activity while a household is active.
  // Powers the member-request strip, shared pantry purchase feed and the
  // notification DOTS (every dot connected to a real household event).
  useEffect(() => {
    if (!isHydrated) return;
    const refreshFeed = () => {
      const hhId = useStore.getState().householdId;
      if (hhId) {
        void useHouseholdFeedStore.getState().refresh(hhId);
        void useHouseholdKitchenStore.getState().refresh(hhId);
      }
    };
    refreshFeed();
    const iv = setInterval(refreshFeed, 30000);
    window.addEventListener('loop_updated', refreshFeed);
    window.addEventListener('pantry:invalidate', refreshFeed);
    window.addEventListener('household:refresh', refreshFeed);
    window.addEventListener('family:refresh', refreshFeed);
    return () => {
      clearInterval(iv);
      window.removeEventListener('loop_updated', refreshFeed);
      window.removeEventListener('pantry:invalidate', refreshFeed);
      window.removeEventListener('household:refresh', refreshFeed);
      window.removeEventListener('family:refresh', refreshFeed);
    };
  }, [isHydrated]);

  // ─── Cycle-end nudge: toast when loop has ≤3 days of assignments left ───
  useEffect(() => {
    const check = () => {
      const ml = useLoopStore.getState().mealLoop;
      if (!ml.config || ml.assignments.length === 0) {
        setCycleEndNudge(null);
        return;
      }
      const lastDismiss = localStorage.getItem('cycle_end_nudge_dismiss_at');
      if (lastDismiss && Date.now() - parseInt(lastDismiss) < 7 * 24 * 60 * 60 * 1000) return;
      if (showLoopConfig) return;

      let lastDate = '';
      for (const a of ml.assignments) {
        if (a.date > lastDate) lastDate = a.date;
      }
      if (!lastDate) return;

      const diff = Math.ceil((new Date(lastDate).getTime() - new Date(getISODate()).getTime()) / (1000 * 60 * 60 * 24));
      if (diff >= 0 && diff <= 3) {
        setCycleEndNudge({ lastDate, daysLeft: diff });
      } else {
        setCycleEndNudge(null);
      }
    };
    check();
    let prevMealLoop = useLoopStore.getState().mealLoop;
    const unsub = useLoopStore.subscribe(() => {
      const current = useLoopStore.getState().mealLoop;
      if (current !== prevMealLoop) {
        prevMealLoop = current;
        check();
      }
    });
    return unsub;
  }, [showLoopConfig]);

  // ─── Notification triggers: periodic checks ───
  useEffect(() => {
    const check = () => {
      const ml = useLoopStore.getState().mealLoop;
      if (ml.config) {
        checkPlanEnding(ml.config.startDate, ml.config.cycleLength);
      }
      const today = getISODate();
      const trayStore = useTrayStore.getState();
      checkMealReminder(today, trayStore.getMeals);
      // Pantry grocery check after dinner time
      try {
        const pantryState = usePantryStore.getState();
        if (pantryState.checkedItems) {
          const unchecked = Object.values(pantryState.checkedItems).filter(v => !v).length;
          if (unchecked > 0) checkPantryNeeds(unchecked);
        }
      } catch {}
    };
    check();
    const interval = setInterval(check, 60000);
    return () => clearInterval(interval);
  }, []);

  // ─── Request browser notification permission on first visit ───
  useEffect(() => {
    if (isLoggedIn && typeof Notification !== 'undefined' && Notification.permission === 'default') {
      const timer = setTimeout(() => useNotificationStore.getState().requestBrowserPermission(), 10000);
      return () => clearTimeout(timer);
    }
  }, [isLoggedIn]);

  const handleDismissNudge = useCallback(() => {
    localStorage.setItem('cycle_end_nudge_dismiss_at', String(Date.now()));
    setCycleEndNudge(null);
  }, []);

  const handleExtendNudge = useCallback(() => {
    setCycleEndNudge(null);
    setShowLoopConfig(true);
  }, []);

  const formatDate = useCallback((iso: string) => {
    const d = new Date(iso);
    return d.toLocaleDateString('en-IN', { weekday: 'short', day: 'numeric', month: 'short', timeZone: 'Asia/Kolkata' });
  }, []);

  // ═══ All hooks above — early returns below ═══

  console.log('[App] Rendering, isLoggedIn:', isLoggedIn, 'user:', !!user, 'user.region:', user?.region);

  if (!isHydrated) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen gap-4 px-6">
        <div className="w-8 h-8 border-2 border-[#FF385C] border-t-transparent rounded-full animate-spin" />
        <p className="text-sm font-medium text-gray-400 text-center">Loading your meal plan…</p>
      </div>
    );
  }

  // M6: Removed duplicate online listener — useStore and useTrayStore already
  // handle offline queue sync on reconnect. Adding a third listener caused
  // triple drain attempts on every reconnect.

  // Inline onboarding flow from Profile (Edit Mode)
  if (quickSetupOpen) {
    return (
      <Suspense fallback={
        <div className="min-h-screen bg-white flex items-center justify-center">
          <div className="w-8 h-8 border-2 border-[#FF385C] border-t-transparent rounded-full animate-spin" />
        </div>
      }>
        <FlashOnboarding
          isEditMode={true}
          prefill={quickSetupPrefill as unknown as { region?: string; diet?: string; spiceLevel?: number; plannedSlots?: ("Breakfast" | "Lunch" | "Snacks" | "Dinner")[]; cookContact?: string; } | undefined}
          onComplete={async (payload) => {
            try {
              updateProfile({
                region: payload.region,
                diet: payload.diet as "veg" | "non-veg" | "vegan" | "eggitarian" | undefined,
                spiceLevel: spiceLevelFromNumber(payload.spiceLevel),
                cookContact: payload.cookContact,
                plannedSlots: payload.plannedSlots,
                onboardingComplete: true,
              });
            } catch (e) {
              console.error('[App] Edit mode onboarding error:', e);
            }
            setAuthReady(true);
            closeQuickSetup();
          }}
        />
      </Suspense>
    );
  }

  // FIX 4: Gate navigation behind authReady — prevents premature rendering
  // before hydration + login state is stable
  if (!authReady) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen gap-4 px-6">
        <div className="w-8 h-8 border-2 border-[#FF385C] border-t-transparent rounded-full animate-spin" />
        <p className="text-sm font-medium text-gray-400 text-center">Preparing your kitchen…</p>
      </div>
    );
  }

  if (!isLoggedIn) {
    return <Suspense fallback={
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-[#FF385C] border-t-transparent rounded-full animate-spin" />
      </div>
    }>
      <LoginScreen onLogin={async (username) => {
      console.log('[App] onLogin called, username:', username);
      // FIX: Use atomic login function and flush persistence immediately
      login(username);
      
      // VERIFY: Check if data actually saved
      const saved = localStorage.getItem('mealdrama-store');
      if (!saved) {
        console.error('[App] CRITICAL: Login data NOT saved to localStorage!');
        setToast({ message: 'Storage error: Data not saved.', type: 'error' });
      } else {
        console.log('[App] Login data verified in storage.');
      }
      // Re-run the diet heal AFTER login — at startup it may have run before
      // auth hydrated (user null → heal bails). A logged-in user must get
      // their diet reps (eggs in north snacks, etc.) without a restart.
      void healTrayDietGaps(true);
    }} />
    </Suspense>;
  }

  const hasRegion = !!(user?.region);
  const onboardingComplete = user?.onboardingComplete ?? false;
  if (!hasRegion || onboardingComplete !== true) {
    return (
      <Suspense fallback={
        <div className="min-h-screen bg-white flex items-center justify-center">
          <div className="w-8 h-8 border-2 border-[#FF385C] border-t-transparent rounded-full animate-spin" />
        </div>
      }>
        <FlashOnboarding
          onComplete={async (preferences) => {
            try {
              console.log('[App] Onboarding complete, calling updateProfile');
              updateProfile({
                region: preferences.region,
                 diet: preferences.diet as "veg" | "non-veg" | "vegan" | "eggitarian" | undefined,
                spiceLevel: spiceLevelFromNumber(preferences.spiceLevel),
                cookContact: preferences.cookContact,
                plannedSlots: preferences.plannedSlots,
                onboardingComplete: true,
                goal: user?.goal || 'Weekly',
                healthGoals: [preferences.healthGoal],
              });
              console.log('[App] Onboarding data persisted');

              // Phase 3: Auto-seed tray with 1 dish per slot + default loop
              const regionKey = getRegionKey(preferences.region) || 'north';
              const dietPref = preferences.diet || 'Veg';
              const dietTypes: Record<string, string[]> = {
                'Veg': ['veg', 'vegan'], 'Eggitarian': ['veg', 'vegan', 'eggitarian'],
                'Non-Veg': ['veg', 'non-veg', 'vegan', 'eggitarian'], 'Vegan': ['vegan'],
              };
              const allowedTypes = dietTypes[dietPref] || ['veg'];
              // Priority order for sorting: exact match first, then close match
              const dietPriority: Record<string, number> = {};
              if (dietPref === 'Eggitarian') {
                dietPriority['eggitarian'] = 0; dietPriority['egg'] = 0;
                dietPriority['veg'] = 1; dietPriority['vegan'] = 2;
              } else if (dietPref === 'Non-Veg') {
                dietPriority['non-veg'] = 0; dietPriority['eggitarian'] = 1;
                dietPriority['egg'] = 1; dietPriority['veg'] = 2; dietPriority['vegan'] = 3;
              } else if (dietPref === 'Veg') {
                dietPriority['veg'] = 0; dietPriority['vegan'] = 1;
              } else if (dietPref === 'Vegan') {
                dietPriority['vegan'] = 0; dietPriority['veg'] = 1;
              }
              const today = getISODate();
              const trayState = useStore.getState();
              const trayStore = useTrayStore.getState();

              const seededDishes: Dish[] = [];
              const usedFirstIds = new Set<string>(); // same-day cross-slot dedup (ids AND names — variants share base names)
              const usedSlotNames = new Set<string>(); // cross-slot DIVERSITY: lunch shouldn't mirror dinner
              const normName = (s: string) => (s || '').trim().toLowerCase();
              const library = await getDishLibrary();
              const distType = distinctiveTypeFor(dietPref);
              // Rebuild semantics: REPLACE, not append — repeated setups must
              // not stack onto pools from earlier runs (trays hit 13 lunches).
              useStore.setState({
                trayLibrary: { breakfast: [], lunch: [], snacks: [], dinner: [] },
              });
              useTrayStore.setState((s: any) => ({
                plan: { ...s.plan, days: { ...s.plan.days, [today]: { breakfast: [], lunch: [], snacks: [], dinner: [] } } },
              }));
              purgeTrayClones();
              for (const slot of preferences.plannedSlots) {
                const slotKey = slot.toLowerCase() as 'breakfast' | 'lunch' | 'dinner' | 'snacks';
                const candidates = library.filter(d =>
                  (d.region === regionKey || d.region === 'all') &&
                  d.category.includes(slotKey as any) &&
                  allowedTypes.includes(d.type) &&
                  !isPureSweetDish(d)
                ).sort((a, b) => {
                  const aPrio = dietPriority[(a.diet||a.type||'').toLowerCase()] ?? 99;
                  const bPrio = dietPriority[(b.diet||b.type||'').toLowerCase()] ?? 99;
                  // Diet leads; health focus breaks the tie so today's plan's
                  // seed dish also leans toward the user's wellness goal.
                  return aPrio - bPrio || healthMatchFor(preferences.healthGoal)(b) - healthMatchFor(preferences.healthGoal)(a);
                });
                // Pick up to 5 dishes per slot — diet-matched first, and
                // preferring dishes no earlier slot already took (lunch must
                // not mirror dinner when both pools share 'all' dishes).
                const fresh = candidates.filter(d => !usedSlotNames.has(normName(d.name)));
                const selected = (fresh.length >= 5 ? fresh : [...fresh, ...candidates.filter(d => !fresh.includes(d))]).slice(0, 5);
                for (const dish of selected) {
                  seededDishes.push(dish);
                  usedSlotNames.add(normName(dish.name));
                  trayState.addToTray(slotKey, {
                    id: dish.id, dishId: dish.id, name: dish.name,
                    icon: dish.icon, sourceRegion: dish.region,
                  });
                }
                // Add the first dish to today's meal (diet-prioritized, never
                // repeating a dish already seeded into another slot today —
                // prevents Bhindi Masala at both lunch AND dinner)
                const first = selected.find(d => !usedFirstIds.has(d.id) && !usedFirstIds.has(normName(d.name))) ?? selected[0];
                if (first) {
                  usedFirstIds.add(first.id);
                  usedFirstIds.add(normName(first.name));
                  usedSlotNames.add(normName(first.name));
                  const firstVariant = first.variants?.[0];
                  trayStore.addMealToSlot(today, slotKey, {
                    id: first.id, name: first.name, icon: first.icon, region: first.region as Meal['region'],
                  }, firstVariant ? { variantId: firstVariant.id, variant: firstVariant.name } : undefined);
                }
              }

              // Diet representation quota (ALL diets, PER-SLOT target):
              // breakfast's eggs once satisfied a GLOBAL deficit of 3 while
              // dinner/snacks starved (the sparse-plan bug). Now compute the
              // deficit per planned slot: each slot must reach 2 representatives.
              // Reps enrich the TRAY only — the plan defaults to ONE card (the
              // diet-prioritized `first` above). The startup heal's plan-wide
              // presence pass adds a diet card to a slot whose regional pick
              // genuinely had none, WITHOUT doubling a diet-first slot.
              const poolsBySlot = { breakfast: [], lunch: [], snacks: [], dinner: [] } as any;
              for (const d of seededDishes) {
                for (const c of (d.category ?? [])) {
                  const k = c.toLowerCase();
                  if (k in poolsBySlot) poolsBySlot[k].push(d);
                }
              }
              const perSlot = dietDeficitBySlot(poolsBySlot, distType, DIET_REP_TARGET);
              const reps = pickDietRepresentativesWithSlots(library, {
                distType,
                regionKey,
                minCount: Math.min(perSlot.total, 8),
                excludeNames: usedSlotNames,
                plannedSlots: preferences.plannedSlots,
              });
              for (const { dish, slot } of reps) {
                seededDishes.push(dish);
                usedSlotNames.add(normName(dish.name));
                if (!slot) continue;
                trayState.addToTray(slot, {
                  id: dish.id, dishId: dish.id, name: dish.name,
                  icon: dish.icon, sourceRegion: dish.region,
                });
              }
              setTrayBuilt(true);

              // Build source pool from seeded dishes + apply default loop config.
              // Tray items lead (user's curated picks), then the pool is ENRICHED
              // with more diet-allowed region dishes (to the cycle-scaled slot
              // target: 5 for the 7-day default) so a 7-day rotation actually
              // varies — a pool capped at the 6-item tray repeated the same 5
              // snacks every day (the "repeating again again" report).
              const currentTray = useStore.getState().trayLibrary;
              const trayPool: SourcePool = { breakfast: [], lunch: [], snacks: [], dinner: [] };
              for (const slot of ['breakfast', 'lunch', 'snacks', 'dinner'] as const) {
                const items = currentTray[slot] ?? [];
                for (const item of items) {
                  const dish = seededDishes.find(d => d.id === item.dishId);
                  if (dish && !trayPool[slot].find(d => d.id === dish.id)) trayPool[slot].push(dish);
                }
              }
              const defaultConfig: MealLoopConfig = {
                cycleLength: 7, startDate: today, skipDays: [], repeatPattern: 'random',
              };
              const newPool = buildEnrichedLoopPool({
                sourcePool: trayPool,
                library,
                diet: dietPref,
                region: preferences.region,
                cycleLength: defaultConfig.cycleLength,
                healthGoal: preferences.healthGoal,
              });
              applyLoopConfig(defaultConfig, newPool, library);
              window.dispatchEvent(new CustomEvent('loop_updated', { detail: { config: defaultConfig } }));
              console.log('[App] Auto-seeded tray with', seededDishes.length, 'dishes + applied default loop');

              // Seed pantry with common staples based on diet + region
              const REGION_PANTRY: Record<string, string[]> = {
                'North India': ['Atta', 'Basmati Rice', 'Toor Dal', 'Moong Dal', 'Onion', 'Tomato', 'Potato', 'Ghee', 'Mustard Oil', 'Turmeric', 'Cumin', 'Coriander Powder', 'Red Chili Powder', 'Salt', 'Ginger', 'Garlic'],
                'South India': ['Idli Rice', 'Parboiled Rice', 'Toor Dal', 'Urad Dal', 'Coconut', 'Curry Leaves', 'Mustard Seeds', 'Coconut Oil', 'Fenugreek Seeds', 'Tamarind', 'Red Chili', 'Salt', 'Turmeric'],
                'East India': ['Rice', 'Mustard Oil', 'Panch Phoron', 'Potato', 'Cauliflower', 'Green Peas', 'Salt', 'Turmeric', 'Ginger', 'Garlic', 'Onion'],
                'West India': ['Rice', 'Wheat Flour', 'Toor Dal', 'Chana Dal', 'Peanuts', 'Coconut', 'Cumin Seeds', 'Mustard Seeds', 'Cooking Oil', 'Salt', 'Jaggery', 'Turmeric'],
                'Central India': ['Wheat Flour', 'Rice', 'Toor Dal', 'Moong Dal', 'Onion', 'Tomato', 'Potato', 'Garlic', 'Ginger', 'Cooking Oil', 'Turmeric', 'Cumin', 'Red Chili Powder', 'Salt'],
                'Northeast India': ['Rice', 'Mustard Oil', 'Ginger', 'Garlic', 'Green Chili', 'Salt', 'Turmeric', 'Fermented Fish', 'Bamboo Shoot'],
              };
              const pantryRegion = preferences.region as string;
              const staples: string[] = REGION_PANTRY[pantryRegion] ?? REGION_PANTRY['North India'] ?? [];
              useStore.getState().addToPantry(staples);
              console.log('[App] Seeded pantry with', staples.length, 'staples for', pantryRegion);

              startNewUserGuide();

            } catch (e) {
              console.error('[App] First-time onboarding error:', e);
            }
            setAuthReady(true);
          }}
        />
      </Suspense>
    );
  }

  // ─── Strict Routing: Login → Onboarding → Tray → Loop Config → Dashboard ───
  // Step 1: Loop config (after tray save in current session)
  if (showLoopConfig) {
    return (
      <Suspense fallback={
        <div className="min-h-screen bg-white flex items-center justify-center">
          <div className="w-8 h-8 border-2 border-[#FF385C] border-t-transparent rounded-full animate-spin" />
        </div>
      }>
        <div className="min-h-screen bg-white flex items-center justify-center">
          <MealLoopConfigModal
          isOpen={true}
          sourcePool={sourcePool}
          plannedSlots={user?.plannedSlots}
            onClose={() => {
            setShowLoopConfig(false);
            setManageTray(false);
            setManageTraySlot(undefined);
            setActiveTab('dashboard');
          }}
          onFixSlots={(targetSlot) => {
            setShowLoopConfig(false);
            setManageTraySlot(targetSlot);
            setManageTray(true);
          }}
          onApply={async (config: MealLoopConfig) => {
            // Enrich the tray-grown sourcePool to the cycle-scaled slot target
            // (5 per slot for 7-day, 10 for 14-day) so the manual Apply path matches
            // the auto-seed path. The raw pool is capped at whatever sits in today's
            // tray (often just 2 dishes) and would otherwise repeat the same dishes
            // every meal/day. Tray picks keep the lead; the remaining slots fill from
            // diet-allowed, region-appropriate library dishes.
            const library = await getDishLibrary().catch(() => []);
            const enrichedPool = buildEnrichedLoopPool({
              sourcePool,
              library,
              diet: user?.diet,
              region: user?.region,
              cycleLength: config.cycleLength,
              healthGoal: user?.healthGoals?.[0],
            });
            const pool = enrichedPool as SourcePool;
            const sourceDishIds = Object.values(pool).flat().map((d: Dish) => d.id);
            if (!navigator.onLine) {
              enqueue('loop_save', { config, userId: user?.id, sourceDishIds });
              applyLoopConfig(config, pool, fetchedDishes);
              setToast({ message: 'Loop config saved locally (offline) — will sync when reconnected', type: 'info' });
              window.dispatchEvent(new CustomEvent('loop_updated', { detail: { config } }));
              setShowLoopConfig(false);
              setManageTray(false);
              setActiveTab('dashboard');
              return;
            }
            try {
              await api.post('/loop-config', {
                userId: user?.id,
                config,
                sourceDishIds,
              });
            } catch (e) {
              console.warn('[LoopConfig] API save failed, saving locally:', e);
            }
            applyLoopConfig(config, pool, fetchedDishes);
            window.dispatchEvent(new CustomEvent('loop_updated', { detail: { config } }));
            setShowLoopConfig(false);
            setManageTray(false);
            setActiveTab('dashboard');
          }}
        />
      </div>
      </Suspense>
    );
  }

  // Step 2: Tray builder (first time, or manage mode from profile)
  if (!trayBuilt || manageTray) {
    console.log('[App] Showing MealTrayBuilder, trayBuilt:', trayBuilt, 'manageTray:', manageTray);
    return (
      <ErrorBoundary>
        <Suspense fallback={
          <div className="min-h-screen bg-white flex items-center justify-center">
            <div className="w-8 h-8 border-2 border-[#FF385C] border-t-transparent rounded-full animate-spin" />
          </div>
        }>
          <MealTrayBuilder
            user={user}
            defaultSlot={manageTraySlot}
            onBack={navStack.length > 0 ? () => { setManageTray(false); setManageTraySlot(undefined); setShowLoopConfig(false); goBack(); } : undefined}
            onComplete={async () => {
              console.log('[App] MealTrayBuilder onComplete called');
              setTrayBuilt(true);
              console.log('[App] trayBuilt=true persisted');
              setManageTray(false);
              setManageTraySlot(undefined);
              const returnTab = trayEditSession?.returnTab;
              if (returnTab) {
                setActiveTab(returnTab);
                useStore.getState().endTrayEdit();
              }
              setShowLoopConfig(true);
            }}
          />
        </Suspense>
      </ErrorBoundary>
    );
  }

  return (
    <SwapCustomizeProvider>
    <div className="min-h-screen bg-white font-sans text-gray-900 max-w-lg mx-auto">
      {toast && <Toast message={toast.message} type={toast.type} action={toast.action} onClose={() => setToast(null)} />}
      {cycleEndNudge && (
        <div className="fixed top-20 left-4 right-4 max-w-lg mx-auto z-[100] animate-in slide-in-from-top-2 fade-in duration-200">
          <div className="bg-white border border-orange-200 text-gray-900 px-4 py-3 rounded-2xl shadow-xl flex items-center justify-between gap-2">
            <div className="flex-1 min-w-0">
              <p className="text-sm font-bold">Your meal plan ends {formatDate(cycleEndNudge.lastDate)}</p>
              <p className="text-sm text-gray-500 mt-0.5">Extend the cycle to keep plan running.</p>
            </div>
            <div className="flex items-center gap-1.5 flex-shrink-0">
              <button
                onClick={handleExtendNudge}
                className="px-3 py-1.5 rounded-xl bg-[#FF385C] text-white text-xs font-bold active:scale-95 transition-all whitespace-nowrap"
              >
                Extend
              </button>
              <button
                onClick={handleDismissNudge}
                className="p-1.5 rounded-xl hover:bg-gray-100 transition-colors"
                aria-label="Dismiss"
              >
                <X size={14} className="text-gray-400" />
              </button>
            </div>
          </div>
        </div>
      )}
      <OfflineBanner />
      <main ref={mainRef} className="min-h-screen pb-24" tabIndex={-1} style={{ outline: 'none' }}>
        {activeTab === 'dashboard' && (
          <ErrorBoundary key="dashboard">
            <Suspense fallback={<DashboardSkeleton />}>
              <DashScreen user={user} onNavigate={setActiveTab} onManageTray={() => { pushNav(activeTab); setManageTray(true); }} />
            </Suspense>
          </ErrorBoundary>
        )}
        {activeTab === 'plan' && (
          <ErrorBoundary key="plan">
            <Suspense fallback={<PlanScreenSkeleton />}>
              <PlanScreen user={user} />
            </Suspense>
          </ErrorBoundary>
        )}
        {activeTab === 'pulse' && (
          <ErrorBoundary key="pantry">
            <Suspense fallback={<PantryPulseSkeleton />}>
              <PantryPulse />
            </Suspense>
          </ErrorBoundary>
        )}
        {activeTab === 'profile' && (
          <ErrorBoundary key="profile">
            <Suspense fallback={<ProfileSkeleton />}>
              <Profile onLogout={logout} onManageTray={(slot) => {
                if (slot) setManageTraySlot(slot);
                pushNav(activeTab);
                setManageTray(true);
              }} />
            </Suspense>
          </ErrorBoundary>
        )}
      </main>

      <TabBar activeTab={activeTab as Tab} onTabChange={setActiveTab} />
    </div>
    </SwapCustomizeProvider>
  );
};

export default function AppWithErrorBoundary() {
  return (
    <ErrorBoundary>
      <App />
    </ErrorBoundary>
  );
}
