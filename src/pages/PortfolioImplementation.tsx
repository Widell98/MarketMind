
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

  // Show loading while portfolio is loading
  if (loading) {
    return (
      <Layout>
        <div className="min-h-screen flex items-center justify-center">
          <div className="text-center p-8 bg-white dark:bg-gray-800 backdrop-blur-lg border border-gray-200 dark:border-gray-700 rounded-3xl shadow-2xl">
            <div className="w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-6 bg-primary shadow-2xl">
              <div className="w-8 h-8 border-4 border-white border-t-transparent rounded-full animate-spin"></div>
            </div>
            <h2 className="text-xl font-semibold mb-2 text-foreground">Laddar din portfölj</h2>
            <p className="text-muted-foreground">Hämtar dina investeringsdata...</p>
          </div>
        </div>
      </Layout>
    );
  }

  // Show onboarding if user doesn't have an active portfolio
  if (showOnboarding || !activePortfolio) {
    return (
      <Layout>
        <div className="min-h-screen py-8 px-4">
          <div className="max-w-5xl mx-auto">
            <div className="text-center mb-8">
              <div className="w-20 h-20 rounded-3xl flex items-center justify-center mx-auto mb-6 bg-primary shadow-2xl transform rotate-3 hover:rotate-0 transition-transform duration-300">
                <Brain className="w-10 h-10 text-primary-foreground" />
              </div>
              <h1 className="text-3xl lg:text-4xl font-bold mb-4 text-foreground">
                Välkommen till AI Portfolio
              </h1>
              <p className="text-lg max-w-2xl mx-auto text-muted-foreground">
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
      <div className="min-h-screen">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-6 lg:py-8 max-w-[1600px]">
          {/* Modern Header */}
          <div className="mb-8">
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 mb-8">
              <div className="space-y-4">
                <div className="flex items-center gap-4">
                  <div className="w-16 h-16 rounded-2xl flex items-center justify-center bg-primary shadow-xl transform -rotate-6 hover:rotate-0 transition-transform duration-300">
                    <Brain className="w-8 h-8 text-primary-foreground" />
                  </div>
                  <div>
                    <h1 className="text-3xl sm:text-4xl xl:text-5xl font-bold mb-2 text-foreground">
                      AI Portfolio Hub
                    </h1>
                    <p className="text-lg sm:text-xl text-muted-foreground">
                      Intelligenta investeringsinsikter för din framgång
                    </p>
                  </div>
                </div>
                
                <div className="flex flex-wrap gap-3">
                  <Badge className="px-4 py-2 text-sm font-medium bg-primary text-primary-foreground border-0 shadow-lg hover:shadow-xl transition-all duration-200">
                    <Brain className="w-4 h-4 mr-2" />
                    AI-Optimerad
                  </Badge>
                  <Badge className="px-4 py-2 text-sm font-medium bg-secondary text-secondary-foreground border-0 shadow-lg hover:shadow-xl transition-all duration-200">
                    <Activity className="w-4 h-4 mr-2" />
                    Realtidsanalys
                  </Badge>
                  {activePortfolio && (
                    <Badge className="px-4 py-2 text-sm font-medium bg-accent text-accent-foreground border-0 shadow-lg hover:shadow-xl transition-all duration-200">
                      <Target className="w-4 h-4 mr-2" />
                      Aktiv sedan {new Date(activePortfolio.created_at).toLocaleDateString('sv-SE')}
                    </Badge>
                  )}
                </div>
              </div>
              
              <Button
                variant="outline"
                onClick={handleUpdateProfile}
                className="bg-background/80 backdrop-blur-sm border shadow-lg transition-all duration-200 px-6 py-3 hover:shadow-xl"
              >
                <Settings className="w-5 h-5 mr-2" />
                Uppdatera Profil
              </Button>
            </div>
          </div>

          <Tabs defaultValue="chat" className="w-full">
            <TabsList className="grid w-full grid-cols-2 max-w-md mx-auto mb-8 bg-background/60 backdrop-blur-lg border shadow-lg rounded-2xl p-1">
              <TabsTrigger 
                value="chat" 
                data-value="chat" 
                className="flex items-center gap-3 rounded-xl py-3 px-4 font-medium transition-all duration-200 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground data-[state=active]:shadow-lg"
              >
                <MessageSquare className="w-5 h-5" />
                <span className="hidden sm:inline">AI-Assistent</span>
                <span className="sm:hidden">AI</span>
              </TabsTrigger>
              <TabsTrigger 
                value="overview" 
                className="flex items-center gap-3 rounded-xl py-3 px-4 font-medium transition-all duration-200 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground data-[state=active]:shadow-lg"
              >
                <BarChart3 className="w-5 h-5" />
                <span className="hidden sm:inline">Portföljöversikt</span>
                <span className="sm:hidden">Översikt</span>
              </TabsTrigger>
            </TabsList>
            
            <TabsContent value="chat" className="space-y-6 lg:space-y-8">
              {/* Modern Example Prompts */}
              <Card className="bg-card/70 backdrop-blur-lg border shadow-2xl rounded-3xl overflow-hidden transform hover:scale-[1.01] transition-transform duration-300">
                <CardHeader className="border-b bg-card/50 pb-6">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-2xl flex items-center justify-center bg-primary shadow-lg transform rotate-12 hover:rotate-0 transition-transform duration-300">
                      <Lightbulb className="w-6 h-6 text-primary-foreground" />
                    </div>
                    <div>
                      <CardTitle className="text-2xl font-bold">
                        Kom igång med AI-assistenten
                      </CardTitle>
                      <CardDescription className="text-lg mt-1">
                        Välj ett förslag nedan eller skriv din egen fråga
                      </CardDescription>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="p-6 lg:p-8">
                  <div className="grid grid-cols-1 xl:grid-cols-2 gap-4 lg:gap-6">
                    {examplePrompts.map((example, index) => (
                      <Button
                        key={index}
                        variant="outline"
                        className="h-auto p-6 lg:p-8 text-left justify-start transition-all duration-300 group rounded-2xl bg-background/50 backdrop-blur-sm shadow-lg hover:shadow-2xl hover:scale-105 border"
                        onClick={() => handleExamplePrompt(example.prompt)}
                      >
                        <div className="flex items-start gap-4 lg:gap-6 w-full">
                          <div className="w-12 h-12 lg:w-14 lg:h-14 rounded-2xl lg:rounded-3xl flex items-center justify-center flex-shrink-0 bg-primary shadow-lg group-hover:shadow-xl transition-all duration-300 text-primary-foreground transform group-hover:rotate-12">
                            {example.icon}
                          </div>
                          <div className="flex-1 min-w-0 space-y-2">
                            <div className="font-bold text-base lg:text-lg">
                              {example.title}
                            </div>
                            <div className="text-sm leading-relaxed text-muted-foreground">
                              {example.description}
                            </div>
                            <div className="text-xs italic text-muted-foreground line-clamp-2">
                              "{example.prompt}"
                            </div>
                          </div>
                        </div>
                      </Button>
                    ))}
                  </div>
                </CardContent>
              </Card>

              {/* AI Chat - Modern styling */}
              <div className="bg-card/70 backdrop-blur-lg rounded-3xl shadow-2xl border overflow-hidden transform hover:scale-[1.005] transition-transform duration-300">
                <AIChat portfolioId={activePortfolio?.id} />
              </div>
            </TabsContent>
            
            <TabsContent value="overview">
              <div className="grid grid-cols-1 xl:grid-cols-4 gap-6 lg:gap-8">
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
