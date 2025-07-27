import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Layout from '@/components/Layout';
import { useAuth } from '@/contexts/AuthContext';
import EnhancedProfileHeader from '@/components/EnhancedProfileHeader';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import UserStockCasesSection from '@/components/UserStockCasesSection';
import UserAnalysesSection from '@/components/UserAnalysesSection';
import ActivitySection from '@/components/ActivitySection';
import SavedOpportunitiesSection from '@/components/SavedOpportunitiesSection';
import EditProfileDialog from '@/components/EditProfileDialog';
import PortfolioOverview from '@/components/PortfolioOverview';
import PortfolioHealthScore from '@/components/PortfolioHealthScore';
import PortfolioValueCards from '@/components/PortfolioValueCards';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { BarChart3, TrendingUp, Activity, Bookmark, User, MessageSquare, Brain, Target } from 'lucide-react';
import { useEnhancedUserStats } from '@/hooks/useEnhancedUserStats';
import { useSavedOpportunities } from '@/hooks/useSavedOpportunities';
import { usePortfolio } from '@/hooks/usePortfolio';
import { useUserHoldings } from '@/hooks/useUserHoldings';
import { usePortfolioPerformance } from '@/hooks/usePortfolioPerformance';
import { useCashHoldings } from '@/hooks/useCashHoldings';

const Profile = () => {
  const { user, loading } = useAuth();
  const navigate = useNavigate();
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const { stats } = useEnhancedUserStats();
  const { savedItems, removeOpportunity } = useSavedOpportunities();
  const { activePortfolio } = usePortfolio();
  const { actualHoldings } = useUserHoldings();
  const { performance } = usePortfolioPerformance();
  const { totalCash } = useCashHoldings();

  const transformedOpportunities = savedItems.map(item => ({
    id: item.id,
    type: item.item_type,
    title: item.stock_cases?.title || item.analyses?.title || 'Unknown',
    description: item.stock_cases?.description || item.analyses?.content?.substring(0, 150) || '',
    company_name: item.stock_cases?.company_name || '',
    sector: item.stock_cases?.sector || '',
    created_at: item.created_at,
    ai_generated: item.analyses?.ai_generated || false
  }));

  // Portfolio calculations
  const totalPortfolioValue = performance.totalPortfolioValue + totalCash;
  const investedValue = performance.totalValue;
  const hasPortfolio = !!activePortfolio;

  // Calculate portfolio health metrics
  const calculateHealthMetrics = () => {
    const totalHoldings = actualHoldings ? actualHoldings.length : 0;
    const uniqueSectors = actualHoldings && actualHoldings.length > 0 
      ? new Set(actualHoldings.filter(h => h.sector).map(h => h.sector)).size 
      : 0;
    
    return {
      diversificationScore: Math.min(100, (uniqueSectors / Math.max(1, totalHoldings)) * 100 + 20),
      riskScore: Math.max(20, 100 - (totalCash / Math.max(1, totalPortfolioValue)) * 200),
      performanceScore: 75,
      cashPercentage: totalPortfolioValue > 0 ? (totalCash / totalPortfolioValue) * 100 : 0
    };
  };

  const healthMetrics = calculateHealthMetrics();

  const handleQuickChat = (message: string) => {
    if (message.startsWith('NEW_SESSION:')) {
      const [, sessionName, actualMessage] = message.split(':');
      navigate('/ai-chat', {
        state: { createNewSession: true, sessionName, initialMessage: actualMessage }
      });
    } else {
      navigate('/ai-chat');
    }
  };

  const handleActionClick = (action: string) => {
    console.log('Action clicked:', action);
  };

  const handleViewOpportunity = (opportunity: any) => {
    if (opportunity.item_type === 'stock_case') {
      navigate(`/stock-cases/${opportunity.item_id}`);
    } else if (opportunity.item_type === 'analysis') {
      navigate(`/analyses/${opportunity.item_id}`);
    }
  };

  const handleProfileSaved = () => {
    window.location.reload();
  };

  if (loading) {
    return (
      <Layout>
        <div className="min-h-screen flex items-center justify-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        </div>
      </Layout>
    );
  }

  if (!user) {
    navigate('/auth');
    return null;
  }

  return (
    <Layout>
      <div className="min-h-screen bg-gradient-to-br from-background via-background to-primary/5">
        <div className="container mx-auto px-4 py-6 max-w-7xl">
          <EnhancedProfileHeader 
            profileData={user}
            isOwnProfile={true}
            onEditClick={() => setIsEditDialogOpen(true)}
            userStats={stats}
          />
          
          {/* Portfolio Section - Central Focus */}
          {hasPortfolio && (
            <div className="mt-8 space-y-6">
              <div className="flex items-center justify-between">
                <h2 className="text-2xl font-bold text-foreground flex items-center gap-2">
                  <BarChart3 className="w-6 h-6 text-primary" />
                  Min Portfölj
                </h2>
                <div className="flex gap-2">
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={() => handleQuickChat('NEW_SESSION:Portföljanalys:Analysera min nuvarande portfölj och ge förslag på förbättringar')}
                  >
                    <Brain className="w-4 h-4 mr-2" />
                    AI-analys
                  </Button>
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={() => navigate('/stock-cases')}
                  >
                    <Target className="w-4 h-4 mr-2" />
                    Hitta investeringar
                  </Button>
                </div>
              </div>

              {/* Portfolio Health Score */}
              <PortfolioHealthScore
                totalValue={totalPortfolioValue}
                diversificationScore={healthMetrics.diversificationScore}
                riskScore={healthMetrics.riskScore}
                performanceScore={healthMetrics.performanceScore}
                cashPercentage={healthMetrics.cashPercentage}
              />

              {/* Portfolio Value Cards */}
              <PortfolioValueCards
                totalPortfolioValue={totalPortfolioValue}
                totalInvestedValue={investedValue}
                totalCashValue={totalCash}
                loading={false}
              />

              {/* Portfolio Overview */}
              <PortfolioOverview 
                portfolio={activePortfolio}
                onQuickChat={handleQuickChat}
                onActionClick={handleActionClick}
              />
            </div>
          )}

          {/* No Portfolio CTA */}
          {!hasPortfolio && (
            <div className="mt-8">
              <Card className="bg-gradient-to-r from-primary/10 via-primary/5 to-transparent border border-primary/20">
                <CardContent className="p-8 text-center">
                  <div className="w-16 h-16 rounded-full bg-primary/20 flex items-center justify-center mx-auto mb-4">
                    <BarChart3 className="w-8 h-8 text-primary" />
                  </div>
                  <h3 className="text-xl font-semibold mb-2">Skapa din första portfölj</h3>
                  <p className="text-muted-foreground mb-6 max-w-md mx-auto">
                    Få AI-drivna rekommendationer och bygg en portfölj som passar dina mål och riskprofil.
                  </p>
                  <Button asChild size="lg" className="bg-primary hover:bg-primary/90">
                    <a href="/portfolio-advisor">
                      Skapa portfölj nu
                    </a>
                  </Button>
                </CardContent>
              </Card>
            </div>
          )}
          
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mt-8">
            {/* Left Sidebar - Simplified */}
            <div className="lg:col-span-1 space-y-6">
              {/* Quick Actions */}
              <Card>
                <CardContent className="p-6">
                  <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                    <MessageSquare className="w-5 h-5 text-primary" />
                    Förbättra portfölj
                  </h3>
                  <div className="space-y-3">
                    <Button 
                      variant="outline" 
                      className="w-full justify-start"
                      onClick={() => handleQuickChat('NEW_SESSION:Investeringsråd:Ge mig förslag på nya investeringar baserat på min riskprofil')}
                    >
                      <Brain className="w-4 h-4 mr-2" />
                      AI-rekommendationer
                    </Button>
                    <Button 
                      variant="outline" 
                      className="w-full justify-start"
                      onClick={() => navigate('/stock-cases')}
                    >
                      <TrendingUp className="w-4 h-4 mr-2" />
                      Upptäck aktier
                    </Button>
                    <Button 
                      variant="outline" 
                      className="w-full justify-start"
                      onClick={() => setIsEditDialogOpen(true)}
                    >
                      <User className="w-4 h-4 mr-2" />
                      Redigera profil
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </div>
            
            {/* Main Content - Simplified Tabs */}
            <div className="lg:col-span-2">
              <Tabs defaultValue="content" className="w-full">
                <TabsList className="grid w-full grid-cols-3 mb-6">
                  <TabsTrigger value="content" className="flex items-center gap-2">
                    <TrendingUp className="w-4 h-4" />
                    Innehåll
                  </TabsTrigger>
                  <TabsTrigger value="activity" className="flex items-center gap-2">
                    <Activity className="w-4 h-4" />
                    Aktivitet
                  </TabsTrigger>
                  <TabsTrigger value="saved" className="flex items-center gap-2">
                    <Bookmark className="w-4 h-4" />
                    Sparade
                  </TabsTrigger>
                </TabsList>
                
                <TabsContent value="content" className="space-y-6">
                  <UserStockCasesSection />
                  <UserAnalysesSection />
                </TabsContent>
                
                <TabsContent value="activity">
                  <ActivitySection />
                </TabsContent>
                
                <TabsContent value="saved">
                  <SavedOpportunitiesSection 
                    opportunities={transformedOpportunities}
                    onRemove={removeOpportunity}
                    onView={handleViewOpportunity}
                  />
                </TabsContent>
              </Tabs>
            </div>
          </div>
        </div>
      </div>
      
      <EditProfileDialog 
        open={isEditDialogOpen}
        onOpenChange={setIsEditDialogOpen}
        currentName={user?.email || ''}
        userId={user?.id || ''}
        profileData={user}
        onSaved={handleProfileSaved}
      />
    </Layout>
  );
};

export default Profile;