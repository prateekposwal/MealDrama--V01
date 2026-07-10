export interface PairingRule {
  dishId?: string;
  dishName?: string;
  pairedWith?: string;
  styles?: string[];
  regions?: string[];
  sides: string[];
  condiments: string[];
  beverage?: string;
  dessert?: string;
  priority?: 'high' | 'medium' | 'low';
}

export const PAIRING_RULES: PairingRule[] = [
  { dishId: 'lassi', sides: ['🧊 Ice', '🌿 Mint'], condiments: [], priority: 'high' },
  { dishId: 'mango-lassi', sides: ['🧊 Ice', '🌿 Mint'], condiments: [], priority: 'high' },
  { dishId: 'sweet-lassi', sides: ['🧊 Ice', '🌿 Mint'], condiments: [], priority: 'high' },
  { dishId: 'salted-lassi', sides: ['🧊 Ice', '🌿 Mint'], condiments: [], priority: 'high' },
  { dishId: 'masala-chaai', sides: ['🍪 Biscuit', '🥜 Roasted Peanuts'], condiments: [], priority: 'high' },
  { dishId: 'chaas', sides: ['🧊 Ice', '🌿 Mint'], condiments: [], priority: 'high' },
  { dishId: 'nimbu-pani', sides: ['🧊 Ice', '🌿 Mint'], condiments: [], priority: 'high' },
  { dishId: 'jaljeera', sides: ['🧊 Ice'], condiments: [], priority: 'high' },
  { dishId: 'aam-panna', sides: ['🧊 Ice', '🌿 Mint'], condiments: [], priority: 'high' },
  { dishId: 'sol-kadhi', sides: ['🧊 Ice'], condiments: [], priority: 'high' },
  { dishId: 'coconut-water', sides: [], condiments: [], priority: 'high' },
  { dishId: 'thandai', sides: ['🧊 Ice', '🌿 Mint'], condiments: [], priority: 'high' },
  { dishId: 'badam-milk', sides: ['🧊 Ice'], condiments: [], priority: 'high' },
  { dishId: 'sattu-sharbat', sides: ['🧊 Ice'], condiments: [], priority: 'high' },
  { dishId: 'ginger-lemon-tea', sides: ['🍪 Biscuit'], condiments: [], priority: 'high' },
  { dishId: 'seasonal-fruit-juice', sides: ['🧊 Ice'], condiments: [], priority: 'high' },
  { dishId: 'kokam-sherbhat', sides: ['🧊 Ice'], condiments: [], priority: 'high' },
  { dishId: 'kulfi', sides: [], condiments: [], dessert: 'Kulfi', priority: 'high' },
  { dishId: 'mango-kulfi', sides: [], condiments: [], dessert: 'Mango Kulfi', priority: 'high' },
  { dishId: 'gulab-jamun', sides: [], condiments: [], dessert: 'Gulab Jamun', priority: 'high' },
  { dishId: 'jalebi', sides: [], condiments: [], dessert: 'Jalebi', priority: 'high' },
  { dishId: 'rasgulla', sides: [], condiments: [], dessert: 'Rasgulla', priority: 'high' },
  { dishId: 'kheer', sides: [], condiments: [], dessert: 'Kheer / Payasam', priority: 'high' },
  { dishId: 'rasmalai', sides: [], condiments: [], dessert: 'Rasmalai', priority: 'high' },
  { dishId: 'shrikhand', sides: [], condiments: [], dessert: 'Shrikhand', priority: 'high' },
  { dishId: 'gajar-halwa', sides: [], condiments: [], dessert: 'Gajar Halwa', priority: 'high' },
  { dishId: 'sooji-halwa', sides: [], condiments: [], dessert: 'Sooji Halwa', priority: 'high' },
  { dishId: 'barfi', sides: [], condiments: [], dessert: 'Barfi (Milk/Coconut)', priority: 'high' },
  { dishId: 'modak', sides: [], condiments: [], dessert: 'Modak', priority: 'high' },
  { dishId: 'phirni', sides: [], condiments: [], dessert: 'Phirni', priority: 'high' },
  { dishId: 'ladoo', sides: [], condiments: [], dessert: 'Ladoo (Besan/Motichoor)', priority: 'high' },
  { dishId: 'malpua', sides: [], condiments: [], dessert: 'Malpua', priority: 'high' },
  { dishId: 'aamras', sides: [], condiments: [], dessert: 'Aamras', priority: 'high' },
  { dishId: 'payasam', sides: [], condiments: [], dessert: 'Kheer / Payasam', priority: 'high' },
  { dishId: 'kesari-bath', sides: [], condiments: [], dessert: 'Kesari Bath', priority: 'high' },
  { dishId: 'basundi', sides: [], condiments: [], dessert: 'Basundi', priority: 'high' },
  { dishId: 'mishti-doi', sides: [], condiments: [], dessert: 'Mishti Doi', priority: 'high' },
  { dishId: 'sandesh', sides: [], condiments: [], dessert: 'Sandesh', priority: 'high' },
  { dishId: 'imarti', sides: [], condiments: [], dessert: 'Imarti', priority: 'high' },
  { dishId: 'dal-tadka', sides: ['Steamed Basmati', 'Jeera Rice'], condiments: ['Papad'], beverage: 'Chaas', priority: 'high' },
  { dishId: 'dal-makhani', sides: ['Butter Naan', 'Jeera Rice'], condiments: ['Cucumber Raita'], beverage: 'Sweet Lassi', dessert: 'Gulab Jamun', priority: 'high' },
  { dishId: 'paneer-butter-masala', sides: ['Butter Naan', 'Jeera Rice'], condiments: ['Cucumber Raita'], beverage: 'Sweet Lassi', dessert: 'Gulab Jamun', priority: 'high' },
  { dishId: 'shahi-paneer', sides: ['Butter Naan', 'Steamed Basmati'], condiments: ['Cucumber Raita'], beverage: 'Sweet Lassi', dessert: 'Kheer / Payasam', priority: 'high' },
  { dishId: 'kadai-paneer', sides: ['Tandoori Roti', 'Jeera Rice'], condiments: ['Kachumber Salad'], beverage: 'Chaas', priority: 'high' },
  { dishId: 'palak-paneer', sides: ['Tandoori Roti', 'Steamed Basmati'], condiments: ['Papad'], beverage: 'Chaas', priority: 'high' },
  { dishId: 'paneer-lababdar', sides: ['Butter Naan', 'Jeera Rice'], condiments: ['Cucumber Raita'], beverage: 'Sweet Lassi', priority: 'high' },
  { dishId: 'paneer-tikka-masala', sides: ['Butter Naan', 'Jeera Rice'], condiments: ['Mint Chutney'], beverage: 'Sweet Lassi', priority: 'high' },
  { dishId: 'malai-kofta', sides: ['Butter Naan', 'Jeera Rice'], condiments: ['Cucumber Raita'], beverage: 'Sweet Lassi', dessert: 'Gulab Jamun', priority: 'high' },
  { dishId: 'rajma-chawal', sides: ['Steamed Basmati'], condiments: ['Kachumber Salad'], beverage: 'Chaas', priority: 'high' },
  { dishId: 'chole', sides: ['Bhature', 'Tandoori Roti'], condiments: ['Kachumber Salad'], beverage: 'Sweet Lassi', priority: 'high' },
  { dishId: 'kadhi-pakora', sides: ['Steamed Basmati', 'Jeera Rice'], condiments: ['Papad'], beverage: 'Chaas', priority: 'high' },
  { dishId: 'mushroom-masala', sides: ['Tandoori Roti', 'Jeera Rice'], condiments: ['Kachumber Salad'], beverage: 'Chaas', priority: 'high' },
  { dishId: 'soybean-matar', sides: ['Tandoori Roti', 'Steamed Basmati'], condiments: ['Papad'], beverage: 'Chaas', priority: 'high' },
  { dishId: 'soya-chunks-masala', sides: ['Tandoori Roti', 'Jeera Rice'], condiments: ['Papad'], beverage: 'Chaas', priority: 'high' },
  { dishId: 'tofu-tikka-masala', sides: ['Tandoori Roti', 'Jeera Rice'], condiments: ['Mint Chutney'], beverage: 'Chaas', priority: 'high' },
  { dishId: 'aloo-kofta', sides: ['Tandoori Roti', 'Jeera Rice'], condiments: ['Cucumber Raita'], beverage: 'Chaas', priority: 'high' },
  { dishId: 'paneer-kofta', sides: ['Butter Naan', 'Jeera Rice'], condiments: ['Cucumber Raita'], beverage: 'Sweet Lassi', priority: 'high' },
  { dishId: 'mix-veg', sides: ['Tandoori Roti', 'Steamed Basmati'], condiments: ['Papad'], beverage: 'Chaas', priority: 'high' },
  { dishId: 'methi-aloo', sides: ['Tandoori Roti', 'Steamed Basmati'], condiments: ['Papad'], beverage: 'Chaas', priority: 'high' },
  { dishId: 'bhindi-do-pyaza', sides: ['Tandoori Roti', 'Steamed Basmati'], condiments: ['Papad'], beverage: 'Chaas', priority: 'high' },
  { dishId: 'gobi-aloo', sides: ['Tandoori Roti', 'Steamed Basmati'], condiments: ['Papad'], beverage: 'Chaas', priority: 'high' },
  { dishId: 'paneer-bhurji', sides: ['Tandoori Roti', 'Steamed Basmati'], condiments: ['Kachumber Salad'], beverage: 'Chaas', priority: 'high' },
  { dishId: 'alu-posto', sides: ['Steamed Basmati'], condiments: ['Papad'], beverage: 'Chaas', priority: 'high' },
  { dishId: 'shukto', sides: ['Steamed Basmati'], condiments: ['Papad'], beverage: 'Chaas', priority: 'high' },
  { dishId: 'chorer-ghonto', sides: ['Steamed Basmati'], condiments: ['Papad'], beverage: 'Chaas', priority: 'high' },
  { dishId: 'begun-bhaja', sides: ['Steamed Basmati'], condiments: ['Papad'], beverage: 'Chaas', priority: 'high' },
  { dishId: 'egg-bhurji', sides: ['Tandoori Roti'], condiments: ['Kachumber Salad'], beverage: 'Masala Chai', priority: 'high' },
  { dishId: 'masala-omelette', sides: ['Tandoori Roti'], condiments: ['Kachumber Salad'], beverage: 'Masala Chai', priority: 'high' },
  { dishId: 'aloo-tikki', sides: [], condiments: ['Mint Chutney'], beverage: 'Masala Chai', priority: 'high' },
  { dishId: 'aloo-bonda', sides: [], condiments: ['Coconut Chutney'], beverage: 'Masala Chai', priority: 'high' },
  { dishId: 'paneer-pakora', sides: [], condiments: ['Mint Chutney'], beverage: 'Masala Chai', priority: 'high' },
  { dishId: 'paneer-tikka', sides: [], condiments: ['Mint Chutney'], beverage: 'Sweet Lassi', priority: 'high' },
  { dishId: 'hariyali-paneer-tikka', sides: [], condiments: ['Mint Chutney'], beverage: 'Sweet Lassi', priority: 'high' },
  { dishId: 'malai-tikka', sides: [], condiments: ['Mint Chutney'], beverage: 'Sweet Lassi', priority: 'high' },
  { dishId: 'tandoori-chicken', sides: [], condiments: ['Mint Chutney'], beverage: 'Sweet Lassi', priority: 'high' },
  { dishId: 'seekh-kebab', sides: [], condiments: ['Mint Chutney'], beverage: 'Sweet Lassi', priority: 'high' },
  { dishId: 'jeera-rice', sides: [], condiments: ['Cucumber Raita'], beverage: 'Chaas', priority: 'high' },
  { dishId: 'veg-biryani', sides: [], condiments: ['Cucumber Raita'], beverage: 'Chaas', dessert: 'Kheer / Payasam', priority: 'high' },
  { dishId: 'veg-pulao-north', sides: [], condiments: ['Cucumber Raita'], beverage: 'Chaas', priority: 'high' },
  { dishId: 'veg-pulao', sides: [], condiments: ['Cucumber Raita'], beverage: 'Chaas', priority: 'high' },
  { dishId: 'lemon-rice', sides: [], condiments: ['Cucumber Raita'], beverage: 'Chaas', priority: 'high' },
  { dishId: 'curd-rice', sides: [], condiments: ['Mango Pickle'], beverage: 'Chaas', priority: 'high' },
  { dishId: 'dal-khichdi', sides: [], condiments: ['Papad'], beverage: 'Chaas', priority: 'high' },
  { dishId: 'sambar', sides: ['Steamed Basmati', 'Idli'], condiments: ['Coconut Chutney'], beverage: 'Filter Coffee', priority: 'high' },
  { dishId: 'rasam', sides: ['Steamed Basmati'], condiments: ['Papad'], beverage: 'Filter Coffee', priority: 'high' },
  { dishId: 'kootu', sides: ['Steamed Basmati'], condiments: ['Coconut Chutney'], beverage: 'Filter Coffee', priority: 'high' },
  { dishId: 'avial', sides: ['Steamed Basmati'], condiments: ['Papad'], beverage: 'Filter Coffee', priority: 'high' },
  { dishId: 'fish-curry-kerala', sides: ['Steamed Basmati'], condiments: ['Coconut Chutney'], beverage: 'Filter Coffee', priority: 'high' },
  { dishId: 'chicken-stew', sides: ['Appam'], condiments: ['Coconut Chutney'], beverage: 'Filter Coffee', priority: 'high' },
  { dishId: 'tofu-chettinad', sides: ['Steamed Basmati', 'Appam'], condiments: ['Coconut Chutney'], beverage: 'Filter Coffee', priority: 'high' },
  { dishId: 'veggie-kofta-south', sides: ['Steamed Basmati', 'Appam'], condiments: ['Coconut Chutney'], beverage: 'Filter Coffee', priority: 'high' },
  { dishId: 'poriyal', sides: ['Steamed Basmati'], condiments: ['Coconut Chutney'], beverage: 'Filter Coffee', priority: 'high' },
  { dishId: 'thoran', sides: ['Steamed Basmati'], condiments: ['Coconut Chutney'], beverage: 'Filter Coffee', priority: 'high' },
  { dishId: 'beans-poriyal', sides: ['Steamed Basmati'], condiments: ['Coconut Chutney'], beverage: 'Filter Coffee', priority: 'high' },
  { dishId: 'idli', sides: [], condiments: ['Coconut Chutney'], beverage: 'Filter Coffee', priority: 'high' },
  { dishId: 'rava-idli', sides: [], condiments: ['Coconut Chutney'], beverage: 'Filter Coffee', priority: 'high' },
  { dishId: 'dosa', sides: [], condiments: ['Coconut Chutney'], beverage: 'Filter Coffee', priority: 'high' },
  { dishId: 'rava-dosa', sides: [], condiments: ['Coconut Chutney'], beverage: 'Filter Coffee', priority: 'high' },
  { dishId: 'set-dosa', sides: [], condiments: ['Coconut Chutney'], beverage: 'Filter Coffee', priority: 'high' },
  { dishId: 'pesarattu', sides: [], condiments: ['Coconut Chutney'], beverage: 'Filter Coffee', priority: 'high' },
  { dishId: 'uttapam', sides: [], condiments: ['Coconut Chutney'], beverage: 'Filter Coffee', priority: 'high' },
  { dishId: 'medu-vada', sides: [], condiments: ['Coconut Chutney'], beverage: 'Filter Coffee', priority: 'high' },
  { dishId: 'dhokla', sides: [], condiments: ['Coconut Chutney'], beverage: 'Masala Chai', priority: 'high' },
  { dishId: 'instant-upma', sides: [], condiments: ['Coconut Chutney'], beverage: 'Filter Coffee', priority: 'high' },
  { dishId: 'rava-upma', sides: [], condiments: ['Coconut Chutney'], beverage: 'Filter Coffee', priority: 'high' },
  { dishId: 'vegetable-upma', sides: [], condiments: ['Coconut Chutney'], beverage: 'Filter Coffee', priority: 'high' },
  { dishId: 'bisi-bele-bath', sides: [], condiments: ['Coconut Chutney'], beverage: 'Filter Coffee', priority: 'high' },
  { dishId: 'khandvi', sides: [], condiments: ['Coconut Chutney'], beverage: 'Masala Chai', priority: 'high' },
  { dishId: 'sabudana-khichdi', sides: [], condiments: ['Coconut Chutney'], beverage: 'Masala Chai', priority: 'high' },
  { dishId: 'coconut-rice', sides: [], condiments: ['Cucumber Raita'], beverage: 'Filter Coffee', priority: 'high' },
  { dishId: 'tamarind-rice', sides: [], condiments: ['Papad'], beverage: 'Filter Coffee', priority: 'high' },
  { dishId: 'pong', sides: [], condiments: ['Coconut Chutney'], beverage: 'Filter Coffee', priority: 'high' },
  { dishId: 'curd-rice-south', sides: [], condiments: ['Mango Pickle'], beverage: 'Filter Coffee', priority: 'high' },
  { dishId: 'sambhar-rice', sides: [], condiments: ['Papad'], beverage: 'Filter Coffee', priority: 'high' },
  { dishId: 'poha-mp', sides: [], condiments: ['Coconut Chutney'], beverage: 'Masala Chai', priority: 'high' },
  { dishId: 'aloo-paratha', sides: [], condiments: ['Cucumber Raita'], beverage: 'Masala Chai', priority: 'high' },
  { dishId: 'gobhi-paratha', sides: [], condiments: ['Cucumber Raita'], beverage: 'Masala Chai', priority: 'high' },
  { dishId: 'mooli-paratha', sides: [], condiments: ['Cucumber Raita'], beverage: 'Masala Chai', priority: 'high' },
  { dishId: 'dal-paratha', sides: [], condiments: ['Cucumber Raita'], beverage: 'Masala Chai', priority: 'high' },
  { dishId: 'methi-paratha', sides: [], condiments: ['Cucumber Raita'], beverage: 'Masala Chai', priority: 'high' },
  { dishId: 'mix-paratha', sides: [], condiments: ['Cucumber Raita'], beverage: 'Masala Chai', priority: 'high' },
  { dishId: 'bread-toast', sides: [], condiments: [], beverage: 'Masala Chai', priority: 'high' },
  { dishId: 'french-toast', sides: [], condiments: [], beverage: 'Masala Chai', priority: 'high' },
  { dishId: 'sandwich', sides: [], condiments: [], beverage: 'Masala Chai', priority: 'high' },
  { dishId: 'methi-thepla', sides: [], condiments: ['Cucumber Raita'], beverage: 'Masala Chai', priority: 'high' },
  { dishId: 'shankhali', sides: [], condiments: [], beverage: 'Masala Chai', priority: 'high' },
  { dishId: 'kachori', sides: [], condiments: ['Mint Chutney'], beverage: 'Masala Chai', priority: 'high' },
  { dishId: 'egg-appam', sides: [], condiments: ['Coconut Chutney'], beverage: 'Filter Coffee', priority: 'high' },
  { dishId: 'egg-podi-dosa', sides: [], condiments: ['Coconut Chutney'], beverage: 'Filter Coffee', priority: 'high' },
  { dishId: 'pav-bhaji', sides: [], condiments: ['Kachumber Salad'], beverage: 'Masala Chai', priority: 'high' },
  { dishId: 'misal-pav', sides: [], condiments: ['Kachumber Salad'], beverage: 'Masala Chai', priority: 'high' },
  { dishId: 'vada-pav', sides: [], condiments: ['Mint Chutney'], beverage: 'Masala Chai', priority: 'high' },
  { dishId: 'dal-dhokli', sides: [], condiments: ['Papad'], beverage: 'Chaas', priority: 'high' },
  { dishId: 'gujarati-kadhi', sides: ['Steamed Basmati'], condiments: ['Papad'], beverage: 'Chaas', priority: 'high' },
  { dishId: 'handvo', sides: [], condiments: ['Coconut Chutney'], beverage: 'Masala Chai', priority: 'high' },
  { dishId: 'thepla', sides: [], condiments: ['Cucumber Raita'], beverage: 'Masala Chai', priority: 'high' },
  { dishId: 'undhiyu', sides: ['Bhakri'], condiments: ['Papad'], beverage: 'Chaas', priority: 'high' },
  { dishId: 'sev-puri', sides: [], condiments: ['Mint Chutney'], beverage: 'Masala Chai', priority: 'high' },
  { dishId: 'dahi-puri', sides: [], condiments: ['Mint Chutney'], beverage: 'Masala Chai', priority: 'high' },
  { dishId: 'pani-puri', sides: [], condiments: [], beverage: 'Masala Chai', priority: 'high' },
  { dishId: 'dahi-bhalla', sides: [], condiments: ['Mint Chutney'], beverage: 'Masala Chai', priority: 'high' },
  { dishId: 'papdi-chaat', sides: [], condiments: ['Mint Chutney'], beverage: 'Masala Chai', priority: 'high' },
  { dishId: 'ragda-pattice', sides: [], condiments: ['Mint Chutney'], beverage: 'Masala Chai', priority: 'high' },
  { dishId: 'samosa', sides: [], condiments: ['Mint Chutney'], beverage: 'Masala Chai', priority: 'high' },
  { dishId: 'chole-tikki', sides: [], condiments: ['Mint Chutney'], beverage: 'Masala Chai', priority: 'high' },
  { dishId: 'veg-manchurian', sides: [], condiments: ['Kachumber Salad'], beverage: 'Masala Chai', priority: 'high' },
  { dishId: 'machher-jhol', sides: ['Steamed Basmati'], condiments: ['Papad'], beverage: 'Chaas', priority: 'high' },
  { dishId: 'mutton-kosha', sides: ['Steamed Basmati', 'Luchi'], condiments: ['Papad'], beverage: 'Chaas', priority: 'high' },
  { dishId: 'chingri-malai', sides: ['Steamed Basmati'], condiments: ['Papad'], beverage: 'Chaas', priority: 'high' },
  { dishId: 'bengali-kofta', sides: ['Steamed Basmati'], condiments: ['Papad'], beverage: 'Chaas', priority: 'high' },
  { dishId: 'dalna', sides: ['Steamed Basmati'], condiments: ['Papad'], beverage: 'Chaas', priority: 'high' },
  { dishId: 'luchi-aloo', sides: [], condiments: ['Papad'], beverage: 'Masala Chai', priority: 'high' },
  { dishId: 'thukpa', sides: [], condiments: [], beverage: 'Ginger Lemon', priority: 'high' },
  { dishId: 'momos', sides: [], condiments: ['Coconut Chutney'], beverage: 'Masala Chai', priority: 'high' },
  { dishId: 'dal-tadka-central', sides: ['Steamed Basmati'], condiments: ['Papad'], beverage: 'Chaas', priority: 'high' },
  { dishId: 'chole-central', sides: ['Bhature'], condiments: ['Kachumber Salad'], beverage: 'Chaas', priority: 'high' },
  { dishId: 'kadai-mushroom', sides: ['Tandoori Roti', 'Steamed Basmati'], condiments: ['Papad'], beverage: 'Chaas', priority: 'high' },
  { dishId: 'amritsari-chole', sides: ['Bhature'], condiments: ['Kachumber Salad'], beverage: 'Sweet Lassi', priority: 'high' },
  { dishId: 'mp-kofta', sides: ['Tandoori Roti', 'Steamed Basmati'], condiments: ['Papad'], beverage: 'Chaas', priority: 'high' },
  { dishId: 'dal-kofta', sides: ['Tandoori Roti', 'Steamed Basmati'], condiments: ['Papad'], beverage: 'Chaas', priority: 'high' },
  { dishId: 'poha-mp', sides: [], condiments: [], beverage: 'Masala Chai', priority: 'high' },
  { dishId: 'dal-bafla', sides: [], condiments: ['Papad'], beverage: 'Chaas', dessert: 'Gulab Jamun', priority: 'high' },
  { dishId: 'litti-chokha', sides: [], condiments: ['Papad'], beverage: 'Chaas', priority: 'high' },
  { dishId: 'butter-naan', sides: [], condiments: [], beverage: 'Chaas', priority: 'high' },
  { dishId: 'tandoori-roti', sides: [], condiments: [], beverage: 'Chaas', priority: 'high' },
  { dishId: 'white-bread', sides: [], condiments: [], beverage: 'Masala Chai', priority: 'high' },
  { dishId: 'brown-bread', sides: [], condiments: [], beverage: 'Masala Chai', priority: 'high' },
  { dishId: 'milk-bread', sides: [], condiments: [], beverage: 'Masala Chai', priority: 'high' },
  { dishId: 'pav', sides: [], condiments: [], beverage: 'Masala Chai', priority: 'high' },
  { dishId: 'bhakri', sides: [], condiments: [], beverage: 'Chaas', priority: 'high' },
  { dishId: 'jolada-roti', sides: [], condiments: [], beverage: 'Chaas', priority: 'high' },
  { dishId: 'khoba-roti', sides: [], condiments: [], beverage: 'Chaas', priority: 'high' },
  { styles: ['gravy'], sides: ['Tandoori Roti', 'Steamed Basmati'], condiments: ['Cucumber Raita'], beverage: 'Chaas', priority: 'low' },
  { styles: ['dry-sabzi'], sides: ['Tandoori Roti', 'Steamed Basmati'], condiments: ['Papad'], beverage: 'Chaas', priority: 'low' },
  { styles: ['fry-tadka'], sides: ['Tandoori Roti'], condiments: ['Kachumber Salad'], beverage: 'Masala Chai', priority: 'low' },
  { styles: ['roast-tandoori'], sides: [], condiments: ['Mint Chutney'], beverage: 'Sweet Lassi', priority: 'low' },
  { styles: ['rice-biryani'], sides: [], condiments: ['Cucumber Raita'], beverage: 'Chaas', priority: 'low' },
  { styles: ['steam-boil'], sides: [], condiments: ['Coconut Chutney'], beverage: 'Filter Coffee', priority: 'low' },
  { styles: ['breakfast'], sides: [], condiments: [], beverage: 'Masala Chai', priority: 'low' },
  { styles: ['beverage'], sides: [], condiments: [], priority: 'low' },
  { styles: ['sweet-dessert'], sides: [], condiments: [], priority: 'low' },
  { styles: ['bread'], sides: [], condiments: [], beverage: 'Chaas', priority: 'low' },
  { styles: ['side'], sides: [], condiments: [], priority: 'low' },
  { regions: ['north'], sides: ['Tandoori Roti', 'Jeera Rice'], condiments: ['Cucumber Raita'], beverage: 'Chaas', priority: 'low' },
  { regions: ['south'], sides: ['Steamed Basmati'], condiments: ['Coconut Chutney'], beverage: 'Filter Coffee', priority: 'low' },
  { regions: ['west'], sides: ['Bhakri'], condiments: ['Papad'], beverage: 'Chaas', priority: 'low' },
  { regions: ['east'], sides: ['Steamed Basmati'], condiments: ['Papad'], beverage: 'Chaas', priority: 'low' },
  { regions: ['central'], sides: ['Tandoori Roti', 'Steamed Basmati'], condiments: ['Papad'], beverage: 'Chaas', priority: 'low' },
  { regions: ['northeast'], sides: ['Steamed Basmati'], condiments: [], beverage: 'Ginger Lemon', priority: 'low' },
];

export function validatePairingRules(): PairingRule[] {
  return PAIRING_RULES.map((rule, i) => {
    if (!rule.dishId && !rule.dishName && !rule.styles && !rule.regions) {
      throw new Error(`PairingRule[${i}] must have at least one match key`);
    }
    return rule;
  });
}

validatePairingRules();

let _pairingIndex: Map<string, PairingRule[]> | null = null;

export function buildPairingIndex(rules: PairingRule[]): Map<string, PairingRule[]> {
  const index = new Map<string, PairingRule[]>();
  for (const rule of rules) {
    if (rule.dishId) {
      const existing = index.get(rule.dishId);
      if (existing) {
        existing.push(rule);
      } else {
        index.set(rule.dishId, [rule]);
      }
    }
    if (rule.pairedWith) {
      const existing = index.get(rule.pairedWith);
      if (existing) {
        existing.push(rule);
      } else {
        index.set(rule.pairedWith, [rule]);
      }
    }
  }
  return index;
}

export function getRulesForDish(dishId: string): PairingRule[] {
  if (!_pairingIndex) {
    _pairingIndex = buildPairingIndex(PAIRING_RULES);
  }
  return _pairingIndex.get(dishId) ?? [];
}

export function clearPairingIndex(): void {
  _pairingIndex = null;
}
