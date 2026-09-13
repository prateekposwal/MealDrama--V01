import { DISH_LIBRARY } from '../../meal/constants/dishLibrary';
import type { TrayLibrary } from '../../app/store/useStore';
import { regenerateMealPlanPipeline, MEAL_SLOTS } from '../../utils/mealPlanRegen';
import type { PersonalizationContext } from '../../utils/mealPersonalization';

const emptyTray = (): TrayLibrary => ({ breakfast: [], lunch: [], snacks: [], dinner: [] });
const planIds = (t: TrayLibrary) => MEAL_SLOTS.flatMap(s => t[s].map(m => m.dishId || m.id));
const jaccard = (a: string[], b: string[]) => { const sb = new Set(b); const i = a.filter(x => sb.has(x)).length; return i / (a.length + b.length - i); };
const dice = (a: string[], b: string[]) => { const sb = new Set(b); const i = a.filter(x => sb.has(x)).length; return (2*i)/(a.length+b.length); };
const ctx = (userId: string, p: Partial<PersonalizationContext>): PersonalizationContext => ({ userId, deviceId: `dev-${userId}`, healthFocus: 'Balanced', preferences: { spiceLevel: 'medium', preferredRegions: ['North India'], dislikedItems: [] }, ...p });
const gen = (c: PersonalizationContext) => regenerateMealPlanPipeline({ tray: emptyTray(), library: DISH_LIBRARY, diet: 'veg', region: 'north', target: 5, personalization: c });
type TP = NonNullable<PersonalizationContext['tasteProfile']>;
const tp = (p: Partial<TP>): TP => ({ spiceLevel: 'medium', allergies: [], dislikedItems: [], noveltyPreference: 'balanced', cuisineAffinities: [], ...p });

const ROOMMATES: Array<[string, PersonalizationContext]> = [
  ['south-mild', ctx('rm-south-mild', {
    preferences: { spiceLevel: 'mild', preferredRegions: ['North India'], dislikedItems: [], cuisineAffinities: ['south-indian'] },
    tasteProfile: tp({ spiceLevel: 'mild', cuisineAffinities: ['south-indian'] }),
  })],
  ['simple-home', ctx('rm-simple-home', {
    preferences: { spiceLevel: 'mild', preferredRegions: ['North India'], dislikedItems: [] },
    tasteProfile: tp({ spiceLevel: 'mild', noveltyPreference: 'familiar' }),
  })],
  ['punjabi-spicy', ctx('rm-punjabi-spicy', {
    preferences: { spiceLevel: 'hot', preferredRegions: ['North India'], dislikedItems: [], cuisineAffinities: ['punjabi'] },
    tasteProfile: tp({ spiceLevel: 'hot', cuisineAffinities: ['punjabi'] }),
  })],
  ['allergic-novelty', ctx('rm-allergic-novelty', {
    preferences: { spiceLevel: 'medium', preferredRegions: ['North India'], dislikedItems: [] },
    tasteProfile: tp({ allergies: ['peanuts', 'dairy'], noveltyPreference: 'adventurous' }),
  })],
];

const plans = new Map<string, string[]>();
for (const [k, c] of ROOMMATES) plans.set(k, planIds(gen(c).tray));

console.log('PAIRWISE MATRIX (shared/20 | Jaccard | Dice)');
const keys = ROOMMATES.map(([k]) => k);
for (let i = 0; i < keys.length; i++) {
  for (let j = i + 1; j < keys.length; j++) {
    const a = plans.get(keys[i]!)!, b = plans.get(keys[j]!)!;
    const shared = a.filter(x => b.includes(x)).length;
    console.log(`${keys[i].padEnd(16)} x ${keys[j].padEnd(16)}: ${String(shared).padStart(2)}/20  J=${jaccard(a,b).toFixed(3)}  D=${dice(a,b).toFixed(3)}`);
  }
}
const nameOf = (id: string) => DISH_LIBRARY.find(d => d.id === id)?.name ?? id;
const a = plans.get('south-mild')!, b = plans.get('simple-home')!;
console.log('\nsouth-mild plan:', a.map(nameOf).join(' | '));
console.log('simple-home plan:', b.map(nameOf).join(' | '));
console.log('shared names:', a.filter(x => b.includes(x)).map(nameOf).join(' | '));
