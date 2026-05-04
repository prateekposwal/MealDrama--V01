import React, { useMemo } from 'react';
import type { MealOption, MealResolution } from '../../store/useStore';
import { 
    ArrowLeftRight, X, Sparkles, Minus, Plus, ShieldAlert, Lock 
} from 'lucide-react';

export const SLOT_META: Record<string, { icon: string; time: string; color: string; bg: string }> = {
    Breakfast: { icon: '🌅', time: '8:00 AM', color: 'border-amber-100', bg: 'bg-amber-50' },
    Lunch: { icon: '☀️', time: '1:00 PM', color: 'border-blue-100', bg: 'bg-blue-50' },
    Snacks: { icon: '🥜', time: '4:00 PM', color: 'border-orange-100', bg: 'bg-orange-50' },
    Dinner: { icon: '🌙', time: '8:00 PM', color: 'border-violet-100', bg: 'bg-violet-50' },
};

export type SlotMeta = typeof SLOT_META[keyof typeof SLOT_META];

export interface SwapOption {
    dishId: string;
    dishName: string;
    dishIcon: string;
    dishRegion: string;
    variantId: string;
    variantName: string;
    isRegional: boolean;
}

interface MealCardProps {
    slot: string;
    date?: string;
    meta: SlotMeta;
    resolution: MealResolution;
    dishes: any[];
    userRegion: string;
    userDiet: string;
    swapPopoverSlot: string | null;
    setSwapPopoverSlot: (slot: string | null) => void;
    onSwap: (date: string | undefined, slot: string, option: MealOption) => void;
    onUpdateQuantity?: (slot: string, delta: number) => void;
    isLocked?: boolean; // NEW: Locked if time-expired, cooked/served, or past date
}

export const MealCard: React.FC<MealCardProps> = ({
    slot,
    date,
    meta,
    resolution,
    dishes,
    userRegion,
    userDiet,
    swapPopoverSlot,
    setSwapPopoverSlot,
    onSwap,
    onUpdateQuantity,
    isLocked = false, // Default: not locked
}) => {
    const meal = resolution.meal;

    const swapVariants = useMemo(() => {
        if (!dishes.length) return [];
        const category = slot.toLowerCase() as 'breakfast' | 'lunch' | 'snacks' | 'dinner';
        const dietFilter: Record<string, string[]> = {
            'veg': ['veg'],
            'non-veg': ['veg', 'non-veg', 'eggitarian'],
            'eggitarian': ['veg', 'eggitarian', 'non-veg'],
            'vegan': ['veg', 'vegan'],
        };
        const allowedTypes = dietFilter[userDiet?.toLowerCase() || 'veg'] || ['veg'];
        const regionKey = userRegion?.toLowerCase().replace(' india', '') || '';

        return dishes
            .filter(d => d.category.includes(category) && allowedTypes.includes(d.type) && d.id !== meal?.dishId)
            .slice(0, 12)
            .map(d => ({
                dishId: d.id,
                dishName: d.name,
                dishIcon: d.icon || '🍽️',
                dishRegion: d.region || '',
                variantId: d.variants?.[0]?.id || d.id,
                variantName: d.variants?.[0]?.name || d.name,
                isRegional: d.region?.toLowerCase().includes(regionKey),
            }));
    }, [dishes, slot, userDiet, userRegion, meal?.dishId]);

    const handleSwapSelect = (opt: SwapOption) => {
        onSwap(date, slot, {
            id: opt.variantId,
            dishId: opt.dishId,
            name: opt.dishName,
            icon: opt.dishIcon,
            variant: opt.variantName,
        });
        setSwapPopoverSlot(null);
    };

    return (
        <div className={`p-5 rounded-[28px] border-2 ${meta.color} ${meta.bg} transition-all relative`}>
            {/* Swap Popover Overlay */}
            {swapPopoverSlot === slot && (
                <div className="absolute inset-0 z-30 rounded-[28px] bg-white border-2 border-[#FF385C] p-5 shadow-2xl shadow-[#FF385C]/10 animate-in fade-in zoom-in-95 duration-200 overflow-y-auto max-h-[500px]">
                    <div className="flex items-center justify-between mb-4">
                        <div>
                            <p className="text-[9px] font-black uppercase tracking-widest text-[#FF385C]">2-Tap Swap</p>
                            <p className="font-bold text-gray-900 text-base">Change {slot}</p>
                        </div>
                        <button
                            onClick={() => setSwapPopoverSlot(null)}
                            className="w-8 h-8 rounded-xl bg-gray-100 flex items-center justify-center"
                        >
                            <X size={14} className="text-gray-500" />
                        </button>
                    </div>
                    
                    <p className="text-[9px] font-black uppercase tracking-widest text-gray-400 mb-2 flex items-center gap-1">
                        <Sparkles size={9} />
                        Pick a replacement for {slot}
                    </p>
                    
                    <div className="space-y-2">
                        {swapVariants.length === 0 && (
                            <p className="text-sm text-gray-400">No alternatives found for this slot.</p>
                        )}
                        {swapVariants.map(opt => (
                            <button
                                key={`${opt.dishId}-${opt.variantId}`}
                                onClick={() => handleSwapSelect(opt)}
                                className="w-full flex items-center gap-4 p-3.5 rounded-2xl bg-[#FF385C]/5 hover:bg-[#FF385C]/10 border border-[#FF385C]/15 transition-all active:scale-[0.98]"
                            >
                                <span className="text-2xl">{opt.dishIcon}</span>
                                <div className="flex-1 text-left">
                                    <p className="font-bold text-sm text-gray-900">{opt.variantName}</p>
                                    <p className="text-[10px] text-gray-500 font-medium">{opt.dishName}</p>
                                </div>
                                {opt.isRegional && (
                                    <span className="text-[8px] font-black uppercase tracking-widest bg-[#FF385C] text-white px-1.5 py-0.5 rounded">Local</span>
                                )}
                            </button>
                        ))}
                    </div>
                </div>
            )}

            {/* Locked Overlay */}
            {isLocked && (
                <div className="absolute inset-0 z-20 rounded-[28px] bg-gray-900/60 flex flex-col items-center justify-center animate-in fade-in">
                    <Lock size={32} className="text-gray-300 mb-2" />
                    <span className="text-xs font-bold text-gray-200 uppercase tracking-widest">Served</span>
                    <span className="text-[10px] text-gray-400 mt-1">Past modification window</span>
                </div>
            )}

            {/* Slot Header */}
            <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                    <span className="text-lg">{meta.icon}</span>
                    <span className="text-[10px] font-black uppercase tracking-widest text-gray-500">{slot}</span>
                </div>
                <div className="flex items-center gap-1.5">
                    <span className="text-[10px] text-gray-400 font-bold">{meta.time}</span>
                    {!isLocked && (
                        <button
                            onClick={() => setSwapPopoverSlot(swapPopoverSlot === slot ? null : slot)}
                            className="w-8 h-8 rounded-xl bg-white border border-gray-200 flex items-center justify-center text-[#FF385C] hover:shadow-md transition-all active:scale-90"
                            title="Swap this meal in 2 taps"
                        >
                            <ArrowLeftRight size={14} />
                        </button>
                    )}
                </div>
            </div>

            {/* Meal Display */}
            {meal ? (
                <div className={`flex items-center gap-4 ${isLocked ? 'grayscale opacity-60' : ''}`}>
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
                    <p className="text-gray-400 font-bold text-sm">No meal saved yet</p>
                </div>
            )}

            {/* Quantity Controls & Warnings */}
            <div className="mt-3 grid gap-2">
                <div className="flex items-center gap-2">
                    <button
                        onClick={() => onUpdateQuantity?.(slot, -1)}
                        className="w-8 h-8 rounded-xl bg-white border border-gray-200 flex items-center justify-center text-gray-500 hover:border-gray-300 active:scale-90 transition-all"
                    >
                        <Minus size={13} />
                    </button>
                    <span className="text-[11px] font-bold text-gray-700">Qty {meal?.quantity || 1}</span>
                    <button
                        onClick={() => onUpdateQuantity?.(slot, 1)}
                        className="w-8 h-8 rounded-xl bg-white border border-gray-200 flex items-center justify-center text-gray-500 hover:border-gray-300 active:scale-90 transition-all"
                    >
                        <Plus size={13} />
                    </button>
                </div>
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