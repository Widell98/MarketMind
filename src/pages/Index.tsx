import React from 'react';
import Layout from '@/components/Layout';
import {
  Brain,
  UserPlus,
  BarChart3,
  Users,
  ArrowUpRight,
  TrendingUp,
  Shield,
  MessageCircle,
  CheckCircle,
  Heart,
  Target,
  Coffee,
  HandHeart,
  MapPin,
  Clock,
  Zap,
  DollarSign,
  MessageSquare,
  Settings,
  Building2,
  RefreshCw,
  Sparkles,
  Search,
  Newspaper,
  ExternalLink,
  Activity,
  Star,
  Wallet,
} from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { useLanguage } from '@/contexts/LanguageContext';
import { usePortfolio } from '@/hooks/usePortfolio';
import { usePortfolioPerformance } from '@/hooks/usePortfolioPerformance';
import { useCashHoldings } from '@/hooks/useCashHoldings';
import { useUserHoldings, type UserHolding } from '@/hooks/useUserHoldings';
import { useAIInsights } from '@/hooks/useAIInsights';
import { useLikedStockCases } from '@/hooks/useLikedStockCases';
import { useNewsData } from '@/hooks/useNewsData';
import { Badge } from '@/components/ui/badge';
import StockCaseCard from '@/components/StockCaseCard';
import PortfolioOverviewCard, { type SummaryCard } from '@/components/PortfolioOverviewCard';
import { ArrowRight, TrendingDown } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { resolveHoldingValue } from '@/utils/currencyUtils';
import { useDailyChangeData } from '@/hooks/useDailyChangeData';
import HoldingsHighlightCard from '@/components/HoldingsHighlightCard';
import AllocationCard from '@/components/AllocationCard';

type QuickAction = {
  icon: React.ComponentType<{ className?: string }>;
  title: string;
  description: string;
  to: string;
};


const insightTypeLabels: Record<'performance' | 'allocation' | 'risk' | 'opportunity', string> = {
  performance: 'Prestation',
  allocation: 'Allokering',
  risk: 'Risk',
  opportunity: 'Möjlighet',
};

const insightBadgeStyles: Record<'performance' | 'allocation' | 'risk' | 'opportunity', string> = {
  performance: 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-transparent',
  allocation: 'bg-sky-500/10 text-sky-600 dark:text-sky-400 border-transparent',
  risk: 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border-transparent',
  opportunity: 'bg-violet-500/10 text-violet-600 dark:text-violet-400 border-transparent',
};

const formatCategoryLabel = (category: string): string => {
  const categoryMap: Record<string, string> = {
    macro: 'Makro',
    tech: 'Teknik',
    commodities: 'Råvaror',
    earnings: 'Resultat',
    global: 'Globalt',
  };
  return categoryMap[category] || category.charAt(0).toUpperCase() + category.slice(1);
};

const formatTime = (dateString: string): string => {
  const date = new Date(dateString);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
  
  if (diffHours < 1) {
    return 'Nu';
  } else if (diffHours < 24) {
    return `${diffHours}h sedan`;
  } else {
    return new Intl.DateTimeFormat('sv-SE', {
      month: 'short',
      day: 'numeric',
    }).format(date);
  }
};

const Index = () => {
  const navigate = useNavigate();
  const {
    user
  } = useAuth();
  const {
    t
  } = useLanguage();
  const {
    activePortfolio,
    loading
  } = usePortfolio();
  const {
    performance
  } = usePortfolioPerformance();
  const {
    totalCash
  } = useCashHoldings();
  const {
    actualHoldings
  } = useUserHoldings();
  const {
    insights,
    isLoading: insightsLoading,
    lastUpdated: insightsLastUpdated,
    refreshInsights,
  } = useAIInsights();
  const { likedStockCases, loading: likedStockCasesLoading } = useLikedStockCases();
  const { morningBrief, newsData } = useNewsData();
  // Show portfolio dashboard if user has portfolio OR has holdings (so they can see portfolio value after implementing strategy)
  const hasPortfolio = !loading && (!!activePortfolio || (actualHoldings && actualHoldings.length > 0));
  const totalPortfolioValue = performance.totalPortfolioValue;
  const greetingName = user?.user_metadata?.first_name || user?.user_metadata?.full_name || user?.email?.split('@')[0] || t('common.user');
  const holdingsCount = actualHoldings?.length ?? 0;
  const safeTotalPortfolioValue = typeof totalPortfolioValue === 'number' && Number.isFinite(totalPortfolioValue) ? totalPortfolioValue : 0;
  const safeTotalCash = typeof totalCash === 'number' && Number.isFinite(totalCash) ? totalCash : 0;
  
  const formatDailyChangeValue = (value: number | null | undefined) => {
    if (value === null || value === undefined) return '–';
    const prefix = value > 0 ? '+' : '';
    return `${prefix}${value.toLocaleString('sv-SE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} kr`;
  };

  const formatPercent = (value: number) => `${value.toFixed(2)}%`;

  const renderHoldingAvatar = (holding: UserHolding) => {
    const initial = (holding.name || holding.symbol || '?').charAt(0).toUpperCase();
    const baseClasses = 'flex h-10 w-10 items-center justify-center rounded-full text-sm font-semibold';
    const colorClasses = 'bg-muted/40 text-foreground';

    return <div className={`${baseClasses} ${colorClasses}`}>{initial}</div>;
  };

  const dailyHighlights = React.useMemo(() => {
    const sortableHoldings = actualHoldings.filter(holding =>
      holding.holding_type !== 'recommendation' && holding.dailyChangePercent !== null && holding.dailyChangePercent !== undefined
    );

    const best = [...sortableHoldings]
      .sort((a, b) => (b.dailyChangePercent ?? 0) - (a.dailyChangePercent ?? 0))
      .slice(0, 3);

    const worst = [...sortableHoldings]
      .sort((a, b) => (a.dailyChangePercent ?? 0) - (b.dailyChangePercent ?? 0))
      .slice(0, 3);

    return { best, worst };
  }, [actualHoldings]);

  const formatChangeLabel = (value: number | null | undefined) => {
    if (value === null || value === undefined) return '–';
    const prefix = value > 0 ? '+' : '';
    return `${prefix}${formatPercent(value)}`;
  };

  const bestHighlightItems = dailyHighlights.best.map((holding) => ({
    id: holding.id,
    name: holding.name || holding.symbol || 'Innehav',
    symbol: holding.symbol,
    percentLabel: formatChangeLabel(holding.dailyChangePercent),
    valueLabel: formatDailyChangeValue(holding.dailyChangeValueSEK),
    isPositive: (holding.dailyChangePercent ?? 0) >= 0,
  }));

  const worstHighlightItems = dailyHighlights.worst.map((holding) => ({
    id: holding.id,
    name: holding.name || holding.symbol || 'Innehav',
    symbol: holding.symbol,
    percentLabel: formatChangeLabel(holding.dailyChangePercent),
    valueLabel: formatDailyChangeValue(holding.dailyChangeValueSEK),
    isPositive: (holding.dailyChangePercent ?? 0) > 0 ? true : false,
  }));
  
  const {
    data: sheetChangeData,
    loading: sheetChangeDataLoading,
    getChangeForTicker,
  } = useDailyChangeData();

  // Calculate today's development based on Change % from Google Sheets
  const [todayDevelopment, setTodayDevelopment] = React.useState<{ percent: number; value: number } | null>(null);
  const [loadingTodayDevelopment, setLoadingTodayDevelopment] = React.useState(true);

  React.useEffect(() => {
    const calculateTodayDevelopment = async () => {
      if (!user || !hasPortfolio || safeTotalPortfolioValue === 0 || !actualHoldings || actualHoldings.length === 0) {
        setLoadingTodayDevelopment(false);
        return;
      }

      if (sheetChangeDataLoading) {
        setLoadingTodayDevelopment(true);
        return;
      }

      try {
        setLoadingTodayDevelopment(true);

        if (!sheetChangeData || sheetChangeData.size === 0) {
          setTodayDevelopment({
            percent: 0,
            value: 0,
          });
          setLoadingTodayDevelopment(false);
          return;
        }
        
        // Calculate portfolio's today development based on Change % from Google Sheets
        // Weighted by each holding's value in the portfolio
        let totalWeightedChange = 0;
        let totalSecuritiesValue = 0;
        let holdingsWithData = 0;
        let holdingsWithoutData = 0;

        actualHoldings.forEach(holding => {
          // Skip cash holdings and recommendations (they don't have Change %)
          if (holding.holding_type === 'recommendation') {
            return;
          }

          // Get holding's current value in SEK using proper currency conversion
          const { valueInSEK: holdingValue } = resolveHoldingValue(holding);
          
          // Skip if no valid value
          if (holdingValue <= 0) {
            return;
          }

          // Try to find Change % from Google Sheets data
          const changePercent = getChangeForTicker(holding.symbol);

          // Debug logging
          if (import.meta.env.DEV) {
            console.log(`Holding: ${holding.name}, symbol: ${holding.symbol}, changePercent: ${changePercent}, value: ${holdingValue}`);
          }

          // Only include holdings with valid Change % data from Google Sheets
          if (changePercent !== null && !isNaN(changePercent) && isFinite(changePercent)) {
            // Weight the change by the holding's proportion of the portfolio
            const weight = holdingValue / safeTotalPortfolioValue;
            totalWeightedChange += weight * changePercent;
            totalSecuritiesValue += holdingValue;
            holdingsWithData++;
          } else {
            holdingsWithoutData++;
          }
        });

        // Debug logging
        if (import.meta.env.DEV) {
          console.log(`Portfolio development calculation (Google Sheets):`, {
            totalWeightedChange,
            totalSecuritiesValue,
            holdingsWithData,
            holdingsWithoutData,
            safeTotalPortfolioValue,
            totalHoldings: actualHoldings.length
          });
        }

        // Calculate the change value in SEK
        const finalChangePercent = totalWeightedChange;
        const changeValue = (totalSecuritiesValue * finalChangePercent) / 100;

        setTodayDevelopment({
          percent: Math.round(finalChangePercent * 100) / 100,
          value: Math.round(changeValue * 100) / 100,
        });
      } catch (error) {
        console.error('Error calculating today development:', error);
        // Set to 0% on error
        setTodayDevelopment({
          percent: 0,
          value: 0,
        });
      } finally {
        setLoadingTodayDevelopment(false);
      }
    };

    calculateTodayDevelopment();
  }, [user, hasPortfolio, safeTotalPortfolioValue, actualHoldings, sheetChangeData, sheetChangeDataLoading, getChangeForTicker]);

  const dayChangePercent = todayDevelopment?.percent ?? performance.dayChangePercentage ?? 0;
  const dayChangeValue = todayDevelopment?.value ?? 0;
  const isPositiveDayChange = dayChangePercent >= 0;

  const summaryCards = React.useMemo<SummaryCard[]>(() => {
    const changeValue = dayChangeValue;
    const changeValueFormatted = changeValue !== 0
      ? (changeValue >= 0 
        ? `+${changeValue.toLocaleString('sv-SE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} kr`
        : `${changeValue.toLocaleString('sv-SE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} kr`)
      : '0,00 kr';
    return [
      {
        icon: Star,
        label: 'Utveckling idag',
        value: loadingTodayDevelopment 
          ? '—'
          : (dayChangePercent !== 0
            ? (isPositiveDayChange 
              ? `+${dayChangePercent.toFixed(2)}%` 
              : `${dayChangePercent.toFixed(2)}%`)
            : '0.00%'),
        helper: loadingTodayDevelopment
          ? 'Laddar...'
          : (changeValue !== 0
            ? changeValueFormatted
            : safeTotalPortfolioValue > 0 
              ? `${safeTotalPortfolioValue.toLocaleString('sv-SE')} kr`
              : t('dashboard.onTrack')),
        helperClassName: loadingTodayDevelopment
          ? 'text-muted-foreground'
          : (dayChangePercent !== 0
            ? (isPositiveDayChange 
              ? 'text-emerald-600 dark:text-emerald-400 font-medium' 
              : 'text-red-600 dark:text-red-400 font-medium')
            : 'text-muted-foreground'),
      },
      {
        icon: BarChart3,
        label: t('dashboard.holdings'),
        value: holdingsCount.toString(),
        helper: t('dashboard.balancedSpread'),
        helperClassName: 'text-muted-foreground',
      },
      {
        icon: Heart,
        label: 'Gillade aktier',
        value: likedStockCases.length.toString(),
        helper: 'Dina favoriter',
        helperClassName: 'text-muted-foreground',
      },
      {
        icon: Wallet,
        label: 'Likvida medel',
        value: `${safeTotalCash.toLocaleString('sv-SE')} kr`,
        helper: 'Redo för nya möjligheter',
        helperClassName: 'text-muted-foreground',
      },
    ];
  }, [t, safeTotalPortfolioValue, holdingsCount, safeTotalCash, dayChangePercent, isPositiveDayChange, likedStockCases.length, loadingTodayDevelopment, dayChangeValue]);

  const quickActions = React.useMemo<QuickAction[]>(() => [
    {
      icon: MessageSquare,
      title: 'AI Chat',
      description: 'Analysera min portfölj',
      to: `/ai-chatt?message=${encodeURIComponent('Analysera min portfölj och ge mig råd')}`,
    },
    {
      icon: Building2,
      title: 'Upptäck',
      description: 'Hitta nya aktier',
      to: '/discover',
    },
    {
      icon: Sparkles,
      title: 'Nyheter',
      description: 'Marknadsnyheter',
      to: '/news',
    },
    {
      icon: BarChart3,
      title: 'Min Portfölj',
      description: 'Hantera portföljen',
      to: '/portfolio-implementation',
    },
  ], []);

  const lastUpdatedLabel = React.useMemo(() => {
    if (!insightsLastUpdated) {
      return null;
    }

    try {
      return new Intl.DateTimeFormat('sv-SE', {
        hour: '2-digit',
        minute: '2-digit',
      }).format(insightsLastUpdated);
    } catch {
      return insightsLastUpdated.toLocaleTimeString('sv-SE', {
        hour: '2-digit',
        minute: '2-digit',
      });
    }
  }, [insightsLastUpdated]);
  return <Layout>
      <div className="min-h-0 bg-background">
        <div className="w-full max-w-5xl xl:max-w-6xl mx-auto px-3 sm:px-6 py-5 sm:py-9 lg:py-12">
          
          {/* Hero Section - Apple-inspired clean design */}
          {!user && <div className="mb-16 sm:mb-20 lg:mb-24">
              {/* Hero Content */}
              <section className="relative flex flex-col justify-center overflow-hidden rounded-[28px] border border-border/60 bg-card/70 px-6 py-10 shadow-sm backdrop-blur sm:px-10 sm:py-12 lg:px-14 min-h-[calc(100vh-160px)] sm:min-h-[calc(100vh-180px)] lg:min-h-[calc(100vh-220px)]">
                <div className="grid gap-10 lg:gap-12 lg:grid-cols-[minmax(0,1.05fr)_minmax(0,0.95fr)] lg:items-center">
                  <div className="text-left">
                    <div className="mb-8 inline-flex items-center gap-2 rounded-full border border-primary/20 bg-primary/5 px-4 py-2 text-sm font-medium text-primary">
                      <span className="inline-flex h-2 w-2 rounded-full bg-primary"></span>
                      {t('hero.badge')}
                    </div>
                    <h1 className="text-4xl font-semibold text-foreground sm:text-5xl lg:text-[3.2rem] lg:leading-[1.05]">
                      {t('hero.headline')
                        .split('\n')
                        .map((line, index, array) => (
                          <React.Fragment key={index}>
                            {line}
                            {index < array.length - 1 && <br />}
                          </React.Fragment>
                        ))}
                    </h1>
                    <p className="mt-5 text-base leading-relaxed text-muted-foreground sm:text-lg">{t('hero.subtitle')}</p>
                    <div className="mt-7 flex flex-col gap-3 text-sm text-muted-foreground sm:text-base">
                      <div className="flex items-start gap-3">
                        <CheckCircle className="mt-0.5 h-5 w-5 shrink-0 text-primary" />
                        <span>{t('hero.highlight1')}</span>
                      </div>
                      <div className="flex items-start gap-3">
                        <Shield className="mt-0.5 h-5 w-5 shrink-0 text-primary" />
                        <span>{t('hero.highlight2')}</span>
                      </div>
                      <div className="flex items-start gap-3">
                        <TrendingUp className="mt-0.5 h-5 w-5 shrink-0 text-primary" />
                        <span>{t('hero.highlight3')}</span>
                      </div>
                    </div>
                    <div className="mt-8 flex flex-col gap-4 sm:flex-row sm:items-center">
                      <Button asChild size="lg" className="h-12 rounded-2xl bg-primary px-8 text-base font-semibold text-primary-foreground shadow-lg transition-all duration-300 hover:bg-primary/90 hover:shadow-xl">
                        <Link to="/auth" className="flex items-center gap-2">
                          {t('hero.cta.start')}
                          <ArrowUpRight className="h-4 w-4" />
                        </Link>
                      </Button>
                      <div className="flex items-center gap-3 text-sm text-muted-foreground sm:text-base">
                        <Shield className="h-5 w-5 text-primary" />
                        <span>{t('hero.integrity')}</span>
                      </div>
                    </div>
                  </div>
                  <Card className="relative overflow-hidden rounded-[28px] border border-border/60 bg-gradient-to-br from-primary/5 via-background to-background p-5 shadow-lg sm:p-8 lg:p-10">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-muted-foreground">{t('hero.chart.portfolioValueLabel')}</p>
                        <p className="mt-2 text-3xl font-semibold text-foreground">{t('hero.chart.portfolioValue')}</p>
                      </div>
                      <Badge className="rounded-full bg-emerald-500/10 text-xs font-semibold text-emerald-600">
                        {t('hero.chart.performanceBadge')}
                      </Badge>
                    </div>
                    <div className="mt-7">
                      <svg viewBox="0 0 400 180" className="h-40 w-full sm:h-44 lg:h-48">
                        <defs>
                          <linearGradient id="heroGradient" x1="0%" y1="0%" x2="0%" y2="100%">
                            <stop offset="0%" stopColor="rgba(59,130,246,0.35)" />
                            <stop offset="100%" stopColor="rgba(59,130,246,0)" />
                          </linearGradient>
                        </defs>
                        <path
                          d="M20 140L80 120L140 150L200 90L260 110L320 60L380 80"
                          fill="none"
                          stroke="hsl(var(--primary))"
                          strokeWidth="8"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        />
                        <path
                          d="M20 140L80 120L140 150L200 90L260 110L320 60L380 80L380 180L20 180Z"
                          fill="url(#heroGradient)"
                        />
                      </svg>
                    </div>
                    <div className="grid gap-4 border-t border-border/60 pt-6 sm:grid-cols-2">
                      <div>
                        <p className="text-xs uppercase tracking-wide text-muted-foreground">{t('hero.chart.aiSignalLabel')}</p>
                        <p className="mt-1 text-sm font-medium text-foreground">{t('hero.chart.aiSignalValue')}</p>
                        <p className="text-xs text-muted-foreground">{t('hero.chart.aiSignalDescription')}</p>
                      </div>
                      <div>
                        <p className="text-xs uppercase tracking-wide text-muted-foreground">{t('hero.chart.riskLabel')}</p>
                        <p className="mt-1 text-sm font-medium text-foreground">{t('hero.chart.riskValue')}</p>
                        <p className="text-xs text-muted-foreground">{t('hero.chart.riskDescription')}</p>
                      </div>
                    </div>
                    <div className="absolute -right-10 -top-10 h-32 w-32 rounded-full bg-primary/10 blur-2xl" />
                    <div className="absolute -bottom-12 -left-6 h-36 w-36 rounded-full bg-sky-500/10 blur-3xl" />
                  </Card>
                </div>
              </section>

              {/* How it works - Clean Apple style */}
              <div className="mx-auto mt-16 max-w-5xl sm:mt-20">
                <div className="text-center">
                  <h2 className="text-2xl font-semibold text-foreground sm:text-3xl">{t('howItWorks.title')}</h2>
                  <p className="mt-3 text-base text-muted-foreground sm:text-lg">{t('howItWorks.subtitle')}</p>
                </div>
                <div className="mt-10 grid grid-cols-1 gap-6 sm:mt-12 sm:grid-cols-2 lg:grid-cols-3 sm:gap-8 lg:gap-12">
                  <div className="text-center">
                    <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center mx-auto mb-6">
                      <MessageSquare className="w-8 h-8 text-primary" />
                    </div>
                    <h3 className="text-xl font-semibold mb-3 text-foreground">{t('howItWorks.step1.title')}</h3>
                    <p className="text-muted-foreground leading-relaxed">
                      {t('howItWorks.step1.description')}
                    </p>
                  </div>
                  
                  <div className="text-center">
                    <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center mx-auto mb-6">
                      <Brain className="w-8 h-8 text-primary" />
                    </div>
                    <h3 className="text-xl font-semibold mb-3 text-foreground">{t('howItWorks.step2.title')}</h3>
                    <p className="text-muted-foreground leading-relaxed">
                      {t('howItWorks.step2.description')}
                    </p>
                  </div>
                  
                  <div className="text-center">
                    <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center mx-auto mb-6">
                      <BarChart3 className="w-8 h-8 text-primary" />
                    </div>
                    <h3 className="text-xl font-semibold mb-3 text-foreground">{t('howItWorks.step3.title')}</h3>
                    <p className="text-muted-foreground leading-relaxed">
                      {t('howItWorks.step3.description')}
                    </p>
                  </div>
                </div>
              </div>

            {/* Clean Examples Section */}


            </div>}

          {/* Clean Dashboard for logged-in users */}
          {user && hasPortfolio && <div className="min-h-0 bg-background">
              <div className="w-full max-w-6xl mx-auto px-2 sm:px-4 py-2 sm:py-4">
                <div className="space-y-5 sm:space-y-6">
                  {/* Portfolio Value & Overview Combined */}
                  <PortfolioOverviewCard
                    portfolioValue={safeTotalPortfolioValue}
                    totalReturn={performance.totalReturn}
                    totalReturnPercentage={performance.totalReturnPercentage}
                    summaryCards={summaryCards}
                    loading={loadingTodayDevelopment && summaryCards.length === 0}
                    dayChangePercent={dayChangePercent}
                    dayChangeValue={dayChangeValue}
                    isPositiveDayChange={isPositiveDayChange}
                  />

                    {/* Dagens förändring och allokering */}
                    {(dailyHighlights.best.length > 0 || dailyHighlights.worst.length > 0 || performance.totalPortfolioValue > 0 || safeTotalCash > 0) && (
                      <div className="space-y-3 sm:space-y-4">
                        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-3 sm:gap-4">
                          {dailyHighlights.best.length > 0 && (
                            <HoldingsHighlightCard
                              title="Bästa innehav idag"
                              icon={<TrendingUp className="h-5 w-5" />}
                              iconColorClass="text-emerald-600"
                              items={bestHighlightItems}
                              emptyText="Ingen dagsdata ännu"
                            />
                          )}

                          {dailyHighlights.worst.length > 0 && (
                            <HoldingsHighlightCard
                              title="Sämsta innehav idag"
                              icon={<TrendingDown className="h-5 w-5" />}
                              iconColorClass="text-red-600"
                              items={worstHighlightItems}
                              emptyText="Ingen dagsdata ännu"
                            />
                          )}

                          {(performance.totalPortfolioValue > 0 || safeTotalCash > 0) && (
                            <AllocationCard
                              investedPercentage={performance.investedPercentage ?? 0}
                              cashPercentage={performance.cashPercentage ?? 0}
                            />
                          )}
                        </div>
                      </div>
                    )}

                  {/* News/Morning Brief Section - Moved up */}
                  {morningBrief && (
                    <section className="rounded-3xl border border-border/60 bg-card/80 p-4 shadow-sm sm:p-6">
                      <div className="flex items-center gap-2 mb-4">
                        <Sparkles className="h-5 w-5 text-primary" />
                        <h2 className="text-base font-semibold text-foreground sm:text-lg">Morgonrapport</h2>
                        <Badge variant="secondary" className="ml-2">Idag</Badge>
                      </div>
                      <div className="space-y-3">
                        <h3 className="text-lg font-semibold text-foreground">{morningBrief.headline}</h3>
                        <p className="text-sm text-muted-foreground line-clamp-3">{morningBrief.overview}</p>
                        {morningBrief.keyHighlights && morningBrief.keyHighlights.length > 0 && (
                          <div className="mt-4 space-y-2">
                            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Höjdpunkter</p>
                            <ul className="space-y-1">
                              {morningBrief.keyHighlights.slice(0, 3).map((highlight, idx) => (
                                <li key={idx} className="flex items-start gap-2 text-sm text-foreground">
                                  <span className="text-primary mt-1">•</span>
                                  <span>{highlight}</span>
                                </li>
                              ))}
                            </ul>
                          </div>
                        )}
                        <Button asChild variant="outline" size="sm" className="mt-4">
                          <Link to="/news">
                            Läs mer
                            <ArrowRight className="ml-2 h-4 w-4" />
                          </Link>
                        </Button>
                      </div>
                    </section>
                  )}

                  {/* Liked Stocks Section */}
                  <section className="rounded-3xl border border-border/60 bg-card/80 p-4 shadow-sm sm:p-6">
                    <div className="flex items-center justify-between mb-4">
                      <div className="flex items-center gap-2">
                        <Heart className="h-5 w-5 text-primary" />
                        <h2 className="text-base font-semibold text-foreground sm:text-lg">Dina gillade aktier</h2>
                      </div>
                      {likedStockCases.length > 0 && (
                        <Button asChild variant="ghost" size="sm" className="text-primary hover:text-primary/80">
                          <Link to="/discover?tab=liked">
                            Se alla
                            <ArrowRight className="ml-2 h-4 w-4" />
                          </Link>
                        </Button>
                      )}
                    </div>
                    {likedStockCasesLoading ? (
                      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3 sm:gap-4">
                        {Array.from({ length: 3 }).map((_, index) => (
                          <div key={index} className="rounded-2xl border border-border/60 bg-muted/20 p-4 animate-pulse">
                            <div className="h-4 w-3/4 rounded bg-muted mb-2" />
                            <div className="h-3 w-1/2 rounded bg-muted" />
                          </div>
                        ))}
                      </div>
                    ) : likedStockCases.length > 0 ? (
                      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3 sm:gap-4">
                        {likedStockCases.slice(0, 3).map((stockCase) => (
                          <StockCaseCard
                            key={stockCase.id}
                            stockCase={stockCase}
                            onViewDetails={(id) => navigate(`/stock-cases/${id}`)}
                            showMetaBadges={false}
                          />
                        ))}
                      </div>
                    ) : (
                      <div className="rounded-2xl border border-dashed border-border/60 bg-muted/20 p-8 text-center">
                        <Heart className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
                        <h3 className="text-lg font-semibold mb-2">Inga gillade aktier ännu</h3>
                        <p className="text-sm text-muted-foreground mb-4">
                          Utforska aktier och lägg till dem i dina favoriter
                        </p>
                        <Button asChild>
                          <Link to="/discover">
                            <Search className="mr-2 h-4 w-4" />
                            Upptäck aktier
                          </Link>
                        </Button>
                      </div>
                    )}
                  </section>

                  {/* Latest News Section */}
                  {newsData && newsData.length > 0 && (
                    <section className="rounded-3xl border border-border/60 bg-card/80 p-4 shadow-sm sm:p-6">
                      <div className="flex items-center justify-between mb-4">
                        <div className="flex items-center gap-2">
                          <Newspaper className="h-5 w-5 text-primary" />
                          <h2 className="text-base font-semibold text-foreground sm:text-lg">Senaste nyheter</h2>
                        </div>
                        <Button asChild variant="ghost" size="sm" className="text-primary hover:text-primary/80">
                          <Link to="/news">
                            Se alla
                            <ArrowRight className="ml-2 h-4 w-4" />
                          </Link>
                        </Button>
                      </div>
                      <div className="grid grid-cols-1 gap-3 sm:grid-cols-3 sm:gap-4">
                        {newsData.slice(0, 3).map((newsItem) => (
                          <Card
                            key={newsItem.id}
                            className="rounded-2xl border border-border/60 bg-background/80 p-4 hover:shadow-md transition-all cursor-pointer group"
                            onClick={() => {
                              if (newsItem.url && newsItem.url !== '#') {
                                window.open(newsItem.url, '_blank', 'noopener,noreferrer');
                              }
                            }}
                          >
                            <div className="flex items-center justify-between mb-2">
                              <Badge variant="secondary" className="text-xs">
                                {formatCategoryLabel(newsItem.category)}
                              </Badge>
                              <span className="text-xs text-muted-foreground">
                                {formatTime(newsItem.publishedAt)}
                              </span>
                            </div>
                            <h3 className="font-semibold text-sm mb-2 line-clamp-2 group-hover:text-primary transition-colors">
                              {newsItem.headline}
                            </h3>
                            <p className="text-xs text-muted-foreground line-clamp-2 mb-2">
                              {newsItem.summary}
                            </p>
                            <div className="flex items-center justify-between mt-3 pt-3 border-t border-border/60">
                              <span className="text-xs text-muted-foreground">{newsItem.source}</span>
                              {newsItem.url && newsItem.url !== '#' && (
                                <ExternalLink className="h-3 w-3 text-muted-foreground group-hover:text-primary transition-colors" />
                              )}
                            </div>
                          </Card>
                        ))}
                      </div>
                    </section>
                  )}

                  {/* <section className="rounded-3xl border border-border/60 bg-card/80 p-4 shadow-sm sm:p-6">
                    <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                      <div>
                        <h2 className="text-base font-semibold text-foreground sm:text-lg">AI-insikter för dig</h2>
                        <p className="text-sm text-muted-foreground sm:text-base">Personliga rekommendationer baserade på din portfölj.</p>
                      </div>
                      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:gap-3">
                        {lastUpdatedLabel && <span className="text-xs text-muted-foreground sm:text-sm">Senast uppdaterad {lastUpdatedLabel}</span>}
                        <Button type="button" variant="outline" size="sm" onClick={refreshInsights} disabled={insightsLoading} className="w-full justify-center sm:w-auto">
                          <RefreshCw className={`mr-2 h-4 w-4 ${insightsLoading ? 'animate-spin' : ''}`} />
                          {insightsLoading ? 'Hämtar...' : 'Uppdatera'}
                        </Button>
                      </div>
                    </div>
                    <div className="-mx-1 mt-4 flex gap-3 overflow-x-auto pb-2 sm:mx-0 sm:grid sm:grid-cols-3 sm:gap-4 sm:overflow-visible">
                      {insightsLoading && insights.length === 0 ? (
                        Array.from({ length: 2 }).map((_, index) => (
                          <div
                            key={index}
                            className="min-w-[16rem] animate-pulse rounded-2xl border border-border/60 bg-muted/20 p-4 sm:min-w-0 sm:p-5"
                          >
                            <div className="h-5 w-20 rounded-full bg-muted" />
                            <div className="mt-4 h-4 w-3/4 rounded bg-muted" />
                            <div className="mt-2 h-3 w-full rounded bg-muted" />
                            <div className="mt-2 h-3 w-2/3 rounded bg-muted" />
                          </div>
                        ))
                      ) : insights.length > 0 ? (
                        insights.map((insight, index) => {
                          const type = (insight.type as keyof typeof insightTypeLabels) ?? 'opportunity';
                          const badgeClassName = insightBadgeStyles[type] ?? 'bg-primary/10 text-primary';
                          const label = insightTypeLabels[type] ?? 'AI-insikt';
                          const title = insight.title || 'AI-insikt';
                          const message = insight.message || '';

                          return (
                            <div
                              key={`${title}-${index}`}
                              className="min-w-[16rem] flex-1 rounded-2xl border border-border/60 bg-background/80 p-4 sm:min-w-0 sm:p-5"
                            >
                              <Badge className={`mb-3 w-fit ${badgeClassName}`}>{label}</Badge>
                              <p className="text-sm font-semibold text-foreground">{title}</p>
                              <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{message}</p>
                            </div>
                          );
                        })
                      ) : (
                        <div className="flex min-w-[16rem] flex-col justify-center gap-2 rounded-2xl border border-dashed border-border/60 bg-muted/20 p-4 text-sm text-muted-foreground sm:min-w-0 sm:p-6">
                          <div className="flex items-center gap-2 text-muted-foreground">
                            <Sparkles className="h-4 w-4 text-primary" />
                            <span>Inga AI-insikter ännu</span>
                          </div>
                          <p>Tryck på uppdatera för att hämta personliga rekommendationer.</p>
                        </div>
                      )}
                    </div>
                  </section> */}
                </div>
              </div>
            </div>}

          {/* Enhanced personal welcome for users without portfolio */}
          {user && !hasPortfolio && !loading && <div className="mb-12 sm:mb-16">
              <div className="w-full max-w-6xl mx-auto px-2 sm:px-4 py-3 sm:py-6">
                <div className="space-y-6 sm:space-y-8">
                  <Card className="rounded-3xl border-slate-200 bg-gradient-to-r from-slate-50 to-indigo-50 shadow-lg dark:border-slate-700 dark:from-slate-800 dark:to-indigo-900/20">
                    <div className="rounded-3xl border bg-card/60 p-6 text-center shadow-lg backdrop-blur-sm sm:p-12">
                      <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-2xl bg-primary/10 sm:mb-8 sm:h-20 sm:w-20">
                        <HandHeart className="h-8 w-8 text-primary sm:h-10 sm:w-10" />
                      </div>
                      <h3 className="mb-4 text-2xl font-semibold text-foreground sm:mb-6 sm:text-3xl">Välkommen hem!</h3>
                      <p className="mx-auto mb-8 max-w-2xl text-base leading-relaxed text-muted-foreground sm:mb-12 sm:text-lg">
                        Nu ska vi lära känna varandra ordentligt. Tänk på MarketMind som din personliga AI-guide som hjälper dig bygga
                        den ekonomiska trygghet du drömmer om. Vi tar det i din takt, steg för steg.
                      </p>

                      {/* Personal journey section */}
                      <div className="mb-8 rounded-2xl border bg-card p-6 shadow-sm sm:mb-12 sm:p-8">
                        <h4 className="mb-6 flex items-center justify-center gap-3 text-lg font-semibold text-foreground">
                          <MapPin className="h-5 w-5 text-primary" />
                          Din personliga resa börjar här
                        </h4>
                        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3 sm:gap-6">
                          <div className="flex flex-col items-center gap-3 rounded-xl border border-primary/10 bg-primary/5 p-5 sm:p-6">
                            <Coffee className="h-6 w-6 text-primary" />
                            <span className="font-medium text-foreground">Berätta om dig</span>
                          </div>
                          <div className="flex flex-col items-center gap-3 rounded-xl border border-primary/10 bg-primary/5 p-5 sm:p-6">
                            <HandHeart className="h-6 w-6 text-primary" />
                            <span className="font-medium text-foreground">Vi skapar trygghet</span>
                          </div>
                          <div className="flex flex-col items-center gap-3 rounded-xl border border-primary/10 bg-primary/5 p-5 sm:p-6">
                            <Clock className="h-6 w-6 text-primary" />
                            <span className="font-medium text-foreground">Vi följs åt framåt</span>
                          </div>
                        </div>
                      </div>

                      <div className="flex flex-col items-stretch gap-3 sm:flex-row sm:justify-center sm:gap-4">
                        <Button asChild size="lg" className="w-full rounded-xl bg-primary px-6 py-4 text-lg font-medium text-primary-foreground shadow-lg transition-all duration-300 hover:bg-primary/90 hover:shadow-xl sm:w-auto sm:px-8">
                          <Link to="/portfolio-advisor?direct=true">
                            <Coffee className="mr-2 h-5 w-5" />
                            Låt oss lära känna varandra
                          </Link>
                        </Button>
                        <Button asChild variant="outline" size="lg" className="w-full rounded-xl px-6 py-4 text-lg font-medium transition-all duration-300 hover:bg-muted/50 sm:w-auto sm:px-8">
                          <Link to="/discover">
                            <HandHeart className="mr-2 h-5 w-5" />
                            Utforska mer
                          </Link>
                        </Button>
                      </div>
                    </div>
                  </Card>

                  {/* Liked Stocks Section for users without portfolio */}
                  <section className="rounded-3xl border border-border/60 bg-card/80 p-4 shadow-sm sm:p-6">
                    <div className="flex items-center justify-between mb-4">
                      <div className="flex items-center gap-2">
                        <Heart className="h-5 w-5 text-primary" />
                        <h2 className="text-base font-semibold text-foreground sm:text-lg">Dina gillade aktier</h2>
                      </div>
                      {likedStockCases.length > 0 && (
                        <Button asChild variant="ghost" size="sm" className="text-primary hover:text-primary/80">
                          <Link to="/discover?tab=liked">
                            Se alla
                            <ArrowRight className="ml-2 h-4 w-4" />
                          </Link>
                        </Button>
                      )}
                    </div>
                    {likedStockCasesLoading ? (
                      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3 sm:gap-4">
                        {Array.from({ length: 3 }).map((_, index) => (
                          <div key={index} className="rounded-2xl border border-border/60 bg-muted/20 p-4 animate-pulse">
                            <div className="h-4 w-3/4 rounded bg-muted mb-2" />
                            <div className="h-3 w-1/2 rounded bg-muted" />
                          </div>
                        ))}
                      </div>
                    ) : likedStockCases.length > 0 ? (
                      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3 sm:gap-4">
                        {likedStockCases.slice(0, 3).map((stockCase) => (
                          <StockCaseCard
                            key={stockCase.id}
                            stockCase={stockCase}
                            onViewDetails={(id) => navigate(`/stock-cases/${id}`)}
                            showMetaBadges={false}
                          />
                        ))}
                      </div>
                    ) : (
                      <div className="rounded-2xl border border-dashed border-border/60 bg-muted/20 p-8 text-center">
                        <Heart className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
                        <h3 className="text-lg font-semibold mb-2">Inga gillade aktier ännu</h3>
                        <p className="text-sm text-muted-foreground mb-4">
                          Utforska aktier och lägg till dem i dina favoriter
                        </p>
                        <Button asChild>
                          <Link to="/discover">
                            <Search className="mr-2 h-4 w-4" />
                            Upptäck aktier
                          </Link>
                        </Button>
                      </div>
                    )}
                  </section>

                  {/* News/Morning Brief Section for users without portfolio */}
                  {morningBrief && (
                    <section className="rounded-3xl border border-border/60 bg-card/80 p-4 shadow-sm sm:p-6">
                      <div className="flex items-center gap-2 mb-4">
                        <Sparkles className="h-5 w-5 text-primary" />
                        <h2 className="text-base font-semibold text-foreground sm:text-lg">Morgonrapport</h2>
                        <Badge variant="secondary" className="ml-2">Idag</Badge>
                      </div>
                      <div className="space-y-3">
                        <h3 className="text-lg font-semibold text-foreground">{morningBrief.headline}</h3>
                        <p className="text-sm text-muted-foreground line-clamp-3">{morningBrief.overview}</p>
                        {morningBrief.keyHighlights && morningBrief.keyHighlights.length > 0 && (
                          <div className="mt-4 space-y-2">
                            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Höjdpunkter</p>
                            <ul className="space-y-1">
                              {morningBrief.keyHighlights.slice(0, 3).map((highlight, idx) => (
                                <li key={idx} className="flex items-start gap-2 text-sm text-foreground">
                                  <span className="text-primary mt-1">•</span>
                                  <span>{highlight}</span>
                                </li>
                              ))}
                            </ul>
                          </div>
                        )}
                        <Button asChild variant="outline" size="sm" className="mt-4">
                          <Link to="/news">
                            Läs mer
                            <ArrowRight className="ml-2 h-4 w-4" />
                          </Link>
                        </Button>
                      </div>
                    </section>
                  )}

                  {/* Latest News Section */}
                  {newsData && newsData.length > 0 && (
                    <section className="rounded-3xl border border-border/60 bg-card/80 p-4 shadow-sm sm:p-6">
                      <div className="flex items-center justify-between mb-4">
                        <div className="flex items-center gap-2">
                          <Newspaper className="h-5 w-5 text-primary" />
                          <h2 className="text-base font-semibold text-foreground sm:text-lg">Senaste nyheter</h2>
                        </div>
                        <Button asChild variant="ghost" size="sm" className="text-primary hover:text-primary/80">
                          <Link to="/news">
                            Se alla
                            <ArrowRight className="ml-2 h-4 w-4" />
                          </Link>
                        </Button>
                      </div>
                      <div className="grid grid-cols-1 gap-3 sm:grid-cols-3 sm:gap-4">
                        {newsData.slice(0, 3).map((newsItem) => (
                          <Card
                            key={newsItem.id}
                            className="rounded-2xl border border-border/60 bg-background/80 p-4 hover:shadow-md transition-all cursor-pointer group"
                            onClick={() => {
                              if (newsItem.url && newsItem.url !== '#') {
                                window.open(newsItem.url, '_blank', 'noopener,noreferrer');
                              }
                            }}
                          >
                            <div className="flex items-center justify-between mb-2">
                              <Badge variant="secondary" className="text-xs">
                                {formatCategoryLabel(newsItem.category)}
                              </Badge>
                              <span className="text-xs text-muted-foreground">
                                {formatTime(newsItem.publishedAt)}
                              </span>
                            </div>
                            <h3 className="font-semibold text-sm mb-2 line-clamp-2 group-hover:text-primary transition-colors">
                              {newsItem.headline}
                            </h3>
                            <p className="text-xs text-muted-foreground line-clamp-2 mb-2">
                              {newsItem.summary}
                            </p>
                            <div className="flex items-center justify-between mt-3 pt-3 border-t border-border/60">
                              <span className="text-xs text-muted-foreground">{newsItem.source}</span>
                              {newsItem.url && newsItem.url !== '#' && (
                                <ExternalLink className="h-3 w-3 text-muted-foreground group-hover:text-primary transition-colors" />
                              )}
                            </div>
                          </Card>
                        ))}
                      </div>
                    </section>
                  )}
                </div>
              </div>
            </div>}

        </div>
      </div>
    </Layout>;
};
export default Index;