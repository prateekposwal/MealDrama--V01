import React, { useState, useCallback, useMemo, useRef, useEffect } from 'react';
import { useDebounce } from '../../hooks/useDebounce';
import { useAsyncGuard, ModalLifecycleGuard, DeferredSync } from '../../utils/asyncGuard';
import type { MealType, TrayItem } from '../../store/useTrayStore';
import { applySmartDefaults } from '../../store/useTrayStore';
import type { Meal } from '../../types/tray';
import type { Dish, DishVariant, Region, Category } from '../../constants/dishLibrary';
import { dishToMeal } from '../../utils/dishToMeal';
import { resolveDisplayName } from '../../utils/resolveDisplayName';
import { scoreDish } from '../../utils/nutritionScore';
import { HealthScoreBadge } from '../health/HealthScoreBadge';
import {
  indian_meal_categories, getRecommendedCategories, getDishStyle,
  isStreetFood, isNutItem, getItemRegion, mergeCategoryOptions,
  CATEGORY_CONFIG, DISH_STYLES, STYLE_GROUP_ICONS, getPairingSuggestions,
  internalToStyleGroup, styleGroupToInternal,
} from '../../constants/dishStyles';
import type { IndianMealCategory, DishStyleGroup } from '../../constants/dishStyles';
import { useStore } from '../../store/useStore';
import { VirtualList } from '../new/VirtualList';
import { HealthFilterBar } from '../health/HealthFilterBar';
import { filterDishesByHealth, sortDishesByHealth, getFilterPreset } from '../../utils/healthSortFilter';
import type { HealthSortKey, HealthFilterPreset } from '../../utils/healthSortFilter';
import DishImage from '../new/DishImage';
import { generateMealTitle } from '../../utils/generateMealTitle';
import {
  X, Search, Sparkles, Check, ChevronLeft, ChevronDown, Plus, Minus, AlertTriangle, Info,
} from 'lucide-react';

const DIET_FILTER: Record<string, string[]> = {
  veg: ['veg'],
  'non-veg': ['veg', 'non-veg', 'eggitarian'],
  eggitarian: ['veg', 'eggitarian', 'non-veg'],
  vegan: ['veg', 'vegan'],
};

const ICON_MAP: Record<string, string> = {
  curry: '🍛', dry: '🥘', tadka: '🫕', gravy: '🍛',
  roti: '🫓', naan: '🫓', paratha: '🫓', 'tandoori roti': '🫓', puri: '🫓',
  'butter naan': '🫓', 'garlic naan': '🫓', bhakri: '🫓', thepla: '🫓',
  luchi: '🫓', bafla: '🫓', 'plain dosa': '🫓', appam: '🫓',
  'steamed rice': '🍚', 'jeera rice': '🍚', pulao: '🍚', biryani: '🍚',
  'lemon rice': '🍚', 'sticky rice': '🍚', 'fried rice': '🍚',
  curd: '🥛', butter: '🧈', salad: '🥗', pickle: '🥒',
  chutney: '🫘', raita: '🥣', papad: '🫓', onion: '🧅', lemon: '🍋',
   kadhi: '🫕',
  'green salad': '🥗', kachumber: '🥒',
  'mixed fruit': '🍎', 'seasonal fruit': '🍇', fruit: '🍎',
  water: '💧', chaas: '🥛', 'nimbu pani': '🍋', coffee: '☕',
  tea: '🍵', lassi: '🥤', 'filter coffee': '☕', chai: '🍵',
  jam: '🍓', egg: '🥚', cheese: '🧀', ketchup: '🧃', peanuts: '🥜',
  'roti / phulka': '🫓', 'butter naan': '🫓', 'garlic naan': '🫓', 'aloo paratha': '🫓',
  'paneer paratha': '🫓', 'gobi paratha': '🫓', 'missi roti': '🫓', 'bhakri': '🫓',
  'rumali roti': '🫓', 'puri': '🫓', 'kulcha': '🫓', 'luchi': '🫓', 'appam': '🫓',
  'khamiri roti': '🫓', 'bhature': '🫓',
  'steamed basmati': '🍚', 'jeera rice': '🍚', 'lemon rice': '🍚', 'curd rice': '🍚',
  'veg pulao': '🍚', 'khichdi': '🍚', 'sona masoori': '🍚', 'biryani base': '🍚',
  'pongal': '🍚', 'upma': '🍚', 'curd pulao': '🍚', 'matar pulao': '🍚',
  'jeera sona masoori': '🍚', 'coconut rice': '🍚',
  'masala chai': '🍵', 'filter coffee': '☕', 'salted lassi': '🥤', 'sweet lassi': '🥤',
  'chaas': '🥛', 'nimbu pani': '🍋', 'jaljeera': '🧃', 'aam panna': '🧃',
  'sol kadhi': '🧃', 'coconut water': '🥥', 'thandai': '🥤', 'badam milk': '🥛',
  'sattu sharbat': '🧃', 'kokum sherbet': '🧃', 'ginger lemon': '🍋',
  'cucumber raita': '🥣', 'boondi raita': '🥣', 'masala raita': '🥣',
  'papad': '🫓', 'kachumber salad': '🥗', 'mango pickle': '🥒', 'lime pickle': '🥒',
  'mixed chutney': '🫘', 'coconut chutney': '🫘', 'mint chutney': '🫘',
  'tamarind chutney': '🫘', 'fryums': '🍟', 'onion rings': '🧅', 'lemon wedge': '🍋',
  'green chili': '🌶️',
  'kheer / payasam': '🍮', 'gulab jamun': '🍡', 'rasgulla': '🍥', 'jalebi': '🥨',
  'gajar halwa': '🍮', 'sooji halwa': '🍮', 'rasmalai': '🍥', 'shrikhand': '🥣',
  'barfi (milk/coconut)': '🍬', 'modak': '🥟', 'phirni': '🍮',
  'ladoo (besan/motichoor)': '🍬', 'malpua': '🥞', 'kulfi': '🍦', 'ras malai': '🍥',
};

interface SwapCustomizeModalProps {
  isOpen: boolean;
  onClose: () => void;
  date: string;
  mealType: MealType;
  slotLabel: string;
  item: TrayItem;
  dishes: Dish[];
  userRegion: string;
  userDiet: string;
  onApply: (
    itemId: string,
    updates: {
      meal_id: string;
      name: string;
      icon: string;
      quantity: number;
      title?: string;
      style?: string;
      gravy: string | null;
      roti: string | null;
      rice: string | null;
      sides: string[];
      beverages: string[];
      dessert: string[];
      customizations?: Array<{
        category: string;
        suggested: string[];
        chosen: string[];
        timestamp: number;
      }>;
    },
  ) => void;
  onAddAnother?: (date: string, mealType: MealType, dish: Dish, variant?: DishVariant) => void;
  initialAddMode?: boolean;
  /** Called in real-time when selections change (no modal close) */
  onChange?: (itemId: string, updates: Partial<TrayItem>) => void;
}

const allCategories: IndianMealCategory[] = ['bread', 'rice', 'side', 'beverage', 'dessert'];
const styleGroups: DishStyleGroup[] = ['Gravy', 'Dry', 'Fry', 'Tadka', 'Roast', 'Steam', 'Rice', 'Breakfast'];

const CUSTOM_DISH_STYLES: { value: string; label: string; icon: string }[] = [
  { value: 'Gravy', label: 'Gravy', icon: '🍛' },
  { value: 'Dry', label: 'Dry', icon: '🥘' },
  { value: 'Fry', label: 'Fry', icon: '🍟' },
  { value: 'Rice', label: 'Rice', icon: '🍚' },
  { value: 'Sweet', label: 'Sweet', icon: '🍨' },
  { value: 'Roast', label: 'Roast', icon: '🔥' },
  { value: 'Steam', label: 'Steam', icon: '♨️' },
  { value: 'Breakfast', label: 'Breakfast', icon: '🌅' },
];

export const SwapCustomizeModal: React.FC<SwapCustomizeModalProps> = React.memo(({
  isOpen,
  onClose,
  date,
  mealType,
  slotLabel,
  item,
  dishes,
  userRegion,
  userDiet,
  onApply,
  onAddAnother,
  initialAddMode,
  onChange,
}) => {
  const [dish, setDish] = useState<Dish | null>(null);
  const [meal, setMeal] = useState<Meal | null>(null);
  const [selectedCategories, setSelectedCategories] = useState<Record<IndianMealCategory, string[]>>({
    bread: [], rice: [], side: [], beverage: [], dessert: [],
  });
  const [selectedStyleGroup, setSelectedStyleGroup] = useState<DishStyleGroup | null>(null);
  const [quantity, setQuantity] = useState(1);
  const [showSwapSearch, setShowSwapSearch] = useState(initialAddMode);
  const [searchQuery, setSearchQuery] = useState('');
  const debouncedSearchQuery = useDebounce(searchQuery, 300);
  const [showGlobal, setShowGlobal] = useState(false);
  const [showAllSwapResults, setShowAllSwapResults] = useState(false);
  const [healthPreset, setHealthPreset] = useState<HealthFilterPreset | null>(null);
  const [healthSort, setHealthSort] = useState<HealthSortKey | null>(null);
  const [selectedSwapDish, setSelectedSwapDish] = useState<Dish | null>(null);
  const selectedSwapDishRef = useRef<Dish | null>(null);
  const [selectedVariant, setSelectedVariant] = useState<DishVariant | null>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);
  const [justAddedDish, setJustAddedDish] = useState<string | null>(null);
  const autoCloseTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // ── Async safety: latest-request-wins + modal lifecycle protection ──
  const asyncGuard = useAsyncGuard();
  const modalGuardRef = useRef<ModalLifecycleGuard>(new ModalLifecycleGuard());
  const syncBufferRef = useRef<DeferredSync<Partial<TrayItem>>>(new DeferredSync(150));

  useEffect(() => {
    setShowAllSwapResults(false);
  }, [searchQuery]);

  useEffect(() => {
    document.body.classList.toggle('search-mode', searchQuery.length > 0);
    return () => document.body.classList.remove('search-mode');
  }, [searchQuery]);

  // Variant-inclusive display name for the dish header
  const displayName = useMemo(() => {
    if (!dish?.name) return '';
    return resolveDisplayName(dish.name, selectedVariant);
  }, [dish?.name, selectedVariant]);
  const regionKey = (userRegion ?? '').toLowerCase().replace(' india', '');
  const { user, updateProfile, customDishes, addCustomDish } = useStore();
  const allergyMode = user?.allergyMode ?? false;
  const [expandedCategories, setExpandedCategories] = useState<Partial<Record<IndianMealCategory, boolean>>>({});
  const [overrideLimit, setOverrideLimit] = useState(false);
  const [showStylePicker, setShowStylePicker] = useState(false);
  const [addAnotherMode, setAddAnotherMode] = useState(false);
  const initRef = useRef<string | null>(null);
  const seededMealRef = useRef<string | null>(null);
  const explicitlyRemovedRef = useRef<Set<string>>(new Set());
  const [showCustomDishForm, setShowCustomDishForm] = useState(false);
  const [customDishName, setCustomDishName] = useState('');
  const [customDishStyle, setCustomDishStyle] = useState<string>('Gravy');
  const [customDishDiet, setCustomDishDiet] = useState<'veg' | 'non-veg'>('veg');

  const toggleExpanded = useCallback((cat: IndianMealCategory) => {
    setExpandedCategories(prev => ({ ...prev, [cat]: !(prev[cat] ?? false) }));
  }, []);

  const toggleOverrideLimit = useCallback(() => {
    setOverrideLimit(true);
  }, []);

  const toggleCategoryItemWrap = useCallback((cat: IndianMealCategory, item: string) => {
    setSelectedCategories(prev => {
      const current = prev[cat];
      const max = CATEGORY_CONFIG[cat].max;
      const already = current.includes(item);
      if (already) {
        explicitlyRemovedRef.current.add(`${cat}_${item.toLowerCase().trim()}`);
        return { ...prev, [cat]: current.filter(i => i !== item) };
      }
      if (!overrideLimit && current.length >= max) return { ...prev, [cat]: [item] };
      return { ...prev, [cat]: [...current, item] };
    });
    syncNeeded.current = true;
  }, [overrideLimit]);

  const handleClose = useCallback(() => {
    explicitlyRemovedRef.current.clear();
    seededMealRef.current = null;
    modalGuardRef.current.close();
    asyncGuard.abort();
    syncBufferRef.current.cancel();
    if (autoCloseTimerRef.current) {
      clearTimeout(autoCloseTimerRef.current);
      autoCloseTimerRef.current = null;
    }
    setJustAddedDish(null);
    onClose();
  }, [onClose, asyncGuard]);

  const handleStyleSelect = useCallback((group: DishStyleGroup) => {
    const suggestions = getPairingSuggestions(group);
    setSelectedStyleGroup(group);
    setSelectedCategories(suggestions);
    setShowStylePicker(false);
    syncNeeded.current = true;
  }, []);

  const wasOpenRef = useRef(false);
  const userSelectedRef = useRef(false);

  useEffect(() => {
    const justOpened = isOpen && !wasOpenRef.current;
    wasOpenRef.current = isOpen;

    if (isOpen) {
      if (justOpened) {
        modalGuardRef.current.reset();
        asyncGuard.reset();
        syncBufferRef.current.cancel();
        initRef.current = null;
        seededMealRef.current = null;
        explicitlyRemovedRef.current.clear();
        userSelectedRef.current = false;
        setDish(null);
        setMeal(null);
        setSelectedVariant(null);
        setOverrideLimit(false);
        setShowStylePicker(false);
        setShowCustomDishForm(false);
        setCustomDishStyle('Gravy');
        setCustomDishDiet('veg');
        setCustomDishName('');
      }

      if (initialAddMode) {
        setAddAnotherMode(true);
        setShowSwapSearch(true);
        setSearchQuery('');
        setShowGlobal(false);
        setHealthPreset(null);
        setHealthSort(null);
        setSelectedSwapDish(null);
        initRef.current = '__add_mode__';
        return;
      }

      if (userSelectedRef.current) return;
      if (initRef.current === item.meal_id) return;

      const sourceDish = dishes.find(d => d.id === item.meal_id) || dishes.find(d => d.name === item.name);
      if (sourceDish) {
        const m = dishToMeal(sourceDish);
        const style = getDishStyle(sourceDish.id);
        const restoredVariant = item.variant && item.variantId
          ? sourceDish.variants.find(v => v.id === item.variantId || v.name === item.variant) ?? null
          : null;
        if (restoredVariant) setSelectedVariant(restoredVariant);
        setDish(sourceDish);
        setMeal(m);
        setQuantity(1);
        setSelectedStyleGroup(style ? internalToStyleGroup(style) : null);
        if (seededMealRef.current !== item.meal_id) {
          seededMealRef.current = item.meal_id;
          const removed = explicitlyRemovedRef.current;
          setSelectedCategories({
            bread: item.roti ? [item.roti].filter(s => !removed.has(`bread_${s.toLowerCase().trim()}`)) : [],
            rice: item.rice ? [item.rice].filter(s => !removed.has(`rice_${s.toLowerCase().trim()}`)) : [],
            side: item.sides?.length ? item.sides.filter(s => !removed.has(`side_${s.toLowerCase().trim()}`)) : [],
            beverage: item.beverages?.length ? item.beverages.filter(s => !removed.has(`beverage_${s.toLowerCase().trim()}`)) : [],
            dessert: item.dessert?.length ? item.dessert.filter(s => !removed.has(`dessert_${s.toLowerCase().trim()}`)) : [],
          });
        }
        initRef.current = item.meal_id;
      }
    } else {
      initRef.current = null;
      setAddAnotherMode(false);
      setSelectedVariant(null);
    }
  }, [isOpen, item.meal_id, item.roti, item.rice, item.sides, item.beverages, item.dessert, dishes, mealType, initialAddMode]);

  useEffect(() => {
    if (showSwapSearch && searchInputRef.current) {
      searchInputRef.current.focus();
    }
  }, [showSwapSearch]);

  const handleSwapOpen = useCallback(() => {
    setShowSwapSearch(true);
    setSearchQuery('');
  }, []);

  const handleSwapSelect = useCallback((newDish: Dish) => {
    const activeSlot = mealType;
    const category = activeSlot.toLowerCase();
    const isVegan = userDiet?.toLowerCase() === 'vegan';
    const relevantVariants = newDish.variants.filter(v => {
      if (!v.mealContext) return true;
      if (isVegan) return false;
      return v.mealContext.includes(category) || !v.mealContext;
    });
    if (relevantVariants.length > 1) {
      setSelectedSwapDish(newDish);
      selectedSwapDishRef.current = newDish;
      return;
    }
    if (addAnotherMode) {
      onAddAnother?.(date, mealType, newDish, relevantVariants.length === 1 ? relevantVariants[0] : undefined);
      setJustAddedDish(newDish.name);
      setSearchQuery('');
      if (autoCloseTimerRef.current) clearTimeout(autoCloseTimerRef.current);
      autoCloseTimerRef.current = setTimeout(() => {
        if (modalGuardRef.current.isClosed) return;
        setJustAddedDish(null);
        handleClose();
      }, 700);
      return;
    }
    userSelectedRef.current = true;
    const m = dishToMeal(newDish);
    const defaults = applySmartDefaults(m, mealType);
    const style = getDishStyle(newDish.id);
    setDish(newDish);
    setMeal(m);
    setSelectedStyleGroup(style ? internalToStyleGroup(style) : null);
    setSelectedCategories({
      bread: defaults.roti ? [defaults.roti] : [],
      rice: defaults.rice ? [defaults.rice] : [],
      side: defaults.sides,
      beverage: defaults.beverages,
      dessert: defaults.dessert,
    });
    setShowSwapSearch(false);
    setSearchQuery('');
    setSelectedSwapDish(null);
    if (relevantVariants.length === 1) {
      setSelectedVariant(relevantVariants[0]!);
    } else {
      setSelectedVariant(null);
    }
    syncNeeded.current = true;
  }, [addAnotherMode, mealType, userDiet, onAddAnother, date]);

  const handleSwapVariantSelect = useCallback((variant: DishVariant) => {
    const d = selectedSwapDish ?? selectedSwapDishRef.current;
    if (!d) return;
    if (addAnotherMode) {
      onAddAnother?.(date, mealType, d, variant);
      setSelectedSwapDish(null);
      selectedSwapDishRef.current = null;
      setSelectedVariant(null);
      setSearchQuery('');
      return;
    }
    userSelectedRef.current = true;
    const m = dishToMeal(d);
    const defaults = applySmartDefaults(m, mealType);
    const style = getDishStyle(d.id);
    const variantAddOn = variant.addOn?.toLowerCase() ?? '';
    const variantPrefersRoti = variantAddOn.includes('roti') || variantAddOn.includes('naan') || variantAddOn.includes('paratha');
    const variantPrefersRice = variantAddOn.includes('rice');
    setSelectedVariant(variant);
    setDish(d);
    setMeal(m);
    setSelectedStyleGroup(style ? internalToStyleGroup(style) : null);
    setSelectedCategories({
      bread: !variantPrefersRice && (defaults.roti ? [defaults.roti] : []),
      rice: !variantPrefersRoti && (defaults.rice ? [defaults.rice] : []),
      side: defaults.sides,
      beverage: defaults.beverages,
      dessert: defaults.dessert,
    });
    setShowSwapSearch(false);
    setSearchQuery('');
    setSelectedSwapDish(null);
    selectedSwapDishRef.current = null;
    syncNeeded.current = true;
  }, [addAnotherMode, mealType, selectedSwapDish, onAddAnother, date]);

  const handleCreateCustomDish = useCallback(() => {
    const name = customDishName.trim();
    if (!name) return;
    const timestamp = Date.now();
    const dishId = `custom_${timestamp}`;
    const regionMap: Record<string, Region> = {
      north: 'north', south: 'south', east: 'east', west: 'west',
      central: 'central', northeast: 'northeast',
    };
    const region = regionMap[regionKey] || 'north';
    const newDish: Dish = {
      id: dishId,
      name,
      icon: CUSTOM_DISH_STYLES.find(s => s.value === customDishStyle)?.icon || '🍽️',
      region,
      states: [],
      category: [mealType.toLowerCase() as Category],
      type: customDishDiet,
      weight: 'medium',
      nutrition: [],
      tags: ['custom'],
      variants: [{
        id: `${dishId}_v1`,
        name,
        baseStyle: customDishStyle === 'Sweet' ? 'sweet-dessert' : customDishStyle.toLowerCase(),
        mealContext: mealType.toLowerCase() as Category,
      }],
      description: `My custom ${customDishStyle.toLowerCase()} dish`,
    };
    addCustomDish(newDish);
    handleSwapSelect(newDish);
    setShowCustomDishForm(false);
  }, [customDishName, customDishStyle, customDishDiet, regionKey, mealType, addCustomDish, handleSwapSelect]);

  const buildUpdatesObject = useCallback(() => {
    const currentDish = dish ?? dishes.find(d => d.id === item.meal_id) ?? dishes.find(d => d.name === item.name);
    if (!currentDish) return null;
    const fullName = resolveDisplayName(currentDish.name, selectedVariant);
    const title = generateMealTitle(
      fullName,
      [...new Set(selectedCategories.side)],
      [...new Set(selectedCategories.beverage)],
      selectedCategories.rice[0] ?? selectedCategories.bread[0] ?? undefined,
    );
    const suggestions = getPairingSuggestions(selectedStyleGroup ?? 'Gravy');
    const customizationLog = {
      dishId: currentDish.id,
      dishName: currentDish.name,
      style: selectedStyleGroup ?? undefined,
      categories: allCategories.map(cat => ({
        category: cat,
        suggested: suggestions[cat] ?? [],
        chosen: [...new Set(selectedCategories[cat])],
        timestamp: Date.now(),
      })),
    };
    return {
      meal_id: currentDish.id,
      name: fullName,
      icon: currentDish.icon,
      variant: selectedVariant?.name,
      variantId: selectedVariant?.id,
      quantity,
      title,
      style: selectedStyleGroup ?? undefined,
      gravy: null,
      roti: selectedCategories.bread[0] ?? null,
      rice: selectedCategories.rice[0] ?? null,
      sides: [...new Set(selectedCategories.side)],
      beverages: [...new Set(selectedCategories.beverage)],
      dessert: [...new Set(selectedCategories.dessert)],
      customizations: customizationLog.categories,
    };
  }, [dish, item.meal_id, dishes, selectedVariant, quantity, selectedCategories, selectedStyleGroup]);

  // ── User-interaction sync guard: only sync when explicitly triggered by user interaction ──
  const syncNeeded = useRef(false);

  useEffect(() => {
    if (!syncNeeded.current) return;
    syncNeeded.current = false;
    if (!onChange) return;
    if (modalGuardRef.current.isClosed) return;

    const requestId = asyncGuard.start();
    const updates = buildUpdatesObject();
    if (!updates) return;

    // Latest-request-wins: ignore if a newer request started
    if (!asyncGuard.isCurrent(requestId)) return;

    // Deferred sync: buffer rapid changes, flush after stable period
    syncBufferRef.current.queue(updates, (u) => {
      if (modalGuardRef.current.isClosed) return;
      onChange(item.id, u);
    });
  }, [selectedCategories, quantity, onChange, buildUpdatesObject, item.id, asyncGuard]);

  // ── Strict deduplication: normalize selections to Map ──
  // Key = `${name.toLowerCase().trim()}_${category}` ensures casing/spacing doesn't create duplicates.
  // Merge on repeat add: existing.qty += 1. Never push duplicates.
  // Each Map entry includes mapKey for stable React rendering.
  const selectionMap = useMemo(() => {
    const map = new Map<string, { name: string; qty: number; category: IndianMealCategory; mapKey: string }>();
    for (const cat of allCategories) {
      for (const item of selectedCategories[cat]) {
        const mapKey = `${item.toLowerCase().trim()}_${cat}`;
        const existing = map.get(mapKey);
        if (existing) {
          existing.qty += 1;
        } else {
          map.set(mapKey, { name: item, qty: 1, category: cat, mapKey });
        }
      }
    }
    return map;
  }, [selectedCategories]);

  // ── Apply: data already synced in real-time, just close ──
  const handleApply = useCallback(() => {
    if (onChange) {
      // Flush any pending deferred sync before closing
      syncBufferRef.current.flush();
      explicitlyRemovedRef.current.clear();
      seededMealRef.current = null;
      modalGuardRef.current.close();
      onClose();
      return;
    }
    // Legacy: consumers without onChange (should not happen after migration)
    const currentDish = dish ?? dishes.find(d => d.id === item.meal_id) ?? dishes.find(d => d.name === item.name);
    if (!currentDish) return;
    const fullName = resolveDisplayName(currentDish.name, selectedVariant);
    const title = generateMealTitle(
      fullName,
      selectedCategories.side,
      selectedCategories.beverage,
      selectedCategories.rice[0] ?? selectedCategories.bread[0] ?? undefined,
    );
    const suggestions = getPairingSuggestions(selectedStyleGroup ?? 'Gravy');
    const customizationLog = {
      dishId: currentDish.id,
      dishName: currentDish.name,
      style: selectedStyleGroup ?? undefined,
      categories: allCategories.map(cat => ({
        category: cat,
        suggested: suggestions[cat] ?? [],
        chosen: selectedCategories[cat],
        timestamp: Date.now(),
      })),
    };
    onApply(item.id, {
      meal_id: currentDish.id,
      name: fullName,
      icon: currentDish.icon,
      variant: selectedVariant?.name,
      variantId: selectedVariant?.id,
      quantity,
      title,
      style: selectedStyleGroup ?? undefined,
      gravy: null,
      roti: selectedCategories.bread[0] ?? null,
      rice: selectedCategories.rice[0] ?? null,
      sides: selectedCategories.side,
      beverages: selectedCategories.beverage,
      dessert: selectedCategories.dessert,
      customizations: customizationLog.categories,
    });
    explicitlyRemovedRef.current.clear();
    seededMealRef.current = null;
    modalGuardRef.current.close();
    onClose();
  }, [onChange, buildUpdatesObject, onApply, onClose, dish, item.id, item.meal_id, dishes, selectedVariant, quantity, selectedCategories, selectedStyleGroup]);

  const swapSearchDishes = useMemo(() => {
    if (!showSwapSearch) return [];

    const q = debouncedSearchQuery.toLowerCase();
    const category = mealType;
    const isVegan = userDiet?.toLowerCase() === 'vegan';
    const allowedTypes = DIET_FILTER[userDiet?.toLowerCase() || 'veg'] || ['veg'];

    const dishPool = [...dishes, ...customDishes];
    let filtered = dishPool.filter(d => {
      if (!d.category.some(c => c.includes(category))) {
        if (!q) return false;
      }
      if (isVegan && d.type !== 'veg' && d.type !== 'vegan') return false;
      if (!isVegan && !allowedTypes.includes(d.type)) return false;
      if (q) {
        const matchName = d.name.toLowerCase().includes(q);
        const matchTags = d.tags.some(t => t.toLowerCase().includes(q));
        const matchVariant = d.variants.some(v => v.name.toLowerCase().includes(q));
        if (!matchName && !matchTags && !matchVariant) return false;
      }
      return true;
    });

    if (healthPreset) {
      filtered = filterDishesByHealth(filtered, getFilterPreset(healthPreset));
    }

    const scored = filtered.map(d => {
      let score = 0;
      if (d.region.toLowerCase().includes(regionKey)) score += 10;
      if (d.tags.includes('popular') || d.tags.includes('hero')) score += 5;
      if (d.states.some(s => s.toLowerCase().includes(regionKey))) score += 3;
      return { dish: d, score, healthScore: scoreDish(d) };
    });

    if (healthSort) {
      const sortedIds = sortDishesByHealth(scored.map(s => s.dish), healthSort).map(d => d.id);
      scored.sort((a, b) => sortedIds.indexOf(a.dish.id) - sortedIds.indexOf(b.dish.id));
    } else {
      scored.sort((a, b) => b.score - a.score);
    }

    const regional = scored.filter(s => s.dish.region.toLowerCase().includes(regionKey));
    const global_ = scored.filter(s => !s.dish.region.toLowerCase().includes(regionKey));
    return showGlobal ? [...global_, ...regional] : [...regional, ...global_];
  }, [showSwapSearch, dishes, customDishes, mealType, userDiet, userRegion, debouncedSearchQuery, showGlobal, healthPreset, healthSort]);

  const dishVariants = useMemo(() => {
    if (!selectedSwapDish) return [];
    const category = mealType.toLowerCase();
    const isVegan = userDiet?.toLowerCase() === 'vegan';
    return selectedSwapDish.variants.filter(v => {
      if (!v.mealContext) return true;
      if (isVegan) return false;
      return v.mealContext.includes(category) || !v.mealContext;
    }).slice(0, 6);
  }, [selectedSwapDish, mealType, userDiet]);

  const mergedOptions = useMemo((): Record<IndianMealCategory, string[]> => ({
    bread: mergeCategoryOptions(undefined, indian_meal_categories.bread),
    rice: mergeCategoryOptions(undefined, indian_meal_categories.rice),
    side: mergeCategoryOptions(meal?.sideOptions, indian_meal_categories.side),
    beverage: mergeCategoryOptions(meal?.beverageOptions, indian_meal_categories.beverage),
    dessert: mergeCategoryOptions(undefined, indian_meal_categories.dessert),
  }), [meal]);

  const recommendedCats = useMemo((): IndianMealCategory[] => {
    if (!dish || isStreetFood(dish.id)) return [];
    const dishStyle = getDishStyle(dish.id);
    const effectiveStyle = selectedStyleGroup
      ? styleGroupToInternal(selectedStyleGroup)
      : (dishStyle ?? 'gravy');
    return getRecommendedCategories(effectiveStyle);
  }, [dish, selectedStyleGroup]);

  const isStreetFoodDish = dish && isStreetFood(dish.id);
  const dishRegion = dish?.region ?? '';

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[60] flex items-end sm:items-center justify-center">
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={handleClose} aria-hidden="true" />
      {/* Added confirmation toast */}
      {justAddedDish && (
        <div className="fixed top-16 left-1/2 -translate-x-1/2 z-[70] animate-in slide-in-from-top-2 fade-in duration-200">
          <div className="flex items-center gap-2 px-4 py-2.5 rounded-2xl bg-emerald-600 text-white shadow-lg shadow-emerald-600/30">
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
            </svg>
            <span className="text-sm font-bold">{justAddedDish} added</span>
          </div>
        </div>
      )}
      <div
        className="relative w-full sm:max-w-lg max-h-[90vh] bg-white rounded-t-[32px] sm:rounded-[32px] shadow-2xl animate-in slide-in-from-bottom-4 fade-in duration-200 flex flex-col overflow-hidden pb-16"
        role="dialog"
        aria-modal="true"
        aria-label={`Customize ${slotLabel}`}
>
        {/* Header */}
        <div className="shrink-0 px-5 pt-5 pb-3 border-b border-gray-100">
          {showSwapSearch ? (
            <div className="flex items-center gap-2">
              <button
                onClick={() => {
                  if (initialAddMode) { handleClose(); return; }
                  if (selectedSwapDish) {
                    setSelectedSwapDish(null);
                  } else {
                    setShowSwapSearch(false);
                    setSearchQuery('');
                    setAddAnotherMode(false);
                  }
                }}
                className="w-8 h-8 rounded-xl flex items-center justify-center bg-gray-100" aria-label="Back">
                <ChevronLeft size={16} className="text-gray-700" />
              </button>
              {selectedSwapDish ? (
                <h3 className="text-sm font-black tracking-tight text-gray-900 truncate">
                  {selectedSwapDish.name}
                </h3>
              ) : (
                <div className="flex-1 flex items-center gap-2 px-3 py-2 rounded-xl bg-gray-100">
                  <Search size={14} className="text-gray-400" />
                  <input ref={searchInputRef} type="text" value={searchQuery} onChange={e => setSearchQuery(e.target.value)} placeholder={addAnotherMode ? "Search dishes to add..." : "Search dishes..."} className="bg-transparent text-sm w-full outline-none placeholder:text-gray-400 text-gray-800" aria-label="Search dishes" />
                  {searchQuery && (
                    <button onClick={() => setSearchQuery('')} aria-label="Clear search">
                      <X size={12} className="text-gray-400" />
                    </button>
                  )}
                </div>
              )}
            </div>
          ) : (
            <div className="flex items-center justify-between">
              <h2 className="text-base font-black tracking-tight text-gray-900">
                Customize
              </h2>
              <button
                onClick={handleClose} className="w-8 h-8 rounded-xl flex items-center justify-center bg-gray-100 active:scale-90" aria-label="Close">
                <X size={14} className="text-gray-500" />
              </button>
            </div>
          )}
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto">
          {showSwapSearch ? (
            selectedSwapDish ? (
              /* ─── VARIANT SELECTION ─── */
              <div className="p-4 space-y-2">
                {dishVariants.length === 0 ? (
                  <p className="text-sm text-center py-8 text-gray-500">No variants available</p>
                ) : (
                  dishVariants.map(variant => (
                    <button
                      key={variant.id}
                      onClick={() => handleSwapVariantSelect(variant)}
                      className="w-full flex items-center gap-3 p-3 rounded-xl border transition-all active:scale-[0.98] text-left bg-gray-50 border-gray-100">
                      <DishImage name={selectedSwapDish.name} slot={mealType} size="sm" />
                      <div className="flex-1 min-w-0">
                        <span className="text-sm font-bold block leading-tight truncate text-gray-800">
                          {variant.name}
                        </span>
                        <div className="flex items-center gap-2 mt-0.5">
                          {variant.addOn && (
                            <span className="text-[9px] font-medium text-gray-400">{variant.addOn}</span>
                          )}
                          {variant.mealContext && (
                            <>
                              <span className="text-[9px] text-gray-300">•</span>
                              <span className="text-[9px] font-medium capitalize text-gray-400">
                                {variant.mealContext}
                              </span>
                            </>
                          )}
                        </div>
                      </div>
                      <Sparkles size={12} className="text-[#FF385C] flex-shrink-0" />
                    </button>
                  ))
                )}
              </div>
            ) : showCustomDishForm ? (
              /* ─── CUSTOM DISH FORM ─── */
              <div className="p-4">
                <div className="rounded-2xl border border-gray-200 p-4 space-y-4">
                  <h3 className="text-sm font-black tracking-tight text-gray-900">Create Custom Dish</h3>
                  <div>
                    <label className="text-[9px] font-black uppercase tracking-widest text-gray-500 mb-1 block">
                      Name
                    </label>
                    <input
                      type="text"
                      value={customDishName}
                      onChange={e => setCustomDishName(e.target.value)}
                      className="w-full px-3 py-2 rounded-xl border border-gray-200 text-sm font-medium text-gray-800 outline-none focus:border-[#FF385C]"
                      placeholder="Dish name"
                    />
                  </div>
                  <div>
                    <label className="text-[9px] font-black uppercase tracking-widest text-gray-500 mb-1 block">
                      Style
                    </label>
                    <div className="grid grid-cols-4 gap-2">
                      {CUSTOM_DISH_STYLES.map(s => (
                        <button
                          key={s.value}
                          onClick={() => setCustomDishStyle(s.value)}
                          className={`flex flex-col items-center gap-1 p-2 rounded-xl transition-all ${
                            customDishStyle === s.value
                              ? 'bg-[#FF385C]/10 border-2 border-[#FF385C]'
                              : 'bg-gray-50 border border-gray-100'
                          }`}
                        >
                          <span className="text-lg">{s.icon}</span>
                          <span className={`text-[7px] font-bold ${customDishStyle === s.value ? 'text-[#FF385C]' : 'text-gray-500'}`}>
                            {s.label}
                          </span>
                        </button>
                      ))}
                    </div>
                  </div>
                  <div>
                    <label className="text-[9px] font-black uppercase tracking-widest text-gray-500 mb-1 block">
                      Diet
                    </label>
                    <div className="flex rounded-xl overflow-hidden border border-gray-200">
                      <button
                        onClick={() => setCustomDishDiet('veg')}
                        className={`flex-1 py-2 text-xs font-bold transition-all ${
                          customDishDiet === 'veg'
                            ? 'bg-green-500 text-white'
                            : 'bg-white text-gray-500'
                        }`}
                      >
                        🌿 Veg
                      </button>
                      <button
                        onClick={() => setCustomDishDiet('non-veg')}
                        className={`flex-1 py-2 text-xs font-bold transition-all ${
                          customDishDiet === 'non-veg'
                            ? 'bg-red-500 text-white'
                            : 'bg-white text-gray-500'
                        }`}
                      >
                        🥩 Non-Veg
                      </button>
                    </div>
                  </div>
                  <div className="flex gap-2 pt-1">
                    <button
                      onClick={() => setShowCustomDishForm(false)}
                      className="flex-1 py-2.5 rounded-xl bg-gray-100 text-gray-600 font-bold text-sm active:scale-[0.98] transition-all"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={handleCreateCustomDish}
                      disabled={!customDishName.trim()}
                      className="flex-1 py-2.5 rounded-xl bg-[#FF385C] text-white font-bold text-sm active:scale-[0.98] transition-all shadow-lg shadow-[#FF385C]/30 disabled:opacity-50"
                    >
                      Add to Tray
                    </button>
                  </div>
                </div>
              </div>
            ) : (
              /* ─── SWAP SEARCH GRID ─── */
              <div className="p-4">
                <div className="mb-4">
                  <HealthFilterBar
                    activePreset={healthPreset}
                    activeSort={healthSort}
                    onPresetChange={setHealthPreset}
                    onSortChange={setHealthSort}
                  />
                </div>

                <div className="flex items-center justify-between mb-4">
                  <button
                    onClick={() => setShowGlobal(!showGlobal)}
                    className="text-xs font-bold text-[#FF385C]">
                    {showGlobal ? '← Regional first' : 'All regions →'}
                  </button>
                  <span className="text-[10px] font-bold text-gray-400">
                    {swapSearchDishes.length} dishes
                  </span>
                </div>

                {swapSearchDishes.length === 0 ? (
                  <div className="p-8 text-center">
                    {searchQuery ? (
                      <>
                        <Sparkles size={24} className="mx-auto mb-2 text-gray-300" />
                        <p className="text-sm text-gray-400 mb-4">
                          &ldquo;{searchQuery}&rdquo; not found
                        </p>
                        <button
                          onClick={() => { setCustomDishName(searchQuery); setShowCustomDishForm(true); }}
                          className="px-5 py-2.5 bg-[#FF385C] text-white rounded-xl font-bold text-sm active:scale-[0.98] transition-all shadow-lg shadow-[#FF385C]/30"
                        >
                          Create &lsquo;{searchQuery}&rsquo; as Custom Dish
                        </button>
                      </>
                    ) : (
                      <>
                        <Sparkles size={24} className="mx-auto mb-2 text-gray-300" />
                        <p className="text-sm text-gray-400">No more dishes</p>
                      </>
                    )}
                  </div>
                ) : (
                  <>
                    <VirtualList
                      items={swapSearchDishes.slice(0, showAllSwapResults ? swapSearchDishes.length : 30)}
                      estimateSize={88}
                      overscan={5}
                      outerClassName="h-[55vh]"
                      className="space-y-1.5"
                      renderItem={({ dish, healthScore }) => {
                        const isRegional = dish.region.toLowerCase().includes(regionKey);
                        const hScore = healthScore ?? scoreDish(dish);
                        const meal = dishToMeal(dish);
                        const defaults = applySmartDefaults(meal, mealType);
                        const previewChips: { key: string; label: string }[] = [];
                        if (defaults.gravy) previewChips.push({ key: 'g', label: defaults.gravy });
                        if (defaults.roti) previewChips.push({ key: 'r', label: defaults.roti });
                        if (defaults.rice) previewChips.push({ key: 'ri', label: defaults.rice });
                        for (const s of defaults.sides) previewChips.push({ key: `s-${s}`, label: s });
                        for (const b of defaults.beverages) previewChips.push({ key: `b-${b}`, label: b });

                        return (
                          <button
                            key={dish.id}
                            onClick={() => handleSwapSelect(dish)}
                            className="w-full flex items-start gap-3 p-3 rounded-xl transition-all active:scale-[0.98] text-left bg-gray-50 hover:bg-gray-100"
                            aria-label={`Select ${dish.name}`}>
                            <DishImage name={dish.name} slot={mealType} size="sm" />
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2">
                                <span className="text-sm font-bold block leading-tight truncate text-gray-800">
                                  {dish.name}
                                </span>
                                <HealthScoreBadge score={hScore} size="sm" />
                              </div>
                              <div className="flex items-center gap-2 mt-0.5">
                                <span className="text-[9px] font-medium capitalize text-gray-400">
                                  {dish.region}
                                </span>
                              </div>
                              {previewChips.length > 0 && (
                                <div className="flex items-center gap-1 mt-1.5 flex-wrap">
                                  {previewChips.map(chip => {
                                    const icon = ICON_MAP[chip.label.toLowerCase()] ?? '';
                                    return (
                                      <span
                                        key={chip.key}
                                        className="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded-full bg-white border border-gray-200 text-gray-500 text-[8px] font-medium">
                                        {icon && <span className="text-[9px]" aria-hidden="true">{icon}</span>}
                                        <span>{chip.label}</span>
                                      </span>
                                    );
                                  })}
                                </div>
                              )}
                            </div>
                            {isRegional && (
                              <span className="text-[8px] font-black uppercase tracking-widest bg-[#FF385C] text-white px-1.5 py-0.5 rounded flex-shrink-0">
                                Local
                              </span>
                            )}
                            <Sparkles size={12} className="text-[#FF385C] flex-shrink-0 mt-1" />
                          </button>
                        );
                      }}
                      />
                    {!showAllSwapResults && swapSearchDishes.length > 30 && (
                      <div className="flex flex-col items-center gap-2 mt-3">
                        <p className="text-[10px] text-center text-gray-400 font-medium">
                          Showing 30 of {swapSearchDishes.length} dishes.
                        </p>
                        <button
                          onClick={() => setShowAllSwapResults(true)}
                          className="text-[11px] font-bold text-emerald-600 underline active:scale-95"
                        >
                          Show all {swapSearchDishes.length} dishes
                        </button>
                      </div>
                    )}
                  </>
                )}

              </div>
            )
          ) : (
            /* ─── MAIN VIEW ─── */
            <div className="p-5 space-y-4">
              {dish ? (
                <div className="rounded-2xl border border-[#FF385C]/20 bg-[#FF385C]/5 p-4">
                  {/* ─── Dish Header ─── */}
                  <div className="flex items-start gap-3">
                    <DishImage name={dish.name} slot={mealType} size="md" />
                    <div className="flex-1 min-w-0">
                      <span className="text-sm font-bold text-gray-900 truncate block">
                        {displayName}
                      </span>
                      <div className="flex items-center gap-2">
                        <span className="text-[10px] font-medium text-gray-400 capitalize">
                          {dish.region} · {dish.type}
                        </span>
                        <button
                          onClick={handleSwapOpen}
                          className="group h-8 rounded-xl border border-dashed border-emerald-400 text-emerald-600 active:scale-90 transition-all flex items-center gap-1 px-2.5 ml-auto"
                          aria-label="Swap dish">
                          <Sparkles size={13} className="transition-transform duration-200 group-hover:scale-110" />
                          <span className="text-[10px] font-bold">Swap</span>
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* ─── Quantity ─── */}
                  <div className="flex items-center gap-2 mt-3">
                    <span className="text-[10px] font-black uppercase tracking-widest text-gray-400">Qty</span>
                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => { setQuantity(Math.max(1, quantity - 1)); syncNeeded.current = true; }}

                        disabled={quantity <= 1}
                        className="w-7 h-7 rounded-lg flex items-center justify-center bg-white border border-gray-200 text-gray-600 active:scale-90 disabled:opacity-30"
                        aria-label="Decrease quantity">
                        <Minus size={10} />
                      </button>
                      <span className="w-8 text-center text-sm font-bold text-gray-800 tabular-nums">
                        {quantity}
                      </span>
                      <button
                        onClick={() => { setQuantity(Math.min(50, quantity + 1)); syncNeeded.current = true; }}
                        disabled={quantity >= 50}
                        className="w-7 h-7 rounded-lg flex items-center justify-center bg-white border border-gray-200 text-gray-600 active:scale-90 disabled:opacity-30"
                        aria-label="Increase quantity">
                        <Plus size={10} />
                      </button>
                    </div>
                  </div>

                  {/* ─── Per-Dish Customization ─── */}
                  <div className="mt-4 space-y-3">
                    {/* ─── STYLE PICKER ─── */}
                    <div className="rounded-2xl border border-gray-200 overflow-hidden">
                      <button
                        type="button"
                        onClick={() => setShowStylePicker(prev => !prev)}
                        className="w-full flex items-center justify-between p-4 text-left active:bg-gray-50 transition-colors">
                        <div className="flex items-center gap-2 min-w-0">
                          <span className="text-[13px]">🎨</span>
                          <span className="text-[10px] font-black uppercase tracking-widest text-gray-500">
                            Pick a Style
                            {selectedStyleGroup && (
                              <span className="ml-1.5 text-[9px] font-bold text-[#FF385C] bg-[#FF385C]/10 px-1.5 py-0.5 rounded-full">
                                {STYLE_GROUP_ICONS[selectedStyleGroup]} {selectedStyleGroup}
                              </span>
                            )}
                          </span>
                        </div>
                        <ChevronDown
                          size={14}
                          className={`text-gray-400 transition-transform duration-200 ${showStylePicker ? 'rotate-180' : ''}`}
                        />
                      </button>
                      {showStylePicker && (
                        <div className="px-4 pb-4">
                          <p className="text-[9px] text-gray-400 mb-3">Changing style updates the suggested accompaniments</p>
                          <div className="grid grid-cols-4 gap-2">
                            {styleGroups.map(group => {
                              const active = selectedStyleGroup === group;
                              return (
                                <button
                                  key={group}
                                  onClick={() => handleStyleSelect(group)}
                                  className={`flex flex-col items-center gap-1 p-2.5 rounded-xl transition-all ${
                                    active
                                      ? 'bg-[#FF385C]/10 border-2 border-[#FF385C]'
                                      : 'bg-gray-50 border border-gray-100 hover:border-gray-200'
                                  }`}
>
                                  <span className="text-xl">{STYLE_GROUP_ICONS[group]}</span>
                                  <span className={`text-[8px] font-bold ${active ? 'text-[#FF385C]' : 'text-gray-500'}`}>
                                    {group}
                                  </span>
                                </button>
                              );
                            })}
                          </div>
                        </div>
                      )}
                    </div>

                    {/* ─── STREET FOOD TOOLTIP ─── */}
                    {isStreetFoodDish && (
                      <div className="rounded-xl bg-amber-50 border border-amber-200 p-3 flex items-start gap-2">
                        <Info size={13} className="text-amber-500 mt-0.5 flex-shrink-0" />
                        <p className="text-[10px] text-amber-700">
                          Street food best with sides &amp; beverages. Add bread/rice if you need the extra carbs.
                        </p>
                      </div>
                    )}

                    {/* ─── Selections Summary — always visible (deduplicated via selectionMap) ─── */}
                    {selectionMap.size > 0 && (
                      <div className="rounded-2xl bg-[#FF385C]/5 border border-[#FF385C]/15 p-3">
                        <p className="text-[9px] font-black uppercase tracking-widest text-[#FF385C] mb-2">Your Selections</p>
                        <div className="flex flex-wrap gap-1.5">
                          {Array.from(selectionMap.values()).map(({ name, qty, category, mapKey }) => {
                            const icon = CATEGORY_CONFIG[category].icon;
                            return (
                              <span
                                key={mapKey}
                                className="inline-flex items-center gap-1 px-2 py-1 rounded-full bg-white border border-[#FF385C]/20 text-[#FF385C] text-[10px] font-bold shadow-sm"
                              >
                                {icon && <span className="text-[11px]">{icon}</span>}
                                <span>{name}</span>
                                {qty > 1 && (
                                  <span className="text-[8px] font-bold text-[#FF385C]/60 ml-0.5">×{qty}</span>
                                )}
                                <button
                                  onClick={(e) => { e.stopPropagation(); toggleCategoryItemWrap(category, name); }}
                                  className="ml-0.5 hover:bg-[#FF385C]/10 rounded-full p-0.5"
                                  aria-label={`Remove ${name}`}
                                >
                                  <X size={10} />
                                </button>
                              </span>
                            );
                          })}
                        </div>
                      </div>
                    )}

                    {/* ─── CATEGORIES — collapsible accordions ─── */}
                    {allCategories.map(cat => {
                      const options = mergedOptions[cat] ?? [];
                      const meta = CATEGORY_CONFIG[cat];
                      const selected = selectedCategories[cat];
                      const isRecommended = recommendedCats.includes(cat);
                      const expanded = expandedCategories[cat] ?? false;

                      return (
                        <div key={cat} className={`rounded-2xl border ${isRecommended ? 'border-gray-200' : 'border-dashed border-gray-200/70'} overflow-hidden`}>
                          {/* Accordion Header */}
                          <button
                            type="button"
                            onClick={() => toggleExpanded(cat)}
                            className="w-full flex items-center justify-between p-4 text-left active:bg-gray-50 transition-colors">
                            <div className="flex items-center gap-2 min-w-0">
                              <span className="text-[13px]">{meta.icon}</span>
                              <span className="text-[10px] font-black uppercase tracking-widest text-gray-500">
                                {meta.label}
                                {selected.length > 0 && (
                                  <span className="ml-1.5 text-[9px] font-bold text-[#FF385C] bg-[#FF385C]/10 px-1.5 py-0.5 rounded-full">
                                    {selected.length}
                                  </span>
                                )}
                              </span>
                              {!isRecommended && selected.length === 0 && (
                                <span className="text-[8px] text-gray-300 italic font-normal lowercase">optional</span>
                              )}
                            </div>
                            <div className="flex items-center gap-2">
                              {selected.length >= meta.max && !overrideLimit && expanded && (
                                <button
                                  onClick={(e) => { e.stopPropagation(); toggleOverrideLimit(); }}
                                  className="text-[9px] font-bold text-[#FF385C] underline">
                                  Add more
                                </button>
                              )}
                              <ChevronDown
                                size={14}
                                className={`text-gray-400 transition-transform duration-200 ${expanded ? 'rotate-180' : ''}`}
                              />
                            </div>
                          </button>

                          {/* Compact badges (collapsed) */}
                          {!expanded && selected.length > 0 && (
                            <div className="px-4 pb-4 flex flex-wrap gap-1.5">
                              {selected.map(item => {
                                const icon = ICON_MAP[item.toLowerCase()] ?? '';
                                return (
                                  <span
                                    key={item}
                                    className="inline-flex items-center gap-1 px-2 py-1 rounded-full bg-[#FF385C]/10 text-[#FF385C] text-[10px] font-bold">
                                    {icon && <span className="text-[11px]">{icon}</span>}
                                    <span>{item}</span>
                                    <button
                                      onClick={(e) => { e.stopPropagation(); toggleCategoryItemWrap(cat, item); }}
                                      className="ml-0.5 hover:bg-[#FF385C]/20 rounded-full p-0.5"
                                      aria-label={`Remove ${item}`}>
                                      <X size={10} />
                                    </button>
                                  </span>
                                );
                              })}
                            </div>
                          )}

                          {/* Expanded full grid */}
                          {expanded && (
                            <div className="px-4 pb-4 max-h-60 overflow-y-auto">
                              {!isRecommended && selected.length === 0 && (
                                <p className="text-[9px] text-gray-300 italic mb-2">add if needed</p>
                              )}
                              <div className="flex flex-wrap gap-2">
                                {options.map(opt => {
                                  const active = selected.includes(opt);
                                  const limitReached = selected.length >= meta.max && !active && !overrideLimit;
                                  const icon = ICON_MAP[opt.toLowerCase()] ?? '';
                                  const nutWarning = isNutItem(opt);
                                  const blocked = allergyMode && nutWarning && !active;
                                  const itemRegion = getItemRegion(opt);
                                  const regionMismatch = itemRegion && dishRegion && !dishRegion.toLowerCase().includes(itemRegion);

                                  return (
                                    <div key={opt} className="relative">
                                      <button
                                        onClick={() => {
                                          if (blocked) return;
                                          toggleCategoryItemWrap(cat, opt);
                                        }}
                                        className={`h-9 px-3.5 rounded-full text-xs font-semibold flex items-center gap-1.5 transition-all ${
                                          blocked
                                            ? 'bg-red-50 text-red-300 border border-red-100 cursor-not-allowed line-through'
                                            : active
                                              ? 'bg-[#FF385C] text-white shadow-sm scale-[1.02]'
                                              : limitReached
                                                ? 'bg-gray-100 text-gray-300 cursor-not-allowed'
                                                : 'bg-white text-gray-600 border border-gray-200 hover:border-gray-300'
                                        }`}
                                        disabled={limitReached || blocked}
                                        aria-label={`${opt} ${meta.label}`}>
                                        {icon && <span className="text-[11px]">{icon}</span>}
                                        <span>{opt}</span>
                                        {regionMismatch && (
                                          <span className="text-[8px] opacity-60 ml-0.5" title={`${itemRegion} item`}>
                                            🌏
                                          </span>
                                        )}
                                      </button>
                                      {blocked && (
                                        <span className="absolute -top-1 -right-1 w-3 h-3 bg-red-500 rounded-full flex items-center justify-center">
                                          <span className="text-[6px] text-white font-bold">!</span>
                                        </span>
                                      )}
                                      {nutWarning && !blocked && !active && (
                                        <span className="absolute -top-1 -right-1 w-3 h-3 bg-amber-300 rounded-full flex items-center justify-center" title="Contains nuts">
                                          <span className="text-[6px] text-amber-800 font-bold">⚠</span>
                                        </span>
                                      )}
                                    </div>
                                  );
                                })}
                              </div>
                              {overrideLimit && selected.length >= meta.max && (
                                <p className="text-[9px] text-amber-600 mt-2 flex items-center gap-1">
                                  <AlertTriangle size={9} />
                                  Limit overridden — tap selected to remove
                                </p>
                              )}
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              ) : (
                <div className="rounded-2xl border border-dashed border-gray-300 p-8 text-center">
                  <p className="text-sm font-medium text-gray-400">No dish selected</p>
                  <button
                    onClick={handleSwapOpen}
                    className="mt-3 text-xs font-bold text-[#FF385C] underline">
                    Choose a dish
                  </button>
                </div>
              )}

              {/* ─── GLOBAL ALLERGY TOGGLE ─── */}
              <div className="flex items-center justify-end gap-2">
                <button
                  onClick={() => updateProfile({ allergyMode: !allergyMode })}
                  className={`text-[9px] font-bold px-2.5 py-1 rounded-full border transition-all ${
                    allergyMode
                      ? 'bg-red-50 text-red-600 border-red-200'
                      : 'bg-gray-50 text-gray-400 border-gray-200'
                  }`}
>
                  {allergyMode ? '🛡️ Allergy Safe' : 'Allergy mode off'}
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Footer actions */}
        {!showSwapSearch && (
          <div className="shrink-0 px-5 py-4 border-t border-gray-100 bg-white flex gap-3">
            <button
              onClick={handleClose}
              className="flex-1 py-3 rounded-xl bg-gray-100 text-gray-600 font-bold text-sm active:scale-[0.98] transition-all">
              Cancel
            </button>
            <button
              onClick={handleApply}
              className="flex-1 py-3 rounded-xl bg-[#FF385C] text-white font-bold text-sm flex items-center justify-center gap-2 active:scale-[0.98] transition-all shadow-lg shadow-[#FF385C]/30">
              <Check size={14} />
              Apply
            </button>
          </div>
        )}

        <style>{`
          @media (prefers-reduced-motion: reduce) {
            .animate-in { animation: none !important; }
            .transition-all { transition: none !important; }
            .active\\:scale-\\[0\\.98\\]:active { transform: none !important; }
          }
        `}</style>
      </div>
    </div>
  );
});

SwapCustomizeModal.displayName = 'SwapCustomizeModal';
export default SwapCustomizeModal;
