import React, { createContext, useContext, useState, ReactNode } from 'react';

type Language = 'English' | 'Hindi' | 'Marathi' | 'Bengali' | 'Tamil' | 'Telugu';

type Translations = {
    [key in Language]: {
        [key: string]: string;
    };
};

const translations: Translations = {
    English: {
        'app.title': 'Meal',
        'app.role.admin': 'Director of Taste',
        'app.role.cook': 'Head Chef',
        'app.director': 'DIRECTOR',
        'nav.home': 'Home',
        'nav.rhythm': 'Rhythm',
        'nav.pantry': 'Pantry',
        'nav.director': 'Director',
        'home.todayEpisodes': "Today's Episodes",
        'home.allWrapped': 'All Wrapped Up!',
        'home.serviceComplete': 'Service complete for today.',
        'onboarding.start': 'Start the Scene',
        'onboarding.language': 'CHOOSE YOUR NATIVE TONGUE',
        'onboarding.vibe': 'Household Vibe',
        'onboarding.cast': 'Cast & Crew',
        'onboarding.flavor': 'Flavor Profile',
        'onboarding.topHits': 'Top Hits',
        'onboarding.finish': 'FINISH SETUP',
        'onboarding.showtime': 'SHOWTIME!',
        'onboarding.enterDashboard': 'Enter Dashboard',
        'actions.edit': 'Edit',
        'actions.skip': 'Skip Meal',
        'actions.share': 'Share Meal',
        'actions.initPrep': 'Initiate Prep',
        'actions.completed': 'Completed',
        'meals.ingredients': 'Ingredients',
        'meals.missing': 'missing',
        'meals.cooking': 'Cook Notified: Meal Cancelled',
        'meals.restored': 'Cook Notified: Meal Restored'
    },
    Hindi: {
        'app.title': 'मील',
        'app.role.admin': 'स्वाद निर्देशक',
        'app.role.cook': 'मुख्य रसोइया',
        'app.director': 'निर्देशक',
        'nav.home': 'होम',
        'nav.rhythm': 'ताल',
        'nav.pantry': 'रसोई भंडार',
        'nav.director': 'निर्देशक',
        'home.todayEpisodes': 'आज के एपिसोड',
        'home.allWrapped': 'सब कुछ तैयार!',
        'home.serviceComplete': 'आज की सेवा समाप्त।',
        'onboarding.start': 'दृश्य शुरू करें',
        'onboarding.language': 'अपनी मातृभाषा चुनें',
        'onboarding.vibe': 'घर का माहौल',
        'onboarding.cast': 'कलाकार और दल',
        'onboarding.flavor': 'स्वाद प्रोफ़ाइल',
        'onboarding.topHits': 'शीर्ष पसंद',
        'onboarding.finish': 'सेटअप समाप्त करें',
        'onboarding.showtime': 'शोटाइम!',
        'onboarding.enterDashboard': 'डैशबोर्ड में प्रवेश करें',
        'actions.edit': 'संपादित करें',
        'actions.skip': 'भोजन छोड़ें',
        'actions.share': 'भोजन साझा करें',
        'actions.initPrep': 'तैयारी शुरू करें',
        'actions.completed': 'पूर्ण',
        'meals.ingredients': 'सामग्री',
        'meals.missing': 'लापता',
        'meals.cooking': 'रसोइया सूचित: भोजन रद्द',
        'meals.restored': 'रसोइया सूचित: भोजन बहाल'
    },
    Marathi: {
        'app.title': 'जेवण',
        'app.role.admin': 'चव संचालक',
        'app.role.cook': 'मुख्य आचारी',
        'app.director': 'संचालक',
        'nav.home': 'घर',
        'nav.rhythm': 'लय',
        'nav.pantry': 'किराणा',
        'nav.director': 'संचालक',
        'home.todayEpisodes': 'आजचे भाग',
        'home.allWrapped': 'सर्व तयार!',
        'home.serviceComplete': 'आजची सेवा पूर्ण.',
        'onboarding.start': 'सीन सुरू करा',
        'onboarding.language': 'तुमची मातृभाषा निवडा',
        'onboarding.vibe': 'घरातील वातावरण',
        'onboarding.cast': 'पात्र आणि टीम',
        'onboarding.flavor': 'चव प्रोफाइल',
        'onboarding.topHits': 'लोकप्रिय निवडी',
        'onboarding.finish': 'सेटअप पूर्ण करा',
        'onboarding.showtime': 'शोटाइम!',
        'onboarding.enterDashboard': 'डॅशबोर्डवर जा',
        'actions.edit': 'संपादित करा',
        'actions.skip': 'जेवण वगळा',
        'actions.share': 'जेवण शेअर करा',
        'actions.initPrep': 'तयारी सुरू करा',
        'actions.completed': 'पूर्ण झाले',
        'meals.ingredients': 'साहित्य',
        'meals.missing': 'गहाळ',
        'meals.cooking': 'आचारी सूचित: जेवण रद्द',
        'meals.restored': 'आचारी सूचित: जेवण पुन्हा सुरू'
    },
    Bengali: {
        'app.title': 'মিল',
        'app.role.admin': 'স্বাদ পরিচালক',
        'app.role.cook': 'প্রধান রাঁধুনি',
        'app.director': 'পরিচালক',
        'nav.home': 'বাড়ি',
        'nav.rhythm': 'ছন্দ',
        'nav.pantry': 'প্যান্ট্রি',
        'nav.director': 'পরিচালক',
        'home.todayEpisodes': 'আজকের পর্ব',
        'home.allWrapped': 'সব প্রস্তুত!',
        'home.serviceComplete': 'আজকের সেবা সমাপ্ত।',
        'onboarding.start': 'দৃশ্য শুরু করুন',
        'onboarding.language': 'আপনার মাতৃভাষা বাছুন',
        'onboarding.vibe': 'বাড়ির পরিবেশ',
        'onboarding.cast': 'কুশীলব',
        'onboarding.flavor': 'স্বাদের ধরণ',
        'onboarding.topHits': 'সেরা পছন্দ',
        'onboarding.finish': 'সেটআপ শেষ করুন',
        'onboarding.showtime': 'শোটাইম!',
        'onboarding.enterDashboard': 'ড্যাশবোর্ডে প্রবেশ করুন',
        'actions.edit': 'সম্পাদনা',
        'actions.skip': 'খাবার বাদ দিন',
        'actions.share': 'খাবার শেয়ার করুন',
        'actions.initPrep': 'প্রস্তুতি শুরু',
        'actions.completed': 'সম্পন্ন',
        'meals.ingredients': 'উপকরণ',
        'meals.missing': 'অনুপস্থিত',
        'meals.cooking': 'রাঁধুনিকে জানানো হয়েছে: খাবার বাতিল',
        'meals.restored': 'রাঁধুনিকে জানানো হয়েছে: খাবার পুনরুদ্ধার'
    },
    Tamil: {
        'app.title': 'உணவு',
        'app.role.admin': 'சுவை இயக்குனர்',
        'app.role.cook': 'தலைமை சமையல்காரர்',
        'app.director': 'இயக்குனர்',
        'nav.home': 'முகப்பு',
        'nav.rhythm': 'ரிதம்',
        'nav.pantry': 'சரக்கறை',
        'nav.director': 'இயக்குனர்',
        'home.todayEpisodes': 'இன்றைய அத்தியாயங்கள்',
        'home.allWrapped': 'எல்லாம் முடிந்தது!',
        'home.serviceComplete': 'இன்றைய சேவை முடிந்தது.',
        'onboarding.start': 'காட்சியைத் தொடங்கு',
        'onboarding.language': 'தாய்மொழியைத் தேர்ந்தெடுக்கவும்',
        'onboarding.vibe': 'வீட்டு சூழல்',
        'onboarding.cast': 'நடிகர்கள் & குழுவினர்',
        'onboarding.flavor': 'சுவை சுயவிவரம்',
        'onboarding.topHits': 'சிறந்த தேர்வுகள்',
        'onboarding.finish': 'அமைப்பை முடிக்கவும்',
        'onboarding.showtime': 'காட்சி நேரம்!',
        'onboarding.enterDashboard': 'டாஷ்போர்டில் நுழையவும்',
        'actions.edit': 'திருந்தியமை',
        'actions.skip': 'தவிர்',
        'actions.share': 'பகிர்',
        'actions.initPrep': 'தயாரிப்பைத் தொடங்கு',
        'actions.completed': 'முடிந்தது',
        'meals.ingredients': 'தேவையான பொருட்கள்',
        'meals.missing': 'இல்லை',
        'meals.cooking': 'ரத்து செய்யப்பட்டது',
        'meals.restored': 'மீட்கப்பட்டது'
    },
    Telugu: {
        'app.title': 'భోజనం',
        'app.role.admin': 'రుచి దర్శకుడు',
        'app.role.cook': 'ప్రధాన వంటమనిషి',
        'app.director': 'దర్శకుడు',
        'nav.home': 'హోమ్',
        'nav.rhythm': 'రిథమ్',
        'nav.pantry': 'వంటగది',
        'nav.director': 'దర్శకుడు',
        'home.todayEpisodes': 'నేటి ఎపిసోడ్లు',
        'home.allWrapped': 'అంతా పూర్తయింది!',
        'home.serviceComplete': 'ఈ రోజు సేవ పూర్తయింది.',
        'onboarding.start': 'సీన్ ప్రారంభించండి',
        'onboarding.language': 'మీ మాతృభాషను ఎంచుకోండి',
        'onboarding.vibe': 'ఇంటి వాతావరణం',
        'onboarding.cast': 'నటీనటులు & సిబ్బంది',
        'onboarding.flavor': 'రుచి ప్రొఫైల్',
        'onboarding.topHits': 'అగ్ర ఎంపికలు',
        'onboarding.finish': 'సెటప్ పూర్తి చేయండి',
        'onboarding.showtime': 'షోటైమ్!',
        'onboarding.enterDashboard': 'డాష్‌బోర్డ్‌లోకి ప్రవేశించండి',
        'actions.edit': 'సవరించండి',
        'actions.skip': 'దాటవేయండి',
        'actions.share': 'భాగస్వామ్యం చేయండి',
        'actions.initPrep': 'తయారీ ప్రారంభించండి',
        'actions.completed': 'పూర్తయింది',
        'meals.ingredients': 'కావలసినవి',
        'meals.missing': 'లేవు',
        'meals.cooking': 'రద్దు చేయబడింది',
        'meals.restored': 'పునరుద్ధరించబడింది'
    }
};

interface TranslationContextType {
    language: Language;
    setLanguage: (lang: Language) => void;
    t: (key: string) => string;
}

const TranslationContext = createContext<TranslationContextType | undefined>(undefined);

export const TranslationProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
    const [language, setLanguage] = useState<Language>('English');

    const t = (key: string) => {
        return translations[language][key] || key;
    };

    return (
        <TranslationContext.Provider value={{ language, setLanguage, t }}>
            {children}
        </TranslationContext.Provider>
    );
};

export const useTranslation = () => {
    const context = useContext(TranslationContext);
    if (context === undefined) {
        throw new Error('useTranslation must be used within a TranslationProvider');
    }
    return context;
};
