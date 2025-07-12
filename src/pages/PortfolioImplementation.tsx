
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Layout from '@/components/Layout';
import PortfolioOverview from '@/components/PortfolioOverview';
import UserInsightsPanel from '@/components/UserInsightsPanel';
import ConversationalPortfolioAdvisor from '@/components/ConversationalPortfolioAdvisor';
import UserInvestmentAnalysis from '@/components/UserInvestmentAnalysis';
import SubscriptionCard from '@/components/SubscriptionCard';
import LoginPromptModal from '@/components/LoginPromptModal';
import { usePortfolio } from '@/hooks/usePortfolio';
import { useAuth } from '@/contexts/AuthContext';
import { useRiskProfile } from '@/hooks/useRiskProfile';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Brain, TrendingUp, Target, BarChart3, Activity, Crown, AlertCircle, User, MessageSquare } from 'lucide-react';

const PortfolioImplementation = () => {
  const { activePortfolio, loading } = usePortfolio();
  const { user } = useAuth();
  const { riskProfile, loading: riskProfileLoading } = useRiskProfile();
  const navigate = useNavigate();
  const [showOnboarding, setShowOnboarding] = useState(false);
  const [showLoginModal, setShowLoginModal] = useState(false);

  useEffect(() => {
    if (!user && !loading) {
      // Show login modal for unauthenticated users
      setShowLoginModal(true);
    }
  }, [user, loading]);

  useEffect(() => {
    if (!user || loading) return;

    // Only show onboarding if there's no active portfolio AND user wants to create one
    // For now, we'll always show the main page layout
    setShowOnboarding(false);
  }, [user, activePortfolio, loading]);

  const handleQuickChat = (message: string) => {
    if (!riskProfile) {
      // Don't navigate to chat if no risk profile
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
          <div className="text-center p-4 sm:p-6 lg:p-8 bg-white dark:bg-gray-800 backdrop-blur-lg border border-gray-200 dark:border-gray-700 rounded-2xl sm:rounded-3xl shadow-2xl w-full max-w-sm mx-auto">
            <div className="w-12 h-12 sm:w-14 sm:h-14 lg:w-16 lg:h-16 rounded-xl sm:rounded-2xl flex items-center justify-center mx-auto mb-3 sm:mb-4 lg:mb-6 bg-primary shadow-2xl">
              <div className="w-6 h-6 sm:w-7 sm:h-7 lg:w-8 lg:h-8 border-4 border-white border-t-transparent rounded-full animate-spin"></div>
            </div>
            <h2 className="text-base sm:text-lg lg:text-xl font-semibold mb-1 sm:mb-2 text-foreground">Laddar din portfölj</h2>
            <p className="text-sm sm:text-base text-muted-foreground">Hämtar dina investeringsdata...</p>
          </div>
        </div>
      </Layout>
    );
  }

  // Show onboarding if user explicitly wants to create a profile
  if (showOnboarding) {
    return (
      <Layout>
        <div className="min-h-screen py-4 sm:py-6 lg:py-8 px-4">
          <div className="max-w-5xl mx-auto">
            <div className="text-center mb-4 sm:mb-6 lg:mb-8">
              <div className="w-12 h-12 sm:w-16 sm:h-16 lg:w-20 lg:h-20 rounded-2xl sm:rounded-3xl flex items-center justify-center mx-auto mb-3 sm:mb-4 lg:mb-6 bg-primary shadow-2xl transform rotate-3 hover:rotate-0 transition-transform duration-300">
                <Brain className="w-6 h-6 sm:w-8 sm:h-8 lg:w-10 lg:h-10 text-primary-foreground" />
              </div>
              <h1 className="text-xl sm:text-2xl lg:text-3xl xl:text-4xl font-bold mb-2 sm:mb-3 lg:mb-4 text-foreground">
                Skapa din investeringsprofil
              </h1>
              <p className="text-sm sm:text-base lg:text-lg max-w-2xl mx-auto text-muted-foreground px-4">
                Låt oss skapa din personliga investeringsstrategi genom en kort konversation
              </p>
            </div>
            <ConversationalPortfolioAdvisor />
          </div>
        </div>
      </Layout>
    );
  }

  // Always show portfolio implementation page with tabs - Always show PortfolioOverview
  return (
    <Layout>
      <LoginPromptModal 
        isOpen={showLoginModal} 
        onClose={() => setShowLoginModal(false)} 
      />
      
      <div className="min-h-screen">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-6 lg:py-8 max-w-[1400px]">
          {/* Modern Header - Mobile Optimized */}
          <div className="mb-4 sm:mb-6">
            <div className="flex flex-col gap-3 sm:gap-4 mb-4 sm:mb-6">
              <div className="space-y-2 sm:space-y-3">
                <div className="flex items-center gap-2 sm:gap-3">
                  <div className="w-8 h-8 sm:w-10 sm:h-10 lg:w-12 lg:h-12 rounded-lg sm:rounded-xl flex items-center justify-center bg-primary shadow-lg flex-shrink-0">
                    <Brain className="w-4 h-4 sm:w-5 sm:h-5 lg:w-6 lg:h-6 text-primary-foreground" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <h1 className="text-lg sm:text-xl lg:text-2xl xl:text-3xl font-bold mb-0.5 sm:mb-1 text-foreground truncate">
                      AI Portfolio Hub
                    </h1>
                    <p className="text-xs sm:text-sm lg:text-base text-muted-foreground truncate">
                      Intelligenta investeringsinsikter för din framgång
                    </p>
                  </div>
                </div>
                
                <div className="flex flex-wrap gap-1 sm:gap-1.5 lg:gap-2">
                  <Badge className="px-2 py-0.5 sm:px-2.5 sm:py-1 text-xs font-medium bg-primary text-primary-foreground border-0 shadow-sm flex-shrink-0">
                    <Brain className="w-2.5 h-2.5 sm:w-3 sm:h-3 mr-1 flex-shrink-0" />
                    <span className="truncate">AI-Optimerad</span>
                  </Badge>
                  <Badge className="px-2 py-0.5 sm:px-2.5 sm:py-1 text-xs font-medium bg-secondary text-secondary-foreground border-0 shadow-sm flex-shrink-0">
                    <Activity className="w-2.5 h-2.5 sm:w-3 sm:h-3 mr-1 flex-shrink-0" />
                    <span className="truncate">Realtidsanalys</span>
                  </Badge>
                  {activePortfolio && (
                    <Badge className="px-2 py-0.5 sm:px-2.5 sm:py-1 text-xs font-medium bg-accent text-accent-foreground border-0 shadow-sm flex-shrink-0 max-w-[200px]">
                      <Target className="w-2.5 h-2.5 sm:w-3 sm:h-3 mr-1 flex-shrink-0" />
                      <span className="hidden sm:inline truncate">Aktiv sedan {new Date(activePortfolio.created_at).toLocaleDateString('sv-SE')}</span>
                      <span className="sm:hidden truncate">Aktiv</span>
                    </Badge>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Risk Profile Required Alert */}
          {user && !riskProfile && (
            <Alert className="mb-4 sm:mb-6 border-amber-200 bg-amber-50 dark:border-amber-800 dark:bg-amber-950/20">
              <AlertCircle className="h-4 w-4 text-amber-600 dark:text-amber-500 flex-shrink-0" />
              <AlertDescription className="text-amber-800 dark:text-amber-200">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 sm:gap-4">
                  <div className="flex items-center gap-2 min-w-0 flex-1">
                    <MessageSquare className="w-4 h-4 flex-shrink-0" />
                    <span className="font-medium text-sm sm:text-base">Skapa en riskprofil för att få tillgång till AI-chatten och personliga rekommendationer</span>
                  </div>
                  <Button
                    onClick={() => navigate('/portfolio-advisor')}
                    size="sm"
                    className="bg-amber-600 hover:bg-amber-700 text-white flex-shrink-0 w-full sm:w-auto"
                  >
                    <User className="w-4 h-4 mr-2 flex-shrink-0" />
                    <span className="truncate">Skapa profil</span>
                  </Button>
                </div>
              </AlertDescription>
            </Alert>
          )}

          <Tabs defaultValue="overview" className="w-full">
            <TabsList className="grid w-full grid-cols-3 max-w-md sm:max-w-xl mx-auto mb-4 sm:mb-6 bg-muted p-1 rounded-xl h-auto">
              <TabsTrigger 
                value="overview" 
                className="flex items-center gap-1 sm:gap-1.5 lg:gap-2 rounded-lg py-2 sm:py-2.5 px-2 sm:px-3 font-medium transition-all duration-200 data-[state=active]:bg-background data-[state=active]:shadow-sm text-xs sm:text-sm min-w-0"
              >
                <BarChart3 className="w-3.5 h-3.5 sm:w-4 sm:h-4 flex-shrink-0" />
                <span className="hidden xs:inline truncate">Portfölj</span>
                <span className="xs:hidden truncate">Översikt</span>
              </TabsTrigger>
              <TabsTrigger 
                value="analysis" 
                className="flex items-center gap-1 sm:gap-1.5 lg:gap-2 rounded-lg py-2 sm:py-2.5 px-2 sm:px-3 font-medium transition-all duration-200 data-[state=active]:bg-background data-[state=active]:shadow-sm text-xs sm:text-sm min-w-0"
              >
                <Brain className="w-3.5 h-3.5 sm:w-4 sm:h-4 flex-shrink-0" />
                <span className="hidden xs:inline truncate">Min Analys</span>
                <span className="xs:hidden truncate">Analys</span>
              </TabsTrigger>
              <TabsTrigger 
                value="membership" 
                className="flex items-center gap-1 sm:gap-1.5 lg:gap-2 rounded-lg py-2 sm:py-2.5 px-2 sm:px-3 font-medium transition-all duration-200 data-[state=active]:bg-background data-[state=active]:shadow-sm text-xs sm:text-sm min-w-0"
              >
                <Crown className="w-3.5 h-3.5 sm:w-4 sm:h-4 flex-shrink-0" />
                <span className="hidden xs:inline truncate">Medlemskap</span>
                <span className="xs:hidden truncate">Plan</span>
              </TabsTrigger>
            </TabsList>
            
            <TabsContent value="overview" className="mt-0">
              <div className="grid grid-cols-1 xl:grid-cols-4 gap-4 sm:gap-6">
                <div className="xl:col-span-3 min-w-0">
                  <PortfolioOverview 
                    portfolio={activePortfolio}
                    onQuickChat={handleQuickChat}
                    onActionClick={handleActionClick}
                  />
                </div>
                <div className="xl:col-span-1 min-w-0">
                  <UserInsightsPanel />
                </div>
              </div>
            </TabsContent>

            <TabsContent value="analysis" className="mt-0">
              <div className="min-w-0">
                <UserInvestmentAnalysis onUpdateProfile={handleUpdateProfile} />
              </div>
            </TabsContent>

            <TabsContent value="membership" className="mt-0">
              <div className="max-w-2xl mx-auto min-w-0">
                <div className="mb-4 sm:mb-6 text-center">
                  <h2 className="text-xl sm:text-2xl font-bold mb-2 text-foreground">Medlemskap & Prenumeration</h2>
                  <p className="text-sm sm:text-base text-muted-foreground">Hantera din plan och få tillgång till avancerade funktioner</p>
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
