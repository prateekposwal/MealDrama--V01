// ─────────────────────────────────────────────────────────────────────────────
// SlotBody — Shared slot renderer for Dashboard, PlanScreen, MealTrayBuilder
// Eliminates duplicated MealCard prop-passing + empty-state + lock/missed logic
// ─────────────────────────────────────────────────────────────────────────────

import React, { useState, useMemo, useCallback, useRef, useEffect, lazy, Suspense } from 'react';
import type { MealType, TrayItem, GuestMode } from '../../store/useTrayStore';
import { computeEffectiveServings, resolveSlotTimes, isAfterEnd } from '../../types/tray';
import type { AggregatedCategory } from '../../types/tray';
import type { DishVariant } from '../../constants/dishLibrary';
import { useNormalizedComposition } from './useNormalizedComposition';
import type { Dish } from '../../constants/dishLibrary';
import type { SuggestionMeal } from '../../lib/trayApi';
import { MealCard } from './MealCard';
import { SLOT_META } from './MealCard';
import { SmartSuggestionChips } from './SmartSuggestionChips';
import { TimeBadge, TimeEditor } from './TimeComponents';
const SwapCustomizeModal = lazy(() => import('./SwapCustomizeModal'));
import DishImage from '../new/DishImage';
import { CheckCheck, ChevronRight, Forward, Shuffle, Sparkles, X, Plus } from 'lucide-react';
import type { StyleWarning } from '../../constants/dishStyles';
import { useStore } from '../../store/useStore';
import { useTrayStore } from '../../store/useTrayStore';
import { generateMealTitle } from '../../utils/generateMealTitle';
import { pickFeaturedMeals } from '../../utils/mealRotation';
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
  pantryStaples: string[];
  guestMode?: GuestMode;
  swapOpenKey: string | null;
  onSwapOpen: (itemId: string) => void;
  onSwapClose: () => void;
  onSwapSelect: (date: string, mealType: MealType, itemId: string) => (newMealId: string, chipOverrides?: Record<string, unknown>) => void;
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
      cardClass = 'ring-2 ring-[#FF385C]/25 rounded-[28px] overflow-hidden shadow-lg shadow-[#FF385C]/10';
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
      cardClass = 'rounded-[28px] opacity-40 pointer-events-none select-none';
      break;
    case 'history':
      isLocked = false;
      isMissed = false;
      editable = false;
      showSuggestions = false;
      cardClass = 'rounded-[28px] opacity-60 pointer-events-none select-none';
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
  dishes, userRegion, userDiet, pantryStaples,
  guestMode = { active: false, guestCount: 0, extraServings: 0, startDate: '', endDate: '' },
  swapOpenKey, onSwapOpen, onSwapClose,
  onSwapSelect, onUpdateInline, onRemove,
  onSuggestionAdd, onOpenSearch,
  swapCustomizeOpenKey,     onUndoSkip,
    onSwapCustomizeOpen, onSwapCustomizeClose, onSwapCustomizeApply, onAddAnother,
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
  const lastFeaturedTimes = useTrayStore(s => s.lastFeaturedTimes);
  const markFeatured = useTrayStore(s => s.markFeatured);
  const featuredRef = useRef<string[] | null>(null);

  // Loop-aware guidance: check if this date+slot has a loop assignment
  const loopConfig = useTrayStore(s => s.mealLoop.config);
  const loopAssignments = useTrayStore(s => s.mealLoop.assignments);
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

  // Stable callbacks for memo'd children
  const stableSwapCustomizeClose = useCallback(() => onSwapCustomizeClose?.(), [onSwapCustomizeClose]);
  const stableAddDishClose = useCallback(() => setAddDishOpen(false), []);
  const stableSuggestionAdd = useCallback(
    (meal: SuggestionMeal) => onSuggestionAdd(date, mealType)(meal),
    [onSuggestionAdd, date, mealType],
  );

  const categoryConfig = useMemo(() => [
    { items: aggregated.gravy, label: 'Gravy', color: 'bg-amber-50 text-amber-700 border-amber-100' },
    { items: aggregated.roti, label: 'Bread', color: 'bg-orange-50 text-orange-700 border-orange-100' },
    { items: aggregated.rice, label: 'Rice', color: 'bg-blue-50 text-blue-700 border-blue-100' },
    { items: aggregated.sides, label: 'Sides', color: 'bg-gray-50 text-gray-500 border-gray-100' },
    { items: aggregated.beverages, label: 'Beverages', color: 'bg-gray-50 text-gray-500 border-gray-100' },
    { items: aggregated.dessert, label: 'Dessert', color: 'bg-pink-50 text-pink-700 border-pink-100' },
  ], [aggregated]);

  // Show aggregated summary as the single source of truth for slot composition
  const showAggregated = !isUserCompleted && meals.length > 0;
  const [aggregatedExpanded, setAggregatedExpanded] = useState(false);

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
              className="text-[10px] font-bold text-amber-700 underline active:opacity-60 flex items-center gap-1"
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
                className="text-[10px] font-bold text-emerald-600 underline active:opacity-60"
              >
                Undo
              </button>
            )}
          </div>
          <div className="p-4">
            <p className="text-[9px] font-black uppercase tracking-widest text-gray-500 mb-2">Tomorrow's Plan</p>
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
                  className="flex items-center gap-1 text-[10px] font-bold text-[#FF385C]"
                >
                  Add dish <ChevronRight size={10} />
            </button>
            <ChevronRight size={16} className={`text-gray-400 transition-transform duration-200 ${aggregatedExpanded ? 'rotate-90' : ''}`} />
          </div>
            )}
          </div>
        </div>
      )}

      {/* Contextual microcopy (above card group) */}
      {!isUserCompleted && meals.length > 0 && mode === 'active' && editable && (
        <div className="flex items-center gap-2 px-0.5">
          <div className="w-1 h-1 rounded-full bg-[#FF385C]/40" />
          <p className="text-[11px] text-gray-500 font-medium">{slotMicrocopy}</p>
        </div>
      )}

      {/* ─── Normal meal cards (with staggered entrance + hover effects) ─── */}
      {!isUserCompleted && meals.length > 0 && (
        <div className={`${cardClass} ${mergeExtraItems && meals.length > 1 ? 'space-y-0' : ''} card-section-enter`}>

          {mergeExtraItems && slotMeals.length > 1 ? (
            <>
              <div style={_ANIM_STYLE_0} className="card-enter">
                <MealCard
                  item={slotMeals[0]!}
                  date={date}
                  mealType={mealType}
                  slot={slotLabel}
                  dishes={dishes}
                  userRegion={userRegion}
                  userDiet={userDiet}
                  isLocked={isLocked}
                  isMissed={isMissed}
                  editable={editable}
                  guestExtra={computeEffectiveServings(slotMeals[0]!.quantity || 1, date, guestMode).extra}
                  swapOpen={swapOpenKey === slotMeals[0]!.id}
                  onSwapOpen={() => onSwapOpen(slotMeals[0]!.id)}
                  onSwapClose={onSwapClose}
                  onSwapSelect={onSwapSelect(date, mealType, slotMeals[0]!.id)}
                  onUpdateInline={onUpdateInline(date, mealType, slotMeals[0]!.id)}
                  onRemove={onRemove(date, mealType, slotMeals[0]!.id)}
                  swapCustomizeOpen={swapCustomizeOpenKey === slotMeals[0]!.id}
                  onSwapCustomizeOpen={() => onSwapCustomizeOpen?.(slotMeals[0]!.id)}
                  onSwapCustomizeClose={stableSwapCustomizeClose}
                  onShareSlot={onShareSlot}
                  hideSlotLabel={hideSlotLabel}
                />
              </div>
              <div className="px-5 pb-4 -mt-2 space-y-1.5">
                {(slotMeals.slice(1) as TrayItem[]).map(extra => (
                  <div key={extra.id} style={_ANIM_STYLE_1} className="flex items-center gap-3 p-2 rounded-xl bg-gray-50 border border-gray-100 extra-card-enter">
                    <DishImage name={extra.name} slot={slotLabel} size="sm" />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-1.5">
                        <span className="text-xs font-bold text-gray-700 truncate">
                          {extra.name}
                        </span>
                        {extra.quantity > 1 && (
                          <span className="text-[8px] bg-gray-100 text-gray-500 px-1.5 py-0.5 rounded-full font-semibold flex-shrink-0">
                            x{extra.quantity}
                          </span>
                        )}
                        {extra.style && (
                          <span className="text-[8px] font-bold bg-indigo-50 text-indigo-600 px-1.5 py-0.5 rounded-full border border-indigo-100 flex-shrink-0">
                            {extra.style}
                          </span>
                        )}
                      </div>
                    </div>
                    {editable && (
                      <div className="flex items-center gap-1">
                        <button
                          onClick={() => onSwapCustomizeOpen?.(extra.id)}
                          className="w-6 h-6 rounded-lg flex items-center justify-center bg-gray-50 border border-gray-100 text-gray-400 active:scale-90 transition-all flex-shrink-0"
                          aria-label={`Customize ${extra.name}`}
                        >
                          <Sparkles size={10} />
                        </button>
                        <button
                          onClick={onRemove(date, mealType, extra.id)}
                          className="w-6 h-6 rounded-lg flex items-center justify-center bg-gray-50 border border-gray-200 text-gray-500 active:scale-90 transition-all flex-shrink-0"
                          aria-label={`Remove ${extra.name}`}
                        >
                          <X size={10} />
                        </button>
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
                  swapOpen={swapOpenKey === item.id}
                  onSwapOpen={() => onSwapOpen(item.id)}
                  onSwapClose={onSwapClose}
                  onSwapSelect={onSwapSelect(date, mealType, item.id)}
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

      {/* ─── Aggregated slot items per category (collapsible) ─── */}
      {showAggregated && (
        <div ref={aggregationRef} className="aggregated-categories scroll-mt-24">
          <div className={`group flex items-center justify-between rounded-xl border-2 ${SLOT_META[slotLabel]?.color || 'border-emerald-200'} ${SLOT_META[slotLabel]?.bg || 'bg-emerald-50/80'} px-3 py-2.5 ${pulse ? 'animate-pulse-ring' : ''}`}>
            <button
              onClick={() => {
                setAggregatedExpanded(prev => !prev);
                if (!aggregatedExpanded) setNewItemsCount(0);
              }}
              className="flex-1 flex items-center gap-2 text-left hover:brightness-95 active:scale-[0.98] transition-all -m-2 p-2"
            >
              <div className="flex items-center -space-x-2">
                <div className="relative">
                  <DishImage name={meals[0]?.name || slotLabel} slot={slotLabel} size="sm" />
                  {meals[0] && (() => {
                    const qty = meals[0].itemQtys ? Object.values(meals[0].itemQtys).reduce((a, b) => a + b, 0) : meals[0].quantity;
                    return qty > 1 ? <span className="absolute -bottom-0.5 -right-0.5 bg-gray-900 text-white text-[8px] font-bold leading-none px-1 py-0.5 rounded-full min-w-[14px] text-center">×{qty}</span> : null;
                  })()}
                </div>
                {meals.length > 1 && (
                  <div className="relative">
                    <DishImage name={meals[1]?.name || slotLabel} slot={slotLabel} size="sm" />
                    {meals[1] && (() => {
                      const qty = meals[1].itemQtys ? Object.values(meals[1].itemQtys).reduce((a, b) => a + b, 0) : meals[1].quantity;
                      return qty > 1 ? <span className="absolute -bottom-0.5 -right-0.5 bg-gray-900 text-white text-[8px] font-bold leading-none px-1 py-0.5 rounded-full min-w-[14px] text-center">×{qty}</span> : null;
                    })()}
                  </div>
                )}
              </div>
              <div>
                <span className={`text-xs font-black uppercase tracking-widest ${SLOT_META[slotLabel]?.color?.replace('border-', 'text-').replace('100', '700') || 'text-emerald-800'}`}>{slotLabel}</span>
                <span className="block text-[10px] font-medium text-gray-600 group-hover:hidden">Flavor Flow Mapping</span>
                <span className="hidden group-hover:block text-[10px] font-semibold text-gray-700">Build your ideal {slotLabel.toLowerCase()}</span>
              </div>
              {newItemsCount > 0 && (
                <span className="ml-auto mr-1 flex items-center justify-center min-w-[20px] h-[18px] px-1.5 rounded-full bg-[#FF385C] text-white text-[9px] font-bold leading-none animate-in fade-in zoom-in">
                  +{newItemsCount}
                </span>
              )}
            </button>
          </div>
          {aggregatedExpanded && (
            <div className="flex flex-col gap-2 mt-2 px-2 pb-2">
              {categoryConfig.filter(cat => cat.items.length > 0).map(cat => (
                <div key={cat.label} className="flex flex-col gap-1">
                  <span className="text-[9px] font-black uppercase tracking-widest text-gray-400">{cat.label}</span>
                  <div className="flex flex-wrap items-center gap-1">
                    {cat.items.map((agg: AggregatedCategory) => (
                      <span key={agg.name} className="text-[10px] font-bold px-1.5 py-0.5 rounded-xl border inline-flex items-center gap-1 aggregated-chip select-none" style={_CHIP_STYLE}>
                        <span className={`${cat.color} contents`}>
                          {cat.label === 'Dessert' && '🍨 '}{agg.name}
                        </span>
                        <span className="inline-flex items-center gap-0.5">
                          {editable && (
                            <button
                              onClick={() => handleAggregatedQty(agg.name, -1)}
                              className="min-w-[28px] min-h-[28px] flex items-center justify-center rounded-lg bg-gray-100 text-gray-600 active:scale-95 active:opacity-80 transition-transform duration-100 text-xs font-bold leading-none"
                              aria-label={`Decrease ${agg.name}`}
                            >−</button>
                          )}
                          <span className="text-xs font-bold text-gray-700 min-w-[18px] text-center tabular-nums select-none">{agg.totalQty}</span>
                          {editable && (
                            <button
                              onClick={() => handleAggregatedQty(agg.name, 1)}
                              className="min-w-[28px] min-h-[28px] flex items-center justify-center rounded-lg bg-gray-100 text-gray-600 active:scale-95 active:opacity-80 transition-transform duration-100 text-xs font-bold leading-none"
                              aria-label={`Increase ${agg.name}`}
                            >+</button>
                          )}
                          <span className="text-[9px] text-gray-400 select-none">{agg.unit}</span>
                        </span>
                      </span>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ─── Add Dish button (slots with meals) ─── */}
      {editable && onAddAnother && meals.length > 0 && (
        <button
          onClick={() => setAddDishOpen(true)}
          className="group w-full flex items-center justify-center gap-1.5 py-2.5 rounded-xl border-2 border-dashed border-emerald-300 text-emerald-500 hover:text-emerald-600 hover:border-emerald-400 hover:shadow-lg hover:shadow-emerald-200/50 active:scale-[0.98] transition-all text-[10px] font-bold"
        >
          <Plus size={12} className="transition-transform duration-200 group-hover:rotate-90" />
          Add Dish
        </button>
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
          className="w-full flex items-center justify-center gap-1.5 py-2 rounded-xl border border-dashed border-gray-200 text-gray-400 hover:text-emerald-600 hover:border-emerald-400 active:scale-[0.98] transition-all text-[10px] font-bold group"
        >
          <Plus size={12} className="transition-transform duration-200 group-hover:rotate-90" />
          Add Dish
        </button>
      )}
      {!isUserCompleted && meals.length === 0 && (!showSuggestions || isLocked) && (
        <div className="p-3 rounded-[20px] bg-gray-50 border border-gray-100 flex items-center justify-between">
          <span className="text-xs font-bold text-gray-400">{slotLabel}</span>
          <span className="text-[10px] text-gray-400">Time slot passed</span>
        </div>
      )}

      {/* ─── Slot-level actions: Skip & Mark Complete ─── */}
      {!isUserCompleted && mode === 'active' && meals.length > 0 && (
        <div className="flex gap-2">
          {onComplete && (
            <button
              onClick={onComplete}
              className="group flex-1 flex items-center justify-center gap-1.5 py-2 rounded-xl border border-dashed border-emerald-300 text-emerald-500 hover:text-emerald-600 hover:border-emerald-400 active:scale-[0.98] transition-all text-[10px] font-bold"
            >
              <CheckCheck size={10} className="transition-transform duration-200 group-hover:scale-110" />
              Complete
            </button>
          )}
          {onSkipSlot && (
            <button
              onClick={onSkipSlot}
              className="group flex-1 flex items-center justify-center gap-1.5 py-2 rounded-xl border border-dashed border-gray-200 text-gray-400 hover:text-[#FF385C] hover:border-[#FF385C]/30 active:scale-[0.98] transition-all text-[10px] font-bold"
            >
              <Forward size={10} className="transition-transform duration-200 group-hover:-translate-x-0.5" />
              Skip {slotLabel}
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
                <p className="text-[11px] font-bold text-amber-800">{w.message}</p>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Swap Customize Modal — exclusive with Add Dish modal */}
      {activeCustomizeItem && onSwapCustomizeApply && !addDishOpen && (
        <SwapCustomizeModal
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
        />
      )}

      {/* Add Dish Modal — exclusive with Customize modal */}
      {addDishOpen && onAddAnother && !swapCustomizeOpenKey && (
        <SwapCustomizeModal
          key={`add_${slotLabel}_${date}`}
          isOpen={addDishOpen}
          onClose={stableAddDishClose}
          date={date}
          mealType={mealType}
          slotLabel={slotLabel}
          item={_ADD_DISH_DUMMY}
          dishes={dishes}
          userRegion={userRegion}
          userDiet={userDiet}
          onApply={_NOOP}
          onAddAnother={onAddAnother}
          initialAddMode={true}
          onChange={handleModalChange}
        />
      )}
      <style>{`
        .card-section-enter {
          animation: fadeInUp 0.45s ease-out both;
        }
        .card-enter {
          animation: cardIn 0.35s ease-out calc(var(--i, 0) * 0.07s) both;
        }
        .extra-card-enter {
          animation: fadeInUp 0.3s ease-out calc(var(--i, 0) * 0.05s) both;
        }
        .card-enter:hover {
          transform: scale(1.02);
          box-shadow: 0 8px 24px rgba(0,0,0,0.08);
          transition: transform 0.2s ease, box-shadow 0.2s ease;
        }
        .card-enter {
          transition: transform 0.2s ease, box-shadow 0.2s ease;
          border-radius: 28px;
        }
        .aggregated-category {
          transition: opacity 0.3s ease, transform 0.3s ease;
        }
        .aggregated-chip {
          touch-action: manipulation;
          transition: opacity 0.2s ease, transform 0.2s ease;
        }
        .aggregated-chip:hover {
          transform: scale(1.02);
        }
        @keyframes fadeInUp {
          from { opacity: 0; transform: translateY(10px); }
          to { opacity: 1; transform: translateY(0); }
        }
        @keyframes cardIn {
          from { opacity: 0; transform: translateY(12px) scale(0.97); }
          to { opacity: 1; transform: translateY(0) scale(1); }
        }
        @keyframes pulseRing {
          0% { box-shadow: 0 0 0 0 rgba(16, 185, 129, 0.5); }
          70% { box-shadow: 0 0 0 8px rgba(16, 185, 129, 0); }
          100% { box-shadow: 0 0 0 0 rgba(16, 185, 129, 0); }
        }
        .animate-pulse-ring {
          animation: pulseRing 0.6s ease-out 2;
        }
        @media (prefers-reduced-motion: reduce) {
          .card-section-enter,
          .card-enter,
          .extra-card-enter,
          .aggregated-category,
          .aggregated-chip {
            animation: none !important;
            transition: none !important;
            transform: none !important;
          }
          .card-enter:hover {
            transform: none !important;
            box-shadow: none !important;
          }
        }
      `}</style>

    </div>
  );
});

export default SlotBody;
