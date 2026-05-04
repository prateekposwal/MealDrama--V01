import React, { useEffect, useMemo, useState, useCallback } from 'react';
import {
    Calendar, ChevronRight, Globe, Minus, Plus, RefreshCw, Search, Sparkles, X, ArrowLeft, ShoppingBasket,
} from 'lucide-react';
import { Category, Dish, DishType, DishVariant, Region } from '../../constants/dishLibrary';
import { useBackendDishes } from '../../hooks/useBackendDishes';
import { MealOption, useStore } from '../../store/useStore';

const SLOT_CATEGORIES: Record<string, Category> = {
    Breakfast: 'breakfast',
    Lunch: 'lunch',
    Dinner: 'dinner',
    Snacks: 'snacks',
};

const SLOT_META: Record<'Breakfast' | 'Lunch' | 'Dinner' | 'Snacks', { icon: string; joke: string; progress: string; done: string }> = {
    Breakfast: {
        icon: '🌅',
        joke: 'Chai pe charcha.',
        progress: 'Pick 3, please! Your future hungry self is watching.',
        done: 'Wah! Breakfast sorted. Ab bas khana hai, banana nahi.',
    },
    Lunch: {
        icon: '🌞',
        joke: 'Thali therapy.',
        progress: 'Lunch wants backup. Add a few more stars to this thali.',
        done: 'Lunch locked. Afternoon nap is now a strategic outcome.',
    },
    Dinner: {
        icon: '🌙',
        joke: 'Light... ish.',
        progress: 'Dinner abhi single hai. Give it company.',
        done: 'Dinner sorted. Kal subah uthna bhi easy rahega.',
    },
    Snacks: {
        icon: '🍵',
        joke: 'The real main course.',
        progress: 'Snacks need more drama. Add at least 3 total picks.',
        done: 'Snacks ready. Real heroes of the day have arrived.',
    },
};

const REGION_MAP: Record<string, Region> = {
    'North India': 'north',
    'South India': 'south',
    'West India': 'west',
    'East India': 'east',
    'Central India': 'central',
    'Northeast India': 'northeast',
};

const REGION_LABEL: Record<Region, string> = {
    north: 'North India',
    south: 'South Indian',
    west: 'West Indian',
    east: 'East Indian',
    central: 'Central Indian',
    northeast: 'Northeast',
};

const DIET_LABEL: Record<DishType, string> = {
    veg: 'Veg',
    vegan: 'Vegan',
    'non-veg': 'Non-Veg',
    eggitarian: 'Eggitarian',
};

const DIET_COMPATIBILITY: Record<string, DishType[]> = {
    Veg: ['veg', 'vegan'],
    Vegan: ['vegan'],
    'Non-Veg': ['veg', 'vegan', 'non-veg', 'eggitarian'],
    Eggitarian: ['veg', 'vegan', 'non-veg', 'eggitarian'],
};

const HERO_TAGS = ['popular', 'hero', 'comfort food'];
const NON_COUNT_TERMS = ['curd', 'chutney', 'butter', 'raita', 'tea', 'coffee', 'juice', 'milk', 'lassi', 'sambhar'];
const QUICK_BREAKFAST_BLOCKERS = ['stuffed', 'thali', 'bhature', 'ghee roast', 'dhaba', 'traditional'];

const getSlotIdx = (slots: string[], slot?: 'Breakfast' | 'Lunch' | 'Dinner' | 'Snacks') =>
    Math.max(0, slot ? slots.indexOf(slot) : 0);

const mergeSlots = (
    plannedSlots: ('Breakfast' | 'Lunch' | 'Dinner' | 'Snacks')[],
    initialSlot?: 'Breakfast' | 'Lunch' | 'Dinner' | 'Snacks'
) => {
    const merged = [...plannedSlots];
    if (initialSlot && !merged.includes(initialSlot)) merged.push(initialSlot);
    return merged.length ? merged : ['Breakfast', 'Lunch', 'Snacks', 'Dinner'];
};

const isDishAllowedForDiet = (dish: Dish, userDiet: string) => {
    const key = userDiet as keyof typeof DIET_COMPATIBILITY;
    const diets = DIET_COMPATIBILITY[key] ?? DIET_COMPATIBILITY.Veg;
    return diets!.includes(dish.type);
};

const isCountBasedVariant = (dish: Dish, variant: DishVariant) => {
    const label = `${dish.name} ${variant.name}`.toLowerCase();
    return !NON_COUNT_TERMS.some(term => label.includes(term));
};

const getSelectedVariantNote = (option: MealOption) => {
    const label = `${option.name} ${option.variant || ''}`.toLowerCase();
    if (!option.countBased) return 'Side add-on saved.';
    if (label.includes('paratha')) return 'Quantity controls how many go on the tawa.';
    if (label.includes('roti')) return 'Set the roti count for this meal.';
    if (label.includes('idli')) return 'Adjust how many idlis land on the plate.';
    if (label.includes('dosa')) return 'Set dosa count without adding duplicates.';
    if (label.includes('puri')) return 'Choose how many puris you want in rotation.';
    return 'Adjust quantity for this exact variant.';
};

const getVariantDescription = (dish: Dish, variant: DishVariant, prepMinutes: number) => {
    const label = `${dish.name} ${variant.name}`.toLowerCase();
    if (label.includes('plain')) return 'Classic baseline.';
    if (label.includes('crispy')) return 'Sharper texture, more crunch.';
    if (label.includes('stuffed')) return 'Heavier pick with more filling.';
    if (label.includes('curd')) return 'Cooling side for balance.';
    if (label.includes('butter')) return 'Richer finish.';
    if (label.includes('lite')) return 'Lighter option for easy dinners.';
    if (label.includes('rice')) return 'Better fit for heavier lunches.';
    if (label.includes('roti')) return 'Cleaner dinner pairing.';
    if (label.includes('thali')) return 'Full plated meal setup.';
    if (label.includes('instant') || label.includes('overnight')) return 'Fast breakfast win.';
    return `${prepMinutes} min prep.`;
};

const estimatePrepMinutes = (dish: Dish, variant: DishVariant) => {
    const label = `${dish.name} ${variant.name}`.toLowerCase();
    if (label.includes('overnight') || label.includes('instant') || label.includes('plain idli')) return 10;
    if (label.includes('stuffed') || label.includes('ghee roast')) return 25;
    if (label.includes('crispy') || label.includes('masala dosa') || label.includes('bhature')) return 20;
    if (label.includes('lite')) return 12;
    if (dish.weight === 'heavy') return 22;
    if (dish.weight === 'medium') return 16;
    return 10;
};

const variantMatchesTiming = (
    slot: string,
    timing: string | undefined,
    dish: Dish,
    variant: DishVariant
) => {
    if (slot !== 'Breakfast' || timing !== '<15') return true;
    const prepMinutes = estimatePrepMinutes(dish, variant);
    const label = `${dish.name} ${variant.name}`.toLowerCase();
    return prepMinutes <= 15 && !QUICK_BREAKFAST_BLOCKERS.some(term => label.includes(term));
};

const getVariantBadges = (dish: Dish) => {
    const regionalLabel = dish.states[0]?.split(' ')[0] || REGION_LABEL[dish.region];
    return [
        `${dish.region === 'north' ? '🌶️' : dish.region === 'south' ? '🥥' : dish.region === 'east' ? '🐟' : '🍛'} ${regionalLabel}`,
        `${dish.type === 'vegan' ? '🌱' : dish.type === 'veg' ? '🥦' : '🍗'} ${DIET_LABEL[dish.type]}`,
        `${dish.region === 'south' ? '🥥' : '🫶'} ${REGION_LABEL[dish.region]}`,
    ];
};

const pickSmartVariant = (dish: Dish, slot: string, breakfastTiming?: string, userDiet?: string) => {
    const slotCtx = slot.toLowerCase() as Category;
    return dish.variants
        .filter(variant => variantMatchesTiming(slot, breakfastTiming, dish, variant))
        .filter(variant => !(userDiet === 'Vegan' && /butter|curd|raita|lassi|ghee/i.test(variant.name)))
        .map(variant => {
            let score = 0;
            if (variant.mealContext === slotCtx) score += 10;
            if (slot === 'Lunch' && /rice|thali|bowl/i.test(variant.name)) score += 6;
            if (slot === 'Dinner' && /lite|roti/i.test(variant.name)) score += 6;
            if (slot === 'Breakfast' && breakfastTiming === '<15' && estimatePrepMinutes(dish, variant) <= 15) score += 10;
            if (dish.id === 'jadoh' && slot === 'Lunch' && /rice|thali/i.test(variant.name)) score += 12;
            if (dish.id === 'jadoh' && slot === 'Dinner' && /lite|roti/i.test(variant.name)) score += 12;
            if (variant.name.toLowerCase().includes('curd')) score += 4;
            if (HERO_TAGS.some(tag => dish.tags.includes(tag))) score += 2;
            return { variant, score };
        })
        .sort((a, b) => b.score - a.score)[0]?.variant;
};

const MealCustomizer: React.FC<{
    userRegion: string;
    userDiet: string;
    plannedSlots: ('Breakfast' | 'Lunch' | 'Dinner' | 'Snacks')[];
    cookingRole: 'cook' | 'order';
    slotTiming: {
        breakfast?: '<15' | '15-30' | '30+';
    };
    initialSlot?: 'Breakfast' | 'Lunch' | 'Dinner' | 'Snacks';
    onComplete: (library: Record<string, MealOption[]>, loop: string) => void;
}> = ({ userRegion, userDiet, plannedSlots, cookingRole, slotTiming, initialSlot, onComplete }) => {
    const { trayLibrary, trayEditSession, endTrayEdit } = useStore();
    const { dishes } = useBackendDishes();
    const visibleSlots = useMemo(() => mergeSlots(plannedSlots, initialSlot), [plannedSlots, initialSlot]);
    const [slotIdx, setSlotIdx] = useState(getSlotIdx(visibleSlots, initialSlot));
    const [isFinal, setIsFinal] = useState(false);
    const [loop, setLoop] = useState('Weekly');
    const [search, setSearch] = useState('');
    const [showGlobal, setShowGlobal] = useState(false);
    const [statusMessage, setStatusMessage] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [autoSeededSlots, setAutoSeededSlots] = useState<Record<string, boolean>>({});
    const [tray, setTray] = useState<Record<string, MealOption[]>>({
        breakfast: trayLibrary.breakfast,
        lunch: trayLibrary.lunch,
        dinner: trayLibrary.dinner,
        snacks: trayLibrary.snacks,
    });

    useEffect(() => {
        setSlotIdx(getSlotIdx(visibleSlots, initialSlot));
    }, [visibleSlots, initialSlot]);

    useEffect(() => {
        setIsLoading(true);
        const timer = window.setTimeout(() => setIsLoading(false), 350);
        return () => window.clearTimeout(timer);
    }, [slotIdx, search, showGlobal, userRegion, userDiet, cookingRole]);

    const currentSlot = visibleSlots[slotIdx]!;
    const currentCategory = SLOT_CATEGORIES[currentSlot]!;
    const regionKey = REGION_MAP[userRegion] || 'north';
    const slotKey = currentSlot.toLowerCase();
    const currentOptions = tray[slotKey] || [];
    const totalQuantity = currentOptions.reduce((sum, option) => sum + (option.quantity || 1), 0);
    const minRequired = trayEditSession ? 1 : 3;
    const minMet = totalQuantity >= minRequired;
    const isEditMode = !!trayEditSession;

    const buildMealOption = (dish: Dish, variant: DishVariant, smartRecommended = false): MealOption => ({
        id: `${variant.id}-${Date.now()}`,
        dishId: dish.id,
        name: dish.name,
        icon: dish.icon,
        variant: variant.name,
        variantId: variant.id,
        mealContext: variant.mealContext || currentCategory,
        sourceRegion: REGION_LABEL[dish.region],
        quantity: 1,
        countBased: isCountBasedVariant(dish, variant),
        prepMinutes: estimatePrepMinutes(dish, variant),
        smartRecommended,
    });

    const addVariant = useCallback((dish: Dish, variant: DishVariant, smartRecommended = false) => {
        const nextOption = buildMealOption(dish, variant, smartRecommended);
        setTray(prev => {
            const existing = (prev[slotKey] || []).find(item => item.variantId === variant.id);
            if (existing) {
                return {
                    ...prev,
                    [slotKey]: (prev[slotKey] || []).map(item => item.variantId === variant.id
                        ? { ...item, quantity: Math.min(6, (item.quantity || 1) + 1) }
                        : item),
                };
            }
            return {
                ...prev,
                [slotKey]: [...(prev[slotKey] || []), nextOption],
            };
        });
    }, [slotKey]);

    const updateQuantity = useCallback((variantId: string, delta: number) => {
        setTray(prev => ({
            ...prev,
            [slotKey]: (prev[slotKey] || []).flatMap(item => {
                if (item.variantId !== variantId) return [item];
                const nextQty = Math.min(6, Math.max(1, (item.quantity || 1) + delta));
                return [{ ...item, quantity: nextQty }];
            }),
        }));
    }, [slotKey]);

    const removeOption = useCallback((variantId: string) =>
        setTray(prev => ({
            ...prev,
            [slotKey]: (prev[slotKey] || []).filter(option => option.variantId !== variantId),
        })), [slotKey]);

    const rankedDishes = useMemo(() => {
        const q = search.toLowerCase();
        const matches = (dish: Dish) => (
            !q
            || dish.name.toLowerCase().includes(q)
            || dish.tags.some(tag => tag.toLowerCase().includes(q))
            || dish.states.some(state => state.toLowerCase().includes(q))
            || dish.variants.some(variant =>
                variant.name.toLowerCase().includes(q)
                || (variant.addOn && variant.addOn.toLowerCase().includes(q))
            )
        );

        const compatible = dishes
            .filter(dish => dish.category.includes(currentCategory))
            .filter(dish => isDishAllowedForDiet(dish, userDiet))
            .filter(matches)
            .map(dish => {
                const filteredVariants = dish.variants.filter(variant => {
                    if (!variantMatchesTiming(currentSlot, slotTiming.breakfast, dish, variant)) return false;
                    if (userDiet === 'Vegan' && /butter|curd|raita|lassi|ghee/i.test(variant.name)) return false;
                    return true;
                });
                return { dish, filteredVariants };
            })
            .filter(item => item.filteredVariants.length > 0);

        const regional = compatible.filter(item => item.dish.region === regionKey);
        const globalMatches = compatible.filter(item => item.dish.region !== regionKey);

        // showGlobal=false: regional dishes first, then others
        // showGlobal=true: others first, then regional
        const primary = showGlobal ? globalMatches : regional;
        const secondary = showGlobal ? regional : globalMatches;

        const scoreDish = (dish: Dish) => {
            let score = 0;
            if (dish.region === regionKey) score += 20;
            if (HERO_TAGS.some(tag => dish.tags.includes(tag))) score += 10;
            if (dish.tags.includes('under-15') && currentSlot === 'Breakfast' && slotTiming.breakfast === '<15') score += 15;
            if (cookingRole === 'order' && /lite|bowl|rice|comfort|popular/.test(dish.tags.join(' '))) score += 8;
            if (dish.weight === 'heavy' && currentSlot === 'Lunch') score += 6;
            if (dish.weight === 'light' && currentSlot === 'Dinner') score += 6;
            return score;
        };

        return [...primary, ...secondary].sort((left, right) => {
            return scoreDish(right.dish) - scoreDish(left.dish);
        });
    }, [currentCategory, currentSlot, regionKey, search, showGlobal, slotTiming.breakfast, userDiet, cookingRole]);

    const dishAlternatives = useMemo(() => {
        const map = new Map<string, Dish[]>();
        for (const { dish } of rankedDishes) {
            if (map.has(dish.id)) continue;
            const alts = rankedDishes
                .map(item => item.dish)
                .filter(c => c.region === regionKey && c.id !== dish.id && c.type === dish.type)
                .slice(0, 2);
            map.set(dish.id, alts);
        }
        return map;
    }, [rankedDishes, regionKey]);

    const smartVariants = useMemo(() => {
        const map = new Map<string, DishVariant | undefined>();
        for (const { dish } of rankedDishes) {
            if (!map.has(dish.id)) {
                map.set(dish.id, pickSmartVariant(dish, currentSlot, slotTiming.breakfast, userDiet));
            }
        }
        return map;
    }, [rankedDishes, currentSlot, slotTiming.breakfast, userDiet]);

    useEffect(() => {
        if (isEditMode || currentOptions.length > 0 || autoSeededSlots[currentSlot] || rankedDishes.length === 0) return;
        const heroDish = rankedDishes[0]!.dish;
        const smartVariant = smartVariants.get(heroDish.id) ?? pickSmartVariant(heroDish, currentSlot, slotTiming.breakfast, userDiet);
        if (!smartVariant) return;
        addVariant(heroDish, smartVariant, true);
        setAutoSeededSlots(prev => ({ ...prev, [currentSlot]: true }));
    }, [autoSeededSlots, currentOptions.length, currentSlot, isEditMode, rankedDishes, slotTiming.breakfast, userDiet, smartVariants]);

    const handleNextSlot = () => {
        if (slotIdx < visibleSlots.length - 1) {
            setSlotIdx(index => index + 1);
            setSearch('');
            setShowGlobal(false);
            setStatusMessage(null);
            return;
        }
        setIsFinal(true);
    };

    if (isFinal) {
        return (
            <div className="min-h-screen bg-white max-w-lg mx-auto flex flex-col justify-center px-8 pb-16 animate-in fade-in duration-500">
                <div className="w-20 h-20 bg-[#FF385C]/10 rounded-[28px] flex items-center justify-center mb-8 mx-auto">
                    <RefreshCw className="text-[#FF385C]" size={36} />
                </div>
                <h2 className="text-4xl font-bold tracking-tight text-center mb-2">{isEditMode ? 'Save Meal Changes' : 'Meal loop sorted'}</h2>
                <p className="text-gray-400 text-center text-sm mb-10">
                    {isEditMode ? 'Profile edits go right back to your tray.' : 'Your week is sorted. Ab bas fridge kholo, aur hero bano.'}
                </p>
                <div className="space-y-4 mb-14">
                    {[
                        { key: 'Weekly', desc: 'Fresh variety every 7 days', icon: '📅' },
                        { key: 'Bi-weekly', desc: 'New meals every 2 weeks', icon: '🗓️' },
                        { key: 'Monthly', desc: 'Stable plan for a full month', icon: '📆' },
                    ].map(({ key, desc, icon }) => (
                        <button
                            key={key}
                            onClick={() => setLoop(key)}
                            className={`w-full p-6 rounded-[24px] border-2 transition-all flex items-center gap-5 ${loop === key ? 'border-[#FF385C] bg-[#FF385C]/5' : 'border-gray-100'}`}
                        >
                            <span className="text-3xl">{icon}</span>
                            <div className="text-left flex-1">
                                <span className="font-bold text-lg block">{key}</span>
                                <span className="text-xs text-gray-400">{desc}</span>
                            </div>
                            {loop === key && <Sparkles size={20} className="text-[#FF385C]" />}
                        </button>
                    ))}
                </div>
                <button
                    onClick={() => onComplete(tray, loop)}
                    className="w-full py-6 bg-[#FF385C] text-white rounded-[24px] font-bold text-lg flex items-center justify-center gap-3 shadow-2xl shadow-[#FF385C]/30 active:scale-[0.98] transition-all"
                >
                    <Calendar size={20} />
                    {isEditMode ? 'Save And Return To Profile' : 'Launch My Dashboard'}
                </button>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-white max-w-lg mx-auto flex flex-col">
            <div className="sticky top-0 bg-white/95 backdrop-blur-md border-b border-gray-50 px-6 pt-14 pb-4 z-10">
                <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-3">
                        {isEditMode && (
                            <button
                                onClick={endTrayEdit}
                                className="w-10 h-10 rounded-2xl bg-gray-100 flex items-center justify-center text-gray-500"
                            >
                                <ArrowLeft size={16} />
                            </button>
                        )}
                        <span className="text-[10px] font-black uppercase tracking-widest text-[#FF385C] bg-[#FF385C]/10 px-3 py-1 rounded-full">
                            {SLOT_META[currentSlot as keyof typeof SLOT_META].icon} {currentSlot}
                        </span>
                    </div>
                    <div className="flex gap-2">
                        {visibleSlots.map((slot, index) => (
                            <div
                                key={slot}
                                className={`w-2 h-2 rounded-full transition-all ${index < slotIdx ? 'bg-green-500' : index === slotIdx ? 'bg-[#FF385C]' : 'bg-gray-200'}`}
                            />
                        ))}
                    </div>
                </div>
                <h1 className="text-2xl font-bold tracking-tight">{currentSlot}</h1>
                <p className="text-gray-500 text-xs mt-1">
                    {SLOT_META[currentSlot as keyof typeof SLOT_META].joke} {cookingRole === 'order' ? 'Mains ordered, sides homemade.' : 'Pick wisely.'}
                </p>
                <p className={`text-xs mt-2 font-medium ${minMet ? 'text-emerald-600' : 'text-amber-600'}`}>
                    {minMet ? SLOT_META[currentSlot as keyof typeof SLOT_META].done : SLOT_META[currentSlot as keyof typeof SLOT_META].progress}
                </p>

                <div className="relative mt-3">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={15} />
                    <input
                        type="text"
                        placeholder="Search dishes..."
                        value={search}
                        onChange={(event) => setSearch(event.target.value)}
                        className="w-full bg-gray-50 rounded-2xl py-3 pl-11 pr-10 text-sm font-medium focus:ring-2 focus:ring-[#FF385C] border-none outline-none"
                    />
                    {search && (
                        <button onClick={() => setSearch('')} className="absolute right-4 top-1/2 -translate-y-1/2">
                            <X size={13} className="text-gray-400" />
                        </button>
                    )}
                </div>

                <div className="mt-2 flex items-center justify-between gap-3">
                    {!showGlobal ? (
                        <button
                            onClick={() => setShowGlobal(true)}
                            className="flex items-center gap-2 text-[11px] font-bold text-blue-500 hover:text-blue-700 transition-colors"
                        >
                            <Globe size={12} />
                            All regions
                        </button>
                    ) : (
                        <button
                            onClick={() => setShowGlobal(false)}
                            className="flex items-center gap-2 text-[11px] font-bold text-gray-400 hover:text-gray-600 transition-colors"
                        >
                            <X size={12} />
                            My region first
                        </button>
                    )}
                    <span className="text-[11px] font-bold text-gray-400">{currentOptions.length} variants · Qty {totalQuantity}/3</span>
                </div>
            </div>

            {statusMessage && (
                <div className="mx-5 mt-4 rounded-[20px] border border-emerald-100 bg-emerald-50 px-4 py-3">
                    <p className="text-sm font-bold text-emerald-900">{statusMessage}</p>
                </div>
            )}

            {currentOptions.length > 0 ? (
                <div className="px-5 pt-4 grid gap-3">
                    {currentOptions.map(option => (
                        <div key={option.variantId} className="rounded-[22px] bg-gray-900 text-white p-4 relative">
                            <div className="flex items-start gap-3">
                                <div className="text-3xl">{option.icon}</div>
                                <div className="flex-1">
                                    <div className="flex flex-wrap items-center gap-2">
                                        <p className="text-sm font-bold">{option.variant || option.name}</p>
                                        {option.smartRecommended && (
                                            <span className="text-[9px] font-black uppercase tracking-widest px-2 py-1 rounded-full bg-white/15">
                                                Mummy-approved pick
                                            </span>
                                        )}
                                    </div>
                                    <p className="text-[11px] text-white/60 mt-1">
                                        {getSelectedVariantNote(option)}
                                    </p>
                                </div>
                                <button
                                    onClick={() => removeOption(option.variantId || option.id)}
                                    className="w-8 h-8 rounded-xl bg-white/10 flex items-center justify-center"
                                >
                                    <X size={12} />
                                </button>
                            </div>

                            {option.countBased && (
                                <div className="mt-4 flex items-center gap-3">
                                    <button
                                        onClick={() => updateQuantity(option.variantId || option.id, -1)}
                                        className="w-9 h-9 rounded-xl bg-white/10 flex items-center justify-center"
                                    >
                                        <Minus size={14} />
                                    </button>
                                    <span className="text-sm font-black">Qty {option.quantity || 1}</span>
                                    <button
                                        onClick={() => updateQuantity(option.variantId || option.id, 1)}
                                        className="w-9 h-9 rounded-xl bg-white/10 flex items-center justify-center"
                                    >
                                        <Plus size={14} />
                                    </button>
                                </div>
                            )}
                        </div>
                    ))}
                </div>
            ) : (
                <div className="mx-5 mt-4 rounded-[22px] border border-dashed border-gray-200 bg-gray-50 px-5 py-6">
                    <p className="text-sm font-bold text-gray-700">Tap a variant to add it here.</p>
                    <p className="text-xs text-gray-500 mt-1">Min 3 picks per {currentSlot.toLowerCase()}.</p>
                </div>
            )}

            <div className="flex-1 px-5 pt-4 pb-48 space-y-4 overflow-y-auto">
                {cookingRole === 'order' && (
                    <div className="rounded-[22px] border border-blue-100 bg-blue-50 p-4">
                        <p className="text-[10px] font-black uppercase tracking-widest text-blue-600 mb-2">Hybrid mode</p>
                        <p className="text-sm font-bold text-blue-900">Order + Cook</p>
                        <p className="text-xs text-blue-700 mt-1">Mains ordered, sides homemade.</p>
                    </div>
                )}

                {slotTiming.breakfast === '<15' && currentSlot === 'Breakfast' && (
                    <div className="rounded-[22px] border border-amber-100 bg-amber-50 p-4">
                        <p className="text-[10px] font-black uppercase tracking-widest text-amber-600 mb-2">&lt;15 min breakfast</p>
                        <p className="text-sm font-bold text-amber-900">Quick wins only today.</p>
                    </div>
                )}

                {isLoading && (
                    <div className="rounded-[22px] border border-gray-100 bg-gray-50 p-5 text-center">
                        <p className="text-sm font-bold text-gray-700">Loading...</p>
                        <p className="text-xs text-gray-500 mt-1">A minute.</p>
                    </div>
                )}

                {!isLoading && rankedDishes.length === 0 && (
                    <div className="rounded-[22px] border border-gray-100 bg-gray-50 p-5 text-center">
                        <p className="text-sm font-bold text-gray-700">No matches.</p>
                        <p className="text-xs text-gray-500 mt-1">Tight filters. Try all regions.</p>
                        <button
                            onClick={() => {
                                setShowGlobal(true);
                                setSearch('');
                            }}
                            className="mt-4 inline-flex items-center gap-2 rounded-xl bg-white px-4 py-2 text-sm font-bold text-[#FF385C] border border-gray-200"
                        >
                            <RefreshCw size={14} />
                            Browse all
                        </button>
                    </div>
                )}

                {!isLoading && rankedDishes.map(({ dish, filteredVariants }) => {
                    const smartVariant = smartVariants.get(dish.id);
                    const alternatives = dishAlternatives.get(dish.id) ?? [];

                    return (
                        <div key={dish.id} className="rounded-[24px] border-2 border-gray-100 bg-white p-4">
                            <div className="flex items-start gap-4">
                                <div className="w-14 h-14 bg-gray-50 rounded-2xl flex items-center justify-center text-3xl shadow-sm">
                                    {dish.icon}
                                </div>
                                <div className="flex-1">
                                    <div className="flex items-start justify-between gap-3">
                                        <div>
                                            <h3 className="font-bold text-base text-gray-900">{dish.name}</h3>
                                            <p className="text-[11px] text-gray-500 mt-1">
                                                {dish.weight === 'heavy' && currentSlot === 'Lunch' ? 'Lunch: Thoda heavy, kyunki afternoon nap is self-care.' : ''}
                                                {dish.weight === 'light' && currentSlot === 'Dinner' ? 'Dinner: Light rakhna hai, kal subah uthna bhi toh hai.' : ''}
                                            </p>
                                        </div>
                                        <div className="text-right">
                                            <span className="text-[11px] font-black uppercase tracking-widest text-gray-400">{dish.states[0]}</span>
                                        </div>
                                    </div>

                                    <div className="flex flex-wrap gap-1.5 mt-3">
                                        {getVariantBadges(dish).map(badge => (
                                            <span key={badge} className="text-[9px] font-black uppercase tracking-wider px-2 py-1 rounded-full bg-gray-100 text-gray-600">
                                                {badge}
                                            </span>
                                        ))}
                                    </div>
                                </div>
                            </div>

                            <div className="mt-4">
                                <p className="text-[10px] font-black uppercase tracking-widest text-gray-400 mb-2">Choose variant</p>
                                <div className="flex flex-wrap gap-2">
                                    {filteredVariants.slice(0, 8).map(variant => {
                                        const selected = currentOptions.find(option => option.variantId === variant.id);
                                        const prepMinutes = estimatePrepMinutes(dish, variant);
                                        const smart = smartVariant?.id === variant.id;
                                        const disabledForVegan = userDiet === 'Vegan' && /butter|curd|raita|lassi|ghee/i.test(variant.name);
                                        if (disabledForVegan) return null;

                                        return (
                                            <button
                                                key={variant.id}
                                                onClick={() => addVariant(dish, variant, smart)}
                                                className={`px-3 py-2 rounded-2xl text-left border transition-all ${selected ? 'border-[#FF385C] bg-[#FF385C]/10' : 'border-gray-200 bg-gray-50 hover:border-gray-300'}`}
                                            >
                                                <div className="flex items-center gap-2">
                                                    <span className="text-xs font-bold text-gray-800">{variant.name}</span>
                                                    {smart && (
                                                        <span className="text-[8px] font-black uppercase tracking-widest px-2 py-1 rounded-full bg-white text-[#FF385C]">
                                                            AI ne socha
                                                        </span>
                                                    )}
                                                </div>
                                                <div className="flex items-center gap-2 mt-1 flex-wrap">
                                                    <span className="text-[10px] text-gray-500">
                                                        {getVariantDescription(dish, variant, prepMinutes)}
                                                    </span>
                                                    {selected && (
                                                        <span className="text-[10px] font-bold text-[#FF385C]">
                                                            Qty {selected.quantity || 1}
                                                        </span>
                                                    )}
                                                </div>
                                            </button>
                                        );
                                    })}
                                </div>
                            </div>

                            {dish.region !== regionKey && alternatives.length > 0 && (
                                <div className="mt-4 rounded-2xl bg-blue-50 border border-blue-100 p-3">
                                    <p className="text-[9px] font-black uppercase tracking-widest text-blue-600 mb-2">Regional swap tip</p>
                                    <p className="text-[11px] text-blue-700">Feeling adventurous? Try {alternatives.map(option => option.name).join(' or ')} next.</p>
                                </div>
                            )}
                        </div>
                    );
                })}
            </div>

            <div className="fixed bottom-0 left-0 right-0 max-w-lg mx-auto px-5 pb-10 pt-4 bg-white/95 backdrop-blur-xl border-t border-gray-50 flex flex-col gap-3">
                {!minMet && (
                    <div className="flex items-center gap-2 text-amber-700 text-xs font-bold bg-amber-50 border border-amber-100 rounded-2xl px-4 py-3">
                        <ShoppingBasket size={14} />
                        Add {minRequired - totalQuantity} more pick{minRequired - totalQuantity !== 1 ? 's' : ''}.
                    </div>
                )}
                <button
                    onClick={handleNextSlot}
                    disabled={!minMet}
                    className={`w-full py-4 rounded-[20px] font-bold text-base flex items-center justify-center gap-2 transition-all ${minMet ? 'bg-[#FF385C] text-white shadow-xl shadow-[#FF385C]/25 active:scale-[0.98]' : 'bg-gray-100 text-gray-400 cursor-not-allowed'}`}
                >
                    {slotIdx === visibleSlots.length - 1
                        ? <><Calendar size={18} /> Lock It In</>
                        : <>{visibleSlots[slotIdx + 1]} <ChevronRight size={18} /></>}
                </button>
            </div>
        </div>
    );
};

export default MealCustomizer;
