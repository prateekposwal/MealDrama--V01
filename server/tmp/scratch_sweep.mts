import { DISH_LIBRARY } from '../../meal/constants/dishLibrary';
import type { TrayLibrary } from '../../app/store/useStore';
import { regenerateMealPlanPipeline, MEAL_SLOTS } from '../../utils/mealPlanRegen';
import type { PersonalizationContext } from '../../utils/mealPersonalization';

const emptyTray = (): TrayLibrary => ({ breakfast: [], lunch: [], snacks: [], dinner: [] });
const planIds = (tray: TrayLibrary): string[] => MEAL_SLOTS.flatMap(s => tray[s].map(m => m.dishId || m.id));
const jaccard = (a: string[], b: string[]) => { const sb = new Set(b); const i = a.filter(x => sb.has(x)).length; return i / (a.length + b.length - i); };
const ctx = (userId: string, p: Partial<PersonalizationContext>): PersonalizationContext => ({ userId, deviceId: `dev-${userId}`, healthFocus: 'Balanced', preferences: { spiceLevel: 'medium', preferredRegions: ['North India'], dislikedItems: [] }, ...p });
const gen = (c: PersonalizationContext) => regenerateMealPlanPipeline({ tray: emptyTray(), library: DISH_LIBRARY, diet: 'veg', region: 'north', target: 5, personalization: c });

type TProf = NonNullable<PersonalizationContext['tasteProfile']>;
const tp = (p: Partial<TProf>): TProf => ({ spiceLevel: 'mild', allergies: [], dislikedItems: [], noveltyPreference: 'balanced', cuisineAffinities: [], ...p });

const SOUTH_VARIANTS: Array<[string, PersonalizationContext]> = [
  ['south-indian', ctx('v1', { preferences: { spiceLevel: 'mild', preferredRegions: ['North India'], cuisineAffinities: ['south-indian'] }, tasteProfile: tp({ cuisineAffinities: ['south-indian'] }) })],
  ['south', ctx('v2', { preferences: { spiceLevel: 'mild', preferredRegions: ['North India'], cuisineAffinities: ['south'] }, tasteProfile: tp({ cuisineAffinities: ['south'] }) })],
  ['south-indian-adv', ctx('v3', { preferences: { spiceLevel: 'mild', preferredRegions: ['North India'], cuisineAffinities: ['south-indian'] }, tasteProfile: tp({ cuisineAffinities: ['south-indian'], noveltyPreference: 'adventurous' }) })],
  ['south-adv', ctx('v4', { preferences: { spiceLevel: 'mild', preferredRegions: ['North India'], cuisineAffinities: ['south'] }, tasteProfile: tp({ cuisineAffinities: ['south'], noveltyPreference: 'adventurous' }) })],
];
const HOME_VARIANTS: Array<[string, PersonalizationContext]> = [
  ['home-familiar', ctx('h1', { preferences: { spiceLevel: 'mild', preferredRegions: ['North India'] }, tasteProfile: tp({ noveltyPreference: 'familiar' }) })],
  ['home-none-profile', ctx('h2', { preferences: { spiceLevel: 'mild', preferredRegions: ['North India'] }, tasteProfile: undefined })],
  ['home-no-taste-no-pref', ctx('h3', { preferences: { spiceLevel: 'mild', preferredRegions: ['North India'] } })],
  ['home-aff-north', ctx('h4', { preferences: { spiceLevel: 'mild', preferredRegions: ['North India'], cuisineAffinities: ['north-indian'] }, tasteProfile: tp({ cuisineAffinities: ['north-indian'], noveltyPreference: 'familiar' }) })],
  ['home-bal', ctx('h5', { preferences: { spiceLevel: 'mild', preferredRegions: ['North India'] }, tasteProfile: tp({ noveltyPreference: 'balanced' }) })],
];

const plans = new Map<string, string[]>();
for (const [name, c] of [...SOUTH_VARIANTS, ...HOME_VARIANTS]) plans.set(name, planIds(gen(c).tray));

console.log('A\\B  jaccard(shared)/20');
for (const [an] of SOUTH_VARIANTS) {
  const row: string[] = [];
  for (const [bn] of HOME_VARIANTS) {
    const a = plans.get(an)!; const b = plans.get(bn)!;
    const shared = a.filter(x => b.includes(x)).length;
    row.push(`${bn.padEnd(18)} ${shared}/20  J=${jaccard(a,b).toFixed(3)}`);
  }
  console.log(`\n== ${an} ==`);
  for (const r of row) console.log(' ', r);
}
