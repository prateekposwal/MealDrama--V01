import React, { useMemo, useCallback, useState, useRef, useEffect } from 'react';
import type { TrayItem, SaveStatus, MealType } from '../../plan/store/useTrayStore';
import {
    X, MessageCircle,
} from 'lucide-react';
import DishImage from '../new/DishImage';
import type { Dish } from '../../meal/constants/dishLibrary';
import { HealthScoreBadge } from '../health/HealthScoreBadge';
import { scoreDish } from '../../utils/nutritionScore';
import { STYLE_GROUP_ICONS } from '../../meal/constants/dishStyles';
import type { DishStyleGroup } from '../../meal/constants/dishStyles';
import { getSlotDefaultTimes, isSlotActive } from '../../types/tray';
import { TimeBadge, TimeEditor } from './TimeComponents';
import { useStore } from '../../app/store/useStore';

/** @deprecated `time` is hardcoded — use per-slot `start_time`/`end_time` from config instead */
export const SLOT_META: Record<string, { icon: string; time: string; color: string; bg: string }> = {
    Breakfast: { icon: '🌅', time: '8:00 AM', color: 'border-amber-100', bg: 'bg-amber-50' },
    Lunch: { icon: '☀️', time: '1:00 PM', color: 'border-blue-100', bg: 'bg-blue-50' },
    Snacks: { icon: '🥜', time: '4:00 PM', color: 'border-orange-100', bg: 'bg-orange-50' },
    Dinner: { icon: '🌙', time: '8:00 PM', color: 'border-violet-100', bg: 'bg-violet-50' },
};

interface MealCardProps {
    item: TrayItem;
    slot: string;
    dishes: Dish[];
    isLocked: boolean;
    isMissed: boolean;
    onRemove: () => void;
    saveStatus?: SaveStatus;
    editable?: boolean;
    variant?: 'full' | 'compact';
    swapCustomizeOpen?: boolean;
    onSwapCustomizeOpen?: () => void;
    onSwapCustomizeClose?: () => void;

    /** @deprecated unused — kept for call-site compatibility */
    date?: string;
    mealType?: MealType;
    userRegion?: string;
    userDiet?: string;
    guestExtra?: number;
    onUpdateInline?: (updates: Partial<TrayItem>) => void;
    swapOpen?: boolean;
    onSwapOpen?: () => void;
    onSwapClose?: () => void;
    onSwapSelect?: (newMealId: string, chipOverrides?: Record<string, unknown>) => void;
    hideTime?: boolean;
    hideChips?: boolean;
    onShareSlot?: () => void;
    hideSlotLabel?: boolean;
}

export const MealCard: React.FC<MealCardProps> = React.memo(({
    item, slot, dishes, mealType,
    isLocked, isMissed, onRemove, editable = true,
    swapCustomizeOpen, onSwapCustomizeOpen, onSwapCustomizeClose,
    onUpdateInline, hideTime = false, onShareSlot, hideSlotLabel,
}) => {
    const [editingTime, setEditingTime] = useState(false);
    const [justSwapped, setJustSwapped] = useState(false);
    const prevMealIdRef = useRef(item.meal_id);
    const dish = useMemo(
        () => dishes.find(d => d.id === item.meal_id),
        [dishes, item.meal_id]
    );
    const household = useStore(s => s.household);
    const requestedByLabel = useMemo(() => {
        if (!item.requestedBy) return null;
        if (!household) return '(left)';
        const member = household.members.find(m => m.id === item.requestedBy);
        return member ? member.name : '(left)';
    }, [item.requestedBy, household]);

    // Detect meal_id change → trigger swap flash animation
    useEffect(() => {
        if (prevMealIdRef.current !== item.meal_id && prevMealIdRef.current !== '') {
            setJustSwapped(true);
            const t = setTimeout(() => setJustSwapped(false), 800);
            prevMealIdRef.current = item.meal_id;
            return () => clearTimeout(t);
        }
        prevMealIdRef.current = item.meal_id;
    }, [item.meal_id]);

    const healthScore = useMemo(() => dish ? scoreDish(dish) : 0, [dish]);
    const meta = SLOT_META[slot];

    const slotTimeDef = getSlotDefaultTimes(mealType || 'lunch');
    const displayStart = item.start_time || slotTimeDef.start;
    const displayEnd = item.end_time || slotTimeDef.end;

    const [nowTime, setNowTime] = useState<Date>(() => new Date());
    useEffect(() => {
      const id = setInterval(() => setNowTime(new Date()), 60000);
      return () => clearInterval(id);
    }, []);
    const isNowActive = isSlotActive(displayStart, displayEnd, nowTime);

    const handleTimeSave = useCallback((start: string, end: string) => {
        setEditingTime(false);
        if (start !== item.start_time || end !== item.end_time) {
            onUpdateInline?.({ start_time: start, end_time: end });
        }
    }, [onUpdateInline, item.start_time, item.end_time]);

    return (
        <div
            className={`p-5 rounded-[28px] border-2 ${meta?.color || 'border-gray-200'} ${meta?.bg || 'bg-gray-50'} transition-all relative overflow-hidden ${isMissed && !isLocked && editable !== false ? 'grayscale opacity-60' : ''} ${justSwapped ? 'swap-flash' : ''}`}
            role="article"
            aria-label={`${slot} meal: ${item.name}`}
        >
            {justSwapped && (
                <div className="absolute inset-0 z-10 pointer-events-none swap-flash-overlay" />
            )}
            {isLocked && editable !== false && (
                <div className="absolute inset-0 z-20 rounded-[28px] bg-gray-900/50 flex flex-col items-center justify-center pointer-events-none">
                    <div className="bg-gray-800 px-3 py-1.5 rounded-full flex items-center gap-1.5">
                        <span className="text-sm">⏰</span>
                        <span className="text-[10px] font-bold text-gray-300 uppercase tracking-widest">Too late!</span>
                    </div>
                </div>
            )}

            <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2 mb-1.5">
                    {!hideSlotLabel && (
                        <span className="text-[9px] font-black uppercase tracking-widest text-gray-500">{slot}</span>
                    )}
                    {!hideTime && (
                        <span className="ml-auto">
                            {editingTime ? (
                                <TimeEditor
                                    start={displayStart}
                                    end={displayEnd}
                                    onSave={handleTimeSave}
                                    onCancel={() => setEditingTime(false)}
                                />
                            ) : (
                                <TimeBadge
                                    start={displayStart}
                                    end={displayEnd}
                                    onEdit={() => setEditingTime(true)}
                                />
                            )}
                        </span>
                    )}

                </div>
                <div className="flex items-center gap-2">
                    {onShareSlot && (
                        <button
                            onClick={(e) => { e.stopPropagation(); onShareSlot(); }}
                            className="w-8 h-8 rounded-xl bg-[#25D366]/10 flex items-center justify-center text-[#25D366] active:scale-90 transition-all hover:ring-2 hover:ring-[#25D366]/30 hover:ring-offset-1"
                            aria-label="Share meal via WhatsApp"
                        >
                            <MessageCircle size={14} />
                        </button>
                    )}
                    {!isLocked && !isMissed && editable && (
                        <button
                            onClick={onRemove}
                            className="w-8 h-8 rounded-xl border flex items-center justify-center active:scale-90 transition-all bg-gray-50 border-gray-200 text-gray-500 hover:ring-2 hover:ring-red-300 hover:ring-offset-1"
                            aria-label={`Remove ${item.name}`}
                        >
                            <X size={14} />
                        </button>
                    )}
                </div>
            </div>

            <div className="flex items-center gap-4">
                {editable ? (
                    <button onClick={onSwapCustomizeOpen} className="shrink-0 cursor-pointer hover:ring-2 hover:ring-emerald-300 hover:ring-offset-2 rounded-2xl active:scale-90 transition-all">
                        <DishImage name={item.name} slot={slot} size="lg" />
                    </button>
                ) : (
                    <div className="shrink-0">
                        <DishImage name={item.name} slot={slot} size="lg" />
                    </div>
                )}
                <div className="flex-1 min-w-0">
                    <h4 className="font-extrabold text-xl tracking-tight leading-tight text-gray-900">
                        <span className="text-sm leading-snug line-clamp-2">{(item.title || item.name).replace(/ \+ /g, ' ')}</span>
                    </h4>
                    <div className="flex items-center gap-1.5 mt-1 flex-wrap">
                        {requestedByLabel && (
                            <span className={`text-[9px] font-bold px-2 py-0.5 rounded-full border flex-shrink-0 ${
                                requestedByLabel === '(left)'
                                    ? 'bg-gray-100 border-gray-200 text-gray-400'
                                    : 'bg-orange-100 border-orange-200 text-orange-700'
                            }`}>
                                {requestedByLabel === '(left)' ? '👋 Left' : `🙋 ${requestedByLabel}`}
                            </span>
                        )}
                        {item.quantity > 1 && (
                            <span className="text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full font-semibold flex-shrink-0">
                                x{item.quantity}
                            </span>
                        )}
                        {editable && onUpdateInline && (
                            <div className="flex items-center gap-1 ml-0.5">
                                <button
                                    onClick={(e) => { e.stopPropagation(); onUpdateInline({ quantity: Math.max(1, item.quantity - 1) }); }}
                                    disabled={item.quantity <= 1}
                                    className="w-5 h-5 rounded-md flex items-center justify-center bg-gray-50 border border-gray-200 text-gray-500 active:scale-90 disabled:opacity-30 text-[10px] font-bold leading-none"
                                >−</button>
                                <span className="text-xs font-bold text-gray-700 tabular-nums w-4 text-center">{item.quantity}</span>
                                <button
                                    onClick={(e) => { e.stopPropagation(); onUpdateInline({ quantity: item.quantity + 1 }); }}
                                    className="w-5 h-5 rounded-md flex items-center justify-center bg-gray-50 border border-gray-200 text-gray-500 active:scale-90 text-[10px] font-bold leading-none"
                                >+</button>
                            </div>
                        )}
                        {item.addon && (
                            <span className="text-xs bg-blue-50 text-blue-600 px-2 py-0.5 rounded-full font-semibold flex-shrink-0">
                                {item.addon}
                            </span>
                        )}
                        {item.style && STYLE_GROUP_ICONS[item.style as DishStyleGroup] && (
                            <span className="text-[9px] font-bold bg-indigo-50 text-indigo-700 px-2 py-0.5 rounded-full border border-indigo-100 flex-shrink-0 flex items-center gap-0.5">
                                {STYLE_GROUP_ICONS[item.style as DishStyleGroup]} {item.style}
                            </span>
                        )}
                        <HealthScoreBadge score={healthScore} size="sm" />
                    </div>

                </div>
            </div>

            <style>{`
                @keyframes swapFlashIn {
                    0% { opacity: 0; transform: scale(0.97); }
                    30% { opacity: 1; transform: scale(1); }
                    100% { opacity: 0; }
                }
                .swap-flash {
                    animation: swapFlashIn 0.8s ease-out;
                }
                .swap-flash-overlay {
                    background: radial-gradient(ellipse at center, rgba(16, 185, 129, 0.15) 0%, transparent 70%);
                    animation: swapFlashIn 0.8s ease-out;
                }
                @media (prefers-reduced-motion: reduce) {
                    .transition-all { transition: none !important; }
                    .swap-flash { animation: none !important; }
                    .swap-flash-overlay { animation: none !important; }
                }
            `}</style>
        </div>
    );
});

export default MealCard;
