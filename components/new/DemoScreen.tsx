import React, { useState, useMemo } from 'react';
import { Plus, X, Sparkles, RotateCcw } from 'lucide-react';
import { useMealStore } from '../../store/mealStore';
import { getMockMealCards, SLOT_MOCK_MEALS } from '../../mock/mealCards';
import { MealCardV2 } from './MealCardV2';
import type { Category, MealCardData } from '../../types/meal';

const SLOT_CONFIG: Record<string, { label: string; icon: string; color: string; bg: string }> = {
  breakfast: { label: 'Breakfast', icon: '🌅', color: 'border-amber-200', bg: 'bg-amber-50' },
  lunch: { label: 'Lunch', icon: '☀️', color: 'border-blue-200', bg: 'bg-blue-50' },
  snacks: { label: 'Snacks', icon: '🥜', color: 'border-orange-200', bg: 'bg-orange-50' },
  dinner: { label: 'Dinner', icon: '🌙', color: 'border-violet-200', bg: 'bg-violet-50' },
};

const getTodayKey = () => {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
};

const QUICK_MEALS = getMockMealCards();

const DemoScreen: React.FC = () => {
  const today = getTodayKey();
  const slotKeys = useMemo(() => ({
    breakfast: `${today}-breakfast`,
    lunch: `${today}-lunch`,
    snacks: `${today}-snacks`,
    dinner: `${today}-dinner`,
  }), [today]);

  const slots = useMealStore((s) => s.slots);
  const addItem = useMealStore((s) => s.addItem);
  const swapCategory = useMealStore((s) => s.swapCategory);
  const removeItem = useMealStore((s) => s.removeItem);
  const updateQuantity = useMealStore((s) => s.updateQuantity);
  const clearSlot = useMealStore((s) => s.clearSlot);

  const [showPicker, setShowPicker] = useState<string | null>(null);
  const [pickerSearch, setPickerSearch] = useState('');
  const [addedMessage, setAddedMessage] = useState<string | null>(null);

  const availableMeals = useMemo(() => {
    const slot = showPicker;
    if (!slot || !SLOT_MOCK_MEALS[slot]) return QUICK_MEALS;
    const allowed = SLOT_MOCK_MEALS[slot];
    return QUICK_MEALS.filter((m) => allowed.includes(m.id));
  }, [showPicker]);

  const filteredMeals = useMemo(() => {
    if (!pickerSearch.trim()) return availableMeals;
    const q = pickerSearch.toLowerCase();
    return availableMeals.filter(
      (m) => m.name.toLowerCase().includes(q) || m.region.toLowerCase().includes(q)
    );
  }, [availableMeals, pickerSearch]);

  const handleAddMeal = (slotKey: string, meal: MealCardData) => {
    addItem(slotKey, meal);
    setShowPicker(null);
    setPickerSearch('');
    setAddedMessage(`${meal.icon} ${meal.name} added!`);
    setTimeout(() => setAddedMessage(null), 2000);
  };

  const handleSwap = (slotKey: string, itemId: string, category: Category, optionId: string) => {
    swapCategory(slotKey, itemId, category, optionId);
  };

  const handleRemove = (slotKey: string, itemId: string) => {
    removeItem(slotKey, itemId);
  };

  const handleQuantityChange = (slotKey: string, itemId: string, delta: number) => {
    updateQuantity(slotKey, itemId, delta);
  };

  return (
    <div className="min-h-screen bg-gray-50 font-sans">
      {addedMessage && (
        <div className="fixed top-4 left-4 right-4 max-w-lg mx-auto z-50 bg-green-600 text-white px-4 py-3 rounded-2xl shadow-xl flex items-center gap-2 animate-in slide-in-from-top-2">
          <Sparkles size={16} />
          <span className="font-medium text-sm">{addedMessage}</span>
        </div>
      )}

      <header className="sticky top-0 z-10 bg-white border-b border-gray-100 px-4 py-3">
        <div className="max-w-lg mx-auto">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-lg font-black text-gray-900">MealDrama</h1>
              <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">
                User Freedom Demo
              </p>
            </div>
            <div className="flex items-center gap-1 text-xs font-bold text-gray-400">
              <span className="text-base">🗓️</span>
              {today}
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-lg mx-auto p-4 space-y-4 pb-24">
        {(['breakfast', 'lunch', 'snacks', 'dinner'] as const).map((slot) => {
          const cfg = SLOT_CONFIG[slot];
          const sk = slotKeys[slot];
          const items = slots[sk] || [];
          return (
            <div key={slot} className={`rounded-2xl border ${cfg.color} ${cfg.bg} overflow-hidden`}>
              <div className="px-4 py-3 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="text-lg">{cfg.icon}</span>
                  <span className="font-black text-sm text-gray-900">{cfg.label}</span>
                  <span className="text-[10px] font-bold text-gray-400">
                    ({items.length})
                  </span>
                </div>
                <div className="flex items-center gap-1">
                  {items.length > 0 && (
                    <button
                      onClick={() => clearSlot(sk)}
                      className="p-1.5 rounded-lg text-gray-300 hover:text-red-400 hover:bg-red-50 transition-all"
                      title="Clear slot"
                    >
                      <RotateCcw size={13} />
                    </button>
                  )}
                  <button
                    onClick={() => {
                      setShowPicker(slot);
                      setPickerSearch('');
                    }}
                    className="flex items-center gap-1 px-3 py-1.5 rounded-xl bg-white text-gray-700 border border-gray-200 text-xs font-bold hover:border-gray-300 active:scale-95 transition-all shadow-sm"
                    >
                      <Plus size={12} />
                    Add
                  </button>
                </div>
              </div>

              {items.length > 0 && (
                <div className="px-4 pb-4 space-y-3">
                  {items.map((item) => (
                    <MealCardV2
                      key={item.id}
                      item={item}
                      slotKey={sk}
                      onSwap={handleSwap}
                      onRemove={handleRemove}
                      onQuantityChange={handleQuantityChange}
                    />
                  ))}
                </div>
              )}

              {items.length === 0 && (
                <div className="px-4 pb-4">
                  <div className="rounded-xl border-2 border-dashed border-gray-200 bg-white/60 py-6 text-center">
                    <p className="text-xs font-bold text-gray-400">
                      No meals added yet
                    </p>
                    <p className="text-[10px] text-gray-300 mt-1">
                      Tap "Add" to pick a meal
                    </p>
                  </div>
                </div>
              )}
            </div>
          );
        })}

        <div className="text-center pt-2 pb-4">
          <p className="text-[9px] font-bold text-gray-300 uppercase tracking-widest">
            Tap any category on a meal card to swap freely
          </p>
        </div>
      </div>

      {showPicker && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center">
          <div className="absolute inset-0 bg-black/30" onClick={() => { setShowPicker(null); setPickerSearch(''); }} />
          <div className="relative w-full max-w-sm mx-4 bg-white rounded-2xl shadow-2xl overflow-hidden animate-in slide-in-from-bottom-4 max-h-[80vh] flex flex-col">
            <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100">
              <span className="font-bold text-sm text-gray-900">
                {SLOT_CONFIG[showPicker]?.icon} Add to {SLOT_CONFIG[showPicker]?.label}
              </span>
              <button
                onClick={() => { setShowPicker(null); setPickerSearch(''); }}
                className="p-1.5 hover:bg-gray-100 rounded-xl"
              >
                <X size={16} className="text-gray-400" />
              </button>
            </div>

            <div className="px-4 py-2">
              <input
                type="text"
                placeholder="Search meals..."
                value={pickerSearch}
                onChange={(e) => setPickerSearch(e.target.value)}
                className="w-full px-3 py-2 rounded-xl bg-gray-100 text-sm text-gray-900 placeholder-gray-400 border-0 focus:ring-2 focus:ring-[#FF385C]/20 focus:outline-none"
              />
            </div>

            <div className="flex-1 overflow-y-auto p-4 space-y-2">
              {filteredMeals.length === 0 ? (
                <p className="text-sm text-gray-400 text-center py-8">No meals found</p>
              ) : (
                filteredMeals.map((meal) => (
                  <button
                    key={meal.id}
                    onClick={() => handleAddMeal(slotKeys[showPicker], meal)}
                    className="w-full flex items-center gap-3 px-3 py-3 rounded-xl bg-white border border-gray-100 hover:border-gray-200 active:scale-[0.98] transition-all text-left shadow-sm"
                  >
                    <span className="text-2xl">{meal.icon}</span>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-bold text-gray-900 truncate">{meal.name}</p>
                      <p className="text-[10px] font-medium text-gray-400 capitalize">{meal.region} · {meal.tags.join(', ')}</p>
                    </div>
                    <div className="flex flex-wrap gap-1 max-w-[120px]">
                      {(['gravy', 'roti', 'rice', 'sides', 'beverages'] as const).map((cat) => {
                        const has = meal.categories[cat];
                        if (!has || (Array.isArray(has) && has.length === 0)) return null;
                        const icon = cat === 'gravy' ? '🍲' : cat === 'roti' ? '🫓' : cat === 'rice' ? '🍚' : cat === 'sides' ? '🥗' : '🥤';
                        return <span key={cat} className="text-xs">{icon}</span>;
                      })}
                    </div>
                  </button>
                ))
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default DemoScreen;
