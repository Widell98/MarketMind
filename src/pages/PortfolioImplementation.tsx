import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Layout from '@/components/Layout';
import PortfolioOverview from '@/components/PortfolioOverview';
import UserInsightsPanel from '@/components/UserInsightsPanel';
import ConversationalPortfolioAdvisor from '@/components/ConversationalPortfolioAdvisor';
import UserInvestmentAnalysis from '@/components/UserInvestmentAnalysis';
import SubscriptionCard from '@/components/SubscriptionCard';
import LoginPromptModal from '@/components/LoginPromptModal';
import PortfolioValueCards from '@/components/PortfolioValueCards';
import { usePortfolio } from '@/hooks/usePortfolio';
import { useAuth } from '@/contexts/AuthContext';
import { useRiskProfile } from '@/hooks/useRiskProfile';
import { usePortfolioPerformance } from '@/hooks/usePortfolioPerformance';
import { useCashHoldings } from '@/hooks/useCashHoldings';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Brain, TrendingUp, Target, BarChart3, Activity, Crown, AlertCircle, User, MessageSquare, Clock } from 'lucide-react';
import PortfolioHealthScore from '@/components/PortfolioHealthScore';
import FloatingActionButton from '@/components/FloatingActionButton';

const PortfolioImplementation = () => {
  const { actualHoldings } = usePortfolio();
  const { activePortfolio, loading } = usePortfolio();
  const { user, loading: authLoading } = useAuth();
  const { riskProfile, loading: riskProfileLoading } = useRiskProfile();
  const { performance } = usePortfolioPerformance();
  const { totalCash } = useCashHoldings();
  const navigate = useNavigate();
  const [showOnboarding, setShowOnboarding] = useState(false);
  const [showLoginModal, setShowLoginModal] = useState(false);
  const [lastUpdated, setLastUpdated] = useState<string | null>(null);

  useEffect(() => {
    // Only show login modal if auth has finished loading and user is not authenticated
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

  useEffect(() => {
    // Set last updated time
    setLastUpdated(new Date().toLocaleTimeString('sv-SE', {
      hour: '2-digit',
      minute: '2-digit'
    }));
  }, [performance, totalCash]);

  const handleQuickChat = (message: string) => {
    if (!riskProfile) {
      return;
    }
    
    if (message.startsWith('NEW_SESSION:')) {
      const [, sessionName, actualMessage] = message.split(':');
      navigate('/ai-chat', {
        state: { createNewSession: true, sessionName, initialMessage: actualMessage }
      });
    } else {
      navigate('/ai-chat');
    }
  };

  const handleActionClick = (action: string) => {
    console.log('Action clicked:', action);
  };

  const handleUpdateProfile = () => {
    setShowOnboarding(true);
  };

  // Show loading while portfolio is loading
  if (loading || riskProfileLoading) {
    return (
      <Layout>
        <div className="min-h-screen flex items-center justify-center p-4">
          <div className="text-center p-6 bg-white dark:bg-gray-800 backdrop-blur-lg border border-gray-200 dark:border-gray-700 rounded-2xl shadow-2xl w-full max-w-sm mx-auto">
            <div className="w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-6 bg-primary shadow-2xl">
              <div className="w-8 h-8 border-4 border-white border-t-transparent rounded-full animate-spin"></div>
            </div>
            <h2 className="text-lg font-semibold mb-2 text-foreground">Laddar din portfölj</h2>
            <p className="text-sm text-muted-foreground">Hämtar dina investeringsdata...</p>
          </div>
        </div>
      </Layout>
    );
  }

  // Show onboarding if user explicitly wants to create a profile
  if (showOnboarding) {
    return (
      <Layout>
        <div className="min-h-screen py-6 px-4">
          <div className="max-w-5xl mx-auto">
            <div className="text-center mb-8">
              <div className="w-20 h-20 rounded-3xl flex items-center justify-center mx-auto mb-6 bg-primary shadow-2xl transform rotate-3 hover:rotate-0 transition-transform duration-300">
                <Brain className="w-10 h-10 text-primary-foreground" />
              </div>
              <h1 className="text-3xl font-bold mb-4 text-foreground">
                Skapa din investeringsprofil
              </h1>
              <p className="text-lg max-w-2xl mx-auto text-muted-foreground px-4">
                Låt oss skapa din personliga investeringsstrategi genom en kort konversation
              </p>
            </div>
            <ConversationalPortfolioAdvisor />
          </div>
        </div>
      </Layout>
    );
  }

  const totalPortfolioValue = performance.totalPortfolioValue + totalCash;
  const investedValue = performance.totalValue;

  // Calculate portfolio health metrics
  const calculateHealthMetrics = () => {
    const totalHoldings = actualHoldings.length;
    const uniqueSectors = new Set(actualHoldings.filter(h => h.sector).map(h => h.sector)).size;
    
    return {
      diversificationScore: Math.min(100, (uniqueSectors / Math.max(1, totalHoldings)) * 100 + 20),
      riskScore: Math.max(20, 100 - (totalCash / Math.max(1, totalPortfolioValue)) * 200),
      performanceScore: 75, // Mock performance score
      cashPercentage: totalPortfolioValue > 0 ? (totalCash / totalPortfolioValue) * 100 : 0
    };
  };

  const healthMetrics = calculateHealthMetrics();

  // Always show portfolio implementation page with tabs
  return (
    <Layout>
      <LoginPromptModal 
        isOpen={showLoginModal} 
        onClose={() => setShowLoginModal(false)} 
      />
      
      <div className="min-h-screen bg-background">
        <div className="container mx-auto px-4 py-6 max-w-[1400px]">
          {/* Modern Header */}
          <div className="mb-6">
            <div className="flex flex-col gap-4 mb-6">
              <div className="space-y-3">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-xl flex items-center justify-center bg-primary shadow-lg flex-shrink-0">
                    <Brain className="w-6 h-6 text-primary-foreground" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <h1 className="text-2xl md:text-3xl font-bold mb-1 text-foreground">
                      Portfolio Analys
                    </h1>
                    <p className="text-sm md:text-base text-muted-foreground">
                      Analysera och förstå din investeringsportfölj
                    </p>
                  </div>
                  {lastUpdated && (
                    <div className="hidden sm:flex items-center gap-2 text-sm text-muted-foreground bg-muted px-3 py-2 rounded-lg">
                      <Clock className="w-4 h-4" />
                      <span>Uppdaterad {lastUpdated}</span>
                    </div>
                  )}
                </div>
                
                <div className="flex flex-wrap gap-2">
                  <Badge className="px-3 py-1 text-xs font-medium bg-primary text-primary-foreground border-0 shadow-sm">
                    <Brain className="w-3 h-3 mr-1" />
                    AI-Analys
                  </Badge>
                  <Badge className="px-3 py-1 text-xs font-medium bg-secondary text-secondary-foreground border-0 shadow-sm">
                    <Activity className="w-3 h-3 mr-1" />
                    Realtidsdata
                  </Badge>
                  {activePortfolio && (
                    <Badge className="px-3 py-1 text-xs font-medium bg-accent text-accent-foreground border-0 shadow-sm">
                      <Target className="w-3 h-3 mr-1" />
                      <span className="hidden sm:inline">Aktiv sedan {new Date(activePortfolio.created_at).toLocaleDateString('sv-SE')}</span>
                      <span className="sm:hidden">Aktiv</span>
                    </Badge>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Portfolio Health Score */}
          {user && totalPortfolioValue > 0 && (
            <div className="mb-6">
              <PortfolioHealthScore
                totalValue={totalPortfolioValue}
                diversificationScore={healthMetrics.diversificationScore}
                riskScore={healthMetrics.riskScore}
                performanceScore={healthMetrics.performanceScore}
                cashPercentage={healthMetrics.cashPercentage}
              />
            </div>
          )}

          {/* Portfolio Value Cards */}
          <PortfolioValueCards
            totalPortfolioValue={totalPortfolioValue}
            totalInvestedValue={investedValue}
            totalCashValue={totalCash}
            loading={loading}
          />

          {/* Risk Profile Required Alert */}
          {user && !riskProfile && (
            <Alert className="mb-6 border-amber-200 bg-amber-50 dark:border-amber-800 dark:bg-amber-950/20">
              <AlertCircle className="h-4 w-4 text-amber-600 dark:text-amber-500" />
              <AlertDescription className="text-amber-800 dark:text-amber-200">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                  <div className="flex items-center gap-2 min-w-0 flex-1">
                    <MessageSquare className="w-4 h-4 flex-shrink-0" />
                    <span className="font-medium text-sm">Skapa en riskprofil för AI-analys och personliga rekommendationer</span>
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

          <Tabs defaultValue="overview" className="w-full">
            <TabsList className="grid w-full grid-cols-3 max-w-xl mx-auto mb-6 bg-muted p-1 rounded-xl h-auto">
              <TabsTrigger 
                value="overview" 
                className="flex items-center gap-2 rounded-lg py-3 px-4 font-medium transition-all duration-200 data-[state=active]:bg-background data-[state=active]:shadow-sm text-sm"
              >
                <BarChart3 className="w-4 h-4" />
                <span className="hidden xs:inline">Portfölj</span>
                <span className="xs:hidden">Översikt</span>
              </TabsTrigger>
              <TabsTrigger 
                value="analysis" 
                className="flex items-center gap-2 rounded-lg py-3 px-4 font-medium transition-all duration-200 data-[state=active]:bg-background data-[state=active]:shadow-sm text-sm"
              >
                <Brain className="w-4 h-4" />
                <span className="hidden xs:inline">Riskprofil</span>
                <span className="xs:hidden">Analys</span>
              </TabsTrigger>
              <TabsTrigger 
                value="membership" 
                className="flex items-center gap-2 rounded-lg py-3 px-4 font-medium transition-all duration-200 data-[state=active]:bg-background data-[state=active]:shadow-sm text-sm"
              >
                <Crown className="w-4 h-4" />
                <span className="hidden xs:inline">Medlemskap</span>
                <span className="xs:hidden">Plan</span>
              </TabsTrigger>
            </TabsList>
            
            <TabsContent value="overview" className="mt-0">
              <div className="grid grid-cols-1 xl:grid-cols-4 gap-6">
                <div className="xl:col-span-3">
                  <PortfolioOverview 
                    portfolio={activePortfolio}
                    onQuickChat={handleQuickChat}
                    onActionClick={handleActionClick}
                  />
                </div>
                <div className="xl:col-span-1">
                  <UserInsightsPanel />
                </div>
              </div>
            </TabsContent>

            <TabsContent value="analysis" className="mt-0">
              <UserInvestmentAnalysis onUpdateProfile={handleUpdateProfile} />
            </TabsContent>

            <TabsContent value="membership" className="mt-0">
              <div className="max-w-2xl mx-auto">
                <div className="mb-6 text-center">
                  <h2 className="text-2xl font-bold mb-2 text-foreground">Medlemskap & Prenumeration</h2>
                  <p className="text-base text-muted-foreground">Hantera din plan och få tillgång till avancerade funktioner</p>
                </div>
                <SubscriptionCard />
              </div>
            </TabsContent>
          </Tabs>
        </div>
      </div>

      {/* Floating Action Button */}
      <FloatingActionButton />
    </Layout>
  );
};

export default PortfolioImplementation;
