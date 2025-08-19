import React, { createContext, useContext, useState, useEffect } from 'react';

export type Language = 'sv' | 'en';

interface LanguageContextType {
  language: Language;
  setLanguage: (language: Language) => void;
  t: (key: string) => string;
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

const translations = {
  sv: {
    // Navigation
    'nav.home': 'Hem',
    'nav.discover': 'Upptäck',
    'nav.profile': 'Profil',
    'nav.portfolio': 'Smart Portfölj',
    'nav.aiChat': 'AI-Assistent',
    'nav.mainMenu': 'Huvudmeny',
    'nav.aiTools': 'AI-Verktyg',
    'nav.account': 'Konto',
    'nav.login': 'Logga in',
    
    // Hero section
    'hero.title1': 'Din personliga',
    'hero.title2': 'finansiella rådgivare',
    'hero.subtitle': 'Optimera din portfölj, förstå marknaden och få stöd i osäkra tider. Enkelt, tryggt, smart.',
    'hero.cta.start': 'Kom igång gratis',
    'hero.cta.demo': 'Se hur det fungerar →',
    'hero.cta.final': 'Kom igång gratis idag',
    
    // Examples section
    'examples.title': 'Personliga råd för alla',
    'examples.subtitle': 'Oavsett var du är i livet hjälper vi dig bygga ekonomisk trygghet',
    'examples.conservative.name': 'Anna, 45',
    'examples.conservative.type': 'Konservativ investerare',
    'examples.conservative.question': '"Hjälp mig bygga en trygg portfölj för min pension. Jag vill sova gott om nätterna."',
    'examples.conservative.answer': '"Perfekt! 70% räntor och 30% stabila aktier för trygghet."',
    'examples.aggressive.name': 'Erik, 26',
    'examples.aggressive.type': 'Aggressiv investerare',
    'examples.aggressive.question': '"Jag är ung och vill maximera tillväxten. Kan ta höga risker!"',
    'examples.aggressive.answer': '"Utmärkt! 90% tillväxtaktier för långsiktig hög avkastning!"',
    'examples.dividend.name': 'Gunnar, 62',
    'examples.dividend.type': 'Utdelningsfokus',
    'examples.dividend.question': '"Jag vill ha regelbunden inkomst från utdelningar."',
    'examples.dividend.answer': '"Klart! Utdelningsaktier med 4-6% direktavkastning!"',
    
    // How it works
    'howItWorks.title': 'Så enkelt är det',
    'howItWorks.subtitle': 'Tre enkla steg till din personliga investeringsstrategi',
    'howItWorks.step1.title': 'Berätta om dig',
    'howItWorks.step1.description': 'Vi lär känna dina mål, riskprofil och drömmar i en enkel konversation',
    'howItWorks.step2.title': 'AI skapar din plan',
    'howItWorks.step2.description': 'Avancerad AI bygger en personlig portfölj baserad på dina behov',
    'howItWorks.step3.title': 'Följ din utveckling',
    'howItWorks.step3.description': 'Löpande uppföljning och anpassning när ditt liv förändras',
    
    // Final CTA
    'finalCta.title': 'Redo att börja din resa?',
    'finalCta.subtitle': 'Tusentals svenskar har redan tagit steget. Nu är det din tur.',
    
    // Dashboard
    'dashboard.greeting': 'Hej',
    'dashboard.subtitle': 'Här är din investeringsöversikt för idag',
    'dashboard.totalSavings': 'Totalt sparande',
    'dashboard.holdings': 'Innehav',
    'dashboard.onTrack': '↗ På väg mot dina mål',
    'dashboard.balancedSpread': 'Välbalanserad spridning',
    'dashboard.aiInsight': 'AI-insikt för dig',
    'dashboard.highReliability': 'Hög tillförlitlighet',
    'dashboard.mediumReliability': 'Medel tillförlitlighet',
    
    // Footer
    'footer.copyright': 'All rights reserved.',
    
    // Common
    'common.user': 'användare'
  },
  en: {
    // Navigation
    'nav.home': 'Home',
    'nav.discover': 'Discover',
    'nav.profile': 'Profile',
    'nav.portfolio': 'Smart Portfolio',
    'nav.aiChat': 'AI Assistant',
    'nav.mainMenu': 'Main Menu',
    'nav.aiTools': 'AI Tools',
    'nav.account': 'Account',
    'nav.login': 'Login',
    
    // Hero section
    'hero.title1': 'Your personal',
    'hero.title2': 'financial advisor',
    'hero.subtitle': 'Optimize your portfolio, understand the market and get support during uncertain times. Simple, secure, smart.',
    'hero.cta.start': 'Get started for free',
    'hero.cta.demo': 'See how it works →',
    'hero.cta.final': 'Get started for free today',
    
    // Examples section
    'examples.title': 'Personal advice for everyone',
    'examples.subtitle': 'Wherever you are in life, we help you build financial security',
    'examples.conservative.name': 'Anna, 45',
    'examples.conservative.type': 'Conservative investor',
    'examples.conservative.question': '"Help me build a secure portfolio for my retirement. I want to sleep well at night."',
    'examples.conservative.answer': '"Perfect! 70% bonds and 30% stable stocks for security."',
    'examples.aggressive.name': 'Erik, 26',
    'examples.aggressive.type': 'Aggressive investor',
    'examples.aggressive.question': '"I\'m young and want to maximize growth. I can take high risks!"',
    'examples.aggressive.answer': '"Excellent! 90% growth stocks for long-term high returns!"',
    'examples.dividend.name': 'Gunnar, 62',
    'examples.dividend.type': 'Dividend focus',
    'examples.dividend.question': '"I want regular income from dividends."',
    'examples.dividend.answer': '"Sure! Dividend stocks with 4-6% direct yield!"',
    
    // How it works
    'howItWorks.title': 'It\'s that simple',
    'howItWorks.subtitle': 'Three simple steps to your personal investment strategy',
    'howItWorks.step1.title': 'Tell us about yourself',
    'howItWorks.step1.description': 'We get to know your goals, risk profile and dreams in a simple conversation',
    'howItWorks.step2.title': 'AI creates your plan',
    'howItWorks.step2.description': 'Advanced AI builds a personal portfolio based on your needs',
    'howItWorks.step3.title': 'Follow your progress',
    'howItWorks.step3.description': 'Continuous monitoring and adjustment as your life changes',
    
    // Final CTA
    'finalCta.title': 'Ready to start your journey?',
    'finalCta.subtitle': 'Thousands of Swedes have already taken the step. Now it\'s your turn.',
    
    // Dashboard
    'dashboard.greeting': 'Hi',
    'dashboard.subtitle': 'Here\'s your investment overview for today',
    'dashboard.totalSavings': 'Total savings',
    'dashboard.holdings': 'Holdings',
    'dashboard.onTrack': '↗ On track to your goals',
    'dashboard.balancedSpread': 'Well-balanced spread',
    'dashboard.aiInsight': 'AI insight for you',
    'dashboard.highReliability': 'High reliability',
    'dashboard.mediumReliability': 'Medium reliability',
    
    // Footer
    'footer.copyright': 'All rights reserved.',
    
    // Common
    'common.user': 'user'
  }
};

export const LanguageProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [language, setLanguage] = useState<Language>(() => {
    const saved = localStorage.getItem('language');
    return (saved as Language) || 'sv';
  });

  useEffect(() => {
    localStorage.setItem('language', language);
  }, [language]);

  const t = (key: string): string => {
    return translations[language][key as keyof typeof translations[typeof language]] || key;
  };

  return (
    <LanguageContext.Provider value={{ language, setLanguage, t }}>
      {children}
    </LanguageContext.Provider>
  );
};

export const useLanguage = () => {
  const context = useContext(LanguageContext);
  if (context === undefined) {
    throw new Error('useLanguage must be used within a LanguageProvider');
  }
  return context;
};