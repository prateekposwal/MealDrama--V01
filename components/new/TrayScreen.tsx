import React, { useMemo, useState, useCallback } from 'react';
import { useStore } from '../../app/store/useStore';
import { useTrayStore, MealType } from '../../plan/store/useTrayStore';
import { MealCard, SLOT_META } from '../meal/MealCard';
import { BlankSlot } from './BlankSlot';
import QuickAddModal from './QuickAddModal';
import { ChevronLeft, ChevronRight, Calendar, Users, X, Settings } from 'lucide-react';
import { useBackendDishes } from '../../hooks/useBackendDishes';
import type { Dish } from '../../meal/constants/dishLibrary';
import { dishToMeal } from '../../utils/dishToMeal';
import { SwapCustomizeModal } from '../meal/SwapCustomizeModal';
import type { TrayItem } from '../../plan/store/useTrayStore';
import { isAfterEnd, getSlotDefaultTimes } from '../../types/tray';
import { getISODate, getISTDayOfWeek, parseISODate } from '../../utils/dateUTC';

// LOOP UI REMOVED: Loop configuration moved to Profile → Plan Settings.
// This screen now focuses purely on curating default dishes per slot.
// Background loop engine (autoFillLoop, rotationQueue) remains intact.

type Slot = 'Breakfast' | 'Lunch' | 'Snacks' | 'Dinner';
const SLOTS: { key: Slot; mealType: MealType; label: Slot }[] = [
  { key: 'Breakfast', mealType: 'breakfast', label: 'Breakfast' },
  { key: 'Lunch', mealType: 'lunch', label: 'Lunch' },
  { key: 'Snacks', mealType: 'snacks', label: 'Snacks' },
  { key: 'Dinner', mealType: 'dinner', label: 'Dinner' },
];

interface TrayScreenProps {
    isOpen: boolean;
    onClose: () => void;
    initialDate?: string;
    initialSlot?: Slot;
    onNavigateToLoopSettings?: () => void;
}

const TrayScreen: React.FC<TrayScreenProps> = ({ isOpen, onClose, initialDate, initialSlot, onNavigateToLoopSettings }) => {
    const { dishes } = useBackendDishes();

    const [currentWeekStart, setCurrentWeekStart] = useState(() => {
        if (initialDate) {
            const dayOfWeek = getISTDayOfWeek(initialDate);
            const d = parseISODate(initialDate);
            const ms = d.getTime() - dayOfWeek * 86400000;
            return new Date(ms).toLocaleDateString('en-CA', { timeZone: 'Asia/Kolkata' });
        }
        const todayISO = getISODate();
        const dayOfWeek = getISTDayOfWeek(todayISO);
        const d = parseISODate(todayISO);
        const ms = d.getTime() - dayOfWeek * 86400000;
        return new Date(ms).toLocaleDateString('en-CA', { timeZone: 'Asia/Kolkata' });
    });
    const [swapCustomizeContext, setSwapCustomizeContext] = useState<{ itemId: string; date: string; mealType: MealType; slotLabel: string } | null>(null);
    const [quickAddOpen, setQuickAddOpen] = useState(false);
    const [quickAddSlot, setQuickAddSlot] = useState<Slot>('Lunch');
    const [quickAddDate, setQuickAddDate] = useState('');

    const currentSlotMeals = useTrayStore(s => s.plan.days[quickAddDate]?.[quickAddSlot.toLowerCase() as MealType]);
    const selectedDishIds = useMemo(() => currentSlotMeals?.map(item => item.meal_id) ?? [], [currentSlotMeals]);

    const user = useStore(s => s.user);
    const getMeals = useTrayStore(s => s.getMeals);
    const addMealToSlot = useTrayStore(s => s.addMealToSlot);
    const swapMealInSlot = useTrayStore(s => s.swapMealInSlot);
    const updateItemInline = useTrayStore(s => s.updateItemInline);
    const removeMealFromSlot = useTrayStore(s => s.removeMealFromSlot);
    const guestMode = useTrayStore(s => s.guestMode);
    const setGuestMode = useTrayStore(s => s.setGuestMode);
    const mealDataDays = useTrayStore(s => s.plan.days);

    const trayUserRegion = user?.region ?? 'India';
    const trayUserDiet = user?.diet ?? 'veg';
    const trayPantryStaples = user?.pantryStaples ?? [];

    const weekDates = useMemo(() => {
        const start = new Date(currentWeekStart);
        const dates: string[] = [];
        for (let i = 0; i < 7; i++) {
            const d = new Date(start);
            d.setDate(d.getDate() + i);
            dates.push(getISODate(d));
        }
        return dates;
    }, [currentWeekStart]);

    const goToPrevWeek = useCallback(() => {
        const start = new Date(currentWeekStart);
        start.setDate(start.getDate() - 7);
        setCurrentWeekStart(getISODate(start));
    }, [currentWeekStart]);

    const goToNextWeek = useCallback(() => {
        const start = new Date(currentWeekStart);
        start.setDate(start.getDate() + 7);
        setCurrentWeekStart(getISODate(start));
    }, [currentWeekStart]);

    const handleAddMeal = useCallback((date: string, slot: string, dish: any) => {
        const mealType = slot.toLowerCase() as MealType;
        addMealToSlot(date, mealType, dishToMeal(dish));
    }, [addMealToSlot]);

    const handleUpdateInline = useCallback((date: string, mealType: MealType, itemId: string) => {
        return (updates: any) => {
            updateItemInline(date, mealType, itemId, updates);
        };
    }, [updateItemInline]);

    const handleRemove = useCallback((date: string, mealType: MealType, itemId: string) => {
        return () => {
            removeMealFromSlot(date, mealType, itemId);
        };
    }, [removeMealFromSlot]);

    const handleModalChange = useCallback((itemId: string, updates: Partial<TrayItem>) => {
      if (!swapCustomizeContext) return;
      updateItemInline(swapCustomizeContext.date, swapCustomizeContext.mealType, itemId, updates);
    }, [updateItemInline, swapCustomizeContext]);

    const handleSwapCustomizeApply = useCallback((date: string, mealType: MealType, itemId: string) => {
      return (updates: Partial<TrayItem>) => {
        updateItemInline(date, mealType, itemId, updates);
        setSwapCustomizeContext(null);
      };
    }, [updateItemInline]);

    const openQuickAdd = useCallback((date: string, slot: Slot) => {
        setQuickAddDate(date);
        setQuickAddSlot(slot);
        setQuickAddOpen(true);
    }, []);

    const handleQuickAddMeal = useCallback((date: string, slot: string, dish: Dish, variant: any) => {
        const mealType = slot.toLowerCase() as MealType;
        addMealToSlot(date, mealType, dishToMeal(dish, variant), {
            variant: variant?.name,
            variantId: variant?.id,
            addon: variant?.addOn,
        });
        setQuickAddOpen(false);
    }, [addMealToSlot, dishToMeal]);

    const weekLabel = useMemo(() => {
        const start = new Date(currentWeekStart);
        const end = new Date(start);
        end.setDate(end.getDate() + 6);
        const monthStart = start.toLocaleDateString('en-IN', { month: 'short' });
        const monthEnd = end.toLocaleDateString('en-IN', { month: 'short' });
        if (monthStart === monthEnd) {
            return `${monthStart} ${start.getDate()}–${end.getDate()}`;
        }
        return `${monthStart} ${start.getDate()} – ${monthEnd} ${end.getDate()}`;
    }, [currentWeekStart]);

    const today = getISODate(new Date());

    const isSlotLocked = useCallback((date: string, slot: string) => {
        if (date < today) return true;
        if (date === today) {
            const mealType = slot.toLowerCase() as MealType;
            const { start, end } = getSlotDefaultTimes(mealType);
            return isAfterEnd(start, end);
        }
        return false;
    }, [today]);

    const isSlotMissed = useCallback((date: string, slot: string) => {
        if (date !== today) return false;
        const mealType = slot.toLowerCase() as MealType;
        const { start, end } = getSlotDefaultTimes(mealType);
        return isAfterEnd(start, end);
    }, [today]);

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-[60] bg-black/50 flex items-end justify-center" onClick={onClose}>
            <div
                className="w-full max-w-lg rounded-t-3xl flex flex-col max-h-[85dvh] animate-in slide-in-from-bottom duration-300 bg-white pb-[env(safe-area-inset-bottom)]"
                onClick={e => e.stopPropagation()}
            >
                {/* Header */}
                <div className="px-6 pt-5 pb-3 border-b flex items-center justify-between border-gray-100">
                    <div className="flex-1">
                        <div className="flex items-center gap-2">
                            <Calendar size={14} className="text-[#FF385C]" />
                            <h2 className="text-lg font-black text-gray-900">
                                Meal Plan
                            </h2>
                        </div>
                        <p className="text-xs mt-0.5 text-gray-500">
                            {weekLabel}
                        </p>
                        {/* LOOP UI REMOVED: Helper text pointing to Profile for loop settings */}
                        <p className="text-[10px] mt-1 text-gray-400 leading-tight">
                            These dishes auto-fill future days. Loop &amp; scheduling in Profile → Plan Settings.
                        </p>
                    </div>
                    <div className="flex items-center gap-2 ml-3">
                        <button
                            onClick={goToPrevWeek}
                            className="w-8 h-8 rounded-xl flex items-center justify-center active:scale-90 bg-gray-100"
                             aria-label="Previous week"
                        >
                             <ChevronLeft size={16} className="text-gray-700" />
                        </button>
                        <button
                            onClick={goToNextWeek}
                            className="w-8 h-8 rounded-xl flex items-center justify-center active:scale-90 bg-gray-100"
                             aria-label="Next week"
                        >
                             <ChevronRight size={16} className="text-gray-700" />
                        </button>
                        <button
                            onClick={onClose}
                            className="w-8 h-8 rounded-xl flex items-center justify-center active:scale-90 bg-gray-100"
                             aria-label="Close"
                        >
                             <X size={16} className="text-gray-700" />
                        </button>
                    </div>
                </div>

                {/* Guest Mode Indicator */}
                {guestMode.active && (
                    <div className="mx-6 mt-3 flex items-center gap-2 px-3 py-2 rounded-xl bg-violet-50 text-violet-600">
                        <Users size={12} />
                        <span className="text-xs font-bold">+{guestMode.extraServings} guest servings</span>
                    </div>
                )}

                {/* Scrollable Content */}
                <div className="flex-1 overflow-y-auto px-4 py-4 space-y-6">
                    {weekDates.map(date => {
                        const dateObj = new Date(date);
                        const dayName = dateObj.toLocaleDateString('en-IN', { weekday: 'short' });
                        const dayNum = dateObj.getDate();
                        const isToday = date === getISODate(new Date());

                        return (
                            <div key={date}>
                                {/* Day Header */}
                                <div className="flex items-center gap-3 mb-3 px-2">
                                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 ${isToday ? 'bg-[#FF385C] text-white' : 'bg-gray-100 text-gray-500'}`}>
                                        <span className="text-xs font-black">{dayName.slice(0, 2)}</span>
                                    </div>
                                    <span className="text-lg font-bold text-gray-800">{dayNum}</span>
                                    {isToday && (
                                        <span className="text-[9px] font-black uppercase tracking-widest bg-[#FF385C] text-white px-2 py-0.5 rounded-full">Today</span>
                                    )}
                                </div>

                                {/* Slots */}
                                <div className="space-y-3">
                                    {SLOTS.map(({ key, mealType, label }) => {
                                        const meals = getMeals(date, mealType);
                                        const locked = isSlotLocked(date, key);
                                        const missed = isSlotMissed(date, key);

                                        if (meals.length > 0) {
                                            return (
                                                <div key={`${date}-${key}`} className="space-y-2">
                                                    <button
                                                        onClick={() => openQuickAdd(date, key)}
                                                        className="w-full py-2.5 rounded-xl border-2 border-dashed border-gray-200 text-gray-500 font-bold text-xs flex items-center justify-center gap-2 active:scale-[0.98] transition-all hover:border-[#FF385C]/30 hover:text-[#FF385C]"
                                                    >
                                                        <span className="text-sm">+</span>
                                                        Add Another {label} Dish
                                                    </button>
                                                    {meals.map(item => (
                                                        <MealCard
                                                            key={item.id}
                                                            item={item}
                                                            date={date}
                                                            mealType={mealType}
                                                            slot={key}
                                                            dishes={dishes}
                                                            userRegion="India"
                                                            userDiet="veg"
                                                            isLocked={locked}
                                                            isMissed={missed}
                                                            onRemove={handleRemove(date, mealType, item.id)}
                                                            swapCustomizeOpen={swapCustomizeContext?.itemId === item.id}
                                                            onSwapCustomizeOpen={() => setSwapCustomizeContext(
                                                                swapCustomizeContext?.itemId === item.id ? null : { itemId: item.id, date, mealType, slotLabel: label }
                                                            )}
                                                            onSwapCustomizeClose={() => setSwapCustomizeContext(null)}
                                                        />
                                                    ))}
                                                </div>
                                            );
                                        }

                                        return (
                                                <BlankSlot
                                                    key={`${date}-${key}`}
                                                    slot={key}
                                                    date={date}
                                                    dishes={dishes}
                                                    userRegion={trayUserRegion}
                                                    userDiet={trayUserDiet}
                                                    pantryStaples={trayPantryStaples}
                                                    onAddMeal={handleAddMeal}
                                                    onOpenSearch={() => openQuickAdd(date, key)}
                                                />
                                        );
                                    })}
                                </div>
                            </div>
                        );
                    })}

                    {/* Bottom padding */}
                    <div className="h-4" />
                </div>

                {/* Footer actions — LOOP UI REMOVED: replaced with link to Profile settings */}
                <div className="shrink-0 px-5 py-4 border-t border-gray-100 bg-white">
                    <button
                        onClick={() => { onClose(); onNavigateToLoopSettings?.(); }}
                        className="w-full py-3 rounded-xl bg-gray-50 text-gray-600 font-bold text-sm flex items-center justify-center gap-2 active:scale-[0.98] transition-all border border-gray-200"
                    >
                        <Settings size={14} />
                        Configure Loop &amp; Auto-fill in Profile
                    </button>
                    <div className="h-2" />
                    <button
                        onClick={onClose}
                        className="w-full py-3 rounded-xl bg-gray-900 text-white font-bold text-sm active:scale-[0.98] transition-all"
                    >
                        Done
                    </button>
                </div>
            </div>

            {/* Swap Customize Modal */}
            {swapCustomizeContext && (() => {
                const item = getMeals(swapCustomizeContext.date, swapCustomizeContext.mealType).find(m => m.id === swapCustomizeContext.itemId);
                if (!item) return null;
                return (
                    <SwapCustomizeModal
                        key={`${swapCustomizeContext.slotLabel}_${swapCustomizeContext.date}`}
                        isOpen={true}
                        onClose={() => setSwapCustomizeContext(null)}
                        date={swapCustomizeContext.date}
                        mealType={swapCustomizeContext.mealType}
                        slotLabel={swapCustomizeContext.slotLabel}
                        item={item}
                        dishes={dishes}
                        userRegion={trayUserRegion}
                        userDiet={trayUserDiet}
                        onApply={(itemId, updates) => {
                            handleSwapCustomizeApply(swapCustomizeContext.date, swapCustomizeContext.mealType, itemId)(updates);
                        }}
                        onChange={handleModalChange}
                    />
                );
            })()}

            {/* Quick Add Modal */}
            <QuickAddModal
                isOpen={quickAddOpen}
                onClose={() => setQuickAddOpen(false)}
                slot={quickAddSlot}
                date={quickAddDate}
                dishes={dishes}
                userRegion="India"
                userDiet="veg"
                onAddMeal={handleQuickAddMeal}
                selectedDishIds={selectedDishIds}
            />
        </div>
    );
};

export default React.memo(TrayScreen);
