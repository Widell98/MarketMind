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
import { Brain, AlertCircle, User, Upload, Clock, ShieldCheck, PieChart, Layers } from 'lucide-react';
import FloatingActionButton from '@/components/FloatingActionButton';
import { useToast } from '@/hooks/use-toast';
import { parsePortfolioHoldingsFromCSV } from '@/utils/portfolioCsvImport';
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
        const normalizedSymbol = holding.symbol.trim() ? holding.symbol.trim().toUpperCase() : null;
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
  const cashRatio = Number.isFinite(healthMetrics.cashPercentage) ? healthMetrics.cashPercentage : 0;
  const riskToleranceLabels: Record<string, string> = {
    conservative: 'Konservativ',
    moderate: 'Balanserad',
    aggressive: 'Offensiv'
  };
  const riskProfileLabel = riskProfile?.risk_tolerance
    ? riskToleranceLabels[riskProfile.risk_tolerance] ?? 'Aktiverad'
    : 'Ej aktiverad';
  const riskProfileHint = riskProfile
    ? 'Profilen styr rekommendationer'
    : 'Kom igång för bättre rådgivning';
  const holdingsCount = actualHoldings ? actualHoldings.length : 0;
  const liquidityDisplay = `${cashRatio.toFixed(1)}%`;
  const statusItems = [
    {
      label: 'Senast synkat',
      value: lastUpdated ?? 'Uppdateras…',
      hint: lastUpdated ? 'Marknadsdata i realtid' : 'Synkroniserar marknadsinfo',
      icon: Clock,
      tone: lastUpdated ? 'text-emerald-500' : 'text-amber-500',
      bg: lastUpdated ? 'bg-emerald-500/15' : 'bg-amber-500/15'
    },
    {
      label: 'Riskprofil',
      value: riskProfileLabel,
      hint: riskProfileHint,
      icon: ShieldCheck,
      tone: riskProfile ? 'text-sky-500' : 'text-amber-500',
      bg: riskProfile ? 'bg-sky-500/15' : 'bg-amber-500/15'
    },
    {
      label: 'Likviditet',
      value: liquidityDisplay,
      hint: 'Kontanter och buffert',
      icon: PieChart,
      tone: 'text-emerald-500',
      bg: 'bg-emerald-500/15'
    },
    {
      label: 'Antal innehav',
      value: String(holdingsCount),
      hint: 'Aktiva positioner',
      icon: Layers,
      tone: 'text-primary',
      bg: 'bg-primary/15'
    }
  ];

  // Always show portfolio implementation page with tabs
  return <Layout>
      <LoginPromptModal isOpen={showLoginModal} onClose={() => setShowLoginModal(false)} />

      <div className="min-h-0">
        <div className="mx-auto w-full max-w-7xl space-y-10 px-4 pb-10 pt-2 sm:px-6 lg:px-8 lg:pb-16 lg:pt-4">
          <section className="relative overflow-hidden rounded-[3rem] border border-white/30 bg-white/60 px-6 py-10 shadow-glass supports-[backdrop-filter]:backdrop-blur-2xl sm:px-10 sm:py-12 dark:border-white/10 dark:bg-slate-950/50">
            <div className="pointer-events-none absolute inset-0">
              <div className="absolute -left-16 top-8 h-64 w-64 rounded-full bg-primary/25 blur-3xl motion-safe:animate-float"></div>
              <div className="absolute bottom-[-20%] right-[-10%] h-72 w-72 rounded-full bg-sky-400/25 blur-3xl motion-safe:animate-float" style={{ animationDelay: '1.5s' }}></div>
            </div>
            <div className="relative flex flex-col gap-10 lg:flex-row lg:items-end lg:justify-between">
              <div className="space-y-8">
                <div className="inline-flex items-center gap-3 rounded-full border border-white/40 bg-white/60 px-4 py-2 text-xs font-semibold uppercase tracking-[0.35em] text-muted-foreground/80 shadow-inner shadow-white/10 dark:bg-white/10 dark:text-muted-foreground">
                  <span className="h-2 w-2 rounded-full bg-emerald-400 motion-safe:animate-pulse-soft"></span>
                  Lägesrapport
                </div>
                <div className="space-y-4 text-left">
                  <h1 className="text-3xl font-semibold tracking-tight text-foreground sm:text-4xl lg:text-5xl">
                    {t('portfolio.title')}
                  </h1>
                  <p className="max-w-2xl text-base text-muted-foreground sm:text-lg">
                    {t('portfolio.subtitle')}
                  </p>
                </div>
                <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
                  {statusItems.map((item) => {
                    const Icon = item.icon;
                    return (
                      <div
                        key={item.label}
                        className="group relative overflow-hidden rounded-2xl border border-white/30 bg-white/55 p-4 shadow-inner shadow-white/10 dark:border-white/10 dark:bg-slate-900/60"
                      >
                        <div className="pointer-events-none absolute inset-x-3 top-0 h-px bg-divider-shimmer opacity-60 motion-safe:animate-shimmer motion-reduce:animate-none"></div>
                        <div className="relative flex items-start justify-between gap-4">
                          <div>
                            <p className="text-[10px] font-semibold uppercase tracking-[0.35em] text-muted-foreground/80">
                              {item.label}
                            </p>
                            <p className={`mt-2 text-lg font-semibold ${item.tone}`}>
                              {item.value}
                            </p>
                            <p className="mt-1 text-xs text-muted-foreground">
                              {item.hint}
                            </p>
                          </div>
                          <div className={`flex h-10 w-10 items-center justify-center rounded-xl ${item.bg}`}>
                            <Icon className={`h-5 w-5 ${item.tone}`} />
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
              <div className="relative w-full max-w-sm rounded-3xl border border-white/30 bg-white/55 p-6 shadow-inner shadow-white/20 dark:border-white/10 dark:bg-slate-900/60">
                <div className="absolute inset-0 rounded-3xl border border-white/40"></div>
                <div className="relative space-y-4">
                  <div className="flex items-center gap-3">
                    <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-primary/15 text-primary motion-safe:animate-float">
                      <Brain className="h-6 w-6" />
                    </div>
                    <div>
                      <p className="text-sm font-medium text-muted-foreground">AI-portföljstatus</p>
                      <p className="text-xl font-semibold text-foreground">{user ? 'Personlig analys aktiv' : 'Inloggning krävs'}</p>
                    </div>
                  </div>
                  <div className="h-px w-full overflow-hidden rounded-full bg-divider-shimmer motion-safe:animate-shimmer motion-reduce:animate-none"></div>
                  <p className="text-sm leading-relaxed text-muted-foreground">
                    Följ din portfölj som ett levande statusboard. Uppdateringar och rekommendationer synkroniseras direkt med Market Minds AI-rådgivare.
                  </p>
                  {lastUpdated && <div className="flex items-center justify-between rounded-2xl border border-white/40 bg-white/40 px-4 py-3 text-xs font-medium text-muted-foreground shadow-inner dark:border-white/10 dark:bg-slate-900/60">
                      <span>Senast uppdaterad</span>
                      <span className="text-foreground">{lastUpdated}</span>
                    </div>}
                </div>
              </div>
            </div>
          </section>

          <PortfolioValueCards
            totalPortfolioValue={totalPortfolioValue}
            totalInvestedValue={investedValue}
            totalCashValue={totalCash}
            cashRatio={cashRatio}
            diversificationScore={healthMetrics.diversificationScore}
            loading={loading}
          />

          {user && !riskProfile && <div className="relative overflow-hidden rounded-[2.5rem] border border-amber-500/30 bg-gradient-to-br from-amber-50/90 via-amber-100/60 to-transparent p-6 shadow-glass supports-[backdrop-filter]:backdrop-blur-xl sm:p-8 dark:from-amber-900/20 dark:via-amber-900/10 dark:to-transparent motion-safe:transition-all motion-safe:duration-500 motion-safe:ease-[cubic-bezier(0.16,1,0.3,1)] motion-safe:hover:-translate-y-1">
                <div className="pointer-events-none absolute inset-x-8 top-0 h-px bg-divider-shimmer opacity-80 motion-safe:animate-shimmer motion-reduce:animate-none"></div>
                <div className="relative flex flex-col gap-6 sm:flex-row sm:items-center sm:justify-between">
                  <div className="flex items-start gap-4">
                    <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-amber-500/15 text-amber-600 dark:text-amber-300">
                      <AlertCircle className="h-6 w-6" />
                    </div>
                    <div>
                      <h3 className="mb-1 text-lg font-semibold text-amber-800 dark:text-amber-100">
                        {t('portfolio.riskProfileRequired')}
                      </h3>
                      <p className="text-sm text-amber-700/90 dark:text-amber-200/80">
                        {t('portfolio.riskProfileRequiredDesc')}
                      </p>
                    </div>
                  </div>
                  <Button onClick={() => navigate('/portfolio-advisor')} className="bg-primary text-primary-foreground shadow-lg transition-all duration-300 hover:bg-primary/90 hover:shadow-xl motion-reduce:transition-none">
                    <User className="mr-2 h-4 w-4" />
                    {t('portfolio.createProfile.button')}
                  </Button>
                </div>
              </div>}

          <div className="grid gap-6 sm:gap-8 xl:grid-cols-[minmax(0,1.75fr)_minmax(0,1fr)] xl:items-start">
            <section className="relative flex h-full flex-col overflow-hidden rounded-[2.5rem] border border-white/30 bg-white/60 shadow-glass supports-[backdrop-filter]:backdrop-blur-2xl dark:border-white/10 dark:bg-slate-950/50">
              <header className="flex items-center justify-between gap-4 px-6 pt-6 sm:px-8">
                <div>
                  <h2 className="text-lg font-semibold text-foreground sm:text-xl">AI-portföljöverblick</h2>
                  <p className="text-sm text-muted-foreground">Samlad status och rekommendationer</p>
                </div>
                {lastUpdated && <span className="hidden rounded-full border border-white/30 px-3 py-1 text-xs font-medium text-muted-foreground/80 sm:inline-flex">
                    Uppdaterad {lastUpdated}
                  </span>}
              </header>
              <div className="pointer-events-none absolute inset-x-8 top-[86px] h-px bg-divider-shimmer opacity-60 motion-safe:animate-shimmer motion-reduce:animate-none"></div>
              <div className="relative flex-1 overflow-hidden px-2 pb-6 sm:px-4">
                <div className="relative h-full overflow-x-hidden overflow-y-visible rounded-[2rem] pt-6 xl:max-h-[70vh] xl:overflow-y-auto xl:pr-2" style={{ scrollbarGutter: 'stable both-edges' }}>
                  <div className="px-2 sm:px-3 lg:px-4">
                    <PortfolioOverview
                      portfolio={activePortfolio}
                      onQuickChat={handleQuickChat}
                      onActionClick={handleActionClick}
                      importControls={portfolioImportControls}
                    />
                  </div>
                </div>
              </div>
            </section>

            <section className="relative flex h-full flex-col overflow-hidden rounded-[2.5rem] border border-white/30 bg-white/60 shadow-glass supports-[backdrop-filter]:backdrop-blur-2xl dark:border-white/10 dark:bg-slate-950/50">
              <header className="flex items-center justify-between gap-4 px-6 pt-6 sm:px-8">
                <div>
                  <h2 className="text-lg font-semibold text-foreground sm:text-xl">Community & signaler</h2>
                  <p className="text-sm text-muted-foreground">Upptäck idéer och diskutera med AI</p>
                </div>
              </header>
              <div className="pointer-events-none absolute inset-x-8 top-[86px] h-px bg-divider-shimmer opacity-60 motion-safe:animate-shimmer motion-reduce:animate-none"></div>
              <div className="relative flex-1 overflow-hidden px-2 pb-6 sm:px-4">
                <div className="relative h-full overflow-x-hidden overflow-y-visible rounded-[2rem] pt-6 xl:max-h-[70vh] xl:overflow-y-auto xl:pr-2" style={{ scrollbarGutter: 'stable both-edges' }}>
                  <div className="px-2 sm:px-3 lg:px-4">
                    <CommunityRecommendations />
                  </div>
                </div>
              </div>
            </section>
          </div>
        </div>
      </div>

      {/* Floating Action Button */}
      <FloatingActionButton />
    </Layout>;
};
export default PortfolioImplementation;
