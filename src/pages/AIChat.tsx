
import React, { useState, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import Layout from '@/components/Layout';
import AIChat from '@/components/AIChat';
import LoginPromptModal from '@/components/LoginPromptModal';
import AIMarketingPanel from '@/components/AIMarketingPanel';
import { usePortfolio } from '@/hooks/usePortfolio';
import { useAuth } from '@/contexts/AuthContext';
import { useRiskProfile } from '@/hooks/useRiskProfile';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Brain, MessageSquare, Activity, Target, Lightbulb, Zap, PieChart, TrendingUp, AlertCircle, User, LogIn } from 'lucide-react';

const AIChatPage = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { riskProfile, loading: riskProfileLoading } = useRiskProfile();
  const stockName = searchParams.get('stock');
  const message = searchParams.get('message');
  const { activePortfolio } = usePortfolio();
  const [showLoginModal, setShowLoginModal] = useState(false);

  // Redirect to portfolio advisor if no risk profile exists
  useEffect(() => {
    if (user && !riskProfileLoading && !riskProfile) {
      navigate('/portfolio-advisor');
    }
  }, [user, riskProfile, riskProfileLoading, navigate]);

  const handleExamplePrompt = (prompt: string) => {
    if (!user) {
      setShowLoginModal(true);
      return;
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
      icon: <PieChart className="w-4 h-4 sm:w-5 sm:h-5" />,
      description: "Få en genomgång av din portföljs prestanda och struktur"
    },
    {
      title: "Riskhantering", 
      prompt: "Analysera riskerna i min portfölj och föreslå strategier för bättre diversifiering",
      icon: <Activity className="w-4 h-4 sm:w-5 sm:h-5" />,
      description: "Identifiera och minimera risker för en mer balanserad portfölj"
    },
    {
      title: "Investeringsförslag",
      prompt: "Vilka aktier och tillgångar borde jag överväga nästa baserat på min profil?",
      icon: <Zap className="w-4 h-4 sm:w-5 sm:h-5" />,
      description: "Få personliga rekommendationer baserade på din riskprofil"
    },
    {
      title: "Marknadsinsikter",
      prompt: "Vad händer på marknaden just nu och hur påverkar det min investeringsstrategi?",
      icon: <TrendingUp className="w-4 h-4 sm:w-5 sm:h-5" />,
      description: "Håll dig uppdaterad med aktuella marknadstrender"
    }
  ];

  // Mock chat messages for demo
  const demoMessages = [
    {
      role: 'assistant',
      content: 'Hej! Jag är din AI Portfolio Assistent. Jag hjälper dig med investeringsråd, portföljanalys och marknadsinsikter. Vad kan jag hjälpa dig med idag?',
      timestamp: new Date(Date.now() - 300000) // 5 minutes ago
    },
    {
      role: 'user', 
      content: 'Gör en analys av tesla',
      timestamp: new Date(Date.now() - 240000) // 4 minutes ago
    },
    {
      role: 'assistant',
      content: 'Tesla (TSLA) är definitivt en intressant investering att diskutera! För att ge dig den bästa analysen behöver jag veta mer om din investeringsprofil och mål. Skapa ett konto så kan jag ge dig personliga rekommendationer baserat på din riskprofil.',
      timestamp: new Date(Date.now() - 180000) // 3 minutes ago
    }
  ];

  // Show loading state while checking risk profile
  if (user && riskProfileLoading) {
    return (
      <Layout>
        <div className="min-h-screen">
          <div className="container mx-auto px-3 sm:px-4 lg:px-6 xl:px-8 py-4 sm:py-6 lg:py-8 max-w-[1600px]">
            <div className="flex items-center justify-center h-64">
              <div className="text-center">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
                <p className="text-muted-foreground">Laddar...</p>
              </div>
            </div>
          </div>
        </div>
      </Layout>
    );
  }

  // Show message for users without risk profile (shouldn't happen due to redirect, but as fallback)
  if (user && !riskProfile) {
    return (
      <Layout>
        <div className="min-h-screen">
          <div className="container mx-auto px-3 sm:px-4 lg:px-6 xl:px-8 py-4 sm:py-6 lg:py-8 max-w-[1600px]">
            <Card className="max-w-md mx-auto p-6 text-center">
              <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-4">
                <AlertCircle className="w-8 h-8 text-primary" />
              </div>
              <h3 className="text-lg font-semibold mb-2">Riskprofil krävs</h3>
              <p className="text-muted-foreground mb-4">
                Du behöver skapa en riskprofil för att använda AI-assistenten
              </p>
              <Button onClick={() => navigate('/portfolio-advisor')}>
                <User className="w-4 h-4 mr-2" />
                Skapa riskprofil
              </Button>
            </Card>
          </div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <LoginPromptModal 
        isOpen={showLoginModal} 
        onClose={() => setShowLoginModal(false)} 
      />
      
      <div className="min-h-screen">
        <div className="container mx-auto px-3 sm:px-4 lg:px-6 xl:px-8 py-4 sm:py-6 lg:py-8 max-w-[1600px]">
          {/* Header */}
          <div className="mb-4 sm:mb-6">
            <div className="flex flex-col gap-3 sm:gap-4 mb-4 sm:mb-6">
              <div className="space-y-2 sm:space-y-3">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl flex items-center justify-center bg-primary shadow-lg">
                    <MessageSquare className="w-5 h-5 sm:w-6 sm:h-6 text-primary-foreground" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold mb-0.5 sm:mb-1 text-foreground">
                      AI Portfolio Assistent
                    </h1>
                    <p className="text-xs sm:text-sm lg:text-base text-muted-foreground">
                      {stockName ? `Diskutera ${stockName}` : 'Din intelligenta investeringsrådgivare'}
                    </p>
                  </div>
                </div>
                
                <div className="flex flex-wrap gap-1.5 sm:gap-2">
                  <Badge className="px-2 sm:px-3 py-0.5 sm:py-1 text-xs font-medium bg-primary text-primary-foreground border-0 shadow-sm">
                    <Brain className="w-2.5 h-2.5 sm:w-3 sm:h-3 mr-1 sm:mr-1.5" />
                    AI-Optimerad
                  </Badge>
                  <Badge className="px-2 sm:px-3 py-0.5 sm:py-1 text-xs font-medium bg-secondary text-secondary-foreground border-0 shadow-sm">
                    <Activity className="w-2.5 h-2.5 sm:w-3 sm:h-3 mr-1 sm:mr-1.5" />
                    Realtidsanalys
                  </Badge>
                  {user && activePortfolio && (
                    <Badge className="px-2 sm:px-3 py-0.5 sm:py-1 text-xs font-medium bg-accent text-accent-foreground border-0 shadow-sm">
                      <Target className="w-2.5 h-2.5 sm:w-3 sm:h-3 mr-1 sm:mr-1.5" />
                      <span className="hidden sm:inline">Aktiv sedan {new Date(activePortfolio.created_at).toLocaleDateString('sv-SE')}</span>
                      <span className="sm:hidden">Aktiv</span>
                    </Badge>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Content based on authentication status */}
          {user && riskProfile ? (
            <>
              {/* Example Prompts - Only show if not coming from stock discussion and user is authenticated */}
              {!stockName && !message && (
                <Card className="bg-card border shadow-lg rounded-2xl overflow-hidden mb-4 sm:mb-6">
                  <div className="border-b bg-muted/30 pb-3 sm:pb-4 p-4 sm:p-6">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-xl flex items-center justify-center bg-primary shadow-sm">
                        <Lightbulb className="w-4 h-4 sm:w-5 sm:h-5 text-primary-foreground" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <h2 className="text-base sm:text-lg font-bold">
                          Kom igång med AI-assistenten
                        </h2>
                        <p className="text-xs sm:text-sm mt-0.5 text-muted-foreground">
                          Välj ett förslag nedan eller skriv din egen fråga
                        </p>
                      </div>
                    </div>
                  </div>
                  <div className="p-3 sm:p-4 lg:p-6">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 sm:gap-3 lg:gap-4">
                      {examplePrompts.map((example, index) => (
                        <Button
                          key={index}
                          variant="outline"
                          className="h-auto p-3 sm:p-4 lg:p-5 text-left justify-start transition-all duration-200 group rounded-xl bg-background border shadow-sm hover:shadow-md hover:scale-[1.02] active:scale-95 overflow-hidden"
                          onClick={() => handleExamplePrompt(example.prompt)}
                        >
                          <div className="flex items-start gap-2.5 sm:gap-3 w-full min-w-0">
                            <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-xl flex items-center justify-center flex-shrink-0 bg-primary shadow-sm group-hover:shadow-md transition-all duration-200 text-primary-foreground">
                              {example.icon}
                            </div>
                            <div className="flex-1 min-w-0 space-y-1 sm:space-y-1.5">
                              <div className="font-semibold text-xs sm:text-sm leading-tight">
                                {example.title}
                              </div>
                              <div className="text-xs leading-relaxed text-muted-foreground break-words">
                                {example.description}
                              </div>
                            </div>
                          </div>
                        </Button>
                      ))}
                    </div>
                  </div>
                </Card>
              )}

              {/* Chat Container */}
              <Card className="bg-card border shadow-lg rounded-2xl overflow-hidden">
                <AIChat 
                  portfolioId={activePortfolio?.id} 
                  initialStock={stockName} 
                  initialMessage={message}
                />
              </Card>
            </>
          ) : (
            /* Content for non-authenticated users */
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Left side - Demo Chat */}
              <div className="lg:col-span-2">
                <Card className="bg-card border shadow-lg rounded-2xl overflow-hidden">
                  {/* Demo Chat Interface for unauthenticated users */}
                  <div className="flex flex-col h-[90vh] lg:h-[92vh] xl:h-[95vh]">
                    {/* Chat Header */}
                    <div className="border-b bg-muted/30 p-4">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-primary flex items-center justify-center">
                          <Brain className="w-4 h-4 text-primary-foreground" />
                        </div>
                        <div>
                          <h3 className="font-semibold">Demo Konversation</h3>
                          <p className="text-xs text-muted-foreground">Se hur AI-assistenten fungerar</p>
                        </div>
                      </div>
                    </div>

                    {/* Demo Messages */}
                    <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-6 max-w-6xl mx-auto w-full">
                      {demoMessages.map((msg, index) => (
                        <div
                          key={index}
                          className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
                        >
                          <div className={`max-w-[75%] ${
                            msg.role === 'user' 
                              ? 'bg-primary text-primary-foreground' 
                              : 'bg-muted'
                          } rounded-2xl px-4 py-3`}>
                            <p className="text-sm leading-relaxed break-words whitespace-pre-wrap">{msg.content}</p>
                            <p className="text-xs opacity-70 mt-1">
                              {msg.timestamp.toLocaleTimeString('sv-SE', { 
                                hour: '2-digit', 
                                minute: '2-digit' 
                              })}
                            </p>
                          </div>
                        </div>
                      ))}
                    </div>

                    {/* Login Prompt Input Area */}
                    <div className="border-t p-4 max-w-6xl mx-auto w-full">
                      <div className="bg-primary/5 border border-primary/20 rounded-2xl p-4">
                        <div className="flex flex-col sm:flex-row items-center gap-4">
                          <div className="flex items-center gap-3 flex-1">
                            <div className="w-12 h-12 rounded-xl bg-primary flex items-center justify-center">
                              <LogIn className="w-6 h-6 text-primary-foreground" />
                            </div>
                            <div className="text-center sm:text-left">
                              <h4 className="font-semibold text-foreground">Fortsätt konversationen</h4>
                              <p className="text-sm text-muted-foreground">Skapa ett konto för att få personliga AI-råd och portföljanalys</p>
                            </div>
                          </div>
                          <Button onClick={() => window.location.href = '/auth'} className="flex-shrink-0">
                            <LogIn className="w-4 h-4 mr-2" />
                            Logga in / Skapa konto
                          </Button>
                        </div>
                      </div>
                    </div>
                  </div>
                </Card>
              </div>

              {/* Right side - AI Marketing Panel */}
              <div className="lg:col-span-1">
                <AIMarketingPanel />
              </div>
            </div>
          )}
        </div>
      </div>
    </Layout>
  );
};

export default AIChatPage;
