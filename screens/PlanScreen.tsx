// ─────────────────────────────────────────────────────────────────────────────
// PlanScreen — Week grid with inline swap enabled
// Empty slots auto-fill. Guest mode at plan level.
// ─────────────────────────────────────────────────────────────────────────────

import React, { useState, useMemo, useCallback, useEffect, useRef, lazy, Suspense } from 'react';
import { useTrayStore, MealType, TrayItem, GuestMode } from '../plan/store/useTrayStore';
import { useLoopStore } from '../plan/store/useLoopStore';
import type { Meal } from '../types/tray';
import type { MealLoopConfig } from '../types/tray';
import type { SourcePool } from '../plan/utils/mealLoopEngine';
import { useStore } from '../app/store/useStore';
import type { SuggestionMeal } from '../app/lib/trayApi';
const QuickAddModal = lazy(() => import('../components/new/QuickAddModal'));
const SwapCustomizeModal = lazy(() => import('../components/meal/SwapCustomizeModal').then(m => ({ default: m.SwapCustomizeModal })));
const MealLoopConfigModal = lazy(() => import('../components/meal/MealLoopConfigModal'));
const DishSearchModal = lazy(() => import('../components/meal/DishSearchModal'));
import { useBackendDishes } from '../hooks/useBackendDishes';
import { useMealMap } from '../plan/hooks/useMealMap';
import { ChevronLeft, ChevronRight, ChevronDown, Calendar, Users, Plus, Minus, Navigation, Settings } from 'lucide-react';
import DishImage from '../components/new/DishImage';
import type { Dish, DishVariant } from '../meal/constants/dishLibrary';
import { useLockBodyScroll } from '../hooks/useLockBodyScroll';
import NotificationCenter from '../components/notification/NotificationCenter';
import { useBackButtonClose } from '../hooks/useBackButtonClose';
import { SlotBody, SlotBodyProps, SlotMode } from '../components/meal/SlotBody';
import { VirtualList } from '../components/new/VirtualList';
import LoopAutoFillSlot from '../components/meal/LoopAutoFillSlot';
import TrayScreen from '../components/new/TrayScreen';
import { useSwapCustomize } from '../components/meal/SwapCustomizeModalContext';
import PullToRefresh from '../components/new/PullToRefresh';
import { SLOT_META } from '../components/meal/MealCard';
import { dishToMeal } from '../utils/dishToMeal';
import { suggestionToMeal } from '../utils/suggestionUtils';
import { SLOTS } from '../plan/utils/continuity';
import { slotKey } from '../plan/utils/planIndex';
import { getRegionKey } from '../utils/dishSearch';
import { getSkipUndoWindowExpiry, isAfterEnd, getSlotDefaultTimes } from '../types/tray';
import { getISODate, getISTDayOfWeek, parseISODate, daysBetweenISO, addDaysISO } from '../utils/dateUTC';
import { computeStyleWarnings } from '../meal/constants/dishStyles';

/**
 * ID pinning hook: caps visible meals per slot to `maxVisible`.
 * Tracks specific meal IDs, not array positions.
 */
function usePinnedMeals(allMeals: TrayItem[], maxVisible = 2) {
  const visibleIdsRef = useRef<Set<string>>(new Set());
  return useMemo(() => {
    const currentIds = allMeals.map(m => m.id);
    const prevIds = [...visibleIdsRef.current];
    const keptIds = prevIds.filter(id => currentIds.includes(id));
    const newIds = currentIds.filter(id => !visibleIdsRef.current.has(id));
    let nextIds = [...keptIds];
    for (const newId of newIds) {
      if (nextIds.length < maxVisible) nextIds.push(newId);
    }
    if (nextIds.length === 0 && currentIds.length > 0) {
      nextIds = currentIds.slice(0, maxVisible);
    }
    visibleIdsRef.current = new Set(nextIds);
    return allMeals.filter(m => visibleIdsRef.current.has(m.id));
  }, [allMeals, maxVisible]);
}

// ─── Slot Wrapper (stabilizes inline callbacks for React.memo) ───
interface PlanUpcomingSlotProps extends
  Omit<SlotBodyProps, 'onOpenSearch' | 'onComplete' | 'onUndoComplete' | 'onSkipSlot' | 'onUndoSkip' | 'onShareSlot'> {
  onOpenSearchAction: (date: string, slotLabel: string) => void;
  onCompleteAction: (date: string, mealType: MealType) => void;
  onUndoCompleteAction: (date: string, mealType: MealType) => void;
  onSkipSlotAction: ((date: string, mealType: MealType) => void) | undefined;
  onUndoSkipAction: ((date: string, mealType: MealType) => void) | undefined;
}

const PlanUpcomingSlot = React.memo<PlanUpcomingSlotProps>(({
  date, mealType, slotLabel,
  onOpenSearchAction,
  onCompleteAction,
  onUndoCompleteAction,
  onSkipSlotAction,
  onUndoSkipAction,
  ...rest
}) => {
  const onOpenSearch = useCallback(() => {
    onOpenSearchAction(date, slotLabel);
  }, [date, slotLabel, onOpenSearchAction]);

  const onComplete = useCallback(() => {
    onCompleteAction(date, mealType);
  }, [date, mealType, onCompleteAction]);

  const onUndoComplete = useCallback(() => {
    onUndoCompleteAction(date, mealType);
  }, [date, mealType, onUndoCompleteAction]);

  const onSkipSlot = useCallback(() => {
    onSkipSlotAction?.(date, mealType);
  }, [date, mealType, onSkipSlotAction]);

  const onUndoSkip = useCallback(() => {
    onUndoSkipAction?.(date, mealType);
  }, [date, mealType, onUndoSkipAction]);

  return (
    <SlotBody
      date={date}
      mealType={mealType}
      slotLabel={slotLabel}
      onOpenSearch={onOpenSearch}
      onComplete={onComplete}
      onUndoComplete={onUndoComplete}
      onSkipSlot={onSkipSlotAction ? onSkipSlot : undefined}
      onUndoSkip={onUndoSkipAction ? onUndoSkip : undefined}
      {...rest}
    />
  );
});


// ─── History Day Row (stable, memoized  component for virtualized history) ───
interface HistoryDayRowProps {
  date: string;
  dishes: Dish[];
  regionKey: string;
  userDiet: string;
  pantryStaples: string[];
  guestMode: GuestMode;
  getMeals: (date: string, mealType: MealType) => TrayItem[];
  noopHandlers: {
    open: () => void;
    close: () => void;
    updateInline: (...args: any[]) => any;
    remove: (...args: any[]) => any;
    suggestionAdd: (...args: any[]) => any;
    openSearch: () => void;
    customizeOpen: (...args: any[]) => any;
    customizeClose: () => void;
    customizeApply: (...args: any[]) => any;
  };
}

const HistoryDayRow = React.memo<HistoryDayRowProps>(({
  date, dishes, regionKey, userDiet, pantryStaples,
  guestMode, getMeals, noopHandlers,
}) => {
  const dateObj = new Date(date);
  const dayName = dateObj.toLocaleDateString('en-IN', { weekday: 'short' });
  const dayNum = dateObj.getDate();
  const guestCount = guestMode.active ? guestMode.extraServings : 0;
  const historySlotColors: Record<string, string> = {
    breakfast: 'bg-rose-50/20',
    lunch: 'bg-blue-50/20',
    snacks: 'bg-amber-50/20',
    dinner: 'bg-violet-50/20',
  };

  return (
    <div>
      <div className="flex items-center gap-3 mb-3 px-2">
        <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 bg-gray-100 text-gray-500">
          <span className="text-xs font-black">{dayName.slice(0, 2)}</span>
        </div>
        <span className="text-lg font-bold text-gray-500">{dayNum}</span>
        {guestCount > 0 && (
          <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-violet-100/50 text-violet-400">+{guestCount} guests</span>
        )}
      </div>

      <div className="space-y-3">
          {SLOTS.map(({ key, mealType, label }) => {
            const slotMeals = getMeals(date, mealType);
            if (slotMeals.length === 0) return null;
            const slotMeta = SLOT_META[key];
            return (
              <div key={`${date}-${key}`}>
                {slotMeta && (
                  <div className="flex items-center gap-1.5 mb-1 px-2">
                    <span className="text-xs font-medium text-gray-500">{slotMeta.time}</span>
                  </div>
                )}
                <div className={`rounded-xl px-3 py-2 ${historySlotColors[mealType] || 'bg-gray-50/30'}`}>
                <SlotBody
                date={date}
                mealType={mealType}
                slotLabel={label}
                meals={slotMeals}
                mode="history"
                dishes={dishes}
                userRegion={regionKey}
                userDiet={userDiet}
                pantryStaples={pantryStaples}
                guestMode={guestMode}
                onUpdateInline={noopHandlers.updateInline}
                onRemove={noopHandlers.remove}
                onSuggestionAdd={noopHandlers.suggestionAdd}
                onOpenSearch={noopHandlers.openSearch}
                swapCustomizeOpenKey={null}
                onSwapCustomizeOpen={noopHandlers.customizeOpen}
                onSwapCustomizeClose={noopHandlers.customizeClose}
                onSwapCustomizeApply={noopHandlers.customizeApply}
              />
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
});

const NOOP = () => {};
const PARTIAL = () => () => {};

const generateWeekDates = (startISO: string): string[] => {
    const start = new Date(startISO);
    return Array.from({ length: 7 }, (_, i) => {
        const d = new Date(start);
        d.setDate(d.getDate() + i);
        return getISODate(d);
    });
};

interface PlanScreenProps {
    user: any;
}

export const PlanScreen: React.FC<PlanScreenProps> = ({ user }) => {
    const { dishes } = useBackendDishes();

    const [weekStart, setWeekStart] = useState(() => {
        const todayISO = getISODate();
        const dayOfWeek = getISTDayOfWeek(todayISO);
        const d = parseISODate(todayISO);
        const ms = d.getTime() - dayOfWeek * 86400000;
        return new Date(ms).toLocaleDateString('en-CA', { timeZone: 'Asia/Kolkata' });
    });

    const [loopRefreshKey, setLoopRefreshKey] = useState(0);
    useEffect(() => {
        const handler = () => setLoopRefreshKey(k => k + 1);
        window.addEventListener('loop_updated', handler);
        window.addEventListener('slot_times_updated', handler);
        return () => {
            window.removeEventListener('loop_updated', handler);
            window.removeEventListener('slot_times_updated', handler);
        };
    }, []);

    const { openKey: swapCustomizeOpenKey, setOpenKey: setSwapCustomizeOpenKey } = useSwapCustomize();
    const [showQuickAdd, setShowQuickAdd] = useState(false);
    const [quickAddSlot, setQuickAddSlot] = useState<'Breakfast' | 'Lunch' | 'Snacks' | 'Dinner'>('Lunch');
    const [showTrayScreen, setShowTrayScreen] = useState(false);
    const [trayDate, setTrayDate] = useState('');
    const [quickAddDate, setQuickAddDate] = useState('');
    const [showSlotPicker, setShowSlotPicker] = useState(false);
    useLockBodyScroll(showSlotPicker);
    useBackButtonClose(showSlotPicker, () => setShowSlotPicker(false));
    const [addDishOpen, setAddDishOpen] = useState(false);
    const [addDishDate, setAddDishDate] = useState('');
    const [addDishSlot, setAddDishSlot] = useState<MealType>('breakfast');
    const [showNavPicker, setShowNavPicker] = useState(false);
    const [navDate, setNavDate] = useState('');
    const [navSlot, setNavSlot] = useState<MealType | null>(null);
    useLockBodyScroll(showNavPicker);
    useBackButtonClose(showNavPicker, () => setShowNavPicker(false));
    const [showLoopModal, setShowLoopModal] = useState(false);
    const [expandedDay, setExpandedDay] = useState<string | null>(null);

    const getMeals = useTrayStore(s => s.getMeals);
    const addMealToSlot = useTrayStore(s => s.addMealToSlot);
    const addToTray = useStore(s => s.addToTray);
    const swapMealInSlot = useTrayStore(s => s.swapMealInSlot);
    const updateItemInline = useTrayStore(s => s.updateItemInline);
    const removeMealFromSlot = useTrayStore(s => s.removeMealFromSlot);
    const guestMode = useTrayStore(s => s.guestMode);
    const setGuestMode = useTrayStore(s => s.setGuestMode);
    const completions = useTrayStore(s => s.completions);
    const skipped = useTrayStore(s => s.skipped);
    const completeSlot = useTrayStore(s => s.completeSlot);
    const undoCompleteSlot = useTrayStore(s => s.undoCompleteSlot);
    const skipSlot = useTrayStore(s => s.skipSlot);
    const undoSkipSlot = useTrayStore(s => s.undoSkipSlot);
    const mealLoop = useLoopStore(s => s.mealLoop);
    const applyLoopConfig = useLoopStore(s => s.applyLoopConfig);
    const planPeriod = useTrayStore(s => s.plan.period);
    const planDays = useTrayStore(s => s.plan.days);

    const plannedSlots = user?.plannedSlots ?? ['Breakfast', 'Lunch', 'Snacks', 'Dinner'];
    const ACTIVE_SLOTS = useMemo(() => SLOTS.filter(s => plannedSlots.includes(s.key)), [plannedSlots]);
    const SLOT_COLORS: Record<string, string> = {
      breakfast: 'bg-rose-50/40',
      lunch: 'bg-blue-50/40',
      snacks: 'bg-amber-50/40',
      dinner: 'bg-violet-50/40',
    };

    // FIX: Deduplicate plan.days on mount to clean historical duplicates
    const _planCleanupDone = useRef(false);
    useEffect(() => {
        if (_planCleanupDone.current) return;
        _planCleanupDone.current = true;

        const cleanedDays: Record<string, any> = {};
        let needsCleanup = false;

        for (const [date, dayMeals] of Object.entries(planDays)) {
            const cleaned: any = { breakfast: [], lunch: [], snacks: [], dinner: [] };
            for (const slot of ['breakfast', 'lunch', 'snacks', 'dinner'] as const) {
                const items = dayMeals[slot] || [];
                if (items.length === 0) continue;
                // Deduplicate by meal_id (keep first occurrence)
                const seen = new Set<string>();
                const deduped: any[] = [];
                for (const item of items) {
                    const key = item.meal_id || item.id;
                    if (!seen.has(key)) {
                        seen.add(key);
                        deduped.push(item);
                    }
                }
                if (deduped.length !== items.length) {
                    needsCleanup = true;
                    cleaned[slot] = deduped;
                } else {
                    cleaned[slot] = deduped;
                }
            }
            cleanedDays[date] = cleaned;
        }

        if (needsCleanup) {
            useTrayStore.setState((s) => ({
                plan: { ...s.plan, days: { ...s.plan.days, ...cleanedDays } },
            }));
            console.log('[PlanScreen] Cleaned duplicate dishes from plan.days');
        }
    }, [planDays]);

    const traySourcePool = useMemo((): SourcePool => {
        const pool: SourcePool = { breakfast: [], lunch: [], snacks: [], dinner: [] };
        const seen = { breakfast: new Set(), lunch: new Set(), snacks: new Set(), dinner: new Set() };
        const trayLibrary = useStore.getState().trayLibrary;
        for (const mt of ['breakfast', 'lunch', 'snacks', 'dinner'] as MealType[]) {
            for (const option of trayLibrary[mt]) {
                const dish = dishes.find(d => d.id === option.dishId);
                if (dish && !seen[mt].has(dish.id)) { seen[mt].add(dish.id); pool[mt].push(dish); }
            }
        }
        for (const date of Object.keys(planDays)) {
            for (const mt of ['breakfast', 'lunch', 'snacks', 'dinner'] as MealType[]) {
                for (const item of planDays[date]?.[mt] || []) {
                    const dish = dishes.find(d => d.id === item.meal_id);
                    if (dish && !seen[mt].has(dish.id)) { seen[mt].add(dish.id); pool[mt].push(dish); }
                }
            }
        }
        return pool;
    }, [planDays, dishes]);

    const handleLoopApply = useCallback((config: any) => {
        applyLoopConfig(config, traySourcePool, dishes);
        window.dispatchEvent(new CustomEvent('loop_updated', { detail: { config } }));
        setShowLoopModal(false);
    }, [traySourcePool, applyLoopConfig, dishes]);

    const isPlanEnding = useMemo(() => {
        if (!mealLoop.config) return false;
        const endDate = addDaysISO(mealLoop.config.startDate, mealLoop.config.cycleLength * 7);
        const daysLeft = daysBetweenISO(getISODate(), endDate);
        return daysLeft <= 3 && daysLeft >= -7; // ending soon or recently ended
    }, [mealLoop.config]);

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

    const [undoSlot, setUndoSlot] = useState<{ date: string; mealType: MealType; type: 'complete' | 'skip' } | null>(null);
    const committedCompletions = useMemo(() => {
        if (!undoSlot) return completions;
        const key = slotKey(undoSlot.date, undoSlot.mealType);
        const next = { ...completions };
        delete next[key];
        return next;
    }, [completions, undoSlot]);

    const stableGuestMode = useMemo(() => guestMode, [
        guestMode.active, guestMode.guestCount, guestMode.extraServings,
        guestMode.startDate, guestMode.endDate,
    ]);

    const stablePreferences = useMemo(() => user?.slotTimePreferences, [user?.slotTimePreferences]);

    const stableNoopHandlers = useMemo(() => ({
        open: NOOP,
        close: NOOP,
        select: PARTIAL,
        updateInline: PARTIAL,
        remove: PARTIAL,
        suggestionAdd: PARTIAL,
        openSearch: NOOP,
        customizeOpen: NOOP,
        customizeClose: NOOP,
        customizeApply: PARTIAL,
    }), []);

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

    const currentSlotMeals = useTrayStore(s => s.plan.days[quickAddDate]?.[quickAddSlot.toLowerCase() as MealType]);
    const selectedDishIds = useMemo(() => currentSlotMeals?.map(item => item.meal_id) ?? [], [currentSlotMeals]);

    const weekDates = useMemo(() => generateWeekDates(weekStart), [weekStart]);

    // ─── Auto-reset guest mode when the week first becomes complete ───
    const weekMealMap = useMealMap(weekDates);
    const isWeekComplete = weekMealMap.totals.totalSlots > 0 && weekMealMap.totals.filledSlots === weekMealMap.totals.totalSlots;

    const mountedRef = useRef(false);
    const prevCompleteRef = useRef(false);
    useEffect(() => {
        const prev = prevCompleteRef.current;
        prevCompleteRef.current = isWeekComplete;
        if (!mountedRef.current) {
            mountedRef.current = true;
            return;
        }
        if (isWeekComplete && !prev && guestMode.active) {
            setGuestMode({ active: false, guestCount: 0, extraServings: 0, startDate: '', endDate: '' });
        }
    }, [isWeekComplete]);

    const stableSwapCustomizeOpen = useCallback((id: string) => {
        setSwapCustomizeOpenKey(id);
    }, []);

    const stableCustomizeClose = useCallback(() => setSwapCustomizeOpenKey(null), []);

    const quickAddTrigger = useRef({ date: '', label: '' });
    const handleOpenSearchStable = useCallback(() => {
        const { date, label } = quickAddTrigger.current;
        setQuickAddDate(date);
        setQuickAddSlot(label as 'Breakfast' | 'Lunch' | 'Snacks' | 'Dinner');
        setShowQuickAdd(true);
    }, []);

    const openSearchAction = useCallback((date: string, label: string) => {
        quickAddTrigger.current = { date, label };
        handleOpenSearchStable();
    }, [handleOpenSearchStable]);

    const goToPrevWeek = () => {
        const d = new Date(weekStart);
        d.setDate(d.getDate() - 7);
        setWeekStart(getISODate(d));
    };

    const goToNextWeek = () => {
        const d = new Date(weekStart);
        d.setDate(d.getDate() + 7);
        setWeekStart(getISODate(d));
    };

    const regionKey = getRegionKey(user?.region);
    const userDiet = user?.diet ?? 'veg';
    const pantryStaples = user?.pantryStaples ?? [];

    const historyContainerRef = useRef<HTMLDivElement>(null);
    const renderHistoryDay = useCallback((date: string) => (
        <HistoryDayRow
            date={date}
            dishes={dishes}
            regionKey={regionKey}
            userDiet={userDiet}
            pantryStaples={pantryStaples}
            guestMode={stableGuestMode}
            getMeals={getMeals}
            noopHandlers={stableNoopHandlers}
        />
    ), [dishes, regionKey, userDiet, pantryStaples, stableGuestMode, getMeals, stableNoopHandlers]);

    const handleSwapCustomizeApply = useCallback((date: string, mealType: MealType, itemId: string) => {
      return (updates: Partial<TrayItem>) => {
        updateItemInline(date, mealType, itemId, updates);
        setSwapCustomizeOpenKey(null);
        window.dispatchEvent(new CustomEvent('slotAdded', { detail: { date, mealType } }));
      };
    }, [updateItemInline]);

    const handleUpdateInline = useCallback((date: string, mealType: MealType, itemId: string) => {
        return (updates: Partial<TrayItem>) => {
            updateItemInline(date, mealType, itemId, updates);
        };
    }, [updateItemInline]);

    const handleRemove = useCallback((date: string, mealType: MealType, itemId: string) => {
        return () => {
            removeMealFromSlot(date, mealType, itemId);
        };
    }, [removeMealFromSlot]);

    const setToast = useStore(s => s.setToast);

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

    const handleBannerAdd = useCallback((date: string, mealType: MealType, dish: Dish) => {
        const meal = dishToMeal(dish);
        const currentItems = getMeals(date, mealType);
        if (currentItems.some(m => m.meal_id === dish.id || m.name.toLowerCase() === dish.name.toLowerCase())) {
            setToast({ message: `${dish.name} already added to ${mealType}`, type: 'info' });
            return;
        }
        addToTray(mealType, { id: dish.id, dishId: dish.id, name: dish.name, icon: dish.icon, sourceRegion: dish.region });
        addMealToSlot(date, mealType, meal);
        setToast({ message: `${dish.name} added to ${mealType}`, type: 'success' });
        window.dispatchEvent(new Event('slotAdded'));
    }, [addMealToSlot, getMeals, setToast, addToTray]);

    const today = getISODate(new Date());
    const [planTab, setPlanTab] = useState<'upcoming' | 'history'>('upcoming');
    const pastDates = useMemo(() => weekDates.filter(d => d < today), [weekDates, today]);
    const pastDatesWithMeals = useMemo(
        () => pastDates.filter(d => ACTIVE_SLOTS.some(s => getMeals(d, s.mealType).length > 0)),
        [pastDates, getMeals],
    );

    // H5: Use stable key string instead of planDays object reference
    // planDays is a new object on every store update — comparing keys avoids unnecessary recomputation
    const planDayKeys = useMemo(() => Object.keys(planDays).sort().join(','), [planDays]);

    const upcomingDates = useMemo(() => {
        if (mealLoop.config && planDayKeys.length > 0) {
            const start = mealLoop.config.startDate;
            const skipDays = mealLoop.config.skipDays || [];
            const maxActive = mealLoop.config.cycleLength;
            const cursor = new Date(start);
            let activeCount = 0;
            const endCap = new Date(start);
            endCap.setDate(endCap.getDate() + maxActive * 7);
            const endStr = endCap.toISOString().slice(0, 10);
            const sortedDates = planDayKeys.split(',').sort();
            return sortedDates.filter(d => {
                if (d <= today || d < start || d > endStr) return false;
                const target = new Date(d);
                while (cursor <= target) {
                    if (!skipDays.includes(cursor.getDay())) activeCount++;
                    if (activeCount > maxActive) return false;
                    cursor.setDate(cursor.getDate() + 1);
                }
                return true;
            });
        }
        return weekDates.filter(d => d > today);
    }, [weekDates, today, mealLoop.config, planDayKeys]);

    // Total meals across upcoming dates (cached via useMealMap)
    const upcomingMealMap = useMealMap(upcomingDates.length > 0 ? upcomingDates : undefined);
    const totalPlannedMeals = upcomingMealMap.totals.total;

    // Period label
    const periodLabel = useMemo(() => {
        switch (planPeriod) {
            case 'biweek': return 'biweek';
            case 'month': return 'month';
            default: return 'week';
        }
    }, [planPeriod]);

    // Week label
    const weekLabel = useMemo(() => {
        if (mealLoop.config && upcomingDates.length > 0) {
            const start = new Date(upcomingDates[0]!);
            const end = new Date(upcomingDates[upcomingDates.length - 1]!);
            const m1 = start.toLocaleDateString('en-IN', { month: 'short' });
            const m2 = end.toLocaleDateString('en-IN', { month: 'short' });
            return m1 === m2 ? `${m1} ${start.getDate()}–${end.getDate()}` : `${m1} ${start.getDate()} – ${m2} ${end.getDate()}`;
        }
        const start = new Date(weekStart);
        const end = new Date(start);
        end.setDate(end.getDate() + 6);
        const m1 = start.toLocaleDateString('en-IN', { month: 'short' });
        const m2 = end.toLocaleDateString('en-IN', { month: 'short' });
        return m1 === m2 ? `${m1} ${start.getDate()}–${end.getDate()}` : `${m1} ${start.getDate()} – ${m2} ${end.getDate()}`;
    }, [weekStart, mealLoop.config, upcomingDates]);

    return (
        <PullToRefresh onRefresh={() => { useTrayStore.getState().syncOfflineQueue(); return; }}>
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
            {/* ─── Header ─── */}
            <header className="px-4 pt-10 pb-4">
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-2xl font-black tracking-tight">Meal Plan</h1>
                        <div className="flex items-center gap-2 mt-1">
                            <Calendar size={12} className="text-[#FF385C]" />
                            <span className="text-xs font-bold text-gray-500">{weekLabel}</span>
                        </div>
                    </div>
                    <div className="flex items-center gap-2">
                        <NotificationCenter />
                        {!mealLoop.config && (
                            <>
                                <button onClick={goToPrevWeek} className="w-8 h-8 rounded-xl flex items-center justify-center active:scale-90 bg-gray-100" aria-label="Previous week">
                                    <ChevronLeft size={16} className="text-gray-700" />
                                </button>
                                <button onClick={goToNextWeek} className="w-8 h-8 rounded-xl flex items-center justify-center active:scale-90 bg-gray-100" aria-label="Next week">
                                    <ChevronRight size={16} className="text-gray-700" />
                                </button>
                            </>
                        )}
                    </div>
                </div>

                {/* Guest Mode */}
                <div className="mt-3">
                    {guestMode.active ? (
                        <div className="p-3 rounded-xl bg-violet-50 border border-violet-100">
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-2">
                                    <Users size={14} className="text-violet-600" />
                                    <span className="text-xs font-bold text-violet-700">
                                        {guestMode.guestCount || guestMode.extraServings} guest{guestMode.guestCount !== 1 ? 's' : ''}
                                    </span>
                                </div>
                                <button
                                    onClick={() => setGuestMode({ active: false, guestCount: 0, extraServings: 0, startDate: '', endDate: '' })}
                                    className="text-xs font-bold text-violet-500 underline"
                                >
                                    Remove
                                </button>
                            </div>
                            <div className="flex items-center gap-2 mt-2">
                                <span className="text-xs text-violet-500 font-medium">Guests:</span>
                                <div className="flex items-center gap-1">
                                    <button
                                        onClick={() => {
                                            const count = Math.max(1, (guestMode.guestCount || 1) - 1);
                                            setGuestMode({
                                                guestCount: count,
                                                extraServings: count,
                                                startDate: weekStart,
                                                endDate: weekDates[weekDates.length - 1] || weekStart,
                                            });
                                        }}
                                        className="w-8 h-8 rounded-lg bg-white border border-violet-200 flex items-center justify-center text-violet-600 active:scale-90"
                                        aria-label="Remove guest"
                                    >
                                        <Minus size={12} />
                                    </button>
                                    <span className="text-sm font-bold text-violet-700 w-6 text-center">
                                        {guestMode.guestCount || guestMode.extraServings}
                                    </span>
                                    <button
                                        onClick={() => {
                                            const count = (guestMode.guestCount || guestMode.extraServings) + 1;
                                            setGuestMode({
                                                guestCount: count,
                                                extraServings: count,
                                                startDate: weekStart,
                                                endDate: weekDates[weekDates.length - 1] || weekStart,
                                            });
                                        }}
                                        className="w-8 h-8 rounded-lg bg-white border border-violet-200 flex items-center justify-center text-violet-600 active:scale-90"
                                        aria-label="Add guest"
                                    >
                                        <Plus size={12} />
                                    </button>
                                </div>
                                <span className="text-xs text-violet-400 ml-auto">
                                    {weekStart} → {weekDates[weekDates.length - 1] || weekStart}
                                </span>
                            </div>
                            <p className="text-xs text-violet-500/70 mt-1.5">
                                Each meal gets +{guestMode.extraServings} extra serve{guestMode.extraServings !== 1 ? 's' : ''} across the week
                            </p>
                        </div>
                    ) : (
                        <button
                            onClick={() => {
                                const end = weekDates[weekDates.length - 1] || weekStart;
                                setGuestMode({
                                    active: true,
                                    guestCount: 1,
                                    extraServings: 1,
                                    startDate: weekStart,
                                    endDate: end,
                                });
                            }}
                            className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl border-2 border-dashed border-violet-200 text-violet-500 active:scale-[0.98] transition-all text-xs font-bold"
                        >
                            <Users size={14} />
                            Add Guests for This Week
                        </button>
                    )}
                </div>
            </header>

            {/* ─── Tab Nav ─── */}
            <div className="px-4 mb-4">
                <div className="flex gap-2">
                    <button
                        onClick={() => setPlanTab('upcoming')}
                        className={`px-4 py-2 rounded-full text-xs font-black uppercase tracking-widest transition-all ${
                            planTab === 'upcoming'
                                ? 'bg-gray-900 text-white'
                                : 'bg-gray-100 text-gray-500'
                        }`}
                    >
                        Upcoming
                    </button>
                    <button
                        onClick={() => setPlanTab('history')}
                        className={`px-4 py-2 rounded-full text-xs font-black uppercase tracking-widest transition-all ${
                            planTab === 'history'
                                ? 'bg-gray-900 text-white'
                                : 'bg-gray-100 text-gray-500'
                        }`}
                    >
                        History
                        {pastDatesWithMeals.length > 0 && (
                            <span className="ml-1.5 text-xs opacity-60">{pastDatesWithMeals.length}</span>
                        )}
                    </button>
                </div>
            </div>

            {/* ─── Mini-map: week at a glance ─── */}
            {planTab === 'upcoming' && upcomingDates.length > 0 && (
                <div className="px-4 mb-4 overflow-x-auto scrollbar-hide">
                    <div className="flex gap-1.5">
                        {upcomingDates.map(date => {
                            const dateObj = new Date(date);
                            const dayAbbr = dateObj.toLocaleDateString('en-IN', { weekday: 'short' }).slice(0, 1);
                            const dayNum = dateObj.getDate();
                            const effectiveExpanded = expandedDay ?? upcomingDates[0] ?? '';
                            const isActive = effectiveExpanded === date;
                            const slotStatus = ACTIVE_SLOTS.map(s => getMeals(date, s.mealType).length > 0);
                            return (
                                <button
                                    key={date}
                                    onClick={() => {
                                        setExpandedDay(date);
                                        setTimeout(() => {
                                            document.getElementById(`plan-day-${date}`)?.scrollIntoView({ behavior: 'smooth', block: 'start' });
                                        }, 100);
                                    }}
                                    className={`flex-shrink-0 px-3 py-2 rounded-xl text-center transition-all min-w-[52px] ${
                                        isActive ? 'bg-gray-900 text-white shadow-sm' : 'bg-gray-100 text-gray-600 active:scale-95'
                                    }`}
                                >
                                    <span className="text-xs font-black uppercase block leading-tight">{dayAbbr}</span>
                                    <span className="text-sm font-bold block leading-tight">{dayNum}</span>
                                    <div className="flex gap-0.5 mt-1 justify-center">
                                        {slotStatus.map((filled, i) => (
                                            <span
                                                key={i}
                                                className={`w-1.5 h-1.5 rounded-full ${
                                                    filled
                                                        ? isActive ? 'bg-white' : 'bg-gray-900'
                                                        : isActive ? 'bg-white/40' : 'bg-gray-300'
                                                }`}
                                            />
                                        ))}
                                    </div>
                                </button>
                            );
                        })}
                    </div>
                </div>
            )}

            {/* ─── Upcoming (today + future) ─── */}
            {planTab === 'upcoming' && upcomingDates.length > 0 && (
                <div className="px-4 space-y-6">
                    {upcomingDates.map(date => {
                        const dateObj = new Date(date);
                        const dayName = dateObj.toLocaleDateString('en-IN', { weekday: 'short' });
                        const dayNum = dateObj.getDate();
                        const guestCount = guestMode.active ? guestMode.extraServings : 0;
                        const effectiveExpanded = expandedDay ?? upcomingDates[0] ?? '';
                        const isExpanded = effectiveExpanded === date;

                        const toggleDay = () => {
                            setExpandedDay(prev => {
                                const current = prev ?? upcomingDates[0] ?? '';
                                return current === date ? null : date;
                            });
                        };

                        return (
                            <div key={date} id={`plan-day-${date}`}>
                                {/* Day header — sticky */}
                                <div
                                    className="sticky top-0 z-10 bg-white -mx-4 px-4 py-2 mb-3 flex items-center gap-2 cursor-pointer"
                                    onClick={toggleDay}
                                >
                                    <div className="flex items-center gap-3 flex-1 min-w-0">
                                        <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 bg-gray-100 text-gray-500">
                                            <span className="text-xs font-black">{dayName.slice(0, 2)}</span>
                                        </div>
                                        <span className="text-lg font-bold text-gray-800">{dayNum}</span>
                                        {guestCount > 0 && (
                                            <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-violet-100 text-violet-600">+{guestCount} guests</span>
                                        )}
                                    </div>
                                    <button
                                        onClick={e => { e.stopPropagation(); toggleDay(); }}
                                        className="w-8 h-8 flex items-center justify-center rounded-xl bg-gray-100 active:scale-90 transition-all flex-shrink-0"
                                        aria-label={isExpanded ? 'Collapse day' : 'Expand day'}
                                    >
                                        <ChevronDown
                                            size={16}
                                            className={`text-gray-500 transition-transform duration-200 ${isExpanded ? '' : '-rotate-90'}`}
                                        />
                                    </button>
                                </div>

                                {isExpanded ? (
                                    <div className="space-y-3">
                                        {ACTIVE_SLOTS.map(({ key, mealType, label }, i) => {
                                            const mode = 'upcoming';
                                            const tomorrowDate = getISODate(new Date(new Date(date).getTime() + 86400000));
                                            const tomorrowMeals = getMeals(tomorrowDate, mealType);
                                            const slotMealsForDate = getMeals(date, mealType);
                                            const styleWarnings = computeStyleWarnings(slotMealsForDate.map(m => ({ mealId: m.meal_id, name: m.name })));
                                            if (slotMealsForDate.length === 0) {
                                                return (
                                                    <React.Fragment key={`${date}-${key}`}>
                                                        <LoopAutoFillSlot date={date} mealType={mealType} />
                                                        <button
                                                            onClick={() => openSearchAction(date, label)}
                                                            className="w-full h-10 rounded-xl border-2 border-dashed border-gray-200 flex items-center justify-center gap-1.5 active:scale-[0.98] transition-all hover:border-gray-300"
                                                        >
                                                            <Plus size={14} className="text-gray-500" />
                                                            <span className="text-xs font-medium text-gray-500">{label}</span>
                                                        </button>
                                                    </React.Fragment>
                                                );
                                            }
                                            return <React.Fragment key={`${date}-${key}`}>
                                                <LoopAutoFillSlot date={date} mealType={mealType} />
                                                <div className={`rounded-xl px-3 py-2 ${SLOT_COLORS[mealType] || 'bg-gray-50/30'}`}>
                                                <PlanUpcomingSlot
                                                    date={date}
                                                    mealType={mealType}
                                                    slotLabel={label}
                                                    meals={slotMealsForDate}
                                                    mergeExtraItems
                                                    mode={mode}
                                                    dishes={dishes}
                                                    userRegion={regionKey}
                                                    userDiet={userDiet}
                                                    pantryStaples={pantryStaples}
                                                    guestMode={stableGuestMode}
                                                    onUpdateInline={handleUpdateInline}
                                                    onRemove={handleRemove}
                                                    onSuggestionAdd={handleSuggestionAdd}
                                                    swapCustomizeOpenKey={swapCustomizeOpenKey}
                                                    onSwapCustomizeOpen={stableSwapCustomizeOpen}
                                                    onSwapCustomizeClose={stableCustomizeClose}
                                                    onSwapCustomizeApply={handleSwapCustomizeApply}
                                                    onAddAnother={handleAddAnother}
                                                    regionKey={regionKey}
                                                    onAddSuggestion={handleBannerAdd}
                                                    tomorrowDate={tomorrowDate}
                                                    tomorrowMeals={tomorrowMeals}
                                                    styleWarnings={styleWarnings}
                                                    preferences={stablePreferences}
                                                onOpenSearchAction={openSearchAction}
                                                onCompleteAction={handleCompleteSlot}
                                                onUndoCompleteAction={handleUndoComplete}
                                                onSkipSlotAction={handleSkipSlot}
                                                onUndoSkipAction={handleUndoSkip}
                                                />
                                                </div>
                                            </React.Fragment>
                                        })}
                                    </div>
                                ) : (
                                    <div className="flex items-center gap-3 px-2 py-1.5 overflow-x-auto">
                                        {ACTIVE_SLOTS.map(({ key, mealType, label }) => {
                                            const filled = getMeals(date, mealType).length > 0;
                                            const meals = getMeals(date, mealType);
                                            return (
                                                <div key={key} className="flex items-center gap-1.5">
                                                    {filled ? meals.slice(0, 5).map((m, i) => (
                                                        <DishImage key={m.meal_id || i} name={m.name} size="xs" />
                                                    )) : (
                                                        <div className="w-8 h-8 rounded-xl bg-gray-100 border border-dashed border-gray-200 flex items-center justify-center">
                                                            <span className="text-xs text-gray-300 font-bold">{key === 'Breakfast' ? 'B' : key === 'Lunch' ? 'L' : key === 'Snacks' ? 'S' : 'D'}</span>
                                                        </div>
                                                    )}
                                                    {filled && <span className="text-xs font-medium text-gray-500 truncate max-w-[60px]">{meals[0]?.name}</span>}
                                                </div>
                                            );
                                        })}
                                    </div>
                                )}
                            </div>
                        );
                    })}
                </div>
            )}

            {/* ─── Floating completion summary ─── */}
            {planTab === 'upcoming' && upcomingDates.length <= 3 && upcomingDates.length > 0 && !undoSlot && (() => {
                const filledSlots = upcomingMealMap.totals.filledSlots;
                const totalSlots = upcomingMealMap.totals.totalSlots;
                return (
                <div className="fixed bottom-24 left-4 z-40 max-w-[260px]">
                    <div className="bg-white/95 backdrop-blur-sm border border-gray-200 rounded-2xl px-4 py-3 shadow-lg flex items-center justify-between">
                        <div className="flex items-center gap-2">
                            <span className="text-xs font-bold text-gray-900">{filledSlots}/{totalSlots} slots filled</span>
                            <span className="text-xs text-gray-500">{totalPlannedMeals} meals</span>
                        </div>
                        <button
                            onClick={() => window.dispatchEvent(new CustomEvent('navigate:profile'))}
                            className="text-xs font-bold px-2.5 py-1.5 rounded-lg bg-gray-900 text-white active:scale-95 transition-all inline-flex items-center gap-1"
                        >
                            Set up
                        </button>
                    </div>
                </div>
                );
            })()}

            {/* ─── History (past days) ─── */}
            {planTab === 'history' && pastDatesWithMeals.length > 0 && (
                <div ref={historyContainerRef} className="px-4">
                    {pastDatesWithMeals.length > 10 ? (
                        <VirtualList
                            items={pastDatesWithMeals}
                            estimateSize={280}
                            overscan={3}
                            renderItem={(date: string) => <div id={`plan-day-${date}`}>{renderHistoryDay(date)}</div>}
                            outerClassName="overflow-auto h-[calc(100vh-240px)]"
                            className="space-y-6"
                        />
                    ) : (
                        <div className="space-y-6">
                            {pastDatesWithMeals.map(date => (
                                <div key={date} id={`plan-day-${date}`}>{renderHistoryDay(date)}</div>
                            ))}
                        </div>
                    )}
                </div>
            )}

            {/* ─── Empty state ─── */}
            {planTab === 'upcoming' && upcomingDates.length === 0 && (
                <div className="px-4 text-center py-16">
                    <p className="text-sm font-bold text-gray-500">No upcoming days in this week</p>
                    {isPlanEnding ? (
                        <button
                            onClick={() => setShowLoopModal(true)}
                            className="mt-4 inline-flex items-center gap-2 px-4 py-3 rounded-2xl bg-[#FF385C] text-white font-bold text-sm active:scale-95 transition-all"
                        >
                            <Calendar size={16} /> Extend Plan
                        </button>
                    ) : (
                        <p className="text-xs mt-1 text-gray-500">Try a different week</p>
                    )}
                </div>
            )}
            {planTab === 'history' && pastDatesWithMeals.length === 0 && (
                <div className="px-4 text-center py-16">
                    <p className="text-sm font-bold text-gray-500">No past meals yet</p>
                    <p className="text-xs mt-1 text-gray-500">Meals from past days will show here</p>
                </div>
            )}

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

            {/* FABs — nav always visible when dates exist, add dish only in upcoming — hidden while any modal is open */}
            {!showSlotPicker && !addDishOpen && !swapCustomizeOpenKey && (planTab === 'upcoming' ? upcomingDates : pastDatesWithMeals).length > 0 && (
            <div className="fixed bottom-24 right-6 z-[60] flex flex-col items-center gap-3">
                {planTab === 'upcoming' && (
                <button
                    onClick={() => {
                        setQuickAddDate(upcomingDates[0] || today);
                        setShowSlotPicker(true);
                    }}
                    className="w-14 h-14 bg-[#FF385C] text-white rounded-full shadow-xl flex items-center justify-center active:scale-90 transition-all"
                    aria-label="Add meal"
                >
                    <Plus size={24} />
                </button>
                )}
            </div>
            )}

            {/* Slot picker */}
            {showSlotPicker && (
                <div className="fixed inset-0 z-[60]" onClick={() => setShowSlotPicker(false)}>
                    <div className="absolute inset-0 bg-black/30" />
                    <div
                        className="absolute bottom-0 left-0 right-0 bg-white rounded-t-3xl p-6 pb-[max(40px,env(safe-area-inset-bottom))] animate-in slide-in-from-bottom duration-200 max-w-lg mx-auto"
                        onClick={e => e.stopPropagation()}
                    >
                        <h3 className="text-lg font-black text-gray-900 mb-1">Add to which meal?</h3>
                        <p className="text-xs text-gray-500 mb-4">Select a day and meal slot</p>

                        {/* Date strip */}
                        <div className="flex gap-2 overflow-x-auto pb-1 mb-3">
                            {(upcomingDates.length > 0 ? upcomingDates : [today]).slice(0, 7).map(d => {
                                const dateObj = new Date(d);
                                const dayName = dateObj.toLocaleDateString('en-IN', { weekday: 'short' });
                                const dayNum = dateObj.getDate();
                                const selected = d === quickAddDate;
                                return (
                                    <button
                                        key={d}
                                        onClick={() => setQuickAddDate(d)}
                                        className={`flex-shrink-0 px-4 py-2.5 rounded-xl text-center transition-all ${
                                            selected ? 'bg-gray-900 text-white shadow-sm' : 'bg-gray-100 text-gray-600 active:scale-95'
                                        }`}
                                    >
                                        <span className="text-xs font-black uppercase tracking-widest block">{dayName}</span>
                                        <span className="text-sm font-bold block mt-0.5">{dayNum}</span>
                                    </button>
                                );
                            })}
                        </div>

                        {/* Slots */}
                        <div className="space-y-2">
                            {ACTIVE_SLOTS.map(({ key, label, mealType }) => {
                                const dateIsPast = quickAddDate < today;
                                const { start, end } = getSlotDefaultTimes(mealType, stablePreferences);
                                const completionKey = slotKey(quickAddDate, mealType);
                                const expired = dateIsPast || committedCompletions[completionKey] != null || (quickAddDate === today && isAfterEnd(start, end));
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
                                            <span className="text-xs text-gray-500">
                                                {key === 'Breakfast' ? 'Morning meals' : key === 'Lunch' ? 'Midday meals' : key === 'Snacks' ? 'Evening bites' : 'Night meals'}
                                            </span>
                                        </div>
                                    </div>
                                ) : (
                                    <button
                                        key={key}
                                        onClick={() => {
                                            setAddDishSlot(key.toLowerCase() as MealType);
                                            setAddDishDate(quickAddDate);
                                            setAddDishOpen(true);
                                            setShowSlotPicker(false);
                                        }}
                                        className="w-full flex items-center gap-4 p-4 rounded-2xl border border-gray-100 active:scale-[0.98] transition-all hover:bg-gray-50"
                                    >
                                        <span className="text-2xl w-10 h-10 flex items-center justify-center">
                                            {key === 'Breakfast' ? '🌅' : key === 'Lunch' ? '☀️' : key === 'Snacks' ? '🥜' : '🌙'}
                                        </span>
                                        <div className="text-left">
                                            <span className="text-sm font-bold text-gray-900 block">{label}</span>
                                            <span className="text-xs text-gray-500">
                                                {key === 'Breakfast' ? 'Morning meals' : key === 'Lunch' ? 'Midday meals' : key === 'Snacks' ? 'Evening bites' : 'Night meals'}
                                            </span>
                                        </div>
                                    </button>
                                );
                            })}
                        </div>
                        <button
                            onClick={() => setShowSlotPicker(false)}
                            className="w-full mt-3 py-3 rounded-2xl bg-gray-100 text-gray-600 font-bold text-sm active:scale-[0.98] transition-all"
                        >
                            Cancel
                        </button>
                    </div>
                </div>
            )}

            {/* Navigate picker */}
            {showNavPicker && (
                <div className="fixed inset-0 z-[60]" onClick={() => setShowNavPicker(false)}>
                    <div className="absolute inset-0 bg-black/30" />
                    <div
                        className="absolute bottom-0 left-0 right-0 bg-white rounded-t-3xl p-6 pb-[max(40px,env(safe-area-inset-bottom))] animate-in slide-in-from-bottom duration-200 max-w-lg mx-auto"
                        onClick={e => e.stopPropagation()}
                    >
                        <h3 className="text-lg font-black text-gray-900 mb-1">Navigate to day</h3>
                        <p className="text-xs text-gray-500 mb-4">{planTab === 'history' ? 'Jump to a past day' : 'Choose a date and meal slot'}</p>

                        {/* Date strip */}
                        <div className="flex gap-2 overflow-x-auto pb-1 mb-3">
                            {(() => {
                                const navDates = planTab === 'history'
                                    ? (pastDatesWithMeals.length > 0 ? pastDatesWithMeals : [today])
                                    : (upcomingDates.length > 0 ? upcomingDates : [today]);
                                return navDates.slice(0, 7).map(d => {
                                    const dateObj = new Date(d);
                                    const dayName = dateObj.toLocaleDateString('en-IN', { weekday: 'short' });
                                    const dayNum = dateObj.getDate();
                                    const selected = d === navDate;
                                    return (
                                        <button
                                            key={d}
                                            onClick={() => setNavDate(d)}
                                            className={`flex-shrink-0 px-4 py-2.5 rounded-xl text-center transition-all ${
                                                selected ? 'bg-gray-900 text-white shadow-sm' : 'bg-gray-100 text-gray-600 active:scale-95'
                                            }`}
                                        >
                                            <span className="text-xs font-black uppercase tracking-widest block">{dayName}</span>
                                            <span className="text-sm font-bold block mt-0.5">{dayNum}</span>
                                        </button>
                                    );
                                });
                            })()}
                        </div>

                        {/* Slots */}
                        <div className="space-y-2">
                            {ACTIVE_SLOTS.map(({ key, label, mealType }) => (
                                <button
                                    key={key}
                                    onClick={() => {
                                        setNavSlot(mealType);
                                        setShowNavPicker(false);
                                        setTimeout(() => {
                                            const el = document.getElementById(`plan-day-${navDate}`);
                                            if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' });
                                        }, 200);
                                    }}
                                    className={`w-full flex items-center gap-4 p-4 rounded-2xl border transition-all active:scale-[0.98] hover:bg-gray-50 ${
                                        navSlot === mealType ? 'border-gray-900 bg-gray-50' : 'border-gray-100'
                                    }`}
                                >
                                    <span className="text-2xl w-10 h-10 flex items-center justify-center">
                                        {key === 'Breakfast' ? '🌅' : key === 'Lunch' ? '☀️' : key === 'Snacks' ? '🥜' : '🌙'}
                                    </span>
                                    <div className="text-left">
                                        <span className="text-sm font-bold text-gray-900 block">{label}</span>
                                        <span className="text-xs text-gray-500">
                                            {key === 'Breakfast' ? 'Morning meals' : key === 'Lunch' ? 'Midday meals' : key === 'Snacks' ? 'Evening bites' : 'Night meals'}
                                        </span>
                                    </div>
                                </button>
                            ))}
                        </div>
                        <button
                            onClick={() => setShowNavPicker(false)}
                            className="w-full mt-3 py-3 rounded-2xl bg-gray-100 text-gray-600 font-bold text-sm active:scale-[0.98] transition-all"
                        >
                            Cancel
                        </button>
                    </div>
                </div>
            )}

            {/* Quick Add Modal */}
            <QuickAddModal
                isOpen={showQuickAdd}
                onClose={() => setShowQuickAdd(false)}
                slot={quickAddSlot}
                date={quickAddDate}
                dishes={dishes}
                userRegion={regionKey}
                userDiet={userDiet}
                onAddMeal={handleQuickAddMeal}
                selectedDishIds={selectedDishIds}
            />

            {/* Tray Screen — full meal visibility */}
            <TrayScreen
                isOpen={showTrayScreen}
                onClose={() => setShowTrayScreen(false)}
                initialDate={trayDate}
                onNavigateToLoopSettings={() => window.dispatchEvent(new CustomEvent('navigate:profile'))}
            />

            {/* Add Dish Modal — DishSearchModal (FAB flow) */}
            {addDishOpen && addDishDate && (
                <Suspense fallback={null}><DishSearchModal
                    isOpen={addDishOpen}
                    onClose={() => setAddDishOpen(false)}
                    dishes={dishes}
                    mealType={addDishSlot}
                    userRegion={regionKey}
                    userDiet={userDiet}
                    onSelect={(dish) => handleQuickAddMeal(addDishDate, addDishSlot, dish)}
                /></Suspense>
            )}

            {/* Meal Loop Config — Extend Plan */}
            {showLoopModal && (
                <Suspense fallback={null}><MealLoopConfigModal
                    isOpen={showLoopModal}
                    onClose={() => setShowLoopModal(false)}
                    sourcePool={traySourcePool}
                    plannedSlots={plannedSlots}
                    onApply={handleLoopApply}
                /></Suspense>
            )}
        </div>
        </PullToRefresh>
    );
};

export default PlanScreen;
