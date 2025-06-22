
import React, { useState, useEffect, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Brain, MessageSquare, BarChart3, Settings, Zap, TrendingUp, Lightbulb, CreditCard } from 'lucide-react';
import Layout from '@/components/Layout';
import EnhancedRiskAssessmentForm from '@/components/EnhancedRiskAssessmentForm';
import EnhancedPortfolioDashboard from '@/components/EnhancedPortfolioDashboard';
import SubscriptionCard from '@/components/SubscriptionCard';
import { useRiskProfile } from '@/hooks/useRiskProfile';
import { usePortfolio } from '@/hooks/usePortfolio';
import { useAuth } from '@/contexts/AuthContext';
import AIChat from '@/components/AIChat';
import AIInsightsPanel from '@/components/AIInsightsPanel';
import PredictiveAnalytics from '@/components/PredictiveAnalytics';

const PortfolioAdvisor = () => {
  const { user } = useAuth();
  const { riskProfile, loading: profileLoading, refetch: refetchRiskProfile } = useRiskProfile();
  const { activePortfolio, recommendations, loading: portfolioLoading, generatePortfolio } = usePortfolio();
  const [showAssessment, setShowAssessment] = useState(false);
  const portfolioGeneratedForProfile = useRef<string | null>(null);

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
        <div className="container mx-auto px-4 py-6 max-w-4xl">
          <div className="mb-6 text-center">
            <h1 className="text-2xl md:text-3xl font-bold mb-2 flex items-center justify-center gap-2">
              <Zap className="w-6 h-6 md:w-8 md:h-8 text-blue-600" />
              AI Portfolio Advisor
            </h1>
            <p className="text-sm md:text-base text-muted-foreground px-4">
              Avancerad AI-driven investeringsrådgivning med prediktiv analys och realtidsmarknadsdata
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
      <div className="container mx-auto px-3 sm:px-4 py-4 sm:py-6 max-w-7xl">
        <div className="mb-4 sm:mb-6">
          <h1 className="text-xl sm:text-2xl md:text-3xl font-bold mb-1 sm:mb-2 flex items-center gap-2">
            <Zap className="w-5 h-5 sm:w-6 sm:h-6 md:w-8 md:h-8 text-blue-600" />
            <span className="leading-tight">AI Portfolio Advisor</span>
          </h1>
          <p className="text-xs sm:text-sm md:text-base text-muted-foreground">
            Din AI-drivna investeringsdashboard med prediktiv analys och realtidsmarknadsdata
          </p>
        </div>

        <Tabs defaultValue="dashboard" className="space-y-3 sm:space-y-4">
          <div className="overflow-x-auto">
            <TabsList className="grid grid-cols-6 w-full min-w-max sm:min-w-0 h-auto p-1">
              <TabsTrigger value="dashboard" className="flex flex-col items-center gap-1 text-xs py-2 px-2 min-w-0">
                <BarChart3 className="w-4 h-4 flex-shrink-0" />
                <span className="truncate">Dashboard</span>
              </TabsTrigger>
              <TabsTrigger value="subscription" className="flex flex-col items-center gap-1 text-xs py-2 px-2 min-w-0">
                <CreditCard className="w-4 h-4 flex-shrink-0" />
                <span className="truncate">Subscription</span>
              </TabsTrigger>
              <TabsTrigger value="chat" className="flex flex-col items-center gap-1 text-xs py-2 px-2 min-w-0">
                <MessageSquare className="w-4 h-4 flex-shrink-0" />
                <span className="truncate">AI Chat</span>
              </TabsTrigger>
              <TabsTrigger value="insights" className="flex flex-col items-center gap-1 text-xs py-2 px-2 min-w-0">
                <Lightbulb className="w-4 h-4 flex-shrink-0" />
                <span className="truncate">Insights</span>
              </TabsTrigger>
              <TabsTrigger value="analytics" className="flex flex-col items-center gap-1 text-xs py-2 px-2 min-w-0">
                <TrendingUp className="w-4 h-4 flex-shrink-0" />
                <span className="truncate">Predictive</span>
              </TabsTrigger>
              <TabsTrigger value="settings" className="flex flex-col items-center gap-1 text-xs py-2 px-2 min-w-0">
                <Settings className="w-4 h-4 flex-shrink-0" />
                <span className="truncate">Settings</span>
              </TabsTrigger>
            </TabsList>
          </div>

          <TabsContent value="dashboard" className="space-y-3 sm:space-y-4 mt-3 sm:mt-4">
            <EnhancedPortfolioDashboard portfolio={activePortfolio} recommendations={recommendations} />
          </TabsContent>

          <TabsContent value="subscription" className="space-y-3 sm:space-y-4 mt-3 sm:mt-4">
            <SubscriptionCard />
          </TabsContent>

          <TabsContent value="chat" className="space-y-3 sm:space-y-4 mt-3 sm:mt-4">
            <AIChat portfolioId={activePortfolio?.id} />
          </TabsContent>

          <TabsContent value="insights" className="space-y-3 sm:space-y-4 mt-3 sm:mt-4">
            <AIInsightsPanel portfolioId={activePortfolio?.id} />
          </TabsContent>

          <TabsContent value="analytics" className="space-y-3 sm:space-y-4 mt-3 sm:mt-4">
            <PredictiveAnalytics portfolioId={activePortfolio?.id} />
          </TabsContent>

          <TabsContent value="settings" className="space-y-3 sm:space-y-4 mt-3 sm:mt-4">
            <Card>
              <CardHeader>
                <CardTitle className="text-base sm:text-lg md:text-xl">Portfolio Settings</CardTitle>
                <CardDescription className="text-xs sm:text-sm">Hantera din riskprofil och portföljpreferenser</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <Button 
                  variant="outline"
                  onClick={() => setShowAssessment(true)}
                  className="w-full text-xs sm:text-sm"
                >
                  Gör om förbättrad riskbedömning
                </Button>
                
                <div className="mt-4 p-3 sm:p-4 bg-blue-50 dark:bg-blue-950/20 rounded-lg">
                  <h4 className="font-medium mb-2 text-sm sm:text-base">Din nuvarande profil</h4>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 sm:gap-4 text-xs sm:text-sm">
                    <div className="flex justify-between sm:block">
                      <span className="text-muted-foreground">Ålder:</span> 
                      <span className="sm:block">{riskProfile.age || 'Ej angivet'}</span>
                    </div>
                    <div className="flex justify-between sm:block">
                      <span className="text-muted-foreground">Risktolerans:</span> 
                      <span className="sm:block">{riskProfile.risk_tolerance || 'Ej angivet'}</span>
                    </div>
                    <div className="flex justify-between sm:block">
                      <span className="text-muted-foreground">Tidshorisont:</span> 
                      <span className="sm:block">{riskProfile.investment_horizon || 'Ej angivet'}</span>
                    </div>
                    <div className="flex justify-between sm:block">
                      <span className="text-muted-foreground">Erfarenhet:</span> 
                      <span className="sm:block">{riskProfile.investment_experience || 'Ej angivet'}</span>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </Layout>
  );
};

export default PortfolioAdvisor;
