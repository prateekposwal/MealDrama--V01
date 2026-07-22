import React, { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import { useStore } from '../../app/store/useStore';
import { useTrayStore } from '../../plan/store/useTrayStore';
import { useLoopStore } from '../../plan/store/useLoopStore';
import type { MealType } from '../../types/tray';
import type { SourcePool } from '../../plan/utils/mealLoopEngine';
import type { Dish, DishVariant, Weight } from '../../meal/constants/dishLibrary';
import type { Category, Region } from '../../meal/constants/dishLibrary';
import { compactPrimaryId } from '../../types/identity';
import MealLoopConfigModal from '../meal/MealLoopConfigModal';
import SwapCustomizeModal from '../meal/SwapCustomizeModal';
import DishImage from './DishImage';
import CreateHouseholdModal from './CreateHouseholdModal';
import JoinHouseholdModal from './JoinHouseholdModal';
import InviteMemberModal from './InviteMemberModal';
import { MapPin, ShieldAlert, Flame, Phone, LogOut, Bell, BellOff, Check, ChevronDown, ChevronRight, ArrowRight, SlidersHorizontal, RefreshCw, Plus, Edit3, Trash2, X, Camera, Users, Copy, LogIn } from 'lucide-react';
import { getISODate } from '../../utils/dateUTC';
import WeeklyHealthSummary from '../health/WeeklyHealthSummary';
import NotificationCenter from '../../components/notification/NotificationCenter';
import { useNotificationStore } from '../../app/notifications';
import ExpenseList from '../household/ExpenseList';
import ActivityFeed from '../household/ActivityFeed';

// ─── Collapsible Section ─────────────────────────────────────────────────────
const CollapsibleSection: React.FC<{
  title: string;
  defaultOpen?: boolean;
  children: React.ReactNode;
  badge?: string;
  summary?: string;
  color?: string;
}> = ({ title, defaultOpen = false, children, badge, summary, color = 'gray' }) => {
  const [open, setOpen] = useState(defaultOpen);
  const colorMap: Record<string, { bg: string; text: string; chevron: string }> = {
    rose: { bg: 'bg-[#FF385C]/5', text: 'text-[#FF385C]', chevron: 'text-[#FF385C]/40' },
    emerald: { bg: 'bg-emerald-50', text: 'text-emerald-600', chevron: 'text-emerald-400' },
    amber: { bg: 'bg-amber-50', text: 'text-amber-600', chevron: 'text-amber-400' },
    violet: { bg: 'bg-violet-50', text: 'text-violet-600', chevron: 'text-violet-400' },
    sky: { bg: 'bg-sky-50', text: 'text-sky-600', chevron: 'text-sky-400' },
    gray: { bg: 'bg-transparent', text: 'text-gray-500', chevron: 'text-gray-300' },
  };
  const c = colorMap[color] || colorMap.gray;
  const styles = c!;
  if (!c) return null;
  return (
    <div className={`${styles.bg} rounded-2xl border border-gray-100/80 overflow-hidden`}>
      <button
        onClick={() => setOpen(!open)}
        className="w-full flex items-start justify-between px-5 py-4 active:opacity-70 transition-opacity"
      >
        <div className="flex flex-col items-start gap-0.5">
          <div className="flex items-center gap-2">
            <span className={`text-xs font-black uppercase tracking-widest ${styles.text}`}>{title}</span>
            {badge && <span className="text-[10px] font-bold text-[#FF385C] bg-[#FF385C]/10 px-2 py-0.5 rounded-full">{badge}</span>}
          </div>
          {!open && summary && <span className="text-[10px] text-gray-500">{summary}</span>}
        </div>
        {open ? <ChevronDown size={14} className={`${styles.chevron} mt-0.5`} /> : <ChevronRight size={14} className={`${styles.chevron} mt-0.5`} />}
      </button>
      {open && <div className="px-5 pb-4">{children}</div>}
    </div>
  );
};
// ─────────────────────────────────────────────────────────────────────────────


const REGION_EMOJI: Record<string, string> = {
    'North India': '🟡',
    'South India': '🟢',
    'West India': '🔵',
    'East India': '🔴',
    'Central India': '🟣',
    'Northeast India': '🟠',
};
const ALLERGIES_LIST = ['Dairy', 'Nuts', 'Gluten', 'Soy', 'Seafood', 'Eggs'];
const SPICE_LABELS: Record<string, string> = { 'mild': 'Mild 🌿', 'medium': 'Medium 🌶️', 'hot': 'Hot 🔥' };

const Profile: React.FC<{ onLogout?: () => void; onManageTray?: (slot?: MealType) => void }> = ({ onLogout, onManageTray }) => {
    const { user, updateProfile, openQuickSetup, household, householdId } = useStore();
    const defaultName = user?.name || (user?.primaryId ? compactPrimaryId(user.primaryId) : '');
    const [nameDraft, setNameDraft] = useState<string>(defaultName);
    const [showSaved, setShowSaved] = useState(false);
    const savedTimerRef = useRef<ReturnType<typeof setTimeout>>();
    useEffect(() => {
        setNameDraft(user?.name || (user?.primaryId ? compactPrimaryId(user.primaryId) : ''));
    }, [user?.name, user?.primaryId]);

    // Track online status for offline visual feedback
    const [isOnline, setIsOnline] = useState(typeof navigator !== 'undefined' ? navigator.onLine : true);
    useEffect(() => {
        const handleOnline = () => setIsOnline(true);
        const handleOffline = () => setIsOnline(false);
        window.addEventListener('online', handleOnline);
        window.addEventListener('offline', handleOffline);
        return () => {
            window.removeEventListener('online', handleOnline);
            window.removeEventListener('offline', handleOffline);
        };
    }, []);

const [editingRegion, setEditingRegion] = useState(false);
const [editingAllergy, setEditingAllergy] = useState(false);
const [editingCook, setEditingCook] = useState(false);
const [editingSpice, setEditingSpice] = useState(false);
const [showCreateHousehold, setShowCreateHousehold] = useState(false);
const [showJoinHousehold, setShowJoinHousehold] = useState(false);
const [showInviteMember, setShowInviteMember] = useState(false);
const [cookInput, setCookInput] = useState(user?.cookContact || '');
  const notifications = useNotificationStore(s => s.enabled);
  const setNotifications = useNotificationStore(s => s.setEnabled);
const [mealLoopModalOpen, setMealLoopModalOpen] = useState(false);
const [trayEditSlot, setTrayEditSlot] = useState<MealType | null>(null);
const [showTrayOverview, setShowTrayOverview] = useState(false);
const [overviewSlot, setOverviewSlot] = useState<MealType>('breakfast');
const { addToTray, removeFromTray } = useStore();

const { customDishes, addCustomDish, updateCustomDish, removeCustomDish, setToast } = useStore();
const [showCustomForm, setShowCustomForm] = useState(false);
const [editingDishId, setEditingDishId] = useState<string | null>(null);
const [customName, setCustomName] = useState('');
const [customStyle, setCustomStyle] = useState('Gravy');
const [customTags, setCustomTags] = useState<string[]>(['healthy']);
const [customDiet, setCustomDiet] = useState<'veg' | 'non-veg' | 'vegan'>('veg');
const [customIngredients, setCustomIngredients] = useState<{ name: string; quantity: number; unit: string }[]>([]);
const [customImageDataUrl, setCustomImageDataUrl] = useState('');
const [ingredientName, setIngredientName] = useState('');
const [ingredientQty, setIngredientQty] = useState('');
const [ingredientUnit, setIngredientUnit] = useState('g');
const [showCustomDetails, setShowCustomDetails] = useState(false);

    const trayLibrary = useStore(s => s.trayLibrary);
    const dishes = useStore(s => s.dishes);
    const plan = useTrayStore(s => s.plan);
    const getMeals = useTrayStore(s => s.getMeals);
    const { applyLoopConfig } = useLoopStore();
    const fileInputRef = useRef<HTMLInputElement>(null);

    const handleAvatarUpload = useCallback(() => {
        fileInputRef.current?.click();
    }, []);

    const handleAvatarChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;
        if (file.size > 2 * 1024 * 1024) {
            setToast({ message: 'Image too large. Max 2MB.', type: 'error' });
            return;
        }
        const reader = new FileReader();
        reader.onload = (ev) => {
            const dataUrl = ev.target?.result as string;
            updateProfile({ avatarUrl: dataUrl });
            setToast({ message: 'Profile picture updated!', type: 'success' });
        };
        reader.readAsDataURL(file);
    }, [updateProfile, setToast]);

    const mealLoop = useLoopStore(s => s.mealLoop);

    // FIX 6: Live status indicator — refreshes on loop_updated events from background sync
    const [refreshKey, setRefreshKey] = useState(0);
    useEffect(() => {
        const handler = () => setRefreshKey(k => k + 1);
        window.addEventListener('loop_updated', handler);
        return () => window.removeEventListener('loop_updated', handler);
    }, []);

    const loopStatus = useMemo(() => {
        if (!mealLoop.config) return null;
        const skipDays = mealLoop.config.skipDays;
        const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
        const skipBadge = skipDays.length > 0
            ? `⏸️ Skips ${skipDays.map(d => dayNames[d]).filter(Boolean).join(' & ')}`
            : null;
        return { label: `Active · ${mealLoop.config.cycleLength}-week cycle`, color: 'text-emerald-600', dot: 'bg-emerald-500', skipBadge };
    }, [mealLoop.config, refreshKey]);

    const trayCounts = useMemo(() => {
        const types: MealType[] = ['breakfast', 'lunch', 'snacks', 'dinner'];
        const counts: Record<MealType, number> = { breakfast: 0, lunch: 0, snacks: 0, dinner: 0 };
        for (const mt of types) {
            counts[mt] = (trayLibrary[mt] || []).length;
        }
        return counts;
    }, [trayLibrary]);

    const plannedSlots = user?.plannedSlots ?? ['Breakfast', 'Lunch', 'Snacks', 'Dinner'];

    const traySummary = [
        { slot: 'Breakfast' as const, count: trayCounts.breakfast },
        { slot: 'Lunch' as const, count: trayCounts.lunch },
        { slot: 'Dinner' as const, count: trayCounts.dinner },
        { slot: 'Snacks' as const, count: trayCounts.snacks },
    ].filter(item => plannedSlots.includes(item.slot));

    const traySourcePool = useMemo((): SourcePool => {
        const pool: SourcePool = { breakfast: [], lunch: [], snacks: [], dinner: [] };
        const seen = { breakfast: new Set(), lunch: new Set(), snacks: new Set(), dinner: new Set() };

        // FIX 2: Use trayLibrary as primary source — plan.days may be empty on first load
        for (const mt of ['breakfast', 'lunch', 'snacks', 'dinner'] as MealType[]) {
            for (const option of trayLibrary[mt]) {
                const dish = dishes.find(d => d.id === option.dishId);
                if (dish && !seen[mt].has(dish.id)) {
                    seen[mt].add(dish.id);
                    pool[mt].push(dish);
                }
            }
        }

        // Also include dishes from existing plan days
        for (const date of Object.keys(plan.days)) {
            for (const mt of ['breakfast', 'lunch', 'snacks', 'dinner'] as MealType[]) {
                const meals = plan.days[date]?.[mt] || [];
                for (const item of meals) {
                    const dish = dishes.find(d => d.id === item.meal_id);
                    if (dish && !seen[mt].has(dish.id)) {
                        seen[mt].add(dish.id);
                        pool[mt].push(dish);
                    }
                }
            }
        }

        return pool;
    }, [trayLibrary, plan.days, dishes]);

    const handleLoopApply = useCallback((config: any) => {
        applyLoopConfig(config, traySourcePool, dishes);
        window.dispatchEvent(new CustomEvent('loop_updated', { detail: { config } }));
        setMealLoopModalOpen(false);
    }, [traySourcePool, applyLoopConfig, dishes]);

    const handleTrayAddDish = useCallback((date: string, mealType: MealType, dish: Dish, variant?: DishVariant) => {
      addToTray(mealType, { id: dish.id, dishId: dish.id, name: dish.name, icon: dish.icon, sourceRegion: dish.region });
      setToast({ message: `${dish.name} added to tray`, type: 'success' });
    }, [addToTray, setToast]);

    const handleRemoveTrayDish = useCallback((slot: MealType, mealId: string) => {
      removeFromTray(slot, mealId);
      setToast({ message: 'Removed from tray', type: 'info' });
    }, [removeFromTray, setToast]);

    const suggestionChips = useMemo(() => {
        const allTrayItems = Object.values(trayLibrary).flat();
        return (dishes || [])
            .filter((d: any) => !allTrayItems.some((t: any) => t.id === d.id))
            .slice(0, 6)
            .map((d: any) => ({ id: d.id, name: d.name }));
    }, [trayLibrary, dishes]);

    const handleAddSuggestion = useCallback((suggestion: { id: string; name: string }) => {
        const slot = 'lunch' as MealType;
        const items = trayLibrary[slot] || [];
        if (items.some((i: any) => i.name === suggestion.name)) return;
        addToTray(slot, { id: suggestion.id, name: suggestion.name, icon: '' });
    }, [trayLibrary, addToTray]);

    const resetCustomForm = () => {
        setShowCustomForm(false);
        setEditingDishId(null);
        setCustomName('');
        setCustomStyle('Gravy');
        setCustomTags(['healthy']);
        setCustomDiet('veg');
        setCustomIngredients([]);
        setCustomImageDataUrl('');
        setIngredientName('');
        setIngredientQty('');
        setIngredientUnit('g');
    };

    const handleCreateCustom = () => {
        if (!customName.trim()) return;
        const ings = customIngredients.map(i => ({ name: i.name, quantity: i.quantity, unit: i.unit, category: 'produce' as const }));
        if (editingDishId) {
            updateCustomDish(editingDishId, {
                name: customName.trim(),
                type: customDiet,
                category: [customStyle.toLowerCase() as Category],
                tags: [...customTags, 'user_created'],
                icon: customImageDataUrl || '🍽️',
                variants: [{
                    id: `v-${editingDishId}`,
                    name: customName.trim(),
                    addOn: '',
                    tags: [...customTags, 'user_created'],
                    healthCategories: customTags,
                    mealContext: undefined,
                    ingredients: ings,
                }],
            });
        } else {
            const id = `custom-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`;
            addCustomDish({
                id,
                name: customName.trim(),
                icon: customImageDataUrl || '🍽️',
                type: customDiet,
                region: (user?.region || 'North') as Region,
                category: [customStyle.toLowerCase() as Category],
                states: [user?.region || 'North'],
                tags: [...customTags, 'user_created'],
                variants: [{
                    id: `v-${id}`,
                    name: customName.trim(),
                    addOn: '',
                    tags: [...customTags, 'user_created'],
                    healthCategories: customTags,
                    mealContext: undefined,
                    ingredients: ings,
                }],
                prepTime: 15,
                description: '',
                weight: 'medium' as Weight,
                nutrition: [],
            });
        }
        window.dispatchEvent(new Event('pantry:invalidate'));
        resetCustomForm();
    };

    const handleEditCustom = (dish: any) => {
        setCustomName(dish.name);
        setCustomStyle(dish.category[0]?.charAt(0).toUpperCase() + dish.category[0]?.slice(1) || 'Gravy');
        setCustomTags(dish.tags.filter((t: string) => t !== 'user_created'));
        setCustomDiet((dish.type === 'eggitarian' ? 'veg' : dish.type) as 'veg' | 'non-veg' | 'vegan');
        setEditingDishId(dish.id);
        setCustomIngredients((dish.variants[0]?.ingredients || []).map((i: any) => ({ name: i.name, quantity: i.quantity, unit: i.unit })));
        setCustomImageDataUrl(dish.icon?.startsWith('data:') ? dish.icon : '');
        setShowCustomForm(true);
    };

    const handleDeleteCustom = (dish: any) => {
        if (!window.confirm(`Delete "${dish.name}"? This removes it from your tray and meal plan.`)) return;
        removeCustomDish(dish.id);
        const store = useStore.getState();
        const trayStore = useTrayStore.getState();
        for (const s of ['breakfast', 'lunch', 'snacks', 'dinner'] as const) {
            if (store.trayLibrary[s].some((m: any) => m.id === dish.id || m.dishId === dish.id)) {
                store.removeFromTray(s, dish.id);
            }
        }
        for (const d of Object.keys(trayStore.plan.days)) {
            for (const mealType of ['breakfast', 'lunch', 'snacks', 'dinner'] as const) {
                const meals = trayStore.plan.days[d]?.[mealType];
                if (meals) {
                    for (const meal of meals) {
                        if (meal.meal_id === dish.id || meal.id === dish.id) {
                            trayStore.removeMealFromSlot(d, mealType, meal.id);
                        }
                    }
                }
            }
        }

        // FIX 2: Clean loop state — remove dish from rotationQueue, assignments, sourceDishIds
        const loopStoreState = useLoopStore.getState();
        loopStoreState.setMealLoop(
            loopStoreState.mealLoop.config,
            loopStoreState.mealLoop.sourceDishIds.filter(id => id !== dish.id),
            loopStoreState.mealLoop.assignments.filter(a => a.dishId !== dish.id)
        );
        const ml = useLoopStore.getState().mealLoop;
        useLoopStore.setState({
            mealLoop: {
                ...ml,
                rotationQueue: ml.rotationQueue.filter(item => item.dishId !== dish.id),
            }
        });

        window.dispatchEvent(new Event('pantry:invalidate'));
    };

    const CUSTOM_STYLES = ['Gravy', 'Dry', 'Fried', 'Roasted', 'Raw', 'Steamed', 'Grilled', 'Curry', 'Soup', 'Bread'];
    const CUSTOM_TAGS = ['healthy', 'high-protein', 'fiber', 'low-calorie', 'indulgent', 'probiotic', 'antioxidant', 'vitamins', 'iron', 'calcium'];

    if (!user) return null;

    const closeAll = () => {
        setEditingRegion(false);
        setEditingAllergy(false);
        setEditingCook(false);
        setEditingSpice(false);
    };

    const toggleAllergy = (allergy: string) => {
        const next = user.allergies?.includes(allergy)
            ? user.allergies.filter((item: string) => item !== allergy)
            : [...(user.allergies || []), allergy];
        updateProfile({ allergies: next });
    };

    return (
        <div className="min-h-screen bg-white pb-32 animate-in fade-in duration-500 ">
            <header className="px-4 pt-8 pb-8 bg-gradient-to-b from-gray-50 to-white">
                <div className="flex items-center gap-6">
                    <div className="relative w-[72px] h-[72px] bg-gradient-to-br from-[#FF385C] to-[#E31C5F] rounded-[24px] flex items-center justify-center shadow-lg shadow-[#FF385C]/15 overflow-hidden cursor-pointer active:scale-95 transition-all shrink-0 group" onClick={handleAvatarUpload}>
                        {user?.avatarUrl ? (
                            <img src={user.avatarUrl} alt="Profile" className="w-full h-full object-cover" />
                        ) : (
                            <img src="/logo.png" alt="Logo" className="w-full h-full object-cover" />
                        )}
                        <div className="absolute top-0.5 right-0.5 w-5 h-5 bg-white rounded-full shadow-sm flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                            <Camera size={10} className="text-gray-600" />
                        </div>
                    </div>
                    <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-3">
                            <input
                                value={nameDraft}
                                onChange={(e) => setNameDraft(e.target.value)}
                                onBlur={() => {
                                    updateProfile({ name: nameDraft });
                                    setShowSaved(true);
                                    if (savedTimerRef.current) clearTimeout(savedTimerRef.current);
                                    savedTimerRef.current = setTimeout(() => setShowSaved(false), 1500);
                                }}
                                className="flex-1 bg-transparent font-bold text-2xl text-gray-900 tracking-tight outline-none border-b-2 border-transparent focus:border-[#FF385C] transition-colors placeholder:text-gray-300 min-w-0"
                                placeholder="Your name"
                            />
                            {showSaved && (
                                <span className="flex items-center gap-1.5 text-emerald-500 animate-in fade-in duration-200 shrink-0">
                                    <Check size={13} />
                                    <span className="text-[10px] font-bold">Saved</span>
                                </span>
                            )}
                        </div>
                        <div className="flex items-center gap-2 mt-1.5">
                            <span className="text-xs font-bold text-gray-800">{user.diet || 'Food Lover'}</span>
                            <span className="text-gray-300">·</span>
                            <span className="text-xs text-gray-500">{user.region}</span>
                            <span className="text-gray-300">·</span>
                            <span className="text-xs text-gray-500">{SPICE_LABELS[user.spiceLevel || 2]}</span>
                        </div>
                    </div>
                    <NotificationCenter />
                </div>
                <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={handleAvatarChange} />
                {/* Visual stat cards removed: replaced by a focused Profile editing experience */}
            </header>
            <div className="px-4 pb-6">
                <div
                    className="p-5 rounded-[22px] bg-white border border-gray-100 shadow-sm hover:shadow-md transition-all cursor-pointer"
                    onClick={() => {
                        const spiceValue = ((): number => {
                            switch (user?.spiceLevel) {
                                case 'mild': return 1;
                                case 'hot': return 3;
                                default: return 2;
                            }
                        })();
                        const prefill: any = {
                            region: user?.region,
                            diet: user?.diet,
                            spiceLevel: spiceValue,
                            plannedSlots: user?.plannedSlots ?? [],
                            cookContact: user?.cookContact ?? '',
                        };
                        openQuickSetup?.(prefill);
                    }}
                >
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-[#FF385C]/10 rounded-2xl flex items-center justify-center">
                            <SlidersHorizontal size={16} className="text-[#FF385C]" />
                        </div>
                        <div className="flex-1">
                            <p className="text-sm font-bold text-gray-900">Preferences</p>
                            <p className="text-xs text-gray-500">Region, diet, slots.</p>
                        </div>
                        <ChevronRight size={16} className="text-gray-500" />
                    </div>
                </div>
            </div>

            {/* FIX 10: Loading state during loop rebuild */}
                        {mealLoop.refreshing && (
                            <div className="w-full p-5 rounded-[22px] bg-gray-50 border border-gray-200 animate-pulse">
                                <div className="flex items-center gap-3">
                                    <div className="w-8 h-8 rounded-lg bg-gray-200 flex items-center justify-center">
                                        <div className="w-4 h-4 border-2 border-gray-400 border-t-transparent rounded-full animate-spin" />
                                    </div>
                                    <div>
                                        <p className="text-xs font-bold text-gray-600">Rebuilding loop assignments…</p>
                                        <p className="text-[10px] text-gray-500">This may take a moment for large plans</p>
                                    </div>
                                </div>
                            </div>
                        )}

            <main className="px-4 space-y-5">
                <CollapsibleSection title="Health Insights" summary="Last 7 days balance" color="emerald">
                    <WeeklyHealthSummary />
                </CollapsibleSection>

                <CollapsibleSection title="Meal Management" defaultOpen={true} color="rose">
                    <div className="space-y-4">
                        {trayEditSlot ? (
                            <div className="space-y-3">
                                <div className="flex items-center justify-between">
                                    <p className="text-xs font-black uppercase tracking-widest text-[#FF385C]">{trayEditSlot.charAt(0).toUpperCase() + trayEditSlot.slice(1)}</p>
                                    <button
                                        onClick={() => setTrayEditSlot(null)}
                                        className="px-4 py-2 rounded-2xl bg-[#FF385C] text-white text-xs font-black uppercase tracking-widest"
                                    >
                                        Done
                                    </button>
                                </div>
                                <div className="flex flex-wrap gap-1.5">
                                    {(trayLibrary[trayEditSlot] || []).map(item => (
                                        <span key={item.id} className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-full text-[11px] font-medium bg-gray-50 border border-gray-200 text-gray-700">
                                            {item.icon && <span className="text-[11px]">{item.icon}</span>}
                                            <span className="max-w-[120px] truncate">{item.name}</span>
                                            <button
                                                onClick={() => handleRemoveTrayDish(trayEditSlot, item.id)}
                                                className="w-6 h-6 rounded-full flex items-center justify-center bg-red-50 text-red-400 hover:bg-red-100 ml-0.5"
                                            >
                                                <X size={11} />
                                            </button>
                                        </span>
                                    ))}
                                </div>
                                <button
                                    onClick={() => setTrayEditSlot(trayEditSlot)}
                                    className="flex items-center gap-1.5 text-xs font-bold text-[#FF385C] active:scale-[0.98]"
                                >
                                    <Plus size={13} />
                                    Add dish
                                </button>
                            </div>
                        ) : showTrayOverview ? (
                            <div className="space-y-4">
                                <div className="flex items-center justify-between">
                                    <p className="text-xs font-black uppercase tracking-widest text-[#FF385C]">Manage Tray</p>
                                    <button
                                        onClick={() => setShowTrayOverview(false)}
                                        className="px-4 py-2 rounded-2xl bg-[#FF385C] text-white text-xs font-black uppercase tracking-widest"
                                    >
                                        Done
                                    </button>
                                </div>
                                <div className="flex gap-2">
                                    {['breakfast', 'lunch', 'snacks', 'dinner'].filter(mt => plannedSlots.includes(mt.charAt(0).toUpperCase() + mt.slice(1))).map(mt => {
                                        const active = overviewSlot === mt;
                                        const count = (trayLibrary[mt as MealType] || []).length;
                                        return (
                                            <button
                                                key={mt}
                                                onClick={() => setOverviewSlot(mt as MealType)}
                                                className={`px-3 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest border transition-all ${
                                                    active ? 'bg-[#FF385C] text-white border-[#FF385C]' : 'bg-white text-gray-500 border-gray-200'
                                                }`}
                                            >
                                                {mt} {count > 0 && `(${count})`}
                                            </button>
                                        );
                                    })}
                                </div>
                                <div>
                                    <p className="text-[10px] font-black uppercase tracking-widest text-gray-500 mb-2">{overviewSlot.charAt(0).toUpperCase() + overviewSlot.slice(1)}</p>
                                    <div className="flex flex-wrap gap-1.5">
                                        {(trayLibrary[overviewSlot] || []).map(item => (
                                            <span key={item.id} className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-full text-[11px] font-medium bg-gray-50 border border-gray-200 text-gray-700">
                                                {item.icon && <span className="text-[11px]">{item.icon}</span>}
                                                <span className="max-w-[120px] truncate">{item.name}</span>
                                                <button
                                                onClick={() => handleRemoveTrayDish(overviewSlot, item.id)}
                                                className="w-6 h-6 rounded-full flex items-center justify-center bg-red-50 text-red-400 hover:bg-red-100 ml-0.5"
                                            >
                                                <X size={11} />
                                                </button>
                                            </span>
                                        ))}
                                        <button
                                            onClick={() => { setShowTrayOverview(false); setTrayEditSlot(overviewSlot); }}
                                            className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-full text-[11px] font-medium border border-dashed border-gray-300 text-gray-500 hover:text-gray-600"
                                        >
                                            <Plus size={11} />
                                            Add
                                        </button>
                                    </div>
                                </div>
                            </div>
                        ) : (
                            <>
                                <div className="flex items-start justify-between gap-4">
                                    <div>
                                        <p className="text-xs font-black uppercase tracking-widest text-[#FF385C]">Your Tray</p>
                                        <p className="text-base font-bold text-gray-900 mt-1">Saved defaults — Plan pulls from here.</p>
                                        <p className="text-[10px] text-gray-500 mt-0.5">Tray = Favorites &bull; Plan = Scheduled meals you build</p>
                                    </div>
                                    <button
                                        onClick={() => setShowTrayOverview(true)}
                                        className="shrink-0 px-4 py-2 rounded-2xl bg-white border border-gray-100 text-[10px] font-black uppercase tracking-widest text-[#FF385C]"
                                    >
                                        Manage
                                    </button>
                                </div>

                                {/* Tray Strength Meter */}
                                {(() => {
                                    const total = trayCounts.breakfast + trayCounts.lunch + trayCounts.dinner + trayCounts.snacks;
                                    const target = 20;
                                    const pct = Math.min(100, Math.round(total / target * 100));
                                    const totalEmoji = total === 0 ? '😴' : total < 8 ? '🫤' : total < 14 ? '😊' : '🎉';
                                    return (
                                        <div className="px-4 py-3 rounded-2xl bg-gradient-to-r from-[#FF385C]/5 to-orange-50 border border-[#FF385C]/10">
                                            <div className="flex items-center justify-between mb-2">
                                                <span className="text-[10px] font-bold text-gray-600">
                                                    {totalEmoji} Tray Strength
                                                </span>
                                                <span className="text-[10px] font-black text-[#FF385C]">{pct}%</span>
                                            </div>
                                            <div className="h-2 bg-gray-200/60 rounded-full overflow-hidden">
                                                <div className="h-full bg-gradient-to-r from-[#FF385C] to-orange-400 rounded-full transition-all duration-500" style={{ width: `${pct}%` }} />
                                            </div>
                                            <p className="text-[10px] text-gray-500 mt-1.5">
                                                {total === 0 ? 'Start adding dishes to build your rotation!' :
                                                 total < 8 ? 'Add more dishes for better meal variety.' :
                                                 total < 14 ? 'Good variety! Your cook will love it.' :
                                                 'Fully stocked! Your meals will never repeat.'}
                                            </p>
                                        </div>
                                    );
                                })()}

                                {/* Per-slot tray counts */}
                                <div className="grid grid-cols-2 gap-2">
                                    {(['breakfast', 'lunch', 'snacks', 'dinner'] as const).map(mt => {
                                        if (!plannedSlots.includes(mt.charAt(0).toUpperCase() + mt.slice(1))) return null;
                                        const count = (trayLibrary[mt] || []).length;
                                        const targetPerSlot = 5;
                                        const pct = Math.min(100, Math.round(count / targetPerSlot * 100));
                                        return (
                                            <div key={mt} className="p-3 rounded-xl bg-gray-50/80 border border-gray-100">
                                                <div className="flex items-center justify-between mb-1">
                                                    <span className="text-[10px] font-black uppercase tracking-widest text-gray-500">{mt}</span>
                                                    <span className="text-[10px] font-bold text-gray-500">{count}/{targetPerSlot}</span>
                                                </div>
                                                <div className="h-1.5 bg-gray-200 rounded-full overflow-hidden">
                                                    <div className="h-full bg-gradient-to-r from-[#FF385C] to-orange-400 rounded-full transition-all" style={{ width: `${pct}%` }} />
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>

                                {/* Quick-add chips */}
                                <div className="flex items-center gap-2">
                                    <p className="text-[10px] font-black uppercase tracking-widest text-gray-500 shrink-0">Add</p>
                                    <div className="h-6 w-px bg-gray-200" />
                                    <div className="flex gap-1.5 overflow-x-auto pb-1">
                                        {suggestionChips.map(s => (
                                            <button
                                                key={s.id}
                                                onClick={() => handleAddSuggestion(s)}
                                                className="shrink-0 px-2.5 py-1 rounded-full bg-white border border-gray-200 text-[10px] font-medium text-gray-600 active:scale-95 transition-all hover:border-[#FF385C]/30"
                                            >
                                                + {s.name}
                                            </button>
                                        ))}
                                    </div>
                                </div>
                            </>
                        )}
                    </div>
                </CollapsibleSection>

                <CollapsibleSection title="Custom Dishes" defaultOpen={true} badge={customDishes.length > 0 ? `${customDishes.length}` : undefined} color="amber">
                    <div className="space-y-3">
                        {showCustomForm ? (
                            <div className="p-4 rounded-2xl bg-white border border-purple-200/50">
                                <div className="flex items-center justify-between mb-4">
                                    <div className="flex items-center gap-2">
                                        <span className="text-lg">🍳</span>
                                        <p className="text-xs font-black uppercase tracking-widest text-purple-600">{editingDishId ? 'Edit' : 'Create'} Custom Dish</p>
                                    </div>
                                    <button onClick={resetCustomForm} className="w-7 h-7 rounded-full flex items-center justify-center bg-gray-100 text-gray-500 hover:bg-gray-200"><X size={13} /></button>
                                </div>

                                {/* Step 1: Basic info — always visible */}
                                <div className="space-y-3">
                                    <div>
                                        <label className="text-[10px] font-bold text-gray-500 block mb-1">Dish Name *</label>
                                        <input type="text" value={customName} onChange={e => setCustomName(e.target.value)} className="w-full rounded-xl py-2.5 px-3 text-sm font-medium border border-gray-200 bg-gray-50 text-gray-900 focus:bg-white focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500 outline-none transition-all" placeholder="e.g., Mom's Special Dal" />
                                    </div>
                                    <div className="flex gap-3">
                                        <div className="flex-1">
                                            <label className="text-[10px] font-bold text-gray-500 block mb-1">Diet</label>
                                            <div className="flex gap-1.5">
                                                {(['veg', 'non-veg', 'vegan'] as const).map(d => (
                                                    <button key={d} onClick={() => setCustomDiet(d)}
                                                        className={`flex-1 py-2 rounded-xl text-[10px] font-bold border transition-all active:scale-95 ${
                                                            customDiet === d
                                                                ? 'bg-gray-900 text-white border-gray-900 shadow-sm'
                                                                : 'bg-white text-gray-500 border-gray-200 hover:border-gray-300'
                                                        }`}
                                                    >
                                                        {d === 'veg' ? '🥬 Veg' : d === 'non-veg' ? '🍗 Non-Veg' : '🌱 Vegan'}
                                                    </button>
                                                ))}
                                            </div>
                                        </div>
                                        <div className="flex-1">
                                            <label className="text-[10px] font-bold text-gray-500 block mb-1">Style</label>
                                            <div className="flex gap-1.5">
                                                {CUSTOM_STYLES.slice(0, 3).map(s => (
                                                    <button key={s} onClick={() => setCustomStyle(s)}
                                                        className={`flex-1 py-2 rounded-xl text-[10px] font-bold border transition-all active:scale-95 ${
                                                            customStyle === s
                                                                ? 'bg-gray-900 text-white border-gray-900 shadow-sm'
                                                                : 'bg-white text-gray-500 border-gray-200 hover:border-gray-300'
                                                        }`}
                                                    >{s}</button>
                                                ))}
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                 {/* Step 2: Tags + Picture + Ingredients — collapsible */}
                                <button
                                    onClick={() => setShowCustomDetails(!showCustomDetails)}
                                    className="w-full mt-3 flex items-center justify-center gap-1.5 py-2 rounded-xl border border-dashed border-gray-200 text-[10px] font-bold text-gray-500 hover:text-purple-600 hover:border-purple-200 transition-all"
                                >
                                    {showCustomDetails ? '− Hide details' : '+ Add tags, picture & ingredients'}
                                </button>
                                {showCustomDetails && <div className="space-y-3 mt-3 pt-3 border-t border-gray-100">
                                                <div>
                                                    <label className="text-[10px] font-bold text-gray-500 block mb-1">Tags</label>
                                                    <div className="flex flex-wrap gap-1.5">
                                                        {CUSTOM_TAGS.map(t => (
                                                            <button key={t} onClick={() => setCustomTags(prev => prev.includes(t) ? prev.filter(x => x !== t) : [...prev, t])}
                                                                className={`px-2.5 py-1.5 rounded-lg text-[10px] font-bold border transition-all active:scale-95 ${
                                                                    customTags.includes(t)
                                                                        ? 'bg-emerald-500 text-white border-emerald-500 shadow-sm'
                                                                        : 'bg-white text-gray-500 border-gray-200 hover:border-emerald-300'
                                                                }`}
                                                            >{t}</button>
                                                        ))}
                                                    </div>
                                                </div>
                                                <div>
                                                    <label className="text-[10px] font-bold text-gray-500 block mb-1">Picture</label>
                                                    <div className="flex items-center gap-3">
                                                        {customImageDataUrl ? (
                                                            <div className="relative">
                                                                <img src={customImageDataUrl} alt="" className="w-16 h-16 rounded-xl object-cover border border-gray-200" />
                                                                <button onClick={() => setCustomImageDataUrl('')} className="absolute -top-1.5 -right-1.5 w-5 h-5 bg-red-500 text-white rounded-full flex items-center justify-center shadow"><X size={10} /></button>
                                                            </div>
                                                        ) : (
                                                            <div className="w-16 h-16 rounded-xl bg-gray-100 flex items-center justify-center text-2xl border border-gray-200">📸</div>
                                                        )}
                                                        <label className="px-4 py-2 rounded-xl border border-gray-200 bg-white text-xs font-bold text-gray-600 cursor-pointer active:scale-95 transition-all hover:border-gray-300">
                                                            <input type="file" accept="image/*" className="hidden" onChange={e => { const f = e.target.files?.[0]; if (f) { const r = new FileReader(); r.onload = () => setCustomImageDataUrl(r.result as string); r.readAsDataURL(f); } }} />
                                                            Upload Photo
                                                        </label>
                                                    </div>
                                                </div>
                                                <div>
                                                    <label className="text-[10px] font-bold text-gray-500 block mb-1">Ingredients <span className="text-gray-300 font-normal">(optional — helps with pantry planning)</span></label>
                                                    <div className="grid grid-cols-[1fr_3.5rem_3.5rem_auto] gap-1.5 mb-2">
                                                        <input type="text" value={ingredientName} onChange={e => setIngredientName(e.target.value)} className="rounded-lg py-1.5 px-2.5 text-xs font-medium border border-gray-200 bg-gray-50 text-gray-900 min-w-0" placeholder="Ingredient" />
                                                        <input type="text" value={ingredientQty} onChange={e => setIngredientQty(e.target.value)} className="rounded-lg py-1.5 px-2 text-xs font-medium border border-gray-200 bg-gray-50 text-gray-900 text-center" placeholder="Qty" />
                                                        <select value={ingredientUnit} onChange={e => setIngredientUnit(e.target.value)} className="rounded-lg py-1.5 px-1 text-xs font-medium border border-gray-200 bg-gray-50 text-gray-600">
                                                            <option value="g">g</option>
                                                            <option value="kg">kg</option>
                                                            <option value="ml">ml</option>
                                                            <option value="pc">pc</option>
                                                            <option value="tbsp">tbsp</option>
                                                            <option value="tsp">tsp</option>
                                                            <option value="cup">cup</option>
                                                        </select>
                                                        <button onClick={() => { if (!ingredientName.trim() || !ingredientQty.trim()) return; setCustomIngredients(prev => [...prev, { name: ingredientName.trim(), quantity: parseFloat(ingredientQty) || 0, unit: ingredientUnit }]); setIngredientName(''); setIngredientQty(''); setIngredientUnit('g'); }}
                                                            className="px-2.5 py-1.5 rounded-lg bg-gray-900 text-white text-xs font-bold active:scale-90"
                                                        ><Plus size={14} /></button>
                                                    </div>
                                                    {customIngredients.length > 0 && (
                                                        <div className="flex flex-wrap gap-1.5">
                                                            {customIngredients.map((ing, idx) => (
                                                                <div key={idx} className="flex items-center gap-1 px-2 py-1 rounded-lg bg-white text-[10px] font-medium text-gray-700 border border-gray-100 shadow-sm">
                                                                    <span>{ing.name}</span>
                                                                    <span className="text-gray-500">{ing.quantity}{ing.unit}</span>
                                                                    <button onClick={() => setCustomIngredients(prev => prev.filter((_, i) => i !== idx))} className="text-gray-500 hover:text-red-500"><X size={10} /></button>
                                                                </div>
                                                            ))}
                                                        </div>
                                        )}
                                </div>
                            </div>}

                                <button onClick={handleCreateCustom} disabled={!customName.trim()}
                                    className="w-full mt-4 py-3 rounded-xl bg-gradient-to-r from-purple-600 to-purple-700 text-white font-bold text-sm flex items-center justify-center gap-2 active:scale-[0.98] transition-all disabled:opacity-40 shadow-lg shadow-purple-600/20"
                                >
                                    {editingDishId ? <><Check size={14} /> Save Changes</> : <>✨ Create Dish</>}
                                </button>
                            </div>
                        ) : (
                            <div>
                                {/* Fun empty state */}
                                {customDishes.length === 0 ? (
                                    <div className="text-center py-8 px-4">
                                        <div className="w-16 h-16 bg-gradient-to-br from-purple-100 to-orange-100 rounded-2xl flex items-center justify-center text-3xl mx-auto mb-4 shadow-sm">🍳</div>
                                        <p className="text-sm font-bold text-gray-900 mb-1">No custom dishes yet</p>
                                        <p className="text-[11px] text-gray-500 mb-5 max-w-xs mx-auto">Have a family recipe? Add it here — it'll show up in your meal plan just like any other dish!</p>
                                        <div className="flex flex-col items-center gap-2">
                                            <button onClick={() => { resetCustomForm(); setShowCustomForm(true); }}
                                                className="px-4 py-3 rounded-2xl bg-gradient-to-r from-purple-600 to-purple-700 text-white text-sm font-bold flex items-center gap-2 active:scale-95 transition-all shadow-lg shadow-purple-600/20"
                                            >
                                                <Plus size={16} /> Add Your Recipe
                                            </button>
                                            <p className="text-[10px] text-gray-300 mt-1">Your dish will be saved for future meal plans</p>
                                        </div>
                                    </div>
                                ) : (
                                    <div className="space-y-2">
                                        <div className="flex items-center justify-between mb-1">
                                            <p className="text-[10px] font-bold text-gray-500">
                                                🏠 {customDishes.length} family recipe{customDishes.length > 1 ? 's' : ''}
                                            </p>
                                            <button onClick={() => { resetCustomForm(); setShowCustomForm(true); }}
                                                className="px-3 py-1.5 rounded-xl bg-purple-600 text-white text-[10px] font-black uppercase tracking-widest flex items-center gap-1 active:scale-95 transition-all shadow-sm"
                                            >
                                                <Plus size={11} /> New
                                            </button>
                                        </div>
                                        {customDishes.map(dish => (
                                            <div key={dish.id} className="flex items-center gap-3 p-3 rounded-xl bg-white border border-gray-100 shadow-sm active:scale-[0.99] transition-all">
                                                {dish.icon?.startsWith('data:') ? (
                                                    <img src={dish.icon} alt="" className="w-10 h-10 rounded-lg object-cover" />
                                                ) : (
                                                    <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-purple-100 to-orange-100 flex items-center justify-center text-lg">🍽️</div>
                                                )}
                                                <div className="flex-1 min-w-0">
                                                    <p className="text-sm font-bold text-gray-900 truncate">{dish.name}</p>
                                                    <p className="text-[10px] text-gray-500">
                                                        {dish.type === 'veg' ? '🥬' : '🍗'} {dish.type} · {dish.category[0]} · {dish.variants[0]?.ingredients?.length || 0} ingredients
                                                    </p>
                                                </div>
                                                <div className="flex items-center gap-0.5">
                                                    <button onClick={() => handleEditCustom(dish)} className="w-8 h-8 rounded-lg flex items-center justify-center text-gray-500 hover:text-purple-600 hover:bg-purple-50 active:scale-90 transition-all" title="Edit"><Edit3 size={14} /></button>
                                                    <button onClick={() => handleDeleteCustom(dish)} className="w-8 h-8 rounded-lg flex items-center justify-center text-gray-500 hover:text-red-600 hover:bg-red-50 active:scale-90 transition-all" title="Delete"><Trash2 size={14} /></button>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                        )}
                    </div>
                </CollapsibleSection>

                {householdId && (
                <CollapsibleSection title="Household" color="violet">
                    <div className="p-5 rounded-[22px] bg-orange-50/50 border border-orange-200/50">
                        {household ? (
                            <div className="space-y-3">
                                <div className="flex items-center gap-3">
                                    <div className="w-10 h-10 rounded-2xl bg-orange-100 flex items-center justify-center">
                                        <Users size={16} className="text-orange-600" />
                                    </div>
                                    <div>
                                        <p className="text-sm font-bold text-gray-900">{household.name}</p>
                                        <p className="text-[10px] text-gray-500">{household.members.length} member{household.members.length !== 1 ? 's' : ''}</p>
                                    </div>
                                </div>
                                <div className="flex flex-wrap gap-1.5">
                                    {household.members.map(m => (
                                        <span key={m.id} className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-medium border ${
                                            m.id === user?.id
                                                ? 'bg-orange-100 border-orange-200 text-orange-700'
                                                : m.role === 'admin'
                                                ? 'bg-yellow-50 border-yellow-200 text-yellow-700'
                                                : 'bg-white border-gray-200 text-gray-600'
                                        }`}>
                                            {m.name}
                                            {m.id === user?.id && ' (You)'}
                                            {m.role === 'admin' && m.id !== user?.id && ' 🏅'}
                                    </span>
                                        ))}
                                    </div>
                                    <ExpenseList
                                        householdId={household.id}
                                        isRoommateHousehold={true}
                                        currentMemberRole={household.members.find(m => m.id === user?.id)?.role || 'member'}
                                    />
                                    <ActivityFeed householdId={household.id} />
                                    <div className="flex gap-2 pt-1">
                                    <button onClick={() => setShowInviteMember(true)} className="flex-1 py-2 rounded-xl bg-orange-500 text-white text-[10px] font-black uppercase tracking-widest flex items-center justify-center gap-1">
                                        <Copy size={12} /> Invite
                                    </button>
                                    <button onClick={() => {
                                        if (window.confirm('Leave household? Your requested items will remain.')) {
                                            useStore.getState().leaveHousehold();
                                        }
                                    }} className="flex-1 py-2 rounded-xl border border-red-200 text-red-500 text-[10px] font-black uppercase tracking-widest">
                                        Leave
                                    </button>
                                </div>
                            </div>
                        ) : (
                            <div className="space-y-3">
                                <p className="text-xs text-gray-500">Share a meal plan with your household. Everyone can add their requests.</p>
                                <div className="flex gap-2">
                                    <button onClick={() => setShowCreateHousehold(true)} className="flex-1 py-2.5 rounded-xl bg-orange-500 text-white text-[10px] font-black uppercase tracking-widest flex items-center justify-center gap-1">
                                        <Users size={14} /> Create
                                    </button>
                                    <button onClick={() => setShowJoinHousehold(true)} className="flex-1 py-2.5 rounded-xl border border-orange-200 text-orange-600 text-[10px] font-black uppercase tracking-widest flex items-center justify-center gap-1">
                                        <LogIn size={14} /> Join
                                    </button>
                                </div>
                            </div>
                        )}
                    </div>
                </CollapsibleSection>
                )}

                <section className="bg-sky-50/40 rounded-2xl border border-gray-100/80 overflow-hidden pb-4">
                    <div className="px-5 py-4">
                        <h4 className="text-xs font-black uppercase tracking-widest text-sky-600">Account & Settings</h4>
                    </div>
                    <div className="mx-4 rounded-[22px] border border-gray-100 bg-white divide-y divide-gray-100 overflow-hidden">
                        <div className="p-5 flex items-center justify-between">
                            <div className="flex items-center gap-4">
                                <div className="w-11 h-11 bg-white rounded-2xl flex items-center justify-center shadow-sm">
                                    <RefreshCw size={18} className="text-emerald-500" />
                                </div>
                                <div>
                                    <p className="text-xs font-black text-gray-900">Meal Loop</p>
                                    {loopStatus ? (
                                        <div className="flex flex-col gap-0.5 mt-0.5">
                                            <div className="flex items-center gap-1.5">
                                                <span className={`w-1.5 h-1.5 rounded-full ${loopStatus.dot}`} />
                                                <p className={`text-[10px] ${loopStatus.color}`}>{loopStatus.label}</p>
                                            </div>
                                            {loopStatus.skipBadge && (
                                                <p className="text-[10px] text-amber-600 ml-3">{loopStatus.skipBadge}</p>
                                            )}
                                        </div>
                                    ) : (
                                        <p className="text-[11px] text-gray-500">Auto-rotate dishes across your plan</p>
                                    )}
                                </div>
                            </div>
                            <div className="flex items-center gap-2">
                                <button
                                    onClick={() => setMealLoopModalOpen(true)}
                                    className="px-4 py-2 rounded-2xl bg-white border border-gray-100 text-[10px] font-black uppercase tracking-widest text-emerald-500"
                                >
                                    Manage
                                </button>
                                {mealLoop.config && (
                                    <button
                                        onClick={() => {
                                            useLoopStore.getState().refreshLoop(dishes);
                                        }}
                                        disabled={mealLoop.refreshing}
                                        className="px-4 py-2 rounded-2xl bg-emerald-50 border border-emerald-200 text-[10px] font-black uppercase tracking-widest text-emerald-600 disabled:opacity-40 active:scale-95 transition-all"
                                    >
                                        {mealLoop.refreshing ? '...' : 'Refresh'}
                                    </button>
                                )}
                            </div>
                        </div>

                        {/* FIX 9: Loop analytics — shows user progress */}
                        {mealLoop.config && mealLoop.analytics.mealsAutoFilled > 0 && (
                            <div className="p-5 bg-blue-50/50">
                                <div className="flex items-center gap-3 mb-3">
                                    <div className="w-8 h-8 rounded-lg bg-blue-100 flex items-center justify-center">
                                        <span className="text-sm">📊</span>
                                    </div>
                                    <div>
                                        <p className="text-xs font-black text-blue-800">Loop Progress</p>
                                        <p className="text-[10px] text-blue-600">Your meal automation stats</p>
                                    </div>
                                </div>
                                <div className="grid grid-cols-3 gap-3">
                                    <div className="text-center">
                                        <p className="text-lg font-black text-blue-700">{mealLoop.analytics.cyclesCompleted}</p>
                                        <p className="text-[10px] font-bold text-blue-500 uppercase">Cycles</p>
                                    </div>
                                    <div className="text-center">
                                        <p className="text-lg font-black text-blue-700">{mealLoop.analytics.mealsAutoFilled}</p>
                                        <p className="text-[10px] font-bold text-blue-500 uppercase">Meals Filled</p>
                                    </div>
                                    <div className="text-center">
                                        <p className="text-lg font-black text-blue-700">{mealLoop.analytics.dishesSkipped}</p>
                                        <p className="text-[10px] font-bold text-blue-500 uppercase">Skipped</p>
                                    </div>
                                </div>
                            </div>
                        )}

                        <div className="p-5 flex items-center justify-between">
                            <div className="flex items-center gap-4">
                                <div className="w-11 h-11 bg-white rounded-2xl flex items-center justify-center shadow-sm">
                                    {notifications ? <Bell size={18} className="text-violet-500" /> : <BellOff size={18} className="text-gray-500" />}
                                </div>
                                <div>
                                    <p className="text-xs font-black text-gray-900">Notifications</p>
                                    <p className="text-[11px] text-gray-500">{notifications ? 'Daily meal reminders' : 'Off'}</p>
                                </div>
                            </div>
                            <button onClick={() => setNotifications(!notifications)}
                                className={`w-12 h-6 rounded-full transition-all duration-300 relative ${notifications ? 'bg-violet-500' : 'bg-gray-200'}`}>
                                <div className={`w-5 h-5 bg-white rounded-full shadow absolute top-0.5 transition-all duration-300 ${notifications ? 'left-6' : 'left-0.5'}`} />
                            </button>
                        </div>

                        <div className="p-4">
                            <button onClick={onLogout}
                                className="w-full py-3 rounded-2xl bg-red-50 text-red-500 flex items-center justify-center gap-3 font-bold active:scale-95 transition-all">
                                <LogOut size={18} />Logout
                            </button>
                        </div>
                    </div>
                </section>

            </main>

            <MealLoopConfigModal
                isOpen={mealLoopModalOpen}
                onClose={() => setMealLoopModalOpen(false)}
                sourcePool={traySourcePool}
                plannedSlots={user?.plannedSlots}
                onApply={handleLoopApply}
                onFixSlots={(targetSlot) => {
                    setMealLoopModalOpen(false);
                    onManageTray?.(targetSlot);
                }}
            />

            {trayEditSlot && (
                <SwapCustomizeModal
                    key={`add_${trayEditSlot}`}
                    isOpen={true}
                    onClose={() => setTrayEditSlot(null)}
                    date={getISODate()}
                    mealType={trayEditSlot}
                    slotLabel={trayEditSlot.charAt(0).toUpperCase() + trayEditSlot.slice(1)}
                    item={{ id: '', meal_id: '', name: '', icon: '', quantity: 1, servings: 1, smartVersion: 1, gravy: null, roti: null, rice: null, sides: [], beverages: [], dessert: [], itemQtys: {}, start_time: '', end_time: '' }}
                    dishes={dishes}
                    userRegion={user?.region || ''}
                    userDiet={user?.diet || 'veg'}
                    onApply={() => {}}
                    onAddAnother={handleTrayAddDish}
                    initialAddMode={true}
                />
            )}

            <CreateHouseholdModal isOpen={showCreateHousehold} onClose={() => setShowCreateHousehold(false)} />
            <JoinHouseholdModal isOpen={showJoinHousehold} onClose={() => setShowJoinHousehold(false)} />
            <InviteMemberModal isOpen={showInviteMember} onClose={() => setShowInviteMember(false)} />
        </div>
    );
};

export default React.memo(Profile);
