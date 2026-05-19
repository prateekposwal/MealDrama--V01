// ─────────────────────────────────────────────────────────────────────────────
// MealTrayBuilder — Creation-optimized flow
// Same inline swap + empty state logic as Dashboard/Plan
// Focus: first-time tray setup with progressive disclosure
// ─────────────────────────────────────────────────────────────────────────────

import React, { useState, useMemo, useCallback, useEffect, useRef } from 'react';
import { useStore } from '../store/useStore';
import { useTrayStore, MealType, TrayItem } from '../store/useTrayStore';
import type { Meal } from '../types/tray';
import { MealCard, SLOT_META } from '../components/meal/MealCard';
import { SmartSuggestionChips } from '../components/meal/SmartSuggestionChips';
import type { SuggestionMeal } from '../lib/trayApi';
import { SwapCustomizeModal } from '../components/meal/SwapCustomizeModal';
import QuickAddModal from '../components/new/QuickAddModal';
import { useBackendDishes } from '../hooks/useBackendDishes';
import { ChevronRight, Sparkles, CheckCircle2, ShoppingBasket, Loader2, AlertCircle, RefreshCw, Clock, X } from 'lucide-react';
import type { Dish, DishVariant } from '../constants/dishLibrary';
import { dishToMeal } from '../utils/dishToMeal';
import { SLOT_TIME_DEFAULTS, aggregateSlotItems } from '../types/tray';
import type { AggregatedCategory } from '../types/tray';

type Slot = 'Breakfast' | 'Lunch' | 'Snacks' | 'Dinner';

const SLOTS: { key: Slot; mealType: MealType; label: Slot; icon: string; minRequired: number }[] = [
    { key: 'Breakfast', mealType: 'breakfast', label: 'Breakfast', icon: '🌅', minRequired: 3 },
    { key: 'Lunch', mealType: 'lunch', label: 'Lunch', icon: '☀️', minRequired: 3 },
    { key: 'Snacks', mealType: 'snacks', label: 'Snacks', icon: '🥜', minRequired: 3 },
    { key: 'Dinner', mealType: 'dinner', label: 'Dinner', icon: '🌙', minRequired: 3 },
];

const SLOT_MESSAGES: Record<string, { progress: string; done: string }> = {
    Breakfast: { progress: 'Pick 3 meals — your future hungry self thanks you.', done: 'Breakfast sorted. Ab bas khana hai, banana nahi.' },
    Lunch: { progress: 'Add meals to this thali.', done: 'Lunch locked. Afternoon nap is now strategic.' },
    Snacks: { progress: 'Snacks need more drama. Add picks.', done: 'Snacks ready. Real heroes of the day.' },
    Dinner: { progress: 'Dinner needs company. Add meals.', done: 'Dinner sorted. Kal subah easy rahega.' },
};

interface MealTrayBuilderProps {
    user: any;
    onComplete: () => void;
    defaultSlot?: string;
}

const getTodayISO = () => new Date().toLocaleDateString('en-CA');

export const MealTrayBuilder: React.FC<MealTrayBuilderProps> = ({ user: userProp, onComplete, defaultSlot }) => {
    const mountedRef = useRef(true);
    useEffect(() => () => { mountedRef.current = false; }, []);

    const { dishes, isLoading, error, retry } = useBackendDishes();
    const today = getTodayISO();

    const initialSlotIdx = useMemo(() => {
        if (!defaultSlot) return 0;
        const idx = SLOTS.findIndex(s => s.mealType === defaultSlot.toLowerCase());
        return idx >= 0 ? idx : 0;
    }, [defaultSlot]);
    const [currentSlotIdx, setCurrentSlotIdx] = useState(initialSlotIdx);
    const [swapOpenKey, setSwapOpenKey] = useState<string | null>(null);
    const [swapCustomizeOpenKey, setSwapCustomizeOpenKey] = useState<string | null>(null);
    const [showQuickAdd, setShowQuickAdd] = useState(false);
    const [quickAddSlot, setQuickAddSlot] = useState<'Breakfast' | 'Lunch' | 'Snacks' | 'Dinner'>('Breakfast');
    const [addDishOpen, setAddDishOpen] = useState(false);
    const [addAnotherToast, setAddAnotherToast] = useState<string | null>(null);

    const ADD_DISH_DUMMY: TrayItem = {
        id: '__add_dish__', meal_id: '__add_dish__', name: '', icon: '',
        quantity: 1, servings: 1, smartVersion: 1,
        gravy: null, roti: null, rice: null,
        sides: [], beverages: [], dessert: [], itemQtys: {},
    };
    // Scope: select only tray-needed fields from store — NOT the full user object
    const trayLibrary = useStore(s => s.trayLibrary);
    const removeFromTray = useStore(s => s.removeFromTray);
    const addToTray = useStore(s => s.addToTray);
    const updateProfile = useStore(s => s.updateProfile);
    const userRegion = useStore(s => s.user?.region ?? 'India');
    const userDiet = useStore(s => s.user?.diet ?? 'veg');
    const userPantryStaples = useStore(s => s.user?.pantryStaples) ?? [];
    const slotTimePrefs = useStore(s => s.user?.slotTimePreferences);

    const [slotTimes, setSlotTimes] = useState<Record<MealType, { start: string; end: string }>>(() => {
        const prefs = slotTimePrefs;
        return {
            breakfast: prefs?.breakfast ? { ...prefs.breakfast } : { ...SLOT_TIME_DEFAULTS.breakfast },
            lunch: prefs?.lunch ? { ...prefs.lunch } : { ...SLOT_TIME_DEFAULTS.lunch },
            snacks: prefs?.snacks ? { ...prefs.snacks } : { ...SLOT_TIME_DEFAULTS.snacks },
            dinner: prefs?.dinner ? { ...prefs.dinner } : { ...SLOT_TIME_DEFAULTS.dinner },
        };
    });
    const selectedDishIds = useMemo(() => {
        const slotKey = quickAddSlot.toLowerCase() as keyof typeof trayLibrary;
        return (trayLibrary[slotKey] || []).map(item => item.id);
    }, [trayLibrary, quickAddSlot]);

    const {
        getMeals, addMealToSlot, swapMealInSlot, updateItemInline, removeMealFromSlot,
    } = useTrayStore();
    const planDays = useTrayStore(s => s.plan.days);

    useEffect(() => {
        if (!slotTimePrefs) return;
        setSlotTimes(prev => {
            const next = { ...prev };
            let changed = false;
            for (const mt of ['breakfast', 'lunch', 'snacks', 'dinner'] as const) {
                if (slotTimePrefs[mt] && (prev[mt].start !== slotTimePrefs[mt]!.start || prev[mt].end !== slotTimePrefs[mt]!.end)) {
                    next[mt] = { ...slotTimePrefs[mt]! };
                    changed = true;
                }
            }
            return changed ? next : prev;
        });
    }, [slotTimePrefs]);

    const handleSlotTimeChange = useCallback((mealType: MealType, field: 'start' | 'end', value: string) => {
        setSlotTimes(prev => {
            const updated = { ...prev[mealType], [field]: value };
            const next = { ...prev, [mealType]: updated };
            const planItems = planDays[today]?.[mealType] || [];
            for (const item of planItems) {
                updateItemInline(today, mealType, item.id, {
                    start_time: next[mealType].start,
                    end_time: next[mealType].end,
                });
            }
            return next;
        });
        const current = slotTimes[mealType];
        const start = field === 'start' ? value : current?.start || SLOT_TIME_DEFAULTS[mealType].start;
        const end = field === 'end' ? value : current?.end || SLOT_TIME_DEFAULTS[mealType].end;
        const prefs = { ...slotTimePrefs, [mealType]: { start, end } };
        updateProfile({ slotTimePreferences: prefs });
        window.dispatchEvent(new Event('slot_times_updated'));
    }, [planDays, updateItemInline, today, slotTimePrefs, slotTimes, updateProfile]);

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

    const currentSlot = SLOTS[currentSlotIdx]!;
    const regionKey = userRegion;


    // Display meals: map each unique dish in the slot to its plan data (has full customization).
    // Deduplicates by dishId so the same dish doesn't appear twice.
    // Includes items from both trayLibrary AND planDays — dishes added via Quick Add
    // are only in planDays (not trayLibrary), so both sources must be merged.
    const displayMeals = useMemo((): TrayItem[] => {
        const slotKey = currentSlot.mealType;
        const trayItems = trayLibrary[slotKey] || [];
        const planItems = planDays[today]?.[slotKey] || [];
        const planMap = new Map(planItems.map(p => [p.meal_id, p]));
        const seen = new Set<string>();
        const def = SLOT_TIME_DEFAULTS[slotKey];
        const result: TrayItem[] = [];
        // 1. Items from trayLibrary (merging with plan data)
        for (const item of trayItems) {
            if (seen.has(item.dishId)) continue;
            seen.add(item.dishId);
            const planItem = planMap.get(item.dishId);
            const displayName = planItem?.name ?? item.name;
            result.push({
                id: planItem?.id ?? item.id,
                meal_id: item.dishId,
                name: displayName,
                title: planItem?.title,
                icon: item.icon,
                quantity: planItem?.quantity ?? item.quantity ?? 1,
                servings: planItem?.servings ?? 1,
                gravy: planItem?.gravy ?? null,
                roti: planItem?.roti ?? null,
                rice: planItem?.rice ?? null,
                sides: planItem?.sides ?? [],
                beverages: planItem?.beverages ?? [],
                dessert: planItem?.dessert ?? [],
                itemQtys: planItem?.itemQtys ?? {},
                style: planItem?.style,
                variant: planItem?.variant,
                variantId: planItem?.variantId,
                addon: planItem?.addon,
                start_time: planItem?.start_time || def?.start,
                end_time: planItem?.end_time || def?.end,
            });
        }
        // 2. Items from planDays NOT already in trayLibrary (e.g. Quick Add)
        for (const planItem of planItems) {
            if (seen.has(planItem.meal_id)) continue;
            seen.add(planItem.meal_id);
            result.push({
                id: planItem.id,
                meal_id: planItem.meal_id,
                name: planItem.name,
                title: planItem.title,
                icon: planItem.icon,
                quantity: planItem.quantity ?? 1,
                servings: planItem.servings ?? 1,
                gravy: planItem.gravy ?? null,
                roti: planItem.roti ?? null,
                rice: planItem.rice ?? null,
                sides: planItem.sides ?? [],
                beverages: planItem.beverages ?? [],
                dessert: planItem.dessert ?? [],
                itemQtys: planItem.itemQtys ?? {},
                style: planItem.style,
                variant: planItem.variant,
                variantId: planItem.variantId,
                addon: planItem.addon,
                start_time: planItem.start_time || def?.start,
                end_time: planItem.end_time || def?.end,
            });
        }
        return result;
    }, [trayLibrary, currentSlot.mealType, planDays, today]);

    const totalQty = displayMeals.length;
    const minMet = totalQty >= currentSlot.minRequired;
    const slotStatus = SLOT_MESSAGES[currentSlot.label]!;

    // Check overall progress using trayLibrary
    const allSlotsComplete = SLOTS.every(s => {
        const slotItems = trayLibrary[s.mealType] || [];
        return slotItems.length >= s.minRequired;
    });

    // Slot-level aggregation: deduplicate and merge quantities across all dishes in this slot
    const aggregated = useMemo(() => aggregateSlotItems(displayMeals), [displayMeals]);

    const handleAggregatedQty = useCallback((name: string, delta: number) => {
        const planItems = planDays[today]?.[currentSlot.mealType] || [];
        const hasItem = (item: TrayItem) =>
            item.roti === name || item.rice === name || item.gravy === name ||
            item.sides?.includes(name) || item.beverages?.includes(name) || item.dessert?.includes(name);
        const targets = planItems.filter(hasItem);
        if (targets.length === 0) return;
        let remaining = Math.abs(delta);
        const sign = delta > 0 ? 1 : -1;
        for (const item of targets) {
            if (remaining <= 0) break;
            const current = item.itemQtys?.[name] ?? 1;
            const next = Math.max(1, current + sign);
            if (next !== current) {
                const capped = sign > 0 ? Math.min(remaining, next - current) : -Math.min(remaining, current - 1);
                if (capped !== 0) {
                    updateItemInline(today, currentSlot.mealType, item.id, {
                        itemQtys: { ...item.itemQtys, [name]: current + capped },
                    });
                    remaining -= Math.abs(capped);
                }
            }
        }
    }, [planDays, today, updateItemInline, currentSlot.mealType]);

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

    const handleModalChange = useCallback((itemId: string, updates: Partial<TrayItem>) => {
        if (!currentSlot) return;
        updateItemInline(today, currentSlot.mealType, itemId, updates);
    }, [updateItemInline, today, currentSlot]);

    const handleSwapCustomizeApply = useCallback((itemId: string, updates: Partial<TrayItem>) => {
        const planItems = planDays[today]?.[currentSlot.mealType] || [];
        const currentItem = planItems.find(p => p.id === itemId);
        const isSwap = updates.meal_id && currentItem && updates.meal_id !== currentItem.meal_id;
        if (isSwap) {
            const dish = dishes.find(d => d.id === updates.meal_id);
            if (dish) {
                swapMealInSlot(today, currentSlot.mealType, itemId, dishToMeal(dish));
                removeFromTray(currentSlot.mealType, currentItem.meal_id);
                addToTray(currentSlot.mealType, {
                    id: dish.id,
                    dishId: dish.id,
                    name: updates.name || dish.name,
                    icon: dish.icon,
                    sourceRegion: dish.region,
                });
            }
        }
        updateItemInline(today, currentSlot.mealType, itemId, updates);
        setSwapCustomizeOpenKey(null);
    }, [updateItemInline, swapMealInSlot, today, currentSlot?.mealType, planDays, dishes, removeFromTray, addToTray]);

    const handleRemove = useCallback((mealType: MealType, item: TrayItem) => {
        return () => {
            removeFromTray(mealType, item.meal_id);
            removeMealFromSlot(today, mealType, item.id);
        };
    }, [removeFromTray, removeMealFromSlot, today]);

    const handleSuggestionAdd = useCallback((mealType: MealType) => {
        return (suggestion: SuggestionMeal) => {
            const t = slotTimes[mealType];
            addMealToSlot(today, mealType, suggestionToMeal(suggestion), {
                start_time: t?.start,
                end_time: t?.end,
            });
        };
    }, [addMealToSlot, suggestionToMeal, slotTimes, today]);

    const handleQuickAddMeal = useCallback((date: string, slot: string, dish: Dish, variant?: DishVariant) => {
        const mealType = slot.toLowerCase() as MealType;
        const t = slotTimes[mealType];
        addMealToSlot(date, mealType, dishToMeal(dish, variant), {
            start_time: t?.start,
            end_time: t?.end,
            variant: variant?.name,
            variantId: variant?.id,
            addon: variant?.addOn,
        });
    setShowQuickAdd(false);
  }, [addMealToSlot, slotTimes]);

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
    } else {
      const t = slotTimes[mealType];
      addMealToSlot(date, mealType, meal, {
        start_time: t?.start,
        end_time: t?.end,
        variant: variant?.name,
        variantId: variant?.id,
        addon: variant?.addOn,
      });
    }
    setAddAnotherToast(`Added to ${mealType.charAt(0).toUpperCase() + mealType.slice(1)}`);
    setTimeout(() => setAddAnotherToast(null), 3000);
  }, [addMealToSlot, dishToMeal, slotTimes, getMeals, updateItemInline]);

  const handleNextSlot = () => {
        if (currentSlotIdx < SLOTS.length - 1) {
            setCurrentSlotIdx(idx => idx + 1);
        } else if (allSlotsComplete) {
            onComplete();
        }
    };

    /** Validate times for the current slot + check overlaps */
    const timeValidation = useMemo((): { valid: boolean; message?: string } | null => {
        const cur = currentSlot.mealType;
        const curTime = slotTimes[cur];
        if (!curTime) return null;
        if (curTime.start >= curTime.end) return null; // Allow midnight-spanning slots
        // Check overlap with previous slot
        const slotOrder: MealType[] = ['breakfast', 'lunch', 'snacks', 'dinner'];
        const curIdx = slotOrder.indexOf(cur);
        if (curIdx > 0) {
            const prev = slotOrder[curIdx - 1];
            const prevTime = slotTimes[prev];
            if (prevTime && curTime.start < prevTime.end) {
                return { valid: false, message: `${prev} ends at ${prevTime.end}, ${cur} starts at ${curTime.start}` };
            }
        }
        // Check overlap with next slot
        if (curIdx < slotOrder.length - 1) {
            const next = slotOrder[curIdx + 1];
            const nextTime = slotTimes[next];
            if (nextTime && curTime.end > nextTime.start) {
                return { valid: false, message: `${cur} ends at ${curTime.end}, ${next} starts at ${nextTime.start}` };
            }
        }
        return { valid: true };
    }, [slotTimes, currentSlot.mealType]);

    useEffect(() => {
        console.log('[MealTrayBuilder] State — dishes:', dishes?.length, 'isLoading:', isLoading, 'error:', error, 'currentSlot:', currentSlotIdx, 'slotItems:', trayLibrary[currentSlot?.mealType]?.length, 'displayMeals:', displayMeals?.length, 'showQuickAdd:', showQuickAdd, 'swapOpenKey:', swapOpenKey);
    });

    return (
        <div className="min-h-screen flex flex-col bg-white">
            {/* Header */}
            <div className="sticky top-0 z-20 px-6 pt-14 pb-3 bg-white">
                <div className="flex items-center justify-between mb-2">
                    <div>
                        <span className="text-2xl font-black tracking-tight leading-none">
                            Meal<span className="text-[#FF385C]">Drama</span>
                        </span>
                        <div className="flex items-center gap-2 mt-2">
                            <span className="text-[10px] font-black uppercase tracking-widest text-[#FF385C] bg-[#FF385C]/10 px-3 py-1 rounded-full">
                                {currentSlot.icon} {currentSlot.label}
                            </span>
                        </div>
                    </div>
                    {/* Progress dots */}
                    <div className="flex items-center gap-2">
                        {SLOTS.map((s, idx) => {
                            const slotItems = trayLibrary[s.mealType] || [];
                            const done = slotItems.length >= s.minRequired;
                            return (
                                <div
                                    key={s.key}
                                    className={`w-2 h-2 rounded-full transition-all ${
                                        done ? 'bg-green-500' : idx === currentSlotIdx ? 'bg-[#FF385C]' : 'bg-gray-200'
                                    }`}
                                />
                            );
                        })}
                    </div>
                </div>
                <p className={`text-xs font-medium ${minMet ? 'text-emerald-600' : 'text-amber-600'}`}>
                    {minMet ? slotStatus.done : slotStatus.progress}
                </p>
            </div>

            {/* Slot Content */}
            <div className="flex-1 px-5 py-4 space-y-4">
                {/* Loading skeleton */}
                {isLoading && (
                    <div className="flex flex-col items-center justify-center py-20 gap-4">
                        <Loader2 size={28} className="animate-spin text-[#FF385C]" />
                        <p className="text-sm font-medium text-gray-400">Loading your meal plan…</p>
                        <div className="flex gap-3 mt-2">
                            {[1, 2, 3].map(i => (
                                <div key={i} className="w-36 h-24 rounded-xl animate-pulse bg-gray-100" />
                            ))}
                        </div>
                    </div>
                )}

                {/* Error state */}
                {!isLoading && error && (
                    <div className="flex flex-col items-center justify-center py-20 gap-4">
                        <AlertCircle size={28} className="text-red-400" />
                        <p className="text-sm font-medium text-gray-500 text-center px-8">{error}</p>
                        <button
                            onClick={retry}
                            className="flex items-center gap-2 px-6 py-3 rounded-[20px] bg-[#FF385C] text-white font-bold text-sm active:scale-95 transition-all"
                        >
                            <RefreshCw size={16} />
                            Retry
                        </button>
                    </div>
                )}

                {/* Normal content when loaded */}
                {!isLoading && !error && (
                    <>
                        {/* Current slot time picker — shows only this slot's time */}
                        <div className="px-1 pt-2 pb-3 border-b border-gray-100">
                            <div className="flex items-center gap-2">
                                <Clock size={12} className="text-gray-400" />
                                <span className="text-[10px] font-bold text-gray-500 w-14 flex-shrink-0">{currentSlot.label}</span>
                                <select
                                    value={slotTimes[currentSlot.mealType]?.start || SLOT_TIME_DEFAULTS[currentSlot.mealType].start}
                                    onChange={e => handleSlotTimeChange(currentSlot.mealType, 'start', e.target.value)}
                                    className="text-[10px] font-bold text-gray-700 bg-gray-50 border border-gray-200 rounded-lg px-1.5 py-1 appearance-none cursor-pointer text-center w-[62px] focus:outline-none focus:ring-2 focus:ring-[#FF385C]/20 focus:border-[#FF385C]"
                                >
                                    {Array.from({ length: 24 }, (_, i) =>
                                        `${String(i).padStart(2, '0')}:00`
                                    ).map(h => <option key={h} value={h}>{h}</option>)}
                                </select>
                                <span className="text-[8px] font-bold text-gray-400">to</span>
                                <select
                                    value={slotTimes[currentSlot.mealType]?.end || SLOT_TIME_DEFAULTS[currentSlot.mealType].end}
                                    onChange={e => handleSlotTimeChange(currentSlot.mealType, 'end', e.target.value)}
                                    className="text-[10px] font-bold text-gray-700 bg-gray-50 border border-gray-200 rounded-lg px-1.5 py-1 appearance-none cursor-pointer text-center w-[62px] focus:outline-none focus:ring-2 focus:ring-[#FF385C]/20 focus:border-[#FF385C]"
                                >
                                    {Array.from({ length: 24 }, (_, i) =>
                                        `${String(i).padStart(2, '0')}:00`
                                    ).map(h => <option key={h} value={h}>{h}</option>)}
                                </select>
                            </div>
                            {timeValidation && !timeValidation.valid && (
                                <p className="text-[10px] font-semibold text-red-500 mt-1">{timeValidation.message}</p>
                            )}
                        </div>

                        {/* Quick Add trigger — opens SwapCustomizeModal in add mode */}
                        <button
                            onClick={() => setAddDishOpen(true)}
                            className="w-full flex items-center gap-2 p-3 rounded-xl border-2 border-dashed transition-all active:scale-[0.98] border-gray-200 text-gray-500"
                        >
                            <Sparkles size={14} className="text-[#FF385C]" />
                            <span className="text-sm font-bold">Add another {currentSlot.label.toLowerCase()} dish</span>
                        </button>

                        {displayMeals.map((item: TrayItem) => (
                            <MealCard
                                key={item.id}
                                item={item}
                                date="today"
                                mealType={currentSlot.mealType}
                                slot={currentSlot.key}
                                dishes={dishes}
                                userRegion={regionKey}
                                userDiet={userDiet}
                                isLocked={false}
                                isMissed={false}
                                variant="compact"
                                hideTime
                                hideChips
                                swapOpen={swapOpenKey === item.id}
                                onSwapOpen={() => setSwapOpenKey(swapOpenKey === item.id ? null : item.id)}
                                onSwapClose={() => setSwapOpenKey(null)}
                                onSwapSelect={handleSwapSelect(today, currentSlot.mealType, item.id)}
                                onUpdateInline={handleUpdateInline(today, currentSlot.mealType, item.id)}
                                onRemove={handleRemove(currentSlot.mealType, item)}
                                swapCustomizeOpen={swapCustomizeOpenKey === item.id}
                                onSwapCustomizeOpen={() => setSwapCustomizeOpenKey(swapCustomizeOpenKey === item.id ? null : item.id)}
                                onSwapCustomizeClose={() => setSwapCustomizeOpenKey(null)}
                            />
                        ))}

                        {/* Empty state */}
                        {displayMeals.length === 0 && (
                            <SmartSuggestionChips
                                date="today"
                                mealType={currentSlot.mealType}
                                userRegion={regionKey}
                                userDiet={userDiet}
                                pantryStaples={userPantryStaples}
                                onAddMeal={handleSuggestionAdd(currentSlot.mealType)}
                                onOpenSearch={() => {
                                    setQuickAddSlot(currentSlot.label);
                                    setShowQuickAdd(true);
                                }}
                            />
                        )}

                        {/* Aggregated slot items: deduplicated across all dishes */}
                        {displayMeals.length > 0 && (
                            <div className="px-1 pt-2 pb-1 space-y-2">
                                <p className="text-[9px] font-black uppercase tracking-widest text-gray-400">
                                    {currentSlot.label} Total
                                </p>
                                {[
                                    { items: aggregated.gravy, label: 'Gravy', color: 'bg-amber-50 text-amber-700 border-amber-100' },
                                    { items: aggregated.roti, label: 'Bread', color: 'bg-orange-50 text-orange-700 border-orange-100' },
                                    { items: aggregated.rice, label: 'Rice', color: 'bg-blue-50 text-blue-700 border-blue-100' },
                                    { items: aggregated.sides, label: 'Sides', color: 'bg-gray-50 text-gray-500 border-gray-100' },
                                    { items: aggregated.beverages, label: 'Beverages', color: 'bg-gray-50 text-gray-500 border-gray-100' },
                                    { items: aggregated.dessert, label: 'Dessert', color: 'bg-pink-50 text-pink-700 border-pink-100' },
                                ].map(cat => cat.items.length > 0 && (
                                    <div key={cat.label} className="flex flex-wrap items-center gap-1.5">
                                        {cat.items.map((agg: AggregatedCategory) => (
                                            <span key={agg.name} className={`text-[9px] font-bold px-2 py-0.5 rounded-full border ${cat.color} inline-flex items-center gap-1`}>
                                                {cat.label === 'Dessert' && '🍨 '}{agg.name}
                                                <span className="inline-flex items-center gap-0.5 ml-1">
                                                    <button
                                                        onClick={() => handleAggregatedQty(agg.name, -1)}
                                                        className="w-3.5 h-3.5 flex items-center justify-center rounded-full bg-gray-100 text-[8px] font-bold text-gray-600 active:bg-gray-200 leading-none"
                                                    >−</button>
                                                    <span className="text-[9px] font-bold text-gray-700 min-w-[8px] text-center tabular-nums">{agg.totalQty}</span>
                                                    <button
                                                        onClick={() => handleAggregatedQty(agg.name, 1)}
                                                        className="w-3.5 h-3.5 flex items-center justify-center rounded-full bg-gray-100 text-[8px] font-bold text-gray-600 active:bg-gray-200 leading-none"
                                                    >+</button>
                                                    <span className="text-[7px] text-gray-400 ml-0.5">{agg.unit}</span>
                                                </span>
                                            </span>
                                        ))}
                                    </div>
                                ))}
                            </div>
                        )}

                    </>
                )}
            </div>

            {/* Bottom Bar */}
            <div className="sticky bottom-0 px-5 pb-10 pt-4 bg-white">
                {!isLoading && !error && !minMet && (
                    <div className="flex items-center gap-2 text-xs font-bold rounded-2xl px-4 py-3 mb-3 bg-amber-50 text-amber-700 border border-amber-100">
                        <ShoppingBasket size={14} />
                        Add {currentSlot.minRequired - displayMeals.length} more pick{currentSlot.minRequired - displayMeals.length !== 1 ? 's' : ''}.
                    </div>
                )}
                {!isLoading && !error && timeValidation !== null && !timeValidation.valid && (
                    <div className="flex items-center gap-2 text-xs font-bold rounded-2xl px-4 py-3 mb-3 bg-red-50 text-red-700 border border-red-100">
                        <Clock size={14} />
                        {timeValidation.message}
                    </div>
                )}
                <button
                    onClick={handleNextSlot}
                    disabled={isLoading || !!error || (timeValidation !== null && !timeValidation.valid)}
                    className={`w-full py-4 rounded-[20px] font-bold text-base flex items-center justify-center gap-2 transition-all ${
                        isLoading || error || (timeValidation !== null && !timeValidation.valid)
                            ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                            : minMet
                                ? 'bg-[#FF385C] text-white active:scale-[0.98]'
                                : 'bg-gray-100 text-gray-400 cursor-not-allowed'
                    }`}
                >
                    {isLoading ? (
                        <><Loader2 size={18} className="animate-spin" /> Loading…</>
                    ) : error ? (
                        'Waiting…'
                    ) : allSlotsComplete ? (
                        <>
                            <CheckCircle2 size={18} /> Lock It In
                        </>
                    ) : currentSlotIdx < SLOTS.length - 1 ? (
                        <>
                            {SLOTS[currentSlotIdx + 1]!.label} <ChevronRight size={18} />
                        </>
                    ) : (
                        'Complete setup'
                    )}
                </button>
            </div>

            {/* Add Another toast */}
            {addAnotherToast && (
                <div className="fixed top-4 left-4 right-4 z-[100] mx-auto max-w-lg animate-in slide-in-from-top-2 fade-in duration-200">
                    <div className="bg-emerald-600 text-white px-4 py-3 rounded-2xl shadow-2xl flex items-center justify-between">
                        <div className="flex items-center gap-2">
                            <span className="text-lg">✓</span>
                            <span className="font-medium text-sm">{addAnotherToast}</span>
                        </div>
                        <button
                            onClick={() => setAddAnotherToast(null)}
                            className="ml-2 p-1 hover:bg-white/20 rounded-lg"
                        >
                            <X size={16} />
                        </button>
                    </div>
                </div>
            )}

            {/* Quick Add Modal */}
            <QuickAddModal
                isOpen={showQuickAdd}
                onClose={() => setShowQuickAdd(false)}
                slot={quickAddSlot}
                date={today}
                dishes={dishes}
                userRegion={regionKey}
                userDiet={userDiet}
                onAddMeal={handleQuickAddMeal}
                selectedDishIds={selectedDishIds}
            />

            {/* Swap Customize Modal */}
            {(() => {
                const activeItem = displayMeals.find(m => m.id === swapCustomizeOpenKey);
                if (!activeItem || !currentSlot) return null;
                return (
                    <SwapCustomizeModal
                        key={`${currentSlot.label}_${today}`}
                        isOpen={swapCustomizeOpenKey !== null}
                        onClose={() => setSwapCustomizeOpenKey(null)}
                        date={today}
                        mealType={currentSlot.mealType}
                        slotLabel={currentSlot.label}
                        item={activeItem}
                        dishes={dishes}
                        userRegion={regionKey}
                        userDiet={userDiet}
                        onApply={handleSwapCustomizeApply}
                        onAddAnother={handleAddAnother}
                        onChange={handleModalChange}
                    />
                );
            })()}

            {/* Add Dish Modal — opens SwapCustomizeModal in search/add mode */}
            {addDishOpen && currentSlot && (
                <SwapCustomizeModal
                    key={`add_${currentSlot.label}_${today}`}
                    isOpen={addDishOpen}
                    onClose={() => setAddDishOpen(false)}
                    date={today}
                    mealType={currentSlot.mealType}
                    slotLabel={currentSlot.label}
                    item={ADD_DISH_DUMMY}
                    dishes={dishes}
                    userRegion={regionKey}
                    userDiet={userDiet}
                    onApply={() => {}}
                    onAddAnother={handleAddAnother}
                    onChange={handleModalChange}
                    initialAddMode={true}
                />
            )}
        </div>
    );
};

export default MealTrayBuilder;
