import { createContext, useContext, useState, useEffect, ReactNode } from 'react';

export type Language = 'en' | 'hi';

const translations = {
  en: {
    // Nav
    pricing: 'Pricing',
    dashboard: 'Dashboard',
    studioLogin: 'Studio Log In',
    newProject: 'New Project',
    startFree: 'Start Free',
    settings: 'Settings',
    support: 'Support',
    signOut: 'Sign Out',
    newAlbum: 'New Album',

    // Home Hero
    heroTag: 'Digital Shagun for the Modern Studio',
    heroTitle1: 'Cinematic',
    heroTitle2: 'Royal Digital',
    heroTitle3: 'Albums.',
    heroDesc: 'Preserve your "Shubh-Vivah" memories in an interactive 3D royal experience. Upload your first "Shaadi" project for',
    heroDescBold: 'free trial',
    heroDescEnd: 'and honor your traditions.',
    heroBtn1: 'Upload Your Free 1st Album',
    heroBtn2: 'Launch Demo Experience',
    trustedBy: 'Trusted by',
    eliteStudios: '500+ Elite Studios',
    acrossIndia: 'across India & Abroad',

    // How it works
    howItWorksTitle1: 'From Raw Photos',
    howItWorksTitle2: 'to 3D Magic.',
    howItWorksDesc: 'Our cinematic engine does the heavy lifting. You just focus on capturing the beauty.',
    tryItYourself: 'Try it Yourself',
    step1Title: 'Upload',
    step1Desc: 'Drop your high-res photos into our secure dashboard.',
    step2Title: 'Theme',
    step2Desc: 'Select a Royal theme and cinematic background score.',
    step3Title: 'Share',
    step3Desc: 'Get your custom QR code and wow your clients instantly.',

    // Wall of Love
    wallOfLove: 'Wall of',
    love: 'Love.',
    wallOfLoveTag: "Trusted by India's most creative minds",

    // Pricing
    simplePricing: 'Simple',
    pricingWord: 'Pricing',
    pricingDesc: 'Get full cinematic 3D features at half the price of competitors. Start for free and grow as you need.',
    studioCredit: 'Studio Credit',
    singleProject: 'Single Project',
    perAlbum: '/ album',
    purchaseCredit: 'Purchase 1 Credit',
    eliteStudio: 'Elite Studio',
    unlimitedEvents: 'Unlimited Events',
    perMonth: '/mo',
    mostPopular: 'Most Popular',
    selectMonthly: 'Select Studio Monthly',
    labsSpecial: 'Labs Special',
    eliteLabs: 'Elite Labs',
    perYear: '/yr',
    getEliteYearly: 'Get Elite Yearly',

    // Dashboard
    dashboardTerminal: 'Dashboard Terminal',
    welcomeBack: 'Welcome back,',
    myCollections: 'My Collections',
    manageProjects: 'Manage and share your digital storytelling projects.',
    searchGalleries: 'SEARCH GALLERIES...',
    workspaceEmpty: 'Workspace Empty',
    workspaceEmptyDesc: 'Your digital shelf is waiting for its first masterpiece. Start your journey now.',
    createFirstAlbum: 'Create First Album',
    openAlbum: 'Open Album',

    // Viewer
    protectedProject: 'Protected Project',
    enterAccessKey: 'Enter Studio Access Key',
    unlockCollection: 'Unlock Collection',
    cinemaReady: 'Your Digital Cinema is Ready',
    tapForExperience: 'Tap below for the full immersive experience',
    startImmersive: 'Start Immersive View',
    rotateDevice: 'Please rotate your device',
    landscapeHint: 'to landscape for the full immersive 3D experience.',

    // Settings
    studioProfile: 'Studio Profile',
    studioIdentity: 'Studio Identity',
    customizeIdentity: 'Customize how your business appears to your clients.',
    studioLogo: 'Studio Logo',
    businessName: 'Business Name',
    contactWhatsApp: 'Contact WhatsApp',
    dashboardPasscode: 'Dashboard Passcode',
    pushBrandChanges: 'Push Brand Changes',
    billingPlan: 'Billing & Plan',
    currentPlan: 'Current Plan',
    availableCredits: 'Available Credits',

    // Footer
    chatWithExperts: 'Chat with Experts',
    playExperience: 'Play 3D Experience',
    clickToLaunch: 'Click to launch immersive viewer',

    // Common
    all: 'All',
    loading: 'Loading...',
    save: 'Save',
    delete: 'Delete',
    cancel: 'Cancel',
    confirm: 'Confirm',
    close: 'Close',
  },
  hi: {
    // Nav
    pricing: 'मूल्य',
    dashboard: 'डैशबोर्ड',
    studioLogin: 'स्टूडियो लॉग इन',
    newProject: 'नया प्रोजेक्ट',
    startFree: 'मुफ्त शुरू करें',
    settings: 'सेटिंग्स',
    support: 'सहायता',
    signOut: 'साइन आउट',
    newAlbum: 'नया एल्बम',

    // Home Hero
    heroTag: 'आधुनिक स्टूडियो के लिए डिजिटल शगुन',
    heroTitle1: 'सिनेमैटिक',
    heroTitle2: 'रॉयल डिजिटल',
    heroTitle3: 'एल्बम।',
    heroDesc: 'अपनी "शुभ-विवाह" यादों को एक इंटरैक्टिव 3D रॉयल अनुभव में संरक्षित करें। अपना पहला "शादी" प्रोजेक्ट',
    heroDescBold: 'मुफ्त ट्रायल',
    heroDescEnd: 'के लिए अपलोड करें और अपनी परंपराओं का सम्मान करें।',
    heroBtn1: 'अपना मुफ्त पहला एल्बम अपलोड करें',
    heroBtn2: 'डेमो अनुभव शुरू करें',
    trustedBy: 'विश्वसनीय',
    eliteStudios: '500+ एलीट स्टूडियो',
    acrossIndia: 'भारत और विदेश में',

    // How it works
    howItWorksTitle1: 'कच्ची तस्वीरों से',
    howItWorksTitle2: '3D जादू तक।',
    howItWorksDesc: 'हमारा सिनेमैटिक इंजन भारी काम करता है। आप बस सुंदरता कैद करने पर ध्यान दें।',
    tryItYourself: 'खुद आज़माएं',
    step1Title: 'अपलोड करें',
    step1Desc: 'अपनी हाई-रेज़ तस्वीरें हमारे सुरक्षित डैशबोर्ड में डालें।',
    step2Title: 'थीम चुनें',
    step2Desc: 'एक रॉयल थीम और सिनेमैटिक बैकग्राउंड म्यूजिक चुनें।',
    step3Title: 'शेयर करें',
    step3Desc: 'अपना कस्टम QR कोड पाएं और अपने ग्राहकों को चकित करें।',

    // Wall of Love
    wallOfLove: 'प्रेम की',
    love: 'दीवार।',
    wallOfLoveTag: 'भारत के सबसे रचनात्मक दिमागों द्वारा विश्वसनीय',

    // Pricing
    simplePricing: 'सरल',
    pricingWord: 'मूल्य',
    pricingDesc: 'प्रतिस्पर्धियों की आधी कीमत पर पूर्ण सिनेमैटिक 3D सुविधाएं प्राप्त करें। मुफ्त में शुरू करें।',
    studioCredit: 'स्टूडियो क्रेडिट',
    singleProject: 'सिंगल प्रोजेक्ट',
    perAlbum: '/ एल्बम',
    purchaseCredit: '1 क्रेडिट खरीदें',
    eliteStudio: 'एलीट स्टूडियो',
    unlimitedEvents: 'अनलिमिटेड इवेंट्स',
    perMonth: '/महीना',
    mostPopular: 'सबसे लोकप्रिय',
    selectMonthly: 'मासिक प्लान चुनें',
    labsSpecial: 'लैब्स स्पेशल',
    eliteLabs: 'एलीट लैब्स',
    perYear: '/वर्ष',
    getEliteYearly: 'वार्षिक एलीट पाएं',

    // Dashboard
    dashboardTerminal: 'डैशबोर्ड टर्मिनल',
    welcomeBack: 'वापसी, ',
    myCollections: 'मेरे कलेक्शन',
    manageProjects: 'अपने डिजिटल स्टोरीटेलिंग प्रोजेक्ट्स को प्रबंधित और साझा करें।',
    searchGalleries: 'गैलरी खोजें...',
    workspaceEmpty: 'वर्कस्पेस खाली है',
    workspaceEmptyDesc: 'आपकी डिजिटल शेल्फ अपनी पहली कृति का इंतजार कर रही है। अभी शुरू करें।',
    createFirstAlbum: 'पहला एल्बम बनाएं',
    openAlbum: 'एल्बम खोलें',

    // Viewer
    protectedProject: 'सुरक्षित प्रोजेक्ट',
    enterAccessKey: 'स्टूडियो एक्सेस कुंजी दर्ज करें',
    unlockCollection: 'कलेक्शन अनलॉक करें',
    cinemaReady: 'आपका डिजिटल सिनेमा तैयार है',
    tapForExperience: 'पूर्ण इमर्सिव अनुभव के लिए नीचे टैप करें',
    startImmersive: 'इमर्सिव व्यू शुरू करें',
    rotateDevice: 'कृपया अपना डिवाइस घुमाएं',
    landscapeHint: 'पूर्ण इमर्सिव 3D अनुभव के लिए लैंडस्केप में।',

    // Settings
    studioProfile: 'स्टूडियो प्रोफाइल',
    studioIdentity: 'स्टूडियो पहचान',
    customizeIdentity: 'अनुकूलित करें कि आपका व्यवसाय आपके ग्राहकों को कैसा दिखता है।',
    studioLogo: 'स्टूडियो लोगो',
    businessName: 'व्यवसाय का नाम',
    contactWhatsApp: 'संपर्क WhatsApp',
    dashboardPasscode: 'डैशबोर्ड पासकोड',
    pushBrandChanges: 'ब्रांड परिवर्तन सेव करें',
    billingPlan: 'बिलिंग और प्लान',
    currentPlan: 'वर्तमान प्लान',
    availableCredits: 'उपलब्ध क्रेडिट',

    // Footer
    chatWithExperts: 'विशेषज्ञों से बात करें',
    playExperience: '3D अनुभव चलाएं',
    clickToLaunch: 'इमर्सिव व्यूअर लॉन्च करने के लिए क्लिक करें',

    // Common
    all: 'सभी',
    loading: 'लोड हो रहा है...',
    save: 'सेव करें',
    delete: 'हटाएं',
    cancel: 'रद्द करें',
    confirm: 'पुष्टि करें',
    close: 'बंद करें',
  }
};

type TranslationKey = keyof typeof translations.en;

interface I18nContextType {
  lang: Language;
  setLang: (lang: Language) => void;
  t: (key: TranslationKey) => string;
}

const I18nContext = createContext<I18nContextType>({
  lang: 'en',
  setLang: () => {},
  t: (key) => key,
});

export function I18nProvider({ children }: { children: ReactNode }) {
  const [lang, setLangState] = useState<Language>(() => {
    if (typeof window !== 'undefined') {
      return (localStorage.getItem('eventfold_lang') as Language) || 'en';
    }
    return 'en';
  });

  const setLang = (newLang: Language) => {
    setLangState(newLang);
    localStorage.setItem('eventfold_lang', newLang);
  };

  const t = (key: TranslationKey): string => {
    return translations[lang]?.[key] || translations.en[key] || key;
  };

  return (
    <I18nContext.Provider value={{ lang, setLang, t }}>
      {children}
    </I18nContext.Provider>
  );
}

export function useI18n() {
  return useContext(I18nContext);
}

// Language toggle component - can be used anywhere
export function LanguageToggle({ className = '' }: { className?: string }) {
  const { lang, setLang } = useI18n();

  return (
    <button
      onClick={() => setLang(lang === 'en' ? 'hi' : 'en')}
      className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all hover:scale-105 active:scale-95 ${
        lang === 'hi'
          ? 'bg-[#FF9933]/10 border border-[#FF9933]/20 text-[#FF9933]'
          : 'bg-white/5 border border-white/10 text-white/40 hover:text-white'
      } ${className}`}
      title={lang === 'en' ? 'हिंदी में बदलें' : 'Switch to English'}
    >
      <span className="text-sm">{lang === 'en' ? '🇮🇳' : '🇬🇧'}</span>
      {lang === 'en' ? 'हिंदी' : 'ENG'}
    </button>
  );
}
