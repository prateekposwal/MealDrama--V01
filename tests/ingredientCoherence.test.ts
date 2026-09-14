import { it, expect } from 'vitest';
import { DISH_LIBRARY } from '../meal/constants/dishLibrary';
import { getIngredientsForMealOption } from '../utils/ingredientUtils';

type Mains = string[];

// Dish SLUG token → ingredient-name fragments that MUST be present in the
// resolved list. Slug-only (not display name): display names carry serving
// suggestions ("with rice/roti/naan") that are defaultPairing accompaniments,
// not recipe mains. Bread-flour tokens are limited to dough-principal dishes,
// NOT pairing breads (phulka/roti/naan as a side).
const MAIN_TOKENS: Array<{ re: RegExp; mains: Mains; label: string }> = [
  { re: /\b(?:chicken|murgh|kozhi|koli)\b/, mains: ['chicken'], label: 'Chicken' },
  { re: /\b(?:mutton|gosht|lamb|erachi|botti|nalli)\b/, mains: ['mutton', 'lamb'], label: 'Mutton/Lamb' },
  { re: /\bpaya\b|\btrotter\b/, mains: ['paya', 'trotter'], label: 'Paya/Trotter' },
  { re: /\bpork\b|\bvawksa\b|\bdoh\b|\bphagshapa\b/, mains: ['pork'], label: 'Pork' },
  { re: /\b(?:fish|macchi|meen|machher|ilish|rohu|bangda|pomfret|nakham)\b/, mains: ['fish', 'salmon', 'mackerel', 'rohu', 'pomfret'], label: 'Fish' },
  { re: /\b(?:prawn|chingri|jhinga)\b/, mains: ['prawn', 'shrimp'], label: 'Prawns' },
  { re: /\bcrab\b|\bnandu\b/, mains: ['crab'], label: 'Crab' },
  { re: /\bgoose\b/, mains: ['goose'], label: 'Goose' },
  { re: /\phale\b/, mains: ['flour', 'bread', 'maida'], label: 'Sha Phaley bread' },
  { re: /\b(?:egg|anda|dim)\b/, mains: ['egg'], label: 'Egg (skipped for vegan tofu-tuna mimics)' },
  { re: /\bpaneer\b/, mains: ['paneer'], label: 'Paneer' },
  { re: /\btofu\b/, mains: ['tofu'], label: 'Tofu' },
  { re: /\b(?:chole|chana|chickpea|kadala)\b/, mains: ['chickpea', 'chana', 'garbanzo'], label: 'Chickpeas' },
  { re: /\brajma\b/, mains: ['rajma', 'kidney'], label: 'Rajma' },
  { re: /\bmoong\b/, mains: ['moong'], label: 'Moong' },
  { re: /\b(?:masoor|red lentil)\b/, mains: ['masoor', 'red lentil', 'lentils'], label: 'Masoor' },
  { re: /\burad\b/, mains: ['urad', 'black gram'], label: 'Urad' },
  { re: /\b(?:aloo|potato)\b/, mains: ['potato'], label: 'Potato' },
  { re: /\bmatar\b|\bpeas\b/, mains: ['peas', 'matar'], label: 'Green Peas' },
  { re: /\bpalak\b/, mains: ['spinach', 'palak'], label: 'Spinach' },
  { re: /\bsarson\b/, mains: ['sarson', 'mustard greens'], label: 'Sarson/Mustard Greens' },
  { re: /\b(?:gobhi?|cauliflower)\b/, mains: ['cauliflower', 'gobi'], label: 'Cauliflower' },
  { re: /\b(?:bhindi|okra)\b/, mains: ['okra', 'bhindi'], label: 'Okra' },
  { re: /\b(?:baingan|eggplant|aubergine|brinjal|vangi)\b/, mains: ['eggplant', 'baingan', 'aubergine'], label: 'Eggplant' },
  { re: /\bkarela\b/, mains: ['bitter gourd', 'karela'], label: 'Bitter Gourd' },
  { re: /\b(?:methi|fenugreek)\b/, mains: ['fenugreek', 'methi'], label: 'Fenugreek/Methi' },
  { re: /\b(?:lauki|bottle gourd|dudhi)\b/, mains: ['bottle gourd', 'lauki', 'dudhi'], label: 'Bottle Gourd' },
  { re: /\btinda\b/, mains: ['tinda', 'apple gourd'], label: 'Tinda' },
  { re: /\b(?:parwal|pointed gourd)\b/, mains: ['pointed gourd', 'parwal'], label: 'Parwal' },
  { re: /\bmushroom\b/, mains: ['mushroom'], label: 'Mushroom' },
  { re: /\b(?:makai|sweet corn|corn)\b/, mains: ['corn', 'sweet corn'], label: 'Corn' },
  { re: /\bsweet potato\b|\bshakarkand\b/, mains: ['sweet potato'], label: 'Sweet Potato' },
  { re: /\b(?:kaddu|pumpkin)\b/, mains: ['pumpkin'], label: 'Pumpkin' },
  { re: /\bgajar\b|\bcarrot\b/, mains: ['carrot'], label: 'Carrot' },
  { re: /\b(?:beetroot|beet)\b/, mains: ['beetroot', 'beet'], label: 'Beetroot' },
  { re: /\b(?:capsicum|bell pepper|shimla)\b/, mains: ['capsicum', 'bell pepper'], label: 'Capsicum' },
  { re: /\bbroccoli\b/, mains: ['broccoli'], label: 'Broccoli' },
  { re: /\bcabbage\b/, mains: ['cabbage'], label: 'Cabbage' },
  { re: /\bapple\b|\bseb\b/, mains: ['apple'], label: 'Apple' },
  { re: /\bbanana\b/, mains: ['banana'], label: 'Banana' },
  { re: /\bmango\b|\baam\b/, mains: ['mango'], label: 'Mango' },
  { re: /\bpineapple\b|\bananas\b/, mains: ['pineapple'], label: 'Pineapple' },
  { re: /\bgrapes\b|\bangoor\b/, mains: ['grape'], label: 'Grapes' },
  { re: /\bwatermelon\b|\btarbuz\b/, mains: ['watermelon'], label: 'Watermelon' },
  { re: /\bpapaya\b/, mains: ['papaya'], label: 'Papaya' },
  { re: /\b(?:avocado|avacado)\b/, mains: ['avocado'], label: 'Avocado' },
  { re: /\bwalnut\b/, mains: ['walnut'], label: 'Walnuts' },
  { re: /\b(?:almond|badam)\b/, mains: ['almond'], label: 'Almonds' },
  { re: /\bpeanut\b|\bmungfali\b/, mains: ['peanut'], label: 'Peanuts/Peanut Butter' },
  { re: /\b(?:coconut|nariyal)\b/, mains: ['coconut'], label: 'Coconut' },
  { re: /\b(?:oats|oatmeal)\b/, mains: ['oats'], label: 'Oats' },
  { re: /\bbiryani\b|\bpulao\b|\bpilaf\b/, mains: ['rice', 'basmati rice'], label: 'Rice (biriyani/pulao)' },
  { re: /\b(?:rice|chawal)\b/, mains: ['rice'], label: 'Rice' },
  { re: /\b(?:poha|beaten rice)\b/, mains: ['poha', 'beaten rice'], label: 'Poha' },
  { re: /\bnoodles?\b|\bhakka\b|\bchow mein\b|\bchop suey\b/, mains: ['noodles'], label: 'Noodles' },
  { re: /\bpasta\b/, mains: ['pasta'], label: 'Pasta' },
  { re: /\bbread\b|\btoast\b/, mains: ['bread', 'flour', 'atta', 'maida'], label: 'Bread/loaf' },
  { re: /\b(?:paratha|bhatura|luchi)\b/, mains: ['flour', 'atta', 'wheat flour', 'maida'], label: 'Dough bread (paratha/bhatura/luchi)' },
  { re: /\bpuri\b/, mains: ['puri', 'maida', 'flour'], label: 'Puri (chaat crispies OR homemade dough)' },
  { re: /\b(?:curd|dahi|yogurt)\b|(?<!sol )kadhi\b/, mains: ['yogurt', 'curd'], label: 'Yogurt/Curd' },
  { re: /\b(?:doodh|milk)\b/, mains: ['milk'], label: 'Milk' },
];

it('no dish resolves a meat protein onto a veg/vegan dish (variant diet respected)', () => {
  const meatNames = ['chicken', 'mutton', 'lamb', 'pork', 'minced meat', 'goose'];
  const offenders: string[] = [];
  for (const d of DISH_LIBRARY) {
    const dType = (d.type || '').toLowerCase();
    if (dType !== 'veg' && dType !== 'vegan') continue;
    for (const v of d.variants ?? []) {
      // A properly diet-tagged variant (mushroom-pulao-raita diet:'veg',
      // panch-phoran-tarka::ppt-chicken diet:'non-veg') is a legit override.
      if (v.diet && v.diet !== 'veg') continue;
      const names = getIngredientsForMealOption(d.id, v.id, DISH_LIBRARY).map(i => i.name.toLowerCase());
      const bad = meatNames.filter(m => names.some(n => n.includes(m)));
      if (bad.length) offenders.push(`${d.id}::${v.id} (type ${dType}, variant diet ${v.diet ?? 'none'}) resolves ${bad.join(', ')}`);
    }
  }
  expect(offenders, offenders.join('\n')).toEqual([]);
});

it('every dish resolves the mains its slug names (the whole-library check)', () => {
  const offenders: string[] = [];
  for (const d of DISH_LIBRARY) {
    const slug = d.id.replace(/-/g, ' ');
    const dType = (d.type || '').toLowerCase();
    for (const { re, mains, label } of MAIN_TOKENS) {
      if (!re.test(slug)) continue;
      // Vegan egg-salad mimics (tofu + kala namak) intentionally omit Egg.
      if (label.startsWith('Egg') && dType === 'vegan') continue;
      for (const v of d.variants ?? []) {
        const names = getIngredientsForMealOption(d.id, v.id, DISH_LIBRARY).map(i => i.name.toLowerCase());
        const ok = mains.some(m => names.some(n => n.includes(m)));
        if (!ok) offenders.push(`${label}: ${d.id}::${v.id} → none of [${mains.join(', ')}] (resolved ${names.slice(0, 12).join(', ')})`);
      }
    }
  }
  expect(offenders, offenders.join('\n')).toEqual([]);
});