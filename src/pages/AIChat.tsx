
import React, { useState, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import Layout from '@/components/Layout';
import AIChat from '@/components/AIChat';
import LoginPromptModal from '@/components/LoginPromptModal';
import { usePortfolio } from '@/hooks/usePortfolio';
import { useAuth } from '@/contexts/AuthContext';
import { useRiskProfile } from '@/hooks/useRiskProfile';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Brain, MessageSquare, Activity, Target, Lightbulb, Zap, PieChart, TrendingUp, AlertCircle, User } from 'lucide-react';

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

  // Show loading state while checking risk profile
  if (user && riskProfileLoading) {
    return (
      <Layout>
        <div className="min-h-screen">
          <div className="container mx-auto px-3 sm:px-4 lg:px-6 xl:px-8 py-4 sm:py-6 lg:py-8 max-w-[1400px]">
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
          <div className="container mx-auto px-3 sm:px-4 lg:px-6 xl:px-8 py-4 sm:py-6 lg:py-8 max-w-[1400px]">
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
        <div className="container mx-auto px-3 sm:px-4 lg:px-6 xl:px-8 py-4 sm:py-6 lg:py-8 max-w-[1400px]">
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

          {/* Example Prompts - Only show if not coming from stock discussion and user is authenticated */}
          {!stockName && !message && user && riskProfile && (
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
          {user && riskProfile ? (
            <Card className="bg-card border shadow-lg rounded-2xl overflow-hidden">
              <AIChat 
                portfolioId={activePortfolio?.id} 
                initialStock={stockName} 
                initialMessage={message}
              />
            </Card>
          ) : (
            <>
              {/* Demo messages for unauthenticated users */}
              <div className="flex-1 overflow-hidden">
                <div className="h-full flex flex-col items-center justify-center p-6 text-center">
                  <div className="max-w-md space-y-6">
                    <div className="w-20 h-20 rounded-2xl bg-primary flex items-center justify-center mx-auto shadow-lg">
                      <Brain className="w-10 h-10 text-primary-foreground" />
                    </div>
                    
                    <div className="space-y-3">
                      <h3 className="text-xl font-bold text-foreground">AI Portfolio Assistent</h3>
                      <p className="text-muted-foreground">
                        Få personliga investeringsråd, portföljanalys och marknadsinsikter med hjälp av AI
                      </p>
                    </div>

                    <Card className="p-4 bg-muted/30 border-dashed">
                      <div className="flex items-start gap-3">
                        <MessageSquare className="w-5 h-5 text-primary mt-0.5 flex-shrink-0" />
                        <div className="text-left">
                          <p className="text-sm font-medium mb-1">Exempel på vad du kan fråga:</p>
                          <ul className="text-xs text-muted-foreground space-y-1">
                            <li>• "Analysera min portfölj och ge rekommendationer"</li>
                            <li>• "Vilka risker har mina nuvarande innehav?"</li>
                            <li>• "Föreslå bra aktier för min riskprofil"</li>
                          </ul>
                        </div>
                      </div>
                    </Card>

                    <Button onClick={() => window.location.href = '/auth'} className="w-full">
                      Logga in för att komma igång
                    </Button>
                  </div>
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </Layout>
  );
};

export default AIChatPage;
