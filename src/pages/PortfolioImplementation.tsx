
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Layout from '@/components/Layout';
import PortfolioOverview from '@/components/PortfolioOverview';
import AIChat from '@/components/AIChat';
import UserInsightsPanel from '@/components/UserInsightsPanel';
import ConversationalPortfolioAdvisor from '@/components/ConversationalPortfolioAdvisor';
import { usePortfolio } from '@/hooks/usePortfolio';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Brain, MessageSquare, TrendingUp, Target, Settings, BarChart3, Lightbulb } from 'lucide-react';

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

  const handleExamplePrompt = (prompt: string) => {
    // Switch to chat tab and trigger the prompt
    const chatTab = document.querySelector('[data-value="chat"]') as HTMLElement;
    if (chatTab) {
      chatTab.click();
    }
    
    // Trigger the example prompt
    setTimeout(() => {
      const event = new CustomEvent('sendExamplePrompt', {
        detail: { message: prompt }
      });
      window.dispatchEvent(event);
    }, 100);
  };

  // Show loading while portfolio is loading
  if (loading) {
    return (
      <Layout>
        <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 to-blue-50">
          <div className="text-center p-8">
            <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-purple-600 rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-xl">
              <div className="w-8 h-8 border-4 border-white border-t-transparent rounded-full animate-spin"></div>
            </div>
            <h2 className="text-xl font-semibold text-gray-900 mb-2">Laddar din portfölj</h2>
            <p className="text-gray-600">Hämtar dina investeringsdata...</p>
          </div>
        </div>
      </Layout>
    );
  }

  // Show onboarding if user doesn't have an active portfolio
  if (showOnboarding || !activePortfolio) {
    return (
      <Layout>
        <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 py-8 px-4">
          <div className="max-w-5xl mx-auto">
            <div className="text-center mb-8">
              <div className="w-20 h-20 bg-gradient-to-br from-blue-500 to-purple-600 rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-xl">
                <Brain className="w-10 h-10 text-white" />
              </div>
              <h1 className="text-3xl lg:text-4xl font-bold text-gray-900 mb-4">
                Välkommen till AI Portfolio
              </h1>
              <p className="text-lg text-gray-600 max-w-2xl mx-auto">
                Låt oss skapa din personliga investeringsstrategi genom en kort konversation
              </p>
            </div>
            <ConversationalPortfolioAdvisor />
          </div>
        </div>
      </Layout>
    );
  }

  const examplePrompts = [
    {
      title: "Portföljanalys",
      prompt: "Ge mig en detaljerad analys av min nuvarande portfölj och föreslå förbättringar",
      icon: <BarChart3 className="w-5 h-5" />,
      color: "from-blue-500 to-blue-600"
    },
    {
      title: "Riskbedömning", 
      prompt: "Analysera riskerna i min portfölj och föreslå sätt att minska dem",
      icon: <Target className="w-5 h-5" />,
      color: "from-red-500 to-red-600"
    },
    {
      title: "Investeringsförslag",
      prompt: "Vilka aktier borde jag köpa nästa gång baserat på min riskprofil?",
      icon: <TrendingUp className="w-5 h-5" />,
      color: "from-green-500 to-green-600"
    },
    {
      title: "Marknadsläget",
      prompt: "Vad händer på marknaden just nu som kan påverka min portfölj?",
      icon: <Lightbulb className="w-5 h-5" />,
      color: "from-purple-500 to-purple-600"
    }
  ];

  // Show portfolio implementation page with tabs
  return (
    <Layout>
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50/30 py-6 px-4">
        <div className="max-w-7xl mx-auto">
          {/* Header with enhanced styling */}
          <div className="mb-8">
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 mb-6">
              <div>
                <h1 className="text-2xl lg:text-3xl xl:text-4xl font-bold flex items-center gap-3 text-gray-900 mb-2">
                  <div className="w-10 h-10 lg:w-12 lg:h-12 bg-gradient-to-br from-blue-500 to-purple-600 rounded-xl flex items-center justify-center shadow-lg">
                    <Target className="w-5 h-5 lg:w-6 lg:h-6 text-white" />
                  </div>
                  Din Portföljstrategi
                </h1>
                <p className="text-gray-600 text-lg">AI-genererade rekommendationer och insikter</p>
              </div>
              <Button
                variant="outline"
                onClick={handleUpdateProfile}
                className="bg-white/50 backdrop-blur-sm border-gray-200 hover:bg-white/80 shadow-sm"
              >
                <Settings className="w-4 h-4 mr-2" />
                Uppdatera profil
              </Button>
            </div>
            
            <div className="flex flex-wrap gap-3">
              <Badge className="bg-gradient-to-r from-green-500 to-green-600 text-white shadow-sm">
                <Brain className="w-3 h-3 mr-1" />
                AI-optimerad
              </Badge>
              <Badge className="bg-gradient-to-r from-blue-500 to-blue-600 text-white shadow-sm">
                Aktiv strategi
              </Badge>
              {activePortfolio && (
                <Badge className="bg-gradient-to-r from-purple-500 to-purple-600 text-white shadow-sm">
                  Skapad {new Date(activePortfolio.created_at).toLocaleDateString('sv-SE')}
                </Badge>
              )}
            </div>
          </div>

          <Tabs defaultValue="chat" className="w-full">
            <TabsList className="grid w-full grid-cols-2 bg-white/50 backdrop-blur-sm border border-gray-200/50 shadow-sm">
              <TabsTrigger 
                value="chat" 
                data-value="chat" 
                className="flex items-center gap-2 data-[state=active]:bg-gradient-to-r data-[state=active]:from-blue-500 data-[state=active]:to-purple-600 data-[state=active]:text-white"
              >
                <MessageSquare className="w-4 h-4" />
                AI-Chat
              </TabsTrigger>
              <TabsTrigger 
                value="overview" 
                className="flex items-center gap-2 data-[state=active]:bg-gradient-to-r data-[state=active]:from-blue-500 data-[state=active]:to-purple-600 data-[state=active]:text-white"
              >
                <BarChart3 className="w-4 h-4" />
                Översikt
              </TabsTrigger>
            </TabsList>
            
            <TabsContent value="chat" className="mt-8">
              <div className="space-y-8">
                {/* Example Prompts with enhanced design */}
                <Card className="bg-white/80 backdrop-blur-sm border-gray-200/50 shadow-lg">
                  <CardHeader className="pb-4">
                    <CardTitle className="flex items-center gap-3 text-xl">
                      <div className="w-8 h-8 bg-gradient-to-br from-yellow-500 to-orange-500 rounded-lg flex items-center justify-center">
                        <Lightbulb className="w-4 h-4 text-white" />
                      </div>
                      Exempel på vad du kan fråga
                    </CardTitle>
                    <CardDescription className="text-base">
                      Välj ett förslag nedan för att komma igång snabbt
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                      {examplePrompts.map((example, index) => (
                        <Button
                          key={index}
                          variant="outline"
                          className="h-auto p-6 text-left justify-start hover:shadow-lg transition-all duration-200 bg-white/50 border-gray-200/50 hover:bg-white/80"
                          onClick={() => handleExamplePrompt(example.prompt)}
                        >
                          <div className="flex items-start gap-4 w-full">
                            <div className={`w-10 h-10 bg-gradient-to-br ${example.color} rounded-xl flex items-center justify-center flex-shrink-0 shadow-lg`}>
                              {example.icon}
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="font-semibold text-gray-900 mb-2 text-base">
                                {example.title}
                              </div>
                              <div className="text-sm text-gray-600 leading-relaxed">
                                {example.prompt}
                              </div>
                            </div>
                          </div>
                        </Button>
                      ))}
                    </div>
                  </CardContent>
                </Card>

                {/* AI Chat - Full Width with enhanced styling */}
                <Card className="bg-white/20 backdrop-blur-sm border-gray-200/30 shadow-2xl overflow-hidden">
                  <CardContent className="p-0">
                    <AIChat portfolioId={activePortfolio?.id} />
                  </CardContent>
                </Card>
              </div>
            </TabsContent>
            
            <TabsContent value="overview" className="mt-8">
              <div className="grid grid-cols-1 xl:grid-cols-4 gap-8">
                {/* Main Content */}
                <div className="xl:col-span-3">
                  <PortfolioOverview 
                    portfolio={activePortfolio}
                    onQuickChat={handleQuickChat}
                    onActionClick={handleActionClick}
                  />
                </div>

                {/* Sidebar - Only in Overview */}
                <div className="xl:col-span-1">
                  <UserInsightsPanel />
                </div>
              </div>
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </Layout>
  );
};

export default PortfolioImplementation;
