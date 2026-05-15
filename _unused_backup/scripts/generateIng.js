// Generate ING entries for missing dishes
import fs from 'fs';

// Read the dishLibrary.ts file
const content = fs.readFileSync('/Users/prateekposwal/MD-App/constants/dishLibrary.ts', 'utf-8');

// Extract dish IDs and their names
const dishPattern = /^\s{8}id: '([^']+)',\n\s{8}name: '([^']+)'/gm;
const dishes = [];
let match;
while ((match = dishPattern.exec(content)) !== null) {
    dishes.push({ id: match[1], name: match[2] });
}

// Extract existing ING keys
const ingPattern = /^\s{4}'([^']+)'::/gm;
const existingIng = new Set();
let ingMatch;
while ((ingMatch = /^\s{4}'([^']+)'::/gm.exec(content)) !== null) {
    existingIng.add(ingMatch[1]);
}

// Also try simpler pattern
const ingPattern2 = /^\s{4}'([^']+)':\s*\[/gm;
while ((ingMatch = ingPattern2.exec(content)) !== null) {
    existingIng.add(ingMatch[1]);
}

// Ingredient templates by dish type/region
const INGREDIENT_TEMPLATES = {
    // South Indian
    south: {
        rice: [
            { name: 'Rice', quantity: 200, unit: 'g', category: 'grains' },
            { name: 'Mustard Seeds', quantity: 3, unit: 'g', category: 'spices' },
            { name: 'Curry Leaves', quantity: 5, unit: 'g', category: 'spices' },
            { name: 'Green Chilies', quantity: 2, unit: 'pc', category: 'produce' },
            { name: 'Oil', quantity: 15, unit: 'ml', category: 'pantry' },
        ],
        curry: [
            { name: 'Coconut', quantity: 50, unit: 'g', category: 'produce' },
            { name: 'Tamarind', quantity: 10, unit: 'g', category: 'spices' },
            { name: 'Curry Leaves', quantity: 5, unit: 'g', category: 'spices' },
            { name: 'Mustard Seeds', quantity: 3, unit: 'g', category: 'spices' },
            { name: 'Green Chilies', quantity: 2, unit: 'pc', category: 'produce' },
        ],
        breakfast: [
            { name: 'Rice Flour', quantity: 150, unit: 'g', category: 'grains' },
            { name: 'Urad Dal', quantity: 50, unit: 'g', category: 'proteins' },
            { name: 'Mustard Seeds', quantity: 3, unit: 'g', category: 'spices' },
            { name: 'Curry Leaves', quantity: 5, unit: 'g', category: 'spices' },
            { name: 'Oil', quantity: 15, unit: 'ml', category: 'pantry' },
        ],
    },
    // West Indian
    west: {
        gujarati: [
            { name: 'Gram Flour', quantity: 150, unit: 'g', category: 'proteins' },
            { name: 'Yogurt', quantity: 50, unit: 'g', category: 'dairy' },
            { name: 'Sugar', quantity: 10, unit: 'g', category: 'pantry' },
            { name: 'Mustard Seeds', quantity: 3, unit: 'g', category: 'spices' },
            { name: 'Green Chilies', quantity: 2, unit: 'pc', category: 'produce' },
        ],
        maharashtrian: [
            { name: 'Peanuts', quantity: 50, unit: 'g', category: 'proteins' },
            { name: 'Coconut', quantity: 30, unit: 'g', category: 'produce' },
            { name: 'Goda Masala', quantity: 5, unit: 'g', category: 'spices' },
            { name: 'Green Chilies', quantity: 2, unit: 'pc', category: 'produce' },
            { name: 'Oil', quantity: 15, unit: 'ml', category: 'pantry' },
        ],
        snack: [
            { name: 'Gram Flour', quantity: 100, unit: 'g', category: 'proteins' },
            { name: 'Semolina', quantity: 50, unit: 'g', category: 'grains' },
            { name: 'Sesame Seeds', quantity: 5, unit: 'g', category: 'spices' },
            { name: 'Oil', quantity: 100, unit: 'ml', category: 'pantry' },
        ],
    },
    // East Indian
    east: {
        fish: [
            { name: 'Fish', quantity: 300, unit: 'g', category: 'proteins' },
            { name: 'Mustard Seeds', quantity: 10, unit: 'g', category: 'spices' },
            { name: 'Green Chilies', quantity: 3, unit: 'pc', category: 'produce' },
            { name: 'Turmeric Powder', quantity: 3, unit: 'g', category: 'spices' },
            { name: 'Mustard Oil', quantity: 30, unit: 'ml', category: 'pantry' },
        ],
        sweet: [
            { name: 'Milk', quantity: 500, unit: 'ml', category: 'dairy' },
            { name: 'Sugar', quantity: 100, unit: 'g', category: 'pantry' },
            { name: 'Cardamom Powder', quantity: 2, unit: 'g', category: 'spices' },
            { name: 'Saffron', quantity: 1, unit: 'g', category: 'spices' },
        ],
        bengali: [
            { name: 'Panch Phoron', quantity: 5, unit: 'g', category: 'spices' },
            { name: 'Mustard Oil', quantity: 20, unit: 'ml', category: 'pantry' },
            { name: 'Green Chilies', quantity: 2, unit: 'pc', category: 'produce' },
            { name: 'Turmeric Powder', quantity: 3, unit: 'g', category: 'spices' },
        ],
    },
    // Central Indian
    central: {
        mp: [
            { name: 'Wheat Flour', quantity: 100, unit: 'g', category: 'grains' },
            { name: 'Ghee', quantity: 20, unit: 'g', category: 'dairy' },
            { name: 'Cumin Seeds', quantity: 5, unit: 'g', category: 'spices' },
            { name: 'Green Chilies', quantity: 2, unit: 'pc', category: 'produce' },
            { name: 'Oil', quantity: 15, unit: 'ml', category: 'pantry' },
        ],
        snack: [
            { name: 'Rice Flakes', quantity: 100, unit: 'g', category: 'grains' },
            { name: 'Peanuts', quantity: 30, unit: 'g', category: 'proteins' },
            { name: 'Turmeric Powder', quantity: 2, unit: 'g', category: 'spices' },
            { name: 'Green Chilies', quantity: 2, unit: 'pc', category: 'produce' },
            { name: 'Oil', quantity: 15, unit: 'ml', category: 'pantry' },
        ],
    },
    // Northeast Indian
    northeast: {
        naga: [
            { name: 'Pork', quantity: 300, unit: 'g', category: 'proteins' },
            { name: 'Raja Mircha', quantity: 2, unit: 'pc', category: 'spices' },
            { name: 'Ginger', quantity: 15, unit: 'g', category: 'produce' },
            { name: 'Garlic', quantity: 10, unit: 'g', category: 'produce' },
            { name: 'Bamboo Shoot', quantity: 50, unit: 'g', category: 'produce' },
        ],
        assamese: [
            { name: 'Fish', quantity: 250, unit: 'g', category: 'proteins' },
            { name: 'Lemon', quantity: 1, unit: 'pc', category: 'produce' },
            { name: 'Turmeric Powder', quantity: 3, unit: 'g', category: 'spices' },
            { name: 'Green Chilies', quantity: 2, unit: 'pc', category: 'produce' },
            { name: 'Mustard Oil', quantity: 20, unit: 'ml', category: 'pantry' },
        ],
        momos: [
            { name: 'Maida', quantity: 150, unit: 'g', category: 'grains' },
            { name: 'Cabbage', quantity: 100, unit: 'g', category: 'produce' },
            { name: 'Ginger', quantity: 10, unit: 'g', category: 'produce' },
            { name: 'Garlic', quantity: 5, unit: 'g', category: 'produce' },
            { name: 'Green Chilies', quantity: 2, unit: 'pc', category: 'produce' },
        ],
    },
    // Generic
    generic: {
        rice: [
            { name: 'Rice', quantity: 200, unit: 'g', category: 'grains' },
            { name: 'Onions', quantity: 2, unit: 'pc', category: 'produce' },
            { name: 'Tomatoes', quantity: 2, unit: 'pc', category: 'produce' },
            { name: 'Green Chilies', quantity: 2, unit: 'pc', category: 'produce' },
            { name: 'Oil', quantity: 15, unit: 'ml', category: 'pantry' },
        ],
        curry: [
            { name: 'Onions', quantity: 2, unit: 'pc', category: 'produce' },
            { name: 'Tomatoes', quantity: 2, unit: 'pc', category: 'produce' },
            { name: 'Ginger Garlic Paste', quantity: 10, unit: 'g', category: 'produce' },
            { name: 'Turmeric Powder', quantity: 3, unit: 'g', category: 'spices' },
            { name: 'Red Chili Powder', quantity: 5, unit: 'g', category: 'spices' },
            { name: 'Oil', quantity: 20, unit: 'ml', category: 'pantry' },
        ],
        snack: [
            { name: 'Flour', quantity: 100, unit: 'g', category: 'grains' },
            { name: 'Oil', quantity: 100, unit: 'ml', category: 'pantry' },
            { name: 'Salt', quantity: 5, unit: 'g', category: 'spices' },
            { name: 'Spices', quantity: 5, unit: 'g', category: 'spices' },
        ],
        sweet: [
            { name: 'Sugar', quantity: 100, unit: 'g', category: 'pantry' },
            { name: 'Ghee', quantity: 30, unit: 'g', category: 'dairy' },
            { name: 'Flour', quantity: 100, unit: 'g', category: 'grains' },
            { name: 'Cardamom Powder', quantity: 2, unit: 'g', category: 'spices' },
        ],
        veg: [
            { name: 'Mixed Vegetables', quantity: 200, unit: 'g', category: 'produce' },
            { name: 'Onions', quantity: 1, unit: 'pc', category: 'produce' },
            { name: 'Tomatoes', quantity: 1, unit: 'pc', category: 'produce' },
            { name: 'Turmeric Powder', quantity: 3, unit: 'g', category: 'spices' },
            { name: 'Oil', quantity: 15, unit: 'ml', category: 'pantry' },
        ],
    },
};

function getIngredientsForDish(dish) {
    const id = dish.id;
    const name = dish.name.toLowerCase();
    
    // Try to match by keywords
    if (id.includes('rice') || name.includes('rice') || name.includes('bhat') || name.includes('pulao')) {
        return INGREDIENT_TEMPLATES.generic.rice;
    }
    if (name.includes('curry') || name.includes('korma') || name.includes('masala')) {
        return INGREDIENT_TEMPLATES.generic.curry;
    }
    if (name.includes('sweet') || name.includes('payasam') || name.includes('kheer') || name.includes('rasgulla') || name.includes('mishti') || name.includes('shrikhand') || name.includes('kulfi') || name.includes('falooda')) {
        return INGREDIENT_TEMPLATES.generic.sweet;
    }
    if (name.includes('momo') || name.includes('thukpa') || name.includes('noodle')) {
        return INGREDIENT_TEMPLATES.northeast.momos;
    }
    if (name.includes('fish') || name.includes('macher') || name.includes('ilish') || name.includes('kolim')) {
        return INGREDIENT_TEMPLATES.east.fish;
    }
    if (name.includes('pork') || name.includes('vawksa') || name.includes('smoked')) {
        return INGREDIENT_TEMPLATES.northeast.naga;
    }
    if (name.includes('tenga') || name.includes('masor') || name.includes('khar')) {
        return INGREDIENT_TEMPLATES.northeast.assamese;
    }
    if (name.includes('dosa') || name.includes('idli') || name.includes('uttapam') || name.includes('pongal')) {
        return INGREDIENT_TEMPLATES.south.breakfast;
    }
    if (name.includes('poha') || name.includes('chivda') || name.includes('sev')) {
        return INGREDIENT_TEMPLATES.central.snack;
    }
    if (name.includes('dhokla') || name.includes('khandvi') || name.includes('thepla') || name.includes('fafda')) {
        return INGREDIENT_TEMPLATES.west.gujarati;
    }
    if (name.includes('misal') || name.includes('pav') || name.includes('vada') || name.includes('pav')) {
        return INGREDIENT_TEMPLATES.west.maharashtrian;
    }
    if (name.includes('thali')) {
        return INGREDIENT_TEMPLATES.generic.rice.concat(INGREDIENT_TEMPLATES.generic.curry);
    }
    if (name.includes('chicken') || name.includes('murgh')) {
        return [{ name: 'Chicken', quantity: 300, unit: 'g', category: 'proteins' }].concat(INGREDIENT_TEMPLATES.generic.curry.slice(1));
    }
    if (name.includes('mutton') || name.includes('gosht') || name.includes('keema')) {
        return [{ name: 'Mutton', quantity: 300, unit: 'g', category: 'proteins' }].concat(INGREDIENT_TEMPLATES.generic.curry.slice(1));
    }
    if (name.includes('prawn') || name.includes('chingri') || name.includes('jheenga')) {
        return [{ name: 'Prawns', quantity: 250, unit: 'g', category: 'proteins' }].concat(INGREDIENT_TEMPLATES.east.fish.slice(1));
    }
    if (name.includes('paneer')) {
        return [{ name: 'Paneer', quantity: 200, unit: 'g', category: 'dairy' }].concat(INGREDIENT_TEMPLATES.generic.curry.slice(1));
    }
    if (name.includes('dal') || name.includes('amti') || name.includes('sambar')) {
        return [
            { name: 'Toor Dal', quantity: 100, unit: 'g', category: 'proteins' },
            { name: 'Turmeric Powder', quantity: 3, unit: 'g', category: 'spices' },
            { name: 'Cumin Seeds', quantity: 3, unit: 'g', category: 'spices' },
            { name: 'Mustard Seeds', quantity: 2, unit: 'g', category: 'spices' },
            { name: 'Green Chilies', quantity: 2, unit: 'pc', category: 'produce' },
        ];
    }
    if (name.includes('roti') || name.includes('paratha') || name.includes('bhakri') || name.includes('thepla')) {
        return [
            { name: 'Wheat Flour', quantity: 100, unit: 'g', category: 'grains' },
            { name: 'Oil', quantity: 10, unit: 'ml', category: 'pantry' },
            { name: 'Salt', quantity: 3, unit: 'g', category: 'spices' },
        ];
    }
    if (name.includes('biryani')) {
        return [
            { name: 'Basmati Rice', quantity: 250, unit: 'g', category: 'grains' },
            { name: 'Onions', quantity: 3, unit: 'pc', category: 'produce' },
            { name: 'Tomatoes', quantity: 2, unit: 'pc', category: 'produce' },
            { name: 'Yogurt', quantity: 50, unit: 'g', category: 'dairy' },
            { name: 'Biryani Masala', quantity: 10, unit: 'g', category: 'spices' },
            { name: 'Ghee', quantity: 30, unit: 'g', category: 'dairy' },
            { name: 'Saffron', quantity: 1, unit: 'g', category: 'spices' },
        ];
    }
    
    // Default fallback
    return INGREDIENT_TEMPLATES.generic.veg;
}

function formatIngEntry(id, ingredients) {
    const lines = ingredients.map(i => 
        `        { name: '${i.name}', quantity: ${i.quantity}, unit: '${i.unit}', category: '${i.category}' }`
    ).join(',\n');
    return `    '${id}': [\n${lines},\n    ]`;
}

// Find dishes without ING entries
const missingDishes = dishes.filter(d => !existingIng.has(d.id));

// Generate ING entries
const ingEntries = missingDishes.map(d => {
    const ingredients = getIngredientsForDish(d);
    return formatIngEntry(d.id, ingredients);
});

console.log(ingEntries.join(',\n') + ',');
