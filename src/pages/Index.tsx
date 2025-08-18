import React from 'react';
import Layout from '@/components/Layout';
import IntelligentRouting from '@/components/IntelligentRouting';
import CompactLatestCases from '@/components/CompactLatestCases';
import { Brain, UserPlus, BarChart3, Users, ArrowUpRight, TrendingUp, Wallet, Shield, MessageCircle, CheckCircle, Star, Heart, Target, Coffee, HandHeart, MapPin, Clock, Zap, DollarSign, MessageSquare, Settings, Building2 } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Link } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
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
  const { insights, isLoading: insightsLoading } = useAIInsights();
  const progressData = useFinancialProgress();
  const hasPortfolio = !loading && !!activePortfolio;
  const totalPortfolioValue = performance.totalPortfolioValue + totalCash;
  
  return <Layout>
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50/30 to-indigo-50/50 dark:from-gray-950 dark:via-blue-950/20 dark:to-indigo-950/30">
        <div className="container mx-auto px-4 py-8 max-w-6xl">
          
          {/* Hero Section - Only show for non-logged in users */}
          {!user && <div className="text-center mb-16">
              <div className="mb-8">
                <div className="inline-flex items-center gap-2 bg-emerald-100 text-emerald-700 dark:bg-emerald-900/20 dark:text-emerald-400 px-4 py-2 rounded-full text-sm font-medium mb-6">
                  <HandHeart className="w-4 h-4" />
                  Redan 1000+ svenskar litar på oss
                </div>
                <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-foreground mb-6">
                  Din personliga finansiella rådgivare
                  <span className="block text-primary">– alltid vid din sida</span>
                </h1>
                <p className="text-lg sm:text-xl text-muted-foreground leading-relaxed mb-10 max-w-3xl mx-auto">
                  Optimera din portfölj, förstå marknaden och få stöd i osäkra tider. 
                  <span className="font-medium text-foreground"> Enkelt, tryggt, smart.</span>
                </p>
              </div>

              {/* Personal story visualization - Multiple examples */}
              <div className="mb-10 relative">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-5xl mx-auto">
                  
                  {/* Example 1: Conservative investor */}
                  <div className="bg-gradient-to-r from-slate-100 via-blue-50 to-indigo-100 dark:from-slate-800 dark:via-blue-900/20 dark:to-indigo-900/20 rounded-2xl p-6 border border-slate-200/50 dark:border-slate-700/50 shadow-lg">
                    <div className="flex items-center gap-3 mb-4">
                      <div className="w-8 h-8 rounded-full bg-gradient-to-r from-blue-500 to-indigo-500 flex items-center justify-center">
                        <Coffee className="w-4 h-4 text-white" />
                      </div>
                      <div className="text-left">
                        <p className="text-sm font-medium">Anna, 45</p>
                        <p className="text-xs text-muted-foreground">Konservativ</p>
                      </div>
                    </div>
                    <div className="bg-white dark:bg-gray-800 rounded-lg p-3 text-left text-xs shadow-sm mb-3">
                      "Hjälp mig bygga en trygg portfölj för min pension. Jag vill sova gott om nätterna."
                    </div>
                    <div className="bg-emerald-50 dark:bg-emerald-900/20 rounded-lg p-3 text-left text-xs border border-emerald-200 dark:border-emerald-800">
                      "Perfekt! Jag föreslår 70% räntor och 30% stabila aktier för trygghet."
                    </div>
                  </div>

                  {/* Example 2: Young aggressive investor */}
                  <div className="bg-gradient-to-r from-orange-100 via-red-50 to-pink-100 dark:from-orange-900/20 dark:via-red-900/20 dark:to-pink-900/20 rounded-2xl p-6 border border-orange-200/50 dark:border-orange-700/50 shadow-lg">
                    <div className="flex items-center gap-3 mb-4">
                      <div className="w-8 h-8 rounded-full bg-gradient-to-r from-orange-500 to-red-500 flex items-center justify-center">
                        <Zap className="w-4 h-4 text-white" />
                      </div>
                      <div className="text-left">
                        <p className="text-sm font-medium">Erik, 26</p>
                        <p className="text-xs text-muted-foreground">Aggressiv</p>
                      </div>
                    </div>
                    <div className="bg-white dark:bg-gray-800 rounded-lg p-3 text-left text-xs shadow-sm mb-3">
                      "Jag är ung och vill maximera tillväxten. Kan ta höga risker för bättre avkastning!"
                    </div>
                    <div className="bg-orange-50 dark:bg-orange-900/20 rounded-lg p-3 text-left text-xs border border-orange-200 dark:border-orange-800">
                      "Utmärkt! 90% tillväxtaktier och 10% emerging markets. Långsiktig hög avkastning!"
                    </div>
                  </div>

                  {/* Example 3: Dividend-focused older investor */}
                  <div className="bg-gradient-to-r from-green-100 via-emerald-50 to-teal-100 dark:from-green-900/20 dark:via-emerald-900/20 dark:to-teal-900/20 rounded-2xl p-6 border border-green-200/50 dark:border-green-700/50 shadow-lg">
                    <div className="flex items-center gap-3 mb-4">
                      <div className="w-8 h-8 rounded-full bg-gradient-to-r from-green-500 to-emerald-500 flex items-center justify-center">
                        <DollarSign className="w-4 h-4 text-white" />
                      </div>
                      <div className="text-left">
                        <p className="text-sm font-medium">Gunnar, 62</p>
                        <p className="text-xs text-muted-foreground">Utdelningsfokus</p>
                      </div>
                    </div>
                    <div className="bg-white dark:bg-gray-800 rounded-lg p-3 text-left text-xs shadow-sm mb-3">
                      "Jag vill ha regelbunden inkomst från utdelningar. Stabilitet är viktigast nu."
                    </div>
                    <div className="bg-green-50 dark:bg-green-900/20 rounded-lg p-3 text-left text-xs border border-green-200 dark:border-green-800">
                      "Klart! Utdelningsaktier och REITs med 4-6% direktavkastning. Månatlig inkomst!"
                    </div>
                  </div>

                </div>
              </div>

              <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-12">
                <Button asChild size="lg" className="bg-gradient-to-r from-emerald-500 to-blue-600 hover:from-emerald-600 hover:to-blue-700 text-white font-medium shadow-lg hover:shadow-xl transition-all duration-200">
                  <Link to="/auth">
                    <UserPlus className="w-5 h-5 mr-2" />
                    Kom igång gratis
                  </Link>
                </Button>
                <Button asChild variant="outline" size="lg" className="border-emerald-500 text-emerald-700 hover:bg-emerald-50 hover:text-emerald-800 shadow-md hover:shadow-lg transition-all duration-200">
                  <Link to="/ai-chat">
                    <MessageCircle className="w-5 h-5 mr-2" />
                    Se hur det fungerar
                  </Link>
                </Button>
              </div>

              {/* How it works - with storytelling */}
              <div className="max-w-4xl mx-auto mb-16">
                <h2 className="text-2xl font-bold text-center mb-3">Så här hjälper vi dig</h2>
                <p className="text-center text-muted-foreground mb-8">Tusentals svenskar har redan gjort resan - nu är det din tur</p>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                  <div className="text-center group">
                    <div className="w-16 h-16 rounded-full bg-gradient-to-r from-blue-100 to-indigo-100 dark:from-blue-900/20 dark:to-indigo-900/20 flex items-center justify-center mx-auto mb-4 group-hover:scale-110 transition-transform duration-300">
                      <Coffee className="w-8 h-8 text-blue-600" />
                    </div>
                    <h3 className="font-semibold mb-2">1. Vi lär känna dig</h3>
                    <p className="text-muted-foreground text-sm">Som att prata med en vän över kaffe - berätta om dina drömmar och oro</p>
                  </div>
                  <div className="text-center group">
                    <div className="w-16 h-16 rounded-full bg-gradient-to-r from-emerald-100 to-green-100 dark:from-emerald-900/20 dark:to-green-900/20 flex items-center justify-center mx-auto mb-4 group-hover:scale-110 transition-transform duration-300">
                      <HandHeart className="w-8 h-8 text-emerald-600" />
                    </div>
                    <h3 className="font-semibold mb-2">2. Vi skapar din trygghet</h3>
                    <p className="text-muted-foreground text-sm">En portfölj byggd med omsorg, anpassad efter just din livssituation</p>
                  </div>
                  <div className="text-center group">
                    <div className="w-16 h-16 rounded-full bg-gradient-to-r from-purple-100 to-pink-100 dark:from-purple-900/20 dark:to-pink-900/20 flex items-center justify-center mx-auto mb-4 group-hover:scale-110 transition-transform duration-300">
                      <Clock className="w-8 h-8 text-purple-600" />
                    </div>
                    <h3 className="font-semibold mb-2">3. Vi följs åt framåt</h3>
                    <p className="text-muted-foreground text-sm">Din personliga guide genom livets alla förändringar</p>
                  </div>
                </div>
              </div>


              {/* Personal final CTA */}
              <div className="text-center">
                <h3 className="text-xl font-semibold mb-4">Din finansiella trygghet väntar på dig</h3>
                <Button asChild size="lg" className="bg-gradient-to-r from-emerald-500 to-blue-600 hover:from-emerald-600 hover:to-blue-700 text-white font-medium shadow-lg hover:shadow-xl transition-all duration-200">
                  <Link to="/auth">
                    <HandHeart className="w-5 h-5 mr-2" />
                    Ta första steget idag
                  </Link>
                </Button>
              </div>
            </div>}

          {/* Clean Dashboard for logged-in users */}
          {user && hasPortfolio && (
            <div className="min-h-screen bg-background">
              <div className="container mx-auto px-4 py-6 max-w-6xl">
                {/* Clean Header */}
                <div className="flex items-center justify-between mb-8">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-xl bg-primary flex items-center justify-center">
                      <TrendingUp className="w-6 h-6 text-primary-foreground" />
                    </div>
                    <div>
                      <h1 className="text-2xl font-semibold text-foreground">
                        Hej, {user.user_metadata?.first_name || 'there'}!
                      </h1>
                      <p className="text-muted-foreground">
                        Här är din investeringsöversikt för idag
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
                              <div 
                                className="bg-primary rounded-full h-2 transition-all duration-700 ease-out"
                                style={{ width: `${progressData.percentage}%` }}
                              />
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
                <div className="mb-8">
                  {insightsLoading ? (
                    <div className="bg-card border rounded-xl p-6">
                      <div className="flex items-start gap-4">
                        <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                          <Brain className="w-5 h-5 text-primary animate-pulse" />
                        </div>
                        <div className="flex-1">
                          <div className="h-4 bg-muted rounded mb-3 animate-pulse"></div>
                          <div className="h-3 bg-muted rounded w-3/4 animate-pulse"></div>
                        </div>
                      </div>
                    </div>
                  ) : insights.length > 0 ? (
                    <div className="space-y-4">
                      {insights.map((insight, index) => (
                        <div key={index} className="bg-card border rounded-xl p-6 hover:shadow-md transition-shadow">
                          <div className="flex items-start gap-4">
                            <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                              <Brain className="w-5 h-5 text-primary" />
                            </div>
                            <div className="flex-1">
                              <div className="flex items-center justify-between mb-2">
                                <p className="font-medium text-foreground">AI-insikt för dig</p>
                                <Badge variant="secondary" className="text-xs">
                                  {insight.confidence > 0.8 ? 'Hög tillförlitlighet' : 'Medel tillförlitlighet'}
                                </Badge>
                              </div>
                              <p className="text-muted-foreground mb-3">
                                {insight.message}
                              </p>
                              <Button asChild size="sm" variant="ghost" className="p-0 h-auto text-primary hover:text-primary/80">
                                <Link to="/ai-chat">
                                  Diskutera med AI →
                                </Link>
                              </Button>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="bg-card border rounded-xl p-6">
                      <div className="flex items-start gap-4">
                        <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                          <Brain className="w-5 h-5 text-primary" />
                        </div>
                        <div className="flex-1">
                          <p className="font-medium text-foreground mb-1">AI-analys pågår...</p>
                          <p className="text-muted-foreground">
                            Analyserar din portfölj för personliga insikter.
                          </p>
                        </div>
                      </div>
                    </div>
                  )}
                </div>

                {/* Portfolio Overview Cards */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                  <div className="bg-card border rounded-xl p-6 hover:shadow-md transition-shadow">
                    <div className="flex items-center gap-3 mb-4">
                      <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center">
                        <Star className="w-4 h-4 text-primary" />
                      </div>
                      <span className="font-medium text-foreground">Totalt sparande</span>
                    </div>
                    <p className="text-3xl font-bold text-primary mb-2">
                      {totalPortfolioValue.toLocaleString('sv-SE')} kr
                    </p>
                    <p className="text-sm text-green-600 font-medium">↗ På väg mot dina mål</p>
                  </div>

                  <div className="bg-card border rounded-xl p-6 hover:shadow-md transition-shadow">
                    <div className="flex items-center gap-3 mb-4">
                      <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center">
                        <BarChart3 className="w-4 h-4 text-primary" />
                      </div>
                      <span className="font-medium text-foreground">Innehav</span>
                    </div>
                    <p className="text-3xl font-bold text-primary mb-2">
                      {actualHoldings?.length || 0}
                    </p>
                    <p className="text-sm text-muted-foreground">Välbalanserad spridning</p>
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
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
                  <Button asChild variant="outline" className="h-auto p-4 hover:bg-muted/50 border-border">
                    <Link to="/ai-chat" className="flex flex-col items-center gap-2 text-center">
                      <MessageSquare className="w-6 h-6 text-primary" />
                      <span className="font-medium">AI Chat</span>
                      <span className="text-xs text-muted-foreground">Få investeringsråd</span>
                    </Link>
                  </Button>

                  <Button asChild variant="outline" className="h-auto p-4 hover:bg-muted/50 border-border">
                    <Link to="/market-analyses" className="flex flex-col items-center gap-2 text-center">
                      <TrendingUp className="w-6 h-6 text-primary" />
                      <span className="font-medium">Marknadsanalyser</span>
                      <span className="text-xs text-muted-foreground">Senaste insikter</span>
                    </Link>
                  </Button>

                  <Button asChild variant="outline" className="h-auto p-4 hover:bg-muted/50 border-border">
                    <Link to="/stock-cases" className="flex flex-col items-center gap-2 text-center">
                      <Building2 className="w-6 h-6 text-primary" />
                      <span className="font-medium">Stock Cases</span>
                      <span className="text-xs text-muted-foreground">Utforska företag</span>
                    </Link>
                  </Button>

                  <Button asChild variant="outline" className="h-auto p-4 hover:bg-muted/50 border-border">
                    <Link to="/portfolio-advisor" className="flex flex-col items-center gap-2 text-center">
                      <Settings className="w-6 h-6 text-primary" />
                      <span className="font-medium">Portföljrådgivare</span>
                      <span className="text-xs text-muted-foreground">Optimera din portfölj</span>
                    </Link>
                  </Button>
                </div>
              </div>
            </div>
          )}

          {/* Enhanced personal welcome for users without portfolio */}
          {user && !hasPortfolio && !loading && <div className="mb-16">
              <Card className="bg-gradient-to-r from-slate-50 to-indigo-50 dark:from-slate-800 dark:to-indigo-900/20 border-slate-200 dark:border-slate-700 shadow-lg">
                <div className="p-8 text-center">
                  <div className="w-20 h-20 rounded-full bg-gradient-to-r from-emerald-500 to-blue-600 flex items-center justify-center mx-auto mb-6">
                    <HandHeart className="w-10 h-10 text-white" />
                  </div>
                  <h3 className="font-semibold text-2xl mb-3">Välkommen hem! 🏠</h3>
                  <p className="text-muted-foreground mb-8 text-lg leading-relaxed max-w-2xl mx-auto">
                    Nu ska vi lära känna varandra ordentligt. Tänk på mig som din personliga guide som hjälper dig 
                    bygga den ekonomiska trygghet du drömmer om. Vi tar det i din takt, steg för steg.
                  </p>
                  
                  {/* Personal journey section */}
                  <div className="bg-white/60 dark:bg-gray-800/60 rounded-xl p-6 mb-8 border border-slate-200 dark:border-slate-700">
                    <h4 className="font-semibold mb-4 flex items-center justify-center gap-2">
                      <MapPin className="w-5 h-5 text-emerald-600" />
                      Din personliga resa börjar här
                    </h4>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-sm">
                      <div className="flex items-center gap-2 bg-emerald-50 dark:bg-emerald-900/10 p-3 rounded-lg">
                        <Coffee className="w-4 h-4 text-emerald-600" />
                        <span className="font-medium">Berätta om dig</span>
                      </div>
                      <div className="flex items-center gap-2 bg-blue-50 dark:bg-blue-900/10 p-3 rounded-lg">
                        <HandHeart className="w-4 h-4 text-blue-600" />
                        <span className="font-medium">Vi skapar trygghet</span>
                      </div>
                      <div className="flex items-center gap-2 bg-purple-50 dark:bg-purple-900/10 p-3 rounded-lg">
                        <Clock className="w-4 h-4 text-purple-600" />
                        <span className="font-medium">Vi följs åt framåt</span>
                      </div>
                    </div>
                  </div>

                  <div className="flex flex-col sm:flex-row gap-4 justify-center">
                    <Button asChild size="lg" className="bg-gradient-to-r from-emerald-500 to-blue-600 hover:from-emerald-600 hover:to-blue-700 text-white">
                      <Link to="/portfolio-advisor">
                        <Coffee className="w-5 h-5 mr-2" />
                        Låt oss lära känna varandra
                      </Link>
                    </Button>
                    <Button asChild variant="outline" size="lg" className="border-emerald-500 text-emerald-700 hover:bg-emerald-50 hover:text-emerald-800">
                      <Link to="/ai-chat">
                        <HandHeart className="w-5 h-5 mr-2" />
                        Bara prata först
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