import React, { useCallback, useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import Layout from '@/components/Layout';
import AIChat from '@/components/AIChat';
import AIChatLayout from '@/components/AIChatLayout';
import ChatPortfolioAdvisor, { type PortfolioGenerationResult } from '@/components/ChatPortfolioAdvisor';
import { usePortfolio, type Portfolio } from '@/hooks/usePortfolio';
import { useAuth } from '@/contexts/AuthContext';
import { useLanguage } from '@/contexts/LanguageContext';
import { useRiskProfile } from '@/hooks/useRiskProfile';
import { Brain, Sparkles } from 'lucide-react';

const AIChatPage = () => {
  const [searchParams] = useSearchParams();
  const { user } = useAuth();
  const { t } = useLanguage();
  const { riskProfile, loading: riskProfileLoading, refetch: refetchRiskProfile } = useRiskProfile();
  const { activePortfolio, refetch: refetchPortfolio, setActivePortfolioFromResult, generatePortfolio } = usePortfolio();
  const [onboardingRiskProfile, setOnboardingRiskProfile] = useState<any | null>(null);
  const [onboardingPortfolio, setOnboardingPortfolio] = useState<Portfolio | null>(null);

  const stockName = searchParams.get('stock');
  const message = searchParams.get('message');

  const normalizePortfolio = useCallback((portfolio?: any): Portfolio | null => {
    if (!portfolio || typeof portfolio !== 'object' || !portfolio.id) {
      return null;
    }

    return {
      id: portfolio.id,
      user_id: portfolio.user_id,
      risk_profile_id: portfolio.risk_profile_id,
      portfolio_name: portfolio.portfolio_name ?? 'AI-Genererad Personlig Portfölj',
      asset_allocation: portfolio.asset_allocation ?? {},
      recommended_stocks: Array.isArray(portfolio.recommended_stocks) ? portfolio.recommended_stocks : [],
      total_value: portfolio.total_value ?? 0,
      expected_return: portfolio.expected_return ?? 0,
      risk_score: portfolio.risk_score ?? 0,
      is_active: portfolio.is_active ?? true,
      created_at: portfolio.created_at ?? new Date().toISOString(),
      updated_at: portfolio.updated_at ?? new Date().toISOString(),
    };
  }, []);

  const handleOnboardingComplete = useCallback(
    async (_result?: PortfolioGenerationResult | null) => {
      if (_result?.portfolio) {
        const normalized = normalizePortfolio(_result.portfolio);
        if (normalized) {
          setOnboardingPortfolio(normalized);
          setActivePortfolioFromResult(normalized);
        }
      }

      if (_result?.riskProfile) {
        setOnboardingRiskProfile(_result.riskProfile);
      }

      const fallbackRiskProfileId = _result?.riskProfile?.id ?? riskProfile?.id;

      if (!_result?.portfolio && fallbackRiskProfileId) {
        await generatePortfolio(fallbackRiskProfileId);
      }

      await Promise.all([refetchRiskProfile(), refetchPortfolio()]);
    },
    [
      generatePortfolio,
      normalizePortfolio,
      refetchPortfolio,
      refetchRiskProfile,
      riskProfile?.id,
      setActivePortfolioFromResult,
    ]
  );

  useEffect(() => {
    if (riskProfile && onboardingRiskProfile) {
      setOnboardingRiskProfile(null);
    }
  }, [onboardingRiskProfile, riskProfile]);

  useEffect(() => {
    if (activePortfolio && onboardingPortfolio) {
      setOnboardingPortfolio(null);
    }
  }, [activePortfolio, onboardingPortfolio]);

  const hasRiskProfile = Boolean(riskProfile || onboardingRiskProfile);
  const chatPortfolioId = (onboardingPortfolio ?? activePortfolio)?.id;

  if (user && riskProfileLoading) {
    return (
      <Layout>
        <AIChatLayout>
          <div className="flex flex-1 items-center justify-center px-6 py-12">
            <div className="flex flex-col items-center gap-4 text-ai-text-muted">
              <div className="h-8 w-8 animate-spin rounded-full border-2 border-ai-border border-t-transparent" />
              <p className="text-sm font-medium">{t('aiChat.loading')}</p>
            </div>
          </div>
        </AIChatLayout>
      </Layout>
    );
  }

  if (user && !hasRiskProfile) {
    return (
      <Layout>
        <AIChatLayout>
          <div className="flex flex-1 flex-col gap-6 px-4 py-6 sm:px-6 sm:py-8">
            <div className="rounded-ai-md border border-ai-border/70 bg-ai-surface-muted/40 px-4 py-5 shadow-sm sm:px-6 sm:py-6">
              <div className="flex gap-4">
                <div className="hidden h-12 w-12 flex-shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary sm:flex">
                  <Brain className="h-6 w-6" />
                </div>
                <div className="space-y-3">
                  <div className="space-y-2">
                    <p className="text-xs font-semibold uppercase tracking-[0.08em] text-primary">
                      {t('aiChat.riskProfileRequired')}
                    </p>
                    <h3 className="text-2xl font-semibold text-foreground">{t('aiChat.createRiskProfile')}</h3>
                    <p className="text-sm text-ai-text-muted">
                      {t('aiChat.riskProfileDesc')}
                    </p>
                  </div>
                  <div className="grid gap-4 md:grid-cols-2">
                    <div className="rounded-lg border border-ai-border/70 bg-background/80 p-4">
                      <div className="flex items-center gap-2 text-sm font-semibold text-foreground">
                        <Sparkles className="h-4 w-4 text-primary" />
                        Chattbaserad konsultation
                      </div>
                      <ul className="mt-2 space-y-2 text-sm text-ai-text-muted">
                        <li className="flex gap-2">
                          <span className="mt-2 h-1.5 w-1.5 rounded-full bg-primary" />
                          Naturlig konversation med AI-rådgivare
                        </li>
                        <li className="flex gap-2">
                          <span className="mt-2 h-1.5 w-1.5 rounded-full bg-primary" />
                          En fråga i taget för bättre fokus
                        </li>
                        <li className="flex gap-2">
                          <span className="mt-2 h-1.5 w-1.5 rounded-full bg-primary" />
                          Anpassade följdfrågor baserat på dina svar
                        </li>
                      </ul>
                    </div>
                    <div className="rounded-lg border border-ai-border/70 bg-background/80 p-4">
                      <div className="flex items-center gap-2 text-sm font-semibold text-foreground">
                        <Sparkles className="h-4 w-4 text-primary" />
                        Personlig analys
                      </div>
                      <ul className="mt-2 space-y-2 text-sm text-ai-text-muted">
                        <li className="flex gap-2">
                          <span className="mt-2 h-1.5 w-1.5 rounded-full bg-primary" />
                          Analyserar dina intressen och mål
                        </li>
                        <li className="flex gap-2">
                          <span className="mt-2 h-1.5 w-1.5 rounded-full bg-primary" />
                          Föreslår konkreta investeringar
                        </li>
                        <li className="flex gap-2">
                          <span className="mt-2 h-1.5 w-1.5 rounded-full bg-primary" />
                          Skapar en handlingsbar strategi
                        </li>
                      </ul>
                    </div>
                  </div>
                  <div className="rounded-lg border border-ai-border/70 bg-background/80 p-4">
                    <h4 className="text-xs font-semibold uppercase tracking-[0.08em] text-primary">Så här fungerar det</h4>
                    <ol className="mt-3 space-y-2 text-sm text-ai-text-muted">
                      <li className="flex gap-2">
                        <span className="mt-0.5 inline-flex h-5 w-5 items-center justify-center rounded-full bg-primary/10 text-[11px] font-semibold text-primary">1</span>
                        Starta en chatt med AI-rådgivaren
                      </li>
                      <li className="flex gap-2">
                        <span className="mt-0.5 inline-flex h-5 w-5 items-center justify-center rounded-full bg-primary/10 text-[11px] font-semibold text-primary">2</span>
                        Svara på frågor om dina mål och preferenser
                      </li>
                      <li className="flex gap-2">
                        <span className="mt-0.5 inline-flex h-5 w-5 items-center justify-center rounded-full bg-primary/10 text-[11px] font-semibold text-primary">3</span>
                        Få en personlig portföljstrategi med konkreta rekommendationer
                      </li>
                      <li className="flex gap-2">
                        <span className="mt-0.5 inline-flex h-5 w-5 items-center justify-center rounded-full bg-primary/10 text-[11px] font-semibold text-primary">4</span>
                        Implementera strategin direkt och fortsätt dialogen i chatten
                      </li>
                    </ol>
                  </div>
                </div>
              </div>
            </div>
            <div className="flex-1 overflow-hidden rounded-ai-md border border-ai-border/70 bg-ai-surface shadow-sm">
              <ChatPortfolioAdvisor onComplete={handleOnboardingComplete} />
            </div>
          </div>
        </AIChatLayout>
      </Layout>
    );
  }

  return (
    <Layout>
      <AIChatLayout>
        <AIChat
          key={chatPortfolioId ?? 'default'}
          portfolioId={chatPortfolioId}
          initialStock={stockName}
          initialMessage={message}
        />
      </AIChatLayout>
    </Layout>
  );
};

export default AIChatPage;
