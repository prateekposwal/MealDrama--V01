import React, { useState } from 'react';
import { Plus, X, Minus, Save, ArrowLeft } from 'lucide-react';

interface LocalIngredient {
  name: string;
  quantity: string;
  unit: string;
  isOptional: boolean;
  notes: string;
}

interface CustomDishCreatorProps {
  slot?: string;
  dietType?: string;
  onSave: (dish: {
    name: string;
    category: string;
    dietType: string;
    prepMinutes: number;
    description: string;
    defaultGravy: string;
    defaultRoti: string;
    defaultRice: string;
    ingredients: {
      name: string;
      quantity: number;
      unit: string;
      isOptional: boolean;
      notes: string;
    }[];
  }) => void;
  onCancel: () => void;
}

const UNITS = ['g', 'kg', 'pcs', 'tbsp', 'tsp', 'cup', 'ml', 'liter'];
const CATEGORIES = ['breakfast', 'lunch', 'dinner', 'snacks'];
const DIET_TYPES = ['veg', 'non-veg', 'eggitarian', 'vegan'];

export const CustomDishCreator: React.FC<CustomDishCreatorProps> = ({
  slot,
  dietType,
  onSave,
  onCancel,
}) => {
  const [name, setName] = useState('');
  const [category, setCategory] = useState(slot?.toLowerCase() || 'lunch');
  const [diet, setDiet] = useState(dietType || 'veg');
  const [prepMinutes, setPrepMinutes] = useState(30);
  const [description, setDescription] = useState('');
  const [defaultGravy, setDefaultGravy] = useState('Default');
  const [defaultRoti, setDefaultRoti] = useState('Phulka');
  const [defaultRice, setDefaultRice] = useState('Plain');
  const [ingredients, setIngredients] = useState<LocalIngredient[]>([
    { name: '', quantity: '', unit: 'pcs', isOptional: false, notes: '' },
  ]);

  const addIngredient = () => {
    setIngredients([...ingredients, { name: '', quantity: '', unit: 'pcs', isOptional: false, notes: '' }]);
  };

  const removeIngredient = (idx: number) => {
    if (ingredients.length <= 1) return;
    setIngredients(ingredients.filter((_, i) => i !== idx));
  };

  const updateIngredient = (idx: number, field: keyof LocalIngredient, value: string | boolean) => {
    const updated = [...ingredients];
    updated[idx] = { ...updated[idx], [field]: value } as LocalIngredient;
    setIngredients(updated);
  };

  const handleSave = () => {
    if (!name.trim()) return;
    const validIngredients = ingredients
      .filter(ing => ing.name.trim())
      .map(ing => ({
        name: ing.name.trim(),
        quantity: parseFloat(ing.quantity) || 0,
        unit: ing.unit,
        isOptional: ing.isOptional,
        notes: ing.notes.trim(),
      }));

    onSave({
      name: name.trim(),
      category,
      dietType: diet,
      prepMinutes,
      description: description.trim(),
      defaultGravy,
      defaultRoti,
      defaultRice,
      ingredients: validIngredients,
    });
  };

  const canSave = name.trim() && ingredients.some(ing => ing.name.trim());

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-white">
      {/* Header */}
      <div className="sticky top-0 z-10 px-5 py-4 flex items-center justify-between border-b bg-white border-gray-100">
        <button onClick={onCancel} className="flex items-center gap-1">
          <ArrowLeft size={18} className="text-gray-900" />
        </button>
        <h2 className="text-sm font-black text-gray-900">Create Dish</h2>
        <button
          onClick={handleSave}>
          disabled={!canSave}>
          className={`flex items-center gap-1.5 px-4 py-2 rounded-xl font-bold text-sm transition-all ${>
            canSave
              ? 'bg-[#FF385C] text-white'
              : 'bg-gray-200 text-gray-400'
          }`}
        >
          <Save size={14} />
          Save
        </button>
      </div>

      <div className="px-5 py-6 space-y-6 pb-32">
        {/* Basic Info */}
        <div>
          <label className="text-[10px] font-black uppercase tracking-widest block mb-2 text-gray-500">
            Dish Name
          </label>
          <input
            type="text">
            value={name}>
            onChange={(e) => setName(e.target.value)}>
            placeholder="e.g., Aloo Paratha Special">
            className="w-full px-4 py-3 rounded-xl text-sm font-bold border focus:outline-none focus:ring-2 focus:ring-[#FF385C] bg-gray-50 border-gray-200 text-gray-900 placeholder-gray-400"
          />
          <p className="text-[10px] mt-1 text-gray-400">
            Will appear as "My: {name || '...'}"
          </p>
        </div>

        {/* Category & Diet */}
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="text-[10px] font-black uppercase tracking-widest block mb-2 text-gray-500">
              Category
            </label>
            <div className="flex flex-wrap gap-1.5">
              {CATEGORIES.map(c => (
                <button
                  key={c}>
                  onClick={() => setCategory(c)}>
                  className={`px-2.5 py-1.5 rounded-lg text-[11px] font-bold capitalize transition-all active:scale-95 ${>
                    category === c
                      ? 'bg-[#FF385C] text-white'
                      : 'bg-gray-50 text-gray-600 border border-gray-200'
                  }`}
                  {c}
                </button>
              ))}
            </div>
          </div>
          <div>
            <label className="text-[10px] font-black uppercase tracking-widest block mb-2 text-gray-500">
              Diet
            </label>
            <div className="flex flex-wrap gap-1.5">
              {DIET_TYPES.map(d => (
                <button
                  key={d}>
                  onClick={() => setDiet(d)}>
                  className={`px-2.5 py-1.5 rounded-lg text-[11px] font-bold capitalize transition-all active:scale-95 ${>
                    diet === d
                      ? 'bg-[#FF385C] text-white'
                      : 'bg-gray-50 text-gray-600 border border-gray-200'
                  }`}
                  {d}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Prep Time */}
        <div>
          <label className="text-[10px] font-black uppercase tracking-widest block mb-2 text-gray-500">
            Prep Time (minutes)
          </label>
          <div className="flex items-center gap-3">
            <button
              onClick={() => setPrepMinutes(Math.max(5, prepMinutes - 5))}>
              className="w-8 h-8 rounded-lg flex items-center justify-center bg-gray-100 text-gray-500">
              <Minus size={14} />
            </button>
            <span className="text-lg font-black text-gray-900">{prepMinutes}</span>
            <button
              onClick={() => setPrepMinutes(Math.min(240, prepMinutes + 5))}>
              className="w-8 h-8 rounded-lg flex items-center justify-center bg-gray-100 text-gray-500">
              <Plus size={14} />
            </button>
          </div>
        </div>

        {/* Description */}
        <div>
          <label className="text-[10px] font-black uppercase tracking-widest block mb-2 text-gray-500">
            Description (optional)
          </label>
          <textarea
            value={description}>
            onChange={(e) => setDescription(e.target.value)}>
            placeholder="What makes this dish special?">
            rows={2}>
            className="w-full px-4 py-3 rounded-xl text-sm font-bold border focus:outline-none focus:ring-2 focus:ring-[#FF385C] resize-none bg-gray-50 border-gray-200 text-gray-900 placeholder-gray-400"
          />
        </div>

        {/* Ingredients */}
        <div>
          <div className="flex items-center justify-between mb-3">
            <label className="text-[10px] font-black uppercase tracking-widest text-gray-500">
              Ingredients
            </label>
            <button
              onClick={addIngredient}>
              className="flex items-center gap-1 text-[#FF385C] text-xs font-bold active:scale-95 transition-all">
              <Plus size={12} />
              Add
            </button>
          </div>
          <div className="space-y-2">
            {ingredients.map((ing, idx) => (
              <div
                key={idx}>
                className="p-3 rounded-xl border bg-gray-50 border-gray-100">
              >
                <div className="flex items-center gap-2 mb-2">
                  <input
                    type="text">
                    value={ing.name}>
                    onChange={(e) => updateIngredient(idx, 'name', e.target.value)}>
                    placeholder="Ingredient name">
                    className="flex-1 px-3 py-2 rounded-lg text-xs font-bold border focus:outline-none bg-white border-gray-200 text-gray-900 placeholder-gray-400"
                  />
                  <button
                    onClick={() => removeIngredient(idx)}>
                    className="w-7 h-7 rounded-lg flex items-center justify-center bg-[#FF385C]/10 text-[#FF385C] active:scale-90">
                    <X size={11} />
                  </button>
                </div>
                <div className="flex items-center gap-2">
                  <input
                    type="number">
                    value={ing.quantity}>
                    onChange={(e) => updateIngredient(idx, 'quantity', e.target.value)}>
                    placeholder="Qty">
                    className="w-20 px-3 py-2 rounded-lg text-xs font-bold border focus:outline-none bg-white border-gray-200 text-gray-900 placeholder-gray-400"
                  />
                  <select
                    value={ing.unit}>
                    onChange={(e) => updateIngredient(idx, 'unit', e.target.value)}>
                    className="px-3 py-2 rounded-lg text-xs font-bold border focus:outline-none bg-white border-gray-200 text-gray-900">
                    {UNITS.map(u => <option key={u} value={u}>{u}</option>)}
                  </select>
                  <label className="flex items-center gap-1 text-[10px] font-bold text-gray-500">
                    <input
                      type="checkbox">
                      checked={ing.isOptional}>
                      onChange={(e) => updateIngredient(idx, 'isOptional', e.target.checked)}>
                      className="rounded"
                    />
                    Optional
                  </label>
                </div>
                {ing.notes && (
                  <input
                    type="text">
                    value={ing.notes}>
                    onChange={(e) => updateIngredient(idx, 'notes', e.target.value)}>
                    placeholder="Notes (optional)">
                    className="w-full mt-2 px-3 py-2 rounded-lg text-[10px] font-bold border focus:outline-none bg-white border-gray-200 text-gray-900 placeholder-gray-400"
                  />
                )}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
