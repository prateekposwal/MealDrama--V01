import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

const SEED_DISHES: Array<{
  id: string;
  name: string;
  icon: string;
  region: string;
  category: string[];
  type: string;
  tags: string[];
  variants: Array<{
    id: string;
    name: string;
    cookingStyle?: string;
    addOn?: string;
    mealContext?: string;
    regionOverride?: string;
    baseStyle?: string;
    accompaniments?: string[];
  }>;
}> = [
  {
    id: 'aloo-paratha', name: 'Aloo Paratha', icon: '🫓', region: 'north',
    category: ['breakfast'], type: 'veg', tags: ['fried', 'flatbread'],
    variants: [
      { id: 'aloo-paratha-plain', name: 'Aloo Paratha Plain', cookingStyle: 'Plain' },
      { id: 'aloo-paratha-crispy', name: 'Aloo Paratha Crispy', cookingStyle: 'Crispy' },
      { id: 'aloo-paratha-stuffed', name: 'Aloo Paratha Stuffed', cookingStyle: 'Stuffed' },
      { id: 'aloo-paratha-curd', name: 'Aloo Paratha + Curd', addOn: 'with curd', mealContext: 'breakfast' },
      { id: 'aloo-paratha-butter', name: 'Aloo Paratha + Butter', addOn: 'with butter', mealContext: 'breakfast' },
    ],
  },
  {
    id: 'bedmi-puri', name: 'Bedmi Puri + Aloo', icon: '🍛', region: 'north',
    category: ['breakfast'], type: 'veg', tags: ['fried', 'street food'],
    variants: [
      { id: 'bedmi-puri-rice', name: 'Bedmi Puri + Rice', addOn: 'with rice', mealContext: 'lunch' },
      { id: 'bedmi-puri-roti', name: 'Bedmi Puri + Roti', addOn: 'with roti', mealContext: 'dinner' },
      { id: 'bedmi-puri-bowl', name: 'Bedmi Puri Bowl', addOn: 'standalone', mealContext: 'lunch' },
      { id: 'bedmi-puri-lite', name: 'Bedmi Puri Lite (Dinner)', addOn: 'light portion', mealContext: 'dinner' },
      { id: 'bedmi-puri-thali', name: 'Bedmi Puri Thali', addOn: 'thali set', mealContext: 'lunch' },
    ],
  },
  {
    id: 'rajma-chawal', name: 'Rajma Chawal', icon: '🥘', region: 'north',
    category: ['lunch', 'dinner'], type: 'veg', tags: ['gravy', 'comfort food'],
    variants: [
      { id: 'rajma-rice', name: 'Rajma + Rice', addOn: 'with rice', mealContext: 'lunch' },
      { id: 'rajma-roti', name: 'Rajma + Roti', addOn: 'with roti', mealContext: 'dinner' },
      { id: 'rajma-bowl', name: 'Rajma Bowl', addOn: 'standalone', mealContext: 'lunch' },
      { id: 'rajma-lite', name: 'Rajma Lite (Dinner)', addOn: 'light portion', mealContext: 'dinner' },
      { id: 'rajma-thali', name: 'Rajma Thali', addOn: 'thali set', mealContext: 'lunch' },
      { id: 'rajma-masala', name: 'Rajma Masala', cookingStyle: 'Masala' },
      { id: 'rajma-tadka', name: 'Rajma Tadka', cookingStyle: 'Tadka' },
      { id: 'rajma-dry', name: 'Rajma Dry', cookingStyle: 'Dry' },
    ],
  },
  {
    id: 'chole-bhature', name: 'Chole Bhature', icon: '🍛', region: 'north',
    category: ['breakfast', 'lunch'], type: 'veg', tags: ['fried', 'street food', 'popular'],
    variants: [
      { id: 'chole-rice', name: 'Chole + Rice', addOn: 'with rice', mealContext: 'lunch' },
      { id: 'chole-roti', name: 'Chole + Roti', addOn: 'with roti', mealContext: 'dinner' },
      { id: 'chole-bowl', name: 'Chole Bowl', addOn: 'standalone', mealContext: 'lunch' },
      { id: 'chole-lite', name: 'Chole Lite (Dinner)', addOn: 'light portion', mealContext: 'dinner' },
      { id: 'chole-thali', name: 'Chole Thali', addOn: 'thali set', mealContext: 'lunch' },
    ],
  },
  {
    id: 'dal-makhani', name: 'Dal Makhani', icon: '🥣', region: 'north',
    category: ['lunch', 'dinner'], type: 'veg', tags: ['slow-cooked', 'restaurant style'],
    variants: [
      { id: 'dal-makhani-tadka', name: 'Dal Makhani Tadka', cookingStyle: 'Tadka' },
      { id: 'dal-makhani-dhaba', name: 'Dal Makhani Dhaba Style', cookingStyle: 'Dhaba Style' },
      { id: 'dal-makhani-lite', name: 'Dal Makhani Lite', cookingStyle: 'Lite' },
      { id: 'dam-ao-rice', name: 'Dal Makhani + Rice', addOn: 'with rice', mealContext: 'lunch' },
      { id: 'dam-ao-roti', name: 'Dal Makhani + Roti', addOn: 'with roti', mealContext: 'dinner' },
      { id: 'dam-ao-bowl', name: 'Dal Makhani Bowl', addOn: 'standalone', mealContext: 'lunch' },
      { id: 'dam-ao-lite', name: 'Dal Makhani Lite (Dinner)', addOn: 'light portion', mealContext: 'dinner' },
      { id: 'dam-ao-thali', name: 'Dal Makhani Thali', addOn: 'thali set', mealContext: 'lunch' },
    ],
  },
  {
    id: 'kadhi-pakora', name: 'Kadhi Pakora', icon: '🥘', region: 'north',
    category: ['lunch', 'dinner'], type: 'veg', tags: ['fermented', 'comfort food'],
    variants: [
      { id: 'kadhi-pakora-rice', name: 'Kadhi Pakora + Rice', addOn: 'with rice', mealContext: 'lunch' },
      { id: 'kadhi-pakora-roti', name: 'Kadhi Pakora + Roti', addOn: 'with roti', mealContext: 'dinner' },
      { id: 'kadhi-pakora-bowl', name: 'Kadhi Pakora Bowl', addOn: 'standalone', mealContext: 'lunch' },
      { id: 'kadhi-pakora-lite', name: 'Kadhi Pakora Lite (Dinner)', addOn: 'light portion', mealContext: 'dinner' },
      { id: 'kadhi-pakora-thali', name: 'Kadhi Pakora Thali', addOn: 'thali set', mealContext: 'lunch' },
    ],
  },
  {
    id: 'rogan-josh', name: 'Rogan Josh', icon: '🍖', region: 'north',
    category: ['lunch', 'dinner'], type: 'non-veg', tags: ['mutton', 'slow-cooked', 'aromatic'],
    variants: [
      { id: 'rogan-josh-traditional', name: 'Rogan Josh Traditional', cookingStyle: 'Traditional' },
      { id: 'rogan-josh-lite', name: 'Rogan Josh Lite', cookingStyle: 'Lite' },
      { id: 'rogan-josh-dhaba', name: 'Rogan Josh Dhaba', cookingStyle: 'Dhaba' },
      { id: 'rogan-ao-rice', name: 'Rogan Josh + Rice', addOn: 'with rice', mealContext: 'lunch' },
      { id: 'rogan-ao-roti', name: 'Rogan Josh + Roti', addOn: 'with roti', mealContext: 'dinner' },
      { id: 'rogan-ao-bowl', name: 'Rogan Josh Bowl', addOn: 'standalone', mealContext: 'lunch' },
      { id: 'rogan-ao-lite', name: 'Rogan Josh Lite (Dinner)', addOn: 'light portion', mealContext: 'dinner' },
      { id: 'rogan-ao-thali', name: 'Rogan Josh Thali', addOn: 'thali set', mealContext: 'lunch' },
    ],
  },
  {
    id: 'samosa', name: 'Samosa', icon: '🔺', region: 'north',
    category: ['snacks'], type: 'veg', tags: ['fried', 'street food'],
    variants: [
      { id: 'samosa-aloo', name: 'Samosa Aloo', cookingStyle: 'Aloo' },
      { id: 'samosa-paneer', name: 'Samosa Paneer', cookingStyle: 'Paneer' },
      { id: 'samosa-moong-dal', name: 'Samosa Moong Dal', cookingStyle: 'Moong Dal' },
      { id: 'samosa-mini', name: 'Samosa Mini', cookingStyle: 'Mini' },
    ],
  },
  {
    id: 'butter-chicken', name: 'Butter Chicken', icon: '🍗', region: 'north',
    category: ['lunch', 'dinner'], type: 'non-veg', tags: ['chicken', 'gravy', 'creamy'],
    variants: [
      { id: 'butter-chicken-naan', name: 'Butter Chicken with Naan', mealContext: 'dinner' },
      { id: 'butter-chicken-rice', name: 'Butter Chicken with Rice', mealContext: 'lunch' },
    ],
  },
  {
    id: 'soya-chunks-masala', name: 'Soya Chunk Masala', icon: '🌱', region: 'north',
    category: ['lunch', 'dinner'], type: 'veg', tags: ['soya', 'gravy'],
    variants: [
      { id: 'soya-chunks-roti', name: 'Soya Masala with Roti', mealContext: 'lunch' },
      { id: 'soya-chunks-rice', name: 'Soya Masala with Rice', mealContext: 'lunch' },
      { id: 'soya-chunks-paratha', name: 'Soya Masala with Paratha', mealContext: 'dinner' },
    ],
  },
  {
    id: 'soybean-matar', name: 'Soybean Matar Curry', icon: '🌱', region: 'north',
    category: ['lunch'], type: 'veg', tags: ['soybean', 'gravy'],
    variants: [{ id: 'soybean-matar-roti', name: 'Soybean Matar with Roti', mealContext: 'lunch' }],
  },
  {
    id: 'tofu-tikka-masala', name: 'Tofu Tikka Masala', icon: '🥘', region: 'north',
    category: ['dinner'], type: 'veg', tags: ['tofu', 'gravy'],
    variants: [{ id: 'tofu-tikka-naan', name: 'Tofu Tikka with Naan', mealContext: 'dinner' }],
  },
  {
    id: 'north-aloo-gobhi-phulka', name: 'Aloo Gobhi (Potato Cauliflower)', icon: '🥦', region: 'north',
    category: ['lunch', 'dinner'], type: 'veg', tags: ['sabzi', 'dry', 'winter', 'everyday'],
    variants: [
      { id: 'aloo-gobhi-phulka', name: 'Aloo Gobhi with Phulka', mealContext: 'lunch' },
      { id: 'aloo-gobhi-tandoori-roti', name: 'Aloo Gobhi with Tandoori Roti', mealContext: 'dinner' },
      { id: 'aloo-gobhi-paratha', name: 'Aloo Gobhi with Paratha', mealContext: 'lunch' },
    ],
  },
  {
    id: 'north-sarson-saag-makki', name: 'Sarson ka Saag (Mustard Greens)', icon: '🥬', region: 'north',
    category: ['lunch', 'dinner'], type: 'veg', tags: ['sabzi', 'winter-special', 'greens', 'punjabi'],
    variants: [
      { id: 'sarson-saag-makki-roti', name: 'Sarson ka Saag with Makki di Roti', mealContext: 'lunch' },
      { id: 'sarson-saag-bajra-roti', name: 'Sarson ka Saag with Bajra Roti', mealContext: 'dinner' },
    ],
  },
  {
    id: 'north-bhindi-masala', name: 'Bhindi Masala (Okra)', icon: '🥒', region: 'north',
    category: ['lunch', 'dinner'], type: 'veg', tags: ['sabzi', 'dry', 'monsoon', 'okra'],
    variants: [
      { id: 'bhindi-phulka', name: 'Bhindi Masala with Phulka', mealContext: 'lunch' },
      { id: 'bhindi-tandoori-roti', name: 'Bhindi Masala with Tandoori Roti', mealContext: 'dinner' },
      { id: 'bhindi-bajra-roti', name: 'Bhindi Masala with Bajra Roti', mealContext: 'lunch' },
    ],
  },
  {
    id: 'north-matar-paneer', name: 'Matar Paneer (Peas Cottage Cheese)', icon: '🫛', region: 'north',
    category: ['lunch', 'dinner'], type: 'veg', tags: ['sabzi', 'gravy', 'winter', 'paneer'],
    variants: [
      { id: 'matar-paneer-naan', name: 'Matar Paneer with Naan', mealContext: 'dinner' },
      { id: 'matar-paneer-tandoori-roti', name: 'Matar Paneer with Tandoori Roti', mealContext: 'lunch' },
      { id: 'matar-paneer-paratha', name: 'Matar Paneer with Paratha', mealContext: 'dinner' },
    ],
  },
  {
    id: 'north-baingan-bharta', name: 'Baingan Bharta (Smoked Eggplant)', icon: '🍆', region: 'north',
    category: ['lunch', 'dinner'], type: 'veg', tags: ['sabzi', 'smoked', 'eggplant', 'traditional'],
    variants: [
      { id: 'baingan-bharta-phulka', name: 'Baingan Bharta with Phulka', mealContext: 'lunch' },
      { id: 'baingan-bharta-tandoori-roti', name: 'Baingan Bharta with Tandoori Roti', mealContext: 'dinner' },
      { id: 'baingan-bharta-makki-roti', name: 'Baingan Bharta with Makki Roti', mealContext: 'winter-lunch' },
    ],
  },
  {
    id: 'north-aloo-matar', name: 'Aloo Matar (Potato Peas)', icon: '🥔', region: 'north',
    category: ['lunch', 'dinner'], type: 'veg', tags: ['sabzi', 'gravy', 'winter', 'everyday'],
    variants: [
      { id: 'aloo-matar-phulka', name: 'Aloo Matar with Phulka', mealContext: 'lunch' },
      { id: 'aloo-matar-paratha', name: 'Aloo Matar with Paratha', mealContext: 'dinner' },
      { id: 'aloo-matar-tandoori-roti', name: 'Aloo Matar with Tandoori Roti', mealContext: 'lunch' },
    ],
  },
  {
    id: 'north-lauki-chana-dal', name: 'Lauki Chana Dal (Bottle Gourd Lentils)', icon: '🥒', region: 'north',
    category: ['lunch', 'dinner'], type: 'veg', tags: ['sabzi', 'healthy', 'summer', 'digestive'],
    variants: [
      { id: 'lauki-dal-phulka', name: 'Lauki Chana Dal with Phulka', mealContext: 'lunch' },
      { id: 'lauki-dal-tandoori-roti', name: 'Lauki Chana Dal with Tandoori Roti', mealContext: 'dinner' },
      { id: 'lauki-dal-bajra-roti', name: 'Lauki Chana Dal with Bajra Roti', mealContext: 'summer-lunch' },
    ],
  },
  {
    id: 'north-karela-masala', name: 'Karela Masala (Bitter Gourd)', icon: '🥒', region: 'north',
    category: ['lunch', 'dinner'], type: 'veg', tags: ['sabzi', 'bitter', 'summer', 'healthy'],
    variants: [
      { id: 'karela-bajra-roti', name: 'Karela Masala with Bajra Roti', mealContext: 'lunch' },
      { id: 'karela-phulka', name: 'Karela Masala with Phulka', mealContext: 'dinner' },
      { id: 'karela-missi-roti', name: 'Karela Masala with Missi Roti', mealContext: 'lunch' },
    ],
  },
  {
    id: 'instant-upma', name: 'Instant Upma', icon: '🥣', region: 'south',
    category: ['breakfast'], type: 'veg', tags: ['instant', 'quick', 'under-15', 'hero'],
    variants: [
      { id: 'instant-upma-classic', name: 'Instant Upma Classic', mealContext: 'breakfast' },
      { id: 'instant-upma-veggie', name: 'Instant Upma Veggie Boost', mealContext: 'breakfast' },
    ],
  },
  {
    id: 'idli', name: 'Idli', icon: '⚪', region: 'south',
    category: ['breakfast'], type: 'veg', tags: ['fermented', 'steamed', 'healthy'],
    variants: [
      { id: 'idli-plain', name: 'Idli Plain', cookingStyle: 'Plain' },
      { id: 'idli-rava', name: 'Idli Rava', cookingStyle: 'Rava' },
      { id: 'idli-mini', name: 'Idli Mini', cookingStyle: 'Mini' },
      { id: 'idli-masala', name: 'Idli Masala', cookingStyle: 'Masala' },
      { id: 'idli-sambhar', name: 'Idli + Sambhar', addOn: 'with sambhar' },
      { id: 'idli-chutney', name: 'Idli + Coconut Chutney', addOn: 'with chutney' },
    ],
  },
  {
    id: 'dosa', name: 'Dosa', icon: '🥞', region: 'south',
    category: ['breakfast'], type: 'veg', tags: ['fermented', 'crispy'],
    variants: [
      { id: 'dosa-plain', name: 'Dosa Plain', cookingStyle: 'Plain' },
      { id: 'dosa-masala', name: 'Dosa Masala', cookingStyle: 'Masala' },
      { id: 'dosa-rava', name: 'Dosa Rava', cookingStyle: 'Rava' },
      { id: 'dosa-neer', name: 'Dosa Neer', cookingStyle: 'Neer' },
      { id: 'dosa-ghee-roast', name: 'Dosa Ghee Roast', cookingStyle: 'Ghee Roast' },
      { id: 'dosa-pesarattu', name: 'Dosa Pesarattu', cookingStyle: 'Pesarattu' },
    ],
  },
  {
    id: 'sambhar-rice', name: 'Sambar Rice', icon: '🍲', region: 'south',
    category: ['lunch', 'dinner'], type: 'veg', tags: ['balanced', 'lentils'],
    variants: [
      { id: 'sambhar-rice-rice', name: 'Sambar + Rice', addOn: 'with rice', mealContext: 'lunch' },
      { id: 'sambhar-roti', name: 'Sambar + Roti', addOn: 'with roti', mealContext: 'dinner' },
      { id: 'sambhar-bowl', name: 'Sambar Bowl', addOn: 'standalone', mealContext: 'lunch' },
      { id: 'sambhar-lite', name: 'Sambar Lite (Dinner)', addOn: 'light portion', mealContext: 'dinner' },
      { id: 'sambhar-thali', name: 'Sambar Thali', addOn: 'thali set', mealContext: 'lunch' },
    ],
  },
  {
    id: 'hyderabadi-biryani', name: 'Hyderabadi Biryani', icon: '🍚', region: 'south',
    category: ['lunch', 'dinner'], type: 'non-veg', tags: ['dum', 'aromatic', 'popular'],
    variants: [
      { id: 'hyd-biryani-chicken', name: 'Biryani Chicken', cookingStyle: 'Chicken' },
      { id: 'hyd-biryani-mutton', name: 'Biryani Mutton', cookingStyle: 'Mutton' },
      { id: 'hyd-biryani-veg', name: 'Biryani Veg', cookingStyle: 'Veg' },
      { id: 'hyd-biryani-egg', name: 'Biryani Egg', cookingStyle: 'Egg' },
      { id: 'biryani-raita', name: 'Biryani + Raita', addOn: 'with raita' },
    ],
  },
  {
    id: 'fish-curry-kerala', name: 'Fish Curry (Kerala)', icon: '🐟', region: 'south',
    category: ['lunch', 'dinner'], type: 'non-veg', tags: ['coconut', 'spicy'],
    variants: [
      { id: 'fish-curry-kl', name: 'Kerala Fish Curry', regionOverride: 'Kerala' },
      { id: 'fish-curry-ap', name: 'Andhra Fish Curry', regionOverride: 'Andhra Pradesh' },
      { id: 'fish-curry-ao-rice', name: 'Fish Curry + Rice', addOn: 'with rice', mealContext: 'lunch' },
      { id: 'fish-curry-ao-roti', name: 'Fish Curry + Roti', addOn: 'with roti', mealContext: 'dinner' },
      { id: 'fish-curry-ao-bowl', name: 'Fish Curry Bowl', addOn: 'standalone', mealContext: 'lunch' },
      { id: 'fish-curry-ao-lite', name: 'Fish Curry Lite (Dinner)', addOn: 'light portion', mealContext: 'dinner' },
      { id: 'fish-curry-ao-thali', name: 'Fish Curry Thali', addOn: 'thali set', mealContext: 'lunch' },
    ],
  },
  {
    id: 'medu-vada', name: 'Medu Vada', icon: '🍩', region: 'south',
    category: ['breakfast', 'snacks'], type: 'veg', tags: ['fried', 'lentil', 'crispy'],
    variants: [
      { id: 'medu-vada-plain', name: 'Medu Vada Plain', cookingStyle: 'Plain' },
      { id: 'medu-vada-sambhar-dip', name: 'Medu Vada Sambhar Dip', cookingStyle: 'Sambhar Dip' },
      { id: 'medu-vada-rasam-dip', name: 'Medu Vada Rasam Dip', cookingStyle: 'Rasam Dip' },
    ],
  },
  {
    id: 'prawn-ghee-roast', name: 'Prawn Ghee Roast', icon: '🦐', region: 'south',
    category: ['dinner'], type: 'non-veg', tags: ['prawn', 'spicy'],
    variants: [{ id: 'prawn-ghee-appam', name: 'Prawn Ghee Roast with Appam', mealContext: 'dinner' }],
  },
  {
    id: 'tofu-chettinad', name: 'Tofu Chettinad', icon: '🥘', region: 'south',
    category: ['lunch', 'dinner'], type: 'veg', tags: ['tofu', 'spicy'],
    variants: [
      { id: 'tofu-chettinad-parotta', name: 'Tofu Chettinad with Parotta', mealContext: 'dinner' },
      { id: 'tofu-chettinad-rice', name: 'Tofu Chettinad with Rice', mealContext: 'lunch' },
    ],
  },
  {
    id: 'andhra-prawn-masala', name: 'Andhra Prawn Masala', icon: '🦐', region: 'south',
    category: ['lunch'], type: 'non-veg', tags: ['prawn', 'spicy', 'gravy'],
    variants: [{ id: 'andhra-prawn-rice', name: 'Prawn Masala with Rice', mealContext: 'lunch' }],
  },
  {
    id: 'chicken-stew', name: 'Kerala Chicken Stew', icon: '🍲', region: 'south',
    category: ['breakfast', 'lunch'], type: 'non-veg', tags: ['chicken', 'stew'],
    variants: [{ id: 'chicken-stew-appam', name: 'Chicken Stew with Appam', mealContext: 'breakfast' }],
  },
  {
    id: 'overnight-oats', name: 'Overnight Oats', icon: '🥣', region: 'west',
    category: ['breakfast'], type: 'vegan', tags: ['quick', 'under-15', 'hero', 'no-cook'],
    variants: [
      { id: 'overnight-oats-classic', name: 'Overnight Oats Classic', mealContext: 'breakfast' },
      { id: 'overnight-oats-fruit', name: 'Overnight Oats + Fruit', mealContext: 'breakfast' },
    ],
  },
  {
    id: 'misal-pav', name: 'Misal Pav', icon: '🌶️', region: 'west',
    category: ['breakfast'], type: 'veg', tags: ['spicy', 'street food', 'popular'],
    variants: [
      { id: 'misal-pav-puneri', name: 'Misal Puneri', cookingStyle: 'Puneri' },
      { id: 'misal-pav-kolhapuri', name: 'Misal Kolhapuri', cookingStyle: 'Kolhapuri' },
      { id: 'misal-pav-mumbai', name: 'Misal Mumbai Style', cookingStyle: 'Mumbai Style' },
    ],
  },
  {
    id: 'dhokla', name: 'Dhokla', icon: '🟡', region: 'west',
    category: ['breakfast', 'snacks'], type: 'veg', tags: ['steamed', 'fermented', 'healthy'],
    variants: [
      { id: 'dhokla-khaman', name: 'Dhokla Khaman', cookingStyle: 'Khaman' },
      { id: 'dhokla-nylon', name: 'Dhokla Nylon', cookingStyle: 'Nylon' },
      { id: 'dhokla-rava', name: 'Dhokla Rava', cookingStyle: 'Rava' },
      { id: 'dhokla-sandwich', name: 'Dhokla Sandwich', cookingStyle: 'Sandwich' },
    ],
  },
  {
    id: 'pav-bhaji', name: 'Pav Bhaji', icon: '🥖', region: 'west',
    category: ['lunch', 'snacks'], type: 'veg', tags: ['street food', 'butter'],
    variants: [
      { id: 'pav-bhaji-classic', name: 'Pav Bhaji Classic', cookingStyle: 'Classic' },
      { id: 'pav-bhaji-cheese', name: 'Pav Bhaji Cheese', cookingStyle: 'Cheese' },
      { id: 'pav-bhaji-jain', name: 'Pav Bhaji Jain', cookingStyle: 'Jain' },
      { id: 'pav-bhaji-dry-fruit', name: 'Pav Bhaji Dry Fruit', cookingStyle: 'Dry Fruit' },
    ],
  },
  {
    id: 'goan-fish-curry', name: 'Goan Fish Curry', icon: '🐟', region: 'west',
    category: ['lunch', 'dinner'], type: 'non-veg', tags: ['coconut', 'tangy', 'spicy'],
    variants: [
      { id: 'goan-fish-rice', name: 'Goan Fish Curry + Rice', addOn: 'with rice', mealContext: 'lunch' },
      { id: 'goan-fish-ao-rice', name: 'Goan Fish Curry + Rice', addOn: 'with rice', mealContext: 'lunch' },
      { id: 'goan-fish-ao-roti', name: 'Goan Fish Curry + Roti', addOn: 'with roti', mealContext: 'dinner' },
      { id: 'goan-fish-ao-bowl', name: 'Goan Fish Curry Bowl', addOn: 'standalone', mealContext: 'lunch' },
      { id: 'goan-fish-ao-lite', name: 'Goan Fish Curry Lite (Dinner)', addOn: 'light portion', mealContext: 'dinner' },
      { id: 'goan-fish-ao-thali', name: 'Goan Fish Curry Thali', addOn: 'thali set', mealContext: 'lunch' },
    ],
  },
  {
    id: 'vada-pav', name: 'Vada Pav', icon: '🥙', region: 'west',
    category: ['snacks'], type: 'veg', tags: ['fried', 'street food', 'spicy'],
    variants: [
      { id: 'vada-pav-classic', name: 'Vada Pav Classic', cookingStyle: 'Classic' },
      { id: 'vada-pav-cheese', name: 'Vada Pav Cheese', cookingStyle: 'Cheese' },
      { id: 'vada-pav-schezwan', name: 'Vada Pav Schezwan', cookingStyle: 'Schezwan' },
    ],
  },
  {
    id: 'mutton-xacuti', name: 'Mutton Xacuti', icon: '🌶️', region: 'west',
    category: ['dinner'], type: 'non-veg', tags: ['mutton', 'gravy'],
    variants: [{ id: 'mutton-xacuti-poi', name: 'Mutton Xacuti with Poi', mealContext: 'dinner' }],
  },
  {
    id: 'fish-malvani', name: 'Malvani Fish Curry', icon: '🌶️', region: 'west',
    category: ['lunch'], type: 'non-veg', tags: ['fish', 'gravy'],
    variants: [{ id: 'fish-malvani-rice', name: 'Fish Curry with Rice', mealContext: 'lunch' }],
  },
  {
    id: 'luchi-aloo', name: 'Luchi + Aloo', icon: '🫓', region: 'east',
    category: ['breakfast'], type: 'veg', tags: ['fried', 'deep fried'],
    variants: [
      { id: 'luchi-aloo-rice', name: 'Luchi + Rice', addOn: 'with rice', mealContext: 'lunch' },
      { id: 'luchi-aloo-roti', name: 'Luchi + Roti', addOn: 'with roti', mealContext: 'dinner' },
      { id: 'luchi-aloo-bowl', name: 'Luchi Bowl', addOn: 'standalone', mealContext: 'lunch' },
      { id: 'luchi-aloo-lite', name: 'Luchi Lite (Dinner)', addOn: 'light portion', mealContext: 'dinner' },
      { id: 'luchi-aloo-thali', name: 'Luchi Thali', addOn: 'thali set', mealContext: 'lunch' },
    ],
  },
  {
    id: 'machher-jhol', name: 'Machher Jhol', icon: '🐠', region: 'east',
    category: ['lunch', 'dinner'], type: 'non-veg', tags: ['fish', 'light curry', 'mustard'],
    variants: [
      { id: 'mj-ao-rice', name: 'Machher Jhol + Rice', addOn: 'with rice', mealContext: 'lunch' },
      { id: 'mj-ao-roti', name: 'Machher Jhol + Roti', addOn: 'with roti', mealContext: 'dinner' },
      { id: 'mj-ao-bowl', name: 'Machher Jhol Bowl', addOn: 'standalone', mealContext: 'lunch' },
      { id: 'mj-ao-lite', name: 'Machher Jhol Lite (Dinner)', addOn: 'light portion', mealContext: 'dinner' },
      { id: 'mj-ao-thali', name: 'Machher Jhol Thali', addOn: 'thali set', mealContext: 'lunch' },
      { id: 'mj-style-mustard', name: 'Machher Jhol Mustard', cookingStyle: 'Mustard' },
      { id: 'mj-style-turmeric', name: 'Machher Jhol Turmeric', cookingStyle: 'Turmeric' },
      { id: 'mj-style-green-chilli', name: 'Machher Jhol Green Chilli', cookingStyle: 'Green Chilli' },
    ],
  },
  {
    id: 'litti-chokha', name: 'Litti Chokha', icon: '🫓', region: 'east',
    category: ['lunch', 'dinner'], type: 'veg', tags: ['baked', 'smoky'],
    variants: [
      { id: 'litti-chokha-rice', name: 'Litti Chokha + Rice', addOn: 'with rice', mealContext: 'lunch' },
      { id: 'litti-chokha-roti', name: 'Litti Chokha + Roti', addOn: 'with roti', mealContext: 'dinner' },
      { id: 'litti-chokha-bowl', name: 'Litti Chokha Bowl', addOn: 'standalone', mealContext: 'lunch' },
      { id: 'litti-chokha-lite', name: 'Litti Chokha Lite (Dinner)', addOn: 'light portion', mealContext: 'dinner' },
      { id: 'litti-chokha-thali', name: 'Litti Chokha Thali', addOn: 'thali set', mealContext: 'lunch' },
    ],
  },
  {
    id: 'pakhala-bhata', name: 'Pakhala Bhata', icon: '🍚', region: 'east',
    category: ['lunch'], type: 'veg', tags: ['fermented', 'cooling', 'summer'],
    variants: [
      { id: 'pakhala-water', name: 'Pakhala Water', cookingStyle: 'Water' },
      { id: 'pakhala-curd', name: 'Pakhala Curd', cookingStyle: 'Curd' },
      { id: 'pakhala-coconut-milk', name: 'Pakhala Coconut Milk', cookingStyle: 'Coconut Milk' },
    ],
  },
  {
    id: 'rohu-fish-kalia', name: 'Rohu Fish Kalia', icon: '🐟', region: 'east',
    category: ['lunch'], type: 'non-veg', tags: ['fish', 'gravy'],
    variants: [{ id: 'rohu-kalia-rice', name: 'Kalia with Rice', mealContext: 'lunch' }],
  },
  {
    id: 'mutton-kosha', name: 'Mutton Kosha', icon: '🍖', region: 'east',
    category: ['dinner'], type: 'non-veg', tags: ['mutton', 'gravy'],
    variants: [{ id: 'mutton-kosha-luchi', name: 'Kosha with Luchi', mealContext: 'dinner' }],
  },
  {
    id: 'chingri-malai', name: 'Chingri Malai Curry', icon: '🦐', region: 'east',
    category: ['lunch'], type: 'non-veg', tags: ['prawn', 'gravy', 'coconut'],
    variants: [{ id: 'chingri-malai-rice', name: 'Malai Curry with Rice', mealContext: 'lunch' }],
  },
  {
    id: 'salmon-paturi', name: 'Salmon Paturi', icon: '🐟', region: 'east',
    category: ['lunch'], type: 'non-veg', tags: ['salmon', 'steamed'],
    variants: [{ id: 'salmon-paturi-rice', name: 'Salmon Paturi with Rice', mealContext: 'lunch' }],
  },
  {
    id: 'soya-bori-curry', name: 'Soya Bori Curry', icon: '🌱', region: 'east',
    category: ['lunch'], type: 'veg', tags: ['soya', 'gravy'],
    variants: [{ id: 'soya-bori-rice', name: 'Soya Bori with Rice', mealContext: 'lunch' }],
  },
  {
    id: 'mutton-chhola', name: 'Mutton Chhola', icon: '🍲', region: 'central',
    category: ['dinner'], type: 'non-veg', tags: ['mutton', 'gravy'],
    variants: [{ id: 'mutton-chhola-roti', name: 'Mutton with Roti', mealContext: 'dinner' }],
  },
  {
    id: 'masala-prawn-fry', name: 'Masala Prawn Fry', icon: '🍲', region: 'central',
    category: ['lunch', 'snacks'], type: 'non-veg', tags: ['prawn', 'dry'],
    variants: [{ id: 'prawn-fry-paratha', name: 'Prawn Fry with Paratha', mealContext: 'lunch' }],
  },
  {
    id: 'soybean-curry', name: 'Soybean Masala', icon: '🍲', region: 'central',
    category: ['lunch'], type: 'veg', tags: ['soybean', 'gravy'],
    variants: [{ id: 'soybean-curry-roti', name: 'Soybean with Roti', mealContext: 'lunch' }],
  },
  {
    id: 'chicken-bastar', name: 'Bastar Chicken Curry', icon: '🍲', region: 'central',
    category: ['dinner'], type: 'non-veg', tags: ['chicken', 'gravy'],
    variants: [{ id: 'chicken-bastar-pej', name: 'Chicken with Pej', mealContext: 'dinner' }],
  },
  {
    id: 'soya-chunks-do-pyaza', name: 'Soya Chunks Do Pyaza', icon: '🍲', region: 'central',
    category: ['lunch'], type: 'veg', tags: ['soya', 'gravy'],
    variants: [{ id: 'soya-do-pyaza-roti', name: 'Soya Do Pyaza with Roti', mealContext: 'lunch' }],
  },
  {
    id: 'poha-mp', name: 'Poha', icon: '🥣', region: 'central',
    category: ['breakfast'], type: 'veg', tags: ['flattened rice', 'quick', 'healthy'],
    variants: [
      { id: 'poha-mp-kanda', name: 'Kanda Poha', cookingStyle: 'Kanda Poha' },
      { id: 'poha-mp-sev', name: 'Sev Poha', cookingStyle: 'Sev Poha' },
      { id: 'poha-mp-aloo', name: 'Aloo Poha', cookingStyle: 'Aloo Poha' },
      { id: 'poha-mp-palak', name: 'Palak Poha', cookingStyle: 'Palak Poha' },
    ],
  },
  {
    id: 'dal-bafla', name: 'Dal Bafla', icon: '🥘', region: 'central',
    category: ['lunch', 'dinner'], type: 'veg', tags: ['baked', 'ghee', 'traditional'],
    variants: [
      { id: 'dal-bafla-rice', name: 'Dal Bafla + Rice', addOn: 'with rice', mealContext: 'lunch' },
      { id: 'dal-bafla-roti', name: 'Dal Bafla + Roti', addOn: 'with roti', mealContext: 'dinner' },
      { id: 'dal-bafla-bowl', name: 'Dal Bafla Bowl', addOn: 'standalone', mealContext: 'lunch' },
      { id: 'dal-bafla-lite', name: 'Dal Bafla Lite (Dinner)', addOn: 'light portion', mealContext: 'dinner' },
      { id: 'dal-bafla-thali', name: 'Dal Bafla Thali', addOn: 'thali set', mealContext: 'lunch' },
    ],
  },
  {
    id: 'sabudana-khichdi', name: 'Sabudana Khichdi', icon: '🫙', region: 'central',
    category: ['breakfast', 'snacks'], type: 'veg', tags: ['fasting', 'sago', 'light'],
    variants: [
      { id: 'sabudana-dry', name: 'Sabudana Khichdi Dry', cookingStyle: 'Dry' },
      { id: 'sabudana-wet', name: 'Sabudana Khichdi Wet', cookingStyle: 'Wet' },
      { id: 'sabudana-tawa', name: 'Sabudana Khichdi Tawa Style', cookingStyle: 'Tawa Style' },
    ],
  },
  {
    id: 'thukpa', name: 'Thukpa', icon: '🍜', region: 'northeast',
    category: ['lunch', 'dinner'], type: 'non-veg', tags: ['noodle soup', 'Tibetan'],
    variants: [
      { id: 'thukpa-chicken', name: 'Thukpa Chicken', cookingStyle: 'Chicken' },
      { id: 'thukpa-veg', name: 'Thukpa Veg', cookingStyle: 'Veg' },
      { id: 'thukpa-lamb', name: 'Thukpa Lamb', cookingStyle: 'Lamb' },
    ],
  },
  {
    id: 'momos', name: 'Momos', icon: '🥟', region: 'northeast',
    category: ['snacks'], type: 'non-veg', tags: ['steamed', 'dumplings', 'popular'],
    variants: [
      { id: 'momos-chicken', name: 'Momos Chicken', cookingStyle: 'Chicken' },
      { id: 'momos-veg', name: 'Momos Veg', cookingStyle: 'Veg' },
      { id: 'momos-pork', name: 'Momos Pork', cookingStyle: 'Pork' },
      { id: 'momos-paneer', name: 'Momos Paneer', cookingStyle: 'Paneer' },
      { id: 'momos-fried', name: 'Momos Fried', cookingStyle: 'Fried' },
      { id: 'momos-jhol', name: 'Momos Jhol', cookingStyle: 'Jhol' },
    ],
  },
  {
    id: 'khar-assam', name: 'Khar', icon: '🍛', region: 'northeast',
    category: ['lunch'], type: 'veg', tags: ['alkaline', 'traditional', 'unique'],
    variants: [
      { id: 'khar-raw-papaya', name: 'Khar with Raw Papaya' },
      { id: 'khar-mustard', name: 'Khar with Mustard Greens' },
    ],
  },
  {
    id: 'smoked-pork', name: 'Smoked Pork', icon: '🥩', region: 'northeast',
    category: ['lunch', 'dinner'], type: 'non-veg', tags: ['smoked', 'tribal', 'spicy'],
    variants: [
      { id: 'smoked-pork-bamboo-shoot', name: 'Smoked Pork with Bamboo Shoot', cookingStyle: 'With Bamboo Shoot' },
      { id: 'smoked-pork-axone', name: 'Smoked Pork with Axone', cookingStyle: 'With Axone' },
      { id: 'smoked-pork-dry', name: 'Smoked Pork Dry', cookingStyle: 'Dry' },
    ],
  },
  {
    id: 'jadoh', name: 'Jadoh', icon: '🍚', region: 'northeast',
    category: ['lunch'], type: 'non-veg', tags: ['rice', 'pork', 'Khasi'],
    variants: [
      { id: 'jadoh-rice', name: 'Jadoh + Rice', addOn: 'with rice', mealContext: 'lunch' },
      { id: 'jadoh-roti', name: 'Jadoh + Roti', addOn: 'with roti', mealContext: 'dinner' },
      { id: 'jadoh-bowl', name: 'Jadoh Bowl', addOn: 'standalone', mealContext: 'lunch' },
      { id: 'jadoh-lite', name: 'Jadoh Lite (Dinner)', addOn: 'light portion', mealContext: 'dinner' },
      { id: 'jadoh-thali', name: 'Jadoh Thali', addOn: 'thali set', mealContext: 'lunch' },
    ],
  },
  {
    id: 'trout-bamboo', name: 'Trout with Bamboo Shoot', icon: '🍚', region: 'northeast',
    category: ['lunch'], type: 'non-veg', tags: ['trout', 'stew'],
    variants: [{ id: 'trout-bamboo-rice', name: 'Trout Stew with Rice', mealContext: 'lunch' }],
  },
  {
    id: 'salmon-steamed', name: 'Steamed Salmon', icon: '🍚', region: 'northeast',
    category: ['lunch'], type: 'non-veg', tags: ['salmon', 'steamed'],
    variants: [{ id: 'salmon-steamed-rice', name: 'Salmon with Sticky Rice', mealContext: 'lunch' }],
  },
  {
    id: 'chicken-masor-tenga', name: 'Chicken Masor Tenga', icon: '🍚', region: 'northeast',
    category: ['lunch'], type: 'non-veg', tags: ['chicken', 'stew'],
    variants: [{ id: 'chicken-masor-rice', name: 'Chicken with Rice', mealContext: 'lunch' }],
  },
  {
    id: 'tofu-stir-fry', name: 'Tofu Vegetable Stir-fry', icon: '🍚', region: 'northeast',
    category: ['breakfast', 'snacks'], type: 'veg', tags: ['tofu', 'dry'],
    variants: [{ id: 'tofu-stir-rice', name: 'Tofu Stir-fry with Rice', mealContext: 'breakfast' }],
  },
  {
    id: 'mutton-naga', name: 'Naga Mutton Curry', icon: '🍚', region: 'northeast',
    category: ['dinner'], type: 'non-veg', tags: ['mutton', 'stew'],
    variants: [{ id: 'mutton-naga-rice', name: 'Mutton with Sticky Rice', mealContext: 'dinner' }],
  },
];

const TEST_USERS = [
  { id: 'test-user-001', name: 'Ravi Kumar', phone: '+919876543210', region: 'north', dietType: 'veg' },
  { id: 'test-user-002', name: 'Priya Sharma', phone: '+919876543211', region: 'south', dietType: 'non-veg' },
];

async function seedMeals() {
  console.log('\n Seeding meals catalog...');
  let dishCount = 0;
  let variantCount = 0;
  let ingredientCount = 0;

  const ingredientMap = new Map<string, { name: string; category: string; defaultUnit: string; aliases: string[] }>();

  for (const dish of SEED_DISHES) {
    dishCount++;

    await prisma.meal.upsert({
      where: { id: dish.id },
      update: {
        name: dish.name,
        icon: dish.icon,
        category: dish.category[0] ?? 'lunch',
        type: dish.type,
        region: dish.region,
        tags: dish.tags,
      },
      create: {
        id: dish.id,
        name: dish.name,
        icon: dish.icon,
        category: dish.category[0] ?? 'lunch',
        type: dish.type,
        region: dish.region,
        tags: dish.tags,
      },
    });

    for (const variant of dish.variants) {
      variantCount++;
      await prisma.mealVariant.upsert({
        where: { id: variant.id },
        update: {
          mealId: dish.id,
          name: variant.name,
          cookingStyle: variant.cookingStyle || null,
          baseStyle: variant.baseStyle || null,
          addOn: variant.addOn || null,
          accompaniments: variant.accompaniments || [],
          mealContext: variant.mealContext || null,
          regionOverride: variant.regionOverride || null,
        },
        create: {
          id: variant.id,
          mealId: dish.id,
          name: variant.name,
          cookingStyle: variant.cookingStyle || null,
          baseStyle: variant.baseStyle || null,
          addOn: variant.addOn || null,
          accompaniments: variant.accompaniments || [],
          mealContext: variant.mealContext || null,
          regionOverride: variant.regionOverride || null,
        },
      });

      if (variant.accompaniments && variant.accompaniments.length > 0) {
        for (const acc of variant.accompaniments) {
          const accId = acc.toLowerCase().replace(/\s+/g, '-');
          if (!ingredientMap.has(acc)) {
            ingredientMap.set(acc, { name: acc, category: 'pantry', defaultUnit: 'unit', aliases: [] });
          }
          ingredientCount++;
          await prisma.mealIngredient.upsert({
            where: { mealId_ingredientId: { mealId: dish.id, ingredientId: accId } },
            update: { qtyPerServing: 1, unit: 'unit' },
            create: { mealId: dish.id, ingredientId: accId, qtyPerServing: 1, unit: 'unit' },
          });
        }
      }
    }
  }

  for (const [, data] of ingredientMap) {
    const id = data.name.toLowerCase().replace(/\s+/g, '-');
    await prisma.ingredient.upsert({
      where: { id },
      update: { name: data.name, category: data.category, defaultUnit: data.defaultUnit, aliases: data.aliases },
      create: { id, name: data.name, category: data.category, defaultUnit: data.defaultUnit, aliases: data.aliases },
    });
  }

  console.log(`   ${dishCount} meals, ${variantCount} variants, ${ingredientCount} links`);
  return { dishCount, variantCount, ingredientCount };
}

async function seedTestUsers() {
  console.log('\n Seeding test users...');
  for (const user of TEST_USERS) {
    await prisma.user.upsert({
      where: { id: user.id },
      update: { name: user.name, phone: user.phone },
      create: { id: user.id, name: user.name, phone: user.phone },
    });
    await prisma.userProfile.upsert({
      where: { userId: user.id },
      update: { region: user.region, dietType: user.dietType },
      create: { userId: user.id, region: user.region, dietType: user.dietType },
    });
  }
  console.log(`   ${TEST_USERS.length} test users`);
}

async function main() {
  const mode = process.argv[2];

  if (mode === '--reset') {
    console.log(' Resetting database...');
    await prisma.mealIngredient.deleteMany();
    await prisma.mealVariant.deleteMany();
    await prisma.meal.deleteMany();
    await prisma.ingredient.deleteMany();
    await prisma.userProfile.deleteMany();
    await prisma.user.deleteMany();
    await prisma.userPlan.deleteMany();
    await prisma.completedSlot.deleteMany();
    console.log('   All tables cleared.');
  }

  console.log('\n MealDrama Database Seed');
  console.log('==========================');

  const { dishCount, variantCount, ingredientCount } = await seedMeals();
  await seedTestUsers();

  console.log('\n Seed complete!');
  console.log(`   ${dishCount} meals, ${variantCount} variants, ${ingredientCount} ingredient links`);
  console.log('\nTo reset and reseed: npm run seed -- --reset');
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
