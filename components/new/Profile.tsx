import React, { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import { useStore } from '../../store/useStore';
import { useTrayStore } from '../../store/useTrayStore';
import type { MealType } from '../../types/tray';
import type { SourcePool } from '../../utils/mealLoopEngine';
import type { Category } from '../../constants/dishLibrary';
import { compactPrimaryId } from '../../types/identity';
import MealLoopConfigModal from '../meal/MealLoopConfigModal';
import { MapPin, ShieldAlert, Flame, Phone, LogOut, Bell, BellOff, Check, ChevronDown, ChevronRight, ArrowRight, SlidersHorizontal, RefreshCw, Plus, Edit3, Trash2, X, Camera } from 'lucide-react';
import { getISODate } from '../../utils/dateUTC';


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
    const { user, updateProfile, startTrayEdit, openQuickSetup } = useStore();
    const defaultName = user?.name || (user?.primaryId ? compactPrimaryId(user.primaryId) : '');
    const [nameDraft, setNameDraft] = useState<string>(defaultName);
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
const [cookInput, setCookInput] = useState(user?.cookContact || '');
const [notifications, setNotifications] = useState(true);
const [mealLoopModalOpen, setMealLoopModalOpen] = useState(false);

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

    const trayLibrary = useStore(s => s.trayLibrary);
    const dishes = useStore(s => s.dishes);
    const plan = useTrayStore(s => s.plan);
    const getMeals = useTrayStore(s => s.getMeals);
    const { applyLoopConfig } = useTrayStore();
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

    const mealLoop = useTrayStore(s => s.mealLoop);

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
        const counts: Record<MealType, Set<string>> = { breakfast: new Set(), lunch: new Set(), snacks: new Set(), dinner: new Set() };
        // Read from trayLibrary (user's saved defaults)
        for (const mt of types) {
            for (const item of trayLibrary[mt]) {
                counts[mt].add(item.dishId ?? item.id);
            }
        }
        // FIX: Also include dishes from plan.days to match Meal Tray Builder counts
        for (const date of Object.keys(plan.days)) {
            for (const mt of types) {
                const meals = plan.days[date]?.[mt] || [];
                for (const item of meals) {
                    counts[mt].add(item.meal_id);
                }
            }
        }
        return {
            breakfast: counts.breakfast.size,
            lunch: counts.lunch.size,
            snacks: counts.snacks.size,
            dinner: counts.dinner.size,
        };
    }, [trayLibrary, plan.days]);

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
                region: user?.region || 'North',
                category: [customStyle.toLowerCase()],
                states: [user?.region || 'North'],
                tags: [...customTags, 'user_created'],
                variants: [{
                    id: `v-${id}`,
                    name: customName.trim(),
                    addOn: '',
                    tags: [...customTags, 'user_created'],
                    healthCategories: customTags,
                    mealContext: '',
                    ingredients: ings,
                }],
                prepTime: 15,
                description: '',
            } as any);
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
        trayStore.setMealLoop(
            trayStore.mealLoop.config,
            trayStore.mealLoop.sourceDishIds.filter(id => id !== dish.id),
            trayStore.mealLoop.assignments.filter(a => a.dishId !== dish.id)
        );
        const ml = useTrayStore.getState().mealLoop;
        useTrayStore.setState({
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
        <div className="min-h-screen bg-white pb-32 animate-in fade-in duration-500">
            <header className="px-6 pt-4 pb-6 bg-gradient-to-b from-gray-50 to-white">
                <div className="mb-4">
                <input
                    value={nameDraft}
                    onChange={(e) => setNameDraft(e.target.value)}
                    onBlur={() => {
                        updateProfile({ name: nameDraft });
                    }}
                    className="w-full bg-transparent font-bold text-3xl text-gray-900 tracking-tight outline-none border-b-2 border-transparent focus:border-[#FF385C] transition-colors placeholder:text-gray-300"
                    placeholder="Enter your name"
                />
                <p className="text-[11px] text-gray-400 mt-1.5">You can change this anytime.</p>
            </div>
                <div className="flex items-center gap-5">
                    <div className="relative w-20 h-20 bg-gradient-to-br from-[#FF385C] to-[#E31C5F] rounded-[28px] flex items-center justify-center shadow-xl shadow-[#FF385C]/20 overflow-hidden cursor-pointer active:scale-95 transition-all" onClick={handleAvatarUpload}>
                        {user?.avatarUrl ? (
                            <img src={user.avatarUrl} alt="Profile" className="w-full h-full object-cover" />
                        ) : (
                            <img src="/logo.png" alt="Logo" className="w-full h-full object-cover" />
                        )}
                        <div className="absolute inset-0 bg-black/0 hover:bg-black/20 transition-all flex items-center justify-center">
                            <Camera size={16} className="text-white opacity-0 hover:opacity-100 transition-opacity" />
                        </div>
                    </div>
                    <div>
                        <h3 className="text-2xl font-bold">{user.diet || 'Food Lover'}</h3>
                        <p className="text-gray-400 text-sm">{user.region} · {SPICE_LABELS[user.spiceLevel || 2]}</p>
                    </div>
                </div>
                <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={handleAvatarChange} />
                {/* Visual stat cards removed: replaced by a focused Profile editing experience */}
            </header>
            <div className="px-6 pb-6">
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
                            <p className="text-xs text-gray-400">Region, diet, slots.</p>
                        </div>
                        <ChevronRight size={16} className="text-gray-400" />
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
                                        <p className="text-[10px] text-gray-400">This may take a moment for large plans</p>
                                    </div>
                                </div>
                            </div>
                        )}

            <main className="px-6 space-y-5">
                <section>
                    <h4 className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-3">Meal Management</h4>
                    <div className="space-y-3">
                        <div className="p-5 rounded-[22px] bg-[#FF385C]/5 border border-[#FF385C]/10">
                            <div className="flex items-start justify-between gap-4">
                                <div>
                                    <p className="text-xs font-black uppercase tracking-widest text-[#FF385C]">Your Tray</p>
                                    <p className="text-base font-bold text-gray-900 mt-1">Saved defaults — Plan pulls from here.</p>
                                    <p className="text-[10px] text-gray-500 mt-0.5">Tray = Favorites &bull; Plan = Scheduled meals you build</p>
                                </div>
                                <button
                                    onClick={() => { startTrayEdit({ returnTab: 'profile', slot: 'Lunch' }); onManageTray?.(); }}
                                    className="px-4 py-2 rounded-2xl bg-[#FF385C] text-white text-xs font-black uppercase tracking-widest"
                                >
                                    Manage
                                </button>
                            </div>
                            <div className="grid grid-cols-2 gap-2 mt-4">
                                {traySummary.map(item => (
                                    <button
                                        key={item.slot}
                                        onClick={() => { startTrayEdit({ returnTab: 'profile', slot: item.slot }); onManageTray?.(item.slot as MealType); }}
                                        className="bg-white rounded-2xl border border-white/80 p-4 text-left shadow-sm"
                                    >
                                        <p className="text-[10px] font-black uppercase tracking-widest text-gray-400">{item.slot}</p>
                                        <p className="text-lg font-bold text-gray-900 mt-1">{item.count} dishes</p>
                                    </button>
                                ))}
                            </div>
                        </div>

                    </div>
                </section>

                <section>
                    <h4 className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-3">Custom Dishes</h4>
                    <div className="p-5 rounded-[22px] bg-purple-50/50 border border-purple-200/50">
                        {showCustomForm ? (
                            <div className="space-y-4">
                                <div className="flex items-center justify-between">
                                    <p className="text-xs font-black uppercase tracking-widest text-purple-600">{editingDishId ? 'Edit' : 'Create'} Custom Dish</p>
                                    <button onClick={resetCustomForm} className="text-gray-400 hover:text-gray-600"><X size={16} /></button>
                                </div>
                                <div>
                                    <label className="text-[9px] font-bold text-gray-500 block mb-1">Name</label>
                                    <input type="text" value={customName} onChange={e => setCustomName(e.target.value)} className="w-full rounded-xl py-2.5 px-3 text-sm font-medium border border-gray-200 bg-white text-gray-900" placeholder="Dish name" />
                                </div>
                                <div>
                                    <label className="text-[9px] font-bold text-gray-500 block mb-1">Diet</label>
                                    <div className="flex gap-2">
                                        {(['veg', 'non-veg', 'vegan'] as const).map(d => (
                                            <button key={d} onClick={() => setCustomDiet(d)} className={`px-3 py-2 rounded-xl text-xs font-bold border transition-all ${customDiet === d ? 'bg-gray-900 text-white border-gray-900' : 'bg-white text-gray-600 border-gray-200'}`}>
                                                {d === 'veg' ? 'Veg' : d === 'non-veg' ? 'Non-Veg' : 'Vegan'}
                                            </button>
                                        ))}
                                    </div>
                                </div>
                                <div>
                                    <label className="text-[9px] font-bold text-gray-500 block mb-1">Style</label>
                                    <div className="flex flex-wrap gap-1.5">
                                        {CUSTOM_STYLES.map(s => (
                                            <button key={s} onClick={() => setCustomStyle(s)} className={`px-3 py-1.5 rounded-lg text-[10px] font-bold border transition-all ${customStyle === s ? 'bg-gray-900 text-white border-gray-900' : 'bg-white text-gray-600 border-gray-200'}`}>{s}</button>
                                        ))}
                                    </div>
                                </div>
                                <div>
                                    <label className="text-[9px] font-bold text-gray-500 block mb-1">Tags</label>
                                    <div className="flex flex-wrap gap-1.5">
                                        {CUSTOM_TAGS.map(t => (
                                            <button key={t} onClick={() => setCustomTags(prev => prev.includes(t) ? prev.filter(x => x !== t) : [...prev, t])} className={`px-3 py-1.5 rounded-lg text-[10px] font-bold border transition-all ${customTags.includes(t) ? 'bg-emerald-500 text-white border-emerald-500' : 'bg-white text-gray-600 border-gray-200'}`}>{t}</button>
                                        ))}
                                    </div>
                                </div>
                                <div>
                                    <label className="text-[9px] font-bold text-gray-500 block mb-1">Picture</label>
                                    <div className="flex items-center gap-3">
                                        {customImageDataUrl ? (
                                            <div className="relative">
                                                <img src={customImageDataUrl} alt="" className="w-16 h-16 rounded-xl object-cover border border-gray-200" />
                                                <button onClick={() => setCustomImageDataUrl('')} className="absolute -top-1.5 -right-1.5 w-5 h-5 bg-red-500 text-white rounded-full flex items-center justify-center"><X size={10} /></button>
                                            </div>
                                        ) : (
                                            <div className="w-16 h-16 rounded-xl bg-white flex items-center justify-center text-2xl border border-gray-200">🍽️</div>
                                        )}
                                        <label className="px-3 py-2 rounded-xl border border-gray-200 bg-white text-xs font-bold text-gray-600 cursor-pointer active:scale-[0.98] transition-all hover:border-gray-300">
                                            <input type="file" accept="image/*" className="hidden" onChange={e => { const f = e.target.files?.[0]; if (f) { const r = new FileReader(); r.onload = () => setCustomImageDataUrl(r.result as string); r.readAsDataURL(f); } }} />
                                            {customImageDataUrl ? 'Change' : 'Upload'}
                                        </label>
                                    </div>
                                </div>
                                <div>
                                    <label className="text-[9px] font-bold text-gray-500 block mb-1">Ingredients</label>
                                    <div className="flex gap-1.5 mb-2">
                                        <input type="text" value={ingredientName} onChange={e => setIngredientName(e.target.value)} className="flex-1 rounded-lg py-1.5 px-2.5 text-xs font-medium border border-gray-200 bg-white text-gray-900" placeholder="Ingredient name" />
                                        <input type="text" value={ingredientQty} onChange={e => setIngredientQty(e.target.value)} className="w-16 rounded-lg py-1.5 px-2 text-xs font-medium border border-gray-200 bg-white text-gray-900" placeholder="Qty" />
                                        <select value={ingredientUnit} onChange={e => setIngredientUnit(e.target.value)} className="w-16 rounded-lg py-1.5 px-1 text-xs font-medium border border-gray-200 bg-white text-gray-600">
                                            <option value="g">g</option>
                                            <option value="kg">kg</option>
                                            <option value="ml">ml</option>
                                            <option value="pc">pc</option>
                                            <option value="tbsp">tbsp</option>
                                            <option value="tsp">tsp</option>
                                            <option value="cup">cup</option>
                                        </select>
                                        <button onClick={() => { if (!ingredientName.trim() || !ingredientQty.trim()) return; setCustomIngredients(prev => [...prev, { name: ingredientName.trim(), quantity: parseFloat(ingredientQty) || 0, unit: ingredientUnit }]); setIngredientName(''); setIngredientQty(''); setIngredientUnit('g'); }} className="px-2.5 py-1.5 rounded-lg bg-gray-900 text-white text-xs font-bold active:scale-90"><Plus size={14} /></button>
                                    </div>
                                    {customIngredients.length > 0 && (
                                        <div className="flex flex-wrap gap-1.5">
                                            {customIngredients.map((ing, idx) => (
                                                <div key={idx} className="flex items-center gap-1 px-2 py-1 rounded-lg bg-white text-[10px] font-medium text-gray-700 border border-gray-100">
                                                    <span>{ing.name}</span>
                                                    <span className="text-gray-400">{ing.quantity}{ing.unit}</span>
                                                    <button onClick={() => setCustomIngredients(prev => prev.filter((_, i) => i !== idx))} className="text-gray-400 hover:text-red-500"><X size={10} /></button>
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </div>
                                <button onClick={handleCreateCustom} disabled={!customName.trim()} className="w-full py-3 rounded-xl bg-purple-600 text-white font-bold text-sm flex items-center justify-center gap-2 active:scale-[0.98] transition-all disabled:opacity-40">
                                    <Check size={14} />
                                    {editingDishId ? 'Save Changes' : 'Create Dish'}
                                </button>
                            </div>
                        ) : (
                            <div>
                                <div className="flex items-center justify-between mb-3">
                                    <p className="text-xs font-black uppercase tracking-widest text-purple-600">My Dishes ({customDishes.length})</p>
                                    <button onClick={() => { resetCustomForm(); setShowCustomForm(true); }} className="px-3 py-1.5 rounded-xl bg-purple-600 text-white text-[10px] font-black uppercase tracking-widest flex items-center gap-1">
                                        <Plus size={12} /> New
                                    </button>
                                </div>
                                {customDishes.length === 0 ? (
                                    <p className="text-xs text-gray-400 text-center py-6">No custom dishes yet. Create your own recipes!</p>
                                ) : (
                                    <div className="space-y-2">
                                        {customDishes.map(dish => (
                                            <div key={dish.id} className="flex items-center gap-3 p-3 rounded-xl bg-white border border-purple-100">
                                                {dish.icon?.startsWith('data:') ? (
                                                    <img src={dish.icon} alt="" className="w-10 h-10 rounded-lg object-cover" />
                                                ) : (
                                                    <div className="w-10 h-10 rounded-lg bg-purple-100 flex items-center justify-center text-lg">🍽️</div>
                                                )}
                                                <div className="flex-1 min-w-0">
                                                    <p className="text-sm font-bold text-gray-900 truncate">{dish.name}</p>
                                                    <p className="text-[10px] text-gray-400">{dish.type} · {dish.category[0]} · {dish.variants[0]?.ingredients?.length || 0} ingredients</p>
                                                </div>
                                                <div className="flex items-center gap-1">
                                                    <button onClick={() => handleEditCustom(dish)} className="w-8 h-8 rounded-lg flex items-center justify-center text-gray-400 hover:text-purple-600 hover:bg-purple-50 active:scale-90" title="Edit"><Edit3 size={14} /></button>
                                                    <button onClick={() => handleDeleteCustom(dish)} className="w-8 h-8 rounded-lg flex items-center justify-center text-gray-400 hover:text-red-600 hover:bg-red-50 active:scale-90" title="Delete"><Trash2 size={14} /></button>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                        )}
                    </div>
                </section>

                <section>
                    <h4 className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-3">Settings</h4>
                    <div className="space-y-3">
                        <div className="w-full p-5 rounded-[22px] bg-gray-50 flex items-center justify-between">
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
                                                <p className="text-[9px] text-amber-600 ml-3">{loopStatus.skipBadge}</p>
                                            )}
                                        </div>
                                    ) : (
                                        <p className="text-[11px] text-gray-400">Auto-rotate dishes across your plan</p>
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
                            </div>
                        </div>

                        {/* FIX 9: Loop analytics — shows user progress */}
                        {mealLoop.config && mealLoop.analytics.mealsAutoFilled > 0 && (
                            <div className="w-full p-5 rounded-[22px] bg-blue-50 border border-blue-200">
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
                                        <p className="text-[9px] font-bold text-blue-500 uppercase">Cycles</p>
                                    </div>
                                    <div className="text-center">
                                        <p className="text-lg font-black text-blue-700">{mealLoop.analytics.mealsAutoFilled}</p>
                                        <p className="text-[9px] font-bold text-blue-500 uppercase">Meals Filled</p>
                                    </div>
                                    <div className="text-center">
                                        <p className="text-lg font-black text-blue-700">{mealLoop.analytics.dishesSkipped}</p>
                                        <p className="text-[9px] font-bold text-blue-500 uppercase">Skipped</p>
                                    </div>
                                </div>
                            </div>
                        )}

                        <div className="w-full p-5 rounded-[22px] bg-gray-50 flex items-center justify-between">
                            <div className="flex items-center gap-4">
                                <div className="w-11 h-11 bg-white rounded-2xl flex items-center justify-center shadow-sm">
                                    {notifications ? <Bell size={18} className="text-violet-500" /> : <BellOff size={18} className="text-gray-400" />}
                                </div>
                                <div>
                                    <p className="text-xs font-black text-gray-900">Notifications</p>
                                    <p className="text-[11px] text-gray-400">{notifications ? 'Daily meal reminders' : 'Off'}</p>
                                </div>
                            </div>
                            <button onClick={() => setNotifications(state => !state)}
                                className={`w-12 h-6 rounded-full transition-all duration-300 relative ${notifications ? 'bg-violet-500' : 'bg-gray-200'}`}>
                                <div className={`w-5 h-5 bg-white rounded-full shadow absolute top-0.5 transition-all duration-300 ${notifications ? 'left-6' : 'left-0.5'}`} />
                            </button>
                        </div>
                    </div>
                </section>

                <section>
                    <button onClick={onLogout}
                        className="w-full p-5 rounded-[22px] bg-red-50 text-red-500 flex items-center justify-center gap-3 font-bold active:scale-95 transition-all">
                        <LogOut size={18} />Logout
                    </button>
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

        </div>
    );
};

export default React.memo(Profile);
