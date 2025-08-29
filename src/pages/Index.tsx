import React from 'react';
import Layout from '@/components/Layout';
import IntelligentRouting from '@/components/IntelligentRouting';
import CompactLatestCases from '@/components/CompactLatestCases';
import { Brain, UserPlus, BarChart3, Users, ArrowUpRight, TrendingUp, Wallet, Shield, MessageCircle, CheckCircle, Star, Heart, Target, Coffee, HandHeart, MapPin, Clock, Zap, DollarSign, MessageSquare, Settings, Building2 } from 'lucide-react';
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
    isLoading: insightsLoading
  } = useAIInsights();
  const progressData = useFinancialProgress();
  const hasPortfolio = !loading && !!activePortfolio;
  const totalPortfolioValue = performance.totalPortfolioValue;
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
                  <Button asChild variant="ghost" size="lg" className="text-primary hover:bg-primary/5 font-medium px-8 py-4 rounded-xl transition-all duration-300 text-lg">
                    <Link to="/ai-chat">
                      {t('hero.cta.demo')}
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
                {/* Clean Header */}
                <div className="flex items-center justify-between mb-8">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-xl bg-primary flex items-center justify-center">
                      <TrendingUp className="w-6 h-6 text-primary-foreground" />
                    </div>
                    <div>
                      <h1 className="text-2xl font-semibold text-foreground">
                        {t('dashboard.greeting')}, {user.user_metadata?.first_name || user.user_metadata?.full_name || user.email?.split('@')[0] || t('common.user')}!
                      </h1>
                      <p className="text-muted-foreground">
                        {t('dashboard.subtitle')}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <Button asChild variant="outline" size="sm" className="hover:bg-muted/50">
                      <Link to="/ai-chat">
                        <MessageSquare className="w-4 h-4 mr-2" />
                        AI Chat
                      </Link>
                    </Button>
                    <Button asChild size="sm" className="bg-primary hover:bg-primary/90">
                      <Link to="/portfolio-implementation">
                        <BarChart3 className="w-4 h-4 mr-2" />
                        Min Portfölj
                      </Link>
                    </Button>
                  </div>
                </div>

                {/* Progress Section */}
                <div className="mb-8">
                  <div className="bg-card border rounded-xl p-6">
                    <div className="flex items-start gap-4">
                      <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                        <Target className="w-5 h-5 text-primary" />
                      </div>
                      <div className="flex-1">
                        <h3 className="font-semibold text-foreground mb-1">{progressData.title}</h3>
                        <p className="text-sm text-muted-foreground mb-3">{progressData.description}</p>
                        <div className="flex items-center gap-4">
                          <div className="flex-1">
                            <div className="bg-muted rounded-full h-2">
                              <div className="bg-primary rounded-full h-2 transition-all duration-700 ease-out" style={{
                            width: `${progressData.percentage}%`
                          }} />
                            </div>
                          </div>
                          <span className="text-sm font-medium text-primary">{progressData.percentage}%</span>
                        </div>
                        <p className="text-xs text-muted-foreground mt-2">{progressData.nextStep}</p>
                      </div>
                    </div>
                  </div>
                </div>

                {/* AI Insights */}
                

                {/* Portfolio Overview Cards */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4 lg:gap-6 mb-6 sm:mb-8">
                  <div className="bg-card border rounded-xl p-6 hover:shadow-md transition-shadow">
                    <div className="flex items-center gap-3 mb-4">
                      <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center">
                        <Star className="w-4 h-4 text-primary" />
                      </div>
                      <span className="font-medium text-foreground">{t('dashboard.totalSavings')}</span>
                    </div>
                    <p className="text-3xl font-bold text-primary mb-2">
                      {totalPortfolioValue.toLocaleString('sv-SE')} kr
                    </p>
                    <p className="text-sm text-green-600 font-medium">{t('dashboard.onTrack')}</p>
                  </div>

                  <div className="bg-card border rounded-xl p-6 hover:shadow-md transition-shadow">
                    <div className="flex items-center gap-3 mb-4">
                      <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center">
                        <BarChart3 className="w-4 h-4 text-primary" />
                      </div>
                      <span className="font-medium text-foreground">{t('dashboard.holdings')}</span>
                    </div>
                    <p className="text-3xl font-bold text-primary mb-2">
                      {actualHoldings?.length || 0}
                    </p>
                    <p className="text-sm text-muted-foreground">{t('dashboard.balancedSpread')}</p>
                  </div>

                  <div className="bg-card border rounded-xl p-6 hover:shadow-md transition-shadow">
                    <div className="flex items-center gap-3 mb-4">
                      <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center">
                        <Wallet className="w-4 h-4 text-primary" />
                      </div>
                      <span className="font-medium text-foreground">Likvida medel</span>
                    </div>
                    <p className="text-3xl font-bold text-primary mb-2">
                      {totalCash.toLocaleString('sv-SE')} kr
                    </p>
                    <p className="text-sm text-muted-foreground">Redo för nya möjligheter</p>
                  </div>
                </div>

                {/* Quick Actions */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                  <Button asChild variant="outline" className="group h-auto p-6 hover:bg-primary/5 hover:border-primary/20 border-border/60 transition-all duration-300 hover:shadow-lg hover:shadow-primary/10 bg-card/50 backdrop-blur-sm rounded-2xl">
                    <Link to="/ai-chat" className="flex flex-col items-center gap-3 text-center">
                      <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center group-hover:bg-primary/15 group-hover:scale-105 transition-all duration-300">
                        <MessageSquare className="w-6 h-6 text-primary" />
                      </div>
                      <div className="space-y-2">
                        <span className="font-semibold text-sm">AI Chat</span>
                        <span className="text-xs text-muted-foreground leading-relaxed block mt-3">Få personliga investeringsråd</span>
                      </div>
                    </Link>
                  </Button>

                  <Button asChild variant="outline" className="group h-auto p-6 hover:bg-primary/5 hover:border-primary/20 border-border/60 transition-all duration-300 hover:shadow-lg hover:shadow-primary/10 bg-card/50 backdrop-blur-sm rounded-2xl">
                    <Link to="/market-analyses" className="flex flex-col items-center gap-3 text-center">
                      <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center group-hover:bg-primary/15 group-hover:scale-105 transition-all duration-300">
                        <TrendingUp className="w-6 h-6 text-primary" />
                      </div>
                      <div className="space-y-2">
                        <span className="font-semibold text-sm">Marknadsanalyser</span>
                        <span className="text-xs text-muted-foreground leading-relaxed block mt-3">Djupa marknadsinsikter</span>
                      </div>
                    </Link>
                  </Button>

                  <Button asChild variant="outline" className="group h-auto p-6 hover:bg-primary/5 hover:border-primary/20 border-border/60 transition-all duration-300 hover:shadow-lg hover:shadow-primary/10 bg-card/50 backdrop-blur-sm rounded-2xl">
                    <Link to="/stock-cases" className="flex flex-col items-center gap-3 text-center">
                      <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center group-hover:bg-primary/15 group-hover:scale-105 transition-all duration-300">
                        <Building2 className="w-6 h-6 text-primary" />
                      </div>
                      <div className="space-y-2">
                        <span className="font-semibold text-sm">Stock Cases</span>
                        <span className="text-xs text-muted-foreground leading-relaxed block mt-3">Utforska företag visuellt</span>
                      </div>
                    </Link>
                  </Button>

                  <Button asChild variant="outline" className="group h-auto p-6 hover:bg-primary/5 hover:border-primary/20 border-border/60 transition-all duration-300 hover:shadow-lg hover:shadow-primary/10 bg-card/50 backdrop-blur-sm rounded-2xl">
                    <Link to="/portfolio-advisor" className="flex flex-col items-center gap-3 text-center">
                      <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center group-hover:bg-primary/15 group-hover:scale-105 transition-all duration-300">
                        <Settings className="w-6 h-6 text-primary" />
                      </div>
                      <div className="space-y-2">
                        <span className="font-semibold text-sm">Portföljrådgivare</span>
                        <span className="text-xs text-muted-foreground leading-relaxed block mt-3">Optimera din portfölj</span>
                      </div>
                    </Link>
                  </Button>
                </div>
              </div>
            </div>}

          {/* Enhanced personal welcome for users without portfolio */}
          {user && !hasPortfolio && !loading && <div className="mb-16">
              <Card className="bg-gradient-to-r from-slate-50 to-indigo-50 dark:from-slate-800 dark:to-indigo-900/20 border-slate-200 dark:border-slate-700 shadow-lg">
                <div className="p-16 text-center bg-card/50 backdrop-blur-sm rounded-3xl border shadow-lg">
                  <div className="w-20 h-20 rounded-2xl bg-primary/10 flex items-center justify-center mx-auto mb-8">
                    <HandHeart className="w-10 h-10 text-primary" />
                  </div>
                  <h3 className="font-semibold text-3xl mb-6 text-foreground">Välkommen hem!</h3>
                  <p className="text-muted-foreground mb-12 text-lg leading-relaxed max-w-2xl mx-auto font-light">
                    Nu ska vi lära känna varandra ordentligt. Tänk på mig som din personliga ai-rådgivare som hjälper dig 
                    bygga den ekonomiska trygghet du drömmer om. Vi tar det i din takt, steg för steg.
                  </p>
                  
                  {/* Personal journey section */}
                  <div className="bg-card border rounded-2xl p-8 mb-12 shadow-sm">
                    <h4 className="font-semibold text-lg mb-6 flex items-center justify-center gap-3 text-foreground">
                      <MapPin className="w-5 h-5 text-primary" />
                      Din personliga resa börjar här
                    </h4>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
                      <div className="flex flex-col items-center gap-3 bg-primary/5 p-6 rounded-xl border border-primary/10">
                        <Coffee className="w-6 h-6 text-primary" />
                        <span className="font-medium text-foreground">Berätta om dig</span>
                      </div>
                      <div className="flex flex-col items-center gap-3 bg-primary/5 p-6 rounded-xl border border-primary/10">
                        <HandHeart className="w-6 h-6 text-primary" />
                        <span className="font-medium text-foreground">Vi skapar trygghet</span>
                      </div>
                      <div className="flex flex-col items-center gap-3 bg-primary/5 p-6 rounded-xl border border-primary/10">
                        <Clock className="w-6 h-6 text-primary" />
                        <span className="font-medium text-foreground">Vi följs åt framåt</span>
                      </div>
                    </div>
                  </div>

                  <div className="flex flex-col sm:flex-row gap-4 justify-center">
                    <Button asChild size="lg" className="bg-primary hover:bg-primary/90 text-primary-foreground font-medium px-8 py-4 rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 text-lg">
                      <Link to="/portfolio-advisor?direct=true">
                        <Coffee className="w-5 h-5 mr-2" />
                        Låt oss lära känna varandra
                      </Link>
                    </Button>
                    <Button asChild variant="outline" size="lg" className="hover:bg-muted/50 font-medium px-8 py-4 rounded-xl transition-all duration-300 text-lg">
                      <Link to="/discover">
                        <HandHeart className="w-5 h-5 mr-2" />
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