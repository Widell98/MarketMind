import React from 'react';
import Layout from '@/components/Layout';
import IntelligentRouting from '@/components/IntelligentRouting';
import CompactLatestCases from '@/components/CompactLatestCases';
import { Brain, Lightbulb, TrendingUp, PieChart, MessageSquare, UserPlus, BarChart3, LineChart, BadgePercent, Rocket, ShieldCheck, Headphones, TrendingDown, ArrowUpRight, ArrowDownLeft, Star, Target, Zap } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Link } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { usePortfolio } from '@/hooks/usePortfolio';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
const Index = () => {
  const {
    user
  } = useAuth();
  const {
    activePortfolio,
    loading
  } = usePortfolio();

  // Check if user has completed the main onboarding steps
  const hasPortfolio = !loading && !!activePortfolio;

  // Query to check if user has analyses
  const {
    data: userAnalyses
  } = useQuery({
    queryKey: ['userAnalyses', user?.id],
    queryFn: async () => {
      if (!user) return [];
      const {
        data
      } = await supabase.from('analyses').select('id').eq('user_id', user.id).limit(1);
      return data || [];
    },
    enabled: !!user
  });

  // Query to check if user has stock cases
  const {
    data: userStockCases
  } = useQuery({
    queryKey: ['userStockCases', user?.id],
    queryFn: async () => {
      if (!user) return [];
      const {
        data
      } = await supabase.from('stock_cases').select('id').eq('user_id', user.id).limit(1);
      return data || [];
    },
    enabled: !!user
  });

  // Calculate user registration days
  const userRegistrationDays = user ? Math.floor((Date.now() - new Date(user.created_at).getTime()) / (1000 * 60 * 60 * 24)) : 0;
  const hasAnalyses = userAnalyses && userAnalyses.length > 0;
  const hasStockCases = userStockCases && userStockCases.length > 0;
  const shouldShowHero = !user || !hasPortfolio;
  return <Layout>
      <div className="min-h-screen bg-gradient-to-br from-background via-background to-primary/5">
        <div className="container mx-auto px-3 sm:px-4 lg:px-6 xl:px-8 py-4 sm:py-6 lg:py-8 max-w-[1600px]">
          {/* Hero Section - Only show if user doesn't have portfolio */}
          {shouldShowHero && <div className="text-center mb-8 sm:mb-12 lg:mb-16">
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-foreground mb-6">
              Investera smartare med AI
            </h1>
              <p className="text-sm sm:text-base lg:text-lg text-muted-foreground leading-relaxed mb-6 sm:mb-8 lg:mb-10 max-w-3xl mx-auto">
                {user ? "Välkommen tillbaka! Få personliga investeringsråd, portföljanalys och marknadsinsikter med vår AI-drivna plattform." : "Få personliga investeringsråd, portföljanalys och marknadsinsikter med vår AI-drivna plattform. Börja idag och ta kontroll över dina investeringar."}
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
              {!user}
            </div>}

          {/* Welcome back section for users with portfolio */}
          {user && hasPortfolio && <div className="text-center mb-8 sm:mb-12">
              <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-foreground mb-3 sm:mb-4">
                Välkommen tillbaka!
              </h1>
              <p className="text-sm sm:text-base text-muted-foreground leading-relaxed mb-6 max-w-2xl mx-auto">
                Din portfölj är aktiv och redo för analys. Utforska marknadsinsikter och optimera dina investeringar.
              </p>
            </div>}

          {/* Smart Navigation - endast för nya användare */}
          {user && userRegistrationDays <= 7 && (
            <div className="mb-12">
              <IntelligentRouting hasPortfolio={hasPortfolio} hasAnalyses={hasAnalyses} hasStockCases={hasStockCases} userRegistrationDays={userRegistrationDays} />
            </div>
          )}

          {/* Fokuserade huvudfunktioner - 3 kort */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-16">
            {/* Portfölj/Skapa portfölj */}
            <Card className="bg-card border shadow-sm hover:shadow-md transition-all duration-200 group">
              <div className="p-6">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center group-hover:bg-primary/20 transition-colors">
                    {user && hasPortfolio ? <BarChart3 className="w-5 h-5 text-primary" /> : <PieChart className="w-5 h-5 text-primary" />}
                  </div>
                  <h3 className="text-lg font-semibold text-foreground">
                    {user && hasPortfolio ? "Portföljanalys" : "Skapa portfölj"}
                  </h3>
                </div>
                <p className="text-sm text-muted-foreground leading-relaxed mb-4">
                  {user && hasPortfolio 
                    ? "Analysera din portföljs prestanda och få AI-drivna förbättringsförslag."
                    : "Bygg en diversifierad investeringsportfölj med AI-vägledning."
                  }
                </p>
                <Button asChild variant="link" className="text-sm font-medium hover:underline underline-offset-2 p-0">
                  <Link to={user && hasPortfolio ? "/portfolio-implementation" : user ? "/portfolio-advisor" : "/auth"}>
                    {user && hasPortfolio ? "Analysera portfölj" : user ? "Skapa portfölj" : "Kom igång nu"}
                    <ArrowUpRight className="w-3 h-3 ml-1" />
                  </Link>
                </Button>
              </div>
            </Card>

            {/* AI-Rådgivning */}
            <Card className="bg-card border shadow-sm hover:shadow-md transition-all duration-200 group">
              <div className="p-6">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center group-hover:bg-primary/20 transition-colors">
                    <Brain className="w-5 h-5 text-primary" />
                  </div>
                  <h3 className="text-lg font-semibold text-foreground">AI-Rådgivning</h3>
                </div>
                <p className="text-sm text-muted-foreground leading-relaxed mb-4">
                  Få personliga investeringsråd och marknadsinsikter från vår AI-assistent.
                </p>
                <Button asChild variant="link" className="text-sm font-medium hover:underline underline-offset-2 p-0">
                  <Link to="/ai-chat">
                    Starta AI-chatt
                    <ArrowUpRight className="w-3 h-3 ml-1" />
                  </Link>
                </Button>
              </div>
            </Card>

            {/* Community */}
            <Card className="bg-card border shadow-sm hover:shadow-md transition-all duration-200 group">
              <div className="p-6">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center group-hover:bg-primary/20 transition-colors">
                    <LineChart className="w-5 h-5 text-primary" />
                  </div>
                  <h3 className="text-lg font-semibold text-foreground">Upptäck Community</h3>
                </div>
                <p className="text-sm text-muted-foreground leading-relaxed mb-4">
                  Utforska marknadsanalyser och investeringsidéer från vårt community.
                </p>
                <Button asChild variant="link" className="text-sm font-medium hover:underline underline-offset-2 p-0">
                  <Link to="/stock-cases">
                    Utforska marknaden
                    <ArrowUpRight className="w-3 h-3 ml-1" />
                  </Link>
                </Button>
              </div>
            </Card>
          </div>

          {/* Community insikter */}
          <div className="mb-16">
            <div className="text-center mb-8">
              <h2 className="text-2xl font-bold text-foreground mb-2">Senaste från communityn</h2>
              <p className="text-muted-foreground">Upptäck de senaste investeringsanalyserna och diskussionerna</p>
            </div>
            <CompactLatestCases />
          </div>

          {/* CTA Section - Updated based on user status */}
          <div className="text-center bg-gradient-to-r from-primary/10 via-primary/5 to-transparent rounded-3xl p-6 sm:p-8 lg:p-12 border border-primary/20">
            <h2 className="text-2xl sm:text-3xl font-bold text-foreground mb-4">
              {user && hasPortfolio ? "Fortsätt optimera din portfölj" : user ? "Redo att ta din investering till nästa nivå?" : "Redo att börja din investeringsresa?"}
            </h2>
            <p className="text-sm sm:text-base text-muted-foreground leading-relaxed mb-6 max-w-2xl mx-auto">
              {user && hasPortfolio ? "Din portfölj är uppsatt! Använd AI-verktygen för att få djupare insikter och optimera dina investeringar ytterligare." : user ? "Fortsätt utveckla din portfölj och upplev kraften i AI-drivna investeringar." : "Gå med i tusentals investerare som redan använder AI för att fatta smartare investeringsbeslut. Helt gratis att komma igång."}
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
              <Button asChild size="lg" className="bg-gradient-to-r from-primary to-blue-600 hover:from-primary/90 hover:to-blue-600/90 text-white font-medium shadow-md hover:shadow-lg transition-all duration-200 w-full sm:w-auto">
                <Link to={user && hasPortfolio ? "/portfolio-implementation" : user ? "/portfolio-advisor" : "/auth"}>
                  {user && hasPortfolio ? "Analysera portfölj" : user ? "Skapa portfölj" : "Kom igång gratis"}
                  <Rocket className="w-4 h-4 ml-2" />
                </Link>
              </Button>
              {!hasPortfolio && <Button asChild variant="outline" size="lg" className="border-primary text-primary hover:bg-primary hover:text-primary-foreground w-full sm:w-auto">
                  <Link to="/stock-cases">
                    Utforska community
                    <ArrowUpRight className="w-4 h-4 ml-2" />
                  </Link>
                </Button>}
            </div>
            
            {!user && <div className="mt-6 text-xs text-muted-foreground">
                Ingen kreditkort krävs • Avsluta när som helst • 1000+ nöjda användare
              </div>}
          </div>
        </div>
      </div>
    </Layout>;
};
export default Index;