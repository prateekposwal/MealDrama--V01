import React, { useMemo, useState } from 'react';
import { useStore, getMealResolution, isSlotLocked, isSlotMissed, getISODate, MealOption } from '../../store/useStore';
import { useBackendDishes } from '../../hooks/useBackendDishes';
import { MealCard, SLOT_META } from './MealCard';
import { BlankSlot } from './BlankSlot';
import { ChevronLeft, ChevronRight, Calendar } from 'lucide-react';

type Tab = 'dashboard' | 'plan' | 'pulse' | 'profile';

// Generate date range for the plan
const generateDateRange = (startDate: Date, days: number): string[] => {
    const dates: string[] = [];
    for (let i = 0; i < days; i++) {
        const d = new Date(startDate);
        d.setDate(d.getDate() + i);
        dates.push(getISODate(d));
    }
    return dates;
};

interface PlanBuilderScreenProps {
    onNavigate?: (tab: Tab) => void;
    setTrayBuilder?: (v: { date: string; slot: string } | null) => void;
}

export const PlanBuilderScreen: React.FC<PlanBuilderScreenProps> = ({ onNavigate, setTrayBuilder }) => {
    const { user, trayLibrary, swaps, setSwap } = useStore();
    const { dishes } = useBackendDishes();

    const [currentWeekStart, setCurrentWeekStart] = useState(() => {
        const today = new Date();
        const dayOfWeek = today.getDay();
        const start = new Date(today);
        start.setDate(start.getDate() - dayOfWeek);
        return getISODate(start);
    });

    const [swapSlot, setSwapSlot] = useState<string | null>(null);

    const regionKey = (user?.region ?? 'India').toLowerCase().replace(' india', '');

    // Generate 7-day week view
    const weekDates = useMemo(() => {
        const start = new Date(currentWeekStart);
        return generateDateRange(start, 7);
    }, [currentWeekStart]);

    // Navigate weeks
    const goToPrevWeek = () => {
        const start = new Date(currentWeekStart);
        start.setDate(start.getDate() - 7);
        setCurrentWeekStart(getISODate(start));
    };

    const goToNextWeek = () => {
        const start = new Date(currentWeekStart);
        start.setDate(start.getDate() + 7);
        setCurrentWeekStart(getISODate(start));
    };

    // Add meal to slot (from BlankSlot suggestion)
    const handleAddMeal = (date: string, slot: string, dish: any) => {
        if (dish.variants.length > 0) {
            const variant = dish.variants[0];
            const mealOption: MealOption = {
                id: `${variant.id}-${Date.now()}`,
                dishId: dish.id,
                name: dish.name,
                icon: dish.icon,
                variant: variant.name,
                variantId: variant.id,
                addOn: variant.addOn,
                mealContext: variant.mealContext,
                quantity: 1,
                countBased: dish.tags.some((t: string) => ['paratha', 'roti', 'idli', 'dosa', 'naan', 'puri'].includes(t)),
            };
            setSwap(date, slot, mealOption);
        }
    };

    // Swap handler
    const applySwap = (date: string | undefined, slot: string, option: MealOption) => {
        setSwap(date!, slot, option);
        setSwapSlot(null);
    };

    // Quantity handler
    const handleUpdateQuantity = (slot: string, delta: number) => {
        // Find which date this is for (we'll pass it through context or store it)
        // For now, using a simplified approach
    };

    // Inline edit handler (debounced via Zustand slice)
    const handleUpdateInline = (itemId: string, updates: any) => {
        // This would call the Zustand traySlice updateItem
        console.log('Inline update:', itemId, updates);
    };

    // Remove handler
    const handleRemove = (date: string, slot: string) => {
        // Clear swap for this date/slot
        // useStore.getState().clearSwap(date, slot);
    };

    // Week label
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

    const slots = ['Breakfast', 'Lunch', 'Snacks', 'Dinner'] as const;

    if (!user) return null;

    return (
        <div className="pb-40 animate-in fade-in duration-300 bg-white">
            {/* Header */}
            <header className="px-6 pt-14 pb-4">
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-2xl font-black tracking-tight">
                            Meal Plan
                        </h1>
                        <div className="flex items-center gap-2 mt-1">
                            <Calendar size={12} className="text-[#FF385C]" />
                        <span className="text-xs font-bold text-gray-500">
                            {weekLabel}
                        </span>
                        </div>
                    </div>
                    <div className="flex items-center gap-2">
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
                    </div>
                </div>

                
            </header>

            {/* Day Grid */}
            <div className="px-4 space-y-6">
                {weekDates.map(date => {
                    const dateObj = new Date(date);
                    const dayName = dateObj.toLocaleDateString('en-IN', { weekday: 'short' });
                    const dayNum = dateObj.getDate();
                    const isToday = date === getISODate(new Date());

                    return (
                        <div key={date}>
                            {/* Day Header */}
                            <div className="flex items-center gap-3 mb-3 px-2">
                                <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${isToday ? 'bg-[#FF385C] text-white' : 'bg-gray-100 text-gray-500'}`}>
                                    <span className="text-xs font-black">{dayName}</span>
                                </div>
                                    <span className="text-lg font-bold text-gray-800">{dayNum}</span>
                                {isToday && (
                                    <span className="text-[9px] font-black uppercase tracking-widest bg-[#FF385C] text-white px-2 py-0.5 rounded-full">Today</span>
                                )}
                                
                            </div>

                            {/* Slots for this day */}
                            <div className="space-y-3">
                                {slots.map(slot => {
                                    const resolution = getMealResolution(trayLibrary, swaps, date, slot, dishes);
                                    const meta = SLOT_META[slot];
                                    const hasSwap = !!swaps[date]?.[slot];
                                    const locked = isSlotLocked(date, slot);
                                    const missed = isSlotMissed(date, slot);

                                    if (resolution.meal) {
                                        return (
                                            <MealCard
                                                key={`${date}-${slot}`}
                                                slot={slot}
                                                date={date}
                                                meta={meta!}
                                                resolution={resolution}
                                                dishes={dishes}
                                                userRegion={user.region ?? 'India'}
                                                userDiet={user.diet ?? 'veg'}
                                                swapPopoverSlot={swapSlot}
                                                setSwapPopoverSlot={setSwapSlot}
                                                onSwap={applySwap}
                                                onUpdateQuantity={handleUpdateQuantity}
                                                onRemove={() => handleRemove(date, slot)}
                                                isLocked={locked}
                                                isMissed={missed}
                                                hasSwap={hasSwap}
                                            />
                                        );
                                    }

                                    // Blank slot with smart suggestions
                                    return (
                                        <BlankSlot
                                            key={`${date}-${slot}`}
                                            slot={slot}
                                            date={date}
                                            dishes={dishes}
                                            userRegion={user.region ?? 'India'}
                                            userDiet={user.diet ?? 'veg'}
                                            pantryStaples={user?.pantryStaples ?? []}
                                            onAddMeal={handleAddMeal}
                                            onOpenSearch={() => {
                                                // Open meal search modal
                                            }}
                                        />
                                    );
                                })}
                            </div>
                        </div>
                    );
                })}
            </div>

            {/* Reduced motion */}
            <style>{`
                @media (prefers-reduced-motion: reduce) {
                    .animate-in { animation: none !important; }
                }
            `}</style>
        </div>
    );
};

export default React.memo(PlanBuilderScreen);
