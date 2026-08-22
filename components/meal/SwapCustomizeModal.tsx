import React, { useState, useCallback, useRef, useEffect } from 'react';
import { X, Plus, Minus } from 'lucide-react';
import DishImage from '../new/DishImage';
import { isCarb } from '../../utils/normalizeMealComponents';
import { generateMealTitle } from '../../utils/generateMealTitle';
import { useBackButtonClose } from '../../hooks/useBackButtonClose';
import type { MealType, TrayItem } from '../../plan/store/useTrayStore';
import type { Dish, DishVariant } from '../../meal/constants/dishLibrary';

interface CatMeta { icon: string; label: string; key: string; max: number; }
const CATS: CatMeta[] = [
  { icon: '🥗', label: 'Sides', key: 'sides', max: 4 },
  { icon: '🥤', label: 'Beverages', key: 'beverages', max: 3 },
  { icon: '🫓', label: 'Bread', key: 'bread', max: 3 },
  { icon: '🍚', label: 'Rice', key: 'rice', max: 1 },
  { icon: '🍨', label: 'Dessert', key: 'dessert', max: 2 },
];

const REGION_OPTIONS: Record<string, Record<string, string[]>> = {
  north: {
    sides: ['Salad', 'Papad', 'Raita', 'Pickle', 'Chutney', 'Curd', 'Kachumber', 'Onion Salad', 'Lemon Wedge', 'Mint Chutney', 'Tamarind Chutney'],
    beverages: ['Chai', 'Buttermilk', 'Lassi', 'Chaas', 'Masala Chai', 'Jaljeera', 'Water'],
    bread: ['Tandoori Roti', 'Naan', 'Phulka', 'Paratha', 'Puri', 'Bhatura', 'Missi Roti', 'Rumali Roti'],
    rice: ['Jeera Rice', 'Pulao', 'Biryani', 'Steamed Rice', 'Fried Rice'],
    dessert: ['Gulab Jamun', 'Kheer', 'Gajar Halwa', 'Jalebi', 'Ice Cream', 'Rasmalai'],
  },
  south: {
    sides: ['Sambar', 'Coconut Chutney', 'Papad', 'Pickle', 'Raita', 'Curd', 'Tamarind Chutney', 'Green Chutney', 'Onion Salad'],
    beverages: ['Filter Coffee', 'Chai', 'Buttermilk', 'Lassi', 'Chaas', 'Water', 'Nimbu Pani'],
    bread: ['Dosa', 'Appam', 'Idli', 'Uttapam', 'Plain Dosa', 'Masala Dosa'],
    rice: ['Steamed Rice', 'Lemon Rice', 'Coconut Rice', 'Curd Rice', 'Sambar Rice', 'Biryani', 'Pulao'],
    dessert: ['Payasam', 'Kheer', 'Ice Cream', 'Rasmalai', 'Fruit Salad', 'Phirni'],
  },
  west: {
    sides: ['Salad', 'Papad', 'Pickle', 'Chutney', 'Raita', 'Curd', 'Kachumber', 'Sambharo', 'Mint Chutney'],
    beverages: ['Chai', 'Buttermilk', 'Chaas', 'Jaljeera', 'Lassi', 'Nimbu Pani', 'Water', 'Masala Chai'],
    bread: ['Bhakri', 'Thepla', 'Puri', 'Paratha', 'Naan', 'Phulka', 'Roti'],
    rice: ['Steamed Rice', 'Pulao', 'Biryani', 'Jeera Rice', 'Fried Rice'],
    dessert: ['Shrikhand', 'Gulab Jamun', 'Kheer', 'Ice Cream', 'Gajar Halwa', 'Jalebi'],
  },
  east: {
    sides: ['Salad', 'Papad', 'Pickle', 'Chutney', 'Curd', 'Raita', 'Lemon Wedge', 'Green Salad'],
    beverages: ['Chai', 'Buttermilk', 'Chaas', 'Lassi', 'Water', 'Aam Panna', 'Nimbu Pani'],
    bread: ['Luchi', 'Puri', 'Paratha', 'Roti', 'Phulka'],
    rice: ['Steamed Rice', 'Pulao', 'Biryani', 'Fried Rice', 'Jeera Rice', 'Lemon Rice'],
    dessert: ['Rasmalai', 'Kheer', 'Ice Cream', 'Gulab Jamun', 'Fruit Salad', 'Payasam'],
  },
  central: {
    sides: ['Salad', 'Papad', 'Pickle', 'Chutney', 'Raita', 'Curd', 'Kachumber', 'Onion Salad'],
    beverages: ['Chai', 'Buttermilk', 'Chaas', 'Lassi', 'Jaljeera', 'Water', 'Nimbu Pani'],
    bread: ['Roti', 'Paratha', 'Puri', 'Bhatura', 'Naan', 'Phulka'],
    rice: ['Steamed Rice', 'Jeera Rice', 'Pulao', 'Biryani', 'Fried Rice'],
    dessert: ['Gulab Jamun', 'Kheer', 'Ice Cream', 'Jalebi', 'Gajar Halwa', 'Rasmalai'],
  },
  northeast: {
    sides: ['Salad', 'Papad', 'Pickle', 'Chutney', 'Curd', 'Lemon Wedge', 'Green Salad', 'Bamboo Shoot'],
    beverages: ['Chai', 'Buttermilk', 'Lassi', 'Water', 'Nimbu Pani', 'Green Tea'],
    bread: ['Roti', 'Puri', 'Paratha', 'Phulka'],
    rice: ['Steamed Rice', 'Pulao', 'Fried Rice', 'Jeera Rice'],
    dessert: ['Kheer', 'Ice Cream', 'Gulab Jamun', 'Fruit Salad', 'Payasam'],
  },
};

function getRegionOptions(region: string, category: string): string[] {
  const r = region?.toLowerCase() || '';
  const regionData = REGION_OPTIONS[r] || REGION_OPTIONS['north'];
  return regionData[category] || REGION_OPTIONS['north'][category] || [];
}

const STYLES = ['Gravy', 'Dry', 'Fried', 'Roasted', 'Boiled', 'Steamed'];

interface Props {
  isOpen: boolean; onClose: () => void; item: TrayItem; dishes: Dish[];
  onApply: (itemId: string, updates: Partial<TrayItem>) => void;
  date?: string; mealType?: MealType; slotLabel?: string;
  userRegion?: string; userDiet?: string;
  onAddAnother?: (date: string, mealType: MealType, dish: Dish, variant?: DishVariant) => void;
  onChange?: (itemId: string, updates: Partial<TrayItem>) => void;
  onSwapDish?: () => void;
  initialAddMode?: boolean; // legacy, use DishSearchModal instead
}

const SwapCustomizeModal: React.FC<Props> = ({ isOpen, item, dishes, onClose, onApply, onSwapDish }) => {
  useBackButtonClose(isOpen, onClose);
  const dishObj = dishes.find(d => d.id === item.meal_id);
  const dishRegion = dishObj?.region || 'north';
  const [style, setStyle] = useState(item.style || '');
  const [customInput, setCustomInput] = useState<Record<string, string>>({});
  const [styleOpen, setStyleOpen] = useState(false);
  const [filterDiet, setFilterDiet] = useState('');
  const [healthSort, setHealthSort] = useState('');
  const [pairings, setPairings] = useState<Record<string, string[]>>(() => {
    const dish = dishes.find(d => d.id === item.meal_id);
    const def = dish?.defaultPairings;
    const result: Record<string, string[]> = { sides: [], beverages: [], bread: [], rice: [], dessert: [] };
    const allNames = new Set<string>();
    // Bread and Rice first
    const breadVal = item.roti || (def?.roti ?? '');
    const riceVal = item.rice || (def?.rice ?? '');
    if (breadVal) { result.bread = [breadVal]; allNames.add(breadVal.toLowerCase()); }
    if (riceVal) { result.rice = [riceVal]; allNames.add(riceVal.toLowerCase()); }
    // Helper to add items, filtering out carbs from non-carb categories
  const addIfNew = (items: string[] | undefined, defItems: string[] | undefined, key: string, isCarbCategory: boolean) => {
      (items?.length ? items : (defItems || [])).forEach(s => {
        if (allNames.has(s.toLowerCase())) return;
        if (!isCarbCategory && isCarb(s)) return;
        (result as any)[key].push(s); allNames.add(s.toLowerCase());
      });
    };
    addIfNew(item.sides, def?.sides, 'sides', false);
    addIfNew(item.beverages, def?.beverages, 'beverages', false);
    addIfNew(item.dessert, def?.dessert, 'dessert', false);
    return result;
  });
  const [qty, setQty] = useState<Record<string, number>>(() => {
    const dish = dishes.find(d => d.id === item.meal_id);
    const def = dish?.defaultPairings;
    const q: Record<string, number> = {};
    const allNames = new Set<string>();
    const breadVal = item.roti || (def?.roti ?? '');
    const riceVal = item.rice || (def?.rice ?? '');
    if (breadVal) { q[breadVal] = item.itemQtys?.[breadVal] || 1; allNames.add(breadVal.toLowerCase()); }
    if (riceVal) { q[riceVal] = item.itemQtys?.[riceVal] || 1; allNames.add(riceVal.toLowerCase()); }
    const addQ = (items: string[] | undefined, defItems: string[] | undefined) => {
      (items?.length ? items : (defItems || [])).forEach(s => {
        if (allNames.has(s.toLowerCase())) return;
        if (isCarb(s)) return;
        q[s] = 1; allNames.add(s.toLowerCase());
      });
    };
    addQ(item.sides, def?.sides);
    addQ(item.beverages, def?.beverages);
    addQ(item.dessert, def?.dessert);
    return q;
  });

  const toggle = useCallback((cat: string, name: string) => {
    const meta = CATS.find(c => c.key === cat);
    // Don't add carb-like items to non-carb categories
    if (cat !== 'bread' && cat !== 'rice' && isCarb(name)) return;
    setPairings(prev => {
      const cur = prev[cat] || [];
      if (cur.includes(name)) return { ...prev, [cat]: cur.filter(i => i !== name) };
      // Check if item already exists in another category
      for (const [k, v] of Object.entries(prev)) {
        if (k !== cat && v.some(i => i.toLowerCase() === name.toLowerCase())) return prev;
      }
      if (meta && meta.max === 1) return { ...prev, [cat]: [name] };
      if (meta && cur.length >= meta.max) return prev;
      return { ...prev, [cat]: [...cur, name].filter((v, i, a) => a.indexOf(v) === i) };
    });
    if (!(pairings[cat] || []).includes(name)) {
      // Check qty doesn't already have this item from another category
      setQty(q => q[name] ? q : { ...q, [name]: 1 });
    }
  }, [pairings]);

  const adjQty = useCallback((name: string, d: number) => setQty(q => ({ ...q, [name]: Math.max(1, (q[name] || 1) + d) })), []);

  // Auto-scroll to most relevant pairing based on dish defaults
  const catRefs = useRef<Record<string, HTMLDivElement | null>>({});
  const pairingsRef = useRef<HTMLDivElement>(null);

  // Reset state when item changes
  useEffect(() => {
    setStyle(item.style || '');
    const dish = dishes.find(d => d.id === item.meal_id);
    const def = dish?.defaultPairings;
    const result: Record<string, string[]> = { sides: [], beverages: [], bread: [], rice: [], dessert: [] };
    const allNames = new Set<string>();
    const breadVal = item.roti || (def?.roti ?? '');
    const riceVal = item.rice || (def?.rice ?? '');
    if (breadVal) { result.bread = [breadVal]; allNames.add(breadVal.toLowerCase()); }
    if (riceVal) { result.rice = [riceVal]; allNames.add(riceVal.toLowerCase()); }
    const addIfNew = (items: string[] | undefined, defItems: string[] | undefined, key: string) => {
      (items?.length ? items : (defItems || [])).forEach(s => {
        if (allNames.has(s.toLowerCase())) return;
        if (isCarb(s)) return;
        (result as any)[key].push(s); allNames.add(s.toLowerCase());
      });
    };
    addIfNew(item.sides, def?.sides, 'sides');
    addIfNew(item.beverages, def?.beverages, 'beverages');
    addIfNew(item.dessert, def?.dessert, 'dessert');
    setPairings(result);
    // Qtys
    const newQ: Record<string, number> = {};
    const allQ = new Set<string>();
    if (breadVal) { newQ[breadVal] = item.itemQtys?.[breadVal] || 1; allQ.add(breadVal.toLowerCase()); }
    if (riceVal) { newQ[riceVal] = item.itemQtys?.[riceVal] || 1; allQ.add(riceVal.toLowerCase()); }
    const addQ = (items: string[] | undefined, defItems: string[] | undefined) => {
      (items?.length ? items : (defItems || [])).forEach(s => {
        if (allQ.has(s.toLowerCase())) return;
        if (isCarb(s)) return;
        newQ[s] = 1; allQ.add(s.toLowerCase());
      });
    };
    addQ(item.sides, def?.sides);
    addQ(item.beverages, def?.beverages);
    addQ(item.dessert, def?.dessert);
    setQty(newQ);
    setCustomInput({});
    setStyleOpen(false);
  }, [item.id, item.meal_id, dishes]);

  // Auto-scroll: prioritize bread/rice for lunch/dinner, sides/beverages for others
  useEffect(() => {
    if (!isOpen) return;
    const timer = setTimeout(() => {
      const dish = dishes.find(d => d.id === item.meal_id);
      const dp = dish?.defaultPairings;
      const isLunchDinner = item.name ? true : false;
      // Bread and Rice first for Lunch/Dinner, otherwise sides/beverages
      const keyOrder = ['bread', 'rice', 'sides', 'beverages', 'dessert'];
      const targetKey = keyOrder.find(k => {
        if (k === 'bread') return item.roti || dp?.roti;
        if (k === 'rice') return item.rice || dp?.rice;
        return (dp as any)?.[k]?.length > 0 || (item as any)?.[k === 'sides' ? 'sides' : k]?.length > 0;
      });
      if (targetKey) {
        const el = catRefs.current[targetKey];
        if (el) el.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
    }, 350);
    return () => clearTimeout(timer);
  }, [isOpen, item.meal_id, item.id, dishes]);

  const handleApply = useCallback(() => {
    const u: Partial<TrayItem> = {};
    if (style) u.style = style;
    const b = pairings.bread || []; u.roti = b.length > 0 ? b[b.length - 1] : null;
    const r = pairings.rice || []; u.rice = r.length > 0 ? r[r.length - 1] : null;
    u.sides = pairings.sides || []; u.beverages = pairings.beverages || []; u.dessert = pairings.dessert || [];
    u.itemQtys = qty;
    // Regenerate title so MealCard shows updated pairings
    const carb = u.roti || u.rice || undefined;
    u.title = generateMealTitle(item.name, u.sides || [], u.beverages || [], carb);
    onApply(item.id, u); onClose();
  }, [style, pairings, qty, onApply, onClose, item.name]);

  if (!isOpen) return null;

  const allSelected = CATS.flatMap(c => (pairings[c.key] || []).map(n => ({ cat: c, name: n })));

  return (
    <div className="fixed inset-0 z-[100] flex items-end sm:items-center justify-center" onClick={onClose}>
      <div className="fixed inset-0 bg-black/40 backdrop-blur-sm" />
      <div className="relative bg-white rounded-t-[28px] sm:rounded-[28px] w-full max-w-lg mx-auto max-h-[95vh] overflow-hidden flex flex-col" onClick={e => e.stopPropagation()}>

        {/* Header */}
        <div className="flex items-center gap-3 px-5 pt-4 pb-4 border-b border-gray-100 shrink-0">
          <DishImage name={item.name} slot={item.name} size="xl" className="shrink-0" />
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <p className="text-lg sm:text-xl font-bold text-gray-900 leading-tight line-clamp-2">{item.name}</p>
              {onSwapDish && (
                <button onClick={() => { onSwapDish(); onClose(); }}
                  className="shrink-0 w-7 h-7 rounded-full bg-[#FF385C]/10 text-[#FF385C] flex items-center justify-center active:scale-90 transition-all hover:bg-[#FF385C]/20 text-sm font-bold"
                  title="Swap this dish">↻</button>
              )}
            </div>
          </div>
          <button onClick={onClose} className="w-8 h-8 rounded-xl flex items-center justify-center bg-gray-100 active:scale-90 transition-all shrink-0"><X size={14} /></button>
        </div>

        {/* Style — collapsible */}
        <div className="px-6 pt-3 pb-2 border-b border-gray-100 bg-gray-50/30 shrink-0">
          <button onClick={() => setStyleOpen(!styleOpen)} className="flex items-center gap-2 w-full active:opacity-70">
            <span className={`text-xs font-black uppercase tracking-widest ${style ? 'text-[#FF385C]' : 'text-gray-500'}`}>
              🍳 Style{style ? ` · ${style}` : ''}
            </span>
            <span className={`text-gray-300 transition-transform duration-200 text-xs ${styleOpen ? 'rotate-90' : ''}`}>▸</span>
          </button>
          {styleOpen && (
          <div className="flex gap-2 overflow-x-auto pb-1 mt-2 scrollbar-hide">
            {STYLES.map(s => (
              <button key={s} onClick={() => setStyle(style === s ? '' : s)}
                className="flex-shrink-0 flex flex-col items-center gap-1 active:scale-95 transition-all"
              >
                <div className={`w-14 h-14 rounded-2xl flex items-center justify-center text-lg border-2 transition-all ${style === s ? 'border-[#FF385C] bg-[#FF385C]/10 shadow-sm' : 'border-gray-100 bg-gray-50'}`}>
                  {s === 'Gravy' ? '🥩' : s === 'Dry' ? '🍗' : s === 'Fried' ? '🍤' : s === 'Roasted' ? '🔥' : s === 'Boiled' ? '🥟' : '♨️'}
                </div>
                <span className={`text-sm font-bold ${style === s ? 'text-[#FF385C]' : 'text-gray-500'}`}>{s}</span>
              </button>
            ))}
          </div>
          )}
        </div>

        {/* Your Pairings — always visible above scroll */}
        {allSelected.length > 0 && (
          <div ref={pairingsRef} className="shrink-0 px-6 py-3 border-b border-gray-100 bg-emerald-50/30">
            <p className="text-xs font-black uppercase tracking-widest text-emerald-600 mb-2">✓ Your Pairings</p>
            <div className="flex gap-3 overflow-x-auto pb-1 scrollbar-hide -mx-1 px-1">
              {allSelected.map(({ cat, name }) => (
                <div key={`${cat.key}-${name}`} className="flex-shrink-0 flex flex-col items-center gap-1.5 w-[88px] group">
                  <div className="relative w-[72px] h-[72px] rounded-2xl overflow-hidden border-2 border-emerald-200 bg-emerald-50/50 shadow-sm">
                    <DishImage name={name} size="full" className="w-full h-full object-cover" />
                    <button onClick={() => toggle(cat.key, name)} className="absolute -top-1.5 -right-1.5 w-5 h-5 rounded-full bg-white border border-gray-200 flex items-center justify-center shadow-sm opacity-0 group-hover:opacity-100 transition-opacity active:scale-90 hover:bg-red-50" title="Remove">
                      <X size={9} className="text-gray-400" />
                    </button>
                  </div>
                  <span className="text-sm font-bold text-gray-700 truncate max-w-[80px] text-center leading-tight">{name}</span>
                  <div className="flex items-center gap-1 bg-gray-100 rounded-lg px-1.5 py-0.5">
                    <button onClick={(e) => { e.stopPropagation(); adjQty(name, -1); }} className="w-5 h-5 rounded flex items-center justify-center text-gray-500 active:scale-90 hover:bg-gray-200"><Minus size={8} /></button>
                    <span className="text-xs font-bold text-gray-700 min-w-[16px] text-center tabular-nums">{qty[name] || 1}</span>
                    <button onClick={(e) => { e.stopPropagation(); adjQty(name, 1); }} className="w-5 h-5 rounded flex items-center justify-center text-gray-500 active:scale-90 hover:bg-gray-200"><Plus size={8} /></button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Alternatives — scrollable */}
        <div className="flex-1 overflow-y-auto px-6 py-4 min-h-[200px] relative">
          {CATS.map(cat => {
            const selected = pairings[cat.key] || [];
            const available = getRegionOptions(dishRegion, cat.key);
            return (
              <div key={cat.key} className="mb-4" ref={el => { catRefs.current[cat.key] = el; }}>
                <div className="flex items-center gap-1.5 mb-2">
                  <span className="text-sm">{cat.icon}</span>
                  <span className="text-xs font-black uppercase tracking-widest text-gray-500">{cat.label}</span>
                  <input type="text" value={customInput[cat.key] || ''} onChange={e => setCustomInput(prev => ({ ...prev, [cat.key]: e.target.value }))}
                    onKeyDown={e => { if (e.key === 'Enter' && (customInput[cat.key] || '').trim()) { toggle(cat.key, (customInput[cat.key] || '').trim()); setCustomInput(prev => ({ ...prev, [cat.key]: '' })); } }}
                    placeholder="+ add custom" className="w-24 text-xs font-bold text-gray-500 bg-gray-100 rounded-lg py-1.5 px-2 border border-dashed border-gray-300 outline-none focus:border-[#FF385C]/30 focus:bg-[#FF385C]/5 placeholder:text-gray-400"
                  />
                  {cat.max > 1 && <span className="text-xs text-gray-400 ml-auto">{selected.length}/{cat.max}</span>}
                </div>
                <div className="flex gap-3 overflow-x-auto pb-2 scrollbar-hide -mx-1 px-1">
                  {[...available].sort((a, b) => {
                    const aSel = selected.includes(a) ? 0 : 1;
                    const bSel = selected.includes(b) ? 0 : 1;
                    return aSel - bSel;
                  }).map(opt => {
                    const sel = selected.includes(opt);
                    return (
                      <button key={opt} onClick={() => toggle(cat.key, opt)}
                        className={`flex-shrink-0 flex flex-col items-center gap-1.5 transition-all active:scale-90 ${
                          sel ? 'opacity-100' : 'opacity-70 hover:opacity-100'
                        }`}
                      >
                        <div className={`relative w-[72px] h-[72px] rounded-2xl overflow-hidden border-2 shadow-sm transition-all ${
                          sel ? 'border-[#FF385C] shadow-md' : 'border-gray-200 hover:border-gray-300'
                        }`}>
                          <DishImage name={opt} size="full" className="w-full h-full object-cover" />
                          {sel && <div className="absolute top-0.5 right-0.5 w-5 h-5 rounded-full bg-[#FF385C] flex items-center justify-center shadow-sm"><span className="text-white text-xs font-bold">✓</span></div>}
                        </div>
                        <span className={`text-sm font-bold truncate max-w-[72px] text-center leading-tight ${sel ? 'text-[#FF385C]' : 'text-gray-600'}`}>{opt}</span>
                      </button>
                    );
                  })}
                </div>
              </div>
            );
          })}
          <div className="h-2" />
        </div>

        {/* Apply */}
        <div className="px-6 pb-5 pt-3 border-t border-gray-100 shrink-0" style={{ paddingBottom: 'max(20px, env(safe-area-inset-bottom, 16px))' }}>
          <button onClick={handleApply} className="w-full py-3.5 rounded-2xl bg-[#FF385C] text-white text-xs font-black uppercase tracking-widest active:scale-[0.98] transition-all shadow-lg shadow-[#FF385C]/20">
            ✓ Apply
          </button>
        </div>
      </div>
    </div>
  );
};

export { SwapCustomizeModal };
export default SwapCustomizeModal;
