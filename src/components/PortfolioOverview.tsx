import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { TrendingUp, TrendingDown, BarChart3, Activity, Target, Zap, Brain, AlertTriangle, Shield, Info, User, Globe, Building2, LogIn } from 'lucide-react';
import { useUserHoldings } from '@/hooks/useUserHoldings';
import { usePortfolioInsights } from '@/hooks/usePortfolioInsights';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import EditHoldingDialog from './EditHoldingDialog';
import UserHoldingsManager from './UserHoldingsManager';
import AIRecommendations from './AIRecommendations';
import { resolveHoldingValue } from '@/utils/currencyUtils';
interface PortfolioOverviewProps {
  portfolio: any;
  onQuickChat?: (message: string) => void;
  onActionClick?: (action: string) => void;
}
const PortfolioOverview: React.FC<PortfolioOverviewProps> = ({
  portfolio: _portfolio,
  onQuickChat,
  onActionClick
}) => {
  const {
    actualHoldings,
    updateHolding,
    refetch
  } = useUserHoldings();
  const {
    insights,
    loading: insightsLoading,
    markAsRead
  } = usePortfolioInsights();
  const {
    user
  } = useAuth();
  const {
    toast
  } = useToast();
  const navigate = useNavigate();
  const [isResetting, setIsResetting] = useState(false);
  const [editHoldingDialogOpen, setEditHoldingDialogOpen] = useState(false);
  const [selectedHolding, setSelectedHolding] = useState<any>(null);

  // Calculate portfolio exposure data
  const calculateExposureData = () => {
    const allHoldings = [...actualHoldings];

    const sectorExposure: { [key: string]: number } = {};
    const marketExposure: { [key: string]: number } = {};
    allHoldings.forEach(holding => {
      const { valueInSEK } = resolveHoldingValue(holding);
      const value = valueInSEK || (holding.purchase_price && holding.quantity
        ? holding.purchase_price * holding.quantity
        : 0);

      const sector = holding.sector || 'Övrigt';
      sectorExposure[sector] = (sectorExposure[sector] || 0) + value;

      let market = 'Sverige';
      if (holding.currency === 'USD') market = 'USA';
      else if (holding.currency === 'EUR') market = 'Europa';
      else if (holding.market) market = holding.market;
      marketExposure[market] = (marketExposure[market] || 0) + value;
    });

    const totalValue = Object.values(sectorExposure).reduce((sum, val) => sum + val, 0);
    const sectorData = Object.entries(sectorExposure).map(([sector, value]) => ({
      name: sector,
      value,
      percentage: totalValue > 0 ? Math.round((value / totalValue) * 100) : 0
    })).sort((a, b) => b.value - a.value);
    const marketData = Object.entries(marketExposure).map(([market, value]) => ({
      name: market,
      value,
      percentage: totalValue > 0 ? Math.round((value / totalValue) * 100) : 0
    })).sort((a, b) => b.value - a.value);
    return { sectorData, marketData, totalValue };
  };
  const exposureData = calculateExposureData();

  // Color palettes for charts

  // Helper function to get insight icon based on type
  const getInsightIcon = (type: string) => {
    switch (type) {
      case 'opportunity':
        return <TrendingUp className="w-4 h-4 text-green-600" />;
      case 'risk_warning':
        return <AlertTriangle className="w-4 h-4 text-yellow-600" />;
      case 'rebalancing':
        return <Target className="w-4 h-4 text-blue-600" />;
      case 'news_impact':
        return <Info className="w-4 h-4 text-purple-600" />;
      default:
        return <Info className="w-4 h-4 text-blue-600" />;
    }
  };

  // Helper function to get insight color based on severity
  const getInsightColor = (severity: string) => {
    switch (severity) {
      case 'critical':
        return 'border-red-200 bg-red-50 dark:border-red-800 dark:bg-red-900/30';
      case 'high':
        return 'border-orange-200 bg-orange-50 dark:border-orange-800 dark:bg-orange-900/30';
      case 'medium':
        return 'border-yellow-200 bg-yellow-50 dark:border-yellow-800 dark:bg-yellow-900/30';
      case 'low':
        return 'border-blue-200 bg-blue-50 dark:border-blue-800 dark:bg-blue-900/30';
      default:
        return 'border-gray-200 bg-gray-50 dark:border-gray-700 dark:bg-gray-900/30';
    }
  };
  const getHoldingTypeColor = (type: string) => {
    const colors = {
      stock: 'bg-blue-100 text-blue-800',
      fund: 'bg-green-100 text-green-800',
      crypto: 'bg-purple-100 text-purple-800',
      bonds: 'bg-yellow-100 text-yellow-800',
      real_estate: 'bg-orange-100 text-orange-800',
      recommendation: 'bg-indigo-100 text-indigo-800',
      other: 'bg-gray-100 text-gray-800'
    };
    return colors[type as keyof typeof colors] || colors.other;
  };
  const getHoldingTypeLabel = (type: string) => {
    const labels = {
      stock: 'Aktie',
      fund: 'Fond',
      crypto: 'Krypto',
      bonds: 'Obligation',
      real_estate: 'Fastighet',
      recommendation: 'AI-Rekommendation',
      other: 'Övrigt'
    };
    return labels[type as keyof typeof labels] || 'Övrigt';
  };
  const handleExamplePrompt = (prompt: string) => {
    const chatTab = document.querySelector('[data-value="chat"]') as HTMLElement;
    if (chatTab) {
      chatTab.click();
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
  const handleQuickAction = (message: string) => {
    // Navigate to AI chat and trigger the pre-filled message
    navigate('/ai-chatt');

    // Small delay to ensure navigation is complete before dispatching event
    setTimeout(() => {
      const event = new CustomEvent('sendExamplePrompt', {
        detail: {
          message
        }
      });
      window.dispatchEvent(event);
    }, 100);
  };
  const handleRebalanceAction = () => {
    handleExamplePrompt('Analysera min nuvarande portfölj och föreslå en rebalanseringsstrategi. Visa vilka aktier jag borde köpa mer av, sälja eller behålla för att optimera min riskjusterade avkastning.');
  };
  const handleInsightAction = (insight: any) => {
    const message = `Berätta mer om denna insikt: ${insight.title}. ${insight.description}`;
    handleExamplePrompt(message);

    // Mark insight as read
    if (!insight.is_read) {
      markAsRead(insight.id);
    }
  };
  const handleResetProfile = async () => {
    if (!user) {
      toast({
        title: "Fel",
        description: "Du måste vara inloggad för att återställa din profil",
        variant: "destructive"
      });
      return;
    }
    setIsResetting(true);
    try {
      // First, clear AI recommendations
      const {
        error: recommendationsError
      } = await supabase.from('user_holdings').delete().eq('user_id', user.id).eq('holding_type', 'recommendation');
      if (recommendationsError) {
        console.error('Error deleting AI recommendations:', recommendationsError);
      }

      // Delete the user's risk profile
      const {
        error: profileError
      } = await supabase.from('user_risk_profiles').delete().eq('user_id', user.id);
      if (profileError) {
        console.error('Error deleting risk profile:', profileError);
        toast({
          title: "Fel",
          description: "Kunde inte återställa profilen. Försök igen senare.",
          variant: "destructive"
        });
        return;
      }

      // Delete the user's portfolio
      const {
        error: portfolioError
      } = await supabase.from('user_portfolios').delete().eq('user_id', user.id);
      if (portfolioError) {
        console.error('Error deleting portfolio:', portfolioError);
        // Don't show error for portfolio deletion as it might not exist
      }
      toast({
        title: "Profil återställd",
        description: "Din riskprofil och AI-rekommendationer har raderats. Du kan nu skapa en ny profil."
      });

      // Navigate to portfolio advisor to start over
      navigate('/portfolio-advisor');
    } catch (error) {
      console.error('Error resetting profile:', error);
      toast({
        title: "Fel",
        description: "Ett oväntat fel uppstod. Försök igen senare.",
        variant: "destructive"
      });
    } finally {
      setIsResetting(false);
    }
  };
  const handleEditHolding = (holding: any) => {
    setSelectedHolding(holding);
    setEditHoldingDialogOpen(true);
  };
  const handleUpdateHolding = async (holdingData: any) => {
    if (!selectedHolding) return;
    const success = await updateHolding(selectedHolding.id, holdingData);
    if (success) {
      toast({
        title: "Innehav uppdaterat",
        description: `${holdingData.name} har uppdaterats.`
      });
      refetch();
    }
  };

  // Show login prompt if user is not authenticated
  if (!user) {
    return <div className="space-y-6">
        {/* User's Current Holdings with integrated prices and cash management */}
        <UserHoldingsManager />

        {/* Sector Exposure - Login Required */}
        <Card className="border border-gray-200 dark:border-gray-700 shadow-sm">
          <CardHeader className="pb-4">
            <CardTitle className="flex items-center gap-2 text-lg font-semibold">
              <Building2 className="w-5 h-5 text-orange-600" />
              Sektorexponering
            </CardTitle>
            <CardDescription className="text-sm text-muted-foreground">
              Fördelning över olika industrisektorer
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-center py-12">
              <LogIn className="w-16 h-16 mx-auto mb-4 opacity-50 text-muted-foreground" />
              <h3 className="text-lg font-medium mb-2 text-foreground">Inloggning krävs</h3>
              <p className="text-sm text-muted-foreground mb-6 max-w-sm mx-auto">
                Logga in för att se din sektorfördelning och portföljanalys
              </p>
              <Button onClick={() => navigate('/auth')} className="bg-primary hover:bg-primary/90">
                <LogIn className="w-4 h-4 mr-2" />
                Logga in
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* AI-Recommended Holdings - Login Required */}
        <Card className="border border-gray-200 dark:border-gray-700 shadow-sm">
          <CardHeader className="pb-4">
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-lg font-semibold flex items-center gap-2">
                  <Brain className="w-5 h-5 text-purple-600" />
                  AI-Rekommenderade Innehav
                </CardTitle>
                <CardDescription className="text-sm text-muted-foreground mt-1">
                  Aktier som AI-advisorn rekommenderar för din portfölj
                </CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-center py-12">
              <LogIn className="w-16 h-16 mx-auto mb-4 opacity-50 text-muted-foreground" />
              <h3 className="text-lg font-medium mb-2 text-foreground">Inloggning krävs</h3>
              <p className="text-sm text-muted-foreground mb-6 max-w-sm mx-auto">
                Logga in för att få personliga AI-rekommendationer för din portfölj
              </p>
              <Button onClick={() => navigate('/auth')} className="bg-primary hover:bg-primary/90">
                <LogIn className="w-4 h-4 mr-2" />
                Logga in
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* AI Insights - Login Required */}
        <Card className="border border-gray-200 dark:border-gray-700 shadow-sm">
          <CardHeader className="pb-4">
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="flex items-center gap-2 text-lg font-semibold">
                  <Brain className="w-5 h-5 text-purple-600" />
                  AI-insikter och rekommendationer
                </CardTitle>
                <CardDescription className="text-sm text-muted-foreground mt-1">
                  Personaliserade förslag baserat på din portfölj och marknadstrender
                </CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-center py-12">
              <LogIn className="w-16 h-16 mx-auto mb-4 opacity-50 text-muted-foreground" />
              <h3 className="text-lg font-medium mb-2 text-foreground">Inloggning krävs</h3>
              <p className="text-sm text-muted-foreground mb-6 max-w-sm mx-auto">
                Logga in för att få personliga AI-insikter och investeringsförslag
              </p>
              <Button onClick={() => navigate('/auth')} className="bg-primary hover:bg-primary/90">
                <LogIn className="w-4 h-4 mr-2" />
                Logga in
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Quick Actions - Login Required */}
        <Card className="border border-gray-200 dark:border-gray-700 shadow-sm">
          <CardHeader className="pb-4">
            <CardTitle className="flex items-center gap-2 text-lg font-semibold">
              <Zap className="w-5 h-5 text-blue-600" />
              Snabbåtgärder för portfölj
            </CardTitle>
            <CardDescription className="text-sm text-muted-foreground mt-1">
              AI-assisterade funktioner för att optimera din portfölj
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-center py-12">
              <LogIn className="w-16 h-16 mx-auto mb-4 opacity-50 text-muted-foreground" />
              <h3 className="text-lg font-medium mb-2 text-foreground">Inloggning krävs</h3>
              <p className="text-sm text-muted-foreground mb-6 max-w-sm mx-auto">
                Logga in för att få tillgång till AI-assisterade portföljfunktioner
              </p>
              <Button onClick={() => navigate('/auth')} className="bg-primary hover:bg-primary/90">
                <LogIn className="w-4 h-4 mr-2" />
                Logga in
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>;
  }
  return (
    <div className="space-y-6">
      <UserHoldingsManager sectorData={exposureData.sectorData} />

      <AIRecommendations />

      {/* Quick Actions - NOW THIRD */}


      {/* Sector Exposure - NOW FOURTH */}


      {/* AI Insights from Database - NOW FIFTH */}
      {insights.length > 0 && <Card className="border border-gray-200 dark:border-gray-700 shadow-sm">
          <CardHeader className="pb-4">
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="flex items-center gap-2 text-lg font-semibold">
                  <Brain className="w-5 h-5 text-purple-600" />
                  AI-insikter och rekommendationer
                  <Badge variant="outline" className="bg-purple-50 text-purple-700 border-purple-200 ml-2">
                    {insights.filter(i => !i.is_read).length} nya
                  </Badge>
                </CardTitle>
                <CardDescription className="text-sm text-muted-foreground mt-1">
                  Personaliserade förslag baserat på din portfölj och marknadstrender
                </CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {insights.slice(0, 5).map(insight => <div key={insight.id} className={`p-4 rounded-lg border cursor-pointer transition-colors hover:bg-muted/50 ${getInsightColor(insight.severity)} ${!insight.is_read ? 'ring-2 ring-purple-200' : ''}`} onClick={() => handleInsightAction(insight)}>
                  <div className="flex items-start gap-3">
                    {getInsightIcon(insight.insight_type)}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <h4 className="font-medium text-sm">{insight.title}</h4>
                        {!insight.is_read && <Badge variant="secondary" className="text-xs">
                            Ny
                          </Badge>}
                        <Badge variant="outline" className="text-xs">
                          {insight.severity}
                        </Badge>
                      </div>
                      <p className="text-xs text-muted-foreground leading-relaxed">
                        {insight.description}
                      </p>
                      {insight.action_required && <div className="mt-2">
                          <Badge variant="destructive" className="text-xs">
                            Åtgärd krävs
                          </Badge>
                        </div>}
                    </div>
                  </div>
                </div>)}
            </div>
          </CardContent>
        </Card>}

      {/* Edit Holding Dialog */}
      <EditHoldingDialog isOpen={editHoldingDialogOpen} onClose={() => setEditHoldingDialogOpen(false)} onSave={handleUpdateHolding} holding={selectedHolding} />
    </div>
  );
};

export default PortfolioOverview;
