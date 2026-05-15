// Generate dishes for South, West, East, Central, Northeast regions
// Usage: node scripts/generateDishes.js

const ICONS = {
  south: ['🍛', '🥘', '🍲', '🍚', '🍜', '🥗', '🫕', '🍵', '🥟', '🍢', '🍧', '🥛', '🌶️', '🥥', '🍌'],
  west: ['🍛', '🥘', '🍲', '🍚', '🍜', '🥗', '🫕', '🍵', '🥟', '🍢', '🍧', '🥛', '🌶️', '🥜', '🫓'],
  east: ['🍛', '🥘', '🍲', '🍚', '🍜', '🥗', '🫕', '🍵', '🥟', '🍢', '🍧', '🥛', '🐟', '🍤', '🎋'],
  central: ['🍛', '🥘', '🍲', '🍚', '🍜', '🥗', '🫕', '🍵', '🥟', '🍢', '🍧', '🥛', '🫓', '🌿', '🍖'],
  northeast: ['🍛', '🥘', '🍲', '🍚', '🍜', '🥗', '🫕', '🍵', '🥟', '🍢', '🍧', '🥛', '🎋', '🐖', '🌶️'],
};

const VARIANTS = {
  rice: (name, id) => [
    `{ id: '${id}-rice', name: '${name} + Rice', addOn: 'with rice', mealContext: 'lunch' }`,
    `{ id: '${id}-roti', name: '${name} + Roti', addOn: 'with roti', mealContext: 'dinner' }`,
    `{ id: '${id}-paratha', name: '${name} + Paratha', addOn: 'with paratha', mealContext: 'dinner' }`,
    `{ id: '${id}-thali', name: '${name} Thali', addOn: 'thali set', mealContext: 'lunch' }`,
  ],
  styles: (name, id, styles) => styles.map(s => `{ id: '${id}-${s.toLowerCase().replace(/\s+/g, '-')}', name: '${name} ${s}', cookingStyle: '${s.toLowerCase()}' }`),
  classic: (name, id, contexts = ['lunch']) => contexts.map(c => `{ id: '${id}-classic', name: '${name} Classic', mealContext: '${c}' }`),
};

function makeDish(name, id, region, states, category, type, weight, nutrition, tags, variants, icon = null) {
  const r = ICONS[region];
  const i = icon || r[Math.floor(Math.random() * r.length)];
  const statesArr = states.length > 0 ? `['${states.join("', '")}']` : '[]';
  const catArr = `['${category.join("', '")}']`;
  const nutArr = `['${nutrition.join("', '")}']`;
  const tagArr = `['${tags.join("', '")}']`;
  
  // Convert variant objects to strings if needed
  const varLines = variants.map(v => {
    if (typeof v === 'string') return `            ${v}`;
    // Convert object to string format
    const props = [];
    if (v.id) props.push(`id: '${v.id}'`);
    if (v.name) props.push(`name: '${v.name}'`);
    if (v.cookingStyle) props.push(`cookingStyle: '${v.cookingStyle}'`);
    if (v.addOn) props.push(`addOn: '${v.addOn}'`);
    if (v.mealContext) props.push(`mealContext: '${v.mealContext}'`);
    if (v.regionOverride) props.push(`regionOverride: '${v.regionOverride}'`);
    if (v.accompaniments) props.push(`accompaniments: ['${v.accompaniments.join("', '")}']`);
    return `            { ${props.join(', ')} }`;
  }).join(',\n');
  
  return `    {
        id: '${id}',
        name: '${name}',
        icon: '${i}',
        region: '${region}' as Region,
        states: ${statesArr},
        category: ${catArr},
        type: '${type}',
        weight: '${weight}',
        nutrition: ${nutArr},
        tags: ${tagArr},
        variants: [
${varLines}
        ],
    }`;
}

// SOUTH INDIA - 80 dishes
function generateSouth() {
  const dishes = [];
  
  // Breakfast items (15)
  dishes.push(makeDish('Kara Kuzhambu', 'kara-kuzhambu', 'south', ['Tamil Nadu'], ['breakfast'], 'veg', 'light', ['carb'], ['tangy', 'curry'],
    VARIANTS.classic('Kara Kuzhambu', 'kara-kuzhambu', ['breakfast']).concat([
      `{ id: 'kara-kuzhambu-rice', name: 'Kara Kuzhambu + Rice', addOn: 'with rice' }`
    ])));
  dishes.push(makeDish('Vada Curry', 'vada-curry', 'south', ['Tamil Nadu', 'Kerala'], ['breakfast'], 'veg', 'light', ['carb', 'protein'], ['comfort', 'street-food'],
    VARIANTS.classic('Vada Curry', 'vada-curry', ['breakfast']).concat([
      `{ id: 'vada-curry-dosa', name: 'Vada Curry + Dosa', addOn: 'with dosa' }`
    ])));
  dishes.push(makeDish('Pongal Upma', 'pongal-upma', 'south', ['Karnataka', 'Tamil Nadu'], ['breakfast'], 'veg', 'medium', ['carb'], ['one-pot', 'comfort'],
    VARIANTS.classic('Pongal Upma', 'pongal-upma', ['breakfast'])));
  dishes.push(makeDish('Semiya Upma', 'semya-upma', 'south', ['Karnataka', 'Tamil Nadu'], ['breakfast'], 'veg', 'light', ['carb'], ['quick', 'vermicelli'],
    VARIANTS.classic('Semiya Upma', 'semya-upma', ['breakfast'])));
  dishes.push(makeDish('Rava Dosa', 'rava-dosa-special', 'south', ['Karnataka', 'Tamil Nadu', 'Andhra Pradesh'], ['breakfast'], 'veg', 'medium', ['carb'], ['crispy', 'semolina'],
    [{ id: 'rava-dosa-plain', name: 'Rava Dosa Plain', cookingStyle: 'crispy' }, { id: 'rava-dosa-masala', name: 'Rava Masala Dosa', cookingStyle: 'masala' }, { id: 'rava-dosa-onion', name: 'Rava Onion Dosa', cookingStyle: 'onion' }]));
  dishes.push(makeDish('Benne Dosa', 'benne-dosa', 'south', ['Karnataka'], ['breakfast', 'snacks'], 'veg', 'medium', ['carb', 'fat'], ['butter', 'crispy', 'street-food'],
    VARIANTS.classic('Benne Dosa', 'benne-dosa', ['breakfast'])));
  dishes.push(makeDish('Neer Dosa', 'neer-dosa', 'south', ['Karnataka', 'Kerala'], ['breakfast', 'lunch'], 'veg', 'light', ['carb'], ['soft', 'rice'],
    [{ id: 'neer-dosa-plain', name: 'Neer Dosa Plain' }, { id: 'neer-dosa-curry', name: 'Neer Dosa + Curry', addOn: 'with curry' }]));
  dishes.push(makeDish('Pathiri', 'pathiri', 'south', ['Kerala'], ['breakfast'], 'veg', 'medium', ['carb'], ['rice-flour', 'soft'],
    VARIANTS.classic('Pathiri', 'pathiri', ['breakfast'])));
  dishes.push(makeDish('Puttu Kadala', 'puttu-kadala', 'south', ['Kerala', 'Tamil Nadu'], ['breakfast'], 'veg', 'medium', ['carb', 'protein'], ['steamed', 'chickpeas'],
    VARIANTS.classic('Puttu Kadala', 'puttu-kadala', ['breakfast'])));
  dishes.push(makeDish('Paniyaram', 'paniyaram', 'south', ['Tamil Nadu', 'Kerala', 'Karnataka'], ['breakfast', 'snacks'], 'veg', 'light', ['carb'], ['steamed', 'bite-sized'],
    VARIANTS.classic('Paniyaram', 'paniyaram', ['breakfast'])));
  dishes.push(makeDish('Kothu Parotta', 'kothu-parotta', 'south', ['Tamil Nadu', 'Kerala'], ['breakfast', 'dinner'], 'veg', 'heavy', ['carb', 'fat'], ['street-food', 'minced', 'spicy'],
    VARIANTS.classic('Kothu Parotta', 'kothu-parotta', ['breakfast'])));
  dishes.push(makeDish('Kuzhi Paniyaram', 'kuzhi-paniyaram', 'south', ['Tamil Nadu'], ['breakfast'], 'veg', 'light', ['carb'], ['sweet', 'savory', 'traditional'],
    VARIANTS.classic('Kuzhi Paniyaram', 'kuzhi-paniyaram', ['breakfast'])));
  dishes.push(makeDish('Adai Dosa', 'adai-dosa', 'south', ['Tamil Nadu', 'Karnataka'], ['breakfast'], 'veg', 'medium', ['protein', 'carb'], ['lentils', 'protein-rich'],
    VARIANTS.classic('Adai Dosa', 'adai-dosa', ['breakfast'])));
  dishes.push(makeDish('Uttapam Special', 'uttapam-special', 'south', ['Tamil Nadu', 'Karnataka'], ['breakfast'], 'veg', 'medium', ['carb'], ['toppings', 'savory'],
    VARIANTS.styles('Uttapam', 'uttapam-spec', ['Onion', 'Tomato', 'Masala'])));
  dishes.push(makeDish('Aloo Puri', 'aloo-puri-south', 'south', ['Karnataka', 'Telangana'], ['breakfast'], 'veg', 'heavy', ['carb', 'fat'], ['fried', 'weekend'],
    VARIANTS.classic('Aloo Puri', 'aloo-puri-south', ['breakfast'])));

  // Rice items (15)
  dishes.push(makeDish('Pulihora', 'pulihora', 'south', ['Andhra Pradesh', 'Telangana'], ['lunch', 'dinner'], 'veg', 'medium', ['carb'], ['tangy', 'tamarind', 'rice'],
    VARIANTS.classic('Pulihora', 'pulihora', ['lunch'])));
  dishes.push(makeDish('Curd Rice', 'curd-rice', 'south', ['Tamil Nadu', 'Kerala', 'Karnataka', 'Andhra Pradesh'], ['lunch', 'dinner'], 'veg', 'light', ['carb', 'dairy'], ['probiotic', 'cooling', 'comfort'],
    VARIANTS.classic('Curd Rice', 'curd-rice', ['lunch'])));
  dishes.push(makeDish('Lemon Rice', 'lemon-rice', 'south', ['Karnataka', 'Tamil Nadu', 'Andhra Pradesh'], ['lunch'], 'veg', 'light', ['carb'], ['tangy', 'quick'],
    VARIANTS.classic('Lemon Rice', 'lemon-rice', ['lunch'])));
  dishes.push(makeDish('Tamarind Rice', 'tamarind-rice', 'south', ['Tamil Nadu', 'Andhra Pradesh'], ['lunch', 'dinner'], 'veg', 'medium', ['carb'], ['tangy', 'spicy'],
    VARIANTS.classic('Tamarind Rice', 'tamarind-rice', ['lunch'])));
  dishes.push(makeDish('Coconut Rice', 'coconut-rice', 'south', ['Kerala', 'Tamil Nadu'], ['lunch'], 'veg', 'medium', ['carb', 'fat'], ['coconut', 'aromatic'],
    VARIANTS.classic('Coconut Rice', 'coconut-rice', ['lunch'])));
  dishes.push(makeDish('Bisi Bele Bath', 'bisi-bele-bath', 'south', ['Karnataka'], ['lunch', 'dinner'], 'veg', 'medium', ['carb', 'protein'], ['one-pot', 'mixed-veg', 'spiced'],
    VARIANTS.classic('Bisi Bele Bath', 'bisi-bele-bath', ['lunch'])));
  dishes.push(makeDish('Bisibele Bath', 'bisibele-bath-special', 'south', ['Karnataka'], ['lunch', 'dinner'], 'veg', 'heavy', ['carb', 'protein'], ['one-pot', 'traditional'],
    VARIANTS.rice('Bisibele Bath', 'bisibele')));
  dishes.push(makeDish('Bagala Bath', 'bagala-bath', 'south', ['Karnataka'], ['lunch'], 'veg', 'medium', ['carb'], ['upma-style', 'semolina'],
    VARIANTS.classic('Bagala Bath', 'bagala-bath', ['lunch'])));
  dishes.push(makeDish('Ven Pongal Special', 'ven-pongal-special', 'south', ['Tamil Nadu', 'Andhra Pradesh'], ['lunch'], 'veg', 'medium', ['carb', 'fat'], ['ghee', 'comfort'],
    VARIANTS.classic('Ven Pongal', 'ven-pongal-spec', ['lunch'])));
  dishes.push(makeDish('Puliogare', 'puliogare', 'south', ['Karnataka', 'Tamil Nadu'], ['lunch'], 'veg', 'medium', ['carb'], ['tamarind', 'temple-style'],
    VARIANTS.classic('Puliogare', 'puliogare', ['lunch'])));
  dishes.push(makeDish('Kosambari', 'kosambari', 'south', ['Karnataka', 'Tamil Nadu'], ['lunch'], 'veg', 'light', ['protein', 'fiber'], ['salad', 'lentils', 'fresh'],
    VARIANTS.classic('Kosambari', 'kosambari', ['lunch'])));
  dishes.push(makeDish('Rasam Rice', 'rasam-rice', 'south', ['Tamil Nadu', 'Kerala'], ['lunch', 'dinner'], 'veg', 'light', ['carb'], ['digestive', 'comfort'],
    VARIANTS.classic('Rasam Rice', 'rasam-rice', ['lunch'])));
  dishes.push(makeDish('Kalwan Rice', 'kalwan-rice', 'south', ['Karnataka'], ['lunch'], 'veg', 'medium', ['carb'], ['spiced', 'one-pot'],
    VARIANTS.classic('Kalwan Rice', 'kalwan-rice', ['lunch'])));
  dishes.push(makeDish('Jeera Rice South', 'jeera-rice-south', 'south', ['Telangana', 'Andhra Pradesh'], ['lunch', 'dinner'], 'veg', 'light', ['carb'], ['aromatic', 'cumin'],
    VARIANTS.classic('Jeera Rice', 'jeera-rice-south', ['lunch'])));
  dishes.push(makeDish('Ghee Rice', 'ghee-rice-south', 'south', ['Karnataka', 'Tamil Nadu'], ['lunch'], 'veg', 'medium', ['carb', 'fat'], ['ghee', 'aromatic'],
    VARIANTS.classic('Ghee Rice', 'ghee-rice-south', ['lunch'])));

  // Curry/Gravy items (15)
  dishes.push(makeDish('Avial', 'avial', 'south', ['Kerala', 'Tamil Nadu'], ['lunch', 'dinner'], 'veg', 'medium', ['fiber', 'protein'], ['mixed-veg', 'coconut', 'traditional'],
    VARIANTS.classic('Avial', 'avial', ['lunch'])));
  dishes.push(makeDish('Sambar Sadam', 'sambar-sadam', 'south', ['Tamil Nadu'], ['lunch', 'dinner'], 'veg', 'medium', ['carb', 'protein'], ['one-pot', 'lentils', 'comfort'],
    VARIANTS.classic('Sambar Sadam', 'sambar-sadam', ['lunch'])));
  dishes.push(makeDish('Kootu', 'kootu', 'south', ['Tamil Nadu', 'Kerala'], ['lunch', 'dinner'], 'veg', 'medium', ['protein', 'fiber'], ['lentils', 'vegetables', 'coconut'],
    VARIANTS.classic('Kootu', 'kootu', ['lunch'])));
  dishes.push(makeDish('Paruppu Curry', 'paruppu-curry', 'south', ['Tamil Nadu'], ['lunch', 'dinner'], 'veg', 'medium', ['protein'], ['lentils', 'tadka', 'comfort'],
    VARIANTS.classic('Paruppu Curry', 'paruppu-curry', ['lunch'])));
  dishes.push(makeDish('Vendakkai Poriyal', 'vendakkai-poriyal', 'south', ['Tamil Nadu', 'Kerala'], ['lunch', 'dinner'], 'veg', 'light', ['fiber'], ['okra', 'stir-fry', 'healthy'],
    VARIANTS.classic('Vendakkai Poriyal', 'vendakkai-poriyal', ['lunch'])));
  dishes.push(makeDish('Keerai Masiyal', 'keerai-masiyal', 'south', ['Tamil Nadu'], ['lunch', 'dinner'], 'veg', 'light', ['fiber'], ['greens', 'healthy', 'mashed'],
    VARIANTS.classic('Keerai Masiyal', 'keerai-masiyal', ['lunch'])));
  dishes.push(makeDish('Poondu Rasam', 'poondu-rasam', 'south', ['Tamil Nadu'], ['lunch', 'dinner'], 'veg', 'light', ['carb'], ['garlic', 'digestive', 'soup'],
    VARIANTS.classic('Poondu Rasam', 'poondu-rasam', ['lunch'])));
  dishes.push(makeDish('Mulligatawny Soup', 'mulligatawny', 'south', ['Tamil Nadu', 'Karnataka'], ['lunch', 'dinner'], 'veg', 'light', ['protein', 'fiber'], ['soup', 'lentils', 'pepper'],
    VARIANTS.classic('Mulligatawny Soup', 'mulligatawny', ['lunch'])));
  dishes.push(makeDish('Thogayal Rice', 'thogayal-rice', 'south', ['Karnataka', 'Tamil Nadu'], ['lunch'], 'veg', 'medium', ['carb', 'fiber'], ['chutney-style', 'coconut'],
    VARIANTS.classic('Thogayal Rice', 'thogayal-rice', ['lunch'])));
  dishes.push(makeDish('Kadalai Curry', 'kadalai-curry', 'south', ['Kerala', 'Tamil Nadu'], ['breakfast', 'lunch'], 'veg', 'medium', ['protein'], ['chickpeas', 'coconut', 'hearty'],
    VARIANTS.classic('Kadalai Curry', 'kadalai-curry', ['lunch'])));
  dishes.push(makeDish('Chana Sundal', 'chana-sundal', 'south', ['Tamil Nadu', 'Karnataka'], ['snacks', 'lunch'], 'veg', 'light', ['protein', 'fiber'], ['chickpeas', 'healthy', 'temple'],
    VARIANTS.classic('Chana Sundal', 'chana-sundal', ['lunch'])));
  dishes.push(makeDish('Rajma South', 'rajma-south', 'south', ['Karnataka', 'Telangana'], ['lunch', 'dinner'], 'veg', 'medium', ['protein'], ['kidney beans', 'curry', 'comfort'],
    VARIANTS.classic('Rajma South', 'rajma-south', ['lunch'])));
  dishes.push(makeDish('Paneer Curry South', 'paneer-curry-south', 'south', ['Karnataka', 'Tamil Nadu'], ['lunch', 'dinner'], 'veg', 'medium', ['protein', 'fat'], ['paneer', 'gravy', 'rich'],
    VARIANTS.classic('Paneer Curry', 'paneer-curry-south', ['lunch'])));
  dishes.push(makeDish('Veg Kurma', 'veg-kurma', 'south', ['Tamil Nadu', 'Kerala', 'Karnataka'], ['lunch', 'dinner'], 'veg', 'medium', ['protein', 'fiber'], ['coconut', 'mild', 'mixed-veg'],
    VARIANTS.classic('Veg Kurma', 'veg-kurma', ['lunch'])));
  dishes.push(makeDish('Potato Kurma', 'potato-kurma', 'south', ['Tamil Nadu', 'Kerala'], ['lunch', 'dinner'], 'veg', 'medium', ['carb', 'fat'], ['potato', 'coconut', 'comfort'],
    VARIANTS.classic('Potato Kurma', 'potato-kurma', ['lunch'])));

  // Non-veg (15)
  dishes.push(makeDish('Chicken Chettinad', 'chicken-chettinad', 'south', ['Tamil Nadu'], ['lunch', 'dinner'], 'non-veg', 'heavy', ['protein', 'fat'], ['spicy', 'aromatic', 'traditional'],
    VARIANTS.classic('Chicken Chettinad', 'chicken-chettinad', ['lunch'])));
  dishes.push(makeDish('Mutton Curry Kerala', 'mutton-curry-kl', 'south', ['Kerala'], ['lunch', 'dinner'], 'non-veg', 'heavy', ['protein', 'fat'], ['spicy', 'coconut', 'slow-cooked'],
    VARIANTS.classic('Mutton Curry', 'mutton-curry-kl', ['lunch'])));
  dishes.push(makeDish('Fish Fry Andhra', 'fish-fry-ap', 'south', ['Andhra Pradesh'], ['lunch', 'dinner'], 'non-veg', 'medium', ['protein', 'fat'], ['fried', 'spicy', 'coastal'],
    VARIANTS.classic('Fish Fry', 'fish-fry-ap', ['lunch'])));
  dishes.push(makeDish('Prawn Curry Kerala', 'prawn-curry-kl', 'south', ['Kerala'], ['lunch', 'dinner'], 'non-veg', 'medium', ['protein', 'fat'], ['coconut', 'coastal', 'spicy'],
    VARIANTS.classic('Prawn Curry', 'prawn-curry-kl', ['lunch'])));
  dishes.push(makeDish('Chicken Roast Kerala', 'chicken-roast-kl', 'south', ['Kerala'], ['lunch', 'dinner'], 'non-veg', 'heavy', ['protein', 'fat'], ['roasted', 'spicy', 'traditional'],
    VARIANTS.classic('Chicken Roast', 'chicken-roast-kl', ['lunch'])));
  dishes.push(makeDish('Mutton Keema South', 'mutton-keema-south', 'south', ['Telangana', 'Andhra Pradesh'], ['lunch', 'dinner'], 'non-veg', 'medium', ['protein'], ['minced', 'spiced', 'curry'],
    VARIANTS.classic('Mutton Keema', 'mutton-keema-south', ['lunch'])));
  dishes.push(makeDish('Prawns Fry', 'prawns-fry-south', 'south', ['Andhra Pradesh', 'Kerala'], ['lunch', 'dinner'], 'non-veg', 'medium', ['protein'], ['fried', 'spicy', 'coastal'],
    VARIANTS.classic('Prawns Fry', 'prawns-fry-south', ['lunch'])));
  dishes.push(makeDish('Fish Pulimunchi', 'fish-pulimunchi', 'south', ['Andhra Pradesh'], ['lunch', 'dinner'], 'non-veg', 'medium', ['protein'], ['sour', 'tamarind', 'spicy'],
    VARIANTS.classic('Fish Pulimunchi', 'fish-pulimunchi', ['lunch'])));
  dishes.push(makeDish('Egg Curry South', 'egg-curry-south', 'south', ['Tamil Nadu', 'Kerala'], ['lunch', 'dinner'], 'eggitarian', 'medium', ['protein'], ['curry', 'spicy', 'everyday'],
    VARIANTS.classic('Egg Curry', 'egg-curry-south', ['lunch'])));
  dishes.push(makeDish('Chicken Biryani Kerala', 'chicken-biryani-kl', 'south', ['Kerala'], ['lunch', 'dinner'], 'non-veg', 'heavy', ['protein', 'carb'], ['aromatic', 'coconut', 'dum'],
    VARIANTS.classic('Chicken Biryani', 'chicken-biryani-kl', ['lunch'])));
  dishes.push(makeDish('Mutton Biryani Kerala', 'mutton-biryani-kl', 'south', ['Kerala'], ['lunch', 'dinner'], 'non-veg', 'heavy', ['protein', 'carb', 'fat'], ['dum', 'aromatic', 'festive'],
    VARIANTS.classic('Mutton Biryani', 'mutton-biryani-kl', ['lunch'])));
  dishes.push(makeDish('Chicken Pepper Fry', 'chicken-pepper-fry', 'south', ['Kerala', 'Tamil Nadu'], ['lunch', 'dinner'], 'non-veg', 'medium', ['protein'], ['pepper', 'dry', 'spicy'],
    VARIANTS.classic('Chicken Pepper Fry', 'chicken-pepper-fry', ['lunch'])));
  dishes.push(makeDish('Mutton Pepper Fry', 'mutton-pepper-fry', 'south', ['Kerala', 'Tamil Nadu'], ['lunch', 'dinner'], 'non-veg', 'heavy', ['protein', 'fat'], ['pepper', 'dry', 'aromatic'],
    VARIANTS.classic('Mutton Pepper Fry', 'mutton-pepper-fry', ['lunch'])));
  dishes.push(makeDish('Crab Curry', 'crab-curry-south', 'south', ['Kerala', 'Tamil Nadu'], ['lunch', 'dinner'], 'non-veg', 'medium', ['protein'], ['coconut', 'coastal', 'spicy'],
    VARIANTS.classic('Crab Curry', 'crab-curry-south', ['lunch'])));
  dishes.push(makeDish('Squid Fry', 'squid-fry-south', 'south', ['Kerala', 'Tamil Nadu'], ['snacks', 'dinner'], 'non-veg', 'light', ['protein'], ['fried', 'seafood', 'crispy'],
    VARIANTS.classic('Squid Fry', 'squid-fry-south', ['lunch'])));

  // Snacks & Sweets (15)
  dishes.push(makeDish('Banana Chips', 'banana-chips', 'south', ['Kerala'], ['snacks'], 'veg', 'light', ['fat'], ['fried', 'crispy', 'traditional'],
    VARIANTS.classic('Banana Chips', 'banana-chips', ['snacks'])));
  dishes.push(makeDish('Murukku', 'murukku', 'south', ['Tamil Nadu'], ['snacks'], 'veg', 'light', ['carb', 'fat'], ['crispy', 'savory', 'festive'],
    VARIANTS.classic('Murukku', 'murukku', ['snacks'])));
  dishes.push(makeDish('Mixture', 'south-mixture', 'south', ['Tamil Nadu', 'Karnataka'], ['snacks'], 'veg', 'light', ['carb', 'fat'], ['savory', 'mixed', 'crispy'],
    VARIANTS.classic('Mixture', 'south-mixture', ['snacks'])));
  dishes.push(makeDish('Bajji', 'bajji', 'south', ['Tamil Nadu', 'Andhra Pradesh'], ['snacks'], 'veg', 'medium', ['carb', 'fat'], ['fried', 'street-food', 'monsoon'],
    VARIANTS.classic('Bajji', 'bajji', ['snacks'])));
  dishes.push(makeDish('Bonda', 'bonda', 'south', ['Karnataka', 'Tamil Nadu'], ['snacks'], 'veg', 'medium', ['carb', 'fat'], ['fried', 'potato', 'street-food'],
    VARIANTS.classic('Bonda', 'bonda', ['snacks'])));
  dishes.push(makeDish('Mirchi Bajji', 'mirchi-bajji', 'south', ['Telangana', 'Andhra Pradesh'], ['snacks'], 'veg', 'medium', ['carb', 'fat'], ['chili', 'fried', 'spicy'],
    VARIANTS.classic('Mirchi Bajji', 'mirchi-bajji', ['snacks'])));
  dishes.push(makeDish('Gobi Manchurian', 'gobi-manchurian-south', 'south', ['Tamil Nadu', 'Karnataka'], ['snacks', 'dinner'], 'veg', 'medium', ['carb', 'fat'], ['indo-chinese', 'spicy', 'popular'],
    VARIANTS.classic('Gobi Manchurian', 'gobi-manchurian-south', ['snacks'])));
  dishes.push(makeDish('Vegetable Fried Rice', 'veg-fried-rice-south', 'south', ['Telangana', 'Karnataka'], ['lunch', 'dinner'], 'veg', 'medium', ['carb'], ['indo-chinese', 'quick', 'wok'],
    VARIANTS.classic('Veg Fried Rice', 'veg-fried-rice-south', ['lunch'])));
  dishes.push(makeDish('Noodles South', 'noodles-south', 'south', ['Tamil Nadu', 'Karnataka'], ['snacks', 'dinner'], 'veg', 'medium', ['carb'], ['indo-chinese', 'quick', 'street-food'],
    VARIANTS.classic('Noodles', 'noodles-south', ['snacks'])));
  dishes.push(makeDish('Mysore Pak', 'mysore-pak', 'south', ['Karnataka'], ['snacks'], 'veg', 'heavy', ['carb', 'fat', 'sweet'], ['dessert', 'festive', 'ghee'],
    VARIANTS.classic('Mysore Pak', 'mysore-pak', ['snacks'])));
  dishes.push(makeDish('Payasam', 'payasam', 'south', ['Kerala', 'Tamil Nadu', 'Karnataka'], ['snacks'], 'veg', 'heavy', ['carb', 'sweet'], ['dessert', 'sweet', 'festive'],
    VARIANTS.classic('Payasam', 'payasam', ['snacks'])));
  dishes.push(makeDish('Kesari Bath', 'kesari-bath', 'south', ['Karnataka'], ['breakfast', 'snacks'], 'veg', 'medium', ['carb', 'sweet'], ['sweet', 'semolina', 'ghee'],
    VARIANTS.classic('Kesari Bath', 'kesari-bath', ['breakfast'])));
  dishes.push(makeDish('Bobbatlu', 'bobbatlu', 'south', ['Andhra Pradesh', 'Telangana'], ['snacks', 'breakfast'], 'veg', 'heavy', ['carb', 'sweet'], ['sweet', 'lentil', 'festive'],
    VARIANTS.classic('Bobbatlu', 'bobbatlu', ['breakfast'])));
  dishes.push(makeDish('Punugulu', 'punugulu', 'south', ['Andhra Pradesh', 'Telangana'], ['snacks'], 'veg', 'medium', ['carb', 'fat'], ['fried', 'crispy', 'street-food'],
    VARIANTS.classic('Punugulu', 'punugulu', ['snacks'])));
  dishes.push(makeDish('Garelu', 'garelu', 'south', ['Andhra Pradesh', 'Telangana'], ['snacks'], 'veg', 'medium', ['carb', 'fat'], ['fried', 'vada', 'crispy'],
    VARIANTS.classic('Garelu', 'garelu', ['snacks'])));

  // Additional breakfast items (5 more to reach 80)
  dishes.push(makeDish('Udupi Masala Dosa', 'udupi-masala-dosa', 'south', ['Karnataka'], ['breakfast'], 'veg', 'medium', ['carb'], ['crispy', 'potato', 'famous'],
    VARIANTS.classic('Udupi Masala Dosa', 'udupi-masala-dosa', ['breakfast'])));
  dishes.push(makeDish('Ragi Mudde', 'ragi-mudde', 'south', ['Karnataka'], ['lunch', 'dinner'], 'veg', 'medium', ['carb', 'fiber'], ['finger-millet', 'healthy', 'traditional'],
    VARIANTS.classic('Ragi Mudde', 'ragi-mudde', ['lunch'])));
  dishes.push(makeDish('Ragi Sangati', 'ragi-sangati', 'south', ['Karnataka', 'Andhra Pradesh'], ['lunch', 'dinner'], 'veg', 'medium', ['carb', 'fiber'], ['finger-millet', 'ball', 'rustic'],
    VARIANTS.classic('Ragi Sangati', 'ragi-sangati', ['lunch'])));
  dishes.push(makeDish('Filter Coffee South', 'filter-coffee-south', 'south', ['Tamil Nadu', 'Karnataka', 'Kerala'], ['snacks'], 'veg', 'light', ['dairy'], ['coffee', 'beverage', 'traditional'],
    VARIANTS.classic('Filter Coffee', 'filter-coffee-south', ['snacks'])));
  dishes.push(makeDish('Gongura Pachadi', 'gongura-pachadi', 'south', ['Andhra Pradesh', 'Telangana'], ['lunch', 'dinner'], 'veg', 'light', ['fiber'], ['sorrel', 'chutney', 'tangy'],
    VARIANTS.classic('Gongura Pachadi', 'gongura-pachadi', ['lunch'])));

  return dishes;
}
function generateWest() {
  const dishes = [];
  
  dishes.push(makeDish('Misal Pav', 'misal-pav-special', 'west', ['Maharashtra'], ['breakfast', 'lunch'], 'veg', 'medium', ['protein', 'carb'], ['spicy', 'street-food', 'sprouts'],
    VARIANTS.classic('Misal Pav', 'misal-pav-special', ['breakfast'])));
  dishes.push(makeDish('Sabudana Khichdi', 'sabudana-khichdi', 'west', ['Maharashtra', 'Gujarat'], ['breakfast'], 'veg', 'light', ['carb'], ['fasting', 'pearls', 'peanuts'],
    VARIANTS.classic('Sabudana Khichdi', 'sabudana-khichdi', ['breakfast'])));
  dishes.push(makeDish('Thalipeeth', 'thalipeeth', 'west', ['Maharashtra'], ['breakfast', 'lunch'], 'veg', 'medium', ['carb', 'fiber'], ['multigrain', 'flatbread', 'traditional'],
    VARIANTS.classic('Thalipeeth', 'thalipeeth', ['breakfast'])));
  dishes.push(makeDish('Dhokla Khaman', 'dhokla-khaman', 'west', ['Gujarat'], ['breakfast', 'snacks'], 'veg', 'light', ['carb', 'protein'], ['steamed', 'fermented', 'gram-flour'],
    VARIANTS.classic('Khaman Dhokla', 'dhokla-khaman', ['breakfast'])));
  dishes.push(makeDish('Handvo', 'handvo', 'west', ['Gujarat'], ['breakfast', 'snacks'], 'veg', 'medium', ['carb', 'protein'], ['savory', 'baked', 'lentils'],
    VARIANTS.classic('Handvo', 'handvo', ['breakfast'])));
  dishes.push(makeDish('Fafda Jalebi', 'fafda-jalebi', 'west', ['Gujarat'], ['breakfast', 'snacks'], 'veg', 'heavy', ['carb', 'fat', 'sweet'], ['festive', 'crispy', 'sweet'],
    VARIANTS.classic('Fafda Jalebi', 'fafda-jalebi', ['breakfast'])));
  dishes.push(makeDish('Thepla', 'thepla', 'west', ['Gujarat'], ['breakfast', 'lunch'], 'veg', 'light', ['carb'], ['flatbread', 'portable', 'travel'],
    VARIANTS.classic('Thepla', 'thepla', ['breakfast'])));
  dishes.push(makeDish('Methi Thepla', 'methi-thepla', 'west', ['Gujarat'], ['breakfast', 'lunch'], 'veg', 'light', ['carb', 'fiber'], ['fenugreek', 'flatbread', 'healthy'],
    VARIANTS.classic('Methi Thepla', 'methi-thepla', ['breakfast'])));
  dishes.push(makeDish('Dabeli', 'dabeli', 'west', ['Gujarat'], ['snacks'], 'veg', 'medium', ['carb', 'fat'], ['street-food', 'spiced', 'pomegranate'],
    VARIANTS.classic('Dabeli', 'dabeli', ['snacks'])));
  dishes.push(makeDish('Khandvi', 'khandvi', 'west', ['Gujarat'], ['snacks'], 'veg', 'light', ['carb', 'protein'], ['steamed', 'rolled', 'delicate'],
    VARIANTS.classic('Khandvi', 'khandvi', ['snacks'])));
  dishes.push(makeDish('Muthia', 'muthia', 'west', ['Gujarat'], ['snacks'], 'veg', 'medium', ['carb', 'fiber'], ['steamed', 'bottle-gourd', 'traditional'],
    VARIANTS.classic('Muthia', 'muthia', ['snacks'])));
  dishes.push(makeDish('Sev Khamani', 'sev-khamani', 'west', ['Gujarat'], ['snacks'], 'veg', 'medium', ['protein', 'carb'], ['gram-flour', 'savory', 'crunchy'],
    VARIANTS.classic('Sev Khamani', 'sev-khamani', ['snacks'])));
  dishes.push(makeDish('Pudla', 'pudla', 'west', ['Gujarat', 'Maharashtra'], ['breakfast'], 'veg', 'light', ['protein'], ['gram-flour', 'pancake', 'quick'],
    VARIANTS.classic('Pudla', 'pudla', ['breakfast'])));
  dishes.push(makeDish('Ukdiche Modak', 'ukdiche-modak', 'west', ['Maharashtra'], ['snacks'], 'veg', 'heavy', ['carb', 'sweet'], ['steamed', 'festive', 'coconut'],
    VARIANTS.classic('Ukdiche Modak', 'ukdiche-modak', ['snacks'])));
  dishes.push(makeDish('Puran Poli', 'puran-poli', 'west', ['Maharashtra', 'Goa'], ['snacks', 'lunch'], 'veg', 'heavy', ['carb', 'sweet'], ['sweet', 'festive', 'lentil-stuffed'],
    VARIANTS.classic('Puran Poli', 'puran-poli', ['lunch'])));
  
  // Rice & curry
  dishes.push(makeDish('Amti Rice', 'amti-rice', 'west', ['Maharashtra'], ['lunch', 'dinner'], 'veg', 'medium', ['carb', 'protein'], ['dal', 'comfort', 'traditional'],
    VARIANTS.classic('Amti Rice', 'amti-rice', ['lunch'])));
  dishes.push(makeDish('Vangi Bhat', 'vangi-bhat', 'west', ['Maharashtra'], ['lunch'], 'veg', 'medium', ['carb'], ['brinjal', 'rice', 'one-pot'],
    VARIANTS.classic('Vangi Bhat', 'vangi-bhat', ['lunch'])));
  dishes.push(makeDish('Masale Bhat', 'masale-bhat', 'west', ['Maharashtra'], ['lunch'], 'veg', 'medium', ['carb'], ['spiced-rice', 'mixed-veg', 'festive'],
    VARIANTS.classic('Masale Bhat', 'masale-bhat', ['lunch'])));
  dishes.push(makeDish('Kolim Bhaat', 'kolim-bhaat', 'west', ['Maharashtra', 'Goa'], ['lunch'], 'non-veg', 'medium', ['protein', 'carb'], ['fish', 'rice', 'coastal'],
    VARIANTS.classic('Kolim Bhaat', 'kolim-bhaat', ['lunch'])));
  dishes.push(makeDish('Sol Kadhi', 'sol-kadhi', 'west', ['Maharashtra', 'Goa'], ['lunch'], 'veg', 'light', ['dairy'], ['kokum', 'coconut', 'cooling'],
    VARIANTS.classic('Sol Kadhi', 'sol-kadhi', ['lunch'])));
  dishes.push(makeDish('Zunka Bhakar', 'zunka-bhakar', 'west', ['Maharashtra'], ['lunch', 'dinner'], 'veg', 'medium', ['carb', 'protein'], ['gram-flour', 'flatbread', 'rustic'],
    VARIANTS.classic('Zunka Bhakar', 'zunka-bhakar', ['lunch'])));
  dishes.push(makeDish('Bharli Vangi', 'bharli-vangi', 'west', ['Maharashtra'], ['lunch', 'dinner'], 'veg', 'medium', ['fiber'], ['stuffed', 'brinjal', 'spiced'],
    VARIANTS.classic('Bharli Vangi', 'bharli-vangi', ['lunch'])));
  dishes.push(makeDish('Batata Bhaji', 'batata-bhaji', 'west', ['Maharashtra'], ['lunch', 'dinner'], 'veg', 'light', ['carb'], ['potato', 'dry', 'everyday'],
    VARIANTS.classic('Batata Bhaji', 'batata-bhaji', ['lunch'])));
  dishes.push(makeDish('Pithla Bhakar', 'pithla-bhakar', 'west', ['Maharashtra'], ['lunch', 'dinner'], 'veg', 'medium', ['carb', 'protein'], ['gram-flour', 'curry', 'rustic'],
    VARIANTS.classic('Pithla Bhakar', 'pithla-bhakar', ['lunch'])));
  dishes.push(makeDish('Varan Bhat', 'varan-bhat', 'west', ['Maharashtra'], ['lunch', 'dinner'], 'veg', 'light', ['carb', 'protein'], ['dal', 'rice', 'simple'],
    VARIANTS.classic('Varan Bhat', 'varan-bhat', ['lunch'])));
  dishes.push(makeDish('Aamti Dal', 'aamti-dal', 'west', ['Maharashtra'], ['lunch', 'dinner'], 'veg', 'medium', ['protein'], ['dal', 'tangy', 'tamarind'],
    VARIANTS.classic('Aamti Dal', 'aamti-dal', ['lunch'])));
  dishes.push(makeDish('Kolim Curry', 'kolim-curry', 'west', ['Goa', 'Maharashtra'], ['lunch', 'dinner'], 'non-veg', 'medium', ['protein'], ['fish', 'coconut', 'coastal'],
    VARIANTS.classic('Kolim Curry', 'kolim-curry', ['lunch'])));
  dishes.push(makeDish('Prawns Koliwada', 'prawns-koliwada', 'west', ['Maharashtra'], ['snacks', 'dinner'], 'non-veg', 'medium', ['protein'], ['fried', 'seafood', 'crispy'],
    VARIANTS.classic('Prawns Koliwada', 'prawns-koliwada', ['lunch'])));
  dishes.push(makeDish('Fish Thali', 'fish-thali-west', 'west', ['Goa', 'Maharashtra'], ['lunch'], 'non-veg', 'heavy', ['protein', 'carb', 'fat'], ['thali', 'coastal', 'complete'],
    VARIANTS.classic('Fish Thali', 'fish-thali-west', ['lunch'])));
  dishes.push(makeDish('Chicken Xacuti', 'chicken-xacuti', 'west', ['Goa'], ['lunch', 'dinner'], 'non-veg', 'heavy', ['protein', 'fat'], ['spiced', 'coconut', 'aromatic'],
    VARIANTS.classic('Chicken Xacuti', 'chicken-xacuti', ['lunch'])));
  dishes.push(makeDish('Pork Vindaloo', 'pork-vindaloo', 'west', ['Goa'], ['lunch', 'dinner'], 'non-veg', 'heavy', ['protein', 'fat'], ['tangy', 'spicy', 'portuguese'],
    VARIANTS.classic('Pork Vindaloo', 'pork-vindaloo', ['lunch'])));
  dishes.push(makeDish('Chicken Cafreal', 'chicken-cafreal', 'west', ['Goa'], ['lunch', 'dinner'], 'non-veg', 'medium', ['protein'], ['herbs', 'grilled', 'portuguese'],
    VARIANTS.classic('Chicken Cafreal', 'chicken-cafreal', ['lunch'])));
  dishes.push(makeDish('Goan Fish Curry', 'goan-fish-curry', 'west', ['Goa'], ['lunch', 'dinner'], 'non-veg', 'medium', ['protein'], ['coconut', 'tangy', 'coastal'],
    VARIANTS.classic('Goan Fish Curry', 'goan-fish-curry', ['lunch'])));
  dishes.push(makeDish('Solachi Kadhi', 'solachi-kadhi', 'west', ['Maharashtra'], ['lunch'], 'veg', 'light', ['dairy'], ['kokum', 'coconut', 'digestive'],
    VARIANTS.classic('Solachi Kadhi', 'solachi-kadhi', ['lunch'])));
  dishes.push(makeDish('Bhakri Special', 'bhakri-special', 'west', ['Maharashtra'], ['lunch', 'dinner'], 'veg', 'medium', ['carb', 'fiber'], ['millet', 'flatbread', 'rustic'],
    VARIANTS.classic('Bhakri', 'bhakri-special', ['lunch'])));
  dishes.push(makeDish('Bajra Bhakri', 'bajra-bhakri', 'west', ['Maharashtra'], ['lunch', 'dinner'], 'veg', 'medium', ['carb', 'fiber'], ['pearl-millet', 'flatbread', 'healthy'],
    VARIANTS.classic('Bajra Bhakri', 'bajra-bhakri', ['lunch'])));
  dishes.push(makeDish('Nagpuri Saoji Chicken', 'nagpuri-saoji-chicken', 'west', ['Maharashtra'], ['lunch', 'dinner'], 'non-veg', 'heavy', ['protein', 'fat'], ['spicy', 'traditional', 'regional'],
    VARIANTS.classic('Saoji Chicken', 'nagpuri-saoji-chicken', ['lunch'])));
  dishes.push(makeDish('Kolhapuri Chicken', 'kolhapuri-chicken', 'west', ['Maharashtra'], ['lunch', 'dinner'], 'non-veg', 'heavy', ['protein', 'fat'], ['spicy', 'masala', 'famous'],
    VARIANTS.classic('Kolhapuri Chicken', 'kolhapuri-chicken', ['lunch'])));
  dishes.push(makeDish('Mutton Sukka', 'mutton-sukka-west', 'west', ['Maharashtra'], ['lunch', 'dinner'], 'non-veg', 'medium', ['protein'], ['dry', 'spiced', 'coconut'],
    VARIANTS.classic('Mutton Sukka', 'mutton-sukka-west', ['lunch'])));
  dishes.push(makeDish('Mutton Rara', 'mutton-rara', 'west', ['Maharashtra'], ['lunch', 'dinner'], 'non-veg', 'medium', ['protein'], ['minced', 'curry', 'rich'],
    VARIANTS.classic('Mutton Rara', 'mutton-rara', ['lunch'])));
  dishes.push(makeDish('Bombil Fry', 'bombil-fry', 'west', ['Maharashtra'], ['lunch', 'dinner'], 'non-veg', 'medium', ['protein'], ['bombay-duck', 'fried', 'seafood'],
    VARIANTS.classic('Bombil Fry', 'bombil-fry', ['lunch'])));
  dishes.push(makeDish('Tambda Rassa', 'tambda-rassa', 'west', ['Maharashtra'], ['lunch', 'dinner'], 'non-veg', 'heavy', ['protein', 'fat'], ['mutton', 'spicy', 'gravy'],
    VARIANTS.classic('Tambda Rassa', 'tambda-rassa', ['lunch'])));
  dishes.push(makeDish('Pandhra Rassa', 'pandhra-rassa', 'west', ['Maharashtra'], ['lunch', 'dinner'], 'non-veg', 'medium', ['protein'], ['mutton', 'clear', 'white'],
    VARIANTS.classic('Pandhra Rassa', 'pandhra-rassa', ['lunch'])));
  dishes.push(makeDish('Shrikhand', 'shrikhand', 'west', ['Maharashtra', 'Gujarat'], ['snacks'], 'veg', 'heavy', ['dairy', 'sweet'], ['sweet', 'yogurt', 'festive'],
    VARIANTS.classic('Shrikhand', 'shrikhand', ['snacks'])));
  dishes.push(makeDish('Basundi', 'basundi', 'west', ['Maharashtra', 'Gujarat'], ['snacks'], 'veg', 'heavy', ['dairy', 'sweet'], ['sweet', 'thickened-milk', 'festive'],
    VARIANTS.classic('Basundi', 'basundi', ['snacks'])));
  dishes.push(makeDish('Modak', 'modak', 'west', ['Maharashtra', 'Goa'], ['snacks'], 'veg', 'heavy', ['carb', 'sweet'], ['steamed', 'festive', 'ganesh-chaturthi'],
    VARIANTS.classic('Modak', 'modak', ['snacks'])));
  dishes.push(makeDish('Shankarpali', 'shankarpali', 'west', ['Maharashtra'], ['snacks'], 'veg', 'medium', ['carb', 'fat', 'sweet'], ['crispy', 'sweet', 'savory'],
    VARIANTS.classic('Shankarpali', 'shankarpali', ['snacks'])));
  dishes.push(makeDish('Anarsa', 'anarsa', 'west', ['Maharashtra'], ['snacks'], 'veg', 'medium', ['carb', 'sweet'], ['rice-flour', 'sweet', 'festive'],
    VARIANTS.classic('Anarsa', 'anarsa', ['snacks'])));
  dishes.push(makeDish('Karanji', 'karanji', 'west', ['Maharashtra', 'Goa'], ['snacks'], 'veg', 'medium', ['carb', 'fat', 'sweet'], ['fried', 'coconut', 'stuffed'],
    VARIANTS.classic('Karanji', 'karanji', ['snacks'])));
  dishes.push(makeDish('Chakali', 'chakali-west', 'west', ['Maharashtra'], ['snacks'], 'veg', 'medium', ['carb', 'fat'], ['crispy', 'spiral', 'savory'],
    VARIANTS.classic('Chakali', 'chakali-west', ['snacks'])));
  dishes.push(makeDish('Koki', 'koki', 'west', ['Maharashtra'], ['lunch', 'dinner'], 'veg', 'medium', ['carb', 'protein'], ['mixed-dal', 'pancake', 'traditional'],
    VARIANTS.classic('Koki', 'koki', ['lunch'])));
  dishes.push(makeDish('Undhiyu', 'undhiyu', 'west', ['Gujarat'], ['lunch', 'dinner'], 'veg', 'medium', ['fiber', 'protein'], ['mixed-veg', 'winter', 'slow-cooked'],
    VARIANTS.classic('Undhiyu', 'undhiyu', ['lunch'])));
  dishes.push(makeDish('Kadhi Khichdi', 'kadhi-khichdi-west', 'west', ['Gujarat', 'Maharashtra'], ['lunch', 'dinner'], 'veg', 'medium', ['carb', 'protein'], ['yogurt', 'rice', 'comfort'],
    VARIANTS.classic('Kadhi Khichdi', 'kadhi-khichdi-west', ['lunch'])));
  dishes.push(makeDish('Sev Tameta Nu Shaak', 'sev-tameta-shaak', 'west', ['Gujarat'], ['lunch', 'dinner'], 'veg', 'medium', ['carb', 'fiber'], ['tomato', 'sev', 'gravy'],
    VARIANTS.classic('Sev Tameta Nu Shaak', 'sev-tameta-shaak', ['lunch'])));
  dishes.push(makeDish('Dal Dhokli', 'dal-dhokli', 'west', ['Gujarat'], ['lunch', 'dinner'], 'veg', 'medium', ['carb', 'protein'], ['dal', 'wheat', 'comfort'],
    VARIANTS.classic('Dal Dhokli', 'dal-dhokli', ['lunch'])));
  dishes.push(makeDish('Mohanthal', 'mohanthal', 'west', ['Gujarat'], ['snacks'], 'veg', 'heavy', ['carb', 'fat', 'sweet'], ['sweet', 'gram-flour', 'ghee'],
    VARIANTS.classic('Mohanthal', 'mohanthal', ['snacks'])));

  return dishes;
}

// EAST INDIA - 54 dishes
function generateEast() {
  const dishes = [];
  
  dishes.push(makeDish('Luchi Aloor Dom', 'luchi-aloor-dom', 'east', ['West Bengal', 'Odisha'], ['breakfast'], 'veg', 'heavy', ['carb', 'fat'], ['fried', 'potato', 'curry'],
    VARIANTS.classic('Luchi Aloor Dom', 'luchi-aloor-dom', ['breakfast'])));
  dishes.push(makeDish('Cholar Dal', 'cholar-dal', 'east', ['West Bengal'], ['breakfast', 'lunch'], 'veg', 'medium', ['protein'], ['lentils', 'sweet', 'coconut'],
    VARIANTS.classic('Cholar Dal', 'cholar-dal', ['lunch'])));
  dishes.push(makeDish('Radhaballavi', 'radhaballavi', 'east', ['West Bengal'], ['breakfast', 'lunch'], 'veg', 'heavy', ['carb', 'protein'], ['lentil-stuffed', 'fried', 'festive'],
    VARIANTS.classic('Radhaballavi', 'radhaballavi', ['lunch'])));
  dishes.push(makeDish('Kochuri Dal', 'kochuri-dal', 'east', ['West Bengal'], ['breakfast'], 'veg', 'heavy', ['carb', 'fat', 'protein'], ['fried', 'lentils', 'traditional'],
    VARIANTS.classic('Kochuri Dal', 'kochuri-dal', ['breakfast'])));
  dishes.push(makeDish('Poha Bengal', 'poha-bengal', 'east', ['West Bengal', 'Odisha'], ['breakfast'], 'veg', 'light', ['carb'], ['rice-flakes', 'quick', 'savory'],
    VARIANTS.classic('Poha', 'poha-bengal', ['breakfast'])));
  dishes.push(makeDish('Chire Doi', 'chire-doi', 'east', ['West Bengal'], ['breakfast'], 'veg', 'light', ['carb', 'dairy'], ['rice-flakes', 'yogurt', 'sweet'],
    VARIANTS.classic('Chire Doi', 'chire-doi', ['breakfast'])));
  dishes.push(makeDish('Muri Ghonto', 'muri-ghonto', 'east', ['West Bengal'], ['lunch', 'dinner'], 'non-veg', 'heavy', ['protein', 'carb', 'fat'], ['fish-head', 'rice', 'traditional'],
    VARIANTS.classic('Muri Ghonto', 'muri-ghonto', ['lunch'])));
  dishes.push(makeDish('Bhetki Paturi', 'bhetki-paturi', 'east', ['West Bengal'], ['lunch', 'dinner'], 'non-veg', 'medium', ['protein'], ['steamed', 'banana-leaf', 'mustard'],
    VARIANTS.classic('Bhetki Paturi', 'bhetki-paturi', ['lunch'])));
  dishes.push(makeDish('Chingri Malai Curry', 'chingri-malai-curry', 'east', ['West Bengal', 'Odisha'], ['lunch', 'dinner'], 'non-veg', 'medium', ['protein', 'fat'], ['prawn', 'coconut', 'festive'],
    VARIANTS.classic('Chingri Malai Curry', 'chingri-malai-curry', ['lunch'])));
  dishes.push(makeDish('Ilish Bhapa', 'ilish-bhapa', 'east', ['West Bengal'], ['lunch', 'dinner'], 'non-veg', 'medium', ['protein'], ['steamed', 'hilsa', 'mustard'],
    VARIANTS.classic('Ilish Bhapa', 'ilish-bhapa', ['lunch'])));
  dishes.push(makeDish('Pabda Macher Jhol', 'pabda-macher-jhol', 'east', ['West Bengal'], ['lunch', 'dinner'], 'non-veg', 'medium', ['protein'], ['fish', 'curry', 'light'],
    VARIANTS.classic('Pabda Macher Jhol', 'pabda-macher-jhol', ['lunch'])));
  dishes.push(makeDish('Rui Macher Curry', 'rui-macher-curry', 'east', ['West Bengal'], ['lunch', 'dinner'], 'non-veg', 'medium', ['protein'], ['rohu', 'fish', 'gravy'],
    VARIANTS.classic('Rui Macher Curry', 'rui-macher-curry', ['lunch'])));
  dishes.push(makeDish('Katla Kalia', 'katla-kalia', 'east', ['West Bengal'], ['lunch', 'dinner'], 'non-veg', 'medium', ['protein'], ['fish', 'spiced', 'thick-gravy'],
    VARIANTS.classic('Katla Kalia', 'katla-kalia', ['lunch'])));
  dishes.push(makeDish('Prawn Malai Curry', 'prawn-malai-curry', 'east', ['West Bengal'], ['lunch', 'dinner'], 'non-veg', 'medium', ['protein', 'fat'], ['prawn', 'coconut', 'rich'],
    VARIANTS.classic('Prawn Malai Curry', 'prawn-malai-curry', ['lunch'])));
  dishes.push(makeDish('Fish Cutlet', 'fish-cutlet-east', 'east', ['West Bengal', 'Odisha'], ['snacks'], 'non-veg', 'medium', ['protein'], ['fried', 'street-food', 'crispy'],
    VARIANTS.classic('Fish Cutlet', 'fish-cutlet-east', ['snacks'])));
  dishes.push(makeDish('Chingri Bhape', 'chingri-bhape', 'east', ['West Bengal'], ['lunch', 'dinner'], 'non-veg', 'medium', ['protein'], ['prawn', 'steamed', 'coconut'],
    VARIANTS.classic('Chingri Bhape', 'chingri-bhape', ['lunch'])));
  dishes.push(makeDish('Daab Chingri', 'daab-chingri', 'east', ['West Bengal'], ['lunch', 'dinner'], 'non-veg', 'medium', ['protein'], ['coconut', 'prawn', 'premium'],
    VARIANTS.classic('Daab Chingri', 'daab-chingri', ['lunch'])));
  dishes.push(makeDish('Kosha Mangsho', 'kosha-mangsho', 'east', ['West Bengal'], ['lunch', 'dinner'], 'non-veg', 'heavy', ['protein', 'fat'], ['mutton', 'slow-cooked', 'spicy'],
    VARIANTS.classic('Kosha Mangsho', 'kosha-mangsho', ['lunch'])));
  dishes.push(makeDish('Mutton Rezala', 'mutton-rezala', 'east', ['West Bengal'], ['lunch', 'dinner'], 'non-veg', 'medium', ['protein', 'fat'], ['mutton', 'white-gravy', 'yogurt'],
    VARIANTS.classic('Mutton Rezala', 'mutton-rezala', ['lunch'])));
  dishes.push(makeDish('Chicken Kosha', 'chicken-kosha', 'east', ['West Bengal'], ['lunch', 'dinner'], 'non-veg', 'heavy', ['protein', 'fat'], ['chicken', 'spicy', 'slow-cooked'],
    VARIANTS.classic('Chicken Kosha', 'chicken-kosha', ['lunch'])));
  dishes.push(makeDish('Mutton Dak Bungalow', 'mutton-dak-bungalow', 'east', ['West Bengal', 'Odisha'], ['lunch', 'dinner'], 'non-veg', 'heavy', ['protein', 'fat'], ['mutton', 'egg', 'colonial'],
    VARIANTS.classic('Mutton Dak Bungalow', 'mutton-dak-bungalow', ['lunch'])));
  dishes.push(makeDish('Mutton Thali East', 'mutton-thali-east', 'east', ['West Bengal'], ['lunch'], 'non-veg', 'heavy', ['protein', 'carb', 'fat'], ['thali', 'complete', 'festive'],
    VARIANTS.classic('Mutton Thali', 'mutton-thali-east', ['lunch'])));
  dishes.push(makeDish('Chicken Doi Kosha', 'chicken-doi-kosha', 'east', ['West Bengal'], ['lunch', 'dinner'], 'non-veg', 'heavy', ['protein', 'fat'], ['yogurt', 'chicken', 'tangy'],
    VARIANTS.classic('Chicken Doi Kosha', 'chicken-doi-kosha', ['lunch'])));
  dishes.push(makeDish('Luchi with Mangsho', 'luchi-mangsho', 'east', ['West Bengal'], ['lunch'], 'non-veg', 'heavy', ['carb', 'fat', 'protein'], ['fried', 'mutton', 'festive'],
    VARIANTS.classic('Luchi with Mangsho', 'luchi-mangsho', ['lunch'])));
  dishes.push(makeDish('Chingri Pulao', 'chingri-pulao', 'east', ['West Bengal'], ['lunch', 'dinner'], 'non-veg', 'heavy', ['protein', 'carb', 'fat'], ['prawn', 'rice', 'aromatic'],
    VARIANTS.classic('Chingri Pulao', 'chingri-pulao', ['lunch'])));
  
  // Rice items
  dishes.push(makeDish('Bengali Bhate', 'bengali-bhate', 'east', ['West Bengal'], ['lunch', 'dinner'], 'veg', 'light', ['carb'], ['rice', 'ghee', 'simple'],
    VARIANTS.classic('Bengali Bhate', 'bengali-bhate', ['lunch'])));
  dishes.push(makeDish('Chire Bhaja', 'chire-bhaja', 'east', ['West Bengal'], ['snacks'], 'veg', 'light', ['carb'], ['rice-flakes', 'fried', 'crispy'],
    VARIANTS.classic('Chire Bhaja', 'chire-bhaja', ['snacks'])));
  dishes.push(makeDish('Moong Dal Bengali', 'moong-dal-bengali', 'east', ['West Bengal'], ['lunch', 'dinner'], 'veg', 'light', ['protein'], ['dal', 'ghee', 'comfort'],
    VARIANTS.classic('Moong Dal', 'moong-dal-bengali', ['lunch'])));
  dishes.push(makeDish('Shukto', 'shukto', 'east', ['West Bengal'], ['lunch', 'dinner'], 'veg', 'light', ['fiber'], ['mixed-veg', 'bitter', 'traditional'],
    VARIANTS.classic('Shukto', 'shukto', ['lunch'])));
  dishes.push(makeDish('Shukto Bengali', 'shukto-bengali', 'east', ['West Bengal'], ['lunch'], 'veg', 'light', ['fiber'], ['mixed-veg', 'bitter-melon', 'starter'],
    VARIANTS.classic('Shukto', 'shukto-bengali', ['lunch'])));
  dishes.push(makeDish('Labra', 'labra', 'east', ['West Bengal'], ['lunch', 'dinner'], 'veg', 'medium', ['fiber'], ['mixed-veg', 'stew', 'everyday'],
    VARIANTS.classic('Labra', 'labra', ['lunch'])));
  dishes.push(makeDish('Chorchore', 'chorchore', 'east', ['West Bengal'], ['lunch', 'dinner'], 'veg', 'light', ['fiber'], ['mixed-veg', 'stir-fry', 'dry'],
    VARIANTS.classic('Chorchore', 'chorchore', ['lunch'])));
  dishes.push(makeDish('Aloo Phoolkopir Dalna', 'aloo-phoolkopir-dalna', 'east', ['West Bengal'], ['lunch', 'dinner'], 'veg', 'medium', ['carb', 'fiber'], ['potato', 'cauliflower', 'gravy'],
    VARIANTS.classic('Aloo Phoolkopir Dalna', 'aloo-phoolkopir-dalna', ['lunch'])));
  dishes.push(makeDish('Begun Bhaja', 'begun-bhaja', 'east', ['West Bengal'], ['lunch', 'dinner'], 'veg', 'light', ['fat'], ['brinjal', 'fried', 'simple'],
    VARIANTS.classic('Begun Bhaja', 'begun-bhaja', ['lunch'])));
  dishes.push(makeDish('Pumpkin Chenchki', 'pumpkin-chenchki', 'east', ['West Bengal', 'Odisha'], ['lunch'], 'veg', 'light', ['carb', 'fiber'], ['pumpkin', 'panch-phoron', 'sweet'],
    VARIANTS.classic('Pumpkin Chenchki', 'pumpkin-chenchki', ['lunch'])));
  dishes.push(makeDish('Potol Dolma', 'potol-dolma', 'east', ['West Bengal'], ['lunch', 'dinner'], 'veg', 'medium', ['fiber'], ['stuffed', 'parwal', 'traditional'],
    VARIANTS.classic('Potol Dolma', 'potol-dolma', ['lunch'])));
  dishes.push(makeDish('Niramish Dalna', 'niramish-dalna', 'east', ['West Bengal'], ['lunch', 'dinner'], 'veg', 'medium', ['protein', 'fiber'], ['mixed-veg', 'paneer', 'gravy'],
    VARIANTS.classic('Niramish Dalna', 'niramish-dalna', ['lunch'])));
  dishes.push(makeDish('Dalna Bengali', 'dalna-bengali', 'east', ['West Bengal'], ['lunch', 'dinner'], 'veg', 'medium', ['fiber'], ['mixed-veg', 'curry', 'everyday'],
    VARIANTS.classic('Dalna', 'dalna-bengali', ['lunch'])));
  dishes.push(makeDish('Bengali Thali', 'bengali-thali', 'east', ['West Bengal'], ['lunch'], 'veg', 'heavy', ['carb', 'protein', 'fat'], ['thali', 'complete', 'traditional'],
    VARIANTS.classic('Bengali Thali', 'bengali-thali', ['lunch'])));
  
  // Sweets & snacks
  dishes.push(makeDish('Rasgulla', 'rasgulla', 'east', ['West Bengal', 'Odisha'], ['snacks'], 'veg', 'heavy', ['dairy', 'sweet'], ['sweet', 'chhena', 'syrup'],
    VARIANTS.classic('Rasgulla', 'rasgulla', ['snacks'])));
  dishes.push(makeDish('Mishti Doi', 'mishti-doi', 'east', ['West Bengal'], ['snacks'], 'veg', 'heavy', ['dairy', 'sweet'], ['sweet', 'yogurt', 'clay-pot'],
    VARIANTS.classic('Mishti Doi', 'mishti-doi', ['snacks'])));
  dishes.push(makeDish('Sandesh', 'sandesh', 'east', ['West Bengal'], ['snacks'], 'veg', 'medium', ['dairy', 'sweet'], ['sweet', 'chhena', 'delicate'],
    VARIANTS.classic('Sandesh', 'sandesh', ['snacks'])));
  dishes.push(makeDish('Roshogolla', 'roshogolla', 'east', ['West Bengal'], ['snacks'], 'veg', 'heavy', ['dairy', 'sweet'], ['sweet', 'syrup', 'soft'],
    VARIANTS.classic('Roshogolla', 'roshogolla', ['snacks'])));
  dishes.push(makeDish('Pantua', 'pantua', 'east', ['West Bengal'], ['snacks'], 'veg', 'heavy', ['carb', 'sweet'], ['fried', 'sweet', 'syrup'],
    VARIANTS.classic('Pantua', 'pantua', ['snacks'])));
  dishes.push(makeDish('Ledikeni', 'ledikeni', 'east', ['West Bengal'], ['snacks'], 'veg', 'heavy', ['carb', 'sweet'], ['fried', 'sweet', 'syrup'],
    VARIANTS.classic('Ledikeni', 'ledikeni', ['snacks'])));
  dishes.push(makeDish('Chomchom', 'chomchom', 'east', ['West Bengal'], ['snacks'], 'veg', 'heavy', ['dairy', 'sweet'], ['sweet', 'cylindrical', 'syrup'],
    VARIANTS.classic('Chomchom', 'chomchom', ['snacks'])));
  dishes.push(makeDish('Sitabhog', 'sitabhog', 'east', ['West Bengal'], ['snacks'], 'veg', 'medium', ['carb', 'sweet'], ['sweet', 'rice', 'burdwan'],
    VARIANTS.classic('Sitabhog', 'sitabhog', ['snacks'])));
  dishes.push(makeDish('Pitha', 'pitha', 'east', ['West Bengal', 'Odisha'], ['snacks'], 'veg', 'medium', ['carb', 'sweet'], ['steamed', 'rice', 'festive'],
    VARIANTS.classic('Pitha', 'pitha', ['snacks'])));
  dishes.push(makeDish('Jhal Muri', 'jhal-muri', 'east', ['West Bengal'], ['snacks'], 'veg', 'light', ['carb'], ['puffed-rice', 'spicy', 'street-food'],
    VARIANTS.classic('Jhal Muri', 'jhal-muri', ['snacks'])));
  dishes.push(makeDish('Ghugni', 'ghugni', 'east', ['West Bengal', 'Odisha'], ['snacks', 'lunch'], 'veg', 'medium', ['protein', 'carb'], ['dried-peas', 'curry', 'street-food'],
    VARIANTS.classic('Ghugni', 'ghugni', ['lunch'])));
  dishes.push(makeDish('Cholar Dal with Luchi', 'cholar-dal-luchi', 'east', ['West Bengal'], ['breakfast', 'lunch'], 'veg', 'heavy', ['protein', 'carb', 'fat'], ['fried', 'lentils', 'festive'],
    VARIANTS.classic('Cholar Dal with Luchi', 'cholar-dal-luchi', ['lunch'])));
  dishes.push(makeDish('Macher Chop', 'macher-chop', 'east', ['West Bengal'], ['snacks'], 'non-veg', 'medium', ['protein'], ['fish', 'croquette', 'fried'],
    VARIANTS.classic('Macher Chop', 'macher-chop', ['snacks'])));
  dishes.push(makeDish('Mutton Kalia', 'mutton-kalia', 'east', ['West Bengal'], ['lunch', 'dinner'], 'non-veg', 'heavy', ['protein', 'fat'], ['mutton', 'potato', 'spiced'],
    VARIANTS.classic('Mutton Kalia', 'mutton-kalia', ['lunch'])));
  dishes.push(makeDish('Kancha Gola Morich', 'kancha-gola-morich', 'east', ['West Bengal'], ['snacks'], 'veg', 'light', ['fiber'], ['papaya', 'chutney', 'tangy'],
    VARIANTS.classic('Kancha Gola Morich', 'kancha-gola-morich', ['snacks'])));

  return dishes;
}

// CENTRAL INDIA - 58 dishes
function generateCentral() {
  const dishes = [];
  
  dishes.push(makeDish('Dal Bafla Premium', 'dal-bafla-premium', 'central', ['Madhya Pradesh'], ['lunch', 'dinner'], 'veg', 'heavy', ['carb', 'protein', 'fat'], ['baked', 'lentils', 'ghee'],
    VARIANTS.classic('Dal Bafla', 'dal-bafla-premium', ['lunch'])));
  dishes.push(makeDish('Poha Jalebi MP', 'poha-jalebi-mp', 'central', ['Madhya Pradesh'], ['breakfast'], 'veg', 'medium', ['carb', 'sweet'], ['rice-flakes', 'sweet', 'street-food'],
    VARIANTS.classic('Poha Jalebi', 'poha-jalebi-mp', ['breakfast'])));
  dishes.push(makeDish('Bhutte ka Kees', 'bhutte-ka-kees', 'central', ['Madhya Pradesh'], ['snacks'], 'veg', 'medium', ['carb'], ['corn', 'grated', 'traditional'],
    VARIANTS.classic('Bhutte ka Kees', 'bhutte-ka-kees', ['snacks'])));
  dishes.push(makeDish('Khopra Patties', 'khopra-patties', 'central', ['Madhya Pradesh'], ['snacks'], 'veg', 'medium', ['carb', 'fat'], ['coconut', 'fried', 'street-food'],
    VARIANTS.classic('Khopra Patties', 'khopra-patties', ['snacks'])));
  dishes.push(makeDish('Garadu', 'garadu', 'central', ['Madhya Pradesh'], ['snacks'], 'veg', 'medium', ['carb', 'fat'], ['yam', 'fried', 'street-food'],
    VARIANTS.classic('Garadu', 'garadu', ['snacks'])));
  dishes.push(makeDish('Palak Puri', 'palak-puri', 'central', ['Madhya Pradesh'], ['breakfast'], 'veg', 'medium', ['carb', 'fat'], ['spinach', 'fried', 'healthy'],
    VARIANTS.classic('Palak Puri', 'palak-puri', ['breakfast'])));
  dishes.push(makeDish('Bedai', 'bedai', 'central', ['Madhya Pradesh'], ['breakfast'], 'veg', 'heavy', ['carb', 'fat', 'protein'], ['lentil-stuffed', 'fried', 'spicy'],
    VARIANTS.classic('Bedai', 'bedai', ['breakfast'])));
  dishes.push(makeDish('Mawa Bati', 'mawa-bati', 'central', ['Madhya Pradesh'], ['snacks'], 'veg', 'heavy', ['carb', 'fat', 'sweet'], ['sweet', 'khoya', 'indore'],
    VARIANTS.classic('Mawa Bati', 'mawa-bati', ['snacks'])));
  dishes.push(makeDish('Khoprapak', 'khoprapak', 'central', ['Madhya Pradesh'], ['snacks'], 'veg', 'heavy', ['carb', 'fat', 'sweet'], ['sweet', 'coconut', 'traditional'],
    VARIANTS.classic('Khoprapak', 'khoprapak', ['snacks'])));
  dishes.push(makeDish('Malpua MP', 'malpua-mp', 'central', ['Madhya Pradesh'], ['snacks'], 'veg', 'heavy', ['carb', 'sweet'], ['sweet', 'fried', 'syrup'],
    VARIANTS.classic('Malpua', 'malpua-mp', ['snacks'])));
  dishes.push(makeDish('Fafda MP', 'fafda-mp', 'central', ['Madhya Pradesh'], ['snacks'], 'veg', 'medium', ['carb', 'fat'], ['crispy', 'gram-flour', 'savory'],
    VARIANTS.classic('Fafda', 'fafda-mp', ['snacks'])));
  dishes.push(makeDish('Samosa Indore', 'samosa-indore', 'central', ['Madhya Pradesh'], ['snacks'], 'veg', 'medium', ['carb', 'fat'], ['fried', 'spiced', 'street-food'],
    VARIANTS.classic('Samosa', 'samosa-indore', ['snacks'])));
  dishes.push(makeDish('Kachori MP', 'kachori-mp', 'central', ['Madhya Pradesh'], ['snacks'], 'veg', 'medium', ['carb', 'fat'], ['fried', 'lentil', 'spiced'],
    VARIANTS.classic('Kachori', 'kachori-mp', ['snacks'])));
  dishes.push(makeDish('Aloo Tikki MP', 'aloo-tikki-mp', 'central', ['Madhya Pradesh'], ['snacks'], 'veg', 'medium', ['carb', 'fat'], ['potato', 'fried', 'street-food'],
    VARIANTS.classic('Aloo Tikki', 'aloo-tikki-mp', ['snacks'])));
  dishes.push(makeDish('Ratlami Sev', 'ratlami-sev', 'central', ['Madhya Pradesh'], ['snacks'], 'veg', 'medium', ['carb', 'fat'], ['crispy', 'spiced', 'street-food'],
    VARIANTS.classic('Ratlami Sev', 'ratlami-sev', ['snacks'])));
  
  // Rice items
  dishes.push(makeDish('Khichdi MP', 'khichdi-mp', 'central', ['Madhya Pradesh'], ['lunch', 'dinner'], 'veg', 'medium', ['carb', 'protein'], ['one-pot', 'rice', 'lentils'],
    VARIANTS.classic('Khichdi', 'khichdi-mp', ['lunch'])));
  dishes.push(makeDish('Biryani MP', 'biryani-mp', 'central', ['Madhya Pradesh'], ['lunch', 'dinner'], 'non-veg', 'heavy', ['protein', 'carb', 'fat'], ['rice', 'dum', 'aromatic'],
    VARIANTS.classic('Biryani', 'biryani-mp', ['lunch'])));
  dishes.push(makeDish('Biryani Bhopali', 'biryani-bhopali', 'central', ['Madhya Pradesh'], ['lunch', 'dinner'], 'non-veg', 'heavy', ['protein', 'carb', 'fat'], ['mutton', 'bhopal', 'aromatic'],
    VARIANTS.classic('Bhopali Biryani', 'biryani-bhopali', ['lunch'])));
  dishes.push(makeDish('Bhopali Gosht Korma', 'bhopali-gosht-korma', 'central', ['Madhya Pradesh'], ['lunch', 'dinner'], 'non-veg', 'heavy', ['protein', 'fat'], ['mutton', 'korma', 'rich'],
    VARIANTS.classic('Gosht Korma', 'bhopali-gosht-korma', ['lunch'])));
  dishes.push(makeDish('Bhopali Murgh', 'bhopali-murgh', 'central', ['Madhya Pradesh'], ['lunch', 'dinner'], 'non-veg', 'heavy', ['protein', 'fat'], ['chicken', 'bhopal', 'aromatic'],
    VARIANTS.classic('Bhopali Murgh', 'bhopali-murgh', ['lunch'])));
  dishes.push(makeDish('Keema Bhopal', 'keema-bhopal', 'central', ['Madhya Pradesh'], ['lunch', 'dinner'], 'non-veg', 'medium', ['protein'], ['minced', 'mutton', 'spiced'],
    VARIANTS.classic('Keema Bhopal', 'keema-bhopal', ['lunch'])));
  dishes.push(makeDish('Rogan Josh MP', 'rogan-josh-mp', 'central', ['Madhya Pradesh'], ['lunch', 'dinner'], 'non-veg', 'heavy', ['protein', 'fat'], ['mutton', 'red', 'aromatic'],
    VARIANTS.classic('Rogan Josh', 'rogan-josh-mp', ['lunch'])));
  dishes.push(makeDish('Mutton Curry MP', 'mutton-curry-mp', 'central', ['Madhya Pradesh'], ['lunch', 'dinner'], 'non-veg', 'heavy', ['protein', 'fat'], ['mutton', 'curry', 'spicy'],
    VARIANTS.classic('Mutton Curry', 'mutton-curry-mp', ['lunch'])));
  dishes.push(makeDish('Chicken Curry MP', 'chicken-curry-mp', 'central', ['Madhya Pradesh'], ['lunch', 'dinner'], 'non-veg', 'medium', ['protein'], ['chicken', 'curry', 'everyday'],
    VARIANTS.classic('Chicken Curry', 'chicken-curry-mp', ['lunch'])));
  dishes.push(makeDish('Kadhi MP', 'kadhi-mp', 'central', ['Madhya Pradesh'], ['lunch', 'dinner'], 'veg', 'medium', ['protein', 'carb'], ['yogurt', 'pakora', 'comfort'],
    VARIANTS.classic('Kadhi', 'kadhi-mp', ['lunch'])));
  
  // Main dishes
  dishes.push(makeDish('Sev Tamatar', 'sev-tamatar', 'central', ['Madhya Pradesh'], ['lunch', 'dinner'], 'veg', 'medium', ['carb', 'fiber'], ['tomato', 'sev', 'tangy'],
    VARIANTS.classic('Sev Tamatar', 'sev-tamatar', ['lunch'])));
  dishes.push(makeDish('Palak Paneer MP', 'palak-paneer-mp', 'central', ['Madhya Pradesh'], ['lunch', 'dinner'], 'veg', 'medium', ['protein', 'fat'], ['spinach', 'paneer', 'green'],
    VARIANTS.classic('Palak Paneer', 'palak-paneer-mp', ['lunch'])));
  dishes.push(makeDish('Aloo Gobhi MP', 'aloo-gobhi-mp', 'central', ['Madhya Pradesh'], ['lunch', 'dinner'], 'veg', 'light', ['carb', 'fiber'], ['potato', 'cauliflower', 'dry'],
    VARIANTS.classic('Aloo Gobhi', 'aloo-gobhi-mp', ['lunch'])));
  dishes.push(makeDish('Mix Veg MP', 'mix-veg-mp', 'central', ['Madhya Pradesh'], ['lunch', 'dinner'], 'veg', 'medium', ['fiber'], ['mixed-veg', 'curry', 'everyday'],
    VARIANTS.classic('Mix Veg', 'mix-veg-mp', ['lunch'])));
  dishes.push(makeDish('Bhindi Masala MP', 'bhindi-masala-mp', 'central', ['Madhya Pradesh'], ['lunch', 'dinner'], 'veg', 'light', ['fiber'], ['okra', 'spiced', 'dry'],
    VARIANTS.classic('Bhindi Masala', 'bhindi-masala-mp', ['lunch'])));
  dishes.push(makeDish('Baingan Bharta MP', 'baingan-bharta-mp', 'central', ['Madhya Pradesh'], ['lunch', 'dinner'], 'veg', 'medium', ['fiber'], ['brinjal', 'smoky', 'mashed'],
    VARIANTS.classic('Baingan Bharta', 'baingan-bharta-mp', ['lunch'])));
  dishes.push(makeDish('Rajma MP', 'rajma-mp', 'central', ['Madhya Pradesh'], ['lunch', 'dinner'], 'veg', 'medium', ['protein'], ['kidney-beans', 'curry', 'comfort'],
    VARIANTS.classic('Rajma', 'rajma-mp', ['lunch'])));
  dishes.push(makeDish('Chole MP', 'chole-mp', 'central', ['Madhya Pradesh'], ['lunch', 'dinner'], 'veg', 'medium', ['protein', 'carb'], ['chickpeas', 'spicy', 'curry'],
    VARIANTS.classic('Chole', 'chole-mp', ['lunch'])));
  dishes.push(makeDish('Dal Fry MP', 'dal-fry-mp', 'central', ['Madhya Pradesh'], ['lunch', 'dinner'], 'veg', 'medium', ['protein'], ['lentils', 'tadka', 'everyday'],
    VARIANTS.classic('Dal Fry', 'dal-fry-mp', ['lunch'])));
  dishes.push(makeDish('Dal Tadka MP', 'dal-tadka-mp', 'central', ['Madhya Pradesh'], ['lunch', 'dinner'], 'veg', 'medium', ['protein'], ['lentils', 'tempered', 'comfort'],
    VARIANTS.classic('Dal Tadka', 'dal-tadka-mp', ['lunch'])));
  dishes.push(makeDish('Jeera Aloo', 'jeera-aloo', 'central', ['Madhya Pradesh'], ['lunch', 'dinner'], 'veg', 'light', ['carb'], ['potato', 'cumin', 'simple'],
    VARIANTS.classic('Jeera Aloo', 'jeera-aloo', ['lunch'])));
  dishes.push(makeDish('Aloo Matar MP', 'aloo-matar-mp', 'central', ['Madhya Pradesh'], ['lunch', 'dinner'], 'veg', 'medium', ['carb', 'protein'], ['potato', 'peas', 'curry'],
    VARIANTS.classic('Aloo Matar', 'aloo-matar-mp', ['lunch'])));
  dishes.push(makeDish('Matar Paneer MP', 'matar-paneer-mp', 'central', ['Madhya Pradesh'], ['lunch', 'dinner'], 'veg', 'medium', ['protein', 'fat'], ['paneer', 'peas', 'gravy'],
    VARIANTS.classic('Matar Paneer', 'matar-paneer-mp', ['lunch'])));
  dishes.push(makeDish('Paneer Butter Masala MP', 'paneer-butter-mp', 'central', ['Madhya Pradesh'], ['lunch', 'dinner'], 'veg', 'heavy', ['protein', 'fat'], ['paneer', 'rich', 'butter'],
    VARIANTS.classic('Paneer Butter Masala', 'paneer-butter-mp', ['lunch'])));
  dishes.push(makeDish('Shahi Paneer MP', 'shahi-paneer-mp', 'central', ['Madhya Pradesh'], ['lunch', 'dinner'], 'veg', 'heavy', ['protein', 'fat'], ['paneer', 'royal', 'cream'],
    VARIANTS.classic('Shahi Paneer', 'shahi-paneer-mp', ['lunch'])));
  dishes.push(makeDish('Paneer Tikka MP', 'paneer-tikka-mp', 'central', ['Madhya Pradesh'], ['snacks', 'dinner'], 'veg', 'medium', ['protein', 'fat'], ['paneer', 'grilled', 'tandoor'],
    VARIANTS.classic('Paneer Tikka', 'paneer-tikka-mp', ['snacks'])));
  dishes.push(makeDish('Gujarati Kadhi MP', 'gujarati-kadhi-mp', 'central', ['Gujarat', 'Madhya Pradesh'], ['lunch', 'dinner'], 'veg', 'medium', ['protein', 'carb'], ['yogurt', 'sweet', 'pakora'],
    VARIANTS.classic('Gujarati Kadhi', 'gujarati-kadhi-mp', ['lunch'])));
  dishes.push(makeDish('Thali MP', 'thali-mp', 'central', ['Madhya Pradesh'], ['lunch'], 'veg', 'heavy', ['carb', 'protein', 'fat'], ['thali', 'complete', 'traditional'],
    VARIANTS.classic('Thali', 'thali-mp', ['lunch'])));
  dishes.push(makeDish('Malwa Thali', 'malwa-thali', 'central', ['Madhya Pradesh'], ['lunch'], 'veg', 'heavy', ['carb', 'protein', 'fat'], ['thali', 'malwa', 'regional'],
    VARIANTS.classic('Malwa Thali', 'malwa-thali', ['lunch'])));
  dishes.push(makeDish('Gwalior Kachori', 'gwalior-kachori', 'central', ['Madhya Pradesh'], ['snacks'], 'veg', 'medium', ['carb', 'fat', 'protein'], ['lentil-stuffed', 'fried', 'famous'],
    VARIANTS.classic('Gwalior Kachori', 'gwalior-kachori', ['snacks'])));
  dishes.push(makeDish('Indori Poha', 'indori-poha', 'central', ['Madhya Pradesh'], ['breakfast'], 'veg', 'light', ['carb'], ['rice-flakes', 'sev', 'street-food'],
    VARIANTS.classic('Indori Poha', 'indori-poha', ['breakfast'])));
  dishes.push(makeDish('Indore Chappan Dukan', 'indore-chappan-duk', 'central', ['Madhya Pradesh'], ['snacks'], 'veg', 'medium', ['carb', 'fat'], ['street-food', 'variety', 'famous'],
    VARIANTS.classic('Chappan Dukan Thali', 'indore-chappan-duk', ['snacks'])));
  dishes.push(makeDish('Jalebi MP', 'jalebi-mp', 'central', ['Madhya Pradesh'], ['snacks'], 'veg', 'heavy', ['carb', 'sweet'], ['sweet', 'fried', 'syrup'],
    VARIANTS.classic('Jalebi', 'jalebi-mp', ['snacks'])));
  dishes.push(makeDish('Imarti', 'imarti', 'central', ['Madhya Pradesh'], ['snacks'], 'veg', 'heavy', ['carb', 'sweet'], ['sweet', 'syrup', 'traditional'],
    VARIANTS.classic('Imarti', 'imarti', ['snacks'])));
  dishes.push(makeDish('Bhutte Kees Ujjain', 'bhutte-kees-ujjain', 'central', ['Madhya Pradesh'], ['snacks'], 'veg', 'medium', ['carb'], ['corn', 'street-food', 'traditional'],
    VARIANTS.classic('Bhutte Kees', 'bhutte-kees-ujjain', ['snacks'])));
  dishes.push(makeDish('Poha Indori Special', 'poha-indori-special', 'central', ['Madhya Pradesh'], ['breakfast'], 'veg', 'light', ['carb'], ['rice-flakes', 'sev', 'jalebi'],
    VARIANTS.classic('Poha Indori', 'poha-indori-special', ['breakfast'])));
  dishes.push(makeDish('Dal Bafla Ujjain', 'dal-bafla-ujjain', 'central', ['Madhya Pradesh'], ['lunch', 'dinner'], 'veg', 'heavy', ['carb', 'protein'], ['baked', 'dal', 'ghee'],
    VARIANTS.classic('Dal Bafla', 'dal-bafla-ujjain', ['lunch'])));
  dishes.push(makeDish('Mutton Biryani Bhopal', 'mutton-biryani-bhopal', 'central', ['Madhya Pradesh'], ['lunch', 'dinner'], 'non-veg', 'heavy', ['protein', 'carb', 'fat'], ['mutton', 'bhopal', 'dum'],
    VARIANTS.classic('Bhopali Mutton Biryani', 'mutton-biryani-bhopal', ['lunch'])));
  dishes.push(makeDish('Bhopali Keema', 'bhopali-keema', 'central', ['Madhya Pradesh'], ['lunch', 'dinner'], 'non-veg', 'medium', ['protein'], ['minced', 'mutton', 'spiced'],
    VARIANTS.classic('Bhopali Keema', 'bhopali-keema', ['lunch'])));
  dishes.push(makeDish('Chicken Tikta', 'chicken-tikta', 'central', ['Madhya Pradesh'], ['lunch', 'dinner'], 'non-veg', 'medium', ['protein'], ['chicken', 'spicy', 'gravy'],
    VARIANTS.classic('Chicken Tikta', 'chicken-tikta', ['lunch'])));
  dishes.push(makeDish('Paneer Lababdar MP', 'paneer-lababdar-mp', 'central', ['Madhya Pradesh'], ['lunch', 'dinner'], 'veg', 'heavy', ['protein', 'fat'], ['paneer', 'rich', 'restaurant'],
    VARIANTS.classic('Paneer Lababdar', 'paneer-lababdar-mp', ['lunch'])));
  dishes.push(makeDish('Veg Biryani MP', 'veg-biryani-mp', 'central', ['Madhya Pradesh'], ['lunch', 'dinner'], 'veg', 'heavy', ['carb', 'fiber'], ['rice', 'mixed-veg', 'aromatic'],
    VARIANTS.classic('Veg Biryani', 'veg-biryani-mp', ['lunch'])));
  dishes.push(makeDish('Aloo Puri MP', 'aloo-puri-mp', 'central', ['Madhya Pradesh'], ['breakfast'], 'veg', 'heavy', ['carb', 'fat'], ['fried', 'potato', 'weekend'],
    VARIANTS.classic('Aloo Puri', 'aloo-puri-mp', ['breakfast'])));

  return dishes;
}

// NORTHEAST INDIA - 54 dishes
function generateNortheast() {
  const dishes = [];
  
  dishes.push(makeDish('Bamboo Shoot Curry NE', 'bamboo-shoot-curry-ne', 'northeast', ['Nagaland', 'Manipur', 'Assam'], ['lunch', 'dinner'], 'veg', 'medium', ['fiber', 'protein'], ['fermented', 'bamboo', 'traditional'],
    VARIANTS.classic('Bamboo Shoot Curry', 'bamboo-shoot-curry-ne', ['lunch'])));
  dishes.push(makeDish('Smoked Pork Naga', 'smoked-pork-naga', 'northeast', ['Nagaland'], ['lunch', 'dinner'], 'non-veg', 'heavy', ['protein', 'fat'], ['pork', 'smoked', 'axone'],
    VARIANTS.classic('Smoked Pork', 'smoked-pork-naga', ['lunch'])));
  dishes.push(makeDish('Galho', 'galho', 'northeast', ['Nagaland'], ['lunch', 'dinner'], 'non-veg', 'heavy', ['protein', 'carb'], ['rice', 'pork', 'one-pot'],
    VARIANTS.classic('Galho', 'galho', ['lunch'])));
  dishes.push(makeDish('Zutho Rice Beer', 'zutho-rice-beer', 'northeast', ['Nagaland'], ['snacks'], 'veg', 'heavy', ['carb', 'sweet'], ['fermented', 'rice', 'traditional'],
    VARIANTS.classic('Zutho', 'zutho-rice-beer', ['snacks'])));
  dishes.push(makeDish('Aloo Pitika', 'aloo-pitika', 'northeast', ['Assam'], ['lunch', 'dinner'], 'veg', 'light', ['carb'], ['mashed', 'potato', 'mustard-oil'],
    VARIANTS.classic('Aloo Pitika', 'aloo-pitika', ['lunch'])));
  dishes.push(makeDish('Khar Assamese', 'khar-assamese', 'northeast', ['Assam'], ['lunch', 'dinner'], 'veg', 'light', ['fiber'], ['alkaline', 'papaya', 'traditional'],
    VARIANTS.classic('Khar', 'khar-assamese', ['lunch'])));
  dishes.push(makeDish('Tenga Assamese', 'tenga-assamese', 'northeast', ['Assam'], ['lunch', 'dinner'], 'non-veg', 'medium', ['protein'], ['sour', 'fish', 'tomato'],
    VARIANTS.classic('Tenga', 'tenga-assamese', ['lunch'])));
  dishes.push(makeDish('Masor Tenga NE', 'masor-tenga-ne', 'northeast', ['Assam'], ['lunch', 'dinner'], 'non-veg', 'light', ['protein'], ['fish', 'sour', 'lemon'],
    VARIANTS.classic('Masor Tenga', 'masor-tenga-ne', ['lunch'])));
  dishes.push(makeDish('Patot Diya Tenga', 'patot-diya-tenga', 'northeast', ['Assam'], ['lunch', 'dinner'], 'non-veg', 'light', ['protein'], ['fish', 'sour', 'lemon-leaf'],
    VARIANTS.classic('Patot Diya Tenga', 'patot-diya-tenga', ['lunch'])));
  dishes.push(makeDish('Xaak Bhaji', 'xaak-bhaji', 'northeast', ['Assam'], ['lunch', 'dinner'], 'veg', 'light', ['fiber'], ['greens', 'stir-fry', 'healthy'],
    VARIANTS.classic('Xaak Bhaji', 'xaak-bhaji', ['lunch'])));
  dishes.push(makeDish('Poita Bhat', 'poita-bhat', 'northeast', ['Assam'], ['breakfast', 'lunch'], 'veg', 'light', ['carb'], ['fermented', 'rice', 'traditional'],
    VARIANTS.classic('Poita Bhat', 'poita-bhat', ['breakfast'])));
  dishes.push(makeDish('Jadoh', 'jadoh', 'northeast', ['Meghalaya'], ['lunch', 'dinner'], 'non-veg', 'heavy', ['protein', 'carb'], ['rice', 'pork', 'one-pot'],
    VARIANTS.classic('Jadoh', 'jadoh', ['lunch'])));
  dishes.push(makeDish('Doh Khleh NE', 'doh-khleh-ne', 'northeast', ['Meghalaya'], ['lunch', 'dinner'], 'non-veg', 'heavy', ['protein', 'fat'], ['pork', 'offal', 'traditional'],
    VARIANTS.classic('Doh Khleh', 'doh-khleh-ne', ['lunch'])));
  dishes.push(makeDish('Doh Neiiong', 'doh-neiiong', 'northeast', ['Meghalaya'], ['lunch', 'dinner'], 'non-veg', 'heavy', ['protein', 'fat'], ['pork', 'black-sesame', 'rich'],
    VARIANTS.classic('Doh Neiiong', 'doh-neiiong', ['lunch'])));
  dishes.push(makeDish('Tungrymbai', 'tungrymbai', 'northeast', ['Meghalaya'], ['lunch', 'dinner'], 'veg', 'medium', ['protein'], ['fermented', 'soybean', 'traditional'],
    VARIANTS.classic('Tungrymbai', 'tungrymbai', ['lunch'])));
  
  dishes.push(makeDish('Eromba NE', 'eromba-ne', 'northeast', ['Manipur'], ['lunch', 'dinner'], 'veg', 'medium', ['protein', 'fiber'], ['fermented', 'potato', 'chili'],
    VARIANTS.classic('Eromba', 'eromba-ne', ['lunch'])));
  dishes.push(makeDish('Chamthong', 'chamthong', 'northeast', ['Manipur'], ['lunch', 'dinner'], 'veg', 'medium', ['fiber'], ['stew', 'mixed-veg', 'fermented'],
    VARIANTS.classic('Chamthong', 'chamthong', ['lunch'])));
  dishes.push(makeDish('Kangshoi', 'kangshoi', 'northeast', ['Manipur'], ['lunch', 'dinner'], 'veg', 'light', ['fiber'], ['stew', 'vegetables', 'light'],
    VARIANTS.classic('Kangshoi', 'kangshoi', ['lunch'])));
  dishes.push(makeDish('Singju', 'singju', 'northeast', ['Manipur'], ['snacks'], 'veg', 'light', ['fiber'], ['salad', 'herbs', 'fresh'],
    VARIANTS.classic('Singju', 'singju', ['snacks'])));
  dishes.push(makeDish('Ngari', 'ngari', 'northeast', ['Manipur'], ['lunch', 'dinner'], 'non-veg', 'medium', ['protein'], ['fermented', 'fish', 'traditional'],
    VARIANTS.classic('Ngari', 'ngari', ['lunch'])));
  dishes.push(makeDish('Chakhao Rice', 'chakhao-rice', 'northeast', ['Manipur'], ['lunch', 'dinner'], 'veg', 'medium', ['carb'], ['red-rice', 'aromatic', 'traditional'],
    VARIANTS.classic('Chakhao Rice', 'chakhao-rice', ['lunch'])));
  dishes.push(makeDish('Ooti', 'ooti', 'northeast', ['Manipur'], ['snacks', 'lunch'], 'veg', 'medium', ['carb', 'fat'], ['peas', 'butter-beans', 'comfort'],
    VARIANTS.classic('Ooti', 'ooti', ['lunch'])));
  dishes.push(makeDish('Paknam', 'paknam', 'northeast', ['Manipur'], ['snacks'], 'veg', 'light', ['protein'], ['steamed', 'fermented', 'banana-leaf'],
    VARIANTS.classic('Paknam', 'paknam', ['snacks'])));
  dishes.push(makeDish('Morok Metpa', 'morok-metpa', 'northeast', ['Manipur'], ['snacks'], 'veg', 'light', ['fiber'], ['chili', 'smoked', 'chutney'],
    VARIANTS.classic('Morok Metpa', 'morok-metpa', ['snacks'])));
  dishes.push(makeDish('Iromba', 'iromba', 'northeast', ['Manipur'], ['lunch', 'dinner'], 'veg', 'medium', ['fiber', 'protein'], ['mashed', 'vegetables', 'fermented-fish'],
    VARIANTS.classic('Iromba', 'iromba', ['lunch'])));
  
  dishes.push(makeDish('Miso Soup NE', 'miso-soup-ne', 'northeast', ['Sikkim'], ['lunch', 'dinner'], 'veg', 'light', ['protein'], ['soup', 'fermented', 'soybean'],
    VARIANTS.classic('Miso Soup', 'miso-soup-ne', ['lunch'])));
  dishes.push(makeDish('Thenthuk NE', 'thenthuk-ne', 'northeast', ['Sikkim'], ['lunch', 'dinner'], 'non-veg', 'heavy', ['carb', 'protein'], ['noodle', 'soup', 'comfort'],
    VARIANTS.classic('Thenthuk', 'thenthuk-ne', ['lunch'])));
  dishes.push(makeDish('Momos NE', 'momos-ne', 'northeast', ['Sikkim', 'Arunachal Pradesh'], ['snacks', 'lunch'], 'non-veg', 'medium', ['protein'], ['dumplings', 'steamed', 'street-food'],
    VARIANTS.classic('Momos', 'momos-ne', ['snacks'])));
  dishes.push(makeDish('Thukpa NE', 'thukpa-ne', 'northeast', ['Sikkim', 'Arunachal Pradesh'], ['lunch', 'dinner'], 'non-veg', 'heavy', ['carb', 'protein'], ['noodle', 'soup', 'hearty'],
    VARIANTS.classic('Thukpa', 'thukpa-ne', ['lunch'])));
  dishes.push(makeDish('Gyathuk', 'gyathuk', 'northeast', ['Sikkim'], ['lunch', 'dinner'], 'non-veg', 'heavy', ['carb', 'protein'], ['noodle', 'soup', 'comfort'],
    VARIANTS.classic('Gyathuk', 'gyathuk', ['lunch'])));
  dishes.push(makeDish('Sel Roti', 'sel-roti', 'northeast', ['Sikkim'], ['snacks', 'breakfast'], 'veg', 'medium', ['carb', 'fat'], ['fried', 'rice-flour', 'donut'],
    VARIANTS.classic('Sel Roti', 'sel-roti', ['breakfast'])));
  dishes.push(makeDish('Phagshapa', 'phagshapa', 'northeast', ['Sikkim'], ['lunch', 'dinner'], 'non-veg', 'heavy', ['protein', 'fat'], ['pork', 'radish', 'dry'],
    VARIANTS.classic('Phagshapa', 'phagshapa', ['lunch'])));
  dishes.push(makeDish('Gundruk', 'gundruk', 'northeast', ['Sikkim', 'Nagaland'], ['lunch', 'dinner'], 'veg', 'light', ['fiber'], ['fermented', 'greens', 'traditional'],
    VARIANTS.classic('Gundruk', 'gundruk', ['lunch'])));
  dishes.push(makeDish('Sinki', 'sinki', 'northeast', ['Sikkim'], ['lunch', 'dinner'], 'veg', 'light', ['fiber'], ['fermented', 'radish', 'sour'],
    VARIANTS.classic('Sinki', 'sinki', ['lunch'])));
  dishes.push(makeDish('Kinema', 'kinema', 'northeast', ['Sikkim'], ['lunch', 'dinner'], 'veg', 'medium', ['protein'], ['fermented', 'soybean', 'curry'],
    VARIANTS.classic('Kinema', 'kinema', ['lunch'])));
  dishes.push(makeDish('Sha Phaley', 'sha-phaley', 'northeast', ['Sikkim'], ['snacks'], 'non-veg', 'medium', ['protein'], ['fried', 'bread', 'stuffed'],
    VARIANTS.classic('Sha Phaley', 'sha-phaley', ['snacks'])));
  
  dishes.push(makeDish('Apong', 'apong', 'northeast', ['Arunachal Pradesh'], ['snacks'], 'veg', 'medium', ['carb'], ['rice-beer', 'traditional', 'festive'],
    VARIANTS.classic('Apong', 'apong', ['snacks'])));
  dishes.push(makeDish('Pasa Gyathuk', 'pasa-gyathuk', 'northeast', ['Arunachal Pradesh'], ['lunch', 'dinner'], 'non-veg', 'heavy', ['protein', 'carb'], ['noodle', 'soup', 'hearty'],
    VARIANTS.classic('Pasa Gyathuk', 'pasa-gyathuk', ['lunch'])));
  dishes.push(makeDish('Thukpa Arunachal', 'thukpa-arunachal', 'northeast', ['Arunachal Pradesh'], ['lunch', 'dinner'], 'non-veg', 'heavy', ['carb', 'protein'], ['noodle-soup', 'comfort', 'winter'],
    VARIANTS.classic('Thukpa', 'thukpa-arunachal', ['lunch'])));
  dishes.push(makeDish('Waffa', 'waffa', 'northeast', ['Arunachal Pradesh'], ['snacks'], 'veg', 'medium', ['carb'], ['rice', 'pancake', 'traditional'],
    VARIANTS.classic('Waffa', 'waffa', ['snacks'])));
  dishes.push(makeDish('Zan', 'zan', 'northeast', ['Arunachal Pradesh'], ['lunch', 'dinner'], 'veg', 'medium', ['carb'], ['rice-porridge', 'simple', 'staple'],
    VARIANTS.classic('Zan', 'zan', ['lunch'])));
  
  dishes.push(makeDish('Bai NE', 'bai-ne', 'northeast', ['Mizoram'], ['lunch', 'dinner'], 'veg', 'medium', ['fiber', 'protein'], ['vegetable', 'herbs', 'boiled'],
    VARIANTS.classic('Bai', 'bai-ne', ['lunch'])));
  dishes.push(makeDish('Vawksa Rep', 'vawksa-rep', 'northeast', ['Mizoram'], ['lunch', 'dinner'], 'non-veg', 'heavy', ['protein', 'fat'], ['pork', 'smoked', 'traditional'],
    VARIANTS.classic('Vawksa Rep', 'vawksa-rep', ['lunch'])));
  dishes.push(makeDish('Bekang', 'bekang', 'northeast', ['Mizoram'], ['lunch', 'dinner'], 'non-veg', 'medium', ['protein'], ['pork', 'dry', 'fried'],
    VARIANTS.classic('Bekang', 'bekang', ['lunch'])));
  dishes.push(makeDish('Chhum Han', 'chhum-han', 'northeast', ['Mizoram'], ['lunch', 'dinner'], 'veg', 'medium', ['carb'], ['rice', 'vegetables', 'one-pot'],
    VARIANTS.classic('Chhum Han', 'chhum-han', ['lunch'])));
  dishes.push(makeDish('Sawhchiar', 'sawhchiar', 'northeast', ['Mizoram'], ['lunch', 'dinner'], 'non-veg', 'heavy', ['protein', 'carb'], ['rice', 'pork', 'one-pot'],
    VARIANTS.classic('Sawhchiar', 'sawhchiar', ['lunch'])));
  dishes.push(makeDish('Koat Pitha', 'koat-pitha', 'northeast', ['Mizoram'], ['snacks'], 'veg', 'medium', ['carb', 'fat'], ['fried', 'banana', 'sweet'],
    VARIANTS.classic('Koat Pitha', 'koat-pitha', ['snacks'])));
  dishes.push(makeDish('Misa Mach Poora', 'misa-mach-poora', 'northeast', ['Tripura'], ['lunch', 'dinner'], 'non-veg', 'medium', ['protein'], ['prawn', 'grilled', 'coconut'],
    VARIANTS.classic('Misa Mach Poora', 'misa-mach-poora', ['lunch'])));
  dishes.push(makeDish('Wahan Mosdeng', 'wahan-mosdeng', 'northeast', ['Tripura'], ['lunch', 'dinner'], 'non-veg', 'medium', ['protein'], ['pork', 'chutney', 'spicy'],
    VARIANTS.classic('Wahan Mosdeng', 'wahan-mosdeng', ['lunch'])));
  dishes.push(makeDish('Berma Rice', 'berma-rice', 'northeast', ['Tripura'], ['lunch'], 'non-veg', 'medium', ['protein', 'carb'], ['fermented-fish', 'rice', 'traditional'],
    VARIANTS.classic('Berma Rice', 'berma-rice', ['lunch'])));
  dishes.push(makeDish('Gudok', 'gudok', 'northeast', ['Tripura'], ['lunch', 'dinner'], 'non-veg', 'medium', ['protein'], ['pork', 'fermented', 'stew'],
    VARIANTS.classic('Gudok', 'gudok', ['lunch'])));
  dishes.push(makeDish('Chakhwi', 'chakhwi', 'northeast', ['Tripura'], ['lunch', 'dinner'], 'veg', 'medium', ['protein', 'fiber'], ['lentils', 'vegetables', 'curry'],
    VARIANTS.classic('Chakhwi', 'chakhwi', ['lunch'])));
  dishes.push(makeDish('Mosdeng Serma', 'mosdeng-serma', 'northeast', ['Tripura'], ['snacks'], 'veg', 'light', ['fiber'], ['chutney', 'chili', 'fermented'],
    VARIANTS.classic('Mosdeng Serma', 'mosdeng-serma', ['snacks'])));
  dishes.push(makeDish('Naga King Curry', 'naga-king-curry', 'northeast', ['Nagaland'], ['lunch', 'dinner'], 'non-veg', 'heavy', ['protein', 'fat'], ['pork', 'raja-mircha', 'spicy'],
    VARIANTS.classic('Naga King Curry', 'naga-king-curry', ['lunch'])));

  return dishes;
}

// Generate and output
const south = generateSouth();
const west = generateWest();
const east = generateEast();
const central = generateCentral();
const northeast = generateNortheast();

console.log(`South: ${south.length} dishes`);
console.log(`West: ${west.length} dishes`);
console.log(`East: ${east.length} dishes`);
console.log(`Central: ${central.length} dishes`);
console.log(`Northeast: ${northeast.length} dishes`);
console.log(`Total: ${south.length + west.length + east.length + central.length + northeast.length} dishes`);

// Output dishes by region
function outputRegion(name, dishes) {
  console.log(`\n\n// ─── ${name.toUpperCase()} ADDITIONS ───`);
  console.log(dishes.join(',\n') + ',');
}

outputRegion('South', south);
outputRegion('West', west);
outputRegion('East', east);
outputRegion('Central', central);
outputRegion('Northeast', northeast);
