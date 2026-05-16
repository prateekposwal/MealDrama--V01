// ─────────────────────────────────────────────────────────────────────────────
// Dish Image Mapping — Maps dish names to real food photos
// ─────────────────────────────────────────────────────────────────────────────

// Unsplash image URLs for Indian & common dishes
// Format: https://images.unsplash.com/photo-{ID}?w=400&h=400&fit=crop&crop=center

const DISH_IMAGE_MAP: Record<string, string> = {
    // ── Breakfast ──────────────────────────────────────────────────
    'poha': 'https://images.unsplash.com/photo-1589301760014-d929f3979dbc?w=400&h=400&fit=crop',
    'upma': 'https://images.unsplash.com/photo-1630383249896-424e482df925?w=400&h=400&fit=crop',
    'idli': 'https://images.unsplash.com/photo-1589301760014-d929f3979dbc?w=400&h=400&fit=crop',
    'dosa': 'https://images.unsplash.com/photo-1630383249896-424e482df925?w=400&h=400&fit=crop',
    'masala dosa': 'https://images.unsplash.com/photo-1630383249896-424e482df925?w=400&h=400&fit=crop',
    'uttapam': 'https://images.unsplash.com/photo-1630383249896-424e482df925?w=400&h=400&fit=crop',
    'paratha': 'https://images.unsplash.com/photo-1565557623262-b51c2513a641?w=400&h=400&fit=crop',
    'aloo paratha': 'https://images.unsplash.com/photo-1565557623262-b51c2513a641?w=400&h=400&fit=crop',
    'gobi paratha': 'https://images.unsplash.com/photo-1565557623262-b51c2513a641?w=400&h=400&fit=crop',
    'mooli paratha': 'https://images.unsplash.com/photo-1565557623262-b51c2513a641?w=400&h=400&fit=crop',
    'paneer paratha': 'https://images.unsplash.com/photo-1565557623262-b51c2513a641?w=400&h=400&fit=crop',
    'chole bhature': 'https://images.unsplash.com/photo-1606491956689-2ea866880c84?w=400&h=400&fit=crop',
    'puri': 'https://images.unsplash.com/photo-1606491956689-2ea866880c84?w=400&h=400&fit=crop',
    'bhindi': 'https://images.unsplash.com/photo-1512058564366-18510be2db19?w=400&h=400&fit=crop',
    'aloo': 'https://images.unsplash.com/photo-1584697964150-7c290146188e?w=400&h=400&fit=crop',
    'bread': 'https://images.unsplash.com/photo-1598373182133-52452f7691ef?w=400&h=400&fit=crop',
    'toast': 'https://images.unsplash.com/photo-1598373182133-52452f7691ef?w=400&h=400&fit=crop',
    'sandwich': 'https://images.unsplash.com/photo-1528735602780-2552fd46c7af?w=400&h=400&fit=crop',
    'omelette': 'https://images.unsplash.com/photo-1482049016688-2d3e1b311543?w=400&h=400&fit=crop',
    'egg': 'https://images.unsplash.com/photo-1482049016688-2d3e1b311543?w=400&h=400&fit=crop',
    'corn flakes': 'https://images.unsplash.com/photo-1521483451569-e33803c0330c?w=400&h=400&fit=crop',
    'muesli': 'https://images.unsplash.com/photo-1517673400267-0251440c45dc?w=400&h=400&fit=crop',
    'oats': 'https://images.unsplash.com/photo-1517673400267-0251482c45dc?w=400&h=400&fit=crop',
    'porridge': 'https://images.unsplash.com/photo-1517673400267-0251482c45dc?w=400&h=400&fit=crop',
    'pancake': 'https://images.unsplash.com/photo-1567620905732-2d1ec7ab7445?w=400&h=400&fit=crop',
    'waffle': 'https://images.unsplash.com/photo-1562376552-0d160a2f238d?w=400&h=400&fit=crop',
    'fruits': 'https://images.unsplash.com/photo-1619566636858-adf3ef46400b?w=400&h=400&fit=crop',
    'fruit': 'https://images.unsplash.com/photo-1619566636858-adf3ef46400b?w=400&h=400&fit=crop',
    'yogurt': 'https://images.unsplash.com/photo-1488477181946-6428a0291777?w=400&h=400&fit=crop',
    'curd': 'https://images.unsplash.com/photo-1488477181946-6428a0291777?w=400&h=400&fit=crop',

    // ── Lunch / Dinner ─────────────────────────────────────────────
    'biryani': 'https://images.unsplash.com/photo-1563379091339-03b21ab4a4f8?w=400&h=400&fit=crop',
    'rice': 'https://images.unsplash.com/photo-1536304929831-ee1ca9d44906?w=400&h=400&fit=crop',
    'dal': 'https://images.unsplash.com/photo-1585937421612-70a008356fbe?w=400&h=400&fit=crop',
    'dal makhani': 'https://images.unsplash.com/photo-1585937421612-70a008356fbe?w=400&h=400&fit=crop',
    'dal tadka': 'https://images.unsplash.com/photo-1585937421612-70a008356fbe?w=400&h=400&fit=crop',
    'paneer': 'https://images.unsplash.com/photo-1567188040759-fb8a883dc6d8?w=400&h=400&fit=crop',
    'paneer tikka': 'https://images.unsplash.com/photo-1567188040759-fb8a883dc6d8?w=400&h=400&fit=crop',
    'paneer butter masala': 'https://images.unsplash.com/photo-1601050690597-df0568f70950?w=400&h=400&fit=crop',
    'butter chicken': 'https://images.unsplash.com/photo-1603894584373-5ac82b2ae398?w=400&h=400&fit=crop',
    'chicken': 'https://images.unsplash.com/photo-1603894584373-5ac82b2ae398?w=400&h=400&fit=crop',
    'chicken tikka': 'https://images.unsplash.com/photo-1599487488170-d11ec9c172f0?w=400&h=400&fit=crop',
    'chicken curry': 'https://images.unsplash.com/photo-1603894584373-5ac82b2ae398?w=400&h=400&fit=crop',
    'mutton': 'https://images.unsplash.com/photo-1606491956689-2ea866880c84?w=400&h=400&fit=crop',
    'mutton curry': 'https://images.unsplash.com/photo-1606491956689-2ea866880c84?w=400&h=400&fit=crop',
    'fish': 'https://images.unsplash.com/photo-1534604973900-c43ab4c2e0ab?w=400&h=400&fit=crop',
    'fish curry': 'https://images.unsplash.com/photo-1534604973900-c43ab4c2e0ab?w=400&h=400&fit=crop',
    'prawn': 'https://images.unsplash.com/photo-1565680018434-b513d6e51c4f?w=400&h=400&fit=crop',
    'roti': 'https://images.unsplash.com/photo-1565557623262-b51c2513a641?w=400&h=400&fit=crop',
    'naan': 'https://images.unsplash.com/photo-1565557623262-b51c2513a641?w=400&h=400&fit=crop',
    'chapati': 'https://images.unsplash.com/photo-1565557623262-b51c2513a641?w=400&h=400&fit=crop',
    'thali': 'https://images.unsplash.com/photo-1585937421612-70a008356fbe?w=400&h=400&fit=crop',
    'curry': 'https://images.unsplash.com/photo-1585937421612-70a008356fbe?w=400&h=400&fit=crop',
    'sabzi': 'https://images.unsplash.com/photo-1512058564366-18510be2db19?w=400&h=400&fit=crop',
    'vegetable': 'https://images.unsplash.com/photo-1512058564366-18510be2db19?w=400&h=400&fit=crop',
    'rajma': 'https://images.unsplash.com/photo-1585937421612-70a008356fbe?w=400&h=400&fit=crop',
    'kadhi': 'https://images.unsplash.com/photo-1585937421612-70a008356fbe?w=400&h=400&fit=crop',
    'sambar': 'https://images.unsplash.com/photo-1589301760014-d929f3979dbc?w=400&h=400&fit=crop',
    'rasam': 'https://images.unsplash.com/photo-1589301760014-d929f3979dbc?w=400&h=400&fit=crop',
    'pulao': 'https://images.unsplash.com/photo-1536304929831-ee1ca9d44906?w=400&h=400&fit=crop',
    'jeera rice': 'https://images.unsplash.com/photo-1536304929831-ee1ca9d44906?w=400&h=400&fit=crop',
    'fried rice': 'https://images.unsplash.com/photo-1603133872878-684f208fb84b?w=400&h=400&fit=crop',
    'noodles': 'https://images.unsplash.com/photo-1612929633738-8fe44f7ec841?w=400&h=400&fit=crop',
    'pasta': 'https://images.unsplash.com/photo-1621996346565-e3dbc646d9a9?w=400&h=400&fit=crop',
    'pizza': 'https://images.unsplash.com/photo-1565299624946-b28f40a0ae38?w=400&h=400&fit=crop',
    'burger': 'https://images.unsplash.com/photo-1568901346375-23c9450c58cd?w=400&h=400&fit=crop',
    'taco': 'https://images.unsplash.com/photo-1551504734-5ee1c4a1479b?w=400&h=400&fit=crop',
    'salad': 'https://images.unsplash.com/photo-1512621776951-a57141f2eefd?w=400&h=400&fit=crop',
    'soup': 'https://images.unsplash.com/photo-1547592166-23ac45744acd?w=400&h=400&fit=crop',
    'wrap': 'https://images.unsplash.com/photo-1626700051175-6818013e1d4f?w=400&h=400&fit=crop',
    'roll': 'https://images.unsplash.com/photo-1626700051175-6818013e1d4f?w=400&h=400&fit=crop',
    'kathi roll': 'https://images.unsplash.com/photo-1626700051175-6818013e1d4f?w=400&h=400&fit=crop',
    'tandoori': 'https://images.unsplash.com/photo-1599487488170-d11ec9c172f0?w=400&h=400&fit=crop',
    'kebab': 'https://images.unsplash.com/photo-1599487488170-d11ec9c172f0?w=400&h=400&fit=crop',
    'tikka': 'https://images.unsplash.com/photo-1599487488170-d11ec9c172f0?w=400&h=400&fit=crop',
    'masala': 'https://images.unsplash.com/photo-1585937421612-70a008356fbe?w=400&h=400&fit=crop',

    // ── Snacks ─────────────────────────────────────────────────────
    'samosa': 'https://images.unsplash.com/photo-1601050690597-df0568f70950?w=400&h=400&fit=crop',
    'pakora': 'https://images.unsplash.com/photo-1601050690597-df0568f70950?w=400&h=400&fit=crop',
    'vada': 'https://images.unsplash.com/photo-1601050690597-df0568f70950?w=400&h=400&fit=crop',
    'kachori': 'https://images.unsplash.com/photo-1601050690597-df0568f70950?w=400&h=400&fit=crop',
    'jalebi': 'https://images.unsplash.com/photo-1601050690597-df0568f70950?w=400&h=400&fit=crop',
    'gulab jamun': 'https://images.unsplash.com/photo-1601050690597-df0568f70950?w=400&h=400&fit=crop',
    'chai': 'https://images.unsplash.com/photo-1564890369478-c89ca6d9cde9?w=400&h=400&fit=crop',
    'tea': 'https://images.unsplash.com/photo-1564890369478-c89ca6d9cde9?w=400&h=400&fit=crop',
    'coffee': 'https://images.unsplash.com/photo-1509042239860-f550ce710b93?w=400&h=400&fit=crop',
    'juice': 'https://images.unsplash.com/photo-1621506289937-a8e4df240d0b?w=400&h=400&fit=crop',
    'milkshake': 'https://images.unsplash.com/photo-1572490122747-3968b75cc699?w=400&h=400&fit=crop',
    'lassi': 'https://images.unsplash.com/photo-1572490122747-3968b75cc699?w=400&h=400&fit=crop',
    'biscuit': 'https://images.unsplash.com/photo-1558961363-fa8fdf82db35?w=400&h=400&fit=crop',
    'cookie': 'https://images.unsplash.com/photo-1558961363-fa8fdf82db35?w=400&h=400&fit=crop',
    'cake': 'https://images.unsplash.com/photo-1578985545062-69928b1d9587?w=400&h=400&fit=crop',
    'brownie': 'https://images.unsplash.com/photo-1606313564200-e75d5e30476c?w=400&h=400&fit=crop',
    'papad': 'https://images.unsplash.com/photo-1601050690597-df0568f70950?w=400&h=400&fit=crop',
    'namkeen': 'https://images.unsplash.com/photo-1601050690597-df0568f70950?w=400&h=400&fit=crop',
    'sev': 'https://images.unsplash.com/photo-1601050690597-df0568f70950?w=400&h=400&fit=crop',
    'chaat': 'https://images.unsplash.com/photo-1601050690597-df0568f70950?w=400&h=400&fit=crop',
    'bhel': 'https://images.unsplash.com/photo-1601050690597-df0568f70950?w=400&h=400&fit=crop',
    'pani puri': 'https://images.unsplash.com/photo-1601050690597-df0568f70950?w=400&h=400&fit=crop',

    // ── Beverages ──────────────────────────────────────────────────
    'chaas': 'https://images.unsplash.com/photo-1488477181946-6428a0291777?w=400&h=400&fit=crop',
    'nimbu pani': 'https://images.unsplash.com/photo-1621506289937-a8e4df240d0b?w=400&h=400&fit=crop',
    'nimbu': 'https://images.unsplash.com/photo-1621506289937-a8e4df240d0b?w=400&h=400&fit=crop',
    'lemonade': 'https://images.unsplash.com/photo-1621506289937-a8e4df240d0b?w=400&h=400&fit=crop',

    // ── Component items (breads, rice, sides) ──────────────────────
    'tandoori roti': 'https://images.unsplash.com/photo-1565557623262-b51c2513a641?w=400&h=400&fit=crop',
    'steamed rice': 'https://images.unsplash.com/photo-1536304929831-ee1ca9d44906?w=400&h=400&fit=crop',
    'raita': 'https://images.unsplash.com/photo-1488477181946-6428a0291777?w=400&h=400&fit=crop',
    'chutney': 'https://images.unsplash.com/photo-1601050690597-df0568f70950?w=400&h=400&fit=crop',
    'pickle': 'https://images.unsplash.com/photo-1601050690597-df0568f70950?w=400&h=400&fit=crop',
};

// Fallback emoji mapping for slot types
const SLOT_FALLBACKS: Record<string, string> = {
    Breakfast: 'https://images.unsplash.com/photo-1533089860892-a7c6f0a88663?w=400&h=400&fit=crop',
    Lunch: 'https://images.unsplash.com/photo-1585937421612-70a008356fbe?w=400&h=400&fit=crop',
    Snacks: 'https://images.unsplash.com/photo-1601050690597-df0568f70950?w=400&h=400&fit=crop',
    Dinner: 'https://images.unsplash.com/photo-1585937421612-70a008356fbe?w=400&h=400&fit=crop',
};

export function getDishImageUrl(dishName?: string, slot?: string): string | null {
    if (!dishName && !slot) return null;

    const search = (dishName || '').toLowerCase();

    // 1. Exact match first
    if (dishName && DISH_IMAGE_MAP[search]) return DISH_IMAGE_MAP[search];

    // 2. Variant keyword match: if dish name includes a known variant type,
    //    show the corresponding protein/type image (e.g. "Thukpa Chicken" → chicken)
    const VARIANT_KEYWORDS: Record<string, string> = {
        chicken: 'chicken',
        mutton: 'mutton',
        lamb: 'mutton',
        goat: 'mutton',
        fish: 'fish',
        prawn: 'prawn',
        shrimp: 'prawn',
        paneer: 'paneer',
        egg: 'egg',
        veg: 'vegetable',
        vegetable: 'vegetable',
    };
    for (const [kw, mapKey] of Object.entries(VARIANT_KEYWORDS)) {
        if (search.includes(kw) && DISH_IMAGE_MAP[mapKey]) {
            return DISH_IMAGE_MAP[mapKey];
        }
    }

    // 3. Prefix match: check if base name (before any last-word suffix) matches
    //    (e.g. "Thukpa Chicken" → try "Thukpa")
    const words = search.split(' ');
    if (words.length > 1) {
        const baseName = words.slice(0, -1).join(' ');
        if (DISH_IMAGE_MAP[baseName]) return DISH_IMAGE_MAP[baseName];
    }

    // 4. Partial match (original loose logic)
    for (const [key, url] of Object.entries(DISH_IMAGE_MAP)) {
        if (search.includes(key) || key.includes(search)) return url;
    }

    // 5. Slot fallback
    if (slot && SLOT_FALLBACKS[slot]) return SLOT_FALLBACKS[slot];

    return null;
}

export const SLOT_FALLBACK = SLOT_FALLBACKS;
