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
import { ChevronLeft, ChevronRight, Sparkles, CheckCircle2, ShoppingBasket, Loader2, AlertCircle, RefreshCw, Clock, X } from 'lucide-react';
import type { Dish, DishVariant } from '../constants/dishLibrary';
import { dishToMeal } from '../utils/dishToMeal';
import { suggestionToMeal } from '../utils/suggestionUtils';
import { SLOT_TIME_DEFAULTS } from '../types/tray';
import { getISODate } from '../utils/dateUTC';

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
    onBack?: () => void;
    defaultSlot?: string;
}

const getTodayISO = getISODate;

export const MealTrayBuilder: React.FC<MealTrayBuilderProps> = ({ user: userProp, onComplete, onBack, defaultSlot }) => {
    const mountedRef = useRef(true);
    useEffect(() => () => { mountedRef.current = false; }, []);

    const { dishes, isLoading, error, retry } = useBackendDishes();
    const today = getTodayISO();

    const plannedSlots = userProp?.plannedSlots ?? ['Breakfast', 'Lunch', 'Snacks', 'Dinner'];
    const ACTIVE_SLOTS = useMemo(() => SLOTS.filter(s => plannedSlots.includes(s.key)), [plannedSlots]);

    const initialSlotIdx = useMemo(() => {
        if (!defaultSlot) return 0;
        const idx = ACTIVE_SLOTS.findIndex(s => s.mealType === defaultSlot.toLowerCase());
        return idx >= 0 ? idx : 0;
    }, [defaultSlot, ACTIVE_SLOTS]);
    const [currentSlotIdx, setCurrentSlotIdx] = useState(initialSlotIdx);
    const [swapOpenKey, setSwapOpenKey] = useState<string | null>(null);
    const [swapCustomizeOpenKey, setSwapCustomizeOpenKey] = useState<string | null>(null);
    const [showQuickAdd, setShowQuickAdd] = useState(false);
    const [quickAddSlot, setQuickAddSlot] = useState<'Breakfast' | 'Lunch' | 'Snacks' | 'Dinner'>('Breakfast');
    const [addDishOpen, setAddDishOpen] = useState(false);
    const [addAnotherToast, setAddAnotherToast] = useState<string | null>(null);
    const [validationToast, setValidationToast] = useState<string | null>(null);

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
    const setToast = useStore(s => s.setToast);
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
        getMeals, addMealToSlot, swapMealInSlot, updateItemInline, removeMealFromSlot, batchUpdateItems,
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

    // FIX: One-time cleanup of duplicate dishes in plan.days (historical data)
    // Merges items with same name (case-insensitive) into single entry with summed quantity
    const _cleanupDone = useRef(false);
    useEffect(() => {
        if (_cleanupDone.current) return;
        _cleanupDone.current = true;

        for (const slot of ACTIVE_SLOTS) {
            const planItems = planDays[today]?.[slot.mealType] || [];
            if (planItems.length <= 1) continue;

            const nameMap = new Map<string, TrayItem>();
            let needsCleanup = false;

            for (const item of planItems) {
                const key = item.name.toLowerCase().trim();
                const existing = nameMap.get(key);
                if (existing) {
                    needsCleanup = true;
                    nameMap.set(key, {
                        ...existing,
                        quantity: (existing.quantity || 1) + (item.quantity || 1),
                        sides: [...new Set([...(existing.sides || []), ...(item.sides || [])])],
                    });
                } else {
                    nameMap.set(key, { ...item });
                }
            }

            if (needsCleanup) {
                const cleaned = Array.from(nameMap.values());
                useTrayStore.setState((s) => ({
                    plan: {
                        ...s.plan,
                        days: {
                            ...s.plan.days,
                            [today]: {
                                ...s.plan.days[today],
                                [slot.mealType]: cleaned,
                            },
                        },
                    },
                }));
            }
        }
    }, [planDays, today]);

    const handleSlotTimeChange = useCallback((mealType: MealType, field: 'start' | 'end', value: string) => {
        // H8: Compute new values inside setSlotTimes updater to avoid stale closure
        setSlotTimes(prev => {
            const updated = { ...prev[mealType], [field]: value };
            const next = { ...prev, [mealType]: updated };
            // H12: Batch update all items in one store transaction instead of N+1 calls
            const planItems = planDays[today]?.[mealType] || [];
            if (planItems.length > 0) {
                batchUpdateItems(today, mealType, planItems.map(item => ({
                    itemId: item.id,
                    updates: { start_time: next[mealType].start, end_time: next[mealType].end },
                })));
            }
            // H8: Dispatch profile update with computed values (not stale closure values)
            const prefs = { ...slotTimePrefs, [mealType]: { start: next[mealType].start, end: next[mealType].end } };
            updateProfile({ slotTimePreferences: prefs });
            window.dispatchEvent(new Event('slot_times_updated'));
            return next;
        });
    }, [planDays, batchUpdateItems, today, slotTimePrefs, updateProfile]);

    const currentSlot = ACTIVE_SLOTS[currentSlotIdx]!;
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

    // Check overall progress across both planDays and trayLibrary (dishes can be in either)
    const allSlotsComplete = ACTIVE_SLOTS.every(s => {
        const trayItems = trayLibrary[s.mealType] || [];
        const planItems = planDays[today]?.[s.mealType] || [];
        const unique = new Set([...trayItems.map(i => i.dishId), ...planItems.map(i => i.meal_id)]);
        return unique.size >= s.minRequired;
    });

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
            const existing = getMeals(today, mealType);
            const meal = suggestionToMeal(suggestion);
            if (existing.some(m => m.meal_id === meal.id || m.name.toLowerCase() === meal.name.toLowerCase())) {
                setToast({ message: `${meal.name} already added to ${mealType}`, type: 'info' });
                return;
            }
            addToTray(mealType, { id: suggestion.id, dishId: suggestion.id, name: suggestion.name, icon: suggestion.icon, sourceRegion: suggestion.region });
            addMealToSlot(today, mealType, meal, {
                start_time: t?.start,
                end_time: t?.end,
                source: 'onboarding',
            });
        };
    }, [addToTray, addMealToSlot, slotTimes, today, getMeals, setToast]);

    const suggestionAddHandler = useMemo(
        () => handleSuggestionAdd(currentSlot.mealType),
        [handleSuggestionAdd, currentSlot.mealType]
    );
    const handleOpenSearch = useCallback(() => {
        setQuickAddSlot(currentSlot.label);
        setShowQuickAdd(true);
    }, [currentSlot?.label]);
    const handleCloseQuickAdd = useCallback(() => {
        setShowQuickAdd(false);
    }, []);

    const handleQuickAddMeal = useCallback((date: string, slot: string, dish: Dish, variant?: DishVariant) => {
        const mealType = slot.toLowerCase() as MealType;
        const t = slotTimes[mealType];
        const meal = dishToMeal(dish, variant);
        const currentItems = getMeals(date, mealType);
        if (currentItems.some(m => m.meal_id === meal.id || m.name.toLowerCase() === meal.name.toLowerCase())) {
            setToast({ message: `${meal.name} already added to ${mealType}`, type: 'info' });
            setShowQuickAdd(false);
            return;
        }
        addToTray(mealType, { id: dish.id, dishId: dish.id, name: dish.name, icon: dish.icon, sourceRegion: dish.region });
        addMealToSlot(date, mealType, meal, {
            start_time: t?.start,
            end_time: t?.end,
            variant: variant?.name,
            variantId: variant?.id,
            addon: variant?.addOn,
            source: 'onboarding',
        });
        setShowQuickAdd(false);
    }, [addToTray, addMealToSlot, slotTimes, getMeals, setToast]);

  const handleAddAnother = useCallback((date: string, mealType: MealType, dish: Dish, variant?: DishVariant) => {
    const meal = dishToMeal(dish, variant);
    addToTray(mealType, { id: dish.id, dishId: dish.id, name: dish.name, icon: dish.icon, sourceRegion: dish.region });
    const existing = getMeals(date, mealType);
    // FIX: Check both meal_id AND name (case-insensitive) to catch cross-source duplicates
    const existingItem = existing.find(m => m.meal_id === dish.id || m.name.toLowerCase() === dish.name.toLowerCase());
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
        source: 'onboarding',
      });
    }
    setAddAnotherToast(`Added to ${mealType.charAt(0).toUpperCase() + mealType.slice(1)}`);
    setTimeout(() => setAddAnotherToast(null), 3000);
  }, [addToTray, addMealToSlot, dishToMeal, slotTimes, getMeals, updateItemInline]);

    const handleNextSlot = () => {
        if (currentSlotIdx < ACTIVE_SLOTS.length - 1) {
            setCurrentSlotIdx(idx => idx + 1);
        } else if (allSlotsComplete) {
            onComplete();
        } else {
            const incomplete = ACTIVE_SLOTS.filter(s => {
                const trayItems = trayLibrary[s.mealType] || [];
                const planItems = planDays[today]?.[s.mealType] || [];
                const unique = new Set([...trayItems.map(i => i.dishId ?? i.id), ...planItems.map(i => i.meal_id ?? i.id)]);
                return unique.size < s.minRequired;
            });
            const labels = incomplete.map(s => s.label);
            setValidationToast(`Add ${labels.length === 4 ? '3 dishes for each meal type' : `3+ dishes for ${labels.join(', ')}`} to continue`);
            setTimeout(() => setValidationToast(null), 4000);
        }
    };

    /** Validate times for the current slot + check overlaps */
    const timeValidation = useMemo((): { valid: boolean; message?: string } | null => {
        const cur = currentSlot.mealType as MealType;
        const curTime = slotTimes[cur];
        if (!cur || !curTime) return null;
        if (curTime.start >= curTime.end) return null; // Allow midnight-spanning slots
        // Check overlap with previous slot
        const slotOrder: MealType[] = ['breakfast', 'lunch', 'snacks', 'dinner'];
        const curIdx = slotOrder.indexOf(cur);
        if (curIdx > 0) {
            const prev = slotOrder[curIdx - 1] as MealType;
            const prevTime = slotTimes[prev];
            if (prevTime && curTime.start < prevTime.end) {
                return { valid: false, message: `${prev} ends at ${prevTime.end}, ${cur} starts at ${curTime.start}` };
            }
        }
        // Check overlap with next slot
        if (curIdx < slotOrder.length - 1) {
            const next = slotOrder[curIdx + 1] as MealType;
            const nextTime = slotTimes[next];
            if (nextTime && curTime.end > nextTime.start) {
                return { valid: false, message: `${cur} ends at ${curTime.end}, ${next} starts at ${nextTime.start}` };
            }
        }
        return { valid: true };
    }, [slotTimes, currentSlot.mealType]);

    return (
        <>
        <div className="min-h-screen flex flex-col bg-white">
            {/* Header */}
            <div className="sticky top-0 z-20 px-6 pt-14 pb-3 bg-white">
                <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                        {onBack && (
                            <button onClick={onBack} className="p-1 -ml-1 hover:bg-gray-100 rounded-xl transition-colors" aria-label="Go back">
                                <ChevronLeft size={22} className="text-gray-600" />
                            </button>
                        )}
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
                        {ACTIVE_SLOTS.map((s, idx) => {
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
                                onAddMeal={suggestionAddHandler}
                                onOpenSearch={() => setAddDishOpen(true)}
                            />
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
                {!isLoading && displayMeals.length > 0 && (
                        <button
                            onClick={() => setAddDishOpen(true)}
                            className="w-full flex items-center justify-center gap-2 py-4 rounded-xl border-2 border-dashed transition-all active:scale-[0.98] border-gray-200 text-gray-500 mb-3"
                        >
                            <Sparkles size={18} className="text-[#FF385C]" />
                            <span className="text-base font-bold">Add another {currentSlot.label.toLowerCase()} dish</span>
                        </button>
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
                    ) : currentSlotIdx < ACTIVE_SLOTS.length - 1 ? (
                        <>
                            {ACTIVE_SLOTS[currentSlotIdx + 1]!.label} <ChevronRight size={18} />
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
            {/* Validation toast — shown when user tries to complete without enough dishes */}
            {validationToast && (
                <div className="fixed top-20 left-4 right-4 z-[100] mx-auto max-w-lg animate-in slide-in-from-top-2 fade-in duration-200">
                    <div className="bg-amber-600 text-white px-4 py-3 rounded-2xl shadow-2xl flex items-center justify-between">
                        <div className="flex items-center gap-2">
                            <AlertCircle size={16} />
                            <span className="font-medium text-sm">{validationToast}</span>
                        </div>
                        <button
                            onClick={() => setValidationToast(null)}
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
                onClose={handleCloseQuickAdd}
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
        <style>{`
            .scrollbar-hide::-webkit-scrollbar { display: none; }
            .scrollbar-hide { -ms-overflow-style: none; scrollbar-width: none; }
        `}</style>
        </>
    );
};

export default MealTrayBuilder;
