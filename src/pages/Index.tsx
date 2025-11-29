import React from 'react';
import Layout from '@/components/Layout';
import {
  Brain,
  BarChart3,
  ArrowUpRight,
  TrendingUp,
  Shield,
  MessageSquare,
  HandHeart,
  MapPin,
  Clock,
  Coffee,
  CheckCircle,
} from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Link } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { useLanguage } from '@/contexts/LanguageContext';
import { usePortfolio } from '@/hooks/usePortfolio';
import { useUserHoldings } from '@/hooks/useUserHoldings';
import { Badge } from '@/components/ui/badge';
import { PersonalDashboard } from '@/components/dashboard/PersonalDashboard';

const Index = () => {
  const { user } = useAuth();
  const { t } = useLanguage();
  const { activePortfolio, loading } = usePortfolio();
  const { actualHoldings } = useUserHoldings();

  // Show portfolio dashboard if user has portfolio OR has holdings
  const hasPortfolio = !loading && (!!activePortfolio || (actualHoldings && actualHoldings.length > 0));

  return (
    <Layout>
      {user && hasPortfolio ? (
        <PersonalDashboard />
      ) : (
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
            </div>}
          </div>
        </div>
      )}
    </Layout>
  );
};

export default Index;
