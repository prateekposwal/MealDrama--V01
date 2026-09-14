/**
 * GENERATED — do not edit by hand.
 * Source: scripts/genPantrySnapshot.ts (regenerate:
 *   WRITE_PANTRY_SNAPSHOT=1 npx vitest run tests/pantrySnapshot.generate.test.ts)
 * The server-owned ingredient catalog: per-dish + per-category ingredients from
 * the client engine, pre-computed so compiled server/dist never needs a client
 * .ts module at runtime. Parity + drift guard: tests/pantrySnapshot.generate.test.ts.
 */
export interface SnapshotIngredient {
  name: string;
  quantity: number;
  unit: string;
  category: string;
  inStock?: boolean;
}

export interface PantrySnapshot {
  version: number;
  generatedAt: string;
  dishCount: number;
  categoryCount: number;
  dishes: Record<string, SnapshotIngredient[]>;
  categories: Record<string, SnapshotIngredient[]>;
  categoryMeta: Record<string, { label: string; emoji: string }>;
}

export const PANTRY_SNAPSHOT: PantrySnapshot = {
  "version": 1,
  "generatedAt": "2026-09-14",
  "dishCount": 679,
  "categoryCount": 272,
  "dishes": {
    "aloo-paratha": [
      {
        "name": "Wheat Flour (Atta)",
        "quantity": 200,
        "unit": "g",
        "category": "grains"
      },
      {
        "name": "Potato",
        "quantity": 3,
        "unit": "pcs",
        "category": "produce"
      },
      {
        "name": "Onion",
        "quantity": 0.5,
        "unit": "pc",
        "category": "produce"
      },
      {
        "name": "Green Chilli",
        "quantity": 1,
        "unit": "pc",
        "category": "produce"
      },
      {
        "name": "Ginger",
        "quantity": 0.5,
        "unit": "inch",
        "category": "produce"
      },
      {
        "name": "Coriander Leaves",
        "quantity": 0.25,
        "unit": "cup",
        "category": "produce"
      },
      {
        "name": "Ajwain",
        "quantity": 0.5,
        "unit": "tsp",
        "category": "spices"
      },
      {
        "name": "Salt",
        "quantity": 1,
        "unit": "tsp",
        "category": "pantry"
      },
      {
        "name": "Ghee",
        "quantity": 1,
        "unit": "tbsp",
        "category": "dairy"
      },
      {
        "name": "Oil",
        "quantity": 1,
        "unit": "tbsp",
        "category": "pantry"
      }
    ],
    "kerala-egg-roast": [
      {
        "name": "Eggs",
        "quantity": 2,
        "unit": "pcs",
        "category": "proteins",
        "inStock": false
      },
      {
        "name": "White Bread",
        "quantity": 4,
        "unit": "pcs",
        "category": "breads",
        "inStock": false
      },
      {
        "name": "Milk",
        "quantity": 100,
        "unit": "ml",
        "category": "dairy",
        "inStock": false
      },
      {
        "name": "Sugar",
        "quantity": 2,
        "unit": "tbsp",
        "category": "pantry",
        "inStock": false
      },
      {
        "name": "Butter",
        "quantity": 20,
        "unit": "g",
        "category": "dairy",
        "inStock": false
      },
      {
        "name": "Ghee",
        "quantity": 2,
        "unit": "tbsp",
        "category": "pantry",
        "inStock": false
      },
      {
        "name": "Oil",
        "quantity": 2,
        "unit": "tbsp",
        "category": "pantry",
        "inStock": false
      },
      {
        "name": "Spices",
        "quantity": 1,
        "unit": "packet",
        "category": "spices",
        "inStock": false
      },
      {
        "name": "Onion",
        "quantity": 1,
        "unit": "pc",
        "category": "produce",
        "inStock": false
      },
      {
        "name": "Tomato",
        "quantity": 2,
        "unit": "pc",
        "category": "produce",
        "inStock": false
      },
      {
        "name": "Green Chilli",
        "quantity": 2,
        "unit": "pc",
        "category": "produce",
        "inStock": false
      },
      {
        "name": "Ginger-Garlic Paste",
        "quantity": 1,
        "unit": "tbsp",
        "category": "produce",
        "inStock": false
      },
      {
        "name": "Coriander Leaves",
        "quantity": 0.25,
        "unit": "cup",
        "category": "produce",
        "inStock": false
      },
      {
        "name": "Salt",
        "quantity": 1,
        "unit": "tsp",
        "category": "pantry"
      },
      {
        "name": "Turmeric",
        "quantity": 0.5,
        "unit": "tsp",
        "category": "spices"
      },
      {
        "name": "Coconut",
        "quantity": 0.5,
        "unit": "cup",
        "category": "produce"
      },
      {
        "name": "Curry Leaves",
        "quantity": 1,
        "unit": "sprig",
        "category": "produce"
      },
      {
        "name": "Mustard Seeds",
        "quantity": 1,
        "unit": "tsp",
        "category": "spices"
      },
      {
        "name": "Tamarind",
        "quantity": 1,
        "unit": "tbsp",
        "category": "pantry"
      },
      {
        "name": "Cumin Seeds",
        "quantity": 1,
        "unit": "tsp",
        "category": "spices"
      },
      {
        "name": "Red Chili Powder",
        "quantity": 0.5,
        "unit": "tsp",
        "category": "spices"
      }
    ],
    "instant-upma": [
      {
        "name": "Semolina (Rava)",
        "quantity": 1,
        "unit": "cup",
        "category": "grains"
      },
      {
        "name": "Onion",
        "quantity": 0.5,
        "unit": "pc",
        "category": "produce"
      },
      {
        "name": "Green Chilli",
        "quantity": 1,
        "unit": "pc",
        "category": "produce"
      },
      {
        "name": "Ginger",
        "quantity": 0.5,
        "unit": "inch",
        "category": "produce"
      },
      {
        "name": "Curry Leaves",
        "quantity": 3,
        "unit": "pcs",
        "category": "produce"
      },
      {
        "name": "Mustard Seeds",
        "quantity": 0.5,
        "unit": "tsp",
        "category": "spices"
      },
      {
        "name": "Salt",
        "quantity": 0.5,
        "unit": "tsp",
        "category": "pantry"
      },
      {
        "name": "Oil",
        "quantity": 2,
        "unit": "tbsp",
        "category": "pantry"
      }
    ],
    "idli": [
      {
        "name": "Idli Rice",
        "quantity": 1,
        "unit": "cup",
        "category": "grains"
      },
      {
        "name": "Urad Dal",
        "quantity": 0.25,
        "unit": "cup",
        "category": "proteins"
      },
      {
        "name": "Salt",
        "quantity": 0.5,
        "unit": "tsp",
        "category": "pantry"
      },
      {
        "name": "Oil",
        "quantity": 1,
        "unit": "tsp",
        "category": "pantry"
      }
    ],
    "dosa": [
      {
        "name": "Idli Rice",
        "quantity": 1,
        "unit": "cup",
        "category": "grains"
      },
      {
        "name": "Urad Dal",
        "quantity": 0.25,
        "unit": "cup",
        "category": "proteins"
      },
      {
        "name": "Salt",
        "quantity": 0.5,
        "unit": "tsp",
        "category": "pantry"
      },
      {
        "name": "Oil",
        "quantity": 2,
        "unit": "tbsp",
        "category": "pantry"
      }
    ],
    "sambhar-rice": [
      {
        "name": "Rice",
        "quantity": 1,
        "unit": "cup",
        "category": "grains"
      },
      {
        "name": "Toor Dal",
        "quantity": 0.5,
        "unit": "cup",
        "category": "proteins"
      },
      {
        "name": "Drumstick",
        "quantity": 1,
        "unit": "pc",
        "category": "produce"
      },
      {
        "name": "Tomato",
        "quantity": 1,
        "unit": "pc",
        "category": "produce"
      },
      {
        "name": "Onion",
        "quantity": 0.5,
        "unit": "pc",
        "category": "produce"
      },
      {
        "name": "Sambar Powder",
        "quantity": 1,
        "unit": "tbsp",
        "category": "spices"
      },
      {
        "name": "Mustard Seeds",
        "quantity": 0.5,
        "unit": "tsp",
        "category": "spices"
      },
      {
        "name": "Curry Leaves",
        "quantity": 5,
        "unit": "pcs",
        "category": "spices"
      },
      {
        "name": "Oil",
        "quantity": 1,
        "unit": "tbsp",
        "category": "pantry"
      },
      {
        "name": "Salt",
        "quantity": 1,
        "unit": "tsp",
        "category": "pantry"
      }
    ],
    "hyderabadi-biryani": [
      {
        "name": "Chicken",
        "quantity": 250,
        "unit": "g",
        "category": "proteins"
      },
      {
        "name": "Basmati Rice",
        "quantity": 1,
        "unit": "cup",
        "category": "grains"
      },
      {
        "name": "Onion",
        "quantity": 2,
        "unit": "pcs",
        "category": "produce"
      },
      {
        "name": "Yogurt",
        "quantity": 100,
        "unit": "g",
        "category": "dairy"
      },
      {
        "name": "Ginger-Garlic Paste",
        "quantity": 1,
        "unit": "tbsp",
        "category": "pantry"
      },
      {
        "name": "Biryani Masala",
        "quantity": 1,
        "unit": "tbsp",
        "category": "spices"
      },
      {
        "name": "Turmeric",
        "quantity": 0.5,
        "unit": "tsp",
        "category": "spices"
      },
      {
        "name": "Mint Leaves",
        "quantity": 0.25,
        "unit": "cup",
        "category": "produce"
      },
      {
        "name": "Saffron",
        "quantity": 0.25,
        "unit": "tsp",
        "category": "spices"
      },
      {
        "name": "Lemon",
        "quantity": 1,
        "unit": "pc",
        "category": "produce"
      },
      {
        "name": "Whole Spices",
        "quantity": 1,
        "unit": "tsp",
        "category": "spices"
      },
      {
        "name": "Salt",
        "quantity": 1,
        "unit": "tsp",
        "category": "pantry"
      },
      {
        "name": "Ghee",
        "quantity": 1,
        "unit": "tbsp",
        "category": "dairy"
      },
      {
        "name": "Oil",
        "quantity": 2,
        "unit": "tbsp",
        "category": "pantry"
      }
    ],
    "fish-curry-kerala": [
      {
        "name": "Fish",
        "quantity": 150,
        "unit": "g",
        "category": "proteins",
        "inStock": false
      },
      {
        "name": "Ghee",
        "quantity": 2,
        "unit": "tbsp",
        "category": "pantry",
        "inStock": false
      },
      {
        "name": "Oil",
        "quantity": 2,
        "unit": "tbsp",
        "category": "pantry",
        "inStock": false
      },
      {
        "name": "Spices",
        "quantity": 1,
        "unit": "packet",
        "category": "spices",
        "inStock": false
      },
      {
        "name": "Rice",
        "quantity": 1,
        "unit": "cup",
        "category": "grains",
        "inStock": false
      },
      {
        "name": "Onion",
        "quantity": 1,
        "unit": "pc",
        "category": "produce",
        "inStock": false
      },
      {
        "name": "Tomato",
        "quantity": 2,
        "unit": "pc",
        "category": "produce",
        "inStock": false
      },
      {
        "name": "Green Chilli",
        "quantity": 2,
        "unit": "pc",
        "category": "produce",
        "inStock": false
      },
      {
        "name": "Ginger-Garlic Paste",
        "quantity": 1,
        "unit": "tbsp",
        "category": "produce",
        "inStock": false
      },
      {
        "name": "Coriander Leaves",
        "quantity": 0.25,
        "unit": "cup",
        "category": "produce",
        "inStock": false
      },
      {
        "name": "Salt",
        "quantity": 1,
        "unit": "tsp",
        "category": "pantry"
      },
      {
        "name": "Turmeric",
        "quantity": 0.5,
        "unit": "tsp",
        "category": "spices"
      },
      {
        "name": "Coconut",
        "quantity": 0.5,
        "unit": "cup",
        "category": "produce"
      },
      {
        "name": "Curry Leaves",
        "quantity": 1,
        "unit": "sprig",
        "category": "produce"
      },
      {
        "name": "Mustard Seeds",
        "quantity": 1,
        "unit": "tsp",
        "category": "spices"
      },
      {
        "name": "Tamarind",
        "quantity": 1,
        "unit": "tbsp",
        "category": "pantry"
      },
      {
        "name": "Cumin Seeds",
        "quantity": 1,
        "unit": "tsp",
        "category": "spices"
      },
      {
        "name": "Red Chili Powder",
        "quantity": 0.5,
        "unit": "tsp",
        "category": "spices"
      }
    ],
    "medu-vada": [
      {
        "name": "Urad Dal",
        "quantity": 1,
        "unit": "cup",
        "category": "proteins"
      },
      {
        "name": "Curry Leaves",
        "quantity": 5,
        "unit": "pcs",
        "category": "produce"
      },
      {
        "name": "Green Chilli",
        "quantity": 1,
        "unit": "pc",
        "category": "produce"
      },
      {
        "name": "Ginger",
        "quantity": 0.5,
        "unit": "inch",
        "category": "produce"
      },
      {
        "name": "Black Pepper",
        "quantity": 0.5,
        "unit": "tsp",
        "category": "spices"
      },
      {
        "name": "Salt",
        "quantity": 0.5,
        "unit": "tsp",
        "category": "pantry"
      },
      {
        "name": "Oil",
        "quantity": 2,
        "unit": "tbsp",
        "category": "pantry"
      }
    ],
    "prawn-ghee-roast": [
      {
        "name": "Fish",
        "quantity": 150,
        "unit": "g",
        "category": "proteins",
        "inStock": false
      },
      {
        "name": "Prawns",
        "quantity": 200,
        "unit": "g",
        "category": "proteins",
        "inStock": false
      },
      {
        "name": "Ghee",
        "quantity": 2,
        "unit": "tbsp",
        "category": "pantry",
        "inStock": false
      },
      {
        "name": "Oil",
        "quantity": 2,
        "unit": "tbsp",
        "category": "pantry",
        "inStock": false
      },
      {
        "name": "Spices",
        "quantity": 1,
        "unit": "packet",
        "category": "spices",
        "inStock": false
      },
      {
        "name": "Salt",
        "quantity": 1,
        "unit": "tsp",
        "category": "pantry"
      },
      {
        "name": "Turmeric",
        "quantity": 0.5,
        "unit": "tsp",
        "category": "spices"
      },
      {
        "name": "Coconut",
        "quantity": 0.5,
        "unit": "cup",
        "category": "produce"
      },
      {
        "name": "Curry Leaves",
        "quantity": 1,
        "unit": "sprig",
        "category": "produce"
      },
      {
        "name": "Mustard Seeds",
        "quantity": 1,
        "unit": "tsp",
        "category": "spices"
      },
      {
        "name": "Tamarind",
        "quantity": 1,
        "unit": "tbsp",
        "category": "pantry"
      },
      {
        "name": "Cumin Seeds",
        "quantity": 1,
        "unit": "tsp",
        "category": "spices"
      },
      {
        "name": "Red Chili Powder",
        "quantity": 0.5,
        "unit": "tsp",
        "category": "spices"
      }
    ],
    "tofu-chettinad": [
      {
        "name": "Tofu",
        "quantity": 200,
        "unit": "g",
        "category": "proteins"
      },
      {
        "name": "Onion",
        "quantity": 1,
        "unit": "pc",
        "category": "produce"
      },
      {
        "name": "Tomato",
        "quantity": 2,
        "unit": "pc",
        "category": "produce"
      },
      {
        "name": "Ginger-Garlic Paste",
        "quantity": 1,
        "unit": "tbsp",
        "category": "pantry"
      },
      {
        "name": "Green Chilli",
        "quantity": 2,
        "unit": "pc",
        "category": "produce"
      },
      {
        "name": "Curry Leaves",
        "quantity": 2,
        "unit": "sprig",
        "category": "produce"
      },
      {
        "name": "Coconut",
        "quantity": 0.25,
        "unit": "cup",
        "category": "produce"
      },
      {
        "name": "Coriander Seeds",
        "quantity": 1,
        "unit": "tsp",
        "category": "spices"
      },
      {
        "name": "Fennel Seeds",
        "quantity": 0.5,
        "unit": "tsp",
        "category": "spices"
      },
      {
        "name": "Black Pepper",
        "quantity": 0.5,
        "unit": "tsp",
        "category": "spices"
      },
      {
        "name": "Turmeric",
        "quantity": 0.25,
        "unit": "tsp",
        "category": "spices"
      },
      {
        "name": "Salt",
        "quantity": 1,
        "unit": "tsp",
        "category": "pantry"
      },
      {
        "name": "Oil",
        "quantity": 1.5,
        "unit": "tbsp",
        "category": "pantry"
      }
    ],
    "andhra-prawn-masala": [
      {
        "name": "Fish",
        "quantity": 150,
        "unit": "g",
        "category": "proteins",
        "inStock": false
      },
      {
        "name": "Prawns",
        "quantity": 200,
        "unit": "g",
        "category": "proteins",
        "inStock": false
      },
      {
        "name": "Ghee",
        "quantity": 2,
        "unit": "tbsp",
        "category": "pantry",
        "inStock": false
      },
      {
        "name": "Oil",
        "quantity": 2,
        "unit": "tbsp",
        "category": "pantry",
        "inStock": false
      },
      {
        "name": "Spices",
        "quantity": 1,
        "unit": "packet",
        "category": "spices",
        "inStock": false
      },
      {
        "name": "Onion",
        "quantity": 1,
        "unit": "pc",
        "category": "produce",
        "inStock": false
      },
      {
        "name": "Tomato",
        "quantity": 2,
        "unit": "pc",
        "category": "produce",
        "inStock": false
      },
      {
        "name": "Green Chilli",
        "quantity": 2,
        "unit": "pc",
        "category": "produce",
        "inStock": false
      },
      {
        "name": "Ginger-Garlic Paste",
        "quantity": 1,
        "unit": "tbsp",
        "category": "produce",
        "inStock": false
      },
      {
        "name": "Coriander Leaves",
        "quantity": 0.25,
        "unit": "cup",
        "category": "produce",
        "inStock": false
      },
      {
        "name": "Salt",
        "quantity": 1,
        "unit": "tsp",
        "category": "pantry"
      },
      {
        "name": "Turmeric",
        "quantity": 0.5,
        "unit": "tsp",
        "category": "spices"
      },
      {
        "name": "Coconut",
        "quantity": 0.5,
        "unit": "cup",
        "category": "produce"
      },
      {
        "name": "Curry Leaves",
        "quantity": 1,
        "unit": "sprig",
        "category": "produce"
      },
      {
        "name": "Mustard Seeds",
        "quantity": 1,
        "unit": "tsp",
        "category": "spices"
      },
      {
        "name": "Tamarind",
        "quantity": 1,
        "unit": "tbsp",
        "category": "pantry"
      },
      {
        "name": "Cumin Seeds",
        "quantity": 1,
        "unit": "tsp",
        "category": "spices"
      },
      {
        "name": "Red Chili Powder",
        "quantity": 0.5,
        "unit": "tsp",
        "category": "spices"
      }
    ],
    "chicken-stew": [
      {
        "name": "Chicken",
        "quantity": 250,
        "unit": "g",
        "category": "proteins"
      },
      {
        "name": "Potato",
        "quantity": 2,
        "unit": "pc",
        "category": "produce"
      },
      {
        "name": "Carrot",
        "quantity": 1,
        "unit": "pc",
        "category": "produce"
      },
      {
        "name": "Onion",
        "quantity": 1,
        "unit": "pc",
        "category": "produce"
      },
      {
        "name": "Green Chilli",
        "quantity": 1,
        "unit": "pc",
        "category": "produce"
      },
      {
        "name": "Ginger",
        "quantity": 1,
        "unit": "inch",
        "category": "produce"
      },
      {
        "name": "Coconut Milk",
        "quantity": 1,
        "unit": "cup",
        "category": "pantry"
      },
      {
        "name": "Curry Leaves",
        "quantity": 1,
        "unit": "sprig",
        "category": "produce"
      },
      {
        "name": "Black Pepper",
        "quantity": 0.5,
        "unit": "tsp",
        "category": "spices"
      },
      {
        "name": "Salt",
        "quantity": 1,
        "unit": "tsp",
        "category": "pantry"
      },
      {
        "name": "Rice",
        "quantity": 1,
        "unit": "cup",
        "category": "grains"
      }
    ],
    "egg-curry-south": [
      {
        "name": "Eggs",
        "quantity": 2,
        "unit": "pcs",
        "category": "proteins",
        "inStock": false
      },
      {
        "name": "White Bread",
        "quantity": 4,
        "unit": "pcs",
        "category": "breads",
        "inStock": false
      },
      {
        "name": "Milk",
        "quantity": 100,
        "unit": "ml",
        "category": "dairy",
        "inStock": false
      },
      {
        "name": "Sugar",
        "quantity": 2,
        "unit": "tbsp",
        "category": "pantry",
        "inStock": false
      },
      {
        "name": "Butter",
        "quantity": 20,
        "unit": "g",
        "category": "dairy",
        "inStock": false
      },
      {
        "name": "Ghee",
        "quantity": 2,
        "unit": "tbsp",
        "category": "pantry",
        "inStock": false
      },
      {
        "name": "Oil",
        "quantity": 2,
        "unit": "tbsp",
        "category": "pantry",
        "inStock": false
      },
      {
        "name": "Spices",
        "quantity": 1,
        "unit": "packet",
        "category": "spices",
        "inStock": false
      },
      {
        "name": "Rice",
        "quantity": 1,
        "unit": "cup",
        "category": "grains",
        "inStock": false
      },
      {
        "name": "Onion",
        "quantity": 1,
        "unit": "pc",
        "category": "produce",
        "inStock": false
      },
      {
        "name": "Tomato",
        "quantity": 2,
        "unit": "pc",
        "category": "produce",
        "inStock": false
      },
      {
        "name": "Green Chilli",
        "quantity": 2,
        "unit": "pc",
        "category": "produce",
        "inStock": false
      },
      {
        "name": "Ginger-Garlic Paste",
        "quantity": 1,
        "unit": "tbsp",
        "category": "produce",
        "inStock": false
      },
      {
        "name": "Coriander Leaves",
        "quantity": 0.25,
        "unit": "cup",
        "category": "produce",
        "inStock": false
      },
      {
        "name": "Salt",
        "quantity": 1,
        "unit": "tsp",
        "category": "pantry"
      },
      {
        "name": "Turmeric",
        "quantity": 0.5,
        "unit": "tsp",
        "category": "spices"
      },
      {
        "name": "Coconut",
        "quantity": 0.5,
        "unit": "cup",
        "category": "produce"
      },
      {
        "name": "Curry Leaves",
        "quantity": 1,
        "unit": "sprig",
        "category": "produce"
      },
      {
        "name": "Mustard Seeds",
        "quantity": 1,
        "unit": "tsp",
        "category": "spices"
      },
      {
        "name": "Tamarind",
        "quantity": 1,
        "unit": "tbsp",
        "category": "pantry"
      },
      {
        "name": "Cumin Seeds",
        "quantity": 1,
        "unit": "tsp",
        "category": "spices"
      },
      {
        "name": "Red Chili Powder",
        "quantity": 0.5,
        "unit": "tsp",
        "category": "spices"
      }
    ],
    "chettinad-egg-masala": [
      {
        "name": "Eggs",
        "quantity": 2,
        "unit": "pcs",
        "category": "proteins",
        "inStock": false
      },
      {
        "name": "White Bread",
        "quantity": 4,
        "unit": "pcs",
        "category": "breads",
        "inStock": false
      },
      {
        "name": "Milk",
        "quantity": 100,
        "unit": "ml",
        "category": "dairy",
        "inStock": false
      },
      {
        "name": "Sugar",
        "quantity": 2,
        "unit": "tbsp",
        "category": "pantry",
        "inStock": false
      },
      {
        "name": "Butter",
        "quantity": 20,
        "unit": "g",
        "category": "dairy",
        "inStock": false
      },
      {
        "name": "Ghee",
        "quantity": 2,
        "unit": "tbsp",
        "category": "pantry",
        "inStock": false
      },
      {
        "name": "Oil",
        "quantity": 2,
        "unit": "tbsp",
        "category": "pantry",
        "inStock": false
      },
      {
        "name": "Spices",
        "quantity": 1,
        "unit": "packet",
        "category": "spices",
        "inStock": false
      },
      {
        "name": "Onion",
        "quantity": 1,
        "unit": "pc",
        "category": "produce",
        "inStock": false
      },
      {
        "name": "Tomato",
        "quantity": 2,
        "unit": "pc",
        "category": "produce",
        "inStock": false
      },
      {
        "name": "Green Chilli",
        "quantity": 2,
        "unit": "pc",
        "category": "produce",
        "inStock": false
      },
      {
        "name": "Ginger-Garlic Paste",
        "quantity": 1,
        "unit": "tbsp",
        "category": "produce",
        "inStock": false
      },
      {
        "name": "Coriander Leaves",
        "quantity": 0.25,
        "unit": "cup",
        "category": "produce",
        "inStock": false
      },
      {
        "name": "Salt",
        "quantity": 1,
        "unit": "tsp",
        "category": "pantry"
      },
      {
        "name": "Turmeric",
        "quantity": 0.5,
        "unit": "tsp",
        "category": "spices"
      },
      {
        "name": "Coconut",
        "quantity": 0.5,
        "unit": "cup",
        "category": "produce"
      },
      {
        "name": "Curry Leaves",
        "quantity": 1,
        "unit": "sprig",
        "category": "produce"
      },
      {
        "name": "Mustard Seeds",
        "quantity": 1,
        "unit": "tsp",
        "category": "spices"
      },
      {
        "name": "Tamarind",
        "quantity": 1,
        "unit": "tbsp",
        "category": "pantry"
      },
      {
        "name": "Cumin Seeds",
        "quantity": 1,
        "unit": "tsp",
        "category": "spices"
      },
      {
        "name": "Red Chili Powder",
        "quantity": 0.5,
        "unit": "tsp",
        "category": "spices"
      }
    ],
    "egg-appam": [
      {
        "name": "Egg",
        "quantity": 2,
        "unit": "pcs",
        "category": "proteins"
      },
      {
        "name": "Rice",
        "quantity": 1,
        "unit": "cup",
        "category": "grains"
      },
      {
        "name": "Coconut Milk",
        "quantity": 0.5,
        "unit": "cup",
        "category": "pantry"
      },
      {
        "name": "Onion",
        "quantity": 0.5,
        "unit": "pc",
        "category": "produce"
      },
      {
        "name": "Green Chilli",
        "quantity": 1,
        "unit": "pc",
        "category": "produce"
      },
      {
        "name": "Ginger",
        "quantity": 0.5,
        "unit": "inch",
        "category": "produce"
      },
      {
        "name": "Curry Leaves",
        "quantity": 1,
        "unit": "sprig",
        "category": "produce"
      },
      {
        "name": "Salt",
        "quantity": 1,
        "unit": "tsp",
        "category": "pantry"
      },
      {
        "name": "Oil",
        "quantity": 1,
        "unit": "tbsp",
        "category": "pantry"
      }
    ],
    "egg-podi-dosa": [
      {
        "name": "Eggs",
        "quantity": 2,
        "unit": "pcs",
        "category": "proteins",
        "inStock": false
      },
      {
        "name": "White Bread",
        "quantity": 4,
        "unit": "pcs",
        "category": "breads",
        "inStock": false
      },
      {
        "name": "Milk",
        "quantity": 100,
        "unit": "ml",
        "category": "dairy",
        "inStock": false
      },
      {
        "name": "Sugar",
        "quantity": 2,
        "unit": "tbsp",
        "category": "pantry",
        "inStock": false
      },
      {
        "name": "Butter",
        "quantity": 20,
        "unit": "g",
        "category": "dairy",
        "inStock": false
      },
      {
        "name": "Rice",
        "quantity": 1,
        "unit": "cup",
        "category": "grains",
        "inStock": false
      },
      {
        "name": "Urad Dal",
        "quantity": 50,
        "unit": "g",
        "category": "proteins",
        "inStock": false
      },
      {
        "name": "Ghee",
        "quantity": 2,
        "unit": "tbsp",
        "category": "pantry",
        "inStock": false
      },
      {
        "name": "Oil",
        "quantity": 2,
        "unit": "tbsp",
        "category": "pantry",
        "inStock": false
      },
      {
        "name": "Spices",
        "quantity": 1,
        "unit": "packet",
        "category": "spices",
        "inStock": false
      },
      {
        "name": "Salt",
        "quantity": 1,
        "unit": "tsp",
        "category": "pantry"
      },
      {
        "name": "Turmeric",
        "quantity": 0.5,
        "unit": "tsp",
        "category": "spices"
      },
      {
        "name": "Coconut",
        "quantity": 0.5,
        "unit": "cup",
        "category": "produce"
      },
      {
        "name": "Curry Leaves",
        "quantity": 1,
        "unit": "sprig",
        "category": "produce"
      },
      {
        "name": "Mustard Seeds",
        "quantity": 1,
        "unit": "tsp",
        "category": "spices"
      },
      {
        "name": "Tamarind",
        "quantity": 1,
        "unit": "tbsp",
        "category": "pantry"
      }
    ],
    "veggie-kofta-south": [
      {
        "name": "Besan",
        "quantity": 0.5,
        "unit": "cup",
        "category": "grains"
      },
      {
        "name": "Potato",
        "quantity": 1,
        "unit": "pc",
        "category": "produce"
      },
      {
        "name": "Mixed Vegetables",
        "quantity": 1,
        "unit": "cup",
        "category": "produce"
      },
      {
        "name": "Onion",
        "quantity": 1,
        "unit": "pc",
        "category": "produce"
      },
      {
        "name": "Tomato",
        "quantity": 2,
        "unit": "pcs",
        "category": "produce"
      },
      {
        "name": "Green Chilli",
        "quantity": 2,
        "unit": "pcs",
        "category": "produce"
      },
      {
        "name": "Ginger-Garlic Paste",
        "quantity": 1,
        "unit": "tbsp",
        "category": "pantry"
      },
      {
        "name": "Curry Leaves",
        "quantity": 1,
        "unit": "sprig",
        "category": "produce"
      },
      {
        "name": "Turmeric",
        "quantity": 0.5,
        "unit": "tsp",
        "category": "spices"
      },
      {
        "name": "Cumin Seeds",
        "quantity": 1,
        "unit": "tsp",
        "category": "spices"
      },
      {
        "name": "Red Chili Powder",
        "quantity": 0.5,
        "unit": "tsp",
        "category": "spices"
      },
      {
        "name": "Garam Masala",
        "quantity": 1,
        "unit": "tsp",
        "category": "spices"
      },
      {
        "name": "Coconut Milk",
        "quantity": 0.25,
        "unit": "cup",
        "category": "pantry"
      },
      {
        "name": "Salt",
        "quantity": 1,
        "unit": "tsp",
        "category": "pantry"
      },
      {
        "name": "Oil",
        "quantity": 2,
        "unit": "tbsp",
        "category": "pantry"
      },
      {
        "name": "Coriander Leaves",
        "quantity": 0.25,
        "unit": "cup",
        "category": "produce"
      },
      {
        "name": "Rice",
        "quantity": 1,
        "unit": "cup",
        "category": "grains"
      }
    ],
    "uttapam": [
      {
        "name": "Idli Rice",
        "quantity": 1,
        "unit": "cup",
        "category": "grains"
      },
      {
        "name": "Urad Dal",
        "quantity": 0.25,
        "unit": "cup",
        "category": "proteins"
      },
      {
        "name": "Onion",
        "quantity": 0.5,
        "unit": "pc",
        "category": "produce"
      },
      {
        "name": "Green Chilli",
        "quantity": 1,
        "unit": "pc",
        "category": "produce"
      },
      {
        "name": "Curry Leaves",
        "quantity": 3,
        "unit": "pcs",
        "category": "produce"
      },
      {
        "name": "Salt",
        "quantity": 0.5,
        "unit": "tsp",
        "category": "pantry"
      },
      {
        "name": "Oil",
        "quantity": 2,
        "unit": "tbsp",
        "category": "pantry"
      }
    ],
    "rava-idli": [
      {
        "name": "Semolina (Rava)",
        "quantity": 1,
        "unit": "cup",
        "category": "grains"
      },
      {
        "name": "Yogurt",
        "quantity": 0.25,
        "unit": "cup",
        "category": "dairy"
      },
      {
        "name": "Green Chilli",
        "quantity": 1,
        "unit": "pc",
        "category": "produce"
      },
      {
        "name": "Ginger",
        "quantity": 0.5,
        "unit": "inch",
        "category": "produce"
      },
      {
        "name": "Curry Leaves",
        "quantity": 3,
        "unit": "pcs",
        "category": "produce"
      },
      {
        "name": "Mustard Seeds",
        "quantity": 0.5,
        "unit": "tsp",
        "category": "spices"
      },
      {
        "name": "Salt",
        "quantity": 0.5,
        "unit": "tsp",
        "category": "pantry"
      },
      {
        "name": "Oil",
        "quantity": 1,
        "unit": "tbsp",
        "category": "pantry"
      }
    ],
    "lemon-rice": [
      {
        "name": "Rice",
        "quantity": 1,
        "unit": "cup",
        "category": "grains",
        "inStock": false
      },
      {
        "name": "Ghee",
        "quantity": 2,
        "unit": "tbsp",
        "category": "pantry",
        "inStock": false
      },
      {
        "name": "Oil",
        "quantity": 2,
        "unit": "tbsp",
        "category": "pantry",
        "inStock": false
      },
      {
        "name": "Spices",
        "quantity": 1,
        "unit": "packet",
        "category": "spices",
        "inStock": false
      },
      {
        "name": "Salt",
        "quantity": 1,
        "unit": "tsp",
        "category": "pantry"
      },
      {
        "name": "Turmeric",
        "quantity": 0.5,
        "unit": "tsp",
        "category": "spices"
      },
      {
        "name": "Coconut",
        "quantity": 0.5,
        "unit": "cup",
        "category": "produce"
      },
      {
        "name": "Curry Leaves",
        "quantity": 1,
        "unit": "sprig",
        "category": "produce"
      },
      {
        "name": "Mustard Seeds",
        "quantity": 1,
        "unit": "tsp",
        "category": "spices"
      },
      {
        "name": "Tamarind",
        "quantity": 1,
        "unit": "tbsp",
        "category": "pantry"
      },
      {
        "name": "Whole Spices",
        "quantity": 1,
        "unit": "tsp",
        "category": "spices"
      }
    ],
    "curd-rice": [
      {
        "name": "Rice",
        "quantity": 1,
        "unit": "cup",
        "category": "grains"
      },
      {
        "name": "Curd",
        "quantity": 1,
        "unit": "cup",
        "category": "dairy"
      },
      {
        "name": "Milk",
        "quantity": 0.25,
        "unit": "cup",
        "category": "dairy"
      },
      {
        "name": "Green Chilli",
        "quantity": 1,
        "unit": "pc",
        "category": "produce"
      },
      {
        "name": "Ginger",
        "quantity": 0.5,
        "unit": "inch",
        "category": "produce"
      },
      {
        "name": "Curry Leaves",
        "quantity": 1,
        "unit": "sprig",
        "category": "produce"
      },
      {
        "name": "Mustard Seeds",
        "quantity": 0.25,
        "unit": "tsp",
        "category": "spices"
      },
      {
        "name": "Salt",
        "quantity": 0.5,
        "unit": "tsp",
        "category": "pantry"
      },
      {
        "name": "Oil",
        "quantity": 0.5,
        "unit": "tbsp",
        "category": "pantry"
      }
    ],
    "bisi-bele-bath": [
      {
        "name": "Rice",
        "quantity": 100,
        "unit": "g",
        "category": "grains",
        "inStock": false
      },
      {
        "name": "Toor Dal",
        "quantity": 50,
        "unit": "g",
        "category": "proteins",
        "inStock": false
      },
      {
        "name": "Mixed Vegetables",
        "quantity": 100,
        "unit": "g",
        "category": "produce",
        "inStock": false
      },
      {
        "name": "Ghee",
        "quantity": 2,
        "unit": "tbsp",
        "category": "pantry",
        "inStock": false
      },
      {
        "name": "Oil",
        "quantity": 2,
        "unit": "tbsp",
        "category": "pantry",
        "inStock": false
      },
      {
        "name": "Spices",
        "quantity": 1,
        "unit": "packet",
        "category": "spices",
        "inStock": false
      },
      {
        "name": "Salt",
        "quantity": 1,
        "unit": "tsp",
        "category": "pantry"
      },
      {
        "name": "Turmeric",
        "quantity": 0.5,
        "unit": "tsp",
        "category": "spices"
      },
      {
        "name": "Coconut",
        "quantity": 0.5,
        "unit": "cup",
        "category": "produce"
      },
      {
        "name": "Curry Leaves",
        "quantity": 1,
        "unit": "sprig",
        "category": "produce"
      },
      {
        "name": "Mustard Seeds",
        "quantity": 1,
        "unit": "tsp",
        "category": "spices"
      },
      {
        "name": "Tamarind",
        "quantity": 1,
        "unit": "tbsp",
        "category": "pantry"
      },
      {
        "name": "Cumin Seeds",
        "quantity": 1,
        "unit": "tsp",
        "category": "spices"
      }
    ],
    "kesari-bath": [
      {
        "name": "Semolina (Rava)",
        "quantity": 1,
        "unit": "cup",
        "category": "grains"
      },
      {
        "name": "Sugar",
        "quantity": 0.75,
        "unit": "cup",
        "category": "pantry"
      },
      {
        "name": "Ghee",
        "quantity": 0.25,
        "unit": "cup",
        "category": "dairy"
      },
      {
        "name": "Cardamom",
        "quantity": 1,
        "unit": "tsp",
        "category": "spices"
      },
      {
        "name": "Saffron",
        "quantity": 1,
        "unit": "pinch",
        "category": "spices"
      },
      {
        "name": "Cashews",
        "quantity": 2,
        "unit": "tbsp",
        "category": "pantry"
      },
      {
        "name": "Raisins",
        "quantity": 2,
        "unit": "tbsp",
        "category": "pantry"
      }
    ],
    "rava-dosa": [
      {
        "name": "Semolina (Rava)",
        "quantity": 1,
        "unit": "cup",
        "category": "grains"
      },
      {
        "name": "Rice Flour",
        "quantity": 0.5,
        "unit": "cup",
        "category": "grains"
      },
      {
        "name": "Maida",
        "quantity": 0.25,
        "unit": "cup",
        "category": "grains"
      },
      {
        "name": "Yogurt",
        "quantity": 0.25,
        "unit": "cup",
        "category": "dairy"
      },
      {
        "name": "Green Chilli",
        "quantity": 1,
        "unit": "pc",
        "category": "produce"
      },
      {
        "name": "Ginger",
        "quantity": 0.5,
        "unit": "inch",
        "category": "produce"
      },
      {
        "name": "Curry Leaves",
        "quantity": 3,
        "unit": "pcs",
        "category": "produce"
      },
      {
        "name": "Mustard Seeds",
        "quantity": 0.5,
        "unit": "tsp",
        "category": "spices"
      },
      {
        "name": "Salt",
        "quantity": 0.5,
        "unit": "tsp",
        "category": "pantry"
      },
      {
        "name": "Oil",
        "quantity": 2,
        "unit": "tbsp",
        "category": "pantry"
      }
    ],
    "set-dosa": [
      {
        "name": "Idli Rice",
        "quantity": 1,
        "unit": "cup",
        "category": "grains"
      },
      {
        "name": "Urad Dal",
        "quantity": 0.25,
        "unit": "cup",
        "category": "proteins"
      },
      {
        "name": "Salt",
        "quantity": 0.5,
        "unit": "tsp",
        "category": "pantry"
      },
      {
        "name": "Oil",
        "quantity": 2,
        "unit": "tbsp",
        "category": "pantry"
      }
    ],
    "pesarattu": [
      {
        "name": "Moong Dal",
        "quantity": 100,
        "unit": "g",
        "category": "proteins",
        "inStock": false
      },
      {
        "name": "Rice",
        "quantity": 30,
        "unit": "g",
        "category": "grains",
        "inStock": false
      },
      {
        "name": "Ginger",
        "quantity": 10,
        "unit": "g",
        "category": "produce",
        "inStock": false
      },
      {
        "name": "Green Chilli",
        "quantity": 2,
        "unit": "pc",
        "category": "produce",
        "inStock": false
      },
      {
        "name": "Ghee",
        "quantity": 2,
        "unit": "tbsp",
        "category": "pantry",
        "inStock": false
      },
      {
        "name": "Oil",
        "quantity": 2,
        "unit": "tbsp",
        "category": "pantry",
        "inStock": false
      },
      {
        "name": "Spices",
        "quantity": 1,
        "unit": "packet",
        "category": "spices",
        "inStock": false
      },
      {
        "name": "Salt",
        "quantity": 1,
        "unit": "tsp",
        "category": "pantry"
      },
      {
        "name": "Turmeric",
        "quantity": 0.5,
        "unit": "tsp",
        "category": "spices"
      },
      {
        "name": "Coconut",
        "quantity": 0.5,
        "unit": "cup",
        "category": "produce"
      },
      {
        "name": "Curry Leaves",
        "quantity": 1,
        "unit": "sprig",
        "category": "produce"
      },
      {
        "name": "Mustard Seeds",
        "quantity": 1,
        "unit": "tsp",
        "category": "spices"
      },
      {
        "name": "Tamarind",
        "quantity": 1,
        "unit": "tbsp",
        "category": "pantry"
      },
      {
        "name": "Cumin Seeds",
        "quantity": 1,
        "unit": "tsp",
        "category": "spices"
      }
    ],
    "rava-upma": [
      {
        "name": "Semolina (Rava)",
        "quantity": 1,
        "unit": "cup",
        "category": "grains"
      },
      {
        "name": "Onion",
        "quantity": 0.5,
        "unit": "pc",
        "category": "produce"
      },
      {
        "name": "Green Chilli",
        "quantity": 1,
        "unit": "pc",
        "category": "produce"
      },
      {
        "name": "Ginger",
        "quantity": 0.5,
        "unit": "inch",
        "category": "produce"
      },
      {
        "name": "Curry Leaves",
        "quantity": 3,
        "unit": "pcs",
        "category": "produce"
      },
      {
        "name": "Mustard Seeds",
        "quantity": 0.5,
        "unit": "tsp",
        "category": "spices"
      },
      {
        "name": "Salt",
        "quantity": 0.5,
        "unit": "tsp",
        "category": "pantry"
      },
      {
        "name": "Oil",
        "quantity": 2,
        "unit": "tbsp",
        "category": "pantry"
      }
    ],
    "vegetable-upma": [
      {
        "name": "Semolina (Rava)",
        "quantity": 1,
        "unit": "cup",
        "category": "grains"
      },
      {
        "name": "Onion",
        "quantity": 0.5,
        "unit": "pc",
        "category": "produce"
      },
      {
        "name": "Carrot",
        "quantity": 0.5,
        "unit": "pc",
        "category": "produce"
      },
      {
        "name": "Green Peas",
        "quantity": 0.25,
        "unit": "cup",
        "category": "produce"
      },
      {
        "name": "Green Chilli",
        "quantity": 1,
        "unit": "pc",
        "category": "produce"
      },
      {
        "name": "Curry Leaves",
        "quantity": 3,
        "unit": "pcs",
        "category": "produce"
      },
      {
        "name": "Mustard Seeds",
        "quantity": 0.5,
        "unit": "tsp",
        "category": "spices"
      },
      {
        "name": "Salt",
        "quantity": 0.5,
        "unit": "tsp",
        "category": "pantry"
      },
      {
        "name": "Oil",
        "quantity": 2,
        "unit": "tbsp",
        "category": "pantry"
      },
      {
        "name": "Mixed Vegetables",
        "quantity": 1,
        "unit": "cup",
        "category": "produce",
        "inStock": false
      }
    ],
    "tamarind-rice": [
      {
        "name": "Rice",
        "quantity": 1,
        "unit": "cup",
        "category": "grains",
        "inStock": false
      },
      {
        "name": "Ghee",
        "quantity": 2,
        "unit": "tbsp",
        "category": "pantry",
        "inStock": false
      },
      {
        "name": "Oil",
        "quantity": 2,
        "unit": "tbsp",
        "category": "pantry",
        "inStock": false
      },
      {
        "name": "Spices",
        "quantity": 1,
        "unit": "packet",
        "category": "spices",
        "inStock": false
      },
      {
        "name": "Salt",
        "quantity": 1,
        "unit": "tsp",
        "category": "pantry"
      },
      {
        "name": "Turmeric",
        "quantity": 0.5,
        "unit": "tsp",
        "category": "spices"
      },
      {
        "name": "Coconut",
        "quantity": 0.5,
        "unit": "cup",
        "category": "produce"
      },
      {
        "name": "Curry Leaves",
        "quantity": 1,
        "unit": "sprig",
        "category": "produce"
      },
      {
        "name": "Mustard Seeds",
        "quantity": 1,
        "unit": "tsp",
        "category": "spices"
      },
      {
        "name": "Tamarind",
        "quantity": 1,
        "unit": "tbsp",
        "category": "pantry"
      },
      {
        "name": "Whole Spices",
        "quantity": 1,
        "unit": "tsp",
        "category": "spices"
      }
    ],
    "coconut-rice": [
      {
        "name": "Rice",
        "quantity": 1,
        "unit": "cup",
        "category": "grains",
        "inStock": false
      },
      {
        "name": "Ghee",
        "quantity": 2,
        "unit": "tbsp",
        "category": "pantry",
        "inStock": false
      },
      {
        "name": "Oil",
        "quantity": 2,
        "unit": "tbsp",
        "category": "pantry",
        "inStock": false
      },
      {
        "name": "Spices",
        "quantity": 1,
        "unit": "packet",
        "category": "spices",
        "inStock": false
      },
      {
        "name": "Salt",
        "quantity": 1,
        "unit": "tsp",
        "category": "pantry"
      },
      {
        "name": "Turmeric",
        "quantity": 0.5,
        "unit": "tsp",
        "category": "spices"
      },
      {
        "name": "Coconut",
        "quantity": 0.5,
        "unit": "cup",
        "category": "produce"
      },
      {
        "name": "Curry Leaves",
        "quantity": 1,
        "unit": "sprig",
        "category": "produce"
      },
      {
        "name": "Mustard Seeds",
        "quantity": 1,
        "unit": "tsp",
        "category": "spices"
      },
      {
        "name": "Tamarind",
        "quantity": 1,
        "unit": "tbsp",
        "category": "pantry"
      },
      {
        "name": "Whole Spices",
        "quantity": 1,
        "unit": "tsp",
        "category": "spices"
      }
    ],
    "tomato-rice": [
      {
        "name": "Rice",
        "quantity": 1,
        "unit": "cup",
        "category": "grains"
      },
      {
        "name": "Tomato",
        "quantity": 3,
        "unit": "pc",
        "category": "produce"
      },
      {
        "name": "Onion",
        "quantity": 1,
        "unit": "pc",
        "category": "produce"
      },
      {
        "name": "Green Chilli",
        "quantity": 1,
        "unit": "pc",
        "category": "produce"
      },
      {
        "name": "Ginger",
        "quantity": 1,
        "unit": "inch",
        "category": "produce"
      },
      {
        "name": "Garlic",
        "quantity": 4,
        "unit": "cloves",
        "category": "produce"
      },
      {
        "name": "Mustard Seeds",
        "quantity": 0.5,
        "unit": "tsp",
        "category": "spices"
      },
      {
        "name": "Curry Leaves",
        "quantity": 1,
        "unit": "sprig",
        "category": "produce"
      },
      {
        "name": "Turmeric",
        "quantity": 0.5,
        "unit": "tsp",
        "category": "spices"
      },
      {
        "name": "Salt",
        "quantity": 1,
        "unit": "tsp",
        "category": "pantry"
      },
      {
        "name": "Oil",
        "quantity": 1,
        "unit": "tbsp",
        "category": "pantry"
      },
      {
        "name": "Coriander Leaves",
        "quantity": 0.25,
        "unit": "cup",
        "category": "produce"
      }
    ],
    "andhra-chicken-curry": [
      {
        "name": "Chicken",
        "quantity": 200,
        "unit": "g",
        "category": "proteins",
        "inStock": false
      },
      {
        "name": "Ghee",
        "quantity": 2,
        "unit": "tbsp",
        "category": "pantry",
        "inStock": false
      },
      {
        "name": "Oil",
        "quantity": 2,
        "unit": "tbsp",
        "category": "pantry",
        "inStock": false
      },
      {
        "name": "Spices",
        "quantity": 1,
        "unit": "packet",
        "category": "spices",
        "inStock": false
      },
      {
        "name": "Rice",
        "quantity": 1,
        "unit": "cup",
        "category": "grains",
        "inStock": false
      },
      {
        "name": "Onion",
        "quantity": 1,
        "unit": "pc",
        "category": "produce",
        "inStock": false
      },
      {
        "name": "Tomato",
        "quantity": 2,
        "unit": "pc",
        "category": "produce",
        "inStock": false
      },
      {
        "name": "Green Chilli",
        "quantity": 2,
        "unit": "pc",
        "category": "produce",
        "inStock": false
      },
      {
        "name": "Ginger-Garlic Paste",
        "quantity": 1,
        "unit": "tbsp",
        "category": "produce",
        "inStock": false
      },
      {
        "name": "Coriander Leaves",
        "quantity": 0.25,
        "unit": "cup",
        "category": "produce",
        "inStock": false
      },
      {
        "name": "Salt",
        "quantity": 1,
        "unit": "tsp",
        "category": "pantry"
      },
      {
        "name": "Turmeric",
        "quantity": 0.5,
        "unit": "tsp",
        "category": "spices"
      },
      {
        "name": "Coconut",
        "quantity": 0.5,
        "unit": "cup",
        "category": "produce"
      },
      {
        "name": "Curry Leaves",
        "quantity": 1,
        "unit": "sprig",
        "category": "produce"
      },
      {
        "name": "Mustard Seeds",
        "quantity": 1,
        "unit": "tsp",
        "category": "spices"
      },
      {
        "name": "Tamarind",
        "quantity": 1,
        "unit": "tbsp",
        "category": "pantry"
      },
      {
        "name": "Cumin Seeds",
        "quantity": 1,
        "unit": "tsp",
        "category": "spices"
      },
      {
        "name": "Red Chili Powder",
        "quantity": 0.5,
        "unit": "tsp",
        "category": "spices"
      }
    ],
    "kerala-fish-curry": [
      {
        "name": "Fish",
        "quantity": 150,
        "unit": "g",
        "category": "proteins",
        "inStock": false
      },
      {
        "name": "Ghee",
        "quantity": 2,
        "unit": "tbsp",
        "category": "pantry",
        "inStock": false
      },
      {
        "name": "Oil",
        "quantity": 2,
        "unit": "tbsp",
        "category": "pantry",
        "inStock": false
      },
      {
        "name": "Spices",
        "quantity": 1,
        "unit": "packet",
        "category": "spices",
        "inStock": false
      },
      {
        "name": "Rice",
        "quantity": 1,
        "unit": "cup",
        "category": "grains",
        "inStock": false
      },
      {
        "name": "Onion",
        "quantity": 1,
        "unit": "pc",
        "category": "produce",
        "inStock": false
      },
      {
        "name": "Tomato",
        "quantity": 2,
        "unit": "pc",
        "category": "produce",
        "inStock": false
      },
      {
        "name": "Green Chilli",
        "quantity": 2,
        "unit": "pc",
        "category": "produce",
        "inStock": false
      },
      {
        "name": "Ginger-Garlic Paste",
        "quantity": 1,
        "unit": "tbsp",
        "category": "produce",
        "inStock": false
      },
      {
        "name": "Coriander Leaves",
        "quantity": 0.25,
        "unit": "cup",
        "category": "produce",
        "inStock": false
      },
      {
        "name": "Salt",
        "quantity": 1,
        "unit": "tsp",
        "category": "pantry"
      },
      {
        "name": "Turmeric",
        "quantity": 0.5,
        "unit": "tsp",
        "category": "spices"
      },
      {
        "name": "Coconut",
        "quantity": 0.5,
        "unit": "cup",
        "category": "produce"
      },
      {
        "name": "Curry Leaves",
        "quantity": 1,
        "unit": "sprig",
        "category": "produce"
      },
      {
        "name": "Mustard Seeds",
        "quantity": 1,
        "unit": "tsp",
        "category": "spices"
      },
      {
        "name": "Tamarind",
        "quantity": 1,
        "unit": "tbsp",
        "category": "pantry"
      },
      {
        "name": "Cumin Seeds",
        "quantity": 1,
        "unit": "tsp",
        "category": "spices"
      },
      {
        "name": "Red Chili Powder",
        "quantity": 0.5,
        "unit": "tsp",
        "category": "spices"
      }
    ],
    "chettinad-chicken": [
      {
        "name": "Chicken",
        "quantity": 200,
        "unit": "g",
        "category": "proteins",
        "inStock": false
      },
      {
        "name": "Ghee",
        "quantity": 2,
        "unit": "tbsp",
        "category": "pantry",
        "inStock": false
      },
      {
        "name": "Oil",
        "quantity": 2,
        "unit": "tbsp",
        "category": "pantry",
        "inStock": false
      },
      {
        "name": "Spices",
        "quantity": 1,
        "unit": "packet",
        "category": "spices",
        "inStock": false
      },
      {
        "name": "Salt",
        "quantity": 1,
        "unit": "tsp",
        "category": "pantry"
      },
      {
        "name": "Turmeric",
        "quantity": 0.5,
        "unit": "tsp",
        "category": "spices"
      },
      {
        "name": "Coconut",
        "quantity": 0.5,
        "unit": "cup",
        "category": "produce"
      },
      {
        "name": "Curry Leaves",
        "quantity": 1,
        "unit": "sprig",
        "category": "produce"
      },
      {
        "name": "Mustard Seeds",
        "quantity": 1,
        "unit": "tsp",
        "category": "spices"
      },
      {
        "name": "Tamarind",
        "quantity": 1,
        "unit": "tbsp",
        "category": "pantry"
      }
    ],
    "avial": [
      {
        "name": "Mixed Vegetables",
        "quantity": 200,
        "unit": "g",
        "category": "produce",
        "inStock": false
      },
      {
        "name": "Coconut",
        "quantity": 50,
        "unit": "g",
        "category": "produce",
        "inStock": false
      },
      {
        "name": "Yogurt",
        "quantity": 100,
        "unit": "g",
        "category": "dairy",
        "inStock": false
      },
      {
        "name": "Ghee",
        "quantity": 2,
        "unit": "tbsp",
        "category": "pantry",
        "inStock": false
      },
      {
        "name": "Oil",
        "quantity": 2,
        "unit": "tbsp",
        "category": "pantry",
        "inStock": false
      },
      {
        "name": "Spices",
        "quantity": 1,
        "unit": "packet",
        "category": "spices",
        "inStock": false
      }
    ],
    "thoran": [
      {
        "name": "Cabbage",
        "quantity": 200,
        "unit": "g",
        "category": "produce",
        "inStock": false
      },
      {
        "name": "Coconut",
        "quantity": 30,
        "unit": "g",
        "category": "produce",
        "inStock": false
      },
      {
        "name": "Ghee",
        "quantity": 2,
        "unit": "tbsp",
        "category": "pantry",
        "inStock": false
      },
      {
        "name": "Oil",
        "quantity": 2,
        "unit": "tbsp",
        "category": "pantry",
        "inStock": false
      },
      {
        "name": "Spices",
        "quantity": 1,
        "unit": "packet",
        "category": "spices",
        "inStock": false
      }
    ],
    "olan": [
      {
        "name": "Pumpkin",
        "quantity": 200,
        "unit": "g",
        "category": "produce",
        "inStock": false
      },
      {
        "name": "Coconut Milk",
        "quantity": 100,
        "unit": "ml",
        "category": "pantry",
        "inStock": false
      },
      {
        "name": "Ghee",
        "quantity": 2,
        "unit": "tbsp",
        "category": "pantry",
        "inStock": false
      },
      {
        "name": "Oil",
        "quantity": 2,
        "unit": "tbsp",
        "category": "pantry",
        "inStock": false
      },
      {
        "name": "Spices",
        "quantity": 1,
        "unit": "packet",
        "category": "spices",
        "inStock": false
      }
    ],
    "payasam": [
      {
        "name": "Semolina (Rava)",
        "quantity": 1,
        "unit": "cup",
        "category": "grains"
      },
      {
        "name": "Milk",
        "quantity": 2,
        "unit": "cup",
        "category": "dairy"
      },
      {
        "name": "Sugar",
        "quantity": 0.25,
        "unit": "cup",
        "category": "pantry"
      },
      {
        "name": "Cardamom",
        "quantity": 2,
        "unit": "pods",
        "category": "spices"
      },
      {
        "name": "Ghee",
        "quantity": 2,
        "unit": "tbsp",
        "category": "dairy"
      },
      {
        "name": "Cashews",
        "quantity": 2,
        "unit": "tbsp",
        "category": "pantry"
      },
      {
        "name": "Raisins",
        "quantity": 2,
        "unit": "tbsp",
        "category": "pantry"
      }
    ],
    "rava-kesari": [
      {
        "name": "Semolina (Rava)",
        "quantity": 1,
        "unit": "cup",
        "category": "grains"
      },
      {
        "name": "Sugar",
        "quantity": 0.75,
        "unit": "cup",
        "category": "pantry"
      },
      {
        "name": "Ghee",
        "quantity": 0.25,
        "unit": "cup",
        "category": "dairy"
      },
      {
        "name": "Cardamom",
        "quantity": 1,
        "unit": "tsp",
        "category": "spices"
      },
      {
        "name": "Saffron",
        "quantity": 1,
        "unit": "pinch",
        "category": "spices"
      },
      {
        "name": "Cashews",
        "quantity": 2,
        "unit": "tbsp",
        "category": "pantry"
      },
      {
        "name": "Raisins",
        "quantity": 2,
        "unit": "tbsp",
        "category": "pantry"
      }
    ],
    "appe": [
      {
        "name": "Idli Rice",
        "quantity": 1,
        "unit": "cup",
        "category": "grains"
      },
      {
        "name": "Urad Dal",
        "quantity": 0.25,
        "unit": "cup",
        "category": "proteins"
      },
      {
        "name": "Onion",
        "quantity": 0.5,
        "unit": "pc",
        "category": "produce"
      },
      {
        "name": "Carrot",
        "quantity": 0.25,
        "unit": "pc",
        "category": "produce"
      },
      {
        "name": "Green Chilli",
        "quantity": 1,
        "unit": "pc",
        "category": "produce"
      },
      {
        "name": "Curry Leaves",
        "quantity": 3,
        "unit": "pcs",
        "category": "produce"
      },
      {
        "name": "Mustard Seeds",
        "quantity": 0.5,
        "unit": "tsp",
        "category": "spices"
      },
      {
        "name": "Salt",
        "quantity": 0.5,
        "unit": "tsp",
        "category": "pantry"
      },
      {
        "name": "Oil",
        "quantity": 2,
        "unit": "tbsp",
        "category": "pantry"
      }
    ],
    "jigarthanda": [
      {
        "name": "Milk",
        "quantity": 200,
        "unit": "ml",
        "category": "dairy"
      },
      {
        "name": "Almond Gum",
        "quantity": 10,
        "unit": "g",
        "category": "pantry"
      },
      {
        "name": "Nannari Syrup",
        "quantity": 15,
        "unit": "ml",
        "category": "pantry"
      },
      {
        "name": "Vanilla Ice Cream",
        "quantity": 1,
        "unit": "scoop",
        "category": "dairy"
      },
      {
        "name": "Sugar",
        "quantity": 10,
        "unit": "g",
        "category": "pantry"
      }
    ],
    "neer-mor": [
      {
        "name": "Curd",
        "quantity": 200,
        "unit": "ml",
        "category": "dairy"
      },
      {
        "name": "Water",
        "quantity": 100,
        "unit": "ml",
        "category": "pantry"
      },
      {
        "name": "Ginger",
        "quantity": 5,
        "unit": "g",
        "category": "produce"
      },
      {
        "name": "Green Chili",
        "quantity": 1,
        "unit": "pc",
        "category": "produce"
      },
      {
        "name": "Curry Leaves",
        "quantity": 5,
        "unit": "pieces",
        "category": "produce"
      },
      {
        "name": "Mustard Seeds",
        "quantity": 2,
        "unit": "g",
        "category": "spices"
      },
      {
        "name": "Fresh Mint Leaves",
        "quantity": 5,
        "unit": "g",
        "category": "produce"
      },
      {
        "name": "Salt",
        "quantity": 2,
        "unit": "g",
        "category": "pantry"
      }
    ],
    "sambharam": [
      {
        "name": "Curd",
        "quantity": 200,
        "unit": "ml",
        "category": "dairy"
      },
      {
        "name": "Water",
        "quantity": 100,
        "unit": "ml",
        "category": "pantry"
      },
      {
        "name": "Ginger",
        "quantity": 5,
        "unit": "g",
        "category": "produce"
      },
      {
        "name": "Green Chili",
        "quantity": 1,
        "unit": "pc",
        "category": "produce"
      },
      {
        "name": "Shallots",
        "quantity": 2,
        "unit": "pieces",
        "category": "produce"
      },
      {
        "name": "Curry Leaves",
        "quantity": 5,
        "unit": "pieces",
        "category": "produce"
      },
      {
        "name": "Salt",
        "quantity": 2,
        "unit": "g",
        "category": "pantry"
      }
    ],
    "kallu": [
      {
        "name": "Coconut Sap",
        "quantity": 250,
        "unit": "ml",
        "category": "pantry"
      },
      {
        "name": "Ice Cubes",
        "quantity": 4,
        "unit": "pcs",
        "category": "pantry"
      },
      {
        "name": "Lemon",
        "quantity": 1,
        "unit": "pc",
        "category": "produce"
      }
    ],
    "panaka": [
      {
        "name": "Jaggery",
        "quantity": 30,
        "unit": "g",
        "category": "pantry"
      },
      {
        "name": "Lemon",
        "quantity": 1,
        "unit": "pc",
        "category": "produce"
      },
      {
        "name": "Cardamom",
        "quantity": 2,
        "unit": "pieces",
        "category": "spices"
      },
      {
        "name": "Black Pepper Powder",
        "quantity": 1,
        "unit": "g",
        "category": "spices"
      },
      {
        "name": "Water",
        "quantity": 300,
        "unit": "ml",
        "category": "pantry"
      }
    ],
    "banana-ragi-smoothie": [
      {
        "name": "Ragi Flour",
        "quantity": 30,
        "unit": "g",
        "category": "grains"
      },
      {
        "name": "Banana",
        "quantity": 1,
        "unit": "pc",
        "category": "produce"
      },
      {
        "name": "Jaggery",
        "quantity": 15,
        "unit": "g",
        "category": "pantry"
      },
      {
        "name": "Coconut Milk",
        "quantity": 200,
        "unit": "ml",
        "category": "pantry"
      },
      {
        "name": "Cardamom",
        "quantity": 2,
        "unit": "pieces",
        "category": "spices"
      }
    ],
    "kulukki-sarbath": [
      {
        "name": "Lemon",
        "quantity": 1,
        "unit": "pc",
        "category": "produce"
      },
      {
        "name": "Soda Water",
        "quantity": 200,
        "unit": "ml",
        "category": "pantry"
      },
      {
        "name": "Black Salt",
        "quantity": 2,
        "unit": "g",
        "category": "pantry"
      },
      {
        "name": "Roasted Cumin Powder",
        "quantity": 1,
        "unit": "g",
        "category": "spices"
      },
      {
        "name": "Mint Leaves",
        "quantity": 5,
        "unit": "pieces",
        "category": "produce"
      }
    ],
    "tender-coconut-shake": [
      {
        "name": "Tender Coconut Water",
        "quantity": 200,
        "unit": "ml",
        "category": "pantry"
      },
      {
        "name": "Coconut Malai",
        "quantity": 50,
        "unit": "g",
        "category": "produce"
      },
      {
        "name": "Coconut Milk",
        "quantity": 100,
        "unit": "ml",
        "category": "pantry"
      },
      {
        "name": "Sugar",
        "quantity": 10,
        "unit": "g",
        "category": "pantry"
      }
    ],
    "puttu-kadala": [
      {
        "name": "Chickpeas",
        "quantity": 1,
        "unit": "cup",
        "category": "grains",
        "inStock": false
      },
      {
        "name": "Chana Dal",
        "quantity": 80,
        "unit": "g",
        "category": "proteins",
        "inStock": false
      },
      {
        "name": "Rice Flour",
        "quantity": 1,
        "unit": "cup",
        "category": "grains",
        "inStock": false
      },
      {
        "name": "Coconut",
        "quantity": 0.5,
        "unit": "cup",
        "category": "produce",
        "inStock": false
      },
      {
        "name": "Ghee",
        "quantity": 2,
        "unit": "tbsp",
        "category": "pantry",
        "inStock": false
      },
      {
        "name": "Oil",
        "quantity": 2,
        "unit": "tbsp",
        "category": "pantry",
        "inStock": false
      },
      {
        "name": "Spices",
        "quantity": 1,
        "unit": "packet",
        "category": "spices",
        "inStock": false
      },
      {
        "name": "Toor Dal",
        "quantity": 1,
        "unit": "cup",
        "category": "grains",
        "inStock": false
      },
      {
        "name": "Salt",
        "quantity": 1,
        "unit": "tsp",
        "category": "pantry"
      },
      {
        "name": "Turmeric",
        "quantity": 0.5,
        "unit": "tsp",
        "category": "spices"
      },
      {
        "name": "Curry Leaves",
        "quantity": 1,
        "unit": "sprig",
        "category": "produce"
      },
      {
        "name": "Mustard Seeds",
        "quantity": 1,
        "unit": "tsp",
        "category": "spices"
      },
      {
        "name": "Tamarind",
        "quantity": 1,
        "unit": "tbsp",
        "category": "pantry"
      },
      {
        "name": "Cumin Seeds",
        "quantity": 1,
        "unit": "tsp",
        "category": "spices"
      },
      {
        "name": "Red Chili Powder",
        "quantity": 0.5,
        "unit": "tsp",
        "category": "spices"
      },
      {
        "name": "Cumin Seeds",
        "quantity": 1,
        "unit": "tsp",
        "category": "spices"
      }
    ],
    "appam": [
      {
        "name": "Rice",
        "quantity": 1,
        "unit": "cup",
        "category": "grains"
      },
      {
        "name": "Coconut Milk",
        "quantity": 1,
        "unit": "cup",
        "category": "pantry"
      },
      {
        "name": "Yeast",
        "quantity": 1,
        "unit": "tsp",
        "category": "pantry"
      },
      {
        "name": "Sugar",
        "quantity": 1,
        "unit": "tsp",
        "category": "pantry"
      },
      {
        "name": "Salt",
        "quantity": 0.5,
        "unit": "tsp",
        "category": "pantry"
      }
    ],
    "nad-an-k-varuthathu": [
      {
        "name": "Ghee",
        "quantity": 2,
        "unit": "tbsp",
        "category": "pantry",
        "inStock": false
      },
      {
        "name": "Oil",
        "quantity": 2,
        "unit": "tbsp",
        "category": "pantry",
        "inStock": false
      },
      {
        "name": "Spices",
        "quantity": 1,
        "unit": "packet",
        "category": "spices",
        "inStock": false
      },
      {
        "name": "Chicken",
        "quantity": 200,
        "unit": "g",
        "category": "proteins",
        "inStock": false
      },
      {
        "name": "Onion",
        "quantity": 1,
        "unit": "pc",
        "category": "produce",
        "inStock": false
      },
      {
        "name": "Tomato",
        "quantity": 2,
        "unit": "pc",
        "category": "produce",
        "inStock": false
      },
      {
        "name": "Green Chilli",
        "quantity": 2,
        "unit": "pc",
        "category": "produce",
        "inStock": false
      },
      {
        "name": "Ginger-Garlic Paste",
        "quantity": 1,
        "unit": "tbsp",
        "category": "produce",
        "inStock": false
      },
      {
        "name": "Coriander Leaves",
        "quantity": 0.25,
        "unit": "cup",
        "category": "produce",
        "inStock": false
      },
      {
        "name": "Salt",
        "quantity": 1,
        "unit": "tsp",
        "category": "pantry"
      },
      {
        "name": "Turmeric",
        "quantity": 0.5,
        "unit": "tsp",
        "category": "spices"
      },
      {
        "name": "Coconut",
        "quantity": 0.5,
        "unit": "cup",
        "category": "produce"
      },
      {
        "name": "Curry Leaves",
        "quantity": 1,
        "unit": "sprig",
        "category": "produce"
      },
      {
        "name": "Mustard Seeds",
        "quantity": 1,
        "unit": "tsp",
        "category": "spices"
      },
      {
        "name": "Tamarind",
        "quantity": 1,
        "unit": "tbsp",
        "category": "pantry"
      }
    ],
    "kerala-prawn-curry": [
      {
        "name": "Fish",
        "quantity": 150,
        "unit": "g",
        "category": "proteins",
        "inStock": false
      },
      {
        "name": "Prawns",
        "quantity": 200,
        "unit": "g",
        "category": "proteins",
        "inStock": false
      },
      {
        "name": "Ghee",
        "quantity": 2,
        "unit": "tbsp",
        "category": "pantry",
        "inStock": false
      },
      {
        "name": "Oil",
        "quantity": 2,
        "unit": "tbsp",
        "category": "pantry",
        "inStock": false
      },
      {
        "name": "Spices",
        "quantity": 1,
        "unit": "packet",
        "category": "spices",
        "inStock": false
      },
      {
        "name": "Rice",
        "quantity": 1,
        "unit": "cup",
        "category": "grains",
        "inStock": false
      },
      {
        "name": "Onion",
        "quantity": 1,
        "unit": "pc",
        "category": "produce",
        "inStock": false
      },
      {
        "name": "Tomato",
        "quantity": 2,
        "unit": "pc",
        "category": "produce",
        "inStock": false
      },
      {
        "name": "Green Chilli",
        "quantity": 2,
        "unit": "pc",
        "category": "produce",
        "inStock": false
      },
      {
        "name": "Ginger-Garlic Paste",
        "quantity": 1,
        "unit": "tbsp",
        "category": "produce",
        "inStock": false
      },
      {
        "name": "Coriander Leaves",
        "quantity": 0.25,
        "unit": "cup",
        "category": "produce",
        "inStock": false
      },
      {
        "name": "Salt",
        "quantity": 1,
        "unit": "tsp",
        "category": "pantry"
      },
      {
        "name": "Turmeric",
        "quantity": 0.5,
        "unit": "tsp",
        "category": "spices"
      },
      {
        "name": "Coconut",
        "quantity": 0.5,
        "unit": "cup",
        "category": "produce"
      },
      {
        "name": "Curry Leaves",
        "quantity": 1,
        "unit": "sprig",
        "category": "produce"
      },
      {
        "name": "Mustard Seeds",
        "quantity": 1,
        "unit": "tsp",
        "category": "spices"
      },
      {
        "name": "Tamarind",
        "quantity": 1,
        "unit": "tbsp",
        "category": "pantry"
      },
      {
        "name": "Cumin Seeds",
        "quantity": 1,
        "unit": "tsp",
        "category": "spices"
      },
      {
        "name": "Red Chili Powder",
        "quantity": 0.5,
        "unit": "tsp",
        "category": "spices"
      }
    ],
    "naadan-beef-fry": [
      {
        "name": "Beef",
        "quantity": 200,
        "unit": "g",
        "category": "proteins",
        "inStock": false
      },
      {
        "name": "Ghee",
        "quantity": 2,
        "unit": "tbsp",
        "category": "pantry",
        "inStock": false
      },
      {
        "name": "Oil",
        "quantity": 2,
        "unit": "tbsp",
        "category": "pantry",
        "inStock": false
      },
      {
        "name": "Spices",
        "quantity": 1,
        "unit": "packet",
        "category": "spices",
        "inStock": false
      },
      {
        "name": "Onion",
        "quantity": 1,
        "unit": "pc",
        "category": "produce",
        "inStock": false
      },
      {
        "name": "Tomato",
        "quantity": 2,
        "unit": "pc",
        "category": "produce",
        "inStock": false
      },
      {
        "name": "Green Chilli",
        "quantity": 2,
        "unit": "pc",
        "category": "produce",
        "inStock": false
      },
      {
        "name": "Ginger-Garlic Paste",
        "quantity": 1,
        "unit": "tbsp",
        "category": "produce",
        "inStock": false
      },
      {
        "name": "Coriander Leaves",
        "quantity": 0.25,
        "unit": "cup",
        "category": "produce",
        "inStock": false
      }
    ],
    "malabar-parota": [
      {
        "name": "Wheat Flour (Atta)",
        "quantity": 250,
        "unit": "g",
        "category": "grains"
      },
      {
        "name": "Water",
        "quantity": 0.75,
        "unit": "cup",
        "category": "pantry"
      },
      {
        "name": "Salt",
        "quantity": 0.5,
        "unit": "tsp",
        "category": "pantry"
      },
      {
        "name": "Oil",
        "quantity": 2,
        "unit": "tbsp",
        "category": "pantry"
      },
      {
        "name": "Ghee",
        "quantity": 1,
        "unit": "tbsp",
        "category": "dairy"
      }
    ],
    "kerala-fish-molee": [
      {
        "name": "Fish",
        "quantity": 150,
        "unit": "g",
        "category": "proteins",
        "inStock": false
      },
      {
        "name": "Ghee",
        "quantity": 2,
        "unit": "tbsp",
        "category": "pantry",
        "inStock": false
      },
      {
        "name": "Oil",
        "quantity": 2,
        "unit": "tbsp",
        "category": "pantry",
        "inStock": false
      },
      {
        "name": "Spices",
        "quantity": 1,
        "unit": "packet",
        "category": "spices",
        "inStock": false
      },
      {
        "name": "Onion",
        "quantity": 1,
        "unit": "pc",
        "category": "produce",
        "inStock": false
      },
      {
        "name": "Tomato",
        "quantity": 2,
        "unit": "pc",
        "category": "produce",
        "inStock": false
      },
      {
        "name": "Green Chilli",
        "quantity": 2,
        "unit": "pc",
        "category": "produce",
        "inStock": false
      },
      {
        "name": "Ginger-Garlic Paste",
        "quantity": 1,
        "unit": "tbsp",
        "category": "produce",
        "inStock": false
      },
      {
        "name": "Coriander Leaves",
        "quantity": 0.25,
        "unit": "cup",
        "category": "produce",
        "inStock": false
      },
      {
        "name": "Salt",
        "quantity": 1,
        "unit": "tsp",
        "category": "pantry"
      },
      {
        "name": "Turmeric",
        "quantity": 0.5,
        "unit": "tsp",
        "category": "spices"
      },
      {
        "name": "Coconut",
        "quantity": 0.5,
        "unit": "cup",
        "category": "produce"
      },
      {
        "name": "Curry Leaves",
        "quantity": 1,
        "unit": "sprig",
        "category": "produce"
      },
      {
        "name": "Mustard Seeds",
        "quantity": 1,
        "unit": "tsp",
        "category": "spices"
      },
      {
        "name": "Tamarind",
        "quantity": 1,
        "unit": "tbsp",
        "category": "pantry"
      },
      {
        "name": "Cumin Seeds",
        "quantity": 1,
        "unit": "tsp",
        "category": "spices"
      },
      {
        "name": "Red Chili Powder",
        "quantity": 0.5,
        "unit": "tsp",
        "category": "spices"
      }
    ],
    "pazham-pori": [
      {
        "name": "Banana",
        "quantity": 4,
        "unit": "pc",
        "category": "produce",
        "inStock": false
      },
      {
        "name": "Maida",
        "quantity": 100,
        "unit": "g",
        "category": "grains",
        "inStock": false
      },
      {
        "name": "Sugar",
        "quantity": 30,
        "unit": "g",
        "category": "pantry",
        "inStock": false
      },
      {
        "name": "Oil",
        "quantity": 30,
        "unit": "ml",
        "category": "pantry",
        "inStock": false
      },
      {
        "name": "Milk",
        "quantity": 1,
        "unit": "cup",
        "category": "dairy"
      },
      {
        "name": "Tea Leaves",
        "quantity": 1,
        "unit": "tsp",
        "category": "pantry"
      }
    ],
    "palada-payasam": [
      {
        "name": "Rice Ada (Palada)",
        "quantity": 100,
        "unit": "g",
        "category": "grains"
      },
      {
        "name": "Milk",
        "quantity": 2,
        "unit": "cup",
        "category": "dairy"
      },
      {
        "name": "Sugar",
        "quantity": 0.25,
        "unit": "cup",
        "category": "pantry"
      },
      {
        "name": "Cardamom",
        "quantity": 2,
        "unit": "pods",
        "category": "spices"
      },
      {
        "name": "Ghee",
        "quantity": 2,
        "unit": "tbsp",
        "category": "dairy"
      },
      {
        "name": "Cashews",
        "quantity": 2,
        "unit": "tbsp",
        "category": "pantry"
      },
      {
        "name": "Raisins",
        "quantity": 2,
        "unit": "tbsp",
        "category": "pantry"
      }
    ],
    "sadhya": [
      {
        "name": "Rice",
        "quantity": 100,
        "unit": "g",
        "category": "grains",
        "inStock": false
      },
      {
        "name": "Banana",
        "quantity": 1,
        "unit": "pc",
        "category": "produce",
        "inStock": false
      },
      {
        "name": "Coconut",
        "quantity": 30,
        "unit": "g",
        "category": "produce",
        "inStock": false
      },
      {
        "name": "Papad",
        "quantity": 2,
        "unit": "pc",
        "category": "pantry",
        "inStock": false
      },
      {
        "name": "Curry Leaves",
        "quantity": 1,
        "unit": "sprig",
        "category": "produce",
        "inStock": false
      },
      {
        "name": "Ghee",
        "quantity": 2,
        "unit": "tbsp",
        "category": "pantry",
        "inStock": false
      },
      {
        "name": "Oil",
        "quantity": 2,
        "unit": "tbsp",
        "category": "pantry",
        "inStock": false
      },
      {
        "name": "Spices",
        "quantity": 1,
        "unit": "packet",
        "category": "spices",
        "inStock": false
      }
    ],
    "erissery": [
      {
        "name": "Pumpkin",
        "quantity": 200,
        "unit": "g",
        "category": "produce"
      },
      {
        "name": "Toor Dal",
        "quantity": 50,
        "unit": "g",
        "category": "proteins"
      },
      {
        "name": "Coconut",
        "quantity": 50,
        "unit": "g",
        "category": "produce"
      },
      {
        "name": "Cumin Seeds",
        "quantity": 1,
        "unit": "tsp",
        "category": "spices"
      },
      {
        "name": "Green Chilli",
        "quantity": 2,
        "unit": "pc",
        "category": "produce"
      },
      {
        "name": "Turmeric",
        "quantity": 0.5,
        "unit": "tsp",
        "category": "spices"
      },
      {
        "name": "Curry Leaves",
        "quantity": 3,
        "unit": "pcs",
        "category": "produce"
      },
      {
        "name": "Mustard Seeds",
        "quantity": 0.5,
        "unit": "tsp",
        "category": "spices"
      },
      {
        "name": "Salt",
        "quantity": 1,
        "unit": "tsp",
        "category": "pantry"
      },
      {
        "name": "Oil",
        "quantity": 1,
        "unit": "tbsp",
        "category": "pantry"
      },
      {
        "name": "Rice",
        "quantity": 1,
        "unit": "cup",
        "category": "grains"
      }
    ],
    "thalassery-biryani": [
      {
        "name": "Rice",
        "quantity": 1,
        "unit": "cup",
        "category": "grains"
      },
      {
        "name": "Chicken",
        "quantity": 250,
        "unit": "g",
        "category": "proteins"
      },
      {
        "name": "Onion",
        "quantity": 2,
        "unit": "pcs",
        "category": "produce"
      },
      {
        "name": "Yogurt",
        "quantity": 100,
        "unit": "g",
        "category": "dairy"
      },
      {
        "name": "Ginger-Garlic Paste",
        "quantity": 1,
        "unit": "tbsp",
        "category": "pantry"
      },
      {
        "name": "Biryani Masala",
        "quantity": 1,
        "unit": "tbsp",
        "category": "spices"
      },
      {
        "name": "Fennel Seeds",
        "quantity": 1,
        "unit": "tsp",
        "category": "spices"
      },
      {
        "name": "Star Anise",
        "quantity": 1,
        "unit": "pc",
        "category": "spices"
      },
      {
        "name": "Turmeric",
        "quantity": 0.5,
        "unit": "tsp",
        "category": "spices"
      },
      {
        "name": "Salt",
        "quantity": 1,
        "unit": "tsp",
        "category": "pantry"
      },
      {
        "name": "Coconut",
        "quantity": 0.5,
        "unit": "cup",
        "category": "produce"
      },
      {
        "name": "Mint Leaves",
        "quantity": 0.25,
        "unit": "cup",
        "category": "produce"
      },
      {
        "name": "Ghee",
        "quantity": 1,
        "unit": "tbsp",
        "category": "dairy"
      },
      {
        "name": "Oil",
        "quantity": 2,
        "unit": "tbsp",
        "category": "pantry"
      }
    ],
    "naadan-kozhi-curry": [
      {
        "name": "Chicken",
        "quantity": 200,
        "unit": "g",
        "category": "proteins",
        "inStock": false
      },
      {
        "name": "Ghee",
        "quantity": 2,
        "unit": "tbsp",
        "category": "pantry",
        "inStock": false
      },
      {
        "name": "Oil",
        "quantity": 2,
        "unit": "tbsp",
        "category": "pantry",
        "inStock": false
      },
      {
        "name": "Spices",
        "quantity": 1,
        "unit": "packet",
        "category": "spices",
        "inStock": false
      },
      {
        "name": "Rice",
        "quantity": 1,
        "unit": "cup",
        "category": "grains",
        "inStock": false
      },
      {
        "name": "Onion",
        "quantity": 1,
        "unit": "pc",
        "category": "produce",
        "inStock": false
      },
      {
        "name": "Tomato",
        "quantity": 2,
        "unit": "pc",
        "category": "produce",
        "inStock": false
      },
      {
        "name": "Green Chilli",
        "quantity": 2,
        "unit": "pc",
        "category": "produce",
        "inStock": false
      },
      {
        "name": "Ginger-Garlic Paste",
        "quantity": 1,
        "unit": "tbsp",
        "category": "produce",
        "inStock": false
      },
      {
        "name": "Coriander Leaves",
        "quantity": 0.25,
        "unit": "cup",
        "category": "produce",
        "inStock": false
      },
      {
        "name": "Salt",
        "quantity": 1,
        "unit": "tsp",
        "category": "pantry"
      },
      {
        "name": "Turmeric",
        "quantity": 0.5,
        "unit": "tsp",
        "category": "spices"
      },
      {
        "name": "Coconut",
        "quantity": 0.5,
        "unit": "cup",
        "category": "produce"
      },
      {
        "name": "Curry Leaves",
        "quantity": 1,
        "unit": "sprig",
        "category": "produce"
      },
      {
        "name": "Mustard Seeds",
        "quantity": 1,
        "unit": "tsp",
        "category": "spices"
      },
      {
        "name": "Tamarind",
        "quantity": 1,
        "unit": "tbsp",
        "category": "pantry"
      },
      {
        "name": "Cumin Seeds",
        "quantity": 1,
        "unit": "tsp",
        "category": "spices"
      },
      {
        "name": "Red Chili Powder",
        "quantity": 0.5,
        "unit": "tsp",
        "category": "spices"
      }
    ],
    "erachi-varutharacha": [
      {
        "name": "Mutton",
        "quantity": 250,
        "unit": "g",
        "category": "proteins"
      },
      {
        "name": "Onion",
        "quantity": 1,
        "unit": "pc",
        "category": "produce"
      },
      {
        "name": "Tomato",
        "quantity": 2,
        "unit": "pcs",
        "category": "produce"
      },
      {
        "name": "Ginger-Garlic Paste",
        "quantity": 1,
        "unit": "tbsp",
        "category": "pantry"
      },
      {
        "name": "Coconut",
        "quantity": 0.5,
        "unit": "cup",
        "category": "produce"
      },
      {
        "name": "Coriander Seeds",
        "quantity": 1,
        "unit": "tsp",
        "category": "spices"
      },
      {
        "name": "Black Pepper",
        "quantity": 0.5,
        "unit": "tsp",
        "category": "spices"
      },
      {
        "name": "Cinnamon",
        "quantity": 1,
        "unit": "stick",
        "category": "spices"
      },
      {
        "name": "Cardamom",
        "quantity": 2,
        "unit": "pods",
        "category": "spices"
      },
      {
        "name": "Cloves",
        "quantity": 2,
        "unit": "pcs",
        "category": "spices"
      },
      {
        "name": "Red Chili Powder",
        "quantity": 0.5,
        "unit": "tsp",
        "category": "spices"
      },
      {
        "name": "Turmeric",
        "quantity": 0.5,
        "unit": "tsp",
        "category": "spices"
      },
      {
        "name": "Salt",
        "quantity": 1,
        "unit": "tsp",
        "category": "pantry"
      }
    ],
    "ada-pradhaman": [
      {
        "name": "Rice",
        "quantity": 50,
        "unit": "g",
        "category": "grains",
        "inStock": false
      },
      {
        "name": "Coconut Milk",
        "quantity": 200,
        "unit": "ml",
        "category": "pantry",
        "inStock": false
      },
      {
        "name": "Jaggery",
        "quantity": 50,
        "unit": "g",
        "category": "pantry",
        "inStock": false
      },
      {
        "name": "Cardamom",
        "quantity": 1,
        "unit": "pinch",
        "category": "spices",
        "inStock": false
      },
      {
        "name": "Sugar",
        "quantity": 0.5,
        "unit": "cup",
        "category": "pantry"
      },
      {
        "name": "Raisins",
        "quantity": 2,
        "unit": "tbsp",
        "category": "pantry"
      },
      {
        "name": "Almonds",
        "quantity": 2,
        "unit": "tbsp",
        "category": "pantry"
      },
      {
        "name": "Pistachios",
        "quantity": 1,
        "unit": "tbsp",
        "category": "pantry"
      },
      {
        "name": "Milk",
        "quantity": 1,
        "unit": "cup",
        "category": "dairy"
      }
    ],
    "chatti-pathiri": [
      {
        "name": "Rice Flour",
        "quantity": 150,
        "unit": "g",
        "category": "grains",
        "inStock": false
      },
      {
        "name": "Ghee",
        "quantity": 2,
        "unit": "tbsp",
        "category": "pantry",
        "inStock": false
      },
      {
        "name": "Oil",
        "quantity": 2,
        "unit": "tbsp",
        "category": "pantry",
        "inStock": false
      },
      {
        "name": "Spices",
        "quantity": 1,
        "unit": "packet",
        "category": "spices",
        "inStock": false
      },
      {
        "name": "Sugar",
        "quantity": 0.5,
        "unit": "cup",
        "category": "pantry"
      },
      {
        "name": "Cardamom",
        "quantity": 2,
        "unit": "pods",
        "category": "spices"
      },
      {
        "name": "Raisins",
        "quantity": 2,
        "unit": "tbsp",
        "category": "pantry"
      },
      {
        "name": "Almonds",
        "quantity": 2,
        "unit": "tbsp",
        "category": "pantry"
      },
      {
        "name": "Pistachios",
        "quantity": 1,
        "unit": "tbsp",
        "category": "pantry"
      }
    ],
    "kappa-meen-curry": [
      {
        "name": "Fish",
        "quantity": 150,
        "unit": "g",
        "category": "proteins",
        "inStock": false
      },
      {
        "name": "Ghee",
        "quantity": 2,
        "unit": "tbsp",
        "category": "pantry",
        "inStock": false
      },
      {
        "name": "Oil",
        "quantity": 2,
        "unit": "tbsp",
        "category": "pantry",
        "inStock": false
      },
      {
        "name": "Spices",
        "quantity": 1,
        "unit": "packet",
        "category": "spices",
        "inStock": false
      },
      {
        "name": "Rice",
        "quantity": 1,
        "unit": "cup",
        "category": "grains",
        "inStock": false
      },
      {
        "name": "Onion",
        "quantity": 1,
        "unit": "pc",
        "category": "produce",
        "inStock": false
      },
      {
        "name": "Tomato",
        "quantity": 2,
        "unit": "pc",
        "category": "produce",
        "inStock": false
      },
      {
        "name": "Green Chilli",
        "quantity": 2,
        "unit": "pc",
        "category": "produce",
        "inStock": false
      },
      {
        "name": "Ginger-Garlic Paste",
        "quantity": 1,
        "unit": "tbsp",
        "category": "produce",
        "inStock": false
      },
      {
        "name": "Coriander Leaves",
        "quantity": 0.25,
        "unit": "cup",
        "category": "produce",
        "inStock": false
      },
      {
        "name": "Salt",
        "quantity": 1,
        "unit": "tsp",
        "category": "pantry"
      },
      {
        "name": "Turmeric",
        "quantity": 0.5,
        "unit": "tsp",
        "category": "spices"
      },
      {
        "name": "Coconut",
        "quantity": 0.5,
        "unit": "cup",
        "category": "produce"
      },
      {
        "name": "Curry Leaves",
        "quantity": 1,
        "unit": "sprig",
        "category": "produce"
      },
      {
        "name": "Mustard Seeds",
        "quantity": 1,
        "unit": "tsp",
        "category": "spices"
      },
      {
        "name": "Tamarind",
        "quantity": 1,
        "unit": "tbsp",
        "category": "pantry"
      },
      {
        "name": "Cumin Seeds",
        "quantity": 1,
        "unit": "tsp",
        "category": "spices"
      },
      {
        "name": "Red Chili Powder",
        "quantity": 0.5,
        "unit": "tsp",
        "category": "spices"
      }
    ],
    "mussel-stir-fry": [
      {
        "name": "Mussels",
        "quantity": 250,
        "unit": "g",
        "category": "proteins"
      },
      {
        "name": "Onion",
        "quantity": 1,
        "unit": "pc",
        "category": "produce"
      },
      {
        "name": "Tomato",
        "quantity": 1,
        "unit": "pc",
        "category": "produce"
      },
      {
        "name": "Green Chilli",
        "quantity": 2,
        "unit": "pcs",
        "category": "produce"
      },
      {
        "name": "Ginger",
        "quantity": 1,
        "unit": "inch",
        "category": "produce"
      },
      {
        "name": "Garlic",
        "quantity": 3,
        "unit": "pcs",
        "category": "produce"
      },
      {
        "name": "Coconut",
        "quantity": 0.5,
        "unit": "cup",
        "category": "produce"
      },
      {
        "name": "Turmeric",
        "quantity": 0.5,
        "unit": "tsp",
        "category": "spices"
      },
      {
        "name": "Salt",
        "quantity": 1,
        "unit": "tsp",
        "category": "pantry"
      },
      {
        "name": "Oil",
        "quantity": 2,
        "unit": "tbsp",
        "category": "pantry"
      }
    ],
    "thattu-dosa": [
      {
        "name": "Idli Rice",
        "quantity": 1,
        "unit": "cup",
        "category": "grains"
      },
      {
        "name": "Urad Dal",
        "quantity": 0.25,
        "unit": "cup",
        "category": "proteins"
      },
      {
        "name": "Salt",
        "quantity": 0.5,
        "unit": "tsp",
        "category": "pantry"
      },
      {
        "name": "Oil",
        "quantity": 2,
        "unit": "tbsp",
        "category": "pantry"
      }
    ],
    "banana-halwa": [
      {
        "name": "Banana",
        "quantity": 4,
        "unit": "pc",
        "category": "produce"
      },
      {
        "name": "Ghee",
        "quantity": 0.25,
        "unit": "cup",
        "category": "dairy"
      },
      {
        "name": "Sugar",
        "quantity": 0.5,
        "unit": "cup",
        "category": "pantry"
      },
      {
        "name": "Cardamom",
        "quantity": 2,
        "unit": "pods",
        "category": "spices"
      },
      {
        "name": "Cashews",
        "quantity": 2,
        "unit": "tbsp",
        "category": "pantry"
      },
      {
        "name": "Raisins",
        "quantity": 2,
        "unit": "tbsp",
        "category": "pantry"
      }
    ],
    "korri-gassi": [
      {
        "name": "Ghee",
        "quantity": 2,
        "unit": "tbsp",
        "category": "pantry",
        "inStock": false
      },
      {
        "name": "Oil",
        "quantity": 2,
        "unit": "tbsp",
        "category": "pantry",
        "inStock": false
      },
      {
        "name": "Spices",
        "quantity": 1,
        "unit": "packet",
        "category": "spices",
        "inStock": false
      },
      {
        "name": "Chicken",
        "quantity": 200,
        "unit": "g",
        "category": "proteins",
        "inStock": false
      },
      {
        "name": "Rice",
        "quantity": 1,
        "unit": "cup",
        "category": "grains",
        "inStock": false
      },
      {
        "name": "Onion",
        "quantity": 1,
        "unit": "pc",
        "category": "produce",
        "inStock": false
      },
      {
        "name": "Tomato",
        "quantity": 2,
        "unit": "pc",
        "category": "produce",
        "inStock": false
      },
      {
        "name": "Green Chilli",
        "quantity": 2,
        "unit": "pc",
        "category": "produce",
        "inStock": false
      },
      {
        "name": "Ginger-Garlic Paste",
        "quantity": 1,
        "unit": "tbsp",
        "category": "produce",
        "inStock": false
      },
      {
        "name": "Coriander Leaves",
        "quantity": 0.25,
        "unit": "cup",
        "category": "produce",
        "inStock": false
      },
      {
        "name": "Salt",
        "quantity": 1,
        "unit": "tsp",
        "category": "pantry"
      },
      {
        "name": "Turmeric",
        "quantity": 0.5,
        "unit": "tsp",
        "category": "spices"
      },
      {
        "name": "Coconut",
        "quantity": 0.5,
        "unit": "cup",
        "category": "produce"
      },
      {
        "name": "Curry Leaves",
        "quantity": 1,
        "unit": "sprig",
        "category": "produce"
      },
      {
        "name": "Mustard Seeds",
        "quantity": 1,
        "unit": "tsp",
        "category": "spices"
      },
      {
        "name": "Tamarind",
        "quantity": 1,
        "unit": "tbsp",
        "category": "pantry"
      },
      {
        "name": "Cumin Seeds",
        "quantity": 1,
        "unit": "tsp",
        "category": "spices"
      },
      {
        "name": "Red Chili Powder",
        "quantity": 0.5,
        "unit": "tsp",
        "category": "spices"
      }
    ],
    "kundapura-koli-saaru": [
      {
        "name": "Chicken",
        "quantity": 250,
        "unit": "g",
        "category": "proteins"
      },
      {
        "name": "Onion",
        "quantity": 1,
        "unit": "pc",
        "category": "produce"
      },
      {
        "name": "Tomato",
        "quantity": 1,
        "unit": "pc",
        "category": "produce"
      },
      {
        "name": "Ginger-Garlic Paste",
        "quantity": 1,
        "unit": "tbsp",
        "category": "pantry"
      },
      {
        "name": "Green Chilli",
        "quantity": 2,
        "unit": "pcs",
        "category": "produce"
      },
      {
        "name": "Coconut Milk",
        "quantity": 1,
        "unit": "cup",
        "category": "pantry"
      },
      {
        "name": "Curry Leaves",
        "quantity": 1,
        "unit": "sprig",
        "category": "produce"
      },
      {
        "name": "Red Chili Powder",
        "quantity": 0.5,
        "unit": "tsp",
        "category": "spices"
      },
      {
        "name": "Coriander Powder",
        "quantity": 1,
        "unit": "tsp",
        "category": "spices"
      },
      {
        "name": "Turmeric",
        "quantity": 0.5,
        "unit": "tsp",
        "category": "spices"
      },
      {
        "name": "Salt",
        "quantity": 1,
        "unit": "tsp",
        "category": "pantry"
      }
    ],
    "allugedda": [
      {
        "name": "Ghee",
        "quantity": 2,
        "unit": "tbsp",
        "category": "pantry",
        "inStock": false
      },
      {
        "name": "Oil",
        "quantity": 2,
        "unit": "tbsp",
        "category": "pantry",
        "inStock": false
      },
      {
        "name": "Spices",
        "quantity": 1,
        "unit": "packet",
        "category": "spices",
        "inStock": false
      },
      {
        "name": "Potatoes",
        "quantity": 3,
        "unit": "pc",
        "category": "produce",
        "inStock": false
      },
      {
        "name": "Onion",
        "quantity": 1,
        "unit": "pc",
        "category": "produce",
        "inStock": false
      },
      {
        "name": "Tomato",
        "quantity": 2,
        "unit": "pc",
        "category": "produce",
        "inStock": false
      },
      {
        "name": "Green Chilli",
        "quantity": 2,
        "unit": "pc",
        "category": "produce",
        "inStock": false
      },
      {
        "name": "Ginger-Garlic Paste",
        "quantity": 1,
        "unit": "tbsp",
        "category": "produce",
        "inStock": false
      },
      {
        "name": "Coriander Leaves",
        "quantity": 0.25,
        "unit": "cup",
        "category": "produce",
        "inStock": false
      },
      {
        "name": "Salt",
        "quantity": 1,
        "unit": "tsp",
        "category": "pantry"
      },
      {
        "name": "Turmeric",
        "quantity": 0.5,
        "unit": "tsp",
        "category": "spices"
      },
      {
        "name": "Coconut",
        "quantity": 0.5,
        "unit": "cup",
        "category": "produce"
      },
      {
        "name": "Curry Leaves",
        "quantity": 1,
        "unit": "sprig",
        "category": "produce"
      },
      {
        "name": "Mustard Seeds",
        "quantity": 1,
        "unit": "tsp",
        "category": "spices"
      },
      {
        "name": "Tamarind",
        "quantity": 1,
        "unit": "tbsp",
        "category": "pantry"
      },
      {
        "name": "Cumin Seeds",
        "quantity": 1,
        "unit": "tsp",
        "category": "spices"
      }
    ],
    "mysore-pak": [
      {
        "name": "Gram Flour",
        "quantity": 100,
        "unit": "g",
        "category": "grains",
        "inStock": false
      },
      {
        "name": "Sugar",
        "quantity": 100,
        "unit": "g",
        "category": "pantry",
        "inStock": false
      },
      {
        "name": "Ghee",
        "quantity": 50,
        "unit": "g",
        "category": "dairy",
        "inStock": false
      },
      {
        "name": "Cardamom",
        "quantity": 2,
        "unit": "pods",
        "category": "spices"
      },
      {
        "name": "Raisins",
        "quantity": 2,
        "unit": "tbsp",
        "category": "pantry"
      },
      {
        "name": "Almonds",
        "quantity": 2,
        "unit": "tbsp",
        "category": "pantry"
      },
      {
        "name": "Pistachios",
        "quantity": 1,
        "unit": "tbsp",
        "category": "pantry"
      }
    ],
    "coorg-pandi-curry": [
      {
        "name": "Pork",
        "quantity": 200,
        "unit": "g",
        "category": "proteins",
        "inStock": false
      },
      {
        "name": "Ghee",
        "quantity": 2,
        "unit": "tbsp",
        "category": "pantry",
        "inStock": false
      },
      {
        "name": "Oil",
        "quantity": 2,
        "unit": "tbsp",
        "category": "pantry",
        "inStock": false
      },
      {
        "name": "Spices",
        "quantity": 1,
        "unit": "packet",
        "category": "spices",
        "inStock": false
      },
      {
        "name": "Ginger",
        "quantity": 20,
        "unit": "g",
        "category": "produce",
        "inStock": false
      },
      {
        "name": "Garlic",
        "quantity": 10,
        "unit": "g",
        "category": "produce",
        "inStock": false
      },
      {
        "name": "Rice",
        "quantity": 1,
        "unit": "cup",
        "category": "grains",
        "inStock": false
      },
      {
        "name": "Onion",
        "quantity": 1,
        "unit": "pc",
        "category": "produce",
        "inStock": false
      },
      {
        "name": "Tomato",
        "quantity": 2,
        "unit": "pc",
        "category": "produce",
        "inStock": false
      },
      {
        "name": "Green Chilli",
        "quantity": 2,
        "unit": "pc",
        "category": "produce",
        "inStock": false
      },
      {
        "name": "Ginger-Garlic Paste",
        "quantity": 1,
        "unit": "tbsp",
        "category": "produce",
        "inStock": false
      },
      {
        "name": "Coriander Leaves",
        "quantity": 0.25,
        "unit": "cup",
        "category": "produce",
        "inStock": false
      },
      {
        "name": "Salt",
        "quantity": 1,
        "unit": "tsp",
        "category": "pantry"
      },
      {
        "name": "Turmeric",
        "quantity": 0.5,
        "unit": "tsp",
        "category": "spices"
      },
      {
        "name": "Coconut",
        "quantity": 0.5,
        "unit": "cup",
        "category": "produce"
      },
      {
        "name": "Curry Leaves",
        "quantity": 1,
        "unit": "sprig",
        "category": "produce"
      },
      {
        "name": "Mustard Seeds",
        "quantity": 1,
        "unit": "tsp",
        "category": "spices"
      },
      {
        "name": "Tamarind",
        "quantity": 1,
        "unit": "tbsp",
        "category": "pantry"
      },
      {
        "name": "Cumin Seeds",
        "quantity": 1,
        "unit": "tsp",
        "category": "spices"
      },
      {
        "name": "Red Chili Powder",
        "quantity": 0.5,
        "unit": "tsp",
        "category": "spices"
      }
    ],
    "haalbai": [
      {
        "name": "Basmati Rice",
        "quantity": 0.5,
        "unit": "cup",
        "category": "grains",
        "inStock": false
      },
      {
        "name": "Milk",
        "quantity": 2,
        "unit": "cup",
        "category": "dairy",
        "inStock": false
      },
      {
        "name": "Sugar",
        "quantity": 3,
        "unit": "tbsp",
        "category": "pantry",
        "inStock": false
      },
      {
        "name": "Cardamom",
        "quantity": 2,
        "unit": "pods",
        "category": "spices",
        "inStock": false
      },
      {
        "name": "Raisins",
        "quantity": 1,
        "unit": "tbsp",
        "category": "pantry",
        "inStock": false
      },
      {
        "name": "Almonds",
        "quantity": 1,
        "unit": "tbsp",
        "category": "pantry",
        "inStock": false
      },
      {
        "name": "Coconut",
        "quantity": 3,
        "unit": "tbsp",
        "category": "produce",
        "inStock": false
      }
    ],
    "mangalorean-biryani": [
      {
        "name": "Rice",
        "quantity": 1,
        "unit": "cup",
        "category": "grains"
      },
      {
        "name": "Chicken",
        "quantity": 250,
        "unit": "g",
        "category": "proteins"
      },
      {
        "name": "Onion",
        "quantity": 2,
        "unit": "pcs",
        "category": "produce"
      },
      {
        "name": "Yogurt",
        "quantity": 100,
        "unit": "g",
        "category": "dairy"
      },
      {
        "name": "Ginger-Garlic Paste",
        "quantity": 1,
        "unit": "tbsp",
        "category": "pantry"
      },
      {
        "name": "Biryani Masala",
        "quantity": 1,
        "unit": "tbsp",
        "category": "spices"
      },
      {
        "name": "Coconut",
        "quantity": 0.5,
        "unit": "cup",
        "category": "produce"
      },
      {
        "name": "Red Chili Powder",
        "quantity": 0.5,
        "unit": "tsp",
        "category": "spices"
      },
      {
        "name": "Turmeric",
        "quantity": 0.5,
        "unit": "tsp",
        "category": "spices"
      },
      {
        "name": "Green Chilli",
        "quantity": 1,
        "unit": "pc",
        "category": "produce"
      },
      {
        "name": "Salt",
        "quantity": 1,
        "unit": "tsp",
        "category": "pantry"
      },
      {
        "name": "Mint Leaves",
        "quantity": 0.25,
        "unit": "cup",
        "category": "produce"
      },
      {
        "name": "Ghee",
        "quantity": 1,
        "unit": "tbsp",
        "category": "dairy"
      },
      {
        "name": "Oil",
        "quantity": 2,
        "unit": "tbsp",
        "category": "pantry"
      }
    ],
    "kane-rava-fry": [
      {
        "name": "Fish",
        "quantity": 150,
        "unit": "g",
        "category": "proteins",
        "inStock": false
      },
      {
        "name": "Semolina (Rava)",
        "quantity": 100,
        "unit": "g",
        "category": "grains",
        "inStock": false
      },
      {
        "name": "Spices",
        "quantity": 1,
        "unit": "packet",
        "category": "spices",
        "inStock": false
      },
      {
        "name": "Ghee",
        "quantity": 2,
        "unit": "tbsp",
        "category": "pantry",
        "inStock": false
      },
      {
        "name": "Oil",
        "quantity": 2,
        "unit": "tbsp",
        "category": "pantry",
        "inStock": false
      },
      {
        "name": "Onion",
        "quantity": 1,
        "unit": "pc",
        "category": "produce",
        "inStock": false
      },
      {
        "name": "Tomato",
        "quantity": 2,
        "unit": "pc",
        "category": "produce",
        "inStock": false
      },
      {
        "name": "Green Chilli",
        "quantity": 2,
        "unit": "pc",
        "category": "produce",
        "inStock": false
      },
      {
        "name": "Ginger-Garlic Paste",
        "quantity": 1,
        "unit": "tbsp",
        "category": "produce",
        "inStock": false
      },
      {
        "name": "Coriander Leaves",
        "quantity": 0.25,
        "unit": "cup",
        "category": "produce",
        "inStock": false
      },
      {
        "name": "Salt",
        "quantity": 1,
        "unit": "tsp",
        "category": "pantry"
      },
      {
        "name": "Turmeric",
        "quantity": 0.5,
        "unit": "tsp",
        "category": "spices"
      }
    ],
    "udupi-sambar": [
      {
        "name": "Toor Dal",
        "quantity": 80,
        "unit": "g",
        "category": "proteins"
      },
      {
        "name": "Tomato",
        "quantity": 2,
        "unit": "pc",
        "category": "produce"
      },
      {
        "name": "Drumstick",
        "quantity": 1,
        "unit": "pc",
        "category": "produce"
      },
      {
        "name": "Coconut",
        "quantity": 30,
        "unit": "g",
        "category": "produce"
      },
      {
        "name": "Sambar Powder",
        "quantity": 1,
        "unit": "tbsp",
        "category": "spices"
      },
      {
        "name": "Tamarind",
        "quantity": 10,
        "unit": "g",
        "category": "pantry"
      },
      {
        "name": "Jaggery",
        "quantity": 1,
        "unit": "tsp",
        "category": "pantry"
      },
      {
        "name": "Mustard Seeds",
        "quantity": 0.5,
        "unit": "tsp",
        "category": "spices"
      },
      {
        "name": "Curry Leaves",
        "quantity": 5,
        "unit": "pcs",
        "category": "produce"
      },
      {
        "name": "Oil",
        "quantity": 1,
        "unit": "tbsp",
        "category": "pantry"
      },
      {
        "name": "Salt",
        "quantity": 1,
        "unit": "tsp",
        "category": "pantry"
      },
      {
        "name": "Idli Rice",
        "quantity": 1,
        "unit": "cup",
        "category": "grains"
      },
      {
        "name": "Urad Dal",
        "quantity": 0.25,
        "unit": "cup",
        "category": "proteins"
      }
    ],
    "mango-chutney": [
      {
        "name": "Mango",
        "quantity": 1,
        "unit": "pc",
        "category": "produce",
        "inStock": false
      },
      {
        "name": "Ghee",
        "quantity": 2,
        "unit": "tbsp",
        "category": "pantry",
        "inStock": false
      },
      {
        "name": "Oil",
        "quantity": 2,
        "unit": "tbsp",
        "category": "pantry",
        "inStock": false
      },
      {
        "name": "Spices",
        "quantity": 1,
        "unit": "packet",
        "category": "spices",
        "inStock": false
      }
    ],
    "mysore-bonda": [
      {
        "name": "All-Purpose Flour (Maida)",
        "quantity": 1,
        "unit": "cup",
        "category": "grains"
      },
      {
        "name": "Yogurt",
        "quantity": 0.5,
        "unit": "cup",
        "category": "dairy"
      },
      {
        "name": "Onion",
        "quantity": 0.5,
        "unit": "pc",
        "category": "produce"
      },
      {
        "name": "Green Chilli",
        "quantity": 1,
        "unit": "pc",
        "category": "produce"
      },
      {
        "name": "Ginger",
        "quantity": 0.5,
        "unit": "inch",
        "category": "produce"
      },
      {
        "name": "Curry Leaves",
        "quantity": 1,
        "unit": "sprig",
        "category": "produce"
      },
      {
        "name": "Coriander Leaves",
        "quantity": 0.25,
        "unit": "cup",
        "category": "produce"
      },
      {
        "name": "Salt",
        "quantity": 1,
        "unit": "tsp",
        "category": "pantry"
      },
      {
        "name": "Oil",
        "quantity": 2,
        "unit": "cup",
        "category": "pantry"
      },
      {
        "name": "Baking Soda",
        "quantity": 0.25,
        "unit": "tsp",
        "category": "pantry"
      }
    ],
    "sagu": [
      {
        "name": "Mixed Vegetables",
        "quantity": 200,
        "unit": "g",
        "category": "produce"
      },
      {
        "name": "Coconut",
        "quantity": 30,
        "unit": "g",
        "category": "produce"
      },
      {
        "name": "Poppy Seeds",
        "quantity": 10,
        "unit": "g",
        "category": "pantry"
      },
      {
        "name": "Onion",
        "quantity": 1,
        "unit": "pc",
        "category": "produce"
      },
      {
        "name": "Green Chilli",
        "quantity": 2,
        "unit": "pc",
        "category": "produce"
      },
      {
        "name": "Ginger",
        "quantity": 0.5,
        "unit": "inch",
        "category": "produce"
      },
      {
        "name": "Curry Leaves",
        "quantity": 5,
        "unit": "pcs",
        "category": "produce"
      },
      {
        "name": "Mustard Seeds",
        "quantity": 0.5,
        "unit": "tsp",
        "category": "spices"
      },
      {
        "name": "Salt",
        "quantity": 1,
        "unit": "tsp",
        "category": "pantry"
      },
      {
        "name": "Oil",
        "quantity": 2,
        "unit": "tbsp",
        "category": "pantry"
      },
      {
        "name": "Idli Rice",
        "quantity": 1,
        "unit": "cup",
        "category": "grains"
      },
      {
        "name": "Urad Dal",
        "quantity": 0.25,
        "unit": "cup",
        "category": "proteins"
      }
    ],
    "pori-urundai": [
      {
        "name": "Puffed Rice (Pori)",
        "quantity": 100,
        "unit": "g",
        "category": "grains",
        "inStock": false
      },
      {
        "name": "Jaggery",
        "quantity": 50,
        "unit": "g",
        "category": "pantry",
        "inStock": false
      },
      {
        "name": "Coconut",
        "quantity": 30,
        "unit": "g",
        "category": "produce",
        "inStock": false
      },
      {
        "name": "Rice",
        "quantity": 1,
        "unit": "cup",
        "category": "grains",
        "inStock": false
      },
      {
        "name": "Sugar",
        "quantity": 0.5,
        "unit": "cup",
        "category": "pantry"
      },
      {
        "name": "Cardamom",
        "quantity": 2,
        "unit": "pods",
        "category": "spices"
      },
      {
        "name": "Raisins",
        "quantity": 2,
        "unit": "tbsp",
        "category": "pantry"
      },
      {
        "name": "Almonds",
        "quantity": 2,
        "unit": "tbsp",
        "category": "pantry"
      },
      {
        "name": "Pistachios",
        "quantity": 1,
        "unit": "tbsp",
        "category": "pantry"
      }
    ],
    "maddur-vada": [
      {
        "name": "All-Purpose Flour (Maida)",
        "quantity": 1,
        "unit": "cup",
        "category": "grains"
      },
      {
        "name": "Rice Flour",
        "quantity": 0.25,
        "unit": "cup",
        "category": "grains"
      },
      {
        "name": "Semolina",
        "quantity": 2,
        "unit": "tbsp",
        "category": "grains"
      },
      {
        "name": "Onion",
        "quantity": 1,
        "unit": "pc",
        "category": "produce"
      },
      {
        "name": "Green Chilli",
        "quantity": 2,
        "unit": "pc",
        "category": "produce"
      },
      {
        "name": "Ginger",
        "quantity": 1,
        "unit": "inch",
        "category": "produce"
      },
      {
        "name": "Curry Leaves",
        "quantity": 1,
        "unit": "sprig",
        "category": "produce"
      },
      {
        "name": "Salt",
        "quantity": 1,
        "unit": "tsp",
        "category": "pantry"
      },
      {
        "name": "Oil",
        "quantity": 2,
        "unit": "tbsp",
        "category": "pantry"
      }
    ],
    "chiroti": [
      {
        "name": "Phulka",
        "quantity": 2,
        "unit": "pcs",
        "category": "grains",
        "inStock": false
      },
      {
        "name": "Wheat Flour",
        "quantity": 70,
        "unit": "g",
        "category": "grains",
        "inStock": false
      },
      {
        "name": "Ghee",
        "quantity": 2,
        "unit": "tbsp",
        "category": "pantry",
        "inStock": false
      },
      {
        "name": "Oil",
        "quantity": 2,
        "unit": "tbsp",
        "category": "pantry",
        "inStock": false
      },
      {
        "name": "Spices",
        "quantity": 1,
        "unit": "packet",
        "category": "spices",
        "inStock": false
      },
      {
        "name": "Sugar",
        "quantity": 0.5,
        "unit": "cup",
        "category": "pantry"
      },
      {
        "name": "Cardamom",
        "quantity": 2,
        "unit": "pods",
        "category": "spices"
      },
      {
        "name": "Raisins",
        "quantity": 2,
        "unit": "tbsp",
        "category": "pantry"
      },
      {
        "name": "Almonds",
        "quantity": 2,
        "unit": "tbsp",
        "category": "pantry"
      },
      {
        "name": "Pistachios",
        "quantity": 1,
        "unit": "tbsp",
        "category": "pantry"
      }
    ],
    "tatte-idli": [
      {
        "name": "Idli Rice",
        "quantity": 1,
        "unit": "cup",
        "category": "grains"
      },
      {
        "name": "Urad Dal",
        "quantity": 0.25,
        "unit": "cup",
        "category": "proteins"
      },
      {
        "name": "Fenugreek Seeds",
        "quantity": 0.5,
        "unit": "tsp",
        "category": "spices"
      },
      {
        "name": "Salt",
        "quantity": 1,
        "unit": "tsp",
        "category": "pantry"
      },
      {
        "name": "Coconut",
        "quantity": 0.5,
        "unit": "cup",
        "category": "produce"
      },
      {
        "name": "Green Chilli",
        "quantity": 1,
        "unit": "pc",
        "category": "produce"
      },
      {
        "name": "Curry Leaves",
        "quantity": 1,
        "unit": "sprig",
        "category": "produce"
      },
      {
        "name": "Mustard Seeds",
        "quantity": 0.5,
        "unit": "tsp",
        "category": "spices"
      },
      {
        "name": "Oil",
        "quantity": 1,
        "unit": "tbsp",
        "category": "pantry"
      }
    ],
    "chitranna": [
      {
        "name": "Ghee",
        "quantity": 2,
        "unit": "tbsp",
        "category": "pantry",
        "inStock": false
      },
      {
        "name": "Oil",
        "quantity": 2,
        "unit": "tbsp",
        "category": "pantry",
        "inStock": false
      },
      {
        "name": "Spices",
        "quantity": 1,
        "unit": "packet",
        "category": "spices",
        "inStock": false
      },
      {
        "name": "Rice",
        "quantity": 1,
        "unit": "cup",
        "category": "grains",
        "inStock": false
      },
      {
        "name": "Salt",
        "quantity": 1,
        "unit": "tsp",
        "category": "pantry"
      },
      {
        "name": "Turmeric",
        "quantity": 0.5,
        "unit": "tsp",
        "category": "spices"
      },
      {
        "name": "Coconut",
        "quantity": 0.5,
        "unit": "cup",
        "category": "produce"
      },
      {
        "name": "Curry Leaves",
        "quantity": 1,
        "unit": "sprig",
        "category": "produce"
      },
      {
        "name": "Mustard Seeds",
        "quantity": 1,
        "unit": "tsp",
        "category": "spices"
      },
      {
        "name": "Tamarind",
        "quantity": 1,
        "unit": "tbsp",
        "category": "pantry"
      },
      {
        "name": "Whole Spices",
        "quantity": 1,
        "unit": "tsp",
        "category": "spices"
      }
    ],
    "gojju": [
      {
        "name": "Tamarind",
        "quantity": 2,
        "unit": "tbsp",
        "category": "pantry"
      },
      {
        "name": "Jaggery",
        "quantity": 2,
        "unit": "tbsp",
        "category": "pantry"
      },
      {
        "name": "Mustard Seeds",
        "quantity": 1,
        "unit": "tsp",
        "category": "spices"
      },
      {
        "name": "Red Chilli",
        "quantity": 2,
        "unit": "pc",
        "category": "spices"
      },
      {
        "name": "Curry Leaves",
        "quantity": 1,
        "unit": "sprig",
        "category": "produce"
      },
      {
        "name": "Ginger",
        "quantity": 0.5,
        "unit": "inch",
        "category": "produce"
      },
      {
        "name": "Turmeric",
        "quantity": 0.5,
        "unit": "tsp",
        "category": "spices"
      },
      {
        "name": "Salt",
        "quantity": 1,
        "unit": "tsp",
        "category": "pantry"
      },
      {
        "name": "Oil",
        "quantity": 1,
        "unit": "tbsp",
        "category": "pantry"
      },
      {
        "name": "Rice",
        "quantity": 1,
        "unit": "cup",
        "category": "grains"
      }
    ],
    "ragi-mudde": [
      {
        "name": "Ragi Flour",
        "quantity": 200,
        "unit": "g",
        "category": "grains"
      },
      {
        "name": "Water",
        "quantity": 2,
        "unit": "cup",
        "category": "pantry"
      },
      {
        "name": "Salt",
        "quantity": 1,
        "unit": "tsp",
        "category": "pantry"
      },
      {
        "name": "Toor Dal",
        "quantity": 80,
        "unit": "g",
        "category": "proteins"
      },
      {
        "name": "Tomato",
        "quantity": 2,
        "unit": "pc",
        "category": "produce"
      },
      {
        "name": "Drumstick",
        "quantity": 1,
        "unit": "pc",
        "category": "produce"
      },
      {
        "name": "Sambar Powder",
        "quantity": 1.5,
        "unit": "tbsp",
        "category": "spices"
      },
      {
        "name": "Tamarind",
        "quantity": 1,
        "unit": "tbsp",
        "category": "pantry"
      },
      {
        "name": "Curry Leaves",
        "quantity": 1,
        "unit": "sprig",
        "category": "produce"
      },
      {
        "name": "Mustard Seeds",
        "quantity": 0.5,
        "unit": "tsp",
        "category": "spices"
      },
      {
        "name": "Oil",
        "quantity": 1,
        "unit": "tbsp",
        "category": "pantry"
      }
    ],
    "ennegai": [
      {
        "name": "Eggplant",
        "quantity": 3,
        "unit": "pc",
        "category": "produce",
        "inStock": false
      },
      {
        "name": "Peanuts",
        "quantity": 30,
        "unit": "g",
        "category": "proteins",
        "inStock": false
      },
      {
        "name": "Coconut",
        "quantity": 30,
        "unit": "g",
        "category": "produce",
        "inStock": false
      },
      {
        "name": "Ghee",
        "quantity": 2,
        "unit": "tbsp",
        "category": "pantry",
        "inStock": false
      },
      {
        "name": "Oil",
        "quantity": 2,
        "unit": "tbsp",
        "category": "pantry",
        "inStock": false
      },
      {
        "name": "Spices",
        "quantity": 1,
        "unit": "packet",
        "category": "spices",
        "inStock": false
      },
      {
        "name": "Rice",
        "quantity": 1,
        "unit": "cup",
        "category": "grains",
        "inStock": false
      },
      {
        "name": "Onion",
        "quantity": 1,
        "unit": "pc",
        "category": "produce",
        "inStock": false
      },
      {
        "name": "Tomato",
        "quantity": 2,
        "unit": "pc",
        "category": "produce",
        "inStock": false
      },
      {
        "name": "Green Chilli",
        "quantity": 2,
        "unit": "pc",
        "category": "produce",
        "inStock": false
      },
      {
        "name": "Ginger-Garlic Paste",
        "quantity": 1,
        "unit": "tbsp",
        "category": "produce",
        "inStock": false
      },
      {
        "name": "Coriander Leaves",
        "quantity": 0.25,
        "unit": "cup",
        "category": "produce",
        "inStock": false
      },
      {
        "name": "Salt",
        "quantity": 1,
        "unit": "tsp",
        "category": "pantry"
      },
      {
        "name": "Turmeric",
        "quantity": 0.5,
        "unit": "tsp",
        "category": "spices"
      },
      {
        "name": "Curry Leaves",
        "quantity": 1,
        "unit": "sprig",
        "category": "produce"
      },
      {
        "name": "Mustard Seeds",
        "quantity": 1,
        "unit": "tsp",
        "category": "spices"
      },
      {
        "name": "Tamarind",
        "quantity": 1,
        "unit": "tbsp",
        "category": "pantry"
      },
      {
        "name": "Cumin Seeds",
        "quantity": 1,
        "unit": "tsp",
        "category": "spices"
      },
      {
        "name": "Red Chili Powder",
        "quantity": 0.5,
        "unit": "tsp",
        "category": "spices"
      }
    ],
    "chepa-pulusu": [
      {
        "name": "Fish",
        "quantity": 150,
        "unit": "g",
        "category": "proteins",
        "inStock": false
      },
      {
        "name": "Tamarind",
        "quantity": 20,
        "unit": "g",
        "category": "pantry",
        "inStock": false
      },
      {
        "name": "Ghee",
        "quantity": 2,
        "unit": "tbsp",
        "category": "pantry",
        "inStock": false
      },
      {
        "name": "Oil",
        "quantity": 2,
        "unit": "tbsp",
        "category": "pantry",
        "inStock": false
      },
      {
        "name": "Spices",
        "quantity": 1,
        "unit": "packet",
        "category": "spices",
        "inStock": false
      },
      {
        "name": "Rice",
        "quantity": 1,
        "unit": "cup",
        "category": "grains",
        "inStock": false
      },
      {
        "name": "Onion",
        "quantity": 1,
        "unit": "pc",
        "category": "produce",
        "inStock": false
      },
      {
        "name": "Tomato",
        "quantity": 2,
        "unit": "pc",
        "category": "produce",
        "inStock": false
      },
      {
        "name": "Green Chilli",
        "quantity": 2,
        "unit": "pc",
        "category": "produce",
        "inStock": false
      },
      {
        "name": "Ginger-Garlic Paste",
        "quantity": 1,
        "unit": "tbsp",
        "category": "produce",
        "inStock": false
      },
      {
        "name": "Coriander Leaves",
        "quantity": 0.25,
        "unit": "cup",
        "category": "produce",
        "inStock": false
      },
      {
        "name": "Salt",
        "quantity": 1,
        "unit": "tsp",
        "category": "pantry"
      },
      {
        "name": "Turmeric",
        "quantity": 0.5,
        "unit": "tsp",
        "category": "spices"
      },
      {
        "name": "Coconut",
        "quantity": 0.5,
        "unit": "cup",
        "category": "produce"
      },
      {
        "name": "Curry Leaves",
        "quantity": 1,
        "unit": "sprig",
        "category": "produce"
      },
      {
        "name": "Mustard Seeds",
        "quantity": 1,
        "unit": "tsp",
        "category": "spices"
      },
      {
        "name": "Cumin Seeds",
        "quantity": 1,
        "unit": "tsp",
        "category": "spices"
      },
      {
        "name": "Red Chili Powder",
        "quantity": 0.5,
        "unit": "tsp",
        "category": "spices"
      }
    ],
    "dondakaya-fry": [
      {
        "name": "Ivy Gourd",
        "quantity": 200,
        "unit": "g",
        "category": "produce",
        "inStock": false
      },
      {
        "name": "Ghee",
        "quantity": 2,
        "unit": "tbsp",
        "category": "pantry",
        "inStock": false
      },
      {
        "name": "Oil",
        "quantity": 2,
        "unit": "tbsp",
        "category": "pantry",
        "inStock": false
      },
      {
        "name": "Spices",
        "quantity": 1,
        "unit": "packet",
        "category": "spices",
        "inStock": false
      },
      {
        "name": "Onion",
        "quantity": 1,
        "unit": "pc",
        "category": "produce",
        "inStock": false
      },
      {
        "name": "Tomato",
        "quantity": 2,
        "unit": "pc",
        "category": "produce",
        "inStock": false
      },
      {
        "name": "Green Chilli",
        "quantity": 2,
        "unit": "pc",
        "category": "produce",
        "inStock": false
      },
      {
        "name": "Ginger-Garlic Paste",
        "quantity": 1,
        "unit": "tbsp",
        "category": "produce",
        "inStock": false
      },
      {
        "name": "Coriander Leaves",
        "quantity": 0.25,
        "unit": "cup",
        "category": "produce",
        "inStock": false
      }
    ],
    "ananas-menaskai": [
      {
        "name": "Pineapple",
        "quantity": 100,
        "unit": "g",
        "category": "produce",
        "inStock": false
      },
      {
        "name": "Coconut",
        "quantity": 30,
        "unit": "g",
        "category": "produce",
        "inStock": false
      },
      {
        "name": "Ghee",
        "quantity": 2,
        "unit": "tbsp",
        "category": "pantry",
        "inStock": false
      },
      {
        "name": "Oil",
        "quantity": 2,
        "unit": "tbsp",
        "category": "pantry",
        "inStock": false
      },
      {
        "name": "Spices",
        "quantity": 1,
        "unit": "packet",
        "category": "spices",
        "inStock": false
      },
      {
        "name": "Rice",
        "quantity": 1,
        "unit": "cup",
        "category": "grains",
        "inStock": false
      },
      {
        "name": "Onion",
        "quantity": 1,
        "unit": "pc",
        "category": "produce",
        "inStock": false
      },
      {
        "name": "Tomato",
        "quantity": 2,
        "unit": "pc",
        "category": "produce",
        "inStock": false
      },
      {
        "name": "Green Chilli",
        "quantity": 2,
        "unit": "pc",
        "category": "produce",
        "inStock": false
      },
      {
        "name": "Ginger-Garlic Paste",
        "quantity": 1,
        "unit": "tbsp",
        "category": "produce",
        "inStock": false
      },
      {
        "name": "Coriander Leaves",
        "quantity": 0.25,
        "unit": "cup",
        "category": "produce",
        "inStock": false
      },
      {
        "name": "Salt",
        "quantity": 1,
        "unit": "tsp",
        "category": "pantry"
      },
      {
        "name": "Turmeric",
        "quantity": 0.5,
        "unit": "tsp",
        "category": "spices"
      },
      {
        "name": "Curry Leaves",
        "quantity": 1,
        "unit": "sprig",
        "category": "produce"
      },
      {
        "name": "Mustard Seeds",
        "quantity": 1,
        "unit": "tsp",
        "category": "spices"
      },
      {
        "name": "Tamarind",
        "quantity": 1,
        "unit": "tbsp",
        "category": "pantry"
      },
      {
        "name": "Cumin Seeds",
        "quantity": 1,
        "unit": "tsp",
        "category": "spices"
      },
      {
        "name": "Red Chili Powder",
        "quantity": 0.5,
        "unit": "tsp",
        "category": "spices"
      }
    ],
    "andhra-spiced-egg-curry": [
      {
        "name": "Eggs",
        "quantity": 2,
        "unit": "pcs",
        "category": "proteins",
        "inStock": false
      },
      {
        "name": "White Bread",
        "quantity": 4,
        "unit": "pcs",
        "category": "breads",
        "inStock": false
      },
      {
        "name": "Milk",
        "quantity": 100,
        "unit": "ml",
        "category": "dairy",
        "inStock": false
      },
      {
        "name": "Sugar",
        "quantity": 2,
        "unit": "tbsp",
        "category": "pantry",
        "inStock": false
      },
      {
        "name": "Butter",
        "quantity": 20,
        "unit": "g",
        "category": "dairy",
        "inStock": false
      },
      {
        "name": "Ghee",
        "quantity": 2,
        "unit": "tbsp",
        "category": "pantry",
        "inStock": false
      },
      {
        "name": "Oil",
        "quantity": 2,
        "unit": "tbsp",
        "category": "pantry",
        "inStock": false
      },
      {
        "name": "Spices",
        "quantity": 1,
        "unit": "packet",
        "category": "spices",
        "inStock": false
      },
      {
        "name": "Rice",
        "quantity": 1,
        "unit": "cup",
        "category": "grains",
        "inStock": false
      },
      {
        "name": "Onion",
        "quantity": 1,
        "unit": "pc",
        "category": "produce",
        "inStock": false
      },
      {
        "name": "Tomato",
        "quantity": 2,
        "unit": "pc",
        "category": "produce",
        "inStock": false
      },
      {
        "name": "Green Chilli",
        "quantity": 2,
        "unit": "pc",
        "category": "produce",
        "inStock": false
      },
      {
        "name": "Ginger-Garlic Paste",
        "quantity": 1,
        "unit": "tbsp",
        "category": "produce",
        "inStock": false
      },
      {
        "name": "Coriander Leaves",
        "quantity": 0.25,
        "unit": "cup",
        "category": "produce",
        "inStock": false
      },
      {
        "name": "Salt",
        "quantity": 1,
        "unit": "tsp",
        "category": "pantry"
      },
      {
        "name": "Turmeric",
        "quantity": 0.5,
        "unit": "tsp",
        "category": "spices"
      },
      {
        "name": "Coconut",
        "quantity": 0.5,
        "unit": "cup",
        "category": "produce"
      },
      {
        "name": "Curry Leaves",
        "quantity": 1,
        "unit": "sprig",
        "category": "produce"
      },
      {
        "name": "Mustard Seeds",
        "quantity": 1,
        "unit": "tsp",
        "category": "spices"
      },
      {
        "name": "Tamarind",
        "quantity": 1,
        "unit": "tbsp",
        "category": "pantry"
      },
      {
        "name": "Cumin Seeds",
        "quantity": 1,
        "unit": "tsp",
        "category": "spices"
      },
      {
        "name": "Red Chili Powder",
        "quantity": 0.5,
        "unit": "tsp",
        "category": "spices"
      }
    ],
    "tamilian-spinach-poriyal": [
      {
        "name": "Spinach",
        "quantity": 250,
        "unit": "g",
        "category": "produce"
      },
      {
        "name": "Mustard Seeds",
        "quantity": 5,
        "unit": "g",
        "category": "spices"
      },
      {
        "name": "Urad Dal",
        "quantity": 10,
        "unit": "g",
        "category": "pantry"
      },
      {
        "name": "Dried Red Chilli",
        "quantity": 2,
        "unit": "pieces",
        "category": "spices"
      },
      {
        "name": "Curry Leaves",
        "quantity": 10,
        "unit": "g",
        "category": "produce"
      },
      {
        "name": "Grated Coconut",
        "quantity": 30,
        "unit": "g",
        "category": "produce"
      },
      {
        "name": "Onion",
        "quantity": 50,
        "unit": "g",
        "category": "produce"
      }
    ],
    "channa-sundal": [
      {
        "name": "Chickpeas",
        "quantity": 200,
        "unit": "g",
        "category": "pantry"
      },
      {
        "name": "Mustard Seeds",
        "quantity": 5,
        "unit": "g",
        "category": "spices"
      },
      {
        "name": "Urad Dal",
        "quantity": 10,
        "unit": "g",
        "category": "pantry"
      },
      {
        "name": "Dried Red Chilli",
        "quantity": 2,
        "unit": "pieces",
        "category": "spices"
      },
      {
        "name": "Curry Leaves",
        "quantity": 10,
        "unit": "g",
        "category": "produce"
      },
      {
        "name": "Grated Coconut",
        "quantity": 30,
        "unit": "g",
        "category": "produce"
      },
      {
        "name": "Lemon Juice",
        "quantity": 15,
        "unit": "ml",
        "category": "pantry"
      },
      {
        "name": "Mixed Dal",
        "quantity": 80,
        "unit": "g",
        "category": "proteins",
        "inStock": false
      }
    ],
    "tamil-pepper-chicken": [
      {
        "name": "Chicken",
        "quantity": 500,
        "unit": "g",
        "category": "proteins"
      },
      {
        "name": "Black Peppercorns",
        "quantity": 15,
        "unit": "g",
        "category": "spices"
      },
      {
        "name": "Fennel Seeds",
        "quantity": 10,
        "unit": "g",
        "category": "spices"
      },
      {
        "name": "Cumin Seeds",
        "quantity": 5,
        "unit": "g",
        "category": "spices"
      },
      {
        "name": "Dried Red Chillies",
        "quantity": 4,
        "unit": "pieces",
        "category": "spices"
      },
      {
        "name": "Curry Leaves",
        "quantity": 10,
        "unit": "g",
        "category": "produce"
      },
      {
        "name": "Onion",
        "quantity": 100,
        "unit": "g",
        "category": "produce"
      },
      {
        "name": "Tomato",
        "quantity": 100,
        "unit": "g",
        "category": "produce"
      },
      {
        "name": "Ginger",
        "quantity": 15,
        "unit": "g",
        "category": "produce"
      },
      {
        "name": "Garlic",
        "quantity": 15,
        "unit": "g",
        "category": "produce"
      }
    ],
    "telangana-chicken-curry": [
      {
        "name": "Chicken",
        "quantity": 500,
        "unit": "g",
        "category": "proteins"
      },
      {
        "name": "Coconut",
        "quantity": 100,
        "unit": "g",
        "category": "produce"
      },
      {
        "name": "Curry Leaves",
        "quantity": 10,
        "unit": "g",
        "category": "produce"
      },
      {
        "name": "Black Peppercorns",
        "quantity": 10,
        "unit": "g",
        "category": "spices"
      },
      {
        "name": "Coriander Seeds",
        "quantity": 15,
        "unit": "g",
        "category": "spices"
      },
      {
        "name": "Cumin Seeds",
        "quantity": 5,
        "unit": "g",
        "category": "spices"
      },
      {
        "name": "Poppy Seeds",
        "quantity": 10,
        "unit": "g",
        "category": "pantry"
      },
      {
        "name": "Onions",
        "quantity": 150,
        "unit": "g",
        "category": "produce"
      },
      {
        "name": "Ginger",
        "quantity": 15,
        "unit": "g",
        "category": "produce"
      },
      {
        "name": "Garlic",
        "quantity": 15,
        "unit": "g",
        "category": "produce"
      }
    ],
    "hyderabadi-murgh-ka-salan": [
      {
        "name": "Chicken",
        "quantity": 500,
        "unit": "g",
        "category": "proteins"
      },
      {
        "name": "Peanuts",
        "quantity": 50,
        "unit": "g",
        "category": "pantry"
      },
      {
        "name": "Coconut",
        "quantity": 50,
        "unit": "g",
        "category": "produce"
      },
      {
        "name": "Sesame Seeds",
        "quantity": 15,
        "unit": "g",
        "category": "pantry"
      },
      {
        "name": "Coriander Seeds",
        "quantity": 10,
        "unit": "g",
        "category": "spices"
      },
      {
        "name": "Cumin Seeds",
        "quantity": 5,
        "unit": "g",
        "category": "spices"
      },
      {
        "name": "Onions",
        "quantity": 150,
        "unit": "g",
        "category": "produce"
      },
      {
        "name": "Tamarind Paste",
        "quantity": 30,
        "unit": "g",
        "category": "pantry"
      },
      {
        "name": "Curry Leaves",
        "quantity": 10,
        "unit": "g",
        "category": "produce"
      }
    ],
    "hyderabadi-chicken-korma": [
      {
        "name": "Chicken",
        "quantity": 500,
        "unit": "g",
        "category": "proteins"
      },
      {
        "name": "Cashew Nuts",
        "quantity": 50,
        "unit": "g",
        "category": "pantry"
      },
      {
        "name": "Yoghurt",
        "quantity": 100,
        "unit": "ml",
        "category": "dairy"
      },
      {
        "name": "Onions",
        "quantity": 150,
        "unit": "g",
        "category": "produce"
      },
      {
        "name": "Ginger",
        "quantity": 15,
        "unit": "g",
        "category": "produce"
      },
      {
        "name": "Garlic",
        "quantity": 15,
        "unit": "g",
        "category": "produce"
      },
      {
        "name": "Cardamom",
        "quantity": 4,
        "unit": "pieces",
        "category": "spices"
      },
      {
        "name": "Cinnamon",
        "quantity": 2,
        "unit": "pieces",
        "category": "spices"
      },
      {
        "name": "Cloves",
        "quantity": 3,
        "unit": "pieces",
        "category": "spices"
      },
      {
        "name": "Bay Leaves",
        "quantity": 2,
        "unit": "pieces",
        "category": "spices"
      }
    ],
    "andhra-royalla-vepudu": [
      {
        "name": "King Prawns",
        "quantity": 300,
        "unit": "g",
        "category": "proteins"
      },
      {
        "name": "Shallots",
        "quantity": 100,
        "unit": "g",
        "category": "produce"
      },
      {
        "name": "Curry Leaves",
        "quantity": 10,
        "unit": "g",
        "category": "produce"
      },
      {
        "name": "Garlic",
        "quantity": 15,
        "unit": "g",
        "category": "produce"
      },
      {
        "name": "Fennel Seeds",
        "quantity": 5,
        "unit": "g",
        "category": "spices"
      },
      {
        "name": "Tomato",
        "quantity": 100,
        "unit": "g",
        "category": "produce"
      },
      {
        "name": "Ginger",
        "quantity": 10,
        "unit": "g",
        "category": "produce"
      },
      {
        "name": "Green Chilli",
        "quantity": 2,
        "unit": "pieces",
        "category": "produce"
      },
      {
        "name": "Turmeric",
        "quantity": 3,
        "unit": "g",
        "category": "spices"
      }
    ],
    "kerala-cabbage-thoran": [
      {
        "name": "Cabbage",
        "quantity": 300,
        "unit": "g",
        "category": "produce"
      },
      {
        "name": "Grated Coconut",
        "quantity": 50,
        "unit": "g",
        "category": "produce"
      },
      {
        "name": "Cumin Seeds",
        "quantity": 3,
        "unit": "g",
        "category": "spices"
      },
      {
        "name": "Garlic",
        "quantity": 10,
        "unit": "g",
        "category": "produce"
      },
      {
        "name": "Green Chilli",
        "quantity": 2,
        "unit": "pieces",
        "category": "produce"
      },
      {
        "name": "Mustard Seeds",
        "quantity": 5,
        "unit": "g",
        "category": "spices"
      },
      {
        "name": "Curry Leaves",
        "quantity": 10,
        "unit": "g",
        "category": "produce"
      },
      {
        "name": "Turmeric",
        "quantity": 3,
        "unit": "g",
        "category": "spices"
      }
    ],
    "mangalorean-prawn-sukke": [
      {
        "name": "King Prawns",
        "quantity": 300,
        "unit": "g",
        "category": "proteins"
      },
      {
        "name": "Coconut",
        "quantity": 80,
        "unit": "g",
        "category": "produce"
      },
      {
        "name": "Cumin Seeds",
        "quantity": 5,
        "unit": "g",
        "category": "spices"
      },
      {
        "name": "Coriander Seeds",
        "quantity": 10,
        "unit": "g",
        "category": "spices"
      },
      {
        "name": "Fenugreek Seeds",
        "quantity": 3,
        "unit": "g",
        "category": "spices"
      },
      {
        "name": "Dried Red Chillies",
        "quantity": 3,
        "unit": "pieces",
        "category": "spices"
      },
      {
        "name": "Tamarind Paste",
        "quantity": 20,
        "unit": "g",
        "category": "pantry"
      },
      {
        "name": "Curry Leaves",
        "quantity": 10,
        "unit": "g",
        "category": "produce"
      },
      {
        "name": "Mustard Seeds",
        "quantity": 5,
        "unit": "g",
        "category": "spices"
      }
    ],
    "malabar-prawn-curry": [
      {
        "name": "King Prawns",
        "quantity": 300,
        "unit": "g",
        "category": "proteins"
      },
      {
        "name": "Mustard Seeds",
        "quantity": 5,
        "unit": "g",
        "category": "spices"
      },
      {
        "name": "Fenugreek Seeds",
        "quantity": 3,
        "unit": "g",
        "category": "spices"
      },
      {
        "name": "Shallots",
        "quantity": 100,
        "unit": "g",
        "category": "produce"
      },
      {
        "name": "Curry Leaves",
        "quantity": 10,
        "unit": "g",
        "category": "produce"
      },
      {
        "name": "Garlic",
        "quantity": 15,
        "unit": "g",
        "category": "produce"
      },
      {
        "name": "Kashmiri Chilli Powder",
        "quantity": 15,
        "unit": "g",
        "category": "spices"
      },
      {
        "name": "Tamarind Paste",
        "quantity": 30,
        "unit": "g",
        "category": "pantry"
      },
      {
        "name": "Tomatoes",
        "quantity": 100,
        "unit": "g",
        "category": "produce"
      }
    ],
    "chettinad-fish-curry": [
      {
        "name": "Firm White Fish",
        "quantity": 400,
        "unit": "g",
        "category": "proteins"
      },
      {
        "name": "Curry Leaves",
        "quantity": 10,
        "unit": "g",
        "category": "produce"
      },
      {
        "name": "Tamarind Paste",
        "quantity": 30,
        "unit": "g",
        "category": "pantry"
      },
      {
        "name": "Coconut Cream",
        "quantity": 100,
        "unit": "ml",
        "category": "pantry"
      },
      {
        "name": "Toor Dal",
        "quantity": 50,
        "unit": "g",
        "category": "pantry"
      },
      {
        "name": "Black Pepper",
        "quantity": 10,
        "unit": "g",
        "category": "spices"
      },
      {
        "name": "Cumin",
        "quantity": 5,
        "unit": "g",
        "category": "spices"
      },
      {
        "name": "Coriander Seeds",
        "quantity": 10,
        "unit": "g",
        "category": "spices"
      },
      {
        "name": "Fennel Seeds",
        "quantity": 5,
        "unit": "g",
        "category": "spices"
      },
      {
        "name": "Mustard Seeds",
        "quantity": 5,
        "unit": "g",
        "category": "spices"
      }
    ],
    "coconut-rice-pudding": [
      {
        "name": "Basmati Rice",
        "quantity": 100,
        "unit": "g",
        "category": "grains"
      },
      {
        "name": "Coconut Milk",
        "quantity": 200,
        "unit": "ml",
        "category": "pantry"
      },
      {
        "name": "Milk",
        "quantity": 200,
        "unit": "ml",
        "category": "dairy"
      },
      {
        "name": "Jaggery",
        "quantity": 100,
        "unit": "g",
        "category": "pantry"
      },
      {
        "name": "Cardamom",
        "quantity": 3,
        "unit": "pieces",
        "category": "spices"
      },
      {
        "name": "Cashew Nuts",
        "quantity": 20,
        "unit": "g",
        "category": "pantry"
      },
      {
        "name": "Raisins",
        "quantity": 15,
        "unit": "g",
        "category": "pantry"
      },
      {
        "name": "Saffron",
        "quantity": 0.5,
        "unit": "g",
        "category": "pantry"
      }
    ],
    "andhra-lamb-pachadi": [
      {
        "name": "Lamb",
        "quantity": 300,
        "unit": "g",
        "category": "proteins"
      },
      {
        "name": "Mustard Oil",
        "quantity": 50,
        "unit": "ml",
        "category": "pantry"
      },
      {
        "name": "Kashmiri Chilli Powder",
        "quantity": 20,
        "unit": "g",
        "category": "spices"
      },
      {
        "name": "Fennel Powder",
        "quantity": 10,
        "unit": "g",
        "category": "spices"
      },
      {
        "name": "Mustard Seeds",
        "quantity": 10,
        "unit": "g",
        "category": "spices"
      },
      {
        "name": "Garlic",
        "quantity": 20,
        "unit": "g",
        "category": "produce"
      },
      {
        "name": "Curry Leaves",
        "quantity": 10,
        "unit": "g",
        "category": "produce"
      },
      {
        "name": "Vinegar",
        "quantity": 30,
        "unit": "ml",
        "category": "pantry"
      },
      {
        "name": "Sugar",
        "quantity": 10,
        "unit": "g",
        "category": "pantry"
      }
    ],
    "overnight-oats": [
      {
        "name": "Oats",
        "quantity": 100,
        "unit": "g",
        "category": "grains",
        "inStock": false
      },
      {
        "name": "Oil",
        "quantity": 2,
        "unit": "tbsp",
        "category": "pantry",
        "inStock": false
      },
      {
        "name": "Spices",
        "quantity": 1,
        "unit": "packet",
        "category": "spices",
        "inStock": false
      },
      {
        "name": "Flour",
        "quantity": 1.5,
        "unit": "cups",
        "category": "grains"
      },
      {
        "name": "Sugar",
        "quantity": 0.5,
        "unit": "cup",
        "category": "pantry"
      },
      {
        "name": "Baking Powder",
        "quantity": 1,
        "unit": "tsp",
        "category": "pantry"
      }
    ],
    "misal-pav": [
      {
        "name": "Mixed Sprouts",
        "quantity": 200,
        "unit": "g",
        "category": "proteins"
      },
      {
        "name": "Onion",
        "quantity": 1,
        "unit": "pc",
        "category": "produce"
      },
      {
        "name": "Tomato",
        "quantity": 1,
        "unit": "pc",
        "category": "produce"
      },
      {
        "name": "Potato",
        "quantity": 1,
        "unit": "pc",
        "category": "produce"
      },
      {
        "name": "Ginger-Garlic Paste",
        "quantity": 1,
        "unit": "tbsp",
        "category": "pantry"
      },
      {
        "name": "Misal Masala",
        "quantity": 1,
        "unit": "tbsp",
        "category": "spices"
      },
      {
        "name": "Turmeric",
        "quantity": 0.5,
        "unit": "tsp",
        "category": "spices"
      },
      {
        "name": "Salt",
        "quantity": 1,
        "unit": "tsp",
        "category": "pantry"
      },
      {
        "name": "Oil",
        "quantity": 2,
        "unit": "tbsp",
        "category": "pantry"
      },
      {
        "name": "Farsan",
        "quantity": 0.5,
        "unit": "cup",
        "category": "snacks"
      },
      {
        "name": "Lemon",
        "quantity": 1,
        "unit": "pc",
        "category": "produce"
      },
      {
        "name": "Pav",
        "quantity": 2,
        "unit": "pcs",
        "category": "breads"
      }
    ],
    "dhokla": [
      {
        "name": "Gram Flour (Besan)",
        "quantity": 1,
        "unit": "cup",
        "category": "grains"
      },
      {
        "name": "Yogurt",
        "quantity": 1,
        "unit": "cup",
        "category": "dairy"
      },
      {
        "name": "Ginger",
        "quantity": 0.5,
        "unit": "inch",
        "category": "produce"
      },
      {
        "name": "Green Chilli",
        "quantity": 1,
        "unit": "pc",
        "category": "produce"
      },
      {
        "name": "Turmeric",
        "quantity": 0.5,
        "unit": "tsp",
        "category": "spices"
      },
      {
        "name": "Salt",
        "quantity": 1,
        "unit": "tsp",
        "category": "pantry"
      },
      {
        "name": "Oil",
        "quantity": 1,
        "unit": "tbsp",
        "category": "pantry"
      },
      {
        "name": "Mustard Seeds",
        "quantity": 0.5,
        "unit": "tsp",
        "category": "spices"
      },
      {
        "name": "Curry Leaves",
        "quantity": 1,
        "unit": "sprig",
        "category": "produce"
      },
      {
        "name": "Coriander Leaves",
        "quantity": 0.25,
        "unit": "cup",
        "category": "produce"
      }
    ],
    "pav-bhaji": [
      {
        "name": "Pav",
        "quantity": 2,
        "unit": "pcs",
        "category": "breads"
      },
      {
        "name": "Potato",
        "quantity": 2,
        "unit": "pcs",
        "category": "produce"
      },
      {
        "name": "Cauliflower",
        "quantity": 0.5,
        "unit": "cup",
        "category": "produce"
      },
      {
        "name": "Green Peas",
        "quantity": 0.25,
        "unit": "cup",
        "category": "produce"
      },
      {
        "name": "Tomato",
        "quantity": 2,
        "unit": "pcs",
        "category": "produce"
      },
      {
        "name": "Onion",
        "quantity": 1,
        "unit": "pc",
        "category": "produce"
      },
      {
        "name": "Green Chilli",
        "quantity": 1,
        "unit": "pc",
        "category": "produce"
      },
      {
        "name": "Ginger-Garlic Paste",
        "quantity": 1,
        "unit": "tbsp",
        "category": "pantry"
      },
      {
        "name": "Pav Bhaji Masala",
        "quantity": 1,
        "unit": "tbsp",
        "category": "spices"
      },
      {
        "name": "Turmeric",
        "quantity": 0.5,
        "unit": "tsp",
        "category": "spices"
      },
      {
        "name": "Coriander Leaves",
        "quantity": 0.25,
        "unit": "cup",
        "category": "produce"
      },
      {
        "name": "Butter",
        "quantity": 50,
        "unit": "g",
        "category": "dairy"
      },
      {
        "name": "Salt",
        "quantity": 1,
        "unit": "tsp",
        "category": "pantry"
      },
      {
        "name": "Lemon",
        "quantity": 1,
        "unit": "pc",
        "category": "produce"
      }
    ],
    "bhel-puri": [
      {
        "name": "Puffed Rice",
        "quantity": 2,
        "unit": "cup",
        "category": "grains"
      },
      {
        "name": "Sev",
        "quantity": 1,
        "unit": "cup",
        "category": "snacks"
      },
      {
        "name": "Puri",
        "quantity": 0.5,
        "unit": "cup",
        "category": "snacks"
      },
      {
        "name": "Onion",
        "quantity": 0.5,
        "unit": "pc",
        "category": "produce"
      },
      {
        "name": "Tomato",
        "quantity": 1,
        "unit": "pc",
        "category": "produce"
      },
      {
        "name": "Potato",
        "quantity": 1,
        "unit": "pc",
        "category": "produce"
      },
      {
        "name": "Green Chilli",
        "quantity": 1,
        "unit": "pc",
        "category": "produce"
      },
      {
        "name": "Tamarind Chutney",
        "quantity": 2,
        "unit": "tbsp",
        "category": "pantry"
      },
      {
        "name": "Mint Chutney",
        "quantity": 2,
        "unit": "tbsp",
        "category": "pantry"
      },
      {
        "name": "Coriander Leaves",
        "quantity": 0.25,
        "unit": "cup",
        "category": "produce"
      },
      {
        "name": "Lemon",
        "quantity": 1,
        "unit": "pc",
        "category": "produce"
      }
    ],
    "chilli-paneer": [
      {
        "name": "Paneer",
        "quantity": 200,
        "unit": "g",
        "category": "proteins"
      },
      {
        "name": "Onion",
        "quantity": 1,
        "unit": "pc",
        "category": "produce"
      },
      {
        "name": "Bell Pepper",
        "quantity": 1,
        "unit": "pc",
        "category": "produce"
      },
      {
        "name": "Garlic",
        "quantity": 4,
        "unit": "cloves",
        "category": "produce"
      },
      {
        "name": "Ginger",
        "quantity": 1,
        "unit": "inch",
        "category": "produce"
      },
      {
        "name": "Green Chilli",
        "quantity": 2,
        "unit": "pc",
        "category": "produce"
      },
      {
        "name": "Soy Sauce",
        "quantity": 1,
        "unit": "tbsp",
        "category": "pantry"
      },
      {
        "name": "Chilli Sauce",
        "quantity": 1,
        "unit": "tsp",
        "category": "pantry"
      },
      {
        "name": "Cornflour",
        "quantity": 1,
        "unit": "tbsp",
        "category": "pantry"
      },
      {
        "name": "Spring Onion",
        "quantity": 1,
        "unit": "pc",
        "category": "produce"
      },
      {
        "name": "Salt",
        "quantity": 0.5,
        "unit": "tsp",
        "category": "pantry"
      },
      {
        "name": "Oil",
        "quantity": 2,
        "unit": "tbsp",
        "category": "pantry"
      }
    ],
    "vada-pav": [
      {
        "name": "Pav",
        "quantity": 2,
        "unit": "pcs",
        "category": "breads"
      },
      {
        "name": "Potato",
        "quantity": 3,
        "unit": "pcs",
        "category": "produce"
      },
      {
        "name": "Gram Flour",
        "quantity": 0.5,
        "unit": "cup",
        "category": "grains"
      },
      {
        "name": "Green Chilli",
        "quantity": 1,
        "unit": "pc",
        "category": "produce"
      },
      {
        "name": "Ginger",
        "quantity": 0.5,
        "unit": "inch",
        "category": "produce"
      },
      {
        "name": "Garlic",
        "quantity": 2,
        "unit": "pcs",
        "category": "produce"
      },
      {
        "name": "Mustard Seeds",
        "quantity": 0.5,
        "unit": "tsp",
        "category": "spices"
      },
      {
        "name": "Turmeric",
        "quantity": 0.5,
        "unit": "tsp",
        "category": "spices"
      },
      {
        "name": "Coriander Leaves",
        "quantity": 0.25,
        "unit": "cup",
        "category": "produce"
      },
      {
        "name": "Salt",
        "quantity": 1,
        "unit": "tsp",
        "category": "pantry"
      },
      {
        "name": "Oil",
        "quantity": 2,
        "unit": "tbsp",
        "category": "pantry"
      },
      {
        "name": "Garlic Chutney",
        "quantity": 1,
        "unit": "tbsp",
        "category": "pantry"
      }
    ],
    "mutton-xacuti": [
      {
        "name": "Mutton",
        "quantity": 200,
        "unit": "g",
        "category": "proteins",
        "inStock": false
      },
      {
        "name": "Ghee",
        "quantity": 2,
        "unit": "tbsp",
        "category": "pantry",
        "inStock": false
      },
      {
        "name": "Oil",
        "quantity": 2,
        "unit": "tbsp",
        "category": "pantry",
        "inStock": false
      },
      {
        "name": "Spices",
        "quantity": 1,
        "unit": "packet",
        "category": "spices",
        "inStock": false
      },
      {
        "name": "Onion",
        "quantity": 1,
        "unit": "pc",
        "category": "produce",
        "inStock": false
      },
      {
        "name": "Tomato",
        "quantity": 2,
        "unit": "pc",
        "category": "produce",
        "inStock": false
      },
      {
        "name": "Green Chilli",
        "quantity": 2,
        "unit": "pc",
        "category": "produce",
        "inStock": false
      },
      {
        "name": "Ginger-Garlic Paste",
        "quantity": 1,
        "unit": "tbsp",
        "category": "produce",
        "inStock": false
      },
      {
        "name": "Coriander Leaves",
        "quantity": 0.25,
        "unit": "cup",
        "category": "produce",
        "inStock": false
      },
      {
        "name": "Salt",
        "quantity": 1,
        "unit": "tsp",
        "category": "pantry"
      },
      {
        "name": "Turmeric",
        "quantity": 0.5,
        "unit": "tsp",
        "category": "spices"
      },
      {
        "name": "Cumin Seeds",
        "quantity": 1,
        "unit": "tsp",
        "category": "spices"
      },
      {
        "name": "Red Chili Powder",
        "quantity": 0.5,
        "unit": "tsp",
        "category": "spices"
      }
    ],
    "fish-malvani": [
      {
        "name": "Fish",
        "quantity": 150,
        "unit": "g",
        "category": "proteins",
        "inStock": false
      },
      {
        "name": "Ghee",
        "quantity": 2,
        "unit": "tbsp",
        "category": "pantry",
        "inStock": false
      },
      {
        "name": "Oil",
        "quantity": 2,
        "unit": "tbsp",
        "category": "pantry",
        "inStock": false
      },
      {
        "name": "Spices",
        "quantity": 1,
        "unit": "packet",
        "category": "spices",
        "inStock": false
      },
      {
        "name": "Rice",
        "quantity": 1,
        "unit": "cup",
        "category": "grains",
        "inStock": false
      },
      {
        "name": "Onion",
        "quantity": 1,
        "unit": "pc",
        "category": "produce",
        "inStock": false
      },
      {
        "name": "Tomato",
        "quantity": 2,
        "unit": "pc",
        "category": "produce",
        "inStock": false
      },
      {
        "name": "Green Chilli",
        "quantity": 2,
        "unit": "pc",
        "category": "produce",
        "inStock": false
      },
      {
        "name": "Ginger-Garlic Paste",
        "quantity": 1,
        "unit": "tbsp",
        "category": "produce",
        "inStock": false
      },
      {
        "name": "Coriander Leaves",
        "quantity": 0.25,
        "unit": "cup",
        "category": "produce",
        "inStock": false
      },
      {
        "name": "Salt",
        "quantity": 1,
        "unit": "tsp",
        "category": "pantry"
      },
      {
        "name": "Turmeric",
        "quantity": 0.5,
        "unit": "tsp",
        "category": "spices"
      },
      {
        "name": "Cumin Seeds",
        "quantity": 1,
        "unit": "tsp",
        "category": "spices"
      },
      {
        "name": "Red Chili Powder",
        "quantity": 0.5,
        "unit": "tsp",
        "category": "spices"
      }
    ],
    "north-aloo-gobhi-phulka": [
      {
        "name": "Potato",
        "quantity": 1,
        "unit": "pc",
        "category": "produce"
      },
      {
        "name": "Cauliflower",
        "quantity": 1,
        "unit": "pc",
        "category": "produce"
      },
      {
        "name": "Onion",
        "quantity": 0.5,
        "unit": "pc",
        "category": "produce"
      },
      {
        "name": "Tomato",
        "quantity": 1,
        "unit": "pc",
        "category": "produce"
      },
      {
        "name": "Oil",
        "quantity": 1.5,
        "unit": "tbsp",
        "category": "pantry"
      },
      {
        "name": "Salt",
        "quantity": 0.75,
        "unit": "tsp",
        "category": "pantry"
      },
      {
        "name": "Turmeric",
        "quantity": 0.25,
        "unit": "tsp",
        "category": "spices"
      },
      {
        "name": "Red Chili Powder",
        "quantity": 0.5,
        "unit": "tsp",
        "category": "spices"
      },
      {
        "name": "Cumin Seeds",
        "quantity": 0.5,
        "unit": "tsp",
        "category": "spices"
      },
      {
        "name": "Coriander Leaves",
        "quantity": 0.25,
        "unit": "cup",
        "category": "produce"
      },
      {
        "name": "Phulka",
        "quantity": 2,
        "unit": "pcs",
        "category": "grains",
        "inStock": false
      }
    ],
    "north-sarson-saag-makki": [
      {
        "name": "Mustard Greens",
        "quantity": 250,
        "unit": "g",
        "category": "produce",
        "inStock": false
      },
      {
        "name": "Spinach",
        "quantity": 100,
        "unit": "g",
        "category": "produce",
        "inStock": false
      },
      {
        "name": "Green Chilies",
        "quantity": 3,
        "unit": "pcs",
        "category": "produce",
        "inStock": false
      },
      {
        "name": "Ginger",
        "quantity": 15,
        "unit": "g",
        "category": "produce",
        "inStock": false
      },
      {
        "name": "Garlic",
        "quantity": 10,
        "unit": "g",
        "category": "produce",
        "inStock": false
      },
      {
        "name": "Ghee",
        "quantity": 2,
        "unit": "tbsp",
        "category": "pantry",
        "inStock": false
      },
      {
        "name": "Oil",
        "quantity": 2,
        "unit": "tbsp",
        "category": "pantry",
        "inStock": false
      },
      {
        "name": "Spices",
        "quantity": 1,
        "unit": "packet",
        "category": "spices",
        "inStock": false
      },
      {
        "name": "Onion",
        "quantity": 1,
        "unit": "pc",
        "category": "produce",
        "inStock": false
      },
      {
        "name": "Tomato",
        "quantity": 2,
        "unit": "pc",
        "category": "produce",
        "inStock": false
      },
      {
        "name": "Green Chilli",
        "quantity": 2,
        "unit": "pc",
        "category": "produce",
        "inStock": false
      },
      {
        "name": "Ginger-Garlic Paste",
        "quantity": 1,
        "unit": "tbsp",
        "category": "produce",
        "inStock": false
      },
      {
        "name": "Coriander Leaves",
        "quantity": 0.25,
        "unit": "cup",
        "category": "produce",
        "inStock": false
      },
      {
        "name": "Salt",
        "quantity": 1,
        "unit": "tsp",
        "category": "pantry"
      },
      {
        "name": "Turmeric",
        "quantity": 0.5,
        "unit": "tsp",
        "category": "spices"
      },
      {
        "name": "Cumin Seeds",
        "quantity": 1,
        "unit": "tsp",
        "category": "spices"
      },
      {
        "name": "Red Chili Powder",
        "quantity": 0.5,
        "unit": "tsp",
        "category": "spices"
      }
    ],
    "north-bhindi-masala": [
      {
        "name": "Okra",
        "quantity": 200,
        "unit": "g",
        "category": "produce",
        "inStock": false
      },
      {
        "name": "Onions",
        "quantity": 2,
        "unit": "pc",
        "category": "produce",
        "inStock": false
      },
      {
        "name": "Tomatoes",
        "quantity": 2,
        "unit": "pc",
        "category": "produce",
        "inStock": false
      },
      {
        "name": "Ghee",
        "quantity": 2,
        "unit": "tbsp",
        "category": "pantry",
        "inStock": false
      },
      {
        "name": "Oil",
        "quantity": 2,
        "unit": "tbsp",
        "category": "pantry",
        "inStock": false
      },
      {
        "name": "Spices",
        "quantity": 1,
        "unit": "packet",
        "category": "spices",
        "inStock": false
      },
      {
        "name": "Onion",
        "quantity": 1,
        "unit": "pc",
        "category": "produce",
        "inStock": false
      },
      {
        "name": "Tomato",
        "quantity": 2,
        "unit": "pc",
        "category": "produce",
        "inStock": false
      },
      {
        "name": "Green Chilli",
        "quantity": 2,
        "unit": "pc",
        "category": "produce",
        "inStock": false
      },
      {
        "name": "Ginger-Garlic Paste",
        "quantity": 1,
        "unit": "tbsp",
        "category": "produce",
        "inStock": false
      },
      {
        "name": "Coriander Leaves",
        "quantity": 0.25,
        "unit": "cup",
        "category": "produce",
        "inStock": false
      },
      {
        "name": "Salt",
        "quantity": 1,
        "unit": "tsp",
        "category": "pantry"
      },
      {
        "name": "Turmeric",
        "quantity": 0.5,
        "unit": "tsp",
        "category": "spices"
      },
      {
        "name": "Cumin Seeds",
        "quantity": 1,
        "unit": "tsp",
        "category": "spices"
      },
      {
        "name": "Red Chili Powder",
        "quantity": 0.5,
        "unit": "tsp",
        "category": "spices"
      }
    ],
    "north-matar-paneer": [
      {
        "name": "Paneer",
        "quantity": 200,
        "unit": "g",
        "category": "dairy"
      },
      {
        "name": "Green Peas",
        "quantity": 0.5,
        "unit": "cup",
        "category": "produce"
      },
      {
        "name": "Onion",
        "quantity": 1,
        "unit": "pc",
        "category": "produce"
      },
      {
        "name": "Tomato",
        "quantity": 2,
        "unit": "pcs",
        "category": "produce"
      },
      {
        "name": "Ginger-Garlic Paste",
        "quantity": 1,
        "unit": "tbsp",
        "category": "pantry"
      },
      {
        "name": "Oil",
        "quantity": 2,
        "unit": "tbsp",
        "category": "pantry"
      },
      {
        "name": "Salt",
        "quantity": 1,
        "unit": "tsp",
        "category": "pantry"
      },
      {
        "name": "Turmeric",
        "quantity": 0.25,
        "unit": "tsp",
        "category": "spices"
      },
      {
        "name": "Red Chili Powder",
        "quantity": 0.5,
        "unit": "tsp",
        "category": "spices"
      },
      {
        "name": "Garam Masala",
        "quantity": 0.5,
        "unit": "tsp",
        "category": "spices"
      },
      {
        "name": "Coriander Leaves",
        "quantity": 0.25,
        "unit": "cup",
        "category": "produce"
      }
    ],
    "north-baingan-bharta": [
      {
        "name": "Eggplant",
        "quantity": 300,
        "unit": "g",
        "category": "produce",
        "inStock": false
      },
      {
        "name": "Coriander Leaves",
        "quantity": 10,
        "unit": "g",
        "category": "produce",
        "inStock": false
      },
      {
        "name": "Lemon",
        "quantity": 0.5,
        "unit": "pc",
        "category": "produce",
        "inStock": false
      },
      {
        "name": "Ghee",
        "quantity": 2,
        "unit": "tbsp",
        "category": "pantry",
        "inStock": false
      },
      {
        "name": "Oil",
        "quantity": 2,
        "unit": "tbsp",
        "category": "pantry",
        "inStock": false
      },
      {
        "name": "Spices",
        "quantity": 1,
        "unit": "packet",
        "category": "spices",
        "inStock": false
      },
      {
        "name": "Onion",
        "quantity": 1,
        "unit": "pc",
        "category": "produce",
        "inStock": false
      },
      {
        "name": "Tomato",
        "quantity": 2,
        "unit": "pc",
        "category": "produce",
        "inStock": false
      },
      {
        "name": "Green Chilli",
        "quantity": 2,
        "unit": "pc",
        "category": "produce",
        "inStock": false
      },
      {
        "name": "Ginger-Garlic Paste",
        "quantity": 1,
        "unit": "tbsp",
        "category": "produce",
        "inStock": false
      },
      {
        "name": "Salt",
        "quantity": 1,
        "unit": "tsp",
        "category": "pantry"
      },
      {
        "name": "Turmeric",
        "quantity": 0.5,
        "unit": "tsp",
        "category": "spices"
      },
      {
        "name": "Cumin Seeds",
        "quantity": 1,
        "unit": "tsp",
        "category": "spices"
      },
      {
        "name": "Red Chili Powder",
        "quantity": 0.5,
        "unit": "tsp",
        "category": "spices"
      }
    ],
    "north-aloo-matar": [
      {
        "name": "Potatoes",
        "quantity": 3,
        "unit": "pc",
        "category": "produce",
        "inStock": false
      },
      {
        "name": "Green Peas",
        "quantity": 100,
        "unit": "g",
        "category": "produce",
        "inStock": false
      },
      {
        "name": "Ghee",
        "quantity": 2,
        "unit": "tbsp",
        "category": "pantry",
        "inStock": false
      },
      {
        "name": "Oil",
        "quantity": 2,
        "unit": "tbsp",
        "category": "pantry",
        "inStock": false
      },
      {
        "name": "Spices",
        "quantity": 1,
        "unit": "packet",
        "category": "spices",
        "inStock": false
      },
      {
        "name": "Onion",
        "quantity": 1,
        "unit": "pc",
        "category": "produce",
        "inStock": false
      },
      {
        "name": "Tomato",
        "quantity": 2,
        "unit": "pc",
        "category": "produce",
        "inStock": false
      },
      {
        "name": "Green Chilli",
        "quantity": 2,
        "unit": "pc",
        "category": "produce",
        "inStock": false
      },
      {
        "name": "Ginger-Garlic Paste",
        "quantity": 1,
        "unit": "tbsp",
        "category": "produce",
        "inStock": false
      },
      {
        "name": "Coriander Leaves",
        "quantity": 0.25,
        "unit": "cup",
        "category": "produce",
        "inStock": false
      },
      {
        "name": "Salt",
        "quantity": 1,
        "unit": "tsp",
        "category": "pantry"
      },
      {
        "name": "Turmeric",
        "quantity": 0.5,
        "unit": "tsp",
        "category": "spices"
      },
      {
        "name": "Cumin Seeds",
        "quantity": 1,
        "unit": "tsp",
        "category": "spices"
      },
      {
        "name": "Red Chili Powder",
        "quantity": 0.5,
        "unit": "tsp",
        "category": "spices"
      }
    ],
    "north-lauki-chana-dal": [
      {
        "name": "Chickpeas",
        "quantity": 1,
        "unit": "cup",
        "category": "grains",
        "inStock": false
      },
      {
        "name": "Mixed Dal",
        "quantity": 80,
        "unit": "g",
        "category": "proteins",
        "inStock": false
      },
      {
        "name": "Bottle Gourd",
        "quantity": 200,
        "unit": "g",
        "category": "produce",
        "inStock": false
      },
      {
        "name": "Ghee",
        "quantity": 2,
        "unit": "tbsp",
        "category": "pantry",
        "inStock": false
      },
      {
        "name": "Oil",
        "quantity": 2,
        "unit": "tbsp",
        "category": "pantry",
        "inStock": false
      },
      {
        "name": "Spices",
        "quantity": 1,
        "unit": "packet",
        "category": "spices",
        "inStock": false
      },
      {
        "name": "Chana Dal",
        "quantity": 80,
        "unit": "g",
        "category": "proteins",
        "inStock": false
      },
      {
        "name": "Toor Dal",
        "quantity": 1,
        "unit": "cup",
        "category": "grains",
        "inStock": false
      },
      {
        "name": "Onion",
        "quantity": 1,
        "unit": "pc",
        "category": "produce",
        "inStock": false
      },
      {
        "name": "Tomato",
        "quantity": 2,
        "unit": "pc",
        "category": "produce",
        "inStock": false
      },
      {
        "name": "Green Chilli",
        "quantity": 2,
        "unit": "pc",
        "category": "produce",
        "inStock": false
      },
      {
        "name": "Ginger-Garlic Paste",
        "quantity": 1,
        "unit": "tbsp",
        "category": "produce",
        "inStock": false
      },
      {
        "name": "Coriander Leaves",
        "quantity": 0.25,
        "unit": "cup",
        "category": "produce",
        "inStock": false
      },
      {
        "name": "Salt",
        "quantity": 1,
        "unit": "tsp",
        "category": "pantry"
      },
      {
        "name": "Turmeric",
        "quantity": 0.5,
        "unit": "tsp",
        "category": "spices"
      },
      {
        "name": "Cumin Seeds",
        "quantity": 1,
        "unit": "tsp",
        "category": "spices"
      }
    ],
    "north-karela-masala": [
      {
        "name": "Bitter Gourd",
        "quantity": 200,
        "unit": "g",
        "category": "produce",
        "inStock": false
      },
      {
        "name": "Onions",
        "quantity": 2,
        "unit": "pc",
        "category": "produce",
        "inStock": false
      },
      {
        "name": "Ghee",
        "quantity": 2,
        "unit": "tbsp",
        "category": "pantry",
        "inStock": false
      },
      {
        "name": "Oil",
        "quantity": 2,
        "unit": "tbsp",
        "category": "pantry",
        "inStock": false
      },
      {
        "name": "Spices",
        "quantity": 1,
        "unit": "packet",
        "category": "spices",
        "inStock": false
      },
      {
        "name": "Onion",
        "quantity": 1,
        "unit": "pc",
        "category": "produce",
        "inStock": false
      },
      {
        "name": "Tomato",
        "quantity": 2,
        "unit": "pc",
        "category": "produce",
        "inStock": false
      },
      {
        "name": "Green Chilli",
        "quantity": 2,
        "unit": "pc",
        "category": "produce",
        "inStock": false
      },
      {
        "name": "Ginger-Garlic Paste",
        "quantity": 1,
        "unit": "tbsp",
        "category": "produce",
        "inStock": false
      },
      {
        "name": "Coriander Leaves",
        "quantity": 0.25,
        "unit": "cup",
        "category": "produce",
        "inStock": false
      },
      {
        "name": "Salt",
        "quantity": 1,
        "unit": "tsp",
        "category": "pantry"
      },
      {
        "name": "Turmeric",
        "quantity": 0.5,
        "unit": "tsp",
        "category": "spices"
      },
      {
        "name": "Cumin Seeds",
        "quantity": 1,
        "unit": "tsp",
        "category": "spices"
      },
      {
        "name": "Red Chili Powder",
        "quantity": 0.5,
        "unit": "tsp",
        "category": "spices"
      }
    ],
    "egg-masala-west": [
      {
        "name": "Eggs",
        "quantity": 2,
        "unit": "pcs",
        "category": "proteins",
        "inStock": false
      },
      {
        "name": "White Bread",
        "quantity": 4,
        "unit": "pcs",
        "category": "breads",
        "inStock": false
      },
      {
        "name": "Milk",
        "quantity": 100,
        "unit": "ml",
        "category": "dairy",
        "inStock": false
      },
      {
        "name": "Sugar",
        "quantity": 2,
        "unit": "tbsp",
        "category": "pantry",
        "inStock": false
      },
      {
        "name": "Butter",
        "quantity": 20,
        "unit": "g",
        "category": "dairy",
        "inStock": false
      },
      {
        "name": "Ghee",
        "quantity": 2,
        "unit": "tbsp",
        "category": "pantry",
        "inStock": false
      },
      {
        "name": "Oil",
        "quantity": 2,
        "unit": "tbsp",
        "category": "pantry",
        "inStock": false
      },
      {
        "name": "Spices",
        "quantity": 1,
        "unit": "packet",
        "category": "spices",
        "inStock": false
      },
      {
        "name": "Onion",
        "quantity": 1,
        "unit": "pc",
        "category": "produce",
        "inStock": false
      },
      {
        "name": "Tomato",
        "quantity": 2,
        "unit": "pc",
        "category": "produce",
        "inStock": false
      },
      {
        "name": "Green Chilli",
        "quantity": 2,
        "unit": "pc",
        "category": "produce",
        "inStock": false
      },
      {
        "name": "Ginger-Garlic Paste",
        "quantity": 1,
        "unit": "tbsp",
        "category": "produce",
        "inStock": false
      },
      {
        "name": "Coriander Leaves",
        "quantity": 0.25,
        "unit": "cup",
        "category": "produce",
        "inStock": false
      },
      {
        "name": "Salt",
        "quantity": 1,
        "unit": "tsp",
        "category": "pantry"
      },
      {
        "name": "Turmeric",
        "quantity": 0.5,
        "unit": "tsp",
        "category": "spices"
      },
      {
        "name": "Cumin Seeds",
        "quantity": 1,
        "unit": "tsp",
        "category": "spices"
      },
      {
        "name": "Red Chili Powder",
        "quantity": 0.5,
        "unit": "tsp",
        "category": "spices"
      }
    ],
    "egg-keema": [
      {
        "name": "Egg",
        "quantity": 4,
        "unit": "pcs",
        "category": "proteins"
      },
      {
        "name": "Onion",
        "quantity": 1,
        "unit": "pc",
        "category": "produce"
      },
      {
        "name": "Tomato",
        "quantity": 2,
        "unit": "pcs",
        "category": "produce"
      },
      {
        "name": "Ginger-Garlic Paste",
        "quantity": 1,
        "unit": "tbsp",
        "category": "pantry"
      },
      {
        "name": "Green Chilli",
        "quantity": 2,
        "unit": "pcs",
        "category": "produce"
      },
      {
        "name": "Turmeric",
        "quantity": 0.5,
        "unit": "tsp",
        "category": "spices"
      },
      {
        "name": "Red Chili Powder",
        "quantity": 0.5,
        "unit": "tsp",
        "category": "spices"
      },
      {
        "name": "Garam Masala",
        "quantity": 1,
        "unit": "tsp",
        "category": "spices"
      },
      {
        "name": "Salt",
        "quantity": 1,
        "unit": "tsp",
        "category": "pantry"
      },
      {
        "name": "Oil",
        "quantity": 2,
        "unit": "tbsp",
        "category": "pantry"
      },
      {
        "name": "Coriander Leaves",
        "quantity": 0.25,
        "unit": "cup",
        "category": "produce"
      },
      {
        "name": "Rice",
        "quantity": 1,
        "unit": "cup",
        "category": "grains"
      }
    ],
    "bombay-omelette": [
      {
        "name": "Egg",
        "quantity": 3,
        "unit": "pcs",
        "category": "proteins"
      },
      {
        "name": "Onion",
        "quantity": 1,
        "unit": "pc",
        "category": "produce"
      },
      {
        "name": "Tomato",
        "quantity": 1,
        "unit": "pc",
        "category": "produce"
      },
      {
        "name": "Green Chilli",
        "quantity": 2,
        "unit": "pcs",
        "category": "produce"
      },
      {
        "name": "Coriander Leaves",
        "quantity": 0.25,
        "unit": "cup",
        "category": "produce"
      },
      {
        "name": "Turmeric",
        "quantity": 0.5,
        "unit": "tsp",
        "category": "spices"
      },
      {
        "name": "Salt",
        "quantity": 1,
        "unit": "tsp",
        "category": "pantry"
      },
      {
        "name": "Oil",
        "quantity": 1,
        "unit": "tbsp",
        "category": "pantry"
      },
      {
        "name": "Pav",
        "quantity": 2,
        "unit": "pcs",
        "category": "breads"
      }
    ],
    "sindhi-kofta": [
      {
        "name": "Potato",
        "quantity": 2,
        "unit": "pc",
        "category": "produce"
      },
      {
        "name": "Besan",
        "quantity": 0.5,
        "unit": "cup",
        "category": "grains"
      },
      {
        "name": "Onion",
        "quantity": 1,
        "unit": "pc",
        "category": "produce"
      },
      {
        "name": "Tomato",
        "quantity": 2,
        "unit": "pcs",
        "category": "produce"
      },
      {
        "name": "Yogurt",
        "quantity": 0.25,
        "unit": "cup",
        "category": "dairy"
      },
      {
        "name": "Ginger-Garlic Paste",
        "quantity": 1,
        "unit": "tbsp",
        "category": "pantry"
      },
      {
        "name": "Green Chilli",
        "quantity": 2,
        "unit": "pcs",
        "category": "produce"
      },
      {
        "name": "Turmeric",
        "quantity": 0.5,
        "unit": "tsp",
        "category": "spices"
      },
      {
        "name": "Red Chili Powder",
        "quantity": 0.5,
        "unit": "tsp",
        "category": "spices"
      },
      {
        "name": "Garam Masala",
        "quantity": 1,
        "unit": "tsp",
        "category": "spices"
      },
      {
        "name": "Salt",
        "quantity": 1,
        "unit": "tsp",
        "category": "pantry"
      },
      {
        "name": "Oil",
        "quantity": 2,
        "unit": "tbsp",
        "category": "pantry"
      },
      {
        "name": "Coriander Leaves",
        "quantity": 0.25,
        "unit": "cup",
        "category": "produce"
      },
      {
        "name": "Rice",
        "quantity": 1,
        "unit": "cup",
        "category": "grains"
      }
    ],
    "mumbai-kofta": [
      {
        "name": "Potato",
        "quantity": 2,
        "unit": "pc",
        "category": "produce"
      },
      {
        "name": "Mixed Vegetables",
        "quantity": 0.5,
        "unit": "cup",
        "category": "produce"
      },
      {
        "name": "Besan",
        "quantity": 0.25,
        "unit": "cup",
        "category": "grains"
      },
      {
        "name": "Green Peas",
        "quantity": 0.25,
        "unit": "cup",
        "category": "produce"
      },
      {
        "name": "Onion",
        "quantity": 1,
        "unit": "pc",
        "category": "produce"
      },
      {
        "name": "Tomato",
        "quantity": 2,
        "unit": "pcs",
        "category": "produce"
      },
      {
        "name": "Ginger-Garlic Paste",
        "quantity": 1,
        "unit": "tbsp",
        "category": "pantry"
      },
      {
        "name": "Green Chilli",
        "quantity": 2,
        "unit": "pcs",
        "category": "produce"
      },
      {
        "name": "Turmeric",
        "quantity": 0.5,
        "unit": "tsp",
        "category": "spices"
      },
      {
        "name": "Cumin Seeds",
        "quantity": 1,
        "unit": "tsp",
        "category": "spices"
      },
      {
        "name": "Red Chili Powder",
        "quantity": 0.5,
        "unit": "tsp",
        "category": "spices"
      },
      {
        "name": "Garam Masala",
        "quantity": 1,
        "unit": "tsp",
        "category": "spices"
      },
      {
        "name": "Salt",
        "quantity": 1,
        "unit": "tsp",
        "category": "pantry"
      },
      {
        "name": "Oil",
        "quantity": 2,
        "unit": "tbsp",
        "category": "pantry"
      },
      {
        "name": "Coriander Leaves",
        "quantity": 0.25,
        "unit": "cup",
        "category": "produce"
      },
      {
        "name": "Rice",
        "quantity": 1,
        "unit": "cup",
        "category": "grains"
      }
    ],
    "khandvi": [
      {
        "name": "Gram Flour (Besan)",
        "quantity": 1,
        "unit": "cup",
        "category": "grains"
      },
      {
        "name": "Yogurt",
        "quantity": 1,
        "unit": "cup",
        "category": "dairy"
      },
      {
        "name": "Turmeric",
        "quantity": 0.5,
        "unit": "tsp",
        "category": "spices"
      },
      {
        "name": "Ginger",
        "quantity": 0.5,
        "unit": "inch",
        "category": "produce"
      },
      {
        "name": "Green Chilli",
        "quantity": 1,
        "unit": "pc",
        "category": "produce"
      },
      {
        "name": "Salt",
        "quantity": 1,
        "unit": "tsp",
        "category": "pantry"
      },
      {
        "name": "Oil",
        "quantity": 1,
        "unit": "tbsp",
        "category": "pantry"
      },
      {
        "name": "Mustard Seeds",
        "quantity": 0.5,
        "unit": "tsp",
        "category": "spices"
      },
      {
        "name": "Sesame Seeds",
        "quantity": 1,
        "unit": "tsp",
        "category": "spices"
      },
      {
        "name": "Curry Leaves",
        "quantity": 1,
        "unit": "sprig",
        "category": "produce"
      },
      {
        "name": "Coriander Leaves",
        "quantity": 0.25,
        "unit": "cup",
        "category": "produce"
      }
    ],
    "methi-thepla": [
      {
        "name": "Wheat Flour (Atta)",
        "quantity": 200,
        "unit": "g",
        "category": "grains"
      },
      {
        "name": "Fenugreek Leaves",
        "quantity": 100,
        "unit": "g",
        "category": "produce"
      },
      {
        "name": "Yogurt",
        "quantity": 50,
        "unit": "g",
        "category": "dairy"
      },
      {
        "name": "Turmeric",
        "quantity": 0.5,
        "unit": "tsp",
        "category": "spices"
      },
      {
        "name": "Red Chili Powder",
        "quantity": 0.5,
        "unit": "tsp",
        "category": "spices"
      },
      {
        "name": "Ajwain",
        "quantity": 0.5,
        "unit": "tsp",
        "category": "spices"
      },
      {
        "name": "Salt",
        "quantity": 1,
        "unit": "tsp",
        "category": "pantry"
      },
      {
        "name": "Oil",
        "quantity": 2,
        "unit": "tbsp",
        "category": "pantry"
      }
    ],
    "veg-pulao": [
      {
        "name": "Basmati Rice",
        "quantity": 1,
        "unit": "cup",
        "category": "grains"
      },
      {
        "name": "Mixed Vegetables",
        "quantity": 1,
        "unit": "cup",
        "category": "produce"
      },
      {
        "name": "Ghee",
        "quantity": 2,
        "unit": "tbsp",
        "category": "dairy"
      },
      {
        "name": "Cumin Seeds",
        "quantity": 1,
        "unit": "tsp",
        "category": "spices"
      },
      {
        "name": "Bay Leaf",
        "quantity": 1,
        "unit": "pc",
        "category": "spices"
      },
      {
        "name": "Cloves",
        "quantity": 2,
        "unit": "pc",
        "category": "spices"
      },
      {
        "name": "Cardamom",
        "quantity": 2,
        "unit": "pods",
        "category": "spices"
      },
      {
        "name": "Cinnamon",
        "quantity": 1,
        "unit": "inch",
        "category": "spices"
      },
      {
        "name": "Onion",
        "quantity": 0.5,
        "unit": "pc",
        "category": "produce"
      },
      {
        "name": "Salt",
        "quantity": 1,
        "unit": "tsp",
        "category": "pantry"
      },
      {
        "name": "Water",
        "quantity": 2,
        "unit": "cup",
        "category": "pantry"
      },
      {
        "name": "Coriander Leaves",
        "quantity": 0.25,
        "unit": "cup",
        "category": "produce"
      }
    ],
    "undhiyu": [
      {
        "name": "Mixed Vegetables",
        "quantity": 300,
        "unit": "g",
        "category": "produce",
        "inStock": false
      },
      {
        "name": "Coconut",
        "quantity": 30,
        "unit": "g",
        "category": "produce",
        "inStock": false
      },
      {
        "name": "Ghee",
        "quantity": 2,
        "unit": "tbsp",
        "category": "pantry",
        "inStock": false
      },
      {
        "name": "Oil",
        "quantity": 2,
        "unit": "tbsp",
        "category": "pantry",
        "inStock": false
      },
      {
        "name": "Spices",
        "quantity": 1,
        "unit": "packet",
        "category": "spices",
        "inStock": false
      }
    ],
    "handvo": [
      {
        "name": "Rice",
        "quantity": 100,
        "unit": "g",
        "category": "grains",
        "inStock": false
      },
      {
        "name": "Bottle Gourd",
        "quantity": 200,
        "unit": "g",
        "category": "produce",
        "inStock": false
      },
      {
        "name": "Yogurt",
        "quantity": 100,
        "unit": "g",
        "category": "dairy",
        "inStock": false
      },
      {
        "name": "Ghee",
        "quantity": 2,
        "unit": "tbsp",
        "category": "pantry",
        "inStock": false
      },
      {
        "name": "Oil",
        "quantity": 2,
        "unit": "tbsp",
        "category": "pantry",
        "inStock": false
      },
      {
        "name": "Spices",
        "quantity": 1,
        "unit": "packet",
        "category": "spices",
        "inStock": false
      },
      {
        "name": "Salt",
        "quantity": 1,
        "unit": "tsp",
        "category": "pantry"
      },
      {
        "name": "Turmeric",
        "quantity": 0.5,
        "unit": "tsp",
        "category": "spices"
      },
      {
        "name": "Cumin Seeds",
        "quantity": 1,
        "unit": "tsp",
        "category": "spices"
      }
    ],
    "gujarati-kadhi": [
      {
        "name": "Yogurt",
        "quantity": 200,
        "unit": "g",
        "category": "dairy",
        "inStock": false
      },
      {
        "name": "Gram Flour",
        "quantity": 50,
        "unit": "g",
        "category": "grains",
        "inStock": false
      },
      {
        "name": "Ghee",
        "quantity": 2,
        "unit": "tbsp",
        "category": "pantry",
        "inStock": false
      },
      {
        "name": "Oil",
        "quantity": 2,
        "unit": "tbsp",
        "category": "pantry",
        "inStock": false
      },
      {
        "name": "Spices",
        "quantity": 1,
        "unit": "packet",
        "category": "spices",
        "inStock": false
      }
    ],
    "bhakri": [
      {
        "name": "Jowar Flour",
        "quantity": 1,
        "unit": "cup",
        "category": "grains"
      },
      {
        "name": "Water",
        "quantity": 0.75,
        "unit": "cup",
        "category": "pantry"
      },
      {
        "name": "Salt",
        "quantity": 0.5,
        "unit": "tsp",
        "category": "pantry"
      },
      {
        "name": "Oil",
        "quantity": 1,
        "unit": "tsp",
        "category": "pantry"
      }
    ],
    "jolada-roti": [
      {
        "name": "Jowar Flour",
        "quantity": 1,
        "unit": "cup",
        "category": "grains"
      },
      {
        "name": "Water",
        "quantity": 1,
        "unit": "cup",
        "category": "pantry"
      },
      {
        "name": "Salt",
        "quantity": 0.5,
        "unit": "tsp",
        "category": "pantry"
      },
      {
        "name": "Oil",
        "quantity": 1,
        "unit": "tsp",
        "category": "pantry"
      }
    ],
    "sev-vada": [
      {
        "name": "Urad Dal",
        "quantity": 1,
        "unit": "cup",
        "category": "proteins"
      },
      {
        "name": "Rice",
        "quantity": 2,
        "unit": "tbsp",
        "category": "grains"
      },
      {
        "name": "Onion",
        "quantity": 0.5,
        "unit": "pc",
        "category": "produce"
      },
      {
        "name": "Green Chilli",
        "quantity": 1,
        "unit": "pc",
        "category": "produce"
      },
      {
        "name": "Ginger",
        "quantity": 0.5,
        "unit": "inch",
        "category": "produce"
      },
      {
        "name": "Curry Leaves",
        "quantity": 1,
        "unit": "sprig",
        "category": "produce"
      },
      {
        "name": "Salt",
        "quantity": 1,
        "unit": "tsp",
        "category": "pantry"
      },
      {
        "name": "Oil",
        "quantity": 2,
        "unit": "cup",
        "category": "pantry"
      },
      {
        "name": "Sev",
        "quantity": 0.5,
        "unit": "cup",
        "category": "snacks"
      }
    ],
    "ragda-pattice": [
      {
        "name": "Potatoes",
        "quantity": 3,
        "unit": "pc",
        "category": "produce",
        "inStock": false
      },
      {
        "name": "Chickpeas",
        "quantity": 100,
        "unit": "g",
        "category": "grains",
        "inStock": false
      },
      {
        "name": "Tamarind Chutney",
        "quantity": 30,
        "unit": "g",
        "category": "pantry",
        "inStock": false
      },
      {
        "name": "Ghee",
        "quantity": 2,
        "unit": "tbsp",
        "category": "pantry",
        "inStock": false
      },
      {
        "name": "Oil",
        "quantity": 2,
        "unit": "tbsp",
        "category": "pantry",
        "inStock": false
      },
      {
        "name": "Spices",
        "quantity": 1,
        "unit": "packet",
        "category": "spices",
        "inStock": false
      }
    ],
    "kokam-sherbhat": [
      {
        "name": "Rice",
        "quantity": 1,
        "unit": "cup",
        "category": "grains"
      },
      {
        "name": "Kokam",
        "quantity": 6,
        "unit": "pcs",
        "category": "produce"
      },
      {
        "name": "Onion",
        "quantity": 1,
        "unit": "pc",
        "category": "produce"
      },
      {
        "name": "Green Chilli",
        "quantity": 1,
        "unit": "pc",
        "category": "produce"
      },
      {
        "name": "Turmeric",
        "quantity": 0.5,
        "unit": "tsp",
        "category": "spices"
      },
      {
        "name": "Salt",
        "quantity": 1,
        "unit": "tsp",
        "category": "pantry"
      },
      {
        "name": "Oil",
        "quantity": 1,
        "unit": "tbsp",
        "category": "pantry"
      }
    ],
    "shrikhand": [
      {
        "name": "Yogurt",
        "quantity": 500,
        "unit": "g",
        "category": "dairy"
      },
      {
        "name": "Sugar",
        "quantity": 0.5,
        "unit": "cup",
        "category": "pantry"
      },
      {
        "name": "Cardamom",
        "quantity": 2,
        "unit": "pods",
        "category": "spices"
      },
      {
        "name": "Saffron",
        "quantity": 0.25,
        "unit": "tsp",
        "category": "spices"
      },
      {
        "name": "Pistachios",
        "quantity": 2,
        "unit": "tbsp",
        "category": "pantry"
      }
    ],
    "basundi": [
      {
        "name": "Milk",
        "quantity": 500,
        "unit": "ml",
        "category": "dairy",
        "inStock": false
      },
      {
        "name": "Sugar",
        "quantity": 80,
        "unit": "g",
        "category": "pantry",
        "inStock": false
      },
      {
        "name": "Cardamom",
        "quantity": 2,
        "unit": "pods",
        "category": "spices"
      },
      {
        "name": "Raisins",
        "quantity": 2,
        "unit": "tbsp",
        "category": "pantry"
      },
      {
        "name": "Almonds",
        "quantity": 2,
        "unit": "tbsp",
        "category": "pantry"
      },
      {
        "name": "Pistachios",
        "quantity": 1,
        "unit": "tbsp",
        "category": "pantry"
      }
    ],
    "shankhali": [
      {
        "name": "All-Purpose Flour (Maida)",
        "quantity": 1.5,
        "unit": "cup",
        "category": "grains"
      },
      {
        "name": "Buttermilk",
        "quantity": 0.75,
        "unit": "cup",
        "category": "dairy"
      },
      {
        "name": "Turmeric",
        "quantity": 0.25,
        "unit": "tsp",
        "category": "spices"
      },
      {
        "name": "Ajwain",
        "quantity": 0.5,
        "unit": "tsp",
        "category": "spices"
      },
      {
        "name": "Salt",
        "quantity": 1,
        "unit": "tsp",
        "category": "pantry"
      },
      {
        "name": "Oil",
        "quantity": 2,
        "unit": "tbsp",
        "category": "pantry"
      }
    ],
    "khoba-roti": [
      {
        "name": "Wheat Flour (Atta)",
        "quantity": 250,
        "unit": "g",
        "category": "grains"
      },
      {
        "name": "Ajwain",
        "quantity": 0.5,
        "unit": "tsp",
        "category": "spices"
      },
      {
        "name": "Water",
        "quantity": 0.75,
        "unit": "cup",
        "category": "pantry"
      },
      {
        "name": "Salt",
        "quantity": 0.5,
        "unit": "tsp",
        "category": "pantry"
      },
      {
        "name": "Ghee",
        "quantity": 1,
        "unit": "tbsp",
        "category": "dairy"
      }
    ],
    "kokum-sharbat": [
      {
        "name": "Kokum Rind",
        "quantity": 5,
        "unit": "pieces",
        "category": "pantry"
      },
      {
        "name": "Sugar",
        "quantity": 20,
        "unit": "g",
        "category": "pantry"
      },
      {
        "name": "Black Salt",
        "quantity": 2,
        "unit": "g",
        "category": "pantry"
      },
      {
        "name": "Roasted Cumin Powder",
        "quantity": 2,
        "unit": "g",
        "category": "spices"
      },
      {
        "name": "Water",
        "quantity": 300,
        "unit": "ml",
        "category": "pantry"
      }
    ],
    "sol-kadhi": [
      {
        "name": "Kokum Rind",
        "quantity": 5,
        "unit": "pieces",
        "category": "pantry"
      },
      {
        "name": "Coconut Milk",
        "quantity": 200,
        "unit": "ml",
        "category": "pantry"
      },
      {
        "name": "Garlic",
        "quantity": 3,
        "unit": "cloves",
        "category": "produce"
      },
      {
        "name": "Green Chili",
        "quantity": 1,
        "unit": "pc",
        "category": "produce"
      },
      {
        "name": "Coriander Leaves",
        "quantity": 5,
        "unit": "g",
        "category": "produce"
      },
      {
        "name": "Salt",
        "quantity": 2,
        "unit": "g",
        "category": "pantry"
      }
    ],
    "aam-panna": [
      {
        "name": "Raw Mango",
        "quantity": 1,
        "unit": "pc",
        "category": "produce"
      },
      {
        "name": "Jaggery",
        "quantity": 20,
        "unit": "g",
        "category": "pantry"
      },
      {
        "name": "Black Salt",
        "quantity": 2,
        "unit": "g",
        "category": "pantry"
      },
      {
        "name": "Roasted Cumin Powder",
        "quantity": 2,
        "unit": "g",
        "category": "spices"
      },
      {
        "name": "Mint Leaves",
        "quantity": 5,
        "unit": "pieces",
        "category": "produce"
      },
      {
        "name": "Water",
        "quantity": 300,
        "unit": "ml",
        "category": "pantry"
      }
    ],
    "chikoo-shake": [
      {
        "name": "Chikoo",
        "quantity": 2,
        "unit": "pieces",
        "category": "produce"
      },
      {
        "name": "Milk",
        "quantity": 250,
        "unit": "ml",
        "category": "dairy"
      },
      {
        "name": "Sugar",
        "quantity": 5,
        "unit": "g",
        "category": "pantry"
      },
      {
        "name": "Cardamom",
        "quantity": 1,
        "unit": "pinch",
        "category": "spices"
      }
    ],
    "gathiya": [
      {
        "name": "Gram Flour (Besan)",
        "quantity": 100,
        "unit": "g",
        "category": "grains",
        "inStock": false
      },
      {
        "name": "Oil",
        "quantity": 30,
        "unit": "ml",
        "category": "pantry",
        "inStock": false
      },
      {
        "name": "Cumin",
        "quantity": 1,
        "unit": "tsp",
        "category": "spices",
        "inStock": false
      },
      {
        "name": "Ghee",
        "quantity": 2,
        "unit": "tbsp",
        "category": "pantry",
        "inStock": false
      },
      {
        "name": "Spices",
        "quantity": 1,
        "unit": "packet",
        "category": "spices",
        "inStock": false
      },
      {
        "name": "Milk",
        "quantity": 1,
        "unit": "cup",
        "category": "dairy"
      },
      {
        "name": "Sugar",
        "quantity": 1,
        "unit": "tsp",
        "category": "pantry"
      },
      {
        "name": "Tea Leaves",
        "quantity": 1,
        "unit": "tsp",
        "category": "pantry"
      }
    ],
    "dabeli": [
      {
        "name": "Potatoes",
        "quantity": 3,
        "unit": "pc",
        "category": "produce",
        "inStock": false
      },
      {
        "name": "Tamarind Chutney",
        "quantity": 30,
        "unit": "g",
        "category": "pantry",
        "inStock": false
      },
      {
        "name": "Ghee",
        "quantity": 2,
        "unit": "tbsp",
        "category": "pantry",
        "inStock": false
      },
      {
        "name": "Oil",
        "quantity": 2,
        "unit": "tbsp",
        "category": "pantry",
        "inStock": false
      },
      {
        "name": "Spices",
        "quantity": 1,
        "unit": "packet",
        "category": "spices",
        "inStock": false
      },
      {
        "name": "Onion",
        "quantity": 1,
        "unit": "pc",
        "category": "produce",
        "inStock": false
      },
      {
        "name": "Tomato",
        "quantity": 2,
        "unit": "pc",
        "category": "produce",
        "inStock": false
      },
      {
        "name": "Green Chilli",
        "quantity": 2,
        "unit": "pc",
        "category": "produce",
        "inStock": false
      },
      {
        "name": "Ginger-Garlic Paste",
        "quantity": 1,
        "unit": "tbsp",
        "category": "produce",
        "inStock": false
      },
      {
        "name": "Coriander Leaves",
        "quantity": 0.25,
        "unit": "cup",
        "category": "produce",
        "inStock": false
      },
      {
        "name": "Salt",
        "quantity": 1,
        "unit": "tsp",
        "category": "pantry"
      },
      {
        "name": "Turmeric",
        "quantity": 0.5,
        "unit": "tsp",
        "category": "spices"
      },
      {
        "name": "Cumin Seeds",
        "quantity": 1,
        "unit": "tsp",
        "category": "spices"
      },
      {
        "name": "Red Chili Powder",
        "quantity": 0.5,
        "unit": "tsp",
        "category": "spices"
      }
    ],
    "chorafali": [
      {
        "name": "Urad Flour",
        "quantity": 1,
        "unit": "cup",
        "category": "grains"
      },
      {
        "name": "Gram Flour",
        "quantity": 0.5,
        "unit": "cup",
        "category": "grains"
      },
      {
        "name": "Red Chili Powder",
        "quantity": 1,
        "unit": "tsp",
        "category": "spices"
      },
      {
        "name": "Dry Mango Powder",
        "quantity": 1,
        "unit": "tsp",
        "category": "spices"
      },
      {
        "name": "Black Salt",
        "quantity": 0.5,
        "unit": "tsp",
        "category": "pantry"
      },
      {
        "name": "Oil",
        "quantity": 1,
        "unit": "cup",
        "category": "pantry"
      },
      {
        "name": "Salt",
        "quantity": 0.5,
        "unit": "tsp",
        "category": "pantry"
      }
    ],
    "doodhpak": [
      {
        "name": "Milk",
        "quantity": 2,
        "unit": "cup",
        "category": "dairy"
      },
      {
        "name": "Basmati Rice",
        "quantity": 0.5,
        "unit": "cup",
        "category": "grains"
      },
      {
        "name": "Sugar",
        "quantity": 0.5,
        "unit": "cup",
        "category": "pantry"
      },
      {
        "name": "Cardamom",
        "quantity": 3,
        "unit": "pcs",
        "category": "spices"
      },
      {
        "name": "Saffron",
        "quantity": 0.25,
        "unit": "tsp",
        "category": "spices"
      },
      {
        "name": "Almonds",
        "quantity": 10,
        "unit": "pcs",
        "category": "pantry"
      },
      {
        "name": "Pistachios",
        "quantity": 10,
        "unit": "pcs",
        "category": "pantry"
      },
      {
        "name": "Raisins",
        "quantity": 2,
        "unit": "tbsp",
        "category": "pantry"
      },
      {
        "name": "Ghee",
        "quantity": 1,
        "unit": "tbsp",
        "category": "dairy"
      }
    ],
    "khakhra": [
      {
        "name": "Wheat Flour (Atta)",
        "quantity": 200,
        "unit": "g",
        "category": "grains"
      },
      {
        "name": "Ajwain",
        "quantity": 0.5,
        "unit": "tsp",
        "category": "spices"
      },
      {
        "name": "Salt",
        "quantity": 0.5,
        "unit": "tsp",
        "category": "pantry"
      },
      {
        "name": "Oil",
        "quantity": 1,
        "unit": "tbsp",
        "category": "pantry"
      },
      {
        "name": "Fenugreek Leaves",
        "quantity": 50,
        "unit": "g",
        "category": "produce"
      }
    ],
    "murghanu-shaak": [
      {
        "name": "Chicken",
        "quantity": 250,
        "unit": "g",
        "category": "proteins",
        "inStock": false
      },
      {
        "name": "Ghee",
        "quantity": 2,
        "unit": "tbsp",
        "category": "pantry",
        "inStock": false
      },
      {
        "name": "Oil",
        "quantity": 2,
        "unit": "tbsp",
        "category": "pantry",
        "inStock": false
      },
      {
        "name": "Spices",
        "quantity": 1,
        "unit": "packet",
        "category": "spices",
        "inStock": false
      },
      {
        "name": "Salt",
        "quantity": 1,
        "unit": "tsp",
        "category": "pantry"
      },
      {
        "name": "Turmeric",
        "quantity": 0.5,
        "unit": "tsp",
        "category": "spices"
      },
      {
        "name": "Cumin Seeds",
        "quantity": 1,
        "unit": "tsp",
        "category": "spices"
      },
      {
        "name": "Red Chili Powder",
        "quantity": 0.5,
        "unit": "tsp",
        "category": "spices"
      }
    ],
    "gota": [
      {
        "name": "Gram Flour",
        "quantity": 1,
        "unit": "cup",
        "category": "grains"
      },
      {
        "name": "Fenugreek Leaves",
        "quantity": 100,
        "unit": "g",
        "category": "produce"
      },
      {
        "name": "Yogurt",
        "quantity": 2,
        "unit": "tbsp",
        "category": "dairy"
      },
      {
        "name": "Turmeric",
        "quantity": 0.25,
        "unit": "tsp",
        "category": "spices"
      },
      {
        "name": "Red Chilli Powder",
        "quantity": 0.5,
        "unit": "tsp",
        "category": "spices"
      },
      {
        "name": "Asafoetida",
        "quantity": 1,
        "unit": "pinch",
        "category": "spices"
      },
      {
        "name": "Salt",
        "quantity": 1,
        "unit": "tsp",
        "category": "pantry"
      },
      {
        "name": "Oil",
        "quantity": 2,
        "unit": "tbsp",
        "category": "pantry"
      }
    ],
    "sev-tameta-nu-shak": [
      {
        "name": "Tomato",
        "quantity": 4,
        "unit": "pc",
        "category": "produce"
      },
      {
        "name": "Sev",
        "quantity": 1,
        "unit": "cup",
        "category": "snacks"
      },
      {
        "name": "Onion",
        "quantity": 0.5,
        "unit": "pc",
        "category": "produce"
      },
      {
        "name": "Green Chilli",
        "quantity": 1,
        "unit": "pc",
        "category": "produce"
      },
      {
        "name": "Ginger",
        "quantity": 1,
        "unit": "inch",
        "category": "produce"
      },
      {
        "name": "Garlic",
        "quantity": 3,
        "unit": "cloves",
        "category": "produce"
      },
      {
        "name": "Mustard Seeds",
        "quantity": 0.5,
        "unit": "tsp",
        "category": "spices"
      },
      {
        "name": "Cumin Seeds",
        "quantity": 0.5,
        "unit": "tsp",
        "category": "spices"
      },
      {
        "name": "Turmeric",
        "quantity": 0.5,
        "unit": "tsp",
        "category": "spices"
      },
      {
        "name": "Red Chilli Powder",
        "quantity": 0.5,
        "unit": "tsp",
        "category": "spices"
      },
      {
        "name": "Salt",
        "quantity": 1,
        "unit": "tsp",
        "category": "pantry"
      },
      {
        "name": "Oil",
        "quantity": 1,
        "unit": "tbsp",
        "category": "pantry"
      },
      {
        "name": "Coriander Leaves",
        "quantity": 0.25,
        "unit": "cup",
        "category": "produce"
      },
      {
        "name": "Roti",
        "quantity": 2,
        "unit": "pc",
        "category": "breads"
      }
    ],
    "lilva-kachori": [
      {
        "name": "Potatoes",
        "quantity": 3,
        "unit": "pc",
        "category": "produce",
        "inStock": false
      },
      {
        "name": "Peas",
        "quantity": 50,
        "unit": "g",
        "category": "produce",
        "inStock": false
      },
      {
        "name": "Wheat Flour",
        "quantity": 200,
        "unit": "g",
        "category": "grains",
        "inStock": false
      },
      {
        "name": "Ghee",
        "quantity": 2,
        "unit": "tbsp",
        "category": "pantry",
        "inStock": false
      },
      {
        "name": "Oil",
        "quantity": 2,
        "unit": "tbsp",
        "category": "pantry",
        "inStock": false
      },
      {
        "name": "Spices",
        "quantity": 1,
        "unit": "packet",
        "category": "spices",
        "inStock": false
      }
    ],
    "fafda-jalebi": [
      {
        "name": "Gram Flour (Besan)",
        "quantity": 1,
        "unit": "cup",
        "category": "grains"
      },
      {
        "name": "Maida",
        "quantity": 0.5,
        "unit": "cup",
        "category": "grains"
      },
      {
        "name": "Sugar",
        "quantity": 1,
        "unit": "cup",
        "category": "pantry"
      },
      {
        "name": "Saffron",
        "quantity": 1,
        "unit": "pinch",
        "category": "spices"
      },
      {
        "name": "Cardamom",
        "quantity": 1,
        "unit": "tsp",
        "category": "spices"
      },
      {
        "name": "Yogurt",
        "quantity": 0.25,
        "unit": "cup",
        "category": "dairy"
      },
      {
        "name": "Oil",
        "quantity": 2,
        "unit": "cup",
        "category": "pantry"
      },
      {
        "name": "Baking Soda",
        "quantity": 0.5,
        "unit": "tsp",
        "category": "pantry"
      },
      {
        "name": "Water",
        "quantity": 1,
        "unit": "cup",
        "category": "pantry"
      },
      {
        "name": "Ghee",
        "quantity": 1,
        "unit": "tbsp",
        "category": "dairy"
      }
    ],
    "muthiya": [
      {
        "name": "Wheat Flour",
        "quantity": 150,
        "unit": "g",
        "category": "grains",
        "inStock": false
      },
      {
        "name": "Bottle Gourd",
        "quantity": 100,
        "unit": "g",
        "category": "produce",
        "inStock": false
      },
      {
        "name": "Ghee",
        "quantity": 2,
        "unit": "tbsp",
        "category": "pantry",
        "inStock": false
      },
      {
        "name": "Oil",
        "quantity": 2,
        "unit": "tbsp",
        "category": "pantry",
        "inStock": false
      },
      {
        "name": "Spices",
        "quantity": 1,
        "unit": "packet",
        "category": "spices",
        "inStock": false
      },
      {
        "name": "Milk",
        "quantity": 1,
        "unit": "cup",
        "category": "dairy"
      },
      {
        "name": "Sugar",
        "quantity": 1,
        "unit": "tsp",
        "category": "pantry"
      },
      {
        "name": "Tea Leaves",
        "quantity": 1,
        "unit": "tsp",
        "category": "pantry"
      }
    ],
    "bharli-vangi": [
      {
        "name": "Eggplant",
        "quantity": 3,
        "unit": "pc",
        "category": "produce",
        "inStock": false
      },
      {
        "name": "Peanuts",
        "quantity": 30,
        "unit": "g",
        "category": "proteins",
        "inStock": false
      },
      {
        "name": "Coconut",
        "quantity": 30,
        "unit": "g",
        "category": "produce",
        "inStock": false
      },
      {
        "name": "Ghee",
        "quantity": 2,
        "unit": "tbsp",
        "category": "pantry",
        "inStock": false
      },
      {
        "name": "Oil",
        "quantity": 2,
        "unit": "tbsp",
        "category": "pantry",
        "inStock": false
      },
      {
        "name": "Spices",
        "quantity": 1,
        "unit": "packet",
        "category": "spices",
        "inStock": false
      },
      {
        "name": "Onion",
        "quantity": 1,
        "unit": "pc",
        "category": "produce",
        "inStock": false
      },
      {
        "name": "Tomato",
        "quantity": 2,
        "unit": "pc",
        "category": "produce",
        "inStock": false
      },
      {
        "name": "Green Chilli",
        "quantity": 2,
        "unit": "pc",
        "category": "produce",
        "inStock": false
      },
      {
        "name": "Ginger-Garlic Paste",
        "quantity": 1,
        "unit": "tbsp",
        "category": "produce",
        "inStock": false
      },
      {
        "name": "Coriander Leaves",
        "quantity": 0.25,
        "unit": "cup",
        "category": "produce",
        "inStock": false
      },
      {
        "name": "Salt",
        "quantity": 1,
        "unit": "tsp",
        "category": "pantry"
      },
      {
        "name": "Turmeric",
        "quantity": 0.5,
        "unit": "tsp",
        "category": "spices"
      },
      {
        "name": "Cumin Seeds",
        "quantity": 1,
        "unit": "tsp",
        "category": "spices"
      },
      {
        "name": "Red Chili Powder",
        "quantity": 0.5,
        "unit": "tsp",
        "category": "spices"
      }
    ],
    "andyacha-rassa": [
      {
        "name": "Eggs",
        "quantity": 4,
        "unit": "pcs",
        "category": "proteins"
      },
      {
        "name": "Onion",
        "quantity": 1,
        "unit": "pc",
        "category": "produce"
      },
      {
        "name": "Tomato",
        "quantity": 2,
        "unit": "pc",
        "category": "produce"
      },
      {
        "name": "Ginger-Garlic Paste",
        "quantity": 1,
        "unit": "tbsp",
        "category": "pantry"
      },
      {
        "name": "Gram Flour",
        "quantity": 2,
        "unit": "tbsp",
        "category": "grains"
      },
      {
        "name": "Tamarind",
        "quantity": 15,
        "unit": "g",
        "category": "pantry"
      },
      {
        "name": "Red Chili Powder",
        "quantity": 0.5,
        "unit": "tsp",
        "category": "spices"
      },
      {
        "name": "Goda Masala",
        "quantity": 1,
        "unit": "tsp",
        "category": "spices"
      },
      {
        "name": "Turmeric",
        "quantity": 0.5,
        "unit": "tsp",
        "category": "spices"
      },
      {
        "name": "Curry Leaves",
        "quantity": 5,
        "unit": "pcs",
        "category": "produce"
      },
      {
        "name": "Mustard Seeds",
        "quantity": 0.5,
        "unit": "tsp",
        "category": "spices"
      },
      {
        "name": "Salt",
        "quantity": 1,
        "unit": "tsp",
        "category": "pantry"
      },
      {
        "name": "Oil",
        "quantity": 2,
        "unit": "tbsp",
        "category": "pantry"
      },
      {
        "name": "Rice",
        "quantity": 1,
        "unit": "cup",
        "category": "grains"
      }
    ],
    "kheema-pav": [
      {
        "name": "Minced Lamb",
        "quantity": 200,
        "unit": "g",
        "category": "proteins"
      },
      {
        "name": "Onions",
        "quantity": 2,
        "unit": "pc",
        "category": "produce"
      },
      {
        "name": "Tomatoes",
        "quantity": 2,
        "unit": "pc",
        "category": "produce"
      },
      {
        "name": "Garlic",
        "quantity": 10,
        "unit": "g",
        "category": "produce"
      },
      {
        "name": "Ginger",
        "quantity": 10,
        "unit": "g",
        "category": "produce"
      },
      {
        "name": "Curry Leaves",
        "quantity": 5,
        "unit": "pieces",
        "category": "produce"
      },
      {
        "name": "Coconut Milk",
        "quantity": 100,
        "unit": "ml",
        "category": "pantry"
      },
      {
        "name": "Cardamom",
        "quantity": 2,
        "unit": "pieces",
        "category": "spices"
      },
      {
        "name": "Cinnamon",
        "quantity": 1,
        "unit": "piece",
        "category": "spices"
      },
      {
        "name": "Cloves",
        "quantity": 3,
        "unit": "pieces",
        "category": "spices"
      },
      {
        "name": "Star Anise",
        "quantity": 1,
        "unit": "piece",
        "category": "spices"
      },
      {
        "name": "Vinegar",
        "quantity": 10,
        "unit": "ml",
        "category": "pantry"
      }
    ],
    "kheema-per-eeda": [
      {
        "name": "Minced Lamb",
        "quantity": 200,
        "unit": "g",
        "category": "proteins"
      },
      {
        "name": "Onions",
        "quantity": 2,
        "unit": "pc",
        "category": "produce"
      },
      {
        "name": "Tomatoes",
        "quantity": 2,
        "unit": "pc",
        "category": "produce"
      },
      {
        "name": "Ginger",
        "quantity": 10,
        "unit": "g",
        "category": "produce"
      },
      {
        "name": "Garlic",
        "quantity": 10,
        "unit": "g",
        "category": "produce"
      },
      {
        "name": "Green Chillies",
        "quantity": 3,
        "unit": "pc",
        "category": "produce"
      },
      {
        "name": "Turmeric",
        "quantity": 2,
        "unit": "g",
        "category": "spices"
      },
      {
        "name": "Kashmiri Chilli Powder",
        "quantity": 5,
        "unit": "g",
        "category": "spices"
      },
      {
        "name": "Vinegar",
        "quantity": 10,
        "unit": "ml",
        "category": "pantry"
      },
      {
        "name": "Eggs",
        "quantity": 2,
        "unit": "pc",
        "category": "proteins"
      },
      {
        "name": "Coriander",
        "quantity": 10,
        "unit": "g",
        "category": "produce"
      }
    ],
    "parsi-gosht-ma-kari": [
      {
        "name": "Lamb",
        "quantity": 250,
        "unit": "g",
        "category": "proteins"
      },
      {
        "name": "Coconut",
        "quantity": 50,
        "unit": "g",
        "category": "produce"
      },
      {
        "name": "Poppy Seeds",
        "quantity": 10,
        "unit": "g",
        "category": "pantry"
      },
      {
        "name": "Sesame Seeds",
        "quantity": 10,
        "unit": "g",
        "category": "pantry"
      },
      {
        "name": "Cashew Nuts",
        "quantity": 15,
        "unit": "g",
        "category": "produce"
      },
      {
        "name": "Dried Kashmiri Chillies",
        "quantity": 4,
        "unit": "pc",
        "category": "produce"
      },
      {
        "name": "Coriander Seeds",
        "quantity": 5,
        "unit": "g",
        "category": "spices"
      },
      {
        "name": "Garlic",
        "quantity": 10,
        "unit": "g",
        "category": "produce"
      },
      {
        "name": "Ginger",
        "quantity": 10,
        "unit": "g",
        "category": "produce"
      },
      {
        "name": "Tamarind",
        "quantity": 15,
        "unit": "g",
        "category": "pantry"
      },
      {
        "name": "Mutton",
        "quantity": 200,
        "unit": "g",
        "category": "proteins",
        "inStock": false
      }
    ],
    "mumbai-frankie-rolls": [
      {
        "name": "Lamb",
        "quantity": 150,
        "unit": "g",
        "category": "proteins"
      },
      {
        "name": "Parathas",
        "quantity": 2,
        "unit": "pc",
        "category": "breads"
      },
      {
        "name": "Eggs",
        "quantity": 2,
        "unit": "pc",
        "category": "proteins"
      },
      {
        "name": "Mint",
        "quantity": 10,
        "unit": "g",
        "category": "produce"
      },
      {
        "name": "Coriander",
        "quantity": 10,
        "unit": "g",
        "category": "produce"
      },
      {
        "name": "Ginger",
        "quantity": 5,
        "unit": "g",
        "category": "produce"
      },
      {
        "name": "Garlic",
        "quantity": 5,
        "unit": "g",
        "category": "produce"
      },
      {
        "name": "Garam Masala",
        "quantity": 3,
        "unit": "g",
        "category": "spices"
      },
      {
        "name": "Yoghurt",
        "quantity": 30,
        "unit": "ml",
        "category": "dairy"
      },
      {
        "name": "Vinegar",
        "quantity": 5,
        "unit": "ml",
        "category": "pantry"
      }
    ],
    "kanda-papeta-per-eda": [
      {
        "name": "Eggs",
        "quantity": 3,
        "unit": "pc",
        "category": "proteins"
      },
      {
        "name": "Onion",
        "quantity": 2,
        "unit": "pc",
        "category": "produce"
      },
      {
        "name": "Potatoes",
        "quantity": 2,
        "unit": "pc",
        "category": "produce"
      },
      {
        "name": "Green Chillies",
        "quantity": 2,
        "unit": "pc",
        "category": "produce"
      },
      {
        "name": "Cumin Seeds",
        "quantity": 3,
        "unit": "g",
        "category": "spices"
      },
      {
        "name": "Black Pepper",
        "quantity": 2,
        "unit": "g",
        "category": "spices"
      },
      {
        "name": "Coriander",
        "quantity": 10,
        "unit": "g",
        "category": "produce"
      }
    ],
    "parsi-lamb-cutlets": [
      {
        "name": "Minced Lamb",
        "quantity": 200,
        "unit": "g",
        "category": "proteins"
      },
      {
        "name": "Garam Masala",
        "quantity": 3,
        "unit": "g",
        "category": "spices"
      },
      {
        "name": "Onion",
        "quantity": 1,
        "unit": "pc",
        "category": "produce"
      },
      {
        "name": "Garlic",
        "quantity": 5,
        "unit": "g",
        "category": "produce"
      },
      {
        "name": "Ginger",
        "quantity": 5,
        "unit": "g",
        "category": "produce"
      },
      {
        "name": "Green Chillies",
        "quantity": 2,
        "unit": "pc",
        "category": "produce"
      },
      {
        "name": "Mint",
        "quantity": 10,
        "unit": "g",
        "category": "produce"
      },
      {
        "name": "Breadcrumbs",
        "quantity": 30,
        "unit": "g",
        "category": "pantry"
      },
      {
        "name": "Eggs",
        "quantity": 1,
        "unit": "pc",
        "category": "proteins"
      }
    ],
    "sindhi-aloo-tuk": [
      {
        "name": "Potatoes",
        "quantity": 3,
        "unit": "pc",
        "category": "produce"
      },
      {
        "name": "Coriander Powder",
        "quantity": 1,
        "unit": "tsp",
        "category": "spices"
      },
      {
        "name": "Cumin Seeds",
        "quantity": 1,
        "unit": "tsp",
        "category": "spices"
      },
      {
        "name": "Red Chilli Powder",
        "quantity": 0.5,
        "unit": "tsp",
        "category": "spices"
      },
      {
        "name": "Salt",
        "quantity": 1,
        "unit": "tsp",
        "category": "pantry"
      },
      {
        "name": "Oil",
        "quantity": 2,
        "unit": "tbsp",
        "category": "pantry"
      },
      {
        "name": "Coriander Leaves",
        "quantity": 0.25,
        "unit": "cup",
        "category": "produce"
      }
    ],
    "sindhi-kadhi": [
      {
        "name": "Yogurt",
        "quantity": 200,
        "unit": "g",
        "category": "dairy",
        "inStock": false
      },
      {
        "name": "Gram Flour",
        "quantity": 50,
        "unit": "g",
        "category": "grains",
        "inStock": false
      },
      {
        "name": "Ghee",
        "quantity": 2,
        "unit": "tbsp",
        "category": "pantry",
        "inStock": false
      },
      {
        "name": "Oil",
        "quantity": 2,
        "unit": "tbsp",
        "category": "pantry",
        "inStock": false
      },
      {
        "name": "Spices",
        "quantity": 1,
        "unit": "packet",
        "category": "spices",
        "inStock": false
      }
    ],
    "sindhi-koki": [
      {
        "name": "Wheat Flour (Atta)",
        "quantity": 200,
        "unit": "g",
        "category": "grains",
        "inStock": false
      },
      {
        "name": "Onions",
        "quantity": 1,
        "unit": "pc",
        "category": "produce",
        "inStock": false
      },
      {
        "name": "Green Chilli",
        "quantity": 2,
        "unit": "pc",
        "category": "produce",
        "inStock": false
      },
      {
        "name": "Coriander",
        "quantity": 10,
        "unit": "g",
        "category": "produce",
        "inStock": false
      },
      {
        "name": "Ghee",
        "quantity": 30,
        "unit": "g",
        "category": "dairy",
        "inStock": false
      },
      {
        "name": "Ghee",
        "quantity": 2,
        "unit": "tbsp",
        "category": "pantry",
        "inStock": false
      },
      {
        "name": "Oil",
        "quantity": 2,
        "unit": "tbsp",
        "category": "pantry",
        "inStock": false
      },
      {
        "name": "Spices",
        "quantity": 1,
        "unit": "packet",
        "category": "spices",
        "inStock": false
      }
    ],
    "murghi-na-farcha": [
      {
        "name": "Chicken",
        "quantity": 400,
        "unit": "g",
        "category": "proteins"
      },
      {
        "name": "Yogurt",
        "quantity": 0.5,
        "unit": "cup",
        "category": "dairy"
      },
      {
        "name": "Ginger-Garlic Paste",
        "quantity": 1,
        "unit": "tbsp",
        "category": "pantry"
      },
      {
        "name": "Red Chilli Powder",
        "quantity": 1,
        "unit": "tsp",
        "category": "spices"
      },
      {
        "name": "Turmeric",
        "quantity": 0.5,
        "unit": "tsp",
        "category": "spices"
      },
      {
        "name": "Lemon Juice",
        "quantity": 1,
        "unit": "tbsp",
        "category": "pantry"
      },
      {
        "name": "Eggs",
        "quantity": 1,
        "unit": "pc",
        "category": "proteins"
      },
      {
        "name": "Gram Flour",
        "quantity": 0.5,
        "unit": "cup",
        "category": "grains"
      },
      {
        "name": "Salt",
        "quantity": 1,
        "unit": "tsp",
        "category": "pantry"
      },
      {
        "name": "Oil",
        "quantity": 2,
        "unit": "tbsp",
        "category": "pantry"
      }
    ],
    "luchi-aloo": [
      {
        "name": "All-Purpose Flour (Maida)",
        "quantity": 1,
        "unit": "cup",
        "category": "grains"
      },
      {
        "name": "Potatoes",
        "quantity": 3,
        "unit": "pc",
        "category": "produce"
      },
      {
        "name": "Onion",
        "quantity": 1,
        "unit": "pc",
        "category": "produce"
      },
      {
        "name": "Ginger",
        "quantity": 1,
        "unit": "inch",
        "category": "produce"
      },
      {
        "name": "Green Chilli",
        "quantity": 2,
        "unit": "pc",
        "category": "produce"
      },
      {
        "name": "Turmeric",
        "quantity": 0.5,
        "unit": "tsp",
        "category": "spices"
      },
      {
        "name": "Cumin Seeds",
        "quantity": 0.5,
        "unit": "tsp",
        "category": "spices"
      },
      {
        "name": "Salt",
        "quantity": 1,
        "unit": "tsp",
        "category": "pantry"
      },
      {
        "name": "Oil",
        "quantity": 2,
        "unit": "tbsp",
        "category": "pantry"
      }
    ],
    "machher-jhol": [
      {
        "name": "Fish",
        "quantity": 150,
        "unit": "g",
        "category": "proteins",
        "inStock": false
      },
      {
        "name": "Turmeric",
        "quantity": 1,
        "unit": "tsp",
        "category": "spices",
        "inStock": false
      },
      {
        "name": "Ghee",
        "quantity": 2,
        "unit": "tbsp",
        "category": "pantry",
        "inStock": false
      },
      {
        "name": "Oil",
        "quantity": 2,
        "unit": "tbsp",
        "category": "pantry",
        "inStock": false
      },
      {
        "name": "Spices",
        "quantity": 1,
        "unit": "packet",
        "category": "spices",
        "inStock": false
      },
      {
        "name": "Onion",
        "quantity": 1,
        "unit": "pc",
        "category": "produce",
        "inStock": false
      },
      {
        "name": "Tomato",
        "quantity": 2,
        "unit": "pc",
        "category": "produce",
        "inStock": false
      },
      {
        "name": "Green Chilli",
        "quantity": 2,
        "unit": "pc",
        "category": "produce",
        "inStock": false
      },
      {
        "name": "Ginger-Garlic Paste",
        "quantity": 1,
        "unit": "tbsp",
        "category": "produce",
        "inStock": false
      },
      {
        "name": "Coriander Leaves",
        "quantity": 0.25,
        "unit": "cup",
        "category": "produce",
        "inStock": false
      },
      {
        "name": "Salt",
        "quantity": 1,
        "unit": "tsp",
        "category": "pantry"
      },
      {
        "name": "Mustard Oil",
        "quantity": 1,
        "unit": "tbsp",
        "category": "pantry"
      },
      {
        "name": "Cumin Seeds",
        "quantity": 1,
        "unit": "tsp",
        "category": "spices"
      },
      {
        "name": "Red Chili Powder",
        "quantity": 0.5,
        "unit": "tsp",
        "category": "spices"
      }
    ],
    "litti-chokha": [
      {
        "name": "Wheat Flour",
        "quantity": 200,
        "unit": "g",
        "category": "grains",
        "inStock": false
      },
      {
        "name": "Sattu",
        "quantity": 100,
        "unit": "g",
        "category": "grains",
        "inStock": false
      },
      {
        "name": "Ghee",
        "quantity": 2,
        "unit": "tbsp",
        "category": "pantry",
        "inStock": false
      },
      {
        "name": "Oil",
        "quantity": 2,
        "unit": "tbsp",
        "category": "pantry",
        "inStock": false
      },
      {
        "name": "Spices",
        "quantity": 1,
        "unit": "packet",
        "category": "spices",
        "inStock": false
      }
    ],
    "pakhala-bhata": [
      {
        "name": "Rice",
        "quantity": 1,
        "unit": "cup",
        "category": "grains"
      },
      {
        "name": "Water",
        "quantity": 2,
        "unit": "cup",
        "category": "pantry"
      },
      {
        "name": "Yogurt",
        "quantity": 1,
        "unit": "tbsp",
        "category": "dairy"
      },
      {
        "name": "Cumin Seeds",
        "quantity": 0.5,
        "unit": "tsp",
        "category": "spices"
      },
      {
        "name": "Green Chilli",
        "quantity": 2,
        "unit": "pc",
        "category": "produce"
      },
      {
        "name": "Ginger",
        "quantity": 1,
        "unit": "inch",
        "category": "produce"
      },
      {
        "name": "Curry Leaves",
        "quantity": 1,
        "unit": "sprig",
        "category": "produce"
      },
      {
        "name": "Salt",
        "quantity": 1,
        "unit": "tsp",
        "category": "pantry"
      }
    ],
    "rohu-fish-kalia": [
      {
        "name": "Fish",
        "quantity": 150,
        "unit": "g",
        "category": "proteins",
        "inStock": false
      },
      {
        "name": "Ghee",
        "quantity": 2,
        "unit": "tbsp",
        "category": "pantry",
        "inStock": false
      },
      {
        "name": "Oil",
        "quantity": 2,
        "unit": "tbsp",
        "category": "pantry",
        "inStock": false
      },
      {
        "name": "Spices",
        "quantity": 1,
        "unit": "packet",
        "category": "spices",
        "inStock": false
      },
      {
        "name": "Onion",
        "quantity": 1,
        "unit": "pc",
        "category": "produce",
        "inStock": false
      },
      {
        "name": "Tomato",
        "quantity": 2,
        "unit": "pc",
        "category": "produce",
        "inStock": false
      },
      {
        "name": "Green Chilli",
        "quantity": 2,
        "unit": "pc",
        "category": "produce",
        "inStock": false
      },
      {
        "name": "Ginger-Garlic Paste",
        "quantity": 1,
        "unit": "tbsp",
        "category": "produce",
        "inStock": false
      },
      {
        "name": "Coriander Leaves",
        "quantity": 0.25,
        "unit": "cup",
        "category": "produce",
        "inStock": false
      },
      {
        "name": "Salt",
        "quantity": 1,
        "unit": "tsp",
        "category": "pantry"
      },
      {
        "name": "Turmeric",
        "quantity": 0.5,
        "unit": "tsp",
        "category": "spices"
      },
      {
        "name": "Mustard Oil",
        "quantity": 1,
        "unit": "tbsp",
        "category": "pantry"
      },
      {
        "name": "Cumin Seeds",
        "quantity": 1,
        "unit": "tsp",
        "category": "spices"
      },
      {
        "name": "Red Chili Powder",
        "quantity": 0.5,
        "unit": "tsp",
        "category": "spices"
      }
    ],
    "mutton-kosha": [
      {
        "name": "Mutton",
        "quantity": 200,
        "unit": "g",
        "category": "proteins",
        "inStock": false
      },
      {
        "name": "Onions",
        "quantity": 3,
        "unit": "pc",
        "category": "produce",
        "inStock": false
      },
      {
        "name": "Potatoes",
        "quantity": 2,
        "unit": "pc",
        "category": "produce",
        "inStock": false
      },
      {
        "name": "Ghee",
        "quantity": 2,
        "unit": "tbsp",
        "category": "pantry",
        "inStock": false
      },
      {
        "name": "Oil",
        "quantity": 2,
        "unit": "tbsp",
        "category": "pantry",
        "inStock": false
      },
      {
        "name": "Spices",
        "quantity": 1,
        "unit": "packet",
        "category": "spices",
        "inStock": false
      },
      {
        "name": "Onion",
        "quantity": 1,
        "unit": "pc",
        "category": "produce",
        "inStock": false
      },
      {
        "name": "Tomato",
        "quantity": 2,
        "unit": "pc",
        "category": "produce",
        "inStock": false
      },
      {
        "name": "Green Chilli",
        "quantity": 2,
        "unit": "pc",
        "category": "produce",
        "inStock": false
      },
      {
        "name": "Ginger-Garlic Paste",
        "quantity": 1,
        "unit": "tbsp",
        "category": "produce",
        "inStock": false
      },
      {
        "name": "Coriander Leaves",
        "quantity": 0.25,
        "unit": "cup",
        "category": "produce",
        "inStock": false
      },
      {
        "name": "Salt",
        "quantity": 1,
        "unit": "tsp",
        "category": "pantry"
      },
      {
        "name": "Turmeric",
        "quantity": 0.5,
        "unit": "tsp",
        "category": "spices"
      },
      {
        "name": "Mustard Oil",
        "quantity": 1,
        "unit": "tbsp",
        "category": "pantry"
      },
      {
        "name": "Cumin Seeds",
        "quantity": 1,
        "unit": "tsp",
        "category": "spices"
      },
      {
        "name": "Red Chili Powder",
        "quantity": 0.5,
        "unit": "tsp",
        "category": "spices"
      }
    ],
    "chingri-malai": [
      {
        "name": "Prawns",
        "quantity": 200,
        "unit": "g",
        "category": "proteins"
      },
      {
        "name": "Coconut Milk",
        "quantity": 200,
        "unit": "ml",
        "category": "pantry"
      },
      {
        "name": "Onion",
        "quantity": 1,
        "unit": "pc",
        "category": "produce"
      },
      {
        "name": "Ginger-Garlic Paste",
        "quantity": 1,
        "unit": "tbsp",
        "category": "pantry"
      },
      {
        "name": "Green Chilli",
        "quantity": 2,
        "unit": "pc",
        "category": "produce"
      },
      {
        "name": "Turmeric",
        "quantity": 0.5,
        "unit": "tsp",
        "category": "spices"
      },
      {
        "name": "Cardamom",
        "quantity": 2,
        "unit": "pods",
        "category": "spices"
      },
      {
        "name": "Cinnamon",
        "quantity": 1,
        "unit": "inch",
        "category": "spices"
      },
      {
        "name": "Bay Leaf",
        "quantity": 1,
        "unit": "pc",
        "category": "spices"
      },
      {
        "name": "Ghee",
        "quantity": 1,
        "unit": "tbsp",
        "category": "dairy"
      },
      {
        "name": "Salt",
        "quantity": 1,
        "unit": "tsp",
        "category": "pantry"
      },
      {
        "name": "Rice",
        "quantity": 1,
        "unit": "cup",
        "category": "grains"
      }
    ],
    "salmon-paturi": [
      {
        "name": "Salmon",
        "quantity": 250,
        "unit": "g",
        "category": "proteins"
      },
      {
        "name": "Yellow Mustard Seeds",
        "quantity": 2,
        "unit": "tbsp",
        "category": "spices"
      },
      {
        "name": "Mustard Oil",
        "quantity": 2,
        "unit": "tbsp",
        "category": "pantry"
      },
      {
        "name": "Green Chilli",
        "quantity": 2,
        "unit": "pc",
        "category": "produce"
      },
      {
        "name": "Turmeric",
        "quantity": 0.5,
        "unit": "tsp",
        "category": "spices"
      },
      {
        "name": "Salt",
        "quantity": 1,
        "unit": "tsp",
        "category": "pantry"
      },
      {
        "name": "Rice",
        "quantity": 1,
        "unit": "cup",
        "category": "grains"
      }
    ],
    "soya-bori-curry": [
      {
        "name": "Soya Chunks",
        "quantity": 100,
        "unit": "g",
        "category": "proteins",
        "inStock": false
      },
      {
        "name": "Onions",
        "quantity": 2,
        "unit": "pc",
        "category": "produce",
        "inStock": false
      },
      {
        "name": "Tomatoes",
        "quantity": 2,
        "unit": "pc",
        "category": "produce",
        "inStock": false
      },
      {
        "name": "Ghee",
        "quantity": 2,
        "unit": "tbsp",
        "category": "pantry",
        "inStock": false
      },
      {
        "name": "Oil",
        "quantity": 2,
        "unit": "tbsp",
        "category": "pantry",
        "inStock": false
      },
      {
        "name": "Spices",
        "quantity": 1,
        "unit": "packet",
        "category": "spices",
        "inStock": false
      },
      {
        "name": "Rice",
        "quantity": 1,
        "unit": "cup",
        "category": "grains",
        "inStock": false
      },
      {
        "name": "Onion",
        "quantity": 1,
        "unit": "pc",
        "category": "produce",
        "inStock": false
      },
      {
        "name": "Tomato",
        "quantity": 2,
        "unit": "pc",
        "category": "produce",
        "inStock": false
      },
      {
        "name": "Green Chilli",
        "quantity": 2,
        "unit": "pc",
        "category": "produce",
        "inStock": false
      },
      {
        "name": "Ginger-Garlic Paste",
        "quantity": 1,
        "unit": "tbsp",
        "category": "produce",
        "inStock": false
      },
      {
        "name": "Coriander Leaves",
        "quantity": 0.25,
        "unit": "cup",
        "category": "produce",
        "inStock": false
      },
      {
        "name": "Salt",
        "quantity": 1,
        "unit": "tsp",
        "category": "pantry"
      },
      {
        "name": "Turmeric",
        "quantity": 0.5,
        "unit": "tsp",
        "category": "spices"
      },
      {
        "name": "Mustard Oil",
        "quantity": 1,
        "unit": "tbsp",
        "category": "pantry"
      },
      {
        "name": "Cumin Seeds",
        "quantity": 1,
        "unit": "tsp",
        "category": "spices"
      },
      {
        "name": "Red Chili Powder",
        "quantity": 0.5,
        "unit": "tsp",
        "category": "spices"
      }
    ],
    "mutton-chhola": [
      {
        "name": "Mutton",
        "quantity": 200,
        "unit": "g",
        "category": "proteins",
        "inStock": false
      },
      {
        "name": "Ghee",
        "quantity": 2,
        "unit": "tbsp",
        "category": "pantry",
        "inStock": false
      },
      {
        "name": "Oil",
        "quantity": 2,
        "unit": "tbsp",
        "category": "pantry",
        "inStock": false
      },
      {
        "name": "Spices",
        "quantity": 1,
        "unit": "packet",
        "category": "spices",
        "inStock": false
      },
      {
        "name": "Onion",
        "quantity": 1,
        "unit": "pc",
        "category": "produce",
        "inStock": false
      },
      {
        "name": "Tomato",
        "quantity": 2,
        "unit": "pc",
        "category": "produce",
        "inStock": false
      },
      {
        "name": "Green Chilli",
        "quantity": 2,
        "unit": "pc",
        "category": "produce",
        "inStock": false
      },
      {
        "name": "Ginger-Garlic Paste",
        "quantity": 1,
        "unit": "tbsp",
        "category": "produce",
        "inStock": false
      },
      {
        "name": "Coriander Leaves",
        "quantity": 0.25,
        "unit": "cup",
        "category": "produce",
        "inStock": false
      },
      {
        "name": "Salt",
        "quantity": 1,
        "unit": "tsp",
        "category": "pantry"
      },
      {
        "name": "Turmeric",
        "quantity": 0.5,
        "unit": "tsp",
        "category": "spices"
      },
      {
        "name": "Cumin Seeds",
        "quantity": 1,
        "unit": "tsp",
        "category": "spices"
      },
      {
        "name": "Red Chili Powder",
        "quantity": 0.5,
        "unit": "tsp",
        "category": "spices"
      }
    ],
    "masala-prawn-fry": [
      {
        "name": "Fish",
        "quantity": 150,
        "unit": "g",
        "category": "proteins",
        "inStock": false
      },
      {
        "name": "Prawns",
        "quantity": 200,
        "unit": "g",
        "category": "proteins",
        "inStock": false
      },
      {
        "name": "Ghee",
        "quantity": 2,
        "unit": "tbsp",
        "category": "pantry",
        "inStock": false
      },
      {
        "name": "Oil",
        "quantity": 2,
        "unit": "tbsp",
        "category": "pantry",
        "inStock": false
      },
      {
        "name": "Spices",
        "quantity": 1,
        "unit": "packet",
        "category": "spices",
        "inStock": false
      },
      {
        "name": "Onion",
        "quantity": 1,
        "unit": "pc",
        "category": "produce",
        "inStock": false
      },
      {
        "name": "Tomato",
        "quantity": 2,
        "unit": "pc",
        "category": "produce",
        "inStock": false
      },
      {
        "name": "Green Chilli",
        "quantity": 2,
        "unit": "pc",
        "category": "produce",
        "inStock": false
      },
      {
        "name": "Ginger-Garlic Paste",
        "quantity": 1,
        "unit": "tbsp",
        "category": "produce",
        "inStock": false
      },
      {
        "name": "Coriander Leaves",
        "quantity": 0.25,
        "unit": "cup",
        "category": "produce",
        "inStock": false
      },
      {
        "name": "Salt",
        "quantity": 1,
        "unit": "tsp",
        "category": "pantry"
      },
      {
        "name": "Turmeric",
        "quantity": 0.5,
        "unit": "tsp",
        "category": "spices"
      },
      {
        "name": "Cumin Seeds",
        "quantity": 1,
        "unit": "tsp",
        "category": "spices"
      },
      {
        "name": "Red Chili Powder",
        "quantity": 0.5,
        "unit": "tsp",
        "category": "spices"
      }
    ],
    "soybean-curry": [
      {
        "name": "Soya Chunks",
        "quantity": 100,
        "unit": "g",
        "category": "proteins",
        "inStock": false
      },
      {
        "name": "Onions",
        "quantity": 2,
        "unit": "pc",
        "category": "produce",
        "inStock": false
      },
      {
        "name": "Tomatoes",
        "quantity": 2,
        "unit": "pc",
        "category": "produce",
        "inStock": false
      },
      {
        "name": "Ghee",
        "quantity": 2,
        "unit": "tbsp",
        "category": "pantry",
        "inStock": false
      },
      {
        "name": "Oil",
        "quantity": 2,
        "unit": "tbsp",
        "category": "pantry",
        "inStock": false
      },
      {
        "name": "Spices",
        "quantity": 1,
        "unit": "packet",
        "category": "spices",
        "inStock": false
      },
      {
        "name": "Onion",
        "quantity": 1,
        "unit": "pc",
        "category": "produce",
        "inStock": false
      },
      {
        "name": "Tomato",
        "quantity": 2,
        "unit": "pc",
        "category": "produce",
        "inStock": false
      },
      {
        "name": "Green Chilli",
        "quantity": 2,
        "unit": "pc",
        "category": "produce",
        "inStock": false
      },
      {
        "name": "Ginger-Garlic Paste",
        "quantity": 1,
        "unit": "tbsp",
        "category": "produce",
        "inStock": false
      },
      {
        "name": "Coriander Leaves",
        "quantity": 0.25,
        "unit": "cup",
        "category": "produce",
        "inStock": false
      },
      {
        "name": "Salt",
        "quantity": 1,
        "unit": "tsp",
        "category": "pantry"
      },
      {
        "name": "Turmeric",
        "quantity": 0.5,
        "unit": "tsp",
        "category": "spices"
      },
      {
        "name": "Cumin Seeds",
        "quantity": 1,
        "unit": "tsp",
        "category": "spices"
      },
      {
        "name": "Red Chili Powder",
        "quantity": 0.5,
        "unit": "tsp",
        "category": "spices"
      }
    ],
    "chicken-bastar": [
      {
        "name": "Chicken",
        "quantity": 200,
        "unit": "g",
        "category": "proteins",
        "inStock": false
      },
      {
        "name": "Ghee",
        "quantity": 2,
        "unit": "tbsp",
        "category": "pantry",
        "inStock": false
      },
      {
        "name": "Oil",
        "quantity": 2,
        "unit": "tbsp",
        "category": "pantry",
        "inStock": false
      },
      {
        "name": "Spices",
        "quantity": 1,
        "unit": "packet",
        "category": "spices",
        "inStock": false
      },
      {
        "name": "Rice",
        "quantity": 1,
        "unit": "cup",
        "category": "grains",
        "inStock": false
      },
      {
        "name": "Onion",
        "quantity": 1,
        "unit": "pc",
        "category": "produce",
        "inStock": false
      },
      {
        "name": "Tomato",
        "quantity": 2,
        "unit": "pc",
        "category": "produce",
        "inStock": false
      },
      {
        "name": "Green Chilli",
        "quantity": 2,
        "unit": "pc",
        "category": "produce",
        "inStock": false
      },
      {
        "name": "Ginger-Garlic Paste",
        "quantity": 1,
        "unit": "tbsp",
        "category": "produce",
        "inStock": false
      },
      {
        "name": "Coriander Leaves",
        "quantity": 0.25,
        "unit": "cup",
        "category": "produce",
        "inStock": false
      },
      {
        "name": "Salt",
        "quantity": 1,
        "unit": "tsp",
        "category": "pantry"
      },
      {
        "name": "Turmeric",
        "quantity": 0.5,
        "unit": "tsp",
        "category": "spices"
      },
      {
        "name": "Cumin Seeds",
        "quantity": 1,
        "unit": "tsp",
        "category": "spices"
      },
      {
        "name": "Red Chili Powder",
        "quantity": 0.5,
        "unit": "tsp",
        "category": "spices"
      }
    ],
    "soya-chunks-do-pyaza": [
      {
        "name": "Soya Chunks",
        "quantity": 100,
        "unit": "g",
        "category": "proteins",
        "inStock": false
      },
      {
        "name": "Onions",
        "quantity": 2,
        "unit": "pc",
        "category": "produce",
        "inStock": false
      },
      {
        "name": "Tomatoes",
        "quantity": 2,
        "unit": "pc",
        "category": "produce",
        "inStock": false
      },
      {
        "name": "Ghee",
        "quantity": 2,
        "unit": "tbsp",
        "category": "pantry",
        "inStock": false
      },
      {
        "name": "Oil",
        "quantity": 2,
        "unit": "tbsp",
        "category": "pantry",
        "inStock": false
      },
      {
        "name": "Spices",
        "quantity": 1,
        "unit": "packet",
        "category": "spices",
        "inStock": false
      },
      {
        "name": "Onion",
        "quantity": 1,
        "unit": "pc",
        "category": "produce",
        "inStock": false
      },
      {
        "name": "Tomato",
        "quantity": 2,
        "unit": "pc",
        "category": "produce",
        "inStock": false
      },
      {
        "name": "Green Chilli",
        "quantity": 2,
        "unit": "pc",
        "category": "produce",
        "inStock": false
      },
      {
        "name": "Ginger-Garlic Paste",
        "quantity": 1,
        "unit": "tbsp",
        "category": "produce",
        "inStock": false
      },
      {
        "name": "Coriander Leaves",
        "quantity": 0.25,
        "unit": "cup",
        "category": "produce",
        "inStock": false
      },
      {
        "name": "Salt",
        "quantity": 1,
        "unit": "tsp",
        "category": "pantry"
      },
      {
        "name": "Turmeric",
        "quantity": 0.5,
        "unit": "tsp",
        "category": "spices"
      },
      {
        "name": "Cumin Seeds",
        "quantity": 1,
        "unit": "tsp",
        "category": "spices"
      },
      {
        "name": "Red Chili Powder",
        "quantity": 0.5,
        "unit": "tsp",
        "category": "spices"
      }
    ],
    "bengali-egg-curry": [
      {
        "name": "Eggs",
        "quantity": 2,
        "unit": "pcs",
        "category": "proteins",
        "inStock": false
      },
      {
        "name": "White Bread",
        "quantity": 4,
        "unit": "pcs",
        "category": "breads",
        "inStock": false
      },
      {
        "name": "Milk",
        "quantity": 100,
        "unit": "ml",
        "category": "dairy",
        "inStock": false
      },
      {
        "name": "Sugar",
        "quantity": 2,
        "unit": "tbsp",
        "category": "pantry",
        "inStock": false
      },
      {
        "name": "Butter",
        "quantity": 20,
        "unit": "g",
        "category": "dairy",
        "inStock": false
      },
      {
        "name": "Ghee",
        "quantity": 2,
        "unit": "tbsp",
        "category": "pantry",
        "inStock": false
      },
      {
        "name": "Oil",
        "quantity": 2,
        "unit": "tbsp",
        "category": "pantry",
        "inStock": false
      },
      {
        "name": "Spices",
        "quantity": 1,
        "unit": "packet",
        "category": "spices",
        "inStock": false
      },
      {
        "name": "Mixed Dal",
        "quantity": 80,
        "unit": "g",
        "category": "proteins",
        "inStock": false
      },
      {
        "name": "Toor Dal",
        "quantity": 1,
        "unit": "cup",
        "category": "grains",
        "inStock": false
      },
      {
        "name": "Onion",
        "quantity": 1,
        "unit": "pc",
        "category": "produce",
        "inStock": false
      },
      {
        "name": "Tomato",
        "quantity": 2,
        "unit": "pc",
        "category": "produce",
        "inStock": false
      },
      {
        "name": "Green Chilli",
        "quantity": 2,
        "unit": "pc",
        "category": "produce",
        "inStock": false
      },
      {
        "name": "Ginger-Garlic Paste",
        "quantity": 1,
        "unit": "tbsp",
        "category": "produce",
        "inStock": false
      },
      {
        "name": "Coriander Leaves",
        "quantity": 0.25,
        "unit": "cup",
        "category": "produce",
        "inStock": false
      },
      {
        "name": "Salt",
        "quantity": 1,
        "unit": "tsp",
        "category": "pantry"
      },
      {
        "name": "Turmeric",
        "quantity": 0.5,
        "unit": "tsp",
        "category": "spices"
      },
      {
        "name": "Mustard Oil",
        "quantity": 1,
        "unit": "tbsp",
        "category": "pantry"
      },
      {
        "name": "Cumin Seeds",
        "quantity": 1,
        "unit": "tsp",
        "category": "spices"
      },
      {
        "name": "Red Chili Powder",
        "quantity": 0.5,
        "unit": "tsp",
        "category": "spices"
      },
      {
        "name": "Cumin Seeds",
        "quantity": 1,
        "unit": "tsp",
        "category": "spices"
      },
      {
        "name": "Panch Phoron",
        "quantity": 0.5,
        "unit": "tsp",
        "category": "spices"
      }
    ],
    "egg-dimer-jhol": [
      {
        "name": "Eggs",
        "quantity": 2,
        "unit": "pcs",
        "category": "proteins",
        "inStock": false
      },
      {
        "name": "White Bread",
        "quantity": 4,
        "unit": "pcs",
        "category": "breads",
        "inStock": false
      },
      {
        "name": "Milk",
        "quantity": 100,
        "unit": "ml",
        "category": "dairy",
        "inStock": false
      },
      {
        "name": "Sugar",
        "quantity": 2,
        "unit": "tbsp",
        "category": "pantry",
        "inStock": false
      },
      {
        "name": "Butter",
        "quantity": 20,
        "unit": "g",
        "category": "dairy",
        "inStock": false
      },
      {
        "name": "Fish",
        "quantity": 200,
        "unit": "g",
        "category": "proteins",
        "inStock": false
      },
      {
        "name": "Turmeric",
        "quantity": 1,
        "unit": "tsp",
        "category": "spices",
        "inStock": false
      },
      {
        "name": "Ghee",
        "quantity": 2,
        "unit": "tbsp",
        "category": "pantry",
        "inStock": false
      },
      {
        "name": "Oil",
        "quantity": 2,
        "unit": "tbsp",
        "category": "pantry",
        "inStock": false
      },
      {
        "name": "Spices",
        "quantity": 1,
        "unit": "packet",
        "category": "spices",
        "inStock": false
      },
      {
        "name": "Onion",
        "quantity": 1,
        "unit": "pc",
        "category": "produce",
        "inStock": false
      },
      {
        "name": "Tomato",
        "quantity": 2,
        "unit": "pc",
        "category": "produce",
        "inStock": false
      },
      {
        "name": "Green Chilli",
        "quantity": 2,
        "unit": "pc",
        "category": "produce",
        "inStock": false
      },
      {
        "name": "Ginger-Garlic Paste",
        "quantity": 1,
        "unit": "tbsp",
        "category": "produce",
        "inStock": false
      },
      {
        "name": "Coriander Leaves",
        "quantity": 0.25,
        "unit": "cup",
        "category": "produce",
        "inStock": false
      },
      {
        "name": "Salt",
        "quantity": 1,
        "unit": "tsp",
        "category": "pantry"
      },
      {
        "name": "Mustard Oil",
        "quantity": 1,
        "unit": "tbsp",
        "category": "pantry"
      },
      {
        "name": "Cumin Seeds",
        "quantity": 1,
        "unit": "tsp",
        "category": "spices"
      },
      {
        "name": "Red Chili Powder",
        "quantity": 0.5,
        "unit": "tsp",
        "category": "spices"
      }
    ],
    "egg-chilli": [
      {
        "name": "Eggs",
        "quantity": 2,
        "unit": "pcs",
        "category": "proteins",
        "inStock": false
      },
      {
        "name": "White Bread",
        "quantity": 4,
        "unit": "pcs",
        "category": "breads",
        "inStock": false
      },
      {
        "name": "Milk",
        "quantity": 100,
        "unit": "ml",
        "category": "dairy",
        "inStock": false
      },
      {
        "name": "Sugar",
        "quantity": 2,
        "unit": "tbsp",
        "category": "pantry",
        "inStock": false
      },
      {
        "name": "Butter",
        "quantity": 20,
        "unit": "g",
        "category": "dairy",
        "inStock": false
      },
      {
        "name": "Ghee",
        "quantity": 2,
        "unit": "tbsp",
        "category": "pantry",
        "inStock": false
      },
      {
        "name": "Oil",
        "quantity": 2,
        "unit": "tbsp",
        "category": "pantry",
        "inStock": false
      },
      {
        "name": "Spices",
        "quantity": 1,
        "unit": "packet",
        "category": "spices",
        "inStock": false
      },
      {
        "name": "Salt",
        "quantity": 1,
        "unit": "tsp",
        "category": "pantry"
      },
      {
        "name": "Turmeric",
        "quantity": 0.5,
        "unit": "tsp",
        "category": "spices"
      },
      {
        "name": "Mustard Oil",
        "quantity": 1,
        "unit": "tbsp",
        "category": "pantry"
      }
    ],
    "odisha-egg-curry": [
      {
        "name": "Eggs",
        "quantity": 2,
        "unit": "pcs",
        "category": "proteins",
        "inStock": false
      },
      {
        "name": "White Bread",
        "quantity": 4,
        "unit": "pcs",
        "category": "breads",
        "inStock": false
      },
      {
        "name": "Milk",
        "quantity": 100,
        "unit": "ml",
        "category": "dairy",
        "inStock": false
      },
      {
        "name": "Sugar",
        "quantity": 2,
        "unit": "tbsp",
        "category": "pantry",
        "inStock": false
      },
      {
        "name": "Butter",
        "quantity": 20,
        "unit": "g",
        "category": "dairy",
        "inStock": false
      },
      {
        "name": "Ghee",
        "quantity": 2,
        "unit": "tbsp",
        "category": "pantry",
        "inStock": false
      },
      {
        "name": "Oil",
        "quantity": 2,
        "unit": "tbsp",
        "category": "pantry",
        "inStock": false
      },
      {
        "name": "Spices",
        "quantity": 1,
        "unit": "packet",
        "category": "spices",
        "inStock": false
      },
      {
        "name": "Rice",
        "quantity": 1,
        "unit": "cup",
        "category": "grains",
        "inStock": false
      },
      {
        "name": "Onion",
        "quantity": 1,
        "unit": "pc",
        "category": "produce",
        "inStock": false
      },
      {
        "name": "Tomato",
        "quantity": 2,
        "unit": "pc",
        "category": "produce",
        "inStock": false
      },
      {
        "name": "Green Chilli",
        "quantity": 2,
        "unit": "pc",
        "category": "produce",
        "inStock": false
      },
      {
        "name": "Ginger-Garlic Paste",
        "quantity": 1,
        "unit": "tbsp",
        "category": "produce",
        "inStock": false
      },
      {
        "name": "Coriander Leaves",
        "quantity": 0.25,
        "unit": "cup",
        "category": "produce",
        "inStock": false
      },
      {
        "name": "Salt",
        "quantity": 1,
        "unit": "tsp",
        "category": "pantry"
      },
      {
        "name": "Turmeric",
        "quantity": 0.5,
        "unit": "tsp",
        "category": "spices"
      },
      {
        "name": "Mustard Oil",
        "quantity": 1,
        "unit": "tbsp",
        "category": "pantry"
      },
      {
        "name": "Cumin Seeds",
        "quantity": 1,
        "unit": "tsp",
        "category": "spices"
      },
      {
        "name": "Red Chili Powder",
        "quantity": 0.5,
        "unit": "tsp",
        "category": "spices"
      }
    ],
    "bengali-kofta": [
      {
        "name": "Raw Banana",
        "quantity": 2,
        "unit": "pc",
        "category": "produce"
      },
      {
        "name": "Besan",
        "quantity": 0.5,
        "unit": "cup",
        "category": "grains"
      },
      {
        "name": "Onion",
        "quantity": 1,
        "unit": "pc",
        "category": "produce"
      },
      {
        "name": "Tomato",
        "quantity": 2,
        "unit": "pcs",
        "category": "produce"
      },
      {
        "name": "Ginger-Garlic Paste",
        "quantity": 1,
        "unit": "tbsp",
        "category": "pantry"
      },
      {
        "name": "Green Chilli",
        "quantity": 2,
        "unit": "pcs",
        "category": "produce"
      },
      {
        "name": "Turmeric",
        "quantity": 0.5,
        "unit": "tsp",
        "category": "spices"
      },
      {
        "name": "Red Chili Powder",
        "quantity": 0.5,
        "unit": "tsp",
        "category": "spices"
      },
      {
        "name": "Cumin Seeds",
        "quantity": 1,
        "unit": "tsp",
        "category": "spices"
      },
      {
        "name": "Salt",
        "quantity": 1,
        "unit": "tsp",
        "category": "pantry"
      },
      {
        "name": "Mustard Oil",
        "quantity": 1,
        "unit": "tbsp",
        "category": "pantry"
      },
      {
        "name": "Coriander Leaves",
        "quantity": 0.25,
        "unit": "cup",
        "category": "produce"
      },
      {
        "name": "Rice",
        "quantity": 1,
        "unit": "cup",
        "category": "grains"
      }
    ],
    "pooja-kofta": [
      {
        "name": "Paneer",
        "quantity": 200,
        "unit": "g",
        "category": "proteins"
      },
      {
        "name": "Potato",
        "quantity": 2,
        "unit": "pc",
        "category": "produce"
      },
      {
        "name": "Onion",
        "quantity": 1,
        "unit": "pc",
        "category": "produce"
      },
      {
        "name": "Tomato",
        "quantity": 2,
        "unit": "pc",
        "category": "produce"
      },
      {
        "name": "Ginger-Garlic Paste",
        "quantity": 1,
        "unit": "tbsp",
        "category": "pantry"
      },
      {
        "name": "Garam Masala",
        "quantity": 1,
        "unit": "tsp",
        "category": "spices"
      },
      {
        "name": "Turmeric",
        "quantity": 0.5,
        "unit": "tsp",
        "category": "spices"
      },
      {
        "name": "Red Chilli Powder",
        "quantity": 0.5,
        "unit": "tsp",
        "category": "spices"
      },
      {
        "name": "Salt",
        "quantity": 1,
        "unit": "tsp",
        "category": "pantry"
      },
      {
        "name": "Oil",
        "quantity": 2,
        "unit": "tbsp",
        "category": "pantry"
      },
      {
        "name": "Cashews",
        "quantity": 10,
        "unit": "g",
        "category": "pantry"
      },
      {
        "name": "Coriander Leaves",
        "quantity": 0.25,
        "unit": "cup",
        "category": "produce"
      },
      {
        "name": "Rice",
        "quantity": 1,
        "unit": "cup",
        "category": "grains"
      }
    ],
    "shukto": [
      {
        "name": "Bitter Gourd",
        "quantity": 100,
        "unit": "g",
        "category": "produce",
        "inStock": false
      },
      {
        "name": "Drumsticks",
        "quantity": 2,
        "unit": "pc",
        "category": "produce",
        "inStock": false
      },
      {
        "name": "Raw Banana",
        "quantity": 1,
        "unit": "pc",
        "category": "produce",
        "inStock": false
      },
      {
        "name": "Ghee",
        "quantity": 2,
        "unit": "tbsp",
        "category": "pantry",
        "inStock": false
      },
      {
        "name": "Oil",
        "quantity": 2,
        "unit": "tbsp",
        "category": "pantry",
        "inStock": false
      },
      {
        "name": "Spices",
        "quantity": 1,
        "unit": "packet",
        "category": "spices",
        "inStock": false
      }
    ],
    "chorer-ghonto": [
      {
        "name": "Ridge Gourd",
        "quantity": 200,
        "unit": "g",
        "category": "produce"
      },
      {
        "name": "Chana Dal",
        "quantity": 0.25,
        "unit": "cup",
        "category": "proteins"
      },
      {
        "name": "Coconut",
        "quantity": 0.25,
        "unit": "cup",
        "category": "produce"
      },
      {
        "name": "Ginger",
        "quantity": 1,
        "unit": "inch",
        "category": "produce"
      },
      {
        "name": "Green Chilli",
        "quantity": 2,
        "unit": "pc",
        "category": "produce"
      },
      {
        "name": "Turmeric",
        "quantity": 0.5,
        "unit": "tsp",
        "category": "spices"
      },
      {
        "name": "Cumin Seeds",
        "quantity": 0.5,
        "unit": "tsp",
        "category": "spices"
      },
      {
        "name": "Mustard Oil",
        "quantity": 1,
        "unit": "tbsp",
        "category": "pantry"
      },
      {
        "name": "Salt",
        "quantity": 1,
        "unit": "tsp",
        "category": "pantry"
      },
      {
        "name": "Ghee",
        "quantity": 1,
        "unit": "tsp",
        "category": "dairy"
      }
    ],
    "alu-posto": [
      {
        "name": "Potatoes",
        "quantity": 3,
        "unit": "pc",
        "category": "produce",
        "inStock": false
      },
      {
        "name": "Poppy Seeds",
        "quantity": 20,
        "unit": "g",
        "category": "spices",
        "inStock": false
      },
      {
        "name": "Ghee",
        "quantity": 2,
        "unit": "tbsp",
        "category": "pantry",
        "inStock": false
      },
      {
        "name": "Oil",
        "quantity": 2,
        "unit": "tbsp",
        "category": "pantry",
        "inStock": false
      },
      {
        "name": "Spices",
        "quantity": 1,
        "unit": "packet",
        "category": "spices",
        "inStock": false
      }
    ],
    "kosha-mangsho": [
      {
        "name": "Mutton",
        "quantity": 250,
        "unit": "g",
        "category": "proteins",
        "inStock": false
      },
      {
        "name": "Onions",
        "quantity": 3,
        "unit": "pc",
        "category": "produce",
        "inStock": false
      },
      {
        "name": "Potatoes",
        "quantity": 2,
        "unit": "pc",
        "category": "produce",
        "inStock": false
      },
      {
        "name": "Ghee",
        "quantity": 2,
        "unit": "tbsp",
        "category": "pantry",
        "inStock": false
      },
      {
        "name": "Oil",
        "quantity": 2,
        "unit": "tbsp",
        "category": "pantry",
        "inStock": false
      },
      {
        "name": "Spices",
        "quantity": 1,
        "unit": "packet",
        "category": "spices",
        "inStock": false
      },
      {
        "name": "Onion",
        "quantity": 1,
        "unit": "pc",
        "category": "produce",
        "inStock": false
      },
      {
        "name": "Tomato",
        "quantity": 2,
        "unit": "pc",
        "category": "produce",
        "inStock": false
      },
      {
        "name": "Green Chilli",
        "quantity": 2,
        "unit": "pc",
        "category": "produce",
        "inStock": false
      },
      {
        "name": "Ginger-Garlic Paste",
        "quantity": 1,
        "unit": "tbsp",
        "category": "produce",
        "inStock": false
      },
      {
        "name": "Coriander Leaves",
        "quantity": 0.25,
        "unit": "cup",
        "category": "produce",
        "inStock": false
      },
      {
        "name": "Salt",
        "quantity": 1,
        "unit": "tsp",
        "category": "pantry"
      },
      {
        "name": "Turmeric",
        "quantity": 0.5,
        "unit": "tsp",
        "category": "spices"
      },
      {
        "name": "Mustard Oil",
        "quantity": 1,
        "unit": "tbsp",
        "category": "pantry"
      },
      {
        "name": "Cumin Seeds",
        "quantity": 1,
        "unit": "tsp",
        "category": "spices"
      },
      {
        "name": "Red Chili Powder",
        "quantity": 0.5,
        "unit": "tsp",
        "category": "spices"
      }
    ],
    "bhapa-ilish": [
      {
        "name": "Fish",
        "quantity": 200,
        "unit": "g",
        "category": "proteins",
        "inStock": false
      },
      {
        "name": "Ghee",
        "quantity": 2,
        "unit": "tbsp",
        "category": "pantry",
        "inStock": false
      },
      {
        "name": "Oil",
        "quantity": 2,
        "unit": "tbsp",
        "category": "pantry",
        "inStock": false
      },
      {
        "name": "Spices",
        "quantity": 1,
        "unit": "packet",
        "category": "spices",
        "inStock": false
      },
      {
        "name": "Salt",
        "quantity": 1,
        "unit": "tsp",
        "category": "pantry"
      },
      {
        "name": "Turmeric",
        "quantity": 0.5,
        "unit": "tsp",
        "category": "spices"
      },
      {
        "name": "Mustard Oil",
        "quantity": 1,
        "unit": "tbsp",
        "category": "pantry"
      }
    ],
    "bhetki-fry": [
      {
        "name": "Fish",
        "quantity": 150,
        "unit": "g",
        "category": "proteins",
        "inStock": false
      },
      {
        "name": "Ghee",
        "quantity": 2,
        "unit": "tbsp",
        "category": "pantry",
        "inStock": false
      },
      {
        "name": "Oil",
        "quantity": 2,
        "unit": "tbsp",
        "category": "pantry",
        "inStock": false
      },
      {
        "name": "Spices",
        "quantity": 1,
        "unit": "packet",
        "category": "spices",
        "inStock": false
      },
      {
        "name": "Onion",
        "quantity": 1,
        "unit": "pc",
        "category": "produce",
        "inStock": false
      },
      {
        "name": "Tomato",
        "quantity": 2,
        "unit": "pc",
        "category": "produce",
        "inStock": false
      },
      {
        "name": "Green Chilli",
        "quantity": 2,
        "unit": "pc",
        "category": "produce",
        "inStock": false
      },
      {
        "name": "Ginger-Garlic Paste",
        "quantity": 1,
        "unit": "tbsp",
        "category": "produce",
        "inStock": false
      },
      {
        "name": "Coriander Leaves",
        "quantity": 0.25,
        "unit": "cup",
        "category": "produce",
        "inStock": false
      },
      {
        "name": "Salt",
        "quantity": 1,
        "unit": "tsp",
        "category": "pantry"
      },
      {
        "name": "Turmeric",
        "quantity": 0.5,
        "unit": "tsp",
        "category": "spices"
      },
      {
        "name": "Mustard Oil",
        "quantity": 1,
        "unit": "tbsp",
        "category": "pantry"
      }
    ],
    "daab-chingri": [
      {
        "name": "Prawns",
        "quantity": 200,
        "unit": "g",
        "category": "proteins",
        "inStock": false
      },
      {
        "name": "Crab",
        "quantity": 200,
        "unit": "g",
        "category": "proteins",
        "inStock": false
      },
      {
        "name": "Ghee",
        "quantity": 2,
        "unit": "tbsp",
        "category": "pantry",
        "inStock": false
      },
      {
        "name": "Oil",
        "quantity": 2,
        "unit": "tbsp",
        "category": "pantry",
        "inStock": false
      },
      {
        "name": "Spices",
        "quantity": 1,
        "unit": "packet",
        "category": "spices",
        "inStock": false
      },
      {
        "name": "Salt",
        "quantity": 1,
        "unit": "tsp",
        "category": "pantry"
      },
      {
        "name": "Turmeric",
        "quantity": 0.5,
        "unit": "tsp",
        "category": "spices"
      },
      {
        "name": "Mustard Oil",
        "quantity": 1,
        "unit": "tbsp",
        "category": "pantry"
      }
    ],
    "maach-bhaja": [
      {
        "name": "Fish",
        "quantity": 250,
        "unit": "g",
        "category": "proteins"
      },
      {
        "name": "Turmeric",
        "quantity": 1,
        "unit": "tsp",
        "category": "spices"
      },
      {
        "name": "Red Chili Powder",
        "quantity": 0.5,
        "unit": "tsp",
        "category": "spices"
      },
      {
        "name": "Salt",
        "quantity": 1,
        "unit": "tsp",
        "category": "pantry"
      },
      {
        "name": "Mustard Oil",
        "quantity": 2,
        "unit": "tbsp",
        "category": "pantry"
      },
      {
        "name": "Rice",
        "quantity": 1,
        "unit": "cup",
        "category": "grains"
      }
    ],
    "muri-ghonto": [
      {
        "name": "Poha",
        "quantity": 1,
        "unit": "cup",
        "category": "grains"
      },
      {
        "name": "Potatoes",
        "quantity": 1,
        "unit": "pc",
        "category": "produce"
      },
      {
        "name": "Green Peas",
        "quantity": 0.25,
        "unit": "cup",
        "category": "produce"
      },
      {
        "name": "Coconut",
        "quantity": 0.25,
        "unit": "cup",
        "category": "produce"
      },
      {
        "name": "Ginger",
        "quantity": 1,
        "unit": "inch",
        "category": "produce"
      },
      {
        "name": "Green Chilli",
        "quantity": 2,
        "unit": "pc",
        "category": "produce"
      },
      {
        "name": "Turmeric",
        "quantity": 0.5,
        "unit": "tsp",
        "category": "spices"
      },
      {
        "name": "Cumin Seeds",
        "quantity": 0.5,
        "unit": "tsp",
        "category": "spices"
      },
      {
        "name": "Mustard Oil",
        "quantity": 1,
        "unit": "tbsp",
        "category": "pantry"
      },
      {
        "name": "Salt",
        "quantity": 1,
        "unit": "tsp",
        "category": "pantry"
      },
      {
        "name": "Ghee",
        "quantity": 1,
        "unit": "tsp",
        "category": "dairy"
      }
    ],
    "chingri-macher-matha": [
      {
        "name": "Prawns",
        "quantity": 200,
        "unit": "g",
        "category": "proteins",
        "inStock": false
      },
      {
        "name": "Fish",
        "quantity": 200,
        "unit": "g",
        "category": "proteins",
        "inStock": false
      },
      {
        "name": "Turmeric",
        "quantity": 1,
        "unit": "tsp",
        "category": "spices",
        "inStock": false
      },
      {
        "name": "Ghee",
        "quantity": 2,
        "unit": "tbsp",
        "category": "pantry",
        "inStock": false
      },
      {
        "name": "Oil",
        "quantity": 2,
        "unit": "tbsp",
        "category": "pantry",
        "inStock": false
      },
      {
        "name": "Spices",
        "quantity": 1,
        "unit": "packet",
        "category": "spices",
        "inStock": false
      },
      {
        "name": "Salt",
        "quantity": 1,
        "unit": "tsp",
        "category": "pantry"
      },
      {
        "name": "Mustard Oil",
        "quantity": 1,
        "unit": "tbsp",
        "category": "pantry"
      }
    ],
    "dalna": [
      {
        "name": "Mixed Dal",
        "quantity": 80,
        "unit": "g",
        "category": "proteins",
        "inStock": false
      },
      {
        "name": "Ghee",
        "quantity": 2,
        "unit": "tbsp",
        "category": "pantry",
        "inStock": false
      },
      {
        "name": "Oil",
        "quantity": 2,
        "unit": "tbsp",
        "category": "pantry",
        "inStock": false
      },
      {
        "name": "Spices",
        "quantity": 1,
        "unit": "packet",
        "category": "spices",
        "inStock": false
      },
      {
        "name": "Toor Dal",
        "quantity": 1,
        "unit": "cup",
        "category": "grains",
        "inStock": false
      },
      {
        "name": "Onion",
        "quantity": 1,
        "unit": "pc",
        "category": "produce",
        "inStock": false
      },
      {
        "name": "Tomato",
        "quantity": 2,
        "unit": "pc",
        "category": "produce",
        "inStock": false
      },
      {
        "name": "Green Chilli",
        "quantity": 2,
        "unit": "pc",
        "category": "produce",
        "inStock": false
      },
      {
        "name": "Ginger-Garlic Paste",
        "quantity": 1,
        "unit": "tbsp",
        "category": "produce",
        "inStock": false
      },
      {
        "name": "Coriander Leaves",
        "quantity": 0.25,
        "unit": "cup",
        "category": "produce",
        "inStock": false
      },
      {
        "name": "Salt",
        "quantity": 1,
        "unit": "tsp",
        "category": "pantry"
      },
      {
        "name": "Turmeric",
        "quantity": 0.5,
        "unit": "tsp",
        "category": "spices"
      },
      {
        "name": "Mustard Oil",
        "quantity": 1,
        "unit": "tbsp",
        "category": "pantry"
      },
      {
        "name": "Cumin Seeds",
        "quantity": 1,
        "unit": "tsp",
        "category": "spices"
      },
      {
        "name": "Red Chili Powder",
        "quantity": 0.5,
        "unit": "tsp",
        "category": "spices"
      },
      {
        "name": "Cumin Seeds",
        "quantity": 1,
        "unit": "tsp",
        "category": "spices"
      },
      {
        "name": "Panch Phoron",
        "quantity": 0.5,
        "unit": "tsp",
        "category": "spices"
      }
    ],
    "begun-bhaja": [
      {
        "name": "Eggplant",
        "quantity": 2,
        "unit": "pc",
        "category": "produce"
      },
      {
        "name": "Turmeric",
        "quantity": 0.5,
        "unit": "tsp",
        "category": "spices"
      },
      {
        "name": "Red Chilli Powder",
        "quantity": 0.5,
        "unit": "tsp",
        "category": "spices"
      },
      {
        "name": "Salt",
        "quantity": 1,
        "unit": "tsp",
        "category": "pantry"
      },
      {
        "name": "Mustard Oil",
        "quantity": 2,
        "unit": "tbsp",
        "category": "pantry"
      }
    ],
    "mishti-doi": [
      {
        "name": "Milk",
        "quantity": 500,
        "unit": "ml",
        "category": "dairy",
        "inStock": false
      },
      {
        "name": "Sugar",
        "quantity": 80,
        "unit": "g",
        "category": "pantry",
        "inStock": false
      },
      {
        "name": "Cardamom",
        "quantity": 2,
        "unit": "pods",
        "category": "spices"
      },
      {
        "name": "Raisins",
        "quantity": 2,
        "unit": "tbsp",
        "category": "pantry"
      },
      {
        "name": "Almonds",
        "quantity": 2,
        "unit": "tbsp",
        "category": "pantry"
      },
      {
        "name": "Pistachios",
        "quantity": 1,
        "unit": "tbsp",
        "category": "pantry"
      }
    ],
    "sandesh": [
      {
        "name": "Milk",
        "quantity": 500,
        "unit": "ml",
        "category": "dairy",
        "inStock": false
      },
      {
        "name": "Sugar",
        "quantity": 80,
        "unit": "g",
        "category": "pantry",
        "inStock": false
      },
      {
        "name": "Cardamom",
        "quantity": 2,
        "unit": "pods",
        "category": "spices"
      },
      {
        "name": "Raisins",
        "quantity": 2,
        "unit": "tbsp",
        "category": "pantry"
      },
      {
        "name": "Almonds",
        "quantity": 2,
        "unit": "tbsp",
        "category": "pantry"
      },
      {
        "name": "Pistachios",
        "quantity": 1,
        "unit": "tbsp",
        "category": "pantry"
      }
    ],
    "sattu-sharbat": [
      {
        "name": "Sattu (Roasted Gram Flour)",
        "quantity": 30,
        "unit": "g",
        "category": "grains"
      },
      {
        "name": "Water",
        "quantity": 300,
        "unit": "ml",
        "category": "pantry"
      },
      {
        "name": "Lemon",
        "quantity": 1,
        "unit": "pc",
        "category": "produce"
      },
      {
        "name": "Black Salt",
        "quantity": 2,
        "unit": "g",
        "category": "pantry"
      },
      {
        "name": "Roasted Cumin Powder",
        "quantity": 2,
        "unit": "g",
        "category": "spices"
      },
      {
        "name": "Mint Leaves",
        "quantity": 5,
        "unit": "pieces",
        "category": "produce"
      }
    ],
    "aam-pora-shorbot": [
      {
        "name": "Raw Mango",
        "quantity": 1,
        "unit": "pc",
        "category": "produce"
      },
      {
        "name": "Sugar",
        "quantity": 20,
        "unit": "g",
        "category": "pantry"
      },
      {
        "name": "Black Salt",
        "quantity": 2,
        "unit": "g",
        "category": "pantry"
      },
      {
        "name": "Soda Water",
        "quantity": 200,
        "unit": "ml",
        "category": "pantry"
      },
      {
        "name": "Mint Leaves",
        "quantity": 5,
        "unit": "pieces",
        "category": "produce"
      }
    ],
    "bela-pana": [
      {
        "name": "Wood Apple Pulp",
        "quantity": 100,
        "unit": "g",
        "category": "produce"
      },
      {
        "name": "Jaggery",
        "quantity": 20,
        "unit": "g",
        "category": "pantry"
      },
      {
        "name": "Lemon",
        "quantity": 0.5,
        "unit": "pc",
        "category": "produce"
      },
      {
        "name": "Black Pepper Powder",
        "quantity": 1,
        "unit": "g",
        "category": "spices"
      },
      {
        "name": "Water",
        "quantity": 300,
        "unit": "ml",
        "category": "pantry"
      }
    ],
    "rugra": [
      {
        "name": "Mushrooms (Rugra)",
        "quantity": 200,
        "unit": "g",
        "category": "produce"
      },
      {
        "name": "Onion",
        "quantity": 1,
        "unit": "pc",
        "category": "produce"
      },
      {
        "name": "Garlic",
        "quantity": 4,
        "unit": "cloves",
        "category": "produce"
      },
      {
        "name": "Green Chilli",
        "quantity": 2,
        "unit": "pc",
        "category": "produce"
      },
      {
        "name": "Turmeric",
        "quantity": 0.5,
        "unit": "tsp",
        "category": "spices"
      },
      {
        "name": "Cumin Seeds",
        "quantity": 0.5,
        "unit": "tsp",
        "category": "spices"
      },
      {
        "name": "Mustard Oil",
        "quantity": 1.5,
        "unit": "tbsp",
        "category": "pantry"
      },
      {
        "name": "Salt",
        "quantity": 1,
        "unit": "tsp",
        "category": "pantry"
      },
      {
        "name": "Coriander Leaves",
        "quantity": 0.25,
        "unit": "cup",
        "category": "produce"
      }
    ],
    "bengali-dimer-dalna": [
      {
        "name": "Eggs",
        "quantity": 2,
        "unit": "pcs",
        "category": "proteins",
        "inStock": false
      },
      {
        "name": "Mixed Dal",
        "quantity": 80,
        "unit": "g",
        "category": "proteins",
        "inStock": false
      },
      {
        "name": "Ghee",
        "quantity": 2,
        "unit": "tbsp",
        "category": "pantry",
        "inStock": false
      },
      {
        "name": "Oil",
        "quantity": 2,
        "unit": "tbsp",
        "category": "pantry",
        "inStock": false
      },
      {
        "name": "Spices",
        "quantity": 1,
        "unit": "packet",
        "category": "spices",
        "inStock": false
      },
      {
        "name": "Potatoes",
        "quantity": 3,
        "unit": "pc",
        "category": "produce",
        "inStock": false
      },
      {
        "name": "White Bread",
        "quantity": 4,
        "unit": "pcs",
        "category": "breads",
        "inStock": false
      },
      {
        "name": "Milk",
        "quantity": 100,
        "unit": "ml",
        "category": "dairy",
        "inStock": false
      },
      {
        "name": "Sugar",
        "quantity": 2,
        "unit": "tbsp",
        "category": "pantry",
        "inStock": false
      },
      {
        "name": "Butter",
        "quantity": 20,
        "unit": "g",
        "category": "dairy",
        "inStock": false
      },
      {
        "name": "Toor Dal",
        "quantity": 1,
        "unit": "cup",
        "category": "grains",
        "inStock": false
      },
      {
        "name": "Onion",
        "quantity": 1,
        "unit": "pc",
        "category": "produce",
        "inStock": false
      },
      {
        "name": "Tomato",
        "quantity": 2,
        "unit": "pc",
        "category": "produce",
        "inStock": false
      },
      {
        "name": "Green Chilli",
        "quantity": 2,
        "unit": "pc",
        "category": "produce",
        "inStock": false
      },
      {
        "name": "Ginger-Garlic Paste",
        "quantity": 1,
        "unit": "tbsp",
        "category": "produce",
        "inStock": false
      },
      {
        "name": "Coriander Leaves",
        "quantity": 0.25,
        "unit": "cup",
        "category": "produce",
        "inStock": false
      },
      {
        "name": "Salt",
        "quantity": 1,
        "unit": "tsp",
        "category": "pantry"
      },
      {
        "name": "Turmeric",
        "quantity": 0.5,
        "unit": "tsp",
        "category": "spices"
      },
      {
        "name": "Mustard Oil",
        "quantity": 1,
        "unit": "tbsp",
        "category": "pantry"
      },
      {
        "name": "Cumin Seeds",
        "quantity": 1,
        "unit": "tsp",
        "category": "spices"
      },
      {
        "name": "Red Chili Powder",
        "quantity": 0.5,
        "unit": "tsp",
        "category": "spices"
      },
      {
        "name": "Cumin Seeds",
        "quantity": 1,
        "unit": "tsp",
        "category": "spices"
      },
      {
        "name": "Panch Phoron",
        "quantity": 0.5,
        "unit": "tsp",
        "category": "spices"
      }
    ],
    "bengali-cholar-dal": [
      {
        "name": "Chana Dal",
        "quantity": 200,
        "unit": "g",
        "category": "grains"
      },
      {
        "name": "Coconut",
        "quantity": 30,
        "unit": "g",
        "category": "produce"
      },
      {
        "name": "Raisins",
        "quantity": 15,
        "unit": "g",
        "category": "produce"
      },
      {
        "name": "Cardamom",
        "quantity": 4,
        "unit": "pieces",
        "category": "spices"
      },
      {
        "name": "Cinnamon",
        "quantity": 1,
        "unit": "piece",
        "category": "spices"
      },
      {
        "name": "Dried Red Chillies",
        "quantity": 3,
        "unit": "pieces",
        "category": "spices"
      },
      {
        "name": "Mustard Oil",
        "quantity": 15,
        "unit": "ml",
        "category": "pantry"
      },
      {
        "name": "Bay Leaf",
        "quantity": 2,
        "unit": "pieces",
        "category": "spices"
      },
      {
        "name": "Cumin Seeds",
        "quantity": 5,
        "unit": "g",
        "category": "spices"
      },
      {
        "name": "Green Chillies",
        "quantity": 3,
        "unit": "pieces",
        "category": "produce"
      },
      {
        "name": "Mixed Dal",
        "quantity": 80,
        "unit": "g",
        "category": "proteins",
        "inStock": false
      }
    ],
    "bengali-macher-chop": [
      {
        "name": "Sea Bass",
        "quantity": 250,
        "unit": "g",
        "category": "proteins"
      },
      {
        "name": "Potatoes",
        "quantity": 200,
        "unit": "g",
        "category": "produce"
      },
      {
        "name": "Onion",
        "quantity": 50,
        "unit": "g",
        "category": "produce"
      },
      {
        "name": "Green Chilli",
        "quantity": 5,
        "unit": "g",
        "category": "produce"
      },
      {
        "name": "Ginger",
        "quantity": 10,
        "unit": "g",
        "category": "produce"
      },
      {
        "name": "Turmeric",
        "quantity": 3,
        "unit": "g",
        "category": "spices"
      },
      {
        "name": "Cumin Powder",
        "quantity": 3,
        "unit": "g",
        "category": "spices"
      },
      {
        "name": "Breadcrumbs",
        "quantity": 50,
        "unit": "g",
        "category": "pantry"
      },
      {
        "name": "Eggs",
        "quantity": 2,
        "unit": "pieces",
        "category": "dairy"
      }
    ],
    "poha-mp": [
      {
        "name": "Poha (Flattened Rice)",
        "quantity": 100,
        "unit": "g",
        "category": "grains",
        "inStock": false
      },
      {
        "name": "Peanuts",
        "quantity": 30,
        "unit": "g",
        "category": "proteins",
        "inStock": false
      },
      {
        "name": "Potatoes",
        "quantity": 1,
        "unit": "pc",
        "category": "produce",
        "inStock": false
      },
      {
        "name": "Ghee",
        "quantity": 2,
        "unit": "tbsp",
        "category": "pantry",
        "inStock": false
      },
      {
        "name": "Oil",
        "quantity": 2,
        "unit": "tbsp",
        "category": "pantry",
        "inStock": false
      },
      {
        "name": "Spices",
        "quantity": 1,
        "unit": "packet",
        "category": "spices",
        "inStock": false
      }
    ],
    "dal-bafla": [
      {
        "name": "Mixed Dal",
        "quantity": 80,
        "unit": "g",
        "category": "proteins",
        "inStock": false
      },
      {
        "name": "Wheat Flour",
        "quantity": 200,
        "unit": "g",
        "category": "grains",
        "inStock": false
      },
      {
        "name": "Sattu",
        "quantity": 100,
        "unit": "g",
        "category": "grains",
        "inStock": false
      },
      {
        "name": "Ghee",
        "quantity": 2,
        "unit": "tbsp",
        "category": "pantry",
        "inStock": false
      },
      {
        "name": "Oil",
        "quantity": 2,
        "unit": "tbsp",
        "category": "pantry",
        "inStock": false
      },
      {
        "name": "Spices",
        "quantity": 1,
        "unit": "packet",
        "category": "spices",
        "inStock": false
      },
      {
        "name": "Toor Dal",
        "quantity": 1,
        "unit": "cup",
        "category": "grains",
        "inStock": false
      },
      {
        "name": "Onion",
        "quantity": 1,
        "unit": "pc",
        "category": "produce",
        "inStock": false
      },
      {
        "name": "Tomato",
        "quantity": 2,
        "unit": "pc",
        "category": "produce",
        "inStock": false
      },
      {
        "name": "Green Chilli",
        "quantity": 2,
        "unit": "pc",
        "category": "produce",
        "inStock": false
      },
      {
        "name": "Ginger-Garlic Paste",
        "quantity": 1,
        "unit": "tbsp",
        "category": "produce",
        "inStock": false
      },
      {
        "name": "Coriander Leaves",
        "quantity": 0.25,
        "unit": "cup",
        "category": "produce",
        "inStock": false
      },
      {
        "name": "Salt",
        "quantity": 1,
        "unit": "tsp",
        "category": "pantry"
      },
      {
        "name": "Turmeric",
        "quantity": 0.5,
        "unit": "tsp",
        "category": "spices"
      },
      {
        "name": "Cumin Seeds",
        "quantity": 1,
        "unit": "tsp",
        "category": "spices"
      }
    ],
    "sabudana-khichdi": [
      {
        "name": "Sabudana",
        "quantity": 1,
        "unit": "cup",
        "category": "grains"
      },
      {
        "name": "Peanuts",
        "quantity": 0.25,
        "unit": "cup",
        "category": "proteins"
      },
      {
        "name": "Potato",
        "quantity": 1,
        "unit": "pc",
        "category": "produce"
      },
      {
        "name": "Green Chilli",
        "quantity": 1,
        "unit": "pc",
        "category": "produce"
      },
      {
        "name": "Cumin Seeds",
        "quantity": 1,
        "unit": "tsp",
        "category": "spices"
      },
      {
        "name": "Ghee",
        "quantity": 1,
        "unit": "tbsp",
        "category": "dairy"
      },
      {
        "name": "Curry Leaves",
        "quantity": 1,
        "unit": "sprig",
        "category": "produce"
      },
      {
        "name": "Salt",
        "quantity": 1,
        "unit": "tsp",
        "category": "pantry"
      },
      {
        "name": "Lemon Juice",
        "quantity": 1,
        "unit": "tbsp",
        "category": "pantry"
      },
      {
        "name": "Coriander Leaves",
        "quantity": 0.25,
        "unit": "cup",
        "category": "produce"
      }
    ],
    "mp-kofta": [
      {
        "name": "Bottle Gourd",
        "quantity": 1,
        "unit": "cup",
        "category": "produce"
      },
      {
        "name": "Besan",
        "quantity": 0.5,
        "unit": "cup",
        "category": "grains"
      },
      {
        "name": "Ajwain",
        "quantity": 0.5,
        "unit": "tsp",
        "category": "spices"
      },
      {
        "name": "Onion",
        "quantity": 1,
        "unit": "pc",
        "category": "produce"
      },
      {
        "name": "Tomato",
        "quantity": 2,
        "unit": "pcs",
        "category": "produce"
      },
      {
        "name": "Ginger-Garlic Paste",
        "quantity": 1,
        "unit": "tbsp",
        "category": "pantry"
      },
      {
        "name": "Green Chilli",
        "quantity": 1,
        "unit": "pc",
        "category": "produce"
      },
      {
        "name": "Turmeric",
        "quantity": 0.5,
        "unit": "tsp",
        "category": "spices"
      },
      {
        "name": "Cumin Seeds",
        "quantity": 1,
        "unit": "tsp",
        "category": "spices"
      },
      {
        "name": "Red Chili Powder",
        "quantity": 0.5,
        "unit": "tsp",
        "category": "spices"
      },
      {
        "name": "Garam Masala",
        "quantity": 1,
        "unit": "tsp",
        "category": "spices"
      },
      {
        "name": "Cashews",
        "quantity": 10,
        "unit": "g",
        "category": "pantry"
      },
      {
        "name": "Salt",
        "quantity": 1,
        "unit": "tsp",
        "category": "pantry"
      },
      {
        "name": "Oil",
        "quantity": 2,
        "unit": "tbsp",
        "category": "pantry"
      },
      {
        "name": "Coriander Leaves",
        "quantity": 0.25,
        "unit": "cup",
        "category": "produce"
      },
      {
        "name": "Rice",
        "quantity": 1,
        "unit": "cup",
        "category": "grains"
      }
    ],
    "dal-kofta": [
      {
        "name": "Chana Dal",
        "quantity": 0.75,
        "unit": "cup",
        "category": "proteins"
      },
      {
        "name": "Potato",
        "quantity": 1,
        "unit": "pc",
        "category": "produce"
      },
      {
        "name": "Besan",
        "quantity": 0.25,
        "unit": "cup",
        "category": "grains"
      },
      {
        "name": "Onion",
        "quantity": 1,
        "unit": "pc",
        "category": "produce"
      },
      {
        "name": "Tomato",
        "quantity": 2,
        "unit": "pcs",
        "category": "produce"
      },
      {
        "name": "Ginger-Garlic Paste",
        "quantity": 1,
        "unit": "tbsp",
        "category": "pantry"
      },
      {
        "name": "Green Chilli",
        "quantity": 2,
        "unit": "pcs",
        "category": "produce"
      },
      {
        "name": "Turmeric",
        "quantity": 0.5,
        "unit": "tsp",
        "category": "spices"
      },
      {
        "name": "Cumin Seeds",
        "quantity": 1,
        "unit": "tsp",
        "category": "spices"
      },
      {
        "name": "Red Chili Powder",
        "quantity": 0.5,
        "unit": "tsp",
        "category": "spices"
      },
      {
        "name": "Garam Masala",
        "quantity": 1,
        "unit": "tsp",
        "category": "spices"
      },
      {
        "name": "Salt",
        "quantity": 1,
        "unit": "tsp",
        "category": "pantry"
      },
      {
        "name": "Oil",
        "quantity": 2,
        "unit": "tbsp",
        "category": "pantry"
      },
      {
        "name": "Coriander Leaves",
        "quantity": 0.25,
        "unit": "cup",
        "category": "produce"
      },
      {
        "name": "Rice",
        "quantity": 1,
        "unit": "cup",
        "category": "grains"
      },
      {
        "name": "Mixed Dal",
        "quantity": 80,
        "unit": "g",
        "category": "proteins",
        "inStock": false
      }
    ],
    "dal-tadka-central": [
      {
        "name": "Mixed Dal",
        "quantity": 80,
        "unit": "g",
        "category": "proteins",
        "inStock": false
      },
      {
        "name": "Ghee",
        "quantity": 2,
        "unit": "tbsp",
        "category": "pantry",
        "inStock": false
      },
      {
        "name": "Oil",
        "quantity": 2,
        "unit": "tbsp",
        "category": "pantry",
        "inStock": false
      },
      {
        "name": "Spices",
        "quantity": 1,
        "unit": "packet",
        "category": "spices",
        "inStock": false
      },
      {
        "name": "Toor Dal",
        "quantity": 1,
        "unit": "cup",
        "category": "grains",
        "inStock": false
      },
      {
        "name": "Onion",
        "quantity": 1,
        "unit": "pc",
        "category": "produce",
        "inStock": false
      },
      {
        "name": "Tomato",
        "quantity": 2,
        "unit": "pc",
        "category": "produce",
        "inStock": false
      },
      {
        "name": "Green Chilli",
        "quantity": 2,
        "unit": "pc",
        "category": "produce",
        "inStock": false
      },
      {
        "name": "Ginger-Garlic Paste",
        "quantity": 1,
        "unit": "tbsp",
        "category": "produce",
        "inStock": false
      },
      {
        "name": "Coriander Leaves",
        "quantity": 0.25,
        "unit": "cup",
        "category": "produce",
        "inStock": false
      },
      {
        "name": "Salt",
        "quantity": 1,
        "unit": "tsp",
        "category": "pantry"
      },
      {
        "name": "Turmeric",
        "quantity": 0.5,
        "unit": "tsp",
        "category": "spices"
      },
      {
        "name": "Cumin Seeds",
        "quantity": 1,
        "unit": "tsp",
        "category": "spices"
      }
    ],
    "chole-central": [
      {
        "name": "Chickpeas",
        "quantity": 1,
        "unit": "cup",
        "category": "proteins"
      },
      {
        "name": "Onion",
        "quantity": 1,
        "unit": "pc",
        "category": "produce"
      },
      {
        "name": "Tomato",
        "quantity": 2,
        "unit": "pcs",
        "category": "produce"
      },
      {
        "name": "Ginger-Garlic Paste",
        "quantity": 1,
        "unit": "tbsp",
        "category": "pantry"
      },
      {
        "name": "Oil",
        "quantity": 2,
        "unit": "tbsp",
        "category": "pantry"
      },
      {
        "name": "Salt",
        "quantity": 1,
        "unit": "tsp",
        "category": "pantry"
      },
      {
        "name": "Turmeric",
        "quantity": 0.25,
        "unit": "tsp",
        "category": "spices"
      },
      {
        "name": "Red Chili Powder",
        "quantity": 0.5,
        "unit": "tsp",
        "category": "spices"
      },
      {
        "name": "Chole Masala",
        "quantity": 1,
        "unit": "tbsp",
        "category": "spices"
      },
      {
        "name": "Coriander Leaves",
        "quantity": 0.25,
        "unit": "cup",
        "category": "produce"
      },
      {
        "name": "Flour",
        "quantity": 1,
        "unit": "cup",
        "category": "grains"
      },
      {
        "name": "Yogurt",
        "quantity": 2,
        "unit": "tbsp",
        "category": "dairy"
      }
    ],
    "aloo-bonda": [
      {
        "name": "Potatoes",
        "quantity": 3,
        "unit": "pc",
        "category": "produce"
      },
      {
        "name": "Gram Flour",
        "quantity": 0.5,
        "unit": "cup",
        "category": "grains"
      },
      {
        "name": "Onion",
        "quantity": 0.5,
        "unit": "pc",
        "category": "produce"
      },
      {
        "name": "Green Chilli",
        "quantity": 2,
        "unit": "pc",
        "category": "produce"
      },
      {
        "name": "Ginger",
        "quantity": 1,
        "unit": "inch",
        "category": "produce"
      },
      {
        "name": "Curry Leaves",
        "quantity": 1,
        "unit": "sprig",
        "category": "produce"
      },
      {
        "name": "Mustard Seeds",
        "quantity": 0.5,
        "unit": "tsp",
        "category": "spices"
      },
      {
        "name": "Turmeric",
        "quantity": 0.25,
        "unit": "tsp",
        "category": "spices"
      },
      {
        "name": "Salt",
        "quantity": 1,
        "unit": "tsp",
        "category": "pantry"
      },
      {
        "name": "Oil",
        "quantity": 2,
        "unit": "tbsp",
        "category": "pantry"
      }
    ],
    "paneer-bhurji-central": [
      {
        "name": "Paneer",
        "quantity": 150,
        "unit": "g",
        "category": "proteins",
        "inStock": false
      },
      {
        "name": "Ghee",
        "quantity": 2,
        "unit": "tbsp",
        "category": "pantry",
        "inStock": false
      },
      {
        "name": "Oil",
        "quantity": 2,
        "unit": "tbsp",
        "category": "pantry",
        "inStock": false
      },
      {
        "name": "Spices",
        "quantity": 1,
        "unit": "packet",
        "category": "spices",
        "inStock": false
      },
      {
        "name": "Onion",
        "quantity": 1,
        "unit": "pc",
        "category": "produce",
        "inStock": false
      },
      {
        "name": "Tomato",
        "quantity": 2,
        "unit": "pc",
        "category": "produce",
        "inStock": false
      },
      {
        "name": "Green Chilli",
        "quantity": 2,
        "unit": "pc",
        "category": "produce",
        "inStock": false
      },
      {
        "name": "Ginger-Garlic Paste",
        "quantity": 1,
        "unit": "tbsp",
        "category": "produce",
        "inStock": false
      },
      {
        "name": "Coriander Leaves",
        "quantity": 0.25,
        "unit": "cup",
        "category": "produce",
        "inStock": false
      },
      {
        "name": "Salt",
        "quantity": 1,
        "unit": "tsp",
        "category": "pantry"
      },
      {
        "name": "Turmeric",
        "quantity": 0.5,
        "unit": "tsp",
        "category": "spices"
      },
      {
        "name": "Cumin Seeds",
        "quantity": 1,
        "unit": "tsp",
        "category": "spices"
      },
      {
        "name": "Red Chili Powder",
        "quantity": 0.5,
        "unit": "tsp",
        "category": "spices"
      }
    ],
    "kadai-mushroom": [
      {
        "name": "Mushrooms",
        "quantity": 100,
        "unit": "g",
        "category": "produce",
        "inStock": false
      },
      {
        "name": "Capsicum",
        "quantity": 1,
        "unit": "pc",
        "category": "produce",
        "inStock": false
      },
      {
        "name": "Onions",
        "quantity": 1,
        "unit": "pc",
        "category": "produce",
        "inStock": false
      },
      {
        "name": "Tomatoes",
        "quantity": 1,
        "unit": "pc",
        "category": "produce",
        "inStock": false
      },
      {
        "name": "Ghee",
        "quantity": 2,
        "unit": "tbsp",
        "category": "pantry",
        "inStock": false
      },
      {
        "name": "Oil",
        "quantity": 2,
        "unit": "tbsp",
        "category": "pantry",
        "inStock": false
      },
      {
        "name": "Spices",
        "quantity": 1,
        "unit": "packet",
        "category": "spices",
        "inStock": false
      },
      {
        "name": "Onion",
        "quantity": 1,
        "unit": "pc",
        "category": "produce",
        "inStock": false
      },
      {
        "name": "Tomato",
        "quantity": 2,
        "unit": "pc",
        "category": "produce",
        "inStock": false
      },
      {
        "name": "Green Chilli",
        "quantity": 2,
        "unit": "pc",
        "category": "produce",
        "inStock": false
      },
      {
        "name": "Ginger-Garlic Paste",
        "quantity": 1,
        "unit": "tbsp",
        "category": "produce",
        "inStock": false
      },
      {
        "name": "Coriander Leaves",
        "quantity": 0.25,
        "unit": "cup",
        "category": "produce",
        "inStock": false
      },
      {
        "name": "Salt",
        "quantity": 1,
        "unit": "tsp",
        "category": "pantry"
      },
      {
        "name": "Turmeric",
        "quantity": 0.5,
        "unit": "tsp",
        "category": "spices"
      },
      {
        "name": "Cumin Seeds",
        "quantity": 1,
        "unit": "tsp",
        "category": "spices"
      },
      {
        "name": "Red Chili Powder",
        "quantity": 0.5,
        "unit": "tsp",
        "category": "spices"
      }
    ],
    "gobi-aloo": [
      {
        "name": "Potatoes",
        "quantity": 3,
        "unit": "pc",
        "category": "produce",
        "inStock": false
      },
      {
        "name": "Cauliflower",
        "quantity": 200,
        "unit": "g",
        "category": "produce",
        "inStock": false
      },
      {
        "name": "Ghee",
        "quantity": 2,
        "unit": "tbsp",
        "category": "pantry",
        "inStock": false
      },
      {
        "name": "Oil",
        "quantity": 2,
        "unit": "tbsp",
        "category": "pantry",
        "inStock": false
      },
      {
        "name": "Spices",
        "quantity": 1,
        "unit": "packet",
        "category": "spices",
        "inStock": false
      }
    ],
    "amritsari-chole": [
      {
        "name": "Chickpeas",
        "quantity": 1,
        "unit": "cup",
        "category": "grains",
        "inStock": false
      },
      {
        "name": "Chana Dal",
        "quantity": 80,
        "unit": "g",
        "category": "proteins",
        "inStock": false
      },
      {
        "name": "Ghee",
        "quantity": 2,
        "unit": "tbsp",
        "category": "pantry",
        "inStock": false
      },
      {
        "name": "Oil",
        "quantity": 2,
        "unit": "tbsp",
        "category": "pantry",
        "inStock": false
      },
      {
        "name": "Spices",
        "quantity": 1,
        "unit": "packet",
        "category": "spices",
        "inStock": false
      },
      {
        "name": "Salt",
        "quantity": 1,
        "unit": "tsp",
        "category": "pantry"
      },
      {
        "name": "Turmeric",
        "quantity": 0.5,
        "unit": "tsp",
        "category": "spices"
      },
      {
        "name": "Cumin Seeds",
        "quantity": 1,
        "unit": "tsp",
        "category": "spices"
      }
    ],
    "paneer-pakora": [
      {
        "name": "Paneer",
        "quantity": 150,
        "unit": "g",
        "category": "proteins",
        "inStock": false
      },
      {
        "name": "Ghee",
        "quantity": 2,
        "unit": "tbsp",
        "category": "pantry",
        "inStock": false
      },
      {
        "name": "Oil",
        "quantity": 2,
        "unit": "tbsp",
        "category": "pantry",
        "inStock": false
      },
      {
        "name": "Spices",
        "quantity": 1,
        "unit": "packet",
        "category": "spices",
        "inStock": false
      },
      {
        "name": "Milk",
        "quantity": 1,
        "unit": "cup",
        "category": "dairy"
      },
      {
        "name": "Sugar",
        "quantity": 1,
        "unit": "tsp",
        "category": "pantry"
      },
      {
        "name": "Tea Leaves",
        "quantity": 1,
        "unit": "tsp",
        "category": "pantry"
      }
    ],
    "kachori": [
      {
        "name": "Potatoes",
        "quantity": 3,
        "unit": "pc",
        "category": "produce",
        "inStock": false
      },
      {
        "name": "Peas",
        "quantity": 50,
        "unit": "g",
        "category": "produce",
        "inStock": false
      },
      {
        "name": "Wheat Flour",
        "quantity": 200,
        "unit": "g",
        "category": "grains",
        "inStock": false
      },
      {
        "name": "Ghee",
        "quantity": 2,
        "unit": "tbsp",
        "category": "pantry",
        "inStock": false
      },
      {
        "name": "Oil",
        "quantity": 2,
        "unit": "tbsp",
        "category": "pantry",
        "inStock": false
      },
      {
        "name": "Spices",
        "quantity": 1,
        "unit": "packet",
        "category": "spices",
        "inStock": false
      },
      {
        "name": "Salt",
        "quantity": 1,
        "unit": "tsp",
        "category": "pantry"
      },
      {
        "name": "Turmeric",
        "quantity": 0.5,
        "unit": "tsp",
        "category": "spices"
      },
      {
        "name": "Cumin Seeds",
        "quantity": 1,
        "unit": "tsp",
        "category": "spices"
      }
    ],
    "imarti": [
      {
        "name": "Maida",
        "quantity": 200,
        "unit": "g",
        "category": "grains",
        "inStock": false
      },
      {
        "name": "Sugar",
        "quantity": 200,
        "unit": "g",
        "category": "pantry",
        "inStock": false
      },
      {
        "name": "Yogurt",
        "quantity": 100,
        "unit": "g",
        "category": "dairy",
        "inStock": false
      },
      {
        "name": "Cardamom",
        "quantity": 2,
        "unit": "pods",
        "category": "spices"
      },
      {
        "name": "Raisins",
        "quantity": 2,
        "unit": "tbsp",
        "category": "pantry"
      },
      {
        "name": "Almonds",
        "quantity": 2,
        "unit": "tbsp",
        "category": "pantry"
      },
      {
        "name": "Pistachios",
        "quantity": 1,
        "unit": "tbsp",
        "category": "pantry"
      }
    ],
    "thukpa": [
      {
        "name": "Chicken",
        "quantity": 150,
        "unit": "g",
        "category": "proteins"
      },
      {
        "name": "Noodles",
        "quantity": 1,
        "unit": "cup",
        "category": "grains"
      },
      {
        "name": "Onion",
        "quantity": 0.5,
        "unit": "pc",
        "category": "produce"
      },
      {
        "name": "Tomato",
        "quantity": 1,
        "unit": "pc",
        "category": "produce"
      },
      {
        "name": "Carrot",
        "quantity": 0.5,
        "unit": "pc",
        "category": "produce"
      },
      {
        "name": "Garlic",
        "quantity": 2,
        "unit": "pcs",
        "category": "produce"
      },
      {
        "name": "Ginger",
        "quantity": 0.5,
        "unit": "inch",
        "category": "produce"
      },
      {
        "name": "Salt",
        "quantity": 1,
        "unit": "tsp",
        "category": "pantry"
      },
      {
        "name": "Black Pepper",
        "quantity": 0.5,
        "unit": "tsp",
        "category": "spices"
      },
      {
        "name": "Coriander Leaves",
        "quantity": 0.25,
        "unit": "cup",
        "category": "produce"
      }
    ],
    "momos": [
      {
        "name": "Chicken",
        "quantity": 200,
        "unit": "g",
        "category": "proteins"
      },
      {
        "name": "Maida",
        "quantity": 1.5,
        "unit": "cup",
        "category": "grains"
      },
      {
        "name": "Cabbage",
        "quantity": 0.5,
        "unit": "cup",
        "category": "produce"
      },
      {
        "name": "Carrot",
        "quantity": 0.5,
        "unit": "pc",
        "category": "produce"
      },
      {
        "name": "Onion",
        "quantity": 0.5,
        "unit": "pc",
        "category": "produce"
      },
      {
        "name": "Garlic",
        "quantity": 2,
        "unit": "pcs",
        "category": "produce"
      },
      {
        "name": "Ginger",
        "quantity": 0.5,
        "unit": "inch",
        "category": "produce"
      },
      {
        "name": "Soy Sauce",
        "quantity": 1,
        "unit": "tbsp",
        "category": "pantry"
      },
      {
        "name": "Salt",
        "quantity": 1,
        "unit": "tsp",
        "category": "pantry"
      },
      {
        "name": "Oil",
        "quantity": 1,
        "unit": "tbsp",
        "category": "pantry"
      }
    ],
    "khar-assam": [
      {
        "name": "Raw Papaya",
        "quantity": 100,
        "unit": "g",
        "category": "produce"
      },
      {
        "name": "Mustard Greens",
        "quantity": 50,
        "unit": "g",
        "category": "produce"
      },
      {
        "name": "Green Chilli",
        "quantity": 2,
        "unit": "pc",
        "category": "produce"
      },
      {
        "name": "Ginger",
        "quantity": 10,
        "unit": "g",
        "category": "produce"
      },
      {
        "name": "Turmeric",
        "quantity": 0.5,
        "unit": "tsp",
        "category": "spices"
      },
      {
        "name": "Mustard Oil",
        "quantity": 1,
        "unit": "tbsp",
        "category": "pantry"
      },
      {
        "name": "Salt",
        "quantity": 1,
        "unit": "tsp",
        "category": "pantry"
      }
    ],
    "smoked-pork": [
      {
        "name": "Smoked Pork",
        "quantity": 250,
        "unit": "g",
        "category": "proteins"
      },
      {
        "name": "Bamboo Shoot",
        "quantity": 1,
        "unit": "cup",
        "category": "produce"
      },
      {
        "name": "Onion",
        "quantity": 1,
        "unit": "pc",
        "category": "produce"
      },
      {
        "name": "Ginger",
        "quantity": 1,
        "unit": "inch",
        "category": "produce"
      },
      {
        "name": "Garlic",
        "quantity": 4,
        "unit": "cloves",
        "category": "produce"
      },
      {
        "name": "Green Chilli",
        "quantity": 2,
        "unit": "pc",
        "category": "produce"
      },
      {
        "name": "Mustard Oil",
        "quantity": 1,
        "unit": "tbsp",
        "category": "pantry"
      },
      {
        "name": "Turmeric",
        "quantity": 0.5,
        "unit": "tsp",
        "category": "spices"
      },
      {
        "name": "Salt",
        "quantity": 1,
        "unit": "tsp",
        "category": "pantry"
      },
      {
        "name": "Water",
        "quantity": 1,
        "unit": "cup",
        "category": "pantry"
      }
    ],
    "jadoh": [
      {
        "name": "Rice",
        "quantity": 1,
        "unit": "cup",
        "category": "grains"
      },
      {
        "name": "Pork",
        "quantity": 150,
        "unit": "g",
        "category": "proteins"
      },
      {
        "name": "Onion",
        "quantity": 1,
        "unit": "pc",
        "category": "produce"
      },
      {
        "name": "Ginger",
        "quantity": 10,
        "unit": "g",
        "category": "produce"
      },
      {
        "name": "Garlic",
        "quantity": 6,
        "unit": "pcs",
        "category": "produce"
      },
      {
        "name": "Turmeric",
        "quantity": 0.5,
        "unit": "tsp",
        "category": "spices"
      },
      {
        "name": "Mustard Oil",
        "quantity": 1,
        "unit": "tbsp",
        "category": "pantry"
      },
      {
        "name": "Salt",
        "quantity": 1,
        "unit": "tsp",
        "category": "pantry"
      }
    ],
    "trout-bamboo": [
      {
        "name": "Trout",
        "quantity": 250,
        "unit": "g",
        "category": "proteins"
      },
      {
        "name": "Bamboo Shoot",
        "quantity": 1,
        "unit": "cup",
        "category": "produce"
      },
      {
        "name": "Onion",
        "quantity": 1,
        "unit": "pc",
        "category": "produce"
      },
      {
        "name": "Ginger",
        "quantity": 1,
        "unit": "inch",
        "category": "produce"
      },
      {
        "name": "Garlic",
        "quantity": 4,
        "unit": "cloves",
        "category": "produce"
      },
      {
        "name": "Green Chilli",
        "quantity": 2,
        "unit": "pcs",
        "category": "produce"
      },
      {
        "name": "Turmeric",
        "quantity": 0.5,
        "unit": "tsp",
        "category": "spices"
      },
      {
        "name": "Salt",
        "quantity": 1,
        "unit": "tsp",
        "category": "pantry"
      },
      {
        "name": "Mustard Oil",
        "quantity": 1,
        "unit": "tbsp",
        "category": "pantry"
      },
      {
        "name": "Rice",
        "quantity": 1,
        "unit": "cup",
        "category": "grains"
      }
    ],
    "salmon-steamed": [
      {
        "name": "Salmon",
        "quantity": 250,
        "unit": "g",
        "category": "proteins"
      },
      {
        "name": "Sticky Rice",
        "quantity": 1,
        "unit": "cup",
        "category": "grains"
      },
      {
        "name": "Ginger",
        "quantity": 1,
        "unit": "inch",
        "category": "produce"
      },
      {
        "name": "Garlic",
        "quantity": 2,
        "unit": "pcs",
        "category": "produce"
      },
      {
        "name": "Soy Sauce",
        "quantity": 1,
        "unit": "tbsp",
        "category": "pantry"
      },
      {
        "name": "Spring Onion",
        "quantity": 1,
        "unit": "pc",
        "category": "produce"
      },
      {
        "name": "Salt",
        "quantity": 0.5,
        "unit": "tsp",
        "category": "pantry"
      }
    ],
    "chicken-masor-tenga": [
      {
        "name": "Chicken",
        "quantity": 200,
        "unit": "g",
        "category": "proteins",
        "inStock": false
      },
      {
        "name": "Ghee",
        "quantity": 2,
        "unit": "tbsp",
        "category": "pantry",
        "inStock": false
      },
      {
        "name": "Oil",
        "quantity": 2,
        "unit": "tbsp",
        "category": "pantry",
        "inStock": false
      },
      {
        "name": "Spices",
        "quantity": 1,
        "unit": "packet",
        "category": "spices",
        "inStock": false
      },
      {
        "name": "Onion",
        "quantity": 1,
        "unit": "pc",
        "category": "produce",
        "inStock": false
      },
      {
        "name": "Tomato",
        "quantity": 2,
        "unit": "pc",
        "category": "produce",
        "inStock": false
      },
      {
        "name": "Green Chilli",
        "quantity": 2,
        "unit": "pc",
        "category": "produce",
        "inStock": false
      },
      {
        "name": "Ginger-Garlic Paste",
        "quantity": 1,
        "unit": "tbsp",
        "category": "produce",
        "inStock": false
      },
      {
        "name": "Coriander Leaves",
        "quantity": 0.25,
        "unit": "cup",
        "category": "produce",
        "inStock": false
      },
      {
        "name": "Salt",
        "quantity": 1,
        "unit": "tsp",
        "category": "pantry"
      },
      {
        "name": "Turmeric",
        "quantity": 0.5,
        "unit": "tsp",
        "category": "spices"
      },
      {
        "name": "Mustard Oil",
        "quantity": 1,
        "unit": "tbsp",
        "category": "pantry"
      },
      {
        "name": "Cumin Seeds",
        "quantity": 1,
        "unit": "tsp",
        "category": "spices"
      },
      {
        "name": "Red Chili Powder",
        "quantity": 0.5,
        "unit": "tsp",
        "category": "spices"
      }
    ],
    "tofu-stir-fry": [
      {
        "name": "Mixed Vegetables",
        "quantity": 1,
        "unit": "cup",
        "category": "produce",
        "inStock": false
      },
      {
        "name": "Tofu",
        "quantity": 200,
        "unit": "g",
        "category": "proteins",
        "inStock": false
      },
      {
        "name": "Ghee",
        "quantity": 2,
        "unit": "tbsp",
        "category": "pantry",
        "inStock": false
      },
      {
        "name": "Oil",
        "quantity": 2,
        "unit": "tbsp",
        "category": "pantry",
        "inStock": false
      },
      {
        "name": "Spices",
        "quantity": 1,
        "unit": "packet",
        "category": "spices",
        "inStock": false
      },
      {
        "name": "Onion",
        "quantity": 1,
        "unit": "pc",
        "category": "produce",
        "inStock": false
      },
      {
        "name": "Tomato",
        "quantity": 2,
        "unit": "pc",
        "category": "produce",
        "inStock": false
      },
      {
        "name": "Green Chilli",
        "quantity": 2,
        "unit": "pc",
        "category": "produce",
        "inStock": false
      },
      {
        "name": "Ginger-Garlic Paste",
        "quantity": 1,
        "unit": "tbsp",
        "category": "produce",
        "inStock": false
      },
      {
        "name": "Coriander Leaves",
        "quantity": 0.25,
        "unit": "cup",
        "category": "produce",
        "inStock": false
      }
    ],
    "mutton-naga": [
      {
        "name": "Mutton",
        "quantity": 200,
        "unit": "g",
        "category": "proteins",
        "inStock": false
      },
      {
        "name": "Ghee",
        "quantity": 2,
        "unit": "tbsp",
        "category": "pantry",
        "inStock": false
      },
      {
        "name": "Oil",
        "quantity": 2,
        "unit": "tbsp",
        "category": "pantry",
        "inStock": false
      },
      {
        "name": "Spices",
        "quantity": 1,
        "unit": "packet",
        "category": "spices",
        "inStock": false
      },
      {
        "name": "Rice",
        "quantity": 1,
        "unit": "cup",
        "category": "grains",
        "inStock": false
      },
      {
        "name": "Onion",
        "quantity": 1,
        "unit": "pc",
        "category": "produce",
        "inStock": false
      },
      {
        "name": "Tomato",
        "quantity": 2,
        "unit": "pc",
        "category": "produce",
        "inStock": false
      },
      {
        "name": "Green Chilli",
        "quantity": 2,
        "unit": "pc",
        "category": "produce",
        "inStock": false
      },
      {
        "name": "Ginger-Garlic Paste",
        "quantity": 1,
        "unit": "tbsp",
        "category": "produce",
        "inStock": false
      },
      {
        "name": "Coriander Leaves",
        "quantity": 0.25,
        "unit": "cup",
        "category": "produce",
        "inStock": false
      },
      {
        "name": "Salt",
        "quantity": 1,
        "unit": "tsp",
        "category": "pantry"
      },
      {
        "name": "Turmeric",
        "quantity": 0.5,
        "unit": "tsp",
        "category": "spices"
      },
      {
        "name": "Mustard Oil",
        "quantity": 1,
        "unit": "tbsp",
        "category": "pantry"
      },
      {
        "name": "Cumin Seeds",
        "quantity": 1,
        "unit": "tsp",
        "category": "spices"
      },
      {
        "name": "Red Chili Powder",
        "quantity": 0.5,
        "unit": "tsp",
        "category": "spices"
      }
    ],
    "northeast-veg-kofta": [
      {
        "name": "Mixed Vegetables",
        "quantity": 1,
        "unit": "cup",
        "category": "produce"
      },
      {
        "name": "Besan",
        "quantity": 0.5,
        "unit": "cup",
        "category": "grains"
      },
      {
        "name": "Onion",
        "quantity": 1,
        "unit": "pc",
        "category": "produce"
      },
      {
        "name": "Tomato",
        "quantity": 2,
        "unit": "pcs",
        "category": "produce"
      },
      {
        "name": "Green Chilli",
        "quantity": 2,
        "unit": "pcs",
        "category": "produce"
      },
      {
        "name": "Ginger-Garlic Paste",
        "quantity": 1,
        "unit": "tbsp",
        "category": "pantry"
      },
      {
        "name": "Turmeric",
        "quantity": 0.5,
        "unit": "tsp",
        "category": "spices"
      },
      {
        "name": "Cumin Seeds",
        "quantity": 1,
        "unit": "tsp",
        "category": "spices"
      },
      {
        "name": "Red Chili Powder",
        "quantity": 0.5,
        "unit": "tsp",
        "category": "spices"
      },
      {
        "name": "Salt",
        "quantity": 1,
        "unit": "tsp",
        "category": "pantry"
      },
      {
        "name": "Mustard Oil",
        "quantity": 1,
        "unit": "tbsp",
        "category": "pantry"
      },
      {
        "name": "Coriander Leaves",
        "quantity": 0.25,
        "unit": "cup",
        "category": "produce"
      },
      {
        "name": "Rice",
        "quantity": 1,
        "unit": "cup",
        "category": "grains"
      }
    ],
    "apong": [
      {
        "name": "Sticky Rice",
        "quantity": 200,
        "unit": "g",
        "category": "grains"
      },
      {
        "name": "Starter Cake (Pitha)",
        "quantity": 10,
        "unit": "g",
        "category": "pantry"
      },
      {
        "name": "Water",
        "quantity": 500,
        "unit": "ml",
        "category": "pantry"
      }
    ],
    "zutho": [
      {
        "name": "Sticky Rice",
        "quantity": 200,
        "unit": "g",
        "category": "grains"
      },
      {
        "name": "Starter Culture",
        "quantity": 5,
        "unit": "g",
        "category": "pantry"
      },
      {
        "name": "Water",
        "quantity": 400,
        "unit": "ml",
        "category": "pantry"
      }
    ],
    "yu-manipur": [
      {
        "name": "Rice",
        "quantity": 200,
        "unit": "g",
        "category": "grains"
      },
      {
        "name": "Starter Cake (Hamei)",
        "quantity": 10,
        "unit": "g",
        "category": "pantry"
      },
      {
        "name": "Water",
        "quantity": 400,
        "unit": "ml",
        "category": "pantry"
      }
    ],
    "thenthuk": [
      {
        "name": "Noodles",
        "quantity": 1,
        "unit": "cup",
        "category": "grains"
      },
      {
        "name": "Tofu",
        "quantity": 100,
        "unit": "g",
        "category": "proteins"
      },
      {
        "name": "Cabbage",
        "quantity": 0.5,
        "unit": "cup",
        "category": "produce"
      },
      {
        "name": "Carrot",
        "quantity": 0.5,
        "unit": "pc",
        "category": "produce"
      },
      {
        "name": "Onion",
        "quantity": 0.5,
        "unit": "pc",
        "category": "produce"
      },
      {
        "name": "Garlic",
        "quantity": 2,
        "unit": "pcs",
        "category": "produce"
      },
      {
        "name": "Ginger",
        "quantity": 0.5,
        "unit": "inch",
        "category": "produce"
      },
      {
        "name": "Salt",
        "quantity": 1,
        "unit": "tsp",
        "category": "pantry"
      },
      {
        "name": "Black Pepper",
        "quantity": 0.5,
        "unit": "tsp",
        "category": "spices"
      },
      {
        "name": "Coriander Leaves",
        "quantity": 0.25,
        "unit": "cup",
        "category": "produce"
      }
    ],
    "chamthong": [
      {
        "name": "Cabbage",
        "quantity": 0.5,
        "unit": "cup",
        "category": "produce",
        "inStock": false
      },
      {
        "name": "Tomatoes",
        "quantity": 1,
        "unit": "pc",
        "category": "produce",
        "inStock": false
      },
      {
        "name": "Potatoes",
        "quantity": 1,
        "unit": "pc",
        "category": "produce",
        "inStock": false
      },
      {
        "name": "Beans",
        "quantity": 0.25,
        "unit": "cup",
        "category": "produce",
        "inStock": false
      },
      {
        "name": "Oil",
        "quantity": 15,
        "unit": "ml",
        "category": "pantry",
        "inStock": false
      },
      {
        "name": "Ghee",
        "quantity": 2,
        "unit": "tbsp",
        "category": "pantry",
        "inStock": false
      },
      {
        "name": "Spices",
        "quantity": 1,
        "unit": "packet",
        "category": "spices",
        "inStock": false
      },
      {
        "name": "Onion",
        "quantity": 1,
        "unit": "pc",
        "category": "produce",
        "inStock": false
      },
      {
        "name": "Tomato",
        "quantity": 2,
        "unit": "pc",
        "category": "produce",
        "inStock": false
      },
      {
        "name": "Green Chilli",
        "quantity": 2,
        "unit": "pc",
        "category": "produce",
        "inStock": false
      },
      {
        "name": "Ginger-Garlic Paste",
        "quantity": 1,
        "unit": "tbsp",
        "category": "produce",
        "inStock": false
      },
      {
        "name": "Coriander Leaves",
        "quantity": 0.25,
        "unit": "cup",
        "category": "produce",
        "inStock": false
      },
      {
        "name": "Salt",
        "quantity": 1,
        "unit": "tsp",
        "category": "pantry"
      },
      {
        "name": "Turmeric",
        "quantity": 0.5,
        "unit": "tsp",
        "category": "spices"
      },
      {
        "name": "Mustard Oil",
        "quantity": 1,
        "unit": "tbsp",
        "category": "pantry"
      },
      {
        "name": "Cumin Seeds",
        "quantity": 1,
        "unit": "tsp",
        "category": "spices"
      },
      {
        "name": "Red Chili Powder",
        "quantity": 0.5,
        "unit": "tsp",
        "category": "spices"
      }
    ],
    "morok-metpa": [
      {
        "name": "Fish",
        "quantity": 100,
        "unit": "g",
        "category": "proteins"
      },
      {
        "name": "Red Chilli",
        "quantity": 3,
        "unit": "pcs",
        "category": "produce"
      },
      {
        "name": "Garlic",
        "quantity": 3,
        "unit": "pcs",
        "category": "produce"
      },
      {
        "name": "Ginger",
        "quantity": 1,
        "unit": "inch",
        "category": "produce"
      },
      {
        "name": "Mustard Oil",
        "quantity": 1,
        "unit": "tbsp",
        "category": "pantry"
      },
      {
        "name": "Salt",
        "quantity": 0.5,
        "unit": "tsp",
        "category": "pantry"
      }
    ],
    "singju": [
      {
        "name": "Cabbage",
        "quantity": 0.5,
        "unit": "cup",
        "category": "produce",
        "inStock": false
      },
      {
        "name": "Onions",
        "quantity": 0.5,
        "unit": "pc",
        "category": "produce",
        "inStock": false
      },
      {
        "name": "Cucumber",
        "quantity": 1,
        "unit": "pc",
        "category": "produce",
        "inStock": false
      },
      {
        "name": "Lemon",
        "quantity": 1,
        "unit": "pc",
        "category": "produce",
        "inStock": false
      },
      {
        "name": "Red Chilli",
        "quantity": 2,
        "unit": "pc",
        "category": "produce",
        "inStock": false
      },
      {
        "name": "Ghee",
        "quantity": 2,
        "unit": "tbsp",
        "category": "pantry",
        "inStock": false
      },
      {
        "name": "Oil",
        "quantity": 2,
        "unit": "tbsp",
        "category": "pantry",
        "inStock": false
      },
      {
        "name": "Spices",
        "quantity": 1,
        "unit": "packet",
        "category": "spices",
        "inStock": false
      }
    ],
    "paaknam": [
      {
        "name": "Fish",
        "quantity": 100,
        "unit": "g",
        "category": "proteins"
      },
      {
        "name": "Besan",
        "quantity": 0.5,
        "unit": "cup",
        "category": "grains"
      },
      {
        "name": "Mustard Greens",
        "quantity": 0.5,
        "unit": "cup",
        "category": "produce"
      },
      {
        "name": "Green Chilli",
        "quantity": 2,
        "unit": "pcs",
        "category": "produce"
      },
      {
        "name": "Onion",
        "quantity": 0.5,
        "unit": "pc",
        "category": "produce"
      },
      {
        "name": "Mustard Oil",
        "quantity": 1,
        "unit": "tbsp",
        "category": "pantry"
      },
      {
        "name": "Salt",
        "quantity": 0.5,
        "unit": "tsp",
        "category": "pantry"
      }
    ],
    "chak-hao-kheer": [
      {
        "name": "Black Rice (Chak-Hao)",
        "quantity": 0.5,
        "unit": "cup",
        "category": "grains"
      },
      {
        "name": "Coconut Milk",
        "quantity": 1,
        "unit": "cup",
        "category": "pantry"
      },
      {
        "name": "Milk",
        "quantity": 1,
        "unit": "cup",
        "category": "dairy"
      },
      {
        "name": "Jaggery",
        "quantity": 0.25,
        "unit": "cup",
        "category": "pantry"
      },
      {
        "name": "Cardamom",
        "quantity": 2,
        "unit": "pods",
        "category": "spices"
      },
      {
        "name": "Coconut",
        "quantity": 2,
        "unit": "tbsp",
        "category": "produce"
      },
      {
        "name": "Cashews",
        "quantity": 1,
        "unit": "tbsp",
        "category": "pantry"
      },
      {
        "name": "Raisins",
        "quantity": 1,
        "unit": "tbsp",
        "category": "pantry"
      }
    ],
    "alu-kangmet": [
      {
        "name": "Potatoes",
        "quantity": 2,
        "unit": "pc",
        "category": "produce",
        "inStock": false
      },
      {
        "name": "Red Chilli",
        "quantity": 2,
        "unit": "pc",
        "category": "produce",
        "inStock": false
      },
      {
        "name": "Mustard Oil",
        "quantity": 15,
        "unit": "ml",
        "category": "pantry",
        "inStock": false
      },
      {
        "name": "Ghee",
        "quantity": 2,
        "unit": "tbsp",
        "category": "pantry",
        "inStock": false
      },
      {
        "name": "Oil",
        "quantity": 2,
        "unit": "tbsp",
        "category": "pantry",
        "inStock": false
      },
      {
        "name": "Spices",
        "quantity": 1,
        "unit": "packet",
        "category": "spices",
        "inStock": false
      }
    ],
    "nga-thongba": [
      {
        "name": "Fish",
        "quantity": 250,
        "unit": "g",
        "category": "proteins"
      },
      {
        "name": "Onion",
        "quantity": 1,
        "unit": "pc",
        "category": "produce"
      },
      {
        "name": "Tomato",
        "quantity": 1,
        "unit": "pc",
        "category": "produce"
      },
      {
        "name": "Ginger-Garlic Paste",
        "quantity": 1,
        "unit": "tbsp",
        "category": "pantry"
      },
      {
        "name": "Green Chilli",
        "quantity": 2,
        "unit": "pcs",
        "category": "produce"
      },
      {
        "name": "Turmeric",
        "quantity": 0.5,
        "unit": "tsp",
        "category": "spices"
      },
      {
        "name": "Red Chili Powder",
        "quantity": 0.5,
        "unit": "tsp",
        "category": "spices"
      },
      {
        "name": "Mustard Oil",
        "quantity": 1,
        "unit": "tbsp",
        "category": "pantry"
      },
      {
        "name": "Salt",
        "quantity": 1,
        "unit": "tsp",
        "category": "pantry"
      },
      {
        "name": "Coriander Leaves",
        "quantity": 0.25,
        "unit": "cup",
        "category": "produce"
      },
      {
        "name": "Rice",
        "quantity": 1,
        "unit": "cup",
        "category": "grains"
      }
    ],
    "pumaloi": [
      {
        "name": "Sticky Rice",
        "quantity": 1,
        "unit": "cup",
        "category": "grains"
      },
      {
        "name": "Water",
        "quantity": 1.25,
        "unit": "cup",
        "category": "pantry"
      },
      {
        "name": "Salt",
        "quantity": 0.5,
        "unit": "tsp",
        "category": "pantry"
      }
    ],
    "doh-neiiong": [
      {
        "name": "Pork",
        "quantity": 250,
        "unit": "g",
        "category": "proteins"
      },
      {
        "name": "Axone",
        "quantity": 50,
        "unit": "g",
        "category": "pantry"
      },
      {
        "name": "Onion",
        "quantity": 1,
        "unit": "pc",
        "category": "produce"
      },
      {
        "name": "Ginger",
        "quantity": 1,
        "unit": "inch",
        "category": "produce"
      },
      {
        "name": "Garlic",
        "quantity": 3,
        "unit": "pcs",
        "category": "produce"
      },
      {
        "name": "Green Chilli",
        "quantity": 2,
        "unit": "pcs",
        "category": "produce"
      },
      {
        "name": "Black Sesame Seeds",
        "quantity": 1,
        "unit": "tbsp",
        "category": "spices"
      },
      {
        "name": "Turmeric",
        "quantity": 0.5,
        "unit": "tsp",
        "category": "spices"
      },
      {
        "name": "Salt",
        "quantity": 1,
        "unit": "tsp",
        "category": "pantry"
      },
      {
        "name": "Mustard Oil",
        "quantity": 1,
        "unit": "tbsp",
        "category": "pantry"
      },
      {
        "name": "Rice",
        "quantity": 1,
        "unit": "cup",
        "category": "grains"
      }
    ],
    "tungrymbai": [
      {
        "name": "Pork",
        "quantity": 250,
        "unit": "g",
        "category": "proteins"
      },
      {
        "name": "Fermented Soybeans",
        "quantity": 0.5,
        "unit": "cup",
        "category": "proteins"
      },
      {
        "name": "Onion",
        "quantity": 1,
        "unit": "pc",
        "category": "produce"
      },
      {
        "name": "Garlic",
        "quantity": 3,
        "unit": "pcs",
        "category": "produce"
      },
      {
        "name": "Ginger",
        "quantity": 1,
        "unit": "inch",
        "category": "produce"
      },
      {
        "name": "Green Chilli",
        "quantity": 2,
        "unit": "pcs",
        "category": "produce"
      },
      {
        "name": "Turmeric",
        "quantity": 0.5,
        "unit": "tsp",
        "category": "spices"
      },
      {
        "name": "Salt",
        "quantity": 1,
        "unit": "tsp",
        "category": "pantry"
      },
      {
        "name": "Mustard Oil",
        "quantity": 1,
        "unit": "tbsp",
        "category": "pantry"
      },
      {
        "name": "Rice",
        "quantity": 1,
        "unit": "cup",
        "category": "grains"
      }
    ],
    "pudoh": [
      {
        "name": "Pork",
        "quantity": 250,
        "unit": "g",
        "category": "proteins"
      },
      {
        "name": "Sticky Rice",
        "quantity": 1,
        "unit": "cup",
        "category": "grains"
      },
      {
        "name": "Onion",
        "quantity": 0.5,
        "unit": "pc",
        "category": "produce"
      },
      {
        "name": "Garlic",
        "quantity": 2,
        "unit": "pcs",
        "category": "produce"
      },
      {
        "name": "Ginger",
        "quantity": 1,
        "unit": "inch",
        "category": "produce"
      },
      {
        "name": "Green Chilli",
        "quantity": 1,
        "unit": "pc",
        "category": "produce"
      },
      {
        "name": "Salt",
        "quantity": 1,
        "unit": "tsp",
        "category": "pantry"
      },
      {
        "name": "Mustard Oil",
        "quantity": 1,
        "unit": "tbsp",
        "category": "pantry"
      }
    ],
    "minil-songa": [
      {
        "name": "Sticky Rice",
        "quantity": 1,
        "unit": "cup",
        "category": "grains"
      },
      {
        "name": "Water",
        "quantity": 1.25,
        "unit": "cup",
        "category": "pantry"
      },
      {
        "name": "Salt",
        "quantity": 0.5,
        "unit": "tsp",
        "category": "pantry"
      }
    ],
    "pukhlein": [
      {
        "name": "Rice",
        "quantity": 100,
        "unit": "g",
        "category": "grains",
        "inStock": false
      },
      {
        "name": "Sesame Seeds",
        "quantity": 20,
        "unit": "g",
        "category": "spices",
        "inStock": false
      },
      {
        "name": "Jaggery",
        "quantity": 30,
        "unit": "g",
        "category": "pantry",
        "inStock": false
      },
      {
        "name": "Ghee",
        "quantity": 2,
        "unit": "tbsp",
        "category": "pantry",
        "inStock": false
      },
      {
        "name": "Oil",
        "quantity": 2,
        "unit": "tbsp",
        "category": "pantry",
        "inStock": false
      },
      {
        "name": "Spices",
        "quantity": 1,
        "unit": "packet",
        "category": "spices",
        "inStock": false
      },
      {
        "name": "Sugar",
        "quantity": 0.5,
        "unit": "cup",
        "category": "pantry"
      },
      {
        "name": "Cardamom",
        "quantity": 2,
        "unit": "pods",
        "category": "spices"
      },
      {
        "name": "Raisins",
        "quantity": 2,
        "unit": "tbsp",
        "category": "pantry"
      },
      {
        "name": "Almonds",
        "quantity": 2,
        "unit": "tbsp",
        "category": "pantry"
      },
      {
        "name": "Pistachios",
        "quantity": 1,
        "unit": "tbsp",
        "category": "pantry"
      }
    ],
    "sakin-gata": [
      {
        "name": "Spinach",
        "quantity": 100,
        "unit": "g",
        "category": "produce",
        "inStock": false
      },
      {
        "name": "Onions",
        "quantity": 1,
        "unit": "pc",
        "category": "produce",
        "inStock": false
      },
      {
        "name": "Mustard Oil",
        "quantity": 15,
        "unit": "ml",
        "category": "pantry",
        "inStock": false
      },
      {
        "name": "Ghee",
        "quantity": 2,
        "unit": "tbsp",
        "category": "pantry",
        "inStock": false
      },
      {
        "name": "Oil",
        "quantity": 2,
        "unit": "tbsp",
        "category": "pantry",
        "inStock": false
      },
      {
        "name": "Spices",
        "quantity": 1,
        "unit": "packet",
        "category": "spices",
        "inStock": false
      },
      {
        "name": "Sugar",
        "quantity": 0.5,
        "unit": "cup",
        "category": "pantry"
      },
      {
        "name": "Cardamom",
        "quantity": 2,
        "unit": "pods",
        "category": "spices"
      },
      {
        "name": "Raisins",
        "quantity": 2,
        "unit": "tbsp",
        "category": "pantry"
      },
      {
        "name": "Almonds",
        "quantity": 2,
        "unit": "tbsp",
        "category": "pantry"
      },
      {
        "name": "Pistachios",
        "quantity": 1,
        "unit": "tbsp",
        "category": "pantry"
      }
    ],
    "kyat": [
      {
        "name": "Rice",
        "quantity": 1,
        "unit": "cup",
        "category": "grains"
      },
      {
        "name": "Water",
        "quantity": 2,
        "unit": "cup",
        "category": "pantry"
      },
      {
        "name": "Jaggery",
        "quantity": 0.25,
        "unit": "cup",
        "category": "pantry"
      },
      {
        "name": "Yeast",
        "quantity": 1,
        "unit": "tsp",
        "category": "pantry"
      }
    ],
    "anishi": [
      {
        "name": "Anishi (Fermented Colocasia Leaves)",
        "quantity": 100,
        "unit": "g",
        "category": "produce"
      },
      {
        "name": "Pork",
        "quantity": 200,
        "unit": "g",
        "category": "proteins"
      },
      {
        "name": "Ginger",
        "quantity": 1,
        "unit": "inch",
        "category": "produce"
      },
      {
        "name": "Garlic",
        "quantity": 4,
        "unit": "cloves",
        "category": "produce"
      },
      {
        "name": "Green Chilli",
        "quantity": 2,
        "unit": "pc",
        "category": "produce"
      },
      {
        "name": "Mustard Oil",
        "quantity": 1,
        "unit": "tbsp",
        "category": "pantry"
      },
      {
        "name": "Salt",
        "quantity": 1,
        "unit": "tsp",
        "category": "pantry"
      },
      {
        "name": "Turmeric",
        "quantity": 0.5,
        "unit": "tsp",
        "category": "spices"
      }
    ],
    "boiled-vegetables": [
      {
        "name": "Mixed Vegetables",
        "quantity": 1,
        "unit": "cup",
        "category": "produce",
        "inStock": false
      },
      {
        "name": "Carrots",
        "quantity": 1,
        "unit": "pc",
        "category": "produce",
        "inStock": false
      },
      {
        "name": "Green Beans",
        "quantity": 1,
        "unit": "cup",
        "category": "produce",
        "inStock": false
      },
      {
        "name": "Potatoes",
        "quantity": 1,
        "unit": "pc",
        "category": "produce",
        "inStock": false
      },
      {
        "name": "Cauliflower",
        "quantity": 0.5,
        "unit": "pc",
        "category": "produce",
        "inStock": false
      },
      {
        "name": "Salt",
        "quantity": 1,
        "unit": "tsp",
        "category": "pantry",
        "inStock": false
      },
      {
        "name": "Ghee",
        "quantity": 2,
        "unit": "tbsp",
        "category": "pantry",
        "inStock": false
      },
      {
        "name": "Oil",
        "quantity": 2,
        "unit": "tbsp",
        "category": "pantry",
        "inStock": false
      },
      {
        "name": "Spices",
        "quantity": 1,
        "unit": "packet",
        "category": "spices",
        "inStock": false
      }
    ],
    "koat-pitha": [
      {
        "name": "Fish",
        "quantity": 150,
        "unit": "g",
        "category": "proteins"
      },
      {
        "name": "Rice Flour",
        "quantity": 1,
        "unit": "cup",
        "category": "grains"
      },
      {
        "name": "Banana",
        "quantity": 1,
        "unit": "pc",
        "category": "produce"
      },
      {
        "name": "Onion",
        "quantity": 0.5,
        "unit": "pc",
        "category": "produce"
      },
      {
        "name": "Green Chilli",
        "quantity": 2,
        "unit": "pcs",
        "category": "produce"
      },
      {
        "name": "Turmeric",
        "quantity": 0.5,
        "unit": "tsp",
        "category": "spices"
      },
      {
        "name": "Salt",
        "quantity": 1,
        "unit": "tsp",
        "category": "pantry"
      },
      {
        "name": "Oil",
        "quantity": 2,
        "unit": "tbsp",
        "category": "pantry"
      }
    ],
    "bamboo-shoot-fry": [
      {
        "name": "Bamboo Shoot",
        "quantity": 1,
        "unit": "cup",
        "category": "produce"
      },
      {
        "name": "Garlic",
        "quantity": 4,
        "unit": "cloves",
        "category": "produce"
      },
      {
        "name": "Ginger",
        "quantity": 1,
        "unit": "inch",
        "category": "produce"
      },
      {
        "name": "Green Chilli",
        "quantity": 2,
        "unit": "pc",
        "category": "produce"
      },
      {
        "name": "Turmeric",
        "quantity": 0.5,
        "unit": "tsp",
        "category": "spices"
      },
      {
        "name": "Salt",
        "quantity": 1,
        "unit": "tsp",
        "category": "pantry"
      },
      {
        "name": "Mustard Oil",
        "quantity": 2,
        "unit": "tbsp",
        "category": "pantry"
      }
    ],
    "panch-phoran-tarka": [
      {
        "name": "Mixed Vegetables",
        "quantity": 2,
        "unit": "cup",
        "category": "produce"
      },
      {
        "name": "Panch Phoran",
        "quantity": 1,
        "unit": "tbsp",
        "category": "spices"
      },
      {
        "name": "Ginger",
        "quantity": 1,
        "unit": "inch",
        "category": "produce"
      },
      {
        "name": "Green Chilli",
        "quantity": 2,
        "unit": "pc",
        "category": "produce"
      },
      {
        "name": "Turmeric",
        "quantity": 0.5,
        "unit": "tsp",
        "category": "spices"
      },
      {
        "name": "Mustard Oil",
        "quantity": 1,
        "unit": "tbsp",
        "category": "pantry"
      },
      {
        "name": "Salt",
        "quantity": 1,
        "unit": "tsp",
        "category": "pantry"
      }
    ],
    "chhum-han": [
      {
        "name": "Cabbage",
        "quantity": 1,
        "unit": "cup",
        "category": "produce"
      },
      {
        "name": "Carrot",
        "quantity": 1,
        "unit": "pc",
        "category": "produce"
      },
      {
        "name": "Green Beans",
        "quantity": 0.5,
        "unit": "cup",
        "category": "produce"
      },
      {
        "name": "Cauliflower",
        "quantity": 0.5,
        "unit": "cup",
        "category": "produce"
      },
      {
        "name": "Green Chilli",
        "quantity": 2,
        "unit": "pc",
        "category": "produce"
      },
      {
        "name": "Ginger",
        "quantity": 1,
        "unit": "inch",
        "category": "produce"
      },
      {
        "name": "Garlic",
        "quantity": 2,
        "unit": "cloves",
        "category": "produce"
      },
      {
        "name": "Water",
        "quantity": 2,
        "unit": "cup",
        "category": "pantry"
      },
      {
        "name": "Salt",
        "quantity": 1,
        "unit": "tsp",
        "category": "pantry"
      },
      {
        "name": "Mixed Vegetables",
        "quantity": 1,
        "unit": "cup",
        "category": "produce",
        "inStock": false
      }
    ],
    "misa-mach-poora": [
      {
        "name": "Fish",
        "quantity": 150,
        "unit": "g",
        "category": "proteins",
        "inStock": false
      },
      {
        "name": "Ghee",
        "quantity": 2,
        "unit": "tbsp",
        "category": "pantry",
        "inStock": false
      },
      {
        "name": "Oil",
        "quantity": 2,
        "unit": "tbsp",
        "category": "pantry",
        "inStock": false
      },
      {
        "name": "Spices",
        "quantity": 1,
        "unit": "packet",
        "category": "spices",
        "inStock": false
      },
      {
        "name": "Prawns",
        "quantity": 200,
        "unit": "g",
        "category": "proteins",
        "inStock": false
      },
      {
        "name": "Salt",
        "quantity": 1,
        "unit": "tsp",
        "category": "pantry"
      },
      {
        "name": "Turmeric",
        "quantity": 0.5,
        "unit": "tsp",
        "category": "spices"
      },
      {
        "name": "Mustard Oil",
        "quantity": 1,
        "unit": "tbsp",
        "category": "pantry"
      },
      {
        "name": "Cumin Seeds",
        "quantity": 1,
        "unit": "tsp",
        "category": "spices"
      },
      {
        "name": "Red Chili Powder",
        "quantity": 0.5,
        "unit": "tsp",
        "category": "spices"
      }
    ],
    "zu": [
      {
        "name": "Sticky Rice",
        "quantity": 1,
        "unit": "cup",
        "category": "grains"
      },
      {
        "name": "Jaggery",
        "quantity": 1,
        "unit": "tbsp",
        "category": "pantry"
      },
      {
        "name": "Water",
        "quantity": 2,
        "unit": "cup",
        "category": "pantry"
      }
    ],
    "lubrusca-wine": [
      {
        "name": "Grapes",
        "quantity": 1.5,
        "unit": "kg",
        "category": "produce"
      },
      {
        "name": "Sugar",
        "quantity": 0.5,
        "unit": "cup",
        "category": "pantry"
      },
      {
        "name": "Water",
        "quantity": 3,
        "unit": "cup",
        "category": "pantry"
      },
      {
        "name": "Yeast",
        "quantity": 1,
        "unit": "tsp",
        "category": "pantry"
      }
    ],
    "phagshapa": [
      {
        "name": "Pork Belly",
        "quantity": 250,
        "unit": "g",
        "category": "proteins"
      },
      {
        "name": "Radish",
        "quantity": 1,
        "unit": "pc",
        "category": "produce"
      },
      {
        "name": "Green Chilli",
        "quantity": 3,
        "unit": "pc",
        "category": "produce"
      },
      {
        "name": "Ginger",
        "quantity": 1,
        "unit": "inch",
        "category": "produce"
      },
      {
        "name": "Garlic",
        "quantity": 4,
        "unit": "cloves",
        "category": "produce"
      },
      {
        "name": "Mustard Oil",
        "quantity": 1,
        "unit": "tbsp",
        "category": "pantry"
      },
      {
        "name": "Salt",
        "quantity": 1,
        "unit": "tsp",
        "category": "pantry"
      },
      {
        "name": "Turmeric",
        "quantity": 0.5,
        "unit": "tsp",
        "category": "spices"
      },
      {
        "name": "Rice",
        "quantity": 1,
        "unit": "cup",
        "category": "grains"
      }
    ],
    "sha-phaley": [
      {
        "name": "Beef",
        "quantity": 200,
        "unit": "g",
        "category": "proteins"
      },
      {
        "name": "All-Purpose Flour",
        "quantity": 1.5,
        "unit": "cup",
        "category": "grains"
      },
      {
        "name": "Onion",
        "quantity": 1,
        "unit": "pc",
        "category": "produce"
      },
      {
        "name": "Cabbage",
        "quantity": 0.5,
        "unit": "cup",
        "category": "produce"
      },
      {
        "name": "Garlic",
        "quantity": 4,
        "unit": "cloves",
        "category": "produce"
      },
      {
        "name": "Ginger",
        "quantity": 1,
        "unit": "inch",
        "category": "produce"
      },
      {
        "name": "Green Chilli",
        "quantity": 2,
        "unit": "pc",
        "category": "produce"
      },
      {
        "name": "Salt",
        "quantity": 1,
        "unit": "tsp",
        "category": "pantry"
      },
      {
        "name": "Oil",
        "quantity": 1,
        "unit": "tbsp",
        "category": "pantry"
      }
    ],
    "gundruk": [
      {
        "name": "Gundruk (Fermented Greens)",
        "quantity": 50,
        "unit": "g",
        "category": "pantry"
      },
      {
        "name": "Onion",
        "quantity": 1,
        "unit": "pc",
        "category": "produce"
      },
      {
        "name": "Tomato",
        "quantity": 1,
        "unit": "pc",
        "category": "produce"
      },
      {
        "name": "Ginger",
        "quantity": 1,
        "unit": "inch",
        "category": "produce"
      },
      {
        "name": "Green Chilli",
        "quantity": 1,
        "unit": "pc",
        "category": "produce"
      },
      {
        "name": "Mustard Oil",
        "quantity": 1,
        "unit": "tbsp",
        "category": "pantry"
      },
      {
        "name": "Salt",
        "quantity": 1,
        "unit": "tsp",
        "category": "pantry"
      },
      {
        "name": "Turmeric",
        "quantity": 0.5,
        "unit": "tsp",
        "category": "spices"
      },
      {
        "name": "Water",
        "quantity": 3,
        "unit": "cup",
        "category": "pantry"
      }
    ],
    "dal-bhat": [
      {
        "name": "Mixed Dal",
        "quantity": 80,
        "unit": "g",
        "category": "proteins",
        "inStock": false
      },
      {
        "name": "Ghee",
        "quantity": 2,
        "unit": "tbsp",
        "category": "pantry",
        "inStock": false
      },
      {
        "name": "Oil",
        "quantity": 2,
        "unit": "tbsp",
        "category": "pantry",
        "inStock": false
      },
      {
        "name": "Spices",
        "quantity": 1,
        "unit": "packet",
        "category": "spices",
        "inStock": false
      },
      {
        "name": "Toor Dal",
        "quantity": 1,
        "unit": "cup",
        "category": "grains",
        "inStock": false
      },
      {
        "name": "Onion",
        "quantity": 1,
        "unit": "pc",
        "category": "produce",
        "inStock": false
      },
      {
        "name": "Tomato",
        "quantity": 2,
        "unit": "pc",
        "category": "produce",
        "inStock": false
      },
      {
        "name": "Green Chilli",
        "quantity": 2,
        "unit": "pc",
        "category": "produce",
        "inStock": false
      },
      {
        "name": "Ginger-Garlic Paste",
        "quantity": 1,
        "unit": "tbsp",
        "category": "produce",
        "inStock": false
      },
      {
        "name": "Coriander Leaves",
        "quantity": 0.25,
        "unit": "cup",
        "category": "produce",
        "inStock": false
      },
      {
        "name": "Salt",
        "quantity": 1,
        "unit": "tsp",
        "category": "pantry"
      },
      {
        "name": "Turmeric",
        "quantity": 0.5,
        "unit": "tsp",
        "category": "spices"
      },
      {
        "name": "Mustard Oil",
        "quantity": 1,
        "unit": "tbsp",
        "category": "pantry"
      },
      {
        "name": "Cumin Seeds",
        "quantity": 1,
        "unit": "tsp",
        "category": "spices"
      },
      {
        "name": "Panch Phoron",
        "quantity": 0.5,
        "unit": "tsp",
        "category": "spices"
      }
    ],
    "dhindo": [
      {
        "name": "Millet Flour",
        "quantity": 200,
        "unit": "g",
        "category": "grains"
      },
      {
        "name": "Salt",
        "quantity": 0.5,
        "unit": "tsp",
        "category": "pantry"
      },
      {
        "name": "Water",
        "quantity": 2,
        "unit": "cup",
        "category": "pantry"
      },
      {
        "name": "Toor Dal",
        "quantity": 80,
        "unit": "g",
        "category": "proteins"
      },
      {
        "name": "Turmeric",
        "quantity": 0.5,
        "unit": "tsp",
        "category": "spices"
      },
      {
        "name": "Oil",
        "quantity": 1,
        "unit": "tbsp",
        "category": "pantry"
      }
    ],
    "sel-roti": [
      {
        "name": "Rice Flour",
        "quantity": 1,
        "unit": "cup",
        "category": "grains"
      },
      {
        "name": "Sugar",
        "quantity": 2,
        "unit": "tbsp",
        "category": "pantry"
      },
      {
        "name": "Cardamom",
        "quantity": 0.25,
        "unit": "tsp",
        "category": "spices"
      },
      {
        "name": "Water",
        "quantity": 0.75,
        "unit": "cup",
        "category": "pantry"
      },
      {
        "name": "Oil",
        "quantity": 2,
        "unit": "tbsp",
        "category": "pantry"
      }
    ],
    "chang": [
      {
        "name": "Millet Flour",
        "quantity": 1,
        "unit": "cup",
        "category": "grains"
      },
      {
        "name": "Water",
        "quantity": 2,
        "unit": "cup",
        "category": "pantry"
      },
      {
        "name": "Jaggery",
        "quantity": 0.5,
        "unit": "cup",
        "category": "pantry"
      },
      {
        "name": "Yeast",
        "quantity": 1,
        "unit": "tsp",
        "category": "pantry"
      }
    ],
    "kodo-ko-roti": [
      {
        "name": "Millet Flour",
        "quantity": 1,
        "unit": "cup",
        "category": "grains"
      },
      {
        "name": "Salt",
        "quantity": 0.5,
        "unit": "tsp",
        "category": "pantry"
      },
      {
        "name": "Water",
        "quantity": 0.5,
        "unit": "cup",
        "category": "pantry"
      },
      {
        "name": "Tomato",
        "quantity": 2,
        "unit": "pcs",
        "category": "produce"
      },
      {
        "name": "Green Chili",
        "quantity": 1,
        "unit": "pc",
        "category": "produce"
      },
      {
        "name": "Garlic",
        "quantity": 3,
        "unit": "pcs",
        "category": "produce"
      },
      {
        "name": "Oil",
        "quantity": 1,
        "unit": "tsp",
        "category": "pantry"
      },
      {
        "name": "Salt",
        "quantity": 0.25,
        "unit": "tsp",
        "category": "pantry"
      }
    ],
    "masauyra-curry": [
      {
        "name": "Curry Leaves",
        "quantity": 1,
        "unit": "sprig",
        "category": "produce",
        "inStock": false
      },
      {
        "name": "Ghee",
        "quantity": 2,
        "unit": "tbsp",
        "category": "pantry",
        "inStock": false
      },
      {
        "name": "Oil",
        "quantity": 2,
        "unit": "tbsp",
        "category": "pantry",
        "inStock": false
      },
      {
        "name": "Spices",
        "quantity": 1,
        "unit": "packet",
        "category": "spices",
        "inStock": false
      },
      {
        "name": "Rice",
        "quantity": 1,
        "unit": "cup",
        "category": "grains",
        "inStock": false
      },
      {
        "name": "Onion",
        "quantity": 1,
        "unit": "pc",
        "category": "produce",
        "inStock": false
      },
      {
        "name": "Tomato",
        "quantity": 2,
        "unit": "pc",
        "category": "produce",
        "inStock": false
      },
      {
        "name": "Green Chilli",
        "quantity": 2,
        "unit": "pc",
        "category": "produce",
        "inStock": false
      },
      {
        "name": "Ginger-Garlic Paste",
        "quantity": 1,
        "unit": "tbsp",
        "category": "produce",
        "inStock": false
      },
      {
        "name": "Coriander Leaves",
        "quantity": 0.25,
        "unit": "cup",
        "category": "produce",
        "inStock": false
      },
      {
        "name": "Salt",
        "quantity": 1,
        "unit": "tsp",
        "category": "pantry"
      },
      {
        "name": "Turmeric",
        "quantity": 0.5,
        "unit": "tsp",
        "category": "spices"
      },
      {
        "name": "Mustard Oil",
        "quantity": 1,
        "unit": "tbsp",
        "category": "pantry"
      },
      {
        "name": "Cumin Seeds",
        "quantity": 1,
        "unit": "tsp",
        "category": "spices"
      },
      {
        "name": "Red Chili Powder",
        "quantity": 0.5,
        "unit": "tsp",
        "category": "spices"
      }
    ],
    "pork-jarpaa-jurpie": [
      {
        "name": "Pork",
        "quantity": 200,
        "unit": "g",
        "category": "proteins",
        "inStock": false
      },
      {
        "name": "Ginger",
        "quantity": 20,
        "unit": "g",
        "category": "produce",
        "inStock": false
      },
      {
        "name": "Garlic",
        "quantity": 10,
        "unit": "g",
        "category": "produce",
        "inStock": false
      },
      {
        "name": "Ghee",
        "quantity": 2,
        "unit": "tbsp",
        "category": "pantry",
        "inStock": false
      },
      {
        "name": "Oil",
        "quantity": 2,
        "unit": "tbsp",
        "category": "pantry",
        "inStock": false
      },
      {
        "name": "Spices",
        "quantity": 1,
        "unit": "packet",
        "category": "spices",
        "inStock": false
      }
    ],
    "galho": [
      {
        "name": "Rice",
        "quantity": 1,
        "unit": "cup",
        "category": "grains"
      },
      {
        "name": "Moong Dal",
        "quantity": 0.25,
        "unit": "cup",
        "category": "proteins"
      },
      {
        "name": "Mixed Vegetables",
        "quantity": 0.5,
        "unit": "cup",
        "category": "produce"
      },
      {
        "name": "Onion",
        "quantity": 0.5,
        "unit": "pc",
        "category": "produce"
      },
      {
        "name": "Ginger",
        "quantity": 0.5,
        "unit": "inch",
        "category": "produce"
      },
      {
        "name": "Green Chilli",
        "quantity": 1,
        "unit": "pc",
        "category": "produce"
      },
      {
        "name": "Turmeric",
        "quantity": 0.5,
        "unit": "tsp",
        "category": "spices"
      },
      {
        "name": "Salt",
        "quantity": 1,
        "unit": "tsp",
        "category": "pantry"
      },
      {
        "name": "Mustard Oil",
        "quantity": 1,
        "unit": "tbsp",
        "category": "pantry"
      },
      {
        "name": "Water",
        "quantity": 3,
        "unit": "cup",
        "category": "pantry"
      }
    ],
    "sweet-corn-veg-soup": [
      {
        "name": "Sweet Corn",
        "quantity": 1,
        "unit": "cup",
        "category": "produce"
      },
      {
        "name": "Carrot",
        "quantity": 1,
        "unit": "pc",
        "category": "produce"
      },
      {
        "name": "Cabbage",
        "quantity": 0.25,
        "unit": "pc",
        "category": "produce"
      },
      {
        "name": "Cornflour",
        "quantity": 2,
        "unit": "tbsp",
        "category": "pantry"
      },
      {
        "name": "Soy Sauce",
        "quantity": 1,
        "unit": "tsp",
        "category": "pantry"
      },
      {
        "name": "Pepper",
        "quantity": 0.5,
        "unit": "tsp",
        "category": "pantry"
      },
      {
        "name": "Mixed Vegetables",
        "quantity": 1,
        "unit": "cup",
        "category": "produce",
        "inStock": false
      }
    ],
    "sweet-corn-chicken-soup": [
      {
        "name": "Sweet Corn",
        "quantity": 0.5,
        "unit": "cup",
        "category": "produce"
      },
      {
        "name": "Chicken",
        "quantity": 150,
        "unit": "g",
        "category": "proteins"
      },
      {
        "name": "Garlic",
        "quantity": 2,
        "unit": "cloves",
        "category": "produce"
      },
      {
        "name": "Ginger",
        "quantity": 0.5,
        "unit": "inch",
        "category": "produce"
      },
      {
        "name": "Spring Onion",
        "quantity": 1,
        "unit": "pc",
        "category": "produce"
      },
      {
        "name": "Cornflour",
        "quantity": 2,
        "unit": "tbsp",
        "category": "pantry"
      },
      {
        "name": "Soy Sauce",
        "quantity": 1,
        "unit": "tbsp",
        "category": "pantry"
      },
      {
        "name": "Pepper",
        "quantity": 0.5,
        "unit": "tsp",
        "category": "spices"
      },
      {
        "name": "Salt",
        "quantity": 1,
        "unit": "tsp",
        "category": "pantry"
      },
      {
        "name": "Water",
        "quantity": 3,
        "unit": "cup",
        "category": "pantry"
      }
    ],
    "manchow-soup": [
      {
        "name": "Cabbage",
        "quantity": 0.5,
        "unit": "cup",
        "category": "produce"
      },
      {
        "name": "Carrot",
        "quantity": 0.5,
        "unit": "cup",
        "category": "produce"
      },
      {
        "name": "Green Beans",
        "quantity": 0.25,
        "unit": "cup",
        "category": "produce"
      },
      {
        "name": "Spring Onion",
        "quantity": 2,
        "unit": "pc",
        "category": "produce"
      },
      {
        "name": "Garlic",
        "quantity": 4,
        "unit": "cloves",
        "category": "produce"
      },
      {
        "name": "Ginger",
        "quantity": 1,
        "unit": "inch",
        "category": "produce"
      },
      {
        "name": "Green Chilli",
        "quantity": 2,
        "unit": "pc",
        "category": "produce"
      },
      {
        "name": "Soy Sauce",
        "quantity": 1,
        "unit": "tbsp",
        "category": "pantry"
      },
      {
        "name": "Cornflour",
        "quantity": 1.5,
        "unit": "tbsp",
        "category": "pantry"
      },
      {
        "name": "Black Pepper",
        "quantity": 0.5,
        "unit": "tsp",
        "category": "spices"
      },
      {
        "name": "Water",
        "quantity": 3,
        "unit": "cup",
        "category": "pantry"
      },
      {
        "name": "Salt",
        "quantity": 1,
        "unit": "tsp",
        "category": "pantry"
      },
      {
        "name": "Oil",
        "quantity": 1,
        "unit": "tbsp",
        "category": "pantry"
      }
    ],
    "palak-soup": [
      {
        "name": "Spinach",
        "quantity": 200,
        "unit": "g",
        "category": "produce"
      },
      {
        "name": "Onion",
        "quantity": 1,
        "unit": "pc",
        "category": "produce"
      },
      {
        "name": "Garlic",
        "quantity": 2,
        "unit": "cloves",
        "category": "produce"
      },
      {
        "name": "Ginger",
        "quantity": 0.5,
        "unit": "inch",
        "category": "produce"
      },
      {
        "name": "Water",
        "quantity": 3,
        "unit": "cup",
        "category": "pantry"
      },
      {
        "name": "Black Pepper",
        "quantity": 0.5,
        "unit": "tsp",
        "category": "spices"
      },
      {
        "name": "Salt",
        "quantity": 1,
        "unit": "tsp",
        "category": "pantry"
      },
      {
        "name": "Olive Oil",
        "quantity": 1,
        "unit": "tbsp",
        "category": "pantry"
      },
      {
        "name": "Lemon Juice",
        "quantity": 1,
        "unit": "tbsp",
        "category": "pantry"
      }
    ],
    "tamatar-ka-shorba": [
      {
        "name": "Tomato",
        "quantity": 5,
        "unit": "pc",
        "category": "produce"
      },
      {
        "name": "Onion",
        "quantity": 1,
        "unit": "pc",
        "category": "produce"
      },
      {
        "name": "Garlic",
        "quantity": 4,
        "unit": "cloves",
        "category": "produce"
      },
      {
        "name": "Ginger",
        "quantity": 1,
        "unit": "inch",
        "category": "produce"
      },
      {
        "name": "Cumin Seeds",
        "quantity": 1,
        "unit": "tsp",
        "category": "spices"
      },
      {
        "name": "Black Pepper",
        "quantity": 0.5,
        "unit": "tsp",
        "category": "spices"
      },
      {
        "name": "Bay Leaf",
        "quantity": 1,
        "unit": "pc",
        "category": "spices"
      },
      {
        "name": "Coriander Leaves",
        "quantity": 0.25,
        "unit": "cup",
        "category": "produce"
      },
      {
        "name": "Water",
        "quantity": 3,
        "unit": "cup",
        "category": "pantry"
      },
      {
        "name": "Salt",
        "quantity": 1,
        "unit": "tsp",
        "category": "pantry"
      },
      {
        "name": "Oil",
        "quantity": 1,
        "unit": "tbsp",
        "category": "pantry"
      },
      {
        "name": "Tomato Puree",
        "quantity": 0.5,
        "unit": "cup",
        "category": "pantry"
      }
    ],
    "dal-panchmel-shorba": [
      {
        "name": "Yellow Moong Dal",
        "quantity": 0.25,
        "unit": "cup",
        "category": "proteins"
      },
      {
        "name": "Urad Dal",
        "quantity": 0.25,
        "unit": "cup",
        "category": "proteins"
      },
      {
        "name": "Chana Dal",
        "quantity": 0.25,
        "unit": "cup",
        "category": "proteins"
      },
      {
        "name": "Green Moong Dal",
        "quantity": 0.25,
        "unit": "cup",
        "category": "proteins"
      },
      {
        "name": "Toor Dal",
        "quantity": 0.25,
        "unit": "cup",
        "category": "proteins"
      },
      {
        "name": "Water",
        "quantity": 6,
        "unit": "cups",
        "category": "pantry"
      },
      {
        "name": "Cumin Seeds",
        "quantity": 1,
        "unit": "tsp",
        "category": "spices"
      },
      {
        "name": "Asafoetida",
        "quantity": 0.5,
        "unit": "tsp",
        "category": "spices"
      },
      {
        "name": "Ginger",
        "quantity": 1,
        "unit": "inch",
        "category": "produce"
      },
      {
        "name": "Green Chillies",
        "quantity": 2,
        "unit": "pcs",
        "category": "produce"
      },
      {
        "name": "Tomato",
        "quantity": 3,
        "unit": "pcs",
        "category": "produce"
      },
      {
        "name": "Oil",
        "quantity": 1,
        "unit": "tbsp",
        "category": "pantry"
      },
      {
        "name": "Coriander Leaves",
        "quantity": 0.25,
        "unit": "cup",
        "category": "produce"
      },
      {
        "name": "Lemon",
        "quantity": 1,
        "unit": "pc",
        "category": "produce"
      },
      {
        "name": "Mixed Dal",
        "quantity": 80,
        "unit": "g",
        "category": "proteins",
        "inStock": false
      }
    ],
    "bajre-ka-raab": [
      {
        "name": "Bajra Flour",
        "quantity": 4,
        "unit": "tbsp",
        "category": "grains"
      },
      {
        "name": "Ghee",
        "quantity": 2,
        "unit": "tsp",
        "category": "dairy"
      },
      {
        "name": "Jaggery",
        "quantity": 2,
        "unit": "tbsp",
        "category": "pantry"
      },
      {
        "name": "Water",
        "quantity": 2,
        "unit": "cups",
        "category": "pantry"
      },
      {
        "name": "Ajwain",
        "quantity": 0.25,
        "unit": "tsp",
        "category": "spices"
      },
      {
        "name": "Dry Ginger Powder",
        "quantity": 0.5,
        "unit": "tsp",
        "category": "spices"
      },
      {
        "name": "Almonds",
        "quantity": 2,
        "unit": "tbsp",
        "category": "pantry"
      },
      {
        "name": "Cardamom Powder",
        "quantity": 0.25,
        "unit": "tsp",
        "category": "spices"
      }
    ],
    "gahat-ka-shorba": [
      {
        "name": "Horsegram",
        "quantity": 0.5,
        "unit": "cup",
        "category": "proteins"
      },
      {
        "name": "Ginger",
        "quantity": 1,
        "unit": "inch",
        "category": "produce"
      },
      {
        "name": "Garlic",
        "quantity": 4,
        "unit": "cloves",
        "category": "produce"
      },
      {
        "name": "Green Chilli",
        "quantity": 1,
        "unit": "pc",
        "category": "produce"
      },
      {
        "name": "Cumin Seeds",
        "quantity": 1,
        "unit": "tsp",
        "category": "spices"
      },
      {
        "name": "Turmeric",
        "quantity": 0.25,
        "unit": "tsp",
        "category": "spices"
      },
      {
        "name": "Black Pepper",
        "quantity": 0.5,
        "unit": "tsp",
        "category": "spices"
      },
      {
        "name": "Coriander Leaves",
        "quantity": 0.25,
        "unit": "cup",
        "category": "produce"
      },
      {
        "name": "Water",
        "quantity": 4,
        "unit": "cup",
        "category": "pantry"
      },
      {
        "name": "Salt",
        "quantity": 1,
        "unit": "tsp",
        "category": "pantry"
      },
      {
        "name": "Oil",
        "quantity": 1,
        "unit": "tbsp",
        "category": "pantry"
      }
    ],
    "palak-ka-shorba": [
      {
        "name": "Spinach",
        "quantity": 250,
        "unit": "g",
        "category": "produce"
      },
      {
        "name": "Garlic",
        "quantity": 3,
        "unit": "cloves",
        "category": "produce"
      },
      {
        "name": "Ginger",
        "quantity": 1,
        "unit": "inch",
        "category": "produce"
      },
      {
        "name": "Cumin Seeds",
        "quantity": 1,
        "unit": "tsp",
        "category": "spices"
      },
      {
        "name": "Black Pepper",
        "quantity": 0.5,
        "unit": "tsp",
        "category": "spices"
      },
      {
        "name": "Lemon Juice",
        "quantity": 1,
        "unit": "tbsp",
        "category": "pantry"
      },
      {
        "name": "Water",
        "quantity": 4,
        "unit": "cup",
        "category": "pantry"
      },
      {
        "name": "Salt",
        "quantity": 1,
        "unit": "tsp",
        "category": "pantry"
      },
      {
        "name": "Coriander Leaves",
        "quantity": 0.25,
        "unit": "cup",
        "category": "produce"
      }
    ],
    "badam-shorba": [
      {
        "name": "Almonds",
        "quantity": 0.25,
        "unit": "cup",
        "category": "pantry"
      },
      {
        "name": "Garlic",
        "quantity": 3,
        "unit": "cloves",
        "category": "produce"
      },
      {
        "name": "Ginger",
        "quantity": 1,
        "unit": "inch",
        "category": "produce"
      },
      {
        "name": "Cumin Seeds",
        "quantity": 1,
        "unit": "tsp",
        "category": "spices"
      },
      {
        "name": "Black Pepper",
        "quantity": 0.5,
        "unit": "tsp",
        "category": "spices"
      },
      {
        "name": "Bay Leaf",
        "quantity": 1,
        "unit": "pc",
        "category": "spices"
      },
      {
        "name": "Almond Milk",
        "quantity": 1,
        "unit": "cup",
        "category": "pantry"
      },
      {
        "name": "Water",
        "quantity": 2,
        "unit": "cup",
        "category": "pantry"
      },
      {
        "name": "Salt",
        "quantity": 1,
        "unit": "tsp",
        "category": "pantry"
      },
      {
        "name": "Coriander Leaves",
        "quantity": 0.25,
        "unit": "cup",
        "category": "produce"
      }
    ],
    "anda-curry-north": [
      {
        "name": "Egg",
        "quantity": 4,
        "unit": "pcs",
        "category": "proteins"
      },
      {
        "name": "Onion",
        "quantity": 1,
        "unit": "pcs",
        "category": "produce"
      },
      {
        "name": "Tomato",
        "quantity": 2,
        "unit": "pcs",
        "category": "produce"
      },
      {
        "name": "Curry Leaves",
        "quantity": 1,
        "unit": "sprig",
        "category": "produce",
        "inStock": false
      }
    ],
    "keema-paratha": [
      {
        "name": "Minced Mutton",
        "quantity": 250,
        "unit": "g",
        "category": "proteins"
      },
      {
        "name": "Wheat Flour",
        "quantity": 1,
        "unit": "cup",
        "category": "grains"
      },
      {
        "name": "Onion",
        "quantity": 1,
        "unit": "pcs",
        "category": "produce"
      }
    ],
    "anda-sandwich-kolkata": [
      {
        "name": "Egg",
        "quantity": 2,
        "unit": "pcs",
        "category": "proteins"
      },
      {
        "name": "Bread",
        "quantity": 2,
        "unit": "slices",
        "category": "breads"
      },
      {
        "name": "Onion",
        "quantity": 0.5,
        "unit": "pcs",
        "category": "produce"
      }
    ],
    "kolkata-chicken-roll": [
      {
        "name": "Chicken",
        "quantity": 200,
        "unit": "g",
        "category": "proteins"
      },
      {
        "name": "Paratha",
        "quantity": 1,
        "unit": "pcs",
        "category": "breads"
      },
      {
        "name": "Onion",
        "quantity": 0.5,
        "unit": "pcs",
        "category": "produce"
      }
    ],
    "naga-egg-roast": [
      {
        "name": "Egg",
        "quantity": 3,
        "unit": "pcs",
        "category": "proteins"
      },
      {
        "name": "Onion",
        "quantity": 1,
        "unit": "pcs",
        "category": "produce"
      },
      {
        "name": "Garlic",
        "quantity": 4,
        "unit": "pcs",
        "category": "produce"
      }
    ],
    "dimer-devil": [
      {
        "name": "Egg",
        "quantity": 1,
        "unit": "pcs",
        "category": "proteins"
      },
      {
        "name": "Potato",
        "quantity": 1,
        "unit": "pcs",
        "category": "produce"
      },
      {
        "name": "Breadcrumbs",
        "quantity": 0.5,
        "unit": "cup",
        "category": "pantry"
      }
    ],
    "thukpa-chicken": [
      {
        "name": "Chicken",
        "quantity": 150,
        "unit": "g",
        "category": "proteins"
      },
      {
        "name": "Noodles",
        "quantity": 1,
        "unit": "cup",
        "category": "grains"
      },
      {
        "name": "Carrot",
        "quantity": 0.5,
        "unit": "pcs",
        "category": "produce"
      }
    ],
    "egg-masala-indore": [
      {
        "name": "Egg",
        "quantity": 3,
        "unit": "pcs",
        "category": "proteins"
      },
      {
        "name": "Onion",
        "quantity": 1,
        "unit": "pcs",
        "category": "produce"
      },
      {
        "name": "Tomato",
        "quantity": 1,
        "unit": "pcs",
        "category": "produce"
      }
    ],
    "egg-bhurji-pav-bhopal": [
      {
        "name": "Egg",
        "quantity": 2,
        "unit": "pcs",
        "category": "proteins"
      },
      {
        "name": "Onion",
        "quantity": 0.5,
        "unit": "pcs",
        "category": "produce"
      },
      {
        "name": "Pav",
        "quantity": 2,
        "unit": "pcs",
        "category": "breads"
      }
    ],
    "chicken-poha-nagpur": [
      {
        "name": "Poha",
        "quantity": 1,
        "unit": "cup",
        "category": "grains"
      },
      {
        "name": "Chicken",
        "quantity": 100,
        "unit": "g",
        "category": "proteins"
      },
      {
        "name": "Onion",
        "quantity": 0.5,
        "unit": "pcs",
        "category": "produce"
      }
    ],
    "bread-pakora": [
      {
        "name": "Bread",
        "quantity": 2,
        "unit": "slices",
        "category": "breads"
      },
      {
        "name": "Potato",
        "quantity": 1,
        "unit": "pcs",
        "category": "produce"
      },
      {
        "name": "Besan",
        "quantity": 0.5,
        "unit": "cup",
        "category": "pantry"
      }
    ],
    "pyaaz-kachori": [
      {
        "name": "Maida",
        "quantity": 1,
        "unit": "cup",
        "category": "grains"
      },
      {
        "name": "Onion",
        "quantity": 1,
        "unit": "pcs",
        "category": "produce"
      },
      {
        "name": "Oil",
        "quantity": 2,
        "unit": "tbsp",
        "category": "pantry"
      },
      {
        "name": "Ajwain",
        "quantity": 0.5,
        "unit": "tsp",
        "category": "spices"
      },
      {
        "name": "Coriander Seeds",
        "quantity": 0.5,
        "unit": "tsp",
        "category": "spices"
      },
      {
        "name": "Red Chilli Powder",
        "quantity": 0.5,
        "unit": "tsp",
        "category": "spices"
      },
      {
        "name": "Salt",
        "quantity": 0.5,
        "unit": "tsp",
        "category": "pantry"
      }
    ],
    "bread-omelette": [
      {
        "name": "Bread",
        "quantity": 2,
        "unit": "slices",
        "category": "breads"
      },
      {
        "name": "Egg",
        "quantity": 2,
        "unit": "pcs",
        "category": "proteins"
      },
      {
        "name": "Onion",
        "quantity": 0.5,
        "unit": "pcs",
        "category": "produce"
      }
    ],
    "anda-bhurji": [
      {
        "name": "Egg",
        "quantity": 3,
        "unit": "pcs",
        "category": "proteins"
      },
      {
        "name": "Onion",
        "quantity": 1,
        "unit": "pcs",
        "category": "produce"
      },
      {
        "name": "Tomato",
        "quantity": 1,
        "unit": "pcs",
        "category": "produce"
      }
    ],
    "masala-omelette": [
      {
        "name": "Egg",
        "quantity": 2,
        "unit": "pcs",
        "category": "proteins"
      },
      {
        "name": "Onion",
        "quantity": 0.5,
        "unit": "pcs",
        "category": "produce"
      },
      {
        "name": "Coriander Leaves",
        "quantity": 0.25,
        "unit": "cup",
        "category": "produce"
      }
    ],
    "anda-paratha": [
      {
        "name": "Egg",
        "quantity": 2,
        "unit": "pcs",
        "category": "proteins"
      },
      {
        "name": "Wheat Flour",
        "quantity": 1,
        "unit": "cup",
        "category": "grains"
      },
      {
        "name": "Onion",
        "quantity": 0.5,
        "unit": "pcs",
        "category": "produce"
      }
    ],
    "yakhni": [
      {
        "name": "Mutton",
        "quantity": 200,
        "unit": "g",
        "category": "proteins"
      },
      {
        "name": "Onion",
        "quantity": 1,
        "unit": "pc",
        "category": "produce"
      },
      {
        "name": "Ginger",
        "quantity": 1,
        "unit": "inch",
        "category": "produce"
      },
      {
        "name": "Cardamom",
        "quantity": 3,
        "unit": "pods",
        "category": "spices"
      },
      {
        "name": "Cinnamon",
        "quantity": 1,
        "unit": "stick",
        "category": "spices"
      },
      {
        "name": "Saffron",
        "quantity": 2,
        "unit": "strands",
        "category": "spices"
      },
      {
        "name": "Salt",
        "quantity": 1,
        "unit": "tsp",
        "category": "pantry"
      }
    ],
    "paya-shorba": [
      {
        "name": "Mutton Trotters (Paya)",
        "quantity": 200,
        "unit": "g",
        "category": "proteins"
      },
      {
        "name": "Onion",
        "quantity": 1,
        "unit": "pc",
        "category": "produce"
      },
      {
        "name": "Ginger",
        "quantity": 1,
        "unit": "inch",
        "category": "produce"
      },
      {
        "name": "Garlic",
        "quantity": 4,
        "unit": "cloves",
        "category": "produce"
      },
      {
        "name": "Bay Leaf",
        "quantity": 1,
        "unit": "pc",
        "category": "spices"
      },
      {
        "name": "Cardamom",
        "quantity": 2,
        "unit": "pods",
        "category": "spices"
      },
      {
        "name": "Cinnamon",
        "quantity": 1,
        "unit": "stick",
        "category": "spices"
      },
      {
        "name": "Black Pepper",
        "quantity": 0.5,
        "unit": "tsp",
        "category": "spices"
      },
      {
        "name": "Water",
        "quantity": 4,
        "unit": "cup",
        "category": "pantry"
      },
      {
        "name": "Salt",
        "quantity": 1,
        "unit": "tsp",
        "category": "pantry"
      },
      {
        "name": "Coriander Leaves",
        "quantity": 0.25,
        "unit": "cup",
        "category": "produce"
      }
    ],
    "rasam": [
      {
        "name": "Toor Dal",
        "quantity": 0.25,
        "unit": "cup",
        "category": "proteins"
      },
      {
        "name": "Tomato",
        "quantity": 2,
        "unit": "pc",
        "category": "produce"
      },
      {
        "name": "Garlic",
        "quantity": 4,
        "unit": "cloves",
        "category": "produce"
      },
      {
        "name": "Rasam Powder",
        "quantity": 1,
        "unit": "tbsp",
        "category": "spices"
      },
      {
        "name": "Black Pepper",
        "quantity": 0.5,
        "unit": "tsp",
        "category": "spices"
      },
      {
        "name": "Tamarind",
        "quantity": 1,
        "unit": "tbsp",
        "category": "pantry"
      },
      {
        "name": "Curry Leaves",
        "quantity": 1,
        "unit": "sprig",
        "category": "produce"
      },
      {
        "name": "Mustard Seeds",
        "quantity": 0.5,
        "unit": "tsp",
        "category": "spices"
      },
      {
        "name": "Salt",
        "quantity": 1,
        "unit": "tsp",
        "category": "pantry"
      },
      {
        "name": "Water",
        "quantity": 3,
        "unit": "cup",
        "category": "pantry"
      },
      {
        "name": "Oil",
        "quantity": 1,
        "unit": "tbsp",
        "category": "pantry"
      }
    ],
    "pappu-charu": [
      {
        "name": "Toor Dal",
        "quantity": 0.5,
        "unit": "cup",
        "category": "proteins"
      },
      {
        "name": "Tomato",
        "quantity": 2,
        "unit": "pc",
        "category": "produce"
      },
      {
        "name": "Tamarind",
        "quantity": 1,
        "unit": "tbsp",
        "category": "pantry"
      },
      {
        "name": "Green Chilli",
        "quantity": 2,
        "unit": "pc",
        "category": "produce"
      },
      {
        "name": "Garlic",
        "quantity": 2,
        "unit": "cloves",
        "category": "produce"
      },
      {
        "name": "Turmeric",
        "quantity": 0.25,
        "unit": "tsp",
        "category": "spices"
      },
      {
        "name": "Mustard Seeds",
        "quantity": 0.5,
        "unit": "tsp",
        "category": "spices"
      },
      {
        "name": "Cumin Seeds",
        "quantity": 0.5,
        "unit": "tsp",
        "category": "spices"
      },
      {
        "name": "Curry Leaves",
        "quantity": 1,
        "unit": "sprig",
        "category": "produce"
      },
      {
        "name": "Water",
        "quantity": 3,
        "unit": "cup",
        "category": "pantry"
      },
      {
        "name": "Salt",
        "quantity": 1,
        "unit": "tsp",
        "category": "pantry"
      },
      {
        "name": "Oil",
        "quantity": 1,
        "unit": "tbsp",
        "category": "pantry"
      }
    ],
    "pachi-palusu": [
      {
        "name": "Coconut Milk",
        "quantity": 1,
        "unit": "cup",
        "category": "pantry"
      },
      {
        "name": "Water",
        "quantity": 1,
        "unit": "cup",
        "category": "pantry"
      },
      {
        "name": "Ginger",
        "quantity": 1,
        "unit": "inch",
        "category": "produce"
      },
      {
        "name": "Green Chilli",
        "quantity": 2,
        "unit": "pc",
        "category": "produce"
      },
      {
        "name": "Coriander Leaves",
        "quantity": 0.25,
        "unit": "cup",
        "category": "produce"
      },
      {
        "name": "Curry Leaves",
        "quantity": 1,
        "unit": "sprig",
        "category": "produce"
      },
      {
        "name": "Mustard Seeds",
        "quantity": 0.5,
        "unit": "tsp",
        "category": "spices"
      },
      {
        "name": "Cumin Seeds",
        "quantity": 0.5,
        "unit": "tsp",
        "category": "spices"
      },
      {
        "name": "Salt",
        "quantity": 1,
        "unit": "tsp",
        "category": "pantry"
      }
    ],
    "mulligatawny": [
      {
        "name": "Masoor Dal",
        "quantity": 100,
        "unit": "g",
        "category": "proteins"
      },
      {
        "name": "Onion",
        "quantity": 1,
        "unit": "pc",
        "category": "produce"
      },
      {
        "name": "Tomato",
        "quantity": 2,
        "unit": "pc",
        "category": "produce"
      },
      {
        "name": "Garlic",
        "quantity": 3,
        "unit": "cloves",
        "category": "produce"
      },
      {
        "name": "Ginger",
        "quantity": 1,
        "unit": "inch",
        "category": "produce"
      },
      {
        "name": "Curry Powder",
        "quantity": 1,
        "unit": "tbsp",
        "category": "spices"
      },
      {
        "name": "Turmeric",
        "quantity": 0.25,
        "unit": "tsp",
        "category": "spices"
      },
      {
        "name": "Black Pepper",
        "quantity": 0.5,
        "unit": "tsp",
        "category": "spices"
      },
      {
        "name": "Coconut Milk",
        "quantity": 0.5,
        "unit": "cup",
        "category": "pantry"
      },
      {
        "name": "Water",
        "quantity": 3,
        "unit": "cup",
        "category": "pantry"
      },
      {
        "name": "Salt",
        "quantity": 1,
        "unit": "tsp",
        "category": "pantry"
      },
      {
        "name": "Oil",
        "quantity": 1,
        "unit": "tbsp",
        "category": "pantry"
      }
    ],
    "coconut-veg-stew": [
      {
        "name": "Mixed Vegetables",
        "quantity": 1.5,
        "unit": "cup",
        "category": "produce"
      },
      {
        "name": "Coconut Milk",
        "quantity": 1.5,
        "unit": "cup",
        "category": "pantry"
      },
      {
        "name": "Onion",
        "quantity": 1,
        "unit": "pc",
        "category": "produce"
      },
      {
        "name": "Ginger",
        "quantity": 0.5,
        "unit": "inch",
        "category": "produce"
      },
      {
        "name": "Green Chilli",
        "quantity": 1,
        "unit": "pc",
        "category": "produce"
      },
      {
        "name": "Curry Leaves",
        "quantity": 1,
        "unit": "sprig",
        "category": "produce"
      },
      {
        "name": "Turmeric",
        "quantity": 0.5,
        "unit": "tsp",
        "category": "spices"
      },
      {
        "name": "Salt",
        "quantity": 1,
        "unit": "tsp",
        "category": "pantry"
      },
      {
        "name": "Water",
        "quantity": 1,
        "unit": "cup",
        "category": "pantry"
      },
      {
        "name": "Coconut Oil",
        "quantity": 1,
        "unit": "tbsp",
        "category": "pantry"
      }
    ],
    "nandu-rasam": [
      {
        "name": "Crab",
        "quantity": 250,
        "unit": "g",
        "category": "proteins"
      },
      {
        "name": "Tomato",
        "quantity": 2,
        "unit": "pcs",
        "category": "produce"
      },
      {
        "name": "Garlic",
        "quantity": 4,
        "unit": "pcs",
        "category": "produce"
      },
      {
        "name": "Rasam Powder",
        "quantity": 1,
        "unit": "tbsp",
        "category": "spices"
      },
      {
        "name": "Black Pepper",
        "quantity": 0.5,
        "unit": "tsp",
        "category": "spices"
      },
      {
        "name": "Tamarind",
        "quantity": 1,
        "unit": "tbsp",
        "category": "pantry"
      },
      {
        "name": "Curry Leaves",
        "quantity": 1,
        "unit": "sprig",
        "category": "produce"
      },
      {
        "name": "Mustard Seeds",
        "quantity": 0.5,
        "unit": "tsp",
        "category": "spices"
      },
      {
        "name": "Salt",
        "quantity": 1,
        "unit": "tsp",
        "category": "pantry"
      },
      {
        "name": "Oil",
        "quantity": 1,
        "unit": "tbsp",
        "category": "pantry"
      }
    ],
    "naatu-kozhi-rasam": [
      {
        "name": "Chicken",
        "quantity": 200,
        "unit": "g",
        "category": "proteins"
      },
      {
        "name": "Tomato",
        "quantity": 2,
        "unit": "pc",
        "category": "produce"
      },
      {
        "name": "Garlic",
        "quantity": 3,
        "unit": "cloves",
        "category": "produce"
      },
      {
        "name": "Rasam Powder",
        "quantity": 1,
        "unit": "tbsp",
        "category": "spices"
      },
      {
        "name": "Black Pepper",
        "quantity": 0.5,
        "unit": "tsp",
        "category": "spices"
      },
      {
        "name": "Tamarind",
        "quantity": 1,
        "unit": "tbsp",
        "category": "pantry"
      },
      {
        "name": "Curry Leaves",
        "quantity": 1,
        "unit": "sprig",
        "category": "produce"
      },
      {
        "name": "Mustard Seeds",
        "quantity": 0.5,
        "unit": "tsp",
        "category": "spices"
      },
      {
        "name": "Salt",
        "quantity": 1,
        "unit": "tsp",
        "category": "pantry"
      },
      {
        "name": "Water",
        "quantity": 3,
        "unit": "cup",
        "category": "pantry"
      },
      {
        "name": "Oil",
        "quantity": 1,
        "unit": "tbsp",
        "category": "pantry"
      }
    ],
    "ulava-charu": [
      {
        "name": "Horsegram",
        "quantity": 0.5,
        "unit": "cup",
        "category": "proteins"
      },
      {
        "name": "Tomato",
        "quantity": 2,
        "unit": "pc",
        "category": "produce"
      },
      {
        "name": "Garlic",
        "quantity": 4,
        "unit": "cloves",
        "category": "produce"
      },
      {
        "name": "Tamarind",
        "quantity": 1,
        "unit": "tbsp",
        "category": "pantry"
      },
      {
        "name": "Red Chilli",
        "quantity": 2,
        "unit": "pc",
        "category": "spices"
      },
      {
        "name": "Curry Leaves",
        "quantity": 1,
        "unit": "sprig",
        "category": "produce"
      },
      {
        "name": "Mustard Seeds",
        "quantity": 0.5,
        "unit": "tsp",
        "category": "spices"
      },
      {
        "name": "Cumin Seeds",
        "quantity": 0.5,
        "unit": "tsp",
        "category": "spices"
      },
      {
        "name": "Black Pepper",
        "quantity": 0.5,
        "unit": "tsp",
        "category": "spices"
      },
      {
        "name": "Water",
        "quantity": 3,
        "unit": "cup",
        "category": "pantry"
      },
      {
        "name": "Salt",
        "quantity": 1,
        "unit": "tsp",
        "category": "pantry"
      },
      {
        "name": "Oil",
        "quantity": 1,
        "unit": "tbsp",
        "category": "pantry"
      }
    ],
    "tomato-saar": [
      {
        "name": "Tomato",
        "quantity": 5,
        "unit": "pc",
        "category": "produce"
      },
      {
        "name": "Garlic",
        "quantity": 4,
        "unit": "cloves",
        "category": "produce"
      },
      {
        "name": "Cumin Seeds",
        "quantity": 1,
        "unit": "tsp",
        "category": "spices"
      },
      {
        "name": "Black Pepper",
        "quantity": 0.5,
        "unit": "tsp",
        "category": "spices"
      },
      {
        "name": "Turmeric",
        "quantity": 0.25,
        "unit": "tsp",
        "category": "spices"
      },
      {
        "name": "Curry Leaves",
        "quantity": 1,
        "unit": "sprig",
        "category": "produce"
      },
      {
        "name": "Goda Masala",
        "quantity": 1,
        "unit": "tsp",
        "category": "spices"
      },
      {
        "name": "Coriander Leaves",
        "quantity": 0.25,
        "unit": "cup",
        "category": "produce"
      },
      {
        "name": "Water",
        "quantity": 2,
        "unit": "cup",
        "category": "pantry"
      },
      {
        "name": "Salt",
        "quantity": 1,
        "unit": "tsp",
        "category": "pantry"
      },
      {
        "name": "Oil",
        "quantity": 1,
        "unit": "tbsp",
        "category": "pantry"
      }
    ],
    "chana-sattu-soup": [
      {
        "name": "Sattu",
        "quantity": 0.5,
        "unit": "cup",
        "category": "grains"
      },
      {
        "name": "Chickpeas",
        "quantity": 0.5,
        "unit": "cup",
        "category": "proteins"
      },
      {
        "name": "Onion",
        "quantity": 0.5,
        "unit": "pc",
        "category": "produce"
      },
      {
        "name": "Tomato",
        "quantity": 1,
        "unit": "pc",
        "category": "produce"
      },
      {
        "name": "Ginger",
        "quantity": 0.5,
        "unit": "inch",
        "category": "produce"
      },
      {
        "name": "Green Chilli",
        "quantity": 1,
        "unit": "pc",
        "category": "produce"
      },
      {
        "name": "Lemon Juice",
        "quantity": 1,
        "unit": "tbsp",
        "category": "pantry"
      },
      {
        "name": "Cumin Powder",
        "quantity": 0.5,
        "unit": "tsp",
        "category": "spices"
      },
      {
        "name": "Salt",
        "quantity": 1,
        "unit": "tsp",
        "category": "pantry"
      },
      {
        "name": "Water",
        "quantity": 4,
        "unit": "cup",
        "category": "pantry"
      },
      {
        "name": "Coriander Leaves",
        "quantity": 0.25,
        "unit": "cup",
        "category": "produce"
      }
    ],
    "nakham-bitchi": [
      {
        "name": "Smoked Fish",
        "quantity": 150,
        "unit": "g",
        "category": "proteins"
      },
      {
        "name": "Tomato",
        "quantity": 1,
        "unit": "pc",
        "category": "produce"
      },
      {
        "name": "Green Chilli",
        "quantity": 2,
        "unit": "pcs",
        "category": "produce"
      },
      {
        "name": "Garlic",
        "quantity": 2,
        "unit": "pcs",
        "category": "produce"
      },
      {
        "name": "Ginger",
        "quantity": 0.5,
        "unit": "inch",
        "category": "produce"
      },
      {
        "name": "Black Pepper",
        "quantity": 0.5,
        "unit": "tsp",
        "category": "spices"
      },
      {
        "name": "Salt",
        "quantity": 1,
        "unit": "tsp",
        "category": "pantry"
      },
      {
        "name": "Coriander Leaves",
        "quantity": 0.25,
        "unit": "cup",
        "category": "produce"
      }
    ],
    "gobi-manchurian": [
      {
        "name": "Cauliflower",
        "quantity": 200,
        "unit": "g",
        "category": "produce",
        "inStock": false
      },
      {
        "name": "Cabbage",
        "quantity": 100,
        "unit": "g",
        "category": "produce",
        "inStock": false
      },
      {
        "name": "Maida",
        "quantity": 100,
        "unit": "g",
        "category": "grains",
        "inStock": false
      },
      {
        "name": "Soy Sauce",
        "quantity": 2,
        "unit": "tbsp",
        "category": "pantry",
        "inStock": false
      },
      {
        "name": "Oil",
        "quantity": 2,
        "unit": "tbsp",
        "category": "pantry",
        "inStock": false
      },
      {
        "name": "Spices",
        "quantity": 1,
        "unit": "packet",
        "category": "spices",
        "inStock": false
      },
      {
        "name": "Onion",
        "quantity": 1,
        "unit": "pc",
        "category": "produce",
        "inStock": false
      },
      {
        "name": "Tomato",
        "quantity": 2,
        "unit": "pc",
        "category": "produce",
        "inStock": false
      },
      {
        "name": "Green Chilli",
        "quantity": 2,
        "unit": "pc",
        "category": "produce",
        "inStock": false
      },
      {
        "name": "Ginger-Garlic Paste",
        "quantity": 1,
        "unit": "tbsp",
        "category": "produce",
        "inStock": false
      },
      {
        "name": "Coriander Leaves",
        "quantity": 0.25,
        "unit": "cup",
        "category": "produce",
        "inStock": false
      },
      {
        "name": "Salt",
        "quantity": 1,
        "unit": "tsp",
        "category": "pantry"
      },
      {
        "name": "Turmeric",
        "quantity": 0.5,
        "unit": "tsp",
        "category": "spices"
      },
      {
        "name": "Cumin Seeds",
        "quantity": 1,
        "unit": "tsp",
        "category": "spices"
      },
      {
        "name": "Red Chili Powder",
        "quantity": 0.5,
        "unit": "tsp",
        "category": "spices"
      }
    ],
    "lemon-coriander-soup": [
      {
        "name": "Lemon Juice",
        "quantity": 2,
        "unit": "tbsp",
        "category": "pantry"
      },
      {
        "name": "Coriander Leaves",
        "quantity": 0.5,
        "unit": "cup",
        "category": "produce"
      },
      {
        "name": "Water",
        "quantity": 3,
        "unit": "cup",
        "category": "pantry"
      },
      {
        "name": "Garlic",
        "quantity": 3,
        "unit": "cloves",
        "category": "produce"
      },
      {
        "name": "Ginger",
        "quantity": 1,
        "unit": "inch",
        "category": "produce"
      },
      {
        "name": "Green Chilli",
        "quantity": 1,
        "unit": "pc",
        "category": "produce"
      },
      {
        "name": "Cabbage",
        "quantity": 0.25,
        "unit": "cup",
        "category": "produce"
      },
      {
        "name": "Cornflour",
        "quantity": 1,
        "unit": "tbsp",
        "category": "pantry"
      },
      {
        "name": "Black Pepper",
        "quantity": 0.5,
        "unit": "tsp",
        "category": "spices"
      },
      {
        "name": "Salt",
        "quantity": 1,
        "unit": "tsp",
        "category": "pantry"
      }
    ],
    "hot-and-sour-soup": [
      {
        "name": "Mushrooms",
        "quantity": 100,
        "unit": "g",
        "category": "produce"
      },
      {
        "name": "Tofu",
        "quantity": 100,
        "unit": "g",
        "category": "proteins"
      },
      {
        "name": "Cabbage",
        "quantity": 0.5,
        "unit": "cup",
        "category": "produce"
      },
      {
        "name": "Carrot",
        "quantity": 0.25,
        "unit": "cup",
        "category": "produce"
      },
      {
        "name": "Garlic",
        "quantity": 3,
        "unit": "cloves",
        "category": "produce"
      },
      {
        "name": "Ginger",
        "quantity": 1,
        "unit": "inch",
        "category": "produce"
      },
      {
        "name": "Soy Sauce",
        "quantity": 1,
        "unit": "tbsp",
        "category": "pantry"
      },
      {
        "name": "Vinegar",
        "quantity": 20,
        "unit": "ml",
        "category": "pantry"
      },
      {
        "name": "Cornflour",
        "quantity": 1.5,
        "unit": "tbsp",
        "category": "pantry"
      },
      {
        "name": "Chilli Sauce",
        "quantity": 1,
        "unit": "tsp",
        "category": "pantry"
      },
      {
        "name": "Black Pepper",
        "quantity": 0.5,
        "unit": "tsp",
        "category": "spices"
      },
      {
        "name": "Water",
        "quantity": 3,
        "unit": "cup",
        "category": "pantry"
      },
      {
        "name": "Salt",
        "quantity": 1,
        "unit": "tsp",
        "category": "pantry"
      }
    ],
    "chicken-manchurian": [
      {
        "name": "Chicken",
        "quantity": 200,
        "unit": "g",
        "category": "proteins",
        "inStock": false
      },
      {
        "name": "Cabbage",
        "quantity": 100,
        "unit": "g",
        "category": "produce",
        "inStock": false
      },
      {
        "name": "Maida",
        "quantity": 100,
        "unit": "g",
        "category": "grains",
        "inStock": false
      },
      {
        "name": "Soy Sauce",
        "quantity": 2,
        "unit": "tbsp",
        "category": "pantry",
        "inStock": false
      },
      {
        "name": "Ghee",
        "quantity": 2,
        "unit": "tbsp",
        "category": "pantry",
        "inStock": false
      },
      {
        "name": "Oil",
        "quantity": 2,
        "unit": "tbsp",
        "category": "pantry",
        "inStock": false
      },
      {
        "name": "Spices",
        "quantity": 1,
        "unit": "packet",
        "category": "spices",
        "inStock": false
      },
      {
        "name": "Onion",
        "quantity": 1,
        "unit": "pc",
        "category": "produce",
        "inStock": false
      },
      {
        "name": "Tomato",
        "quantity": 2,
        "unit": "pc",
        "category": "produce",
        "inStock": false
      },
      {
        "name": "Green Chilli",
        "quantity": 2,
        "unit": "pc",
        "category": "produce",
        "inStock": false
      },
      {
        "name": "Ginger-Garlic Paste",
        "quantity": 1,
        "unit": "tbsp",
        "category": "produce",
        "inStock": false
      },
      {
        "name": "Coriander Leaves",
        "quantity": 0.25,
        "unit": "cup",
        "category": "produce",
        "inStock": false
      },
      {
        "name": "Salt",
        "quantity": 1,
        "unit": "tsp",
        "category": "pantry"
      },
      {
        "name": "Turmeric",
        "quantity": 0.5,
        "unit": "tsp",
        "category": "spices"
      },
      {
        "name": "Cumin Seeds",
        "quantity": 1,
        "unit": "tsp",
        "category": "spices"
      },
      {
        "name": "Red Chili Powder",
        "quantity": 0.5,
        "unit": "tsp",
        "category": "spices"
      }
    ],
    "honey-chilli-potato": [
      {
        "name": "Potatoes",
        "quantity": 3,
        "unit": "pc",
        "category": "produce"
      },
      {
        "name": "Corn Flour",
        "quantity": 3,
        "unit": "tbsp",
        "category": "grains"
      },
      {
        "name": "Honey",
        "quantity": 2,
        "unit": "tbsp",
        "category": "pantry"
      },
      {
        "name": "Chilli Sauce",
        "quantity": 1,
        "unit": "tbsp",
        "category": "pantry"
      },
      {
        "name": "Oil",
        "quantity": 3,
        "unit": "tbsp",
        "category": "pantry"
      },
      {
        "name": "Spring Onion",
        "quantity": 2,
        "unit": "pc",
        "category": "produce"
      }
    ],
    "chicken-lollipop": [
      {
        "name": "Chicken Wings",
        "quantity": 500,
        "unit": "g",
        "category": "proteins"
      },
      {
        "name": "Flour",
        "quantity": 0.5,
        "unit": "cup",
        "category": "grains"
      },
      {
        "name": "Soy Sauce",
        "quantity": 2,
        "unit": "tbsp",
        "category": "pantry"
      },
      {
        "name": "Chilli Sauce",
        "quantity": 1,
        "unit": "tbsp",
        "category": "pantry"
      },
      {
        "name": "Garlic",
        "quantity": 4,
        "unit": "cloves",
        "category": "produce"
      },
      {
        "name": "Ginger",
        "quantity": 1,
        "unit": "inch",
        "category": "produce"
      },
      {
        "name": "Oil",
        "quantity": 3,
        "unit": "tbsp",
        "category": "pantry"
      }
    ],
    "spring-rolls": [
      {
        "name": "Flour",
        "quantity": 1.5,
        "unit": "cup",
        "category": "grains"
      },
      {
        "name": "Cabbage",
        "quantity": 1,
        "unit": "cup",
        "category": "produce"
      },
      {
        "name": "Carrots",
        "quantity": 0.5,
        "unit": "cup",
        "category": "produce"
      },
      {
        "name": "Soy Sauce",
        "quantity": 1,
        "unit": "tbsp",
        "category": "pantry"
      },
      {
        "name": "Oil",
        "quantity": 2,
        "unit": "tbsp",
        "category": "pantry"
      }
    ],
    "chilli-chicken": [
      {
        "name": "Chicken",
        "quantity": 200,
        "unit": "g",
        "category": "proteins",
        "inStock": false
      },
      {
        "name": "Ghee",
        "quantity": 2,
        "unit": "tbsp",
        "category": "pantry",
        "inStock": false
      },
      {
        "name": "Oil",
        "quantity": 2,
        "unit": "tbsp",
        "category": "pantry",
        "inStock": false
      },
      {
        "name": "Spices",
        "quantity": 1,
        "unit": "packet",
        "category": "spices",
        "inStock": false
      },
      {
        "name": "Onion",
        "quantity": 1,
        "unit": "pc",
        "category": "produce",
        "inStock": false
      },
      {
        "name": "Tomato",
        "quantity": 2,
        "unit": "pc",
        "category": "produce",
        "inStock": false
      },
      {
        "name": "Green Chilli",
        "quantity": 2,
        "unit": "pc",
        "category": "produce",
        "inStock": false
      },
      {
        "name": "Ginger-Garlic Paste",
        "quantity": 1,
        "unit": "tbsp",
        "category": "produce",
        "inStock": false
      },
      {
        "name": "Coriander Leaves",
        "quantity": 0.25,
        "unit": "cup",
        "category": "produce",
        "inStock": false
      },
      {
        "name": "Salt",
        "quantity": 1,
        "unit": "tsp",
        "category": "pantry"
      },
      {
        "name": "Turmeric",
        "quantity": 0.5,
        "unit": "tsp",
        "category": "spices"
      },
      {
        "name": "Cumin Seeds",
        "quantity": 1,
        "unit": "tsp",
        "category": "spices"
      },
      {
        "name": "Red Chili Powder",
        "quantity": 0.5,
        "unit": "tsp",
        "category": "spices"
      }
    ],
    "chilli-mushroom": [
      {
        "name": "Mushrooms",
        "quantity": 100,
        "unit": "g",
        "category": "produce",
        "inStock": false
      },
      {
        "name": "Oil",
        "quantity": 2,
        "unit": "tbsp",
        "category": "pantry",
        "inStock": false
      },
      {
        "name": "Spices",
        "quantity": 1,
        "unit": "packet",
        "category": "spices",
        "inStock": false
      },
      {
        "name": "Onion",
        "quantity": 1,
        "unit": "pc",
        "category": "produce",
        "inStock": false
      },
      {
        "name": "Tomato",
        "quantity": 2,
        "unit": "pc",
        "category": "produce",
        "inStock": false
      },
      {
        "name": "Green Chilli",
        "quantity": 2,
        "unit": "pc",
        "category": "produce",
        "inStock": false
      },
      {
        "name": "Ginger-Garlic Paste",
        "quantity": 1,
        "unit": "tbsp",
        "category": "produce",
        "inStock": false
      },
      {
        "name": "Coriander Leaves",
        "quantity": 0.25,
        "unit": "cup",
        "category": "produce",
        "inStock": false
      },
      {
        "name": "Salt",
        "quantity": 1,
        "unit": "tsp",
        "category": "pantry"
      },
      {
        "name": "Turmeric",
        "quantity": 0.5,
        "unit": "tsp",
        "category": "spices"
      },
      {
        "name": "Cumin Seeds",
        "quantity": 1,
        "unit": "tsp",
        "category": "spices"
      },
      {
        "name": "Red Chili Powder",
        "quantity": 0.5,
        "unit": "tsp",
        "category": "spices"
      }
    ],
    "hakka-noodles": [
      {
        "name": "Onion",
        "quantity": 1,
        "unit": "pc",
        "category": "produce",
        "inStock": false
      },
      {
        "name": "Tomato",
        "quantity": 2,
        "unit": "pc",
        "category": "produce",
        "inStock": false
      },
      {
        "name": "Water",
        "quantity": 2,
        "unit": "cup",
        "category": "pantry",
        "inStock": false
      },
      {
        "name": "Black Pepper",
        "quantity": 0.5,
        "unit": "tsp",
        "category": "spices",
        "inStock": false
      },
      {
        "name": "Coriander Leaves",
        "quantity": 0.25,
        "unit": "cup",
        "category": "produce",
        "inStock": false
      },
      {
        "name": "Noodles",
        "quantity": 200,
        "unit": "g",
        "category": "grains",
        "inStock": false
      }
    ],
    "chow-mein": [
      {
        "name": "Noodles",
        "quantity": 200,
        "unit": "g",
        "category": "grains",
        "inStock": false
      },
      {
        "name": "Cabbage",
        "quantity": 0.5,
        "unit": "cup",
        "category": "produce",
        "inStock": false
      },
      {
        "name": "Carrots",
        "quantity": 0.5,
        "unit": "cup",
        "category": "produce",
        "inStock": false
      },
      {
        "name": "Soy Sauce",
        "quantity": 1,
        "unit": "tbsp",
        "category": "pantry",
        "inStock": false
      },
      {
        "name": "Oil",
        "quantity": 30,
        "unit": "ml",
        "category": "pantry",
        "inStock": false
      },
      {
        "name": "Spices",
        "quantity": 1,
        "unit": "packet",
        "category": "spices",
        "inStock": false
      }
    ],
    "schezwan-fried-rice": [
      {
        "name": "Rice",
        "quantity": 1,
        "unit": "cup",
        "category": "grains",
        "inStock": false
      },
      {
        "name": "Mixed Vegetables",
        "quantity": 0.5,
        "unit": "cup",
        "category": "produce",
        "inStock": false
      },
      {
        "name": "Oil",
        "quantity": 2,
        "unit": "tbsp",
        "category": "pantry",
        "inStock": false
      },
      {
        "name": "Spices",
        "quantity": 1,
        "unit": "packet",
        "category": "spices",
        "inStock": false
      },
      {
        "name": "Salt",
        "quantity": 1,
        "unit": "tsp",
        "category": "pantry"
      },
      {
        "name": "Turmeric",
        "quantity": 0.5,
        "unit": "tsp",
        "category": "spices"
      },
      {
        "name": "Whole Spices",
        "quantity": 1,
        "unit": "tsp",
        "category": "spices"
      }
    ],
    "chilli-garlic-fried-rice": [
      {
        "name": "Rice",
        "quantity": 1,
        "unit": "cup",
        "category": "grains",
        "inStock": false
      },
      {
        "name": "Mixed Vegetables",
        "quantity": 0.5,
        "unit": "cup",
        "category": "produce",
        "inStock": false
      },
      {
        "name": "Oil",
        "quantity": 2,
        "unit": "tbsp",
        "category": "pantry",
        "inStock": false
      },
      {
        "name": "Spices",
        "quantity": 1,
        "unit": "packet",
        "category": "spices",
        "inStock": false
      },
      {
        "name": "Salt",
        "quantity": 1,
        "unit": "tsp",
        "category": "pantry"
      },
      {
        "name": "Turmeric",
        "quantity": 0.5,
        "unit": "tsp",
        "category": "spices"
      },
      {
        "name": "Whole Spices",
        "quantity": 1,
        "unit": "tsp",
        "category": "spices"
      }
    ],
    "american-chop-suey": [
      {
        "name": "Noodles",
        "quantity": 200,
        "unit": "g",
        "category": "grains"
      },
      {
        "name": "Cabbage",
        "quantity": 0.5,
        "unit": "cup",
        "category": "produce"
      },
      {
        "name": "Carrots",
        "quantity": 0.5,
        "unit": "cup",
        "category": "produce"
      },
      {
        "name": "Capsicum",
        "quantity": 0.5,
        "unit": "cup",
        "category": "produce"
      },
      {
        "name": "Onion",
        "quantity": 1,
        "unit": "pc",
        "category": "produce"
      },
      {
        "name": "Ginger-Garlic Paste",
        "quantity": 1,
        "unit": "tbsp",
        "category": "pantry"
      },
      {
        "name": "Cornflour",
        "quantity": 1.5,
        "unit": "tbsp",
        "category": "pantry"
      },
      {
        "name": "Soy Sauce",
        "quantity": 1,
        "unit": "tbsp",
        "category": "pantry"
      },
      {
        "name": "Tomato Ketchup",
        "quantity": 2,
        "unit": "tbsp",
        "category": "pantry"
      },
      {
        "name": "Vinegar",
        "quantity": 1,
        "unit": "tbsp",
        "category": "pantry"
      },
      {
        "name": "Oil",
        "quantity": 2,
        "unit": "tbsp",
        "category": "pantry"
      },
      {
        "name": "Salt",
        "quantity": 1,
        "unit": "tsp",
        "category": "pantry"
      }
    ],
    "hot-garlic-sauce-veg": [
      {
        "name": "Mixed Vegetables",
        "quantity": 250,
        "unit": "g",
        "category": "produce"
      },
      {
        "name": "Garlic",
        "quantity": 5,
        "unit": "cloves",
        "category": "produce"
      },
      {
        "name": "Ginger",
        "quantity": 1,
        "unit": "inch",
        "category": "produce"
      },
      {
        "name": "Onion",
        "quantity": 1,
        "unit": "pc",
        "category": "produce"
      },
      {
        "name": "Capsicum",
        "quantity": 1,
        "unit": "pc",
        "category": "produce"
      },
      {
        "name": "Soy Sauce",
        "quantity": 1,
        "unit": "tbsp",
        "category": "pantry"
      },
      {
        "name": "Chilli Sauce",
        "quantity": 1,
        "unit": "tbsp",
        "category": "pantry"
      },
      {
        "name": "Cornflour",
        "quantity": 1,
        "unit": "tbsp",
        "category": "pantry"
      },
      {
        "name": "Oil",
        "quantity": 2,
        "unit": "tbsp",
        "category": "pantry"
      },
      {
        "name": "Salt",
        "quantity": 1,
        "unit": "tsp",
        "category": "pantry"
      }
    ],
    "schezwan-paneer": [
      {
        "name": "Paneer",
        "quantity": 200,
        "unit": "g",
        "category": "dairy"
      },
      {
        "name": "Oil",
        "quantity": 1,
        "unit": "tbsp",
        "category": "pantry"
      },
      {
        "name": "Salt",
        "quantity": 1,
        "unit": "tsp",
        "category": "pantry"
      },
      {
        "name": "Turmeric",
        "quantity": 0.5,
        "unit": "tsp",
        "category": "spices"
      },
      {
        "name": "Red Chili Powder",
        "quantity": 0.5,
        "unit": "tsp",
        "category": "spices"
      },
      {
        "name": "Garam Masala",
        "quantity": 0.5,
        "unit": "tsp",
        "category": "spices"
      }
    ],
    "sweet-and-sour-chicken": [
      {
        "name": "Chicken",
        "quantity": 250,
        "unit": "g",
        "category": "proteins"
      },
      {
        "name": "Pineapple",
        "quantity": 0.5,
        "unit": "cup",
        "category": "produce"
      },
      {
        "name": "Capsicum",
        "quantity": 1,
        "unit": "pc",
        "category": "produce"
      },
      {
        "name": "Onion",
        "quantity": 1,
        "unit": "pc",
        "category": "produce"
      },
      {
        "name": "Tomato",
        "quantity": 2,
        "unit": "pcs",
        "category": "produce"
      },
      {
        "name": "Tomato Ketchup",
        "quantity": 2,
        "unit": "tbsp",
        "category": "pantry"
      },
      {
        "name": "Vinegar",
        "quantity": 1,
        "unit": "tbsp",
        "category": "pantry"
      },
      {
        "name": "Cornflour",
        "quantity": 1.5,
        "unit": "tbsp",
        "category": "pantry"
      },
      {
        "name": "Soy Sauce",
        "quantity": 1,
        "unit": "tbsp",
        "category": "pantry"
      },
      {
        "name": "Oil",
        "quantity": 2,
        "unit": "tbsp",
        "category": "pantry"
      },
      {
        "name": "Salt",
        "quantity": 1,
        "unit": "tsp",
        "category": "pantry"
      }
    ],
    "sweet-and-sour-veg": [
      {
        "name": "Mixed Vegetables",
        "quantity": 300,
        "unit": "g",
        "category": "produce"
      },
      {
        "name": "Pineapple",
        "quantity": 0.5,
        "unit": "cup",
        "category": "produce"
      },
      {
        "name": "Capsicum",
        "quantity": 1,
        "unit": "pc",
        "category": "produce"
      },
      {
        "name": "Onion",
        "quantity": 1,
        "unit": "pc",
        "category": "produce"
      },
      {
        "name": "Tomato",
        "quantity": 2,
        "unit": "pcs",
        "category": "produce"
      },
      {
        "name": "Tomato Ketchup",
        "quantity": 2,
        "unit": "tbsp",
        "category": "pantry"
      },
      {
        "name": "Vinegar",
        "quantity": 1,
        "unit": "tbsp",
        "category": "pantry"
      },
      {
        "name": "Soy Sauce",
        "quantity": 1,
        "unit": "tbsp",
        "category": "pantry"
      },
      {
        "name": "Cornflour",
        "quantity": 1,
        "unit": "tbsp",
        "category": "pantry"
      },
      {
        "name": "Oil",
        "quantity": 1,
        "unit": "tbsp",
        "category": "pantry"
      },
      {
        "name": "Salt",
        "quantity": 1,
        "unit": "tsp",
        "category": "pantry"
      }
    ],
    "spiced-masala-oats": [
      {
        "name": "Oats",
        "quantity": 100,
        "unit": "g",
        "category": "grains"
      },
      {
        "name": "Onion",
        "quantity": 1,
        "unit": "pc",
        "category": "produce"
      },
      {
        "name": "Tomato",
        "quantity": 1,
        "unit": "pc",
        "category": "produce"
      },
      {
        "name": "Green Chilli",
        "quantity": 1,
        "unit": "pc",
        "category": "produce"
      },
      {
        "name": "Peas",
        "quantity": 0.25,
        "unit": "cup",
        "category": "produce"
      },
      {
        "name": "Mustard Seeds",
        "quantity": 0.5,
        "unit": "tsp",
        "category": "spices"
      },
      {
        "name": "Curry Leaves",
        "quantity": 1,
        "unit": "sprig",
        "category": "produce"
      },
      {
        "name": "Turmeric",
        "quantity": 0.25,
        "unit": "tsp",
        "category": "spices"
      },
      {
        "name": "Oil",
        "quantity": 1,
        "unit": "tbsp",
        "category": "pantry"
      },
      {
        "name": "Salt",
        "quantity": 0.5,
        "unit": "tsp",
        "category": "pantry"
      },
      {
        "name": "Coriander Leaves",
        "quantity": 0.25,
        "unit": "cup",
        "category": "produce"
      }
    ],
    "vegetable-oats-upma": [
      {
        "name": "Oats",
        "quantity": 1,
        "unit": "cup",
        "category": "grains"
      },
      {
        "name": "Oil",
        "quantity": 2,
        "unit": "tbsp",
        "category": "pantry"
      },
      {
        "name": "Mustard Seeds",
        "quantity": 0.5,
        "unit": "tsp",
        "category": "spices"
      },
      {
        "name": "Onion",
        "quantity": 1,
        "unit": "pc",
        "category": "produce"
      },
      {
        "name": "Green Chilli",
        "quantity": 1,
        "unit": "pc",
        "category": "produce"
      },
      {
        "name": "Carrot",
        "quantity": 0.25,
        "unit": "cup",
        "category": "produce"
      },
      {
        "name": "Green Peas",
        "quantity": 0.25,
        "unit": "cup",
        "category": "produce"
      },
      {
        "name": "Ginger",
        "quantity": 0.5,
        "unit": "inch",
        "category": "produce"
      },
      {
        "name": "Curry Leaves",
        "quantity": 1,
        "unit": "sprig",
        "category": "produce"
      },
      {
        "name": "Salt",
        "quantity": 1,
        "unit": "tsp",
        "category": "pantry"
      },
      {
        "name": "Coriander Leaves",
        "quantity": 0.25,
        "unit": "cup",
        "category": "produce"
      },
      {
        "name": "Mixed Vegetables",
        "quantity": 1,
        "unit": "cup",
        "category": "produce",
        "inStock": false
      }
    ],
    "oats-poha": [
      {
        "name": "Poha",
        "quantity": 1,
        "unit": "cup",
        "category": "grains"
      },
      {
        "name": "Oil",
        "quantity": 1,
        "unit": "tbsp",
        "category": "pantry"
      },
      {
        "name": "Mustard Seeds",
        "quantity": 0.5,
        "unit": "tsp",
        "category": "spices"
      },
      {
        "name": "Onion",
        "quantity": 1,
        "unit": "pc",
        "category": "produce"
      },
      {
        "name": "Salt",
        "quantity": 0.5,
        "unit": "tsp",
        "category": "pantry"
      },
      {
        "name": "Turmeric",
        "quantity": 0.25,
        "unit": "tsp",
        "category": "spices"
      },
      {
        "name": "Coriander Leaves",
        "quantity": 0.25,
        "unit": "cup",
        "category": "produce"
      },
      {
        "name": "Lemon Juice",
        "quantity": 1,
        "unit": "tbsp",
        "category": "pantry"
      },
      {
        "name": "Oats",
        "quantity": 100,
        "unit": "g",
        "category": "grains",
        "inStock": false
      }
    ],
    "dahi-tadka-oats": [
      {
        "name": "Oats",
        "quantity": 100,
        "unit": "g",
        "category": "grains"
      },
      {
        "name": "Yogurt",
        "quantity": 0.5,
        "unit": "cup",
        "category": "dairy"
      },
      {
        "name": "Oil",
        "quantity": 1,
        "unit": "tbsp",
        "category": "pantry"
      },
      {
        "name": "Mustard Seeds",
        "quantity": 0.5,
        "unit": "tsp",
        "category": "spices"
      },
      {
        "name": "Curry Leaves",
        "quantity": 1,
        "unit": "sprig",
        "category": "produce"
      },
      {
        "name": "Green Chilli",
        "quantity": 1,
        "unit": "pc",
        "category": "produce"
      },
      {
        "name": "Ginger",
        "quantity": 0.5,
        "unit": "inch",
        "category": "produce"
      },
      {
        "name": "Salt",
        "quantity": 0.5,
        "unit": "tsp",
        "category": "pantry"
      },
      {
        "name": "Coriander Leaves",
        "quantity": 0.25,
        "unit": "cup",
        "category": "produce"
      }
    ],
    "milk-oats-fusion": [
      {
        "name": "Oats",
        "quantity": 100,
        "unit": "g",
        "category": "grains"
      },
      {
        "name": "Milk",
        "quantity": 250,
        "unit": "ml",
        "category": "dairy"
      },
      {
        "name": "Water",
        "quantity": 0.5,
        "unit": "cup",
        "category": "pantry"
      },
      {
        "name": "Sugar",
        "quantity": 1,
        "unit": "tbsp",
        "category": "pantry"
      },
      {
        "name": "Cardamom",
        "quantity": 0.25,
        "unit": "tsp",
        "category": "spices"
      },
      {
        "name": "Salt",
        "quantity": 0.25,
        "unit": "tsp",
        "category": "pantry"
      }
    ],
    "spiced-hot-chocolate": [
      {
        "name": "Milk",
        "quantity": 1.5,
        "unit": "cup",
        "category": "dairy"
      },
      {
        "name": "Cocoa Powder",
        "quantity": 2,
        "unit": "tbsp",
        "category": "pantry"
      },
      {
        "name": "Sugar",
        "quantity": 1.5,
        "unit": "tbsp",
        "category": "pantry"
      },
      {
        "name": "Cardamom",
        "quantity": 0.25,
        "unit": "tsp",
        "category": "spices"
      },
      {
        "name": "Dry Ginger Powder",
        "quantity": 0.5,
        "unit": "tsp",
        "category": "spices"
      },
      {
        "name": "Cinnamon",
        "quantity": 1,
        "unit": "pc",
        "category": "spices"
      },
      {
        "name": "Dark Chocolate",
        "quantity": 1,
        "unit": "oz",
        "category": "pantry"
      }
    ],
    "goose-dum-biryani": [
      {
        "name": "Rice",
        "quantity": 1,
        "unit": "cup",
        "category": "grains"
      },
      {
        "name": "Goose",
        "quantity": 250,
        "unit": "g",
        "category": "proteins"
      },
      {
        "name": "Onion",
        "quantity": 1,
        "unit": "pc",
        "category": "produce"
      },
      {
        "name": "Ginger-Garlic Paste",
        "quantity": 1,
        "unit": "tbsp",
        "category": "pantry"
      },
      {
        "name": "Salt",
        "quantity": 1,
        "unit": "tsp",
        "category": "pantry"
      },
      {
        "name": "Biryani Masala",
        "quantity": 1,
        "unit": "tbsp",
        "category": "spices"
      },
      {
        "name": "Oil",
        "quantity": 2,
        "unit": "tbsp",
        "category": "pantry"
      },
      {
        "name": "Coriander Leaves",
        "quantity": 0.25,
        "unit": "cup",
        "category": "produce"
      },
      {
        "name": "Mint",
        "quantity": 0.25,
        "unit": "cup",
        "category": "produce"
      }
    ],
    "lebanese-lentil-soup": [
      {
        "name": "Red Lentils",
        "quantity": 100,
        "unit": "g",
        "category": "proteins"
      },
      {
        "name": "Onion",
        "quantity": 1,
        "unit": "pc",
        "category": "produce"
      },
      {
        "name": "Carrot",
        "quantity": 1,
        "unit": "pc",
        "category": "produce"
      },
      {
        "name": "Garlic",
        "quantity": 3,
        "unit": "cloves",
        "category": "produce"
      },
      {
        "name": "Cumin Seeds",
        "quantity": 1,
        "unit": "tsp",
        "category": "spices"
      },
      {
        "name": "Turmeric",
        "quantity": 0.5,
        "unit": "tsp",
        "category": "spices"
      },
      {
        "name": "Lemon Juice",
        "quantity": 1,
        "unit": "tbsp",
        "category": "pantry"
      },
      {
        "name": "Olive Oil",
        "quantity": 1,
        "unit": "tbsp",
        "category": "pantry"
      },
      {
        "name": "Water",
        "quantity": 4,
        "unit": "cup",
        "category": "pantry"
      },
      {
        "name": "Salt",
        "quantity": 1,
        "unit": "tsp",
        "category": "pantry"
      },
      {
        "name": "Coriander Leaves",
        "quantity": 0.25,
        "unit": "cup",
        "category": "produce"
      }
    ],
    "vegan-tomato-soup": [
      {
        "name": "Tomato",
        "quantity": 6,
        "unit": "pc",
        "category": "produce"
      },
      {
        "name": "Onion",
        "quantity": 1,
        "unit": "pc",
        "category": "produce"
      },
      {
        "name": "Garlic",
        "quantity": 3,
        "unit": "cloves",
        "category": "produce"
      },
      {
        "name": "Basil",
        "quantity": 0.25,
        "unit": "cup",
        "category": "produce"
      },
      {
        "name": "Coconut Milk",
        "quantity": 0.5,
        "unit": "cup",
        "category": "pantry"
      },
      {
        "name": "Black Pepper",
        "quantity": 0.5,
        "unit": "tsp",
        "category": "spices"
      },
      {
        "name": "Olive Oil",
        "quantity": 1,
        "unit": "tbsp",
        "category": "pantry"
      },
      {
        "name": "Water",
        "quantity": 2,
        "unit": "cup",
        "category": "pantry"
      },
      {
        "name": "Salt",
        "quantity": 1,
        "unit": "tsp",
        "category": "pantry"
      }
    ],
    "ginger-carrot-coconut-soup": [
      {
        "name": "Carrot",
        "quantity": 2,
        "unit": "pc",
        "category": "produce"
      },
      {
        "name": "Ginger",
        "quantity": 1,
        "unit": "inch",
        "category": "produce"
      },
      {
        "name": "Coconut Milk",
        "quantity": 1,
        "unit": "cup",
        "category": "pantry"
      },
      {
        "name": "Onion",
        "quantity": 1,
        "unit": "pc",
        "category": "produce"
      },
      {
        "name": "Garlic",
        "quantity": 2,
        "unit": "cloves",
        "category": "produce"
      },
      {
        "name": "Water",
        "quantity": 2,
        "unit": "cup",
        "category": "pantry"
      },
      {
        "name": "Black Pepper",
        "quantity": 0.5,
        "unit": "tsp",
        "category": "spices"
      },
      {
        "name": "Salt",
        "quantity": 1,
        "unit": "tsp",
        "category": "pantry"
      },
      {
        "name": "Coriander Leaves",
        "quantity": 0.25,
        "unit": "cup",
        "category": "produce"
      }
    ],
    "curried-sweet-potato-soup": [
      {
        "name": "Sweet Potatoes",
        "quantity": 2,
        "unit": "pc",
        "category": "produce"
      },
      {
        "name": "Onion",
        "quantity": 1,
        "unit": "pc",
        "category": "produce"
      },
      {
        "name": "Garlic",
        "quantity": 2,
        "unit": "cloves",
        "category": "produce"
      },
      {
        "name": "Ginger",
        "quantity": 0.5,
        "unit": "inch",
        "category": "produce"
      },
      {
        "name": "Curry Powder",
        "quantity": 1,
        "unit": "tbsp",
        "category": "spices"
      },
      {
        "name": "Coconut Milk",
        "quantity": 0.5,
        "unit": "cup",
        "category": "pantry"
      },
      {
        "name": "Water",
        "quantity": 2,
        "unit": "cup",
        "category": "pantry"
      },
      {
        "name": "Salt",
        "quantity": 1,
        "unit": "tsp",
        "category": "pantry"
      },
      {
        "name": "Black Pepper",
        "quantity": 0.5,
        "unit": "tsp",
        "category": "spices"
      },
      {
        "name": "Coriander Leaves",
        "quantity": 0.25,
        "unit": "cup",
        "category": "produce"
      }
    ],
    "pumpkin-sweet-potato-soup": [
      {
        "name": "Pumpkin",
        "quantity": 300,
        "unit": "g",
        "category": "produce"
      },
      {
        "name": "Sweet Potatoes",
        "quantity": 1,
        "unit": "pc",
        "category": "produce"
      },
      {
        "name": "Onion",
        "quantity": 1,
        "unit": "pc",
        "category": "produce"
      },
      {
        "name": "Garlic",
        "quantity": 2,
        "unit": "cloves",
        "category": "produce"
      },
      {
        "name": "Ginger",
        "quantity": 0.5,
        "unit": "inch",
        "category": "produce"
      },
      {
        "name": "Water",
        "quantity": 3,
        "unit": "cup",
        "category": "pantry"
      },
      {
        "name": "Black Pepper",
        "quantity": 0.5,
        "unit": "tsp",
        "category": "spices"
      },
      {
        "name": "Nutmeg",
        "quantity": 1,
        "unit": "pinch",
        "category": "spices"
      },
      {
        "name": "Salt",
        "quantity": 1,
        "unit": "tsp",
        "category": "pantry"
      },
      {
        "name": "Coriander Leaves",
        "quantity": 0.25,
        "unit": "cup",
        "category": "produce"
      }
    ],
    "vegetarian-taco-soup": [
      {
        "name": "Black Beans",
        "quantity": 0.5,
        "unit": "cup",
        "category": "pantry"
      },
      {
        "name": "Kidney Beans",
        "quantity": 0.5,
        "unit": "cup",
        "category": "proteins"
      },
      {
        "name": "Sweet Corn",
        "quantity": 0.25,
        "unit": "cup",
        "category": "produce"
      },
      {
        "name": "Onion",
        "quantity": 1,
        "unit": "pc",
        "category": "produce"
      },
      {
        "name": "Tomato",
        "quantity": 2,
        "unit": "pc",
        "category": "produce"
      },
      {
        "name": "Bell Pepper",
        "quantity": 1,
        "unit": "pc",
        "category": "produce"
      },
      {
        "name": "Garlic",
        "quantity": 3,
        "unit": "cloves",
        "category": "produce"
      },
      {
        "name": "Cumin Seeds",
        "quantity": 1,
        "unit": "tsp",
        "category": "spices"
      },
      {
        "name": "Red Chilli Powder",
        "quantity": 0.5,
        "unit": "tsp",
        "category": "spices"
      },
      {
        "name": "Coriander Leaves",
        "quantity": 0.25,
        "unit": "cup",
        "category": "produce"
      },
      {
        "name": "Water",
        "quantity": 3,
        "unit": "cup",
        "category": "pantry"
      },
      {
        "name": "Salt",
        "quantity": 1,
        "unit": "tsp",
        "category": "pantry"
      },
      {
        "name": "Oil",
        "quantity": 1,
        "unit": "tbsp",
        "category": "pantry"
      }
    ],
    "lentil-feta-salad": [
      {
        "name": "Lentils",
        "quantity": 0.5,
        "unit": "cup",
        "category": "proteins"
      },
      {
        "name": "Feta Cheese",
        "quantity": 60,
        "unit": "g",
        "category": "dairy"
      },
      {
        "name": "Cucumber",
        "quantity": 0.5,
        "unit": "pc",
        "category": "produce"
      },
      {
        "name": "Tomato",
        "quantity": 1,
        "unit": "pc",
        "category": "produce"
      },
      {
        "name": "Olive Oil",
        "quantity": 1,
        "unit": "tbsp",
        "category": "pantry"
      },
      {
        "name": "Lemon Juice",
        "quantity": 1,
        "unit": "tbsp",
        "category": "pantry"
      },
      {
        "name": "Black Pepper",
        "quantity": 0.25,
        "unit": "tsp",
        "category": "spices"
      },
      {
        "name": "Salt",
        "quantity": 0.5,
        "unit": "tsp",
        "category": "pantry"
      }
    ],
    "roasted-cauliflower-salad": [
      {
        "name": "Cauliflower",
        "quantity": 300,
        "unit": "g",
        "category": "produce"
      },
      {
        "name": "Olive Oil",
        "quantity": 2,
        "unit": "tbsp",
        "category": "pantry"
      },
      {
        "name": "Garlic",
        "quantity": 2,
        "unit": "cloves",
        "category": "produce"
      },
      {
        "name": "Lemon Juice",
        "quantity": 1,
        "unit": "tbsp",
        "category": "pantry"
      },
      {
        "name": "Black Pepper",
        "quantity": 0.25,
        "unit": "tsp",
        "category": "spices"
      },
      {
        "name": "Salt",
        "quantity": 0.5,
        "unit": "tsp",
        "category": "pantry"
      },
      {
        "name": "Parsley",
        "quantity": 2,
        "unit": "tbsp",
        "category": "produce"
      }
    ],
    "beetroot-feta-salad": [
      {
        "name": "Beetroot",
        "quantity": 4,
        "unit": "pcs",
        "category": "produce"
      },
      {
        "name": "Feta Cheese",
        "quantity": 60,
        "unit": "g",
        "category": "dairy"
      },
      {
        "name": "Parsley",
        "quantity": 2,
        "unit": "tbsp",
        "category": "produce"
      },
      {
        "name": "Lemon Juice",
        "quantity": 3,
        "unit": "tbsp",
        "category": "pantry"
      },
      {
        "name": "Olive Oil",
        "quantity": 3,
        "unit": "tbsp",
        "category": "pantry"
      },
      {
        "name": "Garlic",
        "quantity": 2,
        "unit": "cloves",
        "category": "produce"
      },
      {
        "name": "Black Pepper",
        "quantity": 0.5,
        "unit": "tsp",
        "category": "spices"
      },
      {
        "name": "Salt",
        "quantity": 0.5,
        "unit": "tsp",
        "category": "pantry"
      }
    ],
    "california-grape-avocado-salad": [
      {
        "name": "Grapes",
        "quantity": 100,
        "unit": "g",
        "category": "produce"
      },
      {
        "name": "Avocado",
        "quantity": 1,
        "unit": "pc",
        "category": "produce"
      },
      {
        "name": "Mixed Greens",
        "quantity": 1,
        "unit": "cup",
        "category": "produce"
      },
      {
        "name": "Olive Oil",
        "quantity": 1,
        "unit": "tbsp",
        "category": "pantry"
      },
      {
        "name": "Lemon Juice",
        "quantity": 1,
        "unit": "tbsp",
        "category": "pantry"
      },
      {
        "name": "Black Pepper",
        "quantity": 0.25,
        "unit": "tsp",
        "category": "spices"
      },
      {
        "name": "Salt",
        "quantity": 0.5,
        "unit": "tsp",
        "category": "pantry"
      }
    ],
    "watermelon-feta-mint-salad": [
      {
        "name": "Watermelon",
        "quantity": 300,
        "unit": "g",
        "category": "produce"
      },
      {
        "name": "Feta Cheese",
        "quantity": 50,
        "unit": "g",
        "category": "dairy"
      },
      {
        "name": "Mint",
        "quantity": 0.25,
        "unit": "cup",
        "category": "produce"
      },
      {
        "name": "Lemon Juice",
        "quantity": 1,
        "unit": "tbsp",
        "category": "pantry"
      },
      {
        "name": "Black Pepper",
        "quantity": 0.25,
        "unit": "tsp",
        "category": "spices"
      },
      {
        "name": "Salt",
        "quantity": 0.5,
        "unit": "tsp",
        "category": "pantry"
      }
    ],
    "breakfast-fruit-salad": [
      {
        "name": "Mixed Seasonal Fruit",
        "quantity": 300,
        "unit": "g",
        "category": "produce"
      },
      {
        "name": "Lemon Juice",
        "quantity": 1,
        "unit": "tbsp",
        "category": "pantry"
      },
      {
        "name": "Honey",
        "quantity": 1,
        "unit": "tbsp",
        "category": "pantry"
      },
      {
        "name": "Mint",
        "quantity": 0.25,
        "unit": "cup",
        "category": "produce"
      },
      {
        "name": "Salt",
        "quantity": 0.5,
        "unit": "tsp",
        "category": "pantry"
      }
    ],
    "apple-walnut-salad": [
      {
        "name": "Apple",
        "quantity": 1,
        "unit": "pc",
        "category": "produce"
      },
      {
        "name": "Walnuts",
        "quantity": 30,
        "unit": "g",
        "category": "pantry"
      },
      {
        "name": "Cabbage",
        "quantity": 0.5,
        "unit": "cup",
        "category": "produce"
      },
      {
        "name": "Lemon Juice",
        "quantity": 1,
        "unit": "tbsp",
        "category": "pantry"
      },
      {
        "name": "Olive Oil",
        "quantity": 1,
        "unit": "tbsp",
        "category": "pantry"
      },
      {
        "name": "Black Pepper",
        "quantity": 0.25,
        "unit": "tsp",
        "category": "spices"
      },
      {
        "name": "Salt",
        "quantity": 0.5,
        "unit": "tsp",
        "category": "pantry"
      }
    ],
    "vegan-broccoli-salad": [
      {
        "name": "Broccoli",
        "quantity": 250,
        "unit": "g",
        "category": "produce"
      },
      {
        "name": "Red Onion",
        "quantity": 0.5,
        "unit": "pc",
        "category": "produce"
      },
      {
        "name": "Sunflower Seeds",
        "quantity": 1,
        "unit": "tbsp",
        "category": "pantry"
      },
      {
        "name": "Olive Oil",
        "quantity": 1,
        "unit": "tbsp",
        "category": "pantry"
      },
      {
        "name": "Lemon Juice",
        "quantity": 1,
        "unit": "tbsp",
        "category": "pantry"
      },
      {
        "name": "Black Pepper",
        "quantity": 0.25,
        "unit": "tsp",
        "category": "spices"
      },
      {
        "name": "Salt",
        "quantity": 0.5,
        "unit": "tsp",
        "category": "pantry"
      }
    ],
    "roasted-broccoli-potatoes": [
      {
        "name": "Broccoli",
        "quantity": 250,
        "unit": "g",
        "category": "produce"
      },
      {
        "name": "Potatoes",
        "quantity": 2,
        "unit": "pc",
        "category": "produce"
      },
      {
        "name": "Garlic",
        "quantity": 2,
        "unit": "cloves",
        "category": "produce"
      },
      {
        "name": "Olive Oil",
        "quantity": 2,
        "unit": "tbsp",
        "category": "pantry"
      },
      {
        "name": "Lemon Juice",
        "quantity": 1,
        "unit": "tbsp",
        "category": "pantry"
      },
      {
        "name": "Black Pepper",
        "quantity": 0.25,
        "unit": "tsp",
        "category": "spices"
      },
      {
        "name": "Salt",
        "quantity": 0.5,
        "unit": "tsp",
        "category": "pantry"
      }
    ],
    "indian-asparagus-lemon-cumin": [
      {
        "name": "Asparagus",
        "quantity": 200,
        "unit": "g",
        "category": "produce"
      },
      {
        "name": "Cumin Seeds",
        "quantity": 1,
        "unit": "tsp",
        "category": "spices"
      },
      {
        "name": "Lemon Juice",
        "quantity": 1,
        "unit": "tbsp",
        "category": "pantry"
      },
      {
        "name": "Oil",
        "quantity": 1,
        "unit": "tbsp",
        "category": "pantry"
      },
      {
        "name": "Salt",
        "quantity": 0.5,
        "unit": "tsp",
        "category": "pantry"
      }
    ],
    "avocado-green-goddess-dressing": [
      {
        "name": "Avocado",
        "quantity": 1,
        "unit": "pc",
        "category": "produce"
      },
      {
        "name": "Yogurt",
        "quantity": 0.25,
        "unit": "cup",
        "category": "dairy"
      },
      {
        "name": "Garlic",
        "quantity": 1,
        "unit": "clove",
        "category": "produce"
      },
      {
        "name": "Lemon Juice",
        "quantity": 2,
        "unit": "tbsp",
        "category": "pantry"
      },
      {
        "name": "Olive Oil",
        "quantity": 2,
        "unit": "tbsp",
        "category": "pantry"
      },
      {
        "name": "Fresh Herbs",
        "quantity": 0.25,
        "unit": "cup",
        "category": "produce"
      }
    ],
    "healthy-oatmeal-banana-pancakes": [
      {
        "name": "Oats",
        "quantity": 1,
        "unit": "cup",
        "category": "grains"
      },
      {
        "name": "Banana",
        "quantity": 1,
        "unit": "pc",
        "category": "produce"
      },
      {
        "name": "Milk",
        "quantity": 0.75,
        "unit": "cup",
        "category": "dairy"
      },
      {
        "name": "Eggs",
        "quantity": 1,
        "unit": "pc",
        "category": "dairy"
      },
      {
        "name": "Baking Powder",
        "quantity": 1,
        "unit": "tsp",
        "category": "pantry"
      },
      {
        "name": "Cinnamon",
        "quantity": 0.5,
        "unit": "tsp",
        "category": "spices"
      },
      {
        "name": "Maple Syrup",
        "quantity": 2,
        "unit": "tbsp",
        "category": "pantry"
      },
      {
        "name": "Oil",
        "quantity": 1,
        "unit": "tbsp",
        "category": "pantry"
      }
    ],
    "vegan-potato-pancakes": [
      {
        "name": "Potatoes",
        "quantity": 3,
        "unit": "pcs",
        "category": "produce"
      },
      {
        "name": "All-Purpose Flour",
        "quantity": 0.5,
        "unit": "cup",
        "category": "grains"
      },
      {
        "name": "Onion",
        "quantity": 1,
        "unit": "pc",
        "category": "produce"
      },
      {
        "name": "Salt",
        "quantity": 0.5,
        "unit": "tsp",
        "category": "pantry"
      },
      {
        "name": "Pepper",
        "quantity": 0.25,
        "unit": "tsp",
        "category": "spices"
      },
      {
        "name": "Oil",
        "quantity": 2,
        "unit": "tbsp",
        "category": "pantry"
      }
    ],
    "classic-pancakes": [
      {
        "name": "Flour",
        "quantity": 100,
        "unit": "g",
        "category": "grains"
      },
      {
        "name": "Eggs",
        "quantity": 2,
        "unit": "pcs",
        "category": "proteins"
      },
      {
        "name": "Milk",
        "quantity": 300,
        "unit": "ml",
        "category": "dairy"
      },
      {
        "name": "Oil",
        "quantity": 1,
        "unit": "tbsp",
        "category": "pantry"
      },
      {
        "name": "Salt",
        "quantity": 1,
        "unit": "pinch",
        "category": "pantry"
      }
    ],
    "vegan-french-toast-casserole": [
      {
        "name": "Bread",
        "quantity": 6,
        "unit": "slices",
        "category": "breads"
      },
      {
        "name": "Almond Milk",
        "quantity": 1,
        "unit": "cup",
        "category": "pantry"
      },
      {
        "name": "Maple Syrup",
        "quantity": 2,
        "unit": "tbsp",
        "category": "pantry"
      },
      {
        "name": "Cinnamon",
        "quantity": 1,
        "unit": "tsp",
        "category": "spices"
      },
      {
        "name": "Coconut Oil",
        "quantity": 1,
        "unit": "tbsp",
        "category": "pantry"
      },
      {
        "name": "Cornstarch",
        "quantity": 1,
        "unit": "tbsp",
        "category": "pantry"
      }
    ],
    "blueberry-banana-oat-bread": [
      {
        "name": "All-Purpose Flour",
        "quantity": 2,
        "unit": "cups",
        "category": "grains"
      },
      {
        "name": "Sugar",
        "quantity": 0.75,
        "unit": "cup",
        "category": "pantry"
      },
      {
        "name": "Mashed Banana",
        "quantity": 1.5,
        "unit": "cups",
        "category": "produce"
      },
      {
        "name": "Baking Soda",
        "quantity": 1,
        "unit": "tsp",
        "category": "pantry"
      },
      {
        "name": "Salt",
        "quantity": 0.5,
        "unit": "tsp",
        "category": "pantry"
      },
      {
        "name": "Oil",
        "quantity": 0.5,
        "unit": "cup",
        "category": "pantry"
      },
      {
        "name": "Blueberries",
        "quantity": 1,
        "unit": "cup",
        "category": "produce"
      }
    ],
    "banana-bread-no-butter": [
      {
        "name": "All-Purpose Flour",
        "quantity": 2,
        "unit": "cups",
        "category": "grains"
      },
      {
        "name": "Sugar",
        "quantity": 1,
        "unit": "cup",
        "category": "pantry"
      },
      {
        "name": "Mashed Banana",
        "quantity": 1.5,
        "unit": "cups",
        "category": "produce"
      },
      {
        "name": "Baking Soda",
        "quantity": 1,
        "unit": "tsp",
        "category": "pantry"
      },
      {
        "name": "Baking Powder",
        "quantity": 0.5,
        "unit": "tsp",
        "category": "pantry"
      },
      {
        "name": "Salt",
        "quantity": 0.5,
        "unit": "tsp",
        "category": "pantry"
      },
      {
        "name": "Coconut Oil",
        "quantity": 0.5,
        "unit": "cup",
        "category": "pantry"
      },
      {
        "name": "Vanilla Extract",
        "quantity": 1,
        "unit": "tsp",
        "category": "pantry"
      }
    ],
    "banana-bread-no-brown-sugar": [
      {
        "name": "All-Purpose Flour",
        "quantity": 2,
        "unit": "cups",
        "category": "grains"
      },
      {
        "name": "Mashed Banana",
        "quantity": 1.5,
        "unit": "cups",
        "category": "produce"
      },
      {
        "name": "Baking Soda",
        "quantity": 1,
        "unit": "tsp",
        "category": "pantry"
      },
      {
        "name": "Salt",
        "quantity": 0.5,
        "unit": "tsp",
        "category": "pantry"
      },
      {
        "name": "Honey",
        "quantity": 0.25,
        "unit": "cup",
        "category": "pantry"
      },
      {
        "name": "Oil",
        "quantity": 0.5,
        "unit": "cup",
        "category": "pantry"
      }
    ],
    "banana-peanut-butter-sandwich": [
      {
        "name": "Bread",
        "quantity": 4,
        "unit": "slices",
        "category": "grains"
      },
      {
        "name": "Banana",
        "quantity": 2,
        "unit": "pcs",
        "category": "produce"
      },
      {
        "name": "Peanut Butter",
        "quantity": 3,
        "unit": "tbsp",
        "category": "pantry"
      },
      {
        "name": "Coconut Oil",
        "quantity": 1,
        "unit": "tbsp",
        "category": "pantry"
      },
      {
        "name": "Salt",
        "quantity": 0.5,
        "unit": "tsp",
        "category": "pantry"
      }
    ],
    "cottage-cheese-fruit": [
      {
        "name": "Cottage Cheese",
        "quantity": 1,
        "unit": "cup",
        "category": "dairy"
      },
      {
        "name": "Mixed Fruit",
        "quantity": 1,
        "unit": "cup",
        "category": "produce"
      },
      {
        "name": "Honey",
        "quantity": 1,
        "unit": "tbsp",
        "category": "pantry"
      },
      {
        "name": "Almonds",
        "quantity": 1,
        "unit": "tbsp",
        "category": "pantry"
      },
      {
        "name": "Cinnamon",
        "quantity": 0.25,
        "unit": "tsp",
        "category": "spices"
      }
    ],
    "greek-nachos-baked-chickpeas": [
      {
        "name": "Nachos",
        "quantity": 1,
        "unit": "packet",
        "category": "breads"
      },
      {
        "name": "Feta Cheese",
        "quantity": 100,
        "unit": "g",
        "category": "dairy"
      },
      {
        "name": "Chickpeas",
        "quantity": 1,
        "unit": "cup",
        "category": "proteins"
      }
    ],
    "lentil-pasta-marinara": [
      {
        "name": "Lentil Pasta",
        "quantity": 200,
        "unit": "g",
        "category": "grains"
      },
      {
        "name": "Tomato",
        "quantity": 2,
        "unit": "pcs",
        "category": "produce"
      },
      {
        "name": "Garlic",
        "quantity": 2,
        "unit": "cloves",
        "category": "produce"
      },
      {
        "name": "Onion",
        "quantity": 1,
        "unit": "pc",
        "category": "produce"
      },
      {
        "name": "Olive Oil",
        "quantity": 1,
        "unit": "tbsp",
        "category": "pantry"
      },
      {
        "name": "Italian Herbs",
        "quantity": 1,
        "unit": "tsp",
        "category": "pantry"
      },
      {
        "name": "Salt",
        "quantity": 0.5,
        "unit": "tsp",
        "category": "pantry"
      }
    ],
    "tofu-meatballs": [
      {
        "name": "Tofu",
        "quantity": 300,
        "unit": "g",
        "category": "proteins"
      },
      {
        "name": "Walnuts",
        "quantity": 0.5,
        "unit": "cup",
        "category": "pantry"
      },
      {
        "name": "Breadcrumbs",
        "quantity": 0.5,
        "unit": "cup",
        "category": "pantry"
      },
      {
        "name": "Garlic",
        "quantity": 3,
        "unit": "cloves",
        "category": "produce"
      },
      {
        "name": "Onion",
        "quantity": 1,
        "unit": "pc",
        "category": "produce"
      },
      {
        "name": "Soy Sauce",
        "quantity": 2,
        "unit": "tbsp",
        "category": "pantry"
      },
      {
        "name": "Italian Herbs",
        "quantity": 1,
        "unit": "tbsp",
        "category": "pantry"
      }
    ],
    "tahini-pasta": [
      {
        "name": "Pasta",
        "quantity": 200,
        "unit": "g",
        "category": "grains"
      },
      {
        "name": "Tahini",
        "quantity": 3,
        "unit": "tbsp",
        "category": "pantry"
      },
      {
        "name": "Garlic",
        "quantity": 2,
        "unit": "cloves",
        "category": "produce"
      },
      {
        "name": "Lemon Juice",
        "quantity": 1,
        "unit": "tbsp",
        "category": "pantry"
      },
      {
        "name": "Olive Oil",
        "quantity": 1,
        "unit": "tbsp",
        "category": "pantry"
      },
      {
        "name": "Salt",
        "quantity": 0.5,
        "unit": "tsp",
        "category": "pantry"
      }
    ],
    "crispy-potato-tacos": [
      {
        "name": "Tortillas",
        "quantity": 4,
        "unit": "pcs",
        "category": "grains"
      },
      {
        "name": "Potatoes",
        "quantity": 2,
        "unit": "pcs",
        "category": "produce"
      },
      {
        "name": "Onion",
        "quantity": 1,
        "unit": "pc",
        "category": "produce"
      },
      {
        "name": "Oil",
        "quantity": 2,
        "unit": "tbsp",
        "category": "pantry"
      },
      {
        "name": "Smoked Paprika",
        "quantity": 0.5,
        "unit": "tsp",
        "category": "spices"
      },
      {
        "name": "Salt",
        "quantity": 0.5,
        "unit": "tsp",
        "category": "pantry"
      },
      {
        "name": "Salsa",
        "quantity": 2,
        "unit": "tbsp",
        "category": "pantry"
      }
    ],
    "baked-penne-roasted-veg": [
      {
        "name": "Penne Pasta",
        "quantity": 200,
        "unit": "g",
        "category": "grains"
      },
      {
        "name": "Mixed Vegetables",
        "quantity": 1,
        "unit": "cup",
        "category": "produce"
      },
      {
        "name": "Tomato Sauce",
        "quantity": 1,
        "unit": "cup",
        "category": "pantry"
      },
      {
        "name": "Olive Oil",
        "quantity": 2,
        "unit": "tbsp",
        "category": "pantry"
      },
      {
        "name": "Cheese",
        "quantity": 0.5,
        "unit": "cup",
        "category": "dairy"
      },
      {
        "name": "Italian Herbs",
        "quantity": 1,
        "unit": "tsp",
        "category": "pantry"
      },
      {
        "name": "Salt",
        "quantity": 0.5,
        "unit": "tsp",
        "category": "pantry"
      }
    ],
    "vegan-egg-salad-sandwich": [
      {
        "name": "Tofu",
        "quantity": 200,
        "unit": "g",
        "category": "proteins"
      },
      {
        "name": "Kala Namak",
        "quantity": 0.25,
        "unit": "tsp",
        "category": "spices"
      },
      {
        "name": "Oil",
        "quantity": 1,
        "unit": "tbsp",
        "category": "pantry"
      },
      {
        "name": "Salt",
        "quantity": 0.5,
        "unit": "tsp",
        "category": "pantry"
      },
      {
        "name": "Pepper",
        "quantity": 0.25,
        "unit": "tsp",
        "category": "spices"
      }
    ],
    "vegan-biryani-cauliflower": [
      {
        "name": "Rice",
        "quantity": 1,
        "unit": "cup",
        "category": "grains"
      },
      {
        "name": "Onion",
        "quantity": 1,
        "unit": "pc",
        "category": "produce"
      },
      {
        "name": "Ginger-Garlic Paste",
        "quantity": 1,
        "unit": "tbsp",
        "category": "pantry"
      },
      {
        "name": "Salt",
        "quantity": 1,
        "unit": "tsp",
        "category": "pantry"
      },
      {
        "name": "Biryani Masala",
        "quantity": 1,
        "unit": "tbsp",
        "category": "spices"
      },
      {
        "name": "Oil",
        "quantity": 2,
        "unit": "tbsp",
        "category": "pantry"
      },
      {
        "name": "Coriander Leaves",
        "quantity": 0.25,
        "unit": "cup",
        "category": "produce"
      },
      {
        "name": "Mint",
        "quantity": 0.25,
        "unit": "cup",
        "category": "produce"
      },
      {
        "name": "Cauliflower",
        "quantity": 200,
        "unit": "g",
        "category": "produce",
        "inStock": false
      }
    ],
    "chickpea-lentil-saute-apple-curry": [
      {
        "name": "Chickpeas",
        "quantity": 0.5,
        "unit": "cup",
        "category": "proteins"
      },
      {
        "name": "Red Lentils",
        "quantity": 0.5,
        "unit": "cup",
        "category": "proteins"
      },
      {
        "name": "Apple",
        "quantity": 1,
        "unit": "pc",
        "category": "produce"
      },
      {
        "name": "Onion",
        "quantity": 1,
        "unit": "pc",
        "category": "produce"
      },
      {
        "name": "Tomato",
        "quantity": 1,
        "unit": "pc",
        "category": "produce"
      },
      {
        "name": "Ginger-Garlic Paste",
        "quantity": 1,
        "unit": "tbsp",
        "category": "pantry"
      },
      {
        "name": "Turmeric",
        "quantity": 0.5,
        "unit": "tsp",
        "category": "spices"
      },
      {
        "name": "Curry Powder",
        "quantity": 1,
        "unit": "tbsp",
        "category": "spices"
      },
      {
        "name": "Oil",
        "quantity": 1,
        "unit": "tbsp",
        "category": "pantry"
      },
      {
        "name": "Salt",
        "quantity": 1,
        "unit": "tsp",
        "category": "pantry"
      },
      {
        "name": "Coriander Leaves",
        "quantity": 0.25,
        "unit": "cup",
        "category": "produce"
      }
    ],
    "chickpea-tikka-masala": [
      {
        "name": "Chickpeas",
        "quantity": 1,
        "unit": "cup",
        "category": "proteins"
      },
      {
        "name": "Onion",
        "quantity": 1,
        "unit": "pc",
        "category": "produce"
      },
      {
        "name": "Tomato",
        "quantity": 2,
        "unit": "pcs",
        "category": "produce"
      },
      {
        "name": "Ginger-Garlic Paste",
        "quantity": 1,
        "unit": "tbsp",
        "category": "pantry"
      },
      {
        "name": "Cream",
        "quantity": 2,
        "unit": "tbsp",
        "category": "dairy"
      },
      {
        "name": "Dried Fenugreek Leaves (Kasuri Methi)",
        "quantity": 1,
        "unit": "tbsp",
        "category": "pantry"
      },
      {
        "name": "Garam Masala",
        "quantity": 0.5,
        "unit": "tsp",
        "category": "spices"
      },
      {
        "name": "Oil",
        "quantity": 1,
        "unit": "tbsp",
        "category": "pantry"
      },
      {
        "name": "Salt",
        "quantity": 1,
        "unit": "tsp",
        "category": "pantry"
      },
      {
        "name": "Coriander Leaves",
        "quantity": 0.25,
        "unit": "cup",
        "category": "produce"
      }
    ],
    "bbq-jackfruit-burrito-bowl": [
      {
        "name": "Jackfruit",
        "quantity": 200,
        "unit": "g",
        "category": "produce"
      },
      {
        "name": "Rice",
        "quantity": 1,
        "unit": "cup",
        "category": "grains"
      },
      {
        "name": "BBQ Sauce",
        "quantity": 3,
        "unit": "tbsp",
        "category": "pantry"
      },
      {
        "name": "Black Beans",
        "quantity": 0.5,
        "unit": "cup",
        "category": "pantry"
      },
      {
        "name": "Corn",
        "quantity": 0.5,
        "unit": "cup",
        "category": "produce"
      },
      {
        "name": "Avocado",
        "quantity": 1,
        "unit": "pc",
        "category": "produce"
      }
    ],
    "indian-fried-rice-khichdi": [
      {
        "name": "Rice",
        "quantity": 0.5,
        "unit": "cup",
        "category": "grains"
      },
      {
        "name": "Moong Dal",
        "quantity": 0.5,
        "unit": "cup",
        "category": "proteins"
      },
      {
        "name": "Salt",
        "quantity": 1,
        "unit": "tsp",
        "category": "pantry"
      },
      {
        "name": "Turmeric",
        "quantity": 0.5,
        "unit": "tsp",
        "category": "spices"
      },
      {
        "name": "Oil",
        "quantity": 1,
        "unit": "tbsp",
        "category": "pantry"
      }
    ],
    "vegan-rasta-pasta": [
      {
        "name": "Pasta",
        "quantity": 200,
        "unit": "g",
        "category": "grains"
      },
      {
        "name": "Coconut Milk",
        "quantity": 1,
        "unit": "cup",
        "category": "pantry"
      },
      {
        "name": "Bell Peppers",
        "quantity": 1,
        "unit": "cup",
        "category": "produce"
      },
      {
        "name": "Onion",
        "quantity": 1,
        "unit": "pc",
        "category": "produce"
      },
      {
        "name": "Jerk Seasoning",
        "quantity": 1,
        "unit": "tbsp",
        "category": "spices"
      },
      {
        "name": "Garlic",
        "quantity": 2,
        "unit": "cloves",
        "category": "produce"
      },
      {
        "name": "Oil",
        "quantity": 1,
        "unit": "tbsp",
        "category": "pantry"
      },
      {
        "name": "Salt",
        "quantity": 0.5,
        "unit": "tsp",
        "category": "pantry"
      }
    ],
    "sweet-potato-breakfast-hash": [
      {
        "name": "Sweet Potato",
        "quantity": 2,
        "unit": "pcs",
        "category": "produce"
      },
      {
        "name": "Black Beans",
        "quantity": 0.5,
        "unit": "cup",
        "category": "pantry"
      },
      {
        "name": "Onion",
        "quantity": 1,
        "unit": "pc",
        "category": "produce"
      },
      {
        "name": "Bell Pepper",
        "quantity": 1,
        "unit": "pc",
        "category": "produce"
      },
      {
        "name": "Oil",
        "quantity": 1,
        "unit": "tbsp",
        "category": "pantry"
      },
      {
        "name": "Cumin",
        "quantity": 0.5,
        "unit": "tsp",
        "category": "spices"
      },
      {
        "name": "Smoked Paprika",
        "quantity": 0.5,
        "unit": "tsp",
        "category": "spices"
      },
      {
        "name": "Salt",
        "quantity": 0.5,
        "unit": "tsp",
        "category": "pantry"
      },
      {
        "name": "Potatoes",
        "quantity": 3,
        "unit": "pc",
        "category": "produce",
        "inStock": false
      }
    ],
    "roasted-cauliflower-curry-sweet-potato": [
      {
        "name": "Cauliflower",
        "quantity": 250,
        "unit": "g",
        "category": "produce"
      },
      {
        "name": "Sweet Potatoes",
        "quantity": 2,
        "unit": "pc",
        "category": "produce"
      },
      {
        "name": "Onion",
        "quantity": 1,
        "unit": "pc",
        "category": "produce"
      },
      {
        "name": "Ginger-Garlic Paste",
        "quantity": 1,
        "unit": "tbsp",
        "category": "pantry"
      },
      {
        "name": "Coconut Milk",
        "quantity": 0.5,
        "unit": "cup",
        "category": "pantry"
      },
      {
        "name": "Turmeric",
        "quantity": 0.5,
        "unit": "tsp",
        "category": "spices"
      },
      {
        "name": "Red Chilli Powder",
        "quantity": 0.5,
        "unit": "tsp",
        "category": "spices"
      },
      {
        "name": "Garam Masala",
        "quantity": 1,
        "unit": "tsp",
        "category": "spices"
      },
      {
        "name": "Oil",
        "quantity": 1,
        "unit": "tbsp",
        "category": "pantry"
      },
      {
        "name": "Salt",
        "quantity": 1,
        "unit": "tsp",
        "category": "pantry"
      },
      {
        "name": "Coriander Leaves",
        "quantity": 0.25,
        "unit": "cup",
        "category": "produce"
      }
    ],
    "sweet-sesame-noodles-tofu-broccoli": [
      {
        "name": "Noodles",
        "quantity": 200,
        "unit": "g",
        "category": "grains"
      },
      {
        "name": "Tofu",
        "quantity": 150,
        "unit": "g",
        "category": "proteins"
      },
      {
        "name": "Broccoli",
        "quantity": 1,
        "unit": "cup",
        "category": "produce"
      },
      {
        "name": "Sesame Oil",
        "quantity": 1,
        "unit": "tbsp",
        "category": "pantry"
      },
      {
        "name": "Soy Sauce",
        "quantity": 2,
        "unit": "tbsp",
        "category": "pantry"
      },
      {
        "name": "Sesame Seeds",
        "quantity": 1,
        "unit": "tbsp",
        "category": "pantry"
      },
      {
        "name": "Garlic",
        "quantity": 2,
        "unit": "cloves",
        "category": "produce"
      },
      {
        "name": "Ginger",
        "quantity": 1,
        "unit": "inch",
        "category": "produce"
      }
    ],
    "mushroom-toast": [
      {
        "name": "Bread",
        "quantity": 2,
        "unit": "pc",
        "category": "breads"
      },
      {
        "name": "Mushrooms",
        "quantity": 100,
        "unit": "g",
        "category": "produce"
      },
      {
        "name": "Olive Oil",
        "quantity": 1,
        "unit": "tbsp",
        "category": "pantry"
      },
      {
        "name": "Garlic",
        "quantity": 2,
        "unit": "cloves",
        "category": "produce"
      }
    ],
    "vegan-chow-mein": [
      {
        "name": "Noodles",
        "quantity": 200,
        "unit": "g",
        "category": "grains"
      },
      {
        "name": "Cabbage",
        "quantity": 0.5,
        "unit": "cup",
        "category": "produce"
      },
      {
        "name": "Carrots",
        "quantity": 0.5,
        "unit": "cup",
        "category": "produce"
      },
      {
        "name": "Soy Sauce",
        "quantity": 1,
        "unit": "tbsp",
        "category": "pantry"
      },
      {
        "name": "Oil",
        "quantity": 2,
        "unit": "tbsp",
        "category": "pantry"
      },
      {
        "name": "Spring Onion",
        "quantity": 2,
        "unit": "pc",
        "category": "produce"
      }
    ],
    "veggie-shawarma-tofu": [
      {
        "name": "Tofu",
        "quantity": 200,
        "unit": "g",
        "category": "proteins"
      },
      {
        "name": "Pita Bread",
        "quantity": 1,
        "unit": "pc",
        "category": "breads"
      },
      {
        "name": "Cabbage",
        "quantity": 0.5,
        "unit": "cup",
        "category": "produce"
      },
      {
        "name": "Tomato",
        "quantity": 1,
        "unit": "pc",
        "category": "produce"
      },
      {
        "name": "Garlic",
        "quantity": 3,
        "unit": "cloves",
        "category": "produce"
      },
      {
        "name": "Lemon Juice",
        "quantity": 1,
        "unit": "tbsp",
        "category": "pantry"
      },
      {
        "name": "Cumin Powder",
        "quantity": 1,
        "unit": "tsp",
        "category": "spices"
      },
      {
        "name": "Red Chilli Powder",
        "quantity": 0.5,
        "unit": "tsp",
        "category": "spices"
      },
      {
        "name": "Olive Oil",
        "quantity": 1.5,
        "unit": "tbsp",
        "category": "pantry"
      },
      {
        "name": "Salt",
        "quantity": 0.5,
        "unit": "tsp",
        "category": "pantry"
      }
    ],
    "bean-stew-brown-rice": [
      {
        "name": "Mixed Beans",
        "quantity": 1,
        "unit": "cup",
        "category": "proteins"
      },
      {
        "name": "Brown Rice",
        "quantity": 0.5,
        "unit": "cup",
        "category": "grains"
      },
      {
        "name": "Tomato",
        "quantity": 2,
        "unit": "pc",
        "category": "produce"
      },
      {
        "name": "Onion",
        "quantity": 1,
        "unit": "pc",
        "category": "produce"
      },
      {
        "name": "Carrot",
        "quantity": 1,
        "unit": "pc",
        "category": "produce"
      },
      {
        "name": "Garlic",
        "quantity": 2,
        "unit": "cloves",
        "category": "produce"
      },
      {
        "name": "Cumin",
        "quantity": 1,
        "unit": "tsp",
        "category": "spices"
      },
      {
        "name": "Turmeric",
        "quantity": 0.5,
        "unit": "tsp",
        "category": "spices"
      },
      {
        "name": "Black Pepper",
        "quantity": 0.5,
        "unit": "tsp",
        "category": "spices"
      },
      {
        "name": "Salt",
        "quantity": 1,
        "unit": "tsp",
        "category": "pantry"
      },
      {
        "name": "Water",
        "quantity": 3,
        "unit": "cup",
        "category": "pantry"
      }
    ],
    "tofu-pasta": [
      {
        "name": "Pasta",
        "quantity": 200,
        "unit": "g",
        "category": "grains"
      },
      {
        "name": "Tofu",
        "quantity": 200,
        "unit": "g",
        "category": "proteins"
      },
      {
        "name": "Olive Oil",
        "quantity": 2,
        "unit": "tbsp",
        "category": "pantry"
      },
      {
        "name": "Onion",
        "quantity": 1,
        "unit": "pc",
        "category": "produce"
      },
      {
        "name": "Garlic",
        "quantity": 3,
        "unit": "cloves",
        "category": "produce"
      },
      {
        "name": "Tomato Passata",
        "quantity": 300,
        "unit": "g",
        "category": "pantry"
      },
      {
        "name": "Basil",
        "quantity": 0.25,
        "unit": "cup",
        "category": "produce"
      }
    ],
    "keto-pizza-bowl": [
      {
        "name": "Mozzarella",
        "quantity": 100,
        "unit": "g",
        "category": "dairy"
      },
      {
        "name": "Almond Flour",
        "quantity": 0.5,
        "unit": "cup",
        "category": "grains"
      },
      {
        "name": "Mixed Vegetables",
        "quantity": 1,
        "unit": "cup",
        "category": "produce"
      },
      {
        "name": "Tomato",
        "quantity": 1,
        "unit": "pc",
        "category": "produce"
      },
      {
        "name": "Oregano",
        "quantity": 0.5,
        "unit": "tsp",
        "category": "spices"
      },
      {
        "name": "Salt",
        "quantity": 0.5,
        "unit": "tsp",
        "category": "pantry"
      },
      {
        "name": "Olive Oil",
        "quantity": 1,
        "unit": "tbsp",
        "category": "pantry"
      }
    ],
    "english-muffin-pizzas": [
      {
        "name": "English Muffin",
        "quantity": 2,
        "unit": "pcs",
        "category": "breads"
      },
      {
        "name": "Mozzarella",
        "quantity": 2,
        "unit": "cups",
        "category": "dairy"
      },
      {
        "name": "Pizza Sauce",
        "quantity": 0.5,
        "unit": "cup",
        "category": "pantry"
      },
      {
        "name": "Paneer",
        "quantity": 100,
        "unit": "g",
        "category": "dairy"
      }
    ],
    "vegan-sushi-bowl": [
      {
        "name": "Rice",
        "quantity": 1,
        "unit": "cup",
        "category": "grains"
      },
      {
        "name": "Oil",
        "quantity": 2,
        "unit": "tbsp",
        "category": "pantry"
      },
      {
        "name": "Onion",
        "quantity": 1,
        "unit": "pc",
        "category": "produce"
      },
      {
        "name": "Salt",
        "quantity": 1,
        "unit": "tsp",
        "category": "pantry"
      },
      {
        "name": "Garam Masala",
        "quantity": 0.5,
        "unit": "tsp",
        "category": "spices"
      },
      {
        "name": "Coriander Leaves",
        "quantity": 0.25,
        "unit": "cup",
        "category": "produce"
      }
    ],
    "sourdough-grilled-cheese": [
      {
        "name": "Sourdough Bread",
        "quantity": 4,
        "unit": "slices",
        "category": "breads"
      },
      {
        "name": "Cheese",
        "quantity": 100,
        "unit": "g",
        "category": "dairy"
      },
      {
        "name": "Butter",
        "quantity": 1,
        "unit": "tbsp",
        "category": "dairy"
      }
    ],
    "high-protein-veggie-burgers": [
      {
        "name": "Black Beans",
        "quantity": 1,
        "unit": "cup",
        "category": "pantry"
      },
      {
        "name": "Oats",
        "quantity": 0.5,
        "unit": "cup",
        "category": "grains"
      },
      {
        "name": "Onion",
        "quantity": 0.5,
        "unit": "pc",
        "category": "produce"
      },
      {
        "name": "Garlic",
        "quantity": 2,
        "unit": "cloves",
        "category": "produce"
      },
      {
        "name": "Cumin Powder",
        "quantity": 1,
        "unit": "tsp",
        "category": "spices"
      },
      {
        "name": "Red Chilli Powder",
        "quantity": 0.5,
        "unit": "tsp",
        "category": "spices"
      },
      {
        "name": "Burger Bun",
        "quantity": 1,
        "unit": "pc",
        "category": "breads"
      },
      {
        "name": "Oil",
        "quantity": 1.5,
        "unit": "tbsp",
        "category": "pantry"
      },
      {
        "name": "Salt",
        "quantity": 0.5,
        "unit": "tsp",
        "category": "pantry"
      }
    ],
    "loaded-veggie-nachos": [
      {
        "name": "Nacho Chips",
        "quantity": 100,
        "unit": "g",
        "category": "snacks",
        "inStock": false
      },
      {
        "name": "Cheese",
        "quantity": 50,
        "unit": "g",
        "category": "dairy",
        "inStock": false
      },
      {
        "name": "Onions",
        "quantity": 0.5,
        "unit": "pc",
        "category": "produce",
        "inStock": false
      },
      {
        "name": "Capsicum",
        "quantity": 0.5,
        "unit": "pc",
        "category": "produce",
        "inStock": false
      },
      {
        "name": "Salsa",
        "quantity": 30,
        "unit": "g",
        "category": "pantry",
        "inStock": false
      },
      {
        "name": "Ghee",
        "quantity": 2,
        "unit": "tbsp",
        "category": "pantry",
        "inStock": false
      },
      {
        "name": "Oil",
        "quantity": 2,
        "unit": "tbsp",
        "category": "pantry",
        "inStock": false
      },
      {
        "name": "Spices",
        "quantity": 1,
        "unit": "packet",
        "category": "spices",
        "inStock": false
      },
      {
        "name": "Salt",
        "quantity": 1,
        "unit": "tsp",
        "category": "pantry"
      },
      {
        "name": "Turmeric",
        "quantity": 0.5,
        "unit": "tsp",
        "category": "spices"
      }
    ],
    "twice-baked-potatoes-broccoli-cheese": [
      {
        "name": "Potatoes",
        "quantity": 4,
        "unit": "pcs",
        "category": "produce"
      },
      {
        "name": "Broccoli",
        "quantity": 1,
        "unit": "cup",
        "category": "produce"
      },
      {
        "name": "Cheddar Cheese",
        "quantity": 0.5,
        "unit": "cup",
        "category": "dairy"
      },
      {
        "name": "Butter",
        "quantity": 2,
        "unit": "tbsp",
        "category": "dairy"
      },
      {
        "name": "Milk",
        "quantity": 0.25,
        "unit": "cup",
        "category": "dairy"
      },
      {
        "name": "Garlic",
        "quantity": 2,
        "unit": "cloves",
        "category": "produce"
      },
      {
        "name": "Salt",
        "quantity": 0.5,
        "unit": "tsp",
        "category": "pantry"
      },
      {
        "name": "Black Pepper",
        "quantity": 0.5,
        "unit": "tsp",
        "category": "spices"
      }
    ],
    "vegetarian-fajita-bowl": [
      {
        "name": "Rice",
        "quantity": 1,
        "unit": "cup",
        "category": "grains"
      },
      {
        "name": "Black Beans",
        "quantity": 1,
        "unit": "cup",
        "category": "pantry"
      },
      {
        "name": "Bell Peppers",
        "quantity": 2,
        "unit": "pcs",
        "category": "produce"
      },
      {
        "name": "Onion",
        "quantity": 1,
        "unit": "pc",
        "category": "produce"
      },
      {
        "name": "Corn",
        "quantity": 0.5,
        "unit": "cup",
        "category": "produce"
      },
      {
        "name": "Cheese",
        "quantity": 0.5,
        "unit": "cup",
        "category": "dairy"
      },
      {
        "name": "Sour Cream",
        "quantity": 2,
        "unit": "tbsp",
        "category": "dairy"
      },
      {
        "name": "Avocado",
        "quantity": 1,
        "unit": "pc",
        "category": "produce"
      },
      {
        "name": "Lime",
        "quantity": 1,
        "unit": "pc",
        "category": "produce"
      },
      {
        "name": "Cumin",
        "quantity": 1,
        "unit": "tsp",
        "category": "spices"
      },
      {
        "name": "Smoked Paprika",
        "quantity": 1,
        "unit": "tsp",
        "category": "spices"
      },
      {
        "name": "Salt",
        "quantity": 0.5,
        "unit": "tsp",
        "category": "pantry"
      },
      {
        "name": "Pepper",
        "quantity": 0.5,
        "unit": "tsp",
        "category": "spices"
      },
      {
        "name": "Oil",
        "quantity": 1,
        "unit": "tbsp",
        "category": "pantry"
      }
    ],
    "garlic-bread-grilled-cheese": [
      {
        "name": "White Bread",
        "quantity": 4,
        "unit": "slices",
        "category": "breads"
      },
      {
        "name": "Cheese",
        "quantity": 100,
        "unit": "g",
        "category": "dairy"
      },
      {
        "name": "Butter",
        "quantity": 2,
        "unit": "tbsp",
        "category": "dairy"
      },
      {
        "name": "Garlic",
        "quantity": 3,
        "unit": "cloves",
        "category": "produce"
      },
      {
        "name": "Oregano",
        "quantity": 0.5,
        "unit": "tsp",
        "category": "spices"
      }
    ],
    "red-lentil-dal": [
      {
        "name": "Red Lentils",
        "quantity": 150,
        "unit": "g",
        "category": "proteins"
      },
      {
        "name": "Onion",
        "quantity": 1,
        "unit": "pc",
        "category": "produce"
      },
      {
        "name": "Tomato",
        "quantity": 2,
        "unit": "pcs",
        "category": "produce"
      },
      {
        "name": "Garlic",
        "quantity": 3,
        "unit": "cloves",
        "category": "produce"
      },
      {
        "name": "Ginger",
        "quantity": 1,
        "unit": "inch",
        "category": "produce"
      },
      {
        "name": "Turmeric",
        "quantity": 0.5,
        "unit": "tsp",
        "category": "spices"
      },
      {
        "name": "Cumin Seeds",
        "quantity": 1,
        "unit": "tsp",
        "category": "spices"
      },
      {
        "name": "Oil",
        "quantity": 1,
        "unit": "tbsp",
        "category": "pantry"
      },
      {
        "name": "Mixed Dal",
        "quantity": 80,
        "unit": "g",
        "category": "proteins",
        "inStock": false
      }
    ],
    "veggie-spaghetti-sauce": [
      {
        "name": "Tomato",
        "quantity": 6,
        "unit": "pc",
        "category": "produce"
      },
      {
        "name": "Onion",
        "quantity": 1,
        "unit": "pc",
        "category": "produce"
      },
      {
        "name": "Garlic",
        "quantity": 4,
        "unit": "cloves",
        "category": "produce"
      },
      {
        "name": "Oregano",
        "quantity": 1,
        "unit": "tsp",
        "category": "spices"
      },
      {
        "name": "Basil",
        "quantity": 0.25,
        "unit": "cup",
        "category": "produce"
      },
      {
        "name": "Olive Oil",
        "quantity": 2,
        "unit": "tbsp",
        "category": "pantry"
      },
      {
        "name": "Salt",
        "quantity": 1,
        "unit": "tsp",
        "category": "pantry"
      },
      {
        "name": "Black Pepper",
        "quantity": 0.5,
        "unit": "tsp",
        "category": "spices"
      },
      {
        "name": "Pasta",
        "quantity": 200,
        "unit": "g",
        "category": "grains"
      }
    ],
    "nut-butter-banana-stackers": [
      {
        "name": "Banana",
        "quantity": 2,
        "unit": "pcs",
        "category": "produce"
      },
      {
        "name": "Peanut Butter",
        "quantity": 3,
        "unit": "tbsp",
        "category": "pantry"
      },
      {
        "name": "Bread",
        "quantity": 4,
        "unit": "slices",
        "category": "grains"
      },
      {
        "name": "Honey",
        "quantity": 1,
        "unit": "tbsp",
        "category": "pantry"
      },
      {
        "name": "Cinnamon",
        "quantity": 0.5,
        "unit": "tsp",
        "category": "spices"
      }
    ],
    "chana-masala": [
      {
        "name": "Chickpeas",
        "quantity": 1,
        "unit": "cup",
        "category": "proteins"
      },
      {
        "name": "Onion",
        "quantity": 1,
        "unit": "pc",
        "category": "produce"
      },
      {
        "name": "Tomato",
        "quantity": 2,
        "unit": "pcs",
        "category": "produce"
      },
      {
        "name": "Ginger-Garlic Paste",
        "quantity": 1,
        "unit": "tbsp",
        "category": "pantry"
      },
      {
        "name": "Amchur (Dry Mango Powder)",
        "quantity": 1,
        "unit": "tsp",
        "category": "spices"
      },
      {
        "name": "Dried Fenugreek Leaves (Kasuri Methi)",
        "quantity": 1,
        "unit": "tbsp",
        "category": "pantry"
      },
      {
        "name": "Garam Masala",
        "quantity": 0.5,
        "unit": "tsp",
        "category": "spices"
      },
      {
        "name": "Oil",
        "quantity": 1,
        "unit": "tbsp",
        "category": "pantry"
      },
      {
        "name": "Salt",
        "quantity": 1,
        "unit": "tsp",
        "category": "pantry"
      },
      {
        "name": "Coriander Leaves",
        "quantity": 0.25,
        "unit": "cup",
        "category": "produce"
      }
    ],
    "aubergine-curry": [
      {
        "name": "Eggplant",
        "quantity": 2,
        "unit": "pc",
        "category": "produce"
      },
      {
        "name": "Onion",
        "quantity": 1,
        "unit": "pc",
        "category": "produce"
      },
      {
        "name": "Tomato",
        "quantity": 2,
        "unit": "pcs",
        "category": "produce"
      },
      {
        "name": "Ginger-Garlic Paste",
        "quantity": 1,
        "unit": "tbsp",
        "category": "pantry"
      },
      {
        "name": "Turmeric",
        "quantity": 0.5,
        "unit": "tsp",
        "category": "spices"
      },
      {
        "name": "Red Chilli Powder",
        "quantity": 0.5,
        "unit": "tsp",
        "category": "spices"
      },
      {
        "name": "Coriander Powder",
        "quantity": 1,
        "unit": "tsp",
        "category": "spices"
      },
      {
        "name": "Oil",
        "quantity": 1,
        "unit": "tbsp",
        "category": "pantry"
      },
      {
        "name": "Salt",
        "quantity": 1,
        "unit": "tsp",
        "category": "pantry"
      },
      {
        "name": "Coriander Leaves",
        "quantity": 0.25,
        "unit": "cup",
        "category": "produce"
      },
      {
        "name": "Curry Leaves",
        "quantity": 1,
        "unit": "sprig",
        "category": "produce",
        "inStock": false
      }
    ],
    "raspberry-smoothie": [
      {
        "name": "Frozen Raspberries",
        "quantity": 1.5,
        "unit": "cup",
        "category": "produce"
      },
      {
        "name": "Banana",
        "quantity": 1,
        "unit": "pc",
        "category": "produce"
      },
      {
        "name": "Almond Milk",
        "quantity": 1,
        "unit": "cup",
        "category": "pantry"
      },
      {
        "name": "Chia Seeds",
        "quantity": 1,
        "unit": "tbsp",
        "category": "pantry"
      },
      {
        "name": "Maple Syrup",
        "quantity": 1,
        "unit": "tbsp",
        "category": "pantry"
      },
      {
        "name": "Ice Cubes",
        "quantity": 4,
        "unit": "pcs",
        "category": "pantry"
      },
      {
        "name": "Raspberry",
        "quantity": 1,
        "unit": "cup",
        "category": "produce",
        "inStock": false
      }
    ],
    "strawberry-juice": [
      {
        "name": "Strawberries",
        "quantity": 1.5,
        "unit": "cup",
        "category": "produce"
      },
      {
        "name": "Water",
        "quantity": 0.25,
        "unit": "cup",
        "category": "pantry"
      },
      {
        "name": "Sugar",
        "quantity": 1,
        "unit": "tbsp",
        "category": "pantry"
      },
      {
        "name": "Lemon Juice",
        "quantity": 0.5,
        "unit": "tsp",
        "category": "pantry"
      },
      {
        "name": "Ice Cubes",
        "quantity": 4,
        "unit": "pcs",
        "category": "pantry"
      },
      {
        "name": "Strawberry",
        "quantity": 1,
        "unit": "cup",
        "category": "produce",
        "inStock": false
      }
    ],
    "arugula-smoothie": [
      {
        "name": "Spinach",
        "quantity": 1,
        "unit": "cup",
        "category": "produce",
        "inStock": false
      },
      {
        "name": "Almond Milk",
        "quantity": 1,
        "unit": "cup",
        "category": "pantry",
        "inStock": false
      },
      {
        "name": "Ice",
        "quantity": 1,
        "unit": "cup",
        "category": "pantry",
        "inStock": false
      },
      {
        "name": "Honey",
        "quantity": 1,
        "unit": "tsp",
        "category": "pantry",
        "inStock": false
      },
      {
        "name": "Arugula",
        "quantity": 1,
        "unit": "cup",
        "category": "produce",
        "inStock": false
      }
    ],
    "banana-smoothie-bowl": [
      {
        "name": "Banana",
        "quantity": 1,
        "unit": "pc",
        "category": "produce",
        "inStock": false
      },
      {
        "name": "Almond Milk",
        "quantity": 1,
        "unit": "cup",
        "category": "pantry",
        "inStock": false
      },
      {
        "name": "Ice",
        "quantity": 1,
        "unit": "cup",
        "category": "pantry",
        "inStock": false
      },
      {
        "name": "Honey",
        "quantity": 1,
        "unit": "tsp",
        "category": "pantry",
        "inStock": false
      }
    ],
    "dragon-fruit-smoothie": [
      {
        "name": "Watermelon",
        "quantity": 200,
        "unit": "g",
        "category": "produce",
        "inStock": false
      },
      {
        "name": "Coconut",
        "quantity": 50,
        "unit": "g",
        "category": "produce",
        "inStock": false
      },
      {
        "name": "Ice",
        "quantity": 1,
        "unit": "cup",
        "category": "pantry",
        "inStock": false
      },
      {
        "name": "Dragon Fruit",
        "quantity": 1,
        "unit": "pc",
        "category": "produce",
        "inStock": false
      }
    ],
    "avocado-peanut-butter-smoothie": [
      {
        "name": "Avocado",
        "quantity": 1,
        "unit": "pc",
        "category": "produce"
      },
      {
        "name": "Peanut Butter",
        "quantity": 2,
        "unit": "tbsp",
        "category": "pantry"
      },
      {
        "name": "Almond Milk",
        "quantity": 1,
        "unit": "cup",
        "category": "pantry"
      },
      {
        "name": "Honey",
        "quantity": 1,
        "unit": "tbsp",
        "category": "pantry"
      },
      {
        "name": "Ice",
        "quantity": 1,
        "unit": "cup",
        "category": "pantry"
      }
    ],
    "green-smoothie": [
      {
        "name": "Spinach",
        "quantity": 1,
        "unit": "cup",
        "category": "produce",
        "inStock": false
      },
      {
        "name": "Almond Milk",
        "quantity": 1,
        "unit": "cup",
        "category": "pantry",
        "inStock": false
      },
      {
        "name": "Ice",
        "quantity": 1,
        "unit": "cup",
        "category": "pantry",
        "inStock": false
      },
      {
        "name": "Honey",
        "quantity": 1,
        "unit": "tsp",
        "category": "pantry",
        "inStock": false
      }
    ],
    "blueberry-banana-blast-smoothie": [
      {
        "name": "Banana",
        "quantity": 1,
        "unit": "pc",
        "category": "produce",
        "inStock": false
      },
      {
        "name": "Almond Milk",
        "quantity": 1,
        "unit": "cup",
        "category": "pantry",
        "inStock": false
      },
      {
        "name": "Ice",
        "quantity": 1,
        "unit": "cup",
        "category": "pantry",
        "inStock": false
      },
      {
        "name": "Honey",
        "quantity": 1,
        "unit": "tsp",
        "category": "pantry",
        "inStock": false
      },
      {
        "name": "Blueberry",
        "quantity": 1,
        "unit": "cup",
        "category": "produce",
        "inStock": false
      }
    ],
    "protein-coffee-smoothie": [
      {
        "name": "Coffee Powder",
        "quantity": 2,
        "unit": "tbsp",
        "category": "pantry",
        "inStock": false
      },
      {
        "name": "Almond Milk",
        "quantity": 1,
        "unit": "cup",
        "category": "pantry",
        "inStock": false
      },
      {
        "name": "Ice",
        "quantity": 1,
        "unit": "cup",
        "category": "pantry",
        "inStock": false
      },
      {
        "name": "Honey",
        "quantity": 1,
        "unit": "tsp",
        "category": "pantry",
        "inStock": false
      }
    ],
    "vegan-strawberry-milk": [
      {
        "name": "Strawberries",
        "quantity": 1,
        "unit": "cup",
        "category": "produce"
      },
      {
        "name": "Almond Milk",
        "quantity": 1.5,
        "unit": "cup",
        "category": "pantry"
      },
      {
        "name": "Sugar",
        "quantity": 1,
        "unit": "tbsp",
        "category": "pantry"
      },
      {
        "name": "Vanilla Extract",
        "quantity": 0.5,
        "unit": "tsp",
        "category": "pantry"
      },
      {
        "name": "Ice Cubes",
        "quantity": 4,
        "unit": "pcs",
        "category": "pantry"
      },
      {
        "name": "Strawberry",
        "quantity": 1,
        "unit": "cup",
        "category": "produce",
        "inStock": false
      }
    ],
    "vegan-smoothie-bowl": [
      {
        "name": "Frozen Raspberries",
        "quantity": 1,
        "unit": "cup",
        "category": "produce"
      },
      {
        "name": "Banana",
        "quantity": 1,
        "unit": "pc",
        "category": "produce"
      },
      {
        "name": "Almond Milk",
        "quantity": 0.5,
        "unit": "cup",
        "category": "pantry"
      },
      {
        "name": "Granola",
        "quantity": 0.25,
        "unit": "cup",
        "category": "grains"
      },
      {
        "name": "Chia Seeds",
        "quantity": 1,
        "unit": "tbsp",
        "category": "pantry"
      },
      {
        "name": "Maple Syrup",
        "quantity": 1,
        "unit": "tbsp",
        "category": "pantry"
      }
    ],
    "mango-pineapple-banana-smoothie": [
      {
        "name": "Mango",
        "quantity": 1,
        "unit": "pc",
        "category": "produce",
        "inStock": false
      },
      {
        "name": "Almond Milk",
        "quantity": 1,
        "unit": "cup",
        "category": "pantry",
        "inStock": false
      },
      {
        "name": "Ice",
        "quantity": 1,
        "unit": "cup",
        "category": "pantry",
        "inStock": false
      },
      {
        "name": "Honey",
        "quantity": 1,
        "unit": "tsp",
        "category": "pantry",
        "inStock": false
      },
      {
        "name": "Banana",
        "quantity": 1,
        "unit": "pc",
        "category": "produce",
        "inStock": false
      },
      {
        "name": "Pineapple",
        "quantity": 1,
        "unit": "cup",
        "category": "produce",
        "inStock": false
      }
    ],
    "strawberry-smoothie-bowl": [
      {
        "name": "Strawberries",
        "quantity": 1.5,
        "unit": "cup",
        "category": "produce"
      },
      {
        "name": "Banana",
        "quantity": 1,
        "unit": "pc",
        "category": "produce"
      },
      {
        "name": "Almond Milk",
        "quantity": 0.5,
        "unit": "cup",
        "category": "pantry"
      },
      {
        "name": "Granola",
        "quantity": 0.25,
        "unit": "cup",
        "category": "grains"
      },
      {
        "name": "Chia Seeds",
        "quantity": 1,
        "unit": "tbsp",
        "category": "pantry"
      },
      {
        "name": "Strawberry",
        "quantity": 1,
        "unit": "cup",
        "category": "produce",
        "inStock": false
      }
    ],
    "pea-protein-smoothie": [
      {
        "name": "Spinach",
        "quantity": 1,
        "unit": "cup",
        "category": "produce"
      },
      {
        "name": "Strawberries",
        "quantity": 1,
        "unit": "cup",
        "category": "produce"
      },
      {
        "name": "Banana",
        "quantity": 1,
        "unit": "pc",
        "category": "produce"
      },
      {
        "name": "Pea Protein Powder",
        "quantity": 2,
        "unit": "tbsp",
        "category": "pantry"
      },
      {
        "name": "Almond Milk",
        "quantity": 1.5,
        "unit": "cup",
        "category": "pantry"
      },
      {
        "name": "Ice",
        "quantity": 1,
        "unit": "cup",
        "category": "pantry"
      },
      {
        "name": "Green Peas",
        "quantity": 100,
        "unit": "g",
        "category": "produce",
        "inStock": false
      }
    ],
    "honeydew-milk-tea": [
      {
        "name": "Honeydew",
        "quantity": 0.5,
        "unit": "cup",
        "category": "produce"
      },
      {
        "name": "Milk",
        "quantity": 1,
        "unit": "cup",
        "category": "dairy"
      },
      {
        "name": "Tea",
        "quantity": 1,
        "unit": "tsp",
        "category": "pantry"
      },
      {
        "name": "Tapioca Pearls",
        "quantity": 0.25,
        "unit": "cup",
        "category": "pantry"
      },
      {
        "name": "Sugar",
        "quantity": 1,
        "unit": "tbsp",
        "category": "pantry"
      },
      {
        "name": "Ice",
        "quantity": 1,
        "unit": "cup",
        "category": "pantry"
      }
    ],
    "wintermelon-milk-tea": [
      {
        "name": "Wintermelon",
        "quantity": 0.5,
        "unit": "cup",
        "category": "produce"
      },
      {
        "name": "Milk",
        "quantity": 1,
        "unit": "cup",
        "category": "dairy"
      },
      {
        "name": "Tea",
        "quantity": 1,
        "unit": "tsp",
        "category": "pantry"
      },
      {
        "name": "Tapioca Pearls",
        "quantity": 0.25,
        "unit": "cup",
        "category": "pantry"
      },
      {
        "name": "Sugar",
        "quantity": 1,
        "unit": "tbsp",
        "category": "pantry"
      },
      {
        "name": "Ice",
        "quantity": 1,
        "unit": "cup",
        "category": "pantry"
      }
    ],
    "chocolate-milk-tea": [
      {
        "name": "Milk",
        "quantity": 1,
        "unit": "cup",
        "category": "dairy"
      },
      {
        "name": "Tea",
        "quantity": 1,
        "unit": "tsp",
        "category": "pantry"
      },
      {
        "name": "Chocolate Syrup",
        "quantity": 2,
        "unit": "tbsp",
        "category": "pantry"
      },
      {
        "name": "Tapioca Pearls",
        "quantity": 0.25,
        "unit": "cup",
        "category": "pantry"
      },
      {
        "name": "Ice",
        "quantity": 1,
        "unit": "cup",
        "category": "pantry"
      }
    ],
    "peach-milk": [
      {
        "name": "Peach",
        "quantity": 2,
        "unit": "pc",
        "category": "produce"
      },
      {
        "name": "Almond Milk",
        "quantity": 1.5,
        "unit": "cup",
        "category": "pantry"
      },
      {
        "name": "Sugar",
        "quantity": 1,
        "unit": "tbsp",
        "category": "pantry"
      },
      {
        "name": "Vanilla Extract",
        "quantity": 0.5,
        "unit": "tsp",
        "category": "pantry"
      },
      {
        "name": "Ice Cubes",
        "quantity": 4,
        "unit": "pcs",
        "category": "pantry"
      }
    ],
    "coconut-milkshake": [
      {
        "name": "Milk",
        "quantity": 1,
        "unit": "cup",
        "category": "dairy"
      },
      {
        "name": "Coconut Milk",
        "quantity": 0.5,
        "unit": "cup",
        "category": "pantry"
      },
      {
        "name": "Sugar",
        "quantity": 1,
        "unit": "tbsp",
        "category": "pantry"
      },
      {
        "name": "Ice Cubes",
        "quantity": 4,
        "unit": "pcs",
        "category": "pantry"
      },
      {
        "name": "Vanilla Extract",
        "quantity": 0.5,
        "unit": "tsp",
        "category": "pantry"
      }
    ],
    "peanut-butter-cup-milkshake": [
      {
        "name": "Peanut Butter",
        "quantity": 3,
        "unit": "tbsp",
        "category": "pantry"
      },
      {
        "name": "Banana",
        "quantity": 1,
        "unit": "pc",
        "category": "produce"
      },
      {
        "name": "Almond Milk",
        "quantity": 1,
        "unit": "cup",
        "category": "pantry"
      },
      {
        "name": "Cocoa Powder",
        "quantity": 1,
        "unit": "tbsp",
        "category": "pantry"
      },
      {
        "name": "Ice",
        "quantity": 1,
        "unit": "cup",
        "category": "pantry"
      }
    ],
    "oat-milk-hot-chocolate": [
      {
        "name": "Oat Milk",
        "quantity": 1,
        "unit": "cup",
        "category": "pantry"
      },
      {
        "name": "Cocoa Powder",
        "quantity": 2,
        "unit": "tbsp",
        "category": "spices"
      },
      {
        "name": "Sugar",
        "quantity": 1,
        "unit": "tbsp",
        "category": "pantry"
      },
      {
        "name": "Vanilla Extract",
        "quantity": 0.5,
        "unit": "tsp",
        "category": "pantry"
      }
    ],
    "healthy-hot-chocolate": [
      {
        "name": "Milk",
        "quantity": 1,
        "unit": "cup",
        "category": "dairy"
      },
      {
        "name": "Cocoa Powder",
        "quantity": 2,
        "unit": "tbsp",
        "category": "spices"
      },
      {
        "name": "Sugar",
        "quantity": 1,
        "unit": "tbsp",
        "category": "pantry"
      },
      {
        "name": "Vanilla Extract",
        "quantity": 0.5,
        "unit": "tsp",
        "category": "pantry"
      },
      {
        "name": "Dark Chocolate",
        "quantity": 1,
        "unit": "oz",
        "category": "pantry"
      }
    ],
    "healthy-pumpkin-smoothie": [
      {
        "name": "Almond Milk",
        "quantity": 1,
        "unit": "cup",
        "category": "pantry",
        "inStock": false
      },
      {
        "name": "Ice",
        "quantity": 1,
        "unit": "cup",
        "category": "pantry",
        "inStock": false
      },
      {
        "name": "Honey",
        "quantity": 1,
        "unit": "tsp",
        "category": "pantry",
        "inStock": false
      },
      {
        "name": "Pumpkin",
        "quantity": 1,
        "unit": "cup",
        "category": "produce",
        "inStock": false
      }
    ],
    "masala-oats": [
      {
        "name": "Oats",
        "quantity": 100,
        "unit": "g",
        "category": "grains"
      },
      {
        "name": "Onion",
        "quantity": 1,
        "unit": "pc",
        "category": "produce"
      },
      {
        "name": "Tomato",
        "quantity": 1,
        "unit": "pc",
        "category": "produce"
      },
      {
        "name": "Green Chilli",
        "quantity": 1,
        "unit": "pc",
        "category": "produce"
      },
      {
        "name": "Mustard Seeds",
        "quantity": 0.5,
        "unit": "tsp",
        "category": "spices"
      },
      {
        "name": "Curry Leaves",
        "quantity": 1,
        "unit": "sprig",
        "category": "produce"
      },
      {
        "name": "Turmeric",
        "quantity": 0.25,
        "unit": "tsp",
        "category": "spices"
      },
      {
        "name": "Oil",
        "quantity": 1,
        "unit": "tbsp",
        "category": "pantry"
      },
      {
        "name": "Salt",
        "quantity": 0.5,
        "unit": "tsp",
        "category": "pantry"
      },
      {
        "name": "Coriander Leaves",
        "quantity": 0.25,
        "unit": "cup",
        "category": "produce"
      }
    ],
    "cherry-almond-chocolate-cookies": [
      {
        "name": "All-Purpose Flour",
        "quantity": 1.5,
        "unit": "cup",
        "category": "grains"
      },
      {
        "name": "Sugar",
        "quantity": 0.5,
        "unit": "cup",
        "category": "pantry"
      },
      {
        "name": "Butter",
        "quantity": 0.33,
        "unit": "cup",
        "category": "dairy"
      },
      {
        "name": "Eggs",
        "quantity": 1,
        "unit": "pc",
        "category": "proteins"
      },
      {
        "name": "Oats",
        "quantity": 1,
        "unit": "cup",
        "category": "grains"
      },
      {
        "name": "Chocolate Chips",
        "quantity": 0.5,
        "unit": "cup",
        "category": "pantry"
      },
      {
        "name": "Almonds",
        "quantity": 0.25,
        "unit": "cup",
        "category": "pantry"
      },
      {
        "name": "Dried Cherries",
        "quantity": 0.25,
        "unit": "cup",
        "category": "pantry"
      },
      {
        "name": "Baking Soda",
        "quantity": 0.5,
        "unit": "tsp",
        "category": "pantry"
      },
      {
        "name": "Salt",
        "quantity": 0.25,
        "unit": "tsp",
        "category": "pantry"
      }
    ],
    "birthday-cake-muffins": [
      {
        "name": "Flour",
        "quantity": 1.5,
        "unit": "cup",
        "category": "grains"
      },
      {
        "name": "Sugar",
        "quantity": 0.5,
        "unit": "cup",
        "category": "pantry"
      },
      {
        "name": "Butter",
        "quantity": 0.33,
        "unit": "cup",
        "category": "dairy"
      },
      {
        "name": "Eggs",
        "quantity": 1,
        "unit": "pc",
        "category": "proteins"
      },
      {
        "name": "Milk",
        "quantity": 0.5,
        "unit": "cup",
        "category": "dairy"
      },
      {
        "name": "Baking Powder",
        "quantity": 1.5,
        "unit": "tsp",
        "category": "pantry"
      },
      {
        "name": "Vanilla Extract",
        "quantity": 1,
        "unit": "tsp",
        "category": "pantry"
      },
      {
        "name": "Sprinkles",
        "quantity": 2,
        "unit": "tbsp",
        "category": "pantry"
      }
    ],
    "vegan-mug-cake": [
      {
        "name": "Flour",
        "quantity": 0.25,
        "unit": "cup",
        "category": "grains"
      },
      {
        "name": "Cocoa Powder",
        "quantity": 2,
        "unit": "tbsp",
        "category": "spices"
      },
      {
        "name": "Sugar",
        "quantity": 3,
        "unit": "tbsp",
        "category": "pantry"
      },
      {
        "name": "Baking Powder",
        "quantity": 0.25,
        "unit": "tsp",
        "category": "pantry"
      },
      {
        "name": "Almond Milk",
        "quantity": 3,
        "unit": "tbsp",
        "category": "pantry"
      },
      {
        "name": "Oil",
        "quantity": 1,
        "unit": "tbsp",
        "category": "pantry"
      },
      {
        "name": "Vanilla Extract",
        "quantity": 0.25,
        "unit": "tsp",
        "category": "pantry"
      }
    ],
    "strawberry-blueberry-pie": [
      {
        "name": "Flour",
        "quantity": 1.5,
        "unit": "cup",
        "category": "grains"
      },
      {
        "name": "Butter",
        "quantity": 0.5,
        "unit": "cup",
        "category": "dairy"
      },
      {
        "name": "Sugar",
        "quantity": 0.5,
        "unit": "cup",
        "category": "pantry"
      },
      {
        "name": "Strawberries",
        "quantity": 1,
        "unit": "cup",
        "category": "produce"
      },
      {
        "name": "Blueberries",
        "quantity": 1,
        "unit": "cup",
        "category": "produce"
      },
      {
        "name": "Lemon Juice",
        "quantity": 1,
        "unit": "tbsp",
        "category": "pantry"
      },
      {
        "name": "Cornstarch",
        "quantity": 2,
        "unit": "tbsp",
        "category": "pantry"
      },
      {
        "name": "Salt",
        "quantity": 0.25,
        "unit": "tsp",
        "category": "pantry"
      }
    ],
    "eggless-brownies": [
      {
        "name": "Maida",
        "quantity": 1,
        "unit": "cup",
        "category": "grains"
      },
      {
        "name": "Cocoa Powder",
        "quantity": 0.5,
        "unit": "cup",
        "category": "pantry"
      },
      {
        "name": "Sugar",
        "quantity": 0.75,
        "unit": "cup",
        "category": "pantry"
      },
      {
        "name": "Oil",
        "quantity": 0.5,
        "unit": "cup",
        "category": "pantry"
      },
      {
        "name": "Baking Powder",
        "quantity": 1,
        "unit": "tsp",
        "category": "pantry"
      },
      {
        "name": "Vanilla Extract",
        "quantity": 1,
        "unit": "tsp",
        "category": "pantry"
      },
      {
        "name": "Salt",
        "quantity": 0.25,
        "unit": "tsp",
        "category": "pantry"
      }
    ],
    "strawberry-cheesecake-cookies": [
      {
        "name": "Flour",
        "quantity": 1.5,
        "unit": "cup",
        "category": "grains"
      },
      {
        "name": "Sugar",
        "quantity": 0.5,
        "unit": "cup",
        "category": "pantry"
      },
      {
        "name": "Butter",
        "quantity": 0.33,
        "unit": "cup",
        "category": "dairy"
      },
      {
        "name": "Cream Cheese",
        "quantity": 0.25,
        "unit": "cup",
        "category": "dairy"
      },
      {
        "name": "Strawberries",
        "quantity": 0.5,
        "unit": "cup",
        "category": "produce"
      },
      {
        "name": "Vanilla Extract",
        "quantity": 1,
        "unit": "tsp",
        "category": "pantry"
      },
      {
        "name": "Baking Soda",
        "quantity": 0.5,
        "unit": "tsp",
        "category": "pantry"
      },
      {
        "name": "Salt",
        "quantity": 0.25,
        "unit": "tsp",
        "category": "pantry"
      }
    ],
    "vegan-lemon-cupcakes": [
      {
        "name": "Flour",
        "quantity": 1.5,
        "unit": "cup",
        "category": "grains"
      },
      {
        "name": "Sugar",
        "quantity": 0.75,
        "unit": "cup",
        "category": "pantry"
      },
      {
        "name": "Coconut Oil",
        "quantity": 0.33,
        "unit": "cup",
        "category": "pantry"
      },
      {
        "name": "Almond Milk",
        "quantity": 0.75,
        "unit": "cup",
        "category": "pantry"
      },
      {
        "name": "Lemon Juice",
        "quantity": 2,
        "unit": "tbsp",
        "category": "pantry"
      },
      {
        "name": "Lemon Zest",
        "quantity": 1,
        "unit": "tsp",
        "category": "produce"
      },
      {
        "name": "Baking Powder",
        "quantity": 1.5,
        "unit": "tsp",
        "category": "pantry"
      },
      {
        "name": "Vanilla Extract",
        "quantity": 1,
        "unit": "tsp",
        "category": "pantry"
      }
    ],
    "vegan-pineapple-upside-down-cake": [
      {
        "name": "Flour",
        "quantity": 1.5,
        "unit": "cup",
        "category": "grains"
      },
      {
        "name": "Sugar",
        "quantity": 0.75,
        "unit": "cup",
        "category": "pantry"
      },
      {
        "name": "Coconut Oil",
        "quantity": 0.33,
        "unit": "cup",
        "category": "pantry"
      },
      {
        "name": "Almond Milk",
        "quantity": 0.75,
        "unit": "cup",
        "category": "pantry"
      },
      {
        "name": "Pineapple",
        "quantity": 1,
        "unit": "cup",
        "category": "produce"
      },
      {
        "name": "Baking Powder",
        "quantity": 1.5,
        "unit": "tsp",
        "category": "pantry"
      },
      {
        "name": "Vanilla Extract",
        "quantity": 1,
        "unit": "tsp",
        "category": "pantry"
      }
    ],
    "vegan-carrot-cake-cupcakes": [
      {
        "name": "Flour",
        "quantity": 1.5,
        "unit": "cup",
        "category": "grains"
      },
      {
        "name": "Sugar",
        "quantity": 0.75,
        "unit": "cup",
        "category": "pantry"
      },
      {
        "name": "Coconut Oil",
        "quantity": 0.33,
        "unit": "cup",
        "category": "pantry"
      },
      {
        "name": "Almond Milk",
        "quantity": 0.75,
        "unit": "cup",
        "category": "pantry"
      },
      {
        "name": "Carrot",
        "quantity": 1,
        "unit": "cup",
        "category": "produce"
      },
      {
        "name": "Baking Powder",
        "quantity": 1.5,
        "unit": "tsp",
        "category": "pantry"
      },
      {
        "name": "Cinnamon",
        "quantity": 1,
        "unit": "tsp",
        "category": "spices"
      },
      {
        "name": "Vanilla Extract",
        "quantity": 1,
        "unit": "tsp",
        "category": "pantry"
      }
    ],
    "almond-flour-peanut-butter-cookies": [
      {
        "name": "Almond Flour",
        "quantity": 1.5,
        "unit": "cup",
        "category": "grains"
      },
      {
        "name": "Peanut Butter",
        "quantity": 0.75,
        "unit": "cup",
        "category": "pantry"
      },
      {
        "name": "Sugar",
        "quantity": 0.5,
        "unit": "cup",
        "category": "pantry"
      },
      {
        "name": "Butter",
        "quantity": 0.25,
        "unit": "cup",
        "category": "dairy"
      },
      {
        "name": "Eggs",
        "quantity": 1,
        "unit": "pc",
        "category": "proteins"
      },
      {
        "name": "Vanilla Extract",
        "quantity": 1,
        "unit": "tsp",
        "category": "pantry"
      },
      {
        "name": "Baking Soda",
        "quantity": 0.5,
        "unit": "tsp",
        "category": "pantry"
      },
      {
        "name": "Salt",
        "quantity": 0.25,
        "unit": "tsp",
        "category": "pantry"
      }
    ],
    "chocolate-donuts": [
      {
        "name": "Flour",
        "quantity": 1.5,
        "unit": "cup",
        "category": "grains"
      },
      {
        "name": "Cocoa Powder",
        "quantity": 0.33,
        "unit": "cup",
        "category": "spices"
      },
      {
        "name": "Sugar",
        "quantity": 0.5,
        "unit": "cup",
        "category": "pantry"
      },
      {
        "name": "Almond Milk",
        "quantity": 0.5,
        "unit": "cup",
        "category": "pantry"
      },
      {
        "name": "Oil",
        "quantity": 0.25,
        "unit": "cup",
        "category": "pantry"
      },
      {
        "name": "Baking Powder",
        "quantity": 1,
        "unit": "tsp",
        "category": "pantry"
      },
      {
        "name": "Vanilla Extract",
        "quantity": 1,
        "unit": "tsp",
        "category": "pantry"
      }
    ],
    "biscoff-donuts": [
      {
        "name": "Wheat Flour",
        "quantity": 2,
        "unit": "cups",
        "category": "grains"
      },
      {
        "name": "Biscoff Spread",
        "quantity": 0.5,
        "unit": "cup",
        "category": "pantry"
      },
      {
        "name": "Sugar",
        "quantity": 0.5,
        "unit": "cup",
        "category": "pantry"
      },
      {
        "name": "Butter",
        "quantity": 0.25,
        "unit": "cup",
        "category": "dairy"
      }
    ],
    "strawberry-donuts": [
      {
        "name": "Flour",
        "quantity": 1.5,
        "unit": "cup",
        "category": "grains"
      },
      {
        "name": "Sugar",
        "quantity": 0.5,
        "unit": "cup",
        "category": "pantry"
      },
      {
        "name": "Butter",
        "quantity": 0.25,
        "unit": "cup",
        "category": "dairy"
      },
      {
        "name": "Milk",
        "quantity": 0.5,
        "unit": "cup",
        "category": "dairy"
      },
      {
        "name": "Eggs",
        "quantity": 1,
        "unit": "pc",
        "category": "proteins"
      },
      {
        "name": "Strawberries",
        "quantity": 0.5,
        "unit": "cup",
        "category": "produce"
      },
      {
        "name": "Baking Powder",
        "quantity": 1,
        "unit": "tsp",
        "category": "pantry"
      },
      {
        "name": "Vanilla Extract",
        "quantity": 1,
        "unit": "tsp",
        "category": "pantry"
      }
    ],
    "tres-leches-cake-gluten-free": [
      {
        "name": "Almond Flour",
        "quantity": 1.5,
        "unit": "cup",
        "category": "grains"
      },
      {
        "name": "Sugar",
        "quantity": 0.75,
        "unit": "cup",
        "category": "pantry"
      },
      {
        "name": "Eggs",
        "quantity": 3,
        "unit": "pcs",
        "category": "proteins"
      },
      {
        "name": "Milk",
        "quantity": 1,
        "unit": "cup",
        "category": "dairy"
      },
      {
        "name": "Evaporated Milk",
        "quantity": 1,
        "unit": "cup",
        "category": "dairy"
      },
      {
        "name": "Sweetened Condensed Milk",
        "quantity": 1,
        "unit": "cup",
        "category": "dairy"
      },
      {
        "name": "Vanilla Extract",
        "quantity": 1,
        "unit": "tsp",
        "category": "pantry"
      },
      {
        "name": "Baking Powder",
        "quantity": 1.5,
        "unit": "tsp",
        "category": "pantry"
      }
    ],
    "flourless-gluten-free-brownies": [
      {
        "name": "Black Beans",
        "quantity": 1,
        "unit": "cup",
        "category": "pantry"
      },
      {
        "name": "Cocoa Powder",
        "quantity": 0.5,
        "unit": "cup",
        "category": "spices"
      },
      {
        "name": "Sugar",
        "quantity": 0.75,
        "unit": "cup",
        "category": "pantry"
      },
      {
        "name": "Eggs",
        "quantity": 2,
        "unit": "pcs",
        "category": "proteins"
      },
      {
        "name": "Coconut Oil",
        "quantity": 0.25,
        "unit": "cup",
        "category": "pantry"
      },
      {
        "name": "Vanilla Extract",
        "quantity": 1,
        "unit": "tsp",
        "category": "pantry"
      },
      {
        "name": "Baking Powder",
        "quantity": 0.5,
        "unit": "tsp",
        "category": "pantry"
      }
    ],
    "strawberry-yogurt": [
      {
        "name": "Strawberries",
        "quantity": 1,
        "unit": "cup",
        "category": "produce"
      },
      {
        "name": "Yogurt",
        "quantity": 1,
        "unit": "cup",
        "category": "dairy"
      },
      {
        "name": "Honey",
        "quantity": 1,
        "unit": "tbsp",
        "category": "pantry"
      },
      {
        "name": "Vanilla Extract",
        "quantity": 0.5,
        "unit": "tsp",
        "category": "pantry"
      }
    ],
    "protein-powder-mug-cake": [
      {
        "name": "Protein Powder",
        "quantity": 1,
        "unit": "scoop",
        "category": "pantry"
      },
      {
        "name": "Flour",
        "quantity": 0.25,
        "unit": "cup",
        "category": "grains"
      },
      {
        "name": "Cocoa Powder",
        "quantity": 1,
        "unit": "tbsp",
        "category": "spices"
      },
      {
        "name": "Baking Powder",
        "quantity": 0.25,
        "unit": "tsp",
        "category": "pantry"
      },
      {
        "name": "Milk",
        "quantity": 3,
        "unit": "tbsp",
        "category": "dairy"
      },
      {
        "name": "Oil",
        "quantity": 1,
        "unit": "tbsp",
        "category": "pantry"
      }
    ],
    "vegan-vanilla-pudding": [
      {
        "name": "Almond Milk",
        "quantity": 1,
        "unit": "cup",
        "category": "pantry"
      },
      {
        "name": "Cornstarch",
        "quantity": 2,
        "unit": "tbsp",
        "category": "pantry"
      },
      {
        "name": "Sugar",
        "quantity": 2,
        "unit": "tbsp",
        "category": "pantry"
      },
      {
        "name": "Vanilla Extract",
        "quantity": 1,
        "unit": "tsp",
        "category": "pantry"
      },
      {
        "name": "Coconut Milk",
        "quantity": 0.5,
        "unit": "cup",
        "category": "pantry"
      }
    ],
    "grilled-pineapple": [
      {
        "name": "Pineapple",
        "quantity": 1,
        "unit": "pc",
        "category": "produce"
      },
      {
        "name": "Honey",
        "quantity": 1,
        "unit": "tbsp",
        "category": "pantry"
      },
      {
        "name": "Cinnamon",
        "quantity": 0.5,
        "unit": "tsp",
        "category": "spices"
      }
    ],
    "vegan-peanut-butter-cups": [
      {
        "name": "Peanut Butter",
        "quantity": 0.5,
        "unit": "cup",
        "category": "pantry"
      },
      {
        "name": "Cocoa Powder",
        "quantity": 0.25,
        "unit": "cup",
        "category": "spices"
      },
      {
        "name": "Coconut Oil",
        "quantity": 3,
        "unit": "tbsp",
        "category": "pantry"
      },
      {
        "name": "Maple Syrup",
        "quantity": 3,
        "unit": "tbsp",
        "category": "pantry"
      }
    ],
    "vegan-apple-muffins": [
      {
        "name": "Flour",
        "quantity": 1.5,
        "unit": "cup",
        "category": "grains"
      },
      {
        "name": "Apple",
        "quantity": 1,
        "unit": "pc",
        "category": "produce"
      },
      {
        "name": "Sugar",
        "quantity": 0.5,
        "unit": "cup",
        "category": "pantry"
      },
      {
        "name": "Oil",
        "quantity": 0.33,
        "unit": "cup",
        "category": "pantry"
      },
      {
        "name": "Baking Powder",
        "quantity": 1.5,
        "unit": "tsp",
        "category": "pantry"
      },
      {
        "name": "Cinnamon",
        "quantity": 1,
        "unit": "tsp",
        "category": "spices"
      }
    ],
    "mango-nice-cream": [
      {
        "name": "Mango",
        "quantity": 2,
        "unit": "cup",
        "category": "produce"
      },
      {
        "name": "Coconut Milk",
        "quantity": 0.25,
        "unit": "cup",
        "category": "pantry"
      },
      {
        "name": "Maple Syrup",
        "quantity": 1,
        "unit": "tbsp",
        "category": "pantry"
      }
    ],
    "vegan-fruit-cake": [
      {
        "name": "Flour",
        "quantity": 1.5,
        "unit": "cup",
        "category": "grains"
      },
      {
        "name": "Mixed Dry Fruits",
        "quantity": 1,
        "unit": "cup",
        "category": "pantry"
      },
      {
        "name": "Sugar",
        "quantity": 0.5,
        "unit": "cup",
        "category": "pantry"
      },
      {
        "name": "Oil",
        "quantity": 0.33,
        "unit": "cup",
        "category": "pantry"
      },
      {
        "name": "Baking Powder",
        "quantity": 1,
        "unit": "tsp",
        "category": "pantry"
      },
      {
        "name": "Cinnamon",
        "quantity": 0.5,
        "unit": "tsp",
        "category": "spices"
      }
    ],
    "banana-pudding-lasagna": [
      {
        "name": "Banana",
        "quantity": 3,
        "unit": "pcs",
        "category": "produce"
      },
      {
        "name": "Vanilla Wafers",
        "quantity": 1,
        "unit": "cup",
        "category": "pantry"
      },
      {
        "name": "Milk",
        "quantity": 1,
        "unit": "cup",
        "category": "dairy"
      },
      {
        "name": "Vanilla Pudding",
        "quantity": 1,
        "unit": "box",
        "category": "pantry"
      },
      {
        "name": "Whipped Cream",
        "quantity": 0.5,
        "unit": "cup",
        "category": "dairy"
      },
      {
        "name": "Sugar",
        "quantity": 2,
        "unit": "tbsp",
        "category": "pantry"
      }
    ],
    "gujarati-dal": [
      {
        "name": "Mixed Dal",
        "quantity": 80,
        "unit": "g",
        "category": "proteins",
        "inStock": false
      },
      {
        "name": "Oil",
        "quantity": 2,
        "unit": "tbsp",
        "category": "pantry",
        "inStock": false
      },
      {
        "name": "Spices",
        "quantity": 1,
        "unit": "packet",
        "category": "spices",
        "inStock": false
      },
      {
        "name": "Toor Dal",
        "quantity": 1,
        "unit": "cup",
        "category": "grains",
        "inStock": false
      },
      {
        "name": "Cumin Seeds",
        "quantity": 1,
        "unit": "tsp",
        "category": "spices"
      },
      {
        "name": "Sugar",
        "quantity": 0.5,
        "unit": "cup",
        "category": "pantry"
      },
      {
        "name": "Cardamom",
        "quantity": 2,
        "unit": "pods",
        "category": "spices"
      },
      {
        "name": "Raisins",
        "quantity": 2,
        "unit": "tbsp",
        "category": "pantry"
      },
      {
        "name": "Almonds",
        "quantity": 2,
        "unit": "tbsp",
        "category": "pantry"
      },
      {
        "name": "Pistachios",
        "quantity": 1,
        "unit": "tbsp",
        "category": "pantry"
      }
    ],
    "mixed-vegetable-curry": [
      {
        "name": "Mixed Vegetables",
        "quantity": 1,
        "unit": "cup",
        "category": "produce",
        "inStock": false
      },
      {
        "name": "Curry Leaves",
        "quantity": 1,
        "unit": "sprig",
        "category": "produce",
        "inStock": false
      },
      {
        "name": "Oil",
        "quantity": 2,
        "unit": "tbsp",
        "category": "pantry",
        "inStock": false
      },
      {
        "name": "Spices",
        "quantity": 1,
        "unit": "packet",
        "category": "spices",
        "inStock": false
      },
      {
        "name": "Rice",
        "quantity": 1,
        "unit": "cup",
        "category": "grains",
        "inStock": false
      },
      {
        "name": "Onion",
        "quantity": 1,
        "unit": "pc",
        "category": "produce",
        "inStock": false
      },
      {
        "name": "Tomato",
        "quantity": 2,
        "unit": "pc",
        "category": "produce",
        "inStock": false
      },
      {
        "name": "Green Chilli",
        "quantity": 2,
        "unit": "pc",
        "category": "produce",
        "inStock": false
      },
      {
        "name": "Ginger-Garlic Paste",
        "quantity": 1,
        "unit": "tbsp",
        "category": "produce",
        "inStock": false
      },
      {
        "name": "Coriander Leaves",
        "quantity": 0.25,
        "unit": "cup",
        "category": "produce",
        "inStock": false
      },
      {
        "name": "Salt",
        "quantity": 1,
        "unit": "tsp",
        "category": "pantry"
      },
      {
        "name": "Turmeric",
        "quantity": 0.5,
        "unit": "tsp",
        "category": "spices"
      },
      {
        "name": "Cumin Seeds",
        "quantity": 1,
        "unit": "tsp",
        "category": "spices"
      },
      {
        "name": "Red Chili Powder",
        "quantity": 0.5,
        "unit": "tsp",
        "category": "spices"
      }
    ],
    "dal-fry": [
      {
        "name": "Mixed Dal",
        "quantity": 80,
        "unit": "g",
        "category": "proteins",
        "inStock": false
      },
      {
        "name": "Oil",
        "quantity": 2,
        "unit": "tbsp",
        "category": "pantry",
        "inStock": false
      },
      {
        "name": "Spices",
        "quantity": 1,
        "unit": "packet",
        "category": "spices",
        "inStock": false
      },
      {
        "name": "Toor Dal",
        "quantity": 1,
        "unit": "cup",
        "category": "grains",
        "inStock": false
      },
      {
        "name": "Onion",
        "quantity": 1,
        "unit": "pc",
        "category": "produce",
        "inStock": false
      },
      {
        "name": "Tomato",
        "quantity": 2,
        "unit": "pc",
        "category": "produce",
        "inStock": false
      },
      {
        "name": "Green Chilli",
        "quantity": 2,
        "unit": "pc",
        "category": "produce",
        "inStock": false
      },
      {
        "name": "Ginger-Garlic Paste",
        "quantity": 1,
        "unit": "tbsp",
        "category": "produce",
        "inStock": false
      },
      {
        "name": "Coriander Leaves",
        "quantity": 0.25,
        "unit": "cup",
        "category": "produce",
        "inStock": false
      },
      {
        "name": "Salt",
        "quantity": 1,
        "unit": "tsp",
        "category": "pantry"
      },
      {
        "name": "Turmeric",
        "quantity": 0.5,
        "unit": "tsp",
        "category": "spices"
      },
      {
        "name": "Cumin Seeds",
        "quantity": 1,
        "unit": "tsp",
        "category": "spices"
      }
    ],
    "dal-palak": [
      {
        "name": "Mixed Dal",
        "quantity": 80,
        "unit": "g",
        "category": "proteins",
        "inStock": false
      },
      {
        "name": "Spinach",
        "quantity": 150,
        "unit": "g",
        "category": "produce",
        "inStock": false
      },
      {
        "name": "Oil",
        "quantity": 2,
        "unit": "tbsp",
        "category": "pantry",
        "inStock": false
      },
      {
        "name": "Spices",
        "quantity": 1,
        "unit": "packet",
        "category": "spices",
        "inStock": false
      },
      {
        "name": "Toor Dal",
        "quantity": 1,
        "unit": "cup",
        "category": "grains",
        "inStock": false
      },
      {
        "name": "Onion",
        "quantity": 1,
        "unit": "pc",
        "category": "produce",
        "inStock": false
      },
      {
        "name": "Tomato",
        "quantity": 2,
        "unit": "pc",
        "category": "produce",
        "inStock": false
      },
      {
        "name": "Green Chilli",
        "quantity": 2,
        "unit": "pc",
        "category": "produce",
        "inStock": false
      },
      {
        "name": "Ginger-Garlic Paste",
        "quantity": 1,
        "unit": "tbsp",
        "category": "produce",
        "inStock": false
      },
      {
        "name": "Coriander Leaves",
        "quantity": 0.25,
        "unit": "cup",
        "category": "produce",
        "inStock": false
      },
      {
        "name": "Salt",
        "quantity": 1,
        "unit": "tsp",
        "category": "pantry"
      },
      {
        "name": "Turmeric",
        "quantity": 0.5,
        "unit": "tsp",
        "category": "spices"
      },
      {
        "name": "Cumin Seeds",
        "quantity": 1,
        "unit": "tsp",
        "category": "spices"
      }
    ],
    "dal-dhokli": [
      {
        "name": "Toor Dal",
        "quantity": 1,
        "unit": "cup",
        "category": "proteins"
      },
      {
        "name": "Wheat Flour",
        "quantity": 1,
        "unit": "cup",
        "category": "grains"
      },
      {
        "name": "Oil",
        "quantity": 1,
        "unit": "tbsp",
        "category": "pantry"
      },
      {
        "name": "Salt",
        "quantity": 0.5,
        "unit": "tsp",
        "category": "pantry"
      },
      {
        "name": "Turmeric",
        "quantity": 0.25,
        "unit": "tsp",
        "category": "spices"
      },
      {
        "name": "Coriander Leaves",
        "quantity": 0.25,
        "unit": "cup",
        "category": "produce"
      },
      {
        "name": "Mixed Dal",
        "quantity": 80,
        "unit": "g",
        "category": "proteins",
        "inStock": false
      }
    ],
    "dal-baati": [
      {
        "name": "Mixed Dal",
        "quantity": 80,
        "unit": "g",
        "category": "proteins",
        "inStock": false
      },
      {
        "name": "Ghee",
        "quantity": 2,
        "unit": "tbsp",
        "category": "pantry",
        "inStock": false
      },
      {
        "name": "Oil",
        "quantity": 2,
        "unit": "tbsp",
        "category": "pantry",
        "inStock": false
      },
      {
        "name": "Spices",
        "quantity": 1,
        "unit": "packet",
        "category": "spices",
        "inStock": false
      },
      {
        "name": "Toor Dal",
        "quantity": 1,
        "unit": "cup",
        "category": "grains",
        "inStock": false
      },
      {
        "name": "Salt",
        "quantity": 1,
        "unit": "tsp",
        "category": "pantry"
      },
      {
        "name": "Turmeric",
        "quantity": 0.5,
        "unit": "tsp",
        "category": "spices"
      },
      {
        "name": "Cumin Seeds",
        "quantity": 1,
        "unit": "tsp",
        "category": "spices"
      }
    ],
    "kadhi-pakora": [
      {
        "name": "Yogurt",
        "quantity": 200,
        "unit": "g",
        "category": "dairy",
        "inStock": false
      },
      {
        "name": "Gram Flour",
        "quantity": 50,
        "unit": "g",
        "category": "grains",
        "inStock": false
      },
      {
        "name": "Ghee",
        "quantity": 2,
        "unit": "tbsp",
        "category": "pantry",
        "inStock": false
      },
      {
        "name": "Oil",
        "quantity": 2,
        "unit": "tbsp",
        "category": "pantry",
        "inStock": false
      },
      {
        "name": "Spices",
        "quantity": 1,
        "unit": "packet",
        "category": "spices",
        "inStock": false
      }
    ],
    "aloo-matar": [
      {
        "name": "Potatoes",
        "quantity": 3,
        "unit": "pc",
        "category": "produce",
        "inStock": false
      },
      {
        "name": "Green Peas",
        "quantity": 100,
        "unit": "g",
        "category": "produce",
        "inStock": false
      },
      {
        "name": "Oil",
        "quantity": 2,
        "unit": "tbsp",
        "category": "pantry",
        "inStock": false
      },
      {
        "name": "Spices",
        "quantity": 1,
        "unit": "packet",
        "category": "spices",
        "inStock": false
      },
      {
        "name": "Onion",
        "quantity": 1,
        "unit": "pc",
        "category": "produce",
        "inStock": false
      },
      {
        "name": "Tomato",
        "quantity": 2,
        "unit": "pc",
        "category": "produce",
        "inStock": false
      },
      {
        "name": "Green Chilli",
        "quantity": 2,
        "unit": "pc",
        "category": "produce",
        "inStock": false
      },
      {
        "name": "Ginger-Garlic Paste",
        "quantity": 1,
        "unit": "tbsp",
        "category": "produce",
        "inStock": false
      },
      {
        "name": "Coriander Leaves",
        "quantity": 0.25,
        "unit": "cup",
        "category": "produce",
        "inStock": false
      },
      {
        "name": "Salt",
        "quantity": 1,
        "unit": "tsp",
        "category": "pantry"
      },
      {
        "name": "Turmeric",
        "quantity": 0.5,
        "unit": "tsp",
        "category": "spices"
      },
      {
        "name": "Cumin Seeds",
        "quantity": 1,
        "unit": "tsp",
        "category": "spices"
      },
      {
        "name": "Red Chili Powder",
        "quantity": 0.5,
        "unit": "tsp",
        "category": "spices"
      }
    ],
    "aloo-palak": [
      {
        "name": "Potatoes",
        "quantity": 3,
        "unit": "pc",
        "category": "produce",
        "inStock": false
      },
      {
        "name": "Spinach",
        "quantity": 150,
        "unit": "g",
        "category": "produce",
        "inStock": false
      },
      {
        "name": "Oil",
        "quantity": 2,
        "unit": "tbsp",
        "category": "pantry",
        "inStock": false
      },
      {
        "name": "Spices",
        "quantity": 1,
        "unit": "packet",
        "category": "spices",
        "inStock": false
      }
    ],
    "aloo-baingan": [
      {
        "name": "Potatoes",
        "quantity": 3,
        "unit": "pc",
        "category": "produce",
        "inStock": false
      },
      {
        "name": "Eggplant",
        "quantity": 300,
        "unit": "g",
        "category": "produce",
        "inStock": false
      },
      {
        "name": "Coriander Leaves",
        "quantity": 10,
        "unit": "g",
        "category": "produce",
        "inStock": false
      },
      {
        "name": "Lemon",
        "quantity": 0.5,
        "unit": "pc",
        "category": "produce",
        "inStock": false
      },
      {
        "name": "Oil",
        "quantity": 2,
        "unit": "tbsp",
        "category": "pantry",
        "inStock": false
      },
      {
        "name": "Spices",
        "quantity": 1,
        "unit": "packet",
        "category": "spices",
        "inStock": false
      },
      {
        "name": "Salt",
        "quantity": 1,
        "unit": "tsp",
        "category": "pantry"
      },
      {
        "name": "Turmeric",
        "quantity": 0.5,
        "unit": "tsp",
        "category": "spices"
      }
    ],
    "aloo-tamatar": [
      {
        "name": "Potatoes",
        "quantity": 3,
        "unit": "pc",
        "category": "produce",
        "inStock": false
      },
      {
        "name": "Oil",
        "quantity": 2,
        "unit": "tbsp",
        "category": "pantry",
        "inStock": false
      },
      {
        "name": "Spices",
        "quantity": 1,
        "unit": "packet",
        "category": "spices",
        "inStock": false
      },
      {
        "name": "Onion",
        "quantity": 1,
        "unit": "pc",
        "category": "produce",
        "inStock": false
      },
      {
        "name": "Tomato",
        "quantity": 2,
        "unit": "pc",
        "category": "produce",
        "inStock": false
      },
      {
        "name": "Green Chilli",
        "quantity": 2,
        "unit": "pc",
        "category": "produce",
        "inStock": false
      },
      {
        "name": "Ginger-Garlic Paste",
        "quantity": 1,
        "unit": "tbsp",
        "category": "produce",
        "inStock": false
      },
      {
        "name": "Coriander Leaves",
        "quantity": 0.25,
        "unit": "cup",
        "category": "produce",
        "inStock": false
      },
      {
        "name": "Salt",
        "quantity": 1,
        "unit": "tsp",
        "category": "pantry"
      },
      {
        "name": "Turmeric",
        "quantity": 0.5,
        "unit": "tsp",
        "category": "spices"
      },
      {
        "name": "Cumin Seeds",
        "quantity": 1,
        "unit": "tsp",
        "category": "spices"
      },
      {
        "name": "Red Chili Powder",
        "quantity": 0.5,
        "unit": "tsp",
        "category": "spices"
      }
    ],
    "aloo-methi": [
      {
        "name": "Potatoes",
        "quantity": 3,
        "unit": "pc",
        "category": "produce",
        "inStock": false
      },
      {
        "name": "Fenugreek Leaves",
        "quantity": 100,
        "unit": "g",
        "category": "produce",
        "inStock": false
      },
      {
        "name": "Oil",
        "quantity": 2,
        "unit": "tbsp",
        "category": "pantry",
        "inStock": false
      },
      {
        "name": "Spices",
        "quantity": 1,
        "unit": "packet",
        "category": "spices",
        "inStock": false
      }
    ],
    "dum-aloo": [
      {
        "name": "Potatoes",
        "quantity": 3,
        "unit": "pc",
        "category": "produce",
        "inStock": false
      },
      {
        "name": "Oil",
        "quantity": 2,
        "unit": "tbsp",
        "category": "pantry",
        "inStock": false
      },
      {
        "name": "Spices",
        "quantity": 1,
        "unit": "packet",
        "category": "spices",
        "inStock": false
      },
      {
        "name": "Onion",
        "quantity": 1,
        "unit": "pc",
        "category": "produce",
        "inStock": false
      },
      {
        "name": "Tomato",
        "quantity": 2,
        "unit": "pc",
        "category": "produce",
        "inStock": false
      },
      {
        "name": "Green Chilli",
        "quantity": 2,
        "unit": "pc",
        "category": "produce",
        "inStock": false
      },
      {
        "name": "Ginger-Garlic Paste",
        "quantity": 1,
        "unit": "tbsp",
        "category": "produce",
        "inStock": false
      },
      {
        "name": "Coriander Leaves",
        "quantity": 0.25,
        "unit": "cup",
        "category": "produce",
        "inStock": false
      },
      {
        "name": "Salt",
        "quantity": 1,
        "unit": "tsp",
        "category": "pantry"
      },
      {
        "name": "Turmeric",
        "quantity": 0.5,
        "unit": "tsp",
        "category": "spices"
      },
      {
        "name": "Cumin Seeds",
        "quantity": 1,
        "unit": "tsp",
        "category": "spices"
      },
      {
        "name": "Red Chili Powder",
        "quantity": 0.5,
        "unit": "tsp",
        "category": "spices"
      }
    ],
    "baingan-masala": [
      {
        "name": "Eggplant",
        "quantity": 300,
        "unit": "g",
        "category": "produce",
        "inStock": false
      },
      {
        "name": "Coriander Leaves",
        "quantity": 10,
        "unit": "g",
        "category": "produce",
        "inStock": false
      },
      {
        "name": "Lemon",
        "quantity": 0.5,
        "unit": "pc",
        "category": "produce",
        "inStock": false
      },
      {
        "name": "Oil",
        "quantity": 2,
        "unit": "tbsp",
        "category": "pantry",
        "inStock": false
      },
      {
        "name": "Spices",
        "quantity": 1,
        "unit": "packet",
        "category": "spices",
        "inStock": false
      },
      {
        "name": "Onion",
        "quantity": 1,
        "unit": "pc",
        "category": "produce",
        "inStock": false
      },
      {
        "name": "Tomato",
        "quantity": 2,
        "unit": "pc",
        "category": "produce",
        "inStock": false
      },
      {
        "name": "Green Chilli",
        "quantity": 2,
        "unit": "pc",
        "category": "produce",
        "inStock": false
      },
      {
        "name": "Ginger-Garlic Paste",
        "quantity": 1,
        "unit": "tbsp",
        "category": "produce",
        "inStock": false
      },
      {
        "name": "Salt",
        "quantity": 1,
        "unit": "tsp",
        "category": "pantry"
      },
      {
        "name": "Turmeric",
        "quantity": 0.5,
        "unit": "tsp",
        "category": "spices"
      },
      {
        "name": "Cumin Seeds",
        "quantity": 1,
        "unit": "tsp",
        "category": "spices"
      },
      {
        "name": "Red Chili Powder",
        "quantity": 0.5,
        "unit": "tsp",
        "category": "spices"
      }
    ],
    "achari-baingan": [
      {
        "name": "Eggplant",
        "quantity": 300,
        "unit": "g",
        "category": "produce",
        "inStock": false
      },
      {
        "name": "Coriander Leaves",
        "quantity": 10,
        "unit": "g",
        "category": "produce",
        "inStock": false
      },
      {
        "name": "Lemon",
        "quantity": 0.5,
        "unit": "pc",
        "category": "produce",
        "inStock": false
      },
      {
        "name": "Oil",
        "quantity": 2,
        "unit": "tbsp",
        "category": "pantry",
        "inStock": false
      },
      {
        "name": "Spices",
        "quantity": 1,
        "unit": "packet",
        "category": "spices",
        "inStock": false
      },
      {
        "name": "Onion",
        "quantity": 1,
        "unit": "pc",
        "category": "produce",
        "inStock": false
      },
      {
        "name": "Tomato",
        "quantity": 2,
        "unit": "pc",
        "category": "produce",
        "inStock": false
      },
      {
        "name": "Green Chilli",
        "quantity": 2,
        "unit": "pc",
        "category": "produce",
        "inStock": false
      },
      {
        "name": "Ginger-Garlic Paste",
        "quantity": 1,
        "unit": "tbsp",
        "category": "produce",
        "inStock": false
      },
      {
        "name": "Salt",
        "quantity": 1,
        "unit": "tsp",
        "category": "pantry"
      },
      {
        "name": "Turmeric",
        "quantity": 0.5,
        "unit": "tsp",
        "category": "spices"
      },
      {
        "name": "Cumin Seeds",
        "quantity": 1,
        "unit": "tsp",
        "category": "spices"
      },
      {
        "name": "Red Chili Powder",
        "quantity": 0.5,
        "unit": "tsp",
        "category": "spices"
      }
    ],
    "bhindi-do-pyaza": [
      {
        "name": "Okra",
        "quantity": 200,
        "unit": "g",
        "category": "produce",
        "inStock": false
      },
      {
        "name": "Onions",
        "quantity": 2,
        "unit": "pc",
        "category": "produce",
        "inStock": false
      },
      {
        "name": "Tomatoes",
        "quantity": 2,
        "unit": "pc",
        "category": "produce",
        "inStock": false
      },
      {
        "name": "Oil",
        "quantity": 2,
        "unit": "tbsp",
        "category": "pantry",
        "inStock": false
      },
      {
        "name": "Spices",
        "quantity": 1,
        "unit": "packet",
        "category": "spices",
        "inStock": false
      }
    ],
    "gobi-matar": [
      {
        "name": "Cauliflower",
        "quantity": 200,
        "unit": "g",
        "category": "produce",
        "inStock": false
      },
      {
        "name": "Green Peas",
        "quantity": 100,
        "unit": "g",
        "category": "produce",
        "inStock": false
      },
      {
        "name": "Oil",
        "quantity": 2,
        "unit": "tbsp",
        "category": "pantry",
        "inStock": false
      },
      {
        "name": "Spices",
        "quantity": 1,
        "unit": "packet",
        "category": "spices",
        "inStock": false
      }
    ],
    "paneer-do-pyaza": [
      {
        "name": "Paneer",
        "quantity": 150,
        "unit": "g",
        "category": "proteins",
        "inStock": false
      },
      {
        "name": "Ghee",
        "quantity": 2,
        "unit": "tbsp",
        "category": "pantry",
        "inStock": false
      },
      {
        "name": "Oil",
        "quantity": 2,
        "unit": "tbsp",
        "category": "pantry",
        "inStock": false
      },
      {
        "name": "Spices",
        "quantity": 1,
        "unit": "packet",
        "category": "spices",
        "inStock": false
      },
      {
        "name": "Onion",
        "quantity": 1,
        "unit": "pc",
        "category": "produce",
        "inStock": false
      },
      {
        "name": "Tomato",
        "quantity": 2,
        "unit": "pc",
        "category": "produce",
        "inStock": false
      },
      {
        "name": "Green Chilli",
        "quantity": 2,
        "unit": "pc",
        "category": "produce",
        "inStock": false
      },
      {
        "name": "Ginger-Garlic Paste",
        "quantity": 1,
        "unit": "tbsp",
        "category": "produce",
        "inStock": false
      },
      {
        "name": "Coriander Leaves",
        "quantity": 0.25,
        "unit": "cup",
        "category": "produce",
        "inStock": false
      },
      {
        "name": "Salt",
        "quantity": 1,
        "unit": "tsp",
        "category": "pantry"
      },
      {
        "name": "Turmeric",
        "quantity": 0.5,
        "unit": "tsp",
        "category": "spices"
      },
      {
        "name": "Cumin Seeds",
        "quantity": 1,
        "unit": "tsp",
        "category": "spices"
      },
      {
        "name": "Red Chili Powder",
        "quantity": 0.5,
        "unit": "tsp",
        "category": "spices"
      }
    ],
    "paneer-jalfrezi": [
      {
        "name": "Paneer",
        "quantity": 150,
        "unit": "g",
        "category": "proteins",
        "inStock": false
      },
      {
        "name": "Ghee",
        "quantity": 2,
        "unit": "tbsp",
        "category": "pantry",
        "inStock": false
      },
      {
        "name": "Oil",
        "quantity": 2,
        "unit": "tbsp",
        "category": "pantry",
        "inStock": false
      },
      {
        "name": "Spices",
        "quantity": 1,
        "unit": "packet",
        "category": "spices",
        "inStock": false
      },
      {
        "name": "Onion",
        "quantity": 1,
        "unit": "pc",
        "category": "produce",
        "inStock": false
      },
      {
        "name": "Tomato",
        "quantity": 2,
        "unit": "pc",
        "category": "produce",
        "inStock": false
      },
      {
        "name": "Green Chilli",
        "quantity": 2,
        "unit": "pc",
        "category": "produce",
        "inStock": false
      },
      {
        "name": "Ginger-Garlic Paste",
        "quantity": 1,
        "unit": "tbsp",
        "category": "produce",
        "inStock": false
      },
      {
        "name": "Coriander Leaves",
        "quantity": 0.25,
        "unit": "cup",
        "category": "produce",
        "inStock": false
      },
      {
        "name": "Salt",
        "quantity": 1,
        "unit": "tsp",
        "category": "pantry"
      },
      {
        "name": "Turmeric",
        "quantity": 0.5,
        "unit": "tsp",
        "category": "spices"
      }
    ],
    "paneer-pasanda": [
      {
        "name": "Paneer",
        "quantity": 150,
        "unit": "g",
        "category": "proteins",
        "inStock": false
      },
      {
        "name": "Ghee",
        "quantity": 2,
        "unit": "tbsp",
        "category": "pantry",
        "inStock": false
      },
      {
        "name": "Oil",
        "quantity": 2,
        "unit": "tbsp",
        "category": "pantry",
        "inStock": false
      },
      {
        "name": "Spices",
        "quantity": 1,
        "unit": "packet",
        "category": "spices",
        "inStock": false
      },
      {
        "name": "Onion",
        "quantity": 1,
        "unit": "pc",
        "category": "produce",
        "inStock": false
      },
      {
        "name": "Tomato",
        "quantity": 2,
        "unit": "pc",
        "category": "produce",
        "inStock": false
      },
      {
        "name": "Green Chilli",
        "quantity": 2,
        "unit": "pc",
        "category": "produce",
        "inStock": false
      },
      {
        "name": "Ginger-Garlic Paste",
        "quantity": 1,
        "unit": "tbsp",
        "category": "produce",
        "inStock": false
      },
      {
        "name": "Coriander Leaves",
        "quantity": 0.25,
        "unit": "cup",
        "category": "produce",
        "inStock": false
      },
      {
        "name": "Salt",
        "quantity": 1,
        "unit": "tsp",
        "category": "pantry"
      },
      {
        "name": "Turmeric",
        "quantity": 0.5,
        "unit": "tsp",
        "category": "spices"
      },
      {
        "name": "Cumin Seeds",
        "quantity": 1,
        "unit": "tsp",
        "category": "spices"
      },
      {
        "name": "Red Chili Powder",
        "quantity": 0.5,
        "unit": "tsp",
        "category": "spices"
      }
    ],
    "paneer-lababdar": [
      {
        "name": "Paneer",
        "quantity": 150,
        "unit": "g",
        "category": "proteins",
        "inStock": false
      },
      {
        "name": "Ghee",
        "quantity": 2,
        "unit": "tbsp",
        "category": "pantry",
        "inStock": false
      },
      {
        "name": "Oil",
        "quantity": 2,
        "unit": "tbsp",
        "category": "pantry",
        "inStock": false
      },
      {
        "name": "Spices",
        "quantity": 1,
        "unit": "packet",
        "category": "spices",
        "inStock": false
      },
      {
        "name": "Onion",
        "quantity": 1,
        "unit": "pc",
        "category": "produce",
        "inStock": false
      },
      {
        "name": "Tomato",
        "quantity": 2,
        "unit": "pc",
        "category": "produce",
        "inStock": false
      },
      {
        "name": "Green Chilli",
        "quantity": 2,
        "unit": "pc",
        "category": "produce",
        "inStock": false
      },
      {
        "name": "Ginger-Garlic Paste",
        "quantity": 1,
        "unit": "tbsp",
        "category": "produce",
        "inStock": false
      },
      {
        "name": "Coriander Leaves",
        "quantity": 0.25,
        "unit": "cup",
        "category": "produce",
        "inStock": false
      },
      {
        "name": "Salt",
        "quantity": 1,
        "unit": "tsp",
        "category": "pantry"
      },
      {
        "name": "Turmeric",
        "quantity": 0.5,
        "unit": "tsp",
        "category": "spices"
      },
      {
        "name": "Cumin Seeds",
        "quantity": 1,
        "unit": "tsp",
        "category": "spices"
      },
      {
        "name": "Red Chili Powder",
        "quantity": 0.5,
        "unit": "tsp",
        "category": "spices"
      }
    ],
    "paneer-korma": [
      {
        "name": "Paneer",
        "quantity": 200,
        "unit": "g",
        "category": "proteins"
      },
      {
        "name": "Onion",
        "quantity": 1,
        "unit": "pc",
        "category": "produce"
      },
      {
        "name": "Tomato",
        "quantity": 2,
        "unit": "pc",
        "category": "produce"
      },
      {
        "name": "Yogurt",
        "quantity": 0.5,
        "unit": "cup",
        "category": "dairy"
      },
      {
        "name": "Cashews",
        "quantity": 2,
        "unit": "tbsp",
        "category": "pantry"
      },
      {
        "name": "Ginger-Garlic Paste",
        "quantity": 1,
        "unit": "tbsp",
        "category": "pantry"
      },
      {
        "name": "Green Chilli",
        "quantity": 1,
        "unit": "pc",
        "category": "produce"
      },
      {
        "name": "Korma Masala",
        "quantity": 1.5,
        "unit": "tbsp",
        "category": "spices"
      },
      {
        "name": "Cream",
        "quantity": 2,
        "unit": "tbsp",
        "category": "dairy"
      },
      {
        "name": "Garam Masala",
        "quantity": 0.5,
        "unit": "tsp",
        "category": "spices"
      },
      {
        "name": "Salt",
        "quantity": 1,
        "unit": "tsp",
        "category": "pantry"
      },
      {
        "name": "Oil",
        "quantity": 1,
        "unit": "tbsp",
        "category": "pantry"
      },
      {
        "name": "Coriander Leaves",
        "quantity": 0.25,
        "unit": "cup",
        "category": "produce"
      }
    ],
    "paneer-achari": [
      {
        "name": "Paneer",
        "quantity": 150,
        "unit": "g",
        "category": "proteins",
        "inStock": false
      },
      {
        "name": "Ghee",
        "quantity": 2,
        "unit": "tbsp",
        "category": "pantry",
        "inStock": false
      },
      {
        "name": "Oil",
        "quantity": 2,
        "unit": "tbsp",
        "category": "pantry",
        "inStock": false
      },
      {
        "name": "Spices",
        "quantity": 1,
        "unit": "packet",
        "category": "spices",
        "inStock": false
      },
      {
        "name": "Onion",
        "quantity": 1,
        "unit": "pc",
        "category": "produce",
        "inStock": false
      },
      {
        "name": "Tomato",
        "quantity": 2,
        "unit": "pc",
        "category": "produce",
        "inStock": false
      },
      {
        "name": "Green Chilli",
        "quantity": 2,
        "unit": "pc",
        "category": "produce",
        "inStock": false
      },
      {
        "name": "Ginger-Garlic Paste",
        "quantity": 1,
        "unit": "tbsp",
        "category": "produce",
        "inStock": false
      },
      {
        "name": "Coriander Leaves",
        "quantity": 0.25,
        "unit": "cup",
        "category": "produce",
        "inStock": false
      },
      {
        "name": "Salt",
        "quantity": 1,
        "unit": "tsp",
        "category": "pantry"
      },
      {
        "name": "Turmeric",
        "quantity": 0.5,
        "unit": "tsp",
        "category": "spices"
      },
      {
        "name": "Cumin Seeds",
        "quantity": 1,
        "unit": "tsp",
        "category": "spices"
      },
      {
        "name": "Red Chili Powder",
        "quantity": 0.5,
        "unit": "tsp",
        "category": "spices"
      }
    ],
    "khoya-paneer": [
      {
        "name": "Paneer",
        "quantity": 150,
        "unit": "g",
        "category": "proteins",
        "inStock": false
      },
      {
        "name": "Ghee",
        "quantity": 2,
        "unit": "tbsp",
        "category": "pantry",
        "inStock": false
      },
      {
        "name": "Oil",
        "quantity": 2,
        "unit": "tbsp",
        "category": "pantry",
        "inStock": false
      },
      {
        "name": "Spices",
        "quantity": 1,
        "unit": "packet",
        "category": "spices",
        "inStock": false
      },
      {
        "name": "Onion",
        "quantity": 1,
        "unit": "pc",
        "category": "produce",
        "inStock": false
      },
      {
        "name": "Tomato",
        "quantity": 2,
        "unit": "pc",
        "category": "produce",
        "inStock": false
      },
      {
        "name": "Green Chilli",
        "quantity": 2,
        "unit": "pc",
        "category": "produce",
        "inStock": false
      },
      {
        "name": "Ginger-Garlic Paste",
        "quantity": 1,
        "unit": "tbsp",
        "category": "produce",
        "inStock": false
      },
      {
        "name": "Coriander Leaves",
        "quantity": 0.25,
        "unit": "cup",
        "category": "produce",
        "inStock": false
      },
      {
        "name": "Salt",
        "quantity": 1,
        "unit": "tsp",
        "category": "pantry"
      },
      {
        "name": "Turmeric",
        "quantity": 0.5,
        "unit": "tsp",
        "category": "spices"
      },
      {
        "name": "Cumin Seeds",
        "quantity": 1,
        "unit": "tsp",
        "category": "spices"
      },
      {
        "name": "Red Chili Powder",
        "quantity": 0.5,
        "unit": "tsp",
        "category": "spices"
      }
    ],
    "lobiya": [
      {
        "name": "Black Eyed Peas (Lobiya)",
        "quantity": 1,
        "unit": "cup",
        "category": "proteins"
      },
      {
        "name": "Onion",
        "quantity": 1,
        "unit": "pc",
        "category": "produce"
      },
      {
        "name": "Tomato",
        "quantity": 2,
        "unit": "pc",
        "category": "produce"
      },
      {
        "name": "Ginger-Garlic Paste",
        "quantity": 1,
        "unit": "tbsp",
        "category": "pantry"
      },
      {
        "name": "Turmeric",
        "quantity": 0.5,
        "unit": "tsp",
        "category": "spices"
      },
      {
        "name": "Red Chilli Powder",
        "quantity": 0.5,
        "unit": "tsp",
        "category": "spices"
      },
      {
        "name": "Garam Masala",
        "quantity": 0.5,
        "unit": "tsp",
        "category": "spices"
      },
      {
        "name": "Cumin Seeds",
        "quantity": 0.5,
        "unit": "tsp",
        "category": "spices"
      },
      {
        "name": "Salt",
        "quantity": 1,
        "unit": "tsp",
        "category": "pantry"
      },
      {
        "name": "Oil",
        "quantity": 1,
        "unit": "tbsp",
        "category": "pantry"
      },
      {
        "name": "Coriander Leaves",
        "quantity": 0.25,
        "unit": "cup",
        "category": "produce"
      },
      {
        "name": "Rice",
        "quantity": 1,
        "unit": "cup",
        "category": "grains"
      }
    ],
    "matar-mushroom": [
      {
        "name": "Green Peas",
        "quantity": 100,
        "unit": "g",
        "category": "produce",
        "inStock": false
      },
      {
        "name": "Mushrooms",
        "quantity": 100,
        "unit": "g",
        "category": "produce",
        "inStock": false
      },
      {
        "name": "Oil",
        "quantity": 2,
        "unit": "tbsp",
        "category": "pantry",
        "inStock": false
      },
      {
        "name": "Spices",
        "quantity": 1,
        "unit": "packet",
        "category": "spices",
        "inStock": false
      },
      {
        "name": "Onion",
        "quantity": 1,
        "unit": "pc",
        "category": "produce",
        "inStock": false
      },
      {
        "name": "Tomato",
        "quantity": 2,
        "unit": "pc",
        "category": "produce",
        "inStock": false
      },
      {
        "name": "Green Chilli",
        "quantity": 2,
        "unit": "pc",
        "category": "produce",
        "inStock": false
      },
      {
        "name": "Ginger-Garlic Paste",
        "quantity": 1,
        "unit": "tbsp",
        "category": "produce",
        "inStock": false
      },
      {
        "name": "Coriander Leaves",
        "quantity": 0.25,
        "unit": "cup",
        "category": "produce",
        "inStock": false
      },
      {
        "name": "Salt",
        "quantity": 1,
        "unit": "tsp",
        "category": "pantry"
      },
      {
        "name": "Turmeric",
        "quantity": 0.5,
        "unit": "tsp",
        "category": "spices"
      },
      {
        "name": "Cumin Seeds",
        "quantity": 1,
        "unit": "tsp",
        "category": "spices"
      },
      {
        "name": "Red Chili Powder",
        "quantity": 0.5,
        "unit": "tsp",
        "category": "spices"
      }
    ],
    "mushroom-masala": [
      {
        "name": "Mushrooms",
        "quantity": 100,
        "unit": "g",
        "category": "produce",
        "inStock": false
      },
      {
        "name": "Oil",
        "quantity": 2,
        "unit": "tbsp",
        "category": "pantry",
        "inStock": false
      },
      {
        "name": "Spices",
        "quantity": 1,
        "unit": "packet",
        "category": "spices",
        "inStock": false
      },
      {
        "name": "Onion",
        "quantity": 1,
        "unit": "pc",
        "category": "produce",
        "inStock": false
      },
      {
        "name": "Tomato",
        "quantity": 2,
        "unit": "pc",
        "category": "produce",
        "inStock": false
      },
      {
        "name": "Green Chilli",
        "quantity": 2,
        "unit": "pc",
        "category": "produce",
        "inStock": false
      },
      {
        "name": "Ginger-Garlic Paste",
        "quantity": 1,
        "unit": "tbsp",
        "category": "produce",
        "inStock": false
      },
      {
        "name": "Coriander Leaves",
        "quantity": 0.25,
        "unit": "cup",
        "category": "produce",
        "inStock": false
      },
      {
        "name": "Salt",
        "quantity": 1,
        "unit": "tsp",
        "category": "pantry"
      },
      {
        "name": "Turmeric",
        "quantity": 0.5,
        "unit": "tsp",
        "category": "spices"
      },
      {
        "name": "Cumin Seeds",
        "quantity": 1,
        "unit": "tsp",
        "category": "spices"
      },
      {
        "name": "Red Chili Powder",
        "quantity": 0.5,
        "unit": "tsp",
        "category": "spices"
      }
    ],
    "mushroom-do-pyaza": [
      {
        "name": "Mushrooms",
        "quantity": 100,
        "unit": "g",
        "category": "produce",
        "inStock": false
      },
      {
        "name": "Oil",
        "quantity": 2,
        "unit": "tbsp",
        "category": "pantry",
        "inStock": false
      },
      {
        "name": "Spices",
        "quantity": 1,
        "unit": "packet",
        "category": "spices",
        "inStock": false
      },
      {
        "name": "Onion",
        "quantity": 1,
        "unit": "pc",
        "category": "produce",
        "inStock": false
      },
      {
        "name": "Tomato",
        "quantity": 2,
        "unit": "pc",
        "category": "produce",
        "inStock": false
      },
      {
        "name": "Green Chilli",
        "quantity": 2,
        "unit": "pc",
        "category": "produce",
        "inStock": false
      },
      {
        "name": "Ginger-Garlic Paste",
        "quantity": 1,
        "unit": "tbsp",
        "category": "produce",
        "inStock": false
      },
      {
        "name": "Coriander Leaves",
        "quantity": 0.25,
        "unit": "cup",
        "category": "produce",
        "inStock": false
      },
      {
        "name": "Salt",
        "quantity": 1,
        "unit": "tsp",
        "category": "pantry"
      },
      {
        "name": "Turmeric",
        "quantity": 0.5,
        "unit": "tsp",
        "category": "spices"
      },
      {
        "name": "Cumin Seeds",
        "quantity": 1,
        "unit": "tsp",
        "category": "spices"
      },
      {
        "name": "Red Chili Powder",
        "quantity": 0.5,
        "unit": "tsp",
        "category": "spices"
      }
    ],
    "mushroom-matar": [
      {
        "name": "Green Peas",
        "quantity": 100,
        "unit": "g",
        "category": "produce",
        "inStock": false
      },
      {
        "name": "Mushrooms",
        "quantity": 100,
        "unit": "g",
        "category": "produce",
        "inStock": false
      },
      {
        "name": "Oil",
        "quantity": 2,
        "unit": "tbsp",
        "category": "pantry",
        "inStock": false
      },
      {
        "name": "Spices",
        "quantity": 1,
        "unit": "packet",
        "category": "spices",
        "inStock": false
      },
      {
        "name": "Onion",
        "quantity": 1,
        "unit": "pc",
        "category": "produce",
        "inStock": false
      },
      {
        "name": "Tomato",
        "quantity": 2,
        "unit": "pc",
        "category": "produce",
        "inStock": false
      },
      {
        "name": "Green Chilli",
        "quantity": 2,
        "unit": "pc",
        "category": "produce",
        "inStock": false
      },
      {
        "name": "Ginger-Garlic Paste",
        "quantity": 1,
        "unit": "tbsp",
        "category": "produce",
        "inStock": false
      },
      {
        "name": "Coriander Leaves",
        "quantity": 0.25,
        "unit": "cup",
        "category": "produce",
        "inStock": false
      },
      {
        "name": "Salt",
        "quantity": 1,
        "unit": "tsp",
        "category": "pantry"
      },
      {
        "name": "Turmeric",
        "quantity": 0.5,
        "unit": "tsp",
        "category": "spices"
      },
      {
        "name": "Cumin Seeds",
        "quantity": 1,
        "unit": "tsp",
        "category": "spices"
      },
      {
        "name": "Red Chili Powder",
        "quantity": 0.5,
        "unit": "tsp",
        "category": "spices"
      }
    ],
    "mushroom-corn-masala": [
      {
        "name": "Mushrooms",
        "quantity": 150,
        "unit": "g",
        "category": "produce"
      },
      {
        "name": "Sweet Corn",
        "quantity": 0.5,
        "unit": "cup",
        "category": "produce"
      },
      {
        "name": "Onion",
        "quantity": 1,
        "unit": "pc",
        "category": "produce"
      },
      {
        "name": "Tomato",
        "quantity": 1,
        "unit": "pc",
        "category": "produce"
      },
      {
        "name": "Ginger-Garlic Paste",
        "quantity": 1,
        "unit": "tbsp",
        "category": "pantry"
      },
      {
        "name": "Mustard Seeds",
        "quantity": 0.5,
        "unit": "tsp",
        "category": "spices"
      },
      {
        "name": "Turmeric",
        "quantity": 0.25,
        "unit": "tsp",
        "category": "spices"
      },
      {
        "name": "Green Chilli",
        "quantity": 1,
        "unit": "pc",
        "category": "produce"
      },
      {
        "name": "Oil",
        "quantity": 1,
        "unit": "tbsp",
        "category": "pantry"
      },
      {
        "name": "Salt",
        "quantity": 1,
        "unit": "tsp",
        "category": "pantry"
      },
      {
        "name": "Coriander Leaves",
        "quantity": 0.25,
        "unit": "cup",
        "category": "produce"
      }
    ],
    "corn-masala": [
      {
        "name": "Sweet Corn",
        "quantity": 1,
        "unit": "cup",
        "category": "produce"
      },
      {
        "name": "Onion",
        "quantity": 1,
        "unit": "pc",
        "category": "produce"
      },
      {
        "name": "Tomato",
        "quantity": 1,
        "unit": "pc",
        "category": "produce"
      },
      {
        "name": "Ginger-Garlic Paste",
        "quantity": 1,
        "unit": "tbsp",
        "category": "pantry"
      },
      {
        "name": "Mustard Seeds",
        "quantity": 0.5,
        "unit": "tsp",
        "category": "spices"
      },
      {
        "name": "Turmeric",
        "quantity": 0.25,
        "unit": "tsp",
        "category": "spices"
      },
      {
        "name": "Green Chilli",
        "quantity": 1,
        "unit": "pc",
        "category": "produce"
      },
      {
        "name": "Oil",
        "quantity": 1,
        "unit": "tbsp",
        "category": "pantry"
      },
      {
        "name": "Salt",
        "quantity": 1,
        "unit": "tsp",
        "category": "pantry"
      },
      {
        "name": "Coriander Leaves",
        "quantity": 0.25,
        "unit": "cup",
        "category": "produce"
      }
    ],
    "jeera-rice": [
      {
        "name": "Rice",
        "quantity": 1,
        "unit": "cup",
        "category": "grains"
      },
      {
        "name": "Cumin Seeds",
        "quantity": 1,
        "unit": "tsp",
        "category": "spices"
      },
      {
        "name": "Ghee",
        "quantity": 1,
        "unit": "tbsp",
        "category": "dairy"
      },
      {
        "name": "Water",
        "quantity": 2,
        "unit": "cup",
        "category": "pantry"
      },
      {
        "name": "Salt",
        "quantity": 1,
        "unit": "tsp",
        "category": "pantry"
      }
    ],
    "matar-pulao": [
      {
        "name": "Basmati Rice",
        "quantity": 1,
        "unit": "cup",
        "category": "grains"
      },
      {
        "name": "Green Peas",
        "quantity": 1,
        "unit": "cup",
        "category": "produce"
      },
      {
        "name": "Oil",
        "quantity": 2,
        "unit": "tbsp",
        "category": "pantry"
      },
      {
        "name": "Cumin Seeds",
        "quantity": 1,
        "unit": "tsp",
        "category": "spices"
      },
      {
        "name": "Bay Leaf",
        "quantity": 1,
        "unit": "pc",
        "category": "spices"
      },
      {
        "name": "Cloves",
        "quantity": 2,
        "unit": "pc",
        "category": "spices"
      },
      {
        "name": "Cardamom",
        "quantity": 2,
        "unit": "pods",
        "category": "spices"
      },
      {
        "name": "Cinnamon",
        "quantity": 1,
        "unit": "inch",
        "category": "spices"
      },
      {
        "name": "Onion",
        "quantity": 0.5,
        "unit": "pc",
        "category": "produce"
      },
      {
        "name": "Green Chilli",
        "quantity": 1,
        "unit": "pc",
        "category": "produce"
      },
      {
        "name": "Salt",
        "quantity": 1,
        "unit": "tsp",
        "category": "pantry"
      },
      {
        "name": "Water",
        "quantity": 2,
        "unit": "cup",
        "category": "pantry"
      },
      {
        "name": "Coriander Leaves",
        "quantity": 0.25,
        "unit": "cup",
        "category": "produce"
      }
    ],
    "soya-chaap": [
      {
        "name": "Soya Chaap",
        "quantity": 250,
        "unit": "g",
        "category": "proteins"
      },
      {
        "name": "Yogurt",
        "quantity": 0.5,
        "unit": "cup",
        "category": "dairy"
      },
      {
        "name": "Ginger-Garlic Paste",
        "quantity": 1,
        "unit": "tbsp",
        "category": "pantry"
      },
      {
        "name": "Red Chilli Powder",
        "quantity": 1,
        "unit": "tsp",
        "category": "spices"
      },
      {
        "name": "Turmeric",
        "quantity": 0.5,
        "unit": "tsp",
        "category": "spices"
      },
      {
        "name": "Garam Masala",
        "quantity": 1,
        "unit": "tsp",
        "category": "spices"
      },
      {
        "name": "Chaat Masala",
        "quantity": 0.5,
        "unit": "tsp",
        "category": "spices"
      },
      {
        "name": "Lemon Juice",
        "quantity": 1,
        "unit": "tbsp",
        "category": "pantry"
      },
      {
        "name": "Oil",
        "quantity": 2,
        "unit": "tbsp",
        "category": "pantry"
      },
      {
        "name": "Salt",
        "quantity": 1,
        "unit": "tsp",
        "category": "pantry"
      },
      {
        "name": "Soya Chunks",
        "quantity": 100,
        "unit": "g",
        "category": "proteins",
        "inStock": false
      }
    ],
    "malai-chaap": [
      {
        "name": "Soya Chaap",
        "quantity": 200,
        "unit": "g",
        "category": "proteins",
        "inStock": false
      },
      {
        "name": "Cream",
        "quantity": 50,
        "unit": "ml",
        "category": "dairy",
        "inStock": false
      },
      {
        "name": "Yogurt",
        "quantity": 50,
        "unit": "g",
        "category": "dairy",
        "inStock": false
      },
      {
        "name": "Garam Masala",
        "quantity": 0.5,
        "unit": "tsp",
        "category": "spices",
        "inStock": false
      },
      {
        "name": "Ghee",
        "quantity": 20,
        "unit": "g",
        "category": "dairy",
        "inStock": false
      },
      {
        "name": "Ghee",
        "quantity": 2,
        "unit": "tbsp",
        "category": "pantry",
        "inStock": false
      },
      {
        "name": "Oil",
        "quantity": 2,
        "unit": "tbsp",
        "category": "pantry",
        "inStock": false
      },
      {
        "name": "Spices",
        "quantity": 1,
        "unit": "packet",
        "category": "spices",
        "inStock": false
      },
      {
        "name": "Onion",
        "quantity": 1,
        "unit": "pc",
        "category": "produce",
        "inStock": false
      },
      {
        "name": "Tomato",
        "quantity": 2,
        "unit": "pc",
        "category": "produce",
        "inStock": false
      },
      {
        "name": "Green Chilli",
        "quantity": 2,
        "unit": "pc",
        "category": "produce",
        "inStock": false
      },
      {
        "name": "Ginger-Garlic Paste",
        "quantity": 1,
        "unit": "tbsp",
        "category": "produce",
        "inStock": false
      },
      {
        "name": "Coriander Leaves",
        "quantity": 0.25,
        "unit": "cup",
        "category": "produce",
        "inStock": false
      }
    ],
    "aloo-tikki": [
      {
        "name": "Potatoes",
        "quantity": 3,
        "unit": "pc",
        "category": "produce"
      },
      {
        "name": "Green Peas",
        "quantity": 0.25,
        "unit": "cup",
        "category": "produce"
      },
      {
        "name": "Ginger",
        "quantity": 1,
        "unit": "inch",
        "category": "produce"
      },
      {
        "name": "Green Chilli",
        "quantity": 2,
        "unit": "pc",
        "category": "produce"
      },
      {
        "name": "Cumin Seeds",
        "quantity": 0.5,
        "unit": "tsp",
        "category": "spices"
      },
      {
        "name": "Chaat Masala",
        "quantity": 1,
        "unit": "tsp",
        "category": "spices"
      },
      {
        "name": "Coriander Leaves",
        "quantity": 0.25,
        "unit": "cup",
        "category": "produce"
      },
      {
        "name": "Salt",
        "quantity": 0.5,
        "unit": "tsp",
        "category": "pantry"
      },
      {
        "name": "Oil",
        "quantity": 2,
        "unit": "tbsp",
        "category": "pantry"
      }
    ],
    "onion-pakora": [
      {
        "name": "Onion",
        "quantity": 2,
        "unit": "pcs",
        "category": "produce"
      },
      {
        "name": "Besan",
        "quantity": 0.5,
        "unit": "cup",
        "category": "pantry"
      },
      {
        "name": "Oil",
        "quantity": 2,
        "unit": "tbsp",
        "category": "pantry"
      },
      {
        "name": "Salt",
        "quantity": 0.5,
        "unit": "tsp",
        "category": "pantry"
      },
      {
        "name": "Red Chilli Powder",
        "quantity": 0.5,
        "unit": "tsp",
        "category": "spices"
      },
      {
        "name": "Turmeric",
        "quantity": 0.25,
        "unit": "tsp",
        "category": "spices"
      },
      {
        "name": "Ajwain",
        "quantity": 0.25,
        "unit": "tsp",
        "category": "spices"
      },
      {
        "name": "Curry Leaves",
        "quantity": 1,
        "unit": "sprig",
        "category": "produce"
      }
    ],
    "paneer-roll": [
      {
        "name": "Paneer",
        "quantity": 150,
        "unit": "g",
        "category": "proteins"
      },
      {
        "name": "Paratha",
        "quantity": 1,
        "unit": "pc",
        "category": "breads"
      },
      {
        "name": "Onion",
        "quantity": 1,
        "unit": "pc",
        "category": "produce"
      },
      {
        "name": "Bell Pepper",
        "quantity": 1,
        "unit": "pc",
        "category": "produce"
      },
      {
        "name": "Cabbage",
        "quantity": 0.5,
        "unit": "cup",
        "category": "produce"
      },
      {
        "name": "Garam Masala",
        "quantity": 0.5,
        "unit": "tsp",
        "category": "spices"
      },
      {
        "name": "Red Chilli Powder",
        "quantity": 0.5,
        "unit": "tsp",
        "category": "spices"
      },
      {
        "name": "Salt",
        "quantity": 0.5,
        "unit": "tsp",
        "category": "pantry"
      },
      {
        "name": "Oil",
        "quantity": 1,
        "unit": "tbsp",
        "category": "pantry"
      },
      {
        "name": "Green Chutney",
        "quantity": 2,
        "unit": "tbsp",
        "category": "pantry"
      }
    ],
    "veg-roll": [
      {
        "name": "Roti",
        "quantity": 4,
        "unit": "pcs",
        "category": "grains"
      },
      {
        "name": "Mixed Vegetables",
        "quantity": 1,
        "unit": "cup",
        "category": "produce"
      },
      {
        "name": "Oil",
        "quantity": 1,
        "unit": "tbsp",
        "category": "pantry"
      },
      {
        "name": "Salt",
        "quantity": 0.5,
        "unit": "tsp",
        "category": "pantry"
      },
      {
        "name": "Red Chili Powder",
        "quantity": 0.25,
        "unit": "tsp",
        "category": "spices"
      },
      {
        "name": "Coriander Leaves",
        "quantity": 0.25,
        "unit": "cup",
        "category": "produce"
      }
    ],
    "papdi-chaat": [
      {
        "name": "Papdi",
        "quantity": 1,
        "unit": "cup",
        "category": "snacks"
      },
      {
        "name": "Yogurt",
        "quantity": 0.5,
        "unit": "cup",
        "category": "dairy"
      },
      {
        "name": "Tamarind Chutney",
        "quantity": 2,
        "unit": "tbsp",
        "category": "pantry"
      },
      {
        "name": "Onion",
        "quantity": 0.5,
        "unit": "pc",
        "category": "produce"
      },
      {
        "name": "Chaat Masala",
        "quantity": 0.5,
        "unit": "tsp",
        "category": "spices"
      },
      {
        "name": "Coriander Leaves",
        "quantity": 0.25,
        "unit": "cup",
        "category": "produce"
      },
      {
        "name": "Salt",
        "quantity": 0.5,
        "unit": "tsp",
        "category": "pantry"
      },
      {
        "name": "Lemon Juice",
        "quantity": 1,
        "unit": "tbsp",
        "category": "pantry"
      }
    ],
    "dahi-puri": [
      {
        "name": "Puri",
        "quantity": 1,
        "unit": "cup",
        "category": "snacks"
      },
      {
        "name": "Yogurt",
        "quantity": 0.5,
        "unit": "cup",
        "category": "dairy"
      },
      {
        "name": "Tamarind Chutney",
        "quantity": 2,
        "unit": "tbsp",
        "category": "pantry"
      },
      {
        "name": "Boondi",
        "quantity": 0.25,
        "unit": "cup",
        "category": "snacks"
      },
      {
        "name": "Chaat Masala",
        "quantity": 0.5,
        "unit": "tsp",
        "category": "spices"
      },
      {
        "name": "Black Salt",
        "quantity": 0.25,
        "unit": "tsp",
        "category": "pantry"
      },
      {
        "name": "Coriander Leaves",
        "quantity": 0.25,
        "unit": "cup",
        "category": "produce"
      },
      {
        "name": "Oil",
        "quantity": 1,
        "unit": "tbsp",
        "category": "pantry"
      }
    ],
    "pani-puri": [
      {
        "name": "Puri",
        "quantity": 1,
        "unit": "cup",
        "category": "snacks"
      },
      {
        "name": "Potato",
        "quantity": 1,
        "unit": "pc",
        "category": "produce"
      },
      {
        "name": "Onion",
        "quantity": 0.5,
        "unit": "pc",
        "category": "produce"
      },
      {
        "name": "Tamarind Chutney",
        "quantity": 2,
        "unit": "tbsp",
        "category": "pantry"
      },
      {
        "name": "Mint",
        "quantity": 0.25,
        "unit": "cup",
        "category": "produce"
      },
      {
        "name": "Coriander Leaves",
        "quantity": 0.25,
        "unit": "cup",
        "category": "produce"
      },
      {
        "name": "Chaat Masala",
        "quantity": 0.5,
        "unit": "tsp",
        "category": "spices"
      },
      {
        "name": "Black Salt",
        "quantity": 0.25,
        "unit": "tsp",
        "category": "pantry"
      },
      {
        "name": "Lemon Juice",
        "quantity": 1,
        "unit": "tbsp",
        "category": "pantry"
      },
      {
        "name": "Water",
        "quantity": 1,
        "unit": "cup",
        "category": "pantry"
      }
    ],
    "gajar-ka-halwa": [
      {
        "name": "Carrots",
        "quantity": 500,
        "unit": "g",
        "category": "produce"
      },
      {
        "name": "Milk",
        "quantity": 500,
        "unit": "ml",
        "category": "dairy"
      },
      {
        "name": "Sugar",
        "quantity": 3,
        "unit": "tbsp",
        "category": "pantry"
      },
      {
        "name": "Ghee",
        "quantity": 2,
        "unit": "tbsp",
        "category": "dairy"
      },
      {
        "name": "Cardamom",
        "quantity": 0.25,
        "unit": "tsp",
        "category": "spices"
      },
      {
        "name": "Almonds",
        "quantity": 2,
        "unit": "tbsp",
        "category": "pantry"
      }
    ],
    "moong-dal-halwa": [
      {
        "name": "Moong Dal",
        "quantity": 150,
        "unit": "g",
        "category": "proteins"
      },
      {
        "name": "Ghee",
        "quantity": 0.5,
        "unit": "cup",
        "category": "dairy"
      },
      {
        "name": "Sugar",
        "quantity": 2,
        "unit": "tbsp",
        "category": "pantry"
      },
      {
        "name": "Milk",
        "quantity": 1,
        "unit": "cup",
        "category": "dairy"
      },
      {
        "name": "Cardamom",
        "quantity": 2,
        "unit": "pods",
        "category": "spices"
      },
      {
        "name": "Pistachios",
        "quantity": 1,
        "unit": "tbsp",
        "category": "pantry"
      },
      {
        "name": "Almonds",
        "quantity": 1,
        "unit": "tbsp",
        "category": "pantry"
      }
    ],
    "plain-lassi": [
      {
        "name": "Yogurt",
        "quantity": 1,
        "unit": "cup",
        "category": "dairy"
      },
      {
        "name": "Water",
        "quantity": 0.5,
        "unit": "cup",
        "category": "pantry"
      },
      {
        "name": "Sugar",
        "quantity": 1.5,
        "unit": "tbsp",
        "category": "pantry"
      },
      {
        "name": "Cardamom",
        "quantity": 0.25,
        "unit": "tsp",
        "category": "spices"
      },
      {
        "name": "Ice Cubes",
        "quantity": 4,
        "unit": "pcs",
        "category": "pantry"
      }
    ],
    "north-fruit-chaat": [
      {
        "name": "Apple",
        "quantity": 1,
        "unit": "pc",
        "category": "produce",
        "inStock": false
      },
      {
        "name": "Banana",
        "quantity": 1,
        "unit": "pc",
        "category": "produce",
        "inStock": false
      },
      {
        "name": "Orange",
        "quantity": 1,
        "unit": "pc",
        "category": "produce",
        "inStock": false
      },
      {
        "name": "Mango",
        "quantity": 1,
        "unit": "pc",
        "category": "produce",
        "inStock": false
      },
      {
        "name": "Pomegranate",
        "quantity": 1,
        "unit": "pc",
        "category": "produce",
        "inStock": false
      },
      {
        "name": "Papaya",
        "quantity": 100,
        "unit": "g",
        "category": "produce",
        "inStock": false
      },
      {
        "name": "Watermelon",
        "quantity": 200,
        "unit": "g",
        "category": "produce",
        "inStock": false
      },
      {
        "name": "Grapes",
        "quantity": 100,
        "unit": "g",
        "category": "produce",
        "inStock": false
      },
      {
        "name": "Guava",
        "quantity": 1,
        "unit": "pc",
        "category": "produce",
        "inStock": false
      },
      {
        "name": "Pineapple",
        "quantity": 100,
        "unit": "g",
        "category": "produce",
        "inStock": false
      },
      {
        "name": "Coconut",
        "quantity": 50,
        "unit": "g",
        "category": "produce",
        "inStock": false
      },
      {
        "name": "Potatoes",
        "quantity": 2,
        "unit": "pc",
        "category": "produce",
        "inStock": false
      },
      {
        "name": "Yogurt",
        "quantity": 100,
        "unit": "g",
        "category": "dairy",
        "inStock": false
      },
      {
        "name": "Tamarind Chutney",
        "quantity": 30,
        "unit": "g",
        "category": "pantry",
        "inStock": false
      },
      {
        "name": "Mint Chutney",
        "quantity": 30,
        "unit": "g",
        "category": "pantry",
        "inStock": false
      },
      {
        "name": "Ghee",
        "quantity": 2,
        "unit": "tbsp",
        "category": "pantry",
        "inStock": false
      },
      {
        "name": "Oil",
        "quantity": 2,
        "unit": "tbsp",
        "category": "pantry",
        "inStock": false
      },
      {
        "name": "Spices",
        "quantity": 1,
        "unit": "packet",
        "category": "spices",
        "inStock": false
      }
    ],
    "west-fruit-cream": [
      {
        "name": "Shrikhand",
        "quantity": 1,
        "unit": "cup",
        "category": "dairy"
      },
      {
        "name": "Mango",
        "quantity": 1,
        "unit": "pc",
        "category": "produce"
      },
      {
        "name": "Sugar",
        "quantity": 1,
        "unit": "tbsp",
        "category": "pantry"
      },
      {
        "name": "Cardamom",
        "quantity": 0.25,
        "unit": "tsp",
        "category": "spices"
      },
      {
        "name": "Saffron",
        "quantity": 1,
        "unit": "pinch",
        "category": "spices"
      },
      {
        "name": "Pistachios",
        "quantity": 1,
        "unit": "tbsp",
        "category": "pantry"
      }
    ],
    "south-fruit-pachadi": [
      {
        "name": "Apple",
        "quantity": 1,
        "unit": "pc",
        "category": "produce",
        "inStock": false
      },
      {
        "name": "Banana",
        "quantity": 1,
        "unit": "pc",
        "category": "produce",
        "inStock": false
      },
      {
        "name": "Orange",
        "quantity": 1,
        "unit": "pc",
        "category": "produce",
        "inStock": false
      },
      {
        "name": "Mango",
        "quantity": 1,
        "unit": "pc",
        "category": "produce",
        "inStock": false
      },
      {
        "name": "Pomegranate",
        "quantity": 1,
        "unit": "pc",
        "category": "produce",
        "inStock": false
      },
      {
        "name": "Papaya",
        "quantity": 100,
        "unit": "g",
        "category": "produce",
        "inStock": false
      },
      {
        "name": "Watermelon",
        "quantity": 200,
        "unit": "g",
        "category": "produce",
        "inStock": false
      },
      {
        "name": "Grapes",
        "quantity": 100,
        "unit": "g",
        "category": "produce",
        "inStock": false
      },
      {
        "name": "Guava",
        "quantity": 1,
        "unit": "pc",
        "category": "produce",
        "inStock": false
      },
      {
        "name": "Pineapple",
        "quantity": 100,
        "unit": "g",
        "category": "produce",
        "inStock": false
      },
      {
        "name": "Coconut",
        "quantity": 50,
        "unit": "g",
        "category": "produce",
        "inStock": false
      },
      {
        "name": "Ghee",
        "quantity": 2,
        "unit": "tbsp",
        "category": "pantry",
        "inStock": false
      },
      {
        "name": "Oil",
        "quantity": 2,
        "unit": "tbsp",
        "category": "pantry",
        "inStock": false
      },
      {
        "name": "Spices",
        "quantity": 1,
        "unit": "packet",
        "category": "spices",
        "inStock": false
      },
      {
        "name": "Steamed Rice",
        "quantity": 1,
        "unit": "cup",
        "category": "grains",
        "inStock": false
      },
      {
        "name": "Papad",
        "quantity": 1,
        "unit": "pc",
        "category": "produce",
        "inStock": false
      },
      {
        "name": "Onion",
        "quantity": 1,
        "unit": "pc",
        "category": "produce",
        "inStock": false
      },
      {
        "name": "Tomato",
        "quantity": 2,
        "unit": "pc",
        "category": "produce",
        "inStock": false
      },
      {
        "name": "Green Chilli",
        "quantity": 2,
        "unit": "pc",
        "category": "produce",
        "inStock": false
      },
      {
        "name": "Ginger-Garlic Paste",
        "quantity": 1,
        "unit": "tbsp",
        "category": "produce",
        "inStock": false
      },
      {
        "name": "Coriander Leaves",
        "quantity": 0.25,
        "unit": "cup",
        "category": "produce",
        "inStock": false
      },
      {
        "name": "Salt",
        "quantity": 1,
        "unit": "tsp",
        "category": "pantry"
      },
      {
        "name": "Turmeric",
        "quantity": 0.5,
        "unit": "tsp",
        "category": "spices"
      },
      {
        "name": "Curry Leaves",
        "quantity": 1,
        "unit": "sprig",
        "category": "produce"
      },
      {
        "name": "Mustard Seeds",
        "quantity": 1,
        "unit": "tsp",
        "category": "spices"
      },
      {
        "name": "Tamarind",
        "quantity": 1,
        "unit": "tbsp",
        "category": "pantry"
      },
      {
        "name": "Cumin Seeds",
        "quantity": 1,
        "unit": "tsp",
        "category": "spices"
      },
      {
        "name": "Red Chili Powder",
        "quantity": 0.5,
        "unit": "tsp",
        "category": "spices"
      }
    ],
    "east-fruit-payesh": [
      {
        "name": "Milk",
        "quantity": 2,
        "unit": "cup",
        "category": "dairy"
      },
      {
        "name": "Rice",
        "quantity": 0.25,
        "unit": "cup",
        "category": "grains"
      },
      {
        "name": "Sugar",
        "quantity": 0.25,
        "unit": "cup",
        "category": "pantry"
      },
      {
        "name": "Cardamom",
        "quantity": 2,
        "unit": "pods",
        "category": "spices"
      },
      {
        "name": "Mixed Seasonal Fruit",
        "quantity": 1,
        "unit": "cup",
        "category": "produce"
      },
      {
        "name": "Raisins",
        "quantity": 2,
        "unit": "tbsp",
        "category": "pantry"
      },
      {
        "name": "Ghee",
        "quantity": 1,
        "unit": "tbsp",
        "category": "dairy"
      }
    ],
    "mutton-biryani": [
      {
        "name": "Basmati Rice",
        "quantity": 1.5,
        "unit": "cup",
        "category": "grains"
      },
      {
        "name": "Mutton",
        "quantity": 400,
        "unit": "g",
        "category": "proteins"
      },
      {
        "name": "Yogurt",
        "quantity": 0.5,
        "unit": "cup",
        "category": "dairy"
      },
      {
        "name": "Onion",
        "quantity": 2,
        "unit": "pc",
        "category": "produce"
      },
      {
        "name": "Ginger-Garlic Paste",
        "quantity": 2,
        "unit": "tbsp",
        "category": "pantry"
      },
      {
        "name": "Red Chilli Powder",
        "quantity": 1,
        "unit": "tsp",
        "category": "spices"
      },
      {
        "name": "Turmeric",
        "quantity": 0.5,
        "unit": "tsp",
        "category": "spices"
      },
      {
        "name": "Garam Masala",
        "quantity": 1,
        "unit": "tsp",
        "category": "spices"
      },
      {
        "name": "Biryani Masala",
        "quantity": 1,
        "unit": "tbsp",
        "category": "spices"
      },
      {
        "name": "Saffron",
        "quantity": 1,
        "unit": "pinch",
        "category": "spices"
      },
      {
        "name": "Mint",
        "quantity": 0.25,
        "unit": "cup",
        "category": "produce"
      },
      {
        "name": "Coriander Leaves",
        "quantity": 0.25,
        "unit": "cup",
        "category": "produce"
      },
      {
        "name": "Salt",
        "quantity": 2,
        "unit": "tsp",
        "category": "pantry"
      },
      {
        "name": "Ghee",
        "quantity": 2,
        "unit": "tbsp",
        "category": "dairy"
      },
      {
        "name": "Water",
        "quantity": 3,
        "unit": "cup",
        "category": "pantry"
      }
    ],
    "chicken-biryani": [
      {
        "name": "Basmati Rice",
        "quantity": 1.5,
        "unit": "cup",
        "category": "grains"
      },
      {
        "name": "Chicken",
        "quantity": 400,
        "unit": "g",
        "category": "proteins"
      },
      {
        "name": "Yogurt",
        "quantity": 0.5,
        "unit": "cup",
        "category": "dairy"
      },
      {
        "name": "Onion",
        "quantity": 2,
        "unit": "pc",
        "category": "produce"
      },
      {
        "name": "Ginger-Garlic Paste",
        "quantity": 2,
        "unit": "tbsp",
        "category": "pantry"
      },
      {
        "name": "Red Chilli Powder",
        "quantity": 1,
        "unit": "tsp",
        "category": "spices"
      },
      {
        "name": "Turmeric",
        "quantity": 0.5,
        "unit": "tsp",
        "category": "spices"
      },
      {
        "name": "Garam Masala",
        "quantity": 1,
        "unit": "tsp",
        "category": "spices"
      },
      {
        "name": "Biryani Masala",
        "quantity": 1,
        "unit": "tbsp",
        "category": "spices"
      },
      {
        "name": "Saffron",
        "quantity": 1,
        "unit": "pinch",
        "category": "spices"
      },
      {
        "name": "Mint",
        "quantity": 0.25,
        "unit": "cup",
        "category": "produce"
      },
      {
        "name": "Coriander Leaves",
        "quantity": 0.25,
        "unit": "cup",
        "category": "produce"
      },
      {
        "name": "Salt",
        "quantity": 2,
        "unit": "tsp",
        "category": "pantry"
      },
      {
        "name": "Ghee",
        "quantity": 2,
        "unit": "tbsp",
        "category": "dairy"
      },
      {
        "name": "Water",
        "quantity": 3,
        "unit": "cup",
        "category": "pantry"
      }
    ],
    "paneer-biryani": [
      {
        "name": "Basmati Rice",
        "quantity": 1.5,
        "unit": "cup",
        "category": "grains"
      },
      {
        "name": "Paneer",
        "quantity": 200,
        "unit": "g",
        "category": "proteins"
      },
      {
        "name": "Yogurt",
        "quantity": 0.5,
        "unit": "cup",
        "category": "dairy"
      },
      {
        "name": "Onion",
        "quantity": 2,
        "unit": "pc",
        "category": "produce"
      },
      {
        "name": "Ginger-Garlic Paste",
        "quantity": 1,
        "unit": "tbsp",
        "category": "pantry"
      },
      {
        "name": "Red Chilli Powder",
        "quantity": 1,
        "unit": "tsp",
        "category": "spices"
      },
      {
        "name": "Turmeric",
        "quantity": 0.5,
        "unit": "tsp",
        "category": "spices"
      },
      {
        "name": "Garam Masala",
        "quantity": 1,
        "unit": "tsp",
        "category": "spices"
      },
      {
        "name": "Biryani Masala",
        "quantity": 1,
        "unit": "tbsp",
        "category": "spices"
      },
      {
        "name": "Mint",
        "quantity": 0.25,
        "unit": "cup",
        "category": "produce"
      },
      {
        "name": "Coriander Leaves",
        "quantity": 0.25,
        "unit": "cup",
        "category": "produce"
      },
      {
        "name": "Salt",
        "quantity": 2,
        "unit": "tsp",
        "category": "pantry"
      },
      {
        "name": "Ghee",
        "quantity": 2,
        "unit": "tbsp",
        "category": "dairy"
      },
      {
        "name": "Water",
        "quantity": 3,
        "unit": "cup",
        "category": "pantry"
      }
    ],
    "kashmiri-biryani": [
      {
        "name": "Rice",
        "quantity": 1,
        "unit": "cup",
        "category": "grains"
      },
      {
        "name": "Chicken",
        "quantity": 250,
        "unit": "g",
        "category": "proteins"
      },
      {
        "name": "Onion",
        "quantity": 2,
        "unit": "pcs",
        "category": "produce"
      },
      {
        "name": "Yogurt",
        "quantity": 100,
        "unit": "g",
        "category": "dairy"
      },
      {
        "name": "Ginger-Garlic Paste",
        "quantity": 1,
        "unit": "tbsp",
        "category": "pantry"
      },
      {
        "name": "Biryani Masala",
        "quantity": 1,
        "unit": "tbsp",
        "category": "spices"
      },
      {
        "name": "Green Chilli",
        "quantity": 2,
        "unit": "pcs",
        "category": "produce"
      },
      {
        "name": "Cardamom",
        "quantity": 3,
        "unit": "pods",
        "category": "spices"
      },
      {
        "name": "Cloves",
        "quantity": 3,
        "unit": "pcs",
        "category": "spices"
      },
      {
        "name": "Cinnamon",
        "quantity": 1,
        "unit": "stick",
        "category": "spices"
      },
      {
        "name": "Bay Leaf",
        "quantity": 1,
        "unit": "pc",
        "category": "spices"
      },
      {
        "name": "Turmeric",
        "quantity": 0.5,
        "unit": "tsp",
        "category": "spices"
      },
      {
        "name": "Salt",
        "quantity": 1,
        "unit": "tsp",
        "category": "pantry"
      },
      {
        "name": "Saffron",
        "quantity": 0.25,
        "unit": "tsp",
        "category": "spices"
      },
      {
        "name": "Ghee",
        "quantity": 2,
        "unit": "tbsp",
        "category": "dairy"
      },
      {
        "name": "Oil",
        "quantity": 2,
        "unit": "tbsp",
        "category": "pantry"
      },
      {
        "name": "Mint Leaves",
        "quantity": 0.25,
        "unit": "cup",
        "category": "produce"
      }
    ],
    "lucknowi-biryani": [
      {
        "name": "Rice",
        "quantity": 1,
        "unit": "cup",
        "category": "grains"
      },
      {
        "name": "Chicken",
        "quantity": 250,
        "unit": "g",
        "category": "proteins"
      },
      {
        "name": "Onion",
        "quantity": 2,
        "unit": "pcs",
        "category": "produce"
      },
      {
        "name": "Yogurt",
        "quantity": 100,
        "unit": "g",
        "category": "dairy"
      },
      {
        "name": "Ginger-Garlic Paste",
        "quantity": 1,
        "unit": "tbsp",
        "category": "pantry"
      },
      {
        "name": "Biryani Masala",
        "quantity": 1,
        "unit": "tbsp",
        "category": "spices"
      },
      {
        "name": "Cardamom",
        "quantity": 4,
        "unit": "pods",
        "category": "spices"
      },
      {
        "name": "Cinnamon",
        "quantity": 1,
        "unit": "stick",
        "category": "spices"
      },
      {
        "name": "Cloves",
        "quantity": 3,
        "unit": "pcs",
        "category": "spices"
      },
      {
        "name": "Bay Leaf",
        "quantity": 1,
        "unit": "pc",
        "category": "spices"
      },
      {
        "name": "Saffron",
        "quantity": 0.25,
        "unit": "tsp",
        "category": "spices"
      },
      {
        "name": "Mint Leaves",
        "quantity": 0.25,
        "unit": "cup",
        "category": "produce"
      },
      {
        "name": "Salt",
        "quantity": 1,
        "unit": "tsp",
        "category": "pantry"
      },
      {
        "name": "Ghee",
        "quantity": 2,
        "unit": "tbsp",
        "category": "dairy"
      },
      {
        "name": "Oil",
        "quantity": 2,
        "unit": "tbsp",
        "category": "pantry"
      }
    ],
    "paneer-pulao": [
      {
        "name": "Basmati Rice",
        "quantity": 1,
        "unit": "cup",
        "category": "grains"
      },
      {
        "name": "Paneer",
        "quantity": 150,
        "unit": "g",
        "category": "proteins"
      },
      {
        "name": "Ghee",
        "quantity": 2,
        "unit": "tbsp",
        "category": "dairy"
      },
      {
        "name": "Cumin Seeds",
        "quantity": 1,
        "unit": "tsp",
        "category": "spices"
      },
      {
        "name": "Bay Leaf",
        "quantity": 1,
        "unit": "pc",
        "category": "spices"
      },
      {
        "name": "Cloves",
        "quantity": 2,
        "unit": "pc",
        "category": "spices"
      },
      {
        "name": "Cardamom",
        "quantity": 2,
        "unit": "pods",
        "category": "spices"
      },
      {
        "name": "Cinnamon",
        "quantity": 1,
        "unit": "inch",
        "category": "spices"
      },
      {
        "name": "Onion",
        "quantity": 0.5,
        "unit": "pc",
        "category": "produce"
      },
      {
        "name": "Green Chilli",
        "quantity": 1,
        "unit": "pc",
        "category": "produce"
      },
      {
        "name": "Salt",
        "quantity": 1,
        "unit": "tsp",
        "category": "pantry"
      },
      {
        "name": "Water",
        "quantity": 2,
        "unit": "cup",
        "category": "pantry"
      },
      {
        "name": "Coriander Leaves",
        "quantity": 0.25,
        "unit": "cup",
        "category": "produce"
      }
    ],
    "mushroom-pulao": [
      {
        "name": "Basmati Rice",
        "quantity": 1,
        "unit": "cup",
        "category": "grains"
      },
      {
        "name": "Mushrooms",
        "quantity": 150,
        "unit": "g",
        "category": "produce"
      },
      {
        "name": "Onion",
        "quantity": 1,
        "unit": "pc",
        "category": "produce"
      },
      {
        "name": "Green Chilli",
        "quantity": 1,
        "unit": "pc",
        "category": "produce"
      },
      {
        "name": "Ginger",
        "quantity": 0.5,
        "unit": "inch",
        "category": "produce"
      },
      {
        "name": "Garlic",
        "quantity": 3,
        "unit": "cloves",
        "category": "produce"
      },
      {
        "name": "Cumin Seeds",
        "quantity": 1,
        "unit": "tsp",
        "category": "spices"
      },
      {
        "name": "Garam Masala",
        "quantity": 0.5,
        "unit": "tsp",
        "category": "spices"
      },
      {
        "name": "Salt",
        "quantity": 1,
        "unit": "tsp",
        "category": "pantry"
      },
      {
        "name": "Oil",
        "quantity": 2,
        "unit": "tbsp",
        "category": "pantry"
      },
      {
        "name": "Water",
        "quantity": 2,
        "unit": "cup",
        "category": "pantry"
      },
      {
        "name": "Coriander Leaves",
        "quantity": 0.25,
        "unit": "cup",
        "category": "produce"
      }
    ],
    "dal-makhni-wala": [
      {
        "name": "Whole Black Urad Dal",
        "quantity": 0.75,
        "unit": "cup",
        "category": "proteins"
      },
      {
        "name": "Kidney Beans",
        "quantity": 0.25,
        "unit": "cup",
        "category": "proteins"
      },
      {
        "name": "Butter",
        "quantity": 2,
        "unit": "tbsp",
        "category": "dairy"
      },
      {
        "name": "Cream",
        "quantity": 2,
        "unit": "tbsp",
        "category": "dairy"
      },
      {
        "name": "Tomato",
        "quantity": 2,
        "unit": "pcs",
        "category": "produce"
      },
      {
        "name": "Ginger-Garlic Paste",
        "quantity": 1,
        "unit": "tbsp",
        "category": "pantry"
      },
      {
        "name": "Salt",
        "quantity": 1,
        "unit": "tsp",
        "category": "pantry"
      },
      {
        "name": "Red Chili Powder",
        "quantity": 0.5,
        "unit": "tsp",
        "category": "spices"
      },
      {
        "name": "Garam Masala",
        "quantity": 0.5,
        "unit": "tsp",
        "category": "spices"
      },
      {
        "name": "Coriander Leaves",
        "quantity": 0.25,
        "unit": "cup",
        "category": "produce"
      },
      {
        "name": "Mixed Dal",
        "quantity": 80,
        "unit": "g",
        "category": "proteins",
        "inStock": false
      }
    ],
    "shammi-kebab": [
      {
        "name": "Mutton",
        "quantity": 400,
        "unit": "g",
        "category": "proteins"
      },
      {
        "name": "Chana Dal",
        "quantity": 0.5,
        "unit": "cup",
        "category": "proteins"
      },
      {
        "name": "Onion",
        "quantity": 1,
        "unit": "pc",
        "category": "produce"
      },
      {
        "name": "Ginger-Garlic Paste",
        "quantity": 1,
        "unit": "tbsp",
        "category": "pantry"
      },
      {
        "name": "Green Chilli",
        "quantity": 2,
        "unit": "pc",
        "category": "produce"
      },
      {
        "name": "Garam Masala",
        "quantity": 1,
        "unit": "tsp",
        "category": "spices"
      },
      {
        "name": "Red Chilli Powder",
        "quantity": 0.5,
        "unit": "tsp",
        "category": "spices"
      },
      {
        "name": "Mint",
        "quantity": 0.25,
        "unit": "cup",
        "category": "produce"
      },
      {
        "name": "Coriander Leaves",
        "quantity": 0.25,
        "unit": "cup",
        "category": "produce"
      },
      {
        "name": "Salt",
        "quantity": 1,
        "unit": "tsp",
        "category": "pantry"
      },
      {
        "name": "Oil",
        "quantity": 2,
        "unit": "tbsp",
        "category": "pantry"
      },
      {
        "name": "Egg",
        "quantity": 1,
        "unit": "pc",
        "category": "proteins"
      }
    ],
    "galouti-kebab": [
      {
        "name": "Mutton",
        "quantity": 400,
        "unit": "g",
        "category": "proteins"
      },
      {
        "name": "Yogurt",
        "quantity": 0.25,
        "unit": "cup",
        "category": "dairy"
      },
      {
        "name": "Ginger-Garlic Paste",
        "quantity": 1,
        "unit": "tbsp",
        "category": "pantry"
      },
      {
        "name": "Green Chilli",
        "quantity": 1,
        "unit": "pc",
        "category": "produce"
      },
      {
        "name": "Garam Masala",
        "quantity": 1,
        "unit": "tsp",
        "category": "spices"
      },
      {
        "name": "Cardamom Powder",
        "quantity": 0.5,
        "unit": "tsp",
        "category": "spices"
      },
      {
        "name": "Rose Water",
        "quantity": 1,
        "unit": "tsp",
        "category": "pantry"
      },
      {
        "name": "Saffron",
        "quantity": 1,
        "unit": "pinch",
        "category": "spices"
      },
      {
        "name": "Salt",
        "quantity": 1,
        "unit": "tsp",
        "category": "pantry"
      },
      {
        "name": "Ghee",
        "quantity": 2,
        "unit": "tbsp",
        "category": "dairy"
      }
    ],
    "tandoori-chicken": [
      {
        "name": "Chicken",
        "quantity": 500,
        "unit": "g",
        "category": "proteins"
      },
      {
        "name": "Yogurt",
        "quantity": 1,
        "unit": "cup",
        "category": "dairy"
      },
      {
        "name": "Lemon Juice",
        "quantity": 2,
        "unit": "tbsp",
        "category": "pantry"
      },
      {
        "name": "Ginger-Garlic Paste",
        "quantity": 2,
        "unit": "tbsp",
        "category": "pantry"
      },
      {
        "name": "Red Chilli Powder",
        "quantity": 1,
        "unit": "tbsp",
        "category": "spices"
      },
      {
        "name": "Turmeric",
        "quantity": 1,
        "unit": "tsp",
        "category": "spices"
      },
      {
        "name": "Garam Masala",
        "quantity": 1,
        "unit": "tsp",
        "category": "spices"
      },
      {
        "name": "Cumin Powder",
        "quantity": 1,
        "unit": "tsp",
        "category": "spices"
      },
      {
        "name": "Coriander Powder",
        "quantity": 1,
        "unit": "tsp",
        "category": "spices"
      },
      {
        "name": "Kasuri Methi",
        "quantity": 1,
        "unit": "tbsp",
        "category": "spices"
      },
      {
        "name": "Salt",
        "quantity": 2,
        "unit": "tsp",
        "category": "pantry"
      },
      {
        "name": "Oil",
        "quantity": 2,
        "unit": "tbsp",
        "category": "pantry"
      },
      {
        "name": "Onion",
        "quantity": 1,
        "unit": "pc",
        "category": "produce"
      },
      {
        "name": "Lemon",
        "quantity": 1,
        "unit": "pc",
        "category": "produce"
      }
    ],
    "chicken-tikka": [
      {
        "name": "Chicken",
        "quantity": 500,
        "unit": "g",
        "category": "proteins"
      },
      {
        "name": "Yogurt",
        "quantity": 1,
        "unit": "cup",
        "category": "dairy"
      },
      {
        "name": "Lemon Juice",
        "quantity": 2,
        "unit": "tbsp",
        "category": "pantry"
      },
      {
        "name": "Ginger-Garlic Paste",
        "quantity": 2,
        "unit": "tbsp",
        "category": "pantry"
      },
      {
        "name": "Red Chilli Powder",
        "quantity": 1,
        "unit": "tbsp",
        "category": "spices"
      },
      {
        "name": "Turmeric",
        "quantity": 1,
        "unit": "tsp",
        "category": "spices"
      },
      {
        "name": "Garam Masala",
        "quantity": 1,
        "unit": "tsp",
        "category": "spices"
      },
      {
        "name": "Cumin Powder",
        "quantity": 1,
        "unit": "tsp",
        "category": "spices"
      },
      {
        "name": "Coriander Powder",
        "quantity": 1,
        "unit": "tsp",
        "category": "spices"
      },
      {
        "name": "Kasuri Methi",
        "quantity": 1,
        "unit": "tbsp",
        "category": "spices"
      },
      {
        "name": "Salt",
        "quantity": 2,
        "unit": "tsp",
        "category": "pantry"
      },
      {
        "name": "Oil",
        "quantity": 2,
        "unit": "tbsp",
        "category": "pantry"
      },
      {
        "name": "Onion",
        "quantity": 1,
        "unit": "pc",
        "category": "produce"
      },
      {
        "name": "Lemon",
        "quantity": 1,
        "unit": "pc",
        "category": "produce"
      }
    ],
    "seekh-kebab": [
      {
        "name": "Mutton",
        "quantity": 400,
        "unit": "g",
        "category": "proteins"
      },
      {
        "name": "Onion",
        "quantity": 1,
        "unit": "pc",
        "category": "produce"
      },
      {
        "name": "Ginger-Garlic Paste",
        "quantity": 1,
        "unit": "tbsp",
        "category": "pantry"
      },
      {
        "name": "Green Chilli",
        "quantity": 2,
        "unit": "pc",
        "category": "produce"
      },
      {
        "name": "Garam Masala",
        "quantity": 1,
        "unit": "tsp",
        "category": "spices"
      },
      {
        "name": "Coriander Powder",
        "quantity": 1,
        "unit": "tsp",
        "category": "spices"
      },
      {
        "name": "Cumin Powder",
        "quantity": 1,
        "unit": "tsp",
        "category": "spices"
      },
      {
        "name": "Mint",
        "quantity": 0.25,
        "unit": "cup",
        "category": "produce"
      },
      {
        "name": "Coriander Leaves",
        "quantity": 0.25,
        "unit": "cup",
        "category": "produce"
      },
      {
        "name": "Salt",
        "quantity": 1,
        "unit": "tsp",
        "category": "pantry"
      },
      {
        "name": "Oil",
        "quantity": 1,
        "unit": "tbsp",
        "category": "pantry"
      },
      {
        "name": "Naan",
        "quantity": 2,
        "unit": "pc",
        "category": "breads"
      }
    ],
    "butter-chicken-wala": [
      {
        "name": "Chicken",
        "quantity": 200,
        "unit": "g",
        "category": "proteins",
        "inStock": false
      },
      {
        "name": "Ghee",
        "quantity": 2,
        "unit": "tbsp",
        "category": "pantry",
        "inStock": false
      },
      {
        "name": "Oil",
        "quantity": 2,
        "unit": "tbsp",
        "category": "pantry",
        "inStock": false
      },
      {
        "name": "Spices",
        "quantity": 1,
        "unit": "packet",
        "category": "spices",
        "inStock": false
      },
      {
        "name": "Onion",
        "quantity": 1,
        "unit": "pc",
        "category": "produce",
        "inStock": false
      },
      {
        "name": "Tomato",
        "quantity": 2,
        "unit": "pc",
        "category": "produce",
        "inStock": false
      },
      {
        "name": "Green Chilli",
        "quantity": 2,
        "unit": "pc",
        "category": "produce",
        "inStock": false
      },
      {
        "name": "Ginger-Garlic Paste",
        "quantity": 1,
        "unit": "tbsp",
        "category": "produce",
        "inStock": false
      },
      {
        "name": "Coriander Leaves",
        "quantity": 0.25,
        "unit": "cup",
        "category": "produce",
        "inStock": false
      },
      {
        "name": "Salt",
        "quantity": 1,
        "unit": "tsp",
        "category": "pantry"
      },
      {
        "name": "Turmeric",
        "quantity": 0.5,
        "unit": "tsp",
        "category": "spices"
      },
      {
        "name": "Cumin Seeds",
        "quantity": 1,
        "unit": "tsp",
        "category": "spices"
      },
      {
        "name": "Red Chili Powder",
        "quantity": 0.5,
        "unit": "tsp",
        "category": "spices"
      }
    ],
    "kadhi-khakra": [
      {
        "name": "Yogurt",
        "quantity": 200,
        "unit": "g",
        "category": "dairy",
        "inStock": false
      },
      {
        "name": "Gram Flour",
        "quantity": 50,
        "unit": "g",
        "category": "grains",
        "inStock": false
      },
      {
        "name": "Ghee",
        "quantity": 2,
        "unit": "tbsp",
        "category": "pantry",
        "inStock": false
      },
      {
        "name": "Oil",
        "quantity": 2,
        "unit": "tbsp",
        "category": "pantry",
        "inStock": false
      },
      {
        "name": "Spices",
        "quantity": 1,
        "unit": "packet",
        "category": "spices",
        "inStock": false
      }
    ],
    "chicken-65": [
      {
        "name": "Chicken",
        "quantity": 200,
        "unit": "g",
        "category": "proteins",
        "inStock": false
      },
      {
        "name": "Ghee",
        "quantity": 2,
        "unit": "tbsp",
        "category": "pantry",
        "inStock": false
      },
      {
        "name": "Oil",
        "quantity": 2,
        "unit": "tbsp",
        "category": "pantry",
        "inStock": false
      },
      {
        "name": "Spices",
        "quantity": 1,
        "unit": "packet",
        "category": "spices",
        "inStock": false
      },
      {
        "name": "Salt",
        "quantity": 1,
        "unit": "tsp",
        "category": "pantry"
      },
      {
        "name": "Turmeric",
        "quantity": 0.5,
        "unit": "tsp",
        "category": "spices"
      },
      {
        "name": "Coconut",
        "quantity": 0.5,
        "unit": "cup",
        "category": "produce"
      },
      {
        "name": "Curry Leaves",
        "quantity": 1,
        "unit": "sprig",
        "category": "produce"
      },
      {
        "name": "Mustard Seeds",
        "quantity": 1,
        "unit": "tsp",
        "category": "spices"
      },
      {
        "name": "Tamarind",
        "quantity": 1,
        "unit": "tbsp",
        "category": "pantry"
      }
    ],
    "andhra-prawn-masala-2": [
      {
        "name": "Fish",
        "quantity": 150,
        "unit": "g",
        "category": "proteins",
        "inStock": false
      },
      {
        "name": "Prawns",
        "quantity": 200,
        "unit": "g",
        "category": "proteins",
        "inStock": false
      },
      {
        "name": "Ghee",
        "quantity": 2,
        "unit": "tbsp",
        "category": "pantry",
        "inStock": false
      },
      {
        "name": "Oil",
        "quantity": 2,
        "unit": "tbsp",
        "category": "pantry",
        "inStock": false
      },
      {
        "name": "Spices",
        "quantity": 1,
        "unit": "packet",
        "category": "spices",
        "inStock": false
      },
      {
        "name": "Onion",
        "quantity": 1,
        "unit": "pc",
        "category": "produce",
        "inStock": false
      },
      {
        "name": "Tomato",
        "quantity": 2,
        "unit": "pc",
        "category": "produce",
        "inStock": false
      },
      {
        "name": "Green Chilli",
        "quantity": 2,
        "unit": "pc",
        "category": "produce",
        "inStock": false
      },
      {
        "name": "Ginger-Garlic Paste",
        "quantity": 1,
        "unit": "tbsp",
        "category": "produce",
        "inStock": false
      },
      {
        "name": "Coriander Leaves",
        "quantity": 0.25,
        "unit": "cup",
        "category": "produce",
        "inStock": false
      },
      {
        "name": "Salt",
        "quantity": 1,
        "unit": "tsp",
        "category": "pantry"
      },
      {
        "name": "Turmeric",
        "quantity": 0.5,
        "unit": "tsp",
        "category": "spices"
      },
      {
        "name": "Coconut",
        "quantity": 0.5,
        "unit": "cup",
        "category": "produce"
      },
      {
        "name": "Curry Leaves",
        "quantity": 1,
        "unit": "sprig",
        "category": "produce"
      },
      {
        "name": "Mustard Seeds",
        "quantity": 1,
        "unit": "tsp",
        "category": "spices"
      },
      {
        "name": "Tamarind",
        "quantity": 1,
        "unit": "tbsp",
        "category": "pantry"
      },
      {
        "name": "Cumin Seeds",
        "quantity": 1,
        "unit": "tsp",
        "category": "spices"
      },
      {
        "name": "Red Chili Powder",
        "quantity": 0.5,
        "unit": "tsp",
        "category": "spices"
      }
    ],
    "kerala-fish-fry": [
      {
        "name": "Fish",
        "quantity": 150,
        "unit": "g",
        "category": "proteins",
        "inStock": false
      },
      {
        "name": "Ghee",
        "quantity": 2,
        "unit": "tbsp",
        "category": "pantry",
        "inStock": false
      },
      {
        "name": "Oil",
        "quantity": 2,
        "unit": "tbsp",
        "category": "pantry",
        "inStock": false
      },
      {
        "name": "Spices",
        "quantity": 1,
        "unit": "packet",
        "category": "spices",
        "inStock": false
      },
      {
        "name": "Onion",
        "quantity": 1,
        "unit": "pc",
        "category": "produce",
        "inStock": false
      },
      {
        "name": "Tomato",
        "quantity": 2,
        "unit": "pc",
        "category": "produce",
        "inStock": false
      },
      {
        "name": "Green Chilli",
        "quantity": 2,
        "unit": "pc",
        "category": "produce",
        "inStock": false
      },
      {
        "name": "Ginger-Garlic Paste",
        "quantity": 1,
        "unit": "tbsp",
        "category": "produce",
        "inStock": false
      },
      {
        "name": "Coriander Leaves",
        "quantity": 0.25,
        "unit": "cup",
        "category": "produce",
        "inStock": false
      },
      {
        "name": "Salt",
        "quantity": 1,
        "unit": "tsp",
        "category": "pantry"
      },
      {
        "name": "Turmeric",
        "quantity": 0.5,
        "unit": "tsp",
        "category": "spices"
      },
      {
        "name": "Coconut",
        "quantity": 0.5,
        "unit": "cup",
        "category": "produce"
      },
      {
        "name": "Curry Leaves",
        "quantity": 1,
        "unit": "sprig",
        "category": "produce"
      },
      {
        "name": "Mustard Seeds",
        "quantity": 1,
        "unit": "tsp",
        "category": "spices"
      },
      {
        "name": "Tamarind",
        "quantity": 1,
        "unit": "tbsp",
        "category": "pantry"
      }
    ],
    "kuzhambu": [
      {
        "name": "Oil",
        "quantity": 2,
        "unit": "tbsp",
        "category": "pantry",
        "inStock": false
      },
      {
        "name": "Spices",
        "quantity": 1,
        "unit": "packet",
        "category": "spices",
        "inStock": false
      },
      {
        "name": "Onion",
        "quantity": 1,
        "unit": "pc",
        "category": "produce",
        "inStock": false
      },
      {
        "name": "Tomato",
        "quantity": 2,
        "unit": "pc",
        "category": "produce",
        "inStock": false
      },
      {
        "name": "Green Chilli",
        "quantity": 2,
        "unit": "pc",
        "category": "produce",
        "inStock": false
      },
      {
        "name": "Ginger-Garlic Paste",
        "quantity": 1,
        "unit": "tbsp",
        "category": "produce",
        "inStock": false
      },
      {
        "name": "Coriander Leaves",
        "quantity": 0.25,
        "unit": "cup",
        "category": "produce",
        "inStock": false
      },
      {
        "name": "Salt",
        "quantity": 1,
        "unit": "tsp",
        "category": "pantry"
      },
      {
        "name": "Turmeric",
        "quantity": 0.5,
        "unit": "tsp",
        "category": "spices"
      },
      {
        "name": "Coconut",
        "quantity": 0.5,
        "unit": "cup",
        "category": "produce"
      },
      {
        "name": "Curry Leaves",
        "quantity": 1,
        "unit": "sprig",
        "category": "produce"
      },
      {
        "name": "Mustard Seeds",
        "quantity": 1,
        "unit": "tsp",
        "category": "spices"
      },
      {
        "name": "Tamarind",
        "quantity": 1,
        "unit": "tbsp",
        "category": "pantry"
      },
      {
        "name": "Cumin Seeds",
        "quantity": 1,
        "unit": "tsp",
        "category": "spices"
      },
      {
        "name": "Red Chili Powder",
        "quantity": 0.5,
        "unit": "tsp",
        "category": "spices"
      }
    ],
    "parotta-kurma": [
      {
        "name": "Maida",
        "quantity": 2,
        "unit": "cup",
        "category": "grains"
      },
      {
        "name": "Potato",
        "quantity": 1,
        "unit": "pc",
        "category": "produce"
      },
      {
        "name": "Onion",
        "quantity": 1,
        "unit": "pc",
        "category": "produce"
      },
      {
        "name": "Tomato",
        "quantity": 2,
        "unit": "pc",
        "category": "produce"
      },
      {
        "name": "Coconut",
        "quantity": 0.25,
        "unit": "cup",
        "category": "produce"
      },
      {
        "name": "Curry Leaves",
        "quantity": 1,
        "unit": "sprig",
        "category": "produce"
      },
      {
        "name": "Green Chilli",
        "quantity": 1,
        "unit": "pc",
        "category": "produce"
      },
      {
        "name": "Turmeric",
        "quantity": 0.5,
        "unit": "tsp",
        "category": "spices"
      },
      {
        "name": "Salt",
        "quantity": 1,
        "unit": "tsp",
        "category": "pantry"
      },
      {
        "name": "Oil",
        "quantity": 2,
        "unit": "tbsp",
        "category": "pantry"
      }
    ],
    "appam-stew": [
      {
        "name": "Chicken",
        "quantity": 200,
        "unit": "g",
        "category": "proteins"
      },
      {
        "name": "Onion",
        "quantity": 1,
        "unit": "pc",
        "category": "produce"
      },
      {
        "name": "Green Chilli",
        "quantity": 2,
        "unit": "pcs",
        "category": "produce"
      },
      {
        "name": "Ginger",
        "quantity": 1,
        "unit": "inch",
        "category": "produce"
      },
      {
        "name": "Garlic",
        "quantity": 3,
        "unit": "pcs",
        "category": "produce"
      },
      {
        "name": "Coconut Milk",
        "quantity": 1,
        "unit": "cup",
        "category": "pantry"
      },
      {
        "name": "Cinnamon",
        "quantity": 1,
        "unit": "stick",
        "category": "spices"
      },
      {
        "name": "Cardamom",
        "quantity": 2,
        "unit": "pods",
        "category": "spices"
      },
      {
        "name": "Cloves",
        "quantity": 2,
        "unit": "pcs",
        "category": "spices"
      },
      {
        "name": "Salt",
        "quantity": 1,
        "unit": "tsp",
        "category": "pantry"
      }
    ],
    "idiyappam": [
      {
        "name": "Rice Flour",
        "quantity": 1,
        "unit": "cup",
        "category": "grains"
      },
      {
        "name": "Water",
        "quantity": 1,
        "unit": "cup",
        "category": "pantry"
      },
      {
        "name": "Salt",
        "quantity": 0.5,
        "unit": "tsp",
        "category": "pantry"
      },
      {
        "name": "Coconut Milk",
        "quantity": 0.5,
        "unit": "cup",
        "category": "pantry"
      },
      {
        "name": "Jaggery",
        "quantity": 2,
        "unit": "tbsp",
        "category": "pantry"
      }
    ],
    "pongal": [
      {
        "name": "Rice",
        "quantity": 1,
        "unit": "cup",
        "category": "grains"
      },
      {
        "name": "Moong Dal",
        "quantity": 0.5,
        "unit": "cup",
        "category": "proteins"
      },
      {
        "name": "Ginger",
        "quantity": 0.5,
        "unit": "inch",
        "category": "produce"
      },
      {
        "name": "Green Chilli",
        "quantity": 1,
        "unit": "pc",
        "category": "produce"
      },
      {
        "name": "Curry Leaves",
        "quantity": 3,
        "unit": "pcs",
        "category": "produce"
      },
      {
        "name": "Black Pepper",
        "quantity": 0.5,
        "unit": "tsp",
        "category": "spices"
      },
      {
        "name": "Cumin Seeds",
        "quantity": 0.5,
        "unit": "tsp",
        "category": "spices"
      },
      {
        "name": "Ghee",
        "quantity": 1,
        "unit": "tbsp",
        "category": "dairy"
      },
      {
        "name": "Salt",
        "quantity": 0.5,
        "unit": "tsp",
        "category": "pantry"
      }
    ],
    "uttapam-pizza": [
      {
        "name": "Pizza Sauce",
        "quantity": 0.5,
        "unit": "cup",
        "category": "pantry",
        "inStock": false
      },
      {
        "name": "Mozzarella",
        "quantity": 100,
        "unit": "g",
        "category": "dairy",
        "inStock": false
      },
      {
        "name": "Rice",
        "quantity": 1,
        "unit": "cup",
        "category": "grains",
        "inStock": false
      },
      {
        "name": "Urad Dal",
        "quantity": 50,
        "unit": "g",
        "category": "proteins",
        "inStock": false
      },
      {
        "name": "Ghee",
        "quantity": 2,
        "unit": "tbsp",
        "category": "pantry",
        "inStock": false
      },
      {
        "name": "Oil",
        "quantity": 2,
        "unit": "tbsp",
        "category": "pantry",
        "inStock": false
      },
      {
        "name": "Spices",
        "quantity": 1,
        "unit": "packet",
        "category": "spices",
        "inStock": false
      }
    ],
    "bombay-grill-sandwich": [
      {
        "name": "White Bread",
        "quantity": 4,
        "unit": "slices",
        "category": "breads",
        "inStock": false
      },
      {
        "name": "Bread",
        "quantity": 2,
        "unit": "pc",
        "category": "breads",
        "inStock": false
      },
      {
        "name": "Ghee",
        "quantity": 2,
        "unit": "tbsp",
        "category": "pantry",
        "inStock": false
      },
      {
        "name": "Oil",
        "quantity": 2,
        "unit": "tbsp",
        "category": "pantry",
        "inStock": false
      },
      {
        "name": "Spices",
        "quantity": 1,
        "unit": "packet",
        "category": "spices",
        "inStock": false
      },
      {
        "name": "Salt",
        "quantity": 1,
        "unit": "tsp",
        "category": "pantry"
      },
      {
        "name": "Turmeric",
        "quantity": 0.5,
        "unit": "tsp",
        "category": "spices"
      },
      {
        "name": "Cumin Seeds",
        "quantity": 1,
        "unit": "tsp",
        "category": "spices"
      },
      {
        "name": "Red Chili Powder",
        "quantity": 0.5,
        "unit": "tsp",
        "category": "spices"
      }
    ],
    "avocado-sandwich": [
      {
        "name": "Avocado",
        "quantity": 1,
        "unit": "pc",
        "category": "produce"
      },
      {
        "name": "Onion",
        "quantity": 1,
        "unit": "pc",
        "category": "produce"
      },
      {
        "name": "Cilantro",
        "quantity": 10,
        "unit": "g",
        "category": "produce"
      },
      {
        "name": "Green Chili",
        "quantity": 1,
        "unit": "pc",
        "category": "produce"
      },
      {
        "name": "Lemon Juice",
        "quantity": 1,
        "unit": "tbsp",
        "category": "pantry"
      },
      {
        "name": "Salt",
        "quantity": 0.5,
        "unit": "tsp",
        "category": "pantry"
      },
      {
        "name": "Black Pepper",
        "quantity": 0.5,
        "unit": "tsp",
        "category": "pantry"
      },
      {
        "name": "Brown Bread",
        "quantity": 2,
        "unit": "pc",
        "category": "breads"
      }
    ],
    "shev-puri": [
      {
        "name": "Puri",
        "quantity": 8,
        "unit": "pcs",
        "category": "breads"
      },
      {
        "name": "Sev",
        "quantity": 0.5,
        "unit": "cup",
        "category": "snacks"
      },
      {
        "name": "Onion",
        "quantity": 0.5,
        "unit": "pc",
        "category": "produce"
      },
      {
        "name": "Tomato",
        "quantity": 1,
        "unit": "pc",
        "category": "produce"
      },
      {
        "name": "Tamarind Chutney",
        "quantity": 2,
        "unit": "tbsp",
        "category": "pantry"
      },
      {
        "name": "Mint Chutney",
        "quantity": 1,
        "unit": "tbsp",
        "category": "pantry"
      },
      {
        "name": "Green Chutney",
        "quantity": 1,
        "unit": "tbsp",
        "category": "pantry"
      },
      {
        "name": "Coriander Leaves",
        "quantity": 0.25,
        "unit": "cup",
        "category": "produce"
      }
    ],
    "sabudana-vada": [
      {
        "name": "Urad Dal",
        "quantity": 100,
        "unit": "g",
        "category": "proteins",
        "inStock": false
      },
      {
        "name": "Curry Leaves",
        "quantity": 10,
        "unit": "pc",
        "category": "produce",
        "inStock": false
      },
      {
        "name": "Sabudana",
        "quantity": 200,
        "unit": "g",
        "category": "grains",
        "inStock": false
      },
      {
        "name": "Peanuts",
        "quantity": 30,
        "unit": "g",
        "category": "proteins",
        "inStock": false
      },
      {
        "name": "Ghee",
        "quantity": 2,
        "unit": "tbsp",
        "category": "pantry",
        "inStock": false
      },
      {
        "name": "Oil",
        "quantity": 2,
        "unit": "tbsp",
        "category": "pantry",
        "inStock": false
      },
      {
        "name": "Spices",
        "quantity": 1,
        "unit": "packet",
        "category": "spices",
        "inStock": false
      }
    ],
    "kothimbir-vadi": [
      {
        "name": "Coriander Leaves",
        "quantity": 1,
        "unit": "cup",
        "category": "produce"
      },
      {
        "name": "Gram Flour (Besan)",
        "quantity": 1,
        "unit": "cup",
        "category": "grains"
      },
      {
        "name": "Ginger-Garlic Paste",
        "quantity": 1,
        "unit": "tbsp",
        "category": "pantry"
      },
      {
        "name": "Green Chilli",
        "quantity": 2,
        "unit": "pc",
        "category": "produce"
      },
      {
        "name": "Turmeric",
        "quantity": 0.5,
        "unit": "tsp",
        "category": "spices"
      },
      {
        "name": "Sesame Seeds",
        "quantity": 1,
        "unit": "tsp",
        "category": "spices"
      },
      {
        "name": "Salt",
        "quantity": 1,
        "unit": "tsp",
        "category": "pantry"
      },
      {
        "name": "Oil",
        "quantity": 1,
        "unit": "tbsp",
        "category": "pantry"
      }
    ],
    "dalimbo": [
      {
        "name": "Mixed Dal",
        "quantity": 80,
        "unit": "g",
        "category": "proteins",
        "inStock": false
      },
      {
        "name": "Oil",
        "quantity": 2,
        "unit": "tbsp",
        "category": "pantry",
        "inStock": false
      },
      {
        "name": "Spices",
        "quantity": 1,
        "unit": "packet",
        "category": "spices",
        "inStock": false
      },
      {
        "name": "Toor Dal",
        "quantity": 1,
        "unit": "cup",
        "category": "grains",
        "inStock": false
      },
      {
        "name": "Onion",
        "quantity": 1,
        "unit": "pc",
        "category": "produce",
        "inStock": false
      },
      {
        "name": "Tomato",
        "quantity": 2,
        "unit": "pc",
        "category": "produce",
        "inStock": false
      },
      {
        "name": "Green Chilli",
        "quantity": 2,
        "unit": "pc",
        "category": "produce",
        "inStock": false
      },
      {
        "name": "Ginger-Garlic Paste",
        "quantity": 1,
        "unit": "tbsp",
        "category": "produce",
        "inStock": false
      },
      {
        "name": "Coriander Leaves",
        "quantity": 0.25,
        "unit": "cup",
        "category": "produce",
        "inStock": false
      },
      {
        "name": "Salt",
        "quantity": 1,
        "unit": "tsp",
        "category": "pantry"
      },
      {
        "name": "Turmeric",
        "quantity": 0.5,
        "unit": "tsp",
        "category": "spices"
      },
      {
        "name": "Cumin Seeds",
        "quantity": 1,
        "unit": "tsp",
        "category": "spices"
      }
    ],
    "shorshe-ilish": [
      {
        "name": "Hilsa Fish",
        "quantity": 2,
        "unit": "pc",
        "category": "proteins"
      },
      {
        "name": "Yellow Mustard Seeds",
        "quantity": 2,
        "unit": "tbsp",
        "category": "spices"
      },
      {
        "name": "Mustard Oil",
        "quantity": 2,
        "unit": "tbsp",
        "category": "pantry"
      },
      {
        "name": "Green Chilli",
        "quantity": 2,
        "unit": "pc",
        "category": "produce"
      },
      {
        "name": "Turmeric",
        "quantity": 0.5,
        "unit": "tsp",
        "category": "spices"
      },
      {
        "name": "Salt",
        "quantity": 1,
        "unit": "tsp",
        "category": "pantry"
      },
      {
        "name": "Rice",
        "quantity": 1,
        "unit": "cup",
        "category": "grains"
      }
    ],
    "machher-jhol-bengali": [
      {
        "name": "Fish",
        "quantity": 150,
        "unit": "g",
        "category": "proteins",
        "inStock": false
      },
      {
        "name": "Turmeric",
        "quantity": 1,
        "unit": "tsp",
        "category": "spices",
        "inStock": false
      },
      {
        "name": "Ghee",
        "quantity": 2,
        "unit": "tbsp",
        "category": "pantry",
        "inStock": false
      },
      {
        "name": "Oil",
        "quantity": 2,
        "unit": "tbsp",
        "category": "pantry",
        "inStock": false
      },
      {
        "name": "Spices",
        "quantity": 1,
        "unit": "packet",
        "category": "spices",
        "inStock": false
      },
      {
        "name": "Onion",
        "quantity": 1,
        "unit": "pc",
        "category": "produce",
        "inStock": false
      },
      {
        "name": "Tomato",
        "quantity": 2,
        "unit": "pc",
        "category": "produce",
        "inStock": false
      },
      {
        "name": "Green Chilli",
        "quantity": 2,
        "unit": "pc",
        "category": "produce",
        "inStock": false
      },
      {
        "name": "Ginger-Garlic Paste",
        "quantity": 1,
        "unit": "tbsp",
        "category": "produce",
        "inStock": false
      },
      {
        "name": "Coriander Leaves",
        "quantity": 0.25,
        "unit": "cup",
        "category": "produce",
        "inStock": false
      },
      {
        "name": "Salt",
        "quantity": 1,
        "unit": "tsp",
        "category": "pantry"
      },
      {
        "name": "Mustard Oil",
        "quantity": 1,
        "unit": "tbsp",
        "category": "pantry"
      },
      {
        "name": "Cumin Seeds",
        "quantity": 1,
        "unit": "tsp",
        "category": "spices"
      },
      {
        "name": "Red Chili Powder",
        "quantity": 0.5,
        "unit": "tsp",
        "category": "spices"
      }
    ],
    "aloo-bhaja": [
      {
        "name": "Potatoes",
        "quantity": 4,
        "unit": "pc",
        "category": "produce"
      },
      {
        "name": "Turmeric",
        "quantity": 0.5,
        "unit": "tsp",
        "category": "spices"
      },
      {
        "name": "Red Chilli Powder",
        "quantity": 0.25,
        "unit": "tsp",
        "category": "spices"
      },
      {
        "name": "Salt",
        "quantity": 1,
        "unit": "tsp",
        "category": "pantry"
      },
      {
        "name": "Mustard Oil",
        "quantity": 2,
        "unit": "tbsp",
        "category": "pantry"
      },
      {
        "name": "Green Chilli",
        "quantity": 2,
        "unit": "pc",
        "category": "produce"
      }
    ],
    "dim-er-torkaari": [
      {
        "name": "Egg",
        "quantity": 4,
        "unit": "pcs",
        "category": "proteins"
      },
      {
        "name": "Potato",
        "quantity": 1,
        "unit": "pc",
        "category": "produce"
      },
      {
        "name": "Onion",
        "quantity": 1,
        "unit": "pc",
        "category": "produce"
      },
      {
        "name": "Tomato",
        "quantity": 1,
        "unit": "pc",
        "category": "produce"
      },
      {
        "name": "Ginger-Garlic Paste",
        "quantity": 1,
        "unit": "tbsp",
        "category": "pantry"
      },
      {
        "name": "Green Chilli",
        "quantity": 1,
        "unit": "pc",
        "category": "produce"
      },
      {
        "name": "Turmeric",
        "quantity": 0.5,
        "unit": "tsp",
        "category": "spices"
      },
      {
        "name": "Red Chili Powder",
        "quantity": 0.5,
        "unit": "tsp",
        "category": "spices"
      },
      {
        "name": "Salt",
        "quantity": 1,
        "unit": "tsp",
        "category": "pantry"
      },
      {
        "name": "Mustard Oil",
        "quantity": 1,
        "unit": "tbsp",
        "category": "pantry"
      },
      {
        "name": "Rice",
        "quantity": 1,
        "unit": "cup",
        "category": "grains"
      }
    ],
    "dal-poha": [
      {
        "name": "Mixed Dal",
        "quantity": 80,
        "unit": "g",
        "category": "proteins",
        "inStock": false
      },
      {
        "name": "Poha (Flattened Rice)",
        "quantity": 100,
        "unit": "g",
        "category": "grains",
        "inStock": false
      },
      {
        "name": "Peanuts",
        "quantity": 30,
        "unit": "g",
        "category": "proteins",
        "inStock": false
      },
      {
        "name": "Potatoes",
        "quantity": 1,
        "unit": "pc",
        "category": "produce",
        "inStock": false
      },
      {
        "name": "Oil",
        "quantity": 2,
        "unit": "tbsp",
        "category": "pantry",
        "inStock": false
      },
      {
        "name": "Spices",
        "quantity": 1,
        "unit": "packet",
        "category": "spices",
        "inStock": false
      },
      {
        "name": "Toor Dal",
        "quantity": 1,
        "unit": "cup",
        "category": "grains",
        "inStock": false
      },
      {
        "name": "Salt",
        "quantity": 1,
        "unit": "tsp",
        "category": "pantry"
      },
      {
        "name": "Turmeric",
        "quantity": 0.5,
        "unit": "tsp",
        "category": "spices"
      },
      {
        "name": "Cumin Seeds",
        "quantity": 1,
        "unit": "tsp",
        "category": "spices"
      }
    ],
    "besan-mix-veg": [
      {
        "name": "Mixed Vegetables",
        "quantity": 1,
        "unit": "cup",
        "category": "produce",
        "inStock": false
      },
      {
        "name": "Gram Flour",
        "quantity": 100,
        "unit": "g",
        "category": "grains",
        "inStock": false
      },
      {
        "name": "Onions",
        "quantity": 1,
        "unit": "pc",
        "category": "produce",
        "inStock": false
      },
      {
        "name": "Green Chilli",
        "quantity": 2,
        "unit": "pc",
        "category": "produce",
        "inStock": false
      },
      {
        "name": "Oil",
        "quantity": 2,
        "unit": "tbsp",
        "category": "pantry",
        "inStock": false
      },
      {
        "name": "Spices",
        "quantity": 1,
        "unit": "packet",
        "category": "spices",
        "inStock": false
      }
    ],
    "bafla-gravy": [
      {
        "name": "Wheat Flour",
        "quantity": 200,
        "unit": "g",
        "category": "grains",
        "inStock": false
      },
      {
        "name": "Sattu",
        "quantity": 100,
        "unit": "g",
        "category": "grains",
        "inStock": false
      },
      {
        "name": "Oil",
        "quantity": 2,
        "unit": "tbsp",
        "category": "pantry",
        "inStock": false
      },
      {
        "name": "Spices",
        "quantity": 1,
        "unit": "packet",
        "category": "spices",
        "inStock": false
      },
      {
        "name": "Mixed Dal",
        "quantity": 80,
        "unit": "g",
        "category": "proteins",
        "inStock": false
      },
      {
        "name": "Toor Dal",
        "quantity": 1,
        "unit": "cup",
        "category": "grains",
        "inStock": false
      },
      {
        "name": "Onion",
        "quantity": 1,
        "unit": "pc",
        "category": "produce",
        "inStock": false
      },
      {
        "name": "Tomato",
        "quantity": 2,
        "unit": "pc",
        "category": "produce",
        "inStock": false
      },
      {
        "name": "Green Chilli",
        "quantity": 2,
        "unit": "pc",
        "category": "produce",
        "inStock": false
      },
      {
        "name": "Ginger-Garlic Paste",
        "quantity": 1,
        "unit": "tbsp",
        "category": "produce",
        "inStock": false
      },
      {
        "name": "Coriander Leaves",
        "quantity": 0.25,
        "unit": "cup",
        "category": "produce",
        "inStock": false
      },
      {
        "name": "Salt",
        "quantity": 1,
        "unit": "tsp",
        "category": "pantry"
      },
      {
        "name": "Turmeric",
        "quantity": 0.5,
        "unit": "tsp",
        "category": "spices"
      },
      {
        "name": "Cumin Seeds",
        "quantity": 1,
        "unit": "tsp",
        "category": "spices"
      },
      {
        "name": "Red Chili Powder",
        "quantity": 0.5,
        "unit": "tsp",
        "category": "spices"
      },
      {
        "name": "Cumin Seeds",
        "quantity": 1,
        "unit": "tsp",
        "category": "spices"
      }
    ],
    "garlic-chicken": [
      {
        "name": "Chicken",
        "quantity": 200,
        "unit": "g",
        "category": "proteins",
        "inStock": false
      },
      {
        "name": "Ghee",
        "quantity": 2,
        "unit": "tbsp",
        "category": "pantry",
        "inStock": false
      },
      {
        "name": "Oil",
        "quantity": 2,
        "unit": "tbsp",
        "category": "pantry",
        "inStock": false
      },
      {
        "name": "Spices",
        "quantity": 1,
        "unit": "packet",
        "category": "spices",
        "inStock": false
      },
      {
        "name": "Onion",
        "quantity": 1,
        "unit": "pc",
        "category": "produce",
        "inStock": false
      },
      {
        "name": "Tomato",
        "quantity": 2,
        "unit": "pc",
        "category": "produce",
        "inStock": false
      },
      {
        "name": "Green Chilli",
        "quantity": 2,
        "unit": "pc",
        "category": "produce",
        "inStock": false
      },
      {
        "name": "Ginger-Garlic Paste",
        "quantity": 1,
        "unit": "tbsp",
        "category": "produce",
        "inStock": false
      },
      {
        "name": "Coriander Leaves",
        "quantity": 0.25,
        "unit": "cup",
        "category": "produce",
        "inStock": false
      },
      {
        "name": "Salt",
        "quantity": 1,
        "unit": "tsp",
        "category": "pantry"
      },
      {
        "name": "Turmeric",
        "quantity": 0.5,
        "unit": "tsp",
        "category": "spices"
      },
      {
        "name": "Cumin Seeds",
        "quantity": 1,
        "unit": "tsp",
        "category": "spices"
      },
      {
        "name": "Red Chili Powder",
        "quantity": 0.5,
        "unit": "tsp",
        "category": "spices"
      }
    ],
    "matar-paneer-wala": [
      {
        "name": "Paneer",
        "quantity": 150,
        "unit": "g",
        "category": "proteins",
        "inStock": false
      },
      {
        "name": "Green Peas",
        "quantity": 100,
        "unit": "g",
        "category": "produce",
        "inStock": false
      },
      {
        "name": "Ghee",
        "quantity": 2,
        "unit": "tbsp",
        "category": "pantry",
        "inStock": false
      },
      {
        "name": "Oil",
        "quantity": 2,
        "unit": "tbsp",
        "category": "pantry",
        "inStock": false
      },
      {
        "name": "Spices",
        "quantity": 1,
        "unit": "packet",
        "category": "spices",
        "inStock": false
      },
      {
        "name": "Onion",
        "quantity": 1,
        "unit": "pc",
        "category": "produce",
        "inStock": false
      },
      {
        "name": "Tomato",
        "quantity": 2,
        "unit": "pc",
        "category": "produce",
        "inStock": false
      },
      {
        "name": "Green Chilli",
        "quantity": 2,
        "unit": "pc",
        "category": "produce",
        "inStock": false
      },
      {
        "name": "Ginger-Garlic Paste",
        "quantity": 1,
        "unit": "tbsp",
        "category": "produce",
        "inStock": false
      },
      {
        "name": "Coriander Leaves",
        "quantity": 0.25,
        "unit": "cup",
        "category": "produce",
        "inStock": false
      },
      {
        "name": "Salt",
        "quantity": 1,
        "unit": "tsp",
        "category": "pantry"
      },
      {
        "name": "Turmeric",
        "quantity": 0.5,
        "unit": "tsp",
        "category": "spices"
      },
      {
        "name": "Cumin Seeds",
        "quantity": 1,
        "unit": "tsp",
        "category": "spices"
      },
      {
        "name": "Red Chili Powder",
        "quantity": 0.5,
        "unit": "tsp",
        "category": "spices"
      }
    ],
    "naga-bamboo-shoot": [
      {
        "name": "Bamboo Shoot",
        "quantity": 100,
        "unit": "g",
        "category": "produce",
        "inStock": false
      },
      {
        "name": "Pork",
        "quantity": 150,
        "unit": "g",
        "category": "proteins",
        "inStock": false
      },
      {
        "name": "Spices",
        "quantity": 1,
        "unit": "packet",
        "category": "spices",
        "inStock": false
      },
      {
        "name": "Ghee",
        "quantity": 2,
        "unit": "tbsp",
        "category": "pantry",
        "inStock": false
      },
      {
        "name": "Oil",
        "quantity": 2,
        "unit": "tbsp",
        "category": "pantry",
        "inStock": false
      },
      {
        "name": "Curry Leaves",
        "quantity": 1,
        "unit": "sprig",
        "category": "produce",
        "inStock": false
      },
      {
        "name": "Rice",
        "quantity": 1,
        "unit": "cup",
        "category": "grains",
        "inStock": false
      },
      {
        "name": "Onion",
        "quantity": 1,
        "unit": "pc",
        "category": "produce",
        "inStock": false
      },
      {
        "name": "Tomato",
        "quantity": 2,
        "unit": "pc",
        "category": "produce",
        "inStock": false
      },
      {
        "name": "Green Chilli",
        "quantity": 2,
        "unit": "pc",
        "category": "produce",
        "inStock": false
      },
      {
        "name": "Ginger-Garlic Paste",
        "quantity": 1,
        "unit": "tbsp",
        "category": "produce",
        "inStock": false
      },
      {
        "name": "Coriander Leaves",
        "quantity": 0.25,
        "unit": "cup",
        "category": "produce",
        "inStock": false
      },
      {
        "name": "Salt",
        "quantity": 1,
        "unit": "tsp",
        "category": "pantry"
      },
      {
        "name": "Turmeric",
        "quantity": 0.5,
        "unit": "tsp",
        "category": "spices"
      },
      {
        "name": "Mustard Oil",
        "quantity": 1,
        "unit": "tbsp",
        "category": "pantry"
      },
      {
        "name": "Cumin Seeds",
        "quantity": 1,
        "unit": "tsp",
        "category": "spices"
      },
      {
        "name": "Red Chili Powder",
        "quantity": 0.5,
        "unit": "tsp",
        "category": "spices"
      }
    ],
    "naga-axone-pork": [
      {
        "name": "Pork",
        "quantity": 200,
        "unit": "g",
        "category": "proteins",
        "inStock": false
      },
      {
        "name": "Ginger",
        "quantity": 20,
        "unit": "g",
        "category": "produce",
        "inStock": false
      },
      {
        "name": "Garlic",
        "quantity": 10,
        "unit": "g",
        "category": "produce",
        "inStock": false
      },
      {
        "name": "Ghee",
        "quantity": 2,
        "unit": "tbsp",
        "category": "pantry",
        "inStock": false
      },
      {
        "name": "Oil",
        "quantity": 2,
        "unit": "tbsp",
        "category": "pantry",
        "inStock": false
      },
      {
        "name": "Spices",
        "quantity": 1,
        "unit": "packet",
        "category": "spices",
        "inStock": false
      },
      {
        "name": "Rice",
        "quantity": 1,
        "unit": "cup",
        "category": "grains",
        "inStock": false
      },
      {
        "name": "Onion",
        "quantity": 1,
        "unit": "pc",
        "category": "produce",
        "inStock": false
      },
      {
        "name": "Tomato",
        "quantity": 2,
        "unit": "pc",
        "category": "produce",
        "inStock": false
      },
      {
        "name": "Green Chilli",
        "quantity": 2,
        "unit": "pc",
        "category": "produce",
        "inStock": false
      },
      {
        "name": "Ginger-Garlic Paste",
        "quantity": 1,
        "unit": "tbsp",
        "category": "produce",
        "inStock": false
      },
      {
        "name": "Coriander Leaves",
        "quantity": 0.25,
        "unit": "cup",
        "category": "produce",
        "inStock": false
      },
      {
        "name": "Salt",
        "quantity": 1,
        "unit": "tsp",
        "category": "pantry"
      },
      {
        "name": "Turmeric",
        "quantity": 0.5,
        "unit": "tsp",
        "category": "spices"
      },
      {
        "name": "Mustard Oil",
        "quantity": 1,
        "unit": "tbsp",
        "category": "pantry"
      },
      {
        "name": "Cumin Seeds",
        "quantity": 1,
        "unit": "tsp",
        "category": "spices"
      },
      {
        "name": "Red Chili Powder",
        "quantity": 0.5,
        "unit": "tsp",
        "category": "spices"
      }
    ],
    "manipuri-eromba": [
      {
        "name": "Fish",
        "quantity": 150,
        "unit": "g",
        "category": "proteins"
      },
      {
        "name": "Fermented Fish",
        "quantity": 50,
        "unit": "g",
        "category": "pantry"
      },
      {
        "name": "Potato",
        "quantity": 1,
        "unit": "pc",
        "category": "produce"
      },
      {
        "name": "Green Chilli",
        "quantity": 3,
        "unit": "pcs",
        "category": "produce"
      },
      {
        "name": "Garlic",
        "quantity": 3,
        "unit": "pcs",
        "category": "produce"
      },
      {
        "name": "Ginger",
        "quantity": 1,
        "unit": "inch",
        "category": "produce"
      },
      {
        "name": "Mustard Oil",
        "quantity": 1,
        "unit": "tbsp",
        "category": "pantry"
      },
      {
        "name": "Salt",
        "quantity": 1,
        "unit": "tsp",
        "category": "pantry"
      },
      {
        "name": "Rice",
        "quantity": 1,
        "unit": "cup",
        "category": "grains"
      }
    ],
    "manipuri-kangsoi": [
      {
        "name": "Pork",
        "quantity": 250,
        "unit": "g",
        "category": "proteins"
      },
      {
        "name": "Potato",
        "quantity": 1,
        "unit": "pc",
        "category": "produce"
      },
      {
        "name": "Cabbage",
        "quantity": 0.5,
        "unit": "cup",
        "category": "produce"
      },
      {
        "name": "Onion",
        "quantity": 1,
        "unit": "pc",
        "category": "produce"
      },
      {
        "name": "Garlic",
        "quantity": 3,
        "unit": "pcs",
        "category": "produce"
      },
      {
        "name": "Ginger",
        "quantity": 1,
        "unit": "inch",
        "category": "produce"
      },
      {
        "name": "Green Chilli",
        "quantity": 2,
        "unit": "pcs",
        "category": "produce"
      },
      {
        "name": "Turmeric",
        "quantity": 0.5,
        "unit": "tsp",
        "category": "spices"
      },
      {
        "name": "Salt",
        "quantity": 1,
        "unit": "tsp",
        "category": "pantry"
      },
      {
        "name": "Mustard Oil",
        "quantity": 1,
        "unit": "tbsp",
        "category": "pantry"
      },
      {
        "name": "Rice",
        "quantity": 1,
        "unit": "cup",
        "category": "grains"
      }
    ],
    "mizo-bai": [
      {
        "name": "Pork",
        "quantity": 250,
        "unit": "g",
        "category": "proteins"
      },
      {
        "name": "Green Beans",
        "quantity": 0.5,
        "unit": "cup",
        "category": "produce"
      },
      {
        "name": "Potato",
        "quantity": 1,
        "unit": "pc",
        "category": "produce"
      },
      {
        "name": "Onion",
        "quantity": 1,
        "unit": "pc",
        "category": "produce"
      },
      {
        "name": "Garlic",
        "quantity": 3,
        "unit": "pcs",
        "category": "produce"
      },
      {
        "name": "Green Chilli",
        "quantity": 2,
        "unit": "pcs",
        "category": "produce"
      },
      {
        "name": "Turmeric",
        "quantity": 0.5,
        "unit": "tsp",
        "category": "spices"
      },
      {
        "name": "Salt",
        "quantity": 1,
        "unit": "tsp",
        "category": "pantry"
      },
      {
        "name": "Mustard Oil",
        "quantity": 1,
        "unit": "tbsp",
        "category": "pantry"
      },
      {
        "name": "Rice",
        "quantity": 1,
        "unit": "cup",
        "category": "grains"
      }
    ],
    "mizo-vawksa": [
      {
        "name": "Pork",
        "quantity": 250,
        "unit": "g",
        "category": "proteins"
      },
      {
        "name": "Onion",
        "quantity": 1,
        "unit": "pc",
        "category": "produce"
      },
      {
        "name": "Garlic",
        "quantity": 3,
        "unit": "pcs",
        "category": "produce"
      },
      {
        "name": "Ginger",
        "quantity": 1,
        "unit": "inch",
        "category": "produce"
      },
      {
        "name": "Green Chilli",
        "quantity": 2,
        "unit": "pcs",
        "category": "produce"
      },
      {
        "name": "Turmeric",
        "quantity": 0.5,
        "unit": "tsp",
        "category": "spices"
      },
      {
        "name": "Salt",
        "quantity": 1,
        "unit": "tsp",
        "category": "pantry"
      },
      {
        "name": "Mustard Oil",
        "quantity": 1,
        "unit": "tbsp",
        "category": "pantry"
      },
      {
        "name": "Rice",
        "quantity": 1,
        "unit": "cup",
        "category": "grains"
      }
    ],
    "sikkimese-buckwheat": [
      {
        "name": "Ghee",
        "quantity": 2,
        "unit": "tbsp",
        "category": "pantry",
        "inStock": false
      },
      {
        "name": "Oil",
        "quantity": 2,
        "unit": "tbsp",
        "category": "pantry",
        "inStock": false
      },
      {
        "name": "Spices",
        "quantity": 1,
        "unit": "packet",
        "category": "spices",
        "inStock": false
      },
      {
        "name": "Onion",
        "quantity": 1,
        "unit": "pc",
        "category": "produce",
        "inStock": false
      },
      {
        "name": "Tomato",
        "quantity": 2,
        "unit": "pc",
        "category": "produce",
        "inStock": false
      },
      {
        "name": "Green Chilli",
        "quantity": 2,
        "unit": "pc",
        "category": "produce",
        "inStock": false
      },
      {
        "name": "Ginger-Garlic Paste",
        "quantity": 1,
        "unit": "tbsp",
        "category": "produce",
        "inStock": false
      },
      {
        "name": "Coriander Leaves",
        "quantity": 0.25,
        "unit": "cup",
        "category": "produce",
        "inStock": false
      }
    ],
    "assam-masor-tenga": [
      {
        "name": "Fish",
        "quantity": 150,
        "unit": "g",
        "category": "proteins",
        "inStock": false
      },
      {
        "name": "Tomatoes",
        "quantity": 2,
        "unit": "pc",
        "category": "produce",
        "inStock": false
      },
      {
        "name": "Lemon Juice",
        "quantity": 1,
        "unit": "tbsp",
        "category": "pantry",
        "inStock": false
      },
      {
        "name": "Spices",
        "quantity": 1,
        "unit": "packet",
        "category": "spices",
        "inStock": false
      },
      {
        "name": "Ghee",
        "quantity": 2,
        "unit": "tbsp",
        "category": "pantry",
        "inStock": false
      },
      {
        "name": "Oil",
        "quantity": 2,
        "unit": "tbsp",
        "category": "pantry",
        "inStock": false
      },
      {
        "name": "Salt",
        "quantity": 1,
        "unit": "tsp",
        "category": "pantry"
      },
      {
        "name": "Turmeric",
        "quantity": 0.5,
        "unit": "tsp",
        "category": "spices"
      },
      {
        "name": "Mustard Oil",
        "quantity": 1,
        "unit": "tbsp",
        "category": "pantry"
      }
    ],
    "tripuri-biryani": [
      {
        "name": "Rice",
        "quantity": 1,
        "unit": "cup",
        "category": "grains"
      },
      {
        "name": "Chicken",
        "quantity": 250,
        "unit": "g",
        "category": "proteins"
      },
      {
        "name": "Onion",
        "quantity": 2,
        "unit": "pcs",
        "category": "produce"
      },
      {
        "name": "Yogurt",
        "quantity": 100,
        "unit": "g",
        "category": "dairy"
      },
      {
        "name": "Ginger-Garlic Paste",
        "quantity": 1,
        "unit": "tbsp",
        "category": "pantry"
      },
      {
        "name": "Biryani Masala",
        "quantity": 1,
        "unit": "tbsp",
        "category": "spices"
      },
      {
        "name": "Turmeric",
        "quantity": 0.5,
        "unit": "tsp",
        "category": "spices"
      },
      {
        "name": "Salt",
        "quantity": 1,
        "unit": "tsp",
        "category": "pantry"
      },
      {
        "name": "Oil",
        "quantity": 2,
        "unit": "tbsp",
        "category": "pantry"
      },
      {
        "name": "Mint Leaves",
        "quantity": 0.25,
        "unit": "cup",
        "category": "produce"
      },
      {
        "name": "Coriander Leaves",
        "quantity": 0.25,
        "unit": "cup",
        "category": "produce"
      }
    ],
    "meghalaya-doh-khleh": [
      {
        "name": "Pork",
        "quantity": 300,
        "unit": "g",
        "category": "proteins"
      },
      {
        "name": "Onion",
        "quantity": 1,
        "unit": "pc",
        "category": "produce"
      },
      {
        "name": "Tomato",
        "quantity": 1,
        "unit": "pc",
        "category": "produce"
      },
      {
        "name": "Green Chili",
        "quantity": 2,
        "unit": "pcs",
        "category": "produce"
      },
      {
        "name": "Ginger",
        "quantity": 1,
        "unit": "pc",
        "category": "produce"
      },
      {
        "name": "Lemon Juice",
        "quantity": 1,
        "unit": "tbsp",
        "category": "pantry"
      },
      {
        "name": "Salt",
        "quantity": 0.5,
        "unit": "tsp",
        "category": "pantry"
      }
    ],
    "arunachal-thukpa-veg": [
      {
        "name": "Noodles",
        "quantity": 1,
        "unit": "cup",
        "category": "grains"
      },
      {
        "name": "Tofu",
        "quantity": 100,
        "unit": "g",
        "category": "proteins"
      },
      {
        "name": "Cabbage",
        "quantity": 0.5,
        "unit": "cup",
        "category": "produce"
      },
      {
        "name": "Carrot",
        "quantity": 0.5,
        "unit": "cup",
        "category": "produce"
      },
      {
        "name": "Onion",
        "quantity": 1,
        "unit": "pc",
        "category": "produce"
      },
      {
        "name": "Tomato",
        "quantity": 2,
        "unit": "pc",
        "category": "produce"
      },
      {
        "name": "Garlic",
        "quantity": 3,
        "unit": "cloves",
        "category": "produce"
      },
      {
        "name": "Ginger",
        "quantity": 1,
        "unit": "inch",
        "category": "produce"
      },
      {
        "name": "Green Chilli",
        "quantity": 1,
        "unit": "pc",
        "category": "produce"
      },
      {
        "name": "Soy Sauce",
        "quantity": 1,
        "unit": "tbsp",
        "category": "pantry"
      },
      {
        "name": "Water",
        "quantity": 3,
        "unit": "cup",
        "category": "pantry"
      },
      {
        "name": "Salt",
        "quantity": 1,
        "unit": "tsp",
        "category": "pantry"
      },
      {
        "name": "Oil",
        "quantity": 1,
        "unit": "tbsp",
        "category": "pantry"
      }
    ],
    "meghalaya-tun-jhol": [
      {
        "name": "Fish",
        "quantity": 200,
        "unit": "g",
        "category": "proteins",
        "inStock": false
      },
      {
        "name": "Turmeric",
        "quantity": 1,
        "unit": "tsp",
        "category": "spices",
        "inStock": false
      },
      {
        "name": "Ghee",
        "quantity": 2,
        "unit": "tbsp",
        "category": "pantry",
        "inStock": false
      },
      {
        "name": "Oil",
        "quantity": 2,
        "unit": "tbsp",
        "category": "pantry",
        "inStock": false
      },
      {
        "name": "Spices",
        "quantity": 1,
        "unit": "packet",
        "category": "spices",
        "inStock": false
      },
      {
        "name": "Onion",
        "quantity": 1,
        "unit": "pc",
        "category": "produce",
        "inStock": false
      },
      {
        "name": "Tomato",
        "quantity": 2,
        "unit": "pc",
        "category": "produce",
        "inStock": false
      },
      {
        "name": "Green Chilli",
        "quantity": 2,
        "unit": "pc",
        "category": "produce",
        "inStock": false
      },
      {
        "name": "Ginger-Garlic Paste",
        "quantity": 1,
        "unit": "tbsp",
        "category": "produce",
        "inStock": false
      },
      {
        "name": "Coriander Leaves",
        "quantity": 0.25,
        "unit": "cup",
        "category": "produce",
        "inStock": false
      },
      {
        "name": "Salt",
        "quantity": 1,
        "unit": "tsp",
        "category": "pantry"
      },
      {
        "name": "Mustard Oil",
        "quantity": 1,
        "unit": "tbsp",
        "category": "pantry"
      },
      {
        "name": "Cumin Seeds",
        "quantity": 1,
        "unit": "tsp",
        "category": "spices"
      },
      {
        "name": "Red Chili Powder",
        "quantity": 0.5,
        "unit": "tsp",
        "category": "spices"
      }
    ],
    "tunday-kebab": [
      {
        "name": "Mutton",
        "quantity": 400,
        "unit": "g",
        "category": "proteins"
      },
      {
        "name": "Yogurt",
        "quantity": 0.25,
        "unit": "cup",
        "category": "dairy"
      },
      {
        "name": "Ginger-Garlic Paste",
        "quantity": 1,
        "unit": "tbsp",
        "category": "pantry"
      },
      {
        "name": "Green Chilli",
        "quantity": 2,
        "unit": "pc",
        "category": "produce"
      },
      {
        "name": "Garam Masala",
        "quantity": 1,
        "unit": "tsp",
        "category": "spices"
      },
      {
        "name": "Clove Powder",
        "quantity": 0.25,
        "unit": "tsp",
        "category": "spices"
      },
      {
        "name": "Cardamom Powder",
        "quantity": 0.25,
        "unit": "tsp",
        "category": "spices"
      },
      {
        "name": "Nutmeg",
        "quantity": 1,
        "unit": "pinch",
        "category": "spices"
      },
      {
        "name": "Mace",
        "quantity": 1,
        "unit": "pinch",
        "category": "spices"
      },
      {
        "name": "Rose Water",
        "quantity": 1,
        "unit": "tsp",
        "category": "pantry"
      },
      {
        "name": "Salt",
        "quantity": 1,
        "unit": "tsp",
        "category": "pantry"
      },
      {
        "name": "Ghee",
        "quantity": 2,
        "unit": "tbsp",
        "category": "dairy"
      }
    ],
    "nalli-nihari": [
      {
        "name": "Mutton",
        "quantity": 250,
        "unit": "g",
        "category": "proteins"
      },
      {
        "name": "Onion",
        "quantity": 1,
        "unit": "pc",
        "category": "produce"
      },
      {
        "name": "Ginger-Garlic Paste",
        "quantity": 1,
        "unit": "tbsp",
        "category": "pantry"
      },
      {
        "name": "Nihari Masala",
        "quantity": 1,
        "unit": "tbsp",
        "category": "spices"
      },
      {
        "name": "Turmeric",
        "quantity": 0.5,
        "unit": "tsp",
        "category": "spices"
      },
      {
        "name": "Salt",
        "quantity": 1,
        "unit": "tsp",
        "category": "pantry"
      },
      {
        "name": "Ghee",
        "quantity": 2,
        "unit": "tbsp",
        "category": "dairy"
      },
      {
        "name": "Yogurt",
        "quantity": 100,
        "unit": "g",
        "category": "dairy"
      },
      {
        "name": "Maida",
        "quantity": 200,
        "unit": "g",
        "category": "grains"
      }
    ],
    "chicken-tikka-masala-2": [
      {
        "name": "Chicken",
        "quantity": 400,
        "unit": "g",
        "category": "proteins"
      },
      {
        "name": "Tomato",
        "quantity": 3,
        "unit": "pc",
        "category": "produce"
      },
      {
        "name": "Onion",
        "quantity": 1,
        "unit": "pc",
        "category": "produce"
      },
      {
        "name": "Butter",
        "quantity": 2,
        "unit": "tbsp",
        "category": "dairy"
      },
      {
        "name": "Cream",
        "quantity": 0.25,
        "unit": "cup",
        "category": "dairy"
      },
      {
        "name": "Ginger-Garlic Paste",
        "quantity": 1,
        "unit": "tbsp",
        "category": "pantry"
      },
      {
        "name": "Red Chilli Powder",
        "quantity": 1,
        "unit": "tsp",
        "category": "spices"
      },
      {
        "name": "Turmeric",
        "quantity": 0.5,
        "unit": "tsp",
        "category": "spices"
      },
      {
        "name": "Garam Masala",
        "quantity": 1,
        "unit": "tsp",
        "category": "spices"
      },
      {
        "name": "Kasuri Methi",
        "quantity": 1,
        "unit": "tbsp",
        "category": "spices"
      },
      {
        "name": "Salt",
        "quantity": 1,
        "unit": "tsp",
        "category": "pantry"
      },
      {
        "name": "Oil",
        "quantity": 1,
        "unit": "tbsp",
        "category": "pantry"
      },
      {
        "name": "Naan",
        "quantity": 2,
        "unit": "pc",
        "category": "breads"
      }
    ],
    "dal-gosht": [
      {
        "name": "Mixed Dal",
        "quantity": 80,
        "unit": "g",
        "category": "proteins",
        "inStock": false
      },
      {
        "name": "Mutton",
        "quantity": 200,
        "unit": "g",
        "category": "proteins",
        "inStock": false
      },
      {
        "name": "Ghee",
        "quantity": 2,
        "unit": "tbsp",
        "category": "pantry",
        "inStock": false
      },
      {
        "name": "Oil",
        "quantity": 2,
        "unit": "tbsp",
        "category": "pantry",
        "inStock": false
      },
      {
        "name": "Spices",
        "quantity": 1,
        "unit": "packet",
        "category": "spices",
        "inStock": false
      },
      {
        "name": "Toor Dal",
        "quantity": 1,
        "unit": "cup",
        "category": "grains",
        "inStock": false
      },
      {
        "name": "Onion",
        "quantity": 1,
        "unit": "pc",
        "category": "produce",
        "inStock": false
      },
      {
        "name": "Tomato",
        "quantity": 2,
        "unit": "pc",
        "category": "produce",
        "inStock": false
      },
      {
        "name": "Green Chilli",
        "quantity": 2,
        "unit": "pc",
        "category": "produce",
        "inStock": false
      },
      {
        "name": "Ginger-Garlic Paste",
        "quantity": 1,
        "unit": "tbsp",
        "category": "produce",
        "inStock": false
      },
      {
        "name": "Coriander Leaves",
        "quantity": 0.25,
        "unit": "cup",
        "category": "produce",
        "inStock": false
      },
      {
        "name": "Salt",
        "quantity": 1,
        "unit": "tsp",
        "category": "pantry"
      },
      {
        "name": "Turmeric",
        "quantity": 0.5,
        "unit": "tsp",
        "category": "spices"
      },
      {
        "name": "Cumin Seeds",
        "quantity": 1,
        "unit": "tsp",
        "category": "spices"
      }
    ],
    "mutton-curry": [
      {
        "name": "Mutton",
        "quantity": 200,
        "unit": "g",
        "category": "proteins",
        "inStock": false
      },
      {
        "name": "Ghee",
        "quantity": 2,
        "unit": "tbsp",
        "category": "pantry",
        "inStock": false
      },
      {
        "name": "Oil",
        "quantity": 2,
        "unit": "tbsp",
        "category": "pantry",
        "inStock": false
      },
      {
        "name": "Spices",
        "quantity": 1,
        "unit": "packet",
        "category": "spices",
        "inStock": false
      },
      {
        "name": "Rice",
        "quantity": 1,
        "unit": "cup",
        "category": "grains",
        "inStock": false
      },
      {
        "name": "Onion",
        "quantity": 1,
        "unit": "pc",
        "category": "produce",
        "inStock": false
      },
      {
        "name": "Tomato",
        "quantity": 2,
        "unit": "pc",
        "category": "produce",
        "inStock": false
      },
      {
        "name": "Green Chilli",
        "quantity": 2,
        "unit": "pc",
        "category": "produce",
        "inStock": false
      },
      {
        "name": "Ginger-Garlic Paste",
        "quantity": 1,
        "unit": "tbsp",
        "category": "produce",
        "inStock": false
      },
      {
        "name": "Coriander Leaves",
        "quantity": 0.25,
        "unit": "cup",
        "category": "produce",
        "inStock": false
      },
      {
        "name": "Salt",
        "quantity": 1,
        "unit": "tsp",
        "category": "pantry"
      },
      {
        "name": "Turmeric",
        "quantity": 0.5,
        "unit": "tsp",
        "category": "spices"
      },
      {
        "name": "Cumin Seeds",
        "quantity": 1,
        "unit": "tsp",
        "category": "spices"
      },
      {
        "name": "Red Chili Powder",
        "quantity": 0.5,
        "unit": "tsp",
        "category": "spices"
      }
    ],
    "seyal-double-roti": [
      {
        "name": "Bread",
        "quantity": 2,
        "unit": "slices",
        "category": "breads"
      },
      {
        "name": "Onion",
        "quantity": 1,
        "unit": "pc",
        "category": "produce"
      },
      {
        "name": "Tomato",
        "quantity": 1,
        "unit": "pc",
        "category": "produce"
      },
      {
        "name": "Garlic",
        "quantity": 3,
        "unit": "cloves",
        "category": "produce"
      },
      {
        "name": "Turmeric",
        "quantity": 0.25,
        "unit": "tsp",
        "category": "spices"
      },
      {
        "name": "Coriander Leaves",
        "quantity": 0.25,
        "unit": "cup",
        "category": "produce"
      },
      {
        "name": "Chaat Masala",
        "quantity": 0.5,
        "unit": "tsp",
        "category": "spices"
      },
      {
        "name": "Green Chilli",
        "quantity": 1,
        "unit": "pc",
        "category": "produce"
      }
    ],
    "bread-upma": [
      {
        "name": "Bread",
        "quantity": 4,
        "unit": "slices",
        "category": "breads"
      },
      {
        "name": "Onion",
        "quantity": 1,
        "unit": "pcs",
        "category": "produce"
      },
      {
        "name": "Tomato",
        "quantity": 1,
        "unit": "pcs",
        "category": "produce"
      },
      {
        "name": "Mustard Seeds",
        "quantity": 1,
        "unit": "tsp",
        "category": "spices"
      },
      {
        "name": "Curry Leaves",
        "quantity": 1,
        "unit": "sprig",
        "category": "produce"
      },
      {
        "name": "Turmeric",
        "quantity": 0.5,
        "unit": "tsp",
        "category": "spices"
      },
      {
        "name": "Peanuts",
        "quantity": 2,
        "unit": "tbsp",
        "category": "pantry"
      }
    ],
    "mumbai-masala-toast": [
      {
        "name": "Bread",
        "quantity": 2,
        "unit": "slices",
        "category": "breads"
      },
      {
        "name": "Potato",
        "quantity": 2,
        "unit": "pcs",
        "category": "produce"
      },
      {
        "name": "Beetroot",
        "quantity": 0.5,
        "unit": "pcs",
        "category": "produce"
      },
      {
        "name": "Cucumber",
        "quantity": 0.5,
        "unit": "pcs",
        "category": "produce"
      },
      {
        "name": "Onion",
        "quantity": 0.5,
        "unit": "pcs",
        "category": "produce"
      },
      {
        "name": "Green Chutney",
        "quantity": 2,
        "unit": "tbsp",
        "category": "pantry"
      },
      {
        "name": "Butter",
        "quantity": 1,
        "unit": "tbsp",
        "category": "dairy"
      }
    ],
    "bread-roll": [
      {
        "name": "Bread",
        "quantity": 4,
        "unit": "slices",
        "category": "breads"
      },
      {
        "name": "Potato",
        "quantity": 3,
        "unit": "pcs",
        "category": "produce"
      },
      {
        "name": "Onion",
        "quantity": 1,
        "unit": "pcs",
        "category": "produce"
      },
      {
        "name": "Green Chillies",
        "quantity": 2,
        "unit": "pcs",
        "category": "produce"
      },
      {
        "name": "Coriander Leaves",
        "quantity": 0.25,
        "unit": "cup",
        "category": "produce"
      },
      {
        "name": "Oil",
        "quantity": 1,
        "unit": "cup",
        "category": "pantry"
      }
    ],
    "bread-manchurian": [
      {
        "name": "Bread",
        "quantity": 4,
        "unit": "slices",
        "category": "breads"
      },
      {
        "name": "Onion",
        "quantity": 1,
        "unit": "pcs",
        "category": "produce"
      },
      {
        "name": "Capsicum",
        "quantity": 1,
        "unit": "pcs",
        "category": "produce"
      },
      {
        "name": "Garlic",
        "quantity": 4,
        "unit": "pcs",
        "category": "produce"
      },
      {
        "name": "Soy Sauce",
        "quantity": 1,
        "unit": "tbsp",
        "category": "pantry"
      },
      {
        "name": "Red Chilli Powder",
        "quantity": 1,
        "unit": "tsp",
        "category": "spices"
      }
    ],
    "chilli-cheese-toast": [
      {
        "name": "Bread",
        "quantity": 2,
        "unit": "slices",
        "category": "breads"
      },
      {
        "name": "Cheese",
        "quantity": 0.5,
        "unit": "cup",
        "category": "dairy"
      },
      {
        "name": "Green Chillies",
        "quantity": 2,
        "unit": "pcs",
        "category": "produce"
      },
      {
        "name": "Capsicum",
        "quantity": 0.5,
        "unit": "pcs",
        "category": "produce"
      },
      {
        "name": "Butter",
        "quantity": 1,
        "unit": "tbsp",
        "category": "dairy"
      }
    ],
    "aloo-masala-sandwich": [
      {
        "name": "Bread",
        "quantity": 2,
        "unit": "slices",
        "category": "breads"
      },
      {
        "name": "Potato",
        "quantity": 2,
        "unit": "pcs",
        "category": "produce"
      },
      {
        "name": "Onion",
        "quantity": 0.5,
        "unit": "pcs",
        "category": "produce"
      },
      {
        "name": "Mint Chutney",
        "quantity": 2,
        "unit": "tbsp",
        "category": "pantry"
      },
      {
        "name": "Green Chillies",
        "quantity": 1,
        "unit": "pcs",
        "category": "produce"
      },
      {
        "name": "Butter",
        "quantity": 1,
        "unit": "tbsp",
        "category": "dairy"
      }
    ],
    "paneer-bhurji-sandwich": [
      {
        "name": "Bread",
        "quantity": 2,
        "unit": "slices",
        "category": "breads"
      },
      {
        "name": "Paneer",
        "quantity": 150,
        "unit": "g",
        "category": "dairy"
      },
      {
        "name": "Onion",
        "quantity": 1,
        "unit": "pcs",
        "category": "produce"
      },
      {
        "name": "Tomato",
        "quantity": 1,
        "unit": "pcs",
        "category": "produce"
      },
      {
        "name": "Green Chillies",
        "quantity": 2,
        "unit": "pcs",
        "category": "produce"
      },
      {
        "name": "Butter",
        "quantity": 1,
        "unit": "tbsp",
        "category": "dairy"
      }
    ],
    "dahi-veg-sandwich": [
      {
        "name": "Bread",
        "quantity": 2,
        "unit": "slices",
        "category": "breads"
      },
      {
        "name": "Curd",
        "quantity": 0.5,
        "unit": "cup",
        "category": "dairy"
      },
      {
        "name": "Carrot",
        "quantity": 0.5,
        "unit": "pcs",
        "category": "produce"
      },
      {
        "name": "Cabbage",
        "quantity": 0.25,
        "unit": "cup",
        "category": "produce"
      },
      {
        "name": "Black Pepper",
        "quantity": 0.5,
        "unit": "tsp",
        "category": "spices"
      },
      {
        "name": "Green Chutney",
        "quantity": 2,
        "unit": "tbsp",
        "category": "pantry"
      }
    ],
    "bread-chaat": [
      {
        "name": "Bread",
        "quantity": 4,
        "unit": "slices",
        "category": "breads"
      },
      {
        "name": "Curd",
        "quantity": 0.5,
        "unit": "cup",
        "category": "dairy"
      },
      {
        "name": "Onion",
        "quantity": 0.5,
        "unit": "pcs",
        "category": "produce"
      },
      {
        "name": "Tomato",
        "quantity": 1,
        "unit": "pcs",
        "category": "produce"
      },
      {
        "name": "Tamarind Chutney",
        "quantity": 2,
        "unit": "tbsp",
        "category": "pantry"
      },
      {
        "name": "Chaat Masala",
        "quantity": 1,
        "unit": "tsp",
        "category": "spices"
      },
      {
        "name": "Sev",
        "quantity": 0.25,
        "unit": "cup",
        "category": "pantry"
      }
    ],
    "dim-pauruti": [
      {
        "name": "Bread",
        "quantity": 2,
        "unit": "slices",
        "category": "breads"
      },
      {
        "name": "Egg",
        "quantity": 2,
        "unit": "pcs",
        "category": "proteins"
      },
      {
        "name": "Onion",
        "quantity": 0.5,
        "unit": "pcs",
        "category": "produce"
      },
      {
        "name": "Green Chillies",
        "quantity": 2,
        "unit": "pcs",
        "category": "produce"
      },
      {
        "name": "Black Salt",
        "quantity": 0.5,
        "unit": "tsp",
        "category": "spices"
      },
      {
        "name": "Coriander Leaves",
        "quantity": 0.25,
        "unit": "cup",
        "category": "produce"
      }
    ],
    "bread-bhurji": [
      {
        "name": "Bread",
        "quantity": 4,
        "unit": "slices",
        "category": "breads"
      },
      {
        "name": "Onion",
        "quantity": 1,
        "unit": "pcs",
        "category": "produce"
      },
      {
        "name": "Tomato",
        "quantity": 2,
        "unit": "pcs",
        "category": "produce"
      },
      {
        "name": "Pav Bhaji Masala",
        "quantity": 1,
        "unit": "tsp",
        "category": "spices"
      },
      {
        "name": "Turmeric",
        "quantity": 0.5,
        "unit": "tsp",
        "category": "spices"
      },
      {
        "name": "Coriander Leaves",
        "quantity": 0.25,
        "unit": "cup",
        "category": "produce"
      }
    ],
    "double-ka-meetha": [
      {
        "name": "Bread",
        "quantity": 4,
        "unit": "slices",
        "category": "breads"
      },
      {
        "name": "Sugar",
        "quantity": 1,
        "unit": "cup",
        "category": "pantry"
      },
      {
        "name": "Milk",
        "quantity": 2,
        "unit": "cups",
        "category": "dairy"
      },
      {
        "name": "Saffron",
        "quantity": 1,
        "unit": "pinch",
        "category": "spices"
      },
      {
        "name": "Cardamom",
        "quantity": 2,
        "unit": "pods",
        "category": "spices"
      },
      {
        "name": "Ghee",
        "quantity": 2,
        "unit": "tbsp",
        "category": "dairy"
      }
    ],
    "podi-bread-toast": [
      {
        "name": "Bread",
        "quantity": 2,
        "unit": "slices",
        "category": "breads"
      },
      {
        "name": "Ghee",
        "quantity": 1,
        "unit": "tbsp",
        "category": "dairy"
      },
      {
        "name": "Idli Podi",
        "quantity": 1,
        "unit": "tsp",
        "category": "spices"
      },
      {
        "name": "Sesame Oil",
        "quantity": 1,
        "unit": "tsp",
        "category": "pantry"
      }
    ],
    "tomato-garlic-bread": [
      {
        "name": "Bread",
        "quantity": 2,
        "unit": "slices",
        "category": "breads"
      },
      {
        "name": "Tomato",
        "quantity": 1,
        "unit": "pc",
        "category": "produce"
      },
      {
        "name": "Garlic",
        "quantity": 3,
        "unit": "cloves",
        "category": "produce"
      },
      {
        "name": "Butter",
        "quantity": 1,
        "unit": "tbsp",
        "category": "dairy"
      },
      {
        "name": "Coriander Leaves",
        "quantity": 0.25,
        "unit": "cup",
        "category": "produce"
      },
      {
        "name": "Mozzarella Cheese",
        "quantity": 50,
        "unit": "g",
        "category": "dairy"
      },
      {
        "name": "Mixed Herbs",
        "quantity": 0.5,
        "unit": "tsp",
        "category": "pantry"
      }
    ],
    "ghugni-bread": [
      {
        "name": "Bread",
        "quantity": 3,
        "unit": "slices",
        "category": "breads"
      },
      {
        "name": "White Peas",
        "quantity": 1,
        "unit": "cup",
        "category": "proteins"
      },
      {
        "name": "Onion",
        "quantity": 1,
        "unit": "pcs",
        "category": "produce"
      },
      {
        "name": "Tomato",
        "quantity": 1,
        "unit": "pcs",
        "category": "produce"
      },
      {
        "name": "Mustard Oil",
        "quantity": 1,
        "unit": "tbsp",
        "category": "pantry"
      },
      {
        "name": "Green Chillies",
        "quantity": 2,
        "unit": "pcs",
        "category": "produce"
      }
    ],
    "kolkata-egg-roll": [
      {
        "name": "Paratha",
        "quantity": 1,
        "unit": "pcs",
        "category": "breads"
      },
      {
        "name": "Egg",
        "quantity": 2,
        "unit": "pcs",
        "category": "proteins"
      },
      {
        "name": "Onion",
        "quantity": 0.5,
        "unit": "pcs",
        "category": "produce"
      },
      {
        "name": "Green Chutney",
        "quantity": 2,
        "unit": "tbsp",
        "category": "pantry"
      },
      {
        "name": "Green Chillies",
        "quantity": 1,
        "unit": "pcs",
        "category": "produce"
      },
      {
        "name": "Lemon Wedge",
        "quantity": 1,
        "unit": "pcs",
        "category": "produce"
      }
    ],
    "rogan-josh": [
      {
        "name": "Mutton",
        "quantity": 500,
        "unit": "g",
        "category": "proteins"
      },
      {
        "name": "Yogurt",
        "quantity": 1,
        "unit": "cup",
        "category": "dairy"
      },
      {
        "name": "Kashmiri Red Chilli",
        "quantity": 2,
        "unit": "tsp",
        "category": "spices"
      },
      {
        "name": "Onion",
        "quantity": 2,
        "unit": "pcs",
        "category": "produce"
      },
      {
        "name": "Ginger",
        "quantity": 1,
        "unit": "pcs",
        "category": "produce"
      },
      {
        "name": "Garlic",
        "quantity": 6,
        "unit": "pcs",
        "category": "produce"
      },
      {
        "name": "Ghee",
        "quantity": 2,
        "unit": "tbsp",
        "category": "dairy"
      },
      {
        "name": "Cardamom",
        "quantity": 4,
        "unit": "pods",
        "category": "spices"
      }
    ],
    "vindaloo": [
      {
        "name": "Pork",
        "quantity": 500,
        "unit": "g",
        "category": "proteins"
      },
      {
        "name": "Vinegar",
        "quantity": 0.5,
        "unit": "cup",
        "category": "pantry"
      },
      {
        "name": "Goan Red Chillies",
        "quantity": 8,
        "unit": "pcs",
        "category": "spices"
      },
      {
        "name": "Garlic",
        "quantity": 8,
        "unit": "pcs",
        "category": "produce"
      },
      {
        "name": "Ginger",
        "quantity": 1,
        "unit": "pcs",
        "category": "produce"
      },
      {
        "name": "Onion",
        "quantity": 1,
        "unit": "pcs",
        "category": "produce"
      },
      {
        "name": "Cumin Seeds",
        "quantity": 1,
        "unit": "tsp",
        "category": "spices"
      },
      {
        "name": "Cinnamon",
        "quantity": 1,
        "unit": "pcs",
        "category": "spices"
      },
      {
        "name": "Mixed Dal",
        "quantity": 80,
        "unit": "g",
        "category": "proteins",
        "inStock": false
      },
      {
        "name": "Potatoes",
        "quantity": 3,
        "unit": "pc",
        "category": "produce",
        "inStock": false
      }
    ],
    "malabar-fish-curry": [
      {
        "name": "Fish",
        "quantity": 400,
        "unit": "g",
        "category": "proteins"
      },
      {
        "name": "Coconut Milk",
        "quantity": 1,
        "unit": "cup",
        "category": "pantry"
      },
      {
        "name": "Curry Leaves",
        "quantity": 1,
        "unit": "sprig",
        "category": "produce"
      },
      {
        "name": "Shallots",
        "quantity": 6,
        "unit": "pcs",
        "category": "produce"
      },
      {
        "name": "Green Chillies",
        "quantity": 3,
        "unit": "pcs",
        "category": "produce"
      },
      {
        "name": "Tamarind",
        "quantity": 1,
        "unit": "tbsp",
        "category": "pantry"
      },
      {
        "name": "Ginger",
        "quantity": 1,
        "unit": "pcs",
        "category": "produce"
      }
    ],
    "kadai-paneer": [
      {
        "name": "Paneer",
        "quantity": 250,
        "unit": "g",
        "category": "dairy"
      },
      {
        "name": "Capsicum",
        "quantity": 2,
        "unit": "pcs",
        "category": "produce"
      },
      {
        "name": "Tomato",
        "quantity": 3,
        "unit": "pcs",
        "category": "produce"
      },
      {
        "name": "Onion",
        "quantity": 1,
        "unit": "pcs",
        "category": "produce"
      },
      {
        "name": "Kadai Masala",
        "quantity": 2,
        "unit": "tsp",
        "category": "spices"
      },
      {
        "name": "Ginger",
        "quantity": 1,
        "unit": "pcs",
        "category": "produce"
      },
      {
        "name": "Coriander Leaves",
        "quantity": 0.25,
        "unit": "cup",
        "category": "produce"
      }
    ],
    "papri-chaat": [
      {
        "name": "Papdi",
        "quantity": 12,
        "unit": "pcs",
        "category": "pantry"
      },
      {
        "name": "Yogurt",
        "quantity": 0.5,
        "unit": "cup",
        "category": "dairy"
      },
      {
        "name": "Potato",
        "quantity": 1,
        "unit": "pcs",
        "category": "produce"
      },
      {
        "name": "Chickpeas",
        "quantity": 0.5,
        "unit": "cup",
        "category": "proteins"
      },
      {
        "name": "Tamarind Chutney",
        "quantity": 2,
        "unit": "tbsp",
        "category": "pantry"
      },
      {
        "name": "Mint Chutney",
        "quantity": 2,
        "unit": "tbsp",
        "category": "pantry"
      },
      {
        "name": "Chaat Masala",
        "quantity": 1,
        "unit": "tsp",
        "category": "spices"
      },
      {
        "name": "Sev",
        "quantity": 0.25,
        "unit": "cup",
        "category": "pantry"
      }
    ],
    "bhelpuri": [
      {
        "name": "Puffed Rice",
        "quantity": 2,
        "unit": "cups",
        "category": "grains"
      },
      {
        "name": "Onion",
        "quantity": 0.5,
        "unit": "pcs",
        "category": "produce"
      },
      {
        "name": "Tomato",
        "quantity": 1,
        "unit": "pcs",
        "category": "produce"
      },
      {
        "name": "Tamarind Chutney",
        "quantity": 2,
        "unit": "tbsp",
        "category": "pantry"
      },
      {
        "name": "Green Chutney",
        "quantity": 1,
        "unit": "tbsp",
        "category": "pantry"
      },
      {
        "name": "Sev",
        "quantity": 0.5,
        "unit": "cup",
        "category": "pantry"
      },
      {
        "name": "Peanuts",
        "quantity": 2,
        "unit": "tbsp",
        "category": "pantry"
      }
    ],
    "kaju-katli": [
      {
        "name": "Cashews",
        "quantity": 2,
        "unit": "cups",
        "category": "pantry"
      },
      {
        "name": "Sugar",
        "quantity": 1,
        "unit": "cup",
        "category": "pantry"
      },
      {
        "name": "Water",
        "quantity": 0.5,
        "unit": "cup",
        "category": "pantry"
      },
      {
        "name": "Ghee",
        "quantity": 1,
        "unit": "tbsp",
        "category": "dairy"
      },
      {
        "name": "Cardamom",
        "quantity": 1,
        "unit": "tsp",
        "category": "spices"
      }
    ],
    "ras-malai": [
      {
        "name": "Paneer",
        "quantity": 1,
        "unit": "cup",
        "category": "dairy"
      },
      {
        "name": "Milk",
        "quantity": 3,
        "unit": "cups",
        "category": "dairy"
      },
      {
        "name": "Sugar",
        "quantity": 0.5,
        "unit": "cup",
        "category": "pantry"
      },
      {
        "name": "Saffron",
        "quantity": 1,
        "unit": "pinch",
        "category": "spices"
      },
      {
        "name": "Cardamom",
        "quantity": 2,
        "unit": "pods",
        "category": "spices"
      },
      {
        "name": "Pistachios",
        "quantity": 1,
        "unit": "tbsp",
        "category": "pantry"
      }
    ],
    "rasgulla": [
      {
        "name": "Milk",
        "quantity": 1,
        "unit": "l",
        "category": "dairy"
      },
      {
        "name": "Sugar",
        "quantity": 100,
        "unit": "g",
        "category": "pantry"
      },
      {
        "name": "Lemon Juice",
        "quantity": 2,
        "unit": "tbsp",
        "category": "pantry"
      },
      {
        "name": "Cardamom",
        "quantity": 0.25,
        "unit": "tsp",
        "category": "spices"
      },
      {
        "name": "Water",
        "quantity": 4,
        "unit": "cup",
        "category": "pantry"
      },
      {
        "name": "Saffron",
        "quantity": 1,
        "unit": "pinch",
        "category": "spices"
      }
    ],
    "kulfi": [
      {
        "name": "Milk",
        "quantity": 2,
        "unit": "cup",
        "category": "dairy"
      },
      {
        "name": "Sugar",
        "quantity": 0.5,
        "unit": "cup",
        "category": "pantry"
      },
      {
        "name": "Cardamom",
        "quantity": 1,
        "unit": "tsp",
        "category": "spices"
      },
      {
        "name": "Saffron",
        "quantity": 1,
        "unit": "pinch",
        "category": "spices"
      },
      {
        "name": "Pistachios",
        "quantity": 2,
        "unit": "tbsp",
        "category": "pantry"
      },
      {
        "name": "Almonds",
        "quantity": 2,
        "unit": "tbsp",
        "category": "pantry"
      },
      {
        "name": "Raisins",
        "quantity": 2,
        "unit": "tbsp",
        "category": "pantry"
      }
    ],
    "rabdi-faluda": [
      {
        "name": "Milk",
        "quantity": 2,
        "unit": "cup",
        "category": "dairy"
      },
      {
        "name": "Sugar",
        "quantity": 0.25,
        "unit": "cup",
        "category": "pantry"
      },
      {
        "name": "Vermicelli",
        "quantity": 0.25,
        "unit": "cup",
        "category": "grains"
      },
      {
        "name": "Saffron",
        "quantity": 1,
        "unit": "pinch",
        "category": "spices"
      },
      {
        "name": "Cardamom",
        "quantity": 1,
        "unit": "tsp",
        "category": "spices"
      },
      {
        "name": "Rose Syrup",
        "quantity": 2,
        "unit": "tbsp",
        "category": "pantry"
      },
      {
        "name": "Basil Seeds (Sabja)",
        "quantity": 1,
        "unit": "tsp",
        "category": "pantry"
      },
      {
        "name": "Pistachios",
        "quantity": 2,
        "unit": "tbsp",
        "category": "pantry"
      }
    ],
    "khar": [
      {
        "name": "Mustard Greens",
        "quantity": 250,
        "unit": "g",
        "category": "produce"
      },
      {
        "name": "Khar",
        "quantity": 2,
        "unit": "tbsp",
        "category": "pantry"
      },
      {
        "name": "Green Chilli",
        "quantity": 2,
        "unit": "pc",
        "category": "produce"
      },
      {
        "name": "Ginger",
        "quantity": 10,
        "unit": "g",
        "category": "produce"
      },
      {
        "name": "Turmeric",
        "quantity": 0.5,
        "unit": "tsp",
        "category": "spices"
      },
      {
        "name": "Mustard Oil",
        "quantity": 1,
        "unit": "tbsp",
        "category": "pantry"
      },
      {
        "name": "Salt",
        "quantity": 1,
        "unit": "tsp",
        "category": "pantry"
      }
    ],
    "dal-puri": [
      {
        "name": "Maida",
        "quantity": 1.5,
        "unit": "cup",
        "category": "grains"
      },
      {
        "name": "Toor Dal",
        "quantity": 0.5,
        "unit": "cup",
        "category": "proteins"
      },
      {
        "name": "Oil",
        "quantity": 2,
        "unit": "tbsp",
        "category": "pantry"
      },
      {
        "name": "Red Chilli Powder",
        "quantity": 0.5,
        "unit": "tsp",
        "category": "spices"
      },
      {
        "name": "Turmeric",
        "quantity": 0.25,
        "unit": "tsp",
        "category": "spices"
      },
      {
        "name": "Cumin Seeds",
        "quantity": 0.5,
        "unit": "tsp",
        "category": "spices"
      },
      {
        "name": "Salt",
        "quantity": 1,
        "unit": "tsp",
        "category": "pantry"
      },
      {
        "name": "Water",
        "quantity": 0.5,
        "unit": "cup",
        "category": "pantry"
      },
      {
        "name": "Mixed Dal",
        "quantity": 80,
        "unit": "g",
        "category": "proteins",
        "inStock": false
      }
    ],
    "methi-malai-matar": [
      {
        "name": "Green Peas",
        "quantity": 100,
        "unit": "g",
        "category": "produce",
        "inStock": false
      },
      {
        "name": "Fenugreek Leaves",
        "quantity": 100,
        "unit": "g",
        "category": "produce",
        "inStock": false
      },
      {
        "name": "Ghee",
        "quantity": 2,
        "unit": "tbsp",
        "category": "pantry",
        "inStock": false
      },
      {
        "name": "Oil",
        "quantity": 2,
        "unit": "tbsp",
        "category": "pantry",
        "inStock": false
      },
      {
        "name": "Spices",
        "quantity": 1,
        "unit": "packet",
        "category": "spices",
        "inStock": false
      },
      {
        "name": "Onion",
        "quantity": 1,
        "unit": "pc",
        "category": "produce",
        "inStock": false
      },
      {
        "name": "Tomato",
        "quantity": 2,
        "unit": "pc",
        "category": "produce",
        "inStock": false
      },
      {
        "name": "Green Chilli",
        "quantity": 2,
        "unit": "pc",
        "category": "produce",
        "inStock": false
      },
      {
        "name": "Ginger-Garlic Paste",
        "quantity": 1,
        "unit": "tbsp",
        "category": "produce",
        "inStock": false
      },
      {
        "name": "Coriander Leaves",
        "quantity": 0.25,
        "unit": "cup",
        "category": "produce",
        "inStock": false
      },
      {
        "name": "Salt",
        "quantity": 1,
        "unit": "tsp",
        "category": "pantry"
      },
      {
        "name": "Turmeric",
        "quantity": 0.5,
        "unit": "tsp",
        "category": "spices"
      },
      {
        "name": "Cumin Seeds",
        "quantity": 1,
        "unit": "tsp",
        "category": "spices"
      },
      {
        "name": "Red Chili Powder",
        "quantity": 0.5,
        "unit": "tsp",
        "category": "spices"
      }
    ],
    "chicken-malai-tikka": [
      {
        "name": "Chicken",
        "quantity": 400,
        "unit": "g",
        "category": "proteins"
      },
      {
        "name": "Cream",
        "quantity": 0.5,
        "unit": "cup",
        "category": "dairy"
      },
      {
        "name": "Cheese",
        "quantity": 50,
        "unit": "g",
        "category": "dairy"
      },
      {
        "name": "Yogurt",
        "quantity": 0.25,
        "unit": "cup",
        "category": "dairy"
      },
      {
        "name": "Ginger-Garlic Paste",
        "quantity": 1,
        "unit": "tbsp",
        "category": "pantry"
      },
      {
        "name": "Green Chilli",
        "quantity": 1,
        "unit": "pc",
        "category": "produce"
      },
      {
        "name": "Cardamom Powder",
        "quantity": 0.5,
        "unit": "tsp",
        "category": "spices"
      },
      {
        "name": "Garam Masala",
        "quantity": 0.5,
        "unit": "tsp",
        "category": "spices"
      },
      {
        "name": "Salt",
        "quantity": 1,
        "unit": "tsp",
        "category": "pantry"
      },
      {
        "name": "Oil",
        "quantity": 1,
        "unit": "tbsp",
        "category": "pantry"
      },
      {
        "name": "Naan",
        "quantity": 2,
        "unit": "pc",
        "category": "breads"
      }
    ],
    "mango-lassi": [
      {
        "name": "Yogurt",
        "quantity": 1,
        "unit": "cup",
        "category": "dairy"
      },
      {
        "name": "Mango",
        "quantity": 1,
        "unit": "pc",
        "category": "produce"
      },
      {
        "name": "Sugar",
        "quantity": 2,
        "unit": "tbsp",
        "category": "pantry"
      },
      {
        "name": "Milk",
        "quantity": 0.25,
        "unit": "cup",
        "category": "dairy"
      },
      {
        "name": "Cardamom",
        "quantity": 1,
        "unit": "pinch",
        "category": "spices"
      },
      {
        "name": "Ice",
        "quantity": 0.5,
        "unit": "cup",
        "category": "pantry"
      }
    ],
    "besan_chilla_north": [
      {
        "name": "Gram Flour",
        "quantity": 100,
        "unit": "g",
        "category": "grains",
        "inStock": false
      },
      {
        "name": "Onions",
        "quantity": 1,
        "unit": "pc",
        "category": "produce",
        "inStock": false
      },
      {
        "name": "Green Chilli",
        "quantity": 2,
        "unit": "pc",
        "category": "produce",
        "inStock": false
      },
      {
        "name": "Oil",
        "quantity": 2,
        "unit": "tbsp",
        "category": "pantry",
        "inStock": false
      },
      {
        "name": "Spices",
        "quantity": 1,
        "unit": "packet",
        "category": "spices",
        "inStock": false
      }
    ],
    "suji_chilla_north": [
      {
        "name": "Semolina (Rava)",
        "quantity": 100,
        "unit": "g",
        "category": "grains",
        "inStock": false
      },
      {
        "name": "Oil",
        "quantity": 2,
        "unit": "tbsp",
        "category": "pantry",
        "inStock": false
      },
      {
        "name": "Spices",
        "quantity": 1,
        "unit": "packet",
        "category": "spices",
        "inStock": false
      },
      {
        "name": "Onions",
        "quantity": 1,
        "unit": "pc",
        "category": "produce",
        "inStock": false
      },
      {
        "name": "Green Chilli",
        "quantity": 2,
        "unit": "pc",
        "category": "produce",
        "inStock": false
      }
    ],
    "besan_chilla_curry_north": [
      {
        "name": "Gram Flour",
        "quantity": 100,
        "unit": "g",
        "category": "grains",
        "inStock": false
      },
      {
        "name": "Onions",
        "quantity": 1,
        "unit": "pc",
        "category": "produce",
        "inStock": false
      },
      {
        "name": "Green Chilli",
        "quantity": 2,
        "unit": "pc",
        "category": "produce",
        "inStock": false
      },
      {
        "name": "Oil",
        "quantity": 2,
        "unit": "tbsp",
        "category": "pantry",
        "inStock": false
      },
      {
        "name": "Spices",
        "quantity": 1,
        "unit": "packet",
        "category": "spices",
        "inStock": false
      },
      {
        "name": "Rice",
        "quantity": 1,
        "unit": "cup",
        "category": "grains",
        "inStock": false
      },
      {
        "name": "Salt",
        "quantity": 1,
        "unit": "tsp",
        "category": "pantry"
      },
      {
        "name": "Turmeric",
        "quantity": 0.5,
        "unit": "tsp",
        "category": "spices"
      },
      {
        "name": "Cumin Seeds",
        "quantity": 1,
        "unit": "tsp",
        "category": "spices"
      },
      {
        "name": "Red Chili Powder",
        "quantity": 0.5,
        "unit": "tsp",
        "category": "spices"
      }
    ],
    "methi_chilla_north": [
      {
        "name": "Fenugreek Leaves",
        "quantity": 100,
        "unit": "g",
        "category": "produce",
        "inStock": false
      },
      {
        "name": "Gram Flour",
        "quantity": 100,
        "unit": "g",
        "category": "grains",
        "inStock": false
      },
      {
        "name": "Onions",
        "quantity": 1,
        "unit": "pc",
        "category": "produce",
        "inStock": false
      },
      {
        "name": "Oil",
        "quantity": 2,
        "unit": "tbsp",
        "category": "pantry",
        "inStock": false
      },
      {
        "name": "Spices",
        "quantity": 1,
        "unit": "packet",
        "category": "spices",
        "inStock": false
      },
      {
        "name": "Green Chilli",
        "quantity": 2,
        "unit": "pc",
        "category": "produce",
        "inStock": false
      }
    ],
    "rice_chilla_gujarat": [
      {
        "name": "Rice",
        "quantity": 1,
        "unit": "cup",
        "category": "grains",
        "inStock": false
      },
      {
        "name": "Rice Flour",
        "quantity": 100,
        "unit": "g",
        "category": "grains",
        "inStock": false
      },
      {
        "name": "Oil",
        "quantity": 2,
        "unit": "tbsp",
        "category": "pantry",
        "inStock": false
      },
      {
        "name": "Spices",
        "quantity": 1,
        "unit": "packet",
        "category": "spices",
        "inStock": false
      },
      {
        "name": "Onions",
        "quantity": 1,
        "unit": "pc",
        "category": "produce",
        "inStock": false
      },
      {
        "name": "Green Chilli",
        "quantity": 2,
        "unit": "pc",
        "category": "produce",
        "inStock": false
      },
      {
        "name": "Salt",
        "quantity": 1,
        "unit": "tsp",
        "category": "pantry"
      },
      {
        "name": "Turmeric",
        "quantity": 0.5,
        "unit": "tsp",
        "category": "spices"
      },
      {
        "name": "Whole Spices",
        "quantity": 1,
        "unit": "tsp",
        "category": "spices"
      }
    ],
    "poha_chilla_mh": [
      {
        "name": "Poha (Flattened Rice)",
        "quantity": 100,
        "unit": "g",
        "category": "grains",
        "inStock": false
      },
      {
        "name": "Peanuts",
        "quantity": 30,
        "unit": "g",
        "category": "proteins",
        "inStock": false
      },
      {
        "name": "Potatoes",
        "quantity": 1,
        "unit": "pc",
        "category": "produce",
        "inStock": false
      },
      {
        "name": "Gram Flour",
        "quantity": 100,
        "unit": "g",
        "category": "grains",
        "inStock": false
      },
      {
        "name": "Onions",
        "quantity": 1,
        "unit": "pc",
        "category": "produce",
        "inStock": false
      },
      {
        "name": "Oil",
        "quantity": 2,
        "unit": "tbsp",
        "category": "pantry",
        "inStock": false
      },
      {
        "name": "Spices",
        "quantity": 1,
        "unit": "packet",
        "category": "spices",
        "inStock": false
      },
      {
        "name": "Green Chilli",
        "quantity": 2,
        "unit": "pc",
        "category": "produce",
        "inStock": false
      }
    ],
    "mixed_veg_chilla_mh": [
      {
        "name": "Mixed Vegetables",
        "quantity": 1,
        "unit": "cup",
        "category": "produce",
        "inStock": false
      },
      {
        "name": "Gram Flour",
        "quantity": 100,
        "unit": "g",
        "category": "grains",
        "inStock": false
      },
      {
        "name": "Onions",
        "quantity": 1,
        "unit": "pc",
        "category": "produce",
        "inStock": false
      },
      {
        "name": "Oil",
        "quantity": 2,
        "unit": "tbsp",
        "category": "pantry",
        "inStock": false
      },
      {
        "name": "Spices",
        "quantity": 1,
        "unit": "packet",
        "category": "spices",
        "inStock": false
      },
      {
        "name": "Green Chilli",
        "quantity": 2,
        "unit": "pc",
        "category": "produce",
        "inStock": false
      }
    ],
    "rice_chilla_cg": [
      {
        "name": "Rice",
        "quantity": 1,
        "unit": "cup",
        "category": "grains",
        "inStock": false
      },
      {
        "name": "Rice Flour",
        "quantity": 100,
        "unit": "g",
        "category": "grains",
        "inStock": false
      },
      {
        "name": "Oil",
        "quantity": 2,
        "unit": "tbsp",
        "category": "pantry",
        "inStock": false
      },
      {
        "name": "Spices",
        "quantity": 1,
        "unit": "packet",
        "category": "spices",
        "inStock": false
      },
      {
        "name": "Onions",
        "quantity": 1,
        "unit": "pc",
        "category": "produce",
        "inStock": false
      },
      {
        "name": "Green Chilli",
        "quantity": 2,
        "unit": "pc",
        "category": "produce",
        "inStock": false
      },
      {
        "name": "Salt",
        "quantity": 1,
        "unit": "tsp",
        "category": "pantry"
      },
      {
        "name": "Turmeric",
        "quantity": 0.5,
        "unit": "tsp",
        "category": "spices"
      },
      {
        "name": "Whole Spices",
        "quantity": 1,
        "unit": "tsp",
        "category": "spices"
      }
    ],
    "dal_rice_chilla_east": [
      {
        "name": "Mixed Dal",
        "quantity": 80,
        "unit": "g",
        "category": "proteins",
        "inStock": false
      },
      {
        "name": "Rice",
        "quantity": 1,
        "unit": "cup",
        "category": "grains",
        "inStock": false
      },
      {
        "name": "Rice Flour",
        "quantity": 100,
        "unit": "g",
        "category": "grains",
        "inStock": false
      },
      {
        "name": "Oil",
        "quantity": 2,
        "unit": "tbsp",
        "category": "pantry",
        "inStock": false
      },
      {
        "name": "Spices",
        "quantity": 1,
        "unit": "packet",
        "category": "spices",
        "inStock": false
      },
      {
        "name": "Toor Dal",
        "quantity": 1,
        "unit": "cup",
        "category": "grains",
        "inStock": false
      },
      {
        "name": "Onions",
        "quantity": 1,
        "unit": "pc",
        "category": "produce",
        "inStock": false
      },
      {
        "name": "Green Chilli",
        "quantity": 2,
        "unit": "pc",
        "category": "produce",
        "inStock": false
      },
      {
        "name": "Salt",
        "quantity": 1,
        "unit": "tsp",
        "category": "pantry"
      },
      {
        "name": "Turmeric",
        "quantity": 0.5,
        "unit": "tsp",
        "category": "spices"
      },
      {
        "name": "Mustard Oil",
        "quantity": 1,
        "unit": "tbsp",
        "category": "pantry"
      },
      {
        "name": "Whole Spices",
        "quantity": 1,
        "unit": "tsp",
        "category": "spices"
      },
      {
        "name": "Cumin Seeds",
        "quantity": 1,
        "unit": "tsp",
        "category": "spices"
      },
      {
        "name": "Panch Phoron",
        "quantity": 0.5,
        "unit": "tsp",
        "category": "spices"
      }
    ],
    "moong_dal_chilla_south": [
      {
        "name": "Moong Dal",
        "quantity": 80,
        "unit": "g",
        "category": "proteins",
        "inStock": false
      },
      {
        "name": "Gram Flour",
        "quantity": 100,
        "unit": "g",
        "category": "grains",
        "inStock": false
      },
      {
        "name": "Onions",
        "quantity": 1,
        "unit": "pc",
        "category": "produce",
        "inStock": false
      },
      {
        "name": "Oil",
        "quantity": 2,
        "unit": "tbsp",
        "category": "pantry",
        "inStock": false
      },
      {
        "name": "Spices",
        "quantity": 1,
        "unit": "packet",
        "category": "spices",
        "inStock": false
      },
      {
        "name": "Rice",
        "quantity": 30,
        "unit": "g",
        "category": "grains",
        "inStock": false
      },
      {
        "name": "Ginger",
        "quantity": 10,
        "unit": "g",
        "category": "produce",
        "inStock": false
      },
      {
        "name": "Green Chilli",
        "quantity": 2,
        "unit": "pc",
        "category": "produce",
        "inStock": false
      },
      {
        "name": "Toor Dal",
        "quantity": 1,
        "unit": "cup",
        "category": "grains",
        "inStock": false
      },
      {
        "name": "Salt",
        "quantity": 1,
        "unit": "tsp",
        "category": "pantry"
      },
      {
        "name": "Turmeric",
        "quantity": 0.5,
        "unit": "tsp",
        "category": "spices"
      },
      {
        "name": "Coconut",
        "quantity": 0.5,
        "unit": "cup",
        "category": "produce"
      },
      {
        "name": "Curry Leaves",
        "quantity": 1,
        "unit": "sprig",
        "category": "produce"
      },
      {
        "name": "Mustard Seeds",
        "quantity": 1,
        "unit": "tsp",
        "category": "spices"
      },
      {
        "name": "Tamarind",
        "quantity": 1,
        "unit": "tbsp",
        "category": "pantry"
      },
      {
        "name": "Cumin Seeds",
        "quantity": 1,
        "unit": "tsp",
        "category": "spices"
      }
    ],
    "mysore_dalia_dosa": [
      {
        "name": "Mixed Dal",
        "quantity": 80,
        "unit": "g",
        "category": "proteins",
        "inStock": false
      },
      {
        "name": "Rice",
        "quantity": 1,
        "unit": "cup",
        "category": "grains",
        "inStock": false
      },
      {
        "name": "Urad Dal",
        "quantity": 50,
        "unit": "g",
        "category": "proteins",
        "inStock": false
      },
      {
        "name": "Gram Flour",
        "quantity": 100,
        "unit": "g",
        "category": "grains",
        "inStock": false
      },
      {
        "name": "Sugar",
        "quantity": 100,
        "unit": "g",
        "category": "pantry",
        "inStock": false
      },
      {
        "name": "Oil",
        "quantity": 2,
        "unit": "tbsp",
        "category": "pantry",
        "inStock": false
      },
      {
        "name": "Spices",
        "quantity": 1,
        "unit": "packet",
        "category": "spices",
        "inStock": false
      },
      {
        "name": "Toor Dal",
        "quantity": 1,
        "unit": "cup",
        "category": "grains",
        "inStock": false
      },
      {
        "name": "Cumin Seeds",
        "quantity": 1,
        "unit": "tsp",
        "category": "spices"
      },
      {
        "name": "Cardamom",
        "quantity": 2,
        "unit": "pods",
        "category": "spices"
      },
      {
        "name": "Raisins",
        "quantity": 2,
        "unit": "tbsp",
        "category": "pantry"
      },
      {
        "name": "Almonds",
        "quantity": 2,
        "unit": "tbsp",
        "category": "pantry"
      },
      {
        "name": "Pistachios",
        "quantity": 1,
        "unit": "tbsp",
        "category": "pantry"
      }
    ],
    "oats_sprouts_chilla": [
      {
        "name": "Oats",
        "quantity": 100,
        "unit": "g",
        "category": "grains",
        "inStock": false
      },
      {
        "name": "Mixed Sprouts",
        "quantity": 100,
        "unit": "g",
        "category": "proteins",
        "inStock": false
      },
      {
        "name": "Oil",
        "quantity": 2,
        "unit": "tbsp",
        "category": "pantry",
        "inStock": false
      },
      {
        "name": "Spices",
        "quantity": 1,
        "unit": "packet",
        "category": "spices",
        "inStock": false
      },
      {
        "name": "Onions",
        "quantity": 1,
        "unit": "pc",
        "category": "produce",
        "inStock": false
      },
      {
        "name": "Green Chilli",
        "quantity": 2,
        "unit": "pc",
        "category": "produce",
        "inStock": false
      },
      {
        "name": "Flour",
        "quantity": 1.5,
        "unit": "cups",
        "category": "grains"
      },
      {
        "name": "Sugar",
        "quantity": 0.5,
        "unit": "cup",
        "category": "pantry"
      },
      {
        "name": "Baking Powder",
        "quantity": 1,
        "unit": "tsp",
        "category": "pantry"
      }
    ],
    "paneer_chilla": [
      {
        "name": "Paneer",
        "quantity": 150,
        "unit": "g",
        "category": "proteins",
        "inStock": false
      },
      {
        "name": "Gram Flour",
        "quantity": 100,
        "unit": "g",
        "category": "grains",
        "inStock": false
      },
      {
        "name": "Onions",
        "quantity": 1,
        "unit": "pc",
        "category": "produce",
        "inStock": false
      },
      {
        "name": "Ghee",
        "quantity": 2,
        "unit": "tbsp",
        "category": "pantry",
        "inStock": false
      },
      {
        "name": "Oil",
        "quantity": 2,
        "unit": "tbsp",
        "category": "pantry",
        "inStock": false
      },
      {
        "name": "Spices",
        "quantity": 1,
        "unit": "packet",
        "category": "spices",
        "inStock": false
      },
      {
        "name": "Green Chilli",
        "quantity": 2,
        "unit": "pc",
        "category": "produce",
        "inStock": false
      },
      {
        "name": "Salt",
        "quantity": 1,
        "unit": "tsp",
        "category": "pantry"
      },
      {
        "name": "Turmeric",
        "quantity": 0.5,
        "unit": "tsp",
        "category": "spices"
      }
    ],
    "singhara_chilla_vrat": [
      {
        "name": "Singhara Flour",
        "quantity": 100,
        "unit": "g",
        "category": "grains",
        "inStock": false
      },
      {
        "name": "Oil",
        "quantity": 2,
        "unit": "tbsp",
        "category": "pantry",
        "inStock": false
      },
      {
        "name": "Spices",
        "quantity": 1,
        "unit": "packet",
        "category": "spices",
        "inStock": false
      },
      {
        "name": "Onions",
        "quantity": 1,
        "unit": "pc",
        "category": "produce",
        "inStock": false
      },
      {
        "name": "Green Chilli",
        "quantity": 2,
        "unit": "pc",
        "category": "produce",
        "inStock": false
      }
    ],
    "samosa": [
      {
        "name": "Potatoes",
        "quantity": 3,
        "unit": "pcs",
        "category": "produce"
      },
      {
        "name": "Peas",
        "quantity": 0.5,
        "unit": "cup",
        "category": "produce"
      },
      {
        "name": "Flour",
        "quantity": 2,
        "unit": "cups",
        "category": "grains"
      },
      {
        "name": "Cumin Seeds",
        "quantity": 1,
        "unit": "tsp",
        "category": "spices"
      },
      {
        "name": "Salt",
        "quantity": 1,
        "unit": "tsp",
        "category": "pantry"
      },
      {
        "name": "Green Chili",
        "quantity": 1,
        "unit": "pc",
        "category": "produce"
      },
      {
        "name": "Garam Masala",
        "quantity": 0.5,
        "unit": "tsp",
        "category": "spices"
      },
      {
        "name": "Oil",
        "quantity": 3,
        "unit": "tbsp",
        "category": "pantry"
      }
    ],
    "masala-chai": [
      {
        "name": "Tea Leaves",
        "quantity": 1,
        "unit": "tsp",
        "category": "pantry"
      },
      {
        "name": "Milk",
        "quantity": 1,
        "unit": "cup",
        "category": "dairy"
      },
      {
        "name": "Ginger",
        "quantity": 1,
        "unit": "inch",
        "category": "produce"
      },
      {
        "name": "Cardamom",
        "quantity": 2,
        "unit": "pods",
        "category": "spices"
      },
      {
        "name": "Cinnamon",
        "quantity": 0.5,
        "unit": "inch",
        "category": "spices"
      },
      {
        "name": "Cloves",
        "quantity": 2,
        "unit": "pcs",
        "category": "spices"
      },
      {
        "name": "Sugar",
        "quantity": 2,
        "unit": "tsp",
        "category": "pantry"
      }
    ],
    "badam-milk": [
      {
        "name": "Milk",
        "quantity": 1,
        "unit": "cup",
        "category": "dairy"
      },
      {
        "name": "Almonds",
        "quantity": 10,
        "unit": "pcs",
        "category": "pantry"
      },
      {
        "name": "Sugar",
        "quantity": 2,
        "unit": "tsp",
        "category": "pantry"
      },
      {
        "name": "Cardamom",
        "quantity": 1,
        "unit": "pod",
        "category": "spices"
      },
      {
        "name": "Saffron",
        "quantity": 2,
        "unit": "strands",
        "category": "spices"
      }
    ],
    "rose-milk": [
      {
        "name": "Milk",
        "quantity": 1,
        "unit": "cup",
        "category": "dairy"
      },
      {
        "name": "Rose Syrup",
        "quantity": 2,
        "unit": "tbsp",
        "category": "pantry"
      },
      {
        "name": "Sugar",
        "quantity": 1,
        "unit": "tsp",
        "category": "pantry"
      },
      {
        "name": "Ice Cubes",
        "quantity": 4,
        "unit": "pcs",
        "category": "pantry"
      }
    ],
    "kesar-milk": [
      {
        "name": "Milk",
        "quantity": 1,
        "unit": "cup",
        "category": "dairy"
      },
      {
        "name": "Saffron",
        "quantity": 4,
        "unit": "strands",
        "category": "spices"
      },
      {
        "name": "Sugar",
        "quantity": 2,
        "unit": "tsp",
        "category": "pantry"
      },
      {
        "name": "Cardamom",
        "quantity": 1,
        "unit": "pod",
        "category": "spices"
      },
      {
        "name": "Pistachios",
        "quantity": 5,
        "unit": "pcs",
        "category": "pantry"
      }
    ],
    "sugandha-milk": [
      {
        "name": "Milk",
        "quantity": 250,
        "unit": "ml",
        "category": "dairy"
      },
      {
        "name": "Rose Water",
        "quantity": 1,
        "unit": "tsp",
        "category": "pantry"
      },
      {
        "name": "Sugar",
        "quantity": 2,
        "unit": "tbsp",
        "category": "pantry"
      },
      {
        "name": "Cardamom",
        "quantity": 0.25,
        "unit": "tsp",
        "category": "spices"
      },
      {
        "name": "Saffron",
        "quantity": 1,
        "unit": "pinch",
        "category": "spices"
      },
      {
        "name": "Almonds",
        "quantity": 10,
        "unit": "g",
        "category": "pantry"
      }
    ],
    "doodh-soda": [
      {
        "name": "Milk",
        "quantity": 0.5,
        "unit": "cup",
        "category": "dairy"
      },
      {
        "name": "Lemon-Lime Soda",
        "quantity": 0.5,
        "unit": "cup",
        "category": "pantry"
      },
      {
        "name": "Sugar",
        "quantity": 1,
        "unit": "tsp",
        "category": "pantry"
      },
      {
        "name": "Ice Cubes",
        "quantity": 4,
        "unit": "pcs",
        "category": "pantry"
      }
    ],
    "haldi-doodh": [
      {
        "name": "Milk",
        "quantity": 1,
        "unit": "cup",
        "category": "dairy"
      },
      {
        "name": "Turmeric Powder",
        "quantity": 0.5,
        "unit": "tsp",
        "category": "spices"
      },
      {
        "name": "Honey",
        "quantity": 1,
        "unit": "tsp",
        "category": "pantry"
      },
      {
        "name": "Black Pepper",
        "quantity": 1,
        "unit": "pinch",
        "category": "spices"
      }
    ],
    "butter-tea": [
      {
        "name": "Tea Leaves",
        "quantity": 1,
        "unit": "tsp",
        "category": "pantry"
      },
      {
        "name": "Yak Butter",
        "quantity": 1,
        "unit": "tbsp",
        "category": "dairy"
      },
      {
        "name": "Salt",
        "quantity": 0.25,
        "unit": "tsp",
        "category": "pantry"
      },
      {
        "name": "Water",
        "quantity": 1,
        "unit": "cup",
        "category": "pantry"
      }
    ],
    "elaichi-tea": [
      {
        "name": "Tea Leaves",
        "quantity": 1,
        "unit": "tsp",
        "category": "pantry"
      },
      {
        "name": "Milk",
        "quantity": 1,
        "unit": "cup",
        "category": "dairy"
      },
      {
        "name": "Cardamom",
        "quantity": 2,
        "unit": "pods",
        "category": "spices"
      },
      {
        "name": "Sugar",
        "quantity": 2,
        "unit": "tsp",
        "category": "pantry"
      }
    ],
    "ginger-tea": [
      {
        "name": "Tea Leaves",
        "quantity": 1,
        "unit": "tsp",
        "category": "pantry"
      },
      {
        "name": "Ginger",
        "quantity": 1,
        "unit": "inch",
        "category": "produce"
      },
      {
        "name": "Milk",
        "quantity": 1,
        "unit": "cup",
        "category": "dairy"
      },
      {
        "name": "Sugar",
        "quantity": 2,
        "unit": "tsp",
        "category": "pantry"
      }
    ],
    "lemon-tea": [
      {
        "name": "Tea Leaves",
        "quantity": 1,
        "unit": "tsp",
        "category": "pantry"
      },
      {
        "name": "Lemon Juice",
        "quantity": 1,
        "unit": "tbsp",
        "category": "produce"
      },
      {
        "name": "Honey",
        "quantity": 1,
        "unit": "tsp",
        "category": "pantry"
      },
      {
        "name": "Water",
        "quantity": 1,
        "unit": "cup",
        "category": "pantry"
      }
    ],
    "tejpatta-tea": [
      {
        "name": "Bay Leaves",
        "quantity": 2,
        "unit": "pcs",
        "category": "spices"
      },
      {
        "name": "Tea Leaves",
        "quantity": 1,
        "unit": "tsp",
        "category": "pantry"
      },
      {
        "name": "Milk",
        "quantity": 1,
        "unit": "cup",
        "category": "dairy"
      },
      {
        "name": "Sugar",
        "quantity": 2,
        "unit": "tsp",
        "category": "pantry"
      }
    ],
    "assam-tea": [
      {
        "name": "Assam Tea Leaves",
        "quantity": 1,
        "unit": "tsp",
        "category": "pantry"
      },
      {
        "name": "Milk",
        "quantity": 1,
        "unit": "cup",
        "category": "dairy"
      },
      {
        "name": "Sugar",
        "quantity": 2,
        "unit": "tsp",
        "category": "pantry"
      }
    ],
    "ayurvedic-tea": [
      {
        "name": "Tulsi Leaves",
        "quantity": 5,
        "unit": "pcs",
        "category": "spices"
      },
      {
        "name": "Ginger",
        "quantity": 0.5,
        "unit": "inch",
        "category": "produce"
      },
      {
        "name": "Cinnamon",
        "quantity": 0.5,
        "unit": "inch",
        "category": "spices"
      },
      {
        "name": "Honey",
        "quantity": 1,
        "unit": "tsp",
        "category": "pantry"
      },
      {
        "name": "Water",
        "quantity": 1,
        "unit": "cup",
        "category": "pantry"
      }
    ],
    "temi-tea": [
      {
        "name": "Temi Tea Leaves",
        "quantity": 1,
        "unit": "tsp",
        "category": "pantry"
      },
      {
        "name": "Water",
        "quantity": 1,
        "unit": "cup",
        "category": "pantry"
      },
      {
        "name": "Honey",
        "quantity": 1,
        "unit": "tsp",
        "category": "pantry"
      }
    ],
    "darjeeling-tea": [
      {
        "name": "Darjeeling Tea Leaves",
        "quantity": 1,
        "unit": "tsp",
        "category": "pantry"
      },
      {
        "name": "Water",
        "quantity": 1,
        "unit": "cup",
        "category": "pantry"
      },
      {
        "name": "Lemon",
        "quantity": 1,
        "unit": "slice",
        "category": "produce"
      }
    ],
    "balma-green-tea": [
      {
        "name": "Green Tea Leaves",
        "quantity": 1,
        "unit": "tsp",
        "category": "pantry"
      },
      {
        "name": "Water",
        "quantity": 1,
        "unit": "cup",
        "category": "pantry"
      },
      {
        "name": "Honey",
        "quantity": 1,
        "unit": "tsp",
        "category": "pantry"
      }
    ],
    "berinag-tea": [
      {
        "name": "Berinag Tea Leaves",
        "quantity": 1,
        "unit": "tsp",
        "category": "pantry"
      },
      {
        "name": "Water",
        "quantity": 1,
        "unit": "cup",
        "category": "pantry"
      },
      {
        "name": "Sugar",
        "quantity": 1,
        "unit": "tsp",
        "category": "pantry"
      }
    ],
    "black-tea": [
      {
        "name": "Black Tea Leaves",
        "quantity": 1,
        "unit": "tsp",
        "category": "pantry"
      },
      {
        "name": "Water",
        "quantity": 1,
        "unit": "cup",
        "category": "pantry"
      },
      {
        "name": "Sugar",
        "quantity": 2,
        "unit": "tsp",
        "category": "pantry"
      },
      {
        "name": "Lemon",
        "quantity": 1,
        "unit": "slice",
        "category": "produce"
      }
    ],
    "green-tea": [
      {
        "name": "Green Tea Leaves",
        "quantity": 1,
        "unit": "tsp",
        "category": "pantry"
      },
      {
        "name": "Water",
        "quantity": 1,
        "unit": "cup",
        "category": "pantry"
      },
      {
        "name": "Honey",
        "quantity": 1,
        "unit": "tsp",
        "category": "pantry"
      }
    ],
    "seven-colour-tea": [
      {
        "name": "Tea Leaves",
        "quantity": 1,
        "unit": "tsp",
        "category": "pantry"
      },
      {
        "name": "Milk",
        "quantity": 1,
        "unit": "cup",
        "category": "dairy"
      },
      {
        "name": "Saffron",
        "quantity": 2,
        "unit": "strands",
        "category": "spices"
      },
      {
        "name": "Rose Water",
        "quantity": 0.5,
        "unit": "tsp",
        "category": "pantry"
      },
      {
        "name": "Sugar",
        "quantity": 2,
        "unit": "tsp",
        "category": "pantry"
      }
    ],
    "irani-chai": [
      {
        "name": "Tea Leaves",
        "quantity": 2,
        "unit": "tsp",
        "category": "pantry"
      },
      {
        "name": "Milk",
        "quantity": 1,
        "unit": "cup",
        "category": "dairy"
      },
      {
        "name": "Sugar",
        "quantity": 3,
        "unit": "tsp",
        "category": "pantry"
      },
      {
        "name": "Cardamom",
        "quantity": 1,
        "unit": "pod",
        "category": "spices"
      }
    ],
    "kangra-tea": [
      {
        "name": "Kangra Tea Leaves",
        "quantity": 1,
        "unit": "tsp",
        "category": "pantry"
      },
      {
        "name": "Water",
        "quantity": 1,
        "unit": "cup",
        "category": "pantry"
      },
      {
        "name": "Honey",
        "quantity": 1,
        "unit": "tsp",
        "category": "pantry"
      }
    ],
    "milk-tea": [
      {
        "name": "Tea Leaves",
        "quantity": 1,
        "unit": "tsp",
        "category": "pantry"
      },
      {
        "name": "Milk",
        "quantity": 1,
        "unit": "cup",
        "category": "dairy"
      },
      {
        "name": "Sugar",
        "quantity": 2,
        "unit": "tsp",
        "category": "pantry"
      }
    ],
    "espresso": [
      {
        "name": "Espresso Coffee Grounds",
        "quantity": 2,
        "unit": "tbsp",
        "category": "pantry"
      },
      {
        "name": "Water",
        "quantity": 1,
        "unit": "oz",
        "category": "pantry"
      },
      {
        "name": "Sugar",
        "quantity": 1,
        "unit": "tsp",
        "category": "pantry"
      }
    ],
    "americano": [
      {
        "name": "Espresso Coffee Grounds",
        "quantity": 2,
        "unit": "tbsp",
        "category": "pantry"
      },
      {
        "name": "Hot Water",
        "quantity": 6,
        "unit": "oz",
        "category": "pantry"
      },
      {
        "name": "Sugar",
        "quantity": 1,
        "unit": "tsp",
        "category": "pantry"
      }
    ],
    "latte": [
      {
        "name": "Espresso Coffee Grounds",
        "quantity": 2,
        "unit": "tbsp",
        "category": "pantry"
      },
      {
        "name": "Milk",
        "quantity": 6,
        "unit": "oz",
        "category": "dairy"
      },
      {
        "name": "Foam",
        "quantity": 0.25,
        "unit": "oz",
        "category": "dairy"
      }
    ],
    "cappuccino": [
      {
        "name": "Espresso Coffee Grounds",
        "quantity": 2,
        "unit": "tbsp",
        "category": "pantry"
      },
      {
        "name": "Steamed Milk",
        "quantity": 2,
        "unit": "oz",
        "category": "dairy"
      },
      {
        "name": "Milk Foam",
        "quantity": 2,
        "unit": "oz",
        "category": "dairy"
      }
    ],
    "flat-white": [
      {
        "name": "Espresso Coffee Grounds",
        "quantity": 2,
        "unit": "tbsp",
        "category": "pantry"
      },
      {
        "name": "Steamed Milk",
        "quantity": 4,
        "unit": "oz",
        "category": "dairy"
      },
      {
        "name": "Microfoam",
        "quantity": 0.5,
        "unit": "oz",
        "category": "dairy"
      }
    ],
    "macchiato": [
      {
        "name": "Espresso Coffee Grounds",
        "quantity": 2,
        "unit": "tbsp",
        "category": "pantry"
      },
      {
        "name": "Frothy Milk",
        "quantity": 0.5,
        "unit": "oz",
        "category": "dairy"
      },
      {
        "name": "Sugar",
        "quantity": 1,
        "unit": "tsp",
        "category": "pantry"
      }
    ],
    "cortado": [
      {
        "name": "Espresso Coffee Grounds",
        "quantity": 2,
        "unit": "tbsp",
        "category": "pantry"
      },
      {
        "name": "Steamed Milk",
        "quantity": 2,
        "unit": "oz",
        "category": "dairy"
      },
      {
        "name": "Sugar",
        "quantity": 1,
        "unit": "tsp",
        "category": "pantry"
      }
    ],
    "mocha": [
      {
        "name": "Espresso Coffee Grounds",
        "quantity": 2,
        "unit": "tbsp",
        "category": "pantry"
      },
      {
        "name": "Steamed Milk",
        "quantity": 6,
        "unit": "oz",
        "category": "dairy"
      },
      {
        "name": "Chocolate Syrup",
        "quantity": 2,
        "unit": "tbsp",
        "category": "pantry"
      }
    ],
    "frappe": [
      {
        "name": "Instant Coffee",
        "quantity": 2,
        "unit": "tsp",
        "category": "pantry"
      },
      {
        "name": "Ice Cubes",
        "quantity": 6,
        "unit": "pcs",
        "category": "pantry"
      },
      {
        "name": "Sugar",
        "quantity": 2,
        "unit": "tsp",
        "category": "pantry"
      },
      {
        "name": "Water",
        "quantity": 2,
        "unit": "tbsp",
        "category": "pantry"
      },
      {
        "name": "Milk",
        "quantity": 0.25,
        "unit": "cup",
        "category": "dairy"
      }
    ],
    "iced-coffee": [
      {
        "name": "Brewed Coffee",
        "quantity": 1,
        "unit": "cup",
        "category": "pantry"
      },
      {
        "name": "Ice Cubes",
        "quantity": 6,
        "unit": "pcs",
        "category": "pantry"
      },
      {
        "name": "Milk",
        "quantity": 2,
        "unit": "tbsp",
        "category": "dairy"
      },
      {
        "name": "Sugar",
        "quantity": 1,
        "unit": "tsp",
        "category": "pantry"
      }
    ],
    "mazagran": [
      {
        "name": "Double Espresso",
        "quantity": 2,
        "unit": "oz",
        "category": "pantry"
      },
      {
        "name": "Lemon Juice",
        "quantity": 1,
        "unit": "tbsp",
        "category": "produce"
      },
      {
        "name": "Sugar",
        "quantity": 1,
        "unit": "tsp",
        "category": "pantry"
      },
      {
        "name": "Ice Cubes",
        "quantity": 4,
        "unit": "pcs",
        "category": "pantry"
      }
    ],
    "vermicelli-upma": [
      {
        "name": "Vermicelli (Semiya)",
        "quantity": 1,
        "unit": "cup",
        "category": "grains"
      },
      {
        "name": "Water",
        "quantity": 1.5,
        "unit": "cup",
        "category": "pantry"
      },
      {
        "name": "Oil/Ghee",
        "quantity": 1.5,
        "unit": "tbsp",
        "category": "pantry"
      },
      {
        "name": "Mustard Seeds",
        "quantity": 0.5,
        "unit": "tsp",
        "category": "spices"
      },
      {
        "name": "Urad Dal",
        "quantity": 0.5,
        "unit": "tsp",
        "category": "pantry"
      },
      {
        "name": "Chana Dal",
        "quantity": 0.5,
        "unit": "tsp",
        "category": "pantry"
      },
      {
        "name": "Cashews",
        "quantity": 6,
        "unit": "pcs",
        "category": "pantry"
      },
      {
        "name": "Onion",
        "quantity": 1,
        "unit": "pc",
        "category": "produce"
      },
      {
        "name": "Green Chilies",
        "quantity": 2,
        "unit": "pcs",
        "category": "produce"
      },
      {
        "name": "Ginger",
        "quantity": 1,
        "unit": "tsp",
        "category": "produce"
      },
      {
        "name": "Curry Leaves",
        "quantity": 6,
        "unit": "pcs",
        "category": "spices"
      },
      {
        "name": "Carrots",
        "quantity": 0.25,
        "unit": "cup",
        "category": "produce"
      },
      {
        "name": "Green Peas",
        "quantity": 0.15,
        "unit": "cup",
        "category": "produce"
      },
      {
        "name": "Beans",
        "quantity": 0.1,
        "unit": "cup",
        "category": "produce"
      },
      {
        "name": "Turmeric",
        "quantity": 0.25,
        "unit": "tsp",
        "category": "spices"
      },
      {
        "name": "Salt",
        "quantity": 1,
        "unit": "tsp",
        "category": "pantry"
      },
      {
        "name": "Lemon Juice",
        "quantity": 1,
        "unit": "tsp",
        "category": "produce"
      },
      {
        "name": "Coriander Leaves",
        "quantity": 1,
        "unit": "tbsp",
        "category": "produce"
      }
    ],
    "seviyan-kheer": [
      {
        "name": "Whole Milk",
        "quantity": 1,
        "unit": "liter",
        "category": "dairy"
      },
      {
        "name": "Vermicelli (broken)",
        "quantity": 0.75,
        "unit": "cup",
        "category": "grains"
      },
      {
        "name": "Ghee",
        "quantity": 2,
        "unit": "tbsp",
        "category": "dairy"
      },
      {
        "name": "Sugar",
        "quantity": 0.5,
        "unit": "cup",
        "category": "pantry"
      },
      {
        "name": "Cardamom Powder",
        "quantity": 0.5,
        "unit": "tsp",
        "category": "spices"
      },
      {
        "name": "Almonds",
        "quantity": 1,
        "unit": "tbsp",
        "category": "pantry"
      },
      {
        "name": "Cashews",
        "quantity": 1,
        "unit": "tbsp",
        "category": "pantry"
      },
      {
        "name": "Pistachios",
        "quantity": 1,
        "unit": "tbsp",
        "category": "pantry"
      },
      {
        "name": "Raisins",
        "quantity": 1,
        "unit": "tbsp",
        "category": "pantry"
      }
    ],
    "sheer-khurma": [
      {
        "name": "Whole Milk",
        "quantity": 1,
        "unit": "liter",
        "category": "dairy"
      },
      {
        "name": "Vermicelli (roasted)",
        "quantity": 0.75,
        "unit": "cup",
        "category": "grains"
      },
      {
        "name": "Ghee",
        "quantity": 3,
        "unit": "tbsp",
        "category": "dairy"
      },
      {
        "name": "Sugar",
        "quantity": 0.5,
        "unit": "cup",
        "category": "pantry"
      },
      {
        "name": "Dates (chopped)",
        "quantity": 4,
        "unit": "pcs",
        "category": "pantry"
      },
      {
        "name": "Almonds",
        "quantity": 2,
        "unit": "tbsp",
        "category": "pantry"
      },
      {
        "name": "Cashews",
        "quantity": 2,
        "unit": "tbsp",
        "category": "pantry"
      },
      {
        "name": "Pistachios",
        "quantity": 1,
        "unit": "tbsp",
        "category": "pantry"
      },
      {
        "name": "Raisins",
        "quantity": 1,
        "unit": "tbsp",
        "category": "pantry"
      },
      {
        "name": "Saffron",
        "quantity": 4,
        "unit": "strands",
        "category": "spices"
      },
      {
        "name": "Cardamom Powder",
        "quantity": 0.5,
        "unit": "tsp",
        "category": "spices"
      },
      {
        "name": "Condensed Milk",
        "quantity": 2,
        "unit": "tbsp",
        "category": "dairy"
      }
    ],
    "falooda": [
      {
        "name": "Whole Milk (chilled)",
        "quantity": 1,
        "unit": "cup",
        "category": "dairy"
      },
      {
        "name": "Cornstarch Vermicelli",
        "quantity": 2,
        "unit": "tbsp",
        "category": "grains"
      },
      {
        "name": "Rose Syrup",
        "quantity": 2,
        "unit": "tbsp",
        "category": "pantry"
      },
      {
        "name": "Sweet Basil Seeds",
        "quantity": 1,
        "unit": "tbsp",
        "category": "pantry"
      },
      {
        "name": "Vanilla Ice Cream",
        "quantity": 1,
        "unit": "scoop",
        "category": "dairy"
      },
      {
        "name": "Sugar",
        "quantity": 1,
        "unit": "tsp",
        "category": "pantry"
      },
      {
        "name": "Potatoes",
        "quantity": 3,
        "unit": "pc",
        "category": "produce",
        "inStock": false
      }
    ],
    "balaleet": [
      {
        "name": "Sweet Vermicelli",
        "quantity": 1,
        "unit": "cup",
        "category": "grains"
      },
      {
        "name": "Milk",
        "quantity": 0.5,
        "unit": "cup",
        "category": "dairy"
      },
      {
        "name": "Sugar",
        "quantity": 3,
        "unit": "tbsp",
        "category": "pantry"
      },
      {
        "name": "Cardamom",
        "quantity": 3,
        "unit": "pods",
        "category": "spices"
      },
      {
        "name": "Saffron",
        "quantity": 3,
        "unit": "strands",
        "category": "spices"
      },
      {
        "name": "Rose Water",
        "quantity": 0.5,
        "unit": "tsp",
        "category": "pantry"
      },
      {
        "name": "Eggs",
        "quantity": 2,
        "unit": "pcs",
        "category": "dairy"
      },
      {
        "name": "Ghee",
        "quantity": 1,
        "unit": "tbsp",
        "category": "dairy"
      }
    ],
    "vermicelli-porridge": [
      {
        "name": "Vermicelli",
        "quantity": 0.5,
        "unit": "cup",
        "category": "grains"
      },
      {
        "name": "Milk",
        "quantity": 1,
        "unit": "cup",
        "category": "dairy"
      },
      {
        "name": "Butter",
        "quantity": 1,
        "unit": "tbsp",
        "category": "dairy"
      },
      {
        "name": "Sugar",
        "quantity": 1,
        "unit": "tbsp",
        "category": "pantry"
      },
      {
        "name": "Salt",
        "quantity": 0.25,
        "unit": "tsp",
        "category": "pantry"
      }
    ],
    "rajma-chawal": [
      {
        "name": "Kidney Beans",
        "quantity": 1,
        "unit": "cup",
        "category": "proteins"
      },
      {
        "name": "Rice",
        "quantity": 1,
        "unit": "cup",
        "category": "grains"
      },
      {
        "name": "Onion",
        "quantity": 1,
        "unit": "pc",
        "category": "produce"
      },
      {
        "name": "Tomato",
        "quantity": 2,
        "unit": "pcs",
        "category": "produce"
      },
      {
        "name": "Ginger-Garlic Paste",
        "quantity": 1,
        "unit": "tbsp",
        "category": "pantry"
      },
      {
        "name": "Salt",
        "quantity": 1,
        "unit": "tsp",
        "category": "pantry"
      },
      {
        "name": "Turmeric",
        "quantity": 0.5,
        "unit": "tsp",
        "category": "spices"
      },
      {
        "name": "Red Chili Powder",
        "quantity": 0.5,
        "unit": "tsp",
        "category": "spices"
      },
      {
        "name": "Garam Masala",
        "quantity": 0.5,
        "unit": "tsp",
        "category": "spices"
      },
      {
        "name": "Coriander Leaves",
        "quantity": 0.25,
        "unit": "cup",
        "category": "produce"
      },
      {
        "name": "Oil",
        "quantity": 2,
        "unit": "tbsp",
        "category": "pantry"
      },
      {
        "name": "Rajma",
        "quantity": 1,
        "unit": "cup",
        "category": "grains",
        "inStock": false
      }
    ],
    "paneer-butter-masala": [
      {
        "name": "Paneer",
        "quantity": 200,
        "unit": "g",
        "category": "dairy"
      },
      {
        "name": "Butter",
        "quantity": 2,
        "unit": "tbsp",
        "category": "dairy"
      },
      {
        "name": "Cream",
        "quantity": 0.25,
        "unit": "cup",
        "category": "dairy"
      },
      {
        "name": "Cashew",
        "quantity": 0.25,
        "unit": "cup",
        "category": "pantry"
      },
      {
        "name": "Tomato",
        "quantity": 3,
        "unit": "pcs",
        "category": "produce"
      },
      {
        "name": "Onion",
        "quantity": 1,
        "unit": "pc",
        "category": "produce"
      },
      {
        "name": "Ginger-Garlic Paste",
        "quantity": 1,
        "unit": "tbsp",
        "category": "pantry"
      },
      {
        "name": "Salt",
        "quantity": 1,
        "unit": "tsp",
        "category": "pantry"
      },
      {
        "name": "Red Chili Powder",
        "quantity": 0.5,
        "unit": "tsp",
        "category": "spices"
      },
      {
        "name": "Garam Masala",
        "quantity": 0.5,
        "unit": "tsp",
        "category": "spices"
      },
      {
        "name": "Sugar",
        "quantity": 1,
        "unit": "tsp",
        "category": "pantry"
      }
    ],
    "orange-juice": [
      {
        "name": "Orange",
        "quantity": 4,
        "unit": "pcs",
        "category": "produce"
      },
      {
        "name": "Sugar (optional)",
        "quantity": 1,
        "unit": "tsp",
        "category": "pantry"
      },
      {
        "name": "Ice Cubes",
        "quantity": 4,
        "unit": "pcs",
        "category": "pantry"
      }
    ],
    "apple-juice": [
      {
        "name": "Apple",
        "quantity": 4,
        "unit": "pcs",
        "category": "produce"
      },
      {
        "name": "Lemon Juice",
        "quantity": 1,
        "unit": "tsp",
        "category": "produce"
      },
      {
        "name": "Ice Cubes",
        "quantity": 4,
        "unit": "pcs",
        "category": "pantry"
      }
    ],
    "mango-juice": [
      {
        "name": "Mango (ripe)",
        "quantity": 2,
        "unit": "pcs",
        "category": "produce"
      },
      {
        "name": "Sugar (optional)",
        "quantity": 1,
        "unit": "tsp",
        "category": "pantry"
      },
      {
        "name": "Ice Cubes",
        "quantity": 4,
        "unit": "pcs",
        "category": "pantry"
      },
      {
        "name": "Water",
        "quantity": 0.25,
        "unit": "cup",
        "category": "pantry"
      }
    ],
    "grape-juice": [
      {
        "name": "Grapes (black/green)",
        "quantity": 3,
        "unit": "cups",
        "category": "produce"
      },
      {
        "name": "Sugar (optional)",
        "quantity": 1,
        "unit": "tsp",
        "category": "pantry"
      },
      {
        "name": "Ice Cubes",
        "quantity": 4,
        "unit": "pcs",
        "category": "pantry"
      }
    ],
    "pineapple-juice": [
      {
        "name": "Pineapple",
        "quantity": 0.5,
        "unit": "pc",
        "category": "produce"
      },
      {
        "name": "Sugar (optional)",
        "quantity": 1,
        "unit": "tsp",
        "category": "pantry"
      },
      {
        "name": "Ice Cubes",
        "quantity": 4,
        "unit": "pcs",
        "category": "pantry"
      },
      {
        "name": "Water",
        "quantity": 0.25,
        "unit": "cup",
        "category": "pantry"
      }
    ],
    "cranberry-juice": [
      {
        "name": "Cranberries",
        "quantity": 2,
        "unit": "cups",
        "category": "produce"
      },
      {
        "name": "Sugar",
        "quantity": 2,
        "unit": "tbsp",
        "category": "pantry"
      },
      {
        "name": "Water",
        "quantity": 1,
        "unit": "cup",
        "category": "pantry"
      },
      {
        "name": "Ice Cubes",
        "quantity": 4,
        "unit": "pcs",
        "category": "pantry"
      }
    ],
    "watermelon-juice": [
      {
        "name": "Watermelon",
        "quantity": 4,
        "unit": "cups",
        "category": "produce"
      },
      {
        "name": "Lemon Juice",
        "quantity": 1,
        "unit": "tsp",
        "category": "produce"
      },
      {
        "name": "Black Salt",
        "quantity": 0.25,
        "unit": "tsp",
        "category": "spices"
      },
      {
        "name": "Ice Cubes",
        "quantity": 4,
        "unit": "pcs",
        "category": "pantry"
      }
    ],
    "pomegranate-juice": [
      {
        "name": "Pomegranate",
        "quantity": 2,
        "unit": "pcs",
        "category": "produce"
      },
      {
        "name": "Sugar (optional)",
        "quantity": 1,
        "unit": "tsp",
        "category": "pantry"
      },
      {
        "name": "Ice Cubes",
        "quantity": 4,
        "unit": "pcs",
        "category": "pantry"
      }
    ],
    "grapefruit-juice": [
      {
        "name": "Grapefruit",
        "quantity": 2,
        "unit": "pcs",
        "category": "produce"
      },
      {
        "name": "Sugar (optional)",
        "quantity": 1,
        "unit": "tsp",
        "category": "pantry"
      },
      {
        "name": "Ice Cubes",
        "quantity": 4,
        "unit": "pcs",
        "category": "pantry"
      },
      {
        "name": "Grapes",
        "quantity": 100,
        "unit": "g",
        "category": "produce",
        "inStock": false
      }
    ],
    "carrot-juice": [
      {
        "name": "Carrot",
        "quantity": 4,
        "unit": "pcs",
        "category": "produce"
      },
      {
        "name": "Ginger",
        "quantity": 0.5,
        "unit": "inch",
        "category": "produce"
      },
      {
        "name": "Lemon Juice",
        "quantity": 1,
        "unit": "tsp",
        "category": "produce"
      },
      {
        "name": "Ice Cubes",
        "quantity": 4,
        "unit": "pcs",
        "category": "pantry"
      }
    ],
    "custard": [
      {
        "name": "Milk",
        "quantity": 2,
        "unit": "cups",
        "category": "dairy"
      },
      {
        "name": "Custard Powder (Vanilla)",
        "quantity": 2,
        "unit": "tbsp",
        "category": "pantry"
      },
      {
        "name": "Sugar",
        "quantity": 3,
        "unit": "tbsp",
        "category": "pantry"
      },
      {
        "name": "Vanilla Extract",
        "quantity": 1,
        "unit": "tsp",
        "category": "pantry"
      }
    ],
    "gulab-jamun": [
      {
        "name": "Milk Powder",
        "quantity": 1,
        "unit": "cup",
        "category": "dairy"
      },
      {
        "name": "All-Purpose Flour",
        "quantity": 2,
        "unit": "tbsp",
        "category": "grains"
      },
      {
        "name": "Ghee",
        "quantity": 2,
        "unit": "tbsp",
        "category": "dairy"
      },
      {
        "name": "Milk",
        "quantity": 3,
        "unit": "tbsp",
        "category": "dairy"
      },
      {
        "name": "Sugar",
        "quantity": 2,
        "unit": "cups",
        "category": "pantry"
      },
      {
        "name": "Water",
        "quantity": 2,
        "unit": "cups",
        "category": "pantry"
      },
      {
        "name": "Cardamom",
        "quantity": 2,
        "unit": "pods",
        "category": "spices"
      },
      {
        "name": "Rose Water",
        "quantity": 1,
        "unit": "tsp",
        "category": "pantry"
      },
      {
        "name": "Baking Soda",
        "quantity": 0.25,
        "unit": "tsp",
        "category": "pantry"
      },
      {
        "name": "Oil",
        "quantity": 2,
        "unit": "cups",
        "category": "pantry"
      }
    ],
    "ladoo": [
      {
        "name": "Besan (Gram Flour)",
        "quantity": 2,
        "unit": "cups",
        "category": "grains"
      },
      {
        "name": "Ghee",
        "quantity": 1,
        "unit": "cup",
        "category": "dairy"
      },
      {
        "name": "Sugar",
        "quantity": 1,
        "unit": "cup",
        "category": "pantry"
      },
      {
        "name": "Cardamom Powder",
        "quantity": 0.5,
        "unit": "tsp",
        "category": "spices"
      },
      {
        "name": "Cashews",
        "quantity": 10,
        "unit": "pcs",
        "category": "pantry"
      },
      {
        "name": "Almonds",
        "quantity": 10,
        "unit": "pcs",
        "category": "pantry"
      },
      {
        "name": "Raisins",
        "quantity": 2,
        "unit": "tbsp",
        "category": "pantry"
      }
    ],
    "barfi": [
      {
        "name": "Khoya (Mawa)",
        "quantity": 2,
        "unit": "cups",
        "category": "dairy"
      },
      {
        "name": "Sugar",
        "quantity": 0.75,
        "unit": "cup",
        "category": "pantry"
      },
      {
        "name": "Cardamom Powder",
        "quantity": 0.5,
        "unit": "tsp",
        "category": "spices"
      },
      {
        "name": "Pistachios",
        "quantity": 2,
        "unit": "tbsp",
        "category": "pantry"
      },
      {
        "name": "Water",
        "quantity": 0.25,
        "unit": "cup",
        "category": "pantry"
      },
      {
        "name": "Ghee",
        "quantity": 1,
        "unit": "tbsp",
        "category": "dairy"
      }
    ],
    "chocolate-milkshake": [
      {
        "name": "Milk",
        "quantity": 1.5,
        "unit": "cups",
        "category": "dairy"
      },
      {
        "name": "Chocolate Syrup",
        "quantity": 3,
        "unit": "tbsp",
        "category": "pantry"
      },
      {
        "name": "Vanilla Ice Cream",
        "quantity": 2,
        "unit": "scoops",
        "category": "dairy"
      },
      {
        "name": "Sugar",
        "quantity": 1,
        "unit": "tsp",
        "category": "pantry"
      },
      {
        "name": "Ice Cubes",
        "quantity": 4,
        "unit": "pcs",
        "category": "pantry"
      }
    ],
    "cold-cocoa-milkshake": [
      {
        "name": "Milk",
        "quantity": 1.5,
        "unit": "cups",
        "category": "dairy"
      },
      {
        "name": "Cocoa Powder",
        "quantity": 2,
        "unit": "tbsp",
        "category": "pantry"
      },
      {
        "name": "Sugar",
        "quantity": 2,
        "unit": "tbsp",
        "category": "pantry"
      },
      {
        "name": "Vanilla Ice Cream",
        "quantity": 1,
        "unit": "scoop",
        "category": "dairy"
      },
      {
        "name": "Ice Cubes",
        "quantity": 4,
        "unit": "pcs",
        "category": "pantry"
      }
    ],
    "oreo-milkshake": [
      {
        "name": "Milk",
        "quantity": 1.5,
        "unit": "cups",
        "category": "dairy"
      },
      {
        "name": "Oreo Biscuits",
        "quantity": 8,
        "unit": "pcs",
        "category": "pantry"
      },
      {
        "name": "Vanilla Ice Cream",
        "quantity": 2,
        "unit": "scoops",
        "category": "dairy"
      },
      {
        "name": "Sugar",
        "quantity": 1,
        "unit": "tbsp",
        "category": "pantry"
      },
      {
        "name": "Ice Cubes",
        "quantity": 4,
        "unit": "pcs",
        "category": "pantry"
      }
    ],
    "kit-kat-milkshake": [
      {
        "name": "Milk",
        "quantity": 1.5,
        "unit": "cups",
        "category": "dairy"
      },
      {
        "name": "Kit Kat Chocolate",
        "quantity": 4,
        "unit": "bars",
        "category": "pantry"
      },
      {
        "name": "Vanilla Ice Cream",
        "quantity": 2,
        "unit": "scoops",
        "category": "dairy"
      },
      {
        "name": "Sugar",
        "quantity": 1,
        "unit": "tbsp",
        "category": "pantry"
      },
      {
        "name": "Ice Cubes",
        "quantity": 4,
        "unit": "pcs",
        "category": "pantry"
      }
    ],
    "indian-chocolate-milkshake": [
      {
        "name": "Milk",
        "quantity": 1.5,
        "unit": "cups",
        "category": "dairy"
      },
      {
        "name": "Chocolate Syrup",
        "quantity": 2,
        "unit": "tbsp",
        "category": "pantry"
      },
      {
        "name": "Cocoa Powder",
        "quantity": 1,
        "unit": "tbsp",
        "category": "pantry"
      },
      {
        "name": "Vanilla Ice Cream",
        "quantity": 2,
        "unit": "scoops",
        "category": "dairy"
      },
      {
        "name": "Sugar",
        "quantity": 1,
        "unit": "tbsp",
        "category": "pantry"
      },
      {
        "name": "Ice Cubes",
        "quantity": 4,
        "unit": "pcs",
        "category": "pantry"
      }
    ],
    "choco-shake": [
      {
        "name": "Milk",
        "quantity": 1.5,
        "unit": "cups",
        "category": "dairy"
      },
      {
        "name": "Chocolate Syrup",
        "quantity": 3,
        "unit": "tbsp",
        "category": "pantry"
      },
      {
        "name": "Vanilla Ice Cream",
        "quantity": 1,
        "unit": "scoop",
        "category": "dairy"
      },
      {
        "name": "Sugar",
        "quantity": 1,
        "unit": "tsp",
        "category": "pantry"
      },
      {
        "name": "Ice Cubes",
        "quantity": 4,
        "unit": "pcs",
        "category": "pantry"
      }
    ],
    "mango-milkshake": [
      {
        "name": "Mango (ripe)",
        "quantity": 2,
        "unit": "pcs",
        "category": "produce"
      },
      {
        "name": "Milk",
        "quantity": 1.5,
        "unit": "cups",
        "category": "dairy"
      },
      {
        "name": "Sugar",
        "quantity": 1,
        "unit": "tbsp",
        "category": "pantry"
      },
      {
        "name": "Vanilla Ice Cream",
        "quantity": 1,
        "unit": "scoop",
        "category": "dairy"
      },
      {
        "name": "Ice Cubes",
        "quantity": 4,
        "unit": "pcs",
        "category": "pantry"
      }
    ],
    "mango-mastani": [
      {
        "name": "Mango (ripe)",
        "quantity": 2,
        "unit": "pcs",
        "category": "produce"
      },
      {
        "name": "Milk",
        "quantity": 1,
        "unit": "cup",
        "category": "dairy"
      },
      {
        "name": "Mango Ice Cream",
        "quantity": 2,
        "unit": "scoops",
        "category": "dairy"
      },
      {
        "name": "Sugar",
        "quantity": 1,
        "unit": "tbsp",
        "category": "pantry"
      },
      {
        "name": "Mixed Dry Fruits",
        "quantity": 2,
        "unit": "tbsp",
        "category": "pantry"
      },
      {
        "name": "Ice Cubes",
        "quantity": 4,
        "unit": "pcs",
        "category": "pantry"
      }
    ],
    "mango-pineapple-juice": [
      {
        "name": "Mango (ripe)",
        "quantity": 1,
        "unit": "pc",
        "category": "produce"
      },
      {
        "name": "Pineapple",
        "quantity": 1,
        "unit": "cup",
        "category": "produce"
      },
      {
        "name": "Water",
        "quantity": 0.5,
        "unit": "cup",
        "category": "pantry"
      },
      {
        "name": "Sugar",
        "quantity": 1,
        "unit": "tsp",
        "category": "pantry"
      },
      {
        "name": "Ice Cubes",
        "quantity": 4,
        "unit": "pcs",
        "category": "pantry"
      }
    ],
    "peach-mango-milkshake": [
      {
        "name": "Mango (ripe)",
        "quantity": 1,
        "unit": "pc",
        "category": "produce"
      },
      {
        "name": "Peach",
        "quantity": 2,
        "unit": "pcs",
        "category": "produce"
      },
      {
        "name": "Milk",
        "quantity": 1,
        "unit": "cup",
        "category": "dairy"
      },
      {
        "name": "Sugar",
        "quantity": 1,
        "unit": "tbsp",
        "category": "pantry"
      },
      {
        "name": "Ice Cubes",
        "quantity": 4,
        "unit": "pcs",
        "category": "pantry"
      }
    ],
    "almond-banana-smoothie": [
      {
        "name": "Banana (ripe)",
        "quantity": 2,
        "unit": "pcs",
        "category": "produce"
      },
      {
        "name": "Almonds (soaked)",
        "quantity": 10,
        "unit": "pcs",
        "category": "pantry"
      },
      {
        "name": "Almond Milk",
        "quantity": 1.5,
        "unit": "cups",
        "category": "pantry"
      },
      {
        "name": "Honey",
        "quantity": 1,
        "unit": "tbsp",
        "category": "pantry"
      },
      {
        "name": "Ice Cubes",
        "quantity": 4,
        "unit": "pcs",
        "category": "pantry"
      }
    ],
    "banana-milkshake": [
      {
        "name": "Banana (ripe)",
        "quantity": 2,
        "unit": "pcs",
        "category": "produce"
      },
      {
        "name": "Milk",
        "quantity": 1.5,
        "unit": "cups",
        "category": "dairy"
      },
      {
        "name": "Sugar",
        "quantity": 1,
        "unit": "tbsp",
        "category": "pantry"
      },
      {
        "name": "Vanilla Ice Cream",
        "quantity": 1,
        "unit": "scoop",
        "category": "dairy"
      },
      {
        "name": "Ice Cubes",
        "quantity": 4,
        "unit": "pcs",
        "category": "pantry"
      }
    ],
    "banana-date-milkshake": [
      {
        "name": "Banana (ripe)",
        "quantity": 2,
        "unit": "pcs",
        "category": "produce"
      },
      {
        "name": "Dates (soft)",
        "quantity": 5,
        "unit": "pcs",
        "category": "pantry"
      },
      {
        "name": "Milk",
        "quantity": 1.5,
        "unit": "cups",
        "category": "dairy"
      },
      {
        "name": "Almonds",
        "quantity": 5,
        "unit": "pcs",
        "category": "pantry"
      },
      {
        "name": "Ice Cubes",
        "quantity": 4,
        "unit": "pcs",
        "category": "pantry"
      }
    ],
    "banana-yogurt-milkshake": [
      {
        "name": "Banana (ripe)",
        "quantity": 2,
        "unit": "pcs",
        "category": "produce"
      },
      {
        "name": "Yogurt",
        "quantity": 1,
        "unit": "cup",
        "category": "dairy"
      },
      {
        "name": "Milk",
        "quantity": 0.5,
        "unit": "cup",
        "category": "dairy"
      },
      {
        "name": "Honey",
        "quantity": 1,
        "unit": "tbsp",
        "category": "pantry"
      },
      {
        "name": "Ice Cubes",
        "quantity": 4,
        "unit": "pcs",
        "category": "pantry"
      }
    ],
    "dry-fruit-milkshake": [
      {
        "name": "Almonds (soaked)",
        "quantity": 10,
        "unit": "pcs",
        "category": "pantry"
      },
      {
        "name": "Cashews",
        "quantity": 8,
        "unit": "pcs",
        "category": "pantry"
      },
      {
        "name": "Pistachios",
        "quantity": 5,
        "unit": "pcs",
        "category": "pantry"
      },
      {
        "name": "Dates",
        "quantity": 3,
        "unit": "pcs",
        "category": "pantry"
      },
      {
        "name": "Milk",
        "quantity": 1.5,
        "unit": "cups",
        "category": "dairy"
      },
      {
        "name": "Sugar",
        "quantity": 1,
        "unit": "tbsp",
        "category": "pantry"
      },
      {
        "name": "Cardamom Powder",
        "quantity": 0.25,
        "unit": "tsp",
        "category": "spices"
      },
      {
        "name": "Ice Cubes",
        "quantity": 4,
        "unit": "pcs",
        "category": "pantry"
      }
    ],
    "fruit-and-nut-milkshake": [
      {
        "name": "Banana",
        "quantity": 1,
        "unit": "pc",
        "category": "produce"
      },
      {
        "name": "Apple",
        "quantity": 0.5,
        "unit": "pc",
        "category": "produce"
      },
      {
        "name": "Almonds",
        "quantity": 8,
        "unit": "pcs",
        "category": "pantry"
      },
      {
        "name": "Cashews",
        "quantity": 6,
        "unit": "pcs",
        "category": "pantry"
      },
      {
        "name": "Raisins",
        "quantity": 1,
        "unit": "tbsp",
        "category": "pantry"
      },
      {
        "name": "Milk",
        "quantity": 1.5,
        "unit": "cups",
        "category": "dairy"
      },
      {
        "name": "Honey",
        "quantity": 1,
        "unit": "tbsp",
        "category": "pantry"
      },
      {
        "name": "Ice Cubes",
        "quantity": 4,
        "unit": "pcs",
        "category": "pantry"
      }
    ],
    "chickoo-nut-milkshake": [
      {
        "name": "Chickoo (ripe)",
        "quantity": 3,
        "unit": "pcs",
        "category": "produce"
      },
      {
        "name": "Almonds",
        "quantity": 6,
        "unit": "pcs",
        "category": "pantry"
      },
      {
        "name": "Cashews",
        "quantity": 6,
        "unit": "pcs",
        "category": "pantry"
      },
      {
        "name": "Milk",
        "quantity": 1.5,
        "unit": "cups",
        "category": "dairy"
      },
      {
        "name": "Sugar",
        "quantity": 1,
        "unit": "tbsp",
        "category": "pantry"
      },
      {
        "name": "Ice Cubes",
        "quantity": 4,
        "unit": "pcs",
        "category": "pantry"
      }
    ],
    "fig-apricot-shake": [
      {
        "name": "Dried Figs (Anjeer, soaked)",
        "quantity": 4,
        "unit": "pcs",
        "category": "pantry"
      },
      {
        "name": "Dried Apricots (soaked)",
        "quantity": 4,
        "unit": "pcs",
        "category": "pantry"
      },
      {
        "name": "Milk",
        "quantity": 1.5,
        "unit": "cups",
        "category": "dairy"
      },
      {
        "name": "Honey",
        "quantity": 1,
        "unit": "tsp",
        "category": "pantry"
      },
      {
        "name": "Cardamom Powder",
        "quantity": 0.25,
        "unit": "tsp",
        "category": "spices"
      },
      {
        "name": "Ice Cubes",
        "quantity": 4,
        "unit": "pcs",
        "category": "pantry"
      }
    ],
    "fresh-fig-banana-milkshake": [
      {
        "name": "Fresh Figs",
        "quantity": 3,
        "unit": "pcs",
        "category": "produce"
      },
      {
        "name": "Banana (ripe)",
        "quantity": 1,
        "unit": "pc",
        "category": "produce"
      },
      {
        "name": "Milk",
        "quantity": 1.5,
        "unit": "cups",
        "category": "dairy"
      },
      {
        "name": "Honey",
        "quantity": 1,
        "unit": "tsp",
        "category": "pantry"
      },
      {
        "name": "Ice Cubes",
        "quantity": 4,
        "unit": "pcs",
        "category": "pantry"
      }
    ],
    "strawberry-vanilla-milkshake": [
      {
        "name": "Strawberries (fresh)",
        "quantity": 8,
        "unit": "pcs",
        "category": "produce"
      },
      {
        "name": "Milk",
        "quantity": 1.5,
        "unit": "cups",
        "category": "dairy"
      },
      {
        "name": "Vanilla Ice Cream",
        "quantity": 2,
        "unit": "scoops",
        "category": "dairy"
      },
      {
        "name": "Sugar",
        "quantity": 1,
        "unit": "tbsp",
        "category": "pantry"
      },
      {
        "name": "Ice Cubes",
        "quantity": 4,
        "unit": "pcs",
        "category": "pantry"
      }
    ]
  },
  "categories": {
    "brown-gravy-onion-tomato": [
      {
        "name": "Onions",
        "quantity": 2,
        "unit": "pc",
        "category": "produce",
        "inStock": false
      },
      {
        "name": "Tomatoes",
        "quantity": 3,
        "unit": "pc",
        "category": "produce",
        "inStock": false
      },
      {
        "name": "Ginger-Garlic Paste",
        "quantity": 1,
        "unit": "tbsp",
        "category": "pantry",
        "inStock": false
      },
      {
        "name": "Spices",
        "quantity": 1,
        "unit": "packet",
        "category": "spices",
        "inStock": false
      }
    ],
    "red-gravy-tomato-butter": [
      {
        "name": "Tomatoes",
        "quantity": 4,
        "unit": "pc",
        "category": "produce",
        "inStock": false
      },
      {
        "name": "Butter",
        "quantity": 50,
        "unit": "g",
        "category": "dairy",
        "inStock": false
      },
      {
        "name": "Cream",
        "quantity": 30,
        "unit": "ml",
        "category": "dairy",
        "inStock": false
      },
      {
        "name": "Spices",
        "quantity": 1,
        "unit": "packet",
        "category": "spices",
        "inStock": false
      }
    ],
    "white-gravy-cashew-cream": [
      {
        "name": "Cashews",
        "quantity": 30,
        "unit": "g",
        "category": "pantry",
        "inStock": false
      },
      {
        "name": "Cream",
        "quantity": 50,
        "unit": "ml",
        "category": "dairy",
        "inStock": false
      },
      {
        "name": "Onions",
        "quantity": 1,
        "unit": "pc",
        "category": "produce",
        "inStock": false
      },
      {
        "name": "Spices",
        "quantity": 1,
        "unit": "packet",
        "category": "spices",
        "inStock": false
      }
    ],
    "makhani-gravy": [
      {
        "name": "Butter",
        "quantity": 50,
        "unit": "g",
        "category": "dairy",
        "inStock": false
      },
      {
        "name": "Tomatoes",
        "quantity": 4,
        "unit": "pc",
        "category": "produce",
        "inStock": false
      },
      {
        "name": "Cream",
        "quantity": 50,
        "unit": "ml",
        "category": "dairy",
        "inStock": false
      },
      {
        "name": "Spices",
        "quantity": 1,
        "unit": "packet",
        "category": "spices",
        "inStock": false
      }
    ],
    "korma-gravy": [
      {
        "name": "Yogurt",
        "quantity": 100,
        "unit": "g",
        "category": "dairy",
        "inStock": false
      },
      {
        "name": "Onions",
        "quantity": 2,
        "unit": "pc",
        "category": "produce",
        "inStock": false
      },
      {
        "name": "Cashews",
        "quantity": 20,
        "unit": "g",
        "category": "pantry",
        "inStock": false
      },
      {
        "name": "Spices",
        "quantity": 1,
        "unit": "packet",
        "category": "spices",
        "inStock": false
      }
    ],
    "yakhni-yogurt-gravy": [
      {
        "name": "Yogurt",
        "quantity": 150,
        "unit": "g",
        "category": "dairy",
        "inStock": false
      },
      {
        "name": "Onions",
        "quantity": 2,
        "unit": "pc",
        "category": "produce",
        "inStock": false
      },
      {
        "name": "Ginger",
        "quantity": 1,
        "unit": "pc",
        "category": "produce",
        "inStock": false
      },
      {
        "name": "Spices",
        "quantity": 1,
        "unit": "packet",
        "category": "spices",
        "inStock": false
      }
    ],
    "sambar": [
      {
        "name": "Toor Dal",
        "quantity": 80,
        "unit": "g",
        "category": "proteins",
        "inStock": false
      },
      {
        "name": "Tomatoes",
        "quantity": 2,
        "unit": "pc",
        "category": "produce",
        "inStock": false
      },
      {
        "name": "Sambar Powder",
        "quantity": 1,
        "unit": "tbsp",
        "category": "spices",
        "inStock": false
      },
      {
        "name": "Tamarind",
        "quantity": 10,
        "unit": "g",
        "category": "pantry",
        "inStock": false
      }
    ],
    "coconut-gravy": [
      {
        "name": "Coconut",
        "quantity": 50,
        "unit": "g",
        "category": "produce",
        "inStock": false
      },
      {
        "name": "Onions",
        "quantity": 1,
        "unit": "pc",
        "category": "produce",
        "inStock": false
      },
      {
        "name": "Green Chilli",
        "quantity": 2,
        "unit": "pc",
        "category": "produce",
        "inStock": false
      },
      {
        "name": "Spices",
        "quantity": 1,
        "unit": "packet",
        "category": "spices",
        "inStock": false
      }
    ],
    "chettinad-masala": [
      {
        "name": "Coconut",
        "quantity": 30,
        "unit": "g",
        "category": "produce",
        "inStock": false
      },
      {
        "name": "Onions",
        "quantity": 2,
        "unit": "pc",
        "category": "produce",
        "inStock": false
      },
      {
        "name": "Tomatoes",
        "quantity": 2,
        "unit": "pc",
        "category": "produce",
        "inStock": false
      },
      {
        "name": "Spices",
        "quantity": 1,
        "unit": "packet",
        "category": "spices",
        "inStock": false
      }
    ],
    "rasam": [
      {
        "name": "Tomatoes",
        "quantity": 3,
        "unit": "pc",
        "category": "produce",
        "inStock": false
      },
      {
        "name": "Rasam Powder",
        "quantity": 1,
        "unit": "tbsp",
        "category": "spices",
        "inStock": false
      },
      {
        "name": "Tamarind",
        "quantity": 10,
        "unit": "g",
        "category": "pantry",
        "inStock": false
      },
      {
        "name": "Spices",
        "quantity": 1,
        "unit": "packet",
        "category": "spices",
        "inStock": false
      }
    ],
    "kerala-stew": [
      {
        "name": "Coconut Milk",
        "quantity": 200,
        "unit": "ml",
        "category": "pantry",
        "inStock": false
      },
      {
        "name": "Onions",
        "quantity": 1,
        "unit": "pc",
        "category": "produce",
        "inStock": false
      },
      {
        "name": "Ginger",
        "quantity": 1,
        "unit": "pc",
        "category": "produce",
        "inStock": false
      },
      {
        "name": "Spices",
        "quantity": 1,
        "unit": "packet",
        "category": "spices",
        "inStock": false
      }
    ],
    "andhra-curry": [
      {
        "name": "Red Chilli",
        "quantity": 4,
        "unit": "pc",
        "category": "produce",
        "inStock": false
      },
      {
        "name": "Onions",
        "quantity": 2,
        "unit": "pc",
        "category": "produce",
        "inStock": false
      },
      {
        "name": "Tomatoes",
        "quantity": 2,
        "unit": "pc",
        "category": "produce",
        "inStock": false
      },
      {
        "name": "Spices",
        "quantity": 1,
        "unit": "packet",
        "category": "spices",
        "inStock": false
      }
    ],
    "mustard-gravy-shorshe": [
      {
        "name": "Mustard Seeds",
        "quantity": 2,
        "unit": "tbsp",
        "category": "spices",
        "inStock": false
      },
      {
        "name": "Green Chilli",
        "quantity": 2,
        "unit": "pc",
        "category": "produce",
        "inStock": false
      },
      {
        "name": "Mustard Oil",
        "quantity": 1,
        "unit": "tbsp",
        "category": "pantry",
        "inStock": false
      },
      {
        "name": "Spices",
        "quantity": 1,
        "unit": "packet",
        "category": "spices",
        "inStock": false
      }
    ],
    "poppy-seed-gravy-posto": [
      {
        "name": "Poppy Seeds",
        "quantity": 30,
        "unit": "g",
        "category": "spices",
        "inStock": false
      },
      {
        "name": "Green Chilli",
        "quantity": 2,
        "unit": "pc",
        "category": "produce",
        "inStock": false
      },
      {
        "name": "Spices",
        "quantity": 1,
        "unit": "packet",
        "category": "spices",
        "inStock": false
      }
    ],
    "bengali-kalia": [
      {
        "name": "Onions",
        "quantity": 2,
        "unit": "pc",
        "category": "produce",
        "inStock": false
      },
      {
        "name": "Ginger",
        "quantity": 1,
        "unit": "pc",
        "category": "produce",
        "inStock": false
      },
      {
        "name": "Garam Masala",
        "quantity": 1,
        "unit": "tbsp",
        "category": "spices",
        "inStock": false
      },
      {
        "name": "Spices",
        "quantity": 1,
        "unit": "packet",
        "category": "spices",
        "inStock": false
      }
    ],
    "jhol-thin-gravy": [
      {
        "name": "Ginger",
        "quantity": 1,
        "unit": "pc",
        "category": "produce",
        "inStock": false
      },
      {
        "name": "Green Chilli",
        "quantity": 2,
        "unit": "pc",
        "category": "produce",
        "inStock": false
      },
      {
        "name": "Spices",
        "quantity": 1,
        "unit": "packet",
        "category": "spices",
        "inStock": false
      }
    ],
    "kolhapuri-gravy": [
      {
        "name": "Onions",
        "quantity": 2,
        "unit": "pc",
        "category": "produce",
        "inStock": false
      },
      {
        "name": "Tomatoes",
        "quantity": 3,
        "unit": "pc",
        "category": "produce",
        "inStock": false
      },
      {
        "name": "Kolhapuri Masala",
        "quantity": 1,
        "unit": "tbsp",
        "category": "spices",
        "inStock": false
      },
      {
        "name": "Spices",
        "quantity": 1,
        "unit": "packet",
        "category": "spices",
        "inStock": false
      }
    ],
    "goan-vindaloo": [
      {
        "name": "Vinegar",
        "quantity": 2,
        "unit": "tbsp",
        "category": "pantry",
        "inStock": false
      },
      {
        "name": "Red Chilli",
        "quantity": 4,
        "unit": "pc",
        "category": "produce",
        "inStock": false
      },
      {
        "name": "Garlic",
        "quantity": 6,
        "unit": "pc",
        "category": "produce",
        "inStock": false
      },
      {
        "name": "Spices",
        "quantity": 1,
        "unit": "packet",
        "category": "spices",
        "inStock": false
      }
    ],
    "gujarati-kadhi": [
      {
        "name": "Yogurt",
        "quantity": 200,
        "unit": "g",
        "category": "dairy",
        "inStock": false
      },
      {
        "name": "Gram Flour",
        "quantity": 30,
        "unit": "g",
        "category": "grains",
        "inStock": false
      },
      {
        "name": "Green Chilli",
        "quantity": 2,
        "unit": "pc",
        "category": "produce",
        "inStock": false
      },
      {
        "name": "Spices",
        "quantity": 1,
        "unit": "packet",
        "category": "spices",
        "inStock": false
      }
    ],
    "xacuti-masala": [
      {
        "name": "Coconut",
        "quantity": 50,
        "unit": "g",
        "category": "produce",
        "inStock": false
      },
      {
        "name": "Poppy Seeds",
        "quantity": 10,
        "unit": "g",
        "category": "spices",
        "inStock": false
      },
      {
        "name": "Onions",
        "quantity": 2,
        "unit": "pc",
        "category": "produce",
        "inStock": false
      },
      {
        "name": "Spices",
        "quantity": 1,
        "unit": "packet",
        "category": "spices",
        "inStock": false
      }
    ],
    "kokum-curry": [
      {
        "name": "Kokum",
        "quantity": 5,
        "unit": "pc",
        "category": "pantry",
        "inStock": false
      },
      {
        "name": "Coconut Milk",
        "quantity": 100,
        "unit": "ml",
        "category": "pantry",
        "inStock": false
      },
      {
        "name": "Green Chilli",
        "quantity": 2,
        "unit": "pc",
        "category": "produce",
        "inStock": false
      },
      {
        "name": "Spices",
        "quantity": 1,
        "unit": "packet",
        "category": "spices",
        "inStock": false
      }
    ],
    "brown-gravy-onion-tomato-1": [
      {
        "name": "Onions",
        "quantity": 2,
        "unit": "pc",
        "category": "produce",
        "inStock": false
      },
      {
        "name": "Tomatoes",
        "quantity": 3,
        "unit": "pc",
        "category": "produce",
        "inStock": false
      },
      {
        "name": "Spices",
        "quantity": 1,
        "unit": "packet",
        "category": "spices",
        "inStock": false
      }
    ],
    "kadhi": [
      {
        "name": "Yogurt",
        "quantity": 200,
        "unit": "g",
        "category": "dairy",
        "inStock": false
      },
      {
        "name": "Gram Flour",
        "quantity": 30,
        "unit": "g",
        "category": "grains",
        "inStock": false
      },
      {
        "name": "Spices",
        "quantity": 1,
        "unit": "packet",
        "category": "spices",
        "inStock": false
      }
    ],
    "malwa-curry": [
      {
        "name": "Onions",
        "quantity": 2,
        "unit": "pc",
        "category": "produce",
        "inStock": false
      },
      {
        "name": "Tomatoes",
        "quantity": 2,
        "unit": "pc",
        "category": "produce",
        "inStock": false
      },
      {
        "name": "Spices",
        "quantity": 1,
        "unit": "packet",
        "category": "spices",
        "inStock": false
      }
    ],
    "alkaline-khar": [
      {
        "name": "Raw Papaya",
        "quantity": 100,
        "unit": "g",
        "category": "produce",
        "inStock": false
      },
      {
        "name": "Mustard Greens",
        "quantity": 50,
        "unit": "g",
        "category": "produce",
        "inStock": false
      },
      {
        "name": "Spices",
        "quantity": 1,
        "unit": "packet",
        "category": "spices",
        "inStock": false
      }
    ],
    "masor-tenga": [
      {
        "name": "Fish",
        "quantity": 150,
        "unit": "g",
        "category": "proteins",
        "inStock": false
      },
      {
        "name": "Tomatoes",
        "quantity": 2,
        "unit": "pc",
        "category": "produce",
        "inStock": false
      },
      {
        "name": "Lemon Juice",
        "quantity": 1,
        "unit": "tbsp",
        "category": "pantry",
        "inStock": false
      },
      {
        "name": "Spices",
        "quantity": 1,
        "unit": "packet",
        "category": "spices",
        "inStock": false
      }
    ],
    "pork-curry": [
      {
        "name": "Pork",
        "quantity": 200,
        "unit": "g",
        "category": "proteins",
        "inStock": false
      },
      {
        "name": "Onions",
        "quantity": 2,
        "unit": "pc",
        "category": "produce",
        "inStock": false
      },
      {
        "name": "Ginger",
        "quantity": 1,
        "unit": "pc",
        "category": "produce",
        "inStock": false
      },
      {
        "name": "Spices",
        "quantity": 1,
        "unit": "packet",
        "category": "spices",
        "inStock": false
      }
    ],
    "axone-curry": [
      {
        "name": "Pork",
        "quantity": 200,
        "unit": "g",
        "category": "proteins",
        "inStock": false
      },
      {
        "name": "Axone",
        "quantity": 50,
        "unit": "g",
        "category": "pantry",
        "inStock": false
      },
      {
        "name": "Spices",
        "quantity": 1,
        "unit": "packet",
        "category": "spices",
        "inStock": false
      }
    ],
    "bamboo-shoot-curry": [
      {
        "name": "Bamboo Shoot",
        "quantity": 100,
        "unit": "g",
        "category": "produce",
        "inStock": false
      },
      {
        "name": "Pork",
        "quantity": 150,
        "unit": "g",
        "category": "proteins",
        "inStock": false
      },
      {
        "name": "Spices",
        "quantity": 1,
        "unit": "packet",
        "category": "spices",
        "inStock": false
      }
    ],
    "roti-chapati": [
      {
        "name": "Wheat Flour (Atta)",
        "quantity": 200,
        "unit": "g",
        "category": "grains",
        "inStock": false
      }
    ],
    "naan": [
      {
        "name": "Maida",
        "quantity": 200,
        "unit": "g",
        "category": "grains",
        "inStock": false
      },
      {
        "name": "Yogurt",
        "quantity": 50,
        "unit": "g",
        "category": "dairy",
        "inStock": false
      }
    ],
    "paratha": [
      {
        "name": "Wheat Flour (Atta)",
        "quantity": 200,
        "unit": "g",
        "category": "grains",
        "inStock": false
      },
      {
        "name": "Butter",
        "quantity": 20,
        "unit": "g",
        "category": "dairy",
        "inStock": false
      }
    ],
    "bhatura": [
      {
        "name": "Maida",
        "quantity": 200,
        "unit": "g",
        "category": "grains",
        "inStock": false
      },
      {
        "name": "Yogurt",
        "quantity": 50,
        "unit": "g",
        "category": "dairy",
        "inStock": false
      }
    ],
    "kulcha": [
      {
        "name": "Maida",
        "quantity": 200,
        "unit": "g",
        "category": "grains",
        "inStock": false
      },
      {
        "name": "Yogurt",
        "quantity": 30,
        "unit": "g",
        "category": "dairy",
        "inStock": false
      }
    ],
    "puri": [
      {
        "name": "Wheat Flour (Atta)",
        "quantity": 150,
        "unit": "g",
        "category": "grains",
        "inStock": false
      }
    ],
    "chochwor": [
      {
        "name": "Maida",
        "quantity": 200,
        "unit": "g",
        "category": "grains",
        "inStock": false
      },
      {
        "name": "Poppy Seeds",
        "quantity": 10,
        "unit": "g",
        "category": "spices",
        "inStock": false
      }
    ],
    "sheermal": [
      {
        "name": "Maida",
        "quantity": 200,
        "unit": "g",
        "category": "grains",
        "inStock": false
      },
      {
        "name": "Saffron",
        "quantity": 1,
        "unit": "pinch",
        "category": "spices",
        "inStock": false
      },
      {
        "name": "Milk",
        "quantity": 50,
        "unit": "ml",
        "category": "dairy",
        "inStock": false
      }
    ],
    "dosa": [
      {
        "name": "Rice",
        "quantity": 100,
        "unit": "g",
        "category": "grains",
        "inStock": false
      },
      {
        "name": "Urad Dal",
        "quantity": 50,
        "unit": "g",
        "category": "proteins",
        "inStock": false
      }
    ],
    "appam": [
      {
        "name": "Rice",
        "quantity": 100,
        "unit": "g",
        "category": "grains",
        "inStock": false
      },
      {
        "name": "Coconut Milk",
        "quantity": 50,
        "unit": "ml",
        "category": "pantry",
        "inStock": false
      }
    ],
    "idiyappam": [
      {
        "name": "Rice Flour",
        "quantity": 150,
        "unit": "g",
        "category": "grains",
        "inStock": false
      },
      {
        "name": "Coconut",
        "quantity": 20,
        "unit": "g",
        "category": "produce",
        "inStock": false
      }
    ],
    "pathiri": [
      {
        "name": "Rice Flour",
        "quantity": 150,
        "unit": "g",
        "category": "grains",
        "inStock": false
      }
    ],
    "porotta": [
      {
        "name": "Maida",
        "quantity": 200,
        "unit": "g",
        "category": "grains",
        "inStock": false
      },
      {
        "name": "Oil",
        "quantity": 30,
        "unit": "ml",
        "category": "pantry",
        "inStock": false
      }
    ],
    "neer-dosa": [
      {
        "name": "Rice",
        "quantity": 100,
        "unit": "g",
        "category": "grains",
        "inStock": false
      },
      {
        "name": "Coconut",
        "quantity": 20,
        "unit": "g",
        "category": "produce",
        "inStock": false
      }
    ],
    "malabar-parotta": [
      {
        "name": "Maida",
        "quantity": 200,
        "unit": "g",
        "category": "grains",
        "inStock": false
      },
      {
        "name": "Egg",
        "quantity": 1,
        "unit": "pc",
        "category": "proteins",
        "inStock": false
      }
    ],
    "luchi": [
      {
        "name": "Maida",
        "quantity": 150,
        "unit": "g",
        "category": "grains",
        "inStock": false
      }
    ],
    "pitha": [
      {
        "name": "Rice Flour",
        "quantity": 150,
        "unit": "g",
        "category": "grains",
        "inStock": false
      },
      {
        "name": "Coconut",
        "quantity": 30,
        "unit": "g",
        "category": "produce",
        "inStock": false
      }
    ],
    "litti": [
      {
        "name": "Wheat Flour (Atta)",
        "quantity": 200,
        "unit": "g",
        "category": "grains",
        "inStock": false
      },
      {
        "name": "Sattu",
        "quantity": 50,
        "unit": "g",
        "category": "grains",
        "inStock": false
      }
    ],
    "kakara-pitha": [
      {
        "name": "Rice Flour",
        "quantity": 150,
        "unit": "g",
        "category": "grains",
        "inStock": false
      },
      {
        "name": "Jaggery",
        "quantity": 50,
        "unit": "g",
        "category": "pantry",
        "inStock": false
      }
    ],
    "arisa-pitha": [
      {
        "name": "Rice Flour",
        "quantity": 150,
        "unit": "g",
        "category": "grains",
        "inStock": false
      },
      {
        "name": "Jaggery",
        "quantity": 50,
        "unit": "g",
        "category": "pantry",
        "inStock": false
      }
    ],
    "bhakri": [
      {
        "name": "Jowar Flour",
        "quantity": 200,
        "unit": "g",
        "category": "grains",
        "inStock": false
      }
    ],
    "thepla": [
      {
        "name": "Wheat Flour (Atta)",
        "quantity": 200,
        "unit": "g",
        "category": "grains",
        "inStock": false
      },
      {
        "name": "Fenugreek Leaves",
        "quantity": 30,
        "unit": "g",
        "category": "produce",
        "inStock": false
      }
    ],
    "rotla": [
      {
        "name": "Bajra Flour",
        "quantity": 200,
        "unit": "g",
        "category": "grains",
        "inStock": false
      }
    ],
    "puran-poli": [
      {
        "name": "Wheat Flour (Atta)",
        "quantity": 200,
        "unit": "g",
        "category": "grains",
        "inStock": false
      },
      {
        "name": "Chana Dal",
        "quantity": 100,
        "unit": "g",
        "category": "proteins",
        "inStock": false
      },
      {
        "name": "Jaggery",
        "quantity": 50,
        "unit": "g",
        "category": "pantry",
        "inStock": false
      }
    ],
    "poee": [
      {
        "name": "Maida",
        "quantity": 200,
        "unit": "g",
        "category": "grains",
        "inStock": false
      },
      {
        "name": "Coconut Milk",
        "quantity": 50,
        "unit": "ml",
        "category": "pantry",
        "inStock": false
      }
    ],
    "phulka": [
      {
        "name": "Wheat Flour (Atta)",
        "quantity": 150,
        "unit": "g",
        "category": "grains",
        "inStock": false
      }
    ],
    "missi-roti": [
      {
        "name": "Wheat Flour (Atta)",
        "quantity": 200,
        "unit": "g",
        "category": "grains",
        "inStock": false
      },
      {
        "name": "Gram Flour",
        "quantity": 50,
        "unit": "g",
        "category": "grains",
        "inStock": false
      }
    ],
    "rumali-roti": [
      {
        "name": "Maida",
        "quantity": 200,
        "unit": "g",
        "category": "grains",
        "inStock": false
      }
    ],
    "tandoori-roti": [
      {
        "name": "Wheat Flour (Atta)",
        "quantity": 200,
        "unit": "g",
        "category": "grains",
        "inStock": false
      }
    ],
    "khamiri-roti": [
      {
        "name": "Wheat Flour (Atta)",
        "quantity": 200,
        "unit": "g",
        "category": "grains",
        "inStock": false
      },
      {
        "name": "Yogurt",
        "quantity": 30,
        "unit": "g",
        "category": "dairy",
        "inStock": false
      }
    ],
    "bun": [
      {
        "name": "Bun",
        "quantity": 1,
        "unit": "pc",
        "category": "breads",
        "inStock": false
      }
    ],
    "bun-maska": [
      {
        "name": "Bun",
        "quantity": 2,
        "unit": "pcs",
        "category": "breads",
        "inStock": false
      },
      {
        "name": "Butter",
        "quantity": 30,
        "unit": "g",
        "category": "dairy",
        "inStock": false
      }
    ],
    "steamed-basmati-rice": [
      {
        "name": "Basmati Rice",
        "quantity": 100,
        "unit": "g",
        "category": "grains",
        "inStock": false
      }
    ],
    "steamed-rice-sona-masuri": [
      {
        "name": "Rice",
        "quantity": 100,
        "unit": "g",
        "category": "grains",
        "inStock": false
      }
    ],
    "steamed-rice-kolam": [
      {
        "name": "Rice",
        "quantity": 100,
        "unit": "g",
        "category": "grains",
        "inStock": false
      }
    ],
    "steamed-rice": [
      {
        "name": "Rice",
        "quantity": 100,
        "unit": "g",
        "category": "grains",
        "inStock": false
      }
    ],
    "jeera-rice": [
      {
        "name": "Basmati Rice",
        "quantity": 100,
        "unit": "g",
        "category": "grains",
        "inStock": false
      },
      {
        "name": "Cumin Seeds",
        "quantity": 1,
        "unit": "tsp",
        "category": "spices",
        "inStock": false
      }
    ],
    "pulao": [
      {
        "name": "Basmati Rice",
        "quantity": 100,
        "unit": "g",
        "category": "grains",
        "inStock": false
      },
      {
        "name": "Mixed Vegetables",
        "quantity": 100,
        "unit": "g",
        "category": "produce",
        "inStock": false
      }
    ],
    "lemon-rice": [
      {
        "name": "Rice",
        "quantity": 100,
        "unit": "g",
        "category": "grains",
        "inStock": false
      },
      {
        "name": "Lemon",
        "quantity": 1,
        "unit": "pc",
        "category": "produce",
        "inStock": false
      }
    ],
    "coconut-rice": [
      {
        "name": "Rice",
        "quantity": 100,
        "unit": "g",
        "category": "grains",
        "inStock": false
      },
      {
        "name": "Coconut",
        "quantity": 30,
        "unit": "g",
        "category": "produce",
        "inStock": false
      }
    ],
    "curd-rice": [
      {
        "name": "Rice",
        "quantity": 100,
        "unit": "g",
        "category": "grains",
        "inStock": false
      },
      {
        "name": "Yogurt",
        "quantity": 100,
        "unit": "g",
        "category": "dairy",
        "inStock": false
      }
    ],
    "kerala-red-rice": [
      {
        "name": "Red Rice",
        "quantity": 100,
        "unit": "g",
        "category": "grains",
        "inStock": false
      }
    ],
    "bamboo-rice": [
      {
        "name": "Bamboo Rice",
        "quantity": 100,
        "unit": "g",
        "category": "grains",
        "inStock": false
      }
    ],
    "ghee-rice": [
      {
        "name": "Basmati Rice",
        "quantity": 100,
        "unit": "g",
        "category": "grains",
        "inStock": false
      },
      {
        "name": "Ghee",
        "quantity": 20,
        "unit": "g",
        "category": "dairy",
        "inStock": false
      }
    ],
    "gobindobhog-rice": [
      {
        "name": "Gobindobhog Rice",
        "quantity": 100,
        "unit": "g",
        "category": "grains",
        "inStock": false
      }
    ],
    "joha-rice": [
      {
        "name": "Joha Rice",
        "quantity": 100,
        "unit": "g",
        "category": "grains",
        "inStock": false
      }
    ],
    "khichdi": [
      {
        "name": "Rice",
        "quantity": 80,
        "unit": "g",
        "category": "grains",
        "inStock": false
      },
      {
        "name": "Moong Dal",
        "quantity": 50,
        "unit": "g",
        "category": "proteins",
        "inStock": false
      }
    ],
    "black-rice-chak-hao": [
      {
        "name": "Black Rice",
        "quantity": 100,
        "unit": "g",
        "category": "grains",
        "inStock": false
      }
    ],
    "bhath": [
      {
        "name": "Rice",
        "quantity": 100,
        "unit": "g",
        "category": "grains",
        "inStock": false
      }
    ],
    "sona-masoori": [
      {
        "name": "Sona Masoori Rice",
        "quantity": 100,
        "unit": "g",
        "category": "grains",
        "inStock": false
      }
    ],
    "biryani-base": [
      {
        "name": "Basmati Rice",
        "quantity": 100,
        "unit": "g",
        "category": "grains",
        "inStock": false
      },
      {
        "name": "Spices",
        "quantity": 1,
        "unit": "packet",
        "category": "spices",
        "inStock": false
      }
    ],
    "pongal": [
      {
        "name": "Rice",
        "quantity": 80,
        "unit": "g",
        "category": "grains",
        "inStock": false
      },
      {
        "name": "Moong Dal",
        "quantity": 50,
        "unit": "g",
        "category": "proteins",
        "inStock": false
      }
    ],
    "upma": [
      {
        "name": "Semolina (Rava)",
        "quantity": 100,
        "unit": "g",
        "category": "grains",
        "inStock": false
      },
      {
        "name": "Spices",
        "quantity": 1,
        "unit": "packet",
        "category": "spices",
        "inStock": false
      }
    ],
    "jeera-sona-masoori": [
      {
        "name": "Sona Masoori Rice",
        "quantity": 100,
        "unit": "g",
        "category": "grains",
        "inStock": false
      },
      {
        "name": "Cumin Seeds",
        "quantity": 1,
        "unit": "tsp",
        "category": "spices",
        "inStock": false
      }
    ],
    "curd-pulao": [
      {
        "name": "Basmati Rice",
        "quantity": 100,
        "unit": "g",
        "category": "grains",
        "inStock": false
      },
      {
        "name": "Yogurt",
        "quantity": 100,
        "unit": "g",
        "category": "dairy",
        "inStock": false
      }
    ],
    "matar-pulao": [
      {
        "name": "Basmati Rice",
        "quantity": 100,
        "unit": "g",
        "category": "grains",
        "inStock": false
      },
      {
        "name": "Peas",
        "quantity": 50,
        "unit": "g",
        "category": "produce",
        "inStock": false
      }
    ],
    "veg-pulao": [
      {
        "name": "Basmati Rice",
        "quantity": 100,
        "unit": "g",
        "category": "grains",
        "inStock": false
      },
      {
        "name": "Mixed Vegetables",
        "quantity": 100,
        "unit": "g",
        "category": "produce",
        "inStock": false
      }
    ],
    "mint-chutney": [
      {
        "name": "Mint",
        "quantity": 30,
        "unit": "g",
        "category": "produce",
        "inStock": false
      },
      {
        "name": "Green Chilli",
        "quantity": 2,
        "unit": "pc",
        "category": "produce",
        "inStock": false
      },
      {
        "name": "Lemon",
        "quantity": 1,
        "unit": "pc",
        "category": "produce",
        "inStock": false
      }
    ],
    "cucumber-raita": [
      {
        "name": "Yogurt",
        "quantity": 100,
        "unit": "g",
        "category": "dairy",
        "inStock": false
      },
      {
        "name": "Cucumber",
        "quantity": 1,
        "unit": "pc",
        "category": "produce",
        "inStock": false
      }
    ],
    "curd": [
      {
        "name": "Yogurt",
        "quantity": 100,
        "unit": "g",
        "category": "dairy",
        "inStock": false
      }
    ],
    "onion-salad": [
      {
        "name": "Onions",
        "quantity": 1,
        "unit": "pc",
        "category": "produce",
        "inStock": false
      },
      {
        "name": "Lemon",
        "quantity": 1,
        "unit": "pc",
        "category": "produce",
        "inStock": false
      }
    ],
    "cucumber-tomato-salad": [
      {
        "name": "Cucumber",
        "quantity": 1,
        "unit": "pc",
        "category": "produce",
        "inStock": false
      },
      {
        "name": "Tomatoes",
        "quantity": 1,
        "unit": "pc",
        "category": "produce",
        "inStock": false
      },
      {
        "name": "Lemon",
        "quantity": 1,
        "unit": "pc",
        "category": "produce",
        "inStock": false
      }
    ],
    "cucumber-salad": [
      {
        "name": "Cucumber",
        "quantity": 1,
        "unit": "pc",
        "category": "produce",
        "inStock": false
      }
    ],
    "mango-pickle": [
      {
        "name": "Mango Pickle",
        "quantity": 30,
        "unit": "g",
        "category": "pantry",
        "inStock": false
      }
    ],
    "mix-pickle": [
      {
        "name": "Mix Pickle",
        "quantity": 30,
        "unit": "g",
        "category": "pantry",
        "inStock": false
      }
    ],
    "lemon-pickle": [
      {
        "name": "Lemon Pickle",
        "quantity": 30,
        "unit": "g",
        "category": "pantry",
        "inStock": false
      }
    ],
    "tamarind-chutney": [
      {
        "name": "Tamarind",
        "quantity": 30,
        "unit": "g",
        "category": "pantry",
        "inStock": false
      },
      {
        "name": "Jaggery",
        "quantity": 20,
        "unit": "g",
        "category": "pantry",
        "inStock": false
      }
    ],
    "green-chutney": [
      {
        "name": "Coriander",
        "quantity": 30,
        "unit": "g",
        "category": "produce",
        "inStock": false
      },
      {
        "name": "Mint",
        "quantity": 20,
        "unit": "g",
        "category": "produce",
        "inStock": false
      },
      {
        "name": "Green Chilli",
        "quantity": 2,
        "unit": "pc",
        "category": "produce",
        "inStock": false
      }
    ],
    "onion-raita": [
      {
        "name": "Yogurt",
        "quantity": 100,
        "unit": "g",
        "category": "dairy",
        "inStock": false
      },
      {
        "name": "Onions",
        "quantity": 1,
        "unit": "pc",
        "category": "produce",
        "inStock": false
      }
    ],
    "boondi-raita": [
      {
        "name": "Yogurt",
        "quantity": 100,
        "unit": "g",
        "category": "dairy",
        "inStock": false
      },
      {
        "name": "Boondi",
        "quantity": 30,
        "unit": "g",
        "category": "pantry",
        "inStock": false
      }
    ],
    "roasted-papad": [
      {
        "name": "Papad",
        "quantity": 2,
        "unit": "pc",
        "category": "pantry",
        "inStock": false
      }
    ],
    "butter": [
      {
        "name": "Butter",
        "quantity": 30,
        "unit": "g",
        "category": "dairy",
        "inStock": false
      }
    ],
    "aloo-bhaji": [
      {
        "name": "Potatoes",
        "quantity": 3,
        "unit": "pc",
        "category": "produce",
        "inStock": false
      },
      {
        "name": "Onions",
        "quantity": 1,
        "unit": "pc",
        "category": "produce",
        "inStock": false
      },
      {
        "name": "Spices",
        "quantity": 1,
        "unit": "packet",
        "category": "spices",
        "inStock": false
      }
    ],
    "coconut-chutney": [
      {
        "name": "Coconut",
        "quantity": 50,
        "unit": "g",
        "category": "produce",
        "inStock": false
      },
      {
        "name": "Green Chilli",
        "quantity": 2,
        "unit": "pc",
        "category": "produce",
        "inStock": false
      }
    ],
    "tomato-chutney": [
      {
        "name": "Tomatoes",
        "quantity": 3,
        "unit": "pc",
        "category": "produce",
        "inStock": false
      },
      {
        "name": "Onions",
        "quantity": 1,
        "unit": "pc",
        "category": "produce",
        "inStock": false
      },
      {
        "name": "Spices",
        "quantity": 1,
        "unit": "packet",
        "category": "spices",
        "inStock": false
      }
    ],
    "podi": [
      {
        "name": "Chickpeas",
        "quantity": 50,
        "unit": "g",
        "category": "grains",
        "inStock": false
      },
      {
        "name": "Spices",
        "quantity": 1,
        "unit": "packet",
        "category": "spices",
        "inStock": false
      }
    ],
    "ghee": [
      {
        "name": "Ghee",
        "quantity": 30,
        "unit": "g",
        "category": "dairy",
        "inStock": false
      }
    ],
    "onion-chutney": [
      {
        "name": "Onions",
        "quantity": 2,
        "unit": "pc",
        "category": "produce",
        "inStock": false
      },
      {
        "name": "Tamarind",
        "quantity": 10,
        "unit": "g",
        "category": "pantry",
        "inStock": false
      },
      {
        "name": "Spices",
        "quantity": 1,
        "unit": "packet",
        "category": "spices",
        "inStock": false
      }
    ],
    "peanut-chutney": [
      {
        "name": "Peanuts",
        "quantity": 30,
        "unit": "g",
        "category": "proteins",
        "inStock": false
      },
      {
        "name": "Green Chilli",
        "quantity": 2,
        "unit": "pc",
        "category": "produce",
        "inStock": false
      }
    ],
    "coriander-chutney": [
      {
        "name": "Coriander",
        "quantity": 30,
        "unit": "g",
        "category": "produce",
        "inStock": false
      },
      {
        "name": "Green Chilli",
        "quantity": 2,
        "unit": "pc",
        "category": "produce",
        "inStock": false
      }
    ],
    "gongura-pickle": [
      {
        "name": "Gongura Leaves",
        "quantity": 100,
        "unit": "g",
        "category": "produce",
        "inStock": false
      },
      {
        "name": "Spices",
        "quantity": 1,
        "unit": "packet",
        "category": "spices",
        "inStock": false
      }
    ],
    "alu-posto": [
      {
        "name": "Potatoes",
        "quantity": 3,
        "unit": "pc",
        "category": "produce",
        "inStock": false
      },
      {
        "name": "Poppy Seeds",
        "quantity": 20,
        "unit": "g",
        "category": "spices",
        "inStock": false
      }
    ],
    "begun-bhaja": [
      {
        "name": "Eggplant",
        "quantity": 1,
        "unit": "pc",
        "category": "produce",
        "inStock": false
      },
      {
        "name": "Turmeric",
        "quantity": 1,
        "unit": "tsp",
        "category": "spices",
        "inStock": false
      }
    ],
    "garlic-chutney": [
      {
        "name": "Garlic",
        "quantity": 6,
        "unit": "pc",
        "category": "produce",
        "inStock": false
      },
      {
        "name": "Dry Red Chilli",
        "quantity": 3,
        "unit": "pc",
        "category": "produce",
        "inStock": false
      }
    ],
    "thecha-green-chili-chutney": [
      {
        "name": "Green Chilli",
        "quantity": 6,
        "unit": "pc",
        "category": "produce",
        "inStock": false
      },
      {
        "name": "Garlic",
        "quantity": 4,
        "unit": "pc",
        "category": "produce",
        "inStock": false
      }
    ],
    "koshimbir-salad": [
      {
        "name": "Onions",
        "quantity": 1,
        "unit": "pc",
        "category": "produce",
        "inStock": false
      },
      {
        "name": "Tomatoes",
        "quantity": 1,
        "unit": "pc",
        "category": "produce",
        "inStock": false
      },
      {
        "name": "Cucumber",
        "quantity": 1,
        "unit": "pc",
        "category": "produce",
        "inStock": false
      }
    ],
    "peanut-butter": [
      {
        "name": "Peanut Butter",
        "quantity": 1,
        "unit": "jar",
        "category": "pantry",
        "inStock": false
      }
    ],
    "masala-raita": [
      {
        "name": "Yogurt",
        "quantity": 100,
        "unit": "g",
        "category": "dairy",
        "inStock": false
      },
      {
        "name": "Spices",
        "quantity": 1,
        "unit": "packet",
        "category": "spices",
        "inStock": false
      }
    ],
    "kachumber-salad": [
      {
        "name": "Cucumber",
        "quantity": 1,
        "unit": "pc",
        "category": "produce",
        "inStock": false
      },
      {
        "name": "Tomatoes",
        "quantity": 1,
        "unit": "pc",
        "category": "produce",
        "inStock": false
      },
      {
        "name": "Onions",
        "quantity": 1,
        "unit": "pc",
        "category": "produce",
        "inStock": false
      },
      {
        "name": "Lemon",
        "quantity": 1,
        "unit": "pc",
        "category": "produce",
        "inStock": false
      }
    ],
    "lime-pickle": [
      {
        "name": "Lime Pickle",
        "quantity": 30,
        "unit": "g",
        "category": "pantry",
        "inStock": false
      }
    ],
    "mixed-chutney": [
      {
        "name": "Mint",
        "quantity": 20,
        "unit": "g",
        "category": "produce",
        "inStock": false
      },
      {
        "name": "Coriander",
        "quantity": 20,
        "unit": "g",
        "category": "produce",
        "inStock": false
      },
      {
        "name": "Tamarind",
        "quantity": 20,
        "unit": "g",
        "category": "pantry",
        "inStock": false
      }
    ],
    "fryums": [
      {
        "name": "Fryums",
        "quantity": 50,
        "unit": "g",
        "category": "pantry",
        "inStock": false
      }
    ],
    "onion-rings": [
      {
        "name": "Onions",
        "quantity": 2,
        "unit": "pc",
        "category": "produce",
        "inStock": false
      },
      {
        "name": "Gram Flour",
        "quantity": 50,
        "unit": "g",
        "category": "grains",
        "inStock": false
      }
    ],
    "lemon-wedge": [
      {
        "name": "Lemon",
        "quantity": 1,
        "unit": "pc",
        "category": "produce",
        "inStock": false
      }
    ],
    "green-chili": [
      {
        "name": "Green Chilli",
        "quantity": 3,
        "unit": "pc",
        "category": "produce",
        "inStock": false
      }
    ],
    "pappadam": [
      {
        "name": "Papad",
        "quantity": 2,
        "unit": "pc",
        "category": "pantry",
        "inStock": false
      }
    ],
    "mirchi-ka-salan": [
      {
        "name": "Peanuts",
        "quantity": 30,
        "unit": "g",
        "category": "proteins",
        "inStock": false
      },
      {
        "name": "Sesame Seeds",
        "quantity": 10,
        "unit": "g",
        "category": "spices",
        "inStock": false
      },
      {
        "name": "Coconut",
        "quantity": 30,
        "unit": "g",
        "category": "produce",
        "inStock": false
      },
      {
        "name": "Red Chilli",
        "quantity": 3,
        "unit": "pc",
        "category": "produce",
        "inStock": false
      },
      {
        "name": "Tamarind",
        "quantity": 10,
        "unit": "g",
        "category": "pantry",
        "inStock": false
      }
    ],
    "sev": [
      {
        "name": "Sev",
        "quantity": 50,
        "unit": "g",
        "category": "pantry",
        "inStock": false
      }
    ],
    "farsan": [
      {
        "name": "Farsan Mix",
        "quantity": 50,
        "unit": "g",
        "category": "pantry",
        "inStock": false
      }
    ],
    "salsa": [
      {
        "name": "Tomatoes",
        "quantity": 2,
        "unit": "pc",
        "category": "produce",
        "inStock": false
      },
      {
        "name": "Onions",
        "quantity": 1,
        "unit": "pc",
        "category": "produce",
        "inStock": false
      },
      {
        "name": "Coriander",
        "quantity": 10,
        "unit": "g",
        "category": "produce",
        "inStock": false
      },
      {
        "name": "Lime",
        "quantity": 1,
        "unit": "pc",
        "category": "produce",
        "inStock": false
      }
    ],
    "sour-cream": [
      {
        "name": "Sour Cream",
        "quantity": 50,
        "unit": "g",
        "category": "dairy",
        "inStock": false
      }
    ],
    "namkeen": [
      {
        "name": "Namkeen Mix",
        "quantity": 50,
        "unit": "g",
        "category": "pantry",
        "inStock": false
      }
    ],
    "mixed-nuts": [
      {
        "name": "Almonds",
        "quantity": 10,
        "unit": "g",
        "category": "pantry",
        "inStock": false
      },
      {
        "name": "Cashews",
        "quantity": 10,
        "unit": "g",
        "category": "pantry",
        "inStock": false
      },
      {
        "name": "Pistachios",
        "quantity": 10,
        "unit": "g",
        "category": "pantry",
        "inStock": false
      }
    ],
    "almonds": [
      {
        "name": "Almonds",
        "quantity": 10,
        "unit": "g",
        "category": "pantry",
        "inStock": false
      }
    ],
    "pistachios": [
      {
        "name": "Pistachios",
        "quantity": 10,
        "unit": "g",
        "category": "pantry",
        "inStock": false
      }
    ],
    "honey": [
      {
        "name": "Honey",
        "quantity": 30,
        "unit": "g",
        "category": "pantry",
        "inStock": false
      }
    ],
    "mayonnaise": [
      {
        "name": "Mayonnaise",
        "quantity": 30,
        "unit": "g",
        "category": "pantry",
        "inStock": false
      }
    ],
    "toast": [
      {
        "name": "White Bread",
        "quantity": 2,
        "unit": "pc",
        "category": "pantry",
        "inStock": false
      }
    ],
    "baati": [
      {
        "name": "Wheat Flour (Atta)",
        "quantity": 200,
        "unit": "g",
        "category": "grains",
        "inStock": false
      },
      {
        "name": "Ghee",
        "quantity": 30,
        "unit": "g",
        "category": "dairy",
        "inStock": false
      }
    ],
    "bhature": [
      {
        "name": "Wheat Flour (Atta)",
        "quantity": 200,
        "unit": "g",
        "category": "grains",
        "inStock": false
      },
      {
        "name": "Yogurt",
        "quantity": 30,
        "unit": "g",
        "category": "dairy",
        "inStock": false
      },
      {
        "name": "Oil",
        "quantity": 30,
        "unit": "ml",
        "category": "pantry",
        "inStock": false
      }
    ],
    "herbal-tea": [
      {
        "name": "Herbal Tea Bag",
        "quantity": 1,
        "unit": "pc",
        "category": "pantry",
        "inStock": false
      },
      {
        "name": "Water",
        "quantity": 200,
        "unit": "ml",
        "category": "pantry",
        "inStock": false
      }
    ],
    "iced-tea": [
      {
        "name": "Tea",
        "quantity": 1,
        "unit": "tbsp",
        "category": "pantry",
        "inStock": false
      },
      {
        "name": "Ice",
        "quantity": 4,
        "unit": "pc",
        "category": "pantry",
        "inStock": false
      },
      {
        "name": "Sugar",
        "quantity": 20,
        "unit": "g",
        "category": "pantry",
        "inStock": false
      },
      {
        "name": "Lemon",
        "quantity": 1,
        "unit": "pc",
        "category": "produce",
        "inStock": false
      }
    ],
    "gundruk-soup": [
      {
        "name": "Gundruk",
        "quantity": 50,
        "unit": "g",
        "category": "pantry",
        "inStock": false
      },
      {
        "name": "Onions",
        "quantity": 1,
        "unit": "pc",
        "category": "produce",
        "inStock": false
      },
      {
        "name": "Tomatoes",
        "quantity": 1,
        "unit": "pc",
        "category": "produce",
        "inStock": false
      },
      {
        "name": "Spices",
        "quantity": 1,
        "unit": "packet",
        "category": "spices",
        "inStock": false
      }
    ],
    "toasted-seeds": [
      {
        "name": "Mixed Seeds",
        "quantity": 20,
        "unit": "g",
        "category": "pantry",
        "inStock": false
      }
    ],
    "sesame-seeds": [
      {
        "name": "Sesame Seeds",
        "quantity": 10,
        "unit": "g",
        "category": "spices",
        "inStock": false
      }
    ],
    "fermented-greens": [
      {
        "name": "Fermented Greens / Gundruk",
        "quantity": 50,
        "unit": "g",
        "category": "pantry",
        "inStock": false
      }
    ],
    "dry-fruits-nuts": [
      {
        "name": "Almonds",
        "quantity": 10,
        "unit": "g",
        "category": "pantry",
        "inStock": false
      },
      {
        "name": "Cashews",
        "quantity": 10,
        "unit": "g",
        "category": "pantry",
        "inStock": false
      },
      {
        "name": "Raisins",
        "quantity": 10,
        "unit": "g",
        "category": "pantry",
        "inStock": false
      }
    ],
    "dry-fruit-mix": [
      {
        "name": "Mixed Dry Fruits",
        "quantity": 30,
        "unit": "g",
        "category": "pantry",
        "inStock": false
      }
    ],
    "rusk": [
      {
        "name": "Rusk",
        "quantity": 2,
        "unit": "pc",
        "category": "breads",
        "inStock": false
      }
    ],
    "saffron": [
      {
        "name": "Saffron",
        "quantity": 1,
        "unit": "pinch",
        "category": "spices",
        "inStock": false
      }
    ],
    "nimbu-pani": [
      {
        "name": "Lemon",
        "quantity": 2,
        "unit": "pc",
        "category": "produce",
        "inStock": false
      },
      {
        "name": "Sugar",
        "quantity": 20,
        "unit": "g",
        "category": "pantry",
        "inStock": false
      }
    ],
    "chaas-buttermilk": [
      {
        "name": "Yogurt",
        "quantity": 100,
        "unit": "g",
        "category": "dairy",
        "inStock": false
      }
    ],
    "aam-panna": [
      {
        "name": "Raw Mango",
        "quantity": 1,
        "unit": "pc",
        "category": "produce",
        "inStock": false
      },
      {
        "name": "Sugar",
        "quantity": 30,
        "unit": "g",
        "category": "pantry",
        "inStock": false
      },
      {
        "name": "Spices",
        "quantity": 1,
        "unit": "packet",
        "category": "spices",
        "inStock": false
      }
    ],
    "sweet-lassi": [
      {
        "name": "Yogurt",
        "quantity": 150,
        "unit": "g",
        "category": "dairy",
        "inStock": false
      },
      {
        "name": "Sugar",
        "quantity": 20,
        "unit": "g",
        "category": "pantry",
        "inStock": false
      }
    ],
    "salted-lassi": [
      {
        "name": "Yogurt",
        "quantity": 150,
        "unit": "g",
        "category": "dairy",
        "inStock": false
      }
    ],
    "mango-lassi": [
      {
        "name": "Yogurt",
        "quantity": 150,
        "unit": "g",
        "category": "dairy",
        "inStock": false
      },
      {
        "name": "Mango",
        "quantity": 1,
        "unit": "pc",
        "category": "produce",
        "inStock": false
      }
    ],
    "jaljeera": [
      {
        "name": "Mint",
        "quantity": 20,
        "unit": "g",
        "category": "produce",
        "inStock": false
      },
      {
        "name": "Cumin",
        "quantity": 1,
        "unit": "tsp",
        "category": "spices",
        "inStock": false
      },
      {
        "name": "Lemon",
        "quantity": 1,
        "unit": "pc",
        "category": "produce",
        "inStock": false
      }
    ],
    "masala-chai": [
      {
        "name": "Tea",
        "quantity": 1,
        "unit": "tbsp",
        "category": "pantry",
        "inStock": false
      },
      {
        "name": "Milk",
        "quantity": 100,
        "unit": "ml",
        "category": "dairy",
        "inStock": false
      },
      {
        "name": "Ginger",
        "quantity": 1,
        "unit": "pc",
        "category": "produce",
        "inStock": false
      },
      {
        "name": "Spices",
        "quantity": 1,
        "unit": "packet",
        "category": "spices",
        "inStock": false
      }
    ],
    "badam-milk": [
      {
        "name": "Almonds",
        "quantity": 10,
        "unit": "g",
        "category": "pantry",
        "inStock": false
      },
      {
        "name": "Milk",
        "quantity": 200,
        "unit": "ml",
        "category": "dairy",
        "inStock": false
      },
      {
        "name": "Saffron",
        "quantity": 1,
        "unit": "pinch",
        "category": "spices",
        "inStock": false
      }
    ],
    "thandai": [
      {
        "name": "Milk",
        "quantity": 200,
        "unit": "ml",
        "category": "dairy",
        "inStock": false
      },
      {
        "name": "Almonds",
        "quantity": 10,
        "unit": "g",
        "category": "pantry",
        "inStock": false
      },
      {
        "name": "Poppy Seeds",
        "quantity": 5,
        "unit": "g",
        "category": "spices",
        "inStock": false
      },
      {
        "name": "Spices",
        "quantity": 1,
        "unit": "packet",
        "category": "spices",
        "inStock": false
      }
    ],
    "sharbat": [
      {
        "name": "Sharbat Syrup",
        "quantity": 30,
        "unit": "ml",
        "category": "pantry",
        "inStock": false
      }
    ],
    "filter-coffee": [
      {
        "name": "Coffee Powder",
        "quantity": 2,
        "unit": "tbsp",
        "category": "pantry",
        "inStock": false
      },
      {
        "name": "Milk",
        "quantity": 100,
        "unit": "ml",
        "category": "dairy",
        "inStock": false
      }
    ],
    "sambaram-spiced-buttermilk": [
      {
        "name": "Yogurt",
        "quantity": 100,
        "unit": "g",
        "category": "dairy",
        "inStock": false
      },
      {
        "name": "Green Chilli",
        "quantity": 1,
        "unit": "pc",
        "category": "produce",
        "inStock": false
      },
      {
        "name": "Ginger",
        "quantity": 1,
        "unit": "pc",
        "category": "produce",
        "inStock": false
      }
    ],
    "kokum-sharbat": [
      {
        "name": "Kokum",
        "quantity": 5,
        "unit": "pc",
        "category": "pantry",
        "inStock": false
      },
      {
        "name": "Sugar",
        "quantity": 20,
        "unit": "g",
        "category": "pantry",
        "inStock": false
      }
    ],
    "sol-kadhi": [
      {
        "name": "Kokum",
        "quantity": 5,
        "unit": "pc",
        "category": "pantry",
        "inStock": false
      },
      {
        "name": "Coconut Milk",
        "quantity": 100,
        "unit": "ml",
        "category": "pantry",
        "inStock": false
      }
    ],
    "coconut-water": [
      {
        "name": "Coconut Water",
        "quantity": 200,
        "unit": "ml",
        "category": "pantry",
        "inStock": false
      }
    ],
    "sattu-sharbat": [
      {
        "name": "Sattu",
        "quantity": 50,
        "unit": "g",
        "category": "grains",
        "inStock": false
      },
      {
        "name": "Lemon",
        "quantity": 1,
        "unit": "pc",
        "category": "produce",
        "inStock": false
      },
      {
        "name": "Sugar",
        "quantity": 20,
        "unit": "g",
        "category": "pantry",
        "inStock": false
      }
    ],
    "kokum-sherbet": [
      {
        "name": "Kokum",
        "quantity": 5,
        "unit": "pc",
        "category": "pantry",
        "inStock": false
      },
      {
        "name": "Sugar",
        "quantity": 20,
        "unit": "g",
        "category": "pantry",
        "inStock": false
      }
    ],
    "ginger-lemon": [
      {
        "name": "Ginger",
        "quantity": 15,
        "unit": "g",
        "category": "produce",
        "inStock": false
      },
      {
        "name": "Lemon",
        "quantity": 1,
        "unit": "pc",
        "category": "produce",
        "inStock": false
      },
      {
        "name": "Honey",
        "quantity": 10,
        "unit": "ml",
        "category": "pantry",
        "inStock": false
      }
    ],
    "mixed-fruit": [
      {
        "name": "Mixed Seasonal Fruit",
        "quantity": 200,
        "unit": "g",
        "category": "produce",
        "inStock": false
      }
    ],
    "seasonal-fruit": [
      {
        "name": "Seasonal Fruit",
        "quantity": 200,
        "unit": "g",
        "category": "produce",
        "inStock": false
      }
    ],
    "mixed seasonal fruit": [
      {
        "name": "Mixed Seasonal Fruit",
        "quantity": 200,
        "unit": "g",
        "category": "produce",
        "inStock": false
      }
    ],
    "apple": [
      {
        "name": "Apple",
        "quantity": 1,
        "unit": "pc",
        "category": "produce",
        "inStock": false
      }
    ],
    "banana": [
      {
        "name": "Banana",
        "quantity": 1,
        "unit": "pc",
        "category": "produce",
        "inStock": false
      }
    ],
    "orange": [
      {
        "name": "Orange",
        "quantity": 1,
        "unit": "pc",
        "category": "produce",
        "inStock": false
      }
    ],
    "mango": [
      {
        "name": "Mango",
        "quantity": 1,
        "unit": "pc",
        "category": "produce",
        "inStock": false
      }
    ],
    "pomegranate": [
      {
        "name": "Pomegranate",
        "quantity": 1,
        "unit": "pc",
        "category": "produce",
        "inStock": false
      }
    ],
    "papaya": [
      {
        "name": "Papaya",
        "quantity": 100,
        "unit": "g",
        "category": "produce",
        "inStock": false
      }
    ],
    "watermelon": [
      {
        "name": "Watermelon",
        "quantity": 200,
        "unit": "g",
        "category": "produce",
        "inStock": false
      }
    ],
    "grapes": [
      {
        "name": "Grapes",
        "quantity": 100,
        "unit": "g",
        "category": "produce",
        "inStock": false
      }
    ],
    "guava": [
      {
        "name": "Guava",
        "quantity": 1,
        "unit": "pc",
        "category": "produce",
        "inStock": false
      }
    ],
    "pineapple": [
      {
        "name": "Pineapple",
        "quantity": 100,
        "unit": "g",
        "category": "produce",
        "inStock": false
      }
    ],
    "coconut": [
      {
        "name": "Coconut",
        "quantity": 50,
        "unit": "g",
        "category": "produce",
        "inStock": false
      }
    ],
    "avocado": [
      {
        "name": "Avocado",
        "quantity": 1,
        "unit": "pc",
        "category": "produce",
        "inStock": false
      }
    ],
    "fruit-chaat": [
      {
        "name": "Mixed Seasonal Fruit",
        "quantity": 200,
        "unit": "g",
        "category": "produce",
        "inStock": false
      },
      {
        "name": "Lemon",
        "quantity": 1,
        "unit": "pc",
        "category": "produce",
        "inStock": false
      },
      {
        "name": "Spices",
        "quantity": 1,
        "unit": "packet",
        "category": "spices",
        "inStock": false
      }
    ],
    "fruit-cream": [
      {
        "name": "Mixed Seasonal Fruit",
        "quantity": 200,
        "unit": "g",
        "category": "produce",
        "inStock": false
      },
      {
        "name": "Cream",
        "quantity": 50,
        "unit": "ml",
        "category": "dairy",
        "inStock": false
      },
      {
        "name": "Sugar",
        "quantity": 20,
        "unit": "g",
        "category": "pantry",
        "inStock": false
      }
    ],
    "fruit-pachadi": [
      {
        "name": "Mixed Seasonal Fruit",
        "quantity": 200,
        "unit": "g",
        "category": "produce",
        "inStock": false
      },
      {
        "name": "Yogurt",
        "quantity": 100,
        "unit": "g",
        "category": "dairy",
        "inStock": false
      },
      {
        "name": "Coconut",
        "quantity": 20,
        "unit": "g",
        "category": "produce",
        "inStock": false
      }
    ],
    "fruit-payesh": [
      {
        "name": "Mixed Seasonal Fruit",
        "quantity": 200,
        "unit": "g",
        "category": "produce",
        "inStock": false
      },
      {
        "name": "Rice",
        "quantity": 50,
        "unit": "g",
        "category": "grains",
        "inStock": false
      },
      {
        "name": "Milk",
        "quantity": 200,
        "unit": "ml",
        "category": "dairy",
        "inStock": false
      },
      {
        "name": "Sugar",
        "quantity": 30,
        "unit": "g",
        "category": "pantry",
        "inStock": false
      }
    ],
    "kheer-/-payasam": [
      {
        "name": "Rice",
        "quantity": 50,
        "unit": "g",
        "category": "grains",
        "inStock": false
      },
      {
        "name": "Milk",
        "quantity": 500,
        "unit": "ml",
        "category": "dairy",
        "inStock": false
      },
      {
        "name": "Sugar",
        "quantity": 50,
        "unit": "g",
        "category": "pantry",
        "inStock": false
      }
    ],
    "gulab-jamun": [
      {
        "name": "Milk Powder",
        "quantity": 100,
        "unit": "g",
        "category": "pantry",
        "inStock": false
      },
      {
        "name": "Sugar",
        "quantity": 100,
        "unit": "g",
        "category": "pantry",
        "inStock": false
      },
      {
        "name": "Ghee",
        "quantity": 30,
        "unit": "g",
        "category": "dairy",
        "inStock": false
      }
    ],
    "rasgulla": [
      {
        "name": "Milk",
        "quantity": 1,
        "unit": "l",
        "category": "dairy",
        "inStock": false
      },
      {
        "name": "Sugar",
        "quantity": 100,
        "unit": "g",
        "category": "pantry",
        "inStock": false
      }
    ],
    "jalebi": [
      {
        "name": "Maida",
        "quantity": 100,
        "unit": "g",
        "category": "grains",
        "inStock": false
      },
      {
        "name": "Sugar",
        "quantity": 100,
        "unit": "g",
        "category": "pantry",
        "inStock": false
      },
      {
        "name": "Yogurt",
        "quantity": 50,
        "unit": "g",
        "category": "dairy",
        "inStock": false
      }
    ],
    "gajar-halwa": [
      {
        "name": "Carrots",
        "quantity": 500,
        "unit": "g",
        "category": "produce",
        "inStock": false
      },
      {
        "name": "Milk",
        "quantity": 500,
        "unit": "ml",
        "category": "dairy",
        "inStock": false
      },
      {
        "name": "Sugar",
        "quantity": 50,
        "unit": "g",
        "category": "pantry",
        "inStock": false
      },
      {
        "name": "Ghee",
        "quantity": 30,
        "unit": "g",
        "category": "dairy",
        "inStock": false
      }
    ],
    "sooji-halwa": [
      {
        "name": "Semolina (Rava)",
        "quantity": 100,
        "unit": "g",
        "category": "grains",
        "inStock": false
      },
      {
        "name": "Sugar",
        "quantity": 80,
        "unit": "g",
        "category": "pantry",
        "inStock": false
      },
      {
        "name": "Ghee",
        "quantity": 50,
        "unit": "g",
        "category": "dairy",
        "inStock": false
      }
    ],
    "rasmalai": [
      {
        "name": "Milk",
        "quantity": 1,
        "unit": "l",
        "category": "dairy",
        "inStock": false
      },
      {
        "name": "Sugar",
        "quantity": 100,
        "unit": "g",
        "category": "pantry",
        "inStock": false
      },
      {
        "name": "Saffron",
        "quantity": 1,
        "unit": "pinch",
        "category": "spices",
        "inStock": false
      }
    ],
    "shrikhand": [
      {
        "name": "Yogurt",
        "quantity": 500,
        "unit": "g",
        "category": "dairy",
        "inStock": false
      },
      {
        "name": "Sugar",
        "quantity": 50,
        "unit": "g",
        "category": "pantry",
        "inStock": false
      },
      {
        "name": "Saffron",
        "quantity": 1,
        "unit": "pinch",
        "category": "spices",
        "inStock": false
      }
    ],
    "barfi-(milk/coconut)": [
      {
        "name": "Milk Powder",
        "quantity": 200,
        "unit": "g",
        "category": "pantry",
        "inStock": false
      },
      {
        "name": "Sugar",
        "quantity": 100,
        "unit": "g",
        "category": "pantry",
        "inStock": false
      },
      {
        "name": "Coconut",
        "quantity": 50,
        "unit": "g",
        "category": "produce",
        "inStock": false
      }
    ],
    "modak": [
      {
        "name": "Rice Flour",
        "quantity": 200,
        "unit": "g",
        "category": "grains",
        "inStock": false
      },
      {
        "name": "Coconut",
        "quantity": 100,
        "unit": "g",
        "category": "produce",
        "inStock": false
      },
      {
        "name": "Jaggery",
        "quantity": 100,
        "unit": "g",
        "category": "pantry",
        "inStock": false
      }
    ],
    "phirni": [
      {
        "name": "Rice",
        "quantity": 50,
        "unit": "g",
        "category": "grains",
        "inStock": false
      },
      {
        "name": "Milk",
        "quantity": 500,
        "unit": "ml",
        "category": "dairy",
        "inStock": false
      },
      {
        "name": "Sugar",
        "quantity": 50,
        "unit": "g",
        "category": "pantry",
        "inStock": false
      }
    ],
    "ladoo-(besan/motichoor)": [
      {
        "name": "Gram Flour",
        "quantity": 200,
        "unit": "g",
        "category": "grains",
        "inStock": false
      },
      {
        "name": "Sugar",
        "quantity": 100,
        "unit": "g",
        "category": "pantry",
        "inStock": false
      },
      {
        "name": "Ghee",
        "quantity": 50,
        "unit": "g",
        "category": "dairy",
        "inStock": false
      }
    ],
    "malpua": [
      {
        "name": "Maida",
        "quantity": 100,
        "unit": "g",
        "category": "grains",
        "inStock": false
      },
      {
        "name": "Milk",
        "quantity": 200,
        "unit": "ml",
        "category": "dairy",
        "inStock": false
      },
      {
        "name": "Sugar",
        "quantity": 50,
        "unit": "g",
        "category": "pantry",
        "inStock": false
      }
    ],
    "kulfi": [
      {
        "name": "Milk",
        "quantity": 500,
        "unit": "ml",
        "category": "dairy",
        "inStock": false
      },
      {
        "name": "Sugar",
        "quantity": 50,
        "unit": "g",
        "category": "pantry",
        "inStock": false
      },
      {
        "name": "Pistachios",
        "quantity": 20,
        "unit": "g",
        "category": "pantry",
        "inStock": false
      }
    ],
    "mango-kulfi": [
      {
        "name": "Milk",
        "quantity": 500,
        "unit": "ml",
        "category": "dairy",
        "inStock": false
      },
      {
        "name": "Sugar",
        "quantity": 50,
        "unit": "g",
        "category": "pantry",
        "inStock": false
      },
      {
        "name": "Pistachios",
        "quantity": 20,
        "unit": "g",
        "category": "pantry",
        "inStock": false
      },
      {
        "name": "Mango",
        "quantity": 1,
        "unit": "pc",
        "category": "produce",
        "inStock": false
      }
    ],
    "aamras": [
      {
        "name": "Mango",
        "quantity": 2,
        "unit": "pc",
        "category": "produce",
        "inStock": false
      },
      {
        "name": "Sugar",
        "quantity": 30,
        "unit": "g",
        "category": "pantry",
        "inStock": false
      },
      {
        "name": "Cardamom",
        "quantity": 1,
        "unit": "pinch",
        "category": "spices",
        "inStock": false
      }
    ],
    "ras-malai": [
      {
        "name": "Milk",
        "quantity": 1,
        "unit": "l",
        "category": "dairy",
        "inStock": false
      },
      {
        "name": "Sugar",
        "quantity": 100,
        "unit": "g",
        "category": "pantry",
        "inStock": false
      },
      {
        "name": "Saffron",
        "quantity": 1,
        "unit": "pinch",
        "category": "spices",
        "inStock": false
      }
    ],
    "🍪 biscuit": [
      {
        "name": "Biscuit",
        "quantity": 1,
        "unit": "packet",
        "category": "snacks",
        "inStock": false
      }
    ],
    "🍪-biscuit": [
      {
        "name": "Biscuit",
        "quantity": 1,
        "unit": "packet",
        "category": "snacks",
        "inStock": false
      }
    ],
    "biscuit": [
      {
        "name": "Biscuit",
        "quantity": 1,
        "unit": "packet",
        "category": "snacks",
        "inStock": false
      }
    ],
    "🥜 roasted peanuts": [
      {
        "name": "Roasted Peanuts",
        "quantity": 1,
        "unit": "packet",
        "category": "snacks",
        "inStock": false
      }
    ],
    "🥜-roasted-peanuts": [
      {
        "name": "Roasted Peanuts",
        "quantity": 1,
        "unit": "packet",
        "category": "snacks",
        "inStock": false
      }
    ],
    "roasted-peanuts": [
      {
        "name": "Roasted Peanuts",
        "quantity": 1,
        "unit": "packet",
        "category": "snacks",
        "inStock": false
      }
    ],
    "roasted peanuts": [
      {
        "name": "Roasted Peanuts",
        "quantity": 1,
        "unit": "packet",
        "category": "snacks",
        "inStock": false
      }
    ],
    "🧊 ice": [
      {
        "name": "Ice",
        "quantity": 1,
        "unit": "tray",
        "category": "pantry",
        "inStock": false
      }
    ],
    "🧊-ice": [
      {
        "name": "Ice",
        "quantity": 1,
        "unit": "tray",
        "category": "pantry",
        "inStock": false
      }
    ],
    "ice": [
      {
        "name": "Ice",
        "quantity": 1,
        "unit": "tray",
        "category": "pantry",
        "inStock": false
      }
    ],
    "🌿 mint": [
      {
        "name": "Mint Leaves",
        "quantity": 1,
        "unit": "bunch",
        "category": "produce",
        "inStock": false
      }
    ],
    "🌿-mint": [
      {
        "name": "Mint Leaves",
        "quantity": 1,
        "unit": "bunch",
        "category": "produce",
        "inStock": false
      }
    ],
    "mint": [
      {
        "name": "Mint Leaves",
        "quantity": 1,
        "unit": "bunch",
        "category": "produce",
        "inStock": false
      }
    ],
    "ketchup": [
      {
        "name": "Ketchup",
        "quantity": 2,
        "unit": "tbsp",
        "category": "pantry",
        "inStock": false
      }
    ],
    "tomato-sauce": [
      {
        "name": "Tomato Sauce",
        "quantity": 2,
        "unit": "tbsp",
        "category": "pantry",
        "inStock": false
      }
    ],
    "dipping-sauce": [
      {
        "name": "Dipping Sauce",
        "quantity": 2,
        "unit": "tbsp",
        "category": "pantry",
        "inStock": false
      }
    ],
    "chips": [
      {
        "name": "Chips",
        "quantity": 1,
        "unit": "packet",
        "category": "snacks",
        "inStock": false
      }
    ],
    "biscuits": [
      {
        "name": "Biscuits",
        "quantity": 2,
        "unit": "pc",
        "category": "snacks",
        "inStock": false
      }
    ],
    "cookies": [
      {
        "name": "Cookies",
        "quantity": 2,
        "unit": "pc",
        "category": "snacks",
        "inStock": false
      }
    ],
    "light-cookies": [
      {
        "name": "Cookies",
        "quantity": 2,
        "unit": "pc",
        "category": "snacks",
        "inStock": false
      }
    ],
    "biscotti": [
      {
        "name": "Biscotti",
        "quantity": 2,
        "unit": "pc",
        "category": "snacks",
        "inStock": false
      }
    ],
    "granola": [
      {
        "name": "Granola",
        "quantity": 0.5,
        "unit": "cup",
        "category": "grains",
        "inStock": false
      }
    ],
    "coconut-chips": [
      {
        "name": "Coconut Chips",
        "quantity": 0.5,
        "unit": "cup",
        "category": "snacks",
        "inStock": false
      }
    ],
    "coconut-flakes": [
      {
        "name": "Coconut Flakes",
        "quantity": 2,
        "unit": "tbsp",
        "category": "pantry",
        "inStock": false
      }
    ],
    "chopped-onion": [
      {
        "name": "Onions",
        "quantity": 1,
        "unit": "pc",
        "category": "produce",
        "inStock": false
      }
    ],
    "chopped-onions": [
      {
        "name": "Onions",
        "quantity": 1,
        "unit": "pc",
        "category": "produce",
        "inStock": false
      }
    ],
    "lettuce": [
      {
        "name": "Lettuce",
        "quantity": 0.5,
        "unit": "cup",
        "category": "produce",
        "inStock": false
      }
    ],
    "croutons": [
      {
        "name": "Bread",
        "quantity": 1,
        "unit": "pc",
        "category": "breads",
        "inStock": false
      }
    ],
    "hummus": [
      {
        "name": "Chickpeas",
        "quantity": 0.25,
        "unit": "cup",
        "category": "proteins",
        "inStock": false
      },
      {
        "name": "Tahini",
        "quantity": 1,
        "unit": "tbsp",
        "category": "pantry",
        "inStock": false
      },
      {
        "name": "Olive Oil",
        "quantity": 1,
        "unit": "tbsp",
        "category": "pantry",
        "inStock": false
      }
    ],
    "berry-compote": [
      {
        "name": "Mixed Berries",
        "quantity": 0.5,
        "unit": "cup",
        "category": "produce",
        "inStock": false
      },
      {
        "name": "Sugar",
        "quantity": 1,
        "unit": "tbsp",
        "category": "pantry",
        "inStock": false
      }
    ],
    "jaggery-syrup": [
      {
        "name": "Jaggery",
        "quantity": 2,
        "unit": "tbsp",
        "category": "pantry",
        "inStock": false
      }
    ],
    "curry": [
      {
        "name": "Curry Leaves",
        "quantity": 1,
        "unit": "sprig",
        "category": "produce",
        "inStock": false
      }
    ],
    "side-salad": [
      {
        "name": "Mixed Greens",
        "quantity": 1,
        "unit": "cup",
        "category": "produce",
        "inStock": false
      },
      {
        "name": "Lemon Juice",
        "quantity": 1,
        "unit": "tbsp",
        "category": "pantry",
        "inStock": false
      }
    ],
    "extra-butter": [
      {
        "name": "Butter",
        "quantity": 1,
        "unit": "tbsp",
        "category": "dairy",
        "inStock": false
      }
    ],
    "ghost-chili-chutney": [
      {
        "name": "Ghost Chili",
        "quantity": 2,
        "unit": "pc",
        "category": "produce",
        "inStock": false
      },
      {
        "name": "Lemon Juice",
        "quantity": 1,
        "unit": "tbsp",
        "category": "pantry",
        "inStock": false
      }
    ],
    "black-sesame-chutney": [
      {
        "name": "Black Sesame Seeds",
        "quantity": 2,
        "unit": "tbsp",
        "category": "spices",
        "inStock": false
      },
      {
        "name": "Salt",
        "quantity": 0.5,
        "unit": "tsp",
        "category": "pantry",
        "inStock": false
      }
    ],
    "malabar-parota": [
      {
        "name": "Wheat Flour (Atta)",
        "quantity": 200,
        "unit": "g",
        "category": "grains",
        "inStock": false
      },
      {
        "name": "Oil",
        "quantity": 30,
        "unit": "ml",
        "category": "pantry",
        "inStock": false
      },
      {
        "name": "Egg",
        "quantity": 1,
        "unit": "pc",
        "category": "proteins",
        "inStock": false
      }
    ],
    "pazham-pori": [
      {
        "name": "Banana",
        "quantity": 4,
        "unit": "pc",
        "category": "produce",
        "inStock": false
      },
      {
        "name": "Maida",
        "quantity": 100,
        "unit": "g",
        "category": "grains",
        "inStock": false
      },
      {
        "name": "Sugar",
        "quantity": 30,
        "unit": "g",
        "category": "pantry",
        "inStock": false
      },
      {
        "name": "Oil",
        "quantity": 30,
        "unit": "ml",
        "category": "pantry",
        "inStock": false
      }
    ],
    "sadhya": [
      {
        "name": "Rice",
        "quantity": 100,
        "unit": "g",
        "category": "grains",
        "inStock": false
      },
      {
        "name": "Banana",
        "quantity": 1,
        "unit": "pc",
        "category": "produce",
        "inStock": false
      },
      {
        "name": "Coconut",
        "quantity": 30,
        "unit": "g",
        "category": "produce",
        "inStock": false
      },
      {
        "name": "Papad",
        "quantity": 2,
        "unit": "pc",
        "category": "pantry",
        "inStock": false
      },
      {
        "name": "Curry Leaves",
        "quantity": 1,
        "unit": "sprig",
        "category": "produce",
        "inStock": false
      }
    ],
    "ada-pradhaman": [
      {
        "name": "Rice",
        "quantity": 50,
        "unit": "g",
        "category": "grains",
        "inStock": false
      },
      {
        "name": "Coconut Milk",
        "quantity": 200,
        "unit": "ml",
        "category": "pantry",
        "inStock": false
      },
      {
        "name": "Jaggery",
        "quantity": 50,
        "unit": "g",
        "category": "pantry",
        "inStock": false
      },
      {
        "name": "Cardamom",
        "quantity": 1,
        "unit": "pinch",
        "category": "spices",
        "inStock": false
      }
    ],
    "haalbai": [
      {
        "name": "Rice",
        "quantity": 100,
        "unit": "g",
        "category": "grains",
        "inStock": false
      },
      {
        "name": "Milk",
        "quantity": 500,
        "unit": "ml",
        "category": "dairy",
        "inStock": false
      },
      {
        "name": "Sugar",
        "quantity": 30,
        "unit": "g",
        "category": "pantry",
        "inStock": false
      },
      {
        "name": "Cardamom",
        "quantity": 1,
        "unit": "pinch",
        "category": "spices",
        "inStock": false
      }
    ],
    "pori-urundai": [
      {
        "name": "Puffed Rice (Pori)",
        "quantity": 100,
        "unit": "g",
        "category": "grains",
        "inStock": false
      },
      {
        "name": "Jaggery",
        "quantity": 50,
        "unit": "g",
        "category": "pantry",
        "inStock": false
      },
      {
        "name": "Coconut",
        "quantity": 30,
        "unit": "g",
        "category": "produce",
        "inStock": false
      }
    ],
    "shankhali": [
      {
        "name": "Maida",
        "quantity": 100,
        "unit": "g",
        "category": "grains",
        "inStock": false
      },
      {
        "name": "Buttermilk",
        "quantity": 50,
        "unit": "ml",
        "category": "dairy",
        "inStock": false
      },
      {
        "name": "Oil",
        "quantity": 30,
        "unit": "ml",
        "category": "pantry",
        "inStock": false
      }
    ],
    "gathiya": [
      {
        "name": "Gram Flour (Besan)",
        "quantity": 100,
        "unit": "g",
        "category": "grains",
        "inStock": false
      },
      {
        "name": "Oil",
        "quantity": 30,
        "unit": "ml",
        "category": "pantry",
        "inStock": false
      },
      {
        "name": "Cumin",
        "quantity": 1,
        "unit": "tsp",
        "category": "spices",
        "inStock": false
      }
    ],
    "sindhi-koki": [
      {
        "name": "Wheat Flour (Atta)",
        "quantity": 200,
        "unit": "g",
        "category": "grains",
        "inStock": false
      },
      {
        "name": "Onions",
        "quantity": 1,
        "unit": "pc",
        "category": "produce",
        "inStock": false
      },
      {
        "name": "Green Chilli",
        "quantity": 2,
        "unit": "pc",
        "category": "produce",
        "inStock": false
      },
      {
        "name": "Coriander",
        "quantity": 10,
        "unit": "g",
        "category": "produce",
        "inStock": false
      },
      {
        "name": "Ghee",
        "quantity": 30,
        "unit": "g",
        "category": "dairy",
        "inStock": false
      }
    ],
    "rugra": [
      {
        "name": "Mushrooms (Rugra)",
        "quantity": 200,
        "unit": "g",
        "category": "produce",
        "inStock": false
      },
      {
        "name": "Onions",
        "quantity": 1,
        "unit": "pc",
        "category": "produce",
        "inStock": false
      },
      {
        "name": "Oil",
        "quantity": 30,
        "unit": "ml",
        "category": "pantry",
        "inStock": false
      }
    ],
    "thenthuk": [
      {
        "name": "Wheat Flour",
        "quantity": 200,
        "unit": "g",
        "category": "grains",
        "inStock": false
      },
      {
        "name": "Cabbage",
        "quantity": 0.5,
        "unit": "cup",
        "category": "produce",
        "inStock": false
      },
      {
        "name": "Carrots",
        "quantity": 0.5,
        "unit": "cup",
        "category": "produce",
        "inStock": false
      },
      {
        "name": "Potatoes",
        "quantity": 1,
        "unit": "pc",
        "category": "produce",
        "inStock": false
      },
      {
        "name": "Oil",
        "quantity": 30,
        "unit": "ml",
        "category": "pantry",
        "inStock": false
      }
    ],
    "chamthong": [
      {
        "name": "Cabbage",
        "quantity": 0.5,
        "unit": "cup",
        "category": "produce",
        "inStock": false
      },
      {
        "name": "Tomatoes",
        "quantity": 1,
        "unit": "pc",
        "category": "produce",
        "inStock": false
      },
      {
        "name": "Potatoes",
        "quantity": 1,
        "unit": "pc",
        "category": "produce",
        "inStock": false
      },
      {
        "name": "Beans",
        "quantity": 0.25,
        "unit": "cup",
        "category": "produce",
        "inStock": false
      },
      {
        "name": "Oil",
        "quantity": 15,
        "unit": "ml",
        "category": "pantry",
        "inStock": false
      }
    ],
    "morok-metpa": [
      {
        "name": "Soybeans",
        "quantity": 0.5,
        "unit": "cup",
        "category": "proteins",
        "inStock": false
      },
      {
        "name": "Red Chilli",
        "quantity": 3,
        "unit": "pc",
        "category": "produce",
        "inStock": false
      },
      {
        "name": "Mustard Oil",
        "quantity": 15,
        "unit": "ml",
        "category": "pantry",
        "inStock": false
      }
    ],
    "singju": [
      {
        "name": "Cabbage",
        "quantity": 0.5,
        "unit": "cup",
        "category": "produce",
        "inStock": false
      },
      {
        "name": "Onions",
        "quantity": 0.5,
        "unit": "pc",
        "category": "produce",
        "inStock": false
      },
      {
        "name": "Cucumber",
        "quantity": 1,
        "unit": "pc",
        "category": "produce",
        "inStock": false
      },
      {
        "name": "Lemon",
        "quantity": 1,
        "unit": "pc",
        "category": "produce",
        "inStock": false
      },
      {
        "name": "Red Chilli",
        "quantity": 2,
        "unit": "pc",
        "category": "produce",
        "inStock": false
      }
    ],
    "paaknam": [
      {
        "name": "Mustard Greens",
        "quantity": 0.5,
        "unit": "cup",
        "category": "produce",
        "inStock": false
      },
      {
        "name": "Rice Flour",
        "quantity": 50,
        "unit": "g",
        "category": "grains",
        "inStock": false
      },
      {
        "name": "Mustard Oil",
        "quantity": 15,
        "unit": "ml",
        "category": "pantry",
        "inStock": false
      }
    ],
    "alu-kangmet": [
      {
        "name": "Potatoes",
        "quantity": 2,
        "unit": "pc",
        "category": "produce",
        "inStock": false
      },
      {
        "name": "Red Chilli",
        "quantity": 2,
        "unit": "pc",
        "category": "produce",
        "inStock": false
      },
      {
        "name": "Mustard Oil",
        "quantity": 15,
        "unit": "ml",
        "category": "pantry",
        "inStock": false
      }
    ],
    "pumaloi": [
      {
        "name": "Rice Flour",
        "quantity": 200,
        "unit": "g",
        "category": "grains",
        "inStock": false
      },
      {
        "name": "Water",
        "quantity": 100,
        "unit": "ml",
        "category": "pantry",
        "inStock": false
      }
    ],
    "pudoh": [
      {
        "name": "Sticky Rice",
        "quantity": 200,
        "unit": "g",
        "category": "grains",
        "inStock": false
      },
      {
        "name": "Water",
        "quantity": 100,
        "unit": "ml",
        "category": "pantry",
        "inStock": false
      }
    ],
    "minil-songa": [
      {
        "name": "Rice",
        "quantity": 100,
        "unit": "g",
        "category": "grains",
        "inStock": false
      },
      {
        "name": "Milk",
        "quantity": 500,
        "unit": "ml",
        "category": "dairy",
        "inStock": false
      },
      {
        "name": "Jaggery",
        "quantity": 50,
        "unit": "g",
        "category": "pantry",
        "inStock": false
      }
    ],
    "pukhlein": [
      {
        "name": "Rice",
        "quantity": 100,
        "unit": "g",
        "category": "grains",
        "inStock": false
      },
      {
        "name": "Sesame Seeds",
        "quantity": 20,
        "unit": "g",
        "category": "spices",
        "inStock": false
      },
      {
        "name": "Jaggery",
        "quantity": 30,
        "unit": "g",
        "category": "pantry",
        "inStock": false
      }
    ],
    "sakin-gata": [
      {
        "name": "Spinach",
        "quantity": 100,
        "unit": "g",
        "category": "produce",
        "inStock": false
      },
      {
        "name": "Onions",
        "quantity": 1,
        "unit": "pc",
        "category": "produce",
        "inStock": false
      },
      {
        "name": "Mustard Oil",
        "quantity": 15,
        "unit": "ml",
        "category": "pantry",
        "inStock": false
      }
    ],
    "kyat": [
      {
        "name": "Tea",
        "quantity": 2,
        "unit": "tbsp",
        "category": "pantry",
        "inStock": false
      },
      {
        "name": "Milk",
        "quantity": 200,
        "unit": "ml",
        "category": "dairy",
        "inStock": false
      },
      {
        "name": "Sugar",
        "quantity": 20,
        "unit": "g",
        "category": "pantry",
        "inStock": false
      }
    ],
    "boiled-vegetables": [
      {
        "name": "Carrots",
        "quantity": 1,
        "unit": "pc",
        "category": "produce",
        "inStock": false
      },
      {
        "name": "Green Beans",
        "quantity": 1,
        "unit": "cup",
        "category": "produce",
        "inStock": false
      },
      {
        "name": "Potatoes",
        "quantity": 1,
        "unit": "pc",
        "category": "produce",
        "inStock": false
      },
      {
        "name": "Cauliflower",
        "quantity": 0.5,
        "unit": "pc",
        "category": "produce",
        "inStock": false
      },
      {
        "name": "Salt",
        "quantity": 1,
        "unit": "tsp",
        "category": "pantry",
        "inStock": false
      }
    ],
    "panch-phoran-tarka": [
      {
        "name": "Panch Phoran",
        "quantity": 1,
        "unit": "tbsp",
        "category": "spices",
        "inStock": false
      },
      {
        "name": "Oil",
        "quantity": 15,
        "unit": "ml",
        "category": "pantry",
        "inStock": false
      },
      {
        "name": "Mixed Vegetables",
        "quantity": 1,
        "unit": "cup",
        "category": "produce",
        "inStock": false
      }
    ],
    "zu": [
      {
        "name": "Sticky Rice",
        "quantity": 200,
        "unit": "g",
        "category": "grains",
        "inStock": false
      },
      {
        "name": "Water",
        "quantity": 200,
        "unit": "ml",
        "category": "pantry",
        "inStock": false
      }
    ],
    "lubrusca-wine": [
      {
        "name": "Grapes",
        "quantity": 500,
        "unit": "g",
        "category": "produce",
        "inStock": false
      },
      {
        "name": "Sugar",
        "quantity": 50,
        "unit": "g",
        "category": "pantry",
        "inStock": false
      }
    ],
    "gundruk": [
      {
        "name": "Gundruk (Fermented Greens)",
        "quantity": 50,
        "unit": "g",
        "category": "pantry",
        "inStock": false
      },
      {
        "name": "Onions",
        "quantity": 1,
        "unit": "pc",
        "category": "produce",
        "inStock": false
      },
      {
        "name": "Tomatoes",
        "quantity": 1,
        "unit": "pc",
        "category": "produce",
        "inStock": false
      },
      {
        "name": "Ginger",
        "quantity": 1,
        "unit": "pc",
        "category": "produce",
        "inStock": false
      }
    ],
    "chang": [
      {
        "name": "Sticky Rice",
        "quantity": 200,
        "unit": "g",
        "category": "grains",
        "inStock": false
      },
      {
        "name": "Water",
        "quantity": 200,
        "unit": "ml",
        "category": "pantry",
        "inStock": false
      }
    ],
    "galho": [
      {
        "name": "Rice",
        "quantity": 100,
        "unit": "g",
        "category": "grains",
        "inStock": false
      },
      {
        "name": "Mixed Vegetables",
        "quantity": 0.5,
        "unit": "cup",
        "category": "produce",
        "inStock": false
      },
      {
        "name": "Onions",
        "quantity": 0.5,
        "unit": "pc",
        "category": "produce",
        "inStock": false
      }
    ],
    "chow-mein": [
      {
        "name": "Noodles",
        "quantity": 200,
        "unit": "g",
        "category": "grains",
        "inStock": false
      },
      {
        "name": "Cabbage",
        "quantity": 0.5,
        "unit": "cup",
        "category": "produce",
        "inStock": false
      },
      {
        "name": "Carrots",
        "quantity": 0.5,
        "unit": "cup",
        "category": "produce",
        "inStock": false
      },
      {
        "name": "Soy Sauce",
        "quantity": 1,
        "unit": "tbsp",
        "category": "pantry",
        "inStock": false
      },
      {
        "name": "Oil",
        "quantity": 30,
        "unit": "ml",
        "category": "pantry",
        "inStock": false
      }
    ],
    "loaded-veggie-nachos": [
      {
        "name": "Nacho Chips",
        "quantity": 100,
        "unit": "g",
        "category": "snacks",
        "inStock": false
      },
      {
        "name": "Cheese",
        "quantity": 50,
        "unit": "g",
        "category": "dairy",
        "inStock": false
      },
      {
        "name": "Onions",
        "quantity": 0.5,
        "unit": "pc",
        "category": "produce",
        "inStock": false
      },
      {
        "name": "Capsicum",
        "quantity": 0.5,
        "unit": "pc",
        "category": "produce",
        "inStock": false
      },
      {
        "name": "Salsa",
        "quantity": 30,
        "unit": "g",
        "category": "pantry",
        "inStock": false
      }
    ],
    "malai-chaap": [
      {
        "name": "Soya Chaap",
        "quantity": 200,
        "unit": "g",
        "category": "proteins",
        "inStock": false
      },
      {
        "name": "Cream",
        "quantity": 50,
        "unit": "ml",
        "category": "dairy",
        "inStock": false
      },
      {
        "name": "Yogurt",
        "quantity": 50,
        "unit": "g",
        "category": "dairy",
        "inStock": false
      },
      {
        "name": "Garam Masala",
        "quantity": 0.5,
        "unit": "tsp",
        "category": "spices",
        "inStock": false
      },
      {
        "name": "Ghee",
        "quantity": 20,
        "unit": "g",
        "category": "dairy",
        "inStock": false
      }
    ]
  },
  "categoryMeta": {
    "produce": {
      "label": "Fresh Stuff",
      "emoji": "🥦"
    },
    "dairy": {
      "label": "Dairy",
      "emoji": "🥛"
    },
    "grains": {
      "label": "Staples",
      "emoji": "🌾"
    },
    "proteins": {
      "label": "Proteins",
      "emoji": "🍗"
    },
    "spices": {
      "label": "Spices",
      "emoji": "🌶️"
    },
    "pantry": {
      "label": "Pantry",
      "emoji": "🫙"
    },
    "breads": {
      "label": "Breads",
      "emoji": "🍞"
    },
    "snacks": {
      "label": "Snacks",
      "emoji": "🍿"
    }
  }
};
