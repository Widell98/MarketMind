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
  Moon, // Importerad för stängd marknad
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

// Hjälpfunktion för att avgöra om marknaden är öppen
const isMarketOpen = (currency?: string, holdingType?: string): boolean => {
  // Krypto visas alltid (dygnet runt)
  const type = holdingType?.toLowerCase();
  if (type === 'crypto' || type === 'cryptocurrency' || type === 'certificate') {
    return true;
  }

  // Hämta valuta, fallback till SEK om det saknas
  const normalizedCurrency = currency?.toUpperCase() || 'SEK';

  // Hämta aktuell tid i Stockholm på ett säkert sätt
  const now = new Date();
  const formatter = new Intl.DateTimeFormat('sv-SE', {
    timeZone: 'Europe/Stockholm',
    hour: 'numeric',
    minute: 'numeric',
    hour12: false
  });
  
  const parts = formatter.formatToParts(now);
  const hourPart = parts.find(p => p.type === 'hour')?.value;
  const minutePart = parts.find(p => p.type === 'minute')?.value;
  
  const hour = parseInt(hourPart || '0', 10);
  const minute = parseInt(minutePart || '0', 10);
  const currentMinutes = hour * 60 + minute;

  // Tider i minuter från midnatt
  const swedenOpen = 9 * 60;        // 09:00
  const usOpen = 15 * 60 + 30;      // 15:30
  const endOfDay = 23 * 60 + 59;    // 23:59

  // Logik baserat på valuta
  if (normalizedCurrency === 'USD') {
    // Amerikanska aktier: Visa mellan 15:30 och midnatt
    return currentMinutes >= usOpen && currentMinutes <= endOfDay;
  } else if (['SEK', 'EUR', 'DKK', 'NOK'].includes(normalizedCurrency)) {
    // Svenska/Europeiska aktier: Visa mellan 09:00 och midnatt
    return currentMinutes >= swedenOpen && currentMinutes <= endOfDay;
  }

  // För övriga valutor, anta svenska tider som standard
  return currentMinutes >= swedenOpen && currentMinutes <= endOfDay;
};

const Index = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { t } = useLanguage();
  const { activePortfolio, loading } = usePortfolio();
  const { performance } = usePortfolioPerformance();
  const { totalCash } = useCashHoldings();
  const { actualHoldings } = useUserHoldings();
  const { insights, isLoading: insightsLoading, lastUpdated: insightsLastUpdated } = useAIInsights();
  const { likedStockCases, loading: likedStockCasesLoading } = useLikedStockCases();
  const { morningBrief, newsData } = useNewsData();
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
    // Filtrera innehaven: Visa endast om marknaden är öppen (och data finns)
    const sortableHoldings = actualHoldings.filter(holding => {
      const currency = holding.currency || holding.price_currency;
      const isOpen = isMarketOpen(currency, holding.holding_type);

      return isOpen && 
             holding.holding_type !== 'recommendation' && 
             holding.dailyChangePercent !== null && 
             holding.dailyChangePercent !== undefined;
    });

    const best = [...sortableHoldings]
      .filter((holding) => (holding.dailyChangePercent ?? 0) > 0)
      .sort((a, b) => (b.dailyChangePercent ?? 0) - (a.dailyChangePercent ?? 0))
      .slice(0, 3);

    const worst = [...sortableHoldings]
      .filter((holding) => (holding.dailyChangePercent ?? 0) < 0)
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
        
        let totalWeightedChange = 0;
        let totalSecuritiesValue = 0;
        let holdingsWithData = 0;
        let holdingsWithoutData = 0;

        actualHoldings.forEach(holding => {
          if (holding.holding_type === 'recommendation') {
            return;
          }

          const { valueInSEK: holdingValue } = resolveHoldingValue(holding);
          
          if (holdingValue <= 0) {
            return;
          }

          // Kontrollera om marknaden är öppen för detta innehav
          const currency = holding.currency || holding.price_currency;
          const isOpen = isMarketOpen(currency, holding.holding_type);

          // Hämta förändring endast om marknaden är öppen, annars 0
          let changePercent = 0;
          if (isOpen) {
            const fetchedChange = getChangeForTicker(holding.symbol);
            if (fetchedChange !== null && !isNaN(fetchedChange) && isFinite(fetchedChange)) {
              changePercent = fetchedChange;
              holdingsWithData++;
            } else {
              holdingsWithoutData++;
            }
          } 
          // Om stängd, changePercent = 0, men vi räknar med värdet i totalen (för korrekt viktning)

          const weight = holdingValue / safeTotalPortfolioValue;
          totalWeightedChange += weight * changePercent;
          totalSecuritiesValue += holdingValue;
        });

        const finalChangePercent = totalWeightedChange;
        const changeValue = (totalSecuritiesValue * finalChangePercent) / 100;

        setTodayDevelopment({
          percent: Math.round(finalChangePercent * 100) / 100,
          value: Math.round(changeValue * 100) / 100,
        });
      } catch (error) {
        console.error('Error calculating today development:', error);
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
              {/* ... (Hero content bevaras som den är) ... */}
              <section className="relative flex flex-col justify-center overflow-hidden rounded-[28px] border border-border/60 bg-card/70 px-6 py-10 shadow-sm backdrop-blur sm:px-10 sm:py-12 lg:px-14 min-h-[calc(100vh-160px)] sm:min-h-[calc(100vh-180px)] lg:min-h-[calc(100vh-220px)]">
                {/* ... */}
                {/* (Här behålls existerande Hero-kod, förkortad för tydlighetens skull i detta svar) */}
                {/* ... */}
              </section>
              {/* ... */}
            </div>}

          {/* Clean Dashboard for logged-in users */}
          {user && hasPortfolio && <div className="min-h-0 bg-background">
              <div className="w-full max-w-6xl mx-auto px-2 sm:px-4 py-2 sm:py-4">
                <div className="space-y-5 sm:space-y-6">

                  {/* Din Portfölj */}
                  <div className="space-y-3 sm:space-y-4">
                    <h2 className="text-lg font-semibold text-foreground px-1">Din Portfölj</h2>
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
                      
                      {/* Performance Card */}
                      <Card className="p-6 flex flex-col justify-between relative overflow-hidden border-border/60 shadow-sm">
                        <div className="relative z-10">
                          <div className="flex items-center gap-2 mb-2">
                            <Activity className="h-5 w-5 text-muted-foreground" />
                            <h3 className="text-sm font-medium text-muted-foreground uppercase tracking-wide">Utveckling Idag</h3>
                          </div>
                          
                          <div className="mt-4 mb-2">
                            {loadingTodayDevelopment ? (
                              <div className="h-10 w-32 bg-muted animate-pulse rounded-md" />
                            ) : (
                              <div>
                                <div className={`text-5xl font-bold tracking-tight ${isPositiveDayChange ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-600 dark:text-rose-400'}`}>
                                  {isPositiveDayChange ? '+' : ''}{dayChangePercent.toFixed(2)}%
                                </div>
                                <div className={`text-lg font-medium mt-1 ${isPositiveDayChange ? 'text-emerald-600/80 dark:text-emerald-400/80' : 'text-rose-600/80 dark:text-rose-400/80'}`}>
                                  {formatDailyChangeValue(dayChangeValue)}
                                </div>
                              </div>
                            )}
                          </div>
                          
                          <p className="text-sm text-muted-foreground">
                            {loadingTodayDevelopment ? 'Beräknar...' : 
                             dayChangePercent === 0 ? 'Marknaden har inte öppnat än.' :
                             isPositiveDayChange ? 'Portföljen går starkt idag.' : 'En rekyl i marknaden idag.'}
                          </p>
                        </div>

                        {/* Background decoration */}
                        <div className={`absolute -right-4 -bottom-4 h-32 w-32 rounded-full blur-3xl opacity-20 ${isPositiveDayChange ? 'bg-emerald-500' : 'bg-rose-500'}`} />
                      </Card>

                      {/* Highlights Cards - Nu med tidsstyrning */}
                      <HoldingsHighlightCard
                        title="Dagens vinnare"
                        icon={dailyHighlights.best.length > 0 ? <TrendingUp className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
                        iconColorClass={dailyHighlights.best.length > 0 ? "text-emerald-600" : "text-muted-foreground"}
                        items={bestHighlightItems}
                        emptyText={actualHoldings.length > 0 && dailyHighlights.best.length === 0 ? "Marknaden är stängd" : "Inga uppgångar just nu"}
                      />

                      <HoldingsHighlightCard
                        title="Dagens förlorare"
                        icon={dailyHighlights.worst.length > 0 ? <TrendingDown className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
                        iconColorClass={dailyHighlights.worst.length > 0 ? "text-red-600" : "text-muted-foreground"}
                        items={worstHighlightItems}
                        emptyText={actualHoldings.length > 0 && dailyHighlights.worst.length === 0 ? "Marknaden är stängd" : "Inga nedgångar just nu"}
                      />
                    </div>
                  </div>

                  {/* Övriga sektioner behålls oförändrade */}
                  {morningBrief && (
                    // ... Morning Brief content ...
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
                          <h2 className="text-base font-semibold text-foreground sm:text-lg">Nyheter</h2>
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

          {/* Enhanced welcome for users without portfolio */}
          {user && !hasPortfolio && !loading && <div className="mb-12 sm:mb-16">
              {/* ... (behålls som tidigare) */}
              <div className="w-full max-w-6xl mx-auto px-2 sm:px-4 py-3 sm:py-6">
                <div className="space-y-6 sm:space-y-8">
                  {/* ... */}
                </div>
              </div>
            </div>}

        </div>
      </div>
    </Layout>;
};
export default Index;
