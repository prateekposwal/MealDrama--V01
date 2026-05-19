import React, { useMemo, useCallback, useState, useRef, useEffect } from 'react';
import type { TrayItem, SaveStatus, MealType } from '../../store/useTrayStore';
import {
    X, Sparkles,
} from 'lucide-react';
import DishImage from '../new/DishImage';
import type { Dish } from '../../constants/dishLibrary';
import { HealthScoreBadge } from '../health/HealthScoreBadge';
import { scoreDish } from '../../utils/nutritionScore';
import { STYLE_GROUP_ICONS } from '../../constants/dishStyles';
import type { DishStyleGroup } from '../../constants/dishStyles';
import { getSlotDefaultTimes, isSlotActive } from '../../types/tray';

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
}

const HOUR_OPTIONS = Array.from({ length: 24 }, (_, i) =>
    `${String(i).padStart(2, '0')}:00`
);

const TimeBadge: React.FC<{
    start: string;
    end: string;
    onEdit: () => void;
}> = ({ start, end, onEdit }) => (
    <button
        onClick={(e) => { e.stopPropagation(); onEdit(); }}
        className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-gray-100 text-gray-800 text-[11px] font-bold tracking-tight hover:bg-gray-200 active:scale-95 transition-all min-w-[110px] justify-center"
        title="Edit time window"
    >
        🕒 {start} – {end}
    </button>
);

const TimeEditor: React.FC<{
    start: string;
    end: string;
    onSave: (start: string, end: string) => void;
    onCancel: () => void;
}> = ({ start, end, onSave, onCancel }) => {
    const [s, setS] = useState(start);
    const [e, setE] = useState(end);
    const ref = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const handler = (ev: MouseEvent) => {
            if (ref.current && !ref.current.contains(ev.target as Node)) onCancel();
        };
        document.addEventListener('mousedown', handler);
        return () => document.removeEventListener('mousedown', handler);
    }, [onCancel]);

    return (
        <div
            ref={ref}
            className="inline-flex items-center gap-1 px-1.5 py-1 rounded-full bg-gray-100 border border-gray-200"
            onClick={(e) => e.stopPropagation()}
        >
            <select
                value={s}
                onChange={e => setS(e.target.value)}
                className="text-[9px] font-bold text-gray-700 bg-transparent border-none outline-none appearance-none cursor-pointer w-12 text-center"
            >
                {HOUR_OPTIONS.map(h => <option key={h} value={h}>{h}</option>)}
            </select>
            <span className="text-[9px] text-gray-400">–</span>
            <select
                value={e}
                onChange={e => setE(e.target.value)}
                className="text-[9px] font-bold text-gray-700 bg-transparent border-none outline-none appearance-none cursor-pointer w-12 text-center"
            >
                {HOUR_OPTIONS.map(h => <option key={h} value={h}>{h}</option>)}
            </select>
            <button
                onClick={() => onSave(s, e)}
                className="text-[9px] font-bold text-white bg-[#FF385C] px-1.5 py-0.5 rounded-full ml-1 active:scale-90"
            >
                OK
            </button>
        </div>
    );
};



export const MealCard: React.FC<MealCardProps> = React.memo(({
    item, slot, dishes, mealType,
    isLocked, isMissed, onRemove, editable = true,
    swapCustomizeOpen, onSwapCustomizeOpen, onSwapCustomizeClose,
    onUpdateInline, hideTime = false,
}) => {
    const [editingTime, setEditingTime] = useState(false);
    const dish = useMemo(
        () => dishes.find(d => d.id === item.meal_id),
        [dishes, item.meal_id]
    );

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
            className={`p-5 rounded-[28px] border-2 ${meta?.color || 'border-gray-200'} ${meta?.bg || 'bg-gray-50'} transition-all relative overflow-hidden ${isMissed && !isLocked && editable !== false ? 'grayscale opacity-60' : ''}`}
            role="article"
            aria-label={`${slot} meal: ${item.name}`}
        >
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
                    <span className="text-[9px] font-black uppercase tracking-widest text-gray-500">{slot}</span>
                    {isNowActive && (
                      <span className="text-[8px] font-bold px-1.5 py-0.5 rounded-full bg-[#FF385C]/10 text-[#FF385C]">Now</span>
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
                    <button
                        onClick={onSwapCustomizeOpen}
                        className="group h-8 rounded-xl border border-dashed border-emerald-400 text-emerald-600 active:scale-90 transition-all flex items-center gap-1 px-2.5"
                        aria-label={`Build Your Plate ${item.name}`}
                        title="Build Your Plate"
                    >
                        <Sparkles size={13} className="transition-transform duration-200 group-hover:scale-110" />
                        <span className="text-[10px] font-bold">Build Your Plate</span>
                    </button>
                    {!isLocked && !isMissed && editable && (
                        <button
                            onClick={onRemove}
                            className="w-8 h-8 rounded-xl border flex items-center justify-center active:scale-90 transition-all bg-gray-50 border-gray-200 text-gray-500"
                            aria-label={`Remove ${item.name}`}
                        >
                            <X size={14} />
                        </button>
                    )}
                </div>
            </div>

            <div className="flex items-center gap-4">
                <DishImage name={item.name} slot={slot} size="lg" />
                <div className="flex-1 min-w-0">
                    <h4 className="font-extrabold text-xl tracking-tight leading-tight flex items-center flex-wrap gap-1.5 text-gray-900">
                        <span className="truncate">{item.name}</span>
                        {item.quantity > 1 && (
                            <span className="text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full font-semibold flex-shrink-0">
                                x{item.quantity}
                            </span>
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
                    </h4>

                </div>
            </div>

            <style>{`
                @media (prefers-reduced-motion: reduce) {
                    .transition-all { transition: none !important; }
                }
            `}</style>
        </div>
    );
});

export default MealCard;
