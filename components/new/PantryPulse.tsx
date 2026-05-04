import React, { useState, useMemo } from 'react';
import { useStore, getMealResolution } from '../../store/useStore';
import { ShoppingBasket, Plus, X, Share2, Phone, Check, ChevronRight } from 'lucide-react';
import { getShareStrings, ShareLanguage } from '../../utils/share';
import {
    buildPantryGroups,
    deriveIngredientsForDay,
    deriveIngredientsForDateRange,
    getTomorrowISO,
    getWeekEndISO,
    getMealNamesForDay,
    invalidateIngredientCache,
    CATEGORY_META,
    type AggregatedIngredient,
    type PantryGroup,
} from '../../utils/ingredientUtils';
import WhatsAppShareModal from './WhatsAppShareModal';

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
    const { user, trayLibrary, swaps, dishes } = useStore();
    const [items, setItems] = useState<PantryItem[]>([]);
    const [newItem, setNewItem] = useState('');
    const [sharePhone, setSharePhone] = useState(user?.cookContact || '');
    const [showShareInput, setShowShareInput] = useState(false);
    const [viewMode, setViewMode] = useState<'tomorrow' | 'week'>('tomorrow');
    const [showShareModal, setShowShareModal] = useState(false);
    const [showAllWeekMeals, setShowAllWeekMeals] = useState(false);
    const [refreshKey, setRefreshKey] = useState(0); // FIX-10: Cache busting

    const tomorrowISO = getTomorrowISO();
    const weekEndISO = getWeekEndISO();
    
    // Check if all today's slots are passed
    const allTodaySlotsPassed = () => {
        const now = new Date();
        const hour = now.getHours();
        // Dinner ends at 9PM (8pm + 1hr grace)
        return hour >= 21;
    };
    
    // Smart default: show tomorrow if all today's slots passed
    const getDefaultViewMode = () => {
        if (allTodaySlotsPassed()) return 'tomorrow';
        return 'week';
    };
    
    // FIX-10: Listen for pantry invalidation events (swap/cancel)
    React.useEffect(() => {
        const handlePantryInvalidate = () => {
            console.log('Pantry: Invalidating cache...');
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
    
    // Check if user has snacks in planned slots
    const includeSnacks = user?.plannedSlots?.includes('Snacks') ?? false;
    const allSlots = includeSnacks ? ['Breakfast', 'Lunch', 'Snacks', 'Dinner'] as const : ['Breakfast', 'Lunch', 'Dinner'] as const;

    const groups = useMemo((): PantryGroup[] => {
        if (viewMode === 'tomorrow') {
            const allIngredients: { ing: any; source: string }[] = [];
            for (const slot of allSlots) {
                const derived = deriveIngredientsForDay(tomorrowISO, slot, trayLibrary, swaps, dishes);
                allIngredients.push(...derived);
            }
            return buildPantryGroups(allIngredients);
        } else {
            const allIngredients: { ing: any; source: string }[] = [];
            const derived = deriveIngredientsForDateRange(tomorrowISO, weekEndISO, [...allSlots], trayLibrary, swaps, dishes);
            allIngredients.push(...derived);
            return buildPantryGroups(allIngredients);
        }
    }, [viewMode, trayLibrary, swaps, dishes, tomorrowISO, weekEndISO, includeSnacks, refreshKey]);

    const manual = useMemo(() => items.filter(i => i.source === 'manual'), [items]);

    const allItems = useMemo((): PantryItem[] => {
        const autoItems: PantryItem[] = groups.flatMap(group =>
            group.items.map(item => ({
                id: item.id,
                name: item.name,
                quantity: item.totalQuantity.toString(),
                unit: item.unit,
                category: item.category,
                checked: false,
                source: 'auto' as const,
                sources: item.sources,
            }))
        );
        return [...autoItems, ...manual];
    }, [groups, manual]);

    const tomorrowMeals = useMemo(() => {
        if (!dishes.length) return [];
        return getMealNamesForDay(tomorrowISO, trayLibrary, swaps, dishes, includeSnacks);
    }, [tomorrowISO, trayLibrary, swaps, dishes, includeSnacks]);

    // Get all meals for the week (for "This Week" view)
    const weekMeals = useMemo(() => {
        if (!dishes.length) return [];
        const meals: { date: string; slot: string; name: string; variant?: string }[] = [];
        const start = new Date(tomorrowISO + 'T00:00:00');
        for (let i = 0; i < 6; i++) {
            const date = new Date(start);
            date.setDate(start.getDate() + i);
            const isoDate = date.toLocaleDateString('en-CA');
            for (const slot of allSlots) {
                const res = getMealResolution(trayLibrary, swaps, isoDate!, slot, dishes);
                if (res.meal?.name) {
                    meals.push({
                        date: isoDate!,
                        slot,
                        name: res.meal.name,
                        variant: res.meal.variant,
                    });
                }
            }
        }
        return meals;
    }, [trayLibrary, swaps, dishes, tomorrowISO, includeSnacks]);

    const toggleItem = (id: string) =>
        setItems(prev => prev.map(it => it.id === id ? { ...it, checked: !it.checked } : it));

    const toggleAutoItem = (id: string) =>
        setItems(prev => {
            if (prev.find(it => it.id === id)) {
                return prev.map(it => it.id === id ? { ...it, checked: !it.checked } : it);
            }
            const group = groups.find(g => g.items.find(i => i.id === id));
            const ingItem = group?.items.find(i => i.id === id);
            if (!ingItem) return prev;
            return [...prev, {
                id: ingItem.id,
                name: ingItem.name,
                quantity: ingItem.totalQuantity.toString(),
                unit: ingItem.unit,
                category: ingItem.category,
                checked: true,
                source: 'auto',
                sources: ingItem.sources,
            }];
        });

    const removeItem = (id: string) =>
        setItems(prev => prev.filter(it => it.id !== id));

    const addItem = () => {
        if (!newItem.trim()) return;
        setItems(prev => [...prev, {
            id: `manual-${Date.now()}`,
            name: newItem.trim(),
            quantity: '1',
            unit: 'unit',
            category: 'pantry',
            checked: false,
            source: 'manual',
            sources: [],
        }]);
        setNewItem('');
    };

    const buildShareListMessage = (lang: ShareLanguage) => {
        const copy = getShareStrings(lang);
        const unchecked = allItems.filter(it => !it.checked);
        const groupedByCategory: Record<string, typeof unchecked> = {};
        unchecked.forEach(it => {
            if (!groupedByCategory[it.category]) groupedByCategory[it.category] = [];
            groupedByCategory[it.category]!.push(it);
        });

        let lines = '';
        for (const cat of ['produce', 'proteins', 'dairy', 'grains', 'spices', 'pantry', 'breads']) {
            const catItems = groupedByCategory[cat];
            if (!catItems?.length) continue;
            const meta = CATEGORY_META[cat as keyof typeof CATEGORY_META];
            lines += `\n${meta.emoji} ${meta.label.toUpperCase()}\n`;
            catItems.forEach(i => {
                lines += `  • ${i.name}${i.unit !== 'unit' ? ` (${i.quantity} ${i.unit})` : ''}\n`;
            });
        }

        return `🛒 *${copy.pantryTitle}*\n${copy.region}: ${user?.region || ''}\n${copy.pantryFor} ${viewMode === 'tomorrow' ? "tomorrow's" : "this week's"} meals:\n${lines}\n${copy.sentFrom}`;
    };

    const uncheckedCount = allItems.filter(i => !i.checked).length;
    const checkedCount = allItems.filter(i => i.checked).length;

    return (
        <div className="min-h-screen bg-white pb-32 animate-in fade-in duration-500">
            <WhatsAppShareModal
                isOpen={showShareModal}
                defaultPhone={sharePhone || user?.cookContact}
                title="Kitchen List"
                onClose={() => setShowShareModal(false)}
                previewBuilder={buildShareListMessage}
            />

            <header className="px-6 pt-14 pb-4">
                <div className="flex items-center justify-between mb-2">
                    <h2 className="text-4xl font-bold tracking-tight">What's in the Kitchen</h2>
                    <button
                        onClick={() => {
                            if (!(sharePhone || user?.cookContact)) { alert('Enter a phone number in Profile first'); return; }
                            setShowShareModal(true);
                        }}
                        className="flex items-center gap-2 bg-[#FF385C] text-white px-4 py-2.5 rounded-2xl text-[11px] font-black uppercase tracking-widest active:scale-95 transition-all shadow-lg shadow-[#FF385C]/20"
                    >
                        <Share2 size={14} />
                        Share
                    </button>
                </div>
                <p className="text-gray-400 text-sm font-medium">
                    {uncheckedCount} items needed · {checkedCount} ready
                </p>

                <div className="mt-4 bg-gray-100 p-1 rounded-2xl flex">
                    {(['tomorrow', 'week'] as const).map(v => (
                        <button
                            key={v}
                            onClick={() => setViewMode(v)}
                            className={`flex-1 py-2.5 rounded-xl text-xs font-black uppercase tracking-widest transition-all ${viewMode === v ? 'bg-white shadow text-gray-900' : 'text-gray-400'}`}
                        >
                            {v === 'tomorrow' ? "Tomorrow's Menu" : "This Week's Menu"}
                        </button>
                    ))}
                </div>
                
                {/* Time-aware status message */}
                <div className="mt-3 px-3 py-2 rounded-lg bg-blue-50 border border-blue-100">
                    <p className="text-[10px] font-bold text-blue-700 uppercase tracking-wide">
                        {allTodaySlotsPassed() 
                            ? "✨ Today's meals done — showing Tomorrow" 
                            : "📅 Showing upcoming meals only"}
                    </p>
                    <p className="text-[9px] text-blue-600 mt-0.5">
                        Past/missed meals are excluded from the shopping list
                    </p>
                </div>
            </header>

            {/* Tomorrow's Meal Cards */}
            {viewMode === 'tomorrow' && tomorrowMeals.length > 0 && (
                <div className="px-6 mb-4">
                    <p className="text-[10px] font-black uppercase tracking-widest text-gray-400 mb-3">Planned Meals</p>
                    <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
                        {tomorrowMeals.map((meal, idx) => (
                            <div key={idx} className="flex-shrink-0 bg-gray-50 rounded-xl p-3 border border-gray-100 min-w-[140px]">
                                <p className="text-[9px] font-bold text-[#FF385C] uppercase mb-1">{meal.slot}</p>
                                <p className="text-xs font-bold text-gray-800 truncate">{meal.name}</p>
                                {meal.variant && <p className="text-[9px] text-gray-400 truncate">{meal.variant}</p>}
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* This Week Meal Cards */}
            {viewMode === 'week' && weekMeals.length > 0 && (
                <div className="px-6 mb-4">
                    <p className="text-[10px] font-black uppercase tracking-widest text-gray-400 mb-3">This Week ({weekMeals.length} meals)</p>
                    <div className={`flex gap-2 overflow-x-auto pb-2 scrollbar-hide transition-all ${showAllWeekMeals ? 'flex-wrap' : ''}`}>
                        {(showAllWeekMeals ? weekMeals : weekMeals.slice(0, 4)).map((meal, idx) => (
                            <div key={idx} className="flex-shrink-0 bg-gray-50 rounded-xl p-3 border border-gray-100 min-w-[140px]">
                                <p className="text-[9px] font-bold text-[#FF385C] uppercase mb-1">{meal.slot}</p>
                                <p className="text-xs font-bold text-gray-800 truncate">{meal.name}</p>
                                {meal.variant && <p className="text-[9px] text-gray-400 truncate">{meal.variant}</p>}
                            </div>
                        ))}
                    </div>
                    {weekMeals.length > 4 && !showAllWeekMeals && (
                        <button
                            onClick={() => setShowAllWeekMeals(true)}
                            className="mt-2 text-[10px] font-bold text-[#FF385C] flex items-center gap-1"
                        >
                            +{weekMeals.length - 4} more meals
                        </button>
                    )}
                    {showAllWeekMeals && weekMeals.length > 4 && (
                        <button
                            onClick={() => setShowAllWeekMeals(false)}
                            className="mt-2 text-[10px] font-bold text-gray-400 flex items-center gap-1"
                        >
                            − Show less
                        </button>
                    )}
                </div>
            )}

            {allItems.length === 0 && (
                <div className="flex flex-col items-center justify-center py-24 px-8 text-center">
                    <div className="w-20 h-20 bg-gray-100 rounded-[24px] flex items-center justify-center text-4xl mb-6">🛒</div>
                    <h3 className="text-xl font-bold mb-2">Fridge looking shy?</h3>
                    <p className="text-gray-400 text-sm">Add meals to your tray and the list builds itself.</p>
                </div>
            )}

            {groups.map(group => (
                <div key={group.category} className="px-6 space-y-2 mb-4">
                    <div className="flex items-center gap-2 mt-4">
                        <span className="text-base">{group.emoji}</span>
                        <span className="text-[10px] font-black uppercase tracking-widest text-gray-400">{group.label}</span>
                        <span className="text-[10px] font-black text-gray-300">{group.items.length} items</span>
                    </div>
                    {group.items.map(item => {
                        const stored = items.find(it => it.id === item.id);
                        const checked = !!stored?.checked;
                        return (
                            <div
                                key={item.id}
                                className={`flex items-center gap-4 p-4 rounded-[20px] border-2 transition-all ${checked ? 'border-green-200 bg-green-50' : 'border-gray-100 bg-white'}`}
                            >
                                <button
                                    onClick={() => {
                                        if (stored) {
                                            toggleItem(item.id);
                                        } else {
                                            setItems(prev => [...prev, {
                                                id: item.id,
                                                name: item.name,
                                                quantity: item.totalQuantity.toString(),
                                                unit: item.unit,
                                                category: item.category,
                                                checked: true,
                                                source: 'auto',
                                                sources: item.sources,
                                            }]);
                                        }
                                    }}
                                    className={`w-7 h-7 rounded-xl border-2 flex items-center justify-center transition-all flex-shrink-0 ${checked ? 'bg-green-500 border-green-500 text-white' : 'border-gray-200'}`}
                                >
                                    {checked && <Check size={14} />}
                                </button>
                                <div className="flex-1 min-w-0">
                                    <span className={`font-bold text-sm block truncate ${checked ? 'line-through text-gray-400' : 'text-gray-800'}`}>
                                        {item.name}
                                    </span>
                                    <span className="text-[10px] text-gray-400">
                                        {item.totalQuantity} {item.unit} · from {item.sources.join(', ')}
                                    </span>
                                </div>
                            </div>
                        );
                    })}
                </div>
            ))}

            {manual.length > 0 && (
                <div className="px-6 space-y-2 mb-4">
                    <div className="flex items-center gap-2 mt-4">
                        <span className="text-base">🛍️</span>
                        <span className="text-[10px] font-black uppercase tracking-widest text-gray-400">Others</span>
                        <span className="text-[10px] font-black text-gray-300">{manual.length} items</span>
                    </div>
                    {manual.map(item => (
                        <div
                            key={item.id}
                            className={`flex items-center gap-4 p-4 rounded-[20px] border-2 transition-all ${item.checked ? 'border-green-200 bg-green-50' : 'border-gray-100 bg-white'}`}
                        >
                            <button
                                onClick={() => toggleItem(item.id)}
                                className={`w-6 h-6 rounded-full border-2 flex items-center justify-center transition-all ${item.checked ? 'bg-green-500 border-green-500' : 'border-gray-300'}`}
                            >
                                {item.checked && <Check size={12} className="text-white" />}
                            </button>
                            <div className="flex-1">
                                <p className={`text-sm font-bold ${item.checked ? 'line-through text-gray-400' : 'text-gray-800'}`}>{item.name}</p>
                            </div>
                            <button onClick={() => removeItem(item.id)} className="p-1.5 rounded-full hover:bg-gray-100 transition-all">
                                <X size={14} className="text-gray-400" />
                            </button>
                        </div>
                    ))}
                </div>
            )}

            <div className="px-6 mt-5">
                <div className="flex gap-3">
                    <input
                        type="text"
                        value={newItem}
                        onChange={e => setNewItem(e.target.value)}
                        onKeyDown={e => e.key === 'Enter' && addItem()}
                        placeholder="Need something? Type it in."
                        className="flex-1 bg-gray-50 rounded-2xl py-4 px-5 text-sm font-bold border border-gray-100 focus:outline-none focus:ring-2 focus:ring-[#FF385C]"
                    />
                    <button
                        onClick={addItem}
                        disabled={!newItem.trim()}
                        className="w-14 h-14 bg-[#FF385C] text-white rounded-2xl flex items-center justify-center shadow-lg shadow-[#FF385C]/20 disabled:opacity-30 active:scale-95 transition-all"
                    >
                        <Plus size={22} />
                    </button>
                </div>
            </div>

            {allItems.length > 0 && (
                <div className="px-6 mt-6">
                    <button
                        onClick={() => {
                            if (!(sharePhone || user?.cookContact)) { alert('Enter a phone number'); return; }
                            setShowShareModal(true);
                        }}
                        className="w-full py-5 bg-[#25D366] text-white rounded-[24px] font-bold text-base flex items-center justify-center gap-3 shadow-xl shadow-green-500/20 active:scale-[0.98] transition-all"
                    >
                        <Share2 size={18} />
                        Share List on WhatsApp
                    </button>
                    <p className="text-center text-[11px] text-gray-400 mt-3 font-medium">
                        Shares {uncheckedCount} unchecked items · Cook: {user?.cookContact || 'Set in Profile'}
                    </p>
                </div>
            )}
        </div>
    );
};

export default React.memo(PantryPulse);