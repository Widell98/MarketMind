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
        <div className="min-h-screen flex items-center justify-center" style={{ background: 'linear-gradient(135deg, #555879 0%, #98A1BC 50%, #DED3C4 100%)' }}>
          <div className="text-center p-8">
            <div className="w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-2xl" style={{ background: 'linear-gradient(135deg, #555879, #98A1BC)' }}>
              <div className="w-8 h-8 border-4 border-[#F4EBD3] border-t-transparent rounded-full animate-spin"></div>
            </div>
            <h2 className="text-xl font-semibold mb-2" style={{ color: '#555879' }}>Laddar din portfölj</h2>
            <p style={{ color: '#98A1BC' }}>Hämtar dina investeringsdata...</p>
          </div>
        </div>
      </Layout>
    );
  }

  // Show onboarding if user doesn't have an active portfolio
  if (showOnboarding || !activePortfolio) {
    return (
      <Layout>
        <div className="min-h-screen py-8 px-4" style={{ background: 'linear-gradient(135deg, #555879 0%, #98A1BC 30%, #DED3C4 70%, #F4EBD3 100%)' }}>
          <div className="max-w-5xl mx-auto">
            <div className="text-center mb-8">
              <div className="w-20 h-20 rounded-3xl flex items-center justify-center mx-auto mb-6 shadow-2xl transform rotate-3" style={{ background: 'linear-gradient(135deg, #555879, #98A1BC)' }}>
                <Brain className="w-10 h-10 text-[#F4EBD3]" />
              </div>
              <h1 className="text-3xl lg:text-4xl font-bold mb-4" style={{ color: '#555879' }}>
                Välkommen till AI Portfolio
              </h1>
              <p className="text-lg max-w-2xl mx-auto" style={{ color: '#98A1BC' }}>
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
      description: "Få en omfattande genomgång av din portföljs prestanda och struktur"
    },
    {
      title: "Riskhantering & Diversifiering", 
      prompt: "Analysera riskerna i min portfölj och föreslå strategier för bättre diversifiering",
      icon: <Activity className="w-6 h-6" />,
      description: "Identifiera och minimera risker för en mer balanserad portfölj"
    },
    {
      title: "Smarta Investeringsförslag",
      prompt: "Vilka aktier och tillgångar borde jag överväga nästa baserat på min profil och marknadsläget?",
      icon: <Zap className="w-6 h-6" />,
      description: "Få personliga rekommendationer baserade på din riskprofil"
    },
    {
      title: "Marknadsinsikter & Timing",
      prompt: "Vad händer på marknaden just nu och hur påverkar det min investeringsstrategi?",
      icon: <TrendingUp className="w-6 h-6" />,
      description: "Håll dig uppdaterad med aktuella marknadstrender och möjligheter"
    }
  ];

  // Show portfolio implementation page with tabs
  return (
    <Layout>
      <div className="min-h-screen" style={{ background: 'linear-gradient(135deg, #555879 0%, #98A1BC 25%, #DED3C4 60%, #F4EBD3 100%)' }}>
        <div className="container mx-auto px-4 py-8 max-w-[1600px]">
          {/* Artistic Header */}
          <div className="mb-8">
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 mb-8">
              <div className="space-y-4">
                <div className="flex items-center gap-4">
                  <div className="w-16 h-16 rounded-3xl flex items-center justify-center shadow-2xl transform -rotate-6 hover:rotate-0 transition-transform duration-300" style={{ background: 'linear-gradient(135deg, #555879, #98A1BC)' }}>
                    <Brain className="w-8 h-8 text-[#F4EBD3]" />
                  </div>
                  <div>
                    <h1 className="text-4xl xl:text-5xl font-bold mb-2" style={{ color: '#555879' }}>
                      AI Portfolio Hub
                    </h1>
                    <p className="text-xl" style={{ color: '#98A1BC' }}>
                      Intelligenta investeringsinsikter för din framgång
                    </p>
                  </div>
                </div>
                
                <div className="flex flex-wrap gap-3">
                  <Badge className="px-4 py-2 text-sm font-medium shadow-lg border-0 text-[#F4EBD3]" style={{ background: 'linear-gradient(135deg, #555879, #98A1BC)' }}>
                    <Brain className="w-4 h-4 mr-2" />
                    AI-Optimerad
                  </Badge>
                  <Badge className="px-4 py-2 text-sm font-medium shadow-lg border-0 text-[#555879]" style={{ background: 'linear-gradient(135deg, #DED3C4, #F4EBD3)' }}>
                    <Activity className="w-4 h-4 mr-2" />
                    Realtidsanalys
                  </Badge>
                  {activePortfolio && (
                    <Badge className="px-4 py-2 text-sm font-medium shadow-lg border-0 text-[#F4EBD3]" style={{ background: 'linear-gradient(135deg, #98A1BC, #555879)' }}>
                      <Target className="w-4 h-4 mr-2" />
                      Aktiv sedan {new Date(activePortfolio.created_at).toLocaleDateString('sv-SE')}
                    </Badge>
                  )}
                </div>
              </div>
              
              <Button
                variant="outline"
                onClick={handleUpdateProfile}
                className="backdrop-blur-sm border shadow-lg transition-all duration-200 px-6 py-3 hover:shadow-xl"
                style={{ 
                  backgroundColor: 'rgba(244, 235, 211, 0.9)',
                  borderColor: '#DED3C4',
                  color: '#555879'
                }}
              >
                <Settings className="w-5 h-5 mr-2" />
                Uppdatera Profil
              </Button>
            </div>
          </div>

          <Tabs defaultValue="chat" className="w-full">
            <TabsList className="grid w-full grid-cols-2 max-w-md mx-auto mb-8 backdrop-blur-sm border shadow-lg rounded-2xl p-1" style={{ backgroundColor: 'rgba(244, 235, 211, 0.9)', borderColor: '#DED3C4' }}>
              <TabsTrigger 
                value="chat" 
                data-value="chat" 
                className="flex items-center gap-3 rounded-xl py-3 px-4 font-medium transition-all duration-200 data-[state=active]:shadow-lg text-[#98A1BC]"
                style={{
                  'data-[state=active]:background': 'linear-gradient(135deg, #555879, #98A1BC)',
                  'data-[state=active]:color': '#F4EBD3'
                }}
              >
                <MessageSquare className="w-5 h-5" />
                AI-Assistent
              </TabsTrigger>
              <TabsTrigger 
                value="overview" 
                className="flex items-center gap-3 rounded-xl py-3 px-4 font-medium transition-all duration-200 data-[state=active]:shadow-lg text-[#98A1BC]"
                style={{
                  'data-[state=active]:background': 'linear-gradient(135deg, #555879, #98A1BC)',
                  'data-[state=active]:color': '#F4EBD3'
                }}
              >
                <BarChart3 className="w-5 h-5" />
                Portföljöversikt
              </TabsTrigger>
            </TabsList>
            
            <TabsContent value="chat" className="space-y-8">
              {/* Artistic Example Prompts */}
              <Card className="backdrop-blur-sm border shadow-2xl rounded-3xl overflow-hidden transform hover:scale-[1.02] transition-transform duration-300" style={{ backgroundColor: 'rgba(244, 235, 211, 0.95)', borderColor: '#DED3C4' }}>
                <CardHeader className="border-b pb-6" style={{ backgroundColor: 'rgba(222, 211, 196, 0.5)', borderColor: '#DED3C4' }}>
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-2xl flex items-center justify-center shadow-lg transform rotate-12 hover:rotate-0 transition-transform duration-300" style={{ background: 'linear-gradient(135deg, #555879, #98A1BC)' }}>
                      <Lightbulb className="w-6 h-6 text-[#F4EBD3]" />
                    </div>
                    <div>
                      <CardTitle className="text-2xl font-bold" style={{ color: '#555879' }}>
                        Kom igång med AI-assistenten
                      </CardTitle>
                      <CardDescription className="text-lg mt-1" style={{ color: '#98A1BC' }}>
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
                        className="h-auto p-8 text-left justify-start transition-all duration-300 group rounded-2xl backdrop-blur-sm shadow-lg hover:shadow-2xl hover:scale-105 border"
                        style={{ 
                          backgroundColor: 'rgba(244, 235, 211, 0.8)',
                          borderColor: '#DED3C4',
                          color: '#555879'
                        }}
                        onClick={() => handleExamplePrompt(example.prompt)}
                      >
                        <div className="flex items-start gap-6 w-full">
                          <div className="w-14 h-14 rounded-3xl flex items-center justify-center flex-shrink-0 shadow-lg group-hover:shadow-xl transition-all duration-300 text-[#F4EBD3] transform group-hover:rotate-12" style={{ background: 'linear-gradient(135deg, #555879, #98A1BC)' }}>
                            {example.icon}
                          </div>
                          <div className="flex-1 min-w-0 space-y-2">
                            <div className="font-bold text-lg" style={{ color: '#555879' }}>
                              {example.title}
                            </div>
                            <div className="text-sm leading-relaxed" style={{ color: '#98A1BC' }}>
                              {example.description}
                            </div>
                            <div className="text-xs italic" style={{ color: '#98A1BC' }}>
                              "{example.prompt}"
                            </div>
                          </div>
                        </div>
                      </Button>
                    ))}
                  </div>
                </CardContent>
              </Card>

              {/* AI Chat - Artistic styling */}
              <div className="backdrop-blur-sm rounded-3xl shadow-2xl border overflow-hidden transform hover:scale-[1.01] transition-transform duration-300" style={{ backgroundColor: 'rgba(244, 235, 211, 0.95)', borderColor: '#DED3C4' }}>
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
