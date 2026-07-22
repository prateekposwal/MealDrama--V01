/**
 * Fix defaultPairings for dishes flagged by audit.
 * Reads dishLibrary.ts, patches specific patterns, writes back.
 *
 * Usage: node scripts/fixPairings.mjs
 */

import fs from 'fs';

const FILE = new URL('../meal/constants/dishLibrary.ts', import.meta.url).pathname;
let src = fs.readFileSync(FILE, 'utf8');
const lines = src.split('\n');

let fixCount = 0;

function fixLineContaining(search, pattern, replacement) {
  for (let i = 0; i < lines.length; i++) {
    if (lines[i].includes(search)) {
      const before = lines[i];
      lines[i] = lines[i].replace(pattern, replacement);
      if (before !== lines[i]) {
        fixCount++;
        console.log(`  ✓ L${i + 1}: ${search.slice(0, 50)}`);
      } else {
        console.log(`  ✗ L${i + 1} NO CHANGE: ${search.slice(0, 50)}`);
      }
      return;
    }
  }
  console.log(`  ✗ NOT FOUND: ${search}`);
}

// ─── R8: Soups without beverages — add beverages: ['Buttermilk'] ─────────
// These have defaultPairings: { sides: [...] } without a beverages key
const soups = [
  'ulava-charu',
  'tomato-saar',
  'chana-sattu-soup',
  'lemon-coriander-soup',
  'hot-and-sour-soup',
  'lebanese-lentil-soup',
  'vegan-tomato-soup',
  'ginger-carrot-coconut-soup',
  'curried-sweet-potato-soup',
  'pumpkin-and-sweet-potato-soup',
  'vegetarian-taco-soup',
];

for (const id of soups) {
  fixLineContaining(
    `id: '${id}'`,
    /(defaultPairings:\s*\{[^}]*?)(\})/,
    '$1beverages: [\'Buttermilk\']$2',
  );
}

// ─── Ragi Mudde ───
fixLineContaining(
  "id: 'ragi-mudde'",
  /(defaultPairings:\s*\{[^}]*?)(\})/,
  '$1beverages: [\'Buttermilk\']$2',
);

// ─── R8: Fusion dishes ────────────────────────────────────────────────────
const fusionMap = {
  'vegan-tofu-salad-sandwich': "['Fruit Juice']",
  'bbq-jackfruit-burrito-bowl': "['Buttermilk']",
  'veggie-shawarma-with-tofu': "['Buttermilk']",
  'vegan-sushi-bowl': "['Green Tea']",
  'high-protein-veggie-burgers': "['Buttermilk']",
  'vegetarian-fajita-bowl': "['Buttermilk']",
};

for (const [id, bev] of Object.entries(fusionMap)) {
  fixLineContaining(
    `id: '${id}'`,
    /(defaultPairings:\s*\{[^}]*?)(\})/,
    `$1beverages: ${bev}$2`,
  );
}

// ─── R15: Breakfast dishes ────────────────────────────────────────────────
const breakfastMap = {
  'healthy-oatmeal-banana-pancakes': "['Coffee']",
  'vegan-potato-pancakes': "['Coffee']",
  'classic-pancakes': "['Coffee']",
  'vegan-french-toast-casserole': "['Coffee']",
  'blueberry-banana-oat-bread': "['Coffee']",
  'banana-bread-without-butter': "['Coffee']",
  'banana-bread-without-brown-sugar': "['Coffee']",
  'banana-peanut-butter-sandwich': "['Milk']",
  'mushroom-toast': "['Coffee']",
};

for (const [id, bev] of Object.entries(breakfastMap)) {
  fixLineContaining(
    `id: '${id}'`,
    /(defaultPairings:\s*\{[^}]*?)(\})/,
    `$1beverages: ${bev}$2`,
  );
}

// ─── Spicy Sweet Potato Breakfast Hash (has Water, Tea → Coffee) ──────────
fixLineContaining(
  "id: 'spicy-sweet-potato-breakfast-hash'",
  /beverages:\s*\[[^\]]*\]/,
  "beverages: ['Coffee']",
);

// ─── Sheer Khurma ─────────────────────────────────────────────────────────
fixLineContaining(
  "id: 'sheer-khurma'",
  /(defaultPairings:\s*\{[^}]*?)(\})/,
  "$1beverages: ['Chai']$2",
);

// ─── Write back ───────────────────────────────────────────────────────────
fs.writeFileSync(FILE, lines.join('\n'), 'utf8');
console.log(`\n✅ ${fixCount} fixes applied to ${FILE}`);
