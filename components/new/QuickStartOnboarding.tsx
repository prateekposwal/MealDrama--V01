import React, { useMemo, useState, useEffect } from 'react';
import { ArrowRight, Check, ChefHat, Flame, MapPin, Phone, UtensilsCrossed } from 'lucide-react';

const REGION_DISH_COUNTS: Record<string, { dishes: number; variants: number }> = {
    'North India': { dishes: 95, variants: 276 },
    'South India': { dishes: 50, variants: 133 },
    'East India': { dishes: 34, variants: 80 },
    'West India': { dishes: 36, variants: 93 },
    'Central India': { dishes: 28, variants: 64 },
    'Northeast India': { dishes: 24, variants: 52 },
};

const REGIONS = [
    { label: 'North India', icon: '🌾', note: 'Ghee overload' },
    { label: 'South India', icon: '🥥', note: 'Coconut everything' },
    { label: 'East India', icon: '🐟', note: 'Fish & feelings' },
    { label: 'West India', icon: '🌶️', note: 'Spice is life' },
    { label: 'Central India', icon: '🍲', note: 'Comfort food headquarters' },
    { label: 'Northeast India', icon: '🍚', note: 'Ferments, fire, full emotion' },
] as const;

const DIETS = [
    { label: 'Veg', icon: '🥦', note: "Mummy's favorite" },
    { label: 'Eggitarian', icon: '🥚', note: 'Anda is life' },
    { label: 'Non-Veg', icon: '🍗', note: 'Chicken pe aaye ho' },
    { label: 'Vegan', icon: '🌱', note: 'No dairy, no sorry' },
] as const;

const SLOT_OPTIONS = [
    { label: 'Breakfast', icon: '🌅', note: 'Chai pe charcha' },
    { label: 'Lunch', icon: '🌞', note: 'Thali therapy' },
    { label: 'Dinner', icon: '🌙', note: 'Light... ish' },
    { label: 'Snacks', icon: '🍵', note: 'The real main course' },
] as const;

const SPICE_LEVELS = [
    { value: 1, label: 'Mild' },
    { value: 2, label: 'Medium' },
    { value: 3, label: 'Hot' },
] as const;

const QuickStartOnboarding: React.FC<{
    onComplete: (data: {
        region: string;
        diet: string;
        spiceLevel: number;
        cookContact: string;
        plannedSlots: ('Breakfast' | 'Lunch' | 'Dinner' | 'Snacks')[];
        onboardingComplete?: boolean;
    }) => void;
    isEditMode?: boolean;
    prefill?: { region?: string; diet?: string; spiceLevel?: number; plannedSlots?: ('Breakfast'|'Lunch'|'Dinner'|'Snacks')[]; cookContact?: string };
}> = ({ onComplete, isEditMode, prefill }) => {
    const [region, setRegion] = useState<string>(prefill?.region ?? 'North India');
    const [diet, setDiet] = useState<string>(prefill?.diet ?? 'Veg');
    const [spiceLevel, setSpiceLevel] = useState<number>(prefill?.spiceLevel ?? 2);
    const [cookContact, setCookContact] = useState<string>(prefill?.cookContact ?? '');
    const [plannedSlots, setPlannedSlots] = useState<('Breakfast' | 'Lunch' | 'Dinner' | 'Snacks')[]>(prefill?.plannedSlots ?? ['Breakfast', 'Lunch', 'Snacks', 'Dinner']);

    const canContinue = plannedSlots.length > 0;
    const helperCopy = useMemo(() => {
        if (plannedSlots.length === 0) return 'Pick at least one.';
        if (plannedSlots.length === 1 && plannedSlots[0] === 'Dinner') return 'Dinner only? Bold.';
        return 'Pick all you want. Change anytime.';
    }, [plannedSlots]);

    const toggleSlot = (slot: 'Breakfast' | 'Lunch' | 'Dinner' | 'Snacks') => {
        setPlannedSlots(prev => prev.includes(slot)
            ? prev.filter(item => item !== slot)
            : [...prev, slot]);
    };

    // Prefill when in edit mode
    useEffect(() => {
        if (isEditMode && prefill) {
            if (prefill.region) setRegion(prefill.region);
            if (prefill.diet) setDiet(prefill.diet);
            if (typeof prefill.spiceLevel === 'number') setSpiceLevel(prefill.spiceLevel);
            if (prefill.plannedSlots) setPlannedSlots(prefill.plannedSlots as any);
            if (prefill.cookContact !== undefined) setCookContact(prefill.cookContact);
        }
    }, [isEditMode, prefill]);

    const handleComplete = () => {
        if (isEditMode) {
            onComplete({ region, diet, spiceLevel, cookContact, plannedSlots, onboardingComplete: true });
        } else {
            onComplete({ region, diet, spiceLevel, cookContact, plannedSlots });
        }
    };

    return (
        <div className="min-h-screen bg-white max-w-lg mx-auto flex flex-col">
            <div className="px-6 pt-14 pb-6 bg-gradient-to-br from-[#FF385C] via-[#E31C5F] to-[#c00c4a] text-white">
                <p className="text-[10px] font-black uppercase tracking-widest opacity-70 mb-3">Quick Setup</p>
                <h1 className="text-4xl font-black tracking-tight leading-tight">Every meal tells a story…</h1>
                <p className="text-sm text-white/80 mt-3 max-w-sm">
                    Authentic Indian recipes that taste like home, even if your home once burnt dal.
                </p>
            </div>

            <div className="flex-1 px-6 py-6 space-y-7 overflow-y-auto">
                <section>
                    <div className="flex items-center gap-2 mb-3">
                        <MapPin size={16} className="text-[#FF385C]" />
                        <h2 className="text-sm font-black uppercase tracking-widest text-gray-500">Region</h2>
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                        {REGIONS.map(option => {
                            const counts = REGION_DISH_COUNTS[option.label];
                            return (
                            <button
                                key={option.label}
                                onClick={() => setRegion(option.label)}
                                className={`p-4 rounded-[20px] border-2 text-left transition-all ${region === option.label ? 'border-[#FF385C] bg-[#FF385C]/5' : 'border-gray-100 bg-white hover:border-gray-200'}`}
                            >
                                <p className="font-bold text-sm text-gray-900">{option.icon} {option.label}</p>
                                <p className="text-[11px] text-gray-500 mt-0.5">{counts ? `${counts.dishes} dishes · ${counts.variants} options` : option.note}</p>
                            </button>
                            );
                        })}
                    </div>
                </section>

                <section>
                    <div className="flex items-center gap-2 mb-3">
                        <ChefHat size={16} className="text-[#FF385C]" />
                        <h2 className="text-sm font-black uppercase tracking-widest text-gray-500">Diet</h2>
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                        {DIETS.map(option => (
                            <button
                                key={option.label}
                                onClick={() => setDiet(option.label)}
                                className={`p-4 rounded-[20px] border-2 text-left transition-all ${diet === option.label ? 'border-[#FF385C] bg-[#FF385C]/5' : 'border-gray-100 bg-white hover:border-gray-200'}`}
                            >
                                <p className="font-bold text-sm text-gray-900">{option.icon} {option.label}</p>
                                <p className="text-[11px] text-gray-500 mt-1">{option.note}</p>
                            </button>
                        ))}
                    </div>
                </section>

                <section>
                    <div className="flex items-center gap-2 mb-3">
                        <UtensilsCrossed size={16} className="text-[#FF385C]" />
                        <h2 className="text-sm font-black uppercase tracking-widest text-gray-500">Slots</h2>
                    </div>
                    <p className={`text-[12px] mb-3 ${plannedSlots.length === 0 ? 'text-amber-600 font-bold' : 'text-gray-500'}`}>{helperCopy}</p>
                    <div className="grid grid-cols-2 gap-3">
                        {SLOT_OPTIONS.map(option => {
                            const active = plannedSlots.includes(option.label);
                            return (
                                <button
                                    key={option.label}
                                    onClick={() => toggleSlot(option.label)}
                                    className={`p-4 rounded-[22px] border-2 text-left transition-all ${active ? 'border-[#FF385C] bg-[#FF385C]/5' : 'border-gray-100 bg-white hover:border-gray-200'}`}
                                >
                                    <p className="font-bold text-sm text-gray-900">{option.icon} {option.label}</p>
                                    <p className="text-[11px] text-gray-500 mt-1">{option.note}</p>
                                </button>
                            );
                        })}
                    </div>
                </section>

                <section>
                    <div className="flex items-center gap-2 mb-3">
                        <Flame size={16} className="text-[#FF385C]" />
                        <h2 className="text-sm font-black uppercase tracking-widest text-gray-500">Spice level</h2>
                    </div>
                    <div className="grid grid-cols-3 gap-3">
                        {SPICE_LEVELS.map(option => (
                            <button
                                key={option.value}
                                onClick={() => setSpiceLevel(option.value)}
                                className={`p-4 rounded-[20px] border-2 text-center transition-all ${spiceLevel === option.value ? 'border-[#FF385C] bg-[#FF385C] text-white' : 'border-gray-100 bg-white text-gray-700 hover:border-gray-200'}`}
                            >
                                <p className="font-bold text-sm">{option.label}</p>
                            </button>
                        ))}
                    </div>
                </section>

                <section>
                    <div className="flex items-center gap-2 mb-3">
                        <Phone size={16} className="text-[#FF385C]" />
                        <h2 className="text-sm font-black uppercase tracking-widest text-gray-500">Cook contact</h2>
                    </div>
                    <input
                        type="tel"
                        value={cookContact}
                        onChange={(event) => setCookContact(event.target.value)}
                        placeholder="+91 98765 43210"
                        className="w-full bg-gray-50 border border-gray-200 rounded-[20px] px-5 py-4 text-sm font-bold focus:outline-none focus:ring-2 focus:ring-[#FF385C]"
                    />
                    <p className="text-[11px] text-gray-500 mt-2">
                        Add cook's WhatsApp. We'll ping before "aaj kya banau?" drops.
                    </p>
                </section>
            </div>

            <div className="px-6 pb-10 pt-4 border-t border-gray-100 bg-white">
                <button
                    onClick={handleComplete}
                    disabled={!canContinue}
                    className="w-full py-5 rounded-[24px] bg-[#FF385C] text-white font-black text-base flex items-center justify-center gap-3 shadow-xl shadow-[#FF385C]/20 active:scale-[0.98] transition-all disabled:opacity-40"
                >
                    <Check size={18} />
                    Let's Go
                    <ArrowRight size={18} />
                </button>
            </div>
        </div>
    );
};

export default QuickStartOnboarding;
