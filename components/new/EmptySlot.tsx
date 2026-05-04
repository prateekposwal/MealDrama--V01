import React, { useMemo, useState } from 'react';
import { Plus, Zap, Sparkles } from 'lucide-react';
import type { MealOption } from '../../store/useStore';
import type { Dish, DishVariant } from '../../constants/dishLibrary';

interface EmptySlotProps {
    slot: string;
    date: string;
    dishes: Dish[];
    userRegion: string;
    userDiet: string;
    onFill: (date: string, slot: string, meal: MealOption) => void;
}

const SLOT_META: Record<string, { icon: string; time: string; label: string }> = {
    Breakfast: { icon: '🌅', time: '8:00 AM', label: 'Breakfast' },
    Lunch: { icon: '☀️', time: '1:00 PM', label: 'Lunch' },
    Snacks: { icon: '🥜', time: '4:00 PM', label: 'Snacks' },
    Dinner: { icon: '🌙', time: '8:00 PM', label: 'Dinner' },
};

export const EmptySlot: React.FC<EmptySlotProps> = ({
    slot,
    date,
    dishes,
    userRegion,
    userDiet,
    onFill,
}) => {
    const [filling, setFilling] = useState(false);
    const meta = SLOT_META[slot] || { icon: '🍽️', time: '', label: slot };

    const smartSuggestion = useMemo(() => {
        const category = slot.toLowerCase();
        const dietFilter: Record<string, string[]> = {
            veg: ['veg'],
            'non-veg': ['veg', 'non-veg', 'eggitarian'],
            eggitarian: ['veg', 'eggitarian', 'non-veg'],
            vegan: ['veg', 'vegan'],
        };
        const allowedTypes = dietFilter[userDiet?.toLowerCase() || 'veg'] || ['veg'];
        const regionKey = userRegion.toLowerCase().replace(' india', '');

        const candidates = dishes.filter(d => {
            if (!d.category.some(c => c.includes(category))) return false;
            if (!allowedTypes.includes(d.type)) return false;
            return true;
        });

        const regional = candidates.filter(d => d.region.toLowerCase().includes(regionKey));
        const pool = regional.length > 0 ? regional : candidates;

        if (pool.length === 0) return null;

        const picked = pool[Math.floor(Math.random() * pool.length)];
        const variant = picked.variants[0];

        return {
            dish: picked,
            variant: variant || null,
            confidence: regional.length > 0 ? 0.9 : 0.6,
            reason: regional.length > 0 ? `Regional pick from ${userRegion}` : 'Popular match for your diet',
        };
    }, [dishes, slot, userRegion, userDiet]);

    const handleQuickFill = () => {
        if (!smartSuggestion || filling) return;
        setFilling(true);
        const { dish, variant } = smartSuggestion;
        const mealOption: MealOption = {
            id: `${variant?.id || dish.id}-${Date.now()}`,
            dishId: dish.id,
            name: dish.name,
            icon: dish.icon,
            variant: variant?.name,
            variantId: variant?.id,
            addOn: variant?.addOn,
            mealContext: variant?.mealContext,
            quantity: 1,
            countBased: dish.tags.some(t => ['paratha', 'roti', 'idli', 'dosa', 'naan', 'puri'].includes(t)),
            smartRecommended: true,
        };
        setTimeout(() => {
            onFill(date, slot, mealOption);
            setFilling(false);
        }, 300);
    };

    if (!smartSuggestion) {
        return (
            <div className="p-5 rounded-[28px] border-2 border-dashed border-gray-200 bg-gray-50/50">
                <div className="flex items-center gap-3 opacity-60">
                    <div className="w-16 h-16 bg-gray-100 rounded-2xl flex items-center justify-center text-3xl">{meta.icon}</div>
                    <p className="text-gray-400 font-bold text-sm">No dishes available for {meta.label}</p>
                </div>
            </div>
        );
    }

    const { dish, variant, confidence, reason } = smartSuggestion;

    return (
        <div className="p-5 rounded-[28px] border-2 border-dashed border-[#FF385C]/30 bg-[#FF385C]/5 transition-all">
            {/* Slot Header */}
            <div className="flex items-center gap-2 mb-3">
                <span className="text-lg">{meta.icon}</span>
                <span className="text-[10px] font-black uppercase tracking-widest text-gray-500">{meta.label}</span>
                <span className="text-[10px] text-gray-400 font-bold">{meta.time}</span>
            </div>

            {/* Suggestion Card */}
            <button
                onClick={handleQuickFill}
                disabled={filling}
                className="w-full flex items-center gap-4 p-4 bg-white rounded-2xl border border-[#FF385C]/15 hover:border-[#FF385C]/30 active:scale-[0.98] transition-all group"
            >
                <div className="w-14 h-14 bg-[#FF385C]/10 rounded-2xl flex items-center justify-center text-2xl">
                    {dish.icon}
                </div>
                <div className="flex-1 text-left">
                    <div className="flex items-center gap-2">
                        <span className="font-bold text-gray-800">{variant?.name || dish.name}</span>
                        {confidence >= 0.9 && (
                            <span className="text-[8px] font-black uppercase tracking-widest bg-[#FF385C] text-white px-1.5 py-0.5 rounded">
                                Regional
                            </span>
                        )}
                    </div>
                    <p className="text-[10px] text-gray-400 font-medium mt-0.5 flex items-center gap-1">
                        <Sparkles size={8} />
                        {reason}
                    </p>
                </div>
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center transition-all ${filling ? 'bg-[#FF385C] text-white' : 'bg-[#FF385C]/10 text-[#FF385C] group-hover:bg-[#FF385C] group-hover:text-white'}`}>
                    {filling ? <Zap size={16} className="animate-pulse" /> : <Plus size={18} />}
                </div>
            </button>
        </div>
    );
};
