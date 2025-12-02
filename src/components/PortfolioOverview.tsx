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
import { formatCurrency } from '@/utils/currencyUtils';
interface PortfolioOverviewProps {
  portfolio: any;
  onQuickChat?: (message: string) => void;
  onActionClick?: (action: string) => void;
  importControls?: React.ReactNode;
}
const PortfolioOverview: React.FC<PortfolioOverviewProps> = ({
  portfolio: _portfolio,
  onQuickChat,
  onActionClick,
  importControls
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
        return 'border-red-200 bg-red-50';
      case 'high':
        return 'border-orange-200 bg-orange-50';
      case 'medium':
        return 'border-yellow-200 bg-yellow-50';
      case 'low':
        return 'border-blue-200 bg-blue-50';
      default:
        return 'border-gray-200 bg-gray-50';
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
    return <div className="space-y-4 sm:space-y-6">
        {/* User's Current Holdings with integrated prices and cash management */}
        <UserHoldingsManager importControls={importControls} />

        {/* Sector Exposure - Login Required */}
        <Card className="border border-gray-200 dark:border-gray-700 shadow-sm rounded-lg sm:rounded-xl">
          <CardHeader className="pb-3 sm:pb-4 p-4 sm:p-6">
            <CardTitle className="flex items-center gap-2 text-base sm:text-lg font-semibold">
              <Building2 className="w-4 h-4 sm:w-5 sm:h-5 text-orange-600 flex-shrink-0" />
              <span className="break-words">Sektorexponering</span>
            </CardTitle>
            <CardDescription className="text-xs sm:text-sm text-muted-foreground">
              Fördelning över olika industrisektorer
            </CardDescription>
          </CardHeader>
          <CardContent className="p-4 sm:p-6 pt-0">
            <div className="text-center py-8 sm:py-12">
              <LogIn className="w-12 h-12 sm:w-16 sm:h-16 mx-auto mb-3 sm:mb-4 opacity-50 text-muted-foreground" />
              <h3 className="text-base sm:text-lg font-medium mb-2 text-foreground">Inloggning krävs</h3>
              <p className="text-xs sm:text-sm text-muted-foreground mb-4 sm:mb-6 max-w-sm mx-auto px-2">
                Logga in för att se din sektorfördelning och portföljanalys
              </p>
              <Button onClick={() => navigate('/auth')} className="bg-primary hover:bg-primary/90 text-xs sm:text-sm w-full sm:w-auto">
                <LogIn className="w-3.5 h-3.5 sm:w-4 sm:h-4 mr-1.5 sm:mr-2" />
                Logga in
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* AI-Recommended Holdings - Login Required */}
        <Card className="border border-gray-200 dark:border-gray-700 shadow-sm rounded-lg sm:rounded-xl">
          <CardHeader className="pb-3 sm:pb-4 p-4 sm:p-6">
            <div className="flex items-center justify-between">
              <div className="min-w-0 flex-1">
                <CardTitle className="text-base sm:text-lg font-semibold flex items-center gap-2">
                  <Brain className="w-4 h-4 sm:w-5 sm:h-5 text-purple-600 flex-shrink-0" />
                  <span className="break-words">AI-Rekommenderade Innehav</span>
                </CardTitle>
                <CardDescription className="text-xs sm:text-sm text-muted-foreground mt-1">
                  Aktier som AI-advisorn rekommenderar för din portfölj
                </CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="p-4 sm:p-6 pt-0">
            <div className="text-center py-8 sm:py-12">
              <LogIn className="w-12 h-12 sm:w-16 sm:h-16 mx-auto mb-3 sm:mb-4 opacity-50 text-muted-foreground" />
              <h3 className="text-base sm:text-lg font-medium mb-2 text-foreground">Inloggning krävs</h3>
              <p className="text-xs sm:text-sm text-muted-foreground mb-4 sm:mb-6 max-w-sm mx-auto px-2">
                Logga in för att få personliga AI-rekommendationer för din portfölj
              </p>
              <Button onClick={() => navigate('/auth')} className="bg-primary hover:bg-primary/90 text-xs sm:text-sm w-full sm:w-auto">
                <LogIn className="w-3.5 h-3.5 sm:w-4 sm:h-4 mr-1.5 sm:mr-2" />
                Logga in
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* AI Insights - Login Required */}
        <Card className="border border-gray-200 dark:border-gray-700 shadow-sm rounded-lg sm:rounded-xl">
          <CardHeader className="pb-3 sm:pb-4 p-4 sm:p-6">
            <div className="flex items-center justify-between">
              <div className="min-w-0 flex-1">
                <CardTitle className="flex items-center gap-2 text-base sm:text-lg font-semibold">
                  <Brain className="w-4 h-4 sm:w-5 sm:h-5 text-purple-600 flex-shrink-0" />
                  <span className="break-words">AI-insikter och rekommendationer</span>
                </CardTitle>
                <CardDescription className="text-xs sm:text-sm text-muted-foreground mt-1">
                  Personaliserade förslag baserat på din portfölj och marknadstrender
                </CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="p-4 sm:p-6 pt-0">
            <div className="text-center py-8 sm:py-12">
              <LogIn className="w-12 h-12 sm:w-16 sm:h-16 mx-auto mb-3 sm:mb-4 opacity-50 text-muted-foreground" />
              <h3 className="text-base sm:text-lg font-medium mb-2 text-foreground">Inloggning krävs</h3>
              <p className="text-xs sm:text-sm text-muted-foreground mb-4 sm:mb-6 max-w-sm mx-auto px-2">
                Logga in för att få personliga AI-insikter och investeringsförslag
              </p>
              <Button onClick={() => navigate('/auth')} className="bg-primary hover:bg-primary/90 text-xs sm:text-sm w-full sm:w-auto">
                <LogIn className="w-3.5 h-3.5 sm:w-4 sm:h-4 mr-1.5 sm:mr-2" />
                Logga in
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Quick Actions - Login Required */}
        <Card className="border border-gray-200 dark:border-gray-700 shadow-sm rounded-lg sm:rounded-xl">
          <CardHeader className="pb-3 sm:pb-4 p-4 sm:p-6">
            <CardTitle className="flex items-center gap-2 text-base sm:text-lg font-semibold">
              <Zap className="w-4 h-4 sm:w-5 sm:h-5 text-blue-600 flex-shrink-0" />
              <span className="break-words">Snabbåtgärder för portfölj</span>
            </CardTitle>
            <CardDescription className="text-xs sm:text-sm text-muted-foreground mt-1">
              AI-assisterade funktioner för att optimera din portfölj
            </CardDescription>
          </CardHeader>
          <CardContent className="p-4 sm:p-6 pt-0">
            <div className="text-center py-8 sm:py-12">
              <LogIn className="w-12 h-12 sm:w-16 sm:h-16 mx-auto mb-3 sm:mb-4 opacity-50 text-muted-foreground" />
              <h3 className="text-base sm:text-lg font-medium mb-2 text-foreground">Inloggning krävs</h3>
              <p className="text-xs sm:text-sm text-muted-foreground mb-4 sm:mb-6 max-w-sm mx-auto px-2">
                Logga in för att få tillgång till AI-assisterade portföljfunktioner
              </p>
              <Button onClick={() => navigate('/auth')} className="bg-primary hover:bg-primary/90 text-xs sm:text-sm w-full sm:w-auto">
                <LogIn className="w-3.5 h-3.5 sm:w-4 sm:h-4 mr-1.5 sm:mr-2" />
                Logga in
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>;
  }
  const formatPercent = (value: number) => `${value.toFixed(2)}%`;

  const formatDailyChangeValue = (value: number | null | undefined) => {
    if (value === null || value === undefined) return '–';
    const prefix = value > 0 ? '+' : '';
    return `${prefix}${formatCurrency(value, 'SEK')}`;
  };

  const sortableHoldings = actualHoldings.filter(holding =>
    holding.holding_type !== 'recommendation' && holding.dailyChangePercent !== null && holding.dailyChangePercent !== undefined
  );

  const bestHoldings = [...sortableHoldings]
    .sort((a, b) => (b.dailyChangePercent ?? 0) - (a.dailyChangePercent ?? 0))
    .slice(0, 3);

  const worstHoldings = [...sortableHoldings]
    .sort((a, b) => (a.dailyChangePercent ?? 0) - (b.dailyChangePercent ?? 0))
    .slice(0, 3);

  return (
    <div className="space-y-4 sm:space-y-6 p-3 sm:p-4 md:p-6">
      <Card className="border border-gray-200/80 dark:border-gray-800 bg-white/70 dark:bg-gray-900/70 shadow-sm rounded-lg sm:rounded-xl">
        <CardHeader className="pb-3 sm:pb-4 p-4 sm:p-6 border-b border-border/60">
          <CardTitle className="flex items-center gap-2 text-base sm:text-lg font-semibold text-foreground">
            <Activity className="w-4 h-4 sm:w-5 sm:h-5 text-green-600 flex-shrink-0" />
            <span className="break-words">Dagens toppar och bottnar</span>
          </CardTitle>
          <CardDescription className="text-xs sm:text-sm text-muted-foreground mt-1">
            Tre bästa och sämsta innehaven idag baserat på daglig förändring
          </CardDescription>
        </CardHeader>
        <CardContent className="p-4 sm:p-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
            {[{
              title: 'Bästa innehav idag',
              icon: <TrendingUp className="w-4 h-4" />,
              items: bestHoldings,
              wrapperClasses: 'bg-emerald-50/80 dark:bg-emerald-950/40 border-emerald-100/80 dark:border-emerald-900/50',
              iconClasses: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/50 dark:text-emerald-200'
            }, {
              title: 'Sämsta innehav idag',
              icon: <TrendingDown className="w-4 h-4" />,
              items: worstHoldings,
              wrapperClasses: 'bg-rose-50/80 dark:bg-rose-950/40 border-rose-100/80 dark:border-rose-900/50',
              iconClasses: 'bg-rose-100 text-rose-700 dark:bg-rose-900/50 dark:text-rose-200'
            }].map((section) => (
              <div
                key={section.title}
                className={`rounded-xl border shadow-sm p-4 sm:p-5 flex flex-col gap-3 bg-gradient-to-br from-white/60 via-white to-white dark:from-gray-950/60 dark:via-gray-950 dark:to-gray-950 ${section.wrapperClasses}`}
              >
                <div className="flex items-center gap-2">
                  <div className={`rounded-full p-2 ${section.iconClasses}`}>
                    {section.icon}
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-foreground">{section.title}</p>
                    <p className="text-xs text-muted-foreground">Sorterade på dagens procentuella utveckling</p>
                  </div>
                </div>
                {section.items.length > 0 ? (
                  <div className="space-y-2.5">
                    {section.items.map((holding) => (
                      <div
                        key={holding.id}
                        className="flex items-center justify-between gap-3 rounded-lg border border-border/60 bg-background/40 dark:bg-gray-900/60 px-3 py-2.5"
                      >
                        <div className="min-w-0">
                          <p className="text-sm font-medium text-foreground truncate">{holding.name || holding.symbol || 'Innehav'}</p>
                          {holding.symbol && <p className="text-xs text-muted-foreground uppercase tracking-wide">{holding.symbol}</p>}
                        </div>
                        <div className="text-right">
                          <div
                            className={`text-sm font-semibold ${
                              (holding.dailyChangePercent ?? 0) > 0
                                ? 'text-emerald-600'
                                : (holding.dailyChangePercent ?? 0) < 0
                                  ? 'text-rose-600'
                                  : 'text-muted-foreground'
                            }`}
                          >
                            {holding.dailyChangePercent !== null && holding.dailyChangePercent !== undefined ? (
                              <>
                                {holding.dailyChangePercent > 0 ? '+' : ''}
                                {formatPercent(holding.dailyChangePercent)}
                              </>
                            ) : (
                              'Ingen dagsdata'
                            )}
                          </div>
                          <p className="text-xs text-muted-foreground">
                            {formatDailyChangeValue(holding.dailyChangeValueSEK)}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-muted-foreground">Ingen dagsdata att visa ännu.</p>
                )}
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      <UserHoldingsManager importControls={importControls} />

      <AIRecommendations />

      {/* Quick Actions - NOW THIRD */}


      {/* Sector Exposure - NOW FOURTH */}


      {/* AI Insights from Database - NOW FIFTH */}
      {insights.length > 0 && <Card className="border border-gray-200 dark:border-gray-700 shadow-sm rounded-lg sm:rounded-xl">
          <CardHeader className="pb-3 sm:pb-4 p-4 sm:p-6">
            <div className="flex items-center justify-between">
              <div className="min-w-0 flex-1">
                <CardTitle className="flex flex-wrap items-center gap-2 text-base sm:text-lg font-semibold">
                  <Brain className="w-4 h-4 sm:w-5 sm:h-5 text-purple-600 flex-shrink-0" />
                  <span className="break-words">AI-insikter och rekommendationer</span>
                  <Badge variant="outline" className="bg-purple-50 text-purple-700 border-purple-200 text-[10px] xs:text-xs">
                    {insights.filter(i => !i.is_read).length} nya
                  </Badge>
                </CardTitle>
                <CardDescription className="text-xs sm:text-sm text-muted-foreground mt-1">
                  Personaliserade förslag baserat på din portfölj och marknadstrender
                </CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="p-4 sm:p-6 pt-0">
            <div className="space-y-3 sm:space-y-4">
              {insights.slice(0, 5).map(insight => <div key={insight.id} className={`p-3 sm:p-4 rounded-lg border cursor-pointer transition-colors hover:bg-muted/50 ${getInsightColor(insight.severity)} ${!insight.is_read ? 'ring-2 ring-purple-200' : ''}`} onClick={() => handleInsightAction(insight)}>
                  <div className="flex items-start gap-2 sm:gap-3">
                    <div className="flex-shrink-0 mt-0.5">{getInsightIcon(insight.insight_type)}</div>
                    <div className="flex-1 min-w-0">
                      <div className="flex flex-wrap items-center gap-1.5 sm:gap-2 mb-1">
                        <h4 className="font-medium text-xs sm:text-sm break-words">{insight.title}</h4>
                        {!insight.is_read && <Badge variant="secondary" className="text-[10px] xs:text-xs">
                            Ny
                          </Badge>}
                        <Badge variant="outline" className="text-[10px] xs:text-xs">
                          {insight.severity}
                        </Badge>
                      </div>
                      <p className="text-[10px] xs:text-xs text-muted-foreground leading-relaxed break-words">
                        {insight.description}
                      </p>
                      {insight.action_required && <div className="mt-2">
                          <Badge variant="destructive" className="text-[10px] xs:text-xs">
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
