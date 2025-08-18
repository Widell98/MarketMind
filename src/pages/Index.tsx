import React from 'react';
import Layout from '@/components/Layout';
import IntelligentRouting from '@/components/IntelligentRouting';
import CompactLatestCases from '@/components/CompactLatestCases';
import { Brain, UserPlus, BarChart3, Users, ArrowUpRight, TrendingUp, Wallet, MessageCircle, Shield, Clock, CheckCircle } from 'lucide-react';
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
          {!user && <div className="mb-16">
              {/* Hero Section */}
              <div className="text-center mb-16">
                <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-foreground mb-6">
                  Din personliga finansiella rådgivare
                  <span className="block text-primary mt-2">– alltid vid din sida</span>
                </h1>
                <p className="text-lg sm:text-xl text-muted-foreground leading-relaxed mb-10 max-w-3xl mx-auto">
                  Optimera din portfölj, förstå marknaden och få stöd i osäkra tider. Enkelt, tryggt, smart.
                </p>
                <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
                  <Button asChild size="lg" className="bg-gradient-to-r from-primary to-blue-600 hover:from-primary/90 hover:to-blue-600/90 text-white font-medium shadow-lg hover:shadow-xl transition-all duration-200">
                    <Link to="/auth">
                      <MessageCircle className="w-5 h-5 mr-2" />
                      Kom igång gratis
                    </Link>
                  </Button>
                  <Button asChild variant="outline" size="lg" className="border-primary text-primary hover:bg-primary hover:text-primary-foreground shadow-md hover:shadow-lg transition-all duration-200">
                    <Link to="#how-it-works">
                      <Brain className="w-5 h-5 mr-2" />
                      Se hur det fungerar
                    </Link>
                  </Button>
                </div>
              </div>

              {/* Visualisering */}
              <div className="mb-16 text-center">
                <Card className="max-w-md mx-auto bg-gradient-to-br from-primary/5 to-blue-50 dark:from-primary/10 dark:to-blue-950/20 border-primary/20 shadow-lg">
                  <div className="p-8">
                    <div className="w-20 h-20 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-4">
                      <MessageCircle className="w-10 h-10 text-primary" />
                    </div>
                    <h3 className="font-semibold text-lg mb-2">Bolla idéer direkt med AI</h3>
                    <p className="text-sm text-muted-foreground">
                      "Borde jag sälja mina techaktier nu?" 
                      <br />
                      "Vilken risk tar jag egentligen?"
                    </p>
                  </div>
                </Card>
              </div>

              {/* Hur det funkar (3 steg) */}
              <div id="how-it-works" className="mb-16">
                <h2 className="text-3xl font-bold text-center mb-12">Så här funkar det</h2>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                  <div className="text-center">
                    <div className="w-16 h-16 rounded-full bg-primary text-primary-foreground flex items-center justify-center mx-auto mb-4 text-xl font-bold">
                      1
                    </div>
                    <h3 className="font-semibold text-lg mb-2">Berätta om dina mål</h3>
                    <p className="text-muted-foreground">
                      Dela din risknivå, tidshorisont och vad du vill uppnå med dina investeringar.
                    </p>
                  </div>
                  <div className="text-center">
                    <div className="w-16 h-16 rounded-full bg-primary text-primary-foreground flex items-center justify-center mx-auto mb-4 text-xl font-bold">
                      2
                    </div>
                    <h3 className="font-semibold text-lg mb-2">AI bygger din portfölj</h3>
                    <p className="text-muted-foreground">
                      Få en skräddarsydd portfölj baserad på dina preferenser och marknadens möjligheter.
                    </p>
                  </div>
                  <div className="text-center">
                    <div className="w-16 h-16 rounded-full bg-primary text-primary-foreground flex items-center justify-center mx-auto mb-4 text-xl font-bold">
                      3
                    </div>
                    <h3 className="font-semibold text-lg mb-2">Bolla löpande med rådgivaren</h3>
                    <p className="text-muted-foreground">
                      Ställ frågor när som helst. Få råd om när du ska köpa, sälja eller bara vara lugn.
                    </p>
                  </div>
                </div>
              </div>

              {/* Förtroendesektion */}
              <div className="mb-16">
                <Card className="bg-gradient-to-r from-green-50 to-blue-50 dark:from-green-950/20 dark:to-blue-950/20 border-green-200 dark:border-green-800">
                  <div className="p-8 text-center">
                    <h2 className="text-2xl font-bold mb-4">
                      Byggt för vanliga sparare
                    </h2>
                    <p className="text-lg text-muted-foreground mb-8">
                      Lika smart som hedgefonderna, men för alla.
                    </p>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                      <div className="flex flex-col items-center">
                        <Clock className="w-12 h-12 text-green-600 mb-3" />
                        <h3 className="font-semibold mb-2">Alltid tillgänglig</h3>
                        <p className="text-sm text-muted-foreground">
                          24/7 tillgång till din personliga finansiella rådgivare
                        </p>
                      </div>
                      <div className="flex flex-col items-center">
                        <MessageCircle className="w-12 h-12 text-blue-600 mb-3" />
                        <h3 className="font-semibold mb-2">Ingen krånglig jargong</h3>
                        <p className="text-sm text-muted-foreground">
                          Enkla svar på svenska utan komplicerade finanstermer
                        </p>
                      </div>
                      <div className="flex flex-col items-center">
                        <CheckCircle className="w-12 h-12 text-purple-600 mb-3" />
                        <h3 className="font-semibold mb-2">Anpassat för dig</h3>
                        <p className="text-sm text-muted-foreground">
                          Råd som passar just din situation och dina mål
                        </p>
                      </div>
                    </div>
                  </div>
                </Card>
              </div>

              {/* Call to Action igen i botten */}
              <div className="text-center">
                <Card className="bg-gradient-to-r from-primary/5 to-blue-50 dark:from-primary/10 dark:to-blue-950/20 border-primary/20">
                  <div className="p-8">
                    <h2 className="text-2xl font-bold mb-4">
                      Redo att börja?
                    </h2>
                    <p className="text-muted-foreground mb-6">
                      Börja chatta med din rådgivare idag och få personliga råd direkt.
                    </p>
                    <Button asChild size="lg" className="bg-gradient-to-r from-primary to-blue-600 hover:from-primary/90 hover:to-blue-600/90 text-white font-medium shadow-lg hover:shadow-xl transition-all duration-200">
                      <Link to="/auth">
                        <MessageCircle className="w-5 h-5 mr-2" />
                        Börja chatta med din rådgivare →
                      </Link>
                    </Button>
                  </div>
                </Card>
              </div>
            </div>}

          {/* Enhanced Portfolio Dashboard for logged-in users */}
          {user && hasPortfolio && <div className="mb-16">
              <Card className="bg-gradient-to-r from-primary/5 to-blue-50 dark:from-primary/10 dark:to-blue-950/20 border-primary/20 shadow-lg">
                <div className="p-6">
                  {/* Portfolio Header */}
                  <div className="flex items-center justify-between mb-6">
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 rounded-xl bg-primary flex items-center justify-center">
                        <BarChart3 className="w-6 h-6 text-primary-foreground" />
                      </div>
                      <div>
                        <h3 className="font-semibold text-xl">Din Portfölj</h3>
                        
                      </div>
                    </div>
                    <Badge className="bg-green-100 text-green-700 border-green-200 px-3 py-1">
                      Aktiv
                    </Badge>
                  </div>

                  {/* Portfolio Metrics Grid */}
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                    <div className="bg-white/50 dark:bg-gray-800/50 rounded-lg p-4 border border-white/20">
                      <div className="flex items-center gap-2 mb-2">
                        <BarChart3 className="w-4 h-4 text-blue-600" />
                        <span className="text-sm font-medium">Totalt värde</span>
                      </div>
                      <p className="text-lg font-bold text-blue-600">
                        {totalPortfolioValue.toLocaleString('sv-SE')} kr
                      </p>
                      <p className="text-xs text-muted-foreground">Hela portföljen</p>
                    </div>

                    <div className="bg-white/50 dark:bg-gray-800/50 rounded-lg p-4 border border-white/20">
                      <div className="flex items-center gap-2 mb-2">
                        <BarChart3 className="w-4 h-4 text-blue-600" />
                        <span className="text-sm font-medium">Innehav</span>
                      </div>
                      <p className="text-lg font-bold">
                        {actualHoldings?.length || 0}
                      </p>
                      <p className="text-xs text-muted-foreground">Aktiva positioner</p>
                    </div>

                    <div className="bg-white/50 dark:bg-gray-800/50 rounded-lg p-4 border border-white/20">
                      <div className="flex items-center gap-2 mb-2">
                        <Wallet className="w-4 h-4 text-green-600" />
                        <span className="text-sm font-medium">Kassa</span>
                      </div>
                      <p className="text-lg font-bold">
                        {totalCash.toLocaleString('sv-SE')} kr
                      </p>
                      <p className="text-xs text-muted-foreground">Tillgängligt</p>
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

                  {/* Main Action Buttons */}
                  <div className="flex flex-col sm:flex-row gap-3">
                    <Button asChild className="flex-1">
                      <Link to="/portfolio-implementation">
                        Hantera portfölj
                        <ArrowUpRight className="w-4 h-4 ml-2" />
                      </Link>
                    </Button>
                    <Button asChild variant="outline" className="flex-1">
                      <Link to="/ai-chat">
                        Diskutera med AI
                        <Brain className="w-4 h-4 ml-2" />
                      </Link>
                    </Button>
                  </div>
                </div>
              </Card>
            </div>}

          {/* Welcome message for logged-in users without portfolio */}
          {user && !hasPortfolio && !loading && <div className="mb-16">
              <Card className="bg-gradient-to-r from-primary/5 to-purple-50 dark:from-primary/10 dark:to-purple-950/20 border-primary/20 shadow-lg">
                <div className="p-6 text-center">
                  <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-4">
                    <UserPlus className="w-8 h-8 text-primary" />
                  </div>
                  <h3 className="font-semibold text-xl mb-2">Välkommen tillbaka!</h3>
                  <p className="text-muted-foreground mb-6">
                    Redo att skapa din första AI-drivna portfölj? Låt oss komma igång.
                  </p>
                  <div className="flex flex-col sm:flex-row gap-3 justify-center">
                    <Button asChild size="lg">
                      <Link to="/portfolio-advisor">
                        <BarChart3 className="w-5 h-5 mr-2" />
                        Skapa portfölj
                      </Link>
                    </Button>
                    <Button asChild variant="outline" size="lg">
                      <Link to="/ai-chat">
                        <Brain className="w-5 h-5 mr-2" />
                        Prata med AI först
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