import React, { useState, useMemo, useRef } from 'react';
import { X, Search, Sparkles, Heart, Activity, Flame, Zap, Apple } from 'lucide-react';
import { useBackButtonClose } from '../../hooks/useBackButtonClose';
import DishImage from '../new/DishImage';
import type { MealType } from '../../plan/store/useTrayStore';
import type { Dish } from '../../meal/constants/dishLibrary';
import { getRegionKey, dishSortComparator, type DishHealthFilter } from '../../utils/dishSearch';

const HEALTH_LABELS = ["all", "low-cal", "high-protein", "low-carb", "balanced"] as const;
type HealthFilter = DishHealthFilter;

const HEALTH_ICONS: Record<string, React.ReactNode> = {
  "all": <Heart className="w-2.5 h-2.5" />,
  "low-cal": <Flame className="w-2.5 h-2.5" />,
  "high-protein": <Zap className="w-2.5 h-2.5" />,
  "low-carb": <Apple className="w-2.5 h-2.5" />,
  "balanced": <Activity className="w-2.5 h-2.5" />,
};

function dishHealthScore(d: Dish): number {
  let score = 50;
  if (d.protein && d.protein > 15) score += 15;
  if (d.calories && d.calories < 250) score += 15;
  if (d.calories && d.calories > 500) score -= 15;
  return Math.min(100, Math.max(0, score));
}



interface Props {
  isOpen: boolean;
  onClose: () => void;
  dishes: Dish[];
  mealType?: MealType;
  userDiet?: string;
  userRegion?: string;
  onSelect?: (dish: Dish) => void;
  initialQuery?: string;
}

export default function DishSearchModal({ isOpen, onClose, dishes, mealType, userDiet, userRegion, onSelect, initialQuery }: Props) {
  useBackButtonClose(isOpen, onClose);
  const [query, setQuery] = useState(initialQuery || '');
  const [healthFilter, setHealthFilter] = useState<HealthFilter>('all');
  const [displayCount, setDisplayCount] = useState(40);
  const initialProcessedRef = useRef(false);

  React.useEffect(() => {
    if (!isOpen) return;
    if (initialQuery && !initialProcessedRef.current) {
      setQuery(initialQuery);
      initialProcessedRef.current = true;
    } else if (!initialQuery) {
      setQuery('');
    }
    setHealthFilter('all');
    setDisplayCount(40);
  }, [isOpen, initialQuery]);

  const { results, totalAvailable } = useMemo(() => {
    if (!isOpen || !dishes) return { results: [], totalAvailable: 0 };

    let r = [...dishes];

    // Text search
    if (query.trim()) {
      const q = query.toLowerCase().trim();
      r = r.filter(d => d.name.toLowerCase().includes(q));
    }

    // Diet restriction
    if (userDiet) {
      const ud = userDiet.toLowerCase();
      r = r.filter(d => {
        if (!d) return false;
        const dt = (d.diet || d.type || '').toLowerCase();
        if (!dt) return true;
        if (ud === 'veg') return dt === 'veg' || dt === 'vegan';
        if (ud === 'eggitarian') return dt === 'eggitarian' || dt === 'veg' || dt === 'vegan';
        if (ud === 'non-veg') return true;
        return true;
      });
    }

    // Slot-aware compound sort (ordering ONLY — never excludes): slot priority,
    // then health-match when a filter is active, then region tiebreak, then
    // name. Deterministic; far-region dishes always stay in the list.
    const regionKeyNorm = getRegionKey(userRegion);
    const comparator = dishSortComparator({ regionKey: regionKeyNorm, mealType, healthFilter });
    r.sort(comparator);

    return {
      results: r.slice(0, displayCount),
      totalAvailable: r.length,
    };
  }, [isOpen, dishes, query, userDiet, healthFilter, mealType, displayCount]);

  const totalCount = totalAvailable;

  if (!isOpen || !dishes) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-end sm:items-center justify-center" onClick={onClose}>
      <div className="fixed inset-0 bg-black/40 backdrop-blur-sm" />
      <div className="relative bg-white rounded-t-[28px] sm:rounded-[28px] w-full max-w-lg mx-auto max-h-[90vh] overflow-hidden flex flex-col" onClick={e => e.stopPropagation()}>

        <div className="flex items-center justify-between px-5 pt-4 pb-3 border-b border-gray-100 shrink-0">
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-lg font-bold text-gray-900">Pick your dish</h2>
              {mealType && (
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-[#FF385C]/10 text-[#FF385C] text-xs font-bold uppercase tracking-wider">
                  {mealType === 'breakfast' ? '🌅' : mealType === 'lunch' ? '☀️' : mealType === 'snacks' ? '🍪' : '🌙'} {mealType}
                </span>
              )}
            </div>
            <div className="flex items-center gap-2 mt-1">
              <span className="text-xs text-gray-400">{totalCount} dishes</span>
              {userDiet && (
                <span className="text-xs text-gray-400">
                  · {userDiet}{userDiet === 'veg' ? ' (no egg/non-veg)' : ''}
                </span>
              )}
            </div>
          </div>
          <button onClick={onClose} className="w-9 h-9 rounded-2xl bg-gray-100 flex items-center justify-center active:scale-90 shrink-0"><X size={16} /></button>
        </div>

        <div className="px-5 pt-3 pb-2 shrink-0 space-y-2">
          <div className="flex items-center gap-2.5 bg-gray-100 rounded-2xl px-4 py-3">
            <Search size={16} className="text-gray-400 shrink-0" />
            <input type="text" value={query} onChange={e => setQuery(e.target.value)}
              placeholder="Search paneer, dal, biryani..."
              className="flex-1 bg-transparent text-sm text-gray-800 outline-none placeholder:text-gray-400 font-medium" autoFocus />
          </div>
          <div className="flex gap-1.5 overflow-x-auto pb-0.5 scrollbar-hide">
            {HEALTH_LABELS.map(h => (
              <button key={h} onClick={() => setHealthFilter(healthFilter === h ? 'all' : h)}
                className={`shrink-0 px-3 py-1.5 rounded-full text-xs font-bold uppercase tracking-wider transition-all active:scale-95 flex items-center gap-1 ${
                  healthFilter === h ? 'bg-emerald-500 text-white shadow-sm' : 'bg-gray-100 text-gray-500'
                }`}
              >{HEALTH_ICONS[h]}{h}</button>
            ))}
          </div>
        </div>

        <div className="flex-1 overflow-y-auto px-5 pb-[calc(1rem+env(safe-area-inset-bottom,0px))]">
          <div className="grid grid-cols-2 gap-3">
            {results.map(d => (
              <button key={d.id} onClick={() => { onSelect?.(d); onClose(); }}
                className="flex items-center gap-3 p-3 rounded-2xl border border-gray-100 bg-white active:scale-[0.98] transition-all text-left"
              >
                <DishImage name={d.name} size="sm" className="shrink-0" />
                <div className="min-w-0 flex-1">
                  <p className="text-xs font-bold text-gray-800 truncate">{d.name}</p>
                  <div className="flex items-center gap-1.5 mt-0.5">
                    <span className="text-xs text-gray-400">{d.region || ''}</span>
                    {(d.calories || d.protein) && (
                      <span className="text-xs font-bold"
                        style={{color: dishHealthScore(d) > 70 ? '#22c55e' : dishHealthScore(d) > 40 ? '#eab308' : '#ef4444'}}
                      >{dishHealthScore(d)}%</span>
                    )}
                  </div>
                  <div className="flex gap-1 mt-0.5">
                    {d.calories && <span className="text-sm text-gray-400">{d.calories}cal</span>}
                    {d.protein && <span className="text-sm text-gray-400">{d.protein}gP</span>}
                  </div>
                </div>
              </button>
            ))}
          </div>
          {displayCount < totalAvailable && (
            <div className="flex justify-center pt-2 pb-1">
              <button onClick={() => setDisplayCount(prev => prev + 40)}
                className="px-6 py-2.5 rounded-full bg-gray-100 text-sm font-bold text-gray-500 hover:bg-gray-200 active:scale-95 transition-all flex items-center gap-2">
                Load more <span className="text-gray-400 font-normal">({totalAvailable - displayCount} remaining)</span>
              </button>
            </div>
          )}
          {results.length === 0 && (
            <div className="py-16 text-center">
              <p className="text-sm text-gray-500">No dishes found</p>
              <div className="text-xs text-gray-400 mt-2 space-y-1">
                {query && <p>Search: "{query}"</p>}
                {healthFilter !== 'all' && <p>Health: {healthFilter} (matching dishes sorted first)</p>}
              </div>
              <p className="text-xs text-gray-300 mt-3">Try a different search or clear filters</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
