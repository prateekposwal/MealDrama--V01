export type DishStyle =
  | 'gravy'
  | 'dry-sabzi'
  | 'fry-tadka'
  | 'roast-tandoori'
  | 'steam-boil'
  | 'rice-biryani'
  | 'breakfast'
  | 'sweet-dessert'
  | 'bread'
  | 'side'
  | 'beverage'
  | 'soup';

export interface StyleRoutingOverrides {
  breads?: string[];
  rice?: string[];
  sides?: string[];
  beverages?: string[];
  inferBread: boolean;
  inferRice: boolean;
}

const DISH_STYLE_MAP: Record<string, { style: DishStyle; subTag?: string }> = {
  // ── Gravy ──────────────────────────────────────────────
  'dal-tadka': { style: 'gravy', subTag: 'tempered' },
  'dal-makhani': { style: 'gravy', subTag: 'creamy' },
  'soybean-matar': { style: 'gravy', subTag: 'wet' },
  'soya-chunks-masala': { style: 'gravy', subTag: 'wet' },
  'paneer-butter-masala': { style: 'gravy', subTag: 'creamy' },
  'shahi-paneer': { style: 'gravy', subTag: 'creamy' },
  'kadai-paneer': { style: 'gravy', subTag: 'spicy' },
  'palak-paneer': { style: 'gravy', subTag: 'green' },
  'paneer-lababdar': { style: 'gravy', subTag: 'rich' },
  'tofu-tikka-masala': { style: 'gravy', subTag: 'creamy' },
  'paneer-tikka-masala': { style: 'gravy', subTag: 'smoky' },
  'malai-kofta': { style: 'gravy', subTag: 'creamy' },
  'aloo-kofta': { style: 'gravy', subTag: 'creamy' },
  'paneer-kofta': { style: 'gravy', subTag: 'creamy' },
  'mushroom-masala': { style: 'gravy', subTag: 'spicy' },
  'rajma-chawal': { style: 'gravy', subTag: 'thick' },
  'chole': { style: 'gravy', subTag: 'spicy' },
  'kadhi-pakora': { style: 'gravy', subTag: 'tangy' },
  'fish-curry-kerala': { style: 'gravy', subTag: 'coconut' },
  'egg-curry-north': { style: 'gravy', subTag: 'spicy' },
  'chettinad-egg-masala': { style: 'gravy', subTag: 'spicy' },
  'chicken-stew': { style: 'gravy', subTag: 'coconut' },
  'andhra-prawn-masala': { style: 'gravy', subTag: 'spicy' },
  'tofu-chettinad': { style: 'gravy', subTag: 'spicy' },
  'rogan-josh': { style: 'gravy', subTag: 'rich' },
  'butter-chicken': { style: 'gravy', subTag: 'creamy' },
  'veggie-kofta-south': { style: 'gravy', subTag: 'coconut' },
  'machher-jhol': { style: 'gravy', subTag: 'light' },
  'mutton-kosha': { style: 'gravy', subTag: 'rich' },
  'chingri-malai': { style: 'gravy', subTag: 'coconut' },
  'soybean-curry': { style: 'gravy', subTag: 'wet' },
  'chicken-bastar': { style: 'gravy', subTag: 'spicy' },
  'bengali-kofta': { style: 'gravy', subTag: 'light' },
  'pooja-kofta': { style: 'gravy', subTag: 'light' },
  'dalna': { style: 'gravy', subTag: 'light' },
  'gujarati-kadhi': { style: 'gravy', subTag: 'sweet' },
  'mp-kofta': { style: 'gravy', subTag: 'creamy' },
  'dal-kofta': { style: 'gravy', subTag: 'creamy' },
  'dal-tadka-central': { style: 'gravy', subTag: 'tempered' },
  'chole-central': { style: 'gravy', subTag: 'spicy' },
  'kadai-mushroom': { style: 'gravy', subTag: 'spicy' },
  'amritsari-chole': { style: 'gravy', subTag: 'spicy' },

  // ── Dry / Sabzi ────────────────────────────────────────
  'mix-veg': { style: 'dry-sabzi', subTag: 'dry' },
  'methi-aloo': { style: 'dry-sabzi', subTag: 'dry' },
  'bhindi-do-pyaza': { style: 'dry-sabzi', subTag: 'dry' },
  'gobi-aloo': { style: 'dry-sabzi', subTag: 'dry' },
  'paneer-bhurji': { style: 'dry-sabzi', subTag: 'crumble' },
  'paneer-bhurji-central': { style: 'dry-sabzi', subTag: 'crumble' },
  'alu-posto': { style: 'dry-sabzi', subTag: 'poppy' },
  'shukto': { style: 'dry-sabzi', subTag: 'bitter' },
  'chorer-ghonto': { style: 'dry-sabzi', subTag: 'dry' },
  'begun-bhaja': { style: 'dry-sabzi', subTag: 'fried' },
  'salmon-paturi': { style: 'dry-sabzi', subTag: 'steamed' },

  // ── Fry / Tadka ────────────────────────────────────────
  'egg-bhurji': { style: 'fry-tadka', subTag: 'crumble' },
  'masala-omelette': { style: 'fry-tadka', subTag: 'egg' },
  'masala-prawn-fry': { style: 'fry-tadka', subTag: 'crisp' },
  'bhetki-fry': { style: 'fry-tadka', subTag: 'crisp' },
  'maach-bhaja': { style: 'fry-tadka', subTag: 'crisp' },
  'soya-chunks-do-pyaza': { style: 'fry-tadka', subTag: 'crisp' },
  'aloo-tikki': { style: 'fry-tadka', subTag: 'crisp' },
  'aloo-bonda': { style: 'fry-tadka', subTag: 'fried' },
  'paneer-pakora': { style: 'fry-tadka', subTag: 'fried' },

  // ── Roast / Tandoori ───────────────────────────────────
  'paneer-tikka': { style: 'roast-tandoori', subTag: 'tandoor' },
  'hariyali-paneer-tikka': { style: 'roast-tandoori', subTag: 'tandoor' },
  'malai-tikka': { style: 'roast-tandoori', subTag: 'tandoor' },
  'tandoori-chicken': { style: 'roast-tandoori', subTag: 'tandoor' },
  'seekh-kebab': { style: 'roast-tandoori', subTag: 'grilled' },

  // ── Steam / Boil ───────────────────────────────────────
  'idli': { style: 'steam-boil', subTag: 'steamed' },
  'rava-idli': { style: 'steam-boil', subTag: 'steamed' },
  'dosa': { style: 'steam-boil', subTag: 'fermented' },
  'rava-dosa': { style: 'steam-boil', subTag: 'crisp' },
  'set-dosa': { style: 'steam-boil', subTag: 'spongy' },
  'pesarattu': { style: 'steam-boil', subTag: 'green' },
  'uttapam': { style: 'steam-boil', subTag: 'thick' },
  'medu-vada': { style: 'steam-boil', subTag: 'fried' },
  'dhokla': { style: 'steam-boil', subTag: 'fermented' },
  'momos': { style: 'steam-boil', subTag: 'steamed' },
  'dal-khichdi': { style: 'steam-boil', subTag: 'porridge' },
  'sabudana-khichdi': { style: 'steam-boil', subTag: 'light' },
  'instant-upma': { style: 'steam-boil', subTag: 'dry' },
  'rava-upma': { style: 'steam-boil', subTag: 'dry' },
  'vegetable-upma': { style: 'steam-boil', subTag: 'dry' },
  'bisi-bele-bath': { style: 'steam-boil', subTag: 'spiced' },
  'khandvi': { style: 'steam-boil', subTag: 'rolled' },

  // ── Rice / Biryani ─────────────────────────────────────
  'jeera-rice': { style: 'rice-biryani', subTag: 'plain' },
  'veg-biryani': { style: 'rice-biryani', subTag: 'layered' },
  'hyderabadi-biryani': { style: 'rice-biryani', subTag: 'dum' },
  'veg-pulao-north': { style: 'rice-biryani', subTag: 'aromatic' },
  'veg-pulao': { style: 'rice-biryani', subTag: 'aromatic' },
  'lemon-rice': { style: 'rice-biryani', subTag: 'tangy' },
  'curd-rice': { style: 'rice-biryani', subTag: 'cooling' },
  'tamarind-rice': { style: 'rice-biryani', subTag: 'tangy' },
  'coconut-rice': { style: 'rice-biryani', subTag: 'fragrant' },
  'tomato-rice': { style: 'rice-biryani', subTag: 'spicy' },
  'egg-fried-rice': { style: 'rice-biryani', subTag: 'fried' },
  'sambhar-rice': { style: 'rice-biryani', subTag: 'south' },
  'pakhala-bhata': { style: 'rice-biryani', subTag: 'fermented' },
  'muri-ghonto': { style: 'rice-biryani', subTag: 'head' },

  // ── Breakfast ──────────────────────────────────────────
  'poha-mp': { style: 'breakfast', subTag: 'flattened' },
  'aloo-paratha': { style: 'breakfast', subTag: 'stuffed' },
  'bedmi-puri': { style: 'breakfast', subTag: 'fried' },
  'gobhi-paratha': { style: 'breakfast', subTag: 'stuffed' },
  'mooli-paratha': { style: 'breakfast', subTag: 'stuffed' },
  'dal-paratha': { style: 'breakfast', subTag: 'stuffed' },
  'methi-paratha': { style: 'breakfast', subTag: 'stuffed' },
  'mix-paratha': { style: 'breakfast', subTag: 'stuffed' },
  'bread-toast': { style: 'breakfast', subTag: 'toasted' },
  'french-toast': { style: 'breakfast', subTag: 'sweet' },
  'sandwich': { style: 'breakfast', subTag: 'stacked' },
  'methi-thepla': { style: 'breakfast', subTag: 'spiced' },
  'shankhali': { style: 'breakfast', subTag: 'fried' },
  'chole-bhature': { style: 'breakfast', subTag: 'fried' },
  'kachori': { style: 'breakfast', subTag: 'fried' },
  'egg-appam': { style: 'breakfast', subTag: 'egg' },
  'egg-podi-dosa': { style: 'breakfast', subTag: 'egg' },

  // ── Sweet / Dessert ────────────────────────────────────
  'gulab-jamun': { style: 'sweet-dessert', subTag: 'fried' },
  'jalebi': { style: 'sweet-dessert', subTag: 'crispy' },
  'rasgulla': { style: 'sweet-dessert', subTag: 'spongy' },
  'kheer': { style: 'sweet-dessert', subTag: 'rice' },
  'kesari-bath': { style: 'sweet-dessert', subTag: 'semolina' },
  'aamras': { style: 'sweet-dessert', subTag: 'pulp' },
  'shrikhand': { style: 'sweet-dessert', subTag: 'yogurt' },
  'basundi': { style: 'sweet-dessert', subTag: 'thick' },
  'mishti-doi': { style: 'sweet-dessert', subTag: 'yogurt' },
  'sandesh': { style: 'sweet-dessert', subTag: 'cheese' },
  'imarti': { style: 'sweet-dessert', subTag: 'crispy' },
  'payasam': { style: 'sweet-dessert', subTag: 'kheer' },

  // ── Bread (self-carb, not a dish needing routing) ──────
  'tandoori-roti': { style: 'bread', subTag: 'tandoor' },
  'butter-naan': { style: 'bread', subTag: 'tandoor' },
  'white-bread': { style: 'bread', subTag: 'white' },
  'brown-bread': { style: 'bread', subTag: 'brown' },
  'milk-bread': { style: 'bread', subTag: 'milk' },
  'pav': { style: 'bread', subTag: 'soft' },
  'bhakri': { style: 'bread', subTag: 'millet' },
  'jolada-roti': { style: 'bread', subTag: 'millet' },
  'khoba-roti': { style: 'bread', subTag: 'thick' },
  'luchi-aloo': { style: 'bread', subTag: 'fried' },
  'dal-bafla': { style: 'bread', subTag: 'baked' },
  'litti-chokha': { style: 'bread', subTag: 'baked' },

  // ── Side / Accompaniment ───────────────────────────────
  'dahi-bhalla': { style: 'side', subTag: 'cooling' },
  'papdi-chaat': { style: 'side', subTag: 'crisp' },
  'sev-poori': { style: 'side', subTag: 'crisp' },
  'dahi-puri': { style: 'side', subTag: 'cooling' },
  'chole-tikki': { style: 'side', subTag: 'hearty' },
  'pani-puri': { style: 'side', subTag: 'crisp' },
  'samosa': { style: 'side', subTag: 'fried' },
  'veg-manchurian': { style: 'side', subTag: 'fried' },
  'sev-vada': { style: 'side', subTag: 'fried' },
  'ragda-pattice': { style: 'side', subTag: 'hearty' },
  'thukpa': { style: 'soup', subTag: 'noodle' },
  'arunachal-thukpa-veg': { style: 'soup', subTag: 'noodle' },
  'thenthuk': { style: 'soup', subTag: 'hand-pulled' },
  'rasam': { style: 'soup', subTag: 'tangy' },
  'pappu-charu': { style: 'soup', subTag: 'dal' },
  'pachi-palusu': { style: 'soup', subTag: 'buttermilk' },
  'mulligatawny': { style: 'soup', subTag: 'pepper' },
  'coconut-veg-stew': { style: 'soup', subTag: 'coconut' },
  'tamatar-ka-shorba': { style: 'soup', subTag: 'tomato' },
  'dal-panchmel-shorba': { style: 'soup', subTag: 'dal' },
  'bajre-ka-raab': { style: 'soup', subTag: 'millet' },
  'gahat-ka-shorba': { style: 'soup', subTag: 'legume' },
  'palak-ka-shorba': { style: 'soup', subTag: 'green' },
  'tomato-saar': { style: 'soup', subTag: 'tangy' },
  'chana-sattu-soup': { style: 'soup', subTag: 'gram' },
  'nandu-rasam': { style: 'soup', subTag: 'crab' },
  'naatu-kozhi-rasam': { style: 'soup', subTag: 'chicken' },
  'ulava-charu': { style: 'soup', subTag: 'horsegram' },
  'badam-shorba': { style: 'soup', subTag: 'almond' },
  'yakhni': { style: 'soup', subTag: 'mutton-broth' },
  'paya-shorba': { style: 'soup', subTag: 'trotter' },
  'sweet-corn-veg-soup': { style: 'soup', subTag: 'sweet-corn' },
  'sweet-corn-chicken-soup': { style: 'soup', subTag: 'sweet-corn' },
  'manchow-soup': { style: 'soup', subTag: 'garlic' },
  'palak-soup': { style: 'soup', subTag: 'spinach' },
  'rugra': { style: 'steam-boil', subTag: 'wild' },
  'chamthong': { style: 'steam-boil', subTag: 'stew' },
  'morok-metpa': { style: 'side', subTag: 'chutney' },
  'singju': { style: 'side', subTag: 'salad' },
  'paaknam': { style: 'steam-boil', subTag: 'savory' },
  'chak-hao-kheer': { style: 'sweet-dessert', subTag: 'purple-rice' },
  'alu-kangmet': { style: 'side', subTag: 'mashed' },
  'nga-thongba': { style: 'gravy', subTag: 'fish' },
  'nakham-bitchi': { style: 'soup', subTag: 'smoked-fish' },
  'pumaloi': { style: 'steam-boil', subTag: 'rice' },
  'doh-neiiong': { style: 'gravy', subTag: 'black-sesame' },
  'tungrymbai': { style: 'fry-tadka', subTag: 'fermented' },
  'pudoh': { style: 'steam-boil', subTag: 'rice-pork' },
  'minil-songa': { style: 'steam-boil', subTag: 'sticky-rice' },
  'pukhlein': { style: 'sweet-dessert', subTag: 'jaggery' },
  'sakin-gata': { style: 'steam-boil', subTag: 'rice-cake' },
  'kyat': { style: 'beverage', subTag: 'fermented' },
  'puttu-kadala': { style: 'steam-boil', subTag: 'rice-cake' },
  'appam': { style: 'steam-boil', subTag: 'fermented' },
  'nad-an-k-varuthathu': { style: 'fry-tadka', subTag: 'chicken' },
  'kerala-prawn-curry': { style: 'gravy', subTag: 'prawn' },
  'naadan-beef-fry': { style: 'fry-tadka', subTag: 'beef' },
  'malabar-parota': { style: 'bread', subTag: 'flaky' },
  'kerala-fish-molee': { style: 'gravy', subTag: 'fish' },
  'pazham-pori': { style: 'sweet-dessert', subTag: 'banana' },
  'palada-payasam': { style: 'sweet-dessert', subTag: 'rice-ada' },
  'sadhya': { style: 'rice-biryani', subTag: 'festive' },
  'erissery': { style: 'gravy', subTag: 'pumpkin' },
  'thalassery-biryani': { style: 'rice-biryani', subTag: 'malabar' },
  'naadan-kozhi-curry': { style: 'gravy', subTag: 'chicken' },
  'erachi-varutharacha': { style: 'gravy', subTag: 'mutton' },
  'ada-pradhaman': { style: 'sweet-dessert', subTag: 'coconut' },
  'chatti-pathiri': { style: 'sweet-dessert', subTag: 'layered' },
  'kappa-meen-curry': { style: 'gravy', subTag: 'fish' },
  'mussel-stir-fry': { style: 'fry-tadka', subTag: 'mussel' },
  'thattu-dosa': { style: 'steam-boil', subTag: 'crispy' },
  'banana-halwa': { style: 'sweet-dessert', subTag: 'halwa' },
  'korri-gassi': { style: 'gravy', subTag: 'chicken' },
  'kundapura-koli-saaru': { style: 'gravy', subTag: 'chicken' },
  'allugedda': { style: 'side', subTag: 'potato' },
  'mysore-pak': { style: 'sweet-dessert', subTag: 'besan' },
  'coorg-pandi-curry': { style: 'gravy', subTag: 'pork' },
  'haalbai': { style: 'sweet-dessert', subTag: 'coconut' },
  'mangalorean-biryani': { style: 'rice-biryani', subTag: 'mangalore' },
  'kane-rava-fry': { style: 'fry-tadka', subTag: 'fish' },
  'udupi-sambar': { style: 'gravy', subTag: 'sambar' },
  'mango-chutney': { style: 'side', subTag: 'chutney' },
  'mysore-bonda': { style: 'steam-boil', subTag: 'fried' },
  'sagu': { style: 'gravy', subTag: 'vegetable' },
  'pori-urundai': { style: 'sweet-dessert', subTag: 'puffed-rice' },
  'maddur-vada': { style: 'steam-boil', subTag: 'fried' },
  'chiroti': { style: 'sweet-dessert', subTag: 'flaky' },
  'tatte-idli': { style: 'steam-boil', subTag: 'plate-idli' },
  'chitranna': { style: 'rice-biryani', subTag: 'lemon' },
  'gojju': { style: 'gravy', subTag: 'tamarind' },
  'ragi-mudde': { style: 'steam-boil', subTag: 'millet' },
  'ennegai': { style: 'gravy', subTag: 'eggplant' },
  'anishi': { style: 'gravy', subTag: 'colocasia' },
  'boiled-vegetables': { style: 'steam-boil', subTag: 'steamed' },
  'koat-pitha': { style: 'steam-boil', subTag: 'fried' },
  'bamboo-shoot-fry': { style: 'fry-tadka', subTag: 'bamboo' },
  'panch-phoran-tarka': { style: 'gravy', subTag: 'five-spice' },
  'chhum-han': { style: 'steam-boil', subTag: 'steamed' },
  'misa-mach-poora': { style: 'roast-tandoori', subTag: 'grilled' },
  'zu': { style: 'beverage', subTag: 'herbal' },
  'lubrusca-wine': { style: 'beverage', subTag: 'wine' },
  'phagshapa': { style: 'gravy', subTag: 'pork' },
  'sha-phaley': { style: 'steam-boil', subTag: 'fried' },
  'gundruk': { style: 'side', subTag: 'fermented' },
  'dal-bhat': { style: 'rice-biryani', subTag: 'staple' },
  'dhindo': { style: 'steam-boil', subTag: 'millet' },
  'sel-roti': { style: 'bread', subTag: 'ring' },
  'chang': { style: 'beverage', subTag: 'millet' },
  'kodo-ko-roti': { style: 'bread', subTag: 'millet' },
  'masauyra-curry': { style: 'gravy', subTag: 'fermented' },
  'singri-ki-sabzi': { style: 'dry-sabzi', subTag: 'desert-bean' },
  'mithe-chawal': { style: 'rice-biryani', subTag: 'sweet' },
  'bajara-khichri': { style: 'rice-biryani', subTag: 'bajra' },
  'modur-pulav': { style: 'rice-biryani', subTag: 'sweet' },
  'matschgand': { style: 'gravy', subTag: 'meatballs' },
  'yakhni-curry': { style: 'gravy', subTag: 'yogurt' },
  'dum-olav': { style: 'gravy', subTag: 'potato' },
  'muji-gaad': { style: 'gravy', subTag: 'fish' },
  'aab-gosht': { style: 'gravy', subTag: 'mutton' },
  'goshtaba': { style: 'gravy', subTag: 'minced' },
  'lyodur-tschaman': { style: 'gravy', subTag: 'paneer' },
  'skyu': { style: 'steam-boil', subTag: 'wheat' },
  'khambir': { style: 'bread', subTag: 'ladakhi' },
  'gathiya': { style: 'fry-tadka', subTag: 'besan' },
  'dabeli': { style: 'bread', subTag: 'pressed' },
  'chorafali': { style: 'fry-tadka', subTag: 'fluffy' },
  'doodhpak': { style: 'sweet-dessert', subTag: 'rice' },
  'khakhra': { style: 'bread', subTag: 'crisp' },
  'murghanu-shaak': { style: 'gravy', subTag: 'gujarati' },
  'gota': { style: 'fry-tadka', subTag: 'fenugreek' },
  'sev-tameta-nu-shak': { style: 'gravy', subTag: 'tomato' },
  'lilva-kachori': { style: 'fry-tadka', subTag: 'pigeon-pea' },
  'fafda-jalebi': { style: 'sweet-dessert', subTag: 'combo' },
  'muthiya': { style: 'steam-boil', subTag: 'bottle-gourd' },
  'bharli-vangi': { style: 'dry-sabzi', subTag: 'stuffed' },
  'chepa-pulusu': { style: 'gravy', subTag: 'tamarind' },
  'dondakaya-fry': { style: 'fry-tadka', subTag: 'ivy-gourd' },
  'achari-baingan': { style: 'gravy', subTag: 'pickle' },
  'aloo-kulcha': { style: 'breakfast', subTag: 'stuffed' },
  'aloo-shimla-mirch': { style: 'dry-sabzi', subTag: 'capsicum' },
  'khoya-paneer': { style: 'gravy', subTag: 'khoya' },
  'lobiya': { style: 'gravy', subTag: 'black-eyed' },
  'mushroom-do-pyaza': { style: 'gravy', subTag: 'onion' },
   'mushroom-matar': { style: 'gravy', subTag: 'pea' },
   'kerala-egg-roast': { style: 'gravy', subTag: 'egg' },
   'ananas-menaskai': { style: 'gravy', subTag: 'pineapple' },
  'pork-jarpaa-jurpie': { style: 'steam-boil', subTag: 'pork' },
  'galho': { style: 'rice-biryani', subTag: 'khichdi' },
  'lemon-coriander-soup': { style: 'soup', subTag: 'lemon' },
  'hot-and-sour-soup': { style: 'soup', subTag: 'hot-sour' },
  'chicken-manchurian': { style: 'fry-tadka', subTag: 'manchurian' },
  'honey-chilli-potato': { style: 'fry-tadka', subTag: 'honey-chilli' },
  'chicken-lollipop': { style: 'fry-tadka', subTag: 'lollipop' },
  'spring-rolls': { style: 'fry-tadka', subTag: 'crispy' },
  'chilli-chicken': { style: 'fry-tadka', subTag: 'chilli' },
  'chilli-mushroom': { style: 'fry-tadka', subTag: 'chilli' },
  'hakka-noodles': { style: 'side', subTag: 'noodles' },
  'chow-mein': { style: 'side', subTag: 'noodles' },
  'schezwan-fried-rice': { style: 'rice-biryani', subTag: 'schezwan' },
  'chilli-garlic-fried-rice': { style: 'rice-biryani', subTag: 'garlic' },
  'american-chop-suey': { style: 'side', subTag: 'crispy' },
  'hot-garlic-sauce-veg': { style: 'gravy', subTag: 'garlic' },
  'schezwan-paneer': { style: 'gravy', subTag: 'schezwan' },
  'sweet-and-sour-chicken': { style: 'gravy', subTag: 'sweet-sour' },
  'sweet-and-sour-veg': { style: 'gravy', subTag: 'sweet-sour' },
  'spiced-masala-oats': { style: 'breakfast', subTag: 'savory' },
  'vegetable-oats-upma': { style: 'breakfast', subTag: 'savory' },
  'oats-poha': { style: 'breakfast', subTag: 'savory' },
  'dahi-tadka-oats': { style: 'breakfast', subTag: 'curd' },
  'milk-oats-fusion': { style: 'breakfast', subTag: 'overnight' },
  'andyacha-rassa': { style: 'gravy', subTag: 'tamarind' },
  'andhra-spiced-egg-curry': { style: 'gravy', subTag: 'coconut' },
  'bengali-dimer-dalna': { style: 'gravy', subTag: 'mustard-oil' },
  'sindhi-aloo-tuk': { style: 'fry-tadka', subTag: 'sindhi' },
  'sindhi-kadhi': { style: 'gravy', subTag: 'sindhi' },
  'sindhi-koki': { style: 'bread', subTag: 'sindhi' },
  'bread-pakoda': { style: 'fry-tadka', subTag: 'stuffed' },
  'spiced-green-beans': { style: 'fry-tadka', subTag: 'stir-fry' },
  'maharashtrian-taak': { style: 'beverage', subTag: 'buttermilk' },
  'goan-chicken-cafreal': { style: 'gravy', subTag: 'goan' },
  'malwani-chicken-masala': { style: 'gravy', subTag: 'malwani' },
  'murghi-na-farcha': { style: 'fry-tadka', subTag: 'parsi' },
  'goan-prawn-ambotik': { style: 'gravy', subTag: 'goan' },
  'bangdyache-ambat-kalwan': { style: 'gravy', subTag: 'mackerel' },
  'marathi-kolambi-bhaat': { style: 'rice-biryani', subTag: 'prawn' },
  'goan-prawn-caldinho': { style: 'gravy', subTag: 'goan' },
  'marathi-kolambi-masala': { style: 'gravy', subTag: 'maharashtrian' },
  'konkani-mango-prawn-curry': { style: 'gravy', subTag: 'mango' },
  'coastal-coconut-prawn-curry': { style: 'gravy', subTag: 'coconut' },
  'kheema-pav': { style: 'gravy', subTag: 'minced' },
  'kheema-per-eeda': { style: 'fry-tadka', subTag: 'minced' },
  'parsi-gosht-ma-kari': { style: 'gravy', subTag: 'rich' },
  'mumbai-frankie-rolls': { style: 'fry-tadka', subTag: 'wrap' },
  'kanda-papeta-per-eda': { style: 'fry-tadka', subTag: 'eggs' },
  'parsi-lamb-cutlets': { style: 'fry-tadka', subTag: 'crisp' },
  'hariyali-gosht': { style: 'gravy', subTag: 'herb' },
  'chicken-do-pyaza': { style: 'gravy', subTag: 'onion' },
  'mughlai-karahi-gosht': { style: 'gravy', subTag: 'rich' },
  'chicken-pulao': { style: 'rice-biryani', subTag: 'aromatic' },
  'raan-musallam': { style: 'roast-tandoori', subTag: 'tandoor' },
  'murgh-malai-tikka': { style: 'roast-tandoori', subTag: 'tandoor' },
  'kali-mirch-murgh-tikka': { style: 'roast-tandoori', subTag: 'tandoor' },
  'tangdi-malai-kebab': { style: 'roast-tandoori', subTag: 'tandoor' },
  'kadhai-chicken-chargha': { style: 'fry-tadka', subTag: 'crisp' },
  'achari-murgh': { style: 'gravy', subTag: 'pickle' },
  'methi-murgh': { style: 'gravy', subTag: 'green' },
  'punjabi-tariwala-murgh': { style: 'gravy', subTag: 'spicy' },
  'palak-murgh': { style: 'gravy', subTag: 'green' },
  'murgh-korma': { style: 'gravy', subTag: 'creamy' },
  'hari-machhi-kebab': { style: 'fry-tadka', subTag: 'crisp' },
  'haryali-fish-tikka': { style: 'roast-tandoori', subTag: 'tandoor' },
  'bengali-cholar-dal': { style: 'gravy', subTag: 'bengali' },
  'bengali-macher-chop': { style: 'fry-tadka', subTag: 'crisp' },
  'spiced-hot-chocolate': { style: 'beverage', subTag: 'hot-chocolate' },
  'goose-dum-biryani': { style: 'rice-biryani', subTag: 'dum' },
  'tamilian-spinach-poriyal': { style: 'fry-tadka', subTag: 'stir-fry' },
  'channa-sundal': { style: 'fry-tadka', subTag: 'tempered' },
  'tamil-pepper-chicken': { style: 'gravy', subTag: 'spicy' },
  'telangana-chicken-curry': { style: 'gravy', subTag: 'roasted' },
  'hyderabadi-murgh-ka-salan': { style: 'gravy', subTag: 'nutty' },
  'hyderabadi-chicken-korma': { style: 'gravy', subTag: 'creamy' },
  'andhra-royalla-vepudu': { style: 'fry-tadka', subTag: 'crisp' },
  'kerala-cabbage-thoran': { style: 'fry-tadka', subTag: 'stir-fry' },
  'mangalorean-prawn-sukke': { style: 'fry-tadka', subTag: 'crisp' },
  'malabar-prawn-curry': { style: 'gravy', subTag: 'spicy' },
  'chettinad-fish-curry': { style: 'gravy', subTag: 'tamarind' },
  'coconut-rice-pudding': { style: 'sweet-dessert', subTag: 'rice' },
  'andhra-lamb-pachadi': { style: 'side', subTag: 'pickle' },
  'north-fruit-chaat': { style: 'side', subTag: 'fruit' },
  'west-fruit-cream': { style: 'side', subTag: 'fruit' },
  'south-fruit-pachadi': { style: 'side', subTag: 'fruit' },
  'east-fruit-payesh': { style: 'side', subTag: 'fruit' },

  // ── Beverage ───────────────────────────────────────────
  'lassi': { style: 'beverage', subTag: 'yogurt' },
  'mango-lassi': { style: 'beverage', subTag: 'yogurt' },
  'sweet-lassi': { style: 'beverage', subTag: 'yogurt' },
  'salted-lassi': { style: 'beverage', subTag: 'yogurt' },
  'masala-chai': { style: 'beverage', subTag: 'tea' },
  'chaas': { style: 'beverage', subTag: 'digestive' },
  'nimbu-pani': { style: 'beverage', subTag: 'citrus' },
  'jaljeera': { style: 'beverage', subTag: 'spiced' },
  'aam-panna': { style: 'beverage', subTag: 'mango' },
  'sol-kadhi': { style: 'beverage', subTag: 'cooling' },
  'coconut-water': { style: 'beverage', subTag: 'natural' },
  'thandai': { style: 'beverage', subTag: 'spiced' },
  'badam-milk': { style: 'beverage', subTag: 'nut' },
  'sattu-sharbat': { style: 'beverage', subTag: 'roasted' },
  'ginger-lemon-tea': { style: 'beverage', subTag: 'herbal' },
  'seasonal-fruit-juice': { style: 'beverage', subTag: 'fresh' },
  'kokam-sherbhat': { style: 'beverage', subTag: 'cooling' },
  'noon-chai': { style: 'beverage', subTag: 'spiced' },
  'kahwa': { style: 'beverage', subTag: 'spiced' },
  'buransh-sharbat': { style: 'beverage', subTag: 'floral' },
  'bael-sharbat': { style: 'beverage', subTag: 'digestive' },
  'jigarthanda': { style: 'beverage', subTag: 'creamy' },
  'neer-mor': { style: 'beverage', subTag: 'digestive' },
  'sambharam': { style: 'beverage', subTag: 'digestive' },
  'kallu': { style: 'beverage', subTag: 'natural' },
  'panaka': { style: 'beverage', subTag: 'cooling' },
  'kokum-sharbat': { style: 'beverage', subTag: 'cooling' },
  'aam-pora-shorbot': { style: 'beverage', subTag: 'smoky' },
  'bela-pana': { style: 'beverage', subTag: 'cooling' },
  'apong': { style: 'beverage', subTag: 'fermented' },
  'zutho': { style: 'beverage', subTag: 'fermented' },
  'yu-manipur': { style: 'beverage', subTag: 'fermented' },
  'mango-shake': { style: 'beverage', subTag: 'creamy' },
  'banana-shake': { style: 'beverage', subTag: 'creamy' },
  'banana-ragi-smoothie': { style: 'beverage', subTag: 'healthy' },
  'kulukki-sarbath': { style: 'beverage', subTag: 'citrus' },
  'tender-coconut-shake': { style: 'beverage', subTag: 'natural' },
  'chikoo-shake': { style: 'beverage', subTag: 'creamy' },

  // ── Vermicelli Dishes ──────────────────────────────────
  'vermicelli-upma': { style: 'steam-boil', subTag: 'vermicelli' },
  'seviyan-kheer': { style: 'sweet-dessert', subTag: 'milk' },
  'sheer-khurma': { style: 'sweet-dessert', subTag: 'festive' },
  'falooda': { style: 'sweet-dessert', subTag: 'cold' },
  'balaleet': { style: 'breakfast', subTag: 'middle-eastern' },
  'vermicelli-porridge': { style: 'breakfast', subTag: 'porridge' },

  // ── Sweet / Dessert ────────────────────────────────────
  'kulfi': { style: 'sweet-dessert', subTag: 'frozen' },
  'mango-kulfi': { style: 'sweet-dessert', subTag: 'frozen' },

  // ── Veg Recipes of India (pan-Indian) ─────────────────
  'gujarati-dal': { style: 'gravy', subTag: 'sweet-sour' },
  'mixed-vegetable-curry': { style: 'gravy', subTag: 'mixed' },
  'dal-fry': { style: 'gravy', subTag: 'tempered' },
  'dal-palak': { style: 'gravy', subTag: 'green' },
  'dal-dhokli': { style: 'gravy', subTag: 'one-pot' },
  'dal-baati': { style: 'gravy', subTag: 'rajasthani' },
  'aloo-matar': { style: 'gravy', subTag: 'potato-pea' },
  'aloo-palak': { style: 'dry-sabzi', subTag: 'green' },
  'aloo-baingan': { style: 'dry-sabzi', subTag: 'dry' },
  'aloo-tamatar': { style: 'gravy', subTag: 'tomato' },
  'aloo-methi': { style: 'dry-sabzi', subTag: 'dry' },
  'dum-aloo': { style: 'gravy', subTag: 'kashmiri' },
  'baingan-masala': { style: 'gravy', subTag: 'spicy' },
  'gobi-matar': { style: 'dry-sabzi', subTag: 'dry' },
  'paneer-do-pyaza': { style: 'gravy', subTag: 'onion' },
  'paneer-jalfrezi': { style: 'dry-sabzi', subTag: 'stir-fry' },
  'paneer-pasanda': { style: 'gravy', subTag: 'rich' },
  'paneer-korma': { style: 'gravy', subTag: 'creamy' },
  'paneer-achari': { style: 'gravy', subTag: 'pickle' },
  'matar-mushroom': { style: 'gravy', subTag: 'pea' },
  'mushroom-corn-masala': { style: 'gravy', subTag: 'creamy' },
  'corn-masala': { style: 'gravy', subTag: 'creamy' },
  'soya-chaap': { style: 'fry-tadka', subTag: 'grilled' },
  'malai-chaap': { style: 'roast-tandoori', subTag: 'creamy' },
  'onion-pakora': { style: 'fry-tadka', subTag: 'crisp' },
  'paneer-roll': { style: 'fry-tadka', subTag: 'wrap' },
  'veg-roll': { style: 'fry-tadka', subTag: 'wrap' },
  'matar-pulao': { style: 'rice-biryani', subTag: 'peas' },
  'gajar-ka-halwa': { style: 'sweet-dessert', subTag: 'carrot' },
  'moong-dal-halwa': { style: 'sweet-dessert', subTag: 'moong' },
  'plain-lassi': { style: 'beverage', subTag: 'yogurt' },

  // ── Pickyeaterblog Soups ───────────────────────────────
  'lebanese-lentil-soup': { style: 'soup', subTag: 'lentil' },
  'vegan-tomato-soup': { style: 'soup', subTag: 'tomato' },
  'ginger-carrot-coconut-soup': { style: 'soup', subTag: 'carrot' },
  'curried-sweet-potato-soup': { style: 'soup', subTag: 'sweet-potato' },
  'pumpkin-sweet-potato-soup': { style: 'soup', subTag: 'pumpkin' },
  'vegetarian-taco-soup': { style: 'soup', subTag: 'taco' },
  // ── Pickyeaterblog Salads ──────────────────────────────
  'lentil-feta-salad': { style: 'side', subTag: 'salad' },
  'roasted-cauliflower-salad': { style: 'side', subTag: 'salad' },
  'beetroot-feta-salad': { style: 'side', subTag: 'salad' },
  'california-grape-avocado-salad': { style: 'side', subTag: 'salad' },
  'watermelon-feta-mint-salad': { style: 'side', subTag: 'salad' },
  'breakfast-fruit-salad': { style: 'side', subTag: 'fruit' },
  'apple-walnut-salad': { style: 'side', subTag: 'salad' },
  'vegan-broccoli-salad': { style: 'side', subTag: 'salad' },
  'roasted-broccoli-potatoes': { style: 'side', subTag: 'roasted' },
  'indian-asparagus-lemon-cumin': { style: 'side', subTag: 'stir-fry' },
  'avocado-green-goddess-dressing': { style: 'side', subTag: 'dressing' },
  // ── Pickyeaterblog Breakfast ───────────────────────────
  'healthy-oatmeal-banana-pancakes': { style: 'breakfast', subTag: 'pancake' },
  'vegan-potato-pancakes': { style: 'breakfast', subTag: 'pancake' },
  'vegan-french-toast-casserole': { style: 'breakfast', subTag: 'french-toast' },
  'blueberry-banana-oat-bread': { style: 'breakfast', subTag: 'bread' },
  'banana-bread-no-butter': { style: 'breakfast', subTag: 'bread' },
  'banana-bread-no-brown-sugar': { style: 'breakfast', subTag: 'bread' },
  'banana-peanut-butter-sandwich': { style: 'breakfast', subTag: 'sandwich' },
  'cottage-cheese-fruit': { style: 'breakfast', subTag: 'fruit' },
  'sweet-potato-breakfast-hash': { style: 'breakfast', subTag: 'hash' },
  'mushroom-toast': { style: 'breakfast', subTag: 'toast' },
  // ── Pickyeaterblog Desserts ────────────────────────────
  'cherry-almond-chocolate-cookies': { style: 'sweet-dessert', subTag: 'cookie' },
  'birthday-cake-muffins': { style: 'sweet-dessert', subTag: 'muffin' },
  'vegan-mug-cake': { style: 'sweet-dessert', subTag: 'mug-cake' },
  'strawberry-blueberry-pie': { style: 'sweet-dessert', subTag: 'pie' },
  'eggless-brownies': { style: 'sweet-dessert', subTag: 'brownie' },
  'strawberry-cheesecake-cookies': { style: 'sweet-dessert', subTag: 'cookie' },
  'vegan-lemon-cupcakes': { style: 'sweet-dessert', subTag: 'cupcake' },
  'vegan-pineapple-upside-down-cake': { style: 'sweet-dessert', subTag: 'cake' },
  'vegan-carrot-cake-cupcakes': { style: 'sweet-dessert', subTag: 'cupcake' },
  'almond-flour-peanut-butter-cookies': { style: 'sweet-dessert', subTag: 'cookie' },
  'chocolate-donuts': { style: 'sweet-dessert', subTag: 'donut' },
  'biscoff-donuts': { style: 'sweet-dessert', subTag: 'donut' },
  'strawberry-donuts': { style: 'sweet-dessert', subTag: 'donut' },
  'tres-leches-cake-gluten-free': { style: 'sweet-dessert', subTag: 'cake' },
  'flourless-gluten-free-brownies': { style: 'sweet-dessert', subTag: 'brownie' },
  'strawberry-yogurt': { style: 'sweet-dessert', subTag: 'yogurt' },
  'protein-powder-mug-cake': { style: 'sweet-dessert', subTag: 'mug-cake' },
  'vegan-vanilla-pudding': { style: 'sweet-dessert', subTag: 'pudding' },
  'grilled-pineapple': { style: 'sweet-dessert', subTag: 'grilled' },
  'vegan-peanut-butter-cups': { style: 'sweet-dessert', subTag: 'cup' },
  'vegan-apple-muffins': { style: 'sweet-dessert', subTag: 'muffin' },
  'mango-nice-cream': { style: 'sweet-dessert', subTag: 'nice-cream' },
  'vegan-fruit-cake': { style: 'sweet-dessert', subTag: 'cake' },
  'banana-pudding-lasagna': { style: 'sweet-dessert', subTag: 'pudding' },
  'nut-butter-banana-stackers': { style: 'sweet-dessert', subTag: 'stacker' },
  'masala-oats': { style: 'breakfast', subTag: 'savory' },
  // ── Pickyeaterblog Beverages ───────────────────────────
  'raspberry-smoothie': { style: 'beverage', subTag: 'smoothie' },
  'strawberry-juice': { style: 'beverage', subTag: 'juice' },
  'arugula-smoothie': { style: 'beverage', subTag: 'smoothie' },
  'banana-smoothie-bowl': { style: 'beverage', subTag: 'smoothie' },
  'dragon-fruit-smoothie': { style: 'beverage', subTag: 'smoothie' },
  'avocado-peanut-butter-smoothie': { style: 'beverage', subTag: 'smoothie' },
  'green-smoothie': { style: 'beverage', subTag: 'smoothie' },
  'blueberry-banana-blast-smoothie': { style: 'beverage', subTag: 'smoothie' },
  'protein-coffee-smoothie': { style: 'beverage', subTag: 'smoothie' },
  'vegan-strawberry-milk': { style: 'beverage', subTag: 'milk' },
  'vegan-smoothie-bowl': { style: 'beverage', subTag: 'smoothie' },
  'mango-pineapple-banana-smoothie': { style: 'beverage', subTag: 'smoothie' },
  'strawberry-smoothie-bowl': { style: 'beverage', subTag: 'smoothie' },
  'pea-protein-smoothie': { style: 'beverage', subTag: 'smoothie' },
  'honeydew-milk-tea': { style: 'beverage', subTag: 'milk-tea' },
  'wintermelon-milk-tea': { style: 'beverage', subTag: 'milk-tea' },
  'chocolate-milk-tea': { style: 'beverage', subTag: 'milk-tea' },
  'temi-tea': { style: 'beverage', subTag: 'tea' },
  'darjeeling-tea': { style: 'beverage', subTag: 'tea' },
  'balma-green-tea': { style: 'beverage', subTag: 'green-tea' },
  'berinag-tea': { style: 'beverage', subTag: 'tea' },
  'black-tea': { style: 'beverage', subTag: 'tea' },
  'green-tea': { style: 'beverage', subTag: 'green-tea' },
  'kangra-tea': { style: 'beverage', subTag: 'green-tea' },
  'milk-tea': { style: 'beverage', subTag: 'milk-tea' },
  'peach-milk': { style: 'beverage', subTag: 'milk' },
  'coconut-milkshake': { style: 'beverage', subTag: 'milkshake' },
  'peanut-butter-cup-milkshake': { style: 'beverage', subTag: 'milkshake' },
  'oat-milk-hot-chocolate': { style: 'beverage', subTag: 'hot-chocolate' },
  'healthy-hot-chocolate': { style: 'beverage', subTag: 'hot-chocolate' },
  'healthy-pumpkin-smoothie': { style: 'beverage', subTag: 'smoothie' },
  'espresso': { style: 'beverage', subTag: 'coffee' },
  'americano': { style: 'beverage', subTag: 'coffee' },
  'latte': { style: 'beverage', subTag: 'coffee' },
  'cappuccino': { style: 'beverage', subTag: 'coffee' },
  'flat-white': { style: 'beverage', subTag: 'coffee' },
  'macchiato': { style: 'beverage', subTag: 'coffee' },
  'cortado': { style: 'beverage', subTag: 'coffee' },
  'mocha': { style: 'beverage', subTag: 'coffee' },
  'frappe': { style: 'beverage', subTag: 'coffee' },
  'iced-coffee': { style: 'beverage', subTag: 'coffee' },
  'mazagran': { style: 'beverage', subTag: 'coffee' },
  'rose-milk': { style: 'beverage', subTag: 'milk' },
  'sugandha-milk': { style: 'beverage', subTag: 'milk' },
  // ── Pickyeaterblog Mains ───────────────────────────────
  'greek-nachos-baked-chickpeas': { style: 'side', subTag: 'snack' },
  'lentil-pasta-marinara': { style: 'rice-biryani', subTag: 'pasta' },
  'tofu-meatballs': { style: 'gravy', subTag: 'italian' },
  'tahini-pasta': { style: 'rice-biryani', subTag: 'pasta' },
  'crispy-potato-tacos': { style: 'side', subTag: 'snack' },
  'baked-penne-roasted-veg': { style: 'rice-biryani', subTag: 'pasta' },
  'vegan-egg-salad-sandwich': { style: 'bread', subTag: 'sandwich' },
  'vegan-biryani-cauliflower': { style: 'rice-biryani', subTag: 'vegan' },
  'chickpea-lentil-saute-apple-curry': { style: 'gravy', subTag: 'curry' },
  'chickpea-tikka-masala': { style: 'gravy', subTag: 'tikka' },
  'bbq-jackfruit-burrito-bowl': { style: 'rice-biryani', subTag: 'bowl' },
  'indian-fried-rice-khichdi': { style: 'rice-biryani', subTag: 'khichdi' },
  'vegan-rasta-pasta': { style: 'rice-biryani', subTag: 'pasta' },
  'roasted-cauliflower-curry-sweet-potato': { style: 'gravy', subTag: 'curry' },
  'sweet-sesame-noodles-tofu-broccoli': { style: 'rice-biryani', subTag: 'noodles' },
  'vegan-chow-mein': { style: 'side', subTag: 'noodles' },
  'veggie-shawarma-tofu': { style: 'bread', subTag: 'wrap' },
  'bean-stew-brown-rice': { style: 'rice-biryani', subTag: 'stew' },
  'tofu-pasta': { style: 'rice-biryani', subTag: 'pasta' },
  'keto-pizza-bowl': { style: 'side', subTag: 'bowl' },
  'english-muffin-pizzas': { style: 'breakfast', subTag: 'pizza' },
  'vegan-sushi-bowl': { style: 'rice-biryani', subTag: 'sushi' },
  'sourdough-grilled-cheese': { style: 'bread', subTag: 'sandwich' },
  'high-protein-veggie-burgers': { style: 'bread', subTag: 'burger' },
  'loaded-veggie-nachos': { style: 'side', subTag: 'snack' },
  'twice-baked-potatoes-broccoli-cheese': { style: 'roast-tandoori', subTag: 'baked' },
  'vegetarian-fajita-bowl': { style: 'rice-biryani', subTag: 'bowl' },
  'garlic-bread-grilled-cheese': { style: 'bread', subTag: 'sandwich' },
  'red-lentil-dal': { style: 'gravy', subTag: 'dal' },
  'veggie-spaghetti-sauce': { style: 'gravy', subTag: 'sauce' },
  'chana-masala': { style: 'gravy', subTag: 'chickpea' },
  'aubergine-curry': { style: 'gravy', subTag: 'curry' },
};

export function getDishStyle(dishId: string): DishStyle | undefined {
  return DISH_STYLE_MAP[dishId]?.style;
}

export function getDishSubTag(dishId: string): string | undefined {
  return DISH_STYLE_MAP[dishId]?.subTag;
}

export function isGravyDish(dishId: string): boolean {
  return DISH_STYLE_MAP[dishId]?.style === 'gravy';
}

export function isDryDish(dishId: string): boolean {
  return getDishStyle(dishId) === 'dry-sabzi';
}

const STYLE_ROUTING: Record<DishStyle, StyleRoutingOverrides> = {
  'gravy': {
    breads: ['Tandoori Roti', 'Butter Naan'],
    rice: ['Jeera Rice', 'Steamed Rice'],
    sides: ['Raita', 'Salad'],
    beverages: ['Chaas', 'Water'],
    inferBread: true,
    inferRice: true,
  },
  'dry-sabzi': {
    breads: ['Tandoori Roti', 'Missi Roti'],
    rice: ['Steamed Rice', 'Lemon Rice'],
    sides: ['Papad', 'Salad'],
    beverages: ['Chaas', 'Water'],
    inferBread: true,
    inferRice: true,
  },
  'fry-tadka': {
    breads: ['Tandoori Roti', 'Paratha'],
    rice: [],
    sides: ['Onion Salad', 'Lemon Wedge'],
    beverages: ['Nimbu Pani', 'Buttermilk'],
    inferBread: true,
    inferRice: false,
  },
  'roast-tandoori': {
    breads: ['Butter Naan', 'Tandoori Roti'],
    rice: [],
    sides: ['Mint Chutney', 'Onion Rings'],
    beverages: ['Lassi', 'Water'],
    inferBread: true,
    inferRice: false,
  },
  'steam-boil': {
    breads: [],
    rice: [],
    sides: ['Coconut Chutney', 'Sambar'],
    beverages: ['Filter Coffee', 'Tea'],
    inferBread: false,
    inferRice: false,
  },
  'rice-biryani': {
    breads: [],
    rice: [],
    sides: ['Raita', 'Salad'],
    beverages: ['Raita', 'Water'],
    inferBread: false,
    inferRice: false,
  },
  'breakfast': {
    breads: [],
    rice: [],
    sides: ['Chutney', 'Sambar'],
    beverages: ['Tea', 'Coffee'],
    inferBread: false,
    inferRice: false,
  },
  'sweet-dessert': {
    breads: [],
    rice: [],
    sides: [],
    beverages: [],
    inferBread: false,
    inferRice: false,
  },
  'bread': {
    breads: [],
    rice: [],
    sides: [],
    beverages: [],
    inferBread: false,
    inferRice: false,
  },
  'side': {
    breads: [],
    rice: [],
    sides: [],
    beverages: [],
    inferBread: false,
    inferRice: false,
  },
  'beverage': {
    breads: [],
    rice: [],
    sides: [],
    beverages: [],
    inferBread: false,
    inferRice: false,
  },
  'soup': {
    breads: [],
    rice: [],
    sides: [],
    beverages: [],
    inferBread: false,
    inferRice: false,
  },
};

export function getStyleRouting(style: DishStyle): StyleRoutingOverrides {
  return STYLE_ROUTING[style];
}

export interface StyleWarning {
  type: 'duplicate-gravy';
  message: string;
  swapFrom: string;
  swapTo: string;
  swapToId: string;
}

export function getSwapSuggestion(style: DishStyle): { swapToStyle: DishStyle; suggestion: string; exampleDishId: string } | null {
  switch (style) {
    case 'gravy':
      return { swapToStyle: 'dry-sabzi', suggestion: 'Bhindi Fry (Dry)', exampleDishId: 'bhindi-do-pyaza' };
    default:
      return null;
  }
}

export function computeStyleWarnings(meals: { mealId: string; name: string }[]): StyleWarning[] {
  const warnings: StyleWarning[] = [];
  const gravyItems = meals.filter(m => isGravyDish(m.mealId));
  if (gravyItems.length >= 2) {
    const swap = getSwapSuggestion('gravy');
    if (swap) {
      const alreadyAdded = meals.some(m =>
        m.name.toLowerCase().trim() === swap.suggestion.toLowerCase().trim()
      );
      if (!alreadyAdded) {
        warnings.push({
          type: 'duplicate-gravy',
          message: `Swap ${gravyItems[0]!.name} for ${swap.suggestion} for better balance`,
          swapFrom: gravyItems[0]!.mealId,
          swapTo: swap.suggestion,
          swapToId: swap.exampleDishId,
        });
      }
    }
  }
  return warnings;
}

// ─── Indian Meal Categories — Master catalog of accompaniments ─────────────

export type IndianMealCategory = 'bread' | 'rice' | 'beverage' | 'side' | 'dessert';

/**
 * Indian meal category options for meal combination logic.
 * System uses these for smart suggestions and default pairings.
 * Users can freely add any category to any meal slot.
 */
export const indian_meal_categories: Record<IndianMealCategory, string[]> = {
  bread: [
    'Roti', 'Phulka', 'Butter Naan', 'Garlic Naan', 'Aloo Paratha', 'Paneer Paratha',
    'Gobi Paratha', 'Plain Tawa Paratha', 'Laccha Paratha', 'Ajwain (Carom) Paratha',
    'Jeera (Cumin) Paratha', 'Hara Dhania (Cilantro) Paratha', 'Pyaz (Onion) Paratha',
    'Dal Paratha', 'Missi Roti', 'Bhakri', 'Rumali Roti', 'Kulcha',
    'Tandoori Roti', 'Khamiri Roti', 'Bhatura', 'Chapati', 'Thepla', 'Puri',
  ],
  rice: [
    'Rice', 'Steamed Basmati', 'Jeera Rice', 'Lemon Rice', 'Curd Rice', 'Veg Pulao',
    'Khichdi', 'Sona Masoori', 'Biryani Base', 'Pongal', 'Upma',
    'Curd Pulao', 'Matar Pulao', 'Jeera Sona Masoori', 'Coconut Rice',
  ],
  beverage: [
    'Masala Chai', 'Filter Coffee', 'Salted Lassi', 'Sweet Lassi', 'Chaas',
    'Nimbu Pani', 'Jaljeera', 'Aam Panna', 'Sol Kadhi', 'Coconut Water',
    'Thandai', 'Badam Milk', 'Sattu Sharbat', 'Kokum Sherbet', 'Ginger Lemon',
    'Seasonal Fruit Juice',
  ],
  side: [
    'Cucumber Raita', 'Boondi Raita', 'Masala Raita',
    'Mixed Chutney', 'Coconut Chutney', 'Mint Chutney',
    'Tamarind Chutney', 'Imli Chutney', 'Green Chutney',
    'Papad', 'Kachumber Salad', 'Mango Pickle', 'Lime Pickle',
    'Fryums', 'Onion Rings', 'Lemon Wedge', 'Green Chili',
    'Sambar', 'Rasam', 'Curry Leaves Chutney',
    'Curd', 'Butter', 'Ghee',
    'Mirchi Ka Salan', 'Bagara Baingan',
  ],
  dessert: [
    'Kheer / Payasam', 'Gulab Jamun', 'Rasgulla', 'Jalebi', 'Gajar Halwa',
    'Sooji Halwa', 'Rasmalai', 'Shrikhand', 'Barfi (Milk/Coconut)', 'Modak',
    'Phirni', 'Ladoo (Besan/Motichoor)', 'Malpua', 'Kulfi', 'Mango Kulfi',
    'Aamras', 'Ras Malai',
  ],
};

/**
 * Get best-matching accompaniments for a given dish style.
 * Gravy dishes → bread + rice + side + beverage
 * Dry sabzi → bread + rice + side
 * Fry/tadka → bread + side + beverage
 * Rice/biryani → side + beverage
 * Breakfast → beverage
 * Sweet/dessert → (none, standalone)
 */
export function getRecommendedCategories(style: DishStyle): IndianMealCategory[] {
  switch (style) {
    case 'gravy':
      return ['bread', 'rice', 'side', 'beverage'];
    case 'dry-sabzi':
      return ['bread', 'rice', 'side'];
    case 'fry-tadka':
      return ['side', 'beverage'];
    case 'roast-tandoori':
      return ['bread', 'side', 'beverage'];
    case 'rice-biryani':
      return ['side', 'beverage'];
    case 'steam-boil':
      return ['side', 'beverage'];
    case 'breakfast':
      return ['side', 'beverage'];
    case 'sweet-dessert':
      return [];
    case 'bread':
      return ['side', 'beverage'];
    case 'side':
      return [];
    case 'beverage':
      return ['side'];
    case 'soup':
      return ['side', 'beverage'];
    default:
      return ['bread', 'rice', 'side', 'beverage'];
  }
}

/**
 * Get default pick from each recommended category for a given dish style.
 * Returns a flat array of default accompaniments.
 */
export function getDefaultAccompaniments(style: DishStyle): { category: IndianMealCategory; item: string }[] {
  const categories = getRecommendedCategories(style);
  return categories.map(cat => {
    const options = indian_meal_categories[cat];
    return { category: cat, item: options[0] ?? '' };
  }).filter(a => a.item);
}

/** Grouped sub-headers for categories (optional — only categories with groups render sub-headers) */
export const categoryGroups: Partial<Record<IndianMealCategory, { label: string; items: string[] }[]>> = {
  bread: [
    { label: 'Flatbreads', items: ['Roti', 'Phulka', 'Chapati', 'Tandoori Roti', 'Missi Roti', 'Bhakri', 'Rumali Roti', 'Kulcha', 'Khamiri Roti', 'Thepla', 'Puri', 'Bhatura'] },
    { label: 'Specialty', items: ['Butter Naan', 'Garlic Naan'] },
    { label: 'Parathas', items: ['Aloo Paratha', 'Paneer Paratha', 'Gobi Paratha', 'Plain Tawa Paratha', 'Laccha Paratha', 'Ajwain (Carom) Paratha', 'Jeera (Cumin) Paratha', 'Hara Dhania (Cilantro) Paratha', 'Pyaz (Onion) Paratha', 'Dal Paratha'] },
  ],
  side: [
    { label: 'Raitas', items: ['Cucumber Raita', 'Boondi Raita', 'Masala Raita'] },
    { label: 'Chutneys', items: ['Mixed Chutney', 'Coconut Chutney', 'Mint Chutney', 'Tamarind Chutney', 'Imli Chutney', 'Green Chutney', 'Curry Leaves Chutney'] },
    { label: 'Pickles & Salads', items: ['Papad', 'Kachumber Salad', 'Mango Pickle', 'Lime Pickle', 'Fryums', 'Onion Rings', 'Lemon Wedge', 'Green Chili'] },
    { label: 'Dairy', items: ['Curd', 'Butter', 'Ghee'] },
    { label: 'South Indian', items: ['Sambar', 'Rasam'] },
    { label: 'Biryani Accents', items: ['Mirchi Ka Salan', 'Bagara Baingan'] },
  ],
};

// ─── Smart Pairing Helpers ──────────────────────────────────────────────────

const NUT_KEYWORDS = ['badam', 'almond', 'cashew', 'kaju', 'pista', 'pistachio', 'walnut', 'akhrot', 'peanut', 'moongfali'];

export function isNutItem(item: string): boolean {
  const l = item.toLowerCase();
  return NUT_KEYWORDS.some(k => l.includes(k));
}

const STREET_FOOD_IDS = new Set([
  'papdi-chaat', 'pani-puri', 'sev-puri', 'dahi-puri', 'dahi-bhalla',
  'aloo-tikki', 'samosa', 'kachori', 'chole-tikki', 'ragda-pattice',
]);

export function isStreetFood(dishId: string): boolean {
  return STREET_FOOD_IDS.has(dishId);
}

const REGION_MAP: Record<string, string> = {
  'roti / phulka': 'north', 'butter naan': 'north', 'tandoori roti': 'north',
  'aloo paratha': 'north', 'paneer paratha': 'north', 'missi roti': 'north',
  'puri': 'north', 'kulcha': 'north', 'khamiri roti': 'north',
  'bhakri': 'west', 'rumali roti': 'north', 'luchi': 'east', 'appam': 'south',
  'steamed basmati': 'north', 'jeera rice': 'north', 'biryani base': 'north',
  'pulao': 'north', 'khichdi': 'north', 'pongal': 'south', 'upma': 'south',
  'coconut rice': 'south', 'curd rice': 'south', 'lemon rice': 'south',
  'sona masoori': 'south',
  'masala chai': 'north', 'filter coffee': 'south', 'salted lassi': 'north',
  'sweet lassi': 'north', 'chaas': 'north', 'sol kadhi': 'west',
  'coconut water': 'south', 'thandai': 'north', 'badam milk': 'north',
  'sattu sharbat': 'north',
  'cucumber raita': 'north', 'boondi raita': 'north', 'coconut chutney': 'south',
  'mint chutney': 'north', 'tamarind chutney': 'south',
  'kheer / payasam': 'north', 'gulab jamun': 'north', 'rasgulla': 'east',
  'gajar halwa': 'north', 'sooji halwa': 'north', 'shrikhand': 'west',
  'payasam': 'south', 'modak': 'west', 'kulfi': 'north',
};

export function getItemRegion(item: string): string | undefined {
  return REGION_MAP[item.toLowerCase()];
}

/**
 * Merge legacy meal-specific options with master catalog, deduped.
 * Legacy options get priority (appear first), then master items appended.
 */
export function mergeCategoryOptions(
  legacy: string[] | undefined,
  master: string[],
): string[] {
  const seen = new Set<string>();
  const result: string[] = [];
  const normalize = (s: string) => s.toLowerCase().trim();
  for (const item of [...(legacy ?? []), ...master]) {
    const key = normalize(item);
    if (!seen.has(key)) {
      seen.add(key);
      result.push(item);
    }
  }
  return result;
}

export interface CategoryConfig {
  label: string;
  icon: string;
  max: number;
}

export const CATEGORY_CONFIG: Record<IndianMealCategory, CategoryConfig> = {
  bread: { label: 'Bread', icon: '🫓', max: 1 },
  rice: { label: 'Rice', icon: '🍚', max: 1 },
  side: { label: 'Sides', icon: '🥗', max: 3 },
  beverage: { label: 'Beverages', icon: '🥤', max: 3 },
  dessert: { label: 'Dessert', icon: '🍨', max: 3 },
};

// ─── Style-Based Dish Selection ─────────────────────────────────────────────

export type DishStyleGroup =
  | 'Gravy' | 'Dry' | 'Fry' | 'Tadka' | 'Roast' | 'Steam' | 'Rice' | 'Breakfast'
  | 'Beverage' | 'Sweet' | 'Bread' | 'Side' | 'Soup';

export const DISH_STYLES: Record<DishStyleGroup, string[]> = {
  Gravy: [
    'Dal Tadka', 'Dal Makhani', 'Rajma Masala', 'Chole Masala',
    'Paneer Butter Masala', 'Shahi Paneer', 'Kadai Paneer',
    'Butter Chicken', 'Chicken Curry', 'Fish Curry', 'Egg Curry',
    'Sambar', 'Kadhi Pakora', 'Malai Kofta',
    'Nga-Thongba', 'Doh Neiiong',
    'Kerala Prawn Curry', 'Kerala Style Fish Molee',
    'Erissery (Pumpkin & Lentil Stew)', 'Naadan Kozhi Curry',
    'Erachi Varutharacha Curry', 'Kappa and Meen Curry',
    'Korri Gassi (Mangalorean Chicken Curry)', 'Kundapura Koli Saaru',
    'Coorg Pandi Curry (Pork Curry)', 'Udupi Sambar',
    'Sagu (Vegetable Curry)', 'Gojju (Sweet & Sour Curry)',
    'Ennegai (Stuffed Eggplant Curry)',
    'Anishi (Colocasia with Pork)', 'Panch Phoran Tarka',
    'Phagshapa (Pork Fat Stew)', 'Masauyra Curry (Fermented Black Gram)',
    'Matschgand (Minced Meatballs)', 'Yakhni (Yogurt Lamb Curry)',
    'Dum Olav (Kashmiri Dum Aloo)', 'Muji Gaad (Fish with Lotus Stem)',
    'Aab Gosht (Mutton in Milk)', 'Goshtaba (Minced Mutton in Yogurt)',
    'Lyodur Tschaman (Paneer in Turmeric Gravy)',
    'Murghanu Shaak', 'Sev Tameta nu Shak', 'Chepa Pulusu (Andhra Fish Curry)',
    'Achari Baingan', 'Khoya Paneer', 'Lobiya (Black Eyed Peas Curry)',
     'Mushroom Do Pyaza', 'Mushroom Matar', 'Kerala Egg Roast', 'Ananas Menaskai (Pineapple Curry)',
    'Vegetables in Hot Garlic Sauce', 'Schezwan Paneer',
    'Sweet and Sour Chicken', 'Sweet and Sour Vegetables',
    'Maharashtrian Spiced Egg Curry (Andyacha Rassa)',
    'Andhra Spiced Egg Curry',
    'Bengali Dimer Dalna (Egg & Potato Curry)',
    'Sindhi Kadhi Chawal', 'Goan Chicken Cafreal', 'Malwani Chicken Masala',
    'Goan Prawn Ambotik', 'Maharashtrian Bangdyache Ambat Kalwan',
    'Goan Prawn Caldinho', 'Marathi Kolambi Masala',
    'Konkani Sour Mango Prawn Curry', 'Coastal Coconut Prawn Curry',
    'Kheema Pav', 'Parsi Gosht ma Kari',
    'Hariyali Gosht', 'Chicken Do Pyaza', 'Mughlai Karahi Gosht',
    'Achari Murgh', 'Methi Murgh', 'Punjabi Tariwala Murgh',
    'Palak Murgh (Saag Murgh)', 'Murgh Korma',
    'Tamil Black Pepper Chicken Curry', 'Telangana Chicken Curry',
    'Hyderabadi Murgh ka Salan', 'Hyderabadi Chicken Korma',
    'Chemeen Mulakittathu (Spicy Malabar Prawn Curry)',
    'Chettinad Meen Kuzhambu (Fish Curry)',
    'Bengali Cholar Dal',
    // ── Veg Recipes of India (Gravy) ───────────────────────
    'Gujarati Dal', 'Mixed Vegetable Curry', 'Dal Fry', 'Dal Palak',
    'Dal Dhokli', 'Dal Baati', 'Aloo Tamatar', 'Dum Aloo', 'Baingan Masala',
    'Paneer Do Pyaza', 'Paneer Pasanda', 'Paneer Korma', 'Paneer Achari',
    'Matar Mushroom', 'Mushroom Masala', 'Mushroom Corn Masala', 'Corn Masala',
  ],
  Dry: [
    'Aloo Gobi', 'Jeera Aloo', 'Bhindi Masala', 'Baingan Bharta',
    'Aloo Matar', 'Paneer Bhurji', 'Soya Chunk Dry', 'Dry Mix Veg',
    'Tawa Paneer', 'Kala Chana', 'Rajma Dry', 'Aloo Jeera',
    'Singri ki Sabzi (Ker Sangri)',
    'Bharli Vangi (Stuffed Brinjal)',
    'Aloo Shimla Mirch',
    // ── Veg Recipes of India (Dry) ─────────────────────────
    'Aloo Baingan', 'Aloo Methi', 'Aloo Palak',
    'Bhindi Do Pyaza', 'Gobi Matar', 'Paneer Jalfrezi',
  ],
  Fry: [
    'Crispy Okra Fry', 'Banana Chip Fry', 'Plantain Fry', 'Potato Fry',
    'Paneer Tikka Dry', 'Soya Fry', 'Mushroom Fry', 'Bread Pakora',
    'Veg Cutlet', 'Aloo Tikki', 'Fish Fry', 'Chicken 65',
    'Nadan Kozhi Varuthathu (Spicy Chicken Fry)', 'Naadan Beef Fry',
    'Mussel Stir Fry',
    'Kane Rava Fry (Lady Fish Fry)',
    'Bamboo Shoot Fry',
    'Gathiya', 'Chorafali', 'Gota (Gujarati Pakoras)', 'Lilva Kachori',
    'Dondakaya Fry (Ivy Gourd Stir Fry)',
    'Chicken Manchurian', 'Honey Chilli Potato', 'Chicken Lollipop',
    'Spring Rolls', 'Chilli Chicken', 'Chilli Mushroom',
    'Sindhi Aloo Tuk', 'Spiced Indian Green Beans',
    'Murghi na Farcha (Parsi Fried Chicken)',
    'Kheema per Eeda', 'Mumbai Frankie Rolls', 'Kanda Papeta Per Eda',
    'Parsi Lamb Cutlets',
    'Kadhai Chicken Chargha', 'Hari Machhi Kebab',
    'Tamilian Spinach Poriyal', 'Tamilian Channa Sundal',
    'Andhra Royalla Vepudu (Prawn Stir Fry)',
    'Kerala Cabbage Thoran', 'Mangalorean Prawn Sukke',
    'Bengali Macher Chop',
    // ── Veg Recipes of India (Fry) ─────────────────────────
    'Onion Pakora', 'Paneer Roll', 'Veg Roll', 'Soya Chaap',
  ],
  Tadka: [
    'Dal Fry Tadka', 'Jeera Rice Tadka', 'Curd Rice Tadka',
    'Poha Tadka', 'Upma Tadka', 'Khichdi Tadka', 'Raita Tadka',
    'Tungrymbai',
  ],
  Roast: [
    'Tandoori Chicken', 'Malai Chaap', 'Soya Tikka', 'Paneer Tikka',
    'Veg Seekh Kebab', 'Fish Tikka', 'Mushroom Tikka', 'Tandoori Aloo',
    'Raan Musallam', 'Murgh Malai Tikka', 'Kali Mirch Murgh Tikka (Black Pepper Chicken)',
    'Tangdi Malai Kebab', 'Haryali Fish Tikka',
  ],
  Steam: [
    'Idli', 'Dhokla', 'Khaman', 'Steamed Momos', 'Handvo', 'Puttu',
    'Steamed Rice Cake', 'Idiyappam',
    'Rugra', 'Chamthong / Kangshoi', 'Paaknam',
    'Pumaloi', 'Pudoh', 'Minil Songa', 'Sakin Gata',
    'Puttu and Kadala Curry', 'Appam', 'Thattu Dosa',
    'Mysore Bonda', 'Maddur Vada', 'Tatte Idli (Plate Idli)',
    'Ragi Mudde (Finger Millet Balls)',
    'Boiled Vegetables', 'Chhum Han (Steamed Vegetables)',
    'Sha Phaley (Beef Stuffed Bread)', 'Dhindo (Millet Porridge)',
    'Skyu (Ladakhi Wheat Flour Stew)',
    'Muthiya',
    'Pork Jarpaa Jurpie',
  ],
  Rice: [
    'Veg Biryani', 'Chicken Biryani', 'Lemon Rice', 'Curd Rice',
    'Coconut Rice', 'Tamarind Rice', 'Mint Pulao', 'Jeera Rice',
    'Veg Pulao', 'Kashmiri Pulao', 'Matar Pulao', 'Rajma Chawal',
    'Thalassery Biryani',
    'Mangalorean Biryani', 'Chitranna (Lemon Rice)',
    'Dal Bhat',
    'Mithe Chawal (Sweet Rice)', 'Bajara Khichri',
    'Modur Pulav (Sweet Kashmiri Rice)',
    'Galho (Rice-Lentil Porridge)', 'Schezwan Fried Rice',
    'Chilli Garlic Fried Rice',
    'Marathi Kolambi Bhaat (Prawn Pulao)',
    'Easy Spiced Chicken Pulao',
    'Christmas Goose Dum Biryani',
  ],
  Breakfast: [
    'Poha', 'Upma', 'Dosa', 'Uttapam', 'Idli', 'Paratha',
    'Thepla', 'Kachori', 'Samosa', 'Chole Bhature', 'Puri Bhaji',
    'Dabeli', 'Khakhra', 'Fafda-Jalebi', 'Aloo Kulcha',
    'Spiced Masala Oats', 'Vegetable Oats Upma', 'Oats Poha',
    'Dahi Tadka Oats (Curd Oats)', 'Milk Oats (Indian Fusion)',
  ],
  Beverage: [
    'Lassi', 'Masala Chai', 'Chaas', 'Filter Coffee', 'Nimbu Pani',
    'Sweet Lassi', 'Mango Lassi', 'Salted Lassi', 'Sol Kadhi',
    'Kyat',
    'Zu (Mizo Rice Tea)', 'Lubrusca Grape Wine',
    'Chang (Millet Beer)',
    'Maharashtrian Taak (Spiced Buttermilk)',
    'Spiced Hot Chocolate',
    'Plain Lassi',
  ],
  Sweet: [
    'Gulab Jamun', 'Jalebi', 'Rasgulla', 'Kheer', 'Rasmalai',
    'Shrikhand', 'Basundi', 'Mishti Doi', 'Sandesh', 'Payasam',
    'Mango Kulfi', 'Aamras', 'Imarti', 'Kesari Bath',
    'Chak-hao Kheer', 'Pukhlein',
    'Pazham Pori (Banana Fritters)', 'Palada Payasam',
    'Ada Pradhaman', 'Chatti Pathiri', 'Banana Halwa',
    'Mysore Pak', 'Haalbai (Coconut Rice Pudding)',
    'Pori Urundai (Puffed Rice Balls)', 'Chiroti',
    'Koat Pitha (Rice & Banana Fritters)',
    'Doodhpak (Gujarati Rice Pudding)',
    'South Indian Coconut Rice Pudding (Payasam)',
    'Gajar Ka Halwa', 'Moong Dal Halwa',
  ],
  Bread: [
    'Tandoori Roti', 'Butter Naan', 'Missi Roti', 'Paratha',
    'Pav', 'Bhakri', 'Jolada Roti', 'Luchi', 'Kulcha',
    'Malabar Parota',
    'Sel Roti (Ring Bread)', 'Kodo Ko Roti (Finger Millet Roti)',
    'Khambir (Ladakhi Bread)',
    'Dabeli', 'Khakhra',
    'Sindhi Koki',
  ],
  Side: [
    'Raita', 'Salad', 'Papad', 'Pickle', 'Chutney',
    'Dahi Bhalla', 'Papdi Chaat', 'Sev Poori', 'Pani Puri', 'Dahi Puri',
    'Morok Metpa', 'Singju', 'Alu Kangmet',
    'Allugedda (Mashed Potato with Black Gram)',
    'Mango Chutney (Mavinakai Chutney)',
    'Gundruk (Fermented Leafy Greens)',
    'Andhra Lamb Pachadi (Spicy Lamb Pickle)',
    'Hakka Noodles', 'Chow Mein', 'American Chop Suey',
  ],
  Soup: [
    'Rasam', 'Pappu Charu', 'Pachi Palusu', 'Mulligatawny Soup',
    'Coconut & Vegetable Stew', 'Tamatar Ka Shorba', 'Dal Panchmel Shorba',
    'Bajre Ka Raab', 'Gahat Ka Shorba', 'Palak Ka Shorba',
    'Thukpa', 'Thenthuk', 'Tomato Saar', 'Chana Sattu Soup',
    'Nandu Rasam (Crab Soup)', 'Naatu Kozhi Rasam (Country Chicken Soup)',
    'Ulava Charu (Horsegram Lentil Soup)', 'Badam Shorba (Almond Soup)',
    'Yakhni (Kashmiri Mutton Broth)', 'Paya Shorba (Lamb Trotter Soup)',
    'Sweet Corn Vegetable Soup', 'Sweet Corn Chicken Soup',
    'Manchow Soup', 'Palak Soup (Spinach Soup)',
    'Nakham Bitchi',
    'Lemon Coriander Soup', 'Hot and Sour Soup',
  ],
};

export const STYLE_GROUP_ICONS: Record<DishStyleGroup, string> = {
  Gravy: '🍛',
  Dry: '🥘',
  Fry: '🍟',
  Tadka: '🫕',
  Roast: '🔥',
  Steam: '♨️',
  Rice: '🍚',
  Breakfast: '🌅',
  Beverage: '🥛',
  Sweet: '🍨',
  Bread: '🫓',
  Side: '🥗',
  Soup: '🍜',
};

export function styleGroupToInternal(group: DishStyleGroup): DishStyle {
  const map: Record<DishStyleGroup, DishStyle> = {
    Gravy: 'gravy',
    Dry: 'dry-sabzi',
    Fry: 'fry-tadka',
    Tadka: 'fry-tadka',
    Roast: 'roast-tandoori',
    Steam: 'steam-boil',
    Rice: 'rice-biryani',
    Breakfast: 'breakfast',
    Beverage: 'beverage',
    Sweet: 'sweet-dessert',
    Bread: 'bread',
    Side: 'side',
    Soup: 'soup',
  };
  return map[group];
}

export function internalToStyleGroup(style: DishStyle): DishStyleGroup | null {
  const map: Record<DishStyle, DishStyleGroup> = {
    'gravy': 'Gravy',
    'dry-sabzi': 'Dry',
    'fry-tadka': 'Fry',
    'roast-tandoori': 'Roast',
    'steam-boil': 'Steam',
    'rice-biryani': 'Rice',
    'breakfast': 'Breakfast',
    'sweet-dessert': 'Sweet',
    'bread': 'Bread',
    'side': 'Side',
    'soup': 'Soup',
    'beverage': 'Beverage',
  };
  return map[style] ?? null;
}

/**
 * Smart pairing suggestions for a dish style group.
 * Returns default accompaniments the system would pre-select as suggestions.
 */
export function getPairingSuggestions(group: DishStyleGroup | null): Record<IndianMealCategory, string[]> {
  const style = styleGroupToInternal(group ?? 'Gravy');
  const cats = getRecommendedCategories(style);
  const routing = getStyleRouting(style) ?? { breads: [], rice: [], sides: [], beverages: [], inferBread: false, inferRice: false };
  const result: Record<IndianMealCategory, string[]> = {
    bread: [], rice: [], side: [], beverage: [], dessert: [],
  };
  for (const cat of cats) {
    if (cat === 'bread') {
      result.bread = (routing.breads?.length ?? 0) > 0 ? [routing.breads![0]!] : [];
    } else if (cat === 'rice') {
      result.rice = (routing.rice?.length ?? 0) > 0 ? [routing.rice![0]!] : [];
    } else if (cat === 'side') {
      result.side = (routing.sides?.length ?? 0) > 0 ? routing.sides!.slice(0, 2).filter((s): s is string => s != null) : [];
    } else if (cat === 'beverage') {
      result.beverage = (routing.beverages?.length ?? 0) > 0 ? [routing.beverages![0]!] : [];
    } else if (cat === 'dessert') {
      result.dessert = indian_meal_categories.dessert.length > 0 ? [indian_meal_categories.dessert[0]!] : [];
    }
  }
  return result;
}
