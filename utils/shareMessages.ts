// ─────────────────────────────────────────────────────────────────────────────
// Shared WhatsApp-message helpers — one canonical source for structural text
// (Λ6.5) + a lightweight structured-preview renderer.
//
// Language coverage: 10 Indian languages, native script, default English.
// These are app-authored translations (not professional localizations) —
// structural text is fully translated; dish/item names render in their
// known form and are passed through as-is from the callers.
// ─────────────────────────────────────────────────────────────────────────────

export type ShareLanguage = 'en' | 'hi' | 'mr' | 'bn' | 'ta' | 'te' | 'kn' | 'gu' | 'ml' | 'pa';

export const ALL_LANGUAGES: { key: ShareLanguage; label: string; native: string }[] = [
  { key: 'en', label: 'English', native: 'English' },
  { key: 'hi', label: 'Hindi', native: 'हिन्दी' },
  { key: 'mr', label: 'Marathi', native: 'मराठी' },
  { key: 'bn', label: 'Bengali', native: 'বাংলা' },
  { key: 'ta', label: 'Tamil', native: 'தமிழ்' },
  { key: 'te', label: 'Telugu', native: 'తెలుగు' },
  { key: 'kn', label: 'Kannada', native: 'ಕನ್ನಡ' },
  { key: 'gu', label: 'Gujarati', native: 'ગુજરાતી' },
  { key: 'ml', label: 'Malayalam', native: 'മലയാളം' },
  { key: 'pa', label: 'Punjabi', native: 'ਪੰਜਾਬੀ' },
];

export const LANG_TTS_MAP: Record<string, string> = {
  en: 'en-US', hi: 'hi-IN', mr: 'mr-IN', bn: 'bn-IN', ta: 'ta-IN', te: 'te-IN',
  kn: 'kn-IN', gu: 'gu-IN', ml: 'ml-IN', pa: 'pa-IN',
};

export const SLOT_LABELS: Record<ShareLanguage, Record<string, string>> = {
  en: { breakfast: 'Breakfast', lunch: 'Lunch', snacks: 'Snacks', dinner: 'Dinner' },
  hi: { breakfast: 'नाश्ता', lunch: 'दोपहर का भोजन', snacks: 'नाश्ता', dinner: 'रात का भोजन' },
  mr: { breakfast: 'नाश्ता', lunch: 'दुपारचे जेवण', snacks: 'खाणे', dinner: 'रात्रीचे जेवण' },
  bn: { breakfast: 'নাস্তা', lunch: 'দুপুরের খাবার', snacks: 'বিকালের নাস্তা', dinner: 'রাতের খাবার' },
  ta: { breakfast: 'காலை உணவு', lunch: 'மதிய உணவு', snacks: 'சிற்றுண்டி', dinner: 'இரவு உணவு' },
  te: { breakfast: 'అల్పాహారం', lunch: 'మధ్యాహ్న భోజనం', snacks: 'టిఫిన్', dinner: 'రాత్రి భోజనం' },
  kn: { breakfast: 'ಉಪಹಾರ', lunch: 'ಮಧ್ಯಾಹ್ನದ ಊಟ', snacks: 'ತಿಂಡಿ', dinner: 'ರಾತ್ರಿ ಊಟ' },
  gu: { breakfast: 'નાસ્તો', lunch: 'મધ્યાહ્ન ભોજન', snacks: 'નાસ્તો', dinner: 'રાત્રિ ભોજન' },
  ml: { breakfast: 'പ്രഭാത ഭക്ഷണം', lunch: 'ഉച്ചഭക്ഷണം', snacks: 'ലഘുഭക്ഷണം', dinner: 'അത്താഴം' },
  pa: { breakfast: 'ਨਾਸ਼ਤਾ', lunch: 'ਦੁਪਹਿਰ ਦਾ ਖਾਣਾ', snacks: 'ਸਨੈਕਸ', dinner: 'ਰਾਤ ਦਾ ਖਾਣਾ' },
};

export const COMPONENT_LABELS: Record<ShareLanguage, Record<string, string>> = {
  en: { gravy: 'Gravy', roti: 'Roti', rice: 'Rice', sides: 'Sides', beverages: 'Beverages', dessert: 'Dessert' },
  hi: { gravy: 'सब्जी/दाल', roti: 'रोटी', rice: 'चावल', sides: 'साइड', beverages: 'पेय', dessert: 'मीठा' },
  mr: { gravy: 'भाजी/डाळ', roti: 'पोळी', rice: 'भात', sides: 'साइड', beverages: 'पेय', dessert: 'गोड' },
  bn: { gravy: 'তরকারি/ডাল', roti: 'রুটি', rice: 'ভাত', sides: 'সাইড', beverages: 'পানীয়', dessert: 'মিষ্টি' },
  ta: { gravy: 'கறி/பருப்பு', roti: 'ரொட்டி', rice: 'அரிசி', sides: 'சைட்', beverages: 'பானம்', dessert: 'இனிப்பு' },
  te: { gravy: 'కూర/పప్పు', roti: 'రోటీ', rice: 'అన్నం', sides: 'సైడ్', beverages: 'పానీయం', dessert: 'మిఠాయి' },
  kn: { gravy: 'ಸಬ್ಜಿ/ಪಪ್ಪು', roti: 'ರೊಟ್ಟಿ', rice: 'ಅನ್ನ', sides: 'ಸೈಡ್', beverages: 'ಪಾನೀಯ', dessert: 'ಸಿಹಿ' },
  gu: { gravy: 'શાક/દાળ', roti: 'રોટલી', rice: 'ભાત', sides: 'સાઇડ', beverages: 'પીણાં', dessert: 'મીઠાઈ' },
  ml: { gravy: 'കറി/പരിപ്പ്', roti: 'റൊട്ടി', rice: 'ചോറ്', sides: 'സൈഡ്', beverages: 'പാനീയം', dessert: 'മധുരം' },
  pa: { gravy: 'ਸਬਜ਼ੀ/ਦਾਲ', roti: 'ਰੋਟੀ', rice: 'ਚੌਲ', sides: 'ਸਾਈਡ', beverages: 'ਪੀਣ ਵਾਲੇ', dessert: 'ਮਿੱਠਾ' },
};

export const SHARE_STRINGS: Record<ShareLanguage, {
  dailyTitle: string; weeklyTitle: string; pantryTitle: string;
  region: string; spice: string; todayPlan: string; weekPlan: string;
  pantryFor: string; sentFrom: string; brandHeader: string;
  needToBuy: string; alreadyHave: string; mealsToPrepare: string;
  recipeTitle: string; recipeDisclaimer: string; addEnglish: string;
  leftoverTitle: string; useBy: string; freezeTip: string; leftoverFor: string; left: string;
}> = {
  en: {
    dailyTitle: 'MealDrama - Today', weeklyTitle: 'MealDrama - This Week',
    pantryTitle: 'MealDrama Pantry List', region: 'Region', spice: 'Spice',
    todayPlan: "Today's meal plan", weekPlan: "This week's meals",
    pantryFor: 'Ingredients for', sentFrom: 'Sent from MealDrama', brandHeader: 'MealDrama',
    needToBuy: 'NEED TO BUY', alreadyHave: 'ALREADY HAVE', mealsToPrepare: 'MEALS TO PREPARE',
    recipeTitle: 'Recipe', recipeDisclaimer: 'Style guide — not the house recipe.',
    addEnglish: 'Include English too',
    leftoverTitle: 'Leftover ideas',
    useBy: 'use by',
    freezeTip: 'Freeze it',
    leftoverFor: 'Try the rest in',
    left: 'left',
  },
  hi: {
    dailyTitle: 'मीलड्रामा - आज का प्लान', weeklyTitle: 'मीलड्रामा - इस सप्ताह का प्लान',
    pantryTitle: 'मीलड्रामा पैंट्री सूची', region: 'क्षेत्र', spice: 'मसाला',
    todayPlan: 'आज का भोजन प्लान', weekPlan: 'इस सप्ताह का भोजन',
    pantryFor: 'इनके लिए सामान', sentFrom: 'मीलड्रामा से भेजा गया', brandHeader: 'मीलड्रामा',
    needToBuy: 'खरीदना है', alreadyHave: 'पहले से है', mealsToPrepare: 'बनाने के लिए भोजन',
    recipeTitle: 'रेसिपी', recipeDisclaimer: 'स्टाइल गाइड — असली रेसिपी नहीं।',
    addEnglish: 'अंग्रेज़ी भी शामिल करें',
    leftoverTitle: 'बचे हुए सामान के विचार',
    useBy: 'उपयोग तिथि',
    freezeTip: 'फ्रीज़ करें',
    leftoverFor: 'बाकी इस्तेमाल करें',
    left: 'बचा है',
  },
  mr: {
    dailyTitle: 'मीलड्रामा - आजचा प्लान', weeklyTitle: 'मीलड्रामा - या आठवड्याचा प्लान',
    pantryTitle: 'मीलड्रामा किराणा यादी', region: 'प्रदेश', spice: 'मसाला',
    todayPlan: 'आजचा जेवण प्लान', weekPlan: 'या आठवड्याचे जेवण',
    pantryFor: 'यांसाठी साहित्य', sentFrom: 'मीलड्रामा कडून पाठविले', brandHeader: 'मीलड्रामा',
    needToBuy: 'खरेदी करायचे', alreadyHave: 'आधीच आहे', mealsToPrepare: 'बनवण्यासाठी जेवण',
    recipeTitle: 'रेसिपी', recipeDisclaimer: 'शैली मार्गदर्शक — मूळ रेसिपी नाही.',
    addEnglish: 'इंग्रजीही समाविष्ट करा',
    leftoverTitle: 'शिल्लक सामानाच्या कल्पना',
    useBy: 'वापर तारीख',
    freezeTip: 'गोठवा',
    leftoverFor: 'बाकीचा वापर करा',
    left: 'शिल्लक',
  },
  bn: {
    dailyTitle: 'মিলড্রামা - আজকের প্ল্যান', weeklyTitle: 'মিলড্রামা - এই সপ্তাহের প্ল্যান',
    pantryTitle: 'মিলড্রামা বাজার তালিকা', region: 'অঞ্চল', spice: 'মসলা',
    todayPlan: 'আজকের খাবার প্ল্যান', weekPlan: 'এই সপ্তাহের খাবার',
    pantryFor: 'এর জন্য সামগ্রী', sentFrom: 'মিলড্রামা থেকে পাঠানো', brandHeader: 'মিলড্রামা',
    needToBuy: 'কিনতে হবে', alreadyHave: 'আগে থেকেই আছে', mealsToPrepare: 'বানানোর খাবার',
    recipeTitle: 'রেসিপি', recipeDisclaimer: 'স্টাইল গাইড — আসল রেসিপি নয়।',
    addEnglish: 'ইংরেজিও অন্তর্ভুক্ত করুন',
    leftoverTitle: 'বাকি সামগ্রীর ভাবনা',
    useBy: 'ব্যবহারের তারিখ',
    freezeTip: 'ফ্রিজে রাখুন',
    leftoverFor: 'বাকিটা ব্যবহার করুন',
    left: 'বাকি',
  },
  ta: {
    dailyTitle: 'மீல்டிராமா - இன்றைய திட்டம்', weeklyTitle: 'மீல்டிராமா - இந்த வாரத் திட்டம்',
    pantryTitle: 'மீல்டிராமா பல்பொருள் பட்டியல்', region: 'பகுதி', spice: 'மசாலா',
    todayPlan: 'இன்றைய உணவுத் திட்டம்', weekPlan: 'இந்த வார உணவுகள்',
    pantryFor: 'இதற்கான பொருட்கள்', sentFrom: 'மீல்டிராமாவிலிருந்து அனுப்பப்பட்டது', brandHeader: 'மீல்டிராமா',
    needToBuy: 'வாங்க வேண்டும்', alreadyHave: 'ஏற்கனவே உள்ளது', mealsToPrepare: 'சமைக்க வேண்டிய உணவுகள்',
    recipeTitle: 'சமையல் குறிப்பு', recipeDisclaimer: 'பாணி வழிகாட்டி — அசல் செய்முறை அல்ல.',
    addEnglish: 'ஆங்கிலமும் சேர்க்கவும்',
    leftoverTitle: 'மீதி பொருட்களுக்கான யோசனைகள்',
    useBy: 'பயன்படுத்தும் தேதி',
    freezeTip: 'ஃப்ரீசரில் வைக்கவும்',
    leftoverFor: 'மீதியைப் பயன்படுத்தவும்',
    left: 'மீதம்',
  },
  te: {
    dailyTitle: 'మీల్డ్రామా - ఈరోజు ప్లాన్', weeklyTitle: 'మీల్డ్రామా - ఈ వారం ప్లాన్',
    pantryTitle: 'మీల్డ్రామా గృహావసరాల జాబితా', region: 'ప్రాంతం', spice: 'మసాలా',
    todayPlan: 'ఈరోజు భోజన ప్లాన్', weekPlan: 'ఈ వారం భోజనాలు',
    pantryFor: 'వీటికి కావల్సిన సామగ్రి', sentFrom: 'మీల్డ్రామా నుండి పంపబడింది', brandHeader: 'మీల్డ్రామా',
    needToBuy: 'కొనాలి', alreadyHave: 'ఇప్పటికే ఉంది', mealsToPrepare: 'తయారు చేయాల్సిన భోజనాలు',
    recipeTitle: 'వంటకం', recipeDisclaimer: 'శైలి మార్గదర్శి — అసలు వంటకం కాదు.',
    addEnglish: 'ఇంగ్లీష్ కూడా చేర్చండి',
    leftoverTitle: 'మిగిలిన వస్తువుల ఆలోచనలు',
    useBy: 'ఉపయోగించే తేదీ',
    freezeTip: 'ఫ్రీజ్ చేయండి',
    leftoverFor: 'మిగతాది వాడండి',
    left: 'మిగిలింది',
  },
  kn: {
    dailyTitle: 'ಮೀಲ್ಡ್ರಾಮಾ - ಇಂದಿನ ಯೋಜನೆ', weeklyTitle: 'ಮೀಲ್ಡ್ರಾಮಾ - ಈ ವಾರದ ಯೋಜನೆ',
    pantryTitle: 'ಮೀಲ್ಡ್ರಾಮಾ ಸಾಮಾನು ಪಟ್ಟಿ', region: 'ಪ್ರದೇಶ', spice: 'ಮಸಾಲೆ',
    todayPlan: 'ಇಂದಿನ ಊಟದ ಯೋಜನೆ', weekPlan: 'ಈ ವಾರದ ಊಟಗಳು',
    pantryFor: 'ಇವುಗಳಿಗೆ ಸಾಮಾನು', sentFrom: 'ಮೀಲ್ಡ್ರಾಮಾ ನಿಂದ ಕಳುಹಿಸಲಾಗಿದೆ', brandHeader: 'ಮೀಲ್ಡ್ರಾಮಾ',
    needToBuy: 'ಖರೀದಿಸಬೇಕು', alreadyHave: 'ಈಗಾಗಲೇ ಇದೆ', mealsToPrepare: 'ಮಾಡಬೇಕಾದ ಊಟಗಳು',
    recipeTitle: 'ಅಡುಗೆ ವಿಧಾನ', recipeDisclaimer: 'ಶೈಲಿ ಮಾರ್ಗದರ್ಶಿ — ನಿಜವಾದ ವಿಧಾನವಲ್ಲ.',
    addEnglish: 'ಇಂಗ್ಲಿಷ್ ಕೂಡ ಸೇರಿಸಿ',
    leftoverTitle: 'ಉಳಿದ ವಸ್ತುಗಳ ವಿಚಾರಗಳು',
    useBy: 'ಬಳಕೆ ದಿನಾಂಕ',
    freezeTip: 'ಫ್ರೀಜ್ ಮಾಡಿ',
    leftoverFor: 'ಉಳಿದದ್ದನ್ನು ಬಳಸಿ',
    left: 'ಉಳಿದಿದೆ',
  },
  gu: {
    dailyTitle: 'મીલડ્રામા - આજનો પ્લાન', weeklyTitle: 'મીલડ્રામા - આ અઠવાડિયાનો પ્લાન',
    pantryTitle: 'મીલડ્રામા કરિયાણાની યાદી', region: 'પ્રદેશ', spice: 'મસાલો',
    todayPlan: 'આજનો ભોજન પ્લાન', weekPlan: 'આ અઠવાડિયાનું ભોજન',
    pantryFor: 'આ માટે સામગ્રી', sentFrom: 'મીલડ્રામા થી મોકલાયું', brandHeader: 'મીલડ્રામા',
    needToBuy: 'ખરીદવું છે', alreadyHave: 'પહેલેથી છે', mealsToPrepare: 'બનાવવાનું ભોજન',
    recipeTitle: 'રેસીપી', recipeDisclaimer: 'શૈલી માર્ગદર્શિકા — અસલ રેસીપી નથી.',
    addEnglish: 'અંગ્રેજી પણ ઉમેરો',
    leftoverTitle: 'બચેલા સામાનના વિચારો',
    useBy: 'ઉપયોગ તારીખ',
    freezeTip: 'ફ્રીઝ કરો',
    leftoverFor: 'બાકીનું વાપરો',
    left: 'બચ્યું',
  },
  ml: {
    dailyTitle: 'മീൽഡ്രാമ - ഇന്നത്തെ പ്ലാൻ', weeklyTitle: 'മീൽഡ്രാമ - ഈ ആഴ്ചയിലെ പ്ലാൻ',
    pantryTitle: 'മീൽഡ്രാമ സാധനങ്ങളുടെ ലിസ്റ്റ്', region: 'പ്രദേശം', spice: 'മസാല',
    todayPlan: 'ഇന്നത്തെ ഭക്ഷണ പ്ലാൻ', weekPlan: 'ഈ ആഴ്ചയിലെ ഭക്ഷണം',
    pantryFor: 'ഇവയ്ക്കുള്ള സാധനങ്ങൾ', sentFrom: 'മീൽഡ്രാമയിൽ നിന്ന് അയച്ചത്', brandHeader: 'മീൽഡ്രാമ',
    needToBuy: 'വാങ്ങണം', alreadyHave: 'ഇതിനകം ഉണ്ട്', mealsToPrepare: 'പാകം ചെയ്യേണ്ട ഭക്ഷണം',
    recipeTitle: 'പാചകക്കുറിപ്പ്', recipeDisclaimer: 'ശൈലി ഗൈഡ് — യഥാർത്ഥ പാചകക്കുറിപ്പല്ല.',
    addEnglish: 'ഇംഗ്ലീഷും ചേർക്കുക',
    leftoverTitle: 'ബാക്കി സാധനങ്ങൾക്കുള്ള ആശയങ്ങൾ',
    useBy: 'ഉപയോഗ തീയതി',
    freezeTip: 'ഫ്രീസ് ചെയ്യുക',
    leftoverFor: 'ബാക്കി ഉപയോഗിക്കുക',
    left: 'ബാക്കി',
  },
  pa: {
    dailyTitle: 'ਮੀਲਡਰਾਮਾ - ਅੱਜ ਦਾ ਪਲਾਨ', weeklyTitle: 'ਮੀਲਡਰਾਮਾ - ਇਸ ਹਫ਼ਤੇ ਦਾ ਪਲਾਨ',
    pantryTitle: 'ਮੀਲਡਰਾਮਾ ਰਸੋਈ ਸੂਚੀ', region: 'ਖੇਤਰ', spice: 'ਮਸਾਲਾ',
    todayPlan: 'ਅੱਜ ਦਾ ਖਾਣਾ ਪਲਾਨ', weekPlan: 'ਇਸ ਹਫ਼ਤੇ ਦੇ ਖਾਣੇ',
    pantryFor: 'ਇਨ੍ਹਾਂ ਲਈ ਸਮਾਨ', sentFrom: 'ਮੀਲਡਰਾਮਾ ਤੋਂ ਭੇਜਿਆ ਗਿਆ', brandHeader: 'ਮੀਲਡਰਾਮਾ',
    needToBuy: 'ਖਰੀਦਣਾ ਹੈ', alreadyHave: 'ਪਹਿਲਾਂ ਤੋਂ ਹੈ', mealsToPrepare: 'ਬਣਾਉਣ ਲਈ ਖਾਣਾ',
    recipeTitle: 'ਪਕਵਾਨ', recipeDisclaimer: 'ਸਟਾਈਲ ਗਾਈਡ — ਅਸਲ ਪਕਵਾਨ ਨਹੀਂ।',
    addEnglish: 'ਅੰਗਰੇਜ਼ੀ ਵੀ ਸ਼ਾਮਲ ਕਰੋ',
    leftoverTitle: 'ਬਚੇ ਸਮਾਨ ਦੇ ਵਿਚਾਰ',
    useBy: 'ਵਰਤੋਂ ਤਾਰੀਖ',
    freezeTip: 'ਫ੍ਰੀਜ਼ ਕਰੋ',
    leftoverFor: 'ਬਾਕੀ ਵਰਤੋ',
    left: 'ਬਚਿਆ',
  },
};

export const getShareStrings = (lang: ShareLanguage) => SHARE_STRINGS[lang] ?? SHARE_STRINGS.en;

/** Represents one rendered preview line (never raw WhatsApp markdown). */
export interface PreviewLine {
  text: string;
  bold?: boolean;
  icon?: string;
  sub?: boolean;
}

/**
 * Render a WhatsApp-markdown message string into structured preview lines:
 * pulls `*bold*` to bold text, `━━━` dividers to icon separators, bullet lines
 * to sub-lines. Deterministic.
 */
export function renderSharePreview(message: string): PreviewLine[] {
  if (!message) return [];
  const lines: PreviewLine[] = [];
  for (const raw of message.split('\n')) {
    const line = raw.trimEnd();
    if (!line.trim()) continue;
    const divider = line.match(/^\s*(━━{2,}|—{3,}|-{8,})\s*$/);
    if (divider) {
      lines.push({ text: '—', icon: '▪' });
      continue;
    }
    const bullet = line.match(/^\s*(?:•)\s?(.*)$/);
    if (bullet) {
      lines.push({ text: stripMd(bullet[1]!), sub: true });
      continue;
    }
    lines.push({ text: stripMd(line), bold: /\*[^*]*\*/.test(line) });
  }
  return lines;
}

function stripMd(s: string): string {
  return s.replace(/\*([^*]+)\*/g, '$1').replace(/[#_~>]/g, '').trim();
}

export function messageCharCount(message: string): number {
  return message.length;
}

/** WhatsApp allows 4,096 chars in wa.me text. */
export const WHATSAPP_LIMIT = 4096;

// ─── Recipe share (honestly labeled "style guide", not a curated house recipe) ─

export interface RecipeShareInput {
  name: string;
  icon?: string;
  region?: string;
  type?: string;
  diet?: string;
  cookingStyle?: string;
  tip?: string;
  description?: string;
  ingredients: { name: string; quantity?: number; unit?: string; category?: string }[];
  pairings?: { sides?: string[]; beverages?: string[] };
}

/** Singular/aliased ingredient-name normalization + unit normalization, so
 *  "Potato"/"Potatoes", "pcs"/"pc", "tbsp"/"tbsps" merge into ONE line and
 *  duplicate variant rows aggregate instead of repeating (the WhatsApp
 *  Recipe-to-Cook duplication bug). */
const INGREDIENT_ALIASES: Record<string, string> = {
  'potatoes': 'potato', 'tomatoes': 'tomato', 'onions': 'onion', 'chillies': 'chilli',
  'green chillies': 'green chilli', 'gingers': 'ginger', 'garlics': 'garlic',
  'leaves': 'leaf', 'coriander leaves': 'coriander', 'curry leaves': 'curry leaf',
  'capsicums': 'capsicum', 'carrots': 'carrot', 'beetroots': 'beetroot',
  'cucumbers': 'cucumber', 'radishes': 'radish', 'spring onions': 'spring onion',
  'cabbages': 'cabbage', 'peas ': 'pea ', 'breads': 'bread', 'ghees': 'ghee',
};
const UNIT_ALIASES: Record<string, string> = {
  'pcs': 'pc', 'pieces': 'pc', 'gms': 'g', 'grms': 'g', 'tbsps': 'tbsp',
  'teaspoons': 'tsp', 'cups': 'cup', 'liters': 'liter', 'litres': 'liter',
  'handfuls': 'handful', 'sprigs': 'sprig', 'pods': 'pod', 'pinchs': 'pinch',
  'cloves': 'clove', 'bunches': 'bunch', 'packets': 'packet',
};

function normIngredientName(name: string): string {
  let n = (name || '').trim().toLowerCase();
  n = INGREDIENT_ALIASES[n] ?? n;
  if (n.endsWith('s') && !n.endsWith('ss') && !n.endsWith('us') && n !== 'peas' && n !== 'oats' && n !== 'lentils') {
    n = n.slice(0, -1);
  }
  return n.trim();
}

const titleCase = (s: string) => (s ? s.charAt(0).toUpperCase() + s.slice(1) : s);

function normIngredientUnit(unit?: string): string {
  if (!unit) return '';
  const u = String(unit).trim().toLowerCase();
  return UNIT_ALIASES[u] ?? u;
}

export interface AggregatedIngredient {
  name: string;
  quantity?: number;
  unit?: string;
  category?: string;
}

/** Merge duplicate/aliased ingredient rows, summing quantities per (name, unit). */
export function aggregateIngredients(
  ingredients: { name: string; quantity?: number; unit?: string; category?: string }[],
): AggregatedIngredient[] {
  const map = new Map<string, AggregatedIngredient>();
  for (const ing of ingredients ?? []) {
    const keyName = normIngredientName(ing.name);
    if (!keyName) continue;
    const unit = normIngredientUnit(ing.unit);
    const key = `${keyName}|${unit}`;
    const existing = map.get(key);
    if (existing) {
      existing.quantity = (existing.quantity ?? 1) + (ing.quantity ?? 1);
    } else {
      map.set(key, {
        name: titleCase(keyName),
        quantity: ing.quantity ?? 1,
        unit: unit || undefined,
        category: ing.category || 'pantry',
      });
    }
  }
  return [...map.values()];
}
export const STYLE_STEPS: Record<string, string[]> = {
  tadka: ['Heat oil; add spices to temper.', 'Add the base and cook on low heat.', 'Finish with fresh garnish.'],
  tawa: ['Heat a flat tawa or skillet.', 'Cook each side until golden.', 'Rest briefly before serving.'],
  tandoori: ['Marinate the pieces well in advance.', 'Preheat the oven or tandoor hot.', 'Roast until charred at the edges.'],
  dum: ['Layer the ingredients in a pot.', 'Seal the lid tightly.', 'Cook on low heat (dum).'],
  steamed: ['Prepare the batter or dough.', 'Steam in a steamer until set.', 'Cool slightly before serving.'],
  fried: ['Heat oil over medium heat.', 'Fry until crisp and golden.', 'Drain on paper.'],
  roasted: ['Roast dry or with a little oil.', 'Turn occasionally for even color.', 'Season to taste.'],
  slow_cooked: ['Cook on the lowest heat.', 'Stir occasionally; do not rush.', 'Rest before serving.'],
  chhaunk: ['Temper oil with whole spices.', 'Pour over the finished dish.', 'Serve immediately.'],
  chilled: ['Prepare and chill thoroughly.', 'Keep cold until serving.'],
  frozen: ['Freeze until just set.', 'Serve cold.'],
  raw: ['Assemble fresh ingredients.', 'Season and toss.', 'Serve immediately.'],
  marinated: ['Marinate at least 30 minutes.', 'Cook or grill as suited.', 'Serve with a squeeze of lime.'],
  boiled: ['Boil until just tender.', 'Drain and season.', 'Serve warm.'],
  baked: ['Bake at moderate heat.', 'Check doneness with a skewer.', 'Cool slightly before cutting.'],
};

export function recipeShareForDish(input: RecipeShareInput, language: ShareLanguage = 'en'): string {
  const s = getShareStrings(language);
  const styleSteps = input.cookingStyle
    ? STYLE_STEPS[input.cookingStyle] || STYLE_STEPS[normalizeStyle(input.cookingStyle)]
    : undefined;

  const lines: string[] = [];
  lines.push(`*${input.icon ? input.icon + ' ' : ''}${input.name}*`);
  const meta: string[] = [];
  if (input.region) meta.push(`${s.region}: ${input.region}`);
  if (input.type || input.diet) meta.push(`${input.type || input.diet}`);
  if (meta.length) lines.push(meta.join(' · '));

  if (input.description) lines.push('', input.description);

  if (input.ingredients.length) {
    lines.push('', `*${s.pantryFor}*`);
    const byCat = new Map<string, string[]>();
    for (const ing of aggregateIngredients(input.ingredients)) {
      const cat = ing.category || 'pantry';
      const qty = ing.quantity !== undefined && ing.quantity !== null ? ` — ${ing.quantity}${ing.unit || ''}` : '';
      const arr = byCat.get(cat) || [];
      arr.push(`  • ${ing.name}${qty}`);
      byCat.set(cat, arr);
    }
    for (const [cat, arr] of byCat) {
      lines.push(`→ ${cat}`, ...arr);
    }
  }

  if (input.pairings?.sides?.length || input.pairings?.beverages?.length) {
    lines.push('', `*${s.mealsToPrepare}*`);
    if (input.pairings.sides?.length) lines.push(`  • ${input.pairings.sides.join(', ')}`);
    if (input.pairings.beverages?.length) lines.push(`  • ${input.pairings.beverages.join(', ')}`);
  }

  if (styleSteps?.length) {
    lines.push('', `*${s.recipeTitle}*`);
    styleSteps.forEach((step, i) => lines.push(`${i + 1}. ${step}`));
    if (input.tip) lines.push('', `💡 ${input.tip}`);
    lines.push('', `_${s.recipeDisclaimer}_`);
  }

  lines.push('', s.sentFrom);
  return lines.join('\n');
}

function normalizeStyle(style: string): string {
  return (style || '').toLowerCase().replace(/[\s-]+/g, '_');
}