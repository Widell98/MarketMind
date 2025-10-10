import React, { useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import Layout from '@/components/Layout';
import AIChat from '@/components/AIChat';
import AIChatLayout from '@/components/AIChatLayout';
import { usePortfolio } from '@/hooks/usePortfolio';
import { useAuth } from '@/contexts/AuthContext';
import { useLanguage } from '@/contexts/LanguageContext';
import { useRiskProfile } from '@/hooks/useRiskProfile';
import { Button } from '@/components/ui/button';
import { AlertCircle, User } from 'lucide-react';

const AIChatPage = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { t } = useLanguage();
  const { riskProfile, loading: riskProfileLoading } = useRiskProfile();
  const { activePortfolio } = usePortfolio();

  const stockName = searchParams.get('stock');
  const message = searchParams.get('message');

  useEffect(() => {
    if (user && !riskProfileLoading && !riskProfile) {
      navigate('/portfolio-advisor');
    }
  }, [user, riskProfile, riskProfileLoading, navigate]);

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

  if (user && !riskProfile) {
    return (
      <Layout>
        <AIChatLayout>
          <div className="flex flex-1 items-center justify-center px-6 py-12">
            <div className="max-w-md rounded-ai-md border border-ai-border/70 bg-ai-surface-muted/40 p-6 text-center shadow-sm">
              <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-ai-surface">
                <AlertCircle className="h-6 w-6 text-primary" />
              </div>
              <h3 className="mt-4 text-lg font-semibold text-foreground">{t('aiChat.riskProfileRequired')}</h3>
              <p className="mt-2 text-sm text-ai-text-muted">{t('aiChat.riskProfileDesc')}</p>
              <Button onClick={() => navigate('/portfolio-advisor')} className="mt-6">
                <User className="mr-2 h-4 w-4" />
                {t('aiChat.createRiskProfile')}
              </Button>
            </div>
          </div>
        </AIChatLayout>
      </Layout>
    );
  }

  return (
    <Layout>
      <AIChatLayout>
        <div className="flex h-full min-h-0 flex-1 flex-col">
          <div className="flex items-center justify-end gap-3 border-b border-ai-border/60 bg-ai-surface-muted/40 px-6 py-4 dark:border-ai-border/40 dark:bg-ai-surface-muted/30">
            <Button
              variant="outline"
              className="border-ai-border/40 bg-white/80 text-foreground shadow-sm transition-colors hover:bg-white dark:border-ai-border/50 dark:bg-ai-surface dark:text-ai-text hover:dark:bg-ai-surface/80"
              onClick={() => navigate('/portfolio-implementation')}
            >
              portfölj
            </Button>
          </div>
          <div className="flex min-h-0 flex-1">
            <AIChat
              portfolioId={activePortfolio?.id}
              initialStock={stockName}
              initialMessage={message}
            />
          </div>
        </div>
      </AIChatLayout>
    </Layout>
  );
};

export default AIChatPage;
