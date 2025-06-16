import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Brain, MessageSquare, BarChart3, Settings } from 'lucide-react';
import Layout from '@/components/Layout';
import RiskAssessmentForm from '@/components/RiskAssessmentForm';
import PortfolioDashboard from '@/components/PortfolioDashboard';
import { useRiskProfile } from '@/hooks/useRiskProfile';
import { usePortfolio } from '@/hooks/usePortfolio';
import { useAuth } from '@/contexts/AuthContext';

const PortfolioAdvisor = () => {
  const { user } = useAuth();
  const { riskProfile, loading: profileLoading, refetch: refetchRiskProfile } = useRiskProfile();
  const { activePortfolio, recommendations, loading: portfolioLoading, generatePortfolio } = usePortfolio();
  const [showAssessment, setShowAssessment] = useState(false);

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

  const handleAssessmentComplete = async (signal: string) => {
    console.log('Assessment completed with signal:', signal);
    
    if (signal === 'profile-created') {
      console.log('Refetching risk profile after creation...');
      // Refetch the risk profile to get the latest data
      await refetchRiskProfile();
      
      // Small delay to ensure the data is updated, then check the current riskProfile state
      setTimeout(() => {
        if (riskProfile?.id) {
          console.log('Generating portfolio for risk profile:', riskProfile.id);
          generatePortfolio(riskProfile.id);
          setShowAssessment(false);
        } else {
          console.log('Risk profile not yet available, will rely on useEffect');
        }
      }, 1000);
    }
  };

  // Auto-generate portfolio when risk profile becomes available
  useEffect(() => {
    if (riskProfile?.id && !activePortfolio && !portfolioLoading) {
      console.log('Auto-generating portfolio for newly available risk profile:', riskProfile.id);
      generatePortfolio(riskProfile.id);
    }
  }, [riskProfile, activePortfolio, portfolioLoading, generatePortfolio]);

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
            <h1 className="text-3xl font-bold mb-2">AI Portfolio Advisor</h1>
            <p className="text-muted-foreground">
              Get personalized investment advice powered by artificial intelligence
            </p>
          </div>
          <RiskAssessmentForm onComplete={handleAssessmentComplete} />
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
                Your risk profile is complete. Let's create your personalized portfolio.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button 
                onClick={() => {
                  console.log('Manual portfolio generation clicked for risk profile:', riskProfile.id);
                  generatePortfolio(riskProfile.id);
                }}
                className="w-full"
                disabled={portfolioLoading}
              >
                {portfolioLoading ? 'Generating...' : 'Generate My Portfolio'}
              </Button>
            </CardContent>
          </Card>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2">Portfolio Advisor</h1>
          <p className="text-muted-foreground">
            Your personalized AI-powered investment dashboard
          </p>
        </div>

        <Tabs defaultValue="dashboard" className="space-y-6">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="dashboard" className="flex items-center gap-2">
              <BarChart3 className="w-4 h-4" />
              Dashboard
            </TabsTrigger>
            <TabsTrigger value="chat" className="flex items-center gap-2">
              <MessageSquare className="w-4 h-4" />
              AI Chat
            </TabsTrigger>
            <TabsTrigger value="recommendations" className="flex items-center gap-2">
              <Brain className="w-4 h-4" />
              Recommendations
            </TabsTrigger>
            <TabsTrigger value="settings" className="flex items-center gap-2">
              <Settings className="w-4 h-4" />
              Settings
            </TabsTrigger>
          </TabsList>

          <TabsContent value="dashboard" className="space-y-6">
            <PortfolioDashboard portfolio={activePortfolio} recommendations={recommendations} />
          </TabsContent>

          <TabsContent value="chat" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>AI Portfolio Chat</CardTitle>
                <CardDescription>Ask questions about your portfolio and get AI-powered advice</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="text-center text-muted-foreground py-8">
                  Chat interface coming soon...
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="recommendations" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>All Recommendations</CardTitle>
                <CardDescription>Review all AI-generated advice for your portfolio</CardDescription>
              </CardHeader>
              <CardContent>
                {recommendations.length === 0 ? (
                  <div className="text-center text-muted-foreground py-8">
                    No recommendations available yet
                  </div>
                ) : (
                  <div className="space-y-4">
                    {recommendations.map((rec) => (
                      <div key={rec.id} className="p-4 border rounded-lg">
                        <div className="flex justify-between items-start mb-2">
                          <h4 className="font-medium">{rec.title}</h4>
                          <span className="text-xs text-muted-foreground">
                            {new Date(rec.created_at).toLocaleDateString()}
                          </span>
                        </div>
                        <p className="text-sm text-muted-foreground mb-2">{rec.description}</p>
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

          <TabsContent value="settings" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Portfolio Settings</CardTitle>
                <CardDescription>Manage your risk profile and portfolio preferences</CardDescription>
              </CardHeader>
              <CardContent>
                <Button 
                  variant="outline"
                  onClick={() => setShowAssessment(true)}
                >
                  Retake Risk Assessment
                </Button>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </Layout>
  );
};

export default PortfolioAdvisor;
