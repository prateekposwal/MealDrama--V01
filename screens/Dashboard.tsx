// ─────────────────────────────────────────────────────────────────────────────
// Dashboard — Today's meals (read-only + edit link)
// Empty slots show QuickAddRow
// ─────────────────────────────────────────────────────────────────────────────

import React, { useState, useMemo, useCallback, useEffect, useRef } from 'react';
import { useTrayStore, MealType, TrayItem } from '../store/useTrayStore';
import type { Meal } from '../types/tray';
import type { SuggestionMeal } from '../lib/trayApi';
import QuickAddModal from '../components/new/QuickAddModal';
import TrayScreen from '../components/new/TrayScreen';
import WhatsAppShareModal from '../components/new/WhatsAppShareModal';

import { useBackendDishes } from '../hooks/useBackendDishes';
import { MapPin, Flame, ChevronRight, Plus, X, Info, CheckCircle2, Heart, Phone, MessageCircle, RefreshCw, ArrowRight } from 'lucide-react';
import type { Dish } from '../constants/dishLibrary';
import { HealthTipsPanel } from '../components/health/HealthTipsPanel';
import { PlateBalanceVisualizer } from '../components/health/PlateBalanceVisualizer';
import { scorePlateBalance } from '../utils/nutritionScore';
import { DISH_HEALTH_MAP, COMPONENT_HEALTH_MAP } from '../constants/healthGuidelines';
import { ServingsBreakdown } from '../components/meal/ServingsBreakdown';
import { SlotBody, SlotMode } from '../components/meal/SlotBody';
import { useSwapCustomize } from '../components/meal/SwapCustomizeModalContext';
import LoopAutoFillSlot from '../components/meal/LoopAutoFillSlot';
import { dishToMeal } from '../utils/dishToMeal';
import { getShareStrings, ShareLanguage } from '../utils/share';
import { resolveNextActiveDate } from '../utils/continuity';
import { computeStyleWarnings, type StyleWarning } from '../constants/dishStyles';
import { resolveSlotTimes } from '../types/tray';

/** Convert SuggestionMeal (API) to Meal (defaults engine) */
function suggestionToMeal(s: SuggestionMeal): Meal {
    return {
        id: s.id,
        name: s.name,
        icon: s.icon,
        region: s.region.toLowerCase().includes('south') ? 'south'
            : s.region.toLowerCase().includes('east') ? 'east'
            : s.region.toLowerCase().includes('west') ? 'west'
            : 'north',
        baseGravy: s.defaultGravy,
        rotiOptions: s.defaultRoti ? [s.defaultRoti] : undefined,
        riceOptions: s.defaultRice ? [s.defaultRice] : undefined,
        suggestedPairings: {
            sides: s.defaultSides,
            beverages: s.defaultBeverages,
        },
    };
}

type Slot = 'Breakfast' | 'Lunch' | 'Snacks' | 'Dinner';

const SLOTS: { key: Slot; mealType: MealType; label: Slot; startHour: number; endHour: number }[] = [
    { key: 'Breakfast', mealType: 'breakfast', label: 'Breakfast', startHour: 6, endHour: 10 },
    { key: 'Lunch', mealType: 'lunch', label: 'Lunch', startHour: 11, endHour: 15 },
    { key: 'Snacks', mealType: 'snacks', label: 'Snacks', startHour: 15, endHour: 18 },
    { key: 'Dinner', mealType: 'dinner', label: 'Dinner', startHour: 19, endHour: 23 },
];

type MealSection = 'active' | 'upcoming' | 'completed';

/** Categorize each slot based on current time — uses per-slot start_time/end_time */
const categorizeSlots = (
    getMeals: (date: string, mealType: MealType) => TrayItem[],
    today: string,
    completions?: Record<string, number>,
    preferences?: Record<string, { start: string; end: string }>,
): { section: MealSection; slot: typeof SLOTS[0] }[] => {
    const now = new Date().getHours() + new Date().getMinutes() / 60;
    const result = SLOTS.map(slot => {
        const meals = getMeals(today, slot.mealType);
        const { startHour, endHour } = resolveSlotTimes(meals, slot.mealType, preferences);
        const key = `${today}::${slot.mealType}`;
        const isUserCompleted = completions?.[key] != null;
        const withinWindow = now >= startHour && now <= endHour;
        let section: MealSection;
        if (isUserCompleted) section = 'completed';
        else if (now > endHour) section = 'completed';
        else if (withinWindow) section = 'active';
        else section = 'upcoming';
        return { section, slot };
    });

    // If no slot is active, transition the first upcoming slot to active
    const hasActive = result.some(r => r.section === 'active');
    if (!hasActive) {
        const firstUpcoming = result.find(r => r.section === 'upcoming');
        if (firstUpcoming) firstUpcoming.section = 'active';
    }

    return result;
};

interface DashboardProps {
    user: any;
    onNavigate?: (tab: string) => void;
    onManageTray?: () => void;
}

const getTodayISO = (d?: Date) => (d || new Date()).toLocaleDateString('en-CA');

export const Dashboard: React.FC<DashboardProps> = ({ user, onNavigate, onManageTray }) => {
    const { dishes } = useBackendDishes();
    const today = getTodayISO();

    const {
        plan, getMeals, addMealToSlot, swapMealInSlot, updateItemInline, removeMealFromSlot,
        guestMode, completions, completeSlot, undoCompleteSlot,
    } = useTrayStore();

    const [swapOpenKey, setSwapOpenKey] = useState<string | null>(null);
    const { openKey: swapCustomizeOpenKey, setOpenKey: setSwapCustomizeOpenKey } = useSwapCustomize();

    const stableSwapOpen = useCallback((id: string) => {
        setSwapOpenKey(prev => prev === id ? null : id);
    }, []);
    const stableSwapClose = useCallback(() => setSwapOpenKey(null), []);
    const stableSwapCustomizeOpen = useCallback((id: string) => {
        setSwapCustomizeOpenKey(prev => prev === id ? null : id);
    }, []);
    const stableSwapCustomizeClose = useCallback(() => setSwapCustomizeOpenKey(null), []);

    const quickAddTrigger = useRef({ slot: '' as 'Breakfast' | 'Lunch' | 'Snacks' | 'Dinner' });
    const handleOpenSearchStable = useCallback(() => {
        setQuickAddSlot(quickAddTrigger.current.slot);
        setShowQuickAdd(true);
    }, []);
    const [showQuickAdd, setShowQuickAdd] = useState(false);
    const [addAnotherToast, setAddAnotherToast] = useState<string | null>(null);
    const [quickAddSlot, setQuickAddSlot] = useState<'Breakfast' | 'Lunch' | 'Snacks' | 'Dinner'>('Lunch');
    const [showTrayScreen, setShowTrayScreen] = useState(false);
    const [undoSlot, setUndoSlot] = useState<{ date: string; mealType: MealType } | null>(null);
    const [showSlotPicker, setShowSlotPicker] = useState(false);

    const currentSlotMeals = useTrayStore(s => s.plan.days[today]?.[quickAddSlot.toLowerCase() as MealType]);
    const selectedDishIds = useMemo(() => currentSlotMeals?.map(item => item.meal_id) ?? [], [currentSlotMeals]);
    const [showGuide, setShowGuide] = useState(true);
    const [shareType, setShareType] = useState<'prep' | 'pantry' | null>(null);
    const [slotTimesRefreshKey, setSlotTimesRefreshKey] = useState(0);
    useEffect(() => {
        const handler = () => setSlotTimesRefreshKey(k => k + 1);
        window.addEventListener('slot_times_updated', handler);
        return () => window.removeEventListener('slot_times_updated', handler);
    }, []);
    // Exclude undoSlot from completions so categoriseSlots treats it as not yet completed during the undo window
    const committedCompletions = useMemo(() => {
        if (!undoSlot) return completions;
        const key = `${undoSlot.date}::${undoSlot.mealType}`;
        const next = { ...completions };
        delete next[key];
        return next;
    }, [completions, undoSlot]);

    const handleCompleteSlot = useCallback((date: string, mealType: MealType) => {
        completeSlot(date, mealType);
        setUndoSlot({ date, mealType });
        setTimeout(() => setUndoSlot(null), 10000);
    }, [completeSlot]);

    const handleUndoComplete = useCallback((date: string, mealType: MealType) => {
        undoCompleteSlot(date, mealType);
        setUndoSlot(null);
    }, [undoCompleteSlot]);

    const regionKey = (user?.region ?? 'India').toLowerCase();
    const userDiet = user?.diet ?? 'veg';
    const pantryStaples = user?.pantryStaples ?? [];

    const spiceLabel = user?.spiceLevel === 'mild' ? 'Mild 🌿' : user?.spiceLevel === 'hot' ? 'Hot 🔥' : 'Medium 🌶️';

    // Handle swap customize apply
    const handleSwapCustomizeApply = useCallback((date: string, mealType: MealType, itemId: string) => {
      return (updates: Partial<TrayItem>) => {
        updateItemInline(date, mealType, itemId, updates);
        setSwapCustomizeOpenKey(null);
      };
    }, [updateItemInline]);

    // Handle swap selection — find Dish in library, pass as Meal to store
    const handleSwapSelect = useCallback((date: string, mealType: MealType, itemId: string) => {
        return (newMealId: string, chipOverrides?: Record<string, unknown>) => {
            const dish = dishes.find(d => d.id === newMealId);
            if (!dish) return;
            swapMealInSlot(date, mealType, itemId, dishToMeal(dish));
            if (chipOverrides) {
                updateItemInline(date, mealType, itemId, chipOverrides);
            }
            setSwapOpenKey(null);
        };
    }, [swapMealInSlot, dishes, updateItemInline]);

    // Handle inline update
    const handleUpdateInline = useCallback((date: string, mealType: MealType, itemId: string) => {
        return (updates: Partial<TrayItem>) => {
            updateItemInline(date, mealType, itemId, updates);
        };
    }, [updateItemInline]);

    // Handle remove
    const handleRemove = useCallback((date: string, mealType: MealType, itemId: string) => {
        return () => {
            removeMealFromSlot(date, mealType, itemId);
        };
    }, [removeMealFromSlot]);

    // Handle suggestion tap — convert SuggestionMeal to Meal, store applies defaults
    const handleSuggestionAdd = useCallback((date: string, mealType: MealType) => {
        return (suggestion: SuggestionMeal) => {
            const meal = suggestionToMeal(suggestion);
            addMealToSlot(date, mealType, meal);
        };
    }, [addMealToSlot]);

    // Quick add modal result — pass Dish to store, store applies defaults
    const handleQuickAddMeal = useCallback((date: string, slot: string, dish: Dish) => {
        const mealType = slot.toLowerCase() as MealType;
        addMealToSlot(date, mealType, dishToMeal(dish));
        setShowQuickAdd(false);
    }, [addMealToSlot]);

    const handleAddAnother = useCallback((date: string, mealType: MealType, dish: Dish) => {
        const existing = getMeals(date, mealType);
        const existingItem = existing.find(m => m.meal_id === dish.id);
        if (existingItem) {
            updateItemInline(date, mealType, existingItem.id, {
                quantity: (existingItem.quantity || 1) + 1,
            });
            setAddAnotherToast(`Added to ${mealType.charAt(0).toUpperCase() + mealType.slice(1)}`);
        } else {
            addMealToSlot(date, mealType, dishToMeal(dish));
            setAddAnotherToast(`Added to ${mealType.charAt(0).toUpperCase() + mealType.slice(1)}`);
        }
        setTimeout(() => setAddAnotherToast(null), 3000);
    }, [addMealToSlot, getMeals, updateItemInline, dishToMeal]);

    const buildPrepMessage = useCallback((lang: ShareLanguage) => {
        const copy = getShareStrings(lang);
        const lines = SLOTS
            .map(slot => {
                const meals = getMeals(today, slot.mealType);
                if (meals.length === 0) return null;
                return meals.map(m => {
                    const parts: string[] = [m.name];
                    if (m.gravy) parts.push(m.gravy);
                    if (m.roti) parts.push(m.roti);
                    if (m.rice) parts.push(m.rice);
                    if (m.sides?.length) parts.push(m.sides.join(', '));
                    if (m.beverages?.length) parts.push(m.beverages.join(', '));
                    const label = parts.join(' • ');
                    const qty = (m.quantity || 1) > 1 ? ` x${m.quantity}` : '';
                    return `• ${slot.label}: ${label}${qty}`;
                }).join('\n');
            })
            .filter(Boolean);
        return `🍱 *${copy.dailyTitle}*\n\n${today}\n${copy.todayPlan}:\n${lines.join('\n')}\n\nRegion: ${user?.region ?? ''}`;
    }, [getMeals, today, user]);

    const buildPantryMessage = useCallback((lang: ShareLanguage) => {
        const copy = getShareStrings(lang);
        const items = SLOTS
            .flatMap(slot => getMeals(today, slot.mealType))
            .map(m => `• ${m.name}`)
            .join('\n');
        return `🛒 *${copy.pantryTitle}*\n\n${copy.pantryFor}:\n${items}\n\n${copy.sentFrom}`;
    }, [getMeals, today]);

    const preferences = useMemo(() => user?.slotTimePreferences, [user?.slotTimePreferences]);
    const stableGuestMode = useMemo(() => guestMode, [
        guestMode.active, guestMode.guestCount, guestMode.extraServings,
        guestMode.startDate, guestMode.endDate,
    ]);
    const categorizedSlots = useMemo(() => categorizeSlots(getMeals, today, committedCompletions, preferences), [getMeals, today, committedCompletions, preferences, slotTimesRefreshKey]);
    const activeSlots = categorizedSlots.filter(s => s.section === 'active');
    const upcomingSlots = categorizedSlots.filter(s => s.section === 'upcoming');
    const completedSlots = categorizedSlots.filter(s => s.section === 'completed');
    // Continuity Engine: resolve the next active date (today if incomplete, tomorrow if all completed, etc.)
    const displayDate = useMemo(() => resolveNextActiveDate(getMeals, committedCompletions ?? {}, today), [getMeals, committedCompletions, today]);
    const isCurrentDay = displayDate === today;

    const displaySlots = useMemo(() => {
        if (isCurrentDay) return categorizedSlots;
        return SLOTS.map(slot => ({
            section: 'upcoming' as MealSection,
            slot,
        }));
    }, [isCurrentDay, categorizedSlots]);
    const displayActiveUpcomingSlots = useMemo(() => displaySlots.filter(s => s.section !== 'completed'), [displaySlots]);
    const displayCompletedSlots = useMemo(() => displaySlots.filter(s => s.section === 'completed'), [displaySlots]);

    const [mealTab, setMealTab] = useState<'upcoming' | 'history'>('upcoming');
    const [healthExpanded, setHealthExpanded] = useState(false);

    const plateScore = useMemo(() => {
      const allMeals = [...activeSlots, ...upcomingSlots, ...completedSlots].flatMap(({ slot }) => {
        const meals = getMeals(today, slot.mealType);
        return meals.map(m => {
          const meta = DISH_HEALTH_MAP[m.meal_id];
          const categories = [...(meta?.healthCategories ?? [])];
          const tags = [...(meta?.tags ?? [])];

          // Include health categories from meal components (roti, rice, gravy, sides, etc.)
          const componentNames = [
            m.roti, m.rice, m.gravy,
            ...(m.sides ?? []),
            ...(m.beverages ?? []),
            ...(m.dessert ?? []),
          ].filter(Boolean) as string[];
          for (const name of componentNames) {
            const componentMeta = COMPONENT_HEALTH_MAP[name];
            if (componentMeta) {
              categories.push(...componentMeta.healthCategories);
              tags.push(...componentMeta.tags);
            }
          }

          return {
            name: m.name,
            healthCategories: categories,
            tags,
            quantity: m.quantity,
          };
        });
      });
      return scorePlateBalance(allMeals);
    }, [today, activeSlots, upcomingSlots, completedSlots, getMeals]);

    const loopConfig = useTrayStore(s => s.mealLoop.config);
    const loopConfigured = loopConfig !== null;

    return (
        <div className="pb-40 animate-in fade-in duration-300 bg-white">
            {/* Header */}
            <header className="flex justify-between items-end px-6 pt-14 pb-2">
                <div>
                    <span className="text-2xl font-black tracking-tight leading-none">
                        Meal<span className="text-[#FF385C]">Drama</span>
                    </span>
                    <div className="flex items-center gap-1.5 text-[10px] font-black uppercase tracking-widest mt-1.5 mb-1 text-gray-400">
                        <MapPin size={11} className="text-[#FF385C]" />
                        <span>{user?.region}</span>
                    </div>
                    <h2 className="text-[1.7rem] font-extrabold tracking-tight">
                        {new Date().getHours() < 8 ? 'Up before the cook? 👀' : "What's Cooking?"}
                    </h2>
                </div>
                <div className="flex items-center gap-2">
                    <span className="text-xs font-bold border px-3 py-1.5 rounded-full flex items-center gap-1 bg-orange-50 text-orange-500 border-orange-100">
                        <Flame size={11} fill="currentColor" />
                        {spiceLabel}
                    </span>
                    <button
                        onClick={() => onNavigate?.('profile')}
                        className="w-10 h-10 rounded-2xl shadow border flex items-center justify-center active:scale-95 transition-all bg-white border-gray-100 text-gray-400"
                    >
                        <span className="text-lg">👤</span>
                    </button>
                </div>
            </header>

            {/* Guide */}
            {showGuide && (
                <div className="mx-6 mt-4 p-4 border rounded-[20px] flex items-start gap-3 bg-[#FF385C]/5 border-[#FF385C]/15">
                    <Info size={16} className="text-[#FF385C] mt-0.5 flex-shrink-0" />
                    <div className="flex-1">
                        <p className="text-xs font-bold mb-1 text-gray-800">2-Tap Swap™ 101</p>
                        <p className="text-[11px] leading-relaxed text-gray-500">
                            Tap swap → pick a dish → done. Edits auto-save.
                        </p>
                    </div>
                    <button onClick={() => setShowGuide(false)}><X size={14} className="text-gray-400" /></button>
                </div>
            )}

            {/* Loop config CTA — shown when tray has meals but loop not configured */}
            {!loopConfigured && displayActiveUpcomingSlots.length > 0 && (
              <div className="mx-6 mt-4 p-4 rounded-[20px] border-2 border-amber-200 bg-amber-50">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-amber-100 flex items-center justify-center shrink-0">
                    <RefreshCw size={18} className="text-amber-600" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-black text-amber-800">Future days are empty</p>
                    <p className="text-[11px] text-amber-700 leading-tight mt-0.5">Set up a meal loop to auto-fill upcoming days</p>
                  </div>
                  <button
                    onClick={() => onManageTray?.()}
                    className="shrink-0 px-4 py-2 rounded-xl bg-amber-600 text-white text-[10px] font-black uppercase tracking-widest active:scale-95 transition-all flex items-center gap-1"
                  >
                    Configure <ArrowRight size={12} />
                  </button>
                </div>
              </div>
            )}

            {/* Health Insights */}
            <div className="mx-6 mt-4">
                <button
                    onClick={() => setHealthExpanded(!healthExpanded)}
                    className="w-full flex items-center justify-between p-3 rounded-xl bg-emerald-50 border border-emerald-100 active:scale-[0.99] transition-all"
                >
                    <div className="flex items-center gap-2">
                        <Heart size={14} className="text-emerald-500" />
                        <span className="text-[10px] font-black uppercase tracking-widest text-emerald-700">Health Insights</span>
                    </div>
                    <ChevronRight size={14} className={`text-emerald-400 transition-transform ${healthExpanded ? 'rotate-90' : ''}`} />
                </button>
                {healthExpanded && (
                    <div className="mt-3 space-y-3">
                        {displaySlots.some(({ slot }) => getMeals(displayDate, slot.mealType).length > 0) ? (
                            <PlateBalanceVisualizer score={plateScore} diet={userDiet} />
                        ) : (
                            <div className="p-4 rounded-2xl bg-gray-50 border border-gray-100 text-center">
                                <p className="text-xs text-gray-500">Add meals to see your meal balance</p>
                            </div>
                        )}
                        <HealthTipsPanel maxTips={2} compact />
                    </div>
                )}
            </div>

            {/* Quick Actions */}
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
                    className="p-5 rounded-[24px] bg-[#FF385C] text-white flex items-center justify-between active:scale-95 transition-all"
                >
                    <div>
                        <p className="text-[9px] font-black uppercase tracking-widest opacity-70 mb-1">Pantry</p>
                        <p className="text-sm font-bold">What's Needed →</p>
                    </div>
                    <ChevronRight size={18} className="opacity-70" />
                </button>
            </div>

            {/* ─── TODAY'S MEALS — Day-wise view with all slots ─── */}
            <div className="px-6 mt-6">
                <div className="flex items-center gap-2 mb-3">
                    <div className="text-base" aria-hidden="true">{isCurrentDay ? '📅' : '🌤️'}</div>
                    <p className="text-[11px] font-black uppercase tracking-widest text-gray-900">
                        {isCurrentDay ? "Today's Meals" : "Tomorrow's Preview"}
                    </p>
                    <span className="text-[9px] font-bold text-gray-400 ml-auto">
                        {new Date(displayDate).toLocaleDateString('en-IN', { weekday: 'long', month: 'short', day: 'numeric' })}
                    </span>
                </div>

                {/* Tab nav */}
                <div className="flex gap-2 mb-4">
                    <button
                        onClick={() => setMealTab('upcoming')}
                        className={`px-4 py-2 rounded-full text-[10px] font-black uppercase tracking-widest transition-all ${
                            mealTab === 'upcoming'
                                ? 'bg-gray-900 text-white'
                                : 'bg-gray-100 text-gray-500'
                        }`}
                    >
                        Upcoming
                    </button>
                    <button
                        onClick={() => setMealTab('history')}
                        className={`px-4 py-2 rounded-full text-[10px] font-black uppercase tracking-widest transition-all ${
                            mealTab === 'history'
                                ? 'bg-gray-900 text-white'
                                : 'bg-gray-100 text-gray-500'
                        }`}
                    >
                        History
                        {completedSlots.length > 0 && (
                            <span className="ml-1.5 text-[8px] opacity-60">{completedSlots.length}</span>
                        )}
                    </button>
                </div>

                {/* Slot list */}
                <div className="space-y-4">
                    {(mealTab === 'upcoming' ? displayActiveUpcomingSlots : displayCompletedSlots).length > 0 ? (
                        (mealTab === 'upcoming' ? displayActiveUpcomingSlots : displayCompletedSlots).map(({ section, slot }) => {
                        const slotMeals = getMeals(displayDate, slot.mealType);
                        const prefs = preferences;
                        const completionKey = `${today}::${slot.mealType}`;
                        const isUserCompleted = isCurrentDay && completions[completionKey] != null;
                        const isUndoing = isCurrentDay && undoSlot?.date === today && undoSlot?.mealType === slot.mealType;
                        const tomorrowDate = getTodayISO(new Date(new Date(displayDate).getTime() + 86400000));
                        const tomorrowMeals = getMeals(tomorrowDate, slot.mealType);
                        const styleWarnings = computeStyleWarnings(slotMeals.map(m => ({ mealId: m.meal_id, name: m.name })));
                        const sectionColors: Record<string, string> = {
                            active: 'border-l-[#FF385C]',
                            upcoming: 'border-l-gray-300',
                            completed: 'border-l-gray-200',
                        };
                        const sectionLabels: Record<string, string> = {
                            active: isCurrentDay ? 'Now' : 'Next',
                            upcoming: 'Upcoming',
                            completed: 'Done',
                        };
                        return (
                            <div key={slot.key} className={`border-l-2 pl-3 ${sectionColors[section]}`}>
                                <LoopAutoFillSlot date={displayDate} mealType={slot.mealType} />
                                <div className="flex items-center gap-2 mb-1.5">
                                    <span className="text-[9px] font-black uppercase tracking-widest text-gray-500">
                                        {slot.label}
                                    </span>
                                    <span className={`text-[8px] font-bold px-1.5 py-0.5 rounded-full ${
                                        section === 'active'
                                            ? 'bg-[#FF385C]/10 text-[#FF385C]'
                                            : section === 'upcoming'
                                                ? 'bg-gray-100 text-gray-500'
                                                : 'bg-gray-100 text-gray-400'
                                    }`}>
                                        {sectionLabels[section]}
                                    </span>
                                </div>
                                <SlotBody
                                    date={displayDate}
                                    mealType={slot.mealType}
                                    slotLabel={slot.label}
                                    meals={slotMeals}
                                    mergeExtraItems
                                    mode={section as SlotMode}
                                    dishes={dishes}
                                    userRegion={user?.region ?? 'India'}
                                    userDiet={user?.diet ?? 'veg'}
                                    pantryStaples={pantryStaples}
                                    guestMode={stableGuestMode}
                                    swapOpenKey={swapOpenKey}
                                    onSwapOpen={stableSwapOpen}
                                    onSwapClose={stableSwapClose}
                                    onSwapSelect={handleSwapSelect}
                                    onUpdateInline={handleUpdateInline}
                                    onRemove={handleRemove}
                                    onSuggestionAdd={handleSuggestionAdd}
                                    onOpenSearch={() => {
                                        quickAddTrigger.current = { slot: slot.label };
                                        handleOpenSearchStable();
                                    }}
                                    swapCustomizeOpenKey={swapCustomizeOpenKey}
                                    onSwapCustomizeOpen={stableSwapCustomizeOpen}
                                    onSwapCustomizeClose={stableSwapCustomizeClose}
                                    onSwapCustomizeApply={handleSwapCustomizeApply}
                                    onAddAnother={handleAddAnother}
                                    isUserCompleted={isCurrentDay && isUserCompleted && !isUndoing}
                                    tomorrowDate={tomorrowDate}
                                    tomorrowMeals={tomorrowMeals}
                                    onComplete={isCurrentDay ? () => handleCompleteSlot(today, slot.mealType) : undefined}
                                    onUndoComplete={isCurrentDay ? () => handleUndoComplete(today, slot.mealType) : undefined}
                                    styleWarnings={styleWarnings}
                                    preferences={prefs}
                                />
                            </div>
                        );
                    })) : null}
                </div>

                {/* All-day servings breakdown */}
                <div className="mt-4">
                    <ServingsBreakdown
                        items={displaySlots.flatMap(({ slot }) => getMeals(displayDate, slot.mealType))}
                        title={isCurrentDay ? "Today's Serving Load" : "Tomorrow's Serving Load"}
                    />
                </div>
            </div>

            {/* ─── COOK SHARE ─── */}
            <div className="px-6 mt-8">
                <div className="p-4 rounded-[24px] border border-gray-100 bg-gray-50 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <div className="w-9 h-9 bg-green-500 rounded-full flex items-center justify-center">
                            <Phone size={16} fill="white" className="text-white" />
                        </div>
                        <div>
                            <p className="text-[9px] font-black uppercase tracking-widest text-gray-400">Cook</p>
                            <p className="text-sm font-bold text-gray-800">{user?.cookContact || '— Drop a number'}</p>
                        </div>
                    </div>
                    <button
                        onClick={() => {
                            if (!user?.cookContact) { alert("Add cook's number in Profile first."); return; }
                            setShareType('prep');
                        }}
                        className="bg-white px-4 py-2.5 rounded-2xl text-[10px] font-black uppercase tracking-widest text-[#FF385C] border border-gray-100 active:scale-95 transition-all shadow-sm"
                    >
                        <span className="flex items-center gap-1.5">
                            <MessageCircle size={12} />
                            Share
                        </span>
                    </button>
                </div>
            </div>

            {/* WhatsApp Share Modal */}
            <WhatsAppShareModal
                isOpen={shareType !== null}
                defaultPhone={user?.cookContact || ''}
                title="Daily meal plan"
                onClose={() => setShareType(null)}
                previewBuilder={(language) => shareType === 'prep' ? buildPrepMessage(language) : buildPantryMessage(language)}
            />

            {/* Undo toast */}
            {undoSlot && (
                <div className="fixed bottom-40 left-4 right-4 z-50 mx-auto max-w-lg">
                    <div className="bg-gray-900 text-white px-5 py-4 rounded-2xl shadow-2xl flex items-center justify-between">
                        <span className="text-sm font-medium">Marked as complete</span>
                        <button
                            onClick={() => handleUndoComplete(undoSlot.date, undoSlot.mealType)}
                            className="text-emerald-400 font-bold text-sm active:opacity-60"
                        >
                            Undo
                        </button>
                    </div>
                </div>
            )}

            {/* Add Another toast */}
            {addAnotherToast && (
                <div className="fixed bottom-40 left-4 right-4 z-50 mx-auto max-w-lg">
                    <div className="bg-emerald-600 text-white px-5 py-4 rounded-2xl shadow-2xl flex items-center justify-between">
                        <span className="text-sm font-medium">{addAnotherToast}</span>
                        <button
                            onClick={() => setAddAnotherToast(null)}
                            className="text-white/70 font-bold text-sm active:opacity-60"
                        >
                            Dismiss
                        </button>
                    </div>
                </div>
            )}

            {/* FAB */}
            <div className="fixed bottom-24 right-6 z-40">
            <button
                onClick={() => setShowSlotPicker(true)}
                className="w-14 h-14 bg-[#FF385C] text-white rounded-full shadow-xl flex items-center justify-center active:scale-90 transition-all"
                aria-label="Add meal"
            >
                <Plus size={24} />
            </button>
            </div>

            {/* Slot picker */}
            {showSlotPicker && (
                <div className="fixed inset-0 z-50" onClick={() => setShowSlotPicker(false)}>
                    <div className="absolute inset-0 bg-black/30" />
                    <div
                        className="absolute bottom-0 left-0 right-0 bg-white rounded-t-3xl p-6 pb-10 animate-in slide-in-from-bottom duration-200 max-w-lg mx-auto"
                        onClick={e => e.stopPropagation()}
                    >
                        <h3 className="text-lg font-black text-gray-900 mb-1">Add to which meal?</h3>
                        <p className="text-xs text-gray-500 mb-4">
                            {new Date(today).toLocaleDateString('en-IN', { weekday: 'long', month: 'short', day: 'numeric' })}
                        </p>
                        <div className="space-y-2">
                            {SLOTS.map(({ label, key }) => (
                                <button
                                    key={key}
                                    onClick={() => {
                                        setQuickAddSlot(label);
                                        setShowQuickAdd(true);
                                        setShowSlotPicker(false);
                                    }}
                                    className="w-full flex items-center gap-4 p-4 rounded-2xl border border-gray-100 active:scale-[0.98] transition-all hover:bg-gray-50"
                                >
                                    <span className="text-2xl w-10 h-10 flex items-center justify-center">
                                        {key === 'Breakfast' ? '🌅' : key === 'Lunch' ? '☀️' : key === 'Snacks' ? '🥜' : '🌙'}
                                    </span>
                                    <div className="text-left">
                                        <span className="text-sm font-bold text-gray-900 block">{label}</span>
                                        <span className="text-[10px] text-gray-400">
                                            {key === 'Breakfast' ? 'Morning meals' : key === 'Lunch' ? 'Midday meals' : key === 'Snacks' ? 'Evening bites' : 'Night meals'}
                                        </span>
                                    </div>
                                </button>
                            ))}
                        </div>
                        <button
                            onClick={() => setShowSlotPicker(false)}
                            className="w-full mt-3 py-3 rounded-2xl bg-gray-100 text-gray-600 font-bold text-sm active:scale-[0.98] transition-all"
                        >
                            Cancel
                        </button>
                    </div>
                </div>
            )}

            {/* Quick Add Modal */}
            <QuickAddModal
                isOpen={showQuickAdd}
                onClose={() => setShowQuickAdd(false)}
                slot={quickAddSlot}
                date={today}
                dishes={dishes}
                userRegion={user?.region ?? 'India'}
                userDiet={user?.diet ?? 'veg'}
                onAddMeal={handleQuickAddMeal}
                selectedDishIds={selectedDishIds}
            />

            {/* Tray Screen */}
            <TrayScreen
                isOpen={showTrayScreen}
                onClose={() => setShowTrayScreen(false)}
                initialDate={today}
            />
        </div>
    );
};

export default Dashboard;
