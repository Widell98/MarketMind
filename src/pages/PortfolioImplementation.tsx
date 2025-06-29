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
import { Brain, MessageSquare, TrendingUp, Target, Settings, BarChart3, Lightbulb, Zap, Activity, PieChart } from 'lucide-react';

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
    if (message.startsWith('NEW_SESSION:')) {
      const [, sessionName, actualMessage] = message.split(':');
      
      const chatTab = document.querySelector('[data-value="chat"]') as HTMLElement;
      if (chatTab) {
        chatTab.click();
      }
      
      const event = new CustomEvent('createStockChat', {
        detail: { sessionName, message: actualMessage }
      });
      window.dispatchEvent(event);
    } else {
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
    const chatTab = document.querySelector('[data-value="chat"]') as HTMLElement;
    if (chatTab) {
      chatTab.click();
    }
    
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
      title: "Djupgående Portföljanalys",
      prompt: "Ge mig en komplett analys av min portfölj med detaljerade rekommendationer för optimering",
      icon: <PieChart className="w-6 h-6" />,
      color: "from-blue-600 to-indigo-600",
      description: "Få en omfattande genomgång av din portföljs prestanda och struktur"
    },
    {
      title: "Riskhantering & Diversifiering", 
      prompt: "Analysera riskerna i min portfölj och föreslå strategier för bättre diversifiering",
      icon: <Activity className="w-6 h-6" />,
      color: "from-red-500 to-pink-600",
      description: "Identifiera och minimera risker för en mer balanserad portfölj"
    },
    {
      title: "Smarta Investeringsförslag",
      prompt: "Vilka aktier och tillgångar borde jag överväga nästa baserat på min profil och marknadsläget?",
      icon: <Zap className="w-6 h-6" />,
      color: "from-green-500 to-emerald-600",
      description: "Få personliga rekommendationer baserade på din riskprofil"
    },
    {
      title: "Marknadsinsikter & Timing",
      prompt: "Vad händer på marknaden just nu och hur påverkar det min investeringsstrategi?",
      icon: <TrendingUp className="w-6 h-6" />,
      color: "from-purple-500 to-violet-600",
      description: "Håll dig uppdaterad med aktuella marknadstrender och möjligheter"
    }
  ];

  // Show portfolio implementation page with tabs
  return (
    <Layout>
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50/30 to-indigo-50/40">
        <div className="container mx-auto px-4 py-8 max-w-[1600px]">
          {/* Enhanced Header */}
          <div className="mb-8">
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 mb-8">
              <div className="space-y-4">
                <div className="flex items-center gap-4">
                  <div className="w-16 h-16 bg-gradient-to-tr from-blue-600 via-purple-600 to-indigo-600 rounded-2xl flex items-center justify-center shadow-xl">
                    <Brain className="w-8 h-8 text-white" />
                  </div>
                  <div>
                    <h1 className="text-4xl xl:text-5xl font-bold text-gray-900 mb-2">
                      AI Portfolio Hub
                    </h1>
                    <p className="text-xl text-gray-600">
                      Intelligenta investeringsinsikter för din framgång
                    </p>
                  </div>
                </div>
                
                <div className="flex flex-wrap gap-3">
                  <Badge className="bg-gradient-to-r from-green-500 to-emerald-600 text-white px-4 py-2 text-sm font-medium shadow-lg">
                    <Brain className="w-4 h-4 mr-2" />
                    AI-Optimerad
                  </Badge>
                  <Badge className="bg-gradient-to-r from-blue-500 to-cyan-600 text-white px-4 py-2 text-sm font-medium shadow-lg">
                    <Activity className="w-4 h-4 mr-2" />
                    Realtidsanalys
                  </Badge>
                  {activePortfolio && (
                    <Badge className="bg-gradient-to-r from-purple-500 to-pink-600 text-white px-4 py-2 text-sm font-medium shadow-lg">
                      <Target className="w-4 h-4 mr-2" />
                      Aktiv sedan {new Date(activePortfolio.created_at).toLocaleDateString('sv-SE')}
                    </Badge>
                  )}
                </div>
              </div>
              
              <Button
                variant="outline"
                onClick={handleUpdateProfile}
                className="bg-white/80 backdrop-blur-sm border-gray-200 hover:bg-white hover:shadow-lg transition-all duration-200 px-6 py-3"
              >
                <Settings className="w-5 h-5 mr-2" />
                Uppdatera Profil
              </Button>
            </div>
          </div>

          <Tabs defaultValue="chat" className="w-full">
            <TabsList className="grid w-full grid-cols-2 max-w-md mx-auto mb-8 bg-white/80 backdrop-blur-sm border border-gray-200/50 shadow-lg rounded-xl p-1">
              <TabsTrigger 
                value="chat" 
                data-value="chat" 
                className="flex items-center gap-3 data-[state=active]:bg-gradient-to-r data-[state=active]:from-blue-600 data-[state=active]:to-purple-600 data-[state=active]:text-white data-[state=active]:shadow-lg rounded-lg py-3 px-4 font-medium transition-all duration-200"
              >
                <MessageSquare className="w-5 h-5" />
                AI-Assistent
              </TabsTrigger>
              <TabsTrigger 
                value="overview" 
                className="flex items-center gap-3 data-[state=active]:bg-gradient-to-r data-[state=active]:from-blue-600 data-[state=active]:to-purple-600 data-[state=active]:text-white data-[state=active]:shadow-lg rounded-lg py-3 px-4 font-medium transition-all duration-200"
              >
                <BarChart3 className="w-5 h-5" />
                Portföljöversikt
              </TabsTrigger>
            </TabsList>
            
            <TabsContent value="chat" className="space-y-8">
              {/* Example Prompts - Redesigned for large screens */}
              <Card className="bg-white/90 backdrop-blur-sm border-gray-200/50 shadow-xl rounded-2xl overflow-hidden">
                <CardHeader className="bg-gradient-to-r from-blue-50 to-purple-50 border-b border-gray-100 pb-6">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 bg-gradient-to-br from-yellow-500 to-orange-500 rounded-xl flex items-center justify-center shadow-lg">
                      <Lightbulb className="w-6 h-6 text-white" />
                    </div>
                    <div>
                      <CardTitle className="text-2xl font-bold text-gray-900">
                        Kom igång med AI-assistenten
                      </CardTitle>
                      <CardDescription className="text-lg text-gray-600 mt-1">
                        Välj ett förslag nedan eller skriv din egen fråga
                      </CardDescription>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="p-8">
                  <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
                    {examplePrompts.map((example, index) => (
                      <Button
                        key={index}
                        variant="outline"
                        className="h-auto p-8 text-left justify-start hover:shadow-xl transition-all duration-300 bg-white/80 border-gray-200/50 hover:bg-white hover:scale-[1.02] group rounded-xl"
                        onClick={() => handleExamplePrompt(example.prompt)}
                      >
                        <div className="flex items-start gap-6 w-full">
                          <div className={`w-14 h-14 bg-gradient-to-br ${example.color} rounded-2xl flex items-center justify-center flex-shrink-0 shadow-lg group-hover:scale-110 transition-transform duration-300`}>
                            {example.icon}
                          </div>
                          <div className="flex-1 min-w-0 space-y-2">
                            <div className="font-bold text-gray-900 text-lg">
                              {example.title}
                            </div>
                            <div className="text-sm text-gray-600 leading-relaxed">
                              {example.description}
                            </div>
                            <div className="text-xs text-gray-500 italic">
                              "{example.prompt}"
                            </div>
                          </div>
                        </div>
                      </Button>
                    ))}
                  </div>
                </CardContent>
              </Card>

              {/* AI Chat - Full width for large screens */}
              <div className="bg-white/60 backdrop-blur-sm rounded-3xl shadow-2xl border border-gray-200/30 overflow-hidden">
                <AIChat portfolioId={activePortfolio?.id} />
              </div>
            </TabsContent>
            
            <TabsContent value="overview">
              <div className="grid grid-cols-1 xl:grid-cols-4 gap-8">
                <div className="xl:col-span-3">
                  <PortfolioOverview 
                    portfolio={activePortfolio}
                    onQuickChat={handleQuickChat}
                    onActionClick={handleActionClick}
                  />
                </div>
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
