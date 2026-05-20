// ─────────────────────────────────────────────────────────────────────────────
// PlanScreen — Week grid with inline swap enabled
// Empty slots auto-fill. Guest mode at plan level.
// ─────────────────────────────────────────────────────────────────────────────

import React, { useState, useMemo, useCallback, useEffect, useRef } from 'react';
import { useTrayStore, MealType, TrayItem, GuestMode } from '../store/useTrayStore';
import { useStore } from '../store/useStore';
import type { SuggestionMeal } from '../lib/trayApi';
import QuickAddModal from '../components/new/QuickAddModal';
import { SwapCustomizeModal } from '../components/meal/SwapCustomizeModal';
import { useBackendDishes } from '../hooks/useBackendDishes';
import { ChevronLeft, ChevronRight, Calendar, Users, Plus, Minus } from 'lucide-react';
import type { Dish, DishVariant } from '../constants/dishLibrary';
import { SlotBody, SlotBodyProps, SlotMode } from '../components/meal/SlotBody';
import { VirtualList } from '../components/new/VirtualList';
import LoopAutoFillSlot from '../components/meal/LoopAutoFillSlot';
import TrayScreen from '../components/new/TrayScreen';
import { useSwapCustomize } from '../components/meal/SwapCustomizeModalContext';
import { SLOT_META } from '../components/meal/MealCard';
import { dishToMeal } from '../utils/dishToMeal';
import { SLOTS } from '../utils/continuity';
import { getSkipUndoWindowExpiry } from '../types/tray';
import { computeStyleWarnings } from '../constants/dishStyles';

// ─── Slot Wrapper (stabilizes inline callbacks for React.memo) ───
interface PlanUpcomingSlotProps extends
  Omit<SlotBodyProps, 'onOpenSearch' | 'onComplete' | 'onUndoComplete' | 'onSkipSlot' | 'onUndoSkip'> {
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
    select: (...args: any[]) => any;
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

  return (
    <div>
      <div className="flex items-center gap-3 mb-3 px-2">
        <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 bg-gray-100 text-gray-400">
          <span className="text-xs font-black">{dayName.slice(0, 2)}</span>
        </div>
        <span className="text-lg font-bold text-gray-400">{dayNum}</span>
        {guestCount > 0 && (
          <span className="text-[9px] font-bold px-2 py-0.5 rounded-full bg-violet-100/50 text-violet-400">+{guestCount} guests</span>
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
                  <span className="text-[9px] font-medium text-gray-400">{slotMeta.time}</span>
                </div>
              )}
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
                swapOpenKey={null}
                onSwapOpen={noopHandlers.open}
                onSwapClose={noopHandlers.close}
                onSwapSelect={noopHandlers.select}
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
          );
        })}
      </div>
    </div>
  );
});


const getISODate = (d: Date) => d.toLocaleDateString('en-CA');

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
        const today = new Date();
        const dayOfWeek = today.getDay();
        const start = new Date(today);
        start.setDate(start.getDate() - dayOfWeek);
        return getISODate(start);
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

    const [swapOpenKey, setSwapOpenKey] = useState<string | null>(null);
    const { openKey: swapCustomizeOpenKey, setOpenKey: setSwapCustomizeOpenKey } = useSwapCustomize();
    const [showQuickAdd, setShowQuickAdd] = useState(false);
    const [quickAddSlot, setQuickAddSlot] = useState<'Breakfast' | 'Lunch' | 'Snacks' | 'Dinner'>('Lunch');
    const [showTrayScreen, setShowTrayScreen] = useState(false);
    const [trayDate, setTrayDate] = useState('');
    const [quickAddDate, setQuickAddDate] = useState('');
    const [showSlotPicker, setShowSlotPicker] = useState(false);
    const [addDishOpen, setAddDishOpen] = useState(false);
    const [addDishDate, setAddDishDate] = useState('');
    const [addDishSlot, setAddDishSlot] = useState<MealType>('breakfast');

    const ADD_DISH_DUMMY: TrayItem = {
        id: '__add_dish__', meal_id: '__add_dish__', name: '', icon: '',
        quantity: 1, servings: 1, smartVersion: 1,
        gravy: null, roti: null, rice: null,
        sides: [], beverages: [], dessert: [], itemQtys: {},
    };

    const getMeals = useTrayStore(s => s.getMeals);
    const addMealToSlot = useTrayStore(s => s.addMealToSlot);
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
    const mealLoop = useTrayStore(s => s.mealLoop);
    const planDays = useTrayStore(s => s.plan.days);

    const [undoSlot, setUndoSlot] = useState<{ date: string; mealType: MealType; type: 'complete' | 'skip' } | null>(null);
    const committedCompletions = useMemo(() => {
        if (!undoSlot) return completions;
        const key = `${undoSlot.date}::${undoSlot.mealType}`;
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

    const stableSwapOpen = useCallback((id: string) => {
        setSwapOpenKey(prev => prev === id ? null : id);
    }, []);

    const stableSwapCustomizeOpen = useCallback((id: string) => {
        setSwapCustomizeOpenKey(prev => prev === id ? null : id);
    }, []);

    const stableSwapClose = useCallback(() => setSwapOpenKey(null), []);
    const stableCustomizeClose = useCallback(() => setSwapCustomizeOpenKey(null), []);

    const quickAddTrigger = useRef({ date: '', label: '' });
    const handleOpenSearchStable = useCallback(() => {
        const { date, label } = quickAddTrigger.current;
        setQuickAddDate(date);
        setQuickAddSlot(label);
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

    const regionKey = user?.region ?? 'India';
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

    /** Convert SuggestionMeal to Meal */
    const suggestionToMeal = useCallback((s: SuggestionMeal): Meal => ({
        id: s.id,
        name: s.name,
        icon: s.icon,
        region: s.region.toLowerCase().includes('south') ? 'south'
            : s.region.toLowerCase().includes('east') ? 'east'
            : s.region.toLowerCase().includes('west') ? 'west'
            : 'north',
        baseGravy: s.defaultGravy,
        rotiOptions: s.defaultRoti ? [s.defaultRoti] : undefined,
        riceOptions: s.defaultRice ? [s.defaultRice] : undefined,
        suggestedPairings: {
            sides: s.defaultSides,
            beverages: s.defaultBeverages,
        },
    }), []);

    const handleSwapCustomizeApply = useCallback((date: string, mealType: MealType, itemId: string) => {
      return (updates: Partial<TrayItem>) => {
        updateItemInline(date, mealType, itemId, updates);
        setSwapCustomizeOpenKey(null);
      };
    }, [updateItemInline]);

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

    const handleSuggestionAdd = useCallback((date: string, mealType: MealType) => {
        return (suggestion: SuggestionMeal) => {
            addMealToSlot(date, mealType, suggestionToMeal(suggestion));
        };
    }, [addMealToSlot, suggestionToMeal]);

    const setToast = useStore(s => s.setToast);

    const handleAddAnother = useCallback((date: string, mealType: MealType, dish: Dish, variant?: DishVariant) => {
        const meal = dishToMeal(dish, variant);
        const existing = getMeals(date, mealType);
        const existingItem = existing.find(m => m.meal_id === dish.id);
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
            addMealToSlot(date, mealType, meal, {
                variant: variant?.name,
                variantId: variant?.id,
                addon: variant?.addOn,
            });
            setToast({ message: `${dish.name} added to ${mealType}`, type: 'success' });
        }
    }, [getMeals, addMealToSlot, updateItemInline, dishToMeal, setToast]);

    const handleQuickAddMeal = useCallback((date: string, slot: string, dish: Dish, variant?: DishVariant) => {
        const mealType = slot.toLowerCase() as MealType;
        addMealToSlot(date, mealType, dishToMeal(dish, variant), {
            variant: variant?.name,
            variantId: variant?.id,
            addon: variant?.addOn,
        });
        setShowQuickAdd(false);
    }, [addMealToSlot]);

    const today = getISODate(new Date());
    const [planTab, setPlanTab] = useState<'upcoming' | 'history'>('upcoming');
    const pastDates = useMemo(() => weekDates.filter(d => d < today), [weekDates, today]);
    const pastDatesWithMeals = useMemo(
        () => pastDates.filter(d => SLOTS.some(s => getMeals(d, s.mealType).length > 0)),
        [pastDates, getMeals],
    );

    const upcomingDates = useMemo(() => {
        if (mealLoop.config && Object.keys(planDays).length > 0) {
            return Object.keys(planDays).filter(d => d > today).sort();
        }
        return weekDates.filter(d => d > today);
    }, [weekDates, today, mealLoop.config, planDays]);

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
        <div className="pb-40 animate-in fade-in duration-300 bg-white">
            {/* ─── Header ─── */}
            <header className="px-6 pt-14 pb-4">
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-2xl font-black tracking-tight">Meal Plan</h1>
                        <div className="flex items-center gap-2 mt-1">
                            <Calendar size={12} className="text-[#FF385C]" />
                            <span className="text-xs font-bold text-gray-500">{weekLabel}</span>
                        </div>
                    </div>
                    {!mealLoop.config && (
                        <div className="flex items-center gap-2">
                            <button onClick={goToPrevWeek} className="w-8 h-8 rounded-xl flex items-center justify-center active:scale-90 bg-gray-100" aria-label="Previous week">
                                <ChevronLeft size={16} className="text-gray-700" />
                            </button>
                            <button onClick={goToNextWeek} className="w-8 h-8 rounded-xl flex items-center justify-center active:scale-90 bg-gray-100" aria-label="Next week">
                                <ChevronRight size={16} className="text-gray-700" />
                            </button>
                        </div>
                    )}
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
                                    className="text-[10px] font-bold text-violet-500 underline"
                                >
                                    Remove
                                </button>
                            </div>
                            <div className="flex items-center gap-2 mt-2">
                                <span className="text-[10px] text-violet-500 font-medium">Guests:</span>
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
                                        className="w-6 h-6 rounded-lg bg-white border border-violet-200 flex items-center justify-center text-violet-600 active:scale-90"
                                        aria-label="Remove guest"
                                    >
                                        <Minus size={10} />
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
                                        className="w-6 h-6 rounded-lg bg-white border border-violet-200 flex items-center justify-center text-violet-600 active:scale-90"
                                        aria-label="Add guest"
                                    >
                                        <Plus size={10} />
                                    </button>
                                </div>
                                <span className="text-[10px] text-violet-400 ml-auto">
                                    {weekStart} → {weekDates[weekDates.length - 1] || weekStart}
                                </span>
                            </div>
                            <p className="text-[9px] text-violet-500/70 mt-1.5">
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
            <div className="px-6 mb-4">
                <div className="flex gap-2">
                    <button
                        onClick={() => setPlanTab('upcoming')}
                        className={`px-4 py-2 rounded-full text-[10px] font-black uppercase tracking-widest transition-all ${
                            planTab === 'upcoming'
                                ? 'bg-gray-900 text-white'
                                : 'bg-gray-100 text-gray-500'
                        }`}
                    >
                        Upcoming
                    </button>
                    <button
                        onClick={() => setPlanTab('history')}
                        className={`px-4 py-2 rounded-full text-[10px] font-black uppercase tracking-widest transition-all ${
                            planTab === 'history'
                                ? 'bg-gray-900 text-white'
                                : 'bg-gray-100 text-gray-500'
                        }`}
                    >
                        History
                        {pastDatesWithMeals.length > 0 && (
                            <span className="ml-1.5 text-[8px] opacity-60">{pastDatesWithMeals.length}</span>
                        )}
                    </button>
                </div>
            </div>

            {/* ─── Upcoming (today + future) ─── */}
            {planTab === 'upcoming' && upcomingDates.length > 0 && (
                <div className="px-4 space-y-6">
                    {upcomingDates.map(date => {
                        const dateObj = new Date(date);
                        const dayName = dateObj.toLocaleDateString('en-IN', { weekday: 'short' });
                        const dayNum = dateObj.getDate();
                        const guestCount = guestMode.active ? guestMode.extraServings : 0;

                        return (
                            <div key={date}>
                                <div className="flex items-center gap-3 mb-3 px-2">
                                    <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 bg-gray-100 text-gray-500">
                                        <span className="text-xs font-black">{dayName.slice(0, 2)}</span>
                                    </div>
                                    <span className="text-lg font-bold text-gray-800">{dayNum}</span>
                                    {guestCount > 0 && (
                                        <span className="text-[9px] font-bold px-2 py-0.5 rounded-full bg-violet-100 text-violet-600">+{guestCount} guests</span>
                                    )}
                                </div>

                                <div className="space-y-3">
                                    {SLOTS.map(({ key, mealType, label }, i) => {
                                        const mode = 'upcoming';
                                        const tomorrowDate = getISODate(new Date(new Date(date).getTime() + 86400000));
                                        const tomorrowMeals = getMeals(tomorrowDate, mealType);
                                        const slotMealsForDate = getMeals(date, mealType);
                                        const styleWarnings = computeStyleWarnings(slotMealsForDate.map(m => ({ mealId: m.meal_id, name: m.name })));
                                        return <React.Fragment key={`${date}-${key}`}>
                                            <LoopAutoFillSlot date={date} mealType={mealType} />
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
                                                swapOpenKey={swapOpenKey}
                                                onSwapOpen={stableSwapOpen}
                                                onSwapClose={stableSwapClose}
                                                onSwapSelect={handleSwapSelect}
                                                onUpdateInline={handleUpdateInline}
                                                onRemove={handleRemove}
                                                onSuggestionAdd={handleSuggestionAdd}
                                                swapCustomizeOpenKey={swapCustomizeOpenKey}
                                                onSwapCustomizeOpen={stableSwapCustomizeOpen}
                                                onSwapCustomizeClose={stableCustomizeClose}
                                                onSwapCustomizeApply={handleSwapCustomizeApply}
                                                onAddAnother={handleAddAnother}
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
                                        </React.Fragment>
                                    })}
                                </div>
                            </div>
                        );
                    })}
                </div>
            )}

            {/* ─── History (past days) ─── */}
            {planTab === 'history' && pastDatesWithMeals.length > 0 && (
                <div ref={historyContainerRef} className="px-4">
                    {pastDatesWithMeals.length > 10 ? (
                        <VirtualList
                            items={pastDatesWithMeals}
                            estimateSize={280}
                            overscan={3}
                            renderItem={renderHistoryDay}
                            getKey={(date) => date}
                            outerClassName="overflow-auto h-[calc(100vh-240px)]"
                            className="space-y-6"
                        />
                    ) : (
                        <div className="space-y-6">
                            {pastDatesWithMeals.map(date => (
                                <div key={date}>{renderHistoryDay(date)}</div>
                            ))}
                        </div>
                    )}
                </div>
            )}

            {/* ─── Empty state ─── */}
            {planTab === 'upcoming' && upcomingDates.length === 0 && (
                <div className="px-6 text-center py-16">
                    <p className="text-sm font-bold text-gray-500">No upcoming days in this week</p>
                    <p className="text-xs mt-1 text-gray-400">Try a different week</p>
                </div>
            )}
            {planTab === 'history' && pastDatesWithMeals.length === 0 && (
                <div className="px-6 text-center py-16">
                    <p className="text-sm font-bold text-gray-500">No past meals yet</p>
                    <p className="text-xs mt-1 text-gray-400">Meals from past days will show here</p>
                </div>
            )}

            {/* Undo toast */}
            {undoSlot && (
                <div className="fixed bottom-40 left-4 right-4 z-50 mx-auto max-w-lg">
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

            {/* FAB */}
            <div className="fixed bottom-24 right-6 z-[60]">
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
            </div>

            {/* Slot picker */}
            {showSlotPicker && (
                <div className="fixed inset-0 z-[60]" onClick={() => setShowSlotPicker(false)}>
                    <div className="absolute inset-0 bg-black/30" />
                    <div
                        className="absolute bottom-0 left-0 right-0 bg-white rounded-t-3xl p-6 pb-10 animate-in slide-in-from-bottom duration-200 max-w-lg mx-auto"
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
                                        <span className="text-[8px] font-black uppercase tracking-widest block">{dayName}</span>
                                        <span className="text-sm font-bold block mt-0.5">{dayNum}</span>
                                    </button>
                                );
                            })}
                        </div>

                        {/* Slots */}
                        <div className="space-y-2">
                            {SLOTS.map(({ key, label }) => (
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
                                        <span className="text-[10px] text-gray-400">
                                            {key === 'Breakfast' ? 'Morning meals' : key === 'Lunch' ? 'Midday meals' : key === 'Snacks' ? 'Evening bites' : 'Night meals'}
                                        </span>
                                    </div>
                                </button>
                            ))}
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
            />

            {/* Add Dish Modal — SwapCustomizeModal in search/add mode (FAB flow) */}
            {addDishOpen && addDishDate && (
                <SwapCustomizeModal
                    key={`add_${addDishSlot}_${addDishDate}`}
                    isOpen={addDishOpen}
                    onClose={() => setAddDishOpen(false)}
                    date={addDishDate}
                    mealType={addDishSlot}
                    slotLabel={addDishSlot.charAt(0).toUpperCase() + addDishSlot.slice(1)}
                    item={ADD_DISH_DUMMY}
                    dishes={dishes}
                    userRegion={regionKey}
                    userDiet={userDiet}
                    onApply={() => {}}
                    onAddAnother={handleAddAnother}
                    onChange={() => {}}
                    initialAddMode={true}
                />
            )}
        </div>
    );
};

export default PlanScreen;
