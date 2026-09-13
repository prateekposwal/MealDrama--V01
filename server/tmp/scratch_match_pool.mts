import { DISH_LIBRARY } from '../../meal/constants/dishLibrary';
import { fillCandidatesForSlot, MEAL_SLOTS } from '../../utils/mealPlanRegen';
import { dishCuisineKeys } from '../../utils/dishTaste';
const aff = 'south-indian';
for (const slot of MEAL_SLOTS) {
  const pool = fillCandidatesForSlot(DISH_LIBRARY, 'veg', 'north', slot, new Set(), new Set());
  const exact = pool.filter(d => dishCuisineKeys(d).includes(aff));
  const fam = pool.filter(d => dishCuisineKeys(d).some(k => k.includes('south')));
  console.log(`${slot}: pool=${pool.length} EXACT 'south-indian' tag=${exact.length} ${exact.map(d=>d.name).slice(0,6).join(', ')}${exact.length>6?' …':''} | family(south)=${fam.length}`);
}
// what keys does a region-south dish carry?
const rasam = DISH_LIBRARY.find(d => d.id === 'rasam');
console.log('rasam keys:', rasam ? dishCuisineKeys(rasam) : 'not found');
const dosa = DISH_LIBRARY.find(d => d.id === 'dosa');
console.log('dosa keys:', dosa ? dishCuisineKeys(dosa) : 'not found', '| dosa region:', dosa?.region, '| dosa tags:', dosa?.tags);
