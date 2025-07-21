
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Layout from '@/components/Layout';
import InteractivePortfolio from '@/components/InteractivePortfolio';
import UserInsightsPanel from '@/components/UserInsightsPanel';
import ConversationalPortfolioAdvisor from '@/components/ConversationalPortfolioAdvisor';
import UserInvestmentAnalysis from '@/components/UserInvestmentAnalysis';
import SubscriptionCard from '@/components/SubscriptionCard';
import LoginPromptModal from '@/components/LoginPromptModal';
import EnhancedPortfolioDashboard from '@/components/EnhancedPortfolioDashboard';
import ModernPortfolioHeader from '@/components/portfolio/ModernPortfolioHeader';
import QuickActionPanel from '@/components/portfolio/QuickActionPanel';
import InteractiveChart from '@/components/portfolio/InteractiveChart';
import PortfolioWheel from '@/components/portfolio/PortfolioWheel';
import PerformanceCompare from '@/components/portfolio/PerformanceCompare';
import ScenarioSimulator from '@/components/portfolio/ScenarioSimulator';
import GoalTracker from '@/components/portfolio/GoalTracker';
import RiskMeter from '@/components/portfolio/RiskMeter';
import { usePortfolio } from '@/hooks/usePortfolio';
import { useAuth } from '@/contexts/AuthContext';
import { useRiskProfile } from '@/hooks/useRiskProfile';
import { useUserHoldings } from '@/hooks/useUserHoldings';
import { usePortfolioPerformance } from '@/hooks/usePortfolioPerformance';
import { usePortfolioContext } from '@/hooks/usePortfolioContext';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  Brain, 
  TrendingUp, 
  Target, 
  BarChart3, 
  Activity, 
  Crown, 
  AlertCircle, 
  User, 
  MessageSquare,
  PieChart,
  LineChart,
  Calculator,
  Shield
} from 'lucide-react';

const PortfolioImplementation = () => {
  const { activePortfolio, loading } = usePortfolio();
  const { user, loading: authLoading } = useAuth();
  const { riskProfile, loading: riskProfileLoading } = useRiskProfile();
  const { actualHoldings } = useUserHoldings();
  const { performance } = usePortfolioPerformance();
  const { portfolioContext, loading: contextLoading } = usePortfolioContext();
  const navigate = useNavigate();
  const [showOnboarding, setShowOnboarding] = useState(false);
  const [showLoginModal, setShowLoginModal] = useState(false);

  useEffect(() => {
    if (!authLoading && !user) {
      setShowLoginModal(true);
    } else if (user) {
      setShowLoginModal(false);
    }
  }, [user, authLoading]);

  useEffect(() => {
    if (!user || loading) return;
    setShowOnboarding(false);
  }, [user, activePortfolio, loading]);

  const handleQuickChat = (message: string) => {
    if (!riskProfile) return;
    
    if (message.startsWith('NEW_SESSION:')) {
      const [, sessionName, actualMessage] = message.split(':');
      navigate('/ai-chat', {
        state: { createNewSession: true, sessionName, initialMessage: actualMessage }
      });
    } else {
      navigate('/ai-chat');
    }
  };

  const handleQuickAction = (action: string) => {
    const actionMessages = {
      optimize: 'Analysera min portfölj och ge konkreta förslag på hur jag kan optimera den för bättre risk-justerad avkastning',
      rebalance: 'Hjälp mig att rebalansera min portfölj. Vilka innehav borde jag öka eller minska?',
      analyze: 'Gör en djup analys av min portföljs prestanda och ge rekommendationer',
      discover: 'Föreslå några nya aktier som skulle passa bra i min portfölj baserat på min riskprofil',
      risk: 'Utvärdera min portföljs riskexponering och ge råd om förbättringar',
      trends: 'Visa mig de senaste marknadstrenderna och hur de påverkar min portfölj'
    };

    const message = actionMessages[action as keyof typeof actionMessages] || 'Hjälp mig med min portfölj';
    navigate('/ai-chat', {
      state: { createNewSession: true, sessionName: 'Portfolio Action', initialMessage: message }
    });
  };

  const handleActionClick = (action: string) => {
    console.log('Action clicked:', action);
  };

  const handleUpdateProfile = () => {
    setShowOnboarding(true);
  };

  // Show loading while portfolio is loading
  if (loading || riskProfileLoading || contextLoading) {
    return (
      <Layout>
        <div className="min-h-screen bg-gradient-to-br from-primary/5 via-secondary/5 to-accent/5">
          <div className="min-h-screen flex items-center justify-center p-4">
            <div className="text-center p-8 bg-white/80 backdrop-blur-md border border-white/20 rounded-3xl shadow-2xl w-full max-w-sm mx-auto">
              <div className="w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-6 bg-gradient-to-br from-primary to-primary/80 shadow-2xl">
                <div className="w-8 h-8 border-4 border-white border-t-transparent rounded-full animate-spin"></div>
              </div>
              <h2 className="text-xl font-bold mb-2 text-foreground">Laddar din portfölj</h2>
              <p className="text-sm text-muted-foreground">Hämtar dina investeringsdata...</p>
            </div>
          </div>
        </div>
      </Layout>
    );
  }

  // Show onboarding if user explicitly wants to create a profile
  if (showOnboarding) {
    return (
      <Layout>
        <div className="min-h-screen bg-gradient-to-br from-primary/5 via-secondary/5 to-accent/5">
          <div className="min-h-screen py-6 px-4">
            <div className="max-w-5xl mx-auto">
              <div className="text-center mb-8">
                <div className="w-20 h-20 rounded-3xl flex items-center justify-center mx-auto mb-6 bg-gradient-to-br from-primary to-primary/80 shadow-2xl transform rotate-3 hover:rotate-0 transition-transform duration-300">
                  <Brain className="w-10 h-10 text-white" />
                </div>
                <h1 className="text-4xl font-bold mb-4 bg-gradient-to-r from-primary to-primary/70 bg-clip-text text-transparent">
                  Skapa din investeringsprofil
                </h1>
                <p className="text-lg max-w-2xl mx-auto text-muted-foreground px-4">
                  Låt oss skapa din personliga investeringsstrategi genom en kort konversation
                </p>
              </div>
              <ConversationalPortfolioAdvisor />
            </div>
          </div>
        </div>
      </Layout>
    );
  }

  // Get dynamic data for charts
  const sectorData = portfolioContext?.sectorExposure.map(sector => ({
    name: sector.sector,
    value: sector.value
  })) || [];

  const allocationData = activePortfolio?.asset_allocation 
    ? Object.entries(activePortfolio.asset_allocation).map(([key, value]) => ({
        name: key.replace('_', ' ').toUpperCase(),
        value: value as number
      }))
    : [];

  // Get user's investment parameters from risk profile
  const monthlyContribution = riskProfile?.monthly_investment_amount || 5000;
  const expectedReturn = activePortfolio?.expected_return || 7;
  const timeHorizon = riskProfile?.investment_horizon === 'long' ? 25 : 
                     riskProfile?.investment_horizon === 'medium' ? 10 : 5;

  // Main portfolio implementation page
  return (
    <Layout>
      <LoginPromptModal 
        isOpen={showLoginModal} 
        onClose={() => setShowLoginModal(false)} 
      />
      
      <div className="min-h-screen bg-gradient-to-br from-primary/5 via-secondary/5 to-accent/5">
        <div className="container mx-auto px-4 py-6 max-w-[1400px]">
          {/* Modern Header */}
          <ModernPortfolioHeader activePortfolio={activePortfolio} />

          {/* Risk Profile Required Alert */}
          {user && !riskProfile && (
            <Alert className="mb-6 border-amber-200 bg-amber-50/80 backdrop-blur-md dark:border-amber-800 dark:bg-amber-950/20">
              <AlertCircle className="h-4 w-4 text-amber-600 dark:text-amber-500" />
              <AlertDescription className="text-amber-800 dark:text-amber-200">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                  <div className="flex items-center gap-2 min-w-0 flex-1">
                    <MessageSquare className="w-4 h-4 flex-shrink-0" />
                    <span className="font-medium text-sm">Skapa en riskprofil för att få tillgång till AI-chatten och personliga rekommendationer</span>
                  </div>
                  <Button
                    onClick={() => navigate('/portfolio-advisor')}
                    size="sm"
                    className="bg-amber-600 hover:bg-amber-700 text-white flex-shrink-0"
                  >
                    <User className="w-4 h-4 mr-2" />
                    Skapa profil
                  </Button>
                </div>
              </AlertDescription>
            </Alert>
          )}

          <Tabs defaultValue="dashboard" className="w-full">
            <TabsList className="grid w-full grid-cols-6 max-w-3xl mx-auto mb-8 bg-white/80 backdrop-blur-md p-1 rounded-2xl h-auto shadow-lg">
              <TabsTrigger 
                value="dashboard" 
                className="flex items-center gap-2 rounded-xl py-3 px-4 font-medium transition-all duration-200 data-[state=active]:bg-primary data-[state=active]:text-white data-[state=active]:shadow-md text-sm"
              >
                <BarChart3 className="w-4 h-4" />
                <span className="hidden xs:inline">Dashboard</span>
              </TabsTrigger>
              <TabsTrigger 
                value="insights" 
                className="flex items-center gap-2 rounded-xl py-3 px-4 font-medium transition-all duration-200 data-[state=active]:bg-primary data-[state=active]:text-white data-[state=active]:shadow-md text-sm"
              >
                <PieChart className="w-4 h-4" />
                <span className="hidden xs:inline">Insikter</span>
              </TabsTrigger>
              <TabsTrigger 
                value="performance" 
                className="flex items-center gap-2 rounded-xl py-3 px-4 font-medium transition-all duration-200 data-[state=active]:bg-primary data-[state=active]:text-white data-[state=active]:shadow-md text-sm"
              >
                <LineChart className="w-4 h-4" />
                <span className="hidden xs:inline">Prestanda</span>
              </TabsTrigger>
              <TabsTrigger 
                value="planning" 
                className="flex items-center gap-2 rounded-xl py-3 px-4 font-medium transition-all duration-200 data-[state=active]:bg-primary data-[state=active]:text-white data-[state=active]:shadow-md text-sm"
              >
                <Target className="w-4 h-4" />
                <span className="hidden xs:inline">Planering</span>
              </TabsTrigger>
              <TabsTrigger 
                value="risk" 
                className="flex items-center gap-2 rounded-xl py-3 px-4 font-medium transition-all duration-200 data-[state=active]:bg-primary data-[state=active]:text-white data-[state=active]:shadow-md text-sm"
              >
                <Shield className="w-4 h-4" />
                <span className="hidden xs:inline">Risk</span>
              </TabsTrigger>
              <TabsTrigger 
                value="membership" 
                className="flex items-center gap-2 rounded-xl py-3 px-4 font-medium transition-all duration-200 data-[state=active]:bg-primary data-[state=active]:text-white data-[state=active]:shadow-md text-sm"
              >
                <Crown className="w-4 h-4" />
                <span className="hidden xs:inline">Plan</span>
              </TabsTrigger>
            </TabsList>
            
            <TabsContent value="dashboard" className="mt-0">
              <div className="grid grid-cols-1 xl:grid-cols-5 gap-6">
                <div className="xl:col-span-3 space-y-6">
                  <EnhancedPortfolioDashboard 
                    portfolio={activePortfolio} 
                    recommendations={[]}
                  />
                  <InteractivePortfolio 
                    portfolio={activePortfolio}
                    onQuickChat={handleQuickChat}
                  />
                </div>
                <div className="xl:col-span-2 space-y-6">
                  <QuickActionPanel onAction={handleQuickAction} />
                  <UserInsightsPanel />
                </div>
              </div>
            </TabsContent>

            <TabsContent value="insights" className="mt-0">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <InteractiveChart 
                  data={sectorData}
                  title="Sektorfördelning"
                  type="pie"
                />
                <PortfolioWheel 
                  portfolio={activePortfolio}
                  actualHoldings={actualHoldings}
                />
                <InteractiveChart 
                  data={allocationData}
                  title="Tillgångsallokering"
                  type="bar"
                />
                <div className="space-y-6">
                  <QuickActionPanel onAction={handleQuickAction} />
                </div>
              </div>
            </TabsContent>

            <TabsContent value="performance" className="mt-0">
              <div className="space-y-6">
                <PerformanceCompare performance={performance} />
                <div className="grid grid-cols-1 xl:grid-cols-4 gap-6">
                  <div className="xl:col-span-3">
                    <EnhancedPortfolioDashboard 
                      portfolio={activePortfolio} 
                      recommendations={[]}
                    />
                  </div>
                  <div className="xl:col-span-1">
                    <UserInsightsPanel />
                  </div>
                </div>
              </div>
            </TabsContent>

            <TabsContent value="planning" className="mt-0">
              <div className="space-y-6">
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  <ScenarioSimulator
                    currentValue={performance.totalPortfolioValue}
                    monthlyContribution={monthlyContribution}
                    expectedReturn={expectedReturn}
                    timeHorizon={timeHorizon}
                  />
                  <GoalTracker
                    currentPortfolioValue={performance.totalPortfolioValue}
                    monthlyContribution={monthlyContribution}
                  />
                </div>
                <div className="grid grid-cols-1 xl:grid-cols-4 gap-6">
                  <div className="xl:col-span-3">
                    <InteractiveChart 
                      data={sectorData}
                      title="Framtida allokering"
                      type="pie"
                    />
                  </div>
                  <div className="xl:col-span-1">
                    <QuickActionPanel onAction={handleQuickAction} />
                  </div>
                </div>
              </div>
            </TabsContent>

            <TabsContent value="risk" className="mt-0">
              <div className="space-y-6">
                {portfolioContext && (
                  <RiskMeter
                    sectorExposure={portfolioContext.sectorExposure}
                    holdings={portfolioContext.holdings}
                    totalValue={portfolioContext.totalPortfolioValue}
                  />
                )}
                <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
                  <div className="xl:col-span-2">
                    <InteractiveChart 
                      data={sectorData}
                      title="Riskexponering per sektor"
                      type="bar"
                    />
                  </div>
                  <div className="xl:col-span-1">
                    <QuickActionPanel onAction={handleQuickAction} />
                  </div>
                </div>
              </div>
            </TabsContent>

            <TabsContent value="membership" className="mt-0">
              <div className="max-w-2xl mx-auto">
                <div className="mb-6 text-center">
                  <h2 className="text-3xl font-bold mb-2 bg-gradient-to-r from-primary to-primary/70 bg-clip-text text-transparent">
                    Medlemskap & Prenumeration
                  </h2>
                  <p className="text-base text-muted-foreground">Hantera din plan och få tillgång till avancerade funktioner</p>
                </div>
                <SubscriptionCard />
              </div>
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </Layout>
  );
};

export default PortfolioImplementation;
