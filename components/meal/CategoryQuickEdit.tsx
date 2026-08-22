import React, { useMemo, useCallback } from 'react';
import { X, Plus, Minus } from 'lucide-react';
import { useBackButtonClose } from '../../hooks/useBackButtonClose';

const COMMON_OPTIONS: Record<string, string[]> = {
  Gravy: ['Dal Tadka', 'Dal Makhani', 'Chole', 'Rajma', 'Sambar', 'Kadhi', 'Mixed Veg Curry', 'Paneer Butter Masala', 'Egg Curry', 'Fish Curry', 'Chicken Curry'],
  Bread: ['Tandoori Roti', 'Phulka', 'Naan', 'Paratha', 'Puri', 'Bhatura', 'Missi Roti', 'Rumali Roti', 'Dosa', 'Appam'],
  Rice: ['Steamed Rice', 'Jeera Rice', 'Lemon Rice', 'Coconut Rice', 'Pulao', 'Biryani', 'Fried Rice', 'Curd Rice'],
  Sides: ['Curd', 'Pickle', 'Salad', 'Raita', 'Papad', 'Chutney', 'Sambharo', 'Kachumber', 'Onion Salad', 'Lemon Wedge', 'Green Salad'],
  Beverages: ['Chai', 'Coffee', 'Buttermilk', 'Lassi', 'Jaljeera', 'Chaas', 'Water', 'Nimbu Pani', 'Masala Chai', 'Green Tea', 'Filter Coffee'],
  Dessert: ['Gulab Jamun', 'Ice Cream', 'Kheer', 'Rasmalai', 'Fruit Salad', 'Gajar Halwa', 'Jalebi', 'Payasam', 'Phirni', 'Shrikhand'],
};

interface CategoryQuickEditProps {
  isOpen: boolean;
  category: string;
  currentItems: { name: string; totalQty: number }[];
  onClose: () => void;
  onUpdateQty: (name: string, delta: number) => void;
  onAddItem: (name: string) => void;
}

export const CategoryQuickEdit: React.FC<CategoryQuickEditProps> = ({
  isOpen, category, currentItems, onClose, onUpdateQty, onAddItem,
}) => {
  useBackButtonClose(isOpen, onClose);
  const suggestions = useMemo(() => COMMON_OPTIONS[category] ?? [], [category]);
  const currentSet = useMemo(() => new Set(currentItems.map(i => i.name.toLowerCase())), [currentItems]);
  const available = useMemo(() => suggestions.filter(s => !currentSet.has(s.toLowerCase())), [suggestions, currentSet]);

  const handleAdd = useCallback((name: string) => {
    onAddItem(name);
  }, [onAddItem]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center" onClick={onClose}>
      <div className="fixed inset-0 bg-black/30 backdrop-blur-sm" />
      <div
        className="relative bg-white rounded-t-[28px] sm:rounded-[28px] w-full max-w-lg mx-auto max-h-[70vh] overflow-y-auto px-5 pt-4 pb-[max(1.5rem,env(safe-area-inset-bottom,0px))]"
        onClick={e => e.stopPropagation()}
      >
        <div className="flex items-center justify-between mb-5">
          <h3 className="text-base font-extrabold tracking-tight">{category}</h3>
          <button onClick={onClose} className="w-8 h-8 rounded-xl flex items-center justify-center bg-gray-100 active:scale-90 transition-all">
            <X size={14} />
          </button>
        </div>

        {currentItems.length > 0 && (
          <div className="mb-4 space-y-1.5">
            <span className="text-xs font-black uppercase tracking-widest text-gray-400">Current</span>
            {currentItems.map(i => (
              <div key={i.name} className="flex items-center justify-between px-4 py-3 rounded-xl bg-gray-50 border border-gray-100">
                <span className="text-sm font-bold text-gray-800">{i.name}</span>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => onUpdateQty(i.name, -1)}
                    className="w-8 h-8 rounded-lg flex items-center justify-center bg-white border border-gray-200 text-gray-500 active:scale-90"
                  >
                    <Minus size={12} />
                  </button>
                  <span className="text-sm font-bold text-gray-700 tabular-nums min-w-[20px] text-center">{i.totalQty}</span>
                  <button
                    onClick={() => onUpdateQty(i.name, 1)}
                    className="w-8 h-8 rounded-lg flex items-center justify-center bg-white border border-gray-200 text-gray-500 active:scale-90"
                  >
                    <Plus size={12} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}

        <div className="space-y-1.5">
          <span className="text-xs font-black uppercase tracking-widest text-gray-400">Add {category}</span>
          <div className="flex flex-wrap gap-2">
            {available.length === 0 && (
              <p className="text-sm text-gray-400 py-2">All common options added — type a custom name below</p>
            )}
            {available.map(s => (
              <button
                key={s}
                onClick={() => handleAdd(s)}
                className="text-xs font-bold px-3 py-2 rounded-xl border border-gray-200 bg-white text-gray-700 hover:border-emerald-300 hover:text-emerald-600 active:scale-95 transition-all"
              >
                + {s}
              </button>
            ))}
          </div>
        </div>

        <div className="mt-3">
          <input
            type="text"
            placeholder="Add custom item..."
            onKeyDown={e => {
              if (e.key === 'Enter' && (e.target as HTMLInputElement).value.trim()) {
                handleAdd((e.target as HTMLInputElement).value.trim());
                (e.target as HTMLInputElement).value = '';
              }
            }}
            className="w-full text-sm font-medium px-4 py-3 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-emerald-300 focus:border-emerald-400"
          />
        </div>
      </div>
    </div>
  );
};

export default CategoryQuickEdit;
