
import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Brain, Sparkles } from 'lucide-react';
import { useLanguage } from '@/contexts/LanguageContext';
import ChatPortfolioAdvisor from './ChatPortfolioAdvisor';

const ConversationalPortfolioAdvisor = () => {
  const [showChat, setShowChat] = useState(false);
  const { t } = useLanguage();

  if (showChat) {
    return <ChatPortfolioAdvisor />;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-background to-muted/20 py-16 px-4">
      <div className="max-w-5xl mx-auto">
        {/* Hero Section */}
        <div className="text-center mb-16">
          <div className="w-24 h-24 mx-auto bg-white rounded-3xl shadow-lg shadow-primary/10 flex items-center justify-center mb-8">
            <Brain className="w-12 h-12 text-primary" />
          </div>
          <h1 className="text-5xl font-bold text-foreground mb-6 tracking-tight">
            AI Portfolio Advisor
          </h1>
          <p className="text-xl text-muted-foreground max-w-3xl mx-auto leading-relaxed">
            {t('portfolioAdvisor.subtitle')}
          </p>
        </div>

        {/* Feature Cards */}
        <div className="grid md:grid-cols-2 gap-8 mb-16">
          <div className="bg-white rounded-3xl p-10 shadow-lg shadow-black/5 border border-border/50 hover:shadow-xl hover:shadow-black/10 transition-all duration-300">
            <div className="w-14 h-14 bg-primary/10 rounded-2xl flex items-center justify-center mb-8">
              <Sparkles className="w-7 h-7 text-primary" />
            </div>
            <h3 className="text-2xl font-semibold text-foreground mb-6">
              {t('portfolioAdvisor.chatConsultation')}
            </h3>
            <ul className="space-y-4 text-muted-foreground">
              <li className="flex items-start gap-4">
                <div className="w-2 h-2 bg-primary rounded-full mt-3 flex-shrink-0"></div>
                <span className="text-base leading-relaxed">{t('portfolioAdvisor.naturalConversation')}</span>
              </li>
              <li className="flex items-start gap-4">
                <div className="w-2 h-2 bg-primary rounded-full mt-3 flex-shrink-0"></div>
                <span className="text-base leading-relaxed">{t('portfolioAdvisor.oneQuestionAtTime')}</span>
              </li>
              <li className="flex items-start gap-4">
                <div className="w-2 h-2 bg-primary rounded-full mt-3 flex-shrink-0"></div>
                <span className="text-base leading-relaxed">{t('portfolioAdvisor.customFollowUps')}</span>
              </li>
            </ul>
          </div>
          
          <div className="bg-white rounded-3xl p-10 shadow-lg shadow-black/5 border border-border/50 hover:shadow-xl hover:shadow-black/10 transition-all duration-300">
            <div className="w-14 h-14 bg-primary/10 rounded-2xl flex items-center justify-center mb-8">
              <Brain className="w-7 h-7 text-primary" />
            </div>
            <h3 className="text-2xl font-semibold text-foreground mb-6">
              {t('portfolioAdvisor.personalAnalysis')}
            </h3>
            <ul className="space-y-4 text-muted-foreground">
              <li className="flex items-start gap-4">
                <div className="w-2 h-2 bg-primary rounded-full mt-3 flex-shrink-0"></div>
                <span className="text-base leading-relaxed">{t('portfolioAdvisor.analyzeInterests')}</span>
              </li>
              <li className="flex items-start gap-4">
                <div className="w-2 h-2 bg-primary rounded-full mt-3 flex-shrink-0"></div>
                <span className="text-base leading-relaxed">{t('portfolioAdvisor.suggestInvestments')}</span>
              </li>
              <li className="flex items-start gap-4">
                <div className="w-2 h-2 bg-primary rounded-full mt-3 flex-shrink-0"></div>
                <span className="text-base leading-relaxed">{t('portfolioAdvisor.createStrategy')}</span>
              </li>
            </ul>
          </div>
        </div>

        {/* How it works */}
        <div className="bg-white rounded-3xl p-12 shadow-lg shadow-black/5 border border-border/50 mb-12">
          <h3 className="text-2xl font-semibold text-foreground mb-10 text-center">
            {t('portfolioAdvisor.howItWorks')}
          </h3>
          <div className="grid md:grid-cols-4 gap-8">
            <div className="text-center">
              <div className="w-16 h-16 bg-primary text-white rounded-2xl flex items-center justify-center text-xl font-semibold mb-6 mx-auto shadow-lg shadow-primary/20">1</div>
              <p className="text-muted-foreground leading-relaxed">{t('portfolioAdvisor.step1')}</p>
            </div>
            <div className="text-center">
              <div className="w-16 h-16 bg-primary text-white rounded-2xl flex items-center justify-center text-xl font-semibold mb-6 mx-auto shadow-lg shadow-primary/20">2</div>
              <p className="text-muted-foreground leading-relaxed">{t('portfolioAdvisor.step2')}</p>
            </div>
            <div className="text-center">
              <div className="w-16 h-16 bg-primary text-white rounded-2xl flex items-center justify-center text-xl font-semibold mb-6 mx-auto shadow-lg shadow-primary/20">3</div>
              <p className="text-muted-foreground leading-relaxed">{t('portfolioAdvisor.step3')}</p>
            </div>
            <div className="text-center">
              <div className="w-16 h-16 bg-primary text-white rounded-2xl flex items-center justify-center text-xl font-semibold mb-6 mx-auto shadow-lg shadow-primary/20">4</div>
              <p className="text-muted-foreground leading-relaxed">{t('portfolioAdvisor.step4')}</p>
            </div>
          </div>
        </div>

        {/* CTA Button */}
        <div className="text-center">
          <Button 
            onClick={() => setShowChat(true)}
            className="h-16 px-12 text-lg font-semibold rounded-2xl shadow-lg shadow-primary/20 hover:shadow-xl hover:shadow-primary/25 transition-all duration-300"
            size="lg"
          >
            {t('portfolioAdvisor.startConsultation')}
            <Brain className="w-6 h-6 ml-3" />
          </Button>
        </div>
      </div>
    </div>
  );
};

export default ConversationalPortfolioAdvisor;
