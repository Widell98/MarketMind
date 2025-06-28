
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Layout from '@/components/Layout';
import PortfolioOverview from '@/components/PortfolioOverview';
import AIChat from '@/components/AIChat';
import UserInsightsPanel from '@/components/UserInsightsPanel';
import ConversationalPortfolioAdvisor from '@/components/ConversationalPortfolioAdvisor';
import { usePortfolio } from '@/hooks/usePortfolio';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Brain, MessageSquare, TrendingUp, Target, X, Settings } from 'lucide-react';

const PortfolioImplementation = () => {
  const { activePortfolio, recommendations, loading } = usePortfolio();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [showChat, setShowChat] = useState(false);
  const [hasRiskProfile, setHasRiskProfile] = useState<boolean | null>(null);
  const [showOnboarding, setShowOnboarding] = useState(false);

  useEffect(() => {
    const checkUserProfile = async () => {
      if (!user) return;

      try {
        // Check if user has a risk profile
        const { data: riskProfile } = await supabase
          .from('user_risk_profiles')
          .select('id')
          .eq('user_id', user.id)
          .single();

        const hasProfile = !!riskProfile;
        setHasRiskProfile(hasProfile);

        // If no risk profile exists, show onboarding instead of redirecting
        if (!hasProfile) {
          setShowOnboarding(true);
        }
      } catch (error) {
        console.error('Error checking risk profile:', error);
        setHasRiskProfile(false);
        setShowOnboarding(true);
      }
    };

    checkUserProfile();
  }, [user]);

  // Listen for portfolio generation completion
  useEffect(() => {
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === 'portfolio_generation_complete') {
        // Portfolio was just generated, refresh the state
        setShowOnboarding(false);
        setHasRiskProfile(true);
        window.location.reload();
      }
    };

    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, []);

  const handleQuickChat = (message: string) => {
    setShowChat(true);
    // Chat component will handle the initial message
  };

  const handleActionClick = (action: string) => {
    console.log('Action clicked:', action);
    // Handle different portfolio actions here
  };

  const handleUpdateProfile = () => {
    setShowOnboarding(true);
  };

  if (loading || hasRiskProfile === null) {
    return (
      <Layout>
        <div className="container mx-auto px-4 py-8">
          <div className="flex items-center justify-center h-64">
            <div className="text-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
              <p>Laddar din portfölj...</p>
            </div>
          </div>
        </div>
      </Layout>
    );
  }

  // Show onboarding if user doesn't have a risk profile
  if (showOnboarding) {
    return (
      <Layout>
        <div className="container mx-auto px-4 py-8">
          <div className="max-w-4xl mx-auto">
            <div className="mb-6 text-center">
              <h1 className="text-3xl font-bold flex items-center justify-center gap-2 mb-2">
                <Brain className="w-8 h-8 text-blue-600" />
                Välkommen till AI Portfolio
              </h1>
              <p className="text-gray-600">
                Låt oss skapa din personliga investeringsstrategi genom en kort konversation
              </p>
            </div>
            <ConversationalPortfolioAdvisor />
          </div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="container mx-auto px-4 py-6 max-w-7xl">
        {/* Header */}
        <div className="mb-6">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold flex items-center gap-2">
                <Target className="w-6 h-6 sm:w-8 sm:h-8 text-blue-600" />
                Din Portföljstrategi
              </h1>
              <p className="text-gray-600 mt-1">AI-genererade rekommendationer och insikter</p>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={handleUpdateProfile}
            >
              <Settings className="w-4 h-4 mr-2" />
              Uppdatera profil
            </Button>
          </div>
          
          <div className="flex flex-wrap gap-2">
            <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
              <Brain className="w-3 h-3 mr-1" />
              AI-optimerad
            </Badge>
            <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">
              Aktiv strategi
            </Badge>
            {activePortfolio && (
              <Badge variant="outline" className="bg-purple-50 text-purple-700 border-purple-200">
                Skapad {new Date(activePortfolio.created_at).toLocaleDateString('sv-SE')}
              </Badge>
            )}
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Main Content */}
          <div className="lg:col-span-3 space-y-6">
            {/* Portfolio Overview */}
            {activePortfolio ? (
              <PortfolioOverview 
                portfolio={activePortfolio}
                onQuickChat={handleQuickChat}
                onActionClick={handleActionClick}
              />
            ) : (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Brain className="w-5 h-5 text-blue-600" />
                    Portfölj genereras
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-gray-600 mb-4">
                    Din portfölj håller på att genereras baserat på din riskprofil. Detta kan ta några minuter.
                  </p>
                  <div className="animate-pulse bg-gray-200 h-4 rounded mb-2"></div>
                  <div className="animate-pulse bg-gray-200 h-4 rounded w-3/4"></div>
                </CardContent>
              </Card>
            )}

            {/* AI Chat Section */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <MessageSquare className="w-5 h-5 text-purple-600" />
                  AI Portfolio Assistent
                  {showChat && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setShowChat(false)}
                      className="ml-auto"
                    >
                      <X className="w-4 h-4" />
                      Stäng
                    </Button>
                  )}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <p className="text-sm text-gray-600">
                    Ställ frågor om din portfölj, få förklaringar om rekommendationer eller diskutera investeringsstrategier.
                  </p>
                  
                  {!showChat ? (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <Button 
                        variant="outline" 
                        onClick={() => handleQuickChat("Förklara min portföljstrategi i detalj")}
                        className="text-left justify-start"
                      >
                        Förklara min strategi
                      </Button>
                      <Button 
                        variant="outline" 
                        onClick={() => handleQuickChat("Vilka risker finns med min portfölj?")}
                        className="text-left justify-start"
                      >
                        Analysera risker
                      </Button>
                      <Button 
                        variant="outline" 
                        onClick={() => handleQuickChat("Hur ska jag rebalansera min portfölj?")}
                        className="text-left justify-start"
                      >
                        Rebalanseringstips
                      </Button>
                      <Button 
                        variant="outline" 
                        onClick={() => setShowChat(true)}
                        className="text-left justify-start"
                      >
                        Öppna AI-chat
                      </Button>
                    </div>
                  ) : (
                    <div className="border rounded-lg">
                      <AIChat 
                        portfolioId={activePortfolio?.id}
                      />
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Sidebar */}
          <div className="lg:col-span-1">
            <UserInsightsPanel />
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default PortfolioImplementation;
