import type { MealOption } from '../store/useStore';

export type ShareLanguage = 'en' | 'hi' | 'mr' | 'bn' | 'ta' | 'te';

export const LANGUAGE_OPTIONS = [
    { key: 'en', label: 'English' },
    { key: 'hi', label: 'Hindi' },
    { key: 'mr', label: 'Marathi' },
    { key: 'bn', label: 'Bengali' },
    { key: 'ta', label: 'Tamil' },
    { key: 'te', label: 'Telugu' },
] as const;

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
    },
};

export const getShareStrings = (lang: ShareLanguage) => STRINGS[lang];

export const formatMealLabel = (meal: MealOption | null | undefined) => {
    if (!meal) return '—';
    const label = meal.variant || meal.name;
    const qty = meal.quantity && meal.quantity > 1 ? ` x${meal.quantity}` : '';
    return `${label}${qty}`;
};
