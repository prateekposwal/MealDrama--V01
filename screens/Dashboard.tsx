// ─────────────────────────────────────────────────────────────────────────────
// Dashboard — Today's meals (read-only + edit link)
// Empty slots show QuickAddRow
// ─────────────────────────────────────────────────────────────────────────────

import React, { useState, useMemo, useCallback, useEffect, useRef, lazy, Suspense } from 'react';
import { useTrayStore, MealType, TrayItem } from '../store/useTrayStore';
import type { Meal } from '../types/tray';
import type { SuggestionMeal } from '../lib/trayApi';
const QuickAddModal = lazy(() => import('../components/new/QuickAddModal'));
const SwapCustomizeModal = lazy(() => import('../components/meal/SwapCustomizeModal').then(m => ({ default: m.SwapCustomizeModal })));
import TrayScreen from '../components/new/TrayScreen';
import WhatsAppShareModal from '../components/new/WhatsAppShareModal';

import { useBackendDishes } from '../hooks/useBackendDishes';
import { MapPin, Flame, ChevronRight, Plus, X, Info, CheckCircle2, Heart, Phone, MessageCircle, RefreshCw, ArrowRight } from 'lucide-react';
import type { Dish, DishVariant } from '../constants/dishLibrary';
import { HealthTipsPanel } from '../components/health/HealthTipsPanel';
import { PlateBalanceVisualizer } from '../components/health/PlateBalanceVisualizer';
import { scorePlateBalance } from '../utils/nutritionScore';
import { DISH_HEALTH_MAP, COMPONENT_HEALTH_MAP } from '../constants/healthGuidelines';
import { ServingsBreakdown } from '../components/meal/ServingsBreakdown';
import { SlotBody, SlotBodyProps, SlotMode } from '../components/meal/SlotBody';
import { useSwapCustomize } from '../components/meal/SwapCustomizeModalContext';
import LoopAutoFillSlot from '../components/meal/LoopAutoFillSlot';
import { dishToMeal } from '../utils/dishToMeal';
import { suggestionToMeal } from '../utils/suggestionUtils';
import { getShareStrings, ShareLanguage } from '../utils/share';

import { computeStyleWarnings, type StyleWarning } from '../constants/dishStyles';
import { resolveSlotTimes, aggregateSlotItems, getSkipUndoWindowExpiry, isSlotActive, isAfterEnd } from '../types/tray';
import { getISODate } from '../utils/dateUTC';

/** Fallback whole-grain keywords matched against dish/component names when health maps are missing */
const WHOLE_GRAIN_NAMES = [
  'brown rice', 'brown bread', 'whole wheat', 'whole meal',
  'multigrain', 'multi-grain', 'whole grain',
  'roti', 'phulka', 'bhakri', 'jolada', 'bafla', 'thepla',
  'oats', 'oatmeal', 'millet', 'ragi', 'jowar', 'bajra', 'quinoa',
  'paratha', 'pav',
];

/** Fallback refined-grain keywords */
const REFINED_GRAIN_NAMES = [
  'white rice', 'white bread', 'refined',
  'maida', 'naan', 'puri', 'bhature', 'bread',
  'biryani', 'pulao',
  'rice',
];

function inferGrainCategory(name: string): string | null {
  const lower = name.toLowerCase();
  for (const kw of WHOLE_GRAIN_NAMES) {
    if (lower.includes(kw)) return 'whole-grain';
  }
  for (const kw of REFINED_GRAIN_NAMES) {
    if (lower.includes(kw)) return 'refined-grain';
  }
  return null;
}

type Slot = 'Breakfast' | 'Lunch' | 'Snacks' | 'Dinner';

const SLOTS: { key: Slot; mealType: MealType; label: Slot; startHour: number; endHour: number }[] = [
    { key: 'Breakfast', mealType: 'breakfast', label: 'Breakfast', startHour: 6, endHour: 10 },
    { key: 'Lunch', mealType: 'lunch', label: 'Lunch', startHour: 11, endHour: 15 },
    { key: 'Snacks', mealType: 'snacks', label: 'Snacks', startHour: 15, endHour: 18 },
    { key: 'Dinner', mealType: 'dinner', label: 'Dinner', startHour: 19, endHour: 23 },
];

type MealSection = 'active' | 'upcoming' | 'completed' | 'skipped';

/** Categorize each slot based on current time — uses per-slot start_time/end_time */
const categorizeSlots = (
    getMeals: (date: string, mealType: MealType) => TrayItem[],
    today: string,
    completions?: Record<string, number>,
    preferences?: Record<string, { start: string; end: string }>,
    skipped?: Record<string, number>,
): { section: MealSection; slot: typeof SLOTS[0] }[] => {
    const result = SLOTS.map(slot => {
        const meals = getMeals(today, slot.mealType);
        const { start, end } = resolveSlotTimes(meals, slot.mealType, preferences);
        const key = `${today}::${slot.mealType}`;
        const isUserCompleted = completions?.[key] != null;
        const isSkipped = skipped?.[key] != null;
        const withinWindow = isSlotActive(start, end);
        const pastEnd = isAfterEnd(start, end);
        let section: MealSection;
        if (isSkipped) section = 'skipped';
        else if (isUserCompleted) section = 'completed';
        else if (pastEnd && !withinWindow) section = 'completed';
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

// ─── Slot Wrapper (stabilizes inline callbacks for React.memo) ───
interface DashboardSlotRowProps extends
  Omit<SlotBodyProps, 'onOpenSearch' | 'onComplete' | 'onUndoComplete' | 'onSkipSlot' | 'onUndoSkip'> {
  onOpenSearchAction: (slotLabel: string) => void;
  onCompleteAction: ((date: string, mealType: MealType) => void) | undefined;
  onUndoCompleteAction: ((date: string, mealType: MealType) => void) | undefined;
  onSkipSlotAction: ((date: string, mealType: MealType) => void) | undefined;
  onUndoSkipAction: ((date: string, mealType: MealType) => void) | undefined;
}

const DashboardSlotRow = React.memo<DashboardSlotRowProps>(({
  date, mealType, slotLabel,
  onOpenSearchAction,
  onCompleteAction,
  onUndoCompleteAction,
  onSkipSlotAction,
  onUndoSkipAction,
  ...rest
}) => {
  const onOpenSearch = useCallback(() => {
    onOpenSearchAction(slotLabel);
  }, [slotLabel, onOpenSearchAction]);

  const onComplete = useCallback(() => {
    onCompleteAction?.(date, mealType);
  }, [date, mealType, onCompleteAction]);

  const onUndoComplete = useCallback(() => {
    onUndoCompleteAction?.(date, mealType);
  }, [date, mealType, onUndoCompleteAction]);

  const onSkipSlot = useCallback(() => {
    onSkipSlotAction?.(date, mealType);
  }, [date, mealType, onSkipSlotAction]);

  const onUndoSkip = useCallback(() => {
    onUndoSkipAction?.(date, mealType);
  }, [date, mealType, onUndoSkipAction]);

  return (
    <SlotBody
      date={date}
      mealType={mealType}
      slotLabel={slotLabel}
      onOpenSearch={onOpenSearch}
      onComplete={onCompleteAction ? onComplete : undefined}
      onUndoComplete={onUndoCompleteAction ? onUndoComplete : undefined}
      onSkipSlot={onSkipSlotAction ? onSkipSlot : undefined}
      onUndoSkip={onUndoSkipAction ? onUndoSkip : undefined}
      {...rest}
    />
  );
});


interface DashboardProps {
    user: any;
    onNavigate?: (tab: string) => void;
    onManageTray?: () => void;
}

const getTodayISO = getISODate;

export const Dashboard: React.FC<DashboardProps> = ({ user, onNavigate, onManageTray }) => {
    const { dishes } = useBackendDishes();
    // Only update `today` at midnight — no need to tick every 60s
    const [today, setToday] = useState(() => getTodayISO());
    useEffect(() => {
      const now = new Date();
      const msUntilMidnight = new Date(
        now.getFullYear(), now.getMonth(), now.getDate() + 1
      ).getTime() - now.getTime();
      const id = setTimeout(() => setToday(getTodayISO()), msUntilMidnight);
      return () => clearTimeout(id);
    }, []);

    const {
        getMeals, addMealToSlot, swapMealInSlot, updateItemInline, removeMealFromSlot,
        guestMode, completions, skipped, completeSlot, undoCompleteSlot, skipSlot, undoSkipSlot,
    } = useTrayStore();

    const [swapOpenKey, setSwapOpenKey] = useState<string | null>(null);
    const { openKey: swapCustomizeOpenKey, setOpenKey: setSwapCustomizeOpenKey } = useSwapCustomize();

    const stableSwapOpen = useCallback((id: string) => {
        setSwapOpenKey(prev => prev === id ? null : id);
    }, []);
    const stableSwapClose = useCallback(() => setSwapOpenKey(null), []);
    const stableSwapCustomizeOpen = useCallback((id: string) => {
        setSwapCustomizeOpenKey(id);
    }, []);
    const stableSwapCustomizeClose = useCallback(() => setSwapCustomizeOpenKey(null), []);

    const quickAddTrigger = useRef({ slot: '' as 'Breakfast' | 'Lunch' | 'Snacks' | 'Dinner' });
    const handleOpenSearchStable = useCallback(() => {
        setQuickAddSlot(quickAddTrigger.current.slot);
        setShowQuickAdd(true);
    }, []);
    const openSearchAction = useCallback((slotLabel: string) => {
        quickAddTrigger.current = { slot: slotLabel as 'Breakfast' | 'Lunch' | 'Snacks' | 'Dinner' };
        handleOpenSearchStable();
    }, [handleOpenSearchStable]);
    const [showQuickAdd, setShowQuickAdd] = useState(false);
    const [addAnotherToast, setAddAnotherToast] = useState<string | null>(null);
    const [quickAddSlot, setQuickAddSlot] = useState<'Breakfast' | 'Lunch' | 'Snacks' | 'Dinner'>('Lunch');
    const [showTrayScreen, setShowTrayScreen] = useState(false);
    const [undoSlot, setUndoSlot] = useState<{ date: string; mealType: MealType; type: 'complete' | 'skip' } | null>(null);
    const [showSlotPicker, setShowSlotPicker] = useState(false);
    const [addDishOpen, setAddDishOpen] = useState(false);
    const [addDishSlot, setAddDishSlot] = useState<MealType>('breakfast');

    const ADD_DISH_DUMMY = useMemo<TrayItem>(() => ({
        id: '__add_dish__', meal_id: '__add_dish__', name: '', icon: '',
        quantity: 1, servings: 1, smartVersion: 1,
        gravy: null, roti: null, rice: null,
        sides: [], beverages: [], dessert: [], itemQtys: {},
    }), []);

    const currentSlotMeals = useTrayStore(s => s.plan.days[today]?.[quickAddSlot.toLowerCase() as MealType]);
    const todayMealData = useTrayStore(s => s.plan.days[today]);
    const selectedDishIds = useMemo(() => currentSlotMeals?.map(item => item.meal_id) ?? [], [currentSlotMeals]);
    const [showGuide, setShowGuide] = useState(() => {
        if (typeof window !== 'undefined') {
            return localStorage.getItem('mealdrama_guide_dismissed') !== 'true';
        }
        return true;
    });
    const dismissGuide = useCallback(() => {
        localStorage.setItem('mealdrama_guide_dismissed', 'true');
        setShowGuide(false);
    }, []);
    const [shareType, setShareType] = useState<'prep' | 'pantry' | null>(null);
    const [slotTimesRefreshKey, setSlotTimesRefreshKey] = useState(0);
    useEffect(() => {
        const handler = () => setSlotTimesRefreshKey(k => k + 1);
        window.addEventListener('slot_times_updated', handler);
        return () => window.removeEventListener('slot_times_updated', handler);
    }, []);
    // Auto-skip past untouched slots — reads state directly from store (no stale closures)
    useEffect(() => {
        const store = useTrayStore.getState();
        for (const slot of SLOTS) {
            const key = `${today}::${slot.mealType}`;
            const meals = store.getMeals(today, slot.mealType);
            if (meals.length === 0) continue;
            if (store.completions[key] != null || store.skipped[key] != null) continue;
            const { start, end } = resolveSlotTimes(meals, slot.mealType);
            if (isAfterEnd(start, end)) {
                store.skipSlot(today, slot.mealType);
            }
        }
    }, [today]);

    // Exclude undoSlot from completions/skipped so categorizeSlots treats it as not yet done during the undo window
    const committedCompletions = useMemo(() => {
        if (!undoSlot) return completions;
        const key = `${undoSlot.date}::${undoSlot.mealType}`;
        const next = { ...completions };
        delete next[key];
        return next;
    }, [completions, undoSlot]);

    const handleCompleteSlot = useCallback((date: string, mealType: MealType) => {
        completeSlot(date, mealType);
        setUndoSlot({ date, mealType, type: 'complete' });
        setTimeout(() => setUndoSlot(null), 10000);
    }, [completeSlot]);

    const handleUndoComplete = useCallback((date: string, mealType: MealType) => {
        undoCompleteSlot(date, mealType);
        setUndoSlot(null);
    }, [undoCompleteSlot]);

    const handleSkipSlot = useCallback((date: string, mealType: MealType) => {
        skipSlot(date, mealType);
        setUndoSlot({ date, mealType, type: 'skip' });
        setTimeout(() => setUndoSlot(null), 8000);
    }, [skipSlot]);

    const handleUndoSkip = useCallback((date: string, mealType: MealType) => {
        undoSkipSlot(date, mealType);
        setUndoSlot(null);
    }, [undoSkipSlot]);

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
    const handleQuickAddMeal = useCallback((date: string, slot: string, dish: Dish, variant?: DishVariant) => {
        const mealType = slot.toLowerCase() as MealType;
        addMealToSlot(date, mealType, dishToMeal(dish, variant), {
            variant: variant?.name,
            variantId: variant?.id,
            addon: variant?.addOn,
        });
        setShowQuickAdd(false);
    }, [addMealToSlot]);

    const handleAddAnother = useCallback((date: string, mealType: MealType, dish: Dish, variant?: DishVariant) => {
        const meal = dishToMeal(dish, variant);
        const existing = getMeals(date, mealType);
        const existingItem = existing.find(m => m.meal_id === dish.id);
        if (existingItem) {
            updateItemInline(date, mealType, existingItem.id, {
                quantity: (existingItem.quantity || 1) + 1,
                sides: [...new Set([...(existingItem.sides || []), ...(meal.sideOptions || [])])],
                variant: variant?.name || existingItem.variant,
                variantId: variant?.id || existingItem.variantId,
                addon: variant?.addOn || existingItem.addon,
            });
            setAddAnotherToast(`Added to ${mealType.charAt(0).toUpperCase() + mealType.slice(1)}`);
        } else {
            addMealToSlot(date, mealType, meal, {
                variant: variant?.name,
                variantId: variant?.id,
                addon: variant?.addOn,
            });
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
                const dishNames = meals.map(m => {
                    const dishQty = (m.quantity || 1) > 1 ? ` x${m.quantity}` : '';
                    return `  • ${m.name}${dishQty}`;
                }).join('\n');
                const agg = aggregateSlotItems(meals);
                const allComps = [
                    ...agg.gravy.map(c => ({ name: c.name, qty: c.totalQty, unit: c.unit })),
                    ...agg.roti.map(c => ({ name: c.name, qty: c.totalQty, unit: c.unit })),
                    ...agg.rice.map(c => ({ name: c.name, qty: c.totalQty, unit: c.unit })),
                    ...agg.sides.map(c => ({ name: c.name, qty: c.totalQty, unit: c.unit })),
                    ...agg.beverages.map(c => ({ name: c.name, qty: c.totalQty, unit: c.unit })),
                    ...agg.dessert.map(c => ({ name: c.name, qty: c.totalQty, unit: c.unit })),
                ];
                const compLines = allComps
                    .filter(c => c.qty > 0)
                    .map(c => `  • ${c.name} x${c.qty} ${c.unit}`)
                    .join('\n');
                return `• ${slot.label}:\n${dishNames}${compLines ? '\n' + compLines : ''}`;
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
    const categorizedSlots = useMemo(() => categorizeSlots(getMeals, today, committedCompletions, preferences, skipped), [getMeals, today, committedCompletions, preferences, skipped, slotTimesRefreshKey]);
    const activeSlots = categorizedSlots.filter(s => s.section === 'active');
    const upcomingSlots = categorizedSlots.filter(s => s.section === 'upcoming');
    const completedSlots = categorizedSlots.filter(s => s.section === 'completed');
    const skippedSlots = categorizedSlots.filter(s => s.section === 'skipped');

    const displaySlots = categorizedSlots;
    const displayActiveUpcomingSlots = useMemo(() => displaySlots.filter(s => s.section !== 'completed' && s.section !== 'skipped'), [displaySlots]);
    const displayCompletedSlots = useMemo(() => categorizedSlots.filter(s => s.section === 'completed' || s.section === 'skipped'), [categorizedSlots]);

    const [mealTab, setMealTab] = useState<'upcoming' | 'history'>('upcoming');
    const [healthExpanded, setHealthExpanded] = useState(false);

    // H11: plateScore only depends on meal content, not slot timing.
    // We derive slot lists directly from getMeals to avoid recomputing
    // when slotTimesRefreshKey changes (which only affects time display).
    const plateScore = useMemo(() => {
      const slotTypes = ['breakfast', 'lunch', 'snacks', 'dinner'] as const;
      const allSlots = slotTypes.map(mt => ({
        mealType: mt,
        meals: getMeals(today, mt),
      }));

      const allMeals = allSlots.flatMap(({ mealType, meals }) => {
        if (meals.length === 0) return [];

        const categories: string[] = [];
        const tags: string[] = [];

        for (const m of meals) {
          const meta = DISH_HEALTH_MAP[m.meal_id];
          if (meta) {
            categories.push(...meta.healthCategories);
            tags.push(...meta.tags);
            if (!meta.healthCategories.some(c => c === 'whole-grain' || c === 'refined-grain')) {
              const inferred = inferGrainCategory(m.name);
              if (inferred) categories.push(inferred);
            }
          } else {
            const inferred = inferGrainCategory(m.name);
            if (inferred) categories.push(inferred);
          }
        }

        const seen = new Set<string>();
        for (const m of meals) {
          const names = [
            m.roti, m.rice, m.gravy,
            ...(m.sides ?? []),
            ...(m.beverages ?? []),
            ...(m.dessert ?? []),
          ].filter(Boolean) as string[];
          for (const name of names) {
            const key = name.trim().toLowerCase();
            if (!seen.has(key)) {
              seen.add(key);
              const componentMeta = COMPONENT_HEALTH_MAP[name];
              if (componentMeta) {
                categories.push(...componentMeta.healthCategories);
                tags.push(...componentMeta.tags);
                if (!componentMeta.healthCategories.some(c => c === 'whole-grain' || c === 'refined-grain')) {
                  const inferred = inferGrainCategory(name);
                  if (inferred) categories.push(inferred);
                }
              } else {
                const inferred = inferGrainCategory(name);
                if (inferred) categories.push(inferred);
              }
            }
          }
        }

        return [{
          name: mealType,
          healthCategories: categories,
          tags,
          quantity: 1,
        }];
      });

      // ─── Keyword-based whole-grain detection (catches items MISSING from health maps) ───
      const GRAIN_KEYWORDS = ['roti', 'phulka', 'bhakri', 'paratha', 'thepla', 'brown rice', 'oats', 'millet', 'jowar', 'bajra', 'ragi', 'whole wheat', 'multigrain', 'bran'];
      const rawMeals = allSlots.flatMap(({ meals }) => meals);
      const activeItems = rawMeals.filter(m => (m.quantity || 1) > 0);
      const grainNames: string[] = [];
      for (const m of activeItems) {
        const dishName = m.name.toLowerCase();
        if (GRAIN_KEYWORDS.some(k => dishName.includes(k))) grainNames.push(m.name);
        const comps = [m.roti, m.rice, ...(m.sides ?? []), ...(m.beverages ?? []), ...(m.dessert ?? [])].filter(Boolean) as string[];
        for (const c of comps) {
          if (GRAIN_KEYWORDS.some(k => c.toLowerCase().includes(k))) {
            grainNames.push(`${m.name}→${c}`);
          }
        }
      }
      if (grainNames.length > 0) {
        for (let i = 0; i < grainNames.length; i++) {
          (allMeals as Array<{ name: string; healthCategories: string[]; tags: string[]; quantity: number }>).push({ name: `keyword-grain-${i}`, healthCategories: ['whole-grain'], tags: [], quantity: 1 });
        }
      }

      const result = scorePlateBalance(allMeals);

      // ─── Brute-force keyword detection for Healthy Fats & Low Sugar ───
      const HEALTHY_FAT_KEYWORDS = ['ghee', 'butter', 'paneer', 'cheese', 'coconut', 'avocado', 'fish', 'almond', 'cashew', 'walnut', 'peanut', 'nuts', 'sesame', 'til', 'mustard oil', 'olive oil', 'sunflower oil', 'coconut oil', 'sesame oil', 'fish oil', 'seed', 'flaxseed', 'chia', 'omega', 'tahini'];
      const LOW_SUGAR_KEYWORDS = ['water', 'chaas', 'buttermilk', 'nimbu', 'coconut water', 'salad', 'raita', 'curd', 'dahi', 'pickle', 'chutney', 'no sugar', 'unsweetened', 'sugar free', 'zero sugar', 'natural sweetener', 'stevia', 'jaggery', 'date', 'khajur', 'gur', 'low glycemic', 'diabetic friendly'];

      const getAllItemNames = (item: TrayItem): string[] => {
        return [
          item.name,
          item.roti,
          item.rice,
          item.gravy,
          ...(item.sides ?? []),
          ...(item.beverages ?? []),
          ...(item.dessert ?? []),
        ].filter(Boolean) as string[];
      };

      const itemMatchesKeywords = (item: TrayItem, keywords: string[]): boolean => {
        const allNames = getAllItemNames(item).map(n => n.toLowerCase());
        return keywords.some(k => allNames.some(n => n.includes(k)));
      };

      const fatsMatched = activeItems.filter(i => (i.quantity ?? 1) > 0 && itemMatchesKeywords(i, HEALTHY_FAT_KEYWORDS));
      const healthyFatsCount = fatsMatched.reduce((sum, i) => sum + (i.quantity ?? 1), 0);

      const sugarMatched = activeItems.filter(i => (i.quantity ?? 1) > 0 && itemMatchesKeywords(i, LOW_SUGAR_KEYWORDS));
      const lowSugarCount = sugarMatched.reduce((sum, i) => sum + (i.quantity ?? 1), 0);

      result.categories.healthyFat = Math.min(10, healthyFatsCount);
      result.categories.limitSugary = Math.min(5, lowSugarCount);
      result.total = Math.max(0, result.categories.vegFruit + result.categories.wholeGrain + result.categories.protein + result.categories.healthyFat + result.categories.limitSugary + result.categories.limitRedMeat);

      return result;
    }, [today, getMeals]);
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
                        className="w-10 h-10 rounded-2xl shadow border flex items-center justify-center active:scale-95 transition-all bg-white border-gray-100 overflow-hidden"
                        aria-label="Open profile settings"
                    >
                        <img src="/logo.png" alt="Profile" className="w-full h-full object-cover" />
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
                            Swap dishes, add dishes, or adjust your meal flavour flow anytime. Changes save automatically.
                        </p>
                    </div>
                    <button onClick={dismissGuide} aria-label="Dismiss guide"><X size={14} className="text-gray-400" /></button>
                </div>
            )}

            {/* Loop config CTA — UPDATED: now points to Profile → Plan Settings instead of Tray screen */}
            {!loopConfigured && displayActiveUpcomingSlots.length > 0 && (
              <div className="mx-6 mt-4 p-4 rounded-[20px] border-2 border-amber-200 bg-amber-50">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-amber-100 flex items-center justify-center shrink-0">
                    <RefreshCw size={18} className="text-amber-600" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-black text-amber-800">Future days are empty</p>
                    <p className="text-[11px] text-amber-700 leading-tight mt-0.5">Set up a meal loop in Profile → Plan Settings to auto-fill upcoming days</p>
                  </div>
                  <button
                    onClick={() => onNavigate?.('profile')}
                    className="shrink-0 px-4 py-2 rounded-xl bg-amber-600 text-white text-[10px] font-black uppercase tracking-widest active:scale-95 transition-all flex items-center gap-1"
                    aria-label="Go to Profile to configure meal loop"
                  >
                    Go <ArrowRight size={12} />
                  </button>
                </div>
              </div>
            )}

            {/* Health Insights */}
            <div className="mx-6 mt-4">
                <button
                    onClick={() => setHealthExpanded(!healthExpanded)}
                    className="w-full flex items-center justify-between p-3 rounded-xl bg-emerald-50 border border-emerald-100 active:scale-[0.99] transition-all"
                    aria-label="Toggle health insights"
                    aria-expanded={healthExpanded}
                >
                    <div className="flex items-center gap-2">
                        <Heart size={14} className="text-emerald-500" />
                        <span className="text-[10px] font-black uppercase tracking-widest text-emerald-700">Health Insights</span>
                    </div>
                    <ChevronRight size={14} className={`text-emerald-400 transition-transform ${healthExpanded ? 'rotate-90' : ''}`} />
                </button>
                {healthExpanded && (
                    <div className="mt-3 space-y-3">
                        {displaySlots.some(({ slot }) => getMeals(today, slot.mealType).length > 0) ? (
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
            <div className="px-6 mt-6 grid grid-cols-2 gap-2.5">
                <button
                    onClick={() => onNavigate?.('plan')}
                    className="p-4 rounded-[24px] bg-gray-900 text-white flex items-center gap-2 active:scale-95 transition-all"
                    aria-label="Open weekly meal plan"
                >
                    <div className="flex-1 min-w-0">
                        <p className="text-[9px] font-black uppercase tracking-widest opacity-50 mb-0.5">Weekly</p>
                        <p className="text-[13px] font-bold whitespace-nowrap">Let's Cook</p>
                    </div>
                    <ChevronRight size={16} className="opacity-50 shrink-0" />
                </button>
                <button
                    onClick={() => onNavigate?.('pulse')}
                    className="p-4 rounded-[24px] bg-[#FF385C] text-white flex items-center gap-2 active:scale-95 transition-all"
                    aria-label="Open pantry pulse"
                >
                    <div className="flex-1 min-w-0">
                        <p className="text-[9px] font-black uppercase tracking-widest opacity-70 mb-0.5">Pantry</p>
                        <p className="text-[13px] font-bold whitespace-nowrap">What's Needed</p>
                    </div>
                    <ChevronRight size={16} className="opacity-70 shrink-0" />
                </button>
            </div>

            {/* ─── TODAY'S MEALS — Day-wise view with all slots ─── */}
            <div className="px-6 mt-6">
                <div className="flex items-center gap-2 mb-3">
                    <div className="text-base" aria-hidden="true">📅</div>
                    <p className="text-[11px] font-black uppercase tracking-widest text-gray-900">
                        Today's Meals
                    </p>
                    <span className="text-[11px] font-bold text-gray-600 ml-auto">
                        {new Date(today).toLocaleDateString('en-IN', { weekday: 'long', month: 'short', day: 'numeric' })}
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
                        {(completedSlots.length + skippedSlots.length) > 0 && (
                            <span className="ml-1.5 text-[8px] opacity-60">{completedSlots.length + skippedSlots.length}</span>
                        )}
                    </button>
                </div>

                {/* Slot list */}
                <div className="space-y-4">
                    {mealTab === 'upcoming' && displayActiveUpcomingSlots.length === 0 ? (
                        <div className="py-8 text-center">
                            <div className="text-4xl mb-2">🎉</div>
                            <p className="text-sm font-bold text-gray-800">All done for today!</p>
                            <p className="text-xs text-gray-500 mt-1">
                                {displayCompletedSlots.length > 0
                                    ? 'Check History to see what you cooked'
                                    : 'Add meals to get started'}
                            </p>
                            {displayCompletedSlots.length > 0 && (
                                <button
                                    onClick={() => setMealTab('history')}
                                    className="mt-3 px-4 py-2 rounded-full bg-gray-900 text-white text-[10px] font-black uppercase tracking-widest active:scale-95 transition-all"
                                >
                                    View History
                                </button>
                            )}
                        </div>
                    ) : (mealTab === 'upcoming' ? displayActiveUpcomingSlots : displayCompletedSlots).length > 0 ? (
                        (mealTab === 'upcoming' ? displayActiveUpcomingSlots : displayCompletedSlots).map(({ section, slot }) => {
                        const slotDate = today;
                        const slotMeals = getMeals(slotDate, slot.mealType);
                        const prefs = preferences;
                        const completionKey = `${today}::${slot.mealType}`;
                        const isUserCompleted = completions[completionKey] != null;
                        const isSkipped = skipped[completionKey] != null;
                        const isUndoing = undoSlot?.date === today && undoSlot?.mealType === slot.mealType;
                        const isUndoSkipWindowActive = isSkipped && Date.now() < getSkipUndoWindowExpiry(slot.mealType, preferences);
                        const tomorrowDate = getTodayISO(new Date(new Date(slotDate).getTime() + 86400000));
                        const tomorrowMeals = getMeals(tomorrowDate, slot.mealType);
                        const styleWarnings = computeStyleWarnings(slotMeals.map(m => ({ mealId: m.meal_id, name: m.name })));
                        const sectionColors: Record<string, string> = {
                            active: 'border-l-[#FF385C]',
                            upcoming: 'border-l-gray-300',
                            completed: 'border-l-gray-200',
                            skipped: 'border-l-amber-300',
                        };
                        const sectionLabels: Record<string, string> = {
                            active: 'Now',
                            upcoming: 'Upcoming',
                            completed: 'Done',
                            skipped: 'Skipped',
                        };
                        return (
                            <div key={slot.key} className={`border-l-2 pl-3 ${sectionColors[section]}`}>
                                <LoopAutoFillSlot date={today} mealType={slot.mealType} />
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
                                <DashboardSlotRow
                                    date={slotDate}
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
                                    swapCustomizeOpenKey={swapCustomizeOpenKey}
                                    onSwapCustomizeOpen={stableSwapCustomizeOpen}
                                    onSwapCustomizeClose={stableSwapCustomizeClose}
                                    onSwapCustomizeApply={handleSwapCustomizeApply}
                                    onAddAnother={handleAddAnother}
                                    isUserCompleted={isUserCompleted && !isUndoing}
                                    tomorrowDate={tomorrowDate}
                                    tomorrowMeals={tomorrowMeals}
                                    styleWarnings={styleWarnings}
                                    preferences={prefs}
                                    onOpenSearchAction={openSearchAction}
                                    onCompleteAction={handleCompleteSlot}
                                    onUndoCompleteAction={handleUndoComplete}
                                    onSkipSlotAction={!isUserCompleted && !isSkipped ? handleSkipSlot : undefined}
                                    onUndoSkipAction={isUndoSkipWindowActive ? handleUndoSkip : undefined}
                                />
                            </div>
                        );
                    })) : null}
                </div>

                {/* All-day servings breakdown */}
                <div className="mt-4">
                    <ServingsBreakdown
                        items={displaySlots.flatMap(({ slot }) => getMeals(today, slot.mealType))}
                        title="Today's Serving Load"
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
                        <span className="text-sm font-medium">
                            {undoSlot.type === 'skip'
                                ? `${undoSlot.mealType.charAt(0).toUpperCase() + undoSlot.mealType.slice(1)} skipped`
                                : 'Marked as complete'
                            }
                        </span>
                        <button
                            onClick={() => undoSlot.type === 'skip'
                                ? handleUndoSkip(undoSlot.date, undoSlot.mealType)
                                : handleUndoComplete(undoSlot.date, undoSlot.mealType)
                            }
                            className="text-emerald-400 font-bold text-sm active:opacity-60"
                        >
                            Undo
                        </button>
                    </div>
                </div>
            )}

            {/* Add Another toast */}
            {addAnotherToast && (
                <div className="fixed top-4 left-4 right-4 z-[100] mx-auto max-w-lg animate-in slide-in-from-top-2 fade-in duration-200">
                    <div className="bg-emerald-600 text-white px-4 py-3 rounded-2xl shadow-2xl flex items-center justify-between">
                        <div className="flex items-center gap-2">
                            <span className="text-lg">✓</span>
                            <span className="font-medium text-sm">{addAnotherToast}</span>
                        </div>
                        <button
                            onClick={() => setAddAnotherToast(null)}
                            className="ml-2 p-1 hover:bg-white/20 rounded-lg"
                        >
                            <X size={16} />
                        </button>
                    </div>
                </div>
            )}

            {/* FAB */}
            <div className="fixed bottom-24 right-6 z-[60]">
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
                <div className="fixed inset-0 z-[60]" onClick={() => setShowSlotPicker(false)}>
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
                                        setAddDishSlot(key.toLowerCase() as MealType);
                                        setAddDishOpen(true);
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

            {/* Add Dish Modal — SwapCustomizeModal in search/add mode (FAB flow) */}
            {addDishOpen && (
                <SwapCustomizeModal
                    key={`add_${addDishSlot}_${today}`}
                    isOpen={addDishOpen}
                    onClose={() => setAddDishOpen(false)}
                    date={today}
                    mealType={addDishSlot}
                    slotLabel={addDishSlot.charAt(0).toUpperCase() + addDishSlot.slice(1)}
                    item={ADD_DISH_DUMMY}
                    dishes={dishes}
                    userRegion={user?.region ?? 'India'}
                    userDiet={user?.diet ?? 'veg'}
                    onApply={() => {}}
                    onAddAnother={handleAddAnother}
                    onChange={() => {}}
                    initialAddMode={true}
                />
            )}

            {/* Tray Screen */}
            <TrayScreen
                isOpen={showTrayScreen}
                onClose={() => setShowTrayScreen(false)}
                initialDate={today}
                onNavigateToLoopSettings={() => onNavigate?.('profile')}
            />
        </div>
    );
};

export default Dashboard;
