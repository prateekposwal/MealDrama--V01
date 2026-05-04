import React from 'react';
import { Search, X, TrendingUp, MapPin, Globe, AlertTriangle, WifiOff } from 'lucide-react';
import { useStore, MealOption } from '../../store/useStore';
import { useMealSearch } from '../../hooks/useMealSearch';
import { DISH_LIBRARY } from '../../constants/dishLibrary';

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

const MealSearch: React.FC<MealSearchProps> = ({ onClose, onSelect }) => {
    const { user } = useStore();
    const pool = useStore(state => (state.dishes && state.dishes.length > 0) ? state.dishes : DISH_LIBRARY);

    const {
        query, setQuery, results, isSearching, isOffline,
        highlightedIndex, searchCount, inputRef, handleKeyDown,
    } = useMealSearch({
        dishes: pool,
        userRegion: user?.region ?? '',
        userDiet: user?.diet ?? 'veg',
    });

    const trending = React.useMemo(() => {
        const regionKey = (user?.region ?? '').toLowerCase();
        return pool
            .filter(d => d.region.toLowerCase().includes(regionKey) || regionKey === '')
            .sort(() => Math.random() - 0.5)
            .slice(0, 5);
    }, [pool, user?.region]);

    const handleSelect = (dish: any, variant: any) => {
        onSelect?.(dish, variant);
        onClose();
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
                {query && results.length > 0 && (
                    <section className="mb-8">
                        <div className="flex items-center justify-between mb-4">
                            <p className="text-[10px] font-black uppercase tracking-widest text-gray-400">
                                {results.length} result{results.length !== 1 ? 's' : ''} for "{query}"
                            </p>
                        </div>
                        <div className="space-y-2">
                            {results.map((r, idx) => {
                                const badge = DIET_BADGE[r.dish.type] || DIET_BADGE['veg'];
                                const isHighlighted = idx === highlightedIndex;
                                const conflictsWithDiet = !r.matchesDiet;

                                return (
                                    <button
                                        key={`${r.dish.id}-${r.variant.id}`}
                                        id={`search-result-${idx}`}
                                        role="option"
                                        aria-selected={isHighlighted}
                                        onClick={() => handleSelect(r.dish, r.variant)}
                                        className={`w-full p-4 flex items-center justify-between rounded-2xl border transition-all group text-left ${
                                            isHighlighted
                                                ? 'bg-[#FF385C]/10 border-[#FF385C] shadow-sm'
                                                : 'bg-white border-gray-100 hover:border-[#FF385C]/30'
                                        } ${conflictsWithDiet ? 'opacity-80' : ''}`}
                                    >
                                        <div className="flex items-center gap-3">
                                            <span className="text-2xl">{r.dish.icon}</span>
                                            <div>
                                                <span className="font-bold text-gray-900 text-sm block">
                                                    {r.variant.name}
                                                </span>
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
                                        </div>
                                        <div className="flex items-center gap-2">
                                            {r.confidence < 1.0 && (
                                                <span className="text-[8px] text-gray-400 font-bold">
                                                    {Math.round(r.confidence * 100)}%
                                                </span>
                                            )}
                                        </div>
                                    </button>
                                );
                            })}
                        </div>
                    </section>
                )}

                {/* No results */}
                {query && results.length === 0 && !isSearching && (
                    <div className="p-12 text-center flex flex-col items-center gap-4 text-gray-400">
                        <div className="p-6 bg-gray-50 rounded-full">
                            <Search size={48} />
                        </div>
                        <p className="font-bold">No dishes found for "{query}"</p>
                        <p className="text-xs max-w-[200px]">Try a different spelling or browse trending dishes below.</p>
                        {isOffline && (
                            <p className="text-xs text-amber-600 font-bold mt-2">Connect to internet to search</p>
                        )}
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
