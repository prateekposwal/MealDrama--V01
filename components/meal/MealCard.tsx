import React, { useMemo, useCallback, useState, useRef, useEffect } from 'react';
import type { TrayItem, SaveStatus, MealType } from '../../store/useTrayStore';
import {
    X, Lock, Sparkles,
} from 'lucide-react';
import DishImage from '../new/DishImage';
import type { Dish } from '../../constants/dishLibrary';
import { HealthScoreBadge } from '../health/HealthScoreBadge';
import { scoreDish } from '../../utils/nutritionScore';
import { STYLE_GROUP_ICONS } from '../../constants/dishStyles';
import type { DishStyleGroup } from '../../constants/dishStyles';
import { SLOT_TIME_DEFAULTS, getSlotDefaultTimes } from '../../types/tray';
import { useStore } from '../../store/useStore';

/** @deprecated `time` is hardcoded — use per-slot `start_time`/`end_time` from config instead */
export const SLOT_META: Record<string, { icon: string; time: string; color: string; bg: string }> = {
    Breakfast: { icon: '🌅', time: '8:00 AM', color: 'border-amber-100', bg: 'bg-amber-50' },
    Lunch: { icon: '☀️', time: '1:00 PM', color: 'border-blue-100', bg: 'bg-blue-50' },
    Snacks: { icon: '🥜', time: '4:00 PM', color: 'border-orange-100', bg: 'bg-orange-50' },
    Dinner: { icon: '🌙', time: '8:00 PM', color: 'border-violet-100', bg: 'bg-violet-50' },
};

interface MealCardProps {
    item: TrayItem;
    date: string;
    mealType: MealType;
    slot: string;
    dishes: Dish[];
    userRegion: string;
    userDiet: string;
    isLocked: boolean;
    isMissed: boolean;
    onRemove: () => void;
    saveStatus?: SaveStatus;
    editable?: boolean;
    variant?: 'full' | 'compact';
    guestExtra?: number;
    swapCustomizeOpen?: boolean;
    onSwapCustomizeOpen?: () => void;
    onSwapCustomizeClose?: () => void;
    onUpdateInline?: (updates: Partial<TrayItem>) => void;
    hideTime?: boolean;
    hideChips?: boolean;
}

const QtyStepper: React.FC<{
  name: string;
  qty: number;
  unit: string;
  onUpdate: (name: string, delta: number) => void;
}> = ({ name, qty, unit, onUpdate }) => (
  <span className="inline-flex items-center gap-0.5 ml-1">
    <button
      onClick={(e) => { e.stopPropagation(); onUpdate(name, -1); }}
      className="w-3.5 h-3.5 flex items-center justify-center rounded-full bg-gray-100 text-[8px] font-bold text-gray-600 active:bg-gray-200 leading-none"
    >
      −
    </button>
    <span className="text-[9px] font-bold text-gray-700 min-w-[8px] text-center tabular-nums">{qty}</span>
    <button
      onClick={(e) => { e.stopPropagation(); onUpdate(name, 1); }}
      className="w-3.5 h-3.5 flex items-center justify-center rounded-full bg-gray-100 text-[8px] font-bold text-gray-600 active:bg-gray-200 leading-none"
    >
      +
    </button>
    <span className="text-[7px] text-gray-400 ml-0.5">{unit}</span>
  </span>
);

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

export const MealCard: React.FC<MealCardProps> = ({
    item, mealType, slot, dishes, userRegion, userDiet,
    isLocked, isMissed, onRemove, editable = true,
    swapCustomizeOpen, onSwapCustomizeOpen, onSwapCustomizeClose,
    onUpdateInline, hideTime = false, hideChips = false,
}) => {
    const [editingTime, setEditingTime] = useState(false);
    const dish = useMemo(
        () => dishes.find(d => d.id === item.meal_id),
        [dishes, item.meal_id]
    );

    const healthScore = useMemo(() => dish ? scoreDish(dish) : 0, [dish]);
    const meta = SLOT_META[slot];

    const handleItemQtyUpdate = useCallback((name: string, delta: number) => {
        if (!onUpdateInline) return;
        const current = item.itemQtys?.[name] ?? 1;
        const next = Math.max(1, current + delta);
        if (next === current) return;
        onUpdateInline({ itemQtys: { ...item.itemQtys, [name]: next } });
    }, [onUpdateInline, item.itemQtys]);

    const qty = (name: string) => item.itemQtys?.[name] ?? 1;

    const userPrefs = useStore.getState().user?.slotTimePreferences;
    const slotTimeDef = getSlotDefaultTimes(mealType, userPrefs as any);
    const displayStart = item.start_time || slotTimeDef.start;
    const displayEnd = item.end_time || slotTimeDef.end;

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
                <div className="flex items-center gap-2">
                    <span className="text-lg" aria-hidden="true">{meta?.icon}</span>
                    <span className="text-[10px] font-black uppercase tracking-widest text-gray-500">{slot}</span>
                    {!hideTime && (editingTime ? (
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
                    ))}

                </div>
                <div className="flex items-center gap-2">
                    {!isLocked && !isMissed && editable && (
                        <>
                            <button
                                onClick={onSwapCustomizeOpen}
                                className="h-8 rounded-xl border flex items-center gap-1 px-2.5 active:scale-90 transition-all bg-white border-gray-200 text-[#FF385C]"
                                aria-label={`Customize ${item.name}`}
                                title="Swap & Customize"
                            >
                                <Sparkles size={13} />
                                <span className="text-[10px] font-bold hidden sm:inline">Customize</span>
                            </button>
                            <button
                                onClick={onRemove}
                                className="w-8 h-8 rounded-xl border flex items-center justify-center active:scale-90 transition-all bg-red-50 border-red-100 text-red-400"
                                aria-label={`Remove ${item.name}`}
                            >
                                <X size={14} />
                            </button>
                        </>
                    )}
                </div>
            </div>

            <div className="flex items-center gap-4">
                <DishImage name={item.name} slot={slot} size="lg" />
                <div className="flex-1 min-w-0">
                    <h4 className="font-extrabold text-xl tracking-tight leading-tight flex items-center flex-wrap gap-1.5 text-gray-900">
                        <span className="truncate">{item.title || item.name}</span>
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
                    {!hideChips && (item.gravy || item.roti || item.rice || item.sides?.length > 0 || item.beverages?.length > 0 || item.dessert?.length > 0) && (
                        <div className="flex flex-wrap items-center gap-1.5 mt-1">
                            {item.gravy && (
                                <span className="text-[9px] font-bold bg-amber-50 text-amber-700 px-2 py-0.5 rounded-full border border-amber-100">
                                    {item.gravy}
                                </span>
                            )}
                            {item.roti && (
                                <span className="text-[9px] font-bold bg-orange-50 text-orange-700 px-2 py-0.5 rounded-full border border-orange-100">
                                    {item.roti}
                                    <QtyStepper name={item.roti} qty={qty(item.roti)} unit="pcs" onUpdate={handleItemQtyUpdate} />
                                </span>
                            )}
                            {item.rice && (
                                <span className="text-[9px] font-bold bg-blue-50 text-blue-700 px-2 py-0.5 rounded-full border border-blue-100">
                                    {item.rice}
                                    <QtyStepper name={item.rice} qty={qty(item.rice)} unit="bowls" onUpdate={handleItemQtyUpdate} />
                                </span>
                            )}
                            {item.sides?.length > 0 && item.sides.map(s => (
                                <span key={s} className="text-[9px] font-medium text-gray-500 bg-gray-50 px-2 py-0.5 rounded-full border border-gray-100">
                                    {s}
                                    <QtyStepper name={s} qty={qty(s)} unit="servings" onUpdate={handleItemQtyUpdate} />
                                </span>
                            ))}
                            {item.beverages?.length > 0 && item.beverages.map(b => (
                                <span key={b} className="text-[9px] font-medium text-gray-500 bg-gray-50 px-2 py-0.5 rounded-full border border-gray-100">
                                    {b}
                                    <QtyStepper name={b} qty={qty(b)} unit="glasses" onUpdate={handleItemQtyUpdate} />
                                </span>
                            ))}
                            {item.dessert?.length > 0 && item.dessert.map(d => (
                                <span key={d} className="text-[9px] font-bold bg-pink-50 text-pink-700 px-2 py-0.5 rounded-full border border-pink-100">
                                    🍨 {d}
                                    <QtyStepper name={d} qty={qty(d)} unit="pcs" onUpdate={handleItemQtyUpdate} />
                                </span>
                            ))}
                        </div>
                    )}
                </div>
            </div>

            <style>{`
                @media (prefers-reduced-motion: reduce) {
                    .transition-all { transition: none !important; }
                }
            `}</style>
        </div>
    );
};

export default MealCard;
