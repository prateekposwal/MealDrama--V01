import type { MealOption } from '../store/useStore';

export type ShareLanguage = 'en' | 'hi' | 'mr' | 'bn' | 'ta' | 'te';

export const LANGUAGE_OPTIONS = [
    { key: 'en', label: 'English' },
    { key: 'hi', label: 'हिन्दी' },
    { key: 'mr', label: 'मराठी' },
    { key: 'bn', label: 'বাংলা' },
    { key: 'ta', label: 'தமிழ்' },
    { key: 'te', label: 'తెలుగు' },
] as const;

export const SLOT_LABELS: Record<ShareLanguage, Record<string, string>> = {
    en: { breakfast: 'Breakfast', lunch: 'Lunch', snacks: 'Snacks', dinner: 'Dinner' },
    hi: { breakfast: 'नाश्ता', lunch: 'दोपहर का खाना', snacks: 'नाश्ता', dinner: 'रात का खाना' },
    mr: { breakfast: 'नाश्ता', lunch: 'दुपारचे जेवण', snacks: 'नाश्ता', dinner: 'रात्रीचे जेवण' },
    bn: { breakfast: 'নাস্তা', lunch: 'দুপুরের খাবার', snacks: 'বিকেলের নাস্তা', dinner: 'রাতের খাবার' },
    ta: { breakfast: 'காலை உணவு', lunch: 'மதிய உணவு', snacks: 'சிறு உணவு', dinner: 'இரவு உணவு' },
    te: { breakfast: 'ఉపాహారం', lunch: 'మధ్యాహ్న భోజనం', snacks: 'టిఫిన్', dinner: 'రాత్రి భోజనం' },
};

export const COMPONENT_LABELS: Record<ShareLanguage, Record<string, string>> = {
    en: { gravy: 'Gravy', roti: 'Roti', rice: 'Rice', sides: 'Sides', beverages: 'Beverages', dessert: 'Dessert' },
    hi: { gravy: 'सब्जी/दाल', roti: 'रोटी', rice: 'चावल', sides: 'साइड', beverages: 'पेय', dessert: 'मीठा' },
    mr: { gravy: 'भाजी/डाळ', roti: 'पोळी', rice: 'भात', sides: 'साइड', beverages: 'पेय', dessert: 'गोड पदार्थ' },
    bn: { gravy: 'তরকারি/ডাল', roti: 'রুটি', rice: 'ভাত', sides: 'সাইড', beverages: 'পানীয়', dessert: 'মিষ্টি' },
    ta: { gravy: 'கறி/பருப்பு', roti: 'ரொட்டி', rice: 'அரிசி', sides: 'சைட்', beverages: 'பானம்', dessert: 'இனிப்பு' },
    te: { gravy: 'కూర/పప్పు', roti: 'రోటీ', rice: 'అన్నం', sides: 'సైడ్', beverages: 'పానీయం', dessert: 'మిఠాయి' },
};

const STRINGS: Record<ShareLanguage, {
    dailyTitle: string;
    weeklyTitle: string;
    pantryTitle: string;
    region: string;
    spice: string;
    todayPlan: string;
    weekPlan: string;
    pantryFor: string;
    sentFrom: string;
    brandHeader: string;
}> = {
    en: {
        dailyTitle: 'MealDrama - Today',
        weeklyTitle: 'MealDrama - This Week',
        pantryTitle: 'MealDrama Pantry List',
        region: 'Region',
        spice: 'Spice',
        todayPlan: "Today's meal plan",
        weekPlan: "This week's meals",
        pantryFor: 'Ingredients for',
        sentFrom: 'Sent from MealDrama',
        brandHeader: 'MealDrama',
    },
    hi: {
        dailyTitle: 'MealDrama - Aaj ka plan',
        weeklyTitle: 'MealDrama - Is hafte ka plan',
        pantryTitle: 'MealDrama pantry list',
        region: 'Region',
        spice: 'Spice',
        todayPlan: 'Aaj ka meal plan',
        weekPlan: 'Is hafte ke meals',
        pantryFor: 'In meals ke liye samaan',
        sentFrom: 'MealDrama se bheja gaya',
        brandHeader: 'MealDrama',
    },
    mr: {
        dailyTitle: 'MealDrama - Aajcha plan',
        weeklyTitle: 'MealDrama - Ya aathavdyacha plan',
        pantryTitle: 'MealDrama pantry list',
        region: 'Region',
        spice: 'Spice',
        todayPlan: 'Aajcha meal plan',
        weekPlan: 'Ya aathavdyache meals',
        pantryFor: 'Ya meals sathi saman',
        sentFrom: 'MealDrama kadun pathavle',
        brandHeader: 'MealDrama',
    },
    bn: {
        dailyTitle: 'MealDrama - Aajker plan',
        weeklyTitle: 'MealDrama - E soptaher plan',
        pantryTitle: 'MealDrama pantry list',
        region: 'Region',
        spice: 'Spice',
        todayPlan: 'Aajker meal plan',
        weekPlan: 'E soptaher meals',
        pantryFor: 'Ei meals er jonne jinish',
        sentFrom: 'MealDrama theke pathano',
        brandHeader: 'MealDrama',
    },
    ta: {
        dailyTitle: 'MealDrama - Indraya plan',
        weeklyTitle: 'MealDrama - Indha vaaram plan',
        pantryTitle: 'MealDrama pantry list',
        region: 'Region',
        spice: 'Spice',
        todayPlan: 'Indraya meal plan',
        weekPlan: 'Indha vaarathin meals',
        pantryFor: 'Indha meals ku thevaiyana porutkal',
        sentFrom: 'MealDrama ilirundhu anuppappattadhu',
        brandHeader: 'MealDrama',
    },
    te: {
        dailyTitle: 'MealDrama - Eeroju plan',
        weeklyTitle: 'MealDrama - Ee vaaram plan',
        pantryTitle: 'MealDrama pantry list',
        region: 'Region',
        spice: 'Spice',
        todayPlan: 'Eeroju meal plan',
        weekPlan: 'Ee vaaram meals',
        pantryFor: 'Ee meals kosam kavalsina samagri',
        sentFrom: 'MealDrama nundi pampabadindi',
        brandHeader: 'MealDrama',
    },
};

export const getShareStrings = (lang: ShareLanguage) => STRINGS[lang];

export const formatMealLabel = (meal: MealOption | null | undefined) => {
    if (!meal) return '—';
    const label = meal.variant || meal.name;
    const qty = meal.quantity && meal.quantity > 1 ? ` x${meal.quantity}` : '';

    const parts: string[] = [];
    const cat = meal.categorySelections;
    if (cat) {
        if (cat.gravy?.name) parts.push(cat.gravy.name);
        if (cat.roti?.name) parts.push(cat.roti.name);
        if (cat.rice?.name) parts.push(cat.rice.name);
        if (cat.sides?.length) parts.push(cat.sides.map(s => s.name).join(', '));
        if (cat.beverages?.length) parts.push(cat.beverages.map(b => b.name).join(', '));
    }

    if (parts.length > 0) {
        return `${label} | ${parts.join(' • ')}${qty}`;
    }
    return `${label}${qty}`;
};
