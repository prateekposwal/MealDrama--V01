import { DISH_LIBRARY } from '../../meal/constants/dishLibrary';
import type { TrayLibrary } from '../../app/store/useStore';
import { regenerateMealPlanPipeline, MEAL_SLOTS, fillCandidatesForSlot } from '../../utils/mealPlanRegen';
import type { PersonalizationContext } from '../../utils/mealPersonalization';
import { dishCuisineKeys } from '../../utils/dishTaste';

const emptyTray = (): TrayLibrary => ({ breakfast: [], lunch: [], snacks: [], dinner: [] });
const planIds = (tray: TrayLibrary): string[] => MEAL_SLOTS.flatMap(s => tray[s].map(m => m.dishId || m.id));
const jaccard = (a: string[], b: string[]) => { const sb = new Set(b); const i = a.filter(x => sb.has(x)).length; return i / (a.length + b.length - i); };
const ctx = (userId: string, p: Partial<PersonalizationContext>): PersonalizationContext => ({ userId, deviceId: `dev-${userId}`, healthFocus: 'Balanced', preferences: { spiceLevel: 'medium', preferredRegions: ['North India'], dislikedItems: [] }, ...p });
const gen = (c: PersonalizationContext) => regenerateMealPlanPipeline({ tray: emptyTray(), library: DISH_LIBRARY, diet: 'veg', region: 'north', target: 5, personalization: c });
type TProf = NonNullable<PersonalizationContext['tasteProfile']>;
const tp = (p: Partial<TProf>): TProf => ({ spiceLevel: 'mild', allergies: [], dislikedItems: [], noveltyPreference: 'balanced', cuisineAffinities: [], ...p });

// Device: does the AFFINITY change anything vs same-user-no-affinity? jitter is held CONSTANT (same userId).
const A_aff = ctx('qa-X', { preferences: { spiceLevel: 'mild', preferredRegions: ['North India'], cuisineAffinities: ['south-indian'] }, tasteProfile: tp({ cuisineAffinities: ['south-indian'] }) });
const A_noaff = ctx('qa-X', { preferences: { spiceLevel: 'mild', preferredRegions: ['North India'] }, tasteProfile: tp({}) });
const p_aff = planIds(gen(A_aff).tray);
const p_noaff = planIds(gen(A_noaff).tray);
const shared = p_aff.filter(x => p_noaff.includes(x)).length;
console.log(`[SAME userId qa-X] affinity vs no-affinity: shared=${shared}/20 J=${jaccard(p_aff,p_noaff).toFixed(3)}`);
console.log(`  → affinity alone changes ${20-shared} dishes (0 = affinity DOES NOTHING for a north user)`);

// How many FILLABLE north/all veg dishes carry a south-indian cuisine key?
for (const slot of MEAL_SLOTS) {
  const pool = fillCandidatesForSlot(DISH_LIBRARY, 'veg', 'north', slot, new Set(), new Set());
  const withSouthKey = pool.filter(d => dishCuisineKeys(d).some(k => k.includes('south')));
  console.log(`${slot}: pool=${pool.length} south-keyed=${withSouthKey.length} (${withSouthKey.map(d=>d.name).join(', ')})`);
}
