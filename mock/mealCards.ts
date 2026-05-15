import type { MealCardData, CategoryOption } from '../types/meal';

const id = (n: string) => n.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/-+/g, '-').replace(/^-|-$/g, '');

const g = (name: string): CategoryOption => ({ id: id(name), name, icon: '🍲' });
const r = (name: string): CategoryOption => ({ id: id(name), name, icon: '🫓' });
const rc = (name: string): CategoryOption => ({ id: id(name), name, icon: '🍚' });
const s = (name: string): CategoryOption => ({ id: id(name), name, icon: '🥗' });
const b = (name: string): CategoryOption => ({ id: id(name), name, icon: '🥤' });

const N_GRAVIES = [
  g('Red Gravy (Tomato-Butter)'), g('White Gravy (Cashew-Cream)'),
  g('Brown Gravy (Onion-Tomato)'), g('Green Gravy (Spinach)'),
  g('Yellow Gravy (Turmeric)'), g('Makhani Gravy'),
  g('Mughlai Gravy'), g('Korma Gravy'),
];
const S_GRAVIES = [
  g('Coconut Gravy'), g('Chettinad Masala'),
  g('Sambar'), g('Rasam'),
  g('Kerala Stew'), g('Andhra Chilli Gravy'),
];
const E_GRAVIES = [
  g('Mustard Gravy (Shorshe)'), g('Poppy Seed Gravy (Posto)'),
  g('Chingri Malaikari'), g('Bengali Kalia'),
];
const W_GRAVIES = [
  g('Kolhapuri Gravy'), g('Goan Vindaloo'),
  g('Xacuti Masala'), g('Gujarati Kadhi'),
];

const N_BREADS = [
  r('Naan'), r('Garlic Naan'), r('Tandoori Roti'), r('Phulka'),
  r('Paratha'), r('Aloo Paratha'), r('Missi Roti'),
  r('Bhature'), r('Puri'), r('Kulcha'), r('Roomali Roti'),
];
const S_BREADS = [
  r('Dosa'), r('Masala Dosa'), r('Idli'), r('Appam'),
  r('Uttapam'), r('Vada'), r('Parotta'), r('Rava Dosa'),
];
const E_BREADS = [
  r('Luchi'), r('Radhaballavi'),
];
const W_BREADS = [
  r('Pav'), r('Bhakri'), r('Thepla'), r('Chapati'), r('Puran Poli'),
];

const RICES = [
  rc('Steamed Rice'), rc('Jeera Rice'), rc('Pulao'),
  rc('Biryani Rice'), rc('Lemon Rice'), rc('Coconut Rice'),
  rc('Tomato Rice'), rc('Curd Rice'), rc('Khichdi'), rc('Ghee Rice'),
];

const CHUTNEYS = [
  s('Mint Chutney'), s('Tamarind Chutney'), s('Coconut Chutney'),
  s('Tomato Chutney'), s('Coriander Chutney'), s('Mango Chutney'),
  s('Onion Chutney'), s('Garlic Chutney'), s('Podi'),
];
const PICKLES = [
  s('Mango Pickle'), s('Lemon Pickle'), s('Mix Pickle'),
  s('Green Chilli Pickle'), s('Garlic Pickle'),
];
const RAITAS = [
  s('Cucumber Raita'), s('Onion Raita'), s('Boondi Raita'),
  s('Mint Raita'), s('Mix Veg Raita'),
];
const SALADS = [
  s('Onion Salad'), s('Cucumber Tomato Salad'),
  s('Kachumber Salad'), s('Green Salad'),
];
const OTHER_SIDES = [
  s('Roasted Papad'), s('Fried Papad'), s('Aloo Bhaji'),
  s('Bhindi Bhaji'), s('Onion Rings'),
];

const BEVERAGES = [
  b('Chaas (Buttermilk)'), b('Nimbu Pani'), b('Sweet Lassi'),
  b('Salted Lassi'), b('Mango Lassi'), b('Masala Chai'),
  b('Filter Coffee'), b('Aam Panna'), b('Jaljeera'),
  b('Sharbat'), b('Badam Milk'), b('Thandai'), b('Kokum Sharbat'),
];

export function getMockMealCards(): MealCardData[] {
  return [
    {
      id: 'rajma-chawal',
      name: 'Rajma Chawal',
      icon: '🫘',
      region: 'north',
      tags: ['veg', 'comfort', 'north-indian'],
      categories: {
        gravy: g('Brown Gravy (Onion-Tomato)'),
        roti: null,
        rice: rc('Steamed Rice'),
        sides: [s('Onion Salad'), s('Mango Pickle')],
        beverages: [b('Chaas (Buttermilk)')],
      },
      availableOptions: {
        gravy: [g('Brown Gravy (Onion-Tomato)'), g('Red Gravy (Tomato-Butter)'), g('Kashmiri Rajma')],
        roti: [r('Phulka'), r('Tandoori Roti'), r('Naan')],
        rice: [rc('Steamed Rice'), rc('Jeera Rice'), rc('Pulao'), rc('Khichdi')],
        sides: [...SALADS, ...PICKLES, ...RAITAS, s('Roasted Papad')],
        beverages: [b('Chaas (Buttermilk)'), b('Nimbu Pani'), b('Sweet Lassi'), b('Masala Chai')],
      },
    },
    {
      id: 'dosa',
      name: 'Masala Dosa',
      icon: '🥞',
      region: 'south',
      tags: ['veg', 'breakfast', 'south-indian'],
      categories: {
        gravy: g('Sambar'),
        roti: null,
        rice: null,
        sides: [s('Coconut Chutney'), s('Tomato Chutney')],
        beverages: [b('Filter Coffee')],
      },
      availableOptions: {
        gravy: [g('Sambar'), g('Coconut Gravy'), g('Rasam'), g('Andhra Chilli Gravy')],
        roti: [r('Masala Dosa'), r('Rava Dosa'), r('Appam'), r('Uttapam'), r('Parotta')],
        rice: [],
        sides: [...CHUTNEYS, s('Podi'), s('Aloo Bhaji')],
        beverages: [b('Filter Coffee'), b('Masala Chai'), b('Chaas (Buttermilk)'), b('Nimbu Pani')],
      },
    },
    {
      id: 'biryani',
      name: 'Hyderabadi Biryani',
      icon: '🍛',
      region: 'south',
      tags: ['non-veg', 'festive', 'rice', 'hyderabadi'],
      categories: {
        gravy: g('Brown Gravy (Onion-Tomato)'),
        roti: null,
        rice: rc('Biryani Rice'),
        sides: [s('Onion Raita'), s('Mirchi Ka Salan')],
        beverages: [b('Nimbu Pani')],
      },
      availableOptions: {
        gravy: [g('Brown Gravy (Onion-Tomato)'), g('Red Gravy (Tomato-Butter)'), g('Mughlai Gravy'), g('Korma Gravy')],
        roti: [r('Rumali Roti'), r('Naan'), r('Garlic Naan')],
        rice: [rc('Biryani Rice'), rc('Steamed Rice'), rc('Jeera Rice')],
        sides: [...RAITAS, ...SALADS, s('Mirchi Ka Salan'), s('Bagara Baingan'), s('Roasted Papad')],
        beverages: [b('Nimbu Pani'), b('Sharbat'), b('Masala Chai'), b('Sweet Lassi')],
      },
    },
    {
      id: 'pav-bhaji',
      name: 'Pav Bhaji',
      icon: '🥪',
      region: 'west',
      tags: ['veg', 'street-food', 'mumbai'],
      categories: {
        gravy: g('Red Gravy (Tomato-Butter)'),
        roti: r('Pav'),
        rice: null,
        sides: [s('Onion Salad'), s('Lemon Wedge')],
        beverages: [b('Nimbu Pani')],
      },
      availableOptions: {
        gravy: [g('Red Gravy (Tomato-Butter)'), g('Brown Gravy (Onion-Tomato)'), g('Green Gravy (Spinach)'), g('Cheese Bhaji')],
        roti: [r('Pav'), r('Garlic Pav'), r('Whole Wheat Pav'), r('Pav-Toast')],
        rice: [],
        sides: [...SALADS, ...CHUTNEYS, s('Green Chutney'), s('Roasted Papad')],
        beverages: [b('Nimbu Pani'), b('Masala Chai'), b('Chaas (Buttermilk)')],
      },
    },
    {
      id: 'fish-curry',
      name: 'Bengali Fish Curry',
      icon: '🐟',
      region: 'east',
      tags: ['non-veg', 'fish', 'bengali', 'light'],
      categories: {
        gravy: g('Mustard Gravy (Shorshe)'),
        roti: null,
        rice: rc('Steamed Rice'),
        sides: [s('Alu Posto')],
        beverages: [b('Aam Panna')],
      },
      availableOptions: {
        gravy: [g('Mustard Gravy (Shorshe)'), g('Poppy Seed Gravy (Posto)'), g('Chingri Malaikari'), g('Bengali Kalia'), g('Tomato Fish Curry')],
        roti: [r('Luchi'), r('Radhaballavi'), r('Steamed Rice')],
        rice: [rc('Steamed Rice'), rc('Ghee Rice')],
        sides: [s('Alu Posto'), s('Begun Bhaja'), s('Charchari'), s('Mango Pickle')],
        beverages: [b('Aam Panna'), b('Mishti Doi'), b('Masala Chai'), b('Nimbu Pani')],
      },
    },
    {
      id: 'chole-bhature',
      name: 'Chole Bhature',
      icon: '🧆',
      region: 'north',
      tags: ['veg', 'heavy', 'weekend', 'punjabi'],
      categories: {
        gravy: g('Brown Gravy (Onion-Tomato)'),
        roti: r('Bhature'),
        rice: null,
        sides: [s('Onion Rings'), s('Green Chutney')],
        beverages: [b('Sweet Lassi')],
      },
      availableOptions: {
        gravy: [g('Brown Gravy (Onion-Tomato)'), g('Dry Chole'), g('Chole Tikki'), g('Red Gravy (Tomato-Butter)')],
        roti: [r('Bhature'), r('Puri'), r('Kulcha'), r('Naan'), r('Tandoori Roti')],
        rice: [rc('Jeera Rice'), rc('Pulao')],
        sides: [...SALADS, ...PICKLES, ...CHUTNEYS],
        beverages: [b('Sweet Lassi'), b('Salted Lassi'), b('Mango Lassi'), b('Nimbu Pani'), b('Masala Chai')],
      },
    },
    {
      id: 'idli-sambar',
      name: 'Idli Sambar',
      icon: '🥟',
      region: 'south',
      tags: ['veg', 'light', 'breakfast', 'south-indian'],
      categories: {
        gravy: g('Sambar'),
        roti: null,
        rice: null,
        sides: [s('Coconut Chutney'), s('Tomato Chutney')],
        beverages: [b('Filter Coffee')],
      },
      availableOptions: {
        gravy: [g('Sambar'), g('Rasam'), g('Coconut Gravy'), g('Pumpkin Sambar')],
        roti: [r('Idli'), r('Rava Idli'), r('Vada'), r('Appam')],
        rice: [],
        sides: [...CHUTNEYS, s('Podi'), s('Aloo Bhaji')],
        beverages: [b('Filter Coffee'), b('Masala Chai'), b('Chaas (Buttermilk)')],
      },
    },
    {
      id: 'chicken-tikka',
      name: 'Chicken Tikka',
      icon: '🍗',
      region: 'north',
      tags: ['non-veg', 'grill', 'starter', 'punjabi'],
      categories: {
        gravy: g('Makhani Gravy'),
        roti: r('Naan'),
        rice: null,
        sides: [s('Mint Chutney'), s('Onion Rings')],
        beverages: [b('Nimbu Pani')],
      },
      availableOptions: {
        gravy: [g('Makhani Gravy'), g('Red Gravy (Tomato-Butter)'), g('White Gravy (Cashew-Cream)'), g('Mughlai Gravy'), g('Korma Gravy')],
        roti: [r('Naan'), r('Garlic Naan'), r('Tandoori Roti'), r('Rumali Roti'), r('Roomali Roti')],
        rice: [rc('Steamed Rice'), rc('Pulao'), rc('Biryani Rice'), rc('Jeera Rice')],
        sides: [...CHUTNEYS, ...SALADS, ...RAITAS, s('Roasted Papad')],
        beverages: [b('Nimbu Pani'), b('Sweet Lassi'), b('Salted Lassi'), b('Masala Chai'), b('Jaljeera')],
      },
    },
    {
      id: 'aloo-paratha',
      name: 'Aloo Paratha',
      icon: '🫓',
      region: 'north',
      tags: ['veg', 'breakfast', 'bread', 'punjabi'],
      categories: {
        gravy: null,
        roti: r('Plain Paratha'),
        rice: null,
        sides: [s('Curd'), s('Butter')],
        beverages: [b('Masala Chai')],
      },
      availableOptions: {
        gravy: [],
        roti: [r('Plain Paratha'), r('Crispy Paratha'), r('Stuffed Paratha'), r('Methi Paratha'), r('Gobi Paratha')],
        rice: [],
        sides: [s('Curd'), s('Butter'), s('Mango Pickle'), s('Green Chutney'), s('Mint Chutney'), s('Onion Salad')],
        beverages: [b('Masala Chai'), b('Nimbu Pani'), b('Sweet Lassi'), b('Chaas (Buttermilk)')],
      },
    },
    {
      id: 'paneer-butter-masala',
      name: 'Paneer Butter Masala',
      icon: '🧈',
      region: 'north',
      tags: ['veg', 'gravy', 'rich', 'punjabi'],
      categories: {
        gravy: g('Makhani Gravy'),
        roti: r('Naan'),
        rice: null,
        sides: [s('Onion Rings'), s('Mint Chutney')],
        beverages: [b('Nimbu Pani')],
      },
      availableOptions: {
        gravy: [g('Makhani Gravy'), g('Red Gravy (Tomato-Butter)'), g('White Gravy (Cashew-Cream)'), g('Korma Gravy'), g('Mughlai Gravy')],
        roti: [r('Naan'), r('Garlic Naan'), r('Tandoori Roti'), r('Phulka'), r('Rumali Roti'), r('Puri')],
        rice: [rc('Steamed Rice'), rc('Jeera Rice'), rc('Pulao'), rc('Ghee Rice')],
        sides: [...SALADS, ...RAITAS, ...CHUTNEYS, s('Roasted Papad')],
        beverages: [b('Nimbu Pani'), b('Sweet Lassi'), b('Chaas (Buttermilk)'), b('Masala Chai'), b('Aam Panna')],
      },
    },
    {
      id: 'dal-makhani',
      name: 'Dal Makhani',
      icon: '🫘',
      region: 'north',
      tags: ['veg', 'comfort', 'punjabi', 'slow-cooked'],
      categories: {
        gravy: g('Makhani Gravy'),
        roti: r('Naan'),
        rice: null,
        sides: [s('Onion Rings'), s('Mint Chutney')],
        beverages: [b('Nimbu Pani')],
      },
      availableOptions: {
        gravy: [g('Makhani Gravy'), g('Brown Gravy (Onion-Tomato)'), g('Red Gravy (Tomato-Butter)'), g('White Gravy (Cashew-Cream)')],
        roti: [r('Naan'), r('Garlic Naan'), r('Tandoori Roti'), r('Phulka'), r('Puri')],
        rice: [rc('Steamed Rice'), rc('Jeera Rice'), rc('Pulao'), rc('Ghee Rice')],
        sides: [...SALADS, ...PICKLES, ...RAITAS, s('Roasted Papad')],
        beverages: [b('Nimbu Pani'), b('Sweet Lassi'), b('Chaas (Buttermilk)'), b('Masala Chai')],
      },
    },
    {
      id: 'dosa-plain',
      name: 'Plain Dosa',
      icon: '🥞',
      region: 'south',
      tags: ['veg', 'light', 'breakfast', 'south-indian'],
      categories: {
        gravy: g('Sambar'),
        roti: null,
        rice: null,
        sides: [s('Coconut Chutney'), s('Tomato Chutney')],
        beverages: [b('Filter Coffee')],
      },
      availableOptions: {
        gravy: [g('Sambar'), g('Rasam'), g('Coconut Gravy'), g('Pumpkin Sambar')],
        roti: [r('Plain Dosa'), r('Ghee Dosa'), r('Paper Dosa'), r('Rava Dosa'), r('Appam')],
        rice: [],
        sides: [...CHUTNEYS, s('Podi'), s('Aloo Bhaji'), s('Potato Curry')],
        beverages: [b('Filter Coffee'), b('Masala Chai'), b('Chaas (Buttermilk)'), b('Nimbu Pani')],
      },
    },
    {
      id: 'chicken-chettinad',
      name: 'Chicken Chettinad',
      icon: '🍗',
      region: 'south',
      tags: ['non-veg', 'spicy', 'chettinad', 'south-indian'],
      categories: {
        gravy: g('Chettinad Masala'),
        roti: null,
        rice: rc('Steamed Rice'),
        sides: [s('Onion Salad'), s('Coconut Chutney')],
        beverages: [b('Filter Coffee')],
      },
      availableOptions: {
        gravy: [g('Chettinad Masala'), g('Andhra Chilli Gravy'), g('Coconut Gravy'), g('Kerala Stew')],
        roti: [r('Parotta'), r('Appam'), r('Dosa'), r('Malabar Paratha')],
        rice: [rc('Steamed Rice'), rc('Coconut Rice'), rc('Lemon Rice'), rc('Curd Rice'), rc('Ghee Rice')],
        sides: [...CHUTNEYS, ...SALADS, ...PICKLES, s('Podi')],
        beverages: [b('Filter Coffee'), b('Masala Chai'), b('Chaas (Buttermilk)'), b('Nimbu Pani'), b('Kokum Sharbat')],
      },
    },
    {
      id: 'gujarati-kadhi',
      name: 'Gujarati Kadhi',
      icon: '🥣',
      region: 'west',
      tags: ['veg', 'light', 'gujarati', 'sweet-sour'],
      categories: {
        gravy: g('Gujarati Kadhi'),
        roti: r('Bhakri'),
        rice: rc('Steamed Rice'),
        sides: [s('Mango Pickle'), s('Roasted Papad')],
        beverages: [b('Chaas (Buttermilk)')],
      },
      availableOptions: {
        gravy: [g('Gujarati Kadhi'), g('Punjabi Kadhi'), g('Sindhi Kadhi')],
        roti: [r('Bhakri'), r('Thepla'), r('Chapati'), r('Puran Poli'), r('Khakhra')],
        rice: [rc('Steamed Rice'), rc('Khichdi')],
        sides: [...PICKLES, ...CHUTNEYS, s('Roasted Papad'), s('Fried Papad'), s('Ringan Bhaji')],
        beverages: [b('Chaas (Buttermilk)'), b('Nimbu Pani'), b('Masala Chai'), b('Aam Panna')],
      },
    },
    {
      id: 'goan-fish',
      name: 'Goan Fish Curry',
      icon: '🐟',
      region: 'west',
      tags: ['non-veg', 'fish', 'goan', 'coconut'],
      categories: {
        gravy: g('Goan Vindaloo'),
        roti: null,
        rice: rc('Steamed Rice'),
        sides: [s('Cucumber Tomato Salad'), s('Mango Pickle')],
        beverages: [b('Kokum Sharbat')],
      },
      availableOptions: {
        gravy: [g('Goan Vindaloo'), g('Xacuti Masala'), g('Coconut Gravy'), g('Kerala Stew')],
        roti: [r('Pav'), r('Bhakri'), r('Chapati')],
        rice: [rc('Steamed Rice'), rc('Coconut Rice'), rc('Lemon Rice')],
        sides: [...SALADS, ...PICKLES, s('Roasted Papad'), s('Fried Fish')],
        beverages: [b('Kokum Sharbat'), b('Nimbu Pani'), b('Aam Panna'), b('Masala Chai'), b('Chaas (Buttermilk)')],
      },
    },
    {
      id: 'malai-kofta',
      name: 'Malai Kofta',
      icon: '🧆',
      region: 'north',
      tags: ['veg', 'rich', 'mughlai', 'creamy'],
      categories: {
        gravy: g('White Gravy (Cashew-Cream)'),
        roti: r('Naan'),
        rice: null,
        sides: [s('Mint Chutney'), s('Onion Rings')],
        beverages: [b('Nimbu Pani')],
      },
      availableOptions: {
        gravy: [g('White Gravy (Cashew-Cream)'), g('Makhani Gravy'), g('Red Gravy (Tomato-Butter)'), g('Korma Gravy')],
        roti: [r('Naan'), r('Garlic Naan'), r('Tandoori Roti'), r('Puri'), r('Pulao')],
        rice: [rc('Steamed Rice'), rc('Jeera Rice'), rc('Pulao'), rc('Ghee Rice')],
        sides: [...SALADS, ...CHUTNEYS, ...RAITAS, s('Roasted Papad')],
        beverages: [b('Nimbu Pani'), b('Sweet Lassi'), b('Masala Chai'), b('Jaljeera'), b('Aam Panna')],
      },
    },
    {
      id: 'butter-chicken',
      name: 'Butter Chicken',
      icon: '🍗',
      region: 'north',
      tags: ['non-veg', 'rich', 'punjabi', 'creamy'],
      categories: {
        gravy: g('Makhani Gravy'),
        roti: r('Garlic Naan'),
        rice: null,
        sides: [s('Onion Rings'), s('Mint Chutney')],
        beverages: [b('Nimbu Pani')],
      },
      availableOptions: {
        gravy: [g('Makhani Gravy'), g('Red Gravy (Tomato-Butter)'), g('White Gravy (Cashew-Cream)'), g('Mughlai Gravy'), g('Korma Gravy')],
        roti: [r('Garlic Naan'), r('Naan'), r('Tandoori Roti'), r('Rumali Roti'), r('Roomali Roti')],
        rice: [rc('Steamed Rice'), rc('Jeera Rice'), rc('Pulao'), rc('Biryani Rice')],
        sides: [...SALADS, ...CHUTNEYS, ...RAITAS, s('Roasted Papad'), s('Aloo Bhaji')],
        beverages: [b('Nimbu Pani'), b('Sweet Lassi'), b('Mango Lassi'), b('Masala Chai'), b('Aam Panna'), b('Jaljeera')],
      },
    },
  ];
}

export const SLOT_MOCK_MEALS: Record<string, string[]> = {
  breakfast: getMockMealCards().filter(m => ['poha', 'dosa', 'idli', 'paratha', 'bread', 'sandwich', 'upma'].includes(m.id) || m.tags.includes('breakfast')).map(m => m.id),
  lunch: getMockMealCards().filter(m => !['pancake', 'waffle', 'cereal', 'porridge'].some(t => m.tags.includes(t))).map(m => m.id),
  snacks: getMockMealCards().filter(m => ['samosa', 'pakora', 'chaat', 'momos'].includes(m.id) || m.tags.includes('snack')).map(m => m.id),
  dinner: getMockMealCards().filter(m => !['pancake', 'waffle', 'cereal', 'porridge'].some(t => m.tags.includes(t))).map(m => m.id),
};
