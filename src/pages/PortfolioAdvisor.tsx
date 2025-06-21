import React, { useState, useEffect, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Brain, MessageSquare, BarChart3, Settings, Zap } from 'lucide-react';
import Layout from '@/components/Layout';
import EnhancedRiskAssessmentForm from '@/components/EnhancedRiskAssessmentForm';
import EnhancedPortfolioDashboard from '@/components/EnhancedPortfolioDashboard';
import { useRiskProfile } from '@/hooks/useRiskProfile';
import { usePortfolio } from '@/hooks/usePortfolio';
import { useAuth } from '@/contexts/AuthContext';
import AIChat from '@/components/AIChat';

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
              Förbättrad AI Portfolio Advisor
            </h1>
            <p className="text-muted-foreground">
              Personaliserad investeringsrådgivning med djup analys av din ekonomiska profil
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
                {portfolioLoading ? 'Generating...' : 'Generate My Enhanced Portfolio'}
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
            Förbättrad Portfolio Advisor
          </h1>
          <p className="text-muted-foreground text-sm sm:text-base">
            Din personaliserade AI-drivna investeringsdashboard med djup analys
          </p>
        </div>

        <Tabs defaultValue="dashboard" className="space-y-4 sm:space-y-6">
          <TabsList className="grid w-full grid-cols-2 sm:grid-cols-4 h-auto p-1">
            <TabsTrigger value="dashboard" className="flex flex-col sm:flex-row items-center gap-1 sm:gap-2 text-xs sm:text-sm py-2 sm:py-1.5">
              <BarChart3 className="w-4 h-4" />
              <span className="hidden sm:inline">Dashboard</span>
              <span className="sm:hidden">Dash</span>
            </TabsTrigger>
            <TabsTrigger value="chat" className="flex flex-col sm:flex-row items-center gap-1 sm:gap-2 text-xs sm:text-sm py-2 sm:py-1.5">
              <MessageSquare className="w-4 h-4" />
              <span className="hidden sm:inline">AI Chat</span>
              <span className="sm:hidden">Chat</span>
            </TabsTrigger>
            <TabsTrigger value="recommendations" className="flex flex-col sm:flex-row items-center gap-1 sm:gap-2 text-xs sm:text-sm py-2 sm:py-1.5">
              <Brain className="w-4 h-4" />
              <span className="hidden sm:inline">Recommendations</span>
              <span className="sm:hidden">Recs</span>
            </TabsTrigger>
            <TabsTrigger value="settings" className="flex flex-col sm:flex-row items-center gap-1 sm:gap-2 text-xs sm:text-sm py-2 sm:py-1.5">
              <Settings className="w-4 h-4" />
              <span className="hidden sm:inline">Settings</span>
              <span className="sm:hidden">Set</span>
            </TabsTrigger>
          </TabsList>

          <TabsContent value="dashboard" className="space-y-4 sm:space-y-6 mt-4">
            <EnhancedPortfolioDashboard portfolio={activePortfolio} recommendations={recommendations} />
          </TabsContent>

          <TabsContent value="chat" className="space-y-4 sm:space-y-6 mt-4">
            <AIChat portfolioId={activePortfolio?.id} />
          </TabsContent>

          <TabsContent value="recommendations" className="space-y-4 sm:space-y-6 mt-4">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg sm:text-xl">Alla Rekommendationer</CardTitle>
                <CardDescription className="text-sm">Granska all AI-genererad rådgivning för din portfölj</CardDescription>
              </CardHeader>
              <CardContent>
                {recommendations.length === 0 ? (
                  <div className="text-center text-muted-foreground py-8">
                    <Brain className="w-12 h-12 mx-auto mb-4 opacity-50" />
                    <p>Inga rekommendationer tillgängliga än</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {recommendations.map((rec) => (
                      <div key={rec.id} className="p-3 sm:p-4 border rounded-lg">
                        <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start mb-2 gap-2">
                          <h4 className="font-medium text-sm sm:text-base">{rec.title}</h4>
                          <span className="text-xs text-muted-foreground">
                            {new Date(rec.created_at).toLocaleDateString('sv-SE')}
                          </span>
                        </div>
                        <p className="text-xs sm:text-sm text-muted-foreground mb-2">{rec.description}</p>
                        {rec.ai_reasoning && (
                          <p className="text-xs text-muted-foreground italic">{rec.ai_reasoning}</p>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="settings" className="space-y-4 sm:space-y-6 mt-4">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg sm:text-xl">Portfolio Settings</CardTitle>
                <CardDescription className="text-sm">Hantera din riskprofil och portföljpreferenser</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <Button 
                  variant="outline"
                  onClick={() => setShowAssessment(true)}
                  className="w-full sm:w-auto"
                >
                  Gör om förbättrad riskbedömning
                </Button>
                
                <div className="mt-6 p-4 bg-blue-50 rounded-lg">
                  <h4 className="font-medium mb-2">Din nuvarande profil</h4>
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <span className="text-muted-foreground">Ålder:</span> {riskProfile.age || 'Ej angivet'}
                    </div>
                    <div>
                      <span className="text-muted-foreground">Risktolerans:</span> {riskProfile.risk_tolerance || 'Ej angivet'}
                    </div>
                    <div>
                      <span className="text-muted-foreground">Tidshorisont:</span> {riskProfile.investment_horizon || 'Ej angivet'}
                    </div>
                    <div>
                      <span className="text-muted-foreground">Erfarenhet:</span> {riskProfile.investment_experience || 'Ej angivet'}
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
