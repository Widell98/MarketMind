import React, { useState, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import Layout from '@/components/Layout';
import AIChat from '@/components/AIChat';
import LoginPromptModal from '@/components/LoginPromptModal';
import AIMarketingPanel from '@/components/AIMarketingPanel';
import { usePortfolio } from '@/hooks/usePortfolio';
import { useAuth } from '@/contexts/AuthContext';
import { useLanguage } from '@/contexts/LanguageContext';
import { useRiskProfile } from '@/hooks/useRiskProfile';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Brain, MessageSquare, Activity, Target, Lightbulb, Zap, PieChart, TrendingUp, AlertCircle, User, LogIn } from 'lucide-react';
const AIChatPage = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { t } = useLanguage();
  const { riskProfile, loading: riskProfileLoading } = useRiskProfile();
  const stockName = searchParams.get('stock');
  const message = searchParams.get('message');
  const {
    activePortfolio
  } = usePortfolio();
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
        detail: {
          message: prompt
        }
      });
      window.dispatchEvent(event);
    }, 100);
  };
  const examplePrompts = [{
    title: t('aiChat.features.portfolioAnalysis'),
    prompt: t('aiChat.features.portfolioAnalysisPrompt'),
    icon: <PieChart className="w-4 h-4 sm:w-5 sm:h-5" />,
    description: t('aiChat.features.portfolioAnalysisDesc')
  }, {
    title: t('aiChat.features.riskManagement'),
    prompt: t('aiChat.features.riskManagementPrompt'),
    icon: <Activity className="w-4 h-4 sm:w-5 sm:h-5" />,
    description: t('aiChat.features.riskManagementDesc')
  }, {
    title: t('aiChat.features.investmentSuggestions'),
    prompt: t('aiChat.features.investmentSuggestionsPrompt'),
    icon: <Zap className="w-4 h-4 sm:w-5 sm:h-5" />,
    description: t('aiChat.features.investmentSuggestionsDesc')
  }, {
    title: t('aiChat.features.marketInsights'),
    prompt: t('aiChat.features.marketInsightsPrompt'),
    icon: <TrendingUp className="w-4 h-4 sm:w-5 sm:h-5" />,
    description: t('aiChat.features.marketInsightsDesc')
  }];

  // Mock chat messages for demo
  const demoMessages = [{
    role: 'assistant',
    content: t('aiChat.demo.assistantGreeting'),
    timestamp: new Date(Date.now() - 300000) // 5 minutes ago
  }, {
    role: 'user',
    content: t('aiChat.demo.userExample'),
    timestamp: new Date(Date.now() - 240000) // 4 minutes ago
  }, {
    role: 'assistant',
    content: t('aiChat.demo.assistantResponse'),
    timestamp: new Date(Date.now() - 180000) // 3 minutes ago
  }];

  // Show loading state while checking risk profile
  if (user && riskProfileLoading) {
    return <Layout>
        <div className="min-h-screen">
          <div className="container mx-auto px-3 sm:px-4 lg:px-6 xl:px-8 py-4 sm:py-6 lg:py-8 max-w-[1600px]">
            <div className="flex items-center justify-center h-64">
              <div className="text-center">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
                <p className="text-muted-foreground">{t('aiChat.loading')}</p>
              </div>
            </div>
          </div>
        </div>
      </Layout>;
  }

  // Show message for users without risk profile (shouldn't happen due to redirect, but as fallback)
  if (user && !riskProfile) {
    return <Layout>
        <div className="min-h-screen">
          <div className="container mx-auto px-3 sm:px-4 lg:px-6 xl:px-8 py-4 sm:py-6 lg:py-8 max-w-[1600px]">
            <Card className="max-w-md mx-auto p-6 text-center">
              <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-4">
                <AlertCircle className="w-8 h-8 text-primary" />
              </div>
              <h3 className="text-lg font-semibold mb-2">{t('aiChat.riskProfileRequired')}</h3>
              <p className="text-muted-foreground mb-4">
                {t('aiChat.riskProfileDesc')}
              </p>
              <Button onClick={() => navigate('/portfolio-advisor')}>
                <User className="w-4 h-4 mr-2" />
                {t('aiChat.createRiskProfile')}
              </Button>
            </Card>
          </div>
        </div>
      </Layout>;
  }
  return <Layout>
      <LoginPromptModal isOpen={showLoginModal} onClose={() => setShowLoginModal(false)} />
      
      {/* Full-height container with gradient background */}
      <div className="min-h-0 bg-gradient-to-br from-background via-background to-primary/[0.02]">
        <div className="w-full max-w-7xl mx-auto px-2 sm:px-4 lg:px-6 xl:px-8 h-full">
          {/* Compact Header Section for logged in users */}
          {user && riskProfile ? <div className="pt-4 pb-2">
              <div className="text-center">
                
              </div>
            </div> : <div className="pt-8 pb-6 sm:pt-12 sm:pb-8">
              <div className="text-center max-w-3xl mx-auto">
                <div className="inline-flex items-center justify-center w-16 h-16 sm:w-20 sm:h-20 bg-primary/10 backdrop-blur-sm rounded-3xl mb-6 shadow-2xl shadow-primary/10">
                  <Brain className="w-8 h-8 sm:w-10 sm:h-10 text-primary" />
                </div>
                
                <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-foreground mb-4 tracking-tight">
                  {t('aiChat.title')}
                </h1>
                <p className="text-lg sm:text-xl text-muted-foreground max-w-2xl mx-auto leading-relaxed">
                  {t('aiChat.subtitle')}
                </p>
              </div>
            </div>}

          {/* Content based on authentication status */}
          {user && riskProfile ? (/* Full Chat Interface */
        <div className="h-[calc(100vh-12rem)] sm:h-[calc(100vh-10rem)] lg:h-[calc(100vh-8rem)] min-h-[400px]">
              <AIChat portfolioId={activePortfolio?.id} initialStock={stockName} initialMessage={message} />
            </div>) : (/* Demo Content for non-authenticated users */
        <div className="grid grid-cols-1 xl:grid-cols-12 gap-4 sm:gap-6 lg:gap-8 pb-4 sm:pb-6 lg:pb-8">
              {/* Demo Chat - Main Content */}
              <div className="xl:col-span-8 min-w-0">
                <div className="bg-white/80 dark:bg-card/80 backdrop-blur-xl border border-white/20 dark:border-border/50 shadow-2xl rounded-3xl overflow-hidden">
                  {/* Chat Header */}
                  <div className="bg-gradient-to-r from-primary/5 to-primary/10 border-b border-border/30 p-6">
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 rounded-2xl bg-primary/20 backdrop-blur-sm flex items-center justify-center shadow-lg">
                        <MessageSquare className="w-6 h-6 text-primary" />
                      </div>
                      <div>
                        <h3 className="text-xl font-semibold text-foreground">{t('aiChat.demo.title')}</h3>
                        <p className="text-muted-foreground">{t('aiChat.demo.subtitle')}</p>
                      </div>
                      <div className="ml-auto">
                        <Badge className="bg-primary/20 text-primary border-primary/30 px-3 py-1 rounded-full font-medium">
                          <Zap className="w-3 h-3 mr-1.5" />
                          {t('aiChat.demo.liveDemo')}
                        </Badge>
                      </div>
                    </div>
                  </div>

                  {/* Demo Messages */}
                  <div className="p-3 sm:p-6 lg:p-8 space-y-4 sm:space-y-6 lg:space-y-8 min-h-[300px] sm:min-h-[400px] max-h-[400px] sm:max-h-[500px] overflow-y-auto">
                    {demoMessages.map((msg, index) => <div key={index} className={`flex items-start gap-4 ${msg.role === 'user' ? 'flex-row-reverse' : ''}`}>
                        {/* Avatar */}
                        <div className={`w-10 h-10 rounded-2xl flex items-center justify-center flex-shrink-0 shadow-lg ${msg.role === 'user' ? 'bg-primary text-primary-foreground' : 'bg-gradient-to-br from-primary/20 to-primary/30 text-primary'}`}>
                          {msg.role === 'user' ? <User className="w-5 h-5" /> : <Brain className="w-5 h-5" />}
                        </div>

                        {/* Message Bubble */}
                        <div className={`max-w-[70%] ${msg.role === 'user' ? 'bg-primary text-primary-foreground shadow-primary/25' : 'bg-muted/70 text-foreground shadow-black/5'} rounded-3xl px-6 py-4 shadow-xl backdrop-blur-sm`}>
                          <p className="text-sm sm:text-base leading-relaxed break-words whitespace-pre-wrap">
                            {msg.content}
                          </p>
                          <p className="text-xs opacity-70 mt-3 font-medium">
                            {msg.timestamp.toLocaleTimeString('sv-SE', {
                        hour: '2-digit',
                        minute: '2-digit'
                      })}
                          </p>
                        </div>
                      </div>)}
                  </div>

                  {/* Login Prompt */}
                  <div className="border-t border-border/30 p-6 sm:p-8">
                    <div className="bg-gradient-to-r from-primary/5 via-primary/10 to-primary/5 border border-primary/20 rounded-3xl p-6 backdrop-blur-sm">
                      <div className="flex flex-col sm:flex-row items-center gap-6">
                        <div className="flex items-center gap-4 flex-1">
                          <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-primary to-primary/80 flex items-center justify-center shadow-xl shadow-primary/25">
                            <LogIn className="w-7 h-7 text-primary-foreground" />
                          </div>
                          <div className="text-center sm:text-left">
                            <h4 className="text-lg font-semibold text-foreground mb-1">
                              {t('aiChat.demo.continueConversation')}
                            </h4>
                            <p className="text-muted-foreground leading-relaxed">
                              {t('aiChat.demo.loginPrompt')}
                            </p>
                          </div>
                        </div>
                        <Button onClick={() => window.location.href = '/auth'} className="flex-shrink-0 px-8 py-3 rounded-2xl font-semibold shadow-xl hover:shadow-2xl transition-all duration-300 hover:scale-105" size="lg">
                          <LogIn className="w-4 h-4 mr-2" />
                          {t('aiChat.demo.loginButton')}
                        </Button>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Right sidebar - Features & Marketing */}
              <div className="xl:col-span-4 space-y-4 sm:space-y-6 min-w-0">
                {/* AI Features Card */}
                <div className="bg-white/80 dark:bg-card/80 backdrop-blur-xl border border-white/20 dark:border-border/50 shadow-2xl rounded-3xl p-6 sm:p-8">
                  <div className="flex items-center gap-3 mb-6">
                    <div className="w-10 h-10 rounded-2xl bg-primary/20 flex items-center justify-center">
                      <Lightbulb className="w-5 h-5 text-primary" />
                    </div>
                    <h3 className="text-xl font-semibold text-foreground">{t('aiChat.features.title')}</h3>
                  </div>
                  
                  <div className="space-y-4">
                    {examplePrompts.map((prompt, index) => <div key={index} className="group p-4 rounded-2xl bg-muted/50 hover:bg-primary/10 border border-transparent hover:border-primary/20 transition-all duration-300 cursor-pointer" onClick={() => handleExamplePrompt(prompt.prompt)}>
                        <div className="flex items-start gap-3">
                          <div className="w-8 h-8 rounded-xl bg-primary/20 flex items-center justify-center flex-shrink-0 group-hover:bg-primary/30 transition-colors">
                            {prompt.icon}
                          </div>
                          <div className="flex-1 min-w-0">
                            <h4 className="font-medium text-foreground mb-1 group-hover:text-primary transition-colors">
                              {prompt.title}
                            </h4>
                            <p className="text-sm text-muted-foreground leading-relaxed">
                              {prompt.description}
                            </p>
                          </div>
                        </div>
                      </div>)}
                  </div>
                </div>

                {/* Marketing Panel */}
                <AIMarketingPanel />
              </div>
            </div>)}
        </div>
      </div>
    </Layout>;
};
export default AIChatPage;