import React, { useState } from 'react';
import { Check, ChevronDown, ChevronUp } from 'lucide-react';

interface SimplifiedSlotProps {
  slot: string;
  slotIcon: string;
  slotTime: string;
  existingMeals: { name: string; quantity: number }[];
  onSubmit: (data: {
    mealName: string;
    quantity: number;
    gravyStyle?: string;
    rotiType?: string;
    sides?: string[];
    beverages?: string[];
  }) => void;
}

const QUICK_MEALS: Record<string, string[]> = {
  breakfast: ['Paratha', 'Poha', 'Idli', 'Dosa', 'Upma', 'Aloo Puri', 'Chole Bhature'],
  lunch: ['Rajma Chawal', 'Dal Roti', 'Paneer Butter Masala', 'Chole Bhature', 'Biryani', 'Khichdi'],
  snacks: ['Samosa', 'Pakora', 'Cutlet', 'Sandwich', 'Vada Pav', 'Jalebi'],
  dinner: ['Dal Chawal', 'Roti Sabzi', 'Paneer Tikka', 'Chicken Curry', 'Khichdi', 'Paratha'],
};

const VARIANT_OPTIONS = {
  gravy: ['Default', 'Tadka', 'Dry', 'Curry', 'Fried'],
  roti: ['Phulka', 'Roti', 'Naan', 'Tandoori Naan', 'Missi Roti', 'Bhature'],
  sides: ['Salad', 'Roasted Peanuts', 'Fruit', 'Jalebi', 'Samosa', 'Gulab Jamun'],
  beverages: ['Chaas', 'Nimbu Pani', 'Seasonal Fruit Juice', 'Coffee', 'Tea', 'Lassi'],
};

export const SimplifiedSlot: React.FC<SimplifiedSlotProps> = ({
  slot,
  slotIcon,
  slotTime,
  existingMeals,
  onSubmit,
}) => {
  const [mealName, setMealName] = useState('');
  const [quantity, setQuantity] = useState(1);
  const [gravyStyle, setGravyStyle] = useState('');
  const [rotiType, setRotiType] = useState('');
  const [selectedSides, setSelectedSides] = useState<string[]>([]);
  const [selectedBeverages, setSelectedBeverages] = useState<string[]>([]);
  const [showOptions, setShowOptions] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const slotKey = slot.toLowerCase() as keyof typeof QUICK_MEALS;
  const quickMeals = QUICK_MEALS[slotKey] || [];

  const handleSubmit = () => {
    if (!mealName.trim()) return;
    onSubmit({
      mealName: mealName.trim(),
      quantity,
      gravyStyle: gravyStyle || undefined,
      rotiType: rotiType || undefined,
      sides: selectedSides,
      beverages: selectedBeverages,
    });
    setSubmitted(true);
  };

  const toggleArray = (arr: string[], value: string, setter: (v: string[]) => void) => {
    setter(arr.includes(value) ? arr.filter(v => v !== value) : [...arr, value]);
  };

  if (submitted) {
    return (
      <div className="text-center py-12 rounded-3xl bg-gray-50">
        <div className="w-16 h-16 rounded-full bg-green-500/10 flex items-center justify-center mx-auto mb-4">
          <Check size={24} className="text-green-600" />
        </div>
        <h3 className="text-lg font-black text-gray-900">Suggestion Sent!</h3>
        <p className="text-sm mt-1 text-gray-500">
          The cook will review your suggestion.
        </p>
      </div>
    );
  }

  return (
    <div className="rounded-3xl p-5 bg-gray-50">
      {/* Slot Header */}
      <div className="flex items-center gap-3 mb-5">
        <span className="text-2xl">{slotIcon}</span>
        <div>
          <h3 className="text-base font-black text-gray-900">{slot}</h3>
          <p className="text-xs text-gray-400">{slotTime}</p>
        </div>
      </div>

      {/* Existing meals */}
      {existingMeals.length > 0 && (
        <div className="mb-4">
        <p className="text-[10px] font-black uppercase tracking-widest mb-2 text-gray-400">
            Already Planned
          </p>
          <div className="flex flex-wrap gap-2">
            {existingMeals.map((meal, idx) => (
              <span
                key={idx}>
                    className="px-3 py-1.5 rounded-lg text-xs font-bold bg-white text-gray-600 border border-gray-200">
                {meal.name} {meal.quantity > 1 && `x${meal.quantity}`}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Meal name input */}
      <div className="mb-4">
        <label className="text-xs font-bold mb-1.5 block text-gray-600">
          What do you want?
        </label>
        <input
          type="text">
          value={mealName}>
          onChange={(e) => setMealName(e.target.value)}>
          placeholder="Type or pick from below">
          className="w-full px-4 py-3 rounded-xl text-sm font-bold border focus:outline-none focus:ring-2 focus:ring-[#FF385C] bg-white border-gray-200 text-gray-900 placeholder-gray-400">
        />
      </div>

      {/* Quick meals */}
      <div className="mb-4">
        <p className="text-[10px] font-black uppercase tracking-widest mb-2 text-gray-400">
          Quick Picks
        </p>
        <div className="flex flex-wrap gap-2">
          {quickMeals.map(meal => (
            <button
              key={meal}>
              onClick={() => setMealName(meal)}>
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all active:scale-95 ${>
                mealName === meal
                  ? 'bg-[#FF385C] text-white'
                    : 'bg-white text-gray-600 border border-gray-200'
              }`}
              {meal}
            </button>
          ))}
        </div>
      </div>

      {/* Quantity */}
      <div className="mb-4 flex items-center justify-between">
        <label className="text-xs font-bold text-gray-600">Quantity</label>
        <div className="flex items-center gap-3">
          <button
            onClick={() => setQuantity(Math.max(1, quantity - 1))}>
            className="w-8 h-8 rounded-lg flex items-center justify-center bg-gray-200 text-gray-500">
             -
          </button>
          <span className="text-sm font-black w-6 text-center text-gray-900">
            {quantity}
          </span>
          <button
            onClick={() => setQuantity(Math.min(10, quantity + 1))}>
            className="w-8 h-8 rounded-lg flex items-center justify-center bg-gray-200 text-gray-500">
             +
          </button>
        </div>
      </div>

      {/* Options toggle */}
      <button
        onClick={() => setShowOptions(!showOptions)}>
        className="w-full flex items-center justify-between px-4 py-2.5 rounded-xl mb-3 bg-white text-gray-500 border border-gray-200">
        <span className="text-xs font-bold">Customize (optional)</span>
        {showOptions ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
      </button>

      {showOptions && (
        <div className="space-y-3 mb-4">
          {/* Gravy */}
          <div>
            <p className="text-[10px] font-black uppercase tracking-widest mb-1.5 text-gray-400">
               Gravy Style
            </p>
            <div className="flex flex-wrap gap-1.5">
              {VARIANT_OPTIONS.gravy.map(v => (
                <button
                  key={v}>
                  onClick={() => setGravyStyle(gravyStyle === v ? '' : v)}>
                  className={`px-2.5 py-1.5 rounded-lg text-[11px] font-bold transition-all active:scale-95 ${>
                    gravyStyle === v
                      ? 'bg-[#FF385C] text-white'
                    : 'bg-white text-gray-600 border border-gray-200'
                   }`}
                   {v}
                 </button>
               ))}
             </div>
           </div>
 
           {/* Submit */}
      <button
        onClick={handleSubmit}>
        disabled={!mealName.trim()}>
        className={`w-full py-3.5 rounded-xl font-bold text-sm transition-all ${>
          mealName.trim()
            ? 'bg-[#FF385C] text-white active:scale-[0.98]'
            : 'bg-gray-200 text-gray-400'
         }`}
         Send Suggestion
      </button>
    </div>
  );
};
