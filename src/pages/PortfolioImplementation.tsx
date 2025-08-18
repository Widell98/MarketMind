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
import CommunityRecommendations from '@/components/CommunityRecommendations';
import { usePortfolio } from '@/hooks/usePortfolio';
import { useUserHoldings } from '@/hooks/useUserHoldings';
import { useAuth } from '@/contexts/AuthContext';
import { useRiskProfile } from '@/hooks/useRiskProfile';
import { usePortfolioPerformance } from '@/hooks/usePortfolioPerformance';
import { useCashHoldings } from '@/hooks/useCashHoldings';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Brain, TrendingUp, Target, BarChart3, Activity, AlertCircle, User, MessageSquare, Clock } from 'lucide-react';
import PortfolioHealthScore from '@/components/PortfolioHealthScore';
import FloatingActionButton from '@/components/FloatingActionButton';
import Breadcrumb from '@/components/Breadcrumb';

const PortfolioImplementation = () => {
  const { actualHoldings } = useUserHoldings();
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

  // Calculate portfolio health metrics - fix the actualHoldings check
  const calculateHealthMetrics = () => {
    const totalHoldings = actualHoldings ? actualHoldings.length : 0;
    const uniqueSectors = actualHoldings && actualHoldings.length > 0 
      ? new Set(actualHoldings.filter(h => h.sector).map(h => h.sector)).size 
      : 0;
    
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
      
      <div className="min-h-screen bg-gradient-to-br from-background to-secondary/5">
        <div className="container mx-auto px-6 py-12 max-w-7xl">
          {/* Breadcrumb Navigation */}
          <div className="mb-8">
            <Breadcrumb />
          </div>
          
          {/* Clean Header */}
          <div className="text-center mb-16">
            <div className="w-20 h-20 rounded-3xl flex items-center justify-center mx-auto mb-8 bg-primary/10 border border-primary/20 shadow-lg">
              <Brain className="w-10 h-10 text-primary" />
            </div>
            <h1 className="text-4xl font-bold mb-4 text-foreground">
              Portfolio Analys
            </h1>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              Analysera och förstå din investeringsportfölj med AI-driven insikter
            </p>
            
            <div className="flex flex-wrap justify-center gap-3 mt-8">
              <Badge className="px-4 py-2 text-sm font-medium bg-primary/10 text-primary border border-primary/20 hover:bg-primary/20 transition-colors">
                <Brain className="w-4 h-4 mr-2" />
                AI-Analys
              </Badge>
              <Badge className="px-4 py-2 text-sm font-medium bg-secondary/50 text-secondary-foreground border border-secondary/30 hover:bg-secondary/70 transition-colors">
                <Activity className="w-4 h-4 mr-2" />
                Realtidsdata
              </Badge>
              {lastUpdated && (
                <Badge className="px-4 py-2 text-sm font-medium bg-muted/50 text-muted-foreground border border-muted/30 hover:bg-muted/70 transition-colors">
                  <Clock className="w-4 h-4 mr-2" />
                  Uppdaterad {lastUpdated}
                </Badge>
              )}
            </div>
          </div>

          {/* Portfolio Health Score */}
          {user && totalPortfolioValue > 0 && (
            <div className="mb-12">
              <div className="bg-white/70 dark:bg-card/70 backdrop-blur-xl border border-border/50 rounded-3xl p-8 shadow-xl">
                <PortfolioHealthScore
                  totalValue={totalPortfolioValue}
                  diversificationScore={healthMetrics.diversificationScore}
                  riskScore={healthMetrics.riskScore}
                  performanceScore={healthMetrics.performanceScore}
                  cashPercentage={healthMetrics.cashPercentage}
                />
              </div>
            </div>
          )}

          {/* Portfolio Value Cards */}
          <div className="mb-12">
            <PortfolioValueCards
              totalPortfolioValue={totalPortfolioValue}
              totalInvestedValue={investedValue}
              totalCashValue={totalCash}
              loading={loading}
            />
          </div>

          {/* Risk Profile Required Alert */}
          {user && !riskProfile && (
            <div className="mb-12">
              <div className="bg-amber-50/70 dark:bg-amber-950/20 backdrop-blur-xl border border-amber-200/50 dark:border-amber-800/50 rounded-3xl p-8 shadow-xl">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-6">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-2xl bg-amber-100 dark:bg-amber-900/50 flex items-center justify-center">
                      <AlertCircle className="w-6 h-6 text-amber-600 dark:text-amber-400" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-amber-800 dark:text-amber-200 mb-1">
                        Skapa din riskprofil
                      </h3>
                      <p className="text-amber-700 dark:text-amber-300">
                        Få AI-analys och personliga rekommendationer baserat på din investeringsstil
                      </p>
                    </div>
                  </div>
                  <Button
                    onClick={() => navigate('/portfolio-advisor')}
                    className="bg-primary hover:bg-primary/90 text-primary-foreground rounded-2xl px-6 py-3 shadow-lg hover:shadow-xl transition-all duration-200"
                  >
                    <User className="w-4 h-4 mr-2" />
                    Skapa profil
                  </Button>
                </div>
              </div>
            </div>
          )}

          <div className="grid grid-cols-1 xl:grid-cols-4 gap-8">
            <div className="xl:col-span-3 space-y-8">
              <div className="bg-white/70 dark:bg-card/70 backdrop-blur-xl border border-border/50 rounded-3xl shadow-xl overflow-hidden">
                <PortfolioOverview 
                  portfolio={activePortfolio}
                  onQuickChat={handleQuickChat}
                  onActionClick={handleActionClick}
                />
              </div>
              
              <div className="bg-white/70 dark:bg-card/70 backdrop-blur-xl border border-border/50 rounded-3xl shadow-xl overflow-hidden">
                <CommunityRecommendations />
              </div>
            </div>
            <div className="xl:col-span-1">
              <div className="bg-white/70 dark:bg-card/70 backdrop-blur-xl border border-border/50 rounded-3xl shadow-xl overflow-hidden">
                <UserInsightsPanel />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Floating Action Button */}
      <FloatingActionButton />
    </Layout>
  );
};

export default PortfolioImplementation;
