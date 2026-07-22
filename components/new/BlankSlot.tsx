import React, { useMemo } from 'react';
import type { Dish } from '../../meal/constants/dishLibrary';
import { Sparkles, ArrowRight } from 'lucide-react';
import DishImage from './DishImage';
import { getRegionKey, DIET_FILTER } from '../../utils/dishSearch';

interface BlankSlotProps {
  slot: string;
  date: string;
  dishes: Dish[];
  userRegion: string;
  userDiet: string;
  pantryStaples: string[];
  onAddMeal: (date: string, slot: string, dish: Dish) => void;
  onOpenSearch: () => void;
}

// Hinglish microcopy for suggestions
const SUGGESTION_HEADERS: Record<string, string> = {
  Breakfast: 'Subah ka naashta?',
  Lunch: 'Dopahar ka khaana?',
  Snacks: 'Chai ke saath?',
  Dinner: 'Raat ka khana?',
};

export const BlankSlot: React.FC<BlankSlotProps> = ({
  slot,
  date,
  dishes,
  userRegion,
  userDiet,
  pantryStaples,
  onAddMeal,
  onOpenSearch,
}) => {
    const regionKey = getRegionKey(userRegion);

  // Smart suggestions: max 3, based on mealType + region + diet + pantry staples
  const suggestions = useMemo(() => {
    const category = slot.toLowerCase();
    const isVegan = userDiet?.toLowerCase() === 'vegan';
    const allowedTypes = DIET_FILTER[userDiet?.toLowerCase() || 'veg'] || ['veg'];

    let filtered = dishes.filter(d => {
      if (!d.category.some(c => c.includes(category))) return false;
      if (isVegan && d.type !== 'veg' && d.type !== 'vegan') return false;
      if (!isVegan && !allowedTypes.includes(d.type)) return false;
      return true;
    });

    // Regional sort
    const scored = filtered.map(d => {
      let score = 0;
      if (d.region.toLowerCase().includes(regionKey)) score += 3;
      // Bonus if dish uses pantry staples
      if (pantryStaples.length > 0 && d.tags) {
        const dishTags = d.tags.map(t => t.toLowerCase());
        const stapleMatches = pantryStaples.filter(s =>
          dishTags.some(t => t.includes(s.toLowerCase()))
        ).length;
        score += stapleMatches * 2;
      }
      // Bonus for regional state match
      if (d.states.some(s => s.toLowerCase().includes(regionKey))) score += 1;
      return { dish: d, score };
    });

    // Sort by score (descending), then alphabetically
    scored.sort((a, b) => {
      if (b.score !== a.score) return b.score - a.score;
      return a.dish.name.localeCompare(b.dish.name);
    });

    return scored.slice(0, 3).map(s => s.dish);
  }, [dishes, slot, userDiet, userRegion, regionKey, pantryStaples]);

    return (
        <div
            className="p-5 rounded-[28px] border-2 border-dashed border-gray-200 bg-gray-50/50 transition-all"
      role="region"
      aria-label={`Empty ${slot} slot for ${date}`}
    >
      {/* Slot Header */}
      <div className="flex items-center gap-2 mb-4">
        <span className="text-lg">
          {slot === 'Breakfast' ? '🌅' : slot === 'Lunch' ? '☀️' : slot === 'Snacks' ? '🥜' : '🌙'}
        </span>
        <span className="text-[10px] font-black uppercase tracking-widest text-gray-400">
            {slot}
        </span>
        <span className="text-xs ml-auto text-gray-400">
          {SUGGESTION_HEADERS[slot] || 'Kya khana hai?'}
        </span>
      </div>

      {/* Smart Suggestion Chips */}
      <div className="flex gap-2 flex-wrap" role="list" aria-label="Meal suggestions">
        {suggestions.map(dish => (
            <button
                key={dish.id}
                onClick={() => onAddMeal(date, slot, dish)}
                className="flex items-center gap-2 px-3 py-2.5 rounded-xl border border-gray-200 bg-white transition-all active:scale-95 text-left hover:border-[#FF385C]/40 focus:outline-none focus:ring-2 focus:ring-[#FF385C]/30"
            role="listitem"
            aria-label={`Add ${dish.name} to ${slot}`}
            >
            <DishImage name={dish.name} slot={slot} size="sm" />
            <div className="min-w-0 flex-1">
                <span className="text-xs font-bold block leading-tight truncate text-gray-800">
                    {dish.name}
                </span>
                <span className="text-[9px] font-medium capitalize text-gray-400">
                {dish.region}
              </span>
            </div>
            <Sparkles size={10} className="text-[#FF385C] flex-shrink-0" aria-hidden="true" />
          </button>
        ))}

        {/* More button */}
            <button
                onClick={onOpenSearch}
                className="flex items-center gap-1.5 px-3 py-2.5 rounded-xl border border-[#FF385C]/15 bg-[#FF385C]/5 transition-all active:scale-95 hover:bg-[#FF385C]/10 focus:outline-none focus:ring-2 focus:ring-[#FF385C]/30"
          aria-label="Browse more meals"
          >
          <span className="text-xs font-bold text-[#FF385C]">Aur dekho</span>
          <ArrowRight size={12} className="text-[#FF385C]" aria-hidden="true" />
        </button>
      </div>

      {/* Reduced motion: skip animations */}
      <style>{`
        @media (prefers-reduced-motion: reduce) {
          .transition-all { transition: none !important; }
        }
      `}</style>
    </div>
  );
};

export default React.memo(BlankSlot);
