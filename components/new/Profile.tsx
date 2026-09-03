import React, { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import { useStore } from '../../app/store/useStore';
import { useTrayStore } from '../../plan/store/useTrayStore';
import { useLoopStore } from '../../plan/store/useLoopStore';
import type { MealType, MealLoopConfig } from '../../types/tray';
import type { SourcePool } from '../../plan/utils/mealLoopEngine';
import type { Dish, DishVariant, Weight } from '../../meal/constants/dishLibrary';
import type { Category, Region } from '../../meal/constants/dishLibrary';
import { compactPrimaryId } from '../../types/identity';
import { getRegionKey } from '../../utils/dishSearch';
import { pickDietRepresentatives, distinctiveTypeFor, enrichSourcePool } from '../../utils/dietQuota';
import { isPureSweetDish } from '../../meal/constants/pairingCatalog';
import { daysUntil } from '../../utils/dateUTC';
import MealLoopConfigModal from '../meal/MealLoopConfigModal';
import SwapCustomizeModal from '../meal/SwapCustomizeModal';
import DishSearchModal from '../meal/DishSearchModal';
import DishImage from './DishImage';
import { ConfirmDialog } from './ConfirmDialog';
import CreateHouseholdModal from './CreateHouseholdModal';
import JoinHouseholdModal from './JoinHouseholdModal';
import InviteMemberModal from './InviteMemberModal';
import { MapPin, ShieldAlert, Flame, Phone, LogOut, Bell, BellOff, Check, ChevronDown, ChevronRight, ArrowRight, SlidersHorizontal, RefreshCw, Plus, Edit3, Trash2, X, Camera, Users, Copy, LogIn } from 'lucide-react';
import WeeklyHealthSummary from '../health/WeeklyHealthSummary';
import NotificationCenter from '../../components/notification/NotificationCenter';
import { useNotificationStore } from '../../app/notifications';
import { healTrayDietGaps } from '../../utils/dietHeal';
import { diffProfileFields } from '../../utils/profileDiff';
import ExpenseList from '../household/ExpenseList';
import ActivityFeed from '../household/ActivityFeed';
import { FamilyPlans } from '../household/FamilyPlans';
import ProfileAIInsights from './ProfileAIInsights';

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
          className="w-full flex items-start justify-between px-5 py-5 active:opacity-70 transition-opacity"
        >
          <div className="flex flex-col items-start gap-1">
            <div className="flex items-center gap-2">
              <span className={`text-sm font-black uppercase tracking-widest ${styles.text}`}>{title}</span>
            {badge && <span className="text-xs font-bold text-[#FF385C] bg-[#FF385C]/10 px-2 py-0.5 rounded-full">{badge}</span>}
          </div>
          {!open && summary && <span className="text-xs text-gray-500">{summary}</span>}
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

    // "What changed" — any diet/region/slots edit gets a plain-language toast.
    const _prevProfile = useRef<any>({ diet: user?.diet, region: user?.region, plannedSlots: user?.plannedSlots });
    useEffect(() => {
        const next = { diet: user?.diet, region: user?.region, plannedSlots: user?.plannedSlots };
        const changes = diffProfileFields(_prevProfile.current, next);
        if (changes.length) useStore.getState().setToast({ message: `Updated: ${changes.join(' · ')}`, type: 'success' });
        _prevProfile.current = next;
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [user?.diet, user?.region, user?.plannedSlots]);

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
const [showTrayOverview, setShowTrayOverview] = useState(false);
const [overviewSlot, setOverviewSlot] = useState<MealType>('breakfast');
const [addSlot, setAddSlot] = useState<MealType | null>(null);
const [confirmDeleteDish, setConfirmDeleteDish] = useState<any>(null);
const [confirmLeaveHousehold, setConfirmLeaveHousehold] = useState(false);
const { addToTray, removeFromTray } = useStore();

const { customDishes, addCustomDish, updateCustomDish, removeCustomDish, setToast } = useStore();
const [showCustomForm, setShowCustomForm] = useState(false);
const [customStep, setCustomStep] = useState(1);
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
        const prevLength = mealLoop.config?.cycleLength;
        applyLoopConfig(config, traySourcePool, dishes);
        window.dispatchEvent(new CustomEvent('loop_updated', { detail: { config } }));
        setMealLoopModalOpen(false);
        // Fire notification if cycle length increased — user needs more dishes
        if (prevLength && config.cycleLength > prevLength) {
            const newTarget = Math.round(5 * config.cycleLength / 7);
            useNotificationStore.getState().addNotification({
                type: 'tip',
                title: '📋 Your Tray Needs More Dishes',
                message: `With a ${config.cycleLength}-day cycle, aim for ${newTarget} dishes per slot for good variety. Add more to your tray!`,
                action: { label: 'Open Tray', route: 'profile' },
            });
        }
    }, [traySourcePool, applyLoopConfig, dishes, mealLoop.config?.cycleLength]);

    const handleTraySearchSelect = useCallback((dish: Dish) => {
      if (!addSlot) return;
      addToTray(addSlot, { id: dish.id, dishId: dish.id, name: dish.name, icon: dish.icon, sourceRegion: dish.region });
      setToast({ message: `${dish.name} added to tray`, type: 'success' });
      setAddSlot(null);
    }, [addSlot, addToTray, setToast]);

    const handleRemoveTrayDish = useCallback((slot: MealType, mealId: string) => {
      removeFromTray(slot, mealId);
      setToast({ message: 'Removed from tray', type: 'info' });
    }, [removeFromTray, setToast]);

    const suggestionChips = useMemo(() => {
        const allTrayItems = Object.values(trayLibrary).flat();
        const userDietPref = (user?.diet || 'veg').toLowerCase();
        const slotOrder = ['breakfast', 'lunch', 'dinner', 'snacks'];
        const bySlot: Record<string, any[]> = { breakfast: [], lunch: [], dinner: [], snacks: [] };
        
        // Filter and slot dishes
        (dishes || []).forEach((d: any) => {
            if (allTrayItems.some((t: any) => t.id === d.id)) return;
            const dt = (d.diet || d.type || '').toLowerCase();
            if (dt) {
                if (userDietPref === 'veg' && dt !== 'veg' && dt !== 'vegan') return;
                if (userDietPref === 'eggitarian' && dt !== 'eggitarian' && dt !== 'veg' && dt !== 'vegan') return;
                if (userDietPref !== 'veg' && userDietPref !== 'eggitarian' && dt === 'vegan') return;
            }
            // Assign to first matching slot
            const cats = (d.category || []).map((c: string) => c.toLowerCase());
            const slot = slotOrder.find(s => cats.includes(s)) || 'lunch';
            if (bySlot[slot]) bySlot[slot].push({ id: d.id, name: d.name, category: d.category || [] });
        });
        
        // Pick evenly from each slot, up to 2 per slot
        const result: any[] = [];
        for (let i = 0; i < 2; i++) {
            for (const slot of slotOrder) {
                const arr = bySlot[slot];
                if (!arr || arr.length === 0) continue;
                const idx = i < arr.length ? i : arr.length - 1 - i;
                const item = arr[i];
                if (item && !result.some(r => r.id === item.id)) result.push(item);
            }
        }
        return result.slice(0, 8);
    }, [trayLibrary, dishes, user?.diet]);

    const handleAddSuggestion = useCallback((suggestion: { id: string; name: string; category?: string[] }) => {
        const dish = dishes?.find((d: any) => d.id === suggestion.id);
        const mealSlots: Record<string, MealType> = { breakfast: 'breakfast', lunch: 'lunch', snacks: 'snacks', dinner: 'dinner' };
        let slot: MealType = 'lunch';
        if (dish?.category) {
            const match = dish.category.find((c: string) => mealSlots[c.toLowerCase()]);
            if (match) slot = mealSlots[match.toLowerCase()] ?? slot;
        }
        const items = trayLibrary[slot] || [];
        if (items.some((i: any) => i.name === suggestion.name)) return;
        addToTray(slot, { id: suggestion.id, dishId: suggestion.id, name: suggestion.name, icon: '' });
    }, [trayLibrary, addToTray, dishes]);

    const resetCustomForm = () => {
        setShowCustomForm(false);
        setCustomStep(1);
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
        setCustomStep(1);
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
        setConfirmDeleteDish(dish);
    };

    const performDeleteCustom = (dish: any) => {
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
                                    <span className="text-xs font-bold">Saved</span>
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

            {/* ─── Inline Diet Picker ─── */}
            <div className="px-4 pb-4">
                <div className="p-4 rounded-[22px] bg-white border border-gray-100 shadow-sm">
                    <p className="text-xs font-black uppercase tracking-widest text-gray-500 mb-3">Diet Preference</p>
                    <div className="grid grid-cols-2 gap-2">
                        {(['veg', 'eggitarian', 'non-veg', 'vegan'] as const).map(d => {
                            const isActive = (user?.diet || 'veg').toLowerCase() === d;
                            return (
                                <button key={d} onClick={() => {
                                    if (isActive) return;
                                    updateProfile({ diet: d as any });
                                    // Rebuild pool for new diet
                                    import('../../plan/store/useLoopStore').then(m => {
                                        const store = m.useLoopStore.getState();
                                        const current = store.mealLoop;
                                        if (current.config && current.sourceDishIds) {
                                            import('../../plan/utils/mealLoopEngine').then(eng => {
                                                import('../../meal/constants/dishLibrary').then(lib => {
                                                    const library = lib.DISH_LIBRARY;
                                                    const allowed: Record<string,string[]> = {
                                                        veg: ['veg','vegan'],
                                                        eggitarian: ['veg','vegan','eggitarian'],
                                                        'non-veg': ['veg','non-veg','vegan','eggitarian'],
                                                        vegan: ['vegan'],
                                                    };
                                                    const types = allowed[d] || ['veg'];
                                                    const filtered = library.filter((x:any) => types.includes(x.type));
                                                    const regionKey = getRegionKey(user?.region) || 'north';
                                                    // Region-aware + cross-slot diverse: lunch must not
                                                    // mirror dinner, and other-region dishes stay out.
                                                    const usedNames = new Set<string>();
                                                    const norm = (s: string) => (s || '').trim().toLowerCase();
                                                    const pool: any = {breakfast:[],lunch:[],snacks:[],dinner:[]};
                                                    for (const slot of ['breakfast','lunch','dinner','snacks'] as const) {
const eligible = filtered.filter((x:any) =>
                                                            x.category?.includes(slot) &&
                                                            (x.region === regionKey || x.region === 'all') &&
                                                            !isPureSweetDish(x)
                                                        );
                                                        const fresh = eligible.filter((x:any) => !usedNames.has(norm(x.name)));
                                                        const ranked = [...(fresh.length >= 5 ? fresh : [...fresh, ...eligible.filter((x:any) => !fresh.includes(x))])].slice(0,5);
                                                        for (const x of ranked) usedNames.add(norm(x.name));
                                                        pool[slot] = ranked;
                                                    }
                                                    // Diet representation quota (ALL diets): regional pools
                                                    // may hold zero distinctive-diet dishes — fill the
                                                    // deficit so rotation pools reflect the diet.
                                                    const distType = distinctiveTypeFor(d);
                                                    // Rotation VARIETY: a pool capped at 5 repeats the same
                                                    // dishes daily. Enrich each slot to the pool target with
                                                    // diet-allowed regional candidates (the tray-lead pool
                                                    // keeps priority via enrichSourcePool).
                                                    const enriched = enrichSourcePool(pool, library, {
                                                        allowedTypes: types,
                                                        regionKey,
                                                        target: 12,
                                                        priority: (x:any) => ((x.diet||x.type||'')+'').toLowerCase() === distType ? 0 : 1,
                                                    });
                                                    for (const s of ['breakfast','lunch','dinner','snacks'] as const) pool[s] = enriched[s];
                                                    const have = (['breakfast','lunch','dinner','snacks'] as const)
                                                        .reduce((n, s) => n + pool[s].filter((x:any) => ((x.diet||x.type||'')+'').toLowerCase() === distType).length, 0);
                                                    const reps = pickDietRepresentatives(library, {
                                                        distType,
                                                        regionKey,
                                                        minCount: Math.max(0, 3 - have),
                                                        excludeNames: usedNames,
                                                    });
                                                    const takenBuckets = new Set<string>();
                                                    for (const rep of reps) {
                                                        // Spread across DISTINCT buckets — lunch-first
                                                        // dumped every egg into one slot's rotation.
                                                        const cats = ((rep.category || []) as any).map((c:any) => c.toLowerCase());
                                                        const bucket = (['breakfast', 'lunch', 'dinner', 'snacks'] as const)
                                                            .find(s => !takenBuckets.has(s) && cats.some((c:string) => c.includes(s)) )
                                                            ?? (['lunch','dinner','breakfast','snacks'] as const)
                                                                .find(s => cats.some((c:string) => c.includes(s)))
                                                            ?? 'lunch';
                                                        takenBuckets.add(bucket);
                                                        if (!pool[bucket].some((x:any) => x.id === rep.id)) pool[bucket].push(rep);
                                                    }
                                                    store.applyLoopConfig({...(current.config as MealLoopConfig), startDate: new Date().toISOString().split('T')[0] ?? ''}, pool, library);
                                                    window.dispatchEvent(new CustomEvent('loop_updated', {detail:{config:current.config}}));
                                                    // Tray must reflect the new diet too — the loop
                                                    // rebuild alone leaves egg-free slots in place.
                                                    import('../../utils/dietHeal').then(m => m.healTrayDietGaps(true));
                                                });
                                            });
                                        }
                                    });
                                    setToast({message:`Diet changed to ${d} — meal plan rebuilt`, type:'success'});
                                }}
                                    className={`flex-1 py-2.5 rounded-xl text-sm font-bold tracking-wider transition-all active:scale-95 ${
                                        isActive ? 'bg-[#FF385C] text-white shadow-sm' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                                    }`}
                                >
                                    {d === 'veg' ? '🥬 Veg' : d === 'eggitarian' ? '🥚 Egg' : d === 'non-veg' ? '🍗 Non-Veg' : '🌱 Vegan'}
                                </button>
                            );
                        })}
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
                                        <p className="text-xs text-gray-500">This may take a moment for large plans</p>
                                    </div>
                                </div>
                            </div>
                        )}

            <main className="px-4 space-y-5">
                <CollapsibleSection title="Health Insights" summary="Last 7 days balance" color="emerald">
                    <WeeklyHealthSummary />
                    <div className="mt-3"><ProfileAIInsights /></div>
                </CollapsibleSection>

                <CollapsibleSection title="Your Tray" defaultOpen={true} color="rose">
                    {(() => {
                        const activeSlots = (['breakfast', 'lunch', 'snacks', 'dinner'] as const).filter(s => plannedSlots.includes(s.charAt(0).toUpperCase() + s.slice(1)));
                        const trayTab = activeSlots.includes(overviewSlot as any) ? overviewSlot : activeSlots[0] || 'breakfast';
                        const setTrayTab = setOverviewSlot;
                        const items = trayLibrary[trayTab] || [];
                        const total = trayCounts.breakfast + trayCounts.lunch + trayCounts.dinner + trayCounts.snacks;
                        const cl = mealLoop.config?.cycleLength ?? 7;
                        const target = Math.round(5 * cl / 7) * 4;
                        const pct = Math.min(100, Math.round(total / target * 100));
                        return (
                            <div className="space-y-3">
                                {/* Tab bar */}
                                <div className="flex gap-1 bg-gray-100 rounded-xl p-1">
                                    {activeSlots.map(slot => {
                                        const count = (trayLibrary[slot] || []).length;
                                        const isActive = trayTab === slot;
                                        return (
                                            <button key={slot} onClick={() => setTrayTab(slot)}
                                                className={`flex-1 py-2.5 rounded-[10px] text-xs font-bold tracking-wider transition-all ${
                                                    isActive ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-700'
                                                }`}
                                            >
                                                {slot.charAt(0).toUpperCase() + slot.slice(1)}
                                                {count > 0 && <span className={`ml-1 ${isActive ? 'text-[#FF385C]' : 'text-gray-400'}`}>{count}</span>}
                                            </button>
                                        );
                                    })}
                                </div>

                                {/* Content for selected tab */}
                                <div className="bg-white rounded-xl border border-gray-100 p-4 min-h-[100px]">
                                    <div className="flex items-center justify-between mb-3">
                                        <span className="text-sm font-medium text-gray-500">
                                            {items.length} dish{items.length !== 1 ? 'es' : ''}
                                        </span>
                                        <button onClick={() => setAddSlot(trayTab)}
                                            className="flex items-center gap-1 px-3 py-1.5 rounded-full bg-[#FF385C]/10 text-[#FF385C] text-xs font-bold active:scale-95 transition-all"
                                        >
                                            <Plus size={12} /> Add
                                        </button>
                                    </div>
                                    {items.length === 0 ? (
                                        <div className="flex items-center justify-center py-10 text-center">
                                            <div>
                                                <p className="text-base text-gray-400 mb-1">No dishes yet</p>
                                                <p className="text-xs text-gray-300">Tap Add to fill your {trayTab} tray</p>
                                            </div>
                                        </div>
                                    ) : (
                                        <div className="flex gap-3 overflow-x-auto pb-1 scrollbar-hide -mx-1 px-1">
                                            {items.map(item => (
                                                <div key={item.id} className="flex flex-col items-center gap-1.5 flex-shrink-0 w-[88px] group">
                                                    <button onClick={() => handleRemoveTrayDish(trayTab, item.id)}
                                                        className="relative w-[72px] h-[72px] rounded-2xl overflow-hidden border border-gray-200 shadow-sm active:scale-90 transition-all hover:border-[#FF385C]/30 hover:shadow-md"
                                                    >
                                                        <DishImage name={item.name} size="full" className="w-full h-full object-cover" />
                                                        <div className="absolute -top-1.5 -right-1.5 w-5 h-5 rounded-full bg-white border border-gray-200 flex items-center justify-center shadow-sm opacity-0 group-hover:opacity-100 transition-opacity">
                                                            <X size={9} className="text-gray-400 group-hover:text-red-500" />
                                                        </div>
                                                    </button>
                                                    <span className="text-sm font-medium text-gray-700 text-center leading-tight line-clamp-2 max-w-[80px]">{item.name}</span>
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </div>

                                {/* Mini strength bar */}
                                <div className="flex items-center gap-2.5 px-3 py-2 rounded-xl bg-gradient-to-r from-[#FF385C]/5 to-orange-50 border border-[#FF385C]/10">
                                    <span className="text-base">{total === 0 ? '🫤' : pct >= 70 ? '🎉' : pct >= 40 ? '😊' : '🫤'}</span>
                                    <div className="flex-1">
                                        <div className="flex items-center justify-between mb-0.5">
                                            <span className="text-xs text-gray-500">{total} of {target} dishes</span>
                                            <span className="text-xs font-bold text-[#FF385C]">{pct}%</span>
                                        </div>
                                        <div className="h-1 bg-gray-200/60 rounded-full overflow-hidden">
                                            <div className="h-full bg-gradient-to-r from-[#FF385C] to-orange-400 rounded-full transition-all" style={{ width: `${pct}%` }} />
                                        </div>
                                    </div>
                                </div>
                            </div>
                        );
                    })()}
                </CollapsibleSection>

                <CollapsibleSection title="Custom Dishes" defaultOpen={false} badge={customDishes.length > 0 ? `${customDishes.length}` : undefined} color="amber">
                    <div className="space-y-3">
                        {showCustomForm ? (
                            <div className="bg-white rounded-xl border border-gray-100 p-4 space-y-3">
                                <div className="flex items-center justify-between">
                                    <span className="text-xs font-black uppercase tracking-widest text-gray-500">
                                        {editingDishId ? 'Edit' : 'Add'} Recipe
                                        <span className="ml-1.5 text-gray-300 font-normal">step {customStep}/4</span>
                                    </span>
                                    <button onClick={resetCustomForm} className="w-7 h-7 rounded-full flex items-center justify-center bg-gray-100 text-gray-500 hover:bg-gray-200"><X size={13} /></button>
                                </div>

                                {/* Step indicators */}
                                <div className="flex gap-1">
                                    {[1,2,3,4].map(s => (
                                        <div key={s} className={`flex-1 h-1 rounded-full transition-all ${s <= customStep ? 'bg-[#FF385C]' : 'bg-gray-200'}`} />
                                    ))}
                                </div>

                                {/* Step 1: Name + Diet + Image */}
                                {customStep === 1 && (
                                    <div className="space-y-3">
                                        <div className="flex gap-3 items-start">
                                            <div onClick={() => fileInputRef.current?.click()} className="relative w-16 h-16 rounded-xl overflow-hidden bg-gray-100 border-2 border-dashed border-gray-200 flex items-center justify-center text-2xl cursor-pointer hover:border-gray-400 transition-all shrink-0">
                                                {customImageDataUrl ? <img src={customImageDataUrl} alt="" className="w-full h-full object-cover" /> : <span className="opacity-50">📷</span>}
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <input type="text" value={customName} onChange={e => setCustomName(e.target.value)}
                                                    className="w-full rounded-xl py-2.5 px-3 text-sm font-medium border border-gray-200 bg-white text-gray-900 outline-none focus:border-gray-400 transition-all" placeholder="Dish name (e.g., Mom's Dal)" autoFocus />
                                            </div>
                                        </div>
                                        <div className="flex gap-1.5">
                                            {(['veg', 'non-veg', 'vegan'] as const).map(d => (
                                                <button key={d} onClick={() => setCustomDiet(d)}
                                                    className={`flex-1 py-2 rounded-xl text-xs font-bold transition-all active:scale-95 ${customDiet === d ? 'bg-[#FF385C] text-white shadow-sm' : 'bg-gray-100 text-gray-500 hover:bg-gray-200'}`}
                                                >{d === 'veg' ? '🥬 Veg' : d === 'non-veg' ? '🍗 Non-Veg' : '🌱 Vegan'}</button>
                                            ))}
                                        </div>
                                    </div>
                                )}

                                {/* Step 2: Style + Health Tags */}
                                {customStep === 2 && (
                                    <div className="space-y-3">
                                        <div>
                                            <p className="text-xs font-bold text-gray-500 mb-2">Style</p>
                                            <div className="flex gap-1.5 flex-wrap">
                                                {['Gravy', 'Dry', 'Soup', 'Rice', 'Bread', 'Snack', 'Drink', 'Dessert'].map(style => (
                                                    <button key={style} onClick={() => setCustomStyle(style)}
                                                        className={`px-3 py-1.5 rounded-lg text-xs font-bold border transition-all active:scale-95 ${
                                                            customStyle === style ? 'bg-gray-900 text-white border-gray-900 shadow-sm' : 'bg-white text-gray-500 border-gray-200 hover:border-gray-300'
                                                        }`}
                                                    >{style}</button>
                                                ))}
                                            </div>
                                        </div>
                                        <div>
                                            <p className="text-xs font-bold text-gray-500 mb-2">Health Tags <span className="text-gray-300 font-normal">(optional — helps with meal planning)</span></p>
                                            <div className="flex gap-1.5 flex-wrap">
                                                {['healthy', 'quick', 'festival', 'low-cal', 'protein', 'comfort'].map(tag => (
                                                    <button key={tag} onClick={() => setCustomTags(prev => prev.includes(tag) ? prev.filter(t => t !== tag) : [...prev, tag])}
                                                        className={`px-3 py-1.5 rounded-lg text-xs font-bold border transition-all active:scale-95 ${
                                                            customTags.includes(tag) ? 'bg-[#FF385C]/10 text-[#FF385C] border-[#FF385C]/30' : 'bg-white text-gray-500 border-gray-200 hover:border-gray-300'
                                                        }`}
                                                    >{tag}</button>
                                                ))}
                                            </div>
                                        </div>
                                    </div>
                                )}

                                {/* Step 3: Ingredients (pantry integration) */}
                                {customStep === 3 && (
                                    <div className="space-y-2">
                                        <p className="text-xs font-bold text-gray-500">Ingredients <span className="text-gray-300 font-normal">— added to your pantry automatically</span></p>
                                        <div className="grid grid-cols-[1fr_3.5rem_3.5rem_auto] gap-1.5">
                                            <input type="text" value={ingredientName} onChange={e => setIngredientName(e.target.value)}
                                                className="rounded-lg py-1.5 px-2.5 text-xs font-medium border border-gray-200 bg-gray-50 text-gray-900 outline-none focus:border-gray-400" placeholder="Ingredient" />
                                            <input type="text" value={ingredientQty} onChange={e => setIngredientQty(e.target.value)}
                                                className="rounded-lg py-1.5 px-2 text-xs font-medium border border-gray-200 bg-gray-50 text-gray-900 outline-none focus:border-gray-400 text-center" placeholder="Qty" />
                                            <select value={ingredientUnit} onChange={e => setIngredientUnit(e.target.value)}
                                                className="rounded-lg py-1.5 px-1 text-xs font-medium border border-gray-200 bg-gray-50 text-gray-600 outline-none">
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
                                                    <div key={idx} className="flex items-center gap-1 px-2 py-1 rounded-lg bg-white text-xs font-medium text-gray-700 border border-gray-100 shadow-sm">
                                                        <span>{ing.name}</span>
                                                        <span className="text-gray-500">{ing.quantity}{ing.unit}</span>
                                                        <button onClick={() => setCustomIngredients(prev => prev.filter((_, i) => i !== idx))} className="text-gray-500 hover:text-red-500"><X size={10} /></button>
                                                    </div>
                                                ))}
                                            </div>
                                        )}
                                    </div>
                                )}

                                {/* Step 4: Review & Save */}
                                {customStep === 4 && (
                                    <div className="space-y-3">
                                        <div className="flex items-center gap-3 p-3 rounded-xl bg-gray-50 border border-gray-100">
                                            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-gray-50 to-gray-100 flex items-center justify-center text-xl overflow-hidden">
                                                {customImageDataUrl ? <img src={customImageDataUrl} alt="" className="w-full h-full object-cover" /> : '🍽️'}
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <p className="text-sm font-bold text-gray-900">{customName || 'Unnamed Dish'}</p>
                                                <p className="text-xs text-gray-500">{customDiet} · {customStyle} · {customTags.join(', ')}</p>
                                                <p className="text-xs text-gray-400">{customIngredients.length} ingredient{customIngredients.length !== 1 ? 's' : ''}</p>
                                            </div>
                                        </div>
                                    </div>
                                )}

                                {/* Navigation buttons */}
                                <div className="flex gap-2 pt-1">
                                    {customStep > 1 ? (
                                        <button onClick={() => setCustomStep(s => s - 1)}
                                            className="px-4 py-2 rounded-xl bg-gray-100 text-gray-600 text-xs font-bold active:scale-95 transition-all"
                                        >Back</button>
                                    ) : <div />}
                                    <div className="flex-1" />
                                    {customStep < 4 ? (
                                        <button onClick={() => setCustomStep(s => s + 1)}
                                            className="px-6 py-2 rounded-xl bg-[#FF385C] text-white text-xs font-bold active:scale-95 transition-all shadow-sm"
                                        >Next</button>
                                    ) : (
                                        <button onClick={handleCreateCustom} disabled={!customName.trim()}
                                            className="px-6 py-2 rounded-xl bg-[#FF385C] text-white text-xs font-bold active:scale-[0.98] transition-all disabled:opacity-40 shadow-sm"
                                        >{editingDishId ? 'Save' : 'Create Dish'}</button>
                                    )}
                                </div>
                            </div>
                        ) : customDishes.length === 0 ? (
                            <div className="flex flex-col items-center py-6 text-center">
                                <div className="w-14 h-14 rounded-2xl bg-gray-100 flex items-center justify-center text-2xl mb-3">🍳</div>
                                <p className="text-sm font-bold text-gray-900 mb-1">No custom dishes</p>
                                <p className="text-sm text-gray-500 mb-4">Add family recipes here</p>
                                <button onClick={() => { resetCustomForm(); setShowCustomForm(true); }}
                                    className="px-4 py-2 rounded-xl bg-[#FF385C] text-white text-xs font-bold shadow-sm active:scale-95 transition-all"
                                >+ Add Recipe</button>
                            </div>
                        ) : (
                            <div className="space-y-2">
                                <button onClick={() => { resetCustomForm(); setShowCustomForm(true); }}
                                    className="w-full py-2.5 rounded-xl border border-dashed border-gray-200 text-gray-500 text-xs font-bold active:scale-[0.98] transition-all hover:border-gray-300 flex items-center justify-center gap-1"
                                ><Plus size={13} /> New Recipe</button>
                                {customDishes.map(dish => (
                                    <div key={dish.id} className="flex items-center gap-3 p-2.5 rounded-xl bg-white border border-gray-100 shadow-sm">
                                        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-gray-50 to-gray-100 flex items-center justify-center text-lg overflow-hidden">
                                            {dish.icon?.startsWith('data:') ? <img src={dish.icon} alt="" className="w-full h-full object-cover" /> : '🍽️'}
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <p className="text-sm font-bold text-gray-900 truncate">{dish.name}</p>
                                            <p className="text-xs text-gray-500">{dish.type}</p>
                                        </div>
                                        <div className="flex gap-0.5">
                                            <button onClick={() => handleEditCustom(dish)} className="w-7 h-7 rounded-lg flex items-center justify-center text-gray-400 hover:text-gray-600 hover:bg-gray-100 active:scale-90 transition-all"><Edit3 size={12} /></button>
                                            <button onClick={() => handleDeleteCustom(dish)} className="w-7 h-7 rounded-lg flex items-center justify-center text-gray-400 hover:text-red-500 hover:bg-red-50 active:scale-90 transition-all"><Trash2 size={12} /></button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </CollapsibleSection>

                {/* ─── Spice level toggle (moved here from the dashboard header) ─── */}
                <CollapsibleSection title="Taste" color="orange">
                    <div className="flex items-center justify-between p-4 rounded-[22px] bg-orange-50/50 border border-orange-200/50">
                        <div className="min-w-0">
                            <p className="text-sm font-bold text-gray-900">Spice level</p>
                            <p className="text-xs text-gray-500">Tap the pill to cycle Mild → Medium → Hot</p>
                        </div>
                        <button
                            onClick={() => {
                                const levels: ('mild' | 'medium' | 'hot')[] = ['mild', 'medium', 'hot'];
                                const current = user?.spiceLevel || 'medium';
                                const idx = levels.indexOf(current);
                                const next = levels[(idx + 1) % levels.length];
                                updateProfile({ spiceLevel: next });
                            }}
                            className="text-xs font-bold border px-3 py-2 rounded-full flex items-center gap-1 bg-orange-50 text-orange-500 border-orange-100 active:scale-95 transition-all shrink-0"
                        >
                            {SPICE_LABELS[user?.spiceLevel || 'medium'] ?? 'Medium 🌶️'}
                        </button>
                    </div>
                    <div className="flex items-center gap-2 mt-3">
                        <button
                            onClick={() => {
                                void healTrayDietGaps(true);
                                useStore.getState().setToast({ message: 'Diet reps re-matched to your profile', type: 'success' });
                            }}
                            className="flex-1 py-2.5 rounded-xl bg-orange-100 text-orange-600 text-[11px] font-black uppercase tracking-widest active:scale-95 transition-all"
                        >
                            ↻ Re-match diet
                        </button>
                        <button
                            onClick={() => window.dispatchEvent(new Event('household:refresh'))}
                            className="flex-1 py-2.5 rounded-xl bg-gray-100 text-gray-600 text-[11px] font-black uppercase tracking-widest active:scale-95 transition-all"
                        >
                            ⟳ Refresh family
                        </button>
                    </div>
                </CollapsibleSection>

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
                                        <p className="text-xs text-gray-500">{household.members.length} member{household.members.length !== 1 ? 's' : ''}</p>
                                    </div>
                                </div>
                                <div className="flex flex-wrap gap-1.5">
                                    {household.members.map(m => (
                                        <span key={m.id} className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium border ${
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
                                    <FamilyPlans household={household} />
                                    <div className="flex gap-3 pt-2">
                                    <button onClick={() => setShowInviteMember(true)} className="flex-1 py-3 rounded-xl bg-orange-500 text-white text-xs font-black uppercase tracking-widest flex items-center justify-center gap-2">
                                        <Copy size={14} /> Invite
                                    </button>
                                    <button onClick={() => setConfirmLeaveHousehold(true)} className="flex-1 py-3 rounded-xl border border-red-200 text-red-500 text-xs font-black uppercase tracking-widest">
                                        Leave
                                    </button>
                                </div>
                            </div>
                        ) : (
                            <div className="space-y-3">
                                <p className="text-xs text-gray-500">Share a meal plan with your household. Everyone can add their requests.</p>
                                <div className="flex gap-3">
                                    <button onClick={() => setShowCreateHousehold(true)} className="flex-1 py-3 rounded-xl bg-orange-500 text-white text-xs font-black uppercase tracking-widest flex items-center justify-center gap-2">
                                        <Users size={16} /> Create
                                    </button>
                                    <button onClick={() => setShowJoinHousehold(true)} className="flex-1 py-3 rounded-xl border border-orange-200 text-orange-600 text-xs font-black uppercase tracking-widest flex items-center justify-center gap-2">
                                        <LogIn size={16} /> Join
                                    </button>
                                </div>
                            </div>
                        )}
                    </div>
                </CollapsibleSection>

                <section>
                    <div className="px-5 py-5">
                        <h4 className="text-sm font-black uppercase tracking-widest text-gray-500">Account & Settings</h4>
                    </div>
                    <div className="px-5 space-y-4">
                        <div className="p-5 rounded-2xl bg-white border border-gray-100 flex items-center justify-between">
                            <div className="flex items-center gap-4">
                                <RefreshCw size={20} className="text-emerald-500 shrink-0" />
                                <div>
                                    <p className="text-xs font-bold text-gray-900">Meal Loop</p>
                                    {loopStatus ? (
                                        <div className="flex flex-col gap-0.5 mt-0.5">
                                            <div className="flex items-center gap-1.5">
                                                <span className={`w-1.5 h-1.5 rounded-full ${loopStatus.dot}`} />
                                                <p className={`text-xs ${loopStatus.color}`}>{loopStatus.label}</p>
                                            </div>
                                            {loopStatus.skipBadge && (
                                                <p className="text-xs text-amber-600 ml-3">{loopStatus.skipBadge}</p>
                                            )}
                                        </div>
                                    ) : (
                                        <p className="text-sm text-gray-500">Auto-rotate dishes across your plan</p>
                                    )}
                                </div>
                            </div>
                            <div className="flex items-center gap-2">
                                    <button
                                        onClick={() => setMealLoopModalOpen(true)}
                                        className="px-5 py-2.5 rounded-2xl bg-white border border-gray-100 text-xs font-black uppercase tracking-widest text-emerald-500"
                                    >
                                    Manage
                                </button>
                                {mealLoop.config && (
                                    <button
                                        onClick={() => {
                                            useLoopStore.getState().refreshLoop(dishes);
                                        }}
                                        disabled={mealLoop.refreshing}
                                        className="w-7 h-7 rounded-full flex items-center justify-center bg-[#FF385C]/5 text-[#FF385C] hover:bg-[#FF385C]/10 disabled:opacity-30 active:scale-90 transition-all"
                                    >
                                        <RefreshCw size={11} className={mealLoop.refreshing ? 'animate-spin' : ''} />
                                    </button>
                                )}
                            </div>
                        </div>

                        {mealLoop.config && mealLoop.analytics.mealsAutoFilled > 0 && (
                            <div className="p-5 rounded-2xl bg-blue-50 border border-blue-100">
                                <div className="flex items-center gap-4 mb-4">
                                    <span className="text-xl">📊</span>
                                    <div>
                                        <p className="text-sm font-black text-blue-800">Loop Progress</p>
                                        <p className="text-sm text-blue-600">Your meal automation stats</p>
                                    </div>
                                </div>
                                <div className="grid grid-cols-3 gap-4">
                                    <div className="text-center">
                                        <p className="text-xl font-black text-blue-700">{mealLoop.analytics.cyclesCompleted}</p>
                                        <p className="text-xs font-bold text-blue-500 uppercase">Cycles</p>
                                    </div>
                                    <div className="text-center">
                                        <p className="text-lg font-black text-blue-700">{mealLoop.analytics.mealsAutoFilled}</p>
                                        <p className="text-xs font-bold text-blue-500 uppercase">Meals Filled</p>
                                    </div>
                                    <div className="text-center">
                                        <p className="text-lg font-black text-blue-700">{mealLoop.analytics.dishesSkipped}</p>
                                        <p className="text-xs font-bold text-blue-500 uppercase">Skipped</p>
                                    </div>
                                </div>
                            </div>
                        )}

                        <div className="p-5 rounded-2xl bg-white border border-gray-100 flex items-center justify-between">
                            <div className="flex items-center gap-4">
                                {notifications ? <Bell size={20} className="text-violet-500 shrink-0" /> : <BellOff size={20} className="text-gray-400 shrink-0" />}
                                <div>
                                    <p className="text-xs font-bold text-gray-900">Notifications</p>
                                    <p className="text-sm text-gray-500">{notifications ? 'Daily meal reminders & alerts' : 'Off'}</p>
                                </div>
                            </div>
                            <button onClick={() => setNotifications(!notifications)}
                                className={`w-12 h-6 rounded-full transition-all duration-300 relative shrink-0 ${notifications ? 'bg-violet-500' : 'bg-gray-200'}`}>
                                <div className={`w-5 h-5 bg-white rounded-full shadow absolute top-0.5 transition-all duration-300 ${notifications ? 'left-6' : 'left-0.5'}`} />
                            </button>
                        </div>

                        {onLogout && (
                            <button onClick={onLogout}
                                className="w-full py-4 rounded-2xl bg-red-50 text-red-500 flex items-center justify-center gap-2 font-bold active:scale-95 transition-all text-sm"
                            >
                                <LogOut size={18} /> Logout
                            </button>
                        )}
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

            {addSlot && (
                <DishSearchModal
                    key={`search_${addSlot}`}
                    isOpen={true}
                    onClose={() => setAddSlot(null)}
                    dishes={dishes}
                    mealType={addSlot}
                    userDiet={user?.diet}
                    userRegion={user?.region}
                    onSelect={handleTraySearchSelect}
                />
            )}

            <CreateHouseholdModal isOpen={showCreateHousehold} onClose={() => setShowCreateHousehold(false)} />
            <JoinHouseholdModal isOpen={showJoinHousehold} onClose={() => setShowJoinHousehold(false)} />
            <InviteMemberModal isOpen={showInviteMember} onClose={() => setShowInviteMember(false)} />

            <ConfirmDialog
                isOpen={confirmDeleteDish !== null}
                title="Delete dish?"
                message={`Delete "${confirmDeleteDish?.name}"? This removes it from your tray and meal plan.`}
                confirmLabel="Delete"
                onConfirm={() => { if (confirmDeleteDish) performDeleteCustom(confirmDeleteDish); setConfirmDeleteDish(null); }}
                onCancel={() => setConfirmDeleteDish(null)}
            />
            <ConfirmDialog
                isOpen={confirmLeaveHousehold}
                title="Leave household?"
                message="Your requested items will remain."
                confirmLabel="Leave"
                onConfirm={() => { useStore.getState().leaveHousehold(); setConfirmLeaveHousehold(false); }}
                onCancel={() => setConfirmLeaveHousehold(false)}
            />
        </div>
    );
};

export default React.memo(Profile);
