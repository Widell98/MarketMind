import React from 'react';
import Layout from '@/components/Layout';
import IntelligentRouting from '@/components/IntelligentRouting';
import CompactLatestCases from '@/components/CompactLatestCases';
import { Brain, UserPlus, BarChart3, Users, ArrowUpRight } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Link } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { usePortfolio } from '@/hooks/usePortfolio';
import { usePortfolioPerformance } from '@/hooks/usePortfolioPerformance';
import { useCashHoldings } from '@/hooks/useCashHoldings';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
const Index = () => {
  const { user } = useAuth();
  const { activePortfolio, loading } = usePortfolio();
  const { performance } = usePortfolioPerformance();
  const { totalCash } = useCashHoldings();

  const hasPortfolio = !loading && !!activePortfolio;
  const totalPortfolioValue = performance.totalPortfolioValue + totalCash;
  return (
    <Layout>
      <div className="min-h-screen bg-gradient-to-br from-background via-background to-primary/5">
        <div className="container mx-auto px-4 py-8 max-w-6xl">
          
          {/* Hero Section - Clear and focused */}
          <div className="text-center mb-16">
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-foreground mb-6">
              Investera smartare med AI
            </h1>
            <p className="text-lg sm:text-xl text-muted-foreground leading-relaxed mb-10 max-w-3xl mx-auto">
              Skapa, analysera och optimera din portfölj med hjälp av AI. Upptäck nya möjligheter genom vårt community.
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <Button asChild size="lg" className="bg-gradient-to-r from-primary to-blue-600 hover:from-primary/90 hover:to-blue-600/90 text-white font-medium shadow-lg hover:shadow-xl transition-all duration-200">
                <Link to={user ? (hasPortfolio ? "/portfolio-implementation" : "/portfolio-advisor") : "/auth"}>
                  <BarChart3 className="w-5 h-5 mr-2" />
                  {user ? (hasPortfolio ? "Min Portfölj" : "Skapa Portfölj") : "Starta nu"}
                </Link>
              </Button>
              <Button asChild variant="outline" size="lg" className="border-primary text-primary hover:bg-primary hover:text-primary-foreground shadow-md hover:shadow-lg transition-all duration-200">
                <Link to="/ai-chat">
                  <Brain className="w-5 h-5 mr-2" />
                  AI-Rådgivare
                </Link>
              </Button>
            </div>
          </div>

          {/* Portfolio Widget for logged-in users with portfolio */}
          {user && hasPortfolio && (
            <div className="mb-16">
              <Card className="bg-gradient-to-r from-primary/5 to-blue-50 dark:from-primary/10 dark:to-blue-950/20 border-primary/20 shadow-lg">
                <div className="p-6">
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-primary flex items-center justify-center">
                        <BarChart3 className="w-5 h-5 text-primary-foreground" />
                      </div>
                      <div>
                        <h3 className="font-semibold text-lg">Din Portfölj</h3>
                        <p className="text-sm text-muted-foreground">Totalt värde: {totalPortfolioValue.toLocaleString('sv-SE')} kr</p>
                      </div>
                    </div>
                    <Badge className="bg-green-100 text-green-700 border-green-200">
                      Aktiv
                    </Badge>
                  </div>
                  <div className="flex items-center gap-4">
                    <Button asChild>
                      <Link to="/portfolio-implementation">
                        Visa detaljer
                        <ArrowUpRight className="w-4 h-4 ml-2" />
                      </Link>
                    </Button>
                    <Button asChild variant="outline">
                      <Link to="/ai-chat">
                        Diskutera med AI
                      </Link>
                    </Button>
                  </div>
                </div>
              </Card>
            </div>
          )}

          {/* Main Action Cards - Only 3 focused cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-16">
            
            {/* Portfolio Management */}
            <Card className="bg-card border shadow-lg hover:shadow-xl transition-all duration-300 group cursor-pointer">
              <Link to={user ? (hasPortfolio ? "/portfolio-implementation" : "/portfolio-advisor") : "/auth"} className="block p-8">
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
                  {user && hasPortfolio 
                    ? "Analysera prestanda, optimera allokering och få AI-drivna insikter om din portfölj." 
                    : "Låt AI hjälpa dig bygga en diversifierad portfölj baserad på din riskprofil och mål."
                  }
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
    </Layout>
  );
};
export default Index;