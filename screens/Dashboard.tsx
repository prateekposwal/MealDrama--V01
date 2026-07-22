// ─────────────────────────────────────────────────────────────────────────────
// Dashboard — Today's meals (read-only + edit link)
// Empty slots show QuickAddRow
// ─────────────────────────────────────────────────────────────────────────────

import React, { useState, useMemo, useCallback, useEffect, useRef, lazy, Suspense } from 'react';
import { useTrayStore, MealType, TrayItem } from '../plan/store/useTrayStore';
import { useLoopStore } from '../plan/store/useLoopStore';
import { useStore } from '../app/store/useStore';
import type { Meal } from '../types/tray';
import type { SuggestionMeal } from '../app/lib/trayApi';
const QuickAddModal = lazy(() => import('../components/new/QuickAddModal'));
const SwapCustomizeModal = lazy(() => import('../components/meal/SwapCustomizeModal').then(m => ({ default: m.SwapCustomizeModal })));
import TrayScreen from '../components/new/TrayScreen';
import WhatsAppShareModal from '../components/new/WhatsAppShareModal';

import { useBackendDishes } from '../hooks/useBackendDishes';
import { useLockBodyScroll } from '../hooks/useLockBodyScroll';
import { useBackButtonClose } from '../hooks/useBackButtonClose';
import DishImage from '../components/new/DishImage';
import NotificationCenter from '../components/notification/NotificationCenter';
import { MapPin, ChevronRight, Plus, X, Info, CheckCircle2, ArrowRight } from 'lucide-react';
import type { Dish, DishVariant } from '../meal/constants/dishLibrary';
import { HealthTipsPanel } from '../components/health/HealthTipsPanel';
import { PlateBalanceVisualizer } from '../components/health/PlateBalanceVisualizer';
import { scorePlateBalance } from '../utils/nutritionScore';
import { DISH_HEALTH_MAP, COMPONENT_HEALTH_MAP } from '../app/constants/healthGuidelines';
import { SlotBody, SlotBodyProps, SlotMode } from '../components/meal/SlotBody';
import { useSwapCustomize } from '../components/meal/SwapCustomizeModalContext';
import LoopAutoFillSlot from '../components/meal/LoopAutoFillSlot';
import { dishToMeal } from '../utils/dishToMeal';
import { suggestionToMeal } from '../utils/suggestionUtils';
import { getShareStrings, ShareLanguage, SLOT_LABELS } from '../utils/share';

import { computeStyleWarnings, type StyleWarning } from '../meal/constants/dishStyles';
import { resolveSlotTimes, aggregateSlotItems, getSkipUndoWindowExpiry, isSlotActive, isAfterEnd, getSlotDefaultTimes } from '../types/tray';
import PullToRefresh from '../components/new/PullToRefresh';
import { slotKey } from '../plan/utils/planIndex';
import { getISODate } from '../utils/dateUTC';

/** Fallback whole-grain keywords matched against dish/component names when health maps are missing */
const WHOLE_GRAIN_NAMES = [
  'brown rice', 'brown bread', 'whole wheat', 'whole meal',
  'multigrain', 'multi-grain', 'whole grain',
  'roti', 'phulka', 'bhakri', 'jolada', 'bafla', 'thepla',
  'oats', 'oatmeal', 'millet', 'ragi', 'jowar', 'bajra', 'quinoa',
  'paratha', 'pav',
];

/** Fallback refined-grain keywords */
const REFINED_GRAIN_NAMES = [
  'white rice', 'white bread', 'refined',
  'maida', 'naan', 'puri', 'bhature', 'bread',
  'biryani', 'pulao',
  'rice',
  'bun',
];

function inferGrainCategory(name: string): string | null {
  const lower = name.toLowerCase();
  for (const kw of WHOLE_GRAIN_NAMES) {
    if (lower.includes(kw)) return 'whole-grain';
  }
  for (const kw of REFINED_GRAIN_NAMES) {
    if (lower.includes(kw)) return 'refined-grain';
  }
  return null;
}

/** Infer health categories from component name when COMPONENT_HEALTH_MAP has no entry */
function inferComponentCategory(
  name: string,
  type: 'roti' | 'rice' | 'side' | 'beverage' | 'gravy' | 'dessert',
): string[] {
  const lower = name.toLowerCase();
  const cats: string[] = [];

  const grain = inferGrainCategory(name);
  if (grain) cats.push(grain);

  if (
    lower.includes('salad') ||
    lower.includes('vegetable') ||
    lower.includes('veg') ||
    lower.includes('fruit') ||
    lower.includes('chutney') ||
    lower.includes('pickle') ||
    lower.includes('raita') ||
    lower.includes('soup') ||
    lower.includes('banana') ||
    lower.includes('mango') ||
    lower.includes('strawberry') ||
    lower.includes('apple') ||
    lower.includes('pineapple') ||
    lower.includes('berry') ||
    lower.includes('peach') ||
    lower.includes('fig') ||
    lower.includes('dates') ||
    lower.includes('honey') ||
    lower.includes('chickoo')
  ) {
    cats.push('veg-fruit');
  }

  if (lower.includes('juice') || lower.includes('smoothie') || lower.includes('milkshake') || lower.includes('shake') ||
      lower.includes('sharbat') || lower.includes('sherbet')) {
    cats.push('veg-fruit');
    if (lower.includes('smoothie') || lower.includes('milkshake') || lower.includes('shake') ||
        lower.includes('sharbat') || lower.includes('sherbet')) {
      cats.push('sugary-beverage');
    }
  }

  if (lower.includes('water') || lower.includes('chaas') || lower.includes('lassi') || lower.includes('buttermilk')) {
    cats.push('healthy-beverage');
  }

  if (lower.includes('halwa') || lower.includes('barfi') || lower.includes('ladoo') || lower.includes('jalebi') ||
      lower.includes('kheer') || lower.includes('gulab') || lower.includes('rasgulla') || lower.includes('ice cream') ||
      lower.includes('mithai') || lower.includes('sweet')) {
    cats.push('dessert');
  }

  if (lower.includes('fried') || lower.includes('pakora') || lower.includes('bhaji') || lower.includes('tawa fry') ||
      lower.includes('manchurian') || lower.includes('chilli')) {
    cats.push('fried');
  }

  if (lower.includes('dairy') || lower.includes('cream') || lower.includes('cheese') || lower.includes('paneer') ||
      lower.includes('milk') || lower.includes('malai')) {
    cats.push('dairy');
  }

  if (lower.includes('peanut') || lower.includes('nuts') || lower.includes('almond') || lower.includes('cashew') ||
      lower.includes('walnut') || lower.includes('seed')) {
    cats.push('lean-protein');
    cats.push('healthy-fat');
  }

  return cats;
}

type Slot = 'Breakfast' | 'Lunch' | 'Snacks' | 'Dinner';

const SLOTS: { key: Slot; mealType: MealType; label: Slot; startHour: number; endHour: number }[] = [
    { key: 'Breakfast', mealType: 'breakfast', label: 'Breakfast', startHour: 6, endHour: 10 },
    { key: 'Lunch', mealType: 'lunch', label: 'Lunch', startHour: 11, endHour: 15 },
    { key: 'Snacks', mealType: 'snacks', label: 'Snacks', startHour: 15, endHour: 18 },
    { key: 'Dinner', mealType: 'dinner', label: 'Dinner', startHour: 19, endHour: 23 },
];

type MealSection = 'active' | 'upcoming' | 'completed' | 'skipped';

/** Categorize each slot based on current time — uses per-slot start_time/end_time */
const categorizeSlots = (
    slots: typeof SLOTS,
    getMeals: (date: string, mealType: MealType) => TrayItem[],
    today: string,
    completions?: Record<string, number>,
    preferences?: Record<string, { start: string; end: string }>,
    skipped?: Record<string, number>,
): { section: MealSection; slot: typeof SLOTS[0] }[] => {
    const result = slots.map(slot => {
        const meals = getMeals(today, slot.mealType);
        const { start, end } = resolveSlotTimes(meals, slot.mealType, preferences);
        const key = slotKey(today, slot.mealType);
        const isUserCompleted = completions?.[key] != null;
        const isSkipped = skipped?.[key] != null;
        const withinWindow = isSlotActive(start, end);
        const pastEnd = isAfterEnd(start, end);
        let section: MealSection;
        if (isSkipped) section = 'skipped';
        else if (isUserCompleted) section = 'completed';
        else if (pastEnd && !withinWindow) section = 'completed';
        else if (withinWindow) section = 'active';
        else section = 'upcoming';
        return { section, slot };
    });

    // If no slot is active, transition the first upcoming slot to active
    const hasActive = result.some(r => r.section === 'active');
    if (!hasActive) {
        const firstUpcoming = result.find(r => r.section === 'upcoming');
        if (firstUpcoming) firstUpcoming.section = 'active';
    }

    return result;
};

// ─── Reactive slot wrapper — subscribes to the exact slot path ───
interface DashboardSlotSectionProps {
  date: string;
  mealType: MealType;
  slot: { key: string; label: string; mealType: MealType };
  section: string;
  sectionColors: Record<string, string>;
  sectionLabels: Record<string, string>;
  onOpenSearchAction: (slotLabel: string) => void;
  onCompleteAction: ((date: string, mealType: MealType) => void) | undefined;
  onUndoCompleteAction: ((date: string, mealType: MealType) => void) | undefined;
  onSkipSlotAction: ((date: string, mealType: MealType) => void) | undefined;
  onUndoSkipAction: ((date: string, mealType: MealType) => void) | undefined;
  onShareSlotAction?: (mealType: MealType) => void;
  swapOpenKey: string | null;
  stableSwapOpen: (itemId: string) => void;
  stableSwapClose: () => void;
  handleSwapSelect: ReturnType<typeof useCallback>;
  handleUpdateInline: ReturnType<typeof useCallback>;
  handleRemove: ReturnType<typeof useCallback>;
  handleSuggestionAdd: ReturnType<typeof useCallback>;
  swapCustomizeOpenKey: string | null;
  stableSwapCustomizeOpen: (id: string) => void;
  stableSwapCustomizeClose: () => void;
  handleSwapCustomizeApply: ReturnType<typeof useCallback>;
  handleAddAnother: ReturnType<typeof useCallback>;
  preferences: Record<string, { start: string; end: string }> | undefined;
  today: string;
  dishes: Dish[];
  user: any;
  pantryStaples: string[];
  stableGuestMode: GuestMode;
  completions: Record<string, number>;
  skipped: Record<string, number>;
  undoSlot: { date: string; mealType: MealType; type: 'complete' | 'skip' } | null;
  handleCompleteSlot: ReturnType<typeof useCallback>;
  handleUndoComplete: ReturnType<typeof useCallback>;
  handleSkipSlot: ReturnType<typeof useCallback>;
  handleUndoSkip: ReturnType<typeof useCallback>;
}

const DashboardSlotSection = React.memo<DashboardSlotSectionProps>(({
  date, mealType, slot, section, sectionColors, sectionLabels,
  onOpenSearchAction, onCompleteAction, onUndoCompleteAction, onSkipSlotAction, onUndoSkipAction, onShareSlotAction,
  swapOpenKey, stableSwapOpen, stableSwapClose,
  handleSwapSelect, handleUpdateInline, handleRemove, handleSuggestionAdd,
  swapCustomizeOpenKey, stableSwapCustomizeOpen, stableSwapCustomizeClose, handleSwapCustomizeApply,
  handleAddAnother, preferences, today, dishes, user, pantryStaples, stableGuestMode,
  completions, skipped, undoSlot, handleCompleteSlot, handleUndoComplete, handleSkipSlot, handleUndoSkip,
}) => {
  const slotMeals = useTrayStore(state => state.plan.days[date]?.[mealType] || []) as TrayItem[];
  const prefs = preferences;
  const completionKey = slotKey(today, mealType);
  const isUserCompleted = completions[completionKey] != null;
  const isSkipped = skipped[completionKey] != null;
  const isUndoing = undoSlot?.date === today && undoSlot?.mealType === mealType;
  const isUndoSkipWindowActive = isSkipped && Date.now() < getSkipUndoWindowExpiry(mealType, preferences);
  const tomorrowDate = getISODate(new Date(new Date(date).getTime() + 86400000));
  const tomorrowMeals = (useTrayStore.getState().plan.days[tomorrowDate]?.[mealType] || []) as TrayItem[];
  const styleWarnings = computeStyleWarnings(slotMeals.map(m => ({ mealId: m.meal_id, name: m.name })));

  return (
    <div key={slot.key} id={`slot-${mealType}`} className={`rounded-xl px-3 py-2 ${sectionColors[section]}`}>
      <LoopAutoFillSlot date={today} mealType={mealType} />
      <div className="flex items-center gap-2 mb-1.5">
        <span className="text-[10px] font-black uppercase tracking-widest text-gray-500">
          {slot.label}
        </span>
        <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-full ${
          section === 'active'
            ? 'bg-[#FF385C]/10 text-[#FF385C]'
            : section === 'upcoming'
              ? 'bg-gray-100 text-gray-500'
              : 'bg-gray-100 text-gray-500'
        }`}>
          {sectionLabels[section]}
        </span>
      </div>
      <DashboardSlotRow
        date={date}
        mealType={mealType}
        slotLabel={slot.label}
                                meals={slotMeals}
                                mergeExtraItems
                                mode={section as SlotMode}
        dishes={dishes}
        userRegion={user?.region ?? 'India'}
        userDiet={user?.diet ?? 'veg'}
        pantryStaples={pantryStaples}
        guestMode={stableGuestMode}
        swapOpenKey={swapOpenKey}
        onSwapOpen={stableSwapOpen}
        onSwapClose={stableSwapClose}
        onSwapSelect={handleSwapSelect}
        onUpdateInline={handleUpdateInline}
        onRemove={handleRemove}
        onSuggestionAdd={handleSuggestionAdd}
        swapCustomizeOpenKey={swapCustomizeOpenKey}
        onSwapCustomizeOpen={stableSwapCustomizeOpen}
        onSwapCustomizeClose={stableSwapCustomizeClose}
        onSwapCustomizeApply={handleSwapCustomizeApply}
        onAddAnother={handleAddAnother}
        isUserCompleted={isUserCompleted && !isUndoing}
        tomorrowDate={tomorrowDate}
        tomorrowMeals={tomorrowMeals}
        styleWarnings={styleWarnings}
        preferences={prefs}
        onOpenSearchAction={onOpenSearchAction}
        onCompleteAction={onCompleteAction}
        onUndoCompleteAction={onUndoCompleteAction}
        onSkipSlotAction={!isUserCompleted && !isSkipped ? onSkipSlotAction : undefined}
        onUndoSkipAction={isUndoSkipWindowActive ? onUndoSkipAction : undefined}
        onShareSlotAction={onShareSlotAction}
      />
    </div>
  );
});

// ─── Slot Wrapper (stabilizes inline callbacks for React.memo) ───
interface DashboardSlotRowProps extends
  Omit<SlotBodyProps, 'onOpenSearch' | 'onComplete' | 'onUndoComplete' | 'onSkipSlot' | 'onUndoSkip' | 'onShareSlot' | 'hideSlotLabel'> {
  onOpenSearchAction: (slotLabel: string) => void;
  onCompleteAction: ((date: string, mealType: MealType) => void) | undefined;
  onUndoCompleteAction: ((date: string, mealType: MealType) => void) | undefined;
  onSkipSlotAction: ((date: string, mealType: MealType) => void) | undefined;
  onUndoSkipAction: ((date: string, mealType: MealType) => void) | undefined;
  onShareSlotAction?: (mealType: MealType) => void;
}

const DashboardSlotRow = React.memo<DashboardSlotRowProps>(({
  date, mealType, slotLabel,
  onOpenSearchAction,
  onCompleteAction,
  onUndoCompleteAction,
  onSkipSlotAction,
  onUndoSkipAction,
  onShareSlotAction,
  ...rest
}) => {
  const onOpenSearch = useCallback(() => {
    onOpenSearchAction(slotLabel);
  }, [slotLabel, onOpenSearchAction]);

  const onComplete = useCallback(() => {
    onCompleteAction?.(date, mealType);
  }, [date, mealType, onCompleteAction]);

  const onUndoComplete = useCallback(() => {
    onUndoCompleteAction?.(date, mealType);
  }, [date, mealType, onUndoCompleteAction]);

  const onSkipSlot = useCallback(() => {
    onSkipSlotAction?.(date, mealType);
  }, [date, mealType, onSkipSlotAction]);

  const onUndoSkip = useCallback(() => {
    onUndoSkipAction?.(date, mealType);
  }, [date, mealType, onUndoSkipAction]);

  const onShareSlot = useCallback(() => {
    onShareSlotAction?.(mealType);
  }, [mealType, onShareSlotAction]);

  return (
    <SlotBody
      date={date}
      mealType={mealType}
      slotLabel={slotLabel}
      onOpenSearch={onOpenSearch}
      onComplete={onCompleteAction ? onComplete : undefined}
      onUndoComplete={onUndoCompleteAction ? onUndoComplete : undefined}
      onSkipSlot={onSkipSlotAction ? onSkipSlot : undefined}
      onUndoSkip={onUndoSkipAction ? onUndoSkip : undefined}
      onShareSlot={onShareSlotAction ? onShareSlot : undefined}
      hideSlotLabel
      {...rest}
    />
  );
});


interface DashboardProps {
    user: any;
    onNavigate?: (tab: string) => void;
    onManageTray?: () => void;
}

const getTodayISO = getISODate;

const SECTION_COLORS: Record<string, string> = {
  active: 'bg-[#FF385C]/5 border border-[#FF385C]/20',
  upcoming: 'bg-gray-50 border border-gray-100',
  completed: 'bg-emerald-50 border border-emerald-100',
  skipped: 'bg-amber-50 border border-amber-100',
};
const SECTION_LABELS: Record<string, string> = {
  active: 'Now',
  upcoming: 'Upcoming',
  completed: 'Done',
  skipped: 'Skipped',
};

export const Dashboard: React.FC<DashboardProps> = ({ user, onNavigate, onManageTray }) => {
    const { dishes } = useBackendDishes();
    // Only update `today` at IST midnight — no need to tick every 60s
    const [today, setToday] = useState(() => getTodayISO());
    useEffect(() => {
      const IST_OFFSET = 5.5 * 60 * 60 * 1000;
      const istNow = new Date(Date.now() + IST_OFFSET);
      const istMidnight = new Date(istNow);
      istMidnight.setDate(istMidnight.getDate() + 1);
      istMidnight.setHours(0, 0, 0, 0);
      const msUntilMidnight = istMidnight.getTime() - istNow.getTime();
      const id = setTimeout(() => setToday(getTodayISO()), msUntilMidnight);
      return () => clearTimeout(id);
    }, []);

    const getMeals = useTrayStore(s => s.getMeals);

    // FIX: Hard cap render layer to max 2 dishes per slot
    // Prevents legacy dump pollution from showing in UI
    const getMealsCapped = useCallback((date: string, mealType: MealType) => {
        const meals = getMeals(date, mealType);
        return meals.length > 2 ? meals.slice(0, 2) : meals;
    }, [getMeals]);

    const guestMode = useTrayStore(s => s.guestMode);
    const completions = useTrayStore(s => s.completions);
    const skipped = useTrayStore(s => s.skipped);
    const addMealToSlot = useTrayStore(s => s.addMealToSlot);
    const addToTray = useStore(s => s.addToTray);
    const updateProfile = useStore(s => s.updateProfile);
    const swapMealInSlot = useTrayStore(s => s.swapMealInSlot);
    const updateItemInline = useTrayStore(s => s.updateItemInline);
    const removeMealFromSlot = useTrayStore(s => s.removeMealFromSlot);
    const completeSlot = useTrayStore(s => s.completeSlot);
    const undoCompleteSlot = useTrayStore(s => s.undoCompleteSlot);
    const skipSlot = useTrayStore(s => s.skipSlot);
    const undoSkipSlot = useTrayStore(s => s.undoSkipSlot);

    const [swapOpenKey, setSwapOpenKey] = useState<string | null>(null);
    const { openKey: swapCustomizeOpenKey, setOpenKey: setSwapCustomizeOpenKey } = useSwapCustomize();

    const stableSwapOpen = useCallback((id: string) => {
        setSwapOpenKey(prev => prev === id ? null : id);
    }, []);
    const stableSwapClose = useCallback(() => setSwapOpenKey(null), []);
    const stableSwapCustomizeOpen = useCallback((id: string) => {
        setSwapCustomizeOpenKey(id);
    }, []);
    const stableSwapCustomizeClose = useCallback(() => setSwapCustomizeOpenKey(null), []);

    const quickAddTrigger = useRef({ slot: '' as 'Breakfast' | 'Lunch' | 'Snacks' | 'Dinner' });
    const handleOpenSearchStable = useCallback(() => {
        setQuickAddSlot(quickAddTrigger.current.slot);
        setShowQuickAdd(true);
    }, []);
    const openSearchAction = useCallback((slotLabel: string) => {
        quickAddTrigger.current = { slot: slotLabel as 'Breakfast' | 'Lunch' | 'Snacks' | 'Dinner' };
        handleOpenSearchStable();
    }, [handleOpenSearchStable]);
    const setToast = useStore(s => s.setToast);
    const household = useStore(s => s.household);
    const [showQuickAdd, setShowQuickAdd] = useState(false);
    const [quickAddSlot, setQuickAddSlot] = useState<'Breakfast' | 'Lunch' | 'Snacks' | 'Dinner'>('Lunch');
    const [showTrayScreen, setShowTrayScreen] = useState(false);
    const [undoSlot, setUndoSlot] = useState<{ date: string; mealType: MealType; type: 'complete' | 'skip' } | null>(null);
    const [showSlotPicker, setShowSlotPicker] = useState(false);
    useLockBodyScroll(showSlotPicker);
    useBackButtonClose(showSlotPicker, () => setShowSlotPicker(false));
    const [addDishOpen, setAddDishOpen] = useState(false);
    const [addDishSlot, setAddDishSlot] = useState<MealType>('breakfast');
    const [pendingDish, setPendingDish] = useState<Dish | null>(null);

    const ADD_DISH_DUMMY = useMemo<TrayItem>(() => ({
        id: '__add_dish__', meal_id: '__add_dish__', name: '', icon: '',
        quantity: 1, servings: 1, smartVersion: 1,
        gravy: null, roti: null, rice: null,
        sides: [], beverages: [], dessert: [], itemQtys: {},
    }), []);

    const currentSlotMeals = useTrayStore(s => s.plan.days[today]?.[quickAddSlot.toLowerCase() as MealType]);
    const todayMealData = useTrayStore(s => s.plan.days[today]);
    const selectedDishIds = useMemo(() => currentSlotMeals?.map(item => item.meal_id) ?? [], [currentSlotMeals]);
    const [shareType, setShareType] = useState<'prep' | 'pantry' | null>(null);
    const [sharePreselectSlot, setSharePreselectSlot] = useState<string | null>(null);
    const onShareSlotAction = useCallback((mealType: MealType) => {
        setSharePreselectSlot(mealType);
        setShareType('prep');
    }, []);
    const [slotTimesRefreshKey, setSlotTimesRefreshKey] = useState(0);
    useEffect(() => {
        const handler = () => setSlotTimesRefreshKey(k => k + 1);
        window.addEventListener('slot_times_updated', handler);
        return () => window.removeEventListener('slot_times_updated', handler);
    }, []);
    // Auto-skip past untouched slots — reads state directly from store (no stale closures)
    useEffect(() => {
        const store = useTrayStore.getState();
        for (const slot of ACTIVE_SLOTS) {
            const key = slotKey(today, slot.mealType);
            const meals = store.getMeals(today, slot.mealType);
            if (meals.length === 0) continue;
            if (store.completions[key] != null || store.skipped[key] != null) continue;
            const { start, end } = resolveSlotTimes(meals, slot.mealType);
            if (isAfterEnd(start, end)) {
                store.skipSlot(today, slot.mealType);
            }
        }
    }, [today]);

    // ─── Auto-scroll to slot when dish is added ──
    useEffect(() => {
        const handler = (e: Event) => {
            const detail = (e as CustomEvent).detail;
            const el = document.getElementById(`slot-${detail.date}-${detail.mealType}`);
            if (el) {
                el.scrollIntoView({ behavior: 'smooth', block: 'center' });
                el.classList.add('slot-highlight');
                setTimeout(() => el.classList.remove('slot-highlight'), 2500);
            }
        };
        window.addEventListener('slotAdded', handler);
        return () => window.removeEventListener('slotAdded', handler);
    }, []);

    // Exclude undoSlot from completions/skipped so categorizeSlots treats it as not yet done during the undo window
    const committedCompletions = useMemo(() => {
        if (!undoSlot) return completions;
        const key = slotKey(undoSlot.date, undoSlot.mealType);
        const next = { ...completions };
        delete next[key];
        return next;
    }, [completions, undoSlot]);

    const handleCompleteSlot = useCallback((date: string, mealType: MealType) => {
        completeSlot(date, mealType);
        setUndoSlot({ date, mealType, type: 'complete' });
        setTimeout(() => setUndoSlot(null), 10000);
    }, [completeSlot]);

    const handleUndoComplete = useCallback((date: string, mealType: MealType) => {
        undoCompleteSlot(date, mealType);
        setUndoSlot(null);
    }, [undoCompleteSlot]);

    const handleSkipSlot = useCallback((date: string, mealType: MealType) => {
        skipSlot(date, mealType);
        setUndoSlot({ date, mealType, type: 'skip' });
        setTimeout(() => setUndoSlot(null), 8000);
    }, [skipSlot]);

    const handleUndoSkip = useCallback((date: string, mealType: MealType) => {
        undoSkipSlot(date, mealType);
        setUndoSlot(null);
    }, [undoSkipSlot]);

    const regionKey = (user?.region ?? 'India').toLowerCase();
    const userDiet = user?.diet ?? 'veg';
    const pantryStaples = user?.pantryStaples ?? [];
    const plannedSlots = user?.plannedSlots ?? ['Breakfast', 'Lunch', 'Snacks', 'Dinner'];
    const ACTIVE_SLOTS = useMemo(() => SLOTS.filter(s => plannedSlots.includes(s.key)), [plannedSlots]);

    const spiceLabel = user?.spiceLevel === 'mild' ? 'Mild 🌿' : user?.spiceLevel === 'hot' ? 'Hot 🔥' : 'Medium 🌶️';

    // Handle swap customize apply
    const handleSwapCustomizeApply = useCallback((date: string, mealType: MealType, itemId: string) => {
      return (updates: Partial<TrayItem>) => {
        // If meal_id changed, this is a full swap — use swapMealInSlot for loop sync
        if (updates.meal_id) {
          const currentItems = getMeals(date, mealType);
          const currentItem = currentItems.find(m => m.id === itemId);
          if (currentItem && currentItem.meal_id !== updates.meal_id) {
            const newDish = dishes.find(d => d.id === updates.meal_id);
            if (newDish) {
              swapMealInSlot(date, mealType, itemId, dishToMeal(newDish));
              // Apply remaining chip overrides after swap
              const { meal_id, ...chipUpdates } = updates;
              if (Object.keys(chipUpdates).length > 0) {
                updateItemInline(date, mealType, itemId, chipUpdates as Partial<TrayItem>);
              }
              setSwapCustomizeOpenKey(null);
              window.dispatchEvent(new CustomEvent('slotAdded', { detail: { date, mealType } }));
              return;
            }
          }
        }
        updateItemInline(date, mealType, itemId, updates);
        setSwapCustomizeOpenKey(null);
        window.dispatchEvent(new CustomEvent('slotAdded', { detail: { date, mealType } }));
      };
    }, [updateItemInline, swapMealInSlot, getMeals, dishes]);

    // Handle swap selection — find Dish in library, pass as Meal to store
    const handleSwapSelect = useCallback((date: string, mealType: MealType, itemId: string) => {
        return (newMealId: string, chipOverrides?: Record<string, unknown>) => {
            const dish = dishes.find(d => d.id === newMealId);
            if (!dish) return;
            swapMealInSlot(date, mealType, itemId, dishToMeal(dish));
            if (chipOverrides) {
                updateItemInline(date, mealType, itemId, chipOverrides);
            }
            setSwapOpenKey(null);
        };
    }, [swapMealInSlot, dishes, updateItemInline]);

    // Handle inline update
    const handleUpdateInline = useCallback((date: string, mealType: MealType, itemId: string) => {
        return (updates: Partial<TrayItem>) => {
            updateItemInline(date, mealType, itemId, updates);
        };
    }, [updateItemInline]);

    // Handle remove
    const handleRemove = useCallback((date: string, mealType: MealType, itemId: string) => {
        return () => {
            removeMealFromSlot(date, mealType, itemId);
        };
    }, [removeMealFromSlot]);

    // Handle suggestion tap — convert SuggestionMeal to Meal, store applies defaults
    const handleSuggestionAdd = useCallback((date: string, mealType: MealType) => {
        return (suggestion: SuggestionMeal) => {
            const meal = suggestionToMeal(suggestion);
            const currentItems = getMeals(date, mealType);
            if (currentItems.some(m => m.meal_id === meal.id || m.name.toLowerCase() === meal.name.toLowerCase())) {
                setToast({ message: `${meal.name} already added to ${mealType}`, type: 'info' });
                return;
            }
            addToTray(mealType, { id: meal.id, dishId: meal.id, name: meal.name, icon: meal.icon, sourceRegion: meal.region });
            addMealToSlot(date, mealType, meal);
        };
    }, [addMealToSlot, getMeals, setToast, addToTray]);

    // Quick add modal result — pass Dish to store, store applies defaults
    const handleQuickAddMeal = useCallback((date: string, slot: string, dish: Dish, variant?: DishVariant) => {
        const mealType = slot.toLowerCase() as MealType;
        const meal = dishToMeal(dish, variant);
        const currentItems = getMeals(date, mealType);
        if (currentItems.some(m => m.meal_id === meal.id || m.name.toLowerCase() === meal.name.toLowerCase())) {
            setToast({ message: `${meal.name} already added to ${mealType}`, type: 'info' });
            setShowQuickAdd(false);
            return;
        }
        addToTray(mealType, { id: dish.id, dishId: dish.id, name: dish.name, icon: dish.icon, sourceRegion: dish.region });
        addMealToSlot(date, mealType, meal, {
            variant: variant?.name,
            variantId: variant?.id,
            addon: variant?.addOn,
        });
        setShowQuickAdd(false);
    }, [addMealToSlot, getMeals, setToast, addToTray]);

    const handleAddAnother = useCallback((date: string, mealType: MealType, dish: Dish, variant?: DishVariant) => {
        const meal = dishToMeal(dish, variant);
        const existing = getMeals(date, mealType);
        const existingItem = existing.find(m => m.meal_id === dish.id || m.name.toLowerCase() === dish.name.toLowerCase());
        if (existingItem) {
            updateItemInline(date, mealType, existingItem.id, {
                quantity: (existingItem.quantity || 1) + 1,
                sides: [...new Set([...(existingItem.sides || []), ...(meal.sideOptions || [])])],
                variant: variant?.name || existingItem.variant,
                variantId: variant?.id || existingItem.variantId,
                addon: variant?.addOn || existingItem.addon,
            });
            setToast({ message: `${dish.name} already in ${mealType} — quantity increased`, type: 'info' });
        } else {
            addToTray(mealType, { id: dish.id, dishId: dish.id, name: dish.name, icon: dish.icon, sourceRegion: dish.region });
            addMealToSlot(date, mealType, meal, {
                variant: variant?.name,
                variantId: variant?.id,
                addon: variant?.addOn,
            });
            setToast({ message: `${dish.name} added to ${mealType}`, type: 'success' });
        }
        window.dispatchEvent(new CustomEvent('slotAdded', { detail: { date, mealType } }));
    }, [getMeals, addMealToSlot, updateItemInline, dishToMeal, setToast, addToTray]);

    const preferences = useMemo(() => user?.slotTimePreferences, [user?.slotTimePreferences]);
    const stableGuestMode = useMemo(() => guestMode, [
        guestMode.active, guestMode.guestCount, guestMode.extraServings,
        guestMode.startDate, guestMode.endDate,
    ]);
    const categorizedSlots = useMemo(() => categorizeSlots(ACTIVE_SLOTS, getMealsCapped, today, committedCompletions, preferences, skipped), [ACTIVE_SLOTS, getMealsCapped, today, committedCompletions, preferences, skipped, slotTimesRefreshKey]);
    const activeSlots = categorizedSlots.filter(s => s.section === 'active');
    const upcomingSlots = categorizedSlots.filter(s => s.section === 'upcoming');
    const completedSlots = categorizedSlots.filter(s => s.section === 'completed');
    const skippedSlots = categorizedSlots.filter(s => s.section === 'skipped');

    const buildPrepMessage = useCallback((language: ShareLanguage, selectedSlots: string[]) => {
        const copy = getShareStrings(language);
        const slotLabels = SLOT_LABELS[language];

        const guestInEffect = stableGuestMode.active
            && today >= stableGuestMode.startDate
            && today <= stableGuestMode.endDate;

        const slotsText = ACTIVE_SLOTS
            .filter(slot => selectedSlots.includes(slot.mealType))
            .filter(slot => {
                const key = slotKey(today, slot.mealType);
                return !committedCompletions[key];
            })
            .map(slot => {
                const meals = getMeals(today, slot.mealType);
                if (meals.length === 0) return null;
                const slotLabel = slotLabels[slot.mealType] || slot.label;
                const dishNames = meals.map(m => {
                    const qty = (m.quantity || 1) > 1 ? ` x${m.quantity}` : '';
                    const requested = m.requestedBy
                        ? ` 🙋${household?.members.find(mm => mm.id === m.requestedBy)?.name || '(left)'}`
                        : '';
                    return `${m.name}${qty}${requested}`;
                });
                const agg = aggregateSlotItems(meals);
                const compItems = [
                    ...agg.gravy.map(c => ({ name: c.name, qty: `${c.totalQty} ${c.unit}` })),
                    ...agg.roti.map(c => ({ name: c.name, qty: `${c.totalQty} ${c.unit}` })),
                    ...agg.rice.map(c => ({ name: c.name, qty: `${c.totalQty} ${c.unit}` })),
                    ...agg.sides.map(c => ({ name: c.name, qty: `${c.totalQty} ${c.unit}` })),
                    ...agg.beverages.map(c => ({ name: c.name, qty: `${c.totalQty} ${c.unit}` })),
                    ...agg.dessert.map(c => ({ name: c.name, qty: `${c.totalQty} ${c.unit}` })),
                ].filter(c => c.qty !== '0 unit');
                const allParts = [...dishNames, ...compItems.map(c => `${c.name} (${c.qty})`)];
                const guestExtra = guestInEffect ? ` – ${stableGuestMode.extraServings} extra serving rakho!` : '';
                return `${slotLabel}: ${allParts.join(', ')}.${guestExtra}`;
            })
            .filter(Boolean);

        const doneSlots = ACTIVE_SLOTS
            .filter(slot => selectedSlots.includes(slot.mealType))
            .filter(slot => {
                const key = slotKey(today, slot.mealType);
                return committedCompletions[key];
            })
            .map(slot => slotLabels[slot.mealType] || slot.label);

        let msg = `*${copy.brandHeader}*\n\n`;
        if (slotsText.length) {
            msg += slotsText.join('\n\n') + '\n\n';
        }
        if (doneSlots.length) {
            msg += `✅ ${doneSlots.join(', ')} done!\n\n`;
        }
        msg += copy.sentFrom;
        return msg;
    }, [getMeals, today, user, committedCompletions, preferences, stableGuestMode, household]);

    const buildPantryMessage = useCallback((language: ShareLanguage, selectedSlots: string[]) => {
        const copy = getShareStrings(language);
        const slotLabels = SLOT_LABELS[language];

        const items = ACTIVE_SLOTS
            .filter(slot => selectedSlots.includes(slot.mealType))
            .filter(slot => {
                const key = slotKey(today, slot.mealType);
                return !committedCompletions[key];
            })
            .flatMap(slot => {
                const meals = getMeals(today, slot.mealType);
                const slotLabel = slotLabels[slot.mealType] || slot.label;
                return meals.map(m => `  • ${slotLabel}: ${m.name}`);
            })
            .join('\n');

        return `*${copy.brandHeader}*\n\n🛒 *${copy.pantryTitle}*\n\n${copy.pantryFor}:\n\n${items}\n\n━━━━━━━━━━━━━━━\n${copy.sentFrom}`;
    }, [getMeals, today, committedCompletions]);

    const displaySlots = categorizedSlots;
    const displayActiveUpcomingSlots = useMemo(() => displaySlots.filter(s => s.section !== 'completed' && s.section !== 'skipped'), [displaySlots]);
    const displayCompletedSlots = useMemo(() => categorizedSlots.filter(s => s.section === 'completed' || s.section === 'skipped'), [categorizedSlots]);

    const [healthExpanded, setHealthExpanded] = useState(false);
    const [showCompleted, setShowCompleted] = useState(true);

    // H11: plateScore only depends on meal content, not slot timing.
    // We derive slot lists directly from getMeals to avoid recomputing
    // when slotTimesRefreshKey changes (which only affects time display).
    const plateScore = useMemo(() => {
      const slotTypes = ['breakfast', 'lunch', 'snacks', 'dinner'] as const;
      const allSlots = slotTypes.map(mt => ({
        mealType: mt,
        meals: getMeals(today, mt),
      }));

      const allMeals = allSlots.flatMap(({ mealType, meals }) => {
        if (meals.length === 0) return [];

        const categories: string[] = [];
        const tags: string[] = [];
        const components: { name: string; healthCategories: string[]; tags: string[]; type: 'roti' | 'rice' | 'side' | 'beverage' | 'gravy' | 'dessert' }[] = [];

        for (const m of meals) {
          const meta = DISH_HEALTH_MAP[m.meal_id];
          if (meta) {
            categories.push(...meta.healthCategories);
            tags.push(...meta.tags);
            if (!meta.healthCategories.some(c => c === 'whole-grain' || c === 'refined-grain')) {
              const inferred = inferGrainCategory(m.name);
              if (inferred) categories.push(inferred);
            }
          } else {
            const inferred = inferGrainCategory(m.name);
            if (inferred) categories.push(inferred);
          }
        }

        for (const m of meals) {
          const comps: [string | null, 'roti' | 'rice' | 'side' | 'beverage' | 'gravy' | 'dessert'][] = [
            [m.roti, 'roti'],
            [m.rice, 'rice'],
            [m.gravy, 'gravy'],
            ...(m.sides ?? []).map(s => [s, 'side'] as [string, 'side']),
            ...(m.beverages ?? []).map(b => [b, 'beverage'] as [string, 'beverage']),
            ...(m.dessert ?? []).map(d => [d, 'dessert'] as [string, 'dessert']),
          ];
          for (const [name, type] of comps) {
            if (!name) continue;
            const qty = m.itemQtys?.[name] ?? 1;
            const componentMeta = COMPONENT_HEALTH_MAP[name];
            const hc = componentMeta ? [...componentMeta.healthCategories] : [];
            const tg = componentMeta ? [...componentMeta.tags] : [];
            if (!hc.some(c => c === 'whole-grain' || c === 'refined-grain')) {
              const inferred = inferGrainCategory(name);
              if (inferred) hc.push(inferred);
            }
            if (componentMeta) {
              for (let i = 0; i < qty; i++) {
                categories.push(...componentMeta.healthCategories);
              }
              tags.push(...componentMeta.tags);
            } else {
              const inferred = inferComponentCategory(name, type);
              for (let i = 0; i < qty; i++) {
                for (const c of inferred) categories.push(c);
              }
            }
            components.push({ name, healthCategories: hc, tags: tg, type, qty });
          }
        }

        // ─── Component role detection for completeness scoring ─────────────
        const hasCarbBase = meals.some(m =>
          m.roti || m.rice ||
          m.name.toLowerCase().includes('roti') ||
          m.name.toLowerCase().includes('rice') ||
          m.name.toLowerCase().includes('bread') ||
          m.name.toLowerCase().includes('dosa') ||
          m.name.toLowerCase().includes('idli') ||
          m.name.toLowerCase().includes('paratha')
        );
        const hasProteinCore = meals.some(m =>
          categories.some(c => c === 'lean-protein' || c === 'legume') ||
          m.name.toLowerCase().includes('dal') ||
          m.name.toLowerCase().includes('paneer') ||
          m.name.toLowerCase().includes('chicken') ||
          m.name.toLowerCase().includes('egg') ||
          m.name.toLowerCase().includes('fish') ||
          m.name.toLowerCase().includes('mutton') ||
          m.name.toLowerCase().includes('chole') ||
          m.name.toLowerCase().includes('rajma') ||
          m.name.toLowerCase().includes('sambar')
        );
        const hasFiberSide = meals.some(m =>
          (m.sides?.length ?? 0) > 0 ||
          m.name.toLowerCase().includes('salad') ||
          m.name.toLowerCase().includes('raita') ||
          m.name.toLowerCase().includes('chutney') ||
          m.name.toLowerCase().includes('pickle') ||
          m.name.toLowerCase().includes('veg')
        );
        const hasHydration = meals.some(m =>
          (m.beverages?.length ?? 0) > 0 ||
          m.name.toLowerCase().includes('water') ||
          m.name.toLowerCase().includes('chaas') ||
          m.name.toLowerCase().includes('lassi') ||
          m.name.toLowerCase().includes('tea') ||
          m.name.toLowerCase().includes('coffee') ||
          m.name.toLowerCase().includes('juice')
        );
        const hasDessert = meals.some(m =>
          (m.dessert?.length ?? 0) > 0 ||
          m.name.toLowerCase().includes('dessert') ||
          m.name.toLowerCase().includes('sweet') ||
          m.name.toLowerCase().includes('gulab') ||
          m.name.toLowerCase().includes('kheer') ||
          m.name.toLowerCase().includes('halwa') ||
          m.name.toLowerCase().includes('ice cream') ||
          m.name.toLowerCase().includes('rasgulla') ||
          m.name.toLowerCase().includes('jalebi') ||
          m.name.toLowerCase().includes('ladoo') ||
          m.name.toLowerCase().includes('barfi')
        );

        return [{
          name: mealType,
          healthCategories: categories,
          tags,
          quantity: 1,
          components,
          hasCarbBase,
          hasProteinCore,
          hasFiberSide,
          hasHydration,
          hasDessert,
        }];
      });

      const result = scorePlateBalance(allMeals);

      // ─── Brute-force keyword detection for Healthy Fats & Low Sugar ───
      const HEALTHY_FAT_KEYWORDS = ['ghee', 'butter', 'paneer', 'cheese', 'coconut', 'avocado', 'fish', 'almond', 'cashew', 'walnut', 'peanut', 'nuts', 'sesame', 'til', 'mustard oil', 'olive oil', 'sunflower oil', 'coconut oil', 'sesame oil', 'fish oil', 'seed', 'flaxseed', 'chia', 'omega', 'tahini'];
      const LOW_SUGAR_KEYWORDS = ['water', 'chaas', 'buttermilk', 'nimbu', 'coconut water', 'salad', 'raita', 'curd', 'dahi', 'pickle', 'chutney', 'no sugar', 'unsweetened', 'sugar free', 'zero sugar', 'natural sweetener', 'stevia', 'jaggery', 'date', 'khajur', 'gur', 'low glycemic', 'diabetic friendly'];

      const getAllItemNames = (item: TrayItem): string[] => {
        return [
          item.name,
          item.roti,
          item.rice,
          item.gravy,
          ...(item.sides ?? []),
          ...(item.beverages ?? []),
          ...(item.dessert ?? []),
        ].filter(Boolean) as string[];
      };

      const itemMatchesKeywords = (item: TrayItem, keywords: string[]): boolean => {
        const allNames = getAllItemNames(item).map(n => n.toLowerCase());
        return keywords.some(k => allNames.some(n => n.includes(k)));
      };

      const activeItems = allSlots.flatMap(({ meals }) => meals).filter(m => (m.quantity || 1) > 0);
      const fatsMatched = activeItems.filter(i => (i.quantity ?? 1) > 0 && itemMatchesKeywords(i, HEALTHY_FAT_KEYWORDS));
      const healthyFatsCount = fatsMatched.reduce((sum, i) => sum + (i.quantity ?? 1), 0);

      const sugarMatched = activeItems.filter(i => (i.quantity ?? 1) > 0 && itemMatchesKeywords(i, LOW_SUGAR_KEYWORDS));
      const lowSugarCount = sugarMatched.reduce((sum, i) => sum + (i.quantity ?? 1), 0);

      result.categories.healthyFat = Math.min(10, healthyFatsCount);
      result.categories.limitSugary = Math.min(5, lowSugarCount);
      result.max = 40;
      result.total = Math.max(0, result.categories.vegFruit + result.categories.wholeGrain + result.categories.protein + result.categories.healthyFat + result.categories.limitSugary + result.categories.limitRedMeat);

      return result;
    }, [today, getMeals]);
    const loopConfig = useLoopStore(s => s.mealLoop.config);
    const loopConfigured = loopConfig !== null;

    return (
        <PullToRefresh onRefresh={() => useTrayStore.getState().syncOfflineQueue()}>
        <div className="pb-40 animate-in fade-in duration-300 bg-white ">
            <style>{`
        .card-section-enter {
          animation: fadeInUp 0.45s ease-out both;
        }
        .card-enter {
          animation: cardIn 0.35s ease-out calc(var(--i, 0) * 0.07s) both;
        }
        .extra-card-enter {
          animation: fadeInUp 0.3s ease-out calc(var(--i, 0) * 0.05s) both;
        }
        .card-enter:hover {
          transform: scale(1.02);
          box-shadow: 0 8px 24px rgba(0,0,0,0.08);
          transition: transform 0.2s ease, box-shadow 0.2s ease;
        }
        .card-enter {
          transition: transform 0.2s ease, box-shadow 0.2s ease;
          border-radius: 28px;
        }
        .aggregated-category {
          transition: opacity 0.3s ease, transform 0.3s ease;
        }
        .aggregated-chip {
          touch-action: manipulation;
          transition: opacity 0.2s ease, transform 0.2s ease;
        }
        .aggregated-chip:hover {
          transform: scale(1.02);
        }
        @keyframes fadeInUp {
          from { opacity: 0; transform: translateY(10px); }
          to { opacity: 1; transform: translateY(0); }
        }
        @keyframes cardIn {
          from { opacity: 0; transform: translateY(12px) scale(0.97); }
          to { opacity: 1; transform: translateY(0) scale(1); }
        }
        @keyframes pulseRing {
          0% { box-shadow: 0 0 0 0 rgba(16, 185, 129, 0.5); }
          70% { box-shadow: 0 0 0 8px rgba(16, 185, 129, 0); }
          100% { box-shadow: 0 0 0 0 rgba(16, 185, 129, 0); }
        }
        .animate-pulse-ring {
          animation: pulseRing 0.6s ease-out 2;
        }
        @media (prefers-reduced-motion: reduce) {
          .card-section-enter,
          .card-enter,
          .extra-card-enter,
          .aggregated-category,
          .aggregated-chip {
            animation: none !important;
            transition: none !important;
            transform: none !important;
          }
          .card-enter:hover {
            transform: none !important;
            box-shadow: none !important;
          }
        }
      `}</style>
            {/* Header */}
            <header className="flex justify-between items-end px-4 pt-4 pb-2">
                <div className="min-w-0 flex-1">
                    <span className="text-xl sm:text-2xl font-bold sm:font-black tracking-tight leading-none" style={{ WebkitFontSmoothing: 'antialiased' }}>
                        Meal<span className="text-[#FF385C]">Drama</span>
                    </span>
                    <h2 className="text-xl sm:text-[1.5rem] lg:text-[1.7rem] font-bold sm:font-extrabold tracking-tight whitespace-nowrap overflow-hidden text-ellipsis mt-1" style={{ WebkitFontSmoothing: 'antialiased' }}>
                        {new Date().getHours() < 8 ? "Up before the cook? 👀" : "Today's spread"}
                    </h2>
                </div>
                <div className="flex items-center gap-2">
                    <button
                        onClick={() => {
                            const levels: ('mild' | 'medium' | 'hot')[] = ['mild', 'medium', 'hot'];
                            const current = user?.spiceLevel || 'medium';
                            const idx = levels.indexOf(current);
                            const next = levels[(idx + 1) % levels.length];
                            updateProfile({ spiceLevel: next });
                        }}
                        className="text-xs font-bold border px-3 py-2 rounded-full flex items-center gap-1 bg-orange-50 text-orange-500 border-orange-100 active:scale-95 transition-all"
                    >
                        {spiceLabel}
                    </button>
                    <NotificationCenter />
                </div>
            </header>

            {/* Guide */}
            {/* Loop config inline tip */}
            {!loopConfigured && displayActiveUpcomingSlots.length > 0 && (
              <div className="mx-6 mt-2">
                <p className="text-[10px] text-amber-600">
                  Set up a meal loop in Profile to auto-fill upcoming days
                </p>
              </div>
            )}

            {/* ─── Suggested local dishes — horizontal scroll ─── */}
            {dishes.length > 0 && (
                <div className="px-4 mt-6">
                    <div className="flex items-center gap-2 mb-4">
                        <p className="text-xs font-black uppercase tracking-widest text-gray-500">
                            {displayActiveUpcomingSlots.length === 0 && displayCompletedSlots.length > 0 ? 'Build tomorrow\u2019s meals' : 'Try these'}
                        </p>
                        <span className="text-[10px] font-bold text-gray-500">{regionKey} · {userDiet}</span>
                    </div>
                    <div className="flex gap-3 overflow-x-auto pb-2 scrollbar-hide">
                        {dishes
                            .filter(d => {
                                const regionMatch = !d.region || d.region === 'all' || regionKey.includes(d.region);
                                const dietMatch = !d.diet || d.diet === 'all' || (
                                  userDiet === 'veg'
                                    ? (d.diet === 'veg' || d.diet === 'vegan')
                                    : d.diet !== 'vegan'
                                );
                                return regionMatch && dietMatch;
                            })
                            .sort((a, b) => {
                                const slotOrder: Record<string, number> = { breakfast: 0, lunch: 1, snacks: 2, dinner: 3 };
                                const aSlot = Math.min(...(a.category || []).map(c => slotOrder[c.toLowerCase()] ?? 4));
                                const bSlot = Math.min(...(b.category || []).map(c => slotOrder[c.toLowerCase()] ?? 4));
                                return aSlot - bSlot || Math.random() - 0.5;
                            })
                            .slice(0, 8)
                            .map(d => (
                                <button
                                    key={d.id}
                                    onClick={() => {
                                        setPendingDish(d);
                                        setShowSlotPicker(true);
                                    }}
                                    className="flex flex-col items-center gap-1.5 flex-shrink-0 active:scale-95 transition-all"
                                >
                                    <div className="relative w-16 h-16 rounded-full overflow-hidden border-2 border-gray-100 shadow-sm bg-gray-50">
                                        <DishImage name={d.name} size="full" className="w-full h-full object-cover" />
                                        <div className="absolute inset-0 bg-black/0 hover:bg-black/10 transition-all flex items-center justify-center">
                                            <Plus size={16} className="text-white opacity-0 hover:opacity-100 transition-opacity drop-shadow" />
                                        </div>
                                    </div>
                                    <p className="text-[11px] font-bold text-gray-800 leading-tight max-w-[72px] text-center truncate">{d.name}</p>
                                    <span className="text-[10px] font-bold text-[#FF385C] uppercase tracking-wider">+ Add</span>
                                </button>
                            ))
                        }
                    </div>
                </div>
            )}

            {/* ─── TODAY'S MEALS — Day-wise view with all slots ─── */}
            <div className="px-4 mt-4">
                <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2">
                        {displaySlots.some(({ slot }) => getMealsCapped(today, slot.mealType).length > 0) && (
                            <button onClick={() => setHealthExpanded(!healthExpanded)}
                                className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-50 border border-emerald-100 active:scale-95 transition-all"
                            >
                                <span className="text-xs leading-none">{plateScore.total / (plateScore.max || 1) > 0.7 ? '🌿' : plateScore.total / (plateScore.max || 1) > 0.4 ? '🌱' : '🔥'}</span>
                                <span className="text-[10px] font-bold text-emerald-700">
                                    {(() => {
                                        const pct = Math.round((plateScore.total / (plateScore.max || 30)) * 100);
                                        const label = pct >= 70 ? 'Great' : pct >= 40 ? 'Okay' : 'Needs work';
                                        return `${pct}% · ${label}`;
                                    })()}
                                </span>
                            </button>
                        )}
                    </div>
                    <span className="text-[11px] font-bold text-gray-500">
                        {new Date(today).toLocaleDateString('en-IN', { weekday: 'long', month: 'short', day: 'numeric' })}
                    </span>
                </div>

                {/* ─── TODAY'S SLOTS ─── */}
                {(() => {
                    if (displayActiveUpcomingSlots.length === 0 && displayCompletedSlots.length === 0) {
                        return (
                            <div className="py-8 text-center">
                                <div className="text-4xl mb-2">🎉</div>
                                <p className="text-sm font-bold text-gray-800">All done for today!</p>
                                <p className="text-xs text-gray-500 mt-1">Add meals to get started</p>
                            </div>
                        );
                    }
                    if (displayActiveUpcomingSlots.length === 0 && displayCompletedSlots.length > 0) {
                        const tomorrow = getISODate(new Date(new Date(today).getTime() + 86400000));
                        const tomorrowSlots = ACTIVE_SLOTS
                            .filter(s => getMealsCapped(tomorrow, s.mealType).length > 0)
                            .map(s => ({ section: 'upcoming' as const, slot: s }));
                        return (
                            <div className="space-y-4">
                                <div className="flex items-center gap-2">
                                    <span className="text-[11px] font-bold text-gray-900">Tomorrow</span>
                                    <span className="text-[10px] text-gray-500">
                                        {new Date(tomorrow).toLocaleDateString('en-IN', { weekday: 'long', month: 'short', day: 'numeric' })}
                                    </span>
                                </div>
                                {tomorrowSlots.length > 0 ? (
                                    <div className="space-y-4">
                                        {tomorrowSlots.map(({ section, slot }) => (
                                            <DashboardSlotSection
                                                key={slot.key}
                                                date={tomorrow}
                                                mealType={slot.mealType}
                                                slot={slot}
                                                section={section}
                                                sectionColors={SECTION_COLORS}
                                                sectionLabels={SECTION_LABELS}
                                                onOpenSearchAction={openSearchAction}
                                                onCompleteAction={handleCompleteSlot}
                                                onUndoCompleteAction={handleUndoComplete}
                                                onSkipSlotAction={handleSkipSlot}
                                                onUndoSkipAction={handleUndoSkip}
                                                onShareSlotAction={onShareSlotAction}
                                                swapOpenKey={swapOpenKey}
                                                stableSwapOpen={stableSwapOpen}
                                                stableSwapClose={stableSwapClose}
                                                handleSwapSelect={handleSwapSelect}
                                                handleUpdateInline={handleUpdateInline}
                                                handleRemove={handleRemove}
                                                handleSuggestionAdd={handleSuggestionAdd}
                                                swapCustomizeOpenKey={swapCustomizeOpenKey}
                                                stableSwapCustomizeOpen={stableSwapCustomizeOpen}
                                                stableSwapCustomizeClose={stableSwapCustomizeClose}
                                                handleSwapCustomizeApply={handleSwapCustomizeApply}
                                                handleAddAnother={handleAddAnother}
                                                preferences={preferences}
                                                today={today}
                                                dishes={dishes}
                                                user={user}
                                                pantryStaples={pantryStaples}
                                                stableGuestMode={stableGuestMode}
                                                completions={completions}
                                                skipped={skipped}
                                                undoSlot={undoSlot}
                                                handleCompleteSlot={handleCompleteSlot}
                                                handleUndoComplete={handleUndoComplete}
                                                handleSkipSlot={handleSkipSlot}
                                                handleUndoSkip={handleUndoSkip}
                                            />
                                        ))}
                                    </div>
                                ) : (
                                    <div className="py-6 text-center bg-gray-50 rounded-2xl border border-gray-100">
                                        <p className="text-sm font-bold text-gray-700">No meals planned for tomorrow</p>
                                        <p className="text-xs text-gray-500 mt-1">Add dishes to get started</p>
                                    </div>
                                )}
                                {/* Today's history — collapsed */}
                                <button
                                    onClick={() => setShowCompleted(!showCompleted)}
                                    className="flex items-center gap-2 text-[11px] font-bold text-gray-500 active:opacity-70 transition-opacity"
                                >
                                    <ChevronRight size={12} className={`transition-transform duration-200 ${showCompleted ? 'rotate-90' : ''}`} />
                                    {displayCompletedSlots.length} slot{displayCompletedSlots.length > 1 ? 's' : ''} completed today
                                </button>
                                {showCompleted && (
                                    <div className="space-y-3">
                                        {displayCompletedSlots.map(({ section, slot }) => (
                                            <DashboardSlotSection
                                                key={`hist-${slot.key}`}
                                                date={today}
                                                mealType={slot.mealType}
                                                slot={slot}
                                                section={section}
                                                sectionColors={SECTION_COLORS}
                                                sectionLabels={SECTION_LABELS}
                                                onOpenSearchAction={openSearchAction}
                                                onCompleteAction={handleCompleteSlot}
                                                onUndoCompleteAction={handleUndoComplete}
                                                onSkipSlotAction={handleSkipSlot}
                                                onUndoSkipAction={handleUndoSkip}
                                                onShareSlotAction={onShareSlotAction}
                                                swapOpenKey={swapOpenKey}
                                                stableSwapOpen={stableSwapOpen}
                                                stableSwapClose={stableSwapClose}
                                                handleSwapSelect={handleSwapSelect}
                                                handleUpdateInline={handleUpdateInline}
                                                handleRemove={handleRemove}
                                                handleSuggestionAdd={handleSuggestionAdd}
                                                swapCustomizeOpenKey={swapCustomizeOpenKey}
                                                stableSwapCustomizeOpen={stableSwapCustomizeOpen}
                                                stableSwapCustomizeClose={stableSwapCustomizeClose}
                                                handleSwapCustomizeApply={handleSwapCustomizeApply}
                                                handleAddAnother={handleAddAnother}
                                                preferences={preferences}
                                                today={today}
                                                dishes={dishes}
                                                user={user}
                                                pantryStaples={pantryStaples}
                                                stableGuestMode={stableGuestMode}
                                                completions={completions}
                                                skipped={skipped}
                                                undoSlot={undoSlot}
                                                handleCompleteSlot={handleCompleteSlot}
                                                handleUndoComplete={handleUndoComplete}
                                                handleSkipSlot={handleSkipSlot}
                                                handleUndoSkip={handleUndoSkip}
                                            />
                                        ))}
                                    </div>
                                )}
                            </div>
                        );
                    }
                    return (
                        <>
                            <div className="space-y-5">
                                {displayActiveUpcomingSlots.map(({ section, slot }) => (
                                    <DashboardSlotSection
                                        key={slot.key}
                                        date={today}
                                        mealType={slot.mealType}
                                        slot={slot}
                                        section={section}
                                        sectionColors={SECTION_COLORS}
                                        sectionLabels={SECTION_LABELS}
                                        onOpenSearchAction={openSearchAction}
                                        onCompleteAction={handleCompleteSlot}
                                        onUndoCompleteAction={handleUndoComplete}
                                        onSkipSlotAction={handleSkipSlot}
                                        onUndoSkipAction={handleUndoSkip}
                                        onShareSlotAction={onShareSlotAction}
                                        swapOpenKey={swapOpenKey}
                                        stableSwapOpen={stableSwapOpen}
                                        stableSwapClose={stableSwapClose}
                                        handleSwapSelect={handleSwapSelect}
                                        handleUpdateInline={handleUpdateInline}
                                        handleRemove={handleRemove}
                                        handleSuggestionAdd={handleSuggestionAdd}
                                        swapCustomizeOpenKey={swapCustomizeOpenKey}
                                        stableSwapCustomizeOpen={stableSwapCustomizeOpen}
                                        stableSwapCustomizeClose={stableSwapCustomizeClose}
                                        handleSwapCustomizeApply={handleSwapCustomizeApply}
                                        handleAddAnother={handleAddAnother}
                                        preferences={preferences}
                                        today={today}
                                        dishes={dishes}
                                        user={user}
                                        pantryStaples={pantryStaples}
                                        stableGuestMode={stableGuestMode}
                                        completions={completions}
                                        skipped={skipped}
                                        undoSlot={undoSlot}
                                        handleCompleteSlot={handleCompleteSlot}
                                        handleUndoComplete={handleUndoComplete}
                                        handleSkipSlot={handleSkipSlot}
                                        handleUndoSkip={handleUndoSkip}
                                    />
                                ))}
                            </div>

                            {/* ─── TODAY'S HISTORY (Completed & Skipped) ─── */}
                            {displayCompletedSlots.length > 0 && (
                                <div className="space-y-5 mt-5">
                                    <button
                                        onClick={() => setShowCompleted(!showCompleted)}
                                        className="flex items-center gap-2 mb-1 w-full text-left active:scale-[0.99] transition-all"
                                        aria-expanded={showCompleted}
                                    >
                                        <span className="text-base">📋</span>
                                        <span className="text-[11px] font-bold text-gray-500">{displayCompletedSlots.length} completed</span>
                                        <ChevronRight size={12} className={`text-gray-500 transition-transform duration-200 ${showCompleted ? 'rotate-90' : ''}`} />
                                    </button>
                                    {showCompleted && (
                                    <>
                                    {displayCompletedSlots.map(({ section, slot }) => (
                                        <DashboardSlotSection
                                            key={`hist-${slot.key}`}
                                            date={today}
                                            mealType={slot.mealType}
                                            slot={slot}
                                            section={section}
                                            sectionColors={SECTION_COLORS}
                                            sectionLabels={SECTION_LABELS}
                                            onOpenSearchAction={openSearchAction}
                                            onCompleteAction={handleCompleteSlot}
                                            onUndoCompleteAction={handleUndoComplete}
                                            onSkipSlotAction={handleSkipSlot}
                                            onUndoSkipAction={handleUndoSkip}
                                            onShareSlotAction={onShareSlotAction}
                                            swapOpenKey={swapOpenKey}
                                            stableSwapOpen={stableSwapOpen}
                                            stableSwapClose={stableSwapClose}
                                            handleSwapSelect={handleSwapSelect}
                                            handleUpdateInline={handleUpdateInline}
                                            handleRemove={handleRemove}
                                            handleSuggestionAdd={handleSuggestionAdd}
                                            swapCustomizeOpenKey={swapCustomizeOpenKey}
                                            stableSwapCustomizeOpen={stableSwapCustomizeOpen}
                                            stableSwapCustomizeClose={stableSwapCustomizeClose}
                                            handleSwapCustomizeApply={handleSwapCustomizeApply}
                                            handleAddAnother={handleAddAnother}
                                            preferences={preferences}
                                            today={today}
                                            dishes={dishes}
                                            user={user}
                                            pantryStaples={pantryStaples}
                                            stableGuestMode={stableGuestMode}
                                            completions={completions}
                                            skipped={skipped}
                                            undoSlot={undoSlot}
                                            handleCompleteSlot={handleCompleteSlot}
                                            handleUndoComplete={handleUndoComplete}
                                            handleSkipSlot={handleSkipSlot}
                                            handleUndoSkip={handleUndoSkip}
                                        />
                                    ))}
                                    </>
                                    )}
                                </div>
                            )}
                        </>
                    );
                })()}

            </div>

            {/* WhatsApp Share Modal */}
            <WhatsAppShareModal
                isOpen={shareType !== null}
                defaultPhone={user?.cookContact || ''}
                title="Daily meal plan"
                onClose={() => { setShareType(null); setSharePreselectSlot(null); }}
                previewBuilder={(language, selectedSlots) => shareType === 'prep' ? buildPrepMessage(language, selectedSlots) : buildPantryMessage(language, selectedSlots)}
                availableSlots={ACTIVE_SLOTS.map(s => ({ key: s.mealType, label: s.label }))}
                completedSlots={Object.entries(committedCompletions)
                    .filter(([key]) => key.startsWith(`${today}::`))
                    .map(([key]) => key.split('::')[1])}
                preselectedSlot={sharePreselectSlot}
            />

            {/* Undo toast */}
            {undoSlot && (
                <div className="fixed bottom-40 left-4 right-4 z-50 ">
                    <div className="bg-gray-900 text-white px-5 py-4 rounded-2xl shadow-2xl flex items-center justify-between">
                        <span className="text-sm font-medium">
                            {undoSlot.type === 'skip'
                                ? `${undoSlot.mealType.charAt(0).toUpperCase() + undoSlot.mealType.slice(1)} skipped`
                                : 'Marked as complete'
                            }
                        </span>
                        <button
                            onClick={() => undoSlot.type === 'skip'
                                ? handleUndoSkip(undoSlot.date, undoSlot.mealType)
                                : handleUndoComplete(undoSlot.date, undoSlot.mealType)
                            }
                            className="text-emerald-400 font-bold text-sm active:opacity-60"
                        >
                            Undo
                        </button>
                    </div>
                </div>
            )}

            {/* FAB — hidden while any modal is open */}
            {!showSlotPicker && !addDishOpen && !swapCustomizeOpenKey && (
            <div className="fixed bottom-24 right-6 z-[60]">
            <button
                onClick={() => setShowSlotPicker(true)}
                className="w-14 h-14 bg-[#FF385C] text-white rounded-full shadow-xl flex items-center justify-center active:scale-90 transition-all"
                aria-label="Add meal"
            >
                <Plus size={24} />
            </button>
            </div>
            )}

            {/* Slot picker */}
            {showSlotPicker && (() => {
                const pickDate = pendingDish && displayActiveUpcomingSlots.length === 0 && displayCompletedSlots.length > 0
                    ? getISODate(new Date(new Date(today).getTime() + 86400000))
                    : today;
                return (
                <div className="fixed inset-0 z-[60]" onClick={() => { setShowSlotPicker(false); setPendingDish(null); }}>
                    <div className="absolute inset-0 bg-black/30" />
                    <div
                        className="absolute bottom-0 left-0 right-0 bg-white rounded-t-3xl p-6 pb-[max(40px,env(safe-area-inset-bottom))] animate-in slide-in-from-bottom duration-200 max-w-lg mx-auto"
                        onClick={e => e.stopPropagation()}
                    >
                        <h3 className="text-lg font-black text-gray-900 mb-1">Add to which meal?</h3>
                        <p className="text-xs text-gray-500 mb-4">
                            {new Date(pickDate).toLocaleDateString('en-IN', { weekday: 'long', month: 'short', day: 'numeric' })}
                            {pickDate !== today && <span className="text-[#FF385C] ml-1">· Tomorrow</span>}
                        </p>
                        <div className="space-y-2">
                            {ACTIVE_SLOTS.map(({ label, key, mealType }) => {
                                const { start, end } = getSlotDefaultTimes(mealType, preferences);
                                const completionKey = slotKey(pickDate, mealType);
                                const expired = isAfterEnd(start, end) || committedCompletions[completionKey] != null;
                                return expired ? (
                                    <div
                                        key={key}
                                        className="w-full flex items-center gap-4 p-4 rounded-2xl border border-gray-100 opacity-50 cursor-default"
                                    >
                                        <span className="text-2xl w-10 h-10 flex items-center justify-center">
                                            {key === 'Breakfast' ? '🌅' : key === 'Lunch' ? '☀️' : key === 'Snacks' ? '🥜' : '🌙'}
                                        </span>
                                        <div className="text-left">
                                            <span className="text-sm font-bold text-gray-900 block">{label}</span>
                                            <span className="text-[10px] text-gray-500">
                                                {key === 'Breakfast' ? 'Morning meals' : key === 'Lunch' ? 'Midday meals' : key === 'Snacks' ? 'Evening bites' : 'Night meals'}
                                            </span>
                                        </div>
                                    </div>
                                ) : (
                                    <button
                                        key={key}
                                        onClick={() => {
                                            if (pendingDish) {
                                                handleQuickAddMeal(pickDate, key, pendingDish);
                                                setPendingDish(null);
                                                setShowSlotPicker(false);
                                            } else {
                                                setAddDishSlot(key.toLowerCase() as MealType);
                                                setAddDishOpen(true);
                                                setShowSlotPicker(false);
                                            }
                                        }}
                                        className="w-full flex items-center gap-4 p-4 rounded-2xl border border-gray-100 active:scale-[0.98] transition-all hover:bg-gray-50"
                                    >
                                        <span className="text-2xl w-10 h-10 flex items-center justify-center">
                                            {key === 'Breakfast' ? '🌅' : key === 'Lunch' ? '☀️' : key === 'Snacks' ? '🥜' : '🌙'}
                                        </span>
                                        <div className="text-left">
                                            <span className="text-sm font-bold text-gray-900 block">{label}</span>
                                            <span className="text-[10px] text-gray-500">
                                                {key === 'Breakfast' ? 'Morning meals' : key === 'Lunch' ? 'Midday meals' : key === 'Snacks' ? 'Evening bites' : 'Night meals'}
                                            </span>
                                        </div>
                                    </button>
                                );
                            })}
                        </div>
                        <button
                            onClick={() => { setShowSlotPicker(false); setPendingDish(null); }}
                            className="w-full mt-3 py-3 rounded-2xl bg-gray-100 text-gray-600 font-bold text-sm active:scale-[0.98] transition-all"
                        >
                            Cancel
                        </button>
                    </div>
                </div>
            );
            })()}

            {/* Quick Add Modal */}
            <QuickAddModal
                isOpen={showQuickAdd}
                onClose={() => setShowQuickAdd(false)}
                slot={quickAddSlot}
                date={today}
                dishes={dishes}
                userRegion={user?.region ?? 'India'}
                userDiet={user?.diet ?? 'veg'}
                onAddMeal={handleQuickAddMeal}
                selectedDishIds={selectedDishIds}
            />

            {/* Add Dish Modal — SwapCustomizeModal in search/add mode (FAB flow) */}
            {addDishOpen && (
                <Suspense fallback={null}><SwapCustomizeModal
                    key={`add_${addDishSlot}_${today}`}
                    isOpen={addDishOpen}
                    onClose={() => setAddDishOpen(false)}
                    date={today}
                    mealType={addDishSlot}
                    slotLabel={addDishSlot.charAt(0).toUpperCase() + addDishSlot.slice(1)}
                    item={ADD_DISH_DUMMY}
                    dishes={dishes}
                    userRegion={user?.region ?? 'India'}
                    userDiet={user?.diet ?? 'veg'}
                    onApply={() => {}}
                    onAddAnother={handleAddAnother}
                    onChange={() => {}}
                    initialAddMode={true}
                /></Suspense>
            )}

            {/* Tray Screen */}
            <TrayScreen
                isOpen={showTrayScreen}
                onClose={() => setShowTrayScreen(false)}
                initialDate={today}
                onNavigateToLoopSettings={() => onNavigate?.('profile')}
            />
        </div>
        </PullToRefresh>
    );
};

export default Dashboard;
