import React, { useMemo, useState } from 'react';
import { useStore, MealOption, getMealResolution, isSlotLocked, isSlotMissed } from '../../store/useStore';
import {
    Phone, MapPin, Flame, ChevronRight, Info, X, ChefHat, ArrowLeftRight, Lock, Minus, Plus,
    Sparkles, BellRing, ShieldAlert, Clock3, CheckCircle2,
} from 'lucide-react';

import { formatMealLabel, getShareStrings, ShareLanguage } from '../../utils/share';
import WhatsAppShareModal from './WhatsAppShareModal';
import { useBackendDishes } from '../../hooks/useBackendDishes';
import type { Dish, DishVariant } from '../../constants/dishLibrary';

type Tab = 'dashboard' | 'plan' | 'pulse' | 'profile';

const SLOT_META: Record<string, { icon: string; time: string; color: string; bg: string }> = {
    Breakfast: { icon: '🌅', time: '8:00 AM', color: 'border-amber-100', bg: 'bg-amber-50' },
    Lunch: { icon: '☀️', time: '1:00 PM', color: 'border-blue-100', bg: 'bg-blue-50' },
    Snacks: { icon: '🥜', time: '4:00 PM', color: 'border-orange-100', bg: 'bg-orange-50' },
    Dinner: { icon: '🌙', time: '8:00 PM', color: 'border-violet-100', bg: 'bg-violet-50' },
};

const getDisplayDate = () => {
    const now = new Date();
    return now.toLocaleDateString('en-CA'); // YYYY-MM-DD in local time — matches swaps keys
};

// Check if we're in early morning (before first slot starts at 8AM)
// Show friendly greeting, but use slot-wise locked/missed logic
const isEarlyMorning = () => {
    const hour = new Date().getHours();
    return hour < 8;
};

interface ComponentOption {
    id: string;
    name: string;
    type: 'main' | 'accompaniment';
    current: boolean;
}

interface SwapOption {
    dishId: string;
    dishName: string;
    dishIcon: string;
    dishRegion: string;
    variantId: string;
    variantName: string;
    isRegional: boolean;
}

const Dashboard: React.FC<{ onNavigate?: (tab: Tab) => void }> = ({ onNavigate }) => {
    const { user, trayLibrary, swaps, setSwap, updateMealQuantity: updateQtyInStore, notifications, clearNotification, syncPlanToDB, syncCompleteToDB } = useStore();
    const { dishes } = useBackendDishes();
    const [showGuide, setShowGuide] = useState(true);
    const [swapPopover, setSwapPopover] = useState<{ slot: string } | null>(null);
    const [activeComponent, setActiveComponent] = useState<string | null>(null);
    const [actionMessage, setActionMessage] = useState<string | null>(null);
    const [shareType, setShareType] = useState<'prep' | 'pantry' | null>(null);

    if (!user) return null;

    const spiceLabel = user.spiceLevel === 'mild' ? 'Mild 🌿' : user.spiceLevel === 'hot' ? 'Hot 🔥' : 'Medium 🌶️';

    const TODAY_DATE = getDisplayDate(); // Dynamic on each render

    const todayMeals = useMemo(() => ({
        Breakfast: getMealResolution(trayLibrary, swaps, TODAY_DATE!, 'Breakfast', dishes),
        Lunch: getMealResolution(trayLibrary, swaps, TODAY_DATE!, 'Lunch', dishes),
        Snacks: getMealResolution(trayLibrary, swaps, TODAY_DATE!, 'Snacks', dishes),
        Dinner: getMealResolution(trayLibrary, swaps, TODAY_DATE!, 'Dinner', dishes),
    }), [trayLibrary, swaps, dishes, TODAY_DATE]);

    const regionKey = (user.region ?? 'India').toLowerCase().replace(' india', '');

    const getComponentsForMeal = (slot: string): ComponentOption[] => {
        const meal = todayMeals[slot as keyof typeof todayMeals].meal;
        if (!meal) return [];

        const dish = dishes.find(d => d.id === meal.dishId);
        if (!dish) return [];

        const components: ComponentOption[] = [];

        // Main dish component
        components.push({
            id: 'main',
            name: meal.variant || dish.name,
            type: 'main',
            current: true,
        });

        // Accompaniment components
        const variant = dish.variants.find(v => v.id === meal.variantId);
        if (variant?.accompaniments) {
            variant.accompaniments.forEach((acc, idx) => {
                components.push({
                    id: `acc-${idx}`,
                    name: acc,
                    type: 'accompaniment',
                    current: true,
                });
            });
        }

        return components;
    };

    const getSwapVariants = (slot: string, componentId?: string | null): SwapOption[] => {
        const category = slot.toLowerCase() as 'breakfast' | 'lunch' | 'dinner';
        const current = todayMeals[slot as keyof typeof todayMeals].meal;
        const currentDish = dishes.find(d => d.id === current?.dishId);

        const options: SwapOption[] = [];

        for (const dish of dishes) {
            if (!dish.category.includes(category)) continue;
            if (dish.id === current?.dishId && !componentId) continue;

            const isRegional = dish.region === regionKey;

            for (const variant of dish.variants) {
                // Skip current variant
                if (variant.id === current?.variantId && !componentId) continue;

                // For accompaniments, filter by mealContext match
                if (componentId === 'main' || !componentId) {
                    // Show all variants for main swap
                    if (variant.mealContext === category || !variant.mealContext) {
                        options.push({
                            dishId: dish.id,
                            dishName: dish.name,
                            dishIcon: dish.icon,
                            dishRegion: dish.region,
                            variantId: variant.id,
                            variantName: variant.name,
                            isRegional,
                        });
                    }
                } else if (componentId?.startsWith('acc-')) {
                    // For accompaniment swap, show variants that have matching accompaniments
                    if (variant.accompaniments && variant.mealContext === category) {
                        options.push({
                            dishId: dish.id,
                            dishName: dish.name,
                            dishIcon: dish.icon,
                            dishRegion: dish.region,
                            variantId: variant.id,
                            variantName: variant.name,
                            isRegional,
                        });
                    }
                }
            }
        }

        // Sort: regional first, then all
        return options.sort((a, b) => {
            if (a.isRegional && !b.isRegional) return -1;
            if (!a.isRegional && b.isRegional) return 1;
            return a.dishName.localeCompare(b.dishName);
        });
    };

    const applySwap = (slot: string, meal: MealOption) => {
        setSwap(TODAY_DATE!, slot, meal);
        syncPlanToDB(TODAY_DATE!, slot, meal);
        window.dispatchEvent(new CustomEvent('pantry:invalidate'));
        setActionMessage('Swap done. Cook knows.');
        setSwapPopover(null);
        setActiveComponent(null);
    };

    const handleSwapWithComponent = (slot: string, option: SwapOption) => {
        const variant = dishes.find(d => d.id === option.dishId)?.variants.find(v => v.id === option.variantId);
        const newMeal: MealOption = {
            id: `${option.variantId}-${Date.now()}`,
            dishId: option.dishId,
            name: option.dishName,
            icon: option.dishIcon,
            variant: option.variantName,
            variantId: option.variantId,
            addOn: variant?.addOn,
            mealContext: slot.toLowerCase(),
            quantity: 1,
            countBased: false,
        };
        applySwap(slot, newMeal);
    };

    const updateMealQuantity = (slot: string, delta: number) => {
        if (isSlotLocked(TODAY_DATE!, slot)) return;
        const meal = todayMeals[slot as keyof typeof todayMeals].meal;
        if (!meal) return;
        const nextQuantity = Math.min(6, Math.max(1, (meal.quantity || 1) + delta));
        updateQtyInStore(TODAY_DATE!, slot, delta);
        syncPlanToDB(TODAY_DATE!, slot, { ...meal, quantity: nextQuantity });
        window.dispatchEvent(new CustomEvent('pantry:invalidate'));
        setActionMessage(`${slot} quantity updated to ${nextQuantity}.`);
    };

    const buildPrepMessage = (lang: ShareLanguage) => {
        const copy = getShareStrings(lang);
        const date = new Date().toLocaleDateString('en-IN', { weekday: 'long', day: 'numeric', month: 'short' });
        const lines = Object.entries(todayMeals)
            .map(([slot, resolution]: [string, any]) => `• ${slot}: ${formatMealLabel(resolution.meal)}`)
            .join('\n');
        return `🍱 *${copy.dailyTitle}*\n\n${date}\n${copy.todayPlan}:\n${lines}\n\n${copy.region}: ${user.region} | ${copy.spice}: ${spiceLabel}`;
    };

    const buildPantryMessage = (lang: ShareLanguage) => {
        const copy = getShareStrings(lang);
        const lines = Object.values(todayMeals)
            .map((item: any) => item.meal)
            .filter(Boolean)
            .map((meal: any) => formatMealLabel(meal));
        return `🛒 *${copy.pantryTitle}*\n\n${copy.pantryFor}:\n${lines.map((name: string) => `• ${name}`).join('\n')}\n\n${copy.sentFrom}`;
    };

  // Meal Loop: render per-slot meals
  return (
        <div className="pb-28 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <WhatsAppShareModal
                isOpen={shareType !== null}
                defaultPhone={user.cookContact}
                title={shareType === 'prep' ? 'Daily meal plan' : 'Pantry summary'}
                onClose={() => setShareType(null)}
                previewBuilder={(language) => shareType === 'prep' ? buildPrepMessage(language) : buildPantryMessage(language)}
            />
            <header className="flex justify-between items-end px-6 pt-14 pb-2">
                <div>
                    <div className="flex items-center gap-1.5 text-gray-400 text-[10px] font-black uppercase tracking-widest mb-1">
                        <MapPin size={11} className="text-[#FF385C]" />
                        <span>{user.region}</span>
                    </div>
                    <h2 className="text-[1.7rem] font-extrabold tracking-tight">
                        {isEarlyMorning() ? 'Up before the cook? 👀' : "What's Cooking?"}
                    </h2>
                </div>
                <div className="flex items-center gap-2">
                    <span className="text-xs font-bold bg-orange-50 text-orange-500 border border-orange-100 px-3 py-1.5 rounded-full flex items-center gap-1">
                        <Flame size={11} fill="currentColor" />
                        {spiceLabel}
                    </span>
                    <button
                        onClick={() => onNavigate?.('profile')}
                        className="w-10 h-10 rounded-2xl bg-white shadow border border-gray-100 flex items-center justify-center text-gray-400 active:scale-95 transition-all"
                    >
                        <ChefHat size={18} />
                    </button>
                </div>
            </header>

            {showGuide && (
                <div className="mx-6 mt-4 p-4 bg-[#FF385C]/5 border border-[#FF385C]/15 rounded-[20px] flex items-start gap-3">
                    <Info size={16} className="text-[#FF385C] mt-0.5 flex-shrink-0" />
                    <div className="flex-1">
                        <p className="text-xs font-bold text-gray-800 mb-1">2-Tap Swap™ 101</p>
                        <p className="text-[11px] text-gray-500 leading-relaxed">
                            Tap any dish or side → browse regional swaps. 2 taps. That's it.
                        </p>
                    </div>
                    <button onClick={() => setShowGuide(false)}><X size={14} className="text-gray-400" /></button>
                </div>
            )}

            {actionMessage && (
                <div className="mx-6 mt-4 p-4 rounded-[20px] bg-emerald-50 border border-emerald-100 flex items-start gap-3">
                    <CheckCircle2 size={16} className="text-emerald-600 mt-0.5 flex-shrink-0" />
                    <div className="flex-1">
                        <p className="text-sm font-bold text-emerald-900">Swap done. Cook's got this.</p>
                        <p className="text-xs text-emerald-700 mt-1">Tray updated, pantry updated.</p>
                    </div>
                    <button onClick={() => setActionMessage(null)}><X size={14} className="text-emerald-500" /></button>
                </div>
            )}

            {notifications[0] && (
                <div className="mx-6 mt-4 p-4 rounded-[20px] bg-sky-50 border border-sky-100 flex items-start gap-3">
                    <BellRing size={16} className="text-sky-600 mt-0.5 flex-shrink-0" />
                    <div className="flex-1">
                        <p className="text-sm font-bold text-sky-900">Cook notification</p>
                <p className="text-xs text-sky-700 mt-1">{notifications[0]?.message}</p>
                     </div>
                     <button onClick={() => notifications[0]?.id && clearNotification(notifications[0].id)}><X size={14} className="text-sky-500" /></button>
                </div>
            )}

            <section className="px-6 mt-5">
                <div className="bg-gray-50 p-4 rounded-[24px] border border-gray-100 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <div className="w-9 h-9 bg-green-500 rounded-full flex items-center justify-center shadow-md shadow-green-500/20">
                            <Phone size={16} fill="white" className="text-white" />
                        </div>
                        <div>
                            <p className="text-[9px] font-black uppercase tracking-widest text-gray-400">Cook</p>
                            <p className="text-sm font-bold">{user.cookContact || '— Drop a number'}</p>
                        </div>
                    </div>
                    <div className="flex gap-2">
                        <button
                            onClick={() => { if (!user.cookContact) { alert("Add cook's number in Profile first."); return; } setShareType('prep'); }}
                            className="bg-white px-4 py-2.5 rounded-2xl text-[10px] font-black uppercase tracking-widest text-[#FF385C] shadow-sm border border-gray-100 active:scale-95 transition-all"
                        >
                            Share with Cook
                        </button>

                    </div>
                </div>
            </section>

    <div className="space-y-4 px-6 mt-6 relative">
                {(['Breakfast', 'Lunch', 'Snacks', 'Dinner'] as const).map(slot => {
                    const resolution = todayMeals[slot];
                    const meal = resolution?.meal;
                    const meta = SLOT_META[slot];
                    const hasSwap = !!swaps[TODAY_DATE!]?.[slot];
                    const components = getComponentsForMeal(slot);
                    const swapVariants = getSwapVariants(slot, activeComponent);
                    
                    // Lock & Missed checks - slot-wise (no more global grace period)
                    const locked = isSlotLocked(TODAY_DATE!, slot);
                    const missed = isSlotMissed(TODAY_DATE!, slot);

                    return (
                        <div key={slot} className={`p-5 rounded-[28px] border-2 ${meta!.color} ${meta!.bg} transition-all relative ${locked || missed ? 'grayscale opacity-60' : ''}`}>
                            {/* Missed slot overlay */}
                            {missed && !locked && (
                                <div className="absolute top-2 right-2 z-10 flex items-center gap-1 bg-amber-100 px-2 py-1 rounded-full">
                                    <span className="text-[10px] font-bold text-amber-700 uppercase">⚠️ Missed</span>
                                </div>
                            )}
                            {/* Locked slot overlay */}
                            {locked && (
                                <div className="absolute inset-0 z-20 rounded-[28px] bg-gray-900/50 flex flex-col items-center justify-center pointer-events-none">
                                    <div className="bg-gray-800 px-3 py-1.5 rounded-full flex items-center gap-1.5">
                                        <span className="text-sm">⏰</span>
                                        <span className="text-[10px] font-bold text-gray-300 uppercase tracking-widest">Too late!</span>
                                    </div>
                                    <span className="text-[10px] text-gray-400 mt-2">Catch it next time</span>
                                </div>
                            )}
                            {swapPopover?.slot === slot && !locked && (
                                <div className="absolute inset-0 z-30 rounded-[28px] bg-white border-2 border-[#FF385C] p-5 shadow-2xl shadow-[#FF385C]/10 animate-in fade-in zoom-in-95 duration-200 overflow-y-auto max-h-[500px]">
                                        <div className="flex items-center justify-between mb-4">
                                            <div>
                                                <p className="text-[9px] font-black uppercase tracking-widest text-[#FF385C]">2-Tap Swap</p>
                                                <p className="font-bold text-gray-900 text-base">Mix it up — {slot}</p>
                                            </div>
                                        <button
                                            onClick={() => { setSwapPopover(null); setActiveComponent(null); }}
                                            className="w-8 h-8 rounded-xl bg-gray-100 flex items-center justify-center"
                                        >
                                            <X size={14} className="text-gray-500" />
                                        </button>
                                    </div>

                                    {activeComponent ? (
                                        <>
                                            <button
                                                onClick={() => setActiveComponent(null)}
                                                className="flex items-center gap-1 text-xs text-[#FF385C] font-bold mb-3"
                                            >
                                                <ChevronRight size={12} className="rotate-180" />
                                                ← See all parts
                                            </button>
                                            <p className="text-[9px] font-black uppercase tracking-widest text-gray-400 mb-2 flex items-center gap-1">
                                                <Sparkles size={9} />
                                                Pick replacement for "{activeComponent === 'main' ? components[0]?.name : components.find(c => c.id === activeComponent)?.name}"
                                            </p>
                                            <div className="space-y-2">
                                                {swapVariants.length === 0 && (
                                                    <p className="text-sm text-gray-400">Hmm, that's the only one like it. Keep it.</p>
                                                )}
                                                {swapVariants.slice(0, 12).map(opt => (
                                                    <button
                                                        key={`${opt.dishId}-${opt.variantId}`}
                                                        onClick={() => handleSwapWithComponent(slot, opt)}
                                                        className="w-full flex items-center gap-4 p-3.5 rounded-2xl bg-[#FF385C]/5 hover:bg-[#FF385C]/10 border border-[#FF385C]/15 transition-all active:scale-[0.98]"
                                                    >
                                                        <span className="text-2xl">{opt.dishIcon}</span>
                                                        <div className="flex-1 text-left">
                                                            <span className="font-bold text-sm text-gray-800 block">{opt.variantName}</span>
                                                            <span className="text-[10px] text-gray-400 font-bold">{opt.isRegional ? `${(opt.dishRegion || '').charAt(0).toUpperCase()}${(opt.dishRegion || '').slice(1)} India` : 'Other'}</span>
                                                         </div>
                                                         <ArrowLeftRight size={14} className="text-[#FF385C] opacity-60" />
                                                     </button>
                                                 ))}
                                             </div>
                                         </>
                                     ) : (
                                         <>
                                             {meal ? (
                                                 <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-2xl border border-gray-100 mb-3">
                                                     <span className="text-2xl">{meal.icon || '🍽️'}</span>
                                                     <div>
                                                         <p className="text-[9px] font-black uppercase tracking-widest text-gray-400">Current</p>
                                                         <p className="font-bold text-sm">{meal.variant || meal.name}</p>
                                                     </div>
                                                 </div>
                                             ) : (
                                                 <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-2xl border border-gray-100 mb-3">
                                                     <span className="text-2xl">🍽️</span>
                                                     <div>
                                                         <p className="text-[9px] font-black uppercase tracking-widest text-gray-400">Current</p>
                                                         <p className="font-bold text-sm">Nothing here yet</p>
                                                     </div>
                                                 </div>
                                             )}

                                             {components.length > 0 ? (
                                                 <>
                                                     <p className="text-[9px] font-black uppercase tracking-widest text-gray-400 mb-2 flex items-center gap-1">
                                                         <Sparkles size={9} />
                                                         Tap a component to swap
                                                     </p>
                                                     <div className="flex flex-wrap gap-2">
                                                         {components.map(comp => (
                                                             <button
                                                                 key={comp.id}
                                                                 onClick={() => setActiveComponent(comp.id)}
                                                                 className="px-4 py-2 rounded-full text-xs font-bold bg-[#FF385C] text-white shadow-lg shadow-[#FF385C]/20 active:scale-95 transition-all"
                                                             >
                                                                 {comp.name}
                                                             </button>
                                                         ))}
                                                     </div>
                                                 </>
                                             ) : (
                                                 <>
                                                     <p className="text-[9px] font-black uppercase tracking-widest text-gray-400 mb-2 flex items-center gap-1">
                                                         <Sparkles size={9} />
                                                         Pick any {slot} dish to get started
                                                     </p>
                                                     <div className="space-y-2">
                                                         {getSwapVariants(slot, null).slice(0, 8).map(opt => (
                                                             <button
                                                                 key={`${opt.dishId}-${opt.variantId}`}
                                                                 onClick={() => handleSwapWithComponent(slot, opt)}
                                                                 className="w-full flex items-center gap-4 p-3.5 rounded-2xl bg-[#FF385C]/5 hover:bg-[#FF385C]/10 border border-[#FF385C]/15 transition-all active:scale-[0.98]"
                                                             >
                                                                 <span className="text-2xl">{opt.dishIcon}</span>
                                                                 <div className="flex-1 text-left">
                                                                     <span className="font-bold text-sm text-gray-800 block">{opt.variantName}</span>
                                                            <span className="text-[10px] text-gray-400 font-bold">{opt.isRegional ? `${(opt.dishRegion || '').charAt(0).toUpperCase()}${(opt.dishRegion || '').slice(1)} India` : 'Other'}</span>
                                                                </div>
                                                                <Plus size={14} className="text-[#FF385C]" />
                                                            </button>
                                                        ))}
                                                    </div>
                                                </>
                                            )}
                                        </>
                                    )}
                                </div>
                            )}

                            <div className="flex items-center justify-between mb-4">
                                <div className="flex items-center gap-2">
                                    <span className="text-lg">{meta!.icon}</span>
                                    <span className="text-[10px] font-black uppercase tracking-widest text-gray-500">{slot}</span>
                                    {hasSwap && (
                                        <span className="text-[8px] bg-[#FF385C] text-white font-black uppercase tracking-widest px-1.5 py-0.5 rounded-md">Swapped</span>
                                    )}
                                </div>
                                <div className="flex items-center gap-1.5">
                                    <span className="text-[10px] text-gray-400 font-bold">{meta!.time}</span>
                                    {!(locked || missed) && (
                                        <button
                                            onClick={() => setSwapPopover(swapPopover?.slot === slot ? null : { slot })}
                                            className="w-8 h-8 rounded-xl bg-white border border-gray-200 flex items-center justify-center text-[#FF385C] hover:shadow-md transition-all active:scale-90"
                                            title="Swap this meal in 2 taps"
                                        >
                                            <ArrowLeftRight size={14} />
                                        </button>
                                    )}
                                    {(locked || missed) && (
                                        <Lock size={14} className="text-gray-400" />
                                    )}
                                </div>
                            </div>

                            {meal ? (
                                <div className="flex items-center gap-4">
                                    <div className="w-16 h-16 bg-white rounded-2xl flex items-center justify-center text-3xl shadow-sm">
                                        {meal.icon || '🍽️'}
                                    </div>
                                    <div className="flex-1">
                                        <h4 className="font-extrabold text-xl text-gray-900 tracking-tight leading-tight">
                                            {meal.variant || meal.name}
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
                                    <p className="text-gray-400 font-bold text-sm">Nothing here yet — tap to fix</p>
                                </div>
                            )}

                            <div className="mt-3 grid gap-2">
                                {meal?.countBased && !(locked || missed) && (
                                    <div className="flex items-center gap-2">
                                        <button
                                            onClick={() => updateMealQuantity(slot as any, -1)}
                                            className="w-8 h-8 rounded-xl bg-white border border-gray-200 flex items-center justify-center text-gray-500"
                                        >
                                            <Minus size={13} />
                                        </button>
                                        <span className="text-[11px] font-bold text-gray-700">Qty {meal.quantity || 1}</span>
                                        <button
                                            onClick={() => updateMealQuantity(slot as any, 1)}
                                            className="w-8 h-8 rounded-xl bg-white border border-gray-200 flex items-center justify-center text-gray-500"
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
                })}
            </div>

            <div className="px-6 mt-6 grid grid-cols-2 gap-3">
                <button
                    onClick={() => onNavigate?.('plan')}
                    className="p-5 rounded-[24px] bg-gray-900 text-white flex items-center justify-between active:scale-95 transition-all"
                >
                    <div>
                        <p className="text-[9px] font-black uppercase tracking-widest opacity-50 mb-1">Weekly</p>
                        <p className="text-sm font-bold">Let's Cook →</p>
                    </div>
                    <ChevronRight size={18} className="opacity-50" />
                </button>
                <button
                    onClick={() => onNavigate?.('pulse')}
                    className="p-5 rounded-[24px] bg-[#FF385C] text-white flex items-center justify-between active:scale-95 transition-all shadow-xl shadow-[#FF385C]/20"
                >
                    <div>
                        <p className="text-[9px] font-black uppercase tracking-widest opacity-70 mb-1">Pantry</p>
                        <p className="text-sm font-bold">What's Needed →</p>
                    </div>
                    <ChevronRight size={18} className="opacity-70" />
                </button>
            </div>
        </div>
    );
};

export default React.memo(Dashboard);
