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
    'nav.news': 'Nyheter',
    'nav.profile': 'Profil',
    'nav.portfolio': 'Smart Portfölj',
    'nav.aiChat': 'AI-chatt',
    'nav.openNavigation': 'Öppna navigering',
    'nav.mainMenu': 'Huvudmeny',
    'nav.aiTools': 'AI-Verktyg',
    'nav.account': 'Konto',
    'nav.login': 'Logga in',
    
    // Hero section
    'hero.title1': 'Din AI-partner',
    'hero.title2': 'för marknadsinsikter och portföljanalys',
    'hero.subtitle': 'Optimera din portfölj, förstå marknaden och få stöd i osäkra tider – enkelt, tryggt, smart.',
    'hero.cta.start': 'Kom igång gratis',
    'hero.cta.demo': 'Se hur det fungerar →',
    'hero.cta.final': 'Kom igång gratis idag',
    'hero.badge': 'Market Mind',
    'hero.headline': 'AI som förstår marknaden –\noch dig.',
    'hero.highlight1': 'Personliga AI-insikter anpassade efter dina mål.',
    'hero.highlight2': 'Banknivå-säkerhet och tydligt integritetsskydd.',
    'hero.highlight3': 'Allt du behöver för att förstå marknaden på några minuter.',
    'hero.integrity': 'Din integritet hanteras säkert och konfidentiellt.',
    'hero.chart.portfolioValueLabel': 'Portföljvärde',
    'hero.chart.portfolioValue': '1 312 450 kr',
    'hero.chart.performanceBadge': '+72%',
    'hero.chart.aiSignalLabel': 'AI-signal',
    'hero.chart.aiSignalValue': 'Hög potential',
    'hero.chart.aiSignalDescription': 'Starka momentum-siffror senaste månaden.',
    'hero.chart.riskLabel': 'Risknivå',
    'hero.chart.riskValue': 'Balanserad',
    'hero.chart.riskDescription': 'Portföljen är väl diversifierad.',
    
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
    'howItWorks.title': 'Så enkelt fungerar det',
    'howItWorks.subtitle': 'Tre steg till din personliga investeringsöversikt',
    'howItWorks.step1.title': 'Berätta om dig',
    'howItWorks.step1.description': 'Vi lär känna dina mål, erfarenhet och risktolerans i en enkel konversation.',
    'howItWorks.step2.title': 'AI analyserar din profil',
    'howItWorks.step2.description': 'Avancerad AI visar hur en balanserad portfölj kan se ut baserat på din risknivå.',
    'howItWorks.step3.title': 'Följ din utveckling',
    'howItWorks.step3.description': 'Få löpande insikter, marknadssignaler och inspiration när din situation förändras.',
    
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
    
    // AI Chat Page
    'aiChat.title': 'AI Portfolio Assistent',
    'aiChat.subtitle': 'Din intelligenta investeringsrådgivare som hjälper dig att fatta smartare beslut med AI-driven analys',
    'aiChat.loading': 'Laddar...',
    'aiChat.riskProfileRequired': 'Riskprofil krävs',
    'aiChat.riskProfileDesc': 'Du behöver skapa en riskprofil för att använda AI-assistenten',
    'aiChat.createRiskProfile': 'Skapa riskprofil',
    'aiChat.demo.title': 'Demo Konversation',
    'aiChat.demo.subtitle': 'Se hur AI-assistenten fungerar i praktiken',
    'aiChat.demo.liveDemo': 'Live Demo',
    'aiChat.demo.continueConversation': 'Fortsätt konversationen',
    'aiChat.demo.loginPrompt': 'Skapa ett konto för att få personliga AI-råd och portföljanalys',
    'aiChat.demo.loginButton': 'Logga in / Skapa konto',
    'aiChat.demo.assistantGreeting': 'Hej! Jag är din AI Portfolio Assistent. Jag hjälper dig med investeringsråd, portföljanalys och marknadsinsikter. Vad kan jag hjälpa dig med idag?',
    'aiChat.demo.userExample': 'Gör en analys av tesla',
    'aiChat.demo.assistantResponse': 'Tesla (TSLA) är definitivt en intressant investering att diskutera! För att ge dig den bästa analysen behöver jag veta mer om din investeringsprofil och mål. Skapa ett konto så kan jag ge dig personliga rekommendationer baserat på din riskprofil.',
    'aiChat.features.title': 'AI-funktioner',
    'aiChat.features.portfolioAnalysis': 'Portföljanalys',
    'aiChat.features.portfolioAnalysisDesc': 'Få en genomgång av din portföljs prestanda och struktur',
    'aiChat.features.portfolioAnalysisPrompt': 'Ge mig en komplett analys av min portfölj med rekommendationer för optimering',
    'aiChat.features.riskManagement': 'Riskhantering',
    'aiChat.features.riskManagementDesc': 'Identifiera och minimera risker för en mer balanserad portfölj',
    'aiChat.features.riskManagementPrompt': 'Analysera riskerna i min portfölj och föreslå strategier för bättre diversifiering',
    'aiChat.features.investmentSuggestions': 'Investeringsförslag',
    'aiChat.features.investmentSuggestionsDesc': 'Få personliga rekommendationer baserade på din riskprofil',
    'aiChat.features.investmentSuggestionsPrompt': 'Vilka aktier och tillgångar borde jag överväga nästa baserat på min profil?',
    'aiChat.features.marketInsights': 'Marknadsinsikter',
    'aiChat.features.marketInsightsDesc': 'Håll dig uppdaterad med aktuella marknadstrender',
    'aiChat.features.marketInsightsPrompt': 'Vad händer på marknaden just nu och hur påverkar det min investeringsstrategi?',
    
    // Portfolio Implementation
    'portfolio.title': 'Portfolio Analys',
    'portfolio.subtitle': 'Analysera och förstå din investeringsportfölj med AI-driven insikter',
    'portfolio.loading': 'Laddar din portfölj',
    'portfolio.loadingDesc': 'Hämtar dina investeringsdata...',
    'portfolio.createProfile': 'Skapa din investeringsprofil',
    'portfolio.createProfileDesc': 'Låt oss skapa din personliga investeringsstrategi genom en kort konversation',
    'portfolio.riskProfileRequired': 'Skapa din riskprofil',
    'portfolio.riskProfileRequiredDesc': 'Få AI-analys och personliga rekommendationer baserat på din investeringsstil',
    'portfolio.createProfile.button': 'Skapa profil',
    'portfolio.aiAnalysis': 'AI-Analys',
    'portfolio.updated': 'Uppdaterad',
    
    // Footer
    'footer.terms': 'Användarvillkor',
    'footer.privacy': 'Integritetspolicy',
    'footer.disclaimer': 'MarketMind tillhandahåller AI-baserad analys och allmän information, inte individuell investeringsrådgivning. För personlig rådgivning, kontakta en licensierad rådgivare.',
    'footer.copyright': 'Alla rättigheter förbehållna.',
    
    // Common
    'common.user': 'användare'
  },
  en: {
    // Navigation
    'nav.home': 'Home',
    'nav.discover': 'Discover',
    'nav.news': 'News',
    'nav.profile': 'Profile',
    'nav.portfolio': 'Smart Portfolio',
    'nav.aiChat': 'AI Assistant',
    'nav.openNavigation': 'Open navigation',
    'nav.mainMenu': 'Main Menu',
    'nav.aiTools': 'AI Tools',
    'nav.account': 'Account',
    'nav.login': 'Login',
    
    // Hero section
    'hero.title1': 'Your personal AI-powered',
    'hero.title2': 'investment guide',
    'hero.subtitle': 'Optimize your portfolio, understand the market, and get support in uncertain times – simple, secure, smart.',
    'hero.cta.start': 'Get started for free',
    'hero.cta.demo': 'See how it works →',
    'hero.cta.final': 'Get started for free today',
    'hero.badge': 'Market Mind',
    'hero.headline': 'AI that understands the market —\nand you.',
    'hero.highlight1': 'Personalized AI insights tailored to your goals.',
    'hero.highlight2': 'Bank-grade security with transparent privacy.',
    'hero.highlight3': 'Everything you need to understand the market in minutes.',
    'hero.integrity': 'Your privacy is handled securely and confidentially.',
    'hero.chart.portfolioValueLabel': 'Portfolio value',
    'hero.chart.portfolioValue': '1 312 450 kr',
    'hero.chart.performanceBadge': '+72%',
    'hero.chart.aiSignalLabel': 'AI signal',
    'hero.chart.aiSignalValue': 'High potential',
    'hero.chart.aiSignalDescription': 'Strong momentum figures over the last month.',
    'hero.chart.riskLabel': 'Risk level',
    'hero.chart.riskValue': 'Balanced',
    'hero.chart.riskDescription': 'The portfolio is well diversified.',
    
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
    'howItWorks.title': 'How it works',
    'howItWorks.subtitle': 'Three steps to your personal investment overview',
    'howItWorks.step1.title': 'Tell us about yourself',
    'howItWorks.step1.description': 'We get to know your goals, experience, and risk tolerance in a simple conversation.',
    'howItWorks.step2.title': 'AI analyses your profile',
    'howItWorks.step2.description': 'Advanced AI illustrates what a balanced portfolio could look like based on your risk level.',
    'howItWorks.step3.title': 'Track your progress',
    'howItWorks.step3.description': 'Receive ongoing insights, market signals, and inspiration as your situation evolves.',
    
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
    
    // AI Chat Page
    'aiChat.title': 'AI Portfolio Assistant',
    'aiChat.subtitle': 'Your intelligent investment advisor helping you make smarter decisions with AI-driven analysis',
    'aiChat.loading': 'Loading...',
    'aiChat.riskProfileRequired': 'Risk profile required',
    'aiChat.riskProfileDesc': 'You need to create a risk profile to use the AI assistant',
    'aiChat.createRiskProfile': 'Create risk profile',
    'aiChat.demo.title': 'Demo Conversation',
    'aiChat.demo.subtitle': 'See how the AI assistant works in practice',
    'aiChat.demo.liveDemo': 'Live Demo',
    'aiChat.demo.continueConversation': 'Continue the conversation',
    'aiChat.demo.loginPrompt': 'Create an account to get personalized AI advice and portfolio analysis',
    'aiChat.demo.loginButton': 'Login / Create account',
    'aiChat.demo.assistantGreeting': 'Hi! I\'m your AI Portfolio Assistant. I help you with investment advice, portfolio analysis and market insights. What can I help you with today?',
    'aiChat.demo.userExample': 'Do an analysis of Tesla',
    'aiChat.demo.assistantResponse': 'Tesla (TSLA) is definitely an interesting investment to discuss! To give you the best analysis I need to know more about your investment profile and goals. Create an account so I can give you personalized recommendations based on your risk profile.',
    'aiChat.features.title': 'AI Features',
    'aiChat.features.portfolioAnalysis': 'Portfolio Analysis',
    'aiChat.features.portfolioAnalysisDesc': 'Get a review of your portfolio\'s performance and structure',
    'aiChat.features.portfolioAnalysisPrompt': 'Give me a complete analysis of my portfolio with optimization recommendations',
    'aiChat.features.riskManagement': 'Risk Management',
    'aiChat.features.riskManagementDesc': 'Identify and minimize risks for a more balanced portfolio',
    'aiChat.features.riskManagementPrompt': 'Analyze the risks in my portfolio and suggest strategies for better diversification',
    'aiChat.features.investmentSuggestions': 'Investment Suggestions',
    'aiChat.features.investmentSuggestionsDesc': 'Get personalized recommendations based on your risk profile',
    'aiChat.features.investmentSuggestionsPrompt': 'What stocks and assets should I consider next based on my profile?',
    'aiChat.features.marketInsights': 'Market Insights',
    'aiChat.features.marketInsightsDesc': 'Stay updated with current market trends',
    'aiChat.features.marketInsightsPrompt': 'What\'s happening in the market right now and how does it affect my investment strategy?',
    
    // Portfolio Implementation
    'portfolio.title': 'Portfolio Analysis',
    'portfolio.subtitle': 'Analyze and understand your investment portfolio with AI-driven insights',
    'portfolio.loading': 'Loading your portfolio',
    'portfolio.loadingDesc': 'Fetching your investment data...',
    'portfolio.createProfile': 'Create your investment profile',
    'portfolio.createProfileDesc': 'Let us create your personal investment strategy through a short conversation',
    'portfolio.riskProfileRequired': 'Create your risk profile',
    'portfolio.riskProfileRequiredDesc': 'Get AI analysis and personalized recommendations based on your investment style',
    'portfolio.createProfile.button': 'Create profile',
    'portfolio.aiAnalysis': 'AI Analysis',
    'portfolio.updated': 'Updated',
    
    // Footer
    'footer.terms': 'Terms of Service',
    'footer.privacy': 'Privacy Policy',
    'footer.disclaimer': 'MarketMind provides AI-powered analysis and general information, not individualized investment advice. For personal advice, contact a licensed advisor.',
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