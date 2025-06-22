import React, { useState, useEffect, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Brain, MessageSquare, BarChart3, Settings, Zap, TrendingUp, Lightbulb } from 'lucide-react';
import Layout from '@/components/Layout';
import EnhancedRiskAssessmentForm from '@/components/EnhancedRiskAssessmentForm';
import EnhancedPortfolioDashboard from '@/components/EnhancedPortfolioDashboard';
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
        <div className="container mx-auto px-4 py-8">
          <div className="mb-8 text-center">
            <h1 className="text-3xl font-bold mb-2 flex items-center justify-center gap-2">
              <Zap className="w-8 h-8 text-blue-600" />
              AI Portfolio Advisor - Phase 4
            </h1>
            <p className="text-muted-foreground">
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
      <div className="container mx-auto px-4 py-6 sm:py-8">
        <div className="mb-6 sm:mb-8">
          <h1 className="text-2xl sm:text-3xl font-bold mb-2 flex items-center gap-2">
            <Zap className="w-8 h-8 text-blue-600" />
            AI Portfolio Advisor
          </h1>
          <p className="text-muted-foreground text-sm sm:text-base">
            Din AI-drivna investeringsdashboard med prediktiv analys och realtidsmarknadsdata
          </p>
        </div>

        <Tabs defaultValue="chat" className="space-y-4 sm:space-y-6">
          <TabsList className="grid w-full grid-cols-2 h-auto p-1">
            <TabsTrigger value="chat" className="flex flex-col sm:flex-row items-center gap-1 sm:gap-2 text-xs sm:text-sm py-2 sm:py-1.5">
              <MessageSquare className="w-4 h-4" />
              <span>AI Chat</span>
            </TabsTrigger>
            <TabsTrigger value="analysis" className="flex flex-col sm:flex-row items-center gap-1 sm:gap-2 text-xs sm:text-sm py-2 sm:py-1.5">
              <BarChart3 className="w-4 h-4" />
              <span>Analys</span>
            </TabsTrigger>
          </TabsList>

          <TabsContent value="chat" className="space-y-4 sm:space-y-6 mt-4">
            <AIChat portfolioId={activePortfolio?.id} />
          </TabsContent>

          <TabsContent value="analysis" className="space-y-4 sm:space-y-6 mt-4">
            <AIInsightsPanel portfolioId={activePortfolio?.id} />
          </TabsContent>
        </Tabs>
      </div>
    </Layout>
  );
};

export default PortfolioAdvisor;
