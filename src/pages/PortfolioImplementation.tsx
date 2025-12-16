import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import Layout from '@/components/Layout';
import PortfolioOverview from '@/components/PortfolioOverview';
import BestWorstHoldings from '@/components/BestWorstHoldings';
import ConversationalPortfolioAdvisor from '@/components/ConversationalPortfolioAdvisor';
import LoginPromptModal from '@/components/LoginPromptModal';
import AIRecommendations from '@/components/AIRecommendations';
import CommunityRecommendations from '@/components/CommunityRecommendations';
import PredictionMarketsPortfolio from '@/components/PredictionMarketsPortfolio';
import { usePortfolio } from '@/hooks/usePortfolio';
import { useUserHoldings } from '@/hooks/useUserHoldings';
import { useAuth } from '@/contexts/AuthContext';
import { useLanguage } from '@/contexts/LanguageContext';
import { useRiskProfile } from '@/hooks/useRiskProfile';
import { usePortfolioPerformance } from '@/hooks/usePortfolioPerformance';
import { useCashHoldings } from '@/hooks/useCashHoldings';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { AlertCircle, Brain, Info, Sparkles, Upload, User } from 'lucide-react';
import FloatingActionButton from '@/components/FloatingActionButton';
import { useToast } from '@/hooks/use-toast';
import { normalizeShareClassTicker, parsePortfolioHoldingsFromCSV, enrichHoldingWithTicker } from '@/utils/portfolioCsvImport';
import { supabase } from '@/integrations/supabase/client';
import { useExchangeRates } from '@/contexts/ExchangeRatesContext';
import { isMarketOpen } from '@/utils/marketHours';
import { resolveHoldingValue } from '@/utils/currencyUtils';
import useSheetTickers from '@/hooks/useSheetTickers';

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

  // Även om du inte använder 'rates'-variabeln direkt här, 
  // så tvingar detta komponenten att rendera om när kurserna uppdateras.
  const { rates } = useExchangeRates();
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
  
  const { tickers } = useSheetTickers();

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

  // Beräkna en justerad performance för "Idag"-vyn som tar hänsyn till öppettider
  const adjustedPerformance = React.useMemo(() => {
    // Om ingen data finns, returnera original
    if (!performance || !actualHoldings?.length) return performance;

    let adjustedDayChangeValue = 0;

    actualHoldings.forEach(holding => {
      // Hoppa över om marknaden är stängd
      if (!isMarketOpen(holding)) return;

      const { valueInSEK } = resolveHoldingValue(holding);
      const changePct = holding.dailyChangePercent ?? holding.daily_change_pct ?? 0;
      
      // Räkna ut kronförändring för detta innehav (om marknaden är öppen)
      adjustedDayChangeValue += (valueInSEK * changePct) / 100;
    });
    
    // Räkna ut ny procent baserat på hela portföljens värde (inte bara de öppna)
    const totalPortfolioVal = performance.totalPortfolioValue || 1;
    const adjustedDayChangePercent = (adjustedDayChangeValue / totalPortfolioVal) * 100;

    return {
      ...performance,
      dayChange: adjustedDayChangeValue,
      dayChangePercentage: adjustedDayChangePercent
    };
  }, [performance, actualHoldings]);

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
    if (!user) {
      setShowLoginModal(true);
      return;
    }

    navigate('/profile?tab=riskprofile#fine-tune-risk');
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
      const rawHoldings = parsePortfolioHoldingsFromCSV(text);
      
      const enrichedHoldings = rawHoldings.map(h => enrichHoldingWithTicker(h, tickers));

      if (!enrichedHoldings.length) {
        throw new Error('Kunde inte tolka några innehav från CSV-filen. Kontrollera formatet.');
      }

      if (!user) {
        throw new Error('Du måste vara inloggad för att importera innehav.');
      }

      const nowIso = new Date().toISOString();
      const holdingsToInsert = enrichedHoldings.map(holding => {
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
          holding_type: holding.holdingType || 'stock',
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
        <div className="min-h-screen flex items-center justify-center p-3 sm:p-4">
          <div className="text-center p-4 sm:p-6 bg-white dark:bg-gray-800 backdrop-blur-lg border border-gray-200 dark:border-gray-700 rounded-xl sm:rounded-2xl shadow-2xl w-full max-w-sm mx-auto">
            <div className="w-12 h-12 sm:w-16 sm:h-16 rounded-xl sm:rounded-2xl flex items-center justify-center mx-auto mb-4 sm:mb-6 bg-primary shadow-2xl">
              <div className="w-6 h-6 sm:w-8 sm:h-8 border-4 border-white border-t-transparent rounded-full animate-spin"></div>
            </div>
            <h2 className="text-base sm:text-lg font-semibold mb-2 text-foreground">{t('portfolio.loading')}</h2>
            <p className="text-xs sm:text-sm text-muted-foreground">{t('portfolio.loadingDesc')}</p>
          </div>
        </div>
      </Layout>;
  }

  // Show onboarding if user explicitly wants to create a profile
  if (showOnboarding) {
    return <Layout>
        <div className="min-h-screen py-4 sm:py-6 px-3 sm:px-4">
          <div className="max-w-5xl mx-auto">
            <div className="text-center mb-6 sm:mb-8">
              <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-2xl sm:rounded-3xl flex items-center justify-center mx-auto mb-4 sm:mb-6 bg-primary shadow-2xl transform rotate-3 hover:rotate-0 transition-transform duration-300">
                <Brain className="w-8 h-8 sm:w-10 sm:h-10 text-primary-foreground" />
              </div>
              <h1 className="text-2xl sm:text-3xl font-bold mb-3 sm:mb-4 text-foreground px-2">
                {t('portfolio.createProfile')}
              </h1>
              <p className="text-sm sm:text-base md:text-lg max-w-2xl mx-auto text-muted-foreground px-3 sm:px-4">
                {t('portfolio.createProfileDesc')}
              </p>
            </div>
            <ConversationalPortfolioAdvisor />
          </div>
        </div>
      </Layout>;
  }
  const totalPortfolioValue = performance.totalPortfolioValue ?? 0;
  const investedValue = performance.totalValue ?? 0;

  const portfolioImportControls = (
    <Button
      onClick={handleImportClick}
      disabled={isImportingHoldings}
      className="rounded-lg sm:rounded-xl px-3 sm:px-4 py-2.5 sm:py-4 shadow-md transition-all duration-200 hover:shadow-lg text-xs sm:text-sm w-full sm:w-auto"
      variant="outline"
    >
      <Upload className="mr-1.5 sm:mr-2 h-3.5 w-3.5 sm:h-4 sm:w-4" />
      {isImportingHoldings ? 'Importerar...' : 'Importera från CSV'}
    </Button>
  );

  const hasPortfolioData = (actualHoldings?.length || 0) > 0 && totalPortfolioValue > 0;
  const lastUpdatedLabel = lastUpdated ? `Senast uppdaterad ${lastUpdated}` : 'Ingen uppdatering ännu';
  const formatCurrency = (value: number) => value.toLocaleString('sv-SE', {
    style: 'currency',
    currency: 'SEK',
    maximumFractionDigits: 0,
  });

  const healthCards = [
    {
      label: 'Total portfölj',
      value: hasPortfolioData ? formatCurrency(totalPortfolioValue) : '—',
      description: hasPortfolioData
        ? 'Summerad portföljstorlek inklusive kassa för en snabb överblick.'
        : 'Importera eller lägg till innehav för att se din totala portfölj.',
    },
    {
      label: 'Investerat värde',
      value: hasPortfolioData ? formatCurrency(investedValue) : '—',
      description: hasPortfolioData
        ? 'Aktuellt marknadsvärde för dina investeringar exklusive kassa.'
        : 'När du lägger till innehav visas värdet av dina placeringar här.',
    },
    {
      label: 'Kassa',
      value: hasPortfolioData ? formatCurrency(totalCash) : '—',
      description: hasPortfolioData
        ? 'Likvida medel redo för ombalansering eller nya köp.'
        : 'Importera eller lägg till kassa för att se din tillgängliga likviditet.',
    },
  ];

  // Always show portfolio implementation page with tabs
  return <Layout>
      <input
        ref={fileInputRef}
        type="file"
        accept=".csv,text/csv"
        className="hidden"
        onChange={handlePortfolioCsvUpload}
      />
      <LoginPromptModal isOpen={showLoginModal} onClose={() => setShowLoginModal(false)} />
      
      <div className="min-h-0 bg-gradient-to-br from-background to-secondary/5">
         <div className="mx-auto w-full max-w-7xl space-y-4 sm:space-y-6 md:space-y-8 lg:space-y-12 px-3 sm:px-4 md:px-6 pb-6 sm:pb-8 md:pb-12 lg:px-8 lg:pb-16">
          {/* Page Header */}
          <section className="rounded-xl sm:rounded-2xl md:rounded-3xl border border-border/60 bg-card/70 px-3 sm:px-4 md:px-6 lg:px-10 py-4 sm:py-6 md:py-8 lg:py-12 shadow-sm supports-[backdrop-filter]:backdrop-blur-sm">
            <div className="flex flex-col gap-4 sm:gap-5 md:gap-6">
              <div className="flex flex-col gap-3 sm:gap-4 lg:flex-row lg:items-center lg:justify-between">
                <div className="space-y-2 sm:space-y-3">
                  <div className="flex items-center gap-2 sm:gap-3">
                    <div className="flex h-9 w-9 sm:h-11 sm:w-11 md:h-12 md:w-12 items-center justify-center rounded-xl sm:rounded-2xl bg-primary/10">
                      <Brain className="h-4 w-4 sm:h-5 sm:w-5 md:h-6 md:w-6 text-primary" />
                    </div>
                    <div className="space-y-0.5 sm:space-y-1">
                      <p className="text-[10px] xs:text-xs uppercase tracking-[0.18em] text-muted-foreground">Portfölj</p>
                      <h1 className="text-xl sm:text-2xl md:text-3xl lg:text-4xl xl:text-5xl font-semibold tracking-tight bg-gradient-to-r from-primary to-primary/80 bg-clip-text text-transparent">
                        {t('portfolio.title')}
                      </h1>
                    </div>
                  </div>
                  <div className="flex flex-wrap items-center gap-1.5 sm:gap-2 md:gap-3 text-xs sm:text-sm text-muted-foreground">
                    <Badge variant="secondary" className="rounded-full bg-muted/70 px-2 sm:px-3 py-0.5 sm:py-1 text-[10px] xs:text-xs font-medium">
                      {lastUpdatedLabel}
                    </Badge>
                    <span className="rounded-full bg-primary/5 px-2 sm:px-3 py-0.5 sm:py-1 text-[10px] xs:text-xs font-medium text-primary">
                      {hasPortfolioData ? `${actualHoldings?.length || 0} aktiva innehav` : 'Importera eller lägg till innehav'}
                    </span>
                  </div>
                </div>
                <div className="flex flex-wrap items-center justify-start lg:justify-end gap-2 sm:gap-3">
                  <Button
                    onClick={() => handleQuickChat('NEW_SESSION:Portfölj AI:Kan du granska min portfölj och föreslå nästa steg?')}
                    className="rounded-xl sm:rounded-2xl px-3 sm:px-4 md:px-6 py-2 sm:py-2.5 md:py-3 shadow-lg hover:shadow-xl bg-gradient-to-r from-primary to-primary/90 text-primary-foreground text-xs sm:text-sm"
                  >
                    <Sparkles className="mr-1.5 sm:mr-2 h-3.5 w-3.5 sm:h-4 sm:w-4" />
                    <span className="hidden xs:inline">Starta AI-chatt</span>
                    <span className="xs:hidden">AI-chatt</span>
                  </Button>
                  <Button
                    onClick={handleUpdateProfile}
                    className="rounded-xl sm:rounded-2xl px-3 sm:px-4 md:px-5 py-2 sm:py-2.5 md:py-3 shadow-none text-xs sm:text-sm"
                    variant="ghost"
                  >
                    <User className="mr-1.5 sm:mr-2 h-3.5 w-3.5 sm:h-4 sm:w-4" />
                    <span className="hidden md:inline">Uppdatera profil</span>
                    <span className="md:hidden">Profil</span>
                  </Button>
                </div>
              </div>

              <TooltipProvider>
                <div className="grid grid-cols-1 xs:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4 md:gap-5">
                  {healthCards.map(card => (
                    <div
                      key={card.label}
                      className="group rounded-xl sm:rounded-2xl border border-border/60 bg-gradient-to-br from-card to-card/70 px-3 sm:px-4 md:px-5 py-3 sm:py-4 md:py-5 shadow-sm transition hover:-translate-y-0.5 hover:shadow-lg"
                    >
                      <div className="flex items-center justify-between gap-2">
                        <span className="text-[10px] xs:text-xs font-medium text-muted-foreground uppercase tracking-[0.14em] break-words">{card.label}</span>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <button
                              type="button"
                              className="inline-flex h-6 w-6 sm:h-7 sm:w-7 items-center justify-center rounded-full text-muted-foreground transition hover:text-primary flex-shrink-0"
                              aria-label={`Mer info om ${card.label}`}
                            >
                              <Info className="h-3 w-3 sm:h-3.5 sm:w-3.5" />
                            </button>
                          </TooltipTrigger>
                          <TooltipContent side="bottom" align="end" className="text-xs sm:text-sm max-w-xs">
                            {card.description}
                          </TooltipContent>
                        </Tooltip>
                      </div>
                      <div className="mt-2 sm:mt-3 flex items-baseline gap-2">
                        <p className="text-xl sm:text-2xl md:text-3xl font-semibold text-foreground break-words">{card.value}</p>
                      </div>
                      <p className="mt-2 text-[10px] xs:text-xs sm:text-sm text-muted-foreground leading-relaxed line-clamp-2">
                        {card.description}
                      </p>
                    </div>
                  ))}
                </div>
              </TooltipProvider>

              {/* Best/Worst Holdings */}
              <div className="mt-4 sm:mt-5 md:mt-6">
                <BestWorstHoldings />
              </div>
            </div>
          </section>

          {/* Risk Profile Required Alert */}
          {user && !riskProfile && <div className="bg-amber-50/70 dark:bg-amber-950/20 backdrop-blur-xl border border-amber-200/50 dark:border-amber-800/50 rounded-xl sm:rounded-2xl md:rounded-3xl p-3 sm:p-4 md:p-6 lg:p-8 shadow-xl">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 sm:gap-4 md:gap-6">
                  <div className="flex items-start sm:items-center gap-2 sm:gap-3 md:gap-4">
                    <div className="w-8 h-8 sm:w-10 sm:h-10 md:w-12 md:h-12 rounded-lg sm:rounded-xl md:rounded-2xl bg-amber-100 dark:bg-amber-900/50 flex items-center justify-center flex-shrink-0">
                      <AlertCircle className="w-4 h-4 sm:w-5 sm:h-5 md:w-6 md:h-6 text-amber-600 dark:text-amber-400" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <h3 className="text-xs sm:text-sm md:text-base font-semibold text-amber-800 dark:text-amber-200 mb-1 break-words">
                        {t('portfolio.riskProfileRequired')}
                      </h3>
                      <p className="text-[10px] xs:text-xs sm:text-sm text-amber-700 dark:text-amber-300 break-words">
                        {t('portfolio.riskProfileRequiredDesc')}
                      </p>
                    </div>
                  </div>
                  <Button onClick={() => navigate('/portfolio-advisor')} className="bg-primary hover:bg-primary/90 text-primary-foreground rounded-lg sm:rounded-xl md:rounded-2xl px-3 sm:px-4 md:px-6 py-2 sm:py-2.5 md:py-3 shadow-lg hover:shadow-xl transition-all duration-200 text-xs sm:text-sm w-full sm:w-auto">
                    <User className="w-3.5 h-3.5 sm:w-4 sm:h-4 mr-1.5 sm:mr-2" />
                    {t('portfolio.createProfile.button')}
                  </Button>
                </div>
              </div>}

          {/* Portfolio Overview & Community */}
          <div className="space-y-3 sm:space-y-4 md:space-y-6 lg:space-y-8">
            <div className="relative bg-white/70 dark:bg-card/70 backdrop-blur-xl border border-border/50 rounded-2xl sm:rounded-3xl shadow-xl overflow-hidden">
              <div className="absolute top-0 left-0 right-0 h-0.5 sm:h-1 bg-gradient-to-r from-primary via-primary to-primary/80"></div>
              <PortfolioOverview
                portfolio={activePortfolio ? {
                  ...activePortfolio,
                  day_change: adjustedPerformance.dayChange,
                  day_change_pct: adjustedPerformance.dayChangePercentage
                } : activePortfolio}
                onQuickChat={handleQuickChat}
                onActionClick={handleActionClick}
                importControls={portfolioImportControls}
              />
            </div>

            <div className="relative bg-white/70 dark:bg-card/70 backdrop-blur-xl border border-border/50 rounded-2xl sm:rounded-3xl shadow-xl overflow-hidden" data-ai-recommendations>
              <div className="absolute top-0 left-0 right-0 h-0.5 sm:h-1 bg-gradient-to-r from-primary via-primary to-primary/80"></div>
              <AIRecommendations />
            </div>

            <div className="relative bg-white/70 dark:bg-card/70 backdrop-blur-xl border border-border/50 rounded-2xl sm:rounded-3xl shadow-xl overflow-hidden">
              <div className="absolute top-0 left-0 right-0 h-0.5 sm:h-1 bg-gradient-to-r from-primary via-primary to-primary/80"></div>
              <CommunityRecommendations />
            </div>

            <div className="relative bg-white/70 dark:bg-card/70 backdrop-blur-xl border border-border/50 rounded-2xl sm:rounded-3xl shadow-xl overflow-hidden">
              <div className="absolute top-0 left-0 right-0 h-0.5 sm:h-1 bg-gradient-to-r from-primary via-primary to-primary/80"></div>
              <PredictionMarketsPortfolio />
            </div>
          </div>
        </div>
      </div>

      {/* Floating Action Button */}
      <FloatingActionButton />
    </Layout>;
};
export default PortfolioImplementation;
