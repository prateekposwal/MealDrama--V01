// Scratch — reconstruct last QA's mild-pair baseline (BEFORE tuning).
import { DISH_LIBRARY, type Dish } from '../../meal/constants/dishLibrary';
import type { MealType } from '../../types/tray';
import type { MealOption, TrayLibrary } from '../../app/store/useStore';
import { regenerateMealPlanPipeline, MEAL_SLOTS } from '../../utils/mealPlanRegen';
import type { PersonalizationContext } from '../../utils/mealPersonalization';

const emptyTray = (): TrayLibrary => ({ breakfast: [], lunch: [], snacks: [], dinner: [] });
const planIds = (tray: TrayLibrary): string[] =>
  MEAL_SLOTS.flatMap(s => tray[s].map(m => m.dishId || m.id));
const jaccard = (a: string[], b: string[]): number => {
  const setB = new Set(b);
  const inter = a.filter(x => setB.has(x)).length;
  return inter / (a.length + b.length - inter);
};
const dice = (a: string[], b: string[]): number => {
  const setB = new Set(b);
  const inter = a.filter(x => setB.has(x)).length;
  return (2 * inter) / (a.length + b.length);
};

const ctx = (userId: string, p: Partial<PersonalizationContext>): PersonalizationContext => ({
  userId, deviceId: `dev-${userId}`, healthFocus: 'Balanced',
  preferences: { spiceLevel: 'medium', preferredRegions: ['North India'], dislikedItems: [] },
  ...p,
});

const gen = (c: PersonalizationContext) =>
  regenerateMealPlanPipeline({ tray: emptyTray(), library: DISH_LIBRARY, diet: 'veg', region: 'north', target: 5, personalization: c });

const PAIRS: Array<[string, PersonalizationContext]> = [
  ['A-south-mild', ctx('qa-A', {
    preferences: { spiceLevel: 'mild', preferredRegions: ['North India'], cuisineAffinities: ['south-indian'] },
    tasteProfile: { spiceLevel: 'mild', allergies: [], dislikedItems: [], noveltyPreference: 'balanced', cuisineAffinities: ['south-indian'] },
  })],
  ['B-simple-home', ctx('qa-B', {
    preferences: { spiceLevel: 'mild', preferredRegions: ['North India'] },
    tasteProfile: { spiceLevel: 'mild', allergies: [], dislikedItems: [], noveltyPreference: 'familiar', cuisineAffinities: [] },
  })],
];

const plans = new Map<string, string[]>();
for (const [name, c] of PAIRS) {
  const r = gen(c);
  console.log(`${name}: complete=${r.complete} total=${MEAL_SLOTS.reduce((n,s)=>n+r.tray[s].length,0)}`);
  plans.set(name, planIds(r.tray));
}
const aIds = plans.get('A-south-mild')!;
const bIds = plans.get('B-simple-home')!;
const shared = aIds.filter(x => bIds.includes(x));
console.log(`shared=${shared.length}/20 jaccard=${jaccard(aIds,bIds).toFixed(3)} dice=${dice(aIds,bIds).toFixed(3)}`);
const nameOf = (id: string) => DISH_LIBRARY.find(d => d.id === id)?.name ?? id;
console.log('shared dishes:', shared.map(nameOf).join(' | '));
console.log('A plan:', aIds.map(nameOf).join(' | '));
console.log('B plan:', bIds.map(nameOf).join(' | '));
