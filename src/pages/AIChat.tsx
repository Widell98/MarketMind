
import React, { useState, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import Layout from '@/components/Layout';
import AIChat from '@/components/AIChat';
import LoginPromptModal from '@/components/LoginPromptModal';
import AIMarketingPanel from '@/components/AIMarketingPanel';
import ModernExamplePrompts from '@/components/chat/ModernExamplePrompts';
import { usePortfolio } from '@/hooks/usePortfolio';
import { useAuth } from '@/contexts/AuthContext';
import { useRiskProfile } from '@/hooks/useRiskProfile';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Brain, MessageSquare, Activity, Target, AlertCircle, User, LogIn, Sparkles } from 'lucide-react';

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
        <div className="min-h-screen bg-gradient-to-br from-blue-50 to-purple-50 dark:from-gray-900 dark:to-gray-800">
          <div className="container mx-auto px-3 sm:px-4 lg:px-6 xl:px-8 py-4 sm:py-6 lg:py-8 max-w-[1600px]">
            <div className="flex items-center justify-center h-64">
              <div className="text-center">
                <div className="w-16 h-16 rounded-3xl bg-gradient-to-br from-primary to-blue-600 flex items-center justify-center mx-auto mb-4 shadow-2xl">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white"></div>
                </div>
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
        <div className="min-h-screen bg-gradient-to-br from-blue-50 to-purple-50 dark:from-gray-900 dark:to-gray-800">
          <div className="container mx-auto px-3 sm:px-4 lg:px-6 xl:px-8 py-4 sm:py-6 lg:py-8 max-w-[1600px]">
            <Card className="max-w-md mx-auto p-6 text-center bg-white/80 dark:bg-gray-900/80 backdrop-blur-xl border border-white/20 dark:border-gray-700/20 shadow-2xl rounded-3xl">
              <div className="w-16 h-16 rounded-3xl bg-gradient-to-br from-primary to-blue-600 flex items-center justify-center mx-auto mb-4 shadow-2xl">
                <AlertCircle className="w-8 h-8 text-white" />
              </div>
              <h3 className="text-lg font-semibold mb-2">Riskprofil krävs</h3>
              <p className="text-muted-foreground mb-4">
                Du behöver skapa en riskprofil för att använda AI-assistenten
              </p>
              <Button onClick={() => navigate('/portfolio-advisor')} className="bg-gradient-to-r from-primary to-blue-600 hover:from-primary/90 hover:to-blue-600/90">
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
      
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-purple-50 dark:from-gray-900 dark:to-gray-800">
        <div className="container mx-auto px-3 sm:px-4 lg:px-6 xl:px-8 py-4 sm:py-6 lg:py-8 max-w-[1600px]">
          {/* Header */}
          <div className="mb-4 sm:mb-6">
            <div className="flex flex-col gap-3 sm:gap-4 mb-4 sm:mb-6">
              <div className="space-y-2 sm:space-y-3">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-2xl bg-gradient-to-br from-primary to-blue-600 flex items-center justify-center shadow-2xl">
                    <MessageSquare className="w-6 h-6 sm:w-7 sm:h-7 text-white" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold mb-0.5 sm:mb-1 bg-gradient-to-r from-gray-900 to-gray-600 dark:from-white dark:to-gray-300 bg-clip-text text-transparent">
                      AI Portfolio Assistent
                    </h1>
                    <p className="text-xs sm:text-sm lg:text-base text-gray-600 dark:text-gray-400">
                      {stockName ? `Diskutera ${stockName}` : 'Din intelligenta investeringsrådgivare'}
                    </p>
                  </div>
                </div>
                
                <div className="flex flex-wrap gap-2">
                  <Badge className="px-3 py-1 text-xs font-medium bg-gradient-to-r from-primary to-blue-600 text-white border-0 shadow-lg">
                    <Brain className="w-3 h-3 mr-1.5" />
                    AI-Optimerad
                  </Badge>
                  <Badge className="px-3 py-1 text-xs font-medium bg-gradient-to-r from-green-500 to-emerald-600 text-white border-0 shadow-lg">
                    <Activity className="w-3 h-3 mr-1.5" />
                    Realtidsanalys
                  </Badge>
                  {user && activePortfolio && (
                    <Badge className="px-3 py-1 text-xs font-medium bg-gradient-to-r from-purple-500 to-pink-600 text-white border-0 shadow-lg">
                      <Target className="w-3 h-3 mr-1.5" />
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
                <div className="mb-4 sm:mb-6">
                  <ModernExamplePrompts onExampleClick={handleExamplePrompt} />
                </div>
              )}

              {/* Chat Container */}
              <Card className="bg-white/80 dark:bg-gray-900/80 backdrop-blur-xl border border-white/20 dark:border-gray-700/20 shadow-2xl rounded-3xl overflow-hidden">
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
                <Card className="bg-white/80 dark:bg-gray-900/80 backdrop-blur-xl border border-white/20 dark:border-gray-700/20 shadow-2xl rounded-3xl overflow-hidden">
                  {/* Demo Chat Interface for unauthenticated users */}
                  <div className="flex flex-col h-[90vh] lg:h-[92vh] xl:h-[95vh]">
                    {/* Chat Header */}
                    <div className="border-b border-white/10 dark:border-gray-700/10 bg-gradient-to-r from-primary/5 to-blue-600/5 p-4">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-primary to-blue-600 flex items-center justify-center shadow-lg">
                          <Brain className="w-4 h-4 text-white" />
                        </div>
                        <div>
                          <h3 className="font-semibold text-gray-900 dark:text-white">Demo Konversation</h3>
                          <p className="text-xs text-gray-600 dark:text-gray-400">Se hur AI-assistenten fungerar</p>
                        </div>
                      </div>
                    </div>

                    {/* Demo Messages */}
                    <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-6 max-w-6xl mx-auto w-full bg-gradient-to-br from-blue-50/30 to-purple-50/30 dark:from-gray-900/30 dark:to-gray-800/30">
                      {demoMessages.map((msg, index) => (
                        <div
                          key={index}
                          className={`flex gap-3 items-start animate-fade-in ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
                        >
                          {msg.role === 'assistant' && (
                            <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-primary to-blue-600 flex items-center justify-center flex-shrink-0 shadow-lg">
                              <div className="w-4 h-4 border-2 border-white rounded-full"></div>
                            </div>
                          )}
                          <div className={`max-w-[75%] rounded-2xl px-4 py-3 shadow-lg backdrop-blur-sm border ${
                            msg.role === 'user' 
                              ? 'bg-gradient-to-br from-primary to-blue-600 text-white border-primary/20 rounded-br-lg' 
                              : 'bg-white/80 dark:bg-gray-900/80 border-gray-200/50 dark:border-gray-700/50 rounded-tl-lg'
                          }`}>
                            <p className="text-sm leading-relaxed break-words whitespace-pre-wrap">{msg.content}</p>
                            <p className="text-xs opacity-70 mt-1">
                              {msg.timestamp.toLocaleTimeString('sv-SE', { 
                                hour: '2-digit', 
                                minute: '2-digit' 
                              })}
                            </p>
                          </div>
                          {msg.role === 'user' && (
                            <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-gray-200 to-gray-300 dark:from-gray-700 dark:to-gray-600 flex items-center justify-center flex-shrink-0 shadow-lg">
                              <div className="w-4 h-4 text-gray-600 dark:text-gray-300">👤</div>
                            </div>
                          )}
                        </div>
                      ))}
                    </div>

                    {/* Login Prompt Input Area */}
                    <div className="border-t border-white/10 dark:border-gray-700/10 p-4 max-w-6xl mx-auto w-full">
                      <div className="bg-gradient-to-r from-primary/5 to-blue-600/5 border border-primary/20 rounded-2xl p-4 backdrop-blur-sm">
                        <div className="flex flex-col sm:flex-row items-center gap-4">
                          <div className="flex items-center gap-3 flex-1">
                            <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-primary to-blue-600 flex items-center justify-center shadow-lg">
                              <LogIn className="w-6 h-6 text-white" />
                            </div>
                            <div className="text-center sm:text-left">
                              <h4 className="font-semibold text-foreground">Fortsätt konversationen</h4>
                              <p className="text-sm text-muted-foreground">Skapa ett konto för att få personliga AI-råd och portföljanalys</p>
                            </div>
                          </div>
                          <Button 
                            onClick={() => window.location.href = '/auth'} 
                            className="flex-shrink-0 bg-gradient-to-r from-primary to-blue-600 hover:from-primary/90 hover:to-blue-600/90 shadow-lg"
                          >
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
                <div className="sticky top-4">
                  <AIMarketingPanel />
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </Layout>
  );
};

export default AIChatPage;
