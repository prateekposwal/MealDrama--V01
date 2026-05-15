import React, { useState, useMemo, useCallback } from 'react';
import { Search, X, TrendingUp, MapPin, Globe, AlertTriangle, WifiOff, Sparkles, Plus, Check, Edit3, Trash2 } from 'lucide-react';
import { useStore, MealOption } from '../../store/useStore';
import { useTrayStore } from '../../store/useTrayStore';
import { useMealSearch } from '../../hooks/useMealSearch';
import { DISH_LIBRARY, type Dish, type DishVariant } from '../../constants/dishLibrary';
import { HealthFilterBar } from '../health/HealthFilterBar';
import { HealthScoreBadge } from '../health/HealthScoreBadge';
import { scoreDish } from '../../utils/nutritionScore';
import { filterDishesByHealth, sortDishesByHealth, getFilterPreset } from '../../utils/healthSortFilter';
import type { HealthSortKey, HealthFilterPreset } from '../../utils/healthSortFilter';

interface MealSearchProps {
    onClose: () => void;
    onSelect?: (dish: any, variant: any) => void;
}

const DIET_BADGE: Record<string, { label: string; color: string; bg: string }> = {
    'veg': { label: 'Veg', color: 'text-green-700', bg: 'bg-green-50 border-green-200' },
    'non-veg': { label: 'Non-Veg', color: 'text-red-700', bg: 'bg-red-50 border-red-200' },
    'eggitarian': { label: 'Egg', color: 'text-amber-700', bg: 'bg-amber-50 border-amber-200' },
    'vegan': { label: 'Vegan', color: 'text-emerald-700', bg: 'bg-emerald-50 border-emerald-200' },
};

const CUSTOM_STYLES = ['Gravy', 'Dry', 'Fried', 'Roasted', 'Raw', 'Steamed', 'Grilled', 'Curry', 'Soup', 'Bread'];
const CUSTOM_TAGS = ['healthy', 'high-protein', 'fiber', 'low-calorie', 'indulgent', 'probiotic', 'antioxidant', 'vitamins', 'iron', 'calcium'];
const CUSTOM_SLOTS = ['breakfast', 'lunch', 'snacks', 'dinner'];

const uid = () => Math.random().toString(36).substring(2, 10);

let customDishCounter = 0;

const MealSearch: React.FC<MealSearchProps> = ({ onClose, onSelect }) => {
    const { user, addCustomDish, updateCustomDish, removeCustomDish } = useStore();
    const basePool = useStore(state => (state.dishes && state.dishes.length > 0) ? state.dishes : DISH_LIBRARY);
    const customDishes = useStore(state => state.customDishes);
    const pool = useMemo(() => [...basePool, ...customDishes], [basePool, customDishes]);

    const {
        query, setQuery, results, isSearching, isOffline,
        highlightedIndex, searchCount, inputRef, handleKeyDown,
    } = useMealSearch({
        dishes: pool,
        userRegion: user?.region ?? '',
        userDiet: user?.diet ?? 'veg',
    });

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

    const trending = React.useMemo(() => {
        const regionKey = (user?.region ?? '').toLowerCase();
        let items = pool
            .filter(d => d.region.toLowerCase().includes(regionKey) || regionKey === '')
            .sort(() => Math.random() - 0.5)
            .slice(0, 20);
        if (healthPreset) items = filterDishesByHealth(items, getFilterPreset(healthPreset));
        if (healthSort) items = sortDishesByHealth(items, healthSort);
        return items.slice(0, 5);
    }, [pool, user?.region, healthPreset, healthSort]);

    const scoredResults = useMemo(() => {
        let items = results.map(r => ({ ...r, healthScore: scoreDish(r.dish) }));
        if (healthPreset) {
            items = items.filter(r => {
                const filtered = filterDishesByHealth([r.dish], getFilterPreset(healthPreset));
                return filtered.length > 0;
            });
        }
        if (healthSort) {
            const sortedIds = sortDishesByHealth(items.map(r => r.dish), healthSort).map(d => d.id);
            items.sort((a, b) => sortedIds.indexOf(a.dish.id) - sortedIds.indexOf(b.dish.id));
        }
        return items;
    }, [results, healthPreset, healthSort]);

    const handleSelect = (dish: any, variant: any) => {
        onSelect?.(dish, variant);
        onClose();
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
                category: [customStyle.toLowerCase()],
                tags: [...customTags, 'user_created'],
                icon: customImageDataUrl || '🍽️',
                variants: [{
                    id: `v-${editingDishId}`,
                    name: customName.trim(),
                    addOn: '',
                    tags: [...customTags, 'user_created'],
                    healthCategories: customTags,
                    mealContext: '',
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
            onClose();
            return;
        }
        customDishCounter++;
        const id = `custom-${uid()}-${customDishCounter}`;
        const customDish: Dish = {
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
        };
        addCustomDish(customDish);
        window.dispatchEvent(new Event('pantry:invalidate'));
        onSelect?.(customDish, customDish.variants[0]);
        onClose();
    }, [customName, customStyle, customTags, customDiet, customIngredients, customImageDataUrl, editingDishId, user?.region, addCustomDish, updateCustomDish, onSelect, onClose]);

    const handleEditCustom = (dish: Dish) => {
        setCustomName(dish.name);
        setCustomStyle(dish.category[0]?.charAt(0).toUpperCase() + dish.category[0]?.slice(1) || 'Gravy');
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
    };

    const handleDeleteCustom = (dish: Dish) => {
        if (window.confirm(`Delete "${dish.name}"? This removes it from your tray and meal plan.`)) {
            removeCustomDish(dish.id);
            const store = useStore.getState();
            const trayStore = useTrayStore.getState();
            for (const slot of ['breakfast', 'lunch', 'snacks', 'dinner'] as const) {
                const existing = store.trayLibrary[slot];
                if (existing.some(m => m.id === dish.id || m.dishId === dish.id)) {
                    store.removeFromTray(slot, dish.id);
                }
            }
            for (const date of Object.keys(trayStore.plan.days)) {
                for (const mealType of ['breakfast', 'lunch', 'snacks', 'dinner'] as const) {
                    const meals = trayStore.plan.days[date]?.[mealType];
                    if (meals) {
                        for (const meal of meals) {
                            if (meal.meal_id === dish.id || meal.id === dish.id) {
                                trayStore.removeMealFromSlot(date, mealType, meal.id);
                            }
                        }
                    }
                }
            }
            window.dispatchEvent(new Event('pantry:invalidate'));
        }
    };

    const toggleCustomTag = (tag: string) => {
        setCustomTags(prev =>
            prev.includes(tag) ? prev.filter(t => t !== tag) : [...prev, tag]
        );
    };

    return (
        <div
            className="fixed inset-0 bg-white z-50 flex flex-col animate-in fade-in slide-in-from-bottom-8 duration-300"
            role="dialog"
            aria-modal="true"
            aria-label="Search meals"
        >
            <header className="p-4 flex items-center gap-4 border-b border-gray-100">
                <div className="flex-1 relative">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
                    <input
                        ref={inputRef}
                        autoFocus
                        type="text"
                        placeholder="Search regional dishes..."
                        role="combobox"
                        aria-expanded={results.length > 0}
                        aria-haspopup="listbox"
                        aria-activedescendant={highlightedIndex >= 0 ? `search-result-${highlightedIndex}` : undefined}
                        aria-label="Search for a meal"
                        className="w-full bg-gray-50 border-none rounded-2xl py-4 pl-12 pr-4 font-medium focus:ring-2 focus:ring-[#FF385C]"
                        value={query}
                        onChange={(e) => setQuery(e.target.value)}
                        onKeyDown={handleKeyDown}
                    />
                    {isSearching && (
                        <div className="absolute right-4 top-1/2 -translate-y-1/2">
                            <div className="w-4 h-4 border-2 border-gray-300 border-t-[#FF385C] rounded-full animate-spin" />
                        </div>
                    )}
                </div>
                <button onClick={onClose} className="p-3 hover:bg-gray-100 rounded-full" aria-label="Close search">
                    <X size={24} className="text-gray-900" />
                </button>
            </header>

            <div className="flex-1 overflow-y-auto p-6" role="listbox" aria-label="Search results">
                {/* Offline banner */}
                {isOffline && (
                    <div className="mb-4 p-3 bg-amber-50 border border-amber-200 rounded-2xl flex items-center gap-2">
                        <WifiOff size={16} className="text-amber-600" />
                        <span className="text-xs font-bold text-amber-700">Offline — showing cached results</span>
                    </div>
                )}

                {/* Health filters */}
                <div className="mb-4">
                    <HealthFilterBar
                        activePreset={healthPreset}
                        activeSort={healthSort}
                        onPresetChange={setHealthPreset}
                        onSortChange={setHealthSort}
                    />
                </div>

                {/* User preference info */}
                {user?.diet && query.length > 0 && (
                    <div className="mb-3 flex items-center gap-2 px-3 py-1.5 bg-gray-50 rounded-full inline-flex">
                        <span className="text-[10px] font-black uppercase tracking-widest text-gray-500">
                            Filtered: {user.diet}
                        </span>
                        <Globe size={10} className="text-gray-400" />
                    </div>
                )}

                {/* Query results */}
                {query && scoredResults.length > 0 && (
                    <section className="mb-8">
                        <div className="flex items-center justify-between mb-4">
                            <p className="text-[10px] font-black uppercase tracking-widest text-gray-400">
                                {scoredResults.length} result{scoredResults.length !== 1 ? 's' : ''} for "{query}"
                            </p>
                        </div>
                        <div className="space-y-2">
                            {scoredResults.map((r, idx) => {
                                const badge = DIET_BADGE[r.dish.type] || DIET_BADGE['veg'];
                                const isHighlighted = idx === highlightedIndex;
                                const conflictsWithDiet = !r.matchesDiet;
                                const isCustom = r.dish.tags?.includes('user_created');

                                return (
                                    <div
                                        key={`${r.dish.id}-${r.variant.id}`}
                                        className={`relative flex items-center justify-between rounded-2xl border transition-all group text-left ${
                                            isHighlighted
                                                ? 'bg-[#FF385C]/10 border-[#FF385C] shadow-sm'
                                                : 'bg-white border-gray-100 hover:border-[#FF385C]/30'
                                        } ${conflictsWithDiet ? 'opacity-80' : ''}`}
                                    >
                                        <button
                                            id={`search-result-${idx}`}
                                            role="option"
                                            aria-selected={isHighlighted}
                                            onClick={() => handleSelect(r.dish, r.variant)}
                                            className="flex-1 p-4 flex items-center gap-3"
                                        >
                                            {r.dish.icon?.startsWith('data:') ? (
                                                <img src={r.dish.icon} alt="" className="w-8 h-8 rounded-lg object-cover" />
                                            ) : (
                                                <span className="text-2xl">{r.dish.icon}</span>
                                            )}
                                            <div>
                                                <div className="flex items-center gap-2">
                                                    <span className="font-bold text-gray-900 text-sm block">
                                                        {r.variant.name}
                                                    </span>
                                                    <HealthScoreBadge score={r.healthScore} size="sm" />
                                                    {isCustom && (
                                                        <span className="text-[8px] font-black uppercase tracking-widest px-1.5 py-0.5 rounded bg-purple-100 text-purple-700 border border-purple-200">
                                                            Custom
                                                        </span>
                                                    )}
                                                </div>
                                                <span className="text-[10px] text-gray-400 font-bold capitalize">
                                                    {r.dish.region} India
                                                </span>
                                                {conflictsWithDiet && (
                                                    <span className={`text-[9px] font-black uppercase tracking-widest px-1.5 py-0.5 rounded mt-0.5 inline-flex items-center gap-1 border ${badge.bg} ${badge.color}`}>
                                                        <AlertTriangle size={8} />
                                                        {badge.label}
                                                    </span>
                                                )}
                                            </div>
                                        </button>
                                        <div className="flex items-center gap-1 pr-3 shrink-0">
                                            {r.confidence < 1.0 && !isCustom && (
                                                <span className="text-[8px] text-gray-400 font-bold mr-1">
                                                    {Math.round(r.confidence * 100)}%
                                                </span>
                                            )}
                                            {isCustom && (
                                                <>
                                                    <button
                                                        onClick={() => handleEditCustom(r.dish)}
                                                        className="w-8 h-8 rounded-lg flex items-center justify-center text-gray-400 hover:text-purple-600 hover:bg-purple-50 active:scale-90"
                                                        title="Edit custom dish"
                                                    >
                                                        <Edit3 size={14} />
                                                    </button>
                                                    <button
                                                        onClick={() => handleDeleteCustom(r.dish)}
                                                        className="w-8 h-8 rounded-lg flex items-center justify-center text-gray-400 hover:text-red-600 hover:bg-red-50 active:scale-90"
                                                        title="Delete custom dish"
                                                    >
                                                        <Trash2 size={14} />
                                                    </button>
                                                </>
                                            )}
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </section>
                )}

                {/* No results — show create custom dish option */}
                {query && scoredResults.length === 0 && !isSearching && !showCustomForm && (
                    <div className="p-12 text-center flex flex-col items-center gap-4 text-gray-400">
                        <div className="p-6 bg-gray-50 rounded-full">
                            <Search size={48} />
                        </div>
                        <p className="font-bold">No dishes found for "{query}"</p>
                        <p className="text-xs max-w-[200px]">Try a different spelling, adjust health filters, or create a custom dish.</p>
                        <button
                            onClick={() => { setCustomName(query); setShowCustomForm(true); }}
                            className="mt-2 px-5 py-3 rounded-xl bg-[#FF385C] text-white font-bold text-sm flex items-center gap-2 active:scale-[0.98] transition-all"
                        >
                            <Plus size={14} />
                            Create "{query}" as custom dish
                        </button>
                        {isOffline && (
                            <p className="text-xs text-amber-600 font-bold mt-2">Connect to internet to search</p>
                        )}
                    </div>
                )}

                {/* Custom dish creation form */}
                {showCustomForm && (
                    <div className="space-y-4">
                        <div className="flex items-center gap-2 mb-2">
                            <button onClick={() => { setShowCustomForm(false); setEditingDishId(null); setCustomName(''); setCustomIngredients([]); setCustomImageDataUrl(''); }} className="text-xs font-bold text-gray-500 flex items-center gap-1 active:opacity-60">
                                <X size={12} /> Back
                            </button>
                        </div>
                        <div className="p-5 rounded-2xl border-2 border-[#FF385C]/20 bg-white space-y-4">
                            <p className="text-xs font-black uppercase tracking-widest text-[#FF385C]">{editingDishId ? 'Edit Custom Dish' : 'Create Custom Dish'}</p>

                            {/* Name */}
                            <div>
                                <label className="text-[9px] font-bold text-gray-500 block mb-1">Name</label>
                                <input
                                    type="text"
                                    value={customName}
                                    onChange={e => setCustomName(e.target.value)}
                                    className="w-full rounded-xl py-2.5 px-3 text-sm font-medium border border-gray-200 bg-gray-50 text-gray-900"
                                    placeholder="Dish name"
                                />
                            </div>

                            {/* Diet */}
                            <div>
                                <label className="text-[9px] font-bold text-gray-500 block mb-1">Diet</label>
                                <div className="flex gap-2">
                                    {(['veg', 'non-veg', 'vegan'] as const).map(d => (
                                        <button
                                            key={d}
                                            onClick={() => setCustomDiet(d)}
                                            className={`px-3 py-2 rounded-xl text-xs font-bold border transition-all ${customDiet === d ? 'bg-gray-900 text-white border-gray-900' : 'bg-white text-gray-600 border-gray-200'}`}
                                        >
                                            {d === 'veg' ? 'Veg' : d === 'non-veg' ? 'Non-Veg' : 'Vegan'}
                                        </button>
                                    ))}
                                </div>
                            </div>

                            {/* Style */}
                            <div>
                                <label className="text-[9px] font-bold text-gray-500 block mb-1">Style</label>
                                <div className="flex flex-wrap gap-1.5">
                                    {CUSTOM_STYLES.map(s => (
                                        <button
                                            key={s}
                                            onClick={() => setCustomStyle(s)}
                                            className={`px-3 py-1.5 rounded-lg text-[10px] font-bold border transition-all ${customStyle === s ? 'bg-gray-900 text-white border-gray-900' : 'bg-white text-gray-600 border-gray-200'}`}
                                        >
                                            {s}
                                        </button>
                                    ))}
                                </div>
                            </div>

                            {/* Tags */}
                            <div>
                                <label className="text-[9px] font-bold text-gray-500 block mb-1">Tags</label>
                                <div className="flex flex-wrap gap-1.5">
                                    {CUSTOM_TAGS.map(t => (
                                        <button
                                            key={t}
                                            onClick={() => toggleCustomTag(t)}
                                            className={`px-3 py-1.5 rounded-lg text-[10px] font-bold border transition-all ${customTags.includes(t) ? 'bg-emerald-500 text-white border-emerald-500' : 'bg-white text-gray-600 border-gray-200'}`}
                                        >
                                            {t}
                                        </button>
                                    ))}
                                </div>
                            </div>

                            {/* Picture */}
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

                            {/* Ingredients */}
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

                            {/* Save */}
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

                {/* Trending (shown when no query) */}
                {!query && trending.length > 0 && (
                    <section className="mb-8">
                        <div className="flex items-center gap-2 mb-4 text-[#FF385C]">
                            <TrendingUp size={18} />
                            <h3 className="font-bold text-sm uppercase tracking-widest">Trending in {user?.region}</h3>
                        </div>
                        <div className="space-y-3">
                            {trending.map((dish) => (
                                <button
                                    key={dish.id}
                                    onClick={() => { setQuery(dish.name); inputRef.current?.focus(); }}
                                    className="w-full p-4 flex items-center justify-between bg-[#FF385C]/5 rounded-2xl border border-[#FF385C]/10 hover:border-[#FF385C] transition-all group"
                                >
                                    <div className="flex items-center gap-3">
                                        <span className="text-2xl">{dish.icon}</span>
                                        <div className="text-left">
                                            <span className="font-bold text-gray-900">{dish.name}</span>
                                            <span className="text-[10px] text-gray-400 font-bold block uppercase capitalize">{dish.region} India</span>
                                        </div>
                                    </div>
                                </button>
                            ))}
                        </div>
                    </section>
                )}

                {!query && (
                    <div className="p-12 text-center flex flex-col items-center gap-4 text-gray-400">
                        <div className="p-6 bg-gray-50 rounded-full">
                            <MapPin size={48} />
                        </div>
                        <p className="font-bold">What's on your mind today?</p>
                        <p className="text-xs max-w-[200px]">Search for any regional dish, or tap a trending suggestion.</p>
                    </div>
                )}
            </div>
        </div>
    );
};

export default MealSearch;
