import React, { useMemo, useState, useCallback } from 'react';
import type { MealOption, MealResolution } from '../../store/useStore';
import type { Dish, DishVariant } from '../../constants/dishLibrary';
import DishImage from './DishImage';
import { indian_meal_categories } from '../../constants/dishStyles';
import {
    ArrowLeftRight, X, Sparkles, Minus, Plus, ShieldAlert, Lock, Clock3, ChevronRight, CheckCheck,
} from 'lucide-react';
export const SLOT_META: Record<string, { icon: string; time: string; color: string; bg: string }> = {
    Breakfast: { icon: '🌅', time: '8:00 AM', color: 'border-amber-100', bg: 'bg-amber-50' },
    Lunch: { icon: '☀️', time: '1:00 PM', color: 'border-blue-100', bg: 'bg-blue-50' },
    Snacks: { icon: '🥜', time: '4:00 PM', color: 'border-orange-100', bg: 'bg-orange-50' },
    Dinner: { icon: '🌙', time: '8:00 PM', color: 'border-violet-100', bg: 'bg-violet-50' },
};

export type SlotMeta = typeof SLOT_META[keyof typeof SLOT_META];

export type SwapStage = 'overview' | 'dish-picker' | 'variant-picker';

export type SwapTarget = 'dish' | 'gravy' | 'roti' | 'rice' | 'sides' | 'beverages' | 'dessert';

export type CategoryKey = 'gravy' | 'roti' | 'rice' | 'sides' | 'beverages' | 'dessert';

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
    onRevertSwap?: (slot: string) => void;
    onRemove?: (slot: string) => void;
    onUpdateCategory?: (slot: string, category: CategoryKey, selections: string | string[] | null) => void;
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
    onRevertSwap, onRemove, onUpdateCategory,
    isLocked, isMissed, hasSwap, repetitionWarning,
}) => {
    const meal = resolution.meal;

    // Swap state — managed by MealCard
    const [swapStage, setSwapStage] = useState<SwapStage>('overview');
    const [swapSelectedDish, setSwapSelectedDish] = useState<Dish | null>(null);
    const [swapTarget, setSwapTarget] = useState<SwapTarget | null>(null);
    const [showAllRegions, setShowAllRegions] = useState(false);

    // Look up dish metadata for component-level customization
    const mealDish = useMemo(
        () => (meal?.dishId ? dishes.find(d => d.id === meal.dishId) : undefined),
        [dishes, meal?.dishId],
    );

    // Derive component options from dish variants + tags
    const SELF_BREAD_TAGS = ['paratha', 'naan', 'roti', 'puri', 'bread', 'toast', 'pav', 'bhature', 'flatbread', 'thepla'];
    const SELF_RICE_TAGS = ['rice', 'biryani', 'pulao', 'khichdi', 'chawal'];
    const MAIN_DISH_TAGS = ['gravy', 'curry', 'sabzi', 'dal', 'lentils', 'kofta', 'stew'];

    const componentMeta = useMemo(() => {
        if (!mealDish) return undefined;

        const isSelfBread = SELF_BREAD_TAGS.some(t => mealDish.tags.includes(t));
        const isSelfRice = SELF_RICE_TAGS.some(t => mealDish.tags.includes(t));
        const isMainDish = MAIN_DISH_TAGS.some(t => mealDish.tags.includes(t));
        const isLunchOrDinner = mealDish.category.some(c => c === 'lunch' || c === 'dinner');
        const hasBreadPairing = mealDish.variants.some(v =>
            v.addOn?.includes('roti') ||
            v.name?.toLowerCase().includes('with roti') ||
            v.name?.toLowerCase().includes('with naan') ||
            v.name?.toLowerCase().includes('with paratha') ||
            v.name?.toLowerCase().includes('with parotta')
        );
        const hasRicePairing = mealDish.variants.some(v =>
            v.addOn?.includes('rice') ||
            v.name?.toLowerCase().includes('with rice')
        );

        // Cooking style options — deduplicated via Set
        const rawStyles = [...new Set(mealDish.variants.map(v => v.cookingStyle).filter(Boolean))] as string[];
        const cookingStyleOptions = rawStyles.length > 0 ? rawStyles : undefined;
        const cookingStyleLabel = isMainDish ? 'Gravy' : 'Style';

        // Bread options:
        //  - Main dishes (dal, sabzi, curry) get bread
        //  - Dishes with explicit bread pairings get bread
        //  - Lunch/dinner dishes that aren't self-bread get bread (Khar, etc.)
        //  - Self-bread dishes (paratha, naan, roti) do NOT get bread
        const showBread = (isMainDish || hasBreadPairing || (isLunchOrDinner && !isSelfBread && !isSelfRice)) && !isSelfBread;
        const breadOptions = showBread ? indian_meal_categories.bread : undefined;

        // Rice options — same logic as bread
        const showRice = (isMainDish || hasRicePairing || (isLunchOrDinner && !isSelfRice && !isSelfBread)) && !isSelfRice;
        const riceOptions = showRice ? indian_meal_categories.rice : undefined;

        // Side options: from dish accompaniments + addOn items from ALL variants (not just current)
        const sideAccompaniments = [...new Set(mealDish.variants.flatMap(v => v.accompaniments ?? []))];
        const allVariantAddOns = [...new Set(mealDish.variants.map(v => v.addOn).filter(Boolean))] as string[];
        const allSideItems = [...sideAccompaniments];
        for (const addOn of allVariantAddOns) {
            const items = addOn.replace(/^with\s+/i, '').split('/').map(s => s.trim()).filter(Boolean);
            for (const item of items) {
                const lower = item.toLowerCase();
                const isBread = SELF_BREAD_TAGS.includes(lower) || lower.includes('roti') || lower.includes('naan') || lower.includes('paratha') || lower.includes('pav') || lower.includes('bread') || lower.includes('puri') || lower.includes('kulcha') || lower.includes('bhature');
                const isRice = SELF_RICE_TAGS.includes(lower) || lower.includes('rice');
                const isSpecial = ['standalone', 'thali set', 'light portion', 'rumali roti'].includes(lower);
                if (!isBread && !isRice && !isSpecial) {
                    const capped = item.charAt(0).toUpperCase() + item.slice(1);
                    if (!allSideItems.some(s => s.toLowerCase() === capped.toLowerCase())) {
                        allSideItems.push(capped);
                    }
                }
            }
        }
        const sideOptions = allSideItems.length > 0 ? allSideItems : undefined;

        const beverageOptions = ['Chaas', 'Nimbu Pani', 'Seasonal Fruit Juice', 'Coffee', 'Tea', 'Lassi'];
        const dessertOptions = indian_meal_categories.dessert;

        return { cookingStyleOptions, cookingStyleLabel, breadOptions, riceOptions, sideOptions, beverageOptions, dessertOptions };
    }, [mealDish, meal?.addOn]);

    // Local chip state initialized from meal.categorySelections
    const localCat = meal?.categorySelections;
    const [localGravy, setLocalGravy] = useState<string | null>(localCat?.gravy?.name ?? null);
    const [localRoti, setLocalRoti] = useState<string | null>(localCat?.roti?.name ?? null);
    const [localRice, setLocalRice] = useState<string | null>(localCat?.rice?.name ?? null);
    const [localSides, setLocalSides] = useState<string[]>(localCat?.sides?.map(s => s.name) ?? []);
    const [localBevs, setLocalBevs] = useState<string[]>(localCat?.beverages?.map(b => b.name) ?? []);
    const [localDessert, setLocalDessert] = useState<string[]>(localCat?.dessert?.map(d => d.name) ?? []);

    // Compute addOn items from the CURRENT variant only (for pre-selection + subtitle)
    const addOnSides = useMemo(() => {
        if (!meal?.addOn) return [];
        const items = meal.addOn.replace(/^with\s+/i, '').split('/').map(s => s.trim().charAt(0).toUpperCase() + s.trim().slice(1)).filter(s => {
            const lower = s.toLowerCase();
            return !['standalone', 'Thali Set', 'Light Portion', 'Rumali Roti'].includes(s) &&
                !SELF_BREAD_TAGS.includes(lower) && !SELF_RICE_TAGS.includes(lower);
        });
        // Filter out items already present in the title
        const titleLower = (meal?.variant || meal?.name || '').toLowerCase();
        return items.filter(i => !titleLower.includes(i.toLowerCase()));
    }, [meal?.addOn, meal?.variant, meal?.name]);

    const effectiveSides = useMemo(() => {
        const set = new Set([...localSides, ...addOnSides]);
        return [...set];
    }, [localSides, addOnSides]);

    // Build display title: dish name + selected components (skip if already in base name)
    const buildTitle = (gravy?: string | null, roti?: string | null, rice?: string | null) => {
        const base = meal?.variant || meal?.name || '';
        const hasSep = base.includes(' + ');
        const parts = base.split(/\s*\+\s*/).map(s => s.trim()).filter(Boolean);
        const partsLower = parts.map(p => p.toLowerCase());

        // Only replace trailing "+ component" segments (index > 0), never touch the dish name (index 0)
        const tryReplace = (sel: string, keywords: string[]): boolean => {
            const selLower = sel.toLowerCase();
            for (let i = parts.length - 1; i > 0; i--) {
                if (keywords.some(k => partsLower[i].includes(k)) && !partsLower[i].includes(selLower)) {
                    parts[i] = sel;
                    return true;
                }
            }
            return false;
        };

        if (gravy && !tryReplace(gravy, ['gravy', 'style', 'masala', 'curry', 'stir'])) parts.push(gravy);
        if (roti && !tryReplace(roti, ['roti', 'naan', 'paratha', 'bread', 'puri', 'pav'])) parts.push(roti);
        if (rice && !tryReplace(rice, ['rice', 'pulao', 'biryani'])) parts.push(rice);

        return parts.join(' + ');
    };

    // Quantity per category (including dish servings)
    const [catQty, setCatQty] = useState<Record<string, number>>({});
    const getQty = (key: string) => catQty[key] ?? 1;
    const adjustQty = (key: string, delta: number) => {
        setCatQty(p => ({ ...p, [key]: Math.max(1, (p[key] ?? 1) + delta) }));
    };

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
            handleSwapSelect(dish.variants[0], dish);
        } else {
            setSwapSelectedDish(dish);
            setSwapStage('variant-picker');
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
        setSwapStage('overview');
        setSwapSelectedDish(null);
        setSwapTarget(null);
        setShowAllRegions(false);
    };

    const openSwap = () => {
        if (isLocked || isMissed) return;
        setSwapPopoverSlot(isOpen ? null : slot);
        setSwapStage('overview');
        setSwapSelectedDish(null);
    };

    // Opens swap modal — always starts at overview (dish + component chips)
    const openTileSwap = (target: SwapTarget) => {
        if (isLocked || isMissed) return;
        if (isOpen && swapTarget === target) {
            closeSwap();
            return;
        }
        setSwapPopoverSlot(slot);
        setSwapTarget(target);
        setSwapStage('overview');
        setSwapSelectedDish(null);
    };

    const startDishPicker = () => setSwapStage('dish-picker');
    const backToOverview = () => { setSwapStage('overview'); setSwapSelectedDish(null); };

    // Component chip handlers
    const handleGravySelect = useCallback((_: string, newSel?: string[]) => {
        const newVal = newSel?.[0] ?? null;
        setLocalGravy(newVal);
        onUpdateCategory?.(slot, 'gravy', newVal);
    }, [onUpdateCategory, slot]);

    const handleRotiSelect = useCallback((_: string, newSel?: string[]) => {
        const newVal = newSel?.[0] ?? null;
        setLocalRoti(newVal);
        onUpdateCategory?.(slot, 'roti', newVal);
    }, [onUpdateCategory, slot]);

    const handleRiceSelect = useCallback((_: string, newSel?: string[]) => {
        const newVal = newSel?.[0] ?? null;
        setLocalRice(newVal);
        onUpdateCategory?.(slot, 'rice', newVal);
    }, [onUpdateCategory, slot]);

    const handleSideToggle = useCallback((_: string, newSel?: string[]) => {
        const newSides = newSel ?? [];
        setLocalSides(newSides);
        onUpdateCategory?.(slot, 'sides', newSides);
    }, [onUpdateCategory, slot]);

    const handleBevToggle = useCallback((_: string, newSel?: string[]) => {
        const newBevs = newSel ?? [];
        setLocalBevs(newBevs);
        onUpdateCategory?.(slot, 'beverages', newBevs);
    }, [onUpdateCategory, slot]);

    const handleDessertToggle = useCallback((_: string, newSel?: string[]) => {
        const newDessert = newSel ?? [];
        setLocalDessert(newDessert);
        onUpdateCategory?.(slot, 'dessert', newDessert);
    }, [onUpdateCategory, slot]);

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

            {/* Contextual Swap Popover Overlay */}
            {isOpen && !isLocked && (
                <div className="absolute inset-0 z-30 rounded-[28px] bg-white border-2 border-[#FF385C] p-5 shadow-2xl shadow-[#FF385C]/10 animate-in fade-in zoom-in-95 duration-200 overflow-y-auto max-h-[500px]">
                    <div className="flex items-center justify-between mb-4">
                        <div>
                            <p className="text-[9px] font-black uppercase tracking-widest text-[#FF385C]">2-Tap Swap</p>
                            {swapStage === 'overview' && <p className="font-bold text-gray-900 text-base">Customize your meal</p>}
                            {swapStage === 'dish-picker' && <p className="font-bold text-gray-900 text-base">Pick a dish — {slot}</p>}
                            {swapStage === 'variant-picker' && <p className="font-bold text-gray-900 text-base">Pick a style — {swapSelectedDish?.name}</p>}
                        </div>
                        <button onClick={closeSwap} className="w-8 h-8 rounded-xl bg-gray-100 flex items-center justify-center">
                            <X size={14} className="text-gray-500" />
                        </button>
                    </div>

                    {swapStage === 'overview' ? (
                        /* ─── OVERVIEW: Current dish + component chips ─── */
                        <>
                            {/* Current dish card */}
                            <div className="flex items-center gap-3 p-4 rounded-2xl bg-white border-2 border-gray-100 mb-5">
                                <DishImage name={meal?.name} slot={slot} size="md" />
                                <div className="flex-1 min-w-0">
                                    <p className="font-bold text-sm text-gray-900 truncate leading-tight">
                                        {buildTitle(localGravy, localRoti, localRice)}
                                    </p>
                                    {addOnSides.length > 0 && (
                                        <span className="text-[10px] text-gray-500 font-medium">
                                            + {addOnSides.join(', ')}
                                        </span>
                                    )}
                                </div>
                                <button onClick={startDishPicker}
                                    className="px-3 py-1.5 rounded-full bg-[#FF385C]/10 text-[#FF385C] text-[9px] font-black uppercase tracking-widest active:scale-90 transition-all"
                                >Change</button>
                            </div>

                            {/* Component sections */}
                            {componentMeta ? (
                                <div className="space-y-4">
                                    {[
                                        { key: 'cookingStyle', label: componentMeta.cookingStyleLabel, icon: '🍳', target: 'gravy', options: componentMeta.cookingStyleOptions, isMulti: false, current: localGravy, onSelect: handleGravySelect },
                                        { key: 'bread', label: 'Bread', icon: '🫓', target: 'roti', options: componentMeta.breadOptions, isMulti: false, current: localRoti, onSelect: handleRotiSelect },
                                        { key: 'rice', label: 'Rice', icon: '🍚', target: 'rice', options: componentMeta.riceOptions, isMulti: false, current: localRice, onSelect: handleRiceSelect },
                                        { key: 'sides', label: 'Sides', icon: '🥗', target: 'sides', options: componentMeta.sideOptions, isMulti: true, current: effectiveSides, onSelect: handleSideToggle },
                                        { key: 'beverages', label: 'Beverages', icon: '🥤', target: 'beverages', options: componentMeta.beverageOptions, isMulti: true, current: localBevs, onSelect: handleBevToggle },
                                        { key: 'dessert', label: 'Dessert', icon: '🍨', target: 'dessert', options: componentMeta.dessertOptions, isMulti: true, current: localDessert, onSelect: handleDessertToggle },
                                    ].filter(s => s.options && s.options.length > 0).map(section => {
                                        const uniqueOpts = [...new Set(section.options)];
                                        return (
                                        <div key={section.key}>
                                            <p className="text-[9px] font-black uppercase tracking-widest text-gray-400 mb-2 flex items-center gap-1">
                                                <span>{section.icon}</span>
                                                {section.label}
                                                {(() => {
                                                    const count = section.isMulti
                                                        ? (section.current as string[])?.length || 0
                                                        : section.current ? 1 : 0;
                                                    return count > 0 ? (
                                                        <span className="ml-1 text-[8px] bg-[#FF385C]/10 text-[#FF385C] px-1.5 py-0.5 rounded-full font-bold">{count}</span>
                                                    ) : null;
                                                })()}
                                            </p>
                                            <div className="flex flex-wrap gap-1.5">
                                                {uniqueOpts.map(opt => {
                                                    const active = section.isMulti
                                                        ? (section.current as string[])?.includes(opt)
                                                        : section.current === opt;
                                                    return (
                                                        <button key={opt} onClick={() => {
                                                            if (section.isMulti) {
                                                                const next = active
                                                                    ? (section.current as string[]).filter(s => s !== opt)
                                                                    : [...(section.current as string[]), opt];
                                                                (section.onSelect as (label: string, selections: string[]) => void)('', next);
                                                            } else {
                                                                (section.onSelect as (label: string, selections: string[] | undefined) => void)('', active ? [] : [opt]);
                                                            }
                                                        }}
                                                            className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold transition-all active:scale-90 ${
                                                                active
                                                                    ? 'bg-[#FF385C] text-white shadow-sm ring-2 ring-[#FF385C]/30'
                                                                    : 'bg-gray-100 text-gray-600 border border-gray-200 hover:bg-gray-200'
                                                            }`}
                                                        >
                                                            {active && <CheckCheck size={10} className="shrink-0" />}
                                                            <DishImage name={opt} slot={slot} size="xs" />
                                                            {opt}
                                                        </button>
                                                    );
                                                })}
                                            </div>
                                        </div>
                                    );})}
                                </div>
                            ) : (
                                <p className="text-sm text-gray-400">No customization options for this dish.</p>
                            )}

                            {/* Summary of selected customizations */}
                            {(() => {
                                const items: string[] = [];
                                if (localGravy) items.push(`${componentMeta?.cookingStyleLabel || 'Gravy'}: ${localGravy}`);
                                if (localRoti) items.push(`Bread: ${localRoti}`);
                                if (localRice) items.push(`Rice: ${localRice}`);
                                if (effectiveSides?.length) items.push(`Sides: ${effectiveSides.join(', ')}`);
                                if (localBevs?.length) items.push(`Bev: ${localBevs.join(', ')}`);
                                if (localDessert?.length) items.push(`Dessert: ${localDessert.join(', ')}`);
                                if (items.length === 0) return null;
                                return (
                                    <div className="mt-4 p-3 rounded-2xl bg-gradient-to-r from-[#FF385C]/5 to-amber-50 border border-[#FF385C]/10">
                                        <p className="text-[8px] font-black uppercase tracking-widest text-[#FF385C] mb-1">Your Customization</p>
                                        <p className="text-[11px] font-bold text-gray-700 leading-relaxed">{items.join('  •  ')}</p>
                                    </div>
                                );
                            })()}
                        </>
                    ) : swapStage === 'dish-picker' ? (
                        /* ─── DISH PICKER ─── */
                        <>
                            <button onClick={backToOverview}
                                className="flex items-center gap-1 text-xs text-[#FF385C] font-bold mb-3"
                            >
                                <ChevronRight size={12} className="rotate-180" /> ← Back
                            </button>
                            <div className="flex items-center justify-between mb-3">
                                <p className="text-[9px] font-black uppercase tracking-widest text-gray-400 flex items-center gap-1">
                                    <Sparkles size={9} />
                                    {swapDishes.length} dishes for {slot}
                                </p>
                                {!showAllRegions && (
                                    <button onClick={() => setShowAllRegions(true)}
                                        className="text-[9px] font-bold text-[#FF385C] px-2 py-1 rounded-full bg-[#FF385C]/10"
                                    >All regions</button>
                                )}
                            </div>
                            {swapDishes.length === 0 ? (
                                <p className="text-sm text-gray-400">No alternatives found for this slot.</p>
                            ) : (
                                <div className="flex gap-3 overflow-x-auto pb-3 -mx-5 px-5 snap-x snap-mandatory">
                                    {swapDishes.map(dish => (
                                        <button key={dish.id} onClick={() => handleSelectDish(dish)}
                                            className="snap-start flex-shrink-0 w-32 p-3 rounded-2xl bg-[#FF385C]/5 hover:bg-[#FF385C]/10 border border-[#FF385C]/15 transition-all active:scale-95 text-center"
                                        >
                                            <div className="flex justify-center mb-1">
                                                <DishImage name={dish.name} slot={slot} size="md" />
                                            </div>
                                            <span className="text-xs font-bold text-gray-800 block leading-tight">{dish.name}</span>
                                            <span className="text-[8px] text-gray-400 font-bold mt-0.5 block capitalize">{dish.region} India</span>
                                            {!showAllRegions && dish.region.toLowerCase().includes(regionKey) && (
                                                <span className="text-[7px] font-black uppercase tracking-widest bg-[#FF385C] text-white px-1.5 py-0.5 rounded mt-1 inline-block">Local</span>
                                            )}
                                        </button>
                                    ))}
                                </div>
                            )}
                        </>
                    ) : (
                        /* ─── VARIANT PICKER ─── */
                        <>
                            <button onClick={backToOverview}
                                className="flex items-center gap-1 text-xs text-[#FF385C] font-bold mb-3"
                            >
                                <ChevronRight size={12} className="rotate-180" /> ← Back
                            </button>
                            <div className="space-y-2">
                                {swapVariants.length === 0 ? (
                                    <p className="text-sm text-gray-400">Hmm, that's the only one like it. Keep it.</p>
                                ) : (
                                    swapVariants.map(variant => (
                                        <button key={variant.id} onClick={() => handleSwapSelect(variant, swapSelectedDish!)}
                                            className="w-full flex items-center gap-4 p-3.5 rounded-2xl bg-[#FF385C]/5 hover:bg-[#FF385C]/10 border border-[#FF385C]/15 transition-all active:scale-[0.98]"
                                        >
                                            <DishImage name={swapSelectedDish!.name} slot={slot} size="sm" />
                                            <div className="flex-1 text-left">
                                                <span className="font-bold text-sm text-gray-800 block">{variant.name}</span>
                                                {variant.addOn && <span className="text-[10px] text-gray-400 font-bold">{variant.addOn}</span>}
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
                    {hasSwap && onRevertSwap && !(isLocked || isMissed) && (
                        <button
                            onClick={() => onRevertSwap(slot)}
                            className="w-8 h-8 rounded-xl bg-white border border-gray-200 flex items-center justify-center text-gray-500 hover:bg-gray-100 hover:shadow-md transition-all active:scale-90"
                            title="Revert to tray default"
                        >
                            <X size={14} />
                        </button>
                    )}
                    {onRemove && !(isLocked || isMissed) && !hasSwap && (
                        <button
                            onClick={() => onRemove(slot)}
                            className="w-8 h-8 rounded-xl bg-red-50 border border-red-100 flex items-center justify-center text-red-400 hover:bg-red-100 transition-all active:scale-90"
                            title="Remove from tray"
                        >
                            <X size={14} />
                        </button>
                    )}
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

            {/* Meal Card Body — Airbnb/Netflix style: big visual + name */}
            {meal ? (
                <button
                    onClick={() => openTileSwap('dish')}
                    className="w-full mt-4 rounded-2xl bg-white overflow-hidden active:scale-[0.98] transition-all text-left"
                >
                    <div className="flex flex-col items-center py-6 px-4">
                        <div className="rounded-2xl mb-3 shadow-sm overflow-hidden">
                            <DishImage name={meal.name} slot={slot} size="xl" />
                        </div>
                        <h3 className="font-bold text-lg text-gray-900 text-center leading-tight">
                            {buildTitle(meal.categorySelections?.gravy?.name, meal.categorySelections?.roti?.name, meal.categorySelections?.rice?.name)}
                        </h3>
                        {addOnSides.length > 0 && (
                            <span className="text-xs text-gray-500 mt-1 font-medium">
                                + {addOnSides.join(', ')}
                            </span>
                        )}
                        {meal.categorySelections && (
                            <div className="flex flex-wrap justify-center gap-1 mt-2">
                                {meal.categorySelections.gravy?.name && (
                                    <span className="text-[9px] font-bold bg-amber-50 text-amber-700 px-2 py-0.5 rounded-full border border-amber-100">
                                        {meal.categorySelections.gravy.name}
                                    </span>
                                )}
                                {meal.categorySelections.roti?.name && (
                                    <span className="text-[9px] font-bold bg-orange-50 text-orange-700 px-2 py-0.5 rounded-full border border-orange-100">
                                        {meal.categorySelections.roti.name}
                                    </span>
                                )}
                                {meal.categorySelections.rice?.name && (
                                    <span className="text-[9px] font-bold bg-blue-50 text-blue-700 px-2 py-0.5 rounded-full border border-blue-100">
                                        {meal.categorySelections.rice.name}
                                    </span>
                                )}
                                {(meal.categorySelections.dessert || []).map(d => (
                                    <span key={d.name} className="text-[9px] font-bold bg-pink-50 text-pink-700 px-2 py-0.5 rounded-full border border-pink-100">
                                        {d.name}
                                    </span>
                                ))}
                            </div>
                        )}
                        {meal.quantity && meal.quantity > 1 && (
                            <div className="flex items-center gap-2 mt-2">
                                <div
                                    onClick={e => { e.stopPropagation(); onUpdateQuantity(slot, -1); }}
                                    role="button" tabIndex={-1}
                                    className="w-7 h-7 rounded-lg bg-gray-100 flex items-center justify-center text-gray-500 active:scale-90 cursor-pointer"
                                >
                                    <Minus size={12} />
                                </div>
                                <span className="text-sm font-bold text-gray-800">x{meal.quantity}</span>
                                <div
                                    onClick={e => { e.stopPropagation(); onUpdateQuantity(slot, 1); }}
                                    role="button" tabIndex={-1}
                                    className="w-7 h-7 rounded-lg bg-gray-100 flex items-center justify-center text-gray-500 active:scale-90 cursor-pointer"
                                >
                                    <Plus size={12} />
                                </div>
                            </div>
                        )}
                    </div>
                </button>
            ) : (
                <button
                    onClick={() => openTileSwap('dish')}
                    className="w-full mt-4 rounded-2xl bg-white/60 border-2 border-dashed border-gray-200 active:scale-[0.98] transition-all text-left"
                >
                    <div className="flex flex-col items-center py-8 px-4">
                        <span className="text-5xl mb-3 opacity-40">🍽️</span>
                        <p className="text-gray-400 font-bold text-sm">Nothing here yet — tap to add</p>
                    </div>
                </button>
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
