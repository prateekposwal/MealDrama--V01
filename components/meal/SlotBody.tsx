// ─────────────────────────────────────────────────────────────────────────────
// SlotBody — Shared slot renderer for Dashboard, PlanScreen, MealTrayBuilder
// Eliminates duplicated MealCard prop-passing + empty-state + lock/missed logic
// ─────────────────────────────────────────────────────────────────────────────

import React, { useState, useMemo, useCallback, useRef, useEffect, lazy, Suspense } from 'react';
import type { MealType, TrayItem, GuestMode } from '../../plan/store/useTrayStore';
import { computeEffectiveServings, resolveSlotTimes, isAfterEnd } from '../../types/tray';
import type { AggregatedCategory } from '../../types/tray';
import type { DishVariant } from '../../meal/constants/dishLibrary';
import { useNormalizedComposition, computeNormalizedComposition } from './useNormalizedComposition';
import type { Dish } from '../../meal/constants/dishLibrary';
import type { SuggestionMeal } from '../../app/lib/trayApi';
import { MealCard } from './MealCard';
import { SLOT_META } from './MealCard';
import { SmartSuggestionChips } from './SmartSuggestionChips';
import { TimeBadge, TimeEditor } from './TimeComponents';
const SwapCustomizeModal = lazy(() => import('./SwapCustomizeModal'));
const CategoryQuickEdit = lazy(() => import('./CategoryQuickEdit'));
import DishSearchModal from './DishSearchModal';
import DishImage from '../new/DishImage';
import PlateCompletionBanner from '../health/PlateCompletionBanner';
import { CheckCheck, ChevronRight, Forward, Shuffle, Sparkles, X, Plus, RefreshCw } from 'lucide-react';
import type { StyleWarning } from '../../meal/constants/dishStyles';
import { useStore } from '../../app/store/useStore';
import { useTrayStore } from '../../plan/store/useTrayStore';
import { useLoopStore } from '../../plan/store/useLoopStore';
import { generateMealTitle } from '../../utils/generateMealTitle';
import { pickFeaturedMeals } from '../../plan/utils/mealRotation';
import { getISODate } from '../../utils/dateUTC';

export type SlotMode = 'active' | 'upcoming' | 'completed' | 'history' | 'builder' | 'skipped';

export interface SlotBodyProps {
  date: string;
  mealType: MealType;
  slotLabel: string;
  meals: TrayItem[];
  mode: SlotMode;
  dishes: Dish[];
  userRegion: string;
  userDiet: string;
  regionKey?: string;
  onAddSuggestion?: (date: string, mealType: MealType, dish: Dish) => void;
  pantryStaples: string[];
  guestMode?: GuestMode;
  onUpdateInline: (date: string, mealType: MealType, itemId: string) => (updates: Partial<TrayItem>) => void;
  /** Per-item remove */
  onRemove: (date: string, mealType: MealType, itemId: string) => () => void;
  /** Slot-level skip — skips the entire meal slot */
  onSkipSlot?: () => void;
  onSuggestionAdd: (date: string, mealType: MealType) => (suggestion: SuggestionMeal) => void;
  onOpenSearch: () => void;
  swapCustomizeOpenKey?: string | null;
  onSwapCustomizeOpen?: (itemId: string) => void;
  onSwapCustomizeClose?: () => void;
  onSwapCustomizeApply?: (date: string, mealType: MealType, itemId: string) => (updates: Partial<TrayItem>) => void;
  onAddAnother?: (date: string, mealType: MealType, dish: Dish, variant?: DishVariant) => void;
  onSwapAll?: (date: string, mealType: MealType) => void;

  /** Mark this slot as completed (user action) */
  onComplete?: () => void;
  /** Undo completion */
  onUndoComplete?: () => void;
  /** Undo skip — restores the full meal group */
  onUndoSkip?: () => void;
  /** Whether this slot has been completed by the user */
  isUserCompleted?: boolean;
  /** Tomorrow's meals for this slot (for preview) */
  tomorrowMeals?: TrayItem[];
  /** Tomorrow's date string */
  tomorrowDate?: string;

  /** Style-based balance warnings (e.g., duplicate gravy) */
  styleWarnings?: StyleWarning[];

  /** When true, extra items beyond the first are shown as compact chips inside the card */
  mergeExtraItems?: boolean;

  /** Max dishes to show in a merged slot (default: no cap). First is a card, rest are chips. */
  maxVisible?: number;

  /** Share this slot via WhatsApp */
  onShareSlot?: () => void;

  /** Hide slot label in MealCard (for cleaner Dashboard layout) */
  hideSlotLabel?: boolean;

  /** Show empty-state amber guide (Dashboard-only). Defaults to true. */
  preferences?: Record<string, { start: string; end: string }>;
}

function getModeBehavior(mode: SlotMode, date: string, slotLabel: string, meals: TrayItem[], mealType: MealType, preferences?: Record<string, { start: string; end: string }>) {
  const today = getISODate(new Date());
  const isToday = date === today;
  const { start, end } = resolveSlotTimes(meals, mealType, preferences);
  const pastEnd = isAfterEnd(start, end);

  let isLocked = false;
  let isMissed = false;
  let editable = true;
  let showSuggestions = false;
  let cardClass = '';

  switch (mode) {
    case 'active':
      if (isToday) {
        isLocked = pastEnd;
        isMissed = pastEnd;
      }
      editable = true;
      showSuggestions = true;
      cardClass = '';
      break;
    case 'upcoming':
      if (isToday) {
        isLocked = pastEnd;
        isMissed = pastEnd;
      }
      editable = true;
      showSuggestions = true;
      break;
    case 'completed':
      isLocked = false;
      isMissed = false;
      editable = false;
      showSuggestions = false;
      cardClass = '';
      break;
    case 'history':
      isLocked = false;
      isMissed = false;
      editable = false;
      showSuggestions = false;
      cardClass = '';
      break;
    case 'builder':
      isLocked = false;
      isMissed = false;
      editable = true;
      showSuggestions = true;
      break;
    case 'skipped':
      isLocked = false;
      isMissed = false;
      editable = false;
      showSuggestions = false;
      cardClass = 'rounded-[28px] opacity-40 pointer-events-none select-none';
      break;
  }

  return { isLocked, isMissed, editable, showSuggestions, cardClass };
}

const _ADD_DISH_DUMMY: TrayItem = {
  id: '__add_dish__', meal_id: '__add_dish__', name: '', icon: '',
  quantity: 1, servings: 1, smartVersion: 1,
  gravy: null, roti: null, rice: null,
  sides: [], beverages: [], dessert: [], itemQtys: {},
};

const _ANIM_STYLE_0 = { '--i': 0 } as React.CSSProperties;
const _ANIM_STYLE_1 = { '--i': 1 } as React.CSSProperties;
const _CHIP_STYLE = { transition: 'opacity 0.2s ease, transform 0.2s ease' };
const _NOOP = () => {};

export const SlotBody: React.FC<SlotBodyProps> = React.memo(({
  date, mealType, slotLabel, meals, mode,
  dishes, userRegion, userDiet, regionKey, onAddSuggestion, pantryStaples,
  guestMode = { active: false, guestCount: 0, extraServings: 0, startDate: '', endDate: '' },
  onUpdateInline, onRemove,
  onSuggestionAdd, onOpenSearch,
  swapCustomizeOpenKey,     onUndoSkip,
    onSwapCustomizeOpen, onSwapCustomizeClose, onSwapCustomizeApply, onAddAnother, onSwapAll,
  onComplete, onSkipSlot, onUndoComplete, isUserCompleted, tomorrowMeals, tomorrowDate,
  styleWarnings,
  mergeExtraItems,
  maxVisible,
  preferences,
  onShareSlot,
  hideSlotLabel,
}) => {
  const slotMeals = maxVisible != null ? meals.slice(0, maxVisible) : meals;
  const { isLocked, isMissed, editable, showSuggestions, cardClass } = useMemo(
    () => getModeBehavior(mode, date, slotLabel, meals, mealType, preferences),
    [mode, date, slotLabel, meals, mealType, preferences],
  );

  const completions = useTrayStore(s => s.completions);
  const skipped = useTrayStore(s => s.skipped);
  const lastFeaturedTimes = useLoopStore(s => s.lastFeaturedTimes);
  const markFeatured = useLoopStore(s => s.markFeatured);
  const featuredRef = useRef<string[] | null>(null);

  // Loop-aware guidance: check if this date+slot has a loop assignment
  const loopConfig = useLoopStore(s => s.mealLoop.config);
  const loopAssignments = useLoopStore(s => s.mealLoop.assignments);
  const loopActive = !!loopConfig;
  const hasLoopAssignment = useMemo(() => {
    if (!loopActive) return false;
    return loopAssignments.some(a => a.date === date && a.mealType === mealType);
  }, [loopActive, loopAssignments, date, mealType]);

  const featured = useMemo(() => {
    if (!mergeExtraItems || meals.length <= 2) return null;
    return pickFeaturedMeals(meals, dishes, date, mealType, {
      userRegion, userDiet, completions, skipped, lastFeaturedTimes,
    });
  }, [meals, dishes, date, mealType, userRegion, userDiet, completions, skipped, lastFeaturedTimes, mergeExtraItems]);

  useEffect(() => {
    if (!featured) return;
    const prevIds = featuredRef.current;
    const newIds = [featured.primary.meal_id, ...(featured.secondary ? [featured.secondary.meal_id] : [])];
    if (prevIds && prevIds.length === newIds.length && prevIds.every((id, i) => id === newIds[i])) return;
    featuredRef.current = newIds;
    markFeatured(newIds);
  }, [featured, markFeatured]);

  const activeCustomizeItem = useMemo(
    () => meals.find(m => m.id === swapCustomizeOpenKey) ?? null,
    [meals, swapCustomizeOpenKey],
  );

  const handleModalApply = useCallback(
    (itemId: string, updates: Partial<TrayItem>) => {
      onSwapCustomizeApply?.(date, mealType, itemId)(updates);
    },
    [date, mealType, onSwapCustomizeApply],
  );

  const handleModalChange = useCallback(
    (itemId: string, updates: Partial<TrayItem>) => {
      const currentItem = meals.find(m => m.id === itemId);
      if (!currentItem) {
        onUpdateInline(date, mealType, itemId)(updates);
        return;
      }
      // Replace array fields entirely (no additive merge — prevents stale-accumulation
      // where toggled-off items survive via previous-state merge).
      const merged: Partial<TrayItem> = { ...updates };
      // Preserve scalar fields not present in updates (e.g. gravy, roti, rice are
      // already present in updates from buildUpdatesObject, but just in case):
      for (const key of ['gravy', 'roti', 'rice'] as const) {
        if (!(key in updates) && currentItem[key] !== undefined) {
          merged[key] = currentItem[key];
        }
      }
      onUpdateInline(date, mealType, itemId)(merged);
    },
    [date, mealType, onUpdateInline, meals],
  );

  const [addDishOpen, setAddDishOpen] = useState(false);

  const aggregated = useNormalizedComposition(meals);
  const setToast = useStore(s => s.setToast);
  const household = useStore(s => s.household);
  const memberName = useCallback((memberId: string) => {
    const member = household?.members.find(m => m.id === memberId);
    return member ? member.name : '(left)';
  }, [household?.members]);

  const handleAggregatedQty = useCallback((name: string, delta: number) => {
    const hasItem = (item: TrayItem) =>
      item.roti === name || item.rice === name || item.gravy === name ||
      item.sides?.includes(name) || item.beverages?.includes(name) || item.dessert?.includes(name);
    const targets = meals.filter(hasItem);
    if (targets.length === 0) return;
    let remaining = Math.abs(delta);
    const sign = delta > 0 ? 1 : -1;
    let removed = false;
    for (const item of targets) {
      if (remaining <= 0) break;
      const current = item.itemQtys?.[name] ?? 1;
      const next = current + sign;
      if (sign < 0 && next <= 0) {
        const updatedSides = item.sides?.filter(s => s !== name) || [];
        const updatedBeverages = item.beverages?.filter(b => b !== name) || [];
        const updatedDessert = item.dessert?.filter(d => d !== name) || [];
        const updatedRoti = item.roti === name ? null : item.roti;
        const updatedRice = item.rice === name ? null : item.rice;
        const updatedGravy = item.gravy === name ? null : item.gravy;
        const title = generateMealTitle(
          item.name,
          updatedSides,
          updatedBeverages,
          updatedRice ?? updatedRoti ?? undefined,
        );
        const updates: Partial<TrayItem> = { title };
        if (updatedGravy !== item.gravy) updates.gravy = updatedGravy;
        else if (updatedRice !== item.rice) updates.rice = updatedRice;
        else if (updatedRoti !== item.roti) updates.roti = updatedRoti;
        if (updatedSides.length !== (item.sides?.length ?? 0)) updates.sides = updatedSides;
        if (updatedBeverages.length !== (item.beverages?.length ?? 0)) updates.beverages = updatedBeverages;
        if (updatedDessert.length !== (item.dessert?.length ?? 0)) updates.dessert = updatedDessert;
        if (item.itemQtys) {
          const newQtys = { ...item.itemQtys };
          delete newQtys[name];
          updates.itemQtys = Object.keys(newQtys).length > 0 ? newQtys : undefined;
        }
        onUpdateInline(date, mealType, item.id)(updates);
        remaining -= 1;
        removed = true;
      } else if (next !== current) {
        const capped = sign > 0 ? Math.min(remaining, next - current) : -Math.min(remaining, current - 1);
        if (capped !== 0) {
          onUpdateInline(date, mealType, item.id)({ itemQtys: { ...item.itemQtys, [name]: current + capped } });
          remaining -= Math.abs(capped);
        }
      }
    }
    if (removed) setToast({ message: `${name} removed`, type: 'info' });
  }, [meals, date, mealType, onUpdateInline, setToast]);

  const [quickEditCategory, setQuickEditCategory] = useState<string | null>(null);

  const handleAddPairing = useCallback((name: string) => {
    const first = meals[meals.length - 1];
    if (!first || !quickEditCategory) return;
    const cat = quickEditCategory.toLowerCase();
    const updates: Partial<TrayItem> = {};
    if (cat === 'sides' || cat === 'beverages' || cat === 'dessert') {
      const key = cat as 'sides' | 'beverages' | 'dessert';
      const current = first[key] ?? [];
      if (current.includes(name)) return;
      updates[key] = [...current, name];
    } else if (cat === 'gravy') updates.gravy = name;
    else if (cat === 'bread') updates.roti = name;
    else if (cat === 'rice') updates.rice = name;
    onUpdateInline(date, mealType, first.id)(updates);
  }, [meals, quickEditCategory, date, mealType, onUpdateInline]);

  // Stable callbacks for memo'd children
  const stableSwapCustomizeClose = useCallback(() => onSwapCustomizeClose?.(), [onSwapCustomizeClose]);
  const stableAddDishClose = useCallback(() => setAddDishOpen(false), []);
  const stableSuggestionAdd = useCallback(
    (meal: SuggestionMeal) => onSuggestionAdd(date, mealType)(meal),
    [onSuggestionAdd, date, mealType],
  );

  const categoryConfig = useMemo(() => [
    { items: aggregated.gravy, label: 'Gravy', color: 'bg-amber-50 text-amber-700 border-amber-100', icon: '🥩' },
    { items: aggregated.roti, label: 'Bread', color: 'bg-orange-50 text-orange-700 border-orange-100', icon: '🫓' },
    { items: aggregated.rice, label: 'Rice', color: 'bg-blue-50 text-blue-700 border-blue-100', icon: '🍚' },
    { items: aggregated.sides, label: 'Sides', color: 'bg-green-50 text-green-700 border-green-100', icon: '🥗' },
    { items: aggregated.beverages, label: 'Beverages', color: 'bg-cyan-50 text-cyan-700 border-cyan-100', icon: '🍵' },
    { items: aggregated.dessert, label: 'Dessert', color: 'bg-pink-50 text-pink-700 border-pink-100', icon: '🍨' },
  ], [aggregated]);

  // Show aggregated summary as the single source of truth for slot composition
  const showAggregated = !isUserCompleted && meals.length > 0;

  // ─── Badge counter, scroll-into-view, and pulse for new item additions ──
  const [newItemsCount, setNewItemsCount] = useState(0);
  const [pulse, setPulse] = useState(false);
  const prevMealsLenRef = useRef(meals.length);
  const aggregationRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const prev = prevMealsLenRef.current;
    if (meals.length > prev) {
      const added = meals.length - prev;
      setNewItemsCount(c => c + added);
      setPulse(true);
      const timer = setTimeout(() => setPulse(false), 600);
      aggregationRef.current?.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
      return () => clearTimeout(timer);
    }
  }, [meals.length]);

  useEffect(() => {
    prevMealsLenRef.current = meals.length;
  });

  const slotMicrocopy = useMemo(() => {
    const options: Record<MealType, string[]> = {
      breakfast: ['Balanced for your morning ☀️', 'Light & energizing choices', 'Fresh start'],
      lunch: ['Hearty & wholesome', 'Midday nourishment', 'Popular in your region 🌏'],
      snacks: ['Quick bites', 'Light pick-me-ups', 'Evening treat'],
      dinner: ['Evening comfort 🌙', 'Winding down', 'Family-style favorites'],
    };
    const picks = options[mealType] ?? ['Perfect for today'];
    const idx = (meals.length + mealType.length) % picks.length;
    return picks[idx];
  }, [mealType, meals.length]);

  return (
    <div id={`slot-${date}-${mealType}`} className="space-y-3 scroll-mt-24">
      {/* ─── Skipped banner with undo CTA ─── */}
      {mode === 'skipped' && onUndoSkip && (
        <div className="rounded-[20px] bg-amber-50 border border-amber-200 overflow-hidden animate-in fade-in slide-in-from-top-1 duration-300">
          <div className="flex items-center justify-between px-4 py-3">
            <div className="flex items-center gap-2">
              <span className="text-xs text-amber-600">⏭️</span>
              <span className="text-xs font-bold text-amber-700">{slotLabel} — Skipped</span>
            </div>
            <button
              onClick={onUndoSkip}
              className="text-xs font-bold text-amber-700 underline active:opacity-60 flex items-center gap-1"
            >
              Restore Meal
            </button>
          </div>
        </div>
      )}

      {/* ─── User-completed: show Tomorrow preview (not in history/completed) ─── */}
      {isUserCompleted && tomorrowDate && mode !== 'history' && mode !== 'completed' && (
        <div className="rounded-[20px] bg-emerald-50 border border-emerald-200 overflow-hidden">
          <div className="flex items-center justify-between px-4 py-3 border-b border-emerald-100">
            <div className="flex items-center gap-2">
              <CheckCheck size={14} className="text-emerald-500" />
              <span className="text-xs font-bold text-emerald-700">{slotLabel} — Done!</span>
            </div>
            {onUndoComplete && (
              <button
                onClick={onUndoComplete}
                className="text-xs font-bold text-emerald-600 underline active:opacity-60"
              >
                Undo
              </button>
            )}
          </div>
          <div className="p-4">
            <p className="text-xs font-black uppercase tracking-widest text-gray-500 mb-2">Tomorrow's Plan</p>
            {tomorrowMeals && tomorrowMeals.length > 0 ? (
              <div className="space-y-2">
                {tomorrowMeals.map(item => (
                  <div key={item.id} className="flex items-center gap-3 p-2 rounded-xl bg-white/80">
                    <DishImage name={item.name} slot={slotLabel} size="sm" />
                    <span className="text-xs font-bold text-gray-700">{item.name}</span>
                  </div>
                ))}
              </div>
            ) : (
              <div className="flex items-center justify-between">
                <span className="text-xs text-gray-500">Nothing planned yet</span>
                <button
                  onClick={onOpenSearch}
                  className="flex items-center gap-1 text-xs font-bold text-[#FF385C]"
                >
                  Add dish <ChevronRight size={10} />
            </button>
          </div>
            )}
          </div>
        </div>
      )}

      {/* Contextual microcopy (above card group) */}
      {!isUserCompleted && meals.length > 0 && mode === 'active' && editable && (
        <div className="flex items-center gap-2 px-0.5">
          <div className="w-1 h-1 rounded-full bg-[#FF385C]/40" />
          <p className="text-sm text-gray-500 font-medium">{slotMicrocopy}</p>
        </div>
      )}

      {/* ─── Normal meal cards (with staggered entrance + hover effects) ─── */}
      {!isUserCompleted && meals.length > 0 && (
        <div className={`${cardClass} ${mergeExtraItems && meals.length > 1 ? 'space-y-0' : ''} card-section-enter`}>

          {mergeExtraItems && slotMeals.length > 1 ? (
            <>
              {/* Newest meal as primary card, older ones as extras below */}
              <div style={_ANIM_STYLE_0} className="card-enter">
                <MealCard
                  item={slotMeals[slotMeals.length - 1]!}
                  date={date}
                  mealType={mealType}
                  slot={slotLabel}
                  dishes={dishes}
                  userRegion={userRegion}
                  userDiet={userDiet}
                  isLocked={isLocked}
                  isMissed={isMissed}
                  editable={editable}
                  guestExtra={computeEffectiveServings(slotMeals[slotMeals.length - 1]!.quantity || 1, date, guestMode).extra}
                  onUpdateInline={onUpdateInline(date, mealType, slotMeals[slotMeals.length - 1]!.id)}
                  onRemove={onRemove(date, mealType, slotMeals[slotMeals.length - 1]!.id)}
                  swapCustomizeOpen={swapCustomizeOpenKey === slotMeals[slotMeals.length - 1]!.id}
                  onSwapCustomizeOpen={() => onSwapCustomizeOpen?.(slotMeals[slotMeals.length - 1]!.id)}
                  onSwapCustomizeClose={stableSwapCustomizeClose}
                  onShareSlot={onShareSlot}
                  hideSlotLabel={hideSlotLabel}
                />
              </div>
              <div className="px-5 pb-4 space-y-1.5">
                {(slotMeals.slice(0, -1) as TrayItem[]).reverse().map(extra => (
                  <div key={extra.id} style={_ANIM_STYLE_1} className="flex items-center gap-3 p-3 rounded-xl bg-white border border-gray-100 shadow-sm extra-card-enter active:scale-[0.99] transition-all">
                    <button onClick={() => onSwapCustomizeOpen?.(extra.id)} className="shrink-0 cursor-pointer hover:ring-2 hover:ring-emerald-300 hover:ring-offset-2 rounded-2xl active:scale-90 transition-all">
                      <DishImage name={extra.name} slot={slotLabel} size="md" />
                    </button>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-1.5 flex-wrap">
                        {extra.requestedBy && (
                          <span className={`text-sm font-bold px-1.5 py-0.5 rounded-full border flex-shrink-0 ${
                            memberName(extra.requestedBy) === '(left)'
                              ? 'bg-gray-100 border-gray-200 text-gray-500'
                              : 'bg-orange-100 border-orange-200 text-orange-700'
                          }`}>
                            🙋 {memberName(extra.requestedBy)}
                          </span>
                        )}
                        <span className="text-sm font-bold text-gray-800 truncate leading-snug">
                          {extra.name}
                        </span>
                        {(() => {
                            const seen = new Set<string>();
                            const primary = [extra.roti, extra.rice].filter(Boolean).map(s => (s as string).toLowerCase().trim());
                            primary.forEach(s => seen.add(s));
                            const secondary = [
                                ...(extra.sides ?? []),
                                ...(extra.beverages ?? []),
                                ...(extra.dessert ?? []),
                                extra.gravy,
                            ].filter(Boolean).filter(s => {
                                const key = (s as string).toLowerCase().trim();
                                if (seen.has(key)) return false;
                                seen.add(key);
                                return true;
                            });
                            const all = [...primary, ...secondary];
                            return all.length > 0 ? (
                                <span className="text-xs text-gray-400 font-medium leading-tight block">({all.join(', ')})</span>
                            ) : null;
                        })()}
                      </div>
                      
                      <div className="flex items-center gap-2 mt-1">
                        {editable ? (
                          <div className="flex items-center gap-1">
                            <button onClick={(e) => { e.stopPropagation(); onUpdateInline(date, mealType, extra.id)({ quantity: Math.max(1, (extra.quantity || 1) - 1) }); }}
                              className="w-7 h-7 rounded-lg flex items-center justify-center bg-gray-50 border border-gray-200 text-gray-500 active:scale-90 text-sm font-bold leading-none hover:bg-gray-100"
                            >−</button>
                            <span className="text-xs font-bold text-gray-700 tabular-nums min-w-[12px] text-center">{extra.quantity || 1}</span>
                            <button onClick={(e) => { e.stopPropagation(); onUpdateInline(date, mealType, extra.id)({ quantity: (extra.quantity || 1) + 1 }); }}
                              className="w-7 h-7 rounded-lg flex items-center justify-center bg-gray-50 border border-gray-200 text-gray-500 active:scale-90 text-sm font-bold leading-none hover:bg-gray-100"
                            >+</button>
                          </div>
                        ) : extra.quantity > 1 ? (
                          <span className="text-xs bg-gray-100 text-gray-500 px-2 py-0.5 rounded-full font-semibold flex-shrink-0">x{extra.quantity}</span>
                        ) : null}
                      </div>
                    </div>
                    {editable && (
                      <div className="flex flex-col gap-1 self-center">
                        <button onClick={() => onSwapCustomizeOpen?.(extra.id)}
                          className="w-7 h-7 rounded-lg flex items-center justify-center bg-gray-50 border border-gray-100 text-gray-500 active:scale-90 transition-all flex-shrink-0 hover:ring-2 hover:ring-emerald-300 hover:ring-offset-1"
                          aria-label={`Customize ${extra.name}`}
                        ><Sparkles size={11} /></button>
                        <button onClick={onRemove(date, mealType, extra.id)}
                          className="w-7 h-7 rounded-lg flex items-center justify-center bg-gray-50 border border-gray-100 text-gray-500 hover:bg-red-50 hover:text-red-500 active:scale-90 transition-all flex-shrink-0"
                          aria-label={`Remove ${extra.name}`}
                        ><X size={11} /></button>
                      </div>
                    )}
                  </div>
                ))}
              </div>

            </>
          ) : (
            <>
              {meals.map((item, idx) => (
              <div key={item.id} style={{ '--i': idx } as React.CSSProperties} className="card-enter">
                <MealCard
                  item={item}
                  date={date}
                  mealType={mealType}
                  slot={slotLabel}
                  dishes={dishes}
                  userRegion={userRegion}
                  userDiet={userDiet}
                  isLocked={isLocked}
                  isMissed={isMissed}
                  editable={editable}
                  guestExtra={computeEffectiveServings(item.quantity || 1, date, guestMode).extra}
                  onUpdateInline={onUpdateInline(date, mealType, item.id)}
                  onRemove={onRemove(date, mealType, item.id)}
                  swapCustomizeOpen={swapCustomizeOpenKey === item.id}
                  onSwapCustomizeOpen={() => onSwapCustomizeOpen?.(item.id)}
                  onSwapCustomizeClose={stableSwapCustomizeClose}
                  onShareSlot={onShareSlot}
                  hideSlotLabel={hideSlotLabel}
                />
              </div>
            ))}

            </>
          )}
        </div>
      )}

       {/* ─── Aggregated slot pairings — per person ─── */}
      {showAggregated && (
        <div ref={aggregationRef} className="aggregated-categories scroll-mt-24 mt-4 space-y-1.5">
          {(() => {
            const byPerson = new Map<string, TrayItem[]>();
            for (const m of meals) {
              const person = m.requestedBy ? memberName(m.requestedBy) : 'Me';
              if (!byPerson.has(person)) byPerson.set(person, []);
              byPerson.get(person)!.push(m);
            }
            if (byPerson.size === 0) return null;
            return Array.from(byPerson.entries()).map(([person, personMeals]) => {
              const agg = computeNormalizedComposition(personMeals);
              const cats = [
                { items: agg.gravy, icon: '🥩', label: 'Gravy' },
                { items: agg.roti, icon: '🫓', label: 'Bread' },
                { items: agg.rice, icon: '🍚', label: 'Rice' },
                { items: agg.sides, icon: '🥗', label: 'Sides' },
                { items: agg.beverages, icon: '🍵', label: 'Beverages' },
                { items: agg.dessert, icon: '🍨', label: 'Dessert' },
              ].filter(c => c.items.length > 0);
              if (cats.length === 0) return null;
              return (
                <div key={person} className="bg-white rounded-xl border border-gray-100 shadow-sm p-3">
                  <div className="flex items-center gap-2">
                    {personMeals.map((m, i) => (
                      <div key={m.id} className="relative cursor-pointer active:scale-95 transition-all shrink-0" onClick={() => { if (editable) onSwapCustomizeOpen?.(m.id); }}>
                        <div className={`w-[40px] h-[40px] rounded-xl overflow-hidden border-2 border-white shadow-sm ${i > 0 ? '-ml-3' : ''}`}>
                          <DishImage name={m.name} slot={slotLabel} size="full" className="w-full h-full object-cover" />
                        </div>
                      </div>
                    ))}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-1">
                        <span className="text-xs font-black uppercase tracking-widest text-gray-500">{slotLabel}</span>
                        {person !== 'Me' && (
                          <span className="text-xs font-bold px-1.5 py-0.5 rounded-full bg-orange-100 border border-orange-200 text-orange-700 leading-none">🙋 {person}</span>
                        )}
                      </div>
                      <div className="flex flex-wrap gap-1 mt-0.5">
                        {cats.map(cat => (
                          <button key={cat.icon} onClick={() => editable && setQuickEditCategory(cat.label)}
                            className="text-sm font-bold px-2.5 py-1.5 rounded-xl border leading-none bg-white border-gray-200 text-gray-600 hover:border-[#FF385C]/30 hover:text-[#FF385C] hover:bg-[#FFF0F3] cursor-pointer active:scale-95 transition-all shadow-sm"
                          >{cat.icon}</button>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              );
            });
          })()}
        </div>
      )}

      {/* ─── Plate Completion Banner + Swap All (replaces Add Dish) ─── */}
      {editable && !swapCustomizeOpenKey && meals.length > 0 && (
        <div className="flex gap-2">
          {onAddSuggestion && regionKey && (
            <div className="flex-1">
              <PlateCompletionBanner
                meals={meals}
                mealType={mealType}
                slotLabel={slotLabel}
                dishes={dishes}
                regionKey={regionKey}
                diet={userDiet}
                onAddSuggestion={onAddSuggestion}
                today={date}
              />
            </div>
          )}
          {onSwapAll && meals.length > 0 && (
            <button
              onClick={() => onSwapAll(date, mealType)}
              className="group flex items-center justify-center gap-1.5 py-2.5 px-3 rounded-xl border-2 border-emerald-200 bg-emerald-50 text-emerald-600 hover:bg-emerald-100 hover:border-emerald-300 active:scale-[0.98] transition-all text-xs font-bold"
            >
              <RefreshCw size={12} />
              Swap All
            </button>
          )}
        </div>
      )}

      {!isUserCompleted && meals.length === 0 && showSuggestions && !isLocked && (
        <SmartSuggestionChips
          date={date}
          mealType={mealType}
          userRegion={userRegion}
          userDiet={userDiet}
          pantryStaples={pantryStaples}
          onAddMeal={stableSuggestionAdd}
          onOpenSearch={() => setAddDishOpen(true)}
        />
      )}
      {!isUserCompleted && meals.length === 0 && showSuggestions && !isLocked && editable && onAddAnother && (
        <button
          onClick={() => setAddDishOpen(true)}
          className="w-full flex items-center justify-center gap-1.5 py-2 rounded-xl border border-dashed border-gray-200 text-gray-500 hover:text-emerald-600 hover:border-emerald-400 active:scale-[0.98] transition-all text-xs font-bold group"
        >
          <Plus size={12} className="transition-transform duration-200 group-hover:rotate-90" />
          Add Dish
        </button>
      )}
      {!isUserCompleted && meals.length === 0 && (!showSuggestions || isLocked) && (
        <div className="p-3 rounded-[20px] bg-gray-50 border border-gray-100 flex items-center justify-between">
          <span className="text-xs font-bold text-gray-500">{slotLabel}</span>
          <span className="text-xs text-gray-500">Time slot passed</span>
        </div>
      )}

      {/* ─── Slot-level action: Mark Complete ─── */}
      {!isUserCompleted && mode === 'active' && meals.length > 0 && (
        <div className="flex items-center gap-3 px-0.5">
          {onComplete && (
            <button onClick={onComplete}
              className="flex-1 flex items-center justify-center gap-2 py-3 rounded-xl bg-emerald-500 text-white text-xs font-bold shadow-sm active:scale-[0.98] transition-all hover:bg-emerald-600"
            >
              <CheckCheck size={14} />
              Mark Complete
            </button>
          )}
          {onSkipSlot && (
            <button onClick={onSkipSlot}
              className="flex items-center gap-1.5 py-3 px-4 rounded-xl bg-white border border-gray-200 text-gray-500 hover:text-gray-700 hover:border-gray-300 active:scale-[0.98] transition-all text-sm font-bold"
            >
              <Forward size={12} />
              Skip
            </button>
          )}
        </div>
      )}

      {/* ─── Style Balance Warnings (e.g. 2x Gravy) — only in editable modes ─── */}
      {editable && styleWarnings && styleWarnings.length > 0 && (
        <div className="space-y-2">
          {styleWarnings.map((w, i) => (
            <div key={i} className="rounded-xl bg-amber-50 border border-amber-200 p-3 flex items-start gap-3">
              <div className="flex-shrink-0 mt-0.5 w-5 h-5 rounded-full bg-amber-100 flex items-center justify-center">
                <Shuffle size={10} className="text-amber-600" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-bold text-amber-800">{w.message}</p>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Swap Customize Modal — exclusive with Add Dish modal */}
      {activeCustomizeItem && onSwapCustomizeApply && !addDishOpen && (
        <Suspense fallback={null}><SwapCustomizeModal
          key={`${slotLabel}_${date}`}
          isOpen={swapCustomizeOpenKey !== null}
          onClose={() => onSwapCustomizeClose?.()}
          date={date}
          mealType={mealType}
          slotLabel={slotLabel}
          item={activeCustomizeItem}
          dishes={dishes}
          userRegion={userRegion}
          userDiet={userDiet}
          onApply={handleModalApply}
          onAddAnother={onAddAnother}
          onChange={handleModalChange}
          onSwapDish={() => { onSwapCustomizeClose?.(); setAddDishOpen(true); }}
        /></Suspense>
      )}

      {/* Add Dish Modal — exclusive with Customize modal */}
      {addDishOpen && onAddAnother && !swapCustomizeOpenKey && (
        <DishSearchModal
          isOpen={addDishOpen}
          onClose={stableAddDishClose}
          dishes={dishes}
          mealType={mealType}
          userRegion={userRegion}
          userDiet={userDiet}
          onSelect={(dish) => { onAddAnother?.(date, mealType, dish); stableAddDishClose(); }}
        />
      )}

      {quickEditCategory && (
        <Suspense fallback={null}>
          <CategoryQuickEdit
            isOpen={quickEditCategory !== null}
            category={quickEditCategory}
            currentItems={(categoryConfig.find(c => c.label === quickEditCategory)?.items ?? []).map(i => ({ name: i.name, totalQty: i.totalQty }))}
            onClose={() => setQuickEditCategory(null)}
            onUpdateQty={handleAggregatedQty}
            onAddItem={handleAddPairing}
          />
        </Suspense>
      )}
    </div>
  );
});

export default SlotBody;
