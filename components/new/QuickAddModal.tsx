import React, { useMemo, useState, useCallback, useRef } from 'react';
import type { Dish, DishVariant, Category, Region } from '../../constants/dishLibrary';
import { X, Search, Plus, Sparkles, Clock, Check, ChevronLeft, Edit3, Trash2, Loader2 } from 'lucide-react';
import { useStore } from '../../store/useStore';
import { useTrayStore } from '../../store/useTrayStore';
import { useLockBodyScroll } from '../../hooks/useLockBodyScroll';
import { useBackButtonClose } from '../../hooks/useBackButtonClose';
import DishImage from './DishImage';
import { HealthScoreBadge } from '../health/HealthScoreBadge';
import { HealthFilterBar } from '../health/HealthFilterBar';
import { rankDishes, getRegionKey, getDishVariants, DIET_FILTER } from '../../utils/dishSearch';
import { useDebounce } from '../../hooks/useDebounce';
import { filterDishesByHealth, sortDishesByHealth, getFilterPreset } from '../../utils/healthSortFilter';
import type { HealthSortKey, HealthFilterPreset } from '../../utils/healthSortFilter';
import { VirtualList } from './VirtualList';

const CUSTOM_STYLES = ['Gravy', 'Dry', 'Fried', 'Roasted', 'Raw', 'Steamed', 'Grilled', 'Curry', 'Soup', 'Bread'];
const CUSTOM_TAGS = ['healthy', 'high-protein', 'fiber', 'low-calorie', 'indulgent', 'probiotic', 'antioxidant', 'vitamins', 'iron', 'calcium'];

const uid = () => Math.random().toString(36).substring(2, 10);
let customDishCounter = 0;

type Slot = 'Breakfast' | 'Lunch' | 'Snacks' | 'Dinner';

const SLOT_HEADER: Record<Slot, { icon: string; title: string; subtitle: string }> = {
    Breakfast: { icon: '🌅', title: 'Subah ka naashta?', subtitle: 'Quick picks for morning' },
    Lunch: { icon: '☀️', title: 'Dopahar ka khaana?', subtitle: 'Thali time' },
    Snacks: { icon: '🥜', title: 'Chai ke saath?', subtitle: 'Evening bites' },
    Dinner: { icon: '🌙', title: 'Raat ka khana?', subtitle: 'Light & easy' },
};

interface QuickAddModalProps {
    isOpen: boolean;
    onClose: () => void;
    slot: Slot;
    date: string;
    dishes: Dish[];
    userRegion: string;
    userDiet: string;
    onAddMeal: (date: string, slot: string, dish: Dish, variant: DishVariant) => void;
    selectedDishIds?: string[];
}

const QuickAddModal: React.FC<QuickAddModalProps> = ({
    isOpen,
    onClose,
    slot,
    date,
    dishes,
    userRegion,
    userDiet,
    onAddMeal,
    selectedDishIds = [],
}) => {
    useLockBodyScroll(isOpen);
    useBackButtonClose(isOpen, onClose);
    const addCustomDish = useStore(s => s.addCustomDish);
    const updateCustomDish = useStore(s => s.updateCustomDish);
    const removeCustomDish = useStore(s => s.removeCustomDish);
    const customDishes = useStore(s => s.customDishes);
    const allDishes = useMemo(() => [...dishes, ...customDishes], [dishes, customDishes]);

    const [search, setSearch] = useState('');
    const debouncedSearch = useDebounce(search, 200);
    const [selectedDish, setSelectedDish] = useState<Dish | null>(null);
    const [showGlobal, setShowGlobal] = useState(false);
    const [healthPreset, setHealthPreset] = useState<HealthFilterPreset | null>(null);
    const [healthSort, setHealthSort] = useState<HealthSortKey | null>(null);
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
    const regionKey = getRegionKey(userRegion);

    // Filter and rank dishes
    const rankedDishes = useMemo(() => rankDishes({
        dishes: allDishes,
        slot,
        diet: userDiet,
        regionKey,
        query: debouncedSearch,
        showGlobal,
        healthPreset,
        healthSort,
        selectedDishIds,
    }), [allDishes, slot, userDiet, regionKey, debouncedSearch, showGlobal, healthPreset, healthSort, selectedDishIds]);

    // Variants for selected dish
    const dishVariants = useMemo(() => {
        if (!selectedDish) return [];
        return getDishVariants(selectedDish, slot, userDiet);
    }, [selectedDish, slot, userDiet]);

    const handleClose = useCallback(() => {
        setSelectedDish(null);
        setSearch('');
        setShowGlobal(false);
        setShowCustomForm(false);
        setEditingDishId(null);
        setCustomName('');
        setCustomIngredients([]);
        setCustomImageDataUrl('');
        setIngredientName('');
        setIngredientQty('');
        setIngredientUnit('g');
        onClose();
    }, [onClose]);

    const handleSelectDish = useCallback((dish: Dish) => {
        const variants = getDishVariants(dish, slot, userDiet);
        if (variants.length <= 1) {
            const variant = variants[0] || dish.variants[0];
            if (variant) {
                onAddMeal(date, slot, dish, variant);
                handleClose();
            }
        } else {
            setSelectedDish(dish);
        }
    }, [onAddMeal, date, slot, userDiet, handleClose]);

    const handleSelectVariant = (variant: DishVariant) => {
        if (import.meta.env.DEV) {
            console.log('[QuickAddModal:handleSelectVariant] selectedDish.id:', selectedDish?.id, 'selectedDish.name:', selectedDish?.name, 'variant.name:', variant.name);
        }
        if (selectedDish) {
            onAddMeal(date, slot, selectedDish, variant);
            handleClose();
        }
    };

    const handleCreateCustom = useCallback(() => {
        if (!customName.trim()) return;
        const ings = customIngredients.map(i => ({
            name: i.name,
            quantity: i.quantity,
            unit: i.unit,
            category: 'produce' as const,
        }));
        if (editingDishId) {
            const updated: Partial<Dish> = {
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
                    mealContext: '' as Category | undefined,
                    ingredients: ings,
                }],
            };
            updateCustomDish(editingDishId, updated);
            window.dispatchEvent(new Event('pantry:invalidate'));
            setShowCustomForm(false);
            setEditingDishId(null);
            setCustomName('');
            setCustomIngredients([]);
            setCustomImageDataUrl('');
            handleClose();
            return;
        }
        customDishCounter++;
        const id = `custom-${uid()}-${customDishCounter}`;
        const customDish: Dish = {
            id,
            name: customName.trim(),
            icon: customImageDataUrl || '🍽️',
            type: customDiet,
            region: userRegion as Region,
            category: [customStyle.toLowerCase() as Category],
            states: [userRegion as Region],
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
            weight: 'medium',
            nutrition: [],
        };
        addCustomDish(customDish);
        const variant = customDish.variants[0];
        if (variant) onAddMeal(date, slot, customDish, variant);
        window.dispatchEvent(new Event('pantry:invalidate'));
        handleClose();
    }, [customName, customStyle, customTags, customDiet, customIngredients, customImageDataUrl, editingDishId, userRegion, date, slot, onAddMeal, addCustomDish, updateCustomDish, handleClose]);

    const handleEditCustom = useCallback((dish: Dish) => {
        setCustomName(dish.name);
        const cat = dish.category[0];
        setCustomStyle(cat ? cat.charAt(0).toUpperCase() + cat.slice(1) : 'Gravy');
        setCustomTags(dish.tags.filter(t => t !== 'user_created'));
        setCustomDiet((dish.type === 'eggitarian' ? 'veg' : dish.type) as 'veg' | 'non-veg' | 'vegan');
        setEditingDishId(dish.id);
        setCustomIngredients(
            (dish.variants[0]?.ingredients || []).map(i => ({
                name: i.name,
                quantity: i.quantity,
                unit: i.unit,
            }))
        );
        setCustomImageDataUrl(dish.icon?.startsWith('data:') ? dish.icon : '');
        setShowCustomForm(true);
    }, []);

    const handleDeleteCustom = useCallback((dish: Dish) => {
        if (window.confirm(`Delete "${dish.name}"? This removes it from your tray and meal plan.`)) {
            removeCustomDish(dish.id);
            const store = useStore.getState();
            const trayStore = useTrayStore.getState();
            for (const s of ['breakfast', 'lunch', 'snacks', 'dinner'] as const) {
                const existing = store.trayLibrary[s];
                if (existing.some(m => m.id === dish.id || m.dishId === dish.id)) {
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
            const ml = useTrayStore.getState().mealLoop;
            useTrayStore.setState({
                mealLoop: {
                    ...ml,
                    rotationQueue: ml.rotationQueue.filter(item => item.dishId !== dish.id),
                }
            });
            window.dispatchEvent(new Event('pantry:invalidate'));
        }
    }, [removeCustomDish]);

    const toggleCustomTag = (tag: string) => {
        setCustomTags(prev =>
            prev.includes(tag) ? prev.filter(t => t !== tag) : [...prev, tag]
        );
    };

    // Stable items array for VirtualList + stable renderItem callback
    const visibleItems = useMemo(() => rankedDishes.slice(0, 20), [rankedDishes]);
    const renderDishRow = useCallback((item: { dish: Dish; healthScore: number }, index: number) => {
        const { dish, healthScore } = item;
        const isRegional = dish.region.toLowerCase().includes(regionKey);
        const isCustom = dish.tags?.includes('user_created');
        return (
            <div className="w-full flex items-center gap-0 p-0 rounded-xl border transition-all bg-gray-50 border-gray-100">
                <button onClick={() => handleSelectDish(dish)} className="flex-1 flex items-center gap-3 p-3 text-left">
                    <DishImage name={dish.name} slot={slot} size="sm" customImageUrl={isCustom && dish.icon?.startsWith('data:') ? dish.icon : undefined} />
                    <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                            <span className="text-sm font-bold block leading-tight truncate text-gray-800">{dish.name}</span>
                            <HealthScoreBadge score={healthScore ?? 0} size="sm" />
                            {isCustom && (
                                <span className="text-[8px] font-black uppercase tracking-widest px-1.5 py-0.5 rounded bg-purple-100 text-purple-700 border border-purple-200">Custom</span>
                            )}
                        </div>
                        <div className="flex items-center gap-2 mt-0.5">
                            <span className="text-[9px] font-medium capitalize text-gray-400">{dish.region}</span>
                        </div>
                    </div>
                    {isRegional && (
                        <span className="text-[8px] font-black uppercase tracking-widest bg-[#FF385C] text-white px-1.5 py-0.5 rounded flex-shrink-0">Local</span>
                    )}
                </button>
                <div className="flex items-center gap-1 pr-2 shrink-0">
                    {isCustom ? (
                        <>
                            <button onClick={() => handleEditCustom(dish)} className="w-7 h-7 rounded-lg flex items-center justify-center text-gray-400 hover:text-purple-600 hover:bg-purple-50 active:scale-90" title="Edit custom dish"><Edit3 size={12} /></button>
                            <button onClick={() => handleDeleteCustom(dish)} className="w-7 h-7 rounded-lg flex items-center justify-center text-gray-400 hover:text-red-600 hover:bg-red-50 active:scale-90" title="Delete custom dish"><Trash2 size={12} /></button>
                        </>
                    ) : (
                        <Plus size={14} className="text-gray-400" />
                    )}
                </div>
            </div>
        );
    }, [handleSelectDish, handleEditCustom, handleDeleteCustom, regionKey, slot]);

    if (!isOpen) return null;

    return (
        <div
            className="fixed inset-0 z-[60] bg-black/50 flex items-end justify-center"
            onClick={handleClose}
            role="dialog"
            aria-modal="true"
            aria-label={`Add meal to ${slot}`}
        >
            <div
                className="w-full max-w-lg rounded-t-3xl flex flex-col max-h-[85vh] animate-in slide-in-from-bottom duration-300 bg-white pb-16"
                onClick={e => e.stopPropagation()}
            >
                {/* Header */}
                <div className={`px-6 pt-5 pb-4 border-b border-gray-100`}>
                    <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center gap-3">
                            {selectedDish && (
                                <button
                                    onClick={() => setSelectedDish(null)}
                                    className={`w-8 h-8 rounded-xl flex items-center justify-center bg-gray-100`}
                                    aria-label="Back to dishes"
                                >
                                    <ChevronLeft size={16} className="text-gray-700" />
                                </button>
                            )}
                            <div>
                                <h3 className={`text-lg font-black text-gray-900`}>
                                    {selectedDish ? selectedDish.name : SLOT_HEADER[slot].title}
                                </h3>
                                {!selectedDish && (
                                    <p className={`text-xs text-gray-500`}>
                                        {SLOT_HEADER[slot].subtitle}
                                    </p>
                                )}
                            </div>
                        </div>
                        <button
                            onClick={handleClose}
                            className={`w-8 h-8 rounded-xl flex items-center justify-center bg-gray-100 text-gray-500`}
                            aria-label="Close"
                        >
                            <X size={16} />
                        </button>
                    </div>

                    {/* Search */}
                    {!selectedDish && (
                        <div className="relative">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={14} />
                            <input
                                type="text"
                                placeholder="Search dishes..."
                                value={search}
                                onChange={e => setSearch(e.target.value)}
                                className="w-full rounded-xl py-2.5 pl-10 pr-8 text-sm font-medium focus:ring-2 focus:ring-[#FF385C] border-none outline-none bg-gray-50 text-gray-900 placeholder:text-gray-400"
                                autoFocus
                            />
                            {search && (
                                <button onClick={() => setSearch('')} className="absolute right-3 top-1/2 -translate-y-1/2">
                                    <X size={12} className="text-gray-400" />
                                </button>
                            )}
                        </div>
                    )}
                </div>

                {/* Content */}
                <div className="flex-1 flex flex-col min-h-0 px-6 py-4">
                    {!selectedDish ? (
                        <>
                            {/* Health filters */}
                            <div className="mb-4 flex-shrink-0">
                                <HealthFilterBar
                                    activePreset={healthPreset}
                                    activeSort={healthSort}
                                    onPresetChange={setHealthPreset}
                                    onSortChange={setHealthSort}
                                />
                            </div>

                            {/* Region toggle */}
                            <div className="flex items-center justify-between mb-4 flex-shrink-0">
                                <button
                                    onClick={() => setShowGlobal(!showGlobal)}
                                    className="text-xs font-bold text-[#FF385C]"
                                >
                                    {showGlobal ? '← Regional first' : 'All regions →'}
                                </button>
                                <span className="text-[10px] font-bold text-gray-400">
                                    {rankedDishes.length} dishes
                                </span>
                            </div>

                            {/* Dish List — virtualized */}
                            <div className="flex-1 min-h-0">
                                <VirtualList
                                    items={visibleItems}
                                    estimateSize={80}
                                    overscan={3}
                                    outerClassName="h-full"
                                    renderItem={renderDishRow}
                                />
                            </div>

                            {rankedDishes.length === 0 && !showCustomForm && (
                                <div className="text-center py-12">
                                    <p className={`text-sm font-bold text-gray-500`}>No dishes found</p>
                                    <p className="text-xs mt-1 text-gray-400">Try clearing search or toggling regions</p>
                                    {search && (
                                        <button
                                            onClick={() => { setCustomName(search); setShowCustomForm(true); }}
                                            className="mt-4 px-5 py-3 rounded-xl bg-[#FF385C] text-white font-bold text-sm flex items-center gap-2 mx-auto active:scale-[0.98] transition-all"
                                        >
                                            <Plus size={14} />
                                            Create "{search}" as custom dish
                                        </button>
                                    )}
                                </div>
                            )}

                            {/* Custom dish creation form */}
                            {showCustomForm && (
                                <div className="space-y-4">
                                    <button onClick={() => { setShowCustomForm(false); setEditingDishId(null); setCustomName(''); setCustomIngredients([]); setCustomImageDataUrl(''); }} className="text-xs font-bold text-gray-500 flex items-center gap-1 active:opacity-60">
                                        <X size={12} /> Back
                                    </button>
                                    <div className="p-5 rounded-2xl border-2 border-[#FF385C]/20 bg-white space-y-4">
                                        <p className="text-xs font-black uppercase tracking-widest text-[#FF385C]">{editingDishId ? 'Edit Custom Dish' : 'Create Custom Dish'}</p>
                                        <div>
                                            <label className="text-[9px] font-bold text-gray-500 block mb-1">Name</label>
                                            <input type="text" value={customName} onChange={e => setCustomName(e.target.value)} className="w-full rounded-xl py-2.5 px-3 text-sm font-medium border border-gray-200 bg-gray-50 text-gray-900" placeholder="Dish name" />
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
                                                    <button key={t} onClick={() => toggleCustomTag(t)} className={`px-3 py-1.5 rounded-lg text-[10px] font-bold border transition-all ${customTags.includes(t) ? 'bg-emerald-500 text-white border-emerald-500' : 'bg-white text-gray-600 border-gray-200'}`}>{t}</button>
                                                ))}
                                            </div>
                                        </div>
                                        <div>
                                            <label className="text-[9px] font-bold text-gray-500 block mb-1">Picture</label>
                                            <div className="flex items-center gap-3">
                                                {customImageDataUrl ? (
                                                    <div className="relative">
                                                        <img src={customImageDataUrl} alt="Dish" className="w-16 h-16 rounded-xl object-cover border border-gray-200" />
                                                        <button onClick={() => setCustomImageDataUrl('')} className="absolute -top-1.5 -right-1.5 w-5 h-5 bg-red-500 text-white rounded-full flex items-center justify-center" title="Remove picture"><X size={10} /></button>
                                                    </div>
                                                ) : (
                                                    <div className="w-16 h-16 rounded-xl bg-gray-100 flex items-center justify-center text-2xl">🍽️</div>
                                                )}
                                                <label className="px-3 py-2 rounded-xl border border-gray-200 text-xs font-bold text-gray-600 cursor-pointer active:scale-[0.98] transition-all hover:border-gray-300">
                                                    <input type="file" accept="image/*" className="hidden" onChange={e => { const f = e.target.files?.[0]; if (f) { const r = new FileReader(); r.onload = () => setCustomImageDataUrl(r.result as string); r.readAsDataURL(f); } }} />
                                                    {customImageDataUrl ? 'Change' : 'Upload'}
                                                </label>
                                            </div>
                                        </div>
                                        <div>
                                            <label className="text-[9px] font-bold text-gray-500 block mb-1">Ingredients</label>
                                            <div className="flex gap-1.5 mb-2">
                                                <input type="text" value={ingredientName} onChange={e => setIngredientName(e.target.value)} className="flex-1 rounded-lg py-1.5 px-2.5 text-xs font-medium border border-gray-200 bg-gray-50 text-gray-900" placeholder="Ingredient name" />
                                                <input type="text" value={ingredientQty} onChange={e => setIngredientQty(e.target.value)} className="w-16 rounded-lg py-1.5 px-2 text-xs font-medium border border-gray-200 bg-gray-50 text-gray-900" placeholder="Qty" />
                                                <select value={ingredientUnit} onChange={e => setIngredientUnit(e.target.value)} className="w-16 rounded-lg py-1.5 px-1 text-xs font-medium border border-gray-200 bg-gray-50 text-gray-600">
                                                    <option value="g">g</option>
                                                    <option value="kg">kg</option>
                                                    <option value="ml">ml</option>
                                                    <option value="pc">pc</option>
                                                    <option value="tbsp">tbsp</option>
                                                    <option value="tsp">tsp</option>
                                                    <option value="cup">cup</option>
                                                </select>
                                                <button
                                                    onClick={() => {
                                                        if (!ingredientName.trim() || !ingredientQty.trim()) return;
                                                        setCustomIngredients(prev => [...prev, { name: ingredientName.trim(), quantity: parseFloat(ingredientQty) || 0, unit: ingredientUnit }]);
                                                        setIngredientName('');
                                                        setIngredientQty('');
                                                        setIngredientUnit('g');
                                                    }}
                                                    className="px-2.5 py-1.5 rounded-lg bg-gray-900 text-white text-xs font-bold active:scale-90"
                                                >
                                                    <Plus size={14} />
                                                </button>
                                            </div>
                                            {customIngredients.length > 0 && (
                                                <div className="flex flex-wrap gap-1.5">
                                                    {customIngredients.map((ing, idx) => (
                                                        <div key={idx} className="flex items-center gap-1 px-2 py-1 rounded-lg bg-gray-100 text-[10px] font-medium text-gray-700">
                                                            <span>{ing.name}</span>
                                                            <span className="text-gray-400">{ing.quantity}{ing.unit}</span>
                                                            <button onClick={() => setCustomIngredients(prev => prev.filter((_, i) => i !== idx))} className="text-gray-400 hover:text-red-500"><X size={10} /></button>
                                                        </div>
                                                    ))}
                                                </div>
                                            )}
                                        </div>
                                        <button
                                            onClick={handleCreateCustom}
                                            disabled={!customName.trim()}
                                            className="w-full py-3 rounded-xl bg-[#FF385C] text-white font-bold text-sm flex items-center justify-center gap-2 active:scale-[0.98] transition-all disabled:opacity-40"
                                        >
                                            <Check size={14} />
                                            {editingDishId ? 'Save Changes' : 'Add to Tray'}
                                        </button>
                                    </div>
                                </div>
                            )}
                        </>
                    ) : (
                        /* Variant Selection */
                        <div className="space-y-2">
                            {dishVariants.length === 0 ? (
                                <p className={`text-sm text-center py-8 text-gray-500`}>No variants available</p>
                            ) : (
                                dishVariants.map(variant => (
                                    <button
                                        key={variant.id}
                                        onClick={() => handleSelectVariant(variant)}
                                        className="w-full flex items-center gap-3 p-3 rounded-xl border transition-all active:scale-[0.98] text-left bg-gray-50 border-gray-100">
                                        <DishImage name={selectedDish.name} slot={slot} size="sm" customImageUrl={selectedDish.icon?.startsWith('data:') ? selectedDish.icon : undefined} />
                                        <div className="flex-1 min-w-0">
                                            <span className="text-sm font-bold block leading-tight truncate text-gray-800">
                                                {variant.name}
                                            </span>
                                            <div className="flex items-center gap-2 mt-0.5">
                                                {variant.addOn && (
                                                    <span className="text-[9px] font-medium text-gray-400">
                                                        {variant.addOn}
                                                    </span>
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
                    )}
                </div>

                {/* Bottom safe area */}
                <div className={`h-6 bg-white`} />
            </div>
        </div>
    );
};

export default React.memo(QuickAddModal);
