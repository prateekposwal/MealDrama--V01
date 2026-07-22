/**
 * Comprehensive dish pairings fix — Phase 2 of TELOS pipeline task.
 * Handles single-line dish format: { id: 'dish-name', ... fields ... },
 * 
 * 1. Reads ALL dishes across all arrays in dishLibrary.ts
 * 2. Identifies dishes WITHOUT defaultPairings
 * 3. Assigns culturally/regionally appropriate defaults
 * 4. Writes back with fixes
 *
 * Usage: node scripts/fixAllPairings.mjs
 */

import fs from 'fs';

const FILE = new URL('../meal/constants/dishLibrary.ts', import.meta.url).pathname;
let src = fs.readFileSync(FILE, 'utf8');
const lines = src.split('\n');

// ─── Helper: build defaultPairings object ───

const REGION_PAIRINGS = {
  north: {
    breakfast: { sides: ['Curd', 'Pickle'], beverages: ['Chai'] },
    lunch: { sides: ['Roti', 'Dal', 'Pickle'], beverages: ['Buttermilk'] },
    dinner: { sides: ['Roti', 'Dal', 'Pickle'], beverages: ['Buttermilk'] },
    snacks: { sides: ['Green Chutney', 'Lemon Wedge'], beverages: ['Chai'] },
  },
  south: {
    breakfast: { sides: ['Sambar', 'Coconut Chutney'], beverages: ['Coffee'] },
    lunch: { sides: ['Rice', 'Papad', 'Pickle'], beverages: ['Buttermilk'] },
    dinner: { sides: ['Rice', 'Papad', 'Pickle'], beverages: ['Buttermilk'] },
    snacks: { sides: ['Coconut Chutney', 'Lemon Wedge'], beverages: ['Coffee'] },
  },
  east: {
    breakfast: { sides: ['Aloo Dum', 'Luchi'], beverages: ['Chai'] },
    lunch: { sides: ['Rice', 'Aloo Posto', 'Papad'], beverages: ['Buttermilk'] },
    dinner: { sides: ['Rice', 'Aloo Posto', 'Papad'], beverages: ['Buttermilk'] },
    snacks: { sides: ['Green Chutney', 'Lemon Wedge'], beverages: ['Chai'] },
  },
  west: {
    breakfast: { sides: ['Green Chutney', 'Farsan'], beverages: ['Chai'] },
    lunch: { sides: ['Roti', 'Kadhi', 'Pickle'], beverages: ['Buttermilk'] },
    dinner: { sides: ['Roti', 'Kadhi', 'Pickle'], beverages: ['Buttermilk'] },
    snacks: { sides: ['Green Chutney', 'Farsan'], beverages: ['Chai'] },
  },
  central: {
    breakfast: { sides: ['Dal', 'Pickle'], beverages: ['Chai'] },
    lunch: { sides: ['Roti', 'Dal', 'Pickle'], beverages: ['Buttermilk'] },
    dinner: { sides: ['Roti', 'Dal', 'Pickle'], beverages: ['Buttermilk'] },
    snacks: { sides: ['Green Chutney', 'Lemon Wedge'], beverages: ['Chai'] },
  },
  northeast: {
    breakfast: { sides: ['Steamed Greens', 'Tomato Chutney'], beverages: ['Chai'] },
    lunch: { sides: ['Steamed Rice', 'Fermented Greens', 'Pickle'], beverages: ['Chai'] },
    dinner: { sides: ['Steamed Rice', 'Fermented Greens', 'Pickle'], beverages: ['Chai'] },
    snacks: { sides: ['Tomato Chutney', 'Lemon Wedge'], beverages: ['Chai'] },
  },
  all: {
    breakfast: { sides: ['Toast', 'Lemon Wedge'], beverages: ['Coffee'] },
    lunch: { sides: ['Salad', 'Papad'], beverages: ['Buttermilk'] },
    dinner: { sides: ['Salad', 'Papad'], beverages: ['Buttermilk'] },
    snacks: { sides: ['Dipping Sauce', 'Lemon Wedge'], beverages: ['Buttermilk'] },
  },
};

function getDefaults(region, categories, name, id, tags) {
  const nameL = (name || '').toLowerCase();
  const idL = (id || '').toLowerCase();
  const tagSet = new Set((tags || []).map(t => t.toLowerCase()));
  
  // Beverages get no pairings
  if (tagSet.has('beverage') || tagSet.has('shake') || tagSet.has('juice') || tagSet.has('smoothie') ||
      idL.includes('lassi') || idL.includes('chaas') || idL.includes('shake') || idL.includes('juice') || idL.includes('smoothie')) {
    return null;
  }
  
  // Desserts get dessert pairings
  if (tagSet.has('dessert') || tagSet.has('sweet') || tagSet.has('halwa') || tagSet.has('kheer') || tagSet.has('payasam') ||
      idL.includes('halwa') || idL.includes('kheer') || idL.includes('payasam') || idL.includes('sandesh') || idL.includes('barfi') || idL.includes('ladoo')) {
    return { sides: ['Dry Fruits / Nuts'], beverages: ['Chai'], dessert: ['None'] };
  }
  
  // Soups
  if (tagSet.has('soup') || idL.includes('soup') || nameL.includes('soup') || nameL.includes('shorba') || nameL.includes('rasam') || nameL.includes('saar')) {
    return { sides: ['Croutons', 'Lemon Wedge'], beverages: ['Buttermilk'] };
  }
  
  const reg = REGION_PAIRINGS[region] || REGION_PAIRINGS.all;
  
  if (categories.includes('breakfast')) return { ...reg.breakfast };
  if (categories.includes('snacks') && !categories.some(c => c.includes('lunch') || c.includes('dinner'))) return { ...reg.snacks };
  // Default to lunch/dinner
  if (categories.includes('lunch') || categories.includes('dinner') || categories.includes('winter-') || categories.includes('summer-')) {
    return { ...reg.lunch };
  }
  return { ...reg.lunch }; // fallback
}

// ─── Main scan ───

console.log('🔍 Scanning dishLibrary.ts for dishes without defaultPairings...\n');

let totalDishes = 0;
let totalWithDP = 0;
let totalFixed = 0;
let fixErrors = [];

for (let i = 0; i < lines.length; i++) {
  const line = lines[i];
  const idMatch = line.match(/\{?\s*id:\s*'([^']+)'/);
  if (!idMatch) continue;
  
  const id = idMatch[1];
  if (id.includes('::')) continue; // skip variants
  
  totalDishes++;
  
  // Check if this dish line has defaultPairings
  if (line.includes('defaultPairings:')) {
    totalWithDP++;
    continue;
  }
  
  // Extract fields from the same line
  const nameM = line.match(/name:\s*'([^']+)'/);
  const name = nameM ? nameM[1] : id;
  
  const regionM = line.match(/region:\s*'([^']+)'/);
  const region = regionM ? regionM[1] : 'all';
  
  const catM = line.match(/category:\s*\[([^\]]+)\]/);
  const categories = catM ? catM[1].split(',').map(s => s.trim().replace(/'/g, '')) : ['lunch'];
  
  const tagsM = line.match(/tags:\s*\[([^\]]*)\]/);
  const tags = tagsM ? tagsM[1].split(',').map(s => s.trim().replace(/'/g, '')).filter(Boolean) : [];
  
  const dp = getDefaults(region, categories, name, id, tags);
  
  if (dp === null) {
    // Beverages just need empty pairings
    const insertion = `defaultPairings: { sides: [], beverages: [] }, `;
    // Insert before 'variants:' or before closing '}'
    if (line.includes('variants:')) {
      lines[i] = line.replace(/variants:/, `${insertion}variants:`);
    } else {
      // Insert before the closing brace plus comma
      lines[i] = line.replace(/\},\s*$/, `, ${insertion}},`);
      if (lines[i] === line) {
        // Try before closing }
        lines[i] = line.replace(/\s*\}$/, `, ${insertion}}`);
      }
    }
    if (lines[i] !== line) {
      totalFixed++;
      console.log(`  ✓ L${i+1} ${id.padEnd(30)} → empty beverage pairings`);
    } else {
      fixErrors.push({ line: i+1, id });
    }
  } else {
    // Generate pairings string
    let dpStr = `defaultPairings: { sides: ${JSON.stringify(dp.sides)}, beverages: ${JSON.stringify(dp.beverages)}`;
    if (dp.dessert) dpStr += `, dessert: ${JSON.stringify(dp.dessert)}`;
    dpStr += ' }, ';
    
    const original = line;
    if (line.includes('variants:')) {
      lines[i] = line.replace(/variants:/, `${dpStr}variants:`);
    } else {
      // Remove trailing comma+newline and inject
      const trailingMatch = line.match(/(\s*\}\s*,?\s*)$/);
      if (trailingMatch) {
        lines[i] = line.substring(0, line.length - trailingMatch[1].length) + ', ' + dpStr + '}' + trailingMatch[1].substring(trailingMatch[1].match(/\s*$/) ? trailingMatch[1].match(/\s*$/)[0] : '');
        // Simpler approach: replace }, at end or } at end
        lines[i] = line.replace(/},\s*$/, `, ${dpStr}},`);
        if (lines[i] === line) {
          lines[i] = line.replace(/}\s*$/, `, ${dpStr}}`);
        }
      }
    }
    
    if (lines[i] !== original) {
      totalFixed++;
      const catLabel = categories[0] || '?';
      console.log(`  ✓ L${String(i+1).padStart(5)} ${region.padStart(10)} [${catLabel.padEnd(10)}] ${name.padEnd(40)} → sides:${dp.sides.length} bev:${dp.beverages.length}`);
    } else {
      fixErrors.push({ line: i+1, id, name });
    }
  }
}

// ─── Write back ───
fs.writeFileSync(FILE, lines.join('\n'), 'utf8');

console.log(`\n📊 Summary:`);
console.log(`   Total dishes:     ${totalDishes}`);
console.log(`   Already had dp:   ${totalWithDP}`);
console.log(`   Fixed:            ${totalFixed}`);
console.log(`   Remaining broken: ${fixErrors.length}`);
console.log(`📝 Updated ${FILE}`);

if (fixErrors.length > 0) {
  console.log(`\n⚠️  Fix errors (${fixErrors.length}):`);
  for (const e of fixErrors.slice(0, 10)) {
    console.log(`   L${e.line}: ${e.id} ${e.name || ''}`);
  }
}
