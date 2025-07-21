
import React from 'react';
import Layout from '@/components/Layout';
import IntelligentRouting from '@/components/IntelligentRouting';
import {
  Brain,
  Lightbulb,
  TrendingUp,
  PieChart,
  MessageSquare,
  UserPlus,
  BarChart3,
  LineChart,
  BadgePercent,
  Rocket,
  ShieldCheck,
  Headphones,
  TrendingDown,
  ArrowUpRight,
  ArrowDownLeft
} from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Link } from 'react-router-dom';

const Index = () => {
  return (
    <Layout>
      <div className="min-h-screen bg-gradient-to-br from-background via-background to-primary/5">
        <div className="container mx-auto px-3 sm:px-4 lg:px-6 xl:px-8 py-4 sm:py-6 lg:py-8 max-w-[1600px]">
          {/* Hero Section */}
          <div className="text-center mb-8 sm:mb-12 lg:mb-16">
            <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-foreground mb-4 sm:mb-6">
              Investera smartare med AI
            </h1>
            <p className="text-sm sm:text-base lg:text-lg text-muted-foreground leading-relaxed mb-6 sm:mb-8 lg:mb-10">
              Få personliga investeringsråd, portföljanalys och marknadsinsikter med vår AI-drivna plattform.
            </p>
            <div className="flex items-center justify-center space-x-4">
              <Button asChild size="lg" className="bg-gradient-to-r from-primary to-blue-600 hover:from-primary/90 hover:to-blue-600/90 text-white font-medium shadow-md hover:shadow-lg transition-all duration-200">
                <Link to="/portfolio-advisor">
                  <UserPlus className="w-4 h-4 mr-2" />
                  Skapa din portfölj
                </Link>
              </Button>
              <Button asChild variant="outline" size="lg" className="border-primary text-primary hover:bg-primary hover:text-primary-foreground shadow-sm hover:shadow-md transition-all duration-200">
                <Link to="/ai-chat">
                  <Brain className="w-4 h-4 mr-2" />
                  Fråga AI-assistenten
                </Link>
              </Button>
            </div>
          </div>

          {/* Smart Navigation - New AI-first feature */}
          <div className="mb-8 sm:mb-12">
            <IntelligentRouting />
          </div>

          {/* AI Features Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-4 sm:gap-6 lg:gap-8 mb-8 sm:mb-12 lg:mb-16">
            {/* AI Portfolio Analysis */}
            <Card className="bg-card border shadow-md hover:shadow-lg transition-all duration-200">
              <div className="p-4 sm:p-6 lg:p-8">
                <div className="flex items-center gap-4 mb-4">
                  <div className="w-12 h-12 rounded-xl bg-blue-500/10 flex items-center justify-center">
                    <BarChart3 className="w-6 h-6 text-blue-500" />
                  </div>
                  <h3 className="text-lg font-semibold text-foreground">Portföljanalys</h3>
                </div>
                <p className="text-sm text-muted-foreground leading-relaxed mb-4">
                  Få en djupgående analys av din portföljs prestanda, risk och diversifiering.
                </p>
                <Button asChild variant="link" className="text-sm font-medium hover:underline underline-offset-2">
                  <Link to="/portfolio-implementation">
                    Analysera min portfölj
                    <ArrowUpRight className="w-3 h-3 ml-1" />
                  </Link>
                </Button>
              </div>
            </Card>

            {/* AI Market Insights */}
            <Card className="bg-card border shadow-md hover:shadow-lg transition-all duration-200">
              <div className="p-4 sm:p-6 lg:p-8">
                <div className="flex items-center gap-4 mb-4">
                  <div className="w-12 h-12 rounded-xl bg-green-500/10 flex items-center justify-center">
                    <LineChart className="w-6 h-6 text-green-500" />
                  </div>
                  <h3 className="text-lg font-semibold text-foreground">Marknadsinsikter</h3>
                </div>
                <p className="text-sm text-muted-foreground leading-relaxed mb-4">
                  Håll dig uppdaterad med de senaste marknadstrenderna och investeringsmöjligheterna.
                </p>
                <Button asChild variant="link" className="text-sm font-medium hover:underline underline-offset-2">
                  <Link to="/stock-cases">
                    Utforska marknaden
                    <ArrowUpRight className="w-3 h-3 ml-1" />
                  </Link>
                </Button>
              </div>
            </Card>

            {/* AI Risk Management */}
            <Card className="bg-card border shadow-md hover:shadow-lg transition-all duration-200">
              <div className="p-4 sm:p-6 lg:p-8">
                <div className="flex items-center gap-4 mb-4">
                  <div className="w-12 h-12 rounded-xl bg-red-500/10 flex items-center justify-center">
                    <ShieldCheck className="w-6 h-6 text-red-500" />
                  </div>
                  <h3 className="text-lg font-semibold text-foreground">Riskhantering</h3>
                </div>
                <p className="text-sm text-muted-foreground leading-relaxed mb-4">
                  Minimera riskerna i din portfölj med AI-drivna strategier för diversifiering och skydd.
                </p>
                <Button asChild variant="link" className="text-sm font-medium hover:underline underline-offset-2">
                  <Link to="/portfolio-advisor">
                    Optimera min risk
                    <ArrowUpRight className="w-3 h-3 ml-1" />
                  </Link>
                </Button>
              </div>
            </Card>

            {/* AI Investment Recommendations */}
            <Card className="bg-card border shadow-md hover:shadow-lg transition-all duration-200">
              <div className="p-4 sm:p-6 lg:p-8">
                <div className="flex items-center gap-4 mb-4">
                  <div className="w-12 h-12 rounded-xl bg-yellow-500/10 flex items-center justify-center">
                    <Rocket className="w-6 h-6 text-yellow-500" />
                  </div>
                  <h3 className="text-lg font-semibold text-foreground">Investeringsförslag</h3>
                </div>
                <p className="text-sm text-muted-foreground leading-relaxed mb-4">
                  Upptäck nya investeringsmöjligheter baserat på din riskprofil och mål.
                </p>
                <Button asChild variant="link" className="text-sm font-medium hover:underline underline-offset-2">
                  <Link to="/ai-chat">
                    Få rekommendationer
                    <ArrowUpRight className="w-3 h-3 ml-1" />
                  </Link>
                </Button>
              </div>
            </Card>

            {/* AI-Powered Education */}
            <Card className="bg-card border shadow-md hover:shadow-lg transition-all duration-200">
              <div className="p-4 sm:p-6 lg:p-8">
                <div className="flex items-center gap-4 mb-4">
                  <div className="w-12 h-12 rounded-xl bg-purple-500/10 flex items-center justify-center">
                    <Headphones className="w-6 h-6 text-purple-500" />
                  </div>
                  <h3 className="text-lg font-semibold text-foreground">AI-Utbildning</h3>
                </div>
                <p className="text-sm text-muted-foreground leading-relaxed mb-4">
                  Lär dig mer om investeringar med AI-genererade kurser och resurser.
                </p>
                <Button asChild variant="link" className="text-sm font-medium hover:underline underline-offset-2">
                  <Link to="/ai-chat">
                    Lär mig investera
                    <ArrowUpRight className="w-3 h-3 ml-1" />
                  </Link>
                </Button>
              </div>
            </Card>

            {/* AI Market Sentiment Analysis */}
            <Card className="bg-card border shadow-md hover:shadow-lg transition-all duration-200">
              <div className="p-4 sm:p-6 lg:p-8">
                <div className="flex items-center gap-4 mb-4">
                  <div className="w-12 h-12 rounded-xl bg-orange-500/10 flex items-center justify-center">
                    <TrendingDown className="w-6 h-6 text-orange-500" />
                  </div>
                  <h3 className="text-lg font-semibold text-foreground">Marknadssentiment</h3>
                </div>
                <p className="text-sm text-muted-foreground leading-relaxed mb-4">
                  Få en överblick över marknadens förväntningar och stämningar med AI-analys.
                </p>
                <Button asChild variant="link" className="text-sm font-medium hover:underline underline-offset-2">
                  <Link to="/stock-cases">
                    Se sentimentanalys
                    <ArrowUpRight className="w-3 h-3 ml-1" />
                  </Link>
                </Button>
              </div>
            </Card>
          </div>

          {/* Market Data Section */}
          <div className="grid grid-cols-1 xl:grid-cols-3 gap-4 sm:gap-6 lg:gap-8 mb-8 sm:mb-12 lg:mb-16">
            {/* Top Movers */}
            <Card className="bg-card border shadow-md hover:shadow-lg transition-all duration-200">
              <div className="p-4 sm:p-6 lg:p-8">
                <h3 className="text-lg font-semibold text-foreground mb-3">
                  Topp 5 stigande aktier
                </h3>
                <ul className="space-y-2">
                  <li className="flex items-center justify-between">
                    <span>Tesla (TSLA)</span>
                    <span className="text-green-500">+3.5%</span>
                  </li>
                  <li className="flex items-center justify-between">
                    <span>Apple (AAPL)</span>
                    <span className="text-green-500">+2.8%</span>
                  </li>
                  <li className="flex items-center justify-between">
                    <span>Microsoft (MSFT)</span>
                    <span className="text-green-500">+2.1%</span>
                  </li>
                  <li className="flex items-center justify-between">
                    <span>Amazon (AMZN)</span>
                    <span className="text-green-500">+1.9%</span>
                  </li>
                  <li className="flex items-center justify-between">
                    <span>NVIDIA (NVDA)</span>
                    <span className="text-green-500">+1.5%</span>
                  </li>
                </ul>
              </div>
            </Card>

            {/* Top Losers */}
            <Card className="bg-card border shadow-md hover:shadow-lg transition-all duration-200">
              <div className="p-4 sm:p-6 lg:p-8">
                <h3 className="text-lg font-semibold text-foreground mb-3">
                  Topp 5 fallande aktier
                </h3>
                <ul className="space-y-2">
                  <li className="flex items-center justify-between">
                    <span>AMC Entertainment (AMC)</span>
                    <span className="text-red-500">-4.2%</span>
                  </li>
                  <li className="flex items-center justify-between">
                    <span>GameStop (GME)</span>
                    <span className="text-red-500">-3.8%</span>
                  </li>
                  <li className="flex items-center justify-between">
                    <span>Bed Bath & Beyond (BBBY)</span>
                    <span className="text-red-500">-3.5%</span>
                  </li>
                  <li className="flex items-center justify-between">
                    <span>Virgin Galactic (SPCE)</span>
                    <span className="text-red-500">-3.1%</span>
                  </li>
                  <li className="flex items-center justify-between">
                    <span>BlackBerry (BB)</span>
                    <span className="text-red-500">-2.9%</span>
                  </li>
                </ul>
              </div>
            </Card>

            {/* Key Market Indicators */}
            <Card className="bg-card border shadow-md hover:shadow-lg transition-all duration-200">
              <div className="p-4 sm:p-6 lg:p-8">
                <h3 className="text-lg font-semibold text-foreground mb-3">
                  Marknadsindikatorer
                </h3>
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span>S&P 500</span>
                    <div className="flex items-center gap-1">
                      <span className="text-sm">4,500</span>
                      <ArrowUpRight className="w-4 h-4 text-green-500" />
                    </div>
                  </div>
                  <div className="flex items-center justify-between">
                    <span>NASDAQ</span>
                    <div className="flex items-center gap-1">
                      <span className="text-sm">14,000</span>
                      <ArrowDownLeft className="w-4 h-4 text-red-500" />
                    </div>
                  </div>
                  <div className="flex items-center justify-between">
                    <span>Guld (per uns)</span>
                    <div className="flex items-center gap-1">
                      <span className="text-sm">$1,950</span>
                      <ArrowUpRight className="w-4 h-4 text-green-500" />
                    </div>
                  </div>
                  <div className="flex items-center justify-between">
                    <span>Olja (per fat)</span>
                    <div className="flex items-center gap-1">
                      <span className="text-sm">$75</span>
                      <ArrowDownLeft className="w-4 h-4 text-red-500" />
                    </div>
                  </div>
                </div>
              </div>
            </Card>
          </div>

          {/* Latest Stock Cases */}
          <div className="mb-8 sm:mb-12 lg:mb-16">
            <h2 className="text-2xl font-bold text-foreground mb-4">
              Senaste Aktiefall
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
              <Card className="bg-card border shadow-md hover:shadow-lg transition-all duration-200">
                <div className="p-4 sm:p-6">
                  <h3 className="text-lg font-semibold text-foreground mb-2">
                    Tesla (TSLA)
                  </h3>
                  <p className="text-sm text-muted-foreground leading-relaxed mb-3">
                    En analys av Teslas senaste kvartalsrapport och framtidsutsikter.
                  </p>
                  <Button asChild variant="link" className="text-sm font-medium hover:underline underline-offset-2">
                    <Link to="/stock-cases">
                      Läs mer
                      <ArrowUpRight className="w-3 h-3 ml-1" />
                    </Link>
                  </Button>
                </div>
              </Card>

              <Card className="bg-card border shadow-md hover:shadow-lg transition-all duration-200">
                <div className="p-4 sm:p-6">
                  <h3 className="text-lg font-semibold text-foreground mb-2">
                    Apple (AAPL)
                  </h3>
                  <p className="text-sm text-muted-foreground leading-relaxed mb-3">
                    En djupdykning i Apples nya produktlanseringar och marknadsstrategi.
                  </p>
                  <Button asChild variant="link" className="text-sm font-medium hover:underline underline-offset-2">
                    <Link to="/stock-cases">
                      Läs mer
                      <ArrowUpRight className="w-3 h-3 ml-1" />
                    </Link>
                  </Button>
                </div>
              </Card>

              <Card className="bg-card border shadow-md hover:shadow-lg transition-all duration-200">
                <div className="p-4 sm:p-6">
                  <h3 className="text-lg font-semibold text-foreground mb-2">
                    Microsoft (MSFT)
                  </h3>
                  <p className="text-sm text-muted-foreground leading-relaxed mb-3">
                    En genomgång av Microsofts molnverksamhet och AI-satsningar.
                  </p>
                  <Button asChild variant="link" className="text-sm font-medium hover:underline underline-offset-2">
                    <Link to="/stock-cases">
                      Läs mer
                      <ArrowUpRight className="w-3 h-3 ml-1" />
                    </Link>
                  </Button>
                </div>
              </Card>
            </div>
          </div>

          {/* CTA Section */}
          <div className="text-center bg-gradient-to-r from-primary/10 via-primary/5 to-transparent rounded-3xl p-6 sm:p-8 lg:p-12 border border-primary/20">
            <h2 className="text-2xl sm:text-3xl font-bold text-foreground mb-4">
              Redo att ta din investering till nästa nivå?
            </h2>
            <p className="text-sm sm:text-base text-muted-foreground leading-relaxed mb-6">
              Skapa en portfölj idag och upplev kraften i AI-drivna investeringar.
            </p>
            <Button asChild size="lg" className="bg-gradient-to-r from-primary to-blue-600 hover:from-primary/90 hover:to-blue-600/90 text-white font-medium shadow-md hover:shadow-lg transition-all duration-200">
              <Link to="/portfolio-advisor">
                Kom igång gratis
                <Rocket className="w-4 h-4 ml-2" />
              </Link>
            </Button>
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default Index;
