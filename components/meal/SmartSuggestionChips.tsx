import React, { useEffect, useState, useMemo, useCallback } from 'react';
import type { MealType } from '../../plan/store/useTrayStore';
import type { Meal } from '../../types/tray';
import { suggestionCache, type SuggestionMeal } from '../../app/lib/trayApi';
import { DISH_LIBRARY } from '../../meal/constants/dishLibrary';
import { Sparkles, Loader2, AlertCircle, Plus, Info } from 'lucide-react';
import DishImage from '../new/DishImage';
import { scoreItem, formatRecommendation } from '../../utils/scoringEngine';
import { useAsyncGuard, requestDedupCache } from '../../utils/asyncGuard';
import { useStore } from '../../app/store/useStore';
import { fetchAISuggestions } from '../../utils/aiBridge';

interface SmartSuggestionChipsProps {
  date: string;
  mealType: MealType;
  userRegion: string;
  userDiet: string;
  pantryStaples: string[];
  onAddMeal: (meal: SuggestionMeal) => void;
  onOpenSearch?: () => void;
}

const SLOT_HEADER: Record<string, { emoji: string; hinglish: string }> = {
  breakfast: { emoji: '🌅', hinglish: 'Subah ka naashta?' },
  lunch: { emoji: '☀️', hinglish: 'Dopahar ka khaana?' },
  snacks: { emoji: '🥜', hinglish: 'Chai ke saath?' },
  dinner: { emoji: '🌙', hinglish: 'Raat ka khana?' },
};

const formatChipPreview = (meal: SuggestionMeal): string => {
  const parts: string[] = [];
  if (meal.defaultGravy) parts.push(meal.defaultGravy);
  if (meal.defaultRoti) parts.push(meal.defaultRoti);
  if (meal.defaultRice) parts.push(meal.defaultRice);
  return parts.join(' • ');
};

function suggestionToMeal(s: SuggestionMeal): Meal {
  const regionLower = s.region?.toLowerCase() ?? '';
  const region = regionLower.includes('south') ? 'south'
    : regionLower.includes('east') ? 'east'
    : regionLower.includes('west') ? 'west'
    : regionLower.includes('northeast') ? 'northeast'
    : regionLower.includes('central') ? 'central'
    : 'north';
  const match = DISH_LIBRARY.find(d => d.name.toLowerCase() === s.name.toLowerCase())
    || DISH_LIBRARY.find(d => d.name.toLowerCase().startsWith(s.name.toLowerCase()) && (d.name.length === s.name.length || d.name[s.name.length] === ' ' || d.name[s.name.length] === '('));
  return {
    id: match?.id ?? s.id,
    name: s.name,
    icon: match?.icon ?? s.icon,
    region,
    tags: [s.type || 'veg', ...(s.name ? [s.name.toLowerCase()] : [])],
  };
}

export const SmartSuggestionChips: React.FC<SmartSuggestionChipsProps> = React.memo(({
  date,
  mealType,
  userRegion,
  userDiet,
  pantryStaples,
  onAddMeal,
  onOpenSearch,
}) => {
  const [suggestions, setSuggestions] = useState<SuggestionMeal[]>([]);
  const [loading, setLoading] = useState(true);
  const [source, setSource] = useState<'api' | 'cache' | 'error'>('api');
  const header = SLOT_HEADER[mealType] ?? { emoji: '🍽️', hinglish: 'Add a meal?' };
  const asyncGuard = useAsyncGuard();

  useEffect(() => {
    const requestId = asyncGuard.start();
    const cacheKey = `suggestions_${mealType}_${userDiet}_${userRegion}`;
    const prefs = useStore.getState().user?.preferredRegions || [userRegion];

    setLoading(true);

    // Try AI bridge first, fall back to existing cache
    fetchAISuggestions({}, userDiet, prefs).then(aiSugs => {
      if (!asyncGuard.isCurrent(requestId)) return;
      if (aiSugs && aiSugs[mealType.toLowerCase()]?.length > 0) {
        const mapped: SuggestionMeal[] = aiSugs[mealType.toLowerCase()].map((d: any) => ({
          id: d.id,
          name: d.name,
          diet: userDiet,
          region: d.region,
          category: d.slots,
          mealType: mealType,
          image: '',
          suggestedBy: 'ai',
        }));
        setSuggestions(mapped);
        setSource('api');
        setLoading(false);
        return;
      }
      // Fallback: existing cache
      requestDedupCache.get(cacheKey, 5000, () =>
        suggestionCache.getWithFallback({
          mealType, diet: userDiet, region: userRegion,
          pantry: pantryStaples.length > 0 ? pantryStaples : undefined,
        })
      ).then(result => {
        if (!asyncGuard.isCurrent(requestId)) return;
        setSuggestions(result.suggestions);
        setSource(result.source);
        setLoading(false);
      }).catch(() => {
        if (!asyncGuard.isCurrent(requestId)) return;
        setSuggestions([]);
        setSource('error');
        setLoading(false);
      });
    }).catch(() => {
      // AI bridge down — use existing cache
      requestDedupCache.get(cacheKey, 5000, () =>
        suggestionCache.getWithFallback({
          mealType, diet: userDiet, region: userRegion,
          pantry: pantryStaples.length > 0 ? pantryStaples : undefined,
        })
      ).then(result => {
        if (!asyncGuard.isCurrent(requestId)) return;
        setSuggestions(result.suggestions);
        setSource(result.source);
        setLoading(false);
      }).catch(() => {
        if (!asyncGuard.isCurrent(requestId)) return;
        setSuggestions([]);
        setSource('error');
        setLoading(false);
      });
    });

    return () => asyncGuard.abort();
  }, [mealType, userDiet, userRegion, pantryStaples]);

  const scoredSuggestions = useMemo(() => {
    if (source === 'api') {
      return suggestions.map(s => ({ suggestion: s, scored: { score: 1, percentage: 90, reasons: ['AI recommended'] } }));
    }
    return suggestions
      .map(s => {
        const meal = suggestionToMeal(s);
        const ctx = {
          dish: meal, slotType: mealType, userDiet,
          pantryStaples, region: userRegion, existingSelections: [],
        };
        const scored = scoreItem(s.name, 'bread', ctx);
        return { suggestion: s, scored };
      })
      .sort((a, b) => b.scored.score - a.scored.score);
  }, [suggestions, mealType, userDiet, userRegion, pantryStaples, source]);

  const handleAdd = useCallback((meal: SuggestionMeal) => {
    onAddMeal(meal);
  }, [onAddMeal]);

  return (
    <div
      className="p-5 rounded-[28px] border-2 border-gray-200 border-dashed transition-all bg-gray-50/50"
      role="region"
      aria-label={`Suggestions for ${mealType}`}
    >
      {/* Header */}
      <div className="flex items-center gap-2 mb-3">
        <span className="text-lg" aria-hidden="true">{header.emoji}</span>
        <span className="text-xs font-black uppercase tracking-widest text-gray-400">
          {mealType}
        </span>
        <span className="text-xs ml-auto text-gray-400">
          {header.hinglish}
        </span>
      </div>

      {/* Offline indicator */}
      {source === 'cache' && (
        <div className="flex items-center gap-1 mb-3 px-2 py-1 rounded-lg bg-amber-50 text-amber-600">
          <AlertCircle size={10} />
          <span className="text-sm font-bold">Offline mode — showing cached</span>
        </div>
      )}

      {/* Loading */}
      {loading ? (
        <div className="flex gap-3 overflow-hidden">
          {[1, 2, 3].map(i => (
            <div key={i} className="shrink-0 w-40 h-28 rounded-xl animate-pulse bg-gray-100" />
          ))}
        </div>
      ) : (
        <>
          {/* Suggestion chips */}
          <div className="flex gap-2 overflow-x-auto scrollbar-hide pb-1" role="list" aria-label="Meal suggestions">
            {scoredSuggestions.length === 0 && suggestions.length > 0 && (
              <div className="w-full py-4 text-center">
                <p className="text-sm font-medium text-gray-400">No suitable suggestions</p>
              </div>
            )}
            {scoredSuggestions.length === 0 && suggestions.length === 0 && source !== 'error' && (
              <div className="w-full py-4 text-center">
                <p className="text-sm font-medium text-gray-400">No suggestions available</p>
              </div>
            )}
            {scoredSuggestions.map(({ suggestion: meal, scored }) => {
              const chipPreview = formatChipPreview(meal);
              const recommendation = formatRecommendation(meal.name, scored.reasons ?? []);
              const pct = scored.percentage ?? 90;
              const reason = scored.reasons?.[0] ?? 'recommended';

              return (
                <div key={meal.id} className="shrink-0 w-44">

                  <button
                    onClick={() => handleAdd(meal)}
                    className="w-full p-3 rounded-xl border transition-all active:scale-95 text-left focus:outline-none focus-visible:ring-2 focus-visible:ring-[#FF385C] bg-white border-gray-200 hover:border-[#FF385C]/30"
                    role="listitem"
                    aria-label={`Add ${meal.name} to ${mealType}`}
                  >
                    <div className="flex items-start justify-between">
                      <DishImage name={meal.name} slot={mealType} size="sm" />
                      {/* Score badge */}
                      <span
                        className={`text-sm font-bold px-1.5 py-0.5 rounded-full ${
                          pct >= 80 ? 'bg-green-100 text-green-700'
                          : pct >= 60 ? 'bg-amber-100 text-amber-700'
                          : 'bg-gray-100 text-gray-500'
                        }`}
                        title={recommendation}
                      >
                        {pct}%
                      </span>
                    </div>
                    <span className="text-xs font-bold block leading-tight truncate mt-1 text-gray-800">
                      {meal.name}
                    </span>
                    <span className="text-sm font-medium capitalize text-gray-400">
                      {meal.region} · {meal.prepMinutes}m
                    </span>
                    {chipPreview && (
                      <div className="flex items-center gap-1 mt-1 text-gray-300">
                        <Sparkles size={8} className="text-[#FF385C]" />
                        <span className="text-xs font-medium truncate">{chipPreview}</span>
                      </div>
                    )}
                    {/* Reason preview */}
                    <div className="flex items-center gap-1 mt-1.5">
                      <Info size={8} className="text-gray-300" />
                      <span className="text-sm text-gray-400 truncate leading-tight">
                        {reason}
                      </span>
                    </div>
                  </button>
                </div>
              );
            })}

            {/* More button */}
            {onOpenSearch && (
              <button
                onClick={onOpenSearch}
                className="shrink-0 w-32 h-[123px] p-3 rounded-xl border transition-all active:scale-95 flex flex-col items-center justify-center gap-1.5 focus:outline-none focus-visible:ring-2 focus-visible:ring-[#FF385C] bg-white border-gray-200 hover:border-[#FF385C]/30"
                aria-label="Browse more meals"
              >
                <Plus size={16} className="text-gray-400" />
                <span className="text-xs font-bold text-gray-400">More</span>
              </button>
            )}
          </div>
        </>
      )}

      <style>{`
        .scrollbar-hide::-webkit-scrollbar { display: none; }
        .scrollbar-hide { -ms-overflow-style: none; scrollbar-width: none; }
        @media (prefers-reduced-motion: reduce) {
          .transition-all { transition: none !important; }
          .animate-pulse { animation: none !important; }
          .active\\:scale-95:active { transform: none !important; }
        }
      `}</style>
    </div>
  );
});

SmartSuggestionChips.displayName = 'SmartSuggestionChips';
export default SmartSuggestionChips;
