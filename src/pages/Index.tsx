import React from 'react';
import Layout from '@/components/Layout';
import {
  Brain,
  UserPlus,
  BarChart3,
  Users,
  ArrowUpRight,
  TrendingUp,
  Wallet,
  Shield,
  MessageCircle,
  CheckCircle,
  Star,
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
} from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Link } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { useLanguage } from '@/contexts/LanguageContext';
import { usePortfolio } from '@/hooks/usePortfolio';
import { usePortfolioPerformance } from '@/hooks/usePortfolioPerformance';
import { useCashHoldings } from '@/hooks/useCashHoldings';
import { useUserHoldings } from '@/hooks/useUserHoldings';
import { useAIInsights } from '@/hooks/useAIInsights';
import { useFinancialProgress } from '@/hooks/useFinancialProgress';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';

type QuickAction = {
  icon: React.ComponentType<{ className?: string }>;
  title: string;
  description: string;
  to: string;
};

type SummaryCard = {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  value: string;
  helper: string;
  helperClassName: string;
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

const Index = () => {
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
  const progressData = useFinancialProgress();
  const hasPortfolio = !loading && !!activePortfolio;
  const totalPortfolioValue = performance.totalPortfolioValue;
  const greetingName = user?.user_metadata?.first_name || user?.user_metadata?.full_name || user?.email?.split('@')[0] || t('common.user');
  const holdingsCount = actualHoldings?.length ?? 0;
  const safeTotalPortfolioValue = typeof totalPortfolioValue === 'number' && Number.isFinite(totalPortfolioValue) ? totalPortfolioValue : 0;
  const safeTotalCash = typeof totalCash === 'number' && Number.isFinite(totalCash) ? totalCash : 0;

  const summaryCards = React.useMemo<SummaryCard[]>(() => [
    {
      icon: Star,
      label: t('dashboard.totalSavings'),
      value: `${safeTotalPortfolioValue.toLocaleString('sv-SE')} kr`,
      helper: t('dashboard.onTrack'),
      helperClassName: 'text-emerald-600 dark:text-emerald-400 font-medium',
    },
    {
      icon: BarChart3,
      label: t('dashboard.holdings'),
      value: holdingsCount.toString(),
      helper: t('dashboard.balancedSpread'),
      helperClassName: 'text-muted-foreground',
    },
    {
      icon: Wallet,
      label: 'Likvida medel',
      value: `${safeTotalCash.toLocaleString('sv-SE')} kr`,
      helper: 'Redo för nya möjligheter',
      helperClassName: 'text-muted-foreground',
    },
  ], [t, safeTotalPortfolioValue, holdingsCount, safeTotalCash]);

  const quickActions = React.useMemo<QuickAction[]>(() => [
    {
      icon: MessageSquare,
      title: 'AI Chat',
      description: 'Få personliga investeringsråd',
      to: '/ai-chatt',
    },
    {
      icon: TrendingUp,
      title: 'Marknadsanalyser',
      description: 'Djupa marknadsinsikter',
      to: '/market-analyses',
    },
    {
      icon: Building2,
      title: 'Stock Cases',
      description: 'Utforska företag visuellt',
      to: '/discover',
    },
    {
      icon: Settings,
      title: 'Portföljrådgivare',
      description: 'Optimera din portfölj',
      to: '/portfolio-advisor',
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
        <div className="w-full max-w-6xl mx-auto px-2 sm:px-4 py-4 sm:py-8 lg:py-12">
          
          {/* Hero Section - Apple-inspired clean design */}
          {!user && <div className="text-center mb-20">
              {/* Hero Content */}
              <div className="max-w-4xl mx-auto mb-16">
                <div className="mb-6">
                  
                </div>
                
                <h1 className="text-5xl sm:text-6xl lg:text-7xl font-medium text-foreground mb-8 leading-tight tracking-tight">
                  {t('hero.title1')}
                  <br />
                  <span className="text-primary">{t('hero.title2')}</span>
                </h1>
                
                <p className="text-xl text-muted-foreground leading-relaxed mb-12 max-w-2xl mx-auto font-light">
                  {t('hero.subtitle')}
                </p>
                
                {/* Clean CTA Buttons */}
                <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-20">
                  <Button asChild size="lg" className="bg-primary hover:bg-primary/90 text-primary-foreground font-medium px-8 py-4 rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 text-lg">
                    <Link to="/auth">
                      {t('hero.cta.start')}
                    </Link>
                  </Button>
                </div>
              </div>

              {/* How it works - Clean Apple style */}
              <div className="max-w-4xl mx-auto mb-20">
                <h2 className="text-3xl font-semibold text-foreground mb-4">{t('howItWorks.title')}</h2>
                <p className="text-lg text-muted-foreground mb-16 max-w-2xl mx-auto">
                  {t('howItWorks.subtitle')}
                </p>
                
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8 lg:gap-12">
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
              

              {/* Final CTA - Apple style */}
              
            </div>}

          {/* Clean Dashboard for logged-in users */}
          {user && hasPortfolio && <div className="min-h-0 bg-background">
              <div className="w-full max-w-6xl mx-auto px-2 sm:px-4 py-3 sm:py-6">
                <div className="space-y-6 sm:space-y-8">
                  <div className="rounded-3xl border border-border/60 bg-card/80 p-4 shadow-sm sm:p-6">
                    <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                      <div className="flex items-center gap-3 sm:gap-4">
                        <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-primary text-primary-foreground sm:h-14 sm:w-14">
                          <TrendingUp className="h-6 w-6 sm:h-7 sm:w-7" />
                        </div>
                        <div>
                          <h1 className="text-xl font-semibold text-foreground sm:text-2xl">
                            {t('dashboard.greeting')}, {greetingName}!
                          </h1>
                          <p className="text-sm text-muted-foreground sm:text-base">
                            {t('dashboard.subtitle')}
                          </p>
                        </div>
                      </div>
                      <div className="flex w-full flex-col gap-2 sm:w-auto sm:flex-row sm:items-center sm:gap-3">
                        <Button asChild variant="outline" size="sm" className="w-full justify-center hover:bg-muted/50 sm:w-auto">
                          <Link to="/ai-chatt">
                            <MessageSquare className="mr-2 h-4 w-4" />
                            AI Chat
                          </Link>
                        </Button>
                        <Button asChild size="sm" className="w-full justify-center bg-primary hover:bg-primary/90 sm:w-auto">
                          <Link to="/portfolio-implementation">
                            <BarChart3 className="mr-2 h-4 w-4" />
                            Min Portfölj
                          </Link>
                        </Button>
                      </div>
                    </div>
                  </div>

                  <section className="rounded-3xl border border-border/60 bg-card/80 p-4 shadow-sm sm:p-6">
                    <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:gap-6">
                      <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10 text-primary sm:h-12 sm:w-12">
                        <Target className="h-5 w-5 sm:h-6 sm:w-6" />
                      </div>
                      <div className="flex-1 space-y-3">
                        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                          <div>
                            <h3 className="text-base font-semibold text-foreground sm:text-lg">{progressData.title}</h3>
                            <p className="text-sm text-muted-foreground sm:text-base">{progressData.description}</p>
                          </div>
                          <span className="inline-flex items-center rounded-full bg-primary/10 px-3 py-1 text-sm font-medium text-primary">{progressData.percentage}%</span>
                        </div>
                        <Progress value={progressData.percentage} className="h-2 w-full bg-muted" />
                        <p className="text-xs text-muted-foreground sm:text-sm">{progressData.nextStep}</p>
                      </div>
                    </div>
                  </section>

                  <section>
                    <h2 className="mb-3 text-base font-semibold text-foreground sm:text-lg">Din överblick</h2>
                    <div className="grid grid-cols-1 gap-3 sm:grid-cols-3 sm:gap-4">
                      {summaryCards.map(({ icon: Icon, label, value, helper, helperClassName }) => (
                        <div
                          key={label}
                          className="rounded-3xl border border-border/60 bg-card/80 p-4 shadow-sm transition-shadow hover:shadow-md sm:p-6"
                        >
                          <div className="flex items-center gap-3">
                            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary/10 text-primary">
                              <Icon className="h-5 w-5" />
                            </div>
                            <span className="text-sm font-medium text-muted-foreground">{label}</span>
                          </div>
                          <p className="mt-3 text-2xl font-semibold text-foreground sm:text-3xl">{value}</p>
                          <p className={`mt-2 text-sm ${helperClassName}`}>{helper}</p>
                        </div>
                      ))}
                    </div>
                  </section>

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

                  <section className="rounded-3xl border border-border/60 bg-card/80 p-4 shadow-sm sm:p-6">
                    <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                      <h2 className="text-base font-semibold text-foreground sm:text-lg">Snabbgenvägar</h2>
                    </div>
                    <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-4 sm:gap-4">
                      {quickActions.map(({ icon: Icon, title, description, to }) => (
                        <Button
                          key={title}
                          asChild
                          variant="outline"
                          className="group h-full w-full justify-center rounded-2xl border-border/60 bg-card/60 p-4 text-center transition-all duration-200 hover:border-primary/30 hover:bg-primary/5 hover:shadow-md sm:p-5 whitespace-normal"
                        >
                          <Link
                            to={to}
                            className="flex h-full w-full flex-col items-center gap-3 text-center !whitespace-normal"
                          >
                            <div className="flex items-center justify-center rounded-xl bg-primary/10 p-3 text-primary transition-all group-hover:bg-primary group-hover:text-primary-foreground">
                              <Icon className="h-5 w-5" />
                            </div>
                            <div className="w-full space-y-1 text-center">
                              <p className="break-words text-sm font-semibold text-foreground sm:text-base">
                                {title}
                              </p>
                              <p className="break-words text-xs leading-relaxed text-muted-foreground sm:text-sm">
                                {description}
                              </p>
                            </div>
                          </Link>
                        </Button>
                      ))}
                    </div>
                  </section>
                </div>
              </div>
            </div>}

          {/* Enhanced personal welcome for users without portfolio */}
          {user && !hasPortfolio && !loading && <div className="mb-12 sm:mb-16">
              <Card className="rounded-3xl border-slate-200 bg-gradient-to-r from-slate-50 to-indigo-50 shadow-lg dark:border-slate-700 dark:from-slate-800 dark:to-indigo-900/20">
                <div className="rounded-3xl border bg-card/60 p-6 text-center shadow-lg backdrop-blur-sm sm:p-12">
                  <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-2xl bg-primary/10 sm:mb-8 sm:h-20 sm:w-20">
                    <HandHeart className="h-8 w-8 text-primary sm:h-10 sm:w-10" />
                  </div>
                  <h3 className="mb-4 text-2xl font-semibold text-foreground sm:mb-6 sm:text-3xl">Välkommen hem!</h3>
                  <p className="mx-auto mb-8 max-w-2xl text-base leading-relaxed text-muted-foreground sm:mb-12 sm:text-lg">
                    Nu ska vi lära känna varandra ordentligt. Tänk på mig som din personliga ai-rådgivare som hjälper dig bygga
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
            </div>}

        </div>
      </div>
    </Layout>;
};
export default Index;