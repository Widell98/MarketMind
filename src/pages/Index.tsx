import React from 'react';
import Layout from '@/components/Layout';
import IntelligentRouting from '@/components/IntelligentRouting';
import CompactLatestCases from '@/components/CompactLatestCases';
import { Brain, UserPlus, BarChart3, Users, ArrowUpRight, TrendingUp, Wallet, Shield, MessageCircle, CheckCircle, Star, Heart, Target } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Link } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { usePortfolio } from '@/hooks/usePortfolio';
import { usePortfolioPerformance } from '@/hooks/usePortfolioPerformance';
import { useCashHoldings } from '@/hooks/useCashHoldings';
import { useUserHoldings } from '@/hooks/useUserHoldings';
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
  const hasPortfolio = !loading && !!activePortfolio;
  const totalPortfolioValue = performance.totalPortfolioValue + totalCash;
  return <Layout>
      <div className="min-h-screen bg-gradient-to-br from-background via-background to-primary/5">
        <div className="container mx-auto px-4 py-8 max-w-6xl">
          
          {/* Hero Section - Only show for non-logged in users */}
          {!user && <div className="text-center mb-16">
              <div className="mb-8">
                <div className="inline-flex items-center gap-2 bg-primary/10 text-primary px-4 py-2 rounded-full text-sm font-medium mb-6">
                  <Heart className="w-4 h-4" />
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

              {/* Visual element */}
              <div className="mb-10 relative">
                <div className="bg-gradient-to-r from-primary/10 via-blue-50 to-purple-50 dark:from-primary/20 dark:via-blue-950/20 dark:to-purple-950/20 rounded-2xl p-8 max-w-md mx-auto border border-primary/20">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="w-10 h-10 rounded-full bg-primary flex items-center justify-center">
                      <MessageCircle className="w-5 h-5 text-primary-foreground" />
                    </div>
                    <div className="text-left">
                      <p className="text-sm font-medium">Du</p>
                      <p className="text-xs text-muted-foreground">Just nu</p>
                    </div>
                  </div>
                  <div className="bg-white dark:bg-gray-800 rounded-lg p-3 text-left text-sm">
                    "Hjälp mig bygga en portfölj för 100 000 kr med låg risk"
                  </div>
                  
                  <div className="flex items-center gap-3 mt-4 mb-2">
                    <div className="w-10 h-10 rounded-full bg-gradient-to-r from-purple-500 to-blue-500 flex items-center justify-center">
                      <Brain className="w-5 h-5 text-white" />
                    </div>
                    <div className="text-left">
                      <p className="text-sm font-medium">AI-Rådgivaren</p>
                      <p className="text-xs text-muted-foreground">Svarar direkt</p>
                    </div>
                  </div>
                  <div className="bg-primary/10 rounded-lg p-3 text-left text-sm">
                    "Perfekt! Låt mig föreslå en balanserad portfölj med 60% aktier och 40% räntor..."
                  </div>
                </div>
              </div>

              <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-12">
                <Button asChild size="lg" className="bg-gradient-to-r from-primary to-blue-600 hover:from-primary/90 hover:to-blue-600/90 text-white font-medium shadow-lg hover:shadow-xl transition-all duration-200">
                  <Link to="/auth">
                    <UserPlus className="w-5 h-5 mr-2" />
                    Kom igång gratis
                  </Link>
                </Button>
                <Button asChild variant="outline" size="lg" className="border-primary text-primary hover:bg-primary hover:text-primary-foreground shadow-md hover:shadow-lg transition-all duration-200">
                  <Link to="/ai-chat">
                    <Brain className="w-5 h-5 mr-2" />
                    Se hur det fungerar
                  </Link>
                </Button>
              </div>

              {/* How it works section */}
              <div className="max-w-4xl mx-auto mb-16">
                <h2 className="text-2xl font-bold text-center mb-8">Så här fungerar det</h2>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                  <div className="text-center">
                    <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-4">
                      <Target className="w-8 h-8 text-primary" />
                    </div>
                    <h3 className="font-semibold mb-2">1. Berätta om dina mål</h3>
                    <p className="text-muted-foreground text-sm">Dela din risknivå, tidshorizont och vad du vill uppnå</p>
                  </div>
                  <div className="text-center">
                    <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-4">
                      <BarChart3 className="w-8 h-8 text-primary" />
                    </div>
                    <h3 className="font-semibold mb-2">2. AI bygger din portfölj</h3>
                    <p className="text-muted-foreground text-sm">Få en skräddarsydd portfölj anpassad efter dina behov</p>
                  </div>
                  <div className="text-center">
                    <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-4">
                      <MessageCircle className="w-8 h-8 text-primary" />
                    </div>
                    <h3 className="font-semibold mb-2">3. Bolla löpande med rådgivaren</h3>
                    <p className="text-muted-foreground text-sm">Alltid tillgänglig för frågor och justeringar</p>
                  </div>
                </div>
              </div>

              {/* Trust section */}
              <div className="bg-gradient-to-r from-primary/5 to-blue-50 dark:from-primary/10 dark:to-blue-950/20 rounded-2xl p-8 mb-16 border border-primary/20">
                <h2 className="text-2xl font-bold text-center mb-2">Byggt för vanliga sparare</h2>
                <p className="text-center text-muted-foreground mb-8">Lika smart som hedgefonderna, men för alla</p>
                
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div className="text-center">
                    <div className="w-12 h-12 rounded-full bg-green-100 dark:bg-green-900/20 flex items-center justify-center mx-auto mb-3">
                      <CheckCircle className="w-6 h-6 text-green-600" />
                    </div>
                    <h3 className="font-semibold mb-1">Alltid tillgänglig</h3>
                    <p className="text-sm text-muted-foreground">24/7 tillgång till din personliga rådgivare</p>
                  </div>
                  <div className="text-center">
                    <div className="w-12 h-12 rounded-full bg-blue-100 dark:bg-blue-900/20 flex items-center justify-center mx-auto mb-3">
                      <MessageCircle className="w-6 h-6 text-blue-600" />
                    </div>
                    <h3 className="font-semibold mb-1">Ingen krånglig finansjargong</h3>
                    <p className="text-sm text-muted-foreground">Enkla förklaringar på ren svenska</p>
                  </div>
                  <div className="text-center">
                    <div className="w-12 h-12 rounded-full bg-purple-100 dark:bg-purple-900/20 flex items-center justify-center mx-auto mb-3">
                      <Heart className="w-6 h-6 text-purple-600" />
                    </div>
                    <h3 className="font-semibold mb-1">Anpassat för dig</h3>
                    <p className="text-sm text-muted-foreground">Personliga råd baserat på din situation</p>
                  </div>
                </div>
              </div>

              {/* Final CTA */}
              <div className="text-center">
                <h3 className="text-xl font-semibold mb-4">Börja chatta med din rådgivare idag</h3>
                <Button asChild size="lg" className="bg-gradient-to-r from-primary to-blue-600 hover:from-primary/90 hover:to-blue-600/90 text-white font-medium shadow-lg hover:shadow-xl transition-all duration-200">
                  <Link to="/auth">
                    <ArrowUpRight className="w-5 h-5 mr-2" />
                    Kom igång nu
                  </Link>
                </Button>
              </div>
            </div>}

          {/* Enhanced Portfolio Dashboard for logged-in users */}
          {user && hasPortfolio && <div className="mb-16">
              <Card className="bg-gradient-to-r from-primary/5 to-blue-50 dark:from-primary/10 dark:to-blue-950/20 border-primary/20 shadow-lg">
                <div className="p-6">
                  {/* Personal Welcome */}
                  <div className="flex items-center justify-between mb-6">
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 rounded-xl bg-gradient-to-r from-primary to-blue-600 flex items-center justify-center">
                        <Heart className="w-6 h-6 text-primary-foreground" />
                      </div>
                      <div>
                        <h3 className="font-semibold text-xl">Välkommen tillbaka! 👋</h3>
                        <p className="text-sm text-muted-foreground">Din portfölj utvecklas fint</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="w-2 h-2 rounded-full bg-green-500"></div>
                      <span className="text-sm font-medium text-green-700">Allt ser bra ut</span>
                    </div>
                  </div>

                  {/* AI Insight */}
                  <div className="bg-white/60 dark:bg-gray-800/60 rounded-lg p-4 mb-6 border border-primary/20">
                    <div className="flex items-start gap-3">
                      <div className="w-8 h-8 rounded-full bg-gradient-to-r from-purple-500 to-blue-500 flex items-center justify-center flex-shrink-0">
                        <Brain className="w-4 h-4 text-white" />
                      </div>
                      <div>
                        <p className="text-sm font-medium mb-1">AI-insikt för dig:</p>
                        <p className="text-sm text-muted-foreground">
                          Din portfölj har god balans. Överväg att öka exponeringen mot tech-sektorn med 5-10% för bättre långsiktig tillväxt.
                        </p>
                        <Button size="sm" variant="ghost" className="mt-2 p-0 h-auto text-primary hover:text-primary/80">
                          Diskutera med AI →
                        </Button>
                      </div>
                    </div>
                  </div>

                  {/* Portfolio Progress with emotional connection */}
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                    <div className="bg-white/60 dark:bg-gray-800/60 rounded-lg p-4 border border-primary/20 relative overflow-hidden">
                      <div className="absolute top-0 right-0 w-16 h-16 bg-gradient-to-br from-blue-500/20 to-transparent rounded-bl-full"></div>
                      <div className="flex items-center gap-2 mb-2">
                        <Star className="w-4 h-4 text-blue-600" />
                        <span className="text-sm font-medium">Ditt sparande</span>
                      </div>
                      <p className="text-2xl font-bold text-blue-600 mb-1">
                        {totalPortfolioValue.toLocaleString('sv-SE')} kr
                      </p>
                      <p className="text-xs text-green-600 font-medium">↗ På rätt väg mot dina mål</p>
                    </div>

                    <div className="bg-white/60 dark:bg-gray-800/60 rounded-lg p-4 border border-primary/20 relative overflow-hidden">
                      <div className="absolute top-0 right-0 w-16 h-16 bg-gradient-to-br from-purple-500/20 to-transparent rounded-bl-full"></div>
                      <div className="flex items-center gap-2 mb-2">
                        <BarChart3 className="w-4 h-4 text-purple-600" />
                        <span className="text-sm font-medium">Dina innehav</span>
                      </div>
                      <p className="text-2xl font-bold text-purple-600 mb-1">
                        {actualHoldings?.length || 0}
                      </p>
                      <p className="text-xs text-muted-foreground">Välbalanserad spridning</p>
                    </div>

                    <div className="bg-white/60 dark:bg-gray-800/60 rounded-lg p-4 border border-primary/20 relative overflow-hidden">
                      <div className="absolute top-0 right-0 w-16 h-16 bg-gradient-to-br from-green-500/20 to-transparent rounded-bl-full"></div>
                      <div className="flex items-center gap-2 mb-2">
                        <Wallet className="w-4 h-4 text-green-600" />
                        <span className="text-sm font-medium">Redo att investera</span>
                      </div>
                      <p className="text-2xl font-bold text-green-600 mb-1">
                        {totalCash.toLocaleString('sv-SE')} kr
                      </p>
                      <p className="text-xs text-muted-foreground">Flexibilitet för nya möjligheter</p>
                    </div>
                  </div>

                  {/* Quick Actions */}
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
                    <Button asChild variant="outline" size="sm" className="h-auto p-3 flex flex-col gap-1">
                      <Link to="/portfolio-implementation">
                        <BarChart3 className="w-4 h-4" />
                        <span className="text-xs">Översikt</span>
                      </Link>
                    </Button>
                    
                    <Button asChild variant="outline" size="sm" className="h-auto p-3 flex flex-col gap-1">
                      <Link to="/ai-chat">
                        <Brain className="w-4 h-4" />
                        <span className="text-xs">AI-Råd</span>
                      </Link>
                    </Button>
                    
                    <Button asChild variant="outline" size="sm" className="h-auto p-3 flex flex-col gap-1">
                      <Link to="/stock-cases">
                        <Users className="w-4 h-4" />
                        <span className="text-xs">Upptäck</span>
                      </Link>
                    </Button>
                    
                    <Button asChild variant="outline" size="sm" className="h-auto p-3 flex flex-col gap-1">
                      <Link to="/market-analyses">
                        <TrendingUp className="w-4 h-4" />
                        <span className="text-xs">Analyser</span>
                      </Link>
                    </Button>
                  </div>

                  {/* Conversational Action Buttons */}
                  <div className="flex flex-col sm:flex-row gap-3">
                    <Button asChild className="flex-1 bg-gradient-to-r from-primary to-blue-600 hover:from-primary/90 hover:to-blue-600/90">
                      <Link to="/portfolio-implementation">
                        Titta på min portfölj
                        <ArrowUpRight className="w-4 h-4 ml-2" />
                      </Link>
                    </Button>
                    <Button asChild variant="outline" className="flex-1 border-primary text-primary hover:bg-primary hover:text-primary-foreground">
                      <Link to="/ai-chat">
                        Prata med min rådgivare
                        <MessageCircle className="w-4 h-4 ml-2" />
                      </Link>
                    </Button>
                  </div>
                </div>
              </Card>
            </div>}

          {/* Personal welcome for logged-in users without portfolio */}
          {user && !hasPortfolio && !loading && <div className="mb-16">
              <Card className="bg-gradient-to-r from-primary/5 to-purple-50 dark:from-primary/10 dark:to-purple-950/20 border-primary/20 shadow-lg">
                <div className="p-8 text-center">
                  <div className="w-20 h-20 rounded-full bg-gradient-to-r from-primary to-purple-600 flex items-center justify-center mx-auto mb-6">
                    <Heart className="w-10 h-10 text-white" />
                  </div>
                  <h3 className="font-semibold text-2xl mb-3">Hej där! Kul att du är här 👋</h3>
                  <p className="text-muted-foreground mb-8 text-lg leading-relaxed max-w-2xl mx-auto">
                    Låt oss lära känna dig och bygga en portfölj som passar just din situation. 
                    Jag finns här för att hjälpa dig varje steg på vägen.
                  </p>
                  
                  {/* Getting to know you section */}
                  <div className="bg-white/60 dark:bg-gray-800/60 rounded-xl p-6 mb-8 border border-primary/20">
                    <h4 className="font-semibold mb-4">Så här kommer vi igång:</h4>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-sm">
                      <div className="flex items-center gap-2">
                        <CheckCircle className="w-4 h-4 text-green-600" />
                        <span>Berätta om dina mål</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <CheckCircle className="w-4 h-4 text-green-600" />
                        <span>Hitta din risknivå</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <CheckCircle className="w-4 h-4 text-green-600" />
                        <span>Bygg din portfölj</span>
                      </div>
                    </div>
                  </div>

                  <div className="flex flex-col sm:flex-row gap-4 justify-center">
                    <Button asChild size="lg" className="bg-gradient-to-r from-primary to-purple-600 hover:from-primary/90 hover:to-purple-600/90 text-white">
                      <Link to="/portfolio-advisor">
                        <Target className="w-5 h-5 mr-2" />
                        Låt oss lära känna dig
                      </Link>
                    </Button>
                    <Button asChild variant="outline" size="lg" className="border-primary text-primary hover:bg-primary hover:text-primary-foreground">
                      <Link to="/ai-chat">
                        <MessageCircle className="w-5 h-5 mr-2" />
                        Prata med rådgivaren först
                      </Link>
                    </Button>
                  </div>
                </div>
              </Card>
            </div>}

          {/* Main Action Cards - Only 3 focused cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-16">
            
            {/* Portfolio Management */}
            <Card className="bg-card border shadow-lg hover:shadow-xl transition-all duration-300 group cursor-pointer">
              <Link to={user ? hasPortfolio ? "/portfolio-implementation" : "/portfolio-advisor" : "/auth"} className="block p-8">
                <div className="flex items-center gap-4 mb-6">
                  <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
                    <BarChart3 className="w-8 h-8 text-white" />
                  </div>
                  <div>
                    <h3 className="text-xl font-bold text-foreground">
                      {user && hasPortfolio ? "Min Portfölj" : "Skapa Portfölj"}
                    </h3>
                    <Badge variant="secondary" className="mt-1">
                      {user && hasPortfolio ? "Aktiv" : "Ny"}
                    </Badge>
                  </div>
                </div>
                <p className="text-muted-foreground leading-relaxed mb-4">
                  {user && hasPortfolio ? "Analysera prestanda, optimera allokering och få AI-drivna insikter om din portfölj." : "Låt AI hjälpa dig bygga en diversifierad portfölj baserad på din riskprofil och mål."}
                </p>
                <div className="flex items-center text-primary font-medium group-hover:gap-3 transition-all duration-200">
                  {user && hasPortfolio ? "Analysera portfölj" : "Skapa portfölj"}
                  <ArrowUpRight className="w-4 h-4 ml-2 group-hover:translate-x-1 group-hover:-translate-y-1 transition-transform duration-200" />
                </div>
              </Link>
            </Card>

            {/* AI Advisor */}
            <Card className="bg-card border shadow-lg hover:shadow-xl transition-all duration-300 group cursor-pointer">
              <Link to="/ai-chat" className="block p-8">
                <div className="flex items-center gap-4 mb-6">
                  <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-purple-500 to-purple-600 flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
                    <Brain className="w-8 h-8 text-white" />
                  </div>
                  <div>
                    <h3 className="text-xl font-bold text-foreground">AI-Rådgivare</h3>
                    <Badge variant="secondary" className="mt-1">
                      Personlig
                    </Badge>
                  </div>
                </div>
                <p className="text-muted-foreground leading-relaxed mb-4">
                  Få personliga investeringsråd, riskanalys och marknadsinsikter från vår AI-assistent.
                </p>
                <div className="flex items-center text-primary font-medium group-hover:gap-3 transition-all duration-200">
                  Prata med AI
                  <ArrowUpRight className="w-4 h-4 ml-2 group-hover:translate-x-1 group-hover:-translate-y-1 transition-transform duration-200" />
                </div>
              </Link>
            </Card>

            {/* Community */}
            <Card className="bg-card border shadow-lg hover:shadow-xl transition-all duration-300 group cursor-pointer">
              <Link to="/stock-cases" className="block p-8">
                <div className="flex items-center gap-4 mb-6">
                  <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-green-500 to-green-600 flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
                    <Users className="w-8 h-8 text-white" />
                  </div>
                  <div>
                    <h3 className="text-xl font-bold text-foreground">Community</h3>
                    <Badge variant="secondary" className="mt-1">
                      Upptäck
                    </Badge>
                  </div>
                </div>
                <p className="text-muted-foreground leading-relaxed mb-4">
                  Upptäck investeringsmöjligheter, följ andra investerare och dela dina egna analyser.
                </p>
                <div className="flex items-center text-primary font-medium group-hover:gap-3 transition-all duration-200">
                  Utforska community
                  <ArrowUpRight className="w-4 h-4 ml-2 group-hover:translate-x-1 group-hover:-translate-y-1 transition-transform duration-200" />
                </div>
              </Link>
            </Card>
          </div>

          {/* Latest Cases - Simplified */}
          <div className="mb-16">
            <CompactLatestCases />
          </div>

          {/* Smart Navigation */}
          <div className="mb-16">
            <IntelligentRouting />
          </div>

        </div>
      </div>
    </Layout>;
};
export default Index;