import { DietType, SpiceLevel, MealSlot, User, DayPlan, Meal, Ingredient } from './types';

export const USERS: User[] = [
  { id: 'u1', name: 'Rahul', avatar: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=100&q=80', role: 'admin' },
  { id: 'u2', name: 'Neha', avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=100&q=80', role: 'member', allergies: ['Peanuts'] },
  { id: 'u3', name: 'Aman', avatar: 'https://images.unsplash.com/photo-1599566150163-29194dcaad36?auto=format&fit=crop&w=100&q=80', role: 'member' },
  { id: 'u4', name: 'Priya', avatar: 'https://images.unsplash.com/photo-1580489944761-15a19d654956?auto=format&fit=crop&w=100&q=80', role: 'member' },
];

export const PANTRY_DB: Ingredient[] = [
  { name: 'Tomatoes', quantity: '1 kg', category: 'Vegetables', inStock: true, image: 'https://images.unsplash.com/photo-1592924357228-91a4daadcfea?auto=format&fit=crop&w=100&q=80' },
  { name: 'Onions', quantity: '2 kg', category: 'Vegetables', inStock: true, image: 'https://images.unsplash.com/photo-1508747703703-06f557e71785?auto=format&fit=crop&w=100&q=80' },
  { name: 'Potatoes', quantity: '2 kg', category: 'Vegetables', inStock: true, image: 'https://images.unsplash.com/photo-1518977676601-b53f82aba655?auto=format&fit=crop&w=100&q=80' },
  { name: 'Eggs', quantity: '12', category: 'Protein', inStock: true, image: 'https://images.unsplash.com/photo-1587486913049-53fc88980cfc?auto=format&fit=crop&w=100&q=80' },
  { name: 'Milk', quantity: '1 L', category: 'Dairy', inStock: true, image: 'https://images.unsplash.com/photo-1563636619-e9143da7973b?auto=format&fit=crop&w=100&q=80' },
  { name: 'Paneer', quantity: '500g', category: 'Dairy', inStock: true, image: 'https://images.unsplash.com/photo-1631452180519-c014fe946bc7?auto=format&fit=crop&w=100&q=80' },
  { name: 'Rice', quantity: '5 kg', category: 'Grains', inStock: true, image: 'https://images.unsplash.com/photo-1586201375761-83865001e31c?auto=format&fit=crop&w=100&q=80' },
  { name: 'Atta (Flour)', quantity: '5 kg', category: 'Grains', inStock: true, image: 'https://images.unsplash.com/photo-1627485937980-221c88ac04f9?auto=format&fit=crop&w=100&q=80' },
  { name: 'Chicken', quantity: '1 kg', category: 'Protein', inStock: false, image: 'https://images.unsplash.com/photo-1604503468506-a8da13d82791?auto=format&fit=crop&w=100&q=80' },
  { name: 'Coriander', quantity: '1 bunch', category: 'Vegetables', inStock: true, image: 'https://images.unsplash.com/photo-1589135232619-a1b7dfb11543?auto=format&fit=crop&w=100&q=80' },
  { name: 'Green Chilies', quantity: '100g', category: 'Vegetables', inStock: true, image: 'https://images.unsplash.com/photo-1571152077366-03529b533a1e?auto=format&fit=crop&w=100&q=80' },
];

export const MOCK_MEALS: Meal[] = [
  {
    id: 'm1',
    name: 'Masala Omelette',
    nativeName: 'मसाला ऑमलेट',
    slot: MealSlot.Breakfast,
    time: '8:00 AM',
    prepTime: '7:30 AM',
    members: [USERS[0] as User, USERS[1] as User, USERS[2] as User],
    diet: DietType.Eggitarian,
    spice: SpiceLevel.Medium,
    notes: 'Rahul needs extra onions.',
    image: 'https://images.unsplash.com/photo-1604152135912-04a022e23696?auto=format&fit=crop&w=800&q=80', // Omelette
    status: 'pending',
    ingredients: [
      { name: 'Eggs', quantity: '6', category: 'Protein', inStock: true },
      { name: 'Onions', quantity: '2', category: 'Vegetables', inStock: true },
      { name: 'Tomatoes', quantity: '2', category: 'Vegetables', inStock: false },
    ],
    calories: 320,
    difficulty: 'Easy'
  },
  {
    id: 'm2',
    name: 'Rajma Chawal',
    nativeName: 'राजमा चावल',
    slot: MealSlot.Lunch,
    time: '1:00 PM',
    prepTime: '11:45 AM',
    members: [USERS[0] as User, USERS[1] as User],
    diet: DietType.Veg,
    spice: SpiceLevel.Mild,
    status: 'pending',
    image: 'https://images.unsplash.com/photo-1565557623262-b51c2513a641?auto=format&fit=crop&w=800&q=80', // Indian Curry generic
    ingredients: [
      { name: 'Kidney Beans', quantity: '500g', category: 'Grains', inStock: true },
      { name: 'Rice', quantity: '2 cups', category: 'Grains', inStock: true },
    ],
    calories: 450,
    difficulty: 'Medium'
  },
  {
    id: 'm3',
    name: 'Chicken Salad',
    slot: MealSlot.Lunch,
    time: '1:00 PM',
    prepTime: '12:15 PM',
    members: [USERS[2] as User, USERS[3] as User],
    diet: DietType.NonVeg,
    spice: SpiceLevel.None,
    status: 'pending',
    image: 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?auto=format&fit=crop&w=800&q=80', // Salad
    ingredients: [
      { name: 'Chicken Breast', quantity: '300g', category: 'Protein', inStock: true },
      { name: 'Lettuce', quantity: '1 bunch', category: 'Vegetables', inStock: true },
    ],
    calories: 280,
    difficulty: 'Easy'
  },
  {
    id: 'm4',
    name: 'Paneer Bhurji + Roti',
    nativeName: 'पनीर भुर्जी + रोटी',
    slot: MealSlot.Dinner,
    time: '8:30 PM',
    prepTime: '7:30 PM',
    members: [USERS[0] as User, USERS[1] as User, USERS[2] as User, USERS[3] as User],
    diet: DietType.Veg,
    spice: SpiceLevel.Medium,
    status: 'pending',
    image: 'https://images.unsplash.com/photo-1599487488170-d11ec9c172f0?auto=format&fit=crop&w=800&q=80', // Paneerish dish
    ingredients: [
      { name: 'Paneer', quantity: '400g', category: 'Dairy', inStock: true },
      { name: 'Wheat Flour', quantity: '500g', category: 'Grains', inStock: true },
    ],
    calories: 520,
    difficulty: 'Medium'
  },
  {
    id: 'm5',
    name: 'Weekend Feast (Roommates)',
    slot: MealSlot.Dinner,
    time: '9:00 PM',
    prepTime: '8:00 PM',
    members: [USERS[0] as User, USERS[1] as User, USERS[2] as User, USERS[3] as User], // All 4
    diet: DietType.NonVeg,
    spice: SpiceLevel.High,
    status: 'pending',
    image: 'https://images.unsplash.com/photo-1555939594-58d7cb561ad1?auto=format&fit=crop&w=800&q=80', // BBQ/Feast
    ingredients: [
      { name: 'Chicken Wings', quantity: '2kg', category: 'Protein', inStock: false }, // Needs buying
      { name: 'BBQ Sauce', quantity: '1 bottle', category: 'Other', inStock: false },
    ],
    calories: 850,
    difficulty: 'Hard'
  }
];

export const INITIAL_PLAN: DayPlan[] = [
  { date: '2023-10-24', dayName: 'Thu', meals: [...MOCK_MEALS] },
  { date: '2023-10-25', dayName: 'Fri', meals: MOCK_MEALS.map(m => ({ ...m, id: m.id + '_fri' })) },
  { date: '2023-10-26', dayName: 'Sat', meals: MOCK_MEALS.map(m => ({ ...m, id: m.id + '_sat' })) },
  { date: '2023-10-27', dayName: 'Sun', meals: MOCK_MEALS.map(m => ({ ...m, id: m.id + '_sun' })) },
  { date: '2023-10-28', dayName: 'Mon', meals: MOCK_MEALS.map(m => ({ ...m, id: m.id + '_mon' })) },
  { date: '2023-10-29', dayName: 'Tue', meals: MOCK_MEALS.map(m => ({ ...m, id: m.id + '_tue' })) },
  { date: '2023-10-30', dayName: 'Wed', meals: MOCK_MEALS.map(m => ({ ...m, id: m.id + '_wed' })) },
];

export interface DishEntry {
  name: string;
  cuisine: string; // Legacy broad cuisine (e.g. 'North Indian')
  region?: string; // Atomic region (e.g. 'Punjabi', 'Bengali')
  slots: MealSlot[];
  type?: string;
  image: string;
  calories?: number;
  difficulty?: 'Easy' | 'Medium' | 'Hard';
  prepStyle?: string[]; // e.g. ['Tadka', 'Fry', 'Gravy']
  keyIngredients?: string[]; // e.g. ['Paneer', 'Potato']
  category?: 'Mains' | 'Breads' | 'Rice' | 'Bev' | 'Dessert' | 'Snacks' | 'Sides';
  dishType?: 'Dal' | 'Paneer' | 'Poha' | 'Sabzi' | 'Rice' | 'Breads' | 'Chicken' | 'Snacks' | 'Bev' | 'Dessert' | 'Other'; // Intelligent Filter Key
}

// Configuration for Intelligent Filters
export const DISH_FILTER_TYPES = {
  // Mains
  Dal: { label: 'Dal', styles: ['Tadka', 'Plain', 'Dhaba', 'Handi', 'Bukhara', 'Homestyle'] },
  Paneer: { label: 'Paneer', styles: ['Maharani', 'Hariyali', 'Kadhai', 'Sour', 'Tandoori', 'Smokey'] },
  Poha: { label: 'Poha', styles: ['Kanda', 'Indori', 'Plain', 'Spicy', 'Lemon', 'Dry / Crispy'] },
  Sabzi: { label: 'Vegetables', styles: ['Dry', 'Semi-gravy', 'Gravy', 'Fry', 'Tawa', 'Homestyle', 'Dhaba'] },
  Chicken: { label: 'Chicken', styles: ['Curry', 'Dry', 'Butter', 'Tandoori', 'Fried', 'Roast'] },

  // Staples
  Rice: { label: 'Rice', styles: ['Biryani', 'Pulao', 'Plain', 'Jeera', 'Khichdi', 'Fried'] },
  Breads: { label: 'Breads', styles: ['Roti', 'Paratha', 'Naan', 'Kulcha', 'Poori', 'Bhakri', 'Stuffed'] },

  // Extras
  Bev: { label: 'Drinks', styles: ['Lassi', 'Chaas', 'Juice', 'Shake', 'Tea', 'Coffee', 'Cooler'] },
  Snacks: { label: 'Snacks', styles: ['Fried', 'Steamed', 'Chaat', 'Dry', 'Crispy', 'Healthy'] },
  Dessert: { label: 'Desserts', styles: ['Hot', 'Cold', 'Dry', 'Syrup', 'Barfi', 'Halwa'] }
} as const;

export const ADDON_RULES = {
  SouthIndian: ['Sambhar', 'Coconut Chutney', 'Rasam', 'Tomato Chutney', 'Podi'],
  Snacks: ['Green Chutney', 'Tamarind Chutney', 'Ketchup'],
  Paratha: ['Curd', 'Pickle', 'Butter'],
  Biryani: ['Raita', 'Salan', 'Papad'],
  Meals: ['Papad', 'Pickle', 'Salad', 'Curd']
};

export const DISH_DB: DishEntry[] = [
  // North Indian
  {
    name: 'Aloo Paratha',
    cuisine: 'North Indian',
    region: 'Punjabi',
    slots: [MealSlot.Breakfast, MealSlot.Lunch],
    image: 'https://images.unsplash.com/photo-1626074353765-517a681e40be?w=200&h=200&fit=crop',
    category: 'Breads',
    dishType: 'Breads',
    prepStyle: ['Stuffed', 'Paratha'],
    keyIngredients: ['Potato', 'Wheat']
  },
  {
    name: 'Chole Bhature',
    cuisine: 'North Indian',
    region: 'Punjabi',
    slots: [MealSlot.Breakfast, MealSlot.Lunch],
    image: 'https://images.unsplash.com/photo-1626132647523-66f5bf380027?w=200&h=200&fit=crop',
    category: 'Mains',
    dishType: 'Snacks', // Often treated as heavy snack/breakfast
    prepStyle: ['Fried', 'Gravy'],
    keyIngredients: ['Chickpeas', 'Maida']
  },
  {
    name: 'Dal Makhani',
    cuisine: 'North Indian',
    region: 'Punjabi',
    slots: [MealSlot.Lunch, MealSlot.Dinner],
    image: 'https://images.unsplash.com/photo-1546833999-b9f581a1996d?w=200&h=200&fit=crop',
    category: 'Mains',
    dishType: 'Dal',
    prepStyle: ['Bukhara', 'Homestyle'],
    keyIngredients: ['Black Lentil', 'Butter']
  },
  {
    name: 'Butter Chicken',
    cuisine: 'North Indian',
    region: 'Punjabi',
    slots: [MealSlot.Lunch, MealSlot.Dinner],
    image: 'https://images.unsplash.com/photo-1603894584373-5ac82b2ae398?w=200&h=200&fit=crop',
    category: 'Mains',
    dishType: 'Chicken',
    prepStyle: ['Butter', 'Curry'],
    keyIngredients: ['Chicken', 'Butter', 'Tomato']
  },
  {
    name: 'Rajma Chawal',
    cuisine: 'North Indian',
    region: 'Punjabi',
    slots: [MealSlot.Lunch],
    image: 'https://images.unsplash.com/photo-1585937421612-70a008356fbe?w=200&h=200&fit=crop',
    category: 'Mains',
    dishType: 'Rice',
    prepStyle: ['Homestyle', 'Gravy'],
    keyIngredients: ['Kidney Beans', 'Rice']
  },
  {
    name: 'Paneer Butter Masala',
    cuisine: 'North Indian',
    region: 'Punjabi',
    slots: [MealSlot.Lunch, MealSlot.Dinner],
    image: 'https://images.unsplash.com/photo-1631452180519-c014fe946bc7?w=200&h=200&fit=crop',
    category: 'Mains',
    dishType: 'Paneer',
    prepStyle: ['Maharani', 'Smokey'],
    keyIngredients: ['Paneer', 'Butter', 'Cashew']
  },
  {
    name: 'Puri Bhaji',
    cuisine: 'North Indian',
    region: 'North Indian',
    slots: [MealSlot.Breakfast],
    image: 'https://images.unsplash.com/photo-1601050690597-df0568f70950?w=200&h=200&fit=crop',
    category: 'Mains',
    dishType: 'Sabzi',
    prepStyle: ['Dry', 'Fry'],
    keyIngredients: ['Potato', 'Maida']
  },
  {
    name: 'Kadai Paneer',
    cuisine: 'North Indian',
    region: 'North Indian',
    slots: [MealSlot.Lunch, MealSlot.Dinner],
    image: 'https://images.unsplash.com/photo-1567188040759-fb8a883dc6d8?w=200&h=200&fit=crop',
    category: 'Mains',
    dishType: 'Paneer',
    prepStyle: ['Kadhai', 'Spicy'],
    keyIngredients: ['Paneer', 'Capsicum']
  },
  {
    name: 'Palak Paneer',
    cuisine: 'North Indian',
    region: 'North Indian',
    slots: [MealSlot.Lunch, MealSlot.Dinner],
    image: 'https://images.unsplash.com/photo-1601050690597-df0568f70950?w=200&h=200&fit=crop',
    category: 'Mains',
    dishType: 'Paneer',
    prepStyle: ['Homestyle', 'Sour'],
    keyIngredients: ['Paneer', 'Spinach']
  },
  {
    name: 'Aloo Gobi',
    cuisine: 'North Indian',
    region: 'North Indian',
    slots: [MealSlot.Lunch, MealSlot.Dinner],
    image: 'https://images.unsplash.com/photo-1585937421612-70a008356fbe?w=200&h=200&fit=crop',
    category: 'Mains',
    dishType: 'Sabzi',
    prepStyle: ['Dry', 'Homestyle'],
    keyIngredients: ['Potato', 'Cauliflower']
  },
  {
    name: 'Dal Tadka',
    cuisine: 'North Indian',
    region: 'North Indian',
    slots: [MealSlot.Lunch, MealSlot.Dinner],
    image: 'https://images.unsplash.com/photo-1546833999-b9f581a1996d?w=200&h=200&fit=crop',
    category: 'Mains',
    dishType: 'Dal',
    prepStyle: ['Tadka', 'Dhaba'],
    keyIngredients: ['Lentil']
  },
  {
    name: 'Dal Fry',
    cuisine: 'North Indian',
    region: 'North Indian',
    slots: [MealSlot.Lunch, MealSlot.Dinner],
    image: 'https://images.unsplash.com/photo-1546833999-b9f581a1996d?w=200&h=200&fit=crop',
    category: 'Mains',
    dishType: 'Dal',
    prepStyle: ['Fry', 'Homestyle'],
    keyIngredients: ['Lentil']
  },

  // South Indian
  {
    name: 'Idli Sambar',
    cuisine: 'South Indian',
    region: 'South Indian',
    slots: [MealSlot.Breakfast, MealSlot.Dinner],
    image: 'https://images.unsplash.com/photo-1589301760576-941da4fe24ea?w=200&h=200&fit=crop',
    category: 'Mains',
    dishType: 'Snacks',
    prepStyle: ['Steamed', 'Healthy'],
    keyIngredients: ['Rice', 'Lentil']
  },
  {
    name: 'Masala Dosa',
    cuisine: 'South Indian',
    region: 'South Indian',
    slots: [MealSlot.Breakfast, MealSlot.Dinner],
    image: 'https://images.unsplash.com/photo-1668236543090-82eba5ee5976?w=200&h=200&fit=crop',
    category: 'Mains',
    dishType: 'Snacks',
    prepStyle: ['Crispy', 'Tawa'],
    keyIngredients: ['Rice', 'Potato']
  },
  {
    name: 'Uttapam',
    cuisine: 'South Indian',
    region: 'South Indian',
    slots: [MealSlot.Breakfast],
    image: 'https://images.unsplash.com/photo-1630383249896-424e482df921?w=200&h=200&fit=crop',
    category: 'Mains',
    dishType: 'Snacks',
    prepStyle: ['Tawa', 'Soft'],
    keyIngredients: ['Rice', 'Vegetables']
  },
  {
    name: 'Upma',
    cuisine: 'South Indian',
    region: 'South Indian',
    slots: [MealSlot.Breakfast],
    image: 'https://images.unsplash.com/photo-1606491956689-2ea866880c84?w=200&h=200&fit=crop',
    category: 'Mains',
    dishType: 'Snacks',
    prepStyle: ['Homestyle', 'Savoury'],
    keyIngredients: ['Semolina', 'Vegetables']
  },
  {
    name: 'Curd Rice',
    cuisine: 'South Indian',
    region: 'South Indian',
    slots: [MealSlot.Lunch],
    image: 'https://images.unsplash.com/photo-1596797038530-2c107229654b?w=200&h=200&fit=crop',
    category: 'Mains',
    dishType: 'Rice',
    prepStyle: ['Plain', 'Comfort'],
    keyIngredients: ['Rice', 'Curd']
  },
  {
    name: 'Hyderabadi Biryani',
    cuisine: 'South Indian',
    region: 'Hyderabadi',
    slots: [MealSlot.Lunch, MealSlot.Dinner],
    image: 'https://images.unsplash.com/photo-1563379091339-03b21ab4a4f8?w=200&h=200&fit=crop',
    category: 'Mains',
    dishType: 'Rice',
    prepStyle: ['Biryani', 'Spicy'],
    keyIngredients: ['Rice', 'Spices']
  },
  {
    name: 'Pongal',
    cuisine: 'South Indian',
    region: 'South Indian',
    slots: [MealSlot.Breakfast],
    image: 'https://images.unsplash.com/photo-1645177628172-a94c30a5e2d7?w=200&h=200&fit=crop',
    category: 'Mains',
    dishType: 'Rice',
    prepStyle: ['Savoury', 'Comfort'],
    keyIngredients: ['Rice', 'Lentil', 'Pepper']
  },
  {
    name: 'Medu Vada',
    cuisine: 'South Indian',
    region: 'South Indian',
    slots: [MealSlot.Breakfast, MealSlot.Snacks],
    image: 'https://images.unsplash.com/photo-1626074353765-517a681e40be?w=200&h=200&fit=crop',
    category: 'Snacks',
    dishType: 'Snacks',
    prepStyle: ['Fried', 'Crispy'],
    keyIngredients: ['Lentil']
  },
  {
    name: 'Rava Dosa',
    cuisine: 'South Indian',
    region: 'South Indian',
    slots: [MealSlot.Breakfast, MealSlot.Dinner],
    image: 'https://images.unsplash.com/photo-1668236543090-82eba5ee5976?w=200&h=200&fit=crop',
    category: 'Mains',
    dishType: 'Snacks',
    prepStyle: ['Crispy', 'Instant'],
    keyIngredients: ['Semolina']
  },

  // Maharashtrian
  { name: 'Poha', cuisine: 'Maharashtrian', dishType: 'Poha', prepStyle: ['Kanda', 'Indori'], slots: [MealSlot.Breakfast], image: 'https://images.unsplash.com/photo-1606491956689-2ea866880c84?w=200&h=200&fit=crop' },
  { name: 'Misal Pav', cuisine: 'Maharashtrian', dishType: 'Snacks', prepStyle: ['Spicy'], slots: [MealSlot.Breakfast, MealSlot.Lunch], image: 'https://images.unsplash.com/photo-1601050690597-df0568f70950?w=200&h=200&fit=crop' },
  { name: 'Vada Pav', cuisine: 'Maharashtrian', dishType: 'Snacks', prepStyle: ['Fried'], slots: [MealSlot.Breakfast, MealSlot.Lunch], image: 'https://images.unsplash.com/photo-1626074353765-517a681e40be?w=200&h=200&fit=crop' },
  { name: 'Thalipeeth', cuisine: 'Maharashtrian', dishType: 'Breads', prepStyle: ['Bhakri'], slots: [MealSlot.Breakfast, MealSlot.Dinner], image: 'https://images.unsplash.com/photo-1626074353765-517a681e40be?w=200&h=200&fit=crop' },

  // Gujarati
  { name: 'Dhokla', cuisine: 'Gujarati', dishType: 'Snacks', prepStyle: ['Steamed'], slots: [MealSlot.Breakfast, MealSlot.Lunch], image: 'https://images.unsplash.com/photo-1626074353765-517a681e40be?w=200&h=200&fit=crop' },
  { name: 'Thepla', cuisine: 'Gujarati', dishType: 'Breads', prepStyle: ['Paratha'], slots: [MealSlot.Breakfast, MealSlot.Lunch], image: 'https://images.unsplash.com/photo-1626074353765-517a681e40be?w=200&h=200&fit=crop' },
  { name: 'Khandvi', cuisine: 'Gujarati', dishType: 'Snacks', prepStyle: ['Healthy'], slots: [MealSlot.Breakfast], image: 'https://images.unsplash.com/photo-1626074353765-517a681e40be?w=200&h=200&fit=crop' },

  // Indian Chinese
  { name: 'Hakka Noodles', cuisine: 'Indian Chinese', dishType: 'Snacks', prepStyle: ['Fried'], slots: [MealSlot.Dinner], image: 'https://images.unsplash.com/photo-1585032226651-759b368d7246?w=200&h=200&fit=crop' },
  { name: 'Fried Rice', cuisine: 'Indian Chinese', dishType: 'Rice', prepStyle: ['Fried'], slots: [MealSlot.Lunch, MealSlot.Dinner], image: 'https://images.unsplash.com/photo-1603133872878-684f208fb84b?w=200&h=200&fit=crop' },
  { name: 'Manchurian Gravy', cuisine: 'Indian Chinese', dishType: 'Sabzi', prepStyle: ['Gravy'], slots: [MealSlot.Dinner], image: 'https://images.unsplash.com/photo-1585937421612-70a008356fbe?w=200&h=200&fit=crop' },
  { name: 'Chilli Paneer', cuisine: 'Indian Chinese', dishType: 'Paneer', prepStyle: ['Dry'], slots: [MealSlot.Lunch, MealSlot.Dinner], image: 'https://images.unsplash.com/photo-1631452180519-c014fe946bc7?w=200&h=200&fit=crop' },
];

export const BREAD_DB: DishEntry[] = [
  { name: 'Phulka', cuisine: 'North Indian', dishType: 'Breads', prepStyle: ['Roti'], slots: [MealSlot.Lunch, MealSlot.Dinner], category: 'Breads', image: 'https://images.unsplash.com/photo-1589302168068-964664d93dc0?w=100' },
  { name: 'Wheat Roti', cuisine: 'North Indian', dishType: 'Breads', prepStyle: ['Roti'], slots: [MealSlot.Lunch, MealSlot.Dinner], category: 'Breads', image: 'https://images.unsplash.com/photo-1589302168068-964664d93dc0?w=100' },
  { name: 'Puri', cuisine: 'North Indian', dishType: 'Breads', prepStyle: ['Poori'], slots: [MealSlot.Breakfast, MealSlot.Lunch], category: 'Breads', image: 'https://images.unsplash.com/photo-1589302168068-964664d93dc0?w=100' },
  { name: 'Tandoori Roti', cuisine: 'North Indian', dishType: 'Breads', prepStyle: ['Tandoori'], slots: [MealSlot.Lunch, MealSlot.Dinner], category: 'Breads', image: 'https://images.unsplash.com/photo-1589302168068-964664d93dc0?w=100' },
  { name: 'Butter Naan', cuisine: 'North Indian', dishType: 'Breads', prepStyle: ['Naan'], slots: [MealSlot.Lunch, MealSlot.Dinner], category: 'Breads', image: 'https://images.unsplash.com/photo-1589302168068-964664d93dc0?w=100' },
  { name: 'Garlic Naan', cuisine: 'North Indian', dishType: 'Breads', prepStyle: ['Naan'], slots: [MealSlot.Lunch, MealSlot.Dinner], category: 'Breads', image: 'https://images.unsplash.com/photo-1589302168068-964664d93dc0?w=100' },
  { name: 'Laccha Paratha', cuisine: 'North Indian', dishType: 'Breads', prepStyle: ['Paratha'], slots: [MealSlot.Lunch, MealSlot.Dinner], category: 'Breads', image: 'https://images.unsplash.com/photo-1589302168068-964664d93dc0?w=100' },
  { name: 'Kulcha', cuisine: 'North Indian', dishType: 'Breads', prepStyle: ['Kulcha'], slots: [MealSlot.Lunch, MealSlot.Dinner], category: 'Breads', image: 'https://images.unsplash.com/photo-1589302168068-964664d93dc0?w=100' },
  { name: 'Bhakri', cuisine: 'Maharashtrian', dishType: 'Breads', prepStyle: ['Bhakri'], slots: [MealSlot.Lunch, MealSlot.Dinner], category: 'Breads', image: 'https://images.unsplash.com/photo-1589302168068-964664d93dc0?w=100' },
  { name: 'Thepla', cuisine: 'Gujarati', dishType: 'Breads', prepStyle: ['Paratha'], slots: [MealSlot.Breakfast, MealSlot.Lunch], category: 'Breads', image: 'https://images.unsplash.com/photo-1589302168068-964664d93dc0?w=100' }
];

export const BEVERAGE_DB: DishEntry[] = [
  { name: 'Masala Lassi', cuisine: 'North Indian', dishType: 'Bev', prepStyle: ['Lassi'], slots: [MealSlot.Lunch, MealSlot.Snacks], category: 'Bev', image: 'https://images.unsplash.com/photo-1589302168068-964664d93dc0?w=100' },
  { name: 'Sweet Lassi', cuisine: 'North Indian', dishType: 'Bev', prepStyle: ['Lassi'], slots: [MealSlot.Lunch, MealSlot.Snacks], category: 'Bev', image: 'https://images.unsplash.com/photo-1589302168068-964664d93dc0?w=100' },
  { name: 'Buttermilk (Chaas)', cuisine: 'Indian', dishType: 'Bev', prepStyle: ['Chaas'], slots: [MealSlot.Lunch], category: 'Bev', image: 'https://images.unsplash.com/photo-1589302168068-964664d93dc0?w=100' },
  { name: 'Nimbu Pani', cuisine: 'Indian', dishType: 'Bev', prepStyle: ['Cooler'], slots: [MealSlot.Lunch, MealSlot.Snacks], category: 'Bev', image: 'https://images.unsplash.com/photo-1589302168068-964664d93dc0?w=100' },
  { name: 'Masala Tea', cuisine: 'Indian', dishType: 'Bev', prepStyle: ['Tea'], slots: [MealSlot.Breakfast, MealSlot.Snacks], category: 'Bev', image: 'https://images.unsplash.com/photo-1589302168068-964664d93dc0?w=100' },
  { name: 'Filter Coffee', cuisine: 'South Indian', dishType: 'Bev', prepStyle: ['Coffee'], slots: [MealSlot.Breakfast, MealSlot.Snacks], category: 'Bev', image: 'https://images.unsplash.com/photo-1589302168068-964664d93dc0?w=100' },
];

export const DESSERT_DB: DishEntry[] = [
  { name: 'Gulab Jamun', cuisine: 'Indian', dishType: 'Dessert', prepStyle: ['Hot'], slots: [MealSlot.Lunch, MealSlot.Dinner], category: 'Dessert', image: 'https://images.unsplash.com/photo-1589302168068-964664d93dc0?w=100' },
  { name: 'Gajar Halwa', cuisine: 'North Indian', dishType: 'Dessert', prepStyle: ['Halwa'], slots: [MealSlot.Lunch, MealSlot.Dinner], category: 'Dessert', image: 'https://images.unsplash.com/photo-1589302168068-964664d93dc0?w=100' },
  { name: 'Rasmalai', cuisine: 'Bengali', dishType: 'Dessert', prepStyle: ['Cold'], slots: [MealSlot.Lunch, MealSlot.Dinner], category: 'Dessert', image: 'https://images.unsplash.com/photo-1589302168068-964664d93dc0?w=100' },
  { name: 'Kheer', cuisine: 'Indian', dishType: 'Dessert', prepStyle: ['Cold'], slots: [MealSlot.Lunch, MealSlot.Dinner], category: 'Dessert', image: 'https://images.unsplash.com/photo-1589302168068-964664d93dc0?w=100' },
  { name: 'Jalebi', cuisine: 'Indian', dishType: 'Dessert', prepStyle: ['Hot'], slots: [MealSlot.Breakfast, MealSlot.Dinner], category: 'Dessert', image: 'https://images.unsplash.com/photo-1589302168068-964664d93dc0?w=100' },
  { name: 'Rasgulla', cuisine: 'Bengali', dishType: 'Dessert', prepStyle: ['Cold'], slots: [MealSlot.Lunch, MealSlot.Dinner], category: 'Dessert', image: 'https://images.unsplash.com/photo-1589302168068-964664d93dc0?w=100' }
];

export const ALL_DISHES = [...DISH_DB, ...BREAD_DB, ...BEVERAGE_DB, ...DESSERT_DB];

// ===== SEASONAL FOODS =====
export const SEASONAL_FOODS = {
  spring: [
    { name: 'Asparagus', region: 'North Indian', healthBenefit: 'Diuretic, high in antioxidants', dishes: ['Spring Salads', 'Vegetable Curry'] },
    { name: 'Green Peas', region: 'Pan-Indian', healthBenefit: 'High in protein and fiber', dishes: ['Mutter Paneer', 'Peas Biryani'] },
    { name: 'Strawberries', region: 'Himalayan', healthBenefit: 'Vitamin C rich', dishes: ['Strawberry Desserts'] },
  ],
  summer: [
    { name: 'Mango', region: 'Pan-Indian', healthBenefit: 'Energy boost, vitamin A', dishes: ['Mango Lassi', 'Aam Ras', 'Mango Shake'] },
    { name: 'Bottle Gourd (Lauki)', region: 'North Indian', healthBenefit: 'Cooling, aids digestion', dishes: ['Lauki Sabzi', 'Lauki Kheer'] },
    { name: 'Cucumber', region: 'Pan-Indian', healthBenefit: 'Hydrating, cooling', dishes: ['Cucumber Salad', 'Cucumber Raita'] },
    { name: 'Pointed Gourd (Parwal)', region: 'Bengali', healthBenefit: 'Low in calories', dishes: ['Parwal Fry', 'Parwal Curry'] },
  ],
  monsoon: [
    { name: 'Spinach (Palak)', region: 'North Indian', healthBenefit: 'Iron rich', dishes: ['Palak Paneer', 'Palak Soup'] },
    { name: 'Bitter Gourd (Karela)', region: 'Pan-Indian', healthBenefit: 'Blood sugar control', dishes: ['Karela Fry', 'Karela Chips'] },
    { name: 'Moong Sprouts', region: 'Pan-Indian', healthBenefit: 'High protein', dishes: ['Sprout Salad', 'Moong Chaat'] },
    { name: 'Mushrooms', region: 'North Indian', healthBenefit: 'Immune boost', dishes: ['Mushroom Curry', 'Mushroom Do Pyaza'] },
  ],
  winter: [
    { name: 'Carrot (Gajar)', region: 'North Indian', healthBenefit: 'Vitamin A, eyesight', dishes: ['Gajar Halwa', 'Gajar Mutter', 'Carrot Soup'] },
    { name: 'Cauliflower (Gobi)', region: 'North Indian', healthBenefit: 'Low carb, vitamin C', dishes: ['Gobi Manchurian', 'Gobi Fry'] },
    { name: 'Radish (Mooli)', region: 'North Indian', healthBenefit: 'Digestive aid', dishes: ['Mooli Paratha', 'Mooli Salad'] },
    { name: 'Bell Peppers', region: 'Pan-Indian', healthBenefit: 'Vitamin C rich', dishes: ['Pepper Curry', 'Pepper Sabzi'] },
  ],
  'year-round': [
    { name: 'Tomato', region: 'Pan-Indian', healthBenefit: 'Lycopene antioxidant', dishes: ['All curries'] },
    { name: 'Onion', region: 'Pan-Indian', healthBenefit: 'Immunity booster', dishes: ['All curries'] },
    { name: 'Garlic', region: 'Pan-Indian', healthBenefit: 'Antibacterial', dishes: ['All curries'] },
  ]
};

// ===== BREAD VARIANTS =====
import { BreadVariant, ProteinVariant } from './types';

export const BREAD_VARIANTS: BreadVariant[] = [
  { id: 'plain-roti', name: 'Plain Roti', caloriesDelta: 0 },
  { id: 'multigrain-roti', name: 'Multigrain Roti', caloriesDelta: 5 },
  { id: 'butter-roti', name: 'Butter Roti', caloriesDelta: 30 },
  { id: 'naan', name: 'Naan', caloriesDelta: 50 },
  { id: 'paratha', name: 'Paratha', caloriesDelta: 80 },
  { id: 'rice', name: 'White Rice', caloriesDelta: 20 },
];

// ===== PROTEIN VARIANTS =====
export const PROTEIN_VARIANTS: ProteinVariant[] = [
  { id: 'paneer', name: 'Paneer', proteinGrams: 25, caloriesDelta: 0 },
  { id: 'tofu', name: 'Tofu', proteinGrams: 17, caloriesDelta: -20 },
  { id: 'eggs', name: 'Eggs', proteinGrams: 18, caloriesDelta: 10 },
  { id: 'chicken', name: 'Chicken', proteinGrams: 35, caloriesDelta: 15 },
  { id: 'fish', name: 'Fish', proteinGrams: 30, caloriesDelta: 5 },
  { id: 'moong-dal', name: 'Moong Dal', proteinGrams: 25, caloriesDelta: -10 },
  { id: 'chana-dal', name: 'Chana Dal', proteinGrams: 24, caloriesDelta: -5 },
  { id: 'rajma', name: 'Rajma (Kidney Beans)', proteinGrams: 15, caloriesDelta: -15 },
];

// ===== MEAL SEARCH TEMPLATES =====
export const MEAL_SEARCH_TEMPLATES = [
  { query: 'High protein breakfast', intent: 'protein' as const, slot: MealSlot.Breakfast },
  { query: 'Light dinner under 500 cal', intent: 'light' as const, slot: MealSlot.Dinner, maxCalories: 500 },
  { query: 'Dal + roti combo', intent: 'combo' as const, ingredients: ['dal', 'roti'] },
  { query: 'Quick snack in 10 mins', intent: 'quick' as const, maxPrepTime: 10, slot: MealSlot.Snacks },
  { query: 'Comfort food lunch', intent: 'comfort' as const, slot: MealSlot.Lunch },
  { query: 'Healthy salad', intent: 'healthy' as const, tags: ['salad', 'fresh'] },
];

// ===== ONBOARDING STEPS =====
import { OnboardingStep } from './types';

export const ONBOARDING_STEPS: OnboardingStep[] = [
  {
    id: 'welcome',
    title: 'Welcome to MealDrama',
    description: 'Let\'s personalize your meal experience',
    type: 'welcome',
    required: true,
  },
  {
    id: 'diet-preference',
    title: 'What\'s your diet preference?',
    description: 'Choose what you prefer to eat',
    type: 'single-select',
    options: [
      { id: 'veg', label: 'Vegetarian', icon: '🥬', desc: 'Plant-based meals only' },
      { id: 'eggitarian', label: 'Eggitarian', icon: '🥚', desc: 'Vegetarian + eggs' },
      { id: 'non-veg', label: 'Non-Vegetarian', icon: '🍗', desc: 'All meats welcome' },
      { id: 'vegan', label: 'Vegan', icon: '🌱', desc: 'No animal products' },
    ],
    required: true,
  },
  {
    id: 'meal-slots',
    title: 'Which meals do you want?',
    description: 'Select the meal slots you want to plan',
    type: 'multi-select',
    options: [
      { id: 'breakfast', label: 'Breakfast', icon: '🌅', desc: 'Morning meals' },
      { id: 'lunch', label: 'Lunch', icon: '☀️', desc: 'Midday meals' },
      { id: 'dinner', label: 'Dinner', icon: '🌙', desc: 'Evening meals' },
      { id: 'snacks', label: 'Snacks', icon: '🍪', desc: 'Quick bites' },
    ],
    required: true,
  },
  {
    id: 'beverages-sides',
    title: 'Beverages & Sides',
    description: 'What do you like with your meals?',
    type: 'multi-select',
    options: [
      { id: 'milk-tea', label: 'Milk/Tea with Breakfast', icon: '☕', desc: 'Hot beverages' },
      { id: 'curd-lunch', label: 'Curd with Lunch', icon: '🥛', desc: 'Cooling yogurt' },
      { id: 'lassi', label: 'Lassi', icon: '🥤', desc: 'Sweet yogurt drink' },
      { id: 'buttermilk', label: 'Buttermilk', icon: '🥛', desc: 'Spiced yogurt drink' },
      { id: 'pickle', label: 'Pickle', icon: '🥒', desc: 'Spicy accompaniment' },
      { id: 'salad', label: 'Salad', icon: '🥗', desc: 'Fresh vegetables' },
      { id: 'papad', label: 'Papad', icon: '🥨', desc: 'Crispy lentil crackers' },
    ],
    required: false,
  },
  {
    id: 'spice-level',
    title: 'How spicy do you like it?',
    description: 'We\'ll adjust recipes to your spice preference',
    type: 'single-select',
    options: [
      { id: 'none', label: 'No Spice', icon: '😊', desc: 'Mild & gentle flavors' },
      { id: 'mild', label: 'Mild', icon: '🌶️', desc: 'Light spice kick' },
      { id: 'medium', label: 'Medium', icon: '🌶️🌶️', desc: 'Good spice level' },
      { id: 'high', label: 'Spicy', icon: '🌶️🌶️🌶️', desc: 'Extra heat please' },
    ],
    required: true,
  },
  {
    id: 'allergies',
    title: 'Any allergies or restrictions?',
    description: 'We\'ll avoid these in your meal suggestions',
    type: 'multi-select',
    options: [
      { id: 'nuts', label: 'Nuts', icon: '🥜' },
      { id: 'dairy', label: 'Dairy', icon: '🥛' },
      { id: 'gluten', label: 'Gluten', icon: '🌾' },
      { id: 'shellfish', label: 'Shellfish', icon: '🦐' },
      { id: 'soy', label: 'Soy', icon: '🫘' },
      { id: 'eggs', label: 'Eggs', icon: '🥚' },
    ],
    required: false,
  },
  {
    id: 'region',
    title: 'Regional cuisine preference',
    description: 'Which regional flavors do you enjoy?',
    type: 'single-select',
    options: [
      { id: 'North Indian', label: 'North Indian', icon: '🍛', desc: 'Rich curries & breads' },
      { id: 'South Indian', label: 'South Indian', icon: '🍳', desc: 'Rice, dosa & coconut' },
      { id: 'Maharashtrian', label: 'Maharashtrian', icon: '🥘', desc: 'Spicy coastal flavors' },
      { id: 'Gujarati', label: 'Gujarati', icon: '🍲', desc: 'Sweet & savory balance' },
      { id: 'Bengali', label: 'Bengali', icon: '🐟', desc: 'Fish & sweets' },
      { id: 'Punjabi', label: 'Punjabi', icon: '🥞', desc: 'Rich & hearty' },
    ],
    required: true,
  },
  {
    id: 'health-goals',
    title: 'Any health goals?',
    description: 'Select all that apply — we\'ll tailor suggestions',
    type: 'multi-select',
    options: [
      { id: 'balanced', label: 'Balanced Diet', icon: '⚖️', desc: 'Healthy eating plate' },
      { id: 'high-protein', label: 'High Protein', icon: '🥩', desc: 'Build & maintain muscle' },
      { id: 'high-fiber', label: 'High Fiber', icon: '🌾', desc: 'Digestive health' },
      { id: 'low-carb', label: 'Low Carb', icon: '🥗', desc: 'Reduce refined carbs' },
      { id: 'low-fat', label: 'Low Fat', icon: '🫒', desc: 'Reduce fatty foods' },
      { id: 'low-sodium', label: 'Low Sodium', icon: '🧂', desc: 'Heart-healthy eating' },
      { id: 'low-sugar', label: 'Low Sugar', icon: '🍬', desc: 'Cut added sugars' },
      { id: 'weight-loss', label: 'Weight Loss', icon: '🏋️', desc: 'Calorie-conscious' },
      { id: 'heart-healthy', label: 'Heart Healthy', icon: '❤️', desc: 'Heart-friendly choices' },
      { id: 'diabetes-friendly', label: 'Diabetes Friendly', icon: '🩸', desc: 'Blood sugar control' },
    ],
    required: false,
  },
  {
    id: 'cook-contact',
    title: 'Cook contact (optional)',
    description: 'Share cook\'s WhatsApp for notifications',
    type: 'text-input',
    required: false,
  },
  {
    id: 'confirmation',
    title: 'You\'re all set!',
    description: 'Your personalized meal experience awaits',
    type: 'confirmation',
    required: true,
  },
];