import React, { useMemo } from 'react';
import { Plus } from 'lucide-react';
import type { Dish } from '../../meal/constants/dishLibrary';
import type { TrayItem, MealType } from '../../types/tray';
import { scoreDish } from '../../utils/nutritionScore';

// Session-level tracker — shared across all PlateCompletionBanner instances
// so the same dish isn't suggested for multiple slots on the same day
const _sessionShownIds = new Set<string>();

function resetSessionTracker() {
  _sessionShownIds.clear();
}

interface MissingRole {
  role: 'protein' | 'fiber' | 'carb' | 'hydration' | 'dessert';
  label: string;
}

type RoleKey = 'protein' | 'fiber' | 'carb' | 'hydration' | 'dessert';

const ROLE_KEYWORDS: Record<RoleKey, string[]> = {
  protein: ['dal', 'paneer', 'chicken', 'egg', 'fish', 'pork', 'mutton', 'soya', 'tofu', 'legume', 'bean', 'lentil', 'sprout'],
  fiber: ['salad', 'raita', 'veg', 'sabzi', 'bhaji', 'saag', 'leafy', 'green', 'fruit', 'chutney'],
  carb: ['roti', 'rice', 'bread', 'naan', 'paratha', 'pulao', 'biryani', 'pasta', 'noodle', 'upma', 'poha', 'dosa', 'idli'],
  hydration: ['chaas', 'lassi', 'buttermilk', 'soup', 'juice', 'sharbat', 'beverage', 'tea', 'coffee', 'chai', 'smoothie'],
  dessert: ['halwa', 'kheer', 'gulab', 'jalebi', 'rasgulla', 'ice cream', 'cake', 'pastry', 'pudding', 'mithai', 'sweet'],
};

// Tag mapping: which health tags are most relevant for each missing role
const ROLE_HEALTH_TAGS: Record<RoleKey, string[]> = {
  protein: ['high-protein', 'protein'],
  fiber: ['fiber', 'high-fiber'],
  carb: ['balanced', 'healthy'],
  hydration: ['low-calorie'],
  dessert: ['low-sugar'],
};

const ROLE_DISPLAY: Record<RoleKey, { label: string; emoji: string }> = {
  protein: { label: 'protein', emoji: '🥩' },
  fiber: { label: 'fiber / veggies', emoji: '🥗' },
  carb: { label: 'a carb base', emoji: '🍚' },
  hydration: { label: 'a drink', emoji: '🥤' },
  dessert: { label: 'something sweet', emoji: '🍨' },
};

function checkRole(role: RoleKey, m: TrayItem): boolean {
  const n = (m.name ?? '').toLowerCase();
  const kws = ROLE_KEYWORDS[role];
  if (kws.some(k => new RegExp('\\b' + k.replace(/[.*+?^${}()|[\]\\]/g, '\\$&') + '\\b', 'i').test(n))) return true;
  if (role === 'carb') return !!(m.roti || m.rice);
  if (role === 'hydration') return (m.beverages ?? []).length > 0;
  if (role === 'dessert') return (m.dessert ?? []).length > 0;
  return (m.sides ?? []).some(s => kws.some(k => new RegExp('\\b' + k.replace(/[.*+?^${}()|[\]\\]/g, '\\$&') + '\\b', 'i').test(s.toLowerCase())));
}

function getMissingRoles(meals: TrayItem[]): MissingRole[] {
  const missing: MissingRole[] = [];
  const roles: RoleKey[] = ['protein', 'fiber', 'carb', 'hydration', 'dessert'];
  const labels: Record<RoleKey, string> = {
    protein: 'protein', fiber: 'fiber / veggies', carb: 'a carb base',
    hydration: 'a drink', dessert: 'something sweet',
  };

  for (const role of roles) {
    if (!meals.some(m => checkRole(role, m))) {
      missing.push({ role, label: labels[role] });
    }
  }

  return missing;
}

function findSuggestion(
  role: string, mealType: MealType, dishes: Dish[],
  regionKey: string, diet: string,
  excludeIds: Set<string> = new Set(),
): Dish | null {
  const dietTypes: Record<string, string[]> = {
    'veg': ['veg', 'vegan'], 'eggitarian': ['veg', 'vegan', 'eggitarian'],
    'non-veg': ['veg', 'non-veg', 'vegan', 'eggitarian'], 'vegan': ['vegan'],
  };
  const allowedTypes = dietTypes[diet.toLowerCase()] || ['veg'];
  const isNonVeg = diet.toLowerCase() === 'non-veg';

  const keywords = ROLE_KEYWORDS[role as RoleKey] ?? [];
  const healthTags = ROLE_HEALTH_TAGS[role as RoleKey] ?? [];

  const candidates = dishes.filter(d => {
    if (excludeIds.has(d.id)) return false;
    // Use word-boundary matching instead of substring to prevent "egg" matching "aubergine"
    const name = d.name.toLowerCase();
    const matchesKeyword = keywords.some(k => {
      const regex = new RegExp('\\b' + k.replace(/[.*+?^${}()|[\]\\]/g, '\\$&') + '\\b', 'i');
      return regex.test(name) || d.tags.some(t => regex.test(t));
    });
    return d.category.includes(mealType as any) && allowedTypes.includes(d.type) && matchesKeyword;
  });

  if (candidates.length === 0) return null;

  // Score and rank candidates: prefer regional + healthiest + role-relevant
  const scored = candidates.map(d => {
    let score = scoreDish(d);
    const isRegional = d.region === regionKey || d.region === 'all';
    const tagMatch = healthTags.some(t => d.tags.includes(t));
    if (isRegional) score += 3;
    if (tagMatch) score += 5;

    // Boost Indian-style dishes (+12) for lunch/dinner only
    // Snacks and breakfast can suggest non-Indian options (burgers, sandwiches, etc.)
    const indianKeywords = ['biryani', 'curry', 'masala', 'tikka', 'kebab', 'rogan', 'dhansak',
      'dal', 'paneer', 'raita', 'sabzi', 'bhaji', 'saag', 'korma', 'vindaloo',
      'madras', 'chettinad', 'hyderabadi', 'tandoori', 'makhani', 'kadhai',
      'dosa', 'idli', 'vada', 'uttapam', 'paratha', 'naan', 'roti',
      'pulao', 'biryani', 'rajma', 'chole', 'chana', 'aloo', 'baingan', 'bhindi',
      'gobi', 'mushroom', 'matar', 'paneer', 'shahi', 'mixed-veg'];
    const isIndian = indianKeywords.some(k => d.name.toLowerCase().includes(k)) ||
      d.tags.some(t => indianKeywords.some(k => t.includes(k)));
    if (isIndian && (mealType === 'lunch' || mealType === 'dinner')) score += 12;

    // For non-veg users: meat/poultry/fish/seafood strongly preferred over veg for protein
    // Veg/dal options only suggested when no meat dishes are available
    if (isNonVeg && role === 'protein') {
      const isMeat = ['chicken', 'mutton', 'fish', 'egg', 'pork', 'beef', 'lamb', 'prawn', 'shrimp', 'crab', 'keema', 'tandoori', 'tikka', 'kebab', 'rogan', 'laal', 'haleem', 'galouti', 'buffalo'].some(k => d.name.toLowerCase().includes(k));
      const isDal = d.name.toLowerCase().includes('dal') || d.tags.some(t => t.includes('dal') || t.includes('lentil'));
      if (isMeat) score += 15;
      else if (isDal) score -= 10;  // dal ranked below meat for non-veg
    }

    return { dish: d, score };
  });

  scored.sort((a, b) => b.score - a.score);

  // Pick from top candidates weighted by score — higher scored dishes more likely
  const topN = Math.min(5, scored.length);
  const weights = scored.slice(0, topN).map((_, i) => Math.max(1, topN - i));
  const totalWeight = weights.reduce((a, b) => a + b, 0);
  let rand = Math.random() * totalWeight;
  for (let i = 0; i < topN; i++) {
    rand -= weights[i]!;
    if (rand <= 0) return scored[i]!.dish;
  }
  return scored[0]!.dish;
}

interface PlateCompletionBannerProps {
  meals: TrayItem[];
  mealType: MealType;
  slotLabel: string;
  dishes: Dish[];
  regionKey: string;
  diet: string;
  onAddSuggestion: (date: string, mealType: MealType, dish: Dish) => void;
  today: string;
}

const PlateCompletionBanner: React.FC<PlateCompletionBannerProps> = ({
  meals, mealType, slotLabel, dishes, regionKey, diet, onAddSuggestion, today,
}) => {
  const suggestion = useMemo(() => {
    if (meals.length === 0) return null;
    const missing = getMissingRoles(meals);
    if (missing.length === 0) return null;
    const first = missing[0]!;
    const dish = findSuggestion(first.role, mealType, dishes, regionKey, diet, _sessionShownIds);
    if (!dish) {
      // Reset tracker and try again from scratch
      _sessionShownIds.clear();
      const fallback = findSuggestion(first.role, mealType, dishes, regionKey, diet);
      if (fallback) {
        _sessionShownIds.add(fallback.id);
        return { role: first, dish: fallback };
      }
      return null;
    }
    _sessionShownIds.add(dish.id);
    return { role: first, dish };
  }, [meals, mealType, dishes, regionKey, diet]);

  if (!suggestion) return null;

  const { role, dish } = suggestion;
  const display = ROLE_DISPLAY[role.role] ?? { label: role.role, emoji: '🍽️' };

  return (
    <div className="mx-1 mb-2">
      <button
        onClick={() => onAddSuggestion(today, mealType, dish)}
        className="w-full flex items-center gap-3 px-4 py-3 rounded-2xl border border-emerald-200 bg-emerald-50/60 hover:bg-emerald-100/60 active:scale-[0.98] transition-all text-left"
      >
        <div className="w-8 h-8 rounded-full bg-emerald-100 flex items-center justify-center shrink-0">
          <Plus size={14} className="text-emerald-600" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-[11px] font-bold text-gray-800 leading-tight">
            {slotLabel} is light on <span className="text-emerald-600">{display.label}</span>
          </p>
          <p className="text-[10px] text-gray-500 mt-0.5 leading-tight">
            Add {dish.icon} {dish.name}
          </p>
        </div>
      </button>
    </div>
  );
};

export default PlateCompletionBanner;
