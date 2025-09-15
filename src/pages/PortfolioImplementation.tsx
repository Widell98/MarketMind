import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Layout from '@/components/Layout';
import PortfolioOverview from '@/components/PortfolioOverview';
import ConversationalPortfolioAdvisor from '@/components/ConversationalPortfolioAdvisor';
import LoginPromptModal from '@/components/LoginPromptModal';
import PortfolioValueCards from '@/components/PortfolioValueCards';
import CommunityRecommendations from '@/components/CommunityRecommendations';
import { usePortfolio } from '@/hooks/usePortfolio';
import { useUserHoldings } from '@/hooks/useUserHoldings';
import { useAuth } from '@/contexts/AuthContext';
import { useLanguage } from '@/contexts/LanguageContext';
import { useRiskProfile } from '@/hooks/useRiskProfile';
import { usePortfolioPerformance } from '@/hooks/usePortfolioPerformance';
import { Button } from '@/components/ui/button';
import { Brain, AlertCircle, User } from 'lucide-react';
import FloatingActionButton from '@/components/FloatingActionButton';
import Breadcrumb from '@/components/Breadcrumb';
const PortfolioImplementation = () => {
  const {
    actualHoldings
  } = useUserHoldings();
  const {
    activePortfolio,
    loading
  } = usePortfolio();
  const {
    user,
    loading: authLoading
  } = useAuth();
  const {
    t
  } = useLanguage();
  const {
    riskProfile,
    loading: riskProfileLoading
  } = useRiskProfile();
  const {
    performance,
    loading: perfLoading
  } = usePortfolioPerformance();
  const navigate = useNavigate();
  const [showOnboarding, setShowOnboarding] = useState(false);
  const [showLoginModal, setShowLoginModal] = useState(false);
  const [lastUpdated, setLastUpdated] = useState<string | null>(null);
  useEffect(() => {
    // Only show login modal if auth has finished loading and user is not authenticated
    if (!authLoading && !user) {
      setShowLoginModal(true);
    } else if (user) {
      setShowLoginModal(false);
    }
  }, [user, authLoading]);
  useEffect(() => {
    if (!user || loading) return;
    setShowOnboarding(false);
  }, [user, activePortfolio, loading]);
  useEffect(() => {
    if (!performance) {
      return;
    }

    // Set last updated time
    setLastUpdated(new Date().toLocaleTimeString('sv-SE', {
      hour: '2-digit',
      minute: '2-digit'
    }));
  }, [performance]);
  const handleQuickChat = (message: string) => {
    if (!riskProfile) {
      return;
    }
    if (message.startsWith('NEW_SESSION:')) {
      const [, sessionName, actualMessage] = message.split(':');
      navigate('/ai-chat', {
        state: {
          createNewSession: true,
          sessionName,
          initialMessage: actualMessage
        }
      });
    } else {
      navigate('/ai-chat');
    }
  };
  const handleActionClick = (action: string) => {
    console.log('Action clicked:', action);
  };
  const handleUpdateProfile = () => {
    setShowOnboarding(true);
  };

  // Show loading while portfolio is loading
  if (loading || riskProfileLoading || perfLoading || !performance) {
    return <Layout>
        <div className="min-h-screen flex items-center justify-center p-4">
          <div className="text-center p-6 bg-white dark:bg-gray-800 backdrop-blur-lg border border-gray-200 dark:border-gray-700 rounded-2xl shadow-2xl w-full max-w-sm mx-auto">
            <div className="w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-6 bg-primary shadow-2xl">
              <div className="w-8 h-8 border-4 border-white border-t-transparent rounded-full animate-spin"></div>
            </div>
            <h2 className="text-lg font-semibold mb-2 text-foreground">{t('portfolio.loading')}</h2>
            <p className="text-sm text-muted-foreground">{t('portfolio.loadingDesc')}</p>
          </div>
        </div>
      </Layout>;
  }

  // Show onboarding if user explicitly wants to create a profile
  if (showOnboarding) {
    return <Layout>
        <div className="min-h-screen py-6 px-4">
          <div className="max-w-5xl mx-auto">
            <div className="text-center mb-8">
              <div className="w-20 h-20 rounded-3xl flex items-center justify-center mx-auto mb-6 bg-primary shadow-2xl transform rotate-3 hover:rotate-0 transition-transform duration-300">
                <Brain className="w-10 h-10 text-primary-foreground" />
              </div>
              <h1 className="text-3xl font-bold mb-4 text-foreground">
                {t('portfolio.createProfile')}
              </h1>
              <p className="text-lg max-w-2xl mx-auto text-muted-foreground px-4">
                {t('portfolio.createProfileDesc')}
              </p>
            </div>
            <ConversationalPortfolioAdvisor />
          </div>
        </div>
      </Layout>;
  }
  const totalPortfolioValue = performance.totalPortfolioValue;

  // Calculate portfolio health metrics - fix the actualHoldings check
  const calculateHealthMetrics = () => {
    const totalHoldings = actualHoldings ? actualHoldings.length : 0;
    const uniqueSectors = actualHoldings && actualHoldings.length > 0 ? new Set(actualHoldings.filter(h => h.sector).map(h => h.sector)).size : 0;
    return {
      diversificationScore: Math.min(100, uniqueSectors / Math.max(1, totalHoldings) * 100 + 20),
      riskScore: Math.max(20, 100 - performance.totalCash / Math.max(1, totalPortfolioValue) * 200),
      performanceScore: 75,
      // Mock performance score
      cashPercentage: totalPortfolioValue > 0 ? performance.totalCash / totalPortfolioValue * 100 : 0
    };
  };
  const healthMetrics = calculateHealthMetrics();

  // Always show portfolio implementation page with tabs
  return <Layout>
      <LoginPromptModal isOpen={showLoginModal} onClose={() => setShowLoginModal(false)} />
      
      <div className="min-h-0 bg-gradient-to-br from-background to-secondary/5">
        <div className="w-full max-w-7xl mx-auto px-2 sm:px-4 lg:px-6 py-4 sm:py-8 lg:py-12">
          {/* Breadcrumb Navigation */}
          <div className="mb-8">
            <Breadcrumb />
          </div>
          
          {/* Clean Header */}
          <div className="text-center mb-16">
            <div className="w-20 h-20 rounded-3xl flex items-center justify-center mx-auto mb-8 bg-primary/10 border border-primary/20 shadow-lg">
              <Brain className="w-10 h-10 text-primary" />
            </div>
            <h1 className="text-4xl font-bold mb-4 text-foreground">
              {t('portfolio.title')}
            </h1>
            
            
            
          </div>

          {/* Portfolio Health Score */}
          {user && totalPortfolioValue > 0 && <div className="mb-12">
              
            </div>}

          {/* Portfolio Value Cards */}
          <div className="mb-12">
            <PortfolioValueCards
              totalPortfolioValue={totalPortfolioValue}
              totalInvestedValue={performance.totalValue}
              totalCashValue={performance.totalCash}
              loading={loading || perfLoading}
            />
          </div>

          {/* Risk Profile Required Alert */}
          {user && !riskProfile && <div className="mb-12">
              <div className="bg-amber-50/70 dark:bg-amber-950/20 backdrop-blur-xl border border-amber-200/50 dark:border-amber-800/50 rounded-3xl p-8 shadow-xl">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-6">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-2xl bg-amber-100 dark:bg-amber-900/50 flex items-center justify-center">
                      <AlertCircle className="w-6 h-6 text-amber-600 dark:text-amber-400" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-amber-800 dark:text-amber-200 mb-1">
                        {t('portfolio.riskProfileRequired')}
                      </h3>
                      <p className="text-amber-700 dark:text-amber-300">
                        {t('portfolio.riskProfileRequiredDesc')}
                      </p>
                    </div>
                  </div>
                  <Button onClick={() => navigate('/portfolio-advisor')} className="bg-primary hover:bg-primary/90 text-primary-foreground rounded-2xl px-6 py-3 shadow-lg hover:shadow-xl transition-all duration-200">
                    <User className="w-4 h-4 mr-2" />
                    {t('portfolio.createProfile.button')}
                  </Button>
                </div>
              </div>
            </div>}

          <div className="space-y-4 sm:space-y-6 lg:space-y-8">
            <div className="relative bg-white/70 dark:bg-card/70 backdrop-blur-xl border border-border/50 rounded-3xl shadow-xl overflow-hidden">
              <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-primary via-primary to-primary/80"></div>
              <PortfolioOverview portfolio={activePortfolio} onQuickChat={handleQuickChat} onActionClick={handleActionClick} />
            </div>

            <div className="relative bg-white/70 dark:bg-card/70 backdrop-blur-xl border border-border/50 rounded-3xl shadow-xl overflow-hidden">
              <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-primary via-primary to-primary/80"></div>
              <CommunityRecommendations />
            </div>
          </div>
        </div>
      </div>

      {/* Floating Action Button */}
      <FloatingActionButton />
    </Layout>;
};
export default PortfolioImplementation;