import React from 'react';

export type DietFilter = 'all' | 'veg' | 'non-veg' | 'vegan' | 'eggitarian';
export type SlotFilter = 'all' | 'breakfast' | 'lunch' | 'snacks' | 'dinner';

interface QuickFiltersProps {
  diet: DietFilter;
  slot: SlotFilter;
  onDietChange: (d: DietFilter) => void;
  onSlotChange: (s: SlotFilter) => void;
}

const DIET_OPTIONS: { key: DietFilter; label: string; icon: string }[] = [
  { key: 'all', label: 'All', icon: '🍽️' },
  { key: 'veg', label: 'Veg', icon: '🥦' },
  { key: 'non-veg', label: 'Non-Veg', icon: '🍗' },
  { key: 'vegan', label: 'Vegan', icon: '🌱' },
  { key: 'eggitarian', label: 'Egg', icon: '🥚' },
];

const SLOT_OPTIONS: { key: SlotFilter; label: string; icon: string }[] = [
  { key: 'all', label: 'All', icon: '📋' },
  { key: 'breakfast', label: 'Breakfast', icon: '🌅' },
  { key: 'lunch', label: 'Lunch', icon: '☀️' },
  { key: 'snacks', label: 'Snacks', icon: '🥜' },
  { key: 'dinner', label: 'Dinner', icon: '🌙' },
];

export const QuickFilters: React.FC<QuickFiltersProps> = ({
  diet, slot, onDietChange, onSlotChange,
}) => {
  return (
    <div className="space-y-2">
      {/* Diet filter */}
      <div className="flex gap-1.5 overflow-x-auto scrollbar-hide pb-0.5">
        {DIET_OPTIONS.map(opt => {
          const active = diet === opt.key;
          return (
            <button
              key={opt.key}
              onClick={() => onDietChange(opt.key)}
              className={`shrink-0 flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-[10px] font-bold transition-all active:scale-95 ${
                active
                  ? 'bg-[#FF385C] text-white shadow-sm'
                  : 'bg-gray-100 text-gray-500 hover:bg-gray-200'
              }`}
              aria-pressed={active}
              aria-label={`Filter by ${opt.label}`}
            >
              <span>{opt.icon}</span>
              <span>{opt.label}</span>
            </button>
          );
        })}
      </div>

      {/* Meal type filter */}
      <div className="flex gap-1.5 overflow-x-auto scrollbar-hide pb-0.5">
        {SLOT_OPTIONS.map(opt => {
          const active = slot === opt.key;
          return (
            <button
              key={opt.key}
              onClick={() => onSlotChange(opt.key)}
              className={`shrink-0 flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-[10px] font-bold transition-all active:scale-95 ${
                active
                  ? 'bg-gray-800 text-white shadow-sm'
                  : 'bg-gray-100 text-gray-500 hover:bg-gray-200'
              }`}
              aria-pressed={active}
              aria-label={`Filter by ${opt.label}`}
            >
              <span>{opt.icon}</span>
              <span>{opt.label}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
};

export default QuickFilters;
