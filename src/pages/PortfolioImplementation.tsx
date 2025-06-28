
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Layout from '@/components/Layout';
import PortfolioOverview from '@/components/PortfolioOverview';
import AIChat from '@/components/AIChat';
import UserInsightsPanel from '@/components/UserInsightsPanel';
import ConversationalPortfolioAdvisor from '@/components/ConversationalPortfolioAdvisor';
import { usePortfolio } from '@/hooks/usePortfolio';
import { useConversationalPortfolio } from '@/hooks/useConversationalPortfolio';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Brain, MessageSquare, TrendingUp, Target, X, Loader2 } from 'lucide-react';

const PortfolioImplementation = () => {
  const { activePortfolio, recommendations, loading } = usePortfolio();
  const { checkIfUserHasCompletedAdvisor } = useConversationalPortfolio();
  const { user } = useAuth();
  const [showChat, setShowChat] = useState(false);
  const [hasCompletedAdvisor, setHasCompletedAdvisor] = useState<boolean | null>(null);
  const [isCheckingAdvisor, setIsCheckingAdvisor] = useState(true);

  useEffect(() => {
    const checkAdvisorStatus = async () => {
      if (!user) {
        setIsCheckingAdvisor(false);
        return;
      }

      try {
        const hasCompleted = await checkIfUserHasCompletedAdvisor();
        setHasCompletedAdvisor(hasCompleted);
      } catch (error) {
        console.error('Error checking advisor status:', error);
        // If there's an error, assume they haven't completed it
        setHasCompletedAdvisor(false);
      } finally {
        setIsCheckingAdvisor(false);
      }
    };

    checkAdvisorStatus();
  }, [user, checkIfUserHasCompletedAdvisor]);

  const handleQuickChat = (message: string) => {
    setShowChat(true);
    // Chat component will handle the initial message
  };

  const handleActionClick = (action: string) => {
    console.log('Action clicked:', action);
    // Handle different portfolio actions here
  };

  const handleAdvisorComplete = () => {
    // When advisor is completed, refresh the page to show the implementation view
    setHasCompletedAdvisor(true);
    window.location.reload();
  };

  if (isCheckingAdvisor || loading) {
    return (
      <Layout>
        <div className="container mx-auto px-4 py-8">
          <div className="flex items-center justify-center h-64">
            <div className="text-center">
              <Loader2 className="animate-spin h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4" />
              <p>Laddar din portfölj...</p>
            </div>
          </div>
        </div>
      </Layout>
    );
  }

  // If user hasn't completed the advisor, show the advisor interface
  if (!hasCompletedAdvisor) {
    return (
      <Layout>
        <div className="container mx-auto px-4 py-8">
          <ConversationalPortfolioAdvisor />
        </div>
      </Layout>
    );
  }

  // Show the portfolio implementation interface
  return (
    <Layout>
      <div className="container mx-auto px-4 py-6 max-w-7xl">
        {/* Header */}
        <div className="mb-6">
          <div className="flex items-center gap-4 mb-4">
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold flex items-center gap-2">
                <Target className="w-6 h-6 sm:w-8 sm:h-8 text-blue-600" />
                Din Portföljstrategi
              </h1>
              <p className="text-gray-600 mt-1">AI-genererade rekommendationer och insikter</p>
            </div>
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
                    Din AI-genererade strategi
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-gray-600 mb-4">
                    Din personliga portföljstrategi är redo! Använd AI-chatten nedan för att få mer information om dina rekommendationer.
                  </p>
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
