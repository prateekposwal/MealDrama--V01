// ─────────────────────────────────────────────────────────────────────────────
// PlanScreen — Week grid with inline swap enabled
// Empty slots auto-fill. Guest mode at plan level.
// ─────────────────────────────────────────────────────────────────────────────

import React, { useState, useMemo, useCallback, useEffect } from 'react';
import { useTrayStore, MealType, TrayItem } from '../store/useTrayStore';
import { useStore } from '../store/useStore';
import type { SuggestionMeal } from '../lib/trayApi';
import QuickAddModal from '../components/new/QuickAddModal';
import { useBackendDishes } from '../hooks/useBackendDishes';
import { ChevronLeft, ChevronRight, Calendar, Users, Plus, Minus } from 'lucide-react';
import type { Dish } from '../constants/dishLibrary';
import { SlotBody } from '../components/meal/SlotBody';
import LoopAutoFillSlot from '../components/meal/LoopAutoFillSlot';
import { useSwapCustomize } from '../components/meal/SwapCustomizeModalContext';
import { SLOT_META } from '../components/meal/MealCard';
import { dishToMeal } from '../utils/dishToMeal';
import { SLOTS } from '../utils/continuity';
import { computeStyleWarnings } from '../constants/dishStyles';

const getISODate = (d: Date) => d.toLocaleDateString('en-CA');

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
    const [quickAddDate, setQuickAddDate] = useState('');

    const {
        getMeals, addMealToSlot, swapMealInSlot, updateItemInline, removeMealFromSlot,
        guestMode, setGuestMode, completions, completeSlot, undoCompleteSlot,
    } = useTrayStore();
    const mealLoop = useTrayStore(s => s.mealLoop);
    const planDays = useTrayStore(s => s.plan.days);

    const [undoSlot, setUndoSlot] = useState<{ date: string; mealType: MealType } | null>(null);
    const committedCompletions = useMemo(() => {
        if (!undoSlot) return completions;
        const key = `${undoSlot.date}::${undoSlot.mealType}`;
        const next = { ...completions };
        delete next[key];
        return next;
    }, [completions, undoSlot]);

    const handleCompleteSlot = useCallback((date: string, mealType: MealType) => {
        completeSlot(date, mealType);
        setUndoSlot({ date, mealType });
        setTimeout(() => setUndoSlot(null), 10000);
    }, [completeSlot]);

    const handleUndoComplete = useCallback((date: string, mealType: MealType) => {
        undoCompleteSlot(date, mealType);
        setUndoSlot(null);
    }, [undoCompleteSlot]);

    const currentSlotMeals = useTrayStore(s => s.plan.days[quickAddDate]?.[quickAddSlot.toLowerCase() as MealType]);
    const selectedDishIds = useMemo(() => currentSlotMeals?.map(item => item.meal_id) ?? [], [currentSlotMeals]);

    const weekDates = useMemo(() => generateWeekDates(weekStart), [weekStart]);

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

    const handleAddAnother = useCallback((date: string, mealType: MealType, dish: Dish) => {
        const existing = getMeals(date, mealType);
        const existingItem = existing.find(m => m.meal_id === dish.id);
        if (existingItem) {
            updateItemInline(date, mealType, existingItem.id, {
                quantity: (existingItem.quantity || 1) + 1,
            });
            setToast({ message: `${dish.name} already in ${mealType} — quantity increased`, type: 'info' });
        } else {
            addMealToSlot(date, mealType, dishToMeal(dish));
            setToast({ message: `${dish.name} added to ${mealType}`, type: 'success' });
        }
    }, [getMeals, addMealToSlot, updateItemInline, dishToMeal, setToast]);

    const handleQuickAddMeal = useCallback((date: string, slot: string, dish: Dish) => {
        const mealType = slot.toLowerCase() as MealType;
        addMealToSlot(date, mealType, dishToMeal(dish));
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
                                            <SlotBody
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
                                                guestMode={guestMode}
                                                swapOpenKey={swapOpenKey}
                                                onSwapOpen={(id) => setSwapOpenKey(swapOpenKey === id ? null : id)}
                                                onSwapClose={() => setSwapOpenKey(null)}
                                                onSwapSelect={handleSwapSelect}
                                                onUpdateInline={handleUpdateInline}
                                                onRemove={handleRemove}
                                                onSuggestionAdd={handleSuggestionAdd}
                                                onOpenSearch={() => {
                                                    setQuickAddDate(date);
                                                    setQuickAddSlot(label);
                                                    setShowQuickAdd(true);
                                                }}
                                                swapCustomizeOpenKey={swapCustomizeOpenKey}
                                                onSwapCustomizeOpen={(id) => setSwapCustomizeOpenKey(swapCustomizeOpenKey === id ? null : id)}
                                                onSwapCustomizeClose={() => setSwapCustomizeOpenKey(null)}
                                                onSwapCustomizeApply={handleSwapCustomizeApply}
                                                onAddAnother={handleAddAnother}
                                                tomorrowDate={tomorrowDate}
                                                tomorrowMeals={tomorrowMeals}
                                                onComplete={() => handleCompleteSlot(date, mealType)}
                                                onUndoComplete={() => handleUndoComplete(date, mealType)}
                                                styleWarnings={styleWarnings}
                                                preferences={user?.slotTimePreferences}
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
                <div className="px-4 space-y-6">
                    {pastDatesWithMeals.map(date => {
                        const dateObj = new Date(date);
                        const dayName = dateObj.toLocaleDateString('en-IN', { weekday: 'short' });
                        const dayNum = dateObj.getDate();
                        const guestCount = guestMode.active ? guestMode.extraServings : 0;

                        return (
                            <div key={date}>
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
                                                    onSwapOpen={() => {}}
                                                    onSwapClose={() => {}}
                                                    onSwapSelect={() => {}}
                                                    onUpdateInline={() => {}}
                                                    onRemove={() => {}}
                                                    onSuggestionAdd={() => {}}
                                                    onOpenSearch={() => {}}
                                                    swapCustomizeOpenKey={null}
                                                    onSwapCustomizeOpen={() => {}}
                                                    onSwapCustomizeClose={() => {}}
                                                    onSwapCustomizeApply={() => () => {}}
                                                />
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>
                        );
                    })}
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
                        <span className="text-sm font-medium">Marked as complete</span>
                        <button
                            onClick={() => handleUndoComplete(undoSlot.date, undoSlot.mealType)}
                            className="text-emerald-400 font-bold text-sm active:opacity-60"
                        >
                            Undo
                        </button>
                    </div>
                </div>
            )}

            {/* FAB */}
            <div className="fixed bottom-24 right-6 z-40">
                <button
                    onClick={() => {
                        setQuickAddDate(today);
                        setQuickAddSlot('Lunch');
                        setShowQuickAdd(true);
                    }}
                    className="w-14 h-14 bg-[#FF385C] text-white rounded-full shadow-xl flex items-center justify-center active:scale-90 transition-all"
                    aria-label="Quick add meal"
                >
                    <Plus size={24} />
                </button>
            </div>

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
        </div>
    );
};

export default PlanScreen;
