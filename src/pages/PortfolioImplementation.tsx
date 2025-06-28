
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Layout from '@/components/Layout';
import PortfolioOverview from '@/components/PortfolioOverview';
import AIChat from '@/components/AIChat';
import UserInsightsPanel from '@/components/UserInsightsPanel';
import ConversationalPortfolioAdvisor from '@/components/ConversationalPortfolioAdvisor';
import { usePortfolio } from '@/hooks/usePortfolio';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Brain, MessageSquare, TrendingUp, Target, Settings, BarChart3 } from 'lucide-react';

const PortfolioImplementation = () => {
  const { activePortfolio, loading } = usePortfolio();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [showOnboarding, setShowOnboarding] = useState(false);

  useEffect(() => {
    if (!user || loading) return;

    if (activePortfolio) {
      console.log('Active portfolio found, showing main page');
      setShowOnboarding(false);
    } else {
      console.log('No active portfolio, showing onboarding');
      setShowOnboarding(true);
    }
  }, [user, activePortfolio, loading]);

  const handleQuickChat = (message: string) => {
    // Check if this is a request to create a new session
    if (message.startsWith('NEW_SESSION:')) {
      const [, sessionName, actualMessage] = message.split(':');
      
      // Switch to chat tab
      const chatTab = document.querySelector('[data-value="chat"]') as HTMLElement;
      if (chatTab) {
        chatTab.click();
      }
      
      // Trigger creation of new session with custom name and message
      // We'll need to pass this to the AIChat component
      const event = new CustomEvent('createStockChat', {
        detail: { sessionName, message: actualMessage }
      });
      window.dispatchEvent(event);
    } else {
      // Switch to chat tab when a quick chat is triggered from overview
      const chatTab = document.querySelector('[data-value="chat"]') as HTMLElement;
      if (chatTab) {
        chatTab.click();
      }
    }
  };

  const handleActionClick = (action: string) => {
    console.log('Action clicked:', action);
  };

  const handleUpdateProfile = () => {
    setShowOnboarding(true);
  };

  // Show loading while portfolio is loading
  if (loading) {
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

  // Show onboarding if user doesn't have an active portfolio
  if (showOnboarding || !activePortfolio) {
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

  // Show portfolio implementation page with tabs
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
          {/* Main Content with Tabs */}
          <div className="lg:col-span-3">
            <Tabs defaultValue="chat" className="w-full">
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="chat" data-value="chat" className="flex items-center gap-2">
                  <MessageSquare className="w-4 h-4" />
                  AI-Chat
                </TabsTrigger>
                <TabsTrigger value="overview" className="flex items-center gap-2">
                  <BarChart3 className="w-4 h-4" />
                  Översikt
                </TabsTrigger>
              </TabsList>
              
              <TabsContent value="chat" className="mt-6">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <MessageSquare className="w-5 h-5 text-purple-600" />
                      AI Portfolio Assistent
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      <p className="text-sm text-gray-600">
                        Ställ frågor om din portfölj, få förklaringar om rekommendationer eller diskutera investeringsstrategier.
                      </p>
                      
                      <div className="border rounded-lg">
                        <AIChat 
                          portfolioId={activePortfolio?.id}
                        />
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>
              
              <TabsContent value="overview" className="mt-6">
                <PortfolioOverview 
                  portfolio={activePortfolio}
                  onQuickChat={handleQuickChat}
                  onActionClick={handleActionClick}
                />
              </TabsContent>
            </Tabs>
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
