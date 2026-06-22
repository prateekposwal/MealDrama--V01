import React, { useState, useEffect, Suspense, useMemo, useRef, useCallback } from 'react';
import { useStore } from './store/useStore';
import { useTrayStore, seedTodayFromTray } from './store/useTrayStore';
import { saveAuth } from './utils/authStorage';
import api, { setAuthReady } from './lib/api';
import LoginScreen from './components/new/LoginScreen';
import MealTrayBuilder from './screens/MealTrayBuilder';
import MealLoopConfigModal from './components/meal/MealLoopConfigModal';
import { Home, Calendar, ShoppingBasket, User as UserIcon, ChevronLeft, X } from 'lucide-react';
import { useBackendDishes } from './hooks/useBackendDishes';
import FlashOnboarding from './components/new/FlashOnboarding';
import { spiceLevelFromNumber } from './utils/formatSpice';
import { SwapCustomizeProvider } from './components/meal/SwapCustomizeModalContext';
import { ErrorBoundary } from './components/new/ErrorBoundary';
import { OfflineBanner } from './components/new/OfflineBanner';
import { hasOpenModals, closeTopModal } from './utils/modalStack';
import { enqueue } from './utils/offlineQueue';
import { DashboardSkeleton, PlanScreenSkeleton, PantryPulseSkeleton, ProfileSkeleton } from './components/new/ScreenSkeletons';
import type { Dish, DishLibrary } from './constants/dishLibrary';
import { DISH_LIBRARY } from './constants/dishLibrary';
import type { SourcePool } from './utils/mealLoopEngine';
import type { MealLoopConfig } from './types/tray';
import { getISODate, addDaysISO } from './utils/dateUTC';

const DashScreen = React.lazy(() => import('./screens/Dashboard'));
const PlanScreen = React.lazy(() => import('./screens/PlanScreen'));
const Profile = React.lazy(() => import('./components/new/Profile'));
const PantryPulse = React.lazy(() => import('./components/new/PantryPulse'));

const TABS = [
  { key: 'dashboard', label: 'Home', Icon: Home },
  { key: 'plan', label: 'Plan', Icon: Calendar },
  { key: 'pulse', label: 'Pantry', Icon: ShoppingBasket },
  { key: 'profile', label: 'Profile', Icon: UserIcon },
] as const;

type Tab = typeof TABS[number]['key'];

const Toast: React.FC<{ message: string; type: 'error' | 'success' | 'info'; action?: { label: string; onClick: () => void }; onClose: () => void }> = ({ message, type, action, onClose }) => {
  const colors = {
    error: 'bg-red-500',
    success: 'bg-green-500',
    info: 'bg-gray-800',
  };
  const onCloseRef = React.useRef(onClose);
  onCloseRef.current = onClose;

  useEffect(() => {
    const timer = setTimeout(() => onCloseRef.current(), 4000);
    return () => clearTimeout(timer);
  }, []);
  return (
    <div className={`fixed top-4 left-4 right-4 max-w-lg mx-auto ${colors[type]} text-white px-4 py-3 rounded-2xl shadow-xl flex items-center justify-between gap-2 z-[100] animate-in slide-in-from-top-2`}>
      <span className="font-medium text-sm flex-1">{message}</span>
      {action && (
        <button
          onClick={() => { action.onClick(); onClose(); }}
          className="px-3 py-1 rounded-lg bg-white/20 text-white text-xs font-bold active:scale-95 transition-all whitespace-nowrap hover:bg-white/30"
        >
          {action.label}
        </button>
      )}
      <button onClick={onClose} className="p-1 hover:bg-white/20 rounded-lg flex-shrink-0">
        <X size={16} />
      </button>
    </div>
  );
};

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
  const { applyLoopConfig } = useTrayStore();
  const trayEditSession = useStore(s => s.trayEditSession);
  const [activeTab, setActiveTab] = useState<string>('dashboard');
  const [manageTray, setManageTray] = useState(false);
  const [manageTraySlot, setManageTraySlot] = useState<string | undefined>(undefined);
  const [showLoopConfig, setShowLoopConfig] = useState(false);
  const [cycleEndNudge, setCycleEndNudge] = useState<{ lastDate: string; daysLeft: number } | null>(null);
  const mainRef = useRef<HTMLElement>(null);

  // ─── Back navigation ───
  const [navStack, setNavStack] = useState<string[]>([]);
  const navStackRef = useRef(navStack);
  navStackRef.current = navStack;
  const backExitTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const pushNav = useCallback((tab: string) => {
    setNavStack(prev => [...prev, tab]);
  }, []);
  const goBack = useCallback(() => {
    setNavStack(prev => {
      if (prev.length === 0) return prev;
      const restoredTab = prev[prev.length - 1];
      // Restore sub-view state
      setManageTray(false);
      setManageTraySlot(undefined);
      setShowLoopConfig(false);
      setActiveTab(restoredTab ?? 'dashboard');
      return prev.slice(0, -1);
    });
  }, []);

  // Listen for navigation events from screens without direct onNavigate prop
  useEffect(() => {
    const handler = () => setActiveTab('profile');
    window.addEventListener('navigate:profile', handler);
    return () => window.removeEventListener('navigate:profile', handler);
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
        seedTodayFromTray();
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
            const meals = days[date][mealType] as any[];
            if (!meals) continue;
            for (const meal of meals) {
              if (meal.title && meal.title.includes(' + ')) {
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

  // SYNC: Keep authStorage in sync with trayBuilt to prevent routing loops
  useEffect(() => {
    if (isHydrated && isLoggedIn) {
      saveAuth({ isLoggedIn: true, trayBuilt, user: user as any });
    }
  }, [isHydrated, isLoggedIn, trayBuilt, user]);

  // Hardware back button (Capacitor Android)
  useEffect(() => {
    let cleanup: (() => void) | undefined;
    (async () => {
      try {
        const { App } = await import('@capacitor/app');
        const handler = await App.addListener('backButton', () => {
          // Priority 0: Close open modal
          if (hasOpenModals()) {
            closeTopModal();
            return;
          }
          // Priority 1: Pop sub-view nav stack
          if (navStackRef.current.length > 0) {
            goBack();
            return;
          }
          // Priority 2: Navigate from non-dashboard tabs to dashboard
          if (activeTab !== 'dashboard') {
            setActiveTab('dashboard');
            return;
          }
          // Priority 3: Double-tap exit on dashboard
          if (backExitTimerRef.current) {
            // Second tap within 2s → exit
            clearTimeout(backExitTimerRef.current);
            backExitTimerRef.current = null;
            (async () => {
              const { App } = await import('@capacitor/app');
              App.exitApp();
            })();
          } else {
            // First tap → start timer, show toast
            setToast({ message: 'Press back again to exit', type: 'info' });
            backExitTimerRef.current = setTimeout(() => {
              backExitTimerRef.current = null;
            }, 2000);
          }
        });
        cleanup = handler.remove;
      } catch {
        // Not running in Capacitor (web preview), ignore
      }
    })();
    return () => {
      cleanup?.();
      if (backExitTimerRef.current) {
        clearTimeout(backExitTimerRef.current);
        backExitTimerRef.current = null;
      }
    };
  }, [goBack, activeTab, setToast]);

  // FIX: Flush persistence stores before app goes to background to prevent data loss
  useEffect(() => {
    let cleanup: (() => void) | undefined;
    (async () => {
      try {
        const { App } = await import('@capacitor/app');
        const handler = await App.addListener('appStateChange', ({ isActive }) => {
          if (!isActive) {
            // App going to background — Zustand 5 persists synchronously, no flush needed
          }
        });
        cleanup = handler.remove;
      } catch {
        // Not running in Capacitor, ignore
      }
    })();
    return () => { cleanup?.(); };
  }, []);

  // ─── Cycle-end nudge: toast when loop has ≤3 days of assignments left ───
  useEffect(() => {
    const check = () => {
      const ml = useTrayStore.getState().mealLoop;
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
    const unsub = useTrayStore.subscribe(
      (s) => s.mealLoop,
      () => { check(); },
    );
    return unsub;
  }, [showLoopConfig]);

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
    return <LoginScreen onLogin={async (username) => {
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
    }} />;
  }

  const hasRegion = !!(user?.region);
  const onboardingComplete = user?.onboardingComplete ?? false;
  if (!hasRegion || onboardingComplete !== true) {
    return (
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
            });
            console.log('[App] Onboarding data persisted');
          } catch (e) {
            console.error('[App] First-time onboarding error:', e);
          }
          setAuthReady(true);
        }}
      />
    );
  }

  // ─── Strict Routing: Login → Onboarding → Tray → Loop Config → Dashboard ───
  // Step 1: Loop config (after tray save in current session)
  if (showLoopConfig) {
    return (
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
            if (!navigator.onLine) {
              enqueue('loop_save', { config, userId: user?.id, sourceDishIds: Object.values(sourcePool).flat().map((d: Dish) => d.id) });
              applyLoopConfig(config, sourcePool, fetchedDishes);
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
                sourceDishIds: Object.values(sourcePool).flat().map((d: Dish) => d.id),
              });
            } catch (e) {
              console.warn('[LoopConfig] API save failed, saving locally:', e);
            }
            applyLoopConfig(config, sourcePool, fetchedDishes);
            window.dispatchEvent(new CustomEvent('loop_updated', { detail: { config } }));
            setShowLoopConfig(false);
            setManageTray(false);
            setActiveTab('dashboard');
          }}
        />
      </div>
    );
  }

  // Step 2: Tray builder (first time, or manage mode from profile)
  if (!trayBuilt || manageTray) {
    console.log('[App] Showing MealTrayBuilder, trayBuilt:', trayBuilt, 'manageTray:', manageTray);
    return (
      <ErrorBoundary>
        <MealTrayBuilder
          user={user}
          defaultSlot={manageTraySlot}
          onBack={navStack.length > 0 ? goBack : undefined}
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
              <p className="text-[11px] text-gray-500 mt-0.5">Extend the cycle to keep plan running.</p>
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

      <nav className="fixed bottom-0 left-0 right-0 max-w-lg mx-auto bg-white/90 backdrop-blur-xl border-t border-gray-100 z-50 pb-[env(safe-area-inset-bottom)]" role="navigation" aria-label="Main navigation">
        <div className="grid grid-cols-4 px-1 py-1">
          {TABS.map(({ key, label, Icon }) => {
            const active = activeTab === key;
            return (
              <button
                key={key}
                onClick={() => setActiveTab(key)}
                className="flex flex-col items-center gap-0.5 py-2 px-1 rounded-2xl transition-all duration-200"
                aria-label={label}
                aria-current={active ? 'page' : undefined}
              >
                <div className={`p-2 rounded-xl transition-all duration-200 ${active ? 'bg-[#FF385C]/10 scale-110' : ''}`}>
                  <Icon
                    size={22}
                    className={`transition-colors duration-200 ${active ? 'text-[#FF385C]' : 'text-gray-400'}`}
                    aria-hidden="true"
                  />
                </div>
                <span className={`text-[9px] font-black uppercase tracking-widest transition-all duration-200 ${active ? 'text-[#FF385C]' : 'text-gray-400'}`}>
                  {label}
                </span>
              </button>
            );
          })}
        </div>
      </nav>
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
