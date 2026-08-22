function dayGroup(key: string): string[] {
  const GROUPS: Record<string, string[][]> = {
  oil: [
    ['Mustard Oil', 'Olive Oil', 'Sunflower Oil'],
    ['Coconut Oil', 'Sesame Oil', 'Ghee'],
    ['Rice Bran Oil', 'Groundnut Oil', 'Avocado Oil'],
    ['Mustard Oil', 'Olive Oil', 'Sesame Oil'],
    ['Ghee', 'Coconut Oil', 'Sunflower Oil'],
    ['Avocado Oil', 'Walnut Oil', 'Flaxseed Oil'],
    ['Mustard Oil', 'Olive Oil', 'Coconut Oil'],
  ],
  beverage: [
    ['Chaas', 'Green Tea', 'Lemon Water', 'Coconut Water'],
    ['Buttermilk', 'Herbal Tea', 'Cinnamon Water'],
    ['Coconut Water', 'Chaas', 'Mint Water'],
    ['Green Tea', 'Lemon Water', 'Jeera Water'],
    ['Chaas', 'Coconut Water', 'Ginger Tea'],
    ['Herbal Tea', 'Buttermilk', 'Lemon Water'],
    ['Green Tea', 'Coconut Water', 'Chaas'],
  ],
  dryFruit: [
    ['Almonds', 'Walnuts', 'Raisins'],
    ['Cashews', 'Pistachios', 'Dried Apricots'],
    ['Almonds', 'Dates', 'Walnuts'],
    ['Mixed Nuts', 'Raisins', 'Dried Figs'],
    ['Walnuts', 'Cashews', 'Dried Cranberries'],
    ['Almonds', 'Pistachios', 'Dates'],
    ['Mixed Dry Fruits', 'Walnuts', 'Raisins'],
  ],
  seed: [
    ['Flax Seeds', 'Chia Seeds', 'Pumpkin Seeds'],
    ['Sesame Seeds', 'Sunflower Seeds', 'Melon Seeds'],
    ['Chia Seeds', 'Flax Seeds', 'Hemp Seeds'],
    ['Pumpkin Seeds', 'Sesame Seeds', 'Flax Seeds'],
    ['Sunflower Seeds', 'Chia Seeds', 'Poppy Seeds'],
    ['Flax Seeds', 'Sesame Seeds', 'Pumpkin Seeds'],
    ['Chia Seeds', 'Sunflower Seeds', 'Flax Seeds'],
  ],
  fruit: [
    ['Bananas', 'Apples', 'Seasonal Fruits'],
    ['Oranges', 'Pomegranate', 'Papaya'],
    ['Seasonal Fruits', 'Bananas', 'Apple'],
    ['Grapes', 'Seasonal Fruits', 'Mosambi'],
    ['Apple', 'Orange', 'Seasonal Fruits'],
    ['Pomegranate', 'Banana', 'Seasonal Fruits'],
    ['Seasonal Fruits', 'Grapes', 'Apple'],
  ],
  vegetable: [
    ['Mixed Salad Greens', 'Cucumber', 'Tomato'],
    ['Palak', 'Broccoli', 'Zucchini'],
    ['Mixed Vegetables', 'Salad', 'Capsicum'],
    ['Grated Carrot', 'Beetroot', 'Cabbage'],
    ['Lauki', 'Tori', 'Pumpkin'],
    ['Baingan', 'Bhindi', 'Cauliflower'],
    ['Salad Greens', 'Carrot', 'Cucumber'],
  ],
  yogurt: [
    ['Curd', 'Greek Yogurt', 'Buttermilk'],
    ['Hung Curd', 'Probiotic Yogurt', 'Chaas'],
    ['Curd', 'Buttermilk', 'Greek Yogurt'],
    ['Probiotic Yogurt', 'Curd', 'Lassi'],
    ['Greek Yogurt', 'Curd', 'Buttermilk'],
    ['Curd', 'Probiotic Yogurt', 'Chaas'],
    ['Buttermilk', 'Greek Yogurt', 'Curd'],
  ],
  sprout: [
    ['Mixed Sprouts', 'Moong Sprouts', 'Chana Sprouts'],
    ['Moong Sprouts', 'Matki Sprouts', 'Mixed Sprouts'],
    ['Chana Sprouts', 'Mixed Sprouts', 'Moong Sprouts'],
    ['Mixed Sprouts', 'Moth Bean Sprouts', 'Chana Sprouts'],
    ['Moong Sprouts', 'Mixed Sprouts', 'Matki Sprouts'],
    ['Chana Sprouts', 'Moth Bean Sprouts', 'Mixed Sprouts'],
    ['Mixed Sprouts', 'Moong Sprouts', 'Matki Sprouts'],
  ],
  proteinPantry: [
    ['Moong Dal', 'Masoor Dal', 'Chana Dal'],
    ['Soya Chunks', 'Toor Dal', 'Rajma'],
    ['Chickpeas', 'Black Beans', 'Mixed Dal'],
    ['Paneer', 'Urad Dal', 'Moong Dal'],
    ['Green Peas', 'Chana Dal', 'Masoor Dal'],
    ['Chole', 'Kabuli Chana', 'Toor Dal'],
    ['Mixed Dal', 'Rajma', 'Chana Dal'],
  ],
};
  const dow = new Date().getDay();
  const group = GROUPS[key];
  return group?.[dow % group.length] ?? group?.[0] ?? [];
}

export function classifySuggestion(text: string): {
  actionType: 'add-dish' | 'add-to-pantry';
  dishCategories?: string[];
  pantryItems?: string[];
  preferredSlots?: string[];
} {
  const lower = text.toLowerCase();

  if (lower.includes('oil') || lower.includes('mustard') || lower.includes('olive') || lower.includes('sunflower') || lower.includes('ghee') || lower.includes('coconut oil'))
    return { actionType: 'add-to-pantry', pantryItems: dayGroup('oil') };

  if (lower.includes('dry fruit') || lower.includes('nut') || lower.includes('almond') || lower.includes('walnut') || lower.includes('cashew') || lower.includes('raisin') || lower.includes('date'))
    return { actionType: 'add-to-pantry', pantryItems: dayGroup('dryFruit') };

  if (lower.includes('seed') || lower.includes('flax') || lower.includes('chia') || lower.includes('pumpkin') || lower.includes('sesame') || lower.includes('sunflower seed'))
    return { actionType: 'add-to-pantry', pantryItems: dayGroup('seed') };

  if (lower.includes('fruit') || lower.includes('apple') || lower.includes('banana') || lower.includes('berry') || lower.includes('seasonal fruit'))
    return { actionType: 'add-to-pantry', pantryItems: dayGroup('fruit') };

  if (lower.includes('sprout') || lower.includes('sprouted'))
    return { actionType: 'add-to-pantry', pantryItems: dayGroup('sprout') };

  if (lower.includes('yogurt') || lower.includes('curd') || lower.includes('dahi') || lower.includes('probiotic'))
    return { actionType: 'add-to-pantry', pantryItems: dayGroup('yogurt') };

  if (lower.includes('sugary') || lower.includes('drink') || lower.includes('water') || lower.includes('chaas') || lower.includes('unsweetened') || lower.includes('beverage'))
    return { actionType: 'add-to-pantry', pantryItems: dayGroup('beverage') };

  if (lower.includes('vegetable') || lower.includes('salad') || lower.includes('produce') || lower.includes('veggie') || lower.includes('greens'))
    return { actionType: 'add-to-pantry', pantryItems: dayGroup('vegetable') };

  if (lower.includes('dal') || lower.includes('lentil') || lower.includes('protein pantry') || lower.includes('pantry protein'))
    return { actionType: 'add-to-pantry', pantryItems: dayGroup('proteinPantry') };

  if (lower.includes('protein') || lower.includes('paneer') || lower.includes('legume') || lower.includes('beans'))
    return { actionType: 'add-dish', dishCategories: ['lean-protein', 'legume'], preferredSlots: ['lunch', 'dinner'] };

  if (lower.includes('rice') || lower.includes('roti') || lower.includes('whole grain') || lower.includes('brown rice') || lower.includes('whole wheat'))
    return { actionType: 'add-dish', dishCategories: ['whole-grain'], preferredSlots: ['breakfast', 'lunch', 'dinner'] };

  if (lower.includes('red meat') || lower.includes('poultry') || lower.includes('fish') || lower.includes('plant protein') || lower.includes('swap red meat'))
    return { actionType: 'add-dish', dishCategories: ['lean-protein', 'legume'], preferredSlots: ['lunch', 'dinner'] };

  if (lower.includes('dessert') || lower.includes('sweet'))
    return { actionType: 'add-dish', dishCategories: [], preferredSlots: ['dinner'] };

  if (lower.includes('complete your plate') || lower.includes('add missing components') || lower.includes('add missing'))
    return { actionType: 'add-dish', dishCategories: [], preferredSlots: ['lunch', 'dinner'] };

  return { actionType: 'add-dish' };
}
