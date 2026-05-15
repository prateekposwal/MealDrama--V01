// ─────────────────────────────────────────────────────────────────────────────
// SlotBody — Shared slot renderer for Dashboard, PlanScreen, MealTrayBuilder
// Eliminates duplicated MealCard prop-passing + empty-state + lock/missed logic
// ─────────────────────────────────────────────────────────────────────────────

import React, { useState, useMemo, useCallback } from 'react';
import type { MealType, TrayItem, GuestMode } from '../../store/useTrayStore';
import { computeEffectiveServings, resolveSlotTimes, aggregateSlotItems } from '../../types/tray';
import type { AggregatedCategory } from '../../types/tray';
import type { Dish } from '../../constants/dishLibrary';
import type { SuggestionMeal } from '../../lib/trayApi';
import { MealCard } from './MealCard';
import { SmartSuggestionChips } from './SmartSuggestionChips';
import { SwapCustomizeModal } from './SwapCustomizeModal';
import DishImage from '../new/DishImage';
import { CheckCheck, ChevronRight, Shuffle, Sparkles, X, Plus } from 'lucide-react';
import type { StyleWarning } from '../../constants/dishStyles';

export type SlotMode = 'active' | 'upcoming' | 'completed' | 'history' | 'builder';

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
  onRemove: (date: string, mealType: MealType, itemId: string) => () => void;
  onSuggestionAdd: (date: string, mealType: MealType) => (suggestion: SuggestionMeal) => void;
  onOpenSearch: () => void;
  swapCustomizeOpenKey?: string | null;
  onSwapCustomizeOpen?: (itemId: string) => void;
  onSwapCustomizeClose?: () => void;
  onSwapCustomizeApply?: (date: string, mealType: MealType, itemId: string) => (updates: Partial<TrayItem>) => void;
  onAddAnother?: (date: string, mealType: MealType, dish: Dish) => void;

  /** Mark this slot as completed (user action) */
  onComplete?: () => void;
  /** Undo completion */
  onUndoComplete?: () => void;
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

  /** Per-slot time preferences from user profile — overrides SLOT_TIME_DEFAULTS */
  preferences?: Record<string, { start: string; end: string }>;
}

const getISODate = (d: Date) => d.toLocaleDateString('en-CA');

function getModeBehavior(mode: SlotMode, date: string, slotLabel: string, meals: TrayItem[], mealType: MealType, preferences?: Record<string, { start: string; end: string }>) {
  const today = getISODate(new Date());
  const isToday = date === today;
  const now = new Date().getHours() + new Date().getMinutes() / 60;
  const { endHour } = resolveSlotTimes(meals, mealType, preferences);

  let isLocked = false;
  let isMissed = false;
  let editable = true;
  let showSuggestions = false;
  let cardClass = '';

  switch (mode) {
    case 'active':
      if (isToday) {
        isLocked = now > endHour;
        isMissed = now > endHour;
      }
      editable = true;
      showSuggestions = true;
      cardClass = 'ring-2 ring-[#FF385C]/25 rounded-[28px] overflow-hidden shadow-lg shadow-[#FF385C]/10';
      break;
    case 'upcoming':
      if (isToday) {
        isLocked = now > endHour;
        isMissed = now > endHour;
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
  }

  return { isLocked, isMissed, editable, showSuggestions, cardClass };
}

export const SlotBody: React.FC<SlotBodyProps> = React.memo(({
  date, mealType, slotLabel, meals, mode,
  dishes, userRegion, userDiet, pantryStaples,
  guestMode = { active: false, guestCount: 0, extraServings: 0, startDate: '', endDate: '' },
  swapOpenKey, onSwapOpen, onSwapClose,
  onSwapSelect, onUpdateInline, onRemove,
  onSuggestionAdd, onOpenSearch,
  swapCustomizeOpenKey, onSwapCustomizeOpen, onSwapCustomizeClose, onSwapCustomizeApply, onAddAnother,
  onComplete, onUndoComplete, isUserCompleted, tomorrowMeals, tomorrowDate,
  styleWarnings,
  mergeExtraItems,
  preferences,
}) => {
  const { isLocked, isMissed, editable, showSuggestions, cardClass } = useMemo(
    () => getModeBehavior(mode, date, slotLabel, meals, mealType, preferences),
    [mode, date, slotLabel, meals, mealType, preferences],
  );

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

  const [addDishOpen, setAddDishOpen] = useState(false);

  const ADD_DISH_DUMMY: TrayItem = {
    id: '__add_dish__', meal_id: '__add_dish__', name: '', icon: '',
    quantity: 1, servings: 1, smartVersion: 1,
    gravy: null, roti: null, rice: null,
    sides: [], beverages: [], dessert: [], itemQtys: {},
  };

  const aggregated = useMemo(() => aggregateSlotItems(meals), [meals]);

  const handleAggregatedQty = useCallback((name: string, delta: number) => {
    const hasItem = (item: TrayItem) =>
      item.roti === name || item.rice === name || item.gravy === name ||
      item.sides?.includes(name) || item.beverages?.includes(name) || item.dessert?.includes(name);
    const targets = meals.filter(hasItem);
    if (targets.length === 0) return;
    let remaining = Math.abs(delta);
    const sign = delta > 0 ? 1 : -1;
    for (const item of targets) {
      if (remaining <= 0) break;
      const current = item.itemQtys?.[name] ?? 1;
      const next = Math.max(1, current + sign);
      if (next !== current) {
        const capped = sign > 0 ? Math.min(remaining, next - current) : -Math.min(remaining, current - 1);
        if (capped !== 0) {
          onUpdateInline(date, mealType, item.id)({ itemQtys: { ...item.itemQtys, [name]: current + capped } });
          remaining -= Math.abs(capped);
        }
      }
    }
  }, [meals, date, mealType, onUpdateInline]);

  const categoryConfig = [
    { items: aggregated.gravy, label: 'Gravy', color: 'bg-amber-50 text-amber-700 border-amber-100' },
    { items: aggregated.roti, label: 'Bread', color: 'bg-orange-50 text-orange-700 border-orange-100' },
    { items: aggregated.rice, label: 'Rice', color: 'bg-blue-50 text-blue-700 border-blue-100' },
    { items: aggregated.sides, label: 'Sides', color: 'bg-gray-50 text-gray-500 border-gray-100' },
    { items: aggregated.beverages, label: 'Beverages', color: 'bg-gray-50 text-gray-500 border-gray-100' },
    { items: aggregated.dessert, label: 'Dessert', color: 'bg-pink-50 text-pink-700 border-pink-100' },
  ];

  const showAggregated = !isUserCompleted && meals.length > 0 && (!mergeExtraItems || meals.length === 1);

  return (
    <div className="space-y-3">
      {/* ─── User-completed: show Tomorrow preview ─── */}
      {isUserCompleted && tomorrowDate && (
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
              </div>
            )}
          </div>
        </div>
      )}

      {/* ─── Normal meal cards ─── */}
      {!isUserCompleted && meals.length > 0 && (
        <div className={`${cardClass} ${mergeExtraItems && meals.length > 1 ? 'space-y-0' : ''}`}>
          {mergeExtraItems && meals.length > 1 ? (
            <>
              <MealCard
                item={meals[0]}
                date={date}
                mealType={mealType}
                slot={slotLabel}
                dishes={dishes}
                userRegion={userRegion}
                userDiet={userDiet}
                isLocked={isLocked}
                isMissed={isMissed}
                editable={editable}
                guestExtra={computeEffectiveServings(meals[0].quantity || 1, date, guestMode).extra}
                swapOpen={swapOpenKey === meals[0].id}
                onSwapOpen={() => onSwapOpen(meals[0].id)}
                onSwapClose={onSwapClose}
                onSwapSelect={onSwapSelect(date, mealType, meals[0].id)}
                onUpdateInline={onUpdateInline(date, mealType, meals[0].id)}
                onRemove={onRemove(date, mealType, meals[0].id)}
                swapCustomizeOpen={swapCustomizeOpenKey === meals[0].id}
                onSwapCustomizeOpen={() => onSwapCustomizeOpen?.(meals[0].id)}
                onSwapCustomizeClose={() => onSwapCustomizeClose?.()}
              />
              <div className="px-5 pb-4 -mt-2 space-y-1.5">
                {meals.slice(1).map(extra => (
                  <div
                    key={extra.id}
                    className="flex items-center gap-3 p-2 rounded-xl bg-gray-50 border border-gray-100"
                  >
                    <DishImage name={extra.name} slot={slotLabel} size="sm" />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-1.5">
                        <span className="text-xs font-bold text-gray-700 truncate">
                          {extra.title || extra.name}
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
                      {(extra.gravy || extra.roti || extra.rice || extra.sides?.length > 0 || extra.beverages?.length > 0 || extra.dessert?.length > 0) && (
                        <div className="flex flex-wrap items-center gap-1 mt-0.5">
                          {extra.gravy && (
                            <span className="text-[8px] font-bold bg-amber-50 text-amber-700 px-1.5 py-0.5 rounded-full border border-amber-100">
                              {extra.gravy}
                            </span>
                          )}
                          {extra.roti && (
                            <span className="text-[8px] font-bold bg-orange-50 text-orange-700 px-1.5 py-0.5 rounded-full border border-orange-100">
                              {extra.roti}
                            </span>
                          )}
                          {extra.rice && (
                            <span className="text-[8px] font-bold bg-blue-50 text-blue-700 px-1.5 py-0.5 rounded-full border border-blue-100">
                              {extra.rice}
                            </span>
                          )}
                          {extra.sides?.length > 0 && (
                            <span className="text-[8px] font-medium text-gray-500 bg-gray-50 px-1.5 py-0.5 rounded-full border border-gray-100">
                              {extra.sides.join(', ')}
                            </span>
                          )}
                          {extra.beverages?.length > 0 && (
                            <span className="text-[8px] font-medium text-gray-500 bg-gray-50 px-1.5 py-0.5 rounded-full border border-gray-100">
                              {extra.beverages.join(', ')}
                            </span>
                          )}
                          {extra.dessert?.length > 0 && (
                            <span className="text-[8px] font-bold bg-pink-50 text-pink-700 px-1.5 py-0.5 rounded-full border border-pink-100">
                              🍨 {extra.dessert.join(', ')}
                            </span>
                          )}
                        </div>
                      )}
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
                          className="w-6 h-6 rounded-lg flex items-center justify-center bg-red-50 border border-red-100 text-red-400 active:scale-90 transition-all flex-shrink-0"
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
            meals.map(item => (
              <div key={item.id}>
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
                  onSwapCustomizeClose={() => onSwapCustomizeClose?.()}
                />
              </div>
            ))
          )}
        </div>
      )}

      {/* ─── Add Dish button (slots with meals) ─── */}
      {editable && onAddAnother && meals.length > 0 && (
        <button
          onClick={() => setAddDishOpen(true)}
          className="w-full flex items-center justify-center gap-1.5 py-2 rounded-xl border border-dashed border-gray-200 text-gray-400 hover:text-[#FF385C] hover:border-[#FF385C]/30 active:scale-[0.98] transition-all text-[10px] font-bold"
        >
          <Plus size={12} />
          Add Dish
        </button>
      )}

      {/* ─── Aggregated slot items per category ─── */}
      {showAggregated && (
        <div className="pt-1 pb-2 space-y-2">
          {categoryConfig.map(cat => cat.items.length > 0 && (
            <div key={cat.label}>
              <p className="text-[9px] font-black uppercase tracking-widest text-gray-400 mb-1">{cat.label}</p>
              <div className="flex flex-wrap items-center gap-1.5">
                {cat.items.map((agg: AggregatedCategory) => (
                  <span key={agg.name} className={`text-[9px] font-bold px-2 py-0.5 rounded-full border ${cat.color} inline-flex items-center gap-1`}>
                    {cat.label === 'Dessert' && '🍨 '}{agg.name}
                    <span className="inline-flex items-center gap-0.5 ml-1">
                      <button
                        onClick={() => handleAggregatedQty(agg.name, -1)}
                        className="w-3.5 h-3.5 flex items-center justify-center rounded-full bg-gray-100 text-[8px] font-bold text-gray-600 active:bg-gray-200 leading-none"
                      >−</button>
                      <span className="text-[9px] font-bold text-gray-700 min-w-[8px] text-center tabular-nums">{agg.totalQty}</span>
                      <button
                        onClick={() => handleAggregatedQty(agg.name, 1)}
                        className="w-3.5 h-3.5 flex items-center justify-center rounded-full bg-gray-100 text-[8px] font-bold text-gray-600 active:bg-gray-200 leading-none"
                      >+</button>
                      <span className="text-[7px] text-gray-400 ml-0.5">{agg.unit}</span>
                    </span>
                  </span>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}

      {!isUserCompleted && meals.length === 0 && showSuggestions && !isLocked && (
        <SmartSuggestionChips
          date={date}
          mealType={mealType}
          userRegion={userRegion}
          userDiet={userDiet}
          pantryStaples={pantryStaples}
          onAddMeal={onSuggestionAdd(date, mealType)}
          onOpenSearch={onOpenSearch}
        />
      )}
      {!isUserCompleted && meals.length === 0 && showSuggestions && !isLocked && editable && onAddAnother && (
        <button
          onClick={() => setAddDishOpen(true)}
          className="w-full flex items-center justify-center gap-1.5 py-2 rounded-xl border border-dashed border-gray-200 text-gray-400 hover:text-[#FF385C] hover:border-[#FF385C]/30 active:scale-[0.98] transition-all text-[10px] font-bold"
        >
          <Plus size={12} />
          Add Dish
        </button>
      )}
      {!isUserCompleted && meals.length === 0 && (!showSuggestions || isLocked) && (
        <div className="p-3 rounded-[20px] bg-gray-50 border border-gray-100 flex items-center justify-between">
          <span className="text-xs font-bold text-gray-400">{slotLabel}</span>
          <span className="text-[10px] text-gray-400">Time slot passed</span>
        </div>
      )}

      {/* ─── Mark Complete button (active slots with meals) ─── */}
      {!isUserCompleted && mode === 'active' && meals.length > 0 && onComplete && (
        <button
          onClick={onComplete}
          className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-700 active:scale-[0.98] transition-all text-xs font-bold"
        >
          <CheckCheck size={14} />
          Mark {slotLabel} as Complete
        </button>
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

      {/* Swap Customize Modal */}
      {activeCustomizeItem && onSwapCustomizeApply && (
        <SwapCustomizeModal
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
        />
      )}

      {/* Add Dish Modal (opens directly in search/add mode) */}
      {addDishOpen && onAddAnother && (
        <SwapCustomizeModal
          isOpen={addDishOpen}
          onClose={() => setAddDishOpen(false)}
          date={date}
          mealType={mealType}
          slotLabel={slotLabel}
          item={ADD_DISH_DUMMY}
          dishes={dishes}
          userRegion={userRegion}
          userDiet={userDiet}
          onApply={() => {}}
          onAddAnother={onAddAnother}
          initialAddMode={true}
        />
      )}
    </div>
  );
});

export default SlotBody;
