import React, { useState, useEffect, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Brain, MessageSquare, BarChart3, Settings, Zap, TrendingUp, Lightbulb, CreditCard, Activity, Target, History } from 'lucide-react';
import Layout from '@/components/Layout';
import EnhancedRiskAssessmentForm from '@/components/EnhancedRiskAssessmentForm';
import PortfolioOverview from '@/components/PortfolioOverview';
import PortfolioHealthScore from '@/components/PortfolioHealthScore';
import PerformanceAttribution from '@/components/PerformanceAttribution';
import ScenarioAnalysis from '@/components/ScenarioAnalysis';
import SubscriptionCard from '@/components/SubscriptionCard';
import ChatHistory from '@/components/ChatHistory';
import { useRiskProfile } from '@/hooks/useRiskProfile';
import { usePortfolio } from '@/hooks/usePortfolio';
import { useAuth } from '@/contexts/AuthContext';
import AIChat from '@/components/AIChat';
import AIInsightsPanel from '@/components/AIInsightsPanel';
import PredictiveAnalytics from '@/components/PredictiveAnalytics';
import { useAIChat } from '@/hooks/useAIChat';

const PortfolioAdvisor = () => {
  const { user } = useAuth();
  const { riskProfile, loading: profileLoading, refetch: refetchRiskProfile } = useRiskProfile();
  const { activePortfolio, recommendations, loading: portfolioLoading, generatePortfolio } = usePortfolio();
  const [showAssessment, setShowAssessment] = useState(false);
  const [activeTab, setActiveTab] = useState('overview');
  const portfolioGeneratedForProfile = useRef<string | null>(null);

  // Enhanced AI Chat integration
  const { 
    sessions, 
    sendMessage, 
    loadSession,
    createNewSession 
  } = useAIChat(activePortfolio?.id);

  useEffect(() => {
    if (
      riskProfile?.id && 
      !activePortfolio && 
      !portfolioLoading && 
      portfolioGeneratedForProfile.current !== riskProfile.id
    ) {
      console.log('Auto-generating portfolio for newly available risk profile:', riskProfile.id);
      portfolioGeneratedForProfile.current = riskProfile.id;
      generatePortfolio(riskProfile.id);
    }
  }, [riskProfile?.id, activePortfolio, portfolioLoading, generatePortfolio]);

  const handleAssessmentComplete = async (signal: string) => {
    console.log('Assessment completed with signal:', signal);
    
    if (signal === 'profile-created') {
      console.log('Refetching risk profile after creation...');
      
      setTimeout(async () => {
        const updatedProfile = await refetchRiskProfile();
        if (updatedProfile?.id) {
          console.log('Generating portfolio for updated risk profile:', updatedProfile.id);
          portfolioGeneratedForProfile.current = updatedProfile.id;
          await generatePortfolio(updatedProfile.id);
          setShowAssessment(false);
        } else {
          console.log('Risk profile still not available after refetch');
        }
      }, 1500);
    }
  };

  const handleQuickChat = async (message: string) => {
    await sendMessage(message);
  };

  const handleActionClick = (action: string) => {
    const actionMessages = {
      'rebalance': 'Jag funderar på att ombalansera min portfölj. Kan du analysera min nuvarande fördelning och ge konkreta förslag?',
      'opportunity': 'Berätta mer om intressanta investeringsmöjligheter just nu som passar min riskprofil.'
    };
    
    if (actionMessages[action as keyof typeof actionMessages]) {
      handleQuickChat(actionMessages[action as keyof typeof actionMessages]);
    }
  };

  const handleToggleFavorite = (sessionId: string) => {
    // Implementation would go here to mark session as favorite
    console.log('Toggle favorite for session:', sessionId);
  };

  const handleRenameSession = (sessionId: string, newName: string) => {
    // Implementation would go here to rename session
    console.log('Rename session:', sessionId, 'to:', newName);
  };

  if (!user) {
    return (
      <Layout>
        <div className="container mx-auto px-4 py-8">
          <Card className="max-w-md mx-auto">
            <CardHeader>
              <CardTitle>Authentication Required</CardTitle>
              <CardDescription>Please sign in to access the Portfolio Advisor</CardDescription>
            </CardHeader>
          </Card>
        </div>
      </Layout>
    );
  }

  if (profileLoading || portfolioLoading) {
    return (
      <Layout>
        <div className="container mx-auto px-4 py-8">
          <div className="text-center">Loading...</div>
        </div>
      </Layout>
    );
  }

  if (!riskProfile || showAssessment) {
    return (
      <Layout>
        <div className="container mx-auto px-2 sm:px-4 py-4 sm:py-6 max-w-4xl">
          <div className="mb-4 sm:mb-6 text-center">
            <h1 className="text-xl sm:text-2xl md:text-3xl font-bold mb-2 flex items-center justify-center gap-2">
              <Zap className="w-5 h-5 sm:w-6 sm:h-6 md:w-8 md:h-8 text-blue-600 flex-shrink-0" />
              <span className="leading-tight">AI Portfolio Advisor</span>
            </h1>
            <p className="text-xs sm:text-sm md:text-base text-muted-foreground px-2 sm:px-4">
              Din personliga AI-rådgivare för investeringar - alltid redo att hjälpa dig
            </p>
          </div>
          <EnhancedRiskAssessmentForm onComplete={handleAssessmentComplete} />
        </div>
      </Layout>
    );
  }

  if (!activePortfolio) {
    return (
      <Layout>
        <div className="container mx-auto px-4 py-8">
          <Card className="max-w-md mx-auto">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Brain className="w-5 h-5 text-blue-600" />
                Ready to Generate Portfolio
              </CardTitle>
              <CardDescription>
                Your enhanced risk profile is complete. Let's create your personalized portfolio.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button 
                onClick={() => {
                  console.log('Manual portfolio generation clicked for risk profile:', riskProfile.id);
                  portfolioGeneratedForProfile.current = riskProfile.id;
                  generatePortfolio(riskProfile.id);
                }}
                className="w-full"
                disabled={portfolioLoading}
              >
                {portfolioLoading ? 'Generating...' : 'Generate My AI-Enhanced Portfolio'}
              </Button>
            </CardContent>
          </Card>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="w-full min-h-screen">
        <div className="container mx-auto px-2 sm:px-4 py-2 sm:py-4 max-w-7xl">
          {/* Header with Chat History */}
          <div className="mb-3 sm:mb-4 md:mb-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
            <div>
              <h1 className="text-lg sm:text-xl md:text-2xl lg:text-3xl font-bold mb-1 flex items-center gap-1 sm:gap-2">
                <Brain className="w-4 h-4 sm:w-5 sm:h-5 md:w-6 md:h-6 lg:w-8 lg:h-8 text-blue-600 flex-shrink-0" />
                <span className="leading-tight truncate">Din AI Rådgivare</span>
              </h1>
              <p className="text-xs sm:text-sm text-muted-foreground hidden sm:block">
                Alltid här för att hjälpa dig med dina investeringsbeslut
              </p>
            </div>
            <div className="flex items-center gap-2">
              <ChatHistory
                sessions={sessions}
                onLoadSession={loadSession}
                onToggleFavorite={handleToggleFavorite}
                onRenameSession={handleRenameSession}
              />
              <Button
                variant="outline"
                size="sm"
                onClick={createNewSession}
              >
                Ny Chat
              </Button>
            </div>
          </div>

          {/* Tabs */}
          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full space-y-2 sm:space-y-4">
            <div className="w-full overflow-x-auto pb-1">
              <TabsList className="flex w-max min-w-full sm:grid sm:grid-cols-5 sm:w-full h-auto p-1 gap-0.5 sm:gap-1">
                <TabsTrigger value="overview" className="flex flex-col items-center gap-0.5 sm:gap-1 text-xs py-1.5 sm:py-2 px-2 sm:px-3 min-w-16 sm:min-w-0 whitespace-nowrap">
                  <MessageSquare className="w-3 h-3 sm:w-4 sm:h-4 flex-shrink-0" />
                  <span className="hidden xs:block">Översikt</span>
                  <span className="xs:hidden">Över</span>
                </TabsTrigger>
                <TabsTrigger value="portfolio" className="flex flex-col items-center gap-0.5 sm:gap-1 text-xs py-1.5 sm:py-2 px-2 sm:px-3 min-w-16 sm:min-w-0 whitespace-nowrap">
                  <BarChart3 className="w-3 h-3 sm:w-4 sm:h-4 flex-shrink-0" />
                  <span className="hidden xs:block">Portfölj</span>
                  <span className="xs:hidden">Port</span>
                </TabsTrigger>
                <TabsTrigger value="health" className="flex flex-col items-center gap-0.5 sm:gap-1 text-xs py-1.5 sm:py-2 px-2 sm:px-3 min-w-16 sm:min-w-0 whitespace-nowrap">
                  <Activity className="w-3 h-3 sm:w-4 sm:h-4 flex-shrink-0" />
                  <span className="hidden xs:block">Hälsa</span>
                  <span className="xs:hidden">Häl</span>
                </TabsTrigger>
                <TabsTrigger value="scenarios" className="flex flex-col items-center gap-0.5 sm:gap-1 text-xs py-1.5 sm:py-2 px-2 sm:px-3 min-w-16 sm:min-w-0 whitespace-nowrap">
                  <Target className="w-3 h-3 sm:w-4 sm:h-4 flex-shrink-0" />
                  <span className="hidden xs:block">Scenarier</span>
                  <span className="xs:hidden">Scen</span>
                </TabsTrigger>
                <TabsTrigger value="settings" className="flex flex-col items-center gap-0.5 sm:gap-1 text-xs py-1.5 sm:py-2 px-2 sm:px-3 min-w-16 sm:min-w-0 whitespace-nowrap">
                  <Settings className="w-3 h-3 sm:w-4 sm:h-4 flex-shrink-0" />
                  <span className="hidden xs:block">Inställningar</span>
                  <span className="xs:hidden">Inst</span>
                </TabsTrigger>
              </TabsList>
            </div>

            {/* Tab Content */}
            <div className="w-full">
              <TabsContent value="overview" className="mt-2 sm:mt-4 focus-visible:outline-none">
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
                  {/* Portfolio Overview - Left Side */}
                  <div className="space-y-4">
                    <PortfolioOverview
                      portfolio={activePortfolio}
                      onQuickChat={handleQuickChat}
                      onActionClick={handleActionClick}
                    />
                  </div>
                  
                  {/* AI Chat - Right Side */}
                  <div className="lg:col-span-1">
                    <AIChat portfolioId={activePortfolio?.id} />
                  </div>
                </div>
              </TabsContent>

              <TabsContent value="portfolio" className="mt-2 sm:mt-4 focus-visible:outline-none">
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
                  {/* Interactive Portfolio - Left Side */}
                  <div className="space-y-4">
                    <InteractivePortfolio
                      portfolio={activePortfolio}
                      onQuickChat={handleQuickChat}
                    />
                  </div>
                  
                  {/* AI Chat - Right Side */}
                  <div className="lg:col-span-1">
                    <AIChat portfolioId={activePortfolio?.id} />
                  </div>
                </div>
              </TabsContent>

              <TabsContent value="health" className="mt-2 sm:mt-4 focus-visible:outline-none">
                <div className="w-full space-y-4 sm:space-y-6">
                  <PortfolioHealthScore portfolio={activePortfolio} />
                  <AIInsightsPanel portfolioId={activePortfolio?.id} />
                </div>
              </TabsContent>

              <TabsContent value="scenarios" className="mt-2 sm:mt-4 focus-visible:outline-none">
                <div className="w-full">
                  <ScenarioAnalysis portfolio={activePortfolio} />
                </div>
              </TabsContent>

              <TabsContent value="settings" className="mt-2 sm:mt-4 focus-visible:outline-none">
                <div className="w-full space-y-4">
                  <SubscriptionCard />
                  <Card>
                    <CardHeader className="p-3 sm:p-6">
                      <CardTitle className="text-sm sm:text-base md:text-lg lg:text-xl">Portfolio Settings</CardTitle>
                      <CardDescription className="text-xs sm:text-sm">Hantera din riskprofil och portföljpreferenser</CardDescription>
                    </CardHeader>
                    <CardContent className="p-3 sm:p-6 pt-0 space-y-3 sm:space-y-4">
                      <Button 
                        variant="outline"
                        onClick={() => setShowAssessment(true)}
                        className="w-full text-xs sm:text-sm"
                      >
                        Gör om förbättrad riskbedömning
                      </Button>
                      
                      <div className="p-3 sm:p-4 bg-blue-50 dark:bg-blue-950/20 rounded-lg">
                        <h4 className="font-medium mb-2 text-xs sm:text-sm md:text-base">Din nuvarande profil</h4>
                        <div className="grid grid-cols-1 gap-2 text-xs sm:text-sm">
                          <div className="flex justify-between items-center py-1">
                            <span className="text-muted-foreground">Ålder:</span> 
                            <span className="font-medium">{riskProfile.age || 'Ej angivet'}</span>
                          </div>
                          <div className="flex justify-between items-center py-1">
                            <span className="text-muted-foreground">Risktolerans:</span> 
                            <span className="font-medium">{riskProfile.risk_tolerance || 'Ej angivet'}</span>
                          </div>
                          <div className="flex justify-between items-center py-1">
                            <span className="text-muted-foreground">Tidshorisont:</span> 
                            <span className="font-medium">{riskProfile.investment_horizon || 'Ej angivet'}</span>
                          </div>
                          <div className="flex justify-between items-center py-1">
                            <span className="text-muted-foreground">Erfarenhet:</span> 
                            <span className="font-medium">{riskProfile.investment_experience || 'Ej angivet'}</span>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </div>
              </TabsContent>
            </div>
          </Tabs>
        </div>
      </div>
    </Layout>
  );
};

export default PortfolioAdvisor;
