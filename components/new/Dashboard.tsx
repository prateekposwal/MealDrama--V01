import React, { useMemo, useState } from 'react';
import { useStore, MealOption, getMealResolution, isSlotLocked, isSlotMissed } from '../../store/useStore';
import {
    Phone, MapPin, Flame, ChevronRight, Info, X, ChefHat,
    BellRing, ShieldAlert, Clock3, CheckCircle2,
} from 'lucide-react';

import { formatMealLabel, getShareStrings, ShareLanguage } from '../../utils/share';
import WhatsAppShareModal from './WhatsAppShareModal';
import { MealCard, SLOT_META } from './MealCard';
import { useBackendDishes } from '../../hooks/useBackendDishes';

type Tab = 'dashboard' | 'plan' | 'pulse' | 'profile';

const getDisplayDate = () => {
    const now = new Date();
    return now.toLocaleDateString('en-CA');
};

const isEarlyMorning = () => {
    const hour = new Date().getHours();
    return hour < 8;
};

const Dashboard: React.FC<{ onNavigate?: (tab: Tab) => void }> = ({ onNavigate }) => {
    const { user, trayLibrary, swaps, setSwap, updateMealQuantity: updateQtyInStore, notifications, clearNotification, syncPlanToDB } = useStore();
    const { dishes } = useBackendDishes();
    const [showGuide, setShowGuide] = useState(true);
    const [swapSlot, setSwapSlot] = useState<string | null>(null);
    const [actionMessage, setActionMessage] = useState<string | null>(null);
    const [shareType, setShareType] = useState<'prep' | 'pantry' | null>(null);

    if (!user) return null;

    const spiceLabel = user.spiceLevel === 'mild' ? 'Mild 🌿' : user.spiceLevel === 'hot' ? 'Hot 🔥' : 'Medium 🌶️';
    const TODAY_DATE = getDisplayDate();
    const regionKey = (user.region ?? 'India').toLowerCase().replace(' india', '');

    // Dashboard manages: todayMeals via getMealResolution()
    const todayMeals = useMemo(() => ({
        Breakfast: getMealResolution(trayLibrary, swaps, TODAY_DATE!, 'Breakfast', dishes),
        Lunch: getMealResolution(trayLibrary, swaps, TODAY_DATE!, 'Lunch', dishes),
        Snacks: getMealResolution(trayLibrary, swaps, TODAY_DATE!, 'Snacks', dishes),
        Dinner: getMealResolution(trayLibrary, swaps, TODAY_DATE!, 'Dinner', dishes),
    }), [trayLibrary, swaps, dishes, TODAY_DATE]);

    const applySwap = (_date: string | undefined, slot: string, meal: MealOption) => {
        setSwap(TODAY_DATE!, slot, meal);
        syncPlanToDB(TODAY_DATE!, slot, meal);
        window.dispatchEvent(new CustomEvent('pantry:invalidate'));
        setActionMessage('Swap done. Cook knows.');
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
            .map(([slot, resolution]) => `• ${slot}: ${formatMealLabel(resolution.meal)}`)
            .join('\n');
        return `🍱 *${copy.dailyTitle}*\n\n${date}\n${copy.todayPlan}:\n${lines}\n\n${copy.region}: ${user.region} | ${copy.spice}: ${spiceLabel}`;
    };

    const buildPantryMessage = (lang: ShareLanguage) => {
        const copy = getShareStrings(lang);
        const lines = Object.values(todayMeals)
            .map((item) => item.meal)
            .filter(Boolean)
            .map((meal) => formatMealLabel(meal));
        return `🛒 *${copy.pantryTitle}*\n\n${copy.pantryFor}:\n${lines.map((name: string) => `• ${name}`).join('\n')}\n\n${copy.sentFrom}`;
    };

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
                            Tap swap → pick a dish → pick a style. Done.
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

            {/* Meal Loop: Dashboard manages swapSlot, MealCard manages swap popover */}
            <div className="space-y-4 px-6 mt-6 relative">
                {(['Breakfast', 'Lunch', 'Snacks', 'Dinner'] as const).map(slot => {
                    const resolution = todayMeals[slot];
                    const meta = SLOT_META[slot];
                    const hasSwap = !!swaps[TODAY_DATE!]?.[slot];
                    const locked = isSlotLocked(TODAY_DATE!, slot);
                    const missed = isSlotMissed(TODAY_DATE!, slot);

                    return (
                        <MealCard
                            key={slot}
                            slot={slot}
                            date={TODAY_DATE}
                            meta={meta!}
                            resolution={resolution}
                            dishes={dishes}
                            userRegion={user.region ?? 'India'}
                            userDiet={user.diet ?? 'veg'}
                            swapPopoverSlot={swapSlot}
                            setSwapPopoverSlot={setSwapSlot}
                            onSwap={applySwap}
                            onUpdateQuantity={updateMealQuantity}
                            isLocked={locked}
                            isMissed={missed}
                            hasSwap={hasSwap}
                        />
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
