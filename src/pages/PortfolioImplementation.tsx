import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import Layout from '@/components/Layout';
import PortfolioOverview from '@/components/PortfolioOverview';
import ConversationalPortfolioAdvisor from '@/components/ConversationalPortfolioAdvisor';
import LoginPromptModal from '@/components/LoginPromptModal';
import PortfolioValueCards from '@/components/PortfolioValueCards';
import CommunityRecommendations from '@/components/CommunityRecommendations';
import { usePortfolio } from '@/hooks/usePortfolio';
import { useUserHoldings } from '@/hooks/useUserHoldings';
import { useAuth } from '@/contexts/AuthContext';
import { useLanguage } from '@/contexts/LanguageContext';
import { useRiskProfile } from '@/hooks/useRiskProfile';
import { usePortfolioPerformance } from '@/hooks/usePortfolioPerformance';
import { useCashHoldings } from '@/hooks/useCashHoldings';
import { Button } from '@/components/ui/button';
import { Brain, AlertCircle, User, Upload } from 'lucide-react';
import FloatingActionButton from '@/components/FloatingActionButton';
import { useToast } from '@/hooks/use-toast';
import { normalizeShareClassTicker, parsePortfolioHoldingsFromCSV } from '@/utils/portfolioCsvImport';
import { supabase } from '@/integrations/supabase/client';
const PortfolioImplementation = () => {
  const {
    actualHoldings,
    loading: holdingsLoading,
    refetch: refetchHoldings
  } = useUserHoldings();
  const {
    activePortfolio,
    loading
  } = usePortfolio();
  const {
    user,
    loading: authLoading
  } = useAuth();
  const {
    t
  } = useLanguage();
  const {
    riskProfile,
    loading: riskProfileLoading
  } = useRiskProfile();
  const {
    performance,
    updateAllPrices
  } = usePortfolioPerformance();
  const {
    totalCash
  } = useCashHoldings();
  const navigate = useNavigate();
  const [showOnboarding, setShowOnboarding] = useState(false);
  const [showLoginModal, setShowLoginModal] = useState(false);
  const [lastUpdated, setLastUpdated] = useState<string | null>(null);
  const hasTriggeredAutoUpdate = useRef(false);
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const [isImportingHoldings, setIsImportingHoldings] = useState(false);
  const { toast } = useToast();
  useEffect(() => {
    // Only show login modal if auth has finished loading and user is not authenticated
    if (!authLoading && !user) {
      setShowLoginModal(true);
    } else if (user) {
      setShowLoginModal(false);
    }
  }, [user, authLoading]);
  useEffect(() => {
    if (!user || loading) return;
    setShowOnboarding(false);
  }, [user, activePortfolio, loading]);
  useEffect(() => {
    // Set last updated time
    setLastUpdated(new Date().toLocaleTimeString('sv-SE', {
      hour: '2-digit',
      minute: '2-digit'
    }));
  }, [performance, totalCash]);
  useEffect(() => {
    hasTriggeredAutoUpdate.current = false;
  }, [user?.id]);
  useEffect(() => {
    if (!user || holdingsLoading) {
      return;
    }

    if (actualHoldings.length === 0) {
      return;
    }

    if (hasTriggeredAutoUpdate.current) {
      return;
    }

    hasTriggeredAutoUpdate.current = true;

    void (async () => {
      const summary = await updateAllPrices();
      if (summary && typeof refetchHoldings === 'function') {
        await refetchHoldings({ silent: true });
      }
    })();
  }, [user, holdingsLoading, actualHoldings.length, updateAllPrices, refetchHoldings]);
  const handleQuickChat = (message: string) => {
    if (!riskProfile) {
      return;
    }
    if (message.startsWith('NEW_SESSION:')) {
      const [, sessionName, actualMessage] = message.split(':');
      navigate('/ai-chatt', {
        state: {
          createNewSession: true,
          sessionName,
          initialMessage: actualMessage
        }
      });
    } else {
      navigate('/ai-chatt');
    }
  };
  const handleActionClick = (action: string) => {
    // Future enhancement: trigger contextual workflows based on action
  };
  const handleUpdateProfile = () => {
    setShowOnboarding(true);
  };

  const roundToTwo = (value: number) => Math.round(value * 100) / 100;

  const handleImportClick = () => {
    if (!user) {
      setShowLoginModal(true);
      return;
    }

    fileInputRef.current?.click();
  };

  const handlePortfolioCsvUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];

    if (!file) {
      return;
    }

    setIsImportingHoldings(true);

    try {
      const text = await file.text();
      const parsed = parsePortfolioHoldingsFromCSV(text);

      if (!parsed.length) {
        throw new Error('Kunde inte tolka några innehav från CSV-filen. Kontrollera formatet.');
      }

      if (!user) {
        throw new Error('Du måste vara inloggad för att importera innehav.');
      }

      const nowIso = new Date().toISOString();
      const holdingsToInsert = parsed.map(holding => {
        const normalizedSymbol = holding.symbol.trim()
          ? normalizeShareClassTicker(holding.symbol)
          : null;
        const roundedPurchasePrice = roundToTwo(holding.purchasePrice);
        const quantity = holding.quantity;
        const currentValue = roundToTwo(roundedPurchasePrice * quantity);

        return {
          user_id: user.id,
          name: holding.name,
          symbol: normalizedSymbol,
          quantity,
          purchase_price: roundedPurchasePrice,
          current_price_per_unit: roundedPurchasePrice,
          price_currency: holding.currency,
          current_value: currentValue,
          currency: holding.currency,
          holding_type: 'stock' as const,
          purchase_date: nowIso,
        };
      });

      const { error } = await supabase.from('user_holdings').insert(holdingsToInsert);

      if (error) {
        throw error;
      }

      await refetchHoldings({ silent: true });

      toast({
        title: 'Innehav importerade',
        description: `${holdingsToInsert.length} innehav har lagts till från din CSV-fil.`,
      });

      if (typeof window !== 'undefined') {
        window.location.reload();
      }
    } catch (error) {
      console.error('Failed to import portfolio CSV:', error);
      toast({
        title: 'Fel vid import',
        description: error instanceof Error ? error.message : 'Kunde inte läsa CSV-filen. Försök igen.',
        variant: 'destructive',
      });
    } finally {
      setIsImportingHoldings(false);
      event.target.value = '';
    }
  };

  // Show loading while portfolio is loading
  if (loading || riskProfileLoading) {
    return <Layout>
        <div className="min-h-screen flex items-center justify-center p-4">
          <div className="text-center p-6 bg-white dark:bg-gray-800 backdrop-blur-lg border border-gray-200 dark:border-gray-700 rounded-2xl shadow-2xl w-full max-w-sm mx-auto">
            <div className="w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-6 bg-primary shadow-2xl">
              <div className="w-8 h-8 border-4 border-white border-t-transparent rounded-full animate-spin"></div>
            </div>
            <h2 className="text-lg font-semibold mb-2 text-foreground">{t('portfolio.loading')}</h2>
            <p className="text-sm text-muted-foreground">{t('portfolio.loadingDesc')}</p>
          </div>
        </div>
      </Layout>;
  }

  // Show onboarding if user explicitly wants to create a profile
  if (showOnboarding) {
    return <Layout>
        <div className="min-h-screen py-6 px-4">
          <div className="max-w-5xl mx-auto">
            <div className="text-center mb-8">
              <div className="w-20 h-20 rounded-3xl flex items-center justify-center mx-auto mb-6 bg-primary shadow-2xl transform rotate-3 hover:rotate-0 transition-transform duration-300">
                <Brain className="w-10 h-10 text-primary-foreground" />
              </div>
              <h1 className="text-3xl font-bold mb-4 text-foreground">
                {t('portfolio.createProfile')}
              </h1>
              <p className="text-lg max-w-2xl mx-auto text-muted-foreground px-4">
                {t('portfolio.createProfileDesc')}
              </p>
            </div>
            <ConversationalPortfolioAdvisor />
          </div>
        </div>
      </Layout>;
  }
  const totalPortfolioValue = performance.totalPortfolioValue;
  const investedValue = performance.totalValue;

  const portfolioImportControls = (
    <>
      <input
        ref={fileInputRef}
        type="file"
        accept=".csv,text/csv"
        className="hidden"
        onChange={handlePortfolioCsvUpload}
      />
      <Button
        onClick={handleImportClick}
        disabled={isImportingHoldings}
        className="rounded-xl px-4 py-4 shadow-md transition-all duration-200 hover:shadow-lg"
        variant="outline"
      >
        <Upload className="mr-2 h-4 w-4" />
        {isImportingHoldings ? 'Importerar...' : 'Importera från CSV'}
      </Button>
    </>
  );

  // Calculate portfolio health metrics - fix the actualHoldings check
  const calculateHealthMetrics = () => {
    const totalHoldings = actualHoldings ? actualHoldings.length : 0;
    const uniqueSectors = actualHoldings && actualHoldings.length > 0 ? new Set(actualHoldings.filter(h => h.sector).map(h => h.sector)).size : 0;
    return {
      diversificationScore: Math.min(100, uniqueSectors / Math.max(1, totalHoldings) * 100 + 20),
      riskScore: Math.max(20, 100 - totalCash / Math.max(1, totalPortfolioValue) * 200),
      performanceScore: 75,
      // Mock performance score
      cashPercentage: totalPortfolioValue > 0 ? totalCash / totalPortfolioValue * 100 : 0
    };
  };
  const healthMetrics = calculateHealthMetrics();

  // Always show portfolio implementation page with tabs
  return <Layout>
      <LoginPromptModal isOpen={showLoginModal} onClose={() => setShowLoginModal(false)} />
      
      <div className="min-h-0 bg-gradient-to-br from-background to-secondary/5">
         <div className="mx-auto w-full max-w-7xl space-y-8 sm:space-y-10 lg:space-y-12 px-4 pb-8 sm:px-6 sm:pb-12 lg:px-8 lg:pb-16">
          {/* Page Header */}
          <section className="rounded-3xl border border-border/60 bg-card/70 px-6 py-8 text-center shadow-sm supports-[backdrop-filter]:backdrop-blur-sm sm:px-10 sm:py-12">
              <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-2xl bg-primary/10 sm:h-14 sm:w-14">
                <Brain className="h-6 w-6 text-primary" />
              </div>
              <h1 className="text-3xl font-semibold tracking-tight text-foreground sm:text-4xl lg:text-5xl">
                {t('portfolio.title')}
              </h1>
              <p className="mx-auto mt-3 max-w-2xl text-base text-muted-foreground sm:text-lg">
                {t('portfolio.subtitle')}
              </p>
          </section>

          {/* Portfolio Health Score */}
          {user && totalPortfolioValue > 0 && <div className="hidden" />}

          {/* Portfolio Value Cards */}
          <PortfolioValueCards totalPortfolioValue={totalPortfolioValue} totalInvestedValue={investedValue} totalCashValue={totalCash} loading={loading} />

          {/* Risk Profile Required Alert */}
          {user && !riskProfile && <div className="bg-amber-50/70 dark:bg-amber-950/20 backdrop-blur-xl border border-amber-200/50 dark:border-amber-800/50 rounded-3xl p-8 shadow-xl">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-6">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-2xl bg-amber-100 dark:bg-amber-900/50 flex items-center justify-center">
                      <AlertCircle className="w-6 h-6 text-amber-600 dark:text-amber-400" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-amber-800 dark:text-amber-200 mb-1">
                        {t('portfolio.riskProfileRequired')}
                      </h3>
                      <p className="text-amber-700 dark:text-amber-300">
                        {t('portfolio.riskProfileRequiredDesc')}
                      </p>
                    </div>
                  </div>
                  <Button onClick={() => navigate('/portfolio-advisor')} className="bg-primary hover:bg-primary/90 text-primary-foreground rounded-2xl px-6 py-3 shadow-lg hover:shadow-xl transition-all duration-200">
                    <User className="w-4 h-4 mr-2" />
                    {t('portfolio.createProfile.button')}
                  </Button>
                </div>
              </div>}

          {/* Portfolio Overview & Community */}
          <div className="space-y-4 sm:space-y-6 lg:space-y-8">
            <div className="relative bg-white/70 dark:bg-card/70 backdrop-blur-xl border border-border/50 rounded-3xl shadow-xl overflow-hidden">
              <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-primary via-primary to-primary/80"></div>
              <PortfolioOverview
                portfolio={activePortfolio}
                onQuickChat={handleQuickChat}
                onActionClick={handleActionClick}
                importControls={portfolioImportControls}
              />
            </div>

            <div className="relative bg-white/70 dark:bg-card/70 backdrop-blur-xl border border-border/50 rounded-3xl shadow-xl overflow-hidden">
              <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-primary via-primary to-primary/80"></div>
              <CommunityRecommendations />
            </div>
          </div>
        </div>
      </div>

      {/* Floating Action Button */}
      <FloatingActionButton />
    </Layout>;
};
export default PortfolioImplementation;
