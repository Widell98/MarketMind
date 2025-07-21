
import React from 'react';
import Layout from '@/components/Layout';
import IntelligentRouting from '@/components/IntelligentRouting';
import CompactLatestCases from '@/components/CompactLatestCases';
import { Brain, Lightbulb, TrendingUp, PieChart, MessageSquare, UserPlus, BarChart3, LineChart, BadgePercent, Rocket, ShieldCheck, Headphones, TrendingDown, ArrowUpRight, ArrowDownLeft, Star, Target, Zap } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Link } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';

const Index = () => {
  const { user } = useAuth();

  return (
    <Layout>
      <div className="min-h-screen bg-gradient-to-br from-background via-background to-primary/5">
        <div className="container mx-auto px-3 sm:px-4 lg:px-6 xl:px-8 py-4 sm:py-6 lg:py-8 max-w-[1600px]">
          {/* Hero Section */}
          <div className="text-center mb-8 sm:mb-12 lg:mb-16">
            <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-foreground mb-4 sm:mb-6">
              Investera smartare med AI
            </h1>
            <p className="text-sm sm:text-base lg:text-lg text-muted-foreground leading-relaxed mb-6 sm:mb-8 lg:mb-10 max-w-3xl mx-auto">
              {user 
                ? "Välkommen tillbaka! Få personliga investeringsråd, portföljanalys och marknadsinsikter med vår AI-drivna plattform."
                : "Få personliga investeringsråd, portföljanalys och marknadsinsikter med vår AI-drivna plattform. Börja idag och ta kontroll över dina investeringar."
              }
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-8">
              <Button asChild size="lg" className="bg-gradient-to-r from-primary to-blue-600 hover:from-primary/90 hover:to-blue-600/90 text-white font-medium shadow-md hover:shadow-lg transition-all duration-200 w-full sm:w-auto">
                <Link to={user ? "/portfolio-advisor" : "/auth"}>
                  <UserPlus className="w-4 h-4 mr-2" />
                  {user ? "Skapa din portfölj" : "Kom igång gratis"}
                </Link>
              </Button>
              <Button asChild variant="outline" size="lg" className="border-primary text-primary hover:bg-primary hover:text-primary-foreground shadow-sm hover:shadow-md transition-all duration-200 w-full sm:w-auto">
                <Link to="/ai-chat">
                  <Brain className="w-4 h-4 mr-2" />
                  Fråga AI-assistenten
                </Link>
              </Button>
            </div>
            
            {/* Social proof for non-logged in users */}
            {!user && (
              <div className="flex flex-wrap items-center justify-center gap-6 text-sm text-muted-foreground">
                <div className="flex items-center gap-2">
                  <div className="flex -space-x-2">
                    {[...Array(4)].map((_, i) => (
                      <div key={i} className="w-8 h-8 rounded-full bg-gradient-to-br from-primary/20 to-blue-600/20 border-2 border-background flex items-center justify-center">
                        <Star className="w-3 h-3 text-primary" />
                      </div>
                    ))}
                  </div>
                  <span>1000+ aktiva investerare</span>
                </div>
                <div className="flex items-center gap-2">
                  <Target className="w-4 h-4 text-green-500" />
                  <span>AI-driven analys</span>
                </div>
                <div className="flex items-center gap-2">
                  <Zap className="w-4 h-4 text-yellow-500" />
                  <span>Gratis att komma igång</span>
                </div>
              </div>
            )}
          </div>

                    {/* CTA Section */}
          <div className="text-center bg-gradient-to-r from-primary/10 via-primary/5 to-transparent rounded-3xl p-6 sm:p-8 lg:p-12 border border-primary/20">
            <h2 className="text-2xl sm:text-3xl font-bold text-foreground mb-4">
              {user 
                ? "Redo att ta din investering till nästa nivå?"
                : "Redo att börja din investeringsresa?"
              }
            </h2>
            <p className="text-sm sm:text-base text-muted-foreground leading-relaxed mb-6 max-w-2xl mx-auto">
              {user 
                ? "Fortsätt utveckla din portfölj och upplev kraften i AI-drivna investeringar."
                : "Gå med i tusentals investerare som redan använder AI för att fatta smartare investeringsbeslut. Helt gratis att komma igång."
              }
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
              <Button asChild size="lg" className="bg-gradient-to-r from-primary to-blue-600 hover:from-primary/90 hover:to-blue-600/90 text-white font-medium shadow-md hover:shadow-lg transition-all duration-200 w-full sm:w-auto">
                <Link to={user ? "/portfolio-advisor" : "/auth"}>
                  {user ? "Optimera min portfölj" : "Kom igång gratis"}
                  <Rocket className="w-4 h-4 ml-2" />
                </Link>
              </Button>
              {!user && (
                <Button asChild variant="outline" size="lg" className="border-primary text-primary hover:bg-primary hover:text-primary-foreground w-full sm:w-auto">
                  <Link to="/stock-cases">
                    Utforska community
                    <ArrowUpRight className="w-4 h-4 ml-2" />
                  </Link>
                </Button>
              )}
            </div>
            
            {!user && (
              <div className="mt-6 text-xs text-muted-foreground">
                Ingen kreditkort krävs • Avsluta när som helst • 1000+ nöjda användare
              </div>
            )}
          </div>

          {/* Smart Navigation - New AI-first feature */}
          {user && (
            <div className="mb-8 sm:mb-12">
              <IntelligentRouting />
            </div>
          )}

          {/* Latest Stock Cases - Using Real Data */}
          <div className="mb-8 sm:mb-12 lg:mb-16">
            <CompactLatestCases />
          </div>

          {/* AI Features Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-4 sm:gap-6 lg:gap-8 mb-8 sm:mb-12 lg:mb-16">
            {/* AI Portfolio Analysis */}
            <Card className="bg-card border shadow-md hover:shadow-lg transition-all duration-200 group">
              <div className="p-4 sm:p-6 lg:p-8">
                <div className="flex items-center gap-4 mb-4">
                  <div className="w-12 h-12 rounded-xl bg-blue-500/10 flex items-center justify-center group-hover:bg-blue-500/20 transition-colors">
                    <BarChart3 className="w-6 h-6 text-blue-500" />
                  </div>
                  <h3 className="text-lg font-semibold text-foreground">Portföljanalys</h3>
                </div>
                <p className="text-sm text-muted-foreground leading-relaxed mb-4">
                  Få en djupgående analys av din portföljs prestanda, risk och diversifiering med AI-driven insikt.
                </p>
                <Button asChild variant="link" className="text-sm font-medium hover:underline underline-offset-2 p-0">
                  <Link to={user ? "/portfolio-implementation" : "/auth"}>
                    {user ? "Analysera min portfölj" : "Kom igång nu"}
                    <ArrowUpRight className="w-3 h-3 ml-1" />
                  </Link>
                </Button>
              </div>
            </Card>

            {/* AI Market Insights */}
            <Card className="bg-card border shadow-md hover:shadow-lg transition-all duration-200 group">
              <div className="p-4 sm:p-6 lg:p-8">
                <div className="flex items-center gap-4 mb-4">
                  <div className="w-12 h-12 rounded-xl bg-green-500/10 flex items-center justify-center group-hover:bg-green-500/20 transition-colors">
                    <LineChart className="w-6 h-6 text-green-500" />
                  </div>
                  <h3 className="text-lg font-semibold text-foreground">Marknadsinsikter</h3>
                </div>
                <p className="text-sm text-muted-foreground leading-relaxed mb-4">
                  Håll dig uppdaterad med de senaste marknadstrenderna och investeringsmöjligheterna från vårt community.
                </p>
                <Button asChild variant="link" className="text-sm font-medium hover:underline underline-offset-2 p-0">
                  <Link to="/stock-cases">
                    Utforska marknaden
                    <ArrowUpRight className="w-3 h-3 ml-1" />
                  </Link>
                </Button>
              </div>
            </Card>

            {/* AI Risk Management */}
            <Card className="bg-card border shadow-md hover:shadow-lg transition-all duration-200 group">
              <div className="p-4 sm:p-6 lg:p-8">
                <div className="flex items-center gap-4 mb-4">
                  <div className="w-12 h-12 rounded-xl bg-red-500/10 flex items-center justify-center group-hover:bg-red-500/20 transition-colors">
                    <ShieldCheck className="w-6 h-6 text-red-500" />
                  </div>
                  <h3 className="text-lg font-semibold text-foreground">Riskhantering</h3>
                </div>
                <p className="text-sm text-muted-foreground leading-relaxed mb-4">
                  Minimera riskerna i din portfölj med AI-drivna strategier för diversifiering och skydd.
                </p>
                <Button asChild variant="link" className="text-sm font-medium hover:underline underline-offset-2 p-0">
                  <Link to={user ? "/portfolio-advisor" : "/auth"}>
                    {user ? "Optimera min risk" : "Börja nu"}
                    <ArrowUpRight className="w-3 h-3 ml-1" />
                  </Link>
                </Button>
              </div>
            </Card>

            {/* AI Investment Recommendations */}
            <Card className="bg-card border shadow-md hover:shadow-lg transition-all duration-200 group">
              <div className="p-4 sm:p-6 lg:p-8">
                <div className="flex items-center gap-4 mb-4">
                  <div className="w-12 h-12 rounded-xl bg-yellow-500/10 flex items-center justify-center group-hover:bg-yellow-500/20 transition-colors">
                    <Rocket className="w-6 h-6 text-yellow-500" />
                  </div>
                  <h3 className="text-lg font-semibold text-foreground">Investeringsförslag</h3>
                </div>
                <p className="text-sm text-muted-foreground leading-relaxed mb-4">
                  Upptäck nya investeringsmöjligheter baserat på din riskprofil och finansiella mål.
                </p>
                <Button asChild variant="link" className="text-sm font-medium hover:underline underline-offset-2 p-0">
                  <Link to="/ai-chat">
                    Få rekommendationer
                    <ArrowUpRight className="w-3 h-3 ml-1" />
                  </Link>
                </Button>
              </div>
            </Card>

            {/* AI-Powered Education */}
            <Card className="bg-card border shadow-md hover:shadow-lg transition-all duration-200 group">
              <div className="p-4 sm:p-6 lg:p-8">
                <div className="flex items-center gap-4 mb-4">
                  <div className="w-12 h-12 rounded-xl bg-purple-500/10 flex items-center justify-center group-hover:bg-purple-500/20 transition-colors">
                    <Headphones className="w-6 h-6 text-purple-500" />
                  </div>
                  <h3 className="text-lg font-semibold text-foreground">AI-Utbildning</h3>
                </div>
                <p className="text-sm text-muted-foreground leading-relaxed mb-4">
                  Lär dig mer om investeringar med AI-genererade kurser och personliga råd från experter.
                </p>
                <Button asChild variant="link" className="text-sm font-medium hover:underline underline-offset-2 p-0">
                  <Link to="/ai-chat">
                    Lär mig investera
                    <ArrowUpRight className="w-3 h-3 ml-1" />
                  </Link>
                </Button>
              </div>
            </Card>

            {/* AI Market Sentiment Analysis */}
            <Card className="bg-card border shadow-md hover:shadow-lg transition-all duration-200 group">
              <div className="p-4 sm:p-6 lg:p-8">
                <div className="flex items-center gap-4 mb-4">
                  <div className="w-12 h-12 rounded-xl bg-orange-500/10 flex items-center justify-center group-hover:bg-orange-500/20 transition-colors">
                    <TrendingDown className="w-6 h-6 text-orange-500" />
                  </div>
                  <h3 className="text-lg font-semibold text-foreground">Marknadssentiment</h3>
                </div>
                <p className="text-sm text-muted-foreground leading-relaxed mb-4">
                  Få en överblick över marknadens förväntningar och stämningar med AI-analys i realtid.
                </p>
                <Button asChild variant="link" className="text-sm font-medium hover:underline underline-offset-2 p-0">
                  <Link to="/stock-cases">
                    Se sentimentanalys
                    <ArrowUpRight className="w-3 h-3 ml-1" />
                  </Link>
                </Button>
              </div>
            </Card>
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default Index;
