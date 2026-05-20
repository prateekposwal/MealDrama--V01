import React, { useState, useEffect, Suspense, useMemo } from 'react';
import { useStore } from './store/useStore';
import { useTrayStore } from './store/useTrayStore';
import api, { getToken, setAuthReady } from './lib/api';
import LoginScreen from './components/new/LoginScreen';
import MealTrayBuilder from './screens/MealTrayBuilder';
import MealLoopConfigModal from './components/meal/MealLoopConfigModal';
import { Home, Calendar, ShoppingBasket, User as UserIcon, X } from 'lucide-react';
import { useBackendDishes } from './hooks/useBackendDishes';
import QuickStartOnboarding from './components/new/QuickStartOnboarding';
import { spiceLevelFromNumber } from './utils/formatSpice';
import { SwapCustomizeProvider } from './components/meal/SwapCustomizeModalContext';
import { ErrorBoundary } from './components/new/ErrorBoundary';
import { OfflineBanner } from './components/new/OfflineBanner';
import { processQueue, getPendingCount, enqueue } from './utils/offlineQueue';
import { onConnectivityChange, isOnline } from './utils/connectivity';
import { DashboardSkeleton, PlanScreenSkeleton, PantryPulseSkeleton, ProfileSkeleton } from './components/new/ScreenSkeletons';
import type { Dish } from './constants/dishLibrary';
import type { SourcePool } from './utils/mealLoopEngine';
import type { MealLoopConfig } from './types/tray';

const DashScreen = React.lazy(() => import('./screens/Dashboard'));
const PlanScreen = React.lazy(() => import('./screens/PlanScreen'));
const Profile = React.lazy(() => import('./components/new/Profile'));
const PantryPulse = React.lazy(() => import('./components/new/PantryPulse'));
const PageLoader = () => (
  <div className="flex flex-col items-center justify-center min-h-screen gap-4 px-6">
    <div className="w-8 h-8 border-2 border-[#FF385C] border-t-transparent rounded-full animate-spin" />
    <p className="text-sm font-medium text-gray-400 text-center">Preparing your meal plan…</p>
  </div>
);

const TABS = [
  { key: 'dashboard', label: 'Home', Icon: Home },
  { key: 'plan', label: 'Plan', Icon: Calendar },
  { key: 'pulse', label: 'Pantry', Icon: ShoppingBasket },
  { key: 'profile', label: 'Profile', Icon: UserIcon },
] as const;

type Tab = typeof TABS[number]['key'];

const Toast: React.FC<{ message: string; type: 'error' | 'success' | 'info'; onClose: () => void }> = ({ message, type, onClose }) => {
  const colors = {
    error: 'bg-red-500',
    success: 'bg-green-500',
    info: 'bg-gray-800',
  };
  useEffect(() => {
    const timer = setTimeout(onClose, 4000);
    return () => clearTimeout(timer);
  }, [onClose]);
  return (
    <div className={`fixed top-4 left-4 right-4 max-w-lg mx-auto ${colors[type]} text-white px-4 py-3 rounded-2xl shadow-xl flex items-center justify-between z-[100] animate-in slide-in-from-top-2`}>
      <span className="font-medium text-sm">{message}</span>
      <button onClick={onClose} className="ml-2 p-1 hover:bg-white/20 rounded-lg">
        <X size={16} />
      </button>
    </div>
  );
};

const App: React.FC = () => {
  const {
    isLoggedIn, user,
    setLoggedIn, updateProfile, logout, setDishes, setSwap, toast, setToast,
    trayBuilt, setTrayBuilt,
  } = useStore();
  const { quickSetupOpen, quickSetupPrefill, openQuickSetup, closeQuickSetup } = useStore();
  const { dishes: fetchedDishes } = useBackendDishes();
  // Hydration guard — prevent routing until Zustand persist has rehydrated
  const [hydrated, setHydrated] = useState(() => useStore.persist.hasHydrated());

  // ─── Hooks used downstream — placed here (before any conditional return) to satisfy React's Rules of Hooks ───
  const _trayLibrary = useStore(s => s.trayLibrary);
  const planDays = useTrayStore(s => s.plan.days);
  const today = new Date().toLocaleDateString('en-CA');
  const sourcePool = useMemo((): SourcePool => {
    const pool: SourcePool = { breakfast: [], lunch: [], snacks: [], dinner: [] };
    const seen = { breakfast: new Set<string>(), lunch: new Set<string>(), snacks: new Set<string>(), dinner: new Set<string>() };
    for (const mt of ['breakfast', 'lunch', 'snacks', 'dinner'] as const) {
      for (const item of planDays[today]?.[mt] ?? _trayLibrary[mt] ?? []) {
        const dish = fetchedDishes.find((d: Dish) => d.id === item.meal_id)
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
  const [loopSkipped, setLoopSkipped] = useState(false);

  // ─── Offline queue auto-sync on reconnect (single source via connectivity manager) ───
  useEffect(() => {
    const unsubscribe = onConnectivityChange(async (state) => {
      if (state !== 'online') return;
      const pending = getPendingCount();
      if (pending === 0) return;
      const result = await processQueue();
      if (result.synced > 0) {
        setToast({ message: `Synced ${result.synced} pending change${result.synced > 1 ? 's' : ''}`, type: 'success' });
      }
    });
    return unsubscribe;
  }, [setToast]);
  // ────────────────────────────────────────────────────────────────────────────

  // Inline onboarding flow from Profile (Edit Mode)
  if (quickSetupOpen) {
    return (
      <QuickStartOnboarding
        isEditMode={true}
        prefill={quickSetupPrefill as unknown as { region?: string; diet?: string; spiceLevel?: number; plannedSlots?: ("Breakfast" | "Lunch" | "Snacks" | "Dinner")[]; cookContact?: string; } | undefined}
        onComplete={(payload) => {
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

  if (!isLoggedIn) {
    return <LoginScreen onLogin={(userId, primaryId) => {
      setLoggedIn(true);
      updateProfile({ id: userId, primaryId, systemId: userId.slice(0, 8) });
    }} />;
  }

  const hasRegion = !!(user?.region);
  const onboardingComplete = user?.onboardingComplete ?? false;
  if (!hasRegion || onboardingComplete !== true) {
    return (
      <QuickStartOnboarding
        onComplete={(preferences) => {
          try {
            updateProfile({
              region: preferences.region,
               diet: preferences.diet as "veg" | "non-veg" | "vegan" | "eggitarian" | undefined,
              spiceLevel: spiceLevelFromNumber(preferences.spiceLevel),
              cookContact: preferences.cookContact,
              plannedSlots: preferences.plannedSlots,
              onboardingComplete: true,
              goal: user?.goal || 'Weekly',
            });
          } catch (e) {
            console.error('[App] First-time onboarding error:', e);
          }
          setAuthReady(true);
        }}
      />
    );
  }

  // Hydration guard — don't route until stores are ready
  if (!hydrated) {
    return <PageLoader />;
  }

  // ─── Strict Routing: Login → Onboarding → Tray → Loop Config → Dashboard ───
  // Step 1: Loop config (after tray save in current session)
  if (showLoopConfig) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <MealLoopConfigModal
          isOpen={true}
          sourcePool={sourcePool}
          onClose={() => {
            setShowLoopConfig(false);
            setLoopSkipped(true);
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
              setLoopSkipped(false);
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
            console.log('[LoopConfig] State updated, navigating to dashboard');
            window.dispatchEvent(new CustomEvent('loop_updated', { detail: { config } }));
            setShowLoopConfig(false);
            setLoopSkipped(false);
            setManageTray(false);
            setActiveTab('dashboard');
          }}
        />
      </div>
    );
  }

  // Step 2: Tray builder (first time, or manage mode from profile)
  if (!trayBuilt || manageTray) {
    return (
      <ErrorBoundary>
        <MealTrayBuilder
          user={user}
          defaultSlot={manageTraySlot}
          onComplete={() => {
            setTrayBuilt(true);
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
      {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}
      <OfflineBanner />
      <main className="min-h-screen pb-24">
        {activeTab === 'dashboard' && (
          <ErrorBoundary key="dashboard">
            <Suspense fallback={<DashboardSkeleton />}>
              <DashScreen user={user} onNavigate={setActiveTab} onManageTray={() => setManageTray(true)} />
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
                setManageTray(true);
              }} />
            </Suspense>
          </ErrorBoundary>
        )}
      </main>

      <nav className="fixed bottom-0 left-0 right-0 max-w-lg mx-auto bg-white/90 backdrop-blur-xl border-t border-gray-100 z-50">
        <div className="grid grid-cols-4 px-1 py-1">
          {TABS.map(({ key, label, Icon }) => {
            const active = activeTab === key;
            return (
              <button
                key={key}
                onClick={() => setActiveTab(key)}
                className="flex flex-col items-center gap-0.5 py-2 px-1 rounded-2xl transition-all duration-200"
              >
                <div className={`p-2 rounded-xl transition-all duration-200 ${active ? 'bg-[#FF385C]/10 scale-110' : ''}`}>
                  <Icon
                    size={22}
                    className={`transition-colors duration-200 ${active ? 'text-[#FF385C]' : 'text-gray-400'}`}
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

export default App;
