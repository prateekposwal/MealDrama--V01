import React, { useState, useMemo } from 'react';
import { X, Check, Search } from 'lucide-react';
import type { TraySlotItem, Category } from '../../types/meal';

interface CategoryPopoverProps {
  item: TraySlotItem;
  slotKey: string;
  initialCategory: Category;
  onSwap: (slotKey: string, itemId: string, category: Category, optionId: string) => void;
  onClose: () => void;
}

const CATEGORY_META: Record<Category, { label: string; icon: string; plural: string }> = {
  gravy: { label: 'Gravy / Curry', icon: '🍲', plural: 'gravies' },
  roti: { label: 'Bread / Rice', icon: '🫓', plural: 'breads' },
  rice: { label: 'Rice', icon: '🍚', plural: 'rices' },
  sides: { label: 'Sideon', icon: '🥗', plural: 'sides' },
  beverages: { label: 'Peg / Drink', icon: '🥤', plural: 'beverages' },
};

const CATEGORIES: Category[] = ['gravy', 'roti', 'rice', 'sides', 'beverages'];

function hasOptions(item: TraySlotItem, cat: Category): boolean {
  return item.availableOptions[cat].length > 0;
}

export const CategoryPopover: React.FC<CategoryPopoverProps> = ({
  item,
  slotKey,
  initialCategory,
  onSwap,
  onClose,
}) => {
  const [activeCategory, setActiveCategory] = useState<Category>(initialCategory);
  const [search, setSearch] = useState('');

  const currentOptions = item.availableOptions[activeCategory];
  const currentSelection = item.categories[activeCategory];

  const filteredOptions = useMemo(() => {
    if (!search.trim()) return currentOptions;
    const q = search.toLowerCase();
    return currentOptions.filter(o => o.name.toLowerCase().includes(q));
  }, [currentOptions, search]);

  const isSelected = (optionId: string): boolean => {
    if (activeCategory === 'sides' || activeCategory === 'beverages') {
      return (currentSelection as typeof item.categories.sides).some(o => o.id === optionId);
    }
    return (currentSelection as typeof item.categories.gravy)?.id === optionId;
  };

  const handleSelect = (optionId: string) => {
    onSwap(slotKey, item.id, activeCategory, optionId);
  };

  const meta = CATEGORY_META[activeCategory];

  return (
    <div className="fixed inset-0 z-[60] flex items-end sm:items-center justify-center">
      <div className="absolute inset-0 bg-black/30" onClick={onClose} />
      <div className="relative w-full max-w-sm mx-4 bg-white rounded-2xl shadow-2xl overflow-hidden animate-in slide-in-from-bottom-4 max-h-[85vh] flex flex-col">
        <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100">
          <div className="flex items-center gap-2">
            <span className="text-lg">{item.icon}</span>
            <span className="font-bold text-sm text-gray-900">{item.name}</span>
          </div>
          <button onClick={onClose} className="p-1.5 hover:bg-gray-100 rounded-xl">
            <X size={16} className="text-gray-400" />
          </button>
        </div>

        {/* Category Tabs */}
        <div className="flex gap-1 px-3 py-2 border-b border-gray-50 overflow-x-auto">
          {CATEGORIES.map((cat) => {
            const m = CATEGORY_META[cat];
            const active = activeCategory === cat;
            const empty = !hasOptions(item, cat);
            return (
              <button
                key={cat}
                disabled={empty}
                onClick={() => { setActiveCategory(cat); setSearch(''); }}
                className={`flex items-center gap-1 px-3 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition-all flex-shrink-0
                  ${active
                    ? 'bg-[#FF385C] text-white shadow-sm'
                    : empty
                      ? 'text-gray-300 cursor-not-allowed'
                      : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                  }`}
              >
                <span>{m.icon}</span>
                {m.label}
              </button>
            );
          })}
        </div>

        {/* Search */}
        <div className="px-4 pt-3 pb-1">
          <div className="flex items-center gap-2 px-3 py-2 rounded-xl bg-gray-100 border border-gray-200 focus-within:border-[#FF385C]/30 focus-within:ring-2 focus-within:ring-[#FF385C]/10 transition-all">
            <Search size={14} className="text-gray-400 flex-shrink-0" />
            <input
              type="text"
              placeholder={`Search ${meta.plural}...`}
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="flex-1 bg-transparent text-sm text-gray-900 placeholder-gray-400 border-0 focus:outline-none p-0"
              autoFocus
            />
            {search && (
              <button onClick={() => setSearch('')} className="p-0.5 hover:bg-gray-200 rounded-full">
                <X size={12} className="text-gray-400" />
              </button>
            )}
          </div>
        </div>

        {/* Options Grid */}
        <div className="flex-1 overflow-y-auto p-4 pt-2">
          {filteredOptions.length === 0 ? (
            <p className="text-sm text-gray-400 text-center py-8">
              {search ? `No ${meta.plural} match "${search}"` : `No options available`}
            </p>
          ) : (
            <div className="grid grid-cols-2 gap-2">
              {filteredOptions.map((opt) => {
                const selected = isSelected(opt.id);
                return (
                  <button
                    key={opt.id}
                    onClick={() => handleSelect(opt.id)}
                    className={`flex items-center gap-2 px-3 py-2.5 rounded-xl text-sm font-medium transition-all
                      ${selected
                        ? 'bg-[#FF385C]/10 text-[#FF385C] border border-[#FF385C]/20'
                        : 'bg-white text-gray-700 border border-gray-200 hover:border-gray-300 active:scale-[0.98]'
                      }`}
                  >
                    <span>{opt.icon}</span>
                    <span className="flex-1 text-left">{opt.name}</span>
                    {selected && <Check size={14} className="text-[#FF385C] flex-shrink-0" />}
                  </button>
                );
              })}
            </div>
          )}
        </div>

        {/* Footer hint */}
        <div className="px-4 py-2.5 border-t border-gray-100 bg-gray-50">
          <p className="text-[10px] font-bold text-gray-400 text-center">
            {activeCategory === 'sides' || activeCategory === 'beverages'
              ? 'Tap to toggle — pick multiple'
              : 'Tap to swap — single select'}
          </p>
        </div>
      </div>
    </div>
  );
};
