import React, { useState, useMemo, useEffect } from 'react';
import { useStore, type CategorySelection } from '../../app/store/useStore';
import { useTrayStore, type MealType } from '../../plan/store/useTrayStore';
import { useBackendDishes } from '../../hooks/useBackendDishes';
import { useBackButtonClose } from '../../hooks/useBackButtonClose';
import { Plus, X, Share2, Check, ShoppingCart } from 'lucide-react';
import { type ShareLanguage } from '../../utils/shareMessages';
import {
    buildPantryShareMessage,
    type PantryShareCategory,
    type PantryShareMeal,
    type PantryShareSurplus,
} from '../../utils/pantryShare';
import {
    buildPantryGroups,
    getTomorrowISO,
    getWeekEndISO,
    getIngredientsForMealOption,
    getIngredientsForCategoryOption,
    invalidateIngredientCache,
    CATEGORY_META,
    type PantryGroup,
} from '../../utils/ingredientUtils';
import type { Ingredient, IngredientCategory } from '../../meal/constants/dishLibrary';
import WhatsAppShareModal from './WhatsAppShareModal';
import NotificationCenter from '../notification/NotificationCenter';
import DishImage from './DishImage';
import { isAfterEnd, SLOT_TIME_DEFAULTS, computeEffectiveServings } from '../../types/tray';
import { getISODate, addDaysISO, daysUntil } from '../../utils/dateUTC';
import PullToRefresh from './PullToRefresh';
import { usePantryStore } from '../../app/store/pantryStore';
import { usePantryInventoryStore, groupPurchasesByDay } from '../../app/store/pantryInventoryStore';
import {
    forecastForEntry,
    defaultExpiry,
    type InventoryEntry,
    type ForecastResult,
} from '../../utils/pantryForecast';
import { expenseApi } from '../../app/utils/expenseApi';

interface PantryItem {
    id: string;
    name: string;
    quantity: string;
    unit: string;
    category: string;
    checked: boolean;
    source: 'auto' | 'manual';
    sources: string[];
}

const PantryPulse: React.FC = () => {
    const { user, customDishes } = useStore();
    const { dishes } = useBackendDishes();
    const getMeals = useTrayStore(s => s.getMeals);
    const planDays = useTrayStore(s => s.plan.days);
    const guestMode = useTrayStore(s => s.guestMode);
    const { checkedItems, setChecked } = usePantryStore();
    const [manualItems, setManualItems] = useState<PantryItem[]>([]);
    const [newItem, setNewItem] = useState('');
    const [packQty, setPackQty] = useState('');
    const [packUnit, setPackUnit] = useState('ml');
    const [sharePhone, setSharePhone] = useState(user?.cookContact || '');
    const [showShareInput, setShowShareInput] = useState(false);
    const [showShareModal, setShowShareModal] = useState(false);
    const [showAddItem, setShowAddItem] = useState(false);
    useBackButtonClose(showAddItem, () => setShowAddItem(false));
    const [refreshKey, setRefreshKey] = useState(0);

    const tomorrowISO = getTomorrowISO();
    const weekEndISO = getWeekEndISO();
    const todayISO = getISODate(new Date());

    // U11: day-scoped reset of auto-checks — stale "have it" marks from a
    // previous IST day's grocery view must not persist into today's list.
    useEffect(() => {
        usePantryStore.getState().resetChecksForDay(todayISO);
    }, [todayISO]);

    // ─── P0: pantry surplus forecast ───────────────────────────────────
    const inventoryEntries = usePantryInventoryStore(s => s.entries);
    const purchaseEvents = usePantryInventoryStore(s => s.purchaseEvents);
    const forecastSnacks = user?.plannedSlots?.includes('Snacks') ?? false;
    const forecastResults = useMemo<ForecastResult[]>(() => {
        if (!inventoryEntries.length) return [];
        const today = getISODate(new Date());
        const horizonDates = [1, 2, 3].map(n => addDaysISO(tomorrowISO, n - 1));
        const mealtimes = (forecastSnacks ? ['Breakfast', 'Lunch', 'Snacks', 'Dinner'] : ['Breakfast', 'Lunch', 'Dinner']);
        const workspace = {
            horizonDates,
            dishes,
            getDayItems: (date: string) => {
                const items: Array<{ mealId: string; quantity: number }> = [];
                for (const slot of mealtimes) {
                    for (const m of getMeals(date, slot as any)) {
                        if (m?.meal_id) {
                            items.push({ mealId: m.meal_id, quantity: computeEffectiveServings(m.quantity || 1, date, guestMode).total });
                        }
                    }
                }
                return items;
            },
        };
        return inventoryEntries
            .filter(e => e.quantity > 0)
            .map(e => forecastForEntry(e, workspace, {
                todayISO: today,
                resolver: (dishId, pool) =>
                    getIngredientsForMealOption(dishId.toString(), '', pool as any),
            }))
            .sort((a, b) => {
                // expired first, then biggest surplus, then name
                if (a.expired !== b.expired) return a.expired ? -1 : 1;
                return (b.surplus - a.surplus) || a.entry.name.localeCompare(b.entry.name);
            });
    }, [inventoryEntries, dishes, getMeals, guestMode, forecastSnacks, tomorrowISO]);
    
    // P2: recent-purchases history — user-facing sources only (no restock noise),
    // rolled up by IST day, newest first, capped at 3 day-groups for a compact strip.
    const recentPurchaseGroups = useMemo(() => {
        const userEvents = (purchaseEvents ?? []).filter(ev => ev.source === 'bought' || ev.source === 'manual');
        return groupPurchasesByDay(userEvents, 3);
    }, [purchaseEvents]);

    // Check if all today's slots are passed
    const allTodaySlotsPassed = () => {
        const dinner = SLOT_TIME_DEFAULTS.dinner;
        return isAfterEnd(dinner.start, dinner.end);
    };
    
    const [viewMode, setViewMode] = useState<'meals' | 'household'>('meals');
    const [subView, setSubView] = useState<'tomorrow' | 'week'>('tomorrow');
    const householdId = useStore(s => s.householdId);
    // Persist viewMode across sessions
    useEffect(() => {
        const saved = usePantryStore.getState().lastViewMode;
        if (saved === 'household' && householdId) setViewMode('household');
    }, [householdId]);
    const onViewModeChange = (v: 'meals' | 'household') => { setViewMode(v); usePantryStore.getState().setLastViewMode(v); };
    // Household meals state
    const [householdMeals, setHouseholdMeals] = useState<any[]>([]);
    const [householdMembers, setHouseholdMembers] = useState<{ id: string; name: string }[]>([]);
    const [householdName, setHouseholdName] = useState('');
    
    // Auto-sync on navigation to pantry tab (replaces unreliable pull-to-refresh)
    useEffect(() => { useTrayStore.getState().syncOfflineQueue(); }, []);

    // FIX-10: Listen for pantry invalidation events (swap/cancel)
    React.useEffect(() => {
        const handlePantryInvalidate = () => {
            invalidateIngredientCache();
            setRefreshKey(k => k + 1);
        };
        
        window.addEventListener('pantry:invalidate', handlePantryInvalidate);
        return () => window.removeEventListener('pantry:invalidate', handlePantryInvalidate);
    }, []);

    // Invalidate ingredient cache when dishes change (new dishes loaded from backend)
    React.useEffect(() => {
        if (dishes.length > 0) {
            invalidateIngredientCache();
            setRefreshKey(k => k + 1);
        }
    }, [dishes.length]);

    // Fetch household meals for consolidated grocery list
    useEffect(() => {
        if (viewMode !== 'household' || !householdId) {
            setHouseholdMeals([]);
            return;
        }
        const today = getISODate();
        const end = addDaysISO(today, 14);
        expenseApi.householdMeals(householdId, today, end).then(data => {
            setHouseholdMeals(data.meals || []);
            setHouseholdMembers(data.members || []);
        }).catch(() => setHouseholdMeals([]));
        // Fetch household name for header
        fetch(`/api/v1/households/${householdId}`).then(r => r.json()).then(data => {
            if (data?.name) setHouseholdName(data.name);
        }).catch(() => {});
    }, [viewMode, householdId, refreshKey]);
    
    // Check if user has snacks in planned slots
    const includeSnacks = user?.plannedSlots?.includes('Snacks') ?? false;
    const allSlots = includeSnacks ? ['Breakfast', 'Lunch', 'Snacks', 'Dinner'] as const : ['Breakfast', 'Lunch', 'Dinner'] as const;

    const groups = useMemo((): PantryGroup[] => {
        const allIngredients: { ing: Ingredient; source: string }[] = [];
        const processSlot = (date: string, slot: string, seenMealIds: Set<string>) => {
            const mealType = slot.toLowerCase() as MealType;
            const meals = getMeals(date, mealType);
            for (const item of meals) {
                if (seenMealIds.has(item.meal_id)) continue;
                seenMealIds.add(item.meal_id);
                // Scale ingredient quantities by guest mode
                const servings = computeEffectiveServings(item.quantity || 1, date, guestMode);
                const guestFactor = servings.total / Math.max(1, servings.base);
                const catSelections: CategorySelection = {
                    gravy: item.gravy ? { id: item.gravy, name: item.gravy } : null,
                    roti: item.roti ? { id: item.roti, name: item.roti } : null,
                    rice: item.rice ? { id: item.rice, name: item.rice } : null,
                    sides: (item.sides || []).map(s => ({ id: s, name: s })),
                    beverages: (item.beverages || []).map(b => ({ id: b, name: b })),
                    dessert: (item.dessert || []).map(d => ({ id: d, name: d })),
                    itemQtys: item.itemQtys,
                };
                const pool = customDishes.length > 0 ? [...dishes, ...customDishes] : dishes;
                const ings = getIngredientsForMealOption(item.meal_id, item.variantId || '', pool, catSelections);
                const subItemKeys = new Set<string>();
                const pushIng = (ing: Ingredient, source: string) => {
                    subItemKeys.add(`${ing.name}:${ing.category}`);
                    allIngredients.push({
                        ing: { ...ing, quantity: ing.quantity * (item.quantity || 1) * guestFactor },
                        source,
                    });
                };
                for (const d of (item.dessert || [])) {
                    for (const ing of getIngredientsForCategoryOption(d)) pushIng(ing, `${item.name} · ${d}`);
                }
                for (const s of (item.sides || [])) {
                    for (const ing of getIngredientsForCategoryOption(s)) pushIng(ing, `${item.name} · ${s}`);
                }
                for (const b of (item.beverages || [])) {
                    for (const ing of getIngredientsForCategoryOption(b)) pushIng(ing, `${item.name} · ${b}`);
                }
                for (const ing of ings) {
                    if (!subItemKeys.has(`${ing.name}:${ing.category}`)) {
                        allIngredients.push({
                            ing: { ...ing, quantity: ing.quantity * (item.quantity || 1) * guestFactor },
                            source: item.name,
                        });
                    }
                }
            }
        };
        if (subView === 'tomorrow') {
            const dtSeen = new Set<string>();
            for (const slot of allSlots) {
                processSlot(tomorrowISO, slot, dtSeen);
            }
        } else if (subView === 'week') {
            const start = new Date(tomorrowISO + 'T00:00:00');
            const end = new Date(weekEndISO + 'T00:00:00');
            for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
                const isoDate = getISODate(d);
                const dtSeen = new Set<string>();
                for (const slot of allSlots) {
                    processSlot(isoDate, slot, dtSeen);
                }
            }
        } else if (viewMode === 'household') {
            // Process household members' meals from the API
            const memberMeals: Record<string, any[]> = {};
            for (const m of householdMeals) {
                const key = m.requestedBy || 'Unknown';
                if (!memberMeals[key]) memberMeals[key] = [];
                memberMeals[key].push(m);
            }
            const allSeen = new Set<string>();
            for (const [memberName, mMeals] of Object.entries(memberMeals)) {
                for (const hm of mMeals) {
                    if (allSeen.has(hm.meal_id)) continue;
                    allSeen.add(hm.meal_id);
                    // Build a virtual TrayItem-like object from the household meal
                    const virtualItem = {
                        meal_id: hm.meal_id,
                        name: hm.name,
                        quantity: hm.quantity || 1,
                        gravy: hm.gravy || null,
                        roti: hm.roti || null,
                        rice: hm.rice || null,
                        sides: hm.sides || [],
                        beverages: hm.beverages || [],
                        dessert: [] as string[],
                        variantId: '',
                        itemQtys: {} as Record<string, number>,
                    };
                    const servings = computeEffectiveServings(virtualItem.quantity, hm.date, guestMode);
                    const guestFactor = servings.total / Math.max(1, servings.base);
                    const catSelections: CategorySelection = {
                        gravy: virtualItem.gravy ? { id: virtualItem.gravy, name: virtualItem.gravy } : null,
                        roti: virtualItem.roti ? { id: virtualItem.roti, name: virtualItem.roti } : null,
                        rice: virtualItem.rice ? { id: virtualItem.rice, name: virtualItem.rice } : null,
                        sides: (virtualItem.sides || []).map((s: string) => ({ id: s, name: s })),
                        beverages: (virtualItem.beverages || []).map((b: string) => ({ id: b, name: b })),
                        dessert: [],
                        itemQtys: virtualItem.itemQtys,
                    };
                    const pool = customDishes.length > 0 ? [...dishes, ...customDishes] : dishes;
                    const ings = getIngredientsForMealOption(virtualItem.meal_id, virtualItem.variantId || '', pool, catSelections);
                    const prefix = `${memberName} — `;
                    const pushIng = (ing: Ingredient, src: string) => {
                        allIngredients.push({
                            ing: { ...ing, quantity: ing.quantity * (virtualItem.quantity || 1) * guestFactor },
                            source: `${prefix}${src}`,
                        });
                    };
                    for (const s of (virtualItem.sides || [])) {
                        for (const ing of getIngredientsForCategoryOption(s)) pushIng(ing, `${virtualItem.name} · ${s}`);
                    }
                    for (const b of (virtualItem.beverages || [])) {
                        for (const ing of getIngredientsForCategoryOption(b)) pushIng(ing, `${virtualItem.name} · ${b}`);
                    }
                    for (const ing of ings) {
                        allIngredients.push({
                            ing: { ...ing, quantity: ing.quantity * (virtualItem.quantity || 1) * guestFactor },
                            source: `${prefix}${virtualItem.name}`,
                        });
                    }
                }
            }
        }
        return buildPantryGroups(allIngredients);
    }, [viewMode, subView, getMeals, dishes, customDishes, tomorrowISO, weekEndISO, includeSnacks, refreshKey, planDays, guestMode]);

    const mealCount = useMemo(() => {
        let count = 0;
        for (const day of Object.values(planDays)) {
            count += day.breakfast.length;
            count += day.lunch.length;
            count += day.snacks.length;
            count += day.dinner.length;
        }
        return count;
    }, [planDays]);

    const manual = useMemo(() => manualItems.filter(i => i.source === 'manual'), [manualItems]);

    const CATEGORY_KEYWORDS: Record<string, string[]> = {
        spices: ['asafoetida', 'bay', 'cardamom', 'chilli powder', 'cinnamon', 'clove', 'cumin', 'dalchini', 'dhania', 'elaichi', 'fenugreek', 'garam masala', 'haldi', 'hing', 'jeera', 'laung', 'masala', 'methi', 'mustard', 'paprika', 'peppercorn', 'pepper', 'rai', 'salt', 'seasoning', 'spice', 'sugar', 'tamarind', 'turmeric powder'],
        produce: ['apple', 'avocado', 'banana', 'beans', 'beetroot', 'broccoli', 'cabbage', 'capsicum', 'carrot', 'cauliflower', 'chilli', 'coriander', 'cucumber', 'curry', 'eggplant', 'garlic', 'ginger', 'green', 'herb', 'ladyfinger', 'lemon', 'lettuce', 'lime', 'mint', 'mushroom', 'okra', 'onion', 'peas', 'potato', 'pumpkin', 'radish', 'salad', 'shallot', 'spinach', 'spring', 'squash', 'tomato', 'vegetable', 'zucchini'],
        proteins: ['chicken', 'chole', 'dal', 'egg', 'fish', 'keema', 'lamb', 'legume', 'lentil', 'meat', 'mutton', 'paneer', 'pork', 'prawn', 'protein', 'pulse', 'rajma', 'seafood', 'shrimp', 'soy', 'tofu'],
        dairy: ['butter', 'cheese', 'cream', 'curd', 'dahi', 'ghee', 'khoya', 'lassi', 'milk', 'yogurt'],
        grains: ['atta', 'barley', 'cereal', 'corn', 'couscous', 'flour', 'grain', 'maida', 'noodle', 'oats', 'pasta', 'quinoa', 'rava', 'rice', 'sooji', 'wheat'],
        breads: ['baguette', 'bread', 'bun', 'chapati', 'kulcha', 'naan', 'paratha', 'pav', 'roti', 'tortilla'],
        pantry: ['almond', 'baking', 'badam', 'cashew', 'chocolate', 'chutney', 'coconut', 'dry fruit', 'honey', 'jam', 'kaju', 'ketchup', 'mayo', 'mayonnaise', 'oil', 'paste', 'peanut', 'pickle', 'raisin', 'sauce', 'soda', 'stock', 'syrup', 'vanilla', 'vinegar'],
        snacks: ['biscuit', 'chip', 'cookie', 'namkeen', 'snack'],
    };

    const classifyIngredient = (name: string): string | null => {
        const lower = name.toLowerCase();
        for (const [category, keywords] of Object.entries(CATEGORY_KEYWORDS)) {
            if (keywords.some(k => lower.includes(k))) return category;
        }
        return null;
    };

    const { mergedGroups, unmatchedManual } = useMemo(() => {
        const autoNames = new Set<string>();
        for (const g of groups) {
            for (const item of g.items) {
                autoNames.add(item.name.toLowerCase());
            }
        }
        const result: PantryGroup[] = groups.map(g => ({ ...g, items: [...g.items] }));
        const unmatched: PantryItem[] = [];
        for (const item of manual) {
            const lower = item.name.toLowerCase();
            if (autoNames.has(lower)) continue;
            const cat = classifyIngredient(item.name);
            if (cat) {
                const group = result.find(g => g.category === cat);
                if (group) {
                    group.items.push({
                        id: item.id,
                        name: item.name,
                        totalQuantity: parseFloat(item.quantity) || 1,
                        unit: item.unit || 'unit',
                        category: cat as IngredientCategory,
                        sources: item.sources || [],
                        checked: checkedItems[item.name] ?? false,
                    });
                    continue;
                }
            }
            unmatched.push(item);
        }
        return { mergedGroups: result, unmatchedManual: unmatched };
    }, [groups, manual, checkedItems]);

    const allItems = useMemo((): PantryItem[] => {
        const autoItems: PantryItem[] = groups.flatMap(group =>
            group.items.map(item => ({
                id: item.id,
                name: item.name,
                quantity: item.totalQuantity.toString(),
                unit: item.unit,
                category: item.category,
                checked: checkedItems[item.name] ?? false,
                source: 'auto' as const,
                sources: item.sources,
            }))
        );
        return [...autoItems, ...manual];
    }, [groups, manual, checkedItems]);

    const tomorrowMeals = useMemo(() => {
        if (!dishes.length) return [];
        const slots = includeSnacks
            ? (['Breakfast', 'Lunch', 'Snacks', 'Dinner'] as const)
            : (['Breakfast', 'Lunch', 'Dinner'] as const);
        const result: { slot: string; name: string; variant: string | undefined }[] = [];
        for (const slot of slots) {
            const mealType = slot.toLowerCase() as MealType;
            for (const meal of getMeals(tomorrowISO, mealType)) {
                result.push({ slot, name: meal.name, variant: undefined as string | undefined });
            }
        }
        return result;
    }, [tomorrowISO, getMeals, dishes, includeSnacks, planDays]);

    // Get all meals for the week (for "This Week" view) — skip tomorrow to avoid duplication
    const weekMeals = useMemo(() => {
        if (!dishes.length) return [];
        const meals: { date: string; slot: string; name: string; variant?: string }[] = [];
        const start = new Date(tomorrowISO + 'T00:00:00');
        for (let i = 1; i < 7; i++) {
            const date = new Date(start);
            date.setDate(start.getDate() + i);
            const isoDate = getISODate(date);
            const slots = includeSnacks
                ? (['Breakfast', 'Lunch', 'Snacks', 'Dinner'] as const)
                : (['Breakfast', 'Lunch', 'Dinner'] as const);
            for (const slot of slots) {
                const mealType = slot.toLowerCase() as MealType;
                for (const meal of getMeals(isoDate, mealType)) {
                    meals.push({ date: isoDate, slot, name: meal.name });
                }
            }
        }
        return meals;
    }, [getMeals, dishes, tomorrowISO, includeSnacks, planDays]);

    const toggleItem = (id: string) => {
        const item = allItems.find(it => it.id === id);
        if (item) setChecked(item.name, !(checkedItems[item.name] ?? false));
    };

    const toggleAutoItem = (id: string) => {
        const group = groups.find(g => g.items.find(i => i.id === id));
        const ingItem = group?.items.find(i => i.id === id);
        if (ingItem) setChecked(ingItem.name, !(checkedItems[ingItem.name] ?? false));
    };

    /** P0: one-tap "bought" — logs the suggested pack into the stock overlay (source 'bought'). */
    const buyItem = (item: { name: string; totalQuantity: number; unit: string; sources?: string[] }) => {
        const qty = item.totalQuantity > 0 ? item.totalQuantity : 1;
        // P2: "cook buys" attribution — in household view the aggregated item's
        // first source carries the "MemberName — dish" prefix; stamp the member
        // on the ledger row so history shows who asked for it.
        const requestedBy =
            viewMode === 'household'
                ? (item.sources?.[0] ?? '').split(' — ')[0]?.trim() || undefined
                : undefined;
        usePantryInventoryStore.getState().logPurchase(item.name, {
            quantity: qty,
            unit: item.unit || 'g',
            source: 'bought',
            requestedBy,
        });
        useStore.getState().setToast({ message: `🛒 ${item.name} added to stock`, type: 'success' });
    };

    const removeItem = (id: string) =>
        setManualItems(prev => prev.filter(it => it.id !== id));

    const addItem = () => {
        if (!newItem.trim()) return;
        setManualItems(prev => [...prev, {
            id: `manual-${Date.now()}`,
            name: newItem.trim(),
            quantity: '1',
            unit: 'unit',
            category: 'pantry',
            checked: false,
            source: 'manual',
            sources: [],
        }]);
        // P0: also log a pack into the surplus engine when the user gave a size.
        const qty = parseFloat(packQty);
        if (qty > 0) {
            usePantryInventoryStore.getState().logPurchase(newItem.trim(), {
                quantity: qty,
                unit: packUnit || 'ml',
                // category/storage/expiry auto-default inside logPurchase (P2).
            });
        }
        setNewItem('');
        setPackQty('');
    };

    const buildShareListMessage = (lang: ShareLanguage, _selectedSlots: string[]) => {
        const unchecked = allItems.filter(it => !it.checked);
        const checked = allItems.filter(it => it.checked);
        const groupedByCategory: Record<string, typeof unchecked> = {};
        unchecked.forEach(it => {
            if (!groupedByCategory[it.category]) groupedByCategory[it.category] = [];
            groupedByCategory[it.category]!.push(it);
        });

        const categories: PantryShareCategory[] = [];
        for (const cat of ['produce', 'proteins', 'dairy', 'grains', 'spices', 'pantry', 'breads']) {
            const catItems = groupedByCategory[cat];
            if (!catItems?.length) continue;
            const meta = CATEGORY_META[cat as keyof typeof CATEGORY_META];
            categories.push({
                key: cat,
                emoji: meta.emoji,
                label: meta.label.toUpperCase(),
                items: catItems.map(i => ({ name: i.name, quantity: i.quantity, unit: i.unit, sources: i.sources })),
            });
        }

        const meals = viewMode === 'household' ? [] : subView === 'tomorrow' ? tomorrowMeals : [...tomorrowMeals, ...weekMeals];
        const groupedBySlot: Record<string, typeof meals> = {};
        meals.forEach(m => {
            if (!groupedBySlot[m.slot]) groupedBySlot[m.slot] = [];
            groupedBySlot[m.slot]!.push(m);
        });
        const mealSlots: PantryShareMeal[] = Object.entries(groupedBySlot).map(([slot, slotMeals]) => ({
            slot: slot.toUpperCase(),
            items: slotMeals.map(m => ({ name: m.name, variant: m.variant })),
        }));

        const surplus: PantryShareSurplus[] = forecastResults
            .filter(r => r.status === 'surplus' && r.reuseSuggestions.length > 0 && !r.expired)
            .slice(0, 4)
            .map(r => ({
                name: r.entry.name,
                surplus: r.surplus,
                unit: r.entry.unit,
                expiry: r.entry.expiry,
                freezer: freezeCandidate(r, todayISO),
                dishes: r.reuseSuggestions.map(s => s.name),
            }));

        return buildPantryShareMessage({
            lang,
            region: user?.region || '',
            viewLabel: viewMode === 'household' ? 'Household meals' : subView === 'tomorrow' ? "Tomorrow's meals" : "This week's meals",
            checkedCount: checked.length,
            uncheckedCount: unchecked.length,
            totalMeals: viewMode === 'household' ? householdMeals.length : subView === 'tomorrow' ? tomorrowMeals.length : weekMeals.length + tomorrowMeals.length,
            categories,
            checkedNames: checked.map(i => i.name),
            meals: mealSlots,
            surplus,
        });
    };

    /** Surplus of a freezable item close to expiry → suggest freezing. Deterministic. */
    const freezeCandidate = (r: ForecastResult, dayISO: string): boolean => {
        if (r.expired || !r.entry.expiry) return false;
        const cat = r.entry.category;
        if (cat !== 'dairy' && cat !== 'proteins' && cat !== 'breads') return false;
        const daysLeft = daysUntil(r.entry.expiry, dayISO);
        return daysLeft <= 2;
    };

    const uncheckedCount = allItems.filter(i => !i.checked).length;
    const checkedCount = allItems.filter(i => i.checked).length;

    return (
        <div className="min-h-screen bg-white pb-32 animate-in fade-in duration-500 ">
            <WhatsAppShareModal
                isOpen={showShareModal}
                defaultPhone={sharePhone || user?.cookContact || ''}
                title="Kitchen List"
                onClose={() => setShowShareModal(false)}
                previewBuilder={buildShareListMessage}
                availableSlots={[]}
            />
            <PullToRefresh onRefresh={() => { useTrayStore.getState().syncOfflineQueue(); return; }}>
            <header className="px-4 pt-10 pb-3">
                <div className="flex items-end justify-between mb-3">
                    <div className="min-w-0 flex-1">
                        <span className="text-2xl font-black tracking-tight leading-none" style={{WebkitFontSmoothing:'antialiased'}}>Meal<span className="text-[#FF385C]">Drama</span></span>
                        <h2 className="text-xl font-bold tracking-tight text-gray-900 mt-1">in the Kitchen</h2>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                        <button onClick={() => {if(!(sharePhone||user?.cookContact)){useStore.getState().setToast({message:'Enter a phone number in Profile first',type:'info'});return;}setShowShareModal(true);}}
                            className="flex items-center gap-2 bg-[#FF385C] text-white px-4 py-2.5 rounded-xl text-xs font-black uppercase tracking-widest active:scale-95 transition-all shadow-sm"
                        ><Share2 size={14} /> Share</button>
                        <NotificationCenter defaultTab="pantry" />
                    </div>
                </div>
                <div className="flex items-center gap-2 mb-4">
                    <span className="text-sm font-bold text-emerald-600">✅ {checkedCount} in kitchen</span>
                    <span className="text-gray-300">·</span>
                    <span className="text-sm font-bold text-orange-600">❌ {uncheckedCount} to buy</span>
                </div>

                {/* ─── Recent purchases (P2) ─── */}
                {recentPurchaseGroups.length > 0 && (
                    <div className="px-0 mb-4">
                        <div className="rounded-2xl border border-amber-100 bg-amber-50/40 p-3">
                            <p className="text-xs font-black uppercase tracking-widest text-amber-700 mb-2">🛒 Recent purchases</p>
                            <div className="space-y-1.5">
                                {recentPurchaseGroups.map(g => (
                                    <div key={g.boughtOn} className="text-xs">
                                        <p className="font-black text-gray-500 mb-0.5">{g.boughtOn} · {g.events.length} item{g.events.length === 1 ? '' : 's'}</p>
                                        {g.events.map(ev => (
                                            <div key={`${ev.purchasedAt}-${ev.name}`} className="flex items-center justify-between gap-2 py-0.5">
                                                <span className="font-bold text-gray-800 truncate">
                                                    {ev.name} {ev.quantity}{ev.unit}
                                                    {ev.requestedBy ? <span className="text-gray-400 font-medium"> · {ev.requestedBy}</span> : null}
                                                </span>
                                                <button
                                                    onClick={() => usePantryInventoryStore.getState().logPurchase(ev.name, {
                                                        quantity: ev.quantity,
                                                        unit: ev.unit,
                                                        source: 'bought',
                                                    })}
                                                    className="shrink-0 w-6 h-6 rounded-lg border border-emerald-100 bg-emerald-50 text-emerald-600 flex items-center justify-center active:scale-90"
                                                    aria-label={`Re-buy ${ev.name}`}
                                                >
                                                    <Plus size={12} />
                                                </button>
                                            </div>
                                        ))}
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                )}

                {/* ─── Leftover radar (P0) ─── */}
                {forecastResults.length > 0 && (
                    <div className="px-0 mb-4">
                        <div className="rounded-2xl border border-amber-200 bg-amber-50 p-3">
                            <p className="text-xs font-black uppercase tracking-widest text-amber-700 mb-2">🧊 Leftover radar</p>
                            <div className="space-y-3">
                                {forecastResults.filter(r => r.status === 'surplus' || r.expired).slice(0, 3).map(r => {
                                    const useBy = r.entry.expiry;
                                    const daysLeft = useBy ? daysUntil(useBy, todayISO) : null;
                                    const badge = r.expired
                                        ? <span className="inline-flex items-center gap-1 rounded-full bg-red-100 text-red-600 px-2 py-0.5 text-[10px] font-bold shrink-0">⚰️ expired</span>
                                        : daysLeft === 0
                                            ? <span className="inline-flex items-center gap-1 rounded-full bg-amber-100 text-amber-700 px-2 py-0.5 text-[10px] font-bold shrink-0">⚠️ expires today</span>
                                            : daysLeft !== null && daysLeft <= 2
                                                ? <span className="inline-flex items-center gap-1 rounded-full bg-amber-100 text-amber-700 px-2 py-0.5 text-[10px] font-bold shrink-0">⚠️ expires in {daysLeft} d</span>
                                                : useBy
                                                    ? <span className="inline-flex items-center gap-1 rounded-full bg-amber-50 text-amber-700 border border-amber-200 px-2 py-0.5 text-[10px] font-bold shrink-0">🗓️ use by {useBy}</span>
                                                    : null;
                                    return (
                                        <div key={r.entry.name} className="text-xs">
                                            <div className="flex items-center justify-between gap-2">
                                                <span className="font-bold text-gray-800">{r.entry.name}</span>
                                                <span className="flex items-center gap-1.5 shrink-0">
                                                    <span className="text-amber-700 font-bold">~{r.surplus} {r.entry.unit} left</span>
                                                    {badge}
                                                </span>
                                            </div>
                                            {r.status === 'surplus' && r.reuseSuggestions.length > 0 && (
                                                <p className="text-gray-500 mt-1 leading-snug">
                                                    Try: {r.reuseSuggestions.map(s => `${s.name} ${s.qty}${s.unit}`).join(' · ')}
                                                </p>
                                            )}
                                            {r.status === 'surplus' && r.reuseSuggestions.length === 0 && (
                                                <p className="text-gray-500 mt-1">Planned dishes cover it — no surplus dishes left to suggest.</p>
                                            )}
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                    </div>
                )}

                <div className="flex items-center gap-2">
                    <div className="flex gap-1 flex-1">
                        {(['tomorrow', 'week'] as const).map(v => (
                        <button key={v} onClick={() => setSubView(v)}
                            className={`flex-1 py-2 rounded-xl text-xs font-bold tracking-wider transition-all active:scale-95 ${
                                subView === v ? 'bg-[#FF385C] text-white shadow-sm' : 'bg-gray-100 text-gray-500 hover:text-gray-600'
                            }`}
                        >{v === 'tomorrow' ? 'Tomorrow' : 'This Week'}</button>
                        ))}
                    </div>
                    {householdId && householdId !== 'null' && householdId !== 'undefined' && (
                        <button onClick={() => onViewModeChange(viewMode === 'household' ? 'meals' : 'household')}
                            className={`shrink-0 px-3 py-2 rounded-xl text-xs font-bold tracking-wider transition-all active:scale-95 ${
                                viewMode === 'household' ? 'bg-[#FF385C] text-white shadow-sm' : 'bg-gray-100 text-gray-500 hover:text-gray-600'
                            }`}
                        >👥</button>
                    )}
                </div>
            </header>

            {/* Meals — circular thumbnails horizontal scroll */}
            {subView === 'tomorrow' && tomorrowMeals.length > 0 && (
                <div className="px-4 mb-5">
                    <div className="flex gap-3 overflow-x-auto pb-2 scrollbar-hide">
                        {(['Breakfast', 'Lunch', 'Snacks', 'Dinner'] as const).map(slot => {
                            const meals = tomorrowMeals.filter(m => m.slot === slot);
                            return meals.length > 0 ? meals.map((m, i) => (
                                <div key={`${slot}-${i}`} className="flex flex-col items-center gap-1 flex-shrink-0">
                                    <div className="w-20 h-20 rounded-full overflow-hidden border-2 border-gray-200 shadow-sm bg-gray-50 relative">
                                        <DishImage name={m.name} slot={m.slot} size="full" className="w-full h-full object-cover" />
                                    </div>
                                    <div className="h-[40px] flex items-center justify-center">
                                        <p className="text-xs font-bold text-gray-900 leading-tight max-w-[96px] text-center line-clamp-2">{m.name}</p>
                                    </div>
                                </div>
                            )) : null;
                        })}
                    </div>
                </div>
            )}

            {subView === 'week' && weekMeals.length > 0 && (
                <div className="px-4 mb-5">
                    <p className="text-xs font-black uppercase tracking-widest text-gray-500 mb-3">This Week</p>
                    <div className="flex gap-3 overflow-x-auto pb-2 scrollbar-hide">
                        {(['Breakfast', 'Lunch', 'Snacks', 'Dinner'] as const).map(slot => {
                            const meals = weekMeals.filter(m => m.slot === slot);
                            return meals.length > 0 ? meals.map((m, i) => (
                                <div key={`${slot}-${i}`} className="flex flex-col items-center gap-1 flex-shrink-0">
                                    <div className="w-20 h-20 rounded-full overflow-hidden border-2 border-gray-200 shadow-sm bg-gray-50 relative">
                                        <DishImage name={m.name} slot={m.slot} size="full" className="w-full h-full object-cover" />
                                    </div>
                                    <div className="h-[40px] flex items-center justify-center">
                                        <p className="text-xs font-bold text-gray-900 leading-tight max-w-[96px] text-center line-clamp-2">{m.name}</p>
                                    </div>
                                </div>
                            )) : null;
                        })}
                    </div>
                </div>
            )}

            {/* Household meals summary */}
            {viewMode === 'household' && householdMeals.length > 0 && (
                <div className="px-4 mb-5">
                    <p className="text-xs font-black uppercase tracking-widest text-gray-500 mb-3">
                        🏠 {householdName || 'Roommates'} ({householdMeals.length} meals)
                    </p>
                    <div className="flex gap-3 overflow-x-auto pb-2 scrollbar-hide">
                        {(() => {
                            const byMember: Record<string, any[]> = {};
                            for (const m of householdMeals) {
                                const name = m.requestedBy || 'Unknown';
                                if (!byMember[name]) byMember[name] = [];
                                byMember[name].push(m);
                            }
                            return Object.entries(byMember).map(([name, meals]) => (
                                <div key={name} className="flex-shrink-0 bg-gray-50 rounded-xl p-3 border border-gray-100 min-w-[140px]">
                                    <p className="text-xs font-black text-[#FF385C] uppercase tracking-widest mb-2">{name}</p>
                                    {meals.slice(0, 5).map((m: any, i: number) => (
                                        <p key={i} className="text-xs font-bold text-gray-800 truncate">{m.name}</p>
                                    ))}
                                    {meals.length > 5 && <p className="text-xs text-gray-500 mt-1">+{meals.length - 5} more</p>}
                                </div>
                            ));
                        })()}
                    </div>
                </div>
            )}

            {allItems.length === 0 && mealCount > 0 && (
                <div className="flex flex-col items-center justify-center py-24 px-8 text-center">
                    <div className="w-20 h-20 bg-gray-100 rounded-[24px] flex items-center justify-center text-4xl mb-6">🔄</div>
                    <h3 className="text-xl font-bold mb-2">Computing ingredients...</h3>
                    <p className="text-gray-500 text-sm">{mealCount} meals planned — generating your shopping list.</p>
                </div>
            )}
            {allItems.length === 0 && mealCount === 0 && (
                <div className="flex flex-col items-center justify-center py-24 px-8 text-center">
                    <div className="w-20 h-20 bg-gray-100 rounded-[24px] flex items-center justify-center text-4xl mb-6">🛒</div>
                    <h3 className="text-xl font-bold mb-2">Fridge looking shy?</h3>
                    <p className="text-gray-500 text-sm">Add meals to your tray and the list builds itself.</p>
                </div>
            )}

            {mergedGroups.map(group => (
                <div key={group.category} className="mb-4">
                    <div className="sticky top-0 z-10 bg-white px-4 pt-3 pb-2">
                        <div className="flex items-center gap-2">
                            <span className="text-base">{group.emoji}</span>
                            <span className="text-xs font-black uppercase tracking-widest text-gray-500">{group.label}</span>
                            <span className="text-xs font-black text-gray-300">{group.items.length} items</span>
                        </div>
                    </div>
                    <div className="px-4 grid grid-cols-2 gap-3">
                        {group.items.map(item => {
                            const checked = checkedItems[item.name] ?? false;
                            const mealSources = item.sources;
                            return (
                                <div
                                    key={item.id}
                                    className={`flex items-center gap-3 p-3 rounded-xl border transition-all active:scale-[0.98] hover:scale-[1.02] hover:shadow-md ${checked ? 'border-green-200 bg-green-50/50' : 'border-gray-100 bg-white'}`}
                                >
                                    <button
                                        onClick={() => setChecked(item.name, !checked)}
                                        className={`w-8 h-8 rounded-xl border flex items-center justify-center transition-all flex-shrink-0 ${checked ? 'bg-green-500 border-green-500 text-white' : 'border-gray-200 hover:border-gray-300'}`}
                                    >
                                        {checked && <Check size={16} />}
                                    </button>

                                    {!checked && (
                                        <button
                                            onClick={() => buyItem(item)}
                                            className="w-8 h-8 rounded-xl border border-emerald-100 bg-emerald-50 text-emerald-600 flex items-center justify-center transition-all flex-shrink-0 hover:border-emerald-300 active:scale-90"
                                            aria-label={`Add ${item.name} to stock`}
                                        >
                                            <ShoppingCart size={14} />
                                        </button>
                                    )}
                                    <div className="flex-1 min-w-0">
                                        <span className={`font-bold text-sm block leading-snug ${checked ? 'line-through text-gray-400' : 'text-gray-900'}`}>
                                            {item.name}
                                        </span>
                                        <span className="text-sm text-gray-400 font-medium">
                                            {item.totalQuantity} {item.unit}
                                        </span>
                                        {!checked && mealSources.length > 0 && (
                                            <span className="text-xs text-orange-500 block mt-0.5 font-medium truncate">
                                                🍽️ {mealSources.length <= 2 ? mealSources.join(', ') : `${mealSources.slice(0, 2).join(', ')} +${mealSources.length - 2} more`}
                                            </span>
                                        )}
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </div>
            ))}

            {unmatchedManual.length > 0 && (
                <div className="px-4 mb-4">
                    <div className="flex items-center gap-2 mt-4 mb-2">
                        <span className="text-xs font-black uppercase tracking-widest text-gray-300">Other Items</span>
                        <span className="text-xs font-black text-gray-200">{unmatchedManual.length} items</span>
                    </div>
                    <div className="space-y-2">
                        {unmatchedManual.map(item => {
                            const checked = checkedItems[item.name] ?? false;
                            return (
                                <div
                                    key={item.id}
                                    className={`flex items-center gap-3 p-3 rounded-xl border transition-all active:scale-[0.98] ${checked ? 'border-green-200 bg-green-50/50' : 'border-gray-100 bg-white'}`}
                                >
                                    <button
                                        onClick={() => toggleItem(item.id)}
                                        className={`w-7 h-7 rounded-full border flex items-center justify-center transition-all flex-shrink-0 ${checked ? 'bg-green-500 border-green-500' : 'border-gray-300 hover:border-gray-400'}`}
                                    >
                                        {checked && <Check size={14} className="text-white" />}
                                    </button>
                                    <span className={`flex-1 text-sm font-medium truncate ${checked ? 'line-through text-gray-400' : 'text-gray-800'}`}>{item.name}</span>
                                    <button onClick={() => removeItem(item.id)} className="p-1 rounded-full hover:bg-gray-100 transition-all">
                                        <X size={12} className="text-gray-300" />
                                    </button>
                                </div>
                            );
                        })}
                    </div>
                </div>
            )}

            {allItems.length > 0 && (
                <div className="px-4 mt-6">
                    <button
                        onClick={() => {
                            if (!(sharePhone || user?.cookContact)) { useStore.getState().setToast({message:'Enter a phone number in Profile first',type:'info'}); return; }
                            setShowShareModal(true);
                        }}
                        className="w-full py-4 bg-[#FF385C] text-white rounded-xl font-bold text-sm flex items-center justify-center gap-2 active:scale-[0.98] transition-all shadow-sm"
                    >
                        <Share2 size={16} />
                        Share List on WhatsApp
                    </button>
                    <p className="text-center text-sm text-gray-500 mt-3 font-medium">
                        Shares {uncheckedCount} unchecked items · Cook: {user?.cookContact || 'Set in Profile'}
                    </p>
                </div>
            )}
            <div className="h-24" />
            </PullToRefresh>

            {/* ─── Add item FAB ─── */}
            <div className="fixed bottom-28 right-6 z-[60]">
                <button
                    onClick={() => { setNewItem(''); setShowAddItem(true); }}
                    className="w-14 h-14 bg-[#FF385C] text-white rounded-full shadow-xl flex items-center justify-center active:scale-90 transition-all shadow-[#FF385C]/30"
                    aria-label="Add item"
                >
                    <Plus size={24} />
                </button>
            </div>

            {/* Add item sheet */}
            {showAddItem && (
                <div className="fixed inset-0 z-[70]" onClick={() => setShowAddItem(false)}>
                    <div className="absolute inset-0 bg-black/20" />
                    <div
                        className="absolute bottom-0 left-0 right-0 bg-white rounded-t-3xl p-6 pb-[max(40px,env(safe-area-inset-bottom))] animate-in slide-in-from-bottom duration-200 max-w-lg mx-auto"
                        onClick={e => e.stopPropagation()}
                    >
                        <h3 className="text-lg font-black text-gray-900 mb-1">Need something?</h3>
                        <p className="text-xs text-gray-500 mb-4">Add an ingredient to your shopping list</p>
                        <div className="flex gap-3 mb-3">
                            <input
                                type="text"
                                value={newItem}
                                onChange={e => setNewItem(e.target.value)}
                                onKeyDown={e => { if (e.key === 'Enter') addItem(); }}
                                placeholder="Type ingredient name"
                                className="flex-1 bg-gray-50 rounded-2xl py-4 px-5 text-sm font-bold border border-gray-100 focus:outline-none focus:ring-2 focus:ring-[#FF385C]"
                                autoFocus
                            />
                            <button
                                onClick={() => { addItem(); setShowAddItem(false); }}
                                disabled={!newItem.trim()}
                                className="w-14 h-14 bg-[#FF385C] text-white rounded-2xl flex items-center justify-center shadow-lg shadow-[#FF385C]/20 disabled:opacity-30 active:scale-95 transition-all"
                            >
                                <Plus size={22} />
                            </button>
                        </div>
                        <div className="flex items-center gap-2 mb-2">
                            <p className="text-[11px] font-bold text-gray-400 uppercase tracking-widest shrink-0">Pack size (optional)</p>
                            <input
                                type="number"
                                value={packQty}
                                onChange={e => setPackQty(e.target.value)}
                                placeholder="e.g. 1000"
                                className="w-24 bg-gray-50 rounded-xl py-2 px-3 text-sm font-bold border border-gray-100 focus:outline-none focus:ring-2 focus:ring-[#FF385C]"
                            />
                            <select
                                value={packUnit}
                                onChange={e => setPackUnit(e.target.value)}
                                className="bg-gray-50 rounded-xl py-2 px-3 text-sm font-bold border border-gray-100 focus:outline-none focus:ring-2 focus:ring-[#FF385C]"
                            >
                                <option value="ml">ml</option>
                                <option value="liter">liter</option>
                                <option value="g">g</option>
                                <option value="kg">kg</option>
                                <option value="pc">pc</option>
                            </select>
                        </div>
                        <button
                            onClick={() => setShowAddItem(false)}
                            className="w-full mt-3 py-3 rounded-2xl bg-gray-100 text-gray-600 font-bold text-sm active:scale-[0.98] transition-all"
                        >
                            Cancel
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
};

export default React.memo(PantryPulse);
