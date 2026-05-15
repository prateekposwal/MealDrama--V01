import React, { useEffect, useState, useMemo, useCallback } from 'react';
import { ArrowLeft, Save, Plus, AlertTriangle } from 'lucide-react';
import { SlotCard } from './SlotCard';
import MealSearch from './MealSearch';
import { useStore } from '../../store/useStore';
import { useTrayStore, type TrayItem } from '../../store/useTrayStore';
import { logEvent } from '../../lib/analytics';
import type { Dish } from '../../constants/dishLibrary';
import { getGravyLabel } from '../../constants/dishLibrary';
import type { Meal, MealType } from '../../types/tray';

const SLOT_META: Record<string, { icon: string; time: string; color: string }> = {
  Breakfast: { icon: '🌅', time: '8:00 AM', color: 'border-amber-100' },
  Lunch: { icon: '☀️', time: '1:00 PM', color: 'border-blue-100' },
  Snacks: { icon: '🥜', time: '4:00 PM', color: 'border-orange-100' },
  Dinner: { icon: '🌙', time: '8:00 PM', color: 'border-violet-100' },
};

interface VariantOption {
  id: string;
  name: string;
  icon?: string;
}

interface VariantOptions {
  gravy: VariantOption[];
  roti: VariantOption[];
  rice: VariantOption[];
  sides: VariantOption[];
  beverages: VariantOption[];
}

const VARIANT_OPTIONS_DEFAULT: VariantOptions = {
  gravy: [
    { id: 'Default', name: 'Default', icon: '🍲' },
    { id: 'Tadka', name: 'Tadka', icon: '🌶️' },
    { id: 'Dry', name: 'Dry', icon: '🥘' },
    { id: 'Curry', name: 'Curry', icon: '🍛' },
    { id: 'Fried', name: 'Fried', icon: '🍳' },
  ],
  roti: [
    { id: 'Phulka', name: 'Phulka', icon: '🫓' },
    { id: 'Roti', name: 'Roti', icon: '🫓' },
    { id: 'Naan', name: 'Naan', icon: '🍞' },
    { id: 'Tandoori Naan', name: 'Tandoori Naan', icon: '🔥' },
    { id: 'Missi Roti', name: 'Missi Roti', icon: '🌾' },
  ],
  rice: [
    { id: 'Plain', name: 'Plain', icon: '🍚' },
    { id: 'Jeera', name: 'Jeera', icon: '🌿' },
    { id: 'Tomato', name: 'Tomato', icon: '🍅' },
    { id: 'Pulao', name: 'Pulao', icon: '🍛' },
  ],
  sides: [
    { id: 'Salad', name: 'Salad', icon: '🥗' },
    { id: 'Roasted Peanuts', name: 'Peanuts', icon: '🥜' },
    { id: 'Fruit', name: 'Fruit', icon: '🍎' },
    { id: 'Jalebi', name: 'Jalebi', icon: '🍯' },
    { id: 'Samosa', name: 'Samosa', icon: '🥟' },
    { id: 'Gulab Jamun', name: 'Gulab Jamun', icon: '🍩' },
  ],
  beverages: [
    { id: 'Chaas', name: 'Chaas', icon: '🥛' },
    { id: 'Nimbu Pani', name: 'Nimbu Pani', icon: '🍋' },
    { id: 'Coffee', name: 'Coffee', icon: '☕' },
    { id: 'Tea', name: 'Tea', icon: '🍵' },
    { id: 'Lassi', name: 'Lassi', icon: '🥤' },
  ],
};

interface TrayBuilderScreenProps {
  date: string;
  slot: string;
  onClose: () => void;
}

interface LocalItem {
  id: string;
  mealId: string;
  name: string;
  icon?: string;
  quantity: number;
  gravyStyle: string;
  rotiType: string;
  riceType: string;
  sides: string[];
  beverages: string[];
  sortOrder: number;
}

let _nextId = 0;
function uid() {
  return `tmp-${Date.now()}-${++_nextId}`;
}

function dishToMeal(dish: Dish): Meal {
  return {
    id: dish.id,
    name: dish.name,
    icon: dish.icon,
    region: dish.region as Meal['region'],
    baseGravy: dish.gravyType,
    gravyOptions: dish.gravyType ? [getGravyLabel(dish.gravyType)] : undefined,
    rotiOptions: dish.rotiOptions,
    riceOptions: dish.riceOptions,
    sideOptions: dish.sideOptions,
    beverageOptions: dish.beverageOptions,
  };
}

function trayItemToLocal(item: TrayItem): LocalItem {
  return {
    id: item.id,
    mealId: item.meal_id,
    name: item.name,
    icon: item.icon,
    quantity: item.quantity,
    gravyStyle: item.gravy || 'Default',
    rotiType: item.roti || 'Phulka',
    riceType: item.rice || 'Plain',
    sides: item.sides,
    beverages: item.beverages,
    sortOrder: 0,
  };
}

export const TrayBuilderScreen: React.FC<TrayBuilderScreenProps> = ({ date, slot, onClose }) => {
  const { dishes, user, setToast } = useStore();
  const trayStore = useTrayStore();

  const mealType = slot.toLowerCase() as MealType;

  const existingItems = trayStore.getMeals(date, mealType);

  const [items, setItems] = useState<LocalItem[]>(() =>
    existingItems.map(trayItemToLocal)
  );
  const [totalServings, setTotalServings] = useState(1);
  const [showMealSearch, setShowMealSearch] = useState(false);
  const [saving, setSaving] = useState(false);

  const meta = SLOT_META[slot] || { icon: '🍽️', time: '', color: 'border-gray-200' };

  const mergedVariants: VariantOptions = useMemo(() => {
    const mealIds = items.filter(i => i.mealId).map(i => i.mealId);
    const mealDishes = dishes.filter(d => mealIds.includes(d.id));

    const gravies = new Set<string>(['Default']);
    const rotis = new Set<string>();
    const rices = new Set<string>();
    const sides = new Set<string>();
    const bevs = new Set<string>();

    mealDishes.forEach(d => {
      if (d.gravyType) gravies.add(getGravyLabel(d.gravyType));
      d.rotiOptions?.forEach(r => rotis.add(r));
      d.riceOptions?.forEach(r => rices.add(r));
      d.sideOptions?.forEach(s => sides.add(s));
      d.beverageOptions?.forEach(b => bevs.add(b));
    });

    if (gravies.size === 1) {
      VARIANT_OPTIONS_DEFAULT.gravy.forEach(g => gravies.add(g.name));
    }
    if (rotis.size === 0) VARIANT_OPTIONS_DEFAULT.roti.forEach(r => rotis.add(r.name));
    if (rices.size === 0) VARIANT_OPTIONS_DEFAULT.rice.forEach(r => rices.add(r.name));
    if (sides.size === 0) VARIANT_OPTIONS_DEFAULT.sides.forEach(s => sides.add(s.name));
    if (bevs.size === 0) VARIANT_OPTIONS_DEFAULT.beverages.forEach(b => bevs.add(b.name));

    return {
      gravy: [...gravies].map(id => ({ id, name: id })),
      roti: [...rotis].map(id => ({ id, name: id })),
      rice: [...rices].map(id => ({ id, name: id })),
      sides: [...sides].map(id => ({ id, name: id })),
      beverages: [...bevs].map(id => ({ id, name: id })),
    };
  }, [items, dishes]);

  const handleAddMealFromSearch = (dish: Dish) => {
    const defaultGravy = dish.gravyType ? getGravyLabel(dish.gravyType) : 'Default';
    const defaultRoti = (dish.rotiOptions && dish.rotiOptions.length > 0) ? dish.rotiOptions[0] : 'Phulka';
    const defaultRice = (dish.riceOptions && dish.riceOptions.length > 0) ? dish.riceOptions[0] : 'Plain';
    const defaultSides = dish.sideOptions ? dish.sideOptions.slice(0, 2) : [];
    const defaultBeverages = dish.beverageOptions ? dish.beverageOptions.slice(0, 2) : [];

    const newItem: LocalItem = {
      id: uid(),
      mealId: dish.id,
      name: dish.name,
      icon: dish.icon,
      quantity: 1,
      gravyStyle: defaultGravy,
      rotiType: defaultRoti,
      riceType: defaultRice,
      sides: defaultSides,
      beverages: defaultBeverages,
      sortOrder: items.length,
    };
    setItems([...items, newItem]);
    setShowMealSearch(false);
  };

  const handleUpdateItem = (index: number, updates: Partial<LocalItem>) => {
    setItems(items.map((item, i) => i === index ? { ...item, ...updates } : item));
  };

  const handleRemoveItem = (index: number) => {
    setItems(items.filter((_, i) => i !== index));
  };

  const handleSave = useCallback(async () => {
    if (items.length === 0) {
      setToast({ message: 'Add at least one meal to the slot', type: 'error' });
      return;
    }

    setSaving(true);
    const start = performance.now();

    const storeItemIds = new Set(existingItems.map(i => i.id));
    const localItemIds = new Set(items.map(i => i.id));

    for (const item of items) {
      const wasNew = !storeItemIds.has(item.id);
      if (wasNew) {
        const dish = dishes.find(d => d.id === item.mealId);
        if (dish) {
          trayStore.addMealToSlot(date, mealType, dishToMeal(dish), {
            quantity: item.quantity,
          });
          const newItems = trayStore.getMeals(date, mealType);
          const added = newItems.find(i => i.meal_id === item.mealId && i.quantity === item.quantity);
          if (added) {
            trayStore.updateItemInline(date, mealType, added.id, {
              gravy: item.gravyStyle,
              roti: item.rotiType,
              rice: item.riceType,
              sides: item.sides,
              beverages: item.beverages,
            });
          }
        }
      } else {
        trayStore.updateItemInline(date, mealType, item.id, {
          quantity: item.quantity,
          gravy: item.gravyStyle,
          roti: item.rotiType,
          rice: item.riceType,
          sides: item.sides,
          beverages: item.beverages,
        });
      }
    }

    for (const existing of existingItems) {
      if (!localItemIds.has(existing.id)) {
        trayStore.removeMealFromSlot(date, mealType, existing.id);
      }
    }

    const duration = Math.round(performance.now() - start);
    logEvent('slot_save_time_ms', { slot, itemsCount: items.length, duration_ms: duration });
    logEvent('tray_edited', { slot, date, itemsCount: items.length });

    setToast({ message: 'Slot saved!', type: 'success' });
    setTimeout(onClose, 800);
    setSaving(false);
  }, [items, existingItems, date, mealType, slot, dishes, trayStore, setToast, onClose]);

  const isCrowded = items.length > 5;

  return (
    <div className="fixed inset-0 z-50 flex flex-col bg-gray-50">
      <div className="sticky top-0 z-10 px-4 py-3 flex items-center justify-between border-b bg-white border-gray-100">
        <button onClick={onClose} className="w-9 h-9 rounded-xl flex items-center justify-center">
          <ArrowLeft size={18} className="text-gray-900" />
        </button>
        <div className="flex items-center gap-2">
          <span className="text-lg">{meta.icon}</span>
          <div>
            <h2 className="text-sm font-black text-gray-900">{slot}</h2>
            <p className="text-[9px] font-bold text-gray-400">{meta.time}</p>
          </div>
        </div>
        <button
          onClick={handleSave}
          disabled={saving || items.length === 0}
          className={`flex items-center gap-1.5 px-4 py-2 rounded-xl font-bold text-sm transition-all ${
            saving || items.length === 0
              ? 'bg-gray-200 text-gray-400'
              : 'bg-[#FF385C] text-white active:scale-[0.98]'
          }`}
        >
          <Save size={14} />
          Save
        </button>
      </div>

      {isCrowded && (
        <div className="mx-4 mt-3 px-3 py-2 rounded-xl flex items-center gap-2 bg-amber-50 border border-amber-100">
          <AlertTriangle size={12} className="text-amber-600 flex-shrink-0" />
          <span className="text-[10px] font-bold text-amber-700">
            Slot crowded ({items.length} items). Consider splitting.
          </span>
        </div>
      )}

      <div className="mx-4 mt-3 px-4 py-3 rounded-xl flex items-center justify-between bg-white border border-gray-100">
        <span className="text-xs font-bold text-gray-600">Servings</span>
        <div className="flex items-center gap-3">
          <button
            onClick={() => setTotalServings(Math.max(1, totalServings - 1))}
            className="w-8 h-8 rounded-lg flex items-center justify-center active:scale-90 transition-all bg-gray-100 text-gray-500"
          >
            -
          </button>
          <span className="text-sm font-bold w-6 text-center text-gray-900">
            {totalServings}
          </span>
          <button
            onClick={() => setTotalServings(Math.min(12, totalServings + 1))}
            className="w-8 h-8 rounded-lg flex items-center justify-center active:scale-90 transition-all bg-gray-100 text-gray-500"
          >
            +
          </button>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto px-4 py-4 space-y-3">
        {items.map((item, idx) => (
          <SlotCard
            key={item.id || idx}
            date={date}
            slot={slot}
            slotIcon={meta.icon}
            slotTime={meta.time}
            items={[item as any]}
            totalServings={totalServings}
            suggestions={[]}
            onAddItem={() => {}}
            onUpdateItem={(i, updates) => handleUpdateItem(idx, updates as any)}
            onRemoveItem={() => handleRemoveItem(idx)}
            onApproveSuggestion={() => {}}
            onRejectSuggestion={() => {}}
            variantOptions={mergedVariants}
          />
        ))}

        {items.length === 0 && (
          <div className="text-center py-12 rounded-2xl border-2 border-dashed border-gray-200">
            <span className="text-3xl block mb-3">🍽️</span>
            <p className="text-sm font-bold text-gray-400">
              No meals added to {slot} yet
            </p>
            <p className="text-xs mt-1 text-gray-400">
              Tap below to add from your tray
            </p>
          </div>
        )}

        <div className="grid grid-cols-2 gap-3">
          <button
            onClick={() => setShowMealSearch(true)}
            className="py-3.5 rounded-xl font-bold text-sm transition-all active:scale-[0.98] flex items-center justify-center gap-2 bg-white text-gray-900 border border-gray-200"
          >
            <Plus size={14} />
            Add from Tray
          </button>
          <button
            onClick={() => setShowMealSearch(true)}
            className="py-3.5 rounded-xl font-bold text-sm transition-all active:scale-[0.98] flex items-center justify-center gap-2 bg-[#FF385C]/5 text-[#FF385C] border border-[#FF385C]/15"
          >
            <Plus size={14} />
            Search Meals
          </button>
        </div>
      </div>

      {showMealSearch && (
        <MealSearch
          onSelect={(dish) => handleAddMealFromSearch(dish)}
          onClose={() => setShowMealSearch(false)}
        />
      )}
    </div>
  );
};
