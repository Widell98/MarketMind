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
      title: "Portföljanalys",
      prompt: "Ge mig en komplett analys av min portfölj med rekommendationer för optimering",
      icon: <PieChart className="w-6 h-6" />,
      description: "Få en genomgång av din portföljs prestanda och struktur"
    },
    {
      title: "Riskhantering", 
      prompt: "Analysera riskerna i min portfölj och föreslå strategier för bättre diversifiering",
      icon: <Activity className="w-6 h-6" />,
      description: "Identifiera och minimera risker för en mer balanserad portfölj"
    },
    {
      title: "Investeringsförslag",
      prompt: "Vilka aktier och tillgångar borde jag överväga nästa baserat på min profil?",
      icon: <Zap className="w-6 h-6" />,
      description: "Få personliga rekommendationer baserade på din riskprofil"
    },
    {
      title: "Marknadsinsikter",
      prompt: "Vad händer på marknaden just nu och hur påverkar det min investeringsstrategi?",
      icon: <TrendingUp className="w-6 h-6" />,
      description: "Håll dig uppdaterad med aktuella marknadstrender"
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
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-6 lg:py-8 max-w-[1400px]">
          {/* Modern Header */}
          <div className="mb-6">
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 mb-6">
              <div className="space-y-3">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-xl flex items-center justify-center bg-primary shadow-lg">
                    <Brain className="w-6 h-6 text-primary-foreground" />
                  </div>
                  <div>
                    <h1 className="text-2xl sm:text-3xl font-bold mb-1 text-foreground">
                      AI Portfolio Hub
                    </h1>
                    <p className="text-sm sm:text-base text-muted-foreground">
                      Intelligenta investeringsinsikter för din framgång
                    </p>
                  </div>
                </div>
                
                <div className="flex flex-wrap gap-2">
                  <Badge className="px-3 py-1 text-xs font-medium bg-primary text-primary-foreground border-0 shadow-sm">
                    <Brain className="w-3 h-3 mr-1.5" />
                    AI-Optimerad
                  </Badge>
                  <Badge className="px-3 py-1 text-xs font-medium bg-secondary text-secondary-foreground border-0 shadow-sm">
                    <Activity className="w-3 h-3 mr-1.5" />
                    Realtidsanalys
                  </Badge>
                  {activePortfolio && (
                    <Badge className="px-3 py-1 text-xs font-medium bg-accent text-accent-foreground border-0 shadow-sm">
                      <Target className="w-3 h-3 mr-1.5" />
                      Aktiv sedan {new Date(activePortfolio.created_at).toLocaleDateString('sv-SE')}
                    </Badge>
                  )}
                </div>
              </div>
              
              <Button
                variant="outline"
                onClick={handleUpdateProfile}
                className="bg-background border shadow-sm transition-all duration-200 px-4 py-2 hover:shadow-md text-sm"
              >
                <Settings className="w-4 h-4 mr-2" />
                Uppdatera Profil
              </Button>
            </div>
          </div>

          <Tabs defaultValue="chat" className="w-full">
            <TabsList className="grid w-full grid-cols-2 max-w-md mx-auto mb-6 bg-muted p-1 rounded-xl">
              <TabsTrigger 
                value="chat" 
                data-value="chat" 
                className="flex items-center gap-2 rounded-lg py-2 px-3 font-medium transition-all duration-200 data-[state=active]:bg-background data-[state=active]:shadow-sm text-sm"
              >
                <MessageSquare className="w-4 h-4" />
                <span className="hidden sm:inline">AI-Assistent</span>
                <span className="sm:hidden">AI</span>
              </TabsTrigger>
              <TabsTrigger 
                value="overview" 
                className="flex items-center gap-2 rounded-lg py-2 px-3 font-medium transition-all duration-200 data-[state=active]:bg-background data-[state=active]:shadow-sm text-sm"
              >
                <BarChart3 className="w-4 h-4" />
                <span className="hidden sm:inline">Portföljöversikt</span>
                <span className="sm:hidden">Översikt</span>
              </TabsTrigger>
            </TabsList>
            
            <TabsContent value="chat" className="space-y-6">
              {/* Modern Example Prompts */}
              <Card className="bg-card border shadow-lg rounded-2xl overflow-hidden">
                <CardHeader className="border-b bg-muted/30 pb-4">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl flex items-center justify-center bg-primary shadow-sm">
                      <Lightbulb className="w-5 h-5 text-primary-foreground" />
                    </div>
                    <div>
                      <CardTitle className="text-lg font-bold">
                        Kom igång med AI-assistenten
                      </CardTitle>
                      <CardDescription className="text-sm mt-0.5">
                        Välj ett förslag nedan eller skriv din egen fråga
                      </CardDescription>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="p-4 sm:p-6">
                  <div className="grid grid-cols-1 xl:grid-cols-2 gap-3 sm:gap-4">
                    {examplePrompts.map((example, index) => (
                      <Button
                        key={index}
                        variant="outline"
                        className="h-auto p-4 sm:p-5 text-left justify-start transition-all duration-200 group rounded-xl bg-background border shadow-sm hover:shadow-md hover:scale-[1.02]"
                        onClick={() => handleExamplePrompt(example.prompt)}
                      >
                        <div className="flex items-start gap-3 w-full">
                          <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 bg-primary shadow-sm group-hover:shadow-md transition-all duration-200 text-primary-foreground">
                            {example.icon}
                          </div>
                          <div className="flex-1 min-w-0 space-y-1.5">
                            <div className="font-semibold text-sm">
                              {example.title}
                            </div>
                            <div className="text-xs leading-relaxed text-muted-foreground">
                              {example.description}
                            </div>
                          </div>
                        </div>
                      </Button>
                    ))}
                  </div>
                </CardContent>
              </Card>

              {/* AI Chat - Modern styling */}
              <div className="bg-card rounded-2xl shadow-lg border overflow-hidden">
                <AIChat portfolioId={activePortfolio?.id} />
              </div>
            </TabsContent>
            
            <TabsContent value="overview">
              <div className="grid grid-cols-1 xl:grid-cols-4 gap-6">
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
