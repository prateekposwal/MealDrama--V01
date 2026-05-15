export interface FruitInfo {
  name: string;
  aliases?: string[];
  season: string[];
  regions: string[];
  texture?: string;
  quality?: string;
}

export interface AvocadoAlt {
  name: string;
  aliases?: string[];
  quality: string;
  season: string;
  regions: string;
}

export const SEASONAL_FRUITS: Record<string, FruitInfo[]> = {
  summer: [
    { name: 'Mango', aliases: ['Alphonso', 'Kesar', 'Dasheri'], season: ['March', 'April', 'May', 'June'], regions: ['Nationwide'] },
    { name: 'Watermelon', season: ['March', 'April', 'May', 'June'], regions: ['Nationwide'] },
    { name: 'Muskmelon', season: ['March', 'April', 'May', 'June'], regions: ['Nationwide'] },
    { name: 'Litchi', season: ['May', 'June'], regions: ['Bihar', 'West Bengal'] },
    { name: 'Jackfruit', season: ['April', 'May', 'June'], regions: ['Kerala', 'West Bengal'] },
    { name: 'Jamun', aliases: ['Black Plum'], season: ['May', 'June'], regions: ['Nationwide'] },
    { name: 'Peach', season: ['April', 'May', 'June'], regions: ['Himachal', 'J&K', 'Uttarakhand'] },
    { name: 'Plum', season: ['April', 'May', 'June'], regions: ['Himachal', 'J&K', 'Uttarakhand'] },
  ],
  monsoon: [
    { name: 'Jamun', aliases: ['Black Plum'], season: ['July', 'August', 'September', 'October'], regions: ['Nationwide'] },
    { name: 'Pomegranate', season: ['July', 'August', 'September', 'October'], regions: ['Maharashtra', 'Gujarat'] },
    { name: 'Pear', season: ['July', 'August', 'September', 'October'], regions: ['Himachal', 'J&K', 'Uttarakhand'] },
    { name: 'Custard Apple', aliases: ['Sitaphal'], season: ['August', 'September', 'October'], regions: ['Maharashtra', 'Gujarat'] },
    { name: 'Pineapple', season: ['July', 'August', 'September', 'October'], regions: ['West Bengal', 'Kerala'] },
    { name: 'Passion Fruit', season: ['July', 'August', 'September', 'October'], regions: ['Kerala', 'Tamil Nadu'] },
  ],
  winter: [
    { name: 'Orange', aliases: ['Mandarin'], season: ['November', 'December', 'January', 'February'], regions: ['Maharashtra', 'Nagpur'] },
    { name: 'Kinnow', season: ['November', 'December', 'January', 'February'], regions: ['Punjab', 'Rajasthan'] },
    { name: 'Apple', season: ['November', 'December', 'January', 'February'], regions: ['Himachal', 'J&K'] },
    { name: 'Strawberry', season: ['November', 'December', 'January', 'February'], regions: ['Maharashtra', 'Himachal'] },
    { name: 'Grapes', season: ['November', 'December', 'January', 'February'], regions: ['Maharashtra', 'Tamil Nadu'] },
    { name: 'Guava', season: ['November', 'December', 'January', 'February'], regions: ['Uttar Pradesh', 'Bihar'] },
    { name: 'Sapota', aliases: ['Chikoo'], season: ['November', 'December', 'January', 'February'], regions: ['Maharashtra', 'Gujarat'] },
    { name: 'Dates', season: ['November', 'December', 'January', 'February'], regions: ['Rajasthan', 'Gujarat'] },
  ],
  allSeason: [
    { name: 'Banana', season: ['Year-round'], regions: ['Maharashtra', 'Tamil Nadu', 'Andhra Pradesh', 'Kerala'] },
    { name: 'Papaya', season: ['Year-round'], regions: ['Andhra Pradesh', 'Gujarat', 'Karnataka', 'Madhya Pradesh'] },
    { name: 'Lemon', season: ['Year-round'], regions: ['Nationwide'] },
    { name: 'Pomegranate', season: ['Year-round'], regions: ['Maharashtra', 'Gujarat'] },
    { name: 'Coconut', season: ['Year-round'], regions: ['Coastal Kerala', 'Karnataka', 'Tamil Nadu', 'West Bengal'] },
  ],
};

export const REGIONAL_FRUITS: Record<string, FruitInfo[]> = {
  north: [
    { name: 'Apple', season: ['November–February'], regions: ['Himachal', 'J&K', 'Uttarakhand'] },
    { name: 'Apricot', season: ['May–July'], regions: ['Himachal', 'J&K', 'Uttarakhand'] },
    { name: 'Cherry', season: ['May–July'], regions: ['Himachal', 'J&K', 'Uttarakhand'] },
    { name: 'Pear', season: ['July–October'], regions: ['Himachal', 'J&K', 'Uttarakhand'] },
    { name: 'Plum', season: ['May–July'], regions: ['Himachal', 'J&K', 'Uttarakhand'] },
    { name: 'Strawberry', season: ['February–April'], regions: ['Himachal', 'J&K', 'Uttarakhand'] },
  ],
  south: [
    { name: 'Banana', season: ['Year-round'], regions: ['Karnataka', 'TN', 'AP', 'Kerala'] },
    { name: 'Mango', aliases: ['Totapuri', 'Alphonso'], season: ['April–July'], regions: ['Karnataka', 'TN', 'AP', 'Kerala'] },
    { name: 'Pineapple', season: ['July–October'], regions: ['Karnataka', 'TN', 'AP', 'Kerala'] },
    { name: 'Jackfruit', season: ['April–June'], regions: ['Karnataka', 'TN', 'AP', 'Kerala'] },
    { name: 'Sapota', aliases: ['Chikoo'], season: ['November–February'], regions: ['Karnataka', 'TN', 'AP', 'Kerala'] },
    { name: 'Grapes', season: ['November–February'], regions: ['Karnataka', 'TN', 'AP', 'Kerala'] },
    { name: 'Papaya', season: ['Year-round'], regions: ['Karnataka', 'TN', 'AP', 'Kerala'] },
  ],
  west: [
    { name: 'Mango', aliases: ['Alphonso'], season: ['April–June'], regions: ['Maharashtra', 'Gujarat'] },
    { name: 'Grapes', season: ['November–February'], regions: ['Maharashtra', 'Gujarat'] },
    { name: 'Pomegranate', season: ['July–February'], regions: ['Maharashtra', 'Gujarat'] },
    { name: 'Banana', season: ['Year-round'], regions: ['Maharashtra', 'Gujarat'] },
    { name: 'Strawberry', aliases: ['Mahabaleshwar'], season: ['November–March'], regions: ['Maharashtra', 'Gujarat'] },
  ],
  east: [
    { name: 'Pineapple', season: ['July–October'], regions: ['Assam', 'Tripura', 'WB'] },
    { name: 'Litchi', season: ['May–June'], regions: ['Assam', 'Tripura', 'WB'] },
    { name: 'Mango', season: ['April–July'], regions: ['Assam', 'Tripura', 'WB'] },
    { name: 'Banana', season: ['Year-round'], regions: ['Assam', 'Tripura', 'WB'] },
    { name: 'Jackfruit', season: ['April–June'], regions: ['Assam', 'Tripura', 'WB'] },
  ],
};

export const AVOCADO_ALTERNATIVES: AvocadoAlt[] = [
  { name: 'Custard Apple', aliases: ['Sitaphal'], quality: 'Texture/Fat', season: 'Aug–Nov (Monsoon/Autumn)', regions: 'Maharashtra, Gujarat, Madhya Pradesh, Chhattisgarh' },
  { name: 'Chikoo', aliases: ['Sapota'], quality: 'Texture/Creamy', season: 'Year-round (Peak in Winter)', regions: 'Maharashtra, Gujarat, Karnataka' },
  { name: 'Banana', quality: 'Potassium/Creamy', season: 'Year-round', regions: 'Maharashtra, Tamil Nadu, Andhra Pradesh, Kerala' },
  { name: 'Tender Coconut', quality: 'Healthy Fats', season: 'Year-round (Peak Summer)', regions: 'Coastal Kerala, Karnataka, Tamil Nadu, West Bengal' },
  { name: 'Papaya', quality: 'Texture/Smooth', season: 'Year-round (Peak Summer)', regions: 'Andhra Pradesh, Gujarat, Karnataka, Madhya Pradesh' },
  { name: 'Mango (Ripe)', quality: 'Buttery/Rich', season: 'April–July (Summer)', regions: 'Nationwide (UP, AP, Maharashtra, Bihar)' },
];

export function getFruitsBySeason(season: string): FruitInfo[] {
  const normalized = season.toLowerCase();
  if (normalized.includes('summer')) return SEASONAL_FRUITS.summer;
  if (normalized.includes('monsoon') || normalized.includes('rainy')) return SEASONAL_FRUITS.monsoon;
  if (normalized.includes('winter')) return SEASONAL_FRUITS.winter;
  if (normalized.includes('year') || normalized.includes('all')) return SEASONAL_FRUITS.allSeason;
  return [];
}

export function getFruitsByRegion(region: string): FruitInfo[] {
  const key = region.toLowerCase().replace(' india', '');
  return REGIONAL_FRUITS[key] ?? [];
}
