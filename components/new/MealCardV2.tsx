import React from 'react';
import { Minus, Plus, Trash2, ChevronRight } from 'lucide-react';
import type { TraySlotItem, Category } from '../../types/meal';
import { CategoryPopover } from './CategoryPopover';

interface MealCardV2Props {
  item: TraySlotItem;
  slotKey: string;
  onSwap: (slotKey: string, itemId: string, category: Category, optionId: string) => void;
  onRemove: (slotKey: string, itemId: string) => void;
  onQuantityChange: (slotKey: string, itemId: string, delta: number) => void;
}

const CATEGORY_ROWS: { key: Category; icon: string; label: string }[] = [
  { key: 'gravy', icon: '🍲', label: 'Gravy' },
  { key: 'roti', icon: '🫓', label: 'Bread' },
  { key: 'rice', icon: '🍚', label: 'Rice' },
  { key: 'sides', icon: '🥗', label: 'Sides' },
  { key: 'beverages', icon: '🥤', label: 'Beverages' },
];

export const MealCardV2: React.FC<MealCardV2Props> = ({
  item,
  slotKey,
  onSwap,
  onRemove,
  onQuantityChange,
}) => {
  const [popoverCategory, setPopoverCategory] = React.useState<Category | null>(null);

  const currentLabel = (cat: Category): string => {
    const c = item.categories[cat];
    if (cat === 'sides' || cat === 'beverages') {
      const arr = c as typeof item.categories.sides;
      if (arr.length === 0) return 'None';
      return arr.map((o) => o.name).join(', ');
    }
    const single = c as typeof item.categories.gravy;
    return single ? single.name : 'None';
  };

  const hasCategory = (cat: Category): boolean => {
    return item.availableOptions[cat].length > 0;
  };

  return (
    <>
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
        <div className="px-4 py-3 flex items-center justify-between border-b border-gray-50">
          <div className="flex items-center gap-2">
            <span className="text-xl">{item.icon}</span>
            <span className="font-bold text-sm text-gray-900">{item.name}</span>
          </div>
          <div className="flex items-center gap-1">
            <button
              onClick={() => onQuantityChange(slotKey, item.id, -1)}
              className="w-7 h-7 rounded-lg flex items-center justify-center bg-gray-100 text-gray-500 active:scale-90 transition-all"
            >
              <Minus size={12} />
            </button>
            <span className="w-6 text-center text-xs font-bold text-gray-900">{item.quantity}</span>
            <button
              onClick={() => onQuantityChange(slotKey, item.id, 1)}
              className="w-7 h-7 rounded-lg flex items-center justify-center bg-gray-100 text-gray-500 active:scale-90 transition-all"
            >
              <Plus size={12} />
            </button>
            <button
              onClick={() => onRemove(slotKey, item.id)}
              className="w-7 h-7 rounded-lg flex items-center justify-center text-gray-300 hover:text-red-400 active:scale-90 transition-all ml-1"
            >
              <Trash2 size={13} />
            </button>
          </div>
        </div>

        <div className="divide-y divide-gray-50">
          {CATEGORY_ROWS.map(({ key, icon, label }) => {
            if (!hasCategory(key)) return null;
            return (
              <button
                key={key}
                onClick={() => setPopoverCategory(key)}
                className="w-full flex items-center gap-3 px-4 py-2.5 active:bg-gray-50 transition-all text-left"
              >
                <span className="text-base">{icon}</span>
                <span className="text-[11px] font-bold text-gray-400 uppercase tracking-wider w-14 flex-shrink-0">
                  {label}
                </span>
                <span className="flex-1 text-sm font-medium text-gray-700 truncate">
                  {currentLabel(key)}
                </span>
                <ChevronRight size={14} className="text-gray-300 flex-shrink-0" />
              </button>
            );
          })}
        </div>
      </div>

      {popoverCategory && (
        <CategoryPopover
          item={item}
          slotKey={slotKey}
          initialCategory={popoverCategory}
          onSwap={onSwap}
          onClose={() => setPopoverCategory(null)}
        />
      )}
    </>
  );
};
