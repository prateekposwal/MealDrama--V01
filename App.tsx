import React, { useState, useEffect, Suspense } from 'react';
import { useStore } from './store/useStore';
import api from './lib/api';
import LoginScreen from './components/new/LoginScreen';
import MealCustomizer from './components/new/MealCustomizer';
import { Home, Calendar, ShoppingBasket, User as UserIcon, X } from 'lucide-react';
import { useBackendDishes } from './hooks/useBackendDishes';
import QuickStartOnboarding from './components/new/QuickStartOnboarding';
import { spiceLevelFromNumber } from './utils/formatSpice';

const Dashboard = React.lazy(() => import('./components/new/Dashboard'));
const PlanTimeline = React.lazy(() => import('./components/new/PlanTimeline'));
const Profile = React.lazy(() => import('./components/new/Profile'));
const PantryPulse = React.lazy(() => import('./components/new/PantryPulse'));

const PageLoader = () => (
  <div className="flex items-center justify-center min-h-screen">
    <div className="w-8 h-8 border-2 border-[#FF385C] border-t-transparent rounded-full animate-spin" />
  </div>
);

const TABS = [
  { key: 'dashboard', label: 'Home', Icon: Home },
  { key: 'plan', label: 'Plan', Icon: Calendar },
  { key: 'pulse', label: 'Pantry', Icon: ShoppingBasket },
  { key: 'profile', label: 'Profile', Icon: UserIcon },
] as const;

type Tab = typeof TABS[number]['key'];
const ALL_SLOTS = ['Breakfast', 'Lunch', 'Dinner', 'Snacks'] as const;
const SLOT_KEY_MAP: Record<string, keyof import('./store/useStore').TrayLibrary> = {
  Breakfast: 'breakfast',
  Lunch: 'lunch',
  Dinner: 'dinner',
  Snacks: 'snacks',
};

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
    isLoggedIn, user, trayLibrary, trayEditSession,
    setLoggedIn, updateProfile, replaceTrayLibrary, endTrayEdit, logout, setDishes, setSwap, toast, setToast,
  } = useStore();
  const { quickSetupOpen, quickSetupPrefill, openQuickSetup, closeQuickSetup } = useStore();
  const { dishes: fetchedDishes } = useBackendDishes();
  useEffect(() => { if (fetchedDishes.length) setDishes(fetchedDishes); }, [fetchedDishes, setDishes]);

  useEffect(() => {
    const handler = () => {
      const { isLoggedIn, logout, setToast } = useStore.getState();
      if (isLoggedIn) {
        logout();
        setToast({ message: 'Session expired — please log in again.', type: 'error' });
      }
    };
    window.addEventListener('auth:unauthorized', handler);
    return () => window.removeEventListener('auth:unauthorized', handler);
  }, []);

  useEffect(() => {
    if (!isLoggedIn || !user?.id) return;
    const hydrateFromDB = async () => {
      try {
        const plans: any[] = await api.get(`/plan?userId=${user.id}`);
        if (!plans?.length) return;
        for (const plan of plans) {
          const date = plan.date?.split('T')[0];
          if (!date) continue;
          const meal = {
            id: `${plan.mealId}-${Date.now()}`,
            dishId: plan.mealId,
            name: plan.meal?.name || plan.mealId,
            variantId: plan.variantId,
            quantity: plan.qty || 1,
            countBased: false,
          };
          setSwap(date, plan.slot, meal, true);
        }
      } catch (e) {
        console.log('[App] DB hydration skipped:', e);
      }
    };
    hydrateFromDB();
  }, [isLoggedIn, user?.id]);

  const [activeTab, setActiveTab] = useState<Tab>('dashboard');

  // Inline onboarding flow from Profile (Edit Mode)
  if (quickSetupOpen) {
    return (
      <QuickStartOnboarding
        isEditMode={true}
        prefill={quickSetupPrefill as unknown as { region?: string; diet?: string; spiceLevel?: number; plannedSlots?: ("Breakfast" | "Lunch" | "Snacks" | "Dinner")[]; cookContact?: string; } | undefined}
        onComplete={(payload) => {
          updateProfile({
            region: payload.region,
            diet: payload.diet as "veg" | "non-veg" | "vegan" | "eggitarian" | undefined,
            spiceLevel: spiceLevelFromNumber(payload.spiceLevel),
            cookContact: payload.cookContact,
            plannedSlots: payload.plannedSlots,
            onboardingComplete: true,
          });
          closeQuickSetup();
        }}
      />
    );
  }

  if (!isLoggedIn) {
    return <LoginScreen onLogin={(userId) => {
      setLoggedIn(true);
      updateProfile({ id: userId, systemId: userId.slice(0, 8) });
    }} />;
  }

  const hasRegion = !!(user?.region);
  const onboardingComplete = user?.onboardingComplete ?? false;
  if (!hasRegion || onboardingComplete !== true) {
    return (
      <QuickStartOnboarding
        onComplete={(preferences) => {
          updateProfile({
            region: preferences.region,
             diet: preferences.diet as "veg" | "non-veg" | "vegan" | "eggitarian" | undefined,
            spiceLevel: spiceLevelFromNumber(preferences.spiceLevel),
            cookContact: preferences.cookContact,
            plannedSlots: preferences.plannedSlots,
            onboardingComplete: true,
            goal: user?.goal || 'Weekly',
          });
        }}
      />
    );
  }

  const plannedSlots = user?.plannedSlots?.length ? user.plannedSlots : [...ALL_SLOTS];
  const hasTray = plannedSlots.every((slot) => {
    const slotKey = SLOT_KEY_MAP[slot]!;
    const totalQuantity = trayLibrary[slotKey].reduce((sum: number, option: any) => sum + (option.quantity || 1), 0);
    return totalQuantity >= 3;
  });
  if (!hasTray || trayEditSession) {
    return (
      <MealCustomizer
        userRegion={user?.region || 'North India'}
        userDiet={user?.diet || 'Veg'}
        plannedSlots={plannedSlots as ("Breakfast" | "Lunch" | "Snacks" | "Dinner")[]}
        cookingRole={(user?.cookingRole as "order" | "cook") || 'cook'}
        slotTiming={user?.slotTiming || {}}
        initialSlot={trayEditSession?.slot as "Breakfast" | "Lunch" | "Snacks" | "Dinner" | undefined}
        onComplete={(library: any, loop: string) => {
          if (trayEditSession) {
            replaceTrayLibrary(library);
            endTrayEdit();
          } else {
            replaceTrayLibrary(library);
          }
          updateProfile({ goal: loop });
        }}
      />
    );
  }

  return (
    <div className="min-h-screen bg-white font-sans text-gray-900 max-w-lg mx-auto">
      {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}
      <main className="min-h-screen pb-24">
        <Suspense fallback={<PageLoader />}>
          {activeTab === 'dashboard' && <Dashboard onNavigate={setActiveTab} />}
          {activeTab === 'plan' && <PlanTimeline />}
          {activeTab === 'pulse' && <PantryPulse />}
          {activeTab === 'profile' && <Profile onLogout={logout} />}
        </Suspense>
      </main>

      <nav className="fixed bottom-0 left-0 right-0 max-w-lg mx-auto bg-white/90 backdrop-blur-xl border-t border-gray-100 px-4 py-2 flex justify-around items-center z-50">
        {TABS.map(({ key, label, Icon }) => {
          const active = activeTab === key;
          return (
            <button
              key={key}
              onClick={() => setActiveTab(key)}
              className="flex flex-col items-center gap-0.5 py-1 px-3 rounded-2xl transition-all duration-200"
            >
              <div className={`p-2 rounded-xl transition-all duration-200 ${active ? 'bg-[#FF385C]/10 scale-110' : ''}`}>
                <Icon
                  size={22}
                  className={`transition-colors duration-200 ${active ? 'text-[#FF385C]' : 'text-gray-400'}`}
                />
              </div>
              <span className={`text-[9px] font-black uppercase tracking-widest transition-all duration-200 ${active ? 'text-[#FF385C]' : 'text-gray-300'}`}>
                {label}
              </span>
            </button>
          );
        })}
      </nav>
    </div>
  );
};

export default App;
