import React, { useMemo } from 'react';
import { useSearchParams, useNavigate, useLocation } from 'react-router-dom';
import Layout from '@/components/Layout';
import AIChat from '@/components/AIChat';
import AIChatLayout from '@/components/AIChatLayout';
import { usePortfolio } from '@/hooks/usePortfolio';
import { useAuth } from '@/contexts/AuthContext';
import { useLanguage } from '@/contexts/LanguageContext';
import { useRiskProfile } from '@/hooks/useRiskProfile';
import { Button } from '@/components/ui/button';
import { AlertCircle, User } from 'lucide-react';
import { formatOnboardingSummary, type QuickOnboardingAnswers } from '@/components/QuickOnboardingForm';

const AIChatPage = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useAuth();
  const { t } = useLanguage();
  const { riskProfile, loading: riskProfileLoading } = useRiskProfile();
  const { activePortfolio } = usePortfolio();

  const navigationState = location.state as {
    onboardingAnswers?: QuickOnboardingAnswers;
    initialMessage?: string;
    createNewSession?: boolean;
    sessionName?: string;
  } | undefined;

  const stockName = searchParams.get('stock');
  const messageFromQuery = searchParams.get('message');

  const initialMessage = useMemo(() => {
    if (navigationState?.initialMessage) {
      return navigationState.initialMessage;
    }

    if (navigationState?.onboardingAnswers) {
      const summary = formatOnboardingSummary(navigationState.onboardingAnswers);
      if (summary) {
        return `Här är mina svar: ${summary}. Kan du föreslå en investeringsplan utifrån detta?`;
      }
    }

    return messageFromQuery;
  }, [messageFromQuery, navigationState]);

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

  return (
    <Layout>
      <AIChatLayout>
        {user && !riskProfileLoading && !riskProfile && (
          <div className="mb-4 rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
            <div className="flex items-center gap-2">
              <AlertCircle className="h-4 w-4" />
              <div className="font-medium">{t('aiChat.riskProfileNoticeTitle')}</div>
            </div>
            <p className="mt-2 leading-relaxed">{t('aiChat.riskProfileNoticeDesc')}</p>
            <div className="mt-3 flex flex-wrap gap-2">
              <Button variant="secondary" size="sm" onClick={() => navigate('/portfolio-advisor')}>
                <User className="mr-2 h-4 w-4" />
                {t('aiChat.createRiskProfile')}
              </Button>
              <Button variant="ghost" size="sm" onClick={() => navigate('/profile')}>
                {t('aiChat.manageProfile')}
              </Button>
            </div>
          </div>
        )}
        <AIChat
          portfolioId={activePortfolio?.id}
          initialStock={stockName}
          initialMessage={initialMessage}
        />
      </AIChatLayout>
    </Layout>
  );
};

export default AIChatPage;
