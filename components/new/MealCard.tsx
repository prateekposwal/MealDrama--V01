import React, { useMemo, useState } from 'react';
import type { MealOption, MealResolution } from '../../store/useStore';
import type { Dish, DishVariant } from '../../constants/dishLibrary';
import {
    ArrowLeftRight, X, Sparkles, Minus, Plus, ShieldAlert, Lock, Clock3, ChevronRight,
} from 'lucide-react';

export const SLOT_META: Record<string, { icon: string; time: string; color: string; bg: string }> = {
    Breakfast: { icon: '🌅', time: '8:00 AM', color: 'border-amber-100', bg: 'bg-amber-50' },
    Lunch: { icon: '☀️', time: '1:00 PM', color: 'border-blue-100', bg: 'bg-blue-50' },
    Snacks: { icon: '🥜', time: '4:00 PM', color: 'border-orange-100', bg: 'bg-orange-50' },
    Dinner: { icon: '🌙', time: '8:00 PM', color: 'border-violet-100', bg: 'bg-violet-50' },
};

export type SlotMeta = typeof SLOT_META[keyof typeof SLOT_META];

export type SwapStage = 'dish' | 'variant';

interface MealCardProps {
    slot: string;
    date: string | undefined;
    meta: SlotMeta;
    resolution: MealResolution;
    dishes: Dish[];
    userRegion: string;
    userDiet: string;
    swapPopoverSlot: string | null;
    setSwapPopoverSlot: (slot: string | null) => void;
    onSwap: (date: string | undefined, slot: string, option: MealOption) => void;
    onUpdateQuantity: (slot: string, delta: number) => void;
    isLocked: boolean;
    isMissed: boolean;
    hasSwap: boolean;
    repetitionWarning?: { daysSinceLast: number; message: string };
}

const DIET_FILTER: Record<string, string[]> = {
    veg: ['veg'],
    'non-veg': ['veg', 'non-veg', 'eggitarian'],
    eggitarian: ['veg', 'eggitarian', 'non-veg'],
    vegan: ['veg', 'vegan'],
};

export const MealCard: React.FC<MealCardProps> = ({
    slot, date, meta, resolution, dishes, userRegion, userDiet,
    swapPopoverSlot, setSwapPopoverSlot, onSwap, onUpdateQuantity,
    isLocked, isMissed, hasSwap, repetitionWarning,
}) => {
    const meal = resolution.meal;

    // Swap state — managed by MealCard
    const [swapStage, setSwapStage] = useState<SwapStage>('dish');
    const [swapSelectedDish, setSwapSelectedDish] = useState<Dish | null>(null);
    const [showAllRegions, setShowAllRegions] = useState(false);

    const isOpen = swapPopoverSlot === slot;

    const regionKey = (userRegion ?? '').toLowerCase().replace(' india', '');

    // Stage 1: Dish picker — filtered by category + diet, excludes current
    const swapDishes = useMemo(() => {
        if (!dishes.length) return [];
        const category = slot.toLowerCase() as string;
        const allowedTypes = DIET_FILTER[userDiet?.toLowerCase() || 'veg'] || ['veg'];

        let filtered = dishes.filter(d => {
            if (!d.category.some(c => c.includes(category))) return false;
            if (!allowedTypes.includes(d.type)) return false;
            if (d.id === meal?.dishId) return false;
            return true;
        });

        // Regional sort: matching region first
        const sorted = [...filtered].sort((a, b) => {
            const aRegional = a.region.toLowerCase().includes(regionKey);
            const bRegional = b.region.toLowerCase().includes(regionKey);
            if (aRegional && !bRegional) return -1;
            if (!aRegional && bRegional) return 1;
            return a.name.localeCompare(b.name);
        });

        return sorted;
    }, [dishes, slot, userDiet, regionKey, meal?.dishId]);

    // Stage 2: Variants for selected dish
    const swapVariants = useMemo((): DishVariant[] => {
        if (!swapSelectedDish) return [];
        const category = slot.toLowerCase() as string;
        return swapSelectedDish.variants.filter(v => {
            if (!v.mealContext) return true;
            return v.mealContext.includes(category) || !v.mealContext;
        });
    }, [swapSelectedDish, slot]);

    const handleSelectDish = (dish: Dish) => {
        if (dish.variants.length <= 1) {
            // Auto-swap if only one variant
            handleSwapSelect(dish.variants[0], dish);
        } else {
            setSwapSelectedDish(dish);
            setSwapStage('variant');
        }
    };

    const handleSwapSelect = (variant: DishVariant, dish: Dish) => {
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
            countBased: dish.tags.some(t => ['paratha', 'roti', 'idli', 'dosa', 'naan', 'puri'].includes(t)),
        };
        onSwap(date, slot, mealOption);
        closeSwap();
    };

    const closeSwap = () => {
        setSwapPopoverSlot(null);
        setSwapStage('dish');
        setSwapSelectedDish(null);
        setShowAllRegions(false);
    };

    const openSwap = () => {
        if (isLocked || isMissed) return;
        setSwapPopoverSlot(isOpen ? null : slot);
        setSwapStage('dish');
        setSwapSelectedDish(null);
    };

    return (
        <div className={`p-5 rounded-[28px] border-2 ${meta.color} ${meta.bg} transition-all relative ${isMissed && !isLocked ? 'grayscale opacity-60' : ''}`}>
            {/* Missed overlay */}
            {isMissed && !isLocked && (
                <div className="absolute top-2 right-2 z-10 flex items-center gap-1 bg-amber-100 px-2 py-1 rounded-full">
                    <span className="text-[10px] font-bold text-amber-700 uppercase">⚠️ Missed</span>
                </div>
            )}

            {/* Locked overlay */}
            {isLocked && (
                <div className="absolute inset-0 z-20 rounded-[28px] bg-gray-900/50 flex flex-col items-center justify-center pointer-events-none">
                    <div className="bg-gray-800 px-3 py-1.5 rounded-full flex items-center gap-1.5">
                        <span className="text-sm">⏰</span>
                        <span className="text-[10px] font-bold text-gray-300 uppercase tracking-widest">Too late!</span>
                    </div>
                    <span className="text-[10px] text-gray-400 mt-2">Catch it next time</span>
                </div>
            )}

            {/* Swap Popover Overlay */}
            {isOpen && !isLocked && (
                <div className="absolute inset-0 z-30 rounded-[28px] bg-white border-2 border-[#FF385C] p-5 shadow-2xl shadow-[#FF385C]/10 animate-in fade-in zoom-in-95 duration-200 overflow-y-auto max-h-[500px]">
                    {/* Header */}
                    <div className="flex items-center justify-between mb-4">
                        <div>
                            <p className="text-[9px] font-black uppercase tracking-widest text-[#FF385C]">2-Tap Swap</p>
                            <p className="font-bold text-gray-900 text-base">
                                {swapStage === 'dish' ? 'Mix it up — Pick a dish' : `Pick a style — ${swapSelectedDish?.name}`}
                            </p>
                        </div>
                        <button onClick={closeSwap} className="w-8 h-8 rounded-xl bg-gray-100 flex items-center justify-center">
                            <X size={14} className="text-gray-500" />
                        </button>
                    </div>

                    {swapStage === 'dish' ? (
                        /* Stage 1: Dish Picker — Horizontal scroll */
                        <>
                            <div className="flex items-center justify-between mb-3">
                                <p className="text-[9px] font-black uppercase tracking-widest text-gray-400 flex items-center gap-1">
                                    <Sparkles size={9} />
                                    {swapDishes.length} dishes for {slot}
                                </p>
                                {!showAllRegions && (
                                    <button
                                        onClick={() => setShowAllRegions(true)}
                                        className="text-[9px] font-bold text-[#FF385C] px-2 py-1 rounded-full bg-[#FF385C]/10"
                                    >
                                        All regions
                                    </button>
                                )}
                            </div>

                            {swapDishes.length === 0 ? (
                                <p className="text-sm text-gray-400">No alternatives found for this slot.</p>
                            ) : (
                                <div className="flex gap-3 overflow-x-auto pb-3 -mx-5 px-5 snap-x snap-mandatory">
                                    {swapDishes.map(dish => {
                                        const isRegional = dish.region.toLowerCase().includes(regionKey);
                                        return (
                                            <button
                                                key={dish.id}
                                                onClick={() => handleSelectDish(dish)}
                                                className="snap-start flex-shrink-0 w-32 p-3 rounded-2xl bg-[#FF385C]/5 hover:bg-[#FF385C]/10 border border-[#FF385C]/15 transition-all active:scale-95 text-center"
                                            >
                                                <span className="text-3xl block mb-1">{dish.icon}</span>
                                                <span className="text-xs font-bold text-gray-800 block leading-tight">{dish.name}</span>
                                                <span className="text-[8px] text-gray-400 font-bold mt-0.5 block capitalize">{dish.region} India</span>
                                                {!showAllRegions && isRegional && (
                                                    <span className="text-[7px] font-black uppercase tracking-widest bg-[#FF385C] text-white px-1.5 py-0.5 rounded mt-1 inline-block">Local</span>
                                                )}
                                            </button>
                                        );
                                    })}
                                </div>
                            )}
                        </>
                    ) : (
                        /* Stage 2: Variant Picker */
                        <>
                            <button
                                onClick={() => { setSwapStage('dish'); setSwapSelectedDish(null); }}
                                className="flex items-center gap-1 text-xs text-[#FF385C] font-bold mb-3"
                            >
                                <ChevronRight size={12} className="rotate-180" />
                                ← Back to dishes
                            </button>

                            <div className="space-y-2">
                                {swapVariants.length === 0 ? (
                                    <p className="text-sm text-gray-400">Hmm, that's the only one like it. Keep it.</p>
                                ) : (
                                    swapVariants.map(variant => (
                                        <button
                                            key={variant.id}
                                            onClick={() => handleSwapSelect(variant, swapSelectedDish!)}
                                            className="w-full flex items-center gap-4 p-3.5 rounded-2xl bg-[#FF385C]/5 hover:bg-[#FF385C]/10 border border-[#FF385C]/15 transition-all active:scale-[0.98]"
                                        >
                                            <span className="text-2xl">{swapSelectedDish!.icon}</span>
                                            <div className="flex-1 text-left">
                                                <span className="font-bold text-sm text-gray-800 block">{variant.name}</span>
                                                {variant.addOn && (
                                                    <span className="text-[10px] text-gray-400 font-bold">{variant.addOn}</span>
                                                )}
                                            </div>
                                            <ArrowLeftRight size={14} className="text-[#FF385C] opacity-60" />
                                        </button>
                                    ))
                                )}
                            </div>
                        </>
                    )}
                </div>
            )}

            {/* Slot Header */}
            <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                    <span className="text-lg">{meta.icon}</span>
                    <span className="text-[10px] font-black uppercase tracking-widest text-gray-500">{slot}</span>
                    {hasSwap && (
                        <span className="text-[8px] bg-[#FF385C] text-white font-black uppercase tracking-widest px-1.5 py-0.5 rounded-md">Swapped</span>
                    )}
                </div>
                <div className="flex items-center gap-1.5">
                    <span className="text-[10px] text-gray-400 font-bold">{meta.time}</span>
                    {!(isLocked || isMissed) && (
                        <button
                            onClick={openSwap}
                            className="w-8 h-8 rounded-xl bg-white border border-gray-200 flex items-center justify-center text-[#FF385C] hover:shadow-md transition-all active:scale-90"
                            title="Swap this meal in 2 taps"
                        >
                            <ArrowLeftRight size={14} />
                        </button>
                    )}
                    {(isLocked || isMissed) && (
                        <Lock size={14} className="text-gray-400" />
                    )}
                </div>
            </div>

            {/* Meal Display */}
            {meal ? (
                <div className="flex items-center gap-4">
                    <div className="w-16 h-16 bg-white rounded-2xl flex items-center justify-center text-3xl shadow-sm">
                        {meal.icon || '🍽️'}
                    </div>
                    <div className="flex-1">
                        <h4 className="font-extrabold text-xl text-gray-900 tracking-tight leading-tight flex items-center flex-wrap gap-1">
                            {meal.variant || meal.name}
                            {meal.addOn && (
                                <span className="text-xs bg-blue-50 text-blue-600 px-2 py-0.5 rounded-full font-semibold">
                                    {meal.addOn.replace('with ', '+ ')}
                                </span>
                            )}
                        </h4>
                        {meal.quantity && meal.quantity > 1 && (
                            <p className="text-xs text-[#FF385C] font-black mt-0.5">Qty x{meal.quantity}</p>
                        )}
                        {meal.variant && meal.name !== meal.variant && (
                            <p className="text-xs text-gray-400 font-medium mt-0.5">{meal.name}</p>
                        )}
                        {meal.mealContext && (
                            <span className="text-[9px] bg-white/80 text-gray-500 font-black uppercase tracking-widest px-2 py-0.5 rounded-lg mt-1 inline-block capitalize">
                                {meal.mealContext}
                            </span>
                        )}
                    </div>
                </div>
            ) : (
                <div className="flex items-center gap-3 opacity-60">
                    <div className="w-16 h-16 bg-white rounded-2xl flex items-center justify-center text-3xl shadow-sm">🍽️</div>
                    <p className="text-gray-400 font-bold text-sm">Nothing here yet — tap swap to fix</p>
                </div>
            )}

            {/* Quantity Controls & Warnings */}
            <div className="mt-3 grid gap-2">
                {repetitionWarning && !(isLocked || isMissed) && (
                    <button
                        onClick={openSwap}
                        className="w-full flex items-center gap-2 p-2 bg-amber-50 border border-amber-200 rounded-xl active:scale-[0.98] transition-all text-left"
                    >
                        <Clock3 size={12} className="text-amber-600 flex-shrink-0" />
                        <span className="text-[10px] font-bold text-amber-700">{repetitionWarning.message}</span>
                        <ArrowLeftRight size={10} className="text-amber-500 ml-auto" />
                    </button>
                )}
                {meal?.countBased && !(isLocked || isMissed) && (
                    <div className="flex items-center gap-2">
                        <button
                            onClick={() => onUpdateQuantity(slot, -1)}
                            className="w-8 h-8 rounded-xl bg-white border border-gray-200 flex items-center justify-center text-gray-500 hover:border-gray-300 active:scale-90 transition-all"
                        >
                            <Minus size={13} />
                        </button>
                        <span className="text-[11px] font-bold text-gray-700">Qty {meal.quantity || 1}</span>
                        <button
                            onClick={() => onUpdateQuantity(slot, 1)}
                            className="w-8 h-8 rounded-xl bg-white border border-gray-200 flex items-center justify-center text-gray-500 hover:border-gray-300 active:scale-90 transition-all"
                        >
                            <Plus size={13} />
                        </button>
                    </div>
                )}
                {resolution.duplicateWarning && (
                    <div className={`flex items-start gap-1.5 text-[10px] ${resolution.duplicateWarning.type === 'same-day-block' ? 'text-amber-700' : 'text-sky-700'}`}>
                        <ShieldAlert size={10} className="mt-0.5" />
                        <span>{resolution.duplicateWarning.message}</span>
                    </div>
                )}
            </div>
        </div>
    );
};
