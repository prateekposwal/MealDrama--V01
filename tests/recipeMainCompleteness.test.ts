import { describe, it, expect } from 'vitest';
import { DISH_LIBRARY, type Dish } from '../meal/constants/dishLibrary';
import { getIngredientsForMealOption } from '../utils/ingredientUtils';
import { recipeIngredients } from '../utils/buyByDish';

// dish-slug/name token → regex → resolved ingredient fragments that satisfy the main.
// All token regexes are word-boundary safe (paya ≠ paya-sam, macchi ≠ macchi-ato).
const MAIN_SIGNATURES: Array<{ re: RegExp; frags: string[]; label: string }> = [
  { re: /\b(?:chicken|murgh|kozhi)\b/, frags: ['chicken'], label: 'Chicken' },
  { re: /\b(?:mutton|yakhni|gosht|lamb)\b/, frags: ['mutton', 'lamb'], label: 'Mutton/Lamb' },
  { re: /\bpaya\b/, frags: ['mutton', 'paya', 'trotter'], label: 'Paya' },
  { re: /\bpork\b|\bphagshapa\b/, frags: ['pork'], label: 'Pork' },
  { re: /\b(?:fish|machher|meen|ilish)\b/, frags: ['fish', 'salmon', 'mackerel', 'pomfret', 'rohu'], label: 'Fish' },
  { re: /\b(?:prawn|chingri|shrimp)\b/, frags: ['prawn', 'shrimp'], label: 'Prawns' },
  { re: /\bcrab\b/, frags: ['crab'], label: 'Crab' },
  { re: /\bpaneer\b/, frags: ['paneer'], label: 'Paneer' },
  { re: /\btofu\b/, frags: ['tofu'], label: 'Tofu' },
  { re: /\b(?:chole|chickpea|chana|kadala)\b/, frags: ['chickpea', 'chana', 'garbanzo'], label: 'Chickpeas' },
  { re: /\brajma\b/, frags: ['rajma'], label: 'Rajma' },
  { re: /\bmoong\b/, frags: ['moong dal'], label: 'Moong Dal' },
  { re: /\bred[-\s]?lentil\b|\bmasoor\b/, frags: ['lentil', 'masoor'], label: 'Red Lentil' },
  { re: /\b(?:toor|arhar|tur)\b/, frags: ['toor'], label: 'Toor Dal' },
  { re: /\b(?:aloo|potato)\b/, frags: ['potato'], label: 'Potatoes' },
  { re: /\b(?:gobhi|gobi|cauliflower)\b/, frags: ['cauliflower'], label: 'Cauliflower' },
  { re: /\bmatar\b|\bgreen[-\s]?peas\b/, frags: ['pea', 'matar'], label: 'Green Peas' },
  { re: /\b(?:bhindi|okra)\b/, frags: ['okra'], label: 'Okra' },
  { re: /\b(?:palak|spinach)\b/, frags: ['spinach', 'palak'], label: 'Spinach' },
  { re: /\bmushroom\b/, frags: ['mushroom'], label: 'Mushroom' },
  { re: /\bbroccoli\b/, frags: ['broccoli'], label: 'Broccoli' },
  { re: /\b(?:carrot|gajar)\b/, frags: ['carrot'], label: 'Carrot' },
  { re: /\bbeetroot\b/, frags: ['beetroot'], label: 'Beetroot' },
  { re: /\bsweet[-\s]?potato\b|\bshakarkand\b/, frags: ['sweet potato'], label: 'Sweet Potato' },
  { re: /\b(?:pumpkin|kaddu)\b/, frags: ['pumpkin'], label: 'Pumpkin' },
  { re: /\bavocado\b/, frags: ['avocado'], label: 'Avocado' },
  { re: /\b(?:pasta|spaghetti|macaroni)\b/, frags: ['pasta'], label: 'Pasta' },
  { re: /\b(?:rice|biryani|pulao)\b/, frags: ['rice'], label: 'Rice' },
  { re: /\b(?:noodle|chow[-\s]?mein|hakka)\b/, frags: ['noodle'], label: 'Noodles' },
  { re: /\bpoha\b/, frags: ['poha', 'rice flakes', 'flattened rice'], label: 'Poha' },
  { re: /\boats\b/, frags: ['oats', 'oat'], label: 'Oats' },
  { re: /\b(?:eggs?|anda)\b/i, frags: ['egg'], label: 'Egg' },
];

function signaturesFor(dish: Dish): typeof MAIN_SIGNATURES {
  const hay = `${dish.id.replace(/-/g, ' ')} ${dish.name}`.toLowerCase();
  // A vegAN/eggless/veggie dish never expects an egg main; black-eyed peas /
  // lobiya are a PULSE, not green peas. Exclude only those NEGATIVE labels
  // and keep normal name-implied matching for everything else.
  const excluded = new Set<string>();
  if (/\b(?:veggie|vegetarian|vegan|eggless)\b/.test(hay)) excluded.add('Egg');
  if (/\bblack[-\s]?eyed peas\b/.test(dish.name.toLowerCase()) || /\blobiya\b/.test(hay)) excluded.add('Green Peas');
  return MAIN_SIGNATURES.filter(s => s.re.test(hay) && !excluded.has(s.label));
}

function signals(names: string[], frags: string[]): string | null {
  const low = names.map(n => n.toLowerCase());
  for (const f of frags) {
    if (low.some(n => n.includes(f))) return f;
  }
  return null;
}

describe('no dish ships without its namesake main', () => {
  function scan(surface: (d: Dish) => string[]): string[] {
    const missing: string[] = [];
    for (const dish of DISH_LIBRARY) {
      const sigs = signaturesFor(dish);
      if (sigs.length === 0) continue;
      const names = surface(dish);
      for (const s of sigs) {
        if (!signals(names, s.frags)) missing.push(`${dish.id} (${s.label}) → ${names.slice(0, 5).join(', ')}`);
      }
    }
    return [...new Set(missing)];
  }

  it('getIngredientsForMealOption — every name-implied main is present', () => {
    const missing = scan(d => getIngredientsForMealOption(d.id, d.variants[0]?.id ?? d.id, DISH_LIBRARY).map(i => i.name));
    console.log('RESOLVER GAPS:\n' + missing.join('\n'));
    expect(missing).toEqual([]);
  });

  it('recipeIngredients (buy surface) — every name-implied main is present', () => {
    const missing = scan(d => recipeIngredients(d, DISH_LIBRARY, d.type).map(i => i.name));
    console.log('BUY GAPS:\n' + missing.join('\n'));
    expect(missing).toEqual([]);
  });
});