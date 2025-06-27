import React, { useState, useEffect, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Brain, MessageSquare, BarChart3, Settings, Zap, TrendingUp, Lightbulb, CreditCard, Activity, Target, History, Sparkles, Bot, Users, Shield } from 'lucide-react';
import Layout from '@/components/Layout';
import EnhancedRiskAssessmentForm from '@/components/EnhancedRiskAssessmentForm';
import PortfolioOverview from '@/components/PortfolioOverview';
import InteractivePortfolio from '@/components/InteractivePortfolio';
import PortfolioHealthScore from '@/components/PortfolioHealthScore';
import PerformanceAttribution from '@/components/PerformanceAttribution';
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
    createNewSession,
    deleteSession
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
    // Switch to AI Chat tab and send message
    setActiveTab('chat');
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
    console.log('Toggle favorite for session:', sessionId);
  };

  const handleRenameSession = (sessionId: string, newName: string) => {
    console.log('Rename session:', sessionId, 'to:', newName);
  };

  const handleDeleteSession = async (sessionId: string) => {
    await deleteSession(sessionId);
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
              <span className="leading-tight">AI Portfolio Assistent</span>
            </h1>
            <p className="text-xs sm:text-sm md:text-base text-muted-foreground px-2 sm:px-4">
              Din personliga AI-assistent för investeringar - alltid redo att hjälpa dig
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
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-6 lg:py-8 max-w-[1600px]">
          {/* Enhanced Header with AI Capabilities Description - Optimized for Large Screens */}
          <div className="mb-6 lg:mb-8 space-y-6 lg:space-y-8">
            <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
              <div className="min-w-0 flex-1">
                <h1 className="text-2xl sm:text-3xl lg:text-4xl xl:text-5xl font-bold mb-2 flex items-center gap-2 lg:gap-3">
                  <Brain className="w-6 h-6 sm:w-7 sm:h-7 lg:w-8 lg:h-8 xl:w-10 xl:h-10 text-blue-600 flex-shrink-0" />
                  <span className="leading-tight truncate">Din AI Portfolio Advisor</span>
                </h1>
                <p className="text-sm sm:text-base lg:text-lg text-muted-foreground">
                  Avancerad AI som hjälper dig fatta smarta investeringsbeslut
                </p>
              </div>
              <div className="flex items-center gap-3 flex-shrink-0">
                <ChatHistory
                  sessions={sessions}
                  onLoadSession={(sessionId) => {
                    loadSession(sessionId);
                    setActiveTab('chat');
                  }}
                  onDeleteSession={handleDeleteSession}
                />
                <Button
                  variant="outline"
                  size="default"
                  onClick={() => {
                    createNewSession();
                    setActiveTab('chat');
                  }}
                  className="text-sm lg:text-base"
                >
                  Ny Chat
                </Button>
              </div>
            </div>

            {/* AI Capabilities Overview - Enhanced for Large Screens */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 lg:gap-6">
              <Card className="border-l-4 border-l-blue-500 bg-gradient-to-r from-blue-50/50 to-transparent dark:from-blue-950/20">
                <CardContent className="p-4 lg:p-6">
                  <div className="flex items-center gap-3 mb-3">
                    <Bot className="w-5 h-5 lg:w-6 lg:h-6 text-blue-600" />
                    <h3 className="font-semibold text-base lg:text-lg">Intelligent Chatt</h3>
                  </div>
                  <p className="text-sm lg:text-base text-muted-foreground">
                    Ställ frågor om din portfölj, få förklaringar om aktier, eller be om investeringsråd. AI:n förstår din riskprofil och ger personliga svar.
                  </p>
                </CardContent>
              </Card>

              <Card className="border-l-4 border-l-green-500 bg-gradient-to-r from-green-50/50 to-transparent dark:from-green-950/20">
                <CardContent className="p-4 lg:p-6">
                  <div className="flex items-center gap-3 mb-3">
                    <Target className="w-5 h-5 lg:w-6 lg:h-6 text-green-600" />
                    <h3 className="font-semibold text-base lg:text-lg">Smart Analys</h3>
                  </div>
                  <p className="text-sm lg:text-base text-muted-foreground">
                    Få djup analys av dina innehav, riskbedömning och förslag på optimeringar baserat på marknadsdata och din profil.
                  </p>
                </CardContent>
              </Card>

              <Card className="border-l-4 border-l-purple-500 bg-gradient-to-r from-purple-50/50 to-transparent dark:from-purple-950/20">
                <CardContent className="p-4 lg:p-6">
                  <div className="flex items-center gap-3 mb-3">
                    <Sparkles className="w-5 h-5 lg:w-6 lg:h-6 text-purple-600" />
                    <h3 className="font-semibold text-base lg:text-lg">Proaktiva Förslag</h3>
                  </div>
                  <p className="text-sm lg:text-base text-muted-foreground">
                    AI:n identifierar möjligheter, varnar för risker och föreslår när det är dags att rebalansera din portfölj.
                  </p>
                </CardContent>
              </Card>
            </div>

            {/* Quick Start Guide - Enhanced for Large Screens */}
            <Card className="bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-950/20 dark:to-indigo-950/20 border-blue-200 dark:border-blue-800">
              <CardHeader className="pb-4">
                <CardTitle className="text-lg lg:text-xl flex items-center gap-2">
                  <Lightbulb className="w-5 h-5 lg:w-6 lg:h-6 text-yellow-500" />
                  Så här använder du AI Portfolio Advisor
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 lg:gap-6">
                  <div className="flex items-start gap-4">
                    <div className="w-8 h-8 rounded-full bg-blue-600 text-white text-sm flex items-center justify-center font-bold flex-shrink-0 mt-1">1</div>
                    <div>
                      <h4 className="font-medium text-sm lg:text-base mb-2">Utforska din portfölj</h4>
                      <p className="text-xs lg:text-sm text-muted-foreground">Se din nuvarande fördelning, prestanda och AI:ns bedömning av din portföljs hälsa.</p>
                    </div>
                  </div>
                  
                  <div className="flex items-start gap-4">
                    <div className="w-8 h-8 rounded-full bg-green-600 text-white text-sm flex items-center justify-center font-bold flex-shrink-0 mt-1">2</div>
                    <div>
                      <h4 className="font-medium text-sm lg:text-base mb-2">Chatta med AI:n</h4>
                      <p className="text-xs lg:text-sm text-muted-foreground">Fråga "Hur mår min portfölj?" eller "Vilka aktier bör jag köpa?" för personliga råd.</p>
                    </div>
                  </div>
                  
                  <div className="flex items-start gap-4">
                    <div className="w-8 h-8 rounded-full bg-purple-600 text-white text-sm flex items-center justify-center font-bold flex-shrink-0 mt-1">3</div>
                    <div>
                      <h4 className="font-medium text-sm lg:text-base mb-2">Hantera innehav</h4>
                      <p className="text-xs lg:text-sm text-muted-foreground">Klicka på aktier för att ersätta dem eller få djupare analys av varför de är i din portfölj.</p>
                    </div>
                  </div>
                  
                  <div className="flex items-start gap-4">
                    <div className="w-8 h-8 rounded-full bg-orange-600 text-white text-sm flex items-center justify-center font-bold flex-shrink-0 mt-1">4</div>
                    <div>
                      <h4 className="font-medium text-sm lg:text-base mb-2">Få AI-insikter</h4>
                      <p className="text-xs lg:text-sm text-muted-foreground">Upptäck smarta analyser och förbättringsförslag från vår avancerade AI.</p>
                    </div>
                  </div>
                </div>
                
                <div className="pt-4 border-t border-blue-200 dark:border-blue-800">
                  <div className="flex flex-wrap gap-3">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleQuickChat("Hej! Kan du ge mig en snabb överblick av min portfölj och eventuella förbättringsförslag?")}
                      className="text-sm bg-white/60 hover:bg-white/80 dark:bg-gray-800/60 dark:hover:bg-gray-800/80"
                    >
                      💬 Snabb portföljöverblick
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleQuickChat("Vilka investeringsmöjligheter ser du just nu som passar min riskprofil?")}
                      className="text-sm bg-white/60 hover:bg-white/80 dark:bg-gray-800/60 dark:hover:bg-gray-800/80"
                    >
                      🔍 Hitta nya möjligheter
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleQuickChat("Behöver jag rebalansera min portfölj? Vad föreslår du?")}
                      className="text-sm bg-white/60 hover:bg-white/80 dark:bg-gray-800/60 dark:hover:bg-gray-800/80"
                    >
                      ⚖️ Rebalanseringsförslag
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Tabs - Optimized for Large Screens */}
          <div className="w-full">
            <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full space-y-4 lg:space-y-6">
              <div className="w-full overflow-x-auto pb-2">
                <TabsList className="flex w-max min-w-full lg:grid lg:grid-cols-5 lg:w-full h-auto p-1 gap-1">
                  <TabsTrigger value="overview" className="flex flex-col items-center gap-1 lg:gap-2 text-sm py-2 lg:py-3 px-4 lg:px-6 min-w-20 lg:min-w-0 whitespace-nowrap">
                    <MessageSquare className="w-4 h-4 lg:w-5 lg:h-5 flex-shrink-0" />
                    <span>Översikt</span>
                  </TabsTrigger>
                  <TabsTrigger value="chat" className="flex flex-col items-center gap-1 lg:gap-2 text-sm py-2 lg:py-3 px-4 lg:px-6 min-w-20 lg:min-w-0 whitespace-nowrap">
                    <Brain className="w-4 h-4 lg:w-5 lg:h-5 flex-shrink-0" />
                    <span>AI Chat</span>
                  </TabsTrigger>
                  <TabsTrigger value="portfolio" className="flex flex-col items-center gap-1 lg:gap-2 text-sm py-2 lg:py-3 px-4 lg:px-6 min-w-20 lg:min-w-0 whitespace-nowrap">
                    <BarChart3 className="w-4 h-4 lg:w-5 lg:h-5 flex-shrink-0" />
                    <span>Portfölj</span>
                  </TabsTrigger>
                  <TabsTrigger value="health" className="flex flex-col items-center gap-1 lg:gap-2 text-sm py-2 lg:py-3 px-4 lg:px-6 min-w-20 lg:min-w-0 whitespace-nowrap">
                    <Activity className="w-4 h-4 lg:w-5 lg:h-5 flex-shrink-0" />
                    <span>Hälsa</span>
                  </TabsTrigger>
                  <TabsTrigger value="settings" className="flex flex-col items-center gap-1 lg:gap-2 text-sm py-2 lg:py-3 px-4 lg:px-6 min-w-20 lg:min-w-0 whitespace-nowrap">
                    <Settings className="w-4 h-4 lg:w-5 lg:h-5 flex-shrink-0" />
                    <span>Inställningar</span>
                  </TabsTrigger>
                </TabsList>
              </div>

              {/* Tab Content - Enhanced spacing for large screens */}
              <div className="w-full max-w-full">
                <TabsContent value="overview" className="mt-4 lg:mt-6 focus-visible:outline-none w-full">
                  <div className="w-full max-w-full">
                    <PortfolioOverview
                      portfolio={activePortfolio}
                      onQuickChat={handleQuickChat}
                      onActionClick={handleActionClick}
                    />
                  </div>
                </TabsContent>

                <TabsContent value="chat" className="mt-4 lg:mt-6 focus-visible:outline-none w-full">
                  <div className="w-full max-w-full">
                    <AIChat portfolioId={activePortfolio?.id} />
                  </div>
                </TabsContent>

                <TabsContent value="portfolio" className="mt-4 lg:mt-6 focus-visible:outline-none w-full">
                  <div className="w-full max-w-full">
                    <InteractivePortfolio
                      portfolio={activePortfolio}
                      onQuickChat={handleQuickChat}
                    />
                  </div>
                </TabsContent>

                <TabsContent value="health" className="mt-4 lg:mt-6 focus-visible:outline-none w-full">
                  <div className="w-full max-w-full space-y-6 lg:space-y-8">
                    <PortfolioHealthScore portfolio={activePortfolio} />
                    <AIInsightsPanel portfolioId={activePortfolio?.id} />
                  </div>
                </TabsContent>

                <TabsContent value="settings" className="mt-4 lg:mt-6 focus-visible:outline-none w-full">
                  <div className="w-full max-w-full space-y-6">
                    <SubscriptionCard />
                    <Card>
                      <CardHeader className="p-4 lg:p-6">
                        <CardTitle className="text-lg lg:text-xl">Portfolio Settings</CardTitle>
                        <CardDescription className="text-sm lg:text-base">Hantera din riskprofil och portföljpreferenser</CardDescription>
                      </CardHeader>
                      <CardContent className="p-4 lg:p-6 pt-0 space-y-4">
                        <Button 
                          variant="outline"
                          onClick={() => setShowAssessment(true)}
                          className="w-full text-sm lg:text-base"
                        >
                          Gör om förbättrad riskbedömning
                        </Button>
                        
                        <div className="p-4 lg:p-6 bg-blue-50 dark:bg-blue-950/20 rounded-lg">
                          <h4 className="font-medium mb-3 text-sm lg:text-base">Din nuvarande profil</h4>
                          <div className="grid grid-cols-1 gap-3 text-sm lg:text-base">
                            <div className="flex justify-between items-center py-2">
                              <span className="text-muted-foreground">Ålder:</span> 
                              <span className="font-medium">{riskProfile.age || 'Ej angivet'}</span>
                            </div>
                            <div className="flex justify-between items-center py-2">
                              <span className="text-muted-foreground">Risktolerans:</span> 
                              <span className="font-medium">{riskProfile.risk_tolerance || 'Ej angivet'}</span>
                            </div>
                            <div className="flex justify-between items-center py-2">
                              <span className="text-muted-foreground">Tidshorisont:</span> 
                              <span className="font-medium">{riskProfile.investment_horizon || 'Ej angivet'}</span>
                            </div>
                            <div className="flex justify-between items-center py-2">
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
      </div>
    </Layout>
  );
};

export default PortfolioAdvisor;
