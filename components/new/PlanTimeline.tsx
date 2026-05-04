import React, { useMemo, useState, useEffect, useRef, useCallback } from 'react';
import { useStore, getMealResolution, MealOption, isSlotLocked, isSlotMissed } from '../../store/useStore';
import { 
    Calendar, History, Sparkles, Check, Share2, ShieldAlert, ArrowRight, Search,
    RotateCcw, X, ChevronRight, RefreshCw, Clock, Utensils, Lock, Unlock, Zap, Plus
} from 'lucide-react';
import { formatMealLabel, getShareStrings, ShareLanguage } from '../../utils/share';
import WhatsAppShareModal from './WhatsAppShareModal';
import { MealCard, SLOT_META } from './MealCard';
import { DISH_LIBRARY } from '../../constants/dishLibrary';
import MealSearch from './MealSearch';
import { useSmartDistribution } from '../../hooks/useSmartDistribution';
import type { Dish, DishVariant } from '../../constants/dishLibrary';

const DEFAULT_DISHES = DISH_LIBRARY;

const SLOT_ORDER = ['Breakfast', 'Lunch', 'Snacks', 'Dinner'] as const;
const SLOT_EMOJI: Record<string, string> = { Breakfast: '🌅', Lunch: '☀️', Snacks: '🥜', Dinner: '🌙' };

const CYCLE_DAYS: Record<string, number> = {
    'Weekly': 7,
    'Bi-weekly': 14,
    'Monthly': 30,
};

const PlanTimeline: React.FC = () => {
    const { user, trayLibrary, swaps, dishes, setSwap, clearSwap, updateMealQuantity, syncPlanToDB } = useStore();
    const [activeTab, setActiveTab] = useState<'future' | 'history'>('future');
    const [autopilotDone, setAutopilotDone] = useState(false);
    const [showShareModal, setShowShareModal] = useState(false);
    const [showSearch, setShowSearch] = useState(false);
    const [searchTarget, setSearchTarget] = useState<{date: string; slot: string} | null>(null);
    
    // Quick actions state
    const [swapMeal, setSwapMeal] = useState<{date: string; slot: string} | null>(null);
    const [swapOptions, setSwapOptions] = useState<MealOption[]>([]);
    const [undoMeal, setUndoMeal] = useState<{date: string; slot: string; previousMeal: MealOption | null; isCancel: boolean; timestamp: number} | null>(null);
    const [cancelSlot, setCancelSlot] = useState<{date: string; slot: string} | null>(null);
    const [transientBadges, setTransientBadges] = useState<Record<string, {type: 'swapped' | 'removed'; timestamp: number}>>({});
    
    // Shared swap popover state for all cards - track both date and slot
    const [swapPopover, setSwapPopover] = useState<{date: string; slot: string} | null>(null);
    const [activeGroup, setActiveGroup] = useState<number | null>(null);
    
    const cycleDays = useMemo(
        () => CYCLE_DAYS[user?.goal || 'Weekly'] ?? 7,
        [user?.goal],
    );

    const getSwapOptions = useCallback((date: string, slot: string): MealOption[] => {
        const pool = (dishes && dishes.length > 0) ? dishes : DISH_LIBRARY;
        
        const slotToCategory: Record<string, string> = {
            'Breakfast': 'breakfast',
            'Lunch': 'lunch',
            'Snacks': 'snacks',
            'Dinner': 'dinner',
        };
        const category = slotToCategory[slot] || slot.toLowerCase();
        
        const userDiet = user?.diet?.toLowerCase() || 'veg';
        const dietFilter: Record<string, string[]> = {
            'veg': ['veg'],
            'non-veg': ['veg', 'non-veg', 'eggitarian'],
            'eggitarian': ['veg', 'eggitarian', 'non-veg'],
            'vegan': ['veg', 'vegan'],
        };
        const allowedTypes = dietFilter[userDiet] || ['veg'];
        
        const relevantDishes = pool.filter((d: any) =>
            d.category.includes(category) &&
            allowedTypes.includes(d.type)
        );
        
        const shuffled = [...relevantDishes].sort(() => Math.random() - 0.5);
        return shuffled.slice(0, 4).map((d: any) => {
            const variant = d.variants?.[0];
            return {
                id: variant?.id || d.id,
                dishId: d.id,
                name: d.name,
                icon: d.icon,
                variant: variant?.name,
                addOn: variant?.addOn,
            };
        });
    }, [dishes, user?.diet]);

    const handleSwap = (date: string, slot: string) => {
        setSwapMeal({ date, slot });
        setSwapOptions(getSwapOptions(date, slot));
    };

    const handleSwapConfirm = useCallback((date: string, slot: string, option: MealOption) => {
        setSwap(date, slot, option);
        window.dispatchEvent(new CustomEvent('pantry:invalidate'));
    }, [setSwap]);

    const handleUpdateQuantity = useCallback((date: string, slot: string, delta: number) => {
        const currentMeal = swaps[date]?.[slot];
        const baseMeal = currentMeal || getMealResolution(trayLibrary, swaps, date, slot, dishes).meal;
        if (!baseMeal) return;
        const nextQty = Math.max(1, (baseMeal.quantity || 1) + delta);
        const updatedMeal = { ...baseMeal, quantity: nextQty };
        setSwap(date, slot, updatedMeal);
        syncPlanToDB(date, slot, updatedMeal);
        window.dispatchEvent(new CustomEvent('pantry:invalidate'));
    }, [swaps, trayLibrary, dishes, setSwap, syncPlanToDB]);

    const executeSwap = async (option: MealOption) => {
        if (!swapMeal) return;
        
        // Store for undo
        const current = getMealResolution(trayLibrary, swaps, swapMeal.date, swapMeal.slot, dishes);
        const key = `${swapMeal.date}_${swapMeal.slot}`;
        
        setUndoMeal({
            date: swapMeal.date,
            slot: swapMeal.slot,
            previousMeal: current.meal || null,
            isCancel: false,
            timestamp: Date.now(),
        });
        
        // Show transient badge immediately
        setTransientBadges(prev => ({
            ...prev,
            [key]: { type: 'swapped', timestamp: Date.now() }
        }));
        
        setSwap(swapMeal.date, swapMeal.slot, option);
        syncPlanToDB(swapMeal.date, swapMeal.slot, option);
        window.dispatchEvent(new CustomEvent('pantry:invalidate'));
        
        setSwapMeal(null);
    };

    const handleCancel = (date: string, slot: string) => {
        setCancelSlot({ date, slot });
    };

    const executeCancel = async () => {
        if (!cancelSlot) return;
        
        // Store current meal for undo BEFORE removing
        const current = getMealResolution(trayLibrary, swaps, cancelSlot.date, cancelSlot.slot, dishes);
        const key = `${cancelSlot.date}_${cancelSlot.slot}`;
        
        setUndoMeal({
            date: cancelSlot.date,
            slot: cancelSlot.slot,
            previousMeal: current.meal || null,
            isCancel: true,
            timestamp: Date.now(),
        });
        
        // Show transient badge immediately
        setTransientBadges(prev => ({
            ...prev,
            [key]: { type: 'removed', timestamp: Date.now() }
        }));
        
        // Clear the slot
        clearSwap(cancelSlot.date, cancelSlot.slot);
        window.dispatchEvent(new CustomEvent('pantry:invalidate'));
        
        setCancelSlot(null);
    };

    // Auto-undo after 5 seconds
    useEffect(() => {
        if (!undoMeal) return;
        const timer = setTimeout(() => setUndoMeal(null), 5000);
        return () => clearTimeout(timer);
    }, [undoMeal]);

    // Auto-clear transient badges after 5 seconds
    useEffect(() => {
        if (Object.keys(transientBadges).length === 0) return;
        const timer = setTimeout(() => setTransientBadges({}), 5000);
        return () => clearTimeout(timer);
    }, [transientBadges]);

    // Clean up individual badge when it expires (check every second)
    useEffect(() => {
        const interval = setInterval(() => {
            const now = Date.now();
            setTransientBadges(prev => {
                const next: Record<string, {type: 'swapped' | 'removed'; timestamp: number}> = {};
                let changed = false;
                for (const [key, badge] of Object.entries(prev)) {
                    if (now - (badge as any).timestamp < 5000) {
                        next[key] = badge as any;
                    } else {
                        changed = true;
                    }
                }
                return changed ? next : prev;
            });
        }, 1000);
        return () => clearInterval(interval);
    }, []);

const handleUndo = () => {
        if (!undoMeal) return;
        
        // Clear transient badge
        const key = `${undoMeal.date}_${undoMeal.slot}`;
        setTransientBadges(prev => {
            const next = { ...prev };
            delete next[key];
            return next;
        });
        
        // If previousMeal exists, restore it; otherwise clear
        if (undoMeal.previousMeal) {
            setSwap(undoMeal.date, undoMeal.slot, undoMeal.previousMeal);
        } else {
            clearSwap(undoMeal.date, undoMeal.slot);
        }
        window.dispatchEvent(new CustomEvent('pantry:invalidate'));
        setUndoMeal(null);
    };

const weekDays = useMemo(() => {
        return Array.from({ length: cycleDays }, (_, index) => {
            const date = new Date();
            date.setDate(date.getDate() + 1 + index);
            const isoDate = date.toLocaleDateString('en-CA'); // YYYY-MM-DD in local time
            const label = index === 0 ? 'Tomorrow' : date.toLocaleDateString('en-IN', { weekday: 'short' });

            const meals = SLOT_ORDER.map(slot => getMealResolution(trayLibrary, swaps, isoDate, slot, dishes));
            
            // Check for conflicts (same meal twice in week)
            const allMealIds = meals.map(m => m.meal?.dishId).filter(Boolean);
            const hasConflict = allMealIds.length !== new Set(allMealIds).size;
            
            return {
                isoDate,
                label,
                dateLabel: date.toLocaleDateString('en-IN', { day: 'numeric', month: 'short' }),
                isToday: false,
                hasConflict,
                meals, // Include meals for rendering
            };
        });
    }, [trayLibrary, swaps, dishes, cycleDays]);

    const pastDays = useMemo(() => {
        return Array.from({ length: 5 }, (_, index) => {
            const date = new Date();
            date.setDate(date.getDate() - (index + 1));
            const isoDate = date.toLocaleDateString('en-CA'); // YYYY-MM-DD in local time
            return {
                isoDate,
                label: date.toLocaleDateString('en-IN', { weekday: 'long' }),
                dateLabel: date.toLocaleDateString('en-IN', { day: 'numeric', month: 'short' }),
                meals: SLOT_ORDER.map(slot => getMealResolution(trayLibrary, swaps, isoDate, slot, dishes)),
            };
        });
    }, [trayLibrary, swaps, dishes]);

    const buildWeekMessage = (lang: ShareLanguage) => {
        const copy = getShareStrings(lang);
        const lines = weekDays.map(day =>
            `*${day.label} (${day.dateLabel})*\n${day.meals.map((meal, index) => `${SLOT_EMOJI[SLOT_ORDER[index]!]} ${formatMealLabel(meal.meal)}`).join('\n')}`
        ).join('\n\n');
        return `🗓️ *${copy.weeklyTitle}*\n\n${copy.region}: ${user?.region}\n\n${copy.weekPlan}:\n${lines}\n\n${copy.sentFrom}`;
    };

    // Group days by cycle type
    const groupedDays = useMemo(() => {
        if (cycleDays <= 7) return [{ label: '7 days', days: weekDays }];
        if (cycleDays <= 14) return [
            { label: '7 days', days: weekDays.slice(0, 7) },
            { label: '14 days', days: weekDays.slice(7) }
        ];
        return [
            { label: '7 days', days: weekDays.slice(0, 7) },
            { label: '14 days', days: weekDays.slice(7, 14) },
            { label: '30 days', days: weekDays.slice(14) }
        ];
    }, [weekDays, cycleDays]);

    // Search select handler — adds selected dish to target slot
    const handleSearchSelect = useCallback((dish: Dish, variant: DishVariant) => {
        if (!searchTarget) {
            // No target slot — pick first available slot for tomorrow
            const tomorrow = new Date();
            tomorrow.setDate(tomorrow.getDate() + 1);
            const isoDate = tomorrow.toLocaleDateString('en-CA');
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
            setSwap(isoDate, 'Breakfast', mealOption);
            syncPlanToDB(isoDate, 'Breakfast', mealOption);
        } else {
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
            setSwap(searchTarget.date, searchTarget.slot, mealOption);
            syncPlanToDB(searchTarget.date, searchTarget.slot, mealOption);
            setSearchTarget(null);
        }
        window.dispatchEvent(new CustomEvent('pantry:invalidate'));
    }, [searchTarget, setSwap, syncPlanToDB]);

    // Listen for search select events
    useEffect(() => {
        const handler = (e: Event) => {
            const detail = (e as CustomEvent).detail as { dish: Dish; variant: DishVariant };
            if (detail?.dish && detail?.variant) {
                handleSearchSelect(detail.dish, detail.variant);
            }
        };
        window.addEventListener('meal-search:select', handler);
        return () => window.removeEventListener('meal-search:select', handler);
    }, [handleSearchSelect]);

    // Smart Distribution Engine
    const {
        analysis,
        lockedDays,
        autoFillSlots,
        toggleDayLock,
        applyGapFill,
        applyAllGapFills,
    } = useSmartDistribution({
        trayLibrary,
        dishes,
        userRegion: user?.region ?? '',
        weekDays,
    });

    return (
        <div className="min-h-screen bg-white pb-32 animate-in fade-in duration-500">
            {/* MealSearch overlay */}
            {showSearch && (
                <MealSearch
                    onClose={() => { setShowSearch(false); setSearchTarget(null); }}
                    onSelect={handleSearchSelect}
                />
            )}

            <WhatsAppShareModal
                isOpen={showShareModal}
                defaultPhone={user?.cookContact}
                title="Weekly meal plan"
                onClose={() => setShowShareModal(false)}
                previewBuilder={buildWeekMessage}
            />
            <header className="px-6 pt-14 pb-4">
                <div className="flex items-center justify-between mb-6">
                    <h2 className="text-4xl font-bold tracking-tight">Meal Map</h2>
                    <div className="flex items-center gap-2">
                        {activeTab === 'future' && (
                            <button
                                onClick={() => setShowSearch(true)}
                                className="flex items-center gap-2 bg-gray-100 text-gray-700 px-4 py-2.5 rounded-2xl text-[11px] font-black uppercase tracking-widest active:scale-95 transition-all"
                                aria-label="Search meals"
                            >
                                <Search size={13} /> Search
                            </button>
                        )}
                        {activeTab === 'future' && (
                            <button onClick={() => {
                                if (!user?.cookContact) { alert("Add cook's number in Profile first."); return; }
                                setShowShareModal(true);
                        }}
                            className="flex items-center gap-2 bg-[#25D366] text-white px-4 py-2.5 rounded-2xl text-[11px] font-black uppercase tracking-widest active:scale-95 transition-all shadow-md">
                            <Share2 size={13} /> Week
                        </button>
                    )}
                    </div>
                </div>
                <div className="bg-gray-100 p-1 rounded-2xl flex relative">
                    <button onClick={() => setActiveTab('future')}
                        className={`flex-1 py-3.5 rounded-xl font-bold text-sm z-10 transition-all flex items-center justify-center gap-2 ${activeTab === 'future' ? 'text-gray-900' : 'text-gray-400'}`}>
                        <Calendar size={16} /> What's Next
                    </button>
                    <button onClick={() => setActiveTab('history')}
                        className={`flex-1 py-3.5 rounded-xl font-bold text-sm z-10 transition-all flex items-center justify-center gap-2 ${activeTab === 'history' ? 'text-gray-900' : 'text-gray-400'}`}>
                        <History size={16} /> Done & Dusted
                    </button>
                    <div className={`absolute top-1 bottom-1 w-[calc(50%-4px)] bg-white rounded-xl shadow-sm transition-all duration-300 ${activeTab === 'history' ? 'translate-x-[calc(100%+0px)]' : 'translate-x-0'}`} />
                </div>
            </header>

            {/* Group Navigation Tabs */}
            {activeTab === 'future' && groupedDays.length > 1 && (
                <div className={`px-6 pb-4 flex gap-2 overflow-x-auto scrollbar-hide ${activeGroup !== null ? 'sticky top-0 z-10 py-3 bg-white/95 backdrop-blur-sm shadow-[0_1px_0_rgba(0,0,0,0.05)]' : ''}`}>
                    {groupedDays.map((group, idx) => (
                        <button
                            key={group.label}
                            onClick={() => {
                                const newGroup = activeGroup === idx ? null : idx;
                                setActiveGroup(newGroup);
                                if (newGroup !== null) {
                                    const el = document.getElementById(`group-${idx}`);
                                    el?.scrollIntoView({ behavior: 'smooth', block: 'start' });
                                }
                            }}
                            className={`flex-shrink-0 px-4 py-2 rounded-xl text-xs font-bold transition-all ${
                                activeGroup === idx ? 'bg-gray-800 text-white' :
                                activeGroup !== null ? 'bg-gray-100 text-gray-500 hover:bg-gray-200' :
                                idx === 0 ? 'bg-gray-100 text-gray-700 hover:bg-gray-200' :
                                idx === 1 ? 'bg-gray-200 text-gray-600 hover:bg-gray-300' :
                                'bg-gray-300 text-gray-500 hover:bg-gray-400'
                            }`}
                        >
                            {group.label}
                        </button>
                    ))}
                </div>
            )}

            {/* Smart Distribution Warnings + Completion Bar */}
            {activeTab === 'future' && analysis.warnings.length > 0 && (
                <div className="px-6 pb-2 space-y-2">
                    <div className="flex items-center gap-3">
                        <div className="flex-1 bg-gray-100 rounded-full h-2">
                            <div
                                className={`h-2 rounded-full transition-all duration-500 ${analysis.completionPct >= 100 ? 'bg-emerald-500' : analysis.completionPct >= 70 ? 'bg-[#FF385C]' : 'bg-amber-500'}`}
                                style={{ width: `${Math.min(analysis.completionPct, 100)}%` }}
                            />
                        </div>
                        <span className="text-[10px] font-black text-gray-500 uppercase">{analysis.completionPct}%</span>
                    </div>
                    {analysis.warnings.filter(w => w.severity === 'warning' || w.severity === 'error').slice(0, 3).map((w, i) => (
                        <div key={i} className={`flex items-start gap-2 p-3 rounded-xl text-xs font-medium ${w.severity === 'error' ? 'bg-red-50 text-red-700 border border-red-100' : w.type === 'repetition' ? 'bg-amber-50 text-amber-700 border border-amber-100' : 'bg-orange-50 text-orange-700 border border-orange-100'}`}>
                            <ShieldAlert size={12} className="mt-0.5 flex-shrink-0" />
                            <span>{w.message}</span>
                        </div>
                    ))}
                    {analysis.gapFillSuggestions.length > 0 && (
                        <button onClick={applyAllGapFills} className="w-full flex items-center justify-between p-3 bg-[#FF385C]/5 border border-[#FF385C]/15 rounded-xl active:scale-[0.99] transition-all">
                            <div className="flex items-center gap-2">
                                <Zap size={14} className="text-[#FF385C]" />
                                <span className="text-xs font-bold text-[#FF385C]">Auto-fill {analysis.gapFillSuggestions.length} empty slot{analysis.gapFillSuggestions.length !== 1 ? 's' : ''} with regional picks</span>
                            </div>
                            <Plus size={14} className="text-[#FF385C]" />
                        </button>
                    )}
                    {analysis.excessQueue.length > 0 && (
                        <div className="flex items-center gap-2 p-3 bg-sky-50 border border-sky-100 rounded-xl">
                            <Clock size={12} className="text-sky-600" />
                            <span className="text-xs font-medium text-sky-700">{analysis.excessQueue.length} extra dish{analysis.excessQueue.length !== 1 ? 'es' : ''} saved to Week 2 queue</span>
                        </div>
                    )}
                </div>
            )}

            {/* Undo Banner */}
            {undoMeal && (
                <div className="fixed top-20 left-4 right-4 z-50 bg-gray-900 text-white px-4 py-3 rounded-2xl flex items-center justify-between shadow-xl animate-in slide-in-from-top-2">
                    <span className="text-sm font-medium">
                        {undoMeal.isCancel ? `${undoMeal.slot} removed. Tap undo.` : 'Swapped. Tap undo to revert.'}
                    </span>
                    <button onClick={handleUndo} className="flex items-center gap-2 text-white/80 hover:text-white">
                        <RotateCcw size={14} /> Undo
                    </button>
                </div>
            )}

            {/* Swap Popover */}
            {swapMeal && (
                <div className="fixed inset-0 z-[60] flex items-end justify-center" onClick={() => setSwapMeal(null)}>
                    <div className="bg-white w-full max-w-md rounded-t-[28px] p-6 pb-8 animate-in slide-in-from-bottom-4" onClick={e => e.stopPropagation()}>
                        <div className="flex items-center justify-between mb-4">
                            <h3 className="text-lg font-bold">New {swapMeal.slot}?</h3>
                            <button onClick={() => setSwapMeal(null)} className="p-2 bg-gray-100 rounded-full">
                                <X size={18} />
                            </button>
                        </div>
                        <p className="text-sm text-gray-500 mb-4">Tap one, done.</p>
                        <div className="space-y-2">
                            {swapOptions.map(option => (
                                <button
                                    key={option.id}
                                    onClick={() => executeSwap(option)}
                                    className="w-full p-4 bg-gray-50 rounded-2xl flex items-center gap-4 hover:bg-gray-100 transition-all text-left"
                                >
                                    <span className="text-2xl">{option.icon || '🍽️'}</span>
                                    <div className="flex-1">
                                        <p className="font-bold text-gray-800">{option.name}</p>
                                        {option.variant && <p className="text-xs text-gray-500">{option.variant}</p>}
                                    </div>
                                    <ChevronRight size={18} className="text-gray-400" />
                                </button>
                            ))}
                        </div>
                    </div>
                </div>
            )}

            {/* Cancel Popover */}
            {cancelSlot && (
                <div className="fixed inset-0 z-[60] bg-black/50 flex items-center justify-center" onClick={() => setCancelSlot(null)}>
                    <div className="bg-white w-full max-w-sm rounded-[24px] p-6 mx-4 animate-in zoom-in-95">
                        <div className="text-center">
                            <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
                                <X className="text-red-500" size={32} />
                            </div>
                            <h3 className="text-xl font-bold mb-2">Skip {cancelSlot.slot}?</h3>
                            <p className="text-sm text-gray-500 mb-6">
                                {cancelSlot.slot} on {cancelSlot.date} won't count toward your pantry list.
                            </p>
                            <div className="flex gap-3">
                                <button
                                    onClick={() => setCancelSlot(null)}
                                    className="flex-1 py-3 bg-gray-100 rounded-2xl font-bold text-gray-700"
                                >
                                    Nope, keep it
                                </button>
                                <button
                                    onClick={executeCancel}
                                    className="flex-1 py-3 bg-red-500 text-white rounded-2xl font-bold"
                                >
                                    Skip it
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {activeTab === 'future' ? (
                <div className="px-4 space-y-6">
                    {groupedDays.map((group, idx) => {
                        const groupColor = idx === 0 ? '#FF385C' : idx === 1 ? '#FF6B35' : '#4ECDC4';
                        return (
                        <div key={group.label} id={`group-${idx}`}>
                            <div className="flex items-center gap-2 px-2 mb-3">
                                <Clock size={14} style={{ color: groupColor }} />
                                <span className="text-[10px] font-black uppercase tracking-widest" style={{ color: groupColor }}>{group.label}</span>
                            </div>
                            <div className="space-y-3">
                                {group.days.map((day, dayIdx) => (
                                    <div key={day.isoDate}
                                        className="p-4 rounded-[20px] border-2 bg-white transition-all"
                                        style={{ 
                                            borderColor: dayIdx === 0 ? groupColor : '#f3f4f6',
                                            backgroundColor: dayIdx === 0 ? `${groupColor}08` : 'white'
                                        }}>
                                        
                                        {/* Date Header - Tomorrow onwards, no "Today" badge */}
                                        <div className="flex items-center justify-between mb-3">
                                            <div className="flex items-center gap-2">
                                                <div className="px-3 py-1.5 rounded-xl text-center bg-gray-100 text-gray-500">
                                                    <span className="text-[9px] font-black uppercase block">{day.label}</span>
                                                    <span className="text-xs font-bold">{day.dateLabel}</span>
                                                </div>
                                            </div>
                                            <div className="flex items-center gap-2">
                                                <button
                                                    onClick={(e) => { e.stopPropagation(); toggleDayLock(day.isoDate!); }}
                                                    className={`p-1.5 rounded-lg transition-all ${lockedDays.has(day.isoDate!) ? 'bg-[#FF385C]/10 text-[#FF385C]' : 'bg-gray-50 text-gray-300 hover:text-gray-500'}`}
                                                    title={lockedDays.has(day.isoDate!) ? 'Unlock day' : 'Lock day'}
                                                >
                                                    {lockedDays.has(day.isoDate!) ? <Lock size={13} /> : <Unlock size={13} />}
                                                </button>
                                                {day.hasConflict && (
                                                    <ShieldAlert size={14} className="text-amber-500" />
                                                )}
                                            </div>
                                        </div>

                                        {/* Meal Cards - using MealCard for Dashboard parity */}
                                        <div className="space-y-3">
                                            {day.meals.map((resolution, idx) => {
                                                const slot = SLOT_ORDER[idx];
                                                const locked = isSlotLocked(day.isoDate!, slot!);
                                                const missed = isSlotMissed(day.isoDate!, slot!);
                                                return (
                                                <MealCard
                                                    key={`${day.isoDate}-${slot}`}
                                                    slot={slot!}
                                                    date={day.isoDate!}
                                                    meta={SLOT_META[slot!]!}
                                                    resolution={resolution}
                                                    dishes={dishes}
                                                    userRegion={user?.region || ''}
                                                    userDiet={user?.diet || 'veg'}
                                                    swapPopoverSlot={swapPopover?.slot === slot ? slot as string : null}
                                                    setSwapPopoverSlot={(s) => setSwapPopover(s ? { date: day.isoDate as string, slot: s } : null)}
                                                    onSwap={(date, s, option) => handleSwapConfirm(date ?? day.isoDate!, s, option)}
                                                    onUpdateQuantity={(s, delta) => handleUpdateQuantity(day.isoDate!, s, delta)}
                                                    isLocked={locked}
                                                    isMissed={missed}
                                                    hasSwap={!!swaps[day.isoDate!]?.[slot!]}
                                                />
                                            );
                                            })}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    );
                })}
                </div>
            ) : (
                <div className="px-6 space-y-4 animate-in fade-in slide-in-from-bottom-4">
                    {pastDays.map(day => (
                        <div key={day.isoDate} className="p-5 rounded-[24px] bg-gray-50 border border-gray-100">
                            <div className="flex items-center justify-between mb-3">
                                <div>
                                    <p className="text-xs font-black text-gray-400 uppercase tracking-widest">{day.label}</p>
                                    <p className="font-bold text-gray-900">{day.dateLabel}</p>
                                </div>
                                <span className="text-xs font-black text-green-600 bg-green-50 border border-green-100 px-3 py-1 rounded-full uppercase tracking-widest">
                                    Ate Well
                                </span>
                            </div>
                            <div className="space-y-3">
                                {day.meals.map((resolution, index) => {
                                    const slot = SLOT_ORDER[index];
                                    return (
                                        <MealCard
                                            key={`${day.isoDate}-${slot}`}
                                            slot={slot!}
                                            date={day.isoDate!}
                                            meta={SLOT_META[slot!]!}
                                            resolution={resolution}
                                            dishes={dishes}
                                            userRegion={user?.region || ''}
                                            userDiet={user?.diet || 'veg'}
                                            swapPopoverSlot={null}
                                            setSwapPopoverSlot={() => {}}
                                            onSwap={() => {}}
                                            onUpdateQuantity={() => {}}
                                            isLocked={true}
                                            isMissed={false}
                                            hasSwap={false}
                                        />
                                    );
                                })}
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
};

export default React.memo(PlanTimeline);