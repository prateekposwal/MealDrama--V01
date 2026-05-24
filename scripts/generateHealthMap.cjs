/**
 * Generate DISH_HEALTH_MAP entries for all dishes missing from healthGuidelines.ts
 */

const fs = require('fs');
const path = require('path');

const dishLib = fs.readFileSync(path.join(__dirname, '..', 'constants', 'dishLibrary.ts'), 'utf8');
const healthFile = fs.readFileSync(path.join(__dirname, '..', 'constants', 'healthGuidelines.ts'), 'utf8');

// ─── Extract existing DISH_HEALTH_MAP keys ─────────────────────────────────────
const hmMatch = healthFile.match(/export const DISH_HEALTH_MAP[\s\S]*?\};\n\nexport const COMPONENT_HEALTH_MAP/);
const existingKeys = new Set();
if (hmMatch) {
  const keyRegex = /'([^']+)':\s*\{/g;
  let km;
  while ((km = keyRegex.exec(hmMatch[0])) !== null) existingKeys.add(km[1]);
}
console.error(`Existing health map entries: ${existingKeys.size}`);

// ─── Extract dish body from startIdx to matching close brace ─────────────────
function extractBraceBody(text, startIdx) {
  let depth = 0, inStr = false, strChar = null;
  for (let i = startIdx; i < text.length; i++) {
    const c = text[i];
    if (inStr) {
      if (c === '\\') { i++; continue; }
      if (c === strChar) inStr = false;
      continue;
    }
    if (c === "'" || c === '"' || c === '`') { inStr = true; strChar = c; continue; }
    if (c === '{') depth++;
    if (c === '}') depth--;
    if (depth === 0) return text.substring(startIdx, i + 1);
  }
  return null;
}

// ─── Count opening vs closing of `variants: [` before a position ─────────────
function isInsideVariantsArray(text, position) {
  // Scan backwards looking for the nearest unmatched `variants: [`
  const beforeText = text.substring(Math.max(0, position - 5000), position);
  let depth = 0;
  for (let i = beforeText.length - 1; i >= 0; i--) {
    const c = beforeText[i];
    if (c === ']') depth++;
    if (c === '[') { depth--; if (depth < 0) {
      // Found the opening `[` — check if preceded by `variants:`
      const beforeBracket = beforeText.substring(Math.max(0, i - 20), i).trim();
      if (beforeBracket.endsWith('variants:')) return true;
      break;
    }}
  }
  return false;
}

// ─── Parse all main dish objects ─────────────────────────────────────────────
const allDishes = [];
let searchPos = 0;
let safety = 0;
while (safety++ < 3000) {
  const idx = dishLib.indexOf('{ id: \'', searchPos);
  if (idx === -1) break;

  // Check this is a main dish (has region: and icon: in first 200 chars)
  const snippet = dishLib.substring(idx, idx + 200);
  if (!snippet.includes('icon:') && !snippet.includes("icon:'") && !snippet.includes('icon:"')) {
    searchPos = idx + 5;
    continue;
  }
  if (!snippet.includes('region:')) {
    searchPos = idx + 5;
    continue;
  }

  // Extract body
  const body = extractBraceBody(dishLib, idx);
  if (!body || body.length < 30) { searchPos = idx + 5; continue; }

  const idMatch = body.match(/id:\s*'([^']+)'/);
  if (!idMatch) { searchPos = idx + 5; continue; }

  const id = idMatch[1];

  // Final verification: body must include 'region:' (main dish only)
  if (!body.includes('region:')) { searchPos = idx + 5; continue; }

  allDishes.push({ id, body });
  searchPos = idx + body.length;
}
console.error(`Found ${allDishes.length} main dish objects`);

const dishMap = new Map(allDishes.map(d => [d.id, d.body]));
const missingIds = [...dishMap.keys()].filter(id => !existingKeys.has(id)).sort();
console.error(`Missing entries: ${missingIds.length}`);

// ─── Helper: extract field from body ─────────────────────────────────────────
function getFieldValue(body, fieldName) {
  const re = new RegExp(`\\b${fieldName}:\\s*`);
  const m = body.match(re);
  if (!m) return null;
  const start = m.index + m[0].length;
  const ch = body[start];

  if (ch === '[') {
    let depth = 1, i = start + 1, inStr = false, strCh = null;
    while (i < body.length && depth > 0) {
      const c = body[i];
      if (inStr) { if (c === '\\') { i += 2; continue; } if (c === strCh) inStr = false; i++; continue; }
      if (c === "'" || c === '"') { inStr = true; strCh = c; i++; continue; }
      if (c === '[') depth++;
      if (c === ']') depth--;
      i++;
    }
    return body.substring(start + 1, i - 1).split(',').map(s => s.trim().replace(/['"]/g, '')).filter(Boolean);
  }

  if (ch === "'" || ch === '"') {
    const end = body.indexOf(ch, start + 1);
    return end === -1 ? null : body.substring(start + 1, end);
  }
  return null;
}

// ─── Classification ──────────────────────────────────────────────────────────
function idIncludes(combined, keywords) {
  return keywords.some(kw => {
    const esc = kw.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    return new RegExp(`(?:^|[\\s-])${esc}(?:s\\b|[\\s-]|$)`).test(combined);
  });
}

const SWEET_IDS = ['halwa','kheer','payasam','pudding','cake','cookie','brownie','muffin',
  'cupcake','donut','pie','ice-cream','nice-cream','shrikhand','basundi','doodhpak',
  'jalebi','gulab','jamun','imarti','kulfi','rabdi','falooda','sandesh','mishti',
  'payesh','pitha','kesari','mysore-pak','haalbai','barfi','dessert','sweet',
  'hot-chocolate','chocolate','cocoa'];

const FRIED_IDS = ['pakora','vada','bonda','tikki','kebab','cutlet','chop','kachori',
  'samosa','puri','bhature','bhaji','pakode','fry','fried','pakoda','bhaja','bhujia'];

const DESSERT_IDS = ['halwa','kheer','payasam','pudding','cake','cookie','brownie','muffin',
  'cupcake','donut','pie','ice-cream','nice-cream','shrikhand','basundi','doodhpak',
  'jalebi','gulab','jamun','imarti','kulfi','rabdi','falooda','sandesh','mishti',
  'payesh','pitha','kesari','mysore-pak','haalbai','dessert','firni','phirni',
  'hot-chocolate','chocolate','cocoa'];

const BEVERAGE_IDS = ['lassi','juice','sharbat','chai','milkshake','smoothie','panaka',
  'neer-mor','sambharam','kokum','sattu','chaas','buttermilk','milk-tea','milk',
  'shake','raab','panna','beverage'];

const WHOLE_GRAIN_IDS = ['ragi','bajra','bajre','jowar','jolada','bhakri','oats','oatmeal',
  'oat','quinoa','brown-rice','whole-wheat','multi-grain','millet','buckwheat','kodo',
  'ragi-mudde','dhindo','nachni','makki','broken-wheat','dalia'];

const REFINED_GRAIN_IDS = ['rice','pulao','biryani','roti','naan','paratha','parotta','puri',
  'bread','pasta','noodles','chow-mein','pizza','burger','sandwich','dosa','appam','idli',
  'vada','upma','poha','pav','pancake','chilla','uttapam','cheela','kulcha','baati',
  'bafla','idiyappam','puttu','poori','lachha','rumali','toast','french-toast',
  'bagel','croissant','biscuit','cereal','tortilla','wrap','quesadilla','burrito'];

const LEGUME_IDS = ['dal','dhal','chana','chole','rajma','masoor','moong','toor','arhar',
  'urad','lentil','bean','chickpea','lobiya','legume','pulse','sambar','sambhar','kadhi','paruppu','pappu'];

const MEAT_IDS = ['mutton','lamb','beef','pork'];

const LEAN_PROTEIN_IDS = ['chicken','fish','prawn','shrimp','crab','egg','paneer','tofu',
'soya','soy','chaap','kheema','murgh','turkey','duck','ham','sausage','bacon',
'vegetarian-protein','plant-protein','seitan','tempeh','soybean','protein'];

const VEG_FRUIT_IDS = ['vegetable','sabzi','salad','soup','saag','palak','spinach','mushroom',
  'cauliflower','broccoli','cabbage','pumpkin','sweet-potato','potato','aloo','baingan',
  'aubergine','eggplant','bhindi','okra','gobi','matar','peas','tomato','onion','carrot','gajar',
  'capsicum','cucumber','beetroot','karela','tori','drumstick','arbi','arvi','fruit',
  'mango','strawberry','blueberry','raspberry','dragon-fruit','watermelon','pineapple',
  'grapes','orange','guava','pomegranate','mixed-veg','thoran','poriyal','avial','olan',
  'erissery','pachadi','bharta','rasam','tamarind','imli','amla','sarson','bhurji','bhaja',
  'bhapa','sundal','sagu','kozhambu','kuzhambu','achar','lemon','lime','mint','pudina',
  'parwal','tinda','lauki','kaddu','turai','dondakaya','tendli','tindora','patal','potol',
  'chutney','saag','kootu','masiyal','pulusu','charu','saaru','greens','lettuce',
  'shalgam','turnip','mooli','radish','patra','alu','tenga','bhaji','shak',
  'herb','herbs','kale','celery','zucchini','courgette','asparagus','artichoke',
  'brussels','sprout','spring-onion','leek','chives','parsley','coriander','dhania',
  'fenugreek','methi','dill','soa','curry-leaf','kadi-patta','nariyal','cabbage',
  'bell-pepper','chilly','chili','jalapeno','olives','corn','sweetcorn','maize',
  'salsa','pico','guacamole','garden-veggie'];

const HEALTHY_FAT_IDS = ['avocado','coconut','olive','nuts','almond','walnut','peanut',
  'cashew','pista','pistachio','sesame','til','flax','chia','sunflower','peanut-butter',
  'akhrot','badaam','kaju','posto','seed','seeds','hemp','pumpkin-seed'];

function generateEntry(id) {
  const body = dishMap.get(id);
  if (!body) return null;

  const dishTags = getFieldValue(body, 'tags') || [];
  const nutrition = getFieldValue(body, 'nutrition') || [];
  const category = getFieldValue(body, 'category') || [];
  const type = getFieldValue(body, 'type') || 'veg';
  const weight = getFieldValue(body, 'weight') || 'medium';
  const name = getFieldValue(body, 'name') || id;
  const combined = (id + ' ' + name).toLowerCase().replace(/-/g, ' ');

  const isSweet = (idIncludes(combined, SWEET_IDS) &&
    !/\bsweet\s+(potato|corn|pepper|lime|onion)\b/.test(combined)) ||
    dishTags.some(t => ['dessert','sweet','sugar','sugary','indulgent'].includes(t)) ||
    nutrition.includes('sweet');

  const isDessert = isSweet || idIncludes(combined, DESSERT_IDS) ||
    dishTags.includes('dessert') || dishTags.includes('halwa') ||
    dishTags.includes('sweet');

  const isFried = idIncludes(combined, FRIED_IDS) ||
    dishTags.includes('fried') || dishTags.includes('crispy') || dishTags.includes('crunchy');

  const isBeverage = idIncludes(combined, BEVERAGE_IDS) ||
    dishTags.some(t => ['beverage', 'drink', 'juice', 'sharbat', 'lassi'].includes(t));

  const isSmoothie = dishTags.includes('smoothie') || combined.includes('smoothie');
  const isSoup = dishTags.includes('soup') || category.includes('soup');

  const healthCategories = [];
  const tags = [];

  // ── Dessert handling (highest priority) ───────────────────────
  if (isDessert) {
    healthCategories.push('dessert');
    tags.push('high-sugar');
    if (weight === 'heavy' || dishTags.includes('indulgent') || dishTags.includes('rich'))
      tags.push('indulgent');
    if (isFried) tags.push('indulgent');
    if (nutrition.includes('calcium') && !tags.includes('calcium')) tags.push('calcium');
    return { id, healthCategories, tags };
  }

  // ── Soup handling ─────────────────────────────────────────────
  if (isSoup) {
    const hasSoupMeat = type === 'non-veg' || type === 'eggitarian' || idIncludes(combined, MEAT_IDS) || idIncludes(combined, ['chicken','fish','prawn','egg']);
    if (hasSoupMeat) {
      healthCategories.push('lean-protein');
      tags.push('high-protein');
    } else {
      healthCategories.push('veg-fruit');
      tags.push('fiber');
    }
    if (weight === 'light') tags.push('low-calorie');
    return { id, healthCategories, tags };
  }

  // ── Beverage handling ─────────────────────────────────────────
  if (isBeverage) {
    const isSugaryBev = isSweet || isSmoothie || combined.includes('milkshake') ||
      combined.includes('milk-tea');
    if (isSugaryBev) {
      healthCategories.push('sugary-beverage');
    } else {
      healthCategories.push('healthy-beverage');
      if (combined.includes('chai') || combined.includes('tea') || combined.includes('coffee'))
        tags.push('antioxidant');
    }
    if (idIncludes(combined, ['lassi','chaas','buttermilk','milk','dahi','milkshake'])) {
      if (!healthCategories.includes('dairy')) healthCategories.push('dairy');
      if (idIncludes(combined, ['lassi','chaas','buttermilk','dahi'])) tags.push('probiotic');
    }
    if (idIncludes(combined, HEALTHY_FAT_IDS)) tags.push('healthy');
    if (nutrition.includes('protein') && !tags.includes('high-protein')) tags.push('high-protein');
    if (weight === 'light') tags.push('low-calorie');
    return { id, healthCategories, tags };
  }

  // ── Grain type ────────────────────────────────────────────────
  const hasWholeGrain = idIncludes(combined, WHOLE_GRAIN_IDS) ||
    dishTags.some(t => ['oats', 'ragi', 'bajra', 'jowar', 'millet', 'high-fiber'].includes(t));
  const hasRefinedGrain = !hasWholeGrain && (
    idIncludes(combined, REFINED_GRAIN_IDS) ||
    dishTags.some(t => ['rice', 'pulao', 'biryani', 'pasta', 'noodles', 'bread', 'roti', 'naan', 'pancake'].includes(t))
  );

  if (hasWholeGrain) { healthCategories.push('whole-grain'); tags.push('high-fiber'); }
  else if (hasRefinedGrain) { healthCategories.push('refined-grain'); tags.push('high-carb');
    if (weight === 'heavy') tags.push('high-calorie'); }

  // ── Protein ──────────────────────────────────────────────────
  const hasMeat = type === 'non-veg' || idIncludes(combined, MEAT_IDS);
  const hasLeanProtein = idIncludes(combined, LEAN_PROTEIN_IDS) ||
    type === 'eggitarian' || nutrition.includes('protein') || dishTags.includes('high-protein');
  const hasLegume = idIncludes(combined, LEGUME_IDS) ||
    dishTags.some(t => ['dal','chole','rajma','legume','pulse','bean','chickpea'].includes(t));
  const isRedMeat = hasMeat && idIncludes(combined, MEAT_IDS);

  if (isRedMeat) { healthCategories.push('red-meat'); tags.push('high-protein','high-fat'); }
  else if (hasLeanProtein && !hasLegume) { healthCategories.push('lean-protein'); tags.push('high-protein'); }
  if (hasLegume) { healthCategories.push('legume'); tags.push('high-protein','fiber'); }

  // ── Vegetables / Fruits ───────────────────────────────────────
  const hasVegFruit = idIncludes(combined, VEG_FRUIT_IDS) ||
    dishTags.some(t => ['salad','vegetable','herb','greens','fiber','veggie','bhaji','sabzi','thoran','bharta'].includes(t)) ||
    category.includes('salad');

  if (hasVegFruit) {
    healthCategories.push('veg-fruit');
    tags.push('fiber');
    if (nutrition.includes('vitamin-c') || nutrition.includes('vitamin-a')) tags.push('vitamins');
    if (weight === 'light') tags.push('low-calorie');
  }

  // ── Fats ──────────────────────────────────────────────────────
  const hasUnhealthyFat = idIncludes(combined, ['butter','cream','malai','cheese','ghee']) ||
    dishTags.includes('high-fat') || dishTags.includes('rich') || dishTags.includes('indulgent');
  const hasHealthyFat = idIncludes(combined, HEALTHY_FAT_IDS) ||
    nutrition.includes('healthy-fats') || dishTags.includes('healthy-fat');

  if (isFried) { healthCategories.push('fried'); tags.push('high-fat');
    if (weight === 'heavy') tags.push('high-calorie'); }
  else if (hasUnhealthyFat && hasHealthyFat) { healthCategories.push('healthy-fat'); tags.push('healthy'); }
  else if (hasUnhealthyFat) { healthCategories.push('unhealthy-fat'); tags.push('high-fat'); }
  else if (hasHealthyFat) { healthCategories.push('healthy-fat'); }

  // ── Starchy veg ──────────────────────────────────────────────
  if (!healthCategories.includes('veg-fruit') && !hasVegFruit &&
      idIncludes(combined, ['potato','aloo','sweet-potato','arbi','sabudana','kappa','tapioca','yam','suran'])) {
    healthCategories.push('starchy-veg');
  }

  // ── Weight-based tags ───────────────────────────────────────
  if (weight === 'light' && !tags.includes('low-calorie')) tags.push('low-calorie');
  if (weight === 'heavy' && !tags.includes('high-calorie') && !tags.includes('indulgent')) tags.push('high-calorie');

  // ── Nutrition-based tags ─────────────────────────────────────
  if (nutrition.includes('protein') && !tags.includes('high-protein')) tags.push('high-protein');
  if (nutrition.includes('fiber') && !tags.includes('fiber')) tags.push('fiber');
  if ((nutrition.includes('vitamin-c') || nutrition.includes('vitamin-a')) && !tags.includes('vitamins')) tags.push('vitamins');
  if (nutrition.includes('iron') && !tags.includes('iron')) tags.push('iron');
  if (nutrition.includes('calcium') && !tags.includes('calcium')) tags.push('calcium');

  // ── Dish-tags derived ────────────────────────────────────────
  if (dishTags.includes('healthy') && !tags.includes('healthy')) tags.push('healthy');
  if (dishTags.includes('indulgent') && !tags.includes('indulgent')) tags.push('indulgent');
  if (dishTags.includes('fermented') && !tags.includes('probiotic')) tags.push('probiotic');
  if (dishTags.includes('low-calorie') && !tags.includes('low-calorie')) tags.push('low-calorie');
  if (dishTags.includes('low-fat') && !tags.includes('low-fat')) tags.push('low-fat');
  if (dishTags.includes('high-protein') && !tags.includes('high-protein')) tags.push('high-protein');

  // ── Dedup ─────────────────────────────────────────────────────
  return { id, healthCategories: [...new Set(healthCategories)], tags: [...new Set(tags)] };
}

// ─── Main ────────────────────────────────────────────────────────────────────────
console.error(`Generating ${missingIds.length} entries...`);
const entries = missingIds.map(generateEntry).filter(Boolean);
console.error(`\n✅ Generated ${entries.length}/${missingIds.length} entries`);

// Also write file
const outPath = path.join(__dirname, '..', 'constants', 'autoHealthMap.ts');
const out = entries.map(e =>
  `  '${e.id}': { healthCategories: ${JSON.stringify(e.healthCategories)}, tags: ${JSON.stringify(e.tags)} },`
).join('\n');
fs.writeFileSync(outPath, `// Auto-generated DISH_HEALTH_MAP entries — ${entries.length} total\n\n${out}\n`);
console.error(`Written to: ${outPath}`);
